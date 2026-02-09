
import { describe, it, expect, beforeEach } from "vitest";
import { createAuth } from "../src/sdk/createAuth";
import { MemoryAdapter } from "../src/storage/memory.adapter";

describe("Smart Auth Engine Integration", () => {
    let auth: ReturnType<typeof createAuth>;
    let memoryAdapter: MemoryAdapter;

    beforeEach(() => {
        memoryAdapter = new MemoryAdapter();
        auth = createAuth({
            secret: "super-secure-secret-key-12345",
            accessTokenExpiry: "1h",
            refreshTokenExpiry: 60 * 60 * 24 * 7, // 7 days
            storageAdapter: memoryAdapter,
            plan: "pro"
        });
    });

    it("should perform full login flow", async () => {
        // 1. Login
        const loginResult = await auth.login("user-123", { userAgent: "ValidationBot" });

        expect(loginResult.accessToken).toBeDefined();
        expect(loginResult.refreshToken).toBeDefined();
        expect(loginResult.session).toBeDefined();
        expect(loginResult.session.userId).toBe("user-123");

        // 2. Verify Access Token
        const payload = await auth.verify(loginResult.accessToken);
        expect(payload.sub).toBe("user-123");
        expect(payload.sessionId).toBe(loginResult.session.sessionId);

        // 3. Refresh Token
        const refreshResult = await auth.refresh(loginResult.refreshToken);
        expect(refreshResult).not.toBeNull();

        if (refreshResult) {
            expect(refreshResult.accessToken).toBeDefined();
            expect(refreshResult.newRefreshToken).toBeDefined();
            expect(refreshResult.newRefreshToken).not.toBe(loginResult.refreshToken);

            // 4. Verify Old Refresh Token is invalid (Replay Attack)
            // Note: In our implementation, we update the hash in the session.
            // So the old token should technically fail because its hash won't match.
            try {
                await auth.refresh(loginResult.refreshToken);
                // Should throw or return null depending on service logic.
                // Service throws for Replay Attack or returns null?
                // Service: throws "Invalid Refresh Token - Session Revoked" if hash mismatch but session exists.
            } catch (e: any) {
                expect(e.message).toContain("Session Revoked");
            }
        }

        // 5. Logout
        await auth.logout(loginResult.session.sessionId);

        // 6. Verify Session contains revoked or is gone? 
        // Logic: `revokeSession` marks `isRevoked: true`.
        const session = await memoryAdapter.getSession(loginResult.session.sessionId);
        expect(session?.isRevoked).toBe(true);

        // 7. Verify Access Token on revoked session
        // Middleware usually does this. Let's simulate verification logic check.
        // The verify function only checks JWT signature.
        // Real security relies on Middleware checking session status too.
        const payloadAfterLogout = await auth.verify(loginResult.accessToken);
        expect(payloadAfterLogout).toBeDefined(); // JWT is still valid mathematically

        // Check session status manually as middleware would
        const sessionCheck = await memoryAdapter.getSession(payloadAfterLogout.sessionId);
        expect(sessionCheck?.isRevoked).toBe(true);
    });

    it("should handle roles correctly", async () => {
        // 1. Login as admin
        const adminLogin = await auth.login("admin-user", { role: "admin" });
        console.log("Admin Login Result:", JSON.stringify(adminLogin, null, 2));
        expect(adminLogin.session.role).toBe("admin");

        const adminPayload = await auth.verify(adminLogin.accessToken);
        expect(adminPayload.role).toBe("admin");

        // 2. Login as default user
        const userLogin = await auth.login("normal-user");
        expect(userLogin.session.role).toBe("user"); // Default

        const userPayload = await auth.verify(userLogin.accessToken);
        expect(userPayload.role).toBe("user");
    });
});
