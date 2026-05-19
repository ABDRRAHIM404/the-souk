import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  refresh,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/refresh", refresh);

export default router;