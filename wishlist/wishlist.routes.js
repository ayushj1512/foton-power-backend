import express from "express";
import {
  addToWishlist,
  getCustomerWishlist,
  removeFromWishlist,
  checkWishlistItem,
  getAllWishlist,
} from "./wishlist.controller.js";

const router = express.Router();

/* =========================================================
   WISHLIST ROUTES
========================================================= */
router.post("/", addToWishlist);
router.get("/customer/:customerCode", getCustomerWishlist);
router.delete("/", removeFromWishlist);
router.get("/check", checkWishlistItem);
router.get("/all", getAllWishlist);

export default router;