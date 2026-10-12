import { createClient } from './client';

export interface SupabaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  category_id: string | null;
  subcategory_id: string | null;
  stock: number;
  slug: string | null;
  metal_options: string[];
  diamond_type: string[];
  carat_range: string | null;
  certification: string | null;
  production_time: string | null;
  is_active: boolean;
  is_featured?: boolean;
  is_bestseller?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  sku?: string | null;
  visibility?: string | null;
  created_at: string;
  // Master catalog fields
  master_product_id?: string | null;
  master_sku?: string | null;
  short_description?: string | null;
  long_description?: string | null;
  h1?: string | null;
  canonical_url?: string | null;
  breadcrumb?: string | null;
  primary_keyword?: string | null;
  secondary_keywords?: string[] | null;
  aeo_direct_answer?: string | null;
  aeo_faqs?: any[] | null;
  aeo_tags?: string[] | null;
  key_specifications?: Record<string, string> | null;
  product_page_status?: string | null;
  badge?: string | null;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  diamond_type: string;
  carat: string;
  price: number;
  stock: number;
  metal?: string;
  selling_price_gbp?: number | null;
  compare_price_gbp?: number | null;
  sale_price_gbp?: number | null;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  url: string;
  media_type: string;
  sort_order: number;
  alt_text: string | null;
}

export interface ProductReview {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  stock: number;
  slug: string;
}

function isSchemaError(error: { code?: string; message?: string }): boolean {
  if (!error) return false;
  if (error.code && typeof error.code === 'string') {
    const errorClass = error.code.substring(0, 2);
    if (errorClass === '42') return true;
    if (errorClass === '23') return false;
    if (errorClass === '08') return true;
  }
  if (error.message) {
    const schemaErrorPatterns = [
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /function.*does not exist/i,
      /syntax error/i,
    ];
    return schemaErrorPatterns.some((pattern) => pattern.test(error.message!));
  }
  return false;
}

