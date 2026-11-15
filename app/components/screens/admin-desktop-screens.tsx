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
import { translateKnownLabel } from "../../lib/tourist-i18n";

type EditableTranslations = Record<string, Record<string, string>>;
const emptyTranslations = (): EditableTranslations => ({ en: {}, pl: {} });
const readTranslations = (source: unknown): EditableTranslations => {
  const obj = source && typeof source === "object" ? source as EditableTranslations : {};
  return { en: { ...(obj.en || {}) }, pl: { ...(obj.pl || {}) } };
};
function TranslationInputs({ fields, values, onChange }: {
  fields: Array<{ key: string; label: string; multiline?: boolean }>;
  values: EditableTranslations;
  onChange: (value: EditableTranslations) => void;
}) {
  return <div className="ad-page-editor-form-grid ad-i18n-fields">
    {(["en", "pl"] as const).flatMap((lang) => fields.map((field) => <label key={`${lang}-${field.key}`} className={field.multiline ? "is-wide" : ""}>
      <span>{field.label} · {lang.toUpperCase()}</span>
      {field.multiline ? <textarea rows={2} lang={lang} value={values[lang]?.[field.key] || ""} onChange={(e)=>onChange({...values,[lang]:{...(values[lang]||{}),[field.key]:e.target.value}})} />
        : <input lang={lang} value={values[lang]?.[field.key] || ""} onChange={(e)=>onChange({...values,[lang]:{...(values[lang]||{}),[field.key]:e.target.value}})} />}
    </label>))}
  </div>;
}
function TranslatedPageInputs({ fields, content, onField }: {
  fields: Array<{ key: string; label: string; multiline?: boolean }>;
  content: Record<string,string>;
  onField: (key: string,value: string) => void;
}) {
  return <div className="ad-page-editor-form-grid ad-i18n-fields">
    {(["en","pl"] as const).flatMap((language)=>fields.map(({key,label,multiline})=><label key={`${language}-${key}`} className={multiline ? "is-wide" : ""}>
      <span>{label} · {language.toUpperCase()}</span>
      {multiline ? <textarea rows={2} lang={language} value={content[`${key}_${language}`] || ""} onChange={(e)=>onField(`${key}_${language}`,e.target.value)}/>
        : <input lang={language} value={content[`${key}_${language}`] || ""} onChange={(e)=>onField(`${key}_${language}`,e.target.value)}/>}
    </label>))}
  </div>;
}

type Navigate = (role: RoleKey, slug: string) => void;
type AdminProps = { navigate: Navigate };

const ADMIN_SELECTED_PARTNER_KEY = "gid-tourist-admin-selected-partner-id";
const ADMIN_EDIT_PARTNER_KEY = "gid-tourist-admin-edit-partner-id";
const ADMIN_SELECTED_CLIENT_KEY = "gid-tourist-admin-selected-client-id";
type LiveClient = { id:string; region_name?:string|null; telegram_id?:string|null; telegram_username?:string|null; first_name?:string|null;last_name?:string|null;phone?:string|null;created_at?:string;last_active_at?:string;balance:number|string;earned:number|string;spent:number|string;events:number;bookings:number;purchases:number;reviews:number };
type LiveClientDetail = LiveClient & { selected_language?:string;ledger:Array<{id:string;amount:number|string;entry_type:string;status:string;created_at:string;place_name?:string|null}>;activity:Array<{id:string;event_type:string;created_at:string;place_name?:string|null}>;bookings:Array<{id:string;starts_at:string;status:string;price:number|string}>;purchases:Array<{id:string;created_at:string;amount:number|string;status:string}>;reviews:Array<{id:string;rating:number;status:string;created_at:string}> };
type LivePartnerSummary = { purchases:Array<{id:string;created_at:string;status:string;amount:number|string;commission:number|string;spent:number|string;earned:number|string}>; bookings:Array<{id:string;created_at:string;starts_at:string;status:string;party_size:number;price:number|string}>; events:Array<{id:string;created_at:string;event_type:string}>; confirmed_purchases:number;bookings_count:number;turnover:number;commission_due:number;compensation_due:number;net_due:number};
type LiveSettlement = {place_id:string;name:string;region_name:string;category_name:string;transactions:number;turnover:number|string;commission_due:number|string;compensation_due:number|string;net_due:number|string;paid_commission:number|string;balance_due:number|string};
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
  price_level?: number | null;
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
  translations?: EditableTranslations;
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

type NavKey = "partners" | "content" | "pages" | "clients" | "reviews" | "offers" | "settlements" | "bonuses" | "statistics" | "settings";

type TableColumn = {
  label: string;
  className?: string;
};

