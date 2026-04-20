export const MAILER_FROM_NAME = "Miray";

export const MAILER_EVENTS = {
  ORDER_CONFIRMATION: "order_confirmation",
  ORDER_SHIPPED: "order_shipped",
  ORDER_DELIVERED: "order_delivered",
  ORDER_CANCELLED: "order_cancelled",
};

export const MAILER_SUBJECTS = {
  [MAILER_EVENTS.ORDER_CONFIRMATION]: (orderNumber) =>
    `Order Confirmed - ${orderNumber}`,

  [MAILER_EVENTS.ORDER_SHIPPED]: (orderNumber) =>
    `Order Shipped - ${orderNumber}`,

  [MAILER_EVENTS.ORDER_DELIVERED]: (orderNumber) =>
    `Order Delivered - ${orderNumber}`,

  [MAILER_EVENTS.ORDER_CANCELLED]: (orderNumber) =>
    `Order Cancelled - ${orderNumber}`,
};

export const MAILER_BRAND = {
  name: "Miray",
  logo: "https://res.cloudinary.com/dcayfmx5m/image/upload/v1775325984/foton_media/general/general/general/iofh1owcepnekhckevwd.webp",

  colors: {
    navy: "#0f172a",
    green: "#15803d",
  },
};