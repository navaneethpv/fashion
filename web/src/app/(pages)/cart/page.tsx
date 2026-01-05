"use client";
import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";


export default function CartPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  // Helper to get auth headers
  const authHeaders = async () => {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Fetch Cart
  const fetchCart = async () => {
    if (!user) return;
    try {
      const res = await fetch(
        `${baseUrl}/api/cart?userId=${user.id}`,
        {
          headers: await authHeaders(),
        }
      );


      if (!res.ok) throw new Error("Failed to fetch cart");

      const data = await res.json();
      // normalize so cart.items is always an array
      setCart({ ...data, items: data?.items ?? [] });
    } catch (err) {
      console.error("fetchCart error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Remove Item
  const removeItem = async (productId: string, variant: string) => {
    if (!user) return;
    try {
      // Optimistic UI update
      const newItems = cart.items.filter(
        (item: any) =>
          !(item.product._id === productId && item.variantSku === variant)
      );
      setCart({ ...cart, items: newItems });

      await fetch(`${baseUrl}/api/cart`, {
        method: "DELETE",
        headers: await authHeaders(),
        body: JSON.stringify({ userId: user.id, productId, variant }),
      });
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error(err);
      fetchCart(); // Revert on error
    }
  };

  useEffect(() => {
    if (isLoaded && user) fetchCart();
  }, [isLoaded, user]);

  const updateQuantity = async (
    productId: string,
    variant: string,
    newQty: number
  ) => {
    if (!user || newQty < 1) return;

    // Optimistic update (preserve product)
    setCart((prev: any) => ({
      ...prev,
      items: (prev?.items ?? []).map((item: any) =>
        (item.product?._id ?? item.product) === productId && item.variantSku === variant
          ? { ...item, quantity: newQty, product: item.product }
          : item
      ),
    }));

    try {
      // debug: log outgoing payload
      console.log("PATCH /api/cart/quantity ->", { userId: user.id, productId, variant, quantity: newQty });

      const res = await fetch(`${baseUrl}/api/cart/quantity`, {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({
          userId: user.id,
          productId,
          variant,
          quantity: newQty,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (e) {
        // no-json body (e.g. 204) -> leave data null
      }

      console.log("PATCH /api/cart/quantity response:", res.status, data);

      if (!res.ok) {
        // improved logging of server error body/text
        const text = data || (await res.text().catch(() => "no-body"));
        console.error("Failed to update cart quantity on server:", res.status, text);
        await fetchCart().catch((e) => console.error("fetchCart failed", e));
        return;
      }

      // If server returned items, merge server items with prev populated product objects
      if (data && Array.isArray(data.items)) {
        setCart((prev: any) => {
          const prevItems = prev?.items ?? [];
          const mergedItems = data.items.map((serverItem: any) => {
            const match = prevItems.find((pi: any) => {
              const piProdId = pi.product?._id ?? pi.product;
              const svProdId = serverItem.product?._id ?? serverItem.product;
              return String(piProdId) === String(svProdId) && pi.variantSku === serverItem.variantSku;
            });
            // keep populated product from prev if available, otherwise use server value
            return { ...serverItem, product: match?.product ?? serverItem.product };
          });
          return { ...data, items: mergedItems };
        });
        window.dispatchEvent(new Event("cart-updated"));
        return;
      }

      // If server returned nothing useful, keep optimistic UI and schedule a background reconcile
      fetchCart().catch((e) => console.error("fetchCart after qty update failed", e));
    } catch (err) {
      console.error("updateQuantity error:", err);
      // network error: revert to authoritative cart
      fetchCart();
    }
  };

  // Calculate Total
  const subtotal =
    (cart?.items ?? []).reduce((acc: number, item: any) => {
      return acc + (item.product?.price_cents ?? 0) * item.quantity;
    }, 0) || 0;

  // safe items reference for rendering
  const items = cart?.items ?? [];


  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Helper to safely resolve image URL
  const resolveImageUrl = (product: any) => {
    const PLACEHOLDER = "https://via.placeholder.com/300x200?text=No+Image";
    if (!product || !product.images || product.images.length === 0)
      return PLACEHOLDER;

    const image = product.images[0];
    if (typeof image === "string") return image;
    return image.url || PLACEHOLDER;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl font-serif font-medium mb-12 text-gray-900 tracking-tight">Shopping Bag</h1>

        {!cart || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 rounded-2xl border border-gray-100/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <ShoppingBag className="w-6 h-6 text-gray-300" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Your bag is empty</h2>
            <p className="text-gray-500 mb-8 font-light">Looks like you haven't added anything yet.</p>
            <Link
              href="/products"
              className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium text-sm hover:bg-black transition-all shadow-sm hover:shadow-md"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
            {/* Cart Items */}
            <div className="flex-1 space-y-6">
              {items.map((item: any) => (
                <div
                  key={`${item.product._id}-${item.variantSku}`}
                  className="flex gap-6 p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="relative w-28 h-36 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <Image
                      src={resolveImageUrl(item.product)}
                      alt={item.product?.name ?? "product"}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-1">
                          {item.product.brand || "Eyoris Basics"}
                        </h3>
                        <button
                          onClick={() =>
                            removeItem(item.product._id, item.variantSku)
                          }
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <Link href={`/products/${item.product.slug}`} className="group">
                        <h4 className="font-serif text-lg text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2 leading-tight">
                          {item.product.name}
                        </h4>
                      </Link>
                      <div className="mt-2 text-sm text-gray-500 font-medium">
                        Size: <span className="text-gray-900">{item.variantSku}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-200 rounded-full py-1 px-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product._id,
                                item.variantSku,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity === 1}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          >
                            −
                          </button>

                          <span className="w-8 text-center font-medium text-sm text-gray-900">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product._id,
                                item.variantSku,
                                item.quantity + 1
                              )
                            }
                            disabled={
                              item.quantity >= (item.product.stock ?? Infinity)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-medium text-lg text-gray-900">
                          ₹{(item.product.price_cents / 100).toFixed(0)}
                        </div>
                        {item.product.stock !== undefined &&
                          item.quantity >= item.product.stock && (
                            <p className="text-[10px] text-amber-600 font-medium mt-1">
                              Max Limit Reached
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-gray-50/50 p-8 rounded-3xl sticky top-24 border border-gray-100">
                <h3 className="font-serif font-medium text-xl text-gray-900 mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4 mb-6 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ₹{(subtotal / 100).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                      Free Express
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200/60 pt-6 mb-8">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-medium text-gray-900">Total</span>
                    <span className="text-2xl font-serif font-medium text-gray-900">₹{(subtotal / 100).toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-light">Inclusive of all taxes</p>

                  <Link
                    href="/checkout"
                    className="w-full bg-gray-900 text-white py-4 rounded-full font-medium hover:bg-black transition-all shadow-lg shadow-gray-200 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 mt-8 text-sm tracking-wide"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Secure Checkout
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
