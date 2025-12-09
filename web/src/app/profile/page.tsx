"use client"
import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs'; 
import Navbar from '../components/Navbar';
import { User, ShoppingBag, MapPin, ChevronRight, LogOut, Loader2, Link as LinkIcon, Trash2 } from 'lucide-react'; // 👈 Adjusted Lucide Icons
import Link from 'next/link';
import AccountInfo from '../components/profile/AccountInfo';
import OrderHistory from '../components/profile/OrderHistory';
import AddressBook from '../components/profile/AddressBook';
// import { SignInButton } from '@clerk/nextjs';
// Define the available tabs (components remain the same)
const PROFILE_COMPONENTS: { [key: string]: React.ElementType } = {
  account: AccountInfo,
  orders: OrderHistory,
  addresses: AddressBook,
};

const PROFILE_LINKS = [
  { id: 'orders', name: 'My Orders', description: 'View, track, or cancel orders', icon: ShoppingBag, color: 'text-orange-500' },
  { id: 'account', name: 'Personal Information', description: 'Edit your name, email, and password', icon: User, color: 'text-blue-500' },
  { id: 'addresses', name: 'Manage Addresses', description: 'View and update shipping addresses', icon: MapPin, color: 'text-green-500' },
];


export default function ProfilePage() {
  const { user, isLoaded } = useUser(); // Get user state
  const [activeTabId, setActiveTabId] = useState('main_dashboard');
  const [searchParams, setSearchParams] = useState<any>({});
  
  // Use useEffect to read the URL query parameter for the active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
        setActiveTabId(tab);
    }
    setSearchParams(urlParams);
  }, []);

  const ActiveComponent = PROFILE_COMPONENTS[activeTabId];
  const activeTabName = PROFILE_LINKS.find(t => t.id === activeTabId)?.name || 'Account Dashboard';

  // --- RENDERING FUNCTIONS ---

  const renderActiveTab = () => {
    if (!user || !ActiveComponent) return null; // Only render if authenticated and component exists
    
    return (
      <section className="flex-1 bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2">{activeTabName}</h2>
        {/* Pass the fully loaded Clerk user object to the child component */}
        <ActiveComponent clerkUser={user} /> 
      </section>
    );
  }

  const renderDashboardLinks = () => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-4">
      {PROFILE_LINKS.map(link => (
        <Link
          key={link.id}
          href={`/profile?tab=${link.id}`}
          onClick={() => setActiveTabId(link.id)} // Set local state for fast UI update
          className="flex items-center justify-between p-4 border border-gray-100 hover:bg-gray-50 rounded-lg transition"
        >
          <div className="flex items-center gap-4">
            <link.icon className={`w-6 h-6 ${link.color}`} />
            <div>
              <p className="text-lg font-bold text-gray-900">{link.name}</p>
              <p className="text-xs text-gray-500">{link.description}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      ))}
      
      <button onClick={() => clerk.signOut()} className="flex items-center justify-between p-4 border border-gray-100 hover:bg-gray-50 rounded-lg transition mt-6">
        <div className="flex items-center gap-4">
          <LogOut className="w-6 h-6 text-red-500" />
          <p className="text-lg font-bold text-red-500">Log Out</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );

  // --- MAIN RENDER LOGIC ---

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  
  const isViewingTab = activeTabId !== 'main_dashboard' && ActiveComponent;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        
        {/* User Header Section */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8 flex items-center gap-6">
          {user ? (
            <>
              <img src={user.imageUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover shadow-inner" />
              <div>
                <p className="text-sm font-medium text-gray-500">Welcome back,</p>
                <h1 className="text-2xl font-black text-gray-900">{user.fullName || user.username}</h1>
              </div>
            </>
          ) : (
            // 🛑 GUEST USER VIEW 🛑
            <>
              <User className="w-16 h-16 text-gray-400 p-2 border rounded-full" />
              <div>
                <p className="text-sm font-medium text-gray-500">Hello, Guest</p>
                <h1 className="text-2xl font-black text-gray-900">Manage Your Account</h1>
              </div>
            </>
          )}
        </div>

        {/* Dynamic Content */}
        {user ? (
            // AUTHENTICATED: Show Dashboard or Active Tab
            isViewingTab ? renderActiveTab() : renderDashboardLinks()
        ) : (
            // GUEST: Show CTA
            <div className="bg-white p-8 rounded-xl text-center border-2 border-dashed border-gray-200 space-y-4 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900">Sign In to View Your Profile</h3>
                <p className="text-gray-600">Access your orders, saved addresses, and personal information.</p>
                <SignInButton mode="modal">
                    <button className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-violet-700 transition flex items-center justify-center mx-auto gap-2">
                        <LinkIcon className="w-4 h-4" /> Sign In Now
                    </button>
                </SignInButton>
            </div>
        )}

        {/* Back Link */}
        {isViewingTab && (
            <div className="mt-8 text-center">
                <Link href="/profile" onClick={() => setActiveTabId('main_dashboard')} className="text-primary font-bold hover:underline">
                    ← Back to Account Dashboard
                </Link>
            </div>
        )}
      </main>
    </div>
  );
}