import { createClient } from './client';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  is_visible: boolean;
  links: FooterLink[];
}

export interface FooterBrand {
  name: string;
  tagline: string;
  description: string;
  logo_url: string;
  is_visible: boolean;
}

export interface FooterContact {
  company_name: string;
  location: string;
  email: string;
  whatsapp: string;
  whatsapp_link: string;
  support_hours: string;
  support_time: string;
  is_visible: boolean;
}

export interface FooterSocialPlatform {
  name: string;
  href: string;
  is_enabled: boolean;
}

export interface FooterSocial {
  is_visible: boolean;
  platforms: FooterSocialPlatform[];
}

export interface FooterNewsletter {
  heading: string;
  description: string;
  cta_text: string;
  is_visible: boolean;
}

export interface FooterTrustItem {
  label: string;
  icon: string;
}

export interface FooterTrustStrip {
  is_visible: boolean;
  items: FooterTrustItem[];
}

export interface FooterLegal {
  is_visible: boolean;
  links: FooterLink[];
}

export interface FooterConfig {
  brand: FooterBrand;
  shop_links: FooterLinkGroup;
  diamond_links: FooterLinkGroup;
  service_links: FooterLinkGroup;
  company_links: FooterLinkGroup;
  contact: FooterContact;
  social: FooterSocial;
  newsletter: FooterNewsletter;
  trust_strip: FooterTrustStrip;
  legal: FooterLegal;
}

const DEFAULT_FOOTER: FooterConfig = {
  brand: {
    name: 'DETARA',
    tagline: 'Precision-crafted diamond jewellery.',
    description: 'Natural and lab-grown diamonds, selected for brilliance and crafted with restraint.',
    logo_url: '/assets/images/file_000000004f747208abb644f0cadec060-1773483679682.png',
    is_visible: true,
  },
  shop_links: {
    title: 'SHOP',
    is_visible: true,
    links: [
      { label: 'Rings', href: '/products?category=rings' },
      { label: 'Earrings', href: '/products?category=earrings' },
      { label: 'Necklaces', href: '/products?category=necklaces' },
      { label: 'Bracelets', href: '/products?category=bracelets' },
      { label: 'Tennis Jewellery', href: '/products?category=tennis' },
      { label: 'Solitaires', href: '/products?category=solitaires' },
      { label: "Men's Jewellery", href: '/products?category=mens' },
      { label: 'Custom Jewellery', href: '/custom-jewelry' },
    ],
  },
  diamond_links: {
    title: 'DIAMONDS',
    is_visible: true,
    links: [
      { label: 'Natural Diamonds', href: '/diamond-guide#natural' },
      { label: 'Lab-Grown Diamonds', href: '/diamond-guide#lab-grown' },
      { label: 'Diamond Education', href: '/diamond-guide' },
      { label: 'Diamond Guide', href: '/diamond-guide' },
      { label: 'Certification', href: '/diamond-guide#certification' },
      { label: 'Our Standards', href: '/about#standards' },
    ],
  },
  service_links: {
    title: 'SERVICES',
    is_visible: true,
    links: [
      { label: 'Custom Jewellery', href: '/custom-jewelry' },
      { label: 'Concierge', href: '/custom-jewelry#concierge' },
      { label: 'Shipping', href: '/shipping' },
      { label: 'Returns', href: '/refund' },
      { label: 'Warranty', href: '/care-guide#warranty' },
      { label: 'Lifetime Service', href: '/care-guide#lifetime' },
      { label: 'Jewellery Care', href: '/care-guide' },
      { label: 'FAQs', href: '/contact#faq' },
    ],
  },
  company_links: {
    title: 'COMPANY',
    is_visible: true,
    links: [
      { label: 'About DETARA', href: '/about' },
      { label: 'Journal', href: '/journal' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Cookie Policy', href: '/privacy#cookies' },
    ],
  },
  contact: {
    company_name: 'DETARA LTD',
    location: 'London, United Kingdom',
    email: 'hello@detara.store',
    whatsapp: '+44 20 4614 8575',
    whatsapp_link: 'https://wa.me/442046148575',
    support_hours: 'Monday–Friday',
    support_time: '9:00 AM – 6:00 PM UK Time',
    is_visible: true,
  },
  social: {
    is_visible: true,
    platforms: [
      { name: 'Instagram', href: 'https://www.instagram.com/detara.store', is_enabled: true },
      { name: 'Facebook', href: 'https://www.facebook.com/share/1Wa8vVFWJ1/', is_enabled: true },
    ],
  },
  newsletter: {
    heading: 'THE DETARA JOURNAL',
    description: 'Private access to new collections, diamond education and selected releases.',
    cta_text: 'SUBSCRIBE',
    is_visible: true,
  },
  trust_strip: {
    is_visible: true,
    items: [
      { label: 'CERTIFIED DIAMONDS', icon: 'diamond' },
      { label: 'SECURE CHECKOUT', icon: 'lock' },
      { label: 'INSURED SHIPPING', icon: 'shield' },
      { label: 'WORLDWIDE DELIVERY', icon: 'globe' },
      { label: 'LIFETIME SERVICE', icon: 'star' },
    ],
  },
  legal: {
    is_visible: true,
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Cookie Policy', href: '/privacy#cookies' },
    ],
  },
};

export const footerService = {
  async getFooterConfig(): Promise<FooterConfig> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('footer_config')
        .select('config_key, config_value');

      if (error || !data || data.length === 0) {
        return DEFAULT_FOOTER;
      }

      const config: Partial<FooterConfig> = {};
      data.forEach((row: { config_key: string; config_value: any }) => {
        (config as any)[row.config_key] = row.config_value;
      });

      return {
        brand: config.brand || DEFAULT_FOOTER.brand,
        shop_links: config.shop_links || DEFAULT_FOOTER.shop_links,
        diamond_links: config.diamond_links || DEFAULT_FOOTER.diamond_links,
        service_links: config.service_links || DEFAULT_FOOTER.service_links,
        company_links: config.company_links || DEFAULT_FOOTER.company_links,
        contact: config.contact || DEFAULT_FOOTER.contact,
        social: config.social || DEFAULT_FOOTER.social,
        newsletter: config.newsletter || DEFAULT_FOOTER.newsletter,
        trust_strip: config.trust_strip || DEFAULT_FOOTER.trust_strip,
        legal: config.legal || DEFAULT_FOOTER.legal,
      };
    } catch {
      return DEFAULT_FOOTER;
    }
  },

  async updateFooterSection(key: string, value: any): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('footer_config')
        .upsert(
          { config_key: key, config_value: value, updated_at: new Date().toISOString() },
          { onConflict: 'config_key' }
        );
      return !error;
    } catch {
      return false;
    }
  },
};
