import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Allow up to 300 seconds for this long-running operation
export const maxDuration = 300;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BRACELET_CATEGORIES = ['bracelets', 'tennis bracelets', 'tennis bracelet', 'bracelet'];
const BRACELET_CARAT_STEPS = ['1.00', '2.00', '3.00', '4.00', '5.00'];
const BATCH_SIZE = 500;

function isBraceletCategory(category: string): boolean {
  return BRACELET_CATEGORIES.some(b => category.toLowerCase().includes(b));
}

function getMetalCode(metal: string): string | null {
  const m = metal.trim().toLowerCase();
  if (m.includes('14') && m.includes('white')) return '14WG';
  if (m.includes('14') && m.includes('yellow')) return '14YG';
  if (m.includes('14') && m.includes('rose')) return '14RG';
  if (m.includes('18') && m.includes('white')) return '18WG';
  if (m.includes('18') && m.includes('yellow')) return '18YG';
  if (m.includes('18') && m.includes('rose')) return '18RG';
  if (m.includes('platinum') || m.includes('pt950') || m.includes('pt 950')) return 'PT950';
  if (m === 'platinum') return 'PT950';
  if (m.includes('silver') || m.includes('sterling')) return 'SS925';
  if (m.includes('gold') && m.includes('white')) return '18WG';
  if (m.includes('gold') && m.includes('yellow')) return '18YG';
  if (m.includes('gold') && m.includes('rose')) return '18RG';
  if (m.includes('gold')) return '18YG';
  return null;
}

function getStoneCode(stone: string): string | null {
  const s = stone.trim().toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
  if (s.includes('lab') && (s.includes('grown') || s.includes('created') || s.includes('cvd') || s.includes('hpht'))) return 'LGD';
  if (s === 'natural' || s.includes('natural diamond') || s.includes('natural stone')) return 'ND';
  if (s.includes('natural')) return 'ND';
  if (s.includes('moissanite')) return 'MOI';
  if (s.includes('gemstone') || s.includes('gem') || s.includes('sapphire') || s.includes('ruby') || s.includes('emerald')) return 'GEM';
  if (s.includes('diamond')) return 'ND';
  return null;
}

function normalizeStoneForStorage(stone: string): string {
  const s = stone.trim().toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
  if (s.includes('lab') && (s.includes('grown') || s.includes('created'))) return 'Lab-Grown';
  if (s === 'natural' || s.includes('natural')) return 'Natural';
  if (s.includes('moissanite')) return 'Moissanite';
  if (s.includes('gemstone') || s.includes('gem')) return 'Gemstone';
  return stone.trim();
}

function generateVariantSku(
  productSku: string,
  metal: string,
  diamondType: string,
  carat: string
): string | null {
  if (!productSku) return null;
  const metalCode = getMetalCode(metal);
  const stoneCode = getStoneCode(diamondType);
  if (!metalCode || !stoneCode) return null;
  let caratCode: string;
  if (carat.toLowerCase().includes('custom')) {
    caratCode = 'CUSTOM';
  } else {
    const caratNum = parseFloat(carat);
    if (isNaN(caratNum)) return null;
    caratCode = `${Math.round(caratNum * 100)}CT`;
  }
  return `${productSku}-${metalCode}-${stoneCode}-${caratCode}`;
}

function isAttributeMissing(value: string[] | null | undefined): boolean {
  if (!value || value.length === 0) return true;
  return value.every(v => !v || v.trim() === '');
}

function buildExistenceKey(productId: string, metal: string, stoneType: string, carat: string): string {
  const normalizedStone = normalizeStoneForStorage(stoneType);
  return `${productId}|${metal}|${normalizedStone}|${carat}`;
}

function findCategoryRule(category: string, ruleMap: Record<string, any>): any | null {
  const cat = category.toLowerCase().trim();
  if (ruleMap[cat]) return ruleMap[cat];
  for (const key of Object.keys(ruleMap)) {
    if (cat.includes(key) || key.includes(cat)) return ruleMap[key];
  }
  const parts = cat.split(/[&\/]|and\b/).map(p => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (ruleMap[part]) return ruleMap[part];
    for (const key of Object.keys(ruleMap)) {
      if (part.includes(key) || key.includes(part)) return ruleMap[key];
    }
  }
  return null;
}

interface VariantPlan {
  productId: string;
  productName: string;
  productSku: string | null;
  category: string;
  metal: string;
  diamondType: string;
  carat: string;
  variantSku: string | null;
  skipReason: string | null;
}

