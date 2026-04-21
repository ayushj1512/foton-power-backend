import Customer from "./customer.js";
import Counter from "../models/Counter.js";
import { normalizePhone, normalizeEmail, cleanString } from "./customer.js";

const toSafeCustomer = (customer) => {
  if (!customer) return null;

  return {
    _id: customer._id,
    customerCode: customer.customerCode || "",
    firebaseUid: customer.firebaseUid || "",
    name: customer.name || "",
    email: customer.email || "",
    phone: customer.phone || "",
    photoURL: customer.photoURL || "",
    addresses: Array.isArray(customer.addresses) ? customer.addresses : [],
    defaultAddress: customer.defaultAddress || null,
    notes: customer.notes || "",
    lastLoginAt: customer.lastLoginAt || null,
    lastOrderAt: customer.lastOrderAt || null,
    isActive: Boolean(customer.isActive),
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
};

const buildAddress = (payload = {}) => {
  if (!payload || typeof payload !== "object") return null;

  const address = {
    fullName: cleanString(payload.fullName),
    phone: normalizePhone(payload.phone),
    email: normalizeEmail(payload.email),
    addressLine1: cleanString(payload.addressLine1),
    addressLine2: cleanString(payload.addressLine2),
    city: cleanString(payload.city),
    state: cleanString(payload.state),
    pincode: cleanString(payload.pincode),
    country: cleanString(payload.country || "India"),
    companyName: cleanString(payload.companyName),
    gstNumber: cleanString(payload.gstNumber),
    label: cleanString(payload.label),
    isDefault: Boolean(payload.isDefault),
  };

  const hasMeaningfulValue = Object.values(address).some(
    (value) => value !== "" && value !== false
  );

  return hasMeaningfulValue ? address : null;
};

const isSameAddress = (a = {}, b = {}) => {
  const samePhone = normalizePhone(a?.phone) === normalizePhone(b?.phone);
  const samePincode = cleanString(a?.pincode) === cleanString(b?.pincode);
  const sameLine1 =
    cleanString(a?.addressLine1).toLowerCase() ===
    cleanString(b?.addressLine1).toLowerCase();

  return samePhone && samePincode && sameLine1;
};

const mergeAddress = (existingAddresses = [], nextAddress) => {
  if (!nextAddress) return existingAddresses;

  const foundIndex = existingAddresses.findIndex((item) =>
    isSameAddress(item, nextAddress)
  );

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

const sanitizeAddresses = (addresses = []) => {
  const normalized = Array.isArray(addresses)
    ? addresses.map((address) => buildAddress(address)).filter(Boolean)
    : [];

  if (!normalized.length) return [];

  let defaultFound = false;

  const next = normalized.map((address, index) => {
    if (address?.isDefault && !defaultFound) {
      defaultFound = true;
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

  if (!defaultFound && next[0]) {
    next[0] = {
      ...next[0],
      isDefault: true,
    };
  }

  return next;
};

const mergeAddressesList = (existingAddresses = [], incomingAddresses = []) => {
  let next = Array.isArray(existingAddresses) ? [...existingAddresses] : [];

  for (const address of incomingAddresses) {
    next = mergeAddress(next, address);
  }

  return sanitizeAddresses(next);
};

const pickDefaultAddress = (addresses = [], preferred = null) => {
  if (preferred) {
    const prepared = buildAddress(preferred);
    if (prepared) {
      return {
        ...prepared,
        isDefault: true,
      };
    }
  }

  const found = Array.isArray(addresses)
    ? addresses.find((address) => address?.isDefault)
    : null;

  return found
    ? {
        ...found,
        isDefault: true,
      }
    : null;
};

const ensureCustomerCode = async (customer) => {
  if (customer.customerCode) return customer.customerCode;

  const customerCode = await Counter.getNextPadded("customer_code", {
    prefix: "C",
    pad: 5,
    start: 1,
  });

  customer.customerCode = customerCode;
  return customerCode;
};

const findExistingCustomer = async ({
  firebaseUid = "",
  email = "",
  phone = "",
  customerCode = "",
} = {}) => {
  const cleanUid = cleanString(firebaseUid);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const cleanCode = cleanString(customerCode);

  if (cleanUid) {
    const byUid = await Customer.findOne({ firebaseUid: cleanUid });
    if (byUid) return byUid;
  }

  if (normalizedEmail) {
    const byEmail = await Customer.findOne({ email: normalizedEmail });
    if (byEmail) return byEmail;
  }

  if (normalizedPhone) {
    const byPhone = await Customer.findOne({ phone: normalizedPhone });
    if (byPhone) return byPhone;
  }

  if (cleanCode) {
    const byCode = await Customer.findOne({ customerCode: cleanCode });
    if (byCode) return byCode;
  }

  return null;
};

const prepareIncomingAddresses = ({
  address = null,
  defaultAddress = null,
  addresses = [],
} = {}) => {
  const preparedDefault =
    buildAddress(defaultAddress) || buildAddress(address);

  const preparedList = Array.isArray(addresses)
    ? addresses.map((item) => buildAddress(item)).filter(Boolean)
    : [];

  let merged = [];

  if (preparedDefault) {
    merged = mergeAddress(merged, {
      ...preparedDefault,
      isDefault: true,
    });
  }

  for (const item of preparedList) {
    merged = mergeAddress(merged, item);
  }

  return sanitizeAddresses(merged);
};

/* =========================================================
   CREATE OR UPDATE CUSTOMER
========================================================= */
export const upsertCustomer = async (req, res) => {
  try {
    const {
      firebaseUid = "",
      name = "",
      email = "",
      phone = "",
      photoURL = "",
      address = null,
      defaultAddress = null,
      addresses = [],
      notes = "",
      lastLoginAt = null,
      lastOrderAt = null,
    } = req.body || {};

    const cleanUid = cleanString(firebaseUid);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    let customer = await findExistingCustomer({
      firebaseUid: cleanUid,
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    const incomingAddresses = prepareIncomingAddresses({
      address,
      defaultAddress,
      addresses,
    });

    if (!customer) {
      const customerCode = await Counter.getNextPadded("customer_code", {
        prefix: "C",
        pad: 5,
        start: 1,
      });

      const finalAddresses = sanitizeAddresses(incomingAddresses);
      const finalDefaultAddress = pickDefaultAddress(
        finalAddresses,
        defaultAddress || address || null
      );

      customer = await Customer.create({
        customerCode,
        firebaseUid: cleanUid,
        name: cleanString(name),
        email: normalizedEmail,
        phone: normalizedPhone || "",
        photoURL: cleanString(photoURL),
        addresses: finalAddresses,
        defaultAddress: finalDefaultAddress,
        notes: cleanString(notes),
        lastLoginAt: lastLoginAt || null,
        lastOrderAt: lastOrderAt || null,
      });

      return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        customer: toSafeCustomer(customer),
      });
    }

    await ensureCustomerCode(customer);

    if (cleanUid && !customer.firebaseUid) {
      customer.firebaseUid = cleanUid;
    }

    if (cleanString(name)) customer.name = cleanString(name);
    if (normalizedEmail) customer.email = normalizedEmail;
    if (normalizedPhone && !customer.phone) customer.phone = normalizedPhone;
    if (cleanString(photoURL)) customer.photoURL = cleanString(photoURL);
    if (typeof notes === "string") customer.notes = cleanString(notes);
    if (lastLoginAt) customer.lastLoginAt = lastLoginAt;
    if (lastOrderAt) customer.lastOrderAt = lastOrderAt;

    if (incomingAddresses.length) {
      const mergedAddresses = mergeAddressesList(
        customer.addresses || [],
        incomingAddresses
      );

      customer.addresses = mergedAddresses;

      const incomingDefault =
        buildAddress(defaultAddress) ||
        incomingAddresses.find((item) => item?.isDefault) ||
        null;

      if (!customer.defaultAddress || incomingDefault) {
        customer.defaultAddress = pickDefaultAddress(
          mergedAddresses,
          incomingDefault
        );
      }
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer saved successfully",
      customer: toSafeCustomer(customer),
    });
  } catch (error) {
    console.error("upsertCustomer error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save customer",
    });
  }
};

/* =========================================================
   GET ALL CUSTOMERS
========================================================= */
export const getCustomers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20, isActive } = req.query || {};

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (currentPage - 1) * perPage;

    const query = {};

    if (String(search || "").trim()) {
      const regex = new RegExp(String(search).trim(), "i");

      query.$or = [
        { customerCode: regex },
        { name: regex },
        { email: regex },
        { phone: regex },
        { firebaseUid: regex },
      ];
    }

    if (isActive === "true") query.isActive = true;
    if (isActive === "false") query.isActive = false;

    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ updatedAt: -1 }).skip(skip).limit(perPage),
      Customer.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      customers: customers.map(toSafeCustomer),
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("getCustomers error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch customers",
    });
  }
};

