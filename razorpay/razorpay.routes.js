import express from "express";
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getPaymentByOrderId,
  getPaymentStatusFromRazorpay,
  getOrderStatusFromRazorpay,
  refundPayment,
} from "./razorpay.controller.js";

const router = express.Router();

router.post("/create-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);

// webhook route yaha mount hoga but IMPORTANT:
// server.js mei is path ke liye express.raw() use karna hai
router.post("/webhook", handleWebhook);

router.get("/payment/order/:razorpayOrderId", getPaymentByOrderId);
router.get("/payment/status/:paymentId", getPaymentStatusFromRazorpay);
router.get("/order/status/:orderId", getOrderStatusFromRazorpay);

router.post("/refund", refundPayment);

export default router;