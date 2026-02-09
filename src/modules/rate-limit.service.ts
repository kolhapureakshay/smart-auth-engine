
import { IStorageAdapter } from "../storage/storage.interface";

export class RateLimitService {
    constructor(private storage: IStorageAdapter) { }

    /**
     * Increments the counter for a given key.
     * @param key Unique identifier (e.g., ip:127.0.0.1)
     * @param ttlSeconds Time window in seconds
     * @param limit Maximum allowed requests
     * @returns Object containing check result and remaining requests
     */
    async checkLimit(key: string, ttlSeconds: number, limit: number): Promise<{
        allowed: boolean;
        current: number;
        remaining: number;
    }> {
        const current = await this.storage.increment(key, ttlSeconds);

        return {
            allowed: current <= limit,
            current,
            remaining: Math.max(0, limit - current)
        };
    }
}
