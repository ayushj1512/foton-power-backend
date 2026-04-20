const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || null,
  keySecret: process.env.RAZORPAY_KEY_SECRET || null,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  currency: process.env.RAZORPAY_CURRENCY || "INR",
  frontendUrl: process.env.FRONTEND_URL || "",
};

export default razorpayConfig;