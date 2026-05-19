import Chat from "../models/Chat.js";
import { chunkText } from "../utils/chunkText.js";
import { createEmbedding } from "../utils/createEmbedding.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";

export const uploadFile = async (req, res) => {
  try {
    const { chatId } = req.body;
    const file = req.file;

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let extractedText = "";

    if (file.mimetype.startsWith("image/")) {
      const fileUrl = `${process.env.REACT_APP_API_URL}/uploads/${file.filename}`;
      return res.status(200).json({
        message: "Image uploaded successfully",
        fileUrl,
      });
    }

    if (file.mimetype === "application/pdf") {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(fs.readFileSync(file.path)),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });

      const pdf = await loadingTask.promise;

      let textContent = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const pageText = content.items
          .map(item => item.str)
          .join(" ");

        textContent += pageText + "\n";
      }

      extractedText = textContent;
    } else {
      extractedText = fs.readFileSync(file.path, "utf-8");
    }

    const cleanText = extractedText.toLowerCase().replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    const chunks = chunkText(cleanText);

    const chunkEmbeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await createEmbedding(chunk);

        return {
          text: chunk,
          embedding,
        };
      })
    );

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $set: { embeddings: chunkEmbeddings },
      },
      { new: true }
    );

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json({
      message: "File processed successfully",
      totalChunks: chunkEmbeddings.length,
      data: chunkEmbeddings
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({
      message: "Error processing file",
    });
  }
};