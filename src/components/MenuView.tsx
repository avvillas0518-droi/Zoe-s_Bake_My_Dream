import React, { useState, useMemo } from "react";
import { Search, Plus, Minus, X, CreditCard, QrCode, CheckCircle, Info, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, CartItem } from "../types";
import AIPastryAdvisor from "./AIPastryAdvisor";

interface MenuViewProps {
  products: Product[];
  cart: CartItem[];
  user?: { loggedIn: boolean; name: string; email: string; role?: string };
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateCartQuantity: (id: string, delta: number) => void;
  onSetCartQuantity?: (id: string, quantity: number) => void;
  onRemoveFromCart: (id: string, name: string) => void;
  onCheckout: (details: { 
    name: string; 
    email: string; 
    phone: string; 
    deliveryOption: string; 
    date: string; 
    requests: string; 
    paymentReference?: string; 
    paymentChannel?: string;
    deliveryAddress?: string;
    landmark?: string;
  }) => void;
  triggerNotification: (message: string, type?: "success" | "error" | "info") => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  setActiveTab?: (tab: string) => void;
}

export default function MenuView({
  products,
  cart,
  user,
  onAddToCart,
  onUpdateCartQuantity,
  onSetCartQuantity,
  onRemoveFromCart,
  onCheckout,
  triggerNotification,
  selectedCategory,
  setSelectedCategory,
  setActiveTab,
}: MenuViewProps) {
  const [menuSearch, setMenuSearch] = useState("");
  const [sortOption, setSortOption] = useState("popular");

  // Booking fields state
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");

  // Auto-fill coordinates if logged in
  React.useEffect(() => {
    if (user && user.loggedIn) {
      setBookingName(user.name || "");
      setBookingEmail(user.email || "");
    }
  }, [user]);
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingOption, setBookingOption] = useState("Pickup");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingRequests, setBookingRequests] = useState("");
  const [bookingAddress, setBookingAddress] = useState("");
  const [bookingLandmark, setBookingLandmark] = useState("");
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});

  // Payment UI QR Code flow integration
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentChannel, setPaymentChannel] = useState<"GCash" | "Maya">("GCash");
  const [paymentReference, setPaymentReference] = useState("");
  const [uploadedQrCode, setUploadedQrCode] = useState<string>("");

  React.useEffect(() => {
    if (showPaymentModal) {
      fetch("/api/payment/qr")
        .then(res => res.json())
        .then(data => {
          if (data && data.qrImage) {
            setUploadedQrCode(data.qrImage);
          } else {
            setUploadedQrCode("");
          }
        })
        .catch(err => console.error("Error fetching payment QR code:", err));
    }
  }, [showPaymentModal]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by Category
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter((p) => {
        if (selectedCategory === "Crinkles") {
          return p.category === "Crinkles" || p.category === "Cookies";
        }
        return p.category === selectedCategory;
      });
    }

    // Filter by Search Keyword
    if (menuSearch.trim() !== "") {
      const kw = menuSearch.toLowerCase().trim();
      list = list.filter((p) => 
        p.name.toLowerCase().includes(kw) || 
        p.description.toLowerCase().includes(kw) ||
        p.category.toLowerCase().includes(kw)
      );
    }

    // Sorting Option
    if (sortOption === "low-to-high") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOption === "high-to-low") {
      list.sort((a, b) => b.price - a.price);
    } else {
      // Popular (Featured has slight preference)
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [products, selectedCategory, menuSearch, sortOption]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerNotification("Your pre-order basket is completely empty.", "error");
      return;
    }
    if (!bookingName || !bookingEmail || !bookingPhone || !bookingDate) {
      triggerNotification("Please fill in all mandatory pre-order credentials.", "error");
      return;
    }

    const selectedDate = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      triggerNotification("Past dates are blocked for custom pre-orders. Please select today or a future date.", "error");
      return;
    }
    if (bookingOption === "Delivery" && (!bookingAddress.trim() || !bookingLandmark.trim())) {
      triggerNotification("Please provide both Delivery Address and Landmark for Local Delivery.", "error");
      return;
    }

    // Open payment modal displaying Gcash & Maya QR codes for immediate checkout
    setShowPaymentModal(true);
  };

  const handleFinalPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentReference.trim()) {
      triggerNotification("Please enter your GCash / Maya reference number to log confirmation.", "error");
      return;
    }

    // Trigger parent checkout behavior with payment details included
    onCheckout({
      name: bookingName,
      email: bookingEmail,
      phone: bookingPhone,
      deliveryOption: bookingOption,
      date: bookingDate,
      requests: bookingRequests,
      paymentReference: paymentReference.trim(),
      paymentChannel: paymentChannel,
      deliveryAddress: bookingOption === "Delivery" ? bookingAddress.trim() : undefined,
      landmark: bookingOption === "Delivery" ? bookingLandmark.trim() : undefined
    });

    // Reset Form fields
    setBookingName("");
    setBookingEmail("");
    setBookingPhone("");
    setBookingOption("Pickup");
    setBookingDate("");
    setBookingRequests("");
    setBookingAddress("");
    setBookingLandmark("");
    setPaymentReference("");
    setShowPaymentModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 bg-alabaster">
      
      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-charcoal mb-2">Our Pastry Menu</h1>
        <p className="text-xs sm:text-sm text-clay font-sans leading-relaxed">
        Fully handcrafted items baked fresh. Specify your fulfillment details to reserve a private batch.
        </p>
      </div>

      {/* Main Grid: Left Side incorporates Menu Search & Listings, Right Side holds Pre-Order Basket */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Products lists column (L: 8/12) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Controls Panel */}
          <div className="bg-white rounded-2xl p-5 border border-putty shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              
              {/* Search */}
              <div className="sm:col-span-8 relative font-sans">
                <Search className="w-4 h-4 text-clay absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search delicious treats (e.g., Cookie, Brioche bread)..."
                  className="w-full pl-9 pr-12 py-2.5 text-xs sm:text-sm rounded-xl border border-putty text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy focus:border-transparent transition bg-white placeholder-clay/55"
                />
                {menuSearch && (
                  <button 
                    onClick={() => setMenuSearch("")} 
                    className="absolute right-3 top-3 text-[10px] text-clay hover:text-burgundy font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sorter */}
              <div className="sm:col-span-4 font-sans">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-putty text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy bg-white transition cursor-pointer"
                >
                  <option value="popular">Popular First</option>
                  <option value="low-to-high">Cost: Low to High</option>
                  <option value="high-to-low">Cost: High to Low</option>
                </select>
              </div>

            </div>

            {/* Category selection bar */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-cream font-sans">
              {['All', 'Crinkles', 'Cakes', 'Bread'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-burgundy text-white shadow' 
                      : 'bg-white text-clay border border-putty hover:bg-cream/40 hover:text-burgundy'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pastry Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-putty p-8 space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-cream rounded-full flex items-center justify-center mx-auto text-burgundy">
                👑
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal">No bakes matched your parameters</h3>
                <p className="text-[11px] text-clay mt-1">Try expanding your check categories or simplify keywords!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredProducts.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl border border-putty overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full group"
                >
                  <div className="relative aspect-[4/3] bg-cream/15 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className={`absolute top-3 left-3 px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded-full shadow border ${
                      (item.available && (item.stock === undefined || item.stock > 0)) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {(item.available && (item.stock === undefined || item.stock > 0)) ? `In Stock: ${item.stock ?? 10} left` : 'Sold Out'}
                    </span>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h3 className="font-serif font-extrabold text-charcoal text-base sm:text-lg leading-tight group-hover:text-burgundy transition-all">{item.name}</h3>
                      <span className="font-serif font-black text-burgundy text-base">₱{item.price.toFixed(2)}</span>
                    </div>
                    
                    <p className="text-xs text-clay leading-relaxed mb-5 flex-grow font-sans">{item.description}</p>
                    
                    <div className="pt-3 border-t border-cream mt-auto font-sans">
                      {item.available && (item.stock === undefined || item.stock > 0) ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 border border-putty rounded-xl bg-white px-2 py-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setCardQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: Math.max(1, (prev[item.id] || 1) - 1),
                                }));
                              }}
                              className="p-1 text-clay hover:text-red-500 font-bold cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={cardQuantities[item.id] || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setCardQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: !isNaN(val) ? Math.max(1, val) : 1,
                                }));
                              }}
                              className="w-10 text-center text-xs font-bold text-charcoal bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCardQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: (prev[item.id] || 1) + 1,
                                }));
                              }}
                              className="p-1 text-clay hover:text-burgundy font-bold cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => {
                              const qty = cardQuantities[item.id] || 1;
                              onAddToCart(item, qty);
                              setCardQuantities((prev) => ({ ...prev, [item.id]: 1 }));
                            }}
                            className="flex-grow py-2.5 bg-burgundy/10 hover:bg-burgundy text-burgundy hover:text-white font-bold text-xs rounded-xl border border-burgundy/20 hover:border-transparent transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Book {cardQuantities[item.id] || 1} to Basket
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 bg-zinc-100 text-zinc-400 font-bold text-xs rounded-xl cursor-not-allowed border border-zinc-200 text-center uppercase"
                        >
                          Sold Out - Next Batch Baking!
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Generator Box Inline */}
          <AIPastryAdvisor
            onAddCustomProductToCart={onAddToCart}
            triggerNotification={triggerNotification}
          />

        </div>

        {/* Dynamic Cart & Reservation Details (R: 4/12) */}
        <div id="my-basket-section" className="lg:col-span-4 space-y-6 scroll-mt-24">
          
          <div className="bg-white rounded-3xl p-6 border border-putty shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-charcoal flex items-center justify-between">
              <span>My Basket</span>
              <span className="text-[10px] bg-burgundy/10 border border-burgundy/20 text-burgundy px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{cartCount} bakes</span>
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-clay border-2 border-dashed border-putty rounded-2xl p-4 font-sans space-y-1 bg-cream/10">
                <p className="text-xs font-semibold">Pre-order list is empty</p>
                <p className="text-[10px] text-clay/70">Choose bakes or co-create with Camille’s AI above!</p>
              </div>
            ) : (
              <div className="space-y-4 font-sans text-xs">
                <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-2.5 justify-between items-center bg-cream/15 p-2.5 rounded-xl border border-putty">
                      <img src={item.image} alt="" className="w-10 h-10 object-cover rounded-lg border border-putty" />
                      
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-charcoal truncate leading-tight">{item.name}</p>
                        <p className="text-[10px] text-clay font-serif mt-0.5">₱{item.price.toFixed(2)} each</p>
                      </div>
                      
                      <div className="flex items-center gap-1 border border-putty rounded-lg bg-white px-1 py-0.5 shrink-0">
                        <button onClick={() => onUpdateCartQuantity(item.id, -1)} className="p-0.5 text-clay hover:text-red-500 font-bold cursor-pointer">
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              onSetCartQuantity?.(item.id, Math.max(1, val));
                            } else {
                              onSetCartQuantity?.(item.id, 1);
                            }
                          }}
                          className="w-10 text-center text-xs font-bold text-charcoal bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                        />
                        <button onClick={() => onUpdateCartQuantity(item.id, 1)} className="p-0.5 text-clay hover:text-burgundy font-bold cursor-pointer">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button 
                        onClick={() => onRemoveFromCart(item.id, item.name)} 
                        className="text-clay hover:text-red-500 p-1 shrink-0 cursor-pointer"
                        title="Remove product"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sub-total specs */}
                <div className="pt-4 border-t border-cream space-y-1.5">
                  <div className="flex justify-between text-clay">
                    <span>Items Subtotal</span>
                    <span>₱{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-clay">
                    <span>Eco Packaging fee (5%)</span>
                    <span>₱{(cartSubtotal * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-serif font-black text-sm text-burgundy pt-2 border-t border-dashed border-putty">
                    <span>Reservation Due</span>
                    <span>₱{(cartSubtotal * 1.05).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Secure pre-order booking details FORM */}
          <div id="booking-section" className="bg-white rounded-3xl p-6 border border-putty shadow-sm space-y-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-charcoal mb-1">Pre-Order Details</h3>
              <p className="text-[10px] text-clay font-sans">Handcrafted reservations required 1 day advance.</p>
            </div>

            {(!user || !user.loggedIn) && (
              <div id="guest-checkout-prompt" className="bg-amber-500/5 border border-amber-200/50 rounded-2xl p-4 text-xs text-clay font-sans space-y-2">
                <p className="font-bold text-[#8B5E3C] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Checkout as Guest
                </p>
                <p className="text-[11px] leading-relaxed text-clay/90">
                  Guest checkout is fully active. However, please note that guest accounts cannot track baking progress or review past receipts in the tracker.
                </p>
                {setActiveTab && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("auth")}
                    className="text-[#8B5E3C] font-extrabold hover:underline cursor-pointer uppercase tracking-widest text-[9.5px]"
                  >
                    Sign In or Join & Loyalty Track ➔
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitCheckout} className="space-y-4.5 font-sans text-xs">
              <div>
                <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Your Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  placeholder="Rodel Cantuba" 
                  className="w-full px-3.5 py-2.5 rounded-lg border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy placeholder-clay/55"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    placeholder="charlotte@louvre.com" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy placeholder-clay/55"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="+1 555-0101" 
                    className="w-full px-3.5 py-2.5 rounded-lg border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy placeholder-clay/55"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Option</label>
                  <select 
                    value={bookingOption}
                    onChange={(e) => setBookingOption(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-lg border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy cursor-pointer"
                  >
                    <option value="Pickup" className="bg-white text-charcoal">Bakery Pickup</option>
                    <option value="Delivery" className="bg-white text-charcoal">Local Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Baking Date</label>
                  <input 
                    type="date" 
                    required 
                    value={bookingDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy h-[34px]"
                  />
                </div>
              </div>

              {bookingOption === "Delivery" && (
                <div 
                  className="space-y-4 p-4 bg-cream/15 border border-putty rounded-2xl font-sans"
                >
                  <div>
                    <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Delivery Address *</label>
                    <input 
                      type="text" 
                      required 
                      value={bookingAddress}
                      onChange={(e) => setBookingAddress(e.target.value)}
                      placeholder="Street name, Barangay, Building, House/Unit no." 
                      className="w-full px-3.5 py-2.5 rounded-lg border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy placeholder-clay/55"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Nearest Landmark *</span>
                      <span className="text-[9px] text-[#8B5E3C] lowercase font-normal italic">for easier navigation</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={bookingLandmark}
                      onChange={(e) => setBookingLandmark(e.target.value)}
                      placeholder="e.g. Opposite Barangay Hall / Near the blue water tank" 
                      className="w-full px-3.5 py-2.5 rounded-lg border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy placeholder-clay/55"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5 font-semibold">Special Requests / Ribbons / Allergy warns</label>
                <textarea 
                  rows={2}
                  value={bookingRequests}
                  onChange={(e) => setBookingRequests(e.target.value)}
                  placeholder="e.g. Write Happy Birthday Gwen! Or Walnut-free warnings..."
                  className="w-full px-3.5 py-2 rounded-lg border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy resize-none placeholder-clay/55"
                />
              </div>

              <button
                type="submit"
                disabled={cart.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest transition-all cursor-pointer text-[10px] ${
                  cart.length === 0 
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200' 
                    : 'bg-burgundy hover:bg-burgundy/90 text-white shadow-md'
                }`}
              >
                Place Pre-Order Reservation
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* GCash / Maya Payments QR Code Settlement Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full border border-putty shadow-2xl overflow-hidden relative"
            >
              
              {/* Modal Brand Header */}
              <div className={`p-5 text-white flex justify-between items-center transition-colors duration-300 ${
                paymentChannel === "GCash" ? "bg-[#0c4da2]" : "bg-zinc-900"
              }`}>
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-white animate-pulse" />
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest">Artisan Settlement</h3>
                    <p className="text-[10px] text-white/80">Pay via {paymentChannel} Merchant Network</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 space-y-6 text-left">
                
                {/* Total Cost Alert Panel */}
                <div className="p-4 rounded-2xl bg-cream/35 border border-putty flex justify-between items-center font-sans">
                  <div>
                    <span className="block text-[9px] uppercase font-extrabold text-clay tracking-wider">Total Amount Due</span>
                    <span className="text-[10px] text-clay/85 mt-0.5 block">Includes 5% Biodegradable Packing Fee</span>
                  </div>
                  <div className="text-right">
                    <span className="font-serif font-black text-xl text-burgundy">
                      ₱{(cartSubtotal * 1.05).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Secure Gateway Toggle (GCash vs Maya) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold text-clay uppercase tracking-widest">Select Gateway Channel</label>
                  <div className="grid grid-cols-2 gap-3.5 font-sans">
                    {/* GCash */}
                    <button
                      type="button"
                      onClick={() => setPaymentChannel("GCash")}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition text-center cursor-pointer ${
                        paymentChannel === "GCash"
                          ? "border-[#0c4da2] bg-[#0c4da2]/5 text-[#0c4da2]"
                          : "border-putty hover:border-clay/40 bg-white text-clay"
                      }`}
                    >
                      <span className="text-sm font-black tracking-tighter block">GCash</span>
                      <span className="text-[8px] font-semibold uppercase mt-1">Instant Scan</span>
                    </button>

                    {/* PayMaya */}
                    <button
                      type="button"
                      onClick={() => setPaymentChannel("Maya")}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition text-center cursor-pointer ${
                        paymentChannel === "Maya"
                          ? "border-zinc-900 bg-zinc-900/5 text-zinc-900"
                          : "border-putty hover:border-clay/40 bg-white text-clay"
                      }`}
                    >
                      <span className="text-sm font-black tracking-tighter block">PayMaya</span>
                      <span className="text-[8px] font-semibold uppercase mt-1">Digital Maya QR</span>
                    </button>
                  </div>
                </div>

                {/* Master merchant QR Code illustration in vector layout */}
                <div className="relative p-4 rounded-3xl bg-cream/10 border border-dashed border-putty text-center space-y-4">
                  
                  {/* Floating scan line simulation */}
                  <div className="absolute left-6 right-6 h-[2px] bg-red-500/30 blur-[1px] animate-[bounce_3s_infinite]" />

                  {/* QR Vector Frame or Uploaded Image */}
                  <div className="relative inline-flex items-center justify-center bg-white p-2.5 rounded-2xl shadow-inner border border-zinc-150 mx-auto w-[170px] h-[170px]">
                    {uploadedQrCode ? (
                      <img 
                        src={uploadedQrCode} 
                        alt="Owner Merchant QR Code" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <svg width="150" height="150" viewBox="0 0 100 100">
                        {/* Finder patterns */}
                        <rect x="0" y="0" width="30" height="30" fill="#2d2d2d" rx="2" />
                        <rect x="5" y="5" width="20" height="20" fill="#ffffff" rx="1" />
                        <rect x="10" y="10" width="10" height="10" fill="#000000" rx="1" />
                        
                        <rect x="70" y="0" width="30" height="30" fill="#2d2d2d" rx="2" />
                        <rect x="75" y="5" width="20" height="20" fill="#ffffff" rx="1" />
                        <rect x="80" y="10" width="10" height="10" fill="#000000" rx="1" />
                        
                        <rect x="0" y="70" width="30" height="30" fill="#2d2d2d" rx="2" />
                        <rect x="5" y="75" width="20" height="20" fill="#ffffff" rx="1" />
                        <rect x="10" y="80" width="10" height="10" fill="#000000" rx="1" />
                        
                        {/* Alignment patterns */}
                        <rect x="75" y="75" width="10" height="10" fill="#2d2d2d" rx="1" />
                        <rect x="77" y="77" width="6" height="6" fill="#ffffff" rx="1" />
                        <rect x="79" y="79" width="2" height="2" fill="#2d2d2d" />
                        
                        {/* Timing belts / Dots structure */}
                        <rect x="35" y="5" width="4" height="4" fill="#2d2d2d" />
                        <rect x="45" y="5" width="4" height="4" fill="#2d2d2d" />
                        <rect x="55" y="5" width="4" height="4" fill="#2d2d2d" />
                        
                        <rect x="5" y="35" width="4" height="4" fill="#2d2d2d" />
                        <rect x="5" y="45" width="4" height="4" fill="#2d2d2d" />
                        <rect x="5" y="55" width="4" height="4" fill="#2d2d2d" />
                        
                        {/* Dense QR blocks representing random data bytes */}
                        <path d="M35 15h4v4h-4zm10 0h4v4h-4zm10 0h4v4h-4zm0 10h4v4h-4zm-10 0h4v4h-4zm20 10h4v4h-4zm10 0h4v4h-4zm-20 10h4v4h-4zm-10 10h4v4h-4zm20 10h4v4h-4zm10 10h4v4h-4zm-20 10h4v4h-4z" fill="#2d2d2d" />
                        <path d="M0 35h10v4h-10zm15 0h10v4h-10zm20 5h10v4H35zm15 15h12v4H50zm15-5h10v4H65zm0 15h10v4H65zm15 15h10v4H80zm5-30h10v4H85zm0 10h10v4H85z" fill="#202020" />
                        <path d="M35 50h4v4h-4zm10 0h4v4h-4zm10 0h4v4h-4zm15-15h4v4h-4zm0 10h4v4h-4zm10-10h4v4h-4zm0 10h4v4h-4zm-10 15h4v4h-4zm10 0h4v4h-4zm10-15h4v4h-4zm0 10h4v4h-4z" fill="#333333" />
                        
                        {/* Central brand logo placeholder frame */}
                        <rect x="36" y="36" width="28" height="28" fill="#ffffff" rx="4" />
                        <text x="50" y="49" textAnchor="middle" fontSize="6" fontWeight="900" fill="#800020" fontFamily="'Playfair Display', serif">ZOE</text>
                        <text x="50" y="55" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#800020" opacity="0.8">BAKES</text>
                      </svg>
                    )}
                  </div>
                  {uploadedQrCode && (
                    <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 py-1 px-2.5 rounded inline-block">
                      ✦ Custom Payment QR Applied ✦
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-charcoal">Account Name: ZOE'S BAKE MY DREAM</p>
                    <p className="text-[11px] font-mono text-burgundy font-bold">GCash / Maya Send: 0917-555-0199</p>
                    <p className="text-[9px] text-clay leading-relaxed">
                      Please scan this QR code or send GCash/Maya directly to our account. Ensure the amount matches the total due to prevent baking queuing delays.
                    </p>
                  </div>

                </div>

                {/* Audit step: reference input */}
                <form onSubmit={handleFinalPaymentSubmit} className="space-y-4">
                  <div className="space-y-1.5 font-sans">
                    <label className="block text-[10px] font-extrabold text-clay uppercase tracking-widest">
                      13-Digit {paymentChannel} Reference String
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder={paymentChannel === "GCash" ? "e.g. 5039281920192" : "e.g. MYA98281019"}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-putty text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy bg-white placeholder-clay/55"
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-2 border-t border-cream flex gap-3 font-sans">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="w-1/3 py-3 border border-putty hover:bg-cream/10 text-clay font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-3 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Settle & Submit</span>
                    </button>
                  </div>
                </form>

              </div>

              {/* Secure lock footer disclaimer */}
              <div className="p-3 bg-cream/15 border-t border-cream text-center flex items-center justify-center gap-1 text-[8px] tracking-widest uppercase font-extrabold text-clay/70">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Brioche Loyalty Secure Checkout
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
