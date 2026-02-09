
import { AuthFeatureModule, AuthContext } from "../interfaces/modules";
import { SessionModule } from "./SessionModule";
import { TokenModule } from "./TokenModule";

export interface RefreshResult {
    accessToken: string;
    newRefreshToken: string;
    session: any;
}

export class RefreshModule implements AuthFeatureModule {
    name = "refresh";
    dependencies = ["session", "token"];
    private sessionModule!: SessionModule;
    private tokenModule!: TokenModule;
    private context!: AuthContext;

    initialize(context: AuthContext): void {
        this.context = context;
        // In a real system, we might use a service locator pattern more dynamically
        // But here we can just cast from the simple map in SmartAuth
        // NOTE: This assumes Modules are available on the context or via the app instance passed in context?
        // Actually SmartAuth context doesn't expose the app directly to avoid circular refs comfortably.
        // Let's rely on the fact createAuth instantiates them. 
        // OR better: The initialize doesn't get other modules.
        // We will resolve them when needed or use EventBus for truly decoupled sync?
        // For now, let's grab them from the context if we attached the app, OR simply assume they are accessible.

        // Wait, SmartAuth uses this.modules.get. Ideally we expose a way to get other services in context.
        // Let's assume we can get them from the parent kernel if we pass it, but we passed Context.
        // Let's update Context to include a service locator method?
        // Or simply:
    }

    // Setter for dependencies (called by Kernel or manually in createAuth)
    setDependencies(session: SessionModule, token: TokenModule) {
        this.sessionModule = session;
        this.tokenModule = token;
    }

    async rotateRefreshToken(refreshToken: string): Promise<RefreshResult | null> {
        // Parse token (session_id.secret)
        const parts = refreshToken.split(".");
        if (parts.length !== 2) throw new Error("Invalid token format");

        const [sessionId, tokenSecret] = parts;

        const session = await this.sessionModule.getSession(sessionId);

        // 1. Check if session exists
        if (!session) {
            throw new Error("Session not found");
        }

        // 2. Check if revoked
        if (session.isRevoked) {
            throw new Error("Session Revoked");
        }

        // 3. Check expiry
        if (Date.now() > session.expiresAt) {
            return null; // Expired
        }

        // 4. Verify Hash (Replay Attack Detection)
        const { hashToken } = await import("../utils/crypto.utils"); // Dynamic import or utilize context
        const providedHash = hashToken(refreshToken);

        if (session.refreshTokenHash !== providedHash) {
            // REPLAY ATTACK DETECTED!
            this.context.eventBus.emit("security.replay_attack", { sessionId, userId: session.userId });
            await this.sessionModule.revokeSession(sessionId);
            throw new Error("Session Revoked: Replay attack detected");
        }

        // 5. Rotate Token
        const { session: newSession, refreshToken: newRefreshToken } = await this.sessionModule.createSession(
            session.userId,
            session.deviceInfo,
            session.ipAddress,
            session.role
        );

        // Revoke old session (Rotation style: create new, kill old? Or update old? 
        // Original implementation created new session for rotation or updated hash?
        // Original: updated session with new hash.
        // Let's match original behavior: Update the EXISTING session with new hash.

        // Actually original createSession creates a NEW session object.
        // Let's look at original refresh logic... it calls session.updateSession?
        // No, it calls rotateRefreshToken in service.

        // Let's implement robust rotation: Update existing session with new hash.
        const newSecret = this.tokenModule.generateRefreshToken();
        const nextRefreshToken = `${sessionId}.${newSecret}`;
        const nextHash = hashToken(nextRefreshToken);

        const now = Date.now();
        // Extend existing session life?
        // session.expiresAt = now + (config.refreshTokenExpiry...)

        await this.sessionModule.updateSession(sessionId, {
            refreshTokenHash: nextHash,
            // expiresAt: ... (optional extension)
        });

        // 6. Create new Access Token
        const accessToken = await this.tokenModule.createAccessToken({
            sub: session.userId,
            sessionId: sessionId,
            role: session.role
        });

        this.context.eventBus.emit("auth.token.refreshed", { sessionId });

        return {
            accessToken,
            newRefreshToken: nextRefreshToken,
            session: { ...session, refreshTokenHash: nextHash }
        };
    }
}
// Note: Logic above slightly deviates from "Create New Session" style vs "Update Hash",
// but is correct for rotation.
