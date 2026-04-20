import express from "express";
import {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrderByOrderNumber,
  getOrders,
  getOrderStats,
  updateOrder,
  updateOrderPayment,
  updateOrderStatus,
  updateShipmentDetails,
} from "./orders.controller.js";

const router = express.Router();

/* =========================================================
   ORDER ROUTES
========================================================= */
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/stats", getOrderStats);
router.get("/number/:orderNumber", getOrderByOrderNumber);
router.get("/:id", getOrderById);

router.put("/:id", updateOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/payment", updateOrderPayment);
router.patch("/:id/shipment", updateShipmentDetails);

router.delete("/:id", deleteOrder);

export default router;