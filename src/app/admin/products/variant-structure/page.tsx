'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  metal_options: string[];
  diamond_type: string[];
  carat_range: string | null;
  price: number;
  is_active: boolean;
}

interface VariantRow {
  id: string;
  product_id: string;
  diamond_type: string;
  carat: string;
  metal: string | null;
  price: number;
  sku: string | null;
  is_enabled: boolean;
}

interface CategoryRule {
  category_name: string;
  valid_metals: string[];
  valid_stone_types: string[];
  valid_carat_steps: string[];
  supports_custom_carat: boolean;
  custom_carat_label: string;
  notes: string | null;
}

type ApprovalStatus = 'pending_review' | 'approved' | 'needs_review' | 'excluded';

interface ApprovalRecord {
  id?: string;
  product_id: string;
  approval_status: ApprovalStatus;
  recommended_structure: string | null;
  metal_options: string[] | null;
  stone_types: string[] | null;
  carat_options: string[] | null;
  quality_options: string[] | null;
  custom_carat: boolean;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
}

interface ProductAudit {
  product: ProductRow;
  variants: VariantRow[];
  issues: AuditIssue[];
  status: 'ok' | 'warning' | 'critical' | 'data_required';
  recommendedCaratSteps: string[];
  supportsCustomCarat: boolean;
  categoryRule: CategoryRule | null;
}

interface AuditIssue {
  type: 'missing_variants' | 'options_only' | 'bracelet_wrong_carats' | 'custom_carat_needed' | 'invalid_metal' | 'diamond_quality_mismatch' | 'price_anomaly' | 'data_required' | 'no_sku' | 'wrong_start_carat';
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

interface AuditSummary {
  total: number;
  withRealVariants: number;
  optionsOnly: number;
  missingVariants: number;
  braceletProducts: number;
  customCaratProducts: number;
  pricingAnomalies: number;
  dataRequired: number;
  missingSkus: number;
  wrongStartCarat: number;
}

// ── Bracelet categories ───────────────────────────────────────────────────────
const BRACELET_CATEGORIES = ['bracelets', 'tennis bracelets', 'tennis bracelet', 'bracelet'];
const BRACELET_VALID_CARATS = ['1.00', '2.00', '3.00', '4.00', '5.00'];

// ── Variant Creation Types ────────────────────────────────────────────────────
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
}

interface CreationResult {
  success: boolean;
  runId: string;
  created: number;
  skipped: number;
  alreadyExisting: number;
  requiresData: number;
  errors: number;
  report: CreationProductReport[];
  error?: string;
}

interface CreationProductReport {
  productId: string;
  productName: string;
  productSku: string | null;
  category?: string;
  status: string;
  skipReason?: string;
  variantsCreated: { variantId: string; variantSku: string; metal: string; stoneType: string; carat: string }[];
  variantsSkipped: { metal: string; stoneType: string; carat: string }[];
  variantsExisting: { metal: string; stoneType: string; carat: string }[];
  variantsRequiringData: { metal: string; stoneType: string; carat: string; reason: string }[];
  errors: { metal: string; stoneType: string; carat: string; error: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isBraceletCategory(category: string): boolean {
  return BRACELET_CATEGORIES.some(b => category.toLowerCase().includes(b));
}

function hasWrongStartCarat(product: ProductRow, variants: VariantRow[]): boolean {
  if (isBraceletCategory(product.category || '')) {
    if (product.carat_range && product.carat_range.includes('0.30')) return true;
    if (variants.some(v => parseFloat(v.carat) < 0.5 && parseFloat(v.carat) > 0)) return true;
  }
  return false;
}

function detectIssues(product: ProductRow, variants: VariantRow[], rule: CategoryRule | null): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const cat = product.category?.toLowerCase() || '';

  if (variants.length === 0) {
    if (product.metal_options?.length > 0 || product.diamond_type?.length > 0) {
      issues.push({
        type: 'options_only',
        severity: 'critical',
        message: `Has ${product.metal_options?.length || 0} metal option(s) and ${product.diamond_type?.length || 0} stone type(s) in option text but ZERO actual variant records in database.`,
      });
    } else {
      issues.push({
        type: 'missing_variants',
        severity: 'critical',
        message: 'No variants and no option text found. Product has no variant structure defined.',
      });
    }
  }

  if (isBraceletCategory(cat)) {
    const variantCarats = variants.map(v => parseFloat(v.carat).toFixed(2));
    const invalidCarats = variantCarats.filter(c => !BRACELET_VALID_CARATS.includes(c));
    if (invalidCarats.length > 0) {
      issues.push({
        type: 'bracelet_wrong_carats',
        severity: 'critical',
        message: `BRACELET RULE VIOLATION: Found carat values [${invalidCarats.join(', ')}]. Bracelets must use 1ct/2ct/3ct/4ct/5ct only. Do NOT use 0.30ct/0.50ct steps.`,
      });
    }
    if (variants.length === 0 && product.carat_range) {
      issues.push({
        type: 'bracelet_wrong_carats',
        severity: 'critical',
        message: `Bracelet has carat_range "${product.carat_range}" but NO actual variants. Must create 1ct/2ct/3ct/4ct/5ct + Custom 6ct+ variants — do NOT auto-generate from carat range.`,
      });
    }
    if (product.carat_range && product.carat_range.includes('0.30')) {
      issues.push({
        type: 'wrong_start_carat',
        severity: 'critical',
        message: `WRONG START CARAT: carat_range shows "0.30ct" start. Bracelets must start at 1ct, not 0.30ct.`,
      });
    }
    if (variants.some(v => parseFloat(v.carat) < 0.5 && parseFloat(v.carat) > 0)) {
      issues.push({
        type: 'wrong_start_carat',
        severity: 'critical',
        message: `WRONG START CARAT: Variant carat below 0.50ct found on a bracelet product. Bracelets start at 1ct.`,
      });
    }
  }

  if (rule?.supports_custom_carat && variants.length > 0) {
    const hasCustom = variants.some(v =>
      v.carat?.toLowerCase().includes('custom') || parseFloat(v.carat) > 5
    );
    if (!hasCustom && isBraceletCategory(cat)) {
      issues.push({
        type: 'custom_carat_needed',
        severity: 'warning',
        message: `Bracelet product should have a "Custom 6ct+" option for orders above 5ct. Currently missing.`,
      });
    }
  }

  if (!product.sku) {
    issues.push({
      type: 'no_sku',
      severity: 'warning',
      message: 'Product has no SKU. SKU is required before variant pricing can be generated.',
    });
  }

  if (variants.length > 0) {
    const variantsWithoutSku = variants.filter(v => !v.sku);
    if (variantsWithoutSku.length > 0) {
      issues.push({
        type: 'no_sku',
        severity: 'warning',
        message: `${variantsWithoutSku.length} of ${variants.length} variant(s) are missing SKUs.`,
      });
    }
  }

  if (product.price === 0 || product.price === null) {
    issues.push({
      type: 'price_anomaly',
      severity: 'warning',
      message: 'Product base price is 0. Pricing data required before variant pricing can be generated.',
    });
  }

  if (variants.length > 1) {
    const prices = variants.map(v => v.price).filter(p => p > 0);
    if (prices.length > 1) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (max > min * 10) {
        issues.push({
          type: 'price_anomaly',
          severity: 'warning',
          message: `Unusual price spread across variants: min £${min.toLocaleString()} vs max £${max.toLocaleString()}. Review variant pricing consistency.`,
        });
      }
    }
    const zeroPriceVariants = variants.filter(v => v.price === 0).length;
    if (zeroPriceVariants > 0) {
      issues.push({
        type: 'price_anomaly',
        severity: 'warning',
        message: `${zeroPriceVariants} variant(s) have price = 0. Pricing data required.`,
      });
    }
  }

  if (issues.length === 0 && variants.length === 0) {
    issues.push({
      type: 'data_required',
      severity: 'critical',
      message: 'DATA REQUIRED — ADMIN REVIEW. Cannot determine variant structure from existing data.',
    });
  }

  return issues;
}

function getAuditStatus(issues: AuditIssue[]): ProductAudit['status'] {
  if (issues.some(i => i.type === 'data_required')) return 'data_required';
  if (issues.some(i => i.severity === 'critical')) return 'critical';
  if (issues.some(i => i.severity === 'warning')) return 'warning';
  return 'ok';
}

function buildRecommendedStructure(audit: ProductAudit): string {
  const isBracelet = isBraceletCategory(audit.product.category || '');
  if (isBracelet) return '1ct / 2ct / 3ct / 4ct / 5ct + Custom 6ct+';
  if (audit.categoryRule) {
    const steps = audit.categoryRule.valid_carat_steps.join('ct / ') + 'ct';
    return audit.categoryRule.supports_custom_carat
      ? `${steps} + ${audit.categoryRule.custom_carat_label}`
      : steps;
  }
  if (audit.variants.length > 0) return 'Based on existing DB variants';
  return 'DATA REQUIRED — ADMIN REVIEW';
}

