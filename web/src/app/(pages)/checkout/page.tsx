"use client"
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import Navbar from '../components/Navbar';
import { Loader2, CheckCircle, Lock, CreditCard, ShieldCheck, MapPin, Plus, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddressBook from '../components/profile/AddressBook';
import AddressForm from '../components/profile/AddressForm';

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

  // Address Management State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // 1. Fetch Data
  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchData = async () => {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Cart
        const cartRes = await fetch(`${baseUrl}/api/cart?userId=${user.id}`);
        if (cartRes.ok) setCart(await cartRes.json());

        // Fetch Addresses
        const addrRes = await fetch(`${baseUrl}/api/user/addresses`, { headers });
        if (addrRes.ok) {
          const addrs = await addrRes.json();
          setAddresses(addrs);
          // Auto-select default or first
          const def = addrs.find((a: any) => a.isDefault) || addrs[0];
          if (def) setSelectedAddress(def);
        }
        setLoading(false);
      } catch (e) {
        console.error("Fetch error", e);
        setLoading(false);
      }
    }
    fetchData();
  }, [isLoaded, user]);


  const subtotal = cart?.items?.reduce((acc: number, item: any) => {
    return acc + (item.product.price_cents * item.quantity);
  }, 0) || 0;


  // 2. Handle Payment
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddress) {
      alert("Please add or select a shipping address.");
      return;
    }

    setProcessing(true);

    const orderPayload = {
      userId: user?.id,
      shippingAddress: {
        name: selectedAddress.name || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''),
        email: user?.primaryEmailAddress?.emailAddress || '',
        phone: selectedAddress.phone,
        street: selectedAddress.street,
        city: selectedAddress.city,
        district: selectedAddress.district,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        country: selectedAddress.country
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
        setOrderData(data); // Assuming backend returns order object
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

  const refreshAddresses = async () => {
    const token = await getToken();
    const res = await fetch(`${baseUrl}/api/user/addresses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const addrs = await res.json();
      setAddresses(addrs);
      // If we just added the first address, select it
      if (!selectedAddress) {
        const def = addrs.find((a: any) => a.isDefault) || addrs[0];
        setSelectedAddress(def);
      }
    }
  };


  if (!isLoaded || loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-zinc-900 w-8 h-8" /></div>;

  if (orderSuccess) {
    const displayFirstName = orderData?.shippingAddress?.firstName || user?.firstName;
    const displayEmail = orderData?.shippingAddress?.email || user?.primaryEmailAddress?.emailAddress;
    const displayOrderId = orderData?._id ? `#EYORIS-${orderData._id.slice(-6).toUpperCase()}` : `#ORDER-${Math.floor(Math.random() * 100000)}`;

    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in sm:py-20">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-green-50/50 sm:w-24 sm:h-24">
            <CheckCircle className="w-10 h-10 text-green-600 sm:w-12 sm:h-12" />
          </div>

          <h1 className="text-3xl font-black mb-2 text-zinc-900 sm:text-4xl">Order Confirmed!</h1>

          {/* Order Meta */}
          <div className="flex flex-col items-center gap-1 mb-6 text-sm">
            <span className="font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-full text-xs tracking-wide">
              Order ID: {displayOrderId}
            </span>
            <p className="text-zinc-500 font-medium">Estimated delivery: 5–7 business days</p>
          </div>

          <p className="text-zinc-600 mb-8 max-w-md text-base sm:text-lg leading-relaxed">
            Thanks {displayFirstName}! We&apos;ve sent a receipt to <b className="text-zinc-900">{displayEmail}</b>. Your order is being prepared.
          </p>

          <div className="flex flex-col w-full max-w-xs gap-3 sm:flex-row sm:max-w-none sm:w-auto">
            <Link
              href="/product"
              className="w-full bg-zinc-900 text-white px-8 py-3.5 rounded-full font-bold hover:bg-zinc-800 hover:scale-105 transition transform shadow-lg text-center flex items-center justify-center gap-2 sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Continue Shopping
            </Link>

            <Link
              href="/profile?tab=orders"
              className="w-full bg-white text-zinc-900 border border-zinc-200 px-8 py-3.5 rounded-full font-bold hover:bg-zinc-50 hover:border-zinc-300 transition text-center sm:w-auto"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-zinc-900">Your bag is empty</h2>
          <Link href="/product" className="text-zinc-600 underline mt-2 inline-block hover:text-zinc-900">Go Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 font-sans text-zinc-900">
      <Navbar />

      {/* Subtle Divider below Navbar */}
      <div className="h-px bg-zinc-200 w-full" />

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">

        {/* HEADER & STEPS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3 text-zinc-900">
            <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-zinc-900" />
            Secure Checkout
          </h1>

          {/* Step Indicator */}
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="text-zinc-500">Address</span>
            <ChevronRight className="w-4 h-4 text-zinc-300" />
            <span className="text-zinc-900 font-bold bg-zinc-100 px-3 py-1 rounded-full">Payment</span>
            <ChevronRight className="w-4 h-4 text-zinc-300" />
            <span className="text-zinc-400">Review</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* LEFT COLUMN: INFO & PAYMENT */}
          <div className="flex-1 space-y-8">

            {/* 1. SHIPPING ADDRESS SECTION */}
            <div className={`bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden transition-all ${!selectedAddress ? 'p-8' : ''}`}>

              {/* Header inside card if not selected, otherwise part of the clickable area */}
              {!selectedAddress && (
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-zinc-400" /> Shipping Address
                  </h2>
                </div>
              )}

              {selectedAddress ? (
                // Clickable Address Card
                <div
                  className="group relative bg-white p-6 sm:p-8 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  onClick={() => setShowAddressModal(true)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-zinc-900" />
                      Delivering to
                      <span className="bg-zinc-100 text-zinc-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider">
                        {selectedAddress.type}
                      </span>
                    </h2>

                    {/* Secondary CHANGE Button */}
                    <button
                      type="button"
                      className="text-xs font-bold text-zinc-600 bg-white border border-zinc-200 px-4 py-1.5 rounded-full hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-sm"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                    <span className="font-bold text-zinc-900 text-base">{selectedAddress.name}</span>
                    <span className="hidden sm:inline text-zinc-300">|</span>
                    <span className="text-zinc-500 text-sm font-medium">{selectedAddress.phone}</span>
                  </div>

                  <p className="text-zinc-600 text-sm leading-relaxed max-w-xl">
                    {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.district}, {selectedAddress.state} - <span className="text-zinc-900 font-bold">{selectedAddress.zip}</span>
                  </p>

                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-zinc-200 via-zinc-100 to-white opacity-50" />
                </div>
              ) : (
                // Empty State
                <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-zinc-500 mb-4 text-sm">Where should we send your order?</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 mx-auto hover:bg-black hover:scale-105 transition-all shadow-lg shadow-zinc-200"
                  >
                    <Plus className="w-4 h-4" /> Add New Address
                  </button>
                </div>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-zinc-100">
              <h2 className="text-lg font-bold mb-6 text-zinc-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-zinc-400" /> Payment Method
              </h2>

              <div className="space-y-4">
                {/* Active Payment Method */}
                <div className="flex items-center gap-5 p-5 border border-purple-100 bg-purple-50/10 rounded-2xl cursor-pointer transition-all shadow-sm ring-1 ring-purple-500/10 hover:ring-purple-500/30">
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-[5px] border-purple-600 bg-white" />
                  </div>
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-purple-50">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <span className="block font-bold text-zinc-900 text-sm">Credit / Debit Card</span>
                    <span className="text-xs text-zinc-500 font-medium">Secure encryption via Stripe</span>
                  </div>
                </div>

                {/* Disabled Method */}
                <div className="flex items-center gap-5 p-5 border border-zinc-100 rounded-2xl opacity-40 cursor-not-allowed grayscale bg-zinc-50">
                  <div className="w-5 h-5 rounded-full border border-zinc-300" />
                  <div className="p-2.5 bg-white rounded-xl border border-zinc-100">
                    <span className="w-6 h-6 block bg-zinc-200 rounded-sm" />
                  </div>
                  <span className="font-bold text-zinc-900 text-sm">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="w-full lg:w-[380px]">
            <div className="bg-white p-6 rounded-3xl shadow-lg shadow-zinc-200/50 border border-zinc-100 sticky top-24">
              <h3 className="font-bold text-lg mb-6 text-zinc-900">Order Summary</h3>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.items.map((item: any) => (
                  <div key={`${item.product?._id ?? 'unknown'}-${item.variantSku ?? 'default'}`} className="flex gap-4 group">
                    <div className="w-16 h-20 bg-zinc-100 rounded-lg flex-shrink-0 relative overflow-hidden border border-zinc-100">
                      <img
                        src={item.product?.images?.[0] || item.product?.images?.[0]?.url || '/images/placeholder.png'}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        alt={item.product?.name ?? ''}
                      />
                    </div>
                    <div className="flex-1 py-1">
                      <p className="font-bold text-zinc-900 text-sm truncate mb-1">{item.product.name}</p>
                      <p className="text-zinc-500 text-xs mb-2">Size: {item.variantSku} <span className="mx-1">|</span> Qty: {item.quantity}</p>
                      <span className="font-bold text-sm text-zinc-900">₹{((item.product.price_cents * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 pt-4 space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Subtotal</span>
                  <span className="font-medium text-zinc-900">₹{(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Shipping</span>
                  <span className="font-bold text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Taxes</span>
                  <span className="font-medium text-zinc-900">Calculated</span>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-200 pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="text-zinc-900 font-bold text-base">Total Amount</span>
                  <span className="text-xl font-black text-zinc-900">₹{(subtotal / 100).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddress}
                className="w-full bg-zinc-900 text-white h-14 rounded-xl font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/10 disabled:opacity-70 disabled:hover:scale-100 disabled:shadow-none"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Pay Securely
                  </>
                )}
              </button>

              <div className="text-center mt-6 flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                  <ShieldCheck className="w-3 h-3" /> 100% Secure Payment
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* ADDRESS SELECTION MODAL OR BOTTOM SHEET */}
      {showAddressModal && (
        isMobile ? (
          // Mobile Bottom Sheet
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer" onClick={() => setShowAddressModal(false)}>
            <div
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-lg font-black text-zinc-900">Select Delivery Address</h3>
                <button onClick={() => setShowAddressModal(false)} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 text-zinc-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto bg-zinc-50 min-h-[50vh]">
                <AddressBook
                  clerkUser={user}
                  onSelect={(addr: any) => {
                    setSelectedAddress(addr);
                    setShowAddressModal(false);
                  }}
                  selectedId={selectedAddress?._id}
                />
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full mt-6 py-4 bg-white border border-dashed border-zinc-300 rounded-xl text-zinc-900 font-bold hover:bg-zinc-50 hover:border-zinc-900 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-5 h-5" /> Add New Address
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Desktop Modal
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer" onClick={() => setShowAddressModal(false)}>
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white">
                <h3 className="text-xl font-black text-zinc-900">Select Delivery Address</h3>
                <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50/50">
                <AddressBook
                  clerkUser={user}
                  onSelect={(addr: any) => {
                    setSelectedAddress(addr);
                    setShowAddressModal(false);
                  }}
                  selectedId={selectedAddress?._id}
                />
              </div>
              <div className="p-4 border-t border-zinc-100 bg-white text-center">
                <button onClick={() => setShowAddForm(true)} className="text-zinc-900 font-bold text-sm hover:underline flex items-center justify-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* ADD NEW ADDRESS FORM MODAL (Overlay) */}
      <AddressForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={refreshAddresses}
      />

    </div>
  );
}