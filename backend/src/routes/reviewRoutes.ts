import { Router } from "express";
import { updateReviewHandler, deleteReviewHandler } from "../controllers/reviewController.js";
import { authenticate } from "../middleware/index.js";

const router = Router();

router.patch("/:id", authenticate, updateReviewHandler);
router.delete("/:id", authenticate, deleteReviewHandler);

export default router;
