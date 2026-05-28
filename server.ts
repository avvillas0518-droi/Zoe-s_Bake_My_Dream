import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dns from "dns";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Fix Node local dns lookup behavior
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

// --- Supabase Cloud Self-Healing State Configuration ---
let supabaseClient: any = null;
let supabaseStatus: "not_configured" | "connected" | "disconnected" | "table_missing" = "not_configured";
let supabaseErrorDetail = "";
let lastSyncTime = "";

function initializeSupabase() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  
  if (!url || !key) {
    supabaseStatus = "not_configured";
    console.log("ℹ️ Supabase environment variables not configured. Operating in high-reliability self-healing local DB mode (db.json).");
    return;
  }

  try {
    supabaseClient = createClient(url, key);
    console.log("🔌 Initialized Supabase Cloud client connection successfully!");
  } catch (err: any) {
    supabaseStatus = "disconnected";
    supabaseErrorDetail = err?.message || String(err);
    console.error("❌ Failed to initialize Supabase client:", err);
  }
}

// Spark the connection configuration
initializeSupabase();


// Allow generous body limits for base64 image uploads in bakery story/pastry management
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy initializer for Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ GEMINI_API_KEY is not defined in environment variables. Running in AI simulation mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// In-Memory Persistent Store representing database tables
let products: any[] = [];
try {
  const defaultProductsPath = path.join(process.cwd(), "src", "default_products.json");
  if (fs.existsSync(defaultProductsPath)) {
    products = JSON.parse(fs.readFileSync(defaultProductsPath, "utf-8"));
  }
} catch (err) {
  console.error("Failed to load default products from json:", err);
}

let ingredients = [
  { id: 'ing-1', name: 'French AOP Butter', stock: 124.5, unit: 'kg', minThreshold: 20 },
  { id: 'ing-2', name: 'Madagascar Bourbon Vanilla Pods', stock: 85, unit: 'pcs', minThreshold: 10 },
  { id: 'ing-3', name: 'Organic Wheat Flour', stock: 350.0, unit: 'kg', minThreshold: 50 },
  { id: 'ing-4', name: 'Free-range Eggs', stock: 620, unit: 'pcs', minThreshold: 100 },
  { id: 'ing-5', name: 'Premium Cocoa Powder', stock: 45.0, unit: 'kg', minThreshold: 10 },
  { id: 'ing-6', name: 'Organic Raspberries', stock: 12.0, unit: 'kg', minThreshold: 5 },
  { id: 'ing-7', name: 'Brioche French Yeast Starter', stock: 15.0, unit: 'liters', minThreshold: 2 },
  { id: 'ing-8', name: '70% Dark Cocoa Chunks', stock: 60.0, unit: 'kg', minThreshold: 15 },
  { id: 'ing-9', name: 'Caster Sugar', stock: 180.0, unit: 'kg', minThreshold: 30 }
];

const recipes: Record<string, { name: string; amount: number; unit: string }[]> = {
  'prod-1': [
    { name: 'French AOP Butter', amount: 0.05, unit: 'kg' },
    { name: 'Organic Wheat Flour', amount: 0.08, unit: 'kg' },
    { name: 'Free-range Eggs', amount: 0.1, unit: 'pcs' },
    { name: '70% Dark Cocoa Chunks', amount: 0.05, unit: 'kg' },
    { name: 'Caster Sugar', amount: 0.04, unit: 'kg' }
  ],
  'prod-4': [
    { name: 'French AOP Butter', amount: 0.25, unit: 'kg' },
    { name: 'Organic Wheat Flour', amount: 0.35, unit: 'kg' },
    { name: 'Free-range Eggs', amount: 3.0, unit: 'pcs' },
    { name: 'Premium Cocoa Powder', amount: 0.15, unit: 'kg' },
    { name: '70% Dark Cocoa Chunks', amount: 0.20, unit: 'kg' },
    { name: 'Caster Sugar', amount: 0.25, unit: 'kg' }
  ],
  'prod-5': [
    { name: 'Organic Wheat Flour', amount: 0.45, unit: 'kg' },
    { name: 'French Brioche Yeast Starter', amount: 0.1, unit: 'liters' }
  ]
};

let testimonials = [
  {
    id: 't-1',
    name: 'Gurl Friend',
    rating: 5,
    text: "Masarap gurl hindi matamis haha",
    role: 'Verified Buyer',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 't-2',
    name: 'Choco Fanatic',
    rating: 5,
    text: "Gustong gusto ko yung pagka chewy nung chocolate",
    role: 'Loyal Customer',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 't-3',
    name: 'Crinkle Connoisseur',
    rating: 5,
    text: "Welcome...ang sarap ng crinkles... Hindi matamis.. At yung isa.. Sakto lang medyo mapait.. Para sa mga diabetic 😆",
    role: 'Loyal Patron',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 't-4',
    name: 'Kylie Alvis',
    rating: 5,
    text: "mukhang mapapa ulit po hahahaa",
    role: 'Happy Customer',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80'
  }
];

