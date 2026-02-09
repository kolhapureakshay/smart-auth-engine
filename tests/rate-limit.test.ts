
import { describe, it, expect, beforeEach } from "vitest";
import { createAuth } from "../src/sdk/createAuth";
import { MemoryAdapter } from "../src/storage/memory.adapter";
import { RateLimitService } from "../src/modules/rate-limit.service";

describe("Rate Limit Service", () => {
    let memoryAdapter: MemoryAdapter;
    let rateLimitService: RateLimitService;

    beforeEach(() => {
        memoryAdapter = new MemoryAdapter();
        rateLimitService = new RateLimitService(memoryAdapter);
    });

    it("should allow requests within limit", async () => {
        const key = "test-ip";
        const limit = 5;
        const window = 60;

        for (let i = 0; i < limit; i++) {
            const result = await rateLimitService.checkLimit(key, window, limit);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(limit - (i + 1));
        }
    });

    it("should block requests exceeding limit", async () => {
        const key = "test-ip-block";
        const limit = 3;
        const window = 60;

        // Consume limit
        await rateLimitService.checkLimit(key, window, limit); // 1
        await rateLimitService.checkLimit(key, window, limit); // 2
        await rateLimitService.checkLimit(key, window, limit); // 3

        // Exceed limit
        const result = await rateLimitService.checkLimit(key, window, limit); // 4
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it("should reset after window expires", async () => {
        const key = "test-ip-reset";
        const limit = 1;
        const window = 1; // 1 second

        // Consume limit
        await rateLimitService.checkLimit(key, window, limit);

        // Exceed
        let result = await rateLimitService.checkLimit(key, window, limit);
        expect(result.allowed).toBe(false);

        // Wait for expiry
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Should be allowed again
        result = await rateLimitService.checkLimit(key, window, limit);
        expect(result.allowed).toBe(true);
    });
});
