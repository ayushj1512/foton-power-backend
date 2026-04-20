import Order from "../orders/orders.js";
import shiprocketClient, {
  normalizeShiprocketError,
} from "./shiprocket.client.js";
import { ShiprocketError } from "./shiprocket.errors.js";
import {
  BOOKING_MODE,
  COURIER_SELECTION,
} from "./shiprocket.constants.js";
import {
  getServiceabilityPayload,
  mapOrderToShiprocketPayload,
} from "./shiprocket.mapper.js";

function getShipmentObject(order) {
  return order?.shipment?.toObject ? order.shipment.toObject() : order?.shipment || {};
}

function getShiprocketObject(order) {
  const shipment = getShipmentObject(order);
  return shipment?.shiprocket || {};
}

function getCourierName(courier) {
  return String(courier?.courier_name || "").trim();
}

function getAwbCode(awb) {
  return (
    awb?.response?.data?.awb_code ||
    awb?.awb_code ||
    ""
  );
}

function getShipmentIdFromBooking(booking) {
  return (
    booking?.shipment_id ||
    booking?.shipment_response?.data?.shipment_id ||
    booking?.shipment_response?.shipment_id ||
    booking?.shipment_id?.[0] ||
    ""
  );
}

function getOrderIdFromBooking(booking, fallback = "") {
  return String(
    booking?.order_id ||
      booking?.shipment_response?.data?.order_id ||
      fallback ||
      ""
  );
}

export async function getPickupLocations() {
  try {
    const { data } = await shiprocketClient.get("/settings/company/pickup");
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to fetch pickup locations");
  }
}

export async function checkServiceability(params) {
  try {
    const { data } = await shiprocketClient.get("/courier/serviceability/", {
      params,
    });
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to check serviceability");
  }
}

export function chooseCourier(
  serviceability,
  strategy = COURIER_SELECTION.CHEAPEST
) {
  const couriers = serviceability?.data?.available_courier_companies || [];

  if (!couriers.length) {
    throw new ShiprocketError(
      "No courier available for this shipment",
      400,
      serviceability
    );
  }

  const sorted = [...couriers].sort((a, b) => {
    const aRate = Number(a?.rate || a?.freight_charge || 999999);
    const bRate = Number(b?.rate || b?.freight_charge || 999999);
    const aDays = Number(a?.estimated_delivery_days || 999999);
    const bDays = Number(b?.estimated_delivery_days || 999999);

    if (strategy === COURIER_SELECTION.FASTEST) {
      return aDays - bDays || aRate - bRate;
    }

    return aRate - bRate || aDays - bDays;
  });

  return sorted[0];
}

export async function createAdhocOrder(payload) {
  try {
    const { data } = await shiprocketClient.post("/orders/create/adhoc", payload);
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to create Shiprocket order");
  }
}

export async function assignAwb({ shipment_id, courier_company_id }) {
  try {
    const { data } = await shiprocketClient.post("/courier/assign/awb", {
      shipment_id,
      courier_company_id,
    });
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to assign AWB");
  }
}

export async function requestPickup({ shipment_id }) {
  try {
    const { data } = await shiprocketClient.post("/courier/generate/pickup", {
      shipment_id: Array.isArray(shipment_id) ? shipment_id : [shipment_id],
    });
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to request pickup");
  }
}

export async function getLabel(shipment_id) {
  try {
    const { data } = await shiprocketClient.get("/courier/generate/label", {
      params: { shipment_id },
    });
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to fetch label");
  }
}

export async function getInvoice(order_id) {
  try {
    const { data } = await shiprocketClient.get("/orders/print/invoice", {
      params: { ids: order_id },
    });
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to fetch invoice");
  }
}

export async function getManifest(shipment_id) {
  try {
    const { data } = await shiprocketClient.get("/manifests/generate", {
      params: { shipment_id },
    });
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to fetch manifest");
  }
}

export async function trackByAwb(awb) {
  try {
    const { data } = await shiprocketClient.get(`/courier/track/awb/${awb}`);
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to track shipment");
  }
}

