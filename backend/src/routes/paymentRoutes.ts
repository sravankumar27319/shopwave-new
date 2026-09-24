import { Router } from "express";
import {
  createPaymentHandler,
  getPaymentStatusHandler,
  verifyPaymentHandler,
  failPaymentHandler,
  webhookHandler,
  refundPaymentHandler,
} from "../controllers/paymentController.js";
import { authenticate, authorize } from "../middleware/index.js";

const router = Router();

// Public webhook route (signature-verified in service)
router.post("/webhook", webhookHandler);

// Authenticated user routes
router.post("/create", authenticate, createPaymentHandler);
router.post("/verify", authenticate, verifyPaymentHandler);
router.post("/fail", authenticate, failPaymentHandler);
router.get("/:orderId", authenticate, getPaymentStatusHandler);

// Admin-only refund route
router.post("/:paymentId/refund", authenticate, authorize("ADMIN"), refundPaymentHandler);

export default router;
