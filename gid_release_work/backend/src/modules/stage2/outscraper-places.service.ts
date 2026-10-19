import { BadGatewayException, Injectable } from "@nestjs/common";

export type OutscraperPlace = {
  name: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviews: number;
  photo: string | null;
  locationLink: string | null;
  reviewsLink: string | null;
  placeId: string | null;
  phone: string | null;
  site: string | null;
  workingHours: Record<string, unknown> | null;
  raw: Record<string, unknown>;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function rowsFromPayload(payload: unknown): Record<string, unknown>[][] {
  const root = asRecord(payload);
  const data = root?.data ?? payload;
  if (!Array.isArray(data)) return [];
  if (data.every((item) => Array.isArray(item))) {
    return data.map((group) => (group as unknown[]).map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item)));
  }
  return [data.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item))];
}

@Injectable()
export class OutscraperPlacesService {
  private readonly cache = new Map<string, { value: OutscraperPlace | null; expiresAt: number }>();
  private readonly cacheTtlMs = 24 * 60 * 60 * 1000;

  private key() {
    return (process.env.OUTSCRAPER_API_KEY || "").trim();
  }

  enabled() { return Boolean(this.key()); }

  private normalize(row: Record<string, unknown>): OutscraperPlace {
    return {
      name: asString(row.name),
      fullAddress: asString(row.full_address) || asString(row.address),
      latitude: asNumber(row.latitude),
      longitude: asNumber(row.longitude),
      rating: asNumber(row.rating),
      reviews: Math.max(0, Math.round(asNumber(row.reviews) ?? 0)),
      photo: asString(row.photo) || null,
      locationLink: asString(row.location_link) || asString(row.google_maps_url) || null,
      reviewsLink: asString(row.reviews_link) || asString(row.location_reviews_link) || null,
      placeId: asString(row.place_id) || null,
      phone: asString(row.phone) || null,
      site: asString(row.site) || asString(row.website) || null,
      workingHours: asRecord(row.working_hours),
      raw: row,
    };
  }

  private cacheKey(name: string, address: string, lat?: number, lng?: number) {
    return [name.trim().toLocaleLowerCase("uk"), address.trim().toLocaleLowerCase("uk"), Number.isFinite(lat) ? Number(lat).toFixed(4) : "", Number.isFinite(lng) ? Number(lng).toFixed(4) : ""].join("|");
  }

  async batchLookup(inputs: Array<{ name: string; address: string; lat?: number; lng?: number }>): Promise<Array<OutscraperPlace | null>> {
    if (!inputs.length) return [];
    if (!this.enabled()) return inputs.map(() => null);

    const output: Array<OutscraperPlace | null> = new Array(inputs.length).fill(null);
    const pending: Array<{ index: number; key: string; input: { name: string; address: string; lat?: number; lng?: number } }> = [];
    for (let index = 0; index < inputs.length; index += 1) {
      const input = inputs[index];
      const key = this.cacheKey(input.name, input.address, input.lat, input.lng);
      const cached = this.cache.get(key);
      if (cached && cached.expiresAt > Date.now()) output[index] = cached.value;
      else pending.push({ index, key, input });
    }
    if (!pending.length) return output;

    const params = new URLSearchParams({ limit: "1", async: "false", language: "uk" });
    for (const item of pending) {
      const query = [item.input.name ? `"${item.input.name}"` : "", item.input.address].filter(Boolean).join(" ");
      params.append("query", query);
    }
    const response = await fetch(`https://api.outscraper.cloud/google-maps-search?${params.toString()}`, {
      headers: { Accept: "application/json", "X-API-KEY": this.key() },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new BadGatewayException(`Outscraper API ${response.status}: ${body || response.statusText}`);
    }
    const payload = await response.json() as unknown;
    const groups = rowsFromPayload(payload);

    pending.forEach((item, pendingIndex) => {
      const group = groups[pendingIndex] ?? (pending.length === 1 ? groups[0] : []);
      const row = group?.[0];
      const value = row ? this.normalize(row) : null;
      output[item.index] = value;
      this.cache.set(item.key, { value, expiresAt: Date.now() + this.cacheTtlMs });
    });
    return output;
  }

  async lookup(input: { name: string; address: string; lat?: number; lng?: number }) {
    return (await this.batchLookup([input]))[0] ?? null;
  }
}
