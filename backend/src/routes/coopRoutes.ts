import express from "express";
import { createCoop, followCoop, getCoopById, getCoops, updateCoop } from "../controllers/coopController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", getCoops);
router.get("/:id", getCoopById);
router.post("/", protect, restrictTo("coop_owner"), createCoop);
router.put("/:id", protect, restrictTo("coop_owner"), updateCoop);
router.post("/:id/follow", protect, restrictTo("tourist"), followCoop);

export default router;
