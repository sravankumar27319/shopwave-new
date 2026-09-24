import { Router } from "express";
import {
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
} from "../controllers/cartController.js";
import { authenticate } from "../middleware/index.js";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:id", updateCartItem);
router.delete("/items/:id", deleteCartItem);
router.delete("/", clearCart);

export default router;
