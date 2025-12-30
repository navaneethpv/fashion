
"use client";
import { useState, useEffect } from "react";
import { Plus, MapPin, Edit, Trash2, MoreVertical, CheckCircle2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import AddressForm from "./AddressForm";

interface AddressBookProps {
  clerkUser?: any;
  onSelect?: (address: any) => void;
  selectedId?: string;
}

export default function AddressBook({ clerkUser, onSelect, selectedId }: AddressBookProps) {
  const { getToken } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${baseUrl}/api/user/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${baseUrl}/api/user/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  // Set default logic is implicitly handled if the user edits and checks "default",
  // but we can add a quick button for it too.
  const handleSetDefault = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${baseUrl}/api/user/addresses/${id}/default`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error("Failed to set default", error);
    }
  }

  const openAdd = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const openEdit = (addr: any) => {
    setEditingAddress(addr);
    setIsFormOpen(true);
  };

  if (loading && addresses.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Saved Addresses</h3>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-gray-200"
        >
          <Plus className="w-5 h-5" /> Add New Address
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {addresses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No addresses saved yet.</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr._id}
              onClick={() => onSelect && onSelect(addr)}
              className={`relative p-6 rounded-2xl border transition-all cursor-pointer ${(selectedId === addr._id || (!selectedId && addr.isDefault))
                ? "bg-white border-black shadow-md ring-1 ring-black/5"
                : "bg-white border-gray-100 hover:border-gray-300"
                }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${(selectedId === addr._id || (!selectedId && addr.isDefault)) ? 'border-black' : 'border-gray-300'
                    }`}>
                    {(selectedId === addr._id || (!selectedId && addr.isDefault)) && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                  </span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md uppercase tracking-wide">
                    {addr.type}
                  </span>
                  {addr.isDefault && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-xs font-bold text-gray-400 hover:text-black hover:underline transition-colors mr-2"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(addr)}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full transition-all"
                    title="Edit Address"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-start gap-2">
                    <p className="text-sm font-bold text-gray-900 leading-relaxed block max-w-md">
                      {addr.street}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    {addr.city}, {addr.district}, {addr.state} - <span className="text-black font-bold">{addr.zip}</span>
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-2 flex items-center gap-2">
                    <span className="text-gray-400 font-normal text-xs uppercase tracking-wide">Mobile:</span> {addr.phone}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AddressForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchAddresses}
        initialData={editingAddress}
      />
    </div >
  );
}
