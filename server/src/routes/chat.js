import express from "express";
import { saveChat } from "../controllers/chat.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/save", authMiddleware, saveChat);

export default router;