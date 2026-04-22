import Order from "../orders/orders.js";
import { ShiprocketError } from "./shiprocket.errors.js";
import {
  mergeShipmentSync,
  normalizeShiprocketBookingSnapshot,
  buildTrackingSyncFromShiprocketTracking,
} from "./shiprocket.sync.js";
import { trackByAwb } from "./shiprocket.service.js";

export async function syncBookedShipmentToOrder(orderId) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ShiprocketError("Order not found", 404);
  }

  const shipmentPatch = normalizeShiprocketBookingSnapshot(order);
  order.shipment = mergeShipmentSync(order, shipmentPatch);

  await order.save();

  return {
    success: true,
    message: "Booked shipment synced to order successfully",
    order,
  };
}

export async function syncTrackingToOrder(orderId) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ShiprocketError("Order not found", 404);
  }

  const awb =
    order?.shipment?.awbNumber || order?.shipment?.trackingNumber || "";

  if (!awb) {
    throw new ShiprocketError("AWB number not found on order", 400);
  }

  const tracking = await trackByAwb(awb);
  const trackingSync = buildTrackingSyncFromShiprocketTracking(tracking, order);

  order.shipment = mergeShipmentSync(order, trackingSync.shipment);

  if (trackingSync.orderStatus) {
    order.orderStatus = trackingSync.orderStatus;
  }

  if (trackingSync.deliveredAt && !order.deliveredAt) {
    order.deliveredAt = trackingSync.deliveredAt;
  }

  await order.save();

  return {
    success: true,
    message: "Tracking synced to order successfully",
    order,
    tracking,
  };
}