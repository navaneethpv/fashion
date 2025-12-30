"use client";
import { useEffect, useState } from "react";
import Navbar from "./(pages)/components/Navbar";
import TrendingSlider from "./(pages)/components/TrendingSlider";
import AutoBanner from "./(pages)/components/AutoBanner";
import MostViewedSlider from "./(pages)/components/MostViewedSlider";
import Link from "next/link";
import OfferCarousel from "./(pages)/components/OfferCarousel";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  useEffect(() => {
    async function getTrendingProducts() {
      try {
        const res = await fetch(
          `${baseUrl}/api/products?limit=8&sort=price_desc`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setProducts(json.data || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    getTrendingProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <AutoBanner />

      {/* NEW: OFFER CAROUSEL */}
      <OfferCarousel />

      {/* TRENDING PRODUCTS */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        {/* HEADER */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="text-xs uppercase tracking-[4px] text-gray-500 mb-2">
              Discover
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">
              Trending Now
            </h2>
          </div>

          <Link
            href="/product"
            className="text-sm font-medium text-gray-700 hover:text-black transition flex items-center gap-2"
          >
            View All <span className="text-lg">→</span>
          </Link>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="py-24 text-center text-gray-500">
            Loading products...
          </div>
        ) : products.length > 0 ? (
          <TrendingSlider products={products} />
        ) : (
          <div className="py-24 text-center text-gray-500 border border-dashed border-gray-300">
            No products found. Please ensure the API server is running at{" "}
            <code>http://localhost:4000</code>.
          </div>
        )}
      </section>

      {/* MOST VIEWED SLIDER */}
      <MostViewedSlider products={products} />

      {/* PAGE ANIMATION */}
      <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
