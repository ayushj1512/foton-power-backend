import Razorpay from "razorpay";
import razorpayConfig from "./razorpay.config.js";

let razorpay = null;

// ✅ Only initialize if keys exist
if (razorpayConfig.keyId && razorpayConfig.keySecret) {
  razorpay = new Razorpay({
    key_id: razorpayConfig.keyId,
    key_secret: razorpayConfig.keySecret,
  });
} else {
  console.warn("⚠️ Razorpay disabled: Missing API keys");
}

export default razorpay;