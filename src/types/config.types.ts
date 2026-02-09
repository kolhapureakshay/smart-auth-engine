
import type { IStorageAdapter } from "../storage/storage.interface";
import { AuthFeatureModule, PlanTier } from "../interfaces/modules";

export interface AuthConfig {
    secret: string;
    accessTokenExpiry: string | number; // e.g., '1h' or 3600
    refreshTokenExpiry: string | number; // e.g., '7d' or 604800
    storageAdapter?: IStorageAdapter;
    plan?: PlanTier; // Optional, defaults to trial in SmartAuth
    modules?: AuthFeatureModule[];
    debug?: boolean;
}
