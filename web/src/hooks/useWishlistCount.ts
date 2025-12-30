"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function useWishlistCount() {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const [count, setCount] = useState(0);

    const fetchWishlistCount = async () => {
        if (!user) {
            setCount(0);
            return;
        }

        try {
            const token = await getToken();
            const base =
                process.env.NEXT_PUBLIC_API_BASE ||
                process.env.NEXT_PUBLIC_API_URL ||
                "http://localhost:4000";
            const baseUrl = base.replace(/\/$/, "");

            const res = await fetch(`${baseUrl}/api/wishlist?userId=${user.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setCount(data.count || 0);
            }
        } catch (err) {
            console.error("Failed to fetch wishlist count:", err);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            fetchWishlistCount();
        }
    }, [isLoaded, user]);

    useEffect(() => {
        const handleWishlistUpdate = () => {
            fetchWishlistCount();
        };

        window.addEventListener("wishlist-updated", handleWishlistUpdate);
        return () => window.removeEventListener("wishlist-updated", handleWishlistUpdate);
    }, [isLoaded, user]);

    return count;
}
