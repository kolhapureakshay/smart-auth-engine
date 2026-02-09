
import { AuthFeatureModule, AuthContext } from "../interfaces/modules";
import { Session } from "../types/session.types";
import { IStorageAdapter } from "../storage/storage.interface";
import { hashToken } from "../utils/crypto.utils";
import { v4 as uuidv4 } from "uuid";

export class SessionModule implements AuthFeatureModule {
    name = "session";
    private storage!: IStorageAdapter;
    private refreshTokenExpiry!: number;
    private context!: AuthContext;

    initialize(context: AuthContext): void {
        this.context = context;
        this.storage = context.storage;
        // Config handling needs care, assuming seconds passed
        const expiry = context.config.refreshTokenExpiry;
        this.refreshTokenExpiry = typeof expiry === 'string' ? parseInt(expiry) : expiry;

        context.eventBus.on("session.created", (s) => context.logger.log(`Session created: ${s.sessionId}`));
    }

    async createSession(
        userId: string,
        deviceInfo: string = "unknown",
        ipAddress: string = "unknown",
        role: string = "user"
    ): Promise<{ session: Session; refreshToken: string }> {
        const sessionId = uuidv4();
        const tokenSecret = uuidv4();
        const refreshToken = `${sessionId}.${tokenSecret}`;

        const now = Date.now();
        const expiresAt = now + (this.refreshTokenExpiry * 1000);

        const refreshTokenHash = hashToken(refreshToken);

        const session: Session = {
            sessionId,
            userId,
            refreshTokenHash,
            deviceInfo,
            ipAddress,
            role,
            createdAt: now,
            expiresAt,
            isRevoked: false,
        };

        await this.storage.createSession(session);

        this.context.eventBus.emit("session.created", session);

        return { session, refreshToken };
    }

    async getSession(sessionId: string): Promise<Session | null> {
        return this.storage.getSession(sessionId);
    }

    async revokeSession(sessionId: string): Promise<void> {
        await this.storage.revokeSession(sessionId);
        this.context.eventBus.emit("session.revoked", { sessionId });
    }

    async updateSession(sessionId: string, data: any): Promise<void> {
        await this.storage.updateSession(sessionId, data);
    }
}