// ── Approval status config ────────────────────────────────────────────────────
const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string; border: string; btnColor: string }> = {
  pending_review: {
    label: 'Pending Review',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    btnColor: 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
    btnColor: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
  needs_review: {
    label: 'Needs Review',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    btnColor: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  excluded: {
    label: 'Excluded',
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-300',
    btnColor: 'bg-red-500 text-white hover:bg-red-600',
  },
};

// ── CSV export helpers ────────────────────────────────────────────────────────
function escapeCsvField(val: string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsvRow(fields: (string | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(',');
}

function downloadCsv(filename: string, rows: string[]): void {
  const content = rows.join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Full Report Row ────────────────────────────────────────────────────────────
function FullReportRow({
  audit,
  index,
  approval,
  onApprove,
  selected,
  onToggleSelect,
  saving,
}: {
  audit: ProductAudit;
  index: number;
  approval: ApprovalRecord | null;
  onApprove: (productId: string, status: ApprovalStatus) => Promise<void>;
  selected: boolean;
  onToggleSelect: (productId: string) => void;
  saving: boolean;
}) {
  const isBracelet = isBraceletCategory(audit.product.category || '');
  const wrongStart = hasWrongStartCarat(audit.product, audit.variants);
  const hasPriceAnomaly = audit.issues.some(i => i.type === 'price_anomaly');
  const hasDataRequired = audit.status === 'data_required' || audit.issues.some(i => i.type === 'data_required');
  const hasMissingData = !audit.product.sku || audit.product.price === 0 || (!audit.product.carat_range && audit.product.diamond_type?.length > 0);

  const recommendedStructure = buildRecommendedStructure(audit);

  const missingItems: string[] = [];
  if (!audit.product.sku) missingItems.push('Product SKU');
  if (audit.product.price === 0) missingItems.push('Base price');
  if (!audit.product.carat_range) missingItems.push('Carat range');
  if (!audit.product.metal_options?.length) missingItems.push('Metal options');
  if (!audit.product.diamond_type?.length) missingItems.push('Stone/diamond type');
  if (audit.variants.length === 0) missingItems.push('DB variant records');
  const variantsWithoutSku = audit.variants.filter(v => !v.sku);
  if (variantsWithoutSku.length > 0) missingItems.push(`${variantsWithoutSku.length} variant SKU(s)`);

  const currentStatus: ApprovalStatus = approval?.approval_status || 'pending_review';
  const statusCfg = APPROVAL_STATUS_CONFIG[currentStatus];

  const statusColors: Record<string, string> = {
    ok: 'border-l-emerald-500',
    warning: 'border-l-amber-500',
    critical: 'border-l-red-500',
    data_required: 'border-l-purple-500',
  };

  const statusBg: Record<string, string> = {
    ok: 'bg-emerald-50',
    warning: 'bg-amber-50',
    critical: 'bg-red-50',
    data_required: 'bg-purple-50',
  };

  return (
    <div className={`border border-[#e5e0d8] border-l-4 ${statusColors[audit.status]} rounded-lg overflow-hidden`}>
      {/* Product Header */}
      <div className={`px-4 py-3 ${statusBg[audit.status]} border-b border-[#e5e0d8]`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            {/* Checkbox for bulk selection */}
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(audit.product.id)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-[#C9A96E] cursor-pointer flex-shrink-0"
            />
            <span className="text-[10px] font-mono text-[#aaa] mt-0.5 min-w-[24px]">#{index + 1}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[#1a1a1a] text-sm">{audit.product.name}</h3>
                {isBracelet && (
                  <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-semibold">BRACELET</span>
                )}
                {wrongStart && (
                  <span className="text-[9px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-semibold">WRONG START CARAT</span>
                )}
                {!audit.product.sku && (
                  <span className="text-[9px] bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded font-semibold">MISSING SKU</span>
                )}
                {hasPriceAnomaly && (
                  <span className="text-[9px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded font-semibold">PRICE ANOMALY</span>
                )}
                {hasDataRequired && (
                  <span className="text-[9px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-semibold">DATA REQUIRED</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-[10px] text-[#888]">
                  <span className="font-medium text-[#555]">ID:</span>{' '}
                  <span className="font-mono">{audit.product.id}</span>
                </span>
                <span className="text-[10px] text-[#888]">
                  <span className="font-medium text-[#555]">Master SKU:</span>{' '}
                  <span className={`font-mono ${audit.product.sku ? 'text-[#333]' : 'text-orange-600 font-semibold'}`}>
                    {audit.product.sku || '— MISSING —'}
                  </span>
                </span>
                <span className="text-[10px] text-[#888]">
                  <span className="font-medium text-[#555]">Category:</span> {audit.product.category || '—'}
                </span>
                <span className="text-[10px] text-[#888]">
                  <span className="font-medium text-[#555]">Base Price:</span>{' '}
                  <span className={audit.product.price === 0 ? 'text-amber-600 font-semibold' : 'text-[#333]'}>
                    {audit.product.price === 0 ? '£0 ⚠' : `£${audit.product.price.toLocaleString()}`}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${audit.variants.length > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {audit.variants.length} DB variant{audit.variants.length !== 1 ? 's' : ''}
            </span>
            {(() => {
              const map: Record<string, string> = {
                ok: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
                warning: 'bg-amber-100 text-amber-800 border border-amber-300',
                critical: 'bg-red-100 text-red-800 border border-red-300',
                data_required: 'bg-purple-100 text-purple-800 border border-purple-300',
              };
              const label: Record<string, string> = {
                ok: '✓ OK',
                warning: '⚠ Warning',
                critical: '✕ Critical',
                data_required: '? Data Required',
              };
              return (
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${map[audit.status]}`}>
                  {label[audit.status]}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Product Details Grid */}
      <div className="px-4 py-3 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

          {/* Metal Options */}
          <div>
            <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-1.5">Current Metal Options</p>
            {(audit.product.metal_options || []).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {(audit.product.metal_options || []).map((m, i) => (
                  <span key={i} className="text-[10px] bg-[#f5f3ef] text-[#444] px-1.5 py-0.5 rounded border border-[#e5e0d8]">{m}</span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-orange-500 italic font-semibold">None defined ⚠</span>
            )}
          </div>

          {/* Diamond / Stone Types */}
          <div>
            <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-1.5">Current Diamond / Stone Types</p>
            {(audit.product.diamond_type || []).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {(audit.product.diamond_type || []).map((d, i) => (
                  <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">{d}</span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-orange-500 italic font-semibold">None defined ⚠</span>
            )}
          </div>

          {/* Carat Range */}
          <div>
            <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-1.5">Current Carat Range</p>
            {audit.product.carat_range ? (
              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                wrongStart
                  ? 'bg-red-50 text-red-700 border-red-300 font-semibold' : 'bg-[#f5f3ef] text-[#444] border-[#e5e0d8]'
              }`}>
                {audit.product.carat_range}
                {wrongStart && ' ⚠ WRONG START'}
              </span>
            ) : (
              <span className="text-[10px] text-[#aaa] italic">Not specified</span>
            )}
          </div>

          {/* Actual Carat Variants */}
          <div>
            <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-1.5">Current Actual Carat Variants (DB)</p>
            {audit.variants.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {Array.from(new Set(audit.variants.map(v => v.carat).filter(Boolean))).map((c, i) => (
                  <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                    isBracelet && !BRACELET_VALID_CARATS.includes(parseFloat(c!).toFixed(2))
                      ? 'bg-red-50 text-red-700 border-red-300 font-semibold' : 'bg-[#f5f3ef] text-[#444] border-[#e5e0d8]'
                  }`}>
                    {c}ct{isBracelet && !BRACELET_VALID_CARATS.includes(parseFloat(c!).toFixed(2)) && ' ✕'}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-red-500 italic font-semibold">No actual carat variants in DB</span>
            )}
          </div>

          {/* Recommended Variant Structure */}
          <div>
            <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-1.5">Recommended Variant Structure</p>
            <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
              recommendedStructure.includes('DATA REQUIRED')
                ? 'bg-purple-50 text-purple-700 border-purple-300 font-semibold'
                : isBracelet
                  ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {recommendedStructure}
            </span>
          </div>

          {/* Custom Carat + Flags */}
          <div>
            <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-1.5">Custom Carat / Flags</p>
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                audit.supportsCustomCarat
                  ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-[#f5f3ef] text-[#888] border-[#e5e0d8]'
              }`}>
                Custom Carat: {audit.supportsCustomCarat ? 'Yes' : 'No'}
              </span>
              {wrongStart && (
                <span className="text-[10px] bg-red-50 text-red-700 border border-red-300 px-2 py-0.5 rounded font-semibold">
                  Wrong Start Carat
                </span>
              )}
              {hasPriceAnomaly && (
                <span className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded font-semibold">
                  Price Anomaly
                </span>
              )}
              {hasDataRequired && (
                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-300 px-2 py-0.5 rounded font-semibold">
                  Admin Review Required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Missing Data */}
        {missingItems.length > 0 && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded p-3">
            <p className="text-[9px] font-semibold text-orange-700 uppercase tracking-wide mb-1.5">Missing Data</p>
            <div className="flex flex-wrap gap-1">
              {missingItems.map((item, i) => (
                <span key={i} className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-300 font-semibold">
                  ✕ {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bracelet Required Structure */}
        {isBracelet && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded p-3">
            <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Required Bracelet Structure</p>
            <div className="flex flex-wrap gap-1">
              {['1ct', '2ct', '3ct', '4ct', '5ct'].map(c => (
                <span key={c} className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300 font-mono font-semibold">{c}</span>
              ))}
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-mono font-semibold">Custom 6ct+</span>
            </div>
            <p className="text-[9px] text-amber-600 mt-1.5">
              Must NOT start at 0.30ct / 0.50ct / 0.70ct. Do NOT auto-generate from carat range text.
            </p>
          </div>
        )}

        {/* Actual DB Variants */}
        {audit.variants.length > 0 ? (
          <div className="mb-4">
            <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-2">
              Actual DB Variant Records ({audit.variants.length})
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-[#e5e0d8] rounded">
                <thead>
                  <tr className="bg-[#f5f3ef] border-b border-[#e5e0d8]">
                    <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase font-semibold">Variant ID</th>
                    <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase font-semibold">Variant SKU</th>
                    <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase font-semibold">Metal</th>
                    <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase font-semibold">Stone Type</th>
                    <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase font-semibold">Carat</th>
                    <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase font-semibold">Price</th>
                    <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase font-semibold">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.variants.map(v => (
                    <tr key={v.id} className="border-b border-[#f0ece4] hover:bg-[#faf9f7]">
                      <td className="px-2 py-1.5 font-mono text-[9px] text-[#888]">{v.id}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px]">
                        {v.sku ? (
                          <span className="text-[#333]">{v.sku}</span>
                        ) : (
                          <span className="text-orange-500 font-semibold">— MISSING —</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-[10px]">{v.metal || <span className="text-[#aaa]">—</span>}</td>
                      <td className="px-2 py-1.5 text-[10px]">{v.diamond_type || <span className="text-[#aaa]">—</span>}</td>
                      <td className="px-2 py-1.5 text-[10px] font-mono">
                        {v.carat ? (
                          <span className={
                            isBracelet && !BRACELET_VALID_CARATS.includes(parseFloat(v.carat).toFixed(2))
                              ? 'text-red-600 font-semibold' : 'text-[#333]'
                          }>
                            {v.carat}ct
                            {isBracelet && !BRACELET_VALID_CARATS.includes(parseFloat(v.carat).toFixed(2)) && ' ✕'}
                          </span>
                        ) : <span className="text-[#aaa]">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-[10px]">
                        {v.price > 0 ? (
                          <span className="text-[#333]">£{v.price.toLocaleString()}</span>
                        ) : (
                          <span className="text-amber-500 font-semibold">£0 ⚠</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        {v.is_enabled
                          ? <span className="text-emerald-600 text-[10px] font-semibold">✓ Yes</span>
                          : <span className="text-red-400 text-[10px]">✕ No</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
            <p className="text-xs font-semibold text-red-700 mb-1">✕ ZERO actual variant records in database</p>
            <p className="text-[10px] text-red-600">
              {(audit.product.metal_options?.length > 0 || audit.product.diamond_type?.length > 0)
                ? `Options exist in text fields (${audit.product.metal_options?.length || 0} metals, ${audit.product.diamond_type?.length || 0} stone types) but NO actual product_variants rows exist. Variants must be created by Admin — do NOT auto-generate from option text.`
                : 'No option text and no variant records. Complete product data required before variant structure can be defined.'}
            </p>
          </div>
        )}

        {/* Audit Issues */}
        {audit.issues.length > 0 && (
          <div className="space-y-1.5 mb-4">
            <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide">Audit Findings</p>
            {audit.issues.map((issue, i) => (
              <div key={i} className={`flex gap-2 items-start rounded px-2 py-1.5 ${
                issue.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                issue.severity === 'warning' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
              }`}>
                <span className={`text-xs font-bold mt-0.5 flex-shrink-0 ${
                  issue.severity === 'critical' ? 'text-red-600' :
                  issue.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  {issue.severity === 'critical' ? '✕' : issue.severity === 'warning' ? '⚠' : 'ℹ'}
                </span>
                <p className={`text-[10px] leading-relaxed ${
                  issue.severity === 'critical' ? 'text-red-700' :
                  issue.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'
                }`}>{issue.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Category Rule */}
        {audit.categoryRule && (
          <div className="mb-4 pt-3 border-t border-[#f0ece4]">
            <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-1.5">Category Rule: {audit.categoryRule.category_name}</p>
            <div className="flex flex-wrap gap-3 text-[10px] text-[#555]">
              <span>
                <span className="text-[#888]">Valid Carats:</span>{' '}
                {audit.categoryRule.valid_carat_steps.join(', ')}
                {audit.categoryRule.supports_custom_carat && ` + ${audit.categoryRule.custom_carat_label}`}
              </span>
              <span>
                <span className="text-[#888]">Metals:</span>{' '}
                {audit.categoryRule.valid_metals.join(', ')}
              </span>
              <span>
                <span className="text-[#888]">Stone Types:</span>{' '}
                {audit.categoryRule.valid_stone_types.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* ── APPROVAL SECTION ── */}
        <div className="mt-4 pt-4 border-t-2 border-[#e5e0d8]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide">Approval Status</p>
              <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
              {approval?.approved_at && (
                <span className="text-[9px] text-[#aaa]">
                  {new Date(approval.approved_at).toLocaleDateString()}
                  {approval.approved_by && ` by ${approval.approved_by}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onApprove(audit.product.id, 'approved')}
                disabled={saving || currentStatus === 'approved'}
                className={`px-3 py-1.5 text-[10px] font-semibold rounded transition-colors disabled:opacity-50 ${
                  currentStatus === 'approved' ?'bg-emerald-600 text-white cursor-default' :'bg-white border border-emerald-400 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {currentStatus === 'approved' ? '✓ Approved' : '✓ Approve Structure'}
              </button>
              <button
                onClick={() => onApprove(audit.product.id, 'needs_review')}
                disabled={saving || currentStatus === 'needs_review'}
                className={`px-3 py-1.5 text-[10px] font-semibold rounded transition-colors disabled:opacity-50 ${
                  currentStatus === 'needs_review' ?'bg-amber-500 text-white cursor-default' :'bg-white border border-amber-400 text-amber-700 hover:bg-amber-50'
                }`}
              >
                ⚠ Needs Review
              </button>
              <button
                onClick={() => onApprove(audit.product.id, 'excluded')}
                disabled={saving || currentStatus === 'excluded'}
                className={`px-3 py-1.5 text-[10px] font-semibold rounded transition-colors disabled:opacity-50 ${
                  currentStatus === 'excluded' ?'bg-red-500 text-white cursor-default' :'bg-white border border-red-300 text-red-600 hover:bg-red-50'
                }`}
              >
                ✕ Excluded
              </button>
              {currentStatus !== 'pending_review' && (
                <button
                  onClick={() => onApprove(audit.product.id, 'pending_review')}
                  disabled={saving}
                  className="px-3 py-1.5 text-[10px] font-semibold rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  ↺ Reset
                </button>
              )}
            </div>
          </div>
          <p className="text-[9px] text-[#aaa] mt-2 italic">
            Approval only — no variants, products, prices, or publishing are changed. Approved structures will be used in a future phase to create actual variants.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VariantStructurePage() {
  const [audits, setAudits] = useState<ProductAudit[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'ok' | 'data_required' | 'bracelet' | 'options_only' | 'missing_sku' | 'price_anomaly' | 'wrong_start_carat' | 'approved' | 'needs_review' | 'excluded' | 'pending_review'>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [activeTab, setActiveTab] = useState<'audit' | 'full_report' | 'bracelets' | 'rules' | 'create_variants' | 'assign_skus'>('audit');
  const reportRef = useRef<HTMLDivElement>(null);

  // ── Approval state ──────────────────────────────────────────────────────────
  const [approvals, setApprovals] = useState<Record<string, ApprovalRecord>>({});
  const [savingApproval, setSavingApproval] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  // ── Variant Creation state ──────────────────────────────────────────────────
  const [creationPreview, setCreationPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<CreationResult | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [expandedReportProduct, setExpandedReportProduct] = useState<string | null>(null);

  // ── SKU Assignment state ────────────────────────────────────────────────────
  const [skuPreview, setSkuPreview] = useState<any | null>(null);
  const [skuPreviewLoading, setSkuPreviewLoading] = useState(false);
  const [skuPreviewError, setSkuPreviewError] = useState<string | null>(null);
  const [skuConfirmVisible, setSkuConfirmVisible] = useState(false);
  const [skuAssigning, setSkuAssigning] = useState(false);
  const [skuResult, setSkuResult] = useState<any | null>(null);
  const [skuError, setSkuError] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const { data: rulesData } = await supabase
        .from('category_variant_rules')
        .select('*')
        .order('category_name');
      const rules: CategoryRule[] = rulesData || [];
      setCategoryRules(rules);

      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('id, name, sku, category, metal_options, diamond_type, carat_range, price, is_active')
        .order('category', { ascending: true })
        .order('name', { ascending: true })
        .limit(500);
      if (pErr) throw pErr;

      // Fetch product_variants in paginated batches to avoid Supabase's 1000-row default limit
      const allVariants: VariantRow[] = [];
      const PAGE_SIZE = 1000;
      let page = 0;
      let keepFetching = true;
      while (keepFetching) {
        const { data: variantPage, error: vErr } = await supabase
          .from('product_variants')
          .select('id, product_id, diamond_type, carat, metal, price, sku, is_enabled')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (vErr) {
          // If table doesn't exist or RLS blocks, treat as empty — don't hang
          console.warn('product_variants fetch error (treated as empty):', vErr.message);
          break;
        }
        if (!variantPage || variantPage.length === 0) {
          keepFetching = false;
        } else {
          allVariants.push(...variantPage);
          if (variantPage.length < PAGE_SIZE) {
            keepFetching = false;
          } else {
            page++;
          }
        }
      }

      // Load existing approvals
      const { data: approvalsData } = await supabase
        .from('variant_approvals')
        .select('*')
        .limit(500);
      const approvalsMap: Record<string, ApprovalRecord> = {};
      (approvalsData || []).forEach((a: ApprovalRecord) => {
        approvalsMap[a.product_id] = a;
      });
      setApprovals(approvalsMap);

      const variantMap: Record<string, VariantRow[]> = {};
      allVariants.forEach(v => {
        if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
        variantMap[v.product_id].push(v);
      });

      const auditResults: ProductAudit[] = (products || []).map(product => {
        const productVariants = variantMap[product.id] || [];
        const cat = product.category?.toLowerCase() || '';
        const rule = rules.find(r => r.category_name.toLowerCase() === cat) || null;
        const issues = detectIssues(product, productVariants, rule);
        const status = getAuditStatus(issues);
        const recommendedCaratSteps = rule?.valid_carat_steps || [];
        const supportsCustomCarat = rule?.supports_custom_carat || isBraceletCategory(cat);
        return { product, variants: productVariants, issues, status, recommendedCaratSteps, supportsCustomCarat, categoryRule: rule };
      });

      const s: AuditSummary = {
        total: auditResults.length,
        withRealVariants: auditResults.filter(a => a.variants.length > 0).length,
        optionsOnly: auditResults.filter(a => a.variants.length === 0 && (a.product.metal_options?.length > 0 || a.product.diamond_type?.length > 0)).length,
        missingVariants: auditResults.filter(a => a.variants.length === 0).length,
        braceletProducts: auditResults.filter(a => isBraceletCategory(a.product.category || '')).length,
        customCaratProducts: auditResults.filter(a => a.supportsCustomCarat).length,
        pricingAnomalies: auditResults.filter(a => a.issues.some(i => i.type === 'price_anomaly')).length,
        dataRequired: auditResults.filter(a => a.status === 'data_required' || a.status === 'critical').length,
        missingSkus: auditResults.filter(a => !a.product.sku).length,
        wrongStartCarat: auditResults.filter(a => hasWrongStartCarat(a.product, a.variants)).length,
      };

      setAudits(auditResults);
      setSummary(s);
    } catch (e: any) {
      setError(e.message || 'Failed to run audit');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { runAudit(); }, [runAudit]);

  // ── Save approval ──────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (productId: string, status: ApprovalStatus) => {
    setSavingApproval(productId);
    try {
      const supabase = createClient();
      const audit = audits.find(a => a.product.id === productId);
      if (!audit) return;

      const rec: Partial<ApprovalRecord> = {
        product_id: productId,
        approval_status: status,
        recommended_structure: buildRecommendedStructure(audit),
        metal_options: audit.product.metal_options || [],
        stone_types: audit.product.diamond_type || [],
        carat_options: audit.categoryRule?.valid_carat_steps || [],
        quality_options: [],
        custom_carat: audit.supportsCustomCarat,
        approved_by: status === 'approved' ? 'Admin' : null,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
      };

      const { data, error: upsertErr } = await supabase
        .from('variant_approvals')
        .upsert(rec, { onConflict: 'product_id' })
        .select()
        .single();

      if (upsertErr) throw upsertErr;

      setApprovals(prev => ({ ...prev, [productId]: data as ApprovalRecord }));
    } catch (e: any) {
      alert(`Failed to save approval: ${e.message}`);
    } finally {
      setSavingApproval(null);
    }
  }, [audits]);

  // ── Bulk approval ──────────────────────────────────────────────────────────
  const handleBulkApprove = useCallback(async (status: ApprovalStatus) => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    setBulkMessage(null);
    try {
      const supabase = createClient();
      const records = Array.from(selectedIds).map(productId => {
        const audit = audits.find(a => a.product.id === productId);
        return {
          product_id: productId,
          approval_status: status,
          recommended_structure: audit ? buildRecommendedStructure(audit) : null,
          metal_options: audit?.product.metal_options || [],
          stone_types: audit?.product.diamond_type || [],
          carat_options: audit?.categoryRule?.valid_carat_steps || [],
          quality_options: [] as string[],
          custom_carat: audit?.supportsCustomCarat || false,
          approved_by: status === 'approved' ? 'Admin' : null,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
        };
      });

      const { data, error: upsertErr } = await supabase
        .from('variant_approvals')
        .upsert(records, { onConflict: 'product_id' })
        .select();

      if (upsertErr) throw upsertErr;

      const newApprovals = { ...approvals };
      (data || []).forEach((a: ApprovalRecord) => {
        newApprovals[a.product_id] = a;
      });
      setApprovals(newApprovals);
      setSelectedIds(new Set());
      setBulkMessage(`${records.length} product(s) marked as "${APPROVAL_STATUS_CONFIG[status].label}".`);
    } catch (e: any) {
      setBulkMessage(`Error: ${e.message}`);
    } finally {
      setBulkSaving(false);
    }
  }, [selectedIds, audits, approvals]);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = useCallback((productId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback((filteredAudits: ProductAudit[]) => {
    setSelectedIds(new Set(filteredAudits.map(a => a.product.id)));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── Variant Creation handlers ──────────────────────────────────────────────
  const loadCreationPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setCreationPreview(null);
    setShowConfirm(false);
    setCreationResult(null);
    try {
      const res = await fetch('/api/admin/create-approved-variants');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load preview');
      setCreationPreview(data);
    } catch (e: any) {
      setPreviewError(e.message);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const executeCreation = useCallback(async () => {
    setCreating(true);
    setCreationError(null);
    setShowConfirm(false);
    try {
      const res = await fetch('/api/admin/create-approved-variants', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create variants');
      setCreationResult(data);
      setCreationPreview(null);
      // Refresh audit data to reflect new variants
      await runAudit();
    } catch (e: any) {
      setCreationError(e.message);
    } finally {
      setCreating(false);
    }
  }, [runAudit]);

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportApprovedCsv = useCallback(() => {
    const approvedAudits = audits.filter(a => approvals[a.product.id]?.approval_status === 'approved');
    if (approvedAudits.length === 0) {
      alert('No approved products to export.');
      return;
    }
    const header = buildCsvRow([
      'Product ID', 'Master SKU', 'Product Name', 'Category',
      'Recommended Variant Structure', 'Metal Options', 'Stone Type',
      'Carat Options', 'Quality Options', 'Custom Carat', 'Approval Status',
    ]);
    const rows = approvedAudits.map(a => {
      const app = approvals[a.product.id];
      return buildCsvRow([
        a.product.id,
        a.product.sku,
        a.product.name,
        a.product.category,
        app?.recommended_structure || buildRecommendedStructure(a),
        (a.product.metal_options || []).join('; '),
        (a.product.diamond_type || []).join('; '),
        (app?.carat_options || a.categoryRule?.valid_carat_steps || []).join('; '),
        (app?.quality_options || []).join('; '),
        a.supportsCustomCarat ? 'Yes' : 'No',
        'Approved',
      ]);
    });
    downloadCsv('detara_approved_variant_structures.csv', [header, ...rows]);
  }, [audits, approvals]);

  const exportApprovedBraceletsCsv = useCallback(() => {
    const approvedBracelets = audits.filter(a =>
      isBraceletCategory(a.product.category || '') &&
      approvals[a.product.id]?.approval_status === 'approved'
    );
    if (approvedBracelets.length === 0) {
      alert('No approved bracelet products to export.');
      return;
    }
    const header = buildCsvRow([
      'Product ID', 'Master SKU', 'Product Name', 'Category',
      'Recommended Variant Structure', 'Metal Options', 'Stone Type',
      'Carat Options', 'Quality Options', 'Custom Carat', 'Approval Status',
    ]);
    const rows = approvedBracelets.map(a => {
      const app = approvals[a.product.id];
      // Bracelet structure is always 1ct/2ct/3ct/4ct/5ct + Custom 6ct+
      const braceletStructure = '1ct / 2ct / 3ct / 4ct / 5ct + Custom 6ct+';
      const braceletCaratOptions = '1.00; 2.00; 3.00; 4.00; 5.00';
      return buildCsvRow([
        a.product.id,
        a.product.sku,
        a.product.name,
        a.product.category,
        braceletStructure,
        (a.product.metal_options || []).join('; '),
        (a.product.diamond_type || []).join('; '),
        braceletCaratOptions,
        '',
        'Yes',
        'Approved',
      ]);
    });
    downloadCsv('detara_approved_bracelets.csv', [header, ...rows]);
  }, [audits, approvals]);

  // ── SKU Assignment handlers ────────────────────────────────────────────────
  const loadSkuPreview = useCallback(async () => {
    setSkuPreviewLoading(true);
    setSkuPreviewError(null);
    setSkuPreview(null);
    setSkuConfirmVisible(false);
    setSkuResult(null);
    try {
      const res = await fetch('/api/admin/assign-master-skus');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load SKU preview');
      setSkuPreview(data);
    } catch (e: any) {
      setSkuPreviewError(e.message);
    } finally {
      setSkuPreviewLoading(false);
    }
  }, []);

  const executeSkuAssignment = useCallback(async () => {
    setSkuAssigning(true);
    setSkuError(null);
    setSkuConfirmVisible(false);
    try {
      const res = await fetch('/api/admin/assign-master-skus', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign SKUs');
      setSkuResult(data);
      setSkuPreview(null);
      // Refresh audit to reflect new SKUs
      await runAudit();
    } catch (e: any) {
      setSkuError(e.message);
    } finally {
      setSkuAssigning(false);
    }
  }, [runAudit]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = audits.filter(a => {
    const matchSearch = !search ||
      a.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.product.sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.product.category || '').toLowerCase().includes(search.toLowerCase()) ||
      a.product.id.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'critical') return a.status === 'critical';
    if (filter === 'warning') return a.status === 'warning';
    if (filter === 'ok') return a.status === 'ok';
    if (filter === 'data_required') return a.status === 'data_required';
    if (filter === 'bracelet') return isBraceletCategory(a.product.category || '');
    if (filter === 'options_only') return a.variants.length === 0 && (a.product.metal_options?.length > 0 || a.product.diamond_type?.length > 0);
    if (filter === 'missing_sku') return !a.product.sku;
    if (filter === 'price_anomaly') return a.issues.some(i => i.type === 'price_anomaly');
    if (filter === 'wrong_start_carat') return hasWrongStartCarat(a.product, a.variants);
    if (filter === 'approved') return approvals[a.product.id]?.approval_status === 'approved';
    if (filter === 'needs_review') return approvals[a.product.id]?.approval_status === 'needs_review';
    if (filter === 'excluded') return approvals[a.product.id]?.approval_status === 'excluded';
    if (filter === 'pending_review') return !approvals[a.product.id] || approvals[a.product.id]?.approval_status === 'pending_review';
    return true;
  });

  const braceletAudits = audits.filter(a => isBraceletCategory(a.product.category || ''));

  // Approval counts
  const approvalCounts = {
    approved: audits.filter(a => approvals[a.product.id]?.approval_status === 'approved').length,
    needs_review: audits.filter(a => approvals[a.product.id]?.approval_status === 'needs_review').length,
    excluded: audits.filter(a => approvals[a.product.id]?.approval_status === 'excluded').length,
    pending_review: audits.filter(a => !approvals[a.product.id] || approvals[a.product.id]?.approval_status === 'pending_review').length,
  };

  // ── Status badge ───────────────────────────────────────────────────────────
  const statusBadge = (status: ProductAudit['status']) => {
    const map: Record<string, string> = {
      ok: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
      warning: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
      critical: 'bg-red-900/40 text-red-300 border border-red-700/40',
      data_required: 'bg-purple-900/40 text-purple-300 border border-purple-700/40',
    };
    const label: Record<string, string> = {
      ok: '✓ OK',
      warning: '⚠ Warning',
      critical: '✕ Critical',
      data_required: '? Data Required',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${map[status]}`}>
        {label[status]}
      </span>
    );
  };

  const severityColor = (s: AuditIssue['severity']) => {
    if (s === 'critical') return 'text-red-400';
    if (s === 'warning') return 'text-amber-400';
    return 'text-blue-400';
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout breadcrumbs={[
      { label: 'Admin', href: '/admin' },
      { label: 'Products', href: '/admin/products' },
      { label: 'Variant Structure Audit' },
    ]}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-[#1a1a1a] tracking-wide">Variant Structure Audit &amp; Approval</h1>
            <p className="text-sm text-[#666] mt-1">
              Inspect actual database variants vs product option text. Approve structures for future variant creation.
            </p>
          </div>
          <button
            onClick={runAudit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F0E0D] text-white text-sm rounded hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : '↻'}
            {loading ? 'Running Audit…' : 'Re-run Audit'}
          </button>
        </div>

        {/* Safety notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">⚠ Approval Only — No Database Changes</p>
          <p className="text-sm text-amber-700">
            <strong>Approval only — no variants, products, prices, or publishing are changed.</strong> This page records your approval decisions only. Approved structures will be used in a future phase to create actual variants. No <code>product_variants</code> rows are created, modified, or deleted here.
          </p>
        </div>

        {/* Approval summary cards */}
        {!loading && audits.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pending Review', value: approvalCounts.pending_review, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
              { label: 'Approved', value: approvalCounts.approved, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
              { label: 'Needs Review', value: approvalCounts.needs_review, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
              { label: 'Excluded', value: approvalCounts.excluded, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
            ].map(card => (
              <div key={card.label} className={`${card.bg} border ${card.border} rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-light ${card.color}`}>{card.value}</p>
                <p className="text-[9px] text-[#888] mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#e5e0d8] overflow-x-auto">
          {([
            ['audit', 'Summary View'],
            ['full_report', `Full Report (${audits.length})`],
            ['bracelets', `Bracelets (${braceletAudits.length})`],
            ['rules', 'Category Rules'],
            ['create_variants', `Create Approved Variants${approvalCounts.approved > 0 ? ` (${approvalCounts.approved} approved)` : ''}`],
            ['assign_skus', `Assign Master SKUs${summary?.missingSkus ? ` (${summary.missingSkus} missing)` : ''}`],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-[#C9A96E] text-[#1a1a1a] font-medium'
                  : tab === 'create_variants' || tab === 'assign_skus' ?'text-emerald-700 hover:text-emerald-900 font-medium' :'text-[#888] hover:text-[#444]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── CREATE APPROVED VARIANTS TAB ── */}
        {activeTab === 'create_variants' && (
          <div className="space-y-5">

            {/* Safety banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">◆ Create Actual Product Variants — Approved Products Only</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                This phase creates actual <code>product_variants</code> database records for products with <strong>Approval Status = Approved</strong> only.
                Products with Pending Review, Needs Review, or Excluded status are <strong>not processed</strong>.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-blue-700">
                <div className="flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold mt-0.5">✓</span>
                  <span>Creates <code>product_variants</code> rows for approved products</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold mt-0.5">✓</span>
                  <span>Uses existing category rules and approved structures</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold mt-0.5">✓</span>
                  <span>Idempotent — safe to run multiple times, no duplicates</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span>Does NOT change product prices</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span>Does NOT publish products or variants</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span>Does NOT process Pending / Needs Review / Excluded</span>
                </div>
              </div>
            </div>

            {/* Bracelet rule reminder */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">◆ Bracelet Rule (enforced)</p>
              <p className="text-xs text-amber-700">
                All Bracelet and Tennis Bracelet products will use exactly: <strong>1ct / 2ct / 3ct / 4ct / 5ct + Custom 6ct+</strong>.
                0.30ct / 0.50ct / 0.70ct will NEVER be created as bracelet variants.
              </p>
            </div>

            {/* SKU prerequisite notice */}
            {summary && summary.missingSkus > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
                <span className="text-orange-600 font-bold text-sm mt-0.5 flex-shrink-0">⚠</span>
                <div>
                  <p className="text-xs font-semibold text-orange-800 mb-1">
                    {summary.missingSkus} product(s) are missing a Master SKU — they will be skipped during variant creation
                  </p>
                  <p className="text-xs text-orange-700">
                    Products without a SKU cannot have variant SKUs generated. Use the{' '}
                    <button
                      onClick={() => setActiveTab('assign_skus')}
                      className="underline font-semibold hover:text-orange-900"
                    >
                      Assign Master SKUs tab
                    </button>{' '}
                    to fix this before running variant creation.
                  </p>
                </div>
              </div>
            )}

            {/* Current approval status */}
            {!loading && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Approved (will process)', value: approvalCounts.approved, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                  { label: 'Pending Review (skipped)', value: approvalCounts.pending_review, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
                  { label: 'Needs Review (skipped)', value: approvalCounts.needs_review, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
                  { label: 'Excluded (skipped)', value: approvalCounts.excluded, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
                ].map(card => (
                  <div key={card.label} className={`${card.bg} border ${card.border} rounded-lg p-3 text-center`}>
                    <p className={`text-2xl font-light ${card.color}`}>{card.value}</p>
                    <p className="text-[9px] text-[#888] mt-1 leading-tight">{card.label}</p>
                  </div>
                ))}
              </div>
            )}

            {approvalCounts.approved === 0 && !loading && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-amber-800 mb-1">No Approved Products</p>
                <p className="text-xs text-amber-700">
                  No products have Approval Status = Approved yet. Go to the Full Report tab to approve product variant structures first.
                </p>
              </div>
            )}

            {/* Preview section */}
            {approvalCounts.approved > 0 && !creationResult && (
              <div className="bg-white border border-[#e5e0d8] rounded-lg p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1a1a1a]">Step 1 — Preview Variant Creation</h3>
                    <p className="text-xs text-[#888] mt-0.5">
                      Load a preview of exactly what will be created before committing any changes.
                    </p>
                  </div>
                  <button
                    onClick={loadCreationPreview}
                    disabled={previewLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F0E0D] text-white text-sm rounded hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {previewLoading ? (
                      <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : '◎'}
                    {previewLoading ? 'Loading Preview…' : 'Load Preview'}
                  </button>
                </div>

                {previewError && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-4">{previewError}</div>
                )}

                {creationPreview && (
                  <div className="space-y-4">
                    {/* Preview counts */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        { label: 'Approved Products', value: creationPreview.approvedCount, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                        { label: 'Variants to Create', value: creationPreview.variantsToCreate, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                        { label: 'Already Existing', value: creationPreview.alreadyExisting, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
                        { label: 'Skipped', value: creationPreview.skipped, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
                        { label: 'Requiring Data', value: creationPreview.requiresData, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
                        { label: 'Errors', value: creationPreview.errors, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
                      ].map(card => (
                        <div key={card.label} className={`${card.bg} border ${card.border} rounded-lg p-3 text-center`}>
                          <p className={`text-2xl font-light ${card.color}`}>{card.value}</p>
                          <p className="text-[9px] text-[#888] mt-1 leading-tight">{card.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Preview table */}
                    {creationPreview.plans.length > 0 && (
                      <div>
                        <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-2">
                          Preview — {creationPreview.plans.length} variant entries
                        </p>
                        <div className="overflow-x-auto max-h-80 overflow-y-auto border border-[#e5e0d8] rounded">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-[#faf9f7] border-b border-[#e5e0d8]">
                              <tr>
                                <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Product</th>
                                <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Category</th>
                                <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Metal</th>
                                <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Stone</th>
                                <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Carat</th>
                                <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Variant SKU</th>
                                <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {creationPreview.plans.map((plan, i) => (
                                <tr key={i} className={`border-b border-[#f0ece4] ${plan.skipReason ? 'opacity-60' : 'hover:bg-[#faf9f7]'}`}>
                                  <td className="px-3 py-1.5">
                                    <p className="font-medium text-[#1a1a1a] text-[10px] leading-tight">{plan.productName}</p>
                                    <p className="text-[9px] text-[#aaa] font-mono">{plan.productSku || '— no SKU —'}</p>
                                  </td>
                                  <td className="px-3 py-1.5 text-[10px] text-[#555]">{plan.category || '—'}</td>
                                  <td className="px-3 py-1.5 text-[10px] text-[#555]">{plan.metal || '—'}</td>
                                  <td className="px-3 py-1.5 text-[10px] text-[#555]">{plan.diamondType || '—'}</td>
                                  <td className="px-3 py-1.5 text-[10px] font-mono text-[#555]">{plan.carat || '—'}</td>
                                  <td className="px-3 py-1.5 font-mono text-[10px]">
                                    {plan.variantSku ? (
                                      <span className="text-emerald-700">{plan.variantSku}</span>
                                    ) : (
                                      <span className="text-orange-500">— missing —</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-1.5">
                                    {plan.skipReason ? (
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                        plan.skipReason === 'Already exists in database' ?'bg-gray-100 text-gray-600' :'bg-purple-100 text-purple-700'
                                      }`}>
                                        {plan.skipReason === 'Already exists in database' ? 'Exists' : 'Skip'}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Create</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Confirm button */}
                    {creationPreview.variantsToCreate > 0 && !showConfirm && (
                      <div className="pt-2 border-t border-[#f0ece4]">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs text-[#555]">
                            Ready to create <strong className="text-emerald-700">{creationPreview.variantsToCreate} new variant records</strong> for{' '}
                            <strong>{creationPreview.approvedCount} approved products</strong>.
                            Prices will NOT be set. Products will NOT be published.
                          </p>
                          <button
                            onClick={() => setShowConfirm(true)}
                            className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded hover:bg-emerald-700 transition-colors whitespace-nowrap"
                          >
                            Proceed to Confirm →
                          </button>
                        </div>
                      </div>
                    )}

                    {creationPreview.variantsToCreate === 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600 text-center">
                        All variants for approved products already exist in the database. Nothing new to create.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Confirmation step */}
            {showConfirm && creationPreview && (
              <div className="bg-white border-2 border-emerald-400 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Step 2 — Confirm Variant Creation</h3>
                <div className="bg-emerald-50 border border-emerald-200 rounded p-4 mb-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-2">You are about to create:</p>
                  <ul className="text-xs text-emerald-700 space-y-1">
                    <li>• <strong>{creationPreview.variantsToCreate}</strong> new <code>product_variants</code> records</li>
                    <li>• For <strong>{creationPreview.approvedCount}</strong> approved products</li>
                    <li>• Variant prices will be set to £0 (pricing is a separate phase)</li>
                    <li>• Variants will be created as <strong>disabled</strong> (not published)</li>
                    <li>• Product prices will NOT be changed</li>
                    <li>• Products will NOT be published</li>
                    <li>• Operation is idempotent — running again will not create duplicates</li>
                  </ul>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={executeCreation}
                    disabled={creating}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {creating ? (
                      <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : '✓'}
                    {creating ? 'Creating Variants…' : `Create ${creationPreview.variantsToCreate} Variants`}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={creating}
                    className="px-4 py-2.5 bg-white border border-[#e5e0d8] text-[#555] text-sm rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {creationError && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{creationError}</div>
            )}

            {/* Completion report */}
            {creationResult && (
              <div className="space-y-4">
                <div className={`border-2 rounded-lg p-5 ${creationResult.errors > 0 ? 'border-amber-400 bg-amber-50' : 'border-emerald-400 bg-emerald-50'}`}>
                  <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">
                    {creationResult.errors > 0 ? '⚠ Variant Creation Completed with Errors' : '✓ Variant Creation Completed'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                    {[
                      { label: 'Created', value: creationResult.created, color: 'text-emerald-700', bg: 'bg-white', border: 'border-emerald-200' },
                      { label: 'Already Existed', value: creationResult.alreadyExisting, color: 'text-gray-600', bg: 'bg-white', border: 'border-gray-200' },
                      { label: 'Skipped', value: creationResult.skipped, color: 'text-amber-700', bg: 'bg-white', border: 'border-amber-200' },
                      { label: 'Requiring Data', value: creationResult.requiresData, color: 'text-purple-700', bg: 'bg-white', border: 'border-purple-200' },
                      { label: 'Errors', value: creationResult.errors, color: 'text-red-700', bg: 'bg-white', border: 'border-red-200' },
                    ].map(card => (
                      <div key={card.label} className={`${card.bg} border ${card.border} rounded-lg p-3 text-center`}>
                        <p className={`text-2xl font-light ${card.color}`}>{card.value}</p>
                        <p className="text-[9px] text-[#888] mt-1 leading-tight">{card.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#888]">Run ID: <span className="font-mono">{creationResult.runId}</span></p>
                </div>

                {/* Per-product report */}
                <div>
                  <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3">Completion Report — Product by Product</h4>
                  <div className="space-y-2">
                    {creationResult.report.map((productReport) => (
                      <div key={productReport.productId} className={`border rounded-lg overflow-hidden ${
                        productReport.errors?.length > 0 ? 'border-red-300' :
                        productReport.variantsCreated?.length > 0 ? 'border-emerald-300' :
                        productReport.status === 'skipped_data_required'? 'border-purple-300' : 'border-[#e5e0d8]'
                      }`}>
                        <button
                          className="w-full text-left px-4 py-3 bg-[#faf9f7] hover:bg-[#f5f3ef] transition-colors flex items-center justify-between gap-3"
                          onClick={() => setExpandedReportProduct(
                            expandedReportProduct === productReport.productId ? null : productReport.productId
                          )}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-medium text-[#1a1a1a] text-sm">{productReport.productName}</span>
                            <span className="text-[10px] font-mono text-[#aaa]">{productReport.productSku || '— no SKU —'}</span>
                            {productReport.variantsCreated?.length > 0 && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                                +{productReport.variantsCreated.length} created
                              </span>
                            )}
                            {productReport.variantsExisting?.length > 0 && (
                              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold">
                                {productReport.variantsExisting.length} existed
                              </span>
                            )}
                            {productReport.variantsRequiringData?.length > 0 && (
                              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                {productReport.variantsRequiringData.length} data required
                              </span>
                            )}
                            {productReport.errors?.length > 0 && (
                              <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">
                                {productReport.errors.length} error(s)
                              </span>
                            )}
                            {productReport.status === 'skipped_data_required' && (
                              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                Skipped — {productReport.skipReason}
                              </span>
                            )}
                          </div>
                          <span className="text-[#aaa] text-xs flex-shrink-0">
                            {expandedReportProduct === productReport.productId ? '▲' : '▼'}
                          </span>
                        </button>

                        {expandedReportProduct === productReport.productId && (
                          <div className="px-4 py-3 bg-white space-y-3">
                            <p className="text-[9px] text-[#aaa] font-mono">Product ID: {productReport.productId}</p>

                            {productReport.variantsCreated?.length > 0 && (
                              <div>
                                <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">
                                  ✓ Created Variants ({productReport.variantsCreated.length})
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border border-emerald-200 rounded">
                                    <thead>
                                      <tr className="bg-emerald-50 border-b border-emerald-200">
                                        <th className="text-left px-2 py-1.5 text-[9px] text-emerald-700 uppercase font-semibold">Variant ID</th>
                                        <th className="text-left px-2 py-1.5 text-[9px] text-emerald-700 uppercase font-semibold">Variant SKU</th>
                                        <th className="text-left px-2 py-1.5 text-[9px] text-emerald-700 uppercase font-semibold">Metal</th>
                                        <th className="text-left px-2 py-1.5 text-[9px] text-emerald-700 uppercase font-semibold">Stone Type</th>
                                        <th className="text-left px-2 py-1.5 text-[9px] text-emerald-700 uppercase font-semibold">Carat</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {productReport.variantsCreated.map((v, i) => (
                                        <tr key={i} className="border-b border-emerald-100">
                                          <td className="px-2 py-1.5 font-mono text-[9px] text-[#aaa]">{v.variantId}</td>
                                          <td className="px-2 py-1.5 font-mono text-[10px] text-emerald-700 font-semibold">{v.variantSku}</td>
                                          <td className="px-2 py-1.5 text-[10px]">{v.metal}</td>
                                          <td className="px-2 py-1.5 text-[10px]">{v.stoneType}</td>
                                          <td className="px-2 py-1.5 text-[10px] font-mono">{v.carat}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {productReport.variantsExisting?.length > 0 && (
                              <div>
                                <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                  Already Existed ({productReport.variantsExisting.length})
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {productReport.variantsExisting.map((v, i) => (
                                    <span key={i} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                                      {v.metal} / {v.stoneType} / {v.carat}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {productReport.variantsRequiringData?.length > 0 && (
                              <div>
                                <p className="text-[9px] font-semibold text-purple-700 uppercase tracking-wide mb-1.5">
                                  Requiring Data ({productReport.variantsRequiringData.length})
                                </p>
                                <div className="space-y-1">
                                  {productReport.variantsRequiringData.map((v, i) => (
                                    <div key={i} className="text-[9px] bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                      {v.metal} / {v.stoneType} / {v.carat} — {v.reason}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {productReport.errors?.length > 0 && (
                              <div>
                                <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wide mb-1.5">
                                  Errors ({productReport.errors.length})
                                </p>
                                <div className="space-y-1">
                                  {productReport.errors.map((e, i) => (
                                    <div key={i} className="text-[9px] bg-red-50 text-red-700 px-2 py-1 rounded">
                                      {e.metal} / {e.stoneType} / {e.carat} — {e.error}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Run again button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => { setCreationResult(null); loadCreationPreview(); }}
                    className="px-4 py-2 bg-[#0F0E0D] text-white text-sm rounded hover:bg-[#2a2a2a] transition-colors"
                  >
                    ↻ Refresh Preview
                  </button>
                  <p className="text-xs text-[#888]">
                    The operation is idempotent — running again will skip already-created variants.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FULL REPORT TAB ── */}
        {activeTab === 'full_report' && (
          <div className="space-y-4">
            {/* Full Report Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-semibold text-[#1a1a1a]">Complete Product-by-Product Audit &amp; Approval</h2>
                <p className="text-xs text-[#888] mt-0.5">All {audits.length} products with full variant details, issues, flags, and approval controls.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* CSV Export buttons */}
                <button
                  onClick={exportApprovedCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-semibold"
                >
                  ↓ Export Approved CSV
                </button>
                <button
                  onClick={exportApprovedBraceletsCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors font-semibold"
                >
                  ↓ Export Approved Bracelets CSV
                </button>
                <input
                  type="text"
                  placeholder="Search name, SKU, ID, category…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-[#e5e0d8] rounded bg-white focus:outline-none focus:border-[#C9A96E] w-56"
                />
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value as typeof filter)}
                  className="px-3 py-1.5 text-sm border border-[#e5e0d8] rounded bg-white focus:outline-none focus:border-[#C9A96E]"
                >
                  <option value="all">All Products ({audits.length})</option>
                  <option value="pending_review">⏳ Pending Review ({approvalCounts.pending_review})</option>
                  <option value="approved">✓ Approved ({approvalCounts.approved})</option>
                  <option value="needs_review">⚠ Needs Review ({approvalCounts.needs_review})</option>
                  <option value="excluded">✕ Excluded ({approvalCounts.excluded})</option>
                  <option value="critical">✕ Audit Critical ({audits.filter(a => a.status === 'critical').length})</option>
                  <option value="warning">⚠ Audit Warning ({audits.filter(a => a.status === 'warning').length})</option>
                  <option value="data_required">? Data Required ({audits.filter(a => a.status === 'data_required').length})</option>
                  <option value="ok">✓ Audit OK ({audits.filter(a => a.status === 'ok').length})</option>
                  <option value="options_only">⊘ Options Only, No Variants ({audits.filter(a => a.variants.length === 0 && (a.product.metal_options?.length > 0 || a.product.diamond_type?.length > 0)).length})</option>
                  <option value="missing_sku">Missing SKU ({audits.filter(a => !a.product.sku).length})</option>
                  <option value="price_anomaly">Price Anomaly ({audits.filter(a => a.issues.some(i => i.type === 'price_anomaly')).length})</option>
                  <option value="wrong_start_carat">Wrong Start Carat ({audits.filter(a => hasWrongStartCarat(a.product, a.variants)).length})</option>
                </select>
                <span className="text-xs text-[#888]">{filtered.length} shown</span>
              </div>
            </div>

            {/* Bulk actions bar */}
            {filtered.length > 0 && (
              <div className="bg-[#faf9f7] border border-[#e5e0d8] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && filtered.every(a => selectedIds.has(a.product.id))}
                    onChange={() => {
                      if (filtered.every(a => selectedIds.has(a.product.id))) {
                        clearSelection();
                      } else {
                        selectAllFiltered(filtered);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[#C9A96E] cursor-pointer"
                  />
                  <span className="text-xs text-[#555]">
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all filtered'}
                  </span>
                </div>
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-[#ddd]">|</span>
                    <span className="text-xs font-semibold text-[#555]">Bulk action:</span>
                    <button
                      onClick={() => handleBulkApprove('approved')}
                      disabled={bulkSaving}
                      className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      ✓ Approve Selected
                    </button>
                    <button
                      onClick={() => handleBulkApprove('needs_review')}
                      disabled={bulkSaving}
                      className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors font-semibold disabled:opacity-50"
                    >
                      ⚠ Mark Needs Review
                    </button>
                    <button
                      onClick={() => handleBulkApprove('excluded')}
                      disabled={bulkSaving}
                      className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                    >
                      ✕ Mark Excluded
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1.5 text-xs bg-white border border-[#e5e0d8] text-[#555] rounded hover:bg-gray-50 transition-colors"
                    >
                      Clear
                    </button>
                    {bulkSaving && (
                      <span className="text-xs text-[#888] flex items-center gap-1">
                        <span className="w-3 h-3 border border-[#ccc] border-t-[#C9A96E] rounded-full animate-spin" />
                        Saving…
                      </span>
                    )}
                  </>
                )}
                {bulkMessage && (
                  <span className={`text-xs font-semibold ${bulkMessage.startsWith('Error') ? 'text-red-600' : 'text-emerald-700'}`}>
                    {bulkMessage}
                  </span>
                )}
                <p className="text-[9px] text-[#aaa] ml-auto italic">Bulk approval only — no variants or prices are changed.</p>
              </div>
            )}

            {/* ── FULL REPORT SUMMARY ── */}
            {summary && !loading && (
              <div className="bg-white border border-[#e5e0d8] rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4 pb-2 border-b border-[#f0ece4]">
                  📊 Audit Summary — {summary.total} Products
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                  {[
                    { label: 'Total Products', value: summary.total, color: 'text-[#1a1a1a]', bg: 'bg-[#faf9f7]', border: 'border-[#e5e0d8]' },
                    { label: 'Products with Real Variants', value: summary.withRealVariants, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                    { label: 'Products with Zero Variants', value: summary.missingVariants, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                    { label: 'Options Only (No DB Variants)', value: summary.optionsOnly, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                    { label: 'Missing SKUs', value: summary.missingSkus, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
                    { label: 'Wrong Bracelet Carat Structure', value: summary.wrongStartCarat, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                    { label: 'Require Custom Carat', value: summary.customCaratProducts, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                    { label: 'Require Admin Review', value: summary.dataRequired, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
                    { label: 'Pricing Anomalies', value: summary.pricingAnomalies, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
                    { label: 'Bracelet Products', value: summary.braceletProducts, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
                  ].map(card => (
                    <div key={card.label} className={`${card.bg} border ${card.border} rounded-lg p-3 text-center`}>
                      <p className={`text-2xl font-light ${card.color}`}>{card.value}</p>
                      <p className="text-[9px] text-[#888] mt-1 leading-tight">{card.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide">Key Findings</p>
                  {summary.missingVariants > 0 && (
                    <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded px-3 py-2">
                      <span className="text-red-600 font-bold text-xs mt-0.5 flex-shrink-0">✕</span>
                      <p className="text-[10px] text-red-700">
                        <strong>{summary.missingVariants} products</strong> have zero actual variant records in the database. Option text exists but no <code>product_variants</code> rows. Admin must define the correct structure before any pricing can be generated.
                      </p>
                    </div>
                  )}
                  {summary.wrongStartCarat > 0 && (
                    <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded px-3 py-2">
                      <span className="text-red-600 font-bold text-xs mt-0.5 flex-shrink-0">✕</span>
                      <p className="text-[10px] text-red-700">
                        <strong>{summary.wrongStartCarat} bracelet product(s)</strong> have wrong start carat. Bracelets must use 1ct / 2ct / 3ct / 4ct / 5ct + Custom 6ct+. They must NOT start at 0.30ct.
                      </p>
                    </div>
                  )}
                  {summary.missingSkus > 0 && (
                    <div className="flex gap-2 items-start bg-orange-50 border border-orange-200 rounded px-3 py-2">
                      <span className="text-orange-600 font-bold text-xs mt-0.5 flex-shrink-0">⚠</span>
                      <p className="text-[10px] text-orange-700">
                        <strong>{summary.missingSkus} products</strong> are missing a Master SKU. SKUs are required before variant pricing can be generated.
                      </p>
                    </div>
                  )}
                  {summary.pricingAnomalies > 0 && (
                    <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded px-3 py-2">
                      <span className="text-amber-600 font-bold text-xs mt-0.5 flex-shrink-0">⚠</span>
                      <p className="text-[10px] text-amber-700">
                        <strong>{summary.pricingAnomalies} products</strong> have pricing anomalies (zero price or unusual price spread across variants). Review before generating pricing.
                      </p>
                    </div>
                  )}
                  {summary.dataRequired > 0 && (
                    <div className="flex gap-2 items-start bg-purple-50 border border-purple-200 rounded px-3 py-2">
                      <span className="text-purple-600 font-bold text-xs mt-0.5 flex-shrink-0">?</span>
                      <p className="text-[10px] text-purple-700">
                        <strong>{summary.dataRequired} products</strong> are flagged DATA REQUIRED — ADMIN REVIEW. Insufficient data to determine correct variant structure. Do not auto-generate variants for these products.
                      </p>
                    </div>
                  )}
                  {summary.withRealVariants > 0 && (
                    <div className="flex gap-2 items-start bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                      <span className="text-emerald-600 font-bold text-xs mt-0.5 flex-shrink-0">✓</span>
                      <p className="text-[10px] text-emerald-700">
                        <strong>{summary.withRealVariants} products</strong> have actual variant records in the database. Review each product below to confirm the structure is correct before proceeding to pricing.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-[#f0ece4]">
                  <p className="text-[9px] text-[#aaa] italic">
                    ⚠ Approval only — no variants, products, prices, or publishing are changed. All data is fetched live from the database.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-16 text-[#888] text-sm gap-2">
                <span className="w-4 h-4 border border-[#ccc] border-t-[#C9A96E] rounded-full animate-spin" />
                Running variant structure audit…
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>
            )}

            {!loading && (
              <div ref={reportRef} className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-[#888] text-sm">No products match the current filter.</div>
                ) : (
                  filtered.map((audit, index) => (
                    <FullReportRow
                      key={audit.product.id}
                      audit={audit}
                      index={audits.indexOf(audit)}
                      approval={approvals[audit.product.id] || null}
                      onApprove={handleApprove}
                      selected={selectedIds.has(audit.product.id)}
                      onToggleSelect={toggleSelect}
                      saving={savingApproval === audit.product.id}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

                {/* ── ASSIGN MASTER SKUs TAB ── */}
        {activeTab === 'assign_skus' && (
          <div className="space-y-5">

            {/* Safety banner */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-orange-800 mb-1">◆ Master SKU Assignment — Missing SKUs Only</p>
              <p className="text-xs text-orange-700 leading-relaxed">
                This phase assigns a unique deterministic Master SKU to every product that currently has no SKU.
                <strong> Existing SKUs are never overwritten.</strong> No variants, prices, product names, descriptions,
                categories, images, or any other product fields are changed. Only the empty <code>sku</code> field is filled.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-orange-700">
                <div className="flex items-start gap-1.5"><span className="text-emerald-600 font-bold mt-0.5">✓</span><span>Assigns SKU only to products where <code>sku</code> is NULL or empty</span></div>
                <div className="flex items-start gap-1.5"><span className="text-emerald-600 font-bold mt-0.5">✓</span><span>Deterministic — same product always gets same SKU</span></div>
                <div className="flex items-start gap-1.5"><span className="text-emerald-600 font-bold mt-0.5">✓</span><span>No duplicate SKUs generated</span></div>
                <div className="flex items-start gap-1.5"><span className="text-emerald-600 font-bold mt-0.5">✓</span><span>SKU pattern: <code>DTR-{'{CATEGORY_CODE}{SEQ}'}</code> e.g. DTR-RNG001</span></div>
                <div className="flex items-start gap-1.5"><span className="text-red-500 font-bold mt-0.5">✕</span><span>Does NOT overwrite existing non-empty SKUs</span></div>
                <div className="flex items-start gap-1.5"><span className="text-red-500 font-bold mt-0.5">✕</span><span>Does NOT create product variants</span></div>
                <div className="flex items-start gap-1.5"><span className="text-red-500 font-bold mt-0.5">✕</span><span>Does NOT change prices, names, categories, images, or status</span></div>
              </div>
            </div>

            {/* SKU convention reference */}
            <div className="bg-white border border-[#e5e0d8] rounded-lg p-4">
              <p className="text-xs font-semibold text-[#555] mb-2">SKU Convention — Category Codes</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  ['Rings', 'DTR-RNG001'],
                  ['Engagement Rings', 'DTR-ENG001'],
                  ['Diamond Bands', 'DTR-BND001'],
                  ['Earrings', 'DTR-EAR001'],
                  ['Diamond Stud Earrings', 'DTR-STD001'],
                  ['Necklaces', 'DTR-NCK001'],
                  ['Pendants', 'DTR-PND001'],
                  ['Bracelets', 'DTR-BRC001'],
                  ["Tennis Bracelets", 'DTR-TBR001'],
                  ["Men's Jewellery", 'DTR-MNS001'],
                  ['Gemstone Jewellery', 'DTR-GEM001'],
                  ['Other', 'DTR-PRD001'],
                ].map(([cat, example]) => (
                  <div key={cat} className="flex items-center gap-2 text-[10px]">
                    <span className="text-[#888]">{cat}:</span>
                    <span className="font-mono text-[#333] bg-[#f5f3ef] px-1.5 py-0.5 rounded border border-[#e5e0d8]">{example}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1 — Preview */}
            {!skuResult && (
              <div className="bg-white border border-[#e5e0d8] rounded-lg p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1a1a1a]">Step 1 — Preview Proposed SKUs</h3>
                    <p className="text-xs text-[#888] mt-0.5">
                      Review the proposed SKU for every product before any database changes are made.
                    </p>
                  </div>
                  <button
                    onClick={loadSkuPreview}
                    disabled={skuPreviewLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F0E0D] text-white text-sm rounded hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {skuPreviewLoading ? (
                      <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : '◎'}
                    {skuPreviewLoading ? 'Loading Preview…' : 'Load SKU Preview'}
                  </button>
                </div>

                {skuPreviewError && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-4">{skuPreviewError}</div>
                )}

                {skuPreview && (
                  <div className="space-y-4">
                    {/* Summary counts */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { label: 'Total Products', value: skuPreview.totalProducts, color: 'text-[#1a1a1a]', bg: 'bg-[#faf9f7]', border: 'border-[#e5e0d8]' },
                        { label: 'Existing SKUs (preserved)', value: skuPreview.existingSkusPreserved, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                        { label: 'New SKUs to Assign', value: skuPreview.newSkusToAssign, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                        { label: 'Duplicate SKU Count', value: skuPreview.duplicateSkuCount, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
                        { label: 'Errors', value: skuPreview.errors, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
                      ].map((card: any) => (
                        <div key={card.label} className={`${card.bg} border ${card.border} rounded-lg p-3 text-center`}>
                          <p className={`text-2xl font-light ${card.color}`}>{card.value}</p>
                          <p className="text-[9px] text-[#888] mt-1 leading-tight">{card.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Preview table */}
                    <div>
                      <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-2">
                        Preview — {skuPreview.preview.length} products
                      </p>
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-[#e5e0d8] rounded">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-[#faf9f7] border-b border-[#e5e0d8]">
                            <tr>
                              <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">#</th>
                              <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Product ID</th>
                              <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Product Name</th>
                              <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Category</th>
                              <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Current SKU</th>
                              <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Proposed Master SKU</th>
                              <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {skuPreview.preview.map((row: any, i: number) => (
                              <tr key={row.productId} className={`border-b border-[#f0ece4] ${
                                row.action === 'preserve' ? 'bg-[#fafaf9]' :
                                row.action === 'error' ? 'bg-red-50' : 'hover:bg-[#faf9f7]'
                              }`}>
                                <td className="px-3 py-1.5 text-[9px] text-[#aaa] font-mono">{i + 1}</td>
                                <td className="px-3 py-1.5 text-[9px] text-[#aaa] font-mono">{row.productId}</td>
                                <td className="px-3 py-1.5">
                                  <span className="text-[10px] font-medium text-[#1a1a1a]">{row.productName}</span>
                                </td>
                                <td className="px-3 py-1.5 text-[10px] text-[#555]">{row.category}</td>
                                <td className="px-3 py-1.5 font-mono text-[10px]">
                                  {row.currentSku ? (
                                    <span className="text-emerald-700">{row.currentSku}</span>
                                  ) : (
                                    <span className="text-orange-500 italic">— none —</span>
                                  )}
                                </td>
                                <td className="px-3 py-1.5 font-mono text-[10px]">
                                  {row.proposedSku ? (
                                    <span className={row.action === 'preserve' ? 'text-[#888]' : 'text-blue-700 font-semibold'}>{row.proposedSku}</span>
                                  ) : (
                                    <span className="text-red-500 italic">— error —</span>
                                  )}
                                </td>
                                <td className="px-3 py-1.5">
                                  {row.action === 'preserve' && (
                                    <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold">Preserve</span>
                                  )}
                                  {row.action === 'assign' && (
                                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Assign</span>
                                  )}
                                  {row.action === 'error' && (
                                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold" title={row.reason}>Error</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Confirm button */}
                    {skuPreview.newSkusToAssign > 0 && !skuConfirmVisible && (
                      <div className="pt-2 border-t border-[#f0ece4]">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs text-[#555]">
                            Ready to assign <strong className="text-blue-700">{skuPreview.newSkusToAssign} new SKUs</strong>.{' '}
                            <strong>{skuPreview.existingSkusPreserved} existing SKUs</strong> will not be touched.
                            No variants, prices, or other product data will be changed.
                          </p>
                          <button
                            onClick={() => setSkuConfirmVisible(true)}
                            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                          >
                            Proceed to Confirm →
                          </button>
                        </div>
                      </div>
                    )}

                    {skuPreview.newSkusToAssign === 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-sm text-emerald-700 text-center">
                        ✓ All products already have SKUs. Nothing to assign.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Confirm */}
            {skuConfirmVisible && skuPreview && (
              <div className="bg-white border-2 border-blue-400 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Step 2 — Confirm SKU Assignment</h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2">You are about to:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Assign <strong>{skuPreview.newSkusToAssign}</strong> new Master SKUs to products currently missing a SKU</li>
                    <li>• Preserve <strong>{skuPreview.existingSkusPreserved}</strong> existing SKUs — they will NOT be changed</li>
                    <li>• Only the <code>sku</code> column is updated — no other product fields are touched</li>
                    <li>• <strong>No product_variants rows will be created or modified</strong></li>
                    <li>• <strong>No prices will be changed</strong></li>
                    <li>• <strong>No products will be published or unpublished</strong></li>
                  </ul>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={executeSkuAssignment}
                    disabled={skuAssigning}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {skuAssigning ? (
                      <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : '✓'}
                    {skuAssigning ? 'Assigning SKUs…' : `Assign ${skuPreview.newSkusToAssign} SKUs`}
                  </button>
                  <button
                    onClick={() => setSkuConfirmVisible(false)}
                    disabled={skuAssigning}
                    className="px-4 py-2.5 bg-white border border-[#e5e0d8] text-[#555] text-sm rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {skuError && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{skuError}</div>
            )}

            {/* Result report */}
            {skuResult && (
              <div className="space-y-4">
                <div className={`border-2 rounded-lg p-5 ${skuResult.errors?.length > 0 ? 'border-amber-400 bg-amber-50' : 'border-emerald-400 bg-emerald-50'}`}>
                  <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">
                    {skuResult.errors?.length > 0 ? '⚠ SKU Assignment Completed with Errors' : '✓ SKU Assignment Completed'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                    {[
                      { label: 'Total Checked', value: skuResult.totalChecked, color: 'text-[#1a1a1a]', bg: 'bg-white', border: 'border-[#e5e0d8]' },
                      { label: 'Existing SKUs Preserved', value: skuResult.existingSkusPreserved, color: 'text-emerald-700', bg: 'bg-white', border: 'border-emerald-200' },
                      { label: 'New SKUs Assigned', value: skuResult.newSkusAssigned, color: 'text-blue-700', bg: 'bg-white', border: 'border-blue-200' },
                      { label: 'Duplicate SKU Count', value: skuResult.duplicateSkuCount, color: 'text-red-700', bg: 'bg-white', border: 'border-red-200' },
                      { label: 'Still Missing SKU', value: skuResult.stillMissingSku, color: skuResult.stillMissingSku > 0 ? 'text-red-700' : 'text-emerald-700', bg: 'bg-white', border: 'border-[#e5e0d8]' },
                    ].map((card: any) => (
                      <div key={card.label} className={`${card.bg} border ${card.border} rounded-lg p-3 text-center`}>
                        <p className={`text-2xl font-light ${card.color}`}>{card.value}</p>
                        <p className="text-[9px] text-[#888] mt-1 leading-tight">{card.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span className="text-[#555]">product_variants: <strong>NOT changed</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span className="text-[#555]">Prices: <strong>NOT changed</strong></span>
                    </div>
                  </div>
                </div>

                {/* Audit log */}
                {skuResult.auditLog?.length > 0 && (
                  <div>
                    <p className="text-[9px] font-semibold text-[#888] uppercase tracking-wide mb-2">
                      Audit Log — {skuResult.auditLog.length} SKUs Assigned
                    </p>
                    <div className="overflow-x-auto max-h-80 overflow-y-auto border border-[#e5e0d8] rounded">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#faf9f7] border-b border-[#e5e0d8]">
                          <tr>
                            <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">#</th>
                            <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Product ID</th>
                            <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Product Name</th>
                            <th className="text-left px-3 py-2 text-[9px] font-semibold text-[#888] uppercase">Assigned SKU</th>
                          </tr>
                        </thead>
                        <tbody>
                          {skuResult.auditLog.map((entry: any, i: number) => (
                            <tr key={entry.productId} className="border-b border-[#f0ece4] hover:bg-[#faf9f7]">
                              <td className="px-3 py-1.5 text-[9px] text-[#aaa]">{i + 1}</td>
                              <td className="px-3 py-1.5 text-[9px] font-mono text-[#aaa]">{entry.productId}</td>
                              <td className="px-3 py-1.5 text-[10px] text-[#333]">{entry.productName}</td>
                              <td className="px-3 py-1.5 font-mono text-[10px] text-blue-700 font-semibold">{entry.assignedSku}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {skuResult.errors?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wide mb-1.5">Errors ({skuResult.errors.length})</p>
                    <ul className="space-y-1">
                      {skuResult.errors.map((err: string, i: number) => (
                        <li key={i} className="text-[10px] text-red-700">• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => { setSkuResult(null); setSkuPreview(null); loadSkuPreview(); }}
                    className="px-4 py-2 bg-white border border-[#e5e0d8] text-[#555] text-sm rounded hover:bg-gray-50 transition-colors"
                  >
                    ↻ Reload Preview
                  </button>
                  <p className="text-[10px] text-[#aaa] italic">
                    SKU assignment complete. You can now proceed to Create Approved Variants.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BRACELETS TAB ── */}
        {activeTab === 'bracelets' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">◆ Bracelet / Tennis Bracelet Products</p>
              <p className="text-xs text-amber-700 mb-2">
                <strong>Required structure:</strong> 1ct / 2ct / 3ct / 4ct / 5ct + Custom 6ct+
              </p>
              <p className="text-xs text-amber-700">
                <strong>RULE:</strong> Do NOT start at 0.30ct. Do NOT auto-generate from carat range text. Bracelets must use whole-carat steps only.
              </p>
            </div>

            {/* Bracelet CSV export */}
            <div className="flex items-center gap-3">
              <button
                onClick={exportApprovedBraceletsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors font-semibold"
              >
                ↓ Export Approved Bracelets CSV
              </button>
              <span className="text-xs text-[#888]">Exports only approved bracelet products with 1ct/2ct/3ct/4ct/5ct + Custom 6ct+ structure</span>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16 text-[#888] text-sm gap-2">
                <span className="w-4 h-4 border border-[#ccc] border-t-[#C9A96E] rounded-full animate-spin" />
                Loading bracelet products…
              </div>
            )}

            {!loading && braceletAudits.length === 0 && (
              <div className="text-center py-12 text-[#888] text-sm">No bracelet products found in the database.</div>
            )}

            {!loading && braceletAudits.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Bracelets', value: braceletAudits.length, color: 'text-amber-700' },
                    { label: 'With DB Variants', value: braceletAudits.filter(a => a.variants.length > 0).length, color: 'text-emerald-700' },
                    { label: 'No Variants', value: braceletAudits.filter(a => a.variants.length === 0).length, color: 'text-red-600' },
                    { label: 'Wrong Start Carat', value: braceletAudits.filter(a => hasWrongStartCarat(a.product, a.variants)).length, color: 'text-red-600' },
                    { label: 'Approved', value: braceletAudits.filter(a => approvals[a.product.id]?.approval_status === 'approved').length, color: 'text-emerald-700' },
                    { label: 'Pending Review', value: braceletAudits.filter(a => !approvals[a.product.id] || approvals[a.product.id]?.approval_status === 'pending_review').length, color: 'text-gray-700' },
                  ].map(card => (
                    <div key={card.label} className="bg-white border border-[#e5e0d8] rounded-lg p-3 text-center">
                      <p className={`text-2xl font-light ${card.color}`}>{card.value}</p>
                      <p className="text-[10px] text-[#888] mt-1 leading-tight">{card.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {braceletAudits.map((audit, index) => (
                    <FullReportRow
                      key={audit.product.id}
                      audit={audit}
                      index={index}
                      approval={approvals[audit.product.id] || null}
                      onApprove={handleApprove}
                      selected={selectedIds.has(audit.product.id)}
                      onToggleSelect={toggleSelect}
                      saving={savingApproval === audit.product.id}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── AUDIT TAB (Summary) ── */}
        {activeTab === 'audit' && (
          <>
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Total Products', value: summary.total, color: 'text-[#1a1a1a]' },
                  { label: 'With Real Variants', value: summary.withRealVariants, color: 'text-emerald-700' },
                  { label: 'Options Only (No Variants)', value: summary.optionsOnly, color: 'text-red-600' },
                  { label: 'Zero Variants', value: summary.missingVariants, color: 'text-red-600' },
                  { label: 'Bracelet Products', value: summary.braceletProducts, color: 'text-amber-700' },
                  { label: 'Custom Carat Products', value: summary.customCaratProducts, color: 'text-blue-700' },
                  { label: 'Price Anomalies', value: summary.pricingAnomalies, color: 'text-amber-700' },
                  { label: 'Data Required / Critical', value: summary.dataRequired, color: 'text-purple-700' },
                  { label: 'Missing SKUs', value: summary.missingSkus, color: 'text-orange-600' },
                  { label: 'Wrong Start Carat', value: summary.wrongStartCarat, color: 'text-red-600' },
                ].map(card => (
                  <div key={card.label} className="bg-white border border-[#e5e0d8] rounded-lg p-3 text-center">
                    <p className={`text-2xl font-light ${card.color}`}>{card.value}</p>
                    <p className="text-[10px] text-[#888] mt-1 leading-tight">{card.label}</p>
                  </div>
                ))}
              </div>
            )}

            {summary && summary.optionsOnly > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  ✕ Critical Finding: {summary.optionsOnly} products have option text but ZERO actual variant records
                </p>
                <p className="text-xs text-red-700">
                  These products list metals and stone types in their option fields, but the <code>product_variants</code> table contains no matching rows.
                  Variant architecture must be defined before any pricing can be generated.
                  <strong> Do NOT auto-generate variants from option text — Admin must define the correct structure first.</strong>
                </p>
              </div>
            )}

            {summary && summary.wrongStartCarat > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  ✕ Wrong Start Carat: {summary.wrongStartCarat} bracelet product(s) incorrectly start at 0.30ct
                </p>
                <p className="text-xs text-red-700">
                  Bracelet/tennis bracelet products must start at 1ct, not 0.30ct. These products need their carat structure corrected to: 1ct / 2ct / 3ct / 4ct / 5ct + Custom 6ct+.
                </p>
              </div>
            )}

            {summary && summary.missingSkus > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-orange-800 mb-1">
                  ⚠ Missing SKUs: {summary.missingSkus} products have no SKU
                </p>
                <p className="text-xs text-orange-700">
                  SKUs are required before variant pricing can be generated. These products must be assigned SKUs first.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search product, SKU, ID, category…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 min-w-[200px] max-w-xs px-3 py-2 text-sm border border-[#e5e0d8] rounded bg-white focus:outline-none focus:border-[#C9A96E]"
              />
              <div className="flex flex-wrap gap-1">
                {([
                  ['all', 'All'],
                  ['critical', '✕ Critical'],
                  ['warning', '⚠ Warning'],
                  ['data_required', '? Data Required'],
                  ['ok', '✓ OK'],
                  ['bracelet', '◆ Bracelets'],
                  ['options_only', '⊘ Options Only'],
                  ['missing_sku', '⊘ Missing SKU'],
                  ['price_anomaly', '£ Price Anomaly'],
                  ['wrong_start_carat', '⚠ Wrong Carat'],
                ] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilter(val)}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${
                      filter === val
                        ? 'bg-[#0F0E0D] text-white'
                        : 'bg-white border border-[#e5e0d8] text-[#555] hover:border-[#C9A96E]'
                    }`}
                  >
                    {label} {val !== 'all' && summary ? `(${
                      val === 'critical' ? audits.filter(a => a.status === 'critical').length :
                      val === 'warning' ? audits.filter(a => a.status === 'warning').length :
                      val === 'data_required' ? audits.filter(a => a.status === 'data_required').length :
                      val === 'ok' ? audits.filter(a => a.status === 'ok').length :
                      val === 'bracelet' ? audits.filter(a => isBraceletCategory(a.product.category || '')).length :
                      val === 'options_only' ? audits.filter(a => a.variants.length === 0 && (a.product.metal_options?.length > 0 || a.product.diamond_type?.length > 0)).length :
                      val === 'missing_sku' ? audits.filter(a => !a.product.sku).length :
                      val === 'price_anomaly' ? audits.filter(a => a.issues.some(i => i.type === 'price_anomaly')).length :
                      val === 'wrong_start_carat' ? audits.filter(a => hasWrongStartCarat(a.product, a.variants)).length : 0
                    })` : ''}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[#888]">{filtered.length} products</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-16 text-[#888] text-sm gap-2">
                <span className="w-4 h-4 border border-[#ccc] border-t-[#C9A96E] rounded-full animate-spin" />
                Running variant structure audit…
              </div>
            )}

            {!loading && (
              <div className="bg-white border border-[#e5e0d8] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e0d8] bg-[#faf9f7]">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#888] uppercase tracking-wide">#</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#888] uppercase tracking-wide">Product</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#888] uppercase tracking-wide">Category</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#888] uppercase tracking-wide">DB Variants</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#888] uppercase tracking-wide">Option Text</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#888] uppercase tracking-wide">Carat Range</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#888] uppercase tracking-wide">Audit Status</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#888] uppercase tracking-wide">Approval</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-[#888] text-sm">
                          No products match the current filter.
                        </td>
                      </tr>
                    )}
                    {filtered.map((audit, idx) => {
                      const currentApprovalStatus: ApprovalStatus = approvals[audit.product.id]?.approval_status || 'pending_review';
                      const appCfg = APPROVAL_STATUS_CONFIG[currentApprovalStatus];
                      return (
                        <React.Fragment key={audit.product.id}>
                          <tr
                            className={`border-b border-[#f0ece4] hover:bg-[#faf9f7] cursor-pointer transition-colors ${
                              expandedId === audit.product.id ? 'bg-[#faf9f7]' : ''
                            }`}
                            onClick={() => setExpandedId(expandedId === audit.product.id ? null : audit.product.id)}
                          >
                            <td className="px-4 py-3 text-[10px] text-[#aaa] font-mono">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-[#1a1a1a] text-sm leading-tight">{audit.product.name}</p>
                              <p className="text-[10px] text-[#aaa] mt-0.5 font-mono">{audit.product.sku || <span className="text-orange-500 font-semibold">No SKU</span>}</p>
                              <p className="text-[9px] text-[#ccc] mt-0.5 font-mono">{audit.product.id}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-[#555]">{audit.product.category || '—'}</span>
                              {isBraceletCategory(audit.product.category || '') && (
                                <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded">BRACELET</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-semibold ${audit.variants.length > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {audit.variants.length}
                              </span>
                              <span className="text-[10px] text-[#aaa] ml-1">rows</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {(audit.product.metal_options || []).slice(0, 2).map(m => (
                                  <span key={m} className="text-[9px] bg-[#f0ece4] text-[#555] px-1.5 py-0.5 rounded">{m}</span>
                                ))}
                                {(audit.product.metal_options || []).length > 2 && (
                                  <span className="text-[9px] text-[#aaa]">+{(audit.product.metal_options || []).length - 2}</span>
                                )}
                                {(audit.product.diamond_type || []).slice(0, 1).map(d => (
                                  <span key={d} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{d}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs ${hasWrongStartCarat(audit.product, audit.variants) ? 'text-red-600 font-semibold' : 'text-[#555]'}`}>
                                {audit.product.carat_range || '—'}
                                {hasWrongStartCarat(audit.product, audit.variants) && ' ⚠'}
                              </span>
                            </td>
                            <td className="px-4 py-3">{statusBadge(audit.status)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${appCfg.bg} ${appCfg.color} ${appCfg.border}`}>
                                {appCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#aaa] text-xs">{expandedId === audit.product.id ? '▲' : '▼'}</td>
                          </tr>

                          {expandedId === audit.product.id && (
                            <tr className="bg-[#faf9f7]">
                              <td colSpan={9} className="px-4 pb-4 pt-2">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                  <div className="lg:col-span-2 space-y-2">
                                    <p className="text-[10px] font-semibold text-[#888] uppercase tracking-wide mb-2">Audit Findings</p>
                                    {audit.issues.length === 0 ? (
                                      <p className="text-xs text-emerald-600">✓ No issues found. Variant structure appears correct.</p>
                                    ) : audit.issues.map((issue, i) => (
                                      <div key={i} className="flex gap-2 items-start">
                                        <span className={`text-xs mt-0.5 ${severityColor(issue.severity)}`}>
                                          {issue.severity === 'critical' ? '✕' : issue.severity === 'warning' ? '⚠' : 'ℹ'}
                                        </span>
                                        <p className={`text-xs leading-relaxed ${severityColor(issue.severity)}`}>{issue.message}</p>
                                      </div>
                                    ))}

                                    {audit.variants.length > 0 && (
                                      <div className="mt-3">
                                        <p className="text-[10px] font-semibold text-[#888] uppercase tracking-wide mb-2">
                                          Actual DB Variant Records ({audit.variants.length})
                                        </p>
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-xs border border-[#e5e0d8] rounded">
                                            <thead>
                                              <tr className="bg-[#f5f3ef] border-b border-[#e5e0d8]">
                                                <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase">Variant ID</th>
                                                <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase">Variant SKU</th>
                                                <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase">Metal</th>
                                                <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase">Stone</th>
                                                <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase">Carat</th>
                                                <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase">Price</th>
                                                <th className="text-left px-2 py-1.5 text-[9px] text-[#888] uppercase">Enabled</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {audit.variants.map(v => (
                                                <tr key={v.id} className="border-b border-[#f0ece4]">
                                                  <td className="px-2 py-1.5 font-mono text-[9px] text-[#aaa]">{v.id}</td>
                                                  <td className="px-2 py-1.5 font-mono text-[10px]">{v.sku || <span className="text-orange-500">— MISSING —</span>}</td>
                                                  <td className="px-2 py-1.5">{v.metal || '—'}</td>
                                                  <td className="px-2 py-1.5">{v.diamond_type || '—'}</td>
                                                  <td className="px-2 py-1.5">{v.carat || '—'}</td>
                                                  <td className="px-2 py-1.5">{v.price > 0 ? `£${v.price.toLocaleString()}` : <span className="text-amber-500">£0 ⚠</span>}</td>
                                                  <td className="px-2 py-1.5">{v.is_enabled ? <span className="text-emerald-600">✓</span> : <span className="text-red-400">✕</span>}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-[10px] font-semibold text-[#888] uppercase tracking-wide mb-2">Category Rule</p>
                                      {audit.categoryRule ? (
                                        <div className="bg-white border border-[#e5e0d8] rounded p-3 space-y-2 text-xs">
                                          <p className="font-medium text-[#1a1a1a]">{audit.categoryRule.category_name}</p>
                                          <div>
                                            <span className="text-[#888]">Valid Carats: </span>
                                            <span className="text-[#555]">{audit.categoryRule.valid_carat_steps.join(', ')}</span>
                                          </div>
                                          <div>
                                            <span className="text-[#888]">Custom Carat: </span>
                                            <span className={audit.categoryRule.supports_custom_carat ? 'text-emerald-600' : 'text-[#aaa]'}>
                                              {audit.categoryRule.supports_custom_carat ? `Yes — ${audit.categoryRule.custom_carat_label}` : 'No'}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-[#888]">Metals: </span>
                                            <span className="text-[#555]">{audit.categoryRule.valid_metals.length} options</span>
                                          </div>
                                          {audit.categoryRule.notes && (
                                            <p className="text-[#888] italic text-[10px] leading-relaxed border-t border-[#f0ece4] pt-2">{audit.categoryRule.notes}</p>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-700">
                                          No category rule defined for "{audit.product.category}". Admin must define variant rules for this category before pricing.
                                        </div>
                                      )}
                                    </div>

                                    {/* Inline approval in expanded row */}
                                    <div className="bg-white border border-[#e5e0d8] rounded p-3">
                                      <p className="text-[10px] font-semibold text-[#888] uppercase tracking-wide mb-2">Approval</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {(['approved', 'needs_review', 'excluded', 'pending_review'] as ApprovalStatus[]).map(s => {
                                          const cfg = APPROVAL_STATUS_CONFIG[s];
                                          const isActive = currentApprovalStatus === s;
                                          return (
                                            <button
                                              key={s}
                                              onClick={e => { e.stopPropagation(); handleApprove(audit.product.id, s); }}
                                              disabled={savingApproval === audit.product.id || isActive}
                                              className={`px-2.5 py-1 text-[10px] font-semibold rounded transition-colors disabled:opacity-60 ${
                                                isActive ? `${cfg.bg} ${cfg.color} ${cfg.border} border cursor-default` : 'bg-white border border-[#e5e0d8] text-[#555] hover:border-[#C9A96E]'
                                              }`}
                                            >
                                              {isActive ? '✓ ' : ''}{cfg.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <p className="text-[9px] text-[#aaa] mt-2 italic">Approval only — no variants or prices are changed.</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── RULES TAB ── */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">Category Variant Rules</p>
              <p className="text-xs">These rules define the valid variant structure per product category. They are used by the audit to flag incorrect or missing variants. Rules must be confirmed by Admin before any pricing is generated.</p>
            </div>

            {categoryRules.length === 0 && !loading && (
              <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-700">
                No category rules found. Run the migration to seed default rules.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {categoryRules.map(rule => (
                <div key={rule.category_name} className="bg-white border border-[#e5e0d8] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-[#1a1a1a] text-sm">{rule.category_name}</h3>
                    {rule.supports_custom_carat && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                        Custom Carat: {rule.custom_carat_label}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[#888] text-[10px] uppercase tracking-wide">Valid Carat Steps</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.valid_carat_steps.map(c => (
                          <span key={c} className="bg-[#f5f3ef] text-[#555] px-2 py-0.5 rounded text-[10px]">{c}ct</span>
                        ))}
                        {rule.supports_custom_carat && (
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px]">{rule.custom_carat_label}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[#888] text-[10px] uppercase tracking-wide">Valid Metals</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.valid_metals.map(m => (
                          <span key={m} className="bg-[#f5f3ef] text-[#555] px-2 py-0.5 rounded text-[10px]">{m}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[#888] text-[10px] uppercase tracking-wide">Stone Types</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.valid_stone_types.map(s => (
                          <span key={s} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px]">{s}</span>
                        ))}
                      </div>
                    </div>

                    {rule.notes && (
                      <p className="text-[#888] italic text-[10px] leading-relaxed border-t border-[#f0ece4] pt-2">{rule.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
