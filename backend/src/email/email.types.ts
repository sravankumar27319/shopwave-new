export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string | undefined;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string | undefined;
  attachments?: EmailAttachment[] | undefined;
}

export interface OrderItemEmailData {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface AddressEmailData {
  fullName: string;
  addressLine1: string;
  addressLine2?: string | null | undefined;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderConfirmationEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderDate: Date | string;
  items: OrderItemEmailData[];
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  address: AddressEmailData;
  paymentStatus: string;
  orderStatus: string;
}

export interface PaymentSuccessEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  paymentAmount: number;
  paymentStatus: string;
  provider: string;
  paymentDate: Date | string;
}

export interface PaymentFailureEmailData {
  customerName?: string | undefined;
  customerEmail: string;
  orderNumber: string;
  paymentAmount: number;
  reason?: string | undefined;
}

export interface OrderCancelledEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  cancellationDate: Date | string;
  totalAmount: number;
}

export interface RefundEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  refundAmount: number;
  refundDate: Date | string;
  reason?: string | undefined;
}
