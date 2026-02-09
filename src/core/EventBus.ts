
import { EventEmitter } from "events";

export type AuthEvent =
    | "auth.login"
    | "auth.logout"
    | "auth.token.refreshed"
    | "session.created"
    | "session.revoked"
    | "security.replay_attack"
    | "rate_limit.exceeded"
    | "plan.upgraded";

export class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50); // Allow many modules to listen
    }

    emit(event: AuthEvent, payload?: any): boolean {
        return super.emit(event, payload);
    }

    on(event: AuthEvent, listener: (payload: any) => void): this {
        return super.on(event, listener);
    }
}
