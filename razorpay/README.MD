# 💳 Razorpay Integration (Backend)

Clean modular Razorpay integration for payments, verification, webhooks & refunds.

---

## 📁 Folder Structure

```bash
src/razorpay/
  razorpay.config.js
  razorpay.client.js
  razorpay.utils.js
  razorpay.model.js
  razorpayWebhookEvent.model.js
  razorpay.service.js
  razorpay.controller.js
  razorpay.routes.js
```

---

## ⚙️ ENV CONFIG (IMPORTANT)

Add these in `.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxx

RAZORPAY_CURRENCY=INR
FRONTEND_URL=http://localhost:3000
```

### 🔑 Where to get these?

* Login → Razorpay Dashboard
* Go to **Settings → API Keys**

  * Generate Test Keys → use for development
* Go to **Webhooks → Create Webhook**

  * Add URL:

    ```
    https://yourdomain.com/api/razorpay/webhook
    ```
  * Copy **Webhook Secret**

---

## 🚀 API ROUTES

```bash
POST   /api/razorpay/create-order
POST   /api/razorpay/verify-payment
POST   /api/razorpay/webhook

GET    /api/razorpay/payment/order/:razorpayOrderId
GET    /api/razorpay/payment/status/:paymentId
GET    /api/razorpay/order/status/:orderId

POST   /api/razorpay/refund
```

---

## 🔄 PAYMENT FLOW

### 1️⃣ Create Order (Backend)

```js
POST /api/razorpay/create-order
```

➡️ returns:

* razorpayOrderId
* amount
* key

---

### 2️⃣ Frontend Checkout

Use Razorpay Checkout:

```js
const razorpay = new window.Razorpay(options);
razorpay.open();
```

---

### 3️⃣ Verify Payment (IMPORTANT)

```js
POST /api/razorpay/verify-payment
```

➡️ verifies signature (secure)

---

### 4️⃣ Webhook (AUTO SYNC)

Handles:

* payment.captured
* payment.failed
* order.paid
* refund.processed

---

## ⚠️ VERY IMPORTANT (Webhook Setup)

Server.js mei already handle kiya hai:

```js
app.use(
  "/api/razorpay/webhook",
  express.raw({ type: "application/json" })
);
```

👉 Iske bina signature verify FAIL hoga

---

## 🔁 WEBHOOK EVENTS ENABLE KARO

Dashboard → Webhooks → Select:

* payment.authorized
* payment.captured
* payment.failed
* order.paid
* refund.processed

---

## 💾 DATABASE COLLECTIONS

### 1. RazorpayPayment

Stores:

* orderId
* paymentId
* status
* amount
* customer
* refund info

### 2. RazorpayWebhookEvent

* eventId (duplicate avoid)
* payload
* processed flag

---

## 💸 REFUND FLOW

```js
POST /api/razorpay/refund
```

```json
{
  "paymentId": "pay_xxx",
  "amount": 1499,
  "receipt": "refund_123"
}
```

---

## 🧠 BEST PRACTICES

✔ Never trust frontend success
✔ Always verify signature
✔ Webhook = final source of truth
✔ Store `receipt = orderNumber` (important for reconciliation)
✔ Use test mode first

---

## 🔗 ORDER MODEL INTEGRATION (NEXT STEP)

Inside:

```js
razorpay.service.js → handleWebhookEvent()
```

Add:

```js
await Order.findOneAndUpdate(
  { orderNumber: payment.notes?.orderNumber },
  {
    $set: {
      paymentStatus: "paid",
      isConfirmed: true,
      confirmedAt: new Date(),
    },
  }
);
```

---

## 🧪 TESTING

Use Razorpay Test Cards:

```
Card: 4111 1111 1111 1111
CVV: any
Expiry: any future
```

---

## ⚡ COMMON ERRORS

| Issue                | Reason                   |
| -------------------- | ------------------------ |
| Signature mismatch   | webhook raw body missing |
| Payment not updating | webhook not configured   |
| Refund fail          | payment not captured     |
| Amount mismatch      | paise conversion issue   |

---

## 🧩 FUTURE IMPROVEMENTS

* Auto order confirmation after payment
* Retry failed payments
* Payment analytics dashboard
* Razorpay reconciliation report
* Partial payments / split payments

---

## ✅ DONE

* Order creation ✔
* Payment verification ✔
* Webhook handling ✔
* Refund support ✔
* DB logging ✔

---

**Now ready for production 🚀**
