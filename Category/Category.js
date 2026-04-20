import mongoose from "mongoose";
import Counter from "../models/Counter.js";

const { Schema } = mongoose;

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */
const clean = (v = "") => String(v || "").trim();
const lower = (v = "") => clean(v).toLowerCase();
const upper = (v = "") => clean(v).toUpperCase();

const makeSlug = (value = "") =>
  clean(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* -------------------------------------------------------
   Subcategory Schema
------------------------------------------------------- */
const subcategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      trim: true,
      default: "",
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    icon: {
      type: String,
      trim: true,
      default: "",
    },

    color: {
      type: String,
      trim: true,
      default: "",
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { _id: true }
);

/* -------------------------------------------------------
   Category Schema
------------------------------------------------------- */
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },

    slug: {
      type: String,
      trim: true,
      unique: true,
      index: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    shortDescription: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
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

    icon: {
      type: String,
      trim: true,
      default: "",
    },

    color: {
      type: String,
      trim: true,
      default: "",
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    subcategories: {
      type: [subcategorySchema],
      default: [],
    },

    seoTitle: {
      type: String,
      trim: true,
      default: "",
    },

    seoDescription: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* -------------------------------------------------------
   Virtuals
------------------------------------------------------- */
categorySchema.virtual("activeSubcategoryCount").get(function () {
  return (this.subcategories || []).filter((item) => item.isActive).length;
});

/* -------------------------------------------------------
   Static Methods
------------------------------------------------------- */
categorySchema.statics.generateCategoryCode = async function () {
  return Counter.getNextPadded("categoryCode", {
    prefix: "CAT-",
    pad: 4,
    start: 1,
  });
};

categorySchema.statics.generateUniqueSlug = async function (name, excludeId = null) {
  const base = makeSlug(name) || "category";
  let slug = base;
  let count = 1;

  while (true) {
    const existing = await this.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("_id");

    if (!existing) return slug;

    count += 1;
    slug = `${base}-${count}`;
  }
};

/* -------------------------------------------------------
   Hooks
------------------------------------------------------- */
categorySchema.pre("validate", async function () {
  if (!this.code) {
    this.code = await this.constructor.generateCategoryCode();
  }

  if (!this.slug && this.name) {
    this.slug = await this.constructor.generateUniqueSlug(this.name, this._id);
  }

  this.name = clean(this.name);
  this.slug = lower(this.slug);
  this.code = upper(this.code);

  if (Array.isArray(this.tags)) {
    this.tags = [...new Set(this.tags.map((t) => lower(t)).filter(Boolean))];
  }

  if (Array.isArray(this.subcategories) && this.subcategories.length > 0) {
    const usedSlugs = new Set();
    const usedCodes = new Set();

    this.subcategories = this.subcategories.map((sub, index) => {
      const raw = sub?.toObject ? sub.toObject() : sub;

      const name = clean(raw.name);
      let slug = lower(raw.slug || makeSlug(name));
      let code = upper(raw.code || `${this.code}-${String(index + 1).padStart(2, "0")}`);

      let slugCount = 1;
      const baseSlug = slug || `subcategory-${index + 1}`;
      while (usedSlugs.has(slug)) {
        slugCount += 1;
        slug = `${baseSlug}-${slugCount}`;
      }
      usedSlugs.add(slug);

      let codeCount = 1;
      const baseCode = code;
      while (usedCodes.has(code)) {
        codeCount += 1;
        code = `${baseCode}-${codeCount}`;
      }
      usedCodes.add(code);

      return {
        ...raw,
        name,
        slug,
        code,
        description: clean(raw.description),
        image: clean(raw.image),
        icon: clean(raw.icon),
        color: clean(raw.color),
        tags: [...new Set((raw.tags || []).map((t) => lower(t)).filter(Boolean))],
        sortOrder:
          Number.isFinite(Number(raw.sortOrder)) && Number(raw.sortOrder) >= 0
            ? Number(raw.sortOrder)
            : index,
      };
    });
  }
});

/* -------------------------------------------------------
   Indexes
------------------------------------------------------- */
categorySchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });
categorySchema.index({ isFeatured: 1, isActive: 1, sortOrder: 1 });
categorySchema.index({ "subcategories.slug": 1 });
categorySchema.index({ "subcategories.code": 1 });
categorySchema.index({ "subcategories.isActive": 1, isActive: 1 });

categorySchema.index({
  name: "text",
  description: "text",
  tags: "text",
  "subcategories.name": "text",
  "subcategories.description": "text",
  "subcategories.tags": "text",
});

categorySchema.set("toJSON", { virtuals: true });
categorySchema.set("toObject", { virtuals: true });

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;