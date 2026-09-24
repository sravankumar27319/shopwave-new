import type { PaymentFailureEmailData } from "../email.types.js";

export function generatePaymentFailedEmail(data: PaymentFailureEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `ShopWave — Payment Failed for Order #${data.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { padding: 30px; }
    .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Payment Unsuccessful</h1>
      <p style="margin: 6px 0 0; opacity: 0.9;">Action required for order #${escapeHtml(data.orderNumber)}</p>
    </div>
    <div class="content">
      <p>Hello${data.customerName ? ` <strong>${escapeHtml(data.customerName)}</strong>` : ""},</p>
      <p>We were unable to process the payment of <strong>$${data.paymentAmount.toFixed(2)}</strong> for order <strong>#${escapeHtml(data.orderNumber)}</strong>.</p>
      
      <div class="alert">
        <p style="margin: 0; font-weight: 600; color: #991b1b;">Reason for failure:</p>
        <p style="margin: 4px 0 0; color: #b91c1c; font-size: 14px;">${escapeHtml(data.reason || "The payment provider was unable to authorize the transaction.")}</p>
      </div>

      <h3 style="font-size: 16px; color: #0f172a;">What should you do next?</h3>
      <ul style="padding-left: 20px; font-size: 14px; line-height: 1.6; color: #475569;">
        <li>Check your card details, billing address, or payment method balance.</li>
        <li>Log in to your ShopWave account and retry the payment for order #${escapeHtml(data.orderNumber)}.</li>
        <li>Contact your bank if the issue persists or try an alternate payment method.</li>
      </ul>
      <p style="font-size: 14px; color: #64748b; margin-top: 20px;">If you have any questions or need assistance, please contact our support team at support@shopwave.com.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ShopWave Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
SHOPWAVE — PAYMENT FAILED
Order Number: #${data.orderNumber}
Amount: $${data.paymentAmount.toFixed(2)}

Hello${data.customerName ? ` ${data.customerName}` : ""},

We were unable to process your payment for order #${data.orderNumber}.
Reason: ${data.reason || "The payment provider was unable to authorize the transaction."}

Please log into your ShopWave account to retry your payment or try an alternate payment method.
If you need assistance, please reach out to support@shopwave.com.
  `.trim();

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
