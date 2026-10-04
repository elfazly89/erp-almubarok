// Safely load .env natively if supported in modern Node.js
if (typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile();
  } catch (e) {
    // Ignore
  }
}

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { masterRoutes } from "./routes/master";
import { hrdRoutes } from "./routes/hrd";
import { penjualanRoutes } from "./routes/penjualan";
import { pembelianRoutes } from "./routes/pembelian";
import { akuntansiRoutes } from "./routes/akuntansi";
import { distribusiRoutes } from "./routes/distribusi";
import { pengaturanRoutes } from "./routes/pengaturan";
import { promoRoutes } from "./routes/promo";
import { voucherRoutes } from "./routes/voucher";
import { mobileRoutes } from "./routes/mobile";
import { userRoutes } from "./routes/user";
import { kasRoutes } from "./routes/kas";

const app = new Hono().basePath("/api");

// CORS setup: Allow Next.js frontend (3000) and mobile apps to communicate
app.use("*", cors({
  origin: [
    "http://localhost:3000",      // Next.js web frontend
    "http://localhost:8081",      // React Native Metro dev server
    "capacitor://localhost",       // Capacitor/Ionic mobile app
    "http://localhost",           // Android emulator
  ],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Logging request middleware
app.use("*", async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.path}`);
  await next();
});

// Root status check
app.get("/status", (c) => c.json({ status: "ok", time: new Date().toISOString() }));

// Public auth routes
app.route("/auth", authRoutes);

// Guard all subsequent routes with global JWT auth middleware
app.use("/*", authMiddleware);

// Protected routes
app.route("/master", masterRoutes);
app.route("/", masterRoutes);
app.route("/hrd", hrdRoutes);
app.route("/penjualan", penjualanRoutes);
app.route("/pembelian", pembelianRoutes);
app.route("/akuntansi", akuntansiRoutes);
app.route("/kas", kasRoutes);
app.route("/distribusi", distribusiRoutes);
app.route("/pengaturan", pengaturanRoutes);
app.route("/promo", promoRoutes);
app.route("/voucher", voucherRoutes);
app.route("/user", userRoutes);

// Mobile endpoints (protected — memerlukan access_token di header Authorization)
app.route("/mobile", mobileRoutes);

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`🚀 ERP Al Mubarok Hono API running on http://localhost:${info.port}/api`);
});
