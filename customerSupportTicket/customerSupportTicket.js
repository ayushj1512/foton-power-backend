import mongoose from "mongoose";
import Counter from "../models/Counter.js";

const customerSupportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    issue: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

customerSupportTicketSchema.pre("save", async function () {
  if (this.ticketId) return;

  this.ticketId = await Counter.getNextPadded("supportTicket", {
    pad: 5,
    start: 1,
    prefix: "T",
  });
});

const CustomerSupportTicket = mongoose.model(
  "CustomerSupportTicket",
  customerSupportTicketSchema
);

export default CustomerSupportTicket;