import express from "express";
import {
  getMyReviews,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/me/reviews", getMyReviews);
router.post("/wishlist/:productId", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);

export default router;
