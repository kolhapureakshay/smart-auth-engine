
import { AuthFeatureModule, AuthContext } from "../interfaces/modules";
import { TokenModule } from "./TokenModule";
import { SessionModule } from "./SessionModule";
import { createMiddleware } from "../middleware/auth.middleware";

export class AuthMiddlewareModule implements AuthFeatureModule {
    name = "middleware";
    private middlewareFactory!: any;

    // Dependencies injected manually for now
    private tokenModule!: TokenModule;
    private sessionModule!: SessionModule;
    private context!: AuthContext;

    setDependencies(token: TokenModule, session: SessionModule) {
        this.tokenModule = token;
        this.sessionModule = session;
    }

    initialize(context: AuthContext): void {
        this.context = context;
    }

    getMiddleware() {
        if (!this.middlewareFactory) {
            this.middlewareFactory = createMiddleware(this.tokenModule, this.sessionModule);
        }
        return this.middlewareFactory;
    }

    requireRole(role: string) {
        return (req: any, res: any, next: any) => {
            // Plan Check for RBAC
            if (!this.context.planManager.isFeatureAllowed("rbac")) {
                const currentPlan = this.context.planManager.getCurrentPlan();
                // We can throw or return error. Throwing might be caught by error handler?
                // Let's return JSON to be safe for now, or throw a specific error type if we defined one.
                // For valid HTTP response:
                return res.status(402).json({
                    error: "Plan Restricted",
                    message: `RBAC is not available on '${currentPlan}' plan. Upgrade to 'pro'.`
                });
            }

            if (req.user?.role !== role) {
                return res.status(403).json({ error: "Forbidden: Insufficient role" });
            }
            next();
        };
    }
}
