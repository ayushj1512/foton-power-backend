import Order from "../orders/orders.js";
import { ShiprocketError } from "./shiprocket.errors.js";
import {
  autoBookOrder,
  cancelShiprocketOrder,
  checkServiceability,
  chooseCourier,
  getPickupLocations,
  manualBookOrder,
  processShiprocketWebhook,
  syncTracking,
} from "./shiprocket.service.js";
import { getServiceabilityPayload } from "./shiprocket.mapper.js";

function sendError(res, error) {
  const status = error?.statusCode || 500;

  return res.status(status).json({
    success: false,
    message: error?.message || "Something went wrong",
    error: error?.details || null,
  });
}

export async function getShiprocketPickupLocationsController(req, res) {
  try {
    const data = await getPickupLocations();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function checkServiceabilityController(req, res) {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      throw new ShiprocketError("Order not found", 404);
    }

    const params = getServiceabilityPayload(order, req.body || {});
    const data = await checkServiceability(params);
    const recommendedCourier = chooseCourier(
      data,
      req.body?.strategy || "cheapest"
    );

    return res.json({
      success: true,
      data,
      recommendedCourier,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function autoBookOrderController(req, res) {
  try {
    const { orderId } = req.params;
    const result = await autoBookOrder(orderId, req.body || {});

    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function manualBookOrderController(req, res) {
  try {
    const { orderId } = req.params;
    const result = await manualBookOrder(orderId, req.body || {});

    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function syncTrackingController(req, res) {
  try {
    const { orderId } = req.params;
    const result = await syncTracking(orderId);

    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function cancelShiprocketOrderController(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || !ids.length) {
      throw new ShiprocketError("ids array is required", 400);
    }

    const result = await cancelShiprocketOrder(ids);

    return res.json({
      success: true,
      message: "Shiprocket cancel request sent successfully",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function shiprocketWebhookController(req, res) {
  try {
    const result = await processShiprocketWebhook(req.body || {});

    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error);
  }
}