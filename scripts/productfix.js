import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Product from "../product/product.js";
import Category from "../category/category.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing in .env");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry");

const clean = (v = "") => String(v || "").trim();
const lower = (v = "") => clean(v).toLowerCase();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

function toSearchText(product = {}) {
  return lower([
    product.name,
    product.shortDescription,
    product.description,
    product.color,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ].join(" "));
}

function getKeywordScore(text, keywords = []) {
  if (!text || !keywords.length) return 0;

  let score = 0;
  const seen = new Set();

  for (const raw of keywords) {
    const keyword = lower(raw);
    if (!keyword || seen.has(keyword)) continue;
    seen.add(keyword);

    if (text.includes(keyword)) {
      score += keyword.length > 8 ? 3 : 2;
    }
  }

  return score;
}

function buildSubcategoryKeywords(subcategory = {}) {
  return [
    subcategory.name,
    subcategory.slug,
    subcategory.code,
    ...(Array.isArray(subcategory.tags) ? subcategory.tags : []),
  ]
    .map(clean)
    .filter(Boolean);
}

function inferSubcategory(product, categoryDoc) {
  if (!categoryDoc?.subcategories?.length) return null;

  const text = toSearchText(product);
  let best = null;
  let bestScore = 0;

  for (const sub of categoryDoc.subcategories) {
    const keywords = buildSubcategoryKeywords(sub);
    const score = getKeywordScore(text, keywords);

    if (score > bestScore) {
      bestScore = score;
      best = sub;
    }
  }

  if (!best || bestScore <= 0) return null;
  return best;
}

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");

    const categories = await Category.find({})
      .select("_id name slug subcategories")
      .lean();

    const categoryMap = new Map(categories.map((cat) => [String(cat._id), cat]));

    const products = await Product.find({})
      .select(
        "_id name shortDescription description tags color category categoryName categorySlug subcategory subcategoryName subcategorySlug"
      );

    console.log(`📦 Total products found: ${products.length}`);
    console.log(`🧪 Dry run: ${DRY_RUN ? "YES" : "NO"}`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const product of products) {
      try {
        const categoryId =
          typeof product.category === "object" && product.category?._id
            ? String(product.category._id)
            : String(product.category || "");

        const categoryDoc = categoryMap.get(categoryId);

        if (!categoryDoc) {
          console.log(`⚠️ Skipped ${product.productCode || product._id} - category not found`);
          skipped++;
          continue;
        }

        const patch = {
          category: categoryDoc._id,
          categoryName: clean(categoryDoc.name),
          categorySlug: lower(categoryDoc.slug || categoryDoc.name),
          subcategory: null,
          subcategoryName: "",
          subcategorySlug: "",
        };

        let matchedSubcategory = null;

        if (product.subcategory && isValidObjectId(product.subcategory)) {
          matchedSubcategory =
            categoryDoc.subcategories?.find(
              (sub) => String(sub._id) === String(product.subcategory)
            ) || null;
        }

        if (!matchedSubcategory && clean(product.subcategoryName)) {
          const subName = lower(product.subcategoryName);
          matchedSubcategory =
            categoryDoc.subcategories?.find(
              (sub) =>
                lower(sub.name) === subName || lower(sub.slug) === subName
            ) || null;
        }

        if (!matchedSubcategory && clean(product.subcategorySlug)) {
          const subSlug = lower(product.subcategorySlug);
          matchedSubcategory =
            categoryDoc.subcategories?.find((sub) => lower(sub.slug) === subSlug) ||
            null;
        }

        if (!matchedSubcategory) {
          matchedSubcategory = inferSubcategory(product, categoryDoc);
        }

        if (matchedSubcategory) {
          patch.subcategory = matchedSubcategory._id;
          patch.subcategoryName = clean(matchedSubcategory.name);
          patch.subcategorySlug = lower(
            matchedSubcategory.slug || matchedSubcategory.name
          );
        }

        const hasChanges =
          String(product.category || "") !== String(patch.category || "") ||
          clean(product.categoryName) !== patch.categoryName ||
          lower(product.categorySlug) !== patch.categorySlug ||
          String(product.subcategory || "") !== String(patch.subcategory || "") ||
          clean(product.subcategoryName) !== patch.subcategoryName ||
          lower(product.subcategorySlug) !== patch.subcategorySlug;

        if (!hasChanges) {
          skipped++;
          continue;
        }

        if (DRY_RUN) {
          console.log("📝 DRY RUN", {
            productCode: product.productCode,
            name: product.name,
            categoryName: patch.categoryName,
            categorySlug: patch.categorySlug,
            subcategoryName: patch.subcategoryName || null,
            subcategorySlug: patch.subcategorySlug || null,
          });
          updated++;
          continue;
        }

        await Product.updateOne({ _id: product._id }, { $set: patch });

        console.log(
          `✅ Updated ${product.productCode || product._id} | ${patch.categoryName} | ${
            patch.subcategoryName || "No subcategory"
          }`
        );
        updated++;
      } catch (error) {
        console.log(
          `❌ Failed ${product.productCode || product._id} - ${error.message}`
        );
        failed++;
      }
    }

    console.log("\n🎉 DONE");
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
  } catch (error) {
    console.error("❌ Script failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
    process.exit(0);
  }
}

main();