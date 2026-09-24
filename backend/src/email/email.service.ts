import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";
import type {
  SendEmailOptions,
  OrderConfirmationEmailData,
  PaymentSuccessEmailData,
  PaymentFailureEmailData,
  OrderCancelledEmailData,
  RefundEmailData,
} from "./email.types.js";
import { generateOrderConfirmationEmail } from "./templates/order-confirmation.js";
import { generatePaymentSuccessEmail } from "./templates/payment-success.js";
import { generatePaymentFailedEmail } from "./templates/payment-failed.js";
import { generateOrderCancelledEmail } from "./templates/order-cancelled.js";
import { generateRefundEmail } from "./templates/refund.js";

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: any = null;
  private isConfigured = false;


  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const provider = process.env["EMAIL_PROVIDER"] || (process.env["SMTP_HOST"] ? "smtp" : "mock");
    const host = process.env["SMTP_HOST"];
    const port = parseInt(process.env["SMTP_PORT"] || "587", 10);
    const user = process.env["SMTP_USER"];
    const pass = process.env["SMTP_PASSWORD"];
    const secure = process.env["SMTP_SECURE"] === "true" || port === 465;

    if (provider === "smtp" && host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          // requireTLS ensures STARTTLS is used on port 587 (required by Gmail)
          requireTLS: !secure,
          auth: { user, pass },
        });
        this.isConfigured = true;
        logger.info("Email service initialized with SMTP transport", { host, port, secure });
      } catch (err: any) {
        logger.error("Failed to initialize SMTP transporter", { error: err.message });
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      logger.warn(
        "Email service is NOT configured (EMAIL_PROVIDER=smtp requires SMTP_HOST, SMTP_USER, SMTP_PASSWORD). " +
        "Emails will NOT be sent and emailSent will be reported as false."
      );
    }
  }

  public async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    const from = options.from || process.env["EMAIL_FROM"] || "ShopWave <noreply@shopwave.com>";

    try {
      if (this.isConfigured && this.transporter) {
        const info = await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments,
        });

        // getTestMessageUrl returns a URL only for Ethereal accounts; null for real SMTP
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info("Email sent successfully via SMTP", {
          to: options.to,
          subject: options.subject,
          messageId: info.messageId,
          ...(previewUrl ? { previewUrl } : {}),
        });
        if (previewUrl) {
          console.log(`\n📬 [TEST EMAIL PREVIEW]: ${previewUrl}\n`);
        }

        return { success: true, messageId: info.messageId };
      }

      // SMTP not configured — do NOT claim success so emailSent is honest
      logger.warn("[EMAIL NOT SENT] SMTP is not configured. Set EMAIL_PROVIDER=smtp with valid credentials.", {
        to: options.to,
        subject: options.subject,
      });
      return { success: false, error: "SMTP not configured" };
    } catch (error: any) {
      logger.error("Failed to dispatch email", {
        to: options.to,
        subject: options.subject,
        error: error?.message || "Unknown email error",
      });
      return { success: false, error: error?.message || "Unknown email error" };
    }
  }

  public async sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<EmailResult> {
    try {
      const { subject, html, text } = generateOrderConfirmationEmail(data);
      return await this.sendEmail({
        to: data.customerEmail,
        subject,
        html,
        text,
      });
    } catch (err: any) {
      logger.error("Error generating order confirmation email", {
        orderNumber: data.orderNumber,
        error: err.message,
      });
      return { success: false, error: err.message };
    }
  }

  public async sendPaymentSuccessEmail(data: PaymentSuccessEmailData): Promise<EmailResult> {
    try {
      const { subject, html, text } = generatePaymentSuccessEmail(data);
      return await this.sendEmail({
        to: data.customerEmail,
        subject,
        html,
        text,
      });
    } catch (err: any) {
      logger.error("Error generating payment success email", {
        orderNumber: data.orderNumber,
        error: err.message,
      });
      return { success: false, error: err.message };
    }
  }

  public async sendPaymentFailureEmail(data: PaymentFailureEmailData): Promise<EmailResult> {
    try {
      const { subject, html, text } = generatePaymentFailedEmail(data);
      return await this.sendEmail({
        to: data.customerEmail,
        subject,
        html,
        text,
      });
    } catch (err: any) {
      logger.error("Error generating payment failure email", {
        orderNumber: data.orderNumber,
        error: err.message,
      });
      return { success: false, error: err.message };
    }
  }

  public async sendOrderCancellationEmail(data: OrderCancelledEmailData): Promise<EmailResult> {
    try {
      const { subject, html, text } = generateOrderCancelledEmail(data);
      return await this.sendEmail({
        to: data.customerEmail,
        subject,
        html,
        text,
      });
    } catch (err: any) {
      logger.error("Error generating order cancellation email", {
        orderNumber: data.orderNumber,
        error: err.message,
      });
      return { success: false, error: err.message };
    }
  }

  public async sendRefundEmail(data: RefundEmailData): Promise<EmailResult> {
    try {
      const { subject, html, text } = generateRefundEmail(data);
      return await this.sendEmail({
        to: data.customerEmail,
        subject,
        html,
        text,
      });
    } catch (err: any) {
      logger.error("Error generating refund email", {
        orderNumber: data.orderNumber,
        error: err.message,
      });
      return { success: false, error: err.message };
    }
  }
}

export const emailService = new EmailService();
export default emailService;
