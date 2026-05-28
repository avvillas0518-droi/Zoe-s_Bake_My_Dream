import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Order, OrderItem } from "../types";
import { 
  User, 
  Mail, 
  ShoppingBag, 
  Award, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Phone,
  Download
} from "lucide-react";

interface ProfileViewProps {
  user: { loggedIn: boolean; isAdmin: boolean; name: string; email: string };
  orders: Order[];
  onUpdateUserName: (nextName: string) => void;
  setActiveTab: (tab: string) => void;
  triggerNotification: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function ProfileView({ 
  user, 
  orders, 
  onUpdateUserName, 
  setActiveTab, 
  triggerNotification 
}: ProfileViewProps) {
  const [internalTab, setInternalTab] = useState<"history" | "loyalty" | "account">("history");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  
  // Sorting options state
  const [sortMethod, setSortMethod] = useState<"dateDesc" | "dateAsc" | "priceDesc" | "priceAsc" | "status">("dateDesc");
  
  // Account Form local settings
  const [editedName, setEditedName] = useState(user.name);
  const [editedPhone, setEditedPhone] = useState("");

  // Filters orders pertaining specifically to the logged-in customer's email
  const customerOrders = orders.filter(
    (order) => order.email.toLowerCase() === user.email.toLowerCase()
  );

  // Calculate dynamic statistics based on user's reservation history
  const totalSpend = customerOrders.reduce((sum, order) => sum + order.total, 0);
  const totalPoints = Math.round(totalSpend * 10); // 10 points per dollar
  const totalBakesCount = customerOrders.reduce((bakes, order) => {
    return bakes + order.items.reduce((acc, item) => acc + item.quantity, 0);
  }, 0);

  // Classify Loyalty Tiers based on their points
  let loyaltyTier = "Crumb Initiate";
  let tierColor = "text-clay bg-cream border-putty";
  let tierDesc = "Earn points by reserving artisan batches of Brioche bread and gourmet cookies!";

  if (totalPoints >= 1500) {
    loyaltyTier = "Champion";
    tierColor = "text-amber-700 bg-amber-50 border-amber-200";
    tierDesc = "Elite Master tier! Priority oven allocations and Camille's custom recipe invitations unlocked.";
  } else if (totalPoints >= 500) {
    loyaltyTier = "Golden Butter Patron";
    tierColor = "text-burgundy bg-cream border-putty";
    tierDesc = "Vastly respected patron. Free eco-boxes and 10% holiday combo discounts applied automatically.";
  } else if (totalPoints > 0) {
    loyaltyTier = "Active Fermenter";
    tierColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    tierDesc = "Brioche wild yeast active! You are on your way to earning amazing rewards.";
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleDownloadReceipt = (order: Order, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    const itemsText = order.items
      .map((item) => `   - ${item.name} x ${item.quantity} (₱${item.price.toFixed(2)} each) -> ₱${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");
      
    const receiptText = `================================================
          BAKE MY DREAM ARTISAN BAKERY
               RESERVATION RECEIPT
================================================
Order Key Reference: ${order.id}
Fulfillment Date   : ${order.date}
Fulfillment Method : ${order.deliveryOption}
Status             : ${order.status}

------------------------------------------------
Customer Name      : ${order.customerName}
Registered Email   : ${order.email}
Direct Telephone   : ${order.phone || "N/A"}
------------------------------------------------

Items Ordered:
${itemsText}

------------------------------------------------
Subtotal           : ₱${(order.total / 1.05).toFixed(2)}
Eco Pack Fee (5%)  : ₱${(order.total - (order.total / 1.05)).toFixed(2)}
------------------------------------------------
Total Settled      : ₱${order.total.toFixed(2)}
================================================
Special Request Notes:
${order.specialRequests || "No specific allergen warnings or ribbons."}

Thank you for co-designing with Chef Camille Sumaya!
Please present your Order Key Reference at our brick window
on your fulfillment date to claim your fresh bake.
================================================`;

    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BakeMyDream_Receipt_${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    triggerNotification(`Receipt text file for reservation ${order.id} downloaded successfully!`, "success");
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim()) {
      triggerNotification("Your visible name cannot be empty.", "error");
      return;
    }
    onUpdateUserName(editedName);
    triggerNotification("Account attributes successfully saved in local loyalty logs!", "success");
  };

  // Helper status styling selector
  const getStatusBadgeStyles = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          text: "Pending Rise",
          progress: 25
        };
      case "Baking":
        return {
          bg: "bg-burgundy/10 text-burgundy border-burgundy/20",
          text: "In Brick Oven",
          progress: 60
        };
      case "Ready":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          text: "Ready for Pickup",
          progress: 90
        };
      case "Delivered":
        return {
          bg: "bg-zinc-100 text-zinc-500 border-zinc-200",
          text: "Fulfilled",
          progress: 100
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans text-clay bg-alabaster">
      
      {/* ─── PROFILE DASHBOARD HEADER ─── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-putty shadow-sm mb-8 relative overflow-hidden"
      >
        {/* Glow Ambient Lights */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-burgundy/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          
          {/* Left Avatar block */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-burgundy text-white rounded-full flex items-center justify-center font-serif text-2xl sm:text-3xl font-black shadow-inner border border-putty">
                {user.name ? user.name.charAt(0).toUpperCase() : "C"}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full border border-putty shadow">
                <Award className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif text-2xl sm:text-3xl font-black text-charcoal leading-tight">
                  {user.name || "Loyalty Patron"}
                </h1>
                <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wider ${tierColor}`}>
                  {loyaltyTier}
                </span>
              </div>
              <p className="text-xs text-clay flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-clay/70" />
                {user.email}
              </p>
              <p className="text-[11px] text-clay/80 italic mt-1.5 font-sans leading-relaxed">
                {tierDesc}
              </p>
            </div>
          </div>

          {/* Right Statistics Widgets */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 shrink-0 font-sans">
            <div className="bg-cream/15 p-4 rounded-2xl border border-putty text-center min-w-[90px] sm:min-w-[110px] shadow-sm">
              <span className="block text-[9px] font-extrabold uppercase text-clay tracking-wider">Total Orders</span>
              <span className="font-serif font-black text-xl sm:text-2xl text-charcoal block mt-1">{customerOrders.length}</span>
            </div>
            <div className="bg-cream/15 p-4 rounded-2xl border border-putty text-center min-w-[90px] sm:min-w-[110px] shadow-sm">
              <span className="block text-[9px] font-extrabold uppercase text-clay tracking-wider">Items Reserved</span>
              <span className="font-serif font-black text-xl sm:text-2xl text-burgundy block mt-1">{totalBakesCount}</span>
            </div>
            <div className="bg-cream/15 p-4 rounded-2xl border border-putty text-center min-w-[90px] sm:min-w-[110px] shadow-sm">
              <div className="flex items-center justify-center gap-0.5 text-amber-500">
                <Award className="w-3 mx-auto" />
              </div>
              <span className="block text-[9px] font-extrabold uppercase text-clay tracking-wider">Loyalty Points</span>
              <span className="font-serif font-black text-xl sm:text-2xl text-amber-500 block mt-0.5">{totalPoints}</span>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ─── TWO COLUMN NAVIGATION AREA ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar controls (3/12) */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: "history", label: "Order History", icon: Clock, count: customerOrders.length },
            { id: "loyalty", label: "Loyalty & Rewards", icon: Award, count: null },
            { id: "account", label: "Account Settings", icon: User, count: null }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = internalTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setInternalTab(tab.id as any)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-burgundy text-white border-transparent shadow-md" 
                    : "bg-white hover:bg-cream/30 border-putty text-clay hover:text-burgundy"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-cream text-clay"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents Frame (9/12) */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            
            {/* TAB: ORDER HISTORY */}
            {internalTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-cream pb-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-charcoal">Your Previous Reservations</h2>
                    <p className="text-xs text-clay mt-1">Real-time status tracking for oven-baked items booked under {user.email}</p>
                  </div>
                  <span className="text-[10px] bg-burgundy/10 text-burgundy px-3 py-1 rounded-full border border-burgundy/20 font-bold uppercase tracking-wider">
                    {customerOrders.length} Reserv'd
                  </span>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-putty p-8 space-y-4 shadow-sm">
                    <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto border border-putty text-burgundy">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-charcoal">No previous orders detected</h3>
                      <p className="text-xs text-clay mt-1 max-w-sm mx-auto leading-relaxed">
                        It looks like you haven't placed any pre-orders on Camille's pipeline yet. Visit the menu to reserve your fresh batch!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("menu")}
                      className="px-6 py-3 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer font-sans"
                    >
                      Browse Pastry Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4.5">
                    {/* Sorting Bar Controls widget */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-putty shadow-xs font-sans text-xs">
                      <div>
                        <span className="font-bold text-charcoal block">Refine List Layout</span>
                        <span className="text-[10px] text-clay font-medium block mt-0.5">Filter your historic purchases by chronological date or billing amount scales.</span>
                      </div>
                      <select
                        value={sortMethod}
                        onChange={(e) => setSortMethod(e.target.value as any)}
                        className="border border-putty rounded-xl px-3 py-2 focus:ring-2 focus:ring-burgundy/25 focus:outline-none bg-white text-charcoal font-semibold text-xs cursor-pointer select-none"
                      >
                        <option value="dateDesc">📅 Newest Fulfillment Date</option>
                        <option value="dateAsc">📅 Oldest Fulfillment Date</option>
                        <option value="priceDesc">💰 Total Price: High to Low</option>
                        <option value="priceAsc">💰 Total Price: Low to High</option>
                        <option value="status">⚙️ Baking oven progress status</option>
                      </select>
                    </div>

                    {([...customerOrders].sort((a, b) => {
                      if (sortMethod === "dateDesc") {
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                      }
                      if (sortMethod === "dateAsc") {
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                      }
                      if (sortMethod === "priceDesc") {
                        return b.total - a.total;
                      }
                      if (sortMethod === "priceAsc") {
                        return a.total - b.total;
                      }
                      const statusMap: Record<Order["status"], number> = { Pending: 0, Baking: 1, Ready: 2, Delivered: 3 };
                      return (statusMap[a.status] ?? 0) - (statusMap[b.status] ?? 0);
                    })).map((order) => {
                      const statusInfo = getStatusBadgeStyles(order.status);
                      const isExpanded = !!expandedOrders[order.id];

                      return (
                        <div 
                          key={order.id}
                          className="bg-white rounded-2xl border border-putty overflow-hidden hover:border-burgundy/40 transition duration-300 shadow-xs"
                        >
                          {/* Card Main Bar */}
                          <div 
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-cream/15 transition select-none"
                          >
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-mono text-xs font-extrabold text-charcoal bg-cream border border-putty px-2.5 py-1 rounded">
                                  {order.id}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}>
                                  {statusInfo.text}
                                </span>
                                <span className="text-[10px] text-clay font-semibold uppercase tracking-wider flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-burgundy" />
                                  {order.date}
                                </span>
                              </div>
                              <p className="text-xs text-clay">
                                {order.items.length} product{order.items.length > 1 ? "s" : ""} reservation under <span className="text-charcoal font-medium">{order.customerName}</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-start gap-4">
                              <button
                                onClick={(e) => handleDownloadReceipt(order, e)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-burgundy/10 hover:bg-burgundy text-burgundy hover:text-white border border-burgundy/20 hover:border-transparent rounded-xl text-[10px] font-bold uppercase tracking-wider transition duration-250 cursor-pointer shrink-0"
                                title="Download simple text receipt summary"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Receipt</span>
                              </button>

                              <div className="text-right">
                                <span className="block text-[9px] font-extrabold text-clay uppercase tracking-widest">Total cost</span>
                                <span className="font-serif font-black text-base text-burgundy">₱{order.total.toFixed(2)}</span>
                              </div>
                              <div className="p-1.5 bg-white rounded-full border border-putty text-burgundy">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          {/* Expansion detail view */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="border-t border-cream bg-cream/10"
                              >
                                <div className="p-5 space-y-5 text-xs sm:text-sm font-sans">
                                  
                                  {/* Progress Visual Tracker */}
                                  <div className="space-y-2 max-w-xl font-sans">
                                    <div className="flex justify-between text-[10px] font-extrabold text-clay uppercase tracking-wider">
                                      <span>Pending Rise</span>
                                      <span>In Oven</span>
                                      <span>Ready</span>
                                      <span>Fulfilled</span>
                                    </div>
                                    <div className="relative h-2 w-full bg-white rounded-full overflow-hidden border border-putty shadow-inner">
                                      <div 
                                        className="h-full bg-burgundy rounded-full transition-all duration-500"
                                        style={{ width: `${statusInfo.progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-[10px] text-clay block mt-1 leading-relaxed italic">
                                      {order.status === "Pending" ? "⏳ Order is queued. Our bakers will verify and trigger rise shortly." :
                                       order.status === "Baking" ? "🔥 Brioche layers have shifted to our master brick steam oven!" :
                                        order.status === "Ready" ? "✨ Packed in organic craft boxes. Visit the shop window with your reservation key!" :
                                        "✅ Fulfill'd and taken home. We hope it brought joy to your assembly!"}
                                    </span>
                                  </div>

                                  {/* Items Table details */}
                                  <div className="bg-white rounded-xl border border-putty p-4.5 space-y-3.5 shadow-xs">
                                    <div className="flex justify-between items-center border-b border-cream pb-1.5">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-clay">
                                        Pastry Breakdown
                                      </span>
                                      <button
                                        onClick={(e) => handleDownloadReceipt(order, e)}
                                        className="text-[9px] font-bold text-burgundy hover:text-burgundy/80 flex items-center gap-1 cursor-pointer transition select-none"
                                        title="Download simple text receipt summary"
                                      >
                                        <Download className="w-3 h-3" /> Download Summary
                                      </button>
                                    </div>
                                    <div className="space-y-2.5">
                                      {order.items.map((item: OrderItem, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-xs text-charcoal">
                                          <div>
                                            <span className="font-bold text-charcoal">{item.name}</span>
                                            <span className="text-clay px-1.5">x</span>
                                            <span className="font-semibold text-burgundy">{item.quantity}</span>
                                          </div>
                                          <span className="font-mono text-clay">₱{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                      ))}
                                      
                                      {/* Subtotal specs */}
                                      <div className="border-t border-cream pt-3 flex flex-col gap-1 text-[11px] font-medium text-clay">
                                        <div className="flex justify-between">
                                          <span>Fulfillment Logistics ({order.deliveryOption})</span>
                                          <span>Free</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Biodegradable Pack Surcharge (5%)</span>
                                          <span>Included</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-charcoal text-xs pt-1.5 border-t border-cream">
                                          <span className="flex items-center gap-1.5">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                            Amount Settled
                                          </span>
                                          <span className="font-mono text-burgundy text-sm">₱{order.total.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Special Requests or Notes */}
                                  {order.specialRequests && (
                                    <div className="p-3 bg-cream/15 border-l-2 border-burgundy rounded-r-xl">
                                      <p className="text-[10px] uppercase font-extrabold text-clay mb-0.5 tracking-wider">Chef Special Request Notes:</p>
                                      <p className="text-xs text-charcoal italic">"{order.specialRequests}"</p>
                                    </div>
                                  )}

                                  {/* Delivery & contact info */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-cream text-xs text-clay">
                                    <div className="flex items-start gap-2">
                                      <MapPin className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
                                      <div>
                                        <p className="font-bold text-charcoal">Fulfillment Delivery Method</p>
                                        <p className="text-[11px] mt-0.5">{order.deliveryOption} — Handed precisely on {order.date}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Phone className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
                                      <div>
                                        <p className="font-bold text-charcoal">Patron Registered Contact Details</p>
                                        <p className="text-[11px] mt-0.5">{order.phone || "No phone listed"} • {order.email}</p>
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: LOYALTY DETAILS */}
            {internalTab === "loyalty" && (
              <motion.div
                key="loyalty"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-cream pb-4">
                  <h2 className="font-serif text-2xl font-bold text-charcoal">Bake My Dream Loyalty Program</h2>
                  <p className="text-xs text-clay mt-1">Unlock sweet privileges, birthday gifts, and baker consulting access</p>
                </div>

                {/* Loyalty Tier Progress */}
                <div className="bg-white border border-putty p-6 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase text-clay tracking-wider">Current Points Balance</span>
                      <span className="font-serif font-black text-3xl text-amber-500 mt-1 block">{totalPoints} Pts</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-extrabold uppercase text-clay tracking-wider">My Current Tier</span>
                      <span className="text-xs font-bold text-charcoal block mt-1 px-3 py-1 bg-amber-50 rounded-full border border-amber-200">
                        {loyaltyTier}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-clay font-bold">
                      <span>Tier Progress (Bronze ➔ Silver ➔ Gold)</span>
                      <span>{totalPoints} / 1500 points</span>
                    </div>
                    <div className="relative h-3 w-full bg-cream rounded-full overflow-hidden border border-putty">
                      <div 
                        className="h-full bg-burgundy rounded-full"
                        style={{ width: `${Math.min(100, (totalPoints / 1500) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Grid of benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-xl border border-putty space-y-3 shadow-xs">
                    <div className="p-2.5 bg-burgundy/10 text-burgundy rounded-xl w-fit">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-charcoal text-base">Crumb Initiate (0+ Pts)</h3>
                    <p className="text-clay text-xs leading-relaxed">
                      Earn 10 points for every ₱1 spent. Get notified immediately when limited custom menus or weekend combinations release.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-putty space-y-3 shadow-xs">
                    <div className="p-2.5 bg-burgundy/10 text-burgundy rounded-xl w-fit">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-charcoal text-base">Golden Butter Patron (500+ Pts)</h3>
                    <p className="text-clay text-xs leading-relaxed">
                      10% discount codes sent to your registered loyalty email weekly. Priority queues during major holidays and local delivery events.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-putty space-y-3 shadow-xs">
                    <div className="p-2.5 bg-burgundy/10 text-amber-500 rounded-xl w-fit">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-charcoal text-base">Laminated Champion (1500+ Pts)</h3>
                    <p className="text-clay text-xs leading-relaxed">
                      Private 1-on-1 birthday calls/consulting with Master Chef Camille. Full waive of packaging and express delivery rates.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: ACCOUNT SETTINGS */}
            {internalTab === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="border-b border-cream pb-4">
                  <h2 className="font-serif text-2xl font-bold text-charcoal">Loyalty Account Attributes</h2>
                  <p className="text-xs text-clay mt-1 font-sans">Manage your contact credentials and credentials on our custom booking loggers</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="bg-white border border-putty p-6 rounded-2xl space-y-5 shadow-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-clay uppercase tracking-widest mb-1.5">Visible Full Name</label>
                      <input 
                        type="text" 
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-3 rounded-xl border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy transition"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-clay uppercase tracking-widest mb-1.5">Loyalty Member Email (Locked)</label>
                      <input 
                        type="email" 
                        value={user.email}
                        disabled
                        className="w-full text-xs px-3.5 py-3 rounded-xl border border-putty bg-cream/30 text-clay/60 focus:outline-none cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-clay uppercase tracking-widest mb-1.5">Phone Number</label>
                    <input 
                      type="tel" 
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-3 rounded-xl border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy transition placeholder-clay/55"
                      placeholder="+63 "
                    />
                  </div>

                  <div className="pt-2 border-t border-cream flex items-center justify-between">
                    <p className="text-[10px] text-clay/70 flex items-center gap-1.5 italic">
                      <AlertCircle className="w-3.5 h-3.5 text-burgundy shrink-0" />
                      Changes persist locally under your browser session.
                    </p>
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer shadow-xs"
                    >
                      Save Account Parameters
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
