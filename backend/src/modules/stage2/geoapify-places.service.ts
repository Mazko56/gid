import { BadGatewayException, Injectable, NotFoundException } from "@nestjs/common";

export type GeoapifyPlace = {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  categories: string[];
  distance?: number;
  website?: string | null;
  phone?: string | null;
  openingHours?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  internetAccess?: boolean | null;
  wheelchair?: boolean | string | null;
  parking?: Record<string, unknown> | null;
  raw?: Record<string, unknown>;
};

export type GeoapifyRouteMetric = { id: string; distance_m: number; walking_duration_s: number };

type GeoapifyFeature = {
  properties?: Record<string, unknown>;
  geometry?: { coordinates?: unknown };
};

type GeoapifyFeatureCollection = { features?: GeoapifyFeature[] };

type GeoapifyRoutingResponse = {
  results?: Array<{ distance?: number; time?: number }>;
  features?: Array<{ properties?: { distance?: number; time?: number } }>;
};

const SECTION_CATEGORIES: Record<string, string[]> = {
  all: [
    "catering", "commercial", "accommodation", "entertainment", "tourism", "leisure", "sport",
    "public_transport", "service", "healthcare", "natural", "parking",
  ],
  food: ["catering"],
  shop: ["commercial"],
  rest: ["leisure.spa", "sport.swimming_pool", "service.travel_agency", "tourism", "accommodation"],
  entertainment: ["entertainment", "activity", "sport", "tourism.attraction"],
  transfer: ["public_transport", "service.taxi", "service.vehicle", "parking", "commercial.vehicle"],
  nature: ["natural", "national_park", "leisure.park", "tourism.attraction.viewpoint", "waterway"],
  interesting: ["tourism", "heritage", "religion", "entertainment.museum", "activity.events_venue"],
  useful: ["healthcare", "service.post", "service.police", "service.financial", "commercial.health_and_beauty.pharmacy", "parking"],
  routes: ["natural", "tourism", "sport", "highway.path", "highway.footway", "highway.cycleway"],
};

