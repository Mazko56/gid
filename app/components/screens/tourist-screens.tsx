"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import {
  Ambulance,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  BadgeCheck,
  Banknote,
  BedDouble,
  Bell,
  Bike,
  CalendarDays,
  CalendarRange,
  CarFront,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  CircleHelp,
  Clock3,
  Cross,
  ExternalLink,
  Flame,
  FlameKindling,
  Flower2,
  Footprints,
  Gift,
  Globe,
  Grid2X2,
  GripVertical,
  Gauge,
  Headset,
  Heart,
  Hotel,
  Info,
  Image as ImageIcon,
  LifeBuoy,
  Leaf,
  ListChecks,
  LocateFixed,
  LogOut,
  Map,
  MapPin,
  MessageCircle,
  MessageSquareMore,
  Minus,
  Moon,
  MoreVertical,
  MountainSnow,
  Navigation,
  PawPrint,
  Pencil,
  Phone,
  Pill,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Route,
  Save,
  Search,
  Send,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  SunMedium,
  TentTree,
  Timer,
  Trash2,
  UserRound,
  UsersRound,
  Utensils,
  WalletCards,
  Wifi,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EmergencyService } from "../../lib/emergency-services";
import type { RoleKey } from "../../lib/navigation";
import { RealMap } from "../real-map";
import { kyivBookingIso } from "../../lib/kyiv-time";
import { stage2Fetch, trackEvent, type Stage2Category, type Stage2EmergencyServicesResponse, type Stage2GeoDetails, type Stage2HotOffer, type Stage2PageContentResponse, type Stage2Place, type Stage2Weather } from "../../lib/stage2-api";
import { useTouristRuntime } from "../../lib/tourist-runtime";
import { tr, translateKnownLabel, type TouristLanguage } from "../../lib/tourist-i18n";
import { localizedField, localizedPageField, localizedSubcategory } from "../../lib/content-i18n";
import { touristInterfaceText } from "../../lib/tourist-ui-labels";
import { RealPlanScreen } from "./real-plan-screen";

function TouristText({ uk }: { uk: string }) {
  const { language } = useTouristRuntime();
  return <>{touristInterfaceText(language, uk)}</>;
}

type Navigate = (role: RoleKey, slug: string) => void;

type PhotoName =
  | "restaurant"
  | "coffee"
  | "store"
  | "pharmacy"
  | "hotel"
  | "pizza"
  | "burger"
  | "tub"
  | "sauna"
  | "pool"
  | "massage"
  | "excursion"
  | "jeep"
  | "quad"
  | "rafting"
  | "zipline"
  | "van";

const qrPattern = [
  "11111110101",
  "10000010110",
  "10111010101",
  "10111010010",
  "10111010111",
  "10000010010",
  "11111110101",
  "00010001110",
  "10101111001",
  "01110001110",
  "11001110101",
];

function Thumb({ name, className = "" }: { name: PhotoName; className?: string }) {
  return <span className={`gt-photo gt-photo--${name} ${className}`} aria-hidden="true" />;
}

function SearchBar({ placeholder, value, onChange }: { placeholder: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className="gt-search">
      <Search size={19} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </label>
  );
}

function Chips({ items, selected, onSelect, displayLabel }: { items: string[]; selected?: string; onSelect?: (item: string) => void; displayLabel?: (item: string) => string }) {
  return (
    <div className="gt-chips">
      {items.map((item, index) => {
        const active = selected !== undefined ? selected === item : index === 0;
        return (
          <button type="button" className={active ? "is-active" : ""} key={item} onClick={onSelect ? () => onSelect(item) : undefined}>
            {displayLabel ? displayLabel(item) : item}
          </button>
        );
      })}
    </div>
  );
}

// Keep the GPS city lookup shared across home and catalog strips: one reverse-geocode request
// per location, not one request for each screen visited in the Telegram Mini App.
const touristGeoCache = new globalThis.Map<string, { value: Stage2GeoDetails; at: number }>();
const touristGeoRequests = new globalThis.Map<string, Promise<Stage2GeoDetails>>();
const TOURIST_GEO_TTL = 30 * 60 * 1000;
function useTouristGeoDetails(lat: number | null, lng: number | null) {
  const valid = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);
  const key = valid ? `${lat!.toFixed(4)}:${lng!.toFixed(4)}` : "";
  const [state, setState] = useState<{ key: string; details: Stage2GeoDetails | null; failed: boolean }>({ key: "", details: null, failed: false });
  useEffect(() => {
    if (!key) { setState({ key: "", details: null, failed: false }); return; }
    let cancelled = false;
    const cached = touristGeoCache.get(key);
    if (cached && Date.now() - cached.at < TOURIST_GEO_TTL) {
      setState({ key, details: cached.value, failed: false });
      return;
    }
    setState({ key, details: null, failed: false });
    let pending = touristGeoRequests.get(key);
    if (!pending) {
      pending = stage2Fetch<Stage2GeoDetails>(`/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`);
      touristGeoRequests.set(key, pending);
      void pending.then((details) => { touristGeoCache.set(key, { value: details, at: Date.now() }); }).catch(() => undefined).finally(() => {
        if (touristGeoRequests.get(key) === pending) touristGeoRequests.delete(key);
      });
    }
    void pending.then((details) => { if (!cancelled) setState({ key, details, failed: false }); }).catch(() => {
      if (!cancelled) setState({ key, details: null, failed: true });
    });
    return () => { cancelled = true; };
  }, [key, lat, lng]);
  return { details: state.key === key ? state.details : null, failed: state.key === key && state.failed };
}

function MapStrip({ real = false, places = [] }: { real?: boolean; places?: Stage2Place[] } = {}) {
  const { context, location, language } = useTouristRuntime();
  const gpsPoint = location?.source === "gps" && !context ? location : null;
  const { details: gpsDetails, failed: gpsLookupFailed } = useTouristGeoDetails(gpsPoint?.lat ?? null, gpsPoint?.lng ?? null);
  const address = context?.place
    ? localizedField(language, context.place, "name", context.place.name)
    : context?.region.name || (gpsPoint
      ? gpsDetails?.city || gpsDetails?.region || (gpsLookupFailed ? tr(language, "Не вдалося визначити населений пункт", "Could not determine city", "Nie udało się ustalić miejscowości") : tr(language, "Визначаємо населений пункт…", "Finding your city…", "Ustalamy miejscowość…"))
      : tr(language, "Увімкніть геолокацію", "Enable location access", "Włącz lokalizację"));
  const center = location ?? (context ? { lat: Number(context.place?.lat ?? context.region.lat), lng: Number(context.place?.lng ?? context.region.lng), source: "qr" as const } : null);
  return (
    <div className={`gt-map-strip ${real ? "gt-map-strip--real" : ""}`.trim()}>
      {real && center ? <span className="gt-map-strip__map-layer"><RealMap center={center} places={places} radius={500} compact preferLeaflet className="gt-map-strip__live-map" /></span> : null}
      <div className="gt-map-strip__copy">
        <MapPin size={21} />
        <span>
          <small>{location?.source === "gps" ? tr(language, "Ваше місцезнаходження", "Your location", "Twoja lokalizacja") : tr(language, "Базова точка з QR", "QR base point", "Punkt bazowy QR")}</small>
          <strong>{address}</strong>
        </span>
      </div>
      {!real && <i className="gt-map-strip__road" />}
      {!real && <i className="gt-map-strip__river" />}
      {!real && <i className="gt-map-strip__dot" />}
    </div>
  );
}

function FoodMap() {
  const {language}=useTouristRuntime();
  const markers = [
    { left: "10%", top: "23%" },
    { left: "35%", top: "59%" },
    { left: "66%", top: "12%" },
    { left: "78%", top: "53%" },
    { left: "93%", top: "31%" },
  ];

  return (
    <div className="gt-food-map" aria-label={touristInterfaceText(language,"Карта рекомендованих закладів")}>
      <i className="gt-food-map__river" />
      <i className="gt-food-map__road gt-food-map__road--one" />
      <i className="gt-food-map__road gt-food-map__road--two" />
      {markers.map((marker, index) => (
        <span className="gt-food-map__marker" style={marker} key={index}><Utensils size={15} /></span>
      ))}
      <span className="gt-food-map__user" />
      <button type="button" aria-label={touristInterfaceText(language,"Показати моє місцезнаходження")}><LocateFixed size={21} /></button>
    </div>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  const {language}=useTouristRuntime();
  return (
    <div className="gt-section-title">
      <h2>{touristInterfaceText(language,title)}</h2>
      {action ? <button type="button">{touristInterfaceText(language,action)}</button> : null}
    </div>
  );
}

function WalkingIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      className="gt-walking-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="13" cy="4" r="2" fill="currentColor" stroke="none" />
      <path
        d="m10.5 21 1.2-6.3-2.8-2.2-2.1 3.1M12 8l3.1 2.2 2.8-.7M11.7 14.7l3 2.2 2 4.1M10.5 8.2 8.9 12.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WeatherSunIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`gt-weather-icon ${className}`.trim()} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.25" fill="currentColor" opacity="0.18" />
      <circle cx="12" cy="12" r="3.55" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.2v3.1M12 18.7v3.1M21.8 12h-3.1M5.3 12H2.2M18.8 5.2l-2.2 2.2M7.4 16.6l-2.2 2.2M18.8 18.8l-2.2-2.2M7.4 7.4 5.2 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WeatherRainIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`gt-weather-icon ${className}`.trim()} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.1 17.1c-2.4 0-4.4-1.7-4.4-4 0-2.1 1.7-3.8 3.9-4 .7-2.9 3.2-4.8 6.3-4.8 3.5 0 6.4 2.7 6.4 6.1 1.4.2 2.5 1.5 2.5 2.9 0 1.7-1.4 3.1-3.2 3.1H8.1Z" fill="currentColor" opacity="0.18" />
      <path d="M8.1 16.4c-2 0-3.6-1.4-3.6-3.3 0-1.7 1.3-3 3.1-3.2.6-2.8 2.8-4.8 5.8-4.8 3.3 0 5.9 2.4 5.9 5.5 1.4 0 2.5 1.1 2.5 2.5 0 1.7-1.4 3.3-3.1 3.3H8.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 18.2 8.1 20M13 18.2 12.1 20M17 18.2 16.1 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function WeatherWindIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`gt-weather-icon ${className}`.trim()} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9.1h10.7c1.7 0 2.9-1.1 2.9-2.5 0-1.3-1-2.3-2.4-2.3-1.2 0-2.2.8-2.4 1.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13.2h14.3c1.8 0 3.2 1.2 3.2 2.7 0 1.4-1.2 2.5-2.8 2.5-1.2 0-2.2-.7-2.6-1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17.3h7.2c1.3 0 2.3.8 2.3 1.9 0 1-.9 1.8-2 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WeatherSunsetIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`gt-weather-icon ${className}`.trim()} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 17.3h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.1 17.1a4.9 4.9 0 0 1 9.8 0" fill="currentColor" opacity="0.18" />
      <path d="M7.1 17.1a4.9 4.9 0 0 1 9.8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 6v3.2M5.4 10.2l2.3 1.3M18.6 10.2l-2.3 1.3M8.3 7.6 10 9.4M15.7 7.6 14 9.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


function CurrentPlaceSticker() {
  return (
    <svg className="gt-current-place-sticker" viewBox="0 0 56 70" fill="none" aria-hidden="true">
      <ellipse cx="28" cy="61" rx="17" ry="5" fill="#CBEBDD" />
      <ellipse cx="28" cy="61" rx="11" ry="2.8" fill="#FFFFFF" opacity="0.95" />
      <path d="M28 6c-9.7 0-17 7.1-17 16.6 0 12.2 12.2 21.4 16 25.9.5.7 1.5.7 2 0 3.8-4.5 16-13.7 16-25.9C45 13.1 37.7 6 28 6Z" fill="url(#pinGradient)"/>
      <path d="M28 8.7c-8.1 0-14.2 5.8-14.2 13.8 0 10.3 10.4 18.3 14.2 22.7 3.8-4.4 14.2-12.4 14.2-22.7 0-8-6.1-13.8-14.2-13.8Z" fill="#20B364"/>
      <circle cx="28" cy="22.5" r="7.6" fill="#FFFFFF"/>
      <defs>
        <linearGradient id="pinGradient" x1="28" y1="6" x2="28" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#28C56E"/>
          <stop offset="1" stopColor="#0EA154"/>
        </linearGradient>
      </defs>
    </svg>
  );
}


function googlePlaceId(place?: Stage2Place | null) {
  if (!place) return "";
  const fromDetails = typeof place.details?.google_place_id === "string" ? place.details.google_place_id.trim() : "";
  if (fromDetails) return fromDetails;
  return place.id.startsWith("google_") ? place.id.slice("google_".length) : "";
}

function hasGooglePhotoCandidate(place?: Stage2Place | null) {
  if (!place) return false;
  // Geoapify places now use only Geoapify/OSM/Wikimedia media. Do not fall back to Google Photo,
  // even when an old cached enrichment still contains a Google photo resource name.
  if (place.source === "geoapify" || place.attributes?.geoapify === true || place.id.startsWith("geoapify_")) return false;
  if (place.source === "google" || place.attributes?.google === true || place.id.startsWith("google_")) return true;
  const photoName = typeof place.details?.google_photo_name === "string" ? place.details.google_photo_name.trim() : "";
  return Boolean(photoName);
}

function isGeoapifyPlace(place?: Stage2Place | null) {
  return Boolean(place && (place.source === "geoapify" || place.attributes?.geoapify === true || place.id.startsWith("geoapify_")));
}

function isExternalPlace(place?: Stage2Place | null) {
  return Boolean(place && (place.source === "google" || place.attributes?.google === true || place.id.startsWith("google_") || isGeoapifyPlace(place)));
}

function adminCreatedPlacesOnly(items: Stage2Place[]) {
  return items.filter((place) => !isExternalPlace(place));
}

function placeRatingLabel(place?: Stage2Place | null, withCount = true) {
  const rating = Number(place?.rating ?? 0);
  if (!(rating > 0)) return "—";
  return withCount ? `${rating.toFixed(1)} (${Number(place?.review_count ?? 0)})` : rating.toFixed(1);
}

function phoneForPlace(place?: Stage2Place | null) {
  if (!place) return "";
  const details = place.details ?? {};
  const contacts = details.contacts && typeof details.contacts === "object" ? details.contacts as Record<string, unknown> : {};
  const candidates = [place.phone, details.phone, details.phone_number, details.contact_phone, contacts.phone, contacts.phone_number];
  return candidates.map((value) => typeof value === "string" ? value.trim() : "").find(Boolean) || "";
}

function telHref(phone: string) {
  const clean = phone.trim().replace(/[^+\d]/g, "");
  return clean ? `tel:${clean}` : undefined;
}

function placeHoursLabel(place?: Stage2Place | null, language: TouristLanguage = "uk") {
  if (!place) return tr(language, "Графік уточнюється", "Hours to be confirmed", "Godziny do ustalenia");
  if (place.work_hours?.always_open === true) return tr(language, "Цілодобово", "Open 24/7", "Całodobowo");
  const daily = place.work_hours?.daily as { from?: string; to?: string } | undefined;
  if (daily?.from && daily?.to) return `${daily.from}–${daily.to}`;
  const directWeekdays = Array.isArray(place.work_hours?.weekdayDescriptions) ? place.work_hours.weekdayDescriptions.map(String) : [];
  const detailWeekdays = Array.isArray(place.details?.google_weekday_descriptions) ? place.details.google_weekday_descriptions.map(String) : [];
  return directWeekdays[0] || detailWeekdays[0] || tr(language, "Графік уточнюється", "Hours to be confirmed", "Godziny do ustalenia");
}

function googleReviewsUri(place?: Stage2Place | null) {
  if (!place) return "";
  const details = place.details ?? {};
  const attributes = place.attributes ?? {};
  const direct = [details.google_reviews_uri, attributes.google_reviews_uri]
    .map((value) => typeof value === "string" ? value.trim() : "")
    .find(Boolean);
  if (direct) return direct;
  const placeId = googlePlaceId(place);
  return placeId ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name || place.address || `${place.lat},${place.lng}`)}&query_place_id=${encodeURIComponent(placeId)}` : "";
}

type GoogleReviewView = {
  author: string;
  rating: number;
  text: string;
  time: string;
  uri: string;
};

function googleReviewsForPlace(place?: Stage2Place | null): GoogleReviewView[] {
  const raw = Array.isArray(place?.details?.google_reviews)
    ? place.details.google_reviews as Array<Record<string, unknown>>
    : [];
  return raw.flatMap((review) => {
    const textObject = review.text && typeof review.text === "object" ? review.text as Record<string, unknown> : {};
    const originalTextObject = review.originalText && typeof review.originalText === "object" ? review.originalText as Record<string, unknown> : {};
    const authorObject = review.authorAttribution && typeof review.authorAttribution === "object" ? review.authorAttribution as Record<string, unknown> : {};
    const text = [textObject.text, originalTextObject.text, review.text]
      .map((value) => typeof value === "string" ? value.trim() : "")
      .find(Boolean) || "";
    if (!text) return [];
    const author = typeof authorObject.displayName === "string" && authorObject.displayName.trim()
      ? authorObject.displayName.trim()
      : "Відвідувач";
    const rating = Number(review.rating ?? 0);
    const time = typeof review.relativePublishTimeDescription === "string"
      ? review.relativePublishTimeDescription
      : typeof review.publishTime === "string" ? review.publishTime.slice(0, 10) : "";
    const uri = typeof review.googleMapsUri === "string" ? review.googleMapsUri : "";
    return [{ author, rating: Number.isFinite(rating) ? rating : 0, text, time, uri }];
  });
}

const GOOGLE_PLACE_DETAIL_CACHE_PREFIX = "gid-external-place-detail-v3:";
const GOOGLE_PLACE_DETAIL_CACHE_TTL_MS = 10 * 60 * 1000;

function googlePlaceDetailCacheKey(placeId: string, lat?: number, lng?: number) {
  const origin = Number.isFinite(lat) && Number.isFinite(lng) ? `${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}` : "no-origin";
  return `${GOOGLE_PLACE_DETAIL_CACHE_PREFIX}${placeId}:${origin}`;
}

function readGooglePlaceDetailCache(key: string) {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null as Stage2Place | null;
    const parsed = JSON.parse(raw) as { value?: Stage2Place; at?: number };
    if (parsed.value && Date.now() - Number(parsed.at || 0) < GOOGLE_PLACE_DETAIL_CACHE_TTL_MS) return parsed.value;
    window.sessionStorage.removeItem(key);
  } catch { /* cache is optional */ }
  return null;
}

function writeGooglePlaceDetailCache(key: string, value: Stage2Place) {
  try { window.sessionStorage.setItem(key, JSON.stringify({ value, at: Date.now() })); } catch { /* cache is optional */ }
}

const PLACE_CARD_ENRICH_CACHE_PREFIX = "gid-place-card-enrich-v4:";
const PLACE_CARD_ENRICH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function mergeStage2Place(base: Stage2Place, update: Stage2Place): Stage2Place {
  const updateRating = Number(update.rating ?? 0);
  const baseRating = Number(base.rating ?? 0);
  return {
    ...base,
    ...update,
    rating: updateRating > 0 ? updateRating : baseRating,
    review_count: Number(update.review_count ?? base.review_count ?? 0),
    image_url: update.image_url || base.image_url || null,
    work_hours: update.work_hours && Object.keys(update.work_hours).length ? update.work_hours : base.work_hours,
    attributes: { ...(base.attributes ?? {}), ...(update.attributes ?? {}) },
    details: { ...(base.details ?? {}), ...(update.details ?? {}) },
  };
}

function mergeStage2PlaceUpdates(current: Stage2Place[], updates: Stage2Place[]) {
  const byId = new globalThis.Map<string, Stage2Place>(updates.map((item) => [item.id, item]));
  return current.map((item) => {
    const update = byId.get(item.id);
    return update ? mergeStage2Place(item, update) : item;
  });
}

function readPlaceCardEnrichment(id: string) {
  try {
    const raw = window.sessionStorage.getItem(`${PLACE_CARD_ENRICH_CACHE_PREFIX}${id}`);
    if (!raw) return null as Stage2Place | null;
    const parsed = JSON.parse(raw) as { value?: Stage2Place; at?: number };
    if (parsed.value && Date.now() - Number(parsed.at || 0) < PLACE_CARD_ENRICH_CACHE_TTL_MS) return parsed.value;
    window.sessionStorage.removeItem(`${PLACE_CARD_ENRICH_CACHE_PREFIX}${id}`);
  } catch { /* cache is optional */ }
  return null;
}

function writePlaceCardEnrichment(value: Stage2Place) {
  try { window.sessionStorage.setItem(`${PLACE_CARD_ENRICH_CACHE_PREFIX}${value.id}`, JSON.stringify({ value, at: Date.now() })); } catch { /* cache is optional */ }
}

type PlaceStateUpdater = Dispatch<SetStateAction<Stage2Place[]>>;

async function enrichPlaceCardsProgressively(
  source: Stage2Place[],
  setPlaces: PlaceStateUpdater,
  isCancelled: () => boolean,
  seen: Set<string>,
) {
  const candidates = source.filter((place) => isGeoapifyPlace(place));
  for (let index = 0; index < candidates.length; index += 3) {
    if (isCancelled()) return;
    const batch = candidates.slice(index, index + 3).filter((place) => !seen.has(place.id));
    if (!batch.length) continue;
    batch.forEach((place) => seen.add(place.id));

    const cached: Stage2Place[] = [];
    const missing: Stage2Place[] = [];
    for (const place of batch) {
      const value = readPlaceCardEnrichment(place.id);
      if (value) cached.push(value);
      else missing.push(place);
    }
    if (cached.length && !isCancelled()) setPlaces((previous) => mergeStage2PlaceUpdates(previous, cached));

    if (missing.length) {
      try {
        const enriched = await stage2Fetch<Stage2Place[]>("/places/enrich", { method: "POST", body: JSON.stringify({ places: missing }) });
        if (isCancelled()) return;
        enriched.forEach(writePlaceCardEnrichment);
        setPlaces((previous) => mergeStage2PlaceUpdates(previous, enriched));
      } catch (error) {
        console.warn("[Place card enrichment]", error instanceof Error ? error.message : String(error));
      }
    }
    if (index + 3 < candidates.length) await new Promise((resolve) => window.setTimeout(resolve, missing.length ? 650 : 45));
  }
}

function revealPlacesProgressively(
  source: Stage2Place[],
  setPlaces: PlaceStateUpdater,
  isCancelled: () => boolean,
  batchSize = 3,
  intervalMs = 110,
) {
  if (!source.length) { setPlaces(() => []); return; }
  let count = Math.min(batchSize, source.length);
  const tick = () => {
    if (isCancelled()) return;
    setPlaces((previous) => {
      const previousById = new globalThis.Map<string, Stage2Place>(previous.map((place) => [place.id, place]));
      return source.slice(0, count).map((place) => {
        const existing = previousById.get(place.id);
        return existing ? mergeStage2Place(place, existing) : place;
      });
    });
    if (count >= source.length) return;
    count = Math.min(source.length, count + batchSize);
    window.setTimeout(tick, intervalMs);
  };
  tick();
}

function photoDiagnosticMessage(raw: string, status?: number, contentType?: string) {
  const clean = raw.replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();
  if (lower.includes("google_maps_server_api_key is not configured")) return "На сервері не налаштовано GOOGLE_MAPS_SERVER_API_KEY.";
  if (status === 403 || lower.includes("permission_denied") || lower.includes("forbidden") || lower.includes("api key")) return "Google заборонив доступ до фото (403). Перевірте API key, Places API (New), Billing та API restrictions.";
  if (status === 429 || lower.includes("resource_exhausted") || lower.includes("quota")) return "Вичерпано квоту Google Places / Place Photos (429). Перевірте Billing і ліміти API.";
  if (status === 404 || lower.includes("not found")) return "Google не знайшов це фото або ресурс фото вже недоступний (404).";
  if (lower.includes("has no photo") || lower.includes("no photo")) return "Для цього Place ID Google не повернув жодної фотографії.";
  if (lower.includes("invalid google photo name")) return "Google повернув некоректний ідентифікатор фотографії.";
  if (lower.includes("response is not an image")) return "Google відповів успішно, але повернув не зображення.";
  if (lower.includes("photo is empty")) return "Google повернув порожній файл фотографії.";
  if (status && status >= 500) return `Помилка сервера фото (HTTP ${status})${clean ? `: ${clean}` : "."}`;
  if (clean) return `Помилка фото${status ? ` (HTTP ${status})` : ""}: ${clean.slice(0, 220)}`;
  if (contentType && !contentType.toLowerCase().startsWith("image/")) return `Сервер повернув неправильний Content-Type: ${contentType}.`;
  return "Причину не вдалося визначити. Перевірте Google Places API та серверні логи.";
}

async function diagnoseRemoteImage(url: string) {
  try {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}diagnostic=1&_=${Date.now()}`, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      let message = body;
      try {
        const json = JSON.parse(body) as { message?: string | string[]; error?: string };
        if (Array.isArray(json.message)) message = json.message.join("; ");
        else if (typeof json.message === "string") message = json.message;
        else if (typeof json.error === "string") message = json.error;
      } catch { /* keep raw response text */ }
      return photoDiagnosticMessage(message, response.status, contentType);
    }
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength) return "Сервер повернув порожній файл фотографії.";
    if (!contentType.toLowerCase().startsWith("image/")) return photoDiagnosticMessage("", response.status, contentType);
    return `Сервер отримав фото (${contentType}, ${Math.max(1, Math.round(buffer.byteLength / 1024))} КБ), але Telegram/Safari не зміг його відобразити. Перевірте формат зображення та заголовки відповіді.`;
  } catch (error) {
    return `Не вдалося звернутися до сервісу фото: ${error instanceof Error ? error.message : "мережева помилка"}.`;
  }
}

function RemotePlaceImage({ url, alt = "", className, google = false, googlePlaceId: googleId = "", eager = false, fallback, diagnostics = false, diagnosticHint = "" }: { url?: string | null; alt?: string; className: string; google?: boolean; googlePlaceId?: string; eager?: boolean; fallback?: ReactNode; diagnostics?: boolean; diagnosticHint?: string }) {
  const {language}=useTouristRuntime();
  const fallbackUrl = google && googleId ? `/api/stage2/google/place-photo?id=${encodeURIComponent(googleId)}` : "";
  // Prefer the fresh photo resource already returned with Nearby Search / Place Details.
  // If it fails or is absent, fall back to resolving a fresh resource by stable Place ID.
  const candidates = (google ? [url || "", fallbackUrl] : [url || ""])
    .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [diagnostic, setDiagnostic] = useState("");
  const [diagnosing, setDiagnosing] = useState(false);
  useEffect(() => {
    setCandidateIndex(0);
    setDiagnostic("");
    setDiagnosing(false);
  }, [url, fallbackUrl]);
  const activeUrl = candidates[candidateIndex];

  const handleImageError = () => {
    const failedUrl = activeUrl;
    const nextIndex = candidateIndex + 1;
    setCandidateIndex(nextIndex);
    if (!diagnostics || nextIndex < candidates.length || !failedUrl) return;
    setDiagnosing(true);
    void diagnoseRemoteImage(failedUrl).then((message) => setDiagnostic(message)).finally(() => setDiagnosing(false));
  };

  if (activeUrl) return <img src={activeUrl} alt={alt} className={className} loading={eager ? "eager" : "lazy"} decoding="async" onError={handleImageError} />;
  if (google || diagnostics) return (
    <span className={`${className} gt-real-place-image-placeholder ${diagnostics ? "gt-real-place-image-placeholder--diagnostic" : ""}`} aria-label={touristInterfaceText(language,"Фото недоступне")}>
      <ImageIcon size={25} />
      {diagnostics ? <span className="gt-photo-diagnostic"><strong><TouristText uk="Фото не завантажилось"/></strong><small>{diagnosing ? "Перевіряємо причину…" : diagnostic || diagnosticHint || "Geoapify / Wikipedia / Openverse / Outscraper не повернули зображення для цієї локації."}</small></span> : null}
    </span>
  );
  return <>{fallback ?? <span className={`${className} gt-real-place-image-placeholder`}><ImageIcon size={25} /></span>}</>;
}