export const productService = {
  async getAll(): Promise<SupabaseProduct[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[productService.getAll] Query error:', error.message, error.code);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getAll] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getByCategory(category: string): Promise<SupabaseProduct[]> {
    const supabase = createClient();
    try {
      const isFiltered = category && category !== 'All' && category !== '';

      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (isFiltered) {
        query = query.eq('category', category) as typeof query;
      }

      const { data, error } = await query;

      if (error) {
        console.error('[productService.getByCategory] Query error:', error.message, error.code);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getByCategory] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getByCategoryId(categoryId: string): Promise<SupabaseProduct[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category_id', categoryId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[productService.getByCategoryId] Query error:', error.message);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getByCategoryId] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getBySubcategoryId(subcategoryId: string): Promise<SupabaseProduct[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('subcategory_id', subcategoryId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[productService.getBySubcategoryId] Query error:', error.message);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getBySubcategoryId] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getMasterCategories(): Promise<CategoryRecord[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[productService.getMasterCategories] Query error:', error.message);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getMasterCategories] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getSubcategories(parentId: string): Promise<CategoryRecord[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[productService.getSubcategories] Query error:', error.message);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getSubcategories] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getAllCategoriesWithSubs(): Promise<{ category: CategoryRecord; subcategories: CategoryRecord[] }[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[productService.getAllCategoriesWithSubs] Query error:', error.message);
        return [];
      }

      const all: CategoryRecord[] = data || [];
      const masters = all.filter((c) => c.parent_id === null);
      return masters.map((cat) => ({
        category: cat,
        subcategories: all.filter((c) => c.parent_id === cat.id),
      }));
    } catch (error: unknown) {
      console.error('[productService.getAllCategoriesWithSubs] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getBySlug(slug: string): Promise<SupabaseProduct | null> {
    const supabase = createClient();
    try {
      const { data: bySlug, error: slugError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (!slugError && bySlug) return bySlug;

      const { data: byId, error: idError } = await supabase
        .from('products')
        .select('*')
        .eq('id', slug)
        .maybeSingle();

      if (!idError && byId) return byId;

      if (slugError) console.error('[productService.getBySlug] Slug error:', slugError.message);
      if (idError) console.error('[productService.getBySlug] ID error:', idError.message);
      return null;
    } catch (error: unknown) {
      console.error('[productService.getBySlug] Unexpected error:', (error as Error).message);
      return null;
    }
  },

  async getById(id: string): Promise<SupabaseProduct | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('[productService.getById] Query error:', error.message);
        return null;
      }
      return data;
    } catch (error: unknown) {
      console.error('[productService.getById] Unexpected error:', (error as Error).message);
      return null;
    }
  },

  async getRelated(categoryOrId: string, excludeId: string, limit = 4): Promise<SupabaseProduct[]> {
    const supabase = createClient();
    try {
      // Try category_id first (UUID pattern), fall back to text category
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryOrId);

      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .neq('id', excludeId)
        .limit(limit);

      if (isUuid) {
        query = query.eq('category_id', categoryOrId) as typeof query;
      } else {
        query = query.eq('category', categoryOrId) as typeof query;
      }

      const { data, error } = await query;

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('[productService.getRelated] Query error:', error.message);
        return [];
      }

      // If no results with category_id, fall back to text category
      if (isUuid && (!data || data.length === 0)) {
        const { data: fallback } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('id', excludeId)
          .limit(limit);
        return fallback || [];
      }

      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getRelated] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getVariants(productId: string): Promise<ProductVariant[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('diamond_type')
        .order('carat');

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('[productService.getVariants] Query error:', error.message);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getVariants] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getMedia(productId: string): Promise<ProductMedia[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('product_media')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('[productService.getMedia] Query error:', error.message);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getMedia] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async getReviews(productId: string): Promise<ProductReview[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('[productService.getReviews] Query error:', error.message);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getReviews] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async submitReview(review: { product_id: string; reviewer_name: string; reviewer_email?: string; rating: number; comment: string }): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('product_reviews').insert(review);
      if (error) {
        console.error('[productService.submitReview] Error:', error.message);
        return false;
      }
      return true;
    } catch (error: unknown) {
      console.error('[productService.submitReview] Unexpected error:', (error as Error).message);
      return false;
    }
  },

  async getFeatured(limit = 8): Promise<SupabaseProduct[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('[productService.getFeatured] Query error:', error.message);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.getFeatured] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async search(query: string): Promise<SupabaseProduct[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,master_product_id.ilike.%${query}%,master_sku.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        if (isSchemaError(error)) throw error;
        console.error('[productService.search] Query error:', error.message);
        return [];
      }
      return data || [];
    } catch (error: unknown) {
      console.error('[productService.search] Unexpected error:', (error as Error).message);
      return [];
    }
  },

  async addMedia(media: { product_id: string; url: string; media_type: string; sort_order: number; alt_text?: string }): Promise<ProductMedia | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('product_media')
        .insert(media)
        .select()
        .single();
      if (error) {
        console.error('[productService.addMedia] Error:', error.message);
        return null;
      }
      return data;
    } catch (error: unknown) {
      console.error('[productService.addMedia] Unexpected error:', (error as Error).message);
      return null;
    }
  },

  async deleteMedia(mediaId: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('product_media').delete().eq('id', mediaId);
      if (error) {
        console.error('[productService.deleteMedia] Error:', error.message);
        return false;
      }
      return true;
    } catch (error: unknown) {
      console.error('[productService.deleteMedia] Unexpected error:', (error as Error).message);
      return false;
    }
  },

  async upsertVariant(variant: Omit<ProductVariant, 'id'> & { id?: string }): Promise<ProductVariant | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .upsert(variant)
        .select()
        .single();
      if (error) {
        console.error('[productService.upsertVariant] Error:', error.message);
        return null;
      }
      return data;
    } catch (error: unknown) {
      console.error('[productService.upsertVariant] Unexpected error:', (error as Error).message);
      return null;
    }
  },

  async deleteVariant(variantId: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
      if (error) {
        console.error('[productService.deleteVariant] Error:', error.message);
        return false;
      }
      return true;
    } catch (error: unknown) {
      console.error('[productService.deleteVariant] Unexpected error:', (error as Error).message);
      return false;
    }
  },

  async create(product: ProductFormData): Promise<SupabaseProduct | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, is_active: true })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
      console.error('[productService.create] Error:', (error as Error).message);
      return null;
    }
  },

  async update(id: string, updates: Partial<ProductFormData>): Promise<SupabaseProduct | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
      console.error('[productService.update] Error:', (error as Error).message);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: unknown) {
      console.error('[productService.delete] Error:', (error as Error).message);
      return false;
    }
  },
};
