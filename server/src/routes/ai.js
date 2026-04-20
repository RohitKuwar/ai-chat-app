import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { generateTitle, summarize, chat } from "../controllers/ai.js";

const router = express.Router();

router.post("/chat", authMiddleware, chat);
router.post("/summarize", authMiddleware, summarize);
router.post("/generate-title", authMiddleware, generateTitle);

export default router;