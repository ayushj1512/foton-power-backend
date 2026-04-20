# 🚚 Shiprocket Integration (Backend)

Complete Shiprocket integration for:
- Auto booking ✅
- Manual booking ✅
- Serviceability check ✅
- Courier selection ✅
- AWB generation ✅
- Pickup request ✅
- Tracking sync ✅
- Cancel shipment ✅

---

## ⚙️ Setup

### 1. Install dependencies

Already using axios ✔️

---

### 2. Add ENV variables

Add these in your `.env`

```env
SHIPROCKET_EMAIL=your_shiprocket_api_email
SHIPROCKET_PASSWORD=your_shiprocket_api_password
SHIPROCKET_BASE_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_DEFAULT_PICKUP_LOCATION=Primary
SHIPROCKET_TOKEN_BUFFER_SECONDS=300