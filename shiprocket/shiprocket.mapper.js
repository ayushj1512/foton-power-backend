import shiprocketConfig from "./shiprocket.config.js";
import { DEFAULT_PACKAGE, PAYMENT_METHOD } from "./shiprocket.constants.js";

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export function mapOrderToShiprocketPayload(order, options = {}) {
  const shipping = order.shippingAddress || {};
  const billing = order.billingAddress || shipping;
  const payment = order.payment || {};
  const items = Array.isArray(order.items) ? order.items : [];

  const length = safeNumber(options.length, DEFAULT_PACKAGE.length);
  const breadth = safeNumber(options.breadth, DEFAULT_PACKAGE.breadth);
  const height = safeNumber(options.height, DEFAULT_PACKAGE.height);
  const weight = safeNumber(options.weight, DEFAULT_PACKAGE.weight);

  const subTotal = safeNumber(order.subtotal, 0);
  const couponDiscount = safeNumber(order.couponDiscount, 0);
  const additionalDiscount = safeNumber(order.additionalDiscount, 0);
  const shippingCharges = safeNumber(order.shippingCharge, 0);
  const codCharge = safeNumber(order.codCharge, 0);
  const payableAmount = safeNumber(order.payableAmount, 0);

  const orderLevelDiscount = couponDiscount + additionalDiscount;

  return {
    order_id: String(order.orderNumber || order._id || ""),
    order_date: new Date(order.createdAt || Date.now())
      .toISOString()
      .slice(0, 19)
      .replace("T", " "),
    pickup_location:
      options.pickupLocation ||
      shiprocketConfig.defaultPickupLocation ||
      "Primary",

    billing_customer_name:
      billing.fullName || order?.customer?.fullName || "Customer",
    billing_last_name: "",
    billing_address: billing.addressLine1 || "",
    billing_address_2: billing.addressLine2 || "",
    billing_city: billing.city || "",
    billing_pincode: String(billing.pincode || ""),
    billing_state: billing.state || "",
    billing_country: billing.country || "India",
    billing_email: billing.email || order?.customer?.email || "",
    billing_phone: String(billing.phone || order?.customer?.phone || ""),

    shipping_is_billing: false,
    shipping_customer_name:
      shipping.fullName || order?.customer?.fullName || "Customer",
    shipping_last_name: "",
    shipping_address: shipping.addressLine1 || "",
    shipping_address_2: shipping.addressLine2 || "",
    shipping_city: shipping.city || "",
    shipping_pincode: String(shipping.pincode || ""),
    shipping_state: shipping.state || "",
    shipping_country: shipping.country || "India",
    shipping_email: shipping.email || order?.customer?.email || "",
    shipping_phone: String(shipping.phone || order?.customer?.phone || ""),

    order_items: items.map((item, index) => ({
      name: item.name || `Item ${index + 1}`,
      sku: item.sku || item.productCode || `SKU-${index + 1}`,
      units: safeNumber(item.quantity, 1),
      selling_price: safeNumber(
        item.unitPayable,
        item.discountPrice || item.mrp || 0
      ),
      discount: 0,
      tax: 0,
      hsn: item.hsnCode || "",
    })),

    payment_method:
      payment.method === "cod" ? PAYMENT_METHOD.COD : PAYMENT_METHOD.PREPAID,

    sub_total: subTotal,
    shipping_charges: shippingCharges + codCharge,
    total_discount: orderLevelDiscount,

    // important for COD
    collectable_amount:
      payment.method === "cod" ? payableAmount : 0,

    length,
    breadth,
    height,
    weight,
  };
}

export function getServiceabilityPayload(order, options = {}) {
  return {
    pickup_postcode: String(
      options.pickupPincode || shiprocketConfig.pickupPincode || ""
    ),
    delivery_postcode: String(order?.shippingAddress?.pincode || ""),
    cod: order?.payment?.method === "cod" ? 1 : 0,
    weight: safeNumber(options.weight, DEFAULT_PACKAGE.weight),
    length: safeNumber(options.length, DEFAULT_PACKAGE.length),
    breadth: safeNumber(options.breadth, DEFAULT_PACKAGE.breadth),
    height: safeNumber(options.height, DEFAULT_PACKAGE.height),
    declared_value: safeNumber(order?.payableAmount, 0),
  };
}