import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { AuthUser } from "../../common/auth.guard.js";
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

const scrypt = promisify(scryptCallback);
const PASSWORD_PATTERN = /^\S{8,128}$/;

// For account passwords use a memory-hard KDF with a unique per-user salt.
async function passwordDigest(password: string, salt: string) {
  return (await scrypt(password, Buffer.from(salt, "hex"), 64)) as Buffer;
}
function validatePassword(value: unknown) {
  const password = typeof value === "string" ? value : "";
  if (!PASSWORD_PATTERN.test(password)) throw new BadRequestException("Пароль повинен містити 8–128 символів без пробілів");
  return password;
}
function normalizePhone(value: unknown) {
  const raw = typeof value === "string" ? value.replace(/[\s()\-]/g, "") : "";
  if (!/^\+?[1-9]\d{7,14}$/.test(raw)) throw new BadRequestException("Вкажіть номер у міжнародному форматі, наприклад +380XXXXXXXXX");
  return raw.startsWith("+") ? raw : `+${raw}`;
}

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

  private async userSession(userId: string) {
    const token = await this.createSession(userId);
    const result = await this.db.query(
      `SELECT id,telegram_id::text,telegram_username,first_name,last_name,photo_url,selected_language,role,phone,
       EXISTS(SELECT 1 FROM user_phone_credentials c WHERE c.user_id=users.id) AS phone_login_enabled
       FROM users WHERE id=$1`,
      [userId],
    );
    return { token, user: result.rows[0] };
  }

  async registerPhone(body: { phone?: string; name?: string; password?: string }) {
    const phone = normalizePhone(body.phone);
    const password = validatePassword(body.password);
    const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 100) throw new BadRequestException("Вкажіть ім’я (2–100 символів)");
    const [firstName, ...rest] = name.split(" ");
    const salt = randomBytes(24).toString("hex");
    const digest = (await passwordDigest(password, salt)).toString("hex");
    const id = makeId("usr");
    try {
      await this.db.transaction(async (client) => {
        await client.query(
          `INSERT INTO users(id,first_name,last_name,phone,selected_language,profile_name_customized)
           VALUES($1,$2,$3,$4,'uk',true)`, [id, firstName, rest.join(" ") || null, phone],
        );
        await client.query(
          "INSERT INTO user_phone_credentials(user_id,phone,password_hash) VALUES($1,$2,$3)",
          [id, phone, `scrypt:${salt}:${digest}`],
        );
      });
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new ConflictException("Цей номер уже використовується для входу. Спробуйте увійти.");
      throw e;
    }
    return this.userSession(id);
  }

  async loginPhone(body: { phone?: string; password?: string }) {
    const phone = normalizePhone(body.phone);
    const password = String(body.password ?? "");
    const phoneHash = createHash("sha256").update(phone).digest("hex");
    const attempts = await this.db.query<{ failure_count: number; locked_until: Date | null }>(
      "SELECT failure_count,locked_until FROM user_phone_login_attempts WHERE phone_hash=$1", [phoneHash],
    );
    const status = attempts.rows[0];
    if (status?.locked_until && new Date(status.locked_until).getTime() > Date.now()) {
      throw new HttpException("Забагато спроб. Повторіть через 15 хвилин.", HttpStatus.TOO_MANY_REQUESTS);
    }
    const credential = await this.db.query<{ user_id: string; password_hash: string }>(
      "SELECT user_id,password_hash FROM user_phone_credentials WHERE phone=$1", [phone],
    );
    const data = credential.rows[0];
    const [algorithm, salt, digest] = data?.password_hash.split(":") ?? [];
    let verified = false;
    if (algorithm === "scrypt" && /^[a-f0-9]{48}$/.test(salt ?? "") && /^[a-f0-9]{128}$/.test(digest ?? "")) {
      const expected = Buffer.from(digest, "hex");
      const actual = await passwordDigest(password, salt);
      verified = timingSafeEqual(actual, expected);
    } else {
      // Comparable work on an unknown number, to avoid a cheap user enumeration side-channel.
      await passwordDigest(password, "00".repeat(24));
    }
    if (!verified || !data) {
      await this.db.query(`INSERT INTO user_phone_login_attempts(phone_hash,failure_count,first_attempt_at,locked_until)
        VALUES($1,1,now(),NULL)
        ON CONFLICT(phone_hash) DO UPDATE SET
          failure_count=CASE WHEN user_phone_login_attempts.first_attempt_at < now()-interval '15 minutes' THEN 1 ELSE user_phone_login_attempts.failure_count+1 END,
          first_attempt_at=CASE WHEN user_phone_login_attempts.first_attempt_at < now()-interval '15 minutes' THEN now() ELSE user_phone_login_attempts.first_attempt_at END,
          locked_until=CASE WHEN user_phone_login_attempts.first_attempt_at >= now()-interval '15 minutes'
            AND user_phone_login_attempts.failure_count >= 4 THEN now()+interval '15 minutes' ELSE NULL END`, [phoneHash]);
      throw new UnauthorizedException("Неправильний номер телефону або пароль");
    }
    await this.db.query("DELETE FROM user_phone_login_attempts WHERE phone_hash=$1", [phoneHash]);
    return this.userSession(data.user_id);
  }

  async linkPhone(user: AuthUser, body: { phone?: string; password?: string }) {
    const phone = normalizePhone(body.phone);
    const password = validatePassword(body.password);
    const salt = randomBytes(24).toString("hex");
    const digest = (await passwordDigest(password, salt)).toString("hex");
    try {
      await this.db.transaction(async(client) => {
        await client.query(
          `INSERT INTO user_phone_credentials(user_id,phone,password_hash) VALUES($1,$2,$3)
           ON CONFLICT(user_id) DO UPDATE SET phone=EXCLUDED.phone,password_hash=EXCLUDED.password_hash,updated_at=now()`,
          [user.id,phone,`scrypt:${salt}:${digest}`],
        );
        await client.query("UPDATE users SET phone=$2,updated_at=now() WHERE id=$1", [user.id,phone]);
      });
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new ConflictException("Цей номер уже належить іншому обліковому запису");
      throw e;
    }
    return { ok: true };
  }

  async logout(token: string) {
    const hash = createHash("sha256").update(token).digest("hex");
    await this.db.query("DELETE FROM user_sessions WHERE token_hash=$1", [hash]);
    return { ok: true };
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
       ON CONFLICT (telegram_id) DO UPDATE SET telegram_username=EXCLUDED.telegram_username,
         first_name=CASE WHEN users.profile_name_customized THEN users.first_name ELSE EXCLUDED.first_name END,
         last_name=CASE WHEN users.profile_name_customized THEN users.last_name ELSE EXCLUDED.last_name END,
         language_code=EXCLUDED.language_code,
         photo_url=CASE WHEN users.profile_photo_customized THEN users.photo_url ELSE COALESCE(EXCLUDED.photo_url,users.photo_url) END,
         last_active_at=now(),updated_at=now()`,
      [userId, tgUser.id, tgUser.username ?? null, tgUser.first_name ?? null, tgUser.last_name ?? null, tgUser.language_code ?? "uk", resolvedPhotoUrl ?? null, tgUser.language_code?.startsWith("en") ? "en" : tgUser.language_code?.startsWith("pl") ? "pl" : "uk"],
    );

    return this.userSession(userId);
  }
}
