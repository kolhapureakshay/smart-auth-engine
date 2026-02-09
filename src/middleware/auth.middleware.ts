import { NextFunction, Request, Response } from "express";
import { TokenModule } from "../modules/TokenModule";
import { SessionModule } from "../modules/SessionModule";

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                sessionId: string;
                role?: string;
            };
        }
    }
}

export const createMiddleware = (tokenModule: TokenModule, sessionModule: SessionModule) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        console.log("Middleware: Request received");
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Missing or invalid authorization header" });
        }

        const token = authHeader.split(" ")[1];

        try {
            // Verify Token
            console.log("Middleware: Verifying token...");
            const payload = await tokenModule.verifyAccessToken(token);
            console.log("Middleware: Token verified", payload);

            // Verify Session (Check revocation)
            console.log("Middleware: Getting session...");
            const session = await sessionModule.getSession(payload.sessionId);
            console.log("Middleware: Session found", session);
            if (!session || session.isRevoked) {
                return res.status(401).json({ error: "Session invalid or revoked" });
            }

            // Attach User to Request
            req.user = {
                userId: payload.sub,
                sessionId: payload.sessionId,
                role: payload.role,
            };

            next();
        } catch (error: any) {
            console.error("Middleware: Verification failed", error);
            if (error.code === 'ERR_JWT_EXPIRED') {
                return res.status(401).json({ error: "Token expired" });
            }
            return res.status(401).json({ error: "Invalid token" });
        }
    };
};
