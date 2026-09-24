import { Router } from "express";
import rateLimit from "express-rate-limit";
import prisma from "../config/prisma.js";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import cartRoutes from "./cartRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";
import addressRoutes from "./addressRoutes.js";
import orderRoutes from "./orderRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import { checkout } from "../controllers/orderController.js";
import { authenticate } from "../middleware/index.js";


const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Please try again later." },
});

router.get("/health", async (_req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.status(200).json({
      status: "ok",
      database: "connected",
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      database: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.use("/auth", authLimiter, authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/addresses", addressRoutes);
router.post("/checkout", authenticate, checkout);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);


export default router;
