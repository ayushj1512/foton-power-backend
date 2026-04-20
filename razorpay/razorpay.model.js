import mongoose from "mongoose";

const razorpayPaymentSchema = new mongoose.Schema(
  {
    receipt: {
      type: String,
      trim: true,
      index: true,
    },

    notes: {
      type: Object,
      default: {},
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },

    razorpaySignature: {
      type: String,
      trim: true,
    },

    razorpayRefundId: {
      type: String,
      trim: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: [
        "created",
        "attempted",
        "authorized",
        "captured",
        "paid",
        "failed",
        "refunded",
        "partial_refunded",
      ],
      default: "created",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partial_refunded"],
      default: "pending",
      index: true,
    },

    method: {
      type: String,
      trim: true,
    },

    error: {
      code: String,
      description: String,
      source: String,
      step: String,
      reason: String,
      metadata: Object,
    },

    customer: {
      name: String,
      email: String,
      contact: String,
    },

    paidAt: Date,
    refundedAt: Date,

    webhookEvents: [
      {
        eventId: String,
        event: String,
        receivedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

razorpayPaymentSchema.index({ createdAt: -1 });

export default mongoose.model("RazorpayPayment", razorpayPaymentSchema);