let promotion = {
  title: 'Weekend Special Combo Offer!',
  description: 'Buy 2 Premium Chunk Cookies, Get 1 artisanal Brioche loaf at 50% discount!',
  code: 'COOKIECOMBODEAL',
  endDate: new Date(Date.now() + 86400000 * 2.5).toISOString()
};

let orders: any[] = [
  {
    id: '001',
    customerName: 'Marcus Aurelius',
    email: 'marcus@philosophy.org',
    phone: '+1 555-1234',
    items: [
      { productId: 'prod-1', name: 'Gourmet Chunk Cookies', price: 150.00, quantity: 4 }
    ],
    deliveryOption: 'Delivery',
    date: '2026-05-22',
    status: 'Pending',
    total: 630.00,
    specialRequests: 'Please label containing gluten details',
    paymentReference: 'GC052281920A',
    paymentChannel: 'GCash'
  },
  {
    id: '002',
    customerName: 'Gwendolyn Brooks',
    email: 'gwen@poetry.com',
    phone: '+1 555-8899',
    items: [
      { productId: 'prod-1', name: 'Gourmet Chunk Cookies', price: 150.00, quantity: 3 },
      { productId: 'prod-5', name: 'Artisanal Brioche Loaf', price: 280.00, quantity: 2 }
    ],
    deliveryOption: 'Pickup',
    date: '2026-05-21',
    status: 'Baking',
    total: 1060.00,
    specialRequests: 'Will pick up precisely at 9:00 AM!'
  }
];

let nextOrderIdSeq = 3;

let story = {
  title: "Zoe's Bake My Dream",
  tagline: "Our Brioche & Crinkle Journey Since July 2020",
  mainText: `Zoe’s Bake My Dream started baking on July 11, 2020. It began as a part-time venture while I was a student during the pandemic, aiming to build my own business through the help of a scholarship. At first, it was only meant to be a hobby, but over time, orders started coming in along with positive feedback. Customers loved that the products were not too sweet and had a delicious taste. Zoe’s Bake My Dream started as a home-based baking business where a dream began.`,
  secondaryText: "",
  ecoTitle: "Love & Passion In Every Bake",
  ecoText: "Soft, chewy, and not too sweet—perfectly balanced flavor profiles crafted from unbleached ingredients, AOP butter, and real dark chocolate cores. Handcrafted with love by our family for your cozy gatherings."
};

let address = {
  street: "Brgy. Tranca",
  suite: "Bay",
  city: "Laguna",
  hours: "Monday - Saturday: 7:00 AM - 6:00 PM",
  hoursClosed: "Sunday: Closed for rest & brioche dough prep",
  phone: "+1 555-0199",
  email: "bakehouse@zoesdream.com"
};

let profile = {
  name: "Camille Sumaya Marasigan",
  role: "Founder & Master Baker",
  avatar: "https://images.unsplash.com/photo-1577219491130-ce391730fb2c?auto=format&fit=crop&w=300&h=350&q=80",
  bio: "5 years of baking training in TESDA and CMDI."
};

let merchantQrImage = ""; // In-memory container for owner uploaded Base64 QR Image
let merchantLogoImage = ""; // In-memory container for owner uploaded Base64 Logo Image

// --- JSON Persistence implementation ---
const DB_FILE = path.join(process.cwd(), "db.json");

