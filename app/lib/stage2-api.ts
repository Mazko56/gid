"use client";

export type Stage2User = {
  id: string;
  telegram_id?: string | null;
  telegram_username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  selected_language?: string;
  role?: string;
  phone?: string | null;
};

export type Stage2Place = {
  id: string;
  region_id: string;
  category_slug: string;
  category_name?: string;
  subcategory?: string | null;
  name: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string | null;
  telegram?: string | null;
  website?: string | null;
  image_url?: string | null;
  rating: number;
  review_count: number;
  price_level?: number | null;
  work_hours?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  details?: Record<string, unknown>;
  translations?: Record<string, unknown>;
  tags?: string[];
  distance_m?: number | null;
  walking_duration_s?: number | null;
  is_open_now?: boolean | null;
  status?: string;
  source?: "partner" | "google" | "geoapify";
  is_partner?: boolean;
};

export type Stage2Category = {
  slug: string;
  name: string;
  name_en?: string | null;
  name_pl?: string | null;
  subcategories?: string[];
  filter_config?: Record<string, boolean>;
};

export type Stage2PlaceTypeTemplate = {
  id: string;
  category_slug: string;
  place_type: string;
  label: string;
  default_title?: string | null;
  default_description?: string | null;
  default_services: string[];
  default_amenities?: string[];
  fields?: Record<string, unknown>;
  sort_order?: number;
};

export type Stage2EmergencyService = {
  id: string;
  region_id: string;
  title: string;
  note: string;
  tone: "green" | "purple" | "orange" | "blue";
  icon: "doctor" | "pharmacy" | "repair" | "tow" | "vet" | "custom";
  sort_order: number;
  active: boolean;
  updated_at?: string;
};

export type Stage2EmergencyServicesResponse = {
  services: Stage2EmergencyService[];
  verified_at?: string | null;
};

export type Stage2PageContentResponse = {
  region_id: string;
  page_key: string;
  content: Record<string, unknown>;
  updated_at?: string | null;
};

export type Stage2HotOffer = {
  id: string;
  region_id: string;
  place_id?: string | null;
  category_slug?: string | null;
  category_label?: string | null;
  title: string;
  discount: string;
  description: string;
  detail: string;
  validity?: string | null;
  badge?: string | null;
  badge_tone?: "gold" | "green" | "red" | null;
  image_url?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  sort_order?: number;
  active?: boolean;
  place_name?: string | null;
  place_rating?: number | null;
  place_review_count?: number;
};

export type Stage2GeoSuggestion = { place_id: string; text: string; main_text: string; secondary_text: string };
export type Stage2GeoDetails = { place_id: string; formatted_address: string; lat: number; lng: number; city: string; region: string; street: string; house: string };

export type Stage2Weather = {
  temperature_c: number;
  precipitation_probability: number;
  wind_speed_kmh: number;
  sunset: string;
  weather_code: number;
  observed_at: string;
};

export type Stage2Context = {
  qr: { id: string; startParam: string; type: string; source: string };
  region: { id: string; name: string; nameEn?: string; namePl?: string; lat: number; lng: number; communityUrl?: string | null };
  place: Stage2Place | null;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: { start_param?: string; user?: { id?: number; first_name?: string; last_name?: string; username?: string; language_code?: string; photo_url?: string } };
};

type TelegramWindow = Window & { Telegram?: { WebApp?: TelegramWebApp } };

const TOKEN_KEY = "gid-tourist-stage2-session";
const SELECTED_PLACE_KEY = "gid-tourist-selected-place";
const SELECTED_PLACE_PREVIEW_KEY = "gid-tourist-selected-place-preview";
const PHOTO_HYDRATION_ATTEMPT_PREFIX = "gid-tourist-photo-hydration:";

let lastTelegramAuthError = "";

