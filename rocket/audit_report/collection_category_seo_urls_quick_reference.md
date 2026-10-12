# Collection & Category SEO URLs — Quick Reference

## URL Structure

### Collections
```
/collections/{slug}

Examples:
- /collections/engagement-rings
- /collections/kiss-collection
- /collections/tennis-bracelets
- /collections/custom-jewellery
```

### Categories
```
/categories/{slug}

Examples:
- /categories/rings-master (master category)
- /categories/solitaire-rings-sub (subcategory)
- /categories/engagement-rings (standalone category)
```

## Redirect Mapping

### Old → New
```
/products?category_id=11111111-0001-0001-0001-000000000001
  → /categories/rings-master (HTTP 301)

/products?category_id=11111111-0001-0001-0001-000000000002
  → /categories/earrings-master (HTTP 301)

/products?category_id=11111111-0001-0001-0001-000000000003
  → /categories/necklaces-pendants-master (HTTP 301)

/products?category_id=11111111-0001-0001-0001-000000000004
  → /categories/bracelets-master (HTTP 301)

/products?category_id=11111111-0001-0001-0001-000000000005
  → /categories/mens-jewellery-master (HTTP 301)

/products?category_id=11111111-0001-0001-0001-000000000006
  → /categories/gemstone-jewellery-master (HTTP 301)
```

## Collections (13 Total)

| Name | Slug | URL |
|------|------|-----|
| Engagement Rings | engagement-rings | /collections/engagement-rings |
| Kiss Collection | kiss-collection | /collections/kiss-collection |
| Tennis Bracelets | tennis-bracelets | /collections/tennis-bracelets |
| Diamond Bands | diamond-bands | /collections/diamond-bands |
| Diamond Pendants | diamond-pendants | /collections/diamond-pendants |
| Earrings | earrings | /collections/earrings |
| Necklaces | necklaces | /collections/necklaces |
| Bracelets | bracelets | /collections/bracelets |
| Wedding Rings | wedding-rings | /collections/wedding-rings |
| Men's Collection | mens-collection | /collections/mens-collection |
| Custom Jewellery | custom-jewellery | /collections/custom-jewellery |
| Best Sellers | best-sellers | /collections/best-sellers |
| New Arrivals | new-arrivals | /collections/new-arrivals |

## Master Categories (6 Total)

| Name | Slug | URL |
|------|------|-----|
| Rings | rings-master | /categories/rings-master |
| Earrings | earrings-master | /categories/earrings-master |
| Necklaces & Pendants | necklaces-pendants-master | /categories/necklaces-pendants-master |
| Bracelets | bracelets-master | /categories/bracelets-master |
| Men's Jewellery | mens-jewellery-master | /categories/mens-jewellery-master |
| Gemstone Jewellery | gemstone-jewellery-master | /categories/gemstone-jewellery-master |

## Subcategories (30 Total)

### Rings (7)
- solitaire-rings-sub → /categories/solitaire-rings-sub
- halo-rings-sub → /categories/halo-rings-sub
- three-stone-rings-sub → /categories/three-stone-rings-sub
- toi-et-moi-rings-sub → /categories/toi-et-moi-rings-sub
- eternity-diamond-bands-sub → /categories/eternity-diamond-bands-sub
- statement-cocktail-rings-sub → /categories/statement-cocktail-rings-sub
- contemporary-rings-sub → /categories/contemporary-rings-sub

### Earrings (5)
- stud-earrings-sub → /categories/stud-earrings-sub
- halo-cluster-earrings-sub → /categories/halo-cluster-earrings-sub
- drop-earrings-sub → /categories/drop-earrings-sub
- hoop-huggie-earrings-sub → /categories/hoop-huggie-earrings-sub
- statement-earrings-sub → /categories/statement-earrings-sub

### Necklaces & Pendants (5)
- solitaire-pendants-sub → /categories/solitaire-pendants-sub
- halo-pendants-sub → /categories/halo-pendants-sub
- diamond-necklaces-sub → /categories/diamond-necklaces-sub
- tennis-necklaces-sub → /categories/tennis-necklaces-sub
- contemporary-necklaces-sub → /categories/contemporary-necklaces-sub

### Bracelets (4)
- tennis-bracelets-sub → /categories/tennis-bracelets-sub
- diamond-line-bracelets-sub → /categories/diamond-line-bracelets-sub
- diamond-bangles-sub → /categories/diamond-bangles-sub
- contemporary-bracelets-sub → /categories/contemporary-bracelets-sub

