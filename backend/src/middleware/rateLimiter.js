import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Rate limiter for execution endpoint (20 requests per minute per user or IP)
export const runLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP / user to 20 code execution requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    ip: false, // Suppress strict IPv6 warning
  },
  message: {
    success: false,
    error: 'Too many code execution requests. Please wait a minute before running code again.',
    retryAfterSeconds: 60,
  },
  keyGenerator: (req) => {
    // If authenticated user is present, rate limit by user UID, else use safe IP key generator
    if (req.user?.uid) {
      return req.user.uid;
    }
    return ipKeyGenerator(req);
  },
});
