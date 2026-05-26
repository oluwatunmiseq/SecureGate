import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiter for the sign-in endpoint.
// 5 attempts per 10-minute sliding window per IP.
export const signInLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: false,
  prefix: 'ratelimit:signin',
});

// Rate limiter for the forgot-password endpoint.
// 3 attempts per 15-minute sliding window per IP.
export const forgotPasswordLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '15 m'),
  analytics: false,
  prefix: 'ratelimit:forgot',
});
