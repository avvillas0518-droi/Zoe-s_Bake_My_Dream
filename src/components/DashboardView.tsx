import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash, 
  Edit3, 
  CheckCircle, 
  Package, 
  Award, 
  Star, 
  Eye, 
  Download, 
  Info, 
  BarChart2, 
  AlertTriangle, 
  RefreshCw,
  QrCode,
  Mail,
  Upload,
  X,
  Check
} from "lucide-react";
import { Product, Order, BakeryStory, BakeryAddress, AdminProfile, Promotion, Testimonial, Ingredient } from "../types";
import ZoeLogo from "./ZoeLogo";

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  ingredients: Ingredient[];
  story: BakeryStory;
  address: BakeryAddress;
  profile: AdminProfile;
  promotion: Promotion;
  testimonials: Testimonial[];
  triggerNotification: (message: string, type?: "success" | "error" | "info") => void;
  onAddProduct: (newP: Partial<Product>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string, name: string) => void;
  onUpdateOrderStatus: (id: string, status: 'Pending' | 'Baking' | 'Ready' | 'Delivered') => void;
  onUpdateWebsite: (meta: {
    updatedStory?: Partial<BakeryStory>;
    updatedAddress?: Partial<BakeryAddress>;
    updatedProfile?: Partial<AdminProfile>;
    updatedPromotion?: Partial<Promotion>;
    updatedTestimonials?: Testimonial[];
  }) => void;
  onUpdateIngredient: (id: string, updated: Partial<Ingredient>) => void;
  onAddIngredient?: (newIng: { name: string; stock: number; unit: string; minThreshold: number }) => Promise<void>;
  onDeleteIngredient?: (id: string) => Promise<void>;
  customLogo?: string;
  onUpdateLogo?: (newLogo: string) => void;
  initialSubTab?: string;
}

