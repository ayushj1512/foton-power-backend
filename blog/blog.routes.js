import express from "express";
import {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
} from "./blog.controller.js";

const router = express.Router();

/* =========================================================
   ROUTES
========================================================= */

router.post("/", createBlog);          // create
router.get("/", getBlogs);             // list
router.get("/:slug", getBlog);         // single
router.put("/:id", updateBlog);        // update
router.delete("/:id", deleteBlog);     // delete

export default router;