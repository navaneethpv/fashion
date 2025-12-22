"use client";
import { useState, useRef } from "react";
import {
  Mail,
  Phone,
  Calendar,
  User,
  ShieldCheck,
  ChevronRight,
  Edit2,
  Check,
  X,
  Camera,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface AccountInfoProps {
  clerkUser: any; // Using any since @clerk/types is not installed
}

export default function AccountInfo({ clerkUser }: AccountInfoProps) {
  const primaryEmail = clerkUser.emailAddresses.find(
    (e: any) => e.id === clerkUser.primaryEmailAddressId
  );

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState(clerkUser.firstName || "");
  const [lastName, setLastName] = useState(clerkUser.lastName || "");
  const [isSavingName, setIsSavingName] = useState(false);

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle name update
  const handleSaveName = async () => {
    if (!firstName.trim()) {
      alert("First name cannot be empty");
      return;
    }

    setIsSavingName(true);
    try {
      await clerkUser.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setIsEditingName(false);
    } catch (error) {
      console.error("Name update failed:", error);
      alert("Failed to update name. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setFirstName(clerkUser.firstName || "");
    setLastName(clerkUser.lastName || "");
    setIsEditingName(false);
  };

  // Handle photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await clerkUser.setProfileImage({ file });
      // Optionally show success message
    } catch (error) {
      console.error("Photo upload failed:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* 🛑 HEADER CARD: User Info & Avatar with Edit Options 🛑 */}
      <div className="flex items-center gap-6 p-4 border-b border-gray-100">
        {/* Profile Photo with Upload */}
        <div className="relative">
          <img
            src={clerkUser.imageUrl}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover border-4 border-primary/50 shadow-lg shadow-purple-200"
          />
          {/* Upload Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 hover:bg-violet-700 shadow-lg transition disabled:opacity-50"
            title="Change profile photo"
          >
            {isUploadingPhoto ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Name with Edit Option */}
        <div className="flex-1">
          {isEditingName ? (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Edit Name
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={isSavingName}
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={isSavingName}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-base font-bold hover:bg-violet-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingName ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-base">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span className="text-base">Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSavingName}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 bg-white rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {clerkUser.fullName || "Eyoris Customer"}
                </p>
                <p className="text-xs text-gray-700 mt-1 font-medium">
                  Clerk ID: {clerkUser.id.slice(-8)}
                </p>
              </div>
              <button
                onClick={() => setIsEditingName(true)}
                className="ml-2 p-1.5 hover:bg-gray-100 rounded-full transition text-gray-700 hover:text-gray-900"
                title="Edit name"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🛑 DETAIL GRID: Contact Information 🛑 */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
          Contact Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          {/* Email Card */}
          <div className="flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md transition">
            <Mail className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs font-bold text-gray-700">Primary Email</p>
              <p className="font-semibold text-gray-900">
                {primaryEmail?.emailAddress || "N/A"}
              </p>
            </div>
          </div>

          {/* Phone Card */}
          <div className="flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md transition">
            <Phone className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs font-bold text-gray-700">Phone Number</p>
              <p className="font-semibold text-gray-900">
                {clerkUser.phoneNumbers[0]?.phoneNumber || "Not Set"}
              </p>
            </div>
          </div>

          {/* Join Date Card */}
          <div className="flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md transition">
            <Calendar className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs font-bold text-gray-700">Member Since</p>
              <p className="font-semibold text-gray-900">
                {clerkUser.createdAt
                  ? new Date(clerkUser.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🛑 SETTINGS CARD: Security & Management 🛑 */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-xl font-bold mb-3 text-gray-900">
          Account Management
        </h3>

        <Link
          href="https://dashboard.clerk.com"
          target="_blank"
          className="flex items-center justify-between p-4 border border-purple-200 bg-purple-50 rounded-xl hover:bg-purple-100 transition shadow-lg shadow-purple-100/50"
        >
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-gray-900">
              Update Password & Security Settings
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-600" />
        </Link>

        <p className="text-xs text-gray-700 mt-2 font-medium">
          This feature is managed securely by our authentication provider
          (Clerk).
        </p>
      </div>
    </div>
  );
}
