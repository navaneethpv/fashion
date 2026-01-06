"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const COLOR_MAP = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Grey', hex: '#6b7280' },
  { name: 'Orange', hex: '#f97316' }
];

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisData {
  gender: string | null;
  category: string | null;
  color: string | null;
}

export default function ImageSearchModal({ isOpen, onClose }: ImageSearchModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const base =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : process.env.NEXT_PUBLIC_API_BASE ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImageUrl(''); // Clear URL when file is selected
      setPreview(URL.createObjectURL(selectedFile));
      setAnalysis(null);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url.trim()) {
      setFile(null); // Clear file when URL is entered
      setPreview(url); // Use URL as preview
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    // Check if either file or URL is provided
    if (!file && !imageUrl.trim()) {
      alert('Please upload an image or enter an image URL');
      return;
    }

    setLoading(true);

    try {
      let res;

      // Use URL-based endpoint if imageUrl is provided
      if (imageUrl.trim()) {
        res = await fetch(`${baseUrl}/api/ai/visual-search/analyze-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: imageUrl.trim() }),
        });
      } else {
        // Use existing file upload endpoint
        const formData = new FormData();
        formData.append('image', file!);
        res = await fetch(`${baseUrl}/api/ai/visual-search/analyze`, {
          method: 'POST',
          body: formData,
        });
      }

      const data = await res.json();

      // Graceful Error Handling:
      // If AI fails (quota, error), we still want to redirect, just without AI params.
      if (!res.ok) {
        console.warn('AI Analysis Warning:', data.message || 'Unknown error');
        // Do NOT throw. We will treat as "no results" and just close helper or redirect with empty analysis.
        // Actually, for better UX, let's just alert a soft warning but let the flow continue if possible,
        // OR simply stop loading and maybe show "Standard Search" option.
        // Given instruction: "Allow fallback search logic to continue".
        // This implies we should probably redirect to products page anyway, potentially just with the image?
        // Wait, current flow redirects using *params* derived from analysis.
        // If analysis is empty, we can't really "search" by image properties.
        // BUT, if the backend `processSingleImage` worked (for upload), we have an image URL.
        // If only the *AI analysis* part failed, we might still have the uploaded image URL.

        // However, this modal specifically pushes to `/product?articleType=...`.
        // If AI failed, we have no params.
        // So we should probably just notify user "Smart features unavailable, redirecting..." or just stop.
        // "Allow fallback search" -> Requires params.
        // If we can't extract params, we can't filter.
        // CRITICAL FIX: Just stop the "crash" (loading spinner forever / error boundary).
        // Let's safe guard:
        alert("Smart features unavailable (Quota/Error). Please try standard filter search.");
        setLoading(false);
        return;
      }

      setAnalysis(data);

      // REDIRECT TO PRODUCT PAGE (Phase 3: Structured Filters)
      const params = new URLSearchParams();

      if (data.gender) params.set("gender", data.gender);
      if (data.category) params.set("category", data.category);
      if (data.color) params.set("color", data.color);

      onClose(); // Close modal
      router.push(`/product?${params.toString()}`);

    } catch (error: any) {
      console.error('Analysis failed:', error);
      // Soft fail - don't crash UI
      alert('Visual analysis temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const resetArr = () => {
    setFile(null);
    setImageUrl('');
    setPreview(null);
    setAnalysis(null);
  };

  const prefixIfRelative = (url?: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const base = process.env.NEXT_PUBLIC_API_BASE || (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000");
    return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  };



  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-accent" />
              Visual Search
            </h2>
            <p className="text-xs text-gray-400 mt-1">Similarity First & Color as Optional Filter</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Subtle animations and neutral backgrounds improve focus on products */}

          {/* 1. Upload Section */}
          {!analysis && !loading && (
            <div className="flex flex-col items-center justify-center h-full py-10 space-y-6">
              {preview ? (
                <div className="relative w-64 h-64 rounded-xl overflow-hidden shadow-lg border-4 border-white">
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-md h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-violet-50 transition-colors group"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary" />
                  </div>
                  <p className="font-medium text-gray-600">Click to upload photo</p>
                  <p className="text-xs text-gray-400 mt-2">Supports JPG, PNG (Max 5MB)</p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />

              {/* OR Divider + URL Input */}
              {!preview && (
                <>
                  <div className="flex items-center gap-4 w-full max-w-md">
                    <div className="h-px bg-gray-300 flex-1" />
                    <span className="text-xs font-bold text-gray-400">OR</span>
                    <div className="h-px bg-gray-300 flex-1" />
                  </div>

                  <div className="w-full max-w-md">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={handleUrlChange}
                      placeholder="Paste image URL here (https://...)"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                    {imageUrl.trim() && (
                      <button
                        onClick={handleAnalyze}
                        className="mt-3 w-full px-8 py-2.5 rounded-full font-bold text-sm bg-primary text-white hover:bg-violet-700 shadow-lg shadow-violet-200"
                      >
                        Analyze from URL
                      </button>
                    )}
                  </div>
                </>
              )}

              {preview && (
                <div className="flex gap-4">
                  <button onClick={resetArr} className="px-6 py-2.5 rounded-full font-bold text-sm border border-gray-300 hover:bg-gray-50">
                    Replace
                  </button>
                  <button
                    onClick={handleAnalyze}
                    className="px-8 py-2.5 rounded-full font-bold text-sm bg-violet-200 text-gray-700 hover:bg-violet-700 hover:text-white hover:cursor-pointer shadow-lg shadow-violet-200"
                  >
                    Analyze Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Analyzing style & category...</p>
              <p className="text-xs text-gray-400 mt-2">Using AI for one-time metadata extraction</p>
            </div>
          )}

          {/* 3. Results Section */}

        </div>
      </div>
    </div>
  );
}