export default function DashboardView({
  products,
  orders,
  ingredients = [],
  story,
  address,
  profile,
  promotion,
  testimonials,
  triggerNotification,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdateWebsite,
  onUpdateIngredient,
  onAddIngredient,
  onDeleteIngredient,
  customLogo = "",
  onUpdateLogo = () => {},
  initialSubTab = "products"
}: DashboardViewProps) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // States for ingredient additions
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [newIngName, setNewIngName] = useState("");
  const [newIngStock, setNewIngStock] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("kg");
  const [newIngMinThreshold, setNewIngMinThreshold] = useState("");

  // States for UX processing loader and Save confirmation dialogue prompts
  const [isDashboardProcessing, setIsDashboardProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState<{
    title: string;
    description: string;
    action: () => Promise<void> | void;
  } | null>(null);

  const promptSaveChanges = (title: string, description: string, action: () => Promise<void> | void) => {
    setPendingSaveAction({ title, description, action });
    setShowConfirmModal(true);
  };

  // Dedicated QR and email simulation states
  const [adminQrCode, setAdminQrCode] = useState<string>("");
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [selectedLogEmail, setSelectedLogEmail] = useState<any | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Supabase Self-Healing Embedded Status parameters
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoadingDbStatus, setIsLoadingDbStatus] = useState(false);
  const [isDatabaseSyncing, setIsDatabaseSyncing] = useState(false);

  const fetchDbStatus = () => {
    setIsLoadingDbStatus(true);
    fetch("/api/admin/db-status")
      .then(res => res.json())
      .then(data => {
        setDbStatus(data);
        setIsLoadingDbStatus(false);
      })
      .catch(err => {
        console.error("Error loading db status:", err);
        setIsLoadingDbStatus(false);
      });
  };

  const handleManualDbSync = async (direction: "uphill" | "downhill") => {
    setIsDatabaseSyncing(true);
    triggerNotification(`Initiating database reconciliation sync (${direction === "uphill" ? "Pushing local state uphill" : "Pulling master copy downhill"})...`, "info");
    try {
      const res = await fetch("/api/admin/db-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotification(data.message, "success");
        fetchDbStatus();
        // Trigger page refresh post-sync sync so React tree registers remote records
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        triggerNotification(data.error || "Failed/rejected by the database replication engine.", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Connection timeout during cloud reconciliation sync.", "error");
    } finally {
      setIsDatabaseSyncing(false);
    }
  };

  // Fetch initial payment QR, Simulated Email logs, and local Database Status on launch
  React.useEffect(() => {
    fetchQrCodeAdmin();
    fetchEmailLogsAdmin();
    fetchDbStatus();
  }, [orders, activeSubTab]); // Refresh when orders update or tab switches

  const fetchQrCodeAdmin = () => {
    fetch("/api/payment/qr")
      .then(res => res.json())
      .then(data => {
        if (data && data.qrImage) {
          setAdminQrCode(data.qrImage);
        } else {
          setAdminQrCode("");
        }
      })
      .catch(err => console.error("Error loading QR:", err));
  };

  const fetchEmailLogsAdmin = () => {
    fetch("/api/emails")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmailLogs(data);
        }
      })
      .catch(err => console.error("Error loading email logs:", err));
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      triggerNotification("Invalid file type. Please upload an image file.", "error");
      return;
    }

    setIsUploadingQr(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      try {
        const res = await fetch("/api/payment/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrImage: base64Data })
        });
        if (res.ok) {
          const result = await res.json();
          setAdminQrCode(result.qrImage);
          triggerNotification("Owner QR code uploaded successfully! Customers will see this instantly during checkout.", "success");
        } else {
          triggerNotification("Failed to upload QR code to the server.", "error");
        }
      } catch (err) {
        console.error(err);
        triggerNotification("Connection failed during QR upload.", "error");
      } finally {
        setIsUploadingQr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearAdminQr = async () => {
    try {
      const res = await fetch("/api/payment/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrImage: "" })
      });
      if (res.ok) {
        setAdminQrCode("");
        triggerNotification("Custom QR cleared. Checkout will roll back to default vector QR patterns.", "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // New product form
  const [newPName, setNewPName] = useState("");
  const [newPCategory, setNewPCategory] = useState("Crinkles");
  const [newPPrice, setNewPPrice] = useState("");
  const [newPImage, setNewPImage] = useState("");
  const [newPDesc, setNewPDesc] = useState("");
  const [newPAvailable, setNewPAvailable] = useState(true);
  const [newPFeatured, setNewPFeatured] = useState(false);
  const [newPStock, setNewPStock] = useState("40");

  // Website details form state
  const [storyTitle, setStoryTitle] = useState(story.title);
  const [storyTagline, setStoryTagline] = useState(story.tagline);
  const [storyMain, setStoryMain] = useState(story.mainText);
  const [storySec, setStorySec] = useState(story.secondaryText);

  // Address form state
  const [addrStreet, setAddrStreet] = useState(address.street);
  const [addrSuite, setAddrSuite] = useState(address.suite);
  const [addrCity, setAddrCity] = useState(address.city);
  const [addrPhone, setAddrPhone] = useState(address.phone);
  const [addrEmail, setAddrEmail] = useState(address.email);
  const [addrHours, setAddrHours] = useState(address.hours);
  const [addrHoursClosed, setAddrHoursClosed] = useState(address.hoursClosed);

  // Ingredient restock quick input values map
  const [ingredientRestockAmounts, setIngredientRestockAmounts] = useState<Record<string, string>>({});

  // Promo form state
  const [promoTitle, setPromoTitle] = useState(promotion.title);
  const [promoDesc, setPromoDesc] = useState(promotion.description);
  const [promoCode, setPromoCode] = useState(promotion.code);
  const [promoExpiry, setPromoExpiry] = useState(promotion.endDate);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleDownloadReceipt = (order: Order, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    const itemsText = order.items
      .map((item) => `   - ${item.name} x ${item.quantity} (₱${item.price.toFixed(2)} each) -> ₱${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");
      
    const receiptText = `================================================
          ZOE'S BAKE MY DREAM BAKERY
              MY OFFICIAL RECEIPT
================================================
Order Key Reference: ${order.id}
Fulfillment Date   : ${order.date}
Fulfillment Method : ${order.deliveryOption}
Current Status     : ${order.status}

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

Thank you for your business!
================================================`;

    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ChefAdmin_Receipt_${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    triggerNotification(`Receipt text summary file for order ${order.id} downloaded successfully!`, "success");
  };

  const handleAddNewP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPName || !newPPrice || !newPImage) {
      triggerNotification("Product name, price, and cover image are mandatory.", "error");
      return;
    }
    onAddProduct({
      name: newPName,
      category: newPCategory,
      price: parseFloat(newPPrice),
      image: newPImage,
      description: "Delicately handcrafted artisan pastry.",
      available: newPAvailable,
      isFeatured: newPFeatured,
      stock: parseInt(newPStock) || 0
    });
    // Clear
    setIsAddingProduct(false);
    setNewPName("");
    setNewPPrice("");
    setNewPImage("");
    setNewPDesc("");
    setNewPStock("40");
  };

  const handleEditP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    promptSaveChanges(
      "Confirm Product Updates",
      `Are you sure you want to save changes to "${editingProduct.name}"? This will modify its Menu Image, Price, and Stock level.`,
      () => {
        onUpdateProduct(editingProduct);
        setEditingProduct(null);
      }
    );
  };

  const handleUpdateStoryData = (e: React.FormEvent) => {
    e.preventDefault();
    promptSaveChanges(
      "Save Narrative Story",
      "Are you sure you want to update the homepage brand story narrative and tagline block?",
      () => {
        onUpdateWebsite({
          updatedStory: {
            title: storyTitle,
            tagline: storyTagline,
            mainText: storyMain,
            secondaryText: storySec,
          }
        });
        triggerNotification("Editorial Story narrative has been updated!", "success");
      }
    );
  };

  const handleUpdateAddressData = (e: React.FormEvent) => {
    e.preventDefault();
    promptSaveChanges(
      "Save Store Metadata",
      "Confirm saving location street address, direct telephone number, and weekly calendar hours.",
      () => {
        onUpdateWebsite({
          updatedAddress: {
            street: addrStreet,
            suite: addrSuite,
            city: addrCity,
            phone: addrPhone,
            email: addrEmail,
            hours: addrHours,
            hoursClosed: addrHoursClosed
          }
        });
        triggerNotification("Store location coordinates and operational hours updated!", "success");
      }
    );
  };

  const handleUpdatePromotionData = (e: React.FormEvent) => {
    e.preventDefault();
    promptSaveChanges(
      "Update Live Promotion",
      "Confirm updating the live promo code, headline, and target countdown date.",
      () => {
        onUpdateWebsite({
          updatedPromotion: {
            title: promoTitle,
            description: promoDesc,
            code: promoCode,
            endDate: new Date(promoExpiry).toISOString(),
          }
        });
        triggerNotification("Live countdown promotion updated!", "success");
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Greetings Banner */}
      <div className="bg-[#8B5E3C] text-white p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow">
        <div>
          <span className="text-[10px] tracking-widest font-extrabold uppercase text-[#E8DCCF]">Baker Headquarter Control</span>
          <h1 className="font-serif text-3xl font-extrabold mt-1">Baker-Owner Camille Sumaya Marasigan</h1>
          <p className="text-xs text-[#E8DCCF] mt-1 font-sans">
            Oversee organic Brioche counts, adjust promo expiration clocks, and manage dynamic booking requests.
          </p>
        </div>
        <button
          onClick={() => setIsAddingProduct(true)}
          className="bg-white hover:bg-gray-50 text-[#8B5E3C] px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider shadow flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Pastry
        </button>
      </div>

      {/* Numerical Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans text-xs">
        {[
          { label: 'Active Queue Pre-Orders', val: orders.length, change: '100% Secure database link', color: 'bg-emerald-50/40 text-emerald-900 border-emerald-100' },
          { label: 'Estimated Gross Revenue', val: `₱${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}`, change: 'Accumulated from orders query', color: 'bg-blue-50/40 text-blue-900 border-blue-100' },
          { label: 'Awaiting Baking Tasks', val: orders.filter(o => o.status === 'Pending').length, change: 'Immediate attention requested', color: 'bg-yellow-50/40 text-yellow-900 border-yellow-100' },
          { label: 'Total active pastries size', val: products.length, change: 'Across all categories', color: 'bg-purple-50/40 text-purple-900 border-purple-100' }
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${stat.color} shadow-sm`}>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="font-serif font-black text-2xl sm:text-3xl mt-1">{stat.val}</p>
            <span className="text-[9px] text-gray-400 font-medium block mt-1">{stat.change}</span>
          </div>
        ))}
      </div>

      {/* Sub-tab selections */}
      <div className="flex border-b border-[#E8DCCF]/60 overflow-x-auto gap-2 font-sans">
        {[
          { id: 'products', label: 'Pastry Inventory' },
          { id: 'ingredients', label: 'Ingredient Pool' },
          { id: 'promos', label: 'Hot Promos' },
          { id: 'analytics', label: 'Visual Analytics' },
          { id: 'website', label: 'Edit Narratives' },
          { id: 'testimonials', label: 'Patrons Feedbacks' },
          { id: 'qr_settings', label: 'Logo, QR & Emails' }
        ].map((subTab) => (
          <button
            key={subTab.id}
            onClick={() => setActiveSubTab(subTab.id)}
            className={`pb-3 text-xs sm:text-sm font-bold tracking-wide whitespace-nowrap transition border-b-2 px-4 cursor-pointer ${
              activeSubTab === subTab.id 
                ? 'border-[#8B5E3C] text-[#8B5E3C]' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {subTab.label}
          </button>
        ))}
      </div>

      {/* Tab: Pastry Inventory */}
      {activeSubTab === 'products' && (
        <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-50 font-sans">
            <h3 className="font-serif font-bold text-lg text-[#3D2612]">Inventory Catalog Pastries</h3>
            <p className="text-xs text-gray-400">Instantly modify cover photos, descriptions, or delete items from menu.</p>
          </div>

          <div className="divide-y divide-gray-100 font-sans">
            {products.map((p) => (
              <div key={p.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <img src={p.image} alt="" className="w-14 h-14 object-cover rounded-xl" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-[#3D2612] text-sm sm:text-base">{p.name}</h4>
                      <span className="text-[9px] px-2 py-0.5 bg-[#FFF8F0] text-[#8B5E3C] font-semibold uppercase rounded leading-normal">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-gray-400 mt-1 max-w-md line-clamp-1 text-[11px] font-sans">{p.description}</p>
                    <p className="font-serif font-semibold text-[#8B5E3C] mt-1 flex items-center flex-wrap gap-2">
                      <span>₱{p.price.toFixed(2)}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-sans text-[10px] text-clay font-bold bg-[#FAF3EE] px-2 py-0.5 rounded-md border border-putty/30">
                        Stock No: {p.stock !== undefined ? p.stock : 10} Units
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setEditingProduct(p)}
                    className="p-2 text-gray-400 hover:text-[#8B5E3C] hover:bg-amber-50 rounded-lg cursor-pointer"
                    title="Edit custom details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onUpdateProduct({ ...p, available: !p.available })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      p.available 
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    {p.available ? 'In Stock' : 'Sold Out'}
                  </button>

                  <button
                    onClick={() => onDeleteProduct(p.id, p.name)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Delete product"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Hot Promos */}
      {activeSubTab === 'promos' && (
        <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm max-w-xl font-sans text-xs">
          <h3 className="font-serif font-bold text-lg text-[#3D2612] mb-4">Edit Live Promotion Header</h3>
          
          <form onSubmit={handleUpdatePromotionData} className="space-y-4">
            <div>
              <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">Promotion Headline</label>
              <input 
                type="text"
                required
                value={promoTitle}
                onChange={(e) => setPromoTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">Narrative Description</label>
              <textarea 
                rows={3}
                required
                value={promoDesc}
                onChange={(e) => setPromoDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">Coupon Code</label>
                <input 
                  type="text"
                  required
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-600 uppercase tracking-wider mb-1.5">Timer Expiration Date</label>
                <input 
                  type="datetime-local"
                  required
                  onChange={(e) => setPromoExpiry(new Date(e.target.value).toISOString())}
                  className="w-full px-2.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] h-[35px]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
            >
              Push Promotions Live
            </button>
          </form>
        </div>
      )}

      {/* Tab: Website details / Edit details */}
      {activeSubTab === 'website' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans text-xs">
          
          <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#3D2612] border-b pb-2">Editorial Story</h3>
            <form onSubmit={handleUpdateStoryData} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Story Title</label>
                  <input 
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Story Tagline</label>
                  <input 
                    type="text"
                    value={storyTagline}
                    onChange={(e) => setStoryTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Main Narrative</label>
                <textarea 
                  rows={4}
                  value={storyMain}
                  onChange={(e) => setStoryMain(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Secondary Narrative</label>
                <textarea 
                  rows={4}
                  value={storySec}
                  onChange={(e) => setStorySec(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-xs uppercase font-extrabold tracking-wider rounded-xl cursor-pointer"
              >
                Save Story Adjustments
              </button>
            </form>
          </div>

          {/* Store Locations and Addresses coordinates form */}
          <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#3D2612] border-b pb-2">Store Coordinates & Hours</h3>
            <form onSubmit={handleUpdateAddressData} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Street Address</label>
                  <input 
                    type="text"
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Suite / District</label>
                  <input 
                    type="text"
                    value={addrSuite}
                    onChange={(e) => setAddrSuite(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">City / Region</label>
                  <input 
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Kitchen Phone</label>
                  <input 
                    type="text"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Kitchen Email</label>
                <input 
                  type="email"
                  value={addrEmail}
                  onChange={(e) => setAddrEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Operational Hours</label>
                  <input 
                    type="text"
                    value={addrHours}
                    onChange={(e) => setAddrHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Closing Rest Statement</label>
                  <input 
                    type="text"
                    value={addrHoursClosed}
                    onChange={(e) => setAddrHoursClosed(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-xs uppercase font-extrabold tracking-wider rounded-xl cursor-pointer"
              >
                Save Location Coordinates
              </button>
            </form>
          </div>

          {/* Quick Admin profiles */}
          <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-serif font-bold text-lg text-[#3D2612] border-b pb-2">Master Chef Cover</h3>
            <div className="flex gap-4 items-center">
              <img src={profile.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" />
              <div>
                <p className="font-bold text-[#3D2612] text-sm leading-tight">{profile.name}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">{profile.role}</p>
                <p className="text-xs text-gray-500 mt-1">{profile.bio}</p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">Upload Custom Master Photo</label>
              
              <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-[#8B5E3C] transition bg-[#FFF8F0]/30 cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await convertToBase64(file);
                      onUpdateWebsite({
                        updatedProfile: {
                          avatar: base64,
                        }
                      });
                      triggerNotification("Head Chef Avatar photo edited instantly!", "success");
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="font-bold text-[#8B5E3C]">Click to replace Camille's photo</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Accepts PNG, JPG, or WEBP up to 8MB</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab: Testimonials moderation */}
      {activeSubTab === 'testimonials' && (
        <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-50 font-sans">
            <h3 className="font-serif font-bold text-lg text-[#3D2612]">Moderate Customer Testimonials</h3>
            <p className="text-xs text-gray-400 font-medium">Delete reviews appearing on the homepage carousels immediately.</p>
          </div>

          <div className="divide-y divide-gray-100 font-sans text-xs">
            {testimonials.map((t) => (
              <div key={t.id} className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <img src={t.image} alt="" className="w-10 h-10 rounded-full object-cover border" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <p className="font-serif font-bold text-gray-900 leading-tight">{t.name}</p>
                      <span className="text-[10px] text-amber-500 font-bold font-serif ml-1">★ {t.rating}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.role}</p>
                    <p className="text-xs text-gray-600 mt-1 italic">"{t.text}"</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const listCopy = testimonials.filter(item => item.id !== t.id);
                    onUpdateWebsite({ updatedTestimonials: listCopy });
                    triggerNotification("Review deleted from active directories.", "info");
                  }}
                  className="px-3 py-1.5 border border-red-200 rounded-lg text-red-700 hover:bg-red-50 font-semibold cursor-pointer text-xs"
                >
                  Delete Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Logo, QR Code settings and simulated confirmations */}
      {activeSubTab === 'qr_settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 font-sans">
          
          {/* Logo Branding Upload Column */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#3D2612] mb-1">Bakeshop Logo Upload</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">Instantly update the brand logo displayed on the headers, footers and product fallback icons.</p>
            </div>

            {/* Current Brand Logo Panel */}
            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E8DCCF]/40 text-center space-y-4">
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Brand Logo</span>
              
              <div className="relative inline-flex items-center justify-center bg-white p-3 rounded-full border border-gray-150 shadow-inner w-[100px] h-[100px] mx-auto">
                <ZoeLogo className="w-16 h-16" customLogo={customLogo} />
              </div>

              {customLogo && (
                <button
                  type="button"
                  onClick={() => onUpdateLogo("")}
                  className="block mx-auto text-[10px] font-extrabold text-[#800020] hover:text-red-700 hover:underline cursor-pointer uppercase tracking-wider"
                >
                  Reset Logo
                </button>
              )}
            </div>

            {/* Brand Logo Upload Action Area */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-600">Select Custom Logo Image</label>
              <div className="relative border-2 border-dashed border-[#E8DCCF] hover:border-[#8B5E3C] rounded-2xl p-6 transition text-center bg-cream/10 cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await convertToBase64(file);
                      onUpdateLogo(base64);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  title="Upload Brand Logo Image"
                />
                <div className="space-y-2 pointer-events-none">
                  <Upload className="w-6 h-6 text-[#8B5E3C] mx-auto" />
                  <p className="text-xs font-bold text-[#8B5E3C]">Click or Drag Logo</p>
                  <p className="text-[10px] text-gray-400">Supports PNG, JPG, GIF or WEBP</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Upload & Management Module */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#3D2612] mb-1">Owner Payment QR Upload</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">Manually upload your personal payment GCash/Maya QR image. Customers will scan or view this instantly during checkout.</p>
            </div>

            {/* Current QR Preview Panel */}
            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E8DCCF]/40 text-center space-y-4">
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active QR Code Image</span>
              
              <div className="relative inline-flex items-center justify-center bg-white p-3 rounded-2xl border border-gray-150 shadow-inner w-[180px] h-[180px] mx-auto">
                {adminQrCode ? (
                  <img 
                    src={adminQrCode} 
                    alt="Active Owner QR Code" 
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="text-center p-3 text-gray-400 flex flex-col items-center justify-center gap-2">
                    <QrCode className="w-10 h-10 stroke-1 text-[#8B5E3C]" />
                    <span className="text-[10px] font-semibold leading-relaxed">No custom QR image.<br />Standard vector active</span>
                  </div>
                )}
              </div>

              {adminQrCode && (
                <button
                  type="button"
                  onClick={handleClearAdminQr}
                  className="block mx-auto text-[10px] font-extrabold text-[#800020] hover:text-red-700 hover:underline cursor-pointer uppercase tracking-wider"
                >
                  Clear Custom QR
                </button>
              )}
            </div>

            {/* Manual QR Upload Form Area */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-600">Select Custom QR Image</label>
              
              <div className="relative border-2 border-dashed border-[#E8DCCF] hover:border-[#8B5E3C] rounded-2xl p-6 transition text-center bg-cream/10 cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleQrImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  title="Upload Owner Custom QR Image"
                />
                <div className="space-y-2 pointer-events-none">
                  <Upload className="w-6 h-6 text-[#8B5E3C] mx-auto" />
                  <p className="text-xs font-bold text-[#8B5E3C]">{isUploadingQr ? "Uploading custom QR..." : "Click or Drag QR Image"}</p>
                  <p className="text-[10px] text-gray-400">Supports PNG, JPG, GIF or WEBP format</p>
                </div>
              </div>
            </div>

          </div>

          {/* Automated Confirmation Emails Inspector Simulation Module */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DCCF]/30 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#3D2612] mb-1">Simulated Email Service Logs</h3>
                <p className="text-xs text-gray-400 font-medium">Verify automated confirmation emails dispatched on user status transitions ('Baking' & 'Ready').</p>
              </div>
              <button
                type="button"
                onClick={fetchEmailLogsAdmin}
                className="flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 bg-[#8B5E3C] hover:bg-[#3D2612] text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Simulated Email Logs table list layout */}
            <div className="overflow-x-auto">
              {emailLogs.length === 0 ? (
                <div className="p-12 text-center text-gray-400 font-sans space-y-2">
                  <Mail className="w-10 h-10 stroke-1 mx-auto text-gray-300" />
                  <p className="text-xs font-bold font-serif">No simulated emails sent yet.</p>
                  <p className="text-[10px] leading-relaxed">Simulated notifications occur when pre-orders transition to 'Baking' or 'Ready' status.</p>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                  {emailLogs.map((email) => {
                    const isBaking = email.status === 'Baking';
                    return (
                      <div key={email.id} className="p-4 hover:bg-cream/15 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans text-xs">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800 text-[11px] truncate md:max-w-xs">{email.recipientName} ({email.recipientEmail})</span>
                            <span className="text-[9px] text-gray-400 font-mono block">{email.timestamp}</span>
                          </div>
                          <p className="font-semibold text-burgundy truncate">{email.subject}</p>
                          <p className="text-[10px] text-gray-500 font-mono">Associated Order ID: #{email.orderId}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            isBaking ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {email.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedLogEmail(email)}
                            className="p-1.5 bg-gray-50 hover:bg-[#8B5E3C]/10 text-[#8B5E3C] rounded-lg transition border border-gray-200 cursor-pointer"
                            title="Preview simulated email body"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-cream/20 border border-dashed border-[#E8DCCF] flex items-start gap-3">
              <Info className="w-5 h-5 text-[#8B5E3C] shrink-0" />
              <div className="text-[10px] text-gray-500 leading-relaxed font-sans space-y-1">
                <span className="font-bold text-[#8B5E3C] uppercase block">Developer Architecture Highlight</span>
                <p>The system runs a live simulated service layer in the Node.js context. Modifying status keys automatically triggers confirmation signals containing customer-centric order coordinates without exposing genuine credentials.</p>
              </div>
            </div>

          </div>

          {/* Active Email Preview Modal */}
          {selectedLogEmail && (
            <div className="fixed inset-0 z-50 bg-charcoal/45 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full border border-putty shadow-2xl overflow-hidden text-left flex flex-col max-h-[85vh]">
                
                {/* Modal Header */}
                <div className="p-5 bg-zinc-900 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-amber-200 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Simulated Email Envelope</h4>
                      <p className="text-[9px] text-white/70">ID: {selectedLogEmail.id} • Status: {selectedLogEmail.status}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedLogEmail(null)}
                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Simulated Envelope Details */}
                <div className="p-4 bg-gray-50 border-b border-gray-150 space-y-1 text-xs text-gray-600 font-sans shrink-0">
                  <div><strong className="text-gray-900">From:</strong> zoesbakemydream@gmail.com (Zoe's Bake My Dream Email)</div>
                  <div><strong className="text-gray-900">To:</strong> {selectedLogEmail.recipientName} ({selectedLogEmail.recipientEmail})</div>
                  <div><strong className="text-gray-900">Date:</strong> {selectedLogEmail.timestamp}</div>
                  <div><strong className="text-gray-900">Subject:</strong> {selectedLogEmail.subject}</div>
                </div>

                {/* Email Body */}
                <div className="p-6 overflow-y-auto font-sans text-xs text-gray-700 leading-relaxed whitespace-pre-wrap select-text selection:bg-amber-100">
                  {selectedLogEmail.body}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-150 text-right shrink-0">
                  <button
                    onClick={() => setSelectedLogEmail(null)}
                    className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-black"
                  >
                    Close Preview
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}



      {/* Tab: Ingredients Pool / real time stock */}
      {activeSubTab === 'ingredients' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#3D2612] mb-1">Raw Ingredient Pool</h3>
              <p className="text-xs text-gray-400 font-medium">Monitor ingredient levels and threshold limits in real-time. Baked steps subtract raw ingredients instantly.</p>
            </div>
            <button
              onClick={() => {
                setNewIngName("");
                setNewIngStock("");
                setNewIngUnit("kg");
                setNewIngMinThreshold("");
                setShowAddIngredientModal(true);
              }}
              className="px-4 py-2.5 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer font-sans shrink-0"
            >
              <Plus className="w-4 h-4" /> Register Raw Ingredient
            </button>
          </div>

          {/* Low Stock Alerts */}
          {ingredients.some(i => i.stock <= i.minThreshold) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 text-xs font-sans">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-800 text-sm">Low Ingredient Threshold Warnings Detected!</h4>
                <p className="text-amber-700 mt-1">Some critical items on your recipe catalog are reaching minimal baking requirements:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-amber-700 font-medium">
                  {ingredients
                    .filter(i => i.stock <= i.minThreshold)
                    .map(i => (
                      <li key={i.id}>
                        {i.name}: <span className="font-mono font-bold">{i.stock} {i.unit}</span> left (Minimum Limit: {i.minThreshold} {i.unit})
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          )}

          {/* Grid Layout of Ingredient Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            {ingredients.map((ing) => {
              const isLow = ing.stock <= ing.minThreshold;
              const inputVal = ingredientRestockAmounts[ing.id] || "";
              
              return (
                <div 
                  key={ing.id} 
                  className={`bg-white rounded-2xl border p-5 space-y-4 shadow-sm transition hover:shadow-md ${
                    isLow ? 'border-amber-200 bg-amber-50/10' : 'border-[#E8DCCF]/50 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#3D2612] text-sm sm:text-base leading-tight">{ing.name}</h4>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to permanently delete raw ingredient "${ing.name}" from tracking?`)) {
                              if (onDeleteIngredient) {
                                await onDeleteIngredient(ing.id);
                              } else {
                                triggerNotification("Delete handler not configured.", "error");
                              }
                            }
                          }}
                          className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                          title="Delete Ingredient"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5 block">Ingredient Reference Code</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      ing.stock === 0 ? 'bg-red-100 text-red-800' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ing.stock === 0 ? 'Empty' : isLow ? 'Restock Warning' : 'Healthy Level'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-gray-100">
                    <div className="text-center p-2 bg-gray-50 rounded-xl">
                      <span className="block text-[9px] uppercase tracking-widest text-[#8B5E3C] font-bold">In stock</span>
                      <span className="font-serif font-extrabold text-gray-900 text-sm mt-0.5 block">{ing.stock} {ing.unit}</span>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-xl">
                      <span className="block text-[9px] uppercase tracking-widest text-[#8B5E3C] font-bold">Min limit</span>
                      <span className="font-serif font-extrabold text-gray-500 text-sm mt-0.5 block">{ing.minThreshold} {ing.unit}</span>
                    </div>
                  </div>

                  {/* Restock action console */}
                  <div className="space-y-2">
                    <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold">Stock Adjustment Desk</label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        placeholder={`e.g. 10`}
                        value={inputVal}
                        onChange={(e) => setIngredientRestockAmounts({
                          ...ingredientRestockAmounts,
                          [ing.id]: e.target.value
                        })}
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const amt = parseFloat(inputVal);
                          if (isNaN(amt) || amt <= 0) {
                            triggerNotification("Please enter a valid numeric amount to add.", "error");
                            return;
                          }
                          const newStock = parseFloat((ing.stock + amt).toFixed(2));
                          onUpdateIngredient(ing.id, { stock: newStock });
                          setIngredientRestockAmounts({
                            ...ingredientRestockAmounts,
                            [ing.id]: ""
                          });
                          triggerNotification(`Added ${amt} ${ing.unit} of ${ing.name} successfully!`, "success");
                        }}
                        className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-lg tracking-wider uppercase shrink-0 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>+ Add</span>
                      </button>
                      <button
                        onClick={() => {
                          const amt = parseFloat(inputVal);
                          if (isNaN(amt) || amt <= 0) {
                            triggerNotification("Please enter a valid numeric amount to subtract.", "error");
                            return;
                          }
                          if (ing.stock - amt < 0) {
                            triggerNotification(`Cannot subtract ${amt} ${ing.unit}. Stock level cannot go below 0!`, "error");
                            return;
                          }
                          const newStock = parseFloat((ing.stock - amt).toFixed(2));
                          onUpdateIngredient(ing.id, { stock: newStock });
                          setIngredientRestockAmounts({
                            ...ingredientRestockAmounts,
                            [ing.id]: ""
                          });
                          triggerNotification(`Subtracted ${amt} ${ing.unit} of ${ing.name} successfully!`, "success");
                        }}
                        className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-[10px] rounded-lg tracking-wider uppercase shrink-0 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>- Less</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Ingredient Modal Overlay */}
          {showAddIngredientModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8DCCF] relative">
                <button
                  onClick={() => setShowAddIngredientModal(false)}
                  className="absolute top-5 right-5 p-1 text-gray-400 hover:text-burgundy rounded-full hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center font-sans">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-[#8B5E3C] bg-cream px-3 py-1 rounded-full">New Pool Resource</span>
                  <h3 className="font-serif font-black text-2xl text-[#3D2612] mt-3">Register Raw Ingredient</h3>
                  <p className="text-xs text-gray-400 mt-1">Register a tracked cooking resource with designated metric unit scales.</p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newIngName.trim()) {
                      triggerNotification("Please enter an ingredient name.", "error");
                      return;
                    }
                    const parsedStock = parseFloat(newIngStock);
                    const parsedThreshold = parseFloat(newIngMinThreshold);
                    if (isNaN(parsedStock) || parsedStock < 0) {
                      triggerNotification("Please specify a starting stock level of 0 or greater.", "error");
                      return;
                    }
                    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
                      triggerNotification("Please specify a min threshold level of 0 or greater.", "error");
                      return;
                    }

                    if (onAddIngredient) {
                      await onAddIngredient({
                        name: newIngName.trim(),
                        stock: parsedStock,
                        unit: newIngUnit,
                        minThreshold: parsedThreshold
                      });
                      setShowAddIngredientModal(false);
                    } else {
                      triggerNotification("Adding handler not configured.", "error");
                    }
                  }}
                  className="space-y-4 text-xs font-sans text-[#3D2612]"
                >
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-400">Ingredient Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Premium French Flour, Eggs, Butter, Salt..."
                      value={newIngName}
                      onChange={(e) => setNewIngName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none text-sm font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-gray-400">Initial Stock</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 50"
                        value={newIngStock}
                        onChange={(e) => setNewIngStock(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-gray-400">Measurement Unit</label>
                      <select
                        value={newIngUnit}
                        onChange={(e) => setNewIngUnit(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none text-sm font-bold bg-white"
                      >
                        <option value="kg">kg (kilograms)</option>
                        <option value="g">g (grams)</option>
                        <option value="pieces">pieces</option>
                        <option value="liters">liters (l)</option>
                        <option value="packs">packs</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-400">Minimum limit Threshold</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Warning alerts when stock falls below this"
                      value={newIngMinThreshold}
                      onChange={(e) => setNewIngMinThreshold(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none text-sm font-medium"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddIngredientModal(false)}
                      className="flex-1 py-3 text-center border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 text-center bg-burgundy hover:bg-burgundy/90 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition cursor-pointer"
                    >
                      Authenticate and Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Operational Analytics */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-8 font-sans text-xs">
          
          <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm">
            <h3 className="font-serif font-bold text-lg text-[#3D2612] mb-1">Dynamic Business Dashboard</h3>
            <p className="text-xs text-gray-400 font-medium">Track key operational trends, day-to-day sales, and categories volume statistics.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sales Trends SVG Widget (8/12 cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 shadow-sm space-y-4">
              <h4 className="font-serif font-bold text-[#3D2612] text-sm sm:text-base border-b pb-2 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-[#8B5E3C]" /> Sales Revenue Trends
              </h4>
              
              {/* SVG Area Line Chart */}
              {Object.keys(orders.reduce((acc, order) => {
                const d = order.date;
                acc[d] = (acc[d] || 0) + order.total;
                return acc;
              }, {} as Record<string, number>)).length === 0 ? (
                <div className="text-center py-20 text-gray-400 font-medium">Not enough order points to render trend-maps.</div>
              ) : (
                (() => {
                  const salesMapObj = orders.reduce((acc, order) => {
                    const d = order.date;
                    acc[d] = (acc[d] || 0) + order.total;
                    return acc;
                  }, {} as Record<string, number>);

                  const sortedDateList = Object.keys(salesMapObj).sort();
                  const maxRevenue = Math.max(...Object.values(salesMapObj), 100);
                  const graphWidth = 560;
                  const graphHeight = 180;
                  const paddingX = 45;
                  const paddingY = 25;

                  // Build coordinates points
                  const points = sortedDateList.map((dt, idx) => {
                    const x = paddingX + (idx / (sortedDateList.length === 1 ? 1 : sortedDateList.length - 1)) * (graphWidth - paddingX - 15);
                    const y = graphHeight - paddingY - (salesMapObj[dt] / maxRevenue) * (graphHeight - paddingY - 15);
                    return { x, y, val: salesMapObj[dt], date: dt };
                  });

                  // Generate SVG paths
                  const pathD = points.reduce((acc, p, idx) => {
                    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                  }, "");

                  // Line shadow gradient paths
                  const areaD = points.length > 0 
                    ? `${pathD} L ${points[points.length - 1].x} ${graphHeight - paddingY} L ${points[0].x} ${graphHeight - paddingY} Z`
                    : "";

                  return (
                    <div className="space-y-4">
                      <div className="relative w-full overflow-x-auto">
                        <svg className="w-full min-w-[500px]" height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
                          <defs>
                            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5E3C" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#8B5E3C" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>

                          {/* Grid Background lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const y = paddingY + ratio * (graphHeight - paddingY - 15);
                            return (
                              <line 
                                key={i} 
                                x1={paddingX} 
                                y1={y} 
                                x2={graphWidth - 15} 
                                y2={y} 
                                stroke="#F7EFE5" 
                                strokeWidth="1"
                                strokeDasharray="3"
                              />
                            );
                          })}

                          {/* Render Area Shading */}
                          {areaD && <path d={areaD} fill="url(#chartGlow)" />}

                          {/* Render Curve Line */}
                          {pathD && (
                            <path 
                              d={pathD} 
                              fill="none" 
                              stroke="#8B5E3C" 
                              strokeWidth="2.5" 
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* Axis Lines */}
                          <line x1={paddingX} y1={graphHeight - paddingY} x2={graphWidth - 15} y2={graphHeight - paddingY} stroke="#E8DCCF" strokeWidth="1.5" />
                          <line x1={paddingX} y1={10} x2={paddingX} y2={graphHeight - paddingY} stroke="#E8DCCF" strokeWidth="1.5" />

                          {/* Data points markers */}
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r="4.5" 
                                fill="#ffffff" 
                                stroke="#8B5E3C" 
                                strokeWidth="2.5" 
                                className="cursor-pointer hover:r-6 transition"
                              />
                              
                              {/* Hover Tooltip label box */}
                              <text 
                                x={p.x} 
                                y={p.y - 10} 
                                textAnchor="middle" 
                                fontSize="9" 
                                fontWeight="bold" 
                                fill="#3D2612"
                                className="bg-white"
                              >
                                ₱{Math.round(p.val)}
                              </text>
                            </g>
                          ))}

                          {/* Dates labels on Axis */}
                          {points.map((p, i) => {
                            // Only draw a few to avoid overlap
                            if (points.length > 6 && i % 2 !== 0) return null;
                            const labelParts = p.date.split('-');
                            const formattedDate = labelParts.length >= 3 ? `${labelParts[1]}/${labelParts[2]}` : p.date;
                            return (
                              <text 
                                key={i} 
                                x={p.x} 
                                y={graphHeight - 10} 
                                textAnchor="middle" 
                                fontSize="8.5" 
                                fill="#8B5E3C"
                                fontWeight="600"
                              >
                                {formattedDate}
                              </text>
                            );
                          })}

                          {/* Y-Axis scale label markers */}
                          <text x={paddingX - 6} y={paddingY + 4} textAnchor="end" fontSize="8" fill="#8B5E3C" fontWeight="bold">₱{Math.round(maxRevenue)}</text>
                          <text x={paddingX - 6} y={(paddingY + graphHeight - paddingY) / 2 + 4} textAnchor="end" fontSize="8" fill="#8B5E3C" fontWeight="bold">₱{Math.round(maxRevenue / 2)}</text>
                          <text x={paddingX - 6} y={graphHeight - paddingY + 2} textAnchor="end" fontSize="8" fill="#8B5E3C" fontWeight="bold">₱0</text>
                        </svg>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-xl rounded-r-2xl border border-gray-100 flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                        <span className="text-[10px] text-gray-500 leading-relaxed font-sans">
                          Curve represents dynamic transaction values aggregated by pre-order baking schedules. Hover markers represent gross reservation amounts collected.
                        </span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Dynamic extruded 3D Doughnut Chart of category demand (4/12 cols) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-[#3D2612] text-sm sm:text-base border-b pb-2 flex items-center gap-1.5">
                  Category Volume Distribution
                </h4>
                <p className="text-[10px] text-gray-400 mt-1 font-medium leading-relaxed">Real-time baking categories breakdown with 3D dimensional slice extrusion metrics.</p>
              </div>
              
              {/* Category stats calculation */}
              {(() => {
                const categoryTotal: Record<string, number> = {
                  'Crinkles': 0,
                  'Cakes': 0,
                  'Bread': 0
                };

                orders.forEach(o => {
                  o.items.forEach(item => {
                    const p = products.find(prod => prod.id === item.productId || prod.name === item.name);
                    const cat = p ? (p.category === "Cookies" ? "Crinkles" : p.category) : "";
                    if (cat && categoryTotal[cat] !== undefined) {
                      categoryTotal[cat] += item.quantity;
                    } else if (item.name.toLowerCase().includes("cookie") || item.name.toLowerCase().includes("crinkle")) {
                      categoryTotal['Crinkles'] += item.quantity;
                    } else if (item.name.toLowerCase().includes("cake") || item.name.toLowerCase().includes("velvet")) {
                      categoryTotal['Cakes'] += item.quantity;
                    } else {
                      categoryTotal['Bread'] += item.quantity;
                    }
                  });
                });

                // If no orders, let's supply sweet elegant mockup stats
                const grandTotal = Object.values(categoryTotal).reduce((s, v) => s + v, 0) || 10;
                if (Object.values(categoryTotal).every(v => v === 0)) {
                  categoryTotal['Crinkles'] = 25;
                  categoryTotal['Cakes'] = 18;
                  categoryTotal['Bread'] = 12;
                }
                const actualTotal = Object.values(categoryTotal).reduce((s, v) => s + v, 0);

                const cookiePct = categoryTotal['Crinkles'] / actualTotal;
                const cakePct = categoryTotal['Cakes'] / actualTotal;
                const breadPct = categoryTotal['Bread'] / actualTotal;

                // Circumference of radius 50 is 314.16
                const circumference = 314.16;
                const cookieLen = cookiePct * circumference;
                const cakeLen = cakePct * circumference;
                const breadLen = breadPct * circumference;

                // Offsets
                const cookieOff = circumference;
                const cakeOff = circumference - cookieLen;
                const breadOff = circumference - cookieLen - cakeLen;

                return (
                  <div className="space-y-5 flex flex-col justify-center items-center">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <svg width="176" height="176" viewBox="0 0 160 165" className="drop-shadow-lg">
                        {/* 3D Extrusion Bottom Crust Plate */}
                        <circle cx="80" cy="84" r="50" stroke="#724424" strokeWidth="18" fill="none" strokeDasharray={`${cookieLen} ${circumference - cookieLen}`} strokeDashoffset={cookieOff} strokeLinecap="round" opacity="0.9" />
                        <circle cx="80" cy="84" r="50" stroke="#9E4646" strokeWidth="18" fill="none" strokeDasharray={`${cakeLen} ${circumference - cakeLen}`} strokeDashoffset={cakeOff} strokeLinecap="round" opacity="0.9" />
                        <circle cx="80" cy="84" r="50" stroke="#B2824C" strokeWidth="18" fill="none" strokeDasharray={`${breadLen} ${circumference - breadLen}`} strokeDashoffset={breadOff} strokeLinecap="round" opacity="0.9" />

                        {/* Middle Connecting Shadow Segment for 3D glow */}
                        <circle cx="80" cy="82" r="50" stroke="#1A1108" strokeWidth="19" fill="none" opacity="0.12" />

                        {/* Top Extruded Colored Glazed Slices */}
                        <circle cx="80" cy="80" r="50" stroke="#8B5E3C" strokeWidth="18" fill="none" strokeDasharray={`${cookieLen} ${circumference - cookieLen}`} strokeDashoffset={cookieOff} strokeLinecap="round" />
                        <circle cx="80" cy="80" r="50" stroke="#C26F6F" strokeWidth="18" fill="none" strokeDasharray={`${cakeLen} ${circumference - cakeLen}`} strokeDashoffset={cakeOff} strokeLinecap="round" />
                        <circle cx="80" cy="80" r="50" stroke="#D4A373" strokeWidth="18" fill="none" strokeDasharray={`${breadLen} ${circumference - breadLen}`} strokeDashoffset={breadOff} strokeLinecap="round" />

                        {/* Center hole overlay text */}
                        <circle cx="80" cy="80" r="34" fill="#ffffff" />
                        <text x="80" y="78" textAnchor="middle" className="font-serif font-black text-[#3D2612] text-sm leading-none">
                          {actualTotal}
                        </text>
                        <text x="80" y="91" textAnchor="middle" className="text-[8px] font-bold tracking-wider text-gray-400 uppercase">
                          TOTAL BAKES
                        </text>
                      </svg>
                    </div>

                    <div className="w-full space-y-2 mt-2">
                      <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#8B5E3C]"></span>
                          <span className="font-bold text-[#3D2612] text-xs">Crinkles</span>
                        </div>
                        <span className="font-mono font-bold text-gray-500 text-xs">{categoryTotal['Crinkles']} ({Math.round(cookiePct * 100)}%)</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#C26F6F]"></span>
                          <span className="font-bold text-[#3D2612] text-xs">Cakes</span>
                        </div>
                        <span className="font-mono font-bold text-gray-500 text-xs">{categoryTotal['Cakes']} ({Math.round(cakePct * 100)}%)</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#D4A373]"></span>
                          <span className="font-bold text-[#3D2612] text-xs">Bread</span>
                        </div>
                        <span className="font-mono font-bold text-gray-500 text-xs">{categoryTotal['Bread']} ({Math.round(breadPct * 100)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

          {/* New Menu Chart: High-Demand Pastry Menus Column Chart Card */}
          <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h4 className="font-serif font-black text-[#5C3E21] text-base">High-Demand Pastry Menus</h4>
              <p className="text-xs text-gray-405 font-medium">Tracking absolute client volume demand and transaction metrics across our core pastry recipes catalog.</p>
            </div>

            {(() => {
              const menuTotals: Record<string, number> = {};
              // Initialize with all existing products in the DB to comprehensively track everything
              products.forEach(p => {
                menuTotals[p.name] = 0;
              });

              orders.forEach(o => {
                o.items.forEach(item => {
                  let nameToUse = item.name;
                  const matchedProduct = products.find(prod => prod.id === item.productId || prod.name === item.name);
                  if (matchedProduct) {
                    nameToUse = matchedProduct.name;
                  }
                  menuTotals[nameToUse] = (menuTotals[nameToUse] || 0) + item.quantity;
                });
              });

              // Supply default showcase values if orders list is entirely empty to provide an eye-safe visual chart
              if (Object.keys(menuTotals).length === 0) {
                menuTotals['Historic Brioche Loaf'] = 28;
                menuTotals['Fudge Chocolate Crinkles'] = 24;
                menuTotals['Matcha White Crinkles'] = 19;
                menuTotals['Red Velvet Cream cheese'] = 15;
                menuTotals['Choco Chip Scone'] = 9;
              }

              const sortedMenus = Object.entries(menuTotals)
                .sort((a, b) => b[1] - a[1]);

              const maxVal = Math.max(...sortedMenus.map(m => m[1]), 10);
              const svgHeight = 160;
              const barWidth = 46;
              const spacing = 48;
              const startX = 35;
              const numItems = sortedMenus.length;
              const svgWidth = startX + numItems * (barWidth + spacing) + 40;

              return (
                <div className="relative w-full overflow-x-auto">
                  <svg className="w-full min-w-[500px]" height={svgHeight + 40} viewBox={`0 0 ${svgWidth} 200`}>
                    {/* Background Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = 15 + ratio * (svgHeight - 15);
                      return (
                        <line
                          key={idx}
                          x1={startX}
                          y1={y}
                          x2={svgWidth - 20}
                          y2={y}
                          stroke="#FDF9F4"
                          strokeWidth="1.5"
                          strokeDasharray="4"
                        />
                      );
                    })}

                    {/* Columns Renderer */}
                    {sortedMenus.map(([name, qty], idx) => {
                      const pct = qty / maxVal;
                      const colHeight = pct * (svgHeight - 20);
                      const x = startX + idx * (barWidth + spacing) + 20;
                      const y = svgHeight - colHeight;

                      return (
                        <g key={name} className="group cursor-pointer">
                          {/* 3D Column Depth Shadow Background bar */}
                          <rect
                            x={x + 4}
                            y={y + 4}
                            width={barWidth}
                            height={colHeight}
                            rx="6"
                            ry="6"
                            fill="#F3EADF"
                          />
                          {/* Main Pastel Bar */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={colHeight}
                            rx="6"
                            ry="6"
                            fill={
                              idx % 5 === 0 ? "#8B5E3C" :
                              idx % 5 === 1 ? "#C26F6F" :
                              idx % 5 === 2 ? "#D4A373" :
                              idx % 5 === 3 ? "#E6C9A8" :
                              "#A3B18A"
                            }
                            className="transition-all duration-300 hover:opacity-90"
                          />

                          {/* Top Quantity Label */}
                          <text
                            x={x + barWidth / 2}
                            y={y - 8}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#3D2612"
                            className="font-mono"
                          >
                            {qty} bakes
                          </text>

                          {/* Underneath Shortened Title Label */}
                          <text
                            x={x + barWidth / 2}
                            y={svgHeight + 20}
                            textAnchor="middle"
                            fontSize="8.5"
                            fontWeight="bold"
                            fill="#8B5E3C"
                            className="truncate"
                          >
                            {name.length > 15 ? `${name.substring(0, 13)}...` : name}
                          </text>
                        </g>
                      );
                    })}

                    {/* Baseline */}
                    <line
                      x1={startX}
                      y1={svgHeight}
                      x2={svgWidth - 20}
                      y2={svgHeight}
                      stroke="#E8DCCF"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              );
            })()}
          </div>

          {/* Business KPIs Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
            <div className="bg-[#FFF8F0] border border-[#E8DCCF]/50 rounded-2xl p-5 text-center shadow-inner">
              <span className="block text-[10px] tracking-widest font-extrabold text-gray-400 uppercase">Average Order Value (AOV)</span>
              <span className="font-serif font-black text-[#8B5E3C] text-2xl sm:text-3xl mt-1 block">
                ₱{(orders.reduce((sum, o) => sum + o.total, 0) / (orders.length || 1)).toFixed(2)}
              </span>
            </div>
            <div className="bg-[#FFF8F0] border border-[#E8DCCF]/50 rounded-2xl p-5 text-center shadow-inner">
              <span className="block text-[10px] tracking-widest font-extrabold text-gray-400 uppercase">Ingredient Depletion Alerts</span>
              <span className={`font-serif font-black text-2xl sm:text-3xl mt-1 block ${
                ingredients.filter(i => i.stock <= i.minThreshold).length > 0 ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                {ingredients.filter(i => i.stock <= i.minThreshold).length} Low Items
              </span>
            </div>
            <div className="bg-[#FFF8F0] border border-[#E8DCCF]/50 rounded-2xl p-5 text-center shadow-inner">
              <span className="block text-[10px] tracking-widest font-extrabold text-gray-400 uppercase">Order Pipeline Fulfillment</span>
              <span className="font-serif font-black text-gray-800 text-2xl sm:text-3xl mt-1 block">
                {Math.round((orders.filter(o => o.status === 'Delivered').length / (orders.length || 1)) * 100)}% Done
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Tab: Self Healing Database Diagnostics Center (removed) */}
      {false && (
        <div className="space-y-8 font-sans text-xs">
          
          <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-serif font-bold text-[#3D2612] text-xl">Self-Healing Embedded Database Center</h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">Dual-Mode persistence reconciling local disk storage cache with Vercel serverless functions and Supabase cloud clusters.</p>
            </div>
            <button
              onClick={fetchDbStatus}
              disabled={isLoadingDbStatus || isDatabaseSyncing}
              className="px-4 py-2 border border-[#E8DCCF] hover:bg-[#FFF8F0] active:scale-95 text-[#8B5E3C] font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDbStatus ? 'animate-spin' : ''}`} />
              <span>Refresh Cluster State</span>
            </button>
          </div>

          {/* Status Display Banners */}
          {dbStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Primary Connection Status Card */}
              <div className="md:col-span-2 bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">Cluster Connection Status</span>
                    <h4 className="font-serif font-black text-[#3D2612] text-lg sm:text-xl">
                      {dbStatus.status === "connected" && "🟢 Online / Synchronized"}
                      {dbStatus.status === "table_missing" && "🟡 Database Table Missing"}
                      {dbStatus.status === "not_configured" && "🔵 Standalone Local Storage"}
                      {dbStatus.status === "disconnected" && "🔴 Database Endpoint Disconnected"}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      {dbStatus.status === "connected" && "The system is connected to Supabase Cloud, delivering continuous background synchronization."}
                      {dbStatus.status === "table_missing" && "The Supabase backend environment details are active, but the necessary database tables are missing. The app has healed itself by falling back to high-reliability local JSON emulation."}
                      {dbStatus.status === "not_configured" && "Running in robust embedded file-system persistence (db.json). Complete your cloud setup below to persist database parameters across ephemerally hosted serverless platforms like Vercel."}
                      {dbStatus.status === "disconnected" && `The cloud connection failed with error: "${dbStatus.errorDetail || "Unknown"}" - Dynamic self-healing fallback activated.`}
                    </p>
                  </div>
                </div>

                {/* Database Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">Storage Engine</span>
                    <span className="block font-mono font-bold text-gray-700 text-xs mt-1 truncate">{dbStatus.databaseSource}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">Local Cache Disk</span>
                    <span className="block font-mono font-bold text-gray-700 text-xs mt-1">{dbStatus.localFileSize}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">Last Sync Time</span>
                    <span className="block font-mono font-bold text-gray-700 text-xs mt-1 truncate hover:text-clip">{dbStatus.lastSyncTime ? new Date(dbStatus.lastSyncTime).toLocaleTimeString() : 'Never'}</span>
                  </div>
                  <div className="p-3 bg-[#FFF8F0] rounded-xl border border-[#E8DCCF]/40 text-[#8B5E3C]">
                    <span className="block text-[8px] text-[#8B5E3C]/60 font-extrabold uppercase tracking-wider">Backup Status</span>
                    <span className="block font-mono font-black text-xs mt-1">100% Secure</span>
                  </div>
                </div>
              </div>

              {/* Stats Breakdown Panel */}
              <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block mb-2">Synchronized Items Array counts</span>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between border-b border-gray-50 pb-1.5 pt-0.5">
                      <span className="text-gray-400">🥗 Pastry Inventory</span>
                      <strong className="text-gray-800">{dbStatus.stats.products} items</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-1.5 pt-0.5">
                      <span className="text-gray-400">🗳️ Inquiries Received</span>
                      <strong className="text-gray-800">{dbStatus.stats.inquiries} records</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-1.5 pt-0.5">
                      <span className="text-gray-400">📦 Pre-Orders Placed</span>
                      <strong className="text-gray-800">{dbStatus.stats.orders} entries</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-1.5 pt-0.5">
                      <span className="text-gray-400">🌾 Raw Ingredients Pool</span>
                      <strong className="text-gray-800">{dbStatus.stats.ingredients} records</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-1.5 pt-0.5">
                      <span className="text-gray-400">✉️ Generated Emails Queue</span>
                      <strong className="text-gray-800">{dbStatus.stats.simulatedEmails} logs</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse mt-0.5" />
                  <span className="text-[10px] font-bold text-emerald-700 tracking-tight uppercase">Dual-sync fallback pipeline is armed.</span>
                </div>
              </div>

            </div>
          )}

          {/* Interactive SQL Blueprint & Core Presentation explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Interactive Sync Controls & presentation documentation (7/12 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm space-y-4">
                <h4 className="font-serif font-bold text-[#3D2612] text-sm sm:text-base border-b pb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#8B5E3C]" /> Manual Reconciliation Triggers
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  The embedded engine updates the cloud automatically. For developers presenting to the Panel, you can trigger a manual snapshot transition here:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => handleManualDbSync("uphill")}
                    disabled={isDatabaseSyncing || !dbStatus?.envConfigured}
                    className="p-4 rounded-2xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white flex flex-col items-center justify-center text-center font-sans space-y-2 cursor-pointer transition active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5 animate-bounce" />
                    <span className="font-bold text-xs">Push Memory Snapshot Uphill</span>
                    <span className="text-[9px] opacity-80 font-medium">Updates Supabase cluster with current local records</span>
                  </button>

                  <button
                    onClick={() => handleManualDbSync("downhill")}
                    disabled={isDatabaseSyncing || !dbStatus?.envConfigured}
                    className="p-4 rounded-2xl border border-[#E8DCCF] hover:bg-[#FFF8F0] text-[#8B5E3C] flex flex-col items-center justify-center text-center font-sans space-y-2 cursor-pointer transition active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-bold text-xs">Pull Master Snap downhill</span>
                    <span className="text-[9px] text-[#8B5E3C]/80 font-medium">Overwrites local inventory and syncs from cloud</span>
                  </button>
                </div>
                {!dbStatus?.envConfigured && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5 text-amber-900 mt-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[10px] font-bold block uppercase tracking-wider">Supabase Environment Variables Absent</strong>
                      <span className="text-[10px] opacity-90 leading-relaxed">
                        Specify <code className="bg-amber-100 font-mono text-[9px] px-1 rounded">SUPABASE_URL</code> and <code className="bg-amber-100 font-mono text-[9px] px-1 rounded">SUPABASE_ANON_KEY</code> variables inside the Secrets Manager to arm full multi-master cloud capability.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Features & Dual-Mode Documentation Block */}
              <div className="bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 sm:p-8 shadow-sm space-y-4">
                <h4 className="font-serif font-bold text-[#3D2612] text-sm sm:text-base border-b pb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#8B5E3C]" /> Why This Solution is Bulletproof & Self-Healing
                </h4>
                
                <div className="space-y-4 font-sans text-xs text-gray-500 leading-relaxed font-medium">
                  <div className="space-y-1">
                    <h5 className="font-bold text-gray-800 flex items-center gap-1.5">
                      🛡️ Protection Against Serverless Ephemerality
                    </h5>
                    <p>
                      Deploying to serverless providers like Vercel usually imposes a strict read-only filesystem except <code className="font-mono bg-gray-100 px-1 rounded text-[10px]">/tmp</code>. Traditional JSON filesystem stores get wiped or reset across restarts. Our hybrid adapter detects this limitation and seamlessly handles remote connection states so data is stored permanently in Supabase.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-bold text-gray-800 flex items-center gap-1.5">
                      ⚡ Zero-Latency Startup
                    </h5>
                    <p>
                      Instead of pausing startup processes to complete remote REST lookups, the server executes a rapid local read to establish a valid baseline in-memory cache instantly. It then asynchronously pulls or pushes parameters to Supabase under the hood.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-bold text-gray-800 flex items-center gap-1.5">
                      🩹 Automated Self-Healing Schema Rebuilds
                    </h5>
                    <p>
                      If Supabase services suffer an outage, keys expire, or the tables are deleted entirely, the system fails over to fallback storage within <code className="font-mono bg-gray-100 px-1 rounded text-[10px]">db.json</code> instantly, without ever interrupting client orders or throwing errors! The moment the connection recovers or tables are restored, it re-synchronizes automatically on the next database touch!
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Copyable SQL Initialization Blueprint (5/12 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8DCCF]/50 p-6 shadow-sm space-y-4">
              <div className="border-b pb-2">
                <h4 className="font-serif font-bold text-[#3D2612] text-sm sm:text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#8B5E3C]" /> Supabase SQL Schema setup
                </h4>
                <p className="text-[10px] text-gray-400 mt-1 font-medium font-sans">Copy and run this inside Supabase SQL Editor to provision the database table.</p>
              </div>

              {dbStatus && (
                <div className="space-y-3 font-sans">
                  {/* SQL Window Editor Mimic */}
                  <div className="bg-[#1e1e1e] rounded-2xl p-4 overflow-x-auto font-mono text-[9px] text-[#d4d4d4] shadow-inner select-text relative leading-relaxed border border-zinc-800 max-h-72">
                    <pre className="whitespace-pre-wrap">{dbStatus.sqlSchema}</pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(dbStatus.sqlSchema);
                        triggerNotification("Supabase SQL blueprint copied to clipboard!", "success");
                      }}
                      className="absolute right-3 top-3 bg-zinc-800 p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-700 text-amber-100 font-bold tracking-wider uppercase text-[8px] cursor-pointer transition"
                    >
                      Copy SQL
                    </button>
                  </div>

                  <div className="p-4 bg-[#FFF8F0] border border-[#E8DCCF]/50 rounded-2xl space-y-2 text-xs">
                    <strong className="text-gray-900 block font-serif">Camille and Panel Quick Presentation Tips:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-gray-600 font-sans text-xs">
                      <li>Use the SQL above inside Supabase to construct the table in 1 second.</li>
                      <li>Highlight the <code className="font-mono text-xs text-[#8B5E3C]">JSONB</code> design that holds a fully flexible document structure, allowing self-healing updates without writing rigid, hardcoded DB migrations in the future.</li>
                      <li>Demonstrate resilience by showing that the website runs seamlessly even if Supabase keys are completely cleared or tables are dropped!</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Modal: Add New Product Form */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-4 border border-[#E8DCCF] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsAddingProduct(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 cursor-pointer"
            >
              ✕
            </button>

            <div>
              <h3 className="font-serif font-extrabold text-[#3D2612] text-xl">Create New Pastry</h3>
              <p className="text-xs text-gray-400">Fill in details to release into public inventories.</p>
            </div>

            <form onSubmit={handleAddNewP} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5">Pastry Title</label>
                <input 
                  type="text"
                  required
                  value={newPName}
                  onChange={(e) => setNewPName(e.target.value)}
                  placeholder="e.g., Brioche bread"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5 text-[10px]">Category</label>
                  <select
                    value={newPCategory}
                    onChange={(e) => setNewPCategory(e.target.value)}
                    className="w-full px-2 py-2.5 rounded-lg border border-gray-200 bg-white text-[11px]"
                  >
                    <option value="Crinkles">Crinkles</option>
                    <option value="Cakes">Cakes</option>
                    <option value="Bread">Bread</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5 text-[10px]">Price (₱)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={newPPrice}
                    onChange={(e) => setNewPPrice(e.target.value)}
                    placeholder="150.00"
                    className="w-full px-2 py-2.5 rounded-lg border border-gray-200 focus:outline-none text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5 text-[10px]">Stock No.</label>
                  <input 
                    type="number"
                    required
                    value={newPStock}
                    onChange={(e) => setNewPStock(e.target.value)}
                    placeholder="40"
                    className="w-full px-2 py-2.5 rounded-lg border border-gray-200 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5">Pastry Cover Photo</label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-[#8B5E3C] transition bg-[#FFF8F0]/30 cursor-pointer min-h-[90px] flex flex-col justify-center">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const base64 = await convertToBase64(file);
                        setNewPImage(base64);
                        triggerNotification("Gourmet Cover draft loaded!", "success");
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {newPImage ? (
                    <div className="space-y-1.5">
                      <img src={newPImage} alt="" className="w-14 h-14 object-cover rounded shadow mx-auto" />
                      <p className="text-emerald-700 font-bold">✓ Picture encoded successfully</p>
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-[#8B5E3C]">Click to choose pastry cover photo</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Accepts standard images up to 8MB</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-1 font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={newPAvailable}
                    onChange={() => setNewPAvailable(!newPAvailable)}
                    className="rounded text-[#8B5E3C] focus:ring-[#8B5E3C]"
                  />
                  <span>Active Stock</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={newPFeatured}
                    onChange={() => setNewPFeatured(!newPFeatured)}
                    className="rounded text-[#8B5E3C] focus:ring-[#8B5E3C]"
                  />
                  <span>Hero Featured</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Assemble Pastry Recipe
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Product Form */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-4 border border-[#E8DCCF] shadow-2xl relative max-h-[90vh] overflow-y-auto w-full">
            <button 
              onClick={() => setEditingProduct(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 cursor-pointer"
            >
              ✕
            </button>

            <div>
              <h3 className="font-serif font-extrabold text-[#3D2612] text-xl">Adjust Pastry Inventory</h3>
              <p className="text-xs text-gray-400">Apply instant corrections below.</p>
            </div>

            <form onSubmit={handleEditP} className="space-y-4 bg-white">
              <div>
                <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5">Pastry Title</label>
                <input 
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5 text-[10px]">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-2 py-2.5 rounded-lg border border-gray-200 bg-white text-[11px]"
                  >
                    <option value="Crinkles">Crinkles</option>
                    <option value="Cakes">Cakes</option>
                    <option value="Bread">Bread</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5 text-[10px]">Price (₱)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-2.5 rounded-lg border border-gray-200 focus:outline-none text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5 text-[10px]">Stock No.</label>
                  <input 
                    type="number"
                    required
                    value={editingProduct.stock !== undefined ? editingProduct.stock : 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-2.5 rounded-lg border border-gray-200 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 uppercase tracking-widest mb-1.5">Update cover image file</label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-[#8B5E3C] transition bg-[#FFF8F0]/30 cursor-pointer flex flex-col justify-center items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const base64 = await convertToBase64(file);
                        setEditingProduct({ ...editingProduct, image: base64 });
                        triggerNotification("Custom cover updated successfully!", "success");
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <img src={editingProduct.image} alt="" className="w-14 h-14 object-cover rounded shadow" />
                  <p className="font-bold text-[#8B5E3C] text-[10px]">Click or drop here to design replacements</p>
                </div>
              </div>

              <div className="flex gap-4 pt-1 font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={editingProduct.available}
                    onChange={() => setEditingProduct({ ...editingProduct, available: !editingProduct.available })}
                    className="rounded text-[#8B5E3C] focus:ring-[#8B5E3C]"
                  />
                  <span>Active In-Stock</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={editingProduct.isFeatured}
                    onChange={() => setEditingProduct({ ...editingProduct, isFeatured: !editingProduct.isFeatured })}
                    className="rounded text-[#8B5E3C] focus:ring-[#8B5E3C]"
                  />
                  <span>Home Featured</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Save Pastry Configuration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Persistent Backdrop Operations Loader */}
      {isDashboardProcessing && (
        <div id="dashboard-loader" className="fixed inset-0 z-50 bg-charcoal/30 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="bg-white/95 border border-[#E8DCCF] rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center max-w-xs font-sans">
            <RefreshCw className="w-10 h-10 text-[#8B5E3C] animate-spin" strokeWidth={3} />
            <div>
              <h4 className="font-serif font-bold text-[#3D2612] text-sm">Commiting Bakery Records</h4>
              <p className="text-[10px] text-gray-400 mt-1">Please wait while your configurations are saved to the persistent database.</p>
            </div>
          </div>
        </div>
      )}

      {/* Save Changes Confirmation Popup Prompt */}
      {showConfirmModal && pendingSaveAction && (
        <div id="save-confirmation-modal" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 border border-[#E8DCCF] shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-[#FFF8F0] border border-[#E8DCCF] text-[#8B5E3C] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-serif font-extrabold text-[#3D2612] text-lg">{pendingSaveAction.title}</h3>
              <p className="text-xs text-clay font-sans px-2 leading-relaxed">
                {pendingSaveAction.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 font-sans text-xs">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingSaveAction(null);
                }}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition cursor-pointer"
              >
                No, Discard
              </button>
              <button
                onClick={async () => {
                  const callback = pendingSaveAction.action;
                  setShowConfirmModal(false);
                  setPendingSaveAction(null);
                  setIsDashboardProcessing(true);
                  try {
                    await callback();
                  } catch (err) {
                    console.error("Confirmation execution error:", err);
                  } finally {
                    setIsDashboardProcessing(false);
                  }
                }}
                className="py-2.5 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold rounded-xl transition cursor-pointer"
              >
                Yes, Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