function PlaceRow({
  photo = "hotel",
  imageUrl,
  title,
  subtitle,
  rating,
  distance,
  walk,
  walking = false,
  verified = false,
  badges,
  tags = [],
  google = false,
  googlePlaceId: googleId = "",
  eager = false,
  onClick,
}: {
  photo?: PhotoName;
  imageUrl?: string | null;
  title: string;
  subtitle: string;
  rating: string;
  distance: string;
  walk: string;
  walking?: boolean;
  verified?: boolean;
  badges?: ReactNode;
  tags?: string[];
  google?: boolean;
  googlePlaceId?: string;
  eager?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="gt-place-row" onClick={onClick}>
      <RemotePlaceImage url={imageUrl} className="gt-photo gt-place-row__remote-photo" google={google} googlePlaceId={googleId} eager={eager} fallback={<Thumb name={photo} />} />
      <span className="gt-place-row__body">
        <span className="gt-place-row__title">
          <strong>{title}{verified ? <BadgeCheck className="gt-place-row__verified" size={15} /> : null}</strong>
          <b>{distance}</b>
        </span>
        <small>{subtitle}</small>
        {badges}
        <span className="gt-place-row__meta">
          <span>
            <Star size={14} fill="currentColor" /> {rating}
          </span>
          <span>{walking ? <WalkingIcon /> : "♙"} {walk}</span>
        </span>
        {tags.length ? (
          <span className="gt-place-row__tags">
            {tags.map((tag) => <i key={tag}>{tag}</i>)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function CategoryHeader({
  icon: Icon,
  title,
  subtitle,
  tone,
  onMap,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tone: string;
  onMap?: () => void;
}) {
  const { language } = useTouristRuntime();
  return (
    <div className="gt-category-head">
      <span className={`gt-category-head__icon gt-tone--${tone}`}>
        <Icon size={23} />
      </span>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <button type="button" onClick={onMap}>
        <Map size={21} />
        <span>{tr(language, "На мапі", "On map", "Na mapie")}</span>
      </button>
    </div>
  );
}

function MockQr() {
  const {language}=useTouristRuntime();
  return (
    <div className="gt-qr-code" aria-label={touristInterfaceText(language,"QR-код")}>
      {qrPattern.flatMap((row, rowIndex) =>
        row.split("").map((cell, cellIndex) => (
          <i
            key={`${rowIndex}-${cellIndex}`}
            className={cell === "1" ? "is-filled" : ""}
          />
        )),
      )}
      <span><MapPin size={21} /></span>
    </div>
  );
}

const categories: Array<{
  title: string;
  note: string;
  slug: string;
  tone: string;
  icon: LucideIcon;
}> = [
  { title: "Де купити", note: "Продуктові, промтовари та сувеніри", slug: "shop", tone: "shop", icon: ShoppingBag },
  { title: "Де поїсти", note: "Кафе, ресторани та колиби", slug: "catalog", tone: "food", icon: Utensils },
  { title: "Де відпочити", note: "Чани, сауни, басейни та масаж", slug: "available", tone: "rest", icon: Flower2 },
  { title: "Розваги", note: "Активності, екстрим та враження", slug: "entertainment", tone: "fun", icon: Bike },
  { title: "Що поруч", note: "Усі місця поруч за вашою локацією", slug: "nearby", tone: "nearby", icon: MapPin },
  { title: "Трансфер", note: "Таксі, трансфери та оренда авто", slug: "transfer", tone: "transfer", icon: CarFront },
  { title: "Халепа?", note: "Допомога, аптеки, поліція, лікарі", slug: "emergency", tone: "emergency", icon: LifeBuoy },
];

async function fetchOpenMeteoWeatherClient(lat: number, lng: number): Promise<Stage2Weather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: "temperature_2m,wind_speed_10m,weather_code",
    hourly: "precipitation_probability",
    daily: "sunset",
    forecast_days: "1",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Weather API ${response.status}`);
  const data = await response.json() as {
    current?: { time?: string; temperature_2m?: number; wind_speed_10m?: number; weather_code?: number };
    hourly?: { time?: string[]; precipitation_probability?: number[] };
    daily?: { sunset?: string[] };
  };
  const currentTime = String(data.current?.time ?? "");
  const currentHour = currentTime ? `${currentTime.slice(0, 13)}:00` : "";
  const hourIndexRaw = data.hourly?.time?.findIndex((item) => item === currentHour) ?? -1;
  const hourIndex = hourIndexRaw >= 0 ? hourIndexRaw : 0;
  const temperature = Number(data.current?.temperature_2m);
  const wind = Number(data.current?.wind_speed_10m);
  if (!Number.isFinite(temperature) || !Number.isFinite(wind)) throw new Error("Weather API returned incomplete data");
  return {
    temperature_c: temperature,
    precipitation_probability: Number(data.hourly?.precipitation_probability?.[hourIndex] ?? 0) || 0,
    wind_speed_kmh: wind,
    sunset: String(data.daily?.sunset?.[0] ?? ""),
    weather_code: Number(data.current?.weather_code ?? 0),
    observed_at: currentTime,
  };
}

function HomeScreen({ navigate }: { navigate: Navigate }) {
  const { context, language, location } = useTouristRuntime();
  const contextPlace = context?.place;
  const placeLat = Number(contextPlace?.lat);
  const placeLng = Number(contextPlace?.lng);
  const regionLat = Number(context?.region.lat);
  const regionLng = Number(context?.region.lng);
  const hasValidPlaceCoords = Number.isFinite(placeLat) && Number.isFinite(placeLng) && !(placeLat === 0 && placeLng === 0);
  const gpsActive = location?.source === "gps" && Number.isFinite(location.lat) && Number.isFinite(location.lng);
  const scanLat = gpsActive ? Number(location.lat) : (hasValidPlaceCoords ? placeLat : regionLat);
  const scanLng = gpsActive ? Number(location.lng) : (hasValidPlaceCoords ? placeLng : regionLng);
  const [weather, setWeather] = useState<Stage2Weather | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const { details: geoDetails, failed: geoLookupFailed } = useTouristGeoDetails(gpsActive ? scanLat : null, gpsActive ? scanLng : null);
  const [adminCategories, setAdminCategories] = useState<Stage2Category[]>([]);
  const qrRegionName = language === "en" ? (context?.region.nameEn || context?.region.name || "") : language === "pl" ? (context?.region.namePl || context?.region.name || "") : (context?.region.name || "");
  const regionName = contextPlace
    ? localizedField(language, contextPlace, "name", contextPlace.name)
    : context ? qrRegionName
    : gpsActive ? (geoDetails?.city || geoDetails?.region || (geoLookupFailed ? `${scanLat.toFixed(5)}, ${scanLng.toFixed(5)}` : tr(language, "Визначаємо населений пункт…", "Finding your city…", "Ustalamy miejscowość…")))
    : tr(language, "Увімкніть геолокацію", "Enable location access", "Włącz lokalizację");

  useEffect(() => {
    let cancelled = false;
    // Telegram frequently sends focus/visibility events while opening a QR Mini App.
    // Reuse recent public category data instead of sending another request on every event.
    const cacheKey = "gid-tourist-categories-cache";
    const refreshIntervalMs = 2 * 60 * 1000;
    let lastFetchedAt = 0;
    let inFlight = false;
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw) as { value?: Stage2Category[]; at?: number };
        if (Array.isArray(cached.value) && Number(cached.at) > Date.now() - refreshIntervalMs) {
          setAdminCategories(cached.value);
          lastFetchedAt = Number(cached.at);
        }
      }
    } catch { /* public category cache is optional */ }
    const loadCategories = () => {
      if (inFlight || Date.now() - lastFetchedAt < refreshIntervalMs) return;
      inFlight = true;
      void stage2Fetch<Stage2Category[]>("/categories")
        .then((items) => {
          if (cancelled) return;
          setAdminCategories(items);
          lastFetchedAt = Date.now();
          try { window.sessionStorage.setItem(cacheKey, JSON.stringify({ value: items, at: lastFetchedAt })); } catch { /* optional */ }
        })
        .catch(() => { /* keep current labels when API is temporarily unavailable */ })
        .finally(() => { inFlight = false; });
    };
    const onVisible = () => { if (document.visibilityState === "visible") loadCategories(); };
    loadCategories();
    window.addEventListener("focus", loadCategories);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadCategories);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!Number.isFinite(scanLat) || !Number.isFinite(scanLng)) return;
    let cancelled = false;
    setWeatherFailed(false);
    const cacheKey = `gid-weather:${scanLat.toFixed(3)}:${scanLng.toFixed(3)}`;
    let hasFreshCache = false;
    try {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { value?: Stage2Weather; at?: number };
        if (parsed.value && Date.now() - Number(parsed.at || 0) < 10 * 60 * 1000) { hasFreshCache = true; setWeather(parsed.value); }
      }
    } catch { /* weather cache is optional */ }
    if (hasFreshCache) return; // Weather is already no older than 10 minutes; do not refetch on each QR/home opening.
    setWeather(null);
    const saveWeather = (value: Stage2Weather) => {
      if (cancelled) return;
      setWeather(value);
      setWeatherFailed(false);
      try {
        window.sessionStorage.setItem(cacheKey, JSON.stringify({ value, at: Date.now() }));
        window.localStorage.setItem(cacheKey, JSON.stringify({ value, at: Date.now() }));
      } catch { /* optional cache */ }
    };
    void stage2Fetch<Stage2Weather>(`/weather?lat=${encodeURIComponent(String(scanLat))}&lng=${encodeURIComponent(String(scanLng))}`)
      .then(saveWeather)
      .catch(async () => {
        // If Railway cannot reach the weather endpoint, use Open-Meteo directly from the Mini App.
        try {
          const value = await fetchOpenMeteoWeatherClient(scanLat, scanLng);
          saveWeather(value);
        } catch {
          if (cancelled) return;
          try {
            const stale = window.localStorage.getItem(cacheKey);
            if (stale) {
              const parsed = JSON.parse(stale) as { value?: Stage2Weather };
              if (parsed.value) { setWeather(parsed.value); setWeatherFailed(false); return; }
            }
          } catch { /* no stale cache */ }
          setWeatherFailed(true);
        }
      });
    return () => { cancelled = true; };
  }, [scanLat, scanLng]);

  const weatherCode = Number(weather?.weather_code ?? -1);
  const weatherLabel = weatherCode < 0
    ? (language === "en" ? "Weather" : language === "pl" ? "Pogoda" : "Погода")
    : weatherCode <= 1
      ? (language === "en" ? "Clear" : language === "pl" ? "Słonecznie" : "Ясно")
      : weatherCode <= 3
        ? (language === "en" ? "Cloudy" : language === "pl" ? "Pochmurno" : "Хмарно")
        : weatherCode === 45 || weatherCode === 48
          ? (language === "en" ? "Fog" : language === "pl" ? "Mgła" : "Туман")
          : weatherCode >= 71 && weatherCode <= 77
            ? (language === "en" ? "Snow" : language === "pl" ? "Śnieg" : "Сніг")
            : weatherCode >= 95
              ? (language === "en" ? "Storm" : language === "pl" ? "Burza" : "Гроза")
              : (language === "en" ? "Rain" : language === "pl" ? "Deszcz" : "Дощ");
  const WeatherConditionIcon = weatherCode === 2 ? CloudSun
    : weatherCode === 3 || weatherCode < 0 ? Cloud
    : weatherCode === 45 || weatherCode === 48 ? CloudFog
    : (weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86 ? CloudSnow
    : weatherCode >= 95 ? CloudLightning
    : CloudRain;
  const sunsetTime = weather?.sunset?.includes("T") ? weather.sunset.slice(11, 16) : (weather?.sunset || "—");
  const observedTime = weather?.observed_at?.includes("T") ? weather.observed_at.slice(11, 16) : "—";
  const localizedCategories = categories.map((item) => {
    const categorySlugByScreen: Record<string, string> = { shop: "shop", catalog: "food", available: "rest", entertainment: "entertainment" };
    const managedCategory = adminCategories.find((category) => category.slug === categorySlugByScreen[item.slug]);
    const managedTitle = managedCategory
      ? (language === "en" ? (managedCategory.name_en || managedCategory.name) : language === "pl" ? (managedCategory.name_pl || managedCategory.name) : managedCategory.name)
      : "";
    const en: Record<string, [string, string]> = {
      shop: ["Shopping", "Groceries, goods and souvenirs"], catalog: ["Food", "Cafes, restaurants and kolybas"], available: ["Relax", "Tubs, saunas, pools and massage"],
      entertainment: ["Entertainment", "Activities and impressions"], nearby: ["Nearby", "Places around your location"], transfer: ["Transfer", "Taxi, transfers and car rental"], emergency: ["Emergency", "Help, pharmacies, police, doctors"],
    };
    const pl: Record<string, [string, string]> = {
      shop: ["Zakupy", "Produkty, towary i pamiątki"], catalog: ["Gdzie zjeść", "Kawiarnie, restauracje i karczmy"], available: ["Wypoczynek", "Banie, sauny, baseny i masaż"],
      entertainment: ["Rozrywka", "Aktywności i wrażenia"], nearby: ["W pobliżu", "Miejsca wokół twojej lokalizacji"], transfer: ["Transfer", "Taxi, transfery i wynajem auta"], emergency: ["Pomoc", "Apteki, policja, lekarze"],
    };
    const copy = language === "en" ? en[item.slug] : language === "pl" ? pl[item.slug] : undefined;
    if (managedTitle) return { ...item, title: managedTitle, note: copy?.[1] || item.note };
    return copy ? { ...item, title: copy[0], note: copy[1] } : item;
  });

  return (
    <div className="tourist-screen gt-screen gt-home-screen">
      <section className="gt-home-hero">
        <div className="gt-home-hero__copy">
          <p>{language === "en" ? "Welcome to" : language === "pl" ? "Witamy w" : "Вітаємо в"}</p>
          <h1>{regionName}</h1>
        </div>

        <div className="gt-weather gt-weather--reference">
          <div className="gt-weather-item gt-weather-item--sun">
            {weatherCode >= 0 && weatherCode <= 1 ? <WeatherSunIcon className="gt-weather-icon--sun" /> : <WeatherConditionIcon className="gt-weather-icon gt-weather-icon--condition" aria-hidden="true" />}
            <span><strong>{weather ? `${Math.round(weather.temperature_c)}°C` : "—"}</strong><small className="gt-weather-label gt-weather-label--clear">{weatherLabel}</small></span>
          </div>
          <div className="gt-weather-item gt-weather-item--rain">
            <WeatherRainIcon className="gt-weather-icon--rain" />
            <span><strong>{weather ? `${Math.round(weather.precipitation_probability)}%` : "—"}</strong><small className="gt-weather-label gt-weather-label--rain">{language === "en" ? "Rain chance" : language === "pl" ? "Szansa deszczu" : "Імовірність дощу"}</small></span>
          </div>
          <div className="gt-weather-item gt-weather-item--wind">
            <WeatherWindIcon className="gt-weather-icon--wind" />
            <span><strong>{weather ? `${Math.round(weather.wind_speed_kmh)} ${language === "uk" ? "км/год" : "km/h"}` : "—"}</strong><small className="gt-weather-label gt-weather-label--wind">{language === "en" ? "Wind" : language === "pl" ? "Wiatr" : "Вітер"}</small></span>
          </div>
          <div className="gt-weather-item gt-weather-item--sunset">
            <WeatherSunsetIcon className="gt-weather-icon--sunset" />
            <span><strong>{sunsetTime}</strong><small className="gt-weather-label gt-weather-label--sunset">{language === "en" ? "Sunset" : language === "pl" ? "Zachód" : "Захід сонця"}</small></span>
          </div>
          <small className="gt-weather-updated">{weather ? (language === "en" ? `Updated ${observedTime}` : language === "pl" ? `Aktualizacja ${observedTime}` : `Оновлено ${observedTime}`) : weatherFailed ? (language === "en" ? "Weather unavailable" : language === "pl" ? "Pogoda niedostępna" : "Погода недоступна") : (language === "en" ? "Loading weather…" : language === "pl" ? "Wczytywanie pogody…" : "Завантажуємо погоду…")}</small>
        </div>
      </section>

      {context ? <button
        type="button"
        className="gt-hotel-summary gt-hotel-summary--reference"
        onClick={() => navigate("tourist", "about")}
      >
        <span className="gt-current-place-pin" aria-hidden="true"><CurrentPlaceSticker /></span>
        <span className="gt-current-place-copy">
          <strong>{tr(language, "Ваше місцезнаходження", "Your location", "Twoja lokalizacja")}</strong>
          <small>{contextPlace ? localizedField(language, contextPlace, "name", contextPlace.name) : qrRegionName || tr(language, "Визначаємо місце…", "Finding location…", "Ustalamy lokalizację…")}</small>
          {contextPlace ? <b><Star size={14} fill="currentColor" /> {Number(contextPlace.rating || 0).toFixed(1)} · {contextPlace.review_count || 0} {language === "en" ? "reviews" : language === "pl" ? "opinii" : "відгуків"}</b> : <b>{language === "en" ? "Loading QR context…" : language === "pl" ? "Wczytywanie kontekstu QR…" : "Завантажуємо контекст QR…"}</b>}
        </span>
        {contextPlace?.image_url ? <img src={contextPlace.image_url} alt="" className="gt-photo gt-current-place-photo gt-current-place-photo--remote" /> : <span className="gt-current-place-photo gt-current-place-photo--empty" aria-hidden="true" />}
        <i>{language === "en" ? "Details" : language === "pl" ? "Szczegóły" : "Деталі"}</i>
      </button> : <button type="button" className="gt-hotel-summary gt-hotel-summary--reference" onClick={() => navigate("tourist", "nearby")}>
        <span className="gt-current-place-pin gt-current-place-pin--gps" aria-hidden="true"><MapPin size={26}/></span>
        <span className="gt-current-place-copy"><strong>{tr(language,"Ваше місцезнаходження","Your location","Twoja lokalizacja")}</strong>
        <small>{gpsActive ? (geoDetails?.city || geoDetails?.region || (geoLookupFailed ? tr(language,"Не вдалося визначити населений пункт","Could not determine city","Nie udało się ustalić miejscowości") : tr(language,"Визначаємо населений пункт…","Finding your city…","Ustalamy miejscowość…"))) : tr(language,"Дозвольте геолокацію, щоб побачити місця поруч","Allow location to see nearby places","Zezwól na lokalizację, aby zobaczyć pobliskie miejsca")}</small></span>
        <i>{tr(language,"На карту","Map","Mapa")}</i>
      </button>}

      <div className="gt-category-grid">
        {localizedCategories.map(({ title, note, slug, tone, icon: Icon }) => (
          <button
            type="button"
            className="gt-category-card"
            key={slug}
            onClick={() => { void trackEvent("category_opened", { regionId: context?.region.id, payload: { category: slug } }); navigate("tourist", slug); }}
          >
            <span className={`gt-category-card__icon gt-tone--${tone}`}><Icon size={23} /></span>
            <span>
              <strong>{title}</strong>
              <small>{note}</small>
            </span>
          </button>
        ))}
        <button
          type="button"
          className="gt-category-card gt-category-card--featured"
          onClick={() => navigate("tourist", "hot-offers")}
        >
          <span className="gt-category-card__icon"><FlameKindling size={24} /></span>
          <span>
            <strong>{language === "en" ? "Hot offer" : language === "pl" ? "Gorąca oferta" : "Гаряча пропозиція"}</strong>
            <small>{language === "en" ? "Current discounts" : language === "pl" ? "Aktualne zniżki" : "Актуальні знижки"}</small>
          </span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

type HotOffer = {
  id: string;
  photo: PhotoName;
  category: string;
  title: string;
  discount: string;
  description: string;
  validity: string;
  badge: string;
  badgeTone: "gold" | "green" | "red";
  detail: string;
  categorySlug?: string;
  imageUrl?: string | null;
  placeId?: string | null;
  placeRating?: number | null;
  placeReviewCount?: number;
  source?: Stage2HotOffer;
};

const hotOffers: HotOffer[] = [
  {
    id: "hutsul-restaurant",
    photo: "restaurant",
    category: "РЕСТОРАН",
    title: "Гуцульська колиба",
    discount: "-20%",
    description: "-20% на основне меню",
    validity: "Сьогодні до 22:00",
    badge: "Топ ★",
    badgeTone: "gold",
    detail: "Скуштуйте традиційні карпатські страви зі знижкою 20% на основне меню. Пропозиція діє для гостей Gid Tourist при показі QR-коду.",
  },
  {
    id: "spa-karpaty",
    photo: "sauna",
    category: "СПА",
    title: "Spa Карпати",
    discount: "-25%",
    description: "-25% на SPA-послуги",
    validity: "Лише цього тижня",
    badge: "Рекомендація 👍",
    badgeTone: "green",
    detail: "Знижка 25% на вибрані SPA-процедури, сауну та релакс-зону. Попереднє бронювання рекомендоване.",
  },
  {
    id: "river-tub",
    photo: "tub",
    category: "ВІДПОЧИНОК",
    title: "Чан біля річки",
    discount: "2 за 1",
    description: "2 години за ціною 1",
    validity: "До 17 липня",
    badge: "Обмежено 🔥",
    badgeTone: "red",
    detail: "Забронюйте дві години відпочинку в чані та сплатіть лише за одну. Пропозиція діє у визначені часові слоти.",
  },
  {
    id: "bike-rental",
    photo: "jeep",
    category: "АКТИВНИЙ ВІДПОЧИНОК",
    title: "Прокат велосипедів",
    discount: "-15%",
    description: "-15% на оренду",
    validity: "Для гостей регіону",
    badge: "Рекомендація 👍",
    badgeTone: "green",
    detail: "Знижка 15% на оренду велосипедів для прогулянок гірськими маршрутами. Шолом входить у вартість.",
  },
  {
    id: "souvenirs",
    photo: "store",
    category: "СУВЕНІРИ",
    title: "Сувеніри Карпат",
    discount: "🎁",
    description: "Подарунок при покупці",
    validity: "Акція дня",
    badge: "Топ ★",
    badgeTone: "gold",
    detail: "Отримайте невеликий карпатський подарунок при покупці від 500 грн у партнерському магазині сувенірів.",
  },
];

const HOT_OFFER_STORAGE_KEY = "gid-tourist-selected-hot-offer";
const HOT_OFFER_PREVIEW_STORAGE_KEY = "gid-tourist-selected-hot-offer-preview";

function hotOfferPhoto(categorySlug?: string | null): PhotoName {
  if (categorySlug === "food") return "restaurant";
  if (categorySlug === "shop") return "store";
  if (categorySlug === "rest") return "tub";
  if (categorySlug === "entertainment") return "jeep";
  if (categorySlug === "transfer") return "van";
  if (categorySlug === "hotel") return "hotel";
  return "restaurant";
}

function formatOfferValidity(item: Stage2HotOffer, language: TouristLanguage) {
  if (localizedField(language,item,"validity").trim()) return localizedField(language,item,"validity");
  const until = item.valid_until ? new Date(item.valid_until) : null;
  if (until && Number.isFinite(until.getTime())) return tr(language,"До","Until","Do")+` ${until.toLocaleDateString(language==="en"?"en-GB":language==="pl"?"pl-PL":"uk-UA")}`;
  return tr(language,"Актуальна пропозиція","Current offer","Aktualna oferta");
}

function mapHotOffer(item: Stage2HotOffer,language:TouristLanguage): HotOffer {
  const tone = item.badge_tone === "gold" || item.badge_tone === "red" ? item.badge_tone : "green";
  return {
    id: item.id,
    photo: hotOfferPhoto(item.category_slug),
    category: localizedField(language,item,"category_label",item.category_slug||tr(language,"ПРОПОЗИЦІЯ","OFFER","OFERTA")).toUpperCase(),
    categorySlug: item.category_slug || undefined,
    title: localizedField(language,item,"title"),
    discount: localizedField(language,item,"discount",tr(language,"Акція","Offer","Promocja")),
    description: localizedField(language,item,"description",localizedField(language,item,"detail",tr(language,"Спеціальна пропозиція","Special offer","Oferta specjalna"))),
    validity: formatOfferValidity(item,language),
    badge: localizedField(language,item,"badge",tr(language,"Актуально","Current","Aktualne")),
    badgeTone: tone,
    detail: localizedField(language,item,"detail",localizedField(language,item,"description",tr(language,"Спеціальна пропозиція від партнера Gid Tourist.","Special offer from a Gid Tourist partner.","Oferta specjalna partnera Gid Tourist."))),
    imageUrl: item.image_url || null,
    placeId: item.place_id || null,
    placeRating: item.place_rating ?? null,
    placeReviewCount: item.place_review_count ?? 0,
    source: item,
  };
}

function selectHotOffer(offer: HotOffer, navigate: Navigate) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(HOT_OFFER_STORAGE_KEY, offer.id);
    window.localStorage.setItem(HOT_OFFER_PREVIEW_STORAGE_KEY, JSON.stringify(offer));
  }
  navigate("tourist", "hot-offer-detail");
}

function readSelectedHotOffer() {
  if (typeof window === "undefined") return hotOffers[0];
  try {
    const raw = window.localStorage.getItem(HOT_OFFER_PREVIEW_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as HotOffer;
  } catch { /* preserve the original static fallback */ }
  const selectedId = window.localStorage.getItem(HOT_OFFER_STORAGE_KEY);
  return hotOffers.find((offer) => offer.id === selectedId) ?? hotOffers[0];
}


const hotOfferCategories: Array<{ label: string; icon: LucideIcon; tone: string; slug: string }> = [
  { label: "Де поїсти", icon: Utensils, tone: "orange", slug: "food" },
  { label: "Де купити", icon: ShoppingBag, tone: "blue", slug: "shop" },
  { label: "Де відпочити", icon: TentTree, tone: "green", slug: "rest" },
  { label: "Розваги", icon: Sparkles, tone: "purple", slug: "entertainment" },
  { label: "Трансфер", icon: CarFront, tone: "cyan", slug: "transfer" },
  { label: "Проживання", icon: BedDouble, tone: "yellow", slug: "hotel" },
];

function HotOfferMosaic({ primary }: { primary: PhotoName }) {
  const sets: Record<PhotoName, PhotoName[]> = {
    restaurant: ["restaurant", "coffee", "store", "burger", "tub", "pool", "jeep", "van"],
    coffee: ["coffee", "restaurant", "store", "pizza", "burger", "tub", "pool", "van"],
    store: ["store", "restaurant", "coffee", "pool", "jeep", "burger", "tub", "van"],
    pharmacy: ["pharmacy", "store", "restaurant", "pool", "jeep", "burger", "coffee", "van"],
    hotel: ["hotel", "restaurant", "coffee", "tub", "pool", "van", "burger", "store"],
    pizza: ["pizza", "coffee", "restaurant", "burger", "tub", "pool", "van", "store"],
    burger: ["burger", "restaurant", "coffee", "pizza", "tub", "pool", "van", "store"],
    tub: ["tub", "sauna", "pool", "restaurant", "burger", "jeep", "van", "hotel"],
    sauna: ["sauna", "tub", "pool", "restaurant", "coffee", "hotel", "van", "burger"],
    pool: ["pool", "tub", "sauna", "restaurant", "coffee", "van", "hotel", "burger"],
    massage: ["massage", "sauna", "pool", "tub", "restaurant", "coffee", "hotel", "van"],
    excursion: ["excursion", "jeep", "quad", "rafting", "zipline", "restaurant", "pool", "van"],
    jeep: ["jeep", "restaurant", "coffee", "tub", "pool", "van", "excursion", "hotel"],
    quad: ["quad", "jeep", "rafting", "zipline", "restaurant", "pool", "van", "hotel"],
    rafting: ["rafting", "excursion", "jeep", "quad", "zipline", "restaurant", "pool", "hotel"],
    zipline: ["zipline", "rafting", "excursion", "quad", "jeep", "restaurant", "pool", "hotel"],
    van: ["van", "hotel", "restaurant", "coffee", "store", "tub", "pool", "jeep"],
  };
  const tiles = sets[primary] ?? sets.restaurant;
  return (
    <span className="gt-hot-mosaic" aria-hidden="true">
      {tiles.map((name, index) => (
        <Thumb key={`${name}-${index}`} name={name} className={`gt-hot-mosaic__tile is-${index + 1}`} />
      ))}
    </span>
  );
}

function HotOffersScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const [offers, setOffers] = useState<HotOffer[]>([]);
  const [pageContent, setPageContent] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (!runtime.context) return;
    let cancelled = false;
    const loadOffers = () => {
      void Promise.all([
        stage2Fetch<Stage2HotOffer[]>(`/offers?region_id=${encodeURIComponent(runtime.context!.region.id)}`),
        stage2Fetch<Stage2PageContentResponse>(`/page-content/hot_offers?region_id=${encodeURIComponent(runtime.context!.region.id)}`),
      ]).then(([items, contentPayload]) => {
        if (cancelled) return;
        setOffers(items.map(item=>mapHotOffer(item,runtime.language)));
        const raw = contentPayload.content || {};
        setPageContent(Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")])));
      }).catch(() => {
        if (!cancelled) setOffers([]);
      });
    };
    const onVisibility = () => { if (document.visibilityState === "visible") loadOffers(); };
    loadOffers();
    window.addEventListener("focus", loadOffers);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { cancelled = true; window.removeEventListener("focus", loadOffers); document.removeEventListener("visibilitychange", onVisibility); };
  }, [runtime.context,runtime.language]);

  const visibleOffers = offers.filter((offer) => {
    if (activeCategory && offer.categorySlug !== activeCategory) return false;
    const needle = query.trim().toLocaleLowerCase("uk");
    return !needle || [offer.title, offer.description, offer.category].join(" ").toLocaleLowerCase("uk").includes(needle);
  });

  return (
    <div className="tourist-screen gt-screen gt-hot-offers-screen gt-hot-offers-screen--reference">
      <section className="gt-hot-offers-reference-hero">
        <span
          className="gt-hot-offers-reference-hero__banner"
          aria-hidden="true"
          style={pageContent.banner_image_url ? { backgroundImage: `url("${pageContent.banner_image_url.replaceAll('"', "%22")}")` } : undefined}
        />
        <div className="gt-hot-offers-reference-hero__overlay" />
        <span className="gt-hot-offers-reference-hero__discount">{localizedPageField(runtime.language,pageContent,"discount_label",{uk:"до",en:"up to",pl:"do"})}<br /><b>{pageContent.discount_value || "-30%"}</b></span>
        <div className="gt-hot-offers-reference-hero__copy">
          <h1 style={{ whiteSpace: "pre-line" }}>{localizedPageField(runtime.language,pageContent,"title",{uk:"Вигідні пропозиції\nдля вашого відпочинку",en:"Great deals\nfor your holiday",pl:"Korzystne oferty\nna Twój wypoczynek"})}</h1>
          <p style={{ whiteSpace: "pre-line" }}>{localizedPageField(runtime.language,pageContent,"subtitle",{uk:"Спеціальні знижки\nвід перевірених партнерів 💚",en:"Special discounts\nfrom verified partners 💚",pl:"Wyjątkowe zniżki\nod sprawdzonych partnerów 💚"})}</p>
        </div>
        <div className="gt-hot-offers-reference-hero__dots"><i className="is-active" /><i /></div>
      </section>

      <SearchBar placeholder={localizedPageField(runtime.language,pageContent,"search_placeholder",{uk:"Пошук місць, маршрутів, активностей...",en:"Search places, routes and activities...",pl:"Szukaj miejsc, tras i atrakcji..."})} value={query} onChange={setQuery} />

      <div className="gt-hot-offers-reference-categories">
        {hotOfferCategories.map(({ label, icon: Icon, tone, slug }) => (
          <button type="button" key={label} className={`gt-hot-offers-reference-category is-${tone} ${activeCategory === slug ? "is-active" : ""}`.trim()} onClick={() => setActiveCategory((current) => current === slug ? "" : slug)}>
            <span><Icon size={25} /></span>
            <small>{translateKnownLabel(runtime.language,label)}</small>
          </button>
        ))}
      </div>

      <MapStrip />

      <SectionTitle title={localizedPageField(runtime.language,pageContent,"section_title",{uk:"Пропозиції поруч",en:"Offers nearby",pl:"Oferty w pobliżu"})} action={`${visibleOffers.length}`} />

      <section className="gt-hot-offers-reference-list">
        {visibleOffers.map((offer) => (
          <button type="button" className="gt-hot-offers-reference-row" key={offer.id} onClick={() => selectHotOffer(offer, navigate)}>
            {offer.imageUrl ? <span className="gt-hot-mosaic gt-hot-mosaic--real"><img src={offer.imageUrl} alt="" loading="lazy" /></span> : <HotOfferMosaic primary={offer.photo} />}
            <span className={`gt-hot-offers-reference-row__discount ${offer.discount === "2 за 1" ? "is-text-deal" : ""}`}>{offer.discount}</span>
            <span className="gt-hot-offers-reference-row__body">
              <small>{offer.category}</small>
              <strong>{offer.title}</strong>
              <span>{offer.description}</span>
              <i><Clock3 size={15} /> {offer.validity}</i>
            </span>
            <em className={`gt-hot-offers-reference-row__badge is-${offer.badgeTone}`}>{offer.badge}</em>
            <ChevronRight size={22} className="gt-hot-offers-reference-row__arrow" />
          </button>
        ))}
        {!visibleOffers.length ? <div className="gt-stage2-empty">{tr(runtime.language,"Активних пропозицій за цим фільтром немає","No active offers match this filter","Brak aktywnych ofert dla tego filtra")}</div> : null}
      </section>
    </div>
  );
}

function HotOfferDetailScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const [offer, setOffer] = useState<HotOffer>(hotOffers[0]);

  useEffect(() => {
    const current=readSelectedHotOffer();
    setOffer(current.source ? mapHotOffer(current.source,runtime.language) : current);
  }, [runtime.language]);

  return (
    <div className="tourist-screen gt-screen gt-hot-offer-detail-screen">
      <section className="gt-hot-offer-detail-hero">
        {offer.imageUrl ? <img src={offer.imageUrl} alt={offer.title} className="gt-hot-offer-detail-hero__photo gt-hot-offer-detail-hero__photo--remote" /> : <Thumb name={offer.photo} className="gt-hot-offer-detail-hero__photo" />}
        <div className="gt-hot-offer-detail-hero__shade" />
        <span className="gt-hot-offer-detail-hero__discount">{offer.discount}</span>
        <div className="gt-hot-offer-detail-hero__copy">
          <small>{offer.category}</small>
          <h1>{offer.title}</h1>
          <p>{offer.description}</p>
        </div>
      </section>

      <main className="gt-hot-offer-detail-content">
        <div className="gt-hot-offer-detail-status">
          <span><Clock3 size={19} /><i><small>{tr(runtime.language,"Термін дії","Validity","Ważność")}</small><strong>{offer.validity}</strong></i></span>
          <span><BadgeCheck size={19} /><i><small>{tr(runtime.language,"Статус","Status","Status")}</small><strong>{tr(runtime.language,"Перевірено партнером","Verified by partner","Zweryfikowano przez partnera")}</strong></i></span>
        </div>

        <section className="gt-hot-offer-detail-card">
          <h2>{tr(runtime.language,"Про пропозицію","About this offer","O ofercie")}</h2>
          <p>{offer.detail}</p>
          <div className="gt-hot-offer-detail-tags">
            <span><Sparkles size={15} /> {tr(runtime.language,"Ексклюзивно","Exclusive","Ekskluzywnie")}</span>
            <span><MapPin size={15} /> {tr(runtime.language,"Поруч","Nearby","W pobliżu")}</span>
            <span><ShieldCheck size={15} /> {tr(runtime.language,"Перевірено","Verified","Zweryfikowano")}</span>
          </div>
        </section>

        <section className="gt-hot-offer-detail-card gt-hot-offer-detail-card--partner">
          {offer.imageUrl ? <img src={offer.imageUrl} alt={offer.title} className="gt-hot-offer-detail-partner-photo gt-hot-offer-detail-partner-photo--remote" /> : <Thumb name={offer.photo} className="gt-hot-offer-detail-partner-photo" />}
          <div><small>{tr(runtime.language,"Партнер Gid Tourist","Gid Tourist partner","Partner Gid Tourist")}</small><strong>{offer.title}</strong><span><Star size={14} fill="currentColor" /> <TouristText uk="4.9 · 126 відгуків"/></span></div>
          <ChevronRight size={20} />
        </section>

        <div className="gt-hot-offer-detail-actions">
          <button type="button" className="is-primary" onClick={() => navigate("tourist", "qr")}><QrCode size={20} /> {tr(runtime.language,"Скористатися пропозицією","Use this offer","Skorzystaj z oferty")}</button>
          <button type="button"><MapPin size={19} /> {tr(runtime.language,"Побудувати маршрут","Get directions","Wyznacz trasę")}</button>
        </div>
      </main>
    </div>
  );
}

function AboutScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const { context, language } = runtime;
  const place = context?.place;
  const details = place?.details ?? {};
  const checkIn = typeof details.check_in === "string" ? details.check_in.trim() : "";
  const checkOut = typeof details.check_out === "string" ? details.check_out.trim() : "";
  const showCheckIn = details.check_in_enabled !== false && Boolean(checkIn);
  const showCheckOut = details.check_out_enabled !== false && Boolean(checkOut);
  const checkInLabel = typeof details.check_in_label === "string" && details.check_in_label.trim() ? details.check_in_label.trim() : tr(language,"Заїзд","Check-in","Zameldowanie");
  const checkOutLabel = typeof details.check_out_label === "string" && details.check_out_label.trim() ? details.check_out_label.trim() : tr(language,"Виїзд","Check-out","Wymeldowanie");
  const placeType = place?.subcategory ? translateKnownLabel(language,place.subcategory) : localizedField(language,place,"category_name",tr(language, "заклад", "place", "miejsce"));

  return (
    <div className="tourist-screen gt-screen gt-about-screen">
      <section className="gt-about-hero" style={place?.image_url ? { backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.56)),url(${place.image_url})` } : undefined}>
        <div className="gt-about-logo">
          {typeof details.logo_url === 'string' && details.logo_url ? <img src={details.logo_url} className="gt-about-brand-logo" alt={`Логотип ${place?.name || 'закладу'}`} /> : <MountainSnow size={43} />}
          <strong>{localizedField(language,place,"name","Gid Tourist")}</strong>
          <small>{placeType}</small>
        </div>
        <div className="gt-about-hero__copy">
          <h1>{localizedField(language,place,"name",tr(language, "Інформація про заклад", "Place information", "Informacje o miejscu"))}</h1>
          <p><MapPin size={18} /> {place?.address || tr(language, "Адреса завантажується", "Loading address", "Ładowanie adresu")}</p>
        </div>
        {showCheckIn || showCheckOut ? <div className="gt-checkin-card gt-checkin-card--hero">
          <p>
            {showCheckIn ? <span><Clock3 size={20} /><i>{checkInLabel}<b>{checkIn}</b></i></span> : null}
            {showCheckOut ? <span><Clock3 size={20} /><i>{checkOutLabel}<b>{checkOut}</b></i></span> : null}
          </p>
        </div> : null}
      </section>
      <div className="gt-about-content">
        <button type="button" className="gt-service-card gt-service-card--wide" onClick={() => { if (place) runtime.setSelectedPlace(place); navigate("tourist", "hotel-services"); }}>
          <span><Hotel size={25} /></span>
          <div><strong>{tr(language, "Послуги закладу", "Place services", "Usługi obiektu")}</strong><small>{tr(language, "Доступні зручності та сервіси для гостей", "Available amenities and guest services", "Dostępne udogodnienia i usługi dla gości")}</small></div>
          <i>{tr(language, "Деталі", "Details", "Szczegóły")} <ChevronRight size={18} /></i>
        </button>
        <div className="gt-service-grid">
          <button type="button" className="gt-service-card" onClick={() => navigate("tourist", "about-reception")}>
            <span><Hotel size={24} /></span><div><strong>{tr(language, "Рецепція", "Reception", "Recepcja")}</strong><small>{tr(language, "Зв’язок та інформація для гостей", "Guest contact and information", "Kontakt i informacje dla gości")}</small></div><ChevronRight size={19} />
          </button>
          <button type="button" className="gt-service-card" onClick={() => navigate("tourist", "about-wifi")}>
            <span><Wifi size={24} /></span><div><strong>Wi‑Fi</strong><small>{tr(language, "Дані мережі закладу", "Place network details", "Dane sieci obiektu")}</small></div><ChevronRight size={19} />
          </button>
        </div>
        <button type="button" className="gt-service-card gt-service-card--wide" onClick={() => navigate("tourist", "about-rules")}>
          <span><ReceiptText size={25} /></span>
          <div><strong>{tr(language, "Правила проживання", "House rules", "Zasady pobytu")}</strong><small>{tr(language, "Важлива інформація для комфортного перебування", "Important information for a comfortable stay", "Ważne informacje dla komfortowego pobytu")}</small></div>
          <ChevronRight size={19} />
        </button>
        <button type="button" className="gt-service-card gt-service-card--wide" onClick={() => navigate("tourist", "about-contacts")}>
          <span><Phone size={25} /></span><div><strong>{tr(language, "Оперативні контакти", "Contacts", "Kontakty")}</strong><small>{tr(language, "Контакти закладу та способи зв’язку", "Place contacts and ways to get in touch", "Kontakty obiektu i sposoby komunikacji")}</small></div><ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}

type AboutInfoKind = "reception" | "wifi" | "rules" | "contacts";

function AboutInfoScreen({ navigate, kind }: { navigate: Navigate; kind: AboutInfoKind }) {
  const { context, language } = useTouristRuntime();
  const place = context?.place;
  const details = place?.details ?? {};
  const ruleItems = Array.isArray(details.rule_items) ? details.rule_items as Array<Record<string, unknown>> : [];
  const legacyRules = Array.isArray(details.rules) ? details.rules.map((item) => String(item)) : [];
  const configs: Record<AboutInfoKind, { title: string; icon: LucideIcon }> = {
    reception: { title: tr(language, "Рецепція", "Reception", "Recepcja"), icon: Hotel },
    wifi: { title: "Wi‑Fi", icon: Wifi },
    rules: { title: tr(language, "Правила проживання", "House rules", "Zasady pobytu"), icon: ReceiptText },
    contacts: { title: tr(language, "Оперативні контакти", "Contacts", "Kontakty"), icon: Phone },
  };
  const config = configs[kind];
  const Icon = config.icon;
  return (
    <div className="tourist-screen gt-screen gt-about-info-screen">
      <main className="gt-content">
        <button type="button" className="gt-back-button" onClick={() => navigate("tourist", "about")}><ArrowLeft size={20} /> {tr(language, "Назад", "Back", "Wstecz")}</button>
        <section className="gt-about-info-head"><span><Icon size={26} /></span><div><h1>{config.title}</h1><p>{localizedField(language,place,"name",tr(language, "Ваш заклад", "Your place", "Twój obiekt"))}</p></div></section>
        {kind === "reception" ? <div className="gt-about-info-list">
          <div><strong>{tr(language, "Телефон рецепції", "Reception phone", "Telefon recepcji")}</strong><small>{place?.phone || tr(language, "Не вказано", "Not provided", "Nie podano")}</small>{place?.phone ? <a href={`tel:${place.phone}`}>{tr(language, "Подзвонити", "Call", "Zadzwoń")}</a> : null}</div>
          <div><strong>{tr(language, "Графік", "Hours", "Godziny")}</strong><small>{typeof details.reception_hours === "string" ? details.reception_hours : tr(language, "Уточнюйте у закладі", "Ask the place", "Zapytaj w obiekcie")}</small></div>
        </div> : null}
        {kind === "wifi" ? <div className="gt-about-info-list">
          <div><strong>{tr(language, "Назва мережі", "Network name", "Nazwa sieci")}</strong><small>{typeof details.wifi_ssid === "string" && details.wifi_ssid ? details.wifi_ssid : tr(language, "Wi‑Fi не вказано", "Wi‑Fi not provided", "Nie podano Wi‑Fi")}</small></div>
          <div><strong>{tr(language, "Пароль", "Password", "Hasło")}</strong><small>{typeof details.wifi_password === "string" && details.wifi_password ? details.wifi_password : tr(language, "Не вказано", "Not provided", "Nie podano")}</small></div>
        </div> : null}
        {kind === "rules" ? <div className="gt-about-info-list">
          {ruleItems.map((rule, index) => <div key={`${String(rule.title || rule.text || "rule")}-${index}`}><strong>{String(rule.title || rule.text || `${tr(language, "Правило", "Rule", "Zasada")} ${index + 1}`)}</strong>{rule.title ? <small>{String(rule.text || rule.description || "")}</small> : null}</div>)}
          {!ruleItems.length && legacyRules.map((rule, index) => <div key={`${rule}-${index}`}><strong>{tr(language, "Правило", "Rule", "Zasada")} {index + 1}</strong><small>{rule}</small></div>)}
          {typeof details.cancellation === 'string' && details.cancellation.trim() ? <div><strong><TouristText uk="Скасування бронювання"/></strong><small>{details.cancellation}</small></div> : null}
          {typeof details.other_rules === 'string' && details.other_rules.trim() ? <div><strong><TouristText uk="Інші умови"/></strong><small>{details.other_rules}</small></div> : null}
          {!ruleItems.length && !legacyRules.length && !details.cancellation && !details.other_rules ? <div><strong>{tr(language, "Правила", "Rules", "Zasady")}</strong><small>{tr(language, "Заклад ще не додав правила проживання.", "The place has not added house rules yet.", "Obiekt nie dodał jeszcze zasad pobytu.")}</small></div> : null}
        </div> : null}
        {kind === "contacts" ? <div className="gt-about-info-list">
          <div><strong>{tr(language, "Телефон", "Phone", "Telefon")}</strong><small>{place?.phone || tr(language, "Не вказано", "Not provided", "Nie podano")}</small>{place?.phone ? <a href={`tel:${place.phone}`}>{tr(language, "Подзвонити", "Call", "Zadzwoń")}</a> : null}</div>
          {place?.telegram ? <div><strong>Telegram</strong><small>{place.telegram}</small><a href={place.telegram} target="_blank" rel="noreferrer">{tr(language, "Відкрити", "Open", "Otwórz")}</a></div> : null}
          {place?.website ? <div><strong>{tr(language, "Сайт", "Website", "Strona")}</strong><small>{place.website}</small><a href={place.website} target="_blank" rel="noreferrer">{tr(language, "Відкрити", "Open", "Otwórz")}</a></div> : null}
          {typeof details.email === "string" && details.email ? <div><strong>Email</strong><small>{details.email}</small><a href={`mailto:${details.email}`}>{tr(language, "Написати", "Write", "Napisz")}</a></div> : null}
        </div> : null}
      </main>
    </div>
  );
}

type PublicPartnerService = {
  id:string; name:string; category:string; description:string; active:boolean; hidden:boolean;translations?:Record<string,Record<string,string>>;
  image?:string;priceType?:string;price?:string;currency?:string;audience?:string;
  timeFrom?:string;timeTo?:string;phone?:string;bookingNote?:string;additionalInfo?:string;
  bookingEnabled?:boolean;durationMinutes?:number;maxGuests?:number;
};
const BOOKING_SERVICE_KEY='gid-tourist-booking-selected-service';
function servicePhotoParts(photo:string|undefined,alt:string,eager=false) {
  return photo ? <><span className="gt-real-service-photo__blur" style={{backgroundImage:`url(${photo})`}}/>
    <img className="gt-real-service-photo__image" src={photo} alt={alt} loading={eager?'eager':'lazy'}/></> : <span className="gt-real-service-photo__empty"><Hotel size={38}/></span>;
}
function HotelServicesScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const place = runtime.selectedPlace || runtime.context?.place;
  const placeId = runtime.selectedPlace?.id || runtime.selectedPlaceId || runtime.context?.place?.id || "";
  const placeName = localizedField(runtime.language,place,"name",tr(runtime.language,"Заклад","Place","Obiekt"));
  const [services,setServices] = useState<PublicPartnerService[]>([]);
  const [selected,setSelected] = useState<PublicPartnerService|null>(null);
  const [featureIndex,setFeatureIndex] = useState(0);
  const [showAll,setShowAll] = useState(false);
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState("");
  const swipeStart = useRef<number|null>(null);
  useEffect(()=>{
    if(!placeId){setServices([]);setLoading(false);return;}
    let closed=false;setLoading(true);
    void stage2Fetch<PublicPartnerService[]>(`/partner/services/public/${encodeURIComponent(placeId)}`)
      .then(items=>{if(!closed){setServices(items.filter(item=>item.active!==false&&!item.hidden));setMessage("");}})
      .catch(error=>{if(!closed){setServices([]);setMessage(error instanceof Error?error.message:"Не вдалося завантажити послуги");}})
      .finally(()=>{if(!closed)setLoading(false);});
    return()=>{closed=true;};
  },[placeId]);
  const name=(service:PublicPartnerService)=>localizedField(runtime.language,service,"name");
  const description=(service:PublicPartnerService)=>localizedField(runtime.language,service,"description");
  const price=(service:PublicPartnerService)=>{
    if(service.priceType==='free') return touristInterfaceText(runtime.language,"Безкоштовно");
    if(service.priceType==='request'||!service.price) return touristInterfaceText(runtime.language,"За запитом");
    return `${service.priceType==='from' ? touristInterfaceText(runtime.language,"Від "):''}${service.price} ${service.currency==='UAH'||!service.currency?'₴':service.currency}`;
  };
  const book=(service:PublicPartnerService)=>{
    // Store only the stable service reference. Photos are often base64 and can
    // overflow sessionStorage; the booking screen fetches the real photo.
    if(typeof window!=='undefined')window.sessionStorage.setItem(BOOKING_SERVICE_KEY,JSON.stringify({placeId,id:service.id,name:service.name,
      image:service.image?.startsWith('data:')?'':(service.image||''),priceType:service.priceType||'',price:service.price||'',currency:service.currency||'UAH'}));
    if(place)runtime.setSelectedPlace(place);
    navigate('tourist','booking');
  };
  const phone = (selected?.phone || place?.phone || '').trim();
  const feature = services[Math.min(featureIndex,Math.max(0,services.length-1))];
  const other = services.filter(service=>service.id!==feature?.id);
  const visible = showAll ? other : other.slice(0,services.length>5?4:other.length);
  const nextFeature=(direction:number)=>setFeatureIndex(index=>(index+direction+Math.min(services.length,4))%Math.min(services.length,4));
  if(selected)return <div className="tourist-screen gt-screen gt-hotel-service-detail gt-real-service-detail-screen">
    <header className="gt-hotel-services-header"><button type="button" aria-label="Назад" onClick={()=>setSelected(null)}><ArrowLeft size={25}/></button><h1>{touristInterfaceText(runtime.language,'Послуги закладу')}</h1><span/></header>
    <section className="gt-hotel-service-photo gt-real-service-photo">{servicePhotoParts(selected.image,name(selected),true)}</section>
    <section className="gt-hotel-service-copy"><h2>{name(selected)}</h2>{description(selected)?<p>{description(selected)}</p>:null}</section>
    {selected.additionalInfo?<p className="gt-real-service-note">{localizedField(runtime.language,selected,'additionalInfo')}</p>:null}
    <section className="gt-hotel-service-price"><strong>{price(selected)}</strong>
      {selected.durationMinutes&&selected.bookingEnabled?<small>{selected.durationMinutes} хв · до {selected.maxGuests||1} гостей</small>:null}
      {selected.timeFrom&&selected.timeTo?<small>{selected.timeFrom}–{selected.timeTo}</small>:null}
    </section>
    {selected.bookingNote?<p className="gt-real-service-note">{localizedField(runtime.language,selected,'bookingNote')}</p>:null}
    <div className="gt-real-service-actions">
      <button className="gt-primary-button" type="button" onClick={()=>book(selected)}><CalendarDays size={19}/>{touristInterfaceText(runtime.language,'Бронювати')}</button>
      {phone?<a className="gt-hotel-service-call" href={`tel:${phone.replace(/[^+\d]/g,'')}`}><Phone size={19}/>{touristInterfaceText(runtime.language,'Зателефонувати')}</a>:null}
    </div>
    <footer className="gt-hotel-service-provider"><Hotel size={21}/>{touristInterfaceText(runtime.language,'Послуга від')}: {placeName}</footer>
  </div>;
  return <div className="tourist-screen gt-screen gt-hotel-services-screen"><main className="gt-hotel-services gt-real-services">
    <header className="gt-hotel-services-header"><button type="button" aria-label="Назад" onClick={()=>navigate('tourist',runtime.context?.place?.id===placeId?'about':'place')}><ArrowLeft size={25}/></button><h1>{touristInterfaceText(runtime.language,'Послуги закладу')}</h1><span/></header>
    {loading?<p className="gt-stage2-empty">{touristInterfaceText(runtime.language,'Завантажуємо послуги закладу…')}</p>:null}
    {!loading&&message?<p className="gt-stage2-empty" role="alert">{message}</p>:null}
    {!loading&&!message&&!services.length?<p className="gt-stage2-empty">{touristInterfaceText(runtime.language,'Заклад поки не додав послуг.')}</p>:null}
    {feature?<>
      <div className="gt-real-service-feature-wrapper" onTouchStart={event=>{swipeStart.current=event.touches[0]?.clientX??null;}} onTouchEnd={event=>{if(swipeStart.current!==null){const delta=(event.changedTouches[0]?.clientX??swipeStart.current)-swipeStart.current;if(Math.abs(delta)>45)nextFeature(delta<0?1:-1);swipeStart.current=null;}}}>
        <button type="button" className="gt-hotel-services-feature gt-real-service-photo" onClick={()=>setSelected(feature)}>
          {servicePhotoParts(feature.image,name(feature))}
          <span className="gt-hotel-services-feature__copy"><strong>{name(feature)}</strong>{description(feature)?<small>{description(feature)}</small>:null}
            <span className="gt-real-service-feature-button">{touristInterfaceText(runtime.language,'Детальніше')} <ChevronRight size={20}/></span>
          </span>
        </button>
        {services.length>1?<div className="gt-hotel-services-dots">{services.slice(0,4).map((service,index)=><button type="button" key={service.id} aria-label={`Послуга ${index+1}`} className={featureIndex===index?'is-active':''} onClick={()=>setFeatureIndex(index)}/>)}</div>:null}
      </div>
      {visible.length?<h2 className="gt-hotel-services-title">{touristInterfaceText(runtime.language,'Наші послуги')}</h2>:null}
      {visible.length?<section className={services.length<=3?'gt-real-services-list gt-real-services-list--wide':services.length<=5?'gt-hotel-services-grid gt-real-services-grid':'gt-real-services-list gt-real-services-list--compact'}>
        {visible.map(service=><button type="button" className={services.length<=5&&services.length>=4?'gt-hotel-services-card gt-real-service-photo':'gt-real-services-card gt-real-service-photo'} key={service.id} onClick={()=>setSelected(service)}>
          {servicePhotoParts(service.image,name(service))}
          <span className="gt-real-services-card__copy"><strong>{name(service)}</strong>{description(service)?<small>{description(service)}</small>:null}</span>
          <i><ChevronRight size={22}/></i>
        </button>)}
      </section>:null}
      {other.length>4?<button type="button" className="gt-hotel-services-all" onClick={()=>setShowAll(value=>!value)}>{touristInterfaceText(runtime.language,showAll?'Згорнути':'Показати всі послуги')} <ChevronDown size={18}/></button>:null}
    </>:null}
  </main></div>;
}

function placePhotoFallback(place: Stage2Place): PhotoName {
  const value = `${place.category_slug} ${place.subcategory ?? ""} ${place.name}`.toLocaleLowerCase("uk");
  if (value.includes("аптек")) return "pharmacy";
  if (value.includes("кава") || value.includes("кавʼ")) return "coffee";
  if (value.includes("піц")) return "pizza";
  if (value.includes("магаз") || place.category_slug === "shop") return "store";
  if (value.includes("чан")) return "tub";
  if (value.includes("саун")) return "sauna";
  if (value.includes("басейн")) return "pool";
  if (value.includes("масаж")) return "massage";
  if (value.includes("квадро")) return "quad";
  if (value.includes("рафт")) return "rafting";
  if (value.includes("зіп")) return "zipline";
  if (value.includes("джип")) return "jeep";
  if (place.category_slug === "transfer") return "van";
  if (place.category_slug === "food") return "restaurant";
  return "hotel";
}

type TouristPlaceBadge = "partner" | "advertisement" | "recommended";
function touristPlaceBadges(place: Stage2Place): TouristPlaceBadge[] {
  // Never infer a paid/editorial placement from the price tier or from another tag.
  if (isExternalPlace(place)) return [];
  const configured = place.attributes?.display_badges;
  const allowed: TouristPlaceBadge[] = ["partner", "advertisement", "recommended"];
  if (Array.isArray(configured)) return allowed.filter(value => configured.includes(value));
  return place.is_partner || place.attributes?.partner === true ? ["partner"] : [];
}
function touristPlaceBadgeLabel(badge: TouristPlaceBadge, language: TouristLanguage): string {
  if (badge === "partner") return tr(language, "Партнер", "Partner", "Partner");
  if (badge === "advertisement") return tr(language, "Реклама", "Advertising", "Reklama");
  return tr(language, "Ми рекомендуємо", "We recommend", "Polecamy");
}
function PlaceBadges({place,language,inline=false}: {place:Stage2Place;language:TouristLanguage;inline?:boolean}) {
  const badges=touristPlaceBadges(place);
  return badges.length ? <span className={`gt-place-display-badges ${inline?'is-inline':''}`}>{badges.map(badge=><i key={badge} className={`gt-place-display-badge gt-place-display-badge--${badge}`}>{touristPlaceBadgeLabel(badge,language)}</i>)}</span> : null;
}

function visiblePlaceTags(place: Stage2Place) {
  if (isExternalPlace(place)) {
    return [place.subcategory || place.category_name || ""].filter(Boolean).slice(0, 1);
  }
  return (place.tags ?? []).slice(0, 4);
}

function distanceLabel(distance?: number | null, language: TouristLanguage = "uk") {
  if (distance == null) return "—";
  return distance < 1000 ? `${Math.max(1, Math.round(distance))} ${tr(language, "м", "m", "m")}` : `${(distance / 1000).toFixed(1).replace(".", ",")} ${tr(language, "км", "km", "km")}`;
}

function walkLabel(distance?: number | null, durationSeconds?: number | null, language: TouristLanguage = "uk") {
  if (durationSeconds != null && durationSeconds > 0) return `${Math.max(1, Math.round(durationSeconds / 60))} ${tr(language, "хв", "min", "min")}`;
  if (distance == null) return "—";
  return `${Math.max(1, Math.round(distance / 80))} ${tr(language, "хв", "min", "min")}`;
}

type DynamicCategoryConfig = {
  category: "food" | "shop" | "rest" | "entertainment";
  className: string;
  icon: LucideIcon;
  title: string;
  titleEn: string;
  titlePl: string;
  subtitle: string;
  subtitleEn: string;
  subtitlePl: string;
  tone: string;
  placeholder: string;
  placeholderEn: string;
  placeholderPl: string;
  sectionTitle: string;
  sectionTitleEn: string;
  sectionTitlePl: string;
  fallbackChips: string[];
};

function DynamicCategoryScreen({ navigate, config }: { navigate: Navigate; config: DynamicCategoryConfig }) {
  const runtime = useTouristRuntime();
  const [query, setQuery] = useState("");
  const [selectedChip, setSelectedChip] = useState("Усі");
  const [places, setPlaces] = useState<Stage2Place[]>([]);
  const [category, setCategory] = useState<Stage2Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadCategory = () => {
      void stage2Fetch<Stage2Category[]>("/categories").then((items) => {
        if (cancelled) return;
        const next = items.find((item) => item.slug === config.category) ?? null;
        setCategory(next);
        setSelectedChip((current) => current === "Усі" || next?.subcategories?.includes(current) ? current : "Усі");
      }).catch(() => undefined);
    };
    const onVisibility = () => { if (document.visibilityState === "visible") loadCategory(); };
    loadCategory();
    window.addEventListener("focus", loadCategory);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { cancelled = true; window.removeEventListener("focus", loadCategory); document.removeEventListener("visibilitychange", onVisibility); };
  }, [config.category]);

  useEffect(() => {
    if (!runtime.location && !runtime.context) return;
    let cancelled = false;
    const enrichmentSeen = new Set<string>();
    const isCancelled = () => cancelled;
    const timer = window.setTimeout(() => {
      const point = runtime.location ?? (runtime.context ? { lat: Number(runtime.context.place?.lat ?? runtime.context.region.lat), lng: Number(runtime.context.place?.lng ?? runtime.context.region.lng) } : null);
      if (!point) return;
      const makeParams = (limit: number) => {
        const params = new URLSearchParams({ region_id: runtime.location?.source === "gps" ? "" : (runtime.context?.region.id || ""), category: config.category });
        if (query.trim()) params.set("q", query.trim());
        if (selectedChip !== "Усі") params.set("subcategory", selectedChip);
        params.set("lat", String(point.lat));
        params.set("lng", String(point.lng));
        params.set("radius", "15000");
        params.set("include_routes", "false");
        return params;
      };
      const cacheKey = `gid-category-cache-admin-only-v3:${config.category}:${point.lat.toFixed(3)}:${point.lng.toFixed(3)}:${selectedChip}:${query.trim().toLocaleLowerCase("uk")}`;
      let hasCachedPlaces = false;
      let cachedPlaces: Stage2Place[] = [];
      try {
        const cached = window.sessionStorage.getItem(cacheKey);
        if (cached && selectedChip === "Усі" && !query.trim()) {
          const parsed = adminCreatedPlacesOnly(JSON.parse(cached) as Stage2Place[]);
          if (Array.isArray(parsed) && parsed.length) { hasCachedPlaces = true; cachedPlaces = parsed; revealPlacesProgressively(parsed, setPlaces, isCancelled); setLoading(false); }
        }
      } catch { /* cache is optional */ }
      if (!hasCachedPlaces) { setPlaces([]); setLoading(true); }
      if (cachedPlaces.length) void enrichPlaceCardsProgressively(cachedPlaces, setPlaces, isCancelled, enrichmentSeen);

      // First paint is only 3 POIs. The full page is revealed in batches of 3 so Leaflet never
      // has to create 20–30 markers in one frame; Google rating/photo enrichment is staggered too.
      const loadFull = () => void stage2Fetch<Stage2Place[]>(`/places?${makeParams(20)}`).then((rawItems) => {
        if (cancelled) return;
        const items = adminCreatedPlacesOnly(rawItems);
        revealPlacesProgressively(items, setPlaces, isCancelled);
        setLoading(false);
        try { window.sessionStorage.setItem(cacheKey, JSON.stringify(items)); } catch { /* cache is optional */ }
        void enrichPlaceCardsProgressively(items, setPlaces, isCancelled, enrichmentSeen);
      }).catch(() => { if (!cancelled) setLoading(false); });
      loadFull();
      if (query.trim()) void trackEvent("search_used", { regionId: runtime.context?.region.id, payload: { q: query.trim(), category: config.category } });
    }, query.trim() ? 180 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [runtime.context, runtime.location, query, selectedChip, config.category]);

  const chips = ["Усі", ...((category?.subcategories?.length ? category.subcategories : config.fallbackChips).filter((item) => item !== "Усі"))];
  const subcategoryLabel=(value:string)=>localizedSubcategory(runtime.language,category,value,translateKnownLabel);
  const title = runtime.language === "en" ? (category?.name_en || config.titleEn) : runtime.language === "pl" ? (category?.name_pl || config.titlePl) : (category?.name || config.title);
  const subtitle = runtime.language === "en" ? config.subtitleEn : runtime.language === "pl" ? config.subtitlePl : config.subtitle;
  const placeholder = runtime.language === "en" ? config.placeholderEn : runtime.language === "pl" ? config.placeholderPl : config.placeholder;
  const sectionTitle = runtime.language === "en" ? config.sectionTitleEn : runtime.language === "pl" ? config.sectionTitlePl : config.sectionTitle;

  const openPlace = (place: Stage2Place) => {
    runtime.setSelectedPlace(place);
    void trackEvent("place_viewed", { regionId: runtime.context?.region.id, placeId: place.id, payload: { source: config.category } });
    navigate("tourist", "place");
  };

  return (
    <div className={`tourist-screen gt-screen gt-reference-list-screen ${config.className}`}>
      <main className="gt-content">
        <CategoryHeader icon={config.icon} title={title} subtitle={subtitle} tone={config.tone} onMap={() => navigate("tourist", "nearby")} />
        <SearchBar placeholder={placeholder} value={query} onChange={setQuery} />
        <Chips items={chips} selected={selectedChip} onSelect={setSelectedChip} displayLabel={subcategoryLabel} />
        <MapStrip real places={places} />
        <SectionTitle title={sectionTitle} action={`${places.length}`} />
        <div className="gt-place-list">
          {places.map((place, index) => (
            <PlaceRow
              key={place.id}
              photo={placePhotoFallback(place)}
              imageUrl={place.image_url}
              google={hasGooglePhotoCandidate(place)}
              googlePlaceId={googlePlaceId(place)}
              eager={index < 4}
              title={localizedField(runtime.language,place,"name")}
              subtitle={place.subcategory ? subcategoryLabel(place.subcategory) : localizedField(runtime.language,place,"category_name",tr(runtime.language, "Локація", "Place", "Miejsce"))}
              rating={placeRatingLabel(place)}
              distance={distanceLabel(place.distance_m, runtime.language)}
              walk={walkLabel(place.distance_m, place.walking_duration_s, runtime.language)}
              walking
              verified={place.attributes?.verified === true}
              badges={<PlaceBadges place={place} language={runtime.language} inline/>}
              tags={visiblePlaceTags(place)}
              onClick={() => openPlace(place)}
            />
          ))}
          {loading && !places.length ? Array.from({ length: 4 }).map((_, index) => <div className="gt-place-row gt-place-row--skeleton" key={`loading-${index}`}><span className="gt-place-row__skeleton-photo"/><span className="gt-place-row__skeleton-copy"><i/><i/><i/></span></div>) : null}
          {!loading && !places.length ? <div className="gt-stage2-empty">{tr(runtime.language, "Місць не знайдено", "No places found", "Nie znaleziono miejsc")}</div> : null}
        </div>
      </main>
    </div>
  );
}

function CatalogScreen({ navigate }: { navigate: Navigate }) {
  return <DynamicCategoryScreen navigate={navigate} config={{
    category: "food", className: "gt-food-screen", icon: Utensils, title: "Де поїсти", titleEn: "Food", titlePl: "Gdzie zjeść",
    subtitle: "Кафе, ресторани та заклади", subtitleEn: "Cafes and restaurants", subtitlePl: "Kawiarnie i restauracje", tone: "orange",
    placeholder: "Пошук закладу, кухні або страви", placeholderEn: "Search places, cuisine or dishes", placeholderPl: "Szukaj lokalu, kuchni lub dania", sectionTitle: "Рекомендовані заклади", sectionTitleEn: "Recommended places", sectionTitlePl: "Polecane miejsca",
    fallbackChips: ["Українська кухня", "Неукраїнська кухня", "Фаст фуд", "Кавʼярні"],
  }} />;
}

function NearbyScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const [activeCategory, setActiveCategory] = useState("Усі");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(500);
  const [nearbyPlaces, setNearbyPlaces] = useState<Stage2Place[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyError, setNearbyError] = useState("");
  const [previewPlace, setPreviewPlace] = useState<Stage2Place | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const subcategoryScrollRef = useRef<HTMLDivElement | null>(null);
  const sheetTouchStartY = useRef<number | null>(null);

  const categories: Array<{ label: string; icon: LucideIcon; tone: string; slug?: string }> = [
    { label: "Усі", icon: Grid2X2, tone: "all" },
    { label: "Де поїсти", icon: Utensils, tone: "food", slug: "food" },
    { label: "Де купити", icon: ShoppingBag, tone: "shop", slug: "shop" },
    { label: "Природа", icon: MountainSnow, tone: "nature", slug: "nature" },
    { label: "Цікаве", icon: TentTree, tone: "interesting", slug: "interesting" },
    { label: "Розваги", icon: Bike, tone: "fun", slug: "entertainment" },
    { label: "Трансфер", icon: CarFront, tone: "transfer", slug: "transfer" },
    { label: "Корисне", icon: Info, tone: "useful", slug: "useful" },
    { label: "Маршрути", icon: Route, tone: "routes", slug: "routes" },
  ];

  const subcategoryGroups: Record<string, Array<{ label: string; icon: LucideIcon }>> = {
    "Де поїсти": [
      { label: "Ресторани", icon: Utensils }, { label: "Кафе", icon: Sparkles }, { label: "Бари", icon: CircleHelp }, { label: "Піцерії", icon: Flame },
      { label: "Кондитерські", icon: Gift }, { label: "Фастфуд", icon: FlameKindling }, { label: "Їжа з собою", icon: ShoppingBag }, { label: "Традиційна кухня", icon: BadgeCheck },
    ],
    "Де купити": [
      { label: "Продукти", icon: ShoppingBag }, { label: "Сувеніри", icon: Gift }, { label: "Одяг і взуття", icon: UsersRound }, { label: "Товари для дому", icon: Hotel },
      { label: "Аптеки", icon: Pill }, { label: "Техніка", icon: Gauge }, { label: "Будівництво", icon: Wrench }, { label: "Косметика", icon: Sparkles },
    ],
    "Природа": [
      { label: "Гори", icon: MountainSnow }, { label: "Річки", icon: Route }, { label: "Водоспади", icon: LifeBuoy }, { label: "Джерела", icon: MapPin },
      { label: "Озера", icon: Flower2 }, { label: "Оглядові точки", icon: LocateFixed }, { label: "Печери", icon: TentTree }, { label: "Ліси", icon: Leaf },
    ],
    "Цікаве": [
      { label: "Пам’ятки", icon: BadgeCheck }, { label: "Музеї", icon: Info }, { label: "Храми", icon: Cross }, { label: "Архітектура", icon: Hotel },
      { label: "Історичні місця", icon: Clock3 }, { label: "Скульптури", icon: UserRound }, { label: "Місцеві легенди", icon: MessageSquareMore }, { label: "Події", icon: CalendarDays },
    ],
    "Розваги": [
      { label: "Активний відпочинок", icon: Footprints }, { label: "Атракціони", icon: Sparkles }, { label: "Екскурсії", icon: Route }, { label: "SPA і басейни", icon: Flower2 },
      { label: "Риболовля", icon: LifeBuoy }, { label: "Верхова їзда", icon: PawPrint }, { label: "Квадроцикли", icon: Bike }, { label: "Польоти", icon: Navigation },
    ],
    "Трансфер": [
      { label: "Автобусні зупинки", icon: CarFront }, { label: "Залізничні станції", icon: Route }, { label: "Автостанції", icon: Hotel }, { label: "Таксі", icon: CarFront },
      { label: "Парковки", icon: MapPin }, { label: "Оренда авто", icon: CarFront }, { label: "Заправки", icon: Gauge }, { label: "Зарядні станції", icon: Plus },
    ],
    "Корисне": [
      { label: "Банкомати", icon: Banknote }, { label: "Обмін валют", icon: WalletCards }, { label: "Пошта", icon: Send }, { label: "Лікарні", icon: Heart },
      { label: "Туалети", icon: UsersRound }, { label: "Wi‑Fi", icon: Wifi }, { label: "Поліція", icon: ShieldCheck }, { label: "Інформаційні центри", icon: Info },
    ],
    "Маршрути": [
      { label: "Піші маршрути", icon: Footprints }, { label: "Веломаршрути", icon: Bike }, { label: "Автомаршрути", icon: CarFront }, { label: "Верхові маршрути", icon: PawPrint },
      { label: "Водні маршрути", icon: LifeBuoy }, { label: "Популярні маршрути", icon: BadgeCheck }, { label: "Складні маршрути", icon: MountainSnow }, { label: "Маршрути вихідного дня", icon: SunMedium },
    ],
  };

  const activeSubcategories = subcategoryGroups[activeCategory] ?? [];
  const activeCategoryMeta = categories.find((item) => item.label === activeCategory);
  const activeTone = activeCategoryMeta?.tone ?? "all";
  const center = runtime.location ?? (runtime.context ? { lat: Number(runtime.context.place?.lat ?? runtime.context.region.lat), lng: Number(runtime.context.place?.lng ?? runtime.context.region.lng), source: "qr" as const } : null);

  useEffect(() => {
    if (!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return;
    let cancelled = false;
    const enrichmentSeen = new Set<string>();
    const isCancelled = () => cancelled;
    const timer = window.setTimeout(() => {
      const makeParams = () => {
        const params = new URLSearchParams({ region_id: runtime.location?.source === "gps" ? "" : (runtime.context?.region.id || ""), lat: String(center.lat), lng: String(center.lng), radius: String(radius) });
        params.set("include_routes", "false");
        if (activeCategoryMeta?.slug) params.set("category", activeCategoryMeta.slug);
        if (activeSubcategory) params.set("subcategory", activeSubcategory);
        if (query.trim()) params.set("q", query.trim());
        return params;
      };
      const ownPlacesOnly = (items: Stage2Place[]) => items.filter((place) => !isExternalPlace(place));
      const cacheKey = `gid-nearby-admin-only-cache:v3:${center.lat.toFixed(3)}:${center.lng.toFixed(3)}:${radius}:${activeCategory}:${activeSubcategory}:${query.trim().toLocaleLowerCase("uk")}`;
      let hasCachedPlaces = false;
      let cachedPlaces: Stage2Place[] = [];
      try {
        const cached = window.sessionStorage.getItem(cacheKey);
        if (cached && activeCategory === "Усі" && !activeSubcategory && !query.trim()) {
          const parsed = ownPlacesOnly(JSON.parse(cached) as Stage2Place[]);
          if (Array.isArray(parsed) && parsed.length) {
            hasCachedPlaces = true;
            cachedPlaces = parsed;
            revealPlacesProgressively(parsed, setNearbyPlaces, isCancelled);
            setNearbyLoading(false);
          }
        }
      } catch { /* optional cache */ }
      if (!hasCachedPlaces) { setNearbyPlaces([]); setNearbyLoading(true); }
      setNearbyError("");
      if (cachedPlaces.length) void enrichPlaceCardsProgressively(cachedPlaces, setNearbyPlaces, isCancelled, enrichmentSeen);

      const loadFull = () => void stage2Fetch<Stage2Place[]>(`/places?${makeParams()}`).then((rawItems) => {
        if (cancelled) return;
        const items = ownPlacesOnly(rawItems);
        revealPlacesProgressively(items, setNearbyPlaces, isCancelled);
        setNearbyLoading(false);
        try { window.sessionStorage.setItem(cacheKey, JSON.stringify(items)); } catch { /* optional cache */ }
        void enrichPlaceCardsProgressively(items, setNearbyPlaces, isCancelled, enrichmentSeen);
      }).catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Nearby places]", message);
        setNearbyError(message || "Невідома помилка сервісу місць");
        setNearbyLoading(false);
      });

      // Always show 2–3 markers first, including the "Усі" tab. The full 2–5 km result can
      // continue loading in the background without leaving the map empty for several seconds.
      loadFull();
    }, query.trim() ? 160 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [runtime.context, center?.lat, center?.lng, radius, activeCategoryMeta?.slug, activeCategory, activeTone, activeSubcategory, query]);

  const openPlace = (place: Stage2Place) => {
    runtime.setSelectedPlace(place);
    void trackEvent("place_viewed", { regionId: runtime.context?.region.id, placeId: place.id, payload: { source: "nearby" } });
    navigate("tourist", "place");
  };

  const previewMapPlace = (place: Stage2Place) => {
    setPreviewPlace(place);
    if (!center) return;
    const cacheKey = googlePlaceDetailCacheKey(place.id, center.lat, center.lng);
    if (isExternalPlace(place)) {
      const cached = readGooglePlaceDetailCache(cacheKey);
      if (cached) {
        setPreviewPlace(cached);
        return;
      }
    }
    const suffix = `?lat=${encodeURIComponent(String(center.lat))}&lng=${encodeURIComponent(String(center.lng))}`;
    void stage2Fetch<Stage2Place>(`/places/${encodeURIComponent(place.id)}${suffix}`).then((details) => {
      if (isExternalPlace(details)) writeGooglePlaceDetailCache(cacheKey, details);
      setPreviewPlace((current) => current?.id === place.id ? details : current);
    }).catch(() => undefined);
  };

  return (
    <div className={`tourist-screen gt-screen gt-nearby-screen gt-nearby-design gt-nearby-theme--${activeTone}`}>
      <main className={`gt-nearby-design__content ${activeSubcategories.length ? "has-subcategories" : ""}`.trim()}>
        <section className="gt-nearby-design__head">
          <div className="gt-nearby-design__brand-row"><h1>Gid Tourist</h1></div>
          <div className="gt-nearby-design__search-row">
            <label className="gt-nearby-design__search">
              <Search size={21} />
              <input aria-label={tr(runtime.language, "Пошук", "Search", "Szukaj")} placeholder={tr(runtime.language, "Пошук місць, маршрутів, активностей...", "Search places, routes, activities...", "Szukaj miejsc, tras i atrakcji...")} value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <button type="button" className="gt-nearby-design__filter" aria-label={tr(runtime.language, "Визначити моє місцезнаходження", "Use my location", "Użyj mojej lokalizacji")} onClick={() => void runtime.requestLocation()}>
              <LocateFixed size={23} />
            </button>
          </div>

          <div className="gt-nearby-design__categories-wrap">
            <div ref={categoryScrollRef} className="gt-nearby-design__categories">
              {categories.map(({ label, icon: Icon, tone }) => (
                <button type="button" key={label} className={activeCategory === label ? "is-active" : ""} onClick={() => {
                  setActiveCategory(label); setActiveSubcategory(""); setResultsExpanded(false);
                }}>
                  <span className={`gt-nearby-design__category-icon gt-nearby-category-icon--${tone}`}><Icon size={25} /></span>
                  <strong>{translateKnownLabel(runtime.language, label)}</strong>
                </button>
              ))}
            </div>
            <button type="button" className="gt-nearby-design__categories-next" aria-label={tr(runtime.language, "Наступні категорії", "Next categories", "Następne kategorie")} onClick={() => categoryScrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })}><ChevronRight size={22} /></button>
          </div>

          {activeCategory !== "Усі" && activeSubcategories.length ? (
            <div className="gt-nearby-design__subcategories-wrap">
              <div ref={subcategoryScrollRef} className="gt-nearby-design__subcategories">
                {activeSubcategories.map(({ label, icon: Icon }) => (
                  <button type="button" key={`${activeCategory}-${label}`} className={activeSubcategory === label ? "is-active" : ""} onClick={() => setActiveSubcategory((current) => current === label ? "" : label)}>
                    <span><Icon size={22} /></span><strong>{translateKnownLabel(runtime.language, label)}</strong>
                  </button>
                ))}
              </div>
              <button type="button" className="gt-nearby-design__subcategories-next" aria-label={tr(runtime.language, "Наступні підкатегорії", "Next subcategories", "Następne podkategorie")} onClick={() => subcategoryScrollRef.current?.scrollBy({ left: 250, behavior: "smooth" })}><ChevronRight size={20} /></button>
            </div>
          ) : null}
        </section>

        <section className="gt-nearby-design__map gt-nearby-design__map--live" aria-label={tr(runtime.language, "Карта місць поруч", "Nearby places map", "Mapa miejsc w pobliżu")}>
          {center ? <RealMap center={center} places={nearbyPlaces} radius={radius} className="gt-nearby-design__real-map" onSelect={previewMapPlace} showLayerControl /> : <div className="gt-nearby-design__map-loading">{tr(runtime.language, "Для пошуку поруч потрібна геолокація. Дозвольте доступ або відкрийте QR локації.", "Allow location access or open a location QR to see nearby places.", "Zezwól na lokalizację lub otwórz kod QR miejsca, aby zobaczyć pobliskie punkty.")}</div>}
          {nearbyError ? <div className="gt-nearby-design__diagnostic" role="alert">
            <strong>{tr(runtime.language, "Помилка сервісу місць", "Places service error", "Błąd usługi miejsc")}</strong>
            <span>{nearbyError}</span>
            <small>{tr(runtime.language, "Радіус", "Radius", "Promień")}: {radius < 1000 ? `${radius} ${tr(runtime.language, "м", "m", "m")}` : `${radius / 1000} ${tr(runtime.language, "км", "km", "km")}`}{center ? ` · ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}` : ""}</small>
          </div> : null}
          <div className="gt-nearby-design__map-controls">
            <button type="button" aria-label={tr(runtime.language, "Моє місцезнаходження", "My location", "Moja lokalizacja")} onClick={() => void runtime.requestLocation()}><LocateFixed size={22} /></button>
          </div>
          <div className="gt-nearby-design__radius">
            {[300, 500, 1000, 2000, 5000, 10000, 15000, 30000].map((value) => (
              <button type="button" key={value} className={radius === value ? "is-active" : ""} onClick={() => setRadius(value)}>{value < 1000 ? `${value} м` : `${value / 1000} км`}</button>
            ))}
          </div>
          {previewPlace ? <div className="gt-map-place-preview" role="dialog" aria-label={`Перегляд ${previewPlace.name}`}>
            <RemotePlaceImage url={previewPlace.image_url} className="gt-map-place-preview__image" google={hasGooglePhotoCandidate(previewPlace)} googlePlaceId={googlePlaceId(previewPlace)} eager fallback={<Thumb name={placePhotoFallback(previewPlace)} />} />
            <div className="gt-map-place-preview__copy">
              <strong>{localizedField(runtime.language,previewPlace,"name")}</strong>
              <PlaceBadges place={previewPlace} language={runtime.language} inline/>
              <small>{previewPlace.subcategory ? translateKnownLabel(runtime.language, previewPlace.subcategory) : localizedField(runtime.language,previewPlace,"category_name",previewPlace.address)}</small>
              <span><b><Star size={13} fill="currentColor" /> {placeRatingLabel(previewPlace, false)}{Number(previewPlace.rating || 0) > 0 ? ` · ${previewPlace.review_count || 0}` : ""}</b><em>{previewPlace.is_open_now === true ? tr(runtime.language, "Відкрито", "Open", "Otwarte") : previewPlace.is_open_now === false ? tr(runtime.language, "Зачинено", "Closed", "Zamknięte") : tr(runtime.language, "Графік", "Hours", "Godziny")} · {placeHoursLabel(previewPlace, runtime.language)}</em></span>
              <span><b>{distanceLabel(previewPlace.distance_m, runtime.language)}</b><em><WalkingIcon size={13} /> {walkLabel(previewPlace.distance_m, previewPlace.walking_duration_s, runtime.language)}</em></span>
              <div><button type="button" onClick={() => setPreviewPlace(null)}>{tr(runtime.language, "Закрити", "Close", "Zamknij")}</button><button type="button" className="is-primary" onClick={() => openPlace(previewPlace)}>{tr(runtime.language, "Відкрити", "Open", "Otwórz")}</button></div>
            </div>
          </div> : null}
        </section>

        <section className={`gt-nearby-design__sheet ${resultsExpanded ? "is-expanded" : ""}`}
          onTouchStart={(event) => { sheetTouchStartY.current = event.touches[0]?.clientY ?? null; }}
          onTouchEnd={(event) => {
            const startY = sheetTouchStartY.current; const endY = event.changedTouches[0]?.clientY; sheetTouchStartY.current = null;
            if (startY == null || endY == null) return; const deltaY = endY - startY; if (deltaY < -28) setResultsExpanded(true); if (deltaY > 28) setResultsExpanded(false);
          }}>
          <button type="button" className="gt-nearby-design__sheet-head" onClick={() => setResultsExpanded((value) => !value)} aria-expanded={resultsExpanded}>
            <span className="gt-nearby-design__sheet-caret"><ChevronRight size={18} /></span><strong>{tr(runtime.language, "Поруч з вами", "Near you", "W pobliżu")}</strong><span>{nearbyPlaces.length} {tr(runtime.language, "місць", "places", "miejsc")}</span>
          </button>
          {resultsExpanded ? (
            <div className="gt-nearby-design__cards">
              {nearbyPlaces.map((place) => (
                <button type="button" className="gt-nearby-design__card" key={place.id} onClick={() => openPlace(place)}>
                  <RemotePlaceImage url={place.image_url} className="gt-photo gt-nearby-design__remote-photo" google={hasGooglePhotoCandidate(place)} googlePlaceId={googlePlaceId(place)} fallback={<Thumb name={placePhotoFallback(place)} />} />
                  <span className="gt-nearby-design__card-copy">
                    <strong>{localizedField(runtime.language,place,"name")}<PlaceBadges place={place} language={runtime.language} inline/></strong><small>{place.subcategory ? translateKnownLabel(runtime.language,place.subcategory) : localizedField(runtime.language,place,"category_name")}</small>
                    <span><b><Star size={12} fill="currentColor" /> {placeRatingLabel(place, false)}</b><em>{distanceLabel(place.distance_m, runtime.language)} · {walkLabel(place.distance_m, place.walking_duration_s, runtime.language)}</em></span>
                  </span>
                </button>
              ))}
              {nearbyLoading && !nearbyPlaces.length ? <div className="gt-stage2-empty">{tr(runtime.language, "Завантажуємо місця поруч…", "Loading nearby places…", "Ładowanie miejsc w pobliżu…")}</div> : null}
              {!nearbyLoading && !nearbyPlaces.length ? <div className="gt-stage2-empty">{tr(runtime.language, "У цьому радіусі місць не знайдено", "No places found within this radius", "Brak miejsc w tym promieniu")}</div> : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function PlaceScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const [place, setPlace] = useState<Stage2Place | null>(() => runtime.selectedPlace);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [nativeReviews, setNativeReviews] = useState<Array<{id:string;rating:number;text:string;author:string;created_at:string;partner_reply?:string|null}>>([]);
  const [nativeReviewsLoaded, setNativeReviewsLoaded] = useState(false);
  const [nativeReviewsLoading, setNativeReviewsLoading] = useState(false);
  const [nativeReviewsError, setNativeReviewsError] = useState("");
  const reviewsRequestVersion = useRef(0);
  const [bookableResources,setBookableResources] = useState<BookingResource[]>([]);
  const fallbackId = runtime.selectedPlaceId || runtime.selectedPlace?.id || runtime.context?.place?.id || "";

  useEffect(() => {
    if (!fallbackId) return;
    let cancelled = false;
    const immediate = runtime.selectedPlace?.id === fallbackId ? runtime.selectedPlace : null;
    const point = runtime.location ?? (runtime.context ? { lat: Number(runtime.context.place?.lat ?? runtime.context.region.lat), lng: Number(runtime.context.place?.lng ?? runtime.context.region.lng) } : null);
    const cacheKey = googlePlaceDetailCacheKey(fallbackId, point?.lat, point?.lng);
    const isExternal = fallbackId.startsWith("google_") || fallbackId.startsWith("geoapify_") || isExternalPlace(immediate);
    const cached = isExternal ? readGooglePlaceDetailCache(cacheKey) : null;
    setPlace((current) => current?.id === fallbackId ? current : cached ?? immediate);
    setPlaceLoading(!cached);
    const suffix = point ? `?lat=${encodeURIComponent(String(point.lat))}&lng=${encodeURIComponent(String(point.lng))}` : "";
    if (!cached) {
      void stage2Fetch<Stage2Place>(`/places/${encodeURIComponent(fallbackId)}${suffix}`).then((next) => {
        if (isExternalPlace(next)) writeGooglePlaceDetailCache(cacheKey, next);
        if (!cancelled) setPlace(next);
      }).catch(() => {
        if (!cancelled && runtime.context?.place?.id === fallbackId) setPlace(runtime.context.place);
      }).finally(() => { if (!cancelled) setPlaceLoading(false); });
    }
    void stage2Fetch<Stage2Place[]>("/me/favorites").then((items) => { if (!cancelled) setFavorite(items.some((item) => item.id === fallbackId)); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [fallbackId, runtime.context?.place, runtime.location?.lat, runtime.location?.lng, runtime.selectedPlace]);

  useEffect(() => { reviewsRequestVersion.current += 1; setReviewsOpen(false); setNativeReviews([]); setNativeReviewsLoaded(false); setNativeReviewsLoading(false); setNativeReviewsError(""); }, [fallbackId]);
  const loadedPlace = place?.id === fallbackId ? place : null;
  const selectedFallback = runtime.selectedPlace?.id === fallbackId ? runtime.selectedPlace : null;
  const contextFallback = runtime.context?.place?.id === fallbackId ? runtime.context.place : null;
  const current = loadedPlace ?? selectedFallback ?? contextFallback;
  useEffect(()=>{
    if(!current?.id){setBookableResources([]);return;}
    let cancelled=false;
    void stage2Fetch<BookingResource[]>(`/resources/${encodeURIComponent(current.id)}`)
      .then(items=>{if(!cancelled)setBookableResources(items);})
      .catch(()=>{if(!cancelled)setBookableResources([]);});
    return ()=>{cancelled=true;};
  },[current?.id]);
  if (!current) {
    return <div className="tourist-screen gt-screen"><main className="gt-content">{!placeLoading ? <div className="gt-stage2-empty">{tr(runtime.language, "Локацію не вибрано або вона відсутня в базі", "No place selected or it is unavailable", "Nie wybrano miejsca lub jest ono niedostępne")}</div> : null}</main></div>;
  }
  const daily = current.work_hours?.daily as { from?: string; to?: string } | undefined;
  const googleWeekdays = Array.isArray(current.details?.google_weekday_descriptions) ? current.details.google_weekday_descriptions.map(String) : [];
  const hours = current.work_hours?.always_open === true ? tr(runtime.language, "Цілодобово", "Open 24/7", "Całodobowo") : daily?.from && daily?.to ? `${tr(runtime.language, "Щодня", "Daily", "Codziennie")} · ${daily.from}–${daily.to}` : googleWeekdays[0] || tr(runtime.language, "Графік уточнюється", "Hours to be confirmed", "Godziny do ustalenia");
  const phone = phoneForPlace(current);
  const phoneHref = telHref(phone);
  const reviewsHref = googleReviewsUri(current) || (typeof current.attributes?.google_maps_uri === "string" ? current.attributes.google_maps_uri : "");
  const googleReviews = googleReviewsForPlace(current);
  const fallbackStraightDistance = runtime.location ? Math.round((() => {
    const r=6371000,toRad=(v:number)=>v*Math.PI/180,dLat=toRad(Number(current.lat)-runtime.location!.lat),dLng=toRad(Number(current.lng)-runtime.location!.lng);
    const a=Math.sin(dLat/2)**2+Math.cos(toRad(runtime.location!.lat))*Math.cos(toRad(Number(current.lat)))*Math.sin(dLng/2)**2; return 2*r*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  })()) : null;
  const currentDistance = current.distance_m ?? fallbackStraightDistance;
  const distance = distanceLabel(currentDistance, runtime.language);
  const walkingTime = walkLabel(currentDistance, current.walking_duration_s, runtime.language);

  const openRoute = () => {
    void trackEvent("route_clicked", { regionId: current.region_id, placeId: current.id });
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${current.lat},${current.lng}`)}`, "_blank", "noopener,noreferrer");
  };
  const toggleFavorite = async () => {
    try {
      await stage2Fetch(`/me/favorites/${encodeURIComponent(current.id)}`, { method: favorite ? "DELETE" : "POST" });
      setFavorite((value) => !value);
    } catch {
      // Guest mode: favorites become available after Telegram auth.
    }
  };

  const openReviews = () => {
    setReviewsOpen(true);
    if (isExternalPlace(current)) return; // External POIs can show only reviews supplied by their provider.
    const requestVersion = ++reviewsRequestVersion.current;
    setNativeReviewsLoading(true);
    setNativeReviewsError("");
    void stage2Fetch<Array<{id:string;rating:number;text:string;author:string;created_at:string;partner_reply?:string|null}>>(`/reviews/place/${encodeURIComponent(current.id)}`)
      .then(items => { if (requestVersion !== reviewsRequestVersion.current) return; setNativeReviews(Array.isArray(items) ? items : []); setNativeReviewsLoaded(true); })
      .catch(error => { if (requestVersion !== reviewsRequestVersion.current) return; setNativeReviewsError(error instanceof Error ? error.message : tr(runtime.language,"Не вдалося завантажити відгуки","Reviews could not be loaded","Nie udało się wczytać opinii")); })
      .finally(() => { if (requestVersion === reviewsRequestVersion.current) setNativeReviewsLoading(false); });
  };

  const callPlace = () => {
    if (!phoneHref) return;
    void trackEvent("call_clicked", { regionId: current.region_id, placeId: current.id });
    try {
      window.location.href = phoneHref;
    } catch {
      const link = document.createElement("a");
      link.href = phoneHref;
      link.click();
    }
  };

  return (
    <div className="tourist-screen gt-screen">
      <section className={`gt-place-hero ${current.image_url ? "has-real-photo" : ""}`}>
        {current.image_url || current.source === "google" || current.source === "geoapify" ? <RemotePlaceImage key={current.id} url={current.image_url} alt={current.name} className="gt-place-hero__image" google={hasGooglePhotoCandidate(current)} googlePlaceId={googlePlaceId(current)} eager diagnostics={current.source === "google" || current.source === "geoapify" || current.attributes?.google === true} diagnosticHint={typeof current.details?.photo_error === "string" ? current.details.photo_error : ""} fallback={<Thumb name={placePhotoFallback(current)} />} /> : null}
        <span className="gt-place-hero__shade" aria-hidden="true" />
        {current.attributes?.verified === true ? <span className="gt-pill gt-pill--glass"><BadgeCheck size={16} /> {tr(runtime.language, "Перевірено", "Verified", "Zweryfikowano")}</span> : null}
        <div>
          {typeof current.details?.logo_url === "string" && current.details.logo_url ? <img className="gt-place-brand-logo" src={current.details.logo_url} alt={`Логотип ${current.name}`}/> : null}
          <h1>{current.name}</h1>
          <PlaceBadges place={current} language={runtime.language}/>
          <p><MapPin size={17} /> {runtime.context?.region.name || current.address || tr(runtime.language, "Поточна локація", "Current location", "Bieżąca lokalizacja")} · {distance}</p>
        </div>
      </section>
      <main className="gt-content gt-content--overlap">
        <div className="gt-place-summary">
          <button type="button" className="gt-place-summary__reviews-button" onClick={openReviews}><Star size={19} fill="currentColor" /><strong>{placeRatingLabel(current, false)}</strong><small>{`${current.review_count || 0} ${tr(runtime.language, "відгуків", "reviews", "opinii")}`}</small></button>
          <span><Clock3 size={19} /><strong>{current.is_open_now === true ? tr(runtime.language, "Відкрито", "Open", "Otwarte") : current.is_open_now === false ? tr(runtime.language, "Зачинено", "Closed", "Zamknięte") : tr(runtime.language, "Графік", "Hours", "Godziny")}</strong><small>{daily?.to ? `${tr(runtime.language, "до", "until", "do")} ${daily.to}` : tr(runtime.language, "див. нижче", "see below", "zobacz niżej")}</small></span>
          <span><MapPin size={19} /><strong>{distance}</strong><small><WalkingIcon size={12} /> {walkingTime} {tr(runtime.language, "пішки", "walk", "pieszo")}</small></span>
        </div>
        <div className="gt-action-grid">
          <button type="button" onClick={openRoute}><Navigation size={22} /><span>{tr(runtime.language, "Маршрут", "Route", "Trasa")}</span></button>
          <button type="button" onClick={callPlace} aria-disabled={!phoneHref}><Phone size={22} /><span>{tr(runtime.language, "Дзвінок", "Call", "Zadzwoń")}</span></button>
          <button type="button" onClick={() => current.telegram ? window.open(current.telegram, "_blank", "noopener,noreferrer") : undefined}><MessageCircle size={22} /><span>Telegram</span></button>
          <button type="button" className={favorite ? "is-active" : ""} onClick={() => void toggleFavorite()}><Heart size={22} fill={favorite ? "currentColor" : "none"} /><span>{favorite ? tr(runtime.language, "Збережено", "Saved", "Zapisano") : tr(runtime.language, "Зберегти", "Save", "Zapisz")}</span></button>
        </div>
        {bookableResources.length ? <button type="button" className="gt-primary-button gt-place-book-button" onClick={()=>{window.sessionStorage.removeItem(BOOKING_SERVICE_KEY);runtime.setSelectedPlace(current);navigate('tourist','booking');}}><CalendarDays size={20}/> <TouristText uk="Забронювати"/> <span>{bookableResources.length} {bookableResources.length===1?'ресурс':'ресурси'}</span><ChevronRight size={18}/></button>:null}
        {Array.isArray(current.details?.services) && current.details.services.some((s:unknown)=>typeof s==='object'&&s!==null&&(s as {active?:boolean;hidden?:boolean}).active!==false&&(s as {hidden?:boolean}).hidden!==true) ? <button type="button" className="gt-detail-card gt-place-services-link" onClick={()=>{runtime.setSelectedPlace(current);navigate('tourist','hotel-services');}}><span><Hotel size={22}/></span><div><strong><TouristText uk="Послуги закладу"/></strong><small><TouristText uk="Тільки послуги, додані партнером"/></small></div><ChevronRight size={19}/></button> : null}
        <SectionTitle title={tr(runtime.language, "Про заклад", "About", "O miejscu")} />
        <p className="gt-body-copy">{current.description || tr(runtime.language, "Інформація про заклад уточнюється.", "Place information is being updated.", "Informacje o miejscu są aktualizowane.")}</p>
        <div className="gt-detail-card">
          <span><Clock3 size={22} /></span><div><strong>{tr(runtime.language, "Графік роботи", "Opening hours", "Godziny otwarcia")}</strong><small>{hours}</small></div><ChevronRight size={19} />
        </div>
        <div className="gt-detail-card">
          <span><MapPin size={22} /></span><div><strong>{tr(runtime.language, "Адреса", "Address", "Adres")}</strong><small>{current.address}</small></div><ChevronRight size={19} />
        </div>
        {phone && phoneHref ? <a className="gt-detail-card gt-detail-card--link" href={phoneHref} onClick={(event) => { event.preventDefault(); callPlace(); }}><span><Phone size={22} /></span><div><strong>{tr(runtime.language, "Телефон", "Phone", "Telefon")}</strong><small>{phone}</small></div><ChevronRight size={19} /></a> : null}
        {current.website ? <a className="gt-detail-card gt-detail-card--link" href={current.website} target="_blank" rel="noreferrer"><span><Globe size={22} /></span><div><strong>{tr(runtime.language, "Сайт", "Website", "Strona")}</strong><small>{current.website}</small></div><ChevronRight size={19} /></a> : null}
        {googleWeekdays.length ? <section className="gt-google-hours"><strong>{tr(runtime.language, "Графік роботи", "Opening hours", "Godziny otwarcia")}</strong>{googleWeekdays.map((line) => <small key={line}>{line}</small>)}</section> : null}
        {visiblePlaceTags(current).length ? <div className="gt-stage2-place-tags">{visiblePlaceTags(current).map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
        <button type="button" className="gt-primary-button" onClick={openRoute}>{tr(runtime.language, "Побудувати маршрут", "Build route", "Wyznacz trasę")} <Navigation size={20} /></button>
      </main>
      {reviewsOpen ? <div className="gt-reviews-modal" role="dialog" aria-modal="true" aria-label={tr(runtime.language, "Відгуки про заклад", "Place reviews", "Opinie o miejscu")} onClick={() => setReviewsOpen(false)}>
        <section onClick={(event) => event.stopPropagation()}>
          <header>
            <div><strong>{tr(runtime.language, "Відгуки про заклад", "Place reviews", "Opinie o miejscu")}</strong><small>{placeRatingLabel(current, false)} · {isExternalPlace(current) ? (current.review_count || googleReviews.length) : nativeReviewsLoaded ? nativeReviews.length : (current.review_count || 0)} {tr(runtime.language, "відгуків", "reviews", "opinii")}</small></div>
            <button type="button" aria-label={tr(runtime.language, "Закрити", "Close", "Zamknij")} onClick={() => setReviewsOpen(false)}><X size={19} /></button>
          </header>
          {nativeReviewsLoading && !isExternalPlace(current) ? <p className="gt-reviews-state">{tr(runtime.language,"Завантажуємо відгуки…","Loading reviews…","Wczytywanie opinii…")}</p> : null}
          {nativeReviewsError && !isExternalPlace(current) ? <p className="gt-reviews-state" role="alert">{nativeReviewsError}</p> : null}
          <div className="gt-google-reviews__list">
            {isExternalPlace(current) ? googleReviews.map((review,index) => <article key={`${review.author}-${review.time}-${index}`}>
              <div><strong>{review.author}</strong><span><Star size={14} fill="currentColor" /> {review.rating > 0 ? review.rating.toFixed(1) : "—"}</span></div>
              <p>{review.text}</p>{review.time ? <small>{review.time}</small> : null}
            </article>) : nativeReviews.map(review => <article key={review.id}>
              <div><strong>{review.author || tr(runtime.language,"Відвідувач","Visitor","Gość")}</strong><span><Star size={14} fill="currentColor" /> {Number(review.rating).toFixed(1)}</span></div>
              {review.text ? <p>{review.text}</p> : null}
              {review.created_at ? <small>{new Date(review.created_at).toLocaleDateString(runtime.language === "uk" ? "uk-UA" : runtime.language === "pl" ? "pl-PL" : "en-US")}</small> : null}
              {review.partner_reply ? <p className="gt-review-partner-reply"><strong>{tr(runtime.language,"Відповідь закладу:","Venue response:","Odpowiedź obiektu:")}</strong> {review.partner_reply}</p> : null}
            </article>)}
          </div>
          {!isExternalPlace(current) && !nativeReviewsLoading && nativeReviewsLoaded && nativeReviews.length === 0 ? <p className="gt-reviews-state">{tr(runtime.language,"Для цього закладу поки немає опублікованих відгуків.","There are no published reviews for this place yet.","Nie ma jeszcze opublikowanych opinii o tym miejscu.")}</p> : null}
          {isExternalPlace(current) && !googleReviews.length ? <p className="gt-reviews-state">{tr(runtime.language,"Тексти відгуків для цього місця недоступні.","Review texts are unavailable for this place.","Treści opinii o tym miejscu są niedostępne.")}</p> : null}
          {isExternalPlace(current) && reviewsHref ? <button type="button" className="gt-primary-button" onClick={() => window.open(reviewsHref, "_blank", "noopener,noreferrer")}>{tr(runtime.language, "Переглянути всі відгуки", "See all reviews", "Zobacz wszystkie opinie")} <ExternalLink size={18} /></button> : null}
        </section>
      </div> : null}
    </div>
  );
}

function AvailableScreen({ navigate }: { navigate: Navigate }) {
  return <DynamicCategoryScreen navigate={navigate} config={{
    category: "rest", className: "gt-rest-screen", icon: BedDouble, title: "Де відпочити", titleEn: "Relax", titlePl: "Wypoczynek",
    subtitle: "Місця для релаксу та відпочинку", subtitleEn: "Relax and wellness places", subtitlePl: "Relaks i wypoczynek", tone: "purple",
    placeholder: "Пошук відпочинку та розваг", placeholderEn: "Search relaxation and activities", placeholderPl: "Szukaj wypoczynku i atrakcji", sectionTitle: "Рекомендовані місця для відпочинку", sectionTitleEn: "Recommended places to relax", sectionTitlePl: "Polecane miejsca wypoczynku",
    fallbackChips: ["Чани","Сауни","Басейни","Масаж","Походи","Екскурсії"],
  }} />;
}

function ShopScreen({ navigate }: { navigate: Navigate }) {
  return <DynamicCategoryScreen navigate={navigate} config={{
    category: "shop", className: "gt-shop-screen", icon: ShoppingBag, title: "Де купити", titleEn: "Shopping", titlePl: "Zakupy",
    subtitle: "Магазини та корисні покупки", subtitleEn: "Shops and useful purchases", subtitlePl: "Sklepy i zakupy", tone: "blue",
    placeholder: "Пошук магазину або товарів", placeholderEn: "Search shops or products", placeholderPl: "Szukaj sklepu lub produktów", sectionTitle: "Магазини поруч", sectionTitleEn: "Shops nearby", sectionTitlePl: "Sklepy w pobliżu",
    fallbackChips: ["Продовольчі","Промтовари","Сувеніри","Аптеки"],
  }} />;
}

function EntertainmentScreen({ navigate }: { navigate: Navigate }) {
  return <DynamicCategoryScreen navigate={navigate} config={{
    category: "entertainment", className: "gt-entertainment-screen", icon: Bike, title: "Розваги", titleEn: "Entertainment", titlePl: "Rozrywka",
    subtitle: "Активності та яскраві враження", subtitleEn: "Activities and impressions", subtitlePl: "Aktywności i wrażenia", tone: "red",
    placeholder: "Пошук розваг", placeholderEn: "Search entertainment", placeholderPl: "Szukaj atrakcji", sectionTitle: "Активні розваги поруч", sectionTitleEn: "Activities nearby", sectionTitlePl: "Atrakcje w pobliżu",
    fallbackChips: ["Джипи","Квадроцикли","Рафтинг","Зіплайн","Для дітей","Коні"],
  }} />;
}

type TransferDisplayPlace = {
  image: string;
  title: string;
  subtitle: string;
  rating: string;
  distance: string;
  walk: string;
  walking: boolean;
  tags: string[];
  google?: boolean;
  googlePlaceId?: string;
  eager?: boolean;
};

function TransferReferenceRow({ place, onClick }: { place: TransferDisplayPlace; onClick?: () => void }) {
  return (
    <article className="gt-transfer-reference-row" onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      <RemotePlaceImage url={place.image} className="gt-transfer-reference-row__image" google={place.google} googlePlaceId={place.googlePlaceId} eager={place.eager} fallback={<div className="gt-transfer-reference-row__image gt-real-place-image-placeholder"><CarFront size={24} /></div>} />
      <div className="gt-transfer-reference-row__body">
        <div className="gt-transfer-reference-row__title">
          <strong>{place.title}</strong>
          <b>{place.distance}</b>
        </div>
        <p>{place.subtitle}</p>
        <div className="gt-transfer-reference-row__meta">
          <span><Star size={14} fill="currentColor" /> {place.rating}</span>
          <span>{place.walking ? <WalkingIcon size={13} /> : <CarFront size={13} />} {place.walk}</span>
        </div>
        <div className="gt-transfer-reference-row__tags">
          {place.tags.map((tag) => <i key={tag}>{tag}</i>)}
        </div>
      </div>
    </article>
  );
}

function TransferScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("Усі");
  const [places, setPlaces] = useState<Stage2Place[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [transferLoading, setTransferLoading] = useState(true);
  const [transferCategory, setTransferCategory] = useState<Stage2Category | null>(null);

  useEffect(() => {
    let cancelled = false;
    void stage2Fetch<Stage2Category[]>("/categories").then((items) => { if (!cancelled) setTransferCategory(items.find((item) => item.slug === "transfer") ?? null); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!runtime.location && !runtime.context) return;
    let cancelled = false;
    const enrichmentSeen = new Set<string>();
    const isCancelled = () => cancelled;
    const timer = window.setTimeout(() => {
      const point = runtime.location ?? (runtime.context ? { lat: Number(runtime.context.place?.lat ?? runtime.context.region.lat), lng: Number(runtime.context.place?.lng ?? runtime.context.region.lng) } : null);
      if (!point) return;
      const makeParams = (limit: number) => {
        const params = new URLSearchParams({ region_id: runtime.location?.source === "gps" ? "" : (runtime.context?.region.id || ""), category: "transfer" });
        params.set("lat", String(point.lat)); params.set("lng", String(point.lng)); params.set("radius", "15000");
        params.set("include_routes", "false");
        if (query.trim()) params.set("q", query.trim());
        if (chip !== "Усі") params.set("subcategory", chip);
        return params;
      };
      const cacheKey = `gid-transfer-cache-admin-only-v2:${point.lat.toFixed(3)}:${point.lng.toFixed(3)}:${chip}:${query.trim().toLocaleLowerCase("uk")}`;
      let hasCachedPlaces = false;
      let cachedPlaces: Stage2Place[] = [];
      try {
        const cached = window.sessionStorage.getItem(cacheKey);
        if (cached && chip === "Усі" && !query.trim()) {
          const parsed = adminCreatedPlacesOnly(JSON.parse(cached) as Stage2Place[]);
          if (Array.isArray(parsed) && parsed.length) {
            hasCachedPlaces = true; cachedPlaces = parsed; revealPlacesProgressively(parsed, setPlaces, isCancelled); setApiLoaded(true); setTransferLoading(false);
          }
        }
      } catch { /* optional cache */ }
      if (!hasCachedPlaces) { setPlaces([]); setTransferLoading(true); }
      if (cachedPlaces.length) void enrichPlaceCardsProgressively(cachedPlaces, setPlaces, isCancelled, enrichmentSeen);
      const loadFull = () => void stage2Fetch<Stage2Place[]>(`/places?${makeParams(20)}`).then((rawItems) => {
        const items = adminCreatedPlacesOnly(rawItems);
        if (cancelled) return; revealPlacesProgressively(items, setPlaces, isCancelled); setApiLoaded(true); setTransferLoading(false);
        try { window.sessionStorage.setItem(cacheKey, JSON.stringify(items)); } catch { /* ignore */ }
        void enrichPlaceCardsProgressively(items, setPlaces, isCancelled, enrichmentSeen);
      }).catch(() => { if (!cancelled) { setApiLoaded(true); setTransferLoading(false); } });
      loadFull();
    }, query.trim() ? 160 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [runtime.context, runtime.location, query, chip]);

  const display = places.map((place, index) => ({
    image: place.image_url || "",
    title: localizedField(runtime.language,place,"name"),
    subtitle: localizedField(runtime.language,place,"description") || (place.subcategory ? translateKnownLabel(runtime.language, place.subcategory) : tr(runtime.language, "Транспортна послуга", "Transport service", "Usługa transportowa")),
    rating: placeRatingLabel(place),
    distance: distanceLabel(place.distance_m, runtime.language),
    walk: walkLabel(place.distance_m, place.walking_duration_s, runtime.language),
    walking: false,
    google: hasGooglePhotoCandidate(place),
    googlePlaceId: googlePlaceId(place),
    eager: index < 4,
    tags: (visiblePlaceTags(place).length ? visiblePlaceTags(place).map((tag) => translateKnownLabel(runtime.language, tag)) : [place.subcategory ? translateKnownLabel(runtime.language, place.subcategory) : tr(runtime.language, "Трансфер", "Transfer", "Transport")]).slice(0, 3),
  }));

  return (
    <div className="tourist-screen gt-screen gt-transfer-reference-screen">
      <main className="gt-transfer-reference-content">
        <CategoryHeader icon={CarFront} title={tr(runtime.language, "Трансфер", "Transfer", "Transport")} subtitle={tr(runtime.language, "Транспортні послуги та перевезення", "Transport services and rides", "Usługi transportowe i przejazdy")} tone="teal" onMap={() => navigate("tourist", "nearby")} />
        <SearchBar placeholder={tr(runtime.language, "Пошук трансферу або маршруту", "Search transfer or route", "Szukaj transportu lub trasy")} value={query} onChange={setQuery} />
        <div className="gt-transfer-reference-chips"><Chips items={["Усі", ...((transferCategory?.subcategories?.length ? transferCategory.subcategories : ["Таксі", "Автостанції", "Парковки", "Оренда авто", "Заправки"]).filter((item) => item !== "Усі"))]} selected={chip} onSelect={setChip} displayLabel={(item) => translateKnownLabel(runtime.language, item)} /></div>
        <MapStrip real places={places} />
        <SectionTitle title={tr(runtime.language, "Трансфери поруч", "Transfers nearby", "Transport w pobliżu")} action={`${display.length}`} />
        <div className="gt-transfer-reference-list">
          {display.map((place, index) => <TransferReferenceRow key={`${place.title}-${index}`} place={place} onClick={places[index] ? () => { runtime.setSelectedPlace(places[index]); navigate("tourist", "place"); } : undefined} />)}
          {transferLoading && !display.length ? Array.from({ length: 4 }).map((_, index) => <div className="gt-transfer-reference-row gt-place-row--skeleton" key={`transfer-loading-${index}`}><span className="gt-place-row__skeleton-photo"/><span className="gt-place-row__skeleton-copy"><i/><i/><i/></span></div>) : null}
        </div>
        {apiLoaded && !transferLoading && !places.length ? <div className="gt-stage2-empty">{tr(runtime.language, "Трансферів не знайдено", "No transfers found", "Nie znaleziono transportu")}</div> : null}
      </main>
    </div>
  );
}

type BookingResource = {id:string; place_id:string;name:string;price:number;capacity:number;duration_minutes:number;working_hours?:{service_id?:string;price_type?:string;price_text?:string;price_max?:number|null;from?:string;to?:string;days?:number[]}};
type BookingRecord = {id:string;place_name?:string;resource_name?:string;starts_at:string;status:string;price:number};

function BookingScreen({ navigate }: { navigate: Navigate }) {
  const runtime=useTouristRuntime();
  const selected=runtime.selectedPlace;
  const translate=(value:string)=>touristInterfaceText(runtime.language,value);
  const [service]=useState<{placeId:string;id:string;name:string;image:string;priceType:string;price:string;currency:string}|null>(()=>{
    if(typeof window==='undefined')return null;
    try{const value=window.sessionStorage.getItem(BOOKING_SERVICE_KEY);return value?JSON.parse(value):null;}catch{return null;}
  });
  const placeId=service?.placeId||selected?.id||runtime.selectedPlaceId||runtime.context?.place?.id||'';
  const serviceSelected=service?.placeId===placeId?service:null;
  const [actualService,setActualService]=useState<PublicPartnerService|null>(null);
  useEffect(()=>{
    if(!placeId||!serviceSelected?.id){setActualService(null);return;}
    let closed=false;
    void stage2Fetch<PublicPartnerService[]>(`/partner/services/public/${encodeURIComponent(placeId)}`)
      .then(items=>{if(!closed)setActualService(items.find(item=>item.id===serviceSelected.id)||null);})
      .catch(()=>{if(!closed)setActualService(null);});
    return()=>{closed=true;};
  },[placeId,serviceSelected?.id]);
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const [date,setDate]=useState(today);
  const [resources,setResources]=useState<BookingResource[]>([]);
  const [slots,setSlots]=useState<Record<string,string[]>>({});
  const [resourceId,setResourceId]=useState('');
  const [time,setTime]=useState('');
  const [people,setPeople]=useState(1);
  const [phone,setPhone]=useState('');
  const [comment,setComment]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const [confirmed,setConfirmed]=useState(false);
  useEffect(()=>{
    if(!placeId){setLoading(false);return;}
    let cancelled=false;setLoading(true);setError('');
    void stage2Fetch<{resources:BookingResource[];slots:Record<string,string[]>}>(`/bookings/availability?place_id=${encodeURIComponent(placeId)}&date=${date}`)
      .then(result=>{if(!cancelled){setResources(result.resources||[]);setSlots(result.slots||{});}})
      .catch(e=>{if(!cancelled){setResources([]);setSlots({});setError(e instanceof Error?e.message:translate('Не вдалося завантажити доступність'));}})
      .finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[placeId,date]);
  const bookables=serviceSelected?resources.filter(r=>r.working_hours?.service_id===serviceSelected.id):resources;
  useEffect(()=>{if(!bookables.some(r=>r.id===resourceId))setResourceId(bookables[0]?.id||'');},[resources,resourceId,serviceSelected?.id]);
  const resource=bookables.find(r=>r.id===resourceId);
  const availableSlots=resource?slots[resource.id]||[]:[];
  useEffect(()=>{if(!availableSlots.includes(time))setTime(availableSlots[0]||'');},[resourceId,date,slots,time]);
  const venuePlace=selected?.id===placeId?selected:runtime.context?.place?.id===placeId?runtime.context.place:null;
  const photo=actualService?.image||serviceSelected?.image||venuePlace?.image_url||'';
  const name=actualService?localizedField(runtime.language,actualService,'name',serviceSelected?.name||''):serviceSelected?.name||localizedField(runtime.language,venuePlace,'name',translate('Бронювання'));
  const priceText=resource?.working_hours?.price_text||serviceSelected?.price||'';
  const priceType=resource?.working_hours?.price_type||serviceSelected?.priceType||'';
  const priceLabel=!resource?'—':priceType==='free'?translate('Безкоштовно'):
    priceType==='request'?translate('За запитом'):
    priceType==='range'?`${priceText} ₴ (${translate('діапазон')})`:
    priceType==='from'?`${translate('Від')} ${priceText} ₴`:resource?`${Number(resource.price).toLocaleString('uk-UA')} ₴`:'—';
  const send=async()=>{
    if(!resource||!time||!availableSlots.includes(time)){setError(translate('Оберіть доступний час'));return;}
    if(people<1||people>resource.capacity){setError(translate('Кількість гостей перевищує місткість'));return;}
    setSaving(true);setError('');
    try{
      await stage2Fetch('/bookings',{method:'POST',body:JSON.stringify({resource_id:resource.id,starts_at:kyivBookingIso(date,time),party_size:people,phone,comment,client_name:[runtime.user?.first_name,runtime.user?.last_name].filter(Boolean).join(' ')})});
      setConfirmed(true);
    }catch(e){setError(e instanceof Error?e.message:translate('Не вдалося створити бронювання'));}
    finally{setSaving(false);}
  };
  return <div className="tourist-screen gt-screen"><main className="gt-content">
    <button type="button" className="gt-back-button" onClick={()=>navigate('tourist','hotel-services')}><ArrowLeft size={18}/>{translate('До послуг')}</button>
    <div className="gt-page-heading"><span className="gt-tone--green"><CalendarDays size={23}/></span><div><h1>{translate('Бронювання')}</h1><p>{translate('Оберіть доступний час послуги')}</p></div></div>
    <div className="gt-booking-place gt-real-booking-place">
      {photo?<img className="gt-real-booking-image" src={photo} alt={name}/>:<span className="gt-real-booking-image gt-real-booking-placeholder"><Hotel size={27}/></span>}
      <div><strong>{name}</strong><small>{venuePlace?.address||''}</small></div>
    </div>
    {resource&&['from','range','request'].includes(priceType)?<p className="gt-real-service-note">{translate('Остаточну вартість уточнює заклад під час підтвердження бронювання.')}</p>:null}
    {loading?<p className="gt-stage2-empty">{translate('Перевіряємо доступність…')}</p>:null}
    {!loading&&!bookables.length?<p className="gt-notice">{serviceSelected?.id ? translate('Календар цієї послуги ще не доступний. Партнеру потрібно відкрити послугу та зберегти її графік бронювання.') : translate('Цей заклад ще не налаштував онлайн-бронювання послуг.')}</p>:null}
    {bookables.length>1?<><SectionTitle title="Послуга"/><div className="gt-time-grid">{bookables.map(item=><button type="button" key={item.id} className={resourceId===item.id?'is-active':''} onClick={()=>{setResourceId(item.id);setConfirmed(false);}}>{item.name}</button>)}</div></>:null}
    <SectionTitle title="Дата"/><input aria-label={translate('Дата бронювання')} type="date" min={today()} value={date} onChange={event=>{setDate(event.target.value);setConfirmed(false);}} style={{width:'100%',padding:'14px',borderRadius:12,border:'1px solid #dde3df'}}/>
    <SectionTitle title="Вільний час"/>
    {availableSlots.length?<div className="gt-time-grid">{availableSlots.map(slot=><button type="button" key={slot} className={time===slot?'is-active':''} onClick={()=>{setTime(slot);setConfirmed(false);}}>{slot}</button>)}</div>:<p className="gt-stage2-empty">{translate('На обрану дату вільних годин немає.')}</p>}
    <div className="gt-booking-summary"><div><span>{translate('Тривалість')}</span><strong>{resource?.duration_minutes||'—'} {translate('хв')}</strong></div><div><span>{translate('Максимум гостей')}</span><strong>{resource?.capacity||'—'}</strong></div><div><span>{translate('Ціна')}</span><strong>{priceLabel}</strong></div></div>
    <div className="gt-real-booking-fields"><label>{translate('Кількість гостей')}<input type="number" min={1} max={resource?.capacity||1} value={people} onChange={e=>setPeople(Number(e.target.value))}/></label>
      <label>{translate('Телефон для зв’язку')}<input type="tel" placeholder="+380XXXXXXXXX" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
      <label>{translate('Коментар (необов’язково)')}<textarea value={comment} onChange={e=>setComment(e.target.value)}/></label>
    </div>
    {error?<p role="alert" className="gt-booking-message">{error}</p>:null}
    {confirmed?<div className="gt-success-card"><span><Check size={24}/></span><div><strong>{translate('Запит надіслано')}</strong><p>{translate('Бронювання очікує на підтвердження партнера.')}</p></div></div>:
      <button type="button" className="gt-primary-button" disabled={saving||loading||!resource||!time||!availableSlots.includes(time)||people<1||people>resource.capacity} onClick={()=>void send()}>{saving?translate('Надсилаємо…'):translate('Підтвердити бронювання')} <ChevronRight size={20}/></button>}
    <button type="button" className="gt-outline-button" onClick={()=>navigate('tourist','my-bookings')}><CalendarDays size={18}/>{translate('Усі мої бронювання')}</button>
  </main></div>;
}

function MyBookingsScreen({ navigate }: {navigate:Navigate}) {
  const runtime=useTouristRuntime();
  const langText=(text:string)=>touristInterfaceText(runtime.language,text);
  const [bookings,setBookings]=useState<BookingRecord[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const refresh=async()=>{
    try { setBookings(await stage2Fetch<BookingRecord[]>('/bookings'));setError(''); }
    catch(e){setError(e instanceof Error?e.message:langText('Не вдалося завантажити бронювання'));}
    finally{setLoading(false);}
  };
  useEffect(()=>{void refresh();},[]);
  const statuses:Record<string,string>={pending_partner:'Очікує підтвердження',confirmed:'Підтверджено',completed:'Завершено',cancelled_by_user:'Скасовано вами',cancelled_by_partner:'Відхилено закладом',no_show:'Не відвідано',new:'Нове'};
  const cancel=async(id:string)=>{
    if(!window.confirm(langText('Скасувати бронювання?')))return;
    try{await stage2Fetch(`/bookings/${encodeURIComponent(id)}/status`,{method:'PATCH',body:JSON.stringify({status:'cancelled_by_user'})});await refresh();}
    catch(e){setError(e instanceof Error?e.message:langText('Не вдалося скасувати'));}
  };
  return <div className="tourist-screen gt-screen"><main className="gt-content gt-my-bookings">
    <button type="button" className="gt-back-button" onClick={()=>navigate('tourist','profile')}><ArrowLeft size={19}/> <TouristText uk="До профілю"/></button>
    <div className="gt-page-heading"><span className="gt-tone--green"><CalendarDays size={23}/></span><div><h1><TouristText uk="Мої бронювання"/></h1><p><TouristText uk="Історія заявок та їхній стан"/></p></div></div>
    {loading?<div className="gt-stage2-empty"><TouristText uk="Завантаження…"/></div>:null}
    {error?<p role="alert" className="gt-booking-message">{error}</p>:null}
    {!loading&&!bookings.length?<div className="gt-stage2-empty"><TouristText uk="Ви ще не створювали бронювань. Відкрийте заклад і оберіть «Забронювати»."/></div>:null}
    {bookings.map(b=><article className="gt-booking-summary" key={b.id}><div><span>{b.place_name||langText('Заклад')} · {b.resource_name||langText('Послуга')}</span><strong>{new Date(b.starts_at).toLocaleString(runtime.language==='en'?'en-GB':runtime.language==='pl'?'pl-PL':'uk-UA',{dateStyle:'medium',timeStyle:'short'})}</strong></div><div><span><TouristText uk="Статус"/></span><strong>{langText(statuses[b.status]||b.status)}</strong></div>{['pending_partner','confirmed'].includes(b.status)?<button type="button" onClick={()=>void cancel(b.id)}><TouristText uk="Скасувати"/></button>:null}</article>)}
  </main></div>;
}

function PlanScreen({ navigate }: { navigate: Navigate }) {
  return <RealPlanScreen navigate={navigate} />;
}
function SavedPlansScreen({ navigate }: { navigate: Navigate }) {
  return <RealPlanScreen navigate={navigate} initialView="list" />;
}

type WalletData = {balance:number; entries:Array<{id:string;amount:number;entry_type:string;status:string;place_name?:string;created_at:string;expires_at?:string}>};
function WalletScreen() {
  const runtime=useTouristRuntime();
  const [wallet,setWallet]=useState<WalletData|null>(null);
  const [filter,setFilter]=useState<'all'|'earn'|'spent'>('all');
  const [error,setError]=useState('');
  useEffect(()=>{void stage2Fetch<WalletData>('/wallet').then(setWallet).catch(e=>setError(e instanceof Error?e.message:'Баланс недоступний'));},[]);
  const transactions=(wallet?.entries||[]).filter(item=>filter==='all'||(filter==='earn'?Number(item.amount)>0:Number(item.amount)<0));
  return <div className="tourist-screen gt-screen gt-wallet-screen"><main className="gt-wallet-ledger">
    <section className="gt-wallet-balance"><Gift size={34}/><small><TouristText uk="Ваші бонуси"/></small><strong>{wallet?wallet.balance.toLocaleString('uk-UA'):'—'}</strong><span><TouristText uk="балів"/></span></section>
    <div className="gt-wallet-actions"><button type="button" onClick={()=>setFilter(filter==='earn'?'all':'earn')}><ArrowDownToLine size={24}/><span><TouristText uk="Нарахування"/></span></button><button type="button" onClick={()=>setFilter(filter==='spent'?'all':'spent')}><ArrowUpFromLine size={24}/><span><TouristText uk="Списання"/></span></button></div>
    <section className="gt-wallet-history"><h1><TouristText uk="Історія операцій"/></h1>{error?<p role="alert">{error}</p>:null}<div className="gt-wallet-transactions">
      {transactions.map(item=><article className={Number(item.amount)<0?'is-spent':'is-earned'} key={item.id}><span className="gt-wallet-transaction-icon">{Number(item.amount)<0?<Minus size={23}/>:<Gift size={22}/>}</span><div><strong>{touristInterfaceText(runtime.language,Number(item.amount)<0?'Списано бонусів':'Нараховано бонусів')}</strong><small>{item.place_name||item.entry_type}</small></div><span className="gt-wallet-transaction-value"><b>{Number(item.amount)>0?'+':''}{Number(item.amount)}</b><small>{new Date(item.created_at).toLocaleDateString(runtime.language==='en'?'en-GB':runtime.language==='pl'?'pl-PL':'uk-UA')}</small></span></article>)}
      {wallet&&!transactions.length?<p><TouristText uk="Операцій поки немає"/></p>:null}</div></section>
    <div className="gt-notice"><ShieldCheck size={20}/><p><TouristText uk="1 бонус = 1 грн знижки. Бонуси не передаються між користувачами та не виводяться грошима."/></p></div>
  </main></div>;
}

type GidQrWindow = Window & { GidQRCode?:{render:(token:string)=>string} };
function CustomerQrSvg({token}:{token:string}) {
  const [svg,setSvg]=useState('');
  useEffect(()=>{
    if(!token){setSvg('');return;}
    let cancelled=false;
    const update=()=>{const generator=(window as GidQrWindow).GidQRCode;if(!cancelled&&generator)setSvg(generator.render(token));};
    if((window as GidQrWindow).GidQRCode){update();return;}
    let tag=document.querySelector<HTMLScriptElement>('script[data-gid-qr]');
    if(!tag){tag=document.createElement('script');tag.dataset.gidQr='1';tag.src='/vendor/qr-code.js';document.head.appendChild(tag);}
    tag.addEventListener('load',update);return()=>{cancelled=true;tag?.removeEventListener('load',update);};
  },[token]);
  return svg?<span className="gt-live-customer-qr" style={{display:'block',width:'min(230px,100%)',margin:'15px auto',padding:12,background:'#fff'}} dangerouslySetInnerHTML={{__html:svg}}/>:<div className="gt-stage2-empty"><TouristText uk="Створюємо QR..."/></div>;
}

function QrScreen({ navigate }: { navigate: Navigate }) {
  const runtime=useTouristRuntime();
  const [qr,setQr]=useState<{token:string;expires_at:string}|null>(null);
  const [seconds,setSeconds]=useState(0);
  const [error,setError]=useState('');
  const [canRequestBotMessages,setCanRequestBotMessages]=useState(false);
  const [botPermission,setBotPermission]=useState<'idle'|'allowed'|'denied'>('idle');
  useEffect(()=>{
    const telegram=(window as Window & {Telegram?:{WebApp?:{requestWriteAccess?:(cb:(allowed:boolean)=>void)=>void}}}).Telegram?.WebApp;
    setCanRequestBotMessages(typeof telegram?.requestWriteAccess==='function');
  },[]);
  const requestBotMessages=()=>{
    const telegram=(window as Window & {Telegram?:{WebApp?:{requestWriteAccess?:(cb:(allowed:boolean)=>void)=>void}}}).Telegram?.WebApp;
    telegram?.requestWriteAccess?.((allowed)=>setBotPermission(allowed?'allowed':'denied'));
  };
  useEffect(()=>{
    let cancelled=false;let busy=false;
    const refresh=async()=>{if(busy)return;busy=true;try{const result=await stage2Fetch<{token:string;expires_at:string}>('/qr/customer-token',{method:'POST',body:JSON.stringify({start_param:runtime.context?.qr?.startParam||undefined})});if(!cancelled){setQr(result);setError('');}}catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Не вдалося отримати код');}finally{busy=false;}};
    void refresh();const timer=setInterval(()=>{if(cancelled)return;if(qr?.expires_at){};setSeconds(old=>old);},1000);
    const renew=setInterval(()=>void refresh(),40000);
    return()=>{cancelled=true;clearInterval(timer);clearInterval(renew);};
  },[runtime.context?.qr?.startParam]);
  useEffect(()=>{const run=()=>setSeconds(Math.max(0,Math.ceil(((qr?new Date(qr.expires_at).getTime():Date.now())-Date.now())/1000)));run();const interval=setInterval(run,1000);return()=>clearInterval(interval);},[qr]);
  return <div className="tourist-screen gt-screen"><main className="gt-content gt-qr-screen">
    <div className="gt-page-heading gt-page-heading--center"><span className="gt-tone--green"><QrCode size={25}/></span><div><h1><TouristText uk="Мій QR"/></h1><p><TouristText uk="Для нарахування або списання бонусів"/></p></div></div>
    <div className="gt-qr-panel"><span className="gt-pill gt-pill--success"><span/>{touristInterfaceText(runtime.language,seconds?'QR активний':'Оновлення QR')}</span>{qr&&seconds>0?<CustomerQrSvg token={qr.token}/>:<div className="gt-stage2-empty"><TouristText uk="Оновлюємо код…"/></div>}
      <strong><TouristText uk="Покажіть код працівнику закладу"/></strong><p><TouristText uk="Код одноразовий і оновлюється автоматично"/></p><div className="gt-qr-timer"><Clock3 size={18}/><span><TouristText uk="Діє ще"/></span><strong>00:{String(seconds).padStart(2,'0')}</strong></div></div>
    {error?<p role="alert" style={{color:'#b91c1c'}}>{error}</p>:null}
    {runtime.context?.place?.id ? <div className="gt-notice"><MapPin size={19}/><p>{tr(runtime.language,'QR діє лише в закладі: ','QR valid only at: ','Kod QR działa tylko w obiekcie: ')}<strong>{localizedField(runtime.language,runtime.context.place,'name',runtime.context.place.name)}</strong></p></div>
      : runtime.context?.region.id ? <div className="gt-notice"><MapPin size={19}/><p>{tr(runtime.language,'QR діє в межах регіону: ','QR valid within region: ','Kod QR działa w regionie: ')}<strong>{runtime.language==='en'?(runtime.context.region.nameEn||runtime.context.region.name):runtime.language==='pl'?(runtime.context.region.namePl||runtime.context.region.name):runtime.context.region.name}</strong></p></div> : null}
    <div className="gt-notice"><ShieldCheck size={21}/><p><TouristText uk="Не передавайте QR іншим. Операцію потрібно підтвердити на цьому пристрої."/></p></div>
    {canRequestBotMessages && botPermission!=='allowed' ? <button type="button" className="gt-outline-button" onClick={requestBotMessages}><Bell size={18}/>{tr(runtime.language,'Дозволити повідомлення про покупки','Allow purchase notifications','Zezwól na powiadomienia o zakupach')}</button> : null}
    {botPermission==='allowed'?<div className="gt-notice"><Bell size={19}/><p>{tr(runtime.language,'Доступ до повідомлень дозволено. Якщо у вас є чат із ботом, підтвердження покупок надходитимуть також туди.','Messaging permission granted. If you have a chat with the bot, purchase requests can arrive there too.','Zezwolono na wiadomości. Jeśli masz czat z botem, potwierdzenia zakupów mogą też tam trafiać.')}</p></div>:null}
    {botPermission==='denied'?<div className="gt-notice"><Bell size={19}/><p>{tr(runtime.language,'Щоб отримувати підтвердження в Telegram, дозвольте повідомлення або відкрийте чат із ботом і натисніть /start.','To receive purchase requests in Telegram, allow messages or open the bot chat and tap /start.','Aby otrzymywać potwierdzenia w Telegramie, zezwól na wiadomości albo otwórz czat z botem i wybierz /start.')}</p></div>:null}
    <button type="button" className="gt-primary-button" onClick={()=>navigate('tourist','purchase-confirmation')}><TouristText uk="Перевірити підтвердження"/> <ChevronRight size={20}/></button>
  </main></div>;
}

type PendingPurchase = {id:string;place_name:string;place_logo_url:string|null;place_image_url:string|null;amount:number;spent:number;earned:number;cash_due:number;expires_at:string|null};

function PurchasePlaceLogo({name,logoUrl,imageUrl}:{name:string;logoUrl:string|null;imageUrl:string|null}) {
  const [source,setSource]=useState(logoUrl || imageUrl || '');
  useEffect(()=>setSource(logoUrl || imageUrl || ''),[logoUrl,imageUrl]);
  const nextSource=()=>setSource(current=>current===logoUrl && imageUrl && imageUrl!==logoUrl ? imageUrl : '');
  return <figure className="gt-purchase-place-logo">
    {source?<img src={source} alt={`Зображення закладу ${name}`} onError={nextSource} />
      :<span aria-label={`Логотип закладу ${name} не завантажено`}>{name.trim().charAt(0).toUpperCase() || '•'}</span>}
  </figure>;
}
function PurchaseConfirmationScreen({ navigate }: { navigate: Navigate }) {
  const runtime=useTouristRuntime();
  const [items,setItems]=useState<PendingPurchase[]>([]);
  const [confirmed,setConfirmed]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;const load=()=>void stage2Fetch<PendingPurchase[]>('/transactions/pending').then(list=>{if(active)setItems(list);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Помилка');});load();const timer=setInterval(load,4000);return()=>{active=false;clearInterval(timer);};},[]);
  const item=items[0];
  const action=async(approve:boolean)=>{if(!item)return;setLoading(true);setError('');try{await stage2Fetch(`/transactions/${approve?'confirm':'decline'}`,{method:'POST',body:JSON.stringify({id:item.id})});setItems(items.slice(1));setConfirmed(approve);}catch(e){setError(e instanceof Error?e.message:'Операція не вдалася');}finally{setLoading(false);}};
  return <div className="tourist-screen gt-screen"><main className="gt-content"><div className="gt-page-heading"><span className="gt-tone--green"><ReceiptText size={23}/></span><div><h1><TouristText uk="Підтвердження"/></h1><p><TouristText uk="Перевірте деталі операції"/></p></div></div>
    {item?<div className="gt-purchase-card"><PurchasePlaceLogo name={item.place_name} logoUrl={item.place_logo_url} imageUrl={item.place_image_url}/><strong>{item.place_name}</strong><small><TouristText uk="Запит на підтвердження покупки"/></small><div><span><TouristText uk="Сума покупки"/></span><b>{Number(item.amount)} ₴</b></div><div><span><TouristText uk="Списання бонусів"/></span><b>−{Number(item.spent)}</b></div><div><span><TouristText uk="До сплати грошима"/></span><b>{Number(item.cash_due)} ₴</b></div><div className="is-green"><span><TouristText uk="Буде нараховано"/></span><b>+{Number(item.earned)} {touristInterfaceText(runtime.language,'бонусів')}</b></div></div>:<div className="gt-notice"><ShieldCheck size={21}/><p>{touristInterfaceText(runtime.language,confirmed?'Операцію підтверджено. Баланс оновлено.':'Поки немає операцій на підтвердження. Цей екран перевіряється автоматично.')}</p></div>}
    {error?<p role="alert" style={{color:'#b91c1c'}}>{error}</p>:null}
    {item?<><button type="button" disabled={loading} className="gt-primary-button" onClick={()=>void action(true)}><TouristText uk="Підтвердити операцію"/> <Check size={20}/></button><button type="button" disabled={loading} className="gt-outline-button" onClick={()=>void action(false)}><TouristText uk="Відхилити"/></button></>:<button type="button" className="gt-outline-button" onClick={()=>navigate('tourist','wallet')}><TouristText uk="Перейти до бонусів"/></button>}
  </main></div>;
}

function ReviewScreen() {
  const runtime=useTouristRuntime();
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState('');
  const [events,setEvents]=useState<Array<{id:string;place_name:string;verification:string;visited_at:string;type:string}>>([]);
  const [selected,setSelected]=useState('');
  const [error,setError]=useState('');
  const [success,setSuccess]=useState(false);
  useEffect(()=>{void stage2Fetch<{bookings:Array<{id:string;place_name:string;visited_at:string}>;transactions:Array<{id:string;place_name:string;visited_at:string}>}>('/reviews/eligibility').then(data=>{const list=[...data.bookings.map(x=>({...x,type:'booking',verification:'Підтверджене відвідування'})),...data.transactions.map(x=>({...x,type:'transaction',verification:'Підтверджена покупка'}))];setEvents(list);if(list[0])setSelected(list[0].id);}).catch(e=>setError(String(e)));},[]);
  const current=events.find(x=>x.id===selected);
  const submit=async()=>{if(!current)return;setError('');try{await stage2Fetch('/reviews',{method:'POST',body:JSON.stringify({rating,text:comment,[current.type==='booking'?'booking_id':'transaction_id']:current.id})});setSuccess(true);}catch(e){setError(e instanceof Error?e.message:'Помилка відгуку');}};
  return <div className="tourist-screen gt-screen"><main className="gt-content"><div className="gt-page-heading"><span className="gt-tone--yellow"><Star size={23}/></span><div><h1><TouristText uk="Ваш відгук"/></h1><p><TouristText uk="Після підтвердженого візиту"/></p></div></div>
    {current?<div className="gt-booking-place"><Thumb name="restaurant"/><div><strong>{current.place_name}</strong><small>{touristInterfaceText(runtime.language,current.verification)}</small><span><BadgeCheck size={14}/> <TouristText uk="Перевірений візит"/></span></div></div>:<div className="gt-notice"><Info size={20}/><p><TouristText uk="Відгук доступний лише після завершеного бронювання або підтвердженої QR-покупки."/></p></div>}
    {events.length>1?<select aria-label={touristInterfaceText(runtime.language,"Оберіть відвідування")} value={selected} onChange={e=>setSelected(e.target.value)}>{events.map(x=><option key={x.id} value={x.id}>{x.place_name} · {new Date(x.visited_at).toLocaleDateString(runtime.language==='en'?'en-GB':runtime.language==='pl'?'pl-PL':'uk-UA')}</option>)}</select>:null}
    <section className="gt-review-card"><h2><TouristText uk="Як вам заклад?"/></h2><div className="gt-stars">{[1,2,3,4,5].map(item=><button type="button" aria-label={`${item} ${touristInterfaceText(runtime.language,"зірок")}`} key={item} onClick={()=>setRating(item)}><Star size={34} fill={item<=rating?'currentColor':'none'}/></button>)}</div><label><span><TouristText uk="Розкажіть про враження"/></span><textarea placeholder={touristInterfaceText(runtime.language,"Що сподобалось? Що можна покращити?")} value={comment} onChange={e=>setComment(e.target.value)}/></label></section>
    {error?<p role="alert" style={{color:'#b91c1c'}}>{error}</p>:null}{success?<div className="gt-success-card"><span><Check size={24}/></span><div><strong><TouristText uk="Відгук відправлено на модерацію"/></strong></div></div>:<button type="button" disabled={!current} className="gt-primary-button" onClick={()=>void submit()}><TouristText uk="Опублікувати відгук"/> <Send size={19}/></button>}
  </main></div>;
}

const emergencyServiceIcons: Record<EmergencyService["icon"], LucideIcon> = {
  doctor: UserRound,
  pharmacy: Cross,
  repair: Wrench,
  tow: CarFront,
  vet: PawPrint,
  custom: CircleHelp,
};

function EmergencyScreen() {
  const runtime = useTouristRuntime();
  const [services, setServices] = useState<EmergencyService[]>([]);
  const [remoteContacts, setRemoteContacts] = useState<Array<{ id: string; type: string; title: string; note: string; phone?: string | null; tone: string; translations?: Record<string,Record<string,string>> }>>([]);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState<Record<string, string>>({});
  const [servicePage, setServicePage] = useState(0);
  const serviceScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!runtime.context) return;
    let cancelled = false;
    setRemoteContacts([]);
    setServices([]);
    const loadEmergency = () => {
      void Promise.all([
        stage2Fetch<Array<{ id: string; type: string; title: string; note: string; phone?: string | null; tone: string; translations?: Record<string,Record<string,string>> }>>(`/emergency?region_id=${encodeURIComponent(runtime.context!.region.id)}`),
        stage2Fetch<Stage2EmergencyServicesResponse>(`/emergency-services?region_id=${encodeURIComponent(runtime.context!.region.id)}`),
        stage2Fetch<Stage2PageContentResponse>(`/page-content/emergency?region_id=${encodeURIComponent(runtime.context!.region.id)}`),
      ]).then(([contacts, servicePayload, contentPayload]) => {
        if (cancelled) return;
        setRemoteContacts(contacts);
        setServices(servicePayload.services);
        setVerifiedAt(servicePayload.verified_at || null);
        const raw = contentPayload.content || {};
        setPageContent(Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")])));
      }).catch(() => {
        if (!cancelled) { setRemoteContacts([]); setServices([]); }
      });
    };
    const onVisibility = () => { if (document.visibilityState === "visible") loadEmergency(); };
    loadEmergency();
    window.addEventListener("focus", loadEmergency);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { cancelled = true; window.removeEventListener("focus", loadEmergency); document.removeEventListener("visibilitychange", onVisibility); };
  }, [runtime.context]);

  // Public rows come from PostgreSQL for this city or from global contacts.
  // Never show an unrelated city's rescue number from a demo fallback.
  const contactRows = remoteContacts.map((contact) => ({
    icon: contact.type === "ambulance" ? Ambulance : contact.type === "police" ? ShieldCheck : contact.type === "rescue" ? MountainSnow : Cross,
    title: touristInterfaceText(runtime.language,localizedField(runtime.language,contact,"title")), note: touristInterfaceText(runtime.language,localizedField(runtime.language,contact,"note")), phone: contact.phone || "", tone: contact.tone,
  }));

  const verifiedDateLabel = (() => {
    if (!verifiedAt) return "—";
    const date = new Date(verifiedAt);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString(runtime.language==="en"?"en-GB":runtime.language==="pl"?"pl-PL":"uk-UA") : "—";
  })();

  const shareLocation = async () => {
    const point = await runtime.requestLocation();
    if (!point) return;
    const text = `${tr(runtime.language,"Моя геолокація","My location","Moja lokalizacja")}: https://maps.google.com/?q=${point.lat},${point.lng}`;
    if (navigator.share) await navigator.share({ title: tr(runtime.language,"Моя геолокація","My location","Moja lokalizacja"), text });
    else await navigator.clipboard?.writeText(text);
  };

  const emergencyPhoneHref=(phone?:string|null)=>{
    const clean=String(phone||'').replace(/[^+\d]/g,'');
    return /^\+?\d{2,15}$/.test(clean)?`tel:${clean}`:null;
  };
  const handleServiceScroll = () => {
    const element = serviceScrollerRef.current;
    if (!element) return;
    const maxScroll = element.scrollWidth - element.clientWidth;
    if (maxScroll <= 1) {
      setServicePage(0);
      return;
    }
    setServicePage(Math.max(0, Math.min(2, Math.round((element.scrollLeft / maxScroll) * 2))));
  };

  return (
    <div className="tourist-screen gt-screen gt-emergency">
      <div className="gt-emergency-mountains" aria-hidden="true" />
      <main className="gt-content">
        <header className="gt-emergency-head">
          <span className="gt-emergency-sos">{localizedPageField(runtime.language,pageContent,"badge",{uk:"SOS",en:"SOS",pl:"SOS"})}</span>
          <div>
            <h1>{localizedPageField(runtime.language,pageContent,"title",{uk:"Халепа?",en:"Need help?",pl:"Potrzebujesz pomocy?"})}</h1>
            <p>{localizedPageField(runtime.language,pageContent,"subtitle",{uk:"Швидка допомога та корисні контакти",en:"Emergency help and useful contacts",pl:"Pomoc w nagłych wypadkach i przydatne kontakty"})}</p>
          </div>
        </header>
        <section className="gt-help-hero">
          <span className="gt-help-hero__icon"><LifeBuoy size={39} /></span>
          <div><small>{localizedPageField(runtime.language,pageContent,"hero_kicker",{uk:"Не хвилюйтеся",en:"Help is nearby",pl:"Pomoc jest blisko"})}</small><h2>{localizedPageField(runtime.language,pageContent,"hero_title",{uk:"Знайдемо допомогу",en:"We’ll find help",pl:"Znajdziemy pomoc"})}</h2><p>{localizedPageField(runtime.language,pageContent,"hero_text",{uk:"Екстрені та перевірені контакти для вашої безпеки.",en:"Emergency and verified contacts for your safety.",pl:"Sprawdzone kontakty alarmowe dla Twojego bezpieczeństwa."})}</p></div>
        </section>
        <button type="button" className="gt-location-button" onClick={() => void shareLocation()}>
          <span className="gt-location-button__icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img">
              <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M24 1.5v7M24 39.5v7M1.5 24h7M39.5 24h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <g transform="translate(0 -2.2)">
                <path d="M24 14.2c-5.45 0-9.86 4.42-9.86 9.86 0 7.55 9.86 16.08 9.86 16.08s9.86-8.53 9.86-16.08c0-5.44-4.41-9.86-9.86-9.86Z" fill="currentColor" />
                <circle cx="24" cy="24" r="3.5" fill="#ffffff" />
              </g>
            </svg>
          </span>
          <span><strong>{tr(runtime.language, "Поділитися геолокацією", "Share location", "Udostępnij lokalizację")}</strong><small>{tr(runtime.language, "Надішлемо ваші координати вибраній службі.", "Share your coordinates with the selected service.", "Udostępnij współrzędne wybranej służbie.")}</small></span>
          <ChevronRight size={20} />
        </button>
        <SectionTitle title={tr(runtime.language, "Екстрені контакти", "Emergency contacts", "Kontakty alarmowe")} />
        <div className="gt-contact-list">
          {contactRows.map(({ icon: Icon, title, note, phone, tone }) => (
            <a
              className={phone.startsWith("+") ? "is-long-number" : undefined}
              href={emergencyPhoneHref(phone)||undefined}
              onClick={e=>{if(!emergencyPhoneHref(phone))e.preventDefault();}}
              key={title}
            >
              <span className={`gt-tone--${tone}`}><Icon size={21} /></span>
              <div><strong>{title}</strong><small>{note}</small></div>
              <b>{phone}</b><i><Phone size={17} /></i>
            </a>
          ))}
          {!contactRows.length ? <p className="gt-emergency-empty">{tr(runtime.language,"Контактів для цього міста поки немає","No contacts available for this city yet","Brak kontaktów dla tego miasta")}</p> : null}
        </div>
        <SectionTitle title={tr(runtime.language, "Корисні сервіси", "Useful services", "Przydatne usługi")} />
        <div className="gt-service-mini-grid" ref={serviceScrollerRef} onScroll={handleServiceScroll}>
          {services.filter((service) => service.active).map((service) => {
            const ServiceIcon = emergencyServiceIcons[service.icon] ?? CircleHelp;
            return (
              <a className={`is-${service.tone}`} key={service.id} href={emergencyPhoneHref(service.phone)||undefined} onClick={e=>{if(!emergencyPhoneHref(service.phone))e.preventDefault();}} aria-disabled={!emergencyPhoneHref(service.phone)} title={service.phone||touristInterfaceText(runtime.language,"Номер не вказано")}>
                <span className={`gt-tone--${service.tone}`}><ServiceIcon size={22} /></span>
                <strong>{touristInterfaceText(runtime.language,localizedField(runtime.language,service,"title"))}</strong>
                <small>{touristInterfaceText(runtime.language,localizedField(runtime.language,service,"note"))}</small>
              </a>
            );
          })}
          {!services.some(service=>service.active) ? <p className="gt-emergency-empty">{tr(runtime.language,"Корисні сервіси поки не додано","No useful services yet","Brak dodatkowych usług")}</p> : null}
        </div>
        <div className="gt-emergency-dots" aria-hidden="true">
          {[0, 1, 2].map((page) => <i className={servicePage === page ? "is-active" : undefined} key={page} />)}
        </div>
        <p className="gt-expiry"><span><Info size={16} /> {tr(runtime.language, "Контакти перевірено регіональним адміністратором", "Contacts verified by the regional administrator", "Kontakty zweryfikowane przez administratora regionalnego")}</span><b>{verifiedDateLabel}</b></p>
      </main>
    </div>
  );
}

