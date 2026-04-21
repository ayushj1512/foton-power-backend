import mongoose from "mongoose";
import Coupon from "./coupon.js";

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */
const clean = (v = "") => String(v || "").trim();
const upper = (v = "") => clean(v).toUpperCase();
const lower = (v = "") => clean(v).toLowerCase();
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const toInt = (v, d = 0) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
};
const toBool = (v, d = undefined) => {
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return d;
};
const toArr = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    return v
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const couponSelect = "-__v";

const buildNowMeta = () => {
  const now = new Date();

  const day = now.getDay(); // 0-6
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

  return { now, day, currentTime };
};

const isTimeInRange = (current, start, end) => {
  if (!start || !end) return true;
  if (!current) return true;

  // normal same-day range
  if (start <= end) return current >= start && current <= end;

  // overnight range (e.g. 22:00 -> 02:00)
  return current >= start || current <= end;
};

const isCouponLive = (coupon) => {
  const { now, day, currentTime } = buildNowMeta();

  if (!coupon?.isActive) {
    return { ok: false, reason: "Coupon is inactive" };
  }

  if (coupon?.status && !["active", "draft"].includes(coupon.status)) {
    if (coupon.status === "expired") {
      return { ok: false, reason: "Coupon has expired" };
    }
    return { ok: false, reason: `Coupon is ${coupon.status}` };
  }

  if (coupon?.startsAt && now < new Date(coupon.startsAt)) {
    return { ok: false, reason: "Coupon is not live yet" };
  }

  if (coupon?.endsAt && now > new Date(coupon.endsAt)) {
    return { ok: false, reason: "Coupon has expired" };
  }

  if (Array.isArray(coupon?.validDays) && coupon.validDays.length > 0) {
    if (!coupon.validDays.includes(day)) {
      return { ok: false, reason: "Coupon is not valid today" };
    }
  }

  if (!isTimeInRange(currentTime, coupon?.startTime, coupon?.endTime)) {
    return { ok: false, reason: "Coupon is not valid at this time" };
  }

  return { ok: true, reason: "" };
};

const matchRestrictedList = (incoming = [], allowed = []) => {
  if (!allowed.length) return true;
  return incoming.some((item) => allowed.includes(item));
};

const hasBlockedMatch = (incoming = [], blocked = []) => {
  if (!blocked.length) return false;
  return incoming.some((item) => blocked.includes(item));
};

const calculateCouponDiscount = ({
  coupon,
  subtotal = 0,
  shipping = 0,
}) => {
  const baseAmount = coupon?.appliesOnShipping
    ? toNum(subtotal) + toNum(shipping)
    : toNum(subtotal);

  if (baseAmount <= 0) {
    return {
      discountAmount: 0,
      finalAmount: baseAmount,
      appliedOnAmount: baseAmount,
    };
  }

  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = (baseAmount * toNum(coupon.discountValue)) / 100;
  } else {
    discountAmount = toNum(coupon.discountValue);
  }

  if (toNum(coupon.maxDiscountAmount) > 0) {
    discountAmount = Math.min(discountAmount, toNum(coupon.maxDiscountAmount));
  }

  discountAmount = Math.min(discountAmount, baseAmount);

  return {
    appliedOnAmount: Number(baseAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    finalAmount: Number((baseAmount - discountAmount).toFixed(2)),
  };
};

