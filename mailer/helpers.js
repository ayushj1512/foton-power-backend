export const isValidEmail = (email = "") => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

export const getOrderEmail = (order) => {
  return (
    order?.customer?.email ||
    order?.billingAddress?.email ||
    order?.shippingAddress?.email ||
    ""
  )
    .trim()
    .toLowerCase();
};

export const getCustomerName = (order) => {
  return (
    order?.customer?.fullName ||
    order?.billingAddress?.fullName ||
    order?.shippingAddress?.fullName ||
    "Customer"
  ).trim();
};

export const getSafeOrderNumber = (order) => {
  return String(order?.orderNumber || "Order").trim();
};