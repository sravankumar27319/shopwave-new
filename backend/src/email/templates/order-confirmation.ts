import type { OrderConfirmationEmailData } from "../email.types.js";

export function generateOrderConfirmationEmail(data: OrderConfirmationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedDate = new Date(data.orderDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
        <strong>${escapeHtml(item.productName)}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 14px; color: #64748b;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 14px; color: #64748b;">
        $${item.unitPrice.toFixed(2)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 14px; font-weight: 600; color: #0f172a;">
        $${item.subtotal.toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  const itemsText = data.items
    .map(
      (item) =>
        `- ${item.productName} x ${item.quantity} @ $${item.unitPrice.toFixed(2)} = $${item.subtotal.toFixed(2)}`
    )
    .join("\n");

  const address = data.address;
  const addressLine2 = address.addressLine2 ? `${address.addressLine2}, ` : "";
  const addressFormatted = `${address.fullName}\n${address.addressLine1}\n${addressLine2}${address.city}, ${address.state} ${address.postalCode}\n${address.country}`;

  const subject = `ShopWave — Order Confirmed #${data.orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #334155; }
    .wrapper { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 30px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #dcfce7; color: #15803d; }
    .summary-card { background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 20px 0; }
    .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .grand-total { border-top: 2px solid #e2e8f0; margin-top: 8px; padding-top: 8px; font-size: 18px; font-weight: 700; color: #0f172a; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>ShopWave</h1>
      <p>Thank you for your order!</p>
    </div>
    <div class="content">
      <p style="font-size: 16px;">Hello <strong>${escapeHtml(data.customerName)}</strong>,</p>
      <p>Your order <strong>#${escapeHtml(data.orderNumber)}</strong> has been confirmed and is now being processed.</p>
      
      <div class="summary-card">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #64748b;">Order Number:</span>
          <strong>#${escapeHtml(data.orderNumber)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #64748b;">Order Date:</span>
          <span>${formattedDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #64748b;">Payment Status:</span>
          <span class="badge">${escapeHtml(data.paymentStatus)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">Order Status:</span>
          <span class="badge">${escapeHtml(data.orderStatus)}</span>
        </div>
      </div>
      <h3 style="margin-top: 24px; font-size: 16px; color: #0f172a;">Order Items</h3>
      <table class="table">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="padding: 10px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase;">Product</th>
            <th style="padding: 10px; text-align: center; font-size: 12px; color: #64748b; text-transform: uppercase;">Qty</th>
            <th style="padding: 10px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase;">Price</th>
            <th style="padding: 10px; text-align: right; font-size: 12px; color: #64748b; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="margin-top: 20px; padding: 16px; background-color: #f8fafc; border-radius: 6px;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Subtotal:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">$${data.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Shipping:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">$${data.shippingAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Estimated Tax:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">$${data.taxAmount.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 2px solid #e2e8f0;">
            <td style="padding: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #0f172a;">Total Amount:</td>
            <td style="padding: 8px 0 0 0; text-align: right; font-size: 16px; font-weight: 700; color: #2563eb;">$${data.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <h3 style="margin-top: 24px; font-size: 16px; color: #0f172a;">Shipping Address</h3>
      <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.5; color: #475569;">
        <strong>${escapeHtml(address.fullName)}</strong><br>
        ${escapeHtml(address.addressLine1)}<br>
        ${address.addressLine2 ? `${escapeHtml(address.addressLine2)}<br>` : ""}
        ${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}<br>
        ${escapeHtml(address.country)}
      </div>
    </div>
    <div class="footer">
      <p>If you have questions about your order, please contact our support team at support@shopwave.com.</p>
      <p>&copy; ${new Date().getFullYear()} ShopWave Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
SHOPWAVE — ORDER CONFIRMED
Order Number: #${data.orderNumber}
Date: ${formattedDate}

Hello ${data.customerName},

Thank you for your order! Your order has been confirmed and is now being processed.

ORDER SUMMARY:
${itemsText}

Subtotal: $${data.subtotal.toFixed(2)}
Shipping: $${data.shippingAmount.toFixed(2)}
Tax: $${data.taxAmount.toFixed(2)}
Total: $${data.totalAmount.toFixed(2)}

SHIPPING ADDRESS:
${addressFormatted}

Payment Status: ${data.paymentStatus}
Order Status: ${data.orderStatus}

If you have questions, please reach out to support@shopwave.com.
  `.trim();

  return { subject, html, text };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
