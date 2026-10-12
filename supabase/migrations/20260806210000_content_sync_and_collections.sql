-- ============================================================
-- DETARA: Content Sync & Collections Migration
-- Upserts all existing static page content into content_pages
-- Adds missing collections and categories
-- Timestamp: 20260806210000
-- ============================================================

-- -------------------------------------------------------
-- 1. UPSERT ALL STATIC PAGE CONTENT INTO content_pages
-- -------------------------------------------------------

INSERT INTO public.content_pages (page_key, title, content, seo_title, seo_description, is_published, updated_at)
VALUES
  (
    'about',
    'About DETARA',
    '<section class="about-hero">
<h1>Exceptional quality. Timeless design.</h1>
<p>DETARA is a luxury diamond jewelry brand. The brand combines global diamond sourcing, precision polishing in Surat — the world''s leading diamond center — and fine jewelry craftsmanship with a commitment to quality and transparency. Every piece is created to endure, not just for a season, but for a lifetime.</p>
</section>

<section class="brand-pillars">
<h2>Design Philosophy</h2>
<p>DETARA embraces restraint and precision in every design. We believe that removing the unnecessary reveals what is essential — and that true luxury is found in what remains. Each piece is refined until only the essential remains.</p>

<h2>Diamond Expertise</h2>
<p>Every diamond is selected for balance of brilliance, purity, and proportion. We work exclusively with D–G color diamonds and VVS clarity standards to ensure exceptional brilliance and rarity in every piece.</p>

<h2>Timeless Design</h2>
<p>Pieces are created to remain elegant across generations. DETARA jewelry is not designed for a season — it is designed for a lifetime, and beyond. Quality and craftsmanship are at the heart of everything we create.</p>
</section>

<section class="commitment">
<h2>Quality and trust at every step.</h2>
<p>Every DETARA piece comes with full certification from IGI or GIA — the world''s most respected diamond grading laboratories. We believe in complete transparency about the diamonds we use, their origin, and their quality.</p>
<p>Our customer care team is available Monday through Friday, 9:00 AM to 6:00 PM UK Time, to assist with any questions about your order, custom jewelry, or diamond selection.</p>
</section>',
    'About DETARA | Luxury Diamond Jewelry Brand',
    'Learn about DETARA LTD, a luxury diamond jewelry brand combining global diamond sourcing with precision craftsmanship and timeless design.',
    true,
    now()
  ),
  (
    'shipping',
    'Shipping Policy',
    '<h1>Shipping Policy</h1>
<p>Last updated: January 2026</p>

<h2>Production Time</h2>
<p>All DETARA jewelry is made to order. Standard production time is 3–5 weeks from order confirmation (after payment is verified). Complex custom pieces may require 6–8 weeks. You will be notified of your estimated completion date after your order is confirmed.</p>

<h2>Shipping Method</h2>
<p>All orders are shipped via insured express courier (DHL or equivalent). Tracking information is provided once your order is dispatched. Delivery typically takes 2–5 business days after dispatch, depending on destination.</p>

<h2>Insurance</h2>
<p>Every DETARA shipment is fully insured for the declared value of the jewelry. In the unlikely event of loss or damage in transit, we will file an insurance claim and arrange a replacement at no cost to you.</p>

<h2>Shipping Costs</h2>
<p>Free insured shipping is included on all orders. There are no additional shipping charges regardless of order value or destination.</p>

<h2>United Kingdom</h2>
<p>Orders within the United Kingdom are delivered within 2–3 business days after dispatch. Delivery is to your specified address via insured courier with signature required.</p>

<h2>Europe</h2>
<p>We ship to all European countries. Delivery takes 3–5 business days after dispatch. Import duties and taxes may apply depending on your country. The customer is responsible for any applicable customs fees.</p>

<h2>International (Rest of World)</h2>
<p>We ship worldwide. Delivery times vary by destination (5–10 business days). The customer is responsible for all import duties, taxes, and customs clearance fees.</p>

<h2>Packaging</h2>
<p>Your jewelry arrives in DETARA signature packaging: a luxury box with ribbon, certificate of authenticity, diamond certificate (IGI/GIA), and care instructions. All packaging is discreet for security.</p>

<h2>Contact</h2>
<p>For shipping inquiries, contact hello@detara.store. Our customer care team is available Monday–Friday, 9:00 AM – 6:00 PM (UK Time).</p>',
    'Shipping Policy — DETARA',
    'DETARA Shipping Policy — delivery times, insured shipping, and international orders.',
    true,
    now()
  ),
  (
    'returns',
    'Refund & Return Policy',
    '<h1>Refund & Return Policy</h1>
<p>Last updated: January 2026</p>

<h2>Made-to-Order Policy</h2>
<p>All DETARA jewelry is crafted to order based on your specifications. Because each piece is uniquely made for you, we are unable to accept returns for change of mind. This policy is in accordance with UK consumer law for custom-made goods.</p>

<h2>Manufacturing Defects</h2>
<p>If your jewelry arrives with a manufacturing defect, we will repair or replace the item at no cost. Please contact us within 14 days of receiving your order with photographs of the defect. We will arrange collection and resolution within 30 days.</p>

<h2>Damaged in Transit</h2>
<p>All DETARA shipments are fully insured. If your order arrives damaged, please photograph the packaging and item immediately and contact us within 48 hours. We will file an insurance claim and arrange a replacement.</p>

<h2>Incorrect Items</h2>
<p>If you receive an item that does not match your order specifications, contact us immediately. We will arrange collection and produce the correct item at no additional cost.</p>

<h2>Resizing</h2>
<p>We offer one complimentary resize within 60 days of delivery for rings. The customer is responsible for return shipping costs. Resizing may not be possible for all ring styles.</p>

<h2>Cancellations</h2>
<p>Orders may be cancelled within 24 hours of placement for a full refund. After 24 hours, production may have begun and cancellation may not be possible. Custom jewelry orders cannot be cancelled once production has started.</p>

<h2>Refund Process</h2>
<p>Approved refunds are processed within 5–10 business days via the original payment method. DETARA is not responsible for bank processing times.</p>

<h2>Contact</h2>
<p>To initiate a return or refund request, contact hello@detara.store with your order number and a description of the issue. Our customer care team is available Monday–Friday, 9:00 AM – 6:00 PM (UK Time).</p>',
    'Refund & Return Policy — DETARA',
    'DETARA Refund and Return Policy for diamond jewelry purchases.',
    true,
    now()
  ),
  (
    'warranty',
    'Warranty',
    '<h1>Warranty</h1>
<p>Last updated: January 2026</p>

<h2>Lifetime Craftsmanship Warranty</h2>
<p>Every DETARA piece is covered by our lifetime craftsmanship warranty. This warranty covers manufacturing defects in materials and workmanship for the lifetime of the original purchaser.</p>

<h2>What Is Covered</h2>
<p>The warranty covers: prong tightening, re-tipping of prongs, polishing and cleaning, rhodium plating (white gold), clasp and setting repairs due to manufacturing defects, and stone replacement if a stone falls out due to a manufacturing defect in the setting.</p>

<h2>What Is Not Covered</h2>
<p>The warranty does not cover: damage caused by accidents, misuse, or neglect; normal wear and tear; loss or theft; damage caused by chemicals, perfumes, or cleaning products; unauthorized repairs or modifications; and cosmetic damage that does not affect functionality.</p>

<h2>How to Claim</h2>
<p>To make a warranty claim, contact hello@detara.store with your order number, a description of the issue, and photographs. Our team will assess the claim and provide instructions for returning the item if necessary.</p>

<h2>Diamond Certification</h2>
<p>All diamonds in DETARA jewelry are certified by IGI or GIA. The certification documents the diamond''s characteristics and serves as proof of quality. Certificates are included with every purchase.</p>

<h2>Contact</h2>
<p>For warranty inquiries, contact hello@detara.store. Our customer care team is available Monday–Friday, 9:00 AM – 6:00 PM (UK Time).</p>',
    'Warranty — DETARA',
    'DETARA lifetime craftsmanship warranty for all diamond jewelry purchases.',
    true,
    now()
  ),
  (
    'privacy',
    'Privacy Policy',
    '<h1>Privacy Policy</h1>
<p>Last updated: January 2026</p>

<h2>1. Data Controller</h2>
<p>DETARA LTD, London, United Kingdom, is the data controller for personal data collected through this website. Contact: hello@detara.store</p>

<h2>2. Data We Collect</h2>
<p>We collect: name, email address, phone number, shipping address, and order details when you place an order or contact us. We may also collect browsing data (IP address, browser type) for analytics purposes.</p>

<h2>3. How We Use Your Data</h2>
<p>Your data is used to: process and fulfill your orders, communicate order status updates, respond to inquiries, and improve our services. We do not sell your personal data to third parties.</p>

<h2>4. Data Retention</h2>
<p>Order data is retained for 7 years as required by UK accounting regulations. Contact form submissions are retained for 2 years. You may request deletion of your data at any time, subject to legal retention requirements.</p>

<h2>5. Your Rights (UK GDPR)</h2>
<p>Under UK GDPR, you have the right to: access your personal data, correct inaccurate data, request deletion, restrict processing, and data portability. To exercise these rights, contact hello@detara.store.</p>

<h2>6. Cookies</h2>
<p>We use essential cookies for website functionality and analytics cookies to understand how visitors use our site. You may disable non-essential cookies in your browser settings.</p>

<h2>7. Security</h2>
<p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>

<h2>8. Contact</h2>
<p>For privacy-related inquiries, contact our Data Protection team at hello@detara.store.</p>',
    'Privacy Policy — DETARA',
    'DETARA Privacy Policy — how we collect, use, and protect your personal data.',
    true,
    now()
  ),
  (
    'terms',
    'Terms & Conditions',
    '<h1>Terms & Conditions</h1>
<p>Last updated: January 2026</p>

<h2>1. General</h2>
<p>These Terms and Conditions govern your use of the DETARA website and the purchase of products from DETARA LTD, a company registered in the United Kingdom. By placing an order, you agree to these terms in full. DETARA reserves the right to update these terms at any time.</p>

<h2>2. Products</h2>
<p>All DETARA jewelry is made to order. Products are crafted to your specifications and may vary slightly from images shown on the website. Diamond certifications (IGI/GIA) are included with every purchase. DETARA reserves the right to substitute equivalent diamonds of equal or greater quality if the specified stone is unavailable.</p>

<h2>3. Pricing</h2>
<p>All prices are displayed in the currency shown at checkout. Prices include applicable taxes where required. DETARA reserves the right to change prices at any time without notice. The price at the time of order confirmation is the binding price.</p>

<h2>4. Orders & Payment</h2>
<p>Orders are confirmed upon receipt of full payment. Production begins only after payment is verified. Your order number must be used as the payment reference. DETARA is not responsible for delays caused by incorrect payment references.</p>

<h2>5. Production & Delivery</h2>
<p>Standard production time is 3–5 weeks from order confirmation. Delivery is via insured courier. DETARA is not responsible for delays caused by customs, courier services, or force majeure events. All shipments are fully insured for the declared value.</p>

<h2>6. Returns & Refunds</h2>
<p>As all pieces are made to order, returns are accepted only for manufacturing defects. Please refer to our Refund Policy for full details. Custom jewelry orders are non-refundable.</p>

<h2>7. Intellectual Property</h2>
<p>All content on the DETARA website, including images, text, logos, and designs, is the intellectual property of DETARA LTD. Reproduction or use without written permission is prohibited.</p>

<h2>8. Governing Law</h2>
<p>These terms are governed by the laws of England and Wales. Any disputes shall be resolved in the courts of England and Wales.</p>

<h2>9. Contact</h2>
<p>For questions regarding these terms, contact us at hello@detara.store or through our Contact page.</p>',
    'Terms & Conditions — DETARA',
    'Read the Terms and Conditions for purchasing from DETARA LTD, the luxury diamond jewelry brand.',
    true,
    now()
  ),
  (
    'faq',
    'Frequently Asked Questions',
    '<h1>Frequently Asked Questions</h1>

<h2>How long does production take?</h2>
<p>All DETARA jewelry is made to order. Standard production time is 3–5 weeks from order confirmation. Complex custom pieces may require 6–8 weeks. You will be notified of your estimated completion date after your order is confirmed.</p>

<h2>What diamond certifications do you use?</h2>
<p>All diamonds in DETARA jewelry are certified by IGI (International Gemological Institute) or GIA (Gemological Institute of America) — the world''s most respected diamond grading laboratories. Certificates are included with every purchase.</p>

<h2>Do you offer natural and lab-grown diamonds?</h2>
<p>Yes. We offer both natural and lab-grown diamonds. Lab-grown diamonds are chemically, physically, and optically identical to natural diamonds. Both options are available at checkout and are certified by IGI or GIA.</p>

<h2>What metals are available?</h2>
<p>We offer 18K White Gold, 18K Yellow Gold, 18K Rose Gold, and Platinum 950. All metals are hallmarked and certified.</p>

<h2>Can I customize a piece?</h2>
<p>Yes. We offer a full custom jewelry service. You can specify diamond shape, carat weight, metal type, setting style, and any other details. Contact us through the Custom Jewelry page or via WhatsApp to discuss your requirements.</p>

<h2>Do you ship internationally?</h2>
<p>Yes. We ship worldwide via insured express courier. All shipments are fully insured for the declared value. Free shipping is included on all orders.</p>

<h2>What is your return policy?</h2>
<p>As all pieces are made to order, we cannot accept returns for change of mind. We do accept returns for manufacturing defects. Please contact us within 14 days of receiving your order if you have any concerns.</p>

<h2>How do I care for my jewelry?</h2>
<p>Store your jewelry in the provided box when not wearing it. Clean with a soft cloth and mild soap solution. Avoid contact with chemicals, perfumes, and chlorine. Remove jewelry before swimming, exercising, or sleeping. Visit our Care Guide for detailed instructions.</p>

<h2>How do I contact DETARA?</h2>
<p>You can reach us via email at hello@detara.store, through our Contact page, or via WhatsApp. Our customer care team is available Monday–Friday, 9:00 AM – 6:00 PM (UK Time).</p>',
    'FAQ — DETARA',
    'Frequently asked questions about DETARA diamond jewelry — production, shipping, returns, and more.',
    true,
    now()
  )
