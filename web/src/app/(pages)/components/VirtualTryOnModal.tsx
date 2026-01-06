"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Check, Loader2, Info } from "lucide-react";
import Image from "next/image";

interface VirtualTryOnModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    productImage: string;
    productType: string;
}

export default function VirtualTryOnModal({
    isOpen,
    onClose,
    productName,
    productImage,
    productType,
}: VirtualTryOnModalProps) {
    const [step, setStep] = useState<"upload" | "processing" | "result">("upload");
    const [userImage, setUserImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Validate File Type (JPG/PNG only)
        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!validTypes.includes(file.type)) {
            setError("Please upload a JPG or PNG image.");
            return;
        }

        // 2. Validate File Size (Max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError("Image size exceeds 5MB. Please upload a smaller file.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setUserImage(reader.result as string);
            // Stay on upload step to show preview
        };
        reader.readAsDataURL(file);
    };

    const startTryOn = async () => {
        if (!userImage) return;
        setStep("processing");
        setError(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const res = await fetch(`${API_URL}/api/try-on/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userImage, // base64
                    productImage,
                    productType
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || data.message || 'Failed to generate preview');
            }

            const data = await res.json();
            setGeneratedImage(data.generatedImageUrl);
            setStep("result");
        } catch (err: any) {
            console.error('Try-On Error:', err);
            setError(err.name === 'AbortError' ? 'Request timed out. Please try again.' : err.message || "Failed to process try-on. Please try again.");
            setStep("upload");
        }
    };

    const resetModal = () => {
        setStep("upload");
        setUserImage(null);
        setGeneratedImage(null);
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-xl font-serif font-medium text-gray-900">
                                Virtual Try-On
                            </h2>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                                Prototype Feature (AI)
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-8">
                        {step === "upload" && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-900">Pro Tip</h4>
                                        <p className="text-xs text-amber-700 font-medium">
                                            Upload a clear image of your hand / neck depending on the product
                                        </p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600 text-center animate-in fade-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}

                                <div className="relative group border-2 border-dashed border-gray-200 hover:border-black rounded-3xl transition-all duration-300 min-h-[280px] flex items-center justify-center">
                                    {!userImage ? (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" />
                                                </div>
                                                <p className="text-lg font-medium text-gray-900 mb-2">
                                                    Click to upload or drag & drop
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Supports JPG, PNG (Max 5MB)
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="relative w-full h-full p-4 flex flex-col items-center">
                                            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-lg mb-4">
                                                <img
                                                    src={userImage}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    onClick={() => setUserImage(null)}
                                                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full transition-all shadow-sm"
                                                >
                                                    <X className="w-3.5 h-3.5 text-gray-500" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium mb-6">Image ready for Try-On</p>
                                            <button
                                                onClick={startTryOn}
                                                className="w-full max-w-xs py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-gray-100"
                                            >
                                                Generate Preview
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === "processing" && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-8">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-3xl border border-gray-100 overflow-hidden shadow-xl">
                                        {userImage && (
                                            <img
                                                src={userImage}
                                                alt="User"
                                                className="w-full h-full object-cover grayscale opacity-50"
                                            />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-black animate-spin" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-serif font-medium text-gray-900 mb-2 italic">
                                        AI is analyzing your photo...
                                    </h3>
                                    <p className="text-sm text-gray-400 animate-pulse">
                                        Mapping product to your proportions
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === "result" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Original</p>
                                        <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner">
                                            {userImage && (
                                                <img
                                                    src={userImage}
                                                    alt="User Original"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-black uppercase tracking-widest px-1 flex items-center gap-2">
                                            <Check className="w-3 h-3 text-emerald-500" /> AI Preview
                                        </p>
                                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border-2 border-black bg-gray-50 shadow-2xl">
                                            {userImage && (
                                                <img
                                                    src={userImage}
                                                    alt="User with Product"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                            {/* PROTOTYPE OVERLAY: Mocking the product being 'tried on' */}
                                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center p-12">
                                                <motion.div
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
                                                    className="relative w-full h-full flex items-center justify-center"
                                                >
                                                    <img
                                                        src={generatedImage || productImage}
                                                        alt={productName}
                                                        className="w-3/4 h-3/4 object-contain drop-shadow-2xl mix-blend-multiply opacity-90 rotate-[-15deg]"
                                                    />
                                                </motion.div>
                                            </div>
                                            <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                                                Prototype View
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={resetModal}
                                        className="flex-1 py-4 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:border-black transition-all"
                                    >
                                        Try another photo
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                                    >
                                        Close Preview
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
