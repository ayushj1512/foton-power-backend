import CustomerSupportTicket from "./customerSupportTicket.js";

/* =========================================================
   CUSTOMER
========================================================= */

// Create new support ticket
export const createSupportTicket = async (req, res) => {
  try {
    const { name, mobile, email, issue } = req.body;

    if (!name || !mobile || !issue) {
      return res.status(400).json({
        success: false,
        message: "Name, mobile and issue are required",
      });
    }

    const ticket = await CustomerSupportTicket.create({
      name,
      mobile,
      email: email || null,
      issue,
    });

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("createSupportTicket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create support ticket",
    });
  }
};

// Get customer tickets by mobile
export const getCustomerTicketsByMobile = async (req, res) => {
  try {
    const { mobile } = req.params;

    const tickets = await CustomerSupportTicket.find({ mobile })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error("getCustomerTicketsByMobile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer tickets",
    });
  }
};

// Get single customer ticket by ticketId
export const getCustomerTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await CustomerSupportTicket.findOne({ ticketId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("getCustomerTicketById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
    });
  }
};

/* =========================================================
   ADMIN
========================================================= */

// Get all tickets
export const getAllSupportTickets = async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { issue: { $regex: search, $options: "i" } },
      ];
    }

    const tickets = await CustomerSupportTicket.find(query).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error("getAllSupportTickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch support tickets",
    });
  }
};

// Get single ticket
export const getAdminTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await CustomerSupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("getAdminTicketById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
    });
  }
};

// Update ticket status
export const updateSupportTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["open", "in_progress", "resolved", "closed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const ticket = await CustomerSupportTicket.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("updateSupportTicketStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
    });
  }
};

// Delete ticket
export const deleteSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await CustomerSupportTicket.findByIdAndDelete(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("deleteSupportTicket error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
    });
  }
};