"use client";

import { useEffect, useRef, useState } from "react";
import type { Stage2Place } from "../lib/stage2-api";

type LeafletApi = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => any;
  tileLayer: (url: string, options?: Record<string, unknown>) => any;
  circleMarker: (coords: [number, number], options?: Record<string, unknown>) => any;
  circle: (coords: [number, number], options?: Record<string, unknown>) => any;
  marker: (coords: [number, number], options?: Record<string, unknown>) => any;
  icon: (options?: Record<string, unknown>) => any;
};

type MapRuntime = {
  provider: "google" | "leaflet";
  map: any;
  api: any;
  user: any;
  circle: any;
  picked: any;
  tile?: any;
  layerControl?: HTMLElement | null;
  markers: any[];
  markerById: Map<string, any>;
  clickListener?: any;
};

declare global {
  interface Window {
    L?: LeafletApi;
    __gidLeafletPromise?: Promise<LeafletApi>;
    google?: any;
    __gidGoogleMapsPromise?: Promise<any>;
  }
}

function browserMapsKey() {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
}

function loadGoogleMaps(): Promise<any> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.__gidGoogleMapsPromise) return window.__gidGoogleMapsPromise;
  const key = browserMapsKey();
  if (!key) return Promise.reject(new Error("Google Maps browser key is not configured"));
  window.__gidGoogleMapsPromise = new Promise((resolve, reject) => {
    const callback = `__gidGoogleMapsReady_${Date.now()}`;
    (window as any)[callback] = () => {
      delete (window as any)[callback];
      window.google?.maps ? resolve(window.google.maps) : reject(new Error("Google Maps did not initialize"));
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${callback}`;
    script.async = true;
    script.defer = true;
    script.dataset.gidGoogleMaps = "1";
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return window.__gidGoogleMapsPromise;
}

function loadLeaflet(): Promise<LeafletApi> {
  if (window.L) return Promise.resolve(window.L);
  if (window.__gidLeafletPromise) return window.__gidLeafletPromise;
  window.__gidLeafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-gid-leaflet="1"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.gidLeaflet = "1";
      document.head.appendChild(link);
    }
    const existing = document.querySelector('script[data-gid-leaflet="1"]') as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.dataset.gidLeaflet = "1";
      document.head.appendChild(script);
    }
    const done = () => window.L ? resolve(window.L) : reject(new Error("Leaflet did not initialize"));
    if (window.L) done();
    else {
      script.addEventListener("load", done, { once: true });
      script.addEventListener("error", () => reject(new Error("Failed to load Leaflet")), { once: true });
    }
  });
  return window.__gidLeafletPromise;
}

function markerColor(place: Stage2Place) {
  const category = String(place.category_slug || "").toLowerCase();
  if (category === "food") return "#f28a22";
  if (category === "shop") return "#2878d8";
  if (category === "nature") return "#18a45b";
  if (category === "rest") return "#8b5bd6";
  if (category === "entertainment" || category === "fun") return "#d94c65";
  if (category === "transfer") return "#159a9a";
  if (category === "useful" || category === "emergency") return "#d5a11e";
  if (category === "interesting") return "#8a67c7";
  return "#64748b";
}

function placeMarkerSvg(place: Stage2Place) {
  const partner = place.is_partner === true || place.source === "partner" || place.attributes?.partner === true;
  const fill = markerColor(place);
  const center = partner
    ? `<path d='M16 7l2.4 4.8 5.3.8-3.9 3.8.9 5.3-4.7-2.5-4.7 2.5.9-5.3-3.9-3.8 5.3-.8z' fill='white'/>`
    : `<circle cx='16' cy='16' r='4.5' fill='white'/>`;
  const outer = partner ? `<circle cx='16' cy='15' r='13' fill='none' stroke='white' stroke-width='2.3' opacity='.95'/>` : "";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='38' viewBox='0 0 32 38'><path d='M16 1C8.3 1 2 7.2 2 15c0 10.4 14 22 14 22s14-11.6 14-22C30 7.2 23.7 1 16 1z' fill='${fill}' stroke='white' stroke-width='2'/>${outer}${center}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function zoomForRadius(radius: number, compact: boolean) {
  if (compact) return 15;
  if (radius <= 500) return 16;
  if (radius <= 1000) return 15;
  if (radius <= 2000) return 14;
  return 13;
}


type MapLayerMode = "map" | "terrain" | "satellite";

function createLayerControl(onChange: (mode: MapLayerMode) => void) {
  const wrap = document.createElement("div");
  wrap.className = "gt-map-layer-picker";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "gt-map-layer-picker__trigger";
  trigger.setAttribute("aria-label", "Шари мапи");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = "<span class='gt-map-layer-picker__tiles' aria-hidden='true'><i></i><i></i><i></i><i></i></span>";

  const menu = document.createElement("div");
  menu.className = "gt-map-layer-picker__menu";
  menu.setAttribute("role", "menu");

  const items: Array<[MapLayerMode, string, string]> = [
    ["map", "Мапа", "Звичайна карта"],
    ["terrain", "Ландшафт", "Рельєф та висоти"],
    ["satellite", "Супутник", "Супутникові знімки"],
  ];

  const close = () => {
    wrap.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const open = wrap.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  for (const [mode, label, note] of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `gt-map-layer-picker__option is-${mode}`;
    button.dataset.layer = mode;
    button.setAttribute("role", "menuitemradio");
    button.setAttribute("aria-checked", mode === "map" ? "true" : "false");
    if (mode === "map") button.classList.add("is-active");
    button.innerHTML = `<span class="gt-map-layer-picker__preview" aria-hidden="true"></span><span><strong>${label}</strong><small>${note}</small></span>`;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      menu.querySelectorAll<HTMLButtonElement>("button").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-checked", active ? "true" : "false");
      });
      onChange(mode);
      close();
    });
    menu.appendChild(button);
  }

  wrap.append(trigger, menu);
  return wrap;
}

function leafletTileConfig(mode: MapLayerMode) {
  if (mode === "terrain") return {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    options: { maxZoom: 17, attribution: "© OpenStreetMap contributors · SRTM | OpenTopoMap" },
  };
  if (mode === "satellite") return {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: { maxZoom: 19, attribution: "Tiles © Esri" },
  };
  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: { maxZoom: 19, attribution: "© OpenStreetMap contributors" },
  };
}

const GOOGLE_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f4f7f2" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#526058" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2 }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#d6ded9" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#edf5ea" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#dfe6e1" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fff7dc" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8e8b7" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe8f4" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6f94a6" }] },
];

export function RealMap({
  center,
  places,
  radius = 500,
  className = "",
  onSelect,
  onPick,
  pickable = false,
  compact = false,
  preferLeaflet = false,
  showCenterMarker = true,
  showRadius = true,
  showLayerControl = false,
}: {
  center: { lat: number; lng: number };
  places: Stage2Place[];
  radius?: number;
  className?: string;
  onSelect?: (place: Stage2Place) => void;
  onPick?: (coords: { lat: number; lng: number }) => void;
  pickable?: boolean;
  compact?: boolean;
  /** Use OpenStreetMap/Leaflet first. Useful for the admin point picker so it works even when a browser Google key is restricted. */
  preferLeaflet?: boolean;
  /** Hide the blue center marker for a clean point-picking map. */
  showCenterMarker?: boolean;
  /** Hide the distance-radius circle for a clean point-picking map. */
  showRadius?: boolean;
  /** Show map/terrain/satellite switcher without changing the surrounding screen layout. */
  showLayerControl?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<MapRuntime | null>(null);
  const onSelectRef = useRef(onSelect);
  const onPickRef = useRef(onPick);
  const [readyVersion, setReadyVersion] = useState(0);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { onPickRef.current = onPick; }, [onPick]);

  useEffect(() => {
    let cancelled = false;
    const host = ref.current;
    if (!host) return;

    const cleanupRuntime = () => {
      const runtime = runtimeRef.current;
      runtimeRef.current = null;
      if (!runtime) return;
      if (runtime.provider === "google") {
        runtime.markers.forEach((marker) => marker.setMap?.(null));
        runtime.user?.setMap?.(null);
        runtime.circle?.setMap?.(null);
        runtime.picked?.setMap?.(null);
        runtime.clickListener?.remove?.();
      } else {
        runtime.map?.remove?.();
      }
    };

    cleanupRuntime();
    host.replaceChildren();

    const renderGoogle = async () => {
      const maps = await loadGoogleMaps();
      if (cancelled || !ref.current) return;
      const map = new maps.Map(ref.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoomForRadius(radius, compact),
        disableDefaultUI: true,
        gestureHandling: compact ? "none" : "greedy",
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        backgroundColor: "#edf4ef",
        styles: GOOGLE_MAP_STYLES,
      });
      const circle = compact || !showRadius ? null : new maps.Circle({ map, center, radius, strokeColor: "#13a55b", strokeOpacity: .42, strokeWeight: 1, fillColor: "#13a55b", fillOpacity: .045 });
      const user = showCenterMarker ? new maps.Marker({
        map,
        position: center,
        title: "Ваше місцезнаходження",
        zIndex: 1000,
        icon: { path: maps.SymbolPath.CIRCLE, scale: compact ? 5 : 7, fillColor: "#1677ff", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 },
      }) : null;
      const runtime: MapRuntime = { provider: "google", map, api: maps, user, circle, picked: null, markers: [], markerById: new Map(), layerControl: null };
      if (showLayerControl && !compact) {
        const control = createLayerControl((mode) => {
          if (mode === "terrain") {
            map.setOptions({ mapTypeId: maps.MapTypeId.TERRAIN, styles: null });
          } else if (mode === "satellite") {
            map.setOptions({ mapTypeId: maps.MapTypeId.SATELLITE, styles: null });
          } else {
            map.setOptions({ mapTypeId: maps.MapTypeId.ROADMAP, styles: GOOGLE_MAP_STYLES });
          }
        });
        runtime.layerControl = control;
        map.controls[maps.ControlPosition.RIGHT_BOTTOM].push(control);
      }
      if (pickable && !compact) {
        runtime.clickListener = map.addListener("click", (event: any) => {
          const lat = Number(event.latLng?.lat?.() ?? 0);
          const lng = Number(event.latLng?.lng?.() ?? 0);
          if (!lat || !lng) return;
          runtime.picked?.setMap?.(null);
          runtime.picked = new maps.Marker({ map, position: { lat, lng }, title: "Обрана точка", zIndex: 1200 });
          onPickRef.current?.({ lat, lng });
        });
      }
      runtimeRef.current = runtime;
      setReadyVersion((value) => value + 1);
    };

    const renderFallback = async () => {
      const L = await loadLeaflet();
      if (cancelled || !ref.current) return;
      const map = L.map(ref.current, { zoomControl: false, attributionControl: !compact, dragging: !compact, scrollWheelZoom: !compact }).setView([center.lat, center.lng], zoomForRadius(radius, compact));
      const baseLayer = leafletTileConfig("map");
      const tile = L.tileLayer(baseLayer.url, baseLayer.options).addTo(map);
      const circle = compact || !showRadius ? null : L.circle([center.lat, center.lng], { radius, color: "#20b364", weight: 1, opacity: 0.4, fillOpacity: 0.04 }).addTo(map);
      const user = showCenterMarker ? L.circleMarker([center.lat, center.lng], { radius: compact ? 5 : 8, color: "#ffffff", weight: 3, fillColor: "#1677ff", fillOpacity: 1 }).addTo(map).bindTooltip("Ваше місцезнаходження") : null;
      const runtime: MapRuntime = { provider: "leaflet", map, api: L, user, circle, picked: null, tile, markers: [], markerById: new Map(), layerControl: null };
      if (showLayerControl && !compact) {
        const control = createLayerControl((mode) => {
          const next = leafletTileConfig(mode);
          if (runtime.tile) map.removeLayer(runtime.tile);
          runtime.tile = L.tileLayer(next.url, next.options).addTo(map);
          runtime.tile.bringToBack?.();
        });
        const leafletControl = (L as any).control({ position: "bottomright" });
        leafletControl.onAdd = () => control;
        leafletControl.addTo(map);
        runtime.layerControl = control;
      }
      if (pickable && !compact) {
        map.on("click", (event: any) => {
          const lat = Number(event.latlng?.lat ?? 0);
          const lng = Number(event.latlng?.lng ?? 0);
          if (!lat || !lng) return;
          if (runtime.picked) map.removeLayer(runtime.picked);
          runtime.picked = L.circleMarker([lat, lng], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#111827", fillOpacity: 1 }).addTo(map);
          onPickRef.current?.({ lat, lng });
        });
      }
      runtimeRef.current = runtime;
      window.setTimeout(() => map.invalidateSize(), 50);
      setReadyVersion((value) => value + 1);
    };

    // Map tiles are OSM-based. Only approved platform places enter the markers layer.
    void renderFallback().catch((error) => console.warn("Map tiles unavailable",error));

    return () => {
      cancelled = true;
      cleanupRuntime();
      host.replaceChildren();
    };
  // The map canvas is intentionally initialized once. Data/filters update markers below without rebuilding tiles.
  }, [compact, pickable, preferLeaflet, showCenterMarker, showRadius, showLayerControl]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const zoom = zoomForRadius(radius, compact);
    if (runtime.provider === "google") {
      runtime.map.setCenter({ lat: center.lat, lng: center.lng });
      runtime.map.setZoom(zoom);
      runtime.user?.setPosition?.({ lat: center.lat, lng: center.lng });
      runtime.circle?.setCenter?.({ lat: center.lat, lng: center.lng });
      runtime.circle?.setRadius?.(radius);
    } else {
      runtime.map.setView([center.lat, center.lng], zoom, { animate: false });
      runtime.user?.setLatLng?.([center.lat, center.lng]);
      runtime.circle?.setLatLng?.([center.lat, center.lng]);
      runtime.circle?.setRadius?.(radius);
      window.setTimeout(() => runtime.map.invalidateSize?.(), 0);
    }
  }, [center.lat, center.lng, radius, compact, readyVersion]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const visible = places.filter((place) => Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng))).slice(0, compact ? 8 : 40);
    const visibleIds = new Set(visible.map((place) => place.id));

    // Reconcile markers by place id. Progressive list updates now add only the new 2–3 markers
    // instead of deleting and recreating every existing marker on every batch/rating update.
    for (const [id, marker] of runtime.markerById.entries()) {
      if (visibleIds.has(id)) continue;
      if (runtime.provider === "google") marker.setMap?.(null);
      else runtime.map.removeLayer?.(marker);
      runtime.markerById.delete(id);
    }

    for (const place of visible) {
      if (runtime.markerById.has(place.id)) continue;
      const partner = place.is_partner === true || place.source === "partner" || place.attributes?.partner === true;
      if (runtime.provider === "google") {
        const marker = new runtime.api.Marker({
          map: runtime.map,
          position: { lat: Number(place.lat), lng: Number(place.lng) },
          title: partner ? `Партнер · ${place.name}` : place.name,
          zIndex: partner ? 500 : 100,
          icon: { url: placeMarkerSvg(place), scaledSize: new runtime.api.Size(compact ? 21 : 28, compact ? 25 : 33), anchor: new runtime.api.Point(compact ? 10 : 14, compact ? 24 : 32) },
        });
        if (!compact) marker.addListener("click", () => onSelectRef.current?.(place));
        runtime.markerById.set(place.id, marker);
      } else {
        const icon = runtime.api.icon({ iconUrl: placeMarkerSvg(place), iconSize: compact ? [21, 25] : [28, 33], iconAnchor: compact ? [10, 24] : [14, 32] });
        const marker = runtime.api.marker([Number(place.lat), Number(place.lng)], { icon }).addTo(runtime.map);
        marker.bindTooltip(partner ? `★ Партнер · ${place.name}` : place.name);
        if (!compact) marker.on("click", () => onSelectRef.current?.(place));
        runtime.markerById.set(place.id, marker);
      }
    }
    runtime.markers = [...runtime.markerById.values()];
  }, [places, compact, readyVersion]);

  return <div ref={ref} className={`gt-real-map ${className}`.trim()} aria-label="Інтерактивна карта" />;
}
