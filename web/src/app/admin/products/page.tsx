"use client"
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ExternalLink } from 'lucide-react';

export default function ProductsListPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Reuse the public API for now
    fetch('http://localhost:4000/api/products?limit=100')
      .then(res => res.json())
      .then(res => setProducts(res.data || []));
  }, []);

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products Catalog</h1>
        <Link href="/admin/products/add" className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input 
          placeholder="Search products..." 
          className="flex-1 outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((p: any) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                    <img src={p.images[0]?.url} alt="" className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-6 py-3 font-bold text-gray-900">{p.name}</td>
                <td className="px-6 py-3 text-gray-600">{p.category}</td>
                <td className="px-6 py-3 font-mono">${(p.price_cents/100).toFixed(2)}</td>
                <td className="px-6 py-3">
                  <a href={`/products/${p.slug}`} target="_blank" className="text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}