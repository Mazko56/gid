import { BadGatewayException, BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";
import { makeId } from "../../common/id.js";
import type { AuthUser } from "../../common/auth.guard.js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { GooglePlacesService, type GoogleNearbyPlace } from "./google-places.service.js";
import { GeoapifyPlacesService, type GeoapifyPlace } from "./geoapify-places.service.js";
import { OutscraperPlacesService, type OutscraperPlace } from "./outscraper-places.service.js";
import { PublicPlaceMediaService } from "./public-place-media.service.js";

function num(value: unknown, fallback?: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fallbackCategoryFromPlaceType(placeType: string) {
  const value = placeType.toLocaleLowerCase("uk");
  if (/ресторан|кафе|бар|кав|їж|food|піц/.test(value)) return "food";
  if (/магаз|сувен|аптек|shop/.test(value)) return "shop";
  if (/чан|саун|басейн|spa|масаж|відпоч|екскурс/.test(value)) return "rest";
  if (/розваг|актив|квадро|рафт|зіп|джип|entertain/.test(value)) return "entertainment";
  if (/трансфер|таксі|оренда авто|transfer/.test(value)) return "transfer";
  return "hotel";
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isOpenNow(workHours: Record<string, unknown> | null) {
  if (!workHours) return null;
  if (workHours.always_open === true) return true;
  const daily = workHours.daily as { from?: string; to?: string } | undefined;
  if (!daily?.from || !daily?.to) return null;
  const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hour12: false });
  const now = formatter.format(new Date());
  return now >= daily.from && now <= daily.to;
}

type PlaceRow = {
  id: string;
  region_id: string;
  category_slug: string;
  category_name: string;
  subcategory: string | null;
  name: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  telegram: string | null;
  website: string | null;
  image_url: string | null;
  rating: string | number;
  review_count: number;
  price_level: number | null;
  work_hours: Record<string, unknown>;
  attributes: Record<string, unknown>;
  details: Record<string, unknown>;
  translations: Record<string, unknown>;
  status: string;
  tags: string[];
};


type WeatherApiData = {
  current?: { time?: string; temperature_2m?: number; wind_speed_10m?: number; weather_code?: number };
  hourly?: { time?: string[]; precipitation_probability?: number[] };
  daily?: { sunset?: string[] };
};

const PARTNER_SUBCATEGORY_ALIASES: Record<string, string[]> = {
  "Ресторани": ["ресторан", "кухн"], "Кафе": ["кафе", "кавʼ", "кав'", "coffee"], "Бари": ["бар"], "Піцерії": ["піц", "pizza"],
  "Кондитерські": ["кондитер", "десерт", "торт"], "Фастфуд": ["фаст", "fast food"], "Їжа з собою": ["з собою", "доставка"], "Традиційна кухня": ["україн", "гуцул", "традиц"],
  "Продукти": ["продукт", "grocery", "супермаркет"], "Сувеніри": ["сувен"], "Одяг і взуття": ["одяг", "взут"], "Товари для дому": ["для дому", "госптов", "мебл", "будмат"],
  "Аптеки": ["аптек", "фарма"], "Техніка": ["технік", "електрон"], "Будівництво": ["будів", "будмат", "інструмент"], "Косметика": ["космет", "beauty"],
  "Гори": ["гора", "гір", "полонин"], "Річки": ["річк", "river"], "Водоспади": ["водоспад"], "Озера": ["озер"], "Оглядові точки": ["огляд", "панорам"], "Печери": ["печер"], "Ліси": ["ліс"],
  "Пам’ятки": ["памʼят", "пам'ят", "визначн"], "Музеї": ["музе"], "Храми": ["храм", "церк", "монаст"], "Архітектура": ["архітект", "замок"], "Історичні місця": ["істор"], "Скульптури": ["скульп", "памʼятник", "пам'ятник"], "Події": ["поді", "концерт", "фестиваль"],
  "Активний відпочинок": ["актив", "джип", "рафт", "зіп", "похід"], "Атракціони": ["атракц", "парк розваг"], "Екскурсії": ["екскурс"], "SPA і басейни": ["spa", "спа", "саун", "басейн", "масаж", "чан"], "Риболовля": ["рибол"], "Верхова їзда": ["кін", "верхов"], "Квадроцикли": ["квадро"], "Польоти": ["політ", "параплан", "авіа"],
  "Автобусні зупинки": ["зупин", "bus stop"], "Залізничні станції": ["залізнич", "вокзал", "станц"], "Автостанції": ["автостан", "автовокзал"], "Таксі": ["таксі", "трансфер"], "Парковки": ["парков"], "Оренда авто": ["оренда авто", "прокат авто"], "Заправки": ["азс", "заправ"], "Зарядні станції": ["заряд", "charging"],
  "Банкомати": ["банкомат", "atm"], "Обмін валют": ["обмін валют"], "Пошта": ["пошта"], "Лікарні": ["лікарн", "медич"], "Туалети": ["туалет"], "Wi‑Fi": ["wi-fi", "wifi"], "Поліція": ["поліц"], "Інформаційні центри": ["інформаційн", "туристичний центр"],
  "Піші маршрути": ["піш", "hiking"], "Веломаршрути": ["вело", "bike"], "Автомаршрути": ["автомаршрут"], "Верхові маршрути": ["верхов", "кінн"], "Водні маршрути": ["водн", "рафт", "сплав"], "Популярні маршрути": ["популярн маршрут"], "Складні маршрути": ["складн маршрут"], "Маршрути вихідного дня": ["вихідного дня"],
};

function partnerMatchesSubcategory(place: PlaceRow, label: string) {
  if (!label) return true;
  if (place.subcategory === label || place.tags.includes(label)) return true;
  const haystack = [place.name, place.description, place.subcategory ?? "", ...place.tags].join(" ").toLocaleLowerCase("uk");
  return (PARTNER_SUBCATEGORY_ALIASES[label] ?? []).some((token) => haystack.includes(token.toLocaleLowerCase("uk")));
}

function parseTelegramIds(value: unknown) {
  const raw = Array.isArray(value) ? value : String(value ?? "").split(/[\s,;]+/g);
  return Array.from(new Set(raw.map((item) => String(item).trim()).filter((item) => /^\d{5,20}$/.test(item))));
}

function externalPhotoErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("429") || lower.includes("resource_exhausted") || lower.includes("quota")) return "Google Place Photos недоступне: вичерпано квоту (429).";
  if (lower.includes("403") || lower.includes("permission_denied") || lower.includes("api key")) return "Google Place Photos недоступне: перевірте API key, Billing та дозволи Places API (403).";
  if (lower.includes("not configured")) return "Google-фото не перевірено: GOOGLE_MAPS_SERVER_API_KEY не налаштований.";
  if (lower.includes("no photo") || lower.includes("has no photo")) return "Google Places знайшов заклад, але не повернув жодної фотографії.";
  return `Google-фото не завантажено: ${message.slice(0, 220) || "невідома помилка"}`;
}


@Injectable()
export class Stage2Service {
  private readonly weatherCache = new Map<string, { value: {
    temperature_c: number;
    precipitation_probability: number;
    wind_speed_kmh: number;
    sunset: string;
    weather_code: number;
    observed_at: string;
  }; expiresAt: number }>();

  constructor(
    private readonly db: DatabaseService,
    private readonly google: GooglePlacesService,
    private readonly geoapify: GeoapifyPlacesService,
    private readonly outscraper: OutscraperPlacesService,
    private readonly publicMedia: PublicPlaceMediaService,
  ) {}

  private async categoryForPlaceType(placeType: string, fallback = "hotel") {
    const clean = placeType.trim();
    if (!clean) return fallback;
    const result = await this.db.query(
      "SELECT category_slug FROM place_type_templates WHERE active=true AND lower(place_type)=lower($1) ORDER BY sort_order,label LIMIT 1",
      [clean],
    );
    return String(result.rows[0]?.category_slug || fallbackCategoryFromPlaceType(clean) || fallback);
  }

  private async verifiedAddressFromBody(body: Record<string, unknown>) {
    const details = body.details && typeof body.details === "object" ? body.details as Record<string, unknown> : {};
    const ids = details.geo_place_ids && typeof details.geo_place_ids === "object" ? details.geo_place_ids as Record<string, unknown> : {};
    const isVerified = details.address_verified === true;
    const cityId = String(ids.city ?? "").trim();
    const streetId = String(ids.street ?? "").trim();
    const houseId = String(ids.house ?? "").trim();
    if (!isVerified || !cityId || !streetId || !houseId) {
      throw new BadRequestException("Оберіть місто, вулицю та будинок з адресних підказок");
    }
    const verified = await this.geoDetails(houseId);
    if (!verified.city || !verified.street || !verified.house || !verified.lat || !verified.lng) {
      throw new BadRequestException("Геосервіс не підтвердив повну адресу");
    }
    return verified;
  }

  private async ensureRegionForPlace(city: string, regionName: string, lat: number, lng: number, fallback = "region-tatariv") {
    const name = city.trim();
    if (!name) return fallback;
    const existing = await this.db.query("SELECT id FROM regions WHERE lower(name)=lower($1) LIMIT 1", [name]);
    if (existing.rows[0]?.id) return String(existing.rows[0].id);
    const slugBase = name.toLocaleLowerCase("uk").normalize("NFKD").replace(/[^a-zа-яіїєґ0-9]+/giu, "-").replace(/^-+|-+$/g, "").slice(0, 48) || makeId("region");
    const id = `region-${slugBase}`;
    await this.db.query(
      `INSERT INTO regions(id,slug,name,center_lat,center_lng,active) VALUES($1,$2,$3,$4,$5,true)
       ON CONFLICT (id) DO UPDATE SET center_lat=EXCLUDED.center_lat,center_lng=EXCLUDED.center_lng,updated_at=now()`,
      [id, slugBase, name + (regionName ? "" : ""), lat, lng],
    );
    return id;
  }

