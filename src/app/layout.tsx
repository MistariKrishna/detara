import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { hydrationErrorFilterScript } from '@/lib/hydrationErrorFilter';
import { BRAND_LEGAL_NAME, absoluteLogoUrl } from '@/lib/brand';
import AIChatWidget from '@/components/AIChatWidget';
import AnnouncementBar from '@/components/AnnouncementBar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'DETARA | Fine Diamond Jewellery & Engagement Rings',
    template: '%s | DETARA',
  },
  description:
    'European diamond jewellery brand offering certified engagement rings, diamond stud earrings, tennis bracelets and custom pieces. Natural and lab-grown diamonds. Worldwide shipping.',
  keywords: [
    'diamond jewellery',
    'engagement rings',
    'diamond stud earrings',
    'tennis bracelets',
    'fine jewellery',
    'lab-grown diamonds',
    'natural diamonds',
    'DETARA',
    'bespoke diamond jewellery',
    'custom diamond rings',
    'diamond pendants',
    'certified diamonds',
    'IGI certified diamonds',
    'GIA certified diamonds',
    'diamond rings UK',
    'buy diamond jewellery online',
    'European jewellery',
    'fine diamond rings',
  ],
  authors: [{ name: 'DETARA LTD' }],
  creator: 'DETARA LTD',
  publisher: 'DETARA LTD',
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [{ url: '/assets/images/D_fav-removebg-preview-1789798103817.png', type: 'image/png' }],
    shortcut: '/assets/images/D_fav-removebg-preview-1789798103817.png',
    apple: '/assets/images/D_fav-removebg-preview-1789798103817.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    alternateLocale: ['en_US'],
    url: baseUrl,
    siteName: 'DETARA',
    title: 'DETARA | Fine Diamond Jewellery',
    description:
      'Certified diamond engagement rings, stud earrings, tennis bracelets and bespoke custom pieces. Natural and lab-grown diamonds. Worldwide shipping.',
    images: [
      {
        url: absoluteLogoUrl(baseUrl),
        width: 1200,
        height: 630,
        alt: 'DETARA — Fine Diamond Jewellery collection',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DETARA | Fine Diamond Jewellery',
    description:
      'Certified diamond engagement rings, stud earrings, tennis bracelets and bespoke custom pieces.',
    images: [absoluteLogoUrl(baseUrl)],
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      'en-GB': baseUrl,
      'en-US': baseUrl,
    },
  },
  verification: {
    google: 'tOpjYCYBNGb59peNQjsAbgg3yPmOlXDdcpvg-LuXRhQ',
  },
  category: 'jewellery',
};

// Organization schema — GEO entity consistency
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${baseUrl}/#organization`,
  name: BRAND_LEGAL_NAME,
  legalName: 'DETARA LTD',
  url: baseUrl,
  logo: {
    '@type': 'ImageObject',
    '@id': `${baseUrl}/#logo`,
    url: absoluteLogoUrl(baseUrl),
    width: 400,
    height: 400,
    caption: 'DETARA — Luxury Diamond Jewellery',
  },
  image: absoluteLogoUrl(baseUrl),
  description:
    'DETARA LTD is a luxury diamond jewellery brand offering certified engagement rings, diamond stud earrings, tennis bracelets and bespoke custom pieces. We offer both natural and lab-grown diamonds, certified by IGI and GIA.',
  foundingDate: '2024',
  areaServed: ['GB', 'US', 'EU'],
  currenciesAccepted: 'GBP, EUR, USD',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'London',
    addressCountry: 'GB',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'hello@detara.store',
      telephone: '+44-20-4614-8575',
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      url: `${baseUrl}/contact`,
      availableLanguage: 'English',
    },
    {
      '@type': 'ContactPoint',
      contactType: 'Sales',
      url: `${baseUrl}/custom-jewelry`,
      availableLanguage: 'English',
    },
  ],
  sameAs: [
    'https://www.instagram.com/detara.store',
    'https://www.facebook.com/share/1Wa8vVFWJ1/',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'DETARA Diamond Jewellery Collection',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Diamond Engagement Rings' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Diamond Stud Earrings' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Tennis Bracelets' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Diamond Pendants' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Custom Diamond Jewellery' } },
    ],
  },
};

// WebSite schema with SearchAction
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${baseUrl}/#website`,
  url: baseUrl,
  name: 'DETARA',
  description:
    'Luxury diamond jewellery — engagement rings, diamond studs, tennis bracelets and bespoke custom pieces.',
  publisher: { '@id': `${baseUrl}/#organization` },
  inLanguage: 'en-GB',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${baseUrl}/products?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        {/*
         * Hydration-noise filter — MUST be the first script in <head>.
         * Silences the harmless `data-component-line` mismatches that
         * @dhiwise/component-tagger produces in dev/Preview while still
         * surfacing every real runtime error. See src/lib/hydrationErrorFilter.ts
         */}
        <script
          dangerouslySetInnerHTML={{ __html: hydrationErrorFilterScript }}
        />

        <meta name="google-site-verification" content="tOpjYCYBNGb59peNQjsAbgg3yPmOlXDdcpvg-LuXRhQ" />
        <meta name="facebook-domain-verification" content="biu7f8sap50evecyy9gp6g0ydfe8hr" />

        {/* Favicon — Detara D logo */}
        <link rel="icon" href="/assets/images/D_fav-removebg-preview-1789798103817.png" type="image/png" />
        <link rel="shortcut icon" href="/assets/images/D_fav-removebg-preview-1789798103817.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/images/D_fav-removebg-preview-1789798103817.png" />

        {/* DNS prefetch for external image CDNs — reduces connection latency */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//img.rocket.new" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        {/* Preconnect to font origins — eliminates font render-blocking */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Organization structured data — GEO entity signal */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* WebSite structured data with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
</head>
      <body suppressHydrationWarning className="detara-site-body">
        <CurrencyProvider>
          <CartProvider>
            <WishlistProvider>
              <AuthProvider>
                <Suspense fallback={null}>
                  <GoogleAnalytics />
                </Suspense>
                <AnnouncementBar />
                {children}
                <MobileBottomNav />
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    style: {
                      background: '#1C1917',
                      color: '#FAFAF8',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      fontWeight: 300,
                      letterSpacing: '0.02em',
                      borderRadius: '0px',
                      padding: '14px 20px',
                    },
                  }}
                />
                {/* Global AI Chat Widget — visible on every page */}
                <Suspense fallback={null}>
                  <AIChatWidget />
                </Suspense>
              </AuthProvider>
            </WishlistProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}