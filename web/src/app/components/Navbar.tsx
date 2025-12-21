"use client"
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import ImageSearchModal from './ImageSearchModal';
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import SearchInput from './SearchInput'; // 👈 CRITICAL: Import the new component

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchParams = useSearchParams();
  const { user } = useUser();

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
            <Link 
              href="/product?gender=men" 
              className={`transition-colors border-b-2 hover:text-primary ${
                searchParams.get('gender')?.toLowerCase() === 'men' 
                  ? 'text-primary border-primary' 
                  : 'border-transparent hover:border-primary'
              }`}
            >
              Men
            </Link>
            <Link 
              href="/product?gender=women" 
              className={`transition-colors border-b-2 hover:text-primary ${
                searchParams.get('gender')?.toLowerCase() === 'women' 
                  ? 'text-primary border-primary' 
                  : 'border-transparent hover:border-primary'
              }`}
            >
              Women
            </Link>
            <Link 
              href="/product?gender=kids" 
              className={`transition-colors border-b-2 hover:text-primary ${
                searchParams.get('gender')?.toLowerCase() === 'kids' 
                  ? 'text-primary border-primary' 
                  : 'border-transparent hover:border-primary'
              }`}
            >
              Kids
            </Link>
            <Link 
              href="/wishlist" 
              className="transition-colors border-b-2 hover:text-primary border-transparent hover:border-primary"
            >
              Wishlist
            </Link>
            <style jsx>{`
              /* Ensure the border doesn't cause layout shift by reserving space or using absolute positioning if needed, 
                 but border-b-2 transparent is robust enough. */
            `}</style>
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
                <Link href="/profile" className="flex items-center gap-2 cursor-pointer group">
                  <img 
                    src={user?.imageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 group-hover:border-primary transition"
                  />
                </Link>
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