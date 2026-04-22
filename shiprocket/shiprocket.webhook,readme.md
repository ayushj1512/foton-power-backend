# shiprocket.webhook.readme.md

## 🚀 Shiprocket Webhook Integration (Foton)

This document explains how to configure and use the Shiprocket webhook for automatic order status syncing in the Foton backend.

---

## 📌 Overview

The webhook enables automatic updates from Shiprocket whenever shipment tracking status changes.

### What it does:

* Updates `orderStatus`
* Syncs `shipment.status`
* Saves tracking payload
* Marks `deliveredAt` when delivered

---

## 🔗 Webhook Endpoint

```bash
POST /api/shiprocket/webhook
```

### Production URL

```bash
https://backend.fotonpower.in/api/shiprocket/webhook
```

---

## ⚙️ Backend Setup

### Route

```js
router.post("/webhook", shiprocketWebhookController);
```

### Controller

```js
export async function shiprocketWebhookController(req, res) {
  const result = await processShiprocketWebhook(req.body || {});
  return res.status(200).json(result);
}
```

---

## 🧠 Status Mapping Logic

| Shiprocket Status    | Internal Status  |
| -------------------- | ---------------- |
| delivered            | delivered        |
| out for delivery     | out_for_delivery |
| shipped / in transit | shipped          |
| pickup / manifest    | shipped          |

---

## 📦 Required Fields for Matching Order

At least one of these must be present in DB:

* `shipment.shiprocket.shipmentId`
* `shipment.shiprocket.channelOrderId`
* `shipment.awbNumber`

---

## 🔍 Order Matching Priority

1. `shipment.shiprocket.shipmentId`
2. `orderNumber` / `channelOrderId`
3. `awbNumber` / `trackingNumber`

---

## 📥 Sample Webhook Payload

```json
{
  "order_number": "123",
  "awb_code": "999999999",
  "current_status": "Delivered"
}
```

---

## 🧪 Testing (Postman)

```bash
POST https://backend.fotonpower.in/api/shiprocket/webhook
```

Body:

```json
{
  "order_number": "123",
  "awb_code": "999999999",
  "current_status": "Delivered"
}
```

---

## 🛠 Shiprocket Panel Setup (when account is ready)

Go to:

```
Settings → API → Webhooks
```

### Fill:

**Webhook URL**

```
https://backend.fotonpower.in/api/shiprocket/webhook
```

**Method**

```
POST
```

**Content-Type**

```
application/json
```

**Event**

```
Shipment / Tracking Update
```

---

## ⚠️ Notes

* Webhook works only after shipment is booked in Shiprocket
* Ensure AWB / shipmentId is stored in order
* No authentication implemented (minimal version)
* Can add secret header later for security

---

## 🔄 Future Improvements

* Add webhook signature verification
* Add retry logging
* Add webhook event history collection
* Add admin webhook logs UI

---

## ✅ Status

Webhook backend is fully ready.
Pending: Shiprocket panel configuration.

---

**Foton Backend → Shiprocket Sync = READY 🚀**
