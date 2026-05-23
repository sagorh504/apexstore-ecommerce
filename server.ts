import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { 
  Product, 
  Category, 
  Order, 
  Coupon, 
  SystemSettings, 
  CustomPage, 
  Article, 
  SupportTicket 
} from "./src/types";

const app = express();
const PORT = 3000;

// Path for persistence
const DB_FILE = path.join(process.cwd(), "data_db.json");

// Structure of our DB
interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  orders: Order[];
  coupons: Coupon[];
  settings: SystemSettings;
  pages: CustomPage[];
  articles: Article[];
  supportTickets: SupportTicket[];
}

// Support simple Express body parsing
app.use(express.json());

// Initialize Gemini safely
let aiInstance: any = null;
function getAI() {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    try {
      aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
    }
  }
  return aiInstance;
}

// Initial/Seed Data
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "AeroPulse Hybrid Smartwatch",
    price: 3890,
    regularPrice: 4500,
    salePrice: 3890,
    sku: "AP-SM-001",
    brand: "AeroTech",
    stock: 45,
    category: "Gadgets",
    subCategory: "Smartwatches",
    images: ["https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=600&q=80"],
    description: "Experience the next level of tracking with the AeroPulse Hybrid Smartwatch. Features a crisp AMOLED multi-touch, 14-day persistent battery life, custom watch faces, and real-time medical-grade blood oxygen and sleep analytics. Water resistant up to 50M.",
    tags: ["smartwatch", "wearables", "fitness tracker", "amoled"],
    seoTitle: "AeroPulse Hybrid Smartwatch - Next-Gen Wearable Tracker",
    seoDescription: "Shop the AeroPulse Smartwatch on ApexStore. 14-day battery, blood oxygen monitoring, sleek hybrid design, and water resistance. Order now!",
    featured: true,
    rating: 4.8,
    reviews: [
      { id: "rev-1", userName: "Abrar Rahman", rating: 5, comment: "Incredible battery life! Highly recommended.", createdAt: "2026-05-20" },
      { id: "rev-2", userName: "Tahmid Islam", rating: 4, comment: "Crisp display, syncs seamlessly with Android. Premium strap material.", createdAt: "2026-05-21" }
    ]
  },
  {
    id: "prod-2",
    name: "Vertex Pro ANC Studio Headphones",
    price: 7200,
    regularPrice: 8990,
    salePrice: 7200,
    sku: "VX-HP-300",
    brand: "Vertex",
    stock: 12,
    category: "Gadgets",
    subCategory: "Audio",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"],
    description: "Tired of ambient noise disrupting your workstation? Vertex Pro ANC Studio Headphones features a state-of-the-art active noise cancelling chip, signature studio acoustics, ultra-breathable memory foam ear cushions, and 40 hours of continuous wireless playback. Lightweight and extremely durable.",
    tags: ["headphones", "anc", "wireless", "audio", "studio"],
    seoTitle: "Vertex Pro Wireless ANC Headphones - Rich Studio Sound",
    seoDescription: "Block ambient noise with Vertex Pro ANC Headphones. 40 hours wireless playback, leather-padded cushions, and premium bass frequency response.",
    featured: true,
    rating: 4.6,
    reviews: [
      { id: "rev-3", userName: "Farhan Masud", rating: 5, comment: "Active noise cancelling works like magic. Bass is clean and detailed.", createdAt: "2026-05-18" }
    ]
  },
  {
    id: "prod-3",
    name: "Apex KeySense RGB Mechanical Keyboard",
    price: 4900,
    regularPrice: 5500,
    salePrice: 4900,
    sku: "KS-KB-87",
    brand: "ApexMods",
    stock: 28,
    category: "Electronics",
    subCategory: "Computers",
    images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80"],
    description: "Increase typing speed and feedback with the tactile, hot-swappable yellow switches pre-lubed for signature premium clacks. Built on a weighted aircraft-grade aluminum top frame with independent per-key RGB backlighting and multi-profile dynamic macro recording support.",
    tags: ["keyboard", "mechanical", "rgb", "gaming", "hot-swap"],
    seoTitle: "Apex KeySense RGB Hot-Swappable Mechanical Keyboard",
    seoDescription: "Tactile pre-lubed typing excellence. Order the Apex KeySense 87-key RGB hot-swappable keyboard today. Low latency usb-c interface.",
    featured: true,
    rating: 4.9,
    reviews: [
      { id: "rev-4", userName: "Siam Al-Deen", rating: 5, comment: "Best switch sound out of the box. Keycaps look high end.", createdAt: "2026-05-22" }
    ]
  },
  {
    id: "prod-4",
    name: "Urban Essential Waterproof Hoodie",
    price: 1850,
    regularPrice: 2200,
    salePrice: 1850,
    sku: "UB-HD-W05",
    brand: "UrbanOutfit",
    stock: 80,
    category: "Fashion",
    subCategory: "Men's Wear",
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80"],
    description: "Stay ahead of urban downpours. The Urban Essential Hoodie utilizes advanced hydrophobic tech knitted directly into the premium heavy organic cotton. Soft micro-fleece interior lining keeps you cozy, while dual-direction front zippers and hidden internal cache pockets keep stuff dry.",
    tags: ["hoodie", "water-repellent", "fashion", "streetwear"],
    seoTitle: "Urban Essential Waterproof Hydrophobic Hoodie",
    seoDescription: "Hydrophobic heavy cotton hoodie. Cozy micro-fleece interior, water-repellent shell, and sleek streetwear layout. Free shipping inside Dhaka available.",
    featured: false,
    rating: 4.3,
    reviews: [
      { id: "rev-5", userName: "Nahid Hasan", rating: 4, comment: "Repels light drizzle perfectly, very thick and warm fabric.", createdAt: "2026-05-19" }
    ]
  },
  {
    id: "prod-5",
    name: "Slimline Minimalist Full Grain Wallet",
    price: 1200,
    regularPrice: 1600,
    salePrice: 1200,
    sku: "SL-WL-L09",
    brand: "Loom&Craft",
    stock: 140,
    category: "Accessories",
    subCategory: "Wallets",
    images: ["https://images.unsplash.com/photo-1627124765135-56c33fc36bfa?auto=format&fit=crop&w=600&q=80"],
    description: "Sculpted from premium tanned full-grain cowhide leather that ages into a deep, glossy patina over time. Comfortably accommodates up to 8 credit cards, custom ID window, cash strap, and features integrated dual RFID-blocking secure barriers.",
    tags: ["wallet", "leather", "minimalist", "rfid-block"],
    seoTitle: "Slimline Minimalist Full-Grain Leather RFID Wallet",
    seoDescription: "100% genuine oiled full-grain leather wallet with custom RFID protection. Thin profile design by Loom&Craft.",
    featured: false,
    rating: 4.5,
    reviews: [
      { id: "rev-6", userName: "Mehedi Joy", rating: 5, comment: "Exquisite stitching quality. Patina already starting to develop nicely.", createdAt: "2026-05-20" }
    ]
  },
  {
    id: "prod-6",
    name: "Smart Mist Living Room Humidifier",
    price: 2600,
    regularPrice: 3200,
    salePrice: 2600,
    sku: "SM-HM-3L",
    brand: "GlowMist",
    stock: 35,
    category: "Home Products",
    subCategory: "Living Room",
    images: ["https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=600&q=80"],
    description: "Regulate dry indoor air automatically. The GlowMist Smart Mist features a high capacity 3-liter dual-mist tank, ultra-quiet ultrasonic operation, automatic ambient relative humidity tracking, and an integrated aromatherapy drawer. App controlled.",
    tags: ["humidifier", "smarthome", "lifestyle", "essential oils"],
    seoTitle: "Smart Mist Ultrasonic 3L Humidifier & Diffuser",
    seoDescription: "Maintain healthy air in style. Ultrasonic 3L Humidifier featuring custom timer schedules and oil diffusion. Order now on ApexStore.",
    featured: true,
    rating: 4.4,
    reviews: []
  },
  {
    id: "prod-7",
    name: "BioSerum Clay Glow Mask",
    price: 1450,
    regularPrice: 1800,
    salePrice: 1450,
    sku: "BS-CM-100",
    brand: "Naturals",
    stock: 95,
    category: "Beauty Products",
    subCategory: "Skincare",
    images: ["https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80"],
    description: "Rejuvenate tired skin cells using volcanic mineral clay blended with cold-pressed rosehip seed oils and peptide complexes. Clarifies blocked pores, extracts excess sebum oils, and firms skin elasticity under 10 minutes.",
    tags: ["skincare", "mask", "organic", "clay", "beauty"],
    seoTitle: "BioSerum Volcanic Complex Clay Glow Mask",
    seoDescription: "Pore cleansing volcanic clay mask infused with rosehip oils. Natural formula for luminous face glow.",
    featured: false,
    rating: 4.7,
    reviews: []
  },
  {
    id: "prod-8",
    name: "Fictional Chronicles: Chronicles of Neon",
    price: 450,
    regularPrice: 600,
    salePrice: 450,
    sku: "BK-SF-309",
    brand: "NovaPress",
    stock: 50,
    category: "Books",
    subCategory: "Fiction",
    images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80"],
    description: "Unravel an exquisite cyberpunk future set in the neon-washed alleys of Dhaka 2099. A high-risk corporate thief stumbles upon a bio-encrypted neural drive holding files that can unlock unlimited energy or reset human consciousness.",
    tags: ["book", "sci-fi", "dhaka2099", "cyberpunk"],
    seoTitle: "Chronicles of Neon - Sci-Fi Cyberpunk Novel",
    seoDescription: "Read the spectacular futuristic thriller Chronicles of Neon set in corporate Dhaka of 2099. Paperback printed on top Swedish paper.",
    featured: false,
    rating: 4.6,
    reviews: []
  },
  {
    id: "prod-9",
    name: "Mobile Presets Pack (15 Presets)",
    price: 750,
    regularPrice: 1250,
    salePrice: 750,
    sku: "DP-LR-015",
    brand: "VisualsCo",
    stock: 99999, // Digital products has virtually unlimited stock
    category: "Digital Products",
    subCategory: "Presets",
    images: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"],
    description: "Transform your casual smartphone photos into highly cinematic editorial layouts. This premium digital download includes 15 customized Lightroom Mobile templates (.DNG files) calibrated for warm skin tones, rich teal, and urban retro vibes.",
    tags: ["digital", "presets", "lightroom", "photography"],
    seoTitle: "Cinematic Lightroom Presets Pack (15 Templates)",
    seoDescription: "15 Premium Mobile Lightroom Presets for instant photo enhancement. Dynamic warm tones and retro contrast.",
    featured: true,
    rating: 5.0,
    reviews: []
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "gadgets", name: "Gadgets", subCategories: ["Smartwatches", "Drones", "Audio"] },
  { id: "fashion", name: "Fashion", subCategories: ["Men's Wear", "Women's Wear", "Kids"] },
  { id: "electronics", name: "Electronics", subCategories: ["Audio", "Computers", "Smart Home"] },
  { id: "accessories", name: "Accessories", subCategories: ["Bags", "Wallets", "Jewelry"] },
  { id: "home-products", name: "Home Products", subCategories: ["Living Room", "Kitchen"] },
  { id: "beauty-products", name: "Beauty Products", subCategories: ["Skincare", "Cosmetics"] },
  { id: "books", name: "Books", subCategories: ["Fiction", "Tech & Education"] },
  { id: "digital-products", name: "Digital Products", subCategories: ["Presets", "Software Templates"] }
];

