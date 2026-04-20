import mongoose from "mongoose";
import Order from "./orders.js";

const { Types } = mongoose;

/* =========================================================
   HELPERS
========================================================= */
const isValidObjectId = (id) => Types.ObjectId.isValid(id);

const cleanString = (value = "") => String(value || "").trim();

const cleanNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const cleanPagination = (page, limit) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, skip };
};

const applyStatusDates = (order, nextStatus) => {
  if (!nextStatus) return;

  if (nextStatus === "delivered" && !order.deliveredAt) {
    order.deliveredAt = new Date();
    if (!order.shipment?.deliveredAt) {
      order.shipment = {
        ...(order.shipment?.toObject ? order.shipment.toObject() : order.shipment || {}),
        deliveredAt: new Date(),
      };
    }
  }

  if (nextStatus === "cancelled" && !order.cancelledAt) {
    order.cancelledAt = new Date();
  }

  if (nextStatus === "shipped" && !order.shipment?.shippedAt) {
    order.shipment = {
      ...(order.shipment?.toObject ? order.shipment.toObject() : order.shipment || {}),
      shippedAt: new Date(),
    };
  }
};

const buildOrderFilters = (query = {}) => {
  const filter = {};

  if (cleanString(query.orderStatus)) {
    filter.orderStatus = query.orderStatus;
  }

  if (cleanString(query.paymentStatus)) {
    filter["payment.status"] = query.paymentStatus;
  }

  if (cleanString(query.paymentMethod)) {
    filter["payment.method"] = query.paymentMethod;
  }

  if (cleanString(query.source)) {
    filter.source = query.source;
  }

  if (cleanString(query.customerCode)) {
    filter["customer.customerCode"] = String(query.customerCode).trim().toUpperCase();
  }

  if (cleanString(query.phone)) {
    filter["customer.phone"] = String(query.phone).replace(/\D/g, "").slice(-10);
  }

  if (cleanString(query.email)) {
    filter["customer.email"] = String(query.email).trim().toLowerCase();
  }

  if (cleanString(query.couponCode)) {
    filter.couponCode = String(query.couponCode).trim().toUpperCase();
  }

  if (cleanString(query.isConfirmed) !== "") {
    if (query.isConfirmed === "true") filter.isConfirmed = true;
    if (query.isConfirmed === "false") filter.isConfirmed = false;
  }

  if (cleanString(query.startDate) || cleanString(query.endDate)) {
    filter.createdAt = {};

    if (cleanString(query.startDate)) {
      filter.createdAt.$gte = new Date(query.startDate);
    }

    if (cleanString(query.endDate)) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (cleanString(query.search)) {
    const search = cleanString(query.search);
    const phoneDigits = search.replace(/\D/g, "");

    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { "customer.fullName": { $regex: search, $options: "i" } },
      { "customer.firstName": { $regex: search, $options: "i" } },
      { "customer.lastName": { $regex: search, $options: "i" } },
      { "customer.email": { $regex: search, $options: "i" } },
      { "customer.customerCode": { $regex: search, $options: "i" } },
      { "shipment.awbNumber": { $regex: search, $options: "i" } },
      { "items.productCode": { $regex: search, $options: "i" } },
      { "items.name": { $regex: search, $options: "i" } },
    ];

    if (phoneDigits) {
      filter.$or.push({ "customer.phone": { $regex: phoneDigits } });
    }
  }

  return filter;
};

