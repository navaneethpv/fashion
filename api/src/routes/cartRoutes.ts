import { Router } from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "../controllers/cartController";

const router = Router();

router.get("/", getCart);
router.post("/", addToCart);
router.delete("/", removeFromCart);

// ✅ NEW
router.patch("/quantity", updateCartQuantity);

export default router;
