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
   CUSTOMER / PUBLIC ROUTES
   keep static routes before dynamic :couponId
========================= */

// get coupons for frontend suggestions
router.get("/available", getAvailableCoupons);

// apply coupon manually
router.post("/validate", validateCoupon);

// auto apply best coupon
router.post("/validate-auto-apply", validateAutoApplyCoupons);

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

export default router;  