ON CONFLICT (page_key) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  is_published = EXCLUDED.is_published,
  updated_at = now();

-- -------------------------------------------------------
-- 2. UPSERT MISSING COLLECTIONS
-- -------------------------------------------------------

INSERT INTO public.collections (name, slug, description, is_active, sort_order, seo_title, seo_description, updated_at)
VALUES
  ('Engagement Rings', 'engagement-rings', 'Timeless engagement rings crafted with certified diamonds. Each ring is made to order with your choice of diamond shape, carat, and metal.', true, 1, 'Engagement Rings — DETARA', 'Shop DETARA engagement rings — IGI & GIA certified diamonds, 18K gold and platinum settings.', now()),
  ('Kiss Collection', 'kiss-collection', 'The KISS Collection — minimal, modern diamond jewelry designed for everyday luxury.', true, 2, 'Kiss Collection — DETARA', 'Explore the DETARA KISS Collection — minimal diamond jewelry for everyday wear.', now()),
  ('Tennis Bracelets', 'tennis-bracelets', 'Classic diamond tennis bracelets in 18K gold and platinum. Available in natural and lab-grown diamonds.', true, 3, 'Diamond Tennis Bracelets — DETARA', 'Shop DETARA diamond tennis bracelets — certified diamonds, 18K gold and platinum.', now()),
  ('Diamond Bands', 'diamond-bands', 'Elegant diamond bands for weddings, anniversaries, and everyday wear.', true, 4, 'Diamond Bands — DETARA', 'Shop DETARA diamond bands — eternity rings, wedding bands, and anniversary rings.', now()),
  ('Diamond Pendants', 'diamond-pendants', 'Refined diamond pendants and necklaces in 18K gold and platinum.', true, 5, 'Diamond Pendants — DETARA', 'Shop DETARA diamond pendants and necklaces — certified diamonds, fine gold settings.', now()),
  ('Earrings', 'earrings', 'Diamond stud earrings and drop earrings in 18K gold and platinum. IGI & GIA certified.', true, 6, 'Diamond Earrings — DETARA', 'Shop DETARA diamond earrings — stud earrings and drop earrings in 18K gold.', now()),
  ('Necklaces', 'necklaces', 'Diamond necklaces and pendants crafted in 18K gold and platinum.', true, 7, 'Diamond Necklaces — DETARA', 'Shop DETARA diamond necklaces — certified diamonds in 18K gold and platinum settings.', now()),
  ('Bracelets', 'bracelets', 'Diamond bracelets including tennis bracelets and bangle styles.', true, 8, 'Diamond Bracelets — DETARA', 'Shop DETARA diamond bracelets — tennis bracelets and bangles in 18K gold.', now()),
  ('Wedding Rings', 'wedding-rings', 'Wedding rings and bands for both partners. Made to order in 18K gold and platinum.', true, 9, 'Wedding Rings — DETARA', 'Shop DETARA wedding rings — diamond wedding bands in 18K gold and platinum.', now()),
  ('Men''s Collection', 'mens-collection', 'Diamond jewelry designed for men — rings, bracelets, and pendants in 18K gold and platinum.', true, 10, 'Men''s Diamond Jewelry — DETARA', 'Shop DETARA men''s diamond jewelry — rings, bracelets, and pendants.', now()),
  ('Custom Jewellery', 'custom-jewellery', 'Bespoke diamond jewelry designed to your exact specifications. Work with our team to create your perfect piece.', true, 11, 'Custom Diamond Jewellery — DETARA', 'Create bespoke diamond jewelry with DETARA — custom engagement rings, pendants, and more.', now()),
  ('Best Sellers', 'best-sellers', 'Our most popular diamond jewelry pieces — loved by customers worldwide.', true, 12, 'Best Sellers — DETARA', 'Shop DETARA best-selling diamond jewelry — our most popular pieces.', now()),
  ('New Arrivals', 'new-arrivals', 'The latest additions to the DETARA collection — new diamond jewelry designs.', true, 13, 'New Arrivals — DETARA', 'Discover the latest DETARA diamond jewelry — new arrivals and recent designs.', now())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  updated_at = now();