### Men's Jewellery (5)
- mens-rings-sub → /categories/mens-rings-sub
- mens-bracelets-sub → /categories/mens-bracelets-sub
- mens-cufflinks-sub → /categories/mens-cufflinks-sub
- mens-necklaces-chains-sub → /categories/mens-necklaces-chains-sub
- mens-earrings-sub → /categories/mens-earrings-sub

### Gemstone Jewellery (4)
- gemstone-rings-sub → /categories/gemstone-rings-sub
- gemstone-earrings-sub → /categories/gemstone-earrings-sub
- gemstone-pendants-sub → /categories/gemstone-pendants-sub
- gemstone-bracelets-sub → /categories/gemstone-bracelets-sub

## Additional Categories (10 Total)

| Name | Slug | URL |
|------|------|-----|
| Engagement Rings | engagement-rings | /categories/engagement-rings |
| Diamond Stud Earrings | diamond-stud-earrings | /categories/diamond-stud-earrings |
| Tennis Bracelets | tennis-bracelets | /categories/tennis-bracelets |
| Diamond Bands | diamond-bands | /categories/diamond-bands |
| Diamond Pendants | diamond-pendants | /categories/diamond-pendants |
| Earrings | earrings | /categories/earrings |
| Necklaces | necklaces | /categories/necklaces |
| Bracelets | bracelets | /categories/bracelets |
| Wedding Rings | wedding-rings | /categories/wedding-rings |
| Men's Collection | mens-collection | /categories/mens-collection |

## SEO Implementation

### Canonical Tags
```html
<!-- Collection page -->
<link rel="canonical" href="https://detara.store/collections/engagement-rings" />

<!-- Category page -->
<link rel="canonical" href="https://detara.store/categories/rings-master" />
```

### Open Graph Tags
```html
<meta property="og:title" content="Engagement Rings — DETARA" />
<meta property="og:description" content="Shop DETARA engagement rings..." />
<meta property="og:url" content="https://detara.store/collections/engagement-rings" />
<meta property="og:image" content="[collection-image-url]" />
```

### Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://detara.store"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Collections",
      "item": "https://detara.store/collections"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Engagement Rings",
      "item": "https://detara.store/collections/engagement-rings"
    }
  ]
}
```

## Testing URLs

### Collections
- https://detara.store/collections/engagement-rings
- https://detara.store/collections/kiss-collection
- https://detara.store/collections/tennis-bracelets

### Categories
- https://detara.store/categories/rings-master
- https://detara.store/categories/solitaire-rings-sub
- https://detara.store/categories/engagement-rings

### Redirects
- https://detara.store/products?category_id=11111111-0001-0001-0001-000000000001
  (should redirect to /categories/rings-master)

### Sitemap
- https://detara.store/sitemap.xml

## Files Modified

1. `src/middleware.ts` — Redirect logic
2. `src/app/sitemap.ts` — Sitemap generation
3. `src/app/products/components/ProductsClient.tsx` — Collection/category slug support
4. `src/app/homepage/components/ShopByCategory.tsx` — Clean URLs in navigation

## Files Created

1. `src/app/collections/[slug]/layout.tsx`
2. `src/app/collections/[slug]/page.tsx`
3. `src/app/categories/[slug]/layout.tsx`
4. `src/app/categories/[slug]/page.tsx`
5. `supabase/migrations/20260827_collection_category_seo_urls.sql`
6. `src/app/api/redirect/route.ts`

## Database Changes

### Categories Table
- Added `seo_title` column
- Added `seo_description` column
- Added `canonical_url` column
- Populated with existing data

### Collections Table
- Ensured `seo_title` populated
- Ensured `seo_description` populated

## Verification Checklist

- [x] 13 collections have clean URLs
- [x] 46 categories have clean URLs
- [x] All old dynamic URLs redirect with HTTP 301
- [x] No redirect chains
- [x] No redirect loops
- [x] All pages have canonical tags
- [x] All pages have SEO metadata
- [x] Sitemap includes all new URLs
- [x] Internal links updated
- [x] No products/prices/variants changed
- [x] No website design changes

## Support

For questions or issues:
1. Check the full report: `rocket/audit_report/collection_category_seo_urls_implementation.md`
2. Review the migration: `supabase/migrations/20260827_collection_category_seo_urls.sql`
3. Test URLs in staging before production deployment
