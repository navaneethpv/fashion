"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Heart } from "lucide-react";
import ImageSearchModal from "./ImageSearchModal";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import SearchInput from "./SearchInput";
import { useCartCount } from "@/hooks/useCartCount";

function NavbarContent() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useUser();
  const cartCount = useCartCount();

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

        {/* ================= CATEGORY BAR ================= */}
        <div className="bg-black">
          <div className="max-w-7xl mx-auto h-[50px] flex items-center justify-center gap-12 text-white text-[13px] tracking-widest uppercase">
            <NavLink title="MEN" href="/product?gender=men" />
            <NavLink title="WOMEN" href="/product?gender=women" />
            <NavLink title="KIDS" href="/product?gender=kids" />
            <NavLink title="SHIRTS" href="/product?q=shirts" />
            <NavLink title="JEANS" href="/product?q=jeans" />
            <NavLink title="SHOES" href="/product?q=shoes" />
            <NavLink title="WATCH" href="/product?q=watch" />
            <NavLink title="NEWS" href="/product" />
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

function NavLink({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="relative pb-1 after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full"
    >
      {title}
    </Link>
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
