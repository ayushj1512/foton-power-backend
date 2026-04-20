import express from "express";
import {
  // customer
  createSupportTicket,
  getCustomerTicketsByMobile,
  getCustomerTicketById,

  // admin
  getAllSupportTickets,
  getAdminTicketById,
  updateSupportTicketStatus,
  deleteSupportTicket,
} from "./customerSupportTicket.controller.js";

const router = express.Router();

/* =========================================================
   CUSTOMER ROUTES
   prefix: /api/support-tickets
========================================================= */

// Create ticket
router.post("/", createSupportTicket);

// Get all tickets by mobile
router.get("/mobile/:mobile", getCustomerTicketsByMobile);

// Get single ticket by ticketId
router.get("/:ticketId", getCustomerTicketById);

/* =========================================================
   ADMIN ROUTES
   prefix: /api/admin/support-tickets
========================================================= */

// Get all tickets
router.get("/admin/all", getAllSupportTickets);

// Get single ticket by mongo id
router.get("/admin/:id", getAdminTicketById);

// Update status
router.patch("/admin/:id/status", updateSupportTicketStatus);

// Delete ticket
router.delete("/admin/:id", deleteSupportTicket);

export default router;