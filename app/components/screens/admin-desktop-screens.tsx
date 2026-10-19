"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Edit3,
  Database,
  Eye,
  FileText,
  Filter,
  Gift,
  ImagePlus,
  Info,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MoreVertical,
  Palette,
  Percent,
  Plug,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Store,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  WalletCards,
  UtensilsCrossed,
  Waves,
  X,
  Camera,
  ShoppingBag,
  Send,
  Star,
} from "lucide-react";
import type { RoleKey } from "../../lib/navigation";
import { adminStage2Fetch, stage2Fetch, type Stage2Category, type Stage2EmergencyService, type Stage2EmergencyServicesResponse, type Stage2GeoDetails, type Stage2GeoSuggestion, type Stage2HotOffer, type Stage2PageContentResponse, type Stage2PlaceTypeTemplate } from "../../lib/stage2-api";
import { RealMap } from "../real-map";

type Navigate = (role: RoleKey, slug: string) => void;
type AdminProps = { navigate: Navigate };

const ADMIN_SELECTED_PARTNER_KEY = "gid-tourist-admin-selected-partner-id";
const ADMIN_EDIT_PARTNER_KEY = "gid-tourist-admin-edit-partner-id";
const ADMIN_SELECTED_CLIENT_KEY = "gid-tourist-admin-selected-client-id";
type LiveClient = { id:string; telegram_id?:string|null; telegram_username?:string|null; first_name?:string|null;last_name?:string|null;phone?:string|null;created_at?:string;last_active_at?:string;balance:number|string;earned:number|string;spent:number|string;events:number;bookings:number;purchases:number;reviews:number };
type LiveClientDetail = LiveClient & { selected_language?:string;ledger:Array<{id:string;amount:number|string;entry_type:string;status:string;created_at:string;place_name?:string|null}>;activity:Array<{id:string;event_type:string;created_at:string;place_name?:string|null}>;bookings:Array<{id:string;starts_at:string;status:string;price:number|string}>;purchases:Array<{id:string;created_at:string;amount:number|string;status:string}>;reviews:Array<{id:string;rating:number;status:string;created_at:string}> };
type LivePartnerSummary = { purchases:Array<{id:string;created_at:string;status:string;amount:number|string;commission:number|string;spent:number|string;earned:number|string}>; bookings:Array<{id:string;created_at:string;starts_at:string;status:string;party_size:number;price:number|string}>; events:Array<{id:string;created_at:string;event_type:string}>; confirmed_purchases:number;bookings_count:number;turnover:number;commission_due:number;compensation_due:number;net_due:number};
type LiveSettlement = {place_id:string;name:string;region_name:string;category_name:string;transactions:number;turnover:number|string;commission_due:number|string;compensation_due:number|string;net_due:number|string};
type LiveAnalytics = {clients:{total:number;new_clients:number;active_clients:number};bonuses:{earned:number|string;spent:number|string};places:Array<{status:string;count:number}>;transactions:Array<{status:string;count:number;turnover:number|string}>;bookings:Array<{status:string;count:number}>;events:Array<{event_type:string;count:number}>;series:Array<{day:string;amount:number|string}>;categories:Array<{name:string;amount:number|string}>;locations:Array<{name:string;total:number}>;top_partners:Array<{name:string;turnover:number|string}>};
const moneyUA = (value: number|string|undefined|null) => `${Number(value||0).toLocaleString('uk-UA',{maximumFractionDigits:2})} грн`;
const countUA = (value:number|string|undefined|null) => Number(value||0).toLocaleString('uk-UA');
const dateUA = (value?:string|null) => value?new Date(value).toLocaleString('uk-UA'):'—';
const clientFullName = (row:{first_name?:string|null;last_name?:string|null;telegram_username?:string|null;telegram_id?:string|null}) => [row.first_name,row.last_name].filter(Boolean).join(' ')||row.telegram_username||`Telegram ${row.telegram_id||'—'}`;
function useAdminRemote<T>(url:string) {
  const [data,setData] = useState<T|null>(null);
  const [error,setError] = useState('');
  useEffect(()=>{let active=true;void adminStage2Fetch<T>(url).then(x=>{if(active){setData(x);setError('');}}).catch(e=>{if(active){setData(null);setError(e instanceof Error?e.message:'Помилка API');}});return()=>{active=false;};},[url]);
  return {data,error};
}
function AdminRemoteInfo({error,data}:{error:string;data:unknown}) {
  return error?<div className="ad-create-message is-error">{error}</div>:data===null?<div className="ad-stage2-empty-row">Завантаження даних із PostgreSQL…</div>:null;
}


type AdminPartnerDetail = {
  id: string;
  organization_id?: string | null;
  organization_name?: string | null;
  region_id: string;
  region_name?: string;
  category_slug: string;
  subcategory?: string | null;
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string | null;
  image_url?: string | null;
  work_hours?: Record<string, any>;
  attributes?: Record<string, any>;
  details?: Record<string, any>;
  status: string;
  moderation_comment?: string | null;
  created_at?: string;
  updated_at?: string;
  telegram_ids?: string[];
  partner_start_param?: string | null;
  views?: number;
  qr_scans?: number;
  route_clicks?: number;
  call_clicks?: number;
};

function rememberPartner(id: string, edit = false) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ADMIN_SELECTED_PARTNER_KEY, id);
  if (edit) window.sessionStorage.setItem(ADMIN_EDIT_PARTNER_KEY, id);
  else window.sessionStorage.removeItem(ADMIN_EDIT_PARTNER_KEY);
}

function selectedAdminPartnerId() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(ADMIN_SELECTED_PARTNER_KEY) || "";
}

type NavKey = "partners" | "content" | "pages" | "clients" | "settlements" | "bonuses" | "statistics" | "settings";

type TableColumn = {
  label: string;
  className?: string;
};

const adminNav: Array<{ key: NavKey; label: string; slug: string; icon: typeof UserRound }> = [
  { key: "partners", label: "Партнери", slug: "admin-partners", icon: UserRound },
  { key: "content", label: "Контент / QR", slug: "admin-stage2", icon: MapPin },
  { key: "pages", label: "Редактор сторінок", slug: "admin-pages", icon: Palette },
  { key: "clients", label: "Клієнти", slug: "admin-clients", icon: UsersRound },
  { key: "settlements", label: "Взаєморозрахунки", slug: "admin-settlements", icon: FileText },
  { key: "bonuses", label: "Бонуси", slug: "admin-bonuses", icon: Gift },
  { key: "statistics", label: "Статистика", slug: "admin-statistics", icon: BarChart3 },
  { key: "settings", label: "Налаштування", slug: "admin-settings", icon: Settings },
];

function AdminLogo() {
  return (
    <div className="ad-logo">
      <span className="ad-logo__mark">
        <svg viewBox="0 0 44 34" aria-hidden="true">
          <path d="M3 29L13 13l8 10 7-14 13 20H3Z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M8 24h27" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </span>
      <strong>Gid Tourist</strong>
    </div>
  );
}

function AdminSidebar({ active, navigate }: { active: NavKey; navigate: Navigate }) {
  return (
    <aside className="ad-sidebar">
      <AdminLogo />
      <nav className="ad-sidebar__nav">
        {adminNav.map(({ key, label, slug, icon: Icon }) => (
          <button
            type="button"
            key={key}
            className={active === key ? "is-active" : ""}
            onClick={() => navigate("admin", slug)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="ad-sidebar__account">
        <span>А</span>
        <div>
          <strong>Адміністратор</strong>
          <small>admin@gidtourist.ua</small>
        </div>
        <ChevronDown size={16} />
      </div>
    </aside>
  );
}

function AdminShell({ active, navigate, children, contentClassName = "" }: AdminProps & { active: NavKey; children: ReactNode; contentClassName?: string }) {
  return (
    <div className="ad-shell">
      <AdminSidebar active={active} navigate={navigate} />
      <main className={`ad-main ${contentClassName}`.trim()}>{children}</main>
    </div>
  );
}

function AdminPageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: () => void;
}) {
  return (
    <header className="ad-page-header">
      <div className="ad-page-header__copy">
        {back ? (
          <button type="button" className="ad-back-link" onClick={back}>
            <ArrowLeft size={17} /> Назад
          </button>
        ) : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="ad-page-header__action">{action}</div> : null}
    </header>
  );
}

function PrimaryButton({ children, onClick, disabled = false }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="ad-btn ad-btn--primary" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="ad-btn ad-btn--outline" onClick={onClick}>
      {children}
    </button>
  );
}

function SearchBox({ placeholder }: { placeholder: string }) {
  return (
    <label className="ad-search-box">
      <Search size={20} />
      <input placeholder={placeholder} />
    </label>
  );
}

function SelectBox({ label, value }: { label?: string; value: string }) {
  return (
    <button type="button" className="ad-select-box">
      <span>
        {label ? <small>{label}</small> : null}
        <strong>{value}</strong>
      </span>
      <ChevronDown size={16} />
    </button>
  );
}


function MiniSparkline() {
  return (
    <svg className="ad-spark" viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points="2,23 18,20 31,14 47,16 63,10 78,13 94,7 118,4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function DateRange({ value = "Весь період" }: { value?: string }) {
  return (
    <button type="button" className="ad-date-range">
      <CalendarDays size={17} />
      <span>{value}</span>
      <ChevronDown size={15} />
    </button>
  );
}

function FilterStrip({ type = "partners" }: { type?: "partners" | "clients" | "bonuses" | "settlements" | "stats" }) {
  const isPartners = type === "partners";
  const isClients = type === "clients";
  const isSettlements = type === "settlements";
  const isBonuses = type === "bonuses";
  return (
    <div className="ad-filter-strip">
      {type !== "stats" ? <SearchBox placeholder={isPartners || isSettlements ? "Пошук партнера..." : "Пошук клієнта..."} /> : null}
      {isClients || isBonuses ? <SelectBox label="Статус" value="Усі статуси" /> : null}
      {isPartners || isSettlements || type === "stats" ? <SelectBox label="Локація" value="Усі локації" /> : null}
      {isPartners || isSettlements || type === "stats" ? <SelectBox label="Категорія" value="Усі категорії" /> : null}
      {isPartners ? <SelectBox label="Тип розміщення" value="Усі типи" /> : null}
      {isPartners ? <SelectBox label="Статус" value="Усі статуси" /> : null}
      {isSettlements ? <SelectBox label="Статус рахунку" value="Усі статуси" /> : null}
      {isSettlements ? <SelectBox label="Статус оплати" value="Усі статуси" /> : null}
      {isClients || isBonuses ? <SelectBox label="Місто / локація" value="Усі міста" /> : null}
      {isBonuses ? <SelectBox label="Загальний статус" value="Усі статуси" /> : null}
      {isBonuses ? <SelectBox label="Рівень бонусів" value="Усі" /> : null}
      {type === "stats" ? <SelectBox label="Тип розміщення" value="Усі типи" /> : null}
      {type === "stats" ? <SelectBox label="Статус партнера" value="Усі статуси" /> : null}
      <OutlineButton><RefreshCcw size={17} /> Скинути фільтри</OutlineButton>
    </div>
  );
}

function Status({ tone = "green", children }: { tone?: "green" | "blue" | "gray" | "orange" | "red"; children: ReactNode }) {
  return <span className={`ad-status ad-status--${tone}`}>{children}</span>;
}

function AdminTable({ columns, children }: { columns: TableColumn[]; children: ReactNode }) {
  return (
    <div className="ad-table-wrap">
      <div className="ad-table-head" style={{ gridTemplateColumns: columns.map((c) => c.className || "1fr").join(" ") }}>
        {columns.map((col) => <span key={col.label}>{col.label}</span>)}
      </div>
      {children}
    </div>
  );
}

function TableRow({ columns, children }: { columns: string[]; children: ReactNode }) {
  return <div className="ad-table-row" style={{ gridTemplateColumns: columns.join(" ") }}>{children}</div>;
}

function Pagination({ label }: { label: string }) {
  return (
    <div className="ad-pagination">
      <span>{label}</span>
      <div>
        <button type="button"><ChevronLeft size={16} /></button>
        <button type="button" className="is-active">1</button>
        <button type="button">2</button>
        <button type="button">3</button>
        <span>…</span>
        <button type="button"><ChevronRight size={16} /></button>
      </div>
      <SelectBox value="10 на сторінці" />
    </div>
  );
}

function PartnerListIcon({ name }: { name: string }) {
  const Icon = name.includes("Колиба") ? UtensilsCrossed
    : name.includes("Чан") ? Waves
    : name.includes("Jeep") || name.includes("Таксі") ? BriefcaseBusiness
    : name.includes("Рафтинг") ? Waves
    : name.includes("Фотограф") ? Camera
    : name.includes("сувеніри") ? ShoppingBag
    : Info;
  return <span className="ad-partner-list-icon"><Icon size={22} /></span>;
}

const partnerRows = [
  ["🍴", "Колиба “Біля річки”", "Ресторан", "Де поїсти", "Яремче", "Преміум", "Активний"],
  ["♨", "Чан Карпати", "Чани", "Де відпочити", "Микуличин", "Преміум", "Активний"],
  ["🚙", "Jeep Tour Карпати", "Джип-тури", "Розваги", "Буковель", "Преміум", "Активний"],
  ["🌊", "Рафтинг Прут", "Рафтинг", "Розваги", "Ворохта", "Преміум", "Активний"],
  ["📷", "Фотограф Карпати", "Фото-послуги", "Розваги", "Яремче", "Преміум", "Чернетка"],
  ["🛍", "Гуцульські сувеніри", "Магазин", "Де купити", "Косів", "Преміум", "Активний"],
  ["🚕", "Таксі Карпати", "Трансфер", "Трансфер", "Івано-Франківськ", "Преміум", "Активний"],
  ["ⓘ", "Рятувальна служба Карпат", "Халепа?", "Халепа?", "Яремче", "Соціальний", "Активний"],
];

function PartnersScreen({ navigate }: AdminProps) {
  const [rows, setRows] = useState<Array<{ id: string; name: string; category_slug: string; subcategory?: string | null; address: string; status: string; region_name?: string; organization_name?: string }>>([]);
  const [categories, setCategories] = useState<Stage2Category[]>([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      adminStage2Fetch<Array<{ id: string; name: string; category_slug: string; subcategory?: string | null; address: string; status: string; region_name?: string; organization_name?: string }>>("/admin/stage2/partners"),
      stage2Fetch<Stage2Category[]>("/categories"),
    ]).then(([places, cats]) => { if (!cancelled) { setRows(places); setCategories(cats); } }).catch((e) => { if (!cancelled) setLoadError(e instanceof Error ? e.message : "Не вдалося завантажити партнерів"); });
    return () => { cancelled = true; };
  }, []);
  const categoryName = (slug: string) => categories.find((item) => item.slug === slug)?.name || slug;
  return (
    <AdminShell active="partners" navigate={navigate} contentClassName="ad-main--partners">
      <AdminPageHeader
        title="Партнери"
        action={<PrimaryButton onClick={() => { if (typeof window !== "undefined") window.sessionStorage.removeItem(ADMIN_EDIT_PARTNER_KEY); navigate("admin", "admin-partner-create"); }}><Plus size={18} /> Новий партнер</PrimaryButton>}
      />
      <FilterStrip type="partners" />
      {loadError ? <div className="ad-create-message is-error">{loadError}</div> : null}
      <AdminTable columns={[
        { label: "Назва", className: "1.8fr" }, { label: "Категорія", className: "1fr" }, { label: "Локація", className: ".9fr" },
        { label: "Тип розміщення", className: "1.05fr" }, { label: "Статус", className: ".8fr" }, { label: "Дії", className: ".7fr" },
      ]}>
        {rows.map((row) => (
          <TableRow key={row.id} columns={["1.8fr", "1fr", ".9fr", "1.05fr", ".8fr", ".7fr"]}>
            <div className="ad-entity-cell"><PartnerListIcon name={row.name} /><div><strong>{row.name}</strong><small>{row.subcategory || row.organization_name || "Партнер"}</small></div></div>
            <span>{categoryName(row.category_slug)}</span><span>{row.region_name || row.address || "—"}</span><Status>{row.category_slug === "hotel" ? "Базовий" : "Партнер"}</Status>
            <Status tone={row.status === "approved" ? "green" : row.status === "rejected" ? "red" : row.status === "pending" ? "orange" : "gray"}>{row.status}</Status>
            <div className="ad-row-actions">
              <button onClick={() => { rememberPartner(row.id); navigate("admin", "admin-partner-details"); }} aria-label="Переглянути"><Eye size={17} /></button>
              <button onClick={() => { rememberPartner(row.id, true); navigate("admin", "admin-partner-create"); }} aria-label="Редагувати"><Edit3 size={17} /></button>
            </div>
          </TableRow>
        ))}
        {!rows.length && !loadError ? <div className="ad-stage2-empty-row">Партнерів у базі ще немає</div> : null}
      </AdminTable>
      <Pagination label={`Показано ${rows.length} партнерів`} />
    </AdminShell>
  );
}

function ClientsScreen({ navigate }: AdminProps) {
  const {data:clients,error}=useAdminRemote<LiveClient[]>('/admin/platform/clients');
  return <AdminShell active="clients" navigate={navigate} contentClassName="ad-main--clients">
    <AdminPageHeader title="Клієнти"/><FilterStrip type="clients"/>
    <AdminRemoteInfo error={error} data={clients}/>
    {clients?<><AdminTable columns={[{label:"Ім'я",className:"1.5fr"},{label:"Telegram",className:"1fr"},{label:"Статус",className:".9fr"},{label:"Бонуси",className:".8fr"},{label:"Остання активність",className:"1.45fr"},{label:"Дії",className:".8fr"}]}>
      {clients.map(c=><TableRow key={c.id} columns={["1.5fr","1fr",".9fr",".8fr","1.45fr",".8fr"]}>
        <div className="ad-client-cell"><span>{(c.first_name?.[0]||c.telegram_username?.[0]||'T').toUpperCase()}</span><div><strong>{clientFullName(c)}</strong><small>{c.events||0} подій · {c.purchases||0} покупок</small></div></div>
        <span>{c.telegram_username?`@${c.telegram_username}`:c.telegram_id||'—'}</span>
        <Status tone={c.last_active_at && Date.now()-new Date(c.last_active_at).getTime()<30*86400000?'green':'gray'}>{c.last_active_at && Date.now()-new Date(c.last_active_at).getTime()<30*86400000?'Активний':'Неактивний'}</Status>
        <strong>{countUA(c.balance)} балів</strong><span>{dateUA(c.last_active_at)}</span>
        <button className="ad-text-btn" onClick={()=>{sessionStorage.setItem(ADMIN_SELECTED_CLIENT_KEY,c.id);navigate('admin','admin-client-details');}}>Картка</button>
      </TableRow>)}
      {!clients.length?<div className="ad-stage2-empty-row">Користувачів у базі ще немає</div>:null}
    </AdminTable><Pagination label={`Показано ${clients.length} реальних клієнтів`}/></>:null}
  </AdminShell>;
}

function SummaryCard({ label, value, note, tone = "green", icon }: { label: string; value: string; note?: string; tone?: string; icon?: ReactNode }) {
  return (
    <div className={`ad-summary-card ad-summary-card--${tone}`}>
      {icon ? <span className="ad-summary-card__icon">{icon}</span> : null}
      <div><small>{label}</small><strong>{value}</strong>{note ? <em>{note}</em> : null}</div>
    </div>
  );
}

function BonusesScreen({navigate}: AdminProps) {
  const {data:clients,error}=useAdminRemote<LiveClient[]>('/admin/platform/clients');
  const {data:stats,error:statsError}=useAdminRemote<LiveAnalytics>('/admin/platform/analytics');
  return <AdminShell active="bonuses" navigate={navigate}>
    <AdminPageHeader title="Бонуси"/><AdminRemoteInfo error={error||statsError} data={clients&&stats}/>
    {clients&&stats?<><div className="ad-summary-grid ad-summary-grid--five">
      <SummaryCard label="Оборот підтверджених покупок" value={moneyUA(stats.transactions.find(t=>t.status==='confirmed')?.turnover)}/>
      <SummaryCard label="Нараховано бонусів" value={moneyUA(stats.bonuses.earned)} tone="violet"/>
      <SummaryCard label="Використано бонусів" value={moneyUA(stats.bonuses.spent)} tone="blue"/>
      <SummaryCard label="Баланс клієнтів" value={moneyUA(clients.reduce((sum,c)=>sum+Number(c.balance),0))} tone="orange"/>
      <SummaryCard label="Клієнтів" value={countUA(stats.clients.total)}/>
    </div><FilterStrip type="bonuses"/>
    <AdminTable columns={[{label:"Клієнт",className:"1.35fr"},{label:"Телефон",className:"1fr"},{label:"Telegram ID",className:".8fr"},{label:"Нараховано",className:".9fr"},{label:"Баланс",className:".9fr"},{label:"Списано",className:".9fr"},{label:"Остання активність",className:"1fr"}]}>
      {clients.map(c=><TableRow key={c.id} columns={["1.35fr","1fr",".8fr",".9fr",".9fr",".9fr","1fr"]}><strong>{clientFullName(c)}</strong><span>{c.phone||'Не надано'}</span><span>{c.telegram_id||'—'}</span><strong>{moneyUA(c.earned)}</strong><strong className="ad-green-number">{moneyUA(c.balance)}</strong><strong>{moneyUA(c.spent)}</strong><span>{dateUA(c.last_active_at)}</span></TableRow>)}
      {!clients.length?<div className="ad-stage2-empty-row">Бонусних операцій ще немає</div>:null}
    </AdminTable></>:null}
  </AdminShell>;
}

