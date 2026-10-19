"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  FileCheck2,
  Fingerprint,
  Gift,
  Home,
  Layers3,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  getScreen,
  roles,
  screensForRole,
  type RoleKey,
} from "../lib/navigation";
import { AmbassadorScreen, RegionalScreen } from "./screens/admin-screens";
import { AdminDesktopScreen } from "./screens/admin-desktop-screens";
import { PartnerMobileScreen } from "./screens/partner-mobile-screens";
import { TouristScreen } from "./screens/tourist-screens";
import { TouristRuntimeProvider, useTouristRuntime } from "../lib/tourist-runtime";
import { tr } from "../lib/tourist-i18n";
import { telegramStartParam, waitForTelegramWebApp } from "../lib/stage2-api";
import { Avatar, IconButton } from "./ui";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      ready: () => void;
      expand: () => void;
      setHeaderColor?: (color: string) => void;
      setBackgroundColor?: (color: string) => void;
      platform?: string;
      BackButton?: {
        show: () => void;
        hide: () => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
      };
    };
  };
};

type TelegramBackButton = NonNullable<
  NonNullable<TelegramWindow["Telegram"]>["WebApp"]
>["BackButton"];

const portalAccounts: Record<Exclude<RoleKey, "tourist">, { name: string; detail: string; initials: string }> = {
  partner: { name: "Коруна SPA", detail: "Оксана Романюк", initials: "ОР" },
  ambassador: { name: "Марія Коваль", detail: "Амбасадор", initials: "МК" },
  regional: { name: "Івано-Франківська", detail: "Регіональний адміністратор", initials: "ІФ" },
  admin: { name: "Гід туриста", detail: "Суперадміністратор", initials: "ГА" },
};

const roleIcons = {
  tourist: Compass,
  partner: Building2,
  ambassador: Sparkles,
  regional: MapPinned,
  admin: ShieldCheck,
} satisfies Record<RoleKey, typeof Compass>;

function iconForScreen(slug: string) {
  if (slug.includes("dashboard")) return LayoutDashboard;
  if (slug.includes("qr") || slug === "scanner") return QrCode;
  if (slug.includes("booking") || slug === "calendar") return CalendarDays;
  if (slug.includes("finance") || slug === "ledger" || slug === "wallet") return WalletCards;
  if (slug.includes("moderation")) return FileCheck2;
  if (slug.includes("audit")) return Fingerprint;
  if (slug.includes("analytics")) return BarChart3;
  if (slug.includes("map") || slug.includes("nearby") || slug.includes("location")) return MapPinned;
  if (slug === "home" || slug === "welcome") return Home;
  if (slug.includes("profile")) return UserRound;
  if (slug.includes("plan")) return BookOpenCheck;
  return Layers3;
}

