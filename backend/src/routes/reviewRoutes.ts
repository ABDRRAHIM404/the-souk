import express from "express";
import { deleteReview } from "../controllers/productController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();

router.delete("/:id", protect, restrictTo("tourist"), deleteReview);

export default router;
