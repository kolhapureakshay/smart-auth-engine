
import { AuthFeatureModule, AuthContext } from "../interfaces/modules";
import { SignJWT, jwtVerify } from "jose";
import { AccessTokenPayload } from "../types/session.types";
import { v4 as uuidv4 } from "uuid";

export class TokenModule implements AuthFeatureModule {
    name = "token";
    private secret!: Uint8Array;
    private accessTokenExpiry!: string | number;

    initialize(context: AuthContext): void {
        this.secret = new TextEncoder().encode(context.config.secret);
        this.accessTokenExpiry = context.config.accessTokenExpiry;
    }

    async createAccessToken(payload: AccessTokenPayload): Promise<string> {
        return await new SignJWT({ ...payload })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(this.accessTokenExpiry)
            .sign(this.secret);
    }

    async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
        const { payload } = await jwtVerify(token, this.secret);
        return payload as unknown as AccessTokenPayload;
    }

    generateRefreshToken(): string {
        return uuidv4();
    }
}
