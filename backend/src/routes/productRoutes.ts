import express from "express";
import {
  appendProductImages,
  createProduct,
  createProductReview,
  deleteProduct,
  getProductById,
  getProductReviews,
  getProducts,
  updateProduct,
  uploadProductImages,
} from "../controllers/productController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", protect, restrictTo("coop_owner"), uploadProductImages.array("images", 6), createProduct);
router.put("/:id", protect, restrictTo("coop_owner"), updateProduct);
router.delete("/:id", protect, restrictTo("coop_owner"), deleteProduct);
router.post("/:id/images", protect, restrictTo("coop_owner"), uploadProductImages.array("images", 6), appendProductImages);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, restrictTo("tourist"), createProductReview);

export default router;
