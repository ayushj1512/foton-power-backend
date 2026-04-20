import mongoose from "mongoose";
import Counter from "../models/Counter.js";

const { Schema } = mongoose;

/* -------------------------------------------------------
   Constants
------------------------------------------------------- */
const ORDER_STATUSES = [
  "processing",
  "packed",
  "picked",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
  "rto",
  "failed",
];

const PAYMENT_METHODS = [
  "cod",
  "razorpay",
  "upi",
  "bank_transfer",
  "not_applicable",
];

const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "refund_pending",
  "partially_paid",
  "partially_refunded",
  "not_applicable",
];

/* -------------------------------------------------------
   Small helpers
------------------------------------------------------- */
const clean = (v = "") => String(v || "").trim();
const upper = (v = "") => clean(v).toUpperCase();
const lower = (v = "") => clean(v).toLowerCase();
const digits = (v = "") => clean(v).replace(/\D/g, "");

/* -------------------------------------------------------
   Address Snapshot
------------------------------------------------------- */
const addressSchema = new Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },

    addressLine1: { type: String, trim: true, required: true },
    addressLine2: { type: String, trim: true, default: "" },
    landmark: { type: String, trim: true, default: "" },

    city: { type: String, trim: true, required: true },
    district: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, required: true },
    country: { type: String, trim: true, default: "India" },
    pincode: { type: String, trim: true, required: true },

    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
  },
  { _id: false }
);

/* -------------------------------------------------------
   Customer Snapshot
------------------------------------------------------- */
const customerSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    customerCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      index: true,
    },

    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    fullName: { type: String, trim: true, default: "" },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

/* -------------------------------------------------------
   Coupon Snapshot
------------------------------------------------------- */
const couponSchema = new Schema(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    code: { type: String, trim: true, uppercase: true, default: "" },
    discountAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

/* -------------------------------------------------------
   Payment Snapshot
------------------------------------------------------- */
const paymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "cod",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
      index: true,
    },

    transactionId: { type: String, trim: true, default: "", index: true },
    gateway: { type: String, trim: true, default: "" },
    gatewayOrderId: { type: String, trim: true, default: "" },
    gatewayPaymentId: { type: String, trim: true, default: "" },

    amountPaid: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, default: 0, min: 0 },
    refundedAmount: { type: Number, default: 0, min: 0 },

    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

/* -------------------------------------------------------
   Shipment Snapshot
------------------------------------------------------- */
const shipmentSchema = new Schema(
  {
    courierName: { type: String, trim: true, default: "" },
    awbNumber: { type: String, trim: true, default: "", index: true },
    trackingNumber: { type: String, trim: true, default: "" },
    trackingUrl: { type: String, trim: true, default: "" },
    status: { type: String, trim: true, default: "" },

    labelUrl: { type: String, trim: true, default: "" },
    invoiceUrl: { type: String, trim: true, default: "" },
    manifestUrl: { type: String, trim: true, default: "" },

    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },

    shiprocket: {
      isBooked: { type: Boolean, default: false },
      bookingMode: {
        type: String,
        enum: ["", "auto", "manual"],
        default: "",
      },

      pickupLocation: { type: String, trim: true, default: "" },

      channelOrderId: { type: String, trim: true, default: "" },
      shiprocketOrderId: { type: String, trim: true, default: "" },
      shipmentId: { type: String, trim: true, default: "" },

      courierCompanyId: { type: String, trim: true, default: "" },
      courierCompanyName: { type: String, trim: true, default: "" },

      pickupTokenNumber: { type: String, trim: true, default: "" },
      pickupScheduledDate: { type: String, trim: true, default: "" },

      serviceabilityRaw: { type: Schema.Types.Mixed, default: null },
      bookingRaw: { type: Schema.Types.Mixed, default: null },
      awbRaw: { type: Schema.Types.Mixed, default: null },
      pickupRaw: { type: Schema.Types.Mixed, default: null },
      trackingRaw: { type: Schema.Types.Mixed, default: null },

      lastError: { type: String, trim: true, default: "" },
      lastErrorRaw: { type: Schema.Types.Mixed, default: null },

      bookedAt: { type: Date, default: null },
      syncedAt: { type: Date, default: null },
    },
  },
  { _id: false }
);

