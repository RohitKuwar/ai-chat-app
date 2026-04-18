import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 20,
});