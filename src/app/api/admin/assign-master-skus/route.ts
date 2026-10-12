import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * DETARA Master SKU generation logic.
 *
 * Convention: DTR-{CATEGORY_CODE}{SEQUENCE}
 * e.g. DTR-RNG001, DTR-ENG001, DTR-BRC001
 */
function getCategoryCode(category: string): string {
  const cat = (category || '').toLowerCase().trim();
  if (cat.includes('tennis bracelet')) return 'TBR';
  if (cat.includes('bracelet')) return 'BRC';
  if (cat.includes('engagement')) return 'ENG';
  if (cat.includes('diamond band') || cat.includes('band')) return 'BND';
  if (cat.includes('stud') || cat.includes('diamond stud')) return 'STD';
  if (cat.includes('earring')) return 'EAR';
  if (cat.includes('necklace')) return 'NCK';
  if (cat.includes('pendant')) return 'PND';
  if (cat.includes("men's") || cat.includes('mens') || cat.includes('men')) return 'MNS';
  if (cat.includes('gemstone')) return 'GEM';
  if (cat.includes('ring')) return 'RNG';
  return 'PRD';
}

/** Returns true if the SKU value is considered "missing" (null, undefined, or empty string) */
function isSkuMissing(sku: string | null | undefined): boolean {
  return !sku || sku.trim() === '';
}

interface SkuPreviewRow {
  productId: string;
  productName: string;
  category: string;
  currentSku: string | null;
  proposedSku: string | null;
  action: 'assign' | 'preserve' | 'error';
  reason?: string;
}

interface PreviewResponse {
  totalProducts: number;
  existingSkusPreserved: number;
  newSkusToAssign: number;
  duplicateSkuCount: number;
  errors: number;
  preview: SkuPreviewRow[];
}

interface ConfirmResponse {
  totalChecked: number;
  existingSkusPreserved: number;
  newSkusAssigned: number;
  duplicateSkuCount: number;
  stillMissingSku: number;
  productVariantsChanged: false;
  pricesChanged: false;
  auditLog: { productId: string; productName: string; assignedSku: string }[];
  errors: string[];
}

// ── GET: Preview ──────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, category')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    if (!products || products.length === 0) {
      return NextResponse.json({
        totalProducts: 0,
        existingSkusPreserved: 0,
        newSkusToAssign: 0,
        duplicateSkuCount: 0,
        errors: 0,
        preview: [],
      } as PreviewResponse);
    }

    // Collect all existing non-empty SKUs to prevent duplicates
    const existingSkuSet = new Set<string>(
      products
        .filter((p: any) => !isSkuMissing(p.sku))
        .map((p: any) => p.sku.trim().toUpperCase())
    );

    // Parse existing SKUs to find current max sequence per category code
    const categorySequences: Record<string, number> = {};
    for (const sku of existingSkuSet) {
      const match = sku.match(/^DTR-([A-Z]+)(\d+)$/);
      if (match) {
        const code = match[1];
        const seq = parseInt(match[2], 10);
        if (!categorySequences[code] || seq > categorySequences[code]) {
          categorySequences[code] = seq;
        }
      }
    }

    const preview: SkuPreviewRow[] = [];
    const proposedSkuSet = new Set<string>(existingSkuSet);
    let duplicateCount = 0;
    let errorCount = 0;

    for (const product of products) {
      if (!isSkuMissing(product.sku)) {
        // Already has a SKU — preserve it
        preview.push({
          productId: product.id,
          productName: product.name,
          category: product.category || '—',
          currentSku: product.sku,
          proposedSku: product.sku,
          action: 'preserve',
          reason: 'Existing SKU preserved',
        });
        continue;
      }

      // Generate a new SKU
      const catCode = getCategoryCode(product.category || '');
      if (!categorySequences[catCode]) categorySequences[catCode] = 0;
      categorySequences[catCode]++;

      let candidate = `DTR-${catCode}${String(categorySequences[catCode]).padStart(3, '0')}`;

      if (proposedSkuSet.has(candidate.toUpperCase())) {
        // Collision — keep incrementing
        let found = false;
        for (let extra = 1; extra <= 9999; extra++) {
          const alt = `DTR-${catCode}${String(categorySequences[catCode] + extra).padStart(3, '0')}`;
          if (!proposedSkuSet.has(alt.toUpperCase())) {
            categorySequences[catCode] = categorySequences[catCode] + extra;
            proposedSkuSet.add(alt.toUpperCase());
            preview.push({
              productId: product.id,
              productName: product.name,
              category: product.category || '—',
              currentSku: null,
              proposedSku: alt,
              action: 'assign',
            });
            found = true;
            break;
          }
        }
        if (!found) {
          duplicateCount++;
          errorCount++;
          preview.push({
            productId: product.id,
            productName: product.name,
            category: product.category || '—',
            currentSku: null,
            proposedSku: null,
            action: 'error',
            reason: 'Could not generate unique SKU — too many collisions',
          });
        }
      } else {
        proposedSkuSet.add(candidate.toUpperCase());
        preview.push({
          productId: product.id,
          productName: product.name,
          category: product.category || '—',
          currentSku: null,
          proposedSku: candidate,
          action: 'assign',
        });
      }
    }

    const response: PreviewResponse = {
      totalProducts: products.length,
      existingSkusPreserved: preview.filter(r => r.action === 'preserve').length,
      newSkusToAssign: preview.filter(r => r.action === 'assign').length,
      duplicateSkuCount: duplicateCount,
      errors: errorCount,
      preview,
    };

    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to generate SKU preview' }, { status: 500 });
  }
}

