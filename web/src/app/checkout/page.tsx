"use client"
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Navbar from '../components/Navbar';
import { Loader2, CheckCircle, Lock, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { user, isLoaded } = useUser();
  
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

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
    country: 'US'
  });

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

    fetch(`http://localhost:4000/api/cart?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setCart(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user]);

  const subtotal = cart?.items?.reduce((acc: number, item: any) => {
    return acc + (item.product.price_cents * item.quantity);
  }, 0) || 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Handle Payment
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const orderPayload = {
      userId: user?.id,
      items: cart.items.map((item: any) => ({
        productId: item.product._id,
        name: item.product.name,
        variantSku: item.variantSku,
        quantity: item.quantity,
        price_cents: item.product.price_cents,
        image: item.product.images[0].url
      })),
      total_cents: subtotal,
      shippingAddress: formData // Sends all the detailed fields
    };

    try {
      await new Promise(r => setTimeout(r, 2000)); // 2s simulated delay

      const res = await fetch('http://localhost:4000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        setOrderSuccess(true);
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isLoaded || loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-black mb-4 text-gray-900">Order Confirmed!</h1>
          <p className="text-gray-900 mb-8 max-w-md text-lg">
            Thanks {formData.firstName}! We&apos;ve sent a receipt to <b>{formData.email}</b>. Your order is being prepared.
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
          <div className="flex-1 space-y-6">
            
            {/* 1. Contact Info */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">Email Address</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">Phone Number</label>
                  <input 
                    name="phone"
                    type="tel" 
                    required
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping Address */}
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6">Shipping Address</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">First Name</label>
                  <input 
                    name="firstName" type="text" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
                    value={formData.firstName} onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">Last Name</label>
                  <input 
                    name="lastName" type="text" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
                    value={formData.lastName} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">Street Address</label>
                <input 
                  name="street" type="text" required placeholder="123 Fashion Ave, Apt 4B"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
                  value={formData.street} onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">City</label>
                  <input 
                    name="city" type="text" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
                    value={formData.city} onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">State / Province</label>
                  <input 
                    name="state" type="text" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
                    value={formData.state} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">ZIP Code</label>
                  <input 
                    name="zip" type="text" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition"
                    value={formData.zip} onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5 block">Country</label>
                  <select 
                    name="country" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:bg-white outline-none transition appearance-none"
                    value={formData.country} onChange={handleChange}
                  >
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="IN">India</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>
            </form>

            {/* 3. Payment Method */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6">Payment Method</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 p-4 border-2 border-primary bg-violet-50 rounded-xl cursor-pointer transition">
                  <div className="w-5 h-5 rounded-full border-4 border-primary bg-white" />
                  <CreditCard className="w-6 h-6 text-primary" />
                  <div>
                    <span className="block font-bold text-gray-900">Credit / Debit Card</span>
                    <span className="text-xs text-gray-900">Safe encryption via Stripe</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl opacity-60 cursor-not-allowed">
                  <div className="w-5 h-5 rounded-full border border-gray-300" />
                  <span className="font-bold text-gray-900">PayPal</span>
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
                         src={item.product?.images?.[0]?.url ?? '/images/placeholder.png'}
                         className="object-cover w-full h-full"
                         alt={item.product?.name ?? ''}
                       />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-bold text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-gray-900 text-xs">Size: {item.variantSku} | Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-sm">₹{((item.product.price_cents * item.quantity)/100).toFixed(2)}</span>
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