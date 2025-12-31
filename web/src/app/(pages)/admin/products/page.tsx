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
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";

export default function ProductsListPage() {
  type Product = {
    _id: string;
    name: string;
    slug: string;
    images?: any;
    variants?: any;
    price_cents?: number;
    category?: string;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(24);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>(String(page));
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  useEffect(() => {
    const p = page;
    fetch(`${baseUrl}/api/products?limit=${limit}&page=${p}`)
      .then((res) => res.json())
      .then((res) => {
        setProducts(res.data || []);
        setTotalPages(res.meta?.pages || 1);
        setPageInput(String(p));
      })
      .catch(() => {
        setProducts([]);
        setTotalPages(1);
      });
  }, [page, limit]);

  // keep pageInput in sync when page changes externally
  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This cannot be undone."
      )
    )
      return;

    setDeletingId(id);
    try {
      const res = await fetch(`${baseUrl}/api/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Remove from local state immediately
        setProducts((prev) => prev.filter((p: any) => p._id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      alert("Error deleting product");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products Catalog</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setPage(1); setSearch(''); }}
            className="bg-green-600 text-white px-3 py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition"
            title="Show latest products (page 1)"
          >
            Latest
          </button>
          <Link
            href="/admin/products/add"
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          placeholder="Search products..."
          className="flex-1 outline-none text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0 z-10 backdrop-blur-sm bg-opacity-90">
            <tr>
              <th className="px-6 py-4 rounded-tl-lg">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Total Stock</th>
              <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((p) => {
              console.log(p);
              // Calculate total stock from variants (supports both array of variants or single object)
              const stock = Array.isArray(p.variants)
                ? p.variants.reduce((sum: number, v: any) => sum + (v?.stock ?? 0), 0)
                : (p.variants?.stock ?? 0);

              // Extract image src (supports array or single string)
              // Handle: array of objects with url, array of strings, single string, or undefined
              let imgSrc: string | undefined;
              if (Array.isArray(p.images)) {
                if (p.images.length > 0) {
                  const firstImg = p.images[0];
                  imgSrc = typeof firstImg === 'string' ? firstImg : firstImg?.url;
                }
              } else if (typeof p.images === 'string') {
                imgSrc = p.images;
              }

              // Only use imgSrc if it's a valid non-empty string
              const hasValidImage = imgSrc && imgSrc.trim().length > 0;

              return (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                        {hasValidImage ? (
                          <img
                            src={imgSrc}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <span className="font-bold text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{p.category}</td>


                  <td className="px-6 py-3 font-mono">
                    ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((p.price_cents || 0) / 100)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold ${stock > 0
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
        {/* Pagination Controls (arrow + input) */}
        <div className="px-4 py-3 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded bg-gray-100 disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center border rounded overflow-hidden">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const n = Math.max(1, Math.min(totalPages, Number(pageInput) || 1));
                    setPage(n);
                    setPageInput(String(n));
                  }
                }}
                onBlur={() => {
                  const n = Math.max(1, Math.min(totalPages, Number(pageInput) || 1));
                  setPage(n);
                  setPageInput(String(n));
                }}
                className="w-20 text-center px-2 py-1 outline-none"
                aria-label="Page number"
              />
              <div className="px-3 text-sm text-gray-700">/ {totalPages}</div>
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded bg-gray-100 disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
