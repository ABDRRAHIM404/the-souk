import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "JWT_SECRET", "CLIENT_URL"] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const normalizeOrigin = (url: string) => url.trim().replace(/\/+$/, "");

const clientUrls = process.env.CLIENT_URL!.split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: process.env.PORT ?? "5000",
  mongodbUri: process.env.MONGODB_URI!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET!,
  clientUrls,
};

export const isProduction = env.nodeEnv === "production";
