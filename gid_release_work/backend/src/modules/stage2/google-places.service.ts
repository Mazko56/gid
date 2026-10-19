import { BadGatewayException, Injectable } from "@nestjs/common";

export type GoogleSuggestion = { place_id: string; text: string; main_text: string; secondary_text: string };
export type GoogleNearbyPlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  googleMapsUri?: string;
  googleMapsLinks?: {
    placeUri?: string;
    directionsUri?: string;
    writeAReviewUri?: string;
    reviewsUri?: string;
    photosUri?: string;
  };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  photos?: Array<{ name?: string; authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }> }>;
  reviews?: Array<{
    rating?: number;
    text?: { text?: string; languageCode?: string };
    originalText?: { text?: string; languageCode?: string };
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
    googleMapsUri?: string;
  }>;
  addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
};

const NEARBY_TYPES: Record<string, string[]> = {
  food: ["restaurant", "cafe", "bar", "bakery", "coffee_shop", "fast_food_restaurant", "pizza_restaurant", "ukrainian_restaurant"],
  shop: ["grocery_store", "supermarket", "convenience_store", "gift_shop", "pharmacy", "clothing_store", "shoe_store", "home_goods_store", "electronics_store", "hardware_store", "cosmetics_store", "market", "store"],
  rest: ["spa", "massage", "sauna", "swimming_pool", "wellness_center", "hiking_area", "tour_agency"],
  entertainment: ["adventure_sports_center", "amusement_center", "amusement_park", "off_roading_area", "tourist_attraction", "playground", "ski_resort", "stable", "sports_activity_location"],
  transfer: ["taxi_service", "taxi_stand", "bus_station", "bus_stop", "train_station", "parking", "car_rental", "gas_station", "electric_vehicle_charging_station"],
  nature: ["mountain_peak", "river", "lake", "nature_preserve", "scenic_spot", "woods", "park", "national_park", "hiking_area"],
  interesting: ["tourist_attraction", "museum", "history_museum", "church", "historical_place", "historical_landmark", "cultural_landmark", "monument", "sculpture", "event_venue"],
  useful: ["atm", "bank", "post_office", "hospital", "general_hospital", "public_bathroom", "police", "tourist_information_center", "pharmacy"],
  routes: ["hiking_area", "cycling_park", "tourist_attraction", "scenic_spot", "park", "national_park"],
};