-- -------------------------------------------------------
-- 3. UPSERT MISSING CATEGORIES
-- -------------------------------------------------------

INSERT INTO public.categories (name, slug, description, is_active, sort_order)
VALUES
  ('Engagement Rings', 'engagement-rings', 'Diamond engagement rings', true, 1),
  ('Diamond Stud Earrings', 'diamond-stud-earrings', 'Diamond stud earrings', true, 2),
  ('Tennis Bracelets', 'tennis-bracelets', 'Diamond tennis bracelets', true, 3),
  ('Diamond Bands', 'diamond-bands', 'Diamond bands and wedding rings', true, 4),
  ('Diamond Pendants', 'diamond-pendants', 'Diamond pendants and necklaces', true, 5),
  ('Earrings', 'earrings', 'All earring styles', true, 6),
  ('Necklaces', 'necklaces', 'All necklace styles', true, 7),
  ('Bracelets', 'bracelets', 'All bracelet styles', true, 8),
  ('Wedding Rings', 'wedding-rings', 'Wedding rings and bands', true, 9),
  ('Men''s Collection', 'mens-collection', 'Men''s diamond jewelry', true, 10)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- -------------------------------------------------------
-- 4. UPSERT HOMEPAGE SECTIONS (ensure all sections exist)
-- -------------------------------------------------------

