import { createClient } from './client';

export interface ContentPage {
  id: string;
  page_key: string;
  title: string;
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  updated_at: string;
}

export async function getContentPage(pageKey: string): Promise<ContentPage | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('content_pages')
    .select('*')
    .eq('page_key', pageKey)
    .eq('is_published', true)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function getAllContentPages(): Promise<ContentPage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('content_pages')
    .select('*')
    .order('page_key');
  if (error || !data) return [];
  return data;
}
