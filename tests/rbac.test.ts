
import { describe, it, expect, beforeEach } from "vitest";
import { createAuth } from "../src/sdk/createAuth";
import { MemoryAdapter } from "../src/storage/memory.adapter";
import { Request, Response, NextFunction } from "express";

describe("RBAC Plan Restrictions", () => {
    let memoryAdapter: MemoryAdapter;

    beforeEach(() => {
        memoryAdapter = new MemoryAdapter();
    });

    it("should allow RBAC on 'pro' plan", async () => {
        const auth = createAuth({
            secret: "secret",
            accessTokenExpiry: "1h",
            refreshTokenExpiry: "1d",
            plan: "pro",
            storageAdapter: memoryAdapter
        });

        // Mock Express Request/Response
        const req = { user: { role: "admin" } } as any;
        const res = {
            status: (code: number) => ({
                json: (body: any) => ({ code, body })
            })
        } as any;
        const next = () => "next_called";

        // Execute middleware
        const middleware = auth.requireRole("admin");

        let nextCalled = false;
        const spyNext = () => { nextCalled = true; };

        middleware(req, res, spyNext);

        expect(nextCalled).toBe(true);
    });

    it("should deny RBAC on 'trial' plan", async () => {
        const auth = createAuth({
            secret: "secret",
            accessTokenExpiry: "1h",
            refreshTokenExpiry: "1d",
            plan: "trial", // Default
            storageAdapter: memoryAdapter
        });

        // Mock Express Request/Response
        const req = { user: { role: "admin" } } as any;
        let responseCode: number = 0;
        let responseBody: any = {};

        const res = {
            status: (code: number) => {
                responseCode = code;
                return {
                    json: (body: any) => {
                        responseBody = body;
                        return { code, body };
                    }
                };
            }
        } as any;
        const next = (() => "next_called");

        // Execute middleware
        const middleware = auth.requireRole("admin");
        middleware(req, res, next);

        expect(responseCode).toBe(402); // Payment Required / Upgrade needed
        expect(responseBody.error).toBe("Plan Restricted");
    });
});
