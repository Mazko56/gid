export type EmergencyServiceTone = "green" | "purple" | "orange" | "blue";
export type EmergencyServiceIcon =
  | "doctor"
  | "pharmacy"
  | "repair"
  | "tow"
  | "vet"
  | "custom";

export type EmergencyService = {
  id: string;
  title: string;
  note: string;
  tone: EmergencyServiceTone;
  icon: EmergencyServiceIcon;
  active: boolean;
};

export const DEFAULT_EMERGENCY_SERVICES: EmergencyService[] = [
  {
    id: "private-doctor",
    title: "Приватний лікар",
    note: "Консультація",
    tone: "green",
    icon: "doctor",
    active: true,
  },
  {
    id: "pharmacy",
    title: "Аптека",
    note: "Пошук аптек",
    tone: "green",
    icon: "pharmacy",
    active: true,
  },
  {
    id: "car-service",
    title: "СТО",
    note: "Автосервіси",
    tone: "purple",
    icon: "repair",
    active: true,
  },
  {
    id: "tow-truck",
    title: "Евакуатор",
    note: "Допомога",
    tone: "orange",
    icon: "tow",
    active: true,
  },
  {
    id: "veterinarian",
    title: "Ветеринар",
    note: "Допомога тваринам",
    tone: "blue",
    icon: "vet",
    active: true,
  },
];

const STORAGE_KEY = "gid-tourist-emergency-services";

const isService = (value: unknown): value is EmergencyService => {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<EmergencyService>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.note === "string" &&
    typeof item.tone === "string" &&
    typeof item.icon === "string" &&
    typeof item.active === "boolean"
  );
};

export function readEmergencyServices(): EmergencyService[] {
  if (typeof window === "undefined") return DEFAULT_EMERGENCY_SERVICES;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_EMERGENCY_SERVICES;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.every(isService)
      ? parsed
      : DEFAULT_EMERGENCY_SERVICES;
  } catch {
    return DEFAULT_EMERGENCY_SERVICES;
  }
}

export function writeEmergencyServices(services: EmergencyService[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}