  private googlePriceLevel(value?: string) {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized.includes("INEXPENSIVE")) return 1;
    if (normalized.includes("MODERATE")) return 2;
    if (normalized.includes("VERY_EXPENSIVE")) return 4;
    if (normalized.includes("EXPENSIVE")) return 3;
    if (normalized.includes("FREE")) return 1;
    return null;
  }

  private googlePlaceToStage2(place: GoogleNearbyPlace, lat?: number, lng?: number) {
    const location = place.location;
    const placeLat = Number(location?.latitude ?? 0);
    const placeLng = Number(location?.longitude ?? 0);
    const section = this.google.mapSection(place.primaryType ?? "", place.types ?? []);
    const distance = lat != null && lng != null && placeLat && placeLng ? distanceMeters(lat, lng, placeLat, placeLng) : null;
    return {
      id: `google_${place.id}`,
      region_id: "google",
      category_slug: section,
      category_name: section,
      subcategory: this.google.subcategory(place.primaryType ?? "", place.primaryTypeDisplayName?.text ?? ""),
      name: place.displayName?.text ?? "Google Maps place",
      description: place.primaryTypeDisplayName?.text ?? "Google Maps",
      address: place.formattedAddress ?? "",
      lat: placeLat,
      lng: placeLng,
      phone: place.nationalPhoneNumber ?? null,
      telegram: null,
      website: place.websiteUri ?? null,
      // Resolve photos by Place ID on every image request instead of persisting a photo resource
      // name in the client. Google photo names can expire, while Place IDs remain the stable key.
      image_url: place.id ? `/api/stage2/google/place-photo?id=${encodeURIComponent(place.id)}` : null,
      rating: Number(place.rating ?? 0),
      review_count: Number(place.userRatingCount ?? 0),
      price_level: this.googlePriceLevel(place.priceLevel),
      work_hours: place.regularOpeningHours ?? {},
      attributes: {
        partner: false,
        google: true,
        google_maps_uri: place.googleMapsLinks?.placeUri ?? place.googleMapsUri ?? null,
        google_reviews_uri: place.googleMapsLinks?.reviewsUri ?? null,
        google_photos_uri: place.googleMapsLinks?.photosUri ?? null,
      },
      details: {
        google_place_id: place.id,
        google_maps_uri: place.googleMapsLinks?.placeUri ?? place.googleMapsUri ?? null,
        google_reviews_uri: place.googleMapsLinks?.reviewsUri ?? null,
        google_photos_uri: place.googleMapsLinks?.photosUri ?? null,
        google_phone: place.nationalPhoneNumber ?? null,
        google_reviews: place.reviews ?? [],
        google_weekday_descriptions: place.regularOpeningHours?.weekdayDescriptions ?? [],
      },
      translations: {},
      tags: place.types ?? [],
      distance_m: distance == null ? null : Math.round(distance),
      is_open_now: place.regularOpeningHours?.openNow ?? null,
      status: "external",
      source: "google" as const,
      is_partner: false,
    };
  }

  private geoapifyPlaceToStage2(place: GeoapifyPlace, lat?: number, lng?: number, requestedSection = "") {
    const section = requestedSection && requestedSection !== "all" ? requestedSection : this.geoapify.mapSection(place.categories);
    const distance = place.distance ?? (lat != null && lng != null ? distanceMeters(lat, lng, place.lat, place.lng) : null);
    const googleSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.name, place.formattedAddress].filter(Boolean).join(", "))}`;
    const rawOpeningHours = String(place.openingHours ?? "").trim();
    const workHours = rawOpeningHours
      ? { raw: rawOpeningHours, weekdayDescriptions: [rawOpeningHours], ...(rawOpeningHours === "24/7" ? { always_open: true } : {}) }
      : {};
    const subcategory = this.geoapify.subcategory(place.categories);
    return {
      id: `geoapify_${place.placeId}`,
      region_id: "geoapify",
      category_slug: section,
      category_name: section,
      subcategory,
      name: place.name || "Локація",
      description: place.description || subcategory || "Geoapify / OpenStreetMap",
      address: place.formattedAddress || "",
      lat: Number(place.lat),
      lng: Number(place.lng),
      phone: place.phone ?? null,
      telegram: null,
      website: place.website ?? null,
      // Geoapify Place Details can expose Wikimedia/OSM media through wiki_and_media.image.
      // Google is not used for photos; cards progressively request Geoapify details when media is missing.
      image_url: place.imageUrl ?? null,
      rating: 0,
      review_count: 0,
      price_level: null,
      work_hours: workHours,
      attributes: {
        partner: false,
        geoapify: true,
        external_provider: "geoapify",
        google_maps_uri: googleSearch,
        google_reviews_uri: googleSearch,
        google_review_enriched: false,
        google_place_id: null as string | null,
        photo_provider: place.imageUrl ? "geoapify_wikimedia" : null,
        enrichment_provider: null as string | null,
        internet_access: place.internetAccess ?? null,
        wheelchair: place.wheelchair ?? null,
        parking: place.parking ?? null,
      },
      details: {
        geoapify_place_id: place.placeId,
        external_provider: "geoapify",
        google_maps_uri: googleSearch,
        google_reviews_uri: googleSearch,
        google_place_id: null as string | null,
        google_reviews: [] as unknown[],
        google_photo_name: null as string | null,
        google_photo_attributions: [] as unknown[],
        google_enrichment_error: null as string | null,
        outscraper_enriched: false,
        outscraper_enrichment_error: null as string | null,
        photo_error: place.imageUrl ? null : "Geoapify Place Details не повернув фото для цієї локації.",
        photo_source_url: null as string | null,
        photo_attribution: null as string | null,
        phone: place.phone ?? null,
        google_weekday_descriptions: rawOpeningHours ? [rawOpeningHours] : [],
        geoapify_categories: place.categories,
      },
      translations: {},
      tags: place.categories,
      distance_m: distance == null ? null : Math.round(distance),
      is_open_now: rawOpeningHours === "24/7" ? true : null,
      status: "external",
      source: "geoapify" as const,
      is_partner: false,
    };
  }

  // Geoapify is used only to select an address; public tourist catalogs never import provider places.
  // Address selections are signed so callers cannot invent coordinates or a verified address.
  private addressSigningKey() {
    const key = process.env.GEO_ADDRESS_SIGNING_SECRET || process.env.ADMIN_API_KEY || process.env.TELEGRAM_BOT_TOKEN;
    if (!key || key.length < 16) throw new BadGatewayException("Налаштуйте GEO_ADDRESS_SIGNING_SECRET для перевірки адрес");
    return key;
  }

  private signGeoAddress(details: Record<string, unknown>): string {
    const payload = Buffer.from(JSON.stringify({ ...details, expires_at: Date.now() + 20 * 60_000 }), "utf8").toString("base64url");
    const signature = createHmac("sha256", this.addressSigningKey()).update(payload).digest("base64url");
    return `geoa_${payload}.${signature}`;
  }

  private decodeGeoAddress(id: string) {
    const match = /^geoa_([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(id);
    if (!match) throw new BadRequestException("Невірна адреса: повторіть вибір із підказок");
    const expected = createHmac("sha256", this.addressSigningKey()).update(match[1]).digest();
    const supplied = Buffer.from(match[2], "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new BadRequestException("Недійсна адреса");
    const entry = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8")) as Record<string, unknown>;
    if (Number(entry.expires_at) < Date.now()) throw new BadRequestException("Термін дії підказки минув. Виберіть адресу ще раз");
    return { place_id: id, formatted_address: String(entry.formatted_address || ""),
      lat: Number(entry.lat), lng: Number(entry.lng), city: String(entry.city || ""),
      region: String(entry.region || ""), street: String(entry.street || ""), house: String(entry.house || "") };
  }

  private async geoapifyAutocomplete(input: string, mode: "city" | "street" | "house", city: string, street: string) {
    const key = process.env.GEOAPIFY_API_KEY?.trim();
    if (!key) throw new BadGatewayException("Для автопідказок адрес налаштуйте GOOGLE_MAPS_SERVER_API_KEY або GEOAPIFY_API_KEY на backend Railway");
    const query = [mode === "city" ? input : mode === "street" ? `${input}, ${city}` : `${input}, ${street}, ${city}`].join("");
    const params = new URLSearchParams({ text: query, format: "json", lang: "uk", limit: "8", apiKey: key });
    if (mode === "city") params.set("type", "city");
    const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, { signal: AbortSignal.timeout(8500) });
    if (!res.ok) throw new BadGatewayException(`Геопідказки недоступні: Geoapify HTTP ${res.status}. Перевірте ключ та ліміти`);
    const response = await res.json() as { results?: Array<Record<string, unknown>> };
    return (response.results || []).filter((item) => {
      if (mode === "city") return Boolean(item.city || item.town || item.village || item.municipality);
      if (mode === "street") return Boolean(item.street);
      return Boolean(item.housenumber && item.street);
    }).map((item) => {
      const details = {
        formatted_address: String(item.formatted || ""), lat: Number(item.lat), lng: Number(item.lon),
        city: String(item.city || item.town || item.village || item.municipality || ""),
        region: String(item.state || ""), street: String(item.street || ""), house: String(item.housenumber || ""),
      };
      const main = mode === "city" ? details.city : mode === "street" ? details.street : details.house;
      return { place_id: this.signGeoAddress(details), text: details.formatted_address,
        main_text: main, secondary_text: details.formatted_address };
    });
  }

  async geoAutocomplete(input: string, mode: "city" | "street" | "house", city = "", street = "") {
    const text = input.trim();
    if (!text || text.length > 140) return [];
    if (this.google.enabled()) {
      try { return await this.google.autocomplete(text, mode, city, street); }
      catch (error) { if (!process.env.GEOAPIFY_API_KEY) throw error; }
    }
    return this.geoapifyAutocomplete(text, mode, city, street);
  }

  async geoReverse(lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new BadRequestException("lat/lng are required");
    if (this.geoapify.enabled()) {
      try { return await this.geoapify.reverse(lat, lng); }
      catch (error) {
        if (!this.google.enabled()) throw error;
      }
    }
    if (this.google.enabled()) return this.google.reverse(lat, lng);
    return { place_id: "", formatted_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng, city: "", region: "", street: "", house: "" };
  }

  async geoDetails(placeId: string) {
    if (placeId.startsWith("geoa_")) return this.decodeGeoAddress(placeId);
    const place = await this.google.details(placeId);
    const components = place.addressComponents ?? [];
    const pick = (...types: string[]) => components.find((item) => types.some((type) => item.types?.includes(type)))?.longText ?? "";
    return {
      place_id: place.id,
      formatted_address: place.formattedAddress ?? "",
      lat: Number(place.location?.latitude ?? 0),
      lng: Number(place.location?.longitude ?? 0),
      city: pick("locality", "postal_town", "administrative_area_level_3"),
      region: pick("administrative_area_level_1"),
      street: pick("route"),
      house: pick("street_number"),
    };
  }

  async googlePhoto(photoName: string) {
    return this.google.photoData(photoName);
  }

  async googlePhotoUri(photoName: string) {
    return { photo_url: await this.google.photoUri(photoName) };
  }

  async googlePlacePhoto(placeId: string) {
    if (!placeId.trim()) throw new BadRequestException("Google place id is required");
    return this.google.placePhotoData(placeId.trim());
  }


  async weather(lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException("Valid lat/lng are required");
    }
    const cacheKey = `${lat.toFixed(3)}:${lng.toFixed(3)}`;
    const cached = this.weatherCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: "temperature_2m,wind_speed_10m,weather_code",
      hourly: "precipitation_probability",
      daily: "sunset",
      forecast_days: "1",
      timezone: "auto",
    });

    const load = async (retry = true): Promise<WeatherApiData> => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(7000),
        });
        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw new Error(`Weather API ${response.status}${body ? `: ${body.slice(0, 180)}` : ""}`);
        }
        return await response.json() as WeatherApiData;
      } catch (error) {
        if (!retry) throw error;
        await new Promise((resolve) => setTimeout(resolve, 450));
        return load(false);
      }
    };

    let data: WeatherApiData;
    try {
      data = await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadGatewayException(`Weather API unavailable: ${message}`);
    }

    const temperature = Number(data.current?.temperature_2m);
    const windSpeed = Number(data.current?.wind_speed_10m);
    if (!data.current || !Number.isFinite(temperature) || !Number.isFinite(windSpeed)) {
      throw new BadGatewayException("Weather API returned incomplete current conditions");
    }
    const currentTime = String(data.current.time ?? "");
    const currentHour = currentTime ? `${currentTime.slice(0, 13)}:00` : "";
    const foundHourIndex = data.hourly?.time?.findIndex((item) => item === currentHour) ?? -1;
    const hourIndex = foundHourIndex >= 0 ? foundHourIndex : 0;
    const precipitation = Number(data.hourly?.precipitation_probability?.[hourIndex] ?? 0);
    const value = {
      temperature_c: temperature,
      precipitation_probability: Number.isFinite(precipitation) ? precipitation : 0,
      wind_speed_kmh: windSpeed,
      sunset: String(data.daily?.sunset?.[0] ?? ""),
      weather_code: Number(data.current?.weather_code ?? 0),
      observed_at: currentTime,
    };
    this.weatherCache.set(cacheKey, { value, expiresAt: Date.now() + 10 * 60 * 1000 });
    return value;
  }

  async context(startParam: string) {
    const qr = await this.db.query(
      `SELECT q.id,q.start_param,q.type,q.source,q.region_id,q.place_id,q.active,
              r.name region_name,r.name_en region_name_en,r.name_pl region_name_pl,r.center_lat,r.center_lng,r.community_url
       FROM qr_points q JOIN regions r ON r.id=q.region_id
       WHERE q.start_param=$1 AND q.active=true`,
      [startParam],
    );
    const row = qr.rows[0] as Record<string, unknown> | undefined;
    if (!row && startParam.startsWith("amb_")) {
      const ambassador = await this.db.query(`SELECT a.id,r.id AS region_id,r.name,r.name_en,r.name_pl,
        r.center_lat,r.center_lng,r.community_url FROM ambassadors a JOIN regions r ON r.id=COALESCE(a.region_id,'region-tatariv')
        WHERE a.code=$1 AND a.active=true`,[startParam]);
      const item = ambassador.rows[0];
      if (item) return { qr: { id:item.id,startParam,type:'ambassador',source:'ambassador' },
        region:{id:item.region_id,name:item.name,nameEn:item.name_en,namePl:item.name_pl,lat:item.center_lat,lng:item.center_lng,communityUrl:item.community_url},place:null };
    }
    if (!row) throw new NotFoundException("QR context not found or inactive");
    const place = row.place_id ? await this.place(String(row.place_id), false) : null;
    return {
      qr: { id: row.id, startParam: row.start_param, type: row.type, source: row.source },
      region: { id: row.region_id, name: row.region_name, nameEn: row.region_name_en, namePl: row.region_name_pl, lat: row.center_lat, lng: row.center_lng, communityUrl: row.community_url },
      place,
    };
  }

  async categories() {
    const result = await this.db.query(
      "SELECT slug,name,name_en,name_pl,sort_order,subcategories,filter_config FROM categories WHERE active=true ORDER BY sort_order,name",
    );
    return result.rows;
  }

  async placeTypeTemplates(category?: string) {
    const result = await this.db.query(
      `SELECT id,category_slug,place_type,label,default_title,default_description,default_services,default_amenities,fields,sort_order,active
       FROM place_type_templates WHERE active=true AND ($1::text IS NULL OR category_slug=$1) ORDER BY category_slug,sort_order,label`,
      [category || null],
    );
    return result.rows;
  }

  private async rawPlaces(regionId?: string, includePending = false) {
    const result = await this.db.query<PlaceRow>(
      `SELECT p.*,c.name category_name,
        COALESCE((SELECT json_agg(t.tag ORDER BY t.tag) FROM place_tags t WHERE t.place_id=p.id),'[]'::json)::jsonb AS tags
       FROM places p JOIN categories c ON c.slug=p.category_slug
       WHERE ($1::text IS NULL OR p.region_id=$1) ${includePending ? "" : "AND p.status='approved'"}
       ORDER BY p.rating DESC,p.name`,
      [regionId ?? null],
    );
    return result.rows;
  }

  async places(params: Record<string, unknown>) {
    const regionId = String(params.region_id ?? "region-tatariv");
    const category = params.category ? String(params.category) : "";
    const subcategory = params.subcategory ? String(params.subcategory) : "";
    const q = params.q ? String(params.q).trim().toLocaleLowerCase("uk") : "";
    const lat = num(params.lat);
    const lng = num(params.lng);
    const radius = num(params.radius);
    const minRating = num(params.min_rating);
    const priceLevel = num(params.price_level);
    const openNow = String(params.open_now ?? "") === "true";
    const kids = String(params.kids ?? "") === "true";
    const parking = String(params.parking ?? "") === "true";
    const partner = String(params.partner ?? "") === "true";
    // Keep the legacy query parameter names so the current frontend/routes do not change.
    // They now mean "include external places"; Geoapify is the primary provider and Google is fallback only.
    const externalLimit = Math.max(1, Math.min(Number(params.google_limit ?? 20) || 20, 40));
    const includeRoutes = String(params.include_routes ?? "true") !== "false";
    const debugExternal = String(params.debug_google ?? "") === "true";
    // Product rule: public catalog/nearby endpoints return only places created and approved through our admin/database.
    // Keep the external provider code below for legacy/future explicit tooling, but never enable it from /places.
    const externalRequested = false;
    const externalSection = String(params.google_section ?? (category || "all"));

    let rows = await this.rawPlaces(regionId);
    rows = rows.filter((p) => !category || p.category_slug === category);
    rows = rows.filter((p) => partnerMatchesSubcategory(p, subcategory));
    rows = rows.filter((p) => !q || [p.name,p.description,p.address,p.subcategory ?? "",...p.tags].join(" ").toLocaleLowerCase("uk").includes(q));
    rows = rows.filter((p) => minRating == null || Number(p.rating) >= minRating);
    rows = rows.filter((p) => priceLevel == null || p.price_level === priceLevel);
    rows = rows.filter((p) => !kids || p.attributes?.kids === true);
    rows = rows.filter((p) => !parking || p.attributes?.parking === true);
    rows = rows.filter((p) => !partner || p.attributes?.partner === true);
    rows = rows.filter((p) => !openNow || isOpenNow(p.work_hours) === true);

    const mapped = rows.map((p) => {
      const distance = lat != null && lng != null ? distanceMeters(lat, lng, Number(p.lat), Number(p.lng)) : null;
      return { ...p, rating: Number(p.rating), distance_m: distance == null ? null : Math.round(distance), is_open_now: isOpenNow(p.work_hours) };
    });
    const filtered = radius != null ? mapped.filter((p) => p.distance_m != null && p.distance_m <= radius) : mapped;
    const partnerRows = filtered.map((p) => ({ ...p, source: "partner" as const, is_partner: p.attributes?.partner === true }));

    if (debugExternal && externalRequested) {
      if (lat == null || lng == null || radius == null) {
        throw new BadRequestException(`Сервіс місць не запущено: некоректні координати або радіус (lat=${String(params.lat ?? "")}, lng=${String(params.lng ?? "")}, radius=${String(params.radius ?? "")})`);
      }
      if (!this.geoapify.enabled() && !this.google.enabled()) {
        throw new BadGatewayException("Сервіс місць не запущено: на backend відсутній GEOAPIFY_API_KEY (і немає Google fallback)");
      }
    }

    // Geoapify is primary for all tourist catalog/nearby searches. This removes Google Nearby Search
    // from the normal flow and therefore avoids its SearchNearby quota/cost. Details/routes are loaded
    // only when a concrete place is opened.
    const includeGeoapify = externalRequested && lat != null && lng != null && radius != null && this.geoapify.enabled() && !partner;
    if (includeGeoapify) {
      try {
        const geoPlaces = await this.geoapify.nearby(lat!, lng!, radius!, externalSection, subcategory, externalLimit, q);
        const external = geoPlaces.map((item) => this.geoapifyPlaceToStage2(item, lat!, lng!, externalSection));
        const selectedQuery = q.toLocaleLowerCase("uk");
        const filteredExternal = external
          .filter((place) => !selectedQuery || [place.name, place.description, place.address, place.subcategory, ...place.tags].join(" ").toLocaleLowerCase("uk").includes(selectedQuery))
          // Geoapify/OSM does not provide Google-style user rating/price for every POI. Do not fabricate it.
          // When a filter depends on unavailable data, keep only local partner rows whose data is known.
          .filter(() => minRating == null && priceLevel == null && !kids && !parking)
          .filter((place) => !openNow || place.is_open_now === true || place.is_open_now == null);
        const deduped = filteredExternal.filter((externalPlace) => !partnerRows.some((partnerPlace) => {
          const close = distanceMeters(Number(partnerPlace.lat), Number(partnerPlace.lng), externalPlace.lat, externalPlace.lng) < 35;
          const firstWord = externalPlace.name.toLocaleLowerCase("uk").split(" ")[0] || "___";
          return close && partnerPlace.name.toLocaleLowerCase("uk").includes(firstWord);
        }));
        const combined = [...partnerRows, ...deduped];
        combined.sort((a, b) => (a.distance_m ?? 1e12) - (b.distance_m ?? 1e12) || Number(b.rating) - Number(a.rating));
        return combined;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Geoapify Places /places diagnostic] ${message}`);
        // When GEOAPIFY_API_KEY is configured, never spend Google Nearby quota behind the user's back.
        // Keep the old Google provider only as a fallback for deployments where Geoapify is not configured.
        if (debugExternal) {
          if (error instanceof BadGatewayException || error instanceof BadRequestException) throw error;
          throw new BadGatewayException(`Geoapify не завантажив місця: ${message}`);
        }
        partnerRows.sort((a, b) => (a.distance_m ?? 1e12) - (b.distance_m ?? 1e12) || Number(b.rating) - Number(a.rating));
        return partnerRows;
      }
    }

    // Google fallback is intentionally preserved for a safe migration. It is reached only if
    // Geoapify is unavailable/failed or GEOAPIFY_API_KEY is missing.
    const includeGoogleFallback = externalRequested && !this.geoapify.enabled() && !partner && lat != null && lng != null && radius != null && this.google.enabled();
    if (includeGoogleFallback) {
      const googleSpread = String(params.google_spread ?? "") === "true";
      try {
        const googlePlaces = await this.google.nearby(lat!, lng!, radius!, externalSection, subcategory, externalLimit, googleSpread);
        const external = googlePlaces.map((item) => this.googlePlaceToStage2(item, lat!, lng!));
        const selectedQuery = q.toLocaleLowerCase("uk");
        const filteredExternal = external.filter((place) => !subcategory || this.google.matchesSubcategory(subcategory, String(place.tags[0] ?? ""), place.tags))
          .filter((place) => !selectedQuery || [place.name, place.description, place.address, place.subcategory, ...place.tags].join(" ").toLocaleLowerCase("uk").includes(selectedQuery))
          .filter((place) => minRating == null || Number(place.rating) >= minRating)
          .filter((place) => priceLevel == null || place.price_level === priceLevel)
          .filter((place) => !openNow || place.is_open_now === true)
          .filter(() => !kids && !parking);
        const deduped = filteredExternal.filter((googlePlace) => !partnerRows.some((partnerPlace) => distanceMeters(Number(partnerPlace.lat), Number(partnerPlace.lng), googlePlace.lat, googlePlace.lng) < 35 && partnerPlace.name.toLocaleLowerCase("uk").includes(googlePlace.name.toLocaleLowerCase("uk").split(" ")[0] || "___")));
        const combined = [...partnerRows, ...deduped];
        combined.sort((a, b) => (a.distance_m ?? 1e12) - (b.distance_m ?? 1e12) || Number(b.rating) - Number(a.rating));
        return combined;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Google Places fallback /places diagnostic] ${message}`);
        if (debugExternal) {
          throw new BadGatewayException(`Geoapify/Google fallback не завантажили місця: ${message}`);
        }
      }
    }

    let routedPartnerRows = partnerRows;
    // Route API is not used for all external results. For a local partner list, keep existing optional
    // Google batch route behavior; concrete external place routes are resolved in place().
    if (includeRoutes && lat != null && lng != null && partnerRows.length && !this.geoapify.enabled() && this.google.enabled()) {
      try {
        const routeMetrics = await this.google.walkingMatrix(lat, lng, partnerRows.slice(0, 20).map((place) => ({ id: place.id, lat: Number(place.lat), lng: Number(place.lng) })));
        const byId = new Map(routeMetrics.map((item) => [item.id, item]));
        routedPartnerRows = partnerRows.map((place) => {
          const route = byId.get(place.id);
          return route ? { ...place, distance_m: route.distance_m, walking_duration_s: route.walking_duration_s } : place;
        });
      } catch { /* leave geometric distance when Routes API is unavailable */ }
    }
    routedPartnerRows.sort((a, b) => (a.distance_m ?? 1e12) - (b.distance_m ?? 1e12) || Number(b.rating) - Number(a.rating));
    return routedPartnerRows;
  }

  async enrichPlaces(body: Record<string, unknown>) {
    const raw = Array.isArray(body.places) ? body.places : [];
    const inputs = raw.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item))).slice(0, 3);
    if (!inputs.length) return [];

    const externalInputs = inputs.map((base) => ({
      name: String(base.name ?? "").trim(),
      address: String(base.address ?? "").trim(),
      lat: Number(base.lat),
      lng: Number(base.lng),
    }));
    let outscraperMatches: Array<OutscraperPlace | null> = inputs.map(() => null);
    let outscraperError = "";
    if (this.outscraper.enabled()) {
      try {
        outscraperMatches = await this.outscraper.batchLookup(externalInputs);
      } catch (error) {
        outscraperError = error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300);
      }
    }

    return Promise.all(inputs.map(async (base, index) => {
      const id = String(base.id ?? "");
      if (!id.startsWith("geoapify_")) return base;
      const geoapifyId = id.slice("geoapify_".length);
      const name = String(base.name ?? "").trim();
      const address = String(base.address ?? "").trim();
      const lat = Number(base.lat);
      const lng = Number(base.lng);
      const attributes = base.attributes && typeof base.attributes === "object" && !Array.isArray(base.attributes) ? base.attributes as Record<string, unknown> : {};
      const details = base.details && typeof base.details === "object" && !Array.isArray(base.details) ? base.details as Record<string, unknown> : {};
      let imageUrl = typeof base.image_url === "string" && base.image_url.trim() ? base.image_url.trim() : "";
      let photoProvider = imageUrl ? "geoapify_wikimedia" : null;
      let photoError: string | null = imageUrl ? null : "Geoapify Place Details ще не перевірявся для цього фото.";
      let photoSourceUrl: string | null = null;
      let photoAttribution: string | null = null;

      if (!imageUrl) {
        try {
          const geoDetails = await this.geoapify.details(geoapifyId);
          imageUrl = geoDetails.imageUrl?.trim() || "";
          if (imageUrl) {
            photoProvider = "geoapify_wikimedia";
            photoError = null;
          } else {
            photoError = "Geoapify/OSM/Wikimedia не містить фото для цієї локації.";
          }
        } catch (error) {
          photoError = `Не вдалося перевірити фото через Geoapify: ${error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240)}`;
        }
      }

      // Do not query public photo providers while enriching map/list batches.
      // A single map can contain 20-30 POIs and firing Wikipedia/Openverse requests for every marker
      // quickly triggers provider rate limits. Public-media lookup is intentionally deferred until
      // the user opens one concrete place in place(), where only one location is enriched.

      let result: Record<string, unknown> = {
        ...base,
        image_url: imageUrl || null,
        attributes: { ...attributes, photo_provider: photoProvider },
        details: {
          ...details,
          google_photo_name: null,
          google_photo_attributions: [],
          photo_error: photoError,
          photo_source_url: photoSourceUrl,
          photo_attribution: photoAttribution,
          outscraper_enrichment_error: outscraperError || null,
        },
      };

      const scraped = outscraperMatches[index];
      if (scraped) {
        if (!imageUrl && scraped.photo) {
          imageUrl = scraped.photo;
          photoProvider = "outscraper_google_maps";
          photoError = null;
        }
        const mapsUri = scraped.locationLink ?? attributes.google_maps_uri ?? null;
        const reviewsUri = scraped.reviewsLink ?? mapsUri ?? attributes.google_reviews_uri ?? null;
        result = {
          ...result,
          image_url: imageUrl || null,
          rating: Number(scraped.rating ?? base.rating ?? 0),
          review_count: Number(scraped.reviews ?? base.review_count ?? 0),
          phone: base.phone || scraped.phone || null,
          website: base.website || scraped.site || null,
          attributes: {
            ...(result.attributes as Record<string, unknown>),
            google_review_enriched: Boolean(scraped.rating != null || scraped.reviews > 0),
            google_place_id: scraped.placeId,
            google_maps_uri: mapsUri,
            google_reviews_uri: reviewsUri,
            photo_provider: photoProvider,
            enrichment_provider: "outscraper",
          },
          details: {
            ...(result.details as Record<string, unknown>),
            google_place_id: scraped.placeId,
            google_maps_uri: mapsUri,
            google_reviews_uri: reviewsUri,
            photo_error: photoError,
            outscraper_enriched: true,
            outscraper_enrichment_error: null,
          },
        };
        return result;
      }

      // Official Google Places remains only a fallback. If it is disabled/403, the card still
      // works with Geoapify data; reliable Google Maps ratings/photos require OUTSCRAPER_API_KEY.
      if (!this.google.enabled() || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return {
          ...result,
          details: {
            ...(result.details as Record<string, unknown>),
            photo_error: imageUrl ? null : (this.outscraper.enabled()
              ? photoError
              : `${photoError ?? "Фото не знайдено."} Для фото/рейтингу Google Maps без Places API додайте OUTSCRAPER_API_KEY.`),
          },
        };
      }
      try {
        const google = await this.google.findByTextForCard(name, address, lat, lng);
        const googleLat = Number(google?.location?.latitude);
        const googleLng = Number(google?.location?.longitude);
        const matchDistance = google && Number.isFinite(googleLat) && Number.isFinite(googleLng) ? distanceMeters(lat, lng, googleLat, googleLng) : 0;
        if (!google || (matchDistance && matchDistance > 500)) return result;
        const googleMapsUri = google.googleMapsLinks?.placeUri ?? google.googleMapsUri ?? attributes.google_maps_uri ?? null;
        const googleReviewsUri = google.googleMapsLinks?.reviewsUri ?? googleMapsUri ?? attributes.google_reviews_uri ?? null;
        result = {
          ...result,
          rating: Number(google.rating ?? base.rating ?? 0),
          review_count: Number(google.userRatingCount ?? base.review_count ?? 0),
          attributes: {
            ...(result.attributes as Record<string, unknown>),
            google_review_enriched: true,
            google_place_id: google.id ?? null,
            google_maps_uri: googleMapsUri,
            google_reviews_uri: googleReviewsUri,
            enrichment_provider: "google_places",
          },
          details: {
            ...(result.details as Record<string, unknown>),
            google_place_id: google.id ?? null,
            google_maps_uri: googleMapsUri,
            google_reviews_uri: googleReviewsUri,
            google_enrichment_error: null,
          },
        };
      } catch (error) {
        result = {
          ...result,
          details: {
            ...(result.details as Record<string, unknown>),
            google_enrichment_error: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300),
          },
        };
      }
      return result;
    }));
  }

  async place(id: string, publicOnly = true, originLat?: number, originLng?: number) {
    const withRoute = async <T extends { id: string; lat: number; lng: number; distance_m?: number | null }>(place: T) => {
      if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) return place;
      // Prefer Geoapify Routing for a single opened place; this avoids Google Routes usage in the normal tourist flow.
      if (this.geoapify.enabled()) {
        try {
          const route = await this.geoapify.walkingRoute(Number(originLat), Number(originLng), { id: place.id, lat: Number(place.lat), lng: Number(place.lng) });
          if (route) return { ...place, distance_m: route.distance_m, walking_duration_s: route.walking_duration_s };
        } catch { /* keep straight-line distance when Geoapify Routing is temporarily unavailable */ }
        return place;
      }
      if (!this.google.enabled()) return place;
      try {
        const [route] = await this.google.walkingMatrix(Number(originLat), Number(originLng), [{ id: place.id, lat: Number(place.lat), lng: Number(place.lng) }]);
        return route ? { ...place, distance_m: route.distance_m, walking_duration_s: route.walking_duration_s } : place;
      } catch { return place; }
    };
    if (id.startsWith("geoapify_")) {
      const geoapifyId = id.slice("geoapify_".length);
      const result = await this.geoapify.details(geoapifyId);
      const base = this.geoapifyPlaceToStage2(result, originLat, originLng);
      let enriched = base;

      if (!enriched.image_url) {
        try {
          const publicMedia = await this.publicMedia.lookup({ name: base.name, address: base.address, lat: Number(base.lat), lng: Number(base.lng) });
          if (publicMedia.imageUrl) {
            enriched = {
              ...enriched,
              image_url: publicMedia.imageUrl,
              attributes: { ...enriched.attributes, photo_provider: publicMedia.provider },
              details: {
                ...enriched.details,
                photo_error: null,
                photo_source_url: publicMedia.sourceUrl,
                photo_attribution: publicMedia.attribution,
              },
            };
          } else if (publicMedia.error) {
            enriched = {
              ...enriched,
              details: { ...enriched.details, photo_error: [enriched.details.photo_error, publicMedia.error].filter(Boolean).join(" ").slice(0, 500) },
            };
          }
        } catch (error) {
          enriched = {
            ...enriched,
            details: { ...enriched.details, photo_error: [enriched.details.photo_error, `Public media: ${error instanceof Error ? error.message : String(error)}`].filter(Boolean).join(" ").slice(0, 500) },
          };
        }
      }

      // Outscraper is an optional low-cost Google Maps enrichment fallback. Geoapify itself does not
      // expose user review ratings for normal POIs, and many OSM records do not contain photos.
      // Keep the POI/navigation source Geoapify, but fill rating/review count/main photo from Outscraper
      // when OUTSCRAPER_API_KEY is configured. Results are cached inside OutscraperPlacesService.
      if (this.outscraper.enabled()) {
        try {
          const scraped = await this.outscraper.lookup({ name: base.name, address: base.address, lat: Number(base.lat), lng: Number(base.lng) });
          if (scraped) {
            const imageUrl = enriched.image_url || scraped.photo || null;
            const mapsUri = scraped.locationLink ?? enriched.attributes.google_maps_uri;
            const reviewsUri = scraped.reviewsLink ?? mapsUri ?? enriched.attributes.google_reviews_uri;
            enriched = {
              ...enriched,
              image_url: imageUrl,
              rating: Number(scraped.rating ?? base.rating ?? 0),
              review_count: Number(scraped.reviews ?? base.review_count ?? 0),
              phone: base.phone || scraped.phone || null,
              website: base.website || scraped.site || null,
              attributes: {
                ...enriched.attributes,
                google_review_enriched: Boolean(scraped.rating != null || scraped.reviews > 0),
                google_place_id: scraped.placeId,
                google_maps_uri: mapsUri,
                google_reviews_uri: reviewsUri,
                photo_provider: imageUrl ? (enriched.image_url ? (enriched.attributes.photo_provider ?? "public_media") : "outscraper_google_maps") : null,
                enrichment_provider: "outscraper",
              },
              details: {
                ...enriched.details,
                google_place_id: scraped.placeId,
                google_maps_uri: mapsUri,
                google_reviews_uri: reviewsUri,
                photo_error: imageUrl ? null : "Geoapify/OSM/Wikimedia та Outscraper не повернули фото для цього закладу.",
                outscraper_enriched: true,
                outscraper_enrichment_error: null,
              },
            };
          }
        } catch (error) {
          enriched = { ...enriched, details: { ...enriched.details, outscraper_enrichment_error: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300) } };
        }
      }

      // Official Google remains optional only for review texts/opening-hours enrichment. A 403 must
      // never erase rating/photo already obtained from Outscraper or Geoapify.
      if (this.google.enabled()) {
        try {
          const google = await this.google.findByTextForReviews(base.name, base.address, Number(base.lat), Number(base.lng));
          const googleLat = Number(google?.location?.latitude);
          const googleLng = Number(google?.location?.longitude);
          const matchDistance = google && Number.isFinite(googleLat) && Number.isFinite(googleLng)
            ? distanceMeters(Number(base.lat), Number(base.lng), googleLat, googleLng)
            : 0;
          if (google && (!matchDistance || matchDistance <= 500)) {
            const googleMapsUri = google.googleMapsLinks?.placeUri ?? google.googleMapsUri ?? base.attributes.google_maps_uri;
            const googleReviewsUri = google.googleMapsLinks?.reviewsUri ?? googleMapsUri ?? base.attributes.google_reviews_uri;
            enriched = {
              ...enriched,
              image_url: enriched.image_url || null,
              rating: Number(google.rating ?? enriched.rating ?? 0),
              review_count: Number(google.userRatingCount ?? enriched.review_count ?? 0),
              phone: enriched.phone || google.nationalPhoneNumber || null,
              website: enriched.website || google.websiteUri || null,
              work_hours: google.regularOpeningHours ?? base.work_hours,
              is_open_now: google.regularOpeningHours?.openNow ?? base.is_open_now,
              attributes: {
                ...enriched.attributes,
                google_review_enriched: true,
                google_place_id: google.id,
                google_maps_uri: googleMapsUri,
                google_reviews_uri: googleReviewsUri,
                photo_provider: enriched.image_url ? (enriched.attributes.photo_provider ?? "outscraper_google_maps") : null,
              },
              details: {
                ...enriched.details,
                google_place_id: google.id,
                google_maps_uri: googleMapsUri,
                google_reviews_uri: googleReviewsUri,
                google_reviews: google.reviews ?? [],
                google_weekday_descriptions: google.regularOpeningHours?.weekdayDescriptions ?? base.details.google_weekday_descriptions ?? [],
                google_photo_name: null,
                google_photo_attributions: [],
                photo_error: enriched.image_url ? null : (enriched.details.photo_error ?? "Geoapify/OSM/Wikimedia не містить фото для цього закладу."),
              },
            };
          }
        } catch (error) {
          console.warn(`[Google review enrichment] ${error instanceof Error ? error.message : String(error)}`);
          enriched = { ...enriched, details: { ...enriched.details, google_enrichment_error: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300) } };
        }
      }
      return withRoute(enriched);
    }
    if (id.startsWith("google_")) {
      const googleId = id.slice("google_".length);
      const result = await this.google.details(googleId);
      return withRoute(this.googlePlaceToStage2(result, originLat, originLng));
    }
    const rows = await this.rawPlaces(undefined, !publicOnly);
    const place = rows.find((row) => row.id === id && (!publicOnly || row.status === "approved"));
    if (!place) throw new NotFoundException("Place not found");
    const distance = Number.isFinite(originLat) && Number.isFinite(originLng) ? Math.round(distanceMeters(Number(originLat), Number(originLng), Number(place.lat), Number(place.lng))) : null;
    return withRoute({ ...place, rating: Number(place.rating), distance_m: distance, is_open_now: isOpenNow(place.work_hours) });
  }

  async profile(user: AuthUser) {
    const result = await this.db.query(
      `SELECT id,telegram_id::text,telegram_username,first_name,last_name,photo_url,selected_language,role,phone,consent,created_at,last_active_at
       FROM users WHERE id=$1`, [user.id],
    );
    return result.rows[0];
  }

  async updateProfile(user: AuthUser, body: Record<string, unknown>) {
    const language = ["uk","en","pl"].includes(String(body.selected_language)) ? String(body.selected_language) : undefined;
    const phone = body.phone === undefined ? undefined : String(body.phone ?? "");
    const consent = body.consent && typeof body.consent === "object" ? body.consent : undefined;
    await this.db.query(
      `UPDATE users SET selected_language=COALESCE($2,selected_language), phone=COALESCE($3,phone), consent=COALESCE($4::jsonb,consent), updated_at=now() WHERE id=$1`,
      [user.id, language ?? null, phone ?? null, consent ? JSON.stringify(consent) : null],
    );
    return this.profile(user);
  }

  async favorites(user: AuthUser) {
    const local = await this.db.query(
      `SELECT p.*,c.name category_name,COALESCE((SELECT json_agg(t.tag ORDER BY t.tag) FROM place_tags t WHERE t.place_id=p.id),'[]'::json)::jsonb AS tags,f.created_at AS favorite_created_at
       FROM favorites f JOIN places p ON p.id=f.place_id JOIN categories c ON c.slug=p.category_slug
       WHERE f.user_id=$1 AND p.status='approved'`, [user.id],
    );
    return local.rows
      .map((row: Record<string, unknown>) => ({
        ...row,
        rating: Number(row.rating ?? 0),
        favorite_created_at: row.favorite_created_at,
      }))
      .sort((a, b) => new Date(String(b.favorite_created_at ?? 0)).getTime() - new Date(String(a.favorite_created_at ?? 0)).getTime())
      .map(({ favorite_created_at: _favoriteCreatedAt, ...place }) => place);
  }

  async addFavorite(user: AuthUser, placeId: string) {
    if (placeId.startsWith("google_") || placeId.startsWith("geoapify_")) {
      throw new BadRequestException("External places are disabled");
    }
    await this.place(placeId);
    await this.db.query("INSERT INTO favorites(user_id,place_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [user.id, placeId]);
    return { ok: true };
  }

  async removeFavorite(user: AuthUser, placeId: string) {
    if (placeId.startsWith("google_") || placeId.startsWith("geoapify_")) await this.db.query("DELETE FROM external_favorites WHERE user_id=$1 AND place_id=$2", [user.id, placeId]);
    else await this.db.query("DELETE FROM favorites WHERE user_id=$1 AND place_id=$2", [user.id, placeId]);
    return { ok: true };
  }

  async addEvent(user: AuthUser | undefined, body: Record<string, unknown>) {
    const eventType = String(body.event_type ?? "").trim();
    if (!eventType) throw new BadRequestException("event_type is required");
    await this.db.query(
      "INSERT INTO activity_events(id,user_id,region_id,place_id,event_type,payload) VALUES($1,$2,$3,$4,$5,$6::jsonb)",
      [makeId("evt"), user?.id ?? null, body.region_id ?? null, body.place_id ?? null, eventType, JSON.stringify(body.payload ?? {})],
    );
    return { ok: true };
  }

  async recentActivity(user: AuthUser) {
    const result = await this.db.query(
      `SELECT e.id,e.event_type,e.region_id,e.place_id,e.payload,e.created_at,p.name place_name,c.name category_name
       FROM activity_events e LEFT JOIN places p ON p.id=e.place_id LEFT JOIN categories c ON c.slug=p.category_slug
       WHERE e.user_id=$1 ORDER BY e.created_at DESC LIMIT 50`,
      [user.id],
    );
    return result.rows;
  }

  async createUserPlaceSubmission(user: AuthUser, body: Record<string, unknown>) {
    const name = String(body.name ?? "").trim();
    if (!name) throw new BadRequestException("Вкажіть назву локації");

    const lat = num(body.lat);
    const lng = num(body.lng);
    if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new BadRequestException("Оберіть місце на мапі або використайте поточну геолокацію");
    }

    let categorySlug = String(body.category_slug ?? "entertainment").trim().toLowerCase();
    const categoryExists = await this.db.query("SELECT slug FROM categories WHERE slug=$1 AND active=true LIMIT 1", [categorySlug]);
    if (!categoryExists.rows[0]) {
      categorySlug = categorySlug === "nature" ? "rest" : categorySlug === "useful" ? "transfer" : "entertainment";
    }

    let address = String(body.address ?? "").trim();
    let city = String(body.city ?? "").trim();
    let regionName = String(body.region_name ?? "").trim();
    try {
      const reverse = await this.geoReverse(lat, lng);
      address ||= reverse.formatted_address || "";
      city ||= reverse.city || "";
      regionName ||= reverse.region || "";
    } catch {
      // Coordinates are sufficient for moderation even when reverse geocoding is temporarily unavailable.
    }
    address ||= `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    const requestedRegion = String(body.region_id ?? "region-tatariv");
    const regionId = await this.ensureRegionForPlace(city, regionName, lat, lng, requestedRegion);
    const rawGallery = Array.isArray(body.gallery) ? body.gallery : [];
    const gallery = rawGallery
      .map((item) => String(item ?? "").trim())
      .filter((item) => item.startsWith("data:image/") || /^https?:\/\//i.test(item))
      .slice(0, 6);
    const imageUrl = gallery[0] || (typeof body.image_url === "string" ? String(body.image_url).trim() : "") || null;
    const placeId = makeId("place");
    const description = String(body.description ?? "").trim().slice(0, 2000);
    const phone = String(body.phone ?? "").trim() || null;
    const website = String(body.website ?? "").trim() || null;
    const subcategory = String(body.subcategory ?? "").trim() || null;
    const details = {
      submission_source: "tourist",
      submitted_at: new Date().toISOString(),
      city,
      region_name: regionName,
      gallery,
      map_selected: true,
    };
    const attributes = { user_submitted: true, partner: false };

    await this.db.query(
      `INSERT INTO places(id,organization_id,region_id,category_slug,subcategory,name,description,address,lat,lng,phone,website,image_url,attributes,details,status,created_by_user_id)
       VALUES($1,NULL,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,'pending',$15)`,
      [placeId, regionId, categorySlug, subcategory, name, description, address, lat, lng, phone, website, imageUrl, JSON.stringify(attributes), JSON.stringify(details), user.id],
    );
    await this.db.query(
      "INSERT INTO activity_events(id,user_id,region_id,place_id,event_type,payload) VALUES($1,$2,$3,$4,'place_submission_created',$5::jsonb)",
      [makeId("evt"), user.id, regionId, placeId, JSON.stringify({ category_slug: categorySlug, name })],
    );
    return { ok: true, id: placeId, status: "pending", name, address, lat, lng, category_slug: categorySlug };
  }

  async emergency(regionId: string) {
    const result = await this.db.query(
      "SELECT id,type,title,note,phone,lat,lng,tone,sort_order FROM emergency_contacts WHERE region_id=$1 AND active=true ORDER BY sort_order,title",
      [regionId],
    );
    return result.rows;
  }

  async emergencyServices(regionId: string, includeInactive = false) {
    const [services, region] = await Promise.all([
      this.db.query(
        `SELECT id,region_id,title,note,tone,icon,sort_order,active,updated_at
         FROM emergency_services
         WHERE region_id=$1 AND deleted_at IS NULL ${includeInactive ? "" : "AND active=true"}
         ORDER BY sort_order,title`,
        [regionId],
      ),
      this.db.query("SELECT emergency_verified_at FROM regions WHERE id=$1", [regionId]),
    ]);
    return {
      services: services.rows,
      verified_at: region.rows[0]?.emergency_verified_at ?? null,
    };
  }

  async pageContent(regionId: string, pageKey: string) {
    const result = await this.db.query<{ content: Record<string, unknown>; updated_at: Date | string }>(
      "SELECT content,updated_at FROM page_content WHERE region_id=$1 AND page_key=$2 LIMIT 1",
      [regionId, pageKey],
    );
    return {
      region_id: regionId,
      page_key: pageKey,
      content: result.rows[0]?.content ?? {},
      updated_at: result.rows[0]?.updated_at ?? null,
    };
  }

  async adminSavePageContent(pageKey: string, body: Record<string, unknown>) {
    const regionId = String(body.region_id ?? "region-tatariv");
    const content = body.content && typeof body.content === "object" && !Array.isArray(body.content)
      ? body.content as Record<string, unknown>
      : {};
    await this.db.query(
      `INSERT INTO page_content(region_id,page_key,content,updated_at)
       VALUES($1,$2,$3::jsonb,now())
       ON CONFLICT(region_id,page_key) DO UPDATE SET content=EXCLUDED.content,updated_at=now()`,
      [regionId, pageKey, JSON.stringify(content)],
    );
    if (pageKey === "emergency") await this.touchEmergencyVerification(regionId);
    return this.pageContent(regionId, pageKey);
  }

  async hotOffers(regionId: string, includeInactive = false) {
    const result = await this.db.query(
      `SELECT o.id,o.region_id,o.place_id,o.category_slug,o.category_label,o.title,o.discount,o.description,o.detail,o.validity,
              o.badge,o.badge_tone,o.image_url,o.valid_from,o.valid_until,o.sort_order,o.active,o.updated_at,
              p.name AS place_name,p.image_url AS place_image_url,p.rating AS place_rating,p.review_count AS place_review_count
       FROM hot_offers o
       LEFT JOIN places p ON p.id=o.place_id
       WHERE o.region_id=$1
         ${includeInactive ? "" : "AND o.active=true AND (o.valid_from IS NULL OR o.valid_from<=now()) AND (o.valid_until IS NULL OR o.valid_until>=now()) AND (o.place_id IS NULL OR p.status='approved')"}
       ORDER BY o.sort_order,o.valid_until NULLS LAST,o.updated_at DESC`,
      [regionId],
    );
    return result.rows.map((row: Record<string, unknown>) => ({
      ...row,
      image_url: row.image_url || row.place_image_url || null,
      place_rating: row.place_rating == null ? null : Number(row.place_rating),
      place_review_count: Number(row.place_review_count ?? 0),
    }));
  }

  async partnerPlaces(user: AuthUser) {
    const result = await this.db.query(
      `SELECT DISTINCT p.*
       FROM places p
       JOIN organizations o ON o.id=p.organization_id
       LEFT JOIN organization_telegram_access a ON a.organization_id=o.id AND a.active=true
       WHERE o.owner_user_id=$1 OR (a.telegram_id::text=$2 AND a.active=true)
       ORDER BY p.updated_at DESC`,
      [user.id, user.telegram_id ?? ""],
    );
    return result.rows;
  }

  async partnerAccessDiagnostic(user: AuthUser, startParam: string) {
    const telegramId = String(user.telegram_id ?? "").trim();
    const result = await this.db.query(
      `SELECT q.id qr_id,q.start_param,q.active,q.type,q.source,q.place_id,
              p.status,p.organization_id,p.name,p.details,o.owner_user_id,
              EXISTS(
                SELECT 1 FROM organization_telegram_access a
                WHERE a.organization_id=p.organization_id AND a.telegram_id::text=$2 AND a.active=true
              ) AS table_allowed,
              EXISTS(
                SELECT 1 FROM jsonb_array_elements_text(COALESCE(p.details->'allowed_telegram_ids','[]'::jsonb)) item(value)
                WHERE item.value=$2
              ) AS details_allowed,
              COALESCE((SELECT json_agg(a.telegram_id::text ORDER BY a.telegram_id) FROM organization_telegram_access a WHERE a.organization_id=p.organization_id AND a.active=true),'[]'::json) table_telegram_ids,
              COALESCE(p.details->'allowed_telegram_ids','[]'::jsonb) details_telegram_ids
       FROM qr_points q
       LEFT JOIN places p ON p.id=q.place_id
       LEFT JOIN organizations o ON o.id=p.organization_id
       WHERE q.start_param=$1
       ORDER BY q.created_at DESC
       LIMIT 1`,
      [startParam, telegramId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const tableIds = row && Array.isArray(row.table_telegram_ids) ? row.table_telegram_ids.map(String) : [];
    const detailIds = row && Array.isArray(row.details_telegram_ids) ? row.details_telegram_ids.map(String) : [];
    const allowedTelegramIds = Array.from(new Set([...tableIds, ...detailIds]));
    const hasTelegramId = /^\d{5,20}$/.test(telegramId);
    let reason = "ok";
    if (!hasTelegramId) reason = "telegram_id_missing";
    else if (!row) reason = "qr_not_found";
    else if (row.active !== true) reason = "qr_inactive";
    else if (row.type !== "partner_access") reason = "qr_wrong_type";
    else if (!row.place_id) reason = "qr_without_place";
    else if (!row.organization_id) reason = "organization_missing";
    const ownerAllowed = row ? String(row.owner_user_id ?? "") === user.id : false;
    const telegramAllowed = row ? row.table_allowed === true || row.details_allowed === true : false;
    const allowed = reason === "ok" && (ownerAllowed || telegramAllowed);
    if (reason === "ok" && !allowed) reason = "telegram_id_not_allowed";
    return {
      ok: allowed,
      reason,
      start_param: startParam,
      session_user_id: user.id,
      telegram_id: telegramId || null,
      telegram_username: user.telegram_username ?? null,
      qr_found: Boolean(row),
      qr_id: row?.qr_id ?? null,
      qr_active: row?.active ?? null,
      qr_type: row?.type ?? null,
      place_id: row?.place_id ?? null,
      place_name: row?.name ?? null,
      place_status: row?.status ?? null,
      organization_id: row?.organization_id ?? null,
      allowed_telegram_ids: allowedTelegramIds,
      access_from_table: row?.table_allowed === true,
      access_from_place_details: row?.details_allowed === true,
      access_as_owner: ownerAllowed,
    };
  }

  async partnerAccess(user: AuthUser, startParam: string) {
    const diagnostic = await this.partnerAccessDiagnostic(user, startParam);
    if (!diagnostic.ok) {
      const reasonText: Record<string, string> = {
        telegram_id_missing: "Telegram не передав ID користувача",
        qr_not_found: "QR не знайдено в базі",
        qr_inactive: "QR вимкнений",
        qr_wrong_type: "цей QR не є QR доступу партнера",
        qr_without_place: "QR не прив'язаний до закладу",
        organization_missing: "для закладу не знайдено організацію",
        telegram_id_not_allowed: "поточний Telegram ID не входить до списку дозволених",
      };
      const allowed = diagnostic.allowed_telegram_ids.length ? diagnostic.allowed_telegram_ids.join(", ") : "список порожній";
      throw new UnauthorizedException(
        `${reasonText[diagnostic.reason] || diagnostic.reason}. Поточний Telegram ID: ${diagnostic.telegram_id || "не визначено"}. Дозволені ID: ${allowed}. start_param: ${startParam}. QR: ${diagnostic.qr_found ? `${diagnostic.qr_type}/${diagnostic.qr_active ? "active" : "inactive"}` : "не знайдено"}.`,
      );
    }
    const telegramId = String(diagnostic.telegram_id ?? "");
    await this.db.transaction(async (client) => {
      await client.query("UPDATE users SET role=CASE WHEN role='tourist' THEN 'partner' ELSE role END,updated_at=now() WHERE id=$1", [user.id]);
      await client.query("UPDATE organizations SET owner_user_id=COALESCE(owner_user_id,$2),updated_at=now() WHERE id=$1", [diagnostic.organization_id, user.id]);
      await client.query(
        `INSERT INTO organization_telegram_access(organization_id,telegram_id,role,active) VALUES($1,$2::bigint,'owner',true)
         ON CONFLICT (organization_id,telegram_id) DO UPDATE SET active=true,role='owner',updated_at=now()`,
        [diagnostic.organization_id, telegramId],
      );
    });
    return { ok: true, place_id: diagnostic.place_id, status: diagnostic.place_status, organization_id: diagnostic.organization_id, name: diagnostic.place_name, start_param: startParam, telegram_id: telegramId };
  }

  async createPartnerPlace(user: AuthUser, body: Record<string, unknown>) {
    const name = String(body.name ?? "").trim();
    if (!name) throw new BadRequestException("name is required");
    const placeType = String(body.subcategory ?? body.place_type ?? "Готель").trim() || "Готель";
    const category = await this.categoryForPlaceType(placeType, "hotel");
    const verifiedAddress = await this.verifiedAddressFromBody(body);
    const lat = verifiedAddress.lat;
    const lng = verifiedAddress.lng;
    const requestedRegion = body.region_id ? String(body.region_id) : "region-tatariv";
    const regionId = await this.ensureRegionForPlace(verifiedAddress.city, verifiedAddress.region, lat, lng, requestedRegion);
    const organizationId = makeId("org");
    const placeId = makeId("place");

    await this.db.transaction(async (client) => {
      await client.query(
        "INSERT INTO organizations(id,owner_user_id,region_id,name,status) VALUES($1,$2,$3,$4,'pending')",
        [organizationId, user.id, regionId, String(body.organization_name ?? name)],
      );
      await client.query(
        `INSERT INTO places(id,organization_id,region_id,category_slug,subcategory,name,description,address,lat,lng,phone,telegram,website,image_url,price_level,work_hours,attributes,details,status,created_by_user_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18::jsonb,'pending',$19)`,
        [placeId, organizationId, regionId, category, placeType, name, body.description ?? "", verifiedAddress.formatted_address || body.address || "", lat, lng, body.phone ?? null, body.telegram ?? null, body.website ?? null, body.image_url ?? null, num(body.price_level), JSON.stringify(body.work_hours ?? {}), JSON.stringify(body.attributes ?? {}), JSON.stringify(body.details ?? {}), user.id],
      );
      await client.query("UPDATE users SET role=CASE WHEN role='tourist' THEN 'partner' ELSE role END, updated_at=now() WHERE id=$1", [user.id]);
    });
    return this.place(placeId, false);
  }

  async updatePartnerPlace(user: AuthUser, placeId: string, body: Record<string, unknown>) {
    const owned = await this.db.query(
      `SELECT p.id FROM places p JOIN organizations o ON o.id=p.organization_id
       LEFT JOIN organization_telegram_access a ON a.organization_id=o.id AND a.active=true
       WHERE p.id=$1 AND (o.owner_user_id=$2 OR (a.telegram_id::text=$3 AND a.active=true)) LIMIT 1`,
      [placeId, user.id, user.telegram_id ?? ""],
    );
    if (!owned.rows[0]) throw new NotFoundException("Partner place not found");
    const current = await this.place(placeId, false) as PlaceRow;
    const nextLat = num(body.lat, Number(current.lat))!;
    const nextLng = num(body.lng, Number(current.lng))!;
    const nextRegionId = await this.ensureRegionForPlace(String(body.city ?? ""), String(body.region_name ?? ""), nextLat, nextLng, current.region_id);
    const nextPlaceType = String(body.subcategory ?? current.subcategory ?? "Готель").trim() || "Готель";
    const nextCategory = await this.categoryForPlaceType(nextPlaceType, current.category_slug);
    await this.db.query(
      `UPDATE places SET region_id=$2,category_slug=$3,subcategory=$4,name=$5,description=$6,address=$7,lat=$8,lng=$9,phone=$10,telegram=$11,website=$12,image_url=$13,
       price_level=$14,work_hours=$15::jsonb,attributes=$16::jsonb,details=$17::jsonb,status=CASE WHEN status='approved' THEN 'approved' ELSE 'pending' END,updated_at=now() WHERE id=$1`,
      [placeId, nextRegionId, nextCategory, nextPlaceType, body.name ?? current.name, body.description ?? current.description, body.address ?? current.address, nextLat, nextLng, body.phone ?? current.phone, body.telegram ?? current.telegram, body.website ?? current.website, body.image_url ?? current.image_url, num(body.price_level, current.price_level ?? undefined) ?? null, JSON.stringify(body.work_hours ?? current.work_hours ?? {}), JSON.stringify(body.attributes ?? current.attributes ?? {}), JSON.stringify(body.details ?? current.details ?? {})],
    );
    return this.place(placeId, false);
  }

  async adminPartners() {
    const result = await this.db.query(
      `SELECT p.id,p.name,p.category_slug,p.subcategory,p.address,p.status,p.region_id,p.lat,p.lng,r.name region_name,o.name organization_name,
              COALESCE((SELECT json_agg(a.telegram_id::text ORDER BY a.telegram_id) FROM organization_telegram_access a WHERE a.organization_id=o.id AND a.active=true),'[]'::json) telegram_ids,
              (SELECT q.start_param FROM qr_points q WHERE q.place_id=p.id AND q.type='partner_access' AND q.active=true ORDER BY q.created_at DESC LIMIT 1) partner_start_param
       FROM places p JOIN organizations o ON o.id=p.organization_id JOIN regions r ON r.id=p.region_id
       ORDER BY p.updated_at DESC`,
    );
    return result.rows;
  }

  async adminPartner(placeId: string) {
    const result = await this.db.query(
      `SELECT p.*,r.name region_name,o.name organization_name,o.status organization_status,o.owner_user_id,
              COALESCE((SELECT json_agg(a.telegram_id::text ORDER BY a.telegram_id) FROM organization_telegram_access a WHERE a.organization_id=o.id AND a.active=true),'[]'::json) telegram_ids,
              (SELECT q.start_param FROM qr_points q WHERE q.place_id=p.id AND q.type='partner_access' AND q.active=true ORDER BY q.created_at DESC LIMIT 1) partner_start_param,
              COALESCE((SELECT COUNT(*)::int FROM activity_events e WHERE e.place_id=p.id AND e.event_type='place_viewed'),0) views,
              COALESCE((SELECT COUNT(*)::int FROM activity_events e WHERE e.place_id=p.id AND e.event_type='qr_scanned'),0) qr_scans,
              COALESCE((SELECT COUNT(*)::int FROM activity_events e WHERE e.place_id=p.id AND e.event_type='route_clicked'),0) route_clicks,
              COALESCE((SELECT COUNT(*)::int FROM activity_events e WHERE e.place_id=p.id AND e.event_type='call_clicked'),0) call_clicks
       FROM places p JOIN regions r ON r.id=p.region_id LEFT JOIN organizations o ON o.id=p.organization_id
       WHERE p.id=$1 LIMIT 1`,
      [placeId],
    );
    if (!result.rows[0]) throw new NotFoundException("Partner not found");
    return result.rows[0];
  }

  async adminUpdatePartner(placeId: string, body: Record<string, unknown>) {
    const current = await this.adminPartner(placeId) as Record<string, any>;
    const organizationId = String(current.organization_id ?? "");
    if (!organizationId) throw new BadRequestException("Partner organization is missing");

    const categorySlug = String(body.category_slug ?? current.category_slug ?? "").trim();
    const category = await this.db.query("SELECT slug FROM categories WHERE slug=$1 AND active=true LIMIT 1", [categorySlug]);
    if (!category.rows[0]) throw new BadRequestException("Невідома категорія");

    const telegramIds = body.telegram_ids === undefined ? (Array.isArray(current.telegram_ids) ? current.telegram_ids.map(String) : []) : parseTelegramIds(body.telegram_ids);
    if (!telegramIds.length) throw new BadRequestException("Вкажіть хоча б один числовий Telegram ID");

    const currentDetails = current.details && typeof current.details === "object" ? current.details as Record<string, unknown> : {};
    const currentAttributes = current.attributes && typeof current.attributes === "object" ? current.attributes as Record<string, unknown> : {};
    const detailsInput = body.details && typeof body.details === "object" ? body.details as Record<string, unknown> : {};
    const attributesInput = body.attributes && typeof body.attributes === "object" ? body.attributes as Record<string, unknown> : {};

    let address = String(body.address ?? current.address ?? "").trim();
    let city = String(body.city ?? detailsInput.city ?? currentDetails.city ?? "").trim();
    let regionName = String(body.region_name ?? detailsInput.region_name ?? currentDetails.region_name ?? current.region_name ?? "").trim();
    let lat = num(body.lat, Number(current.lat));
    let lng = num(body.lng, Number(current.lng));
    const mapSelected = body.map_selected === true;
    const ids = detailsInput.geo_place_ids && typeof detailsInput.geo_place_ids === "object" ? detailsInput.geo_place_ids as Record<string, unknown> : {};
    const canVerify = detailsInput.address_verified === true && String(ids.city ?? "") && String(ids.street ?? "") && String(ids.house ?? "");
    if (!mapSelected && canVerify) {
      const verified = await this.verifiedAddressFromBody({ ...body, details: detailsInput });
      address = verified.formatted_address || address;
      city = verified.city || city;
      regionName = verified.region || regionName;
      lat = verified.lat;
      lng = verified.lng;
    }
    if (lat == null || lng == null || !address) throw new BadRequestException("Вкажіть коректну адресу або точку на мапі");
    const regionId = await this.ensureRegionForPlace(city, regionName, lat, lng, String(body.region_id ?? current.region_id));

    const details = { ...currentDetails, ...detailsInput, city, region_name: regionName, allowed_telegram_ids: telegramIds };
    const attributes = { ...currentAttributes, ...attributesInput };
    const workHours = body.work_hours && typeof body.work_hours === "object" ? body.work_hours : current.work_hours ?? {};
    const name = String(body.name ?? current.name ?? "").trim();
    if (!name) throw new BadRequestException("Вкажіть назву партнера");

    await this.db.transaction(async (client) => {
      await client.query("UPDATE organizations SET region_id=$2,name=$3,updated_at=now() WHERE id=$1", [organizationId, regionId, name]);
      await client.query(
        `UPDATE places SET region_id=$2,category_slug=$3,subcategory=$4,name=$5,description=$6,address=$7,lat=$8,lng=$9,phone=$10,image_url=$11,
         work_hours=$12::jsonb,attributes=$13::jsonb,details=$14::jsonb,updated_at=now() WHERE id=$1`,
        [placeId, regionId, categorySlug, body.subcategory ?? current.subcategory ?? null, name, String(body.description ?? current.description ?? ""), address, lat, lng,
         body.phone === undefined ? current.phone : body.phone || null, body.image_url === undefined ? current.image_url : body.image_url || null,
         JSON.stringify(workHours), JSON.stringify(attributes), JSON.stringify(details)],
      );
      await client.query("UPDATE organization_telegram_access SET active=false,updated_at=now() WHERE organization_id=$1", [organizationId]);
      for (const telegramId of telegramIds) {
        await client.query(
          `INSERT INTO organization_telegram_access(organization_id,telegram_id,role,active) VALUES($1,$2,'owner',true)
           ON CONFLICT (organization_id,telegram_id) DO UPDATE SET active=true,role='owner',updated_at=now()`,
          [organizationId, telegramId],
        );
      }
    });
    return this.adminPartner(placeId);
  }

  async adminCreatePartner(body: Record<string, unknown>) {
    const name = String(body.name ?? "").trim();
    const categorySlug = String(body.category_slug ?? "").trim();
    const telegramIds = parseTelegramIds(body.telegram_ids);
    if (!name) throw new BadRequestException("Вкажіть назву партнера");
    if (!categorySlug) throw new BadRequestException("Оберіть категорію");
    if (!telegramIds.length) throw new BadRequestException("Вкажіть хоча б один числовий Telegram ID");
    const category = await this.db.query("SELECT slug FROM categories WHERE slug=$1 AND active=true LIMIT 1", [categorySlug]);
    if (!category.rows[0]) throw new BadRequestException("Невідома категорія");

    const detailsInput = body.details && typeof body.details === "object" ? body.details as Record<string, unknown> : {};
    let address = String(body.address ?? "").trim();
    let city = String(body.city ?? "").trim();
    let regionName = String(body.region_name ?? "").trim();
    let lat = num(body.lat);
    let lng = num(body.lng);
    const mapSelected = body.map_selected === true;
    if (!mapSelected) {
      const verified = await this.verifiedAddressFromBody(body);
      address = verified.formatted_address || address;
      city = verified.city || city;
      regionName = verified.region || regionName;
      lat = verified.lat;
      lng = verified.lng;
    } else if (lat == null || lng == null || !address) {
      throw new BadRequestException("Оберіть адресу з Google або вкажіть точку на мапі");
    }

    const regionId = await this.ensureRegionForPlace(city, regionName, lat!, lng!, String(body.region_id ?? "region-tatariv"));
    const organizationId = makeId("org");
    const placeId = makeId("place");
    const qrId = makeId("qr");
    const startParam = `partner-${makeId("").replaceAll("-", "").slice(0, 32)}`;
    const publish = body.publish === true;
    const status = publish ? "approved" : "draft";
    const workHours = body.work_hours && typeof body.work_hours === "object" ? body.work_hours : {};
    const attributes = body.attributes && typeof body.attributes === "object" ? body.attributes as Record<string, unknown> : {};
    const details = {
      ...detailsInput,
      admin_created: true,
      partner_invite_start_param: startParam,
      allowed_telegram_ids: telegramIds,
    };

    await this.db.transaction(async (client) => {
      await client.query(
        "INSERT INTO organizations(id,region_id,name,status) VALUES($1,$2,$3,$4)",
        [organizationId, regionId, name, publish ? "approved" : "invited"],
      );
      await client.query(
        `INSERT INTO places(id,organization_id,region_id,category_slug,subcategory,name,description,address,lat,lng,phone,image_url,work_hours,attributes,details,status,approved_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::jsonb,$16,CASE WHEN $16='approved' THEN now() ELSE NULL END)`,
        [placeId, organizationId, regionId, categorySlug, body.subcategory ?? null, name, String(body.description ?? ""), address, lat, lng, body.phone ?? null, body.image_url ?? null, JSON.stringify(workHours), JSON.stringify({ ...attributes, partner: true, placement_type: body.placement_type ?? "social", rate_percent: num(body.rate_percent, 0) ?? 0 }), JSON.stringify(details), status],
      );
      for (const telegramId of telegramIds) {
        await client.query(
          `INSERT INTO organization_telegram_access(organization_id,telegram_id,role,active) VALUES($1,$2,'owner',true)
           ON CONFLICT (organization_id,telegram_id) DO UPDATE SET active=true,updated_at=now()`,
          [organizationId, telegramId],
        );
      }
      await client.query(
        `INSERT INTO qr_points(id,start_param,type,source,region_id,place_id,active) VALUES($1,$2,'partner_access','admin_partner',$3,$4,true)`,
        [qrId, startParam, regionId, placeId],
      );
    });
    return { ok: true, organization_id: organizationId, place_id: placeId, status, start_param: startParam, telegram_ids: telegramIds };
  }

  async adminRegions() {
    const result = await this.db.query(
      `SELECT id,slug,name,name_en,name_pl,center_lat,center_lng,active
       FROM regions WHERE active=true ORDER BY name`,
    );
    return result.rows;
  }

  async adminPlaces(status = "approved") {
    const allowed = ["approved", "pending", "rejected", "draft", "all"];
    const resolved = allowed.includes(status) ? status : "approved";
    const result = await this.db.query(
      `SELECT p.id,p.name,p.category_slug,p.subcategory,p.address,p.status,p.region_id,p.lat,p.lng,r.name region_name,o.name organization_name
       FROM places p JOIN regions r ON r.id=p.region_id LEFT JOIN organizations o ON o.id=p.organization_id
       WHERE ($1='all' OR p.status=$1) ORDER BY r.name,p.name`,
      [resolved],
    );
    return result.rows;
  }

  async adminUpdateRegion(regionId: string, body: Record<string, unknown>) {
    const communityUrl = body.community_url === undefined ? undefined : String(body.community_url ?? "").trim() || null;
    const result = await this.db.query(
      `UPDATE regions SET community_url=COALESCE($2,community_url),updated_at=now() WHERE id=$1
       RETURNING id,name,community_url`,
      [regionId, communityUrl ?? null],
    );
    if (!result.rows[0]) throw new NotFoundException("Region not found");
    return result.rows[0];
  }

  async adminPending() {
    const result = await this.db.query(
      `SELECT p.id,p.name,p.category_slug,p.subcategory,p.description,p.address,p.lat,p.lng,p.phone,p.website,p.image_url,
              p.attributes,p.details,p.status,p.moderation_comment,p.created_by_user_id,p.created_at,p.updated_at,
              o.name organization_name,u.telegram_id,u.telegram_username,u.first_name,u.last_name,r.name region_name
       FROM places p LEFT JOIN organizations o ON o.id=p.organization_id LEFT JOIN users u ON u.id=COALESCE(o.owner_user_id,p.created_by_user_id) JOIN regions r ON r.id=p.region_id
       WHERE p.status IN ('draft','pending','rejected') ORDER BY p.updated_at DESC`,
    );
    return result.rows;
  }

  async adminStatus(placeId: string, status: string, comment?: string, categorySlug?: string) {
    if (!["approved","rejected","pending","draft"].includes(status)) throw new BadRequestException("Invalid status");
    const cleanCategory = String(categorySlug ?? "").trim();
    if (cleanCategory) {
      const category = await this.db.query("SELECT slug FROM categories WHERE slug=$1 AND active=true LIMIT 1", [cleanCategory]);
      if (!category.rows[0]) throw new BadRequestException("Invalid category_slug");
    }
    const result = await this.db.query(
      `UPDATE places SET status=$2,moderation_comment=$3,category_slug=COALESCE($4,category_slug),approved_at=CASE WHEN $2='approved' THEN now() ELSE approved_at END,updated_at=now() WHERE id=$1 RETURNING id,name,status,category_slug,moderation_comment,organization_id`,
      [placeId, status, comment ?? null, cleanCategory || null],
    );
    if (!result.rows[0]) throw new NotFoundException("Place not found");
    if (result.rows[0].organization_id) {
      await this.db.query("UPDATE organizations SET status=$2,updated_at=now() WHERE id=$1", [result.rows[0].organization_id, status === "approved" ? "approved" : status]);
    }
    return result.rows[0];
  }

  async adminCreateQr(body: Record<string, unknown>) {
    const placeId = body.place_id ? String(body.place_id) : null;
    let regionId = String(body.region_id ?? "region-tatariv");
    if (placeId) {
      const place = await this.place(placeId);
      regionId = String((place as { region_id?: string }).region_id || regionId);
    }
    const startParam = String(body.start_param ?? makeId("qr").replaceAll("-", "").slice(0, 48)).trim();
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(startParam)) throw new BadRequestException("start_param must contain only A-Z, a-z, 0-9, _ or - and be up to 64 characters");
    const id = makeId("qr");
    await this.db.query(
      `INSERT INTO qr_points(id,start_param,type,source,region_id,place_id,campaign_id,ambassador_id,active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,true)`,
      [id, startParam, body.type ?? "entry_point", body.source ?? "hotel", regionId, placeId, body.campaign_id ?? null, body.ambassador_id ?? null],
    );
    return { id, start_param: startParam, region_id: regionId, place_id: placeId, active: true };
  }

  async adminQrList() {
    const result = await this.db.query(
      `SELECT q.id,q.start_param,q.type,q.source,q.active,q.created_at,r.name region_name,p.name place_name,p.id place_id
       FROM qr_points q JOIN regions r ON r.id=q.region_id LEFT JOIN places p ON p.id=q.place_id ORDER BY q.created_at DESC`,
    );
    return result.rows;
  }

  async adminToggleQr(id: string, active: boolean) {
    const result = await this.db.query("UPDATE qr_points SET active=$2,updated_at=now() WHERE id=$1 RETURNING id,start_param,active", [id, active]);
    if (!result.rows[0]) throw new NotFoundException("QR point not found");
    return result.rows[0];
  }

  async adminDeleteQr(id: string) {
    const result = await this.db.query("DELETE FROM qr_points WHERE id=$1 RETURNING id,start_param,type,place_id", [id]);
    if (!result.rows[0]) throw new NotFoundException("QR point not found");
    return { ok: true, ...result.rows[0] };
  }

  async adminSaveTemplate(body: Record<string, unknown>) {
    const categorySlug = String(body.category_slug ?? "").trim();
    const placeType = String(body.place_type ?? "").trim();
    const label = String(body.label ?? placeType).trim();
    if (!categorySlug || !placeType || !label) throw new BadRequestException("category_slug, place_type and label are required");
    const id = String(body.id ?? makeId("tpl"));
    const defaultTitle = String(body.default_title ?? "").trim() || null;
    const defaultDescription = String(body.default_description ?? "").trim() || null;
    await this.db.query(
      `INSERT INTO place_type_templates(id,category_slug,place_type,label,default_title,default_description,default_services,default_amenities,fields,sort_order,active)
       VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,true)
       ON CONFLICT (category_slug,place_type) DO UPDATE SET label=EXCLUDED.label,default_title=EXCLUDED.default_title,default_description=EXCLUDED.default_description,default_services=EXCLUDED.default_services,default_amenities=EXCLUDED.default_amenities,fields=EXCLUDED.fields,sort_order=EXCLUDED.sort_order,active=true,updated_at=now()`,
      [id,categorySlug,placeType,label,defaultTitle,defaultDescription,JSON.stringify(body.default_services ?? []),JSON.stringify(body.default_amenities ?? []),JSON.stringify(body.fields ?? {}),num(body.sort_order,100)],
    );
    return { ok: true, id, category_slug: categorySlug, place_type: placeType };
  }

  async adminCreateCategory(body: Record<string, unknown>) {
    const slug = String(body.slug ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    if (!slug || !name) throw new BadRequestException("slug and name are required");
    const subcategories = Array.isArray(body.subcategories)
      ? body.subcategories.map((item) => String(item ?? "").trim()).filter(Boolean)
      : [];
    const hasFilterConfig = Boolean(body.filter_config && typeof body.filter_config === "object" && !Array.isArray(body.filter_config));
    await this.db.query(
      `INSERT INTO categories(slug,name,name_en,name_pl,sort_order,subcategories,filter_config) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)
       ON CONFLICT (slug) DO UPDATE SET
         name=EXCLUDED.name,
         name_en=EXCLUDED.name_en,
         name_pl=EXCLUDED.name_pl,
         subcategories=EXCLUDED.subcategories,
         filter_config=CASE WHEN $8::boolean THEN EXCLUDED.filter_config ELSE categories.filter_config END,
         updated_at=now()`,
      [slug,name,body.name_en ?? null,body.name_pl ?? null,num(body.sort_order,100),JSON.stringify(subcategories),JSON.stringify(hasFilterConfig ? body.filter_config : {}),hasFilterConfig],
    );
    const saved = await this.db.query(
      "SELECT slug,name,name_en,name_pl,sort_order,subcategories,filter_config FROM categories WHERE slug=$1 LIMIT 1",
      [slug],
    );
    return saved.rows[0] ?? { ok: true, slug };
  }

  private async touchEmergencyVerification(regionId: string) {
    await this.db.query("UPDATE regions SET emergency_verified_at=now(),updated_at=now() WHERE id=$1", [regionId]);
  }

  async adminEmergency(body: Record<string, unknown>) {
    const id = body.id ? String(body.id) : makeId("em");
    const regionId = String(body.region_id ?? "region-tatariv");
    const title = String(body.title ?? "").trim();
    if (!title) throw new BadRequestException("title is required");
    await this.db.query(
      `INSERT INTO emergency_contacts(id,region_id,type,title,note,phone,lat,lng,tone,sort_order,active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
       ON CONFLICT (id) DO UPDATE SET type=EXCLUDED.type,title=EXCLUDED.title,note=EXCLUDED.note,phone=EXCLUDED.phone,lat=EXCLUDED.lat,lng=EXCLUDED.lng,tone=EXCLUDED.tone,sort_order=EXCLUDED.sort_order,active=true,updated_at=now()`,
      [id,regionId,body.type ?? "custom",title,body.note ?? "",body.phone ?? null,num(body.lat),num(body.lng),body.tone ?? "green",num(body.sort_order,100)],
    );
    await this.touchEmergencyVerification(regionId);
    return { ok: true, id };
  }

  async adminDeleteEmergency(id: string) {
    const result = await this.db.query("UPDATE emergency_contacts SET active=false,updated_at=now() WHERE id=$1 RETURNING id,region_id", [id]);
    if (!result.rows[0]) throw new NotFoundException("Emergency contact not found");
    await this.touchEmergencyVerification(String(result.rows[0].region_id));
    return { ok: true, id };
  }

  async adminEmergencyService(body: Record<string, unknown>) {
    const id = body.id ? String(body.id) : makeId("service");
    const regionId = String(body.region_id ?? "region-tatariv");
    const title = String(body.title ?? "").trim();
    if (!title) throw new BadRequestException("title is required");
    const active = body.active === undefined ? true : (body.active === true || String(body.active) === "true");
    await this.db.query(
      `INSERT INTO emergency_services(id,region_id,title,note,tone,icon,sort_order,active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET region_id=EXCLUDED.region_id,title=EXCLUDED.title,note=EXCLUDED.note,tone=EXCLUDED.tone,icon=EXCLUDED.icon,sort_order=EXCLUDED.sort_order,active=EXCLUDED.active,deleted_at=NULL,updated_at=now()`,
      [id,regionId,title,String(body.note ?? ""),String(body.tone ?? "green"),String(body.icon ?? "custom"),num(body.sort_order,100),active],
    );
    await this.touchEmergencyVerification(regionId);
    return { ok: true, id };
  }

  async adminDeleteEmergencyService(id: string) {
    const result = await this.db.query("UPDATE emergency_services SET active=false,deleted_at=now(),updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING id,region_id", [id]);
    if (!result.rows[0]) throw new NotFoundException("Emergency service not found");
    await this.touchEmergencyVerification(String(result.rows[0].region_id));
    return { ok: true, id };
  }

  async adminSaveHotOffer(body: Record<string, unknown>) {
    const id = body.id ? String(body.id) : makeId("offer");
    const regionId = String(body.region_id ?? "region-tatariv");
    const title = String(body.title ?? "").trim();
    if (!title) throw new BadRequestException("title is required");
    const placeId = String(body.place_id ?? "").trim() || null;
    if (placeId) {
      const place = await this.db.query("SELECT id FROM places WHERE id=$1 AND region_id=$2 LIMIT 1", [placeId, regionId]);
      if (!place.rows[0]) throw new BadRequestException("place_id does not belong to the selected region");
    }
    const active = body.active === undefined ? true : (body.active === true || String(body.active) === "true");
    const dateValue = (value: unknown) => {
      const clean = String(value ?? "").trim();
      return clean ? clean : null;
    };
    await this.db.query(
      `INSERT INTO hot_offers(id,region_id,place_id,category_slug,category_label,title,discount,description,detail,validity,badge,badge_tone,image_url,valid_from,valid_until,sort_order,active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::timestamptz,$15::timestamptz,$16,$17)
       ON CONFLICT (id) DO UPDATE SET region_id=EXCLUDED.region_id,place_id=EXCLUDED.place_id,category_slug=EXCLUDED.category_slug,category_label=EXCLUDED.category_label,title=EXCLUDED.title,discount=EXCLUDED.discount,description=EXCLUDED.description,detail=EXCLUDED.detail,validity=EXCLUDED.validity,badge=EXCLUDED.badge,badge_tone=EXCLUDED.badge_tone,image_url=EXCLUDED.image_url,valid_from=EXCLUDED.valid_from,valid_until=EXCLUDED.valid_until,sort_order=EXCLUDED.sort_order,active=EXCLUDED.active,updated_at=now()`,
      [id,regionId,placeId,String(body.category_slug ?? ""),String(body.category_label ?? ""),title,String(body.discount ?? ""),String(body.description ?? ""),String(body.detail ?? ""),String(body.validity ?? ""),String(body.badge ?? ""),String(body.badge_tone ?? "green"),String(body.image_url ?? "").trim() || null,dateValue(body.valid_from),dateValue(body.valid_until),num(body.sort_order,100),active],
    );
    const saved = (await this.hotOffers(regionId, true)).find((offer: Record<string, unknown>) => String(offer.id) === id);
    return saved ?? { ok: true, id };
  }

  async adminDeleteHotOffer(id: string) {
    const result = await this.db.query("UPDATE hot_offers SET active=false,updated_at=now() WHERE id=$1 RETURNING id", [id]);
    if (!result.rows[0]) throw new NotFoundException("Hot offer not found");
    return { ok: true, id };
  }

}
