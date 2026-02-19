const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for private (authenticated) routes.
 * Uses user ID as key instead of IP, since hostelers share the same public IP.
 * Must be used AFTER authenticate middleware so req.user is set.
 */
const privateRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: (req) => {
    const id = req.user?._id || req.user?.id;
    return id ? String(id) : 'unknown';
  },
  message: { success: false, message: 'Too many requests, please try again later.' },
});

module.exports = {
  privateRateLimiter,
};
