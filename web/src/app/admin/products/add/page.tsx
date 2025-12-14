"use client"

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Plus, ArrowLeft, Image as ImageIcon, Trash2, Upload, X, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';
import { useCategorySuggest } from '../../../../hooks/useCategorySuggest';

// --- Type Definitions ---
interface ImageInput {
  type: 'file' | 'url';
  id: number;
  value: File | string;
  preview: string;
}

// --- Component ---
export default function AddProductPage() {
  // --- States for UI and Submission ---
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // --- AI Hook Integration ---
  const { suggestCategory, suggestedCategory, isSuggesting, setSuggestedCategory } = useCategorySuggest();

  // --- Image Management State ---
  const [imageInputs, setImageInputs] = useState<ImageInput[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextImageId = useRef(0);

  // --- Form Data State ---
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: '',
    category: 'Apparel', // Locked as per your backend model
    subCategory: '',      // This is the new field the user will select
    price: '',
    description: ''
  });

  // --- Variant Management State ---
  const [variants, setVariants] = useState([{ size: 'S', stock: 20 }, { size: 'M', stock: 20 }, { size: 'L', stock: 20 }]);

  // --- State for Searchable SubCategory Dropdown ---
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- Logic Hooks ---
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/subcategories`)
      .then((res) => res.json())
      .then((data) => {
        setSubCategories(data);
        setFilteredSubCategories(data);
      })
      .catch((err) => console.error("Subcategory fetch failed", err));
  }, []);

  useEffect(() => {
    setFilteredSubCategories(
      subCategories.filter((sc) => sc.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, subCategories]);

  useEffect(() => {
    if (suggestedCategory) {
      setFormData(prev => ({ ...prev, subCategory: suggestedCategory }));
      setSearch("");
      setIsDropdownOpen(false);
      setSuggestedCategory(null);
    }
  }, [suggestedCategory, setSuggestedCategory]);

  // --- Event Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'name') {
      setFormData(prev => ({ ...prev, slug: value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') }));
    }
  };

  /**
   * UPDATED: Now supports both files and URLs for AI suggestion.
   */
  const handleSuggestClick = () => {
    // Priority 1: Find the first uploaded file.
    const firstFile = imageInputs.find(i => i.type === 'file' && i.value instanceof File);
    if (firstFile) {
      suggestCategory(firstFile.value);
      return; // Exit after sending
    }

    // Priority 2: If no file, find the first entered URL.
    const firstUrl = imageInputs.find(i => i.type === 'url' && typeof i.value === 'string');
    if (firstUrl) {
      suggestCategory(firstUrl.value);
      return; // Exit after sending
    }

    // If neither is found, alert the user.
    alert("Please add at least one image file or URL to use the AI suggestion.");
  };

  const addImageInput = useCallback((type: "url" | "file", fileOrUrl: File | string) => {
    if (imageInputs.length >= 5) return;
    const preview = type === 'file' && fileOrUrl instanceof File ? URL.createObjectURL(fileOrUrl) : (fileOrUrl as string);
    setImageInputs(prev => [...prev, { type, id: nextImageId.current++, value: fileOrUrl, preview }]);
  }, [imageInputs.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => addImageInput('file', file));
      e.target.value = '';
    }
  };

  const handleUrlInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      e.preventDefault();
      addImageInput('url', e.currentTarget.value);
      e.currentTarget.value = '';
    }
  };

  const removeImage = (id: number) => setImageInputs(prev => prev.filter(input => input.id !== id));
  const handleVariantChange = (index: number, field: 'size' | 'stock', value: string | number) => {
    const newVariants = [...variants];
    (newVariants[index] as any)[field] = value;
    setVariants(newVariants);
  };
  const addVariant = () => setVariants([...variants, { size: '', stock: 0 }]);
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subCategory) {
      alert("Please select a subcategory.");
      return;
    }
    setLoading(true);
    setSuccess(false);

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => form.append(key, value));
    form.append('variants', JSON.stringify(variants));

    const imageUrls: string[] = [];
    imageInputs.forEach(input => {
      input.type === 'file' ? form.append('images', input.value as File) : imageUrls.push(input.value as string);
    });
    form.append('imageUrls', JSON.stringify(imageUrls));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, { method: 'POST', body: form });
      if (res.ok) {
        setSuccess(true);
        // Reset form to initial state after successful submission
        setFormData({ name: '', slug: '', brand: '', category: 'Apparel', subCategory: '', price: '', description: '' });
        setVariants([{ size: 'S', stock: 20 }, { size: 'M', stock: 20 }, { size: 'L', stock: 20 }]);
        setImageInputs([]);
        setSearch('');
      } else {
        alert('Failed to create product. Please check the console.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- JSX / Render ---
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Basic Details & Inventory */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-6">Basic Details</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Product Name</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Slug</label>
                  <input required name="slug" value={formData.slug} className="w-full p-2 border rounded-md bg-gray-100" readOnly />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">SubCategory</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={search || formData.subCategory}
                      onFocus={() => setIsDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setFormData(p => ({ ...p, subCategory: '' }));
                        setIsDropdownOpen(true);
                      }}
                      placeholder="Search or select..."
                      className="w-full p-2 border rounded-md"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSuggestClick}
                      disabled={isSuggesting || imageInputs.length === 0}
                      className="bg-purple-600 text-white p-2.5 rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                      title="AI Suggest SubCategory"
                    >
                      {isSuggesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    </button>
                  </div>
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSubCategories.length > 0 ? (
                        filteredSubCategories.map((sc) => (
                          <div key={sc} onClick={() => {
                            setFormData((p) => ({ ...p, subCategory: sc }));
                            setSearch('');
                            setIsDropdownOpen(false);
                          }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{sc}</div>
                        ))
                      ) : (<div className="px-4 py-2 text-gray-500">No results found.</div>)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Price ($)</label>
                  <input required name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="0.00" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Brand</label>
                <input required name="brand" value={formData.brand} onChange={handleChange} className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea required name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-md h-28 resize-y" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Inventory & Variants</h2>
              <button type="button" onClick={addVariant} className="text-sm font-bold text-blue-600 hover:underline">+ Add Size</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-xs font-bold text-gray-500 uppercase">
                <span>Size</span><span>Stock Quantity</span><span>Action</span>
              </div>
              {variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-center">
                  <input type="text" placeholder="e.g. XL" className="w-full p-2 border rounded-md" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} />
                  <input type="number" placeholder="0" className="w-full p-2 border rounded-md" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))} />
                  <button type="button" onClick={() => removeVariant(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md w-fit"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-bold text-lg mb-4">Product Images ({imageInputs.length}/5)</h3>
            <div className="flex flex-col gap-2 mb-4">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageInputs.length >= 5} className="w-full bg-blue-50 text-blue-600 font-bold py-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-100 disabled:opacity-50"><Upload className="w-4 h-4" /> Upload Files</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
              <div className="text-center text-xs text-gray-400 my-1">OR</div>
              <input name="imageUrl" onKeyDown={handleUrlInput} className="w-full p-2 border rounded-md" placeholder="Image URL (Press Enter)" type="url" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {imageInputs.map(input => (
                <div key={input.id} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden border">
                  <Image src={input.preview} alt="Preview" fill className="object-cover" />
                  <button type="button" onClick={() => removeImage(input.id)} className="absolute top-1 right-1 bg-black/50 hover:bg-red-600 p-0.5 rounded-full"><X className="w-3 h-3 text-white" /></button>
                </div>
              ))}
              {imageInputs.length === 0 && (<div className="col-span-3 aspect-square bg-gray-50 rounded-lg border-2 border-dashed flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-300" /></div>)}
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <><Plus className="w-5 h-5" /> Publish Product</>}
          </button>
          {success && (<div className="bg-green-100 text-green-800 p-4 rounded-lg"><p className="font-bold">✅ Product Published Successfully!</p></div>)}
        </div>
      </form>
    </div>
  );
}