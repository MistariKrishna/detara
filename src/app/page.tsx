import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFloat from './homepage/components/WhatsAppFloat';
// NOTE: MobileBottomNav is rendered once from the root layout (src/app/layout.tsx).
// Do NOT render it here — a duplicate render caused a second identical <nav>
// in the DOM and contributed to hydration-mismatch signatures.

// All sections are now imported directly. Next.js App Router code-splits and
// streams Server Components natively via <Suspense> — React.lazy() is not
// needed (and is NOT safe) for Server Components; that mismatch was the
// root cause of the hydration errors.
import HeroSection from './homepage/components/HeroSection';
import TrustStrip from './homepage/components/TrustStrip';
import ShopByCategory from './homepage/components/ShopByCategory';
import FeaturedProducts from './homepage/components/FeaturedProducts';
import TopProducts from './homepage/components/TopProducts';
import CustomJewellerySection from './homepage/components/CustomJewellerySection';
import NaturalVsLab from './homepage/components/NaturalVsLab';
import CraftsmanshipSection from './homepage/components/CraftsmanshipSection';
import ServicePromise from './homepage/components/ServicePromise';
import JournalSection from './homepage/components/JournalSection';
import FinalCtaSection from './homepage/components/FinalCtaSection';
import ScrollReveal from './homepage/components/ScrollReveal';
import NewArrivalsSection from './homepage/components/NewArrivalsSection';
import WelcomeOfferSection from './homepage/components/WelcomeOfferSection';
import FeaturedCollections from './homepage/components/FeaturedCollections';
import {
  OurJourneySection,
  MadeToOrderSection,
  DiamondVerificationSection,
  SuratCraftsmanshipSection,
  ContactSupportSection,
} from './homepage/components/TrustTransparencySection';

// AIChatWidget is now rendered globally in layout.tsx — no need to import here.

import type { HomepageData, HomepageCollection } from '@/lib/supabase/homepageService';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.detara.store';

// Homepage FAQ structured data for AEO — answers key customer questions
const homepageFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is DETARA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'DETARA is a luxury diamond jewellery brand offering certified engagement rings, diamond stud earrings, tennis bracelets, pendants and bespoke custom pieces. DETARA combines Scandinavian design precision with exceptional diamond quality. All diamonds are certified by IGI or GIA. Both natural and lab-grown diamond options are available. DETARA ships worldwide.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does DETARA offer lab-grown diamonds?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. DETARA offers both natural and lab-grown diamonds. Both options use certified diamonds with the same physical, chemical, and optical properties. Lab-grown diamonds offer the same brilliance and durability at a more accessible price point. All DETARA diamonds — natural and lab-grown — are certified by IGI or GIA.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I order custom jewellery from DETARA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. DETARA offers a full bespoke custom jewellery design service. You can create a custom engagement ring, pendant, earrings, or bracelet. The process includes a consultation, design proposal, production (4–6 weeks), and fully insured shipping. Custom pieces start from approximately €3,000. Contact DETARA via the custom jewellery page or WhatsApp to begin.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the KISS concept?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The DETARA KISS Collection is a curated selection of certified diamond jewellery — engagement rings, stud earrings, tennis bracelets, and pendants. KISS stands for the design philosophy of simplicity and precision: removing everything unnecessary until only the essential remains. The collection features pieces available in natural and lab-grown diamond options, across multiple metal choices.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does DETARA ship worldwide?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. DETARA ships worldwide with fully insured delivery. Shipping is available to the UK, Europe, USA, and internationally. All shipments are fully insured during transit. Delivery times vary by destination. Contact DETARA for specific shipping information for your country.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are DETARA diamonds certified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. All DETARA diamonds are certified by IGI (International Gemological Institute) or GIA (Gemological Institute of America) — the two most respected diamond grading laboratories in the world. Every certificate documents the diamond\'s cut, colour, clarity, and carat weight. DETARA works exclusively with D–G colour range diamonds and VVS clarity standards.',
      },
    },
  ],
};

// Server-side data fetch — replaces the old client useEffect + fetch('/api/homepage').
// Runs during the server render, so the HTML sent to the client already
// contains real content instead of empty placeholders waiting on a client fetch.
async function getHomepageData(): Promise<HomepageData | null> {
  try {
    const res = await fetch(`${baseUrl}/api/homepage`, {
      // Adjust caching to your needs: 'no-store' for always-fresh,
      // or next: { revalidate: N } for ISR-style caching.
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as HomepageData;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const data = await getHomepageData();

  const s = data?.sections || {};
  const isActive = (key: string) => !s[key] || s[key].is_active !== false;

  return (
    <>
      {/* Homepage FAQ structured data for AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqSchema) }}
      />
      <div>
        <div className="grain-overlay" aria-hidden="true" />
        <Header />
        <main style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {/* 1. Hero — shows the Autumn Edit offer while CAMPAIGN is live (src/lib/campaign.ts) */}
          <HeroSection section={s['hero'] || null} />

          {/* 2. Trust Strip */}
          {isActive('trust_strip') && <TrustStrip />}

          {/* 3. Shop by Category — 6 master categories only */}
          {isActive('shop_by_category') && <ShopByCategory />}

          {/* 3b. Featured Collections — uses Supabase collections if the API returns them,
                 otherwise the built-in fallback (KISS, Engagement, Tennis, Studs) */}
          {isActive('featured_collections') && (
            <FeaturedCollections
              section={s['featured_collections'] || null}
              collections={
                (data as { collections?: HomepageCollection[] } | null)?.collections || []
              }
            />
          )}

          {/* 4. Featured Products */}
          {isActive('featured_products') && (
            <FeaturedProducts
              section={s['featured_products'] || null}
              products={data?.featuredProducts || []}
            />
          )}

          {/* 4b. Top Products / New Arrivals */}
          <TopProducts products={data?.featuredProducts || []} />

          {/* 4c. New Arrivals */}
          <NewArrivalsSection products={data?.featuredProducts || []} />

          {/* 4d. Welcome offer — 10% off first order (always-on acquisition, #join) */}
          <WelcomeOfferSection />

          {/* 5. Custom Jewellery / Bespoke */}
          {isActive('custom_jewellery') && (
            <CustomJewellerySection section={s['custom_jewellery'] || null} />
          )}

          {/* 6. Natural vs Lab */}
          {isActive('natural_vs_lab') && (
            <NaturalVsLab section={s['natural_vs_lab'] || null} />
          )}

          {/* 7. Craftsmanship */}
          {isActive('craftsmanship') && (
            <CraftsmanshipSection section={s['craftsmanship'] || null} />
          )}

          {/* 8. Service Promise */}
          {isActive('service_promise') && <ServicePromise />}

          {/* 8b. Our Journey Trust Section */}
          <OurJourneySection />

          {/* 8c. Made-to-Order Process */}
          <MadeToOrderSection />

          {/* 8d. Diamond Verification */}
          <DiamondVerificationSection />

          {/* 8e. Surat Craftsmanship */}
          <SuratCraftsmanshipSection />

          {/* 9. Journal */}
          {isActive('journal') && (
            <JournalSection
              section={s['journal'] || null}
              posts={data?.journalPosts || []}
            />
          )}

          {/* 10. Final CTA — echoes the campaign while it's live */}
          {isActive('final_cta') && (
            <FinalCtaSection section={s['final_cta'] || null} />
          )}

          {/* 13. Contact Support */}
          <ContactSupportSection />
        </main>
        <Footer />
        <WhatsAppFloat />
        <ScrollReveal />
      </div>
    </>
  );
}