/* -------------------------------------------------------
   Order Item Snapshot
------------------------------------------------------- */
const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    variantId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    productCode: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
      index: true,
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      index: true,
    },

    name: {
      type: String,
      trim: true,
      required: true,
    },

    color: {
      type: String,
      trim: true,
      default: "",
    },

    size: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    hsnCode: {
      type: String,
      trim: true,
      default: "",
    },

    taxClass: {
      type: String,
      trim: true,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    unitPayable: {
      type: Number,
      required: true,
      min: 0,
    },

    lineMrpTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    lineDiscountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    linePayableTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

/* -------------------------------------------------------
   Main Order Schema
------------------------------------------------------- */
const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },

    customer: {
      type: customerSchema,
      default: () => ({}),
    },

    billingAddress: {
      type: addressSchema,
      required: true,
    },

    shippingAddress: {
      type: addressSchema,
      required: true,
    },

    sameAsBilling: {
      type: Boolean,
      default: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one order item is required",
      },
    },

    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalQty: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    itemsMrpTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    itemsDiscountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    coupon: {
      type: couponSchema,
      default: () => ({}),
    },

    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    additionalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    codCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    roundOff: {
      type: Number,
      default: 0,
    },

    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    payableAmount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    payment: {
      type: paymentSchema,
      default: () => ({
        method: "cod",
        status: "pending",
      }),
    },

    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "processing",
      index: true,
    },

    shipment: {
      type: shipmentSchema,
      default: () => ({}),
    },

    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    adminRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    source: {
      type: String,
      trim: true,
      default: "website",
      index: true,
    },

    isConfirmed: {
      type: Boolean,
      default: false,
      index: true,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
      index: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* -------------------------------------------------------
   Methods
------------------------------------------------------- */
orderSchema.methods.recalculateTotals = function () {
  const items = Array.isArray(this.items) ? this.items : [];

  this.totalItems = items.length;
  this.totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  this.itemsMrpTotal = items.reduce(
    (sum, item) => sum + Number(item.lineMrpTotal || 0),
    0
  );

  this.itemsDiscountTotal = items.reduce(
    (sum, item) => sum + Number(item.lineDiscountTotal || 0),
    0
  );

  const couponDiscount = Number(
    this.couponDiscount || this.coupon?.discountAmount || 0
  );
  const additionalDiscount = Number(this.additionalDiscount || 0);

  this.couponDiscount = couponDiscount;
  this.totalDiscount = this.itemsDiscountTotal + couponDiscount + additionalDiscount;

  this.subtotal = items.reduce(
    (sum, item) => sum + Number(item.linePayableTotal || 0),
    0
  );

  this.payableAmount =
    this.subtotal +
    Number(this.shippingCharge || 0) +
    Number(this.codCharge || 0) +
    Number(this.taxAmount || 0) +
    Number(this.roundOff || 0) -
    couponDiscount -
    additionalDiscount;

  if (this.payableAmount < 0) this.payableAmount = 0;

  if (this.payment) {
    this.payment.amountDue = Math.max(
      Number(this.payableAmount || 0) - Number(this.payment.amountPaid || 0),
      0
    );
  }
};

/* -------------------------------------------------------
   Static
------------------------------------------------------- */
orderSchema.statics.generateOrderNumber = async function () {
  const counter = await Counter.findOneAndUpdate(
    { name: "orderNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return `MIRAY-${String(counter.seq).padStart(6, "0")}`;
};

/* -------------------------------------------------------
   Hooks
------------------------------------------------------- */
orderSchema.pre("validate", async function (next) {
  try {
    if (!this.orderNumber) {
      this.orderNumber = await this.constructor.generateOrderNumber();
    }

    if (this.customer) {
      this.customer.customerCode = upper(this.customer.customerCode);
      this.customer.email = lower(this.customer.email);
      this.customer.phone = digits(this.customer.phone).slice(-10);
      this.customer.alternatePhone = digits(this.customer.alternatePhone).slice(-10);

      if (!clean(this.customer.fullName)) {
        this.customer.fullName = clean(
          `${this.customer.firstName || ""} ${this.customer.lastName || ""}`
        );
      }
    }

    if (this.billingAddress) {
      this.billingAddress.email = lower(this.billingAddress.email);
      this.billingAddress.phone = digits(this.billingAddress.phone).slice(-10);
    }

    if (this.shippingAddress) {
      this.shippingAddress.email = lower(this.shippingAddress.email);
      this.shippingAddress.phone = digits(this.shippingAddress.phone).slice(-10);
    }

    if (this.couponCode && !this.coupon?.code) {
      this.coupon = {
        ...(this.coupon?.toObject ? this.coupon.toObject() : this.coupon),
        code: upper(this.couponCode),
        discountAmount: Number(
          this.coupon?.discountAmount || this.couponDiscount || 0
        ),
      };
    }

    this.couponCode = upper(this.couponCode || this.coupon?.code || "");

    if (Array.isArray(this.items)) {
      this.items = this.items.map((item) => {
        const raw = item?.toObject ? item.toObject() : item;

        const quantity = Number(raw.quantity || 0);
        const mrp = Number(raw.mrp || 0);
        const discountPrice = Number(raw.discountPrice || 0);
        const unitPayable = Number(raw.unitPayable || 0) || discountPrice || mrp;

        if (discountPrice > mrp && mrp > 0) {
          throw new Error(`Discount price cannot be greater than MRP for ${raw.name}`);
        }

        return {
          ...raw,
          productCode: upper(raw.productCode),
          sku: upper(raw.sku),
          size: upper(raw.size),
          lineMrpTotal: mrp * quantity,
          lineDiscountTotal: Math.max((mrp - discountPrice) * quantity, 0),
          linePayableTotal: unitPayable * quantity,
        };
      });
    }

    this.recalculateTotals();
    next();
  } catch (error) {
    next(error);
  }
});

/* -------------------------------------------------------
   Indexes
------------------------------------------------------- */
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ "payment.method": 1, "payment.status": 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1, createdAt: -1 });
orderSchema.index({ "customer.customerCode": 1, createdAt: -1 });
orderSchema.index({ "customer.email": 1, createdAt: -1 });
orderSchema.index({ "items.productCode": 1, createdAt: -1 });
orderSchema.index({ "shipment.awbNumber": 1 });
orderSchema.index({ "shipment.shiprocket.shipmentId": 1 });
orderSchema.index({ "shipment.shiprocket.shiprocketOrderId": 1 });
orderSchema.index({ "shipment.shiprocket.channelOrderId": 1 });
orderSchema.index({ deliveredAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;