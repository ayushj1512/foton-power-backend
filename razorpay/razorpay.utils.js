import crypto from "crypto";
import razorpayConfig from "./razorpay.config.js";

export function toPaise(amount) {
  const num = Number(amount || 0);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error("Invalid amount");
  }

  return Math.round(num * 100);
}

export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}) {
  const expectedSignature = crypto
    .createHmac("sha256", razorpayConfig.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

export function verifyWebhookSignature(rawBody, signature) {
  const expectedSignature = crypto
    .createHmac("sha256", razorpayConfig.webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

export function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}