import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

console.log("API KEY:", process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;