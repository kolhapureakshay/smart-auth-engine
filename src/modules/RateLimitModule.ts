import { AuthFeatureModule, AuthContext, PlanTier } from "../interfaces/modules";
import { RateLimitService } from "./rate-limit.service";
import { createRateLimitMiddleware } from "../middleware/rate-limit.middleware";

export class RateLimitModule implements AuthFeatureModule {
    name = "rate-limit";
    requiredPlan: PlanTier = "starter"; // Type compatible

    private service!: RateLimitService; // We can wrap the service
    private middlewareFactory!: any;
    private context!: AuthContext;

    initialize(context: AuthContext): void {
        this.context = context;
        this.service = new RateLimitService(context.storage);
        this.middlewareFactory = createRateLimitMiddleware(this.service, context.eventBus);

        context.eventBus.on("rate_limit.exceeded", (data: { key: any; }) => {
            context.logger.warn(`[Security] Rate limit exceeded by ${data.key}`);
        });
    }

    getMiddleware() {
        return this.middlewareFactory;
    }
}
