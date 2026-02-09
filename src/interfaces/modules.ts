
import { IStorageAdapter } from "../storage/storage.interface";
import { EventBus } from "../core/EventBus";
import { PlanManager } from "../core/PlanManager";

export type PlanTier = "trial" | "starter" | "pro" | "enterprise";

export interface AuthContext {
    storage: IStorageAdapter;
    config: any; // Ideally typed
    eventBus: EventBus;
    planManager: PlanManager;
    logger: Console;
}

export interface AuthFeatureModule {
    name: string;
    requiredPlan?: PlanTier;
    dependencies?: string[];
    initialize(context: AuthContext): void;
    registerHooks?(eventBus: EventBus): void;
    // Method to extend the public API of the auth instance if needed
    extendAPI?(api: any): void;
}

export interface AuthPlugin {
    name: string;
    setup(context: AuthContext): void;
}
