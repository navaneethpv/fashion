"use client"
import { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, ArrowRight, Filter, ChevronDown, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
  category: string;
  aiTags: string[];
  dominantColor: {
    name: string;
    hex: string;
    rgb: [number, number, number];
  };
}

export default function ImageSearchModal({ isOpen, onClose }: ImageSearchModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ colors: string[] }>({ colors: [] });
  const [sortBy, setSortBy] = useState<string>('similarity');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
    const baseUrl = base.replace(/\/$/, "");

  // Fetch results when analysis, filters, or sortBy changes
  useEffect(() => {
    if (analysis) {
      fetchResults();
    }
  }, [analysis, filters, sortBy]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImageUrl(''); // Clear URL when file is selected
      setPreview(URL.createObjectURL(selectedFile));
      setResults([]);
      setAnalysis(null);
      setFilters({ colors: [] });
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url.trim()) {
      setFile(null); // Clear file when URL is entered
      setPreview(url); // Use URL as preview
      setResults([]);
      setAnalysis(null);
      setFilters({ colors: [] });
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
      
      if (!res.ok) {
        throw new Error(data.message || 'Analysis failed');
      }
      
      setAnalysis(data);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      alert(error.message || 'Error analyzing image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    if (!analysis) return;

    try {
      const res = await fetch(`${baseUrl}/api/ai/visual-search/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: analysis.category,
          aiTags: analysis.aiTags,
          dominantColor: analysis.dominantColor,
          filters,
          sortBy
        }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Fetching results failed:', error);
    }
  };

  const toggleColorFilter = (color: string) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color) 
        ? prev.colors.filter(c => c !== color) 
        : [...prev.colors, color]
    }));
  };

  const resetArr = () => {
    setFile(null);
    setImageUrl('');
    setPreview(null);
    setResults([]);
    setAnalysis(null);
    setFilters({ colors: [] });
    setSortBy('similarity');
  };

  const prefixIfRelative = (url?: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const base = process.env.NEXT_PUBLIC_API_BASE || (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000");
    return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  };

  const resolveImageUrl = (product: any) => {
    const imgs = product.images;
    if (!imgs) return '';
    if (typeof imgs === "string") return imgs.trim() ? prefixIfRelative(imgs) : '';
    if (Array.isArray(imgs) && imgs.length > 0) {
      const first = imgs[0];
      if (!first) return '';
      if (typeof first === "string") return prefixIfRelative(first);
      return prefixIfRelative((first as any).url);
    }
    return '';
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
          {analysis && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 bg-gray-200 -m-6 p-6 rounded-lg"
            >
              {/* Subtle animations and neutral backgrounds improve focus on products */}
              {/* Analysis Summary Header */}
              <div className="flex flex-col md:flex-row gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 relative group/info">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md">
                    <Image src={preview!} alt="Original" fill className="object-cover" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300" />
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-12 h-12 rounded-lg shadow-inner border border-black/5"
                      style={{ backgroundColor: analysis.dominantColor?.hex || '#ccc' }}
                    />
                    <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{analysis.dominantColor?.name || 'Unknown'}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                      Detected Category: {analysis.category}
                    </span>
                    <button onClick={resetArr} className="text-xs font-semibold text-gray-400 hover:text-primary transition ml-auto">
                      Start Over
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900">Found {results.length} Structurally Similar Items</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.aiTags.map(tag => (
                      <span key={tag} className="text-[11px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Explainability Tollip */}
                <div className="absolute right-4 bottom-4 md:static md:flex md:items-end">
                   <div className="group relative">
                      <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-[10px] text-gray-400 cursor-help">?</div>
                      <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                        <p className="font-bold mb-1">Explainable Search Logic:</p>
                        <ul className="list-disc ml-3 space-y-1 text-gray-300">
                          <li>AI extracts metadata (category, tags) once.</li>
                          <li>Primary search uses category & tags for structural match.</li>
                          <li>Color is optional - use filters to refine by shade.</li>
                          <li>Distance logic used for color similarity sorting.</li>
                        </ul>
                      </div>
                   </div>
                </div>
              </div>

              {/* Controls: Filter & Sort */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative">
                    <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition border ${isFilterOpen ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary'}`}
                    >
                      <Filter className="w-4 h-4" />
                      Refine by Color
                      {filters.colors.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white text-primary rounded-full text-[10px]">{filters.colors.length}</span>}
                    </button>

                    {/* Color Filter Dropdown */}
                    <AnimatePresence>
                      {isFilterOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute top-full left-0 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-72"
                        >
                          <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Select Colors</p>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_MAP.map(color => (
                              <motion.button
                                key={color.name}
                                onClick={() => toggleColorFilter(color.name)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-7 h-7 rounded-sm border-2 transition-all ${
                                  filters.colors.includes(color.name) 
                                    ? 'border-gray-900 scale-110 shadow-md' 
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                              />
                            ))}
                          </div>
                          {filters.colors.length > 0 && (
                             <button onClick={() => setFilters({ colors: [] })} className="mt-4 text-[10px] font-bold text-red-500 uppercase hover:underline">Clear Filters</button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex-1 md:flex-none" />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto bg-gray-50 px-3 py-1.5 rounded-lg border">
                  <span className="text-xs font-bold text-gray-400">SORT BY:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option value="similarity">Structural Similarity</option>
                    <option value="color">Color Similarity</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Grid */}
              <motion.div 
                layout
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
              >
                {results.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {results.map((product: any, index: number) => (
                      <motion.div
                        key={product.slug}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ 
                          duration: 0.35, 
                          delay: index % 10 * 0.05,
                          ease: "easeOut" 
                        }}
                      >
                        <Link href={`/products/${product.slug}`} onClick={onClose} className="group block">
                          <motion.div 
                            whileHover={{ y: -4, scale: 1.02 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white mb-3 shadow-sm group-hover:shadow-lg transition-all duration-200"
                          >
                            <Image 
                              src={resolveImageUrl(product)} 
                              alt={product.name} 
                              fill 
                              quality={95}
                              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-400" 
                            />
                            
                            {/* Similarity Badge */}
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-primary text-[10px] font-black px-2 py-1 rounded-lg border border-primary/10 shadow-sm flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulss" />
                              {product.similarity}% MATCH
                            </div>
    
                            {/* Color Preview */}
                            {product.dominantColor?.hex && (
                              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
                                <div className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ backgroundColor: product.dominantColor.hex }} />
                                <span className="text-[9px] font-bold text-white uppercase">{product.dominantColor.name || 'Unknown'}</span>
                              </div>
                            )}
                          </motion.div>
                          <div className="space-y-1 px-1">
                            <h4 className="font-bold text-sm text-gray-900 truncate leading-none">{product.name}</h4>
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-black text-primary">₹{(product.price || 0).toFixed(2)}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{product.brand}</p>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-20 text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <Filter className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No matches found with current filters.</p>
                    <button onClick={() => setFilters({ colors: [] })} className="text-primary font-bold text-sm hover:underline">Clear all filters</button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}