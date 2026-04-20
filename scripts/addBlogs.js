import mongoose from "mongoose";
import dotenv from "dotenv";
import Blog from "../blog/blog.js";

dotenv.config();

/* =========================================================
   HELPERS
========================================================= */

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/* =========================================================
   BLOG DATA
========================================================= */

const blogs = [
  {
    title: "Best Camera Accessories Every Photographer and Creator Should Own",
    images: [
      {
        url: "https://images.pexels.com/photos/30872554/pexels-photo-30872554.jpeg?cs=srgb&dl=pexels-theonlyabdulla-30872554.jpg&fm=jpg",
        public_id: "external/pexels-camera-accessories-30872554",
      },
    ],
    content: `
      <h1>Best Camera Accessories Every Photographer and Creator Should Own</h1>

      <p>When most people think about improving their photography or video setup, they immediately think about upgrading the camera body. But in real-world shooting, the accessories you use every day often have a bigger impact on results, comfort, and consistency.</p>

      <p>A practical setup is not about buying everything. It is about choosing tools that solve actual problems. The right accessories help you shoot more confidently, work faster, protect expensive equipment, and create content that feels more polished and professional.</p>

      <h2>1. A sturdy tripod</h2>
      <p>A tripod is one of the most valuable accessories for both photographers and creators. It improves sharpness, helps in low light, supports long exposure work, and makes self-shooting much easier. It is also essential for product photography, studio content, interviews, and stable video recording.</p>

      <h2>2. Reliable lighting gear</h2>
      <p>Lighting can completely change how your photos and videos look. Even a good camera can struggle in poor lighting conditions. Soft light sources, LED panels, and modifiers help create cleaner skin tones, stronger product images, and better overall visual quality.</p>

      <h2>3. Spare batteries and memory cards</h2>
      <p>These may not look exciting, but they are some of the most important accessories in any setup. Running out of battery or storage in the middle of a shoot can ruin momentum and make you miss important moments.</p>

      <h2>4. Good audio support for video</h2>
      <p>If you make video content, sound matters just as much as visuals. A basic microphone setup can dramatically improve the professionalism of your videos and make your content easier to watch.</p>

      <h2>5. Storage and protection</h2>
      <p>Camera bags, organizers, and protective storage help extend the life of your equipment. They also make your workflow smoother because everything has a proper place.</p>

      <h2>Final thoughts</h2>
      <p>The best camera accessories are not the most expensive ones. They are the ones that help you shoot better, move faster, and stay more consistent. Build your kit around practical needs, and your setup will become stronger over time without unnecessary spending.</p>
    `,
    hashtags: [
      "camera accessories",
      "photography gear",
      "creator essentials",
      "best camera accessories",
      "content creation setup",
    ],
    isPublished: true,
  },

  {
    title: "How to Choose the Right Tripod for Photography and Video Work",
    images: [
      {
        url: "https://images.pexels.com/photos/30670953/pexels-photo-30670953.jpeg?cs=srgb&dl=pexels-amar-30670953.jpg&fm=jpg",
        public_id: "external/pexels-tripod-30670953",
      },
    ],
    content: `
      <h1>How to Choose the Right Tripod for Photography and Video Work</h1>

      <p>A tripod may seem like a simple accessory, but choosing the right one can improve both quality and workflow. Whether you shoot portraits, products, travel content, talking-head videos, or studio work, the right tripod gives you better control and consistency.</p>

      <p>Many people buy a tripod based only on budget, but that often leads to frustration later. A weak tripod feels unstable, struggles under weight, and becomes more of a problem than a solution. That is why your choice should depend on how and where you actually shoot.</p>

      <h2>Know your shooting style</h2>
      <p>If you travel often, portability matters a lot. If you mostly work in a studio, stability and height may matter more than light weight. If you make videos, the quality of movement becomes important too, especially if you need smooth panning and tilting.</p>

      <h2>Check weight support</h2>
      <p>Your tripod should comfortably support your camera body, lens, and any extra accessories. A setup that is too heavy for the tripod becomes less reliable and less safe.</p>

      <h2>Material and build quality matter</h2>
      <p>Aluminium tripods are durable and budget friendly. Carbon fiber tripods are lighter and easier for travel, though usually more expensive. Strong locks, solid legs, and a dependable head all contribute to long-term usability.</p>

      <h2>Choose the right head</h2>
      <p>Ball heads are quick and flexible for photography. Fluid heads are usually better for video because they allow smoother movement. For hybrid creators, this choice can affect the entire shooting experience.</p>

      <h2>Final thoughts</h2>
      <p>A tripod is not just a stand. It is part of your image-making process. A well-chosen tripod helps you shoot sharper, work more comfortably, and create with more control. It is one of the best long-term accessories you can own.</p>
    `,
    hashtags: [
      "tripod guide",
      "best tripod",
      "camera tripod",
      "video tripod",
      "photography accessories",
    ],
    isPublished: true,
  },

  {
    title: "Best Lighting Setup for Product Photography at Home",
    images: [
      {
        url: "https://images.pexels.com/photos/5878878/pexels-photo-5878878.jpeg?cs=srgb&dl=pexels-cottonbro-5878878.jpg&fm=jpg",
        public_id: "external/pexels-product-lighting-5878878",
      },
    ],
    content: `
      <h1>Best Lighting Setup for Product Photography at Home</h1>

      <p>Good product photography can completely change how customers see your brand. Clean and well-lit product images build trust, make products look more premium, and help people understand what they are buying. The best part is that you do not need a huge studio to get strong results.</p>

      <p>A home setup can work extremely well when it is built around the right fundamentals. The goal is not to create a complicated space. The goal is to create a repeatable setup with controlled light, clean backgrounds, and stable framing.</p>

      <h2>Use soft light wherever possible</h2>
      <p>Soft lighting is usually best for product photography because it reduces harsh shadows and reflections. This is especially useful for accessories, glossy products, electronics, and other items that can easily show unwanted glare.</p>

      <h2>Keep the setup simple</h2>
      <p>A basic two-light setup is often enough. One light acts as the main source and defines the shape of the product. The second light or a reflector helps soften dark shadows and create a cleaner final image.</p>

      <h2>Background and consistency matter</h2>
      <p>Neutral backgrounds such as white, grey, beige, or black help products stand out. Consistency in angles, light, and framing makes your ecommerce catalog feel more premium and organized.</p>

      <h2>Use a tripod for repeatable results</h2>
      <p>A tripod helps maintain the same angle and composition across many product shots. This saves time during editing and keeps your product pages looking clean and uniform.</p>

      <h2>Final thoughts</h2>
      <p>The best home product photography setup is one that is controlled, simple, and repeatable. Once your lighting, camera stability, and background are handled properly, even a small room can produce very professional-looking product images.</p>
    `,
    hashtags: [
      "product photography",
      "home studio setup",
      "lighting setup",
      "ecommerce photography",
      "product shoot tips",
    ],
    isPublished: true,
  },

  {
    title: "Must Have Audio Gear for Content Creators and Video Makers",
    images: [
      {
        url: "https://images.pexels.com/photos/6878199/pexels-photo-6878199.jpeg?cs=srgb&dl=pexels-cottonbro-6878199.jpg&fm=jpg",
        public_id: "external/pexels-audio-6878199",
      },
    ],
    content: `
      <h1>Must Have Audio Gear for Content Creators and Video Makers</h1>

      <p>Good visuals attract attention, but good audio keeps people watching. Clear sound makes your content feel professional, improves trust, and creates a much better viewer experience. That is why audio gear is one of the smartest upgrades a creator can make.</p>

      <p>Many creators focus heavily on cameras, lenses, and editing, but weak audio quickly becomes the thing that lowers the overall quality of the content. A great-looking video with poor sound often feels unfinished and difficult to watch.</p>

      <h2>A microphone is one of the best first upgrades</h2>
      <p>A proper microphone can instantly improve your content. Depending on your style, you may prefer a shotgun mic, lavalier mic, wireless system, or on-camera microphone. The best choice depends on whether you shoot solo, outdoors, interviews, podcasts, or reels.</p>

      <h2>Monitoring helps avoid mistakes</h2>
      <p>Headphones are just as useful as the microphone itself. They help you catch background noise, weak levels, loose cables, and distortion before you finish the shoot and discover the problem later.</p>

      <h2>Your room affects sound too</h2>
      <p>Even a good microphone can struggle in a noisy or echo-heavy room. Curtains, rugs, soft furniture, and quieter spaces can make a noticeable difference in the quality of your recording.</p>

      <h2>Keep backups ready</h2>
      <p>Extra batteries, memory cards, backup cables, and quick sound checks are small habits that protect your work. Reliable creators prepare for technical issues before they happen.</p>

      <h2>Final thoughts</h2>
      <p>If you want your videos to feel more professional, audio should never be ignored. Better sound improves retention, trust, and overall content value. For serious creators, good audio gear is not optional. It is part of the foundation.</p>
    `,
    hashtags: [
      "audio gear",
      "creator microphone",
      "video audio",
      "content creator setup",
      "best mic for creators",
    ],
    isPublished: true,
  },

  {
    title: "How to Build a Beginner Photography Setup Without Overspending",
    images: [
      {
        url: "https://images.pexels.com/photos/30872554/pexels-photo-30872554.jpeg?cs=srgb&dl=pexels-theonlyabdulla-30872554.jpg&fm=jpg",
        public_id: "external/pexels-beginner-photo-30872554",
      },
    ],
    content: `
      <h1>How to Build a Beginner Photography Setup Without Overspending</h1>

      <p>Starting photography can feel expensive because there is always another piece of gear being recommended online. But beginners do not need everything at once. A strong beginner setup is built around practical tools that actually help you learn and shoot more often.</p>

      <p>The smartest approach is to start small, understand your needs, and upgrade only when your work demands it. This saves money and helps you focus on skill instead of constant shopping.</p>

      <h2>Start with a practical camera and lens</h2>
      <p>You do not need the most expensive camera to create strong images. A reliable entry-level or mid-range camera with one versatile lens is enough to learn composition, lighting, framing, exposure, and consistency.</p>

      <h2>Buy real essentials first</h2>
      <p>Before spending on too many extras, focus on the basics: spare battery, memory card, tripod, and a safe bag. These are the items that actually support regular shooting.</p>

      <h2>Learn lighting early</h2>
      <p>If you shoot indoors, portraits, or products, even a simple light can make a big difference. Understanding light is one of the fastest ways to improve your photos.</p>

      <h2>Avoid buying for excitement alone</h2>
      <p>Beginners often overspend on accessories they rarely use. It is better to shoot more, identify real problems in your workflow, and then buy solutions for those problems.</p>

      <h2>Final thoughts</h2>
      <p>A good beginner setup should feel simple, useful, and motivating. Build around essentials, focus on practice, and grow your gear slowly. That approach gives you better skill development and a much more sustainable start.</p>
    `,
    hashtags: [
      "beginner photography",
      "budget camera setup",
      "photography for beginners",
      "camera essentials",
      "budget creator gear",
    ],
    isPublished: true,
  },

  {
    title: "Studio Setup Essentials for Better Photos Videos and Content Creation",
    images: [
      {
        url: "https://images.pexels.com/photos/23991039/pexels-photo-23991039.jpeg?cs=srgb&dl=pexels-marceloverfe-23991039.jpg&fm=jpg",
        public_id: "external/pexels-studio-23991039",
      },
    ],
    content: `
      <h1>Studio Setup Essentials for Better Photos Videos and Content Creation</h1>

      <p>A well-planned studio setup makes content creation faster, cleaner, and more consistent. Whether you are shooting products, portraits, tutorials, interviews, or social media content, a good studio helps you create better work with less guesswork.</p>

      <p>You do not need a huge or overly expensive space. Even a compact studio can look professional when the core elements are handled well: lighting, support equipment, background control, and organization.</p>

      <h2>Lighting comes first</h2>
      <p>Controlled lighting is the base of a strong studio. It helps you create repeatable results and makes your photos and videos look more polished. Soft light is especially useful for products, portraits, and talking-head content.</p>

      <h2>Use stable support gear</h2>
      <p>Tripods, stands, clamps, reflectors, and mounting tools make your setup safer and easier to repeat. These tools save time and reduce frustration when you need consistency across multiple shoots.</p>

      <h2>Background control matters</h2>
      <p>A clean background makes your subject stand out and gives the frame a more intentional look. Neutral backdrops, textured panels, or simple styled corners can all work depending on the content you create.</p>

      <h2>Stay organized</h2>
      <p>Cables, chargers, batteries, and memory cards should all have a fixed place. Good organization improves speed, reduces clutter, and makes the studio feel more professional.</p>

      <h2>Final thoughts</h2>
      <p>The best studio setup is not the one with the most gear. It is the one that supports your process. When lighting, framing, and organization are handled well, even a small studio can produce high-quality and professional content.</p>
    `,
    hashtags: [
      "studio setup",
      "content creation studio",
      "photo studio essentials",
      "video studio setup",
      "creator workspace",
    ],
    isPublished: true,
  },

  {
    title: "Why a Good Camera Bag and Storage System Matters for Every Creator",
    images: [
      {
        url: "https://images.pexels.com/photos/13071302/pexels-photo-13071302.jpeg?cs=srgb&dl=pexels-isabella-mendes-107313-13071302.jpg&fm=jpg",
        public_id: "external/pexels-camera-bag-13071302",
      },
    ],
    content: `
      <h1>Why a Good Camera Bag and Storage System Matters for Every Creator</h1>

      <p>Once your photography or video setup starts growing, carrying and storing gear properly becomes a serious part of your workflow. A good camera bag is not only about transport. It protects your equipment, keeps things organized, and helps you work faster when time matters.</p>

      <p>Many creators buy cameras and lenses first and think about storage later. But poor storage leads to misplaced accessories, slower setups, and unnecessary risk during travel or on-location shoots.</p>

      <h2>Protection is essential</h2>
      <p>A quality camera bag protects your equipment from dust, impact, and everyday wear. That matters even more when you carry lenses, batteries, drives, chargers, microphones, and small accessories together.</p>

      <h2>Organization improves workflow</h2>
      <p>When every item has a proper place, you spend less time searching and more time creating. Organized storage also lowers the chance of forgetting small but important items before a shoot.</p>

      <h2>Comfort matters too</h2>
      <p>If you carry gear regularly, the way a bag feels on your shoulder or back matters a lot. A better-designed bag reduces fatigue and makes long days more manageable.</p>

      <h2>Home storage is part of the system</h2>
      <p>Good workflow continues after the shoot is over. Keeping your gear stored properly at home makes charging, packing, and preparing for the next project much easier.</p>

      <h2>Final thoughts</h2>
      <p>A camera bag and storage system may not be the flashiest part of your setup, but they are among the most practical. They protect your investment, support your routine, and make you a more organized creator overall.</p>
    `,
    hashtags: [
      "camera bag",
      "gear storage",
      "photography accessories",
      "camera protection",
      "creator essentials",
    ],
    isPublished: true,
  },
];

/* =========================================================
   SCRIPT
========================================================= */

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    let created = 0;
    let updated = 0;

    for (const blog of blogs) {
      const slug = slugify(blog.title);

      const payload = {
        ...blog,
        slug,
      };

      const existing = await Blog.findOne({ slug });

      if (existing) {
        await Blog.updateOne({ _id: existing._id }, { $set: payload });
        updated += 1;
        console.log(`♻️ Updated: ${blog.title}`);
      } else {
        await Blog.create(payload);
        created += 1;
        console.log(`✨ Created: ${blog.title}`);
      }
    }

    console.log("\\n🎉 Blogs seeded successfully");
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB disconnected");
  }
};

run();