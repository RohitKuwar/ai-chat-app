import express from "express";
import { saveChat, getChats, updateChat, deleteChat, renameChat, pinChat } from "../controllers/chat.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/save", authMiddleware, saveChat);
router.get("/", authMiddleware, getChats);
router.put("/update", authMiddleware, updateChat);
router.delete("/delete/:chatId", authMiddleware, deleteChat);
router.put("/rename", authMiddleware, renameChat);
router.put("/pin/:chatId", authMiddleware, pinChat);

export default router;