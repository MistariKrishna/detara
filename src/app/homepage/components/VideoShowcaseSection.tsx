'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import type { HomepageSection } from '@/lib/supabase/homepageService';

interface VideoShowcaseSectionProps {
  section: HomepageSection | null;
}

export default function VideoShowcaseSection({ section }: VideoShowcaseSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const title = section?.title || 'CRAFTED IN LIGHT.';
  const subtitle = section?.subtitle || 'Every diamond. Every detail. Every moment.';
  const description = section?.description || 'Experience the brilliance of DETARA diamond jewellery — precision-crafted for those who seek the exceptional.';
  const ctaText = section?.cta_text || 'EXPLORE THE COLLECTION';
  const ctaHref = section?.cta_href || '/products';
  const videoUrl = section?.video_url || null;
  const posterUrl = section?.video_poster_url || section?.image_url || null;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const showVideo = videoUrl && !prefersReducedMotion;

  // If no video and no poster, render a premium text-only cinematic section
  if (!showVideo && !posterUrl) {
    return (
      <section className="relative py-24 md:py-36 lg:py-48 overflow-hidden" style={{ maxWidth: '100vw', backgroundColor: '#5B4636' }}>
        {/* Decorative grain */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C6A15B]/5 to-transparent" />
        <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-8 text-center">
          <div className="w-[1px] h-16 mx-auto mb-10" style={{ backgroundColor: 'rgba(212,176,122,0.4)' }} />
          <p className="label-caps tracking-[0.5em] mb-6 text-xs" style={{ color: '#C6A15B' }}>The DETARA Experience</p>
          <h2 className="heading-display text-[clamp(2.5rem,8vw,7rem)] text-white font-light leading-[0.9] mb-8">
            {title}
          </h2>
          <p className="text-base md:text-lg text-white/50 font-light italic mb-4 max-w-xl mx-auto">{subtitle}</p>
          <p className="text-sm text-white/40 font-light leading-relaxed max-w-md mx-auto mb-12">{description}</p>
          <div className="w-[1px] h-16 mx-auto mb-10" style={{ backgroundColor: 'rgba(212,176,122,0.4)' }} />
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-4 label-caps hover:text-white transition-colors tracking-[0.4em] text-xs"
            style={{ color: '#C6A15B' }}
          >
            {ctaText} <span className="text-base">→</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#17110F]" style={{ minHeight: 'clamp(500px, 80vh, 900px)', maxWidth: '100vw' }}>
      {/* Video / Poster background */}
      <div className="absolute inset-0">
        {showVideo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              poster={posterUrl || undefined}
              onLoadedData={() => setVideoLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1500 ${videoLoaded ? 'opacity-90' : 'opacity-0'}`}
            >
              <source src={videoUrl} type="video/mp4" />
              <source src={videoUrl} type="video/webm" />
            </video>
            {/* Poster while loading */}
            {!videoLoaded && posterUrl && (
              <img
                src={posterUrl}
                alt="DETARA diamond jewellery showcase"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
            )}
          </>
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt="DETARA diamond jewellery showcase"
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
        ) : null}

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#17110F] via-[#17110F]/20 to-[#17110F]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17110F]/60 via-transparent to-[#17110F]/30" />
        {/* Letterbox bars for cinematic feel */}
        <div className="absolute top-0 left-0 right-0 h-[6%] bg-[#17110F]" />
        <div className="absolute bottom-0 left-0 right-0 h-[6%] bg-[#17110F]" />
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-start justify-end px-6 md:px-12 lg:px-20 pb-16 md:pb-24 lg:pb-32"
        style={{ minHeight: 'clamp(500px, 80vh, 900px)', paddingTop: 'clamp(80px, 12vh, 160px)' }}
      >
        <div className="max-w-2xl">
          {/* Gold accent line */}
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <div className="w-10 h-[1px]" style={{ backgroundColor: '#C6A15B' }} />
            <p className="label-caps tracking-[0.45em] text-[10px]" style={{ color: '#C6A15B' }}>The DETARA Experience</p>
          </div>

          <h2 className="heading-display text-[clamp(2rem,6vw,5rem)] text-white font-light leading-[0.92] mb-4 md:mb-6">
            {title}
          </h2>

          <p className="text-base md:text-lg text-white/60 font-light italic mb-3 leading-relaxed">
            {subtitle}
          </p>

          <p className="text-sm text-white/40 font-light leading-relaxed mb-8 md:mb-10 max-w-md">
            {description}
          </p>

          <Link
            href={ctaHref}
            className="inline-flex items-center gap-4 px-8 py-4 label-caps text-xs tracking-[0.35em] transition-all duration-300"
            style={{ border: '1px solid rgba(212,176,122,0.6)', color: '#C6A15B' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(212,176,122,0.1)'; e.currentTarget.style.borderColor = '#C6A15B'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(212,176,122,0.6)'; }}
          >
            {ctaText}
            <span className="text-sm">→</span>
          </Link>
        </div>
      </div>

      {/* Mute toggle — only shown when video is playing */}
      {showVideo && videoLoaded && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-20 w-10 h-10 border border-white/30 text-white/60 hover:text-white hover:border-white/60 transition-all flex items-center justify-center text-xs"
        >
          {isMuted ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}

      {/* Admin hint — only in dev */}
      {!videoUrl && (
        <div className="absolute top-4 left-4 z-20 hidden">
          <span className="text-[10px] text-white/30">Add video in Admin → Homepage → Video Showcase</span>
        </div>
      )}
    </section>
  );
}