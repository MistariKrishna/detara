'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/lib/hooks/useChat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a knowledgeable diamond jewelry advisor for DETARA, a European luxury diamond jewelry brand. 

You help customers with:
- Explaining the difference between natural and lab-grown diamonds
- Diamond quality (4Cs: Cut, Color, Clarity, Carat)
- Product recommendations based on budget and preferences
- Ring sizing and jewelry care
- Pricing guidance (natural diamonds cost more; lab-grown are ~30% less)
- Certification (IGI and GIA certified diamonds above 0.30ct)
- Custom jewelry inquiries
- Shipping and returns

DETARA sells: Engagement Rings, Diamond Studs, Tennis Bracelets, Diamond Bands, Pendants, and Custom Jewelry.
All diamonds are quality checked. Both natural and lab-grown diamonds are real — the difference lies in their origin.

Keep responses concise, warm, and professional. If asked about specific order status or complex issues, suggest contacting via WhatsApp at https://wa.me/442046148575.`;

const DETARA_WHATSAPP_URL = 'https://wa.me/442046148575';

const WHATSAPP_URL = DETARA_WHATSAPP_URL;

const QUICK_QUESTIONS = ['Natural vs Lab diamonds?', 'Ring sizing help', 'Certification info'];

/* ─── Design tokens (aligned with the DETARA KISS page) ─────────────────────── */
const INK = '#1C1917';
const GOLD = '#C9A96E';
const GOLD_LIGHT = '#D9BC85';
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

/* Gold dust for the panel header — deterministic (no hydration mismatch) */
const HEADER_DUST = Array.from({ length: 7 }, (_, i) => ({
  left: (i * 37 + 24) % 100,
  size: 1.5 + (i % 3),
  duration: 7 + (i % 4) * 1.6,
  delay: -(i * 1.3),
}));

