import type { OrderCancelledEmailData } from "../email.types.js";

export function generateOrderCancelledEmail(data: OrderCancelledEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedDate = new Date(data.cancellationDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `ShopWave — Order #${data.orderNumber} Cancelled`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { padding: 30px; }
    .card { background-color: #f1f5f9; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Order Cancelled</h1>
      <p style="margin: 6px 0 0; opacity: 0.9;">Order #${escapeHtml(data.orderNumber)}</p>
    </div>
    <div class="content">
      <p>Hello <strong>${escapeHtml(data.customerName)}</strong>,</p>
      <p>Your order <strong>#${escapeHtml(data.orderNumber)}</strong> has been successfully cancelled.</p>
      
      <div class="card">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Order Number:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">#${escapeHtml(data.orderNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Order Total:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">$${data.totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Cancellation Date:</td>
            <td style="padding: 6px 0; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Status:</td>
            <td style="padding: 6px 0; text-align: right; color: #dc2626; font-weight: 600;">CANCELLED</td>
          </tr>
        </table>
      </div>
      <p style="font-size: 14px; color: #64748b;">If any items were reserved for this order, they have been released back into inventory.</p>
      <p style="font-size: 14px; color: #64748b;">If you were charged for this order, your refund is being processed separately according to our refund policy.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ShopWave Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
SHOPWAVE — ORDER CANCELLED
Order Number: #${data.orderNumber}
Total: $${data.totalAmount.toFixed(2)}
Date: ${formattedDate}

Hello ${data.customerName},

Your order #${data.orderNumber} has been cancelled.
If you have any questions, please contact support@shopwave.com.
  `.trim();

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
