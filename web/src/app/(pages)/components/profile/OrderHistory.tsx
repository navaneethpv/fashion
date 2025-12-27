// web/src/components/profile/OrderHistory.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Package, DollarSign, Clock } from "lucide-react";

interface OrderHistoryProps {
  clerkUser: any; // Using any since @clerk/types is not installed
}

export default function OrderHistory({ clerkUser }: OrderHistoryProps) {
  const { userId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `${baseUrl}/api/orders?userId=${userId}`
        );
        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
        <a href="/product" className="inline-block px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">
          Browse Products
        </a>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "shipped":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-5">
      {orders.map((order) => (
        <div
          key={order._id}
          className="bg-white rounded-xl shadow-md border border-gray-200/60 overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          {/* Product-Focused Header */}
          <div className="flex items-start gap-5 p-5 border-b border-gray-100">
            {/* Large Product Image */}
            <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden relative border border-gray-200 flex-shrink-0 shadow-sm">
              {order.items[0]?.image ? (
                <img
                  src={order.items[0].image}
                  alt={order.items[0].name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-base text-gray-900 line-clamp-2 leading-snug">
                  {order.items[0]?.name || "Product"}
                </h3>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase whitespace-nowrap ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              {/* Additional Items Badge */}
              {order.items.length > 1 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium mb-2">
                  <Package className="w-3.5 h-3.5" />
                  +{order.items.length - 1} more item{order.items.length - 1 > 1 ? 's' : ''}
                </div>
              )}

              {/* Order Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-bold text-gray-900">
                    ₹{(order.total_cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Footer */}
          <div className="px-5 py-3.5 bg-gray-50/50">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-500">Order ID:</span>
                <span className="font-mono text-gray-700">#{order._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-500">Items:</span>
                <span className="font-semibold text-gray-700">{order.items.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-500">Shipping:</span>
                <span className="text-gray-700 truncate max-w-[200px]">
                  {order.shippingAddress.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
