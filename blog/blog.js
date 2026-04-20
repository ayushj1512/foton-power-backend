import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    content: {
      type: String,
      required: true,
    },

    images: [
      {
        url: String,
        public_id: String,
      },
    ],

    hashtags: [String],

    productCodes: [
      {
        type: String, // "000123"
      },
    ],

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Blog", blogSchema);