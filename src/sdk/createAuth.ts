
import { AuthConfig } from "../types/config.types";
import { SmartAuth } from "../core/SmartAuth";
import { SessionModule } from "../modules/SessionModule";
import { TokenModule } from "../modules/TokenModule";
import { RefreshModule } from "../modules/RefreshModule";
import { RateLimitModule } from "../modules/RateLimitModule";
import { AuthMiddlewareModule } from "../modules/AuthMiddlewareModule";
import { RateLimitOptions } from "../middleware/rate-limit.middleware";
// NOTE: For backward compatibility, createAuth wraps SmartAuth but returns the old API shape.

export const createAuth = (config: AuthConfig) => {
    // 1. Initialize Kernel with Default Modules
    const app = new SmartAuth({
        ...config,
        plan: config.plan || "trial",
        modules: [
            new SessionModule(),
            new TokenModule(),
            new RefreshModule(),
            new RateLimitModule(),
            new AuthMiddlewareModule(),
            ...(config.modules || [])
        ]
    });

    // 2. Extract Services (Modules)
    const sessionModule = app.getService("session") as SessionModule;
    const tokenModule = app.getService("token") as TokenModule;
    const refreshModule = app.getService("refresh") as RefreshModule;
    const rateListModule = app.getService("rate-limit") as RateLimitModule;
    const middlewareModule = app.getService("middleware") as AuthMiddlewareModule;

    if (!sessionModule || !tokenModule) {
        throw new Error("Critical modules failed to load. Check plan restrictions.");
    }

    // Manual Dependency Injection (Poor man's DI)
    if (refreshModule) refreshModule.setDependencies(sessionModule, tokenModule);
    if (middlewareModule) middlewareModule.setDependencies(tokenModule, sessionModule);

    // 3. Return Public API (Mapping new modules to old API shape for compatibility)
    return {
        // Expose Kernel
        kernel: app,

        // Services
        tokenService: tokenModule,
        sessionService: sessionModule,
        refreshService: refreshModule,
        rateLimitService: rateListModule,

        // API Methods
        login: async (userId: string, context?: { userAgent?: string; ip?: string; role?: string }) => {
            const role = context?.role || 'user';

            // Session Module
            const { session, refreshToken } = await sessionModule.createSession(
                userId,
                context?.userAgent,
                context?.ip,
                role
            );

            // Token Module
            const accessToken = await tokenModule.createAccessToken({
                sub: userId,
                sessionId: session.sessionId,
                role
            });

            // Emit Login Event
            app.context.eventBus.emit("auth.login", {
                userId,
                sessionId: session.sessionId,
                role
            });

            return { accessToken, refreshToken, session };
        },

        verify: async (token: string) => {
            return tokenModule.verifyAccessToken(token);
        },

        refresh: async (refreshToken: string) => {
            if (!refreshModule) throw new Error("Refresh module not enabled.");
            return refreshModule.rotateRefreshToken(refreshToken);
        },

        logout: async (sessionId: string) => {
            return sessionModule.revokeSession(sessionId);
        },

        middleware: () => {
            if (!middlewareModule) throw new Error("Middleware module not enabled.");
            return middlewareModule.getMiddleware();
        },

        requireRole: (role: string) => {
            if (!middlewareModule) throw new Error("Middleware module not enabled.");
            return middlewareModule.requireRole(role);
        },

        rateLimiter: (options: RateLimitOptions) => {
            if (!rateListModule) throw new Error("Rate Limit module not enabled.");
            return rateListModule.getMiddleware()(options);
        }
    };
};
