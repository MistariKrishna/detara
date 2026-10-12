'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';

interface JournalPost {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  author: string;
  category: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  reading_time: number | null;
}

// Static article content for the 4 published articles
const STATIC_ARTICLES: Record<string, Omit<JournalPost, 'id' | 'tags' | 'is_published' | 'is_featured' | 'seo_title' | 'seo_description'> & { id: string; tags: string[]; is_published: boolean; is_featured: boolean; seo_title: string | null; seo_description: string | null }> = {
  'how-to-choose-a-diamond-engagement-ring': {
    id: 'static-1',
    title: 'How to Choose a Diamond Engagement Ring',
    slug: 'how-to-choose-a-diamond-engagement-ring',
    excerpt: 'Selecting an engagement ring is one of the most considered purchases a person makes. Understanding the relationship between cut, clarity, and carat weight allows you to make a decision grounded in knowledge rather than pressure.',
    content: `<p>Selecting an engagement ring is one of the most considered purchases a person makes. Understanding the relationship between cut, clarity, and carat weight allows you to make a decision grounded in knowledge rather than pressure.</p>

<h2>Start with Cut Quality</h2>
<p>Cut is the single most important factor in a diamond's appearance. A well-cut diamond will appear more brilliant than a larger, poorly-cut stone. When evaluating cut, look for grades of Excellent or Ideal — these diamonds return the maximum amount of light to the eye.</p>

<p>The cut grade encompasses three visual properties: brightness (white light reflection), fire (dispersion of light into colours), and scintillation (the pattern of light and dark areas when the diamond moves). An Excellent cut optimises all three.</p>

<h2>Understanding Carat Weight</h2>
<p>Carat weight measures the mass of the diamond, not its size. Two diamonds of the same carat weight can appear very different in size depending on their cut proportions. A well-cut 1.00 ct diamond will often appear larger than a poorly-cut 1.20 ct stone.</p>

<p>Consider the finger size of the wearer. A 0.70 ct diamond on a size 5 finger will appear proportionally larger than the same stone on a size 8 finger. The visual impact of a diamond is always relative to its setting.</p>

<h2>Clarity and Colour</h2>
<p>For engagement rings, DETARA recommends D–G colour and VVS–VS clarity. Diamonds in this range are visually clean to the naked eye and offer exceptional brilliance without the premium of flawless stones.</p>

<p>Colour grades below H begin to show a faint warmth that becomes more visible in white gold or platinum settings. In yellow or rose gold, slightly warmer colours (H–I) can appear beautiful and are often preferred.</p>

<h2>Choosing the Setting</h2>
<p>The setting protects the diamond and defines the aesthetic of the ring. Solitaire settings place the diamond at the centre of attention with minimal distraction. Halo settings surround the centre stone with smaller diamonds, creating the appearance of a larger stone. Three-stone settings carry symbolic meaning — representing the past, present, and future.</p>

<p>Metal choice affects both appearance and durability. Platinum is the most durable and maintains its colour permanently. 18K white gold offers a similar appearance at a lower price point. Yellow and rose gold create a warmer, more romantic aesthetic.</p>

<h2>Certification</h2>
<p>Every DETARA diamond comes with certification from IGI or GIA — the world's most respected grading laboratories. A certificate confirms the diamond's specifications independently and provides assurance that the stone matches its description.</p>

<p>When purchasing a diamond engagement ring, always request the certificate and verify that the certificate number matches the laser inscription on the diamond's girdle.</p>`,
    cover_image: '/assets/images/category_engagement_rings.png',
    author: 'DETARA Editorial',
    category: 'Buying Guide',
    tags: ['engagement ring', 'diamond guide', 'buying guide'],
    is_published: true,
    is_featured: true,
    seo_title: 'How to Choose a Diamond Engagement Ring | DETARA',
    seo_description: 'Expert guide on selecting the perfect diamond engagement ring — cut, clarity, carat, and setting explained.',
    published_at: '2026-03-01T00:00:00Z',
    created_at: '2026-03-01T00:00:00Z',
    reading_time: 6,
  },
  'understanding-diamond-quality': {
    id: 'static-2',
    title: 'Understanding Diamond Quality',
    slug: 'understanding-diamond-quality',
    excerpt: 'The four characteristics that define a diamond — cut, color, clarity, and carat — each contribute differently to its appearance. Cut is the most critical factor, determining how light moves through the stone and returns to the eye.',
    content: `<p>The four characteristics that define a diamond — cut, colour, clarity, and carat — each contribute differently to its appearance. Understanding how these factors interact allows you to make an informed decision when selecting a diamond.</p>

<h2>Cut: The Most Important Factor</h2>
<p>Cut is the only characteristic that is entirely determined by human craftsmanship. A diamond's cut grade reflects the precision of its proportions, symmetry, and polish. An Excellent cut grade means the diamond has been crafted to maximise the return of light to the viewer's eye.</p>

<p>The GIA and IGI cut grading scales range from Excellent to Poor. DETARA works exclusively with Excellent cut diamonds, ensuring every piece in the collection delivers maximum brilliance.</p>

<h2>Colour: The Absence of Colour</h2>
<p>Diamond colour is graded on a scale from D (colourless) to Z (light yellow or brown). The most valuable diamonds are those with the least colour — D, E, and F grades are considered colourless and command a premium.</p>

<p>In practice, the difference between adjacent colour grades is extremely subtle and often invisible to the untrained eye. DETARA selects diamonds in the D–G range, which provides exceptional colour quality while remaining accessible.</p>

<h2>Clarity: Internal Characteristics</h2>
<p>Clarity refers to the presence of internal characteristics (inclusions) and surface features (blemishes). The GIA clarity scale ranges from Flawless (no inclusions visible under 10× magnification) to Included (inclusions visible to the naked eye).</p>

<p>VVS (Very Very Slightly Included) diamonds have inclusions that are extremely difficult to see even under magnification. VS (Very Slightly Included) diamonds have inclusions that are minor and difficult to see under 10× magnification. Both grades are considered eye-clean — no inclusions are visible without magnification.</p>

<h2>Carat: Weight and Size</h2>
<p>One carat equals 0.2 grams. Carat weight is the most straightforward of the four Cs to measure, but it is often misunderstood as a measure of size. Two diamonds of the same carat weight can appear very different in size depending on their cut proportions.</p>

<p>A well-cut 1.00 ct round brilliant diamond will typically measure approximately 6.5mm in diameter. A poorly-cut 1.00 ct diamond might measure only 6.0mm — appearing noticeably smaller despite the same weight.</p>

<h2>How the Four Cs Work Together</h2>
<p>The four Cs interact with each other. A diamond with an Excellent cut can compensate for slightly lower colour or clarity grades by maximising the return of light. Conversely, a poorly-cut diamond with exceptional colour and clarity will still appear dull and lifeless.</p>

<p>DETARA's approach is to prioritise cut quality above all other factors, then select diamonds with D–G colour and VVS–VS clarity. This combination ensures every piece delivers the brilliance and quality that defines the DETARA standard.</p>`,
    cover_image: '/assets/images/category_fine_jewellery.png',
    author: 'DETARA Editorial',
    category: 'Diamond Education',
    tags: ['diamond quality', '4Cs', 'diamond education'],
    is_published: true,
    is_featured: false,
    seo_title: 'Understanding Diamond Quality — The 4Cs | DETARA',
    seo_description: 'Learn about cut, colour, clarity, and carat — the four characteristics that define diamond quality.',
    published_at: '2026-02-01T00:00:00Z',
    created_at: '2026-02-01T00:00:00Z',
    reading_time: 5,
  },
  'lab-vs-natural-diamonds': {
    id: 'static-3',
    title: 'Lab vs Natural Diamonds',
    slug: 'lab-vs-natural-diamonds',
    excerpt: 'Lab-grown diamonds are chemically and optically identical to natural diamonds. Both are pure crystallized carbon. The distinction lies in origin: one formed over billions of years underground, the other produced in weeks using advanced technology.',
    content: `<p>Lab-grown diamonds are chemically and optically identical to natural diamonds. Both are pure crystallised carbon arranged in the same crystal structure. The distinction lies entirely in origin: one formed over billions of years underground, the other produced in weeks using advanced technology.</p>

<h2>What is a Lab-Grown Diamond?</h2>
<p>Lab-grown diamonds are created using one of two processes: High Pressure High Temperature (HPHT) or Chemical Vapour Deposition (CVD). Both methods replicate the conditions under which natural diamonds form, producing crystals with the same physical, chemical, and optical properties.</p>

<p>Lab-grown diamonds are not simulants. They are not cubic zirconia or moissanite — they are real diamonds, graded by the same laboratories (IGI, GIA) using the same criteria as natural diamonds.</p>

<h2>What is a Natural Diamond?</h2>
<p>Natural diamonds formed between 1 and 3.5 billion years ago, approximately 150–200 kilometres below the Earth's surface, under extreme heat and pressure. They were carried to the surface by volcanic eruptions and have been mined and traded for centuries.</p>

<p>The rarity of natural diamonds — particularly those with exceptional colour and clarity — is a significant part of their value. Each natural diamond is unique, with natural inclusions and characteristics that reflect its geological history.</p>

<h2>The Key Differences</h2>
<p>The primary difference between lab-grown and natural diamonds is origin. In terms of appearance, hardness, refractive index, and chemical composition, they are identical. Even trained gemologists cannot distinguish between them without specialised equipment.</p>

<p>Price is a significant differentiator. Lab-grown diamonds typically cost 60–80% less than comparable natural diamonds. This price difference reflects the difference in supply — natural diamonds are finite, while lab-grown diamonds can be produced in unlimited quantities.</p>

<h2>Which Should You Choose?</h2>
<p>The choice between lab-grown and natural diamonds is personal. Those who value rarity, geological heritage, and the traditional symbolism of natural diamonds may prefer natural stones. Those who prioritise value, accessibility, and a modern approach to luxury may prefer lab-grown diamonds.</p>

<p>DETARA offers both options across the collection. Both use certified diamonds with the same quality standards — D–G colour, VVS clarity, Excellent cut. The choice is yours.</p>`,
    cover_image: '/assets/images/journal_natural_vs_lab.png',
    author: 'DETARA Editorial',
    category: 'Diamond Education',
    tags: ['lab diamonds', 'natural diamonds', 'diamond comparison'],
    is_published: true,
    is_featured: false,
    seo_title: 'Lab vs Natural Diamonds — What is the Difference? | DETARA',
    seo_description: 'A clear comparison of lab-grown and natural diamonds — quality, price, and which is right for you.',
    published_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    reading_time: 5,
  },
  'scandinavian-jewelry-design-principles': {
    id: 'static-4',
    title: 'Scandinavian Jewelry Design Principles',
    slug: 'scandinavian-jewelry-design-principles',
    excerpt: 'Nordic design philosophy is built on restraint. The principle of removing everything unnecessary until only the essential remains applies as naturally to jewelry as it does to architecture. DETARA draws directly from this tradition.',
    content: `<p>Nordic design philosophy is built on restraint. The principle of removing everything unnecessary until only the essential remains applies as naturally to jewellery as it does to architecture or furniture. DETARA draws directly from this tradition.</p>

<h2>The Principle of Restraint</h2>
<p>Scandinavian design emerged in the early twentieth century as a response to ornate Victorian excess. Designers in Denmark, Sweden, Norway, and Finland developed a shared aesthetic language built on simplicity, functionality, and the honest use of materials.</p>

<p>In jewellery, this translates to clean lines, minimal ornamentation, and a focus on the intrinsic beauty of the materials themselves. A diamond solitaire in a simple four-prong setting is the purest expression of this philosophy — nothing distracts from the stone.</p>

<h2>Form Follows Function</h2>
<p>The Scandinavian design principle that form should follow function applies to jewellery in a specific way. A ring must be comfortable to wear daily. A necklace must sit correctly against the body. An earring must be light enough to wear for hours without discomfort.</p>

<p>DETARA designs are created with wearability as a primary consideration. Proportions are refined until the piece feels natural on the body. Settings are designed to protect the diamond while minimising the visual weight of the metal.</p>

<h2>The Beauty of Negative Space</h2>
<p>Scandinavian design makes deliberate use of negative space — the empty areas around and between elements. In jewellery, negative space allows the diamond to breathe, to be seen from multiple angles, and to interact with light without obstruction.</p>

<p>This is why DETARA solitaire settings use minimal metal. The prongs are thin and precisely placed. The band is refined to a proportion that supports the stone without competing with it.</p>

<h2>Timelessness Over Trend</h2>
<p>Scandinavian design has always prioritised longevity over fashion. Pieces are designed to remain relevant across decades, not seasons. This philosophy aligns naturally with fine jewellery, which is purchased to be worn for a lifetime and passed between generations.</p>

<p>DETARA does not design for trends. The collection is built on forms that have endured — the solitaire, the halo, the three-stone — refined through the lens of Nordic minimalism to create pieces that will remain elegant regardless of when they are worn.</p>

<h2>DETARA and the Nordic Tradition</h2>
<p>DETARA was founded on the belief that luxury jewellery should be clear, honest, and enduring. The Nordic design tradition provides the philosophical framework for this approach — restraint as a form of precision, simplicity as a form of sophistication.</p>

<p>Every DETARA piece is refined until only the essential remains. This is not minimalism for its own sake — it is the pursuit of the most direct expression of beauty.</p>`,
    cover_image: '/assets/images/category_rings.png',
    author: 'DETARA Editorial',
    category: 'Brand & Design',
    tags: ['design', 'Scandinavian', 'Nordic', 'jewellery design'],
    is_published: true,
    is_featured: false,
    seo_title: 'Scandinavian Jewelry Design Principles | DETARA',
    seo_description: 'How Nordic design philosophy shapes DETARA jewellery — restraint, simplicity, and timeless elegance.',
    published_at: '2025-12-01T00:00:00Z',
    created_at: '2025-12-01T00:00:00Z',
    reading_time: 5,
  },
};

