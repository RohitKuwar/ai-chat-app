import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getSettings, updateSettings } from "../controllers/settings.js";

const router = express.Router();

router.get("/", authMiddleware, getSettings);
router.put("/", authMiddleware, updateSettings);

export default router;