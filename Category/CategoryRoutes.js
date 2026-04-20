import express from "express";
import {
  createCategory,
  getAdminCategories,
  getAdminCategoryById,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  toggleSubcategoryStatus,
  deleteSubcategory,
  getStoreCategories,
  getFeaturedCategories,
  getStoreCategoryBySlug,
  getStoreSubcategoryBySlug,
} from "./CategoryController.js";

const router = express.Router();

/* =========================================================
   STORE / CUSTOMER ROUTES
========================================================= */
router.get("/", getStoreCategories);
router.get("/featured", getFeaturedCategories);
router.get("/:categorySlug/subcategories/:subcategorySlug", getStoreSubcategoryBySlug);
router.get("/:slug", getStoreCategoryBySlug);

/* =========================================================
   ADMIN CATEGORY ROUTES (NO AUTH)
========================================================= */
router.post("/admin/create", createCategory);
router.get("/admin/all", getAdminCategories);
router.get("/admin/:id", getAdminCategoryById);
router.patch("/admin/:id", updateCategory);
router.patch("/admin/:id/toggle-active", toggleCategoryStatus);
router.delete("/admin/:id", deleteCategory);

/* =========================================================
   ADMIN SUBCATEGORY ROUTES (NO AUTH)
========================================================= */
router.post("/admin/:categoryId/subcategories", addSubcategory);
router.patch("/admin/:categoryId/subcategories/:subcategoryId", updateSubcategory);
router.patch(
  "/admin/:categoryId/subcategories/:subcategoryId/toggle-active",
  toggleSubcategoryStatus
);
router.delete(
  "/admin/:categoryId/subcategories/:subcategoryId",
  deleteSubcategory
);

export default router;