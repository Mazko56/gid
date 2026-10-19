"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TouristLanguage } from "./tourist-i18n";
import {
  ensureTelegramSession,
  selectedPlaceId,
  selectedPlacePreview,
  setSelectedPlaceIdStorage,
  setSelectedPlacePreviewStorage,
  stage2Fetch,
  telegramStartParam,
  trackEvent,
  type Stage2Context,
  type Stage2Place,
  type Stage2User,
} from "./stage2-api";

type Coordinates = { lat: number; lng: number; source: "qr" | "gps" };

type TouristRuntimeValue = {
  context: Stage2Context | null;
  user: Stage2User | null;
  location: Coordinates | null;
  loading: boolean;
  apiOnline: boolean;
  selectedPlaceId: string;
  selectedPlace: Stage2Place | null;
  language: TouristLanguage;
  setSelectedPlaceId: (id: string) => void;
  setSelectedPlace: (place: Stage2Place | null) => void;
  requestLocation: () => Promise<Coordinates | null>;
  setLanguage: (language: TouristLanguage) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const TouristRuntimeContext = createContext<TouristRuntimeValue | null>(null);

function contextCacheKey(startParam: string) {
  return `gid-tourist-stage2-context:${startParam}`;
}

function readCachedContext() {
  if (typeof window === "undefined") return null;
  const startParam = telegramStartParam();
  if (!startParam) return null;
  try {
    const raw = window.sessionStorage.getItem(contextCacheKey(startParam));
    return raw ? JSON.parse(raw) as Stage2Context : null;
  } catch {
    return null;
  }
}

export function TouristRuntimeProvider({ children }: { children: ReactNode }) {
  const initialContext = readCachedContext();
  const [context, setContext] = useState<Stage2Context | null>(initialContext);
  const [user, setUser] = useState<Stage2User | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(() => initialContext ? {
    lat: Number(initialContext.place?.lat ?? initialContext.region.lat),
    lng: Number(initialContext.place?.lng ?? initialContext.region.lng),
    source: "qr",
  } : null);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [selected, setSelected] = useState(() => selectedPlaceId());
  const [selectedPlace, setSelectedPlaceState] = useState<Stage2Place | null>(() => selectedPlacePreview());
  const [localLanguage, setLocalLanguage] = useState<TouristLanguage>(() => {
    if (typeof window === "undefined") return "uk";
    const saved = window.localStorage.getItem("gid-tourist-language");
    return saved === "en" || saved === "pl" ? saved : "uk";
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const startParam = telegramStartParam();
      let resolvedContext: Stage2Context | null = readCachedContext();

      // Resolve the QR context immediately from the launch URL. Telegram authorization runs in
      // parallel, so the UI never needs to render a hardcoded region while waiting for initData.
      const contextPromise = startParam
        ? stage2Fetch<Stage2Context>(`/context/${encodeURIComponent(startParam)}`)
            .then((ctx) => {
              resolvedContext = ctx;
              if (!cancelled) {
                setContext(ctx);
                setLocation((current) => current?.source === "gps" ? current : {
                  lat: Number(ctx.place?.lat ?? ctx.region.lat),
                  lng: Number(ctx.place?.lng ?? ctx.region.lng),
                  source: "qr",
                });
                setApiOnline(true);
                try { window.sessionStorage.setItem(contextCacheKey(startParam), JSON.stringify(ctx)); } catch { /* ignore storage restrictions */ }
              }
              return ctx;
            })
            .catch(() => {
              if (!cancelled && !resolvedContext) setApiOnline(false);
              return null;
            })
        : Promise.resolve(null);

      const authPromise = ensureTelegramSession();
      const [ctx, auth] = await Promise.all([contextPromise, authPromise]);
      if (ctx) resolvedContext = ctx;
      if (!cancelled && auth?.user) {
        if (startParam.startsWith("amb_")) {
          void stage2Fetch('/ambassador/attribute',{method:'POST',body:JSON.stringify({start_param:startParam})}).catch(()=>undefined);
        }
        setUser(auth.user);
        const trackKey = `gid-tourist-stage2-opened:${startParam}`;
        const alreadyTracked = typeof window !== "undefined" && window.sessionStorage.getItem(trackKey) === "1";
        if (!alreadyTracked) {
          void trackEvent("app_opened", { regionId: resolvedContext?.region.id, placeId: resolvedContext?.place?.id, payload: startParam ? { start_param: startParam } : {} });
          if (startParam && resolvedContext?.qr) {
            void trackEvent("qr_scanned", { regionId: resolvedContext.region.id, placeId: resolvedContext.place?.id, payload: { start_param: startParam, source: resolvedContext.qr.source } });
          }
          if (typeof window !== "undefined") window.sessionStorage.setItem(trackKey, "1");
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const setSelectedPlaceId = (id: string) => {
    setSelected(id);
    setSelectedPlaceIdStorage(id);
    setSelectedPlaceState((current) => current?.id === id ? current : null);
    if (selectedPlace?.id !== id) setSelectedPlacePreviewStorage(null);
  };

  const setSelectedPlace = (place: Stage2Place | null) => {
    const id = place?.id ?? "";
    setSelected(id);
    setSelectedPlaceIdStorage(id);
    setSelectedPlaceState(place);
    setSelectedPlacePreviewStorage(place);
  };

  const requestLocation = async () => {
    if (typeof window === "undefined") return null;

    // Telegram native LocationManager is preferred inside Mini Apps because it can request
    // Telegram's own location permission even when the embedded browser blocks a silent
    // navigator.geolocation request. Browser geolocation remains the fallback.
    const locationManager = (window as any).Telegram?.WebApp?.LocationManager;
    if (locationManager) {
      const nativePoint = await new Promise<Coordinates | null>((resolve) => {
        const get = () => {
          try {
            locationManager.getLocation((data: any) => {
              const lat = Number(data?.latitude);
              const lng = Number(data?.longitude);
              if (Number.isFinite(lat) && Number.isFinite(lng)) resolve({ lat, lng, source: "gps" as const });
              else resolve(null);
            });
          } catch { resolve(null); }
        };
        try {
          if (locationManager.isInited) get();
          else locationManager.init(() => get());
        } catch { resolve(null); }
      });
      if (nativePoint) {
        setLocation(nativePoint);
        try { window.localStorage.setItem("gid-tourist-geolocation-approved", "1"); } catch { /* ignore */ }
        return nativePoint;
      }
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) return null;
    return new Promise<Coordinates | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = { lat: position.coords.latitude, lng: position.coords.longitude, source: "gps" as const };
          setLocation(next);
          try { window.localStorage.setItem("gid-tourist-geolocation-approved", "1"); } catch { /* ignore */ }
          resolve(next);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      );
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasTelegramLocation = Boolean((window as any).Telegram?.WebApp?.LocationManager);
    const hasBrowserLocation = typeof navigator !== "undefined" && Boolean(navigator.geolocation);
    if (!hasTelegramLocation && !hasBrowserLocation) return;
    let cancelled = false;
    const syncLocation = async () => {
      try {
        const permission = !hasTelegramLocation && typeof navigator !== "undefined" && navigator.permissions?.query
          ? await navigator.permissions.query({ name: "geolocation" as PermissionName })
          : null;
        if (cancelled || permission?.state === "denied") return;
        const point = await requestLocation();
        if (point && !cancelled) {
          window.localStorage.setItem("gid-tourist-geolocation-approved", "1");
          const tracked = window.sessionStorage.getItem("gid-tourist-location-permission-tracked") === "1";
          if (!tracked) {
            window.sessionStorage.setItem("gid-tourist-location-permission-tracked", "1");
            void trackEvent("location_permission_granted", { regionId: context?.region.id, payload: { source: point.source } });
          }
        }
      } catch {
        if (!cancelled) {
          const point = await requestLocation();
          if (point) window.localStorage.setItem("gid-tourist-geolocation-approved", "1");
        }
      }
    };
    void syncLocation();
    return () => { cancelled = true; };
  }, []);

  const refreshProfile = async () => {
    try {
      const next = await stage2Fetch<Stage2User>("/me");
      setUser(next);
    } catch {
      // Public browsing remains available without a session.
    }
  };

  const setLanguage = async (language: TouristLanguage) => {
    setLocalLanguage(language);
    try { window.localStorage.setItem("gid-tourist-language", language); } catch { /* optional local preference */ }
    setUser((prev) => prev ? { ...prev, selected_language: language } : prev);
    try {
      const next = await stage2Fetch<Stage2User>("/me", { method: "PATCH", body: JSON.stringify({ selected_language: language }) });
      setUser(next);
    } catch {
      // Keep the local language choice if the API is temporarily unavailable.
    }
  };

  const value = useMemo<TouristRuntimeValue>(() => ({
    context,
    user,
    location,
    loading,
    apiOnline,
    selectedPlaceId: selected,
    selectedPlace,
    language: (user?.selected_language === "en" || user?.selected_language === "pl") ? user.selected_language : user?.selected_language === "uk" ? "uk" : localLanguage,
    setSelectedPlaceId,
    setSelectedPlace,
    requestLocation,
    setLanguage,
    refreshProfile,
  }), [context, user, location, loading, apiOnline, selected, selectedPlace, localLanguage]);

  return <TouristRuntimeContext.Provider value={value}>{children}</TouristRuntimeContext.Provider>;
}

export function useTouristRuntime() {
  const value = useContext(TouristRuntimeContext);
  if (!value) throw new Error("useTouristRuntime must be used inside TouristRuntimeProvider");
  return value;
}
