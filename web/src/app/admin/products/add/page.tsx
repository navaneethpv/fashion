"use client"

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Plus, ArrowLeft, Image as ImageIcon, Trash2, Upload, X, Zap } from 'lucide-react';
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
    <div className="space-y-6">
      {/* HEADER: Unchanged */}
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
              {/* Product Name & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Product Name</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Slug</label>
                  <input required name="slug" value={formData.slug} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-100" readOnly />
                </div>
              </div>

              {/* Gender Dropdown */}
              <div className="dropdown-container">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Gender *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.gender}
                    onFocus={() => setIsGenderDropdownOpen(true)}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, gender: e.target.value }));
                      setIsGenderDropdownOpen(true);
                    }}
                    placeholder="Select gender..."
                    className="w-full p-2 border rounded-md"
                    required
                  />
                  {isGenderDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {genderOptions
                        .filter(g => g.toLowerCase().includes(formData.gender.toLowerCase()))
                        .map((gender) => (
                        <div 
                          key={gender} 
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, gender }));
                            setIsGenderDropdownOpen(false);
                          }} 
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {gender}
                        </div>
                      ))}
                      {genderOptions.filter(g => g.toLowerCase().includes(formData.gender.toLowerCase())).length === 0 && (
                        <div className="px-4 py-2 text-gray-500">No options found.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 
              // ========================================================== //
              // CASCADING CATEGORY/SUBCATEGORY SELECTION
              // Category → masterCategory, SubCategory → category (articleType)
              // ========================================================== //
              */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Master Category Dropdown */}
                <div className="dropdown-container relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Category *</label>
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
                      className="w-full p-2 border rounded-md"
                      required
                    />
                    {isMasterCategoryDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {cat}
                          </div>
                        ))}
                        {masterCategories.filter(cat => cat.toLowerCase().includes(masterCategoryInputValue.toLowerCase())).length === 0 && (
                          <div className="px-4 py-2 text-gray-500">No categories found.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Article Type (SubCategory) Dropdown */}
                <div className="dropdown-container relative">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sub Category *</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={articleTypeInputValue}
                        onFocus={() => setIsArticleTypeDropdownOpen(true)}
                        onChange={(e) => {
                          setArticleTypeInputValue(e.target.value);
                          setIsArticleTypeDropdownOpen(true);
                        }}
                        placeholder={formData.masterCategory ? "Select subcategory..." : "Select category first..."}
                        className="w-full p-2 border rounded-md"
                        disabled={!formData.masterCategory}
                        required
                      />
                      {isArticleTypeDropdownOpen && formData.masterCategory && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {at}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">No subcategories found.</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* AI Suggest Button */}
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
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Price ($)</label>
                <input required name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="0.00" />
              </div>

              {/* Brand & Description */}
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

          {/* INVENTORY & VARIANTS: Unchanged */}
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

        {/* RIGHT COLUMN: Images & Publish Button */}
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
