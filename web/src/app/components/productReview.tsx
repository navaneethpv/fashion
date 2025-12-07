"use client"
import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react'; // Removed motion, AnimatePresence, ChevronDown
import { useUser } from '@clerk/nextjs';

interface Review {
    _id: string;
    rating: number;
    comment: string;
    createdAt: string;
}

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center text-yellow-500">
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`w-4 h-4 ${i <= rating ? 'fill-current' : 'text-gray-300'}`} />
        ))}
    </div>
);

// 🛑 THIS COMPONENT NO LONGER MANAGES ITS OWN OPEN/CLOSE STATE 🛑
export default function ProductReviews({ productId }: { productId: string }) {
    const { user, isLoaded } = useUser();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Reviews
    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:4000/api/reviews/${productId}`);
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
            const res = await fetch('http://localhost:4000/api/reviews', {
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
                alert("Review submitted successfully!");
                setNewRating(0);
                setNewComment('');
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
        <div className="pt-2"> 
            
            {/* A. Review Submission Form (Always visible within the collapsible section) */}
            <div className="border border-primary/20 bg-violet-50 p-6 rounded-xl mb-8">
                <h4 className="font-bold text-lg mb-4 text-gray-900">Add Your Review</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">Your Rating:</span>
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star 
                                key={i} 
                                onClick={() => setNewRating(i)}
                                className={`w-6 h-6 cursor-pointer transition-colors ${
                                    i <= newRating ? 'text-yellow-500 fill-current' : 'text-gray-300 hover:text-yellow-400'
                                }`}
                            />
                        ))}
                    </div>
                    <textarea
                        required
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts on this product..."
                        rows={4}
                        className="w-full p-3 border-2 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm text-gray-900"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || newRating === 0}
                        className="bg-primary bg-violet-300 text-gray-600 px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-violet-700 hover:cursor-pointer hover:text-white disabled:opacity-50 transition"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                    </button>
                </form>
            </div>
            
            {/* B. Reviews List (Always visible within the collapsible section) */}
            <h4 className="font-bold text-lg mb-4 text-gray-900 border-t pt-4">Latest Reviews</h4>
            {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
            ) : reviews.length === 0 ? (
                <p className="text-gray-900 text-sm">Be the first to review this product!</p>
            ) : (
                <div className="space-y-6">
                    {reviews.map(review => (
                        <div key={review._id} className="border-b pb-4">
                            <StarRating rating={review.rating} />
                            <p className="text-sm font-medium mt-1 text-gray-900">Reviewer: Anonymous</p>
                            <p className="text-gray-900 text-sm mt-2">{review.comment}</p>
                            <p className="text-xs text-gray-900 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
            
        </div>
    );
}