import crypto from "crypto";
import razorpayConfig from "./razorpay.config.js";

export function toPaise(amount) {
  const num = Number(amount || 0);
  if (!Number.isInteger(num) || num < 100) {
    throw new Error("Amount must be at least 100 paise");
  }

  return num;
}

export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}) {
  if (!razorpayConfig.keySecret) {
    throw new Error("Razorpay key secret is not configured");
  }

  const expectedSignature = crypto
    .createHmac("sha256", razorpayConfig.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const signatureBuffer = Buffer.from(String(signature || ""), "hex");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  );
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