async function adminImageToDataUrl(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Оберіть файл зображення");
  if (file.size > 8 * 1024 * 1024) throw new Error("Фото завелике. Максимум 8 МБ");
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Не вдалося прочитати фото"));
    reader.readAsDataURL(file);
  });
  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const max = 1100;
      const ratio = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", .72));
    };
    image.onerror = () => resolve(original);
    image.src = original;
  });
}

const EMPTY_ADMIN_MAP_PLACES: never[] = [];

const ADMIN_CABINET_MODULES = [
  "Інформація про заклад",
  "Послуги закладу",
  "Графік роботи",
  "Час заїзду / виїзду",
  "Рецепція",
  "Wi‑Fi",
  "Парковка",
  "Правила проживання",
  "Сніданок",
  "Контакти",
  "Оперативні контакти",
  "Статистика переходів",
  "Налаштування",
];

function PartnerCreateScreen({ navigate }: AdminProps) {
  const [categories, setCategories] = useState<Stage2Category[]>([]);
  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [placement, setPlacement] = useState<"social" | "basic" | "premium">("social");
  const [rate, setRate] = useState("15");
  const [city, setCity] = useState("");
  const [regionName, setRegionName] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [cityPlaceId, setCityPlaceId] = useState("");
  const [streetPlaceId, setStreetPlaceId] = useState("");
  const [housePlaceId, setHousePlaceId] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(48.34535);
  const [lng, setLng] = useState(24.57855);
  const [mapSelected, setMapSelected] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapDraft, setMapDraft] = useState({ lat: 48.34535, lng: 24.57855 });
  const [geoHintError, setGeoHintError] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<Stage2GeoSuggestion[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<Stage2GeoSuggestion[]>([]);
  const [houseSuggestions, setHouseSuggestions] = useState<Stage2GeoSuggestion[]>([]);
  const [phone, setPhone] = useState("");
  const [alwaysOpen, setAlwaysOpen] = useState(false);
  const [workFrom, setWorkFrom] = useState("09:00");
  const [workTo, setWorkTo] = useState("18:00");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [telegramIds, setTelegramIds] = useState("");
  const [modules, setModules] = useState<string[]>([...ADMIN_CABINET_MODULES]);
  const [checkIn, setCheckIn] = useState("14:00");
  const [checkOut, setCheckOut] = useState("11:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ place_id: string; start_param: string; status: string; telegram_ids: string[] } | null>(null);
  const [editId, setEditId] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [success, setSuccess] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void stage2Fetch<Stage2Category[]>("/categories").then((rows) => {
      const list = rows.filter((item) => item.slug !== "emergency");
      setCategories(list);
      if (!categorySlug && list[0]?.slug) setCategorySlug(list[0].slug);
    }).catch((e) => setError(e instanceof Error ? e.message : "Не вдалося завантажити категорії"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.sessionStorage.getItem(ADMIN_EDIT_PARTNER_KEY) || "";
    if (!id) return;
    setEditId(id);
    void adminStage2Fetch<AdminPartnerDetail>(`/admin/stage2/partners/${encodeURIComponent(id)}`).then((row) => {
      const details = row.details && typeof row.details === "object" ? row.details : {};
      const attrs = row.attributes && typeof row.attributes === "object" ? row.attributes : {};
      const work = row.work_hours && typeof row.work_hours === "object" ? row.work_hours : {};
      const daily = work.daily && typeof work.daily === "object" ? work.daily as Record<string, string> : {};
      const gallery = Array.isArray(details.gallery) ? details.gallery.map(String).filter(Boolean) : [];
      setName(row.name || "");
      setCategorySlug(row.category_slug || "");
      setPlacement((attrs.placement_type === "basic" || attrs.placement_type === "premium") ? attrs.placement_type : "social");
      setRate(String(attrs.rate_percent ?? 0));
      setCity(String(details.city || "")); setRegionName(String(details.region_name || row.region_name || "")); setStreet(String(details.street || "")); setHouse(String(details.house || ""));
      setAddress(row.address || ""); setLat(Number(row.lat)); setLng(Number(row.lng)); setMapDraft({ lat: Number(row.lat), lng: Number(row.lng) }); setMapSelected(true);
      setPhone(String(row.phone || "")); setDescription(String(row.description || ""));
      setAlwaysOpen(work.always_open === true); setWorkFrom(String(daily.from || "09:00")); setWorkTo(String(daily.to || "18:00"));
      setPhotos(gallery.length ? gallery : row.image_url ? [String(row.image_url)] : []);
      setTelegramIds(Array.isArray(row.telegram_ids) ? row.telegram_ids.join(", ") : "");
      setModules(Array.isArray(details.cabinet_modules) ? details.cabinet_modules.map(String) : []);
      setCheckIn(String(details.check_in || "14:00")); setCheckOut(String(details.check_out || "11:00"));
      setEditStatus(row.status || "");
      setError("");
    }).catch((e) => setError(e instanceof Error ? e.message : "Не вдалося завантажити партнера"));
  }, []);

  useEffect(() => {
    if (cityPlaceId || city.trim().length < 1) { setCitySuggestions([]); return; }
    const timer = window.setTimeout(() => {
      void stage2Fetch<Stage2GeoSuggestion[]>(`/geo/autocomplete?input=${encodeURIComponent(city.trim())}&mode=city`)
        .then((items) => { setCitySuggestions(items); setGeoHintError(""); }).catch((e) => { setCitySuggestions([]); setGeoHintError(e instanceof Error ? e.message : "Немає з’єднання з геосервісом"); });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [city, cityPlaceId]);

  useEffect(() => {
    if (!city.trim() || streetPlaceId || street.trim().length < 1) { setStreetSuggestions([]); return; }
    const timer = window.setTimeout(() => {
      void stage2Fetch<Stage2GeoSuggestion[]>(`/geo/autocomplete?input=${encodeURIComponent(street.trim())}&mode=street&city=${encodeURIComponent(city)}`)
        .then((items) => { setStreetSuggestions(items); setGeoHintError(""); }).catch((e) => { setStreetSuggestions([]); setGeoHintError(e instanceof Error ? e.message : "Немає з’єднання з геосервісом"); });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [street, streetPlaceId, city, cityPlaceId]);

  useEffect(() => {
    if (!street.trim() || housePlaceId || house.trim().length < 1) { setHouseSuggestions([]); return; }
    const timer = window.setTimeout(() => {
      void stage2Fetch<Stage2GeoSuggestion[]>(`/geo/autocomplete?input=${encodeURIComponent(house.trim())}&mode=house&city=${encodeURIComponent(city)}&street=${encodeURIComponent(street)}`)
        .then((items) => { setHouseSuggestions(items); setGeoHintError(""); }).catch((e) => { setHouseSuggestions([]); setGeoHintError(e instanceof Error ? e.message : "Немає з’єднання з геосервісом"); });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [house, housePlaceId, city, street, streetPlaceId]);

  const chooseGeo = async (suggestion: Stage2GeoSuggestion, mode: "city" | "street" | "house") => {
    const details = await stage2Fetch<Stage2GeoDetails>(`/geo/place/${encodeURIComponent(suggestion.place_id)}`);
    if (mode === "city") {
      setCity(details.city || suggestion.main_text); setRegionName(details.region); setCityPlaceId(suggestion.place_id);
      setStreet(""); setStreetPlaceId(""); setHouse(""); setHousePlaceId(""); setAddress(""); setMapSelected(false);
      if (details.lat && details.lng) { setLat(details.lat); setLng(details.lng); setMapDraft({ lat: details.lat, lng: details.lng }); }
    } else if (mode === "street") {
      setStreet(details.street || suggestion.main_text); setStreetPlaceId(suggestion.place_id); setHouse(""); setHousePlaceId(""); setAddress(""); setMapSelected(false);
      if (details.lat && details.lng) { setLat(details.lat); setLng(details.lng); setMapDraft({ lat: details.lat, lng: details.lng }); }
    } else {
      setHouse(details.house || suggestion.main_text); setHousePlaceId(suggestion.place_id); setAddress(details.formatted_address); setMapSelected(false);
      setLat(details.lat); setLng(details.lng); setMapDraft({ lat: details.lat, lng: details.lng });
      if (details.city) setCity(details.city); if (details.region) setRegionName(details.region); if (details.street) setStreet(details.street);
    }
  };

  const confirmMap = async () => {
    try {
      const details = await stage2Fetch<Stage2GeoDetails>(`/geo/reverse?lat=${encodeURIComponent(String(mapDraft.lat))}&lng=${encodeURIComponent(String(mapDraft.lng))}`);
      setLat(mapDraft.lat); setLng(mapDraft.lng); setAddress(details.formatted_address || `${mapDraft.lat.toFixed(6)}, ${mapDraft.lng.toFixed(6)}`);
      setCity(details.city || city); setRegionName(details.region || regionName); setStreet(details.street || street); setHouse(details.house || house);
      setCityPlaceId(""); setStreetPlaceId(""); setHousePlaceId(""); setMapSelected(true); setMapOpen(false); setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося визначити адресу точки");
    }
  };

  const handlePhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const selected = Array.from(files).slice(0, 3);
      const encoded = await Promise.all(selected.map(adminImageToDataUrl));
      setPhotos(encoded); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Не вдалося завантажити фото"); }
  };

  const toggleModule = (module: string) => setModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]);
  const addModule = () => {
    const value = window.prompt("Назва нового пункту кабінету партнера:")?.trim();
    if (value && !modules.includes(value)) setModules((current) => [...current, value]);
  };

  const partnerDeepLink = (startParam: string) => {
    const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim() || "GidTourist_Bot";
    return `https://t.me/${bot}?startapp=${encodeURIComponent(startParam)}`;
  };

  const save = async (publish: boolean) => {
    setError("");
    const ids = telegramIds.split(/[\s,;]+/g).map((item) => item.trim()).filter(Boolean);
    if (!name.trim()) return setError("Вкажіть назву партнера");
    if (!categorySlug) return setError("Оберіть категорію");
    if (!ids.length || ids.some((item) => !/^\d{5,20}$/.test(item))) return setError("Вкажіть один або декілька коректних числових Telegram ID");
    if (!mapSelected && (!cityPlaceId || !streetPlaceId || !housePlaceId)) return setError("Оберіть повну адресу з підказок або вкажіть точку на мапі");
    setSaving(true);
    try {
      const requestBody = {
        name: name.trim(), category_slug: categorySlug, placement_type: placement, rate_percent: Number(rate) || 0,
        city, region_name: regionName, street, house, address, lat, lng, map_selected: mapSelected,
        phone, description, image_url: photos[0] || null, telegram_ids: ids, publish,
        work_hours: alwaysOpen ? { always_open: true } : { daily: { from: workFrom, to: workTo } },
        attributes: { partner: true, placement_type: placement, rate_percent: Number(rate) || 0 },
        subcategory: ({ hotel: "Готель", food: "Ресторан", shop: "Магазин", rest: "SPA / сауна", entertainment: "Активний відпочинок", transfer: "Трансфер / таксі" } as Record<string,string>)[categorySlug] || null,
        details: {
          address_verified: !mapSelected && Boolean(housePlaceId),
          geo_place_ids: { city: cityPlaceId, street: streetPlaceId, house: housePlaceId },
          city, region_name: regionName, street, house,
          gallery: photos,
          cabinet_modules: modules,
          check_in: checkIn,
          check_out: checkOut,
        },
      };
      if (editId) {
        await adminStage2Fetch<AdminPartnerDetail>(`/admin/stage2/partners/${encodeURIComponent(editId)}`, "", { method: "PATCH", body: JSON.stringify(requestBody) });
        rememberPartner(editId);
        if (typeof window !== "undefined") window.sessionStorage.removeItem(ADMIN_EDIT_PARTNER_KEY);
        setSuccess("Зміни партнера збережено");
        navigate("admin", "admin-partner-details");
      } else {
        const result = await adminStage2Fetch<{ place_id: string; start_param: string; status: string; telegram_ids: string[] }>("/admin/stage2/partners", "", {
          method: "POST", body: JSON.stringify(requestBody),
        });
        setCreated(result);
        rememberPartner(result.place_id);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Не вдалося створити партнера";
      setError(/too large|payload|занадто велик/i.test(message) ? "Не вдалося відправити дані: сервер ще використовує старий ліміт запиту. Оновіть backend цією версією та повторіть." : message);
    }
    finally { setSaving(false); }
  };

  const geoFields = (
    <div className="ad-admin-address-grid">
      <div className="ad-admin-autocomplete">
        <input value={city} onChange={(e) => { setCity(e.target.value); setCityPlaceId(""); setStreet(""); setStreetPlaceId(""); setHouse(""); setHousePlaceId(""); setMapSelected(false); }} placeholder="Місто / село" />
        {citySuggestions.length ? <div className="ad-admin-suggestions">{citySuggestions.map((item) => <button type="button" key={item.place_id} onClick={() => void chooseGeo(item, "city")}><strong>{item.main_text}</strong><small>{item.secondary_text}</small></button>)}</div> : null}
      </div>
      <div className="ad-admin-autocomplete">
        <input value={street} disabled={!city.trim() && !mapSelected} onChange={(e) => { setStreet(e.target.value); setStreetPlaceId(""); setHouse(""); setHousePlaceId(""); setMapSelected(false); }} placeholder={cityPlaceId || mapSelected ? "Вулиця" : "Спочатку виберіть місто"} />
        {streetSuggestions.length ? <div className="ad-admin-suggestions">{streetSuggestions.map((item) => <button type="button" key={item.place_id} onClick={() => void chooseGeo(item, "street")}><strong>{item.main_text}</strong><small>{item.secondary_text}</small></button>)}</div> : null}
      </div>
      <div className="ad-admin-autocomplete">
        <input value={house} disabled={!street.trim() && !mapSelected} onChange={(e) => { setHouse(e.target.value); setHousePlaceId(""); setMapSelected(false); }} placeholder={streetPlaceId || mapSelected ? "Будинок" : "Спочатку виберіть вулицю"} />
        {houseSuggestions.length ? <div className="ad-admin-suggestions">{houseSuggestions.map((item) => <button type="button" key={item.place_id} onClick={() => void chooseGeo(item, "house")}><strong>{item.main_text}</strong><small>{item.secondary_text}</small></button>)}</div> : null}
      </div>
      <OutlineButton onClick={() => { setMapDraft({ lat, lng }); setMapOpen(true); }}><MapPin size={16}/> Вказати на мапі</OutlineButton>
      {geoHintError ? <small className="ad-admin-address-result" role="alert">{geoHintError}</small> : null}
      {address ? <small className="ad-admin-address-result">{address}</small> : null}
    </div>
  );

  return (
    <AdminShell active="partners" navigate={navigate} contentClassName="ad-main--create">
      <AdminPageHeader
        title={editId ? "Редагування партнера" : "Створення партнера"}
        subtitle={editId ? `Редагування реальних даних партнера${editStatus ? ` · ${editStatus}` : ""}` : "Заповніть інформацію про партнера"}
        action={<div className="ad-page-actions"><OutlineButton onClick={() => { if (typeof window !== "undefined") window.sessionStorage.removeItem(ADMIN_EDIT_PARTNER_KEY); navigate("admin", "admin-partners"); }}>Скасувати</OutlineButton>{editId ? <PrimaryButton onClick={() => void save(editStatus === "approved")}><FileText size={17}/> {saving ? "Збереження…" : "Зберегти зміни"}</PrimaryButton> : <><OutlineButton onClick={() => void save(false)}>{saving ? "Збереження…" : "Зберегти"}</OutlineButton><PrimaryButton onClick={() => void save(true)}><FileText size={17}/> {saving ? "Збереження…" : "Зберегти і розмістити"}</PrimaryButton></>}</div>}
      />
      {error ? <div className="ad-create-message is-error">{error}</div> : null}
      {success ? <div className="ad-create-message">{success}</div> : null}
      {created && !editId ? <section className="ad-created-partner-card"><Stage2QrPreview value={partnerDeepLink(created.start_param)} /><div><h2>Партнера створено</h2><p>QR збережений у PostgreSQL і працюватиме після redeploy. Доступ мають лише вказані Telegram ID.</p><code>{created.start_param}</code><input readOnly value={partnerDeepLink(created.start_param)} /><div className="ad-page-actions"><OutlineButton onClick={() => void navigator.clipboard.writeText(partnerDeepLink(created.start_param))}>Копіювати посилання</OutlineButton><PrimaryButton onClick={() => navigate("admin", "admin-partners")}>До партнерів</PrimaryButton></div></div></section> : null}
      <section className="ad-create-form">
        <div className="ad-create-row ad-create-row--1"><div className="ad-create-row__label"><span>1</span><strong>Назва</strong></div><div className="ad-create-row__control"><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Введіть назву партнера" /></div></div>
        <div className="ad-create-row ad-create-row--2"><div className="ad-create-row__label"><span>2</span><strong>Категорія</strong></div><div className="ad-create-row__control"><select className="ad-native-select" value={categorySlug} onChange={(e)=>setCategorySlug(e.target.value)}><option value="">Оберіть категорію</option>{categories.map((item)=><option key={item.slug} value={item.slug}>{item.slug === "hotel" ? "Готель / точка входу" : item.name}</option>)}</select></div></div>
        <div className="ad-create-row ad-create-row--3"><div className="ad-create-row__label"><span>3</span><strong>Тип розміщення</strong></div><div className="ad-create-row__control"><div className="ad-placement-options">{([['social','Соціальний','Безкоштовне розміщення'],['basic','Базовий','Інфо про заклад + QR для гостей'],['premium','Платний / Преміум','Просування послуг та монетизація']] as const).map(([key,title,note])=><label key={key} className={placement===key?'is-selected':''} onClick={()=>setPlacement(key)}><i>{placement===key?<Check size={14}/>:null}</i><span><strong>{title}</strong><small>{note}</small></span></label>)}</div></div></div>
        <div className="ad-create-row ad-create-row--4"><div className="ad-create-row__label"><span>4</span><strong>Ставка, %</strong></div><div className="ad-create-row__control"><div className="ad-input-with-suffix"><input type="number" min="0" max="100" value={rate} onChange={(e)=>setRate(e.target.value)} /><span>%</span></div></div></div>
        <div className="ad-create-row ad-create-row--5"><div className="ad-create-row__label"><span>5</span><strong>Адреса або геолокація</strong></div><div className="ad-create-row__control">{geoFields}</div></div>
        <div className="ad-create-row ad-create-row--6"><div className="ad-create-row__label"><span>6</span><strong>Телефон</strong></div><div className="ad-create-row__control"><input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+380 (___) ___-__-__" /></div></div>
        <div className="ad-create-row ad-create-row--7"><div className="ad-create-row__label"><span>7</span><strong>Графік роботи</strong></div><div className="ad-create-row__control"><div className="ad-placement-options ad-placement-options--schedule"><label className={alwaysOpen?'is-selected':''} onClick={()=>setAlwaysOpen(true)}><i>{alwaysOpen?<Check size={14}/>:null}</i><span><strong>Цілодобово</strong></span></label><label className={!alwaysOpen?'is-selected':''} onClick={()=>setAlwaysOpen(false)}><i>{!alwaysOpen?<Check size={14}/>:null}</i><span><strong>За графіком</strong></span><input type="time" value={workFrom} onChange={(e)=>setWorkFrom(e.target.value)} onClick={(e)=>e.stopPropagation()} /><em>–</em><input type="time" value={workTo} onChange={(e)=>setWorkTo(e.target.value)} onClick={(e)=>e.stopPropagation()} /></label></div></div></div>
        <div className="ad-create-row ad-create-row--8"><div className="ad-create-row__label"><span>8</span><strong>Короткий опис</strong></div><div className="ad-create-row__control"><textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Опишіть партнера, послуги, особливості тощо..." rows={3} /></div></div>
        <div className="ad-create-row ad-create-row--9"><div className="ad-create-row__label"><span>9</span><strong>Фото</strong></div><div className="ad-create-row__control"><input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={(e)=>void handlePhotos(e.target.files)} /><button type="button" className="ad-upload-box" onClick={()=>photoInput.current?.click()}><ImagePlus size={23}/><span><strong>{photos.length ? `Завантажено фото: ${photos.length}` : "Завантажте до 3 фото партнера"}</strong><small>JPG/PNG, фото стискаються перед збереженням у БД</small></span></button>{photos.length ? <div className="ad-admin-photo-preview">{photos.map((src,i)=><div key={i}><img src={src} alt={`Фото ${i+1}`} /><button type="button" onClick={()=>setPhotos((current)=>current.filter((_,index)=>index!==i))}><Trash2 size={14}/></button></div>)}</div>:null}</div></div>
        <div className="ad-create-row ad-create-row--10"><div className="ad-create-row__label"><span>10</span><strong>Telegram ID</strong></div><div className="ad-create-row__control"><textarea value={telegramIds} onChange={(e)=>setTelegramIds(e.target.value)} rows={2} placeholder="Наприклад: 123456789, 987654321" /><small className="ad-field-note">Можна вказати декілька ID через кому, пробіл або з нового рядка. Лише ці акаунти зможуть відкрити партнерський QR.</small></div></div>
        <div className="ad-create-row ad-create-row--11"><div className="ad-create-row__label"><span>11</span><strong>Структура кабінету партнера</strong></div><div className="ad-create-row__control"><div className="ad-module-grid"><div className="ad-module-preview"><strong>Каркас</strong><small>Вмикайте/вимикайте потрібні пункти кабінету</small><span>{modules.length} модулів увімкнено</span><div className="ad-checkin-times"><label>Заїзд <input type="time" value={checkIn} onChange={(e)=>setCheckIn(e.target.value)} /></label><label>Виїзд <input type="time" value={checkOut} onChange={(e)=>setCheckOut(e.target.value)} /></label></div></div>{Array.from(new Set([...ADMIN_CABINET_MODULES,...modules])).map((m)=><label key={m} className={modules.includes(m)?'is-selected':''} onClick={()=>toggleModule(m)}><i>{modules.includes(m)?<Check size={13}/>:null}</i>{m}</label>)}<button type="button" className="ad-module-add" onClick={addModule}><Plus size={15}/> Додати пункт</button></div></div></div>
      </section>
      {mapOpen ? <div className="ad-map-modal-backdrop"><section className="ad-map-modal"><header><div><h2>Вкажіть точку на мапі</h2><p>Натисніть на потрібне місце, після чого підтвердьте вибір.</p></div><button type="button" onClick={()=>setMapOpen(false)}><X size={22}/></button></header><RealMap center={mapDraft} places={EMPTY_ADMIN_MAP_PLACES} radius={500} pickable preferLeaflet onPick={setMapDraft} /><footer><span>{mapDraft.lat.toFixed(6)}, {mapDraft.lng.toFixed(6)}</span><div className="ad-page-actions"><OutlineButton onClick={()=>setMapOpen(false)}>Скасувати</OutlineButton><PrimaryButton onClick={()=>void confirmMap()}>Обрати цю точку</PrimaryButton></div></footer></section></div> : null}
    </AdminShell>
  );
}

function ClientHeader({navigate,client}:{navigate:Navigate;client:LiveClientDetail}) {
  return <div className="ad-detail-header ad-client-detail-header"><div className="ad-detail-person"><span className="ad-client-header-avatar"><UserRound size={25}/></span><div>
    <div className="ad-detail-title-line"><h1>{clientFullName(client)}</h1><Status>Telegram</Status></div>
    <small>ID: {client.id} · Створено: {dateUA(client.created_at)} · Активність: {dateUA(client.last_active_at)}</small>
  </div></div><div className="ad-page-actions"><OutlineButton onClick={()=>navigate('admin','admin-clients')}><ArrowLeft size={16}/> До клієнтів</OutlineButton><PrimaryButton onClick={()=>navigate('admin','admin-client-history')}>Історія</PrimaryButton></div></div>;
}
function useSelectedClient(){const id=typeof window!=='undefined'?window.sessionStorage.getItem(ADMIN_SELECTED_CLIENT_KEY)||'':'';return useAdminRemote<LiveClientDetail>(`/admin/platform/clients/${encodeURIComponent(id)}`);}
function ClientDetailsScreen({navigate}:AdminProps){
  const {data:client,error}=useSelectedClient();
  return <AdminShell active="clients" navigate={navigate} contentClassName="ad-main--clients ad-main--client-detail">
    <AdminRemoteInfo error={error} data={client}/>{client?<><ClientHeader client={client} navigate={navigate}/>
    <section className="ad-detail-card ad-client-detail-card"><h2>Дані клієнта</h2><div className="ad-client-reference-grid">
      <div className="ad-client-reference-col"><p>Telegram: {client.telegram_username?`@${client.telegram_username}`:'—'}</p><p>Telegram ID: {client.telegram_id||'—'}</p><p>Телефон: {client.phone||'Не надано'}</p></div>
      <div className="ad-client-reference-col"><p>Мова: {client.selected_language||'uk'}</p><p>Остання активність: {dateUA(client.last_active_at)}</p></div>
    </div></section>
    <section className="ad-detail-card"><h2>Бонуси та активність</h2><div className="ad-summary-grid ad-summary-grid--four">
      <SummaryCard label="Доступно бонусів" value={countUA(client.balance)}/><SummaryCard label="Транзакцій" value={countUA(client.purchases.length)}/><SummaryCard label="Бронювань" value={countUA(client.bookings.length)}/><SummaryCard label="Відгуків" value={countUA(client.reviews.length)}/>
    </div></section></>:null}
  </AdminShell>;
}
function ClientHistoryScreen({navigate}:AdminProps){
  const {data:client,error}=useSelectedClient();
  return <AdminShell active="clients" navigate={navigate} contentClassName="ad-main--clients ad-main--client-history">
    <AdminRemoteInfo error={error} data={client}/>{client?<><ClientHeader client={client} navigate={navigate}/>
      <section className="ad-detail-card"><h2>Історія бонусів</h2><AdminTable columns={[{label:"Дата",className:"1fr"},{label:"Тип",className:"1fr"},{label:"Партнер",className:"1.5fr"},{label:"Сума",className:".7fr"},{label:"Статус",className:".8fr"}]}>
        {client.ledger.map(x=><TableRow key={x.id} columns={["1fr","1fr","1.5fr",".7fr",".8fr"]}><span>{dateUA(x.created_at)}</span><span>{x.entry_type}</span><span>{x.place_name||'—'}</span><strong>{countUA(x.amount)}</strong><Status>{x.status}</Status></TableRow>)}
        {!client.ledger.length?<div className="ad-stage2-empty-row">Операцій ще немає</div>:null}
      </AdminTable></section>
      <section className="ad-detail-card"><h2>Історія дій</h2><AdminTable columns={[{label:"Дата",className:"1fr"},{label:"Подія",className:"1.3fr"},{label:"Заклад",className:"1.5fr"}]}>
        {client.activity.map(x=><TableRow key={x.id} columns={["1fr","1.3fr","1.5fr"]}><span>{dateUA(x.created_at)}</span><strong>{x.event_type}</strong><span>{x.place_name||'—'}</span></TableRow>)}
        {!client.activity.length?<div className="ad-stage2-empty-row">Подій ще немає</div>:null}
      </AdminTable></section></>:null}
  </AdminShell>;
}

function PartnerDetailHeader({ navigate, partner, onEdit, onToggleStatus }: AdminProps & { partner: AdminPartnerDetail; onEdit: () => void; onToggleStatus: () => void }) {
  const created = partner.created_at ? new Date(partner.created_at).toLocaleDateString("uk-UA") : "—";
  const updated = partner.updated_at ? new Date(partner.updated_at).toLocaleDateString("uk-UA") : "—";
  return (
    <div className="ad-detail-header ad-partner-detail-header">
      <div className="ad-detail-person">
        <span className="ad-partner-header-icon"><Store size={24}/></span>
        <div>
          <div className="ad-detail-title-line"><h1>{partner.name}</h1><Status tone={partner.status === "approved" ? "green" : partner.status === "rejected" ? "red" : partner.status === "pending" ? "orange" : "gray"}>{partner.status}</Status></div>
          <small>ID партнера: {partner.id} · Створено: {created} · Оновлено: {updated}</small>
        </div>
      </div>
      <div className="ad-page-actions">
        <OutlineButton onClick={onEdit}><Edit3 size={16}/> Редагувати</OutlineButton>
        <OutlineButton onClick={onToggleStatus}>{partner.status === "approved" ? "Призупинити" : "Активувати"}</OutlineButton>
      </div>
    </div>
  );
}

function PartnerInfoItem({ icon, label, children, className = "" }: { icon: ReactNode; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`ad-partner-info-item ${className}`.trim()}>
      <span className="ad-partner-info-item__icon">{icon}</span>
      <div><small>{label}</small>{children}</div>
    </div>
  );
}

function PartnerDetailsScreen({ navigate }: AdminProps) {
  const [partner, setPartner] = useState<AdminPartnerDetail | null>(null);
  const [categories, setCategories] = useState<Stage2Category[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const id = selectedAdminPartnerId();
    if (!id) { setError("Не вибрано партнера для перегляду"); return; }
    try {
      const [row, cats] = await Promise.all([
        adminStage2Fetch<AdminPartnerDetail>(`/admin/stage2/partners/${encodeURIComponent(id)}`),
        stage2Fetch<Stage2Category[]>("/categories"),
      ]);
      setPartner(row); setCategories(cats); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Не вдалося завантажити партнера"); }
  };

  useEffect(() => { void load(); }, []);

  const {data:partnerSummary,error:summaryError}=useAdminRemote<LivePartnerSummary>(`/admin/platform/partners/${encodeURIComponent(partner?.id||"none")}/summary`);

  if (!partner) {
    return <AdminShell active="partners" navigate={navigate} contentClassName="ad-main--partner-detail"><AdminPageHeader title="Партнер" />{error ? <div className="ad-create-message is-error">{error}</div> : <div className="ad-stage2-empty-row">Завантаження даних партнера…</div>}</AdminShell>;
  }

  const details = partner.details && typeof partner.details === "object" ? partner.details : {};
  const attrs = partner.attributes && typeof partner.attributes === "object" ? partner.attributes : {};
  const work = partner.work_hours && typeof partner.work_hours === "object" ? partner.work_hours : {};
  const daily = work.daily && typeof work.daily === "object" ? work.daily as Record<string, string> : {};
  const hours = work.always_open === true ? "Цілодобово" : daily.from && daily.to ? `${daily.from} – ${daily.to}` : "Не вказано";
  const categoryName = categories.find((item) => item.slug === partner.category_slug)?.name || partner.category_slug;
  const placement = attrs.placement_type === "premium" ? "Платний / Преміум" : attrs.placement_type === "basic" ? "Базовий" : "Соціальний";
  const gallery = Array.from(new Set([...(Array.isArray(details.gallery) ? details.gallery.map(String) : []), partner.image_url || ""].filter(Boolean)));
  const modules = Array.isArray(details.cabinet_modules) ? details.cabinet_modules.map(String) : [];
  const telegramIds = Array.isArray(partner.telegram_ids) ? partner.telegram_ids.map(String) : [];
  const rate = Number(attrs.rate_percent ?? 0);

  const edit = () => { rememberPartner(partner.id, true); navigate("admin", "admin-partner-create"); };
  const toggleStatus = async () => {
    setBusy(true);
    try {
      await adminStage2Fetch(`/admin/stage2/places/${encodeURIComponent(partner.id)}/status`, "", { method: "PATCH", body: JSON.stringify({ status: partner.status === "approved" ? "draft" : "approved" }) });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Не вдалося змінити статус"); }
    finally { setBusy(false); }
  };

  return (
    <AdminShell active="partners" navigate={navigate} contentClassName="ad-main--partner-detail">
      <PartnerDetailHeader navigate={navigate} partner={partner} onEdit={edit} onToggleStatus={() => { if (!busy) void toggleStatus(); }}/>
      {error ? <div className="ad-create-message is-error">{error}</div> : null}
      <section className="ad-detail-card ad-partner-reference-card">
        <div className="ad-detail-card__title"><h2>Дані партнера</h2><Status>{partner.status === "approved" ? "Дані активні в каталозі" : "Дані ще не активні в каталозі"}</Status></div>
        <div className="ad-partner-reference-grid">
          <div className="ad-partner-reference-col">
            <PartnerInfoItem icon={<Store size={17}/>} label="Категорія"><strong>{categoryName || "—"}</strong></PartnerInfoItem>
            <PartnerInfoItem icon={<Building2 size={17}/>} label="Тип розміщення"><strong>{placement}</strong></PartnerInfoItem>
            <PartnerInfoItem icon={<Percent size={17}/>} label="Ставка, %"><strong>{rate}%</strong></PartnerInfoItem>
            <PartnerInfoItem icon={<MapPin size={17}/>} label="Адреса / геолокація"><strong>{partner.address || "Не вказано"}</strong></PartnerInfoItem>
            <PartnerInfoItem icon={<Phone size={17}/>} label="Телефон"><strong>{partner.phone || "Не вказано"}</strong></PartnerInfoItem>
          </div>
          <div className="ad-partner-reference-col">
            <PartnerInfoItem icon={<Clock3 size={17}/>} label="Графік роботи"><strong>{hours}</strong></PartnerInfoItem>
            <PartnerInfoItem icon={<FileText size={17}/>} label="Короткий опис"><strong>{partner.description || "Опис ще не додано"}</strong></PartnerInfoItem>
            <PartnerInfoItem icon={<Camera size={17}/>} label="Фото">
              {gallery.length ? <div className="ad-photo-strip ad-photo-strip--images">{gallery.slice(0,3).map((src, index)=><img src={src} alt={`Фото партнера ${index+1}`} key={`${src}-${index}`} />)}{gallery.length > 3 ? <span>+{gallery.length - 3}</span> : null}</div> : <strong>Фото ще не завантажено</strong>}
            </PartnerInfoItem>
          </div>
          <div className="ad-partner-reference-col ad-partner-reference-col--wide">
            <PartnerInfoItem icon={<Send size={17}/>} label="Telegram ID"><strong>{telegramIds.length ? telegramIds.join(", ") : "Не вказано"}</strong></PartnerInfoItem>
            <PartnerInfoItem icon={<BriefcaseBusiness size={17}/>} label="Структура кабінету партнера">
              {modules.length ? <span className="ad-tags">{modules.map(t=><i key={t}>✓ {t}</i>)}</span> : <strong>Пункти кабінету ще не налаштовані</strong>}
            </PartnerInfoItem>
            <PartnerInfoItem icon={<KeyRound size={17}/>} label="Партнерський QR"><strong>{partner.partner_start_param || "Не створено"}</strong></PartnerInfoItem>
          </div>
        </div>
      </section>
      {summaryError ? <div className="ad-create-message is-error">{summaryError}</div> : null}
      <section className="ad-detail-card"><div className="ad-section-title"><h2>Взаєморозрахунки</h2><Info size={16}/></div>
        {partnerSummary?<div className="ad-settlement-equation"><SummaryCard label="Загальний оборот" value={moneyUA(partnerSummary.turnover)}/><span>−</span><SummaryCard label="Нараховано комісії" value={moneyUA(partnerSummary.commission_due)} tone="neutral"/><span>−</span><SummaryCard label="Компенсації бонусів" value={moneyUA(partnerSummary.compensation_due)} tone="neutral"/><span>=</span><SummaryCard label="Нетто взаєморозрахунків" value={moneyUA(partnerSummary.net_due)} tone="green"/></div>:<div className="ad-stage2-empty-row">Завантаження взаєморозрахунків…</div>}
      </section>
      <section className="ad-detail-card"><div className="ad-section-title"><h2>Статистика</h2></div><div className="ad-mini-stats">{[["Перегляди",String(partner.views??0)],["QR-сканування",String(partner.qr_scans??0)],["Переходи в маршрут",String(partner.route_clicks??0)],["Дзвінки",String(partner.call_clicks??0)],["Бронювання",String(partnerSummary?.bookings_count??'—')],["Підтверджені операції",String(partnerSummary?.confirmed_purchases??'—')]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong><span>Дані з PostgreSQL</span></div>)}</div></section>
    </AdminShell>
  );
}

function PartnerHistoryScreen({ navigate }: AdminProps) {
  const [partner, setPartner] = useState<AdminPartnerDetail | null>(null);
  const {data:history,error:historyError}=useAdminRemote<LivePartnerSummary>(`/admin/platform/partners/${encodeURIComponent(partner?.id||"none")}/summary`);
  useEffect(() => {
    const id = selectedAdminPartnerId();
    if (id) void adminStage2Fetch<AdminPartnerDetail>(`/admin/stage2/partners/${encodeURIComponent(id)}`).then(setPartner).catch(() => undefined);
  }, []);
  return (
    <AdminShell active="partners" navigate={navigate} contentClassName="ad-main--partner-history">
      <AdminPageHeader title={partner ? `Історія — ${partner.name}` : "Історія партнера"} action={<OutlineButton onClick={() => navigate("admin", "admin-partner-details")}><ArrowLeft size={16}/> До партнера</OutlineButton>} />
      {historyError?<div className="ad-create-message is-error">{historyError}</div>:null}
      <section className="ad-detail-card"><h2>Історія операцій</h2><AdminTable columns={[{label:"Дата",className:"1fr"},{label:"Статус",className:"1fr"},{label:"Сума",className:"1fr"},{label:"Комісія",className:"1fr"}]}>
        {(history?.purchases||[]).map(row=><TableRow key={row.id} columns={["1fr","1fr","1fr","1fr"]}><span>{dateUA(row.created_at)}</span><Status>{row.status}</Status><strong>{moneyUA(row.amount)}</strong><span>{moneyUA(row.commission)}</span></TableRow>)}
        {history&&!history.purchases.length?<div className="ad-stage2-empty-row">Операцій ще немає</div>:null}
      </AdminTable></section>
      <section className="ad-detail-card"><h2>Активність</h2><AdminTable columns={[{label:"Дата",className:"1fr"},{label:"Подія",className:"2fr"}]}>
        {(history?.events||[]).map(row=><TableRow key={row.id} columns={["1fr","2fr"]}><span>{dateUA(row.created_at)}</span><strong>{row.event_type}</strong></TableRow>)}
        {history&&!history.events.length?<div className="ad-stage2-empty-row">Подій ще немає</div>:null}
      </AdminTable></section>
    </AdminShell>
  );
}

function SettlementsScreen({navigate}:AdminProps){
  const {data:rows,error}=useAdminRemote<LiveSettlement[]>('/admin/platform/settlements');
  const commission=(rows||[]).reduce((s,r)=>s+Number(r.commission_due),0);
  const reimbursement=(rows||[]).reduce((s,r)=>s+Number(r.compensation_due),0);
  const turnover=(rows||[]).reduce((s,r)=>s+Number(r.turnover),0);
  return <AdminShell active="settlements" navigate={navigate} contentClassName="ad-main--settlements">
    <AdminPageHeader title="Взаєморозрахунки з партнерами" subtitle="За підтвердженими операціями із PostgreSQL; рахунки й оплати вручну не вигадуються"/>
    <AdminRemoteInfo error={error} data={rows}/>{rows?<><div className="ad-summary-grid ad-summary-grid--five">
      <SummaryCard label="Оборот" value={moneyUA(turnover)}/><SummaryCard label="Комісія платформи" value={moneyUA(commission)} tone="blue"/>
      <SummaryCard label="Компенсація бонусів" value={moneyUA(reimbursement)} tone="orange"/>
      <SummaryCard label="Нетто до розрахунку" value={moneyUA(commission-reimbursement)} tone="violet"/>
      <SummaryCard label="Партнерів" value={countUA(rows.length)}/>
    </div><FilterStrip type="settlements"/><AdminTable columns={[{label:"Партнер",className:"1.6fr"},{label:"Локація",className:".9fr"},{label:"Категорія",className:".9fr"},{label:"Операцій",className:".7fr"},{label:"Оборот",className:".9fr"},{label:"Комісія",className:".9fr"},{label:"Компенсації",className:".9fr"},{label:"Нетто",className:".9fr"}]}>
      {rows.map(r=><TableRow key={r.place_id} columns={["1.6fr",".9fr",".9fr",".7fr",".9fr",".9fr",".9fr",".9fr"]}><strong>{r.name}</strong><span>{r.region_name}</span><span>{r.category_name}</span><span>{r.transactions}</span><strong>{moneyUA(r.turnover)}</strong><span>{moneyUA(r.commission_due)}</span><span>{moneyUA(r.compensation_due)}</span><strong className={Number(r.net_due)<0?'ad-red-number':'ad-green-number'}>{moneyUA(r.net_due)}</strong></TableRow>)}
      {!rows.length?<div className="ad-stage2-empty-row">Партнерів немає</div>:null}
    </AdminTable><Pagination label={`Показано ${rows.length} партнерів · Рахунки/банківські оплати не інтегровані`}/></>:null}
  </AdminShell>;
}

const statTabs = [
  ["Огляд","admin-statistics"], ["Партнери","admin-statistics-partners"], ["Клієнти","admin-statistics-clients"], ["Бонуси","admin-statistics-bonuses"], ["Розрахунки","admin-statistics-settlements"],
] as const;

function StatsTabs({ slug, navigate }: { slug: string; navigate: Navigate }) {
  return <div className="ad-stat-tabs">{statTabs.map(([label,s])=><button key={s} className={slug===s?"is-active":""} onClick={()=>navigate("admin",s)}>{label}</button>)}</div>;
}

function StatTop({ slug, navigate, title }: { slug: string; navigate: Navigate; title: string }) {
  return <><AdminPageHeader title={title} subtitle="Дані з PostgreSQL, без демонстраційних значень"/><StatsTabs slug={slug} navigate={navigate}/></>;
}

function LineChart({ variant = "green" }: { variant?: "green" | "mixed" }) {
  return <div className={`ad-line-chart ad-line-chart--${variant}`}><div className="ad-chart-grid"/><svg viewBox="0 0 600 180" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,150 40,110 80,140 120,90 160,75 200,120 240,95 280,65 320,82 360,42 400,68 440,38 480,92 520,35 560,55 600,20" fill="none" stroke="currentColor" strokeWidth="4"/><polyline className="secondary" points="0,160 40,150 80,145 120,130 160,136 200,125 240,118 280,120 320,100 360,106 400,95 440,80 480,88 520,70 560,62 600,50" fill="none" stroke="currentColor" strokeWidth="3"/></svg><div className="ad-chart-labels"><span>01.05</span><span>06.05</span><span>11.05</span><span>16.05</span><span>21.05</span><span>26.05</span><span>31.05</span></div></div>;
}

function Donut({ center, colors = "green" }: { center: string; colors?: string }) {
  return <div className={`ad-donut ad-donut--${colors}`}><span>{center}<small>Всього</small></span></div>;
}

function StatisticsOverview({navigate}:AdminProps){
  const {data:stats,error}=useAdminRemote<LiveAnalytics>('/admin/platform/analytics');
  const confirmed=stats?.transactions.find(x=>x.status==='confirmed');
  const partnerCount=stats?.places.reduce((sum,x)=>sum+x.count,0)||0;
  return <AdminShell active="statistics" navigate={navigate} contentClassName="ad-main--statistics">
    <StatTop slug="admin-statistics" navigate={navigate} title="Статистика"/><AdminRemoteInfo error={error} data={stats}/>
    {stats?<><div className="ad-summary-grid ad-summary-grid--four">
      <SummaryCard label="Оборот підтверджених покупок" value={moneyUA(confirmed?.turnover)}/>
      <SummaryCard label="Кількість клієнтів" value={countUA(stats.clients.total)} tone="violet"/>
      <SummaryCard label="Нараховано бонусів" value={moneyUA(stats.bonuses.earned)} tone="orange"/>
      <SummaryCard label="Кількість партнерів" value={countUA(partnerCount)} tone="blue"/>
    </div><FilterStrip type="stats"/><div className="ad-stats-dashboard">
      <section className="ad-chart-card ad-chart-card--wide"><h2>Оборот за останні 30 днів</h2>
        {stats.series.length?stats.series.map(item=><div className="ad-key-value" key={item.day}><span>{item.day}</span><strong>{moneyUA(item.amount)}</strong></div>):<div className="ad-stage2-empty-row">Підтверджених операцій за період немає</div>}
      </section>
      <section className="ad-chart-card"><h2>Оборот за категоріями</h2>{stats.categories.length?stats.categories.map(item=><div className="ad-key-value" key={item.name}><span>{item.name}</span><strong>{moneyUA(item.amount)}</strong></div>):<p>Даних поки немає</p>}</section>
      <section className="ad-chart-card"><h2>Партнери по локаціях</h2>{stats.locations.length?stats.locations.map(item=><div className="ad-key-value" key={item.name}><span>{item.name}</span><strong>{countUA(item.total)}</strong></div>):<p>Даних поки немає</p>}</section>
      <section className="ad-chart-card"><h2>Топ партнерів за оборотом</h2>{stats.top_partners.length?stats.top_partners.map(item=><div className="ad-key-value" key={item.name}><span>{item.name}</span><strong>{moneyUA(item.turnover)}</strong></div>):<p>Даних поки немає</p>}</section>
      <section className="ad-chart-card ad-client-activity-card"><h2>Активність клієнтів</h2><div className="ad-summary-grid ad-summary-grid--four">
        <SummaryCard label="Нові клієнти (30 днів)" value={countUA(stats.clients.new_clients)}/>
        <SummaryCard label="Активні клієнти (30 днів)" value={countUA(stats.clients.active_clients)}/>
        <SummaryCard label="Підтверджено покупок" value={countUA(confirmed?.count)}/>
        <SummaryCard label="Бронювань" value={countUA(stats.bookings.reduce((sum,b)=>sum+b.count,0))}/>
      </div></section>
      <section className="ad-chart-card"><h2>Бонуси та події</h2><div className="ad-key-value"><span>Нараховано</span><strong>{moneyUA(stats.bonuses.earned)}</strong></div><div className="ad-key-value"><span>Використано</span><strong>{moneyUA(stats.bonuses.spent)}</strong></div>{stats.events.map(e=><div className="ad-key-value" key={e.event_type}><span>{e.event_type}</span><strong>{countUA(e.count)}</strong></div>)}</section>
    </div></>:null}
  </AdminShell>;
}
function StatsMetricGrid({kind,stats}:{kind:'partners'|'clients'|'bonuses'|'settlements';stats:LiveAnalytics}){
  const approved=stats.places.find(x=>x.status==='approved')?.count||0;
  const partners=stats.places.reduce((sum,x)=>sum+x.count,0);
  const confirmed=stats.transactions.find(x=>x.status==='confirmed');
  const data=kind==='partners'?[['Усього партнерів',countUA(partners)],['Підтверджені',countUA(approved)],['На модерації',countUA(stats.places.find(x=>x.status==='pending')?.count)],['Інші статуси',countUA(partners-approved-(stats.places.find(x=>x.status==='pending')?.count||0))]]:
    kind==='clients'?[['Усього клієнтів',countUA(stats.clients.total)],['Нові за 30 днів',countUA(stats.clients.new_clients)],['Активні за 30 днів',countUA(stats.clients.active_clients)],['Підтверджено покупок',countUA(confirmed?.count)]]:
    kind==='bonuses'?[['Нараховано бонусів',moneyUA(stats.bonuses.earned)],['Використано бонусів',moneyUA(stats.bonuses.spent)],['Залишок (обліковий)',moneyUA(Number(stats.bonuses.earned)-Number(stats.bonuses.spent))],['Кількість покупок',countUA(confirmed?.count)]]:
    [['Оборот',moneyUA(confirmed?.turnover)],['Покупок',countUA(confirmed?.count)],['Нараховано бонусів',moneyUA(stats.bonuses.earned)],['Списано бонусів',moneyUA(stats.bonuses.spent)]];
  return <div className="ad-summary-grid ad-summary-grid--four">{data.map(([label,value])=><SummaryCard key={label} label={label} value={value}/>)}</div>;
}
function StatisticsSubscreen({navigate,kind}:AdminProps & {kind:'partners'|'clients'|'bonuses'|'settlements'}){
  const {data:stats,error}=useAdminRemote<LiveAnalytics>('/admin/platform/analytics');
  const titles={partners:'Партнери',clients:'Клієнти',bonuses:'Бонуси',settlements:'Розрахунки'};
  return <AdminShell active="statistics" navigate={navigate} contentClassName="ad-main--statistics">
    <StatTop slug={`admin-statistics-${kind}`} navigate={navigate} title={`Статистика — ${titles[kind]}`}/><AdminRemoteInfo error={error} data={stats}/>
    {stats?<><StatsMetricGrid kind={kind} stats={stats}/><FilterStrip type="stats"/><div className="ad-stats-subgrid">
      <section className="ad-chart-card ad-chart-card--wide"><h2>Фактичні події</h2>{stats.events.length?stats.events.map(e=><div className="ad-key-value" key={e.event_type}><span>{e.event_type}</span><strong>{countUA(e.count)}</strong></div>):<p>Подій ще немає</p>}</section>
      <section className="ad-chart-card"><h2>Партнери по регіонах</h2>{stats.locations.map(x=><div className="ad-key-value" key={x.name}><span>{x.name}</span><strong>{countUA(x.total)}</strong></div>)}</section>
      <section className="ad-chart-card"><h2>Бронювання за статусами</h2>{stats.bookings.map(x=><div className="ad-key-value" key={x.status}><span>{x.status}</span><strong>{countUA(x.count)}</strong></div>)}</section>
      <section className="ad-chart-card"><h2>Покупки за статусами</h2>{stats.transactions.map(x=><div className="ad-key-value" key={x.status}><span>{x.status}</span><strong>{moneyUA(x.turnover)}</strong></div>)}</section>
    </div></>:null}
  </AdminShell>;
}

type SettingsSlug =
  | "admin-settings"
  | "admin-settings-general"
  | "admin-settings-company"
  | "admin-settings-partners"
  | "admin-settings-bonuses"
  | "admin-settings-notifications"
  | "admin-settings-security"
  | "admin-settings-integrations"
  | "admin-settings-audit";

const settingsTabs: Array<{ label: string; slug: SettingsSlug }> = [
  { label: "Загальні", slug: "admin-settings-general" },
  { label: "Компанія", slug: "admin-settings-company" },
  { label: "Партнери та комісії", slug: "admin-settings-partners" },
  { label: "Бонусна система", slug: "admin-settings-bonuses" },
  { label: "Сповіщення", slug: "admin-settings-notifications" },
  { label: "Безпека", slug: "admin-settings-security" },
  { label: "Інтеграції", slug: "admin-settings-integrations" },
  { label: "Журнал дій", slug: "admin-settings-audit" },
];

function SettingsTabs({ active, navigate }: { active: SettingsSlug; navigate: Navigate }) {
  const normalized = active === "admin-settings" ? "admin-settings-general" : active;
  return (
    <nav className="ad-settings-tabs">
      {settingsTabs.map((tab) => (
        <button
          type="button"
          key={tab.slug}
          className={normalized === tab.slug ? "is-active" : ""}
          onClick={() => navigate("admin", tab.slug)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function SettingsTop({ title, active, navigate }: { title: string; active: SettingsSlug; navigate: Navigate }) {
  return (
    <>
      <AdminPageHeader
        title={`Налаштування — ${title}`}
        action={<div className="ad-page-actions"><DateRange /><PrimaryButton><Download size={17}/> Експорт <ChevronDown size={15}/></PrimaryButton></div>}
      />
      <SettingsTabs active={active} navigate={navigate} />
    </>
  );
}

function SettingToggle({ label, on = true, note }: { label: string; on?: boolean; note?: string }) {
  return (
    <div className="ad-setting-toggle-row">
      <div><strong>{label}</strong>{note ? <small>{note}</small> : null}</div>
      <button type="button" className={`ad-toggle ${on ? "is-on" : ""}`} aria-label={label}><i /></button>
    </div>
  );
}

function SettingField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <label className={`ad-setting-field ${wide ? "is-wide" : ""}`}>
      <span>{label}</span>
      <div>{value}<ChevronDown size={15}/></div>
    </label>
  );
}

function SettingsPanel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`ad-settings-panel ${className}`.trim()}><h2>{title}</h2>{children}</section>;
}

function GeneralSettingsScreen({ navigate }: AdminProps) {
  return (
    <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings">
      <SettingsTop title="Загальні" active="admin-settings-general" navigate={navigate} />
      <div className="ad-settings-layout ad-settings-layout--two">
        <SettingsPanel title="Загальні налаштування">
          <div className="ad-setting-fields-grid">
            <SettingField label="Мова інтерфейсу" value="Українська" />
            <SettingField label="Часовий пояс" value="(UTC+03:00) Київ" />
            <SettingField label="Формат дати" value="DD.MM.YYYY" />
            <SettingField label="Валюта" value="UAH (₴) – Гривня" />
          </div>
          <div className="ad-settings-toggle-stack">
            <SettingToggle label="Показувати архівних партнерів" />
            <SettingToggle label="Показувати неактивних клієнтів" />
            <SettingToggle label="Автоматичне оновлення даних" />
          </div>
        </SettingsPanel>
        <SettingsPanel title="Логотип та брендування">
          <div className="ad-branding-box">
            <div className="ad-brand-logo"><AdminLogo /></div>
            <div className="ad-brand-actions"><OutlineButton><Upload size={16}/> Змінити логотип</OutlineButton><button type="button" className="ad-danger-outline"><Trash2 size={15}/> Видалити</button></div>
          </div>
          <div className="ad-color-row"><span>Основний колір</span><b className="is-green"/> <strong>#16A34A</strong></div>
          <div className="ad-color-row"><span>Додатковий колір</span><b className="is-dark"/> <strong>#1F2937</strong></div>
        </SettingsPanel>
        <SettingsPanel title="Локації">
          <p className="ad-settings-help">Керуйте локаціями, у яких працюють ваші партнери.</p>
          <div className="ad-settings-table">
            <div className="ad-settings-table__head"><span>Локація</span><span>Кількість партнерів</span><span>Дії</span></div>
            {[['Яремче','42'],['Микуличин','28'],['Татарів','35'],['Ворохта','37'],['Поляниця','31'],['Інше','13']].map(([name,count])=><div key={name}><span>⋮⋮ &nbsp; {name}</span><span>{count}</span><span className="ad-mini-actions"><button><Edit3 size={14}/></button><button className="is-danger"><Trash2 size={14}/></button></span></div>)}
          </div>
          <OutlineButton><Plus size={16}/> Додати локацію</OutlineButton>
        </SettingsPanel>
        <SettingsPanel title="Інші налаштування">
          <SettingToggle label="Дозволити реєстрацію нових партнерів" />
          <SettingToggle label="Потрібне підтвердження партнера адміністратором" />
          <SettingToggle label="Дозволити партнерам редагувати свої дані" />
          <SettingToggle label="Відображати рейтинг партнера" />
          <SettingToggle label="Показувати підказки в інтерфейсі" />
          <SettingToggle label="Режим технічного обслуговування" on={false} />
        </SettingsPanel>
        <SettingsPanel title="Зберігання даних" className="ad-settings-panel--storage">
          <div className="ad-setting-fields-grid"><SettingField label="Термін зберігання логів" value="12 місяців"/><SettingField label="Термін зберігання архівних даних" value="24 місяці"/></div>
          <div className="ad-info-banner"><Info size={17}/> Після завершення терміну дані будуть автоматично архівовані або видалені.</div>
        </SettingsPanel>
        <SettingsPanel title="Дії">
          <div className="ad-settings-actions"><OutlineButton><Download size={16}/> Експорт налаштувань</OutlineButton><button type="button" className="ad-danger-outline"><RefreshCcw size={16}/> Скинути налаштування</button></div>
          <div className="ad-warning-banner">Скидання налаштувань поверне всі параметри до значень за замовчуванням.</div>
        </SettingsPanel>
      </div>
    </AdminShell>
  );
}

function CompanySettingsScreen({ navigate }: AdminProps) {
  return (
    <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings">
      <SettingsTop title="Компанія" active="admin-settings-company" navigate={navigate} />
      <div className="ad-settings-layout ad-settings-layout--two">
        <SettingsPanel title="Інформація про компанію">
          <div className="ad-setting-fields-grid">
            <SettingField label="Назва компанії" value="Gid Tourist"/><SettingField label="Email" value="info@gidtourist.ua"/>
            <SettingField label="Юридична назва" value="ФОП Іваненко Іван Іванович"/><SettingField label="Телефон" value="+38 (097) 123-45-67"/>
            <SettingField label="ЄДРПОУ / ІПН" value="1234567890"/><SettingField label="Вебсайт" value="https://gidtourist.ua"/>
            <SettingField label="Країна" value="Україна"/><SettingField label="Адреса" value="м. Яремче, вул. Свободи, 123"/>
          </div>
        </SettingsPanel>
        <SettingsPanel title="Банківські реквізити">
          <div className="ad-kv-list">{[['IBAN','UA12 3456 7890 1234 5678 9012 3456 789'],['Банк','АТ КБ “ПриватБанк”'],['ЄДРПОУ банку','14360570']].map(([l,v])=><div key={l}><span>{l}</span><strong>{v}</strong></div>)}</div>
          <h3>Додаткові реквізити</h3><div className="ad-kv-list">{[['Платник ПДВ','Так'],['Ставка ПДВ','20%'],['Тип діяльності','Надання туристичних послуг'],['Примітка','Доступна за співпраці']].map(([l,v])=><div key={l}><span>{l}</span><strong>{v}</strong></div>)}</div>
        </SettingsPanel>
        <SettingsPanel title="Додаткова інформація"><div className="ad-setting-fields-grid"><SettingField label="Часовий пояс" value="(UTC+03:00) Київ"/><SettingField label="Формат дати" value="DD.MM.YYYY"/><SettingField label="Валюта" value="UAH (₴) – Гривня"/><SettingField label="Формат часу" value="24 години (HH:mm)"/><SettingField label="Мова інтерфейсу" value="Українська"/><SettingField label="Початок робочого тижня" value="Понеділок"/></div></SettingsPanel>
        <SettingsPanel title="Документи компанії">
          <div className="ad-doc-list">{[['Свідоцтво про реєстрацію ФОП','svidotstvo_fop.pdf'],['Виписка з ЄДР','vypyska_edr.pdf'],['Платник ПДВ','pdv.pdf'],['Статут / Положення','statut.pdf']].map(([doc,file])=><div key={doc}><FileText size={16}/><span><strong>{doc}</strong><small>{file}</small></span><small>12.01.2024</small><button><Download size={14}/></button><button className="is-danger"><Trash2 size={14}/></button></div>)}</div>
          <OutlineButton><Plus size={16}/> Додати документ</OutlineButton>
        </SettingsPanel>
        <SettingsPanel title="Логотип та брендування"><div className="ad-branding-box"><div className="ad-brand-logo"><AdminLogo /></div><div className="ad-brand-actions"><OutlineButton><Upload size={16}/> Змінити логотип</OutlineButton><button className="ad-danger-outline"><Trash2 size={15}/> Видалити</button></div></div><div className="ad-color-row"><span>Основний колір</span><b className="is-green"/><strong>#16A34A</strong></div><div className="ad-color-row"><span>Додатковий колір</span><b className="is-dark"/><strong>#1F2937</strong></div></SettingsPanel>
        <SettingsPanel title="Налаштування брендування"><SettingToggle label="Відображати логотип у рахунках та чеках"/><SettingToggle label="Використовувати фірмові кольори в інтерфейсі"/><div className="ad-info-banner"><Info size={17}/> Зміни брендування застосовуються до всіх документів та сторінок адміністративної панелі.</div></SettingsPanel>
      </div>
    </AdminShell>
  );
}

function PartnerCommissionSettingsScreen({ navigate }: AdminProps) {
  const statuses = [['Активний','Партнер активний та співпрацює','42','green'],['На перевірці','Заявка партнера на розгляді','5','orange'],['Призупинений','Співпраця тимчасово призупинена','3','blue'],['Неактивний','Партнер неактивний','7','gray'],['Заблокований','Доступ партнера заблоковано','2','red']] as const;
  return (
    <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings">
      <SettingsTop title="Партнери та комісії" active="admin-settings-partners" navigate={navigate}/>
      <div className="ad-settings-layout ad-settings-layout--two">
        <SettingsPanel title="Умови комісії (за замовчуванням)" className="ad-settings-panel--commission-default"><div className="ad-setting-fields-grid"><SettingField label="Тип комісії" value="Відсоток від суми замовлення"/><SettingField label="Розмір комісії" value="10 %"/></div><div className="ad-info-banner"><Info size={17}/> Індивідуальні умови комісії для партнерів можна налаштувати на сторінці партнера.</div></SettingsPanel>
        <SettingsPanel title="Додаткові налаштування"><SettingToggle label="Потрібне підтвердження партнера адміністратором"/><SettingToggle label="Автоматично призначати стандартну комісію"/><SettingToggle label="Дозволяти партнерам бачити свою комісію"/><SettingToggle label="Показувати партнерам борг у кабінеті"/></SettingsPanel>
        <SettingsPanel title="Статуси партнерів"><div className="ad-status-settings-list">{statuses.map(([name,desc,count,tone])=><div key={name}><span className={`ad-status-dot is-${tone}`}/><strong>{name}</strong><small>{desc}</small><b>{count}</b><button><Edit3 size={14}/></button></div>)}</div><OutlineButton><Plus size={15}/> Додати статус</OutlineButton></SettingsPanel>
        <SettingsPanel title="Типи партнерів"><div className="ad-settings-table ad-settings-table--partner-types"><div className="ad-settings-table__head"><span>Тип</span><span>Опис</span><span>Комісія</span><span>Дія</span></div>{[['Готелі','Проживання','10%'],['Ресторани','Харчування','8%'],['Екскурсії','Тури та екскурсії','12%'],['Транспорт','Трансфери, таксі','7%'],['Інші','Інші послуги','10%']].map(r=><div key={r[0]}><strong>{r[0]}</strong><span>{r[1]}</span><strong>{r[2]}</strong><span className="ad-mini-actions"><button><Edit3 size={14}/></button><button className="is-danger"><Trash2 size={14}/></button></span></div>)}</div><OutlineButton><Plus size={15}/> Додати тип</OutlineButton></SettingsPanel>
      </div>
      <SettingsPanel title="Додаткові умови комісії" className="ad-settings-panel--full"><div className="ad-commission-cards"><div><span>Мінімальна сума замовлення</span><strong>1 000 <small>грн</small></strong><p>Комісія нараховується тільки при перевищенні суми</p></div><div><span>Термін дії комісії</span><strong>365 <small>днів</small></strong><p>Комісія дійсна протягом зазначеного періоду</p></div><div><SettingToggle label="Бонус за активність"/><strong>2 <small>%</small></strong><p>Додатковий відсоток до комісії за активність</p></div><div><SettingToggle label="Комісія за передоплату"/><strong>1 <small>%</small></strong><p>Додатковий відсоток за оплату наперед</p></div></div></SettingsPanel>
    </AdminShell>
  );
}

function BonusSettingsScreen({ navigate }: AdminProps) {
  return (
    <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings">
      <SettingsTop title="Бонусна система" active="admin-settings-bonuses" navigate={navigate}/>
      <SettingsPanel title="Основні налаштування бонусної системи" className="ad-settings-panel--full">
        <div className="ad-setting-fields-grid ad-setting-fields-grid--three"><SettingField label="Тип нарахування бонусів" value="Відсоток від суми"/><SettingField label="Розмір бонусу" value="5 %"/><SettingField label="Валюта бонусів" value="Гривня (UAH)"/><SettingField label="Мінімальна сума нарахування" value="100 грн"/><SettingField label="Мінімальна сума списання" value="100 грн"/><SettingField label="Термін дії бонусів" value="365 днів"/></div>
        <div className="ad-settings-toggle-stack"><SettingToggle label="Нараховувати бонуси за акційні товари"/><SettingToggle label="Списання бонусів частинами"/><SettingToggle label="Заборонити списання бонусів при оплаті алкоголю та тютюну"/></div>
      </SettingsPanel>
      <SettingsPanel title="Рівні бонусної системи" className="ad-settings-panel--full"><div className="ad-settings-table ad-settings-table--bonus"><div className="ad-settings-table__head"><span>Рівень</span><span>Назва</span><span>Умова (сума покупок)</span><span>Бонус</span><span>Статус</span><span>Дії</span></div>{[['1','Бронзовий','від 0 грн','5%'],['2','Срібний','від 10 000 грн','7%'],['3','Золотий','від 25 000 грн','10%'],['4','Платиновий','від 50 000 грн','12%']].map(r=><div key={r[0]}><span>{r[0]}</span><strong>{r[1]}</strong><span>{r[2]}</span><strong>{r[3]}</strong><Status>Активний</Status><span className="ad-mini-actions"><button><Edit3 size={14}/></button><button className="is-danger"><Trash2 size={14}/></button></span></div>)}</div><OutlineButton><Plus size={15}/> Додати рівень</OutlineButton></SettingsPanel>
    </AdminShell>
  );
}

function NotificationSettingsScreen({ navigate }: AdminProps) {
  const rows = [
    ['Реєстрація нового партнера',[true,false,true,true]],['Підтвердження партнера',[true,false,true,true]],['Нове замовлення',[true,true,true,true]],['Комісія нарахована',[true,false,true,true]],['Виплата комісії',[true,true,true,true]],['Низький баланс партнера',[true,true,true,false]],['Системні повідомлення',[true,false,false,true]],
  ] as const;
  return (
    <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings">
      <SettingsTop title="Сповіщення" active="admin-settings-notifications" navigate={navigate}/>
      <div className="ad-settings-layout ad-settings-layout--notifications">
        <SettingsPanel title="Канали сповіщень"><p className="ad-settings-help">Виберіть канали, через які ви хочете отримувати сповіщення</p><div className="ad-channel-list"><div><Mail size={21}/><span><strong>Email</strong><small>info@gidtourist.ua</small></span><button className="ad-toggle is-on"><i/></button></div><div><Smartphone size={21}/><span><strong>SMS</strong><small>+38 (097) 123-45-67</small></span><button className="ad-toggle is-on"><i/></button></div><div><span className="ad-telegram-icon">➤</span><span><strong>Telegram</strong><small>@gid_tourist_bot</small></span><button className="ad-toggle is-on"><i/></button></div><div><Bell size={21}/><span><strong>Push-повідомлення</strong><small>Увімкнено в браузері</small></span><button className="ad-toggle is-on"><i/></button></div></div></SettingsPanel>
        <SettingsPanel title="Типи сповіщень"><div className="ad-notification-matrix"><div className="ad-notification-matrix__head"><span>Тип сповіщення</span><span>Email</span><span>SMS</span><span>Telegram</span><span>Push</span></div>{rows.map(([name,values])=><div key={name}><strong>{name}</strong>{values.map((v,i)=><span key={i} className={`ad-checkbox ${v?'is-checked':''}`}>{v?'✓':''}</span>)}</div>)}</div></SettingsPanel>
        <SettingsPanel title="Додаткові налаштування"><div className="ad-notification-extra"><SettingToggle label="Отримувати зведення за день"/><SelectBox value="18:00"/><SettingToggle label="Отримувати зведення за тиждень" on={false}/><SelectBox value="Понеділок"/><SettingToggle label="Не надсилати сповіщення вночі"/><div className="ad-time-range"><span>22:00</span><b>–</b><span>08:00</span></div></div></SettingsPanel>
        <SettingsPanel title="Тестове сповіщення"><p className="ad-settings-help">Надіслати тестове сповіщення на всі активні канали</p><PrimaryButton>Надіслати тест</PrimaryButton></SettingsPanel>
      </div>
    </AdminShell>
  );
}

function SecuritySettingsScreen({ navigate }: AdminProps) {
  return (
    <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings">
      <SettingsTop title="Безпека" active="admin-settings-security" navigate={navigate}/>
      <div className="ad-settings-layout ad-settings-layout--two">
        <SettingsPanel title="Вхід та пароль"><SettingToggle label="Двофакторна автентифікація для адміністраторів"/><SettingToggle label="Вимагати складний пароль"/><SettingToggle label="Блокувати вхід після 5 невдалих спроб"/><div className="ad-setting-fields-grid"><SettingField label="Термін дії пароля" value="90 днів"/><SettingField label="Тривалість сесії" value="12 годин"/></div></SettingsPanel>
        <SettingsPanel title="Доступ адміністраторів"><div className="ad-security-users">{[['А','Адміністратор','admin@gidtourist.ua','Повний доступ'],['МІ','Марія Іванова','maria@gidtourist.ua','Фінанси, партнери'],['СП','Сергій Петренко','serhii@gidtourist.ua','Партнери, статистика']].map(r=><div key={r[2]}><span>{r[0]}</span><div><strong>{r[1]}</strong><small>{r[2]}</small></div><Status>{r[3]}</Status><button><Edit3 size={14}/></button></div>)}</div><OutlineButton><Plus size={15}/> Додати адміністратора</OutlineButton></SettingsPanel>
        <SettingsPanel title="Обмеження доступу"><SettingToggle label="Дозволити вхід тільки з перевірених IP" on={false}/><SettingToggle label="Вести журнал усіх входів"/><SettingToggle label="Сповіщати про вхід з нового пристрою"/><SettingToggle label="Автоматично завершувати неактивні сесії"/></SettingsPanel>
        <SettingsPanel title="Активні сесії"><div className="ad-kv-list">{[['Chrome / Windows','Київ · 192.168.1.1 · Зараз'],['Telegram WebApp / iOS','Яремче · 192.168.1.15 · 2 год тому'],['Safari / macOS','Львів · 192.168.1.21 · Вчора']].map(([device,meta])=><div key={device}><span>{device}<small>{meta}</small></span><button className="ad-danger-outline">Завершити</button></div>)}</div></SettingsPanel>
      </div>
    </AdminShell>
  );
}

function IntegrationBrand({ type }: { type: "1c" | "vchasno" | "mailchimp" | "telegram" | "analytics" }) {
  if (type === "1c") return <span className="ad-integration-brand is-1c"><b>1C</b></span>;
  if (type === "vchasno") return <span className="ad-integration-brand is-vchasno"><i/><i/></span>;
  if (type === "mailchimp") return <span className="ad-integration-brand is-mailchimp"><b>M</b></span>;
  if (type === "telegram") return <span className="ad-integration-brand is-telegram"><Send size={16}/></span>;
  return <span className="ad-integration-brand is-analytics"><i/><i/><i/></span>;
}

function IntegrationsSettingsScreen({ navigate }: AdminProps) {
  const items = [
    ['1C:Підприємство','Обмін даними з 1С','Підключено','31.05.2024 12:45','1c'],
    ['Вчасно.Каса','Фіскалізація чеків','Підключено','31.05.2024 12:40','vchasno'],
    ['Mailchimp','Email-розсилки','Підключено','31.05.2024 11:20','mailchimp'],
    ['Telegram Bot','Telegram-бот для сповіщень','Підключено','31.05.2024 10:15','telegram'],
    ['Google Analytics','Аналітика та статистика','Не підключено','—','analytics'],
  ] as const;
  return (
    <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings ad-main--integrations">
      <SettingsTop title="Інтеграції" active="admin-settings-integrations" navigate={navigate}/>
      <SettingsPanel title="Інтеграції" className="ad-settings-panel--full ad-integrations-reference-panel">
        <div className="ad-integrations-table ad-integrations-table--reference">
          <div className="ad-integrations-table__head"><span>Сервіс</span><span>Опис</span><span>Статус</span><span>Остання синхронізація</span><span>Дії</span></div>
          {items.map(([service,desc,status,last,type])=><div key={service}>
            <span className="ad-integration-service"><IntegrationBrand type={type}/><strong>{service}</strong></span>
            <span>{desc}</span>
            <Status tone={status==='Підключено'?'green':'gray'}>{status}</Status>
            <span>{last}</span>
            <span className="ad-mini-actions"><button><Settings size={16}/></button>{status==='Підключено'?<button className="is-danger"><Trash2 size={16}/></button>:null}</span>
          </div>)}
        </div>
        <OutlineButton><Plus size={16}/> Додати інтеграцію</OutlineButton>
      </SettingsPanel>
      <div className="ad-settings-layout ad-settings-layout--two ad-integration-bottom-panels">
        <SettingsPanel title="API ключі"><label className="ad-api-key"><span>Ваш API ключ</span><div>•••••••••••••••••••• <Eye size={17}/></div></label><OutlineButton><RefreshCcw size={16}/> Згенерувати новий</OutlineButton></SettingsPanel>
        <SettingsPanel title="Документація API"><p className="ad-settings-help">Інтегруйте з системою через API</p><OutlineButton>Перейти до документації</OutlineButton></SettingsPanel>
      </div>
    </AdminShell>
  );
}

function AuditSettingsScreen({ navigate }: AdminProps) {
  const rows = [
    ['31.05.2024 12:45:32','Адміністратор','Підтверджено партнера “Рибак. М’ясна історія”','Партнери','192.168.1.1'],
    ['31.05.2024 12:40:18','Марія Іванова','Нараховано комісію партнеру “Верне Тур” (1 250 грн)','Взаєморозрахунки','192.168.1.15'],
    ['31.05.2024 12:35:05','Сергій Петренко','Створено нового партнера “Карпати Екскурс”','Партнери','192.168.1.18'],
    ['31.05.2024 11:22:47','Адміністратор','Змінено налаштування комісії для типу “Екскурсії”','Налаштування','192.168.1.1'],
    ['31.05.2024 10:15:33','Марія Іванова','Експорт звіту по взаєморозрахунках','Взаєморозрахунки','192.168.1.15'],
    ['31.05.2024 09:40:11','Сергій Петренко','Вхід у систему','Система','192.168.1.18'],
    ['31.05.2024 09:12:09','Марія Іванова','Оновлено дані партнера “Говерла Тур”','Партнери','192.168.1.15'],
    ['31.05.2024 08:55:23','Адміністратор','Налаштовано інтеграцію 1С','Інтеграції','192.168.1.1'],
  ];
  return (
    <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings">
      <SettingsTop title="Журнал дій" active="admin-settings-audit" navigate={navigate}/>
      <SettingsPanel title="Журнал дій" className="ad-settings-panel--full">
        <div className="ad-audit-filters"><SettingField label="Період" value="01.05.2024 – 31.05.2024"/><SettingField label="Користувач" value="Всі користувачі"/><SettingField label="Дія" value="Всі дії"/><SettingField label="Сервіс" value="Всі сервіси"/><OutlineButton><Filter size={16}/> Фільтри</OutlineButton></div>
        <div className="ad-audit-table"><div className="ad-audit-table__head"><span>Дата і час</span><span>Користувач</span><span>Дія</span><span>Сервіс / Розділ</span><span>IP-адреса</span></div>{rows.map(r=><div key={r[0]}>{r.map((v,i)=><span key={i}>{v}</span>)}</div>)}</div>
        <div className="ad-audit-footer"><span>Показано 1–8 з 256 записів</span><div className="ad-pagination-mini"><button>‹</button><button className="is-active">1</button><button>2</button><button>3</button><span>…</span><button>32</button><button>›</button></div></div>
      </SettingsPanel>
    </AdminShell>
  );
}


type QrConstructor = new (element: HTMLElement, options: { text: string; width: number; height: number; correctLevel?: number }) => unknown;

declare global {
  interface Window { QRCode?: QrConstructor & { CorrectLevel?: { M?: number } }; __gidQrCodePromise?: Promise<QrConstructor>; }
}

function Stage2QrPreview({ value }: { value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!value || !ref.current) return;
    let cancelled = false;
    const load = () => {
      if (window.QRCode) return Promise.resolve(window.QRCode);
      if (window.__gidQrCodePromise) return window.__gidQrCodePromise;
      window.__gidQrCodePromise = new Promise<QrConstructor>((resolve, reject) => {
        const existing = document.querySelector('script[data-gid-qrcode="1"]') as HTMLScriptElement | null;
        const script = existing ?? document.createElement("script");
        if (!existing) {
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
          script.async = true;
          script.dataset.gidQrcode = "1";
          document.head.appendChild(script);
        }
        const done = () => window.QRCode ? resolve(window.QRCode) : reject(new Error("QRCode did not initialize"));
        if (window.QRCode) done();
        else {
          script.addEventListener("load", done, { once: true });
          script.addEventListener("error", () => reject(new Error("Failed to load QR generator")), { once: true });
        }
      });
      return window.__gidQrCodePromise;
    };
    ref.current.innerHTML = "";
    void load().then((QRCode) => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      new QRCode(ref.current, { text: value, width: 180, height: 180, correctLevel: window.QRCode?.CorrectLevel?.M });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [value]);
  return <div className="ad-stage2-qr-preview__code" ref={ref} aria-label="QR-код точки входу" />;
}


const TEMPLATE_AMENITY_OPTIONS = [
  "Номери", "Паркінг", "Wi‑Fi", "Сніданок", "Меню", "Дитяче меню", "Мангал", "SPA",
  "Рушники", "Душ", "Гід", "Трансфер", "Групи", "Активності", "Інструктор",
  "Оплата карткою", "Самовивіз", "Багаж", "Дитяче крісло", "Подарунки", "Локальні товари",
];

const TEMPLATE_SERVICE_OPTIONS = [
  "Сніданок", "Прибирання", "Сауна", "Басейн", "Трансфер", "Мангал", "Чан", "Основне меню",
  "Сніданки", "Доставка", "Їжа з собою", "Дитяче меню", "Кава", "Десерти", "Напої", "Закуски",
  "Жива музика", "Продаж у магазині", "Самовивіз", "Сувеніри", "Подарунки", "Локальні товари",
  "Ліки", "Товари для здоровʼя", "Масаж", "Екскурсія", "Гід", "Квадроцикли", "Рафтинг",
  "Зіплайн", "Джип-тур", "Таксі", "Оренда авто",
];

const TEMPLATE_FIELD_OPTIONS: Array<[string, string]> = [
  ["room_count", "Кількість номерів / кімнат"],
  ["opened_year", "Рік відкриття"],
  ["languages", "Мови обслуговування"],
  ["accommodation_type", "Тип розміщення"],
  ["capacity", "Місткість / кількість місць"],
  ["average_check", "Середній чек"],
  ["cuisine", "Кухня / тип кухні"],
  ["format", "Формат закладу"],
  ["store_format", "Формат магазину"],
  ["assortment", "Основний асортимент"],
  ["local_goods", "Локальні товари"],
  ["delivery", "Доставка / самовивіз"],
  ["payment_methods", "Способи оплати"],
  ["duration", "Тривалість"],
  ["price_info", "Вартість"],
  ["group_size", "Розмір групи"],
  ["difficulty", "Складність"],
  ["age_limit", "Вікові обмеження"],
  ["season", "Сезонність"],
  ["vehicle_type", "Тип транспорту"],
  ["service_area", "Зона роботи"],
];

function commaList(value: string) {
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
}

function updateCommaList(value: string, item: string, checked: boolean) {
  const current = commaList(value);
  const next = checked ? Array.from(new Set([...current, item])) : current.filter((entry) => entry !== item);
  return next.join(", ");
}

function templateFieldEntries(value: string) {
  return value.split(";").map((item) => item.trim()).filter(Boolean).map((item) => {
    const [key, ...rest] = item.split("=");
    return [key.trim(), rest.join("=").trim()] as [string, string];
  }).filter(([key, label]) => Boolean(key && label));
}

function toggleTemplateField(value: string, key: string, label: string, checked: boolean) {
  const entries = new Map(templateFieldEntries(value));
  if (checked) entries.set(key, label);
  else entries.delete(key);
  return [...entries.entries()].map(([entryKey, entryLabel]) => `${entryKey}=${entryLabel}`).join("; ");
}

function AdminTemplateMultiSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const selected = commaList(value);
  const combined = Array.from(new Set([...options, ...selected]));
  return (
    <div className="ad-stage2-template-field">
      <span>{label}</span>
      <details className="ad-stage2-multiselect">
        <summary>{selected.length ? selected.join(", ") : "Оберіть пункти"}</summary>
        <div className="ad-stage2-multiselect__menu">
          {combined.map((item) => (
            <label key={`${label}-${item}`}>
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={(event) => onChange(updateCommaList(value, item, event.target.checked))}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}

function AdminTemplateFieldsSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selectedEntries = templateFieldEntries(value);
  const selectedKeys = new Set(selectedEntries.map(([key]) => key));
  const knownKeys = new Set(TEMPLATE_FIELD_OPTIONS.map(([key]) => key));
  const options = [
    ...TEMPLATE_FIELD_OPTIONS,
    ...selectedEntries.filter(([key]) => !knownKeys.has(key)),
  ];
  return (
    <div className="ad-stage2-template-field">
      <span>Додаткові поля, які заповнюватиме партнер</span>
      <details className="ad-stage2-multiselect">
        <summary>
          {selectedEntries.length
            ? selectedEntries.map(([, label]) => label).join(", ")
            : "Оберіть потрібні поля"}
        </summary>
        <div className="ad-stage2-multiselect__menu">
          {options.map(([key, label]) => (
            <label key={`template-field-${key}`}>
              <input
                type="checkbox"
                checked={selectedKeys.has(key)}
                onChange={(event) => onChange(toggleTemplateField(value, key, label, event.target.checked))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </details>
      <small>Технічні назви полів зберігаються автоматично — адміну їх вводити не потрібно.</small>
    </div>
  );
}

type ModerationPlace = {
  id: string;
  name: string;
  category_slug: string;
  subcategory?: string | null;
  description?: string | null;
  address: string;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  website?: string | null;
  image_url?: string | null;
  attributes?: Record<string, unknown> | null;
  details?: Record<string, unknown> | null;
  status: string;
  organization_name?: string | null;
  region_name?: string | null;
  moderation_comment?: string | null;
  created_by_user_id?: string | null;
  telegram_id?: string | number | null;
  telegram_username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function Stage2ContentScreen({ navigate }: AdminProps) {
  const adminKey = "";
  const [pending, setPending] = useState<ModerationPlace[]>([]);
  const [selectedModeration, setSelectedModeration] = useState<ModerationPlace | null>(null);
  const [moderationCategories, setModerationCategories] = useState<Record<string, string>>({});
  const [qrRows, setQrRows] = useState<Array<{ id: string; start_param: string; type: string; source: string; active: boolean; region_name: string; place_name?: string | null; place_id?: string | null }>>([]);
  const [approvedPlaces, setApprovedPlaces] = useState<Array<{ id: string; name: string; category_slug: string; region_name: string }>>([]);
  const [stage2Categories, setStage2Categories] = useState<Stage2Category[]>([]);
  const [placeTemplates, setPlaceTemplates] = useState<Stage2PlaceTypeTemplate[]>([]);
  const [templateCategory, setTemplateCategory] = useState("hotel");
  const [templateType, setTemplateType] = useState("Готель");
  const [creatingTemplateType, setCreatingTemplateType] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("Новий готель");
  const [templateDescription, setTemplateDescription] = useState("Комфортний готель для відпочинку гостей.");
  const [templateAmenities, setTemplateAmenities] = useState("Номери, Паркінг, Wi‑Fi, Сніданок");
  const [templateServices, setTemplateServices] = useState("Сніданок, Прибирання, Сауна, Басейн, Трансфер");
  const [templateFields, setTemplateFields] = useState("room_count=Кількість номерів; opened_year=Рік відкриття");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "error">("checking");
  const [apiError, setApiError] = useState("");
  const [qrPlaceId, setQrPlaceId] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categorySubcategories, setCategorySubcategories] = useState("");
  const [emergencyTitle, setEmergencyTitle] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{ id: string; title: string; phone?: string | null; type?: string; note?: string }>>([]);
  const [emergencyServices, setEmergencyServices] = useState<Stage2EmergencyService[]>([]);
  const [emergencyVerifiedAt, setEmergencyVerifiedAt] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceNote, setServiceNote] = useState("");
  const [serviceTone, setServiceTone] = useState<Stage2EmergencyService["tone"]>("green");
  const [serviceIcon, setServiceIcon] = useState<Stage2EmergencyService["icon"]>("custom");
  const [serviceActive, setServiceActive] = useState(true);
  const [hotOfferRows, setHotOfferRows] = useState<Stage2HotOffer[]>([]);
  const [offerId, setOfferId] = useState("");
  const [offerPlaceId, setOfferPlaceId] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerDetail, setOfferDetail] = useState("");
  const [offerValidity, setOfferValidity] = useState("");
  const [offerBadge, setOfferBadge] = useState("Актуально");
  const [offerBadgeTone, setOfferBadgeTone] = useState<"gold" | "green" | "red">("green");
  const [offerValidFrom, setOfferValidFrom] = useState("");
  const [offerValidUntil, setOfferValidUntil] = useState("");
  const [offerActive, setOfferActive] = useState(true);
  const [communityUrl, setCommunityUrl] = useState("");
  const [qrPreviewParam, setQrPreviewParam] = useState("");
  const [qrCreating, setQrCreating] = useState(false);
  const [qrCreateLocked, setQrCreateLocked] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const load = async (key = adminKey) => {
    setLoading(true);
    setApiStatus("checking");
    setApiError("");
    try {
      const [moderation, qr, approved, categories, templates] = await Promise.all([
        adminStage2Fetch<typeof pending>("/admin/stage2/moderation", key),
        adminStage2Fetch<typeof qrRows>("/admin/stage2/qr", key),
        adminStage2Fetch<typeof approvedPlaces>("/admin/stage2/places?status=approved", key),
        adminStage2Fetch<Stage2Category[]>("/categories", key),
        adminStage2Fetch<Stage2PlaceTypeTemplate[]>("/place-type-templates", key),
      ]);
      setPending(moderation);
      setModerationCategories((current) => Object.fromEntries(moderation.map((row) => [row.id, current[row.id] || row.category_slug])));
      setQrRows(qr); setApprovedPlaces(approved); setStage2Categories(categories); setPlaceTemplates(templates);
      if (!qrPlaceId && approved[0]?.id) setQrPlaceId(approved[0].id);
      setApiStatus("connected");
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Помилка доступу до Stage 2 API";
      setApiStatus("error");
      setApiError(errorText);
    } finally { setLoading(false); }
  };

  const moderate = async (id: string, status: "approved" | "rejected") => {
    const comment = status === "rejected" ? (window.prompt("Причина повернення на доопрацювання:") || "Потрібне доопрацювання") : undefined;
    const category_slug = status === "approved" ? moderationCategories[id] : undefined;
    await adminStage2Fetch(`/admin/stage2/places/${encodeURIComponent(id)}/status`, adminKey, { method: "PATCH", body: JSON.stringify({ status, comment, category_slug }) });
    setMessage(status === "approved" ? "Заклад схвалено і він уже доступний туристам у вибраному розділі." : "Заклад повернуто на доопрацювання.");
    await load();
  };

  const createQr = async () => {
    if (qrCreating || qrCreateLocked) return;
    setQrCreating(true);
    setMessage("");
    try {
      await adminStage2Fetch<{ id: string; start_param: string }>("/admin/stage2/qr", adminKey, { method: "POST", body: JSON.stringify({ place_id: qrPlaceId || null, type: "entry_point", source: "hotel" }) });
      setQrPreviewParam("");
      setQrCreateLocked(true);
      setMessage("QR успішно створено. Щоб випадково не створити дубль, повторне створення заблоковано.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка створення QR: ${error.message}` : "Помилка створення QR");
    } finally {
      setQrCreating(false);
    }
  };

  const toggleQr = async (id: string, active: boolean) => {
    await adminStage2Fetch(`/admin/stage2/qr/${encodeURIComponent(id)}`, adminKey, { method: "PATCH", body: JSON.stringify({ active }) });
    setMessage(active ? "QR-контекст активовано" : "QR-контекст деактивовано");
    await load();
  };

  const deleteQr = async (id: string, startParam: string) => {
    if (!window.confirm(`Видалити QR ${startParam}? Після видалення цей QR більше не відкриватиме контекст.`)) return;
    try {
      await adminStage2Fetch(`/admin/stage2/qr/${encodeURIComponent(id)}`, adminKey, { method: "DELETE" });
      if (qrPreviewParam === startParam) setQrPreviewParam("");
      setMessage(`QR ${startParam} видалено.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка видалення QR: ${error.message}` : "Помилка видалення QR");
    }
  };

  const deepLink = (startParam: string) => {
    const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim() || "GidTourist_Bot";
    return `https://t.me/${bot}?startapp=${encodeURIComponent(startParam)}`;
  };

  const shareQr = async (startParam: string) => {
    const url = deepLink(startParam);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Гід туриста — QR точки входу", text: "Відкрити точку в Telegram Mini App", url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Посилання QR скопійовано.");
      }
    } catch {
      // User may close the native share sheet.
    }
  };

  const deleteEmergency = async (id: string, title: string) => {
    if (!window.confirm(`Видалити екстрений контакт «${title}»?`)) return;
    try {
      await adminStage2Fetch(`/admin/stage2/emergency/${encodeURIComponent(id)}`, adminKey, { method: "DELETE" });
      setMessage(`Контакт «${title}» видалено.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка видалення контакту: ${error.message}` : "Помилка видалення контакту");
    }
  };

  const resetEmergencyServiceForm = () => {
    setServiceId(""); setServiceTitle(""); setServiceNote(""); setServiceTone("green"); setServiceIcon("custom"); setServiceActive(true);
  };

  const editEmergencyService = (service: Stage2EmergencyService) => {
    setServiceId(service.id);
    setServiceTitle(service.title);
    setServiceNote(service.note);
    setServiceTone(service.tone);
    setServiceIcon(service.icon);
    setServiceActive(service.active);
  };

  const saveEmergencyService = async () => {
    if (!serviceTitle.trim()) { setMessage("Вкажіть назву корисного сервісу."); return; }
    await adminStage2Fetch("/admin/stage2/emergency-services", adminKey, {
      method: "POST",
      body: JSON.stringify({ id: serviceId || undefined, region_id: "region-tatariv", title: serviceTitle.trim(), note: serviceNote.trim(), tone: serviceTone, icon: serviceIcon, active: serviceActive }),
    });
    setMessage(serviceId ? "Корисний сервіс оновлено." : "Корисний сервіс додано.");
    resetEmergencyServiceForm();
    await load();
  };

  const deleteEmergencyService = async (service: Stage2EmergencyService) => {
    if (!window.confirm(`Видалити корисний сервіс «${service.title}»?`)) return;
    await adminStage2Fetch(`/admin/stage2/emergency-services/${encodeURIComponent(service.id)}`, adminKey, { method: "DELETE" });
    if (serviceId === service.id) resetEmergencyServiceForm();
    setMessage(`Сервіс «${service.title}» видалено.`);
    await load();
  };

  const toggleEmergencyService = async (service: Stage2EmergencyService) => {
    await adminStage2Fetch("/admin/stage2/emergency-services", adminKey, {
      method: "POST",
      body: JSON.stringify({ ...service, region_id: "region-tatariv", active: !service.active }),
    });
    setMessage(!service.active ? "Сервіс увімкнено." : "Сервіс вимкнено.");
    await load();
  };

  const resetOfferForm = () => {
    setOfferId(""); setOfferPlaceId(""); setOfferTitle(""); setOfferDiscount(""); setOfferDescription(""); setOfferDetail("");
    setOfferValidity(""); setOfferBadge("Актуально"); setOfferBadgeTone("green"); setOfferValidFrom(""); setOfferValidUntil(""); setOfferActive(true);
  };

  const editOffer = (offer: Stage2HotOffer) => {
    setOfferId(offer.id);
    setOfferPlaceId(offer.place_id || "");
    setOfferTitle(offer.title);
    setOfferDiscount(offer.discount || "");
    setOfferDescription(offer.description || "");
    setOfferDetail(offer.detail || "");
    setOfferValidity(offer.validity || "");
    setOfferBadge(offer.badge || "Актуально");
    setOfferBadgeTone(offer.badge_tone === "gold" || offer.badge_tone === "red" ? offer.badge_tone : "green");
    setOfferValidFrom(offer.valid_from ? offer.valid_from.slice(0, 16) : "");
    setOfferValidUntil(offer.valid_until ? offer.valid_until.slice(0, 16) : "");
    setOfferActive(offer.active !== false);
  };

  const saveOffer = async () => {
    if (!offerTitle.trim()) { setMessage("Вкажіть назву гарячої пропозиції."); return; }
    const selectedPlace = approvedPlaces.find((place) => place.id === offerPlaceId);
    const category = stage2Categories.find((item) => item.slug === selectedPlace?.category_slug);
    await adminStage2Fetch("/admin/stage2/offers", adminKey, {
      method: "POST",
      body: JSON.stringify({
        id: offerId || undefined,
        region_id: "region-tatariv",
        place_id: offerPlaceId || null,
        category_slug: selectedPlace?.category_slug || "",
        category_label: category?.name || selectedPlace?.category_slug || "Пропозиція",
        title: offerTitle.trim(),
        discount: offerDiscount.trim(),
        description: offerDescription.trim(),
        detail: offerDetail.trim(),
        validity: offerValidity.trim(),
        badge: offerBadge.trim(),
        badge_tone: offerBadgeTone,
        valid_from: offerValidFrom || null,
        valid_until: offerValidUntil || null,
        active: offerActive,
      }),
    });
    setMessage(offerId ? "Гарячу пропозицію оновлено." : "Гарячу пропозицію створено.");
    resetOfferForm();
    await load();
  };

  const previewQr = qrRows.find((row) => row.start_param === qrPreviewParam) ?? null;
  const qrAudience = (row: { type: string; start_param?: string }) => row.type === "partner_access" || row.start_param?.startsWith("partner-")
    ? { label: "Для партнера", tone: "partner" }
    : { label: "Точка входу туриста", tone: "client" };

  return (
    <AdminShell active="content" navigate={navigate} contentClassName="ad-main--stage2">
      <AdminPageHeader title="Контент / QR — Етап 2" subtitle="Модерація закладів, QR-контекст і технічні шаблони партнерів" action={<OutlineButton onClick={() => void load()}><RefreshCcw size={17}/> Оновити</OutlineButton>} />
      <section className="ad-stage2-access ad-stage2-access--status">
        <div className={`ad-stage2-api-status is-${apiStatus}`}>
          <strong>{apiStatus === "connected" ? "API успішно підключено" : apiStatus === "error" ? "Помилка підключення API" : "Перевіряємо підключення API…"}</strong>
          {apiStatus === "error" && apiError ? <small>{apiError}</small> : null}
        </div>
        <PrimaryButton onClick={() => void load()}>{loading ? "Підключення…" : "Перевірити API"}</PrimaryButton>
        {message ? <p>{message}</p> : null}
      </section>

      <section className="ad-stage2-section">
        <AdminPageHeader title="Модерація нових закладів" subtitle="Розділ визначається автоматично за типом закладу; перед Approve адміністратор може змінити його вручну" />
        <AdminTable columns={[{label:"Заклад",className:"1.4fr"},{label:"Розділ у гіді",className:"1fr"},{label:"Адреса",className:"1.3fr"},{label:"Статус",className:".7fr"},{label:"Дії",className:"1fr"}]}>
          {pending.map((row) => <TableRow key={row.id} columns={["1.4fr","1fr","1.3fr",".7fr","1fr"]}>
            <div><strong>{row.name}</strong><small>{row.subcategory || row.organization_name || row.region_name}</small></div>
            <div className="ad-stage2-moderation-category">
              <select value={moderationCategories[row.id] || row.category_slug} onChange={(event) => setModerationCategories((current) => ({ ...current, [row.id]: event.target.value }))}>
                {!stage2Categories.some((item) => item.slug === (moderationCategories[row.id] || row.category_slug)) ? <option value={moderationCategories[row.id] || row.category_slug}>{moderationCategories[row.id] || row.category_slug}</option> : null}
                {stage2Categories.filter((item) => item.slug !== "emergency").map((item) => <option key={item.slug} value={item.slug}>{item.slug === "hotel" ? "Про заклад / готель" : item.name}</option>)}
              </select>
              <small>Тип: {row.subcategory || "не вказано"}</small>
            </div>
            <span>{row.address}</span><Status tone={row.status === "rejected" ? "red" : "orange"}>{row.status}</Status>
            <div className="ad-row-actions">
              <button className="ad-text-btn" onClick={() => setSelectedModeration(row)}><Eye size={14}/> Переглянути</button>
              <button className="ad-text-btn" onClick={() => void moderate(row.id,"approved")}>Approve</button>
              <button className="ad-text-btn is-danger" onClick={() => void moderate(row.id,"rejected")}>Reject</button>
            </div>
          </TableRow>)}
          {!pending.length ? <div className="ad-stage2-empty-row">Черга модерації порожня</div> : null}
        </AdminTable>
      </section>

      {selectedModeration ? (() => {
        const details = selectedModeration.details && typeof selectedModeration.details === "object" ? selectedModeration.details : {};
        const gallery = Array.isArray(details.gallery) ? details.gallery.map((item) => String(item || "")).filter(Boolean) : [];
        const images = Array.from(new Set([selectedModeration.image_url || "", ...gallery].filter(Boolean)));
        const submitterName = [selectedModeration.first_name, selectedModeration.last_name].filter(Boolean).join(" ") || selectedModeration.telegram_username || "Користувач Telegram";
        const selectedCategory = moderationCategories[selectedModeration.id] || selectedModeration.category_slug;
        const selectedCategoryLabel = stage2Categories.find((item) => item.slug === selectedCategory)?.name || selectedCategory;
        const createdLabel = selectedModeration.created_at ? new Date(selectedModeration.created_at).toLocaleString("uk-UA") : "—";
        const coordsOk = Number.isFinite(Number(selectedModeration.lat)) && Number.isFinite(Number(selectedModeration.lng));
        const mapsUrl = coordsOk ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedModeration.lat},${selectedModeration.lng}`)}` : "";
        return <div className="ad-stage2-moderation-modal" role="dialog" aria-modal="true" aria-label="Перегляд закладу на модерації" onMouseDown={(event)=>{if(event.currentTarget===event.target)setSelectedModeration(null);}}>
          <section className="ad-stage2-moderation-modal__card">
            <header>
              <div><small>Заявка користувача</small><h2>{selectedModeration.name}</h2><p>{selectedModeration.subcategory || "Тип не вказано"} · {selectedModeration.region_name || "Регіон не визначено"}</p></div>
              <button type="button" aria-label="Закрити" onClick={()=>setSelectedModeration(null)}><X size={21}/></button>
            </header>
            <div className="ad-stage2-moderation-modal__body">
              <section className="ad-stage2-moderation-summary">
                <div><span>Куди потрапить</span><strong>{selectedCategoryLabel}</strong><small>Розділ можна змінити у таблиці перед Approve.</small></div>
                <div><span>Статус</span><strong>{selectedModeration.status}</strong><small>Подано: {createdLabel}</small></div>
                <div><span>Хто додав</span><strong>{submitterName}</strong><small>{selectedModeration.telegram_username ? `@${selectedModeration.telegram_username.replace(/^@/, "")}` : selectedModeration.telegram_id ? `Telegram ID: ${selectedModeration.telegram_id}` : "Telegram-профіль без username"}</small></div>
              </section>

              <section className="ad-stage2-moderation-info-grid">
                <article><span>Назва</span><strong>{selectedModeration.name}</strong></article>
                <article><span>Тип</span><strong>{selectedModeration.subcategory || "Не вказано"}</strong></article>
                <article className="is-wide"><span>Опис</span><p>{selectedModeration.description || "Опис не додано"}</p></article>
                <article className="is-wide"><span>Адреса</span><p>{selectedModeration.address || "Адресу не визначено"}</p>{coordsOk ? <small>{Number(selectedModeration.lat).toFixed(6)}, {Number(selectedModeration.lng).toFixed(6)}</small> : null}</article>
                <article><span>Телефон</span><strong>{selectedModeration.phone || "Не вказано"}</strong></article>
                <article><span>Сайт</span>{selectedModeration.website ? <a href={selectedModeration.website} target="_blank" rel="noreferrer">{selectedModeration.website}</a> : <strong>Не вказано</strong>}</article>
              </section>

              <section className="ad-stage2-moderation-gallery">
                <div className="ad-stage2-moderation-gallery__head"><div><strong>Фото</strong><small>{images.length ? `${images.length} фото від користувача` : "Фото не додано"}</small></div></div>
                {images.length ? <div className="ad-stage2-moderation-gallery__grid">{images.map((src,index)=><a href={src} target="_blank" rel="noreferrer" key={`${index}-${src.slice(0,30)}`}><img src={src} alt={`${selectedModeration.name} — фото ${index+1}`} /></a>)}</div> : <div className="ad-stage2-moderation-gallery__empty"><ImagePlus size={28}/><span>Користувач не прикріпив фотографії.</span></div>}
              </section>

              {selectedModeration.moderation_comment ? <div className="ad-stage2-moderation-comment"><strong>Попередній коментар модерації</strong><p>{selectedModeration.moderation_comment}</p></div> : null}
            </div>
            <footer>
              <div>{mapsUrl ? <a className="ad-stage2-moderation-map-link" href={mapsUrl} target="_blank" rel="noreferrer"><MapPin size={15}/> Відкрити точку на мапі</a> : null}</div>
              <div className="ad-stage2-moderation-modal__actions">
                <OutlineButton onClick={()=>setSelectedModeration(null)}>Закрити</OutlineButton>
                <button className="ad-stage2-moderation-reject" type="button" onClick={()=>{const id=selectedModeration.id;setSelectedModeration(null);void moderate(id,"rejected");}}>Reject</button>
                <PrimaryButton onClick={()=>{const id=selectedModeration.id;setSelectedModeration(null);void moderate(id,"approved");}}>Approve</PrimaryButton>
              </div>
            </footer>
          </section>
        </div>;
      })() : null}

      <section className="ad-stage2-grid ad-stage2-grid--content">
        <div className="ad-stage2-card ad-stage2-card--stacked">
          <div className="ad-stage2-card-section">
            <h2>Створити QR точки входу</h2><p>Оберіть схвалений заклад. Унікальний QR-контекст створиться автоматично.</p>
            <select value={qrPlaceId} onChange={(e)=>{setQrPlaceId(e.target.value);setQrCreateLocked(false);setMessage("");}}>
              <option value="">Публічна точка без закладу</option>
              {approvedPlaces.map((place) => <option key={place.id} value={place.id}>{place.name} · {place.category_slug}</option>)}
            </select>
            <PrimaryButton disabled={qrCreating || qrCreateLocked} onClick={() => void createQr()}>{qrCreateLocked ? <Check size={16}/> : <Plus size={16}/>} {qrCreating ? "Створення…" : qrCreateLocked ? "QR створено" : "Створити QR-контекст"}</PrimaryButton>
            {qrCreateLocked ? <div className="ad-stage2-qr-created"><Check size={16}/><span><strong>QR успішно створено</strong><small>Точка готова до використання</small></span></div> : null}
            {qrCreateLocked ? <OutlineButton onClick={()=>{setQrCreateLocked(false);setQrPreviewParam("");setMessage("");}}>Створити ще один QR</OutlineButton> : null}
          </div>

          <div className="ad-stage2-card-section">
            <h2>Telegram-спільнота</h2><p>Посилання регіону відкриватиметься туристу на екрані «Спільнота».</p>
            <input value={communityUrl} onChange={(e)=>setCommunityUrl(e.target.value)} placeholder="https://t.me/..." />
            <PrimaryButton onClick={() => void adminStage2Fetch("/admin/stage2/regions/region-tatariv", adminKey,{method:"PATCH",body:JSON.stringify({community_url:communityUrl})}).then(()=>{setMessage("Telegram-спільноту регіону збережено");})}><Send size={16}/> Зберегти спільноту</PrimaryButton>
          </div>

          <div className="ad-stage2-card-section ad-stage2-card-section--page-editor-link">
            <h2>Контент туристичних сторінок</h2>
            <p>«Халепа?», «Гарячі пропозиції» та створення/редагування розділів перенесені в окремий редактор.</p>
            <PrimaryButton onClick={() => navigate("admin", "admin-pages")}><Palette size={15}/> Відкрити редактор сторінок</PrimaryButton>
          </div>

        </div>

        <div className="ad-stage2-card ad-stage2-card--categories">
          <h2>Шаблони типів закладу</h2>
          <p>Технічні шаблони партнера залишаються тут. Назви туристичних розділів і підкатегорії тепер редагуються окремо.</p>
          <OutlineButton onClick={() => navigate("admin", "admin-page-categories")}><Palette size={15}/> Редактор категорій</OutlineButton>
          <div className="ad-stage2-template-editor">
            <strong>Шаблон типу закладу</strong>
            <p>Оберіть розділ і тип закладу. Нижче задайте тільки зрозумілі адміну параметри — технічні ключі система збере сама.</p>

            <label className="ad-stage2-template-field">
              <span>Розділ</span>
              <select value={templateCategory} onChange={(e)=>{
                const value=e.target.value;
                setTemplateCategory(value);
                setCreatingTemplateType(false);
                const first=placeTemplates.find((item)=>item.category_slug===value);
                if(first){
                  setTemplateType(first.place_type);
                  setTemplateTitle(first.default_title || "");
                  setTemplateDescription(first.default_description || "");
                  setTemplateAmenities((first.default_amenities || []).join(", "));
                  setTemplateServices(first.default_services.join(", "));
                  setTemplateFields(Object.entries(first.fields ?? {}).map(([key,label])=>`${key}=${String(label)}`).join("; "));
                } else {
                  setTemplateType("");
                  setTemplateTitle("");
                  setTemplateDescription("");
                  setTemplateAmenities("");
                  setTemplateServices("");
                  setTemplateFields("");
                }
              }}>
                {stage2Categories.filter((item)=>item.slug!=="emergency").map((item)=><option key={item.slug} value={item.slug}>{item.name}</option>)}
              </select>
            </label>

            <label className="ad-stage2-template-field">
              <span>Тип закладу</span>
              <select value={creatingTemplateType ? "__new__" : templateType} onChange={(e)=>{
                const value=e.target.value;
                if(value==="__new__"){
                  setCreatingTemplateType(true);
                  setTemplateType("");
                  setTemplateTitle("");
                  setTemplateDescription("");
                  setTemplateAmenities("");
                  setTemplateServices("");
                  setTemplateFields("");
                  return;
                }
                setCreatingTemplateType(false);
                setTemplateType(value);
                const current=placeTemplates.find((item)=>item.category_slug===templateCategory&&item.place_type===value);
                if(current){
                  setTemplateTitle(current.default_title || "");
                  setTemplateDescription(current.default_description || "");
                  setTemplateAmenities((current.default_amenities || []).join(", "));
                  setTemplateServices(current.default_services.join(", "));
                  setTemplateFields(Object.entries(current.fields ?? {}).map(([key,label])=>`${key}=${String(label)}`).join("; "));
                }
              }}>
                <option value="" disabled>Оберіть тип закладу</option>
                {placeTemplates.filter((item)=>item.category_slug===templateCategory).map((item)=><option key={item.id} value={item.place_type}>{item.label}</option>)}
                <option value="__new__">+ Додати новий тип закладу</option>
              </select>
            </label>

            {creatingTemplateType ? (
              <label className="ad-stage2-template-field">
                <span>Назва нового типу</span>
                <input value={templateType} onChange={(e)=>setTemplateType(e.target.value)} placeholder="Наприклад: Готель, Кафе, Музей" />
              </label>
            ) : null}

            <label className="ad-stage2-template-field">
              <span>Назва за замовчуванням</span>
              <input value={templateTitle} onChange={(e)=>setTemplateTitle(e.target.value)} placeholder="Наприклад: Новий готель" />
            </label>

            <label className="ad-stage2-template-field">
              <span>Короткий опис за замовчуванням</span>
              <textarea value={templateDescription} onChange={(e)=>setTemplateDescription(e.target.value)} placeholder="Коротка підказка для партнера, що написати про заклад" rows={3} />
            </label>

            <AdminTemplateMultiSelect
              label="Зручності / основні характеристики"
              value={templateAmenities}
              options={TEMPLATE_AMENITY_OPTIONS}
              onChange={setTemplateAmenities}
            />

            <AdminTemplateMultiSelect
              label="Послуги закладу"
              value={templateServices}
              options={TEMPLATE_SERVICE_OPTIONS}
              onChange={setTemplateServices}
            />

            <AdminTemplateFieldsSelect value={templateFields} onChange={setTemplateFields} />

            <PrimaryButton disabled={!templateType.trim()} onClick={() => void adminStage2Fetch("/admin/stage2/place-type-templates", adminKey,{method:"POST",body:JSON.stringify({category_slug:templateCategory,place_type:templateType.trim(),label:templateType.trim(),default_title:templateTitle,default_description:templateDescription,default_amenities:commaList(templateAmenities),default_services:commaList(templateServices),fields:Object.fromEntries(templateFieldEntries(templateFields))})}).then(()=>{setMessage("Шаблон типу закладу збережено");setCreatingTemplateType(false);return load();})}><Plus size={16}/> Зберегти шаблон</PrimaryButton>
          </div>
        </div>
      </section>

      <section className="ad-stage2-section">
        <AdminPageHeader title="QR точки" subtitle="Посилання можна перетворити на друкований QR будь-яким QR-генератором; start_param зберігається у БД" />
        <AdminTable columns={[{label:"Точка",className:"1.1fr"},{label:"Тип",className:".75fr"},{label:"start_param",className:"1.2fr"},{label:"Статус",className:".55fr"},{label:"Deep link",className:"2fr"}]}>
          {qrRows.map((row)=>{ const audience = qrAudience(row); return <TableRow key={row.id} columns={["1.1fr",".75fr","1.2fr",".55fr","2fr"]}><div className="ad-stage2-qr-place"><strong>{row.place_name || "Публічна точка"}</strong><small>{row.region_name}</small></div><span className={`ad-stage2-qr-audience is-${audience.tone}`}>{audience.label}</span><code>{row.start_param}</code><Status tone={row.active?"green":"gray"}>{row.active?"Активний":"Вимкнено"}</Status><div className="ad-stage2-link"><input readOnly value={deepLink(row.start_param)}/><button onClick={() => void navigator.clipboard.writeText(deepLink(row.start_param))}>Копіювати</button><button onClick={() => setQrPreviewParam(row.start_param)}>QR</button><button onClick={() => void toggleQr(row.id,!row.active)}>{row.active?"Вимк.":"Увімк."}</button><button className="ad-stage2-delete-button" onClick={() => void deleteQr(row.id,row.start_param)}><Trash2 size={14}/> Видалити</button></div></TableRow>;})}
        </AdminTable>
      </section>
      {qrPreviewParam ? <div className="ad-stage2-qr-modal" role="dialog" aria-modal="true" aria-label="QR точки входу" onMouseDown={(event)=>{if(event.currentTarget===event.target)setQrPreviewParam("");}}>
        <div className="ad-stage2-qr-modal__card">
          <button type="button" className="ad-stage2-qr-modal__close" aria-label="Закрити" onClick={()=>setQrPreviewParam("")}><X size={22}/></button>
          <h2>QR-код</h2>
          {previewQr ? <span className={`ad-stage2-qr-audience ad-stage2-qr-audience--modal is-${qrAudience(previewQr).tone}`}>{qrAudience(previewQr).label}</span> : null}
          <Stage2QrPreview value={deepLink(qrPreviewParam)} />
          <p>{previewQr && qrAudience(previewQr).tone === "partner" ? "QR відкриває партнерський кабінет і перевіряє Telegram ID." : "QR відкриває Telegram Mini App у контексті цієї точки входу."}</p>
          <div className="ad-stage2-qr-modal__actions">
            <PrimaryButton onClick={() => void shareQr(qrPreviewParam)}><Send size={17}/> Поділитись</PrimaryButton>
            <OutlineButton onClick={()=>setQrPreviewParam("")}><X size={17}/> Закрити</OutlineButton>
          </div>
        </div>
      </div> : null}
    </AdminShell>
  );
}


function PageEditorCard({
  title,
  description,
  items,
  icon: Icon,
  onOpen,
}: {
  title: string;
  description: string;
  items: string[];
  icon: typeof Palette;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="ad-page-editor-card" onClick={onOpen}>
      <span className="ad-page-editor-card__icon"><Icon size={25} /></span>
      <span className="ad-page-editor-card__copy">
        <strong>{title}</strong>
        <small>{description}</small>
        <span>{items.map((item) => <i key={item}>{item}</i>)}</span>
      </span>
      <ChevronRight size={20} />
    </button>
  );
}

function PageEditorsHomeScreen({ navigate }: AdminProps) {
  return (
    <AdminShell active="pages" navigate={navigate} contentClassName="ad-main--page-editors">
      <AdminPageHeader
        title="Редактор сторінок"
        subtitle="Окреме місце для контенту туристичних вкладок і функцій. QR, модерація та технічний контент залишаються у «Контент / QR»."
      />
      <section className="ad-page-editor-grid">
        <PageEditorCard
          title="Халепа?"
          description="Повне редагування сторінки допомоги для регіону."
          items={["Шапка і hero", "Екстрені контакти", "Корисні сервіси", "Дата перевірки"]}
          icon={ShieldCheck}
          onOpen={() => navigate("admin", "admin-page-emergency")}
        />
        <PageEditorCard
          title="Гарячі пропозиції"
          description="Оформлення сторінки та керування актуальними акціями партнерів."
          items={["Шапка і банер", "Тексти сторінки", "Пропозиції", "Дати та активність"]}
          icon={Percent}
          onOpen={() => navigate("admin", "admin-page-offers")}
        />
        <PageEditorCard
          title="Категорії / розділи"
          description="Назви основних розділів і підкатегорії, які бачать туристи та партнери."
          items={["Назва розділу", "Мови", "Підкатегорії"]}
          icon={Menu}
          onOpen={() => navigate("admin", "admin-page-categories")}
        />
      </section>
    </AdminShell>
  );
}

type AdminPageRegion = {
  id: string;
  slug: string;
  name: string;
};

type EmergencyAdminContact = {
  id: string;
  type: string;
  title: string;
  note: string;
  phone?: string | null;
  tone: string;
};

const DEFAULT_EMERGENCY_PAGE_CONTENT: Record<string, string> = {
  badge: "SOS",
  title: "Халепа?",
  subtitle: "Швидка допомога та корисні контакти",
  hero_kicker: "Не хвилюйтеся",
  hero_title: "Знайдемо допомогу",
  hero_text: "Екстрені та перевірені контакти для вашої безпеки.",
};

function EmergencyPageEditorScreen({ navigate }: AdminProps) {
  const adminKey = "";
  const [regions, setRegions] = useState<AdminPageRegion[]>([]);
  const [regionId, setRegionId] = useState("region-tatariv");
  const [contacts, setContacts] = useState<EmergencyAdminContact[]>([]);
  const [services, setServices] = useState<Stage2EmergencyService[]>([]);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState<Record<string, string>>(DEFAULT_EMERGENCY_PAGE_CONTENT);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [contactId, setContactId] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactType, setContactType] = useState("custom");
  const [contactTone, setContactTone] = useState("green");

  const [serviceId, setServiceId] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceNote, setServiceNote] = useState("");
  const [serviceTone, setServiceTone] = useState<Stage2EmergencyService["tone"]>("green");
  const [serviceIcon, setServiceIcon] = useState<Stage2EmergencyService["icon"]>("custom");
  const [serviceActive, setServiceActive] = useState(true);

  const load = async () => {
    try {
      const [regionRows, contactRows, servicePayload, contentPayload] = await Promise.all([
        adminStage2Fetch<AdminPageRegion[]>("/admin/stage2/regions", adminKey),
        adminStage2Fetch<EmergencyAdminContact[]>(`/admin/stage2/emergency?region_id=${encodeURIComponent(regionId)}`, adminKey),
        adminStage2Fetch<Stage2EmergencyServicesResponse>(`/admin/stage2/emergency-services?region_id=${encodeURIComponent(regionId)}`, adminKey),
        adminStage2Fetch<Stage2PageContentResponse>(`/page-content/emergency?region_id=${encodeURIComponent(regionId)}`, adminKey),
      ]);
      setRegions(regionRows);
      setContacts(contactRows);
      setServices(servicePayload.services);
      setVerifiedAt(servicePayload.verified_at || null);
      const content = Object.fromEntries(Object.entries(contentPayload.content || {}).map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")]));
      setPageContent({ ...DEFAULT_EMERGENCY_PAGE_CONTENT, ...content });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося завантажити сторінку");
    }
  };

  useEffect(() => { void load(); }, [regionId]);

  const setPageField = (key: string, value: string) => setPageContent((current) => ({ ...current, [key]: value }));

  const savePageContent = async () => {
    setSaving(true);
    try {
      const saved = await adminStage2Fetch<Stage2PageContentResponse>("/admin/stage2/page-content/emergency", adminKey, {
        method: "POST",
        body: JSON.stringify({ region_id: regionId, content: pageContent }),
      });
      const content = Object.fromEntries(Object.entries(saved.content || {}).map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")]));
      setPageContent({ ...DEFAULT_EMERGENCY_PAGE_CONTENT, ...content });
      setMessage(`Оформлення «Халепа?» збережено для регіону ${regions.find((item) => item.id === regionId)?.name || regionId}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка збереження: ${error.message}` : "Не вдалося зберегти сторінку");
    } finally {
      setSaving(false);
    }
  };

  const resetContactForm = () => {
    setContactId(""); setContactTitle(""); setContactNote(""); setContactPhone(""); setContactType("custom"); setContactTone("green");
  };

  const editContact = (contact: EmergencyAdminContact) => {
    setContactId(contact.id);
    setContactTitle(contact.title);
    setContactNote(contact.note || "");
    setContactPhone(contact.phone || "");
    setContactType(contact.type || "custom");
    setContactTone(contact.tone || "green");
  };

  const saveContact = async () => {
    if (!contactTitle.trim()) { setMessage("Вкажіть назву контакту."); return; }
    try {
      await adminStage2Fetch("/admin/stage2/emergency", adminKey, {
        method: "POST",
        body: JSON.stringify({
          id: contactId || undefined,
          region_id: regionId,
          title: contactTitle.trim(),
          note: contactNote.trim(),
          phone: contactPhone.trim() || null,
          type: contactType,
          tone: contactTone,
        }),
      });
      setMessage(contactId ? "Екстрений контакт оновлено." : "Екстрений контакт додано.");
      resetContactForm();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка контакту: ${error.message}` : "Не вдалося зберегти контакт");
    }
  };

  const deleteContact = async (contact: EmergencyAdminContact) => {
    if (!window.confirm(`Видалити контакт «${contact.title}»?`)) return;
    try {
      await adminStage2Fetch(`/admin/stage2/emergency/${encodeURIComponent(contact.id)}`, adminKey, { method: "DELETE" });
      if (contactId === contact.id) resetContactForm();
      setMessage("Контакт видалено.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка видалення: ${error.message}` : "Не вдалося видалити контакт");
    }
  };

  const resetServiceForm = () => {
    setServiceId(""); setServiceTitle(""); setServiceNote(""); setServiceTone("green"); setServiceIcon("custom"); setServiceActive(true);
  };

  const editService = (service: Stage2EmergencyService) => {
    setServiceId(service.id);
    setServiceTitle(service.title);
    setServiceNote(service.note);
    setServiceTone(service.tone);
    setServiceIcon(service.icon);
    setServiceActive(service.active);
  };

  const saveService = async () => {
    if (!serviceTitle.trim()) { setMessage("Вкажіть назву корисного сервісу."); return; }
    try {
      await adminStage2Fetch("/admin/stage2/emergency-services", adminKey, {
        method: "POST",
        body: JSON.stringify({
          id: serviceId || undefined,
          region_id: regionId,
          title: serviceTitle.trim(),
          note: serviceNote.trim(),
          tone: serviceTone,
          icon: serviceIcon,
          active: serviceActive,
        }),
      });
      setMessage(serviceId ? "Корисний сервіс оновлено." : "Корисний сервіс додано.");
      resetServiceForm();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка сервісу: ${error.message}` : "Не вдалося зберегти сервіс");
    }
  };

  const toggleService = async (service: Stage2EmergencyService) => {
    try {
      await adminStage2Fetch("/admin/stage2/emergency-services", adminKey, {
        method: "POST",
        body: JSON.stringify({ ...service, region_id: regionId, active: !service.active }),
      });
      setMessage(service.active ? "Сервіс вимкнено." : "Сервіс увімкнено.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка сервісу: ${error.message}` : "Не вдалося змінити сервіс");
    }
  };

  const deleteService = async (service: Stage2EmergencyService) => {
    if (!window.confirm(`Видалити сервіс «${service.title}»?`)) return;
    try {
      await adminStage2Fetch(`/admin/stage2/emergency-services/${encodeURIComponent(service.id)}`, adminKey, { method: "DELETE" });
      if (serviceId === service.id) resetServiceForm();
      setMessage("Корисний сервіс видалено.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка видалення: ${error.message}` : "Не вдалося видалити сервіс");
    }
  };

  return (
    <AdminShell active="pages" navigate={navigate} contentClassName="ad-main--page-editors ad-main--emergency-editor">
      <AdminPageHeader
        title="Редактор «Халепа?»"
        subtitle="Шапка, інформаційний блок, екстрені контакти та корисні сервіси."
        back={() => navigate("admin", "admin-pages")}
        action={<OutlineButton onClick={() => void load()}><RefreshCcw size={16}/> Оновити</OutlineButton>}
      />
      <section className="ad-page-editor-region-select">
        <span>Редагується регіон</span>
        <select value={regionId} onChange={(e) => { setRegionId(e.target.value); resetContactForm(); resetServiceForm(); setMessage(""); }}>
          {regions.length ? regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>) : <option value="region-tatariv">Татарів</option>}
        </select>
      </section>
      {message ? <p className="ad-page-editor-message">{message}</p> : null}

      <section className="ad-page-editor-panel">
        <header><div><strong>Шапка та основний блок</strong><small>Змінюється текст без зміни поточного дизайну туристичної сторінки.</small></div></header>
        <div className="ad-page-editor-form-grid">
          <label><span>Позначка</span><input value={pageContent.badge || ""} onChange={(e)=>setPageField("badge",e.target.value)} /></label>
          <label><span>Заголовок</span><input value={pageContent.title || ""} onChange={(e)=>setPageField("title",e.target.value)} /></label>
          <label className="is-wide"><span>Підзаголовок</span><input value={pageContent.subtitle || ""} onChange={(e)=>setPageField("subtitle",e.target.value)} /></label>
          <label><span>Малий текст hero</span><input value={pageContent.hero_kicker || ""} onChange={(e)=>setPageField("hero_kicker",e.target.value)} /></label>
          <label><span>Заголовок hero</span><input value={pageContent.hero_title || ""} onChange={(e)=>setPageField("hero_title",e.target.value)} /></label>
          <label className="is-wide"><span>Опис hero</span><textarea rows={3} value={pageContent.hero_text || ""} onChange={(e)=>setPageField("hero_text",e.target.value)} /></label>
        </div>
        <PrimaryButton onClick={() => void savePageContent()} disabled={saving}><Check size={15}/> {saving ? "Збереження..." : "Зберегти оформлення сторінки"}</PrimaryButton>
      </section>

      <section className="ad-page-editor-panel">
        <header><div><strong>Екстрені контакти</strong><small>Додавання, редагування та видалення номерів.</small></div></header>
        <div className="ad-page-editor-form-grid">
          <label><span>Назва</span><input value={contactTitle} onChange={(e)=>setContactTitle(e.target.value)} placeholder="Назва служби" /></label>
          <label><span>Телефон</span><input value={contactPhone} onChange={(e)=>setContactPhone(e.target.value)} placeholder="+380..." /></label>
          <label className="is-wide"><span>Опис</span><input value={contactNote} onChange={(e)=>setContactNote(e.target.value)} placeholder="Короткий опис" /></label>
          <label><span>Тип</span><select value={contactType} onChange={(e)=>setContactType(e.target.value)}><option value="custom">Інше</option><option value="emergency">Єдиний номер</option><option value="ambulance">Швидка</option><option value="police">Поліція</option><option value="rescue">Рятувальники</option></select></label>
          <label><span>Колір</span><select value={contactTone} onChange={(e)=>setContactTone(e.target.value)}><option value="green">Зелений</option><option value="red">Червоний</option><option value="blue">Синій</option><option value="orange">Помаранчевий</option></select></label>
        </div>
        <div className="ad-stage2-actions-row"><PrimaryButton onClick={() => void saveContact()}>{contactId ? <Check size={14}/> : <Plus size={14}/>} {contactId ? "Зберегти контакт" : "Додати контакт"}</PrimaryButton>{contactId ? <OutlineButton onClick={resetContactForm}>Скасувати</OutlineButton> : null}</div>
        <div className="ad-page-editor-list">
          {contacts.map((contact)=><article key={contact.id}><span><strong>{contact.title}</strong><small>{contact.note || "Без опису"} · {contact.phone || "без номера"}</small></span><div><button type="button" onClick={()=>editContact(contact)}><Edit3 size={13}/> Редагувати</button><button type="button" className="is-delete" onClick={()=>void deleteContact(contact)}><Trash2 size={13}/> Видалити</button></div></article>)}
        </div>
      </section>

      <section className="ad-page-editor-panel">
        <header><div><strong>Корисні сервіси</strong><small>Сервіси можна редагувати, вимикати, додавати та видаляти.</small></div><small>Перевірено: {verifiedAt ? new Date(verifiedAt).toLocaleString("uk-UA") : "—"}</small></header>
        <div className="ad-page-editor-form-grid">
          <label><span>Назва</span><input value={serviceTitle} onChange={(e)=>setServiceTitle(e.target.value)} /></label>
          <label><span>Короткий опис</span><input value={serviceNote} onChange={(e)=>setServiceNote(e.target.value)} /></label>
          <label><span>Іконка</span><select value={serviceIcon} onChange={(e)=>setServiceIcon(e.target.value as Stage2EmergencyService["icon"])}><option value="doctor">Лікар</option><option value="pharmacy">Аптека</option><option value="repair">СТО</option><option value="tow">Евакуатор</option><option value="vet">Ветеринар</option><option value="custom">Інше</option></select></label>
          <label><span>Колір</span><select value={serviceTone} onChange={(e)=>setServiceTone(e.target.value as Stage2EmergencyService["tone"])}><option value="green">Зелений</option><option value="purple">Фіолетовий</option><option value="orange">Помаранчевий</option><option value="blue">Синій</option></select></label>
        </div>
        <label className="ad-stage2-check"><input type="checkbox" checked={serviceActive} onChange={(e)=>setServiceActive(e.target.checked)} /><span>Сервіс увімкнений</span></label>
        <div className="ad-stage2-actions-row"><PrimaryButton onClick={() => void saveService()}>{serviceId ? <Check size={14}/> : <Plus size={14}/>} {serviceId ? "Зберегти сервіс" : "Додати сервіс"}</PrimaryButton>{serviceId ? <OutlineButton onClick={resetServiceForm}>Скасувати</OutlineButton> : null}</div>
        <div className="ad-page-editor-list">
          {services.map((service)=><article key={service.id} className={service.active ? "" : "is-disabled"}><span><strong>{service.title}</strong><small>{service.note || "Без опису"} · {service.active ? "увімкнено" : "вимкнено"}</small></span><div><button type="button" onClick={()=>editService(service)}><Edit3 size={13}/> Редагувати</button><button type="button" onClick={()=>void toggleService(service)}>{service.active ? "Вимкнути" : "Увімкнути"}</button><button type="button" className="is-delete" onClick={()=>void deleteService(service)}><Trash2 size={13}/> Видалити</button></div></article>)}
        </div>
      </section>
    </AdminShell>
  );
}

const DEFAULT_HOT_OFFERS_PAGE_CONTENT: Record<string, string> = {
  discount_label: "до",
  discount_value: "-30%",
  title: "Вигідні пропозиції\nдля вашого відпочинку",
  subtitle: "Спеціальні знижки\nвід перевірених партнерів 💚",
  search_placeholder: "Пошук місць, маршрутів, активностей...",
  section_title: "Пропозиції поруч",
  banner_image_url: "",
};

function HotOffersPageEditorScreen({ navigate }: AdminProps) {
  const adminKey = "";
  const [regions, setRegions] = useState<AdminPageRegion[]>([]);
  const [regionId, setRegionId] = useState("region-tatariv");
  const [pageContent, setPageContent] = useState<Record<string,string>>(DEFAULT_HOT_OFFERS_PAGE_CONTENT);
  const [offers, setOffers] = useState<Stage2HotOffer[]>([]);
  const [places, setPlaces] = useState<Array<{ id: string; name: string; category_slug: string; region_id: string; region_name: string }>>([]);
  const [categories, setCategories] = useState<Stage2Category[]>([]);
  const [message, setMessage] = useState("");
  const [savingPage, setSavingPage] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerId, setOfferId] = useState("");
  const [offerPlaceId, setOfferPlaceId] = useState("");
  const [offerCategorySlug, setOfferCategorySlug] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerDetail, setOfferDetail] = useState("");
  const [offerValidity, setOfferValidity] = useState("");
  const [offerBadge, setOfferBadge] = useState("Актуально");
  const [offerBadgeTone, setOfferBadgeTone] = useState<"gold"|"green"|"red">("green");
  const [offerValidFrom, setOfferValidFrom] = useState("");
  const [offerValidUntil, setOfferValidUntil] = useState("");
  const [offerActive, setOfferActive] = useState(true);

  const load = async () => {
    try {
      const [regionRows, offerRows, approvedPlaces, categoryRows, contentPayload] = await Promise.all([
        adminStage2Fetch<AdminPageRegion[]>("/admin/stage2/regions", adminKey),
        adminStage2Fetch<Stage2HotOffer[]>(`/admin/stage2/offers?region_id=${encodeURIComponent(regionId)}`, adminKey),
        adminStage2Fetch<Array<{ id: string; name: string; category_slug: string; region_id: string; region_name: string }>>("/admin/stage2/places?status=approved", adminKey),
        adminStage2Fetch<Stage2Category[]>("/categories", adminKey),
        adminStage2Fetch<Stage2PageContentResponse>(`/page-content/hot_offers?region_id=${encodeURIComponent(regionId)}`, adminKey),
      ]);
      setRegions(regionRows);
      setOffers(offerRows);
      setPlaces(approvedPlaces.filter((place) => place.region_id === regionId));
      setCategories(categoryRows);
      const content = Object.fromEntries(Object.entries(contentPayload.content || {}).map(([key,value])=>[key,typeof value==="string"?value:String(value??"")]));
      setPageContent({ ...DEFAULT_HOT_OFFERS_PAGE_CONTENT, ...content });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося завантажити сторінку");
    }
  };
  useEffect(()=>{ void load(); },[regionId]);

  const setPageField=(key:string,value:string)=>setPageContent((current)=>({...current,[key]:value}));
  const savePage = async () => {
    setSavingPage(true);
    try {
      const saved = await adminStage2Fetch<Stage2PageContentResponse>("/admin/stage2/page-content/hot_offers",adminKey,{method:"POST",body:JSON.stringify({region_id:regionId,content:pageContent})});
      const content = Object.fromEntries(Object.entries(saved.content || {}).map(([key,value])=>[key,typeof value==="string"?value:String(value??"")]));
      setPageContent({ ...DEFAULT_HOT_OFFERS_PAGE_CONTENT, ...content });
      setMessage(`Оформлення гарячих пропозицій збережено для регіону ${regions.find((item) => item.id === regionId)?.name || regionId}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка збереження сторінки: ${error.message}` : "Не вдалося зберегти сторінку");
    } finally {
      setSavingPage(false);
    }
  };

  const resetOffer = () => {
    setOfferId("");setOfferPlaceId("");setOfferCategorySlug("");setOfferTitle("");setOfferDiscount("");setOfferDescription("");setOfferDetail("");setOfferValidity("");setOfferBadge("Актуально");setOfferBadgeTone("green");setOfferValidFrom("");setOfferValidUntil("");setOfferActive(true);
  };
  const editOffer = (offer:Stage2HotOffer) => {
    setOfferId(offer.id);setOfferPlaceId(offer.place_id||"");setOfferCategorySlug(offer.category_slug||"");setOfferTitle(offer.title);setOfferDiscount(offer.discount||"");setOfferDescription(offer.description||"");setOfferDetail(offer.detail||"");setOfferValidity(offer.validity||"");setOfferBadge(offer.badge||"Актуально");setOfferBadgeTone(offer.badge_tone==="gold"||offer.badge_tone==="red"?offer.badge_tone:"green");setOfferValidFrom(offer.valid_from?offer.valid_from.slice(0,16):"");setOfferValidUntil(offer.valid_until?offer.valid_until.slice(0,16):"");setOfferActive(offer.active!==false);
  };
  const saveOffer = async () => {
    if(!offerTitle.trim()){setMessage("Вкажіть назву пропозиції.");return;}
    setSavingOffer(true);
    try {
      const place=places.find((item)=>item.id===offerPlaceId);
      const categorySlug = place?.category_slug || offerCategorySlug;
      const category=categories.find((item)=>item.slug===categorySlug);
      const saved = await adminStage2Fetch<Stage2HotOffer>("/admin/stage2/offers",adminKey,{method:"POST",body:JSON.stringify({id:offerId||undefined,region_id:regionId,place_id:offerPlaceId||null,category_slug:categorySlug||"",category_label:category?.name||categorySlug||"Пропозиція",title:offerTitle.trim(),discount:offerDiscount.trim(),description:offerDescription.trim(),detail:offerDetail.trim(),validity:offerValidity.trim(),badge:offerBadge.trim(),badge_tone:offerBadgeTone,valid_from:offerValidFrom||null,valid_until:offerValidUntil||null,active:offerActive})});
      setMessage(offerId?`Пропозицію «${saved.title || offerTitle}» оновлено.`:`Пропозицію «${saved.title || offerTitle}» створено.`);
      resetOffer();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка пропозиції: ${error.message}` : "Не вдалося зберегти пропозицію");
    } finally {
      setSavingOffer(false);
    }
  };
  const deleteOffer = async (offer:Stage2HotOffer) => {
    if(!window.confirm(`Видалити пропозицію «${offer.title}»?`))return;
    try {
      await adminStage2Fetch(`/admin/stage2/offers/${encodeURIComponent(offer.id)}`,adminKey,{method:"DELETE"});
      if(offerId===offer.id)resetOffer();
      setMessage("Пропозицію видалено.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка видалення: ${error.message}` : "Не вдалося видалити пропозицію");
    }
  };

  return (
    <AdminShell active="pages" navigate={navigate} contentClassName="ad-main--page-editors">
      <AdminPageHeader title="Редактор «Гарячі пропозиції»" subtitle="Шапка, банер та самі пропозиції." back={()=>navigate("admin","admin-pages")} action={<OutlineButton onClick={()=>void load()}><RefreshCcw size={16}/> Оновити</OutlineButton>} />
      <section className="ad-page-editor-region-select">
        <span>Редагується регіон</span>
        <select value={regionId} onChange={(e) => { setRegionId(e.target.value); resetOffer(); }}>
          {regions.length ? regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>) : <option value="region-tatariv">Татарів</option>}
        </select>
      </section>
      {message?<p className="ad-page-editor-message">{message}</p>:null}
      <section className="ad-page-editor-panel">
        <header><div><strong>Шапка та банер</strong><small>Можна змінити весь текст hero і фонове зображення без зміни верстки.</small></div></header>
        <div className="ad-page-editor-form-grid">
          <label><span>Підпис знижки</span><input value={pageContent.discount_label||""} onChange={(e)=>setPageField("discount_label",e.target.value)} /></label>
          <label><span>Значення знижки</span><input value={pageContent.discount_value||""} onChange={(e)=>setPageField("discount_value",e.target.value)} /></label>
          <label className="is-wide"><span>Заголовок</span><textarea rows={2} value={pageContent.title||""} onChange={(e)=>setPageField("title",e.target.value)} /></label>
          <label className="is-wide"><span>Підзаголовок</span><textarea rows={2} value={pageContent.subtitle||""} onChange={(e)=>setPageField("subtitle",e.target.value)} /></label>
          <label className="is-wide"><span>URL банера</span><input value={pageContent.banner_image_url||""} onChange={(e)=>setPageField("banner_image_url",e.target.value)} placeholder="https://... або залиште порожнім для поточного банера" /></label>
          <label><span>Плейсхолдер пошуку</span><input value={pageContent.search_placeholder||""} onChange={(e)=>setPageField("search_placeholder",e.target.value)} /></label>
          <label><span>Заголовок списку</span><input value={pageContent.section_title||""} onChange={(e)=>setPageField("section_title",e.target.value)} /></label>
        </div>
        <PrimaryButton onClick={()=>void savePage()} disabled={savingPage}><Check size={15}/> {savingPage ? "Збереження..." : "Зберегти оформлення сторінки"}</PrimaryButton>
      </section>

      <section className="ad-page-editor-panel">
        <header><div><strong>Пропозиції</strong><small>Створення, редагування, вимкнення за датами та видалення.</small></div></header>
        <select value={offerPlaceId} onChange={(e)=>{ const next=e.target.value; setOfferPlaceId(next); const place=places.find((item)=>item.id===next); if(place) setOfferCategorySlug(place.category_slug); }}><option value="">Без прив’язки до закладу</option>{places.map((place)=><option key={place.id} value={place.id}>{place.name} · {place.category_slug}</option>)}</select>
        <div className="ad-page-editor-form-grid">
          <label><span>Категорія</span><select value={offerCategorySlug} onChange={(e)=>setOfferCategorySlug(e.target.value)}><option value="">Без категорії</option>{categories.filter((item)=>item.slug!=="emergency"&&item.slug!=="hotel").map((item)=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
          <label><span>Назва</span><input value={offerTitle} onChange={(e)=>setOfferTitle(e.target.value)} /></label>
          <label><span>Знижка</span><input value={offerDiscount} onChange={(e)=>setOfferDiscount(e.target.value)} /></label>
          <label className="is-wide"><span>Короткий опис</span><input value={offerDescription} onChange={(e)=>setOfferDescription(e.target.value)} /></label>
          <label className="is-wide"><span>Детальний опис</span><textarea rows={3} value={offerDetail} onChange={(e)=>setOfferDetail(e.target.value)} /></label>
          <label><span>Підпис терміну</span><input value={offerValidity} onChange={(e)=>setOfferValidity(e.target.value)} /></label>
          <label><span>Бейдж</span><input value={offerBadge} onChange={(e)=>setOfferBadge(e.target.value)} /></label>
          <label><span>Колір бейджа</span><select value={offerBadgeTone} onChange={(e)=>setOfferBadgeTone(e.target.value as "gold"|"green"|"red")}><option value="green">Зелений</option><option value="gold">Золотий</option><option value="red">Червоний</option></select></label>
          <label><span>Початок</span><input type="datetime-local" value={offerValidFrom} onChange={(e)=>setOfferValidFrom(e.target.value)} /></label>
          <label><span>Завершення</span><input type="datetime-local" value={offerValidUntil} onChange={(e)=>setOfferValidUntil(e.target.value)} /></label>
        </div>
        <label className="ad-stage2-check"><input type="checkbox" checked={offerActive} onChange={(e)=>setOfferActive(e.target.checked)} /><span>Пропозиція активна</span></label>
        <div className="ad-stage2-actions-row"><PrimaryButton onClick={()=>void saveOffer()} disabled={savingOffer}>{offerId?<Check size={14}/>:<Plus size={14}/>} {savingOffer?"Збереження...":offerId?"Зберегти пропозицію":"Додати пропозицію"}</PrimaryButton>{offerId?<OutlineButton onClick={resetOffer}>Скасувати</OutlineButton>:null}</div>
        <div className="ad-page-editor-list">
          {offers.map((offer)=><article key={offer.id} className={offer.active===false?"is-disabled":""}><span><strong>{offer.title}</strong><small>{offer.discount||"Акція"} · {offer.place_name||offer.category_label||"без закладу"}</small></span><div><button type="button" onClick={()=>editOffer(offer)}><Edit3 size={13}/> Редагувати</button><button type="button" className="is-delete" onClick={()=>void deleteOffer(offer)}><Trash2 size={13}/> Видалити</button></div></article>)}
        </div>
      </section>
    </AdminShell>
  );
}

function CategoriesPageEditorScreen({ navigate }: AdminProps) {
  const adminKey="";
  const [categories,setCategories]=useState<Stage2Category[]>([]);
  const [slug,setSlug]=useState("");
  const [name,setName]=useState("");
  const [nameEn,setNameEn]=useState("");
  const [namePl,setNamePl]=useState("");
  const [subs,setSubs]=useState<string[]>([]);
  const [newSub,setNewSub]=useState("");
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  const load=async()=>{
    try{setCategories(await adminStage2Fetch<Stage2Category[]>("/categories",adminKey));}
    catch(error){setMessage(error instanceof Error?error.message:"Не вдалося завантажити категорії");}
  };
  useEffect(()=>{void load();},[]);
  const select=(item:Stage2Category)=>{setSlug(item.slug);setName(item.name);setNameEn(item.name_en||"");setNamePl(item.name_pl||"");setSubs([...(item.subcategories||[])]);setNewSub("");};
  const reset=()=>{setSlug("");setName("");setNameEn("");setNamePl("");setSubs([]);setNewSub("");};
  const updateSub=(index:number,value:string)=>setSubs((current)=>current.map((item,itemIndex)=>itemIndex===index?value:item));
  const removeSub=(index:number)=>setSubs((current)=>current.filter((_,itemIndex)=>itemIndex!==index));
  const addSub=()=>{
    const clean=newSub.trim();
    if(!clean){setMessage("Вкажіть назву підрозділу.");return;}
    if(subs.some((item)=>item.trim().toLocaleLowerCase("uk")===clean.toLocaleLowerCase("uk"))){setMessage("Такий підрозділ уже є.");return;}
    setSubs((current)=>[...current,clean]);
    setNewSub("");
    setMessage("");
  };
  const save=async()=>{
    if(!slug.trim()||!name.trim()){setMessage("Вкажіть slug і назву розділу.");return;}
    setSaving(true);
    try{
      const cleanSubs=subs.map((item)=>item.trim()).filter(Boolean);
      const saved=await adminStage2Fetch<Stage2Category>("/admin/stage2/categories",adminKey,{method:"POST",body:JSON.stringify({slug:slug.trim(),name:name.trim(),name_en:nameEn.trim()||null,name_pl:namePl.trim()||null,subcategories:cleanSubs})});
      setMessage(`Розділ «${saved.name || name.trim()}» і ${cleanSubs.length} підрозділів збережено.`);
      setSubs([...(saved.subcategories||cleanSubs)]);
      await load();
    }catch(error){setMessage(error instanceof Error?`Помилка збереження: ${error.message}`:"Не вдалося зберегти розділ");}
    finally{setSaving(false);}
  };
  return (
    <AdminShell active="pages" navigate={navigate} contentClassName="ad-main--page-editors">
      <AdminPageHeader title="Категорії / розділи" subtitle="Редагування назв вкладок і підрозділів винесено з «Контент / QR»." back={()=>navigate("admin","admin-pages")} action={<OutlineButton onClick={()=>void load()}><RefreshCcw size={16}/> Оновити</OutlineButton>} />
      {message?<p className="ad-page-editor-message">{message}</p>:null}
      <section className="ad-page-editor-split">
        <div className="ad-page-editor-panel">
          <header><div><strong>Розділи</strong><small>Оберіть існуючий або створіть новий.</small></div><button type="button" className="ad-page-editor-new" onClick={reset}><Plus size={14}/> Новий</button></header>
          <div className="ad-page-editor-category-list">{categories.filter((item)=>item.slug!=="emergency").map((item)=><button type="button" key={item.slug} className={slug===item.slug?"is-active":""} onClick={()=>select(item)}><strong>{item.name}</strong><small>{item.slug} · {(item.subcategories||[]).length} підрозділів</small><ChevronRight size={16}/></button>)}</div>
        </div>
        <div className="ad-page-editor-panel">
          <header><div><strong>{categories.some((item)=>item.slug===slug)?"Редагування розділу":"Новий розділ"}</strong><small>Назви та кожен підрозділ зберігаються окремим елементом у БД.</small></div></header>
          <div className="ad-page-editor-form-grid">
            <label><span>Slug</span><input value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="food" disabled={categories.some((item)=>item.slug===slug)} /></label>
            <label><span>Назва UA</span><input value={name} onChange={(e)=>setName(e.target.value)} /></label>
            <label><span>Назва EN</span><input value={nameEn} onChange={(e)=>setNameEn(e.target.value)} /></label>
            <label><span>Назва PL</span><input value={namePl} onChange={(e)=>setNamePl(e.target.value)} /></label>
          </div>

          <div className="ad-page-editor-subcategories">
            <header><div><strong>Підрозділи</strong><small>Кожен пункт редагується окремо — без списку через кому.</small></div></header>
            <div className="ad-page-editor-subcategory-list">
              {subs.map((item,index)=><div key={`subcategory-${index}`} className="ad-page-editor-subcategory-row"><input value={item} onChange={(e)=>updateSub(index,e.target.value)} placeholder={`Підрозділ ${index+1}`} /><button type="button" className="is-delete" onClick={()=>removeSub(index)} aria-label="Видалити підрозділ"><Trash2 size={14}/></button></div>)}
              {!subs.length?<small className="ad-page-editor-subcategory-empty">Підрозділів ще немає.</small>:null}
            </div>
            <div className="ad-page-editor-subcategory-add"><input value={newSub} onChange={(e)=>setNewSub(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();addSub();}}} placeholder="Назва нового підрозділу" /><button type="button" onClick={addSub}><Plus size={14}/> Додати підрозділ</button></div>
          </div>

          <PrimaryButton onClick={()=>void save()} disabled={saving}><Check size={15}/> {saving?"Збереження...":"Зберегти розділ"}</PrimaryButton>
        </div>
      </section>
    </AdminShell>
  );
}

function SettingsScreen({ navigate }: AdminProps) {
  return <GeneralSettingsScreen navigate={navigate} />;
}

function AdminAccessGate({ onUnlock }: { onUnlock: () => void }) {
  const [key,setKey]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const authorize=async()=>{
    setBusy(true);setError('');
    try {
      await adminStage2Fetch('/admin/stage2/regions', key);
      window.sessionStorage.setItem('gid-admin-key',key);
      onUnlock();
    } catch(e){setError(e instanceof Error?e.message:'Доступ заборонено');}
    finally{setBusy(false);}
  };
  return <div style={{maxWidth:460,margin:'10vh auto',padding:32,border:'1px solid #dce6df',borderRadius:20,background:'#fff',display:'grid',gap:18}}><h1>Вхід до адмінпанелі</h1><p>Введіть ключ адміністратора. Права перевіряються сервером; доступ до API без авторизації заблоковано.</p><input type="password" aria-label="Ключ адміністратора" placeholder="Ключ адміністратора" value={key} onChange={e=>setKey(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void authorize();}} style={{padding:15,border:'1px solid #d4dcd7',borderRadius:12}}/><button type="button" disabled={!key.trim()||busy} onClick={()=>void authorize()} style={{padding:14,borderRadius:12,background:'#17684e',color:'#fff'}}>{busy?'Перевіряємо...':'Увійти'}</button>{error?<p role="alert">{error}</p>:null}</div>;
}

export function AdminDesktopScreen({ slug, navigate }: { slug: string; navigate: Navigate }) {
  const [unlocked,setUnlocked]=useState(false);
  useEffect(()=>{setUnlocked(Boolean(window.sessionStorage.getItem('gid-admin-key')));},[]);
  if(!unlocked) return <AdminAccessGate onUnlock={()=>setUnlocked(true)}/>;
  switch (slug) {
    case "admin-stage2": return <Stage2ContentScreen navigate={navigate} />;
    case "admin-pages": return <PageEditorsHomeScreen navigate={navigate} />;
    case "admin-page-emergency": return <EmergencyPageEditorScreen navigate={navigate} />;
    case "admin-page-offers": return <HotOffersPageEditorScreen navigate={navigate} />;
    case "admin-page-categories": return <CategoriesPageEditorScreen navigate={navigate} />;
    case "admin-partners": return <PartnersScreen navigate={navigate} />;
    case "admin-partner-create": return <PartnerCreateScreen navigate={navigate} />;
    case "admin-partner-details": return <PartnerDetailsScreen navigate={navigate} />;
    case "admin-partner-history": return <PartnerHistoryScreen navigate={navigate} />;
    case "admin-clients": return <ClientsScreen navigate={navigate} />;
    case "admin-client-details": return <ClientDetailsScreen navigate={navigate} />;
    case "admin-client-history": return <ClientHistoryScreen navigate={navigate} />;
    case "admin-settlements": return <SettlementsScreen navigate={navigate} />;
    case "admin-bonuses": return <BonusesScreen navigate={navigate} />;
    case "admin-statistics": return <StatisticsOverview navigate={navigate} />;
    case "admin-statistics-partners": return <StatisticsSubscreen navigate={navigate} kind="partners" />;
    case "admin-statistics-clients": return <StatisticsSubscreen navigate={navigate} kind="clients" />;
    case "admin-statistics-bonuses": return <StatisticsSubscreen navigate={navigate} kind="bonuses" />;
    case "admin-statistics-settlements": return <StatisticsSubscreen navigate={navigate} kind="settlements" />;
    case "admin-settings": return <SettingsScreen navigate={navigate} />;
    case "admin-settings-general": return <GeneralSettingsScreen navigate={navigate} />;
    case "admin-settings-company": return <CompanySettingsScreen navigate={navigate} />;
    case "admin-settings-partners": return <PartnerCommissionSettingsScreen navigate={navigate} />;
    case "admin-settings-bonuses": return <BonusSettingsScreen navigate={navigate} />;
    case "admin-settings-notifications": return <NotificationSettingsScreen navigate={navigate} />;
    case "admin-settings-security": return <SecuritySettingsScreen navigate={navigate} />;
    case "admin-settings-integrations": return <IntegrationsSettingsScreen navigate={navigate} />;
    case "admin-settings-audit": return <AuditSettingsScreen navigate={navigate} />;
    default: return <PartnersScreen navigate={navigate} />;
  }
}