function saveToLocalDatabaseFile() {
  try {
    const data = {
      products,
      ingredients,
      orders,
      story,
      address,
      profile,
      promotion,
      testimonials,
      simulatedEmails,
      inquiries,
      merchantQrImage,
      merchantLogoImage,
      nextOrderIdSeq
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Could not write DB file locally:", error);
  }
}

async function saveToSupabaseCloud() {
  if (!supabaseClient) return;
  try {
    const statePayload = {
      products,
      ingredients,
      orders,
      story,
      address,
      profile,
      promotion,
      testimonials,
      simulatedEmails,
      inquiries,
      merchantQrImage,
      merchantLogoImage,
      nextOrderIdSeq
    };

    const { error } = await supabaseClient
      .from("bakery_state")
      .upsert({ 
        id: "current_state", 
        data: statePayload, 
        updated_at: new Date().toISOString() 
      });

    if (error) {
      if (error.code === "42P01") {
        supabaseStatus = "table_missing";
      } else {
        supabaseStatus = "disconnected";
        supabaseErrorDetail = error.message;
      }
      console.error("❌ Failed to sync to Supabase Cloud:", error.message);
    } else {
      supabaseStatus = "connected";
      supabaseErrorDetail = "";
      lastSyncTime = new Date().toISOString();
      console.log("💾 ☁️ Synchronized master state successfully with Supabase Cloud!");
    }
  } catch (err: any) {
    supabaseStatus = "disconnected";
    supabaseErrorDetail = err?.message || String(err);
    console.error("❌ Error writing state to Supabase Cloud:", err);
  }
}

function saveToDatabase() {
  // Always trigger instant local persist
  saveToLocalDatabaseFile();
  
  // Fire-and-forget backoff async sync to Supabase
  if (supabaseClient) {
    saveToSupabaseCloud().catch(err => {
      console.error("Asynchronous Supabase connection save threw exception:", err);
    });
  }
}

function runOrderSafeguards() {
  if (orders && orders.length) {
    const seenIds = new Set<string>();
    let changed = false;
    let tempNextSeq = 2; // Default starting sequence base

    // Pass 1: Find highest legitimate ID in numerical format
    orders.forEach((o: any) => {
      const num = parseInt(o.id, 10);
      if (!isNaN(num) && num > tempNextSeq) {
        tempNextSeq = num;
      }
    });

    // Pass 2: Reassign duplicates from oldest (right) to newest (left)
    for (let i = orders.length - 1; i >= 0; i--) {
      const o = orders[i];
      if (!o.id || seenIds.has(o.id)) {
        tempNextSeq += 1;
        const originalId = o.id || '000';
        o.id = String(tempNextSeq).padStart(3, '0');
        console.log(`[Database Safeguard] Reassigned duplicate order ${originalId} -> ${o.id} for ${o.customerName}`);
        changed = true;
      } else {
        seenIds.add(o.id);
      }
    }

    if (changed) {
      nextOrderIdSeq = tempNextSeq + 1;
      saveToDatabase();
      console.log("💾 Persistent local JSON database auto-safeguard ran successfully!");
    }
  }
}

async function loadFromDatabase() {
  // First, baseline read from local db.json to ensure fastest start
  try {
    if (fs.existsSync(DB_FILE)) {
      const dbContent = fs.readFileSync(DB_FILE, "utf-8").trim();
      if (dbContent) {
        const data = JSON.parse(dbContent);
        if (data.products && data.products.length > 0) products = data.products;
        if (data.ingredients) ingredients = data.ingredients;
        if (data.orders) orders = data.orders;
        if (data.story) story = data.story;
        if (data.address) address = data.address;
        if (data.profile) profile = data.profile;
        if (data.promotion) promotion = data.promotion;
        if (data.testimonials) testimonials = data.testimonials;
        if (data.simulatedEmails) simulatedEmails = data.simulatedEmails;
        if (data.inquiries !== undefined) inquiries = data.inquiries;
        if (data.merchantQrImage !== undefined) merchantQrImage = data.merchantQrImage;
        if (data.merchantLogoImage !== undefined) merchantLogoImage = data.merchantLogoImage;
        if (data.nextOrderIdSeq !== undefined) nextOrderIdSeq = data.nextOrderIdSeq;
      }
    }
  } catch (err) {
    console.error("Baseline db.json loading failed, using built-in memory/default fallback:", err);
  }

  // Dual fallback: ensure default products are loaded if catalog is empty
  const defaultProductsPath = path.join(process.cwd(), "src", "default_products.json");
  if ((!products || products.length === 0) && fs.existsSync(defaultProductsPath)) {
    try {
      products = JSON.parse(fs.readFileSync(defaultProductsPath, "utf-8"));
    } catch (_) {}
  }

  // Load from Supabase Cloud if connection is configured
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("bakery_state")
        .select("*")
        .eq("id", "current_state")
        .maybeSingle();

      if (error) {
        if (error.code === "42P01") {
          supabaseStatus = "table_missing";
          console.warn("⚠️ Supabase 'bakery_state' table missing. Operating in self-healing local mode.");
        } else {
          supabaseStatus = "disconnected";
          supabaseErrorDetail = error.message;
          console.error("⚠️ Supabase server query error during startup:", error.message);
        }
      } else if (data && data.data) {
        // Successfully loaded from Supabase! Let's reconcile!
        const cloudData = data.data;
        console.log("☁️ Successfully connected to Supabase Cloud and synchronized master state.");
        
        if (cloudData.products && cloudData.products.length > 0) products = cloudData.products;
        if (cloudData.ingredients) ingredients = cloudData.ingredients;
        if (cloudData.orders) orders = cloudData.orders;
        if (cloudData.story) story = cloudData.story;
        if (cloudData.address) address = cloudData.address;
        if (cloudData.profile) profile = cloudData.profile;
        if (cloudData.promotion) promotion = cloudData.promotion;
        if (cloudData.testimonials) testimonials = cloudData.testimonials;
        if (cloudData.simulatedEmails) simulatedEmails = cloudData.simulatedEmails;
        if (cloudData.inquiries !== undefined) inquiries = cloudData.inquiries;
        if (cloudData.merchantQrImage !== undefined) merchantQrImage = cloudData.merchantQrImage;
        if (cloudData.merchantLogoImage !== undefined) merchantLogoImage = cloudData.merchantLogoImage;
        if (cloudData.nextOrderIdSeq !== undefined) nextOrderIdSeq = cloudData.nextOrderIdSeq;

        supabaseStatus = "connected";
        supabaseErrorDetail = "";
        lastSyncTime = new Date().toISOString();

        // Write local mirror backup copy
        saveToLocalDatabaseFile();
      } else {
        // Connected but table is empty. Populate table with current local copy to build state.
        console.log("☁️ Supabase Cloud is initialized but blank. Syncing current state uphill...");
        supabaseStatus = "connected";
        await saveToSupabaseCloud();
      }
    } catch (err: any) {
      supabaseStatus = "disconnected";
      supabaseErrorDetail = err?.message || String(err);
      console.error("🔌 Exception during Supabase initialization sync:", err);
    }
  }

  // Finally run order checks
  runOrderSafeguards();
}

