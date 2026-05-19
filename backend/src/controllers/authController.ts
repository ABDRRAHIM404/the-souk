import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Cooperative from "../models/Cooperative";

const generateAccessToken = (id: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET as string;
  const token = (jwt as any).sign({ id }, secret, { expiresIn: 900 });
  return token;
};

const generateRefreshToken = (id: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt as any).sign({ id }, secret, { expiresIn: 604800 });
};

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Register request body:", req.body);
    const { name, email, password, role, country, cooperativeName, cooperativeCity, cooperativeCategory } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "Please provide all required fields" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    const user = await User.create({ name, email, password, role, country: country || "" });
   console.log("User created:", user._id);
    
    if (role === "coop_owner" && cooperativeName) {
      await Cooperative.create({
        owner: user._id,
        name: cooperativeName,
        description: "",
        location: { city: cooperativeCity || "", region: "Souss-Massa" },
        category: cooperativeCategory || "other",
      });
    }

const accessToken = generateAccessToken(user._id.toString());
const refreshToken = generateRefreshToken(user._id.toString());
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

    res.status(201).json({
      message: "Account created successfully",
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        country: user.country,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Logged in successfully",
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        country: user.country,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.cookie("refreshToken", "", { httpOnly: true, expires: new Date(0) });
  res.json({ message: "Logged out successfully" });
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user._id).select("-password");
    res.json(user);
 } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    const accessToken = generateAccessToken(decoded.id);
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};