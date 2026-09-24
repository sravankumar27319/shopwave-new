import type { PaymentSuccessEmailData } from "../email.types.js";

export function generatePaymentSuccessEmail(data: PaymentSuccessEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedDate = new Date(data.paymentDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `ShopWave — Payment Successful for Order #${data.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { padding: 30px; }
    .receipt { background-color: #f1f5f9; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Payment Received</h1>
      <p style="margin: 6px 0 0; opacity: 0.9;">Thank you for your payment</p>
    </div>
    <div class="content">
      <p>Hello <strong>${escapeHtml(data.customerName)}</strong>,</p>
      <p>We have successfully received your payment for order <strong>#${escapeHtml(data.orderNumber)}</strong>.</p>
      
      <div class="receipt">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Order Number:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">#${escapeHtml(data.orderNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #059669; font-size: 16px;">$${data.paymentAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Payment Status:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #16a34a;">${escapeHtml(data.paymentStatus)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Payment Provider:</td>
            <td style="padding: 6px 0; text-align: right; text-transform: uppercase;">${escapeHtml(data.provider)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Date:</td>
            <td style="padding: 6px 0; text-align: right;">${formattedDate}</td>
          </tr>
        </table>
      </div>
      <p>Your order is confirmed and will be shipped soon.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ShopWave Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
SHOPWAVE — PAYMENT SUCCESSFUL
Order Number: #${data.orderNumber}
Amount Paid: $${data.paymentAmount.toFixed(2)}
Payment Status: ${data.paymentStatus}
Provider: ${data.provider}
Date: ${formattedDate}

Hello ${data.customerName},

Your payment has been successfully processed for order #${data.orderNumber}.
Thank you for shopping with ShopWave!
  `.trim();

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