const SUBCATEGORY_CATEGORIES: Record<string, string[]> = {
  "Українська кухня": ["catering.restaurant.ukrainian", "catering.restaurant.regional"],
  "Неукраїнська кухня": ["catering.restaurant"],
  "Фаст фуд": ["catering.fast_food"],
  "Кавʼярні": ["catering.cafe", "catering.cafe.coffee", "catering.cafe.coffee_shop"],
  "Ресторани": ["catering.restaurant"],
  "Кафе": ["catering.cafe"],
  "Бари": ["catering.bar", "catering.pub"],
  "Піцерії": ["catering.restaurant.pizza", "catering.fast_food.pizza"],
  "Кондитерські": ["commercial.food_and_drink.confectionery", "catering.cafe.cake", "catering.cafe.dessert"],
  "Фастфуд": ["catering.fast_food"],
  "Їжа з собою": ["catering.fast_food", "commercial.food_and_drink.deli"],
  "Традиційна кухня": ["catering.restaurant.ukrainian", "catering.restaurant.regional"],
  "Продовольчі": ["commercial.supermarket", "commercial.convenience", "commercial.food_and_drink", "commercial.marketplace"],
  "Промтовари": ["commercial"],
  "Продукти": ["commercial.supermarket", "commercial.convenience", "commercial.food_and_drink", "commercial.marketplace"],
  "Сувеніри": ["commercial.gift_and_souvenir"],
  "Одяг і взуття": ["commercial.clothing", "commercial.clothing.shoes"],
  "Товари для дому": ["commercial.furniture_and_interior", "commercial.houseware_and_hardware"],
  "Аптеки": ["commercial.health_and_beauty.pharmacy", "healthcare.pharmacy"],
  "Техніка": ["commercial.elektronics"],
  "Будівництво": ["commercial.houseware_and_hardware.building_materials", "commercial.houseware_and_hardware.hardware_and_tools"],
  "Косметика": ["commercial.health_and_beauty.cosmetics"],
  "Чани": ["leisure.spa", "leisure.spa.public_bath", "leisure.spa.sauna"],
  "Сауни": ["leisure.spa.sauna", "leisure.spa"],
  "Басейни": ["sport.swimming_pool", "leisure.spa"],
  "Масаж": ["leisure.spa"],
  "Походи": ["natural", "tourism", "highway.path", "highway.footway"],
  "Гори": ["natural.mountain", "natural.mountain.peak", "natural.mountain.hill"],
  "Річки": ["natural.water.river_system", "waterway.river_system"],
  "Водоспади": ["natural.water", "tourism.attraction"],
  "Джерела": ["natural.water.spring"],
  "Озера": ["natural.water"],
  "Оглядові точки": ["tourism.attraction.viewpoint"],
  "Печери": ["natural.mountain.cave_entrance"],
  "Ліси": ["natural.forest", "natural.protected_area", "leisure.park.nature_reserve"],
  "Пам’ятки": ["tourism.sights", "tourism.attraction", "heritage"],
  "Музеї": ["entertainment.museum"],
  "Храми": ["tourism.sights.place_of_worship", "religion.place_of_worship"],
  "Архітектура": ["tourism.sights.building", "tourism.sights.castle", "heritage"],
  "Історичні місця": ["tourism.sights", "heritage"],
  "Скульптури": ["tourism.attraction.artwork.sculpture", "tourism.attraction.artwork.statue", "tourism.sights.memorial.monument"],
  "Події": ["activity.events_venue", "entertainment.culture"],
  "Активний відпочинок": ["sport", "activity", "entertainment.activity_park", "natural"],
  "Атракціони": ["entertainment.theme_park", "entertainment.activity_park", "entertainment.amusement_arcade"],
  "Екскурсії": ["service.travel_agency", "tourism"],
  "SPA і басейни": ["leisure.spa", "sport.swimming_pool"],
  "Риболовля": ["sport.fishing", "commercial.outdoor_and_sport.fishing"],
  "Верхова їзда": ["sport.horse_riding"],
  "Квадроцикли": ["activity", "sport"],
  "Польоти": ["airport.gliding", "activity"],
  "Автобусні зупинки": ["public_transport.bus", "public_transport.platform"],
  "Залізничні станції": ["public_transport.train"],
  "Автостанції": ["public_transport.bus", "public_transport"],
  "Таксі": ["service.taxi"],
  "Парковки": ["parking", "parking.cars"],
  "Оренда авто": ["commercial.vehicle", "service.vehicle"],
  "Заправки": ["service.vehicle.fuel"],
  "Зарядні станції": ["service.vehicle.charging_station"],
  "Банкомати": ["service.financial", "service.financial.atm"],
  "Обмін валют": ["service.financial"],
  "Пошта": ["service.post", "service.post.office"],
  "Лікарні": ["healthcare.hospital", "healthcare.clinic_or_praxis"],
  "Туалети": ["amenity.toilet", "building.toilet"],
  "Wi‑Fi": ["service", "catering", "accommodation"],
  "Поліція": ["service.police"],
  "Інформаційні центри": ["tourism.information", "tourism.information.office"],
  "Піші маршрути": ["highway.path", "highway.footway", "natural", "tourism"],
  "Веломаршрути": ["highway.cycleway", "sport", "natural"],
  "Автомаршрути": ["tourism", "natural"],
  "Верхові маршрути": ["sport.horse_riding", "natural"],
  "Водні маршрути": ["waterway", "natural.water", "sport"],
  "Популярні маршрути": ["tourism", "natural"],
  "Складні маршрути": ["natural.mountain", "highway.path"],
  "Маршрути вихідного дня": ["tourism", "natural", "leisure.park"],
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}


