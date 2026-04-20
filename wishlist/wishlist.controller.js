import Wishlist from "./wishlist.js";

/* =========================================================
   ADD TO WISHLIST
========================================================= */
export const addToWishlist = async (req, res) => {
  try {
    const { productCode, customerCode } = req.body;

    if (!productCode || !customerCode) {
      return res.status(400).json({
        success: false,
        message: "productCode and customerCode are required",
      });
    }

    const normalizedProductCode = String(productCode).trim().toUpperCase();
    const normalizedCustomerCode = String(customerCode).trim().toUpperCase();

    const existing = await Wishlist.findOne({
      productCode: normalizedProductCode,
      customerCode: normalizedCustomerCode,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Product already in wishlist",
        wishlist: existing,
      });
    }

    const wishlist = await Wishlist.create({
      productCode: normalizedProductCode,
      customerCode: normalizedCustomerCode,
    });

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist successfully",
      wishlist,
    });
  } catch (error) {
    console.error("addToWishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add product to wishlist",
      error: error.message,
    });
  }
};

/* =========================================================
   GET CUSTOMER WISHLIST
========================================================= */
export const getCustomerWishlist = async (req, res) => {
  try {
    const { customerCode } = req.params;

    if (!customerCode) {
      return res.status(400).json({
        success: false,
        message: "customerCode is required",
      });
    }

    const normalizedCustomerCode = String(customerCode).trim().toUpperCase();

    const wishlist = await Wishlist.find({
      customerCode: normalizedCustomerCode,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    console.error("getCustomerWishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};

/* =========================================================
   REMOVE FROM WISHLIST
========================================================= */
export const removeFromWishlist = async (req, res) => {
  try {
    const { productCode, customerCode } = req.body;

    if (!productCode || !customerCode) {
      return res.status(400).json({
        success: false,
        message: "productCode and customerCode are required",
      });
    }

    const normalizedProductCode = String(productCode).trim().toUpperCase();
    const normalizedCustomerCode = String(customerCode).trim().toUpperCase();

    const deleted = await Wishlist.findOneAndDelete({
      productCode: normalizedProductCode,
      customerCode: normalizedCustomerCode,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
    });
  } catch (error) {
    console.error("removeFromWishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist",
      error: error.message,
    });
  }
};

/* =========================================================
   CHECK WISHLIST ITEM
========================================================= */
export const checkWishlistItem = async (req, res) => {
  try {
    const { productCode, customerCode } = req.query;

    if (!productCode || !customerCode) {
      return res.status(400).json({
        success: false,
        message: "productCode and customerCode are required",
      });
    }

    const normalizedProductCode = String(productCode).trim().toUpperCase();
    const normalizedCustomerCode = String(customerCode).trim().toUpperCase();

    const exists = await Wishlist.findOne({
      productCode: normalizedProductCode,
      customerCode: normalizedCustomerCode,
    });

    return res.status(200).json({
      success: true,
      wishlisted: !!exists,
      wishlist: exists || null,
    });
  } catch (error) {
    console.error("checkWishlistItem error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check wishlist item",
      error: error.message,
    });
  }
};


export const getAllWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    console.error("getAllWishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all wishlist items",
      error: error.message,
    });
  }
};