const ALL_STATIC_SLUGS = Object.keys(STATIC_ARTICLES);

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert({ email: email.trim(), source: 'journal' }, { onConflict: 'email' });
      if (error) throw error;
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-[#1C1917] px-8 py-10 text-center">
      <p className="label-caps text-[#C9A96E] mb-3 tracking-[0.4em]" style={{ fontSize: '9px' }}>The DETARA Journal</p>
      <h3 className="font-serif text-xl font-light text-white mb-2">Private access to new collections</h3>
      <p className="text-sm text-white/50 font-light mb-6">Diamond education and selected releases.</p>
      {status === 'success' ? (
        <p className="text-sm text-[#C9A96E] font-light">Thank you for subscribing.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-0 max-w-sm mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 bg-white/10 border border-white/20 px-4 py-3 text-sm font-light text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A96E] transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-5 py-3 bg-[#C9A96E] text-[#1C1917] text-[10px] font-medium tracking-[0.2em] uppercase hover:bg-[#B8965A] transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {status === 'loading' ? '...' : 'Subscribe'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400 mt-2">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

export default function JournalArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<JournalPost | null>(null);
  const [related, setRelated] = useState<JournalPost[]>([]);
  const [prevPost, setPrevPost] = useState<JournalPost | null>(null);
  const [nextPost, setNextPost] = useState<JournalPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function fetchArticle() {
      setLoading(true);

      // First try to load from Supabase
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('journal_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        if (!error && data) {
          setArticle(data);

          // Fetch related articles (same category, excluding current)
          const { data: relatedData } = await supabase
            .from('journal_posts')
            .select('*')
            .eq('is_published', true)
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(3)
            .order('published_at', { ascending: false });

          setRelated(relatedData || []);

          // Fetch prev/next articles
          const { data: allPosts } = await supabase
            .from('journal_posts')
            .select('id, title, slug, published_at')
            .eq('is_published', true)
            .order('published_at', { ascending: false });

          if (allPosts) {
            const idx = allPosts.findIndex((p) => p.id === data.id);
            if (idx > 0) setNextPost(allPosts[idx - 1] as JournalPost);
            if (idx < allPosts.length - 1) setPrevPost(allPosts[idx + 1] as JournalPost);
          }

          setLoading(false);
          return;
        }
      } catch {
        // Fall through to static content
      }

      // Fall back to static articles
      const staticArticle = STATIC_ARTICLES[slug];
      if (staticArticle) {
        setArticle(staticArticle);

        // Related: other static articles in same category
        const relatedStatic = ALL_STATIC_SLUGS
          .filter((s) => s !== slug && STATIC_ARTICLES[s].category === staticArticle.category)
          .map((s) => STATIC_ARTICLES[s]);
        setRelated(relatedStatic.slice(0, 3));

        // Prev/next from static list
        const idx = ALL_STATIC_SLUGS.indexOf(slug);
        if (idx > 0) setPrevPost(STATIC_ARTICLES[ALL_STATIC_SLUGS[idx - 1]]);
        if (idx < ALL_STATIC_SLUGS.length - 1) setNextPost(STATIC_ARTICLES[ALL_STATIC_SLUGS[idx + 1]]);

        setLoading(false);
        return;
      }

      setNotFound(true);
      setLoading(false);
    }
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-bg pt-44 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-serif text-lg font-light text-muted">Loading article...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !article) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-bg pt-44 flex items-center justify-center">
          <div className="text-center">
            <p className="label-caps text-accent mb-4 tracking-[0.3em]">Journal</p>
            <p className="font-serif text-2xl font-light text-muted mb-6">Article not found.</p>
            <p className="text-sm text-muted font-light mb-8">This article may have been moved or is no longer available.</p>
            <Link href="/journal" className="btn-primary inline-block">Back to Journal</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const publishDate = article.published_at || article.created_at;

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <Header />
      <main className="bg-bg">
        {/* Article Hero */}
        <div className="pt-28 md:pt-36 lg:pt-44">
          {/* Breadcrumb */}
          <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-5 border-b border-[rgba(28,25,23,0.06)]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-3 flex-wrap">
              <Link href="/" className="label-caps text-muted hover:text-foreground transition-colors">Home</Link>
              <span className="text-muted/40 text-xs">—</span>
              <Link href="/journal" className="label-caps text-muted hover:text-foreground transition-colors">Journal</Link>
              <span className="text-muted/40 text-xs">—</span>
              <span className="label-caps text-accent">{article.category}</span>
            </nav>
          </div>

          {/* Article Header */}
          <div className="max-w-[860px] mx-auto px-5 md:px-8 pt-10 md:pt-14 pb-8 md:pb-12">
            <p className="text-[10px] uppercase tracking-[0.38em] text-[#B79252] mb-5 font-sans">{article.category}</p>
            <h1 className="font-serif font-light text-[#171512] leading-[1.05] mb-7 md:mb-9"
                style={{ fontSize: 'clamp(2rem, 4.5vw, 4rem)', letterSpacing: '-0.015em' }}>
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="font-sans font-light text-[#625C54] leading-[1.85] mb-8 max-w-[640px]"
                 style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)' }}>
                {article.excerpt}
              </p>
            )}
            <div className="w-10 h-px bg-[#B79252] mb-7" />
            <div className="flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#171512] flex items-center justify-center">
                  <span className="text-[#B79252] text-[8px] font-medium">D</span>
                </div>
                <span className="text-xs font-sans font-light text-[#625C54] tracking-wide">{article.author}</span>
              </div>
              <span className="text-[#81796F]/30">·</span>
              <span className="text-xs font-sans font-light text-[#625C54]">{formatDate(publishDate)}</span>
              {article.reading_time && (
                <>
                  <span className="text-[#81796F]/30">·</span>
                  <span className="text-xs font-sans font-light text-[#625C54]">{article.reading_time} min read</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article.cover_image && (
          <div className="max-w-[1280px] mx-auto px-5 md:px-8 mb-10 md:mb-14">
            <div className="relative aspect-[16/7] bg-[#F4F2EE] overflow-hidden">
              <Image
                src={article.cover_image}
                alt={article.title}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 1280px"
              />
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="max-w-[860px] mx-auto px-5 md:px-8 pb-16 md:pb-24">
          {article.content ? (
            <div
              className="journal-prose"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <p className="font-sans font-light text-[#625C54] leading-[1.9] text-base md:text-lg">{article.excerpt}</p>
          )}
        </div>

        {/* Newsletter */}
        <div className="max-w-[860px] mx-auto px-5 md:px-8 mb-16 md:mb-24">
          <NewsletterSignup />
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="py-20 md:py-28 px-6 md:px-10 lg:px-16 bg-[#EEE8DE] border-t border-[#171512]/8">
            <div className="max-w-[1280px] mx-auto">
              <div className="flex items-center gap-6 mb-14 md:mb-16">
                <p className="text-[10px] uppercase tracking-[0.38em] text-[#B79252] font-sans">Related Articles</p>
                <div className="flex-1 h-px bg-[#171512]/8" />
              </div>
              <div className="grid md:grid-cols-3 gap-8 md:gap-10">
                {related.map((rel) => (
                  <article key={rel.id} className="group border-t border-[#171512]/8 pt-8">
                    <Link href={`/journal/${rel.slug}`} className="block">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#B79252] font-sans mb-3">{rel.category}</p>
                      <h3 className="font-serif font-light text-[#171512] leading-[1.15] mb-3 group-hover:text-[#B79252] transition-colors duration-300"
                          style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)' }}>
                        {rel.title}
                      </h3>
                      <p className="font-sans font-light text-[#625C54] text-sm leading-relaxed line-clamp-2 mb-4">{rel.excerpt}</p>
                      <span className="text-[#B79252] text-sm group-hover:translate-x-1 transition-transform duration-300 inline-block">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Prev / Next Navigation */}
        {(prevPost || nextPost) && (
          <div className="border-t border-[rgba(28,25,23,0.06)] py-10 md:py-14 px-5 md:px-8">
            <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-8">
              {prevPost ? (
                <Link href={`/journal/${prevPost.slug}`} className="group flex items-center gap-3 max-w-[45%]">
                  <span className="text-muted group-hover:text-foreground transition-colors text-lg">←</span>
                  <div>
                    <p className="label-caps text-muted text-[9px] mb-1">Previous</p>
                    <p className="text-sm font-light text-foreground group-hover:text-accent transition-colors line-clamp-2">{prevPost.title}</p>
                  </div>
                </Link>
              ) : <div />}
              {nextPost ? (
                <Link href={`/journal/${nextPost.slug}`} className="group flex items-center gap-3 text-right max-w-[45%]">
                  <div>
                    <p className="label-caps text-muted text-[9px] mb-1">Next</p>
                    <p className="text-sm font-light text-foreground group-hover:text-accent transition-colors line-clamp-2">{nextPost.title}</p>
                  </div>
                  <span className="text-muted group-hover:text-foreground transition-colors text-lg">→</span>
                </Link>
              ) : <div />}
            </div>
          </div>
        )}

        {/* Back to Journal */}
        <div className="py-10 px-5 md:px-8 text-center border-t border-[#171512]/8">
          <Link href="/journal" className="text-[10px] uppercase tracking-[0.38em] text-[#B79252] hover:text-[#171512] transition-colors font-sans">
            ← Back to Journal
          </Link>
        </div>
      </main>
      <Footer />

      <style jsx global>{`
        .journal-prose p {
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          color: #625C54;
          line-height: 1.9;
          font-size: clamp(0.95rem, 1.3vw, 1.1rem);
          margin-bottom: 1.75rem;
        }
        .journal-prose p:last-child { margin-bottom: 0; }
        .journal-prose p:first-of-type::first-letter {
          font-family: 'Fraunces', serif;
          font-size: 3.5rem;
          color: #B79252;
          float: left;
          line-height: 0.8;
          margin-right: 0.2em;
          margin-top: 0.1em;
        }
        .journal-prose h2 {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: clamp(1.3rem, 2.2vw, 1.9rem);
          color: #171512;
          line-height: 1.15;
          margin-top: 3.5rem;
          padding-top: 2.5rem;
          margin-bottom: 1.25rem;
          border-top: 1px solid rgba(23,21,18,0.08);
          letter-spacing: -0.01em;
        }
        .journal-prose h3 {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.32em;
          color: #B79252;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
        }
        .journal-prose strong {
          color: #171512;
          font-weight: 400;
        }
        .journal-prose em {
          font-style: italic;
        }
        .journal-prose a {
          color: #B79252;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .journal-prose ul {
          list-style: none;
          margin-bottom: 1.75rem;
          padding: 0;
        }
        .journal-prose li {
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          color: #625C54;
          font-size: clamp(0.9rem, 1.2vw, 1rem);
          line-height: 1.8;
          padding-left: 1.5rem;
          position: relative;
          margin-bottom: 0.5rem;
        }
        .journal-prose li::before {
          content: '—';
          position: absolute;
          left: 0;
          color: #B79252;
        }
      `}</style>
    </>
  );
}
