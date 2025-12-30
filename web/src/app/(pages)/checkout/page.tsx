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
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
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


  if (!isLoaded || loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  if (orderSuccess) {
    const displayFirstName = orderData?.shippingAddress?.firstName || user?.firstName;
    const displayEmail = orderData?.shippingAddress?.email || user?.primaryEmailAddress?.emailAddress;

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
          <Link href="/product" className="text-primary underline mt-2 inline-block">Go Shopping</Link>
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

          {/* LEFT COLUMN: INFO & PAYMENT */}
          <div className="flex-1 space-y-8">

            {/* 1. SHIPPING ADDRESS SECTION */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:shadow-2xl hover:shadow-gray-200/60">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" /> Shipping Address
                </h2>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="text-xs font-bold text-primary border border-primary px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all uppercase tracking-wide"
                  >
                    Change
                  </button>
                )}
              </div>

              {selectedAddress ? (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wide">
                      {selectedAddress.type}
                    </span>
                    <span className="font-bold text-gray-900">{user?.fullName}</span>
                    <span className="text-gray-400 text-sm font-medium">{selectedAddress.phone}</span>
                  </div>
                  <p className="text-gray-700 font-medium leading-relaxed">
                    {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.district}, {selectedAddress.state} - <span className="text-black font-bold">{selectedAddress.zip}</span>
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-black text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 mx-auto hover:scale-105 transition-transform shadow-lg"
                  >
                    <Plus className="w-5 h-5" /> Add New Address
                  </button>
                </div>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:shadow-2xl hover:shadow-gray-200/60">
              <h2 className="text-xl font-bold mb-8 text-gray-900">Payment Method</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-5 p-5 border border-purple-200 bg-purple-50/30 rounded-2xl cursor-pointer transition-all shadow-sm ring-1 ring-purple-500/20">
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
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddress}
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

      {/* ADDRESS SELECTION MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900">Select Delivery Address</h3>
              <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <AddressBook
                clerkUser={user}
                onSelect={(addr: any) => {
                  setSelectedAddress(addr);
                  setShowAddressModal(false);
                }}
                selectedId={selectedAddress?._id}
              />
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
              <button onClick={() => setShowAddForm(true)} className="text-primary font-bold text-sm hover:underline">
                + Add New Address
              </button>
            </div>
          </div>
        </div>
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