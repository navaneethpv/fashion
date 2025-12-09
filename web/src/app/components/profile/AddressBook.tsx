// web/src/components/profile/AddressBook.tsx
import { UserResource } from "@clerk/types";
import { Plus, MapPin, Edit } from 'lucide-react';

interface AddressBookProps {
  clerkUser: UserResource;
}

export default function AddressBook({ clerkUser }: AddressBookProps) {
  // In a real app, you would fetch user.addresses from your MongoDB User document here
  const mockAddress = {
    street: "123 AI Boulevard",
    city: "San Francisco",
    state: "CA",
    zip: "94107",
    country: "US",
    isDefault: true,
  };

  return (
    <div className="space-y-6">
      <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-violet-700 transition">
        <Plus className="w-5 h-5" /> Add New Address
      </button>

      <div className="p-4 border-2 border-primary rounded-xl bg-violet-50 shadow-md">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-900">Default Address</h4>
            <span className="px-2 py-1 bg-primary text-white text-xs font-bold rounded-full">Primary</span>
        </div>
        <p className="text-sm text-gray-700">{mockAddress.street}</p>
        <p className="text-sm text-gray-700">{mockAddress.city}, {mockAddress.state} {mockAddress.zip}</p>
        <p className="text-sm text-gray-700 mt-1">{mockAddress.country}</p>
        <button className="text-xs font-medium text-primary hover:underline mt-4 flex items-center gap-1">
            <Edit className="w-3 h-3" /> Edit
        </button>
      </div>

    </div>
  );
}