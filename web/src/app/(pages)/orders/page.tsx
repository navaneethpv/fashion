"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Order } from "../../../types/order";
import Navbar from "../components/Navbar";
import { Package, Truck, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Polling interval in ms
const POLLING_INTERVAL = 5000;

export default function OrdersPage() {
    const { user, isLoaded } = useUser();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchOrders = async () => {
        if (!user) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            // Using query param as per backend fix
            const res = await fetch(`${API_URL}/api/orders?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and Polling
    useEffect(() => {
        if (isLoaded && user) {
            fetchOrders();
            const interval = setInterval(fetchOrders, POLLING_INTERVAL);
            return () => clearInterval(interval);
        }
    }, [isLoaded, user]);

    const getStatusColor = (status: Order["orderStatus"]) => {
        switch (status) {
            case "placed": return "bg-gray-100 text-gray-700 border-gray-200";
            case "confirmed": return "bg-blue-50 text-blue-700 border-blue-200";
            case "shipped": return "bg-orange-50 text-orange-700 border-orange-200";
            case "delivered": return "bg-green-50 text-green-700 border-green-200";
            case "cancelled": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusIcon = (status: Order["orderStatus"]) => {
        switch (status) {
            case "placed": return <Clock className="w-4 h-4" />;
            case "confirmed": return <CheckCircle className="w-4 h-4" />;
            case "shipped": return <Truck className="w-4 h-4" />;
            case "delivered": return <Package className="w-4 h-4" />;
            case "cancelled": return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    if (!isLoaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                    {lastUpdated && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Updated {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                {loading && orders.length === 0 ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-xl animate-pulse shadow-sm" />)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
                        <Link href="/product" className="px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

                                {/* Header */}
                                <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap gap-4 justify-between items-center bg-gray-50/50">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider block">Order ID</span>
                                            <span className="font-mono font-medium text-gray-900">#{order._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider block">Date</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${getStatusColor(order.orderStatus)}`}>
                                        {getStatusIcon(order.orderStatus)}
                                        {order.orderStatus}
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <Package className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 line-clamp-1">{item.name}</h4>
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        ₹{(item.price_cents / 100).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-gray-500 text-sm">Total Amount</span>
                                        <span className="text-xl font-bold text-gray-900">
                                            ₹{(order.total_cents / 100).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
