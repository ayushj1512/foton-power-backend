import express from "express";
import {
  autoBookOrderController,
  cancelShiprocketOrderController,
  checkServiceabilityController,
  getShiprocketPickupLocationsController,
  manualBookOrderController,
  shiprocketWebhookController,
  syncTrackingController,
} from "./shiprocket.controller.js";

const router = express.Router();

/* =========================================================
   PICKUP LOCATIONS
========================================================= */

router.get(
  "/pickup-locations",
  getShiprocketPickupLocationsController
);

/* =========================================================
   SHIPROCKET WEBHOOK
   (hidden route to reduce random hits)
========================================================= */

router.post(
  "/srk-foton-track-sync-9x7q2",
  shiprocketWebhookController
);

/* =========================================================
   SERVICEABILITY
========================================================= */

router.post(
  "/orders/:orderId/serviceability",
  checkServiceabilityController
);

/* =========================================================
   BOOKING
========================================================= */

router.post(
  "/orders/:orderId/auto-book",
  autoBookOrderController
);

router.post(
  "/orders/:orderId/manual-book",
  manualBookOrderController
);

/* =========================================================
   TRACKING
========================================================= */

router.post(
  "/orders/:orderId/sync-tracking",
  syncTrackingController
);

/* =========================================================
   CANCELLATION
========================================================= */

router.post(
  "/cancel",
  cancelShiprocketOrderController
);

export default router;