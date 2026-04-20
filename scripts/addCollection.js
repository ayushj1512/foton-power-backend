import dotenv from "dotenv";
import mongoose from "mongoose";
import Collection from "../collection/collection.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const collections = [
  {
    name: "Creator Essentials",
    description:
      "Curated essentials for creators, photographers, and content makers to build an efficient setup.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: true,
    sortOrder: 1,
    seo: {
      title: "Creator Essentials | Miray",
      description:
        "Shop creator essentials including must-have gear and setup accessories for photography, video, and content creation.",
      keywords: ["creator essentials", "content creator gear", "creator setup"],
    },
  },
  {
    name: "Studio Setup",
    description:
      "Professional studio setup collection for lighting, support, modifiers, and creator-focused equipment.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: true,
    sortOrder: 2,
    seo: {
      title: "Studio Setup | Miray",
      description:
        "Explore studio setup essentials including lighting, support gear, and production-ready accessories.",
      keywords: ["studio setup", "studio gear", "photography studio equipment"],
    },
  },
  {
    name: "On-The-Go Gear",
    description:
      "Portable and travel-friendly gear for creators who shoot outdoors, travel often, or need lightweight setups.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: true,
    sortOrder: 3,
    seo: {
      title: "On-The-Go Gear | Miray",
      description:
        "Discover travel-friendly gear and portable accessories for creators, vloggers, and photographers.",
      keywords: ["portable creator gear", "travel gear", "on the go setup"],
    },
  },
  {
    name: "Bundles & Kits",
    description:
      "Handpicked bundles and kits designed to simplify setup building for creators and studios.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: true,
    sortOrder: 4,
    seo: {
      title: "Bundles & Kits | Miray",
      description:
        "Shop curated bundles and kits for creators, studios, and content production needs.",
      keywords: ["creator bundles", "gear kits", "studio kits"],
    },
  },

  {
    name: "Best Sellers",
    description:
      "Most loved and frequently purchased products across creator and photography categories.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: true,
    sortOrder: 5,
    seo: {
      title: "Best Sellers | Miray",
      description:
        "Browse our best-selling creator gear, studio accessories, and photography essentials.",
      keywords: ["best sellers", "top products", "popular creator gear"],
    },
  },
  {
    name: "Trending Now",
    description:
      "Currently trending products popular among creators, photographers, and video makers.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: true,
    sortOrder: 6,
    seo: {
      title: "Trending Now | Miray",
      description:
        "Explore trending gear and accessories loved by creators and photography enthusiasts.",
      keywords: ["trending gear", "popular gear", "creator trends"],
    },
  },
  {
    name: "New Arrivals",
    description:
      "Freshly added products and latest gear for creators, photographers, and studios.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: true,
    sortOrder: 7,
    seo: {
      title: "New Arrivals | Miray",
      description:
        "Discover the latest arrivals in creator gear, studio accessories, and photography essentials.",
      keywords: ["new arrivals", "latest gear", "new creator accessories"],
    },
  },
  {
    name: "Hot Deals",
    description:
      "Best deals and value-focused collections for creators and studios looking to save more.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: true,
    sortOrder: 8,
    seo: {
      title: "Hot Deals | Miray",
      description:
        "Shop hot deals on creator gear, photography accessories, and studio essentials.",
      keywords: ["hot deals", "creator discounts", "gear offers"],
    },
  },

  {
    name: "Lighting Gear",
    description:
      "Lighting products including studio lights, portable lights, and accessories for better creative output.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: false,
    sortOrder: 9,
    seo: {
      title: "Lighting Gear | Miray",
      description:
        "Shop lighting gear for photography, video shoots, studio setups, and creator workflows.",
      keywords: ["lighting gear", "studio lights", "video lighting"],
    },
  },
  {
    name: "Audio Gear",
    description:
      "Audio gear collection featuring microphones and useful accessories for crisp and clear sound.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: false,
    sortOrder: 10,
    seo: {
      title: "Audio Gear | Miray",
      description:
        "Explore audio gear including microphones and creator accessories for better recording quality.",
      keywords: ["audio gear", "microphones", "creator audio setup"],
    },
  },
  {
    name: "Vlogging Gear",
    description:
      "Must-have gear for vloggers including mobile accessories, lights, mounts, and creator tools.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: false,
    sortOrder: 11,
    seo: {
      title: "Vlogging Gear | Miray",
      description:
        "Shop vlogging gear for mobile creators, YouTubers, and video-first content production.",
      keywords: ["vlogging gear", "vlogger setup", "mobile creator gear"],
    },
  },
  {
    name: "Streaming Setup",
    description:
      "Gear and accessories for streamers, live creators, and modern digital production setups.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: false,
    sortOrder: 12,
    seo: {
      title: "Streaming Setup | Miray",
      description:
        "Build your streaming setup with creator-friendly tools, accessories, and supporting gear.",
      keywords: ["streaming setup", "live creator gear", "streaming accessories"],
    },
  },
  {
    name: "Camera Accessories",
    description:
      "Camera support and accessory collection for smoother shooting, storage, and equipment handling.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: false,
    sortOrder: 13,
    seo: {
      title: "Camera Accessories | Miray",
      description:
        "Browse camera accessories for everyday shoots, studio use, and creator workflows.",
      keywords: ["camera accessories", "camera gear", "photography accessories"],
    },
  },
  {
    name: "Mobile Creator Gear",
    description:
      "Creator-first accessories designed for mobile shooting, reels, short videos, and portable creation.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: false,
    sortOrder: 14,
    seo: {
      title: "Mobile Creator Gear | Miray",
      description:
        "Find mobile creator gear for reels, vlogging, smartphone shooting, and content creation.",
      keywords: ["mobile creator gear", "smartphone accessories", "reels setup"],
    },
  },
  {
    name: "Power & Connectivity",
    description:
      "Power, cables, and connectivity essentials that keep creator workflows running smoothly.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: false,
    sortOrder: 15,
    seo: {
      title: "Power & Connectivity | Miray",
      description:
        "Shop power and connectivity essentials for studio, streaming, and creator setups.",
      keywords: ["power and connectivity", "creator cables", "setup accessories"],
    },
  },
  {
    name: "Bags & Storage",
    description:
      "Storage and carry solutions for creators who want safe, compact, and organized equipment handling.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: false,
    sortOrder: 16,
    seo: {
      title: "Bags & Storage | Miray",
      description:
        "Discover bags and storage solutions for photography gear, creator tools, and accessories.",
      keywords: ["bags and storage", "gear bags", "equipment storage"],
    },
  },

  {
    name: "YouTube Starter Kit",
    description:
      "A practical collection for YouTube creators starting with recording, lighting, and setup gear.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: false,
    sortOrder: 17,
    seo: {
      title: "YouTube Starter Kit | Miray",
      description:
        "Build your YouTube starter kit with beginner-friendly creator gear and setup essentials.",
      keywords: ["youtube starter kit", "youtube gear", "beginner creator setup"],
    },
  },
  {
    name: "Reels Creator Kit",
    description:
      "Compact and practical setup collection for reels, short-form content, and social-first creation.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: false,
    sortOrder: 18,
    seo: {
      title: "Reels Creator Kit | Miray",
      description:
        "Shop reels creator kit essentials for quick, mobile-friendly, and high-impact content creation.",
      keywords: ["reels creator kit", "instagram reels gear", "short video setup"],
    },
  },
  {
    name: "Podcast Setup",
    description:
      "Audio-focused collection for podcasters and creators who need a clean and reliable recording setup.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: false,
    showOnHomepage: false,
    sortOrder: 19,
    seo: {
      title: "Podcast Setup | Miray",
      description:
        "Explore podcast setup essentials for audio recording, creator workflows, and studio-friendly production.",
      keywords: ["podcast setup", "podcast gear", "recording setup"],
    },
  },
  {
    name: "Product Photography Kit",
    description:
      "Curated setup for product photography, e-commerce shoots, and studio-style product content.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: false,
    sortOrder: 20,
    seo: {
      title: "Product Photography Kit | Miray",
      description:
        "Shop product photography kit essentials for e-commerce, catalog, and commercial product shoots.",
      keywords: [
        "product photography kit",
        "ecommerce photography",
        "product shoot gear",
      ],
    },
  },
  {
    name: "Home Studio Kit",
    description:
      "All-in-one style collection for building a compact home studio for content creation and shoots.",
    image: "",
    bannerImage: "",
    isActive: true,
    isFeatured: true,
    showOnHomepage: false,
    sortOrder: 21,
    seo: {
      title: "Home Studio Kit | Miray",
      description:
        "Build a home studio kit with practical creator gear, lighting accessories, and production essentials.",
      keywords: ["home studio kit", "creator studio", "home content setup"],
    },
  },
];

