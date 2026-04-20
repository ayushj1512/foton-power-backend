import razorpay from "./razorpay.client.js";
import razorpayConfig from "./razorpay.config.js";
import RazorpayPayment from "./razorpay.model.js";
import RazorpayWebhookEvent from "./razorpayWebhookEvent.model.js";
import {
  toPaise,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "./razorpay.utils.js";

export async function createRazorpayOrder({
  amount,
  receipt,
  notes = {},
  customer = {},
}) {
  const amountInPaise = toPaise(amount);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: razorpayConfig.currency,
    receipt,
    notes,
  });

  const paymentDoc = await RazorpayPayment.create({
    receipt,
    notes,
    amount,
    currency: razorpayConfig.currency,
    razorpayOrderId: razorpayOrder.id,
    status: "created",
    paymentStatus: "pending",
    customer,
  });

  return {
    paymentDoc,
    razorpayOrder,
  };
}

export async function verifyAndMarkPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    throw new Error("Invalid Razorpay payment signature");
  }

  const payment = await RazorpayPayment.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!payment) {
    throw new Error("Payment record not found for this Razorpay order");
  }

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.status = "paid";
  payment.paymentStatus = "paid";
  payment.paidAt = new Date();

  await payment.save();

  return payment;
}

export async function fetchPaymentById(paymentId) {
  return razorpay.payments.fetch(paymentId);
}

export async function fetchOrderById(orderId) {
  return razorpay.orders.fetch(orderId);
}

export async function createRefund({
  paymentId,
  amount,
  notes = {},
  receipt,
}) {
  const refundPayload = {
    notes,
  };

  if (amount) {
    refundPayload.amount = toPaise(amount);
  }

  if (receipt) {
    refundPayload.receipt = receipt;
  }

  const refund = await razorpay.payments.refund(paymentId, refundPayload);

  const paymentDoc = await RazorpayPayment.findOne({
    razorpayPaymentId: paymentId,
  });

  if (paymentDoc) {
    paymentDoc.razorpayRefundId = refund.id;
    paymentDoc.status =
      refund.status === "processed" ? "refunded" : paymentDoc.status;
    paymentDoc.paymentStatus =
      refund.status === "processed" ? "refunded" : paymentDoc.paymentStatus;
    if (refund.status === "processed") {
      paymentDoc.refundedAt = new Date();
    }
    await paymentDoc.save();
  }

  return refund;
}

export async function processWebhook({
  rawBody,
  signature,
  eventId,
  payload,
}) {
  const isValidSignature = verifyWebhookSignature(rawBody, signature);

  if (!isValidSignature) {
    throw new Error("Invalid Razorpay webhook signature");
  }

  if (!eventId) {
    throw new Error("Missing x-razorpay-event-id header");
  }

  const existingEvent = await RazorpayWebhookEvent.findOne({ eventId });
  if (existingEvent) {
    return {
      duplicate: true,
      event: existingEvent,
    };
  }

  const webhookEvent = await RazorpayWebhookEvent.create({
    eventId,
    event: payload.event,
    payload,
    processed: false,
  });

  await handleWebhookEvent(payload, eventId);

  webhookEvent.processed = true;
  webhookEvent.processedAt = new Date();
  await webhookEvent.save();

  return {
    duplicate: false,
    event: webhookEvent,
  };
}

async function handleWebhookEvent(payload, eventId) {
  const event = payload?.event;

  if (event === "payment.authorized") {
    const paymentEntity = payload?.payload?.payment?.entity;
    if (!paymentEntity?.order_id) return;

    await RazorpayPayment.findOneAndUpdate(
      { razorpayOrderId: paymentEntity.order_id },
      {
        $set: {
          razorpayPaymentId: paymentEntity.id,
          status: "authorized",
          method: paymentEntity.method || "",
        },
        $push: {
          webhookEvents: {
            eventId,
            event,
            receivedAt: new Date(),
          },
        },
      },
      { new: true }
    );
    return;
  }

  if (event === "payment.captured" || event === "order.paid") {
    const paymentEntity =
      payload?.payload?.payment?.entity ||
      payload?.payload?.order?.entity?.payments?.[0];

    const orderEntity = payload?.payload?.order?.entity;
    const razorpayOrderId =
      paymentEntity?.order_id || orderEntity?.id || null;

    if (!razorpayOrderId) return;

    await RazorpayPayment.findOneAndUpdate(
      { razorpayOrderId },
      {
        $set: {
          razorpayPaymentId: paymentEntity?.id,
          status: "captured",
          paymentStatus: "paid",
          method: paymentEntity?.method || "",
          paidAt: new Date(),
        },
        $push: {
          webhookEvents: {
            eventId,
            event,
            receivedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return;
  }

  if (event === "payment.failed") {
    const paymentEntity = payload?.payload?.payment?.entity;
    if (!paymentEntity?.order_id) return;

    await RazorpayPayment.findOneAndUpdate(
      { razorpayOrderId: paymentEntity.order_id },
      {
        $set: {
          razorpayPaymentId: paymentEntity.id,
          status: "failed",
          paymentStatus: "failed",
          method: paymentEntity.method || "",
          error: {
            code: paymentEntity.error_code || "",
            description: paymentEntity.error_description || "",
            source: paymentEntity.error_source || "",
            step: paymentEntity.error_step || "",
            reason: paymentEntity.error_reason || "",
            metadata: paymentEntity,
          },
        },
        $push: {
          webhookEvents: {
            eventId,
            event,
            receivedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return;
  }

  if (event === "refund.processed") {
    const refundEntity = payload?.payload?.refund?.entity;
    const paymentId = refundEntity?.payment_id;
    if (!paymentId) return;

    await RazorpayPayment.findOneAndUpdate(
      { razorpayPaymentId: paymentId },
      {
        $set: {
          razorpayRefundId: refundEntity.id,
          status: "refunded",
          paymentStatus: "refunded",
          refundedAt: new Date(),
        },
        $push: {
          webhookEvents: {
            eventId,
            event,
            receivedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return;
  }
}