export async function cancelShiprocketOrder(ids = []) {
  try {
    const { data } = await shiprocketClient.post("/orders/cancel", { ids });
    return data;
  } catch (error) {
    throw normalizeShiprocketError(error, "Failed to cancel Shiprocket order");
  }
}

function ensureOrderBookable(order) {
  if (!order) {
    throw new ShiprocketError("Order not found", 404);
  }

  if (!order?.shippingAddress?.pincode) {
    throw new ShiprocketError("Shipping pincode missing on order", 400);
  }

  if (!order?.items?.length) {
    throw new ShiprocketError("Order items missing", 400);
  }

  if (
    order.orderStatus === "cancelled" ||
    order.orderStatus === "failed" ||
    order.orderStatus === "rto"
  ) {
    throw new ShiprocketError("This order is not bookable", 400);
  }
}

export async function autoBookOrder(orderId, options = {}) {
  const order = await Order.findById(orderId);
  ensureOrderBookable(order);

  const pickupPincode = String(options?.pickupPincode || "").trim();

  if (!pickupPincode) {
    throw new ShiprocketError(
      "pickupPincode is required for serviceability check",
      400
    );
  }

  try {
    const serviceabilityPayload = getServiceabilityPayload(order, options);
    const serviceability = await checkServiceability(serviceabilityPayload);

    const selectedCourier = chooseCourier(
      serviceability,
      options?.strategy || COURIER_SELECTION.CHEAPEST
    );

    const bookingPayload = mapOrderToShiprocketPayload(order, options);
    const booking = await createAdhocOrder(bookingPayload);

    const shipmentId = getShipmentIdFromBooking(booking);

    if (!shipmentId) {
      throw new ShiprocketError(
        "Shipment ID not returned by Shiprocket",
        500,
        booking
      );
    }

    const awb = await assignAwb({
      shipment_id: shipmentId,
      courier_company_id: selectedCourier?.courier_company_id,
    });

    const pickup = await requestPickup({ shipment_id: shipmentId });
    const label = await getLabel(shipmentId).catch(() => null);
    const manifest = await getManifest(shipmentId).catch(() => null);

    const previousShipment = getShipmentObject(order);
    const previousShiprocket = getShiprocketObject(order);
    const courierName = getCourierName(selectedCourier);
    const awbCode = getAwbCode(awb);

    order.shipment = {
      ...previousShipment,
      courierName,
      awbNumber: awbCode || previousShipment?.awbNumber || "",
      trackingNumber: awbCode || "",
      trackingUrl: previousShipment?.trackingUrl || "",
      status: "booked",
      labelUrl: label?.label_url || "",
      invoiceUrl: previousShipment?.invoiceUrl || "",
      shiprocket: {
        ...previousShiprocket,
        isBooked: true,
        bookingMode: BOOKING_MODE.AUTO,
        channelOrderId: getOrderIdFromBooking(booking, order?.orderNumber),
        shiprocketOrderId: getOrderIdFromBooking(booking),
        shipmentId: String(shipmentId),
        courierCompanyId: String(selectedCourier?.courier_company_id || ""),
        courierCompanyName: courierName,
        pickupTokenNumber: String(
          pickup?.response?.pickup_token_number ||
            pickup?.pickup_token_number ||
            ""
        ),
        pickupScheduledDate: String(
          pickup?.response?.pickup_scheduled_date ||
            pickup?.pickup_scheduled_date ||
            ""
        ),
        manifestUrl: manifest?.manifest_url || "",
        serviceabilityRaw: serviceability,
        bookingRaw: booking,
        awbRaw: awb,
        pickupRaw: pickup,
        bookedAt: new Date(),
        syncedAt: new Date(),
        lastError: "",
        lastErrorRaw: null,
      },
    };

    await order.save();

    return {
      success: true,
      message: "Order booked successfully with Shiprocket",
      order,
      shiprocket: {
        serviceability,
        selectedCourier,
        booking,
        awb,
        pickup,
        label,
        manifest,
      },
    };
  } catch (error) {
    const normalized = normalizeShiprocketError(error, "Auto booking failed");
    const previousShipment = getShipmentObject(order);
    const previousShiprocket = getShiprocketObject(order);

    order.shipment = {
      ...previousShipment,
      shiprocket: {
        ...previousShiprocket,
        isBooked: false,
        bookingMode: BOOKING_MODE.AUTO,
        lastError: normalized?.message || "Auto booking failed",
        lastErrorRaw: normalized?.details || null,
        syncedAt: new Date(),
      },
    };

    await order.save().catch(() => {});
    throw normalized;
  }
}

