import "dotenv/config";
import mongoose from "mongoose";
import Category from "../Category/Category.js";

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI / MONGO_URI in .env");
  process.exit(1);
}

const OVERWRITE = false;

const commonsFile = (fileName) =>
  `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}`;

const CATEGORY_IMAGE_MAP = {
  "tripods-support": commonsFile("Tripod with Camera.jpg"),
  "lighting-equipment": commonsFile("Photo Studio Lighting (17239897379).jpg"),
  "light-modifiers": commonsFile(
    "Still life photography studio setup with softboxes, by geishaboy500.jpg"
  ),
  "audio-equipment": commonsFile("Studio microphone with pop shield.jpg"),
  "mobile-vlogging-accessories": commonsFile(
    "MoJo-PRO smart-phone shooting platform.jpg"
  ),
  "camera-accessories": commonsFile("Camera Accessories (UG-GE).jpg"),
  "mounts-rigging": commonsFile("MoJo-PRO smart-phone shooting platform.jpg"),
  "studio-setup": commonsFile(
    "Still life photography studio setup with softboxes, by geishaboy500.jpg"
  ),
  "bags-storage": commonsFile("Contents of a Camera Bag.jpg"),
  "streaming-creator-gear": commonsFile("Microphone studio.jpg"),
  "power-connectivity": commonsFile("USB HUB 2.0.jpg"),
};

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB connected");

  const categories = await Category.find({}).sort({ sortOrder: 1, createdAt: 1 });

  if (!categories.length) {
    console.log("ℹ️ No categories found");
    await mongoose.disconnect();
    process.exit(0);
  }

  let updated = 0;
  let skipped = 0;

  for (const category of categories) {
    const url = CATEGORY_IMAGE_MAP[category.slug];

    if (!url) {
      console.log(`⚠️ No mapped image for: ${category.name} (${category.slug})`);
      skipped += 1;
      continue;
    }

    const hasImage = Boolean(String(category.image || "").trim());
    const hasBanner = Boolean(String(category.bannerImage || "").trim());

    if (!OVERWRITE && hasImage && hasBanner) {
      console.log(`⏭️ Skipped (already has image + banner): ${category.name}`);
      skipped += 1;
      continue;
    }

    if (OVERWRITE || !hasImage) {
      category.image = url;
    }

    if (OVERWRITE || !hasBanner) {
      category.bannerImage = url;
    }

    await category.save();

    console.log(`✅ Updated: ${category.name}`);
    updated += 1;
  }

  console.log("\n🎉 DONE");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);

  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected");
}

run().catch(async (error) => {
  console.error("❌ Script failed");
  console.error(error?.message || error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});