"use client"

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Plus, ArrowLeft, Image as ImageIcon, Trash2, Upload, X, Zap } from 'lucide-react';
import Image from 'next/image';
import { useCategorySuggest } from '../../../../../hooks/useCategorySuggest';

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
    masterCategory: '',    // Admin "Category" → maps to masterCategory in backend
    category: '',          // Admin "SubCategory" (articleType) → maps to category in backend
    gender: '',           // Gender field (Men/Women/Kids)
    price: '',
    description: ''
  });

  // --- Variant Management State ---
  const [variants, setVariants] = useState([{ size: 'S', stock: 20 }, { size: 'M', stock: 20 }, { size: 'L', stock: 20 }]);

  // --- State for Cascading Category/SubCategory Dropdowns ---
  const [masterCategories, setMasterCategories] = useState<string[]>([]); // For Category dropdown (masterCategory)
  const [articleTypes, setArticleTypes] = useState<string[]>([]); // For SubCategory dropdown (category/articleType)
  const [filteredArticleTypes, setFilteredArticleTypes] = useState<string[]>([]);
  const [isMasterCategoryDropdownOpen, setIsMasterCategoryDropdownOpen] = useState(false);
  const [isArticleTypeDropdownOpen, setIsArticleTypeDropdownOpen] = useState(false);
  const [masterCategoryInputValue, setMasterCategoryInputValue] = useState('');
  const [articleTypeInputValue, setArticleTypeInputValue] = useState('');

  // --- Gender dropdown state ---
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const genderOptions = ['Men', 'Women', 'Kids'];

  // --- Logic Hooks ---
  useEffect(() => {
    // Fetch masterCategories from products (since there's no dedicated endpoint)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        const masterCats = Array.from(new Set(
          data.data
            .map((p: any) => p.masterCategory)
            .filter((cat: string) => cat && cat.trim())
        )).sort() as string[];

        // Fallback to common master categories if none found
        const defaultMasterCategories = ['Apparel', 'Footwear', 'Accessories'];
        setMasterCategories(masterCats.length > 0 ? masterCats : defaultMasterCategories);

        // Set default if empty (only on initial load)
        setFormData(prev => {
          if (!prev.masterCategory) {
            const defaultCat = masterCats.length > 0 ? masterCats[0] : defaultMasterCategories[0];
            setMasterCategoryInputValue(defaultCat);
            return { ...prev, masterCategory: defaultCat };
          }
          return prev;
        });
      })
      .catch((err) => {
        console.error("MasterCategory fetch failed", err);
        // Fallback to defaults
        const defaultMasterCategories = ['Apparel', 'Footwear', 'Accessories'];
        setMasterCategories(defaultMasterCategories);
        setFormData(prev => {
          if (!prev.masterCategory) {
            setMasterCategoryInputValue(defaultMasterCategories[0]);
            return { ...prev, masterCategory: defaultMasterCategories[0] };
          }
          return prev;
        });
      });
  }, []);

  useEffect(() => {
    // Fetch articleTypes (categories) when masterCategory changes
    // These are the articleTypes that belong to the selected masterCategory
    if (formData.masterCategory) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?limit=1000`)
        .then((res) => res.json())
        .then((data) => {
          const articleTypesList = Array.from(new Set(
            data.data
              .filter((p: any) => p.masterCategory === formData.masterCategory)
              .map((p: any) => p.category)
              .filter((cat: string) => cat && cat.trim())
          )).sort() as string[];

          // Fallback: if no articleTypes found for this masterCategory, fetch all categories
          if (articleTypesList.length === 0) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/categories`)
              .then((res) => res.json())
              .then((cats) => {
                setArticleTypes(cats);
                setFilteredArticleTypes(cats);
              })
              .catch((err) => console.error("Category fetch failed", err));
          } else {
            setArticleTypes(articleTypesList);
            setFilteredArticleTypes(articleTypesList);
          }

          setArticleTypeInputValue(''); // Clear articleType when masterCategory changes
          setFormData(prev => ({ ...prev, category: '' }));
        })
        .catch((err) => {
          console.error("ArticleType fetch failed", err);
          // Fallback to all categories
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/categories`)
            .then((res) => res.json())
            .then((cats) => {
              setArticleTypes(cats);
              setFilteredArticleTypes(cats);
            })
            .catch((e) => console.error("Category fetch failed", e));
        });
    } else {
      setArticleTypes([]);
      setFilteredArticleTypes([]);
      setArticleTypeInputValue('');
      setFormData(prev => ({ ...prev, category: '' }));
    }
  }, [formData.masterCategory]);

  useEffect(() => {
    // Filter the articleType list based on input
    const filtered = articleTypes.filter((at) =>
      at.toLowerCase().includes(articleTypeInputValue.toLowerCase())
    );
    setFilteredArticleTypes(filtered);
  }, [articleTypeInputValue, articleTypes]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsMasterCategoryDropdownOpen(false);
        setIsArticleTypeDropdownOpen(false);
        setIsGenderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    // Automatically apply the AI's suggested category and subcategory to the form
    // AI returns: category (articleType) and subCategory
    // We need to map: AI category → formData.category (articleType), AI subCategory → can be ignored or used as subCategory
    if (suggestedCategory) {
      // AI's "category" is actually the articleType (what goes in backend "category" field)
      // AI's "subCategory" can be used as subCategory if needed, but primary mapping is category → category
      setFormData(prev => ({
        ...prev,
        category: suggestedCategory.category, // AI category → backend category (articleType)
      }));
      setArticleTypeInputValue(suggestedCategory.category);
      setIsMasterCategoryDropdownOpen(false);
      setIsArticleTypeDropdownOpen(false);
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

  const handleSuggestClick = () => {
    suggestCategory(imageInputs);
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
    if (!formData.gender) {
      alert("Please select a gender.");
      return;
    }
    if (!formData.category) {
      alert("Please select a subcategory (article type).");
      return;
    }
    if (!formData.masterCategory) {
      alert("Please select a category.");
      return;
    }
    setLoading(true);
    setSuccess(false);

    const form = new FormData();
    // Map formData fields to backend fields
    form.append('name', formData.name);
    form.append('slug', formData.slug);
    form.append('brand', formData.brand);
    form.append('category', formData.category); // articleType → backend category
    form.append('masterCategory', formData.masterCategory); // masterCategory → backend masterCategory
    form.append('gender', formData.gender); // gender → backend gender
    form.append('price', formData.price);
    form.append('description', formData.description);

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
        // Reset form...
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to create product: ${errorData.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- JSX / Render ---
  return (
    <div className="min-h-screen pb-32">
      {/* HEADER */}
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
          <Link href="/admin/products" className="hover:text-zinc-900 transition-colors">Products</Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium">Add New</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Add New Product</h1>
        <p className="text-zinc-500">Create a new product and add it to your collection.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Essentials */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Essentials</h2>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Product Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Oversized Cotton T-Shirt"
                  className="w-full p-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all text-lg font-medium placeholder:font-normal"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Slug</label>
                  <div className="relative">
                    <input
                      required
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600 font-mono text-sm"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Brand</label>
                  <input
                    required
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full p-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                    placeholder="e.g. Nike, Eyoris"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Description</label>
                <textarea
                  required
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 border border-zinc-200 rounded-lg h-32 resize-y focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                  placeholder="Detailed product description..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Categorization */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Categorization</h2>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Gender Target</label>
                <div className="flex gap-4">
                  {genderOptions.map((option) => (
                    <label key={option} className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.gender === option ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'}`}>
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={formData.gender === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                        className="hidden"
                      />
                      <span className="font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Master Category */}
                <div className="dropdown-container relative">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Category</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={masterCategoryInputValue}
                      onFocus={() => setIsMasterCategoryDropdownOpen(true)}
                      onChange={(e) => {
                        setMasterCategoryInputValue(e.target.value);
                        setIsMasterCategoryDropdownOpen(true);
                      }}
                      placeholder="Select category..."
                      className="w-full p-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                      required
                    />
                    {isMasterCategoryDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-100 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {masterCategories
                          .filter(cat => cat.toLowerCase().includes(masterCategoryInputValue.toLowerCase()))
                          .map((cat) => (
                            <div
                              key={cat}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setMasterCategoryInputValue(cat);
                                setFormData(prev => ({ ...prev, masterCategory: cat }));
                                setIsMasterCategoryDropdownOpen(false);
                              }}
                              className="px-4 py-2 hover:bg-zinc-50 cursor-pointer text-sm"
                            >
                              {cat}
                            </div>
                          ))}
                        {masterCategories.filter(cat => cat.toLowerCase().includes(masterCategoryInputValue.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-zinc-400 text-sm">No categories found.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub Category */}
                <div className="dropdown-container relative">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Sub Category</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={articleTypeInputValue}
                      onFocus={() => setIsArticleTypeDropdownOpen(true)}
                      onChange={(e) => {
                        setArticleTypeInputValue(e.target.value);
                        setIsArticleTypeDropdownOpen(true);
                      }}
                      placeholder={formData.masterCategory ? "Select subcategory..." : "Select category first..."}
                      className="w-full p-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all disabled:bg-zinc-50 disabled:text-zinc-400"
                      disabled={!formData.masterCategory}
                      required
                    />
                    {isArticleTypeDropdownOpen && formData.masterCategory && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-100 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {filteredArticleTypes.length > 0 ? (
                          filteredArticleTypes.map((at) => (
                            <div
                              key={at}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setArticleTypeInputValue(at);
                                setFormData(prev => ({ ...prev, category: at }));
                                setIsArticleTypeDropdownOpen(false);
                              }}
                              className="px-4 py-2 hover:bg-zinc-50 cursor-pointer text-sm"
                            >
                              {at}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-zinc-400 text-sm">No subcategories found.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Variants */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-zinc-900">Pricing & Variants</h2>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Base Price</label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">₹</span>
                  <input
                    required
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full p-3 pl-8 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all font-mono text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Size Variants</label>
                  <button type="button" onClick={addVariant} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors">+ Add Size</button>
                </div>

                <div className="bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
                  <div className="grid grid-cols-6 gap-4 p-3 border-b border-zinc-200 text-xs font-bold text-zinc-400 uppercase">
                    <div className="col-span-2">Size</div>
                    <div className="col-span-3">Stock Quantity</div>
                    <div className="col-span-1 text-right">Action</div>
                  </div>
                  <div className="divide-y divide-zinc-200">
                    {variants.map((variant, index) => (
                      <div key={index} className="grid grid-cols-6 gap-4 p-3 items-center hover:bg-white transition-colors">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="e.g. XL"
                            className="w-full p-2 border border-zinc-200 rounded text-sm font-medium uppercase"
                            value={variant.size}
                            onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full p-2 border border-zinc-200 rounded text-sm"
                            value={variant.stock}
                            onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))}
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeVariant(index)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Media & AI */}
        <div className="space-y-6">
          {/* Section 4: Media */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Product Media</h3>
            <p className="text-xs text-zinc-500 mb-4">Upload up to 5 images. First image will be the cover.</p>

            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${imageInputs.length >= 5 ? 'bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed' : 'border-zinc-300 hover:border-zinc-900 hover:bg-zinc-50'}`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple disabled={imageInputs.length >= 5} />
                <div className="bg-zinc-100 p-3 rounded-full mb-3">
                  <Upload className="w-6 h-6 text-zinc-600" />
                </div>
                <span className="text-sm font-semibold text-zinc-900">Click to upload</span>
                <span className="text-xs text-zinc-400 mt-1">or drag and drop</span>
              </div>

              {/* URL Input */}
              <div className="flex gap-2">
                <input name="imageUrl" onKeyDown={handleUrlInput} className="flex-1 p-2 text-sm border border-zinc-200 rounded-lg" placeholder="Or paste image URL..." type="url" />
              </div>

              {/* Gallery Grid */}
              {imageInputs.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {imageInputs.map((input, idx) => (
                    <div key={input.id} className={`relative aspect-square rounded-lg overflow-hidden border border-zinc-200 group ${idx === 0 ? 'ring-2 ring-zinc-900 ring-offset-2' : ''}`}>
                      <Image src={input.preview} alt="Preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeImage(input.id)} className="bg-white text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      {idx === 0 && <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm font-medium">Cover</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Intelligence */}
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl shadow-sm border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg"><Zap className="w-5 h-5 text-purple-600" /></div>
              <h3 className="font-bold text-zinc-900">AI Intelligence</h3>
            </div>
            <p className="text-sm text-zinc-600 mb-4">Auto-detect category and tags from your uploaded images.</p>

            <button
              type="button"
              onClick={handleSuggestClick}
              disabled={isSuggesting || imageInputs.length === 0}
              className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>Auto-Categorize</span>
            </button>
          </div>
        </div>

        {/* STICKY BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-zinc-200 p-4 z-40">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-500 hidden sm:block">
              {imageInputs.length === 0 ? 'Start by adding images' : 'Ready to publish?'}
            </span>
            <div className="flex gap-4 ml-auto w-full sm:w-auto">
              <Link href="/admin/products" className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-zinc-300 font-bold text-zinc-700 hover:bg-zinc-50 text-center transition-colors">
                Discard
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-zinc-900/10"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Publish Product</>}
              </button>
            </div>
          </div>
        </div>

      </form>

      {/* SUCCESS TOAST Overlay */}
      {success && (
        <div className="fixed top-24 right-8 bg-green-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300 z-50">
          <div className="bg-green-800 p-2 rounded-full"><Plus className="w-4 h-4" /></div>
          <div>
            <p className="font-bold">Success!</p>
            <p className="text-sm text-green-200">Product published successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
}