// Initial seed/load before API endpoints are hit
loadFromDatabase();


// --- API ENDPOINTS ---

// GET Database Status and Diagnostics Center
app.get("/api/admin/db-status", (req, res) => {
  const localFileExists = fs.existsSync(DB_FILE);
  let localFileSize = 0;
  if (localFileExists) {
    localFileSize = fs.statSync(DB_FILE).size;
  }

  const sqlSchema = `CREATE TABLE IF NOT EXISTS bakery_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable full read/write access for your custom service key
ALTER TABLE bakery_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read-write access" ON bakery_state FOR ALL USING (true) WITH CHECK (true);`;

  res.json({
    status: supabaseStatus,
    errorDetail: supabaseErrorDetail,
    lastSyncTime: lastSyncTime,
    databaseSource: supabaseStatus === "connected" ? "Supabase Cloud DB Cluster" : "Self-Healing Local Storage (db.json)",
    localFileExists,
    localFileSize: `${(localFileSize / 1024).toFixed(2)} KB`,
    stats: {
      products: products.length,
      orders: orders.length,
      ingredients: ingredients.length,
      inquiries: inquiries ? inquiries.length : 0,
      simulatedEmails: simulatedEmails.length
    },
    sqlSchema,
    envConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    supabaseUrl: process.env.SUPABASE_URL || "NOT SET",
  });
});

// POST Manual Force Sync Database (Uphill or Downhill reconciliation)
app.post("/api/admin/db-sync", async (req, res) => {
  const { direction } = req.body; // "uphill" (push local to cloud) or "downhill" (pull cloud to local)

  if (!supabaseClient) {
    return res.status(400).json({ error: "Supabase client is not configured. Please supply SUPABASE_URL and SUPABASE_ANON_KEY." });
  }

  try {
    if (direction === "uphill") {
      console.log("⚡ [Manual Reconciliation] Pushing current memory state to Supabase Cloud...");
      await saveToSupabaseCloud();
      return res.json({ success: true, message: "Successfully pushed memory/cache state uphill to Supabase Cloud!", lastSyncTime });
    } else if (direction === "downhill") {
      console.log("⚡ [Manual Reconciliation] Pulling master copy from Supabase Cloud...");
      const { data, error } = await supabaseClient
        .from("bakery_state")
        .select("*")
        .eq("id", "current_state")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data && data.data) {
        const cloudData = data.data;
        if (cloudData.products) products = cloudData.products;
        if (cloudData.ingredients) ingredients = cloudData.ingredients;
        if (cloudData.orders) orders = cloudData.orders;
        if (cloudData.story) story = cloudData.story;
        if (cloudData.address) address = cloudData.address;
        if (cloudData.profile) profile = cloudData.profile;
        if (cloudData.promotion) promotion = cloudData.promotion;
        if (cloudData.testimonials) testimonials = cloudData.testimonials;
        if (cloudData.simulatedEmails) simulatedEmails = cloudData.simulatedEmails;
        if (cloudData.inquiries !== undefined) inquiries = cloudData.inquiries;
        if (cloudData.merchantQrImage !== undefined) merchantQrImage = cloudData.merchantQrImage;
        if (cloudData.merchantLogoImage !== undefined) merchantLogoImage = cloudData.merchantLogoImage;
        if (cloudData.nextOrderIdSeq !== undefined) nextOrderIdSeq = cloudData.nextOrderIdSeq;

        supabaseStatus = "connected";
        supabaseErrorDetail = "";
        lastSyncTime = new Date().toISOString();

        saveToLocalDatabaseFile();
        return res.json({ success: true, message: "Successfully synchronized master cloud state downhill to local memory and disk!", lastSyncTime });
      } else {
        return res.status(404).json({ error: "No state found in Supabase Cloud. You may want to perform an uphill Sync first." });
      }
    } else {
      return res.status(400).json({ error: "Invalid sync direction specifier. Must be 'uphill' or 'downhill'." });
    }
  } catch (err: any) {
    console.error("Manual database sync routine exception:", err);
    res.status(500).json({ error: "Sync routine exception", message: err?.message || String(err) });
  }
});

// GET Products catalog
app.get("/api/products", (req, res) => {
  res.json(products);
});

