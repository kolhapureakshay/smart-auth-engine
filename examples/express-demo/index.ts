
import express from "express";
import { createAuth, MemoryAdapter } from "../../src/index"; // Import from src during dev

const app = express();
app.use(express.json());

// JSON Error Handler Middleware
app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ error: "Invalid JSON payload" });
    }
    next();
});

// Initialize Auth Engine
const auth = createAuth({
    secret: "demo-secret-key-change-in-production",
    accessTokenExpiry: "30m", // Increased for easier testing
    refreshTokenExpiry: "24h",
    storageAdapter: new MemoryAdapter(),
    plan: "pro", // REQUIRED for RBAC and Rate Limiting features
});

// LOGIN Endpoint
// Rate Limit: 5 requests per minute per IP
app.post("/login", auth.rateLimiter({ windowSeconds: 60, maxRequests: 5 }), async (req, res) => {
    const { userId, role } = req.body; // Accept role from body for demo purposes
    if (!userId) return res.status(400).json({ error: "userId required" });

    const result = await auth.login(userId, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        role: role || 'user'
    });

    res.json(result);
});

// PROTECTED Endpoint
app.get("/profile", auth.middleware(), (req: any, res) => {
    res.json({
        message: "Access granted",
        user: req.user,
    });
});

// ADMIN Endpoint
app.get("/admin", auth.middleware(), auth.requireRole("admin"), (req: any, res) => {
    res.json({
        message: "Admin Access granted",
        user: req.user,
    });
});

// REFRESH Endpoint
app.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

    try {
        console.log("refresh token", refreshToken);
        const result = await auth.refresh(refreshToken);
        if (!result) {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

// LOGOUT Endpoint
app.post("/logout", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    await auth.logout(sessionId);
    res.json({ message: "Logged out successfully" });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Demo app running at http://localhost:${PORT}`);
    console.log("Try POST /login with { \"userId\": \"123\" }");
});