/* =========================================================
   GET CUSTOMER BY ID
========================================================= */
export const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await ensureCustomerCode(customer);
    await customer.save();

    return res.status(200).json({
      success: true,
      customer: toSafeCustomer(customer),
    });
  } catch (error) {
    console.error("getCustomerById error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch customer",
    });
  }
};

/* =========================================================
   GET CUSTOMER BY PHONE / EMAIL / FIREBASE UID / CODE
========================================================= */
export const findCustomer = async (req, res) => {
  try {
    const {
      phone = "",
      email = "",
      firebaseUid = "",
      customerCode = "",
    } = req.query || {};

    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = normalizeEmail(email);
    const cleanUid = cleanString(firebaseUid);
    const cleanCode = cleanString(customerCode);

    if (!normalizedPhone && !normalizedEmail && !cleanUid && !cleanCode) {
      return res.status(400).json({
        success: false,
        message: "phone, email, firebaseUid, or customerCode is required",
      });
    }

    const customer = await findExistingCustomer({
      phone: normalizedPhone,
      email: normalizedEmail,
      firebaseUid: cleanUid,
      customerCode: cleanCode,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await ensureCustomerCode(customer);
    await customer.save();

    return res.status(200).json({
      success: true,
      customer: toSafeCustomer(customer),
    });
  } catch (error) {
    console.error("findCustomer error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to find customer",
    });
  }
};

/* =========================================================
   UPDATE CUSTOMER
========================================================= */
export const updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      name,
      email,
      phone,
      firebaseUid,
      photoURL,
      notes,
      isActive,
      defaultAddress,
      address,
      addresses,
      lastLoginAt,
      lastOrderAt,
    } = req.body || {};

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await ensureCustomerCode(customer);

    if (typeof name === "string") customer.name = cleanString(name);
    if (typeof email === "string") customer.email = normalizeEmail(email);
    if (typeof firebaseUid === "string") {
      customer.firebaseUid = cleanString(firebaseUid);
    }
    if (typeof photoURL === "string") customer.photoURL = cleanString(photoURL);
    if (typeof notes === "string") customer.notes = cleanString(notes);
    if (typeof isActive === "boolean") customer.isActive = isActive;

    if (typeof phone === "string") {
      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone || phone === "") {
        customer.phone = normalizedPhone;
      }
    }

    if (lastLoginAt) customer.lastLoginAt = lastLoginAt;
    if (lastOrderAt) customer.lastOrderAt = lastOrderAt;

    const incomingAddresses = prepareIncomingAddresses({
      address,
      defaultAddress,
      addresses,
    });

    if (incomingAddresses.length) {
      const mergedAddresses = mergeAddressesList(
        customer.addresses || [],
        incomingAddresses
      );

      customer.addresses = mergedAddresses;

      const incomingDefault =
        buildAddress(defaultAddress) ||
        incomingAddresses.find((item) => item?.isDefault) ||
        null;

      if (!customer.defaultAddress || incomingDefault) {
        customer.defaultAddress = pickDefaultAddress(
          mergedAddresses,
          incomingDefault
        );
      }
    } else if (defaultAddress && typeof defaultAddress === "object") {
      const preparedDefault = buildAddress(defaultAddress);
      if (preparedDefault) {
        customer.defaultAddress = {
          ...preparedDefault,
          isDefault: true,
        };

        customer.addresses = mergeAddressesList(customer.addresses || [], [
          {
            ...preparedDefault,
            isDefault: true,
          },
        ]);
      }
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: toSafeCustomer(customer),
    });
  } catch (error) {
    console.error("updateCustomer error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update customer",
    });
  }
};

/* =========================================================
   ADD / UPDATE ADDRESS
========================================================= */
export const addCustomerAddress = async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await ensureCustomerCode(customer);

    const preparedAddress = buildAddress(req.body);

    if (!preparedAddress) {
      return res.status(400).json({
        success: false,
        message: "Valid address is required",
      });
    }

    const mergedAddresses = mergeAddressesList(customer.addresses || [], [
      preparedAddress,
    ]);

    customer.addresses = mergedAddresses;

    if (preparedAddress.isDefault || !customer.defaultAddress) {
      customer.defaultAddress = pickDefaultAddress(mergedAddresses, {
        ...preparedAddress,
        isDefault: true,
      });
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Address saved successfully",
      customer: toSafeCustomer(customer),
    });
  } catch (error) {
    console.error("addCustomerAddress error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save address",
    });
  }
};