// POST New Product
app.post("/api/products", (req, res) => {
  const { name, category, description, price, image, available, isFeatured, stock } = req.body;
  if (!name || isNaN(price)) {
    return res.status(400).json({ error: "Invalid product parameters." });
  }
  const newProduct = {
    id: `prod-${Date.now()}`,
    name,
    category,
    description: description || 'Delicately handcrafted artisan pastry.',
    price: parseFloat(price),
    image: image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    available: available !== undefined ? available : true,
    isFeatured: isFeatured !== undefined ? isFeatured : false,
    stock: stock !== undefined ? parseInt(stock) : 40
  };
  products = [newProduct, ...products];
  saveToDatabase();
  res.status(201).json(newProduct);
});

// PUT Product modification
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  const current = products[index];
  products[index] = {
    ...current,
    name: req.body.name !== undefined ? req.body.name : current.name,
    category: req.body.category !== undefined ? req.body.category : current.category,
    description: req.body.description !== undefined ? req.body.description : current.description,
    price: req.body.price !== undefined ? parseFloat(req.body.price) : current.price,
    image: req.body.image !== undefined ? req.body.image : current.image,
    available: req.body.available !== undefined ? req.body.available : current.available,
    isFeatured: req.body.isFeatured !== undefined ? req.body.isFeatured : current.isFeatured,
    stock: req.body.stock !== undefined ? parseInt(req.body.stock) : (current.stock !== undefined ? current.stock : 40)
  };
  saveToDatabase();
  res.json(products[index]);
});

// DELETE Product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  products = products.filter(p => p.id !== id);
  saveToDatabase();
  res.json({ success: true });
});

// GET Ingredients catalog
app.get("/api/ingredients", (req, res) => {
  res.json(ingredients);
});

// POST Create new raw ingredient
app.post("/api/ingredients", (req, res) => {
  const { name, stock, unit, minThreshold } = req.body;
  if (!name || stock === undefined || !unit || minThreshold === undefined) {
    return res.status(400).json({ error: "Missing required ingredient fields" });
  }
  const newIng = {
    id: "ING-" + Math.floor(100 + Math.random() * 900),
    name: name.trim(),
    stock: parseFloat(stock) || 0,
    unit: unit.trim(),
    minThreshold: parseFloat(minThreshold) || 0
  };
  ingredients.push(newIng);
  saveToDatabase();
  res.json(newIng);
});

// DELETE raw ingredient reference
app.delete("/api/ingredients/:id", (req, res) => {
  const { id } = req.params;
  const index = ingredients.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Ingredient not found" });
  }
  const deleted = ingredients.splice(index, 1)[0];
  saveToDatabase();
  res.json(deleted);
});

// PUT Update raw ingredient stock
app.put("/api/ingredients/:id", (req, res) => {
  const { id } = req.params;
  const { stock, minThreshold } = req.body;
  const index = ingredients.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Ingredient not found" });
  }
  if (stock !== undefined) ingredients[index].stock = parseFloat(stock);
  if (minThreshold !== undefined) ingredients[index].minThreshold = parseFloat(minThreshold);
  saveToDatabase();
  res.json(ingredients[index]);
});

// GET Orders queue
app.get("/api/orders", (req, res) => {
  res.json(orders);
});

// POST Place New Pre-Order
app.post("/api/orders", (req, res) => {
  const { customerName, email, phone, items, deliveryOption, date, total, specialRequests, paymentReference, paymentChannel, deliveryAddress, landmark } = req.body;
  if (!customerName || !email || !items || !items.length) {
    return res.status(400).json({ error: "Incomplete pre-order details." });
  }

  // Deduct finished stock levels
  items.forEach((item: any) => {
    const prod = products.find((p) => p.id === item.productId);
    if (prod && prod.stock !== undefined) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
      if (prod.stock === 0) {
        prod.available = false; // auto mark sold out
      }
    }
  });

  // Calibrate nextOrderIdSeq dynamically based on the current highest ID in memory
  let maxId = 2;
  orders.forEach((o) => {
    const num = parseInt(o.id, 10);
    if (!isNaN(num) && num > maxId) {
      maxId = num;
    }
  });
  nextOrderIdSeq = maxId + 1;
  const sequentialId = String(nextOrderIdSeq).padStart(3, '0');
  nextOrderIdSeq += 1;

  const newOrder = {
    id: sequentialId,
    customerName,
    email,
    phone: phone || '',
    items,
    deliveryOption: deliveryOption || 'Pickup',
    date: date || new Date().toISOString().split('T')[0],
    status: 'Pending' as const,
    total: parseFloat(total) || 0,
    specialRequests: specialRequests || '',
    paymentReference: paymentReference || '',
    paymentChannel: paymentChannel || 'GCash',
    deliveryAddress: deliveryAddress || '',
    landmark: landmark || ''
  };
  orders = [newOrder, ...orders];
  saveToDatabase();
  res.status(201).json(newOrder);
});

interface SimulatedEmail {
  id: string;
  orderId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'Baking' | 'Ready';
}