const DEFAULT_COUPONS: Coupon[] = [
  { code: "SAVE10", discountType: "percentage", discountValue: 10, minPurchase: 500, isActive: true },
  { code: "EIDFREE", discountType: "fixed", discountValue: 120, minPurchase: 1000, isActive: true },
  { code: "APEX20", discountType: "percentage", discountValue: 20, minPurchase: 1500, isActive: true }
];

const DEFAULT_SETTINGS: SystemSettings = {
  dhakaDeliveryCharge: 60,
  outsideDhakaDeliveryCharge: 120,
  enabledPaymentMethods: {
    bKash: true,
    Nagad: true,
    Rocket: true,
    SSLCommerz: true,
    Visa: true,
    MasterCard: true,
    COD: true
  },
  homepageBanners: [
    {
      id: "banner-1",
      image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=1200&q=80",
      title: "Supercharged Electronics Fest",
      subtitle: "Unpack next-gen smart devices with up to 25% exclusive markdown checkout discounts.",
      linkUrl: "category/gadgets",
      isActive: true
    },
    {
      id: "banner-2",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      title: "Elevated Streetwear Collection",
      subtitle: "Full-grain details, premium stitching, and minimalist lines designed for active lifestyles.",
      linkUrl: "category/fashion",
      isActive: true
    }
  ],
  seoSettings: {
    metaTitle: "ApexStore - Ultimate Shopping Hub",
    metaDescription: "The absolute premium destination for gadgets, fashion, smart home essentials, beauty masks, tech books, and instant digital assets."
  }
};