const SUBCATEGORY_TYPES: Record<string, string[]> = {
  // Client category chips used by the approved Gid Tourist design.
  "Українська кухня": ["ukrainian_restaurant", "restaurant"],
  "Неукраїнська кухня": ["restaurant", "italian_restaurant", "asian_restaurant", "chinese_restaurant", "japanese_restaurant"],
  "Фаст фуд": ["fast_food_restaurant"],
  "Кавʼярні": ["cafe", "coffee_shop", "coffee_stand"],
  "Продовольчі": ["grocery_store", "supermarket", "convenience_store", "market"],
  "Промтовари": ["store", "home_goods_store", "hardware_store", "electronics_store", "clothing_store"],
  "Чани": ["spa", "sauna", "wellness_center"],
  "Сауни": ["sauna", "spa"],
  "Басейни": ["swimming_pool", "spa"],
  "Масаж": ["massage", "spa"],
  "Походи": ["hiking_area", "tourist_attraction"],
  "Джипи": ["off_roading_area", "adventure_sports_center"],
  "Рафтинг": ["adventure_sports_center", "tourist_attraction"],
  "Зіплайн": ["adventure_sports_center", "amusement_center"],
  "Для дітей": ["playground", "amusement_center", "amusement_park"],
  "Коні": ["stable", "sports_activity_location"],
  "Ресторани": ["restaurant", "ukrainian_restaurant", "bistro"],
  "Кафе": ["cafe", "coffee_shop", "coffee_stand"],
  "Бари": ["bar", "cocktail_bar", "sports_bar", "wine_bar"],
  "Піцерії": ["pizza_restaurant"],
  "Кондитерські": ["bakery", "confectionery", "cake_shop", "dessert_shop"],
  "Фастфуд": ["fast_food_restaurant"],
  "Їжа з собою": ["food_delivery", "deli"],
  "Традиційна кухня": ["ukrainian_restaurant", "restaurant"],
  "Продукти": ["grocery_store", "supermarket", "food_store", "convenience_store", "market"],
  "Сувеніри": ["gift_shop", "market"],
  "Одяг і взуття": ["clothing_store", "shoe_store", "sportswear_store"],
  "Товари для дому": ["home_goods_store", "furniture_store", "hardware_store"],
  "Аптеки": ["pharmacy", "drugstore"],
  "Техніка": ["electronics_store", "cell_phone_store"],
  "Будівництво": ["building_materials_store", "hardware_store", "home_improvement_store"],
  "Косметика": ["cosmetics_store", "beauty_salon"],
  "Гори": ["mountain_peak", "scenic_spot", "hiking_area"],
  "Річки": ["river"],
  "Водоспади": ["scenic_spot", "tourist_attraction"],
  "Джерела": ["scenic_spot"],
  "Озера": ["lake"],
  "Оглядові точки": ["scenic_spot", "observation_deck"],
  "Печери": ["tourist_attraction"],
  "Ліси": ["woods", "nature_preserve"],
  "Пам’ятки": ["tourist_attraction", "cultural_landmark", "historical_landmark"],
  "Музеї": ["museum", "history_museum", "art_museum"],
  "Храми": ["church"],
  "Архітектура": ["cultural_landmark", "historical_place", "castle"],
  "Історичні місця": ["historical_place", "historical_landmark"],
  "Скульптури": ["sculpture", "monument"],
  "Події": ["event_venue", "concert_hall", "cultural_center"],
  "Активний відпочинок": ["adventure_sports_center", "off_roading_area", "hiking_area"],
  "Атракціони": ["amusement_center", "amusement_park"],
  "Екскурсії": ["tour_agency", "tourist_attraction"],
  "SPA і басейни": ["spa", "sauna", "swimming_pool", "massage"],
  "Риболовля": ["fishing_pond", "fishing_pier", "fishing_charter"],
  "Верхова їзда": ["stable", "sports_activity_location"],
  "Квадроцикли": ["off_roading_area", "adventure_sports_center"],
  "Польоти": ["adventure_sports_center", "airstrip"],
  "Автобусні зупинки": ["bus_stop"],
  "Залізничні станції": ["train_station"],
  "Автостанції": ["bus_station", "transit_station"],
  "Таксі": ["taxi_service", "taxi_stand"],
  "Парковки": ["parking", "parking_lot", "parking_garage"],
  "Оренда авто": ["car_rental"],
  "Заправки": ["gas_station"],
  "Зарядні станції": ["electric_vehicle_charging_station", "ebike_charging_station"],
  "Банкомати": ["atm"],
  "Обмін валют": ["bank"],
  "Пошта": ["post_office"],
  "Лікарні": ["hospital", "general_hospital", "medical_center"],
  "Туалети": ["public_bathroom"],
  "Wi‑Fi": ["internet_cafe", "visitor_center"],
  "Поліція": ["police"],
  "Інформаційні центри": ["tourist_information_center", "visitor_center"],
  "Піші маршрути": ["hiking_area"],
  "Веломаршрути": ["cycling_park", "hiking_area"],
  "Автомаршрути": ["scenic_spot", "tourist_attraction"],
  "Верхові маршрути": ["stable", "sports_activity_location"],
  "Водні маршрути": ["river", "lake", "marina"],
  "Популярні маршрути": ["hiking_area", "scenic_spot", "tourist_attraction"],
  "Складні маршрути": ["hiking_area", "mountain_peak"],
  "Маршрути вихідного дня": ["hiking_area", "park", "scenic_spot"],
};

@Injectable()
export class GooglePlacesService {
  private key() {
    return (process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "").trim();
  }

  enabled() { return Boolean(this.key()); }

