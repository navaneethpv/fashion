"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Heart } from "lucide-react";
import ImageSearchModal from "./ImageSearchModal";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import SearchInput from "./SearchInput";

function NavbarContent() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useUser();

  return (
    <>
      {/* ================= TOP BAR ================= */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-[76px] flex items-center justify-between">

          {/* LEFT – BRAND */}
          <Link
            href="/"
            className="text-2xl font-semibold tracking-[5px] text-black"
          >
            EYORIS FASHION
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
                2
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

            {/* CLOTHES */}
            <MegaMenu title="Clothes" />

            {/* SHOES */}
            <MegaMenu title="Shoes" />

            {/* SHIRTS */}
            <MegaMenu title="Shirts" />

            {/* JEANS */}
            <MegaMenu title="Jeans" />

            {/* BELT */}
            <MegaMenu title="Belt" />

            {/* WATCH */}
            <MegaMenu title="Watch" />

            {/* NEWS */}
            <MegaMenu title="News" />

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
function MegaMenu({ title }: { title: string }) {
  return (
    <div className="relative group">
      {/* Top link */}
      <Link
        href={`/product?category=${title.toLowerCase()}`}
        className="relative pb-1 after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-white after:transition-all after:duration-300 group-hover:after:w-full"
      >
        {title}
      </Link>

      {/* Dropdown */}
      <div
        className="
          absolute left-1/2 -translate-x-1/2 top-full mt-6
          w-[900px] bg-white text-black
          opacity-0 invisible translate-y-4
          group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
          transition-all duration-300 ease-out
          shadow-2xl border border-gray-100
        "
      >
        <div className="grid grid-cols-3 gap-14 px-16 py-12 text-sm">

          {/* MEN */}
          <MenuColumn
            title="Men"
            items={[
              "Formal Shirts",
              "Formal Trousers",
              "Hat",
              "Loungewear",
              "Formal Accessories",
            ]}
          />

          {/* WOMEN */}
          <MenuColumn
            title="Women"
            items={[
              "Jackets & Coats",
              "Shirts",
              "Jumpers & Knitwear",
              "Pyjamas & Nightwear",
              "Jeans",
            ]}
          />

          {/* KIDS */}
          <MenuColumn
            title="Kids"
            items={[
              "All Winter Wear",
              "Sweatshirts & Hoodies",
              "Coats & Jackets",
              "Trousers & Pants",
              "Shorts & Skirts",
            ]}
          />

        </div>
      </div>
    </div>
  );
}
function MenuColumn({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h4 className="font-semibold mb-5 tracking-wide">{title}</h4>
      <ul className="space-y-3 text-gray-600">
        {items.map((item) => (
          <li key={item}>
            <Link
              href={`/product?subcategory=${item.replace(/\s+/g, "-").toLowerCase()}`}
              className="inline-block transition-all duration-200 hover:text-black hover:translate-x-1"
            >
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