let simulatedEmails: SimulatedEmail[] = [
  {
    id: "EML-109283",
    orderId: "001",
    recipientEmail: "marcus@philosophy.org",
    recipientName: "Marcus Aurelius",
    subject: "🧁 Cooking in Progress: Order #001 is in the Brick Oven!",
    body: "Dear Marcus Aurelius,\n\nWe are absolutely thrilled to inform you that your bakery reservation (Order ID: #001) has officially transitioned to the baking room!\n\nChef Camille and the team are handcrafting your delicious crinkles/pastries right now. We use only premium Dutch cocoa, real dark chocolate cores, and standard rich mountain pasture-raised butter. Your order is being baked soft, chewy, and not too sweet just the way you love it.\n\nOrder Details:\n- Items: Classic Fudge Powdered Crinkles (x1), Brioche Velvet Loaf (x1)\n- Scheduled Delivery/Pickup Date: 2026-05-22\n- Special Chef Requests: Please label containing gluten details\n\nYou can track the live baking temperature and logistics state via our online Track Orders page when logged into your Loyalty Customer account.\n\nWarmest regards,\nCamille Sumaya Marasigan\nFounder & Master Baker, Zoe's Bake My Dream",
    timestamp: new Date(Date.now() - 3600000 * 4).toLocaleString(),
    status: "Baking"
  }
];

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  inspirationImage?: string;
  read?: boolean;
}

let inquiries: Inquiry[] = [
  {
    id: "INQ-001",
    name: "Eleanor Vance",
    email: "eleanor@gmail.com",
    message: "Hi Camille! Do you do custom tier-wedding cakes for September? We would love a custom brioche cake base with lavender cream.",
    date: "2026-05-25"
  },
  {
    id: "INQ-002",
    name: "Arthur Pendragon",
    email: "arthur@camelot.co",
    message: "Greetings, I wanted to inquire about bulk pastry discounts for an office catering layout. Around 50 savory rolls, please.",
    date: "2026-05-26"
  }
];

function sendSimulatedStatusEmail(order: any, targetStatus: 'Baking' | 'Ready') {
  const emailId = 'EML-' + Math.floor(100000 + Math.random() * 900000);
  const timestamp = new Date().toLocaleString();
  
  let subject = "";
  let body = "";
  
  const formattedItems = order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(", ");
  
  if (targetStatus === 'Baking') {
    subject = `🧁 Cooking in Progress: Order #${order.id} is in the Brick Oven!`;
    body = `Dear ${order.customerName || 'Loyal Client'},\n\n` +
           `We are absolutely thrilled to inform you that your bakery reservation (Order ID: #${order.id}) has officially transitioned to the baking room!\n\n` +
           `Chef Camille and the team are handcrafting your delicious crinkles and treats right now. We use only premium rich cocoa, real dark chocolate cores, and high-fat butter. Your order is being baked soft, chewy, and not too sweet just the way you love it.\n\n` +
           `Order Details:\n` +
           `- Items: ${formattedItems}\n` +
           `- Scheduled Date: ${order.date || 'Today'}\n` +
           `- Special Chef Requests: ${order.specialRequests || 'None'}\n\n` +
           `You can track the live baking temperature and logistics state via our online Track Orders page when logged into your Loyalty Customer account.\n\n` +
           `Warmest regards,\n` +
           `Zoe's Bake My Dream Team\n` +
           `Handcrafted with Love & Passion`;
  } else if (targetStatus === 'Ready') {
    subject = `✨ Freshly Baked & Boxed: Order #${order.id} is Ready!`;
    body = `Dear ${order.customerName || 'Loyal Client'},\n\n` +
           `Fantastic news! Your lovely, freshly dusted crinkles (Order ID: #${order.id}) are officially out of the brick oven and have been hand-wrapped!\n\n` +
           `Your products have been packaged inside our beautiful 100% biodegradable and recyclable boxes, fully dusted with sweet snowy powdered sugar to seal in that perfect soft core crumb.\n\n` +
           `Fulfillment Coordinates:\n` +
           `- Selected Mode: ${order.deliveryOption || 'Pickup'}\n` +
           `- Items: ${formattedItems}\n` +
           `- Reservation Balance: Fully Paid (Reference: ${order.paymentReference || 'Pre-Verified'})\n\n` +
           `Please proceed to our bakery suite at Bay, Laguna, or anticipate logistics delivery per your scheduled timeline on ${order.date || 'Today'}.\n\n` +
           `Thank you for trusting Zoe's Bake My Dream for your cozy gatherings!\n\n` +
           `With love and passion,\n` +
           `Zoe's Bake My Dream Team`;
  }
  
  const emailRecordCode: SimulatedEmail = {
    id: emailId,
    orderId: order.id,
    recipientEmail: order.email || 'customer@example.com',
    recipientName: order.customerName || 'Loyal Client',
    subject,
    body,
    timestamp,
    status: targetStatus
  };
  
  simulatedEmails.unshift(emailRecordCode);
  console.log(`[Email Simulation Service] Simulated automated email sent successfully! ID: ${emailId}, Recipient: ${order.email}`);
}