INSERT INTO public.homepage_sections (section_key, title, subtitle, description, image_url, cta_text, cta_href, secondary_cta_text, secondary_cta_href, is_active, sort_order)
VALUES
  ('hero', 'Precision-Crafted Diamond Jewelry', 'European Diamond Jewelry', 'IGI & GIA Certified • Worldwide Shipping • Secure Checkout', 'https://img.rocket.new/generatedImages/rocket_gen_img_1d033a26f-1773470829336.png', 'Shop Rings', '/products?category=engagement-rings', 'Design Your Ring', '/custom-jewelry', true, 1),
  ('philosophy', 'The DETARA Philosophy', 'Restraint as a form of precision.', 'We believe that removing the unnecessary reveals what is essential. Every DETARA piece is refined until only the essential remains — a philosophy that defines both our design and our craft.', null, 'Our Story', '/about', null, null, true, 2),
  ('tennis_bracelet', 'Tennis Bracelets', 'Timeless elegance.', 'Our signature tennis bracelets feature hand-selected diamonds in 18K gold and platinum settings. Available in natural and lab-grown diamonds, each bracelet is made to order.', null, 'Shop Tennis Bracelets', '/products?category=tennis-bracelets', null, null, true, 3),
  ('kiss_collection', 'KISS Collection', 'Minimal. Modern. Brilliant.', 'The KISS Collection is designed for everyday luxury — minimal forms that let the diamond speak. Each piece is crafted in 18K gold with IGI-certified diamonds.', null, 'Explore KISS', '/kiss', null, null, true, 4),
  ('featured_ring', 'Featured Ring', 'The Solitaire.', 'Our signature solitaire engagement ring — a single certified diamond in a precision-crafted setting. Available in 18K White Gold, Yellow Gold, Rose Gold, and Platinum 950.', null, 'Configure Yours', '/products?category=engagement-rings', null, null, true, 5),
  ('journal', 'The DETARA Journal', 'Stories of diamonds and design.', 'Explore our journal for insights into diamond selection, jewelry care, and the stories behind our collections.', null, 'Read Journal', '/journal', null, null, true, 6),
  ('promo_banner', 'Free Worldwide Shipping', null, 'Every DETARA order includes fully insured express shipping worldwide. No minimum order value.', null, 'Shop Now', '/products', null, null, true, 7),
  ('lab_diamond', 'Lab-Grown Diamonds', 'Identical. Ethical. Exceptional.', 'Lab-grown diamonds are chemically, physically, and optically identical to natural diamonds — certified by IGI and GIA. Choose the origin that aligns with your values.', null, 'Learn More', '/diamond-guide', null, null, true, 8),
  ('brand_story', 'DETARA', 'A brand built on precision.', 'Founded on the belief that exceptional jewelry should be accessible without compromise. Every DETARA piece is crafted with the same standards as the world''s finest jewelers.', null, 'About DETARA', '/about', null, null, true, 9),
  ('trust', 'Why DETARA', null, 'IGI & GIA certified diamonds, insured worldwide shipping, lifetime craftsmanship warranty, and dedicated customer care.', null, null, null, null, null, true, 10)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  cta_text = EXCLUDED.cta_text,
  cta_href = EXCLUDED.cta_href,
  secondary_cta_text = EXCLUDED.secondary_cta_text,
  secondary_cta_href = EXCLUDED.secondary_cta_href,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- -------------------------------------------------------
