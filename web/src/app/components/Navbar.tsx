import Link from 'next/link';
import { Search, ShoppingBag, User, Camera } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm h-20">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <div className="w-8 h-8 bg-gradient-to-tr from-primary to-accent rounded-lg"></div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Eyoris</span>
        </Link>

        {/* Navigation - Desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          <Link href="/products?category=Men" className="hover:text-primary transition-colors">Men</Link>
          <Link href="/products?category=Women" className="hover:text-primary transition-colors">Women</Link>
          <Link href="/products?category=Kids" className="hover:text-primary transition-colors">Kids</Link>
          <Link href="/products?offer=true" className="text-accent hover:text-pink-600 transition-colors">Offers</Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg hidden md:flex relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
            placeholder="Search for products, brands and more"
          />
          <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-primary">
            <Camera className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center cursor-pointer group">
            <User className="h-5 w-5 text-gray-600 group-hover:text-black" />
            <span className="text-[10px] font-bold text-gray-600 mt-0.5 group-hover:text-black">Profile</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer group">
             <div className="relative">
                <ShoppingBag className="h-5 w-5 text-gray-600 group-hover:text-black" />
                <span className="absolute -top-1 -right-2 bg-primary text-white text-[9px] font-bold px-1 rounded-full">2</span>
             </div>
            <span className="text-[10px] font-bold text-gray-600 mt-0.5 group-hover:text-black">Bag</span>
          </div>
        </div>
      </div>
    </nav>
  );
}