"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bike,
  BedDouble,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleParking,
  ClipboardList,
  Clock3,
  CigaretteOff,
  Edit3,
  GripVertical,
  Eye,
  FlameKindling,
  Home,
  ImagePlus,
  Hotel,
  Image as ImageIcon,
  Info,
  Globe2,
  Mail,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Moon,
  MoreVertical,
  PawPrint,
  Phone,
  QrCode,
  RefreshCcw,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Users,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UtensilsCrossed,
  WalletCards,
  Wifi,
  Waves,
  X,
  Zap,
  LockKeyhole,
} from "lucide-react";
import type { RoleKey } from "../../lib/navigation";
import { ensureTelegramSession, setSessionToken, stage2Fetch, telegramAuthLastError, telegramLaunchDiagnostic, telegramLaunchKey, telegramStartParam, type Stage2Category, type Stage2GeoDetails, type Stage2GeoSuggestion, type Stage2Offer, type Stage2PlaceTypeTemplate, type Stage2User } from "../../lib/stage2-api";

type Navigate = (role: RoleKey, slug: string) => void;
type PartnerProps = { navigate: Navigate; activated: boolean };

type PartnerAccessDiagnostic = {
  ok: boolean;
  reason: string;
  start_param: string;
  session_user_id?: string | null;
  telegram_id?: string | null;
  telegram_username?: string | null;
  qr_found?: boolean;
  qr_id?: string | null;
  qr_active?: boolean | null;
  qr_type?: string | null;
  place_id?: string | null;
  place_name?: string | null;
  place_status?: string | null;
  organization_id?: string | null;
  allowed_telegram_ids?: string[];
  access_from_table?: boolean;
  access_from_place_details?: boolean;
  access_as_owner?: boolean;
};

type PartnerRuleIcon = "no-smoking" | "quiet" | "pets" | "clock" | "security" | "people" | "info" | "sparkles" | "energy" | "lock";
type PartnerRule = { id: string; text: string; icon: PartnerRuleIcon };

type PartnerProfile = {
  placeName: string;
  placeType: string;
  categorySlug: string;
  city: string;
  regionName: string;
  street: string;
  house: string;
  cityPlaceId: string;
  streetPlaceId: string;
  housePlaceId: string;
  address: string;
  lat: string;
  lng: string;
  imageUrl: string;
  logoUrl: string;
  description: string;
  roomCount: string;
  openedYear: string;
  languages: string;
  accommodationType: string;
  hasWifi: boolean;
  wifiSsid: string;
  wifiPassword: string;
  amenities: string[];
  generalRules: PartnerRule[];
  phone: string;
  messenger: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  workMode: string;
  workHours: string;
  checkIn: string;
  checkOut: string;
  quietHours: string;
  petPolicy: string;
  cancellation: string;
  payment: string;
  otherRules: string;
  cabinetModules: string[];
  templateFields: Record<string, string>;
};

const heroImage = "";
const PROFILE_STORAGE_KEY = "gid-tourist-partner-profile";
const ACTIVATED_STORAGE_KEY = "gid-tourist-partner-activated";

const SERVICES_STORAGE_KEY = "gid-tourist-partner-services";
const SERVICE_DRAFT_STORAGE_KEY = "gid-tourist-partner-service-draft";
const SERVICE_SELECTED_STORAGE_KEY = "gid-tourist-partner-selected-service";

type PartnerServiceAudience = "hotel" | "all";
type PartnerServicePriceType = "" | "free" | "fixed" | "from" | "range" | "request";
type PartnerServiceScheduleType = "daily" | "weekdays" | "custom";

type PartnerService = {
  id: string;
  name: string;
  category: string;
  description: string;
  audience: PartnerServiceAudience;
  active: boolean;
  hidden: boolean;
  priceType: PartnerServicePriceType;
  price: string;
  currency: string;
  scheduleType: PartnerServiceScheduleType;
  scheduleLabel: string;
  timeFrom: string;
  timeTo: string;
  phone: string;
  extraPhone: string;
  email: string;
  bookingNote: string;
  additionalInfo: string;
  amenities: string[];
  promo: boolean;
  image?: string;
  breaks?: Array<{ from: string; to: string }>;
};

const defaultServices: PartnerService[] = [];


const emptyServiceDraft: PartnerService = {
  id: "",
  name: "",
  category: "",
  description: "",
  audience: "hotel",
  active: true,
  hidden: false,
  priceType: "",
  price: "",
  currency: "UAH",
  scheduleType: "daily",
  scheduleLabel: "Щодня",
  timeFrom: "09:00",
  timeTo: "18:00",
  phone: "",
  extraPhone: "",
  email: "",
  bookingNote: "",
  additionalInfo: "",
  amenities: [],
  promo: false,
};

function readPartnerServices(): PartnerService[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SERVICES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PartnerService[]) : [];
  } catch {
    return [];
  }
}

function savePartnerServices(services: PartnerService[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
}

function readServiceDraft(): PartnerService {
  if (typeof window === "undefined") return emptyServiceDraft;
  try {
    const raw = window.localStorage.getItem(SERVICE_DRAFT_STORAGE_KEY);
    return raw ? { ...emptyServiceDraft, ...(JSON.parse(raw) as Partial<PartnerService>) } : emptyServiceDraft;
  } catch {
    return emptyServiceDraft;
  }
}

function saveServiceDraft(service: PartnerService) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SERVICE_DRAFT_STORAGE_KEY, JSON.stringify(service));
}


const defaultProfile: PartnerProfile = {
  placeName: "",
  placeType: "Готель",
  categorySlug: "hotel",
  city: "",
  regionName: "",
  street: "",
  house: "",
  cityPlaceId: "",
  streetPlaceId: "",
  housePlaceId: "",
  address: "",
  lat: "",
  lng: "",
  imageUrl: "",
  logoUrl: "",
  description: "",
  roomCount: "",
  openedYear: "",
  languages: "",
  accommodationType: "",
  hasWifi: false,
  wifiSsid: "",
  wifiPassword: "",
  amenities: [],
  generalRules: [],
  phone: "",
  messenger: "",
  email: "",
  website: "",
  instagram: "",
  facebook: "",
  workMode: "Щодня",
  workHours: "09:00 - 18:00",
  checkIn: "",
  checkOut: "",
  quietHours: "",
  petPolicy: "",
  cancellation: "",
  payment: "",
  otherRules: "",
  cabinetModules: [],
  templateFields: {},
};


function readPartnerProfile(): PartnerProfile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as Partial<PartnerProfile>;
    const isLegacyDemo = parsed.placeName === "Гірський Затишок" && String(parsed.address || "").includes("Незалежності");
    if (isLegacyDemo) {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      window.localStorage.removeItem(SERVICES_STORAGE_KEY);
      return defaultProfile;
    }
    const merged: PartnerProfile = { ...defaultProfile, ...parsed };
    merged.generalRules = Array.isArray(parsed.generalRules) ? parsed.generalRules : [];
    merged.amenities = Array.isArray(parsed.amenities) ? parsed.amenities : [];
    merged.cabinetModules = Array.isArray(parsed.cabinetModules) ? parsed.cabinetModules : [];
    merged.templateFields = parsed.templateFields && typeof parsed.templateFields === "object" ? parsed.templateFields : {};
    if (!merged.hasWifi) merged.amenities = merged.amenities.filter((item) => item !== "Wi‑Fi");
    return merged;
  } catch {
    return defaultProfile;
  }
}

function savePartnerProfile(profile: PartnerProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function readPartnerActivated() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ACTIVATED_STORAGE_KEY) === "true";
}

function savePartnerActivated(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVATED_STORAGE_KEY, String(value));
}

function usePartnerProfile() {
  const [profile, setProfile] = useState<PartnerProfile>(defaultProfile);

  useEffect(() => {
    setProfile(readPartnerProfile());
  }, []);

  useEffect(() => {
    savePartnerProfile(profile);
  }, [profile]);

  return { profile, setProfile };
}


const PARTNER_STAGE2_PLACE_KEY = "gid-tourist-stage2-partner-place-id";
const PARTNER_INVITE_KEY = "gid-tourist-stage2-partner-invite";
const PARTNER_ACCESS_SESSION_PREFIX = "gid-tourist-stage2-partner-access:";

type PartnerLaunchAccessCache = { telegram_id?: string; place_id?: string; status?: string; launch_key?: string };