export async function manualBookOrder(orderId, body = {}) {
  const order = await Order.findById(orderId);
  ensureOrderBookable(order);

  const {
    shipment_id,
    courier_company_id,
    request_pickup = true,
  } = body;

  if (!shipment_id || !courier_company_id) {
    throw new ShiprocketError(
      "shipment_id and courier_company_id are required",
      400
    );
  }

  try {
    const awb = await assignAwb({ shipment_id, courier_company_id });
    const pickup = request_pickup
      ? await requestPickup({ shipment_id })
      : null;

    const previousShipment = getShipmentObject(order);
    const previousShiprocket = getShiprocketObject(order);
    const awbCode = getAwbCode(awb);

    order.shipment = {
      ...previousShipment,
      awbNumber: awbCode || "",
      trackingNumber: awbCode || "",
      status: "booked",
      shiprocket: {
        ...previousShiprocket,
        isBooked: true,
        bookingMode: BOOKING_MODE.MANUAL,
        shipmentId: String(shipment_id),
        courierCompanyId: String(courier_company_id),
        awbRaw: awb,
        pickupRaw: pickup,
        bookedAt: new Date(),
        syncedAt: new Date(),
        lastError: "",
        lastErrorRaw: null,
      },
    };

    await order.save();

    return {
      success: true,
      message: "Manual Shiprocket booking completed",
      order,
      shiprocket: { awb, pickup },
    };
  } catch (error) {
    const normalized = normalizeShiprocketError(error, "Manual booking failed");
    const previousShipment = getShipmentObject(order);
    const previousShiprocket = getShiprocketObject(order);

    order.shipment = {
      ...previousShipment,
      shiprocket: {
        ...previousShiprocket,
        isBooked: false,
        bookingMode: BOOKING_MODE.MANUAL,
        lastError: normalized?.message || "Manual booking failed",
        lastErrorRaw: normalized?.details || null,
        syncedAt: new Date(),
      },
    };

    await order.save().catch(() => {});
    throw normalized;
  }
}

export async function syncTracking(orderId) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ShiprocketError("Order not found", 404);
  }

  const awb = order?.shipment?.awbNumber;

  if (!awb) {
    throw new ShiprocketError("AWB number not found on order", 400);
  }

  const tracking = await trackByAwb(awb);

  const trackingData = tracking?.tracking_data || {};
  const shipmentTrack = trackingData?.shipment_track || [];
  const latest = shipmentTrack?.[0] || {};
  const previousShipment = getShipmentObject(order);
  const previousShiprocket = getShiprocketObject(order);

  order.shipment = {
    ...previousShipment,
    status:
      latest?.current_status ||
      trackingData?.shipment_status ||
      previousShipment?.status ||
      "",
    trackingUrl: trackingData?.track_url || previousShipment?.trackingUrl || "",
    shiprocket: {
      ...previousShiprocket,
      trackingRaw: tracking,
      syncedAt: new Date(),
    },
  };

  if (String(latest?.current_status || "").toLowerCase().includes("delivered")) {
    order.orderStatus = "delivered";
    order.deliveredAt = order.deliveredAt || new Date();
    order.shipment.deliveredAt = order.shipment.deliveredAt || new Date();
  }

  await order.save();

  return {
    success: true,
    message: "Tracking synced successfully",
    order,
    tracking,
  };
}