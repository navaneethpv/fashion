"use client";

import { useState } from "react";
import { Star, Loader2, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    orderId: string;
    productId: string;
    productName: string;
    productImage: string;
}

export default function ReviewModal({
    isOpen,
    onClose,
    onSuccess,
    orderId,
    productId,
    productName,
    productImage,
}: ReviewModalProps) {
    const { user, isLoaded } = useUser();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focused, setFocused] = useState(false);

    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const baseUrl = base.replace(/\/$/, "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isLoaded) return;
        if (rating === 0) return alert("Please select a rating.");

        setIsSubmitting(true);
        try {
            const res = await fetch(`${baseUrl}/api/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    productId,
                    orderId,
                    rating,
                    comment,
                    userName: user.fullName || user.firstName || "User",
                    userAvatar: user.imageUrl,
                }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const errorData = await res.json();
                alert(errorData.message || "Failed to submit review.");
            }
        } catch (error) {
            alert("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[80vh]">
                        {/* Product Info */}
                        <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl">
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-white">
                                <Image
                                    src={productImage}
                                    alt={productName}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 line-clamp-1">
                                    {productName}
                                </h4>
                                <p className="text-xs text-gray-500 font-mono">
                                    Order ID: #{orderId.slice(-6).toUpperCase()}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Star Rating */}
                            <div className="flex flex-col items-center gap-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Rate your experience
                                </label>
                                <div
                                    className="flex items-center gap-1"
                                    onMouseLeave={() => setHoverRating(0)}
                                >
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setRating(i)}
                                            onMouseEnter={() => setHoverRating(i)}
                                            className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                        >
                                            <Star
                                                className={`w-10 h-10 transition-colors duration-200 ${i <= (hoverRating || rating)
                                                        ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                                        : "fill-gray-50 text-gray-200"
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <span className="text-sm font-bold text-black h-5">
                                    {rating > 0 &&
                                        [
                                            "Poor",
                                            "Fair",
                                            "Good",
                                            "Very Good",
                                            "Excellent",
                                        ][rating - 1]}
                                </span>
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Your Feedback
                                </label>
                                <div
                                    className={`relative rounded-2xl border-2 transition-all duration-300 bg-gray-50/50 ${focused
                                            ? "border-black ring-4 ring-gray-100 bg-white"
                                            : "border-gray-100"
                                        }`}
                                >
                                    <textarea
                                        required
                                        value={comment}
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="What did you like or dislike? How was the fit?"
                                        rows={4}
                                        className="w-full p-4 bg-transparent outline-none text-sm text-gray-900 resize-none placeholder:text-gray-400"
                                        maxLength={500}
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] font-medium text-gray-400 pointer-events-none">
                                        {comment.length}/500
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || rating === 0 || !comment.trim()}
                                className="w-full bg-black text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-xl shadow-gray-200"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Review"
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
