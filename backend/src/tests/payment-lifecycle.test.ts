import crypto from "crypto";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import prisma from "../config/prisma.js";
import {
  createPayment,
  getPaymentStatus,
  verifyPayment,
  failPayment,
  handleWebhook,
  processRefund,
} from "../payments/payment.service.js";
import { createOrder, cancelOrder, updateOrderStatus } from "../services/orderService.js";
import {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../services/addressService.js";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from "../services/reviewService.js";
import { mockPaymentProvider } from "../payments/providers/mock.provider.js";
import emailService from "../email/email.service.js";

async function runTests() {
  console.log("\n=======================================================");
  console.log("SHOPWAVE — PAYMENT, CHECKOUT & REVIEW COMPREHENSIVE TESTS");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}`);
      console.error(`       Error: ${err.message}`);
      if (err.stack) console.error(err.stack);
      failed++;
    }
  }

  // Setup test users & products in database
  const testUserAEmail = `test_user_a_${Date.now()}@shopwave.test`;
  const testUserBEmail = `test_user_b_${Date.now()}@shopwave.test`;

  const userA = await prisma.user.create({
    data: {
      name: "Customer Alice",
      email: testUserAEmail,
      passwordHash: "hash_test_alice",
      role: "CUSTOMER",
    },
  });

  const userB = await prisma.user.create({
    data: {
      name: "Customer Bob",
      email: testUserBEmail,
      passwordHash: "hash_test_bob",
      role: "CUSTOMER",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: `admin_${Date.now()}@shopwave.test`,
      passwordHash: "hash_admin",
      role: "ADMIN",
    },
  });

  const addressA = await prisma.address.create({
    data: {
      userId: userA.id,
      fullName: "Alice Smith",
      phone: "+1234567890",
      addressLine1: "123 Main St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "USA",
      isDefault: true,
    },
  });

  const addressB = await prisma.address.create({
    data: {
      userId: userB.id,
      fullName: "Bob Jones",
      phone: "+1987654321",
      addressLine1: "456 Market St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "USA",
      isDefault: true,
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: "test-electronics" },
    create: {
      name: "Test Electronics",
      slug: "test-electronics",
      description: "Category for test products",
    },
    update: {},
  });

  const product = await prisma.product.create({
    data: {
      name: "ShopWave Wireless Headphones",
      slug: `shopwave-headphones-${Date.now()}`,
      categoryId: category.id,
      price: 100.0,
      originalPrice: 120.0,
      rating: 4.8,
      stock: 50,
      sku: `SKU-HEADPHONES-${Date.now()}`,
      isActive: true,
    },
  });

  async function createTestCartAndOrder(userId: string, addressId: string, quantity = 2) {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity,
      },
    });

    return await createOrder(userId, { addressId });
  }

  // TEST 1: Address API Integration
  await test("1. Address API: create, list, set default, and update address", async () => {
    const newAddr = await createAddress(userA.id, {
      fullName: "Alice Work Office",
      phone: "+1555123456",
      addressLine1: "789 Work Blvd",
      city: "San Jose",
      state: "CA",
      postalCode: "95113",
      country: "USA",
      isDefault: false,
    });
    assert.equal(newAddr.fullName, "Alice Work Office");

    const list = await getAddresses(userA.id);
    assert(list.length >= 2, "Alice should have at least 2 addresses");

    await setDefaultAddress(userA.id, newAddr.id);
    const updatedDefault = await prisma.address.findUniqueOrThrow({ where: { id: newAddr.id } });
    assert.equal(updatedDefault.isDefault, true);

    await updateAddress(userA.id, newAddr.id, { addressLine1: "800 Updated Blvd" });
    const checkUpdated = await prisma.address.findUniqueOrThrow({ where: { id: newAddr.id } });
    assert.equal(checkUpdated.addressLine1, "800 Updated Blvd");
  });

  // TEST 2: Create Order and Verify Initial Status
  let testOrder1: any;
  await test("2. Create order: status must be PENDING with payment in PENDING", async () => {
    testOrder1 = await createTestCartAndOrder(userA.id, addressA.id, 1);
    assert.equal(testOrder1.status, "PENDING");
    assert.equal(testOrder1.paymentStatus, "PENDING");
    assert(testOrder1.totalAmount > 0, "Total amount should be > 0");
  });

  // TEST 3: Payment Session Creation
  let paymentSession1: any;
  await test("3. Create payment session: amount is trusted strictly from DB", async () => {
    paymentSession1 = await createPayment(userA.id, testOrder1.id);
    assert.equal(paymentSession1.orderId, testOrder1.id);
    assert.equal(paymentSession1.amount, testOrder1.totalAmount);
    assert.equal(paymentSession1.provider, "mock");
    assert(paymentSession1.providerPaymentId.startsWith("mock_pay_"));
  });

  // TEST 4: Payment Status Retrieval
  await test("4. Get payment status: returns safe payment metadata", async () => {
    const status = await getPaymentStatus(userA.id, testOrder1.id);
    assert.equal(status.orderId, testOrder1.id);
    assert.equal(status.status, "PENDING");
    assert.equal(status.orderStatus, "PENDING");
    assert.equal(status.amount, testOrder1.totalAmount);
  });

  // TEST 5: Payment Verification & Atomic Confirmation
  await test("5. Payment verification: updates Payment to SUCCESS and Order to CONFIRMED atomically", async () => {
    const verifyResult = await verifyPayment(userA.id, {
      orderId: testOrder1.id,
      providerPaymentId: paymentSession1.providerPaymentId,
    });

    assert.equal(verifyResult.success, true);
    assert.equal(verifyResult.status, "SUCCESS");

    // Check DB state
    const dbOrder = await prisma.order.findUnique({
      where: { id: testOrder1.id },
      include: { payment: true },
    });
    assert.equal(dbOrder?.status, "CONFIRMED");
    assert.equal(dbOrder?.payment?.status, "SUCCESS");
  });

  // TEST 6: Idempotent Payment Verification
  await test("6. Idempotent payment verification: repeated verification returns SUCCESS without error", async () => {
    const repeated = await verifyPayment(userA.id, {
      orderId: testOrder1.id,
      providerPaymentId: paymentSession1.providerPaymentId,
    });
    assert.equal(repeated.success, true);
    assert.equal(repeated.status, "SUCCESS");
  });

  // TEST 7: Payment Failure Flow
  let testOrder2: any;
  await test("7. Payment failure: payment marked FAILED and order remains unconfirmed", async () => {
    testOrder2 = await createTestCartAndOrder(userA.id, addressA.id, 1);
    const session = await createPayment(userA.id, testOrder2.id);

    const failResult = await verifyPayment(userA.id, {
      orderId: testOrder2.id,
      providerPaymentId: session.providerPaymentId,
      payload: { simulateFailure: true },
    });

    assert.equal(failResult.success, false);
    assert.equal(failResult.status, "FAILED");

    const dbOrder = await prisma.order.findUnique({
      where: { id: testOrder2.id },
      include: { payment: true },
    });
    assert.equal(dbOrder?.status, "PENDING");
    assert.equal(dbOrder?.payment?.status, "FAILED");
  });

  // TEST 8: Webhook Signature Verification - Valid
  let testOrder3: any;
  await test("8. Webhook: valid HMAC signature confirms payment and order", async () => {
    testOrder3 = await createTestCartAndOrder(userA.id, addressA.id, 1);
    const session = await createPayment(userA.id, testOrder3.id);

    const payload = JSON.stringify({
      event: "payment.succeeded",
      data: {
        orderId: testOrder3.id,
        providerPaymentId: session.providerPaymentId,
        amount: testOrder3.totalAmount,
      },
    });

    const signature = crypto
      .createHmac("sha256", "shopwave-mock-secret-key")
      .update(payload)
      .digest("hex");

    const webhookResult = await handleWebhook(payload, signature, JSON.parse(payload));
    assert.equal(webhookResult.received, true);
    assert.equal(webhookResult.status, "SUCCESS");

    const dbOrder = await prisma.order.findUnique({
      where: { id: testOrder3.id },
      include: { payment: true },
    });
    assert.equal(dbOrder?.status, "CONFIRMED");
    assert.equal(dbOrder?.payment?.status, "SUCCESS");
  });

  // TEST 9: Webhook Signature Verification - Invalid Signature Rejection
  await test("9. Webhook: invalid HMAC signature is rejected with error", async () => {
    const payload = JSON.stringify({
      event: "payment.succeeded",
      data: { orderId: "fake-order", providerPaymentId: "fake-pay", amount: 100 },
    });

    let threw = false;
    try {
      await handleWebhook(payload, "bad_signature_12345", JSON.parse(payload));
    } catch (err: any) {
      threw = true;
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Invalid webhook signature/i);
    }
    assert.equal(threw, true, "Invalid webhook must throw 400");
  });

  // TEST 10: Duplicate Webhook Idempotency
  await test("10. Webhook idempotency: duplicate webhook event acknowledged without re-processing", async () => {
    const payload = JSON.stringify({
      event: "payment.succeeded",
      data: {
        orderId: testOrder3.id,
        providerPaymentId: "mock_pay_test",
        amount: testOrder3.totalAmount,
      },
    });

    const signature = crypto
      .createHmac("sha256", "shopwave-mock-secret-key")
      .update(payload)
      .digest("hex");

    const duplicateResult = await handleWebhook(payload, signature, JSON.parse(payload));
    assert.equal(duplicateResult.received, true);
    assert.equal(duplicateResult.status, "IDEMPOTENT_SUCCESS");
  });

  // TEST 11: Order Cancellation & Stock Restoration
  await test("11. Order cancellation: updates status to CANCELLED and restores product stock", async () => {
    const initialProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    const initialStock = initialProduct.stock;

    const cancelableOrder = await createTestCartAndOrder(userA.id, addressA.id, 3);
    const afterOrderProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(afterOrderProduct.stock, initialStock - 3);

    const cancelledOrder = await cancelOrder(userA.id, cancelableOrder.id);
    assert.equal(cancelledOrder.status, "CANCELLED");

    const afterCancelProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(afterCancelProduct.stock, initialStock);
  });

  // TEST 12: Refund Processing Architecture
  await test("12. Refund architecture: verified provider refund updates Payment to REFUNDED and Order to CANCELLED", async () => {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { orderId: testOrder1.id } });
    const refundResult = await processRefund(adminUser.id, payment.id, "Customer requested return", true);

    assert.equal(refundResult.success, true);
    assert.equal(refundResult.status, "REFUNDED");

    const dbPayment = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    const dbOrder = await prisma.order.findUniqueOrThrow({ where: { id: testOrder1.id } });
    assert.equal(dbPayment.status, "REFUNDED");
    assert.equal(dbOrder.status, "CANCELLED");
  });

  // TEST 13: Review API Flow
  await test("13. Review API: create review with 1-5 rating, retrieve reviews, update, and delete", async () => {
    const review = await createReview(userA.id, product.id, {
      rating: 5,
      comment: "Outstanding sound quality and deep bass! Highly recommend.",
    });
    assert.equal(review.rating, 5);
    assert.equal(review.comment, "Outstanding sound quality and deep bass! Highly recommend.");

    const productReviews = await getProductReviews(product.id);
    assert(productReviews.length > 0, "Product should have reviews");
    assert.equal(productReviews[0]?.user.name, "Customer Alice");

    // Update review
    await updateReview(userA.id, review.id, { rating: 4, comment: "Updated: Great sound, slightly tight fit." });
    const updatedRev = await prisma.review.findUniqueOrThrow({ where: { id: review.id } });
    assert.equal(updatedRev.rating, 4);

    // Delete review
    await deleteReview(userA.id, review.id);
    const deletedRev = await prisma.review.findUnique({ where: { id: review.id } });
    assert.equal(deletedRev, null);
  });

  // TEST 14: Ownership Security: User A cannot access User B's order/payment
  await test("14. Security: User A cannot access or create payments for User B's order", async () => {
    const orderB = await createTestCartAndOrder(userB.id, addressB.id, 1);

    let threw = false;
    try {
      await createPayment(userA.id, orderB.id);
    } catch (err: any) {
      threw = true;
      assert.equal(err.statusCode, 404);
    }
    assert.equal(threw, true, "User A must not be allowed to access User B order");

    let statusThrew = false;
    try {
      await getPaymentStatus(userA.id, orderB.id, "CUSTOMER");
    } catch (err: any) {
      statusThrew = true;
      assert.equal(err.statusCode, 404);
    }
    assert.equal(statusThrew, true, "User A must not be allowed to get User B payment status");
  });

  // TEST 15: Order Lifecycle Protection: Customer cannot mark order DELIVERED
  await test("15. Security: Customer cannot update order status; only ADMIN can transition lifecycle", async () => {
    const customerOrder = await createTestCartAndOrder(userA.id, addressA.id, 1);

    let customerThrew = false;
    try {
      await updateOrderStatus(customerOrder.id, "DELIVERED", "CUSTOMER");
    } catch (err: any) {
      customerThrew = true;
      assert.equal(err.statusCode, 403);
    }
    assert.equal(customerThrew, true, "Customer must be forbidden from updating status");

    // Admin updates through valid lifecycle: PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
    const step1 = await updateOrderStatus(customerOrder.id, "CONFIRMED", "ADMIN");
    assert.equal(step1.status, "CONFIRMED");

    const step2 = await updateOrderStatus(customerOrder.id, "PROCESSING", "ADMIN");
    assert.equal(step2.status, "PROCESSING");

    const step3 = await updateOrderStatus(customerOrder.id, "SHIPPED", "ADMIN");
    assert.equal(step3.status, "SHIPPED");

    const step4 = await updateOrderStatus(customerOrder.id, "DELIVERED", "ADMIN");
    assert.equal(step4.status, "DELIVERED");

    // Terminal check: Delivered order cannot transition further or be cancelled
    let cancelDeliveredThrew = false;
    try {
      await cancelOrder(userA.id, customerOrder.id);
    } catch (err: any) {
      cancelDeliveredThrew = true;
      assert.equal(err.statusCode, 400);
    }
    assert.equal(cancelDeliveredThrew, true, "Delivered order cannot be cancelled");
  });

  // TEST 16: Email Resilience: Email failure does not break or rollback database transactions
  await test("16. Email resilience: dispatch failures do not crash payment or rollback confirmation", async () => {
    const emailOrder = await createTestCartAndOrder(userA.id, addressA.id, 1);
    const session = await createPayment(userA.id, emailOrder.id);

    // Temporarily mock sendEmail to fail
    const originalSend = emailService.sendEmail;
    emailService.sendEmail = async () => {
      throw new Error("Simulated SMTP network outage");
    };

    try {
      const verifyResult = await verifyPayment(userA.id, {
        orderId: emailOrder.id,
        providerPaymentId: session.providerPaymentId,
      });

      assert.equal(verifyResult.success, true);
      assert.equal(verifyResult.status, "SUCCESS");

      // Verify order is still CONFIRMED in DB despite email failure
      const confirmedDbOrder = await prisma.order.findUniqueOrThrow({
        where: { id: emailOrder.id },
      });
      assert.equal(confirmedDbOrder.status, "CONFIRMED");
    } finally {
      emailService.sendEmail = originalSend;
    }
  });

  console.log("\n=======================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("=======================================================\n");

  // Clean up test data
  try {
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: { in: [userA.id, userB.id] } } },
    });
    await prisma.orderItem.deleteMany({
      where: { order: { userId: { in: [userA.id, userB.id] } } },
    });
    await prisma.payment.deleteMany({
      where: { order: { userId: { in: [userA.id, userB.id] } } },
    });
    await prisma.order.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    });
    await prisma.address.deleteMany({
      where: { userId: { in: [userA.id, userB.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id, adminUser.id] } },
    });
    await prisma.product.deleteMany({ where: { id: product.id } });
  } catch (err: any) {
    console.warn("Cleanup notice:", err.message);
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
