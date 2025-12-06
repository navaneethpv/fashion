"use client"
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: '',
    category: 'T-Shirts',
    price: '',
    imageUrl: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-slug
    if (name === 'name') {
      setFormData(prev => ({ 
        ...prev, 
        name: value,
        slug: value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
      }));
    }
    // Auto-preview
    if (name === 'imageUrl') {
      setPreview(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('http://localhost:4000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price_cents: parseFloat(formData.price) * 100,
          variants: [ // Default variants
            { size: 'S', color: 'Default', stock: 10 },
            { size: 'M', color: 'Default', stock: 10 },
            { size: 'L', color: 'Default', stock: 10 },
            { size: 'XL', color: 'Default', stock: 10 }
          ]
        })
      });

      if (res.ok) {
        setSuccess(true);
        // Reset form
        setFormData({ name: '', slug: '', brand: '', category: 'T-Shirts', price: '', imageUrl: '', description: '' });
        setPreview('');
      } else {
        alert('Failed. Check if slug is unique.');
      }
    } catch (err) {
      alert('Network Error');
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Image URL</label>
              <input required name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="https://..." />
              <p className="text-xs text-gray-400 mt-2">AI will automatically analyze this image for color matching.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Description</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} className="w-full p-3 border rounded-lg h-32 resize-none" />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Plus className="w-5 h-5" /> Publish Product</>}
            </button>
          </form>
        </div>

        {/* Preview Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm mb-4">Image Preview</h3>
            <div className="aspect-[3/4] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" onError={() => setPreview('')} />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <span className="text-xs">Enter URL to preview</span>
                </div>
              )}
            </div>
          </div>

          {success && (
            <div className="bg-green-50 text-green-700 p-6 rounded-2xl border border-green-100 text-center animate-fade-in">
              <p className="font-bold text-lg mb-2">Success!</p>
              <p className="text-sm mb-4">Product added to catalog and indexed by AI.</p>
              <button onClick={() => setSuccess(false)} className="text-xs font-bold underline">Add Another</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}