// PUT Recalculate/Update General Order details
app.put("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const { items, deliveryFee } = req.body;
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = orders[index];
  
  if (items !== undefined) {
    order.items = items;
  }
  
  if (deliveryFee !== undefined) {
    order.deliveryFee = parseFloat(deliveryFee) || 0;
  }

  // Recalculate grand total based on items and delivery fee (including 5% eco packaging fee)
  const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  order.total = (itemsTotal * 1.05) + (order.deliveryFee || 0);

  saveToDatabase();
  res.json(order);
});

// DELETE Order permanently
app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }
  const deletedOrder = orders.splice(index, 1)[0];
  saveToDatabase();
  res.json({ success: true, message: `Order ${id} removed successfully`, deletedOrder });
});

// PUT Update Order fulfillment status
app.put("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const prevStatus = orders[index].status;
  orders[index].status = status;

  // Deduct raw ingredients if transitioning to 'Baking'
  if (status === 'Baking' && prevStatus !== 'Baking') {
    orders[index].items.forEach((item) => {
      const recipe = recipes[item.productId];
      if (recipe) {
        recipe.forEach((ingredientRatio) => {
          const ingObj = ingredients.find(i => i.name === ingredientRatio.name);
          if (ingObj) {
            ingObj.stock = Math.max(0, parseFloat((ingObj.stock - (ingredientRatio.amount * item.quantity)).toFixed(2)));
          }
        });
      }
    });
  }

  // Simulate automated confirmation emails when transitioning to 'Baking' or 'Ready'
  if ((status === 'Baking' || status === 'Ready') && prevStatus !== status) {
    sendSimulatedStatusEmail(orders[index], status);
  }

  saveToDatabase();
  res.json(orders[index]);
});

// GET Simulated Email list
app.get("/api/emails", (req, res) => {
  res.json(simulatedEmails);
});

// GET inquiries list for admin
app.get("/api/inquiries", (req, res) => {
  res.json(inquiries);
});

// POST submit a new inquiry
app.post("/api/inquiries", (req, res) => {
  const { name, email, message, inspirationImage } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required inquiry fields" });
  }

  const newInquiry = {
    id: 'INQ-' + Math.floor(100 + Math.random() * 900),
    name,
    email,
    message,
    inspirationImage: inspirationImage || "",
    read: false,
    date: new Date().toISOString().split('T')[0]
  };

  inquiries.unshift(newInquiry);
  saveToDatabase();
  res.json(newInquiry);
});

// PUT mark inquiry as read
app.put("/api/inquiries/:id/read", (req, res) => {
  const { id } = req.params;
  const inq = inquiries.find(i => i.id === id);
  if (inq) {
    inq.read = true;
    saveToDatabase();
    return res.json({ success: true, inquiry: inq });
  }
  res.status(404).json({ error: "Inquiry not found" });
});

// GET Custom Merchant/Owner Payment QR
app.get("/api/payment/qr", (req, res) => {
  res.json({ qrImage: merchantQrImage });
});

// POST Upload custom Merchant/Owner Payment QR
app.post("/api/payment/qr", (req, res) => {
  const { qrImage } = req.body;
  merchantQrImage = qrImage || "";
  saveToDatabase();
  res.json({ success: true, qrImage: merchantQrImage });
});

// GET website logo
app.get("/api/website/logo", (req, res) => {
  res.json({ logoImage: merchantLogoImage });
});

// POST Upload custom website logo
app.post("/api/website/logo", (req, res) => {
  const { logoImage } = req.body;
  merchantLogoImage = logoImage || "";
  saveToDatabase();
  res.json({ success: true, logoImage: merchantLogoImage });
});

// GET Editorial contents
app.get("/api/website", (req, res) => {
  res.json({
    story,
    address,
    profile,
    promotion,
    testimonials
  });
});

// PUT Update Website editorials/promos/meta
app.put("/api/website", (req, res) => {
  const { updatedStory, updatedAddress, updatedProfile, updatedPromotion, updatedTestimonials } = req.body;
  if (updatedStory) story = { ...story, ...updatedStory };
  if (updatedAddress) address = { ...address, ...updatedAddress };
  if (updatedProfile) profile = { ...profile, ...updatedProfile };
  if (updatedPromotion) promotion = { ...promotion, ...updatedPromotion };
  if (updatedTestimonials) testimonials = updatedTestimonials;
  saveToDatabase();
  res.json({ success: true, story, address, profile, promotion, testimonials });
});

