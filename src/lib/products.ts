export interface Product {
  id: string;
  slug: string;
  title: string;
  category: string;
  startingPriceEUR: number;
  startingPriceNOK: number;
  metalOptions: string[];
  diamondType: string[];
  caratRange: string;
  certification: string;
  productionTime: string;
  availability: string;
  image: string;
}

export const METAL_OPTIONS = [
  '14K White Gold',
  '14K Yellow Gold',
  '14K Rose Gold',
  '18K White Gold',
  '18K Yellow Gold',
  '18K Rose Gold',
  'Platinum 950',
];

export const DIAMOND_TYPES = ['Natural', 'Lab-Grown'];

export const CATEGORIES = [
  'Engagement Rings',
  'Diamond Stud Earrings',
  'Tennis Bracelets',
  'Diamond Bands',
  'Diamond Pendants',
] as const;

export type CategoryName = typeof CATEGORIES[number];

// EUR to NOK rate: 1 EUR ≈ 11.8 NOK
const EUR_TO_NOK = 11.8;
const eur = (e: number) => Math.round(e * EUR_TO_NOK / 100) * 100;

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const SHARED = {
  metalOptions: METAL_OPTIONS,
  diamondType: DIAMOND_TYPES,
  caratRange: '0.30ct–2.00ct',
  certification: 'IGI / GIA',
  productionTime: '3–5 weeks',
  availability: 'Made to Order',
};

// Curated Unsplash image pools per category
const RING_IMAGES = [
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
  'https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=800&q=80',
  'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&q=80',
  'https://images.unsplash.com/photo-1586104195538-050b9f74f58e?w=800&q=80',
  'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=800&q=80',
  'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&q=80',
];

const EARRING_IMAGES = [
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
  'https://images.unsplash.com/photo-1576022162879-b4273d85429a?w=800&q=80',
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80',
];

const BRACELET_IMAGES = [
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
  'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&q=80',
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80',
  'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&q=80',
];

const BAND_IMAGES = [
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
  'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=800&q=80',
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
];

const PENDANT_IMAGES = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80',
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
];

function getImageForCategory(category: string, index: number): string {
  switch (category) {
    case 'Engagement Rings':
      return RING_IMAGES[index % RING_IMAGES.length];
    case 'Diamond Stud Earrings':
      return EARRING_IMAGES[index % EARRING_IMAGES.length];
    case 'Tennis Bracelets':
      return BRACELET_IMAGES[index % BRACELET_IMAGES.length];
    case 'Diamond Bands':
      return BAND_IMAGES[index % BAND_IMAGES.length];
    case 'Diamond Pendants':
      return PENDANT_IMAGES[index % PENDANT_IMAGES.length];
    default:
      return RING_IMAGES[0];
  }
}

