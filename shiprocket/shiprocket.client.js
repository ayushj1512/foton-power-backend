import axios from "axios";
import shiprocketConfig from "./shiprocket.config.js";
import { ShiprocketError } from "./shiprocket.errors.js";

let authToken = null;
let tokenExpiry = null;

function isTokenValid() {
  return Boolean(authToken && tokenExpiry && Date.now() < tokenExpiry);
}

export function normalizeShiprocketError(error, fallbackMessage = "Shiprocket request failed") {
  if (error instanceof ShiprocketError) return error;

  return new ShiprocketError(
    error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage,
    error?.response?.status || 500,
    error?.response?.data || error?.message || null
  );
}

async function loginShiprocket() {
  try {
    const { data } = await axios.post(
      `${shiprocketConfig.baseURL}/auth/login`,
      {
        email: shiprocketConfig.email,
        password: shiprocketConfig.password,
      },
      { timeout: 30000 }
    );

    if (!data?.token) {
      throw new ShiprocketError("Shiprocket token not received", 401, data);
    }

    authToken = data.token;

    const ttlMs = Math.max(
      60,
      24 * 60 * 60 - shiprocketConfig.tokenBufferSeconds
    ) * 1000;

    tokenExpiry = Date.now() + ttlMs;

    return authToken;
  } catch (error) {
    throw normalizeShiprocketError(error, "Shiprocket authentication failed");
  }
}

export async function getShiprocketToken() {
  if (isTokenValid()) return authToken;
  return loginShiprocket();
}

const shiprocketClient = axios.create({
  baseURL: shiprocketConfig.baseURL,
  timeout: 30000,
});

shiprocketClient.interceptors.request.use(async (config) => {
  const token = await getShiprocketToken();

  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return config;
});

export default shiprocketClient;