// POST Create new customer testimonial / feedback review
app.post("/api/testimonials", (req, res) => {
  const { name, rating, text, role } = req.body;
  if (!name || !text || rating === undefined) {
    return res.status(400).json({ error: "Missing required review fields (name, rating, text)" });
  }
  const newTestimonial = {
    id: "REF-" + Math.floor(1000 + Math.random() * 9000),
    name: name.trim(),
    rating: parseInt(rating) || 5,
    text: text.trim(),
    role: (role || "Verified Sweet Patron").trim(),
    image: `https://images.unsplash.com/photo-${[
      "1534528741775-53994a69daeb",
      "1507003211169-0a1dd7228f2d",
      "1494790108377-be9c29b29330",
      "1500648767791-00dcc994a43e",
      "1544005313-94ddf0286df2"
    ][Math.floor(Math.random() * 5)]}?auto=format&fit=crop&w=120&q=80`
  };
  testimonials.unshift(newTestimonial);
  saveToDatabase();
  res.json({ success: true, testimonials, newTestimonial });
});

// POST Gemini AI Cake Customizer & Advisor Proxy API
app.post("/api/ai/customize-cake", async (req, res) => {
  const { occasion, preferences, layers, customText } = req.body;
  
  if (!occasion) {
    return res.status(400).json({ error: "Occasion prompt is required." });
  }

  const prompt = `Occasion: ${occasion}
Preferences/Flavors: ${preferences || "No specific limit"}
Amount of layers requested: ${layers || "Single tier"}
Custom text label/greeting requested: ${customText || "None"}

As a seasoned French master chocolatier and pastry advisor named Camille, design a custom high-end artisanal cake or dessert suited for this prompt.
Think deeply about the texture layers, decorative motifs, flavor compatibility (using organic fresh ingredients), and aesthetic presentation.

Provide your response in a strict raw JSON format using these exact keys:
{
  "name": "An elegant evocative gourmet title for the custom cake",
  "category": "Cakes",
  "recommendedPrice": A realistic premium recommended pricing float in Philippine Peso (e.g. 1200.00, 1500.00, 1800.00 depending on tiers/layers),
  "culinaryStory": "A detailed 2-3 sentence evocative menu description summarizing the taste profile, decoration, and inspiration of this recipe",
  "ingredientsList": ["An array of premium ingredients relevant to the cake"],
  "bakingTips": ["An array of 2 professional tips from Camille on how to best slice, store, or enjoy this specific masterpiece"]
}`;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Return creative fallback if key is missing so application remains resilient
      const simulatedResponses = [
        {
          name: `${occasion} Sovereign Velvet Gâteau`,
          category: "Cakes",
          recommendedPrice: 1800.00,
          culinaryStory: `Hand-piped artisanal masterpiece customized for your ${occasion}. Expresses intense raspberry compote embedded in Swiss dark chocolate ganache, draped in elegant, gold-brushed chocolate velvet curls.`,
          ingredientsList: ["French AOP Butter", "Madagascar Bourbon Vanilla", "70% Cocoa Velvet Chunks", "Fresh Organic Raspberries", "Edible 24k Gold Flakes"],
          bakingTips: ["Serve slightly below room temperature to allow the rich velvet base texturing to soften.", "Utilize a dry heated bread knife for clean, glossy master cuts."]
        },
        {
          name: `${occasion} Botanical Dream Cake`,
          category: "Cakes",
          recommendedPrice: 1400.00,
          culinaryStory: `A delicate citrus lemon meringue recipe crafted for ${occasion}. Layers of light genoise sponge soaked in elderflower liqueur syrup and crowned with meticulously toasted, cloud-like Italian meringue peaks.`,
          ingredientsList: ["Unbleached Organic Wheat Flour", "Fresh Eureka Lemon Curd", "Elderflower Extract", "Free-range Egg White peaks", "Candied Jasmine buds"],
          bakingTips: ["Keep refrigerated until exactly 15 minutes before serving.", "Cutter tip: wet the slicing tool with warm water to prevent the light toasted meringue from sticking."]
        }
      ];
      const selected = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
      return res.json(selected);
    }

    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Camille, a passionate, elite French Master Pastry Artist. You speak cordially with design authority.",
        responseMimeType: "application/json",
        temperature: 1.0,
      }
    });

    const textOutput = result.text;
    if (!textOutput) {
      throw new Error("No response string produced by Gemini API.");
    }
    const sanitizedText = textOutput.trim();
    const parsedData = JSON.parse(sanitizedText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini AI Customizer Error:", error);
    // Send safe recovery fallback
    res.status(500).json({
      error: "Gemini server response failed. Brioche rising in fallback state instead.",
      name: `Artisan ${occasion} Golden Chiffon`,
      category: "Cakes",
      recommendedPrice: 1500.00,
      culinaryStory: `Our head chef's exquisite custom recipe formulated with light pasture-raised eggs, airy sponge tarts, and Madagascar vanilla buttercream details.`,
      ingredientsList: ["Pasture-raised Eggs", "Madagascar Vanilla Pods", "Filtered Spring Yeast", "Sweet Buttercream Frosting"],
      bakingTips: ["Keep tightly sealed in a cool box to maintain crumb moisture."]
    });
  }
});

// Setup Vite Dev Server / Static Assets Server Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Bake My Dream] Fullstack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
