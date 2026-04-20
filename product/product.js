import mongoose from "mongoose";
import Counter from "../models/Counter.js";
import Category from "../Category/Category.js";

const { Schema } = mongoose;

const clean = (v = "") => String(v || "").trim();
const upper = (v = "") => clean(v).toUpperCase();
const lower = (v = "") => clean(v).toLowerCase();
const toArray = (value) => (Array.isArray(value) ? value : []);
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const MEDIA_TYPES = ["image", "video"];
const PRODUCT_STATUSES = ["draft", "active", "inactive", "archived"];

const mediaSchema = new Schema(
  {
    type: {
      type: String,
      enum: MEDIA_TYPES,
      required: true,
      default: "image",
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    secureUrl: {
      type: String,
      trim: true,
      default: "",
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    resourceType: {
      type: String,
      trim: true,
      default: "",
    },
    format: {
      type: String,
      trim: true,
      default: "",
    },
    bytes: {
      type: Number,
      default: 0,
      min: 0,
    },
    width: {
      type: Number,
      default: 0,
      min: 0,
    },
    height: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: "",
    },
    alt: {
      type: String,
      trim: true,
      default: "",
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const variantSchema = new Schema(
  {
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    size: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    mrp: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    reservedStock: {
      type: Number,
      min: 0,
      default: 0,
    },
    soldCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { _id: true }
);

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },

    productCode: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    color: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    categoryName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    categorySlug: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },

    subcategory: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    subcategoryName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    subcategorySlug: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },

    collections: [
      {
        type: Schema.Types.ObjectId,
        ref: "Collection",
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    mrp: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    discountPrice: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    hsnCode: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    taxClass: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    soldCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    trackInventory: {
      type: Boolean,
      default: true,
      index: true,
    },

    allowBackorder: {
      type: Boolean,
      default: false,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      default: "draft",
      index: true,
    },

    crossSellProductCodes: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],

    media: {
      type: [mediaSchema],
      default: [],
    },

    variants: {
      type: [variantSchema],
      default: [],
    },

    fabric: {
      type: String,
      trim: true,
      default: "",
    },

    material: {
      type: String,
      trim: true,
      default: "",
    },

    fit: {
      type: String,
      trim: true,
      default: "",
    },

    careInstructions: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.virtual("effectiveDiscountPercent").get(function () {
  const mrp = Number(this.mrp || 0);
  const discountPrice = Number(this.discountPrice || 0);

  if (!mrp || discountPrice >= mrp) return 0;
  return Math.round(((mrp - discountPrice) / mrp) * 100);
});

productSchema.virtual("availableStock").get(function () {
  return Math.max(Number(this.stock || 0) - Number(this.reservedStock || 0), 0);
});

productSchema.methods.recalculateStock = function () {
  if (!Array.isArray(this.variants) || this.variants.length === 0) return;

  this.stock = this.variants.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  this.reservedStock = this.variants.reduce(
    (sum, item) => sum + Number(item.reservedStock || 0),
    0
  );
  this.soldCount = this.variants.reduce(
    (sum, item) => sum + Number(item.soldCount || 0),
    0
  );
};

productSchema.statics.generateProductCode = async function () {
  const counter = await Counter.findOneAndUpdate(
    { key: "productCode" },
    {
      $inc: { seq: 1 },
      $setOnInsert: { key: "productCode" },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return String(counter.seq).padStart(5, "0");
};

productSchema.methods.syncCategorySnapshot = async function () {
  if (!this.category || !isValidObjectId(this.category)) {
    this.categoryName = "";
    this.categorySlug = "";
    this.subcategory = null;
    this.subcategoryName = "";
    this.subcategorySlug = "";
    return;
  }

  const categoryDoc = await Category.findById(this.category).select(
    "name slug subcategories"
  );

  if (!categoryDoc) {
    this.categoryName = "";
    this.categorySlug = "";
    this.subcategory = null;
    this.subcategoryName = "";
    this.subcategorySlug = "";
    return;
  }

  this.categoryName = clean(categoryDoc.name);
  this.categorySlug = lower(categoryDoc.slug || categoryDoc.name);

  if (!this.subcategory || !isValidObjectId(this.subcategory)) {
    this.subcategory = null;
    this.subcategoryName = "";
    this.subcategorySlug = "";
    return;
  }

  const matchedSubcategory =
    categoryDoc.subcategories?.find(
      (item) => String(item?._id) === String(this.subcategory)
    ) || null;

  if (!matchedSubcategory) {
    this.subcategory = null;
    this.subcategoryName = "";
    this.subcategorySlug = "";
    return;
  }

  this.subcategoryName = clean(matchedSubcategory.name);
  this.subcategorySlug = lower(
    matchedSubcategory.slug || matchedSubcategory.name
  );
};

productSchema.pre("validate", async function () {
  if (!this.productCode) {
    this.productCode = await this.constructor.generateProductCode();
  }

  this.tags = [...new Set(toArray(this.tags).map((t) => lower(t)).filter(Boolean))];

  this.crossSellProductCodes = [
    ...new Set(
      toArray(this.crossSellProductCodes)
        .map((code) => upper(code))
        .filter(Boolean)
        .filter((code) => code !== upper(this.productCode))
    ),
  ];

  if (Array.isArray(this.media) && this.media.length > 0) {
    let foundPrimary = false;

    this.media = this.media
      .map((item, index) => {
        const raw = item?.toObject ? item.toObject() : item;

        const normalized = {
          ...raw,
          type: MEDIA_TYPES.includes(raw?.type) ? raw.type : "image",
          url: clean(raw?.url),
          secureUrl: clean(raw?.secureUrl),
          publicId: clean(raw?.publicId),
          resourceType: clean(raw?.resourceType),
          format: lower(raw?.format),
          thumbnailUrl: clean(raw?.thumbnailUrl),
          alt: clean(raw?.alt),
          sortOrder:
            Number.isFinite(Number(raw?.sortOrder)) && Number(raw?.sortOrder) >= 0
              ? Number(raw.sortOrder)
              : index,
          isPrimary: Boolean(raw?.isPrimary),
        };

        if (normalized.isPrimary && !foundPrimary) {
          foundPrimary = true;
          return normalized;
        }

        return { ...normalized, isPrimary: false };
      })
      .filter((item) => item.url);

    this.media.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

    if (this.media.length > 0 && !foundPrimary) {
      this.media[0].isPrimary = true;
    }
  }

  if (Array.isArray(this.variants) && this.variants.length > 0) {
    this.variants = this.variants.map((variant) => {
      const raw = variant?.toObject ? variant.toObject() : variant;

      const size = upper(raw?.size);
      const variantColor = clean(raw?.color || this.color);
      const sku =
        upper(raw?.sku) ||
        ["PRD", this.productCode, size || "FREE"].filter(Boolean).join("-");

      const mrp = Number(raw?.mrp || 0);
      const discountPrice = Number(raw?.discountPrice || 0);

      if (discountPrice > mrp && mrp > 0) {
        throw new Error(
          `Discount price cannot be greater than MRP for variant ${size || "FREE"}`
        );
      }

      return {
        ...raw,
        sku,
        size,
        color: variantColor,
      };
    });

    this.recalculateStock();
  }

  await this.syncCategorySnapshot();

  if (Number(this.discountPrice) > Number(this.mrp)) {
    throw new Error("Discount price cannot be greater than MRP");
  }
});

productSchema.index({
  name: "text",
  description: "text",
  productCode: "text",
  tags: "text",
  color: "text",
  hsnCode: "text",
  taxClass: "text",
  categoryName: "text",
  subcategoryName: "text",
});

productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ category: 1, subcategory: 1, status: 1, createdAt: -1 });
productSchema.index({ categoryName: 1, subcategoryName: 1, status: 1, createdAt: -1 });
productSchema.index({ categorySlug: 1, subcategorySlug: 1, status: 1, createdAt: -1 });
productSchema.index({ collections: 1, status: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, status: 1, createdAt: -1 });
productSchema.index({ isBestSeller: 1, status: 1, soldCount: -1 });
productSchema.index({ discountPrice: 1, status: 1 });
productSchema.index({ mrp: 1, status: 1 });
productSchema.index({ stock: 1, status: 1 });
productSchema.index({ soldCount: -1, status: 1 });
productSchema.index({ color: 1, status: 1 });
productSchema.index({ hsnCode: 1, status: 1 });
productSchema.index({ taxClass: 1, status: 1 });
productSchema.index({ "variants.size": 1, status: 1 });
productSchema.index({ "variants.sku": 1 });
productSchema.index({ "media.type": 1, status: 1 });

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", productSchema);
export default Product;