const DEFAULT_PAGES: CustomPage[] = [
  {
    id: "home",
    title: "Welcome to ApexStore",
    content: "Our system powers premium online purchases directly within Dhaka and across Bangladesh. Search products, add items instantly to your online shopping cart, apply promotional discount coupons, and checkout securely with instant Cash on Delivery (COD) or pre-integrated Mobile Banking pathways (bKash, Nagad, Rocket).",
    isActive: true,
    isSystem: true
  },
  {
    id: "about",
    title: "About Us",
    content: "### Who We Are\n\nApexStore is Bangladesh's pioneering online portal, focused entirely on high caliber items, swift local logistics, and top tier support.\n\n### Our Quality Pillars\n\n- **Pre-vetted items:** Direct brands sourcing.\n- **Full-scale dynamic checkout:** Seamless payment verification.\n- **Unmatched speed:** 24h delivery inside Dhaka, 3-day nationwide.\n- **Zero coding overhead:** Admin panel enables immediate merchant adjustments.",
    isActive: true,
    isSystem: true
  },
  {
    id: "contact",
    title: "Contact Us",
    content: "### Need Direct Support?\n\nOur client team sits in Banani, Dhaka and is ready to resolve logistical or payment issues within minutes.\n\n- **Office Location:** Tower 104, Road 11, Banani, Dhaka, Bangladesh\n- **Logistics Helpline:** +880 1987-654321\n- **Mail Address:** support@apexstore.com.bd\n- **Operating Hours:** Saturday - Thursday (9:00 AM - 7:00 PM)",
    isActive: true,
    isSystem: true
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    content: "### Personal Information Protection\n\nYour purchase privacy is our absolute priority. Personal coordinates (phone markers, shipping addresses, transaction IDs) are safely isolated from client query pools.\n\n- **Account Integrity:** Multi-point encryption handles credential logs safely.\n- **Anonymity logs:** Web requests only parse non-personal feature identifiers.\n- **GDPR and localized Bangladesh cyber directives:** 100% compliant security.",
    isActive: true,
    isSystem: true
  },
  {
    id: "terms",
    title: "Terms and Conditions",
    content: "### Standard Terms of Purchase\n\n- **Pricing integrity:** All items reflect physical stock and regular/sale price limits.\n- **Logistical commitments:** Dhaka deliveries are processed at standard 60 TK. Outside Dhaka transport at 120 TK. Charges are subject to administrative adjustments.\n- **Product Warranty:** Gadget products include 6 to 12 months seller guarantees where stated.",
    isActive: true,
    isSystem: true
  }
];

