'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type Currency = 'GBP' | 'EUR' | 'USD' | 'NOK';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
  NOK: 'kr',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  GBP: 'GBP £',
  EUR: 'EUR €',
  USD: 'USD $',
  NOK: 'NOK kr',
};

// Fallback rates (GBP base) — used until live rates are loaded
const FALLBACK_RATES: Record<Currency, number> = {
  GBP: 1,
  EUR: 1.17,
  USD: 1.27,
  NOK: 13.8,
};

// Minimum poll interval to avoid hammering the API (5 minutes)
const MIN_POLL_MS = 5 * 60 * 1000;

const CURRENCY_STORAGE_KEY = 'detara-currency';

interface RoundingSettings {
  mode: 'round' | 'floor' | 'ceil';
  precision: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Convert a GBP amount to the selected currency using live rates and rounding settings */
  convertFromGbp: (gbpAmount: number) => number;
  /** Format a GBP amount as a display string in the selected currency */
  formatPrice: (gbpAmount: number) => string;
  /** @deprecated Use convertFromGbp instead */
  convertPrice: (gbpAmount: number) => number;
  rates: Record<Currency, number>;
  ratesLoaded: boolean;
  rounding: RoundingSettings;
  lastRefreshAt: string | null;
  nextRefreshAt: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('GBP');
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [rounding, setRounding] = useState<RoundingSettings>({ mode: 'round', precision: 0 });
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [nextRefreshAt, setNextRefreshAt] = useState<string | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);

  // Restore persisted currency on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null;
      if (saved && ['GBP', 'EUR', 'USD', 'NOK'].includes(saved)) {
        setCurrencyState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  /**
   * Fetch rates from the public /api/exchange-rates endpoint (reads from Supabase cache).
   * Does NOT call the FX API directly — that is handled by /api/cron/refresh-exchange-rates.
   */
  const fetchRates = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/exchange-rates', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();

      if (json.rates && typeof json.rates === 'object') {
        setRates((prev) => ({ ...prev, ...json.rates }));
        setRatesLoaded(true);
      }
      if (json.rounding_mode) {
        setRounding({
          mode: json.rounding_mode as 'round' | 'floor' | 'ceil',
          precision: json.rounding_precision ?? 0,
        });
      }
      if (json.last_refresh_at) setLastRefreshAt(json.last_refresh_at);
      if (json.next_refresh_at) setNextRefreshAt(json.next_refresh_at);
      if (json.interval_minutes) setIntervalMinutes(json.interval_minutes);
    } catch {
      // Use fallback rates silently
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  /**
   * Trigger the cron endpoint to refresh rates from the live FX API if the
   * configured interval has elapsed. The cron route handles the interval check
   * server-side, so this is safe to call on every poll cycle.
   */
  const triggerCronRefresh = useCallback(async () => {
    try {
      await fetch('/api/cron/refresh-exchange-rates', { cache: 'no-store' });
      // After triggering, re-fetch the updated rates from DB
      await fetchRates();
    } catch {
      // Silent — storefront continues with cached rates
    }
  }, [fetchRates]);

  /**
   * Schedule the next poll based on next_refresh_at.
   * Uses the configured interval but enforces a minimum of MIN_POLL_MS.
   */
  const schedulePoll = useCallback((nextAt: string | null, intervalMins: number) => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    let delayMs: number;
    if (nextAt) {
      const msUntilNext = new Date(nextAt).getTime() - Date.now();
      delayMs = Math.max(msUntilNext, MIN_POLL_MS);
    } else {
      delayMs = Math.max(intervalMins * 60 * 1000, MIN_POLL_MS);
    }

    pollTimerRef.current = setTimeout(async () => {
      await triggerCronRefresh();
    }, delayMs);
  }, [triggerCronRefresh]);

  // Initial load on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      await fetchRates();
      if (cancelled) return;
      // Also trigger cron check on mount — the server will skip if interval hasn't elapsed
      await triggerCronRefresh();
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-schedule poll whenever next_refresh_at or interval changes
  useEffect(() => {
    schedulePoll(nextRefreshAt, intervalMinutes);
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [nextRefreshAt, intervalMinutes, schedulePoll]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {
      // ignore
    }
  }, []);

  const convertFromGbp = useCallback((gbpAmount: number): number => {
    const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
    const raw = gbpAmount * rate;
    const factor = Math.pow(10, rounding.precision);
    if (rounding.mode === 'floor') return Math.floor(raw * factor) / factor;
    if (rounding.mode === 'ceil') return Math.ceil(raw * factor) / factor;
    return Math.round(raw * factor) / factor;
  }, [currency, rates, rounding]);

  const formatPrice = useCallback((gbpAmount: number): string => {
    const converted = convertFromGbp(gbpAmount);
    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: rounding.precision,
      maximumFractionDigits: rounding.precision,
    });
    if (currency === 'EUR') return `€${formatted}`;
    if (currency === 'USD') return `$${formatted}`;
    if (currency === 'GBP') return `£${formatted}`;
    if (currency === 'NOK') return `${formatted} kr`;
    return `${currency} ${formatted}`;
  }, [currency, convertFromGbp, rounding.precision]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      convertFromGbp,
      formatPrice,
      convertPrice: convertFromGbp, // backward compat
      rates,
      ratesLoaded,
      rounding,
      lastRefreshAt,
      nextRefreshAt,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export { CurrencyContext };

// CURRENCIES array — GBP, EUR, USD, NOK only (as per business requirements)
export const CURRENCIES = [
  { code: 'GBP' as Currency, symbol: '£', label: 'GBP £' },
  { code: 'EUR' as Currency, symbol: '€', label: 'EUR €' },
  { code: 'USD' as Currency, symbol: '$', label: 'USD $' },
  { code: 'NOK' as Currency, symbol: 'kr', label: 'NOK kr' },
];
