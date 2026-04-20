import "dotenv/config";
import mongoose from "mongoose";
import Product from "../product/product.js";
import Category from "../Category/Category.js";

const MONGODB_URI = process.env.MONGODB_URI;
const BASE_URL = "https://www.hiffin.in";
const PER_CATEGORY_LIMIT = 7;

/* -------------------------------------------------------
   category matching
------------------------------------------------------- */
const CATEGORY_RULES = [
  {
    categoryName: "Tripods & Support",
    keywords: [
      "tripod",
      "monopod",
      "ball head",
      "quick release",
      "light stand",
      "boom arm",
      "tripod stand",
      "camera stand",
    ],
  },
  {
    categoryName: "Lighting Equipment",
    keywords: [
      "ring light",
      "rgb light",
      "panel light",
      "video light",
      "led light",
      "cob light",
      "studio light",
      "on-camera light",
      "photography light",
      "selfie light",
      "stick light",
    ],
  },
  {
    categoryName: "Light Modifiers",
    keywords: [
      "softbox",
      "umbrella",
      "reflector",
      "diffuser",
      "beauty dish",
      "snoot",
      "grid",
      "light box",
    ],
  },
  {
    categoryName: "Audio Equipment",
    keywords: [
      "microphone",
      "wireless mic",
      "wireless microphone",
      "lavalier",
      "shotgun mic",
      "usb mic",
      "audio interface",
      "mic stand",
      "mic",
    ],
  },
  {
    categoryName: "Mobile & Vlogging Accessories",
    keywords: [
      "selfie tripod",
      "selfie stick",
      "mobile holder",
      "phone mount",
      "vlogging",
      "vlogging kit",
      "smartphone rig",
      "phone rig",
      "gimbal",
      "mobile stand",
      "cold shoe",
    ],
  },
  {
    categoryName: "Camera Accessories",
    keywords: [
      "battery",
      "charger",
      "dummy battery",
      "memory card",
      "sd card",
      "card reader",
      "lens filter",
      "uv filter",
      "nd filter",
      "cpl filter",
      "lens cap",
      "cleaning kit",
      "camera cleaning",
      "camera battery",
    ],
  },
  {
    categoryName: "Mounts & Rigging",
    keywords: [
      "camera cage",
      "cage",
      "magic arm",
      "clamp",
      "mount",
      "suction mount",
      "helmet mount",
      "chest mount",
      "adapter",
      "tripod mount",
      "rig",
      "rigging",
    ],
  },
  {
    categoryName: "Studio Setup",
    keywords: [
      "backdrop",
      "background stand",
      "green screen",
      "background roll",
      "table top",
      "photo backdrop",
      "curtain backdrop",
      "backdrop stand",
    ],
  },
  {
    categoryName: "Bags & Storage",
    keywords: [
      "camera bag",
      "bag",
      "backpack",
      "hard case",
      "pouch",
      "storage box",
      "sling bag",
      "case bag",
    ],
  },
  {
    categoryName: "Streaming & Creator Gear",
    keywords: [
      "streaming",
      "webcam light",
      "desk mount",
      "podcast",
      "creator bundle",
      "stream setup",
      "podcast kit",
      "webcam",
    ],
  },
  {
    categoryName: "Power & Connectivity",
    keywords: [
      "extension board",
      "power adapter",
      "adapter",
      "cable",
      "hdmi",
      "type c",
      "usb hub",
      "aux cable",
      "power supply",
      "usb cable",
    ],
  },
];