const connectDB = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB connected");
};

const seedCollections = async () => {
  let created = 0;
  let updated = 0;

  for (const item of collections) {
    const existing = await Collection.findOne({
      $or: [{ name: item.name }, { slug: item.slug }],
    });

    if (existing) {
      existing.name = item.name;
      existing.description = item.description || "";
      existing.image = item.image || "";
      existing.bannerImage = item.bannerImage || "";
      existing.productCodes = Array.isArray(item.productCodes) ? item.productCodes : [];
      existing.isActive = typeof item.isActive === "boolean" ? item.isActive : true;
      existing.isFeatured =
        typeof item.isFeatured === "boolean" ? item.isFeatured : false;
      existing.showOnHomepage =
        typeof item.showOnHomepage === "boolean" ? item.showOnHomepage : false;
      existing.sortOrder =
        Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 0;
      existing.seo = item.seo || {
        title: item.name,
        description: "",
        keywords: [],
      };

      await existing.save();
      updated += 1;
      console.log(`♻️ Updated: ${item.name}`);
      continue;
    }

    await Collection.create({
      ...item,
      productCodes: Array.isArray(item.productCodes) ? item.productCodes : [],
    });

    created += 1;
    console.log(`✨ Created: ${item.name}`);
  }

  console.log("\n🎉 Done");
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
};

const run = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await connectDB();
    await seedCollections();
  } catch (error) {
    console.error("❌ Script failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB disconnected");
  }
};

run();