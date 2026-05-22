import { Request, Response } from "express";
import multer from "multer";
import type { SortOrder } from "mongoose";
import Product from "../models/Product";
import Review from "../models/Review";
import Cooperative from "../models/Cooperative";
import { AuthRequest } from "../middleware/authMiddleware";

export const uploadProductImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
});

const filesToDataUrls = (files: Express.Multer.File[] = []) =>
  files.map((file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`);

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.cooperative) filter.cooperative = req.query.cooperative;

    if (req.query.region) {
      const coops = await Cooperative.find({ "location.region": req.query.region }).select("_id").lean();
      filter.cooperative = { $in: coops.map((coop) => coop._id) };
    }

    const sort: Record<string, SortOrder> =
      req.query.sort === "price_asc"
        ? { price: 1 }
        : req.query.sort === "price_desc"
          ? { price: -1 }
          : { createdAt: -1 };

    const [data, total] = await Promise.all([
      Product.find(filter)
        .populate("cooperative", "name logo location city region")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("cooperative", "name logo location city region isCertified")
      .lean();

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const cooperative = user.cooperativeId;
    if (!cooperative) {
      res.status(403).json({ message: "No cooperative linked to this account" });
      return;
    }

    const product = await Product.create({
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock ?? 1),
      fairTradeCertified: req.body.fairTradeCertified !== "false",
      images: filesToDataUrls(req.files as Express.Multer.File[]),
      cooperative,
      postedBy: user._id,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (product.postedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Not authorized to update this product" });
      return;
    }

    const updates = {
      ...req.body,
      ...(req.body.price !== undefined ? { price: Number(req.body.price) } : {}),
      ...(req.body.stock !== undefined ? { stock: Number(req.body.stock) } : {}),
    };

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (product.postedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this product" });
      return;
    }

    await product.deleteOne();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const appendProductImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (product.postedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Not authorized to update this product" });
      return;
    }

    product.images.push(...filesToDataUrls(req.files as Express.Multer.File[]));
    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate("reviewer", "name avatar country")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const createProductReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.create({
      product: req.params.id,
      reviewer: req.user!._id,
      rating: Number(req.body.rating),
      comment: req.body.comment,
      photo: req.body.photo,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }

    if (review.reviewer.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Not authorized to delete this review" });
      return;
    }

    await review.deleteOne();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};