const validateCouponForCart = ({
  coupon,
  subtotal = 0,
  shipping = 0,
  totalQty = 0,
  productCodes = [],
  customerCode = "",
  email = "",
  paymentMethod = "",
  isFirstOrder = false,
  customerUsedCount = 0,
}) => {
  const liveCheck = isCouponLive(coupon);
  if (!liveCheck.ok) {
    return { valid: false, message: liveCheck.reason };
  }

  if (coupon.totalUsageLimit > 0 && coupon.usedCount >= coupon.totalUsageLimit) {
    return { valid: false, message: "Coupon usage limit reached" };
  }

  if (
    coupon.perCustomerLimit > 0 &&
    toNum(customerUsedCount) >= coupon.perCustomerLimit
  ) {
    return { valid: false, message: "Per customer coupon limit reached" };
  }

  if (
    coupon.minimumOrderValue > 0 &&
    toNum(subtotal) < toNum(coupon.minimumOrderValue)
  ) {
    return {
      valid: false,
      message: `Minimum order value is ₹${coupon.minimumOrderValue}`,
    };
  }

  if (
    coupon.maximumOrderValue > 0 &&
    toNum(subtotal) > toNum(coupon.maximumOrderValue)
  ) {
    return {
      valid: false,
      message: `Maximum order value is ₹${coupon.maximumOrderValue}`,
    };
  }

  if (coupon.minimumTotalQty > 0 && toNum(totalQty) < toNum(coupon.minimumTotalQty)) {
    return {
      valid: false,
      message: `Minimum quantity required is ${coupon.minimumTotalQty}`,
    };
  }

  if (coupon.firstOrderOnly && !isFirstOrder) {
    return { valid: false, message: "Coupon is valid only on first order" };
  }

  const normalizedProductCodes = toArr(productCodes).map(upper).filter(Boolean);
  const normalizedCustomerCode = upper(customerCode);
  const normalizedEmail = lower(email);
  const normalizedPaymentMethod = lower(paymentMethod);

  if (
    coupon.productCodes?.length &&
    !matchRestrictedList(normalizedProductCodes, coupon.productCodes)
  ) {
    return {
      valid: false,
      message: "Coupon is not applicable on selected products",
    };
  }

  if (
    coupon.excludedProductCodes?.length &&
    hasBlockedMatch(normalizedProductCodes, coupon.excludedProductCodes)
  ) {
    return {
      valid: false,
      message: "Coupon is not applicable on selected products",
    };
  }

  if (
    coupon.allowedCustomerCodes?.length &&
    !coupon.allowedCustomerCodes.includes(normalizedCustomerCode)
  ) {
    return { valid: false, message: "Coupon is not allowed for this customer" };
  }

  if (
    coupon.blockedCustomerCodes?.length &&
    coupon.blockedCustomerCodes.includes(normalizedCustomerCode)
  ) {
    return { valid: false, message: "Coupon is blocked for this customer" };
  }

  if (
    coupon.allowedEmails?.length &&
    !coupon.allowedEmails.includes(normalizedEmail)
  ) {
    return { valid: false, message: "Coupon is not allowed for this email" };
  }

  if (
    coupon.blockedEmails?.length &&
    coupon.blockedEmails.includes(normalizedEmail)
  ) {
    return { valid: false, message: "Coupon is blocked for this email" };
  }

  if (
    coupon.allowedPaymentMethods?.length &&
    !coupon.allowedPaymentMethods.includes(normalizedPaymentMethod)
  ) {
    return {
      valid: false,
      message: "Coupon is not valid for selected payment method",
    };
  }

  if (
    coupon.excludedPaymentMethods?.length &&
    coupon.excludedPaymentMethods.includes(normalizedPaymentMethod)
  ) {
    return {
      valid: false,
      message: "Coupon is not valid for selected payment method",
    };
  }

  const amounts = calculateCouponDiscount({
    coupon,
    subtotal,
    shipping,
  });

  if (amounts.discountAmount <= 0) {
    return { valid: false, message: "Coupon discount is not applicable" };
  }

  return {
    valid: true,
    message: "Coupon applied successfully",
    ...amounts,
  };
};

const publicCouponShape = (coupon) => ({
  _id: coupon._id,
  couponCode: coupon.couponCode,
  couponName: coupon.couponName,
  description: coupon.description,
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  maxDiscountAmount: coupon.maxDiscountAmount,
  minimumOrderValue: coupon.minimumOrderValue,
  maximumOrderValue: coupon.maximumOrderValue,
  minimumTotalQty: coupon.minimumTotalQty,
  autoApply: coupon.autoApply,
  canCombineWithOtherCoupons: coupon.canCombineWithOtherCoupons,
  canCombineWithSale: coupon.canCombineWithSale,
  appliesOnShipping: coupon.appliesOnShipping,
  startsAt: coupon.startsAt,
  endsAt: coupon.endsAt,
});

/* -------------------------------------------------------
   Admin
------------------------------------------------------- */
export const createCoupon = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      couponCode: req.body?.couponCode ? upper(req.body.couponCode) : undefined,
      updatedBy: req.admin?._id || null,
      createdBy: req.admin?._id || null,
    };

    const coupon = await Coupon.create(payload);

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create coupon",
    });
  }
};

export const getAdminCoupons = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const search = clean(req.query.search);
    const status = clean(req.query.status);
    const isActive = toBool(req.query.isActive);
    const isHidden = toBool(req.query.isHidden);
    const autoApply = toBool(req.query.autoApply);
    const discountType = clean(req.query.discountType);
    const sortBy = clean(req.query.sortBy) || "createdAt";
    const sortOrder = clean(req.query.sortOrder) === "asc" ? 1 : -1;

    const query = {};

    if (search) {
      query.$or = [
        { couponCode: { $regex: search, $options: "i" } },
        { couponName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (typeof isActive === "boolean") query.isActive = isActive;
    if (typeof isHidden === "boolean") query.isHidden = isHidden;
    if (typeof autoApply === "boolean") query.autoApply = autoApply;
    if (discountType) query.discountType = discountType;

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .select(couponSelect)
        .sort({ [sortBy]: sortOrder, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      coupons,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch coupons",
    });
  }
};

export const getAdminCouponById = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon id",
      });
    }

    const coupon = await Coupon.findById(couponId).select(couponSelect).lean();

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch coupon",
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon id",
      });
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    Object.assign(coupon, {
      ...req.body,
      couponCode: req.body?.couponCode ? upper(req.body.couponCode) : coupon.couponCode,
      updatedBy: req.admin?._id || coupon.updatedBy || null,
    });

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update coupon",
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon id",
      });
    }

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete coupon",
    });
  }
};

