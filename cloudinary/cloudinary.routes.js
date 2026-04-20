import express from "express";
import upload from "./cloudinary.middleware.js";
import {
  uploadSingleMedia,
  uploadMultipleMedia,
  getMediaLibrary,
  removeMedia,
} from "./cloudinary.controller.js";

const router = express.Router();

router.get("/media", getMediaLibrary);

router.post("/upload", upload.single("file"), uploadSingleMedia);
router.post("/upload-multiple", upload.array("files", 10), uploadMultipleMedia);

router.delete("/delete", removeMedia);

export default router;