"use client"
import { useState, useEffect } from 'react';
import { Star, Loader2, MessageSquare, CheckCircle, Quote } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
    _id: string;
    rating: number;
    comment: string;
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
                })
            });

            if (res.ok) {
                setNewRating(0);
                setNewComment('');
                setFocused(false);
                fetchReviews(); // Refresh the list
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

            {/* A. Review Submission Form - Clean & Friendly */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none" />

                <div className="relative z-10 max-w-2xl">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">Write a Review</h4>
                    <p className="text-gray-500 text-sm mb-6">Share your thoughts on this product with others.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Interactive Stars */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Rating</label>
                            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setNewRating(i)}
                                        onMouseEnter={() => setHoverRating(i)}
                                        className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors duration-200 ${i <= (hoverRating || newRating)
                                                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                                                    : 'fill-gray-50 text-gray-200'
                                                }`}
                                        />
                                    </button>
                                ))}
                                <span className="ml-3 text-sm font-medium text-violet-600 min-w-[80px]">
                                    {(hoverRating || newRating) > 0 ? (
                                        ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][(hoverRating || newRating) - 1]
                                    ) : (
                                        <span className="text-gray-300">Select</span>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Comment Box */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Experience</label>
                            <div className={`relative rounded-xl border-2 transition-all duration-300 bg-gray-50/50 ${focused ? 'border-violet-600 ring-4 ring-violet-50 bg-white' : 'border-gray-100'}`}>
                                <textarea
                                    required
                                    value={newComment}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="What did you like or dislike? How was the fit?"
                                    rows={4}
                                    className="w-full p-4 bg-transparent outline-none text-sm text-gray-900 resize-none placeholder:text-gray-400"
                                    maxLength={500}
                                />
                                <div className="absolute bottom-3 right-3 text-[10px] font-medium text-gray-400 pointer-events-none">
                                    {newComment.length}/500
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || newRating === 0 || !newComment.trim()}
                                className="relative overflow-hidden bg-black text-white px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                                    </>
                                ) : (
                                    <>
                                        Post Review
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* B. Reviews List Section */}
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
                                            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                                                A
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Anonymous</p>
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