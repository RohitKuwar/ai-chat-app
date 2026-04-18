import express from "express";
import { generateTitle, summarize, chat } from "../controllers/ai.js";

const router = express.Router();

router.post("/generate-title", generateTitle);
router.post("/summarize", summarize);
router.post("/chat", chat);

export default router;