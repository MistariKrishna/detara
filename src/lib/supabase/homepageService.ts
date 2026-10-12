import { createClient } from './client';

export interface HomepageSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  video_url: string | null;
  video_poster_url: string | null;
  cta_text: string | null;
  cta_href: string | null;
  secondary_cta_text: string | null;
  secondary_cta_href: string | null;
  is_active: boolean;
  sort_order: number;
  extra_data: Record<string, any>;
  is_draft: boolean;
  draft_data: Record<string, any>;
  updated_at: string;
}

export interface HomepageFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export interface HomepageProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
  slug: string | null;
  carat_range: string | null;
  certification: string | null;
  diamond_type: string[];
  is_featured: boolean;
  is_bestseller: boolean;
}

export interface HomepageCollection {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface HomepageCategory {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface HomepageJournalPost {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  cover_image: string | null;
  category: string | null;
  published_at: string | null;
  reading_time: number | null;
  is_featured: boolean;
}

export interface HomepageData {
  sections: Record<string, HomepageSection>;
  faqs: HomepageFaq[];
  featuredProducts: HomepageProduct[];
  featuredCollections: HomepageCollection[];
  categories: HomepageCategory[];
  journalPosts: HomepageJournalPost[];
  sectionOrder: string[];
}

export const homepageService = {
  async getAllSections(): Promise<HomepageSection[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('sort_order');
    if (error) {
      console.warn('Homepage sections error:', error.message);
      return [];
    }
    return data || [];
  },

  async getActiveSections(): Promise<HomepageSection[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) {
      console.warn('Homepage active sections error:', error.message);
      return [];
    }
    return data || [];
  },

  async getSectionByKey(key: string): Promise<HomepageSection | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('section_key', key)
      .maybeSingle();
    if (error) return null;
    return data;
  },

