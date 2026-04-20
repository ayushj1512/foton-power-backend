import express from "express";
import { sendCustomMetaEventController } from "./meta.controller.js";

const router = express.Router();

router.post("/event", sendCustomMetaEventController);

export default router;