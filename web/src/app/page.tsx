"use client";
import { useEffect, useState } from "react";
import Navbar from "./(pages)/components/Navbar";
import TrendingSlider from "./(pages)/components/TrendingSlider";
import AutoBanner from "./(pages)/components/AutoBanner";
import MostViewedSlider from "./(pages)/components/MostViewedSlider";
import Link from "next/link";
import OfferCarousel from "./(pages)/components/OfferCarousel";

export default function Home() {
  const [homeData, setHomeData] = useState<{ trending: any[], mostViewed: any[], offers: any[] }>({
    trending: [],
    mostViewed: [],
    offers: []
  });
  const [loading, setLoading] = useState(true);

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  useEffect(() => {
    async function getHomeData() {
      try {
        const res = await fetch(`${baseUrl}/api/products/home`);
        if (!res.ok) throw new Error("Failed to fetch home data");
        const json = await res.json();

        setHomeData({
          trending: json.trending || [],
          mostViewed: json.mostViewed || [],
          offers: json.offers || []
        });
      } catch (err) {
        console.error("Failed to fetch home products:", err);
      } finally {
        setLoading(false);
      }
    }

    getHomeData();
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
        ) : homeData.trending.length > 0 ? (
          <TrendingSlider products={homeData.trending} />
        ) : (
          <div className="py-24 text-center "> {/* Cleaned up empty state */}
            {/* Silent fallback or simple message */}
          </div>
        )}
      </section>

      {/* MOST VIEWED SLIDER */}
      <MostViewedSlider products={homeData.mostViewed} />

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
