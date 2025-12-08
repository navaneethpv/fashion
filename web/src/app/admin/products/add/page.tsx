"use client"
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, Plus, ArrowLeft, Image as ImageIcon, Trash2, Upload, X, Sparkles } from 'lucide-react'; // 👈 ADD Sparkles
import Image from 'next/image';

// Temporary type for managing file/url array
interface ImageInput {
  type: 'file' | 'url';
  id: number;
  value: File | string;
  preview: string;
}

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]); // 👈 NEW STATE FOR AI TAGS

  // --- CRITICAL CHANGE: ARRAY STATE ---
  const [imageInputs, setImageInputs] = useState<ImageInput[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextImageId = useRef(0); // For unique keys/IDs

  // ... (keep formData and variants state as before) ...
  const [formData, setFormData] = useState({
    name: '', slug: '', brand: '', category: 'T-Shirts', price: '', imageUrl: '', description: ''
  });
  const [variants, setVariants] = useState([{ size: 'S', stock: 20 }, { size: 'M', stock: 20 }, { size: 'L', stock: 20 }]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'name') {
      setFormData(prev => ({ ...prev, slug: value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') }));
    }
  };

  // --- NEW IMAGE HANDLERS ---
  const addImageInput = useCallback((type: 'url' | 'file', fileOrUrl: File | string) => {
    // Limit to 5 images
    if (imageInputs.length >= 5) return;
    
    const preview = (type === 'file' && fileOrUrl instanceof File) 
      ? URL.createObjectURL(fileOrUrl) 
      : (fileOrUrl as string);
      
    setImageInputs(prev => [
      ...prev,
      { type, id: nextImageId.current++, value: fileOrUrl, preview }
    ]);
  }, [imageInputs.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        addImageInput('file', file);
      }
      e.target.value = ''; // Clear input for next time
    }
  };

  const handleUrlInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const url = e.currentTarget.value;
    if (e.key === 'Enter' && url && !imageInputs.find(i => i.value === url)) {
      e.preventDefault();
      addImageInput('url', url);
      e.currentTarget.value = '';
    }
  };

  const removeImage = (id: number) => {
    setImageInputs(prev => prev.filter(input => input.id !== id));
  };
  // --- END NEW IMAGE HANDLERS ---
  const handleVariantChange = (index: number, field: 'size' | 'stock', value: string | number) => {
    const newVariants = [...variants];
    // This casting is safe since we control the input types
    (newVariants[index] as any)[field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', stock: 0 }]); // Changed initial size to empty string
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setSuggestedTags([]); // Clear previous tags

    // 1. Validation
    if (imageInputs.length === 0) {
        alert("Please provide at least one image.");
        setLoading(false);
        return;
    }
    const priceInCents = Math.round(parseFloat(formData.price) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      alert("Please enter a valid, positive price.");
      setLoading(false);
      return;
    }

    // 2. Construct FormData
    const form = new FormData();
    // 👇 CRUCIAL: Append ALL required text fields
    form.append('name', formData.name);
    form.append('slug', formData.slug);
    form.append('brand', formData.brand);
    form.append('category', formData.category);
    form.append('description', formData.description);
    form.append('price_cents', priceInCents.toString());
    
    form.append('variants', JSON.stringify(variants.map(v => ({
      size: v.size, color: 'Default', stock: v.stock, sku: `${formData.slug}-${v.size}`.toUpperCase()
    }))));

    // 3. Append Multiple Images
    const imageUrls: string[] = [];
    imageInputs.forEach(input => {
      if (input.type === 'file' && input.value instanceof File) {
        form.append('images', input.value); // Multer looks for the key 'images' (plural)
      } else if (input.type === 'url' && typeof input.value === 'string') {
        imageUrls.push(input.value);
      }
    });

    // Send all collected URLs as a JSON string for the backend to handle
    form.append('imageUrls', JSON.stringify(imageUrls));

    try {
      const res = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        // IMPORTANT: No 'Content-Type' header!
        body: form
      });

      if (res.ok) {
        const newProduct = await res.json(); // 👈 Get the product with final tags
        setSuccess(true);
        
        // Extract and display the final AI tags (filter out redundant tags)
        setSuggestedTags(newProduct.tags.filter((t: string) => 
            !['new arrival', newProduct.category.toLowerCase(), newProduct.brand.toLowerCase()].includes(t.toLowerCase())
        )); 

        // Reset state
        setFormData({ name: '', slug: '', brand: '', category: 'T-Shirts', price: '', imageUrl: '', description: '' });
        setVariants([{ size: 'S', stock: 20 }, { size: 'M', stock: 20 }, { size: 'L', stock: 20 }]);
        setImageInputs([]); // Reset image array
      } else {
        alert('Failed. Check Network and unique Slug. (Backend returned error)');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server. Check API console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form Content (Basic Details and Inventory) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Basic Info */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-6">Basic Details</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Product Name</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Name" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Slug</label>
                  <input required name="slug" value={formData.slug} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 text-gray-500" readOnly />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
                    {['T-Shirts', 'Jeans', 'Jackets', 'Sneakers', 'Dresses', 'Accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Price ($)</label>
                  <input required name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="0.00" />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Brand</label>
                <input required name="brand" value={formData.brand} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Brand Name" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Description</label>
                <textarea required name="description" value={formData.description} onChange={handleChange} className="w-full p-3 border rounded-lg h-32 resize-none" />
              </div>
            </div>
          </div>
          
          {/* Section 2: Inventory & Variants */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Inventory & Variants</h2>
              <button type="button" onClick={addVariant} className="text-sm font-bold text-blue-600 hover:underline">+ Add Size</button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase mb-2">
                <div className="col-span-4">Size</div>
                <div className="col-span-4">Stock Quantity</div>
                <div className="col-span-4">Action</div>
              </div>
              
              {variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <input type="text" placeholder="e.g. XL" className="w-full p-2 border rounded-lg uppercase" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} />
                  </div>
                  <div className="col-span-4">
                    <input type="number" placeholder="0" className="w-full p-2 border rounded-lg" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} />
                  </div>
                  <div className="col-span-4">
                    <button type="button" onClick={() => removeVariant(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column: Image Input & Publish */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4">Product Images ({imageInputs.length}/5)</h3>
            
            {/* Input buttons */}
            <div className="flex flex-col gap-2 mb-4">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={imageInputs.length >= 5}
                className="w-full bg-blue-50 text-blue-600 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" /> Upload Files
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
              
              <div className="flex items-center gap-2 my-1 text-xs text-gray-500">
                <div className="flex-1 border-t border-gray-200"></div>
                OR
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Image URL (Press Enter to Add)</label>
                <input 
                  name="imageUrl" 
                  onKeyDown={handleUrlInput} 
                  className="w-full p-2 border rounded-lg" 
                  placeholder="https://..." 
                  type="url"
                />
              </div>
            </div>
            
            {/* Image Grid Preview */}
            <div className="grid grid-cols-3 gap-2">
              {imageInputs.map(input => (
                <div key={input.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <Image 
                    src={input.preview} 
                    alt="Preview" 
                    fill 
                    className="object-cover" 
                    // onError={() => console.error('Image load failed for URL:', input.preview)} // Optional: error logging
                  />
                  <button 
                    type="button"
                    onClick={() => removeImage(input.id)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-600 p-0.5 rounded-full transition"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {imageInputs.length === 0 && (
                <div className="col-span-3 aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-center text-gray-400">
                  <ImageIcon className="w-10 h-10 opacity-50" />
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || imageInputs.length === 0}
            className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Plus className="w-5 h-5" /> Publish Product</>}
          </button>

          {success && (
            <div className="bg-green-50 text-green-700 p-6 rounded-2xl border border-green-100 animate-fade-in">
              <p className="font-bold text-lg mb-2">✅ Product Published!</p>
              <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-green-800">
                <Sparkles className="w-4 h-4" /> AI Suggested Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white border border-green-200 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}