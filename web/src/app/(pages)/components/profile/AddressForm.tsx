
"use client";
import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";

interface AddressFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // If present, we are editing
}

export default function AddressForm({ isOpen, onClose, onSuccess, initialData }: AddressFormProps) {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        street: "",
        city: "",
        district: "",
        state: "",
        zip: "",
        phone: "",
        type: "Home",
        isDefault: false,
    });

    useEffect(() => {
        if (initialData) {
            // Remove +91 prefix for editing if stored with it
            const cleanPhone = initialData.phone.replace(/^\+91/, "");
            setFormData({
                name: initialData.name || "",
                street: initialData.street || "",
                city: initialData.city || "",
                district: initialData.district || "",
                state: initialData.state || "",
                zip: initialData.zip || "",
                phone: cleanPhone,
                type: initialData.type || "Home",
                isDefault: initialData.isDefault || false,
            });
        } else {
            // Reset for new address
            setFormData({
                name: user?.fullName || "",
                street: "",
                city: "",
                district: "",
                state: "",
                zip: "",
                phone: "",
                type: "Home",
                isDefault: false,
            });
        }
        setError("");
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            // Only digits, max 10
            const val = value.replace(/\D/g, "").slice(0, 10);
            setFormData((prev) => ({ ...prev, [name]: val }));
        } else if (name === "zip") {
            // Only digits, max 6
            const val = value.replace(/\D/g, "").slice(0, 6);
            setFormData((prev) => ({ ...prev, [name]: val }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validation
        if (formData.phone.length !== 10) {
            setError("Please enter a valid 10-digit mobile number.");
            setLoading(false);
            return;
        }
        if (formData.zip.length !== 6) {
            setError("Please enter a valid 6-digit Pincode.");
            setLoading(false);
            return;
        }

        try {
            const token = await getToken();
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

            const payload = {
                ...formData,
                phone: `+91${formData.phone}`, // Enforce prefix
                country: "India", // Fixed
            };

            let url = `${baseUrl}/api/user/addresses`;
            let method = "POST";

            if (initialData) {
                url = `${baseUrl}/api/user/addresses/${initialData._id}`;
                method = "PUT";
            }

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to save address");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl sm:rounded-2xl"
                role="dialog"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? "Edit Address" : "Add New Address"}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                        <input
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Full Name"
                            className="w-full p-3 sm:p-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium text-gray-900 text-sm sm:text-base"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pincode</label>
                            <input
                                name="zip"
                                type="text"
                                required
                                value={formData.zip}
                                onChange={handleChange}
                                placeholder="6-digit Pincode"
                                className="w-full p-3 sm:p-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium text-gray-900 text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone (+91)</label>
                            <div className="flex">
                                <span className="min-w-[48px] flex items-center justify-center px-3 bg-gray-100 border border-gray-100 border-r-0 rounded-l-xl text-gray-500 font-bold text-sm">+91</span>
                                <input
                                    name="phone"
                                    type="text"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="10-digit Number"
                                    className="w-full p-3 sm:p-3.5 bg-gray-50 border border-transparent rounded-r-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium text-gray-900 text-sm sm:text-base"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">City</label>
                            <input
                                name="city"
                                type="text"
                                required
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full p-3 sm:p-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium text-gray-900 text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">State</label>
                            <input
                                name="state"
                                type="text"
                                required
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full p-3 sm:p-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium text-gray-900 text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">District</label>
                            <input
                                name="district"
                                type="text"
                                required
                                value={formData.district}
                                onChange={handleChange}
                                className="w-full p-3 sm:p-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium text-gray-900 text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Address (Area and Street)</label>
                        <textarea
                            name="street"
                            required
                            rows={3}
                            value={formData.street}
                            onChange={handleChange as any}
                            className="w-full p-3 sm:p-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition-all font-medium text-gray-900 resize-none min-h-[96px] sm:min-h-[72px] text-sm sm:text-base"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Address Type</label>
                        <div className="flex gap-3 mt-1">
                            {['Home', 'Work', 'Other'].map((type) => (
                                <label key={type} className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value={type}
                                        checked={formData.type === type}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="py-2 text-center rounded-lg border border-gray-200 text-gray-500 font-medium text-sm transition-all peer-checked:border-black peer-checked:bg-black peer-checked:text-white hover:border-gray-300">
                                        {type}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 py-1">
                        <input
                            type="checkbox"
                            id="defaultCheck"
                            name="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <label htmlFor="defaultCheck" className="text-sm font-medium text-gray-700 select-none cursor-pointer">Make this my default address</label>
                    </div>

                    <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-gray-900 font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {initialData ? "Update Address" : "Save Address"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