function AddLocationIcon({ size = 23 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="2" />
      <path d="M18.5 15.5v5M16 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TouristBottomNav({
  activeSlug,
  navigate,
}: {
  activeSlug: string;
  navigate: (role: RoleKey, slug: string) => void;
}) {
  const { language } = useTouristRuntime();
  const normalizedActiveSlug = activeSlug === "welcome" ? "home" : activeSlug;
  const items = [
    ["home", tr(language, "Головна", "Home", "Główna"), Home],
    ["plan", tr(language, "Мій план", "My plan", "Mój plan"), BookOpenCheck],
    ["qr", "QR", QrCode],
    ["add-location", tr(language, "Додати локацію", "Add place", "Dodaj miejsce"), AddLocationIcon],
    ["profile", tr(language, "Профіль", "Profile", "Profil"), UserRound],
  ] as const;

  return (
    <nav className="tourist-bottom-nav" aria-label={tr(language, "Основна навігація", "Main navigation", "Nawigacja główna")}>
      {items.map(([itemSlug, label, Icon]) => (
        <button
          key={itemSlug}
          type="button"
          className={`${normalizedActiveSlug === itemSlug ? "is-active" : ""} ${itemSlug === "qr" ? "is-qr" : ""} ${itemSlug === "add-location" ? "is-add-location" : ""}`}
          onClick={() => navigate("tourist", itemSlug)}
        >
          <Icon size={23} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function ProductApplication({ role, slug }: { role: RoleKey; slug: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [telegramPlatform, setTelegramPlatform] = useState("");
  const activeScreen = getScreen(role, slug);

  useEffect(() => {
    if (role !== "tourist") return;
    let cancelled = false;
    const routePartnerInvite = async () => {
      let startParam = telegramStartParam();
      if (!startParam) {
        await waitForTelegramWebApp(350).catch(() => undefined);
        startParam = telegramStartParam();
      }
      if (cancelled) return;
      if (startParam.startsWith("partner-")) {
        router.replace(`/partner/partner-dashboard?startapp=${encodeURIComponent(startParam)}`);
      }
    };
    void routePartnerInvite();
    return () => { cancelled = true; };
  }, [role, router]);

  useEffect(() => {
    if (role !== "tourist") return;

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connectTelegram = () => {
      const webApp = (window as TelegramWindow).Telegram?.WebApp;
      if (!webApp && attempts < 20) {
        attempts += 1;
        timer = setTimeout(connectTelegram, 150);
        return;
      }

      webApp?.ready();
      webApp?.expand();
      webApp?.setHeaderColor?.("#f8fbf9");
      webApp?.setBackgroundColor?.("#f8fbf9");

      const detectedPlatform = webApp?.platform
        ?? (/Android/i.test(window.navigator.userAgent) ? "android" : "");
      setTelegramPlatform(detectedPlatform);
    };

    connectTelegram();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [role]);

  useEffect(() => {
    if (role !== "tourist") return;

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let connectedBackButton: TelegramBackButton;
    const handleBack = () => window.history.back();

    const connectBackButton = () => {
      const backButton = (window as TelegramWindow).Telegram?.WebApp?.BackButton;
      if (!backButton && attempts < 20) {
        attempts += 1;
        timer = setTimeout(connectBackButton, 150);
        return;
      }

      connectedBackButton = backButton;
      if (!backButton) return;

      if (slug === "home" || slug === "welcome") {
        backButton.hide();
        return;
      }

      backButton.onClick(handleBack);
      backButton.show();
    };

    connectBackButton();
    return () => {
      if (timer) clearTimeout(timer);
      connectedBackButton?.offClick(handleBack);
    };
  }, [role, slug]);

  const navigate = (nextRole: RoleKey, nextSlug: string) => {
    const screen = getScreen(nextRole, nextSlug);
    setMenuOpen(false);
    router.push(`/${nextRole}/${screen.slug}`);
  };

  if (role === "partner") {
    return (
      <main className="gt-partner-app-shell">
        <PartnerMobileScreen slug={activeScreen.slug} navigate={navigate} />
      </main>
    );
  }

  if (role === "tourist") {
    const isHomeScreen = slug === "home" || slug === "welcome";
    const isAndroidTelegram = telegramPlatform.startsWith("android");
    return (
      <main className={`tourist-app-shell ${isAndroidTelegram ? "tourist-app-shell--android" : ""}`}>
        <div className={`tourist-app-frame ${slug === "welcome" ? "tourist-app-frame--welcome" : ""} ${isHomeScreen ? "tourist-app-frame--home" : ""}`}>
          <TouristRuntimeProvider>
            <div className="phone-content">
              <TouristScreen slug={activeScreen.slug} navigate={navigate} />
            </div>
            <TouristBottomNav activeSlug={slug} navigate={navigate} />
          </TouristRuntimeProvider>
        </div>
      </main>
    );
  }

  if (role === "admin") {
    return <AdminDesktopScreen slug={activeScreen.slug} navigate={navigate} />;
  }

  const roleInfo = roles.find((item) => item.key === role) ?? roles[1];
  const account = portalAccounts[role];
  const RoleIcon = roleIcons[role];
  const portalScreens = screensForRole(role);

  const screenContent = role === "ambassador"
    ? <AmbassadorScreen slug={activeScreen.slug} />
    : <RegionalScreen slug={activeScreen.slug} navigate={navigate} />;

  return (
    <div className={`portal-shell portal-shell--${role}`}>
      <aside className={`portal-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="portal-brand">
          <span><Compass size={28} /></span>
          <div><strong>Гід туриста</strong><small>{roleInfo.label}</small></div>
          <button type="button" aria-label="Закрити меню" onClick={() => setMenuOpen(false)}><X size={23} /></button>
        </div>

        <div className="portal-context">
          <span><RoleIcon size={22} /></span>
          <div><small>Робочий простір</small><strong>{account.name}</strong></div>
        </div>

        <nav className="portal-navigation" aria-label={roleInfo.label}>
          <p>Навігація</p>
          {portalScreens.map((screen) => {
            const Icon = iconForScreen(screen.slug);
            const active = screen.slug === activeScreen.slug;
            return (
              <button
                key={screen.slug}
                type="button"
                className={active ? "is-active" : ""}
                onClick={() => navigate(role, screen.slug)}
              >
                <span><Icon size={22} /></span>
                <strong>{screen.shortTitle}</strong>
                {active ? <Check size={17} /> : <ChevronRight size={17} />}
              </button>
            );
          })}
        </nav>

        <div className="portal-account">
          <Avatar initials={account.initials} tone="green" />
          <div><strong>{account.name}</strong><small>{account.detail}</small></div>
          <IconButton label="Вийти"><LogOut size={20} /></IconButton>
        </div>
      </aside>

      {menuOpen ? <button type="button" className="portal-backdrop" aria-label="Закрити меню" onClick={() => setMenuOpen(false)} /> : null}

      <main className="portal-main">
        <header className="portal-topbar">
          <button type="button" className="portal-menu-button" aria-label="Відкрити меню" onClick={() => setMenuOpen(true)}><Menu size={24} /></button>
          <div><small>{roleInfo.label}</small><strong>{activeScreen.title}</strong></div>
          <div className="portal-topbar__actions">
            <IconButton label="Сповіщення"><Bell size={22} /></IconButton>
            <Avatar initials={account.initials} tone="green" />
          </div>
        </header>
        <section className="portal-content">{screenContent}</section>
      </main>
    </div>
  );
}
