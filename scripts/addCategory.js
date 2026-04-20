import "dotenv/config";
import mongoose from "mongoose";
import Category from "../Category/Category.js";

const MONGODB_URI = process.env.MONGODB_URI;

const categories = [
  {
    name: "Tripods & Support",
    description: "Tripods, monopods, light stands and support gear.",
    shortDescription: "Support gear for cameras, phones and studio setup.",
    icon: "tripod",
    color: "#111111",
    tags: ["tripod", "support", "stand", "monopod"],
    sortOrder: 1,
    isFeatured: true,
    isActive: true,
    subcategories: [
      { name: "Tripods", tags: ["camera tripod", "mobile tripod"], sortOrder: 1 },
      { name: "Monopods", tags: ["monopod"], sortOrder: 2 },
      { name: "Flexible Tripods", tags: ["gorilla tripod", "flexible tripod"], sortOrder: 3 },
      { name: "Light Stands", tags: ["light stand"], sortOrder: 4 },
      { name: "Boom Arms", tags: ["boom arm"], sortOrder: 5 },
      { name: "Tripod Heads", tags: ["ball head", "tripod head"], sortOrder: 6 },
      { name: "Quick Release Plates", tags: ["quick release"], sortOrder: 7 },
    ],
  },
  {
    name: "Lighting Equipment",
    description: "Lighting solutions for studio, creators and video shoots.",
    shortDescription: "Lights for creators, photographers and studios.",
    icon: "lightbulb",
    color: "#1f2937",
    tags: ["lighting", "ring light", "led light", "studio light"],
    sortOrder: 2,
    isFeatured: true,
    isActive: true,
    subcategories: [
      { name: "Ring Lights", tags: ["ring light"], sortOrder: 1 },
      { name: "LED Video Lights", tags: ["led light", "video light"], sortOrder: 2 },
      { name: "Panel Lights", tags: ["panel light"], sortOrder: 3 },
      { name: "COB Lights", tags: ["cob light"], sortOrder: 4 },
      { name: "Studio Lights", tags: ["studio light"], sortOrder: 5 },
      { name: "On-Camera Lights", tags: ["camera light"], sortOrder: 6 },
      { name: "RGB Lights", tags: ["rgb light"], sortOrder: 7 },
    ],
  },
  {
    name: "Light Modifiers",
    description: "Tools to shape, soften and control light.",
    shortDescription: "Softening and shaping tools for lights.",
    icon: "sun",
    color: "#374151",
    tags: ["softbox", "umbrella", "reflector", "diffuser"],
    sortOrder: 3,
    isFeatured: true,
    isActive: true,
    subcategories: [
      { name: "Softboxes", tags: ["softbox"], sortOrder: 1 },
      { name: "Umbrellas", tags: ["studio umbrella"], sortOrder: 2 },
      { name: "Reflectors", tags: ["reflector"], sortOrder: 3 },
      { name: "Diffusers", tags: ["diffuser"], sortOrder: 4 },
      { name: "Beauty Dishes", tags: ["beauty dish"], sortOrder: 5 },
      { name: "Snoots", tags: ["snoot"], sortOrder: 6 },
      { name: "Grids", tags: ["grid"], sortOrder: 7 },
    ],
  },
  {
    name: "Audio Equipment",
    description: "Microphones and creator audio accessories.",
    shortDescription: "Audio gear for reels, shoots and podcasts.",
    icon: "mic",
    color: "#0f172a",
    tags: ["microphone", "audio", "wireless mic", "lavalier"],
    sortOrder: 4,
    isFeatured: true,
    isActive: true,
    subcategories: [
      { name: "Lavalier Microphones", tags: ["lavalier mic"], sortOrder: 1 },
      { name: "Shotgun Microphones", tags: ["shotgun mic"], sortOrder: 2 },
      { name: "Wireless Microphones", tags: ["wireless mic"], sortOrder: 3 },
      { name: "USB Microphones", tags: ["usb mic"], sortOrder: 4 },
      { name: "Audio Interfaces", tags: ["audio interface"], sortOrder: 5 },
      { name: "Mic Stands", tags: ["mic stand"], sortOrder: 6 },
    ],
  },
  {
    name: "Mobile & Vlogging Accessories",
    description: "Phone-first creator gear and vlogging accessories.",
    shortDescription: "Mobile creator gear and vlogging setup.",
    icon: "smartphone",
    color: "#111827",
    tags: ["mobile holder", "vlogging", "phone rig", "selfie stick"],
    sortOrder: 5,
    isFeatured: true,
    isActive: true,
    subcategories: [
      { name: "Mobile Holders", tags: ["mobile holder"], sortOrder: 1 },
      { name: "Phone Mounts", tags: ["phone mount"], sortOrder: 2 },
      { name: "Vlogging Kits", tags: ["vlogging kit"], sortOrder: 3 },
      { name: "Selfie Sticks", tags: ["selfie stick"], sortOrder: 4 },
      { name: "Smartphone Rigs", tags: ["phone rig"], sortOrder: 5 },
      { name: "Cold Shoe Mounts", tags: ["cold shoe"], sortOrder: 6 },
    ],
  },
  {
    name: "Camera Accessories",
    description: "Essential camera power, storage and maintenance accessories.",
    shortDescription: "Camera essentials and utility accessories.",
    icon: "camera",
    color: "#1e293b",
    tags: ["battery", "charger", "memory card", "lens filter"],
    sortOrder: 6,
    isFeatured: true,
    isActive: true,
    subcategories: [
      { name: "Batteries", tags: ["camera battery"], sortOrder: 1 },
      { name: "Battery Chargers", tags: ["battery charger"], sortOrder: 2 },
      { name: "Dummy Batteries", tags: ["dummy battery"], sortOrder: 3 },
      { name: "Memory Cards", tags: ["sd card", "memory card"], sortOrder: 4 },
      { name: "Card Readers", tags: ["card reader"], sortOrder: 5 },
      { name: "Lens Filters", tags: ["uv filter", "nd filter"], sortOrder: 6 },
      { name: "Lens Caps", tags: ["lens cap"], sortOrder: 7 },
      { name: "Cleaning Kits", tags: ["camera cleaning kit"], sortOrder: 8 },
    ],
  },
  {
    name: "Mounts & Rigging",
    description: "Mounting and rigging accessories for cameras and action setups.",
    shortDescription: "Mounts, clamps and rigging gear.",
    icon: "clamp",
    color: "#334155",
    tags: ["cage", "clamp", "mount", "magic arm"],
    sortOrder: 7,
    isFeatured: false,
    isActive: true,
    subcategories: [
      { name: "Camera Cages", tags: ["camera cage"], sortOrder: 1 },
      { name: "Magic Arms", tags: ["magic arm"], sortOrder: 2 },
      { name: "Clamps", tags: ["clamp"], sortOrder: 3 },
      { name: "Suction Mounts", tags: ["suction mount"], sortOrder: 4 },
      { name: "Helmet Mounts", tags: ["helmet mount"], sortOrder: 5 },
      { name: "Chest Mounts", tags: ["chest mount"], sortOrder: 6 },
      { name: "Tripod Mount Adapters", tags: ["tripod adapter"], sortOrder: 7 },
    ],
  },
  {
    name: "Studio Setup",
    description: "Backdrops and studio background support equipment.",
    shortDescription: "Backdrop and studio arrangement essentials.",
    icon: "layout",
    color: "#475569",
    tags: ["background", "backdrop", "green screen", "studio"],
    sortOrder: 8,
    isFeatured: false,
    isActive: true,
    subcategories: [
      { name: "Background Stands", tags: ["background stand"], sortOrder: 1 },
      { name: "Backdrops", tags: ["backdrop"], sortOrder: 2 },
      { name: "Green Screens", tags: ["green screen"], sortOrder: 3 },
      { name: "Background Rolls", tags: ["background roll"], sortOrder: 4 },
      { name: "Table Top Setup", tags: ["table top"], sortOrder: 5 },
    ],
  },
  {
    name: "Bags & Storage",
    description: "Carrying and storage solutions for photography gear.",
    shortDescription: "Storage and carry solutions for gear.",
    icon: "briefcase",
    color: "#64748b",
    tags: ["camera bag", "case", "backpack", "storage"],
    sortOrder: 9,
    isFeatured: false,
    isActive: true,
    subcategories: [
      { name: "Camera Bags", tags: ["camera bag"], sortOrder: 1 },
      { name: "Backpack Bags", tags: ["camera backpack"], sortOrder: 2 },
      { name: "Hard Cases", tags: ["hard case"], sortOrder: 3 },
      { name: "Pouches", tags: ["pouch"], sortOrder: 4 },
    ],
  },
  {
    name: "Streaming & Creator Gear",
    description: "Streaming, desk and podcast creator accessories.",
    shortDescription: "Desk setup and streaming creator essentials.",
    icon: "monitor",
    color: "#0f172a",
    tags: ["streaming", "webcam light", "podcast", "creator bundle"],
    sortOrder: 10,
    isFeatured: false,
    isActive: true,
    subcategories: [
      { name: "Streaming Lights", tags: ["streaming light"], sortOrder: 1 },
      { name: "Webcam Lights", tags: ["webcam light"], sortOrder: 2 },
      { name: "Desk Mount Arms", tags: ["desk mount"], sortOrder: 3 },
      { name: "Podcast Kits", tags: ["podcast kit"], sortOrder: 4 },
      { name: "Streaming Bundles", tags: ["creator bundle"], sortOrder: 5 },
    ],
  },
  {
    name: "Power & Connectivity",
    description: "Power and cable accessories for creator setups.",
    shortDescription: "Power, adapters and cable essentials.",
    icon: "plug",
    color: "#1f2937",
    tags: ["power adapter", "cable", "usb hub", "extension board"],
    sortOrder: 11,
    isFeatured: false,
    isActive: true,
    subcategories: [
      { name: "Extension Boards", tags: ["extension board"], sortOrder: 1 },
      { name: "Power Adapters", tags: ["power adapter"], sortOrder: 2 },
      { name: "Cables", tags: ["hdmi cable", "type c cable", "aux cable"], sortOrder: 3 },
      { name: "USB Hubs", tags: ["usb hub"], sortOrder: 4 },
    ],
  },
];

const seedCategories = async () => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI missing in .env");
  }

  await mongoose.connect(MONGODB_URI);

  console.log("✅ MongoDB connected");

  let created = 0;
  let updated = 0;

  for (const item of categories) {
    const existing = await Category.findOne({ name: item.name });

    if (existing) {
      existing.name = item.name;
      existing.description = item.description || "";
      existing.shortDescription = item.shortDescription || "";
      existing.icon = item.icon || "";
      existing.color = item.color || "";
      existing.tags = item.tags || [];
      existing.sortOrder = item.sortOrder ?? 0;
      existing.isFeatured = !!item.isFeatured;
      existing.isActive = item.isActive !== false;
      existing.subcategories = item.subcategories || [];

      await existing.save();
      updated += 1;
      console.log(`♻️ Updated: ${item.name}`);
    } else {
      await Category.create(item);
      created += 1;
      console.log(`✨ Created: ${item.name}`);
    }
  }

  console.log("\n🎉 Done");
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
};

seedCategories()
  .then(async () => {
    await mongoose.connection.close();
    console.log("🔌 MongoDB disconnected");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error.message);
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
      console.log("🔌 MongoDB disconnected");
    }
    process.exit(1);
  });