function commonsImageUrl(value: unknown) {
  const raw = asString(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const file = raw.replace(/^wikimedia_commons\s*[:=]\s*/i, "").replace(/^File:/i, "").trim();
  if (!file || /^Category:/i.test(raw)) return "";
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}`;
}

function wikipediaRef(value: unknown) {
  const raw = asString(value);
  if (!raw) return null;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      const lang = url.hostname.split(".")[0] || "uk";
      const marker = "/wiki/";
      const idx = url.pathname.indexOf(marker);
      const title = idx >= 0 ? decodeURIComponent(url.pathname.slice(idx + marker.length)) : "";
      return title ? { lang, title } : null;
    }
  } catch {}
  const match = raw.match(/^([a-z]{2,3}):(.*)$/i);
  if (match) return { lang: match[1].toLowerCase(), title: match[2].trim() };
  return { lang: "uk", title: raw };
}

function straightDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => value * Math.PI / 180;
  const earth = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * earth * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function offsetPoint(lat: number, lng: number, eastMeters: number, northMeters: number) {
  const latDelta = northMeters / 111320;
  const lngScale = Math.max(0.2, Math.cos(lat * Math.PI / 180));
  const lngDelta = eastMeters / (111320 * lngScale);
  return { lat: lat + latDelta, lng: lng + lngDelta };
}

@Injectable()
export class GeoapifyPlacesService {
  private readonly nearbyCache = new Map<string, { value: GeoapifyPlace[]; expiresAt: number }>();
  private readonly detailsCache = new Map<string, { value: GeoapifyPlace; expiresAt: number }>();
  private readonly routeCache = new Map<string, { value: GeoapifyRouteMetric; expiresAt: number }>();
  private readonly nearbyCacheTtlMs = 10 * 60 * 1000;
  private readonly detailsCacheTtlMs = 60 * 60 * 1000;
  private readonly routeCacheTtlMs = 10 * 60 * 1000;

  private key() {
    return (process.env.GEOAPIFY_API_KEY || "").trim();
  }

  enabled() { return Boolean(this.key()); }

  private async requestJson<T>(url: string, retry = true): Promise<T> {
    if (!this.key()) throw new BadGatewayException("GEOAPIFY_API_KEY is not configured");
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (response.status === 429 && retry) {
      const retryAfter = Math.max(500, Math.min(2500, Number(response.headers.get("retry-after") || 0) * 1000 || 800));
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      return this.requestJson<T>(url, false);
    }
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new BadGatewayException(`Geoapify API ${response.status}: ${body || response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async reverse(lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new NotFoundException("Geoapify reverse coordinates are invalid");
    const params = new URLSearchParams({ lat: String(lat), lon: String(lng), apiKey: this.key() });
    const data = await this.requestJson<GeoapifyFeatureCollection>(`https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`);
    const feature = data.features?.[0];
    const props = feature?.properties ?? {};
    const formatted = asString(props.formatted) || asString(props.address_line1) || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const city = asString(props.city) || asString(props.town) || asString(props.village) || asString(props.municipality) || asString(props.county);
    return {
      place_id: asString(props.place_id) || `geoapify_reverse_${lat.toFixed(6)}_${lng.toFixed(6)}`,
      formatted_address: formatted,
      lat: asNumber(props.lat) ?? lat,
      lng: asNumber(props.lon) ?? lng,
      city,
      region: asString(props.state) || asString(props.region),
      street: asString(props.street) || asString(props.address_line1),
      house: asString(props.housenumber),
    };
  }

  categoriesFor(section = "all", subcategory = "") {
    const specific = SUBCATEGORY_CATEGORIES[subcategory];
    if (specific?.length) return specific;
    return SECTION_CATEGORIES[section] ?? SECTION_CATEGORIES.all;
  }

  mapSection(categories: string[], fallback = "interesting") {
    if (categories.some((item) => item.startsWith("catering"))) return "food";
    if (categories.some((item) => item.startsWith("commercial"))) return "shop";
    if (categories.some((item) => item.startsWith("public_transport") || item.startsWith("service.taxi") || item.startsWith("service.vehicle") || item.startsWith("parking"))) return "transfer";
    if (categories.some((item) => item.startsWith("natural") || item.startsWith("national_park") || item.startsWith("waterway") || item.startsWith("leisure.park"))) return "nature";
    if (categories.some((item) => item.startsWith("leisure.spa") || item.startsWith("accommodation"))) return "rest";
    if (categories.some((item) => item.startsWith("entertainment") || item.startsWith("activity") || item.startsWith("sport"))) return "entertainment";
    if (categories.some((item) => item.startsWith("healthcare") || item.startsWith("service.post") || item.startsWith("service.police"))) return "useful";
    if (categories.some((item) => item.startsWith("tourism") || item.startsWith("heritage") || item.startsWith("religion"))) return "interesting";
    return fallback;
  }

  subcategory(categories: string[]) {
    const joined = categories.join(" ");
    const pairs: Array<[RegExp, string]> = [
      [/catering\.restaurant\.pizza|catering\.fast_food\.pizza/, "Піцерії"],
      [/catering\.restaurant/, "Ресторани"], [/catering\.cafe/, "Кафе"], [/catering\.bar|catering\.pub/, "Бари"], [/catering\.fast_food/, "Фастфуд"],
      [/commercial\.supermarket|commercial\.convenience|commercial\.food_and_drink/, "Продукти"], [/commercial\.gift_and_souvenir/, "Сувеніри"], [/commercial\.health_and_beauty\.pharmacy|healthcare\.pharmacy/, "Аптеки"],
      [/leisure\.spa\.sauna/, "Сауни"], [/leisure\.spa/, "SPA і басейни"], [/sport\.swimming_pool/, "Басейни"],
      [/entertainment\.museum/, "Музеї"], [/tourism\.attraction\.viewpoint/, "Оглядові точки"], [/natural\.mountain/, "Гори"], [/natural\.forest/, "Ліси"],
      [/public_transport\.train/, "Залізничні станції"], [/public_transport\.bus/, "Автобусні зупинки"], [/service\.taxi/, "Таксі"], [/parking/, "Парковки"],
      [/service\.vehicle\.fuel/, "Заправки"], [/service\.vehicle\.charging_station/, "Зарядні станції"], [/healthcare\.hospital/, "Лікарні"], [/service\.post/, "Пошта"], [/service\.police/, "Поліція"],
    ];
    return pairs.find(([pattern]) => pattern.test(joined))?.[1] ?? "";
  }

  private featureToPlace(feature: GeoapifyFeature): GeoapifyPlace | null {
    const props = feature.properties ?? {};
    const coordinates = Array.isArray(feature.geometry?.coordinates) ? feature.geometry?.coordinates as unknown[] : [];
    const lat = asNumber(props.lat) ?? asNumber(coordinates[1]);
    const lng = asNumber(props.lon) ?? asNumber(coordinates[0]);
    const placeId = asString(props.place_id);
    if (!placeId || lat == null || lng == null) return null;
    const contact = asRecord(props.contact);
    const wiki = asRecord(props.wiki_and_media);
    const phoneInternational = contact ? asRecord(contact.phone_international) : undefined;
    const phone = asString(contact?.phone) || asString(phoneInternational?.ua) || stringArray(contact?.phone_other)[0] || null;
    const categories = stringArray(props.categories);
    return {
      placeId,
      name: asString(props.name) || asString(props.address_line1) || "Локація",
      formattedAddress: asString(props.formatted) || [asString(props.address_line1), asString(props.address_line2)].filter(Boolean).join(", "),
      lat,
      lng,
      categories,
      distance: asNumber(props.distance),
      website: asString(props.website) || null,
      phone,
      openingHours: asString(props.opening_hours) || null,
      imageUrl: asString(wiki?.image) || asString(props.image) || null,
      description: asString(props.description) || null,
      internetAccess: typeof props.internet_access === "boolean" ? props.internet_access : null,
      wheelchair: typeof props.wheelchair === "boolean" || typeof props.wheelchair === "string" ? props.wheelchair as boolean | string : null,
      parking: asRecord(props.parking) ?? null,
      raw: props,
    };
  }

  private async resolveMediaImage(props: Record<string, unknown>) {
    const wiki = asRecord(props.wiki_and_media);
    const datasource = asRecord(props.datasource);
    const raw = asRecord(datasource?.raw);
    const direct = asString(wiki?.image) || asString(props.image) || asString(raw?.image);
    if (direct) return direct;

    const commons = commonsImageUrl(wiki?.wikimedia_commons) || commonsImageUrl(raw?.wikimedia_commons);
    if (commons) return commons;

    const ref = wikipediaRef(wiki?.wikipedia) || wikipediaRef(raw?.wikipedia);
    if (!ref) return "";
    try {
      const url = `https://${ref.lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ref.title.replace(/ /g, "_"))}`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) return "";
      const data = await response.json() as Record<string, unknown>;
      const thumbnail = asRecord(data.thumbnail);
      const original = asRecord(data.originalimage);
      return asString(original?.source) || asString(thumbnail?.source);
    } catch {
      return "";
    }
  }

  async nearby(lat: number, lng: number, radius: number, section = "all", subcategory = "", limit = 20, name = ""): Promise<GeoapifyPlace[]> {
    const preferredCategories = this.categoriesFor(section, subcategory);
    const cleanName = name.trim();
    const requestedLimit = Math.max(1, Math.min(100, Math.round(limit || 20)));
    const outputLimit = requestedLimit;
    const isFastPaint = requestedLimit <= 4;
    // For large radii a single proximity-sorted page gets saturated by the city centre and
    // practically never reaches POIs 2–5 km away. Keep the first-paint request tiny, then
    // distribute the full request over the radius with the same total credit scale.
    const radiusLimit = radius >= 5000 ? 80 : radius >= 2000 ? 60 : radius >= 1000 ? 50 : 30;
    const safeLimit = isFastPaint ? requestedLimit : Math.max(1, Math.min(Math.max(requestedLimit, radiusLimit), 100));
    const isAll = section === "all" && !subcategory;
    const categoryKey = isAll ? SECTION_CATEGORIES.all.join(",") : preferredCategories.join(",");
    const cacheKey = [lat.toFixed(4), lng.toFixed(4), Math.round(radius), categoryKey, safeLimit, cleanName.toLocaleLowerCase("uk")].join(":");
    const cached = this.nearbyCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const requestAt = async (pointLat: number, pointLng: number, categories: string[], requestRadius: number, requestLimit: number) => {
      const params = new URLSearchParams({
        categories: categories.join(","),
        filter: `circle:${pointLng},${pointLat},${Math.max(50, Math.round(requestRadius))}`,
        bias: `proximity:${pointLng},${pointLat}`,
        limit: String(Math.max(1, Math.min(requestLimit, 100))),
        lang: "uk",
        apiKey: this.key(),
      });
      if (cleanName) params.set("name", cleanName);
      return this.requestJson<GeoapifyFeatureCollection>(`https://api.geoapify.com/v2/places?${params.toString()}`);
    };

    const categories = isAll ? SECTION_CATEGORIES.all : preferredCategories;
    let features: GeoapifyFeature[] = [];

    if (isAll) {
      // "Усі" must have a genuinely fast first paint. Do one tiny request first instead of
      // waiting for all category groups; the client then replaces it with the richer background page.
      const allGroups: string[][] = [
        ["catering", "commercial"],
        ["accommodation", "tourism", "entertainment", "leisure", "sport"],
        ["public_transport", "service", "healthcare", "parking"],
        ["natural"],
      ];
      if (isFastPaint) {
        try {
          const fast = await requestAt(lat, lng, allGroups[0], radius, Math.max(1, Math.min(safeLimit, 3)));
          features = fast.features ?? [];
        } catch {
          const fallback = await requestAt(lat, lng, allGroups[1], radius, Math.max(1, Math.min(safeLimit, 3)));
          features = fallback.features ?? [];
        }
      } else {
        const groupLimit = Math.max(5, Math.min(20, Math.ceil(safeLimit / allGroups.length) + 2));
        const centreSettled = await Promise.allSettled(
          allGroups.map((group) => requestAt(lat, lng, group, radius, groupLimit)),
        );
        for (const item of centreSettled) {
          if (item.status === "fulfilled") features.push(...(item.value.features ?? []));
        }

        // A proximity-sorted centre query is naturally dominated by the nearest streets.
        // For 2–5 km add one outer sample for each category family. Run it in a second wave so
        // the Geoapify Free-plan 5 req/s limit is not hit by eight simultaneous requests.
        let outerSettled: PromiseSettledResult<GeoapifyFeatureCollection>[] = [];
        if (radius >= 2000) {
          await new Promise((resolve) => setTimeout(resolve, 1050));
          const offset = radius * 0.56;
          const outerPoints = [
            offsetPoint(lat, lng, offset, 0),
            offsetPoint(lat, lng, -offset, 0),
            offsetPoint(lat, lng, 0, offset),
            offsetPoint(lat, lng, 0, -offset),
          ];
          const outerRadius = radius * 0.72;
          const outerLimit = Math.max(6, Math.min(14, Math.ceil(safeLimit / 8) + 2));
          outerSettled = await Promise.allSettled(
            allGroups.map((group, index) => requestAt(outerPoints[index].lat, outerPoints[index].lng, group, outerRadius, outerLimit)),
          );
          for (const item of outerSettled) {
            if (item.status === "fulfilled") features.push(...(item.value.features ?? []));
          }
        }

        if (!features.length) {
          const errors = [...centreSettled, ...outerSettled]
            .filter((item): item is PromiseRejectedResult => item.status === "rejected")
            .map((item) => item.reason instanceof Error ? item.reason.message : String(item.reason));
          if (errors.length) throw new BadGatewayException(`Geoapify "Усі" search failed: ${errors.join(" | ")}`);
        }
      }
    } else if (isFastPaint || radius < 2000) {
      // One small centre request gives the user markers immediately.
      try {
        const data = await requestAt(lat, lng, categories, radius, safeLimit);
        features = data.features ?? [];
      } catch (error) {
        const fallbackCategories = SECTION_CATEGORIES[section] ?? SECTION_CATEGORIES.all;
        if (!subcategory || fallbackCategories.join(",") === categories.join(",")) throw error;
        const fallback = await requestAt(lat, lng, fallbackCategories, radius, safeLimit);
        features = fallback.features ?? [];
      }
    } else {
      // Centre + four cardinal circles improve coverage for 2–5 km category searches.
      const offset = radius * 0.52;
      const localRadius = radius * 0.78;
      const points = [
        { lat, lng },
        offsetPoint(lat, lng, offset, 0),
        offsetPoint(lat, lng, -offset, 0),
        offsetPoint(lat, lng, 0, offset),
        offsetPoint(lat, lng, 0, -offset),
      ];
      const perPoint = Math.max(8, Math.min(20, Math.ceil(safeLimit / points.length)));
      const settled = await Promise.allSettled(points.map((point) => requestAt(point.lat, point.lng, categories, localRadius, perPoint)));
      for (const item of settled) if (item.status === "fulfilled") features.push(...(item.value.features ?? []));
      if (!features.length) {
        const errors = settled.filter((item): item is PromiseRejectedResult => item.status === "rejected")
          .map((item) => item.reason instanceof Error ? item.reason.message : String(item.reason));
        if (errors.length) throw new BadGatewayException(`Geoapify nearby spread search failed: ${errors.join(" | ")}`);
      }
    }

    const byId = new Map<string, GeoapifyPlace>();
    for (const feature of features) {
      const place = this.featureToPlace(feature);
      if (!place) continue;
      // Geoapify's `distance` is measured from each query's bias point. For distributed requests
      // always recalculate it from the user's real centre before filtering/sorting.
      place.distance = straightDistanceMeters(lat, lng, place.lat, place.lng);
      if (place.distance > radius + 25) continue;
      const previous = byId.get(place.placeId);
      if (!previous || Number(place.distance) < Number(previous.distance ?? Infinity)) byId.set(place.placeId, place);
    }
    const result = [...byId.values()]
      .sort((a, b) => Number(a.distance ?? Infinity) - Number(b.distance ?? Infinity))
      // `safeLimit` is only the internal sampling budget used to cover a large radius.
      // Return exactly the page size requested by the client so 5 km never explodes into 60–80
      // markers/Google enrichments at once.
      .slice(0, outputLimit);
    this.nearbyCache.set(cacheKey, { value: result, expiresAt: Date.now() + this.nearbyCacheTtlMs });
    return result;
  }

  async details(placeId: string): Promise<GeoapifyPlace> {
    const clean = placeId.trim();
    if (!clean) throw new NotFoundException("Geoapify place id is required");
    const cached = this.detailsCache.get(clean);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const params = new URLSearchParams({ id: clean, features: "details", lang: "uk", apiKey: this.key() });
    const data = await this.requestJson<GeoapifyFeatureCollection>(`https://api.geoapify.com/v2/place-details?${params.toString()}`);
    const feature = (data.features ?? []).find((item) => item.properties?.feature_type === "details") ?? data.features?.[0];
    const place = feature ? this.featureToPlace(feature) : null;
    if (!place) throw new NotFoundException("Geoapify place not found");
    if (!place.imageUrl && feature?.properties) {
      const resolved = await this.resolveMediaImage(feature.properties);
      if (resolved) place.imageUrl = resolved;
    }
    this.detailsCache.set(clean, { value: place, expiresAt: Date.now() + this.detailsCacheTtlMs });
    return place;
  }

  async walkingRoute(originLat: number, originLng: number, destination: { id: string; lat: number; lng: number }): Promise<GeoapifyRouteMetric | null> {
    const cacheKey = `${originLat.toFixed(4)}:${originLng.toFixed(4)}:${destination.lat.toFixed(4)}:${destination.lng.toFixed(4)}`;
    const cached = this.routeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return { ...cached.value, id: destination.id };
    const params = new URLSearchParams({
      waypoints: `${originLat},${originLng}|${destination.lat},${destination.lng}`,
      mode: "walk",
      format: "json",
      apiKey: this.key(),
    });
    const data = await this.requestJson<GeoapifyRoutingResponse>(`https://api.geoapify.com/v1/routing?${params.toString()}`);
    const route = data.results?.[0] ?? data.features?.[0]?.properties;
    const distance = asNumber(route?.distance);
    const time = asNumber(route?.time);
    if (distance == null || time == null) return null;
    const value = { id: destination.id, distance_m: Math.round(distance), walking_duration_s: Math.round(time) };
    this.routeCache.set(cacheKey, { value, expiresAt: Date.now() + this.routeCacheTtlMs });
    return value;
  }
}