-- 5. UPSERT SITE CONTENT (text keys for homepage)
-- -------------------------------------------------------

INSERT INTO public.site_content (key, value, section)
VALUES
  ('hero_headline', 'Precision-Crafted Diamond Jewelry', 'hero'),
  ('hero_subtext', 'IGI & GIA Certified • Worldwide Shipping • Secure Checkout', 'hero'),
  ('hero_cta_primary', 'Shop Rings', 'hero'),
  ('hero_cta_primary_href', '/products?category=engagement-rings', 'hero'),
  ('hero_micro_text', 'Limited availability on selected designs', 'hero'),
  ('featured_heading', 'The Solitaire', 'featured'),
  ('featured_subheading', 'Our signature engagement ring', 'featured'),
  ('philosophy_heading', 'The DETARA Philosophy', 'philosophy'),
  ('philosophy_body', 'We believe that removing the unnecessary reveals what is essential. Every DETARA piece is refined until only the essential remains.', 'philosophy'),
  ('trust_heading', 'Why DETARA', 'trust'),
  ('newsletter_heading', 'Join the DETARA Circle', 'newsletter'),
  ('newsletter_subheading', 'Early access to new collections, exclusive offers, and diamond education.', 'newsletter'),
  ('footer_tagline', 'Precision-crafted diamond jewelry. IGI & GIA certified.', 'footer'),
  ('footer_address', 'DETARA LTD, London, United Kingdom', 'footer'),
  ('footer_email', 'hello@detara.store', 'footer'),
  ('promo_text', 'Free worldwide insured shipping on all orders', 'promo'),
  ('site_name', 'DETARA', 'general'),
  ('site_tagline', 'Luxury Diamond Jewelry', 'general'),
  ('whatsapp_number', '+447700900000', 'contact'),
  ('contact_email', 'hello@detara.store', 'contact'),
  ('business_hours', 'Monday–Friday, 9:00 AM – 6:00 PM (UK Time)', 'contact')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  section = EXCLUDED.section,
  updated_at = now();

