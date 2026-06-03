import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadToCloudinary = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ai-chat-app",
        resource_type: "auto",
        public_id: `${Date.now()}-${fileName
          .replace(/\s+/g, "-")
          .replace(/\.[^/.]+$/, "")}`,
      },

      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};
