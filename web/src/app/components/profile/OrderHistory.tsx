// web/src/components/profile/OrderHistory.tsx
"use client"
import { useEffect, useState } from 'react';
import { UserResource } from "@clerk/types";
import { useAuth } from '@clerk/nextjs';
import { Loader2, Package, DollarSign, Clock } from 'lucide-react';

interface OrderHistoryProps {
  clerkUser: UserResource;
}

export default function OrderHistory({ clerkUser }: OrderHistoryProps) {
  const { userId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/orders?userId=${userId}`);
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
    return <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (orders.length === 0) {
    return <p className="text-gray-500">You have not placed any orders yet.</p>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {orders.map(order => (
        <div key={order._id} className="p-4 border rounded-xl shadow-sm hover:shadow-md transition bg-white">
          <div className="flex justify-between items-start border-b pb-3 mb-3">
            <div>
              <p className="text-xs font-bold text-gray-500">Order ID: #{order._id.slice(-6).toUpperCase()}</p>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1" /> Placed on: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 text-sm">
             <p className="font-bold flex items-center gap-1"><Package className="w-4 h-4 text-primary" /> {order.items.length} Items</p>
             <p className="font-bold flex items-center gap-1"><DollarSign className="w-4 h-4 text-primary" /> Total: ₹{(order.total_cents / 100).toFixed(2)}</p>
             <p className="col-span-2 text-xs text-gray-500 mt-2 md:mt-0">Ship to: {order.shippingAddress.street}, {order.shippingAddress.city}</p>
          </div>
        </div>
      ))}
    </div>
  );
}