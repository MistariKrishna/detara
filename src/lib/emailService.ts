// ─── DETARA Email Service ─────────────────────────────────────────────────────
// All emails are sent via the Supabase Edge Function which has the Resend API
// key injected as a secret. This avoids needing RESEND_API_KEY in .env.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Edge function endpoint
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-order-email`;

// ─── Email log (in-memory ring buffer, 200 entries) ──────────────────────────
interface EmailLogEntry {
  id: string;
  type: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
  timestamp: string;
}
const emailLog: EmailLogEntry[] = [];
function logEmail(entry: Omit<EmailLogEntry, 'id' | 'timestamp'>) {
  emailLog.unshift({
    ...entry,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  });
  if (emailLog.length > 200) emailLog.pop();
}
export function getEmailLog() { return [...emailLog]; }

// ─── Persist email log to Supabase email_logs table ──────────────────────────
async function persistEmailLog(entry: {
  email_type: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'skipped';
  error_message?: string;
  metadata?: Record<string, unknown>;
}) {
  // Only persist on server side (API routes / server components)
  if (typeof window !== 'undefined') return;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await supabase.from('email_logs').insert({
      email_type: entry.email_type,
      recipient: entry.recipient,
      subject: entry.subject || entry.email_type,
      status: entry.status,
      error_message: entry.error_message || null,
      metadata: entry.metadata || {},
    });
  } catch (e) {
    // Non-critical — don't let logging failure break email flow
    console.warn('[DETARA Email] Failed to persist email log:', e);
  }
}

// ─── Core send helper — calls the edge function ───────────────────────────────
async function callEdgeFunction(payload: Record<string, unknown>): Promise<boolean> {
  const type = String(payload.type || 'unknown');
  const to = String(payload.to || '');
  const subject = String(payload.subject || type);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[DETARA Email] Supabase URL or anon key not configured');
    logEmail({ type, to, subject, status: 'failed', error: 'Supabase not configured' });
    await persistEmailLog({ email_type: type, recipient: to, subject, status: 'failed', error_message: 'Supabase not configured' });
    return false;
  }

  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.error) {
      const errMsg = data?.error || `HTTP ${res.status}`;
      console.error(`[DETARA Email] Edge function error for ${type} to ${to}:`, errMsg);
      logEmail({ type, to, subject, status: 'failed', error: errMsg });
      await persistEmailLog({ email_type: type, recipient: to, subject, status: 'failed', error_message: errMsg });
      return false;
    }

    console.log(`[DETARA Email] SENT ${type} to ${to} — emailCount: ${data?.emailCount || 1}`);
    logEmail({ type, to, subject, status: 'sent' });
    await persistEmailLog({ email_type: type, recipient: to, subject, status: 'sent', metadata: { emailCount: data?.emailCount } });
    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`[DETARA Email] Exception calling edge function for ${type}:`, errMsg);
    logEmail({ type, to, subject, status: 'failed', error: errMsg });
    await persistEmailLog({ email_type: type, recipient: to, subject, status: 'failed', error_message: errMsg });
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Welcome / Account Signup ─────────────────────────────────────────────
export interface WelcomeEmailData { to: string; customerName: string; }
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  return callEdgeFunction({ type: 'welcome', to: data.to, customerName: data.customerName });
}

// ─── 2. Email Verification ────────────────────────────────────────────────────
export interface VerificationEmailData { to: string; customerName: string; verifyUrl: string; }
export async function sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  return callEdgeFunction({ type: 'welcome', to: data.to, customerName: data.customerName });
}

// ─── 3. Password Reset ────────────────────────────────────────────────────────
export interface PasswordResetEmailData { to: string; customerName: string; resetUrl: string; }
export async function sendPasswordResetEmail(_data: PasswordResetEmailData): Promise<boolean> {
  // Handled by Supabase Auth natively
  return true;
}

// ─── 4. Standard Order Confirmation ──────────────────────────────────────────
export interface OrderEmailData {
  to: string;
  customerName: string;
  orderNumber: string;
  orderItems: Array<{ name: string; carat?: string; metal?: string; price: number; quantity?: number }>;
  orderTotal: number;
  shippingAddress?: string;
  paymentMethod?: string;
}
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  return callEdgeFunction({
    type: 'order_confirmation',
    to: data.to,
    customerName: data.customerName,
    orderNumber: data.orderNumber,
    orderItems: data.orderItems,
    orderTotal: data.orderTotal,
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod,
    subject: `Order Confirmation ${data.orderNumber}`,
  });
}

// ─── 5. Admin Order Notification (no-op — included in order_confirmation) ────
export async function sendAdminOrderNotification(_data: OrderEmailData): Promise<boolean> {
  return true;
}

// ─── 6. Reservation ("Reserve This Piece") ───────────────────────────────────
export interface ReservationEmailData {
  to: string;
  customerName: string;
  referenceNumber?: string;
  productName?: string;
  productUrl?: string;
  productSku?: string;
  productPrice?: number;
  productMetal?: string;
  productDiamond?: string;
  preferredPayment?: string;
  preferredContact?: string;
  phone?: string;
  message?: string;
}
export async function sendReservationEmail(data: ReservationEmailData): Promise<boolean> {
  return callEdgeFunction({
    type: 'reservation',
    to: data.to,
    customerName: data.customerName,
    referenceNumber: data.referenceNumber,
    productName: data.productName,
    productUrl: data.productUrl,
    productSku: data.productSku,
    productPrice: data.productPrice,
    productMetal: data.productMetal,
    productDiamond: data.productDiamond,
    preferredPayment: data.preferredPayment,
    preferredContact: data.preferredContact,
    phone: data.phone,
    message: data.message,
    subject: `Reservation Request — ${data.productName || 'DETARA Piece'}`,
  });
}

// ─── 7. Custom Order / Custom Enquiry ────────────────────────────────────────
export interface CustomOrderEmailData {
  to: string;
  customerName: string;
  referenceNumber?: string;
  jewelryType?: string;
  productName?: string;
  productUrl?: string;
  diamondPreference?: string;
  productMetal?: string;
  requestedSpecs?: string;
  quantity?: number;
  budget?: string;
  preferredPayment?: string;
  preferredContact?: string;
  phone?: string;
  message?: string;
}
export async function sendCustomOrderEmail(data: CustomOrderEmailData): Promise<boolean> {
  return callEdgeFunction({
    type: 'custom_order',
    to: data.to,
    customerName: data.customerName,
    referenceNumber: data.referenceNumber,
    jewelryType: data.jewelryType,
    productName: data.productName,
    productUrl: data.productUrl,
    diamondPreference: data.diamondPreference,
    productMetal: data.productMetal,
    requestedSpecs: data.requestedSpecs,
    quantity: data.quantity,
    budget: data.budget,
    preferredPayment: data.preferredPayment,
    preferredContact: data.preferredContact,
    phone: data.phone,
    message: data.message,
    subject: `Custom Order Request — ${data.jewelryType || 'DETARA'}`,
  });
}

// ─── 8. Contact Form ─────────────────────────────────────────────────────────
export interface ContactFormEmailData {
  to: string;
  customerName: string;
  message: string;
  subject?: string;
}
export async function sendContactFormEmail(data: ContactFormEmailData): Promise<boolean> {
  return callEdgeFunction({
    type: 'contact_form',
    to: data.to,
    customerName: data.customerName,
    message: data.message,
    subject: data.subject || `Contact Form — ${data.customerName}`,
  });
}

// ─── 9. Custom Request (legacy alias → routes to custom_order) ───────────────
export interface CustomRequestEmailData {
  to: string;
  customerName: string;
  message: string;
  referenceNumber?: string;
  jewelryType?: string;
  diamondPreference?: string;
  budget?: string;
}
export async function sendCustomRequestEmail(data: CustomRequestEmailData): Promise<boolean> {
  return callEdgeFunction({
    type: 'custom_order',
    to: data.to,
    customerName: data.customerName,
    message: data.message,
    referenceNumber: data.referenceNumber,
    jewelryType: data.jewelryType,
    diamondPreference: data.diamondPreference,
    budget: data.budget,
    subject: `Custom Request — ${data.jewelryType || 'DETARA'}`,
  });
}

// ─── 10. Concierge Lead (reservation/invoice_request/consultation/inquiry) ───
export interface ConciergeLeadEmailData {
  to: string;
  customerName: string;
  leadType: 'reservation' | 'invoice_request' | 'consultation' | 'inquiry';
  productName?: string;
  productConfig?: string;
  productPrice?: number;
  phone?: string;
  message?: string;
  referenceNumber?: string;
}
export async function sendConciergeLeadEmail(data: ConciergeLeadEmailData): Promise<boolean> {
  const typeMap: Record<string, string> = {
    reservation: 'reservation',
    invoice_request: 'custom_order',
    consultation: 'contact_form',
    inquiry: 'contact_form',
  };
  return callEdgeFunction({
    type: typeMap[data.leadType] || 'contact_form',
    to: data.to,
    customerName: data.customerName,
    productName: data.productName,
    productConfig: data.productConfig,
    productPrice: data.productPrice,
    phone: data.phone,
    message: data.message,
    referenceNumber: data.referenceNumber,
    subject: `${data.leadType.replace('_', ' ')} — ${data.customerName}`,
  });
}

// ─── 11. Newsletter Welcome ───────────────────────────────────────────────────
export interface NewsletterWelcomeEmailData { to: string; }
export async function sendNewsletterWelcomeEmail(data: NewsletterWelcomeEmailData): Promise<boolean> {
  return callEdgeFunction({ type: 'newsletter_signup', to: data.to });
}

// ─── 12. Admin Notification (generic) ────────────────────────────────────────
export interface AdminNotificationData { subject: string; message: string; }
export async function sendAdminNotification(data: AdminNotificationData): Promise<boolean> {
  return callEdgeFunction({
    type: 'contact_form',
    to: process.env.ADMIN_EMAIL || 'hello@detara.store',
    customerName: 'DETARA System',
    message: data.message,
    subject: data.subject,
  });
}

// ─── 13. Test Email ───────────────────────────────────────────────────────────
export async function sendTestEmail(to: string): Promise<boolean> {
  return callEdgeFunction({ type: 'test', to });
}