function readPartnerLaunchAccessCache(): PartnerLaunchAccessCache | null {
  if (typeof window === "undefined") return null;
  const startParam = telegramStartParam();
  if (!startParam.startsWith("partner-")) return null;
  try {
    const raw = window.sessionStorage.getItem(`${PARTNER_ACCESS_SESSION_PREFIX}${startParam}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as PartnerLaunchAccessCache;
    const launchKey = telegramLaunchKey();
    if (!cached.place_id || !cached.launch_key) return null;
    if (launchKey && cached.launch_key !== launchKey) return null;
    return cached;
  } catch {
    return null;
  }
}

function categoryFromPlaceType(placeType: string) {
  const value = placeType.toLocaleLowerCase("uk");
  if (/ресторан|кафе|кав|їж|food|пі/.test(value)) return "food";
  if (/магаз|сувен|аптек|shop/.test(value)) return "shop";
  if (/чан|саун|басейн|spa|масаж|відпоч/.test(value)) return "rest";
  if (/розваг|квадро|рафт|зіп|джип|entertain/.test(value)) return "entertainment";
  if (/трансфер|таксі|оренда авто|transfer/.test(value)) return "transfer";
  return "hotel";
}

const FALLBACK_STAGE2_CATEGORIES: Stage2Category[] = [
  { slug: "hotel", name: "Готель / точка входу", subcategories: ["Готель", "Садиба"] },
  { slug: "food", name: "Де поїсти", subcategories: ["Ресторан", "Кафе", "Бар"] },
  { slug: "shop", name: "Де купити", subcategories: ["Магазин", "Сувенірна крамниця", "Аптека"] },
  { slug: "rest", name: "Де відпочити", subcategories: ["SPA / сауна", "Екскурсії"] },
  { slug: "entertainment", name: "Розваги", subcategories: ["Активний відпочинок"] },
  { slug: "transfer", name: "Трансфер", subcategories: ["Трансфер / таксі"] },
];

const FALLBACK_PLACE_TEMPLATES: Stage2PlaceTypeTemplate[] = [
  { id: "tpl-hotel", category_slug: "hotel", place_type: "Готель", label: "Готель", default_title: "Новий готель", default_description: "Комфортний готель для відпочинку гостей. Додайте короткий опис розташування, номерів та головних переваг.", default_services: ["Сніданок","Прибирання","Сауна","Басейн","Трансфер"], default_amenities: ["Номери","Паркінг","Wi‑Fi","Сніданок"], fields: { room_count: "Кількість номерів", opened_year: "Рік відкриття", languages: "Мови обслуговування", accommodation_type: "Тип розміщення" }, sort_order: 10 },
  { id: "tpl-guesthouse", category_slug: "hotel", place_type: "Садиба", label: "Садиба", default_title: "Нова садиба", default_description: "Затишна садиба для відпочинку. Опишіть умови проживання, територію та головні переваги.", default_services: ["Сніданок","Мангал","Чан","Трансфер"], default_amenities: ["Номери","Паркінг","Wi‑Fi","Мангал"], fields: { room_count: "Кількість кімнат", opened_year: "Рік відкриття", languages: "Мови обслуговування", accommodation_type: "Тип розміщення" }, sort_order: 20 },
  { id: "tpl-restaurant", category_slug: "food", place_type: "Ресторан", label: "Ресторан", default_title: "Новий ресторан", default_description: "Ресторан із власною кухнею та атмосферою. Опишіть кухню, формат закладу й особливі пропозиції.", default_services: ["Основне меню","Сніданки","Доставка","Їжа з собою","Дитяче меню"], default_amenities: ["Меню","Паркінг","Wi‑Fi","Дитяче меню"], fields: { capacity: "Кількість посадкових місць", average_check: "Середній чек", cuisine: "Кухня", languages: "Мови обслуговування" }, sort_order: 10 },
  { id: "tpl-cafe", category_slug: "food", place_type: "Кафе", label: "Кафе", default_title: "Нове кафе", default_description: "Кафе для сніданків, кави та зустрічей. Додайте інформацію про меню, формат і особливості.", default_services: ["Кава","Десерти","Сніданки","Їжа з собою"], default_amenities: ["Кава","Wi‑Fi","Їжа з собою","Десерти"], fields: { capacity: "Кількість посадкових місць", average_check: "Середній чек", cuisine: "Тип кухні", languages: "Мови обслуговування" }, sort_order: 20 },
  { id: "tpl-bar", category_slug: "food", place_type: "Бар", label: "Бар", default_title: "Новий бар", default_description: "Бар із напоями та закусками. Опишіть формат, атмосферу, кухню або події.", default_services: ["Напої","Закуски","Жива музика"], default_amenities: ["Напої","Wi‑Fi","Жива музика"], fields: { capacity: "Кількість місць", average_check: "Середній чек", format: "Формат закладу", languages: "Мови обслуговування" }, sort_order: 30 },
  { id: "tpl-shop", category_slug: "shop", place_type: "Магазин", label: "Магазин", default_title: "Новий магазин", default_description: "Магазин товарів для туристів і місцевих мешканців. Вкажіть основний асортимент та умови покупки.", default_services: ["Продаж у магазині","Самовивіз"], default_amenities: ["Оплата карткою","Паркінг","Самовивіз"], fields: { store_format: "Формат магазину", assortment: "Основний асортимент", delivery: "Доставка / самовивіз", payment_methods: "Способи оплати" }, sort_order: 10 },
  { id: "tpl-souvenir", category_slug: "shop", place_type: "Сувенірна крамниця", label: "Сувенірна крамниця", default_title: "Нова сувенірна крамниця", default_description: "Сувеніри, подарунки та локальні товари. Опишіть асортимент і особливі вироби.", default_services: ["Сувеніри","Подарунки","Локальні товари"], default_amenities: ["Подарунки","Локальні товари","Оплата карткою"], fields: { assortment: "Основний асортимент", local_goods: "Локальні товари", delivery: "Доставка / самовивіз", payment_methods: "Способи оплати" }, sort_order: 20 },
  { id: "tpl-pharmacy", category_slug: "shop", place_type: "Аптека", label: "Аптека", default_title: "Нова аптека", default_description: "Аптека та товари для здоровʼя. Додайте графік, формат роботи й доступні сервіси.", default_services: ["Ліки","Товари для здоровʼя"], default_amenities: ["Ліки","Оплата карткою","Самовивіз"], fields: { format: "Формат аптеки", delivery: "Доставка / самовивіз", payment_methods: "Способи оплати", languages: "Мови обслуговування" }, sort_order: 30 },
  { id: "tpl-spa", category_slug: "rest", place_type: "SPA / сауна", label: "SPA / сауна", default_title: "Новий SPA / сауна", default_description: "Місце для відпочинку й відновлення. Опишіть формати процедур, місткість і умови відвідування.", default_services: ["Сауна","Чан","Масаж","Басейн"], default_amenities: ["SPA","Паркінг","Рушники","Душ"], fields: { capacity: "Місткість", duration: "Тривалість сеансу", price_info: "Вартість", languages: "Мови обслуговування" }, sort_order: 10 },
  { id: "tpl-excursion", category_slug: "rest", place_type: "Екскурсії", label: "Екскурсії", default_title: "Нова екскурсія", default_description: "Екскурсійна послуга для туристів. Опишіть маршрут, тривалість, складність та формат групи.", default_services: ["Екскурсія","Гід","Трансфер"], default_amenities: ["Гід","Трансфер","Групи"], fields: { duration: "Тривалість", group_size: "Розмір групи", difficulty: "Складність", languages: "Мови проведення" }, sort_order: 20 },
  { id: "tpl-entertainment", category_slug: "entertainment", place_type: "Активний відпочинок", label: "Активний відпочинок", default_title: "Нова активність", default_description: "Активний відпочинок та враження. Опишіть формат, рівень складності, сезонність і вимоги до гостей.", default_services: ["Квадроцикли","Рафтинг","Зіплайн","Джип-тур"], default_amenities: ["Активності","Паркінг","Інструктор"], fields: { age_limit: "Вікові обмеження", duration: "Тривалість", difficulty: "Рівень складності", season: "Сезонність" }, sort_order: 10 },
  { id: "tpl-transfer", category_slug: "transfer", place_type: "Трансфер / таксі", label: "Трансфер / таксі", default_title: "Новий трансфер", default_description: "Трансфер або таксі для гостей регіону. Вкажіть тип транспорту, місткість і зону роботи.", default_services: ["Трансфер","Таксі","Оренда авто"], default_amenities: ["Трансфер","Багаж","Дитяче крісло"], fields: { vehicle_type: "Тип транспорту", capacity: "Місткість", service_area: "Зона роботи", languages: "Мови водія" }, sort_order: 10 },
];

function mergedTemplates(remote: Stage2PlaceTypeTemplate[]) {
  if (!remote.length) return FALLBACK_PLACE_TEMPLATES;
  const byKey = new Map(FALLBACK_PLACE_TEMPLATES.map((item) => [`${item.category_slug}:${item.place_type}`, item]));
  remote.forEach((item) => {
    const key = `${item.category_slug}:${item.place_type}`;
    const base = byKey.get(key);
    byKey.set(key, {
      ...base,
      ...item,
      default_title: item.default_title || base?.default_title || null,
      default_description: item.default_description || base?.default_description || null,
      default_services: item.default_services?.length ? item.default_services : (base?.default_services || []),
      default_amenities: item.default_amenities?.length ? item.default_amenities : (base?.default_amenities || []),
      fields: Object.keys(item.fields || {}).length ? item.fields : (base?.fields || {}),
    });
  });
  return Array.from(byKey.values()).sort((a, b) => (a.category_slug.localeCompare(b.category_slug) || Number(a.sort_order ?? 100) - Number(b.sort_order ?? 100)));
}

async function submitPartnerProfile(profile: PartnerProfile) {
  const session = await ensureTelegramSession();
  if (!session) throw new Error("Не вдалося авторизувати партнера через Telegram. Закрийте Mini App, відкрийте його знову через бота та повторіть збереження.");
  const existingId = typeof window !== "undefined" ? window.localStorage.getItem(PARTNER_STAGE2_PLACE_KEY) : null;
  const hours = profile.workHours.match(/(\d{2}:\d{2}).*?(\d{2}:\d{2})/);
  const payload = {
    city: profile.city,
    region_name: profile.regionName,
    category_slug: profile.categorySlug || categoryFromPlaceType(profile.placeType),
    subcategory: profile.placeType,
    name: profile.placeName,
    organization_name: profile.placeName,
    description: profile.description,
    address: profile.address,
    lat: Number(profile.lat),
    lng: Number(profile.lng),
    phone: profile.phone,
    telegram: profile.messenger.startsWith("http") ? profile.messenger : undefined,
    website: profile.website.startsWith("http") ? profile.website : profile.website ? `https://${profile.website}` : undefined,
    image_url: profile.imageUrl || null,
    work_hours: profile.workMode.toLocaleLowerCase("uk").includes("цілодоб") ? { always_open: true } : hours ? { daily: { from: hours[1], to: hours[2] } } : {},
    attributes: {
      partner: true,
      parking: profile.amenities.some((item) => /паркін|парков/i.test(item)),
      wifi: profile.hasWifi,
      amenities: profile.amenities.filter((item) => profile.hasWifi || item !== "Wi‑Fi"),
    },
    details: {
      check_in: profile.checkIn.match(/\d{2}:\d{2}/)?.[0] || "",
      check_out: profile.checkOut.match(/\d{2}:\d{2}/)?.[0] || "",
      wifi_ssid: profile.hasWifi ? profile.wifiSsid : "",
      wifi_password: profile.hasWifi ? profile.wifiPassword : "",
      rules: [...profile.generalRules.map((item) => item.text), profile.cancellation, profile.payment, profile.otherRules].filter(Boolean),
      payment_methods: paymentMethodsFromText(profile.payment),
      rule_items: profile.generalRules,
      room_count: profile.roomCount,
      opened_year: profile.openedYear,
      languages: profile.languages,
      accommodation_type: profile.accommodationType,
      email: profile.email,
      instagram: profile.instagram,
      facebook: profile.facebook,
      city: profile.city,
      region_name: profile.regionName,
      street: profile.street,
      house: profile.house,
      address_verified: Boolean(profile.cityPlaceId && profile.streetPlaceId && profile.housePlaceId),
      geo_place_ids: { city: profile.cityPlaceId, street: profile.streetPlaceId, house: profile.housePlaceId },
      services: readPartnerServices(),
      cabinet_modules: profile.cabinetModules,
      template_fields: profile.templateFields,
      logo_url: profile.logoUrl || null,
    },
  };

  if (existingId) {
    try {
      return await stage2Fetch<{ id: string; status?: string }>(`/partner/places/${encodeURIComponent(existingId)}`, { method: "PATCH", body: JSON.stringify(payload) });
    } catch (error) {
      if (typeof window !== "undefined" && window.localStorage.getItem(PARTNER_INVITE_KEY)) throw error;
      window.localStorage.removeItem(PARTNER_STAGE2_PLACE_KEY);
    }
  }
  const created = await stage2Fetch<{ id: string; status?: string }>("/partner/onboarding", { method: "POST", body: JSON.stringify(payload) });
  if (typeof window !== "undefined") window.localStorage.setItem(PARTNER_STAGE2_PLACE_KEY, created.id);
  return created;
}

function PartnerHeader({
  title,
  navigate,
  back,
  nextLabel,
  onNext,
  showMenu = false,
  backLabel,
}: {
  title: string;
  navigate: Navigate;
  back?: string;
  nextLabel?: string;
  onNext?: () => void;
  showMenu?: boolean;
  backLabel?: string;
}) {
  return (
    <header className="gt-partner-header">
      {backLabel ? (
        <button
          type="button"
          className="gt-partner-header__back-text"
          onClick={() => (back ? navigate("partner", back) : history.back())}
        >
          {backLabel}
        </button>
      ) : (
        <button
          type="button"
          className="gt-partner-header__button"
          aria-label="Назад"
          onClick={() => (back ? navigate("partner", back) : history.back())}
        >
          <ArrowLeft size={23} />
        </button>
      )}
      <strong>{title}</strong>
      {showMenu ? (
        <button type="button" className="gt-partner-header__button" aria-label="Меню">
          <MoreVertical size={23} />
        </button>
      ) : nextLabel ? (
        <button type="button" className="gt-partner-header__text-action" onClick={onNext}>
          {nextLabel}
        </button>
      ) : (
        <span className="gt-partner-header__spacer" />
      )}
    </header>
  );
}

type PartnerBottomNavKey = "home" | "info" | "stats" | "qr" | "settlements" | "profile";
type PartnerBottomNavItem = readonly [
  key: PartnerBottomNavKey,
  label: string,
  icon: typeof Home,
  slug: string,
];

function PartnerBottomNav({
  active,
  activated,
  navigate,
}: {
  active: "home" | "info" | "stats" | "profile" | "settlements";
  activated: boolean;
  navigate: Navigate;
}) {
  const items: readonly PartnerBottomNavItem[] = activated
    ? [
        ["home", "Головна", Home, "partner-dashboard"],
        ["stats", "Статистика", BarChart3, "partner-statistics"],
        ["qr", "QR", QrCode, "scanner"],
        ["settlements", "Взаєморозрахунки", WalletCards, "partner-finance"],
        ["profile", "Профіль", UserRound, "place-editor"],
      ]
    : [
        ["home", "Головна", Home, "partner-dashboard"],
        ["info", "Інфо", Info, "partner-info"],
        ["stats", "Статистика", BarChart3, "partner-statistics"],
        ["profile", "Профіль", UserRound, "place-editor"],
      ];

  return (
    <nav className={`gt-partner-bottom-nav ${activated ? "is-final" : ""}`}>
      {items.map(([key, label, Icon, slug]) => {
        const isQr = key === "qr";
        return (
          <button
            key={key}
            type="button"
            className={`${active === key ? "is-active" : ""} ${isQr ? "is-qr" : ""}`}
            onClick={() => navigate("partner", slug)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function LogoCard({ name, placeType, logoUrl = "" }: { name: string; placeType: string; logoUrl?: string }) {
  const title = name.trim() || "Ваш заклад";
  return (
    <div className="gt-partner-logo-card">
      <div className="gt-partner-logo-card__icon">
        {logoUrl ? <img src={logoUrl} alt="Логотип закладу" /> : <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M6 28L18.5 12L26 20.5L31.5 14L36 19V28" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.5 27L23.5 10L34.5 23" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4.5 31H37.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/>
        </svg>}
      </div>
      <strong>{title}</strong>
      <small>{placeType || "Партнер"}</small>
    </div>
  );
}

function Hero({ showCopy = true, cabinet = false }: { showCopy?: boolean; cabinet?: boolean }) {
  const { profile } = usePartnerProfile();
  return (
    <section className={`gt-partner-hero ${cabinet ? "is-cabinet" : ""}`}>
      {profile.imageUrl ? <img src={profile.imageUrl} alt={profile.placeName || "Фото закладу"} /> : <div className="gt-partner-hero__placeholder"><ImageIcon size={42} /><span>Фото закладу</span></div>}
      <LogoCard name={profile.placeName} placeType={profile.placeType} logoUrl={profile.logoUrl} />
      {showCopy ? (
        <div className="gt-partner-hero__copy">
          <h1>{cabinet ? "Кабінет партнера" : "Стати партнером"}</h1>
          {!cabinet ? (
            <p>
              Рекламуйте послуги свого закладу
              <br />в Gid Tourist та залучайте нових клієнтів.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function MenuListCard({
  items,
  navigate,
}: {
  items: Array<{ slug: string; icon: typeof Building2; title: string; note: string }>;
  navigate: Navigate;
}) {
  return (
    <div className="gt-partner-list-card">
      {items.map(({ slug, icon: Icon, title, note }) => (
        <button type="button" key={slug} onClick={() => navigate("partner", slug)}>
          <span className="gt-partner-list-icon">
            <Icon size={23} />
          </span>
          <span className="gt-partner-list-copy">
            <strong>{title}</strong>
            <small>{note}</small>
          </span>
          <ChevronRight size={21} />
        </button>
      ))}
    </div>
  );
}

const basicMenuItems = [
  {
    slug: "partner-info",
    icon: Building2,
    title: "Інформація про заклад",
    note: "Фото, опис, зручності та контактні дані",
  },
  {
    slug: "partner-rules",
    icon: ClipboardList,
    title: "Правила проживання",
    note: "Додати або змінити правила для гостей",
  },
  {
    slug: "partner-wifi",
    icon: Wifi,
    title: "Wi‑Fi",
    note: "Назва мережі та пароль для гостей",
  },
  {
    slug: "partner-contacts",
    icon: Phone,
    title: "Контакти",
    note: "Телефони, email та інші способи зв’язку",
  },
  {
    slug: "partner-statistics",
    icon: BarChart3,
    title: "Статистика переходів",
    note: "Перегляди закладу та дії гостей у додатку",
  },
];

function PartnerStartScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="gt-partner-mobile-screen has-bottom-nav">
      <PartnerHeader title="Стати партнером" navigate={navigate} showMenu />
      <main className="gt-partner-mobile-content">
        <Hero />
        <section className="gt-partner-join-card">
          <div className="gt-partner-join-card__main">
            <span>
              <Sparkles size={23} />
            </span>
            <div>
              <strong>Долучайтеся до партнерської мережі</strong>
              <p>
                Підвищуйте впізнаваність закладу, отримуйте
                більше гостей і збільшуйте прибуток разом з нами.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => navigate("partner", "partner-info")}>
            Дізнатися більше
          </button>
          <small>
            Про можливості партнерства <ChevronRight size={15} />
          </small>
        </section>

        <MenuListCard items={basicMenuItems} navigate={navigate} />

        <button type="button" className="gt-partner-refresh" onClick={() => navigate("partner", "partner-update")}>
          <RefreshCcw size={18} /> Оновити інформацію
        </button>
      </main>
      <PartnerBottomNav active="home" activated={false} navigate={navigate} />
    </div>
  );
}

function FormCard({ children }: { children: ReactNode }) {
  return <div className="gt-partner-form-card">{children}</div>;
}

function InputRow({
  label,
  value,
  onChange,
  multiline = false,
  rightIcon,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  multiline?: boolean;
  rightIcon?: ReactNode;
}) {
  return (
    <label className={`gt-partner-input-row ${multiline ? "is-multiline" : ""}`}>
      <span className="gt-partner-input-row__content">
        <small>{label}</small>
        {multiline ? (
          <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
        ) : (
          <input value={value} onChange={(event) => onChange(event.target.value)} />
        )}
      </span>
      <i>{rightIcon ?? <Edit3 size={16} />}</i>
    </label>
  );
}

function buildAddress(profile: Pick<PartnerProfile, "city" | "regionName" | "street" | "house">) {
  return [profile.street, profile.house, profile.city, profile.regionName].map((item) => item.trim()).filter(Boolean).join(", ");
}

async function resizePartnerImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const item = new Image();
    item.onload = () => resolve(item);
    item.onerror = reject;
    item.src = dataUrl;
  });
  const maxWidth = 1280;
  const maxHeight = 900;
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function AddressAutocompleteRow({
  label,
  value,
  mode,
  city,
  street,
  disabled = false,
  verified = false,
  onText,
  onSelect,
}: {
  label: string;
  value: string;
  mode: "city" | "street" | "house";
  city?: string;
  street?: string;
  disabled?: boolean;
  verified?: boolean;
  onText: (value: string) => void;
  onSelect: (details: Stage2GeoDetails, suggestion: Stage2GeoSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<Stage2GeoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (disabled || verified || !dirty || value.trim().length < 1 || (mode !== "city" && !city)) { setSuggestions([]); setOpen(false); setError(""); return; }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ input: value.trim(), mode });
      if (city) params.set("city", city);
      if (street) params.set("street", street);
      void stage2Fetch<Stage2GeoSuggestion[]>(`/geo/autocomplete?${params}`).then((items) => {
        if (!cancelled) { setSuggestions(items); setOpen(true); }
      }).catch((requestError) => {
        if (!cancelled) {
          setSuggestions([]);
          setOpen(true);
          setError(requestError instanceof Error ? requestError.message : "Не вдалося отримати адресні підказки");
        }
      }).finally(() => { if (!cancelled) setLoading(false); });
    }, 260);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [value, mode, city, street, disabled, verified, dirty]);

  const choose = async (suggestion: Stage2GeoSuggestion) => {
    setOpen(false);
    setDirty(false);
    try {
      const details = await stage2Fetch<Stage2GeoDetails>(`/geo/place/${encodeURIComponent(suggestion.place_id)}`);
      onSelect(details, suggestion);
    } catch {
      onText(suggestion.main_text || suggestion.text);
    }
  };

  return (
    <label className={`gt-partner-input-row gt-partner-address-autocomplete ${verified ? "is-verified" : ""} ${disabled ? "is-disabled" : ""}`}>
      <span className="gt-partner-input-row__content">
        <small>{label}</small>
        <input
          value={value}
          disabled={disabled}
          autoComplete="off"
          placeholder={disabled ? (mode === "street" ? "Спочатку виберіть місто" : "Спочатку виберіть вулицю") : "Почніть вводити — оберіть зі списку"}
          onFocus={() => !verified && dirty && suggestions.length && setOpen(true)}
          onChange={(event) => { setDirty(true); onText(event.target.value); }}
        />
        {open && suggestions.length ? (
          <span className="gt-partner-address-suggestions">
            {suggestions.map((item) => (
              <button type="button" key={item.place_id} onMouseDown={(event) => event.preventDefault()} onClick={() => void choose(item)}>
                <strong>{item.main_text || item.text}</strong><small>{item.secondary_text}</small>
              </button>
            ))}
          </span>
        ) : open && !loading && value.trim() ? (
          <span className="gt-partner-address-suggestions gt-partner-address-suggestions--empty">
            {error ? error : "Збігів не знайдено. Продовжуйте вводити назву."}
          </span>
        ) : null}
      </span>
      <i>{loading ? <RefreshCcw size={15} className="gt-spin" /> : verified ? <Check size={16} /> : <MapPin size={16} />}</i>
    </label>
  );
}

function applyTemplateServices(_template?: Stage2PlaceTypeTemplate) {
  // Type templates define available fields only. They must never create fake services/data for a real partner.
}

function amenityIcon(label: string) {
  if (/wi[\s‑-]*fi/i.test(label)) return Wifi;
  if (/номер|кімнат|ліж/i.test(label)) return BedDouble;
  if (/паркін|парков/i.test(label)) return CircleParking;
  if (/меню|снідан|кава|десерт|напої/i.test(label)) return UtensilsCrossed;
  if (/spa|саун|душ|рушник|басейн/i.test(label)) return Waves;
  if (/трансфер|багаж|авто|таксі/i.test(label)) return MapPin;
  if (/гід|груп|інструктор|дитяч/i.test(label)) return Users;
  if (/актив|подар|локаль|ліки/i.test(label)) return Sparkles;
  return Building2;
}

function AmenitiesRow({ amenities, hasWifi, onClick }: { amenities: string[]; hasWifi: boolean; onClick?: () => void }) {
  const visibleAmenities = amenities.filter((item) => hasWifi || !/wi[\s‑-]*fi/i.test(item)).slice(0, 6);
  return (
    <button type="button" className="gt-amenities-row" onClick={onClick}>
      <span>Послуги / зручності</span>
      <div>
        {visibleAmenities.map((label) => {
          const Icon = amenityIcon(label);
          return <small key={label} title={label}><Icon size={15} /></small>;
        })}
      </div>
      <i><Edit3 size={16} /></i>
    </button>
  );
}

function WifiAvailabilityRow({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <div className="gt-partner-wifi-toggle-row">
      <span><Wifi size={18} /><span><strong>Wi‑Fi у закладі</strong><small>{enabled ? "Є — сторінка Wi‑Fi буде доступна" : "Немає — крок Wi‑Fi буде пропущено"}</small></span></span>
      <button type="button" className={`gt-switch ${enabled ? "is-on" : ""}`} onClick={() => onChange(!enabled)} aria-label="Wi-Fi у закладі"><i /></button>
    </div>
  );
}

function PartnerInfoScreen({ navigate, activated }: PartnerProps) {
  const { profile, setProfile } = usePartnerProfile();
  const [stage2Categories, setStage2Categories] = useState<Stage2Category[]>(FALLBACK_STAGE2_CATEGORIES);
  const [placeTemplates, setPlaceTemplates] = useState<Stage2PlaceTypeTemplate[]>(FALLBACK_PLACE_TEMPLATES);
  const [addressError, setAddressError] = useState("");
  const [showAmenityEditor, setShowAmenityEditor] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const goBack = activated ? "partner-cabinet" : "partner-dashboard";

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      stage2Fetch<Stage2Category[]>("/categories"),
      stage2Fetch<Stage2PlaceTypeTemplate[]>("/place-type-templates"),
    ]).then(([items, templates]) => {
      if (!cancelled) {
        setStage2Categories(items.filter((item) => item.slug !== "emergency").length ? items.filter((item) => item.slug !== "emergency") : FALLBACK_STAGE2_CATEGORIES);
        setPlaceTemplates(mergedTemplates(templates));
      }
    }).catch(() => {
      if (!cancelled) {
        setStage2Categories(FALLBACK_STAGE2_CATEGORIES);
        setPlaceTemplates(FALLBACK_PLACE_TEMPLATES);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const applyPlaceTemplate = (_template: Stage2PlaceTypeTemplate | undefined, categorySlug: string, placeType: string) => {
    setProfile((prev) => ({ ...prev, categorySlug, placeType, templateFields: {} }));
  };

  const activeTemplate = placeTemplates.find((item) => item.place_type === profile.placeType);
  const activeTemplateFields = Object.entries(activeTemplate?.fields ?? {}).filter(([, label]) => typeof label === "string" && String(label).trim());

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav">
      <PartnerHeader
        title="Інформація про заклад"
        navigate={navigate}
        back={goBack}
        nextLabel="Далі"
        onNext={() => {
          const hasVerifiedAddress = Boolean(profile.cityPlaceId && profile.streetPlaceId && profile.housePlaceId);
          const hasSavedLocation = Boolean(profile.address.trim() && Number.isFinite(Number(profile.lat)) && Number.isFinite(Number(profile.lng)));
          if (!hasVerifiedAddress && !hasSavedLocation) {
            setAddressError("Оберіть реальну адресу з підказок пошуку або використайте вже збережене адміністратором місцезнаходження.");
            return;
          }
          setAddressError("");
          navigate("partner", "partner-rules");
        }}
      />
      <main className="gt-partner-mobile-content gt-partner-form-page">
        <section className="gt-partner-photo-editor">
          {profile.imageUrl ? <img src={profile.imageUrl} alt="Фото закладу" /> : <div className="gt-partner-photo-placeholder"><ImageIcon size={30} /><span>Фото ще не додано</span></div>}
          <input ref={photoInputRef} className="gt-visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void resizePartnerImage(file).then((imageUrl) => setProfile((prev) => ({ ...prev, imageUrl })));
            event.currentTarget.value = "";
          }} />
          <button type="button" onClick={() => photoInputRef.current?.click()}>
            <ImageIcon size={16} /> Змінити фото
          </button>
        </section>

        <section className="gt-partner-logo-editor">
          <div className="gt-partner-logo-editor__preview">
            {profile.logoUrl ? <img src={profile.logoUrl} alt="Логотип закладу" /> : <Building2 size={28} />}
          </div>
          <div><strong>Логотип закладу</strong><small>Відображається на головній картці партнера</small></div>
          <input ref={logoInputRef} className="gt-visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void resizePartnerImage(file).then((logoUrl) => setProfile((prev) => ({ ...prev, logoUrl })));
            event.currentTarget.value = "";
          }} />
          <button type="button" onClick={() => logoInputRef.current?.click()}><ImageIcon size={15}/> Змінити</button>
        </section>

        <FormCard>
          <InputRow
            label="Назва закладу"
            value={profile.placeName}
            onChange={(placeName) => setProfile((prev) => ({ ...prev, placeName }))}
          />
          {placeTemplates.length ? (
            <label className="gt-partner-input-row">
              <span className="gt-partner-input-row__content">
                <small>Тип закладу</small>
                <select value={profile.placeType} onChange={(event) => {
                  const placeType = event.target.value;
                  const template = placeTemplates.find((item) => item.place_type === placeType);
                  applyPlaceTemplate(template, template?.category_slug || categoryFromPlaceType(placeType), placeType);
                }}>
                  {placeTemplates.map((item) => <option key={item.id} value={item.place_type}>{item.label}</option>)}
                </select>
              </span>
              <i><ChevronRight size={16} /></i>
            </label>
          ) : (
            <InputRow
              label="Тип закладу"
              value={profile.placeType}
              onChange={(placeType) => setProfile((prev) => ({ ...prev, placeType, categorySlug: categoryFromPlaceType(placeType) }))}
              rightIcon={<ChevronRight size={16} />}
            />
          )}
          <AddressAutocompleteRow
            label="Місто" mode="city" value={profile.city} verified={Boolean(profile.cityPlaceId)}
            onText={(city) => {
              setAddressError("");
              setProfile((prev) => ({ ...prev, city, cityPlaceId: "", street: "", streetPlaceId: "", house: "", housePlaceId: "", address: buildAddress({ ...prev, city, street: "", house: "" }) }));
            }}
            onSelect={(details, suggestion) => setProfile((prev) => {
              const city = details.city || suggestion.main_text;
              const regionName = details.region || prev.regionName;
              return { ...prev, city, regionName, cityPlaceId: suggestion.place_id, street: "", streetPlaceId: "", house: "", housePlaceId: "", lat: String(details.lat || prev.lat), lng: String(details.lng || prev.lng), address: buildAddress({ ...prev, city, regionName, street: "", house: "" }) };
            })}
          />
          <AddressAutocompleteRow
            label="Вулиця" mode="street" value={profile.street} city={profile.city} disabled={!profile.city.trim()} verified={Boolean(profile.streetPlaceId)}
            onText={(street) => {
              setAddressError("");
              setProfile((prev) => ({ ...prev, street, streetPlaceId: "", house: "", housePlaceId: "", address: buildAddress({ ...prev, street, house: "" }) }));
            }}
            onSelect={(details, suggestion) => setProfile((prev) => {
              const street = details.street || suggestion.main_text;
              return { ...prev, street, streetPlaceId: suggestion.place_id, house: "", housePlaceId: "", lat: String(details.lat || prev.lat), lng: String(details.lng || prev.lng), address: buildAddress({ ...prev, street, house: "" }) };
            })}
          />
          <AddressAutocompleteRow
            label="Будинок" mode="house" value={profile.house} city={profile.city} street={profile.street} disabled={!profile.street.trim()} verified={Boolean(profile.housePlaceId)}
            onText={(house) => {
              setAddressError("");
              setProfile((prev) => ({ ...prev, house, housePlaceId: "", address: buildAddress({ ...prev, house }) }));
            }}
            onSelect={(details, suggestion) => setProfile((prev) => {
              const house = details.house || suggestion.main_text;
              const city = details.city || prev.city;
              const regionName = details.region || prev.regionName;
              const street = details.street || prev.street;
              return { ...prev, city, regionName, street, house, housePlaceId: suggestion.place_id, lat: String(details.lat || prev.lat), lng: String(details.lng || prev.lng), address: details.formatted_address || buildAddress({ ...prev, city, regionName, street, house }) };
            })}
          />
          {addressError ? <p className="gt-partner-address-error">{addressError}</p> : null}
          <InputRow
            label="Опис"
            value={profile.description}
            onChange={(description) => setProfile((prev) => ({ ...prev, description }))}
            multiline
          />
          <AmenitiesRow amenities={profile.amenities} hasWifi={profile.hasWifi} onClick={() => setShowAmenityEditor((value) => !value)} />
          {showAmenityEditor ? (
            <div className="gt-partner-amenity-editor">
              <strong>Іконки / зручності закладу</strong>
              <div>
                {Array.from(new Set([
                  ...(activeTemplate?.default_amenities || []),
                  "Wi‑Fi", "Паркінг", "Номери", "Сніданок", "Меню", "Оплата карткою", "Дитяче меню", "Самовивіз", "Доставка", "Трансфер", "Доступність", "Домашні тварини",
                ])).map((amenity) => {
                  const active = profile.amenities.includes(amenity) && (amenity !== "Wi‑Fi" || profile.hasWifi);
                  const Icon = amenityIcon(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      className={active ? "is-active" : ""}
                      onClick={() => setProfile((prev) => {
                        const exists = prev.amenities.includes(amenity);
                        const nextAmenities = exists ? prev.amenities.filter((item) => item !== amenity) : [...prev.amenities, amenity];
                        const togglesWifi = /wi[\s‑-]*fi/i.test(amenity);
                        const hasWifi = togglesWifi ? !exists : prev.hasWifi;
                        return {
                          ...prev,
                          amenities: nextAmenities,
                          hasWifi,
                          wifiSsid: hasWifi ? prev.wifiSsid : "",
                          wifiPassword: hasWifi ? prev.wifiPassword : "",
                        };
                      })}
                    >
                      <Icon size={15} /><span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="gt-partner-detailed-services-link" onClick={() => navigate("partner", "partner-services")}>
                <Edit3 size={15} /> Детальні послуги (сауна, чан, трансфер тощо)
              </button>
            </div>
          ) : null}
          <WifiAvailabilityRow enabled={profile.hasWifi} onChange={(hasWifi) => setProfile((prev) => ({
            ...prev,
            hasWifi,
            wifiSsid: hasWifi ? prev.wifiSsid : "",
            wifiPassword: hasWifi ? prev.wifiPassword : "",
            amenities: hasWifi
              ? (prev.amenities.some((item) => /wi[\s‑-]*fi/i.test(item)) ? prev.amenities : [...prev.amenities, "Wi‑Fi"])
              : prev.amenities.filter((item) => !/wi[\s‑-]*fi/i.test(item)),
          }))} />
          {activeTemplateFields.length ? activeTemplateFields.map(([key, label]) => key === "payment_methods" ? (
            <div className="gt-partner-template-payment" key={`${profile.placeType}-${key}`}>
              <small>{String(label)}</small>
              <PaymentMethodsSelector compact value={profile.payment} onChange={(payment) => setProfile((prev) => ({ ...prev, payment }))} />
            </div>
          ) : (
            <InputRow
              key={`${profile.categorySlug}-${profile.placeType}-${key}`}
              label={String(label)}
              value={profile.templateFields[key] ?? ""}
              onChange={(value) => setProfile((prev) => ({ ...prev, templateFields: { ...prev.templateFields, [key]: value } }))}
            />
          )) : (
            <>
              <InputRow label="Кількість номерів" value={profile.roomCount} onChange={(roomCount) => setProfile((prev) => ({ ...prev, roomCount }))} />
              <InputRow label="Рік відкриття" value={profile.openedYear} onChange={(openedYear) => setProfile((prev) => ({ ...prev, openedYear }))} />
              <InputRow label="Мови обслуговування" value={profile.languages} onChange={(languages) => setProfile((prev) => ({ ...prev, languages }))} />
              <InputRow label="Тип розміщення" value={profile.accommodationType} onChange={(accommodationType) => setProfile((prev) => ({ ...prev, accommodationType }))} />
            </>
          )}
        </FormCard>
      </main>
      <PartnerBottomNav active="info" activated={activated} navigate={navigate} />
    </div>
  );
}

function RuleLine({
  icon: Icon,
  value,
  onChange,
}: {
  icon: typeof Clock3;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="gt-partner-rule-line">
      <Icon size={17} />
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={value.length > 45 ? 2 : 1}
      />
      <Edit3 size={16} />
    </label>
  );
}

const RULE_ICON_OPTIONS: Array<{ key: PartnerRuleIcon; label: string; icon: typeof Clock3 }> = [
  { key: "no-smoking", label: "Без куріння", icon: CigaretteOff },
  { key: "quiet", label: "Тиша", icon: Moon },
  { key: "pets", label: "Тварини", icon: PawPrint },
  { key: "clock", label: "Час", icon: Clock3 },
  { key: "security", label: "Безпека", icon: ShieldCheck },
  { key: "people", label: "Гості", icon: Users },
  { key: "info", label: "Інформація", icon: Info },
  { key: "sparkles", label: "Чистота", icon: Sparkles },
  { key: "energy", label: "Важливо", icon: Zap },
  { key: "lock", label: "Обмеження", icon: LockKeyhole },
];

function ruleIconComponent(icon: PartnerRuleIcon) {
  return RULE_ICON_OPTIONS.find((item) => item.key === icon)?.icon || Info;
}

function EditableGeneralRule({
  rule,
  onChange,
  onDelete,
}: {
  rule: PartnerRule;
  onChange: (rule: PartnerRule) => void;
  onDelete: () => void;
}) {
  const [showIcons, setShowIcons] = useState(false);
  const Icon = ruleIconComponent(rule.icon);
  return (
    <div className="gt-partner-rule-line gt-partner-rule-line--editable">
      <button type="button" className="gt-partner-rule-icon-button" onClick={() => setShowIcons((value) => !value)} aria-label="Змінити іконку правила">
        <Icon size={18} />
      </button>
      <textarea value={rule.text} onChange={(event) => onChange({ ...rule, text: event.target.value })} rows={rule.text.length > 45 ? 2 : 1} />
      <button type="button" className="gt-partner-rule-delete" onClick={onDelete} aria-label="Видалити правило"><Trash2 size={16} /></button>
      {showIcons ? (
        <div className="gt-partner-rule-icon-picker">
          {RULE_ICON_OPTIONS.map(({ key, label, icon: OptionIcon }) => (
            <button
              key={key}
              type="button"
              className={rule.icon === key ? "is-active" : ""}
              title={label}
              onClick={() => { onChange({ ...rule, icon: key }); setShowIcons(false); }}
            >
              <OptionIcon size={17} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const PAYMENT_METHOD_OPTIONS = ["Готівка", "Visa", "Mastercard"] as const;

function paymentMethodsFromText(value: string) {
  const normalized = value.toLocaleLowerCase("uk");
  const result: string[] = [];
  if (/готів/.test(normalized)) result.push("Готівка");
  if (/visa|віза|карт/.test(normalized)) result.push("Visa");
  if (/mastercard|мастеркард|карт/.test(normalized)) result.push("Mastercard");
  return result.length ? Array.from(new Set(result)) : ["Готівка"];
}

function PaymentMethodsSelector({ value, onChange, compact = false }: { value: string; onChange: (value: string) => void; compact?: boolean }) {
  const selected = paymentMethodsFromText(value);
  const toggle = (method: string) => {
    const next = selected.includes(method) ? selected.filter((item) => item !== method) : [...selected, method];
    onChange((next.length ? next : ["Готівка"]).join(", "));
  };
  return (
    <div className={`gt-partner-payment-methods ${compact ? "is-compact" : ""}`} role="group" aria-label="Способи оплати">
      {PAYMENT_METHOD_OPTIONS.map((method) => (
        <button type="button" key={method} className={selected.includes(method) ? "is-active" : ""} onClick={() => toggle(method)}>
          <span className="gt-partner-payment-methods__check">{selected.includes(method) ? <Check size={14} /> : null}</span>
          <span>{method}</span>
        </button>
      ))}
    </div>
  );
}

function PaymentLogos({ value }: { value: string }) {
  const selected = paymentMethodsFromText(value);
  return (
    <div className="gt-payment-logos" aria-label="Підтримувані способи оплати">
      {selected.includes("Готівка") ? <span className="gt-payment-logo gt-payment-logo--cash" aria-label="Готівка">Готівка</span> : null}
      {selected.includes("Visa") ? <span className="gt-payment-logo gt-payment-logo--visa" aria-label="Visa">
        <svg viewBox="0 0 76 26" role="img" aria-hidden="true">
          <text x="5" y="20" fontSize="20" fontWeight="900" fontStyle="italic" fontFamily="Arial Black, Arial, sans-serif">VISA</text>
        </svg>
      </span> : null}
      {selected.includes("Mastercard") ? <span className="gt-payment-logo gt-payment-logo--mastercard" aria-label="Mastercard">
        <svg viewBox="0 0 78 28" role="img" aria-hidden="true">
          <circle cx="31" cy="14" r="10.5" fill="#EB001B" />
          <circle cx="45" cy="14" r="10.5" fill="#F79E1B" />
          <path d="M38 5.8a10.5 10.5 0 0 1 0 16.4 10.5 10.5 0 0 1 0-16.4Z" fill="#FF5F00" />
        </svg>
      </span> : null}
    </div>
  );
}

function RulesScreen({ navigate, activated }: PartnerProps) {
  const { profile, setProfile } = usePartnerProfile();
  const goBack = activated ? "partner-info" : "partner-info";

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav">
      <PartnerHeader
        title="Правила проживання"
        navigate={navigate}
        back={goBack}
        nextLabel="Далі"
        onNext={() => navigate("partner", profile.hasWifi ? "partner-wifi" : "partner-contacts")}
      />
      <main className="gt-partner-mobile-content gt-partner-form-page">
        <h3 className="gt-partner-section-title">Загальні правила</h3>
        <FormCard>
          <RuleLine
            icon={LogIn}
            value={profile.checkIn}
            onChange={(checkIn) => setProfile((prev) => ({ ...prev, checkIn }))}
          />
          <RuleLine
            icon={LogOut}
            value={profile.checkOut}
            onChange={(checkOut) => setProfile((prev) => ({ ...prev, checkOut }))}
          />
          {profile.generalRules.map((rule) => (
            <EditableGeneralRule
              key={rule.id}
              rule={rule}
              onChange={(updated) => setProfile((prev) => ({ ...prev, generalRules: prev.generalRules.map((item) => item.id === updated.id ? updated : item) }))}
              onDelete={() => setProfile((prev) => ({ ...prev, generalRules: prev.generalRules.filter((item) => item.id !== rule.id) }))}
            />
          ))}
          <button
            type="button"
            className="gt-partner-add-rule"
            onClick={() => {
              const icon = RULE_ICON_OPTIONS[Math.floor(Math.random() * RULE_ICON_OPTIONS.length)]?.key || "info";
              setProfile((prev) => ({
                ...prev,
                generalRules: [...prev.generalRules, { id: `rule-${Date.now()}`, text: "Нове правило — натисніть і відредагуйте", icon }],
              }));
            }}
          >
            <Plus size={16} /> Додати правило
          </button>
        </FormCard>

        <section className="gt-partner-text-section">
          <strong>Скасування бронювання</strong>
          <textarea
            value={profile.cancellation}
            onChange={(event) => setProfile((prev) => ({ ...prev, cancellation: event.target.value }))}
            rows={4}
          />
        </section>

        <section className="gt-partner-text-section gt-payment-section">
          <strong>Спосіб оплати</strong>
          <PaymentMethodsSelector value={profile.payment} onChange={(payment) => setProfile((prev) => ({ ...prev, payment }))} />
          <PaymentLogos value={profile.payment} />
        </section>

        <section className="gt-partner-text-section is-last">
          <strong>Інші умови</strong>
          <textarea
            value={profile.otherRules}
            onChange={(event) => setProfile((prev) => ({ ...prev, otherRules: event.target.value }))}
            rows={4}
          />
        </section>
      </main>
      <PartnerBottomNav active="info" activated={activated} navigate={navigate} />
    </div>
  );
}

function WifiScreen({ navigate, activated }: PartnerProps) {
  const { profile, setProfile } = usePartnerProfile();
  const [showPassword, setShowPassword] = useState(true);

  useEffect(() => {
    if (!profile.hasWifi) navigate("partner", "partner-contacts");
  }, [profile.hasWifi, navigate]);

  if (!profile.hasWifi) return null;

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-wifi-screen">
      <PartnerHeader
        title="Wi‑Fi"
        navigate={navigate}
        back="partner-rules"
        nextLabel="Далі"
        onNext={() => navigate("partner", "partner-contacts")}
      />
      <main className="gt-partner-mobile-content gt-partner-form-page">
        <div className="gt-wifi-hero">
          <span>
            <Wifi size={56} />
          </span>
          <strong>Безкоштовний Wi‑Fi для гостей</strong>
        </div>

        <FormCard>
          <InputRow
            label="Назва мережі (SSID)"
            value={profile.wifiSsid}
            onChange={(wifiSsid) => setProfile((prev) => ({ ...prev, wifiSsid }))}
          />
          <label className="gt-partner-input-row">
            <span className="gt-partner-input-row__content">
              <small>Пароль</small>
              <input
                type={showPassword ? "text" : "password"}
                value={profile.wifiPassword}
                onChange={(event) => setProfile((prev) => ({ ...prev, wifiPassword: event.target.value }))}
              />
            </span>
            <div className="gt-inline-actions">
              <button type="button" onClick={() => setShowPassword((prev) => !prev)}>
                <Eye size={16} />
              </button>
              <Edit3 size={16} />
            </div>
          </label>
        </FormCard>

        <div className="gt-partner-tip-box">
          <strong>Поради для підключення</strong>
          <ul>
            <li>Переконайтеся, що Wi‑Fi увімкнено на вашому пристрої.</li>
            <li>Якщо підключення не вдається, спробуйте перезавантажити пристрій.</li>
            <li>Зверніться до адміністрації у разі проблем.</li>
          </ul>
        </div>
      </main>
      <PartnerBottomNav active="info" activated={activated} navigate={navigate} />
    </div>
  );
}

function ContactRow({
  icon: Icon,
  brandIcons,
  label,
  value,
  onChange,
  iconClassName,
  readOnly = false,
}: {
  icon?: typeof Phone;
  brandIcons?: Array<{ src: string; alt: string }>;
  label: string;
  value: string;
  onChange: (next: string) => void;
  iconClassName?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="gt-contact-edit-row">
      <span className={`gt-contact-edit-row__icon ${iconClassName ?? ""}`}>
        {brandIcons ? (
          <span className="gt-contact-brand-icons">
            {brandIcons.map(({ src, alt }) => (
              <img key={src} src={src} alt={alt} />
            ))}
          </span>
        ) : Icon ? (
          <Icon size={27} />
        ) : null}
      </span>
      <span className="gt-contact-edit-row__copy">
        <small>{label}</small>
        <input value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} />
      </span>
      <i>
        {readOnly ? <MapPin size={20} /> : <Edit3 size={20} />}
      </i>
    </label>
  );
}

function ContactsScreen({ navigate, activated, onActivate }: PartnerProps & { onActivate: () => void }) {
  const { profile, setProfile } = usePartnerProfile();
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-contact-page">
      <PartnerHeader
        title="Контакти"
        navigate={navigate}
        back={profile.hasWifi ? "partner-wifi" : "partner-rules"}
        nextLabel={submitting ? "Збереження…" : "Зберегти"}
        onNext={() => {
          if (submitting) return;
          setSubmitError("");
          setSubmitting(true);
          void submitPartnerProfile(profile).then((place) => {
            if (place.status === "approved") onActivate();
            navigate("partner", place.status === "approved" ? "partner-cabinet" : "partner-pending");
          }).catch((error) => {
            setSubmitError(error instanceof Error ? error.message : "Не вдалося відправити заклад на модерацію");
          }).finally(() => setSubmitting(false));
        }}
      />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-contact-page-content">
        {submitError ? <div className="gt-partner-submit-error">{submitError}</div> : null}
        <section className="gt-contact-edit-card">
          <ContactRow
            icon={Phone}
            label="Телефон"
            value={profile.phone}
            onChange={(phone) => setProfile((prev) => ({ ...prev, phone }))}
            iconClassName="is-green"
          />
          <ContactRow
            brandIcons={[{ src: "/icons/viber.svg", alt: "Viber" }]}
            label="Viber / Telegram"
            value={profile.messenger}
            onChange={(messenger) => setProfile((prev) => ({ ...prev, messenger }))}
          />
          <ContactRow
            icon={Mail}
            label="Email"
            value={profile.email}
            onChange={(email) => setProfile((prev) => ({ ...prev, email }))}
            iconClassName="is-green"
          />
          <ContactRow
            icon={Globe2}
            label="Сайт"
            value={profile.website}
            onChange={(website) => setProfile((prev) => ({ ...prev, website }))}
            iconClassName="is-green"
          />
          <ContactRow
            brandIcons={[{ src: "/icons/instagram.svg", alt: "Instagram" }]}
            label="Instagram"
            value={profile.instagram}
            onChange={(instagram) => setProfile((prev) => ({ ...prev, instagram }))}
          />
          <ContactRow
            brandIcons={[{ src: "/icons/facebook.svg", alt: "Facebook" }]}
            label="Facebook"
            value={profile.facebook}
            onChange={(facebook) => setProfile((prev) => ({ ...prev, facebook }))}
          />
          <ContactRow
            icon={MapPin}
            label="Адреса"
            value={profile.address}
            onChange={() => undefined}
            iconClassName="is-green"
            readOnly
          />
        </section>

        <section className="gt-contact-hours-panel">
          <div className="gt-contact-hours-panel__head">
            <span>Режим роботи</span>
            <Edit3 size={20} />
          </div>
          <div className="gt-contact-hours-panel__body">
            <label>
              <input
                value={profile.workMode}
                onChange={(event) => setProfile((prev) => ({ ...prev, workMode: event.target.value }))}
              />
            </label>
            <label>
              <input
                value={profile.workHours}
                onChange={(event) => setProfile((prev) => ({ ...prev, workHours: event.target.value }))}
              />
            </label>
          </div>
        </section>
      </main>
      <PartnerBottomNav active="info" activated={activated} navigate={navigate} />
    </div>
  );
}

type PartnerStatisticsTab = "general" | "clients" | "services";

const statisticsClients = [
  { initials: "ІП", name: "Іван Петренко", operations: 5, total: "2 450 ₴", commission: "123 ₴" },
  { initials: "МК", name: "Марія Коваль", operations: 3, total: "1 800 ₴", commission: "90 ₴" },
  { initials: "ОБ", name: "Олександр Бондар", operations: 2, total: "1 350 ₴", commission: "68 ₴" },
  { initials: "АШ", name: "Анна Шевченко", operations: 2, total: "980 ₴", commission: "49 ₴" },
  { initials: "ДР", name: "Дмитро Романюк", operations: 1, total: "750 ₴", commission: "38 ₴" },
  { initials: "НМ", name: "Наталія Мельник", operations: 1, total: "620 ₴", commission: "31 ₴" },
  { initials: "ЮГ", name: "Юрій Гнатюк", operations: 1, total: "540 ₴", commission: "27 ₴" },
  { initials: "ІК", name: "Ірина Климчук", operations: 1, total: "510 ₴", commission: "26 ₴" },
  { initials: "ВТ", name: "Василь Ткачук", operations: 1, total: "460 ₴", commission: "23 ₴" },
];

const statisticsServices = [
  { name: "Чан", operations: 56, total: "9 450 ₴", commission: "473 ₴", image: "/images/service-tub.webp" },
  { name: "Сауна", operations: 34, total: "6 120 ₴", commission: "306 ₴", image: "/images/service-sauna.webp" },
  { name: "Ресторан", operations: 28, total: "5 680 ₴", commission: "284 ₴", image: "/images/rest-excursion.webp" },
  { name: "SPA масаж", operations: 14, total: "2 650 ₴", commission: "133 ₴", image: "/images/rest-massage.webp" },
  { name: "Прокат велосипедів", operations: 8, total: "2 080 ₴", commission: "104 ₴", image: "/images/service-bikes.webp" },
  { name: "Пральня", operations: 6, total: "1 240 ₴", commission: "62 ₴", image: "/images/travel-thumbnails.webp" },
  { name: "Басейн", operations: 5, total: "980 ₴", commission: "49 ₴", image: "/images/service-pool.webp" },
];

function StatisticsDateFilter() {
  return (
    <button type="button" className="gt-stat-date-filter">
      <CalendarDays size={16} />
      <span>10 – 17 липня 2026</span>
      <ChevronRight size={14} className="gt-stat-date-filter__arrow" />
    </button>
  );
}

function StatisticMetricCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change?: string;
}) {
  return (
    <article className="gt-stat-metric-card">
      <small>{title}</small>
      <strong>{value}</strong>
      {change ? <span>↑ {change}</span> : null}
    </article>
  );
}

function StatisticsGeneralTab() {
  return (
    <>
      <h3 className="gt-stat-section-heading">Ключові показники</h3>
      <section className="gt-stat-metric-grid">
        <StatisticMetricCard title="Переходи на сторінку" value="1 248" change="18% до попереднього тижня" />
        <StatisticMetricCard title="Реальні клієнти" value="328" change="18% до попереднього тижня" />
        <StatisticMetricCard title="Операції (сканування QR)" value="146" change="22% до попереднього тижня" />
        <StatisticMetricCard title="Сума операцій" value="24 560 ₴" change="20% до попереднього тижня" />
        <StatisticMetricCard title="Комісія Gid Tourist" value="1 228 ₴" change="5% від суми операцій" />
      </section>

      <section className="gt-stat-line-block">
        <h3 className="gt-stat-section-heading">Динаміка переходів</h3>
        <div className="gt-stat-line-chart">
          <svg viewBox="0 0 340 142" role="img" aria-label="Динаміка переходів за тиждень">
            <g className="gt-stat-chart-grid">
              <line x1="38" y1="18" x2="332" y2="18" />
              <line x1="38" y1="48" x2="332" y2="48" />
              <line x1="38" y1="78" x2="332" y2="78" />
              <line x1="38" y1="108" x2="332" y2="108" />
            </g>
            <g className="gt-stat-chart-ylabels">
              <text x="1" y="22">1500</text>
              <text x="1" y="52">1200</text>
              <text x="10" y="82">600</text>
              <text x="16" y="112">300</text>
              <text x="24" y="134">0</text>
            </g>
            <polyline
              className="gt-stat-chart-line"
              points="50,108 94,100 138,63 182,92 226,62 270,81 324,28"
              fill="none"
            />
            <g className="gt-stat-chart-points">
              {[
                [50, 108], [94, 100], [138, 63], [182, 92], [226, 62], [270, 81], [324, 28],
              ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" />)}
            </g>
          </svg>
          <div className="gt-stat-chart-days">
            <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Нд</span>
          </div>
        </div>
      </section>

      <section className="gt-stat-summary-block">
        <h3 className="gt-stat-section-heading">Підсумки за період</h3>
        <div className="gt-stat-summary-list">
          <div><Search size={16} /><span>Переходи на сторінку</span><strong>1 248</strong></div>
          <div><Users size={16} /><span>Реальні клієнти</span><strong>328</strong></div>
          <div><QrCode size={16} /><span>Операції (сканування QR)</span><strong>146</strong></div>
          <div><WalletCards size={16} /><span>Загальна вартість операцій</span><strong>24 560 ₴</strong></div>
          <div><ReceiptText size={16} /><span>Комісія Gid Tourist</span><strong>1 228 ₴</strong></div>
        </div>
      </section>
    </>
  );
}

function StatisticsClientsTab() {
  const [showAll, setShowAll] = useState(false);
  const visibleClients = showAll ? statisticsClients : statisticsClients.slice(0, 7);

  return (
    <div className="gt-stat-clients-tab">
      <section className="gt-stat-client-metrics">
        <StatisticMetricCard title="Реальні клієнти" value="328" change="18%" />
        <StatisticMetricCard title="Нові клієнти" value="86" change="18%" />
        <StatisticMetricCard title="Повернулися" value="242" change="14%" />
      </section>

      <section className="gt-stat-table-section gt-stat-clients-section">
        <div className="gt-stat-section-title-row">
          <h3 className="gt-stat-section-heading">Список клієнтів</h3>
          <button type="button" className="gt-stat-filter-button"><SlidersHorizontal size={15} /> Фільтри</button>
        </div>
        <div className="gt-stat-client-table">
          <div className="gt-stat-client-table__head">
            <span>Клієнт</span><span>Операції</span><span>Сума операцій</span><span>Комісія</span>
          </div>
          {visibleClients.map((client) => (
            <div className="gt-stat-client-table__row" key={client.name}>
              <span className="gt-stat-client-name"><i>{client.initials}</i><b>{client.name}</b></span>
              <span>{client.operations}</span>
              <span>{client.total}</span>
              <span>{client.commission}</span>
            </div>
          ))}
        </div>
        <button type="button" className="gt-stat-show-all" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Показати основних клієнтів" : "Показати всіх клієнтів"}<ChevronRight size={17} />
        </button>
      </section>

      <section className="gt-stat-segmentation">
        <h3 className="gt-stat-section-heading">Сегментація клієнтів</h3>
        <div className="gt-stat-donut-layout">
          <div className="gt-stat-donut gt-stat-donut--clients"><span><strong>328</strong><small>клієнтів</small></span></div>
          <div className="gt-stat-donut-legend">
            <div><i className="is-blue" /><span>Нові</span><strong>86 (26%)</strong></div>
            <div><i className="is-green" /><span>Повернулися</span><strong>242 (74%)</strong></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatisticsServicesTab() {
  const [showAll, setShowAll] = useState(false);
  const visibleServices = showAll ? statisticsServices : statisticsServices.slice(0, 6);

  return (
    <>
      <article className="gt-stat-top-service">
        <div><small>Найпопулярніша послуга</small><strong>Чан</strong><span>56 операцій</span></div>
        <img src="/images/service-tub.webp" alt="Чан" />
      </article>

      <section className="gt-stat-table-section gt-stat-services-section">
        <h3 className="gt-stat-section-heading">Популярні послуги</h3>
        <div className="gt-stat-services-table">
          <div className="gt-stat-services-table__head">
            <span>Послуга</span><span>Операції</span><span>Сума операцій</span><span>Комісія</span>
          </div>
          {visibleServices.map((service) => (
            <div className="gt-stat-services-table__row" key={service.name}>
              <span className="gt-stat-service-name"><img src={service.image} alt="" /><b>{service.name}</b></span>
              <span>{service.operations}</span>
              <span>{service.total}</span>
              <span>{service.commission}</span>
            </div>
          ))}
        </div>
        <button type="button" className="gt-stat-show-all" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Показати основні послуги" : "Показати всі послуги"}<ChevronRight size={17} />
        </button>
      </section>

      <section className="gt-stat-categories">
        <h3 className="gt-stat-section-heading">Категорії послуг</h3>
        <div className="gt-stat-donut-layout">
          <div className="gt-stat-donut gt-stat-donut--services"><span><strong>146</strong><small>операцій</small></span></div>
          <div className="gt-stat-donut-legend gt-stat-donut-legend--categories">
            <div><i className="is-dark-green" /><span>Де поїсти</span><strong>70 (48%)</strong></div>
            <div><i className="is-green" /><span>Де купити</span><strong>28 (19%)</strong></div>
            <div><i className="is-sky" /><span>Розваги</span><strong>22 (15%)</strong></div>
            <div><i className="is-gray" /><span>Інше</span><strong>26 (18%)</strong></div>
          </div>
        </div>
      </section>
    </>
  );
}


function moderationPendingText(placeType: string) {
  const lower = placeType.trim().toLocaleLowerCase("uk");
  if (lower.includes("кафе")) return "Після підтвердження адміністрацією ваше кафе буде активним у відповідному розділі гіда та на карті.";
  if (lower.includes("готел")) return "Після підтвердження адміністрацією ваш готель буде активним у відповідному розділі гіда та на карті.";
  if (lower.includes("ресторан")) return "Після підтвердження адміністрацією ваш ресторан буде активним у відповідному розділі гіда та на карті.";
  if (lower.includes("магаз")) return "Після підтвердження адміністрацією ваш магазин буде активним у відповідному розділі гіда та на карті.";
  return `Після підтвердження адміністрацією ваш заклад (${placeType || "обраний тип"}) буде активним у відповідному розділі гіда та на карті.`;
}

function PartnerPendingScreen({ navigate, onActivate }: { navigate: Navigate; onActivate: () => void }) {
  const { profile } = usePartnerProfile();
  const [status, setStatus] = useState<"loading" | "pending" | "approved" | "rejected" | "error">("loading");
  const [comment, setComment] = useState("");
  const [statusError, setStatusError] = useState("");

  const refresh = async () => {
    setStatus("loading");
    setStatusError("");
    try {
      const session = await ensureTelegramSession();
      if (!session) throw new Error("Не вдалося авторизуватися через Telegram");
      const places = await stage2Fetch<Array<{ id: string; status: string; moderation_comment?: string | null }>>("/partner/places");
      const placeId = typeof window !== "undefined" ? window.localStorage.getItem(PARTNER_STAGE2_PLACE_KEY) : null;
      const place = places.find((item) => item.id === placeId) ?? places[0];
      if (!place) {
        setStatusError("Заклад ще не знайдено на сервері. Поверніться до контактів і натисніть «Зберегти» ще раз.");
        setStatus("error");
        return;
      }
      setComment(place.moderation_comment || "");
      if (place.status === "approved") {
        onActivate();
        setStatus("approved");
      } else if (place.status === "rejected") setStatus("rejected");
      else setStatus("pending");
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Не вдалося перевірити статус закладу");
      setStatus("error");
    }
  };

  useEffect(() => { void refresh(); }, []);

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav">
      <PartnerHeader title="Модерація закладу" navigate={navigate} back="partner-info" />
      <main className="gt-partner-mobile-content gt-partner-form-page">
        <section className="gt-partner-status-card">
          <span>{status === "approved" ? <Check size={30} /> : status === "rejected" ? <X size={30} /> : <Clock3 size={30} />}</span>
          <div>
            <strong>{status === "approved" ? "Заклад схвалено" : status === "rejected" ? "Потрібне доопрацювання" : status === "error" ? "Не вдалося перевірити статус" : "Заклад на модерації"}</strong>
            <small>{status === "error" ? statusError : comment || (status === "approved" ? "Заклад підтверджено адміністрацією та активовано у відповідному розділі гіда і на карті." : moderationPendingText(profile.placeType))}</small>
          </div>
        </section>
        <button type="button" className="gt-partner-primary-button" onClick={() => status === "approved" ? navigate("partner", "partner-cabinet") : void refresh()}>{status === "approved" ? "Відкрити кабінет" : "Оновити статус"}</button>
        {status === "rejected" ? <button type="button" className="gt-partner-secondary-button" onClick={() => navigate("partner", "partner-info")}>Виправити дані</button> : null}
      </main>
      <PartnerBottomNav active="info" activated={status === "approved"} navigate={navigate} />
    </div>
  );
}

function StatisticsScreen({ navigate, activated }: PartnerProps) {
  const [tab, setTab] = useState<PartnerStatisticsTab>("general");

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav gt-partner-stats-screen">
      <PartnerHeader title="Статистика" navigate={navigate} back="partner-dashboard" />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-statistics-page">
        <div className="gt-stat-main-tabs">
          <button type="button" className={tab === "general" ? "is-active" : ""} onClick={() => setTab("general")}>Загальна</button>
          <button type="button" className={tab === "clients" ? "is-active" : ""} onClick={() => setTab("clients")}>Клієнти</button>
          <button type="button" className={tab === "services" ? "is-active" : ""} onClick={() => setTab("services")}>Послуги</button>
        </div>

        <div className="gt-stat-date-wrap"><StatisticsDateFilter /></div>

        {tab === "general" ? <StatisticsGeneralTab /> : null}
        {tab === "clients" ? <StatisticsClientsTab /> : null}
        {tab === "services" ? <StatisticsServicesTab /> : null}
      </main>
      <PartnerBottomNav active="stats" activated={activated} navigate={navigate} />
    </div>
  );
}

function UpdateScreen({ navigate, activated }: PartnerProps) {
  return (
    <div className="gt-partner-mobile-screen has-bottom-nav">
      <PartnerHeader title="Оновити інформацію" navigate={navigate} back="partner-dashboard" />
      <main className="gt-partner-mobile-content gt-partner-form-page">
        <div className="gt-update-notice">
          <Info size={24} />
          <p>
            Підтримуйте інформацію актуальною,
            щоб гості завжди отримували
            достовірні дані про ваш заклад.
          </p>
        </div>

        <div className="gt-update-list">
          <strong>Що можна оновити</strong>
          <ul>
            <li>Фото закладу та номерів</li>
            <li>Опис та інформацію</li>
            <li>Послуги та зручності</li>
            <li>Правила проживання</li>
            <li>Контактні дані</li>
            <li>Ціни та спеціальні пропозиції</li>
          </ul>
        </div>

        <button type="button" className="gt-partner-refresh gt-partner-refresh--large" onClick={() => navigate("partner", "partner-info")}>
          <RefreshCcw size={18} /> Оновити зараз
        </button>

        <div className="gt-last-update">
          <CalendarDays size={20} />
          <span>
            <small>Останнє оновлення</small>
            <strong>12 травня 2024, 14:30</strong>
          </span>
        </div>
      </main>
      <PartnerBottomNav active="home" activated={activated} navigate={navigate} />
    </div>
  );
}

function PartnerHoursScreen({ navigate }: { navigate: Navigate }) {
  const { profile, setProfile } = usePartnerProfile();
  const save = async () => {
    try { await submitPartnerProfile(profile); } catch { /* Keep local changes; next save will retry backend. */ }
    navigate("partner", "partner-cabinet");
  };
  return <div className="gt-partner-mobile-screen has-bottom-nav">
    <PartnerHeader title="Графік роботи" navigate={navigate} back="partner-cabinet" nextLabel="Зберегти" onNext={() => void save()} />
    <main className="gt-partner-mobile-content gt-partner-form-page">
      <FormCard>
        <InputRow label="Режим роботи" value={profile.workMode} onChange={(workMode)=>setProfile((prev)=>({...prev,workMode}))} />
        <InputRow label="Години роботи" value={profile.workHours} onChange={(workHours)=>setProfile((prev)=>({...prev,workHours}))} />
      </FormCard>
    </main>
    <PartnerBottomNav active="home" activated navigate={navigate} />
  </div>;
}

function CabinetScreen({ navigate }: { navigate: Navigate }) {
  const { profile } = usePartnerProfile();
  const definitions: Record<string, { slug: string; icon: typeof Hotel; title: string; note: string }> = {
    "Бронювання і ресурси": { slug: "partner-bookings", icon: CalendarDays, title: "Бронювання і ресурси", note: "Налаштуйте календар, підтверджуйте заявки та додавайте ручні записи" },
    "Послуги закладу": { slug: "partner-services", icon: Hotel, title: "Послуги закладу", note: "Додавайте та керуйте послугами вашого закладу" },
    "Інформація про заклад": { slug: "partner-info", icon: Building2, title: "Інформація про заклад", note: "Фото, опис, зручності та контактні дані" },
    "Правила проживання": { slug: "partner-rules", icon: ClipboardList, title: "Правила проживання", note: "Додати або змінити правила для гостей" },
    "Wi‑Fi": { slug: "partner-wifi", icon: Wifi, title: "Wi‑Fi", note: "Назва мережі та пароль для гостей" },
    "Контакти": { slug: "partner-contacts", icon: Phone, title: "Контакти", note: "Телефони, email та інші способи зв’язку" },
    "Оперативні контакти": { slug: "partner-contacts", icon: Phone, title: "Оперативні контакти", note: "Телефони, email та інші способи зв’язку" },
    "Час заїзду / виїзду": { slug: "partner-checkin", icon: Clock3, title: "Час заїзду-виїзду", note: "Налаштуйте час заїзду та виїзду для гостей" },
    "Рецепція": { slug: "partner-update", icon: Building2, title: "Рецепція", note: "Інформація та налаштування рецепції" },
    "Парковка": { slug: "partner-update", icon: CircleParking, title: "Парковка", note: "Інформація про паркування для гостей" },
    "Сніданок": { slug: "partner-services", icon: UtensilsCrossed, title: "Сніданок", note: "Налаштування послуги сніданку" },
    "Графік роботи": { slug: "partner-hours", icon: Clock3, title: "Графік роботи", note: "Змініть режим та години роботи закладу" },
    "Статистика переходів": { slug: "partner-statistics", icon: BarChart3, title: "Статистика переходів", note: "Перегляди, переходи та активність гостей" },
    "Гарячі пропозиції": { slug: "partner-offers", icon: FlameKindling, title: "Гарячі пропозиції", note: "Створюйте акції та надсилайте їх на модерацію" },
    "Налаштування": { slug: "partner-update", icon: SlidersHorizontal, title: "Налаштування", note: "Оновлення даних, фото та параметрів кабінету" },
  };
  const baseModules = [
    "Інформація про заклад",
    "Послуги закладу",
    "Бронювання і ресурси",
    "Графік роботи",
    "Час заїзду / виїзду",
    "Правила проживання",
    ...(profile.hasWifi ? ["Wi‑Fi"] : []),
    "Контакти",
    "Гарячі пропозиції",
    "Статистика переходів",
    "Налаштування",
  ];
  const configuredModules = profile.cabinetModules ?? [];
  const moduleNames = configuredModules.length >= 3 ? configuredModules : baseModules;
  const enabled = moduleNames
    .filter((name) => profile.hasWifi || name !== "Wi‑Fi")
    .map((name) => definitions[name] ?? { slug: "partner-update", icon: Info, title: name, note: "Налаштування цього розділу кабінету" })
    .map((item, index) => ({ ...item, key: `${item.title}-${index}` }));

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-cabinet-screen">
      <main className="gt-partner-mobile-content gt-partner-cabinet-content">
        <Hero showCopy={false} cabinet />
        <div className="gt-partner-cabinet-list">
          {enabled.map(({ key, slug, icon: Icon, title, note }) => (
            <button type="button" key={key} onClick={() => navigate("partner", slug)}>
              <span className="gt-partner-list-icon"><Icon size={23} /></span>
              <span className="gt-partner-list-copy"><strong>{title}</strong><small>{note}</small></span>
              <ChevronRight size={21} />
            </button>
          ))}
        </div>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}



function PartnerOffersScreen({ navigate }: { navigate: Navigate }) {
  const [offers, setOffers] = useState<Stage2Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [terms, setTerms] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const load = async () => {
    setLoading(true);
    try { setOffers(await stage2Fetch<Stage2Offer[]>("/partner/offers")); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Не вдалося завантажити пропозиції"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const reset = () => {
    setEditingId(""); setTitle(""); setDiscount(""); setShortDescription(""); setDescription(""); setValidUntil(""); setTerms(""); setImageUrl("");
  };
  const edit = (offer: Stage2Offer) => {
    setEditingId(offer.id); setTitle(offer.title); setDiscount(offer.discount_label); setShortDescription(offer.short_description || ""); setDescription(offer.description || ""); setTerms(offer.terms || ""); setImageUrl(offer.image_url || "");
    setValidUntil(offer.valid_until ? new Date(offer.valid_until).toISOString().slice(0, 10) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const save = async () => {
    if (!title.trim() || !discount.trim()) { setMessage("Вкажіть назву та розмір знижки / умову акції"); return; }
    setSaving(true); setMessage("");
    try {
      const body = JSON.stringify({ title: title.trim(), discount_label: discount.trim(), short_description: shortDescription.trim(), description: description.trim(), valid_until: validUntil ? `${validUntil}T23:59:59+03:00` : null, terms: terms.trim(), image_url: imageUrl, badge: "Партнер", badge_tone: "green" });
      if (editingId) await stage2Fetch(`/partner/offers/${encodeURIComponent(editingId)}`, { method: "PATCH", body });
      else await stage2Fetch("/partner/offers", { method: "POST", body });
      setMessage("Пропозицію збережено та відправлено адміністрації на модерацію.");
      reset(); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не вдалося зберегти пропозицію"); }
    finally { setSaving(false); }
  };
  const remove = async (offer: Stage2Offer) => {
    if (!window.confirm(`Видалити пропозицію «${offer.title}»?`)) return;
    try { await stage2Fetch(`/partner/offers/${encodeURIComponent(offer.id)}`, { method: "DELETE" }); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Не вдалося видалити пропозицію"); }
  };

  return <div className="gt-partner-mobile-screen has-bottom-nav gt-partner-offers-screen">
    <PartnerHeader title="Гарячі пропозиції" navigate={navigate} back="partner-cabinet" />
    <main className="gt-partner-mobile-content gt-partner-form-page">
      <section className="gt-partner-offer-editor">
        <div className="gt-partner-offer-editor__title"><FlameKindling size={23}/><div><strong>{editingId ? "Редагування пропозиції" : "Нова пропозиція"}</strong><small>Після збереження акція потрапить на модерацію адміністрації</small></div></div>
        <label><span>Назва пропозиції</span><input value={title} onChange={(event)=>setTitle(event.target.value)} placeholder="Наприклад: -20% на основне меню" /></label>
        <label><span>Знижка / умова</span><input value={discount} onChange={(event)=>setDiscount(event.target.value)} placeholder="-20%, 2 за 1, Подарунок" /></label>
        <label><span>Короткий опис</span><input value={shortDescription} onChange={(event)=>setShortDescription(event.target.value)} placeholder="Коротко для картки пропозиції" /></label>
        <label><span>Повний опис</span><textarea rows={4} value={description} onChange={(event)=>setDescription(event.target.value)} placeholder="Що саме отримує турист" /></label>
        <label><span>Діє до</span><input type="date" value={validUntil} onChange={(event)=>setValidUntil(event.target.value)} /></label>
        <label><span>Умови</span><textarea rows={3} value={terms} onChange={(event)=>setTerms(event.target.value)} placeholder="Мінімальна сума, години дії, винятки тощо" /></label>
        <label className="gt-partner-offer-photo"><span>Фото пропозиції</span>{imageUrl ? <img src={imageUrl} alt="Фото пропозиції"/> : <span className="gt-partner-offer-photo__empty"><ImagePlus size={25}/> Додати фото</span>}<input type="file" accept="image/*" onChange={(event)=>{ const file=event.target.files?.[0]; if(file) void resizePartnerImage(file).then(setImageUrl); event.currentTarget.value=""; }} /></label>
        <div className="gt-partner-offer-editor__actions">{editingId ? <button type="button" className="gt-partner-secondary-button" onClick={reset}>Скасувати</button> : null}<button type="button" className="gt-partner-primary-button" disabled={saving} onClick={()=>void save()}>{saving ? "Зберігаємо…" : editingId ? "Зберегти зміни" : "Створити пропозицію"}</button></div>
        {message ? <p className="gt-partner-offer-message">{message}</p> : null}
      </section>
      <section className="gt-partner-offers-list">
        <h2>Ваші пропозиції</h2>
        {offers.map((offer)=><article key={offer.id} className="gt-partner-offer-card">
          {offer.image_url || offer.place_image_url ? <img src={offer.image_url || offer.place_image_url || ""} alt={offer.title}/> : <span className="gt-partner-offer-card__image"><ImageIcon size={24}/></span>}
          <div><span className={`gt-partner-offer-status is-${offer.status}`}>{offer.status === "approved" ? "Активна" : offer.status === "rejected" ? "Відхилена" : "На модерації"}</span><strong>{offer.title}</strong><small>{offer.discount_label} · {offer.valid_until ? `до ${new Date(offer.valid_until).toLocaleDateString("uk-UA")}` : "без кінцевої дати"}</small>{offer.moderation_comment ? <em>{offer.moderation_comment}</em> : null}</div>
          <div className="gt-partner-offer-card__actions"><button type="button" onClick={()=>edit(offer)}><Edit3 size={17}/></button><button type="button" onClick={()=>void remove(offer)}><Trash2 size={17}/></button></div>
        </article>)}
        {loading ? <div className="gt-services-empty">Завантажуємо пропозиції…</div> : null}
        {!loading && !offers.length ? <div className="gt-services-empty">Ви ще не створили жодної пропозиції.</div> : null}
      </section>
    </main>
    <PartnerBottomNav active="home" activated navigate={navigate}/>
  </div>;
}


function usePartnerServices() {
  const [services, setServices] = useState<PartnerService[]>(defaultServices);

  useEffect(() => {
    setServices(readPartnerServices());
  }, []);

  const updateServices = (next: PartnerService[] | ((current: PartnerService[]) => PartnerService[])) => {
    setServices((current) => {
      const value = typeof next === "function" ? next(current) : next;
      savePartnerServices(value);
      return value;
    });
  };

  return { services, setServices: updateServices };
}

function ServiceSwitch({ checked, onChange, disabled = false }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`gt-service-switch ${checked ? "is-on" : ""}`}
      aria-pressed={checked}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
    >
      <span />
    </button>
  );
}

function serviceIconFor(category: string) {
  if (category.includes("Харч")) return UtensilsCrossed;
  if (category.includes("SPA") || category.includes("Сауна")) return Waves;
  if (category.includes("Паркінг")) return CircleParking;
  if (category.includes("Трансфер")) return LogIn;
  if (category.includes("Актив")) return Bike;
  return Hotel;
}

function ServiceThumbnail({ service }: { service: PartnerService }) {
  if (service.image) {
    return <img className="gt-service-thumbnail" src={service.image} alt="" />;
  }
  const Icon = serviceIconFor(service.category);
  return (
    <span className="gt-service-thumbnail gt-service-thumbnail--icon">
      <Icon size={21} />
    </span>
  );
}

function ServicesScreen({ navigate }: { navigate: Navigate }) {
  const { services, setServices } = usePartnerServices();
  const activated = readPartnerActivated();
  const [audience, setAudience] = useState<PartnerServiceAudience>("hotel");
  const visibleServices = services.filter((service) => !service.hidden && service.audience === audience);
  const hiddenServices = services.filter((service) => service.hidden);

  const openEdit = (service: PartnerService) => {
    window.localStorage.setItem(SERVICE_SELECTED_STORAGE_KEY, service.id);
    navigate("partner", "partner-service-edit");
  };

  const startAdd = () => {
    saveServiceDraft({ ...emptyServiceDraft, audience });
    navigate("partner", "partner-service-add");
  };

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-services-page">
      <PartnerHeader title="Послуги закладу" navigate={navigate} back={activated ? "partner-dashboard" : "partner-info"} />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-services-content">
        <button type="button" className="gt-services-add-link" onClick={startAdd}>
          <Plus size={17} /> Додати послугу
        </button>

        <div className="gt-services-tabs" role="tablist">
          <button type="button" className={audience === "hotel" ? "is-active" : ""} onClick={() => setAudience("hotel")}>
            Для гостей закладу
          </button>
          <button type="button" className={audience === "all" ? "is-active" : ""} onClick={() => setAudience("all")}>
            Для всіх гостей
          </button>
        </div>

        <section className="gt-services-list">
          {visibleServices.map((service) => (
            <div
              className="gt-service-list-row"
              key={service.id}
              role="button"
              tabIndex={0}
              onClick={() => openEdit(service)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") openEdit(service);
              }}
            >
              <ServiceThumbnail service={service} />
              <span className="gt-service-list-row__copy">
                <strong>{service.name}</strong>
                <small>{service.scheduleLabel || service.description}</small>
              </span>
              <ServiceSwitch
                checked={service.active}
                onChange={(active) => setServices((current) => current.map((item) => item.id === service.id ? { ...item, active } : item))}
              />
              <GripVertical className="gt-service-drag" size={17} />
            </div>
          ))}
        </section>

        <button type="button" className="gt-hidden-services-row" onClick={() => navigate("partner", "partner-services-hidden")}>
          <span>Приховані послуги ({hiddenServices.length})</span>
          <ChevronRight size={17} />
        </button>
      </main>
      <PartnerBottomNav active={activated ? "home" : "info"} activated={activated} navigate={navigate} />
    </div>
  );
}

function HiddenServicesScreen({ navigate }: { navigate: Navigate }) {
  const { services, setServices } = usePartnerServices();
  const hiddenServices = services.filter((service) => service.hidden);

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-services-page">
      <PartnerHeader title="Сховані послуги" navigate={navigate} back="partner-services" />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-services-content">
        <section className="gt-services-list gt-services-list--compact">
          {hiddenServices.map((service) => (
            <div className="gt-service-list-row" key={service.id}>
              <ServiceThumbnail service={service} />
              <span className="gt-service-list-row__copy">
                <strong>{service.name}</strong>
                <small>{service.scheduleLabel || service.description}</small>
              </span>
              <ServiceSwitch
                checked={!service.hidden}
                onChange={() => setServices((current) => current.map((item) => item.id === service.id ? { ...item, hidden: false, active: true } : item))}
              />
            </div>
          ))}
          {hiddenServices.length === 0 ? <div className="gt-services-empty">Немає схованих послуг</div> : null}
        </section>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}

function ServiceRadioCard({
  title,
  description,
  checked,
  onClick,
}: {
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`gt-service-radio-card ${checked ? "is-selected" : ""}`} onClick={onClick}>
      <span className="gt-service-radio-dot">{checked ? <i /> : null}</span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}

function ServiceField({
  label,
  value,
  placeholder,
  onChange,
  multiline = false,
  counter,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  counter?: number;
}) {
  return (
    <label className={`gt-service-field ${multiline ? "is-multiline" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} placeholder={placeholder} maxLength={counter} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} placeholder={placeholder} maxLength={counter} onChange={(event) => onChange(event.target.value)} />
      )}
      {counter ? <small>{value.length}/{counter}</small> : null}
    </label>
  );
}

function ServiceSelectRow({ label, value, placeholder, onClick }: { label: string; value: string; placeholder: string; onClick: () => void }) {
  return (
    <button type="button" className="gt-service-select-row" onClick={onClick}>
      <span>
        <small>{label}</small>
        <strong className={!value ? "is-placeholder" : ""}>{value || placeholder}</strong>
      </span>
      <ChevronRight size={17} />
    </button>
  );
}

function AddServiceScreen({ navigate }: { navigate: Navigate }) {
  const [draft, setDraft] = useState<PartnerService>(emptyServiceDraft);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    setDraft(readServiceDraft());
  }, []);

  useEffect(() => {
    saveServiceDraft(draft);
  }, [draft]);

  const save = () => {
    const services = readPartnerServices();
    const id = `service-${Date.now()}`;
    const next: PartnerService = {
      ...draft,
      id,
      name: draft.name.trim() || "Нова послуга",
      category: draft.category || "Додаткові послуги",
      scheduleLabel: draft.scheduleLabel || "Щодня",
      image: preview || draft.image,
    };
    savePartnerServices([...services, next]);
    window.localStorage.removeItem(SERVICE_DRAFT_STORAGE_KEY);
    window.localStorage.setItem(SERVICE_SELECTED_STORAGE_KEY, id);
    navigate("partner", "partner-services");
  };

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-service-editor-page">
      <PartnerHeader title="Додати послугу" navigate={navigate} back="partner-services" backLabel="Скасувати" nextLabel="Зберегти" onNext={save} />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-service-editor-content">
        <h3 className="gt-service-section-title">Основна інформація</h3>

        <label className="gt-service-photo-add">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : "");
              reader.readAsDataURL(file);
            }}
          />
          {preview ? <img src={preview} alt="Фото послуги" /> : <Camera size={24} />}
          <span>
            <strong>Додайте фото</strong>
            <small>Додайте одне або більше фото послуги</small>
          </span>
        </label>

        <ServiceField label="Назва послуги" value={draft.name} counter={100} onChange={(name) => setDraft((current) => ({ ...current, name }))} />
        <ServiceSelectRow label="Категорія" value={draft.category} placeholder="Оберіть категорію" onClick={() => navigate("partner", "partner-service-category")} />
        <ServiceField label="Опис послуги" value={draft.description} counter={500} multiline onChange={(description) => setDraft((current) => ({ ...current, description }))} />

        <h3 className="gt-service-section-title">Тип послуги</h3>
        <div className="gt-service-radio-stack">
          <ServiceRadioCard
            title="Для гостей закладу"
            description="Доступна лише для тих, хто проживає у вашому закладі"
            checked={draft.audience === "hotel"}
            onClick={() => setDraft((current) => ({ ...current, audience: "hotel" }))}
          />
          <ServiceRadioCard
            title="Для всіх гостей"
            description="Послуга буде показана всім користувачам Gid Tourist"
            checked={draft.audience === "all"}
            onClick={() => setDraft((current) => ({ ...current, audience: "all" }))}
          />
        </div>

        <h3 className="gt-service-section-title">Ціна послуги</h3>
        <ServiceSelectRow
          label="Тип ціни"
          value={priceTypeLabel(draft.priceType)}
          placeholder="Оберіть тип ціни"
          onClick={() => navigate("partner", "partner-service-price-type")}
        />
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}

function priceTypeLabel(type: PartnerServicePriceType) {
  const labels: Record<PartnerServicePriceType, string> = {
    "": "",
    free: "Безкоштовно",
    fixed: "Фіксована ціна",
    from: "Від",
    range: "Діапазон цін",
    request: "За запитом",
  };
  return labels[type];
}

const serviceCategories = [
  ["Харчування", UtensilsCrossed],
  ["Сауна та SPA", Waves],
  ["Активний відпочинок", Bike],
  ["Трансфер", LogIn],
  ["Паркінг", CircleParking],
  ["Додаткові послуги", Sparkles],
] as const;

function CategorySelectScreen({ navigate }: { navigate: Navigate }) {
  const select = (category: string) => {
    const draft = readServiceDraft();
    saveServiceDraft({ ...draft, category });
    navigate("partner", "partner-service-add");
  };

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-service-options-page">
      <PartnerHeader title="Категорія послуги" navigate={navigate} back="partner-service-add" />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-service-options-content">
        <section className="gt-service-option-list">
          {serviceCategories.map(([category, Icon]) => (
            <button type="button" key={category} onClick={() => select(category)}>
              <Icon size={19} />
              <span>{category}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </section>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}

const priceTypeOptions: Array<[PartnerServicePriceType, string, string]> = [
  ["free", "Безкоштовно", "Послуга надається безкоштовно"],
  ["fixed", "Фіксована ціна", "Одна ціна за всю послугу"],
  ["from", "Від", "Вкажіть ціну від"],
  ["range", "Діапазон цін", "Вкажіть мінімальну та максимальну ціну"],
  ["request", "За запитом", "Ціна узгоджується при бронюванні"],
];

function PriceTypeScreen({ navigate }: { navigate: Navigate }) {
  const [selected, setSelected] = useState<PartnerServicePriceType>(readServiceDraft().priceType);

  const choose = (priceType: PartnerServicePriceType) => {
    setSelected(priceType);
    const draft = readServiceDraft();
    saveServiceDraft({ ...draft, priceType });
    navigate("partner", "partner-service-add");
  };

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-service-options-page">
      <PartnerHeader title="Тип ціни" navigate={navigate} back="partner-service-add" />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-service-options-content">
        <div className="gt-service-radio-stack gt-service-radio-stack--plain">
          {priceTypeOptions.map(([value, title, description]) => (
            <ServiceRadioCard key={value} title={title} description={description} checked={selected === value} onClick={() => choose(value)} />
          ))}
        </div>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}

function readSelectedService() {
  const id = typeof window === "undefined" ? "" : window.localStorage.getItem(SERVICE_SELECTED_STORAGE_KEY) || "";
  return readPartnerServices().find((service) => service.id === id) ?? { ...emptyServiceDraft };
}

function EditServiceScreen({ navigate }: { navigate: Navigate }) {
  const [service, setService] = useState<PartnerService>(() => ({ ...emptyServiceDraft }));

  useEffect(() => {
    setService(readSelectedService());
  }, []);

  const persist = (next: PartnerService) => {
    setService(next);
    savePartnerServices(readPartnerServices().map((item) => item.id === next.id ? next : item));
  };

  const save = () => {
    persist(service);
    navigate("partner", "partner-services");
  };

  const remove = () => {
    savePartnerServices(readPartnerServices().filter((item) => item.id !== service.id));
    navigate("partner", "partner-services");
  };

  const images = [service.image || "/images/service-sauna.webp", "/images/service-pool.webp", "/images/service-tub.webp"];

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-service-editor-page">
      <PartnerHeader title="Редагування послуги" navigate={navigate} back="partner-services" nextLabel="Зберегти" onNext={save} />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-service-editor-content">
        <h3 className="gt-service-section-title">Фото послуги</h3>
        <div className="gt-service-photo-grid">
          {images.map((image, index) => <img src={image} key={`${image}-${index}`} alt="" />)}
          <button type="button"><ImagePlus size={22} /><small>Додати<br />фото</small></button>
        </div>
        <p className="gt-service-photo-hint">Перетягніть фото, щоб змінити порядок</p>

        <ServiceField label="Назва послуги" value={service.name} onChange={(name) => setService((current) => ({ ...current, name }))} />
        <ServiceSelectRow label="Категорія" value={service.category} placeholder="Оберіть категорію" onClick={() => {
          savePartnerServices(readPartnerServices().map((item) => item.id === service.id ? service : item));
          navigate("partner", "partner-service-edit-category");
        }} />
        <ServiceField label="Опис послуги" value={service.description} multiline counter={500} onChange={(description) => setService((current) => ({ ...current, description }))} />

        <h3 className="gt-service-section-title">Тип послуги</h3>
        <div className="gt-service-radio-stack">
          <ServiceRadioCard title="Для гостей закладу" description="Доступна лише для тих, хто проживає у вашому закладі" checked={service.audience === "hotel"} onClick={() => setService((current) => ({ ...current, audience: "hotel" }))} />
          <ServiceRadioCard title="Для всіх гостей" description="Послуга буде показана всім користувачам Gid Tourist" checked={service.audience === "all"} onClick={() => setService((current) => ({ ...current, audience: "all" }))} />
        </div>

        <div className="gt-service-toggle-block">
          <span><strong>Реклама послуги</strong><small>Показувати послугу всім користувачам Gid Tourist</small></span>
          <ServiceSwitch checked={service.promo} onChange={(promo) => setService((current) => ({ ...current, promo }))} />
        </div>

        <h3 className="gt-service-section-title">Ціна послуги</h3>
        <ServiceSelectRow label="Тип ціни" value={priceTypeLabel(service.priceType)} placeholder="Оберіть тип ціни" onClick={() => {
          savePartnerServices(readPartnerServices().map((item) => item.id === service.id ? service : item));
          saveServiceDraft(service);
          navigate("partner", "partner-service-edit-price-type");
        }} />
        {service.priceType !== "free" && service.priceType !== "request" ? (
          <div className="gt-service-inline-fields">
            <ServiceField label="Ціна" value={service.price} onChange={(price) => setService((current) => ({ ...current, price }))} />
            <ServiceField label="Валюта" value={service.currency} onChange={(currency) => setService((current) => ({ ...current, currency }))} />
          </div>
        ) : null}

        <h3 className="gt-service-section-title">Графік роботи</h3>
        <ServiceSelectRow label="Тип графіку" value={service.scheduleType === "daily" ? "Щодня" : service.scheduleType === "weekdays" ? "По днях тижня" : "Вибрані дні"} placeholder="Оберіть графік" onClick={() => {
          savePartnerServices(readPartnerServices().map((item) => item.id === service.id ? service : item));
          saveServiceDraft(service);
          navigate("partner", "partner-service-schedule-type");
        }} />
        <div className="gt-service-inline-fields">
          <ServiceField label="Час роботи" value={service.timeFrom} onChange={(timeFrom) => setService((current) => ({ ...current, timeFrom }))} />
          <ServiceField label="До" value={service.timeTo} onChange={(timeTo) => setService((current) => ({ ...current, timeTo }))} />
        </div>
        {service.breaks?.map((item, index) => (
          <div className="gt-service-break-row" key={`${item.from}-${item.to}-${index}`}>
            <span>Перерва {item.from} – {item.to}</span>
            <button type="button" onClick={() => setService((current) => ({ ...current, breaks: current.breaks?.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={14} /></button>
          </div>
        ))}
        <button type="button" className="gt-service-add-subrow" onClick={() => {
          savePartnerServices(readPartnerServices().map((item) => item.id === service.id ? service : item));
          saveServiceDraft(service);
          navigate("partner", "partner-service-break");
        }}><Plus size={15} /> Додати перерву</button>

        <h3 className="gt-service-section-title">Контакти для бронювання</h3>
        <ServiceField label="Телефон" value={service.phone} onChange={(phone) => setService((current) => ({ ...current, phone }))} />
        <ServiceField label="Додатковий телефон" value={service.extraPhone} onChange={(extraPhone) => setService((current) => ({ ...current, extraPhone }))} />
        <ServiceField label="Email" value={service.email} onChange={(email) => setService((current) => ({ ...current, email }))} />
        <ServiceField label="Як забронювати" value={service.bookingNote} multiline counter={200} onChange={(bookingNote) => setService((current) => ({ ...current, bookingNote }))} />
        <ServiceField label="Додаткова інформація" value={service.additionalInfo} multiline counter={300} onChange={(additionalInfo) => setService((current) => ({ ...current, additionalInfo }))} />

        <h3 className="gt-service-section-title">Зручності</h3>
        <div className="gt-service-chips">
          {service.amenities.map((amenity) => (
            <button type="button" key={amenity} onClick={() => setService((current) => ({ ...current, amenities: current.amenities.filter((item) => item !== amenity) }))}>{amenity} ×</button>
          ))}
        </div>
        <button type="button" className="gt-service-add-subrow" onClick={() => setService((current) => ({ ...current, amenities: current.amenities.includes("Wi‑Fi") ? current.amenities : [...current.amenities, "Wi‑Fi"] }))}><Plus size={15} /> Додати зручність</button>

        <h3 className="gt-service-section-title">Статус послуги</h3>
        <div className="gt-service-status-list">
          <div><span><strong>Активна</strong></span><ServiceSwitch checked={service.active} onChange={(active) => setService((current) => ({ ...current, active }))} /></div>
          <div><span><strong>Приховати послугу</strong><small>Послуга не буде відображатися гостям</small></span><ServiceSwitch checked={service.hidden} onChange={(hidden) => setService((current) => ({ ...current, hidden }))} /></div>
        </div>

        <button type="button" className="gt-service-delete" onClick={remove}><Trash2 size={16} /> Видалити послугу</button>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}


function EditCategorySelectScreen({ navigate }: { navigate: Navigate }) {
  const selectedService = readSelectedService();
  const select = (category: string) => {
    const current = readSelectedService();
    const next = { ...current, category };
    savePartnerServices(readPartnerServices().map((item) => item.id === next.id ? next : item));
    navigate("partner", "partner-service-edit");
  };

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-service-options-page">
      <PartnerHeader title="Категорія послуги" navigate={navigate} back="partner-service-edit" />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-service-options-content">
        <section className="gt-service-option-list">
          {serviceCategories.map(([category, Icon]) => (
            <button type="button" key={category} className={selectedService.category === category ? "is-selected" : ""} onClick={() => select(category)}>
              <Icon size={19} />
              <span>{category}</span>
              {selectedService.category === category ? <span className="gt-service-option-check">✓</span> : <ChevronRight size={16} />}
            </button>
          ))}
        </section>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}

function EditPriceTypeScreen({ navigate }: { navigate: Navigate }) {
  const draft = readServiceDraft();
  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-service-options-page">
      <PartnerHeader title="Тип ціни" navigate={navigate} back="partner-service-edit" />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-service-options-content">
        <div className="gt-service-radio-stack gt-service-radio-stack--plain">
          {priceTypeOptions.map(([value, title, description]) => (
            <ServiceRadioCard key={value} title={title} description={description} checked={draft.priceType === value} onClick={() => {
              const selected = readSelectedService();
              const next = { ...selected, priceType: value };
              savePartnerServices(readPartnerServices().map((item) => item.id === next.id ? next : item));
              navigate("partner", "partner-service-edit");
            }} />
          ))}
        </div>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}

const scheduleTypeOptions: Array<[PartnerServiceScheduleType, string, string]> = [
  ["daily", "Щодня", "Один графік на кожен день"],
  ["weekdays", "По днях тижня", "Графік окремо для буднів та вихідних"],
  ["custom", "Вибрані дні", "Налаштувати індивідуально"],
];

function ScheduleTypeScreen({ navigate }: { navigate: Navigate }) {
  const selectedService = readSelectedService();
  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-service-options-page">
      <PartnerHeader title="Тип графіку" navigate={navigate} back="partner-service-edit" />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-service-options-content">
        <div className="gt-service-radio-stack gt-service-radio-stack--plain">
          {scheduleTypeOptions.map(([value, title, description]) => (
            <ServiceRadioCard key={value} title={title} description={description} checked={selectedService.scheduleType === value} onClick={() => {
              const current = readSelectedService();
              const next = { ...current, scheduleType: value, scheduleLabel: value === "daily" ? `Щодня · з ${current.timeFrom} до ${current.timeTo}` : title };
              savePartnerServices(readPartnerServices().map((item) => item.id === next.id ? next : item));
              navigate("partner", "partner-service-edit");
            }} />
          ))}
        </div>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}

function ServiceBreakScreen({ navigate }: { navigate: Navigate }) {
  const [from, setFrom] = useState("14:00");
  const [to, setTo] = useState("15:00");
  return (
    <div className="gt-partner-mobile-screen has-bottom-nav is-service-options-page">
      <PartnerHeader title="Додати перерву" navigate={navigate} back="partner-service-edit" nextLabel="Зберегти" onNext={() => {
        const current = readSelectedService();
        const next = { ...current, breaks: [...(current.breaks ?? []), { from, to }] };
        savePartnerServices(readPartnerServices().map((item) => item.id === next.id ? next : item));
        navigate("partner", "partner-service-edit");
      }} />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-service-options-content">
        <ServiceSelectRow label="Час початку" value={from} placeholder="14:00" onClick={() => setFrom(from === "14:00" ? "13:00" : "14:00")} />
        <ServiceSelectRow label="Час закінчення" value={to} placeholder="15:00" onClick={() => setTo(to === "15:00" ? "16:00" : "15:00")} />
        <button type="button" className="gt-service-delete gt-service-delete--plain"><Trash2 size={15} /> Видалити перерву</button>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}

function TimeSelectRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: string;
  onToggle?: () => void;
}) {
  return (
    <button type="button" className="gt-stay-time-row" onClick={onToggle}>
      <span>{label}</span>
      <div>
        <b>{value}</b>
        <ChevronRight size={14} />
      </div>
    </button>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="gt-stay-time-toggle-row">
      <span>{label}</span>
      <button type="button" className={`gt-switch ${enabled ? "is-on" : ""}`} onClick={onToggle} aria-label={label}>
        <i />
      </button>
    </div>
  );
}

type PartnerResource = {id:string;name:string;price:number;duration_minutes:number;capacity:number;active:boolean};
type PartnerBooking = {id:string;resource_id:string;resource_name:string;client_name:string;phone:string|null;starts_at:string;party_size:number;status:string;comment:string;source:string};
function PartnerBookingsScreen({ navigate }: { navigate: Navigate }) {
  const placeId=typeof window!=='undefined'?window.localStorage.getItem(PARTNER_STAGE2_PLACE_KEY)||'':'';
  const [resources,setResources]=useState<PartnerResource[]>([]);
  const [bookings,setBookings]=useState<PartnerBooking[]>([]);
  const [name,setName]=useState('');const [capacity,setCapacity]=useState('4');const [duration,setDuration]=useState('60');const [price,setPrice]=useState('0');
  const [selectedResource,setSelectedResource]=useState('');const [clientName,setClientName]=useState('');const [phone,setPhone]=useState('');
  const [date,setDate]=useState(()=>new Date(Date.now()+86400000).toISOString().slice(0,10));const [time,setTime]=useState('12:00');
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  const reload=async()=>{if(!placeId)return;try{const [r,b]=await Promise.all([stage2Fetch<PartnerResource[]>(`/partner/resources/${encodeURIComponent(placeId)}`),stage2Fetch<PartnerBooking[]>(`/bookings?place_id=${encodeURIComponent(placeId)}`)]);setResources(r);setBookings(b);if(!selectedResource&&r[0])setSelectedResource(r[0].id);}catch(e){setMessage(e instanceof Error?e.message:'Помилка завантаження');}};
  useEffect(()=>{void reload();},[placeId]);
  const createResource=async()=>{setBusy(true);setMessage('');try{await stage2Fetch('/partner/resources',{method:'POST',body:JSON.stringify({place_id:placeId,name,capacity:Number(capacity),duration_minutes:Number(duration),price:Number(price)})});setName('');await reload();setMessage('Ресурс збережено');}catch(e){setMessage(e instanceof Error?e.message:'Не вдалося зберегти');}finally{setBusy(false);}};
  const updateStatus=async(id:string,status:string)=>{setBusy(true);try{await stage2Fetch(`/bookings/${encodeURIComponent(id)}/status`,{method:'PATCH',body:JSON.stringify({status})});await reload();}catch(e){setMessage(e instanceof Error?e.message:'Не вдалося оновити статус');}finally{setBusy(false);}};
  const addManual=async()=>{setBusy(true);try{await stage2Fetch('/partner/bookings/manual',{method:'POST',body:JSON.stringify({resource_id:selectedResource,client_name:clientName,phone,party_size:1,starts_at:new Date(`${date}T${time}:00+03:00`).toISOString()})});setMessage('Ручний запис додано');setClientName('');await reload();}catch(e){setMessage(e instanceof Error?e.message:'Слот зайнятий');}finally{setBusy(false);}};
  return <div className="gt-partner-mobile-screen has-bottom-nav"><PartnerHeader title="Бронювання і ресурси" navigate={navigate} back="partner-cabinet"/>
    <main className="gt-partner-mobile-content gt-partner-form-page" style={{display:'grid',gap:18}}>
      <FormCard><h3>Ресурси для бронювання</h3>{resources.map(r=><div key={r.id} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #e4e9e6'}}><span>{r.name}</span><strong>{Number(r.price)} ₴ · {r.duration_minutes} хв</strong></div>)}
        <h4>Додати ресурс</h4><InputRow label="Назва (чан №1, столик, номер...)" value={name} onChange={setName}/><InputRow label="Місткість" value={capacity} onChange={setCapacity}/><InputRow label="Тривалість (хв)" value={duration} onChange={setDuration}/><InputRow label="Ціна (₴)" value={price} onChange={setPrice}/>
        <button className="gt-partner-primary-button" type="button" disabled={busy||!name.trim()} onClick={()=>void createResource()}>Додати ресурс</button></FormCard>
      <FormCard><h3>Календар і заявки</h3>{bookings.length===0?<p>Заявок поки немає.</p>:bookings.map(b=><div key={b.id} style={{display:'grid',gap:7,padding:'12px 0',borderBottom:'1px solid #e4e9e6'}}><strong>{b.resource_name} · {new Date(b.starts_at).toLocaleString('uk-UA')}</strong><span>{b.client_name||'Гість'} · {b.phone||'без телефону'} · {b.party_size} ос.</span><span>Статус: {b.status}</span>{b.comment?<small>{b.comment}</small>:null}{['new','pending_partner','alternative_proposed'].includes(b.status)?<div style={{display:'flex',gap:8}}><button type="button" disabled={busy} onClick={()=>void updateStatus(b.id,'confirmed')}>Підтвердити</button><button type="button" disabled={busy} onClick={()=>void updateStatus(b.id,'cancelled_by_partner')}>Відхилити</button></div>:null}{b.status==='confirmed'?<button type="button" disabled={busy} onClick={()=>void updateStatus(b.id,'completed')}>Позначити як завершене</button>:null}</div>)}</FormCard>
      <FormCard><h3>Ручне бронювання</h3><label>Ресурс <select value={selectedResource} onChange={e=>setSelectedResource(e.target.value)}>{resources.map(r=><option value={r.id} key={r.id}>{r.name}</option>)}</select></label><InputRow label="Імʼя клієнта" value={clientName} onChange={setClientName}/><InputRow label="Контакт" value={phone} onChange={setPhone}/><label>Дата <input type="date" value={date} min={new Date().toISOString().slice(0,10)} onChange={e=>setDate(e.target.value)}/></label><label>Час <input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><button className="gt-partner-primary-button" type="button" disabled={busy||!selectedResource} onClick={()=>void addManual()}>Зберегти ручний запис</button></FormCard>
      {message?<p role="status">{message}</p>:null}
    </main><PartnerBottomNav active="home" activated navigate={navigate}/></div>;
}

function CheckInScreen({ navigate }: { navigate: Navigate }) {
  const { profile, setProfile } = usePartnerProfile();
  const [earlyEnabled, setEarlyEnabled] = useState(true);
  const [lateEnabled, setLateEnabled] = useState(true);
  const [earlyTime, setEarlyTime] = useState("08:00");
  const [lateTime, setLateTime] = useState("18:00");

  const checkIn = profile.checkIn.replace("Поселення з ", "") || "14:00";
  const checkOut = profile.checkOut.replace("Виселення до ", "") || "11:00";

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav gt-stay-time-screen">
      <PartnerHeader
        title="Час заїзду-виїзду"
        navigate={navigate}
        back="partner-dashboard"
        nextLabel="Зберегти"
        onNext={() => navigate("partner", "partner-dashboard")}
      />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-stay-time-content">
        <section className="gt-stay-time-card">
          <TimeSelectRow
            label="Час заїзду"
            value={checkIn}
            onToggle={() => setProfile((prev) => ({ ...prev, checkIn: checkIn === "14:00" ? "Поселення з 15:00" : "Поселення з 14:00" }))}
          />
          <TimeSelectRow
            label="Час виїзду"
            value={checkOut}
            onToggle={() => setProfile((prev) => ({ ...prev, checkOut: checkOut === "11:00" ? "Виселення до 12:00" : "Виселення до 11:00" }))}
          />
          <ToggleRow label={"Ранній заїзд\n(за можливості)"} enabled={earlyEnabled} onToggle={() => setEarlyEnabled((prev) => !prev)} />
          <TimeSelectRow label="Час" value={earlyTime} onToggle={() => setEarlyTime((prev) => prev === "08:00" ? "09:00" : "08:00")} />
          <ToggleRow label={"Пізній виїзд\n(за можливості)"} enabled={lateEnabled} onToggle={() => setLateEnabled((prev) => !prev)} />
          <TimeSelectRow label="Час" value={lateTime} onToggle={() => setLateTime((prev) => prev === "18:00" ? "19:00" : "18:00")} />
        </section>

        <div className="gt-stay-time-note">
          <strong>Інформація для гостей</strong>
          <p>Бронювання номера діє з часу заселення до часу виїзду, вказаного вище.</p>
        </div>
      </main>
      <PartnerBottomNav active="home" activated navigate={navigate} />
    </div>
  );
}

type ScannedCustomer = {customer_name:string;place_name:string;balance:number;expires_at:string};
type PendingPartnerPurchase = {id:string;amount:number;spent:number;earned:number;cash_due:number;status:string};
function ScannerScreen({ navigate }: { navigate: Navigate }) {
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const [cameraReady,setCameraReady]=useState(false);
  const [cameraMessage,setCameraMessage]=useState('');
  const [token,setToken]=useState('');
  const [customer,setCustomer]=useState<ScannedCustomer|null>(null);
  const [purchase,setPurchase]=useState<PendingPartnerPurchase|null>(null);
  const [amount,setAmount]=useState('');
  const [spend,setSpend]=useState('0');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const placeId=typeof window!=='undefined'?window.localStorage.getItem(PARTNER_STAGE2_PLACE_KEY)||'':'';
  useEffect(()=>{
    let stream:MediaStream|null=null,cancelled=false;
    const open=async()=>{try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('Камера недоступна у цьому браузері');stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});if(cancelled){stream.getTracks().forEach(t=>t.stop());return;}if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play();setCameraReady(true);setCameraMessage('');}}catch(e){setCameraReady(false);setCameraMessage(e instanceof Error?e.message:'Не вдалося відкрити камеру');}};
    void open();return()=>{cancelled=true;stream?.getTracks().forEach(t=>t.stop());};
  },[]);
  useEffect(()=>{
    if(!cameraReady||customer)return;
    let stopped=false;
    let timer:ReturnType<typeof setInterval>|null=null;
    const browser=window as Window & {BarcodeDetector?:new(options:{formats:string[]})=>{detect:(source:HTMLVideoElement)=>Promise<Array<{rawValue:string}>>};jsQR?:(pixels:Uint8ClampedArray,width:number,height:number,options?:Record<string,string>)=>{data:string}|null};
    const accept=(value:string)=>{if(value.startsWith('gt_')&&!stopped){setToken(value);setCameraMessage('QR-код розпізнано');if(timer)clearInterval(timer);}};
    const start=async()=>{
      const video=videoRef.current;
      if(!video)return;
      if(browser.BarcodeDetector){
        const detector=new browser.BarcodeDetector({formats:['qr_code']});let busy=false;
        timer=setInterval(()=>{if(stopped||busy||!video.videoWidth)return;busy=true;
          void detector.detect(video).then(codes=>accept(codes[0]?.rawValue||'')).catch(()=>undefined).finally(()=>{busy=false;});
        },250);
        return;
      }
      // Older Telegram WebViews lack BarcodeDetector. Keep the same in-page camera and decode frames.
      if(!browser.jsQR){
        const id='gt-qr-decoder-jsqr';
        let script=document.getElementById(id) as HTMLScriptElement|null;
        if(!script){script=document.createElement('script');script.id=id;script.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';script.async=true;document.head.appendChild(script);}
        try{await new Promise<void>((resolve,reject)=>{if(browser.jsQR){resolve();return;}script!.addEventListener('load',()=>resolve(),{once:true});script!.addEventListener('error',()=>reject(new Error('QR-декодер недоступний. Перевірте інтернет-з’єднання')),{once:true});});}
        catch(error){if(!stopped)setCameraMessage(error instanceof Error?error.message:'Не вдалося завантажити QR-декодер');return;}
      }
      if(stopped||!browser.jsQR)return;
      const canvas=document.createElement('canvas');const context=canvas.getContext('2d',{willReadFrequently:true});
      timer=setInterval(()=>{if(stopped||!context||!video.videoWidth||!video.videoHeight)return;
        // Downscale to reduce battery use on phones while preserving QR patterns.
        const scale=Math.min(1,640/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
        try{context.drawImage(video,0,0,canvas.width,canvas.height);const pixels=context.getImageData(0,0,canvas.width,canvas.height);
          accept(browser.jsQR?.(pixels.data,canvas.width,canvas.height,{inversionAttempts:'attemptBoth'})?.data||'');}
        catch{/* keep scanning */}
      },240);
    };
    void start();
    return()=>{stopped=true;if(timer)clearInterval(timer);};
  },[cameraReady,customer]);
  useEffect(()=>{if(!token.startsWith('gt_')||!placeId||customer)return;let cancelled=false;
    void stage2Fetch<ScannedCustomer>('/partner/scan/resolve',{method:'POST',body:JSON.stringify({place_id:placeId,token})})
      .then(x=>{if(!cancelled){setCustomer(x);setError('');}}).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'QR недійсний');});
    return()=>{cancelled=true;};
  },[token,placeId,customer]);
  const sendQuote=async()=>{if(!customer||!placeId)return;setBusy(true);setError('');try{
    const result=await stage2Fetch<PendingPartnerPurchase>('/transactions/quote',{method:'POST',body:JSON.stringify({place_id:placeId,token,amount:Number(amount),spend:Number(spend),idempotency_key:`${token.slice(0,18)}-${amount}-${spend}`})});setPurchase(result);
  }catch(e){setError(e instanceof Error?e.message:'Не вдалося створити операцію');}finally{setBusy(false);}};
  const checkStatus=async()=>{if(!purchase)return;try{const list=await stage2Fetch<PendingPartnerPurchase[]>(`/transactions?place_id=${encodeURIComponent(placeId)}`);const match=list.find(x=>x.id===purchase.id);if(match)setPurchase(match);}catch(e){setError(String(e));}};
  const reset=()=>{setToken('');setCustomer(null);setPurchase(null);setAmount('');setSpend('0');setError('');};
  return <div className="gt-qr-scanner-screen">
    <video ref={videoRef} className={`gt-qr-scanner-video ${cameraReady?'is-ready':''}`} muted playsInline/>
    <div className="gt-qr-scanner-shade"/>
    <header className="gt-qr-scanner-screen__header"><button type="button" onClick={()=>navigate('partner','partner-dashboard')} aria-label="Закрити"><X size={22}/></button><strong>Сканувати QR-код</strong><span/></header>
    <main className="gt-qr-scanner-screen__content"><div className="gt-qr-viewfinder"><span className="gt-qr-corner top-left"/><span className="gt-qr-corner top-right"/><span className="gt-qr-corner bottom-left"/><span className="gt-qr-corner bottom-right"/><div className="gt-qr-scan-line"/></div>
    <p>Наведіть камеру на QR-код клієнта для надання знижки або бонусу</p>
    <section style={{width:'100%',maxWidth:390,padding:18,borderRadius:20,background:'#fff',color:'#17372f',margin:'14px auto',display:'grid',gap:12,position:'relative',zIndex:8}}>
      {!customer?<><p style={{color:'#17372f'}}>{cameraMessage||(cameraReady?'Сканер активний. Наведіть камеру на QR клієнта.':'Запускаємо камеру…')}</p><details><summary style={{cursor:'pointer'}}>Ввести код вручну</summary><label>Код клієнта<input aria-label="Код QR" placeholder="gt_..." value={token} onChange={e=>setToken(e.target.value.trim())} style={{display:'block',width:'100%',padding:10,border:'1px solid #dae2dd',borderRadius:10}}/></label></details></>:<><strong>{customer.customer_name} · {customer.place_name}</strong><small>Доступно бонусів: {customer.balance}</small>{!purchase?<><label>Сума покупки, ₴<input inputMode="decimal" type="number" min="0.01" value={amount} onChange={e=>setAmount(e.target.value)} style={{display:'block',width:'100%',padding:10}}/></label><label>Списати бонусів (максимум 20% чека)<input type="number" min="0" value={spend} onChange={e=>setSpend(e.target.value)} style={{display:'block',width:'100%',padding:10}}/></label><button type="button" disabled={busy} className="gt-partner-secondary-button" onClick={()=>void sendQuote()}>Надіслати покупку клієнту</button></>:<><strong>Сума: {Number(purchase.amount)} ₴ · До сплати: {Number(purchase.cash_due)} ₴</strong><p>Статус: {purchase.status==='confirmed'?'Підтверджено клієнтом':purchase.status==='pending_customer'?'Очікує підтвердження клієнта':purchase.status}</p><button type="button" className="gt-partner-secondary-button" onClick={()=>void checkStatus()}>Оновити статус</button></> }</>}
      {error?<p role="alert" style={{color:'#b91c1c'}}>{error}</p>:null}<button type="button" onClick={reset} style={{padding:10}}>Сканувати наступний код</button>
    </section></main></div>;
}

function ProfileInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="gt-profile-info-row">
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <Edit3 size={17} />
    </div>
  );
}

function PartnerProfileScreen({ navigate }: { navigate: Navigate }) {
  const { profile } = usePartnerProfile();
  const [telegramUser, setTelegramUser] = useState<Stage2User | null>(null);

  useEffect(() => {
    let cancelled = false;
    void ensureTelegramSession().then((session) => {
      if (!cancelled && session?.user) setTelegramUser(session.user);
    });
    return () => { cancelled = true; };
  }, []);

  const fullName = [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(" ").trim()
    || (telegramUser?.telegram_username ? `@${telegramUser.telegram_username}` : "Партнер");
  const telegramLabel = telegramUser?.telegram_username
    ? `@${telegramUser.telegram_username}`
    : telegramUser?.telegram_id ? `ID ${telegramUser.telegram_id}` : "Telegram не визначено";

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav gt-partner-profile-screen">
      <main className="gt-partner-mobile-content gt-partner-form-page gt-profile-page-content">
        <section className="gt-profile-user-card">
          <div className="gt-profile-user-card__avatar">
            {telegramUser?.photo_url
              ? <img src={telegramUser.photo_url} alt={fullName} />
              : <span className="gt-profile-user-card__avatar-placeholder"><UserRound size={26} /></span>}
            <i><UserRound size={10} /></i>
          </div>
          <div className="gt-profile-user-card__copy">
            <strong>{fullName}</strong>
            <small>Партнер · {telegramLabel}</small>
          </div>
        </section>

        <section className="gt-profile-section">
          <h3>Особиста інформація</h3>
          <div className="gt-profile-section__card">
            <ProfileInfoRow label="Ім'я" value={fullName} />
            <ProfileInfoRow label="Telegram" value={telegramLabel} />
            {profile.phone ? <ProfileInfoRow label="Телефон закладу" value={profile.phone} /> : null}
            {profile.email ? <ProfileInfoRow label="Email закладу" value={profile.email} /> : null}
          </div>
        </section>

        <section className="gt-profile-section gt-profile-security-section">
          <h3>Безпека</h3>
          <div className="gt-profile-security-row"><span>Вхід через Telegram</span><ShieldCheck size={17} /></div>
        </section>

        <button type="button" className="gt-profile-logout" onClick={() => {
          setSessionToken("");
          savePartnerActivated(false);
          window.localStorage.removeItem(PARTNER_STAGE2_PLACE_KEY);
          navigate("tourist", "home");
        }}><LogOut size={17} /> Вийти з акаунту</button>
      </main>
      <PartnerBottomNav active="profile" activated navigate={navigate} />
    </div>
  );
}



type FinanceTab = "overview" | "operations" | "payments";

type FinanceOperation = {
  date: string;
  time: string;
  service: string;
  amount: string;
  commission: string;
  icon: typeof UtensilsCrossed;
  tone: string;
};

const financeOperations: FinanceOperation[] = [
  { date: "17 липня 2026", time: "14:30", service: "Ресторан", amount: "1 250 ₴", commission: "50 ₴", icon: UtensilsCrossed, tone: "green" },
  { date: "17 липня 2026", time: "13:15", service: "Сауна", amount: "2 000 ₴", commission: "80 ₴", icon: Waves, tone: "sand" },
  { date: "16 липня 2026", time: "11:40", service: "Прокат велосипедів", amount: "350 ₴", commission: "14 ₴", icon: Bike, tone: "blue" },
  { date: "15 липня 2026", time: "20:10", service: "SPA масаж", amount: "1 800 ₴", commission: "72 ₴", icon: Sparkles, tone: "mint" },
  { date: "15 липня 2026", time: "18:05", service: "Ресторан", amount: "980 ₴", commission: "39,20 ₴", icon: UtensilsCrossed, tone: "sand" },
  { date: "14 липня 2026", time: "16:30", service: "Парковка", amount: "200 ₴", commission: "8 ₴", icon: CircleParking, tone: "blue" },
  { date: "14 липня 2026", time: "15:20", service: "Пральня", amount: "150 ₴", commission: "6 ₴", icon: RefreshCcw, tone: "green" },
  { date: "13 липня 2026", time: "21:45", service: "Чан", amount: "2 500 ₴", commission: "100 ₴", icon: Waves, tone: "green" },
];

const financePayments = [
  { date: "10 липня 2026", period: "3 – 9 липня 2026", amount: "4 523 ₴" },
  { date: "3 липня 2026", period: "26 червня – 2 липня 2026", amount: "4 185 ₴" },
  { date: "26 червня 2026", period: "19 – 25 червня 2026", amount: "3 964 ₴" },
  { date: "19 червня 2026", period: "12 – 18 червня 2026", amount: "3 842 ₴" },
];

function FinanceHeader({ navigate, title = "Взаєморозрахунки" }: { navigate: Navigate; title?: string }) {
  return (
    <PartnerHeader title={title} navigate={navigate} back="partner-dashboard" />
  );
}

function FinanceTabs({ tab, onChange }: { tab: FinanceTab; onChange: (tab: FinanceTab) => void }) {
  return (
    <div className="gt-finance-tabs">
      <button type="button" className={tab === "overview" ? "is-active" : ""} onClick={() => onChange("overview")}>Огляд</button>
      <button type="button" className={tab === "operations" ? "is-active" : ""} onClick={() => onChange("operations")}>Операції</button>
      <button type="button" className={tab === "payments" ? "is-active" : ""} onClick={() => onChange("payments")}>Виплати</button>
    </div>
  );
}

function FinanceDateButton({ withFilter = false }: { withFilter?: boolean }) {
  return (
    <div className={`gt-finance-date-row ${withFilter ? "has-filter" : ""}`}>
      <button type="button" className="gt-finance-date-button">
        <CalendarDays size={17} />
        <span>10 – 17 липня 2026</span>
        <ChevronRight size={15} />
      </button>
      {withFilter ? (
        <button type="button" className="gt-finance-filter-button"><SlidersHorizontal size={16} /> Фільтри</button>
      ) : null}
    </div>
  );
}

function FinanceSparkline({ red = false }: { red?: boolean }) {
  return (
    <svg className={`gt-finance-sparkline ${red ? "is-red" : ""}`} viewBox="0 0 150 70" role="img" aria-label="Динаміка обороту">
      <polyline points="6,56 27,47 47,22 67,43 89,24 111,34 142,7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {[ [6,56], [27,47], [47,22], [67,43], [89,24], [111,34], [142,7] ].map(([cx,cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="white" stroke="currentColor" strokeWidth="3" />
      ))}
    </svg>
  );
}

function FinanceMetricCard({ label, value, note, danger = false }: { label: string; value: string; note?: string; danger?: boolean }) {
  return (
    <div className={`gt-finance-metric-card ${danger ? "is-danger" : ""}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      {note ? <span>{note}</span> : null}
    </div>
  );
}

function FinanceOverview() {
  return (
    <>
      <FinanceDateButton />
      <section className="gt-finance-turnover-card">
        <div>
          <small>Загальний оборот (через додаток)</small>
          <strong>124 560 ₴</strong>
          <span>↑ 18% до попереднього тижня</span>
        </div>
        <FinanceSparkline />
      </section>

      <div className="gt-finance-metrics-grid gt-finance-metrics-grid--three">
        <FinanceMetricCard label="Кількість операцій" value="146" />
        <FinanceMetricCard label="Нарахована комісія" value="4 982 ₴" note="4% від обороту" />
        <FinanceMetricCard label="Сплачено комісії" value="0 ₴" note="0% від нарахованої" />
      </div>

      <section className="gt-finance-period-card">
        <h3>Комісія за період</h3>
        <div><span>Загальна комісія</span><b>4 982 ₴</b></div>
        <div><span>Сплачено</span><b>0 ₴</b></div>
        <div className="is-due"><span>До сплати</span><b>4 982 ₴</b></div>
      </section>

      <section className="gt-finance-chart-card">
        <h3>Динаміка обороту та комісії</h3>
        <div className="gt-finance-chart-legend"><span><i className="is-turnover" />Оборот</span><span><i className="is-commission" />Комісія (4%)</span></div>
        <svg viewBox="0 0 330 150" role="img" aria-label="Графік обороту та комісії">
          <g className="grid">
            <line x1="22" y1="20" x2="322" y2="20"/><line x1="22" y1="60" x2="322" y2="60"/><line x1="22" y1="100" x2="322" y2="100"/><line x1="22" y1="136" x2="322" y2="136"/>
          </g>
          <polyline className="turnover" points="28,105 74,94 120,67 166,82 212,55 258,62 314,28" />
          <polyline className="commission" points="28,126 74,122 120,116 166,119 212,109 258,108 314,99" />
          {[28,74,120,166,212,258,314].map((cx, idx) => <circle key={`g-${cx}`} className="turnover-dot" cx={cx} cy={[105,94,67,82,55,62,28][idx]} r="4" />)}
          {[28,74,120,166,212,258,314].map((cx, idx) => <circle key={`b-${cx}`} className="commission-dot" cx={cx} cy={[126,122,116,119,109,108,99][idx]} r="4" />)}
        </svg>
        <div className="gt-finance-chart-days"><span>10 лип</span><span>11 лип</span><span>12 лип</span><span>13 лип</span><span>14 лип</span><span>15 лип</span><span>17 лип</span></div>
      </section>

      <div className="gt-finance-info-note"><Info size={18} /><p>Комісія нараховується автоматично за кожну підтверджену операцію через додаток.</p></div>
    </>
  );
}

function FinanceOperations() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? financeOperations : financeOperations.slice(0, 7);

  return (
    <>
      <FinanceDateButton withFilter />
      <div className="gt-finance-metrics-grid gt-finance-metrics-grid--three gt-finance-operation-metrics">
        <FinanceMetricCard label="Кількість операцій" value="146" />
        <FinanceMetricCard label="Оборот" value="124 560 ₴" />
        <FinanceMetricCard label="Комісія (4%)" value="4 982 ₴" />
      </div>

      <section className="gt-finance-history">
        <h3>Історія операцій</h3>
        <div className="gt-finance-history-head"><span>Дата і час</span><span>Послуга</span><span>Сума операції</span><span>Комісія (4%)</span></div>
        {visible.map(({ date, time, service, amount, commission, icon: Icon, tone }) => (
          <div className="gt-finance-operation-row" key={`${date}-${time}-${service}`}>
            <span className="date"><small>{date}</small><b>{time}</b></span>
            <span className="service"><i className={`tone-${tone}`}><Icon size={17} /></i><b>{service}</b></span>
            <strong>{amount}</strong>
            <strong>{commission}</strong>
          </div>
        ))}
        <button type="button" className="gt-finance-show-more" onClick={() => setShowAll((prev) => !prev)}>{showAll ? "Сховати" : "Показати ще"} <ChevronRight size={15} /></button>
      </section>
    </>
  );
}

function FinancePayments({ onConfirm }: { onConfirm: () => void }) {
  return (
    <>
      <FinanceDateButton />
      <section className="gt-finance-due-card">
        <div>
          <small>До сплати комісії</small>
          <strong>4 982 ₴</strong>
          <span>за період 10 – 17 липня 2026</span>
          <button type="button" onClick={onConfirm}>Підтвердити оплату</button>
        </div>
        <span className="gt-finance-wallet-icon"><WalletCards size={43} /></span>
      </section>

      <section className="gt-finance-payment-history">
        <h3>Історія виплат</h3>
        {financePayments.map(({ date, period, amount }) => (
          <button type="button" key={`${date}-${amount}`}>
            <span><small>{date}</small><b>Комісія за {period}</b><em>Платіжна картка **** 4242</em></span>
            <strong>{amount}<small>Сплачено</small></strong>
            <ChevronRight size={18} />
          </button>
        ))}
      </section>

      <div className="gt-finance-info-note"><Info size={18} /><p>Комісія виплачується на вашу картку автоматично щотижня після підтвердження оплати.</p></div>
    </>
  );
}

function FinanceConfirmPayment({ onBack }: { onBack: () => void }) {
  const [receiptName, setReceiptName] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="gt-partner-mobile-screen gt-finance-confirm-screen">
      <header className="gt-finance-confirm-header">
        <button type="button" onClick={onBack}><ArrowLeft size={22} /></button>
        <strong>Підтвердити оплату</strong>
        <span />
      </header>
      <main className="gt-finance-confirm-content">
        <section className="gt-finance-confirm-summary">
          <div><small>Сума до сплати</small><strong>4 982 ₴</strong><span>за період 10 – 17 липня 2026</span></div>
          <i><WalletCards size={42} /></i>
        </section>

        <section className="gt-finance-confirm-section">
          <h3>Деталі платежу</h3>
          <div className="gt-finance-payment-detail"><span><small>Комісія за період</small><b>10 – 17 липня 2026</b></span><strong>4 982 ₴</strong></div>
          <div className="gt-finance-payment-detail"><span><small>Картка для оплати</small><b>**** 4242</b></span></div>
          <div className="gt-finance-payment-detail"><span><small>Отримувач</small><b>Gid Tourist</b></span></div>
          <div className="gt-finance-payment-detail"><span><small>IBAN</small><b>UA12 3456 7890 1234 5678 9101 112</b></span></div>
          <div className="gt-finance-payment-detail"><span><small>Призначення платежу</small><b>Комісія за 10 – 17 липня 2026</b></span></div>
        </section>

        <section className="gt-finance-confirm-section">
          <h3>Сума платежу</h3>
          <div className="gt-finance-amount-input"><strong>4 982</strong><span>₴</span></div>
        </section>

        <section className="gt-finance-confirm-section">
          <h3>Квитанція про оплату</h3>
          <label className="gt-finance-upload-box">
            <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(event) => setReceiptName(event.target.files?.[0]?.name ?? "")} />
            <ImagePlus size={27} />
            <span><b>{receiptName || "Додайте файл або фото квитанції"}</b><small>{receiptName ? "Файл додано" : "PDF, JPG, PNG до 10 МБ"}</small></span>
          </label>
        </section>

        <div className="gt-finance-confirm-warning"><Info size={18} /><p>Після відправлення оплати вона буде перевірена. Статус оновиться в історії виплат.</p></div>
        <button type="button" className="gt-finance-confirm-submit" onClick={() => setSent(true)}>{sent ? "Відправлено на перевірку" : "Відправити на підтвердження"}</button>
      </main>
    </div>
  );
}

function PartnerFinanceScreen({ navigate }: { navigate: Navigate }) {
  const [tab, setTab] = useState<FinanceTab>("overview");
  const [confirming, setConfirming] = useState(false);

  if (confirming) return <FinanceConfirmPayment onBack={() => setConfirming(false)} />;

  return (
    <div className="gt-partner-mobile-screen has-bottom-nav gt-finance-screen">
      <FinanceHeader navigate={navigate} />
      <main className="gt-partner-mobile-content gt-partner-form-page gt-finance-content">
        <FinanceTabs tab={tab} onChange={setTab} />
        {tab === "overview" ? <FinanceOverview /> : null}
        {tab === "operations" ? <FinanceOperations /> : null}
        {tab === "payments" ? <FinancePayments onConfirm={() => setConfirming(true)} /> : null}
      </main>
      <PartnerBottomNav active="settlements" activated navigate={navigate} />
    </div>
  );
}

function PlaceholderScreen({
  navigate,
  title,
  description,
  icon: Icon,
  active = "home",
}: {
  navigate: Navigate;
  title: string;
  description: string;
  icon: typeof QrCode;
  active?: "home" | "info" | "stats" | "profile" | "settlements";
}) {
  return (
    <div className="gt-partner-mobile-screen has-bottom-nav">
      <PartnerHeader title={title} navigate={navigate} back="partner-dashboard" />
      <main className="gt-partner-mobile-content gt-partner-form-page">
        <div className="gt-simple-partner-section">
          <span>
            <Icon size={42} />
          </span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </main>
      <PartnerBottomNav active={active} activated navigate={navigate} />
    </div>
  );
}

function hydratePartnerProfileFromDb(place: Record<string, any>) {
  const details = place.details && typeof place.details === "object" ? place.details : {};
  const attrs = place.attributes && typeof place.attributes === "object" ? place.attributes : {};
  const work = place.work_hours && typeof place.work_hours === "object" ? place.work_hours : {};
  const daily = work.daily && typeof work.daily === "object" ? work.daily : {};
  const modules = Array.isArray(details.cabinet_modules) ? details.cabinet_modules.map(String) : [];
  const amenities = Array.isArray(attrs.amenities) ? attrs.amenities.map(String) : [];
  const rules = Array.isArray(details.rule_items) ? details.rule_items : [];
  const services = Array.isArray(details.services) ? details.services : [];
  const profile: PartnerProfile = {
    ...defaultProfile,
    placeName: String(place.name || ""),
    placeType: String(place.subcategory || "Готель"),
    categorySlug: String(place.category_slug || "hotel"),
    city: String(details.city || ""),
    regionName: String(details.region_name || ""),
    street: String(details.street || ""),
    house: String(details.house || ""),
    cityPlaceId: String(details.geo_place_ids?.city || ""),
    streetPlaceId: String(details.geo_place_ids?.street || ""),
    housePlaceId: String(details.geo_place_ids?.house || ""),
    address: String(place.address || ""),
    lat: String(place.lat ?? ""),
    lng: String(place.lng ?? ""),
    imageUrl: String(place.image_url || (Array.isArray(details.gallery) ? details.gallery[0] : "") || ""),
    logoUrl: String(details.logo_url || ""),
    description: String(place.description || ""),
    roomCount: String(details.room_count || ""),
    openedYear: String(details.opened_year || ""),
    languages: String(details.languages || ""),
    accommodationType: String(details.accommodation_type || ""),
    hasWifi: attrs.wifi === true || amenities.some((item: string) => /wi-?fi/i.test(item)),
    wifiSsid: String(details.wifi_ssid || ""),
    wifiPassword: String(details.wifi_password || ""),
    amenities,
    generalRules: Array.isArray(rules) ? rules as PartnerRule[] : [],
    phone: String(place.phone || ""),
    messenger: String(place.telegram || ""),
    email: String(details.email || ""),
    website: String(place.website || ""),
    instagram: String(details.instagram || ""),
    facebook: String(details.facebook || ""),
    workMode: work.always_open === true ? "Цілодобово" : "Щодня",
    workHours: work.always_open === true ? "00:00 - 24:00" : daily.from && daily.to ? `${daily.from} - ${daily.to}` : "",
    checkIn: details.check_in ? `Поселення з ${details.check_in}` : "",
    checkOut: details.check_out ? `Виселення до ${details.check_out}` : "",
    cancellation: String(details.cancellation || ""),
    payment: Array.isArray(details.payment_methods) ? details.payment_methods.join(", ") : String(details.payment || ""),
    otherRules: String(details.other_rules || ""),
    cabinetModules: modules,
    templateFields: details.template_fields && typeof details.template_fields === "object" ? details.template_fields : {},
  };
  savePartnerProfile(profile);
  savePartnerServices(Array.isArray(services) ? services as PartnerService[] : []);
}

export function PartnerMobileScreen({ slug, navigate }: { slug: string; navigate: Navigate }) {
  const initialLaunchAccess = useMemo(() => readPartnerLaunchAccessCache(), []);
  const [activated, setActivated] = useState(() => readPartnerActivated());
  const [inviteState, setInviteState] = useState<"checking" | "none" | "allowed" | "denied">(() => initialLaunchAccess ? "allowed" : (telegramStartParam().startsWith("partner-") ? "checking" : "none"));
  const [inviteError, setInviteError] = useState("");
  const [inviteStatus, setInviteStatus] = useState(() => initialLaunchAccess?.status || "");
  const [inviteDiagnostic, setInviteDiagnostic] = useState<PartnerAccessDiagnostic | null>(null);
  const [sessionTelegramId, setSessionTelegramId] = useState(() => initialLaunchAccess?.telegram_id || "");
  const [partnerDataReady, setPartnerDataReady] = useState(() => Boolean(initialLaunchAccess && readPartnerProfile().placeName));

  useEffect(() => {
    let cancelled = false;
    setActivated(readPartnerActivated());

    const run = async () => {
      // Partner QR access is checked only once for the current Telegram Mini App launch.
      // Internal Next.js route changes remount this screen, so restore the verified launch
      // synchronously from sessionStorage instead of flashing the access-check screen again.
      const verifiedLaunch = readPartnerLaunchAccessCache();
      if (verifiedLaunch?.place_id) {
        setSessionTelegramId(verifiedLaunch.telegram_id || "");
        setInviteStatus(verifiedLaunch.status || "draft");
        setInviteState("allowed");
        window.localStorage.setItem(PARTNER_STAGE2_PLACE_KEY, verifiedLaunch.place_id);
        window.localStorage.setItem(PARTNER_INVITE_KEY, telegramStartParam());
        if (verifiedLaunch.status === "approved") { savePartnerActivated(true); setActivated(true); }
        if (readPartnerProfile().placeName) {
          setPartnerDataReady(true);
          return;
        }
        try {
          const places = await stage2Fetch<Array<Record<string, any>>>("/partner/places");
          if (cancelled) return;
          const place = places.find((item) => String(item.id) === verifiedLaunch.place_id) ?? places[0];
          if (place?.id) hydratePartnerProfileFromDb(place);
        } catch { /* access was already verified for this launch; keep local state */ }
        if (!cancelled) setPartnerDataReady(true);
        return;
      }

      const session = await ensureTelegramSession();
      if (!session || cancelled) {
        if (!cancelled) {
          const authReason = telegramAuthLastError();
          setPartnerDataReady(true);
          setInviteState("denied");
          setInviteError(authReason ? `Не вдалося авторизуватися через Telegram: ${authReason}` : "Не вдалося авторизуватися через Telegram");
        }
        return;
      }

      const startParam = telegramStartParam();
      const telegramId = String(session.user.telegram_id ?? "");
      setSessionTelegramId(telegramId);
      const isInvite = startParam.startsWith("partner-");
      let grantedPlaceId = "";
      let grantedStatus = "";
      let usedCachedAccess = false;

      if (isInvite) {
        const cacheKey = `${PARTNER_ACCESS_SESSION_PREFIX}${startParam}`;
        let cached: PartnerLaunchAccessCache | null = null;
        try {
          const raw = window.sessionStorage.getItem(cacheKey);
          cached = raw ? JSON.parse(raw) as PartnerLaunchAccessCache : null;
        } catch { cached = null; }
        const currentLaunchKey = telegramLaunchKey();

        if (cached?.telegram_id === telegramId && cached.place_id && cached.launch_key && (!currentLaunchKey || cached.launch_key === currentLaunchKey)) {
          usedCachedAccess = true;
          grantedPlaceId = cached.place_id;
          grantedStatus = cached.status || "draft";
        } else {
          try {
            const access = await stage2Fetch<{ place_id: string; status: string }>(`/partner/access/${encodeURIComponent(startParam)}`);
            if (cancelled) return;
            grantedPlaceId = access.place_id;
            grantedStatus = access.status || "draft";
            try { window.sessionStorage.setItem(cacheKey, JSON.stringify({ telegram_id: telegramId, place_id: grantedPlaceId, status: grantedStatus, launch_key: telegramLaunchKey() })); } catch { /* ignore */ }
          } catch (error) {
            let diagnostic: PartnerAccessDiagnostic | null = null;
            try { diagnostic = await stage2Fetch<PartnerAccessDiagnostic>(`/partner/access-diagnostic/${encodeURIComponent(startParam)}`); } catch { diagnostic = null; }
            if (!cancelled) {
              setPartnerDataReady(true);
              setInviteDiagnostic(diagnostic);
              setInviteState("denied");
              setInviteError(error instanceof Error ? error.message : "Доступ за цим QR заборонений");
            }
            return;
          }
        }

        const previousPlaceId = window.localStorage.getItem(PARTNER_STAGE2_PLACE_KEY) || "";
        window.localStorage.setItem(PARTNER_STAGE2_PLACE_KEY, grantedPlaceId);
        window.localStorage.setItem(PARTNER_INVITE_KEY, startParam);
        setInviteStatus(grantedStatus);
        if (grantedStatus === "approved") { savePartnerActivated(true); setActivated(true); }
        setInviteDiagnostic(null);
        setInviteState("allowed");

        // When navigating inside the same open Mini App, use the already hydrated local profile immediately.
        // Backend access is verified once per launch/start_param and not on every internal screen.
        if (previousPlaceId === grantedPlaceId && readPartnerProfile().placeName) {
          setPartnerDataReady(true);
          if (usedCachedAccess) return;
        }
      } else {
        setInviteState("none");
      }

      try {
        const places = await stage2Fetch<Array<Record<string, any>>>("/partner/places");
        if (cancelled) return;
        const storedId = window.localStorage.getItem(PARTNER_STAGE2_PLACE_KEY);
        const targetId = grantedPlaceId || storedId || "";
        const place = places.find((item) => item.id === targetId) ?? places[0];
        const approved = place?.status === "approved";
        if (!isInvite) { savePartnerActivated(Boolean(approved)); setActivated(Boolean(approved)); }
        if (place?.id) {
          window.localStorage.setItem(PARTNER_STAGE2_PLACE_KEY, String(place.id));
          hydratePartnerProfileFromDb(place);
        }
      } catch (error) {
        if (isInvite && !cancelled) {
          setInviteError(error instanceof Error ? `Доступ підтверджено, але не вдалося оновити дані закладу: ${error.message}` : "Доступ підтверджено, але не вдалося оновити дані закладу");
        }
      } finally {
        if (!cancelled) setPartnerDataReady(true);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, []);

  const resolvedSlug = useMemo(() => {
    if (inviteState === "allowed" && !activated && (slug === "partner-dashboard" || slug === "partner-onboarding")) {
      if (inviteStatus === "pending") return "partner-pending";
      return "partner-info";
    }
    if (activated && (slug === "partner-dashboard" || slug === "partner-onboarding")) return "partner-cabinet";
    if (!activated && slug === "partner-cabinet") return inviteState === "allowed" ? "partner-info" : "partner-dashboard";
    if (slug === "partner-onboarding") return "partner-info";
    return slug;
  }, [activated, slug, inviteState, inviteStatus]);

  const activatePartner = () => {
    savePartnerActivated(true);
    setActivated(true);
  };

  if (inviteState === "checking" && telegramStartParam().startsWith("partner-")) {
    return <div className="gt-partner-mobile-screen"><main className="gt-partner-mobile-content gt-partner-form-page"><div className="gt-simple-partner-section"><RefreshCcw size={42} /><h2>Перевіряємо доступ</h2><p>Звіряємо ваш Telegram ID із партнерським QR.</p></div></main></div>;
  }
  if (inviteState === "allowed" && activated && !partnerDataReady) {
    return <div className="gt-partner-mobile-screen"><main className="gt-partner-mobile-content gt-partner-form-page"><div className="gt-simple-partner-section"><RefreshCcw size={42} /><h2>Завантажуємо кабінет</h2><p>Отримуємо актуальні дані вашого закладу з бази.</p></div></main></div>;
  }

  if (inviteState === "denied") {
    const startParam = telegramStartParam();
    const launchDiagnostic = telegramLaunchDiagnostic();
    const diagnosticText = [
      `Telegram SDK: ${launchDiagnostic.webApp ? "так" : "ні"}`,
      `initData length: ${launchDiagnostic.initDataLength}`,
      `Telegram ID launch: ${launchDiagnostic.telegramId || "не визначено"}`,
      `Auth error: ${launchDiagnostic.authError || "немає"}`,
      `Причина: ${inviteDiagnostic?.reason || inviteError || "невідома"}`,
      `Telegram ID сесії: ${inviteDiagnostic?.telegram_id || sessionTelegramId || "не визначено"}`,
      `start_param: ${inviteDiagnostic?.start_param || startParam || "не визначено"}`,
      `QR знайдено: ${inviteDiagnostic?.qr_found == null ? "невідомо" : inviteDiagnostic.qr_found ? "так" : "ні"}`,
      `QR активний: ${inviteDiagnostic?.qr_active == null ? "невідомо" : inviteDiagnostic.qr_active ? "так" : "ні"}`,
      `Тип QR: ${inviteDiagnostic?.qr_type || "не визначено"}`,
      `Заклад: ${inviteDiagnostic?.place_name || inviteDiagnostic?.place_id || "не визначено"}`,
      `Дозволені Telegram ID: ${inviteDiagnostic?.allowed_telegram_ids?.length ? inviteDiagnostic.allowed_telegram_ids.join(", ") : "список порожній / не отримано"}`,
    ].join("\n");
    return <div className="gt-partner-mobile-screen"><main className="gt-partner-mobile-content gt-partner-form-page"><div className="gt-simple-partner-section"><LockKeyhole size={42} /><h2>Доступ заборонено</h2><p>{inviteError || "Ваш Telegram ID не доданий до цього партнера."}</p><div className="gt-partner-access-diagnostics"><strong>Діагностика доступу</strong><small>Telegram SDK: {launchDiagnostic.webApp ? "підключений" : "не підключений"}</small><small>initData: {launchDiagnostic.initDataLength ? `${launchDiagnostic.initDataLength} символів` : "порожній"}</small><small>Telegram ID запуску: {launchDiagnostic.telegramId || "не визначено"}</small><small>Помилка авторизації: {launchDiagnostic.authError || "немає"}</small><small>Telegram ID сесії: {inviteDiagnostic?.telegram_id || sessionTelegramId || "не визначено"}</small><small>start_param: {inviteDiagnostic?.start_param || startParam || "не визначено"}</small><small>QR: {inviteDiagnostic?.qr_found == null ? "невідомо" : inviteDiagnostic.qr_found ? `${inviteDiagnostic.qr_type || "тип не визначено"} · ${inviteDiagnostic.qr_active ? "активний" : "вимкнений"}` : "не знайдено"}</small><small>Заклад: {inviteDiagnostic?.place_name || inviteDiagnostic?.place_id || "не визначено"}</small><small>Дозволені ID: {inviteDiagnostic?.allowed_telegram_ids?.length ? inviteDiagnostic.allowed_telegram_ids.join(", ") : "список порожній / не отримано"}</small><small>Код причини: {inviteDiagnostic?.reason || "немає відповіді diagnostic endpoint"}</small></div><button type="button" className="gt-partner-secondary-button" onClick={() => void navigator.clipboard?.writeText(diagnosticText)}>Скопіювати діагностику</button></div></main></div>;
  }

  switch (resolvedSlug) {
    case "partner-dashboard":
      return <PartnerStartScreen navigate={navigate} />;
    case "partner-info":
      return <PartnerInfoScreen navigate={navigate} activated={activated} />;
    case "partner-rules":
      return <RulesScreen navigate={navigate} activated={activated} />;
    case "partner-wifi":
      return <WifiScreen navigate={navigate} activated={activated} />;
    case "partner-contacts":
      return <ContactsScreen navigate={navigate} activated={activated} onActivate={activatePartner} />;
    case "partner-pending":
      return <PartnerPendingScreen navigate={navigate} onActivate={activatePartner} />;
    case "partner-statistics":
      return <StatisticsScreen navigate={navigate} activated={activated} />;
    case "partner-update":
      return <UpdateScreen navigate={navigate} activated={activated} />;
    case "partner-cabinet":
      return <CabinetScreen navigate={navigate} />;
    case "partner-hours":
      return <PartnerHoursScreen navigate={navigate} />;
    case "partner-offers":
      return <PartnerOffersScreen navigate={navigate} />;
    case "partner-services":
      return <ServicesScreen navigate={navigate} />;
    case "partner-services-hidden":
      return <HiddenServicesScreen navigate={navigate} />;
    case "partner-service-add":
      return <AddServiceScreen navigate={navigate} />;
    case "partner-service-category":
      return <CategorySelectScreen navigate={navigate} />;
    case "partner-service-price-type":
      return <PriceTypeScreen navigate={navigate} />;
    case "partner-service-edit":
      return <EditServiceScreen navigate={navigate} />;
    case "partner-service-edit-category":
      return <EditCategorySelectScreen navigate={navigate} />;
    case "partner-service-edit-price-type":
      return <EditPriceTypeScreen navigate={navigate} />;
    case "partner-service-schedule-type":
      return <ScheduleTypeScreen navigate={navigate} />;
    case "partner-service-break":
      return <ServiceBreakScreen navigate={navigate} />;
    case "partner-checkin":
      return <CheckInScreen navigate={navigate} />;
    case "scanner":
      return <ScannerScreen navigate={navigate} />;
    case "partner-bookings":
      return <PartnerBookingsScreen navigate={navigate} />;
    case "partner-finance":
      return <PartnerFinanceScreen navigate={navigate} />;
    case "place-editor":
      return <PartnerProfileScreen navigate={navigate} />;
    default:
      return activated ? <CabinetScreen navigate={navigate} /> : <PartnerStartScreen navigate={navigate} />;
  }
}
