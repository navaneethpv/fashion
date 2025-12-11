"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function ProductsListPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = () => {
    fetch("http://localhost:4000/api/products?limit=100")
      .then((res) => res.json())
      .then((res) => setProducts(res.data || []));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This cannot be undone."
      )
    )
      return;

    setDeletingId(id);
    try {
      const res = await fetch(`http://localhost:4000/api/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Remove from local state immediately
        setProducts((prev) => prev.filter((p: any) => p._id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      alert("Error deleting product");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products Catalog</h1>
        <Link
          href="/admin/products/add"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition"
        >
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
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Total Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((p: any) => {
              console.log(p);
              // Calculate total stock from variants (supports both array of variants or single object)
              const stock = Array.isArray(p.variants)
                ? p.variants.reduce((sum: number, v: any) => sum + (v?.stock ?? 0), 0)
                : (p.variants?.stock ?? 0);

              // normalize image src (supports array or single string)
              const imgSrc =
                Array.isArray(p.images) ? p.images[0]?.url ?? "" : p.images ?? "";

              return (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        <img
                          src={imgSrc}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-bold text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{p.category}</td>
                  <td className="px-6 py-3 font-mono">
                    ${(p.price_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        stock > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {stock > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right flex items-center justify-end gap-2">
                    {/* 1. NEW EDIT LINK: Points to the admin editing view */}
                    <Link
                      href={`/admin/products/manage/${p._id}`}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                      title="Edit Stock/Details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-square-pen"
                      >
                        <path d="M12 20h9" />
                        <path d="M15 7l2 2" />
                        <path d="M12.5 14.5l5 5" />
                        <path d="M14 2c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2h-2z" />
                        <path d="M10 14L4 20l-1 1h7l6-6" />
                      </svg>
                    </Link>

                    {/* 2. Public View Link (Kept for convenience) */}
                    <a
                      href={`/products/${p.slug}`}
                      target="_blank"
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      title="View Live"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* 3. Delete Button (Same as before) */}
                    <button
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId === p._id}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition disabled:opacity-50"
                      title="Delete Product"
                    >
                      {deletingId === p._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