/* Scoped styles — calm by design: slow easing, gentle lifts, no bouncing */
const cwCss = `
@keyframes cwRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes cwSheen { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(420%) skewX(-18deg); } }
@keyframes cwShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes cwPulse {
  0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.55); }
  70% { box-shadow: 0 0 0 12px rgba(201,169,110,0); }
  100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); }
}
@keyframes cwDotPulse {
  0% { box-shadow: 0 0 0 0 rgba(201,169,110,0.6); }
  70% { box-shadow: 0 0 0 6px rgba(201,169,110,0); }
  100% { box-shadow: 0 0 0 0 rgba(201,169,110,0); }
}
@keyframes cwTyping { 0%, 100% { opacity: 0.25; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1); } }
@keyframes cwCaret { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes cwDust {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translateY(-90px) scale(0.4); opacity: 0; }
}
@keyframes cwTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes cwDrawX { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* ── Toggle ── */
.cw-toggle {
  background-color: ${INK}; color: #FAFAF8;
  border: 1px solid rgba(201,169,110,0.45);
  box-shadow: 0 12px 28px -12px rgba(28,25,23,0.55);
  transition: transform 0.6s ${EASE}, background-color 0.6s ease, color 0.6s ease, box-shadow 0.6s ${EASE}, border-color 0.6s ease;
}
.cw-toggle:hover, .cw-toggle:focus-visible {
  transform: translateY(-2px); background-color: ${GOLD}; color: ${INK}; border-color: ${GOLD};
  box-shadow: 0 16px 32px -14px rgba(201,169,110,0.7);
}
.cw-toggle:active { transform: translateY(0) scale(0.97); }
/* Three gentle gold pulses after load to signal the advisor, then still */
.cw-toggle[data-attention='true'] { animation: cwPulse 1.9s ease-out 2.5s 3; }
.cw-toggle-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  transition: opacity 0.4s ease, transform 0.6s ${EASE}; }
.cw-toggle[data-open='true'] .cw-icon-chat { opacity: 0; transform: rotate(-90deg) scale(0.6); }
.cw-toggle[data-open='false'] .cw-icon-close { opacity: 0; transform: rotate(90deg) scale(0.6); }

/* ── Panel ── */
.cw-panel {
  width: min(24rem, calc(100vw - 3rem));
  max-height: min(520px, calc(100vh - 180px));
  max-height: min(520px, calc(100dvh - 180px));
  opacity: 0; visibility: hidden; pointer-events: none;
  transform: translateY(14px) scale(0.98); transform-origin: bottom right;
  box-shadow: 0 30px 60px -30px rgba(28,25,23,0.45);
  transition: opacity 0.35s ${EASE}, transform 0.5s ${EASE}, visibility 0s linear 0.5s;
}
.cw-panel[data-open='true'] {
  opacity: 1; visibility: visible; pointer-events: auto; transform: none;
  transition: opacity 0.4s ${EASE}, transform 0.6s ${EASE}, visibility 0s;
}
.cw-head-line { transform: scaleX(0); transform-origin: left; }
.cw-panel[data-open='true'] .cw-head-line { transform: scaleX(1); animation: cwDrawX 1s ${EASE} 0.15s backwards; }
.cw-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) 38%, ${GOLD_LIGHT} 50%, rgba(255,255,255,0.9) 62%, rgba(255,255,255,0.9) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: cwShimmer 8s linear infinite;
}
.cw-dust { position: absolute; bottom: -6px; border-radius: 9999px; background: ${GOLD_LIGHT};
  box-shadow: 0 0 5px 1px rgba(217,188,133,0.5); animation: cwDust linear infinite; }
.cw-twinkle { animation: cwTwinkle 3.4s ease-in-out infinite both; }
.cw-status-on { background-color: ${GOLD}; animation: cwDotPulse 2.4s ease-out infinite; }
.cw-status-off { background-color: #D4A24C; }

/* ── Messages ── */
.cw-msg { animation: cwRise 0.5s ${EASE}; }
.cw-chip {
  border: 1px solid rgba(28,25,23,0.12); color: #6B6560; background-color: transparent;
  transition: border-color 0.5s ease, color 0.5s ease, transform 0.5s ${EASE}, background-color 0.5s ease;
}
.cw-chip:hover, .cw-chip:focus-visible { border-color: ${GOLD}; color: ${INK}; transform: translateY(-1px); background-color: rgba(201,169,110,0.06); }
.cw-typing span { animation: cwTyping 1.4s ease-in-out infinite; }
.cw-caret { animation: cwCaret 1s steps(1) infinite; }

/* ── Input + send ── */
.cw-input { border: 1px solid rgba(28,25,23,0.12); transition: border-color 0.5s ease, background-color 0.5s ease; }
.cw-input:focus { outline: none; border-color: ${GOLD}; background-color: #FFFFFF; }
.cw-send { position: relative; overflow: hidden; background-color: ${INK}; color: #FAFAF8;
  transition: background-color 0.6s ease, color 0.6s ease; }
.cw-send:hover:not(:disabled), .cw-send:focus-visible { background-color: ${GOLD}; color: ${INK}; }
.cw-arrow { display: inline-block; transition: transform 0.6s ${EASE}; }
.cw-send:hover:not(:disabled) .cw-arrow, .cw-help:hover .cw-arrow, .cw-help:focus-visible .cw-arrow { transform: translateX(4px); }

/* ── Buttons with lift + sheen (WhatsApp) ── */
.cw-btn { position: relative; overflow: hidden;
  transition: transform 0.6s ${EASE}, box-shadow 0.6s ${EASE}, background-color 0.6s ease; }
.cw-btn:hover, .cw-btn:focus-visible { transform: translateY(-2px); box-shadow: 0 12px 24px -12px rgba(37,211,102,0.6); background-color: #1EBE5B; }
.cw-btn:active { transform: translateY(0) scale(0.99); }
.cw-btn::after { content: ""; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
  transform: translateX(-160%) skewX(-18deg); pointer-events: none; }
.cw-btn:hover::after { animation: cwSheen 1.6s ${EASE}; }

/* "Need human help?" link */
.cw-help { position: relative; color: #6B6560; transition: color 0.5s ease; }
.cw-help:hover, .cw-help:focus-visible { color: ${INK}; }

/* Unavailable state: square turns into a diamond, icon stays upright */
.cw-diamond { border: 1px solid rgba(201,169,110,0.5); transform: rotate(45deg); }
.cw-diamond > span { transform: rotate(-45deg); display: inline-flex; }

@media (prefers-reduced-motion: reduce) {
  .cw-root *, .cw-root *::before, .cw-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .cw-dust, .cw-twinkle { display: none !important; }
  .cw-shimmer { background: none !important; color: #fff !important; }
}
`;

