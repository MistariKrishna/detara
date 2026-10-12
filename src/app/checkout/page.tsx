'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { trackPurchase } from '@/lib/analytics';
import { getStripe } from '@/lib/stripe/client';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { PaymentIntent } from '@stripe/stripe-js';

type Step = 1 | 2 | 3 | 4;
type PaymentMethod = 'bank_transfer' | 'manual' | 'stripe';

const steps = [
  { num: 1, label: 'Details' },
  { num: 2, label: 'Shipping' },
  { num: 3, label: 'Payment' },
  { num: 4, label: 'Review' },
];

// Full international country list
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
  'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
  'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',
  'Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt',
  'El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon',
  'Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
  'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel',
  'Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos',
  'Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi',
  'Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova',
  'Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands',
  'New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau',
  'Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino',
  'Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia',
  'Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan',
  'Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo',
  'Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen',
  'Zambia','Zimbabwe',
];

// ISO 3166-1 alpha-2 country code map (required by Stripe for payment methods like Klarna)
const COUNTRY_ISO_CODES: Record<string, string> = {
  'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Andorra': 'AD', 'Angola': 'AO',
  'Antigua and Barbuda': 'AG', 'Argentina': 'AR', 'Armenia': 'AM', 'Australia': 'AU', 'Austria': 'AT',
  'Azerbaijan': 'AZ', 'Bahamas': 'BS', 'Bahrain': 'BH', 'Bangladesh': 'BD', 'Barbados': 'BB',
  'Belarus': 'BY', 'Belgium': 'BE', 'Belize': 'BZ', 'Benin': 'BJ', 'Bhutan': 'BT',
  'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Botswana': 'BW', 'Brazil': 'BR', 'Brunei': 'BN',
  'Bulgaria': 'BG', 'Burkina Faso': 'BF', 'Burundi': 'BI', 'Cabo Verde': 'CV', 'Cambodia': 'KH',
  'Cameroon': 'CM', 'Canada': 'CA', 'Central African Republic': 'CF', 'Chad': 'TD', 'Chile': 'CL',
  'China': 'CN', 'Colombia': 'CO', 'Comoros': 'KM', 'Congo': 'CG', 'Costa Rica': 'CR',
  'Croatia': 'HR', 'Cuba': 'CU', 'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Denmark': 'DK',
  'Djibouti': 'DJ', 'Dominica': 'DM', 'Dominican Republic': 'DO', 'Ecuador': 'EC', 'Egypt': 'EG',
  'El Salvador': 'SV', 'Equatorial Guinea': 'GQ', 'Eritrea': 'ER', 'Estonia': 'EE', 'Eswatini': 'SZ',
  'Ethiopia': 'ET', 'Fiji': 'FJ', 'Finland': 'FI', 'France': 'FR', 'Gabon': 'GA',
  'Gambia': 'GM', 'Georgia': 'GE', 'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR',
  'Grenada': 'GD', 'Guatemala': 'GT', 'Guinea': 'GN', 'Guinea-Bissau': 'GW', 'Guyana': 'GY',
  'Haiti': 'HT', 'Honduras': 'HN', 'Hungary': 'HU', 'Iceland': 'IS', 'India': 'IN',
  'Indonesia': 'ID', 'Iran': 'IR', 'Iraq': 'IQ', 'Ireland': 'IE', 'Israel': 'IL',
  'Italy': 'IT', 'Jamaica': 'JM', 'Japan': 'JP', 'Jordan': 'JO', 'Kazakhstan': 'KZ',
  'Kenya': 'KE', 'Kiribati': 'KI', 'Kuwait': 'KW', 'Kyrgyzstan': 'KG', 'Laos': 'LA',
  'Latvia': 'LV', 'Lebanon': 'LB', 'Lesotho': 'LS', 'Liberia': 'LR', 'Libya': 'LY',
  'Liechtenstein': 'LI', 'Lithuania': 'LT', 'Luxembourg': 'LU', 'Madagascar': 'MG', 'Malawi': 'MW',
  'Malaysia': 'MY', 'Maldives': 'MV', 'Mali': 'ML', 'Malta': 'MT', 'Marshall Islands': 'MH',
  'Mauritania': 'MR', 'Mauritius': 'MU', 'Mexico': 'MX', 'Micronesia': 'FM', 'Moldova': 'MD',
  'Monaco': 'MC', 'Mongolia': 'MN', 'Montenegro': 'ME', 'Morocco': 'MA', 'Mozambique': 'MZ',
  'Myanmar': 'MM', 'Namibia': 'NA', 'Nauru': 'NR', 'Nepal': 'NP', 'Netherlands': 'NL',
  'New Zealand': 'NZ', 'Nicaragua': 'NI', 'Niger': 'NE', 'Nigeria': 'NG', 'North Korea': 'KP',
  'North Macedonia': 'MK', 'Norway': 'NO', 'Oman': 'OM', 'Pakistan': 'PK', 'Palau': 'PW',
  'Palestine': 'PS', 'Panama': 'PA', 'Papua New Guinea': 'PG', 'Paraguay': 'PY', 'Peru': 'PE',
  'Philippines': 'PH', 'Poland': 'PL', 'Portugal': 'PT', 'Qatar': 'QA', 'Romania': 'RO',
  'Russia': 'RU', 'Rwanda': 'RW', 'Saint Kitts and Nevis': 'KN', 'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC', 'Samoa': 'WS', 'San Marino': 'SM',
  'Sao Tome and Principe': 'ST', 'Saudi Arabia': 'SA', 'Senegal': 'SN', 'Serbia': 'RS',
  'Seychelles': 'SC', 'Sierra Leone': 'SL', 'Singapore': 'SG', 'Slovakia': 'SK',
  'Slovenia': 'SI', 'Solomon Islands': 'SB', 'Somalia': 'SO', 'South Africa': 'ZA',
  'South Korea': 'KR', 'South Sudan': 'SS', 'Spain': 'ES', 'Sri Lanka': 'LK', 'Sudan': 'SD',
  'Suriname': 'SR', 'Sweden': 'SE', 'Switzerland': 'CH', 'Syria': 'SY', 'Taiwan': 'TW',
  'Tajikistan': 'TJ', 'Tanzania': 'TZ', 'Thailand': 'TH', 'Timor-Leste': 'TL', 'Togo': 'TG',
  'Tonga': 'TO', 'Trinidad and Tobago': 'TT', 'Tunisia': 'TN', 'Turkey': 'TR',
  'Turkmenistan': 'TM', 'Tuvalu': 'TV', 'Uganda': 'UG', 'Ukraine': 'UA',
  'United Arab Emirates': 'AE', 'United Kingdom': 'GB', 'United States': 'US',
  'Uruguay': 'UY', 'Uzbekistan': 'UZ', 'Vanuatu': 'VU', 'Vatican City': 'VA',
  'Venezuela': 'VE', 'Vietnam': 'VN', 'Yemen': 'YE', 'Zambia': 'ZM', 'Zimbabwe': 'ZW',
};

