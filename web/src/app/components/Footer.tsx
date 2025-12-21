import Link from 'next/link';
import { Heart, ShoppingBag, User, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-tr from-primary to-accent rounded-lg"></div>
              <span className="text-2xl font-bold text-white">Eyoris Fashion</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Discover your perfect style with AI-powered fashion recommendations. 
              From everyday elegance to statement looks, style comes together effortlessly.
            </p>
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">contact@eyorisfashion.com</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wide">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/product?gender=men" className="hover:text-white transition">
                  Men's Fashion
                </Link>
              </li>
              <li>
                <Link href="/product?gender=women" className="hover:text-white transition">
                  Women's Fashion
                </Link>
              </li>
              <li>
                <Link href="/product?gender=kids" className="hover:text-white transition">
                  Kids' Fashion
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wide">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/profile" className="flex items-center gap-2 hover:text-white transition">
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="flex items-center gap-2 hover:text-white transition">
                  <Heart className="w-4 h-4" />
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/cart" className="flex items-center gap-2 hover:text-white transition">
                  <ShoppingBag className="w-4 h-4" />
                  Shopping Bag
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              © 2025 Eyoris Fashion. All rights reserved.
            </p>

            {/* Additional Links */}
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-white transition">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
