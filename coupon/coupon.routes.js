import express from "express";
import {
  // admin
  createCoupon,
  deleteCoupon,
  getAdminCouponById,
  getAdminCoupons,
  toggleCouponVisibility,
  updateCoupon,
  updateCouponStatus,

  // customer / public
  getAvailableCoupons,
  validateCoupon,
  validateAutoApplyCoupons,
} from "./coupon.controller.js";

const router = express.Router();

/* =========================
   ADMIN ROUTES
========================= */
router.post("/", createCoupon);
router.get("/", getAdminCoupons);
router.get("/:couponId", getAdminCouponById);
router.put("/:couponId", updateCoupon);
router.patch("/:couponId/status", updateCouponStatus);
router.patch("/:couponId/visibility", toggleCouponVisibility);
router.delete("/:couponId", deleteCoupon);

/* =========================
   CUSTOMER ROUTES
========================= */

// get coupons for frontend
router.get("/available", getAvailableCoupons);

// apply coupon manually
router.post("/validate", validateCoupon);

// auto apply best coupon
router.post("/validate-auto-apply", validateAutoApplyCoupons);

export default router;