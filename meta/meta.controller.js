import { sendMetaEvent } from "./meta.service.js";
import { cleanObject, getMetaUserData } from "./meta.utils.js";

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "";
};

export async function sendCustomMetaEventController(req, res) {
  try {
    const {
      eventName,
      eventId,
      eventSourceUrl,
      customer = {},
      customData = {},
      fbp,
      fbc,
      testEventCode,
    } = req.body || {};

    if (!eventName) {
      return res.status(400).json({
        success: false,
        message: "eventName is required",
      });
    }

    const userData = getMetaUserData({
      email: customer.email,
      phone: customer.phone,
      firstName: customer.firstName,
      lastName: customer.lastName,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      zip: customer.zip,
      fbp,
      fbc,
      clientIp: getClientIp(req),
      userAgent: req.get("user-agent") || "",
    });

    const data = await sendMetaEvent({
      eventName,
      eventId,
      eventSourceUrl,
      userData,
      customData: cleanObject(customData),
      testEventCode,
    });

    return res.status(200).json({
      success: true,
      message: "Meta event sent successfully",
      data,
    });
  } catch (error) {
    return res.status(error?.statusCode || 500).json({
      success: false,
      message: error?.message || "Failed to send Meta event",
      error: error?.details || null,
    });
  }
}