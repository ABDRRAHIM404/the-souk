import express from "express";
import {
  createOrder,
  getMyOrders,
  getCoopOrders,
  updateOrderStatus,
} from "../controllers/orderController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Tourist routes
router.post("/", restrictTo("tourist"), createOrder);
router.get("/my", restrictTo("tourist"), getMyOrders);

// Coop owner routes
router.get("/coop", restrictTo("coop_owner"), getCoopOrders);
router.patch("/:id/status", restrictTo("coop_owner"), updateOrderStatus);

export default router;
