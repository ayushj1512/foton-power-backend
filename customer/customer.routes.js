import express from "express";
import {
  upsertCustomer,
  getCustomers,
  getCustomerById,
  findCustomer,
  updateCustomer,
  addCustomerAddress,
} from "./customer.controller.js";

const router = express.Router();

/* =========================================================
   CUSTOMER ROUTES
========================================================= */
router.post("/upsert", upsertCustomer);
router.get("/", getCustomers);
router.get("/find", findCustomer);
router.get("/:customerId", getCustomerById);
router.put("/:customerId", updateCustomer);
router.post("/:customerId/address", addCustomerAddress);

export default router;