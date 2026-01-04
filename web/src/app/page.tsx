"use client";
import { useEffect, useState } from "react";
import Navbar from "./(pages)/components/Navbar";
import TrendingSlider from "./(pages)/components/TrendingSlider";
import AutoBanner from "./(pages)/components/AutoBanner";
import MostViewedSlider from "./(pages)/components/MostViewedSlider";
import Link from "next/link";
import OfferCarousel from "./(pages)/components/OfferCarousel";
import ServiceFeatures from "./(pages)/components/ServiceFeatures";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [homeData, setHomeData] = useState<{ trending: any[], offers: any[] }>({
    trending: [],
    offers: []
  });
  const [loading, setLoading] = useState(true);

  const base =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : process.env.NEXT_PUBLIC_API_BASE ||
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
    <div className="bg-white font-sans text-gray-900 selection:bg-gray-100 selection:text-black">
      <Navbar />

      {/* HERO SECTION */}
      <AutoBanner />

      {/* SERVICE FEATURES (Clean Bar) */}
      <ServiceFeatures />

      {/* TRENDING LOOKBOOK */}
      <motion.section
        className="max-w-[1500px] mx-auto px-6 py-24 md:py-32 min-h-[500px]"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        {loading ? (
          <div className="h-[400px] flex items-center justify-center text-center text-gray-300 font-light tracking-widest">
            LOADING COLLECTION...
          </div>
        ) : homeData.trending.length > 0 ? (
          <TrendingSlider products={homeData.trending} />
        ) : (
          <div className="py-24" />
        )}
      </motion.section>

      {/* EDITORIAL OFFERS */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <OfferCarousel />
      </motion.div>

      {/* MOST VIEWED LOOKBOOK */}
      <motion.div
        className="pb-24 min-h-[500px]"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <MostViewedSlider />
      </motion.div>

    </div>
  );
}
