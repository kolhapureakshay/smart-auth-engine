
import { IStorageAdapter } from "../storage/storage.interface";
import { AuthFeatureModule, AuthContext, PlanTier } from "../interfaces/modules";
import { EventBus } from "./EventBus";
import { PlanManager } from "./PlanManager";
import { MemoryAdapter } from "../storage/memory.adapter";

export interface SmartAuthConfig {
    secret: string;
    accessTokenExpiry: string | number;
    refreshTokenExpiry: string | number;
    plan: PlanTier;
    storageAdapter?: IStorageAdapter;
    modules?: AuthFeatureModule[];
    debug?: boolean;
}

export class SmartAuth {
    private modules: Map<string, AuthFeatureModule> = new Map();
    private _context: AuthContext;
    public api: any = {}; // The exposed public API

    public get context(): AuthContext {
        return this._context;
    }

    constructor(private config: SmartAuthConfig) {
        // Core dependencies
        const storage = config.storageAdapter || new MemoryAdapter();
        const eventBus = new EventBus();
        const planManager = new PlanManager(config.plan);

        this._context = {
            storage,
            config,
            eventBus,
            planManager,
            logger: console // Could be wrapped
        };

        // Load modules if provided
        if (config.modules) {
            config.modules.forEach(m => this.use(m));
        }
    }

    use(module: AuthFeatureModule): this {
        if (this.modules.has(module.name)) {
            if (this.config.debug) console.warn(`Module ${module.name} already loaded.`);
            return this;
        }

        // 1. Plan Check
        if (module.requiredPlan && !this.context.planManager.isFeatureAllowed(module.name)) {
            if (this.config.debug) console.warn(`Module ${module.name} skipped. Required plan: ${module.requiredPlan}, Current: ${this.context.planManager.getCurrentPlan()}`);
            return this;
        }

        // 2. Dependency Check (Simple)
        if (module.dependencies) {
            for (const dep of module.dependencies) {
                if (!this.modules.has(dep)) {
                    throw new Error(`Module ${module.name} requires dependency: ${dep}`);
                }
            }
        }

        // 3. Initialize
        module.initialize(this.context);

        // 4. Extend API
        if (module.extendAPI) {
            module.extendAPI(this.api);
        }

        // 5. Register Hooks
        if (module.registerHooks) {
            module.registerHooks(this.context.eventBus);
        }

        this.modules.set(module.name, module);
        if (this.config.debug) console.log(`Module loaded: ${module.name}`);

        return this;
    }

    getService(moduleName: string): any {
        return this.modules.get(moduleName);
    }
}
