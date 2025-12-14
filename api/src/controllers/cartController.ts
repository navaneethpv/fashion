import { Request, Response } from "express";
import { Cart } from "../models/Cart";
import Product from "../models/Product"; // or however your model is exported
import mongoose from "mongoose";

/**
 * GET /api/cart?userId=...
 * Always returns populated product including images
 */
export const getCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.product",
        select: "name brand images price_cents",
      }) // include images
      .lean();

    return res.json(cart);
  } catch (error) {
    console.error("GET CART ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/cart
 * Add item and return populated cart
 */
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { userId, productId, variant, quantity } = req.body;

    if (!userId || !productId || !variant || !quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const index = cart.items.findIndex(
      (item: any) =>
        item.product.toString() === productId &&
        item.variantSku === variant
    );

    if (index > -1) {
      cart.items[index].quantity += quantity;
    } else {
      // images[] may be an array of strings (urls) or objects with a `url` property.
      // Normalize to a string URL or null.
      let imageUrl: string | null = null;
      if (product?.images && product.images.length) {
        const firstImage = product.images[0] as any;
        imageUrl = typeof firstImage === "string" ? firstImage : firstImage?.url ?? null;
      }

      cart.items.push({
        product: product._id, // or store snapshot
        variantSku: variant,
        quantity,
        price_at_add: product.price_cents,
        image_at_add: imageUrl, // new field on CartItem
      });
    }

    await cart.save();

    // 🔥 ALWAYS populate before returning
    const populatedCart = await Cart.findOne({ userId }).populate(
      "items.product",
      "name brand images price_cents slug"
    );

    res.json(populatedCart);
  } catch (error) {
    console.error("ADD TO CART ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * DELETE /api/cart
 * Remove item and return populated cart
 */
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { userId, productId, variant } = req.body;

    if (!userId || !productId || !variant) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { product: productId, variantSku: variant } } },
      { new: true }
    ).populate("items.product", "name brand images price_cents slug");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.json(cart);
  } catch (error) {
    console.error("REMOVE CART ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * PATCH /api/cart/quantity
 * Increase / Decrease cart item quantity
 */
export const updateCartQuantity = async (req: Request, res: Response) => {
  try {
    const { userId, productId, variant, quantity } = req.body;
    if (!userId || !productId || !variant || typeof quantity !== "number") {
      return res.status(400).json({ error: "invalid payload" });
    }

    // try increment existing item quantity
    const incResult = await Cart.updateOne(
      { userId, "items.product": productId, "items.variantSku": variant },
      { $set: { "items.$.price_at_add": await getLatestPrice(productId) }, $inc: { "items.$.quantity": quantity - await getCurrentQuantity(userId, productId, variant) } }
    );

    // if no item matched, push new (upsert)
    if (incResult.modifiedCount === 0 && incResult.matchedCount === 0) {
      await Cart.updateOne(
        { userId },
        {
          $push: {
            items: {
              product: new mongoose.Types.ObjectId(productId),
              variantSku: variant,
              quantity,
              price_at_add: await getLatestPrice(productId),
            },
          },
        },
        { upsert: true }
      );
    }

    // return fresh populated cart
    const cart = await Cart.findOne({ userId }).populate({
      path: "items.product",
      select: "name brand images price_cents stock",
    }).lean();

    return res.status(200).json(cart);
  } catch (err) {
    console.error("updateCartQuantity error:", err);
    return res.status(500).json({ error: "server error" });
  }
};

// helper examples (implement according your Product model)
async function getLatestPrice(productId: string) {
  const p = await Product.findById(productId).lean();
  return p?.price_cents ?? 0;
}
async function getCurrentQuantity(userId: string, productId: string, variant: string) {
  const cart = await Cart.findOne({ userId }).lean();
  const it = cart?.items?.find((i: any) => String(i.product) === String(productId) && i.variantSku === variant);
  return it?.quantity ?? 0;
}