export const updateCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.params;
    const { status, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon id",
      });
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (status) coupon.status = status;
    if (typeof isActive === "boolean") coupon.isActive = isActive;
    coupon.updatedBy = req.admin?._id || coupon.updatedBy || null;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon status updated successfully",
      coupon,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update coupon status",
    });
  }
};

export const toggleCouponVisibility = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon id",
      });
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    coupon.isHidden = !coupon.isHidden;
    coupon.updatedBy = req.admin?._id || coupon.updatedBy || null;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isHidden ? "hidden" : "visible"} successfully`,
      coupon,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update coupon visibility",
    });
  }
};

/* -------------------------------------------------------
   Customer / Public
------------------------------------------------------- */
export const getAvailableCoupons = async (req, res) => {
  try {
    const autoApplyOnly = toBool(req.query.autoApplyOnly, false);

    const query = {
      isActive: true,
      isHidden: false,
      status: "active",
    };

    if (autoApplyOnly) {
      query.autoApply = true;
    }

    const coupons = await Coupon.find(query)
      .select(couponSelect)
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    const liveCoupons = coupons
      .filter((coupon) => isCouponLive(coupon).ok)
      .map(publicCouponShape);

    return res.status(200).json({
      success: true,
      coupons: liveCoupons,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch available coupons",
    });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      subtotal = 0,
      shipping = 0,
      totalQty = 0,
      productCodes = [],
      customerCode = "",
      email = "",
      paymentMethod = "",
      isFirstOrder = false,
      customerUsedCount = 0,
    } = req.body || {};

    const normalizedCode = upper(couponCode);

    if (!normalizedCode) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const coupon = await Coupon.findOne({
      couponCode: normalizedCode,
      isHidden: false,
    }).select(couponSelect);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const result = validateCouponForCart({
      coupon,
      subtotal,
      shipping,
      totalQty,
      productCodes,
      customerCode,
      email,
      paymentMethod,
      isFirstOrder,
      customerUsedCount,
    });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      coupon: publicCouponShape(coupon),
      pricing: {
        subtotal: Number(toNum(subtotal).toFixed(2)),
        shipping: Number(toNum(shipping).toFixed(2)),
        appliedOnAmount: result.appliedOnAmount,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to validate coupon",
    });
  }
};

export const validateAutoApplyCoupons = async (req, res) => {
  try {
    const {
      subtotal = 0,
      shipping = 0,
      totalQty = 0,
      productCodes = [],
      customerCode = "",
      email = "",
      paymentMethod = "",
      isFirstOrder = false,
      customerUsedCount = 0,
    } = req.body || {};

    const coupons = await Coupon.find({
      isActive: true,
      isHidden: false,
      status: "active",
      autoApply: true,
    })
      .select(couponSelect)
      .sort({ priority: -1, createdAt: -1 });

    let bestCoupon = null;
    let bestPricing = null;

    for (const coupon of coupons) {
      const result = validateCouponForCart({
        coupon,
        subtotal,
        shipping,
        totalQty,
        productCodes,
        customerCode,
        email,
        paymentMethod,
        isFirstOrder,
        customerUsedCount,
      });

      if (!result.valid) continue;

      if (!bestPricing || result.discountAmount > bestPricing.discountAmount) {
        bestCoupon = coupon;
        bestPricing = result;
      }
    }

    if (!bestCoupon || !bestPricing) {
      return res.status(200).json({
        success: true,
        applied: false,
        message: "No auto-apply coupon available",
        coupon: null,
        pricing: null,
      });
    }

    return res.status(200).json({
      success: true,
      applied: true,
      message: "Best auto-apply coupon found",
      coupon: publicCouponShape(bestCoupon),
      pricing: {
        subtotal: Number(toNum(subtotal).toFixed(2)),
        shipping: Number(toNum(shipping).toFixed(2)),
        appliedOnAmount: bestPricing.appliedOnAmount,
        discountAmount: bestPricing.discountAmount,
        finalAmount: bestPricing.finalAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to validate auto-apply coupons",
    });
  }
};