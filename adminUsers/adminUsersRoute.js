import express from "express";
import {
  createAdminUser,
  loginAdminUser,
  getAllAdminUsers,
  getAdminUserById,
  getMe,
  updateAdminUser,
  changeAdminPassword,
  deleteAdminUser,
} from "./adminUsersController.js";
import { protectAdmin } from "./adminAuthMiddleware.js";

const router = express.Router();

/* =========================================================
   PUBLIC ROUTES
========================================================= */
router.post("/create", createAdminUser);
router.post("/login", loginAdminUser);

/* =========================================================
   PROTECTED ROUTES
========================================================= */
router.get("/me", protectAdmin, getMe);
router.put("/change-password", protectAdmin, changeAdminPassword);

router.get("/", protectAdmin, getAllAdminUsers);
router.get("/:id", protectAdmin, getAdminUserById);
router.put("/:id", protectAdmin, updateAdminUser);
router.delete("/:id", protectAdmin, deleteAdminUser);

export default router;