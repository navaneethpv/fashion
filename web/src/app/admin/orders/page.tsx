

"use client"
import React, { useEffect, useState } from 'react';
import { Eye, Truck, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = () => {
    fetch('http://localhost:4000/api/orders/all')
      .then(res => res.json())
      .then(data => setOrders(data));
  };

  useEffect(() => {
    fetchOrders();
  }, []);


  const handleStatusChange = async (orderId: string, newOrderStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`http://localhost:4000/api/orders/${orderId}/order-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newOrderStatus })
      });
      
      if (res.ok) {
        fetchOrders(); // Refresh list
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        alert(`Failed to update status: ${errorData.message}`);
      }
    } catch (error) {
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };


  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      case 'Refunded': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOrderStatusColor = (orderStatus: string) => {
    switch (orderStatus) {
      case 'Placed': return 'bg-blue-100 text-blue-700';
      case 'Shipped': return 'bg-purple-100 text-purple-700';
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <span className="text-sm text-gray-500">{orders.length} Total Orders</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">


        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 w-8"></th>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Payment Status</th>
              <th className="px-6 py-4">Order Status</th>
              <th className="px-6 py-4">Update Shipment</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {orders.map((order: any) => {
              const isExpanded = expandedOrderId === order._id;
              
              return (
                <React.Fragment key={order._id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                  >
                    <td className="px-6 py-4">
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedOrderId(isExpanded ? null : order._id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">#{order._id.slice(-6)}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                      <p className="text-xs text-gray-500">{order.shippingAddress?.city}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ${(order.total_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getOrderStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        {updatingId === order._id ? (
                          <div className="flex items-center text-blue-600 text-xs font-bold">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating...
                          </div>
                        ) : (
                          <select 
                            className={`bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg block w-full p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                              order.paymentStatus !== 'Paid' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            value={order.orderStatus}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={order.paymentStatus !== 'Paid'}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="Placed">Placed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Address Details */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-6 py-0 bg-gray-50">
                        <div className="py-6 animate-in slide-in-from-top-2 duration-200">
                          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                              <Truck className="w-5 h-5 mr-2 text-blue-600" />
                              Shipping Address Details
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                                  <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Number</label>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {order.shippingAddress?.phone || 'N/A'}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {order.shippingAddress?.email || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Street Address</label>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {order.shippingAddress?.street || 'N/A'}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</label>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {order.shippingAddress?.city || 'N/A'}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">State</label>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {order.shippingAddress?.state || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Postal Code</label>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {order.shippingAddress?.zip || 'N/A'}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</label>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {order.shippingAddress?.country || 'US'}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Date</label>
                                  <p className="mt-1 text-sm text-gray-900">
                                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}