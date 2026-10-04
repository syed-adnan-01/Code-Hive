import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Generic per-user rate limit helper (IDE Extension Plan Section 2)
export const createUserRateLimiter = ({
  windowMs = 60 * 1000,
  max = 20,
  message = 'Too many requests. Please try again later.',
  retryAfterSeconds = 60,
}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false },
    message: {
      success: false,
      error: message,
      retryAfterSeconds,
    },
    keyGenerator: (req) => req.user?.uid || ipKeyGenerator(req),
  });
};

// 1. Code execution limiter (20 runs / min per user/IP)
export const runLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many code execution requests. Please wait a minute before running code again.',
  retryAfterSeconds: 60,
});

// 2. Room creation limiter (30 rooms / min per user/IP)
export const roomLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many room creation requests. Please try again later.',
  retryAfterSeconds: 60,
});

// 3. Room ticket limiter (60 tickets / min per user/IP)
export const ticketLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many ticket requests. Please try again later.',
  retryAfterSeconds: 60,
});

// 4. Live chat limiter (30 msgs / min per user/IP)
export const chatLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many chat messages. Rate limit is 30 messages per minute.',
  retryAfterSeconds: 60,
});

// 5. AI suggestion & debug limiter (20 requests / min per user/IP)
export const aiLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'AI request limit reached. Please wait a minute.',
  retryAfterSeconds: 60,
});
