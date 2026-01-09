"use client"
import { useState, useEffect } from 'react';
import { Star, Loader2, MessageSquare, CheckCircle, Quote } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
    _id: string;
    rating: number;
    comment: string;
    userName?: string;
    userAvatar?: string;
    createdAt: string;
}

const StarRatingDisplay = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <Star
                key={i}
                className={`w-3.5 h-3.5 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`}
            />
        ))}
    </div>
);

export default function ProductReviews({ productId }: { productId: string }) {
    const { user, isLoaded } = useUser();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newRating, setNewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focused, setFocused] = useState(false);

    const base =
        process.env.NEXT_PUBLIC_API_BASE ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:4000";
    const baseUrl = base.replace(/\/$/, "");

    // Fetch Reviews
    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${baseUrl}/api/reviews/${productId}`);
            const data = await res.json();
            setReviews(data);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (productId) fetchReviews();
    }, [productId]);

    // Submit Review
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isLoaded) return alert("Please sign in to leave a review.");
        if (newRating === 0) return alert("Please select a rating.");

        setIsSubmitting(true);
        try {
            const res = await fetch(`${baseUrl}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    productId: productId,
                    rating: newRating,
                    comment: newComment,
                    userName: user.fullName || user.firstName || "User",
                    userAvatar: user.imageUrl
                })
            });

            if (res.ok) {
                const savedReview = await res.json();

                // Construct enhanced review object for immediate display
                // If the user object is populated on backend, good. If not, we fall back to generic or current user.
                const enhancedReview = {
                    ...savedReview,
                    userId: {
                        _id: user.id,
                        name: user.fullName || user.firstName || 'User',
                        avatar: user.imageUrl
                    }
                };

                // Optimistic Update: Prepend and Limit to 10
                setReviews(prev => [enhancedReview, ...prev].slice(0, 10));

                setNewRating(0);
                setNewComment('');
                setFocused(false);
            } else {
                alert("Failed to submit review.");
            }
        } catch (error) {
            alert("Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pt-4 space-y-12">
            {/* Reviews List Section */}
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h4 className="font-bold text-xl text-gray-900">Customer Reviews</h4>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{reviews.length} Verified</span>
                </div>

                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-50 rounded-xl"></div>
                        ))}
                    </div>
                ) : !Array.isArray(reviews) || reviews.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-dashed border-gray-200"
                    >
                        <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-sm">
                            <MessageSquare className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-900 mb-1">No reviews yet</p>
                        <p className="text-sm text-gray-500">Be the first to share your experience with this product!</p>
                    </motion.div>
                ) : (
                    <motion.div layout className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {reviews.map((review: any) => (
                                <motion.div
                                    key={review._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {review.userAvatar ? (
                                                <img
                                                    src={review.userAvatar}
                                                    alt={review.userName || "User"}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                                                    {(review.userName || "A").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{review.userName || "Anonymous"}</p>
                                                <div className="flex items-center gap-2">
                                                    <StarRatingDisplay rating={review.rating} />
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    <span className="text-xs text-gray-400">Verified Purchaser</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-400">
                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    <div className="pl-14">
                                        <p className="text-gray-700 text-sm leading-relaxed relative">
                                            {review.comment}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

        </div>
    );
}