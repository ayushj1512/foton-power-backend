import mongoose from "mongoose";

const cleanString = (value = "") => String(value || "").trim();

const normalizeEmail = (value = "") => cleanString(value).toLowerCase();

const normalizePhone = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);

  return digits;
};

const normalizeAddressObject = (address = {}) => ({
  fullName: cleanString(address?.fullName),
  phone: normalizePhone(address?.phone),
  email: normalizeEmail(address?.email),
  addressLine1: cleanString(address?.addressLine1),
  addressLine2: cleanString(address?.addressLine2),
  city: cleanString(address?.city),
  state: cleanString(address?.state),
  pincode: cleanString(address?.pincode),
  country: cleanString(address?.country || "India"),
  companyName: cleanString(address?.companyName),
  gstNumber: cleanString(address?.gstNumber),
  label: cleanString(address?.label),
  isDefault: Boolean(address?.isDefault),
});

const isSameAddress = (a = {}, b = {}) => {
  const samePhone = normalizePhone(a?.phone) === normalizePhone(b?.phone);
  const samePincode = cleanString(a?.pincode) === cleanString(b?.pincode);
  const sameLine1 =
    cleanString(a?.addressLine1).toLowerCase() ===
    cleanString(b?.addressLine1).toLowerCase();

  return samePhone && samePincode && sameLine1;
};

const sanitizeAddresses = (addresses = []) => {
  const normalized = Array.isArray(addresses)
    ? addresses
        .map((address) => normalizeAddressObject(address))
        .filter((address) =>
          Object.values(address).some((value) => value !== "" && value !== false)
        )
    : [];

  if (!normalized.length) return [];

  const deduped = [];

  for (const address of normalized) {
    const existingIndex = deduped.findIndex((item) => isSameAddress(item, address));

    if (existingIndex === -1) {
      deduped.push(address);
    } else {
      deduped[existingIndex] = {
        ...deduped[existingIndex],
        ...address,
      };
    }
  }

  let foundDefault = false;

  const next = deduped.map((address) => {
    if (address.isDefault && !foundDefault) {
      foundDefault = true;
      return {
        ...address,
        isDefault: true,
      };
    }

    return {
      ...address,
      isDefault: false,
    };
  });

  if (!foundDefault && next[0]) {
    next[0] = {
      ...next[0],
      isDefault: true,
    };
  }

  return next;
};

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    addressLine1: { type: String, trim: true, default: "" },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "India" },
    companyName: { type: String, trim: true, default: "" },
    gstNumber: { type: String, trim: true, default: "" },
    label: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    customerCode: {
      type: String,
      trim: true,
      unique: true,
      index: true,
      sparse: true,
    },

    firebaseUid: {
      type: String,
      trim: true,
      default: "",
      unique: true,
      index: true,
      sparse: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      unique: true,
      index: true,
      sparse: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      unique: true,
      index: true,
      sparse: true,
    },

    photoURL: {
      type: String,
      trim: true,
      default: "",
    },

    addresses: {
      type: [addressSchema],
      default: [],
    },

    defaultAddress: {
      type: addressSchema,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastOrderAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.pre("validate", function () {
  this.customerCode = cleanString(this.customerCode);
  this.firebaseUid = cleanString(this.firebaseUid);
  this.name = cleanString(this.name);
  this.email = normalizeEmail(this.email);
  this.phone = normalizePhone(this.phone);
  this.photoURL = cleanString(this.photoURL);
  this.notes = cleanString(this.notes);

  if (!this.email) this.email = "";
  if (!this.phone) this.phone = "";
  if (!this.firebaseUid) this.firebaseUid = "";

  this.addresses = sanitizeAddresses(this.addresses || []);

  if (this.defaultAddress && typeof this.defaultAddress === "object") {
    this.defaultAddress = {
      ...normalizeAddressObject(this.defaultAddress),
      isDefault: true,
    };
  } else {
    this.defaultAddress = null;
  }

  if (!this.defaultAddress && this.addresses.length > 0) {
    const firstDefault =
      this.addresses.find((address) => address?.isDefault) || this.addresses[0];

    this.defaultAddress = {
      ...normalizeAddressObject(firstDefault),
      isDefault: true,
    };
  }

  if (this.defaultAddress) {
    this.addresses = sanitizeAddresses([
      {
        ...this.defaultAddress,
        isDefault: true,
      },
      ...this.addresses.filter(
        (address) => !isSameAddress(address, this.defaultAddress)
      ),
    ]);
  }
});

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default Customer;
export { normalizePhone, normalizeEmail, cleanString };