interface PreviewResult {
  approvedCount: number;
  variantsToCreate: number;
  alreadyExisting: number;
  skipped: number;
  requiresData: number;
  errors: number;
  plans: VariantPlan[];
  existingVariantKeys: string[];
}

// GET: Preview what would be created
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { data: approvals, error: appErr } = await supabaseAdmin
      .from('variant_approvals')
      .select('*')
      .eq('approval_status', 'approved');

    if (appErr) throw appErr;
    if (!approvals || approvals.length === 0) {
      return NextResponse.json({
        approvedCount: 0,
        variantsToCreate: 0,
        alreadyExisting: 0,
        skipped: 0,
        requiresData: 0,
        errors: 0,
        plans: [],
        existingVariantKeys: [],
      } as PreviewResult);
    }

    const productIds = approvals.map((a: any) => a.product_id);

    const { data: products, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, category, metal_options, diamond_type, carat_range, price')
      .in('id', productIds);

    if (pErr) throw pErr;

    const productMap: Record<string, any> = {};
    (products || []).forEach((p: any) => { productMap[p.id] = p; });

    const { data: rules } = await supabaseAdmin
      .from('category_variant_rules')
      .select('*');

    const ruleMap: Record<string, any> = {};
    (rules || []).forEach((r: any) => { ruleMap[r.category_name.toLowerCase()] = r; });

    const { data: existingVariants } = await supabaseAdmin
      .from('product_variants')
      .select('id, product_id, metal, diamond_type, carat, sku')
      .in('product_id', productIds);

    const existingKeys = new Set<string>();
    (existingVariants || []).forEach((v: any) => {
      const key = buildExistenceKey(v.product_id, v.metal || '', v.diamond_type || '', v.carat || '');
      existingKeys.add(key);
      const rawKey = `${v.product_id}|${v.metal || ''}|${v.diamond_type || ''}|${v.carat || ''}`;
      existingKeys.add(rawKey);
    });

    const plans: VariantPlan[] = [];
    let alreadyExisting = 0;
    let requiresData = 0;

    for (const approval of approvals) {
      const product = productMap[approval.product_id];
      if (!product) continue;

      const cat = product.category?.toLowerCase() || '';
      const isBracelet = isBraceletCategory(cat);
      const rule = findCategoryRule(product.category || '', ruleMap);

      if (!product.sku || product.sku.trim() === '') {
        plans.push({
          productId: product.id,
          productName: product.name,
          productSku: null,
          category: product.category,
          metal: '',
          diamondType: '',
          carat: '',
          variantSku: null,
          skipReason: 'DATA REQUIRED — Product Master SKU is missing. Run "Assign Master SKUs" first.',
        });
        requiresData++;
        continue;
      }

      const metals: string[] = (approval.metal_options && approval.metal_options.length > 0)
        ? approval.metal_options.filter((m: string) => m && m.trim())
        : (product.metal_options || []).filter((m: string) => m && m.trim());

      const stoneTypes: string[] = (approval.stone_types && approval.stone_types.length > 0)
        ? approval.stone_types.filter((s: string) => s && s.trim())
        : (product.diamond_type || []).filter((s: string) => s && s.trim());

      if (isAttributeMissing(metals)) {
        plans.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          category: product.category,
          metal: '',
          diamondType: '',
          carat: '',
          variantSku: null,
          skipReason: 'DATA REQUIRED — Missing metal options.',
        });
        requiresData++;
        continue;
      }

      if (isAttributeMissing(stoneTypes)) {
        plans.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          category: product.category,
          metal: '',
          diamondType: '',
          carat: '',
          variantSku: null,
          skipReason: 'DATA REQUIRED — Missing stone/diamond types.',
        });
        requiresData++;
        continue;
      }

      let caratSteps: string[];
      let includeCustom = false;

      if (isBracelet) {
        caratSteps = BRACELET_CARAT_STEPS;
        includeCustom = true;
      } else if (rule) {
        caratSteps = (rule.valid_carat_steps || []).filter((c: string) => c && c.trim());
        includeCustom = rule.supports_custom_carat || false;
        if (caratSteps.length === 0) {
          plans.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            category: product.category,
            metal: '',
            diamondType: '',
            carat: '',
            variantSku: null,
            skipReason: 'DATA REQUIRED — Category rule has no valid carat steps defined.',
          });
          requiresData++;
          continue;
        }
      } else {
        plans.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          category: product.category,
          metal: '',
          diamondType: '',
          carat: '',
          variantSku: null,
          skipReason: `DATA REQUIRED — No category rule found for "${product.category}". Admin review needed.`,
        });
        requiresData++;
        continue;
      }

      const allCarats = includeCustom ? [...caratSteps, 'Custom 6ct+'] : caratSteps;

      for (const metal of metals) {
        for (const stoneType of stoneTypes) {
          for (const carat of allCarats) {
            const normalizedStone = normalizeStoneForStorage(stoneType);
            const key = buildExistenceKey(product.id, metal, stoneType, carat);
            const rawKey = `${product.id}|${metal}|${normalizedStone}|${carat}`;

            if (existingKeys.has(key) || existingKeys.has(rawKey)) {
              alreadyExisting++;
              plans.push({
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                category: product.category,
                metal,
                diamondType: stoneType,
                carat,
                variantSku: null,
                skipReason: 'Already exists in database',
              });
              continue;
            }

            const variantSku = generateVariantSku(product.sku, metal, stoneType, carat);

            if (!variantSku) {
              plans.push({
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                category: product.category,
                metal,
                diamondType: stoneType,
                carat,
                variantSku: null,
                skipReason: `DATA REQUIRED — Unrecognised metal "${metal}" or stone "${stoneType}". Cannot generate variant SKU code.`,
              });
              requiresData++;
            } else {
              plans.push({
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                category: product.category,
                metal,
                diamondType: stoneType,
                carat,
                variantSku,
                skipReason: null,
              });
            }
          }
        }
      }
    }

    const toCreate = plans.filter(p => !p.skipReason).length;
    let skipped = plans.filter(p => p.skipReason && p.skipReason !== 'Already exists in database' && !p.skipReason.startsWith('DATA')).length;

    return NextResponse.json({
      approvedCount: approvals.length,
      variantsToCreate: toCreate,
      alreadyExisting,
      skipped,
      requiresData,
      errors: 0,
      plans,
      existingVariantKeys: Array.from(existingKeys),
    } as PreviewResult);
  } catch (err: any) {
    console.error('[create-approved-variants GET]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST: Execute variant creation using batch inserts
export async function POST(_req: NextRequest): Promise<NextResponse> {
  try {
    const runId = crypto.randomUUID();

    // 1. Fetch approved products
    const { data: approvals, error: appErr } = await supabaseAdmin
      .from('variant_approvals')
      .select('*')
      .eq('approval_status', 'approved');

    if (appErr) throw appErr;
    if (!approvals || approvals.length === 0) {
      return NextResponse.json({ success: true, runId, created: 0, skipped: 0, alreadyExisting: 0, requiresData: 0, errors: 0, report: [] });
    }

    const productIds = approvals.map((a: any) => a.product_id);

    // 2. Fetch product data
    const { data: products, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, category, metal_options, diamond_type, carat_range, price')
      .in('id', productIds);

    if (pErr) throw pErr;

    const productMap: Record<string, any> = {};
    (products || []).forEach((p: any) => { productMap[p.id] = p; });

    // 3. Fetch category rules
    const { data: rules } = await supabaseAdmin
      .from('category_variant_rules')
      .select('*');

    const ruleMap: Record<string, any> = {};
    (rules || []).forEach((r: any) => { ruleMap[r.category_name.toLowerCase()] = r; });

    // 4. Fetch ALL existing variants for these products (for deduplication)
    const { data: existingVariants } = await supabaseAdmin
      .from('product_variants')
      .select('id, product_id, metal, diamond_type, carat, sku')
      .in('product_id', productIds);

    const existingKeys = new Set<string>();
    const existingSkus = new Set<string>();
    (existingVariants || []).forEach((v: any) => {
      const key = buildExistenceKey(v.product_id, v.metal || '', v.diamond_type || '', v.carat || '');
      existingKeys.add(key);
      const rawKey = `${v.product_id}|${v.metal || ''}|${v.diamond_type || ''}|${v.carat || ''}`;
      existingKeys.add(rawKey);
      if (v.sku) existingSkus.add(v.sku);
    });

    // Track generated SKUs within this run to prevent duplicates
    const generatedSkusThisRun = new Set<string>();

    // 5. Build all variant records to insert + per-product report
    // variantsToInsert: { record, productId, metal, stoneType, carat, variantSku }
    const variantsToInsert: Array<{
      record: any;
      productId: string;
      metal: string;
      stoneType: string;
      carat: string;
      variantSku: string;
    }> = [];

    const logEntries: any[] = [];
    let alreadyExisting = 0;
    let requiresData = 0;
    let skipped = 0;

    // Per-product report map
    const productReportMap: Record<string, {
      productId: string;
      productName: string;
      productSku: string | null;
      category: string;
      status: string;
      skipReason?: string;
      variantsCreated: { variantId: string; variantSku: string; metal: string; stoneType: string; carat: string }[];
      variantsSkipped: { metal: string; stoneType: string; carat: string }[];
      variantsExisting: { metal: string; stoneType: string; carat: string }[];
      variantsRequiringData: { metal: string; stoneType: string; carat: string; reason: string }[];
      errors: { metal: string; stoneType: string; carat: string; error: string }[];
    }> = {};

    for (const approval of approvals) {
      const product = productMap[approval.product_id];
      if (!product) continue;

      productReportMap[product.id] = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku || null,
        category: product.category,
        status: 'processed',
        variantsCreated: [],
        variantsSkipped: [],
        variantsExisting: [],
        variantsRequiringData: [],
        errors: [],
      };

      const cat = product.category?.toLowerCase() || '';
      const isBracelet = isBraceletCategory(cat);
      const rule = findCategoryRule(product.category || '', ruleMap);

      if (!product.sku || product.sku.trim() === '') {
        requiresData++;
        productReportMap[product.id].status = 'skipped_data_required';
        productReportMap[product.id].skipReason = 'Product Master SKU is missing. Run "Assign Master SKUs" first.';
        logEntries.push({
          run_id: runId,
          product_id: product.id,
          product_name: product.name,
          product_sku: null,
          status: 'skipped_data_required',
          skip_reason: 'Product has no Master SKU.',
        });
        continue;
      }

      const metals: string[] = (approval.metal_options && approval.metal_options.length > 0)
        ? approval.metal_options.filter((m: string) => m && m.trim())
        : (product.metal_options || []).filter((m: string) => m && m.trim());

      const stoneTypes: string[] = (approval.stone_types && approval.stone_types.length > 0)
        ? approval.stone_types.filter((s: string) => s && s.trim())
        : (product.diamond_type || []).filter((s: string) => s && s.trim());

      if (isAttributeMissing(metals)) {
        requiresData++;
        productReportMap[product.id].status = 'skipped_data_required';
        productReportMap[product.id].skipReason = 'Missing metal options.';
        logEntries.push({
          run_id: runId,
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          status: 'skipped_data_required',
          skip_reason: 'Missing metal options.',
        });
        continue;
      }

      if (isAttributeMissing(stoneTypes)) {
        requiresData++;
        productReportMap[product.id].status = 'skipped_data_required';
        productReportMap[product.id].skipReason = 'Missing stone/diamond types.';
        logEntries.push({
          run_id: runId,
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          status: 'skipped_data_required',
          skip_reason: 'Missing stone/diamond types.',
        });
        continue;
      }

      let caratSteps: string[];
      let includeCustom = false;

      if (isBracelet) {
        caratSteps = BRACELET_CARAT_STEPS;
        includeCustom = true;
      } else if (rule) {
        caratSteps = (rule.valid_carat_steps || []).filter((c: string) => c && c.trim());
        includeCustom = rule.supports_custom_carat || false;
        if (caratSteps.length === 0) {
          requiresData++;
          productReportMap[product.id].status = 'skipped_data_required';
          productReportMap[product.id].skipReason = 'Category rule has no valid carat steps defined.';
          logEntries.push({
            run_id: runId,
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            status: 'skipped_data_required',
            skip_reason: 'Category rule has no valid carat steps.',
          });
          continue;
        }
      } else {
        requiresData++;
        productReportMap[product.id].status = 'skipped_data_required';
        productReportMap[product.id].skipReason = `No category rule found for "${product.category}".`;
        logEntries.push({
          run_id: runId,
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          status: 'skipped_data_required',
          skip_reason: `No category rule found for "${product.category}".`,
        });
        continue;
      }

      const allCarats = includeCustom ? [...caratSteps, 'Custom 6ct+'] : caratSteps;

      for (const metal of metals) {
        for (const stoneType of stoneTypes) {
          for (const carat of allCarats) {
            const normalizedStone = normalizeStoneForStorage(stoneType);
            const key = buildExistenceKey(product.id, metal, stoneType, carat);
            const rawKey = `${product.id}|${metal}|${normalizedStone}|${carat}`;

            // Check if variant already exists
            if (existingKeys.has(key) || existingKeys.has(rawKey)) {
              alreadyExisting++;
              productReportMap[product.id].variantsExisting.push({ metal, stoneType, carat });
              continue;
            }

            // Generate Variant SKU automatically
            const variantSku = generateVariantSku(product.sku, metal, stoneType, carat);

            if (!variantSku) {
              requiresData++;
              productReportMap[product.id].variantsRequiringData.push({
                metal,
                stoneType,
                carat,
                reason: `Unrecognised metal "${metal}" or stone "${stoneType}" — cannot generate SKU code`,
              });
              logEntries.push({
                run_id: runId,
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                metal,
                diamond_type: stoneType,
                carat,
                status: 'skipped_no_sku',
                skip_reason: `Cannot generate variant SKU — unrecognised metal "${metal}" or stone "${stoneType}"`,
              });
              continue;
            }

            // Check for duplicate SKU (in DB or in this run)
            if (existingSkus.has(variantSku) || generatedSkusThisRun.has(variantSku)) {
              skipped++;
              productReportMap[product.id].variantsSkipped.push({ metal, stoneType, carat });
              logEntries.push({
                run_id: runId,
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                metal,
                diamond_type: stoneType,
                carat,
                variant_sku: variantSku,
                status: 'skipped_duplicate_sku',
                skip_reason: `Duplicate variant SKU ${variantSku}`,
              });
              continue;
            }

            // Mark as seen to prevent duplicates within this run
            generatedSkusThisRun.add(variantSku);
            existingKeys.add(key);
            existingKeys.add(rawKey);

            variantsToInsert.push({
              record: {
                product_id: product.id,
                diamond_type: normalizedStone,
                carat,
                metal,
                price: 0,
                stock: 0,
                sku: variantSku,
                is_enabled: false,
              },
              productId: product.id,
              metal,
              stoneType,
              carat,
              variantSku,
            });

            logEntries.push({
              run_id: runId,
              product_id: product.id,
              product_name: product.name,
              product_sku: product.sku,
              metal,
              diamond_type: stoneType,
              carat,
              variant_sku: variantSku,
              status: 'created',
            });
          }
        }
      }
    }

    // 6. Batch insert variants in chunks of BATCH_SIZE
    let created = 0;
    let errors = 0;

    for (let i = 0; i < variantsToInsert.length; i += BATCH_SIZE) {
      const batch = variantsToInsert.slice(i, i + BATCH_SIZE);
      const records = batch.map(v => v.record);

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('product_variants')
        .insert(records)
        .select('id, sku');

      if (insertErr) {
        errors += batch.length;
        // Mark all in this batch as errors in the report
        for (const v of batch) {
          productReportMap[v.productId].errors.push({
            metal: v.metal,
            stoneType: v.stoneType,
            carat: v.carat,
            error: insertErr.message,
          });
          // Update log entry status
          const logIdx = logEntries.findIndex(l => l.variant_sku === v.variantSku && l.status === 'created');
          if (logIdx >= 0) {
            logEntries[logIdx].status = 'error';
            logEntries[logIdx].error_message = insertErr.message;
          }
        }
      } else {
        created += (inserted || []).length;
        // Map inserted IDs back to report
        const insertedMap: Record<string, string> = {};
        for (const ins of (inserted || [])) {
          if (ins.sku) insertedMap[ins.sku] = ins.id;
        }
        for (const v of batch) {
          const variantId = insertedMap[v.variantSku] || '';
          productReportMap[v.productId].variantsCreated.push({
            variantId,
            variantSku: v.variantSku,
            metal: v.metal,
            stoneType: v.stoneType,
            carat: v.carat,
          });
          // Update log entry with variant ID
          const logIdx = logEntries.findIndex(l => l.variant_sku === v.variantSku && l.status === 'created');
          if (logIdx >= 0 && variantId) {
            logEntries[logIdx].variant_id = variantId;
          }
        }
      }
    }

    // 7. Write log entries in batches
    const safeLogEntries = logEntries.map(l => {
      const entry: any = {
        run_id: l.run_id,
        product_id: l.product_id,
        product_name: l.product_name,
        product_sku: l.product_sku,
        metal: l.metal || null,
        diamond_type: l.diamond_type || null,
        carat: l.carat || null,
        variant_sku: l.variant_sku || null,
        status: l.status,
        skip_reason: l.skip_reason || null,
        error_message: l.error_message || null,
      };
      if (l.variant_id) entry.variant_id = l.variant_id;
      return entry;
    });

    for (let i = 0; i < safeLogEntries.length; i += BATCH_SIZE) {
      const batch = safeLogEntries.slice(i, i + BATCH_SIZE);
      await supabaseAdmin.from('variant_creation_log').insert(batch);
    }

    const report = Object.values(productReportMap);

    return NextResponse.json({
      success: errors === 0,
      runId,
      created,
      skipped,
      alreadyExisting,
      requiresData,
      errors,
      report,
    });
  } catch (err: any) {
    console.error('[create-approved-variants POST]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
