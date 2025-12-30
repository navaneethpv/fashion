"use client";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import {
  User,
  ShoppingBag,
  MapPin,
  ChevronRight,
  LogOut,
  Loader2,
  Link as LinkIcon,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import AccountInfo from "../components/profile/AccountInfo";
import OrderHistory from "../components/profile/OrderHistory";
import AddressBook from "../components/profile/AddressBook";
import WishlistTab from "../components/profile/WishlistTab";
import { SignInButton } from '@clerk/nextjs';

const PROFILE_COMPONENTS: { [key: string]: React.ElementType } = {
  account: AccountInfo,
  orders: OrderHistory,
  addresses: AddressBook,
  wishlist: WishlistTab,
};

const PROFILE_LINKS = [
  {
    id: "orders",
    name: "My Orders",
    description: "View, track, or cancel orders",
    icon: ShoppingBag,
    color: "text-gray-900", // Updated to neutral/premium
  },
  {
    id: "wishlist",
    name: "My Wishlist",
    description: "View and manage saved products",
    icon: Heart,
    color: "text-gray-900",
  },
  {
    id: "account",
    name: "Personal Information",
    description: "Edit your name, email, and password",
    icon: User,
    color: "text-gray-900",
  },
  {
    id: "addresses",
    name: "Manage Addresses",
    description: "View and update shipping addresses",
    icon: MapPin,
    color: "text-gray-900",
  },
];

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [activeTabId, setActiveTabId] = useState("main_dashboard");
  const [searchParams, setSearchParams] = useState<any>({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (tab) {
      setActiveTabId(tab);
    }
    setSearchParams(urlParams);
  }, []);

  const ActiveComponent = PROFILE_COMPONENTS[activeTabId];
  const activeTabName =
    PROFILE_LINKS.find((t) => t.id === activeTabId)?.name ||
    "Account Dashboard";

  // --- ANIMATION VARIANTS ---
  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  // --- RENDER FUNCTIONS ---

  const renderActiveTab = () => {
    if (!user || !ActiveComponent) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl p-6 md:p-12 shadow-[0_2px_40px_rgba(0,0,0,0.04)] border border-gray-100"
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-serif text-gray-900">
            {activeTabName}
          </h2>
          <Link
            href="/profile"
            onClick={() => setActiveTabId("main_dashboard")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black transition-all"
            aria-label="Close"
          >
            <span className="text-lg leading-none">&times;</span>
          </Link>
        </div>
        <ActiveComponent clerkUser={user} />
      </motion.div>
    );
  };

  const renderDashboardLinks = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {PROFILE_LINKS.map((link) => (
        <motion.div key={link.id} variants={itemVariants}>
          <Link
            href={`/profile?tab=${link.id}`}
            onClick={() => setActiveTabId(link.id)}
            className="group flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gray-50 rounded-2xl text-gray-600 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                <link.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-medium text-gray-900 group-hover:text-black transition-colors">
                  {link.name}
                </span>
                <span className="text-sm text-gray-500 font-medium opacity-80">
                  {link.description}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transform group-hover:translate-x-1 transition-all duration-300" />
          </Link>
        </motion.div>
      ))}

      <motion.div variants={itemVariants} className="pt-8">
        <button
          onClick={() => signOut()}
          className="w-full group flex items-center justify-between p-6 rounded-2xl border border-transparent hover:bg-red-50/40 transition-all duration-300"
        >
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-red-100 group-hover:text-red-500 transition-colors duration-300">
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-medium text-gray-500 group-hover:text-red-600 transition-colors">
                Log Out
              </span>
              <span className="text-sm text-gray-400 group-hover:text-red-400 transition-colors">
                Sign out of your account
              </span>
            </div>
          </div>
        </button>
      </motion.div>
    </motion.div>
  );

  // --- MAIN RENDER LOGIC ---

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
      </div>
    );
  }

  const isViewingTab = activeTabId !== "main_dashboard" && ActiveComponent;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-100">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 mb-20">
        {/* User Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-16 text-center md:text-left flex flex-col md:flex-row items-center gap-10"
        >
          {user ? (
            <>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative group"
              >
                <img
                  src={user.imageUrl}
                  alt="Avatar"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-xl shadow-gray-200/60 border-4 border-white"
                />
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
              </motion.div>

              <div className="flex flex-col items-center md:items-start space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em]">
                  Welcome Back
                </span>
                <h1 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 tracking-tight">
                  {user.fullName || user.username}
                </h1>
                <p className="text-sm text-gray-500 font-medium bg-gray-50/80 px-4 py-1.5 rounded-full mt-1">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </>
          ) : (
            // 🛑 GUEST USER VIEW 🛑
            <div className="w-full flex flex-col items-center justify-center text-center py-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6"
              >
                <User className="w-8 h-8 text-gray-400" />
              </motion.div>
              <h1 className="text-3xl font-serif font-medium text-gray-900 mb-2">
                Account Access
              </h1>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                Sign in to manage your orders, wishlist, and personal details.
              </p>

              <SignInButton mode="modal">
                <button className="bg-black text-white px-8 py-4 rounded-full font-medium tracking-wide hover:bg-gray-800 hover:scale-105 transition-all duration-300 flex items-center gap-3 shadow-xl shadow-gray-200">
                  <span className="uppercase text-xs font-bold tracking-widest">Sign In to Eyoris</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </SignInButton>
            </div>
          )}
        </motion.div>

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          {user ? (
            isViewingTab ? (
              renderActiveTab()
            ) : (
              renderDashboardLinks()
            )
          ) : null}
        </AnimatePresence>

        {/* Back Link (Breadcrumb style) */}
        {isViewingTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 pt-8 border-t border-gray-100 text-center"
          >
            <Link
              href="/profile"
              onClick={() => setActiveTabId("main_dashboard")}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Dashboard
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
