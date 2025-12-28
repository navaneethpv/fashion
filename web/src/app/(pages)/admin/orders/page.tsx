"use client"
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Truck, Check, X, Loader2, ChevronDown, ChevronUp, FileText, Download, Package, CreditCard, Clock, MapPin, CheckCircle } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [printingOrder, setPrintingOrder] = useState<string | null>(null);
  // REMOVED: const [approvingReturn, setApprovingReturn] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchOrders = () => {
    fetch(`${API_URL}/api/orders/all`)
      .then(res => res.json())
      .then(data => setOrders(data));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newOrderStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/order-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newOrderStatus })
      });

      if (res.ok) {
        fetchOrders();
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

  const handlePrintInvoice = async (orderId: string) => {
    setPrintingOrder(orderId);
    try {
      // Small delay for loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      if (invoiceRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Invoice - Order #${orderId.slice(-6)}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                  .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                  .company-tagline { color: #666; font-size: 14px; }
                  .order-info { margin-bottom: 20px; }
                  .order-info h3 { margin-bottom: 10px; }
                  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                  .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  .items-table th { background-color: #f5f5f5; }
                  .total-row { font-weight: bold; background-color: #f9f9f9; }
                  .address-section { margin-top: 20px; }
                  .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                  @media print { body { margin: 0; } }
                </style>
              </head>
              <body>
                ${invoiceRef.current.innerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      alert("Failed to generate invoice");
    } finally {
      setPrintingOrder(null);
    }
  };

  // REMOVED: handleApproveReturn function
  // const handleApproveReturn = async (orderId: string) => { ... };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'Refunded': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getOrderStatusColor = (orderStatus: string) => {
    switch (orderStatus) {
      case 'Placed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <motion.span
          whileHover={{ scale: 1.05 }}
          className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
        >
          {orders.length} Total Orders
        </motion.span>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 w-8"></th>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Payment Status</th>
              <th className="px-6 py-4">Order Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            <AnimatePresence>
              {orders.map((order: any, index: number) => {
                const isExpanded = expandedOrderId === order._id;

                return (
                  <React.Fragment key={order._id}>
                    {/* Main Order Row */}
                    <motion.tr
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                    >
                      <td className="px-6 py-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedOrderId(isExpanded ? null : order._id);
                          }}
                        >
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </motion.div>
                        </motion.button>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="bg-gray-100 px-2 py-1 rounded"
                        >
                          #{order._id.slice(-6)}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {order.shippingAddress?.city}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="font-bold text-gray-900 bg-green-50 px-3 py-1 rounded-lg"
                        >
                          {formatCurrency(order.total_cents)}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getPaymentStatusColor(order.paymentStatus)}`}
                        >
                          {order.paymentStatus}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getOrderStatusColor(order.orderStatus)}`}
                        >
                          {order.orderStatus}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {/* Status Update */}
                          <div className="relative">
                            {updatingId === order._id ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center text-blue-600 text-xs font-bold"
                              >
                                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating...
                              </motion.div>
                            ) : (
                              <motion.select
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg block w-28 p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none ${order.paymentStatus?.toLowerCase() !== 'paid' ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                value={order.orderStatus}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                disabled={order.paymentStatus?.toLowerCase() !== 'paid'}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="placed">Placed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </motion.select>
                            )}
                          </div>

                          {/* Invoice Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintInvoice(order._id);
                            }}
                            disabled={printingOrder === order._id}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Print Invoice"
                          >
                            {printingOrder === order._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}

                          </motion.button>

                          {/* REMOVED: Approve Return Button */}
                          {/* Previously showed button when order.orderStatus === 'return_requested' */}
                        </div>
                      </td>
                    </motion.tr>

                    {/* Expanded Order Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <td colSpan={7} className="px-6 py-0 bg-gray-50">
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="py-6"
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Order Items */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                                    Ordered Items
                                  </h3>

                                  <div className="space-y-4">
                                    {order.items?.map((item: any, itemIndex: number) => (
                                      <motion.div
                                        key={itemIndex}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: itemIndex * 0.1 }}
                                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                                      >
                                        <div className="flex-shrink-0">
                                          {item.image ? (
                                            <img
                                              src={item.image}
                                              alt={item.name}
                                              className="w-12 h-12 rounded-lg object-cover"
                                            />
                                          ) : (
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                              <Package className="w-6 h-6 text-gray-400" />
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex-grow">
                                          <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                                          <p className="text-xs text-gray-500">Variant: {item.variantSku}</p>
                                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>

                                        <div className="text-right">
                                          <p className="font-bold text-gray-900">
                                            {formatCurrency(item.price_cents)}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {formatCurrency(item.price_cents * item.quantity)}
                                          </p>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>

                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-gray-900">Total:</span>
                                      <span className="font-bold text-lg text-gray-900">
                                        {formatCurrency(order.total_cents)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Shipping & Payment Info */}
                                <div className="space-y-6">
                                  {/* Shipping Address */}
                                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                      <Truck className="w-5 h-5 mr-2 text-blue-600" />
                                      Shipping Address
                                    </h3>

                                    <div className="space-y-3">
                                      <div>
                                        <p className="font-semibold text-gray-900">
                                          {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                                        </p>
                                        <p className="text-sm text-gray-600">{order.shippingAddress?.email}</p>
                                        <p className="text-sm text-gray-600">{order.shippingAddress?.phone}</p>
                                      </div>

                                      <div className="pt-2 border-t border-gray-100">
                                        <p className="text-sm text-gray-700">
                                          {order.shippingAddress?.street}<br />
                                          {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}<br />
                                          {order.shippingAddress?.country}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Payment & Order Info */}
                                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                      <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                                      Order Information
                                    </h3>

                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Order Date:</span>
                                        <span className="text-sm font-medium text-gray-900 flex items-center">
                                          <Clock className="w-4 h-4 mr-1" />
                                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Payment Method:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                          {order.paymentInfo?.method || 'Credit Card'}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Payment Status:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getPaymentStatusColor(order.paymentStatus)}`}>
                                          {order.paymentStatus}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Order Status:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getOrderStatusColor(order.orderStatus)}`}>
                                          {order.orderStatus}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* Invoice Template (Hidden, for printing) */}
      <div ref={invoiceRef} style={{ display: 'none' }}>
        {orders.map(order => (
          <div key={order._id} className="invoice-template">
            {printingOrder === order._id && (
              <div>
                <div className="header">
                  <div className="company-name">Eyoris Fashion</div>
                  <div className="company-tagline">AI-Powered E-Commerce Platform</div>
                </div>

                <div className="order-info">
                  <h3>Order Details</h3>
                  <p><strong>Order ID:</strong> #{order._id}</p>
                  <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p><strong>Customer:</strong> {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                </div>

                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Variant</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item: any, index: number) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.variantSku}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.price_cents)}</td>
                        <td>{formatCurrency(item.price_cents * item.quantity)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">

                      <td>{formatCurrency(order.total_cents)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="address-section">
                  <h3>Shipping Address</h3>
                  <p>
                    {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}<br />
                    {order.shippingAddress?.street}<br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}<br />
                    {order.shippingAddress?.country}
                  </p>
                </div>

                <div className="footer">
                  <p>Thank you for shopping with Eyoris Fashion!</p>
                  <p>This is a computer-generated invoice.</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
