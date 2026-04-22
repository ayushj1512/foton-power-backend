const cleanString = (value = "") => String(value || "").trim();

const pickFirstNonEmpty = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

const safeObject = (value) => {
  if (!value || typeof value !== "object") return {};
  return value;
};

export function getOrderShipmentObject(order) {
  return order?.shipment?.toObject
    ? order.shipment.toObject()
    : safeObject(order?.shipment);
}

export function getOrderShiprocketObject(order) {
  const shipment = getOrderShipmentObject(order);
  return shipment?.shiprocket?.toObject
    ? shipment.shiprocket.toObject()
    : safeObject(shipment?.shiprocket);
}

export function normalizeShiprocketBookingSnapshot(order) {
  const shipment = getOrderShipmentObject(order);
  const shiprocket = getOrderShiprocketObject(order);

  const bookingRaw = safeObject(shiprocket.bookingRaw);
  const awbRaw = safeObject(shiprocket.awbRaw);
  const pickupRaw = safeObject(shiprocket.pickupRaw);

  const awbData = safeObject(awbRaw.response?.data);
  const pickupResponse = safeObject(pickupRaw.response);

  const awbNumber = pickFirstNonEmpty(
    awbData.awb_code,
    bookingRaw.awb_code,
    shipment.awbNumber,
    shipment.trackingNumber
  );

  const courierName = pickFirstNonEmpty(
    awbData.courier_name,
    shiprocket.courierCompanyName,
    shipment.courierName
  );

  const courierCompanyId = pickFirstNonEmpty(
    awbData.courier_company_id,
    shiprocket.courierCompanyId
  );

  const shipmentId = pickFirstNonEmpty(
    awbData.shipment_id,
    bookingRaw.shipment_id,
    shiprocket.shipmentId
  );

  const shiprocketOrderId = pickFirstNonEmpty(
    awbData.order_id,
    bookingRaw.order_id,
    shiprocket.shiprocketOrderId
  );

  const pickupTokenNumber = pickFirstNonEmpty(
    pickupResponse.pickup_token_number,
    shiprocket.pickupTokenNumber
  );

  const pickupScheduledDate = pickFirstNonEmpty(
    pickupResponse.pickup_scheduled_date,
    shiprocket.pickupScheduledDate
  );

  return {
    courierName: cleanString(courierName),
    awbNumber: cleanString(awbNumber),
    trackingNumber: cleanString(awbNumber),
    trackingUrl: cleanString(shipment.trackingUrl),
    status: cleanString(shipment.status || "booked"),
    labelUrl: cleanString(shipment.labelUrl),
    invoiceUrl: cleanString(shipment.invoiceUrl),
    manifestUrl: cleanString(shiprocket.manifestUrl || shipment.manifestUrl),
    shippedAt: shipment.shippedAt || null,
    deliveredAt: shipment.deliveredAt || null,
    shiprocket: {
      ...shiprocket,
      isBooked: true,
      shiprocketOrderId: cleanString(shiprocketOrderId),
      channelOrderId: cleanString(
        pickFirstNonEmpty(bookingRaw.channel_order_id, shiprocket.channelOrderId)
      ),
      shipmentId: cleanString(shipmentId),
      courierCompanyId: cleanString(courierCompanyId),
      courierCompanyName: cleanString(courierName),
      pickupTokenNumber: cleanString(pickupTokenNumber),
      pickupScheduledDate: cleanString(pickupScheduledDate),
      syncedAt: new Date(),
    },
  };
}

function mapTrackingStatusToOrderStatus(status = "") {
  const value = cleanString(status).toLowerCase();

  if (!value) return "";

  if (value.includes("delivered")) return "delivered";
  if (value.includes("out for delivery")) return "out_for_delivery";
  if (value.includes("rto")) return "rto";
  if (value.includes("return")) return "returned";
  if (value.includes("cancel")) return "cancelled";
  if (
    value.includes("ship") ||
    value.includes("transit") ||
    value.includes("pickup") ||
    value.includes("manifest")
  ) {
    return "shipped";
  }

  return "";
}

export function buildTrackingSyncFromShiprocketTracking(tracking, order = null) {
  const shipment = getOrderShipmentObject(order);
  const shiprocket = getOrderShiprocketObject(order);

  const trackingData = safeObject(tracking?.tracking_data);
  const shipmentTrack = Array.isArray(trackingData?.shipment_track)
    ? trackingData.shipment_track
    : [];

  const latest = safeObject(shipmentTrack[0]);

  const currentStatus = cleanString(
    latest.current_status || trackingData.shipment_status || shipment.status
  );

  const trackingUrl = cleanString(
    trackingData.track_url || shipment.trackingUrl
  );

  const orderStatus = mapTrackingStatusToOrderStatus(currentStatus);

  return {
    shipment: {
      ...shipment,
      status: currentStatus || shipment.status || "",
      trackingUrl,
      deliveredAt:
        orderStatus === "delivered"
          ? shipment.deliveredAt || new Date()
          : shipment.deliveredAt || null,
      shiprocket: {
        ...shiprocket,
        trackingRaw: tracking,
        syncedAt: new Date(),
      },
    },
    orderStatus,
    deliveredAt:
      orderStatus === "delivered"
        ? order?.deliveredAt || new Date()
        : order?.deliveredAt || null,
  };
}

export function mergeShipmentSync(order, shipmentPatch = {}) {
  const shipment = getOrderShipmentObject(order);
  const shiprocket = getOrderShiprocketObject(order);
  const nextShipment = safeObject(shipmentPatch);
  const nextShiprocket = safeObject(nextShipment.shiprocket);

  return {
    ...shipment,
    ...nextShipment,
    shiprocket: {
      ...shiprocket,
      ...nextShiprocket,
    },
  };
}