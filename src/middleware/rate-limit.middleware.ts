
import { Request, Response, NextFunction } from "express";
import { RateLimitService } from "../modules/rate-limit.service";

export interface RateLimitOptions {
    windowSeconds: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
}

import { EventBus } from "../core/EventBus";

export const createRateLimitMiddleware = (rateLimitService: RateLimitService, eventBus?: EventBus) => {
    return (options: RateLimitOptions) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const key = options.keyGenerator
                ? options.keyGenerator(req)
                : `ip:${req.ip}`; // Fallback to IP

            try {
                const { allowed, remaining } = await rateLimitService.checkLimit(key, options.windowSeconds, options.maxRequests);

                // Set standard RateLimit headers
                res.setHeader('X-RateLimit-Limit', options.maxRequests);
                res.setHeader('X-RateLimit-Remaining', remaining);

                if (!allowed) {
                    if (eventBus) {
                        eventBus.emit("rate_limit.exceeded", { key, limit: options.maxRequests });
                    }
                    return res.status(429).json({
                        error: "Too Many Requests",
                        message: "Rate limit exceeded. Try again later."
                    });
                }

                next();
            } catch (error) {
                console.error("Rate Limit Error:", error);
                // Fail option: Open (allow request) or Close (deny). 
                // Failing Open to avoid blocking users on cache error.
                next();
            }
        };
    };
};