// ── POST: Confirm and write ───────────────────────────────────────────────────
export async function POST(_req: NextRequest): Promise<NextResponse> {
  try {
    // Re-run the same generation logic deterministically
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, category')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    if (!products || products.length === 0) {
      return NextResponse.json({
        totalChecked: 0,
        existingSkusPreserved: 0,
        newSkusAssigned: 0,
        duplicateSkuCount: 0,
        stillMissingSku: 0,
        productVariantsChanged: false,
        pricesChanged: false,
        auditLog: [],
        errors: [],
      } as ConfirmResponse);
    }

    const existingSkuSet = new Set<string>(
      products
        .filter((p: any) => !isSkuMissing(p.sku))
        .map((p: any) => p.sku.trim().toUpperCase())
    );

    const categorySequences: Record<string, number> = {};
    for (const sku of existingSkuSet) {
      const match = sku.match(/^DTR-([A-Z]+)(\d+)$/);
      if (match) {
        const code = match[1];
        const seq = parseInt(match[2], 10);
        if (!categorySequences[code] || seq > categorySequences[code]) {
          categorySequences[code] = seq;
        }
      }
    }

    const proposedSkuSet = new Set<string>(existingSkuSet);
    const auditLog: { productId: string; productName: string; assignedSku: string }[] = [];
    const errors: string[] = [];
    let preserved = 0;
    let assigned = 0;
    let duplicates = 0;

    for (const product of products) {
      if (!isSkuMissing(product.sku)) {
        preserved++;
        continue;
      }

      const catCode = getCategoryCode(product.category || '');
      if (!categorySequences[catCode]) categorySequences[catCode] = 0;
      categorySequences[catCode]++;

      let candidate = `DTR-${catCode}${String(categorySequences[catCode]).padStart(3, '0')}`;

      if (proposedSkuSet.has(candidate.toUpperCase())) {
        let found = false;
        for (let extra = 1; extra <= 9999; extra++) {
          const alt = `DTR-${catCode}${String(categorySequences[catCode] + extra).padStart(3, '0')}`;
          if (!proposedSkuSet.has(alt.toUpperCase())) {
            categorySequences[catCode] = categorySequences[catCode] + extra;
            candidate = alt;
            found = true;
            break;
          }
        }
        if (!found) {
          duplicates++;
          errors.push(`Product ${product.id} (${product.name}): Could not generate unique SKU`);
          continue;
        }
      }

      proposedSkuSet.add(candidate.toUpperCase());

      // Update ONLY the sku field — no other fields touched
      // Use .or() to catch both NULL and empty-string SKUs safely
      const { error: updateErr } = await supabaseAdmin
        .from('products')
        .update({ sku: candidate })
        .eq('id', product.id)
        .or('sku.is.null,sku.eq.');

      if (updateErr) {
        errors.push(`Product ${product.id} (${product.name}): ${updateErr.message}`);
      } else {
        assigned++;
        auditLog.push({ productId: product.id, productName: product.name, assignedSku: candidate });
      }
    }

    // Count products still missing SKU after update
    const { count: stillMissing } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .or('sku.is.null,sku.eq.');

    const response: ConfirmResponse = {
      totalChecked: products.length,
      existingSkusPreserved: preserved,
      newSkusAssigned: assigned,
      duplicateSkuCount: duplicates,
      stillMissingSku: stillMissing || 0,
      productVariantsChanged: false,
      pricesChanged: false,
      auditLog,
      errors,
    };

    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to assign SKUs' }, { status: 500 });
  }
}
