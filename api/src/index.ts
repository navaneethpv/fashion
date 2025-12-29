import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./config/db";

import cartRoutes from "./routes/cartRoutes";
import productRoutes from "./routes/productRoutes";
import aiRoutes from "./routes/aiRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminRoutes from "./routes/adminRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://eyoris-fashion.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Public routes
app.use("/api/products", productRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reviews", reviewRoutes);

// Protected routes
app.use("/api/cart", clerkMiddleware(), cartRoutes);
app.use("/api/orders", clerkMiddleware(), orderRoutes);
app.use("/api/admin", clerkMiddleware(), adminRoutes);
app.use("/api/wishlist", clerkMiddleware(), wishlistRoutes);

app.get("/", (req, res) => {
  res.send("Eyoris Fashion API is running...");
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