async function touristLocationImageToDataUrl(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Оберіть JPG, PNG або WEBP");
  if (file.size > 12 * 1024 * 1024) throw new Error("Одне фото має бути менше 12 МБ");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Не вдалося прочитати фото"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не вдалося обробити фото"));
    img.src = source;
  });
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function AddLocationScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const localText=(uk:string)=>touristInterfaceText(runtime.language,uk);
  const label=(uk:string,en:string,pl:string)=>tr(runtime.language,uk,en,pl);
  const categories: Array<{ label: string; slug: string; icon: LucideIcon; tone: string }> = [
    { label: "Де поїсти", slug: "food", icon: Utensils, tone: "orange" },
    { label: "Де купити", slug: "shop", icon: ShoppingBag, tone: "blue" },
    { label: "Відпочинок", slug: "rest", icon: BedDouble, tone: "purple" },
    { label: "Розваги", slug: "entertainment", icon: Bike, tone: "violet" },
    { label: "Природа", slug: "nature", icon: MountainSnow, tone: "green" },
    { label: "Корисне", slug: "useful", icon: Info, tone: "yellow" },
  ];
  const initialCenter = useMemo(() => ({
    lat: Number(runtime.location?.lat ?? runtime.context?.place?.lat ?? runtime.context?.region.lat ?? 48.34535),
    lng: Number(runtime.location?.lng ?? runtime.context?.place?.lng ?? runtime.context?.region.lng ?? 24.57855),
  }), [runtime.location?.lat, runtime.location?.lng, runtime.context?.place?.lat, runtime.context?.place?.lng, runtime.context?.region.lat, runtime.context?.region.lng]);

  const [category, setCategory] = useState(categories[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [regionName, setRegionName] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [mapDraft, setMapDraft] = useState(initialCenter);
  const [mapOpen, setMapOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedPoint) setMapDraft(initialCenter);
  }, [initialCenter.lat, initialCenter.lng]);

  const resolvePoint = async (point: { lat: number; lng: number }, closeMap = false) => {
    setSelectedPoint(point);
    setMapDraft(point);
    setError("");
    try {
      const details = await stage2Fetch<Stage2GeoDetails>(`/geo/reverse?lat=${encodeURIComponent(String(point.lat))}&lng=${encodeURIComponent(String(point.lng))}`);
      setAddress(details.formatted_address || `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`);
      setCity(details.city || "");
      setRegionName(details.region || "");
    } catch (reason) {
      setAddress(`${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`);
      setError(`${label("Точку обрано, але адресу не вдалося визначити автоматично", "Point selected, but the address could not be found automatically", "Wybrano punkt, ale nie udało się automatycznie ustalić adresu")}: ${runtime.language === "uk" && reason instanceof Error ? reason.message : label("помилка геокодування", "geocoding error", "błąd geokodowania")}`);
    }
    if (closeMap) setMapOpen(false);
  };

  const useMyLocation = async () => {
    setLocating(true);
    setError("");
    try {
      const point = await runtime.requestLocation();
      if (!point) {
        setError(label("Не вдалося отримати геолокацію. Дозвольте доступ до місцезнаходження в Telegram/браузері та повторіть.", "Location is unavailable. Allow location access in Telegram or your browser and try again.", "Nie można ustalić lokalizacji. Zezwól na dostęp do lokalizacji w Telegramie lub przeglądarce i spróbuj ponownie."));
        return;
      }
      await resolvePoint({ lat: point.lat, lng: point.lng });
    } finally {
      setLocating(false);
    }
  };

  const choosePhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    try {
      const remaining = Math.max(0, 6 - photos.length);
      const selected = Array.from(files).slice(0, remaining);
      const encoded = await Promise.all(selected.map(touristLocationImageToDataUrl));
      setPhotos((current) => [...current, ...encoded].slice(0, 6));
    } catch (reason) {
      setError(runtime.language === "uk" && reason instanceof Error ? reason.message : label("Не вдалося додати фото", "Could not add photos", "Nie udało się dodać zdjęć"));
    } finally {
      if (photoInput.current) photoInput.current.value = "";
    }
  };

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!runtime.user) return setError(label("Щоб додати локацію, відкрийте Mini App через Telegram та авторизуйтеся.", "Sign in to add a place.", "Zaloguj się, aby dodać miejsce."));
    if (!name.trim()) return setError(label("Вкажіть назву локації.", "Enter a place name.", "Wpisz nazwę miejsca."));
    if (!selectedPoint) return setError(label("Оберіть точку на мапі або натисніть «Моє місце».", "Select a point on the map or tap My location.", "Wybierz punkt na mapie lub kliknij Moja lokalizacja."));
    setSaving(true);
    try {
      await stage2Fetch<{ ok: true; id: string; status: string }>("/me/place-submissions", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          category_slug: category.slug,
          subcategory: category.label,
          description: description.trim(),
          address: address.trim(),
          city,
          region_name: regionName,
          region_id: runtime.context?.region.id,
          lat: selectedPoint.lat,
          lng: selectedPoint.lng,
          phone: phone.trim(),
          website: website.trim(),
          image_url: photos[0] || null,
          gallery: photos,
        }),
      });
      setSuccess(localText("Локацію надіслано на модерацію. Після перевірки вона зʼявиться у гіді."));
      setName(""); setDescription(""); setPhone(""); setWebsite(""); setPhotos([]);
      setSelectedPoint(null); setAddress(""); setCity(""); setRegionName("");
    } catch (reason) {
      setError(runtime.language === "uk" && reason instanceof Error ? reason.message : localText("Не вдалося надіслати локацію"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tourist-screen gt-screen gt-add-location-screen">
      <main className="gt-content gt-add-location-content">
        <header className="gt-add-location-hero">
          <span className="gt-add-location-hero__icon"><MapPin size={28} /></span>
          <div>
            <small><TouristText uk="Нова локація"/></small>
            <h1><TouristText uk="Додати місце"/></h1>
            <p><TouristText uk="Поділіться корисним місцем — після перевірки воно зʼявиться у «Гід турист»."/></p>
          </div>
          <em><ShieldCheck size={15} /> <TouristText uk="Модерація"/></em>
        </header>

        {error ? <div className="gt-add-location-feedback is-error"><CircleHelp size={18} /><span>{error}</span></div> : null}
        {success ? <div className="gt-add-location-feedback is-success"><Check size={18} /><span>{success}</span></div> : null}

        <section className="gt-add-location-section">
          <div className="gt-add-location-section__head">
            <span>1</span>
            <div><strong><TouristText uk="Основна інформація"/></strong><small><TouristText uk="Назва та категорія місця"/></small></div>
          </div>

          <label className="gt-add-location-field">
            <span><TouristText uk="Назва локації"/> <b>*</b></span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder={localText("Наприклад, оглядовий майданчик Ягідна")} />
          </label>

          <div className="gt-add-location-field">
            <span><TouristText uk="Категорія"/> <b>*</b></span>
            <div className="gt-add-location-categories">
              {categories.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.slug}
                    className={`${category.slug === item.slug ? "is-active" : ""} is-${item.tone}`}
                    onClick={() => setCategory(item)}
                  >
                    <i><Icon size={19} /></i>
                    <strong>{label(item.label, ({"Де поїсти":"Food & drinks","Де купити":"Shopping","Відпочинок":"Relaxation","Розваги":"Entertainment","Природа":"Nature","Корисне":"Essentials"} as Record<string,string>)[item.label] || item.label, ({"Де поїсти":"Jedzenie","Де купити":"Zakupy","Відпочинок":"Wypoczynek","Розваги":"Rozrywka","Природа":"Przyroda","Корисне":"Przydatne"} as Record<string,string>)[item.label] || item.label)}</strong>
                    {category.slug === item.slug ? <Check size={16} /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="gt-add-location-section">
          <div className="gt-add-location-section__head">
            <span>2</span>
            <div><strong><TouristText uk="Де знаходиться"/></strong><small><TouristText uk="Вкажіть точку та адресу"/></small></div>
          </div>

          <div className={`gt-add-location-map-card ${selectedPoint ? "has-point" : ""}`}>
            <div className="gt-add-location-map-card__map" aria-hidden="true">
              <i className="gt-add-location-map-card__river" />
              <i className="gt-add-location-map-card__road" />
              <span><MapPin size={22} /></span>
            </div>
            <div className="gt-add-location-map-card__copy">
              <strong>{selectedPoint ? label("Точку обрано", "Location selected", "Wybrano lokalizację") : label("Позначте місце на мапі", "Mark the place on the map", "Zaznacz miejsce na mapie")}</strong>
              <small>{selectedPoint ? `${selectedPoint.lat.toFixed(5)}, ${selectedPoint.lng.toFixed(5)}` : label("Оберіть свою геолокацію або поставте точку на чистій мапі.", "Use your current location or drop a pin on the map.", "Użyj swojej lokalizacji lub zaznacz punkt na mapie.")}</small>
              <div>
                <button type="button" disabled={locating} onClick={() => void useMyLocation()}><LocateFixed size={17} /> {locating ? label("Визначаємо…", "Locating…", "Ustalanie lokalizacji…") : label("Моє місце", "My location", "Moja lokalizacja")}</button>
                <button type="button" onClick={() => { setMapDraft(selectedPoint || initialCenter); setMapOpen(true); }}><Map size={17} /> <TouristText uk="Обрати на мапі"/></button>
              </div>
            </div>
          </div>

          <label className="gt-add-location-field gt-add-location-field--icon">
            <MapPin size={18} />
            <span><TouristText uk="Адреса"/></span>
            <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} placeholder={localText("вул., номер, населений пункт")} />
          </label>
        </section>

        <section className="gt-add-location-section">
          <div className="gt-add-location-section__head">
            <span>3</span>
            <div><strong><TouristText uk="Фото та опис"/></strong><small><TouristText uk="Допоможіть туристам зрозуміти, що тут цікавого"/></small></div>
          </div>

          <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => void choosePhotos(event.target.files)} />
          <button type="button" className="gt-add-location-upload" onClick={() => photoInput.current?.click()}>
            <i><Plus size={24} /></i>
            <span><strong>{photos.length ? `${label("Додано фото", "Photos added", "Dodane zdjęcia")}: ${photos.length}/6` : label("Додати фотографії", "Add photos", "Dodaj zdjęcia")}</strong><small><TouristText uk="До 6 фото · JPG, PNG або WEBP"/></small></span>
            <ChevronRight size={19} />
          </button>
          {photos.length ? <div className="gt-add-location-photo-grid">{photos.map((src, index) => <figure key={`${src.slice(0, 32)}-${index}`}><img src={src} alt={`${label("Фото локації", "Place photo", "Zdjęcie miejsca")} ${index + 1}`} /><button type="button" aria-label={localText("Видалити фото")} onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={14} /></button></figure>)}</div> : null}

          <label className="gt-add-location-field">
            <span><TouristText uk="Короткий опис"/></span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder={localText("Що варто знати про це місце, чим воно цікаве, коли краще відвідати...")} />
            <small className="gt-add-location-counter">{description.length}/500</small>
          </label>
        </section>

        <section className="gt-add-location-section gt-add-location-section--optional">
          <div className="gt-add-location-section__head">
            <span><Plus size={16} /></span>
            <div><strong><TouristText uk="Контакти"/> <em><TouristText uk="необовʼязково"/></em></strong><small><TouristText uk="Якщо місце має контакти або сайт"/></small></div>
          </div>
          <div className="gt-add-location-contact-grid">
            <label><Phone size={18} /><input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" placeholder={localText("Телефон")} /></label>
            <label><Globe size={18} /><input value={website} onChange={(event) => setWebsite(event.target.value)} type="url" placeholder={localText("Сайт або соцмережа")} /></label>
          </div>
        </section>

        <div className="gt-add-location-note">
          <Info size={18} />
          <p><strong><TouristText uk="Перед публікацією ми перевіримо локацію."/></strong><span><TouristText uk="Це допомагає уникати дублів та некоректних місць."/></span></p>
        </div>

        <button type="button" disabled={saving} className="gt-primary-button gt-add-location-submit" onClick={() => void submit()}>
          <Send size={19} /> {saving ? label("Надсилаємо…", "Submitting…", "Wysyłanie…") : label("Надіслати на модерацію", "Submit for review", "Wyślij do moderacji")}
        </button>
        <button type="button" className="gt-outline-button" onClick={() => navigate("tourist", "profile")}><ArrowLeft size={18} /> <TouristText uk="Назад до профілю"/></button>
      </main>

      {mapOpen ? <div className="gt-add-location-map-modal" role="dialog" aria-modal="true" aria-label={localText("Вибір точки на мапі")}>
        <div className="gt-add-location-map-modal__sheet">
          <header><div><strong><TouristText uk="Оберіть точку"/></strong><small><TouristText uk="На цій мапі немає закладів поруч — лише карта і ваша обрана точка."/></small></div><button type="button" onClick={() => setMapOpen(false)}><X size={22} /></button></header>
          <RealMap center={mapDraft} places={[]} radius={0} pickable preferLeaflet showCenterMarker={false} showRadius={false} onPick={setMapDraft} />
          <footer><span><MapPin size={16} /> {mapDraft.lat.toFixed(6)}, {mapDraft.lng.toFixed(6)}</span><div><button type="button" onClick={() => setMapOpen(false)}><TouristText uk="Скасувати"/></button><button type="button" onClick={() => void resolvePoint(mapDraft, true)}><TouristText uk="Обрати цю точку"/></button></div></footer>
        </div>
      </div> : null}
    </div>
  );
}

function ProfileScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const name = [runtime.user?.first_name, runtime.user?.last_name].filter(Boolean).join(" ") || tr(runtime.language,"Користувач Telegram","Telegram user","Użytkownik Telegrama");
  const username = runtime.user?.telegram_username ? `@${runtime.user.telegram_username}` : (runtime.context?.region.name || "Гід туриста");
  const languageLabel = runtime.language === "en" ? "English" : runtime.language === "pl" ? "Polski" : "Українська";
  const [editing, setEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!runtime.user || editing) return;
    setEditFirstName(runtime.user.first_name ?? "");
    setEditLastName(runtime.user.last_name ?? "");
    setEditPhone(runtime.user.phone ?? "");
    setEditPhoto(runtime.user.photo_url ?? "");
  }, [runtime.user?.id, runtime.user?.first_name, runtime.user?.last_name, runtime.user?.phone, runtime.user?.photo_url, editing]);

  const selectPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5_000_000) {
      setError(tr(runtime.language, "Оберіть JPG, PNG або WebP до 5 МБ", "Choose JPG, PNG or WebP under 5 MB", "Wybierz JPG, PNG lub WebP do 5 MB"));
      return;
    }
    try {
      const uri = URL.createObjectURL(file);
      try {
        const img = new window.Image();
        img.src = uri;
        await img.decode();
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        const photo = canvas.toDataURL("image/jpeg", .82);
        if (photo.length > 600_000) throw new Error("Photo too large");
        setEditPhoto(photo);
      } finally { URL.revokeObjectURL(uri); }
    } catch {
      setError(tr(runtime.language,"Не вдалося обробити фото", "Could not process the photo", "Nie udało się przetworzyć zdjęcia"));
    }
  };

  const saveChanges = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (runtime.user?.phone_login_enabled && editPhone !== (runtime.user.phone ?? "") && !editPassword) {
        throw new Error(tr(runtime.language,"Щоб змінити номер для входу, введіть новий пароль", "Enter a new password to change your sign-in number", "Podaj nowe hasło, aby zmienić numer logowania"));
      }
      if (editPassword) await runtime.setPhonePassword(editPhone, editPassword);
      await runtime.saveProfile({ first_name: editFirstName, last_name: editLastName, phone: editPhone, photo_url: editPhoto });
      setEditing(false);
      setEditPassword("");
      setNotice(tr(runtime.language,"Профіль збережено", "Profile saved", "Profil zapisany"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tr(runtime.language,"Помилка збереження", "Save failed", "Nie udało się zapisać"));
    } finally { setSaving(false); }
  };

  useEffect(() => {
    if (runtime.location?.source !== "gps") void runtime.requestLocation();
  }, []);

  return (
    <div className="tourist-screen gt-screen gt-profile-screen">
      <main className="gt-content gt-profile-content">
        <h1 className="gt-simple-title">{tr(runtime.language, "Профіль", "Profile", "Profil")}</h1>
        <section className="gt-profile-card gt-profile-card--reference">
          <div className={`gt-avatar gt-avatar--photo ${runtime.user?.photo_url ? "has-photo" : ""}`} role="img" aria-label={name}>{runtime.user?.photo_url ? <img src={runtime.user.photo_url} alt={name} /> : <UserRound size={40} />}</div>
          <div><strong>{name}</strong><small><MapPin size={17} /> {username}</small></div>
        </section>
        {editing ? <form className="gt-profile-edit-form" onSubmit={(event) => void saveChanges(event)}>
          <h2>{tr(runtime.language,"Редагування профілю", "Edit profile", "Edycja profilu")}</h2>
          <div className="gt-profile-edit-form__photo">
            {editPhoto ? <img src={editPhoto} alt={tr(runtime.language,"Фото профілю", "Profile photo", "Zdjęcie profilowe")} /> : <span><UserRound size={32}/></span>}
            <div className="gt-profile-edit-form__photo-actions">
              <label>{tr(runtime.language,"Завантажити фото", "Upload photo", "Prześlij zdjęcie")}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void selectPhoto(e.target.files?.[0])} /></label>
              {editPhoto ? <button type="button" onClick={() => setEditPhoto("")}>{tr(runtime.language,"Прибрати фото", "Remove photo", "Usuń zdjęcie")}</button> : null}
            </div>
          </div>
          <label>{tr(runtime.language,"Ім’я", "First name", "Imię")}<input type="text" maxLength={60} required value={editFirstName} onChange={e => setEditFirstName(e.target.value)} /></label>
          <label>{tr(runtime.language,"Прізвище", "Last name", "Nazwisko")}<input type="text" maxLength={60} value={editLastName} onChange={e => setEditLastName(e.target.value)} /></label>
          <label>{tr(runtime.language,"Номер телефону", "Phone number", "Numer telefonu")}<input type="tel" inputMode="tel" autoComplete="tel" placeholder="+380XXXXXXXXX" value={editPhone} onChange={e => setEditPhone(e.target.value)} /></label>
          <label>{runtime.user?.phone_login_enabled ? tr(runtime.language,"Новий пароль для входу за телефоном (необов’язково)","New phone sign-in password (optional)","Nowe hasło do logowania telefonem (opcjonalnie)") : tr(runtime.language,"Створити пароль для входу за телефоном (необов’язково)","Set a phone sign-in password (optional)","Ustaw hasło do logowania telefonem (opcjonalnie)")}
            <input type="password" autoComplete="new-password" minLength={8} placeholder={tr(runtime.language,"Мінімум 8 символів", "At least 8 characters", "Co najmniej 8 znaków")} value={editPassword} onChange={e => setEditPassword(e.target.value)} />
          </label>
          <small className="gt-profile-edit-form__hint">{tr(runtime.language,"Пароль потрібний, якщо хочете входити за номером. Без нього доступний вхід через Telegram.","A password enables phone sign-in. Telegram sign-in works without it.","Hasło umożliwia logowanie telefonem. Logowanie Telegram działa bez hasła.")}</small>
          {error ? <p className="gt-profile-edit-form__notice is-error" role="alert">{error}</p> : null}
          <div className="gt-profile-edit-form__actions"><button type="button" disabled={saving} onClick={() => { setEditing(false); setError(""); setEditPassword(""); }}>{tr(runtime.language,"Скасувати", "Cancel", "Anuluj")}</button><button type="submit" disabled={saving}>{saving ? tr(runtime.language,"Зберігаємо…", "Saving…", "Zapisywanie…") : tr(runtime.language,"Зберегти", "Save", "Zapisz")}</button></div>
        </form> : null}
        {notice && !editing ? <p className="gt-profile-edit-form__notice" role="status">{notice}</p> : null}
        <div className="gt-profile-list gt-profile-list--reference">
          <button type="button" className="gt-profile-row--location" onClick={() => navigate("tourist", "nearby")}><LocateFixed size={27} /><span>{tr(runtime.language,"Моє місцезнаходження", "My location", "Moja lokalizacja")}</span><ChevronRight size={20} /></button>
          <button type="button" className="gt-profile-row--add-location" onClick={() => navigate("tourist", "add-location")}><MapPin size={27} /><span>{tr(runtime.language, "Додати локацію", "Add place", "Dodaj miejsce")}</span><ChevronRight size={20} /></button>
          <button type="button" className="gt-profile-row--reviews" onClick={() => navigate("tourist", "review")}><MessageSquareMore size={27} /><span>{tr(runtime.language, "Мої відгуки", "My reviews", "Moje opinie")}</span><ChevronRight size={20} /></button>
          <button type="button" onClick={()=>navigate('tourist','my-bookings')}><CalendarDays size={27}/><span>{tr(runtime.language,"Мої бронювання","My bookings","Moje rezerwacje")}</span><ChevronRight size={20}/></button>
          <button type="button" className="gt-profile-row--saved-plans" onClick={()=>navigate('tourist','saved-plans')}><Route size={27}/><span>{tr(runtime.language,"Мої плани","My plans","Moje plany")}</span><ChevronRight size={20}/></button>
          <button type="button" className="gt-profile-row--favorites" onClick={() => navigate("tourist", "favorites")}><Heart size={27} /><span>{tr(runtime.language, "Улюблені", "Favorites", "Ulubione")}</span><ChevronRight size={20} /></button>
          <button type="button" onClick={() => navigate("tourist", "activity")}><Clock3 size={27} /><span>{tr(runtime.language, "Історія активності", "Activity history", "Historia aktywności")}</span><ChevronRight size={20} /></button>
          <button type="button" className="gt-profile-row--bonuses" onClick={() => navigate("tourist", "wallet")}><Gift size={27} /><span>{tr(runtime.language, "Бонуси", "Bonuses", "Bonusy")}</span><ChevronRight size={20} /></button>
        </div>
        <div className="gt-profile-list gt-profile-list--reference">
          <button type="button" className="gt-profile-row--language" onClick={() => navigate("tourist", "language")}><Globe size={27} /><span>{tr(runtime.language, "Мова", "Language", "Język")}</span><small>{languageLabel}</small><ChevronRight size={20} /></button>
          <button type="button" className="gt-profile-row--notifications" onClick={() => navigate("tourist", "notifications")}><Bell size={26} /><span>{tr(runtime.language, "Сповіщення", "Notifications", "Powiadomienia")}</span><ChevronRight size={20} /></button>
          <button type="button" className="gt-profile-row--support" onClick={() => navigate("tourist", "community")}><Headset size={27} /><span>{tr(runtime.language, "Підтримка / спільнота", "Support / community", "Wsparcie / społeczność")}</span><ChevronRight size={20} /></button>
        </div>
        <div className="gt-profile-list gt-profile-list--reference">
          <button type="button" onClick={() => { if(window.confirm(tr(runtime.language,"Видалити обліковий запис? Особисті дані будуть знеособлені, а фінансові записи збережено згідно зі строками обліку.","Delete your account? Personal data will be anonymized, while financial records will be retained as required.","Usunąć konto? Dane osobowe zostaną zanonimizowane, a zapisy finansowe przechowane zgodnie z przepisami."))) void runtime.deleteMyAccount().catch(e => window.alert(e instanceof Error ? e.message : tr(runtime.language,"Не вдалося видалити профіль","Account deletion failed","Nie udało się usunąć konta"))); }}><LogOut size={25}/><span>{tr(runtime.language,"Видалити мій обліковий запис","Delete my account","Usuń moje konto")}</span><ChevronRight size={20}/></button>
        </div>
        {!runtime.user ? <div className="gt-notice"><Info size={20} /><p>{tr(runtime.language, "Профіль автоматично активується після відкриття Mini App у Telegram.", "Your profile is activated automatically when the Mini App opens in Telegram.", "Profil aktywuje się automatycznie po otwarciu Mini App w Telegramie.")}</p></div> : null}
        <button type="button" className="gt-logout gt-profile-logout" onClick={() => void runtime.signOut().catch(() => undefined)}><LogOut size={25} /> {tr(runtime.language, "Вийти", "Log out", "Wyloguj")}</button>
        <button type="button" className="gt-outline-button gt-profile-edit" onClick={() => { setEditing(value => !value); setNotice(""); setError(""); }}><Pencil size={20} /> {tr(runtime.language, "Редагувати профіль", "Edit profile", "Edytuj profil")}</button>
      </main>
    </div>
  );
}

function FavoritesScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const [places, setPlaces] = useState<Stage2Place[]>([]);
  useEffect(() => {
    let cancelled = false;
    void stage2Fetch<Stage2Place[]>("/me/favorites").then((items) => { if (!cancelled) setPlaces(adminCreatedPlacesOnly(items)); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="tourist-screen gt-screen gt-reference-list-screen">
      <main className="gt-content">
        <div className="gt-page-heading"><span className="gt-tone--red"><Heart size={23} /></span><div><h1>{tr(runtime.language, "Улюблені", "Favorites", "Ulubione")}</h1><p>{tr(runtime.language, "Збережені місця", "Saved places", "Zapisane miejsca")}</p></div></div>
        <div className="gt-place-list">
          {places.map((place) => <PlaceRow key={place.id} photo={placePhotoFallback(place)} imageUrl={place.image_url} google={place.source === "google" || place.attributes?.google === true} googlePlaceId={googlePlaceId(place)} title={localizedField(runtime.language,place,"name")} subtitle={place.subcategory ? translateKnownLabel(runtime.language, place.subcategory) : (localizedField(runtime.language,place,"category_name") || tr(runtime.language, "Локація", "Place", "Miejsce"))} rating={placeRatingLabel(place)} distance="" walk="" tags={visiblePlaceTags(place)} onClick={() => { runtime.setSelectedPlace(place); navigate("tourist", "place"); }} />)}
          {!places.length ? <div className="gt-stage2-empty">{tr(runtime.language, "Ще немає збережених місць. Відкрийте картку закладу та натисніть «Зберегти».", "No saved places yet. Open a place and tap Save.", "Nie ma jeszcze zapisanych miejsc. Otwórz miejsce i wybierz Zapisz.")}</div> : null}
        </div>
      </main>
    </div>
  );
}

function ActivityScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const [events, setEvents] = useState<Array<{ id: string; event_type: string; place_name?: string | null; category_name?: string | null; created_at: string; payload?: Record<string, unknown> }>>([]);
  useEffect(() => {
    let cancelled = false;
    void stage2Fetch<typeof events>("/me/activity").then((items) => { if (!cancelled) setEvents(items); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const label = (event: string) => ({
    app_opened: tr(runtime.language, "Відкрито Mini App", "Mini App opened", "Otwarto Mini App"), qr_scanned: tr(runtime.language, "Відкрито QR-контекст", "QR context opened", "Otwarto kontekst QR"), category_opened: tr(runtime.language, "Відкрито категорію", "Category opened", "Otwarto kategorię"),
    search_used: tr(runtime.language, "Використано пошук", "Search used", "Użyto wyszukiwania"), place_viewed: tr(runtime.language, "Переглянуто місце", "Place viewed", "Wyświetlono miejsce"), route_clicked: tr(runtime.language, "Побудовано маршрут", "Route opened", "Otwarto trasę"), call_clicked: tr(runtime.language, "Натиснуто дзвінок", "Call tapped", "Wybrano połączenie"),
  } as Record<string,string>)[event] || event.replaceAll("_", " ");
  return (
    <div className="tourist-screen gt-screen">
      <main className="gt-content">
        <div className="gt-page-heading"><span className="gt-tone--green"><Clock3 size={23} /></span><div><h1>{tr(runtime.language, "Історія активності", "Activity history", "Historia aktywności")}</h1><p>{tr(runtime.language, "Ваші базові дії в гіді", "Your recent guide activity", "Twoja ostatnia aktywność w przewodniku")}</p></div></div>
        <div className="gt-stage2-activity-list">
          {events.map((event) => <article key={event.id}><span><Clock3 size={18} /></span><div><strong>{label(event.event_type)}</strong><small>{event.place_name || event.category_name || "Gid Tourist"}</small></div><time>{new Date(event.created_at).toLocaleDateString(runtime.language === "en" ? "en-GB" : runtime.language === "pl" ? "pl-PL" : "uk-UA", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}</time></article>)}
          {!events.length ? <div className="gt-stage2-empty">{tr(runtime.language, "Історія зʼявиться після використання пошуку, категорій і карток місць.", "History will appear after you use search, categories and place cards.", "Historia pojawi się po użyciu wyszukiwania, kategorii i kart miejsc.")}</div> : null}
        </div>
        <button type="button" className="gt-outline-button" onClick={() => navigate("tourist", "profile")}><ArrowLeft size={18} /> {tr(runtime.language, "Назад до профілю", "Back to profile", "Wróć do profilu")}</button>
      </main>
    </div>
  );
}

function NotificationsScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  type NotificationEvent = { id: string; event_type: string; created_at: string; place_name?: string | null; payload?: Record<string, unknown> };
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try {
      const rows = await stage2Fetch<NotificationEvent[]>("/me/activity");
      const relevant = new Set(["place_submission_created", "booking_created", "booking_confirmed", "booking_cancelled", "transaction_confirmed", "transaction_reversed", "bonus_earned", "bonus_spent", "review_submitted", "review_moderated"]);
      setEvents(rows.filter((row) => relevant.has(row.event_type)));
    } catch (reason) { setError(reason instanceof Error ? reason.message : tr(runtime.language, "Не вдалося завантажити повідомлення", "Could not load notifications", "Nie udało się wczytać powiadomień")); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [runtime.user?.id]);
  const labels: Record<string, [string, string, string]> = {
    place_submission_created: ["Локацію надіслано на модерацію", "Place submitted for review", "Miejsce wysłano do moderacji"],
    booking_created: ["Бронювання створено", "Booking created", "Utworzono rezerwację"],
    booking_confirmed: ["Бронювання підтверджено", "Booking confirmed", "Rezerwacja potwierdzona"],
    booking_cancelled: ["Бронювання скасовано", "Booking cancelled", "Rezerwacja anulowana"],
    transaction_confirmed: ["Операцію підтверджено", "Transaction confirmed", "Transakcja potwierdzona"],
    transaction_reversed: ["Операцію скасовано", "Transaction reversed", "Transakcja cofnięta"],
    bonus_earned: ["Бонуси нараховано", "Bonuses earned", "Naliczono bonusy"],
    bonus_spent: ["Бонуси використано", "Bonuses redeemed", "Wykorzystano bonusy"],
    review_submitted: ["Відгук надіслано", "Review submitted", "Opinia wysłana"],
    review_moderated: ["Відгук перевірено", "Review reviewed", "Opinia sprawdzona"],
  };
  return <div className="tourist-screen gt-screen"><main className="gt-content">
    <div className="gt-page-heading"><span className="gt-tone--green"><Bell size={23}/></span><div><h1>{tr(runtime.language,"Сповіщення","Notifications","Powiadomienia")}</h1><p>{tr(runtime.language,"Останні події вашого облікового запису","Recent account events","Ostatnie zdarzenia na koncie")}</p></div></div>
    <button type="button" className="gt-outline-button" onClick={() => void load()} disabled={loading}><RefreshCcw size={17}/>{tr(runtime.language,"Оновити","Refresh","Odśwież")}</button>
    {error ? <div className="gt-add-location-feedback is-error" role="alert">{error}</div> : null}
    <div className="gt-stage2-activity-list" aria-live="polite">
      {events.map((event) => { const words=labels[event.event_type]; return <article key={event.id}><span><Bell size={18}/></span><div><strong>{words ? tr(runtime.language,...words) : event.event_type}</strong><small>{event.place_name || "Gid Tourist"}</small></div><time>{new Date(event.created_at).toLocaleString(runtime.language === "en" ? "en-GB" : runtime.language === "pl" ? "pl-PL" : "uk-UA", {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</time></article>; })}
      {!loading && !events.length && !error ? <div className="gt-stage2-empty">{tr(runtime.language,"Поки немає сповіщень про бронювання, покупки чи модерацію.","No booking, purchase or moderation notifications yet.","Brak jeszcze powiadomień o rezerwacjach, zakupach lub moderacji.")}</div> : null}
    </div>
    <p className="gt-profile-edit-form__hint">{tr(runtime.language,"Тут показано події, які вже записані в системі. Надсилання push- та Telegram-повідомлень налаштовується окремо.","This screen shows recorded account events. Push and Telegram delivery are configured separately.","Tutaj widać zapisane zdarzenia konta. Powiadomienia push i Telegram konfiguruje się osobno.")}</p>
    <button type="button" className="gt-outline-button" onClick={() => navigate("tourist", "profile")}><ArrowLeft size={18}/>{tr(runtime.language,"Назад до профілю","Back to profile","Wróć do profilu")}</button>
  </main></div>;
}

function LanguageScreen({ navigate }: { navigate: Navigate }) {
  const runtime = useTouristRuntime();
  const languages = [
    { code: "uk" as const, title: "Українська", note: "Основна мова" },
    { code: "en" as const, title: "English", note: "Basic interface translation" },
    { code: "pl" as const, title: "Polski", note: "Podstawowe tłumaczenie interfejsu" },
  ];
  return (
    <div className="tourist-screen gt-screen">
      <main className="gt-content">
        <div className="gt-page-heading"><span className="gt-tone--blue"><Globe size={23} /></span><div><h1>{tr(runtime.language, "Мова", "Language", "Język")}</h1><p>{tr(runtime.language, "Оберіть мову Mini App", "Choose Mini App language", "Wybierz język Mini App")}</p></div></div>
        <div className="gt-profile-list gt-stage2-language-list">
          {languages.map((item) => <button type="button" key={item.code} className={runtime.language === item.code ? "is-selected" : ""} onClick={() => void runtime.setLanguage(item.code)}><Globe size={25} /><span><strong>{item.title}</strong><small>{item.note}</small></span>{runtime.language === item.code ? <Check size={21} /> : <ChevronRight size={20} />}</button>)}
        </div>
        <button type="button" className="gt-outline-button" onClick={() => navigate("tourist", "profile")}><ArrowLeft size={18} /> {tr(runtime.language, "Назад до профілю", "Back to profile", "Wróć do profilu")}</button>
      </main>
    </div>
  );
}

function CommunityScreen() {
  const { context, language, location } = useTouristRuntime();
  const [storedUrl,setStoredUrl] = useState<string|null>(null);
  const [loaded,setLoaded] = useState(false);
  const regionId=context?.region.id;
  const gpsLat=location?.source==='gps'?location.lat:null;
  const gpsLng=location?.source==='gps'?location.lng:null;
  useEffect(()=>{
    let alive=true;
    setLoaded(false);
    setStoredUrl(null);
    const fetchUrl=async()=>{
      let resolvedRegion=regionId;
      if(!resolvedRegion && gpsLat!==null && gpsLng!==null){
        const cities=await stage2Fetch<Array<{id:string}>>(`/planner/regions?lat=${encodeURIComponent(gpsLat)}&lng=${encodeURIComponent(gpsLng)}`);
        resolvedRegion=cities[0]?.id;
      }
      if(!resolvedRegion)return null;
      return stage2Fetch<{community_url:string|null}>(`/community?region_id=${encodeURIComponent(resolvedRegion)}`);
    };
    void fetchUrl().then(data=>{if(alive){setStoredUrl(data?.community_url||null);setLoaded(true);}})
      .catch(()=>{if(alive){setStoredUrl(null);setLoaded(true);}});
    return ()=>{alive=false;};
  },[regionId,gpsLat,gpsLng]);
  const rawUrl = loaded ? storedUrl : (context?.region.communityUrl || process.env.NEXT_PUBLIC_TELEGRAM_COMMUNITY_URL || '');
  const communityUrl=typeof rawUrl==='string'&&/^https:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/[^\s/]+/i.test(rawUrl) ? rawUrl : '';
  const openCommunity=()=>{
    if(!communityUrl)return;
    const telegram=(window as Window & {Telegram?:{WebApp?:{openTelegramLink?:(url:string)=>void}}}).Telegram?.WebApp;
    if(telegram?.openTelegramLink) telegram.openTelegramLink(communityUrl);
    else window.open(communityUrl,'_blank','noopener,noreferrer');
  };
  return (
    <div className="tourist-screen gt-screen">
      <main className="gt-content">
        <section className="gt-community-hero">
          <span><MessageCircle size={31} /></span>
          <small>{tr(language, "Telegram-спільнота регіону", "Regional Telegram community", "Regionalna społeczność Telegram")}</small>
          <h1>{tr(language, "Подорожуйте разом з місцевими", "Travel with locals", "Podróżuj z mieszkańcami")}</h1>
          <p>{tr(language, "Новини, маршрути, події та перевірені рекомендації регіону.", "News, routes, events and verified local recommendations.", "Aktualności, trasy, wydarzenia i sprawdzone lokalne rekomendacje.")}</p>
          <button type="button" className="gt-primary-button" disabled={!communityUrl} onClick={openCommunity}>{tr(language, "Відкрити спільноту", "Open community", "Otwórz społeczność")} <ExternalLink size={19} /></button>
        </section>
        <SectionTitle title={tr(language, "У спільноті ви знайдете", "In the community", "W społeczności znajdziesz")} />
        <div className="gt-community-list">
          <div><span className="gt-tone--green"><SunMedium size={22} /></span><div><strong>{tr(language, "Погода і стан маршрутів", "Weather and route conditions", "Pogoda i stan tras")}</strong><small>{tr(language, "Короткі локальні оновлення без спаму", "Short local updates without spam", "Krótkie lokalne aktualizacje bez spamu")}</small></div></div>
          <div><span className="gt-tone--purple"><TentTree size={22} /></span><div><strong>{tr(language, "Нові місця й добірки", "New places and picks", "Nowe miejsca i zestawienia")}</strong><small>{tr(language, "Перевірені редакцією рекомендації", "Editor-verified recommendations", "Rekomendacje sprawdzone przez redakcję")}</small></div></div>
          <div><span className="gt-tone--blue"><MessageCircle size={22} /></span><div><strong>{tr(language, "Допомога мандрівникам", "Traveler help", "Pomoc dla podróżnych")}</strong><small>{tr(language, "Поради від місцевих і служби підтримки", "Tips from locals and support", "Porady mieszkańców i wsparcia")}</small></div></div>
        </div>
        <div className="gt-notice"><ShieldCheck size={21} /><p>{tr(language, "Ви самі керуєте згодою на сервісні повідомлення у профілі.", "You control service-message consent in your profile.", "Zgodą na wiadomości serwisowe zarządzasz w profilu.")}</p></div>
      </main>
    </div>
  );
}

export function TouristScreen({
  slug,
  navigate,
}: {
  slug: string;
  navigate: Navigate;
}) {
  switch (slug) {
    case "welcome":
      return <HomeScreen navigate={navigate} />;
    case "home":
      return <HomeScreen navigate={navigate} />;
    case "about":
      return <AboutScreen navigate={navigate} />;
    case "about-reception":
      return <AboutInfoScreen navigate={navigate} kind="reception" />;
    case "about-wifi":
      return <AboutInfoScreen navigate={navigate} kind="wifi" />;
    case "about-rules":
      return <AboutInfoScreen navigate={navigate} kind="rules" />;
    case "about-contacts":
      return <AboutInfoScreen navigate={navigate} kind="contacts" />;
    case "hotel-services":
      return <HotelServicesScreen navigate={navigate} />;
    case "catalog":
      return <CatalogScreen navigate={navigate} />;
    case "shop":
      return <ShopScreen navigate={navigate} />;
    case "hot-offers":
      return <HotOffersScreen navigate={navigate} />;
    case "hot-offer-detail":
      return <HotOfferDetailScreen navigate={navigate} />;
    case "entertainment":
      return <EntertainmentScreen navigate={navigate} />;
    case "transfer":
      return <TransferScreen navigate={navigate} />;
    case "nearby":
      return <NearbyScreen navigate={navigate} />;
    case "place":
      return <PlaceScreen navigate={navigate} />;
    case "available":
      return <AvailableScreen navigate={navigate} />;
    case "booking":
      return <BookingScreen navigate={navigate} />;
    case "my-bookings":
      return <MyBookingsScreen navigate={navigate} />;
    case "plan":
      return <PlanScreen navigate={navigate} />;
    case "saved-plans":
      return <SavedPlansScreen navigate={navigate} />;
    case "wallet":
      return <WalletScreen />;
    case "qr":
      return <QrScreen navigate={navigate} />;
    case "purchase-confirmation":
      return <PurchaseConfirmationScreen navigate={navigate} />;
    case "review":
      return <ReviewScreen />;
    case "emergency":
      return <EmergencyScreen />;
    case "profile":
      return <ProfileScreen navigate={navigate} />;
    case "favorites":
      return <FavoritesScreen navigate={navigate} />;
    case "activity":
      return <ActivityScreen navigate={navigate} />;
    case "language":
      return <LanguageScreen navigate={navigate} />;
    case "notifications":
      return <NotificationsScreen navigate={navigate} />;
    case "add-location":
      return <AddLocationScreen navigate={navigate} />;
    case "community":
      return <CommunityScreen />;
    default:
      return <HomeScreen navigate={navigate} />;
  }
}
