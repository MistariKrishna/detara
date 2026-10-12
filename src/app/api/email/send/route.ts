import { NextRequest, NextResponse } from 'next/server';
import {
  sendTestEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendAdminOrderNotification,
  sendContactFormEmail,
  sendCustomRequestEmail,
  sendCustomOrderEmail,
  sendReservationEmail,
  sendConciergeLeadEmail,
  sendNewsletterWelcomeEmail,
  sendAdminNotification,
  getEmailLog,
} from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing required field: type' }, { status: 400 });
    }

    let success = false;

    switch (type) {
      case 'test':
        success = await sendTestEmail(data.to);
        break;
      case 'welcome':
        success = await sendWelcomeEmail(data);
        break;
      case 'verification':
        success = await sendVerificationEmail(data);
        break;
      case 'password_reset':
        success = await sendPasswordResetEmail(data);
        break;
      case 'order_confirmation':
        success = await sendOrderConfirmationEmail(data);
        break;
      case 'admin_order_notification':
        success = await sendAdminOrderNotification(data);
        break;
      case 'reservation':
        success = await sendReservationEmail(data);
        break;
      case 'custom_order':
        success = await sendCustomOrderEmail(data);
        break;
      case 'contact_form':
        success = await sendContactFormEmail(data);
        break;
      case 'custom_request':
        success = await sendCustomRequestEmail(data);
        break;
      case 'concierge_lead':
        success = await sendConciergeLeadEmail(data);
        break;
      case 'newsletter_signup':
        success = await sendNewsletterWelcomeEmail(data);
        break;
      case 'admin_notification':
        success = await sendAdminNotification(data);
        break;
      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success });
  } catch (err: any) {
    console.error('[Email API] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  const log = getEmailLog();
  return NextResponse.json({ log });
}