const DEFAULT_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "The Ultimate Guide to Selecting a Hybrid Smartwatch in 2026",
    excerpt: "Confused between full smartwatches and elegant hybrids? Let's analyze sensors, batteries, styles, and workout integration metrics.",
    content: "Smartwatches have evolved tremendously. Traditional wear required charging your device every night, disrupting crucial nocturnal diagnostic sleep tracking logs. Modern hybrid systems, such as the AeroPulse series, pack advanced organic LED display layers under protective chassis, operating on low-draw firmware models that promise up to two weeks of continuous utility. When shopping, always evaluate three critical metrics: health sensor standards (namely dual diode Photoplethysmography), exterior build materials, and app synchronization libraries.",
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80",
    author: "Zulqarnain Alam",
    createdAt: "2026-05-18",
    tags: ["smartwatch", "wearables", "tech-tips"]
  },
  {
    id: "art-2",
    title: "Why Hydrophobic Knits are Re-shaping Streetwear Fashion",
    excerpt: "Urban weather demands resilient outerwear. Meet the innovative molecular science that keeps cotton hoodies bone dry under rain.",
    content: "Standard outerwear absorbs rainfall instantly, adding weight, stretching fabrics, and cooling body heat. Emerging street garments are re-architecting thread structures by bonding microscopically tiny silicon or fluorine lattices directly to individual organic cotton filaments. This creates extreme surface tension where water droplets refuse to flatten, sliding clean off the outerwear surface instead. It is lightweight, breathable, and shields the wearer from unexpected dust or splashes.",
    image: "https://images.unsplash.com/photo-1544002513-36169e15a09e?auto=format&fit=crop&w=600&q=80",
    author: "Rumana Chowdhury",
    createdAt: "2026-05-21",
    tags: ["fashion", "streetwear", "textile-tech"]
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ORD-9285",
    userId: "demo-user-1",
    customerName: "Imran Khan",
    phone: "01712345678",
    email: "imran@gmail.com",
    shippingAddress: "House 24, Road 12, Dhanmondi",
    city: "Dhaka",
    items: [
      { productId: "prod-1", productName: "AeroPulse Hybrid Smartwatch", price: 3890, quantity: 1, image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=600&q=80" },
      { productId: "prod-5", productName: "Slimline Minimalist Full Grain Wallet", price: 1200, quantity: 1, image: "https://images.unsplash.com/photo-1627124765135-56c33fc36bfa?auto=format&fit=crop&w=600&q=80" }
    ],
    paymentMethod: "bKash",
    paymentStatus: "Paid",
    paymentTxnId: "BK20260522001",
    shippingCharge: 60,
    discountAmount: 100,
    totalAmount: 4990,
    status: "Confirmed",
    createdAt: "2026-05-22T04:12:00Z",
    trackingUpdates: [
      { status: "Pending", timestamp: "2026-05-22T04:12:00Z", note: "Order created successfully." },
      { status: "Confirmed", timestamp: "2026-05-22T04:30:00Z", note: "BKash merchant transaction verified. Order confirmed for packaging." }
    ]
  },
  {
    id: "ORD-1153",
    userId: "demo-user-2",
    customerName: "Syeda Tasnim",
    phone: "01824987654",
    email: "tasnim@yahoo.com",
    shippingAddress: "Lane 3, Halishahar",
    city: "Outside Dhaka",
    items: [
      { productId: "prod-2", productName: "Vertex Pro ANC Studio Headphones", price: 7200, quantity: 1, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" }
    ],
    paymentMethod: "COD",
    paymentStatus: "Pending",
    shippingCharge: 120,
    discountAmount: 0,
    totalAmount: 7320,
    status: "Shipped",
    createdAt: "2026-05-21T09:40:00Z",
    trackingUpdates: [
      { status: "Pending", timestamp: "2026-05-21T09:40:00Z", note: "Order registered on COD terms." },
      { status: "Confirmed", timestamp: "2026-05-21T11:00:00Z", note: "Customer details and address confirmed via phone call verify." },
      { status: "Shipped", timestamp: "2026-05-21T15:30:00Z", note: "Transferred to Pathao Logistics Hub. Consignment code PT-998371." }
    ]
  }
];

// Read internal DB or initialize seeds
let db: DatabaseSchema = {
  products: DEFAULT_PRODUCTS,
  categories: DEFAULT_CATEGORIES,
  orders: DEFAULT_ORDERS,
  coupons: DEFAULT_COUPONS,
  settings: DEFAULT_SETTINGS,
  pages: DEFAULT_PAGES,
  articles: DEFAULT_ARTICLES,
  supportTickets: []
};

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const loaded = JSON.parse(raw);
      // Ensure key arrays are hydrated in case schema changes during development
      db = {
        products: loaded.products || DEFAULT_PRODUCTS,
        categories: loaded.categories || DEFAULT_CATEGORIES,
        orders: loaded.orders || DEFAULT_ORDERS,
        coupons: loaded.coupons || DEFAULT_COUPONS,
        settings: loaded.settings || DEFAULT_SETTINGS,
        pages: loaded.pages || DEFAULT_PAGES,
        articles: loaded.articles || DEFAULT_ARTICLES,
        supportTickets: loaded.supportTickets || []
      };
    } else {
      writeDb();
    }
  } catch (error) {
    console.warn("DB file reading failed, utilizing fallback memory DB:", error);
  }
}

function writeDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("DB file writing failed:", error);
  }
}

// Read database at launch
readDb();

// --- API ENDPOINTS ---

// AI SEO and Description Generator
app.post("/api/generate-ai", async (req, res) => {
  const { prompt, type } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const ai = getAI();
  if (!ai) {
    // Elegant fallback simulation if user has not loaded GEMINI_API_KEY
    if (type === "seo") {
      const name = prompt.substring(0, 40);
      return res.json({
        seoTitle: `${name} | Modern Quality - ApexStore`,
        seoDescription: `Discover the extreme beauty and parameters of ${name}. Crafted carefully using high quality industry items. Order now at the best local price with 24-hour deliveries!`
      });
    } else {
      const name = prompt;
      return res.json({
        description: `This premium ${name} is curated to elevate daily lifestyles. Combining sophisticated durability with modern aesthetic shapes, it promises excellent performance, rich specifications, and unmatched materials. Ideal for gadgets, electronic lovers, or active professionals.`
      });
    }
  }

  try {
    let systemInstruction = "";
    if (type === "seo") {
      systemInstruction = "You are a senior SEO copywriter. Generate a JSON response with 'seoTitle' (under 60 chars) and 'seoDescription' (under 155 chars) based on the product name and specs. Keep it highly marketing-friendly and natural. Do not write any markdown code fences, only return raw JSON with the keys 'seoTitle' and 'seoDescription'.";
    } else {
      systemInstruction = "You are a professional retail and copywriting expert. Write a beautiful, rich 3-sentence promotional product description based on the name. Do not write any markdown decorations, return raw plain text content.";
    }

    const modelName = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const resultText = response.text || "";
    if (type === "seo") {
      // Parse JSON from output cleanly
      try {
        const cleanJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        return res.json({
          seoTitle: parsed.seoTitle || `${prompt} | ApexStore`,
          seoDescription: parsed.seoDescription || `Shop ${prompt} premium collections securely. best price online.`
        });
      } catch (err) {
        // Simple regex fallback if it returned weird content
        return res.json({
          seoTitle: `${prompt} | ApexStore`,
          seoDescription: `Shop ${prompt} on ApexStore. Premium verified inventory.`
        });
      }
    } else {
      return res.json({ description: resultText.trim() });
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "AI generation failed: " + error.message });
  }
});