function getCountryIsoCode(countryName: string): string {
  return COUNTRY_ISO_CODES[countryName] || countryName;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Stripe Payment Form ────────────────────────────────────────────────────
interface StripePaymentFormProps {
  clientSecret: string;
  orderNumber: string;
  onSuccess: (paymentIntent: PaymentIntent) => void;
  onError: (msg: string) => void;
  totalPrice: number;
  formatPrice: (n: number) => string;
  billingCountry: string;
}
function StripePaymentForm({
  clientSecret,
  orderNumber,
  onSuccess,
  onError,
  totalPrice,
  formatPrice,
  billingCountry,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!stripe || !elements) return;

  setProcessing(true);
  onError('');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${siteUrl}/order-confirmation?order=${orderNumber}&method=stripe`,
      },
      redirect: 'if_required',
    });

    if (error) {
      console.error('[Checkout] Stripe payment error:', error);
      onError(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent);
      return;
    }

    onError('Payment could not be completed. Please try again.');
    setProcessing(false);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('SecurityError') || errMsg.includes('permission to navigate')) {
      onError('This payment method requires a redirect and cannot be completed in this context. Please use a card payment instead.');
    } else {
      onError('An unexpected error occurred. Please try again.');
    }
    setProcessing(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-5 border border-[rgba(28,25,23,0.12)] bg-bg-warm">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted font-light">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-3.5 h-3.5 text-accent flex-shrink-0"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span>Secured by Stripe · 256-bit SSL encryption</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 px-8 bg-foreground text-[#FAFAF8] text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-accent-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {processing
          ? 'Processing Payment...'
          : `Pay ${formatPrice(totalPrice)}`}
      </button>
    </form>
  );
}

// ─── Main Checkout Page ──────────────────────────────────────────────────────
export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United Kingdom',
  });

  // Stripe state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeOrderNumber, setStripeOrderNumber] = useState<string>('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);

  const { items, totalPrice, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const inputClass =
    'w-full bg-transparent border border-[rgba(28,25,23,0.12)] px-4 py-3.5 text-sm font-light text-foreground placeholder:text-muted focus:outline-none focus:border-foreground transition-colors';
  const inputErrorClass =
    'w-full bg-transparent border border-red-300 px-4 py-3.5 text-sm font-light text-foreground placeholder:text-muted focus:outline-none focus:border-red-400 transition-colors';
  const labelClass = 'label-caps text-muted block mb-2' as const;

  const validateStep1 = (): boolean => {
    const errors: FormErrors = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(form.email)) errors.email = 'Please enter a valid email address';
    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: FormErrors = {};
    if (!form.address.trim()) errors.address = 'Address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.postalCode.trim()) errors.postalCode = 'Postal code is required';
    if (!form.country.trim()) errors.country = 'Country is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Initialize Stripe payment intent when stripe method is selected
  const initStripePayment = useCallback(async () => {
    if (stripeClientSecret || stripeLoading) return;
    setStripeLoading(true);
    setError('');
    try {
      const productName = items?.length > 0
        ? items.map((item) => `${item.name} (${item.carat}, ${item.metal})`).join(', ')
        : 'Custom Order';
      const productConfig = items?.length > 0
        ? items.map((item) => `${item.carat} · ${item.metal} · ${item.origin}`).join('; ')
        : '';

      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice || 0,
          currency: 'gbp',
          customerName: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          productName,
          productConfig,
          quantity: items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1,
          orderItems: items?.map((item) => ({
            id: item.id,
            name: item.name,
            carat: item.carat,
            metal: item.metal,
            origin: item.origin,
            shape: item.shape,
            price: item.price,
            quantity: item.quantity || 1,
            img: item.img,
            ringSize: item.ringSize || undefined,
            braceletLength: item.braceletLength || undefined,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.clientSecret) {
        setError(json.error || 'Failed to initialize payment. Please try again.');
        return;
      }
      setStripeClientSecret(json.clientSecret);
      setStripeOrderNumber(json.orderNumber || '');
      setStripeReady(true);
    } catch (err) {
      console.error('[Checkout] Stripe init error:', err);
      setError('Failed to initialize payment. Please try again.');
    } finally {
      setStripeLoading(false);
    }
  }, [stripeClientSecret, stripeLoading, items, totalPrice, form]);

  // When payment method changes to stripe and we're on step 3, init payment intent
  useEffect(() => {
    if (paymentMethod === 'stripe' && currentStep === 3 && !stripeClientSecret && !stripeLoading) {
      // Only init if step 1 & 2 are valid (form has required fields)
      if (form.firstName && form.email && form.address && form.city) {
        initStripePayment();
      }
    }
  }, [paymentMethod, currentStep, stripeClientSecret, stripeLoading, form.firstName, form.email, form.address, form.city, initStripePayment]);

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((prev) => (prev + 1) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev - 1) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle successful Stripe payment
  const handleStripeSuccess = async (paymentIntent: PaymentIntent) => {
    try {
      trackPurchase({
        orderId: stripeOrderNumber,
        total: totalPrice || 0,
        items: items?.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
        })) || [],
      });
    } catch {
      // Non-critical
    }

    // Send order confirmation email (non-blocking)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            type: 'order_confirmation',
            to: form.email,
            customerName: `${form.firstName} ${form.lastName}`,
            orderNumber: stripeOrderNumber,
            orderItems: items?.map((item) => ({
              name: item.name,
              carat: item.carat,
              metal: item.metal,
              price: item.price,
              quantity: item.quantity || 1,
            })) || [],
            orderTotal: totalPrice || 0,
            shippingAddress: [form.address, form.city, form.postalCode, form.country].filter(Boolean).join(', '),
            paymentMethod: 'stripe',
          }),
        });
      }
    } catch {
      // Email failure should not block order confirmation
    }

    clearCart();
    router.push(`/order-confirmation?order=${stripeOrderNumber}&email=${encodeURIComponent(form.email)}&method=stripe&pi=${paymentIntent.id}`);
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
      const productName = items?.length > 0
        ? items.map((item) => `${item.name} (${item.carat}, ${item.metal})`).join(', ')
        : 'Custom Order';

      const productConfig = items?.length > 0
        ? items.map((item) => {
            const parts = [`${item.carat} · ${item.metal} · ${item.origin}`];
            if (item.ringSize) parts.push(`Ring Size: ${item.ringSize}`);
            if (item.braceletLength) parts.push(`Length: ${item.braceletLength}`);
            return parts.join(' · ');
          }).join('; ')
        : '';

      const primaryProductId = items?.length > 0 ? (items[0].productId || undefined) : undefined;

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${form.firstName} ${form.lastName}`,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          productId: primaryProductId,
          productName,
          productConfig,
          quantity: items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1,
          totalPrice: totalPrice || 0,
          paymentMethod,
          orderItems: items?.map((item) => ({
            id: item.id,
            name: item.name,
            carat: item.carat,
            metal: item.metal,
            origin: item.origin,
            shape: item.shape,
            price: item.price,
            quantity: item.quantity || 1,
            img: item.img,
            ringSize: item.ringSize || undefined,
            braceletLength: item.braceletLength || undefined,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.order) {
        setError(json.error || 'Failed to place order. Please try again or contact our concierge at hello@detara.store.');
        return;
      }

      const order = json.order;

      try {
        trackPurchase({
          orderId: order.order_number,
          total: totalPrice || 0,
          items: items?.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
          })) || [],
        });
      } catch {
        // Non-critical
      }

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseAnonKey) {
          await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
            },
            body: JSON.stringify({
              type: 'order_confirmation',
              to: form.email,
              customerName: `${form.firstName} ${form.lastName}`,
              orderNumber: order.order_number,
              orderItems: items?.map((item: { name: string; carat: string; metal: string; price: number; quantity: number }) => ({
                name: item.name,
                carat: item.carat,
                metal: item.metal,
                price: item.price,
                quantity: item.quantity || 1,
              })) || [],
              orderTotal: totalPrice || 0,
              shippingAddress: [form.address, form.city, form.postalCode, form.country].filter(Boolean).join(', '),
              paymentMethod: paymentMethod,
            }),
          });
        }
      } catch {
        // Email failure should not block order confirmation
      }

      clearCart();
      router.push(`/order-confirmation?order=${order.order_number}&email=${encodeURIComponent(form.email)}&method=${paymentMethod}`);
    } catch (err: unknown) {
      console.error('[Checkout] Place order error:', err);
      setError('An unexpected error occurred. Please try again or contact us at hello@detara.store.');
    } finally {
      setSubmitting(false);
    }
  };

  const stripePromise = getStripe();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg pt-44 md:pt-56 pb-20 md:pb-32 px-5 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          {/* Page title */}
          <div className="mb-10 md:mb-14 pb-8 border-b border-[rgba(28,25,23,0.08)]">
            <p className="label-caps text-accent mb-3">Secure Checkout</p>
            <h1 className="heading-display text-[clamp(2rem,4vw,4rem)] text-foreground font-light leading-[0.92]">
              Complete Your Order
            </h1>
            <p className="text-xs text-muted font-light mt-3">Worldwide insured shipping · Certified diamonds</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-10 md:mb-14 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  <div
                    className={`w-7 h-7 flex items-center justify-center text-xs font-medium border transition-all ${
                      currentStep === step.num
                        ? 'bg-foreground text-[#FAFAF8] border-foreground'
                        : currentStep > step.num
                        ? 'bg-accent text-[#FAFAF8] border-accent'
                        : 'border-[rgba(28,25,23,0.2)] text-muted'
                    }`}
                  >
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                  <span
                    className={`label-caps hidden sm:block ${currentStep === step.num ? 'text-foreground' : 'text-muted'}`}
                    style={{ fontSize: '9px' }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[1px] mx-3 md:mx-4 min-w-[20px] transition-all ${
                      currentStep > step.num ? 'bg-accent' : 'bg-[rgba(28,25,23,0.1)]'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-10 md:gap-16">
            {/* Form area */}
            <div>
              {/* Step 1 — Customer Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl font-light text-foreground mb-6">Customer Details</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ fontSize: '9px' }}>First Name *</label>
                      <input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className={formErrors.firstName ? inputErrorClass : inputClass} placeholder="First name" />
                      {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className={labelClass} style={{ fontSize: '9px' }}>Last Name *</label>
                      <input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className={formErrors.lastName ? inputErrorClass : inputClass} placeholder="Last name" />
                      {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '9px' }}>Email Address *</label>
                    <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={formErrors.email ? inputErrorClass : inputClass} placeholder="your@email.com" />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '9px' }}>Phone Number (with country code) *</label>
                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={formErrors.phone ? inputErrorClass : inputClass} placeholder="+44 000 000 0000" />
                    {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                  </div>
                  <div className="pt-2 p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                    <p className="text-xs text-muted font-light leading-relaxed">
                      Your details are used solely for order processing and delivery. We will never share your information with third parties.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2 — Shipping Address */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl font-light text-foreground mb-2">Shipping Address</h2>
                  <p className="text-xs text-muted font-light mb-4">We ship worldwide with fully insured express delivery.</p>
                  <div>
                    <label className={labelClass} style={{ fontSize: '9px' }}>Street Address *</label>
                    <input type="text" value={form.address} onChange={(e) => update('address', e.target.value)} className={formErrors.address ? inputErrorClass : inputClass} placeholder="Street address" />
                    {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ fontSize: '9px' }}>City *</label>
                      <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)} className={formErrors.city ? inputErrorClass : inputClass} placeholder="City" />
                      {formErrors.city && <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>}
                    </div>
                    <div>
                      <label className={labelClass} style={{ fontSize: '9px' }}>State / Province</label>
                      <input type="text" value={form.state} onChange={(e) => update('state', e.target.value)} className={inputClass} placeholder="State / Province" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ fontSize: '9px' }}>Postal Code *</label>
                      <input type="text" value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} className={formErrors.postalCode ? inputErrorClass : inputClass} placeholder="Postal code" />
                      {formErrors.postalCode && <p className="text-xs text-red-500 mt-1">{formErrors.postalCode}</p>}
                    </div>
                    <div>
                      <label className={labelClass} style={{ fontSize: '9px' }}>Country *</label>
                      <select value={form.country} onChange={(e) => update('country', e.target.value)} className={formErrors.country ? inputErrorClass : inputClass}>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {formErrors.country && <p className="text-xs text-red-500 mt-1">{formErrors.country}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 — Payment Method */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl font-light text-foreground mb-2">Payment Method</h2>
                  <p className="text-xs text-muted font-light mb-6">Choose how you would like to complete your purchase.</p>

                  {/* Payment method selector */}
                  {/* Mobile/Tablet: Card first (active default). Desktop: original order */}
                  <div className="space-y-3">
                    {/* Card Payment via Stripe — shown first on all screen sizes */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={`w-full text-left p-5 border transition-all ${
                        paymentMethod === 'stripe' ? 'border-foreground bg-bg-warm' : 'border-[rgba(28,25,23,0.12)] hover:border-[rgba(28,25,23,0.3)]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                          paymentMethod === 'stripe' ? 'border-foreground bg-foreground' : 'border-[rgba(28,25,23,0.3)]'
                        }`}>
                          {paymentMethod === 'stripe' && (
                            <div className="w-full h-full rounded-full bg-[#FAFAF8] scale-[0.4] transform" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-light text-foreground">Card Payment</p>
                            <div className="flex items-center gap-1.5">
                              <span className="label-caps text-accent" style={{ fontSize: '8px' }}>Secure</span>
                              <span className="label-caps text-muted" style={{ fontSize: '8px' }}>· Visa · Mastercard · Amex</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted font-light leading-relaxed">
                            Pay instantly with your credit or debit card. Secured by Stripe with 256-bit SSL encryption.
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Bank Transfer */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`w-full text-left p-5 border transition-all ${
                        paymentMethod === 'bank_transfer' ? 'border-foreground bg-bg-warm' : 'border-[rgba(28,25,23,0.12)] hover:border-[rgba(28,25,23,0.3)]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                          paymentMethod === 'bank_transfer' ? 'border-foreground bg-foreground' : 'border-[rgba(28,25,23,0.3)]'
                        }`}>
                          {paymentMethod === 'bank_transfer' && (
                            <div className="w-full h-full rounded-full bg-[#FAFAF8] scale-[0.4] transform" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-light text-foreground">Bank Transfer</p>
                          </div>
                          <p className="text-xs text-muted font-light leading-relaxed">
                            Direct bank transfer to our account. Order confirmed within 1–2 business days after payment is received.
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Manual / Concierge Payment */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('manual')}
                      className={`w-full text-left p-5 border transition-all ${
                        paymentMethod === 'manual' ? 'border-foreground bg-bg-warm' : 'border-[rgba(28,25,23,0.12)] hover:border-[rgba(28,25,23,0.3)]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                          paymentMethod === 'manual' ? 'border-foreground bg-foreground' : 'border-[rgba(28,25,23,0.3)]'
                        }`}>
                          {paymentMethod === 'manual' && (
                            <div className="w-full h-full rounded-full bg-[#FAFAF8] scale-[0.4] transform" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-light text-foreground">Concierge Payment</p>
                            <span className="label-caps text-muted" style={{ fontSize: '8px' }}>Personal Service</span>
                          </div>
                          <p className="text-xs text-muted font-light leading-relaxed">
                            Our concierge will contact you directly to arrange payment via your preferred method — wire transfer, invoice, or payment link.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Stripe payment form */}
                  {paymentMethod === 'stripe' && (
                    <div className="mt-6">
                      {stripeLoading && (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 border border-accent border-t-transparent rounded-full animate-spin" />
                          <span className="ml-3 text-xs text-muted font-light">Initializing secure payment...</span>
                        </div>
                      )}
                      {stripeReady && stripeClientSecret && (
                        <Elements
                          stripe={stripePromise}
                          options={{
                            clientSecret: stripeClientSecret,
                            appearance: {
                              theme: 'stripe',
                              variables: {
                                colorPrimary: '#1C1917',
                                colorBackground: '#FAFAF8',
                                colorText: '#1C1917',
                                colorDanger: '#ef4444',
                                fontFamily: 'inherit',
                                borderRadius: '0px',
                                spacingUnit: '4px',
                              },
                            },
                          }}
                        >
                          <StripePaymentForm
                            clientSecret={stripeClientSecret}
                            orderNumber={stripeOrderNumber}
                            onSuccess={handleStripeSuccess}
                            onError={(msg) => setError(msg)}
                            totalPrice={totalPrice}
                            formatPrice={formatPrice}
                            billingCountry={form.country}
                          />
                        </Elements>
                      )}
                      {!stripeLoading && !stripeReady && (
                        <button
                          type="button"
                          onClick={initStripePayment}
                          className="w-full py-3 border border-[rgba(28,25,23,0.12)] text-xs text-muted font-light hover:border-foreground transition-colors"
                        >
                          Load Payment Form
                        </button>
                      )}
                    </div>
                  )}

                  {/* Bank transfer details — shown only when bank_transfer is selected */}
                  {paymentMethod === 'bank_transfer' && (
                    <div className="mt-6 p-6 bg-bg-warm border border-[rgba(28,25,23,0.08)] space-y-3">
                      <p className="label-caps text-foreground mb-4" style={{ fontSize: '9px' }}>Bank Transfer Details</p>
                      {[
                        { label: 'Bank Name', value: 'Citibank' },
                        { label: 'Bank Address', value: 'Canada Square, Canary Wharf London, E14 5LB United Kingdom' },
                        { label: 'Sort Code', value: '185008' },
                        { label: 'IBAN', value: 'GB94CITI18500856298680' },
                        { label: 'BIC', value: 'CITIGB2L' },
                        { label: 'Account Number', value: '56298680' },
                        { label: 'Beneficiary Name', value: 'DETARA LTD' },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between items-start py-2 border-b border-[rgba(28,25,23,0.06)] last:border-0 gap-4">
                          <span className="text-xs text-muted font-light flex-shrink-0">{row.label}</span>
                          <span className="text-xs text-foreground font-light text-right">{row.value}</span>
                        </div>
                      ))}
                      <p className="text-xs text-muted font-light mt-3 leading-relaxed pt-2">
                        Use your order number as the payment reference. Your order will be confirmed once payment is received (1–2 business days).
                      </p>
                    </div>
                  )}

                  {/* Concierge payment info */}
                  {paymentMethod === 'manual' && (
                    <div className="mt-6 p-6 bg-bg-warm border border-[rgba(28,25,23,0.08)]">
                      <p className="label-caps text-foreground mb-3" style={{ fontSize: '9px' }}>What Happens Next</p>
                      <p className="text-xs text-muted font-light leading-relaxed">
                        After placing your order, a DETARA concierge specialist will contact you within 24 hours at <strong className="text-foreground">{form.email || 'your email'}</strong> to arrange payment. We accommodate wire transfers, invoices, and secure payment links.
                      </p>
                    </div>
                  )}

                  {/* Company identity */}
                  <div className="p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                    <p className="text-[10px] text-muted font-light leading-relaxed">
                      <strong className="text-foreground text-[10px]">DETARA LTD</strong><br />
                      London, United Kingdom<br />
                      hello@detara.store · +44 20 4614 8575
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4 — Order Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl font-light text-foreground mb-6">Review Your Order</h2>

                  {/* Cart items */}
                  {items?.length > 0 ? (
                    <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                      <div className="px-6 pt-5 pb-3 border-b border-[rgba(28,25,23,0.06)]">
                        <p className="label-caps text-foreground" style={{ fontSize: '9px' }}>Items ({items.length})</p>
                      </div>
                      <div className="divide-y divide-[rgba(28,25,23,0.06)]">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-4 p-5">
                            <div className="relative w-16 h-16 flex-shrink-0 bg-[#EDEAE4] overflow-hidden">
                              <AppImage src={item.img} alt={item.alt} fill className="object-cover object-center" sizes="64px" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-sm font-light text-foreground">{item.name}</p>
                              <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>{item.carat} · {item.metal} · {item.origin}</p>
                              {item.ringSize && <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>Ring Size: {item.ringSize}</p>}
                              {item.braceletLength && <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>Length: {item.braceletLength}</p>}
                              <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>Qty: {item.quantity || 1}</p>
                            </div>
                            <p className="font-serif text-sm font-light text-foreground whitespace-nowrap">{formatPrice(item.price * (item.quantity || 1))}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                      <p className="text-sm text-muted font-light">No items in cart.</p>
                    </div>
                  )}

                  {/* Delivery details */}
                  <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 space-y-2">
                    <p className="label-caps text-foreground mb-4" style={{ fontSize: '9px' }}>Delivery Details</p>
                    <p className="text-sm text-muted font-light">{form.firstName} {form.lastName}</p>
                    <p className="text-sm text-muted font-light">{form.email}</p>
                    <p className="text-sm text-muted font-light">{form.phone}</p>
                    <p className="text-sm text-muted font-light">{form.address}</p>
                    <p className="text-sm text-muted font-light">{form.city}{form.state ? `, ${form.state}` : ''}, {form.postalCode}</p>
                    <p className="text-sm text-muted font-light">{form.country}</p>
                  </div>

                  {/* Payment method summary */}
                  <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6">
                    <p className="label-caps text-foreground mb-3" style={{ fontSize: '9px' }}>Payment Method</p>
                    <p className="text-sm text-muted font-light">
                      {paymentMethod === 'stripe' ?'Card Payment — Secured by Stripe'
                        : paymentMethod === 'bank_transfer' ?'Bank Transfer — Citibank' :'Concierge Payment — Our team will contact you'}
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted font-light leading-relaxed">
                    By placing this order you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-foreground transition-colors">Terms & Conditions</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>.
                  </p>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between items-center mt-10 pt-8 border-t border-[rgba(28,25,23,0.08)]">
                {currentStep > 1 ? (
                  <button onClick={handleBack} className="label-caps text-muted hover:text-foreground transition-colors">
                    ← Back
                  </button>
                ) : (
                  <Link href="/cart" className="label-caps text-muted hover:text-foreground transition-colors">
                    ← Cart
                  </Link>
                )}
                {/* On step 3 with stripe selected, payment is handled inside the Stripe form */}
                {currentStep < 4 && !(currentStep === 3 && paymentMethod === 'stripe' && stripeReady) ? (
                  <button
                    onClick={handleNext}
                    className="py-4 px-8 bg-foreground text-[#FAFAF8] text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-accent-dark transition-colors"
                  >
                    Continue →
                  </button>
                ) : currentStep === 4 ? (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting || items?.length === 0}
                    className="py-4 px-8 bg-foreground text-[#FAFAF8] text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-accent-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                ) : currentStep === 3 && paymentMethod === 'stripe' && !stripeReady ? (
                  <button
                    onClick={handleNext}
                    className="py-4 px-8 bg-foreground text-[#FAFAF8] text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-accent-dark transition-colors"
                  >
                    Continue →
                  </button>
                ) : null}
              </div>

              {/* Error display */}
              {error && currentStep === 3 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Order summary sidebar */}
            <div className="lg:sticky lg:top-32 h-fit">
              <div className="bg-bg-warm border border-[rgba(28,25,23,0.06)] p-6 md:p-8">
                <p className="label-caps text-foreground mb-6 tracking-[0.25em]">Order Summary</p>
                {items?.length > 0 ? (
                  <>
                    <div className="space-y-4 mb-6 pb-6 border-b border-[rgba(28,25,23,0.08)]">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-light text-foreground truncate">{item.name}</p>
                            <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>{item.carat} · {item.metal}</p>
                            {item.ringSize && <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>Ring Size: {item.ringSize}</p>}
                            {item.braceletLength && <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>Length: {item.braceletLength}</p>}
                            {(item.quantity || 1) > 1 && (
                              <p className="label-caps text-muted mt-0.5" style={{ fontSize: '8px' }}>×{item.quantity}</p>
                            )}
                          </div>
                          <p className="text-sm font-light text-foreground whitespace-nowrap">{formatPrice(item.price * (item.quantity || 1))}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted font-light">Subtotal</span>
                        <span className="text-sm font-light text-foreground">{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted font-light">Shipping</span>
                        <span className="text-sm font-light text-accent">Free · Insured</span>
                      </div>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-[rgba(28,25,23,0.08)] mb-6">
                      <span className="font-serif text-base font-light text-foreground">Total</span>
                      <span className="font-serif text-lg font-light text-foreground">{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { icon: '◈', label: 'IGI / GIA Certified' },
                        { icon: '◇', label: 'Personal Concierge' },
                        { icon: '→', label: 'Free Insured Shipping' },
                        { icon: '∞', label: 'Lifetime Service' },
                      ].map((t) => (
                        <div key={t.label} className="flex items-center gap-3">
                          <span className="text-accent text-sm">{t.icon}</span>
                          <span className="label-caps text-muted" style={{ fontSize: '9px' }}>{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted font-light mb-4">Your cart is empty.</p>
                    <Link href="/products" className="label-caps text-accent hover:text-foreground transition-colors" style={{ fontSize: '9px' }}>
                      Explore Collection →
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-bg-warm border border-[rgba(28,25,23,0.06)]">
                <p className="text-[10px] text-muted font-light leading-relaxed">
                  <strong className="text-foreground text-[10px]">DETARA LTD</strong> — London, United Kingdom<br />
                  hello@detara.store · +44 20 4614 8575
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
