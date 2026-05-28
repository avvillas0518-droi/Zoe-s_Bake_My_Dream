import React, { useState, useEffect } from "react";
import { Check, Trash, X } from "lucide-react";
import { Product, Testimonial, Promotion, Order, BakeryStory, BakeryAddress, AdminProfile, Ingredient } from "./types";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomeView from "./components/HomeView";
import MenuView from "./components/MenuView";
import AboutView from "./components/AboutView";
import ContactView from "./components/ContactView";
import AuthView from "./components/AuthView";
import DashboardView from "./components/DashboardView";
import ProfileView from "./components/ProfileView";
import OrderTrackingView from "./components/OrderTrackingView";
import AdminInquiriesView from "./components/AdminInquiriesView";

let globalNotificationId = Date.now();

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Core API State variables (initialized with robust fallbacks before API resolution)
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [cart, setCart] = useState<(Product & { quantity: number })[]>([]);
  const [logo, setLogo] = useState<string>("");

  const [story, setStory] = useState<BakeryStory>({
    title: "Zoe's Bake My Dream",
    tagline: "Our Brioche & Crinkle Journey Since July 2020",
    mainText: `Zoe’s Bake My Dream started baking on July 11, 2020. It began as a part-time venture while I was a student during the pandemic, aiming to build my own business through the help of a scholarship. At first, it was only meant to be a hobby, but over time, orders started coming in along with positive feedback. Customers loved that the products were not too sweet and had a delicious taste. Zoe’s Bake My Dream started as a home-based baking business where a dream began.`,
    secondaryText: "",
    ecoTitle: "Love & Passion In Every Bake",
    ecoText: "Soft, chewy, and not too sweet—perfectly balanced flavor profiles crafted from unbleached ingredients, AOP butter, and real dark chocolate cores. Handcrafted with love by our family for your cozy gatherings."
  });

  const [address, setAddress] = useState<BakeryAddress>({
    street: "Brgy. Tranca",
    suite: "Bay",
    city: "Laguna",
    hours: "Monday - Saturday: 7:00 AM - 6:00 PM",
    hoursClosed: "Sunday: Closed for rest & brioche dough prep",
    phone: "+1 555-0199",
    email: "bakehouse@zoesdream.com"
  });

  const [profile, setProfile] = useState<AdminProfile>({
    name: "Camille Sumaya Marasigan",
    role: "Founder & Master Baker",
    avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&h=350&q=80",
    bio: "5 years of baking training in TESDA and CMDI."
  });

  const [promotion, setPromotion] = useState<Promotion>({
    title: "Weekend Combo Treat Deal!",
    description: "Purchase 2 Gourmet Chunk Cookies, and secure 1 Fresh Brioche Bread Loaf with a special 50% discount!",
    code: "VALUETREAT26",
    endDate: new Date(Date.now() + 86400000 * 2.5).toISOString()
  });

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // User Security Coordinate State
  const [user, setUser] = useState({
    loggedIn: false,
    isAdmin: false,
    name: "",
    email: "",
    role: "Customer"
  });

  // Success Confirmation dialogs
  const [completedOrderNum, setCompletedOrderNum] = useState<string | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    globalNotificationId += 1;
    const id = globalNotificationId;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Sync state on base initialization mounting
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const prodRes = await fetch("/api/products");
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods);
        }

        const orderRes = await fetch("/api/orders");
        if (orderRes.ok) {
          const ords = await orderRes.json();
          setOrders(ords);
        }

        const ingRes = await fetch("/api/ingredients");
        if (ingRes.ok) {
          const ings = await ingRes.json();
          setIngredients(ings);
        }

        const inqRes = await fetch("/api/inquiries");
        if (inqRes.ok) {
          const inqs = await inqRes.json();
          setInquiries(inqs);
        }

        const logoRes = await fetch("/api/website/logo");
        if (logoRes.ok) {
          const lData = await logoRes.json();
          if (lData.logoImage) setLogo(lData.logoImage);
        }

        const metaRes = await fetch("/api/website");
        if (metaRes.ok) {
          const metadata = await metaRes.json();
          if (metadata.story) setStory(metadata.story);
          if (metadata.address) setAddress(metadata.address);
          if (metadata.profile) setProfile(metadata.profile);
          if (metadata.promotion) setPromotion(metadata.promotion);
          if (metadata.testimonials) setTestimonials(metadata.testimonials);
        }
      } catch (err) {
        console.error("Mount API synchronize error:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Real-time automatic background syncing across devices via high-frequency short polling
  useEffect(() => {
    if (!user.loggedIn) return;

    const syncInterval = setInterval(async () => {
      try {
        const orderRes = await fetch("/api/orders");
        if (orderRes.ok) {
          const ords = await orderRes.json();
          setOrders(ords);
        }
        
        const prodRes = await fetch("/api/products");
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods);
        }

        if (user.isAdmin) {
          const inqRes = await fetch("/api/inquiries");
          if (inqRes.ok) {
            const inqs = await inqRes.json();
            setInquiries(inqs);
          }
        }
      } catch (err) {
        console.warn("Background auto-sync check failed:", err);
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [user.loggedIn, user.isAdmin]);

  // --- Core State Modification Integrations (Synced to express backend) ---

  const handleAddToCart = (product: Product, quantityToAdd: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const qty = Math.max(1, quantityToAdd);
      if (existing) {
        triggerNotification(`Updated "${product.name}" quantity inside basket!`, "info");
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      triggerNotification(`"${product.name}" added to pre-order basket!`, "success");
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleSetCartQty = (id: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = Math.max(1, quantity);
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (id: string, name: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    triggerNotification(`Removed "${name}" from basket.`, "info");
  };

  const handleCheckoutSubmit = async (details: {
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
  }) => {
    const itemsPayload = cart.map((c) => ({
      productId: c.id,
      name: c.name,
      price: c.price,
      quantity: c.quantity
    }));

    const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderObj = {
      customerName: details.name,
      email: details.email,
      phone: details.phone,
      items: itemsPayload,
      deliveryOption: details.deliveryOption,
      date: details.date,
      total: cartSubtotal * 1.05, // 5% packaging fee
      specialRequests: details.requests,
      paymentReference: details.paymentReference,
      paymentChannel: details.paymentChannel,
      deliveryAddress: details.deliveryAddress,
      landmark: details.landmark
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderObj)
      });

      if (!response.ok) {
        throw new Error("Pre-order logging failed.");
      }

      const freshlyCreatedOrder = await response.json();
      setOrders((prev) => [freshlyCreatedOrder, ...prev]);
      setCompletedOrderNum(freshlyCreatedOrder.id);
      setCart([]);
      triggerNotification("Pre-order logged successfully on Camille's pipeline!", "success");

      // Refetch products to get updated stock
      const prodRes = await fetch("/api/products");
      if (prodRes.ok) {
        const prods = await prodRes.json();
        setProducts(prods);
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Failure syncing order connection. Brioche resting.", "error");
    }
  };

  // --- Admin Operational callbacks ---

  const handleAddProductBackend = async (newP: Partial<Product>) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newP)
      });
      if (res.ok) {
        const productItem = await res.json();
        setProducts((prev) => [productItem, ...prev]);
        triggerNotification(`"${productItem.name}" released on public menu!`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProductBackend = async (updated: Product) => {
    try {
      const res = await fetch(`/api/products/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const itemResult = await res.json();
        setProducts((prev) =>
          prev.map((p) => (p.id === itemResult.id ? itemResult : p))
        );
        triggerNotification(`inventory item updated successfully!`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProductBackend = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        triggerNotification(`"${name}" was deleted from active menus.`, "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatusBackend = async (id: string, nextStatus: 'Pending' | 'Baking' | 'Ready' | 'Delivered') => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const orderResult = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderResult.id ? orderResult : o))
        );
        triggerNotification(`Order status updated to state: ${nextStatus}!`, "success");

        // Refetch ingredients in real-time
        const ingRes = await fetch("/api/ingredients");
        if (ingRes.ok) {
          const ings = await ingRes.json();
          setIngredients(ings);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderGeneral = async (orderId: string, updatedFields: { items?: any[]; deliveryFee?: number }) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        triggerNotification(`Order ${orderId} revised successfully!`, "success");
      } else {
        triggerNotification(`Failed to save order updates.`, "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`Failed to save order updates.`, "error");
    }
  };

  const handleDeleteOrderBackend = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        triggerNotification(`💔 Order #${orderId} was removed permanently.`, "info");
      } else {
        triggerNotification("Could not delete order record.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Error connecting to server to delete order.", "error");
    }
  };

  const handleRefreshOrders = async (): Promise<void> => {
    try {
      const orderRes = await fetch("/api/orders");
      if (orderRes.ok) {
        const ords = await orderRes.json();
        setOrders(ords);
      } else {
        throw new Error("Failed to retrieve fresh status records.");
      }
    } catch (err) {
      console.error("Refresh orders error:", err);
      throw err;
    }
  };

  const handleAddIngredientBackend = async (newIngData: { name: string; stock: number; unit: string; minThreshold: number }) => {
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIngData)
      });
      if (res.ok) {
        const itemResult = await res.json();
        setIngredients((prev) => [...prev, itemResult]);
        triggerNotification(`Ingredient "${itemResult.name}" registered successfully!`, "success");
      } else {
        const errorData = await res.json();
        triggerNotification(errorData.error || "Failed to add ingredient", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network error while registering ingredient.", "error");
    }
  };

  const handleDeleteIngredientBackend = async (id: string) => {
    try {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setIngredients((prev) => prev.filter((i) => i.id !== id));
        triggerNotification("Ingredient deleted from pool successfully.", "success");
      } else {
        triggerNotification("Failed to delete ingredient.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network error deleting ingredient.", "error");
    }
  };

  const handleUpdateIngredientBackend = async (id: string, updatedFields: Partial<Ingredient>) => {
    try {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const itemResult = await res.json();
        setIngredients((prev) =>
          prev.map((i) => (i.id === id ? itemResult : i))
        );
        triggerNotification(`Ingredient "${itemResult.name}" stock level updated!`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostReviewBackend = async (name: string, rating: number, text: string, role?: string) => {
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, text, role })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.testimonials) {
          setTestimonials(data.testimonials);
        }
        triggerNotification(`✨ Thank you, ${name}! Your sweet review has been posted successfully!`, "success");
        return true;
      } else {
        const err = await res.json();
        triggerNotification(err.error || "Failed to post review.", "error");
        return false;
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network error posting review.", "error");
      return false;
    }
  };

  const handleUpdateLogoBackend = async (newLogo: string) => {
    try {
      const res = await fetch("/api/website/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoImage: newLogo })
      });
      if (res.ok) {
        setLogo(newLogo);
        triggerNotification(newLogo ? "Bakeshop logo updated successfully!" : "Bakeshop logo reset to default.", "success");
      } else {
        triggerNotification("Failed to update logo branding.", "error");
      }
    } catch (err) {
      console.error("Error updating logo:", err);
      triggerNotification("Error persisting logo branding.", "error");
    }
  };

  const handleUpdateWebsiteBackend = async (metaPayload: {
    updatedStory?: Partial<BakeryStory>;
    updatedAddress?: Partial<BakeryAddress>;
    updatedProfile?: Partial<AdminProfile>;
    updatedPromotion?: Partial<Promotion>;
    updatedTestimonials?: Testimonial[];
  }) => {
    try {
      const res = await fetch("/api/website", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaPayload)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.story) setStory(result.story);
        if (result.address) setAddress(result.address);
        if (result.profile) setProfile(result.profile);
        if (result.promotion) setPromotion(result.promotion);
        if (result.testimonials) setTestimonials(result.testimonials);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSubmit = (resolvedName: string, email: string, isAdmin: boolean, role: string = "Customer") => {
    setUser({
      loggedIn: true,
      isAdmin: role === "Owner" || isAdmin,
      name: resolvedName,
      email,
      role
    });

    let welcomeMessage = `Welcome to Bake My Dream, ${resolvedName}! Logged in as Valued Loyalty Patron.`;
    if (role === "Owner") {
      welcomeMessage = `Welcome Master Chef Camille! Logged in as Owner & Manager.`;
    } else if (role === "Reseller") {
      welcomeMessage = `Welcome Partner! Logged in as Registered Reseller client.`;
    }

    triggerNotification(welcomeMessage);

    if (role === "Owner" || isAdmin) {
      setActiveTab("dashboard");
    } else {
      setActiveTab("home");
    }
  };

  const handleLogout = () => {
    setUser({ loggedIn: false, isAdmin: false, name: "", email: "", role: "Customer" });
    triggerNotification("Logged out securely. We look forward to baking for your gatherings soon!", "info");
    setActiveTab("home");
  };

  const handleUpdateUserName = (nextName: string) => {
    setUser((prev) => ({ ...prev, name: nextName }));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-alabaster text-charcoal font-sans flex flex-col selection:bg-burgundy/20 selection:text-burgundy">
      
      {/* Dynamic Toast Notifications Pile in Bottom-Left to avoid overlapping top buttons / tabs */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-2 pointer-events-none max-w-sm w-full font-sans">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
            className={`pointer-events-auto cursor-pointer p-4 rounded-xl shadow-lg border text-xs font-semibold tracking-wide transition transform translate-y-0 opacity-100 flex items-center justify-between gap-3 bg-white select-none active:scale-95 duration-100 ${
              notif.type === "error" ? "border-red-200 text-red-600 shadow-xl hover:bg-red-50/25" :
              notif.type === "info" ? "border-putty text-clay shadow-xl hover:bg-[#FAF6F0]" :
              "border-[#E8DCCF] text-burgundy shadow-xl hover:bg-[#FAF6F0]"
            }`}
            title="Click to dismiss notification"
          >
            <div className="flex items-center gap-2.5">
              {notif.type === "error" ? (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#8B5E3C] animate-pulse shrink-0"></span>
              )}
              <span>{notif.message}</span>
            </div>
            
            <button 
              type="button" 
              className="p-1 rounded-full text-gray-300 hover:text-gray-500 transition hover:bg-gray-100 shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Shared Layout Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        cartCount={cartCount}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        orders={orders}
        inquiries={inquiries}
        customLogo={logo}
      />

      {/* Main Sections Routing Switcher */}
      <main className="flex-grow">
        {activeTab === "home" && (
          <HomeView
            products={products}
            promotion={promotion}
            testimonials={testimonials}
            setActiveTab={setActiveTab}
            setSelectedCategory={setSelectedCategory}
            onAddToCart={handleAddToCart}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === "menu" && (
          <MenuView
            products={products}
            cart={cart}
            user={user}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQty}
            onSetCartQuantity={handleSetCartQty}
            onRemoveFromCart={handleRemoveFromCart}
            onCheckout={handleCheckoutSubmit}
            triggerNotification={triggerNotification}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "about" && (
          <AboutView
            story={story}
            profile={profile}
          />
        )}

        {activeTab === "contact" && (
          <ContactView
            address={address}
            triggerNotification={triggerNotification}
            user={user}
          />
        )}

        {activeTab === "auth" && (
          <AuthView
            onLoginSuccess={handleLoginSubmit}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === "dashboard" && user.loggedIn && user.isAdmin && (
          <DashboardView
            products={products}
            orders={orders}
            ingredients={ingredients}
            story={story}
            address={address}
            profile={profile}
            promotion={promotion}
            testimonials={testimonials}
            triggerNotification={triggerNotification}
            onAddProduct={handleAddProductBackend}
            onUpdateProduct={handleUpdateProductBackend}
            onDeleteProduct={handleDeleteProductBackend}
            onUpdateOrderStatus={handleUpdateOrderStatusBackend}
            onUpdateWebsite={handleUpdateWebsiteBackend}
            onUpdateIngredient={handleUpdateIngredientBackend}
            onAddIngredient={handleAddIngredientBackend}
            onDeleteIngredient={handleDeleteIngredientBackend}
            customLogo={logo}
            onUpdateLogo={handleUpdateLogoBackend}
          />
        )}

        {activeTab === "analytics_tab" && user.loggedIn && user.isAdmin && (
          <DashboardView
            products={products}
            orders={orders}
            ingredients={ingredients}
            story={story}
            address={address}
            profile={profile}
            promotion={promotion}
            testimonials={testimonials}
            triggerNotification={triggerNotification}
            onAddProduct={handleAddProductBackend}
            onUpdateProduct={handleUpdateProductBackend}
            onDeleteProduct={handleDeleteProductBackend}
            onUpdateOrderStatus={handleUpdateOrderStatusBackend}
            onUpdateWebsite={handleUpdateWebsiteBackend}
            onUpdateIngredient={handleUpdateIngredientBackend}
            onAddIngredient={handleAddIngredientBackend}
            onDeleteIngredient={handleDeleteIngredientBackend}
            customLogo={logo}
            onUpdateLogo={handleUpdateLogoBackend}
            initialSubTab="analytics"
          />
        )}

        {activeTab === "profile" && user.loggedIn && (
          <ProfileView
            user={user}
            orders={orders}
            onUpdateUserName={handleUpdateUserName}
            setActiveTab={setActiveTab}
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === "tracking" && user.loggedIn && (
          <OrderTrackingView
            user={user}
            orders={orders}
            triggerNotification={triggerNotification}
            onRefreshOrders={handleRefreshOrders}
            onUpdateOrderStatus={handleUpdateOrderStatusBackend}
            onUpdateOrderGeneral={handleUpdateOrderGeneral}
            onDeleteOrder={handleDeleteOrderBackend}
          />
        )}

        {activeTab === "inquiries" && user.loggedIn && user.isAdmin && (
          <AdminInquiriesView
            triggerNotification={triggerNotification}
            inquiries={inquiries}
            onMarkAsRead={(id) => {
              setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, read: true } : inq));
            }}
            onRefresh={async () => {
              try {
                const res = await fetch("/api/inquiries");
                if (res.ok) {
                  const data = await res.json();
                  setInquiries(data);
                }
              } catch (err) {
                console.error("Sync inquiries failed", err);
              }
            }}
          />
        )}
      </main>

      {/* Fulfillment Successfully Verified dialogue overlay */}
      {completedOrderNum && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center border border-putty shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Check className="w-8 h-8 font-extrabold" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-600 font-sans">Pre-Order Verified</span>
              <h3 className="font-serif font-extrabold text-charcoal text-xl mt-1">Brioche Rising!</h3>
              <p className="text-xs text-clay mt-2 font-sans leading-relaxed">
                Your reservation key is <span className="font-mono font-bold text-charcoal bg-cream border border-putty px-1.5 py-0.5 rounded">{completedOrderNum}</span>. Camille's assist will notify your phone/email coordinates when baking departs.
              </p>
            </div>

            <button
              onClick={() => setCompletedOrderNum(null)}
              className="w-full py-3 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer font-sans"
            >
              Excellent, Thank you!
            </button>
          </div>
        </div>
      )}

      {/* Floating Interactive WhatsApp Chat Widget Button */}
      <a 
        href="https://wa.me/15550199?text=Hello%20Camille!%20I'd%20like%20to%20inquire%20about%20your%20custom%20pastries."
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer"
        title="Chat on WhatsApp with Camille"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.116-2.887-6.981C16.58 1.895 14.1 1.155 11.456 1.155 6.018 1.155 1.593 5.578 1.589 11.018c-.001 1.706.452 3.3 1.311 4.796L1.876 20.8l5.053-1.326zL6.647 19.15z"/>
        </svg>
      </a>

      {/* Shared Layout Footer */}
      <Footer
        address={address}
        setActiveTab={setActiveTab}
        triggerNotification={triggerNotification}
        onPostReview={handlePostReviewBackend}
        user={user}
        customLogo={logo}
      />

    </div>
  );
}
