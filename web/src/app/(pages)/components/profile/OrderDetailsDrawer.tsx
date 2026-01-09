// web/src/app/(pages)/components/profile/OrderDetailsDrawer.tsx
"use client";
import { X, Package, CheckCircle2, Truck, Home, Clock, RotateCcw, Star, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
// REMOVED: OrderActionModal (not needed without cancel/return)

interface OrderDetailsDrawerProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
    onOrderUpdate?: (updatedOrder: any) => void;
    onReviewProduct?: (item: any) => void;
}

export default function OrderDetailsDrawer({
    order,
    isOpen,
    onClose,
    onOrderUpdate,
    onReviewProduct,
}: OrderDetailsDrawerProps) {
    const { getToken } = useAuth();

    // Cancel Order State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [isCancelSubmitting, setIsCancelSubmitting] = useState(false);
    const [cancelError, setCancelError] = useState("");

    // Return Request State
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState("");
    const [isReturnSubmitting, setIsReturnSubmitting] = useState(false);
    const [returnError, setReturnError] = useState("");
    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !order) return null;

    const base =
        process.env.NEXT_PUBLIC_API_BASE ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:4000";
    const baseUrl = base.replace(/\/$/, "");

    // Cancel Order Logic
    const canCancel = order.orderStatus === "placed" || order.orderStatus === "confirmed";

    const handleCancelOrder = async () => {
        if (!cancellationReason.trim()) {
            setCancelError("Please provide a reason for cancellation");
            return;
        }

        setIsCancelSubmitting(true);
        setCancelError("");

        try {
            const token = await getToken();
            const response = await fetch(`${baseUrl}/api/orders/${order._id}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ cancellationReason: cancellationReason.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to cancel order");
            }

            const updatedOrder = await response.json();

            // Update parent component
            if (onOrderUpdate) {
                onOrderUpdate(updatedOrder);
            }

            // Close modal and reset state
            setShowCancelModal(false);
            setCancellationReason("");
        } catch (err: any) {
            setCancelError(err.message || "Failed to cancel order");
        } finally {
            setIsCancelSubmitting(false);
        }
    };

    const openCancelModal = () => {
        setShowCancelModal(true);
        setCancelError("");
        setCancellationReason("");
    };

    const closeCancelModal = () => {
        if (!isCancelSubmitting) {
            setShowCancelModal(false);
            setCancellationReason("");
            setCancelError("");
        }
    };

    // Return Request Logic
    const canReturn = order.orderStatus === "delivered";

    const handleRequestReturn = async () => {
        if (!returnReason.trim()) {
            setReturnError("Please provide a reason for return");
            return;
        }

        setIsReturnSubmitting(true);
        setReturnError("");

        try {
            const token = await getToken();
            const response = await fetch(`${baseUrl}/api/orders/${order._id}/return`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ returnReason: returnReason.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to request return");
            }

            const updatedOrder = await response.json();

            // Update parent component
            if (onOrderUpdate) {
                onOrderUpdate(updatedOrder);
            }

            // Close modal and reset state
            setShowReturnModal(false);
            setReturnReason("");
        } catch (err: any) {
            setReturnError(err.message || "Failed to request return");
        } finally {
            setIsReturnSubmitting(false);
        }
    };

    const openReturnModal = () => {
        setShowReturnModal(true);
        setReturnError("");
        setReturnReason("");
    };

    const closeReturnModal = () => {
        if (!isReturnSubmitting) {
            setShowReturnModal(false);
            setReturnReason("");
            setReturnError("");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid":
            case "placed":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "confirmed":
                return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "shipped":
                return "bg-violet-50 text-violet-700 border-violet-200";
            case "delivered":
                return "bg-green-50 text-green-700 border-green-200";
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200";
            case "return_requested":
                return "bg-orange-50 text-orange-700 border-orange-200";
            case "returned":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    const timelineSteps = [
        { label: "Placed", status: "placed", icon: Package, date: order.createdAt },
        { label: "Confirmed", status: "confirmed", icon: CheckCircle2, date: order.createdAt },
        { label: "Shipped", status: "shipped", icon: Truck, date: null },
        { label: "Delivered", status: "delivered", icon: Home, date: null },
        { label: "Returned", status: "returned", icon: RotateCcw, date: order.returnApprovedAt },
    ];

    const currentStatusIndex = timelineSteps.findIndex(
        (step) => step.status === order.status
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                                #{order._id.slice(-8).toUpperCase()}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close drawer"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                        {/* Refund Badge */}
                        {(order.orderStatus === "returned" || order.paymentStatus === "refunded") && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-sm font-semibold text-emerald-700">Refund Initiated</span>
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Status</span>
                            <span
                                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                                    order.status
                                )}`}
                            >
                                {order.status}
                            </span>
                        </div>

                        {/* Timeline */}
                        <div className="bg-gray-50 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Order Timeline
                            </h3>
                            <div className="space-y-0">
                                {timelineSteps.map((step, index) => {
                                    const isCompleted = index <= currentStatusIndex;
                                    const isCurrent = index === currentStatusIndex;
                                    const StepIcon = step.icon;

                                    return (
                                        <div key={step.label} className="relative flex items-start gap-3 pb-6 last:pb-0">
                                            {/* Icon with connecting line */}
                                            <div className="relative flex flex-col items-center">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all z-10 ${isCompleted
                                                        ? isCurrent
                                                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"
                                                            : "bg-green-100 text-green-600"
                                                        : "bg-gray-200 text-gray-400"
                                                        }`}
                                                >
                                                    <StepIcon className="w-4 h-4" />
                                                </div>

                                                {/* Connecting Line */}
                                                {index < timelineSteps.length - 1 && (
                                                    <div
                                                        className={`w-0.5 h-full absolute top-8 transition-colors ${isCompleted ? "bg-green-300" : "bg-gray-200"
                                                            }`}
                                                    />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pt-1">
                                                <p
                                                    className={`text-sm font-semibold ${isCompleted ? "text-gray-900" : "text-gray-400"
                                                        }`}
                                                >
                                                    {step.label}
                                                </p>
                                                {step.date && isCompleted && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {new Date(step.date).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Products */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Products ({order.items.length})
                            </h3>
                            <div className="space-y-3">
                                {order.items.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow relative"
                                    >
                                        {/* Product Link wrapper - Overlay style for image and text */}
                                        <Link
                                            href={`/products/${(item.productId as any)?.slug || item.productId}`}
                                            className="absolute inset-x-0 inset-y-0 z-0"
                                            aria-label={`View ${item.name}`}
                                        />

                                        {/* Product Image */}
                                        <div className="w-16 h-16 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 border border-gray-200 relative z-10 pointer-events-none">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
                                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                                                {item.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Qty: {item.quantity}
                                            </p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">
                                                ₹
                                                {(
                                                    (item.price_cents / 100) *
                                                    item.quantity
                                                ).toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>

                                        {/* Action: Review */}
                                        {((order.status || "").toLowerCase() === 'delivered' || (order.orderStatus || "").toLowerCase() === 'delivered') && (
                                            <div className="flex flex-col justify-center relative z-20">
                                                {item.isReviewed ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 whitespace-nowrap">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Reviewed
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            onReviewProduct && onReviewProduct(item);
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-violet-700 transition-colors shadow-sm"
                                                    >
                                                        <Star className="w-3 h-3 fill-white" />
                                                        Review
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                Order Summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Items Total</span>
                                    <span className="font-semibold text-gray-900">
                                        ₹
                                        {(order.total_cents / 100).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Delivery</span>
                                    <span className="font-semibold text-green-600">Free</span>
                                </div>
                                <div className="pt-3 border-t border-gray-300 flex justify-between">
                                    <span className="font-bold text-gray-900">Total Paid</span>
                                    <span className="text-xl font-bold text-gray-900">
                                        ₹
                                        {(order.total_cents / 100).toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Shipping Address
                            </h3>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-900 font-medium">
                                    {order.shippingAddress.name || "Customer"}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {order.shippingAddress.street}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                                    {order.shippingAddress.zip}
                                </p>
                                {order.shippingAddress.phone && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        Phone: {order.shippingAddress.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons - Cancel or Return */}
                        {(canCancel || canReturn) && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900">Actions</h3>

                                {canCancel && (
                                    <button
                                        onClick={openCancelModal}
                                        className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition-colors border border-red-200 hover:border-red-300"
                                    >
                                        Cancel Order
                                    </button>
                                )}

                                {canReturn && (
                                    <button
                                        onClick={openReturnModal}
                                        className="w-full px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold rounded-lg transition-colors border border-orange-200 hover:border-orange-300"
                                    >
                                        Request Return
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Order Date */}
                        <div className="text-xs text-gray-500 text-center pb-4">
                            Order placed on{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Order Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
                        <p className="text-sm text-gray-600">
                            Please provide a reason for cancelling this order.
                        </p>

                        <textarea
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="e.g., Changed my mind, Found a better price, etc."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-700 focus:border-transparent resize-none text-sm placeholder:text-gray-400"
                            disabled={isCancelSubmitting}
                        />

                        {cancelError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {cancelError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={closeCancelModal}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                                disabled={isCancelSubmitting}
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isCancelSubmitting || !cancellationReason.trim()}
                            >
                                {isCancelSubmitting ? "Cancelling..." : "Cancel Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Request Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Request Return</h3>
                        <p className="text-sm text-gray-600">
                            Please provide a reason for returning this order.
                        </p>

                        <textarea
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="e.g., Product defective, Wrong size, etc."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-700 focus:border-transparent resize-none text-sm placeholder:text-gray-400"
                            disabled={isReturnSubmitting}
                        />

                        {returnError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {returnError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={closeReturnModal}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                                disabled={isReturnSubmitting}
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={handleRequestReturn}
                                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isReturnSubmitting || !returnReason.trim()}
                            >
                                {isReturnSubmitting ? "Submitting..." : "Request Return"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
