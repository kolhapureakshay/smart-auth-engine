
import { describe, it, expect } from "vitest";
import { createAuth } from "../src/sdk/createAuth";
import { MemoryAdapter } from "../src/storage/memory.adapter";

describe("Event System Verification", () => {
    it("should emit 'auth.login' on successful login", async () => {
        return new Promise<void>(async (resolve, reject) => {
            const auth = createAuth({
                secret: "secret",
                accessTokenExpiry: "1h",
                refreshTokenExpiry: "1d",
                plan: "pro",
                storageAdapter: new MemoryAdapter()
            });

            // Listen for event
            auth.kernel.context.eventBus.on("auth.login", (data) => {
                try {
                    expect(data.userId).toBe("user-1");
                    expect(data.role).toBe("user");
                    expect(data.sessionId).toBeDefined();
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            // Trigger Login
            await auth.login("user-1");
        });
    });

    it("should emit 'session.created' on session creation", async () => {
        return new Promise<void>(async (resolve, reject) => {
            const auth = createAuth({
                secret: "secret",
                accessTokenExpiry: "1h",
                refreshTokenExpiry: "1d",
                plan: "pro",
                storageAdapter: new MemoryAdapter()
            });

            auth.kernel.context.eventBus.on("session.created", (session) => {
                try {
                    expect(session.userId).toBe("user-2");
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });

            await auth.login("user-2");
        });
    });
});