  // Short-lived in-memory caches prevent repeated paid Google calls caused by UI re-renders
  // while keeping Places data fresh. These caches disappear on backend restart.
  private readonly detailsCache = new Map<string, { value: GoogleNearbyPlace; expiresAt: number }>();
  private readonly nearbyCache = new Map<string, { value: GoogleNearbyPlace[]; expiresAt: number }>();
  private readonly textReviewCache = new Map<string, { value: GoogleNearbyPlace | null; expiresAt: number }>();
  private readonly textCardCache = new Map<string, { value: GoogleNearbyPlace | null; expiresAt: number }>();
  private readonly detailsCacheTtlMs = 10 * 60 * 1000;
  private readonly nearbyCacheTtlMs = 5 * 60 * 1000;
  private readonly textReviewCacheTtlMs = 30 * 60 * 1000;
  private readonly textCardCacheTtlMs = 6 * 60 * 60 * 1000;

  private async googleFetch<T>(url: string, init: RequestInit): Promise<T> {
    const key = this.key();
    if (!key) throw new BadGatewayException("GOOGLE_MAPS_SERVER_API_KEY is not configured");
    const headers = new Headers(init.headers);
    headers.set("X-Goog-Api-Key", key);
    const response = await fetch(url, { ...init, headers });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new BadGatewayException(`Google Maps API ${response.status}: ${body || response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async autocomplete(input: string, mode: "city" | "street" | "house", city = "", street = ""): Promise<GoogleSuggestion[]> {
    const clean = input.trim();
    if (clean.length < 1) return [];
    const query = mode === "city" ? clean : mode === "street" ? `${clean}, ${city}, Україна` : `${street} ${clean}, ${city}, Україна`;
    const body: Record<string, unknown> = {
      input: query,
      languageCode: "uk",
      regionCode: "UA",
      includedRegionCodes: ["ua"],
      includeQueryPredictions: false,
    };

    // `(cities)` excludes villages/smaller settlements. Use locality-compatible primary types instead,
    // so typing from the first letter can return both cities and villages across Ukraine.
    if (mode === "city") body.includedPrimaryTypes = ["locality", "postal_town", "administrative_area_level_3", "administrative_area_level_4", "administrative_area_level_5"];
    if (mode === "street") body.includedPrimaryTypes = ["route"];
    if (mode === "house") body.includedPrimaryTypes = ["street_address", "premise", "subpremise"];

    type Prediction = {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
      types?: string[];
    };
    type AutocompleteResponse = { suggestions?: Array<{ placePrediction?: Prediction }> };
    const request = (payload: Record<string, unknown>) => this.googleFetch<AutocompleteResponse>(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text,suggestions.placePrediction.types",
        },
        body: JSON.stringify(payload),
      },
    );

    let data = await request(body);
    // A few Ukrainian villages are inconsistently classified by Google. If the strict locality
    // request is empty, retry without a primary-type restriction and keep only settlement-like results.
    if (mode === "city" && !(data.suggestions ?? []).some((item) => item.placePrediction?.placeId)) {
      const fallbackBody = { ...body };
      delete fallbackBody.includedPrimaryTypes;
      data = await request(fallbackBody);
    }

    const settlementTypes = new Set([
      "locality", "postal_town", "administrative_area_level_3", "administrative_area_level_4", "administrative_area_level_5",
      "sublocality", "political",
    ]);

    return (data.suggestions ?? []).flatMap((item) => {
      const prediction = item.placePrediction;
      if (!prediction?.placeId) return [];
      if (mode === "city" && prediction.types?.length && !prediction.types.some((type) => settlementTypes.has(type))) return [];
      return [{
        place_id: prediction.placeId,
        text: prediction.text?.text || prediction.structuredFormat?.mainText?.text || "",
        main_text: prediction.structuredFormat?.mainText?.text || prediction.text?.text || "",
        secondary_text: prediction.structuredFormat?.secondaryText?.text || "",
      }];
    }).slice(0, 8);
  }

  async findByTextForCard(name: string, address: string, lat?: number, lng?: number): Promise<GoogleNearbyPlace | null> {
    const cleanName = name.trim();
    const cleanAddress = address.trim();
    if (!cleanName) return null;
    const cacheKey = `${cleanName.toLocaleLowerCase("uk")}|${cleanAddress.toLocaleLowerCase("uk")}|${Number(lat ?? 0).toFixed(3)}|${Number(lng ?? 0).toFixed(3)}`;
    const cached = this.textCardCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    // This lightweight match is used only to enrich cards that are already visible.
    // Do not request review text, phone, opening hours or other heavy fields here.
    const body: Record<string, unknown> = {
      textQuery: [cleanName, cleanAddress].filter(Boolean).join(", "),
      languageCode: "uk",
      regionCode: "UA",
      pageSize: 1,
    };
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      body.locationBias = { circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: 1500 } };
    }
    type TextSearchResponse = { places?: GoogleNearbyPlace[] };
    const data = await this.googleFetch<TextSearchResponse>(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.googleMapsLinks,places.photos",
        },
        body: JSON.stringify(body),
      },
    );
    const value = data.places?.[0] ?? null;
    this.textCardCache.set(cacheKey, { value, expiresAt: Date.now() + this.textCardCacheTtlMs });
    return value;
  }

  async findByTextForReviews(name: string, address: string, lat?: number, lng?: number): Promise<GoogleNearbyPlace | null> {
    const cleanName = name.trim();
    const cleanAddress = address.trim();
    if (!cleanName) return null;
    const cacheKey = `${cleanName.toLocaleLowerCase("uk")}|${cleanAddress.toLocaleLowerCase("uk")}|${Number(lat ?? 0).toFixed(3)}|${Number(lng ?? 0).toFixed(3)}`;
    const cached = this.textReviewCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const body: Record<string, unknown> = {
      textQuery: [cleanName, cleanAddress].filter(Boolean).join(", "),
      languageCode: "uk",
      regionCode: "UA",
      pageSize: 1,
    };
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      body.locationBias = { circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: 1500 } };
    }
    type TextSearchResponse = { places?: GoogleNearbyPlace[] };
    const fieldMask = "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.googleMapsUri,places.googleMapsLinks,places.websiteUri,places.nationalPhoneNumber,places.photos,places.reviews";
    const requestSearch = (payload: Record<string, unknown>) => this.googleFetch<TextSearchResponse>(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Deliberately no photos here: Google is used only as review/rating enrichment
          // for a place the user actually opened.
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(payload),
      },
    );

    const primary = await requestSearch(body);
    let value = primary.places?.[0] ?? null;
    const hasReviewText = value?.reviews?.some((review) => Boolean(review.text?.text?.trim() || review.originalText?.text?.trim()));
    // Google can return the rating/count but omit localized review text. Retry once without
    // languageCode only for an opened place; the final value is then cached for 30 minutes.
    if (value && Number(value.userRatingCount ?? 0) > 0 && !hasReviewText) {
      try {
        const fallbackBody = { ...body };
        delete fallbackBody.languageCode;
        const fallback = await requestSearch(fallbackBody);
        const fallbackValue = fallback.places?.[0];
        if (fallbackValue?.reviews?.some((review) => Boolean(review.text?.text?.trim() || review.originalText?.text?.trim()))) {
          value = { ...value, reviews: fallbackValue.reviews };
        }
      } catch { /* keep the localized result and the exact Google reviews link */ }
    }
    this.textReviewCache.set(cacheKey, { value, expiresAt: Date.now() + this.textReviewCacheTtlMs });
    return value;
  }

  async details(placeId: string): Promise<GoogleNearbyPlace> {
    const cleanId = placeId.trim();
    const cached = this.detailsCache.get(cleanId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const fieldMask = "id,displayName,formattedAddress,location,addressComponents,types,primaryType,primaryTypeDisplayName,rating,userRatingCount,priceLevel,regularOpeningHours,googleMapsUri,googleMapsLinks,websiteUri,nationalPhoneNumber,photos,reviews";
    const fetchDetails = (localized: boolean) => this.googleFetch<GoogleNearbyPlace>(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanId)}?${localized ? "languageCode=uk&" : ""}regionCode=UA`,
      { method: "GET", headers: { "X-Goog-FieldMask": fieldMask } },
    );
    const primary = await fetchDetails(true);
    const hasReviewText = primary.reviews?.some((review) => Boolean(review.text?.text?.trim() || review.originalText?.text?.trim()));
    let resolved = primary;
    if (Number(primary.userRatingCount ?? 0) > 0 && !hasReviewText) {
      try {
        const fallback = await fetchDetails(false);
        if (fallback.reviews?.some((review) => Boolean(review.text?.text?.trim() || review.originalText?.text?.trim()))) {
          resolved = { ...primary, reviews: fallback.reviews };
        }
      } catch { /* localized details remain usable */ }
    }
    this.detailsCache.set(cleanId, { value: resolved, expiresAt: Date.now() + this.detailsCacheTtlMs });
    return resolved;
  }