function telegramLaunchParams() {
  if (typeof window === "undefined") return [] as URLSearchParams[];
  const values: URLSearchParams[] = [];
  if (window.location.search) values.push(new URLSearchParams(window.location.search));
  if (window.location.hash) values.push(new URLSearchParams(window.location.hash.replace(/^#/, "")));
  return values;
}

function rawTelegramInitData() {
  for (const params of telegramLaunchParams()) {
    const value = params.get("tgWebAppData");
    if (value) return value;
  }
  return "";
}

function rawTelegramUser(initData: string) {
  if (!initData) return undefined;
  try {
    const raw = new URLSearchParams(initData).get("user");
    if (!raw) return undefined;
    return JSON.parse(raw) as { id?: number; first_name?: string; last_name?: string; username?: string; language_code?: string; photo_url?: string };
  } catch {
    return undefined;
  }
}

export function telegramAuthLastError() {
  return lastTelegramAuthError;
}

export function telegramLaunchDiagnostic() {
  if (typeof window === "undefined") return { webApp: false, initDataLength: 0, telegramId: "", startParam: "", authError: lastTelegramAuthError };
  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  const rawInit = webApp?.initData || rawTelegramInitData();
  const rawUser = webApp?.initDataUnsafe?.user || rawTelegramUser(rawInit);
  return {
    webApp: Boolean(webApp),
    initDataLength: rawInit.length,
    telegramId: rawUser?.id ? String(rawUser.id) : "",
    startParam: telegramStartParam(),
    authError: lastTelegramAuthError,
  };
}

export function apiBase() {
  // Use the same-origin Next.js proxy so Telegram WebView/browser requests do not depend on CORS.
  return "/api/stage2";
}

export function sessionToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setSessionToken(token: string) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function selectedPlaceId() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(SELECTED_PLACE_KEY) ?? "";
}

export function selectedPlacePreview() {
  if (typeof window === "undefined") return null as Stage2Place | null;
  try {
    const raw = window.sessionStorage.getItem(SELECTED_PLACE_PREVIEW_KEY);
    return raw ? JSON.parse(raw) as Stage2Place : null;
  } catch {
    return null;
  }
}

export function setSelectedPlaceIdStorage(id: string) {
  if (typeof window === "undefined") return;
  if (id) window.sessionStorage.setItem(SELECTED_PLACE_KEY, id);
  else window.sessionStorage.removeItem(SELECTED_PLACE_KEY);
}

export function setSelectedPlacePreviewStorage(place: Stage2Place | null) {
  if (typeof window === "undefined") return;
  if (place) window.sessionStorage.setItem(SELECTED_PLACE_PREVIEW_KEY, JSON.stringify(place));
  else window.sessionStorage.removeItem(SELECTED_PLACE_PREVIEW_KEY);
}

async function stage2Request(path: string, init: RequestInit = {}, token = "") {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${apiBase()}${path.startsWith("/") ? path : `/${path}`}`, { ...init, headers, cache: "no-store" });
}

async function responseError(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const parsed = JSON.parse(text) as { message?: string | string[] };
    const message = Array.isArray(parsed.message) ? parsed.message.join(". ") : parsed.message;
    return message || text || `API ${response.status}`;
  } catch {
    return text || `API ${response.status}`;
  }
}

export async function stage2Fetch<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const authToken = token ?? sessionToken();
  const response = await stage2Request(path, init, authToken);
  if (!response.ok) throw new Error(await responseError(response));
  return response.json() as Promise<T>;
}


export async function waitForTelegramWebApp(timeoutMs = 2500) {
  if (typeof window === "undefined") return undefined;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const webApp = (window as TelegramWindow).Telegram?.WebApp;
    if (webApp) return webApp;
    await new Promise((resolve) => window.setTimeout(resolve, 75));
  }
  return (window as TelegramWindow).Telegram?.WebApp;
}

export function telegramStartParam() {
  if (typeof window === "undefined") return "";
  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  const fromTelegram = webApp?.initDataUnsafe?.start_param;
  let fromLaunch = "";
  let fromFallback = "";
  for (const params of telegramLaunchParams()) {
    fromLaunch ||= params.get("tgWebAppStartParam") || "";
    fromFallback ||= params.get("startapp") || params.get("start") || "";
  }
  return fromTelegram || fromLaunch || fromFallback || process.env.NEXT_PUBLIC_DEFAULT_QR_START_PARAM || "";
}

export function telegramLaunchKey() {
  if (typeof window === "undefined") return "";
  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  const initData = webApp?.initData || rawTelegramInitData();
  const params = new URLSearchParams(initData);
  const authDate = params.get("auth_date") || "";
  const queryId = params.get("query_id") || "";
  const hash = params.get("hash") || "";
  const user = webApp?.initDataUnsafe?.user || rawTelegramUser(initData);
  return [telegramStartParam(), authDate, queryId, user?.id ? String(user.id) : "", hash.slice(0, 16)].join(":");
}

export async function ensureTelegramSession(): Promise<{ token: string; user: Stage2User } | null> {
  if (typeof window === "undefined") return null;

  const webApp = await waitForTelegramWebApp();
  const rawInitAtLaunch = webApp?.initData || rawTelegramInitData();
  const launchUser = webApp?.initDataUnsafe?.user || rawTelegramUser(rawInitAtLaunch);
  const currentTelegramId = launchUser?.id ? String(launchUser.id) : "";
  const existing = sessionToken();
  if (existing) {
    try {
      const user = await stage2Fetch<Stage2User>("/me", {}, existing);
      const sessionTelegramId = String(user.telegram_id ?? "");
      if (!currentTelegramId || !sessionTelegramId || sessionTelegramId === currentTelegramId) {
        const launchProfileChanged = Boolean(launchUser && (
          (launchUser.photo_url && launchUser.photo_url !== user.photo_url)
          || (launchUser.first_name && launchUser.first_name !== user.first_name)
          || (launchUser.last_name && launchUser.last_name !== user.last_name)
          || (launchUser.username && launchUser.username !== user.telegram_username)
        ));
        const photoAttemptKey = `${PHOTO_HYDRATION_ATTEMPT_PREFIX}${currentTelegramId}`;
        const avatarAttempted = Boolean(currentTelegramId && window.sessionStorage.getItem(photoAttemptKey) === "1");
        const needsPhotoHydration = Boolean(currentTelegramId && !user.photo_url && !avatarAttempted);
        if (!launchProfileChanged && !needsPhotoHydration) return { token: existing, user };
        if (needsPhotoHydration) window.sessionStorage.setItem(photoAttemptKey, "1");
        // Re-run verified Telegram auth when Telegram supplied fresher profile data or once
        // when the backend still needs to hydrate the real Telegram avatar through Bot API.
        setSessionToken("");
      } else {
        // Telegram WebView/localStorage can keep an old session from another test account.
        // Never reuse it for partner QR access when the actual Telegram user changed.
        setSessionToken("");
      }
    } catch {
      setSessionToken("");
    }
  }

  const initData = rawInitAtLaunch;
  const parsedRawUser = rawTelegramUser(initData);
  const fallbackUser = webApp?.initDataUnsafe?.user ?? parsedRawUser ?? {
    id: 900000001,
    first_name: "Тестовий",
    last_name: "Користувач",
    username: "gid_tourist_test",
    language_code: "uk",
  };
  try {
    lastTelegramAuthError = "";
    const response = await stage2Request("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData, devUser: fallbackUser }),
    });
    if (!response.ok) throw new Error(await responseError(response));
    const result = await response.json() as { token: string; user: Stage2User };
    setSessionToken(result.token);
    return result;
  } catch (error) {
    lastTelegramAuthError = error instanceof Error ? error.message : "Невідома помилка Telegram авторизації";
    return null;
  }
}

export async function trackEvent(eventType: string, data: { regionId?: string; placeId?: string; payload?: Record<string, unknown> } = {}) {
  if (!sessionToken()) return;
  try {
    await stage2Fetch("/events", {
      method: "POST",
      body: JSON.stringify({ event_type: eventType, region_id: data.regionId, place_id: data.placeId, payload: data.payload ?? {} }),
    });
  } catch {
    // Analytics must never block navigation.
  }
}

export async function adminStage2Fetch<T>(path: string, adminKey = "", init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const savedAdminKey = typeof window !== "undefined" ? window.sessionStorage.getItem("gid-admin-key") || "" : "";
  if (adminKey || savedAdminKey) headers.set("x-admin-key", adminKey || savedAdminKey);
  if (sessionToken()) headers.set("authorization", `Bearer ${sessionToken()}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const response = await fetch(`/api/stage2-admin/${cleanPath}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    try {
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed.message || `API ${response.status}`);
    } catch (error) {
      if (error instanceof Error && error.message !== `Unexpected end of JSON input`) throw error;
      throw new Error(text || `API ${response.status}`);
    }
  }
  return response.json() as Promise<T>;
}
