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

// CORS Configuration - Allow only specific origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://eyoris-fashion.vercel.app",
];

const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};


app.use(cors(corsOptions));
// app.options(/.*/, cors(corsOptions));// MUST be immediately after
app.use(express.json());
app.use(morgan("dev"));

// Clerk middleware - MUST be before routes
app.use(clerkMiddleware());

// Mount Routes
app.use("/api/products", productRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.get("/", (req, res) => {
  res.send("Eyoris Fashion API is running...");
});

// Start server after DB connection
const startServer = async () => {
  try {
    if (!process.env.CLERK_PUBLISHABLE_KEY) {
      console.error("❌ CLERK_PUBLISHABLE_KEY is missing from environment variables");
    }
    if (!process.env.CLERK_SECRET_KEY) {
      console.error("❌ CLERK_SECRET_KEY is missing from environment variables");
    }

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
