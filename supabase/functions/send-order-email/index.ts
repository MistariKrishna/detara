// @ts-ignore
const serve = (globalThis as any).Deno ? (await import("https://deno.land/std@0.192.0/http/server.ts")).serve : null;

serve(async (req: Request) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const {
      type,
      to,
      customerName,
      orderNumber,
      orderItems,
      orderTotal,
      shippingAddress,
      paymentMethod: orderPaymentMethod,
      orderType,
      message,
      subject: customSubject,
      // concierge / reservation / custom request fields
      leadType,
      productName,
      productUrl,
      productSku,
      productConfig,
      productPrice,
      productMetal,
      productDiamond,
      referenceNumber,
      jewelryType,
      diamondPreference,
      budget,
      preferredContact,
      preferredPayment,
      phone,
      // custom order specific
      requestedSpecs,
      quantity,
    } = body;

    // ── Early validation: type is required ────────────────────────────────────
    const VALID_TYPES = [
      "order_confirmation",
      "reservation",
      "custom_order",
      "concierge_lead",
      "contact_form",
      "custom_request",
      "newsletter_signup",
      "welcome",
      "test",
    ];

    if (!type) {
      console.error("[DETARA Email] Missing required field: type. Received body keys:", Object.keys(body).join(", "));
      return new Response(
        JSON.stringify({ error: `Missing required field: type. Must be one of: ${VALID_TYPES.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      console.error(`[DETARA Email] Unknown email type: ${type}`);
      return new Response(
        JSON.stringify({ error: `Unknown email type: ${type}. Must be one of: ${VALID_TYPES.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!to) {
      console.error("[DETARA Email] Missing required field: to");
      return new Response(
        JSON.stringify({ error: "Missing required field: to (recipient email)" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    console.log(`[DETARA Email] Processing type=${type} to=${to}`);

    // ── Get RESEND_API_KEY ────────────────────────────────────────────────────
    const RESEND_API_KEY =
      (globalThis as any).Deno?.env?.get("RESEND_API_KEY") ||
      (globalThis as any).process?.env?.RESEND_API_KEY ||
      "";

    if (!RESEND_API_KEY || RESEND_API_KEY === "your-resend-api-key-here") {
      console.error("[DETARA Email] RESEND_API_KEY not configured as Edge Function secret.");
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY not configured. Set it as a Supabase Edge Function secret: Dashboard → Settings → Edge Functions → Secrets → RESEND_API_KEY",
        }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const SITE_URL = (globalThis as any).Deno?.env?.get("NEXT_PUBLIC_SITE_URL") || "https://detara.store";

    // ── Verified detara.store sender addresses ────────────────────────────────
    const FROM_ORDERS    = "DETARA <orders@detara.store>";
    const FROM_CONCIERGE = "DETARA Concierge <concierge@detara.store>";
    const FROM_SUPPORT   = "DETARA Support <support@detara.store>";
    const FROM_GENERAL   = "DETARA <hello@detara.store>";

    // ── Internal DETARA recipients (configurable in one place) ────────────────
    // Both recipients receive all internal/business notifications
    const INTERNAL_RECIPIENTS = [
      "skadjewelsindiapvtltd@gmail.com",
      "hello@detara.store",
    ];

    // ── Helpers ──────────────────────────────────────────────────────────────
    function esc(str: string): string {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function infoRow(label: string, value: string) {
      if (!value || value === "undefined" || value === "null") return "";
      return `<tr>
        <td style="padding:10px 16px;background:#F4F2EE;border-bottom:1px solid #EAE6DE;width:35%;vertical-align:top;">
          <span style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6B6560;font-family:Arial,sans-serif;">${esc(label)}</span>
        </td>
        <td style="padding:10px 16px;background:#F4F2EE;border-bottom:1px solid #EAE6DE;vertical-align:top;">
          <span style="font-size:13px;color:#1C1917;font-family:Georgia,serif;">${value}</span>
        </td>
      </tr>`;
    }

    function infoTable(rows: string) {
      return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border-collapse:collapse;">${rows}</table>`;
    }

    function baseTemplate(content: string, preheader = "") {
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>DETARA</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:Georgia,'Times New Roman',serif;color:#1C1917;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAF8;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;">

  <!-- Header -->
  <tr><td style="text-align:center;padding:36px 40px 28px;border-bottom:1px solid #E8E4DC;background:#FFFFFF;">
    <h1 style="font-size:18px;font-weight:300;letter-spacing:0.5em;color:#1C1917;margin:0 0 8px;text-transform:uppercase;font-family:Georgia,serif;">DETARA</h1>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 8px;"><tr><td style="width:32px;height:1px;background:#C9A96E;font-size:0;line-height:0;">&nbsp;</td></tr></table>
    <p style="font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:#9CA3AF;margin:0;font-family:Arial,sans-serif;">European Fine Diamond Jewellery</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 40px;">${content}</td></tr>

  <!-- Footer -->
  <tr><td style="text-align:center;padding:24px 40px 32px;border-top:1px solid #E8E4DC;background:#F9F7F4;">
    <p style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#9CA3AF;margin:0 0 8px;font-family:Arial,sans-serif;">DETARA LTD · London, United Kingdom</p>
    <p style="font-size:11px;color:#9CA3AF;margin:0 0 4px;font-family:Arial,sans-serif;">
      <a href="mailto:hello@detara.store" style="color:#C9A96E;text-decoration:none;">hello@detara.store</a>
      &nbsp;&middot;&nbsp;
      <a href="${SITE_URL}" style="color:#C9A96E;text-decoration:none;">detara.store</a>
    </p>
    <p style="font-size:10px;color:#C0BAB2;margin:8px 0 0;font-family:Arial,sans-serif;">European Fine Diamond Jewellery</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
    }

    function btn(label: string, url: string) {
      return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0;">
<tr><td style="background:#1C1917;padding:14px 36px;">
<a href="${url}" style="color:#FAFAF8;text-decoration:none;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;font-family:Arial,sans-serif;">${esc(label)}</a>
</td></tr></table>`;
    }

    function divider() {
      return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;"><tr><td style="width:32px;height:1px;background:#C9A96E;font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
    }

    function sectionTitle(text: string) {
      return `<p style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#C9A96E;margin:0 0 6px;font-family:Arial,sans-serif;">${esc(text)}</p>`;
    }

    // ── Email payloads ────────────────────────────────────────────────────────
    const emails: Array<{ from: string; to: string[]; subject: string; html: string; reply_to?: string }> = [];
    const refNum = referenceNumber || `DET-${Date.now().toString().slice(-8)}`;
    const now = new Date().toUTCString();

    // ════════════════════════════════════════════════════════════════════════
    // TYPE 1: STANDARD ORDER CONFIRMATION
    // ════════════════════════════════════════════════════════════════════════
    if (type === "order_confirmation") {
      const pmLabel: Record<string, string> = {
        bank_transfer: "Bank Transfer",
        manual: "Concierge Payment",
        payment_link: "Secure Payment Link",
        invoice: "Invoice",
        card: "Card Payment",
      };
      const pmDisplay = pmLabel[orderPaymentMethod || ""] || orderPaymentMethod || "Bank Transfer";

      const itemsHtml = (orderItems || [])
        .map((item: any) => `<tr>
          <td style="padding:12px 0;border-bottom:1px solid #F0ECE4;font-size:13px;color:#1C1917;font-family:Georgia,serif;">
            ${esc(item.name)}${item.carat ? ` — ${esc(item.carat)}` : ""}${item.metal ? ` / ${esc(item.metal)}` : ""}
            ${item.quantity && item.quantity > 1 ? `<br><span style="font-size:11px;color:#9CA3AF;font-family:Arial,sans-serif;">Qty: ${item.quantity}</span>` : ""}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #F0ECE4;font-size:13px;color:#1C1917;text-align:right;font-family:Arial,sans-serif;">€${Number(item.price || 0).toLocaleString()}</td>
        </tr>`).join("");

      // ── Customer confirmation email ──
      emails.push({
        from: FROM_ORDERS,
        to: [to],
        subject: `Order Confirmed — #${orderNumber} | DETARA`,
        html: baseTemplate(`
${sectionTitle("Order Confirmation")}
<h2 style="font-size:24px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">Your Order is Confirmed</h2>
${divider()}
<p style="font-size:14px;color:#6B6560;line-height:1.8;margin:0 0 24px;font-family:Georgia,serif;">
  Dear ${esc(customerName || "Valued Customer")}, thank you for your order. Each DETARA piece is crafted with the utmost care and precision. We will keep you informed at every stage.
</p>

${infoTable(
  infoRow("Order Number", `<strong>#${esc(orderNumber)}</strong>`) +
  infoRow("Payment Method", esc(pmDisplay)) +
  (shippingAddress ? infoRow("Shipping To", esc(shippingAddress)) : "")
)}

<p style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#6B6560;margin:0 0 10px;font-family:Arial,sans-serif;">Order Items</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border-collapse:collapse;">
<thead><tr style="border-bottom:2px solid #1C1917;">
<th style="text-align:left;padding:8px 0;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#6B6560;font-weight:400;font-family:Arial,sans-serif;">Item</th>
<th style="text-align:right;padding:8px 0;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#6B6560;font-weight:400;font-family:Arial,sans-serif;">Price</th>
</tr></thead>
<tbody>${itemsHtml}</tbody>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr><td style="text-align:right;border-top:2px solid #1C1917;padding-top:12px;">
<p style="font-size:16px;color:#1C1917;margin:0;font-family:Arial,sans-serif;">Total: <strong>€${Number(orderTotal || 0).toLocaleString()}</strong></p>
</td></tr>
</table>

<div style="background:#F4F2EE;padding:16px 20px;margin-bottom:20px;">
<p style="font-size:12px;color:#6B6560;line-height:1.8;margin:0;font-family:Arial,sans-serif;">
  <strong style="color:#1C1917;">What happens next:</strong> Your piece will be crafted and dispatched within 3–5 weeks. You will receive tracking information once shipped. For any questions, contact us at <a href="mailto:orders@detara.store" style="color:#C9A96E;">orders@detara.store</a>.
</p>
</div>
${btn("View Our Collection", `${SITE_URL}/products`)}
`, `Order #${orderNumber} confirmed — thank you`),
      });

      // ── Internal DETARA notification ──
      emails.push({
        from: FROM_ORDERS,
        to: INTERNAL_RECIPIENTS,
        subject: `🛍 New Order #${orderNumber} — €${Number(orderTotal || 0).toLocaleString()} | DETARA`,
        html: baseTemplate(`
${sectionTitle("Internal — New Order")}
<h2 style="font-size:20px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">New Order Received</h2>
${divider()}
${infoTable(
  infoRow("Order Number", `<strong>#${esc(orderNumber)}</strong>`) +
  infoRow("Customer", esc(customerName || "Unknown")) +
  infoRow("Email", esc(to)) +
  infoRow("Total", `€${Number(orderTotal || 0).toLocaleString()}`) +
  infoRow("Payment Method", esc(pmDisplay)) +
  (shippingAddress ? infoRow("Ship To", esc(shippingAddress)) : "")
)}
<p style="font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#6B6560;margin:0 0 10px;font-family:Arial,sans-serif;">Items</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border-collapse:collapse;">
<tbody>${itemsHtml}</tbody>
</table>
${btn("View in Admin", `${SITE_URL}/admin/orders`)}
`, `New order #${orderNumber}`),
      });

    // ════════════════════════════════════════════════════════════════════════
    // TYPE 2: RESERVATION ("Reserve This Piece")
    // ════════════════════════════════════════════════════════════════════════
    } else if (type === "reservation") {
      const pmLabel: Record<string, string> = {
        bank_transfer: "Bank Transfer",
        payment_link: "Secure Payment Link",
        invoice: "Invoice",
        card: "Card Payment",
      };
      const pmDisplay = pmLabel[preferredPayment || ""] || preferredPayment || "To be arranged";

      // ── Customer acknowledgement ──
      emails.push({
        from: FROM_CONCIERGE,
        to: [to],
        subject: `Reservation Request Received — ${refNum} | DETARA`,
        html: baseTemplate(`
${sectionTitle("Reservation Request")}
<h2 style="font-size:24px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">Reservation Request Received</h2>
${divider()}
<p style="font-size:14px;color:#6B6560;line-height:1.8;margin:0 0 24px;font-family:Georgia,serif;">
  Dear ${esc(customerName || "there")}, we have received your reservation request. A DETARA concierge specialist will contact you within 24 hours to guide you through the next steps.
</p>
<div style="background:#FFF8EE;border-left:3px solid #C9A96E;padding:14px 18px;margin-bottom:20px;">
  <p style="font-size:12px;color:#6B6560;margin:0;font-family:Arial,sans-serif;line-height:1.7;">
    <strong style="color:#1C1917;">Please note:</strong> This is a reservation request, not a completed purchase. No payment has been taken. Our team will contact you to confirm availability and arrange payment.
  </p>
</div>
${infoTable(
  infoRow("Reference Number", `<strong>${esc(refNum)}</strong>`) +
  (productName ? infoRow("Product", esc(productName)) : "") +
  (productUrl ? infoRow("Product URL", `<a href="${esc(productUrl)}" style="color:#C9A96E;">${esc(productUrl)}</a>`) : "") +
  (productSku ? infoRow("SKU", esc(productSku)) : "") +
  (productPrice ? infoRow("Price", `€${Number(productPrice).toLocaleString()}`) : "") +
  (productMetal ? infoRow("Metal", esc(productMetal)) : "") +
  (productDiamond ? infoRow("Diamond", esc(productDiamond)) : "") +
  infoRow("Preferred Payment", esc(pmDisplay)) +
  (preferredContact ? infoRow("Preferred Contact", esc(preferredContact)) : "") +
  (phone ? infoRow("Phone / WhatsApp", esc(phone)) : "") +
  (message ? infoRow("Message", esc(message).replace(/\n/g, "<br>")) : "") +
  infoRow("Submitted", now)
)}
<p style="font-size:12px;color:#6B6560;line-height:1.8;margin-top:16px;font-family:Arial,sans-serif;">
  Questions? Contact us at <a href="mailto:concierge@detara.store" style="color:#C9A96E;">concierge@detara.store</a>
</p>
`, `Reservation request ${refNum} received`),
      });

      // ── Internal DETARA notification ──
      emails.push({
        from: FROM_CONCIERGE,
        to: INTERNAL_RECIPIENTS,
        reply_to: to,
        subject: `◇ New Reservation — ${esc(customerName || "Unknown")} | ${refNum} | DETARA`,
        html: baseTemplate(`
${sectionTitle("Internal — New Reservation")}
<h2 style="font-size:20px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">New Reservation Request</h2>
${divider()}
${infoTable(
  infoRow("Reference", `<strong>${esc(refNum)}</strong>`) +
  infoRow("Customer", esc(customerName || "Unknown")) +
  infoRow("Email", esc(to)) +
  (phone ? infoRow("Phone / WhatsApp", esc(phone)) : "") +
  (productName ? infoRow("Product", esc(productName)) : "") +
  (productUrl ? infoRow("Product URL", `<a href="${esc(productUrl)}" style="color:#C9A96E;">${esc(productUrl)}</a>`) : "") +
  (productSku ? infoRow("SKU", esc(productSku)) : "") +
  (productPrice ? infoRow("Price", `€${Number(productPrice).toLocaleString()}`) : "") +
  (productMetal ? infoRow("Metal", esc(productMetal)) : "") +
  (productDiamond ? infoRow("Diamond", esc(productDiamond)) : "") +
  infoRow("Preferred Payment", esc(pmDisplay)) +
  (preferredContact ? infoRow("Preferred Contact", esc(preferredContact)) : "") +
  (message ? infoRow("Message", esc(message).replace(/\n/g, "<br>")) : "") +
  infoRow("Submitted", now)
)}
${btn("View in Admin", `${SITE_URL}/admin/concierge`)}
`, `New reservation from ${customerName}`),
      });

    // ════════════════════════════════════════════════════════════════════════
    // TYPE 3: CUSTOM ORDER / CUSTOM ENQUIRY
    // ════════════════════════════════════════════════════════════════════════
    } else if (type === "custom_order" || type === "custom_request") {
      // ── Customer acknowledgement ──
      emails.push({
        from: FROM_CONCIERGE,
        to: [to],
        subject: `Custom Order Enquiry Received — ${refNum} | DETARA`,
        html: baseTemplate(`
${sectionTitle("Custom Order Enquiry")}
<h2 style="font-size:24px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">Custom Order Enquiry Received</h2>
${divider()}
<p style="font-size:14px;color:#6B6560;line-height:1.8;margin:0 0 24px;font-family:Georgia,serif;">
  Dear ${esc(customerName || "there")}, thank you for your custom jewellery enquiry. Our design team will review your request and a DETARA specialist will contact you within 24–48 hours.
</p>
<div style="background:#FFF8EE;border-left:3px solid #C9A96E;padding:14px 18px;margin-bottom:20px;">
  <p style="font-size:12px;color:#6B6560;margin:0;font-family:Arial,sans-serif;line-height:1.7;">
    <strong style="color:#1C1917;">Please note:</strong> This is an enquiry, not a confirmed order. No payment has been taken. Our team will contact you to discuss your requirements and provide a quote.
  </p>
</div>
${infoTable(
  infoRow("Reference Number", `<strong>${esc(refNum)}</strong>`) +
  (jewelryType ? infoRow("Piece Type", esc(jewelryType)) : "") +
  (productName ? infoRow("Reference / Product", esc(productName)) : "") +
  (productUrl ? infoRow("Reference URL", `<a href="${esc(productUrl)}" style="color:#C9A96E;">${esc(productUrl)}</a>`) : "") +
  (diamondPreference ? infoRow("Diamond Preference", esc(diamondPreference)) : "") +
  (productMetal ? infoRow("Metal", esc(productMetal)) : "") +
  (requestedSpecs ? infoRow("Specifications", esc(requestedSpecs).replace(/\n/g, "<br>")) : "") +
  (quantity ? infoRow("Quantity", esc(String(quantity))) : "") +
  (budget ? infoRow("Budget", esc(budget)) : "") +
  (preferredPayment ? infoRow("Preferred Payment", esc(preferredPayment)) : "") +
  (preferredContact ? infoRow("Preferred Contact", esc(preferredContact)) : "") +
  (phone ? infoRow("Phone / WhatsApp", esc(phone)) : "") +
  (message ? infoRow("Message", esc(message).replace(/\n/g, "<br>")) : "") +
  infoRow("Submitted", now)
)}
<p style="font-size:12px;color:#6B6560;line-height:1.8;margin-top:16px;font-family:Arial,sans-serif;">
  Questions? Contact us at <a href="mailto:concierge@detara.store" style="color:#C9A96E;">concierge@detara.store</a>
</p>
`, `Custom order enquiry ${refNum} received`),
      });

      // ── Internal DETARA notification ──
      emails.push({
        from: FROM_CONCIERGE,
        to: INTERNAL_RECIPIENTS,
        reply_to: to,
        subject: `✦ New Custom Order Enquiry — ${esc(customerName || "Unknown")} | ${refNum} | DETARA`,
        html: baseTemplate(`
${sectionTitle("Internal — Custom Order Enquiry")}
<h2 style="font-size:20px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">New Custom Order Enquiry</h2>
${divider()}
${infoTable(
  infoRow("Reference", `<strong>${esc(refNum)}</strong>`) +
  infoRow("Customer", esc(customerName || "Unknown")) +
  infoRow("Email", esc(to)) +
  (phone ? infoRow("Phone / WhatsApp", esc(phone)) : "") +
  (jewelryType ? infoRow("Piece Type", esc(jewelryType)) : "") +
  (productName ? infoRow("Reference / Product", esc(productName)) : "") +
  (productUrl ? infoRow("Reference URL", `<a href="${esc(productUrl)}" style="color:#C9A96E;">${esc(productUrl)}</a>`) : "") +
  (diamondPreference ? infoRow("Diamond Preference", esc(diamondPreference)) : "") +
  (productMetal ? infoRow("Metal", esc(productMetal)) : "") +
  (requestedSpecs ? infoRow("Specifications", esc(requestedSpecs).replace(/\n/g, "<br>")) : "") +
  (quantity ? infoRow("Quantity", esc(String(quantity))) : "") +
  (budget ? infoRow("Budget", esc(budget)) : "") +
  (preferredPayment ? infoRow("Preferred Payment", esc(preferredPayment)) : "") +
  (preferredContact ? infoRow("Preferred Contact", esc(preferredContact)) : "") +
  (message ? infoRow("Message", esc(message).replace(/\n/g, "<br>")) : "") +
  infoRow("Submitted", now)
)}
${btn("View in Admin", `${SITE_URL}/admin/concierge`)}
`, `New custom enquiry from ${customerName}`),
      });

    // ════════════════════════════════════════════════════════════════════════
    // TYPE 4: CONCIERGE LEAD (reservation/invoice_request/consultation/inquiry)
    // ════════════════════════════════════════════════════════════════════════
    } else if (type === "concierge_lead") {
      const typeLabels: Record<string, string> = {
        reservation: "Reservation",
        invoice_request: "Invoice Request",
        consultation: "Consultation",
        inquiry: "Enquiry",
      };
      const label = typeLabels[leadType || ""] || "Enquiry";

      // ── Customer confirmation ──
      emails.push({
        from: FROM_CONCIERGE,
        to: [to],
        subject: `${label} Received — ${refNum} | DETARA`,
        html: baseTemplate(`
${sectionTitle(label)}
<h2 style="font-size:24px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">${esc(label)} Received</h2>
${divider()}
<p style="font-size:14px;color:#6B6560;line-height:1.8;margin:0 0 24px;font-family:Georgia,serif;">
  Dear ${esc(customerName || "there")}, your ${label.toLowerCase()} has been received. Our concierge team will be in touch within 24 hours.
</p>
${leadType === "reservation" ? `<div style="background:#FFF8EE;border-left:3px solid #C9A96E;padding:14px 18px;margin-bottom:20px;">
  <p style="font-size:12px;color:#6B6560;margin:0;font-family:Arial,sans-serif;line-height:1.7;">
    <strong style="color:#1C1917;">Please note:</strong> This is a reservation request, not a completed purchase. No payment has been taken.
  </p>
</div>` : ""}
${infoTable(
  infoRow("Reference", `<strong>${esc(refNum)}</strong>`) +
  (productName ? infoRow("Product", esc(productName)) : "") +
  (productConfig ? infoRow("Configuration", esc(productConfig)) : "") +
  (productPrice ? infoRow("Price", `€${Number(productPrice).toLocaleString()}`) : "") +
  (phone ? infoRow("Phone / WhatsApp", esc(phone)) : "") +
  (message ? infoRow("Message", esc(message).replace(/\n/g, "<br>")) : "") +
  infoRow("Submitted", now)
)}
<p style="font-size:12px;color:#6B6560;line-height:1.8;margin-top:16px;font-family:Arial,sans-serif;">
  Questions? <a href="mailto:concierge@detara.store" style="color:#C9A96E;">concierge@detara.store</a>
</p>
`, `${label} ${refNum} received`),
      });

      // ── Internal notification ──
      emails.push({
        from: FROM_CONCIERGE,
        to: INTERNAL_RECIPIENTS,
        reply_to: to,
        subject: `New ${label} — ${esc(customerName || "Unknown")} | ${refNum} | DETARA`,
        html: baseTemplate(`
${sectionTitle(`Internal — New ${label}`)}
<h2 style="font-size:20px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">New ${esc(label)}</h2>
${divider()}
${infoTable(
  infoRow("Reference", `<strong>${esc(refNum)}</strong>`) +
  infoRow("Customer", esc(customerName || "Unknown")) +
  infoRow("Email", esc(to)) +
  (phone ? infoRow("Phone / WhatsApp", esc(phone)) : "") +
  (productName ? infoRow("Product", esc(productName)) : "") +
  (productConfig ? infoRow("Config", esc(productConfig)) : "") +
  (productPrice ? infoRow("Price", `€${Number(productPrice).toLocaleString()}`) : "") +
  (message ? infoRow("Message", esc(message).replace(/\n/g, "<br>")) : "") +
  infoRow("Submitted", now)
)}
${btn("View in Admin", `${SITE_URL}/admin/concierge`)}
`, `New ${label} from ${customerName}`),
      });

    // ════════════════════════════════════════════════════════════════════════
    // TYPE 5: CONTACT FORM
    // ════════════════════════════════════════════════════════════════════════
    } else if (type === "contact_form") {
      emails.push({
        from: FROM_SUPPORT,
        to: [to],
        subject: `We've received your message — DETARA`,
        html: baseTemplate(`
<div style="text-align:center;">
${sectionTitle("Message Received")}
<h2 style="font-size:24px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">Thank You, ${esc(customerName || "there")}</h2>
${divider()}
<p style="font-size:14px;color:#6B6560;line-height:1.8;max-width:400px;margin:0 auto 20px;font-family:Georgia,serif;">We have received your message and a member of our team will be in touch within 24 hours.</p>
<p style="font-size:12px;color:#9CA3AF;line-height:1.8;max-width:400px;margin:0 auto;font-family:Arial,sans-serif;">For urgent enquiries: <a href="mailto:hello@detara.store" style="color:#C9A96E;">hello@detara.store</a></p>
</div>`, `We've received your message`),
      });

      emails.push({
        from: FROM_SUPPORT,
        to: INTERNAL_RECIPIENTS,
        reply_to: to,
        subject: customSubject || `New Contact: ${esc(customerName || "Unknown")} | DETARA`,
        html: baseTemplate(`
${sectionTitle("Internal — Contact Form")}
<h2 style="font-size:20px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">New Contact Form Submission</h2>
${divider()}
${infoTable(
  infoRow("From", esc(customerName || "Unknown")) +
  infoRow("Email", esc(to)) +
  (message ? infoRow("Message", esc(message).replace(/\n/g, "<br>")) : "") +
  infoRow("Submitted", now)
)}
${btn("View in Admin", `${SITE_URL}/admin/inquiries`)}
`, `New contact from ${customerName}`),
      });

    // ════════════════════════════════════════════════════════════════════════
    // TYPE 6: NEWSLETTER SIGNUP
    // ════════════════════════════════════════════════════════════════════════
    } else if (type === "newsletter_signup") {
      emails.push({
        from: FROM_GENERAL,
        to: [to],
        subject: `Welcome to the DETARA Journal`,
        html: baseTemplate(`
<div style="text-align:center;">
${sectionTitle("Newsletter")}
<h2 style="font-size:24px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">You're on the list</h2>
${divider()}
<p style="font-size:14px;color:#6B6560;line-height:1.8;max-width:400px;margin:0 auto 28px;font-family:Georgia,serif;">Thank you for subscribing to the DETARA Journal. You'll receive private access to new collections, diamond education and selected releases.</p>
${btn("Explore Collection", `${SITE_URL}/products`)}
</div>`, "Welcome to the DETARA Journal"),
      });

    // ════════════════════════════════════════════════════════════════════════
    // TYPE 7: WELCOME (account created)
    // ════════════════════════════════════════════════════════════════════════
    } else if (type === "welcome") {
      emails.push({
        from: FROM_GENERAL,
        to: [to],
        subject: `Welcome to DETARA, ${esc(customerName || "there")}`,
        html: baseTemplate(`
<div style="text-align:center;">
${sectionTitle("Welcome")}
<h2 style="font-size:24px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">Welcome, ${esc(customerName || "there")}</h2>
${divider()}
<p style="font-size:14px;color:#6B6560;line-height:1.8;max-width:400px;margin:0 auto 28px;font-family:Georgia,serif;">Your DETARA account has been created. Explore our curated collection of certified diamond jewellery, each piece crafted to perfection.</p>
${btn("Explore Collection", `${SITE_URL}/products`)}
<p style="font-size:12px;color:#9CA3AF;margin-top:20px;font-family:Arial,sans-serif;">Questions? <a href="mailto:hello@detara.store" style="color:#C9A96E;">hello@detara.store</a></p>
</div>`, `Welcome to DETARA, ${customerName}`),
      });

    // ════════════════════════════════════════════════════════════════════════
    // TYPE 8: TEST EMAIL
    // ════════════════════════════════════════════════════════════════════════
    } else if (type === "test") {
      emails.push({
        from: FROM_GENERAL,
        to: [to],
        subject: `DETARA Email Test — ${new Date().toISOString()}`,
        html: baseTemplate(`
<div style="text-align:center;">
${sectionTitle("System Test")}
<h2 style="font-size:24px;font-weight:300;color:#1C1917;margin:0 0 6px;font-family:Georgia,serif;">Email Test Successful</h2>
${divider()}
<p style="font-size:14px;color:#6B6560;line-height:1.8;font-family:Georgia,serif;">This is a test email from DETARA. If you received this, your Resend integration is working correctly.</p>
<p style="font-size:12px;color:#9CA3AF;margin-top:16px;font-family:Arial,sans-serif;">Sent at: ${now}</p>
<p style="font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;">From: ${FROM_GENERAL}</p>
<p style="font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;">Domain: detara.store ✓</p>
</div>`, "DETARA email test"),
      });
    }

    // ── Send all emails via Resend ────────────────────────────────────────────
    const results = await Promise.all(
      emails.map(async (payload) => {
        const recipientStr = payload.to.join(", ");
        console.log(`[DETARA Email] Sending type=${type} from=${payload.from} to=${recipientStr}`);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error(`[DETARA Email] FAILED type=${type} from=${payload.from} to=${recipientStr} status=${res.status} error=${JSON.stringify(data)}`);
          return { ok: false, error: data?.message || `HTTP ${res.status}`, to: payload.to, from: payload.from };
        }
        console.log(`[DETARA Email] SENT type=${type} from=${payload.from} to=${recipientStr} id=${data.id}`);
        return { ok: true, id: data.id, to: payload.to, from: payload.from };
      })
    );

    const allOk = results.every((r) => r.ok);
    const failures = results.filter((r) => !r.ok);

    if (!allOk) {
      console.error(`[DETARA Email] ${failures.length} email(s) failed for type=${type}:`, JSON.stringify(failures));
    }

    return new Response(JSON.stringify({ success: allOk, results, emailCount: emails.length }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (error: any) {
    console.error("[DETARA Email Edge Function] Unhandled error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
