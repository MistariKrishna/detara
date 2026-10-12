'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';

/* ─── Types ─── */
type DiamondShape = 'round' | 'princess' | 'emerald' | 'heart';
type CaratWeight = '0.30' | '0.50' | '0.70' | '1.00' | '1.50' | '2.00';
type MetalType = '14K White Gold' | '18K White Gold' | '14K Yellow Gold' | '18K Yellow Gold' | '14K Rose Gold' | '18K Rose Gold';
type DiamondOrigin = 'lab' | 'natural';

/* ─── Price Matrix ─── */
const basePrices: Record<CaratWeight, number> = {
  '0.30': 18500,
  '0.50': 28900,
  '0.70': 38500,
  '1.00': 57500,
  '1.50': 89000,
  '2.00': 138000
};

const metalMultiplier: Record<MetalType, number> = {
  '14K White Gold': 1.0,
  '18K White Gold': 1.08,
  '14K Yellow Gold': 1.0,
  '18K Yellow Gold': 1.08,
  '14K Rose Gold': 1.0,
  '18K Rose Gold': 1.08
};

const originMultiplier: Record<DiamondOrigin, number> = {
  lab: 0.72,
  natural: 1.0
};

/* ─── Gallery Images ─── */
const galleryImages = [
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_173eddb81-1773481801355.png",
  alt: 'DETARA 4-Prong Solitaire Ring — front view on neutral background, round brilliant diamond in white gold setting'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_187a54abc-1773471727812.png",
  alt: 'DETARA Solitaire Ring — side profile showing prong setting and band thickness'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_162f28910-1784609498608.png",
  alt: 'Close-up of round brilliant diamond showing VVS clarity and exceptional light reflection'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_187a54abc-1773471727812.png",
  alt: 'Model wearing DETARA Solitaire Ring on hand — elegant lifestyle shot'
},
{
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_187a54abc-1773471727812.png",
  alt: 'DETARA Solitaire Ring — top-down view showing diamond symmetry and prong placement'
}];


/* ─── Related Products ─── */
const relatedProducts = [
{
  title: 'Solitaire Ring',
  subtitle: 'KISS Collection',
  price: 'NOK 57,500',
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_173eddb81-1773481801355.png",
  alt: 'DETARA KISS Solitaire Ring — round brilliant diamond in 14K white gold',
  href: '/kiss/product'
},
{
  title: 'Diamond Stud Earrings',
  subtitle: 'KISS Collection',
  price: 'NOK 34,900',
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_1399ec448-1778920578230.png",
  alt: 'DETARA KISS Diamond Stud Earrings — matched pair of round brilliant diamonds',
  href: '/kiss/product'
},
{
  title: 'Tennis Bracelet',
  subtitle: 'KISS Collection',
  price: 'NOK 124,000',
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_1d2edd610-1772212098743.png",
  alt: 'DETARA KISS Tennis Bracelet — continuous row of round brilliant diamonds in white gold',
  href: '/kiss/product'
},
{
  title: 'Diamond Band',
  subtitle: 'KISS Collection',
  price: 'NOK 42,500',
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_1399ec448-1778920578230.png",
  alt: 'DETARA KISS Diamond Band — eternity ring with channel-set round brilliant diamonds',
  href: '/kiss/product'
}];


/* ─── Diamond Shape SVG Icons ─── */
function RoundIcon({ active }: {active: boolean;}) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
      <circle cx="20" cy="20" r="14" stroke={active ? '#1C1917' : '#A09890'} strokeWidth="1.5" />
      <circle cx="20" cy="20" r="8" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="20" y1="6" x2="20" y2="12" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="20" y1="28" x2="20" y2="34" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="6" y1="20" x2="12" y2="20" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="28" y1="20" x2="34" y2="20" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
    </svg>);

}

function PrincessIcon({ active }: {active: boolean;}) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
      <rect x="8" y="8" width="24" height="24" stroke={active ? '#1C1917' : '#A09890'} strokeWidth="1.5" />
      <rect x="13" y="13" width="14" height="14" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="8" y1="8" x2="13" y2="13" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="32" y1="8" x2="27" y2="13" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="8" y1="32" x2="13" y2="27" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="32" y1="32" x2="27" y2="27" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
    </svg>);

}

