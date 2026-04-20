import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Collection from "../collection/collection.js";
import Product from "../product/product.js";

const MONGODB_URI = process.env.MONGODB_URI;

const normalize = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeCode = (value = "") => {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!raw) return "";
  if (/^\d+$/.test(raw)) return raw.padStart(5, "0");
  return raw;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const uniq = (arr = []) => [...new Set(arr.filter(Boolean))];

const includesAny = (haystack = "", needles = []) =>
  needles.some((needle) => haystack.includes(normalize(needle)));

const productSearchText = (product = {}) => {
  const parts = [
    product.name,
    product.shortDescription,
    product.description,
    product.categoryName,
    product.category?.name,
    product.subcategoryName,
    product.subcategoryDetails?.name,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ];

  return normalize(parts.filter(Boolean).join(" "));
};

const getPrimaryImage = (product = {}) => {
  const media = Array.isArray(product.media) ? product.media : [];
  return (
    media.find((item) => item?.isPrimary && item?.secureUrl)?.secureUrl ||
    media.find((item) => item?.isPrimary && item?.url)?.url ||
    media[0]?.secureUrl ||
    media[0]?.url ||
    ""
  );
};

const sortByNewest = (a, b) =>
  new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();

const sortByDiscount = (a, b) =>
  Number(b?.effectiveDiscountPercent || 0) - Number(a?.effectiveDiscountPercent || 0);

const sortBySold = (a, b) => Number(b?.soldCount || 0) - Number(a?.soldCount || 0);

const sortByFeaturedThenSold = (a, b) => {
  const scoreA =
    (a?.isBestSeller ? 50 : 0) +
    (a?.isFeatured ? 20 : 0) +
    Number(a?.soldCount || 0);
  const scoreB =
    (b?.isBestSeller ? 50 : 0) +
    (b?.isFeatured ? 20 : 0) +
    Number(b?.soldCount || 0);

  return scoreB - scoreA;
};

const takeCodes = (products = [], limit = 24) =>
  uniq(
    products
      .slice(0, limit)
      .map((item) => normalizeCode(item?.productCode))
      .filter(Boolean)
  );

