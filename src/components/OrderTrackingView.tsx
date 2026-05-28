import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Order, OrderItem } from "../types";
import { 
  Clock, 
  Search, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  HelpCircle,
  Truck,
  ShoppingBag,
  Timer,
  ExternalLink,
  QrCode,
  Check,
  RefreshCw
} from "lucide-react";

interface OrderTrackingViewProps {
  user: { loggedIn: boolean; isAdmin: boolean; name: string; email: string; role: string };
  orders: Order[];
  triggerNotification: (msg: string, type?: "success" | "error" | "info") => void;
  onRefreshOrders?: () => Promise<void>;
  onUpdateOrderStatus?: (orderId: string, status: Order["status"]) => void;
  onUpdateOrderGeneral?: (orderId: string, fields: { items?: any[]; deliveryFee?: number }) => Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void>;
}

export default function OrderTrackingView({ 
  user, 
  orders, 
  triggerNotification, 
  onRefreshOrders,
  onUpdateOrderStatus,
  onUpdateOrderGeneral,
  onDeleteOrder
}: OrderTrackingViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingOrderFields, setEditingOrderFields] = useState<{ id: string; items: OrderItem[]; deliveryFee: number } | null>(null);

  // Filter orders for admin search
  const adminFilteredOrders = useMemo(() => {
    if (!user.isAdmin) return [];
    const sorted = [...orders].sort((a, b) => b.id.localeCompare(a.id));
    if (!searchQuery.trim()) return sorted;
    const query = searchQuery.toLowerCase().trim();
    return sorted.filter(o => 
      o.id.toLowerCase().includes(query) || 
      o.customerName.toLowerCase().includes(query) ||
      o.email.toLowerCase().includes(query) ||
      o.items.some(item => item.name.toLowerCase().includes(query))
    );
  }, [orders, searchQuery, user.isAdmin]);

  // Filter orders related to logged in customer email
  const customerOrders = useMemo(() => {
    return [...orders]
      .filter(o => o.email.toLowerCase() === user.email.toLowerCase())
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [orders, user.email]);

  // Filter by search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return customerOrders;
    const query = searchQuery.toLowerCase().trim();
    return customerOrders.filter(o => 
      o.id.includes(query) || 
      o.customerName.toLowerCase().includes(query) ||
      o.items.some(item => item.name.toLowerCase().includes(query))
    );
  }, [customerOrders, searchQuery]);

  // Auto-select the first order as the default tracked order if none is selected
  const activeTrackedOrder = useMemo(() => {
    if (selectedOrder && customerOrders.some(o => o.id === selectedOrder.id)) {
      // Return fresh copy from upstream state in case status updated
      return customerOrders.find(o => o.id === selectedOrder.id) || selectedOrder;
    }
    return customerOrders[0] || null;
  }, [customerOrders, selectedOrder]);

  const handleDownloadReceipt = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const rawSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const ecoFee = rawSubtotal * 0.05;
    const deliveryFee = order.deliveryFee || 0;
    const itemsText = order.items
      .map(item => `   - ${item.name} x ${item.quantity} (₱${item.price.toFixed(2)} each) -> ₱${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");
      
    const receiptText = `================================================
               ZOE'S BAKE MY DREAM
               RESERVATION RECEIPT
================================================
Order Sequence ID  : ${order.id}
Fulfillment Date   : ${order.date}
Fulfillment Method : ${order.deliveryOption}
Current Progress   : ${order.status}
Payment Channel    : ${order.paymentChannel || "GCash/Maya"}
Payment Reference  : ${order.paymentReference || "N/A"}

------------------------------------------------
Customer Name      : ${order.customerName}
Registered Email   : ${order.email}
Direct Telephone   : ${order.phone || "N/A"}
------------------------------------------------

Items Ordered:
${itemsText}

------------------------------------------------
Pastries Subtotal  : ₱${rawSubtotal.toFixed(2)}
Eco Pack Fee (5%)  : ₱${ecoFee.toFixed(2)}
Local Delivery Fee : ₱${deliveryFee.toFixed(2)}
------------------------------------------------
Total Reservation  : ₱${order.total.toFixed(2)}
================================================
Special Request Notes:
${order.specialRequests || "No specific allergen warnings or ribbons."}

Thank you for choosing Zoe's Bake My Dream!
Your cozy gatherings matter to us. Soft, chewy, and not too sweet!
================================================`;

    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ZoesBakeMyDream_Receipt_${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    triggerNotification(`Receipt file saved for reference ID ${order.id}!`, "success");
  };

  // Status mapping details
  const getStatusProgress = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
        return {
          percent: 15,
          color: "bg-amber-500",
          textColor: "text-amber-600",
          desc: "Our ovens are prepping! Your order is queued and our bakers will mix the premium ingredients soon.",
          steps: [true, false, false, false]
        };
      case "Baking":
        return {
          percent: 50,
          color: "bg-burgundy",
          textColor: "text-burgundy",
          desc: "Hot in the brick oven! Your soft, chewy crinkles are being baked right now under Chef's close supervision.",
          steps: [true, true, false, false]
        };
      case "Ready":
        return {
          percent: 85,
          color: "bg-emerald-500",
          textColor: "text-emerald-600",
          desc: "Freshly dusted & packed! Your pastries are boxed in eco-biodegradable templates and ready for claim / logistics.",
          steps: [true, true, true, false]
        };
      case "Delivered":
        return {
          percent: 100,
          color: "bg-zinc-500",
          textColor: "text-zinc-600",
          desc: "Fulfillment completed! We hope your hand-wrapped bakes bring deep satisfaction to your cozy gathering.",
          steps: [true, true, true, true]
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-alabaster">
      
      {user.isAdmin ? (
        <>
          {/* Editorial Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-putty pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy/10 border border-burgundy/20 text-burgundy text-[10px] font-bold uppercase tracking-wider font-sans">
                <Clock className="w-3.5 h-3.5" /> Baker Control Center
              </div>
              <h1 className="font-serif text-3xl font-extrabold text-charcoal">Fulfillment Orders Pipeline</h1>
              <p className="text-xs text-clay font-sans">
                Update baking progress states, monitor incoming reservations, and download bookkeeping records.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative font-sans text-xs flex-grow md:w-64">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-clay/60" />
                <input 
                  type="text"
                  placeholder="ID, Customer, or treats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy placeholder-clay/50 text-xs shadow-inner"
                />
              </div>
              
              {onRefreshOrders && (
                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      await onRefreshOrders();
                      triggerNotification("Synced orders database successfully!", "success");
                    } catch (err) {
                      triggerNotification("Could not synchronize, check connection.", "error");
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                  className={`p-3 rounded-xl border border-putty bg-white text-zinc-650 hover:text-burgundy hover:border-burgundy/40 active:bg-cream/15 transition flex items-center justify-center shadow-sm cursor-pointer ${isRefreshing ? "text-burgundy animate-spin" : ""}`}
                  title="Sync/Refresh Orders"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
          </div>

          {/* Fulfillment board table */}
          <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto font-sans text-xs">
              {adminFilteredOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-400 font-medium font-sans">
                  <AlertCircle className="w-8 h-8 text-clay/40 mx-auto mb-3 animate-bounce" />
                  <p>No compatible orders matching "{searchQuery}" could be found.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FFF8F0] border-b border-[#E8DCCF]/40 text-[10px] font-bold uppercase text-[#8B5E3C]">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Items Reserved</th>
                      <th className="p-4">Baking Target</th>
                      <th className="p-4">Amount Summary</th>
                      <th className="p-4">Fulfillment Phase / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {adminFilteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/40">
                        <td className="p-4 font-mono font-bold text-gray-700">{o.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-gray-900">{o.customerName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{o.email} | {o.phone}</p>
                        </td>
                        <td className="p-4 max-w-xs">
                          {editingOrderFields?.id === o.id ? (
                            <div className="space-y-2 border border-[#E8DCCF] bg-[#FFF8F0]/35 rounded-xl p-3">
                              <p className="text-[10px] text-[#8B5E3C] font-bold uppercase tracking-wider mb-1">Edit Item Quantities</p>
                              {editingOrderFields.items.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-1 border-b border-[#E8DCCF]/20 pb-1.5 last:border-b-0 last:pb-0">
                                  <span className="text-gray-700 font-semibold truncate max-w-[140px]">{it.name}</span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = editingOrderFields.items.map((item, i) => {
                                          if (i === idx) {
                                            return { ...item, quantity: Math.max(1, item.quantity - 1) };
                                          }
                                          return item;
                                        });
                                        setEditingOrderFields({ ...editingOrderFields, items: newItems });
                                      }}
                                      className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border border-gray-350 rounded-md font-extrabold text-xs select-none cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="w-5 text-center font-bold text-gray-800 text-xs">{it.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = editingOrderFields.items.map((item, i) => {
                                          if (i === idx) {
                                            return { ...item, quantity: item.quantity + 1 };
                                          }
                                          return item;
                                        });
                                        setEditingOrderFields({ ...editingOrderFields, items: newItems });
                                      }}
                                      className="w-5 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border border-gray-350 rounded-md font-extrabold text-xs select-none cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <>
                              <ul className="list-disc list-inside space-y-0.5 font-medium text-gray-600">
                                {o.items.map((it, idx) => (
                                  <li key={idx}>
                                    {it.name} <span className="font-bold text-gray-900">x{it.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                              {o.specialRequests && (
                                <div className="text-[10px] text-amber-800 bg-amber-50 rounded p-1.5 border border-amber-100/70 mt-2 italic">
                                  * {o.specialRequests}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-gray-700">{o.date}</td>
                        <td className="p-4">
                          {editingOrderFields?.id === o.id ? (
                            <div className="space-y-2 border border-[#E8DCCF] bg-[#FFF8F0]/35 rounded-xl p-3 max-w-[150px]">
                              <div>
                                <span className="px-1.5 py-0.5 text-[8px] uppercase font-black bg-[#E8DCCF] text-[#8B5E3C] rounded inline-block">
                                  {o.deliveryOption || "Pickup"}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Deliv Fee (₱)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingOrderFields.deliveryFee}
                                  onChange={(e) => {
                                    setEditingOrderFields({ ...editingOrderFields, deliveryFee: parseFloat(e.target.value) || 0 });
                                  }}
                                  className="w-full px-2 py-1 border border-putty rounded bg-white font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-burgundy text-xs shadow-inner"
                                />
                              </div>
                              <div className="text-[8px] text-clay/85 pt-1 border-t border-dashed border-[#E8DCCF]">
                                Sum: <span className="font-bold text-gray-800">₱{(editingOrderFields.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + editingOrderFields.deliveryFee).toFixed(2)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 font-sans">
                              <span className="px-1.5 py-0.5 text-[8px] uppercase font-black bg-[#E8DCCF] text-[#8B5E3C] rounded mr-1 inline-block">
                                {o.deliveryOption || "Pickup"}
                              </span>
                              {o.deliveryFee !== undefined && o.deliveryFee > 0 && (
                                <p className="text-[10px] text-clay">
                                  Fee: <span className="font-semibold text-charcoal">₱{o.deliveryFee.toFixed(2)}</span>
                                </p>
                              )}
                              <p className="font-serif font-bold text-[#8B5E3C] text-sm">₱{o.total.toFixed(2)}</p>
                            </div>
                          )}
                        </td>
                        <td className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              o.status === "Pending" ? "bg-amber-100 text-amber-800" :
                              o.status === "Baking" ? "bg-[#8B5E3C] text-white" :
                              o.status === "Ready" ? "bg-blue-600 text-white" :
                              "bg-emerald-100 text-emerald-850"
                            }`}>
                              {o.status}
                            </span>
                          </div>

                          {editingOrderFields?.id === o.id ? (
                            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-gray-150 font-sans">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (onUpdateOrderGeneral) {
                                    await onUpdateOrderGeneral(o.id, {
                                      items: editingOrderFields.items,
                                      deliveryFee: editingOrderFields.deliveryFee
                                    });
                                  }
                                  setEditingOrderFields(null);
                                }}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[8px] uppercase tracking-wider text-center cursor-pointer shadow-sm transition"
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingOrderFields(null)}
                                className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 rounded-lg font-bold text-[8px] uppercase tracking-wider text-center cursor-pointer transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5 mt-1.5 pt-1.5 border-t border-gray-100 font-sans">
                              {o.status === "Pending" && onUpdateOrderStatus && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateOrderStatus(o.id, "Baking");
                                    triggerNotification(`Order ${o.id} status advanced to Baking!`, "success");
                                  }}
                                  className="w-full py-1.5 bg-[#8B5E3C] hover:bg-[#734A2E] text-white rounded-lg font-bold text-[8px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm cursor-pointer transition"
                                >
                                  🔥 Start Baking
                                </button>
                              )}
                              
                              {o.status === "Baking" && onUpdateOrderStatus && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateOrderStatus(o.id, "Ready");
                                    triggerNotification(`Order ${o.id} status advanced to Ready!`, "success");
                                  }}
                                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[8px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm cursor-pointer transition"
                                >
                                  ✨ Mark as Ready
                                </button>
                              )}

                              {o.status === "Ready" && onUpdateOrderStatus && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateOrderStatus(o.id, "Delivered");
                                    triggerNotification(`Order ${o.id} status advanced to Delivered!`, "success");
                                  }}
                                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[8px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm cursor-pointer transition"
                                >
                                  ✅ Confirm Delivered
                                </button>
                              )}

                              <div className="grid grid-cols-2 gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingOrderFields({ id: o.id, items: [...o.items], deliveryFee: o.deliveryFee || 0 })}
                                  className="py-1 bg-gray-100 hover:bg-amber-50 hover:text-[#8B5E3C] text-gray-700 border border-gray-250 font-bold text-[8px] uppercase rounded-md tracking-wider transition cursor-pointer text-center"
                                  title="Edit Items & Delivery Fee"
                                >
                                  ✏️ Edit Order
                                </button>

                                <button
                                  onClick={(e) => handleDownloadReceipt(o, e)}
                                  className="py-1 bg-gray-50 hover:bg-gray-100 text-zinc-650 border border-gray-200 rounded-md font-bold text-[8px] uppercase cursor-pointer flex items-center justify-center gap-0.5 tracking-wider transition"
                                  title="Download transaction text receipt file"
                                >
                                  <Download className="w-2 mx-auto" strokeWidth={3} />
                                  <span>Receipt</span>
                                </button>
                              </div>

                              {onDeleteOrder && (
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`⚠️ Are you sure you want to permanently DELETE Order #${o.id} for ${o.customerName}?`)) {
                                      await onDeleteOrder(o.id);
                                    }
                                  }}
                                  className="w-full mt-1.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 hover:border-rose-300 rounded-lg font-bold text-[8px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                                  title="Delete order permanently"
                                >
                                  🗑️ Delete Order
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Editorial Section Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy/10 border border-burgundy/20 text-burgundy text-[10px] font-bold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" /> Customer Logistics Hub
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-charcoal">Real-Time Order Tracker</h1>
        <p className="text-xs sm:text-sm text-clay font-sans leading-relaxed">
          Exclusively available for our registered **Customer Patrons**. Keep an eye on your crinkles as they transition from raw premium cocoa to oven-baked perfection.
        </p>
      </div>

      {customerOrders.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-putty max-w-2xl mx-auto p-8 space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-cream rounded-full border border-putty flex items-center justify-center mx-auto text-burgundy animate-pulse">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-serif font-bold text-charcoal">No logged reservations found</h3>
            <p className="text-xs text-clay max-w-md mx-auto leading-relaxed">
              Your loyalty account (<span className="font-semibold text-charcoal">{user.email}</span>) does not have any pending or previous pre-orders in Zoe's pipeline.
            </p>
          </div>
          <p className="text-[11px] text-clay/70 italic">
            Need specialized crinkles, Biscoff lava cores, or matcha combinations?
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                // Set active tab to menu in order to purchase
                const tabBtn = document.querySelector('button[title*="Basket"]') || document.getElementById("booking-section");
                window.location.hash = "menu";
                // Let's rely on standard page interaction
                triggerNotification("Redirecting to pastry catalog. Choose your treats!", "info");
              }}
              className="px-6 py-3 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer shadow-md font-sans"
            >
              Start Your Bake Reservation
            </button>
          </div>
        </div>
      ) : (
        /* Main Layout Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Orders Pipeline List (L: 5/12) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white rounded-2xl p-5 border border-putty shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif font-bold text-charcoal text-base font-sans">My Orders ({customerOrders.length})</h3>
                <div className="flex items-center gap-2">
                  {onRefreshOrders && (
                    <button
                      onClick={async () => {
                        setIsRefreshing(true);
                        try {
                          await onRefreshOrders();
                          triggerNotification("Synced with Zoe's baking logs! Refreshed in real-time.", "success");
                        } catch (err) {
                          triggerNotification("Synchronize failed. Verify details or try again.", "error");
                        } finally {
                          setIsRefreshing(false);
                        }
                      }}
                      disabled={isRefreshing}
                      className={`p-1.5 rounded-lg border border-putty bg-white text-clay hover:text-burgundy hover:border-burgundy/40 active:bg-cream/10 transition cursor-pointer flex items-center justify-center ${isRefreshing ? "text-burgundy" : ""}`}
                      title="Sync/Refresh Order Status"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                  )}
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Secure Link
                  </span>
                </div>
              </div>

              {/* Search Orders */}
              <div className="relative font-sans text-xs">
                <Search className="w-4 h-4 text-clay absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, item name..."
                  className="w-full pl-9 pr-12 py-2.5 rounded-xl border border-putty text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy bg-white placeholder-clay/55"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="absolute right-3 top-2.5 text-[10px] text-clay hover:text-burgundy font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* List Frame */}
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-putty p-6">
                  <p className="text-xs text-clay font-medium">No filtered results matched.</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isActive = activeTrackedOrder && activeTrackedOrder.id === order.id;
                  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 rounded-2xl border transition duration-250 cursor-pointer text-left relative overflow-hidden group ${
                        isActive 
                          ? "bg-white border-burgundy shadow-md ring-1 ring-burgundy/20" 
                          : "bg-white border-putty hover:border-burgundy/40 shadow-xs"
                      }`}
                    >
                      {/* Highlight accent bar for active */}
                      {isActive && <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-burgundy" />}

                      <div className="flex justify-between items-start gap-2 mb-2 font-sans">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-charcoal bg-cream border border-putty px-2.5 py-0.5 rounded shadow-inner">
                              Order ID #{order.id}
                            </span>
                            {order.paymentReference && (
                              <span className="inline-flex items-center text-[8px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                                Paid via {order.paymentChannel || "GCash"}
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-clay font-medium mt-1">
                            {order.date} • {order.deliveryOption}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block font-serif font-black text-rose-950 text-sm">₱{order.total.toFixed(2)}</span>
                          <span className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 border ${
                            order.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                            order.status === "Baking" ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse" :
                            order.status === "Ready" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-zinc-100 text-zinc-500 border-zinc-200"
                          }`}>
                            {order.status === "Pending" ? "Pending Rise" :
                             order.status === "Baking" ? "In Oven" :
                             order.status === "Ready" ? "Ready" : "Fulfilled"}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-cream pt-2.5 mt-2 flex justify-between items-center text-[11px] text-clay">
                        <span className="truncate max-w-[200px]">
                          {order.items.map(item => `${item.name} (${item.quantity})`).join(", ")}
                        </span>
                        <span className="font-semibold text-burgundy group-hover:underline flex items-center gap-0.5 text-[10px] uppercase">
                          Track Details ➔
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Visual Progress Tracker Screen (R: 7/12) */}
          <div className="lg:col-span-7">
            
            {activeTrackedOrder ? (
              <div className="bg-white rounded-3xl border border-putty shadow-sm overflow-hidden text-left">
                
                {/* Active Tracking Header Banner */}
                <div className="bg-cream/20 p-6 border-b border-putty space-y-3 relative">
                  {/* Subtle vector background */}
                  <div className="absolute right-6 top-6 text-burgundy/10 pointer-events-none">
                    <QrCode className="w-24 h-24 stroke-[1]" />
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="space-y-1 font-sans">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-burgundy">Logistics Tracking Screen</span>
                      <h2 className="font-serif font-extrabold text-charcoal text-xl">Order Reference: {activeTrackedOrder.id}</h2>
                      <p className="text-xs text-clay">
                        Fulfillment reserved for <span className="text-charcoal font-semibold">{activeTrackedOrder.customerName}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {onRefreshOrders && (
                        <button
                          onClick={async () => {
                            setIsRefreshing(true);
                            try {
                              await onRefreshOrders();
                              triggerNotification("Updated order progress successfully!", "success");
                            } catch (err) {
                              triggerNotification("Could not retrieve update.", "error");
                            } finally {
                              setIsRefreshing(false);
                            }
                          }}
                          disabled={isRefreshing}
                          className={`flex items-center gap-1.5 px-3.5 py-2 border border-burgundy/30 bg-white hover:bg-cream/10 text-burgundy rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shadow-xs disabled:opacity-75`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> 
                          {isRefreshing ? "Refreshing..." : "Refresh Status"}
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDownloadReceipt(activeTrackedOrder, e)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-burgundy hover:bg-burgundy/90 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shadow"
                      >
                        <Download className="w-3.5 h-3.5" /> Save Official Summary
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8 font-sans">
                  
                  {/* Beautiful Timeline Graphical Map */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-clay uppercase tracking-widest">Progress Stage Timeline</h3>
                    
                    <div className="relative pt-2 pb-6">
                      {/* Background Bar */}
                      <div className="absolute top-7 left-3 sm:left-4 right-3 sm:right-4 h-1.5 bg-cream rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-burgundy transition-all duration-700" 
                          style={{ width: `${getStatusProgress(activeTrackedOrder.status).percent}%` }}
                        />
                      </div>

                      {/* Timeline Icons & Labels Row */}
                      <div className="relative flex justify-between justify-items-center text-center">
                        
                        {/* Step 1: Pending */}
                        <div className="flex flex-col items-center max-w-[80px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition z-10 shadow ${
                            getStatusProgress(activeTrackedOrder.status).steps[0]
                              ? "bg-burgundy border-burgundy text-white font-bold"
                              : "bg-white border-putty text-clay"
                          }`}>
                            <Timer className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold mt-2 text-charcoal block leading-tight">Pending Rise</span>
                        </div>

                        {/* Step 2: Baking */}
                        <div className="flex flex-col items-center max-w-[80px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition z-10 shadow ${
                            getStatusProgress(activeTrackedOrder.status).steps[1]
                              ? "bg-burgundy border-burgundy text-white font-bold animate-pulse"
                              : "bg-white border-putty text-clay"
                          }`}>
                            🔥
                          </div>
                          <span className="text-[10px] font-bold mt-2 text-charcoal block leading-tight">In Oven</span>
                        </div>

                        {/* Step 3: Ready */}
                        <div className="flex flex-col items-center max-w-[80px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition z-10 shadow ${
                            getStatusProgress(activeTrackedOrder.status).steps[2]
                              ? "bg-emerald-500 border-emerald-500 text-white font-bold"
                              : "bg-white border-putty text-clay"
                          }`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold mt-2 text-charcoal block leading-tight">Ready</span>
                        </div>

                        {/* Step 4: Delivered */}
                        <div className="flex flex-col items-center max-w-[80px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition z-10 shadow ${
                            getStatusProgress(activeTrackedOrder.status).steps[3]
                              ? "bg-zinc-500 border-zinc-500 text-white font-bold"
                              : "bg-white border-putty text-clay"
                          }`}>
                            {activeTrackedOrder.deliveryOption === "Pickup" ? "🛍️" : <Truck className="w-5 h-5" />}
                          </div>
                          <span className="text-[10px] font-bold mt-2 text-charcoal block leading-tight">Fulfilled</span>
                        </div>

                      </div>
                    </div>

                    {/* Stage descriptions banner */}
                    <div className="p-4 rounded-2xl bg-cream/35 border border-putty text-xs text-charcoal leading-relaxed flex gap-3 items-start shadow-inner">
                      <AlertCircle className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
                      <div>
                        <p className={`font-bold uppercase tracking-wider ${getStatusProgress(activeTrackedOrder.status).textColor}`}>
                          Active Status: {activeTrackedOrder.status === 'Pending' ? 'Pending Rise' : activeTrackedOrder.status === 'Baking' ? 'In Brick Oven' : activeTrackedOrder.status === 'Ready' ? 'Ready for Pickup / Logistics' : 'Order Fulfilled'}
                        </p>
                        <p className="text-clay text-[11px] mt-1">
                          {getStatusProgress(activeTrackedOrder.status).desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-cream">
                    
                    {/* Item list table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-clay uppercase tracking-widest">Selected Pastries</h4>
                      <div className="bg-alabaster/40 rounded-2xl border border-putty p-4.5 space-y-3.5">
                        {activeTrackedOrder.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-xs text-charcoal">
                            <div>
                              <span className="font-bold">{item.name}</span>
                              <span className="text-clay font-medium text-[10px] block mt-0.5">₱{item.price.toFixed(2)} each</span>
                            </div>
                            <span className="font-semibold text-burgundy font-serif">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                        {(() => {
                          const rawSubtotal = activeTrackedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                          const ecoFee = rawSubtotal * 0.05;
                          const deliveryFee = activeTrackedOrder.deliveryFee || 0;
                          return (
                            <div className="border-t border-cream pt-3 space-y-2 text-xs">
                              <div className="flex justify-between items-center text-clay font-sans">
                                <span>Pastries Subtotal</span>
                                <span>₱{rawSubtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-clay font-sans">
                                <span>Eco Pack Fee (5%)</span>
                                <span>₱{ecoFee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-clay font-sans">
                                <span>Local Delivery Fee</span>
                                <span className={deliveryFee > 0 ? "font-bold text-burgundy" : ""}>
                                  ₱{deliveryFee.toFixed(2)}
                                </span>
                              </div>
                              <div className="border-t border-dashed border-putty pt-2 flex justify-between items-center text-xs font-serif font-black text-charcoal">
                                <span>Total Reservation Due</span>
                                <span className="text-burgundy text-sm">₱{activeTrackedOrder.total.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Logistics Coordinates & Metadata */}
                    <div className="space-y-4">
                      
                      {/* Shipping information card */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-extrabold text-clay uppercase tracking-widest">Fulfillment Coordinates</h4>
                        <div className="space-y-2.5 text-xs text-clay">
                          <div className="flex gap-2 items-start">
                            <MapPin className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-charcoal">Fulfillment Mode</p>
                              <p className="text-[11px] text-clay/90 mt-0.5">{activeTrackedOrder.deliveryOption} — Scheduled precisely on {activeTrackedOrder.date}</p>
                              {activeTrackedOrder.deliveryOption === "Delivery" && (activeTrackedOrder.deliveryAddress || activeTrackedOrder.landmark) && (
                                <div className="mt-2 p-2 bg-cream/15 rounded-lg border border-putty space-y-1">
                                  {activeTrackedOrder.deliveryAddress && (
                                    <p className="text-[10px] text-charcoal"><span className="font-bold">Address:</span> {activeTrackedOrder.deliveryAddress}</p>
                                  )}
                                  {activeTrackedOrder.landmark && (
                                    <p className="text-[10px] text-zinc-500 font-sans italic"><span className="font-bold text-charcoal font-serif">Landmark:</span> {activeTrackedOrder.landmark}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 items-start">
                            <Phone className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-charcoal">Delivery Contact Info</p>
                              <p className="text-[11px] text-clay/90 mt-0.5">Tel: {activeTrackedOrder.phone || "No phone provided"} <br/> Email: {activeTrackedOrder.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Verification card */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-clay uppercase tracking-widest">GCash / Maya Verification</h4>
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-2xl relative font-sans">
                          <Check className="w-4 h-4 text-emerald-600 absolute right-3.5 top-3.5" />
                          <p className="text-xs font-bold text-charcoal">Settlement Authenticated</p>
                          <div className="mt-1.5 grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-clay/80 uppercase block tracking-wider">Channel</span>
                              <span className="font-serif font-bold text-emerald-800">{activeTrackedOrder.paymentChannel || "GCash"}</span>
                            </div>
                            <div>
                              <span className="text-clay/80 uppercase block tracking-wider">Reference Code</span>
                              <span className="font-mono font-bold text-charcoal truncate block">{activeTrackedOrder.paymentReference || "Pre-Verified"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Special requests box if present */}
                  {activeTrackedOrder.specialRequests && (
                    <div className="p-4 rounded-r-2xl border-l-4 border-burgundy bg-cream/15">
                      <p className="text-[10px] uppercase font-extrabold text-clay tracking-wider mb-1">Chef Ribbon Notes or Allergen Warnings</p>
                      <p className="text-xs text-charcoal italic">"{activeTrackedOrder.specialRequests}"</p>
                    </div>
                  )}

                  {/* Baker Advice disclaimer line */}
                  <div className="pt-4 border-t border-cream flex items-start gap-2 text-[10px] text-clay/80 leading-relaxed italic">
                    <HelpCircle className="w-4 h-4 text-burgundy shrink-0" />
                    <span>
                      Need to reschedule your baking slot? Contact Camille’s artisan support immediately on local Laguna digits <span className="font-semibold text-charcoal">+63 9364578985</span> (WhatsApp line available). Mention order sequence ID <span className="font-mono font-semibold text-charcoal">#{activeTrackedOrder.id}</span>.
                    </span>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-putty h-full flex items-center justify-center py-20 text-center p-8">
                <p className="text-sm text-clay font-medium font-sans">Select an order sequence from the left sidebar to render active baking coordinates.</p>
              </div>
            )}

          </div>

        </div>
      )}
        </>
      )}

    </div>
  );
}