const adminNav: Array<{ key: NavKey; label: string; slug: string; icon: typeof UserRound }> = [
  { key: "partners", label: "Партнери", slug: "admin-partners", icon: UserRound },
  { key: "content", label: "Контент / QR", slug: "admin-stage2", icon: MapPin },
  { key: "pages", label: "Редактор сторінок", slug: "admin-pages", icon: Palette },
  { key: "clients", label: "Клієнти", slug: "admin-clients", icon: UsersRound },
  { key: "reviews", label: "Модерація відгуків", slug: "admin-review-moderation", icon: Star },
  { key: "offers", label: "Модерація акцій", slug: "admin-offer-moderation", icon: Gift },
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
          <small>Доступ адміністратора</small>
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

type FilterChoice = {value:string;label:string};
type FilterDefinition = {key:string;label:string;options:FilterChoice[];allLabel?:string};
const timePeriods:FilterChoice[] = [
  {value:'today',label:'Сьогодні'}, {value:'7d',label:'Останні 7 днів'},
  {value:'30d',label:'Останні 30 днів'}, {value:'90d',label:'Останні 90 днів'},
];
function matchesPeriod(value:string|undefined|null,period:string):boolean {
  if(!period)return true;
  if(!value)return false;
  const date=Date.parse(value);
  if(!Number.isFinite(date))return false;
  const delta=Date.now()-date;
  if(period==='today')return new Date(date).toDateString()===new Date().toDateString();
  const days=period==='7d'?7:period==='30d'?30:period==='90d'?90:0;
  return days>0&&delta>=0&&delta<=days*86400000;
}
function statusOptions(values:(string|null|undefined)[]):FilterChoice[] {
  const labels:Record<string,string>={approved:'Схвалено',pending:'На модерації',rejected:'Відхилено',inactive:'Неактивний',active:'Активний',confirmed:'Підтверджено',cancelled:'Скасовано',canceled:'Скасовано',completed:'Завершено',draft:'Чернетка'};
  return filterChoices(values).map(item=>({...item,label:labels[item.value]||item.label}));
}
const normalizeFilterText = (value:unknown) => String(value??'').normalize('NFKC').toLocaleLowerCase('uk-UA').trim();
function filterChoices(values:(string|null|undefined)[]):FilterChoice[] {
  return Array.from(new Set(values.map(v=>String(v??'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'uk-UA')).map(v=>({value:v,label:v}));
}
const clientIsActive=(c:LiveClient)=>Boolean(c.last_active_at&&Date.now()-new Date(c.last_active_at).getTime()<30*86400000);
/* Retains the pixel sizes, spacing, typography and DOM outline of the
   original static filter controls, with a native select overlay for interaction. */
function FilterStrip({search='',onSearch,fields=[],values={},onChange,onReset,placeholder='Пошук...',originalKeys}:{
 search?:string;onSearch?:(v:string)=>void;fields?:FilterDefinition[];values?:Record<string,string>;
 onChange?:(key:string,v:string)=>void;onReset?:()=>void;placeholder?:string;originalKeys?:string[];
}) {
 const shownFields=originalKeys ? originalKeys.flatMap(key=>fields.filter(field=>field.key===key)) : fields;
 const isAdditional=!originalKeys && (shownFields.length+(onSearch?1:0)>5);
 return <div className={`ad-filter-strip${isAdditional?' ad-filter-strip--additional':''}`}>
   {onSearch?<label className="ad-search-box"><Search size={20}/><input aria-label="Пошук у списку" placeholder={placeholder} value={search} onChange={e=>onSearch(e.target.value)}/></label>:null}
   {shownFields.map(field=>{
     const chosen=values[field.key]||'';
     const shownValue=field.options.find(item=>item.value===chosen)?.label || field.allLabel || 'Усі';
     return <label key={field.key} className="ad-select-box ad-native-picker">
       <span><small>{field.label}</small><strong>{shownValue}</strong></span>
       <ChevronDown size={16}/>
       <select className="ad-native-picker__select" aria-label={field.label} value={chosen} onChange={e=>onChange?.(field.key,e.target.value)}>
         <option value="">{field.allLabel||'Усі'}</option>
         {field.options.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
       </select>
     </label>;
   })}
   <OutlineButton onClick={onReset}><RefreshCcw size={17}/> Скинути фільтри</OutlineButton>
 </div>;
}
function Status({ tone = "green", children }: { tone?: "green" | "blue" | "gray" | "orange" | "red"; children: ReactNode }) {
  return <span className={`ad-status ad-status--${tone}`}>{children}</span>;
}
function AdminTable({ columns, children }: { columns: TableColumn[]; children: ReactNode }) {
  return <div className="ad-table-wrap"><div className="ad-table-head" style={{gridTemplateColumns:columns.map(c=>c.className||'1fr').join(' ')}}>
    {columns.map(col=><span key={col.label}>{col.label}</span>)}
  </div>{children}</div>;
}
function TableRow({ columns, children }: { columns: string[]; children: ReactNode }) {
  return <div className="ad-table-row" style={{gridTemplateColumns:columns.join(' ')}}>{children}</div>;
}
function Pagination({page,pageSize,total,onPage,onPageSize}:{page:number;pageSize:number;total:number;onPage:(p:number)=>void;onPageSize:(n:number)=>void}) {
 const pages=Math.max(1,Math.ceil(total/pageSize));
 useEffect(()=>{if(page>=pages)onPage(pages-1);},[page,pages,onPage]);
 return <div className="ad-pagination"><span>{total?`Показано ${page*pageSize+1}–${Math.min((page+1)*pageSize,total)} із ${total}`:'Записів за вибраними фільтрами немає'}</span>
   <div><button type="button" disabled={page===0} aria-label="Попередня сторінка" onClick={()=>onPage(Math.max(0,page-1))}><ChevronLeft size={16}/></button>
    {Array.from({length:Math.min(5,pages)},(_,i)=>Math.max(0,Math.min(page-2,pages-5))+i).map(i=><button type="button" key={i} className={i===page?'is-active':''} onClick={()=>onPage(i)} aria-label={`Сторінка ${i+1}`}>{i+1}</button>)}
    <button type="button" disabled={page>=pages-1} aria-label="Наступна сторінка" onClick={()=>onPage(Math.min(pages-1,page+1))}><ChevronRight size={16}/></button>
   </div>
   <label className="ad-select-box ad-native-picker"><span><strong>{pageSize} на сторінці</strong></span><ChevronDown size={16}/><select className="ad-native-picker__select" aria-label="Записів на сторінці" value={pageSize} onChange={e=>onPageSize(Number(e.target.value))}>{[10,25,50,100].map(n=><option key={n} value={n}>{n} на сторінці</option>)}</select></label>
 </div>;
}
function useTableFilters(){
 const [search,setSearch]=useState('');const [values,setValues]=useState<Record<string,string>>({});
 const [page,setPage]=useState(0);const [pageSize,setPageSize]=useState(10);
 const onSearch=(value:string)=>{setSearch(value);setPage(0);};
 const onChange=(key:string,value:string)=>{setValues(old=>({...old,[key]:value}));setPage(0);};
 const reset=()=>{setSearch('');setValues({});setPage(0);};
 const changeSize=(n:number)=>{setPageSize(n);setPage(0);};
 return {search,values,page,pageSize,onSearch,onChange,reset,setPage,changeSize};
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
  type PartnerListRow = { id:string; name:string;category_slug:string;subcategory?:string|null;address:string;status:string;region_id:string;region_name?:string;organization_name?:string;attributes?:Record<string,unknown> };
  const [rows, setRows] = useState<PartnerListRow[]>([]);
  const filters=useTableFilters();
  const [categories, setCategories] = useState<Stage2Category[]>([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      adminStage2Fetch<PartnerListRow[]>("/admin/stage2/partners"),
      stage2Fetch<Stage2Category[]>("/categories"),
    ]).then(([places, cats]) => { if (!cancelled) { setRows(places); setCategories(cats); } }).catch((e) => { if (!cancelled) setLoadError(e instanceof Error ? e.message : "Не вдалося завантажити партнерів"); });
    return () => { cancelled = true; };
  }, []);
  const categoryName = (slug: string) => categories.find((item) => item.slug === slug)?.name || slug;
  const placement=(r:PartnerListRow)=>String(r.attributes?.placement_type||'');
  const fields:FilterDefinition[]=[
    {key:'region',label:'Локація',allLabel:'Усі локації',options:filterChoices(rows.map(r=>r.region_name))},
    {key:'category',label:'Категорія',allLabel:'Усі категорії',options:Array.from(new Set(rows.map(r=>r.category_slug).filter(Boolean))).map(slug=>({value:slug,label:categoryName(slug)}))},
    {key:'subcategory',label:'Підкатегорія',allLabel:'Усі підкатегорії',options:filterChoices(rows.map(r=>r.subcategory))},
    {key:'placement',label:'Тип розміщення',allLabel:'Усі типи',options:filterChoices(rows.map(placement))},
    {key:'status',label:'Статус',allLabel:'Усі статуси',options:statusOptions(rows.map(r=>r.status))},
  ];
  const filteredRows=rows.filter(r=>{
    const v=filters.values;
    return (!filters.search||normalizeFilterText([r.name,r.address,r.organization_name,r.subcategory,r.id].join(' ')).includes(normalizeFilterText(filters.search)))
      &&(!v.region||r.region_name===v.region)&&(!v.category||r.category_slug===v.category)
      &&(!v.subcategory||r.subcategory===v.subcategory)
      &&(!v.placement||placement(r)===v.placement)&&(!v.status||r.status===v.status);
  });
  const visibleRows=filteredRows.slice(filters.page*filters.pageSize,(filters.page+1)*filters.pageSize);
  return (
    <AdminShell active="partners" navigate={navigate} contentClassName="ad-main--partners">
      <AdminPageHeader
        title="Партнери"
        action={<PrimaryButton onClick={() => { if (typeof window !== "undefined") window.sessionStorage.removeItem(ADMIN_EDIT_PARTNER_KEY); navigate("admin", "admin-partner-create"); }}><Plus size={18} /> Новий партнер</PrimaryButton>}
      />
      <FilterStrip placeholder="Пошук партнера..." search={filters.search} onSearch={filters.onSearch} fields={fields} values={filters.values} onChange={filters.onChange} onReset={filters.reset} originalKeys={["region", "category", "placement", "status"]}/>
      {loadError ? <div className="ad-create-message is-error">{loadError}</div> : null}
      <AdminTable columns={[
        { label: "Назва", className: "1.8fr" }, { label: "Категорія", className: "1fr" }, { label: "Локація", className: ".9fr" },
        { label: "Тип розміщення", className: "1.05fr" }, { label: "Статус", className: ".8fr" }, { label: "Дії", className: ".7fr" },
      ]}>
        {visibleRows.map((row) => (
          <TableRow key={row.id} columns={["1.8fr", "1fr", ".9fr", "1.05fr", ".8fr", ".7fr"]}>
            <div className="ad-entity-cell"><PartnerListIcon name={row.name} /><div><strong>{row.name}</strong><small>{row.subcategory || row.organization_name || "Партнер"}</small></div></div>
            <span>{categoryName(row.category_slug)}</span><span>{row.region_name || row.address || "—"}</span><Status>{placement(row)||'Не вказано'}</Status>
            <Status tone={row.status === "approved" ? "green" : row.status === "rejected" ? "red" : row.status === "pending" ? "orange" : "gray"}>{row.status}</Status>
            <div className="ad-row-actions">
              <button onClick={() => { rememberPartner(row.id); navigate("admin", "admin-partner-details"); }} aria-label="Переглянути"><Eye size={17} /></button>
              <button onClick={() => { rememberPartner(row.id, true); navigate("admin", "admin-partner-create"); }} aria-label="Редагувати"><Edit3 size={17} /></button>
            </div>
          </TableRow>
        ))}
        {!filteredRows.length && !loadError ? <div className="ad-stage2-empty-row">Партнерів за вибраними фільтрами немає</div> : null}
      </AdminTable>
      <Pagination page={filters.page} pageSize={filters.pageSize} total={filteredRows.length} onPage={filters.setPage} onPageSize={filters.changeSize}/>
    </AdminShell>
  );
}

function ClientsScreen({ navigate }: AdminProps) {
  const {data:clients,error}=useAdminRemote<LiveClient[]>('/admin/platform/clients');
  const filters=useTableFilters();
  const fields:FilterDefinition[]=[
    {key:'status',label:'Статус',allLabel:'Усі статуси',options:[{value:'active',label:'Активні за 30 днів'},{value:'inactive',label:'Неактивні'}]},
    {key:'region',label:'Місто / локація',allLabel:'Усі міста',options:filterChoices((clients||[]).map(c=>c.region_name))},
    {key:'balance',label:'Рівень бонусів',allLabel:'Усі баланси',options:[{value:'positive',label:'Є бонуси'},{value:'zero',label:'Без бонусів'}]},
    {key:'purchases',label:'Покупки',allLabel:'Усі клієнти',options:[{value:'yes',label:'Є покупки'},{value:'no',label:'Без покупок'}]},
    {key:'registered',label:'Дата реєстрації',allLabel:'Весь період',options:timePeriods},
  ];
  const filtered=(clients||[]).filter(c=>(!filters.search||normalizeFilterText([clientFullName(c),c.telegram_id,c.telegram_username,c.phone,c.id].join(' ')).includes(normalizeFilterText(filters.search)))
    &&(!filters.values.status||(filters.values.status==='active')===clientIsActive(c))
    &&(!filters.values.region||c.region_name===filters.values.region)
    &&(!filters.values.balance||(filters.values.balance==='positive'?Number(c.balance)>0:Number(c.balance)<=0))
    &&(!filters.values.purchases||(filters.values.purchases==='yes'?Number(c.purchases)>0:Number(c.purchases)<=0))
    &&matchesPeriod(c.created_at,filters.values.registered||''));
  return <AdminShell active="clients" navigate={navigate} contentClassName="ad-main--clients">
    <AdminPageHeader title="Клієнти"/><FilterStrip placeholder="Пошук клієнта..." search={filters.search} onSearch={filters.onSearch} fields={fields} values={filters.values} onChange={filters.onChange} onReset={filters.reset} originalKeys={["status", "region"]}/>
    <AdminRemoteInfo error={error} data={clients}/>
    {clients?<><AdminTable columns={[{label:"Ім'я",className:"1.5fr"},{label:"Telegram",className:"1fr"},{label:"Статус",className:".9fr"},{label:"Бонуси",className:".8fr"},{label:"Остання активність",className:"1.45fr"},{label:"Дії",className:".8fr"}]}>
      {filtered.slice(filters.page*filters.pageSize,(filters.page+1)*filters.pageSize).map(c=><TableRow key={c.id} columns={["1.5fr","1fr",".9fr",".8fr","1.45fr",".8fr"]}>
        <div className="ad-client-cell"><span>{(c.first_name?.[0]||c.telegram_username?.[0]||'T').toUpperCase()}</span><div><strong>{clientFullName(c)}</strong><small>{c.events||0} подій · {c.purchases||0} покупок</small></div></div>
        <span>{c.telegram_username?`@${c.telegram_username}`:c.telegram_id||'—'}</span>
        <Status tone={clientIsActive(c)?'green':'gray'}>{clientIsActive(c)?'Активний':'Неактивний'}</Status>
        <strong>{countUA(c.balance)} балів</strong><span>{dateUA(c.last_active_at)}</span>
        <button className="ad-text-btn" onClick={()=>{sessionStorage.setItem(ADMIN_SELECTED_CLIENT_KEY,c.id);navigate('admin','admin-client-details');}}>Картка</button>
      </TableRow>)}
      {!filtered.length?<div className="ad-stage2-empty-row">Клієнтів за вибраними фільтрами немає</div>:null}
    </AdminTable><Pagination page={filters.page} pageSize={filters.pageSize} total={filtered.length} onPage={filters.setPage} onPageSize={filters.changeSize}/></>:null}
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
  const filters=useTableFilters();
  const fields:FilterDefinition[]=[
    {key:'status',label:'Статус',allLabel:'Усі статуси',options:[{value:'active',label:'Активні за 30 днів'},{value:'inactive',label:'Неактивні'}]},
    {key:'region',label:'Місто / локація',allLabel:'Усі міста',options:filterChoices((clients||[]).map(c=>c.region_name))},
    {key:'balance',label:'Рівень бонусів',allLabel:'Усі баланси',options:[{value:'positive',label:'Є бонуси'},{value:'zero',label:'Немає бонусів'}]},
    {key:'earned',label:'Загальний статус',allLabel:'Усі клієнти',options:[{value:'yes',label:'Були нарахування'},{value:'no',label:'Без нарахувань'}]},
    {key:'spent',label:'Використання',allLabel:'Усі клієнти',options:[{value:'yes',label:'Були списання'},{value:'no',label:'Без списань'}]},
  ];
  const filtered=(clients||[]).filter(c=>(!filters.search||normalizeFilterText([clientFullName(c),c.phone,c.telegram_id,c.telegram_username].join(' ')).includes(normalizeFilterText(filters.search)))
    &&(!filters.values.status||(filters.values.status==='active')===clientIsActive(c))
    &&(!filters.values.region||c.region_name===filters.values.region)
    &&(!filters.values.balance||(filters.values.balance==='positive'?Number(c.balance)>0:Number(c.balance)<=0))
    &&(!filters.values.earned||(filters.values.earned==='yes'?Number(c.earned)>0:Number(c.earned)<=0))
    &&(!filters.values.spent||(filters.values.spent==='yes'?Number(c.spent)>0:Number(c.spent)<=0)));
  return <AdminShell active="bonuses" navigate={navigate}>
    <AdminPageHeader title="Бонуси"/><AdminRemoteInfo error={error||statsError} data={clients&&stats}/>
    {clients&&stats?<><div className="ad-summary-grid ad-summary-grid--five">
      <SummaryCard label="Загальний оборот підтверджених покупок" value={moneyUA(stats.transactions.find(t=>t.status==='confirmed')?.turnover)}/>
      <SummaryCard label="Нараховано бонусів" value={moneyUA(filtered.reduce((sum,c)=>sum+Number(c.earned),0))} tone="violet"/>
      <SummaryCard label="Використано бонусів" value={moneyUA(filtered.reduce((sum,c)=>sum+Number(c.spent),0))} tone="blue"/>
      <SummaryCard label="Баланс клієнтів" value={moneyUA(filtered.reduce((sum,c)=>sum+Number(c.balance),0))} tone="orange"/>
      <SummaryCard label="Клієнтів" value={countUA(filtered.length)}/>
    </div><FilterStrip placeholder="Пошук клієнта..." search={filters.search} onSearch={filters.onSearch} fields={fields} values={filters.values} onChange={filters.onChange} onReset={filters.reset} originalKeys={["status", "region", "earned", "balance"]}/>
    <AdminTable columns={[{label:"Клієнт",className:"1.35fr"},{label:"Телефон",className:"1fr"},{label:"Telegram ID",className:".8fr"},{label:"Нараховано",className:".9fr"},{label:"Баланс",className:".9fr"},{label:"Списано",className:".9fr"},{label:"Остання активність",className:"1fr"}]}>
      {filtered.slice(filters.page*filters.pageSize,(filters.page+1)*filters.pageSize).map(c=><TableRow key={c.id} columns={["1.35fr","1fr",".8fr",".9fr",".9fr","1fr","1fr"]}><strong>{clientFullName(c)}</strong><span>{c.phone||'Не надано'}</span><span>{c.telegram_id||'—'}</span><strong>{moneyUA(c.earned)}</strong><strong className="ad-green-number">{moneyUA(c.balance)}</strong><strong>{moneyUA(c.spent)}</strong><span>{dateUA(c.last_active_at)}</span></TableRow>)}
      {!filtered.length?<div className="ad-stage2-empty-row">Клієнтів за вибраними фільтрами немає</div>:null}
    </AdminTable><Pagination page={filters.page} pageSize={filters.pageSize} total={filtered.length} onPage={filters.setPage} onPageSize={filters.changeSize}/></>:null}
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
  const [placeTypeTemplates, setPlaceTypeTemplates] = useState<Stage2PlaceTypeTemplate[]>([]);
  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [priceLevel, setPriceLevel] = useState("");
  const [forKids, setForKids] = useState(false);
  const [parking, setParking] = useState(false);
  const currentCategory = categories.find((item) => item.slug === categorySlug);
  const categorySubcategories = (currentCategory?.subcategories || []).filter((item) => typeof item === "string" && item.trim());
  // Some categories (e.g. hotels) have no tourist subcategories, but do have
  // administratively managed venue types such as Готель and Садиба.
  const availableSubcategories = categorySubcategories.length
    ? categorySubcategories
    : Array.from(new Set(placeTypeTemplates.filter((item) => item.category_slug === categorySlug).map((item) => item.place_type).filter(Boolean)));
  const categoryFilters = currentCategory?.filter_config || {};
  const onCategoryChange = (next: string) => {
    if (next === categorySlug) return;
    setCategorySlug(next);
    setSubcategory("");
    setPriceLevel("");
    setForKids(false);
    setParking(false);
  };
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
  const [partnerTranslations,setPartnerTranslations]=useState<EditableTranslations>(emptyTranslations);
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
      setCategorySlug((previous) => previous || list[0]?.slug || "");
    }).catch((e) => setError(e instanceof Error ? e.message : "Не вдалося завантажити категорії"));
  }, []);

  useEffect(() => {
    void stage2Fetch<Stage2PlaceTypeTemplate[]>("/place-type-templates")
      .then(setPlaceTypeTemplates)
      .catch(() => setPlaceTypeTemplates([]));
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
      setSubcategory(row.subcategory || "");
      setPriceLevel(row.price_level == null ? "" : String(row.price_level));
      setForKids(attrs.kids === true);
      setParking(attrs.parking === true);
      setPlacement((attrs.placement_type === "basic" || attrs.placement_type === "premium") ? attrs.placement_type : "social");
      setRate(String(attrs.rate_percent ?? 0));
      setCity(String(details.city || "")); setRegionName(String(details.region_name || row.region_name || "")); setStreet(String(details.street || "")); setHouse(String(details.house || ""));
      setAddress(row.address || ""); setLat(Number(row.lat)); setLng(Number(row.lng)); setMapDraft({ lat: Number(row.lat), lng: Number(row.lng) }); setMapSelected(true);
      setPhone(String(row.phone || "")); setDescription(String(row.description || ""));
      setPartnerTranslations(readTranslations(row.translations));
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
    if (subcategory && !availableSubcategories.includes(subcategory) && !editId) return setError("Оберіть підкатегорію з довідника");
    if (!ids.length || ids.some((item) => !/^\d{5,20}$/.test(item))) return setError("Вкажіть один або декілька коректних числових Telegram ID");
    if (!mapSelected && (!cityPlaceId || !streetPlaceId || !housePlaceId)) return setError("Оберіть повну адресу з підказок або вкажіть точку на мапі");
    setSaving(true);
    try {
      const requestBody = {
        name: name.trim(), category_slug: categorySlug, subcategory: subcategory || null, price_level: categoryFilters.price ? (priceLevel ? Number(priceLevel) : null) : null, placement_type: placement, rate_percent: Number(rate) || 0,
        city, region_name: regionName, street, house, address, lat, lng, map_selected: mapSelected,
        phone, description, translations:partnerTranslations, image_url: photos[0] || null, telegram_ids: ids, publish,
        work_hours: alwaysOpen ? { always_open: true } : { daily: { from: workFrom, to: workTo } },
        attributes: { partner: true, placement_type: placement, rate_percent: Number(rate) || 0, kids: categoryFilters.kids === true && forKids, parking: categoryFilters.parking === true && parking },
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
        <div className="ad-create-row ad-create-row--2"><div className="ad-create-row__label"><span>2</span><strong>Категорія</strong></div><div className="ad-create-row__control">
          <div className="ad-partner-category-fields">
            <select className="ad-native-select" aria-label="Категорія закладу" value={categorySlug} onChange={(e)=>onCategoryChange(e.target.value)}><option value="">Оберіть категорію</option>{categories.map((item)=><option key={item.slug} value={item.slug}>{item.slug === "hotel" ? "Готель / точка входу" : item.name}</option>)}</select>
            {categorySlug ? <label className="ad-partner-category-field"><span>{categorySubcategories.length ? "Підкатегорія" : "Тип закладу / підкатегорія"}</span>
              <select className="ad-native-select" aria-label="Підкатегорія закладу" value={subcategory} onChange={(e)=>setSubcategory(e.target.value)} disabled={!availableSubcategories.length}>
                <option value="">{availableSubcategories.length ? "Оберіть підкатегорію" : "Підкатегорій у довіднику немає"}</option>
                {availableSubcategories.map((value)=><option key={value} value={value}>{value}</option>)}
                {editId && subcategory && !availableSubcategories.includes(subcategory) ? <option value={subcategory}>{subcategory} (раніше збережена)</option> : null}
              </select>
            </label> : null}
            {categorySlug && (categoryFilters.price || categoryFilters.kids || categoryFilters.parking) ? <div className="ad-partner-category-filter-fields">
              <strong>Параметри закладу для фільтрації</strong>
              {categoryFilters.price ? <label className="ad-partner-category-field"><span>Цінова категорія</span><select className="ad-native-select" value={priceLevel} aria-label="Цінова категорія" onChange={(e)=>setPriceLevel(e.target.value)}>
                <option value="">Не вказано</option><option value="1">Бюджетна · ₴</option><option value="2">Середня · ₴₴</option><option value="3">Висока · ₴₴₴</option><option value="4">Преміум · ₴₴₴₴</option>
              </select></label> : null}
              {categoryFilters.kids ? <label className="ad-partner-category-toggle"><input type="checkbox" checked={forKids} onChange={(e)=>setForKids(e.target.checked)}/><span>Підходить для відвідування з дітьми</span></label> : null}
              {categoryFilters.parking ? <label className="ad-partner-category-toggle"><input type="checkbox" checked={parking} onChange={(e)=>setParking(e.target.checked)}/><span>Є паркування</span></label> : null}
            </div> : null}
            {categorySlug ? <small className="ad-partner-category-hint">Відстань визначається за координатами, «Відкрито зараз» — за графіком, рейтинг — за відгуками. Ці значення не заповнюються вручну.</small> : null}
          </div>
        </div></div>
        <div className="ad-create-row ad-create-row--3"><div className="ad-create-row__label"><span>3</span><strong>Тип розміщення</strong></div><div className="ad-create-row__control"><div className="ad-placement-options">{([['social','Соціальний','Безкоштовне розміщення'],['basic','Базовий','Інфо про заклад + QR для гостей'],['premium','Платний / Преміум','Просування послуг та монетизація']] as const).map(([key,title,note])=><label key={key} className={placement===key?'is-selected':''} onClick={()=>setPlacement(key)}><i>{placement===key?<Check size={14}/>:null}</i><span><strong>{title}</strong><small>{note}</small></span></label>)}</div></div></div>
        <div className="ad-create-row ad-create-row--4"><div className="ad-create-row__label"><span>4</span><strong>Ставка, %</strong></div><div className="ad-create-row__control"><div className="ad-input-with-suffix"><input type="number" min="0" max="100" value={rate} onChange={(e)=>setRate(e.target.value)} /><span>%</span></div></div></div>
        <div className="ad-create-row ad-create-row--5"><div className="ad-create-row__label"><span>5</span><strong>Адреса або геолокація</strong></div><div className="ad-create-row__control">{geoFields}</div></div>
        <div className="ad-create-row ad-create-row--6"><div className="ad-create-row__label"><span>6</span><strong>Телефон</strong></div><div className="ad-create-row__control"><input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+380 (___) ___-__-__" /></div></div>
        <div className="ad-create-row ad-create-row--7"><div className="ad-create-row__label"><span>7</span><strong>Графік роботи</strong></div><div className="ad-create-row__control"><div className="ad-placement-options ad-placement-options--schedule"><label className={alwaysOpen?'is-selected':''} onClick={()=>setAlwaysOpen(true)}><i>{alwaysOpen?<Check size={14}/>:null}</i><span><strong>Цілодобово</strong></span></label><label className={!alwaysOpen?'is-selected':''} onClick={()=>setAlwaysOpen(false)}><i>{!alwaysOpen?<Check size={14}/>:null}</i><span><strong>За графіком</strong></span><input type="time" value={workFrom} onChange={(e)=>setWorkFrom(e.target.value)} onClick={(e)=>e.stopPropagation()} /><em>–</em><input type="time" value={workTo} onChange={(e)=>setWorkTo(e.target.value)} onClick={(e)=>e.stopPropagation()} /></label></div></div></div>
        <div className="ad-create-row ad-create-row--8"><div className="ad-create-row__label"><span>8</span><strong>Короткий опис</strong></div><div className="ad-create-row__control"><textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Опишіть партнера, послуги, особливості тощо..." rows={3} /></div></div>
        <div className="ad-create-row"><div className="ad-create-row__label"><strong>Переклади для туристів</strong></div><div className="ad-create-row__control"><TranslationInputs fields={[{key:"name",label:"Назва"},{key:"description",label:"Опис",multiline:true}]} values={partnerTranslations} onChange={setPartnerTranslations}/></div></div>
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
  const ledgerFilters=useTableFilters();
  const eventFilters=useTableFilters();
  const ledger=client?.ledger||[];
  const activities=client?.activity||[];
  const ledgerFields:FilterDefinition[]=[
    {key:'type',label:'Тип операції',allLabel:'Усі типи',options:filterChoices(ledger.map(r=>r.entry_type))},
    {key:'status',label:'Статус',allLabel:'Усі статуси',options:statusOptions(ledger.map(r=>r.status))},
    {key:'period',label:'Період',allLabel:'Весь період',options:timePeriods},
  ];
  const filteredLedger=ledger.filter(r=>(!ledgerFilters.search||normalizeFilterText([r.place_name,r.entry_type,r.id].join(' ')).includes(normalizeFilterText(ledgerFilters.search)))
    &&(!ledgerFilters.values.type||r.entry_type===ledgerFilters.values.type)
    &&(!ledgerFilters.values.status||r.status===ledgerFilters.values.status)
    &&matchesPeriod(r.created_at,ledgerFilters.values.period||''));
  const activityFields:FilterDefinition[]=[
    {key:'event',label:'Тип події',allLabel:'Усі події',options:filterChoices(activities.map(r=>r.event_type))},
    {key:'period',label:'Період',allLabel:'Весь період',options:timePeriods},
  ];
  const filteredActivities=activities.filter(r=>(!eventFilters.search||normalizeFilterText([r.place_name,r.event_type,r.id].join(' ')).includes(normalizeFilterText(eventFilters.search)))
    &&(!eventFilters.values.event||r.event_type===eventFilters.values.event)
    &&matchesPeriod(r.created_at,eventFilters.values.period||''));
  return <AdminShell active="clients" navigate={navigate} contentClassName="ad-main--clients ad-main--client-history">
    <AdminRemoteInfo error={error} data={client}/>{client?<><ClientHeader client={client} navigate={navigate}/>
      <section className="ad-detail-card"><h2>Історія бонусів</h2>
      <FilterStrip placeholder="Партнер або тип операції" search={ledgerFilters.search} onSearch={ledgerFilters.onSearch} fields={ledgerFields} values={ledgerFilters.values} onChange={ledgerFilters.onChange} onReset={ledgerFilters.reset}/><AdminTable columns={[{label:"Дата",className:"1fr"},{label:"Тип",className:"1fr"},{label:"Партнер",className:"1.5fr"},{label:"Сума",className:".7fr"},{label:"Статус",className:".8fr"}]}>
        {filteredLedger.slice(ledgerFilters.page*ledgerFilters.pageSize,(ledgerFilters.page+1)*ledgerFilters.pageSize).map(x=><TableRow key={x.id} columns={["1fr","1fr","1.5fr",".7fr",".8fr"]}><span>{dateUA(x.created_at)}</span><span>{x.entry_type}</span><span>{x.place_name||'—'}</span><strong>{countUA(x.amount)}</strong><Status>{x.status}</Status></TableRow>)}
        {!filteredLedger.length?<div className="ad-stage2-empty-row">Операцій за вибраними фільтрами немає</div>:null}
      </AdminTable><Pagination page={ledgerFilters.page} pageSize={ledgerFilters.pageSize} total={filteredLedger.length} onPage={ledgerFilters.setPage} onPageSize={ledgerFilters.changeSize}/></section>
      <section className="ad-detail-card"><h2>Історія дій</h2>
      <FilterStrip placeholder="Подія або заклад" search={eventFilters.search} onSearch={eventFilters.onSearch} fields={activityFields} values={eventFilters.values} onChange={eventFilters.onChange} onReset={eventFilters.reset}/><AdminTable columns={[{label:"Дата",className:"1fr"},{label:"Подія",className:"1.3fr"},{label:"Заклад",className:"1.5fr"}]}>
        {filteredActivities.slice(eventFilters.page*eventFilters.pageSize,(eventFilters.page+1)*eventFilters.pageSize).map(x=><TableRow key={x.id} columns={["1fr","1.3fr","1.5fr"]}><span>{dateUA(x.created_at)}</span><strong>{x.event_type}</strong><span>{x.place_name||'—'}</span></TableRow>)}
        {!filteredActivities.length?<div className="ad-stage2-empty-row">Подій за вибраними фільтрами немає</div>:null}
      </AdminTable><Pagination page={eventFilters.page} pageSize={eventFilters.pageSize} total={filteredActivities.length} onPage={eventFilters.setPage} onPageSize={eventFilters.changeSize}/></section></>:null}
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
  const paymentFilters=useTableFilters();
  const activityFilters=useTableFilters();
  const purchases=history?.purchases||[];
  const events=history?.events||[];
  const paymentFields:FilterDefinition[]=[
    {key:'status',label:'Статус',allLabel:'Усі статуси',options:statusOptions(purchases.map(r=>r.status))},
    {key:'period',label:'Період',allLabel:'Весь період',options:timePeriods},
  ];
  const filteredPayments=purchases.filter(r=>(!paymentFilters.search||normalizeFilterText([r.id,r.status].join(' ')).includes(normalizeFilterText(paymentFilters.search)))
    &&(!paymentFilters.values.status||r.status===paymentFilters.values.status)
    &&matchesPeriod(r.created_at,paymentFilters.values.period||''));
  const eventFields:FilterDefinition[]=[
    {key:'event',label:'Тип події',allLabel:'Усі події',options:filterChoices(events.map(r=>r.event_type))},
    {key:'period',label:'Період',allLabel:'Весь період',options:timePeriods},
  ];
  const filteredEvents=events.filter(r=>(!activityFilters.search||normalizeFilterText([r.id,r.event_type].join(' ')).includes(normalizeFilterText(activityFilters.search)))
    &&(!activityFilters.values.event||r.event_type===activityFilters.values.event)
    &&matchesPeriod(r.created_at,activityFilters.values.period||''));
  useEffect(() => {
    const id = selectedAdminPartnerId();
    if (id) void adminStage2Fetch<AdminPartnerDetail>(`/admin/stage2/partners/${encodeURIComponent(id)}`).then(setPartner).catch(() => undefined);
  }, []);
  return (
    <AdminShell active="partners" navigate={navigate} contentClassName="ad-main--partner-history">
      <AdminPageHeader title={partner ? `Історія — ${partner.name}` : "Історія партнера"} action={<OutlineButton onClick={() => navigate("admin", "admin-partner-details")}><ArrowLeft size={16}/> До партнера</OutlineButton>} />
      {historyError?<div className="ad-create-message is-error">{historyError}</div>:null}
      <section className="ad-detail-card"><h2>Історія операцій</h2>
      <FilterStrip placeholder="ID або статус операції" search={paymentFilters.search} onSearch={paymentFilters.onSearch} fields={paymentFields} values={paymentFilters.values} onChange={paymentFilters.onChange} onReset={paymentFilters.reset}/><AdminTable columns={[{label:"Дата",className:"1fr"},{label:"Статус",className:"1fr"},{label:"Сума",className:"1fr"},{label:"Комісія",className:"1fr"}]}>
        {filteredPayments.slice(paymentFilters.page*paymentFilters.pageSize,(paymentFilters.page+1)*paymentFilters.pageSize).map(row=><TableRow key={row.id} columns={["1fr","1fr","1fr","1fr"]}><span>{dateUA(row.created_at)}</span><Status>{row.status}</Status><strong>{moneyUA(row.amount)}</strong><span>{moneyUA(row.commission)}</span></TableRow>)}
        {history&&!filteredPayments.length?<div className="ad-stage2-empty-row">Операцій за вибраними фільтрами немає</div>:null}
      </AdminTable><Pagination page={paymentFilters.page} pageSize={paymentFilters.pageSize} total={filteredPayments.length} onPage={paymentFilters.setPage} onPageSize={paymentFilters.changeSize}/></section>
      <section className="ad-detail-card"><h2>Активність</h2>
      <FilterStrip placeholder="ID або назва події" search={activityFilters.search} onSearch={activityFilters.onSearch} fields={eventFields} values={activityFilters.values} onChange={activityFilters.onChange} onReset={activityFilters.reset}/><AdminTable columns={[{label:"Дата",className:"1fr"},{label:"Подія",className:"2fr"}]}>
        {filteredEvents.slice(activityFilters.page*activityFilters.pageSize,(activityFilters.page+1)*activityFilters.pageSize).map(row=><TableRow key={row.id} columns={["1fr","2fr"]}><span>{dateUA(row.created_at)}</span><strong>{row.event_type}</strong></TableRow>)}
        {history&&!filteredEvents.length?<div className="ad-stage2-empty-row">Подій за вибраними фільтрами немає</div>:null}
      </AdminTable><Pagination page={activityFilters.page} pageSize={activityFilters.pageSize} total={filteredEvents.length} onPage={activityFilters.setPage} onPageSize={activityFilters.changeSize}/></section>
    </AdminShell>
  );
}

type ModerationReviewRow = {
  id:string; place_id:string; place_name:string; rating:number; text:string; verification:string;
  status:string; moderation_comment?:string|null; partner_reply?:string|null; created_at:string;
  user_id:string;
};
type PendingPartnerOffer = {
  id:string;title:string;discount:string;description?:string|null;detail?:string|null;terms?:string|null;
  image_url?:string|null;valid_until?:string|null;moderation_status:string;moderation_comment?:string|null;
  created_at:string;place_name:string;region_name:string;
};
function OfferModerationScreen({navigate}:AdminProps) {
  const [offers,setOffers]=useState<PendingPartnerOffer[]>([]);
  const [filter,setFilter]=useState('pending');
  const filters=useTableFilters();
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');
  const [comments,setComments]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);setError('');try{setOffers(await adminStage2Fetch<PendingPartnerOffer[]>('/admin/platform/offers/moderation'));}
    catch(e){setError(e instanceof Error?e.message:'Не вдалося завантажити модерацію');}finally{setLoading(false);}};
  useEffect(()=>{void load();},[]);
  const decide=async(id:string,status:'approved'|'rejected')=>{
    const comment=comments[id]?.trim()||'';
    if(status==='rejected'&&!comment){setError('Для відхилення вкажіть причину');return;}
    setBusy(id);setError('');
    try{await adminStage2Fetch(`/admin/platform/offers/${encodeURIComponent(id)}/moderate`,'',{method:'PATCH',body:JSON.stringify({status,comment})});await load();}
    catch(e){setError(e instanceof Error?e.message:'Не вдалося змінити статус');}finally{setBusy('');}
  };
  const fields:FilterDefinition[]=[
    {key:'region',label:'Локація',allLabel:'Усі локації',options:filterChoices(offers.map(o=>o.region_name))},
    {key:'validity',label:'Термін дії',allLabel:'Усі пропозиції',options:[{value:'current',label:'Ще діє'},{value:'expired',label:'Термін минув'},{value:'unset',label:'Без кінцевої дати'}]},
    {key:'period',label:'Додано',allLabel:'Весь період',options:timePeriods},
  ];
  const visible=offers.filter(item=>(filter==='all'||item.moderation_status===filter)
    &&(!filters.search||normalizeFilterText([item.title,item.place_name,item.region_name,item.discount,item.description,item.id].join(' ')).includes(normalizeFilterText(filters.search)))
    &&(!filters.values.region||item.region_name===filters.values.region)
    &&(!filters.values.validity||(filters.values.validity==='unset'?!item.valid_until:filters.values.validity==='current'?Boolean(item.valid_until&&Date.parse(item.valid_until)>=Date.now()):Boolean(item.valid_until&&Date.parse(item.valid_until)<Date.now())))
    &&matchesPeriod(item.created_at,filters.values.period||''));
  return <AdminShell active="offers" navigate={navigate} contentClassName="ad-main--review-moderation">
    <AdminPageHeader title="Модерація гарячих пропозицій" action={<OutlineButton onClick={()=>void load()}><RefreshCcw size={16}/> Оновити</OutlineButton>}/>
    <div className="ad-review-moderation-tabs">{['pending','approved','rejected','all'].map(item=><button key={item} type="button" className={filter===item?'is-active':''} onClick={()=>setFilter(item)}>{item==='pending'?'Очікують':item==='approved'?'Схвалені':item==='rejected'?'Відхилені':'Усі'} · {item==='all'?offers.length:offers.filter(o=>o.moderation_status===item).length}</button>)}</div>
    <FilterStrip placeholder="Назва акції, заклад, знижка" search={filters.search} onSearch={filters.onSearch} fields={fields} values={filters.values} onChange={filters.onChange} onReset={()=>{filters.reset();setFilter('pending');}}/>
    {error?<p role="alert" className="ad-create-message is-error">{error}</p>:null}
    {loading?<p>Завантаження з PostgreSQL…</p>:null}
    {!loading&&!visible.length?<div className="ad-stage2-empty-row">Пропозицій у цьому статусі немає.</div>:null}
    <div className="ad-offer-moderation-list">{visible.map(o=><article key={o.id} className="ad-offer-moderation-card">
      {o.image_url?<img src={o.image_url} alt={o.title}/>:null}
      <div><small>{o.place_name} · {o.region_name}</small><h2>{o.title}</h2><strong>{o.discount}</strong><p>{o.description||o.detail||'Опис не додано'}</p>
        {o.terms?<small>Умови: {o.terms}</small>:null}
        {o.valid_until?<small>Діє до: {new Date(o.valid_until).toLocaleDateString('uk-UA')}</small>:null}
        <small>Статус: {o.moderation_status==='pending'?'Очікує':o.moderation_status==='approved'?'Схвалено':'Відхилено'}{o.moderation_comment?` · ${o.moderation_comment}`:''}</small>
        {o.moderation_status==='pending'?<><input placeholder="Коментар / причина відхилення" value={comments[o.id]||''} onChange={e=>setComments(prev=>({...prev,[o.id]:e.target.value}))}/>
          <div className="ad-offer-actions"><button type="button" disabled={busy===o.id} onClick={()=>void decide(o.id,'approved')}><Check size={16}/> Схвалити</button><button type="button" disabled={busy===o.id} onClick={()=>void decide(o.id,'rejected')}><X size={16}/> Відхилити</button></div>
        </>:null}
      </div>
    </article>)}</div>
  </AdminShell>;
}

function ReviewModerationScreen({navigate}:AdminProps) {
  const [rows,setRows]=useState<ModerationReviewRow[]>([]);
  const [status,setStatus]=useState<'pending'|'approved'|'rejected'|'all'>('pending');
  const filters=useTableFilters();
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [comments,setComments]=useState<Record<string,string>>({});
  const refresh=async()=>{setLoading(true);setError('');try{const data=await adminStage2Fetch<ModerationReviewRow[]>('/admin/platform/reviews');setRows(data);}catch(e){setError(e instanceof Error?e.message:'Не вдалося отримати відгуки');}finally{setLoading(false);}};
  useEffect(()=>{void refresh();},[]);
  const update=async(id:string,target:'approved'|'rejected')=>{
    if(target==='rejected' && !(comments[id]||'').trim()){setError('Для відхилення потрібна причина.');return;}
    setBusy(id);setError('');try{
      await adminStage2Fetch(`/admin/platform/reviews/${encodeURIComponent(id)}`,'',{method:'PATCH',body:JSON.stringify({status:target,comment:comments[id]||''})});
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:'Не вдалося змінити статус');}finally{setBusy('');}
  };
  const fields:FilterDefinition[]=[
    {key:'verification',label:'Підтвердження',allLabel:'Усі відгуки',options:filterChoices(rows.map(r=>r.verification))},
    {key:'rating',label:'Оцінка',allLabel:'Усі оцінки',options:[1,2,3,4,5].map(n=>({value:String(n),label:`${n} з 5`}))},
    {key:'period',label:'Дата відгуку',allLabel:'Весь період',options:timePeriods},
  ];
  const visible=rows.filter(r=>(status==='all'||r.status===status)
    &&(!filters.search||normalizeFilterText([r.place_name,r.text,r.user_id,r.id].join(' ')).includes(normalizeFilterText(filters.search)))
    &&(!filters.values.verification||r.verification===filters.values.verification)
    &&(!filters.values.rating||r.rating===Number(filters.values.rating))
    &&matchesPeriod(r.created_at,filters.values.period||''));
  const badge=(s:string)=>s==='approved'?'Схвалено':s==='rejected'?'Відхилено':'Очікує модерації';
  return <AdminShell active="reviews" navigate={navigate} contentClassName="ad-main--review-moderation">
    <AdminPageHeader title="Модерація відгуків" action={<OutlineButton onClick={()=>void refresh()}><RefreshCcw size={16}/> Оновити</OutlineButton>}/>
    <div className="ad-review-moderation-tabs">{(['pending','approved','rejected','all'] as const).map(s=><button key={s} type="button" className={s===status?'is-active':''} onClick={()=>setStatus(s)}>{s==='all'?'Усі':badge(s)} · {s==='all'?rows.length:rows.filter(r=>r.status===s).length}</button>)}</div>
    <FilterStrip placeholder="Заклад, текст відгуку, клієнт" search={filters.search} onSearch={filters.onSearch} fields={fields} values={filters.values} onChange={filters.onChange} onReset={()=>{filters.reset();setStatus('pending');}}/>
    {error?<div className="ad-create-message is-error" role="alert">{error}</div>:null}
    {loading?<div className="ad-stage2-empty-row">Завантаження відгуків…</div>:null}
    {!loading && !visible.length?<div className="ad-stage2-empty-row">Відгуків із цим статусом поки немає.</div>:null}
    <div className="ad-review-moderation-list">{!loading && visible.map(r=><article className="ad-detail-card ad-review-moderation-card" key={r.id}>
      <div className="ad-review-moderation-card__header"><div><small>{dateUA(r.created_at)} · {r.id}</small><h3>{r.place_name}</h3><span>{badge(r.status)} · {r.verification==='verified_purchase'?'Підтверджена покупка':r.verification==='verified_booking'?'Завершене бронювання':r.verification}</span></div><strong className="ad-review-stars">{'★'.repeat(Math.max(0,Math.min(5,r.rating)))}{'☆'.repeat(Math.max(0,5-r.rating))}</strong></div>
      <p className="ad-review-moderation-text">{r.text||'Відгук без тексту'}</p>
      {r.partner_reply?<p className="ad-review-moderation-reply"><b>Відповідь партнера:</b> {r.partner_reply}</p>:null}
      {r.moderation_comment?<p className="ad-review-moderation-reply"><b>Попередній коментар модерації:</b> {r.moderation_comment}</p>:null}
      <label className="ad-review-moderation-comment"><span>Причина / примітка модератора</span><textarea rows={2} value={comments[r.id]||''} onChange={e=>setComments(c=>({...c,[r.id]:e.target.value}))} placeholder="Причина відхилення обов'язкова"/></label>
      <div className="ad-review-moderation-actions"><button type="button" disabled={busy===r.id||r.status==='approved'} onClick={()=>void update(r.id,'approved')}><Check size={16}/> Схвалити</button><button type="button" disabled={busy===r.id||r.status==='rejected'} onClick={()=>void update(r.id,'rejected')}><X size={16}/> Відхилити</button></div>
    </article>)}</div>
  </AdminShell>;
}

type AdminPaymentClaim = {id:string;place_id:string;place_name:string;amount:number|string;status:string;reference:string;receipt_filename:string;created_at:string;review_comment?:string|null};
function AdminPaymentClaims({onChanged}:{onChanged:()=>void}) {
  const [claims,setClaims]=useState<AdminPaymentClaim[]>([]);
  const filters=useTableFilters();
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');
  const [comments,setComments]=useState<Record<string,string>>({});
  const refresh=async()=>{try{setError('');setClaims(await adminStage2Fetch<AdminPaymentClaim[]>('/admin/platform/payment-claims'));}catch(e){setError(e instanceof Error?e.message:'Помилка отримання оплат');}};
  useEffect(()=>{void refresh();},[]);
  const receipt=async(id:string)=>{
    try{setError('');const result=await adminStage2Fetch<{filename:string;mime:string;base64:string}>(`/admin/platform/payment-claims/${encodeURIComponent(id)}/receipt`);
      const bytes=atob(result.base64);const buffer=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)buffer[i]=bytes.charCodeAt(i);
      const blob=new Blob([buffer.buffer as ArrayBuffer],{type:result.mime});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=result.filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
    }catch(e){setError(e instanceof Error?e.message:'Не вдалося завантажити квитанцію');}
  };
  const decide=async(id:string,status:'approved'|'rejected')=>{
    if(!window.confirm(status==='approved'?'Підтверджуєте, що банківське надходження реально звірене? Сума зменшить заборгованість партнера.':'Відхилити цю заявку на оплату?'))return;
    if(status==='rejected'&&!(comments[id]||'').trim()){setError('Укажіть причину відхилення');return;}
    setBusy(id);setError('');try{await adminStage2Fetch(`/admin/platform/payment-claims/${encodeURIComponent(id)}`,'',{method:'PATCH',body:JSON.stringify({status,comment:comments[id]||''})});await refresh();onChanged();}catch(e){setError(e instanceof Error?e.message:'Не вдалося обробити заявку');}finally{setBusy('');}
  };
  const fields:FilterDefinition[]=[
    {key:'status',label:'Статус заявки',allLabel:'Усі статуси',options:statusOptions(claims.map(c=>c.status))},
    {key:'period',label:'Дата заявки',allLabel:'Весь період',options:timePeriods},
  ];
  const visible=claims.filter(c=>(!filters.search||normalizeFilterText([c.place_name,c.reference,c.receipt_filename,c.id].join(' ')).includes(normalizeFilterText(filters.search)))
    &&(!filters.values.status||c.status===filters.values.status)
    &&matchesPeriod(c.created_at,filters.values.period||''));
  return <section className="ad-detail-card ad-finance-claims"><h2>Перевірка реальних оплат партнерів</h2><p>Заявка не зараховує гроші автоматично. Перед схваленням фінансовий оператор звіряє квитанцію й банківську виписку.</p>
    <FilterStrip placeholder="Партнер, призначення, квитанція" search={filters.search} onSearch={filters.onSearch} fields={fields} values={filters.values} onChange={filters.onChange} onReset={filters.reset}/>
    {error?<div className="ad-create-message is-error" role="alert">{error}</div>:null}
    {!visible.length?<div className="ad-stage2-empty-row">Заявок за вибраними фільтрами немає</div>:visible.slice(filters.page*filters.pageSize,(filters.page+1)*filters.pageSize).map(c=><div className="ad-finance-claim-row" key={c.id}>
      <div><strong>{c.place_name}</strong><small>{dateUA(c.created_at)} · {c.reference}</small><span>{moneyUA(c.amount)} · {c.status==='approved'?'Підтверджено':c.status==='rejected'?'Відхилено':'На перевірці'}</span>
        {c.review_comment?<small>{c.review_comment}</small>:null}</div>
      <div className="ad-finance-claim-actions"><button type="button" onClick={()=>void receipt(c.id)}><Download size={16}/> Квитанція</button>
        {c.status==='pending'?<><input value={comments[c.id]||''} onChange={e=>setComments(x=>({...x,[c.id]:e.target.value}))} placeholder="Коментар оператора"/>
          <button type="button" disabled={busy===c.id} onClick={()=>void decide(c.id,'approved')}><Check size={16}/> Підтвердити після звірки</button>
          <button type="button" disabled={busy===c.id} onClick={()=>void decide(c.id,'rejected')}><X size={16}/> Відхилити</button></>:null}
      </div>
    </div>)}
    <Pagination page={filters.page} pageSize={filters.pageSize} total={visible.length} onPage={filters.setPage} onPageSize={filters.changeSize}/>
  </section>;
}

