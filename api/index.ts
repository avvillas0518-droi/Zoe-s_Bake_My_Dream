import express from "express";
import { GoogleGenAI } from "@google/genai";
import dns from "dns";
import defaultProducts from "../src/default_products.json";
import pg from "pg";

// Fix Node local dns lookup behavior
dns.setDefaultResultOrder("ipv4first");

const app = express();

// Allow generous body limits for base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// PostgreSQL pool for persistent storage
const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : null;

if (!pool) {
  console.warn("⚠️ DATABASE_URL not set. Data will not persist across restarts.");
}

// Lazy initializer for Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
  }
  return aiClient;
}

// In-Memory Store
let products: any[] = [...defaultProducts];

let ingredients = [
  { id: "ing-1", name: "French AOP Butter", stock: 124.5, unit: "kg", minThreshold: 20 },
  { id: "ing-2", name: "Madagascar Bourbon Vanilla Pods", stock: 85, unit: "pcs", minThreshold: 10 },
  { id: "ing-3", name: "Organic Wheat Flour", stock: 350.0, unit: "kg", minThreshold: 50 },
  { id: "ing-4", name: "Free-range Eggs", stock: 620, unit: "pcs", minThreshold: 100 },
  { id: "ing-5", name: "Premium Cocoa Powder", stock: 45.0, unit: "kg", minThreshold: 10 },
  { id: "ing-6", name: "Organic Raspberries", stock: 12.0, unit: "kg", minThreshold: 5 },
  { id: "ing-7", name: "Brioche French Yeast Starter", stock: 15.0, unit: "liters", minThreshold: 2 },
  { id: "ing-8", name: "70% Dark Cocoa Chunks", stock: 60.0, unit: "kg", minThreshold: 15 },
  { id: "ing-9", name: "Caster Sugar", stock: 180.0, unit: "kg", minThreshold: 30 }
];

const recipes: Record<string, { name: string; amount: number; unit: string }[]> = {
  "prod-1": [
    { name: "French AOP Butter", amount: 0.05, unit: "kg" },
    { name: "Organic Wheat Flour", amount: 0.08, unit: "kg" },
    { name: "Free-range Eggs", amount: 0.1, unit: "pcs" },
    { name: "70% Dark Cocoa Chunks", amount: 0.05, unit: "kg" },
    { name: "Caster Sugar", amount: 0.04, unit: "kg" }
  ],
  "prod-4": [
    { name: "French AOP Butter", amount: 0.25, unit: "kg" },
    { name: "Organic Wheat Flour", amount: 0.35, unit: "kg" },
    { name: "Free-range Eggs", amount: 3.0, unit: "pcs" },
    { name: "Premium Cocoa Powder", amount: 0.15, unit: "kg" },
    { name: "70% Dark Cocoa Chunks", amount: 0.20, unit: "kg" },
    { name: "Caster Sugar", amount: 0.25, unit: "kg" }
  ],
  "prod-5": [
    { name: "Organic Wheat Flour", amount: 0.45, unit: "kg" },
    { name: "French Brioche Yeast Starter", amount: 0.1, unit: "liters" }
  ]
};

