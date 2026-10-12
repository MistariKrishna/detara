import { redirect } from 'next/navigation';

export default function ProductsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams;
  
  // This is a catch-all for old /products?category_id=... URLs
  // The actual redirect logic will be handled by middleware or Next.js rewrites
  // For now, just return the products page
  return null;
}