/* =========================================================
   CREATE ORDER
========================================================= */
export const createOrder = async (req, res) => {
  try {
    const body = req.body || {};

    const order = new Order({
      ...body,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    const savedOrder = await order.save();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

/* =========================================================
   GET ALL ORDERS
========================================================= */
export const getOrders = async (req, res) => {
  try {
    const { page, limit, skip } = cleanPagination(req.query.page, req.query.limit);
    const sortBy = cleanString(req.query.sortBy) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const filter = buildOrderFilters(req.query);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ [sortBy]: sortOrder, _id: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + orders.length < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("getOrders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

/* =========================================================
   GET SINGLE ORDER BY ID
========================================================= */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("getOrderById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};

/* =========================================================
   GET SINGLE ORDER BY ORDER NUMBER
========================================================= */
export const getOrderByOrderNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const normalizedOrderNumber = cleanString(orderNumber).toUpperCase();

    if (!normalizedOrderNumber) {
      return res.status(400).json({
        success: false,
        message: "Order number is required",
      });
    }

    const order = await Order.findOne({ orderNumber: normalizedOrderNumber });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("getOrderByOrderNumber error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};

/* =========================================================
   UPDATE ORDER
========================================================= */
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const allowedFields = [
      "customer",
      "billingAddress",
      "shippingAddress",
      "sameAsBilling",
      "items",
      "coupon",
      "couponCode",
      "couponDiscount",
      "additionalDiscount",
      "shippingCharge",
      "codCharge",
      "taxAmount",
      "roundOff",
      "notes",
      "adminRemarks",
      "source",
      "isConfirmed",
      "confirmedAt",
      "payment",
      "shipment",
      "orderStatus",
    ];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        order[key] = body[key];
      }
    }

    if (body.orderStatus) {
      applyStatusDates(order, body.orderStatus);
    }

    if (body.isConfirmed === true && !order.confirmedAt) {
      order.confirmedAt = new Date();
    }

    order.updatedBy = req.user?._id || null;

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("updateOrder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order",
    });
  }
};

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, adminRemarks } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    if (!cleanString(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "orderStatus is required",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = orderStatus;

    if (adminRemarks !== undefined) {
      order.adminRemarks = adminRemarks;
    }

    applyStatusDates(order, orderStatus);
    order.updatedBy = req.user?._id || null;

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

/* =========================================================
   UPDATE PAYMENT
========================================================= */
export const updateOrderPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.payment = {
      ...(order.payment?.toObject ? order.payment.toObject() : order.payment || {}),
      ...body,
    };

    order.payment.amountPaid = cleanNumber(order.payment.amountPaid, 0);
    order.payment.refundedAmount = cleanNumber(order.payment.refundedAmount, 0);

    if (order.payment.status === "paid" && !order.payment.paidAt) {
      order.payment.paidAt = new Date();
    }

    if (
      ["refunded", "partially_refunded"].includes(order.payment.status) &&
      !order.payment.refundedAt
    ) {
      order.payment.refundedAt = new Date();
    }

    order.updatedBy = req.user?._id || null;

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("updateOrderPayment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update payment",
    });
  }
};

/* =========================================================
   UPDATE SHIPMENT
========================================================= */
export const updateShipmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.shipment = {
      ...(order.shipment?.toObject ? order.shipment.toObject() : order.shipment || {}),
      ...body,
    };

    if (
      cleanString(order.shipment.awbNumber) ||
      cleanString(order.shipment.trackingNumber) ||
      cleanString(order.shipment.courierName)
    ) {
      if (order.orderStatus === "processing" || order.orderStatus === "packed" || order.orderStatus === "picked") {
        order.orderStatus = "shipped";
      }

      if (!order.shipment.shippedAt) {
        order.shipment.shippedAt = new Date();
      }
    }

    order.updatedBy = req.user?._id || null;

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: "Shipment updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("updateShipmentDetails error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update shipment",
    });
  }
};

/* =========================================================
   DELETE ORDER
========================================================= */
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("deleteOrder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete order",
    });
  }
};

/* =========================================================
   ORDER STATS
========================================================= */
export const getOrderStats = async (req, res) => {
  try {
    const filter = buildOrderFilters(req.query);

    const [summary] = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$payableAmount" },
          totalQty: { $sum: "$totalQty" },
          avgOrderValue: { $avg: "$payableAmount" },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ["$isConfirmed", true] }, 1, 0] },
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] },
          },
          pendingPayments: {
            $sum: {
              $cond: [{ $eq: ["$payment.status", "pending"] }, 1, 0],
            },
          },
          paidOrders: {
            $sum: {
              $cond: [{ $eq: ["$payment.status", "paid"] }, 1, 0],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      stats: summary || {
        totalOrders: 0,
        totalRevenue: 0,
        totalQty: 0,
        avgOrderValue: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        pendingPayments: 0,
        paidOrders: 0,
      },
    });
  } catch (error) {
    console.error("getOrderStats error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order stats",
    });
  }
};