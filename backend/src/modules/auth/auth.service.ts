import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { DatabaseService } from "../../database/database.service.js";
import { makeId } from "../../common/id.js";

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  private parseAndValidate(initData: string): TelegramUser {
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!botToken) throw new UnauthorizedException("TELEGRAM_BOT_TOKEN is not configured");

    const params = new URLSearchParams(initData);
    const receivedHash = params.get("hash") ?? "";
    if (!receivedHash) throw new UnauthorizedException("Telegram hash is missing");

    // Telegram's bot-token validation hashes every received initData field except `hash`.
    // Modern Telegram clients also send the new `signature` field. It MUST stay in the
    // data-check-string for HMAC validation; removing it makes otherwise valid initData
    // fail with "Invalid Telegram initData signature".
    const dataCheckString = [...params.entries()]
      .filter(([key]) => key !== "hash")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculated = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    const a = Buffer.from(calculated, "hex");
    const b = Buffer.from(receivedHash, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException(
        "Invalid Telegram initData signature. Перевірте, що TELEGRAM_BOT_TOKEN у backend належить саме боту, який відкрив Mini App.",
      );
    }

    const authDate = Number(params.get("auth_date") ?? 0);
    const maxAge = Number(process.env.TELEGRAM_INITDATA_MAX_AGE ?? 86400);
    if (!authDate || Math.abs(Math.floor(Date.now() / 1000) - authDate) > maxAge) {
      throw new UnauthorizedException("Telegram initData expired");
    }

    const rawUser = params.get("user");
    if (!rawUser) throw new UnauthorizedException("Telegram user is missing");
    const user = JSON.parse(rawUser) as TelegramUser;
    if (!user.id) throw new UnauthorizedException("Telegram user id is missing");
    return user;
  }

  private async telegramAvatarDataUrl(botToken: string, telegramId: number) {
    try {
      const listResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${encodeURIComponent(String(telegramId))}&limit=1`);
      if (!listResponse.ok) return null;
      const list = await listResponse.json() as { ok?: boolean; result?: { photos?: Array<Array<{ file_id?: string }>> } };
      const sizes = list.result?.photos?.[0] ?? [];
      const fileId = sizes.at(-1)?.file_id || sizes[0]?.file_id;
      if (!list.ok || !fileId) return null;
      const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`);
      if (!fileResponse.ok) return null;
      const file = await fileResponse.json() as { ok?: boolean; result?: { file_path?: string } };
      const filePath = file.result?.file_path;
      if (!file.ok || !filePath) return null;
      const imageResponse = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
      if (!imageResponse.ok) return null;
      const bytes = Buffer.from(await imageResponse.arrayBuffer());
      if (!bytes.length || bytes.length > 1_500_000) return null;
      const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
      return `data:${contentType};base64,${bytes.toString("base64")}`;
    } catch {
      return null;
    }
  }

  private async createSession(userId: string) {
    const token = randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(token).digest("hex");
    const days = Number(process.env.SESSION_DAYS ?? 30);
    await this.db.query(
      "INSERT INTO user_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+($3::text || ' days')::interval)",
      [hash, userId, days],
    );
    return token;
  }

  async telegram(initData: string, devUser?: Partial<TelegramUser>) {
    let tgUser: TelegramUser;
    if (initData) {
      tgUser = this.parseAndValidate(initData);
    } else if (process.env.DEV_AUTH_BYPASS === "true") {
      tgUser = {
        id: Number(devUser?.id ?? 900000001),
        first_name: devUser?.first_name ?? "Тестовий",
        last_name: devUser?.last_name ?? "Користувач",
        username: devUser?.username ?? "gid_tourist_test",
        language_code: devUser?.language_code ?? "uk",
        photo_url: devUser?.photo_url,
      };
    } else {
      throw new BadRequestException("initData is required outside DEV_AUTH_BYPASS mode");
    }

    const resolvedPhotoUrl = tgUser.photo_url || await this.telegramAvatarDataUrl((process.env.TELEGRAM_BOT_TOKEN || "").trim(), tgUser.id);
    const existing = await this.db.query<{ id: string }>("SELECT id FROM users WHERE telegram_id=$1", [tgUser.id]);
    const userId = existing.rows[0]?.id ?? makeId("usr");
    await this.db.query(
      `INSERT INTO users(id,telegram_id,telegram_username,first_name,last_name,language_code,photo_url,selected_language,last_active_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,now())
       ON CONFLICT (telegram_id) DO UPDATE SET telegram_username=EXCLUDED.telegram_username, first_name=EXCLUDED.first_name,
         last_name=EXCLUDED.last_name, language_code=EXCLUDED.language_code, photo_url=COALESCE(EXCLUDED.photo_url,users.photo_url), last_active_at=now(), updated_at=now()`,
      [userId, tgUser.id, tgUser.username ?? null, tgUser.first_name ?? null, tgUser.last_name ?? null, tgUser.language_code ?? "uk", resolvedPhotoUrl ?? null, tgUser.language_code?.startsWith("en") ? "en" : tgUser.language_code?.startsWith("pl") ? "pl" : "uk"],
    );

    const sessionToken = await this.createSession(userId);
    const userResult = await this.db.query(
      "SELECT id,telegram_id::text,telegram_username,first_name,last_name,photo_url,selected_language,role FROM users WHERE id=$1",
      [userId],
    );
    return { token: sessionToken, user: userResult.rows[0] };
  }
}
