import { Request, Response } from "express";
import Review from "../models/Review";
import User from "../models/User";
import Product from "../models/Product";

// @desc    Get all reviews written by the logged-in tourist
// @route   GET /api/users/me/reviews
// @access  Private (tourist)
export const getMyReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    const reviews = await Review.find({ reviewer: userId })
      .populate("product", "name images price category")
      .sort({ createdAt: -1 })
      .lean();

    res.json(reviews);
  } catch (error) {
    console.error("getMyReviews error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private (tourist)
export const addToWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { productId } = req.params;

    await User.updateOne(
      { _id: userId },
      { $addToSet: { wishlist: productId } }
    );

    res.json({ message: "Added to wishlist" });
  } catch (error) {
    console.error("addToWishlist error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private (tourist)
export const removeFromWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { productId } = req.params;

    await User.updateOne(
      { _id: userId },
      { $pull: { wishlist: productId } }
    );

    res.json({ message: "Removed from wishlist" });
  } catch (error) {
    console.error("removeFromWishlist error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};