let testimonials = [
  { id: "t-1", name: "Gurl Friend", rating: 5, text: "Masarap gurl hindi matamis haha", role: "Verified Buyer", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "t-2", name: "Choco Fanatic", rating: 5, text: "Gustong gusto ko yung pagka chewy nung chocolate", role: "Loyal Customer", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "t-3", name: "Crinkle Connoisseur", rating: 5, text: "Welcome...ang sarap ng crinkles... Hindi matamis.. At yung isa.. Sakto lang medyo mapait.. Para sa mga diabetic 😆", role: "Loyal Patron", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80" },
  { id: "t-4", name: "Kylie Alvis", rating: 5, text: "mukhang mapapa ulit po hahahaa", role: "Happy Customer", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80" }
];

let promotion = {
  title: "Weekend Special Combo Offer!",
  description: "Buy 2 Premium Chunk Cookies, Get 1 artisanal Brioche loaf at 50% discount!",
  code: "COOKIECOMBODEAL",
  endDate: new Date(Date.now() + 86400000 * 2.5).toISOString()
};

let orders: any[] = [
  {
    id: "001",
    customerName: "Marcus Aurelius",
    email: "marcus@philosophy.org",
    phone: "+1 555-1234",
    items: [{ productId: "prod-1", name: "Gourmet Chunk Cookies", price: 150.00, quantity: 4 }],
    deliveryOption: "Delivery",
    date: "2026-05-22",
    status: "Pending",
    total: 630.00,
    specialRequests: "Please label containing gluten details",
    paymentReference: "GC052281920A",
    paymentChannel: "GCash"
  },
  {
    id: "002",
    customerName: "Gwendolyn Brooks",
    email: "gwen@poetry.com",
    phone: "+1 555-8899",
    items: [
      { productId: "prod-1", name: "Gourmet Chunk Cookies", price: 150.00, quantity: 3 },
      { productId: "prod-5", name: "Artisanal Brioche Loaf", price: 280.00, quantity: 2 }
    ],
    deliveryOption: "Pickup",
    date: "2026-05-21",
    status: "Baking",
    total: 1060.00,
    specialRequests: "Will pick up precisely at 9:00 AM!"
  }
];

let nextOrderIdSeq = 3;

let story = {
  title: "Zoe's Bake My Dream",
  tagline: "Our Brioche & Crinkle Journey Since July 2020",
  mainText: `Zoe's Bake My Dream started baking on July 11, 2020. It began as a part-time venture while I was a student during the pandemic, aiming to build my own business through the help of a scholarship. At first, it was only meant to be a hobby, but over time, orders started coming in along with positive feedback. Customers loved that the products were not too sweet and had a delicious taste. Zoe's Bake My Dream started as a home-based baking business where a dream began.`,
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

let merchantQrImage = "";
let merchantLogoImage = "";

interface SimulatedEmail {
  id: string;
  orderId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  timestamp: string;
  status: "Baking" | "Ready";
}

let simulatedEmails: SimulatedEmail[] = [
  {
    id: "EML-109283",
    orderId: "001",
    recipientEmail: "marcus@philosophy.org",
    recipientName: "Marcus Aurelius",
    subject: "🧁 Cooking in Progress: Order #001 is in the Brick Oven!",
    body: "Dear Marcus Aurelius,\n\nYour order #001 is now being baked!\n\nWarmest regards,\nZoe's Bake My Dream Team",
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
  { id: "INQ-001", name: "Eleanor Vance", email: "eleanor@gmail.com", message: "Hi Camille! Do you do custom tier-wedding cakes for September? We would love a custom brioche cake base with lavender cream.", date: "2026-05-25" },
  { id: "INQ-002", name: "Arthur Pendragon", email: "arthur@camelot.co", message: "Greetings, I wanted to inquire about bulk pastry discounts for an office catering layout. Around 50 savory rolls, please.", date: "2026-05-26" }
];

// --- PostgreSQL Persistence ---
async function collectState() {
  return { products, ingredients, orders, story, address, profile, promotion, testimonials, simulatedEmails, inquiries, merchantQrImage, merchantLogoImage, nextOrderIdSeq };
}

async function loadFromDatabase() {
  if (!pool) return;
  try {
    const result = await pool.query("SELECT data FROM app_state WHERE id = 1");
    if (result.rows.length === 0) return;
    const state = result.rows[0].data;
    if (!state) return;
    if (state.products) products = state.products;
    if (state.ingredients) ingredients = state.ingredients;
    if (state.orders) orders = state.orders;
    if (state.story) story = state.story;
    if (state.address) address = state.address;
    if (state.profile) profile = state.profile;
    if (state.promotion) promotion = state.promotion;
    if (state.testimonials) testimonials = state.testimonials;
    if (state.simulatedEmails) simulatedEmails = state.simulatedEmails;
    if (state.inquiries !== undefined) inquiries = state.inquiries;
    if (state.merchantQrImage !== undefined) merchantQrImage = state.merchantQrImage;
    if (state.merchantLogoImage !== undefined) merchantLogoImage = state.merchantLogoImage;
    if (state.nextOrderIdSeq !== undefined) nextOrderIdSeq = state.nextOrderIdSeq;
    console.log("✅ Loaded state from PostgreSQL.");
  } catch (error) {
    console.error("PostgreSQL load failed:", error);
  }
}

async function saveToDatabase() {
  if (!pool) return;
  try {
    const state = await collectState();
    await pool.query(
      "INSERT INTO app_state (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $3, updated_at = NOW()",
      [1, state, state]
    );
  } catch (error) {
    console.error("PostgreSQL save failed:", error);
  }
}

// Initialize DB on cold start
(async () => { await loadFromDatabase(); })();

function sendSimulatedStatusEmail(order: any, targetStatus: "Baking" | "Ready") {
  const emailId = "EML-" + Math.floor(100000 + Math.random() * 900000);
  const formattedItems = order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(", ");
  let subject = "";
  let body = "";
  if (targetStatus === "Baking") {
    subject = `🧁 Cooking in Progress: Order #${order.id} is in the Brick Oven!`;
    body = `Dear ${order.customerName},\n\nYour order #${order.id} is now being baked!\nItems: ${formattedItems}\n\nWarmest regards,\nZoe's Bake My Dream Team`;
  } else {
    subject = `✨ Freshly Baked & Boxed: Order #${order.id} is Ready!`;
    body = `Dear ${order.customerName},\n\nYour order #${order.id} is ready!\nItems: ${formattedItems}\n\nWith love,\nZoe's Bake My Dream Team`;
  }
  simulatedEmails.unshift({ id: emailId, orderId: order.id, recipientEmail: order.email || "customer@example.com", recipientName: order.customerName, subject, body, timestamp: new Date().toLocaleString(), status: targetStatus });
}

// --- API ROUTES ---

app.get("/api/products", async (_req, res) => {
  try { if (pool) await loadFromDatabase(); res.json(products); } catch { res.json(products); }
});
app.post("/api/products", async (req, res) => {
  const { name, category, description, price, image, available, isFeatured, stock } = req.body;
  if (!name || isNaN(price)) return res.status(400).json({ error: "Invalid product parameters." });
  const newProduct = { id: `prod-${Date.now()}`, name, category, description: description || "Delicately handcrafted artisan pastry.", price: parseFloat(price), image: image || "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80", available: available !== undefined ? available : true, isFeatured: isFeatured !== undefined ? isFeatured : false, stock: stock !== undefined ? parseInt(stock) : 40 };
  products = [newProduct, ...products];
  await saveToDatabase();
  res.status(201).json(newProduct);
});
app.put("/api/products/:id", async (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  const current = products[index];
  products[index] = { ...current, ...Object.fromEntries(Object.entries(req.body).filter(([, v]) => v !== undefined)) };
  if (req.body.price !== undefined) products[index].price = parseFloat(req.body.price);
  if (req.body.stock !== undefined) products[index].stock = parseInt(req.body.stock);
  await saveToDatabase();
  res.json(products[index]);
});
app.delete("/api/products/:id", async (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  await saveToDatabase();
  res.json({ success: true });
});

app.get("/api/ingredients", async (_req, res) => {
  try { if (pool) await loadFromDatabase(); res.json(ingredients); } catch { res.json(ingredients); }
});
app.post("/api/ingredients", async (req, res) => {
  const { name, stock, unit, minThreshold } = req.body;
  if (!name || stock === undefined || !unit || minThreshold === undefined) return res.status(400).json({ error: "Missing required ingredient fields" });
  const newIng = { id: "ING-" + Math.floor(100 + Math.random() * 900), name: name.trim(), stock: parseFloat(stock) || 0, unit: unit.trim(), minThreshold: parseFloat(minThreshold) || 0 };
  ingredients.push(newIng);
  await saveToDatabase();
  res.json(newIng);
});
app.put("/api/ingredients/:id", async (req, res) => {
  const index = ingredients.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Ingredient not found" });
  if (req.body.stock !== undefined) ingredients[index].stock = parseFloat(req.body.stock);
  if (req.body.minThreshold !== undefined) ingredients[index].minThreshold = parseFloat(req.body.minThreshold);
  await saveToDatabase();
  res.json(ingredients[index]);
});
app.delete("/api/ingredients/:id", async (req, res) => {
  const index = ingredients.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Ingredient not found" });
  const deleted = ingredients.splice(index, 1)[0];
  await saveToDatabase();
  res.json(deleted);
});

app.get("/api/orders", async (_req, res) => {
  try { if (pool) await loadFromDatabase(); res.json(orders); } catch { res.json(orders); }
});
app.post("/api/orders", async (req, res) => {
  const { customerName, email, phone, items, deliveryOption, date, total, specialRequests, paymentReference, paymentChannel, deliveryAddress, landmark } = req.body;
  if (!customerName || !email || !items || !items.length) return res.status(400).json({ error: "Incomplete pre-order details." });
  items.forEach((item: any) => {
    const prod = products.find((p) => p.id === item.productId);
    if (prod && prod.stock !== undefined) { prod.stock = Math.max(0, prod.stock - item.quantity); if (prod.stock === 0) prod.available = false; }
  });
  let maxId = 2;
  orders.forEach((o) => { const num = parseInt(o.id, 10); if (!isNaN(num) && num > maxId) maxId = num; });
  nextOrderIdSeq = maxId + 1;
  const sequentialId = String(nextOrderIdSeq).padStart(3, "0");
  nextOrderIdSeq += 1;
  const newOrder = { id: sequentialId, customerName, email, phone: phone || "", items, deliveryOption: deliveryOption || "Pickup", date: date || new Date().toISOString().split("T")[0], status: "Pending", total: parseFloat(total) || 0, specialRequests: specialRequests || "", paymentReference: paymentReference || "", paymentChannel: paymentChannel || "GCash", deliveryAddress: deliveryAddress || "", landmark: landmark || "" };
  orders = [newOrder, ...orders];
  await saveToDatabase();
  res.status(201).json(newOrder);
});
app.put("/api/orders/:id", async (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Order not found" });
  const order = orders[index];
  if (req.body.items !== undefined) order.items = req.body.items;
  if (req.body.deliveryFee !== undefined) order.deliveryFee = parseFloat(req.body.deliveryFee) || 0;
  const itemsTotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  order.total = (itemsTotal * 1.05) + (order.deliveryFee || 0);
  await saveToDatabase();
  res.json(order);
});
app.put("/api/orders/:id/status", async (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Order not found" });
  const prevStatus = orders[index].status;
  orders[index].status = req.body.status;
  if (req.body.status === "Baking" && prevStatus !== "Baking") {
    orders[index].items.forEach((item: any) => {
      const recipe = recipes[item.productId];
      if (recipe) recipe.forEach((r) => { const ing = ingredients.find(i => i.name === r.name); if (ing) ing.stock = Math.max(0, parseFloat((ing.stock - r.amount * item.quantity).toFixed(2))); });
    });
  }
  if ((req.body.status === "Baking" || req.body.status === "Ready") && prevStatus !== req.body.status) sendSimulatedStatusEmail(orders[index], req.body.status);
  await saveToDatabase();
  res.json(orders[index]);
});
app.delete("/api/orders/:id", async (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Order not found" });
  const deletedOrder = orders.splice(index, 1)[0];
  await saveToDatabase();
  res.json({ success: true, deletedOrder });
});

app.get("/api/emails", async (_req, res) => {
  try { if (pool) await loadFromDatabase(); res.json(simulatedEmails); } catch { res.json(simulatedEmails); }
});

app.get("/api/inquiries", async (_req, res) => {
  try { if (pool) await loadFromDatabase(); res.json(inquiries); } catch { res.json(inquiries); }
});
app.post("/api/inquiries", async (req, res) => {
  const { name, email, message, inspirationImage } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: "Missing required inquiry fields" });
  const newInquiry = { id: "INQ-" + Math.floor(100 + Math.random() * 900), name, email, message, inspirationImage: inspirationImage || "", read: false, date: new Date().toISOString().split("T")[0] };
  inquiries.unshift(newInquiry);
  await saveToDatabase();
  res.json(newInquiry);
});
app.put("/api/inquiries/:id/read", async (req, res) => {
  const inq = inquiries.find(i => i.id === req.params.id);
  if (inq) { inq.read = true; await saveToDatabase(); return res.json({ success: true, inquiry: inq }); }
  res.status(404).json({ error: "Inquiry not found" });
});

app.get("/api/payment/qr", async (_req, res) => {
  try { if (pool) await loadFromDatabase(); res.json({ qrImage: merchantQrImage }); } catch { res.json({ qrImage: merchantQrImage }); }
});
app.post("/api/payment/qr", async (req, res) => {
  merchantQrImage = req.body.qrImage || "";
  await saveToDatabase();
  res.json({ success: true, qrImage: merchantQrImage });
});

app.get("/api/website/logo", async (_req, res) => {
  try { if (pool) await loadFromDatabase(); res.json({ logoImage: merchantLogoImage }); } catch { res.json({ logoImage: merchantLogoImage }); }
});
app.post("/api/website/logo", async (req, res) => {
  merchantLogoImage = req.body.logoImage || "";
  await saveToDatabase();
  res.json({ success: true, logoImage: merchantLogoImage });
});

app.get("/api/website", async (_req, res) => {
  try { if (pool) await loadFromDatabase(); res.json({ story, address, profile, promotion, testimonials }); } catch { res.json({ story, address, profile, promotion, testimonials }); }
});
app.put("/api/website", async (req, res) => {
  const { updatedStory, updatedAddress, updatedProfile, updatedPromotion, updatedTestimonials } = req.body;
  if (updatedStory) story = { ...story, ...updatedStory };
  if (updatedAddress) address = { ...address, ...updatedAddress };
  if (updatedProfile) profile = { ...profile, ...updatedProfile };
  if (updatedPromotion) promotion = { ...promotion, ...updatedPromotion };
  if (updatedTestimonials) testimonials = updatedTestimonials;
  await saveToDatabase();
  res.json({ success: true, story, address, profile, promotion, testimonials });
});

app.post("/api/testimonials", async (req, res) => {
  const { name, rating, text, role } = req.body;
  if (!name || !text || rating === undefined) return res.status(400).json({ error: "Missing required review fields" });
  const newTestimonial = { id: "REF-" + Math.floor(1000 + Math.random() * 9000), name: name.trim(), rating: parseInt(rating) || 5, text: text.trim(), role: (role || "Verified Sweet Patron").trim(), image: `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80` };
  testimonials.unshift(newTestimonial);
  await saveToDatabase();
  res.json({ success: true, testimonials, newTestimonial });
});

app.post("/api/ai/customize-cake", async (req, res) => {
  const { occasion, preferences, layers, customText } = req.body;
  if (!occasion) return res.status(400).json({ error: "Occasion prompt is required." });
  const prompt = `Occasion: ${occasion}\nPreferences/Flavors: ${preferences || "No specific limit"}\nAmount of layers requested: ${layers || "Single tier"}\nCustom text label/greeting requested: ${customText || "None"}\n\nAs a seasoned French master chocolatier and pastry advisor named Camille, design a custom high-end artisanal cake or dessert suited for this prompt. Respond ONLY with valid JSON:\n{\n  "name": "elegant title",\n  "category": "Cakes",\n  "recommendedPrice": 1500.00,\n  "culinaryStory": "2-3 sentence description",\n  "ingredientsList": ["ingredient1","ingredient2"],\n  "bakingTips": ["tip1","tip2"]\n}`;
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({ name: `${occasion} Sovereign Velvet Gateau`, category: "Cakes", recommendedPrice: 1800.00, culinaryStory: `Artisanal masterpiece for your ${occasion}. Rich dark chocolate ganache with raspberry compote.`, ingredientsList: ["French AOP Butter", "Madagascar Bourbon Vanilla", "70% Cocoa Chunks", "Fresh Raspberries"], bakingTips: ["Serve slightly below room temperature.", "Use a warm dry knife for clean cuts."] });
    }
    const ai = getGeminiClient();
    const result = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt, config: { systemInstruction: "You are Camille, a passionate elite French Master Pastry Artist.", responseMimeType: "application/json", temperature: 1.0 } });
    const parsedData = JSON.parse((result.text || "").trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    res.status(500).json({ error: "AI service unavailable.", name: `Artisan ${occasion} Golden Chiffon`, category: "Cakes", recommendedPrice: 1500.00, culinaryStory: "Light pasture-raised eggs, airy sponge, and Madagascar vanilla buttercream.", ingredientsList: ["Pasture-raised Eggs", "Madagascar Vanilla Pods", "Sweet Buttercream"], bakingTips: ["Keep sealed in a cool box.", "Serve at room temperature."] });
  }
});

export default app;
