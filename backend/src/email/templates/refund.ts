import type { RefundEmailData } from "../email.types.js";

export function generateRefundEmail(data: RefundEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedDate = new Date(data.refundDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `ShopWave — Refund Processed for Order #${data.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { padding: 30px; }
    .card { background-color: #f1f5f9; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Refund Processed</h1>
      <p style="margin: 6px 0 0; opacity: 0.9;">Order #${escapeHtml(data.orderNumber)}</p>
    </div>
    <div class="content">
      <p>Hello <strong>${escapeHtml(data.customerName)}</strong>,</p>
      <p>A refund of <strong>$${data.refundAmount.toFixed(2)}</strong> has been processed for order <strong>#${escapeHtml(data.orderNumber)}</strong>.</p>
      
      <div class="card">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Order Number:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">#${escapeHtml(data.orderNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Refund Amount:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #4f46e5; font-size: 16px;">$${data.refundAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Refund Date:</td>
            <td style="padding: 6px 0; text-align: right;">${formattedDate}</td>
          </tr>
          ${
            data.reason
              ? `<tr>
            <td style="padding: 6px 0; color: #64748b;">Reason:</td>
            <td style="padding: 6px 0; text-align: right;">${escapeHtml(data.reason)}</td>
          </tr>`
              : ""
          }
        </table>
      </div>
      <p style="font-size: 14px; color: #64748b;">The refunded amount should reflect on your original payment method within 5-10 business days depending on your bank.</p>
      <p style="font-size: 14px; color: #64748b;">If you have questions, please reach out to support@shopwave.com.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ShopWave Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
SHOPWAVE — REFUND PROCESSED
Order Number: #${data.orderNumber}
Refund Amount: $${data.refundAmount.toFixed(2)}
Refund Date: ${formattedDate}
${data.reason ? `Reason: ${data.reason}\n` : ""}
Hello ${data.customerName},

Your refund for order #${data.orderNumber} in the amount of $${data.refundAmount.toFixed(2)} has been processed.
The refund will appear on your original payment method within 5-10 business days.
  `.trim();

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
