import RazorpayPayment from "./razorpay.model.js";
import {
  createRazorpayOrder,
  verifyAndMarkPayment,
  fetchPaymentById,
  fetchOrderById,
  createRefund,
  processWebhook,
} from "./razorpay.service.js";
import razorpayConfig from "./razorpay.config.js";

export async function createPaymentOrder(req, res) {
  try {
    const {
      amount,
      receipt,
      notes = {},
      customer = {},
    } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const finalReceipt =
      receipt || `receipt_${Date.now()}`;

    const { paymentDoc, razorpayOrder } = await createRazorpayOrder({
      amount,
      receipt: finalReceipt,
      notes,
      customer,
    });

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      data: {
        dbPaymentId: paymentDoc._id,
        key: razorpayConfig.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        razorpayOrderId: razorpayOrder.id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
}

export async function verifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay verification fields",
      });
    }

    const payment = await verifyAndMarkPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
}

export async function handleWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];
    const rawBody = req.body.toString("utf8");
    const payload = JSON.parse(rawBody);

    const result = await processWebhook({
      rawBody,
      signature,
      eventId,
      payload,
    });

    return res.status(200).json({
      success: true,
      duplicate: result.duplicate,
      message: result.duplicate
        ? "Duplicate webhook ignored"
        : "Webhook processed successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
}

export async function getPaymentByOrderId(req, res) {
  try {
    const { razorpayOrderId } = req.params;

    const payment = await RazorpayPayment.findOne({ razorpayOrderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
}

export async function getPaymentStatusFromRazorpay(req, res) {
  try {
    const { paymentId } = req.params;
    const payment = await fetchPaymentById(paymentId);

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment from Razorpay",
      error: error.message,
    });
  }
}

export async function getOrderStatusFromRazorpay(req, res) {
  try {
    const { orderId } = req.params;
    const order = await fetchOrderById(orderId);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order from Razorpay",
      error: error.message,
    });
  }
}

export async function refundPayment(req, res) {
  try {
    const { paymentId, amount, notes, receipt } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "paymentId is required",
      });
    }

    const refund = await createRefund({
      paymentId,
      amount,
      notes,
      receipt,
    });

    return res.status(200).json({
      success: true,
      message: "Refund initiated successfully",
      data: refund,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Refund failed",
      error: error.message,
    });
  }
}