-- -------------------------------------------------------
-- 6. UPSERT JOURNAL POSTS (ensure all 3 exist and are published)
-- -------------------------------------------------------

INSERT INTO public.journal_posts (title, slug, excerpt, content, author, category, is_published, is_featured, reading_time, published_at)
VALUES
  (
    'The Art of Diamond Selection',
    'art-of-diamond-selection',
    'Understanding the 4Cs — cut, colour, clarity, and carat — and how DETARA selects only the finest diamonds for each piece.',
    '<h2>The Four Cs of Diamond Quality</h2>
<p>When selecting diamonds for DETARA jewelry, we evaluate every stone against the internationally recognised 4Cs framework: cut, colour, clarity, and carat weight. Understanding these characteristics helps you make an informed choice when selecting your piece.</p>

<h3>Cut: The Most Important Factor</h3>
<p>Cut is the most significant factor in a diamond''s beauty. A well-cut diamond reflects light brilliantly, creating the sparkle that makes diamonds so captivating. DETARA works exclusively with Excellent and Very Good cut grades.</p>

<h3>Colour: D to G Range</h3>
<p>Diamond colour is graded on a scale from D (colourless) to Z (light yellow). DETARA selects diamonds in the D–G range — the finest colourless to near-colourless grades — ensuring exceptional brilliance and rarity.</p>

<h3>Clarity: VVS Standards</h3>
<p>Clarity refers to the presence of inclusions or blemishes. DETARA works with VVS (Very Very Slightly Included) clarity standards, meaning any inclusions are invisible to the naked eye and barely visible under 10x magnification.</p>

<h3>Carat: Weight and Size</h3>
<p>Carat refers to the diamond''s weight. DETARA offers diamonds from 0.30ct to 2.00ct and beyond, with custom sizes available on request. All diamonds are certified by IGI or GIA.</p>',
    'DETARA',
    'Diamond Education',
    true,
    true,
    6,
    now() - interval '30 days'
  ),
  (
    'Natural vs Lab-Grown Diamonds',
    'natural-vs-lab-grown-diamonds',
    'A comprehensive guide to understanding the differences between natural and lab-grown diamonds — and how to choose the right option for you.',
    '<h2>Natural and Lab-Grown: The Same Diamond</h2>
<p>Lab-grown diamonds are chemically, physically, and optically identical to natural diamonds. They are real diamonds — not simulants like cubic zirconia or moissanite. The only difference is their origin.</p>

<h3>How Lab-Grown Diamonds Are Created</h3>
<p>Lab-grown diamonds are created using two methods: High Pressure High Temperature (HPHT) and Chemical Vapor Deposition (CVD). Both methods replicate the natural conditions under which diamonds form in the earth, producing crystals with identical properties.</p>

<h3>Certification</h3>
<p>Both natural and lab-grown diamonds can be certified by IGI and GIA. DETARA provides certification for all diamonds regardless of origin. The certificate documents the diamond''s 4Cs and confirms its authenticity.</p>

<h3>Price Difference</h3>
<p>Lab-grown diamonds typically cost 40–60% less than natural diamonds of equivalent quality. This allows you to choose a larger or higher-quality diamond within the same budget.</p>

<h3>Which Should You Choose?</h3>
<p>The choice between natural and lab-grown is personal. Both are real diamonds with identical properties. Natural diamonds have geological rarity and a unique origin story. Lab-grown diamonds offer exceptional value and a controlled origin. DETARA offers both options with the same quality standards and certification.</p>',
    'DETARA',
    'Diamond Education',
    true,
    false,
    7,
    now() - interval '20 days'
  ),
  (
    'How to Care for Your Diamond Jewelry',
    'how-to-care-for-diamond-jewelry',
    'Essential care instructions to keep your DETARA diamond jewelry looking its best for generations.',
    '<h2>Caring for Your Diamond Jewelry</h2>
<p>With proper care, your DETARA diamond jewelry will remain beautiful for generations. Follow these guidelines to maintain the brilliance and integrity of your pieces.</p>

<h3>Daily Care</h3>
<p>Remove your jewelry before swimming, exercising, or sleeping. Avoid contact with chemicals, perfumes, hairspray, and cleaning products. Put on jewelry after applying cosmetics and perfume.</p>

<h3>Cleaning at Home</h3>
<p>Clean your jewelry regularly with a soft brush, mild soap, and warm water. Gently scrub around the setting and under the stone to remove oils and residue. Rinse thoroughly and dry with a soft, lint-free cloth.</p>

<h3>Professional Cleaning</h3>
<p>We recommend professional cleaning and inspection once a year. A jeweler can check prong integrity, clean areas difficult to reach at home, and re-polish the metal if needed. DETARA offers complimentary cleaning and inspection for all pieces.</p>

<h3>Storage</h3>
<p>Store each piece separately in the provided DETARA box or a soft pouch to prevent scratching. Diamonds can scratch other gemstones and metals, so individual storage is important.</p>

<h3>Prong Maintenance</h3>
<p>Prongs can wear over time with daily wear. Have prongs inspected annually and re-tipped if necessary to prevent stone loss. This service is covered under the DETARA lifetime craftsmanship warranty.</p>',
    'DETARA',
    'Care & Maintenance',
    true,
    false,
    5,
    now() - interval '10 days'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  is_featured = EXCLUDED.is_featured,
  reading_time = EXCLUDED.reading_time,
  published_at = EXCLUDED.published_at,
  updated_at = now();
