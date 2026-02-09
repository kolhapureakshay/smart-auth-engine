
import { PlanTier } from "../interfaces/modules";

export class PlanManager {
    private currentPlan: PlanTier;

    // Feature matrix: Which features are allowed per plan
    // This could also be loaded from a remote config
    private static PLAN_Permissions: Record<string, PlanTier[]> = {
        "session": ["trial", "starter", "pro", "enterprise"],
        "refresh": ["trial", "starter", "pro", "enterprise"],
        "rate-limit": ["starter", "pro", "enterprise"],
        "rbac": ["pro", "enterprise"],
        "mfa": ["enterprise"]
    };

    constructor(initialPlan: PlanTier = "trial") {
        this.currentPlan = initialPlan;
    }

    getCurrentPlan(): PlanTier {
        return this.currentPlan;
    }

    upgradePlan(newPlan: PlanTier) {
        this.currentPlan = newPlan;
    }

    isFeatureAllowed(featureName: string): boolean {
        const allowedPlans = PlanManager.PLAN_Permissions[featureName];
        if (!allowedPlans) {
            // If feature is not explicitly gated, allow it by default (or deny, policy choice)
            return true;
        }
        return allowedPlans.includes(this.currentPlan);
    }

    assertAccess(featureName: string) {
        if (!this.isFeatureAllowed(featureName)) {
            throw new Error(`Feature '${featureName}' is not allowed on current plan: '${this.currentPlan}'`);
        }
    }
}
