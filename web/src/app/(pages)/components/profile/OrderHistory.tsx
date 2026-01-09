"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Package, Calendar, MapPin, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react";
import OrderDetailsDrawer from "./OrderDetailsDrawer";
import Link from "next/link";
import StoryUploadModal from "@/components/StoryUploadModal";
import { Camera, Star, CheckCircle } from "lucide-react";
import ReviewModal from "@/components/ReviewModal";

interface OrderHistoryProps {
  clerkUser: any;
}

export default function OrderHistory({ clerkUser }: OrderHistoryProps) {
  const { userId, getToken } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedProductForStory, setSelectedProductForStory] = useState<any | null>(null);
  const [selectedProductForReview, setSelectedProductForReview] = useState<any | null>(null);

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${baseUrl}/api/orders?userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        // Sort by date desc just in case
        const sorted = Array.isArray(data) ? data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

        // Fetch reviews to mark isReviewed
        let reviewedMap = new Set();
        try {
          const reviewsRes = await fetch(`${baseUrl}/api/reviews/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (reviewsRes.ok) {
            const reviews = await reviewsRes.json();
            if (Array.isArray(reviews)) {
              reviewedMap = new Set(reviews.map((r: any) => `${r.orderId}_${r.productId}`));
            }
          }
        } catch (e) {
          console.error("Error fetching reviews:", e);
        }

        const augmentedOrders = sorted.map((order: any) => ({
          ...order,
          items: order.items.map((item: any) => ({
            ...item,
            isReviewed: reviewedMap.has(`${order._id}_${item.productId}`)
          }))
        }));

        setOrders(augmentedOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId, getToken, baseUrl]);

  const handleOrderUpdate = (updatedOrder: any) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
    setSelectedOrder(updatedOrder);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/10";
      case "shipped": return "bg-orange-50 text-orange-700 border-orange-100 ring-orange-500/10";
      case "delivered": return "bg-green-50 text-green-700 border-green-100 ring-green-500/10";
      case "cancelled": return "bg-red-50 text-red-700 border-red-100 ring-red-500/10";
      case "return_requested": return "bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/10";
      case "returned": return "bg-gray-100 text-gray-700 border-gray-200 ring-gray-500/10";
      default: return "bg-gray-50 text-gray-700 border-gray-200 ring-gray-500/10";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ");
  };

  // Group orders
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  const recentOrders = orders.filter(o => new Date(o.createdAt) > thirtyDaysAgo);
  const pastOrders = orders.filter(o => new Date(o.createdAt) <= thirtyDaysAgo);

  const OrderCard = ({ order }: { order: any }) => (
    <div
      onClick={() => setSelectedOrder(order)}
      className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6">
        {/* Image Section - Wrapped in Link */}
        <Link
          href={`/products/${(order.items[0]?.productId as any)?.slug || (order.items[0]?.productId)}`}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:w-28 aspect-[4/5] sm:aspect-square flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:ring-2 hover:ring-blue-500 transition-all"
        >
          {order.items[0]?.image ? (
            <img
              src={order.items[0].image}
              alt={order.items[0].name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-300">
              <Package className="w-8 h-8" />
            </div>
          )}
          {order.items.length > 1 && (
            <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-[2px] py-1 text-center">
              <span className="text-[10px] font-bold text-white tracking-wide">
                +{order.items.length - 1} MORE
              </span>
            </div>
          )}
        </Link>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <Link
            href={`/products/${(order.items[0]?.productId as any)?.slug || (order.items[0]?.productId)}`}
            onClick={(e) => e.stopPropagation()}
            className="block group/title"
          >
            <div>
              <div className="flex justify-between items-start gap-3">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2 leading-snug group-hover/title:text-blue-600 transition-colors">
                  {order.items[0]?.name || "Product Name"}
                </h3>
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border ring-1 ring-inset ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Meta Row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1.5 max-w-[150px] truncate">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{order.shippingAddress?.city || "India"}</span>
                </div>
                <div className="sm:hidden w-full h-px bg-gray-100 my-1" />
                <div className="flex items-center gap-1.5 font-medium text-gray-900">
                  <span>Total:</span>
                  <span className="text-base">
                    ₹{(order.total_cents / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Action Footer */}
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">
              Order #{order._id.slice(-8).toUpperCase()}
            </span>

            <div className="flex items-center gap-3">
              {/* Add Story Button (Stop Propagation to prevent opening drawer) */}
              {(order.status === 'delivered' || order.orderStatus === 'delivered') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const item = order.items[0];
                    setSelectedProductForStory({
                      orderId: order._id,
                      productId: typeof item.productId === 'string' ? item.productId : (item.productId as any)._id,
                      productName: item.name,
                      productImage: item.image || ""
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-gray-700 transition-colors z-10"
                >
                  <Camera className="w-3 h-3" />
                  <span>Add Story</span>
                </button>
              )}

              {/* Write Review Button */}
              {(((order.status || "").toLowerCase() === 'delivered' || (order.orderStatus || "").toLowerCase() === 'delivered')) && (
                <div className="flex items-center">
                  {(order.items[0]?.isReviewed) ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold uppercase tracking-wide border border-green-100 whitespace-nowrap">
                      <CheckCircle className="w-3 h-3" />
                      Reviewed
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const item = order.items[0];
                        setSelectedProductForReview({
                          orderId: order._id,
                          productId: typeof item.productId === 'string' ? item.productId : (item.productId as any)._id,
                          productName: item.name,
                          productImage: item.image || ""
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-violet-700 transition-colors z-10 whitespace-nowrap shadow-sm"
                    >
                      <Star className="w-3 h-3 fill-white" />
                      <span>Review</span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                View Details <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <ShoppingBag className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No orders placed yet</h3>
        <p className="text-gray-500 max-w-sm mb-6">
          Looks like you haven't bought anything yet. Discover our latest fashion collection today!
        </p>
        <Link
          href="/product"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all hover:gap-3"
        >
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-10 anima-in fade-in duration-500">
        {/* Recent Orders Section */}
        {recentOrders.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Recent Orders
              <span className="text-gray-400 text-sm font-normal">({recentOrders.length})</span>
            </h2>
            <div className="grid gap-4">
              {recentOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
          </section>
        )}

        {/* Past Orders Section */}
        {pastOrders.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Past Orders
              <span className="text-gray-400 text-sm font-normal">({pastOrders.length})</span>
            </h2>
            <div className="grid gap-4">
              {pastOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
          </section>
        )}
      </div>

      <OrderDetailsDrawer
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdate={handleOrderUpdate}
        onReviewProduct={(item) => {
          setSelectedProductForReview({
            orderId: selectedOrder._id,
            productId: typeof item.productId === 'string' ? item.productId : (item.productId as any)._id,
            productName: item.name,
            productImage: item.image || ""
          });
        }}
      />

      {selectedProductForStory && (
        <StoryUploadModal
          isOpen={!!selectedProductForStory}
          onClose={() => setSelectedProductForStory(null)}
          orderId={selectedProductForStory.orderId}
          productId={selectedProductForStory.productId}
          productName={selectedProductForStory.productName}
          productImage={selectedProductForStory.productImage}
        />
      )}

      {selectedProductForReview && (
        <ReviewModal
          isOpen={!!selectedProductForReview}
          onClose={() => setSelectedProductForReview(null)}
          onSuccess={() => {
            // Trigger a refresh of orders
            getToken().then(token => {
              fetch(`${baseUrl}/api/orders?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
              }).then(res => res.json()).then(data => {
                // Simplified refresh logic - in a real app would use a more robust state management
                window.location.reload();
              });
            });
          }}
          orderId={selectedProductForReview.orderId}
          productId={selectedProductForReview.productId}
          productName={selectedProductForReview.productName}
          productImage={selectedProductForReview.productImage}
        />
      )}
    </>
  );
}
