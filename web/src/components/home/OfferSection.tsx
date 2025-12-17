"use client";

import { useRouter } from "next/navigation";
import OfferCard, { OfferFilters } from "./OfferCard";

interface OfferConfig {
  title: string;
  subtitle: string;
  filters: OfferFilters;
}

const OFFERS: OfferConfig[] = [
  {
    title: "Men’s Shirts Under ₹999",
    subtitle: "Smart casual shirts for work, dates, and everything in between.",
    filters: {
      gender: "Men",
      category: ["Shirts"],
      maxPrice: 999,
    },
  },
  {
    title: "Winter Collection",
    subtitle: "Layer up with premium sweatshirts, jackets and knitwear.",
    filters: {
      category: ["Jackets", "Sweatshirts", "Hoodies"],
      colors: ["Navy", "Charcoal", "Beige"],
    },
  },
  {
    title: "Footwear Essentials",
    subtitle: "Sneakers and everyday footwear that go with almost everything.",
    filters: {
      category: ["Footwear"],
      maxPrice: 2499,
    },
  },
  {
    title: "Dark Color Picks",
    subtitle: "Deep blacks, charcoal tones and rich night-ready outfits.",
    filters: {
      colors: ["Black", "Charcoal", "Midnight Blue"],
    },
  },
  {
    title: "Premium Styles",
    subtitle: "Elevated fits, finer fabrics and statement pieces for occasions.",
    filters: {
      category: ["Dresses", "Blazers", "Co-ords"],
      maxPrice: 4999,
    },
  },
];

function buildQueryString(filters: OfferFilters): string {
  const params = new URLSearchParams();

  if (filters.gender) {
    params.set("gender", filters.gender);
  }

  if (filters.category && filters.category.length > 0) {
    // Use first category for now – backend currently expects a single category string
    params.set("category", filters.category[0]);
  }

  if (typeof filters.maxPrice === "number") {
    params.set("maxPrice", String(filters.maxPrice));
  }

  if (filters.colors && filters.colors.length > 0) {
    params.set("colors", filters.colors.join(","));
  }

  return params.toString();
}

export default function OfferSection() {
  const router = useRouter();

  const handleOfferClick = (filters: OfferFilters) => {
    const query = buildQueryString(filters);
    // Current shop/products page lives at /product – keep URL simple for now
    const path = query ? `/product?${query}` : "/product";
    router.push(path);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 md:py-14">
      <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-1">
            Shop by mood
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Curated offers for how you dress today
          </h2>
        </div>
        <p className="hidden md:block text-xs text-gray-500 max-w-xs">
          Jump straight into themed edits instead of scrolling endlessly through
          categories.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {OFFERS.map((offer) => (
          <OfferCard
            key={offer.title}
            title={offer.title}
            subtitle={offer.subtitle}
            onClick={() => handleOfferClick(offer.filters)}
          />
        ))}
      </div>
    </section>
  );
}


