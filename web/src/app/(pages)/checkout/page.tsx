"use client"
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import Navbar from '../components/Navbar';
import { Loader2, CheckCircle, Lock, CreditCard, ShieldCheck, MapPin, Plus, ChevronRight, X, ShoppingBag } from 'lucide-react';
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
    const displayFirstName = orderData?.shippingAddress?.name?.split(' ')[0] || user?.firstName;
    const displayEmail = orderData?.shippingAddress?.email || user?.primaryEmailAddress?.emailAddress;
    const displayOrderId = orderData?._id ? `#EYORIS-${orderData._id.slice(-6).toUpperCase()}` : `#ORDER-${Math.floor(Math.random() * 100000)}`;

    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 shadow-sm ring-1 ring-emerald-100">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-4xl font-serif font-medium mb-4 text-gray-900">Order Confirmed!</h1>

          {/* Order Meta */}
          <div className="flex flex-col items-center gap-2 mb-8 text-sm">
            <span className="font-medium text-gray-900 bg-gray-50 px-4 py-1.5 rounded-full tracking-wide border border-gray-100">
              Order ID: <span className="font-bold">{displayOrderId}</span>
            </span>
            <p className="text-gray-500 font-light">Estimated delivery: 5–7 business days</p>
          </div>

          <p className="text-gray-600 mb-10 max-w-lg text-lg font-light leading-relaxed">
            Thanks {displayFirstName}! We&apos;ve sent a receipt to <b className="font-medium text-gray-900">{displayEmail}</b>. Your order is being prepared.
          </p>

          <div className="flex flex-col w-full max-w-xs gap-4 sm:flex-row sm:max-w-none sm:w-auto">
            <Link
              href="/products"
              className="w-full bg-gray-900 text-white px-8 py-3.5 rounded-full font-medium hover:bg-black transition-all shadow-lg shadow-gray-200 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 sm:w-auto"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Link>

            <Link
              href="/profile?tab=orders"
              className="w-full bg-white text-gray-900 border border-gray-200 px-8 py-3.5 rounded-full font-medium hover:border-gray-900 transition-all text-center sm:w-auto"
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
        <div className="flex flex-col items-center justify-center py-32 bg-gray-50/30 m-6 rounded-3xl border border-dashed border-gray-200">
          <h2 className="text-2xl font-serif font-medium text-gray-900 mb-2">Your bag is empty</h2>
          <p className="text-gray-500 mb-6 font-light">Looks like you haven't added anything yet.</p>
          <Link href="/products" className="text-gray-900 font-medium underline underline-offset-4 hover:text-black">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">

        {/* HEADER & STEPS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-medium flex items-center gap-4 text-gray-900">
            Secure Checkout
          </h1>

          {/* Step Indicator */}
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-gray-400">Address</span>
            <ChevronRight className="w-4 h-4 text-gray-200" />
            <span className="text-gray-900 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">Payment</span>
            <ChevronRight className="w-4 h-4 text-gray-200" />
            <span className="text-gray-300">Review</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          {/* LEFT COLUMN: INFO & PAYMENT */}
          <div className="flex-1 space-y-10">

            {/* 1. SHIPPING ADDRESS SECTION */}
            <div className={`transition-all duration-300 ${!selectedAddress ? 'p-0' : ''}`}>

              {/* Header inside if needed */}
              {!selectedAddress && (
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm font-bold border border-gray-100">1</span>
                    Shipping Address
                  </h2>
                </div>
              )}

              {selectedAddress ? (
                // Clickable Address Card
                <div
                  className="group relative bg-white p-8 rounded-2xl border border-gray-200 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all duration-300"
                  onClick={() => setShowAddressModal(true)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-900" />
                      Delivering to
                      <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider border border-gray-200">
                        {selectedAddress.type}
                      </span>
                    </h2>

                    {/* Secondary CHANGE Button */}
                    <button
                      type="button"
                      className="text-xs font-bold text-gray-900 px-5 py-2 rounded-full border border-gray-200 hover:bg-gray-900 hover:text-white transition-all"
                    >
                      Change
                    </button>
                  </div>

                  <div className="pl-8 border-l-2 border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
                      <span className="font-bold text-gray-900 text-lg">{selectedAddress.name}</span>
                      <span className="text-gray-500 font-light text-sm">{selectedAddress.phone}</span>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed max-w-xl font-light">
                      {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.district}, {selectedAddress.state} - <span className="text-gray-900 font-medium">{selectedAddress.zip}</span>
                    </p>
                  </div>
                </div>
              ) : (
                // Empty State
                <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                  <p className="text-gray-500 mb-6 font-light">Where should we ship your order?</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-white text-gray-900 px-8 py-3 rounded-full font-medium text-sm flex items-center gap-2 mx-auto border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add New Address
                  </button>
                </div>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="pt-8 border-t border-gray-100">
              <h2 className="text-xl font-medium mb-8 text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm font-bold border border-gray-100">2</span>
                Payment Method
              </h2>

              <div className="space-y-4">
                {/* Active Payment Method: Credit / Debit Card */}
                <div
                  role="radio"
                  aria-checked="true"
                  tabIndex={0}
                  className="group relative flex items-center gap-6 p-6 border border-gray-200 bg-white rounded-2xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-900 ring-1 ring-transparent hover:ring-gray-900/5"
                >
                  <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                    <div className="w-5 h-5 rounded-full border-[5px] border-gray-900 bg-white" />
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl shrink-0">
                    <CreditCard className="w-6 h-6 text-gray-900" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="block font-medium text-gray-900 text-base">Credit / Debit Card</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500 hidden sm:block" />
                    </div>
                    <span className="text-xs text-gray-400 font-light flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Encrypted & Secure
                    </span>
                  </div>
                </div>

                {/* Disabled Method: PayPal / Wallet */}
                <div
                  className="flex items-center gap-6 p-6 border border-gray-100 rounded-2xl opacity-60 cursor-not-allowed bg-gray-50/50"
                  aria-disabled="true"
                >
                  <div className="w-5 h-5 rounded-full border border-gray-300 shrink-0" />

                  <div className="p-3 bg-white border border-gray-100 rounded-xl shrink-0">
                    <div className="w-6 h-6 bg-gray-200 rounded-md" />
                  </div>

                  <div className="flex-1">
                    <span className="block font-medium text-gray-400">PayPal / Wallet</span>
                    <span className="text-xs text-gray-400 font-light">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100 sticky top-24">
              <h3 className="font-serif font-medium text-xl mb-6 text-gray-900">Order Summary</h3>

              <div className="space-y-5 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.items.map((item: any) => (
                  <div key={`${item.product?._id ?? 'unknown'}-${item.variantSku ?? 'default'}`} className="flex gap-4 group">
                    <div className="w-16 h-20 bg-white rounded-lg flex-shrink-0 relative overflow-hidden border border-gray-100 shadow-sm">
                      <img
                        src={item.product?.images?.[0] || item.product?.images?.[0]?.url || '/images/placeholder.png'}
                        className="object-cover w-full h-full"
                        alt={item.product?.name ?? ''}
                      />
                    </div>
                    <div className="flex-1 py-1">
                      <p className="font-medium text-gray-900 text-sm truncate mb-1 pr-4">{item.product.name}</p>
                      <p className="text-gray-500 text-xs mb-1 font-light">Size: {item.variantSku} | Qty: {item.quantity}</p>
                      <span className="font-medium text-sm text-gray-900">₹{((item.product.price_cents * item.quantity) / 100).toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-light">Subtotal</span>
                  <span className="font-medium text-gray-900">₹{(subtotal / 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-light">Shipping</span>
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-light">Taxes</span>
                  <span className="font-medium text-gray-900">Calculated</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-8">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-900 font-medium text-base">Total</span>
                  <span className="text-2xl font-serif font-medium text-gray-900">₹{(subtotal / 100).toFixed(0)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddress}
                className="w-full bg-gray-900 text-white h-14 rounded-full font-medium hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-gray-200 disabled:opacity-70 disabled:hover:scale-100 disabled:shadow-none tracking-wide text-sm"
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" /> Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Pay Securely
                  </>
                )}
              </button>

              <div className="text-center mt-6 flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure Checkout
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
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-lg font-serif font-medium text-gray-900">Select Delivery Address</h3>
                <button onClick={() => setShowAddressModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto bg-gray-50/50 min-h-[50vh]">
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
                  className="w-full mt-6 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium hover:border-gray-900 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-5 h-5" /> Add New Address
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Desktop Modal
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer" onClick={() => setShowAddressModal(false)}>
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-gray-100" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="text-xl font-serif font-medium text-gray-900">Select Delivery Address</h3>
                <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30">
                <AddressBook
                  clerkUser={user}
                  onSelect={(addr: any) => {
                    setSelectedAddress(addr);
                    setShowAddressModal(false);
                  }}
                  selectedId={selectedAddress?._id}
                />
              </div>
              <div className="p-6 border-t border-gray-100 bg-white text-center">
                <button onClick={() => setShowAddForm(true)} className="text-gray-900 font-medium text-sm hover:underline underline-offset-4 flex items-center justify-center gap-2 mx-auto">
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