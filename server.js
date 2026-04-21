import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import cloudinaryRoutes from "./cloudinary/cloudinary.routes.js";
import adminUsersRoute from "./adminUsers/adminUsersRoute.js";
import supportTicketRoutes from "./customerSupportTicket/customerSupportTicket.routes.js";
import categoryRoutes from "./Category/CategoryRoutes.js";
import productRoutes from "./product/product.routes.js";
import blogRoutes from "./blog/blog.routes.js";
import wishlistRoutes from "./wishlist/wishlist.routes.js";
import orderRoutes from "./orders/orders.routes.js";
import shiprocketRoutes from "./shiprocket/shiprocket.routes.js";
import razorpayRoutes from "./razorpay/razorpay.routes.js";
import metaRoutes from "./meta/meta.routes.js";
import collectionRoutes from "./collection/collection.router.js";
import couponRoutes from "./coupon/coupon.routes.js";
import customerRoutes from "./customer/customer.routes.js";

const app = express();

/* =========================================================
   CORE MIDDLEWARE
========================================================= */
app.use(cors());

/* Razorpay webhook needs raw body */
app.use("/api/razorpay/webhook", express.raw({ type: "application/json" }));

/* JSON parser for all normal routes */
app.use(express.json());

/* =========================================================
   DATABASE
========================================================= */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

/* =========================================================
   BASIC ROUTES
========================================================= */
app.get("/", (_req, res) => {
  res.send("🚀 Server is alive");
});

app.get("/ping", (_req, res) => {
  res.status(200).send("pong");
});

app.get("/api/test", (_req, res) => {
  res.json({
    success: true,
    message: "API working",
  });
});

/* =========================================================
   HEALTH CHECK
========================================================= */
app.get("/health", (_req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  res.status(200).json({
    success: true,
    status: "OK",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: `${Math.floor(uptime)} seconds`,
    timestamp: new Date().toISOString(),
    memory: {
      rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    },
  });
});

/* =========================================================
   API ROUTES
========================================================= */
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/admin-users", adminUsersRoute);
app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shiprocket", shiprocketRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/customers", customerRoutes);

/* =========================================================
   404 HANDLER
========================================================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */
app.use((error, _req, res, _next) => {
  console.error("❌ Server error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

/* =========================================================
   SERVER START
========================================================= */
const PORT = process.env.PORT || 9000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});