function EmeraldIcon({ active }: {active: boolean;}) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
      <rect x="6" y="11" width="28" height="18" rx="2" stroke={active ? '#1C1917' : '#A09890'} strokeWidth="1.5" />
      <rect x="11" y="15" width="18" height="10" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="6" y1="15" x2="11" y2="15" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="34" y1="15" x2="29" y2="15" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="6" y1="25" x2="11" y2="25" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
      <line x1="34" y1="25" x2="29" y2="25" stroke={active ? '#C9A96E' : '#D4CFC9'} strokeWidth="1" />
    </svg>);

}

function HeartIcon({ active }: {active: boolean;}) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
      <path
        d="M20 32 C20 32 7 23 7 15 C7 10.5 10.5 7 15 7 C17.5 7 19.5 8.5 20 10 C20.5 8.5 22.5 7 24 7 C26.8 7 29 10.5 29 15 C29 23 20 32 20 32Z"
        stroke={active ? '#1C1917' : '#A09890'}
        strokeWidth="1.5" />
      
      <path
        d="M20 27 C20 27 11 21 11 16 C11 13.2 13.2 11 16 11 C17.8 11 19.2 12 20 13.2 C20.8 12 22.2 11 24 11 C26.8 11 29 13.2 29 16 C29 21 20 27 20 27Z"
        stroke={active ? '#C9A96E' : '#D4CFC9'}
        strokeWidth="1" />
      
    </svg>);

}

/* ─── Trust Icon Components ─── */
function SecurePaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M9 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>);

}

function FreeShippingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
      <rect x="9" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
    </svg>);

}

function WarrantyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M9 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>);

}

function CertifiedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="6" />
      <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>);

}

