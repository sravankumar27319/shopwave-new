import { Router } from "express";
import {
  listOrders,
  getOrder,
  cancelOrderHandler,
  updateOrderStatusHandler,
} from "../controllers/orderController.js";
import { authenticate, authorize } from "../middleware/index.js";

const router = Router();

router.use(authenticate);

router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/:id/cancel", cancelOrderHandler);
router.patch("/:id/status", authorize("ADMIN"), updateOrderStatusHandler);

export default router;
