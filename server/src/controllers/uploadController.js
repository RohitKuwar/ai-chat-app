import { chunkText } from "../utils/chunkText.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let extractedText = "";

    if (file.mimetype === "application/pdf") {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(file.buffer),
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
      extractedText = file.buffer.toString();
    }

    const chunks = chunkText(extractedText);

    res.status(200).json({
      message: "File processed successfully",
      text: chunks,
    });

  } catch (error) {
    console.error("PDF ERROR:", error);
    res.status(500).json({
      message: "Error processing file",
    });
  }
};