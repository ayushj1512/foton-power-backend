import nodemailer from "nodemailer";

import { MAILER_EVENTS, MAILER_FROM_NAME, MAILER_SUBJECTS } from "./constants.js";
import {
  getCustomerName,
  getOrderEmail,
  getSafeOrderNumber,
  isValidEmail,
} from "./helpers.js";

/* -----------------------------
   Template imports
   ----------------------------- */
import { orderConfirmationTemplate } from "./templates/orderConfirmation.js";
import { orderShippedTemplate } from "./templates/orderShipped.js";
import { orderDeliveredTemplate } from "./templates/orderDelivered.js";
import { orderCancelledTemplate } from "./templates/orderCancelled.js";

/* -----------------------------
   Transporter
   ----------------------------- */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp-relay.gmail.com",
  port: Number(process.env.MAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* -----------------------------
   Verify mailer in dev
   ----------------------------- */
export const verifyMailerConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Mailer connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Mailer connection failed:", error.message);
    return false;
  }
};

/* -----------------------------
   Low-level send
   ----------------------------- */
export const sendMail = async ({
  to,
  subject,
  html,
  text = "",
  cc,
  bcc,
  replyTo,
}) => {
  try {
    if (!to || !isValidEmail(to)) {
      return {
        success: false,
        message: "Valid recipient email is required",
      };
    }

    if (!subject?.trim()) {
      return {
        success: false,
        message: "Email subject is required",
      };
    }

    if (!html?.trim()) {
      return {
        success: false,
        message: "Email html is required",
      };
    }

    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || MAILER_FROM_NAME}" <${process.env.MAIL_USER}>`,
      to,
      cc,
      bcc,
      replyTo,
      subject,
      html,
      text,
    });

    console.log(`✅ Email sent to ${to}:`, info.messageId);

    return {
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ sendMail error:", error.message);

    return {
      success: false,
      message: error.message || "Failed to send email",
    };
  }
};

/* -----------------------------
   Event -> template map
   ----------------------------- */
const getTemplateByEvent = (event, order) => {
  switch (event) {
    case MAILER_EVENTS.ORDER_CONFIRMATION:
      return orderConfirmationTemplate(order);

    case MAILER_EVENTS.ORDER_SHIPPED:
      return orderShippedTemplate(order);

    case MAILER_EVENTS.ORDER_DELIVERED:
      return orderDeliveredTemplate(order);

    case MAILER_EVENTS.ORDER_CANCELLED:
      return orderCancelledTemplate(order);

    default:
      throw new Error(`Unsupported mailer event: ${event}`);
  }
};

/* -----------------------------
   Order mail sender
   ----------------------------- */
export const sendOrderEmail = async ({ order, event }) => {
  try {
    if (!order) {
      return {
        success: false,
        message: "Order is required",
      };
    }

    const to = getOrderEmail(order);
    const customerName = getCustomerName(order);
    const orderNumber = getSafeOrderNumber(order);

    if (!to || !isValidEmail(to)) {
      return {
        success: false,
        message: `No valid email found for ${orderNumber}`,
      };
    }

    const subjectBuilder = MAILER_SUBJECTS[event];

    if (!subjectBuilder) {
      return {
        success: false,
        message: `No subject configured for event: ${event}`,
      };
    }

    const html = getTemplateByEvent(event, {
      ...order,
      _mailerMeta: {
        customerName,
        email: to,
      },
    });

    const result = await sendMail({
      to,
      subject: subjectBuilder(orderNumber),
      html,
    });

    return result;
  } catch (error) {
    console.error("❌ sendOrderEmail error:", error.message);

    return {
      success: false,
      message: error.message || "Failed to send order email",
    };
  }
};