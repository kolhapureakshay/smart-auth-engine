
import { Session } from "../types/session.types";

export interface IStorageAdapter {
    createSession(session: Session): Promise<void>;
    getSession(sessionId: string): Promise<Session | null>;
    revokeSession(sessionId: string): Promise<void>;
    updateSession(sessionId: string, data: Partial<Session>): Promise<void>;
    listSessions(userId: string): Promise<Session[]>; // Optional but good for management

    /**
     * Atomically increments a key and sets expiry if it's new.
     * Returns the new value.
     */
    increment(key: string, ttlSeconds: number): Promise<number>;
}