/* ─── Main Page ─── */
export default function KissProductPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const [shape, setShape] = useState<DiamondShape>('round');
  const [carat, setCarat] = useState<CaratWeight>('1.00');
  const [metal, setMetal] = useState<MetalType>('14K White Gold');
  const [origin, setOrigin] = useState<DiamondOrigin>('natural');

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formSent, setFormSent] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem } = useCart();
  const { formatPrice } = useCurrency();

  const shapeOptions: {key: DiamondShape;label: string;icon: React.ReactNode;}[] = [
  { key: 'round', label: 'Round Brilliant', icon: <RoundIcon active={shape === 'round'} /> },
  { key: 'princess', label: 'Princess', icon: <PrincessIcon active={shape === 'princess'} /> },
  { key: 'emerald', label: 'Emerald', icon: <EmeraldIcon active={shape === 'emerald'} /> },
  { key: 'heart', label: 'Heart', icon: <HeartIcon active={shape === 'heart'} /> }];

  const caratOptions: CaratWeight[] = ['0.30', '0.50', '0.70', '1.00', '1.50', '2.00'];
  const metalOptions: MetalType[] = [
  '14K White Gold', '18K White Gold',
  '14K Yellow Gold', '18K Yellow Gold',
  '14K Rose Gold', '18K Rose Gold'];

  /* Dynamic price */
  const price = Math.round(
    basePrices[carat] * metalMultiplier[metal] * originMultiplier[origin]
  );
  const formattedPrice = formatPrice(price);

  /* Hover zoom handler */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    setZoomPos({ x, y });
  };

  /* Scroll reveal */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal-item').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
  };

  const handleAddToCart = () => {
    addItem({
      id: `kiss-4prong-${shape}-${carat}-${metal}-${origin}`,
      name: '4-Prong Solitaire Ring',
      shape: shapeOptions.find((s) => s.key === shape)?.label || shape,
      carat: `${carat} ct`,
      metal,
      origin: origin === 'lab' ? 'Lab-Grown' : 'Natural',
      price,
      img: galleryImages[0].src,
      alt: galleryImages[0].alt
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg pt-20">

        {/* ── Breadcrumb ── */}
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-6 border-b border-[rgba(28,25,23,0.06)]">
          <nav className="flex items-center gap-3">
            <Link href="/" className="label-caps text-muted hover:text-foreground transition-colors">Home</Link>
            <span className="text-muted opacity-40 text-xs">—</span>
            <Link href="/products" className="label-caps text-muted hover:text-foreground transition-colors">KISS Collection</Link>
            <span className="text-muted opacity-40 text-xs">—</span>
            <span className="label-caps text-foreground">4-Prong Solitaire Ring</span>
          </nav>
        </div>

        {/* ── Two-Column Product Layout ── */}
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-8 md:py-12 lg:py-20">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 xl:gap-20">

            {/* ── LEFT: Image Gallery (60%) ── */}
            <div className="w-full lg:w-[60%] flex flex-col gap-3 md:gap-4">
              <div
                className="relative aspect-[4/5] bg-[#EDEAE4] overflow-hidden cursor-crosshair select-none"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}>
                <AppImage
                  src={galleryImages[activeImage]?.src}
                  alt={galleryImages[activeImage]?.alt}
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700"
                  style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: isZoomed ? 'scale(1.6)' : 'scale(1)' }}
                  sizes="(max-width: 1024px) 100vw, 60vw" />
                {!isZoomed &&
                <div className="hidden md:flex absolute bottom-5 right-5 items-center gap-2 bg-bg/80 backdrop-blur-sm px-3 py-2">
                    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" strokeLinecap="round" /><path d="M5 7h4M7 5v4" strokeLinecap="round" /></svg>
                    <span className="label-caps text-muted" style={{ fontSize: '9px' }}>Hover to zoom</span>
                  </div>
                }
              </div>
              <div className="flex gap-2 md:gap-3">
                {galleryImages.map((img, i) =>
                <button key={i} onClick={() => setActiveImage(i)}
                className={`relative flex-1 aspect-square bg-[#EDEAE4] overflow-hidden transition-all duration-300 ${activeImage === i ? 'ring-1 ring-[#1C1917]' : 'ring-1 ring-transparent hover:ring-[rgba(201,169,110,0.5)]'}`}
                aria-label={`View image ${i + 1}`}>
                    <AppImage src={img.src} alt={img.alt} fill className="object-cover object-center" sizes="10vw" />
                  </button>
                )}
              </div>
            </div>

            {/* ── RIGHT: Configuration Panel (40%) ── */}
            <div className="w-full lg:w-[40%] flex flex-col">
              <div className="mb-8 pb-8 border-b border-[rgba(28,25,23,0.08)]">
                <p className="label-caps text-accent mb-3 tracking-[0.35em]">KISS Collection</p>
                <h1 className="font-serif text-3xl md:text-4xl xl:text-5xl font-light text-foreground leading-tight mb-3">
                  4-Prong Solitaire Ring
                </h1>
                <p className="label-caps text-muted" style={{ fontSize: '10px' }}>SKU: DK-SR-4P-001</p>
              </div>

              {/* ── Diamond Shape ── */}
              <div className="mb-8">
                <p className="label-caps text-foreground mb-4 tracking-[0.25em]">Diamond Shape</p>
                <div className="grid grid-cols-4 gap-3">
                  {shapeOptions.map((opt) =>
                  <button key={opt.key} onClick={() => setShape(opt.key)}
                  className={`flex flex-col items-center gap-2 py-3 md:py-4 px-1 md:px-2 border transition-all duration-250 min-h-[64px] md:min-h-[auto] ${shape === opt.key ? 'border-foreground bg-foreground/[0.03]' : 'border-[rgba(28,25,23,0.1)] hover:border-[rgba(201,169,110,0.5)]'}`}
                  aria-pressed={shape === opt.key}>
                      {opt.icon}
                      <span className="label-caps text-center leading-tight" style={{ fontSize: '8px', color: shape === opt.key ? '#1C1917' : '#A09890' }}>{opt.label}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Carat Weight ── */}
              <div className="mb-8">
                <p className="label-caps text-foreground mb-4 tracking-[0.25em]">Carat Weight</p>
                <div className="grid grid-cols-3 md:flex md:flex-wrap gap-3">
                  {caratOptions.map((ct) =>
                  <button key={ct} onClick={() => setCarat(ct)}
                  className={`px-3 md:px-4 py-3 border text-sm font-light transition-all duration-250 min-h-[48px] ${carat === ct ? 'border-accent bg-accent text-[#FAFAF8]' : 'border-[rgba(28,25,23,0.12)] text-muted hover:border-accent hover:text-foreground'}`}
                  aria-pressed={carat === ct}>
                      {ct} ct
                    </button>
                  )}
                </div>
                <Link href="/ring-size-guide" className="mt-3 inline-flex items-center gap-2 label-caps text-muted hover:text-accent transition-colors" style={{ fontSize: '9px' }}>
                  <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" strokeLinecap="round" /></svg>
                  Ring Size Guide
                </Link>
              </div>

              {/* ── Metal Type ── */}
              <div className="mb-8">
                <p className="label-caps text-foreground mb-4 tracking-[0.25em]">Metal Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {metalOptions.map((m) =>
                  <button key={m} onClick={() => setMetal(m)}
                  className={`px-3 py-3 border text-left transition-all duration-250 min-h-[48px] ${metal === m ? 'border-foreground bg-foreground text-[#FAFAF8]' : 'border-[rgba(28,25,23,0.1)] text-muted hover:border-[rgba(201,169,110,0.5)] hover:text-foreground'}`}
                  aria-pressed={metal === m}>
                      <span className="text-xs font-light tracking-wide">{m}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Diamond Origin ── */}
              <div className="mb-10">
                <p className="label-caps text-foreground mb-4 tracking-[0.25em]">Diamond Origin</p>
                <div className="flex gap-0 border border-[rgba(28,25,23,0.12)] w-full">
                  {(['natural', 'lab'] as DiamondOrigin[]).map((o) =>
                  <button key={o} onClick={() => setOrigin(o)}
                  className={`flex-1 px-6 md:px-8 py-4 text-xs font-light tracking-widest uppercase transition-all duration-250 min-h-[52px] ${origin === o ? 'bg-foreground text-[#FAFAF8]' : 'bg-transparent text-muted hover:text-foreground'}`}
                  aria-pressed={origin === o}>
                      {o === 'natural' ? 'Natural' : 'Lab-Grown'}
                    </button>
                  )}
                </div>
                {origin === 'lab' && <p className="mt-2 text-xs text-muted font-light">Lab-grown diamonds offer the same optical beauty at a more accessible price.</p>}
              </div>

              {/* ── Price ── */}
              <div className="mb-8 pb-8 border-b border-[rgba(28,25,23,0.08)]">
                <p className="label-caps text-muted mb-2 tracking-[0.25em]">Price</p>
                <p className="font-serif text-3xl md:text-4xl xl:text-5xl font-light text-foreground tracking-tight whitespace-nowrap">
                  {formattedPrice}
                </p>
                <p className="mt-1 text-xs text-muted font-light">Incl. VAT · Free insured shipping</p>
              </div>

              {/* ── Buttons ── */}
              <div className="flex flex-col gap-3 mb-8">
                <button
                  onClick={handleAddToCart}
                  className={`w-full text-center py-4 min-h-[52px] transition-all ${addedToCart ? 'bg-accent-dark text-white' : 'btn-primary'}`}>
                  {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
                </button>
                <Link
                  href="/custom-jewelry#custom-form"
                  className="btn-outline w-full text-center py-4 min-h-[52px] flex items-center justify-center">
                  Request Custom Design
                </Link>
              </div>

              {/* ── Trust Signals ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 mb-8 border-t border-b border-[rgba(28,25,23,0.08)]">
                {[
                { icon: <CertifiedIcon />, label: 'Certified Diamonds' },
                { icon: <SecurePaymentIcon />, label: 'Secure Payment' },
                { icon: <FreeShippingIcon />, label: 'Free Insured Shipping' },
                { icon: <WarrantyIcon />, label: 'Lifetime Service' }].
                map((item) =>
                <div key={item.label} className="flex flex-col items-center gap-2 text-muted">
                    {item.icon}
                    <span className="label-caps text-center leading-tight" style={{ fontSize: '7px' }}>{item.label}</span>
                  </div>
                )}
              </div>

              {/* ── Custom Design Form ── */}
              {showCustomForm &&
              <div className="mb-8 p-6 bg-[#FAFAF8] border border-[rgba(28,25,23,0.08)]">
                  {formSent ?
                <div className="text-center py-4">
                      <p className="font-serif text-xl font-light text-foreground mb-2">Thank you</p>
                      <p className="text-sm text-muted font-light">We will be in touch within 2 business days.</p>
                    </div> :
                <>
                      <p className="label-caps text-foreground mb-5 tracking-[0.25em]">Custom Design Request</p>
                      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                        <div>
                          <label className="label-caps text-muted block mb-1.5" style={{ fontSize: '9px' }}>Full Name</label>
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-transparent border border-[rgba(28,25,23,0.12)] px-4 py-3 text-sm font-light text-foreground placeholder-muted focus:outline-none focus:border-foreground transition-colors" placeholder="Your name" />
                        </div>
                        <div>
                          <label className="label-caps text-muted block mb-1.5" style={{ fontSize: '9px' }}>Email Address</label>
                          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-transparent border border-[rgba(28,25,23,0.12)] px-4 py-3 text-sm font-light text-foreground placeholder-muted focus:outline-none focus:border-foreground transition-colors" placeholder="your@email.com" />
                        </div>
                        <div>
                          <label className="label-caps text-muted block mb-1.5" style={{ fontSize: '9px' }}>Design Request</label>
                          <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full bg-transparent border border-[rgba(28,25,23,0.12)] px-4 py-3 text-sm font-light text-foreground placeholder-muted focus:outline-none focus:border-foreground transition-colors resize-none" placeholder="Describe your custom design vision…" />
                        </div>
                        <button type="submit" className="btn-primary w-full text-center">Send Request</button>
                      </form>
                    </>
                }
                </div>
              }

            </div>
          </div>
        </div>

        {/* ── Diamond Integrity Section ── */}
        <section className="border-t border-[rgba(28,25,23,0.08)] py-20 bg-[#FAFAF8]">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8">
            <div className="grid lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-4">
                <p className="label-caps text-accent mb-4 tracking-[0.35em]">Certification</p>
                <h2 className="font-serif text-4xl font-light text-foreground leading-tight">
                  Diamond<br /><span className="italic text-muted">Integrity</span>
                </h2>
              </div>
              <div className="lg:col-span-8">
                <div className="space-y-4 mb-8">
                  <p className="text-base text-muted font-light leading-relaxed">All DETARA diamonds are carefully selected for brilliance, symmetry, and clarity. Every stone is certified by internationally recognized laboratories such as IGI or GIA.</p>
                  <p className="text-sm text-muted font-light leading-relaxed">Clients receive full certification documentation confirming: diamond origin, cut and proportions, clarity grading, and carat weight. Both lab-grown and natural diamonds are offered with identical quality standards.</p>
                </div>
                <Link href="/diamond-guide" className="inline-flex items-center gap-3 label-caps text-foreground hover:text-accent transition-colors">
                  Learn more in our Diamond Guide
                  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5"><path d="M4 10h12M12 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Related Products ── */}
        <section className="border-t border-[rgba(28,25,23,0.08)] py-20 bg-bg">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="label-caps text-accent mb-3 tracking-[0.35em]">KISS Collection</p>
                <h2 className="font-serif text-3xl xl:text-4xl font-light text-foreground">You May Also Like</h2>
              </div>
              <Link href="/products" className="hidden md:flex items-center gap-3 label-caps text-muted hover:text-foreground transition-colors">
                View All
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5"><path d="M4 10h12M12 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product, i) =>
              <Link key={product.title} href={product.href} className={`reveal-item delay-${i + 1} group block`}>
                  <div className="product-card overflow-hidden">
                    <div className="img-hover-zoom aspect-[3/4] bg-[#EDEAE4] relative overflow-hidden">
                      <AppImage src={product.src} alt={product.alt} fill className="object-cover object-center" sizes="(max-width: 768px) 50vw, 25vw" />
                    </div>
                    <div className="p-5">
                      <p className="label-caps text-muted mb-1.5" style={{ fontSize: '9px' }}>{product.subtitle}</p>
                      <p className="font-serif text-lg font-light text-foreground mb-2 group-hover:text-accent-dark transition-colors duration-300">{product.title}</p>
                      <p className="text-sm text-muted font-light">{product.price}</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>);

}