import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    customerCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   PREVENT DUPLICATES
   same customer same product only once
========================================================= */
wishlistSchema.index({ productCode: 1, customerCode: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;