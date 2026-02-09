
import Redis from "ioredis";
import { IStorageAdapter } from "./storage.interface";
import { Session } from "../types/session.types";

export class RedisAdapter implements IStorageAdapter {
    private redis: Redis;

    constructor(redisUrlOrClient: string | Redis) {
        if (typeof redisUrlOrClient === "string") {
            this.redis = new Redis(redisUrlOrClient);
        } else {
            this.redis = redisUrlOrClient;
        }
    }

    private getKey(sessionId: string): string {
        return `session:${sessionId}`;
    }

    private getUserKey(userId: string): string {
        return `user_sessions:${userId}`;
    }

    async createSession(session: Session): Promise<void> {
        const key = this.getKey(session.sessionId);
        // Serialize session
        await this.redis.set(key, JSON.stringify(session));

        // Set expiry if needed based on expiresAt
        const ttl = Math.ceil((session.expiresAt - Date.now()) / 1000);
        if (ttl > 0) {
            await this.redis.expire(key, ttl);
        }

        // Add to user list
        await this.redis.sadd(this.getUserKey(session.userId), session.sessionId);
        await this.redis.expire(this.getUserKey(session.userId), ttl); // Extend user list TTL
    }

    async getSession(sessionId: string): Promise<Session | null> {
        const data = await this.redis.get(this.getKey(sessionId));
        return data ? JSON.parse(data) : null;
    }

    async revokeSession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);
        if (session) {
            session.isRevoked = true;
            await this.createSession(session); // Update with revoked flag
            // Optionally we could delete it, but keeping it as revoked is safer for audit for a short time
        }
    }

    async updateSession(sessionId: string, data: Partial<Session>): Promise<void> {
        const session = await this.getSession(sessionId);
        if (session) {
            const updatedSession = { ...session, ...data };
            await this.createSession(updatedSession);
        }
    }

    async listSessions(userId: string): Promise<Session[]> {
        const sessionIds = await this.redis.smembers(this.getUserKey(userId));
        const sessions: Session[] = [];
        for (const id of sessionIds) {
            const session = await this.getSession(id);
            if (session) {
                sessions.push(session);
            } else {
                // Cleanup consistent
                await this.redis.srem(this.getUserKey(userId), id);
            }
        }
        return sessions;
    }

    async increment(key: string, ttlSeconds: number): Promise<number> {
        // Use a transaction (multi) to ensure atomicity of INCR + EXPIRE on first create
        const multi = this.redis.multi();
        multi.incr(key);
        multi.ttl(key);

        const results = await multi.exec();

        if (!results) throw new Error("Redis transaction failed");

        const [incrErr, newValue] = results[0];
        const [ttlErr, ttl] = results[1];

        if (incrErr) throw incrErr;

        const count = newValue as number;

        // If key has no TTL (-1), set it. (Only happens if key was just created by incr)
        if (ttl === -1) {
            await this.redis.expire(key, ttlSeconds);
        }

        return count;
    }
}
