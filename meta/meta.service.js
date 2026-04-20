import axios from "axios";
import { cleanObject } from "./meta.utils.js";

const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "";
const META_API_VERSION = "v23.0";

export async function sendMetaEvent({
  eventName,
  eventId,
  eventSourceUrl,
  userData = {},
  customData = {},
  testEventCode,
} = {}) {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    throw new Error("Meta Pixel ID or Access Token missing in env");
  }

  if (!eventName) {
    throw new Error("eventName is required");
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events`;

  const eventPayload = cleanObject({
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId || undefined,
    action_source: "website",
    event_source_url: eventSourceUrl || undefined,
    user_data: cleanObject(userData),
    custom_data: cleanObject(customData),
  });

  const payload = cleanObject({
    data: [eventPayload],
    test_event_code: testEventCode || META_TEST_EVENT_CODE || undefined,
  });

  try {
    const response = await axios.post(url, payload, {
      params: { access_token: META_ACCESS_TOKEN },
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    const metaMessage =
      error?.response?.data?.error?.message ||
      error?.response?.data?.error?.error_user_msg ||
      error?.message ||
      "Failed to send Meta event";

    const err = new Error(metaMessage);
    err.statusCode = error?.response?.status || 500;
    err.details = error?.response?.data || null;
    throw err;
  }
}