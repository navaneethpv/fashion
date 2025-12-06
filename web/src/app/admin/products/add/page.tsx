"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import {
  Loader2,
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  Trash2,
  Upload,
} from "lucide-react";

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState("");

  // New: Image input state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    brand: "",
    category: "T-Shirts",
    price: "",
    imageUrl: "",
    description: "",
  });

  const [variants, setVariants] = useState([
    { size: "S", stock: 20 },
    { size: "M", stock: 20 },
    { size: "L", stock: 20 },
  ]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      setFormData((prev) => ({
        ...prev,
        slug: value
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, ""),
      }));
    }
    if (name === "imageUrl") {
      setPreview(value);
      setImageFile(null); // Clear file upload if link is entered
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, imageUrl: "" })); // Clear URL input
    }
  };

  // ... imports ...

  // ... handleSubmit function ...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... loading state ...

    // 1. Construct FormData
    const form = new FormData();
    form.append("name", formData.name);
    form.append("slug", formData.slug);
    form.append("brand", formData.brand);
    form.append("description", formData.description);

    // 👇 CRUCIAL LINE: ENSURE CATEGORY IS APPENDED
    form.append("category", formData.category);

    form.append("price_cents", (parseFloat(formData.price) * 100).toString());
    form.append(
      "variants",
      JSON.stringify(
        variants.map((v) => ({
          size: v.size,
          color: "Default",
          stock: v.stock,
          sku: `${formData.slug}-${v.size}`.toUpperCase(),
        }))
      )
    );

    // 2. Append Image Source (Check this logic)
    if (imageFile) {
      // NOTE: Multer looks for the field name 'image'
      form.append("image", imageFile);
    } else if (formData.imageUrl) {
      form.append("imageUrl", formData.imageUrl);
    } else {
      alert("Please provide an image file or URL.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        // ⚠️ CRUCIAL: DO NOT SET Content-Type HEADER!
        // The browser must set it automatically as 'multipart/form-data'
        // with the correct boundary when submitting a FormData object.
        body: form,
      });
      // ... rest of the fetch and error handling

      if (res.ok) {
        setSuccess(true);
        // Reset state
        setFormData({
          name: "",
          slug: "",
          brand: "",
          category: "T-Shirts",
          price: "",
          imageUrl: "",
          description: "",
        });
        setVariants([
          { size: "S", stock: 20 },
          { size: "M", stock: 20 },
          { size: "L", stock: 20 },
        ]);
        setImageFile(null);
        setPreview("");
      } else {
        alert("Failed. Check Network and unique Slug.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // ... (Rest of the component's helper functions: handleVariantChange, addVariant, removeVariant) ...
  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    // @ts-ignore
    newVariants[index][field] =
      field === "stock" ? parseInt(value) || 0 : value;
    setVariants(newVariants);
  };
  const addVariant = () => {
    setVariants([...variants, { size: "", stock: 0 }]);
  };
  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Basic Info (Same as before) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-6">Basic Details</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                    Product Name
                  </label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                    Slug
                  </label>
                  <input
                    required
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg bg-gray-50 text-gray-500"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg bg-white"
                  >
                    {[
                      "T-Shirts",
                      "Jeans",
                      "Jackets",
                      "Sneakers",
                      "Dresses",
                      "Accessories",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                    Price ($)
                  </label>
                  <input
                    required
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                  Brand
                </label>
                <input
                  required
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Brand Name"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                  Description
                </label>
                <textarea
                  required
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg h-32 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Inventory & Variants (Same as before) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Inventory & Variants</h2>
              <button
                type="button"
                onClick={addVariant}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                + Add Size
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase mb-2">
                <div className="col-span-4">Size</div>
                <div className="col-span-4">Stock Quantity</div>
                <div className="col-span-4">Action</div>
              </div>

              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-center"
                >
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="e.g. XL"
                      className="w-full p-2 border rounded-lg uppercase"
                      value={variant.size}
                      onChange={(e) =>
                        handleVariantChange(index, "size", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full p-2 border rounded-lg"
                      value={variant.stock}
                      onChange={(e) =>
                        handleVariantChange(index, "stock", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-4">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column: Image & Publish */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm mb-4">Product Image</h3>

            <div className="flex flex-col gap-2 mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-50 text-blue-600 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition"
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />

              <div className="flex items-center gap-2 my-1 text-xs text-gray-500">
                <div className="flex-1 border-t border-gray-200"></div>
                OR
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  Image URL
                </label>
                <input
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="mt-4 aspect-[3/4] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setPreview("")}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <span className="text-xs">Preview</span>
                </div>
              )}
            </div>
            {imageFile && (
              <p className="text-xs text-green-600 mt-2">
                File Ready: {imageFile.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" /> Publish Product
              </>
            )}
          </button>

          {success && (
            <div className="bg-green-50 text-green-700 p-6 rounded-2xl border border-green-100 text-center animate-fade-in">
              <p className="font-bold text-lg mb-2">Success!</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
