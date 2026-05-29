import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Product from "../models/Product";

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Tourist only. Accepts a cart (array of { productId, quantity }).
// Groups items by cooperative and creates one order per coop.

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const {
    items,
    shippingAddress,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "Cart is empty" });
    return;
  }

  if (!shippingAddress) {
    res.status(400).json({ message: "Shipping address is required" });
    return;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const touristId = (req as any).user._id;

    const productIds = items.map((i: any) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    if (products.length !== productIds.length) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) continue;
      if (product.stock !== undefined && product.stock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
      }
    }

    const coopMap = new Map<string, { productId: string; quantity: number }[]>();
    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.productId)!;
      const coopId = product.cooperative.toString();
      if (!coopMap.has(coopId)) coopMap.set(coopId, []);
      coopMap.get(coopId)!.push(item);
    }

    const orderDocs = [];
    for (const [coopId, coopItems] of coopMap) {
      const orderItems = coopItems.map((item) => {
        const product = products.find((p) => p._id.toString() === item.productId)!;
        return {
          product: new mongoose.Types.ObjectId(item.productId),
          quantity: item.quantity,
          priceAtPurchase: product.price,
        };
      });

      const total = orderItems.reduce(
        (sum, i) => sum + i.priceAtPurchase * i.quantity,
        0
      );

      orderDocs.push({
        tourist: touristId,
        cooperative: new mongoose.Types.ObjectId(coopId),
        items: orderItems,
        shippingAddress,
        total,
        paymentMethod: "cash_on_delivery",
        status: "pending",
      });
    }

    const created = await Order.insertMany(orderDocs, { session });

    for (const item of items) {
      const stockUpdate = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session }
      );
      if (stockUpdate.modifiedCount !== 1) {
        throw new Error("INSUFFICIENT_STOCK_WRITE");
      }
    }

    await session.commitTransaction();

    res.status(201).json(created);
  } catch (error) {
    await session.abortTransaction();
    const message = (error as Error).message || "Server error";
    if (message === "PRODUCT_NOT_FOUND") {
      res.status(400).json({ message: "One or more products not found" });
      return;
    }
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      res.status(400).json({ message: `Insufficient stock for "${message.split(":")[1]}"` });
      return;
    }
    if (message === "INSUFFICIENT_STOCK_WRITE") {
      res.status(400).json({ message: "One or more items are no longer in stock in the requested quantity" });
      return;
    }
    console.error("createOrder error:", error);
    res.status(500).json({ message: "Server error", error: message });
  } finally {
    await session.endSession();
  }
};

// ─── GET /api/orders/my ───────────────────────────────────────────────────────
// Tourist's own orders, newest first, products + coop populated.

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const touristId = (req as any).user._id;

    const orders = await Order.find({ tourist: touristId })
      .populate("items.product", "name images price category")
      .populate("cooperative", "name location category verified coverImage")
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (error) {
    console.error("getMyOrders error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

// ─── GET /api/orders/coop ─────────────────────────────────────────────────────
// Coop owner's incoming orders for their cooperative.

export const getCoopOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user.cooperativeId) {
      res.status(403).json({ message: "No cooperative linked to this account" });
      return;
    }

    const orders = await Order.find({ cooperative: user.cooperativeId })
      .populate("items.product", "name images price category")
      .populate("tourist", "name email country")
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (error) {
    console.error("getCoopOrders error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

// ─── PATCH /api/orders/:id/status ────────────────────────────────────────────
// Coop owner updates order status. Cannot move backwards or skip to delivered.

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: "Status is required" });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Ensure this order belongs to the coop owner's cooperative
    if (order.cooperative.toString() !== user.cooperativeId?.toString()) {
      res.status(403).json({ message: "Not authorised to update this order" });
      return;
    }

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(status)) {
      res.status(400).json({
        message: `Cannot transition from "${order.status}" to "${status}"`,
      });
      return;
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};
