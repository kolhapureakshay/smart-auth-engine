
import { IStorageAdapter } from "./storage.interface";
import { Session } from "../types/session.types";

export class MemoryAdapter implements IStorageAdapter {
    private sessions: Map<string, Session> = new Map();

    async createSession(session: Session): Promise<void> {
        this.sessions.set(session.sessionId, session);
    }

    async getSession(sessionId: string): Promise<Session | null> {
        return this.sessions.get(sessionId) || null;
    }

    async revokeSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.sessions.set(sessionId, { ...session, isRevoked: true });
        }
    }

    async updateSession(sessionId: string, data: Partial<Session>): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.sessions.set(sessionId, { ...session, ...data });
        }
    }

    async listSessions(userId: string): Promise<Session[]> {
        const sessions: Session[] = [];
        for (const session of this.sessions.values()) {
            if (session.userId === userId) {
                sessions.push(session);
            }
        }
        return sessions;
    }

    // Rate Limiting Helpers
    private counters: Map<string, { value: number; expiresAt: number }> = new Map();

    async increment(key: string, ttlSeconds: number): Promise<number> {
        const now = Date.now();
        const entry = this.counters.get(key);

        if (entry && entry.expiresAt > now) {
            entry.value++;
            return entry.value;
        }

        // New or expired
        const value = 1;
        const expiresAt = now + (ttlSeconds * 1000);
        this.counters.set(key, { value, expiresAt });

        // Cleanup logic (lazy) could be here, but for memory adapter valid for dev, simplistic is fine.
        return value;
    }
}
