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

  return {
    order_id: order.orderNumber,
    order_date: new Date(order.createdAt || Date.now())
      .toISOString()
      .slice(0, 19)
      .replace("T", " "),
    pickup_location: options.pickupLocation || "Primary",

    billing_customer_name: billing.fullName || order?.customer?.fullName || "Customer",
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
    shipping_customer_name: shipping.fullName || order?.customer?.fullName || "Customer",
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
      selling_price: safeNumber(item.unitPayable, item.discountPrice || item.mrp || 0),
      discount: Math.max(
        safeNumber(item.mrp, 0) - safeNumber(item.unitPayable, item.discountPrice || 0),
        0
      ),
      tax: 0,
      hsn: item.hsnCode || "",
    })),

    payment_method:
      payment.method === "cod" ? PAYMENT_METHOD.COD : PAYMENT_METHOD.PREPAID,

    sub_total: safeNumber(order.subtotal, 0),
    shipping_charges: safeNumber(order.shippingCharge, 0),
    total_discount: safeNumber(order.totalDiscount, 0),

    length,
    breadth,
    height,
    weight,
  };
}

export function getServiceabilityPayload(order, options = {}) {
  return {
    pickup_postcode: String(options.pickupPincode || ""),
    delivery_postcode: String(order?.shippingAddress?.pincode || ""),
    cod: order?.payment?.method === "cod" ? 1 : 0,
    weight: safeNumber(options.weight, DEFAULT_PACKAGE.weight),
    length: safeNumber(options.length, DEFAULT_PACKAGE.length),
    breadth: safeNumber(options.breadth, DEFAULT_PACKAGE.breadth),
    height: safeNumber(options.height, DEFAULT_PACKAGE.height),
    declared_value: safeNumber(order?.payableAmount, 0),
  };
}