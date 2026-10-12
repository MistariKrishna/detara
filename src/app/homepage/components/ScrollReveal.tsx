'use client';

import { useEffect } from 'react';

const SELECTORS = [
  '.reveal-item',
  '.reveal-scale',
  '.reveal-fade',
  '.reveal-left',
  '.reveal-right',
  '.footer-reveal',
];

function makeVisible(el: Element) {
  el.classList.add('is-visible');
}

export default function ScrollReveal() {
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const observeAll = () => {
      // Disconnect previous observer
      if (observer) observer.disconnect();

      const items = Array.from(
        document.querySelectorAll<Element>(SELECTORS.join(', '))
      ).filter((el) => !el.classList.contains('is-visible'));

      if (items.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              makeVisible(entry.target);
              observer?.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.05,
          rootMargin: '0px 0px -20px 0px',
        }
      );

      items.forEach((item) => {
        // If already in viewport (e.g. above the fold), reveal immediately
        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          makeVisible(item);
        } else {
          observer?.observe(item);
        }
      });
    };

    // Immediate first pass
    observeAll();

    // Second pass after short delay — catches async-rendered elements
    const t1 = setTimeout(observeAll, 200);
    // Third pass — catches lazy-loaded sections
    const t2 = setTimeout(observeAll, 600);

    // Hard fallback: reveal ALL remaining hidden elements after 2.5s
    // This ensures content is NEVER permanently invisible if JS timing fails
    const fallback = setTimeout(() => {
      document.querySelectorAll<Element>(SELECTORS.join(', ')).forEach((el) => {
        if (!el.classList.contains('is-visible')) {
          makeVisible(el);
        }
      });
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(fallback);
      observer?.disconnect();
    };
  }, []);

  return null;
}