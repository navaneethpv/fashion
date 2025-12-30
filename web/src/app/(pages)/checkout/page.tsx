"use client"
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import Navbar from '../components/Navbar';
import { Loader2, CheckCircle, Lock, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  // Expanded Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',

    country: 'India'
  });

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  // Helper to get auth headers
  const authHeaders = async () => {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // 1. Fetch Cart & Pre-fill Email
  useEffect(() => {
    if (!isLoaded || !user) return;

    // Pre-fill email/name from Clerk if available
    setFormData(prev => ({
      ...prev,
      email: user.primaryEmailAddress?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    }));

    fetch(`${baseUrl}/api/cart?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setCart(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user]);

  // 2. Fetch Order Details when orderId is available
  useEffect(() => {
    if (!orderId) return;
  }, [orderId]);

  const subtotal = cart?.items?.reduce((acc: number, item: any) => {
    return acc + (item.product.price_cents * item.quantity);
  }, 0) || 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  // 2. Handle Payment
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone length
    if (formData.phone.length !== 10) {
      alert("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setProcessing(true);

    const orderPayload = {
      userId: user?.id,
      shippingAddress: {
        ...formData,
        phone: `+91${formData.phone}` // Prepend +91 enforced
      }
    };

    try {
      // Simulate payment processing delay
      await new Promise(r => setTimeout(r, 2000));

      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: await authHeaders(),

        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const data = await res.json();
        setOrderId(data._id); // Store order ID for fetching details
        setOrderSuccess(true);
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Order creation failed:', errorData);
        alert(`Payment failed: ${errorData.message || 'Please try again.'}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Error connecting to server. Please check your internet connection.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isLoaded || loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  if (orderSuccess) {
    // Use orderData if available, fallback to formData
    const displayFirstName = orderData?.shippingAddress?.firstName || formData.firstName;
    const displayEmail = orderData?.shippingAddress?.email || formData.email;

    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-black mb-4 text-gray-900">Order Confirmed!</h1>
          <p className="text-gray-900 mb-8 max-w-md text-lg">
            Thanks {displayFirstName}! We&apos;ve sent a receipt to <b>{displayEmail}</b>. Your order is being prepared.
          </p>
          <Link href="/product" className="bg-black text-white px-10 py-4 rounded-full font-bold hover:scale-105 transition transform shadow-xl">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Your bag is empty</h2>
          <Link href="/products" className="text-primary underline mt-2 inline-block">Go Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" /> Secure Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT COLUMN: FORMS */}
          <div className="flex-1 space-y-8">

            {/* 1. Contact Info */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:shadow-2xl hover:shadow-gray-200/60">
              <h2 className="text-xl font-bold mb-8 text-gray-900">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black focus:border-black outline-none transition-all placeholder:text-gray-300 font-medium text-gray-900"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400 font-bold select-none">+91</span>
                    <input
                      name="phone"
                      type="tel"
                      required
                      placeholder="98765 43210"
                      className={`w-full p-4 pl-14 bg-white border rounded-xl focus:ring-1 focus:ring-black focus:border-black outline-none transition-all placeholder:text-gray-300 font-medium text-gray-900 tracking-wide ${formData.phone && formData.phone.length !== 10 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
                        }`}
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: val });
                      }}
                    />
                  </div>
                  {formData.phone && formData.phone.length > 0 && formData.phone.length < 10 && (
                    <p className="text-xs text-red-500 font-medium mt-1">Enter a valid 10-digit Indian mobile number</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Shipping Address */}
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:shadow-2xl hover:shadow-gray-200/60">
              <h2 className="text-xl font-bold mb-8 text-gray-900">Shipping Address</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">First Name</label>
                  <input
                    name="firstName" type="text" required
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black focus:border-black outline-none transition-all font-medium text-gray-900"
                    value={formData.firstName} onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Last Name</label>
                  <input
                    name="lastName" type="text" required
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black focus:border-black outline-none transition-all font-medium text-gray-900"
                    value={formData.lastName} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-8 space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Street Address</label>
                <input
                  name="street" type="text" required placeholder="House No, Building, Area"
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black focus:border-black outline-none transition-all placeholder:text-gray-300 font-medium text-gray-900"
                  value={formData.street} onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">City</label>
                  <input
                    name="city" type="text" required
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black focus:border-black outline-none transition-all font-medium text-gray-900"
                    value={formData.city} onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">State</label>
                  <input
                    name="state" type="text" required
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black focus:border-black outline-none transition-all font-medium text-gray-900"
                    value={formData.state} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">ZIP Code</label>
                  <input
                    name="zip" type="text" required
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black focus:border-black outline-none transition-all font-medium text-gray-900"
                    value={formData.zip} onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Country</label>
                  <input
                    name="country"
                    type="text"
                    disabled
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-bold cursor-not-allowed select-none"
                    value="India"
                  />
                </div>
              </div>
            </form>

            {/* 3. Payment Method */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:shadow-2xl hover:shadow-gray-200/60">
              <h2 className="text-xl font-bold mb-8 text-gray-900">Payment Method</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-5 p-5 border border-purple-200 bg-purple-50/30 rounded-2xl cursor-pointer transition-all shadow-sm">
                  <div className="w-5 h-5 rounded-full border-[5px] border-purple-600 bg-white shadow-sm" />
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <span className="block font-bold text-gray-900">Credit / Debit Card</span>
                    <span className="text-xs text-gray-500 font-medium">Safe encryption via Stripe</span>
                  </div>
                </div>
                <div className="flex items-center gap-5 p-5 border border-gray-100 rounded-2xl opacity-50 cursor-not-allowed grayscale">
                  <div className="w-5 h-5 rounded-full border border-gray-200" />
                  <span className="font-bold text-gray-400">PayPal / Wallet</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
              <h3 className="font-bold text-xl mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cart.items.map((item: any) => (
                  <div key={`${item.product?._id ?? 'unknown'}-${item.variantSku ?? 'default'}`} className="flex gap-4">
                    <div className="w-12 h-16 bg-gray-100 rounded-md flex-shrink-0 relative overflow-hidden">
                      <img
                        src={item.product?.images?.[0] || item.product?.images?.[0]?.url || '/images/placeholder.png'}
                        className="object-cover w-full h-full"
                        alt={item.product?.name ?? ''}
                      />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-bold text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-gray-900 text-xs">Size: {item.variantSku} | Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-sm">₹{((item.product.price_cents * item.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-900">Subtotal</span>
                  <span className="font-bold">₹{(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900">Shipping</span>
                  <span className="font-bold text-gray-900">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900">Tax (Estimated)</span>
                  <span className="font-bold">₹0.00</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span>₹{(subtotal / 100).toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={processing}
                className="w-full bg-black text-white h-14 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-xl shadow-gray-200 disabled:opacity-70 disabled:hover:scale-100"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Pay ₹{(subtotal / 100).toFixed(2)}
                  </>
                )}
              </button>

              <div className="text-center mt-4 text-xs text-gray-900">
                <p>Secure SSL Encryption.</p>
                <p>30-Day Money Back Guarantee.</p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}