import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { DatabaseService } from "../database/database.service.js";

export type AuthUser = {
  id: string;
  telegram_id: string | null;
  telegram_username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  selected_language: string;
  role: string;
};

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
};

export type AuthRequest = RequestLike & { user?: AuthUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = String(request.headers.authorization ?? "");
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) throw new UnauthorizedException("Missing session token");

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const result = await this.db.query<AuthUser>(
      `SELECT u.id, u.telegram_id::text, u.telegram_username, u.first_name, u.last_name, u.photo_url, u.selected_language, u.role
       FROM user_sessions s
       JOIN users u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.expires_at>now()`,
      [tokenHash],
    );
    if (!result.rows[0]) throw new UnauthorizedException("Session expired or invalid");
    request.user = result.rows[0];
    await this.db.query("UPDATE users SET last_active_at=now() WHERE id=$1", [result.rows[0].id]);
    return true;
  }
}

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const configured = process.env.ADMIN_API_KEY;
    if (!configured) throw new UnauthorizedException("ADMIN_API_KEY is not configured");
    const provided = String(request.headers["x-admin-key"] ?? "");
    if (!provided || provided !== configured) throw new UnauthorizedException("Invalid admin key");
    return true;
  }
}