  async addressDetails(placeId: string): Promise<GoogleNearbyPlace> {
    return this.googleFetch<GoogleNearbyPlace>(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=uk&regionCode=UA`,
      { method: "GET", headers: { "X-Goog-FieldMask": "id,formattedAddress,location,addressComponents" } },
    );
  }

  async photoUri(photoName: string) {
    const clean = photoName.trim().replace(/^\/+/, "");
    if (!clean || !/^places\/[^/]+\/photos\/[^/]+/.test(clean)) throw new BadGatewayException("Invalid Google photo name");
    const data = await this.googleFetch<{ photoUri?: string }>(`https://places.googleapis.com/v1/${clean}/media?maxWidthPx=1200&maxHeightPx=900&skipHttpRedirect=true`, { method: "GET" });
    if (!data.photoUri) throw new BadGatewayException("Google photo is unavailable");
    return data.photoUri;
  }

  async photoData(photoName: string) {
    const clean = photoName.trim().replace(/^\/+/, "");
    if (!clean || !/^places\/[^/]+\/photos\/[^/]+/.test(clean)) throw new BadGatewayException("Invalid Google photo name");

    // Ask Places Photos for the current Google-hosted media URL, then download that URL.
    // This avoids relying on redirect/header behaviour and keeps the API key off the image host.
    const mediaUrl = await this.photoUri(clean);
    const response = await fetch(mediaUrl, { headers: { Accept: "image/avif,image/webp,image/*,*/*" } });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new BadGatewayException(`Google photo media ${response.status}: ${body || response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) throw new BadGatewayException("Google photo is empty");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.toLowerCase().startsWith("image/")) throw new BadGatewayException("Google photo response is not an image");
    return { buffer, contentType };
  }


  async placePhotoData(placeId: string) {
    // Reuse the cached full Place Details response when available. This avoids a second
    // Place Details call just to obtain photos after the user has opened the same place.
    const place = await this.details(placeId);
    const photoName = (place.photos ?? []).map((photo) => photo.name?.trim() || "").find(Boolean) || "";
    if (!photoName) throw new BadGatewayException("Google place has no photo");
    // One place card/detail = at most one main photo request. Do not cascade through 5 photos,
    // which previously amplified quota usage and made failures much slower.
    return this.photoData(photoName);
  }


  async reverse(lat: number, lng: number) {
    const key = this.key();
    if (!key) throw new BadGatewayException("GOOGLE_MAPS_SERVER_API_KEY is not configured");
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(String(lat))},${encodeURIComponent(String(lng))}&language=uk&region=ua&key=${encodeURIComponent(key)}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new BadGatewayException(`Google Geocoding API ${response.status}: ${body || response.statusText}`);
    }
    const data = await response.json() as { status?: string; error_message?: string; results?: Array<{ formatted_address?: string; place_id?: string; address_components?: Array<{ long_name?: string; short_name?: string; types?: string[] }> }> };
    if (data.status !== "OK" || !data.results?.[0]) throw new BadGatewayException(`Google Geocoding API: ${data.error_message || data.status || "no result"}`);
    const first = data.results[0];
    const component = (type: string) => first.address_components?.find((item) => item.types?.includes(type))?.long_name || "";
    return {
      place_id: first.place_id || "",
      formatted_address: first.formatted_address || "",
      lat, lng,
      city: component("locality") || component("postal_town") || component("administrative_area_level_3"),
      region: component("administrative_area_level_1"),
      street: component("route"),
      house: component("street_number"),
    };
  }

  async nearby(lat: number, lng: number, radius: number, section = "all", subcategory = "", limit = 20, spread = false): Promise<GoogleNearbyPlace[]> {
    const cacheKey = [lat.toFixed(4), lng.toFixed(4), Math.round(radius), section, subcategory, limit, spread ? "spread" : "near"].join(":");
    const cached = this.nearbyCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const staleCached = cached?.value;

    const remember = (value: GoogleNearbyPlace[]) => {
      this.nearbyCache.set(cacheKey, { value, expiresAt: Date.now() + this.nearbyCacheTtlMs });
      return value;
    };

    const subcategoryTypes = SUBCATEGORY_TYPES[subcategory] ?? [];
    // For "Усі" do not send a giant includedTypes list. Google officially supports omitting
    // all type restrictions, which returns places of all supported types inside the circle.
    // This also avoids one outdated/unsupported type invalidating the whole request.
    const types = subcategoryTypes.length ? subcategoryTypes : section === "all" ? [] : (NEARBY_TYPES[section] ?? []);
    if (section !== "all" && !types.length) return remember([]);

    const richFieldMask = "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.primaryTypeDisplayName,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.googleMapsUri,places.googleMapsLinks,places.websiteUri,places.nationalPhoneNumber,places.photos";
    const basicFieldMask = "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.primaryTypeDisplayName,places.googleMapsUri,places.googleMapsLinks,places.photos";

    const requestNearby = async (
      centerLat: number,
      centerLng: number,
      searchRadius: number,
      maxResultCount: number,
      rankPreference: "DISTANCE" | "POPULARITY",
      fieldMask: string,
    ) => {
      const body: Record<string, unknown> = {
        maxResultCount: Math.max(1, Math.min(maxResultCount, 20)),
        rankPreference,
        languageCode: "uk",
        regionCode: "UA",
        locationRestriction: {
          circle: {
            center: { latitude: centerLat, longitude: centerLng },
            radius: Math.max(100, Math.min(searchRadius, 50000)),
          },
        },
      };
      if (types.length) body.includedTypes = types;

      const data = await this.googleFetch<{ places?: GoogleNearbyPlace[] }>("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
      });
      return data.places ?? [];
    };

    const mergeCachedDetails = (items: GoogleNearbyPlace[]) => items.map((item) => {
      const detail = item.id ? this.detailsCache.get(item.id) : undefined;
      if (!detail || detail.expiresAt <= Date.now()) return item;
      return { ...item, ...detail.value };
    });

    // First try the previous rich payload so rating, phone and opening hours remain available.
    // If that SKU/rate limit is temporarily rejected, retry once with the safe Pro field set.
    // The map therefore still gets markers instead of becoming completely empty.
    const safeSearch = async (
      centerLat: number,
      centerLng: number,
      searchRadius: number,
      maxResultCount: number,
      rankPreference: "DISTANCE" | "POPULARITY",
    ) => {
      try {
        return await requestNearby(centerLat, centerLng, searchRadius, maxResultCount, rankPreference, richFieldMask);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[Google Nearby] rich search failed: ${message}`);
        if (message.includes("429")) {
          // One controlled backoff/retry keeps the old rating/phone/opening-hours payload whenever
          // the rejection was only a short rate spike. Never retry in a loop.
          await new Promise((resolve) => setTimeout(resolve, 850));
          try {
            return await requestNearby(centerLat, centerLng, searchRadius, maxResultCount, rankPreference, richFieldMask);
          } catch (retryError) {
            console.warn(`[Google Nearby] rich retry failed, using basic fallback: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
          }
        }
        const basic = await requestNearby(centerLat, centerLng, searchRadius, maxResultCount, rankPreference, basicFieldMask);
        return mergeCachedDetails(basic);
      }
    };

    try {
      if (!spread || radius < 1000 || limit < 12 || subcategory) {
        return remember(await safeSearch(lat, lng, radius, limit, "DISTANCE"));
      }

      // Radius 1–5 km: keep the nearest center results and then add geographically distributed
      // sector results. Sector failures are isolated, so one 429/temporary Google error can no
      // longer erase all markers from the map.
      const earth = 6371000;
      const distance = (aLat: number, aLng: number, bLat: number, bLng: number) => {
        const rad = (v: number) => v * Math.PI / 180;
        const dLat = rad(bLat - aLat);
        const dLng = rad(bLng - aLng);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
        return 2 * earth * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      };

      const center = await safeSearch(lat, lng, radius, Math.min(20, limit), "DISTANCE");
      const offset = radius * 0.48;
      const dLat = offset / 111320;
      const dLng = offset / (111320 * Math.max(.2, Math.cos(lat * Math.PI / 180)));
      const sectorRadius = Math.max(450, radius * 0.62);
      const sectorCenters = [
        { lat: lat + dLat, lng },
        { lat: lat - dLat, lng },
        { lat, lng: lng + dLng },
        { lat, lng: lng - dLng },
      ];

      const groups: GoogleNearbyPlace[][] = [center];
      for (const sector of sectorCenters) {
        if (groups.reduce((sum, group) => sum + group.length, 0) >= limit) break;
        try {
          // Sequential calls avoid the previous five-request burst that could trigger 429.
          const group = await safeSearch(sector.lat, sector.lng, sectorRadius, 8, "DISTANCE");
          groups.push(group);
        } catch (error) {
          console.warn(`[Google Nearby] sector skipped: ${error instanceof Error ? error.message : String(error)}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      const selected: GoogleNearbyPlace[] = [];
      const seen = new Set<string>();
      for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
        const group = groups[groupIndex];
        let groupCount = 0;
        for (const place of group) {
          if (!place.id || seen.has(place.id)) continue;
          const pLat = Number(place.location?.latitude);
          const pLng = Number(place.location?.longitude);
          if (!Number.isFinite(pLat) || !Number.isFinite(pLng) || distance(lat, lng, pLat, pLng) > radius) continue;
          seen.add(place.id);
          selected.push(place);
          groupCount += 1;
          const perGroupLimit = groupIndex === 0 ? Math.min(20, limit) : 5;
          if (selected.length >= limit || groupCount >= perGroupLimit) break;
        }
        if (selected.length >= limit) break;
      }

      return remember(selected.slice(0, limit));
    } catch (error) {
      // A recently successful result is better than an empty map during a temporary quota spike.
      if (staleCached?.length) {
        console.warn(`[Google Nearby] returning stale cached places after failure: ${error instanceof Error ? error.message : String(error)}`);
        return staleCached;
      }
      throw error;
    }
  }

  async walkingMatrix(originLat: number, originLng: number, destinations: Array<{ id: string; lat: number; lng: number }>) {
    const clean = destinations.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)).slice(0, 20);
    if (!clean.length) return [] as Array<{ id: string; distance_m: number; walking_duration_s: number }>;
    const data = await this.googleFetch<Array<{
      originIndex?: number; destinationIndex?: number; distanceMeters?: number; duration?: string; condition?: string; status?: { code?: number; message?: string };
    }>>(
      "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,status,condition",
        },
        body: JSON.stringify({
          origins: [{ waypoint: { location: { latLng: { latitude: originLat, longitude: originLng } } } }],
          destinations: clean.map((item) => ({ waypoint: { location: { latLng: { latitude: item.lat, longitude: item.lng } } } })),
          travelMode: "WALK",
        }),
      },
    );
    return data.flatMap((item) => {
      const index = Number(item.destinationIndex ?? 0);
      const destination = clean[index];
      const distance = Number(item.distanceMeters ?? 0);
      const durationMatch = String(item.duration ?? "").match(/^([0-9.]+)s$/);
      const duration = durationMatch ? Math.round(Number(durationMatch[1])) : 0;
      const statusCode = Number(item.status?.code ?? 0);
      if (!destination || statusCode !== 0 || item.condition === "ROUTE_NOT_FOUND" || !distance || !duration) return [];
      return [{ id: destination.id, distance_m: Math.round(distance), walking_duration_s: duration }];
    });
  }

  mapSection(primaryType = "", types: string[] = []) {
    const all = new Set([primaryType, ...types]);
    for (const [section, candidates] of Object.entries(NEARBY_TYPES)) {
      if (candidates.some((type) => all.has(type))) return section;
    }
    return "interesting";
  }

  matchesSubcategory(label: string, primaryType = "", types: string[] = []) {
    const expected = SUBCATEGORY_TYPES[label] ?? [];
    if (!expected.length) return true;
    const actual = new Set([primaryType, ...types]);
    return expected.some((type) => actual.has(type));
  }

  subcategory(primaryType = "", label = "") {
    if (label) return label;
    return primaryType.replaceAll("_", " ");
  }
}