// Products
app.get("/api/products", (req, res) => {
  res.json(db.products);
});

app.post("/api/products", (req, res) => {
  const product: Product = req.body;
  if (!product.id) {
    product.id = "prod-" + Math.random().toString(36).substring(2, 9);
  }
  if (!product.reviews) {
    product.reviews = [];
  }
  product.rating = product.reviews.length 
    ? parseFloat((product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1))
    : 0;

  db.products.push(product);
  writeDb();
  res.status(201).json(product);
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  
  const current = db.products[index];
  const updated: Product = {
    ...current,
    ...req.body,
    id // keep original ID
  };

  db.products[index] = updated;
  writeDb();
  res.json(updated);
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = db.products.length;
  db.products = db.products.filter(p => p.id !== id);
  if (db.products.length === initialLength) {
    return res.status(404).json({ error: "Product not found" });
  }
  writeDb();
  res.json({ success: true });
});

// Submit a review for a product
app.post("/api/products/:id/reviews", (req, res) => {
  const { id } = req.params;
  const { userName, rating, comment } = req.body;
  
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const newReview = {
    id: "rev-" + Math.random().toString(36).substring(2, 9),
    userName: userName || "Anonymous Customer",
    rating: Number(rating) || 5,
    comment: comment || "Great product!",
    createdAt: new Date().toISOString().split('T')[0]
  };

  if (!db.products[index].reviews) {
    db.products[index].reviews = [];
  }
  db.products[index].reviews!.push(newReview);
  
  // Recalculating ratings
  const count = db.products[index].reviews!.length;
  const total = db.products[index].reviews!.reduce((sum, val) => sum + val.rating, 0);
  db.products[index].rating = parseFloat((total / count).toFixed(1));

  writeDb();
  res.status(201).json(db.products[index]);
});

