import express from "express";
import {
  autoBookOrderController,
  cancelShiprocketOrderController,
  checkServiceabilityController,
  getShiprocketPickupLocationsController,
  manualBookOrderController,
  shiprocketWebhookController, // 👈 add this
  syncTrackingController,
} from "./shiprocket.controller.js";

const router = express.Router();

router.get("/pickup-locations", getShiprocketPickupLocationsController);

// ✅ WEBHOOK (final piece)
router.post("/webhook", shiprocketWebhookController);

router.post("/orders/:orderId/serviceability", checkServiceabilityController);
router.post("/orders/:orderId/auto-book", autoBookOrderController);
router.post("/orders/:orderId/manual-book", manualBookOrderController);
router.post("/orders/:orderId/sync-tracking", syncTrackingController);

router.post("/cancel", cancelShiprocketOrderController);

export default router;