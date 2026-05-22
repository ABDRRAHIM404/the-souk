import { Request, Response } from "express";
import Cooperative from "../models/Cooperative";
import Product from "../models/Product";
import { AuthRequest } from "../middleware/authMiddleware";

export const getCoops = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await Cooperative.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data, total: data.length, page: 1, pages: 1 });
  } catch (error) {
    console.error("getCoops error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const getCoopById = async (req: Request, res: Response): Promise<void> => {
  try {
    const coop = await Cooperative.findById(req.params.id).lean();
    if (!coop) {
      res.status(404).json({ message: "Cooperative not found" });
      return;
    }

    const productCount = await Product.countDocuments({ cooperative: coop._id });
    res.json({ success: true, data: { ...coop, productCount } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const createCoop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coop = await Cooperative.create({ ...req.body, owner: req.user!._id });
    res.status(201).json({ success: true, data: coop });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const updateCoop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coop = await Cooperative.findById(req.params.id);
    if (!coop) {
      res.status(404).json({ message: "Cooperative not found" });
      return;
    }

    if (coop.owner.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: "Not authorized to update this cooperative" });
      return;
    }

    Object.assign(coop, req.body);
    await coop.save();
    res.json({ success: true, data: coop });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const followCoop = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coop = await Cooperative.findById(req.params.id);
    if (!coop) {
      res.status(404).json({ message: "Cooperative not found" });
      return;
    }

    const userId = req.user!._id.toString();
    const existing = coop.followers.find((id) => id.toString() === userId);
    if (existing) {
      coop.followers = coop.followers.filter((id) => id.toString() !== userId);
    } else {
      coop.followers.push(req.user!._id);
    }

    await coop.save();
    res.json({ success: true, data: { followed: !existing } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};
