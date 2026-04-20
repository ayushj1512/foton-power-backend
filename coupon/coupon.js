import mongoose from "mongoose";
import Counter from "./Counter.js";

const { Schema } = mongoose;

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */
const clean = (v = "") => String(v || "").trim();
const upper = (v = "") => clean(v).toUpperCase();
const lower = (v = "") => clean(v).toLowerCase();
const toArr = (v) => (Array.isArray(v) ? v : []);

/* -------------------------------------------------------
   Constants
------------------------------------------------------- */
const DISCOUNT_TYPES = ["percentage", "flat"];
const STATUSES = ["draft", "active", "inactive", "expired", "archived"];
const PAYMENT_METHODS = ["cod", "razorpay", "upi", "bank_transfer", "not_applicable"];

/* -------------------------------------------------------
   Schema
------------------------------------------------------- */
const couponSchema = new Schema(
  {
    couponCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    couponName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: STATUSES,
      default: "draft",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },

    autoApply: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* -------------------- Discount -------------------- */
    discountType: {
      type: String,
      enum: DISCOUNT_TYPES,
      required: true,
      index: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    maxDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* -------------------- Rules -------------------- */
    minimumOrderValue: { type: Number, default: 0 },
    maximumOrderValue: { type: Number, default: 0 },
    minimumTotalQty: { type: Number, default: 0 },

    /* -------------------- Usage -------------------- */
    totalUsageLimit: { type: Number, default: 0 },
    perCustomerLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },

    /* -------------------- Validity -------------------- */
    startsAt: { type: Date, default: null, index: true },
    endsAt: { type: Date, default: null, index: true },

    validDays: [{ type: Number, min: 0, max: 6 }], // 0-6 (Sun-Sat)
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },

    /* -------------------- Targeting -------------------- */
    productCodes: [{ type: String, trim: true, uppercase: true }],
    excludedProductCodes: [{ type: String, trim: true, uppercase: true }],

    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    collectionIds: [{ type: Schema.Types.ObjectId, ref: "Collection" }],

    tags: [{ type: String, trim: true, lowercase: true }],

    /* -------------------- Customer Rules -------------------- */
    firstOrderOnly: { type: Boolean, default: false },

    allowedCustomerCodes: [{ type: String, trim: true, uppercase: true }],
    blockedCustomerCodes: [{ type: String, trim: true, uppercase: true }],

    allowedEmails: [{ type: String, trim: true, lowercase: true }],
    blockedEmails: [{ type: String, trim: true, lowercase: true }],

    /* -------------------- Payment -------------------- */
    allowedPaymentMethods: [{ type: String, enum: PAYMENT_METHODS }],
    excludedPaymentMethods: [{ type: String, enum: PAYMENT_METHODS }],

    /* -------------------- Behavior -------------------- */
    canCombineWithOtherCoupons: { type: Boolean, default: false },
    canCombineWithSale: { type: Boolean, default: true },
    appliesOnShipping: { type: Boolean, default: false },

    priority: { type: Number, default: 0, index: true },

    /* -------------------- Analytics -------------------- */
    totalDiscountGiven: { type: Number, default: 0 },
    lastUsedAt: { type: Date, default: null, index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  {
    timestamps: true,
  }
);

/* -------------------------------------------------------
   Static
------------------------------------------------------- */
couponSchema.statics.generateCouponCode = async function () {
  return Counter.getNextWithPrefix("couponCode", {
    prefix: "CPN-",
    pad: 5,
  });
};

/* -------------------------------------------------------
   Hooks
------------------------------------------------------- */
couponSchema.pre("validate", async function (next) {
  try {
    if (!this.couponCode) {
      this.couponCode = await this.constructor.generateCouponCode();
    }

    this.couponCode = upper(this.couponCode);
    this.couponName = clean(this.couponName);

    if (this.discountType === "percentage" && this.discountValue > 100) {
      throw new Error("Percentage discount cannot exceed 100");
    }

    if (this.startsAt && this.endsAt && this.startsAt > this.endsAt) {
      throw new Error("Invalid date range");
    }

    // normalize arrays
    this.productCodes = [...new Set(toArr(this.productCodes).map(upper).filter(Boolean))];
    this.excludedProductCodes = [...new Set(toArr(this.excludedProductCodes).map(upper).filter(Boolean))];
    this.tags = [...new Set(toArr(this.tags).map(lower).filter(Boolean))];

    this.allowedCustomerCodes = [...new Set(toArr(this.allowedCustomerCodes).map(upper).filter(Boolean))];
    this.blockedCustomerCodes = [...new Set(toArr(this.blockedCustomerCodes).map(upper).filter(Boolean))];

    this.allowedEmails = [...new Set(toArr(this.allowedEmails).map(lower).filter(Boolean))];
    this.blockedEmails = [...new Set(toArr(this.blockedEmails).map(lower).filter(Boolean))];

    this.allowedPaymentMethods = [...new Set(toArr(this.allowedPaymentMethods).map(lower).filter(Boolean))];
    this.excludedPaymentMethods = [...new Set(toArr(this.excludedPaymentMethods).map(lower).filter(Boolean))];

    // auto expire
    if (this.endsAt && new Date() > this.endsAt) {
      this.status = "expired";
      this.isActive = false;
    }

    next();
  } catch (err) {
    next(err);
  }
});

/* -------------------------------------------------------
   Indexes
------------------------------------------------------- */
couponSchema.index({ createdAt: -1 });
couponSchema.index({ status: 1, isActive: 1 });
couponSchema.index({ isHidden: 1 });
couponSchema.index({ discountType: 1 });
couponSchema.index({ startsAt: 1, endsAt: 1 });
couponSchema.index({ productCodes: 1 });
couponSchema.index({ categoryIds: 1 });
couponSchema.index({ collectionIds: 1 });

couponSchema.index({
  couponCode: "text",
  couponName: "text",
  description: "text",
});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;