"use client"
import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Camera } from 'lucide-react';
import ImageSearchModal from './ImageSearchModal';
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

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

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            <Link href="/product?category=T-Shirts" className="hover:text-primary transition-colors">Men</Link>
            <Link href="/product?category=Dresses" className="hover:text-primary transition-colors">Women</Link>
            <Link href="/product?category=Jeans" className="hover:text-primary transition-colors">Kids</Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg hidden md:flex relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-md text-sm text-gray-900 shadow-md placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
              placeholder="Search for products..."
            />
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-primary transition-colors"
            >
              <Camera className="h-5 w-5 text-gray-500 hover:text-primary" />
            </button>
          </div>

          {/* Icons & Auth */}
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

            {/* 👇 THIS IS THE FIX: Added Link wrapper */}
            <Link href="/cart" className="flex flex-col items-center cursor-pointer group">
              <div className="relative">
                <ShoppingBag className="h-5 w-5 text-gray-600 group-hover:text-black" />
                {/* Optional: You can make this number dynamic later if you want */}
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