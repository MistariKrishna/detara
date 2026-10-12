import { createClient } from '@/lib/supabase/client';

export interface SiteContent {
  key: string;
  value: string;
  section: string;
}

export async function getSiteContent(section?: string): Promise<Record<string, string>> {
  const supabase = createClient();
  let query = supabase.from('site_content').select('key, value');
  if (section) {
    query = query.eq('section', section);
  }
  const { data, error } = await query;
  if (error || !data) return {};
  return data.reduce((acc: Record<string, string>, item: { key: string; value: string }) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

export async function getSiteContentByKeys(keys: string[]): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_content')
    .select('key, value')
    .in('key', keys);
  if (error || !data) return {};
  return data.reduce((acc: Record<string, string>, item: { key: string; value: string }) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}
