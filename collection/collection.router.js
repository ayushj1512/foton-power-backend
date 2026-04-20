import express from "express";
import {
  createCollection,
  getAllCollections,
  getActiveCollections,
  getCollectionByIdOrSlug,
  updateCollection,
  deleteCollection,
  toggleCollectionStatus,
  toggleCollectionFeatured,
  toggleCollectionHomepage,
  addProductCodesToCollection,
  removeProductCodesFromCollection,
} from "./collection.controller.js";

const router = express.Router();

/* -----------------------------------------
   Collection CRUD
------------------------------------------ */
router.post("/", createCollection);
router.get("/", getAllCollections);
router.get("/active", getActiveCollections);
router.get("/:idOrSlug", getCollectionByIdOrSlug);
router.put("/:id", updateCollection);
router.delete("/:id", deleteCollection);

/* -----------------------------------------
   Toggles
------------------------------------------ */
router.patch("/:id/toggle-status", toggleCollectionStatus);
router.patch("/:id/toggle-featured", toggleCollectionFeatured);
router.patch("/:id/toggle-homepage", toggleCollectionHomepage);

/* -----------------------------------------
   Product Codes
------------------------------------------ */
router.patch("/:id/add-product-codes", addProductCodesToCollection);
router.patch("/:id/remove-product-codes", removeProductCodesFromCollection);

export default router;