// Categories
app.get("/api/categories", (req, res) => {
  res.json(db.categories);
});

app.post("/api/categories", (req, res) => {
  const cat: Category = req.body;
  if (!cat.id) {
    cat.id = cat.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  
  // Check if exists
  const exists = db.categories.find(c => c.id === cat.id);
  if (exists) {
    return res.status(400).json({ error: "Category already exists" });
  }

  db.categories.push(cat);
  writeDb();
  res.status(201).json(cat);
});

app.put("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  const index = db.categories.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Category not found" });
  }
  
  db.categories[index] = {
    ...db.categories[index],
    ...req.body,
    id // preserve ID
  };
  writeDb();
  res.json(db.categories[index]);
});

app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  db.categories = db.categories.filter(c => c.id !== id);
  writeDb();
  res.json({ success: true });
});

// Orders
app.get("/api/orders", (req, res) => {
  res.json(db.orders);
});

app.get("/api/orders/:id", (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

app.post("/api/orders", (req, res) => {
  const orderData = req.body;
  const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
  
  const newOrder: Order = {
    ...orderData,
    id: orderId,
    status: "Pending",
    createdAt: new Date().toISOString(),
    trackingUpdates: [
      { status: "Pending", timestamp: new Date().toISOString(), note: "Order placed successfully. Waiting confirmation." }
    ]
  };

  // Adjust product stocks
  orderData.items.forEach((item: any) => {
    const product = db.products.find(p => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
    }
  });

  db.orders.push(newOrder);
  writeDb();
  res.status(201).json(newOrder);
});

// Update order status or tracking details
app.put("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  
  const index = db.orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = db.orders[index];
  order.status = status;
  
  // Update tracking updates array
  order.trackingUpdates.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || `Order status updated to ${status}.`
  });

  // If status is Delivered, we can mark payments as Paid
  if (status === "Delivered") {
    order.paymentStatus = "Paid";
  }

  db.orders[index] = order;
  writeDb();
  res.json(order);
});

// Coupons
app.get("/api/coupons", (req, res) => {
  res.json(db.coupons);
});