const rawProducts: Array<{
  id: string;
  title: string;
  category: string;
  startingPriceEUR: number;
}> = [
  // Engagement Rings (20) — starting from EUR 2,900
  { id: 'DET-ER-001', title: 'Classic Four Prong Solitaire', category: 'Engagement Rings', startingPriceEUR: 2900 },
  { id: 'DET-ER-002', title: 'Six Prong Solitaire', category: 'Engagement Rings', startingPriceEUR: 2900 },
  { id: 'DET-ER-003', title: 'Knife Edge Solitaire', category: 'Engagement Rings', startingPriceEUR: 3100 },
  { id: 'DET-ER-004', title: 'Cathedral Solitaire', category: 'Engagement Rings', startingPriceEUR: 3100 },
  { id: 'DET-ER-005', title: 'Bezel Solitaire', category: 'Engagement Rings', startingPriceEUR: 2900 },
  { id: 'DET-ER-006', title: 'Hidden Halo Solitaire', category: 'Engagement Rings', startingPriceEUR: 3400 },
  { id: 'DET-ER-007', title: 'Oval Solitaire Ring', category: 'Engagement Rings', startingPriceEUR: 3200 },
  { id: 'DET-ER-008', title: 'Cushion Solitaire Ring', category: 'Engagement Rings', startingPriceEUR: 3200 },
  { id: 'DET-ER-009', title: 'Emerald Cut Solitaire', category: 'Engagement Rings', startingPriceEUR: 3400 },
  { id: 'DET-ER-010', title: 'Princess Cut Solitaire', category: 'Engagement Rings', startingPriceEUR: 3100 },
  { id: 'DET-ER-011', title: 'Halo Diamond Ring', category: 'Engagement Rings', startingPriceEUR: 3600 },
  { id: 'DET-ER-012', title: 'Double Halo Ring', category: 'Engagement Rings', startingPriceEUR: 3900 },
  { id: 'DET-ER-013', title: 'Three Stone Ring', category: 'Engagement Rings', startingPriceEUR: 4200 },
  { id: 'DET-ER-014', title: 'Trilogy Diamond Ring', category: 'Engagement Rings', startingPriceEUR: 4200 },
  { id: 'DET-ER-015', title: 'Pavé Band Solitaire', category: 'Engagement Rings', startingPriceEUR: 3600 },
  { id: 'DET-ER-016', title: 'Split Shank Diamond Ring', category: 'Engagement Rings', startingPriceEUR: 3400 },
  { id: 'DET-ER-017', title: 'Vintage Inspired Ring', category: 'Engagement Rings', startingPriceEUR: 3800 },
  { id: 'DET-ER-018', title: 'Modern Minimal Solitaire', category: 'Engagement Rings', startingPriceEUR: 2900 },
  { id: 'DET-ER-019', title: 'East-West Diamond Ring', category: 'Engagement Rings', startingPriceEUR: 3200 },
  { id: 'DET-ER-020', title: 'Floating Diamond Ring', category: 'Engagement Rings', startingPriceEUR: 3400 },

  // Diamond Stud Earrings (8) — starting from EUR 1,400
  { id: 'DET-SE-001', title: 'Classic Round Diamond Studs', category: 'Diamond Stud Earrings', startingPriceEUR: 1400 },
  { id: 'DET-SE-002', title: 'Martini Set Diamond Studs', category: 'Diamond Stud Earrings', startingPriceEUR: 1400 },
  { id: 'DET-SE-003', title: 'Bezel Diamond Studs', category: 'Diamond Stud Earrings', startingPriceEUR: 1500 },
  { id: 'DET-SE-004', title: 'Princess Cut Diamond Studs', category: 'Diamond Stud Earrings', startingPriceEUR: 1500 },
  { id: 'DET-SE-005', title: 'Cushion Diamond Studs', category: 'Diamond Stud Earrings', startingPriceEUR: 1600 },
  { id: 'DET-SE-006', title: 'Halo Diamond Studs', category: 'Diamond Stud Earrings', startingPriceEUR: 1900 },
  { id: 'DET-SE-007', title: 'Emerald Cut Diamond Studs', category: 'Diamond Stud Earrings', startingPriceEUR: 1700 },
  { id: 'DET-SE-008', title: 'Oval Diamond Studs', category: 'Diamond Stud Earrings', startingPriceEUR: 1700 },

  // Tennis Bracelets (8) — starting from EUR 3,800
  { id: 'DET-BR-001', title: 'Classic Diamond Tennis Bracelet', category: 'Tennis Bracelets', startingPriceEUR: 3800 },
  { id: 'DET-BR-002', title: 'Round Diamond Line Bracelet', category: 'Tennis Bracelets', startingPriceEUR: 3800 },
  { id: 'DET-BR-003', title: 'Graduated Tennis Bracelet', category: 'Tennis Bracelets', startingPriceEUR: 4200 },
  { id: 'DET-BR-004', title: 'Bezel Set Diamond Bracelet', category: 'Tennis Bracelets', startingPriceEUR: 4000 },
  { id: 'DET-BR-005', title: 'Oval Diamond Tennis Bracelet', category: 'Tennis Bracelets', startingPriceEUR: 4400 },
  { id: 'DET-BR-006', title: 'Emerald Cut Tennis Bracelet', category: 'Tennis Bracelets', startingPriceEUR: 4600 },
  { id: 'DET-BR-007', title: 'Alternating Diamond Bracelet', category: 'Tennis Bracelets', startingPriceEUR: 4200 },
  { id: 'DET-BR-008', title: 'Double Row Tennis Bracelet', category: 'Tennis Bracelets', startingPriceEUR: 5800 },

  // Diamond Bands (8) — starting from EUR 1,200
  { id: 'DET-BD-001', title: 'Classic Diamond Eternity Band', category: 'Diamond Bands', startingPriceEUR: 1800 },
  { id: 'DET-BD-002', title: 'Half Eternity Band', category: 'Diamond Bands', startingPriceEUR: 1200 },
  { id: 'DET-BD-003', title: 'Channel Set Diamond Band', category: 'Diamond Bands', startingPriceEUR: 1400 },
  { id: 'DET-BD-004', title: 'Pavé Diamond Band', category: 'Diamond Bands', startingPriceEUR: 1600 },
  { id: 'DET-BD-005', title: 'Emerald Cut Diamond Band', category: 'Diamond Bands', startingPriceEUR: 1900 },
  { id: 'DET-BD-006', title: 'Baguette Diamond Band', category: 'Diamond Bands', startingPriceEUR: 1700 },
  { id: 'DET-BD-007', title: 'Alternating Diamond Band', category: 'Diamond Bands', startingPriceEUR: 1500 },
  { id: 'DET-BD-008', title: 'Vintage Diamond Band', category: 'Diamond Bands', startingPriceEUR: 2100 },

  // Diamond Pendants (6) — starting from EUR 1,100
  { id: 'DET-NK-001', title: 'Solitaire Diamond Pendant', category: 'Diamond Pendants', startingPriceEUR: 1100 },
  { id: 'DET-NK-002', title: 'Bezel Diamond Necklace', category: 'Diamond Pendants', startingPriceEUR: 1200 },
  { id: 'DET-NK-003', title: 'Halo Diamond Pendant', category: 'Diamond Pendants', startingPriceEUR: 1500 },
  { id: 'DET-NK-004', title: 'Floating Diamond Necklace', category: 'Diamond Pendants', startingPriceEUR: 1300 },
  { id: 'DET-NK-005', title: 'Emerald Cut Diamond Pendant', category: 'Diamond Pendants', startingPriceEUR: 1600 },
  { id: 'DET-NK-006', title: 'Oval Diamond Pendant', category: 'Diamond Pendants', startingPriceEUR: 1400 },
];

// Track per-category index for cycling images
const categoryIndexMap: Record<string, number> = {};

export const products: Product[] = rawProducts.map((p) => {
  if (categoryIndexMap[p.category] === undefined) {
    categoryIndexMap[p.category] = 0;
  }
  const idx = categoryIndexMap[p.category]++;
  return {
    ...SHARED,
    id: p.id,
    slug: toSlug(p.title),
    title: p.title,
    category: p.category,
    startingPriceEUR: p.startingPriceEUR,
    startingPriceNOK: eur(p.startingPriceEUR),
    image: getImageForCategory(p.category, idx),
  };
});

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  if (category === 'All') return products;
  return products.filter((p) => p.category === category);
}

export const categoryMap: Record<string, Product[]> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat] = products.filter((p) => p.category === cat);
    return acc;
  },
  {} as Record<string, Product[]>
);
