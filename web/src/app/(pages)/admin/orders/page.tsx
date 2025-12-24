"use client";

import { useEffect, useState } from "react";
import { Order } from "../../../../types/order";
import { Clock, CheckCircle, Truck, Package, XCircle, RefreshCw, Filter } from "lucide-react";

const POLLING_INTERVAL = 10000; // 10 seconds for admin

const VALID_STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      // Assuming Admin API is public/unprotected for this demo step as per request constraints
      // In real app, would need Auth header
      const res = await fetch(`${API_URL}/api/orders/all`); // From orderRoutes, assumed "getAllOrders" matched to /all
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/orders/${orderId}/order-status`, { // Matches orderRoutes.ts
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      if (res.ok) {
        // Optimistic update
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus as any } : o));
        fetchOrders(); // Sync with backend to be sure
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed": return "bg-gray-100 text-gray-700";
      case "confirmed": return "bg-blue-100 text-blue-700";
      case "shipped": return "bg-orange-100 text-orange-700";
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100";
    }
  };

  if (loading && orders.length === 0) return <div className="p-8">Loading admin dashboard...</div>;

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 mt-1">Manage and track all customer orders</p>
        </div>
        <div className="flex bg-white px-4 py-2 rounded-lg shadow-sm items-center gap-2 border">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-sm">All Orders ({orders.length})</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">
                    #{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                      </span>
                      <span className="text-xs text-gray-400">{order.shippingAddress?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ₹{(order.total_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold capitalize ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus === 'placed' && <Clock className="w-3 h-3" />}
                      {order.orderStatus === 'confirmed' && <CheckCircle className="w-3 h-3" />}
                      {order.orderStatus === 'shipped' && <Truck className="w-3 h-3" />}
                      {order.orderStatus === 'delivered' && <Package className="w-3 h-3" />}
                      {order.orderStatus === 'cancelled' && <XCircle className="w-3 h-3" />}
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      disabled={updatingId === order._id || order.orderStatus === 'cancelled' || order.orderStatus === 'delivered'}
                      className="text-sm border-gray-300 rounded shadow-sm focus:ring-black focus:border-black py-1 pl-2 pr-8"
                    >
                      {VALID_STATUSES.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    {updatingId === order._id && <span className="ml-2 text-xs text-gray-400">...</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
