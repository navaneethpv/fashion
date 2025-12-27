"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Users, Package, LogOut, Loader2 } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import clsx from 'clsx';

// 👇 ADD YOUR ADMIN EMAIL ADDRESSES HERE
const ADMIN_EMAILS = [
  "navaneethpv450@gmail.com",
  "muhammadyaseen1907@gmail.com"  // Add more admin emails here
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Security Check
  useEffect(() => {
    if (isLoaded) {
      const email = user?.primaryEmailAddress?.emailAddress;

      if (!user || !email || !ADMIN_EMAILS.includes(email)) {
        // If not logged in OR email doesn't match, kick them out
        router.push('/');
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // Double check to prevent flash of content
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return null;
  }

  const menu = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
    { name: 'Users', icon: Users, href: '/admin/users' },
    { name: 'Products', icon: Package, href: '/admin/products' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex-shrink-0 fixed h-full z-10 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold tracking-tight">Eyoris<span className="text-purple-600">.</span> Admin</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 mt-4">Menu</p>
          {menu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl w-full transition">
            <LogOut className="w-5 h-5" />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{user.fullName}</p>
              <p className="text-xs text-green-600 font-bold">Administrator</p>
            </div>
            <UserButton />
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}