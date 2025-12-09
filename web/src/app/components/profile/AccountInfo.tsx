// web/src/components/profile/AccountInfo.tsx

import { UserResource } from "@clerk/types";
import { Mail, Phone, Calendar, User, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface AccountInfoProps {
  clerkUser: UserResource;
}

export default function AccountInfo({ clerkUser }: AccountInfoProps) {
  const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);
  
  return (
    <div className="space-y-10">
      
      {/* 🛑 HEADER CARD: User Info & Avatar 🛑 */}
      <div className="flex items-center gap-6 p-4 border-b border-gray-100">
        <img 
          src={clerkUser.imageUrl} 
          alt="Avatar" 
          // Use Clerk's styling for a branded look
          className="w-16 h-16 rounded-full object-cover border-4 border-primary/50 shadow-lg shadow-purple-200"
        />
        <div>
          <p className="text-2xl font-black text-gray-900">{clerkUser.fullName || 'Eyoris Customer'}</p>
          <p className="text-xs text-gray-500 mt-1">Clerk ID: {clerkUser.id.slice(-8)}</p>
        </div>
      </div>

      
      {/* 🛑 DETAIL GRID: Contact Information 🛑 */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-2">Contact Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          
          {/* Email Card */}
          <div className="flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md transition">
            <Mail className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs font-medium text-gray-500">Primary Email</p>
              <p className="font-semibold text-gray-800">{primaryEmail?.emailAddress || 'N/A'}</p>
            </div>
          </div>
          
          {/* Phone Card */}
          <div className="flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md transition">
            <Phone className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs font-medium text-gray-500">Phone Number</p>
              <p className="font-semibold text-gray-800">{clerkUser.phoneNumbers[0]?.phoneNumber || 'Not Set'}</p>
            </div>
          </div>
          
          {/* Join Date Card */}
          <div className="flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md transition">
            <Calendar className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs font-medium text-gray-500">Member Since</p>
              <p className="font-semibold text-gray-800">{clerkUser.createdAt ? new Date(clerkUser.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

        </div>
      </div>


      {/* 🛑 SETTINGS CARD: Security & Management (Myntra-style list link) 🛑 */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-xl font-bold mb-3 text-gray-800">Account Management</h3>
        
        <Link 
            href="https://dashboard.clerk.com" // Link to a place where they can manage
            target='_blank'
            className='flex items-center justify-between p-4 border border-purple-200 bg-purple-50 rounded-xl hover:bg-purple-100 transition shadow-lg shadow-purple-100/50'
        >
            <div className='flex items-center gap-4'>
                <ShieldCheck className='w-6 h-6 text-purple-600' />
                <span className='font-bold text-gray-900'>Update Password & Security Settings</span>
            </div>
            <ChevronRight className='w-5 h-5 text-purple-600' />
        </Link>
        
        <p className="text-xs text-gray-500 mt-2">
          This feature is managed securely by our authentication provider (Clerk).
        </p>

      </div>
    </div>
  );
}