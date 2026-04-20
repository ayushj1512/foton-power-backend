import crypto from "crypto";

export const sha256 = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return undefined;

  return crypto.createHash("sha256").update(normalized).digest("hex");
};

export const normalizePhone = (phone = "") => {
  const cleaned = String(phone || "").replace(/\D/g, "");
  return cleaned || "";
};

export const getMetaUserData = ({
  email,
  phone,
  firstName,
  lastName,
  city,
  state,
  country,
  zip,
  fbp,
  fbc,
  clientIp,
  userAgent,
} = {}) => {
  const normalizedPhone = normalizePhone(phone);

  return {
    em: email ? [sha256(email)] : undefined,
    ph: normalizedPhone ? [sha256(normalizedPhone)] : undefined,
    fn: firstName ? [sha256(firstName)] : undefined,
    ln: lastName ? [sha256(lastName)] : undefined,
    ct: city ? [sha256(city)] : undefined,
    st: state ? [sha256(state)] : undefined,
    country: country ? [sha256(country)] : undefined,
    zp: zip ? [sha256(zip)] : undefined,
    fbp: fbp || undefined,
    fbc: fbc || undefined,
    client_ip_address: clientIp || undefined,
    client_user_agent: userAgent || undefined,
  };
};

export const cleanObject = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
    )
  );