function WhatsAppIcon({ size, fill }: { size: number; fill: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const focusRing =
  'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [showWhatsAppFallback, setShowWhatsAppFallback] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4.1-mini', true);

  useEffect(() => {
    if (error) {
      setShowWhatsAppFallback(true);
      const is429 =
        error.message?.includes('429') ||
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('quota');

      if (is429) {
        setAiUnavailable(true);
      }

      const friendlyMsg = is429
        ? 'Our AI advisor is temporarily unavailable due to high demand. Please reach out via WhatsApp for immediate assistance from our team.'
        : "I'm having trouble connecting right now. Please try again or contact us via WhatsApp.";

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') return prev;
        return [...prev, { role: 'assistant', content: friendlyMsg }];
      });
    }
  }, [error]);

  useEffect(() => {
    if (response) {
      setCurrentResponse(response);
    }
  }, [response]);

  useEffect(() => {
    if (!isLoading && currentResponse) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { role: 'assistant', content: currentResponse }];
        }
        return [...prev, { role: 'assistant', content: currentResponse }];
      });
      setCurrentResponse('');
    }
  }, [isLoading, currentResponse]);

  /* Scroll only the message list. scrollIntoView() also scrolled the page behind the
     widget (very noticeable in iOS Safari) every time a token streamed in. */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [messages, currentResponse, isLoading]);

  /* Open: focus the field on desktop. Escape closes and returns focus to the toggle. */
  useEffect(() => {
    if (!open) return;
    setHasOpened(true);
    let t = 0;
    if (window.matchMedia('(pointer: fine)').matches) {
      t = window.setTimeout(() => inputRef.current?.focus(), 200);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || isLoading || aiUnavailable) return;

    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...newMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    sendMessage(apiMessages, { max_completion_tokens: 400 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleHumanHelp = () => {
    setShowWhatsAppFallback(true);
  };

  const handleQuickQuestion = (q: string) => {
    setInput(q);
    inputRef.current?.focus();
  };

  return (
    <div className="cw-root">
      <style dangerouslySetInnerHTML={{ __html: cwCss }} />

      {/* Chat bubble button */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat support' : 'Open chat support'}
        aria-expanded={open}
        aria-controls="detara-chat-panel"
        data-open={String(open)}
        data-attention={String(!hasOpened)}
        className={`cw-toggle fixed right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full ${focusRing}`}
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}
      >
        <span className="cw-toggle-icon cw-icon-chat" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="cw-toggle-icon cw-icon-close" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Chat panel — stays mounted so it can animate in and out */}
      <div
        id="detara-chat-panel"
        role="dialog"
        aria-label="DETARA support chat"
        aria-hidden={!open}
        data-open={String(open)}
        className="cw-panel fixed right-6 z-50 flex flex-col overflow-hidden border border-[rgba(201,169,110,0.25)] bg-[#FAFAF8]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 148px)' }}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-[#1C1917] px-5 py-4">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70">
            {HEADER_DUST.map((d, i) => (
              <span
                key={i}
                className="cw-dust"
                style={{
                  left: `${d.left}%`,
                  width: `${d.size}px`,
                  height: `${d.size}px`,
                  animationDuration: `${d.duration}s`,
                  animationDelay: `${d.delay}s`,
                }}
              />
            ))}
          </div>
          <span aria-hidden="true" className="cw-twinkle pointer-events-none absolute right-12 top-2 text-[10px] text-[#C9A96E]">
            ✦
          </span>

          <div className="relative flex items-center justify-between">
            <div>
              <p className="label-caps mb-1 text-[9px] tracking-[0.35em] text-[#C9A96E]">
                {aiUnavailable ? 'Connect via WhatsApp' : 'AI Diamond Advisor'}
              </p>
              <p className="font-serif text-base font-light tracking-wide text-[#FAFAF8]">
                DETARA <em className="cw-shimmer">Support</em>
              </p>
            </div>
            <span
              className={`block h-2 w-2 rounded-full ${aiUnavailable ? 'cw-status-off' : 'cw-status-on'}`}
              aria-label={aiUnavailable ? 'AI advisor unavailable' : 'AI advisor online'}
              role="img"
            />
          </div>
          <span
            aria-hidden="true"
            className="cw-head-line absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[#C9A96E]/60 via-[#C9A96E]/30 to-transparent"
          />
        </div>

        {/* WhatsApp fallback banner */}
        {showWhatsAppFallback && (
          <div className="cw-msg relative flex items-center justify-between gap-3 border-b border-[rgba(28,25,23,0.06)] bg-[#F4F2EE] px-4 py-3">
            <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-[#C9A96E]" />
            <p className="text-[11px] font-light leading-relaxed text-[#1C1917]">
              {aiUnavailable ? 'AI advisor unavailable. Chat with our team directly.' : 'Need human help? Chat with our team on WhatsApp.'}
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`cw-btn flex flex-shrink-0 items-center gap-1.5 bg-[#25D366] px-3 py-1.5 text-[10px] font-medium tracking-wide text-white ${focusRing}`}
            >
              <WhatsAppIcon size={14} fill="white" />
              <span className="relative">WhatsApp</span>
            </a>
          </div>
        )}

        {/* AI unavailable full-panel CTA */}
        {aiUnavailable && messages.length <= 1 && (
          <div className="cw-msg flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
            <div className="cw-diamond flex h-12 w-12 items-center justify-center bg-[#25D366]/[0.06]">
              <span>
                <WhatsAppIcon size={22} fill="#25D366" />
              </span>
            </div>
            <div>
              <p className="mb-1 font-serif text-base font-light text-[#1C1917]">Our AI advisor is currently unavailable</p>
              <p className="text-[11px] font-light leading-relaxed text-[#6B6560]">
                Our team is ready to help you on WhatsApp with any questions about diamonds, pricing, or custom jewelry.
              </p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`cw-btn flex items-center gap-2 bg-[#25D366] px-5 py-2.5 text-xs font-medium tracking-wide text-white ${focusRing}`}
            >
              <WhatsAppIcon size={16} fill="white" />
              <span className="relative">Chat on WhatsApp</span>
            </a>
          </div>
        )}

        {/* Messages (shown when AI is available or after error with messages) */}
        {(!aiUnavailable || messages.length > 1) && (
          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
            style={{ minHeight: '240px', maxHeight: '280px' }}
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="cw-msg py-6 text-center">
                <span aria-hidden="true" className="mb-3 inline-block text-lg text-[#C9A96E]">
                  ◇
                </span>
                <p className="text-xs font-light leading-relaxed text-[#6B6560]">
                  Ask me anything about diamonds, our collections, sizing, or pricing.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQuickQuestion(q)}
                      className={`cw-chip px-3 py-1.5 text-[10px] tracking-wide ${focusRing}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`cw-msg flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`relative max-w-[80%] px-3 py-2 text-xs font-light leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1C1917] text-[#FAFAF8]'
                      : 'border border-[rgba(28,25,23,0.06)] bg-[#F4F2EE] text-[#1C1917]'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-[#C9A96E]/70" />
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && currentResponse && (
              <div className="flex justify-start">
                <div className="relative max-w-[80%] border border-[rgba(28,25,23,0.06)] bg-[#F4F2EE] px-3 py-2 text-xs font-light leading-relaxed text-[#1C1917]">
                  <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-[#C9A96E]/70" />
                  {currentResponse}
                  <span aria-hidden="true" className="cw-caret ml-0.5 inline-block h-3 w-[2px] bg-[#C9A96E] align-middle" />
                </div>
              </div>
            )}
            {isLoading && !currentResponse && (
              <div className="cw-msg flex justify-start">
                <div className="relative border border-[rgba(28,25,23,0.06)] bg-[#F4F2EE] px-3 py-2.5">
                  <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-[#C9A96E]/70" />
                  <div className="cw-typing flex gap-1.5" aria-label="Advisor is typing" role="status">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]"
                        style={{ animationDelay: `${i * 180}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input — hidden when AI is fully unavailable */}
        {!aiUnavailable && (
          <div className="border-t border-[rgba(28,25,23,0.08)] p-3">
            <div className="flex gap-2">
              <label htmlFor="detara-chat-input" className="sr-only">
                Ask about diamonds
              </label>
              {/* 16px on mobile stops iOS Safari zooming the page when the field is focused */}
              <input
                id="detara-chat-input"
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about diamonds..."
                className="cw-input min-w-0 flex-1 bg-transparent px-3 py-2 text-[16px] font-light text-[#1C1917] placeholder:text-[#6B6560]/70 sm:text-xs"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className={`cw-send px-3.5 py-2 text-xs disabled:opacity-40 ${focusRing}`}
              >
                <span className="cw-arrow relative" aria-hidden="true">
                  →
                </span>
              </button>
            </div>
            {!showWhatsAppFallback && messages.length > 0 && (
              <button
                type="button"
                onClick={handleHumanHelp}
                className={`cw-help mt-2 w-full text-center text-[10px] font-light tracking-wide ${focusRing}`}
              >
                Need human help? <span className="cw-arrow" aria-hidden="true">→</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}