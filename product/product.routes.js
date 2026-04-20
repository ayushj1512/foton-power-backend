import express from "express";
import {
  createProduct,
  deleteProduct,
  getAdminProductById,
  getAdminProducts,
  updateProduct,
  getAllProducts,
  getProductByIdOrCode,
  getProductsBySubcategory, // ✅ NEW
} from "./product.controller.js";

const router = express.Router();

/* =========================================================
   PUBLIC / CUSTOMER ROUTES
========================================================= */

// 🔹 get all products (filters supported)
router.get("/", getAllProducts);

// 🔹 get products by subcategory (NEW)
router.get("/subcategory/:subcategory", getProductsBySubcategory);

// 🔹 single product (KEEP LAST)
router.get("/:idOrCode", getProductByIdOrCode);

/* =========================================================
   ADMIN ROUTES (NO MIDDLEWARE)
========================================================= */

router.post("/admin", createProduct);
router.get("/admin/all", getAdminProducts);
router.get("/admin/:id", getAdminProductById);
router.patch("/admin/:id", updateProduct);
router.delete("/admin/:id", deleteProduct);

export default router;