const collectionMatchers = {
  "creator-essentials": (products) => {
    const scored = products.filter((p) => {
      const text = productSearchText(p);
      return includesAny(text, [
        "creator",
        "streaming",
        "podcast",
        "vlogging",
        "camera",
        "light",
        "tripod",
        "microphone",
        "webcam",
      ]);
    });

    return scored.sort(sortByFeaturedThenSold);
  },

  "studio-setup": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "studio",
          "cob",
          "softbox",
          "light stand",
          "video light",
          "lighting",
          "product photography",
        ]);
      })
      .sort(sortByFeaturedThenSold),

  "on-the-go-gear": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "portable",
          "mini",
          "compact",
          "travel",
          "wireless",
          "handheld",
          "mobile",
          "light stick",
        ]);
      })
      .sort(sortByFeaturedThenSold),

  "bundles-and-kits": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, ["bundle", "kit", "starter kit", "creator kit"]);
      })
      .sort(sortByFeaturedThenSold),

  "best-sellers": (products) =>
    [...products]
      .filter((p) => (p?.soldCount || 0) > 0 || p?.isBestSeller || p?.isFeatured)
      .sort(sortBySold),

  "trending-now": (products) =>
    [...products].sort((a, b) => {
      const scoreA =
        Number(a?.soldCount || 0) * 2 +
        Number(a?.effectiveDiscountPercent || 0) +
        (a?.isFeatured ? 10 : 0);
      const scoreB =
        Number(b?.soldCount || 0) * 2 +
        Number(b?.effectiveDiscountPercent || 0) +
        (b?.isFeatured ? 10 : 0);
      return scoreB - scoreA;
    }),

  "new-arrivals": (products) => [...products].sort(sortByNewest),

  "hot-deals": (products) =>
    [...products]
      .filter((p) => Number(p?.effectiveDiscountPercent || 0) > 0)
      .sort(sortByDiscount),

  "lighting-gear": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "light",
          "lighting",
          "led",
          "cob",
          "rgb",
          "ring light",
          "video light",
        ]);
      })
      .sort(sortByFeaturedThenSold),

  "audio-gear": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "audio",
          "microphone",
          "mic",
          "lavalier",
          "wireless mic",
          "podcast",
        ]);
      })
      .sort(sortByFeaturedThenSold),

  "vlogging-gear": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "vlog",
          "vlogging",
          "selfie",
          "mobile",
          "tripod",
          "wireless mic",
          "light stick",
        ]);
      })
      .sort(sortByFeaturedThenSold),

  "streaming-setup": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return (
          normalize(p?.categoryName) === "streaming creator gear" ||
          includesAny(text, [
            "streaming",
            "webcam",
            "desk mount",
            "podcast",
            "monitor",
            "live stream",
          ])
        );
      })
      .sort(sortByFeaturedThenSold),

  "camera-accessories": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "camera",
          "gopro",
          "tripod",
          "mount",
          "ball head",
          "quick release",
        ]);
      })
      .sort(sortByFeaturedThenSold),

  "mobile-creator-gear": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "mobile",
          "iphone",
          "magsafe",
          "smartphone",
          "selfie",
          "reels",
        ]);
      })
      .sort(sortByFeaturedThenSold),

  "power-and-connectivity": (products) =>
    products
      .filter((p) => {
        return (
          normalize(p?.categoryName) === "power connectivity" ||
          includesAny(productSearchText(p), [
            "power",
            "adapter",
            "battery charger",
            "charger",
            "cable",
            "usb",
            "type c",
            "connectivity",
          ])
        );
      })
      .sort(sortByFeaturedThenSold),

  "bags-and-storage": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, ["bag", "case", "storage", "carrying case"]);
      })
      .sort(sortByFeaturedThenSold),

  "youtube-starter-kit": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "youtube",
          "video light",
          "microphone",
          "tripod",
          "streaming",
          "creator",
        ]);
      })
      .sort(sortByFeaturedThenSold),

  "reels-creator-kit": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "reels",
          "mobile",
          "iphone",
          "selfie",
          "wireless mic",
          "ring light",
        ]);
      })
      .sort(sortByFeaturedThenSold),

  "podcast-setup": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, ["podcast", "microphone", "audio", "wireless mic"]);
      })
      .sort(sortByFeaturedThenSold),

  "product-photography-kit": (products) =>
    products
      .filter((p) => {
        const text = productSearchText(p);
        return includesAny(text, [
          "product photography",
          "studio",
          "cob",
          "light",
          "rgb",
          "tripod",
        ]);
      })
      .sort(sortByFeaturedThenSold),
};

const fallbackMatch = (collection, products) => {
  const slug = normalize(collection?.slug || "");
  const name = normalize(collection?.name || "");

  return products.filter((product) => {
    const category = normalize(product?.categoryName || product?.category?.name || "");
    const subcategory = normalize(
      product?.subcategoryName || product?.subcategoryDetails?.name || ""
    );
    const text = productSearchText(product);

    return (
      category === slug ||
      category === name ||
      subcategory === slug ||
      subcategory === name ||
      text.includes(slug) ||
      text.includes(name)
    );
  });
};

const main = async () => {
  const overwrite = process.argv.includes("--overwrite");
  const dryRun = process.argv.includes("--dry-run");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");

    const [collections, products] = await Promise.all([
      Collection.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }),
      Product.find({ status: "active" }).lean(),
    ]);

    console.log(`📦 Active collections: ${collections.length}`);
    console.log(`🛍️ Active products: ${products.length}`);

    for (const collection of collections) {
      const slug = collection.slug;
      const matcher = collectionMatchers[slug];
      let matchedProducts = [];

      if (typeof matcher === "function") {
        matchedProducts = matcher(products);
      }

      if (!matchedProducts.length) {
        matchedProducts = fallbackMatch(collection, products);
      }

      const productCodes = takeCodes(matchedProducts, 24);

      if (!overwrite && Array.isArray(collection.productCodes) && collection.productCodes.length) {
        console.log(`⏭️ Skipped ${collection.name} (already has product codes)`);
        continue;
      }

      console.log(
        `\n📁 ${collection.name}\n   Found: ${productCodes.length} product codes\n   Codes: ${productCodes.join(", ")}`
      );

      if (!dryRun) {
        collection.productCodes = productCodes;
        await collection.save();
      }
    }

    console.log(dryRun ? "\n🧪 Dry run complete" : "\n✅ Product codes assigned successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ assignProductsToCollections error:", error);
    process.exit(1);
  }
};

main();