app.post("/api/coupons", (req, res) => {
  const coupon: Coupon = req.body;
  coupon.code = coupon.code.toUpperCase().trim();
  
  // Check if coupon code exists
  const exists = db.coupons.find(c => c.code === coupon.code);
  if (exists) {
    return res.status(400).json({ error: "Coupon code already exists" });
  }

  db.coupons.push(coupon);
  writeDb();
  res.status(201).json(coupon);
});

app.delete("/api/coupons/:code", (req, res) => {
  const { code } = req.params;
  db.coupons = db.coupons.filter(c => c.code !== code.toUpperCase());
  writeDb();
  res.json({ success: true });
});

// Check coupon validity
app.post("/api/coupons/validate", (req, res) => {
  const { code, amount } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Coupon code is required" });
  }

  const coupon = db.coupons.find(c => c.code === code.toUpperCase() && c.isActive);
  if (!coupon) {
    return res.status(404).json({ error: "Invalid or inactive promotional coupon code" });
  }

  if (amount < coupon.minPurchase) {
    return res.status(400).json({ 
      error: `This coupon requires a minimum purchase of ${coupon.minPurchase} TK. Current cart subtotal: ${amount} TK.` 
    });
  }

  res.json({
    success: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue
  });
});

// System settings
app.get("/api/settings", (req, res) => {
  res.json(db.settings);
});

app.post("/api/settings", (req, res) => {
  db.settings = {
    ...db.settings,
    ...req.body
  };
  writeDb();
  res.json(db.settings);
});

// Custom generated pages (Home, About, etc.)
app.get("/api/pages", (req, res) => {
  res.json(db.pages);
});

app.get("/api/pages/:id", (req, res) => {
  const page = db.pages.find(p => p.id === req.params.id);
  if (!page) {
    return res.status(404).json({ error: "Page not found" });
  }
  res.json(page);
});

app.post("/api/pages", (req, res) => {
  const page: CustomPage = req.body;
  if (!page.id) {
    page.id = page.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  page.isActive = page.isActive !== undefined ? page.isActive : true;

  // Verify unique
  const index = db.pages.findIndex(p => p.id === page.id);
  if (index !== -1) {
    db.pages[index] = page;
  } else {
    db.pages.push(page);
  }
  
  writeDb();
  res.status(201).json(page);
});

app.delete("/api/pages/:id", (req, res) => {
  const { id } = req.params;
  const page = db.pages.find(p => p.id === id);
  if (page?.isSystem) {
    return res.status(400).json({ error: "System pages cannot be deleted" });
  }
  db.pages = db.pages.filter(p => p.id !== id);
  writeDb();
  res.json({ success: true });
});

// Blog Articles
app.get("/api/articles", (req, res) => {
  res.json(db.articles);
});

app.post("/api/articles", (req, res) => {
  const art: Article = req.body;
  if (!art.id) {
    art.id = "art-" + Math.random().toString(36).substring(2, 9);
  }
  art.createdAt = new Date().toISOString().split('T')[0];
  db.articles.unshift(art);
  writeDb();
  res.status(201).json(art);
});

app.delete("/api/articles/:id", (req, res) => {
  db.articles = db.articles.filter(a => a.id !== req.params.id);
  writeDb();
  res.json({ success: true });
});

// Support tickets
app.get("/api/support", (req, res) => {
  res.json(db.supportTickets);
});

app.post("/api/support", (req, res) => {
  const ticket: SupportTicket = req.body;
  ticket.id = "TCK-" + Math.floor(1000 + Math.random() * 9000);
  ticket.status = "Open";
  ticket.createdAt = new Date().toISOString();
  db.supportTickets.unshift(ticket);
  writeDb();
  res.status(201).json(ticket);
});

app.put("/api/support/:id", (req, res) => {
  const { id } = req.params;
  const index = db.supportTickets.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  db.supportTickets[index].status = req.body.status;
  writeDb();
  res.json(db.supportTickets[index]);
});

// VITE MIDDLEWARE / STATIC FILES SERVING SETUP
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support fallback React single page routing logic
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
