"use client"
import { useEffect, useState } from 'react';
import { Eye, Truck } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/orders/all')
      .then(res => res.json())
      .then(data => setOrders(data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Tracking</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order: any) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">#{order._id.slice(-8)}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                  <p className="text-xs text-gray-500">{order.shippingAddress?.city}, {order.shippingAddress?.country}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {order.items.length} items
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">
                  ${(order.total_cents / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="Update Shipping">
                    <Truck className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}