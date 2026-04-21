import express from "express";
import { saveChat, getChats, updateChat } from "../controllers/chat.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/save", authMiddleware, saveChat);
router.get("/", authMiddleware, getChats);
router.put("/update", authMiddleware, updateChat);

export default router;