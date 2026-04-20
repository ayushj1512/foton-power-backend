import mongoose from "mongoose";

const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeCode = (value = "") => {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!raw) return "";
  if (/^\d+$/.test(raw)) return raw.padStart(5, "0");
  return raw;
};

const clean = (value = "") => String(value || "").trim();

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 120,
    },

    slug: {
      type: String,
      trim: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    bannerImage: {
      type: String,
      trim: true,
      default: "",
    },

    productCodes: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    showOnHomepage: {
      type: Boolean,
      default: false,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    seo: {
      title: {
        type: String,
        trim: true,
        default: "",
        maxlength: 70,
      },
      description: {
        type: String,
        trim: true,
        default: "",
        maxlength: 160,
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

collectionSchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  if (!this.seo) {
    this.seo = {};
  }

  if (!this.seo.title && this.name) {
    this.seo.title = this.name;
  }
});

collectionSchema.pre("save", function () {
  if (this.isModified("name") && !this.isModified("slug")) {
    this.slug = slugify(this.name);
  }

  if (Array.isArray(this.productCodes)) {
    this.productCodes = [
      ...new Set(this.productCodes.map((code) => normalizeCode(code)).filter(Boolean)),
    ];
  }

  if (!this.seo) {
    this.seo = {};
  }

  this.seo.title = clean(this.seo.title || this.name);
  this.seo.description = clean(this.seo.description);

  if (Array.isArray(this.seo.keywords)) {
    this.seo.keywords = [
      ...new Set(this.seo.keywords.map((item) => clean(item)).filter(Boolean)),
    ];
  } else {
    this.seo.keywords = [];
  }
});

collectionSchema.index({ isActive: 1, sortOrder: 1 });
collectionSchema.index({ showOnHomepage: 1, sortOrder: 1 });
collectionSchema.index({ isFeatured: 1, sortOrder: 1 });
collectionSchema.index({ productCodes: 1 });

const Collection =
  mongoose.models.Collection ||
  mongoose.model("Collection", collectionSchema);

export default Collection;