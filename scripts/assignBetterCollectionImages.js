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

const includesAny = (text = "", keywords = []) =>
  keywords.some((keyword) => text.includes(normalize(keyword)));

const getPrimaryMedia = (product = {}) => {
  const media = Array.isArray(product.media) ? product.media : [];

  return (
    media.find((item) => item?.isPrimary && (item?.secureUrl || item?.url)) ||
    media.find((item) => item?.secureUrl || item?.url) ||
    null
  );
};

const getImageUrl = (mediaItem = null) => {
  if (!mediaItem) return "";
  return mediaItem.secureUrl || mediaItem.url || "";
};

const getProductText = (product = {}) =>
  normalize(
    [
      product.name,
      product.shortDescription,
      product.description,
      product.categoryName,
      product.subcategoryName,
      ...(Array.isArray(product.tags) ? product.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
  );

const collectionKeywordMap = {
  "creator-essentials": [
    "creator",
    "streaming",
    "camera",
    "microphone",
    "tripod",
    "light",
  ],
  "studio-setup": ["studio", "cob", "video light", "lighting", "softbox"],
  "on-the-go-gear": ["portable", "mini", "compact", "travel", "wireless"],
  "bundles-and-kits": ["kit", "bundle", "starter kit"],
  "best-sellers": ["best seller", "featured"],
  "trending-now": ["trending", "popular", "creator"],
  "new-arrivals": ["new", "latest"],
  "hot-deals": ["deal", "offer", "discount"],
  "lighting-gear": ["light", "lighting", "led", "rgb", "cob", "ring light"],
  "audio-gear": ["audio", "mic", "microphone", "lavalier", "podcast"],
  "vlogging-gear": ["vlog", "vlogging", "selfie", "mobile", "wireless mic"],
  "streaming-setup": ["streaming", "webcam", "desk mount", "podcast"],
  "camera-accessories": ["camera", "gopro", "tripod", "mount"],
  "mobile-creator-gear": ["mobile", "iphone", "magsafe", "selfie", "reels"],
  "power-and-connectivity": ["charger", "battery", "adapter", "cable", "usb"],
  "bags-and-storage": ["bag", "storage", "case", "carrying"],
  "youtube-starter-kit": ["youtube", "tripod", "microphone", "video light"],
  "reels-creator-kit": ["reels", "mobile", "selfie", "ring light"],
  "podcast-setup": ["podcast", "microphone", "audio"],
  "product-photography-kit": ["product photography", "studio", "light", "cob"],
};

const scoreMediaForHero = (mediaItem = {}, index = 0) => {
  let score = 0;

  const width = Number(mediaItem?.width || 0);
  const height = Number(mediaItem?.height || 0);
  const alt = normalize(mediaItem?.alt || "");
  const url = String(mediaItem?.secureUrl || mediaItem?.url || "");

  if (width >= 1200) score += 20;
  if (height >= 1200) score += 20;

  if (width > 0 && height > 0) {
    const ratio = width / height;

    if (ratio >= 0.9 && ratio <= 1.15) score += 25; // near square
    else if (ratio >= 0.75 && ratio <= 1.4) score += 15;
  }

  if (index === 0) score += 18;
  if (mediaItem?.isPrimary) score += 30;

  if (alt) score += 8;
  if (!url.includes(".png")) score += 4; // product jpgs often look more natural
  if (!url.includes("file_")) score += 3; // avoid random uploaded looking assets sometimes

  return score;
};

const scoreProductForCollection = (product = {}, collection = {}) => {
  let score = 0;

  const text = getProductText(product);
  const slug = String(collection?.slug || "");
  const keywords = collectionKeywordMap[slug] || [];

  if (keywords.length) {
    keywords.forEach((keyword) => {
      if (text.includes(normalize(keyword))) score += 18;
    });
  }

  if (product?.isFeatured) score += 20;
  if (product?.isBestSeller) score += 25;
  score += Math.min(Number(product?.soldCount || 0), 50);
  score += Math.min(Number(product?.effectiveDiscountPercent || 0), 30);

  if (text.includes(normalize(collection?.name || ""))) score += 20;

  return score;
};

const pickBestImageFromProduct = (product = {}) => {
  const media = Array.isArray(product.media)
    ? product.media.filter((item) => item?.type === "image" && (item?.secureUrl || item?.url))
    : [];

  if (!media.length) return "";

  const ranked = media
    .map((item, index) => ({
      item,
      score: scoreMediaForHero(item, index),
    }))
    .sort((a, b) => b.score - a.score);

  return getImageUrl(ranked[0]?.item);
};

const pickBestProductForCollection = (products = [], collection = {}) => {
  const ranked = products
    .map((product) => ({
      product,
      score:
        scoreProductForCollection(product, collection) +
        (pickBestImageFromProduct(product) ? 40 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.product || null;
};

const main = async () => {
  const overwrite = process.argv.includes("--overwrite");
  const dryRun = process.argv.includes("--dry-run");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");

    const collections = await Collection.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });

    for (const collection of collections) {
      if (!overwrite && collection.image && collection.bannerImage) {
        console.log(`⏭️ Skipped ${collection.name} (already has image + banner)`);
        continue;
      }

      const productCodes = (Array.isArray(collection.productCodes)
        ? collection.productCodes
        : []
      )
        .map(normalizeCode)
        .filter(Boolean);

      if (!productCodes.length) {
        console.log(`⚠️ ${collection.name}: no product codes found`);
        continue;
      }

      const products = await Product.find({
        productCode: { $in: productCodes },
        status: "active",
      }).lean();

      if (!products.length) {
        console.log(`⚠️ ${collection.name}: no active mapped products found`);
        continue;
      }

      const bestProduct = pickBestProductForCollection(products, collection);

      if (!bestProduct) {
        console.log(`⚠️ ${collection.name}: no usable product found`);
        continue;
      }

      const bestImage = pickBestImageFromProduct(bestProduct);

      if (!bestImage) {
        console.log(`⚠️ ${collection.name}: no usable image found`);
        continue;
      }

      console.log(`\n🖼️ ${collection.name}`);
      console.log(`   Product: ${bestProduct.name}`);
      console.log(`   Code: ${bestProduct.productCode}`);
      console.log(`   Image: ${bestImage}`);

      if (!dryRun) {
        if (overwrite || !collection.image) {
          collection.image = bestImage;
        }

        if (overwrite || !collection.bannerImage) {
          collection.bannerImage = bestImage;
        }

        await collection.save();
      }
    }

    console.log(dryRun ? "\n🧪 Dry run complete" : "\n✅ Better collection images assigned");
    process.exit(0);
  } catch (error) {
    console.error("❌ assignBetterCollectionImages error:", error);
    process.exit(1);
  }
};

main();