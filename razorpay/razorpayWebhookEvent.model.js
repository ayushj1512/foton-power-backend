import mongoose from "mongoose";

const razorpayWebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Object,
      required: true,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model(
  "RazorpayWebhookEvent",
  razorpayWebhookEventSchema
);