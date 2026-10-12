'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface SwipeGalleryImage {
  url: string;
  alt: string;
  label?: string;
}

interface MobileSwipeGalleryProps {
  images: SwipeGalleryImage[];
  selectedView?: number;
  onViewChange?: (index: number) => void;
  aspectRatio?: string;
  priority?: boolean;
}

export default function MobileSwipeGallery({
  images,
  selectedView = 0,
  onViewChange,
  aspectRatio = '4/5',
  priority = false,
}: MobileSwipeGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(selectedView);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(images.length - 1, index));
      setCurrentIndex(clamped);
      onViewChange?.(clamped);
    },
    [images.length, onViewChange]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientX);
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart === null) return;
    const deltaX = e.touches[0].clientX - dragStart;
    const deltaY = e.touches[0].clientY - (e.touches[0].clientY); // vertical delta placeholder
    // Only track horizontal movement — let vertical scroll pass through
    setDragOffset(deltaX);
    if (Math.abs(deltaX) > 8) setIsDragging(true);
  };

  const handleTouchEnd = () => {
    if (dragStart === null) return;
    const threshold = 50;
    if (dragOffset < -threshold) goTo(currentIndex + 1);
    else if (dragOffset > threshold) goTo(currentIndex - 1);
    setDragStart(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStart(e.clientX);
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart === null) return;
    const delta = e.clientX - dragStart;
    setDragOffset(delta);
    if (Math.abs(delta) > 8) setIsDragging(true);
  };

  const handleMouseUp = () => {
    if (dragStart === null) return;
    const threshold = 50;
    if (dragOffset < -threshold) goTo(currentIndex + 1);
    else if (dragOffset > threshold) goTo(currentIndex - 1);
    setDragStart(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="w-full select-none">
      {/* Main swipe area */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ aspectRatio, touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Slides */}
        <div
          className="flex h-full"
          style={{
            width: `${images.length * 100}%`,
            transform: `translateX(calc(${-currentIndex * (100 / images.length)}% + ${dragOffset / images.length}px))`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative h-full flex-shrink-0 bg-[#F4F2EE]"
              style={{ width: `${100 / images.length}%` }}
            >
              {img.url ? (
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  priority={priority && idx === 0}
                  className="object-cover object-center"
                  sizes="100vw"
                  loading={priority && idx === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-[#F4F2EE]" />
              )}
            </div>
          ))}
        </div>

        {/* Label badge */}
        {images[currentIndex]?.label && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="label-caps text-white bg-[rgba(28,25,23,0.55)] px-2.5 py-1 text-[9px] tracking-[0.2em]">
              {images[currentIndex].label}
            </span>
          </div>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className="tap-transparent"
                aria-label={`View ${idx + 1}`}
                style={{ touchAction: 'manipulation' }}
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: idx === currentIndex ? '16px' : '6px',
                    height: '6px',
                    background: idx === currentIndex ? '#C9A96E' : 'rgba(255,255,255,0.6)',
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Counter */}
        <div className="absolute top-3 right-3 z-10">
          <span className="label-caps text-white bg-[rgba(28,25,23,0.45)] px-2 py-1 text-[8px] tracking-wider">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Thumbnail strip — desktop/tablet only */}
      <div className="hidden md:grid grid-cols-4 gap-2 mt-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`relative aspect-square bg-[#F4F2EE] overflow-hidden border-2 transition-all duration-200 ${
              currentIndex === idx
                ? 'border-[#1A1A1A]'
                : 'border-transparent hover:border-[rgba(201,169,110,0.5)]'
            }`}
            aria-label={`View ${img.label || idx + 1}`}
          >
            {img.url ? (
              <Image
                src={img.url}
                alt={img.alt}
                fill
                className="object-cover object-center"
                sizes="14vw"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#F4F2EE]" />
            )}
            {img.label && (
              <div className="absolute inset-0 flex items-end justify-center pb-1.5 bg-gradient-to-t from-[rgba(28,25,23,0.35)] to-transparent">
                <span className="label-caps text-white text-[7px] tracking-[0.15em]">{img.label}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Mobile: horizontal thumbnail strip */}
      <div className="flex md:hidden gap-2 mt-2 overflow-x-auto scrollbar-none px-0.5 pb-1">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`relative flex-shrink-0 w-16 h-16 bg-[#F4F2EE] overflow-hidden border-2 transition-all duration-200 tap-transparent ${
              currentIndex === idx
                ? 'border-[#1A1A1A]'
                : 'border-transparent'
            }`}
            aria-label={`View ${img.label || idx + 1}`}
            style={{ touchAction: 'manipulation' }}
          >
            {img.url ? (
              <Image
                src={img.url}
                alt={img.alt}
                fill
                className="object-cover object-center"
                sizes="64px"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#F4F2EE]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
