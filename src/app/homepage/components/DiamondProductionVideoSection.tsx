'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

// Replace these placeholder URLs with your actual production video files
const PRODUCTION_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
const PRODUCTION_VIDEO_POSTER = 'https://img.rocket.new/generatedImages/rocket_gen_img_147bb36e3-1786049051962.png';

interface VideoCardProps {
  videoSrc: string;
  poster: string;
  title: string;
  description: string;
  badge?: string;
}

function VideoCard({ videoSrc, poster, title, description, badge }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative overflow-hidden group cursor-pointer" style={{ aspectRatio: '9/16', backgroundColor: '#17110F' }} onClick={togglePlay}>
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        muted
        playsInline
        loop
        preload="metadata"
        onLoadedData={() => setVideoLoaded(true)}
        onEnded={() => setIsPlaying(false)}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: videoLoaded ? 1 : 0 }}
      />
      {/* Poster fallback */}
      {!videoLoaded && (
        <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#17110F]/90 via-[#17110F]/20 to-transparent" />

      {/* Badge */}
      {badge && (
        <div className="absolute top-4 left-4 z-10">
          <span className="label-caps text-[9px] tracking-[0.3em] px-3 py-1" style={{ backgroundColor: 'rgba(198,161,91,0.9)', color: '#17110F' }}>
            {badge}
          </span>
        </div>
      )}

      {/* Play / Pause button */}
      <div className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <div className="w-14 h-14 border border-white/50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '2px' }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
        <p className="text-white font-light text-sm mb-1 leading-snug">{title}</p>
        <p className="text-white/50 text-xs font-light leading-relaxed">{description}</p>
      </div>

      {/* Mute toggle */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="absolute bottom-4 right-4 z-20 w-8 h-8 border border-white/30 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          {isMuted ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export default function DiamondProductionVideoSection() {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [mainPlaying, setMainPlaying] = useState(false);
  const [mainMuted, setMainMuted] = useState(true);
  const [mainLoaded, setMainLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleMainPlay = () => {
    if (!mainVideoRef.current) return;
    if (mainPlaying) {
      mainVideoRef.current.pause();
      setMainPlaying(false);
    } else {
      mainVideoRef.current.play();
      setMainPlaying(true);
    }
  };

  const toggleMainMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mainVideoRef.current) return;
    mainVideoRef.current.muted = !mainMuted;
    setMainMuted(!mainMuted);
  };

  // Secondary showcase videos — replace src with your actual video URLs
  const showcaseVideos: VideoCardProps[] = [
    {
      videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      poster: PRODUCTION_VIDEO_POSTER,
      title: 'Diamond Setting',
      description: 'Precision stone placement by master craftsmen',
      badge: 'CRAFTSMANSHIP',
    },
    {
      videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      poster: PRODUCTION_VIDEO_POSTER,
      title: 'Metal Finishing',
      description: 'Hand-polished to a mirror finish',
      badge: 'FINISHING',
    },
    {
      videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      poster: PRODUCTION_VIDEO_POSTER,
      title: 'Quality Inspection',
      description: 'Every piece inspected before dispatch',
      badge: 'QUALITY',
    },
  ];

  return (
    <section className="py-20 md:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: '#0E0B09', maxWidth: '100vw' }}>
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">

        {/* Section Header */}
        <div className="text-center mb-14 md:mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-10 h-[1px]" style={{ backgroundColor: 'rgba(198,161,91,0.5)' }} />
            <p className="label-caps text-[10px] tracking-[0.5em]" style={{ color: '#C6A15B' }}>Behind the Jewellery</p>
            <div className="w-10 h-[1px]" style={{ backgroundColor: 'rgba(198,161,91,0.5)' }} />
          </div>
          <h2 className="heading-display text-[clamp(1.8rem,5vw,4rem)] text-white font-light leading-[0.95] mb-5">
            WHERE DIAMONDS<br />BECOME JEWELLERY
          </h2>
          <p className="text-sm md:text-base text-white/50 font-light leading-relaxed max-w-xl mx-auto">
            From diamond sourcing in Surat to the finished piece — a rare look at the craftsmanship behind every DETARA creation.
          </p>
        </div>

        {/* Main Feature Video */}
        <div
          className="relative w-full overflow-hidden mb-6 md:mb-8 cursor-pointer group"
          style={{ aspectRatio: '16/9', backgroundColor: '#17110F' }}
          onClick={toggleMainPlay}
        >
          <video
            ref={mainVideoRef}
            src={PRODUCTION_VIDEO_URL}
            poster={PRODUCTION_VIDEO_POSTER}
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setMainLoaded(true)}
            onEnded={() => setMainPlaying(false)}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: mainLoaded ? 1 : 0 }}
          />
          {!mainLoaded && (
            <img src={PRODUCTION_VIDEO_POSTER} alt="Diamond jewellery production" className="absolute inset-0 w-full h-full object-cover" />
          )}

          {/* Cinematic overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0B09]/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E0B09]/40 via-transparent to-transparent" />

          {/* Play/Pause */}
          <div className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-300 ${mainPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            <div className="w-20 h-20 border border-white/40 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
              {mainPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '3px' }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </div>
          </div>

          {/* Feature label */}
          <div className="absolute top-5 left-5 z-10">
            <span className="label-caps text-[9px] tracking-[0.35em] px-3 py-1.5" style={{ backgroundColor: 'rgba(198,161,91,0.9)', color: '#17110F' }}>
              PRODUCTION FILM
            </span>
          </div>

          {/* Bottom caption */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-8">
            <p className="text-white font-light text-lg md:text-xl mb-1">The Making of DETARA</p>
            <p className="text-white/50 text-sm font-light">Diamond sourcing · Jewellery crafting · Quality control · Surat, India</p>
          </div>

          {/* Mute toggle */}
          {mainPlaying && (
            <button
              onClick={toggleMainMute}
              aria-label={mainMuted ? 'Unmute video' : 'Mute video'}
              className="absolute bottom-5 right-5 z-20 w-10 h-10 border border-white/30 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              {mainMuted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Secondary Video Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-12 md:mb-16">
          {showcaseVideos.map((video, i) => (
            <VideoCard key={i} {...video} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="w-[1px] h-12 mx-auto mb-8" style={{ backgroundColor: 'rgba(198,161,91,0.3)' }} />
          <p className="text-white/40 text-xs font-light tracking-widest uppercase mb-6">
            Every piece is made to order — crafted specifically for you
          </p>
          <Link
            href="/custom-jewelry"
            className="inline-flex items-center gap-4 label-caps text-xs tracking-[0.35em] px-8 py-4 transition-all duration-300"
            style={{ border: '1px solid rgba(198,161,91,0.5)', color: '#C6A15B' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(198,161,91,0.08)'; e.currentTarget.style.borderColor = '#C6A15B'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(198,161,91,0.5)'; }}
          >
            START YOUR CUSTOM ORDER <span className="text-sm">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
