/**
 * DETARA — active homepage campaign
 * Place at: src/lib/campaign.ts
 *
 * One place to change all promotional copy. When the next campaign starts
 * (Autumn Treat, Black Friday, Gift Something Timeless), edit this file only.
 *
 * The seasonal campaign switches itself OFF after `endsAt`, and the homepage
 * falls back to the copy saved in the admin panel / Supabase. That way an
 * expired offer is never left showing.
 * The welcome offer (10% first order) is always-on and controlled separately
 * by `WELCOME_OFFER.enabled`.
 */

export const CAMPAIGN = {
  id: 'autumn-edit-2026',
  // 7 Oct – 31 Oct 2026 (UK is on GMT from 25 Oct, so UTC midnight = UK midnight)
  startsAt: '2026-10-07T00:00:00Z',
  endsAt: '2026-11-01T00:00:00Z',

  hero: {
    title: 'THE AUTUMN EDIT',
    subtitle: 'Timeless jewellery for the season ahead.',
    offer: 'Up to 20% off selected pieces',
    ctaText: 'SHOP NOW',
    // Switch to '/collections/autumn-edit' once that landing page is live.
    ctaHref: '/products',
  },

  finalCta: {
    title: 'MADE FOR THE SEASON.',
    description: 'The Autumn Edit — up to 20% off selected pieces, for a limited time.',
    ctaText: 'SHOP THE COLLECTION',
    ctaHref: '/products',
  },
} as const;

export const WELCOME_OFFER = {
  enabled: true,
  announcement: ['Free shipping across Europe', '10% off your first order*'],
  eyebrow: 'Welcome to DETARA',
  title: 'Your first DETARA piece',
  description: 'Enjoy 10% off your first order when you join our list.',
  ctaText: 'JOIN DETARA',
  smallPrint:
    '*New subscribers only. Valid on a first order, single use. Cannot be combined with other offers, including Autumn Edit pricing.',
  // Your existing newsletter / subscribe API route — confirm the path.
  subscribeEndpoint: '/api/newsletter',
  anchorId: 'join',
} as const;

export function isCampaignLive(now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= Date.parse(CAMPAIGN.startsAt) && t < Date.parse(CAMPAIGN.endsAt);
}