function SettlementsScreen({navigate}:AdminProps){
  const [revision,setRevision]=useState(0);
  const filters=useTableFilters();
  const {data:rows,error}=useAdminRemote<LiveSettlement[]>(`/admin/platform/settlements?revision=${revision}`);
  const fields:FilterDefinition[]=[
   {key:'region',label:'Локація',allLabel:'Усі локації',options:filterChoices((rows||[]).map(r=>r.region_name))},
   {key:'category',label:'Категорія',allLabel:'Усі категорії',options:filterChoices((rows||[]).map(r=>r.category_name))},
   {key:'balance',label:'Статус рахунку',allLabel:'Усі баланси',options:[{value:'debt',label:'Є заборгованість'},{value:'credit',label:'Переплата'},{value:'settled',label:'Баланс нульовий'}]},
   {key:'payments',label:'Статус оплати',allLabel:'Усі оплати',options:[{value:'yes',label:'Є оплати'},{value:'no',label:'Оплат немає'}]},
   {key:'transactions',label:'Операції',allLabel:'Усі партнери',options:[{value:'yes',label:'Є операції'},{value:'no',label:'Без операцій'}]},
  ];
  const filteredRows=(rows||[]).filter(r=>(!filters.search||normalizeFilterText([r.name,r.region_name,r.category_name,r.place_id].join(' ')).includes(normalizeFilterText(filters.search)))
   &&(!filters.values.region||r.region_name===filters.values.region)
   &&(!filters.values.category||r.category_name===filters.values.category)
   &&(!filters.values.balance||(filters.values.balance==='debt'?Number(r.balance_due)>0:filters.values.balance==='credit'?Number(r.balance_due)<0:Number(r.balance_due)===0))
   &&(!filters.values.payments||(filters.values.payments==='yes'?Number(r.paid_commission)>0:Number(r.paid_commission)<=0))
   &&(!filters.values.transactions||(filters.values.transactions==='yes'?Number(r.transactions)>0:Number(r.transactions)<=0)));

  const commission=filteredRows.reduce((s,r)=>s+Number(r.commission_due),0);
  const reimbursement=filteredRows.reduce((s,r)=>s+Number(r.compensation_due),0);
  const turnover=filteredRows.reduce((s,r)=>s+Number(r.turnover),0);
  const paid=filteredRows.reduce((s,r)=>s+Number(r.paid_commission),0);
  const remaining=filteredRows.reduce((s,r)=>s+Number(r.balance_due),0);
  return <AdminShell active="settlements" navigate={navigate} contentClassName="ad-main--settlements">
    <AdminPageHeader title="Взаєморозрахунки з партнерами" subtitle="За підтвердженими операціями із PostgreSQL; рахунки й оплати вручну не вигадуються"/>
    <AdminRemoteInfo error={error} data={rows}/>{rows?<><div className="ad-summary-grid ad-summary-grid--five">
      <SummaryCard label="Оборот" value={moneyUA(turnover)}/><SummaryCard label="Комісія платформи" value={moneyUA(commission)} tone="blue"/>
      <SummaryCard label="Компенсація бонусів" value={moneyUA(reimbursement)} tone="orange"/>
      <SummaryCard label="Несплачений баланс" value={moneyUA(remaining)} tone="violet"/>
      <SummaryCard label="Підтверджено оплат" value={moneyUA(paid)}/>
    </div><FilterStrip placeholder="Пошук партнера..." search={filters.search} onSearch={filters.onSearch} fields={fields} values={filters.values} onChange={filters.onChange} onReset={filters.reset} originalKeys={["region", "category", "balance", "payments"]}/><AdminTable columns={[{label:"Партнер",className:"1.6fr"},{label:"Локація",className:".9fr"},{label:"Категорія",className:".9fr"},{label:"Операцій",className:".7fr"},{label:"Оборот",className:".9fr"},{label:"Комісія",className:".9fr"},{label:"Оплачено",className:".9fr"},{label:"Залишок",className:".9fr"}]}>
      {filteredRows.slice(filters.page*filters.pageSize,(filters.page+1)*filters.pageSize).map(r=><TableRow key={r.place_id} columns={["1.6fr",".9fr",".9fr",".7fr",".9fr",".9fr",".9fr",".9fr"]}><strong>{r.name}</strong><span>{r.region_name}</span><span>{r.category_name}</span><span>{r.transactions}</span><strong>{moneyUA(r.turnover)}</strong><span>{moneyUA(r.commission_due)}</span><span>{moneyUA(r.paid_commission)}</span><strong className={Number(r.balance_due)<0?'ad-red-number':'ad-green-number'}>{moneyUA(r.balance_due)}</strong></TableRow>)}
      {!filteredRows.length?<div className="ad-stage2-empty-row">Немає партнерів за вибраним фільтром</div>:null}
    </AdminTable><Pagination page={filters.page} pageSize={filters.pageSize} total={filteredRows.length} onPage={filters.setPage} onPageSize={filters.changeSize}/></>:null}
    <AdminPaymentClaims onChanged={()=>setRevision(x=>x+1)}/>
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

type StatisticsPartnerOption = {category_slug:string;status:string;attributes?:Record<string,unknown>};
function useStatisticsFilters(){
  const [values,setValues]=useState<Record<string,string>>({});
  const {data:regions,error:regionError}=useAdminRemote<Array<{id:string;name:string}>>('/admin/stage2/regions');
  const {data:partners,error:partnersError}=useAdminRemote<StatisticsPartnerOption[]>('/admin/stage2/partners');
  const {data:categories,error:categoryError}=useAdminRemote<Stage2Category[]>('/categories');
  const fields:FilterDefinition[]=[
    {key:'region_id',label:'Локація',allLabel:'Усі локації',options:(regions||[]).map(r=>({value:r.id,label:r.name}))},
    {key:'category_slug',label:'Категорія',allLabel:'Усі категорії',options:Array.from(new Set((partners||[]).map(p=>p.category_slug))).filter(Boolean).map(slug=>({value:slug,label:categories?.find(c=>c.slug===slug)?.name||slug}))},
    {key:'placement_type',label:'Тип розміщення',allLabel:'Усі типи',options:filterChoices((partners||[]).map(p=>String(p.attributes?.placement_type||'')))},
    {key:'partner_status',label:'Статус партнера',allLabel:'Усі статуси',options:statusOptions((partners||[]).map(p=>p.status))},
  ];
  const params=new URLSearchParams();
  for(const key of ['region_id','category_slug','placement_type','partner_status'])if(values[key])params.set(key,values[key]);
  const query=params.toString();
  const {data:stats,error:statsError}=useAdminRemote<LiveAnalytics>(`/admin/platform/analytics${query?'?'+query:''}`);
  return {stats,error:statsError||regionError||partnersError||categoryError,fields,values,
    onChange:(key:string,value:string)=>setValues(prev=>({...prev,[key]:value})),reset:()=>setValues({})};
}

function StatisticsOverview({navigate}:AdminProps){
  const filters=useStatisticsFilters();
  const {stats,error}=filters;
  const confirmed=stats?.transactions.find(x=>x.status==='confirmed');
  const partnerCount=stats?.places.reduce((sum,x)=>sum+x.count,0)||0;
  return <AdminShell active="statistics" navigate={navigate} contentClassName="ad-main--statistics">
    <StatTop slug="admin-statistics" navigate={navigate} title="Статистика"/><AdminRemoteInfo error={error} data={stats}/>
    {stats?<><div className="ad-summary-grid ad-summary-grid--four">
      <SummaryCard label="Оборот підтверджених покупок" value={moneyUA(confirmed?.turnover)}/>
      <SummaryCard label="Кількість клієнтів" value={countUA(stats.clients.total)} tone="violet"/>
      <SummaryCard label="Нараховано бонусів" value={moneyUA(stats.bonuses.earned)} tone="orange"/>
      <SummaryCard label="Кількість партнерів" value={countUA(partnerCount)} tone="blue"/>
    </div><FilterStrip fields={filters.fields} values={filters.values} onChange={filters.onChange} onReset={filters.reset} originalKeys={["region_id","category_slug","placement_type","partner_status"]}/><div className="ad-stats-dashboard">
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
  const filters=useStatisticsFilters();
  const {stats,error}=filters;
  const titles={partners:'Партнери',clients:'Клієнти',bonuses:'Бонуси',settlements:'Розрахунки'};
  return <AdminShell active="statistics" navigate={navigate} contentClassName="ad-main--statistics">
    <StatTop slug={`admin-statistics-${kind}`} navigate={navigate} title={`Статистика — ${titles[kind]}`}/><AdminRemoteInfo error={error} data={stats}/>
    {stats?<><StatsMetricGrid kind={kind} stats={stats}/><FilterStrip fields={filters.fields} values={filters.values} onChange={filters.onChange} onReset={filters.reset} originalKeys={["region_id","category_slug","placement_type","partner_status"]}/><div className="ad-stats-subgrid">
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
  | "admin-settings-audit";
type SettingsSection = 'general' | 'company' | 'partners' | 'notifications';

type SettingsSnapshot = {
  values: Record<string, Record<string, unknown>>;
  regions: Array<{id:string;name:string;active:boolean;places_count:number}>;
  categories: Array<{slug:string;name:string;active:boolean;places_count:number}>;
  partner_statuses: Array<{status:string;count:number}>;
  bonus_rules: Array<{region_id:string;region_name:string;earn_percent:number|string;max_spend_percent:number|string;expiration_days:number;min_purchase:number|string;updated_at:string}>;
  admin_users: Array<{id:string;first_name:string|null;last_name:string|null;telegram_username:string|null;role:string}>;
  admin_sessions: Array<{user_id:string;created_at:string;expires_at:string}>;
  security_runtime:{admin_key_configured:boolean;auth_mode:string};
};
type SettingsAudit = {id:string;actor_type:string;actor_user_id?:string|null;region_id?:string|null;entity_type:string;entity_id:string;action:string;details:Record<string,unknown>;created_at:string};
const settingsTabs: Array<{label:string;slug:SettingsSlug}> = [
  {label:'Загальні',slug:'admin-settings-general'},
  {label:'Компанія',slug:'admin-settings-company'},
  {label:'Партнери та комісії',slug:'admin-settings-partners'},
  {label:'Бонусна система',slug:'admin-settings-bonuses'},
  {label:'Сповіщення',slug:'admin-settings-notifications'},
  {label:'Безпека',slug:'admin-settings-security'},
  {label:'Журнал дій',slug:'admin-settings-audit'},
];
function SettingsTabs({active,navigate}:{active:SettingsSlug;navigate:Navigate}) {
  const chosen=active==='admin-settings'?'admin-settings-general':active;
  return <nav className="ad-settings-tabs">{settingsTabs.map(tab=><button type="button" key={tab.slug} className={chosen===tab.slug?'is-active':''} onClick={()=>navigate('admin',tab.slug)}>{tab.label}</button>)}</nav>;
}
function SettingsPanel({title,children,className=''}:{title:string;children:ReactNode;className?:string}) {
  return <section className={`ad-settings-panel ${className}`.trim()}><h2>{title}</h2>{children}</section>;
}
function settingsText(value:unknown):string { return value===undefined||value===null?'':String(value); }
function asSettingsObject(value:unknown):Record<string,unknown> {return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}
const SETTINGS_VISIBLE_FIELDS:Record<SettingsSection,readonly string[]> = {
  general:['show_archived_partners','show_inactive_clients','auto_refresh','allow_partner_registration','require_partner_approval','allow_partner_edits','display_partner_rating','show_hints','maintenance_mode','log_retention_months','archive_retention_months','logo_url','primary_color','secondary_color'],
  company:['legal_name','tax_id','address','iban','bank','vat_payer','vat_rate'],
  partners:['commission_rate','category_commissions','auto_assign_commission','show_partner_commission','show_partner_debt','minimum_order','commission_duration_days'],
  notifications:['email','phone','telegram','push_endpoint','email_enabled','sms_enabled','telegram_enabled','push_enabled','daily_summary','daily_time','weekly_summary','weekly_day','quiet_hours','quiet_start','quiet_end'],
};
function visibleSettings(section:SettingsSection, values:Record<string,unknown>|undefined):Record<string,unknown> {
  const source=values||{};
  return Object.fromEntries(SETTINGS_VISIBLE_FIELDS[section].filter(key=>Object.hasOwn(source,key)).map(key=>[key,source[key]]));
}

function exportSettingsToJson(data:SettingsSnapshot) {
  const exported=Object.fromEntries((Object.keys(SETTINGS_VISIBLE_FIELDS) as SettingsSection[]).map(section=>[section,visibleSettings(section,data.values[section])]));
  const blob=new Blob([JSON.stringify(exported,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='gid-tourist-settings.json';link.click();URL.revokeObjectURL(url);
}
function useSettingsStore(section:SettingsSection|null) {
  const [data,setData]=useState<SettingsSnapshot|null>(null);
  const [form,setForm]=useState<Record<string,unknown>>({});
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const refresh=async()=>{
    setLoading(true);setError('');setMessage('');
    try {
      const response=await adminStage2Fetch<SettingsSnapshot>('/admin/platform/settings');
      setData(response);setForm(section?visibleSettings(section,response.values[section]):{});
    } catch(e) {
      setData(null);
      const detail=e instanceof Error?e.message:'Не вдалося отримати налаштування';
      const missingSettingsRoute=/Cannot GET \/api\/v1\/admin\/platform\/settings(?:\s|$)|\bAPI 404\b/i.test(detail);
      setError(missingSettingsRoute
        ? 'Не вдалося завантажити налаштування (404). Перевірте доступність сервера.'
        : detail);
    }
    finally {setLoading(false);}
  };
  useEffect(()=>{void refresh();},[section]);
  const change=(key:string,value:unknown)=>{setForm(previous=>({...previous,[key]:value}));setMessage('');};
  const save=async()=>{
    if(!section)return;
    setBusy(true);setError('');setMessage('');
    try {
      const response=await adminStage2Fetch<{values:Record<string,unknown>}>(`/admin/platform/settings/${section}`,'',{method:'PATCH',body:JSON.stringify({values:visibleSettings(section,form)})});
      setForm(visibleSettings(section,response.values));setData(previous=>previous?{...previous,values:{...previous.values,[section]:response.values}}:previous);
      setMessage('Зміни збережено.');
    }catch(e){setError(e instanceof Error?e.message:'Не вдалося зберегти налаштування');}
    finally{setBusy(false);}
  };
  return {data,form,loading,busy,error,message,refresh,change,save,setData,setError,setMessage};
}
type SettingsStore = ReturnType<typeof useSettingsStore>;
function SettingInput({label,id,form,change,type='text',wide=false,hint}:{label:string;id:string;form:Record<string,unknown>;change:(key:string,value:unknown)=>void;type?:string;wide?:boolean;hint?:string}) {
  return <label className={`ad-live-field ${wide?'is-wide':''}`}><span>{label}</span><input type={type} value={settingsText(form[id])} onChange={e=>change(id,e.target.value)} autoComplete="off"/>{hint?<small>{hint}</small>:null}</label>;
}
function SettingCheck({label,id,form,change,note}:{label:string;id:string;form:Record<string,unknown>;change:(key:string,value:unknown)=>void;note?:string}) {
  const defined=typeof form[id]==='boolean';
  return <label className="ad-live-check"><span><strong>{label}</strong>{note?<small>{note}</small>:null}{!defined?<small>Не налаштовано</small>:null}</span><input type="checkbox" checked={form[id]===true} onChange={e=>change(id,e.target.checked)}/></label>;
}
function SettingTextarea({label,id,form,change}:{label:string;id:string;form:Record<string,unknown>;change:(key:string,value:unknown)=>void}) {
  return <label className="ad-live-field is-wide"><span>{label}</span><textarea rows={3} value={settingsText(form[id])} onChange={e=>change(id,e.target.value)}/></label>;
}

async function logoFileToDataUrl(file:File):Promise<string> {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Оберіть PNG, JPG або WebP');
  if (file.size>4*1024*1024) throw new Error('Максимальний розмір файлу — 4 МБ');
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();
    await new Promise<void>((resolve,reject)=>{
      image.onload=()=>resolve(); image.onerror=()=>reject(new Error('Не вдалося відкрити зображення'));image.src=url;
    });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth>12000 || image.naturalHeight>12000) throw new Error('Некоректні розміри логотипа');
    for (const maxSide of [560,450,350,260,180]) {
      const ratio=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
      const ctx=canvas.getContext('2d');
      if(!ctx)throw new Error('Браузер не може обробити логотип');
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      for(const quality of [.86,.73,.6]) {
        const result=canvas.toDataURL('image/webp',quality);
        if (result.length<180000 && /^data:image\/(webp|png);base64,/.test(result)) return result;
      }
    }
    throw new Error('Не вдалося зменшити логотип до допустимого розміру');
  } finally {URL.revokeObjectURL(url);}
}
function SettingLogoUpload({value,change}:{value:unknown;change:(key:string,value:unknown)=>void}) {
  const ref=useRef<HTMLInputElement>(null);
  const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  const src=typeof value==='string'&&(/^(https:\/\/|data:image\/(webp|png|jpeg);base64,)/i.test(value))?value:'';
  const handle=async(files:FileList|null)=>{
    const file=files?.[0];if(!file)return;
    setError('');setLoading(true);
    try {change('logo_url',await logoFileToDataUrl(file));}
    catch(e){setError(e instanceof Error?e.message:'Помилка завантаження логотипа');}
    finally {setLoading(false);if(ref.current)ref.current.value='';}
  };
  return <div className="ad-logo-upload">
    <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>void handle(e.target.files)}/>
    {src?<img className="ad-logo-upload__preview" src={src} alt="Логотип компанії"/>:<div className="ad-logo-upload__empty"><ImagePlus size={28}/><span>Логотип не завантажено</span></div>}
    <div className="ad-logo-upload__actions">
      <button type="button" className="ad-btn ad-btn--outline" onClick={()=>ref.current?.click()} disabled={loading}><Upload size={16}/>{loading?'Обробка…':src?'Замінити логотип':'Завантажити логотип'}</button>
      {src?<button type="button" className="ad-danger-outline" onClick={()=>{setError('');change('logo_url','');}}>Прибрати логотип</button>:null}
    </div>
    {error?<p className="ad-create-message is-error" role="alert">{error}</p>:null}
  </div>;
}
function SettingsFrame({navigate,title,slug,section,render}:{navigate:Navigate;title:string;slug:SettingsSlug;section:SettingsSection|null;render:(s:SettingsStore)=>ReactNode}) {
  const state=useSettingsStore(section);
  return <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings">
    <AdminPageHeader title={`Налаштування — ${title}`} action={<div className="ad-live-toolbar">
      <OutlineButton onClick={()=>void state.refresh()}><RefreshCcw size={15}/> Оновити</OutlineButton>
      {state.data?<OutlineButton onClick={()=>exportSettingsToJson(state.data!)}><Download size={15}/> Експорт JSON</OutlineButton>:null}
      {section?<PrimaryButton disabled={state.busy||state.loading||!state.data} onClick={()=>void state.save()}><Check size={16}/> {state.busy?'Збереження…':'Зберегти зміни'}</PrimaryButton>:null}
    </div>}/>
    <SettingsTabs active={slug} navigate={navigate}/>
    {state.error?<div className="ad-create-message is-error" role="alert">{state.error}</div>:null}
    {state.message?<div className="ad-create-message" role="status">{state.message}</div>:null}
    {state.loading?<div className="ad-stage2-empty-row">Завантаження налаштувань…</div>:null}
    {!state.loading&&state.data?render(state):null}
  </AdminShell>;
}
function GeneralSettingsScreen({navigate}:AdminProps) {
  return <SettingsFrame navigate={navigate} title="Загальні" slug="admin-settings-general" section="general" render={({data,form,change})=><>
    <div className="ad-settings-layout ad-settings-layout--two">
      <SettingsPanel title="Брендування">
        <SettingLogoUpload value={form.logo_url} change={change}/>
        <div className="ad-setting-fields-grid"><SettingInput label="Основний колір (HEX)" id="primary_color" form={form} change={change}/><SettingInput label="Додатковий колір (HEX)" id="secondary_color" form={form} change={change}/></div>
      </SettingsPanel>
      <SettingsPanel title="Відображення та робота"><div className="ad-settings-toggle-stack">{([
        ['Показувати архівних партнерів','show_archived_partners'],['Показувати неактивних клієнтів','show_inactive_clients'],['Автоматичне оновлення','auto_refresh'],['Дозволити реєстрацію партнерів','allow_partner_registration'],['Вимагати модерацію партнерів','require_partner_approval'],['Дозволити редагування даних партнером','allow_partner_edits'],['Показувати рейтинг','display_partner_rating'],['Показувати підказки','show_hints'],['Режим обслуговування','maintenance_mode']
      ] as const).map(([label,id])=><SettingCheck key={id} label={label} id={id} form={form} change={change}/>)}</div></SettingsPanel>
      <SettingsPanel title="Політика зберігання"><div className="ad-setting-fields-grid"><SettingInput label="Зберігати логи (місяців)" id="log_retention_months" type="number" form={form} change={change}/><SettingInput label="Зберігати архіви (місяців)" id="archive_retention_months" type="number" form={form} change={change}/></div></SettingsPanel>
      <SettingsPanel title="Регіони та кількість закладів" className="ad-settings-panel--full"><div className="ad-live-table"><div className="ad-live-table-head"><span>Регіон</span><span>Закладів партнерів</span><span>Стан</span></div>{data!.regions.map(r=><div key={r.id}><strong>{r.name}</strong><span>{r.places_count}</span><span>{r.active?'Активний':'Неактивний'}</span></div>)}</div>{data!.regions.length===0?<p className="ad-live-empty">Регіонів немає.</p>:null}</SettingsPanel>
    </div>
  </>}/>;
}
function CompanySettingsScreen({navigate}:AdminProps) {
  return <SettingsFrame navigate={navigate} title="Компанія" slug="admin-settings-company" section="company" render={({form,change})=><div className="ad-settings-layout ad-settings-layout--two">
    <SettingsPanel title="Реквізити для взаєморозрахунків"><div className="ad-setting-fields-grid">{([
      ['Юридична назва','legal_name'],['ЄДРПОУ / ІПН','tax_id'],['Юридична адреса','address']
    ] as const).map(([label,id])=><SettingInput key={id} label={label} id={id} form={form} change={change}/>)}</div></SettingsPanel>
    <SettingsPanel title="Банківські реквізити"><div className="ad-setting-fields-grid">{([
      ['IBAN','iban'],['Назва банку','bank'],['Платник ПДВ','vat_payer'],['Ставка ПДВ (%)','vat_rate']
    ] as const).map(([label,id])=><SettingInput key={id} label={label} id={id} form={form} change={change}/>)}</div></SettingsPanel>
  </div>}/>;
}
function PartnerCommissionSettingsScreen({navigate}:AdminProps) {
  return <SettingsFrame navigate={navigate} title="Партнери та комісії" slug="admin-settings-partners" section="partners" render={({data,form,change})=>{
    const map=asSettingsObject(form.category_commissions);
    return <>
      <div className="ad-settings-layout ad-settings-layout--two">
        <SettingsPanel title="Ставка комісії"><div className="ad-setting-fields-grid"><SettingInput label="Комісія за замовчуванням (%)" id="commission_rate" type="number" form={form} change={change}/><SettingInput label="Мінімальна сума замовлення (політика)" id="minimum_order" type="number" form={form} change={change}/><SettingInput label="Термін дії (днів, політика)" id="commission_duration_days" type="number" form={form} change={change}/></div></SettingsPanel>
        <SettingsPanel title="Додаткові параметри"><SettingCheck label="Автоматично призначати комісію" id="auto_assign_commission" form={form} change={change}/><SettingCheck label="Показувати партнеру його комісію" id="show_partner_commission" form={form} change={change}/><SettingCheck label="Показувати борг партнера" id="show_partner_debt" form={form} change={change}/></SettingsPanel>
        <SettingsPanel title="Категорії та комісії" className="ad-settings-panel--full"><div className="ad-live-categories"><div className="ad-live-table-head"><span>Категорія</span><span>Закладів</span><span>Ставка (%)</span></div>{data!.categories.map(c=><div key={c.slug}><strong>{c.name}</strong><span>{c.places_count}</span><input aria-label={`Комісія ${c.name}`} type="number" min="0" max="100" step="0.01" value={settingsText(map[c.slug])} onChange={e=>{const next={...map};if(e.target.value==='')delete next[c.slug];else next[c.slug]=e.target.value;change('category_commissions',next);}}/></div>)}</div>{data!.categories.length===0?<p className="ad-live-empty">Категорій у базі немає.</p>:null}</SettingsPanel>
        <SettingsPanel title="Фактичні статуси партнерів"><div className="ad-live-table"><div className="ad-live-table-head"><span>Статус</span><span>Кількість</span></div>{data!.partner_statuses.map(s=><div key={s.status}><span>{s.status}</span><strong>{s.count}</strong></div>)}</div>{data!.partner_statuses.length===0?<p className="ad-live-empty">Партнерських закладів ще немає.</p>:null}</SettingsPanel>
      </div>
    </>;
  }}/>;
}
function BonusSettingsScreen({navigate}:AdminProps) {
  const [edited,setEdited]=useState<Record<string,Record<string,string>>>({});
  const [saving,setSaving]=useState('');
  return <SettingsFrame navigate={navigate} title="Бонусна система" slug="admin-settings-bonuses" section={null} render={({data,refresh,setMessage,setError})=>{
    const field=(row:SettingsSnapshot['bonus_rules'][number],id:string)=>edited[row.region_id]?.[id]??settingsText(row[id as keyof typeof row]);
    const change=(region:string,key:string,value:string)=>setEdited(previous=>({...previous,[region]:{...previous[region],[key]:value}}));
    const save=async(row:SettingsSnapshot['bonus_rules'][number])=>{
      setSaving(row.region_id);setError('');setMessage('');
      const body={earn_percent:field(row,'earn_percent'),max_spend_percent:field(row,'max_spend_percent'),min_purchase:field(row,'min_purchase'),expiration_days:field(row,'expiration_days')};
      try {await adminStage2Fetch(`/admin/platform/settings/bonus-rules/${encodeURIComponent(row.region_id)}`,'',{method:'PATCH',body:JSON.stringify(body)});
        setEdited(previous=>{const next={...previous};delete next[row.region_id];return next;});await refresh();setMessage(`Правила регіону «${row.region_name}» збережено.`);
      }catch(e){setError(e instanceof Error?e.message:'Помилка збереження бонусів');}finally{setSaving('');}
    };
    return <>
      <div className="ad-live-bonus-grid">{data!.bonus_rules.map(row=><SettingsPanel key={row.region_id} title={row.region_name}><div className="ad-setting-fields-grid">{([
        ['Нарахування (%)','earn_percent'],['Максимальне списання (%)','max_spend_percent'],['Мінімальна покупка (грн)','min_purchase'],['Термін бонусів (днів)','expiration_days']
      ] as const).map(([label,id])=><label className="ad-live-field" key={id}><span>{label}</span><input type="number" min={id==='expiration_days'?'1':'0'} max={id==='expiration_days'?'3650':id==='min_purchase'?undefined:'100'} step={id==='expiration_days'?'1':'0.01'} value={field(row,id)} onChange={e=>change(row.region_id,id,e.target.value)}/></label>)}</div><PrimaryButton disabled={saving===row.region_id} onClick={()=>void save(row)}><Check size={15}/>{saving===row.region_id?'Збереження…':'Зберегти правила'}</PrimaryButton></SettingsPanel>)}</div>
      {data!.bonus_rules.length===0?<div className="ad-stage2-empty-row">Правил бонусів у базі поки немає.</div>:null}
    </>;
  }}/>;
}
function NotificationSettingsScreen({navigate}:AdminProps) {
  return <SettingsFrame navigate={navigate} title="Сповіщення" slug="admin-settings-notifications" section="notifications" render={({form,change})=>{
    return <>
      <div className="ad-settings-layout ad-settings-layout--two">
        <SettingsPanel title="Контакти для сповіщень"><div className="ad-setting-fields-grid">{([['Email адреса','email'],['Номер для SMS','phone'],['Telegram-одержувач','telegram'],['Push endpoint (за наявності)','push_endpoint']] as const).map(([label,id])=><SettingInput key={id} label={label} id={id} form={form} change={change}/>)}</div></SettingsPanel>
        <SettingsPanel title="Збережені уподобання каналів"><SettingCheck label="Email" id="email_enabled" form={form} change={change}/><SettingCheck label="SMS" id="sms_enabled" form={form} change={change}/><SettingCheck label="Telegram" id="telegram_enabled" form={form} change={change}/><SettingCheck label="Push" id="push_enabled" form={form} change={change}/></SettingsPanel>
        <SettingsPanel title="Графік сповіщень"><div className="ad-setting-fields-grid"><SettingInput label="Час щоденного зведення" id="daily_time" type="time" form={form} change={change}/><SettingInput label="День тижневого зведення" id="weekly_day" form={form} change={change}/><SettingInput label="Тиша з" id="quiet_start" type="time" form={form} change={change}/><SettingInput label="Тиша до" id="quiet_end" type="time" form={form} change={change}/></div><SettingCheck label="Щоденне зведення" id="daily_summary" form={form} change={change}/><SettingCheck label="Тижневе зведення" id="weekly_summary" form={form} change={change}/><SettingCheck label="Тихі години" id="quiet_hours" form={form} change={change}/></SettingsPanel>
      </div>
    </>;
  }}/>;
}
function SecuritySettingsScreen({navigate}:AdminProps) {
  return <SettingsFrame navigate={navigate} title="Безпека" slug="admin-settings-security" section={null} render={({data,refresh,setError,setMessage})=>{
    const revoke=async(userId:string)=>{
      if(!window.confirm('Завершити всі активні сесії цього адміністратора?'))return;
      try {await adminStage2Fetch(`/admin/platform/settings/sessions/${encodeURIComponent(userId)}`,'',{method:'DELETE'});await refresh();setMessage('Сесію завершено.');}
      catch(e){setError(e instanceof Error?e.message:'Не вдалося завершити сесію');}
    };
    return <>
      <div className="ad-settings-layout ad-settings-layout--two">
        <SettingsPanel title="Поточний захист"><div className="ad-live-key-value"><span>Метод авторизації</span><strong>{data!.security_runtime.auth_mode}</strong></div><div className="ad-live-key-value"><span>Ключ налаштований</span><strong>{data!.security_runtime.admin_key_configured?'Так':'Ні'}</strong></div></SettingsPanel>
        <SettingsPanel title="Адміністратори в базі"><div className="ad-live-table"><div className="ad-live-table-head"><span>Користувач</span><span>Роль</span></div>{data!.admin_users.map(u=><div key={u.id}><strong>{[u.first_name,u.last_name].filter(Boolean).join(' ')||u.telegram_username||u.id}</strong><span>{u.role}</span></div>)}</div>{data!.admin_users.length===0?<p className="ad-live-empty">Адміністраторів у списку немає.</p>:null}</SettingsPanel>
        <SettingsPanel title="Активні сесії адміністраторів"><div className="ad-live-sessions">{data!.admin_sessions.map((s,i)=><div key={`${s.user_id}-${i}`}><span>Користувач: {data!.admin_users.find(u=>u.id===s.user_id)?.telegram_username||s.user_id}<small>Створено: {dateUA(s.created_at)} · Діє до: {dateUA(s.expires_at)}</small></span><button type="button" className="ad-danger-outline" onClick={()=>void revoke(s.user_id)}>Завершити</button></div>)}</div>{data!.admin_sessions.length===0?<p className="ad-live-empty">Активних сесій користувачів із роллю admin немає.</p>:null}</SettingsPanel>
      </div>
    </>;
  }}/>;
}
function AuditSettingsScreen({navigate}:AdminProps) {
  const [rows,setRows]=useState<SettingsAudit[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const filters=useTableFilters();
  const load=async()=>{setLoading(true);setError('');try{setRows(await adminStage2Fetch<SettingsAudit[]>('/admin/platform/audit'));}catch(e){setError(e instanceof Error?e.message:'Не вдалося отримати журнал');}finally{setLoading(false);}};
  useEffect(()=>{void load();},[]);
  const fields:FilterDefinition[]=[
    {key:'actor',label:'Тип користувача',allLabel:'Усі користувачі',options:filterChoices(rows.map(r=>r.actor_type))},
    {key:'entity',label:'Розділ',allLabel:'Усі розділи',options:filterChoices(rows.map(r=>r.entity_type))},
    {key:'action',label:'Дія',allLabel:'Усі дії',options:filterChoices(rows.map(r=>r.action))},
    {key:'period',label:'Період',allLabel:'Весь період',options:timePeriods},
  ];
  const matching=rows.filter(r=>(!filters.search||normalizeFilterText([r.actor_type,r.actor_user_id,r.action,r.entity_type,r.entity_id].join(' ')).includes(normalizeFilterText(filters.search)))
    &&(!filters.values.actor||r.actor_type===filters.values.actor)
    &&(!filters.values.entity||r.entity_type===filters.values.entity)
    &&(!filters.values.action||r.action===filters.values.action)
    &&matchesPeriod(r.created_at,filters.values.period||''));
  const pageRows=matching.slice(filters.page*filters.pageSize,(filters.page+1)*filters.pageSize);
  return <AdminShell active="settings" navigate={navigate} contentClassName="ad-main--settings">
    <AdminPageHeader title="Налаштування — Журнал дій" action={<OutlineButton onClick={()=>void load()}><RefreshCcw size={15}/> Оновити</OutlineButton>}/>
    <SettingsTabs active="admin-settings-audit" navigate={navigate}/>
    
    <SettingsPanel title="Журнал дій" className="ad-settings-panel--full">
      <FilterStrip placeholder="Подія, користувач або ID об’єкта" search={filters.search} onSearch={filters.onSearch} fields={fields} values={filters.values} onChange={filters.onChange} onReset={filters.reset}/>
      {error?<div className="ad-create-message is-error">{error}</div>:null}
      {loading?<div className="ad-stage2-empty-row">Завантаження реального журналу…</div>:null}
      {!loading&&matching.length===0?<p className="ad-live-empty">Записів за запитом немає.</p>:null}
      {!loading&&matching.length>0?<><div className="ad-live-audit-table"><div className="ad-live-table-head"><span>Дата і час</span><span>Хто</span><span>Дія</span><span>Тип</span><span>ID об’єкта</span></div>{pageRows.map(r=><div key={r.id}><span>{dateUA(r.created_at)}</span><span>{r.actor_user_id||r.actor_type}</span><strong>{r.action}</strong><span>{r.entity_type}</span><span>{r.entity_id}</span></div>)}</div><Pagination page={filters.page} pageSize={filters.pageSize} total={matching.length} onPage={filters.setPage} onPageSize={filters.changeSize}/></>:null}
    </SettingsPanel>
  </AdminShell>;
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
  const moderationFilters=useTableFilters();
  const qrFilters=useTableFilters();
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
  const [templateTranslations,setTemplateTranslations]=useState<EditableTranslations>(emptyTranslations());
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
  const [legacyServiceTranslations,setLegacyServiceTranslations]=useState<EditableTranslations>(emptyTranslations());
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceNote, setServiceNote] = useState("");
  const [serviceTone, setServiceTone] = useState<Stage2EmergencyService["tone"]>("green");
  const [serviceIcon, setServiceIcon] = useState<Stage2EmergencyService["icon"]>("custom");
  const [serviceActive, setServiceActive] = useState(true);
  const [hotOfferRows, setHotOfferRows] = useState<Stage2HotOffer[]>([]);
  const [legacyOfferTranslations,setLegacyOfferTranslations]=useState<EditableTranslations>(emptyTranslations());
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
    setServiceId(""); setServiceTitle(""); setServiceNote(""); setServiceTone("green"); setServiceIcon("custom"); setServiceActive(true);setLegacyServiceTranslations(emptyTranslations());
  };

  const editEmergencyService = (service: Stage2EmergencyService) => {
    setServiceId(service.id);
    setLegacyServiceTranslations(readTranslations(service.translations));
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
      body: JSON.stringify({ id: serviceId || undefined, region_id: "region-tatariv", title: serviceTitle.trim(), note: serviceNote.trim(), tone: serviceTone, icon: serviceIcon, active: serviceActive, translations:legacyServiceTranslations }),
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
      body: JSON.stringify({ ...service, region_id: "region-tatariv", active: !service.active,translations:service.translations ?? {} }),
    });
    setMessage(!service.active ? "Сервіс увімкнено." : "Сервіс вимкнено.");
    await load();
  };

  const resetOfferForm = () => {
    setOfferId(""); setOfferPlaceId(""); setOfferTitle(""); setOfferDiscount(""); setOfferDescription(""); setOfferDetail("");
    setOfferValidity(""); setOfferBadge("Актуально"); setOfferBadgeTone("green"); setOfferValidFrom(""); setOfferValidUntil(""); setOfferActive(true);setLegacyOfferTranslations(emptyTranslations());
  };

  const editOffer = (offer: Stage2HotOffer) => {
    setOfferId(offer.id);
    setLegacyOfferTranslations(readTranslations(offer.translations));
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
        translations:legacyOfferTranslations,
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
  const moderationFields:FilterDefinition[]=[
    {key:'region',label:'Локація',allLabel:'Усі локації',options:filterChoices(pending.map(r=>r.region_name))},
    {key:'category',label:'Категорія',allLabel:'Усі категорії',options:filterChoices(pending.map(r=>r.category_slug)).map(o=>({...o,label:stage2Categories.find(c=>c.slug===o.value)?.name||o.value}))},
    {key:'status',label:'Статус',allLabel:'Усі статуси',options:statusOptions(pending.map(r=>r.status))},
    {key:'period',label:'Дата заявки',allLabel:'Весь період',options:timePeriods},
  ];
  const filteredPending=pending.filter(r=>(!moderationFilters.search||normalizeFilterText([r.name,r.address,r.subcategory,r.organization_name,r.id].join(' ')).includes(normalizeFilterText(moderationFilters.search)))
    &&(!moderationFilters.values.region||r.region_name===moderationFilters.values.region)
    &&(!moderationFilters.values.category||r.category_slug===moderationFilters.values.category)
    &&(!moderationFilters.values.status||r.status===moderationFilters.values.status)
    &&matchesPeriod(r.created_at,moderationFilters.values.period||''));
  const qrFields:FilterDefinition[]=[
    {key:'region',label:'Локація',allLabel:'Усі локації',options:filterChoices(qrRows.map(r=>r.region_name))},
    {key:'type',label:'Призначення',allLabel:'Усі QR',options:[{value:'partner',label:'Для партнера'},{value:'client',label:'Для туриста'}]},
    {key:'status',label:'Статус',allLabel:'Усі статуси',options:[{value:'active',label:'Активний'},{value:'inactive',label:'Вимкнений'}]},
  ];
  const filteredQr=qrRows.filter(r=>(!qrFilters.search||normalizeFilterText([r.place_name,r.region_name,r.start_param,r.id].join(' ')).includes(normalizeFilterText(qrFilters.search)))
    &&(!qrFilters.values.region||r.region_name===qrFilters.values.region)
    &&(!qrFilters.values.type||(qrFilters.values.type==='partner'?qrAudience(r).tone==='partner':qrAudience(r).tone==='client'))
    &&(!qrFilters.values.status||(qrFilters.values.status==='active')===r.active));

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
        <FilterStrip placeholder="Назва закладу, адреса, ID" search={moderationFilters.search} onSearch={moderationFilters.onSearch} fields={moderationFields} values={moderationFilters.values} onChange={moderationFilters.onChange} onReset={moderationFilters.reset}/>
        <AdminTable columns={[{label:"Заклад",className:"1.4fr"},{label:"Розділ у гіді",className:"1fr"},{label:"Адреса",className:"1.3fr"},{label:"Статус",className:".7fr"},{label:"Дії",className:"1fr"}]}>
          {filteredPending.slice(moderationFilters.page*moderationFilters.pageSize,(moderationFilters.page+1)*moderationFilters.pageSize).map((row) => <TableRow key={row.id} columns={["1.4fr","1fr","1.3fr",".7fr","1fr"]}>
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
          {!filteredPending.length ? <div className="ad-stage2-empty-row">Закладів за вибраними фільтрами немає</div> : null}
        </AdminTable><Pagination page={moderationFilters.page} pageSize={moderationFilters.pageSize} total={filteredPending.length} onPage={moderationFilters.setPage} onPageSize={moderationFilters.changeSize}/>
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
                  setTemplateTranslations(emptyTranslations());
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
                  setTemplateTranslations(emptyTranslations());
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
                  setTemplateTranslations(readTranslations(current.translations));
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

            <TranslationInputs fields={[{key:"label",label:"Тип закладу"},{key:"default_title",label:"Назва за замовчуванням"},{key:"default_description",label:"Опис за замовчуванням",multiline:true}]} values={templateTranslations} onChange={setTemplateTranslations}/>

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

            <PrimaryButton disabled={!templateType.trim()} onClick={() => void adminStage2Fetch("/admin/stage2/place-type-templates", adminKey,{method:"POST",body:JSON.stringify({category_slug:templateCategory,place_type:templateType.trim(),label:templateType.trim(),default_title:templateTitle,default_description:templateDescription,translations:templateTranslations,default_amenities:commaList(templateAmenities),default_services:commaList(templateServices),fields:Object.fromEntries(templateFieldEntries(templateFields))})}).then(()=>{setMessage("Шаблон типу закладу збережено");setCreatingTemplateType(false);return load();})}><Plus size={16}/> Зберегти шаблон</PrimaryButton>
          </div>
        </div>
      </section>

      <section className="ad-stage2-section">
        <AdminPageHeader title="QR точки" subtitle="Посилання можна перетворити на друкований QR будь-яким QR-генератором; start_param зберігається у БД" />
        <FilterStrip placeholder="Заклад, QR-параметр або ID" search={qrFilters.search} onSearch={qrFilters.onSearch} fields={qrFields} values={qrFilters.values} onChange={qrFilters.onChange} onReset={qrFilters.reset}/>
        <AdminTable columns={[{label:"Точка",className:"1.1fr"},{label:"Тип",className:".75fr"},{label:"start_param",className:"1.2fr"},{label:"Статус",className:".55fr"},{label:"Deep link",className:"2fr"}]}>
          {filteredQr.slice(qrFilters.page*qrFilters.pageSize,(qrFilters.page+1)*qrFilters.pageSize).map((row)=>{ const audience = qrAudience(row); return <TableRow key={row.id} columns={["1.1fr",".75fr","1.2fr",".55fr","2fr"]}><div className="ad-stage2-qr-place"><strong>{row.place_name || "Публічна точка"}</strong><small>{row.region_name}</small></div><span className={`ad-stage2-qr-audience is-${audience.tone}`}>{audience.label}</span><code>{row.start_param}</code><Status tone={row.active?"green":"gray"}>{row.active?"Активний":"Вимкнено"}</Status><div className="ad-stage2-link"><input readOnly value={deepLink(row.start_param)}/><button onClick={() => void navigator.clipboard.writeText(deepLink(row.start_param))}>Копіювати</button><button onClick={() => setQrPreviewParam(row.start_param)}>QR</button><button onClick={() => void toggleQr(row.id,!row.active)}>{row.active?"Вимк.":"Увімк."}</button><button className="ad-stage2-delete-button" onClick={() => void deleteQr(row.id,row.start_param)}><Trash2 size={14}/> Видалити</button></div></TableRow>;})}
          {!filteredQr.length?<div className="ad-stage2-empty-row">QR-точок за вибраними фільтрами немає</div>:null}
        </AdminTable><Pagination page={qrFilters.page} pageSize={qrFilters.pageSize} total={filteredQr.length} onPage={qrFilters.setPage} onPageSize={qrFilters.changeSize}/>
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
  region_id: string;
  type: string;
  title: string;
  note: string;
  phone?: string | null;
  tone: string;
  translations?: EditableTranslations;
};

const DEFAULT_EMERGENCY_PAGE_CONTENT: Record<string, string> = {
  badge: "SOS",
  title: "Халепа?",
  subtitle: "Швидка допомога та корисні контакти",
  hero_kicker: "Не хвилюйтеся",
  hero_title: "Знайдемо допомогу",
  hero_text: "Екстрені та перевірені контакти для вашої безпеки.",
  badge_en:"SOS",badge_pl:"SOS",
  title_en:"Need help?",title_pl:"Potrzebujesz pomocy?",
  subtitle_en:"Emergency help and useful contacts",subtitle_pl:"Pomoc w nagłych wypadkach i przydatne kontakty",
  hero_kicker_en:"Help is nearby",hero_kicker_pl:"Pomoc jest blisko",
  hero_title_en:"We'll find help",hero_title_pl:"Znajdziemy pomoc",
  hero_text_en:"Emergency and verified contacts for your safety.",hero_text_pl:"Sprawdzone kontakty alarmowe dla Twojego bezpieczeństwa.",
};

function EmergencyPageEditorScreen({ navigate }: AdminProps) {
  const adminKey = "";
  const [regions, setRegions] = useState<AdminPageRegion[]>([]);
  const [regionId, setRegionId] = useState("region-tatariv");
  // "all" only changes the admin list scope; individual records retain their own city.
  const [contactTargetRegionId, setContactTargetRegionId] = useState("region-tatariv");
  const [serviceTargetRegionId, setServiceTargetRegionId] = useState("region-tatariv");
  const [contacts, setContacts] = useState<EmergencyAdminContact[]>([]);
  const [services, setServices] = useState<Stage2EmergencyService[]>([]);
  const contactFilters=useTableFilters();
  const serviceFilters=useTableFilters();
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState<Record<string, string>>(DEFAULT_EMERGENCY_PAGE_CONTENT);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [applyPageToAllRegions, setApplyPageToAllRegions] = useState(false);

  const [contactId, setContactId] = useState("");
  const contactTitleInput = useRef<HTMLInputElement>(null);
  const [contactTitle, setContactTitle] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactType, setContactType] = useState("custom");
  const [contactTone, setContactTone] = useState("green");
  const [contactTranslations,setContactTranslations]=useState<EditableTranslations>(emptyTranslations);

  const [serviceId, setServiceId] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const serviceTitleInput = useRef<HTMLInputElement>(null);
  const [serviceNote, setServiceNote] = useState("");
  const [serviceTone, setServiceTone] = useState<Stage2EmergencyService["tone"]>("green");
  const [serviceTranslations,setServiceTranslations]=useState<EditableTranslations>(emptyTranslations);
  const [serviceIcon, setServiceIcon] = useState<Stage2EmergencyService["icon"]>("custom");
  const [serviceActive, setServiceActive] = useState(true);

  const load = async () => {
    try {
      const [regionRows, contactRows, servicePayload, contentPayload] = await Promise.all([
        adminStage2Fetch<AdminPageRegion[]>("/admin/stage2/regions", adminKey),
        adminStage2Fetch<EmergencyAdminContact[]>(`/admin/stage2/emergency?region_id=${encodeURIComponent(regionId)}`, adminKey),
        adminStage2Fetch<Stage2EmergencyServicesResponse>(`/admin/stage2/emergency-services?region_id=${encodeURIComponent(regionId)}`, adminKey),
        regionId === "all"
          ? Promise.resolve({ content: {} } as Stage2PageContentResponse)
          : adminStage2Fetch<Stage2PageContentResponse>(`/page-content/emergency?region_id=${encodeURIComponent(regionId)}`, adminKey),
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

  useEffect(() => { setContacts([]); setServices([]); void load(); }, [regionId]);

  const setPageField = (key: string, value: string) => setPageContent((current) => ({ ...current, [key]: value }));

  const savePageContent = async () => {
    if (regionId === "all") { setMessage("Для редагування оформлення сторінки оберіть конкретне місто."); return; }
    setSaving(true);
    try {
      const saved = await adminStage2Fetch<Stage2PageContentResponse>("/admin/stage2/page-content/emergency", adminKey, {
        method: "POST",
        body: JSON.stringify({ region_id: regionId, content: pageContent, apply_to_all_regions: applyPageToAllRegions }),
      });
      const content = Object.fromEntries(Object.entries(saved.content || {}).map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")]));
      setPageContent({ ...DEFAULT_EMERGENCY_PAGE_CONTENT, ...content });
      setMessage(applyPageToAllRegions ? "Оформлення «Халепа?» збережено для всіх активних регіонів." : `Оформлення «Халепа?» збережено для регіону ${regions.find((item) => item.id === regionId)?.name || regionId}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка збереження: ${error.message}` : "Не вдалося зберегти сторінку");
    } finally {
      setSaving(false);
    }
  };

  const resetContactForm = () => {
    setContactTargetRegionId(regionId === "all" ? "" : regionId);
    setContactId(""); setContactTitle(""); setContactNote(""); setContactPhone(""); setContactType("custom"); setContactTone("green"); setContactTranslations(emptyTranslations());
  };

  const editContact = (contact: EmergencyAdminContact) => {
    setContactTargetRegionId(contact.region_id);
    setContactId(contact.id);
    setContactTitle(contact.title);
    setContactNote(contact.note || "");
    setContactTranslations(readTranslations(contact.translations));
    setContactPhone(contact.phone || "");
    setContactType(contact.type || "custom");
    setContactTone(contact.tone || "green");
    // The form sits above the list: focus it when clicking Edit so changes are visible.
    window.requestAnimationFrame(() => contactTitleInput.current?.focus());
    setMessage(`Редагування контакту «${contact.title}». Після змін натисніть «Зберегти зміни контакту».`);
  };

  const saveContact = async () => {
    if (!contactTitle.trim()) { setMessage("Вкажіть назву контакту."); return; }
    const targetRegion = contactId ? contacts.find(item => item.id === contactId)?.region_id : (regionId === "all" ? contactTargetRegionId : regionId);
    if (!targetRegion) { setMessage("Оберіть місто для контакту."); return; }
    try {
      await adminStage2Fetch("/admin/stage2/emergency", adminKey, {
        method: "POST",
        body: JSON.stringify({
          id: contactId || undefined,
          region_id: targetRegion,
          title: contactTitle.trim(),
          note: contactNote.trim(),
          phone: contactPhone.trim() || null,
          type: contactType,
          tone: contactTone,
          translations: contactTranslations,
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
    setServiceTargetRegionId(regionId === "all" ? "" : regionId);
    setServiceId(""); setServiceTitle(""); setServiceNote(""); setServiceTone("green"); setServiceIcon("custom"); setServiceActive(true); setServiceTranslations(emptyTranslations());
  };

  const editService = (service: Stage2EmergencyService) => {
    setServiceTargetRegionId(service.region_id);
    setServiceId(service.id);
    window.requestAnimationFrame(() => serviceTitleInput.current?.focus());
    setServiceTitle(service.title);
    setServiceNote(service.note);
    setServiceTone(service.tone);
    setServiceIcon(service.icon);
    setServiceTranslations(readTranslations(service.translations));
    setServiceActive(service.active);
  };

  const saveService = async () => {
    if (!serviceTitle.trim()) { setMessage("Вкажіть назву корисного сервісу."); return; }
    const targetRegion = serviceId ? services.find(item => item.id === serviceId)?.region_id : (regionId === "all" ? serviceTargetRegionId : regionId);
    if (!targetRegion) { setMessage("Оберіть місто для сервісу."); return; }
    try {
      await adminStage2Fetch("/admin/stage2/emergency-services", adminKey, {
        method: "POST",
        body: JSON.stringify({
          id: serviceId || undefined,
          region_id: targetRegion,
          title: serviceTitle.trim(),
          note: serviceNote.trim(),
          tone: serviceTone,
          icon: serviceIcon,
          active: serviceActive,
          translations: serviceTranslations,
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
        body: JSON.stringify({ ...service, region_id: service.region_id, active: !service.active, translations: service.translations || {} }),
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

  const cityLabel = (id: string) => regions.find(r => r.id === id)?.name || id;
  const contactFields:FilterDefinition[]=[
    {key:'type',label:'Тип контакту',allLabel:'Усі типи',options:filterChoices(contacts.map(c=>c.type))},
  ];
  const filteredContacts=contacts.filter(c=>(!contactFilters.search||normalizeFilterText([c.title,c.phone,c.note,c.id,cityLabel(c.region_id)].join(' ')).includes(normalizeFilterText(contactFilters.search)))
    &&(!contactFilters.values.type||c.type===contactFilters.values.type));
  const serviceFields:FilterDefinition[]=[
    {key:'status',label:'Статус',allLabel:'Усі статуси',options:[{value:'active',label:'Увімкнені'},{value:'inactive',label:'Вимкнені'}]},
    {key:'icon',label:'Тип сервісу',allLabel:'Усі типи',options:filterChoices(services.map(x=>x.icon))},
  ];
  const filteredServices=services.filter(x=>(!serviceFilters.search||normalizeFilterText([x.title,x.note,x.id,cityLabel(x.region_id)].join(' ')).includes(normalizeFilterText(serviceFilters.search)))
    &&(!serviceFilters.values.status||(serviceFilters.values.status==='active')===x.active)
    &&(!serviceFilters.values.icon||x.icon===serviceFilters.values.icon));
  return (
    <AdminShell active="pages" navigate={navigate} contentClassName="ad-main--page-editors ad-main--emergency-editor">
      <AdminPageHeader
        title="Редактор «Халепа?»"
        subtitle="Шапка, інформаційний блок, екстрені контакти та корисні сервіси."
        back={() => navigate("admin", "admin-pages")}
        action={<OutlineButton onClick={() => void load()}><RefreshCcw size={16}/> Оновити</OutlineButton>}
      />
      <section className="ad-page-editor-region-select">
        <span>Місто для перегляду контактів і сервісів</span>
        <select value={regionId} onChange={(e) => { const value=e.target.value; resetContactForm(); resetServiceForm(); setRegionId(value); setContactTargetRegionId(value === "all" ? "" : value); setServiceTargetRegionId(value === "all" ? "" : value); contactFilters.reset(); serviceFilters.reset(); setMessage(""); }}>
          <option value="all">Усі міста</option>
          {regions.length ? regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>) : <option value="region-tatariv">Татарів</option>}
        </select>
      </section>
      {message ? <p className="ad-page-editor-message">{message}</p> : null}

      {regionId === "all" ? <p className="ad-page-editor-message">Показані записи з усіх міст. Для кожного контакту та сервісу зберігається місто, до якого він належить. Щоб змінити оформлення сторінки, виберіть конкретне місто.</p> : null}
      {regionId !== "all" ? <section className="ad-page-editor-panel">
        <header><div><strong>Шапка та основний блок</strong><small>Змінюється текст без зміни поточного дизайну туристичної сторінки.</small></div></header>
        <div className="ad-page-editor-form-grid">
          <label><span>Позначка</span><input value={pageContent.badge || ""} onChange={(e)=>setPageField("badge",e.target.value)} /></label>
          <label><span>Заголовок</span><input value={pageContent.title || ""} onChange={(e)=>setPageField("title",e.target.value)} /></label>
          <label className="is-wide"><span>Підзаголовок</span><input value={pageContent.subtitle || ""} onChange={(e)=>setPageField("subtitle",e.target.value)} /></label>
          <label><span>Малий текст hero</span><input value={pageContent.hero_kicker || ""} onChange={(e)=>setPageField("hero_kicker",e.target.value)} /></label>
          <label><span>Заголовок hero</span><input value={pageContent.hero_title || ""} onChange={(e)=>setPageField("hero_title",e.target.value)} /></label>
          <label className="is-wide"><span>Опис hero</span><textarea rows={3} value={pageContent.hero_text || ""} onChange={(e)=>setPageField("hero_text",e.target.value)} /></label>
        </div>
        <label className="ad-page-editor-global-option"><input type="checkbox" checked={applyPageToAllRegions} onChange={(e)=>setApplyPageToAllRegions(e.target.checked)}/><span><strong>Застосувати оформлення до всіх регіонів</strong><small>Тексти цієї сторінки оновляться в усіх активних регіонах. Номери екстрених служб і корисні сервіси залишаються окремими для кожного регіону.</small></span></label>
        <TranslatedPageInputs content={pageContent} onField={setPageField} fields={[{key:"badge",label:"Позначка"},{key:"title",label:"Заголовок"},{key:"subtitle",label:"Підзаголовок",multiline:true},{key:"hero_kicker",label:"Малий текст"},{key:"hero_title",label:"Заголовок hero"},{key:"hero_text",label:"Опис hero",multiline:true}]}/>
        <PrimaryButton onClick={() => void savePageContent()} disabled={saving}><Check size={15}/> {saving ? "Збереження..." : applyPageToAllRegions ? "Зберегти для всіх регіонів" : "Зберегти оформлення сторінки"}</PrimaryButton>
      </section> : null}

      <section className="ad-page-editor-panel">
        <header><div><strong>Екстрені контакти</strong><small>Для зміни контакту натисніть «Редагувати» поруч із ним, внесіть правки та збережіть.</small></div></header>
        <div className="ad-page-editor-form-grid">
          {regionId === "all" ? <label><span>Місто для контакту</span><select value={contactTargetRegionId} disabled={Boolean(contactId)} onChange={e=>setContactTargetRegionId(e.target.value)}><option value="">Оберіть місто</option>{regions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label> : null}
          <label><span>Назва</span><input ref={contactTitleInput} value={contactTitle} onChange={(e)=>setContactTitle(e.target.value)} placeholder="Назва служби" /></label>
          <label><span>Телефон</span><input value={contactPhone} onChange={(e)=>setContactPhone(e.target.value)} placeholder="+380..." /></label>
          <label className="is-wide"><span>Опис</span><input value={contactNote} onChange={(e)=>setContactNote(e.target.value)} placeholder="Короткий опис" /></label>
          <TranslationInputs fields={[{key:"title",label:"Назва"},{key:"note",label:"Опис"}]} values={contactTranslations} onChange={setContactTranslations}/>
          <label><span>Тип</span><select value={contactType} onChange={(e)=>setContactType(e.target.value)}><option value="custom">Інше</option><option value="emergency">Єдиний номер</option><option value="ambulance">Швидка</option><option value="police">Поліція</option><option value="rescue">Рятувальники</option></select></label>
          <label><span>Колір</span><select value={contactTone} onChange={(e)=>setContactTone(e.target.value)}><option value="green">Зелений</option><option value="red">Червоний</option><option value="blue">Синій</option><option value="orange">Помаранчевий</option></select></label>
        </div>
        {contactId ? <p className="ad-page-editor-editing-note"><Edit3 size={14}/> Ви редагуєте існуючий контакт. Зміни збережуться без створення дубля.</p> : null}
        <div className="ad-stage2-actions-row"><PrimaryButton onClick={() => void saveContact()}>{contactId ? <Check size={14}/> : <Plus size={14}/>} {contactId ? "Зберегти зміни контакту" : "Додати контакт"}</PrimaryButton>{contactId ? <OutlineButton onClick={resetContactForm}>Скасувати</OutlineButton> : null}</div>
        <FilterStrip placeholder="Назва, телефон або опис" search={contactFilters.search} onSearch={contactFilters.onSearch} fields={contactFields} values={contactFilters.values} onChange={contactFilters.onChange} onReset={contactFilters.reset}/>
        <div className="ad-page-editor-list">
          {filteredContacts.slice(contactFilters.page*contactFilters.pageSize,(contactFilters.page+1)*contactFilters.pageSize).map((contact)=><article key={contact.id}><span><strong>{contact.title}</strong><small>{regionId === "all" ? `${cityLabel(contact.region_id)} · ` : ""}{contact.note || "Без опису"} · {contact.phone || "без номера"}</small></span><div><button type="button" onClick={()=>editContact(contact)}><Edit3 size={13}/> Редагувати</button><button type="button" className="is-delete" onClick={()=>void deleteContact(contact)}><Trash2 size={13}/> Видалити</button></div></article>)}
          {!filteredContacts.length?<p className="ad-stage2-empty-row">Контактів за вибраними фільтрами немає</p>:null}
        </div><Pagination page={contactFilters.page} pageSize={contactFilters.pageSize} total={filteredContacts.length} onPage={contactFilters.setPage} onPageSize={contactFilters.changeSize}/>
      </section>

      <section className="ad-page-editor-panel">
        <header><div><strong>Корисні сервіси</strong><small>Сервіси можна редагувати, вимикати, додавати та видаляти.</small></div><small>Перевірено: {verifiedAt ? new Date(verifiedAt).toLocaleString("uk-UA") : "—"}</small></header>
        <div className="ad-page-editor-form-grid">
          {regionId === "all" ? <label><span>Місто для сервісу</span><select value={serviceTargetRegionId} disabled={Boolean(serviceId)} onChange={e=>setServiceTargetRegionId(e.target.value)}><option value="">Оберіть місто</option>{regions.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label> : null}
          <label><span>Назва</span><input ref={serviceTitleInput} value={serviceTitle} onChange={(e)=>setServiceTitle(e.target.value)} /></label>
          <label><span>Короткий опис</span><input value={serviceNote} onChange={(e)=>setServiceNote(e.target.value)} /></label>
          <TranslationInputs fields={[{key:"title",label:"Назва"},{key:"note",label:"Опис"}]} values={serviceTranslations} onChange={setServiceTranslations}/>
          <label><span>Іконка</span><select value={serviceIcon} onChange={(e)=>setServiceIcon(e.target.value as Stage2EmergencyService["icon"])}><option value="doctor">Лікар</option><option value="pharmacy">Аптека</option><option value="repair">СТО</option><option value="tow">Евакуатор</option><option value="vet">Ветеринар</option><option value="custom">Інше</option></select></label>
          <label><span>Колір</span><select value={serviceTone} onChange={(e)=>setServiceTone(e.target.value as Stage2EmergencyService["tone"])}><option value="green">Зелений</option><option value="purple">Фіолетовий</option><option value="orange">Помаранчевий</option><option value="blue">Синій</option></select></label>
        </div>
        <label className="ad-stage2-check"><input type="checkbox" checked={serviceActive} onChange={(e)=>setServiceActive(e.target.checked)} /><span>Сервіс увімкнений</span></label>
        <div className="ad-stage2-actions-row"><PrimaryButton onClick={() => void saveService()}>{serviceId ? <Check size={14}/> : <Plus size={14}/>} {serviceId ? "Зберегти сервіс" : "Додати сервіс"}</PrimaryButton>{serviceId ? <OutlineButton onClick={resetServiceForm}>Скасувати</OutlineButton> : null}</div>
        <FilterStrip placeholder="Назва або опис сервісу" search={serviceFilters.search} onSearch={serviceFilters.onSearch} fields={serviceFields} values={serviceFilters.values} onChange={serviceFilters.onChange} onReset={serviceFilters.reset}/>
        <div className="ad-page-editor-list">
          {filteredServices.slice(serviceFilters.page*serviceFilters.pageSize,(serviceFilters.page+1)*serviceFilters.pageSize).map((service)=><article key={service.id} className={service.active ? "" : "is-disabled"}><span><strong>{service.title}</strong><small>{regionId === "all" ? `${cityLabel(service.region_id)} · ` : ""}{service.note || "Без опису"} · {service.active ? "увімкнено" : "вимкнено"}</small></span><div><button type="button" onClick={()=>editService(service)}><Edit3 size={13}/> Редагувати</button><button type="button" onClick={()=>void toggleService(service)}>{service.active ? "Вимкнути" : "Увімкнути"}</button><button type="button" className="is-delete" onClick={()=>void deleteService(service)}><Trash2 size={13}/> Видалити</button></div></article>)}
          {!filteredServices.length?<p className="ad-stage2-empty-row">Сервісів за вибраними фільтрами немає</p>:null}
        </div><Pagination page={serviceFilters.page} pageSize={serviceFilters.pageSize} total={filteredServices.length} onPage={serviceFilters.setPage} onPageSize={serviceFilters.changeSize}/>
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
  discount_label_en:"up to",discount_label_pl:"do",
  title_en:"Great deals\nfor your holiday",title_pl:"Korzystne oferty\nna Twój wypoczynek",
  subtitle_en:"Special discounts\nfrom verified partners 💚",subtitle_pl:"Wyjątkowe zniżki\nod sprawdzonych partnerów 💚",
  search_placeholder_en:"Search places, routes and activities...",search_placeholder_pl:"Szukaj miejsc, tras i atrakcji...",
  section_title_en:"Offers nearby",section_title_pl:"Oferty w pobliżu",
};

function HotOffersPageEditorScreen({ navigate }: AdminProps) {
  const adminKey = "";
  const [regions, setRegions] = useState<AdminPageRegion[]>([]);
  const [regionId, setRegionId] = useState("region-tatariv");
  const [pageContent, setPageContent] = useState<Record<string,string>>(DEFAULT_HOT_OFFERS_PAGE_CONTENT);
  const [offers, setOffers] = useState<Stage2HotOffer[]>([]);
  const offerFilters=useTableFilters();
  const [places, setPlaces] = useState<Array<{ id: string; name: string; category_slug: string; region_id: string; region_name: string }>>([]);
  const [categories, setCategories] = useState<Stage2Category[]>([]);
  const [message, setMessage] = useState("");
  const [savingPage, setSavingPage] = useState(false);
  const [applyPageToAllRegions, setApplyPageToAllRegions] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerId, setOfferId] = useState("");
  const [offerPlaceId, setOfferPlaceId] = useState("");
  const [offerCategorySlug, setOfferCategorySlug] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerDetail, setOfferDetail] = useState("");
  const [offerImageUrl, setOfferImageUrl] = useState("");
  const [offerPhotoUploading, setOfferPhotoUploading] = useState(false);
  const offerPhotoInput = useRef<HTMLInputElement>(null);
  const [offerValidity, setOfferValidity] = useState("");
  const [offerBadge, setOfferBadge] = useState("Актуально");
  const [offerTranslations,setOfferTranslations]=useState<EditableTranslations>(emptyTranslations);
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
      const saved = await adminStage2Fetch<Stage2PageContentResponse>("/admin/stage2/page-content/hot_offers",adminKey,{method:"POST",body:JSON.stringify({region_id:regionId,content:pageContent,apply_to_all_regions:applyPageToAllRegions})});
      const content = Object.fromEntries(Object.entries(saved.content || {}).map(([key,value])=>[key,typeof value==="string"?value:String(value??"")]));
      setPageContent({ ...DEFAULT_HOT_OFFERS_PAGE_CONTENT, ...content });
      setMessage(applyPageToAllRegions ? "Оформлення «Гарячі пропозиції» збережено для всіх активних регіонів." : `Оформлення гарячих пропозицій збережено для регіону ${regions.find((item) => item.id === regionId)?.name || regionId}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка збереження сторінки: ${error.message}` : "Не вдалося зберегти сторінку");
    } finally {
      setSavingPage(false);
    }
  };

  const resetOffer = () => {
    setOfferId("");setOfferPlaceId("");setOfferCategorySlug("");setOfferTitle("");setOfferDiscount("");setOfferDescription("");setOfferDetail("");setOfferValidity("");setOfferBadge("Актуально");setOfferBadgeTone("green");setOfferValidFrom("");setOfferValidUntil("");setOfferActive(true);setOfferImageUrl("");setOfferTranslations(emptyTranslations());
  };
  const editOffer = (offer:Stage2HotOffer) => {
    setOfferTranslations(readTranslations(offer.translations));setOfferId(offer.id);setOfferPlaceId(offer.place_id||"");setOfferCategorySlug(offer.category_slug||"");setOfferTitle(offer.title);setOfferDiscount(offer.discount||"");setOfferDescription(offer.description||"");setOfferDetail(offer.detail||"");setOfferValidity(offer.validity||"");setOfferBadge(offer.badge||"Актуально");setOfferBadgeTone(offer.badge_tone==="gold"||offer.badge_tone==="red"?offer.badge_tone:"green");setOfferValidFrom(offer.valid_from?offer.valid_from.slice(0,16):"");setOfferValidUntil(offer.valid_until?offer.valid_until.slice(0,16):"");setOfferActive(offer.active!==false);setOfferImageUrl(offer.image_url||"");
  };
  const saveOffer = async () => {
    if (offerPhotoUploading) { setMessage("Дочекайтеся завершення обробки фото."); return; }
    if(!offerTitle.trim()){setMessage("Вкажіть назву пропозиції.");return;}
    setSavingOffer(true);
    try {
      const place=places.find((item)=>item.id===offerPlaceId);
      const categorySlug = place?.category_slug || offerCategorySlug;
      const category=categories.find((item)=>item.slug===categorySlug);
      const saved = await adminStage2Fetch<Stage2HotOffer>("/admin/stage2/offers",adminKey,{method:"POST",body:JSON.stringify({id:offerId||undefined,region_id:regionId,place_id:offerPlaceId||null,category_slug:categorySlug||"",category_label:category?.name||categorySlug||"Пропозиція",title:offerTitle.trim(),discount:offerDiscount.trim(),description:offerDescription.trim(),detail:offerDetail.trim(),validity:offerValidity.trim(),image_url:offerImageUrl||null,badge:offerBadge.trim(),badge_tone:offerBadgeTone,translations:offerTranslations,valid_from:offerValidFrom||null,valid_until:offerValidUntil||null,active:offerActive})});
      setMessage(offerId?`Пропозицію «${saved.title || offerTitle}» оновлено.`:`Пропозицію «${saved.title || offerTitle}» створено.`);
      resetOffer();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? `Помилка пропозиції: ${error.message}` : "Не вдалося зберегти пропозицію");
    } finally {
      setSavingOffer(false);
    }
  };
  const moderatePartnerOffer = async (offer:Stage2HotOffer,status:"approved"|"rejected") => {
    const comment = status === "rejected" ? window.prompt("Причина відхилення пропозиції:", "") : "";
    if (status === "rejected" && comment === null) return;
    try {
      await adminStage2Fetch(`/admin/platform/offers/${encodeURIComponent(offer.id)}/moderate`,adminKey,{method:"PATCH",body:JSON.stringify({status,comment:comment||""})});
      setMessage(status === "approved" ? "Пропозицію схвалено та опубліковано." : "Пропозицію відхилено.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Помилка модерації пропозиції");
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

  const offerFields:FilterDefinition[]=[
    {key:'status',label:'Публікація',allLabel:'Усі пропозиції',options:[{value:'active',label:'Активні'},{value:'inactive',label:'Вимкнені'}]},
    {key:'category',label:'Категорія',allLabel:'Усі категорії',options:filterChoices(offers.map(o=>o.category_slug)).map(o=>({...o,label:categories.find(c=>c.slug===o.value)?.name||o.value}))},
    {key:'moderation',label:'Модерація',allLabel:'Усі статуси',options:statusOptions(offers.map(o=>o.moderation_status))},
    {key:'validity',label:'Термін дії',allLabel:'Усі терміни',options:[{value:'active',label:'Ще діють'},{value:'expired',label:'Завершені'},{value:'unset',label:'Без дати'}]},
  ];
  const filteredOffers=offers.filter(o=>(!offerFilters.search||normalizeFilterText([o.title,o.place_name,o.discount,o.description,o.id].join(' ')).includes(normalizeFilterText(offerFilters.search)))
    &&(!offerFilters.values.status||(offerFilters.values.status==='active')===(o.active!==false))
    &&(!offerFilters.values.category||o.category_slug===offerFilters.values.category)
    &&(!offerFilters.values.moderation||o.moderation_status===offerFilters.values.moderation)
    &&(!offerFilters.values.validity||(offerFilters.values.validity==='unset'?!o.valid_until:offerFilters.values.validity==='active'?Boolean(o.valid_until&&Date.parse(o.valid_until)>=Date.now()):Boolean(o.valid_until&&Date.parse(o.valid_until)<Date.now()))));
  return (
    <AdminShell active="pages" navigate={navigate} contentClassName="ad-main--page-editors ad-main--emergency-editor">
      <AdminPageHeader title="Редактор «Гарячі пропозиції»" subtitle="Шапка, банер та самі пропозиції." back={()=>navigate("admin","admin-pages")} action={<OutlineButton onClick={()=>void load()}><RefreshCcw size={16}/> Оновити</OutlineButton>} />
      <section className="ad-page-editor-region-select">
        <span>Редагується регіон</span>
        <select value={regionId} onChange={(e) => { setRegionId(e.target.value); resetOffer(); offerFilters.reset(); }}>
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
        <TranslatedPageInputs content={pageContent} onField={setPageField} fields={[{key:"discount_label",label:"Підпис знижки"},{key:"title",label:"Заголовок",multiline:true},{key:"subtitle",label:"Підзаголовок",multiline:true},{key:"search_placeholder",label:"Пошук"},{key:"section_title",label:"Заголовок списку"}]}/>
        <label className="ad-page-editor-global-option"><input type="checkbox" checked={applyPageToAllRegions} onChange={(e)=>setApplyPageToAllRegions(e.target.checked)}/><span><strong>Застосувати оформлення до всіх регіонів</strong><small>Банер, заголовки та пошук оновляться в усіх активних регіонах. Самі акції залишаться прив’язаними до своїх регіонів.</small></span></label>
        <PrimaryButton onClick={()=>void savePage()} disabled={savingPage}><Check size={15}/> {savingPage ? "Збереження..." : applyPageToAllRegions ? "Зберегти для всіх регіонів" : "Зберегти оформлення сторінки"}</PrimaryButton>
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
          <div className="ad-page-editor-photo-field is-wide">
            <span>Фото пропозиції</span>
            <input ref={offerPhotoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async(e)=>{const file=e.target.files?.[0];if(!file)return;setOfferPhotoUploading(true);try{setOfferImageUrl(await adminImageToDataUrl(file));setMessage("Фото готове до збереження разом із пропозицією.");}catch(error){setMessage(error instanceof Error?error.message:"Не вдалося прочитати фото");}finally{setOfferPhotoUploading(false);e.target.value="";}}}/>
            {offerImageUrl ? <div className="ad-page-editor-photo-preview"><img src={offerImageUrl} alt="Фото гарячої пропозиції"/><button type="button" onClick={()=>setOfferImageUrl("")}><Trash2 size={14}/> Прибрати фото</button></div> : null}
            <button type="button" className="ad-page-editor-photo-upload" disabled={offerPhotoUploading} onClick={()=>offerPhotoInput.current?.click()}><ImagePlus size={17}/> {offerPhotoUploading?"Обробка фото...":offerImageUrl?"Замінити фото":"Завантажити фото"}</button>
            <small>JPG, PNG або WebP до 8 МБ. Фото збережеться в PostgreSQL і не зникне після redeploy.</small>
          </div>
          <label><span>Підпис терміну</span><input value={offerValidity} onChange={(e)=>setOfferValidity(e.target.value)} /></label>
          <TranslationInputs fields={[{key:"title",label:"Назва"},{key:"category_label",label:"Категорія"},{key:"discount",label:"Знижка"},{key:"description",label:"Короткий опис",multiline:true},{key:"detail",label:"Детальний опис",multiline:true},{key:"validity",label:"Термін дії"},{key:"badge",label:"Бейдж"}]} values={offerTranslations} onChange={setOfferTranslations}/>
          <label><span>Бейдж</span><input value={offerBadge} onChange={(e)=>setOfferBadge(e.target.value)} /></label>
          <label><span>Колір бейджа</span><select value={offerBadgeTone} onChange={(e)=>setOfferBadgeTone(e.target.value as "gold"|"green"|"red")}><option value="green">Зелений</option><option value="gold">Золотий</option><option value="red">Червоний</option></select></label>
          <label><span>Початок</span><input type="datetime-local" value={offerValidFrom} onChange={(e)=>setOfferValidFrom(e.target.value)} /></label>
          <label><span>Завершення</span><input type="datetime-local" value={offerValidUntil} onChange={(e)=>setOfferValidUntil(e.target.value)} /></label>
        </div>
        <label className="ad-stage2-check"><input type="checkbox" checked={offerActive} onChange={(e)=>setOfferActive(e.target.checked)} /><span>Пропозиція активна</span></label>
        <div className="ad-stage2-actions-row"><PrimaryButton onClick={()=>void saveOffer()} disabled={savingOffer || offerPhotoUploading}>{offerId?<Check size={14}/>:<Plus size={14}/>} {savingOffer?"Збереження...":offerId?"Зберегти пропозицію":"Додати пропозицію"}</PrimaryButton>{offerId?<OutlineButton onClick={resetOffer}>Скасувати</OutlineButton>:null}</div>
        <FilterStrip placeholder="Назва акції, партнер, знижка" search={offerFilters.search} onSearch={offerFilters.onSearch} fields={offerFields} values={offerFilters.values} onChange={offerFilters.onChange} onReset={offerFilters.reset}/>
        <div className="ad-page-editor-list">
          {filteredOffers.slice(offerFilters.page*offerFilters.pageSize,(offerFilters.page+1)*offerFilters.pageSize).map((offer)=><article key={offer.id} className={offer.active===false?"is-disabled":""}><span>{offer.image_url ? <img className="ad-page-editor-list-photo" src={offer.image_url} alt={offer.title}/> : null}<strong>{offer.title}</strong><small>{offer.discount||"Акція"} · {offer.place_name||offer.category_label||"без закладу"}</small>
              {offer.submitted_by_user_id ? <small>Від партнера · {offer.moderation_status==='pending'?'На модерації':offer.moderation_status==='rejected'?'Відхилено':'Схвалено'} {offer.moderation_comment?`· ${offer.moderation_comment}`:''}</small> : null}
              </span><div>{offer.submitted_by_user_id && offer.moderation_status!=='approved' ? <button type="button" onClick={()=>void moderatePartnerOffer(offer,"approved")}><Check size={13}/> Схвалити</button>:null}
              {offer.submitted_by_user_id && offer.moderation_status==='pending' ? <button type="button" onClick={()=>void moderatePartnerOffer(offer,"rejected")}><X size={13}/> Відхилити</button>:null}
              <button type="button" onClick={()=>editOffer(offer)}><Edit3 size={13}/> Редагувати</button><button type="button" className="is-delete" onClick={()=>void deleteOffer(offer)}><Trash2 size={13}/> Видалити</button></div></article>)}
          {!filteredOffers.length?<p className="ad-stage2-empty-row">Акцій за вибраними фільтрами немає</p>:null}
        </div><Pagination page={offerFilters.page} pageSize={offerFilters.pageSize} total={filteredOffers.length} onPage={offerFilters.setPage} onPageSize={offerFilters.changeSize}/>
      </section>
    </AdminShell>
  );
}

function CategoriesPageEditorScreen({ navigate }: AdminProps) {
  const adminKey="";
  const [categories,setCategories]=useState<Stage2Category[]>([]);
  const filters=useTableFilters();
  const [slug,setSlug]=useState("");
  const [name,setName]=useState("");
  const [nameEn,setNameEn]=useState("");
  const [namePl,setNamePl]=useState("");
  const [subs,setSubs]=useState<string[]>([]);
  const [subsEn,setSubsEn]=useState<string[]>([]);
  const [subsPl,setSubsPl]=useState<string[]>([]);
  const [newSub,setNewSub]=useState("");
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  const load=async()=>{
    try{setCategories(await adminStage2Fetch<Stage2Category[]>("/categories",adminKey));}
    catch(error){setMessage(error instanceof Error?error.message:"Не вдалося завантажити категорії");}
  };
  useEffect(()=>{void load();},[]);
  const select=(item:Stage2Category)=>{setSlug(item.slug);setName(item.name);setNameEn(item.name_en||"");setNamePl(item.name_pl||"");setSubs([...(item.subcategories||[])]);setSubsEn([...(item.subcategories_i18n?.en||[])]);setSubsPl([...(item.subcategories_i18n?.pl||[])]);setNewSub("");};
  const reset=()=>{setSlug("");setName("");setNameEn("");setNamePl("");setSubs([]);setSubsEn([]);setSubsPl([]);setNewSub("");};
  const updateSub=(index:number,value:string)=>setSubs((current)=>current.map((item,itemIndex)=>itemIndex===index?value:item));
  const removeSub=(index:number)=>{setSubs((current)=>current.filter((_,i)=>i!==index));setSubsEn(c=>c.filter((_,i)=>i!==index));setSubsPl(c=>c.filter((_,i)=>i!==index));};
  const updateSubLanguage=(lang:"en"|"pl",index:number,value:string)=>{
    const setter=lang==="en"?setSubsEn:setSubsPl;
    setter(c=>subs.map((_,i)=>i===index?value:c[i]||""));
  };
  const addSub=()=>{
    const clean=newSub.trim();
    if(!clean){setMessage("Вкажіть назву підрозділу.");return;}
    if(subs.some((item)=>item.trim().toLocaleLowerCase("uk")===clean.toLocaleLowerCase("uk"))){setMessage("Такий підрозділ уже є.");return;}
    setSubs((current)=>[...current,clean]);
    setSubsEn(c=>[...subs.map((_,i)=>c[i]||translateKnownLabel("en",subs[i])),translateKnownLabel("en",clean)===clean?"":translateKnownLabel("en",clean)]);
    setSubsPl(c=>[...subs.map((_,i)=>c[i]||translateKnownLabel("pl",subs[i])),translateKnownLabel("pl",clean)===clean?"":translateKnownLabel("pl",clean)]);
    setNewSub("");
    setMessage("");
  };
  const deleteCategory = async () => {
    if (!slug || !categories.some((item)=>item.slug===slug)) return;
    const selectedName = categories.find((item)=>item.slug===slug)?.name || name;
    if (!window.confirm(`Прибрати розділ «${selectedName}» з гіда? Розділ зникне для всіх регіонів. Дані закладів не видаляються.`)) return;
    setSaving(true);
    try {
      await adminStage2Fetch(`/admin/stage2/categories/${encodeURIComponent(slug)}`,adminKey,{method:"DELETE"});
      reset();
      await load();
      setMessage(`Розділ «${selectedName}» вимкнено для всіх регіонів. Дані збережено.`);
    } catch (error) {
      setMessage(error instanceof Error?`Не вдалося видалити розділ: ${error.message}`:"Не вдалося видалити розділ");
    } finally {setSaving(false);}
  };
  const save=async()=>{
    if(!slug.trim()||!name.trim()){setMessage("Вкажіть slug і назву розділу.");return;}
    setSaving(true);
    try{
      const cleanSubs=subs.map((item)=>item.trim()).filter(Boolean);
      const saved=await adminStage2Fetch<Stage2Category>("/admin/stage2/categories",adminKey,{method:"POST",body:JSON.stringify({slug:slug.trim(),name:name.trim(),name_en:nameEn.trim()||null,name_pl:namePl.trim()||null,subcategories:cleanSubs,subcategories_i18n:{en:subsEn.map(x=>x.trim()),pl:subsPl.map(x=>x.trim())}})});
      setMessage(`Розділ «${saved.name || name.trim()}» і ${cleanSubs.length} підрозділів збережено.`);
      setSubs([...(saved.subcategories||cleanSubs)]);
      setSubsEn([...(saved.subcategories_i18n?.en||subsEn)]);
      setSubsPl([...(saved.subcategories_i18n?.pl||subsPl)]);
      await load();
    }catch(error){setMessage(error instanceof Error?`Помилка збереження: ${error.message}`:"Не вдалося зберегти розділ");}
    finally{setSaving(false);}
  };
  const fields:FilterDefinition[]=[
    {key:'subcategories',label:'Підкатегорії',allLabel:'Усі розділи',options:[{value:'yes',label:'Є підкатегорії'},{value:'no',label:'Без підкатегорій'}]},
  ];
  const filteredCategories=categories.filter(c=>c.slug!=='emergency'
    &&(!filters.search||normalizeFilterText([c.slug,c.name,c.name_en,c.name_pl,...(c.subcategories||[])].join(' ')).includes(normalizeFilterText(filters.search)))
    &&(!filters.values.subcategories||(filters.values.subcategories==='yes'?(c.subcategories||[]).length>0:(c.subcategories||[]).length===0)));
  return (
    <AdminShell active="pages" navigate={navigate} contentClassName="ad-main--page-editors ad-main--emergency-editor">
      <AdminPageHeader title="Категорії / розділи" subtitle="Назви розділів і підрозділи спільні для всіх регіонів. Редагування винесено з «Контент / QR»." back={()=>navigate("admin","admin-pages")} action={<OutlineButton onClick={()=>void load()}><RefreshCcw size={16}/> Оновити</OutlineButton>} />
      {message?<p className="ad-page-editor-message">{message}</p>:null}
      <section className="ad-page-editor-split">
        <div className="ad-page-editor-panel">
          <header><div><strong>Розділи</strong><small>Оберіть існуючий або створіть новий.</small></div><button type="button" className="ad-page-editor-new" onClick={reset}><Plus size={14}/> Новий</button></header>
          <FilterStrip placeholder="Назва, slug або підкатегорія" search={filters.search} onSearch={filters.onSearch} fields={fields} values={filters.values} onChange={filters.onChange} onReset={filters.reset}/>
          <div className="ad-page-editor-category-list">{filteredCategories.map((item)=><button type="button" key={item.slug} className={slug===item.slug?"is-active":""} onClick={()=>select(item)}><strong>{item.name}</strong><small>{item.slug} · {(item.subcategories||[]).length} підрозділів</small><ChevronRight size={16}/></button>)}</div>
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
              {subs.map((item,index)=><div key={`subcategory-${index}`} className="ad-page-editor-subcategory-row ad-page-editor-subcategory-row--localized"><input lang="uk" value={item} onChange={(e)=>updateSub(index,e.target.value)} placeholder={`UA · підрозділ ${index+1}`} /><input lang="en" value={subsEn[index]||""} onChange={(e)=>updateSubLanguage("en",index,e.target.value)} placeholder="EN · назва"/><input lang="pl" value={subsPl[index]||""} onChange={(e)=>updateSubLanguage("pl",index,e.target.value)} placeholder="PL · nazwa"/><button type="button" className="is-delete" onClick={()=>removeSub(index)} aria-label="Видалити підрозділ"><Trash2 size={14}/></button></div>)}
              {!subs.length?<small className="ad-page-editor-subcategory-empty">Підрозділів ще немає.</small>:null}
            </div>
            <div className="ad-page-editor-subcategory-add"><input value={newSub} onChange={(e)=>setNewSub(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();addSub();}}} placeholder="Назва нового підрозділу" /><button type="button" onClick={addSub}><Plus size={14}/> Додати підрозділ</button></div>
          </div>

          <div className="ad-page-editor-category-actions">
            <PrimaryButton onClick={()=>void save()} disabled={saving}><Check size={15}/> {saving?"Збереження...":"Зберегти розділ"}</PrimaryButton>
            {categories.some((item)=>item.slug===slug) && slug!=="emergency" ? <button type="button" className="ad-page-editor-category-delete" disabled={saving} onClick={()=>void deleteCategory()}><Trash2 size={15}/> Видалити розділ</button> : null}
          </div>
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
    case "admin-review-moderation": return <ReviewModerationScreen navigate={navigate} />;
    case "admin-offer-moderation": return <OfferModerationScreen navigate={navigate} />;
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
    case "admin-settings-audit": return <AuditSettingsScreen navigate={navigate} />;
    default: return <PartnersScreen navigate={navigate} />;
  }
}