  async updateSection(id: string, updates: Partial<HomepageSection>): Promise<HomepageSection | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('homepage_sections')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.warn('Update section error:', error.message);
      return null;
    }
    return data;
  },

  async getFaqs(): Promise<HomepageFaq[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('homepage_faqs')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('sort_order');
    if (error) {
      console.warn('FAQs error:', error.message);
      return [];
    }
    return data || [];
  },

  async getAllFaqs(): Promise<HomepageFaq[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('homepage_faqs')
      .select('*')
      .order('category')
      .order('sort_order');
    if (error) return [];
    return data || [];
  },

  async saveFaq(faq: Partial<HomepageFaq> & { question: string; answer: string; category: string }): Promise<HomepageFaq | null> {
    const supabase = createClient();
    if (faq.id) {
      const { data, error } = await supabase
        .from('homepage_faqs')
        .update({ ...faq, updated_at: new Date().toISOString() })
        .eq('id', faq.id)
        .select()
        .single();
      if (error) return null;
      return data;
    } else {
      const { data, error } = await supabase
        .from('homepage_faqs')
        .insert({ ...faq })
        .select()
        .single();
      if (error) return null;
      return data;
    }
  },

  async deleteFaq(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('homepage_faqs').delete().eq('id', id);
    return !error;
  },

  async getFeaturedProducts(productIds?: string[]): Promise<HomepageProduct[]> {
    const supabase = createClient();
    let query = supabase
      .from('products')
      .select('id, name, price, image, category, slug, carat_range, certification, diamond_type, is_featured, is_bestseller')
      .eq('is_active', true);

    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    } else {
      query = query.eq('is_featured', true).limit(8);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Featured products error:', error.message);
      // Fallback: get any products
      const { data: fallback } = await supabase
        .from('products')
        .select('id, name, price, image, category, slug, carat_range, certification, diamond_type, is_featured, is_bestseller')
        .eq('is_active', true)
        .limit(8);
      return fallback || [];
    }

    if (!data || data.length === 0) {
      // Fallback: get any products
      const { data: fallback } = await supabase
        .from('products')
        .select('id, name, price, image, category, slug, carat_range, certification, diamond_type, is_featured, is_bestseller')
        .eq('is_active', true)
        .limit(8);
      return fallback || [];
    }

    // If specific IDs requested, maintain order
    if (productIds && productIds.length > 0) {
      return productIds
        .map((id) => data.find((p) => p.id === id))
        .filter(Boolean) as HomepageProduct[];
    }
    return data;
  },

  async getFeaturedCollections(collectionIds?: string[]): Promise<HomepageCollection[]> {
    const supabase = createClient();
    let query = supabase
      .from('collections')
      .select('id, name, slug, description, image_url, is_active, sort_order')
      .eq('is_active', true);

    if (collectionIds && collectionIds.length > 0) {
      query = query.in('id', collectionIds);
    } else {
      query = query.order('sort_order').limit(6);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  },

  async getCategories(): Promise<HomepageCategory[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order');
    if (error) return [];
    return data || [];
  },

  async getJournalPosts(postIds?: string[]): Promise<HomepageJournalPost[]> {
    const supabase = createClient();
    let query = supabase
      .from('journal_posts')
      .select('id, title, slug, excerpt, cover_image, category, published_at, reading_time, is_featured')
      .eq('is_published', true);

    if (postIds && postIds.length > 0) {
      query = query.in('id', postIds);
    } else {
      query = query.order('published_at', { ascending: false }).limit(4);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  },

  async getHomepageData(): Promise<HomepageData> {
    const [sections, faqs, categories, journalPosts] = await Promise.all([
      this.getActiveSections(),
      this.getFaqs(),
      this.getCategories(),
      this.getJournalPosts(),
    ]);

    const sectionsMap: Record<string, HomepageSection> = {};
    sections.forEach((s) => { sectionsMap[s.section_key] = s; });

    // Get featured products based on section config
    const featuredSection = sectionsMap['featured_products'];
    const productIds = featuredSection?.extra_data?.product_ids || [];
    const featuredProducts = await this.getFeaturedProducts(productIds.length > 0 ? productIds : undefined);

    // Get featured collections based on section config
    const collectionsSection = sectionsMap['featured_collections'];
    const collectionIds = collectionsSection?.extra_data?.collection_ids || [];
    const featuredCollections = await this.getFeaturedCollections(collectionIds.length > 0 ? collectionIds : undefined);

    // Get journal posts based on section config
    const journalSection = sectionsMap['journal'];
    const articleIds = journalSection?.extra_data?.article_ids || [];
    const finalJournalPosts = articleIds.length > 0 ? await this.getJournalPosts(articleIds) : journalPosts;

    // Get section order from config
    const supabase = createClient();
    const { data: configData } = await supabase
      .from('homepage_config')
      .select('config_value')
      .eq('config_key', 'section_order')
      .maybeSingle();

    const sectionOrder: string[] = configData?.config_value?.order || sections.map((s) => s.section_key);

    return {
      sections: sectionsMap,
      faqs,
      featuredProducts,
      featuredCollections,
      categories,
      journalPosts: finalJournalPosts,
      sectionOrder,
    };
  },

  async uploadImage(file: File, path: string): Promise<string | null> {
    const supabase = createClient();
    const fileName = `${path}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { upsert: true });
    if (error || !data) return null;
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path);
    return publicUrl;
  },

  async deleteImage(url: string): Promise<boolean> {
    const supabase = createClient();
    // Extract path from URL
    const match = url.match(/product-images\/(.+)$/);
    if (!match) return false;
    const { error } = await supabase.storage.from('product-images').remove([match[1]]);
    return !error;
  },

  async saveSectionOrder(order: string[]): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('homepage_config')
      .upsert({ config_key: 'section_order', config_value: { order }, updated_at: new Date().toISOString() }, { onConflict: 'config_key' });
    
    // Also update sort_order on each section
    for (let i = 0; i < order.length; i++) {
      await supabase
        .from('homepage_sections')
        .update({ sort_order: (i + 1) * 10, updated_at: new Date().toISOString() })
        .eq('section_key', order[i]);
    }
    return !error;
  },

  async getAllProducts(): Promise<HomepageProduct[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image, category, slug, carat_range, certification, diamond_type, is_featured, is_bestseller')
      .eq('is_active', true)
      .order('name');
    if (error) return [];
    return data || [];
  },

  async getAllCollections(): Promise<HomepageCollection[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, slug, description, image_url, is_active, sort_order')
      .order('sort_order');
    if (error) return [];
    return data || [];
  },

  async getAllJournalPosts(): Promise<HomepageJournalPost[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('journal_posts')
      .select('id, title, slug, excerpt, cover_image, category, published_at, reading_time, is_featured')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (error) return [];
    return data || [];
  },
};
