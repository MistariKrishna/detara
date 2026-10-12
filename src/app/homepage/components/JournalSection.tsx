'use client';

import React from 'react';
import Link from 'next/link';
import type { HomepageJournalPost } from '@/lib/supabase/homepageService';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface JournalSectionProps {
  section: HomepageSection | null;
  posts: HomepageJournalPost[];
}

const JOURNAL_FALLBACK_IMAGES: Record<string, string> = {
  'care': '/assets/images/journal_jewellery_care.png',
  'diamond': '/assets/images/journal_natural_vs_lab.png',
  'lab': '/assets/images/journal_natural_vs_lab.png',
  'natural': '/assets/images/journal_natural_vs_lab.png',
  'engagement': '/assets/images/category_engagement_rings.png',
  'ring': '/assets/images/category_rings.png',
  'earring': '/assets/images/category_diamond_studs.png',
  'bracelet': '/assets/images/category_tennis_bracelet.png',
  'necklace': '/assets/images/category_necklaces.png',
  'custom': '/assets/images/category_custom_jewellery.png',
  'men': '/assets/images/category_mens_jewellery.png',
};

const DEFAULT_FALLBACK = '/assets/images/journal_natural_vs_lab.png';

function getJournalFallback(title: string, category: string | null): string {
  const text = `${title} ${category || ''}`.toLowerCase();
  for (const [key, img] of Object.entries(JOURNAL_FALLBACK_IMAGES)) {
    if (text.includes(key)) return img;
  }
  return DEFAULT_FALLBACK;
}

// Hydration-safe date formatter — uses a fixed locale to produce identical output
// on server and client. Never uses toLocaleDateString() without explicit locale.
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    // Extract UTC date parts to avoid timezone-induced day shifts between SSR and client
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getUTCMonth()];
    return `${day} ${month} ${year}`;
  } catch {
    return '';
  }
}

export default function JournalSection({ section, posts }: JournalSectionProps) {
  const title = section?.title || 'FROM THE JOURNAL';
  const description = section?.description || 'Diamond education, jewellery guides and stories from DETARA.';
  const ctaText = section?.cta_text || 'READ THE JOURNAL';
  const ctaHref = section?.cta_href || '/journal';

  if (posts.length === 0) return null;

  return (
    <section className="py-16 md:py-24 lg:py-32" style={{ maxWidth: '100vw', backgroundColor: '#2B211C' }}>
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-14 gap-4 reveal-item">
          <div>
            <p className="label-caps mb-3" style={{ color: '#C6A15B' }}>Journal</p>
            <h2 className="heading-serif text-2xl md:text-3xl lg:text-4xl font-light" style={{ color: '#F6F1E8' }}>{title}</h2>
            {description && (
              <p className="text-sm font-light mt-2 max-w-md" style={{ color: 'rgba(246,241,232,0.72)' }}>{description}</p>
            )}
          </div>
          <Link
            href={ctaHref}
            className="label-caps transition-colors flex items-center gap-2 self-start md:self-auto"
            style={{ color: '#C6A15B' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F6F1E8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#C6A15B')}
          >
            {ctaText} <span>→</span>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {posts.slice(0, 3).map((post) => {
            const coverImage = post.cover_image || getJournalFallback(post.title, post.category);
            const dateStr = formatDate(post.published_at);
            return (
              <Link
                key={post.id}
                href={`/journal/${post.slug || post.id}`}
                className="group block"
              >
                <div className="relative aspect-[16/10] overflow-hidden mb-4" style={{ backgroundColor: '#F6F1E8' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  {post.category && (
                    <span className="absolute top-3 left-3 bg-white/90 text-[9px] font-medium tracking-widest px-2 py-1" style={{ color: '#211B18' }}>
                      {post.category.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3
                    className="text-sm md:text-base font-light mb-2 leading-snug line-clamp-2 transition-colors"
                    style={{ color: '#F6F1E8' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#C6A15B')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#F6F1E8')}
                  >
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs font-light leading-relaxed line-clamp-2 mb-3" style={{ color: 'rgba(246,241,232,0.66)' }}>
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] font-light" style={{ color: 'rgba(246,241,232,0.52)' }}>
                    {post.reading_time && <span>{post.reading_time} min read</span>}
                    {dateStr && (
                      <>
                        <span>·</span>
                        <span>{dateStr}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}