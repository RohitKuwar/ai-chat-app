import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many AI requests. Please try again later.",
  },
});