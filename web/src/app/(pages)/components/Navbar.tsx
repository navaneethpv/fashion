"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Heart } from "lucide-react";
import ImageSearchModal from "./ImageSearchModal";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import SearchInput from "./SearchInput";
import { useCartCount } from "@/hooks/useCartCount";

import { useSearchParams } from "next/navigation";

const NAV_ITEMS = [
  { name: "MEN", href: "/product?gender=men", type: "gender", value: "men" },
  { name: "WOMEN", href: "/product?gender=women", type: "gender", value: "women" },
  { name: "KIDS", href: "/product?gender=kids", type: "gender", value: "kids" },
  { name: "SHIRTS", href: "/product?q=shirts", type: "query", value: "shirts" },
  { name: "JEANS", href: "/product?q=jeans", type: "query", value: "jeans" },
  { name: "SHOES", href: "/product?q=shoes", type: "query", value: "shoes" },
  { name: "WATCH", href: "/product?q=watch", type: "query", value: "watch" },
];

function NavbarContent() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useUser();
  const cartCount = useCartCount();
  const searchParams = useSearchParams();

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.type === "gender") return searchParams.get("gender") === item.value;
    if (item.type === "query") return searchParams.get("q") === item.value;
    return false;
  };

  return (
    <>
      {/* ================= TOP BAR ================= */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-[76px] flex items-center justify-between">

          {/* LEFT – BRAND */}
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition">
              <span className="text-white font-extrabold text-xl">E</span>
            </div>
            <span className="text-2xl font-extrabold tracking-wide text-black">
              Eyoris <span className="font-semibold text-gray-500">Fashion</span>
            </span>
          </Link>

          {/* RIGHT – SEARCH + ICONS */}
          <div className="flex items-center gap-6">

            {/* Search */}
            <div className="hidden md:flex items-center">
              <SearchInput
                onCameraClick={() => setIsSearchOpen(true)}
                className="w-[300px] xl:w-[400px]"
              />
            </div>

            {/* Wishlist */}
            <Link href="/wishlist" className="relative group">
              <Heart className="w-5 h-5 text-gray-700 group-hover:text-black transition" />
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] px-1 rounded-full">
                0
              </span>
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative group">
              <ShoppingBag className="w-5 h-5 text-gray-700 group-hover:text-black transition" />
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] px-1 rounded-full">
                {cartCount}
              </span>
            </Link>

            {/* Profile */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-gray-700 hover:text-black">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link href="/profile">
                <img
                  src={user?.imageUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border border-gray-300 object-cover hover:border-black transition"
                />
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* ================= CATEGORY HUB (Pill Style) ================= */}
        <div className="border-t border-gray-100 bg-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto py-2 px-4">
            <div className="flex items-center justify-start lg:justify-center gap-3 overflow-x-auto scrollbar-hide py-2 px-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      relative px-5 py-2.5 rounded-full text-sm font-semibold tracking-wider transition-all duration-300 whitespace-nowrap
                      ${active
                        ? "bg-black text-white shadow-md scale-[1.02]"
                        : "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-black hover:scale-[1.02]"
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>


      <ImageSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <nav className="h-[76px] flex items-center justify-center border-b">
          Loading...
        </nav>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
