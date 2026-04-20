const shiprocketConfig = {
  baseURL:
    process.env.SHIPROCKET_BASE_URL ||
    "https://apiv2.shiprocket.in/v1/external",

  email: process.env.SHIPROCKET_EMAIL || "",
  password: process.env.SHIPROCKET_PASSWORD || "",
  defaultPickupLocation:
    process.env.SHIPROCKET_DEFAULT_PICKUP_LOCATION || "Primary",

  tokenBufferSeconds: Number(process.env.SHIPROCKET_TOKEN_BUFFER_SECONDS || 300),
};

export default shiprocketConfig;