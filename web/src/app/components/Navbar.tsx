"use client"
import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import ImageSearchModal from './ImageSearchModal';
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import SearchInput from './SearchInput'; // 👈 CRITICAL: Import the new component

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm h-20">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-accent rounded-lg"></div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Eyoris</span>
          </Link>

          {/* Links (Same as before) */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            <Link href="/product?gender=Men" className="hover:text-primary transition-colors">Men</Link>
            <Link href="/product?gender=Women" className="hover:text-primary transition-colors">Women</Link>
            <Link href="/product?gender=Kids" className="hover:text-primary transition-colors">Kids</Link>
          </div>

          {/* Search Bar (REPLACED) */}
          {/* 👈 Pass the modal function to the new component */}
          <SearchInput onCameraClick={() => setIsSearchOpen(true)} />

          {/* Icons & Auth (Same as before) */}
          <div className="flex items-center gap-6">
            
            <div className="flex items-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-bold text-gray-700 hover:text-primary">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            {/* Cart Link */}
            <Link href="/cart" className="flex flex-col items-center cursor-pointer group">
              <div className="relative">
                <ShoppingBag className="h-5 w-5 text-gray-600 group-hover:text-black" />
                <span className="absolute -top-1 -right-2 bg-primary text-white text-[9px] font-bold px-1 rounded-full">2</span>
              </div>
              <span className="text-[10px] font-bold text-gray-600 mt-0.5 group-hover:text-black">Bag</span>
            </Link>

          </div>
        </div>
      </nav>
      <ImageSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}