/* -------------------------------------------------------
   helpers
------------------------------------------------------- */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanText(value = "") {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(arr = []) {
  return [...new Set(arr.filter(Boolean))];
}

function normalizeLower(value = "") {
  return cleanText(value).toLowerCase();
}

function getPriceNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function ensurePositivePrices(mrp, discountPrice) {
  let a = getPriceNumber(mrp);
  let b = getPriceNumber(discountPrice);

  if (!a && !b) return { mrp: 0, discountPrice: 0 };
  if (!a) a = b;
  if (!b) b = a;
  if (b > a) [a, b] = [b, a];

  return {
    mrp: a,
    discountPrice: b,
  };
}

function extractImages(images = [], title = "") {
  return (Array.isArray(images) ? images : [])
    .filter((img) => img?.src)
    .slice(0, 10)
    .map((img, index) => ({
      type: "image",
      url: img.src,
      secureUrl: img.src,
      thumbnailUrl: img.src,
      alt: title,
      isPrimary: index === 0,
      sortOrder: index,
      width: Number(img.width || 0),
      height: Number(img.height || 0),
      resourceType: "image",
      format: String(img.src).split(".").pop()?.split("?")[0] || "",
    }));
}

function buildVariants(variants = [], fallbackColor = "") {
  return (Array.isArray(variants) ? variants : [])
    .slice(0, 20)
    .map((variant) => {
      const title = cleanText(variant?.title || "");
      const { mrp, discountPrice } = ensurePositivePrices(
        variant?.compare_at_price,
        variant?.price
      );

      return {
        sku: cleanText(variant?.sku || ""),
        size:
          title && title.toLowerCase() !== "default title"
            ? title.toUpperCase().slice(0, 40)
            : "FREE",
        color: fallbackColor,
        mrp,
        discountPrice,
        stock: 0,
        reservedStock: 0,
        soldCount: 0,
        image: "",
        isActive: Boolean(variant?.available ?? true),
      };
    })
    .filter((variant) => variant.mrp > 0 || variant.discountPrice > 0);
}

function buildTags(product = {}, matchedKeywords = []) {
  const sourceTags = Array.isArray(product?.tags)
    ? product.tags
    : String(product?.tags || "")
        .split(",")
        .map((x) => cleanText(x));

  return unique(
    [
      ...sourceTags.map((t) => normalizeLower(t)),
      ...matchedKeywords.map((t) => normalizeLower(t)),
      normalizeLower(product?.vendor || ""),
      "hiffin",
    ].filter(Boolean)
  ).slice(0, 25);
}

function inferColor(text = "") {
  const hay = normalizeLower(text);
  const colors = [
    "black",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "pink",
    "purple",
    "grey",
    "gray",
    "silver",
    "gold",
    "brown",
  ];
  const found = colors.find((c) => hay.includes(c));
  return found === "gray" ? "grey" : found || "";
}

function scoreProductForCategory(product, rule) {
  const hay = normalizeLower(
    [
      product?.title,
      product?.handle,
      product?.body_html,
      Array.isArray(product?.tags) ? product.tags.join(" ") : product?.tags,
      product?.vendor,
    ]
      .filter(Boolean)
      .join(" ")
  );

  let score = 0;
  const matchedKeywords = [];

  for (const keyword of rule.keywords) {
    if (hay.includes(keyword.toLowerCase())) {
      score += keyword.includes(" ") ? 4 : 2;
      matchedKeywords.push(keyword);
    }
  }

  if (rule.categoryName === "Bags & Storage" && hay.includes("camera")) score += 1;
  if (rule.categoryName === "Lighting Equipment" && hay.includes("photography")) score += 1;
  if (rule.categoryName === "Studio Setup" && hay.includes("studio")) score += 1;
  if (rule.categoryName === "Audio Equipment" && hay.includes("recording")) score += 1;

  return {
    score,
    matchedKeywords: unique(matchedKeywords),
  };
}

function mapProductToPayload(product, categoryId, matchedKeywords = []) {
  const title = cleanText(product?.title || "");
  const body = cleanText(product?.body_html || "");
  const variant0 = Array.isArray(product?.variants) ? product.variants[0] : null;

  const { mrp, discountPrice } = ensurePositivePrices(
    variant0?.compare_at_price,
    variant0?.price
  );

  const color = inferColor(`${title} ${body}`);
  const media = extractImages(product?.images, title);
  const variants = buildVariants(product?.variants, color);

  return {
    name: title,
    shortDescription: body.slice(0, 500),
    description: body || title,
    color,
    category: categoryId,
    tags: buildTags(product, matchedKeywords),
    mrp,
    discountPrice,
    hsnCode: "",
    taxClass: "",
    stock: 0,
    reservedStock: 0,
    soldCount: 0,
    trackInventory: true,
    allowBackorder: false,
    lowStockThreshold: 5,
    isFeatured: false,
    isBestSeller: false,
    status: "draft",
    crossSellProductCodes: [],
    media,
    variants,
    fabric: "",
    material: "",
    fit: "",
    careInstructions: "",
  };
}

async function fetchProductsPage(page = 1, limit = 250) {
  const url = `${BASE_URL}/products.json?limit=${limit}&page=${page}`;

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      accept: "application/json,text/plain,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed page ${page}: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  const limit = 250;

  while (true) {
    console.log(`📦 Fetching HIFFIN page ${page}...`);
    const data = await fetchProductsPage(page, limit);
    const products = Array.isArray(data?.products) ? data.products : [];

    if (!products.length) break;

    all.push(...products);

    if (products.length < limit) break;

    page += 1;
    await sleep(300);
  }

  return all;
}

/* -------------------------------------------------------
   main
------------------------------------------------------- */
async function main() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI missing in .env");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB connected");

  const categories = await Category.find({
    name: { $in: CATEGORY_RULES.map((x) => x.categoryName) },
  }).lean();

  const categoryMap = new Map(categories.map((cat) => [cat.name, cat._id]));
  const missingCategories = CATEGORY_RULES
    .map((x) => x.categoryName)
    .filter((name) => !categoryMap.has(name));

  if (missingCategories.length) {
    throw new Error(`Missing categories in DB: ${missingCategories.join(", ")}`);
  }

  const sourceProducts = await fetchAllProducts();
  console.log(`📊 Total source products: ${sourceProducts.length}`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const rule of CATEGORY_RULES) {
    const categoryId = categoryMap.get(rule.categoryName);

    const matched = sourceProducts
      .map((product) => {
        const result = scoreProductForCategory(product, rule);
        return { product, ...result };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, PER_CATEGORY_LIMIT);

    console.log(`\n==============================`);
    console.log(`🚀 ${rule.categoryName}`);
    console.log(`Matched: ${matched.length}`);
    console.log(`==============================`);

    for (const item of matched) {
      const product = item.product;

      try {
        const payload = mapProductToPayload(product, categoryId, item.matchedKeywords);

        if (!payload.name || !payload.mrp || !payload.discountPrice) {
          skipped += 1;
          console.log(`⏭️ Skipped (missing required data): ${product?.title || "Untitled"}`);
          continue;
        }

        const existing = await Product.findOne({
          $or: [
            { name: payload.name },
            {
              tags: "hiffin",
              name: payload.name,
            },
          ],
        });

        if (existing) {
          existing.name = payload.name;
          existing.shortDescription = payload.shortDescription;
          existing.description = payload.description;
          existing.color = payload.color;
          existing.category = payload.category;
          existing.tags = payload.tags;
          existing.mrp = payload.mrp;
          existing.discountPrice = payload.discountPrice;
          existing.media = payload.media;
          existing.variants = payload.variants;
          existing.status = existing.status || "draft";

          await existing.save();
          updated += 1;
          console.log(`♻️ Updated: ${payload.name}`);
        } else {
          await Product.create(payload);
          created += 1;
          console.log(`✨ Created: ${payload.name}`);
        }
      } catch (error) {
        skipped += 1;
        console.log(`❌ Failed: ${product?.title || "Untitled"}`);
        console.log(`   ${error.message}`);
      }
    }
  }

  console.log(`\n🎉 DONE`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

main()
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
      console.log("🔌 MongoDB disconnected");
    } catch {}
  });