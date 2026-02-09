
export interface Session {
    sessionId: string;
    userId: string;
    refreshTokenHash: string;
    deviceInfo?: string;
    ipAddress?: string;
    role?: string;
    createdAt: number;
    expiresAt: number;
    isRevoked: boolean;
}

export interface AccessTokenPayload {
    sub: string;
    sessionId: string;
    role?: string;
    iat?: number;
    exp?: number;
}

export interface RefreshTokenPayload {
    sessionId: string;
    // Refresh tokens are opaque but if we were to verify them as JWTs, they might need this.
    // However, in this design, refresh tokens are opaque UUIDs stored in DB (hashed).
    // This interface might be used if we decide to wrap the opaque token in a JWT or similar structure later,
    // but for now, the "payload" implies the data associated with the token in the DB (Session).
}
