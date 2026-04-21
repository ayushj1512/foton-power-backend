import Customer from "./customer.js";
import Counter from "../models/Counter.js";

const cleanString = (value = "") => String(value || "").trim();

const normalizeEmail = (value = "") =>
  cleanString(value).toLowerCase();

const normalizePhone = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);

  return digits;
};

const buildCustomerAddress = ({
  customer = {},
  shippingAddress = {},
  billingAddress = {},
  gstDetails = {},
} = {}) => {
  const source = shippingAddress?.addressLine1 ? shippingAddress : billingAddress;

  if (!source || typeof source !== "object") return null;

  const address = {
    fullName: cleanString(source.fullName || customer.name || customer.fullName),
    phone: normalizePhone(source.phone || customer.phone),
    email: normalizeEmail(source.email || customer.email),
    addressLine1: cleanString(source.addressLine1),
    addressLine2: cleanString(source.addressLine2),
    city: cleanString(source.city),
    state: cleanString(source.state),
    pincode: cleanString(source.pincode),
    country: cleanString(source.country || "India"),
    companyName: cleanString(gstDetails?.companyName),
    gstNumber: cleanString(gstDetails?.gstNumber),
    label: "Primary",
    isDefault: true,
  };

  const hasUsefulValue = [
    address.addressLine1,
    address.city,
    address.state,
    address.pincode,
  ].some(Boolean);

  return hasUsefulValue ? address : null;
};

const mergeAddress = (existingAddresses = [], nextAddress) => {
  if (!nextAddress) return existingAddresses;

  const foundIndex = existingAddresses.findIndex((item) => {
    const samePhone = normalizePhone(item?.phone) === normalizePhone(nextAddress.phone);
    const samePincode = cleanString(item?.pincode) === cleanString(nextAddress.pincode);
    const sameLine1 =
      cleanString(item?.addressLine1).toLowerCase() ===
      cleanString(nextAddress.addressLine1).toLowerCase();

    return samePhone && samePincode && sameLine1;
  });

  if (foundIndex === -1) {
    return [
      {
        ...nextAddress,
        isDefault: nextAddress.isDefault || existingAddresses.length === 0,
      },
      ...existingAddresses,
    ];
  }

  const updated = [...existingAddresses];
  updated[foundIndex] = {
    ...updated[foundIndex],
    ...nextAddress,
  };

  return updated;
};

export const ensureCustomerCode = async (customer) => {
  if (customer.customerCode) return customer.customerCode;

  const customerCode = await Counter.getNextPadded("customer_code", {
    prefix: "C",
    pad: 5,
    start: 1,
  });

  customer.customerCode = customerCode;
  return customerCode;
};

export const normalizeOrderCustomerSnapshot = ({
  customer = {},
  syncedCustomer = null,
  firebaseUid = "",
} = {}) => {
  const fullName =
    cleanString(customer?.fullName) ||
    cleanString(customer?.name) ||
    [cleanString(customer?.firstName), cleanString(customer?.lastName)]
      .filter(Boolean)
      .join(" ")
      .trim();

  return {
    ...(customer?.toObject ? customer.toObject() : customer || {}),
    name: fullName || cleanString(customer?.name),
    fullName: fullName || cleanString(customer?.fullName),
    firstName: cleanString(customer?.firstName),
    lastName: cleanString(customer?.lastName),
    phone: normalizePhone(customer?.phone),
    email: normalizeEmail(customer?.email),
    firebaseUid: cleanString(firebaseUid) || cleanString(customer?.firebaseUid),
    customerId: syncedCustomer?._id || customer?.customerId || null,
    customerCode:
      syncedCustomer?.customerCode ||
      cleanString(customer?.customerCode).toUpperCase(),
  };
};

/* =========================================================
   FIND BY PHONE ONLY
   - existing mila to return
   - nahi mila to create
========================================================= */
export const findOrCreateCustomerByPhone = async ({
  customer = {},
  shippingAddress = {},
  billingAddress = {},
  gstDetails = {},
  firebaseUid = "",
  orderDate = null,
} = {}) => {
  const phone = normalizePhone(
    customer?.phone || shippingAddress?.phone || billingAddress?.phone
  );

  if (!phone) return null;

  const email = normalizeEmail(
    customer?.email || shippingAddress?.email || billingAddress?.email
  );

  const name = cleanString(
    customer?.name ||
      customer?.fullName ||
      shippingAddress?.fullName ||
      billingAddress?.fullName
  );

  const cleanUid = cleanString(firebaseUid);

  const address = buildCustomerAddress({
    customer,
    shippingAddress,
    billingAddress,
    gstDetails,
  });

  let existingCustomer = await Customer.findOne({ phone });

  if (existingCustomer) {
    await ensureCustomerCode(existingCustomer);

    if (!existingCustomer.name && name) {
      existingCustomer.name = name;
    }

    if (!existingCustomer.email && email) {
      existingCustomer.email = email;
    }

    if (cleanUid && !existingCustomer.firebaseUid) {
      existingCustomer.firebaseUid = cleanUid;
    }

    if (address) {
      existingCustomer.addresses = mergeAddress(
        existingCustomer.addresses || [],
        address
      );

      if (!existingCustomer.defaultAddress) {
        existingCustomer.defaultAddress = { ...address, isDefault: true };
      }
    }

    if (orderDate) {
      existingCustomer.lastOrderAt = orderDate;
    }

    await existingCustomer.save();
    return existingCustomer;
  }

  const newCustomer = new Customer({
    name,
    email,
    phone,
    firebaseUid: cleanUid,
    addresses: address ? [{ ...address, isDefault: true }] : [],
    defaultAddress: address ? { ...address, isDefault: true } : null,
    lastOrderAt: orderDate || new Date(),
    isActive: true,
  });

  await ensureCustomerCode(newCustomer);
  await newCustomer.save();

  return newCustomer;
};

export {
  cleanString,
  normalizeEmail,
  normalizePhone,
  buildCustomerAddress,
  mergeAddress,
};