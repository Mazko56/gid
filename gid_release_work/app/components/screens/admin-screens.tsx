"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CircleUserRound,
  Copy,
  Database,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileCheck2,
  FileClock,
  FileText,
  Filter,
  Fingerprint,
  Flag,
  History,
  Image as ImageIcon,
  Info,
  Layers3,
  Link2,
  LockKeyhole,
  Map,
  MapPin,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Percent,
  Phone,
  Plus,
  QrCode,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  TrendingUp,
  UserCheck,
  UsersRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import {
  DEFAULT_EMERGENCY_SERVICES,
  readEmergencyServices,
  writeEmergencyServices,
  type EmergencyService,
} from "../../lib/emergency-services";
import type { RoleKey } from "../../lib/navigation";
import {
  ActivityRow,
  Avatar,
  Card,
  CardHeader,
  IconButton,
  MetricCard,
  MiniTrend,
  PageHeading,
  PrimaryButton,
  ProgressBar,
  SearchField,
  SecondaryButton,
  StatusBadge,
  Table,
  TableRow,
  Tag,
  Toggle,
} from "../ui";

type Navigate = (role: RoleKey, slug: string) => void;

function AmbassadorDashboard() {
  return (
    <div className="screen-stack">
      <PageHeading
        eyebrow="Кабінет амбасадора"
        title="Ваші рекомендації працюють"
        description="Марія Коваль · Карпати / літо 2026"
        action={<StatusBadge tone="green" dot>Профіль активний</StatusBadge>}
      />
      <div className="ambassador-hero-grid">
        <Card tone="dark" className="ambassador-earnings-card">
          <div className="ambassador-earnings-card__top"><span><Sparkles size={24} /> Винагорода</span><button type="button"><Eye size={20} /></button></div>
          <small>Доступно після підтвердження</small>
          <strong>3 850 ₴</strong>
          <div><span><small>Очікує</small><strong>1 200 ₴</strong></span><span><small>Виплачено</small><strong>8 400 ₴</strong></span></div>
        </Card>
        <MetricCard label="Переходи" value="1 482" delta="+18% за 30 днів" icon={<Link2 size={24} />} />
        <MetricCard label="Реєстрації" value="386" delta="Конверсія 26,0%" icon={<UserCheck size={24} />} tone="lime" />
        <MetricCard label="Валідні залучення" value="154" delta="39,9% від реєстрацій" icon={<BadgeCheck size={24} />} tone="blue" />
      </div>
      <div className="ambassador-main-grid">
        <Card className="ambassador-link-card">
          <CardHeader title="Ваше посилання та QR" subtitle="First-touch атрибуція для нових користувачів" />
          <div className="ambassador-link-field"><span><Link2 size={20} /></span><code>t.me/GidTurystaBot?start=amb_maria26</code><button type="button"><Copy size={20} /> Копіювати</button></div>
          <div className="ambassador-qr-row"><div className="mini-qr-placeholder"><QrCode size={86} /></div><div><strong>QR для друку та Stories</strong><p>Кампанія «Карпати / літо 2026» буде записана автоматично.</p><span><SecondaryButton icon={<Download size={19} />}>Завантажити PNG</SecondaryButton><SecondaryButton icon={<Download size={19} />}>PDF для друку</SecondaryButton></span></div></div>
        </Card>
        <Card>
          <CardHeader title="Воронка залучення" subtitle="Останні 30 днів" />
          <div className="funnel-list">
            {[
              ["Переходи", "1 482", 100, "green"],
              ["Відкрили Mini App", "1 106", 75, "lime"],
              ["Зареєструвалися", "386", 26, "blue"],
              ["Зробили валідну дію", "154", 10, "orange"],
            ].map(([label, value, percent, tone]) => <div key={label as string}><div><span>{label as string}</span><strong>{value as string}</strong></div><span className={`funnel-bar funnel-bar--${tone}`} style={{ width: `${percent}%` }} /></div>)}
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Останні залучення" subtitle="Без телефонів і деталей конкретних покупок" action={<button type="button">Переглянути всі</button>} />
        <Table headers={["Користувач", "Джерело", "Реєстрація", "Валідна дія", "Винагорода", "Статус"]} columns="1.2fr 1.1fr 1fr 1.2fr .8fr .75fr">
          {[
            ["Олена В.", "QR · Instagram Stories", "15.07 · 09:42", "Бронювання", "250 ₴", "Approved", "green"],
            ["Ігор Л.", "Посилання · Telegram", "14.07 · 18:04", "QR-покупка", "250 ₴", "Pending", "orange"],
            ["Андрій М.", "QR · готель", "14.07 · 12:18", "QR-покупка", "250 ₴", "Approved", "green"],
          ].map((row) => <TableRow key={row[0]} columns="1.2fr 1.1fr 1fr 1.2fr .8fr .75fr"><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><strong>{row[4]}</strong><StatusBadge tone={row[6] as "green" | "orange"}>{row[5]}</StatusBadge></TableRow>)}
        </Table>
      </Card>
    </div>
  );
}

function AmbassadorCampaigns() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Атрибуція" title="Кампанії амбасадора" description="Порівнюйте джерела, не змінюючи first-touch після валідної реєстрації." action={<PrimaryButton icon={<Plus size={20} />}>Нова кампанія</PrimaryButton>} />
      <div className="campaign-grid">
        {[
          ["Карпати / літо 2026", "Instagram + Telegram", "1 106", "154", "3 850 ₴", "Активна", "green"],
          ["Гід вихідного дня", "YouTube description", "486", "61", "1 525 ₴", "Активна", "lime"],
          ["Зимовий Буковель", "QR для друку", "2 840", "328", "8 200 ₴", "Завершена", "neutral"],
        ].map(([title, channel, clicks, valid, reward, status, tone]) => (
          <Card key={title as string} className="campaign-card">
            <div className="campaign-card__top"><span className={`campaign-card__icon campaign-card__icon--${tone}`}><Megaphone size={24} /></span><StatusBadge tone={tone as "green" | "lime" | "neutral"} dot={status === "Активна"}>{status as string}</StatusBadge></div>
            <h2>{title as string}</h2><p>{channel as string}</p>
            <div className="campaign-card__stats"><span><small>Переходи</small><strong>{clicks as string}</strong></span><span><small>Валідні</small><strong>{valid as string}</strong></span><span><small>Винагорода</small><strong>{reward as string}</strong></span></div>
            <ProgressBar value={status === "Завершена" ? 100 : title === "Карпати / літо 2026" ? 64 : 38} label="Прогрес до цілі" />
            <button type="button">Відкрити кампанію <ArrowRight size={18} /></button>
          </Card>
        ))}
      </div>
      <Card tone="soft" className="attribution-rule-card">
        <Fingerprint size={26} />
        <div><strong>Правило першого переходу</strong><p>Амбасадор фіксується під час першого підтвердженого входу. Повторні переходи не змінюють джерело, а підозріла активність потрапляє на перевірку.</p></div>
      </Card>
    </div>
  );
}

function RegionalDashboard({ navigate }: { navigate: Navigate }) {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Регіональна адмінка" title="Івано‑Франківська область" description="Ви бачите партнерів, контент і статистику лише свого регіону" action={<div className="heading-actions"><StatusBadge tone="blue"><LockKeyhole size={16} /> Регіон IF‑01</StatusBadge><IconButton label="Сповіщення"><Bell size={23} /></IconButton></div>} />
      <div className="metric-grid metric-grid--four">
        <MetricCard label="Активні партнери" value="128" delta="+12 за місяць" icon={<Building2 size={24} />} />
        <MetricCard label="Точки QR" value="486" delta="42 180 сканувань" icon={<QrCode size={24} />} tone="lime" />
        <MetricCard label="На модерації" value="17" delta="4 прострочено SLA" icon={<FileClock size={24} />} tone="orange" />
        <MetricCard label="Бронювання" value="2 840" delta="+21% за 30 днів" icon={<CalendarDays size={24} />} tone="blue" />
      </div>
      <div className="regional-grid">
        <Card className="regional-map-card">
          <CardHeader title="Активність по території" subtitle="QR-відкриття за останні 7 днів" action={<button type="button">Детальніше</button>} />
          <div className="regional-map-mock">
            <span className="region-shape region-shape--one" /><span className="region-shape region-shape--two" /><span className="region-shape region-shape--three" />
            {[
              ["regional-pin--yaremche", "Яремче", "12,8k"], ["regional-pin--bukovel", "Поляниця", "18,4k"], ["regional-pin--tatariv", "Татарів", "8,2k"], ["regional-pin--vorokhta", "Ворохта", "5,1k"],
            ].map(([className, label, value]) => <button type="button" className={`regional-pin ${className}`} key={label}><span><MapPin size={17} /></span><div><strong>{label}</strong><small>{value} сканів</small></div></button>)}
          </div>
          <div className="regional-map-legend"><span><i className="heat-dot heat-dot--high" /> Висока</span><span><i className="heat-dot heat-dot--medium" /> Середня</span><span><i className="heat-dot heat-dot--low" /> Базова активність</span></div>
        </Card>
        <Card>
          <CardHeader title="Черга модерації" subtitle="SLA: 24 години" action={<button type="button" onClick={() => navigate("regional", "regional-partners")}>Відкрити всі</button>} />
          <div className="regional-queue">
            {[
              ["Готель «Смерека»", "Яремче · готель", "22 год", "urgent"], ["Рафтинг Черемош", "Верховина · розваги", "8 год", "normal"], ["Крамниця «Файно»", "Татарів · магазин", "4 год", "normal"], ["Садиба «Обрій»", "Ворохта · готель", "2 год", "normal"],
            ].map(([name, meta, time, state]) => <button type="button" key={name} onClick={() => navigate("admin", "partner-moderation")}><span className={`queue-logo queue-logo--${state}`}><Building2 size={22} /></span><div><strong>{name}</strong><small>{meta}</small></div><span className={state === "urgent" ? "is-urgent" : ""}>{time}</span><ChevronRight size={19} /></button>)}
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Ключові показники регіону" subtitle="Порівняння населених пунктів" />
        <Table headers={["Локація", "Партнери", "QR-відкриття", "Бронювання", "Операції", "Рейтинг"]} columns="1.2fr .75fr 1fr 1fr 1fr .75fr">
          {[
            ["Поляниця / Буковель", "42", "18 420", "1 248", "986", "4.82"], ["Яремче", "36", "12 840", "842", "614", "4.76"], ["Татарів", "28", "8 216", "486", "392", "4.88"], ["Ворохта", "22", "5 104", "264", "198", "4.71"],
          ].map((row) => <TableRow key={row[0]} columns="1.2fr .75fr 1fr 1fr 1fr .75fr"><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span>{row[4]}</span><span className="rating-cell"><Star size={16} fill="currentColor" /> {row[5]}</span></TableRow>)}
        </Table>
      </Card>
    </div>
  );
}

function RegionalPartners() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Tenant: Івано‑Франківська область" title="Партнери регіону" description="Створення, модерація та контроль актуальності карток у межах регіону." action={<PrimaryButton icon={<Plus size={20} />}>Додати партнера</PrimaryButton>} />
      <Card className="table-card">
        <div className="table-toolbar"><SearchField placeholder="Назва, ЄДРПОУ або населений пункт" /><div><button type="button"><Filter size={19} /> Статус</button><button type="button"><Tags size={19} /> Категорія</button><button type="button"><Download size={19} /> Експорт</button></div></div>
        <Table headers={["Партнер / заклад", "Категорія", "Локація", "Повнота", "Оновлено", "Статус", ""]} columns="1.5fr 1fr 1fr .8fr .8fr .85fr 40px">
          {[
            ["Готель «Смерека»", "Готель", "Яремче", 92, "2 год тому", "На модерації", "orange"], ["Коруна SPA", "Чани / SPA", "Татарів", 100, "Сьогодні", "Опубліковано", "green"], ["Рафтинг Черемош", "Розваги", "Верховина", 78, "8 год тому", "На модерації", "orange"], ["Грибова хата", "Ресторан", "Поляниця", 96, "Учора", "Опубліковано", "green"], ["Садиба «Обрій»", "Готель", "Ворохта", 64, "2 год тому", "Повернено", "red"],
          ].map((row) => <TableRow key={row[0] as string} columns="1.5fr 1fr 1fr .8fr .8fr .85fr 40px"><div className="table-entity"><span><Building2 size={20} /></span><strong>{row[0] as string}</strong></div><span>{row[1] as string}</span><span>{row[2] as string}</span><div className="table-progress"><ProgressBar value={row[3] as number} /><small>{row[3] as number}%</small></div><span>{row[4] as string}</span><StatusBadge tone={row[6] as "green" | "orange" | "red"}>{row[5] as string}</StatusBadge><IconButton label="Більше"><MoreHorizontal size={22} /></IconButton></TableRow>)}
        </Table>
        <div className="table-pagination"><span>Показано 1–5 із 128</span><div><button type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button"><ChevronRight size={19} /></button></div></div>
      </Card>
    </div>
  );
}

function RegionalContent() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Контент регіону" title="Добірки та локальні дані" description="Категорії глобальні, а маршрути, добірки й екстрені контакти керуються в регіоні." action={<PrimaryButton icon={<Plus size={20} />}>Створити добірку</PrimaryButton>} />
      <div className="content-overview-grid">
        <MetricCard label="Опубліковані місця" value="342" delta="28 потребують перевірки" icon={<MapPin size={24} />} />
        <MetricCard label="Готові сценарії" value="14" delta="8 активні зараз" icon={<Layers3 size={24} />} tone="lime" />
        <MetricCard label="Локальні контакти" value="46" delta="Перевірено 92%" icon={<Phone size={24} />} tone="blue" />
        <MetricCard label="Редакційні добірки" value="22" delta="4 заплановано" icon={<Sparkles size={24} />} tone="neutral" />
      </div>
      <div className="content-columns">
        <Card>
          <CardHeader title="Сценарії відпочинку" subtitle="Готові маршрути для різних форматів подорожі" action={<button type="button">Усі</button>} />
          <div className="scenario-list">
            {[
              ["Карпати за 3 дні", "12 місць · авто · середній бюджет", "Опубліковано", "green"], ["З дітьми у дощ", "6 місць · без авто · 1 день", "Опубліковано", "green"], ["Романтичний weekend", "8 місць · 2 дні", "Чернетка", "neutral"], ["Активна Верховина", "10 місць · 2 дні", "На перевірці", "orange"],
            ].map(([name, meta, status, tone]) => <button type="button" key={name}><span className={`scenario-icon scenario-icon--${tone}`}><Map size={22} /></span><div><strong>{name}</strong><small>{meta}</small></div><StatusBadge tone={tone as "green" | "neutral" | "orange"}>{status}</StatusBadge><ChevronRight size={19} /></button>)}
          </div>
        </Card>
        <Card>
          <CardHeader title="Потрібна актуалізація" subtitle="За датою останньої перевірки" />
          <div className="freshness-list">
            {[
              ["Екстрені контакти · Верховина", "Перевірено 92 дні тому", 24], ["Підйом на Хом’як", "Графік змінено партнером", 42], ["Трансфери Татарів", "7 карток без ціни", 58], ["Заклади з літніми терасами", "Сезонна добірка", 76],
            ].map(([name, meta, value]) => <div key={name as string}><div><strong>{name as string}</strong><small>{meta as string}</small></div><ProgressBar value={value as number} /><button type="button">Перевірити</button></div>)}
          </div>
        </Card>
      </div>
      <Card tone="soft" className="taxonomy-note"><Tags size={25} /><div><strong>Категорії та теги не хардкодяться</strong><p>Регіон використовує глобальну taxonomy, але може змінювати порядок, локальні назви й видимість за дозволом суперадміна.</p></div></Card>
    </div>
  );
}

function AdminDashboard({ navigate }: { navigate: Navigate }) {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Головна адмінка" title="Стан платформи" description="Усі регіони · середа, 15 липня · 10:24" action={<div className="heading-actions"><StatusBadge tone="green" dot>Системи працюють</StatusBadge><IconButton label="Сповіщення"><Bell size={23} /></IconButton></div>} />
      <div className="metric-grid metric-grid--four">
        <MetricCard label="Активні користувачі" value="28 462" delta="+22,8% за 30 днів" icon={<UsersRound size={24} />} />
        <MetricCard label="Партнери" value="486" delta="31 на модерації" icon={<Building2 size={24} />} tone="lime" />
        <MetricCard label="Оборот через QR" value="4,82 млн ₴" delta="2 804 операції" icon={<CircleDollarSign size={24} />} tone="blue" />
        <MetricCard label="Risk events" value="12" delta="3 високого пріоритету" icon={<ShieldAlert size={24} />} tone="orange" />
      </div>
      <div className="admin-dashboard-grid">
        <Card className="platform-funnel-card">
          <CardHeader title="Воронка продукту" subtitle="Останні 30 днів" action={<button className="select-button" type="button">Усі регіони <ChevronDown size={18} /></button>} />
          <div className="platform-funnel-chart">
            {[
              ["QR scanned", 100, "124 820"], ["App opened", 82, "102 496"], ["Registered", 43, "53 672"], ["Active action", 27, "33 702"], ["Booking / transaction", 12, "14 978"],
            ].map(([label, width, value], index) => <div key={label as string} style={{ width: `${width}%` }}><span>{label as string}</span><strong>{value as string}</strong><small>{index === 0 ? "100%" : `${Math.round((width as number) / 100 * 100)}%`}</small></div>)}
          </div>
        </Card>
        <Card>
          <CardHeader title="Потребує уваги" subtitle="Пріоритетні задачі" action={<StatusBadge tone="orange">12 подій</StatusBadge>} />
          <div className="attention-list">
            <ActivityRow title="Аномальні QR-операції" meta="Партнер #OR‑184 · 24 операції за 8 хв" status="Високий" tone="red" />
            <ActivityRow title="SLA модерації порушено" meta="4 партнери · Івано‑Франківський регіон" status="Середній" tone="orange" />
            <ActivityRow title="Розбіжність settlement" meta="Statement #ST‑0714 · 2 400 ₴" status="Перевірити" tone="blue" />
            <ActivityRow title="Бонуси наближаються до expiry" meta="18 420 бонусів · 842 користувачі" status="Планово" tone="neutral" />
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Регіони" subtitle="Поточні операційні показники" action={<button type="button">Керувати регіонами</button>} />
        <Table headers={["Регіон", "Користувачі", "Партнери", "QR-скани", "Бронювання", "Оборот", "Стан"]} columns="1.35fr .9fr .8fr .9fr .9fr 1fr .75fr">
          {[
            ["Івано‑Франківська", "18 420", "128", "42 180", "2 840", "2,48 млн ₴", "Активний", "green"], ["Закарпатська", "8 246", "86", "21 504", "1 286", "1,14 млн ₴", "Активний", "green"], ["Львівська", "1 796", "34", "4 186", "238", "284 тис. ₴", "Пілот", "blue"], ["Чернівецька", "—", "12", "—", "—", "—", "Підготовка", "neutral"],
          ].map((row) => <TableRow key={row[0]} columns="1.35fr .9fr .8fr .9fr .9fr 1fr .75fr"><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span>{row[4]}</span><strong>{row[5]}</strong><StatusBadge tone={row[7] as "green" | "blue" | "neutral"}>{row[6]}</StatusBadge></TableRow>)}
        </Table>
      </Card>
      <div className="admin-shortcuts">
        <button type="button" onClick={() => navigate("admin", "partner-moderation")}><span><FileCheck2 size={24} /></span><div><strong>Модерація партнерів</strong><small>31 у черзі</small></div><ArrowRight size={20} /></button>
        <button type="button" onClick={() => navigate("admin", "qr-analytics")}><span><QrCode size={24} /></span><div><strong>QR-аналітика</strong><small>486 активних точок</small></div><ArrowRight size={20} /></button>
        <button type="button" onClick={() => navigate("admin", "ledger")}><span><Database size={24} /></span><div><strong>Фінансовий ledger</strong><small>Незмінний журнал</small></div><ArrowRight size={20} /></button>
        <button type="button" onClick={() => navigate("admin", "emergency-services")}><span><Info size={24} /></span><div><strong>Корисні сервіси</strong><small>Екран «Халепа?»</small></div><ArrowRight size={20} /></button>
      </div>
    </div>
  );
}

function EmergencyServicesSettings() {
  const [services, setServices] = useState<EmergencyService[]>(DEFAULT_EMERGENCY_SERVICES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setServices(readEmergencyServices());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const updateService = (
    id: string,
    patch: Partial<Pick<EmergencyService, "title" | "note" | "active">>,
  ) => {
    setSaved(false);
    setServices((current) => current.map((service) => (
      service.id === id ? { ...service, ...patch } : service
    )));
  };

  const addService = () => {
    setSaved(false);
    setServices((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        title: "Новий сервіс",
        note: "Короткий опис",
        tone: "green",
        icon: "custom",
        active: true,
      },
    ]);
  };

  const removeService = (id: string) => {
    setSaved(false);
    setServices((current) => current.filter((service) => service.id !== id));
  };

  const saveServices = () => {
    writeEmergencyServices(services);
    setSaved(true);
  };

  const activeCount = services.filter((service) => service.active).length;

  return (
    <div className="screen-stack emergency-services-settings">
      <PageHeading
        eyebrow="Контент / екстрена допомога"
        title="Корисні сервіси"
        description="Керуйте складом і видимістю карток на екрані «Халепа?»"
        action={(
          <div className="heading-actions">
            {saved ? <StatusBadge tone="green" dot>Збережено</StatusBadge> : null}
            <PrimaryButton icon={<Check size={20} />} onClick={saveServices}>Зберегти</PrimaryButton>
          </div>
        )}
      />

      <div className="metric-grid metric-grid--four">
        <MetricCard label="Усього сервісів" value={String(services.length)} delta="Склад списку" icon={<Layers3 size={24} />} />
        <MetricCard label="Відображаються" value={String(activeCount)} delta="Доступні туристу" icon={<Eye size={24} />} tone="lime" />
        <MetricCard label="Приховані" value={String(services.length - activeCount)} delta="Не показуються" icon={<EyeOff size={24} />} tone="neutral" />
        <MetricCard label="Регіон" value="Татарів" delta="Івано-Франківська область" icon={<MapPin size={24} />} tone="blue" />
      </div>

      <Card className="emergency-services-card">
        <CardHeader
          title="Список сервісів"
          subtitle="Додавайте нові картки або приховуйте непотрібні"
          action={<SecondaryButton icon={<Plus size={19} />} onClick={addService}>Додати сервіс</SecondaryButton>}
        />
        <div className="emergency-service-admin-list">
          {services.map((service, index) => (
            <article key={service.id}>
              <span className="emergency-service-admin-list__order">{index + 1}</span>
              <div className="emergency-service-admin-list__fields">
                <label>
                  <span>Назва</span>
                  <input
                    aria-label={`Назва сервісу ${index + 1}`}
                    value={service.title}
                    onChange={(event) => updateService(service.id, { title: event.target.value })}
                  />
                </label>
                <label>
                  <span>Підпис</span>
                  <input
                    aria-label={`Підпис сервісу ${index + 1}`}
                    value={service.note}
                    onChange={(event) => updateService(service.id, { note: event.target.value })}
                  />
                </label>
              </div>
              <button
                type="button"
                className={`emergency-service-visibility ${service.active ? "is-active" : ""}`}
                onClick={() => updateService(service.id, { active: !service.active })}
              >
                {service.active ? <Eye size={18} /> : <EyeOff size={18} />}
                {service.active ? "Показувати" : "Приховано"}
              </button>
              <button
                type="button"
                className="emergency-service-remove"
                aria-label={`Видалити ${service.title}`}
                onClick={() => removeService(service.id)}
              >
                <XCircle size={20} />
              </button>
            </article>
          ))}
        </div>
      </Card>

      <Card tone="soft" className="taxonomy-note">
        <Info size={25} />
        <div>
          <strong>Список можна розширювати або звужувати</strong>
          <p>Порядок карток зберігається, а приховані сервіси не відображаються туристу.</p>
        </div>
      </Card>
    </div>
  );
}

function PartnerModeration() {
  const [decision, setDecision] = useState<"approve" | "return" | null>(null);
  return (
    <div className="screen-stack moderation-screen">
      <PageHeading eyebrow="Модерація · заявка #PR‑1048" title="Готель «Смерека»" description="Івано‑Франківська обл. · Яремче · подано 14 липня о 12:18" action={<StatusBadge tone="orange" dot>На модерації · 22 год</StatusBadge>} />
      <div className="moderation-layout">
        <div className="moderation-main">
          <Card className="moderation-cover-card"><span className="moderation-cover-card__visual"><Building2 size={55} /></span><div><div><StatusBadge tone="lime">Готель</StatusBadge><StatusBadge tone="blue">Яремче</StatusBadge></div><h2>Готель «Смерека»</h2><p>Сімейний готель у центрі Яремче з видом на гори, рестораном і власною сауною.</p><span><MapPin size={17} /> вул. Свободи, 84 · координати в межах регіону</span></div></Card>
          <Card>
            <CardHeader title="Перевірка картки" subtitle="Автоматичні та ручні критерії" />
            <div className="moderation-checks">
              {[
                ["Назва й категорія", "Заповнено", "green"], ["Адреса та геокоординати", "Збігаються", "green"], ["Контактний телефон", "Підтверджено", "green"], ["Головне фото", "Потребує перевірки", "orange"], ["Опис і послуги", "Заповнено", "green"], ["Право представляти заклад", "Документ завантажено", "blue"],
              ].map(([title, status, tone]) => <div key={title}><span className={`moderation-check-icon moderation-check-icon--${tone}`}>{tone === "green" ? <Check size={17} /> : tone === "orange" ? <AlertTriangle size={17} /> : <FileText size={17} />}</span><strong>{title}</strong><StatusBadge tone={tone as "green" | "orange" | "blue"}>{status}</StatusBadge></div>)}
            </div>
          </Card>
          <Card>
            <CardHeader title="Документи й медіа" />
            <div className="document-grid"><button type="button"><FileText size={26} /><div><strong>Витяг / реєстрація</strong><small>PDF · 1,2 МБ</small></div><Eye size={20} /></button><button type="button"><FileText size={26} /><div><strong>Право представляти</strong><small>PDF · 840 КБ</small></div><Eye size={20} /></button><button type="button"><ImageIcon size={26} /><div><strong>Фото закладу</strong><small>8 зображень</small></div><Eye size={20} /></button></div>
          </Card>
        </div>
        <div className="moderation-side">
          <Card>
            <CardHeader title="Організація" />
            <div className="organization-details"><div><span><Building2 size={20} /></span><div><small>Юридична назва</small><strong>ТОВ «Смерека Груп»</strong></div></div><div><span><Fingerprint size={20} /></span><div><small>ЄДРПОУ</small><strong>44881234</strong></div></div><div><span><CircleUserRound size={20} /></span><div><small>Власник кабінету</small><strong>Ірина Петренко</strong></div></div><div><span><Phone size={20} /></span><div><small>Телефон</small><strong>+380 67 555 24 18</strong></div></div></div>
          </Card>
          <Card className="moderation-decision-card">
            <CardHeader title="Рішення модератора" subtitle="Дія потрапить до audit log" />
            <div className="decision-buttons"><button className={decision === "approve" ? "is-active is-approve" : ""} type="button" onClick={() => setDecision("approve")}><CheckCircle2 size={22} /> Схвалити</button><button className={decision === "return" ? "is-active is-return" : ""} type="button" onClick={() => setDecision("return")}><RefreshCcw size={22} /> Повернути</button></div>
            <label className="textarea-field"><span>Коментар</span><textarea placeholder="Опишіть рішення або правки для партнера" defaultValue={decision === "return" ? "Замініть головне фото: поточне містить сторонній водяний знак." : ""} /></label>
            <PrimaryButton icon={<ShieldCheck size={20} />}>Підтвердити рішення</PrimaryButton>
          </Card>
          <Card tone="soft" className="moderation-audit-note"><History size={22} /><p>Рішення запише автора, час, початковий статус, новий статус і коментар.</p></Card>
        </div>
      </div>
    </div>
  );
}

function LocationEditor() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Контент / локації" title="Редактор локації" description="Водоспад Женецький Гук · природна локація" action={<div className="heading-actions"><SecondaryButton icon={<Eye size={20} />}>Preview</SecondaryButton><PrimaryButton icon={<Check size={20} />}>Зберегти</PrimaryButton></div>} />
      <div className="location-editor-grid">
        <Card className="location-editor-nav">
          {[["Основне", Edit3], ["Геодані", MapPin], ["Медіа", ImageIcon], ["Атрибути", Tags], ["QR-точки", QrCode], ["Модерація", ShieldCheck]].map(([label, Icon], index) => { const NavIcon = Icon as typeof Edit3; return <button className={index === 0 ? "is-active" : ""} type="button" key={label as string}><NavIcon size={22} />{label as string}<ChevronRight size={18} /></button>; })}
        </Card>
        <div className="location-editor-main">
          <Card>
            <CardHeader title="Основні дані" subtitle="Українська · основна мова" />
            <div className="editor-form-grid"><label className="text-field text-field--full"><span>Назва</span><input defaultValue="Водоспад Женецький Гук" /></label><label className="text-field"><span>Категорія</span><input defaultValue="Природа / водоспади" /></label><label className="text-field"><span>Населений пункт</span><input defaultValue="Татарів" /></label><label className="text-field text-field--full"><span>Опис</span><textarea defaultValue="Один із найвідоміших водоспадів Українських Карпат, розташований у мальовничій ущелині неподалік села Татарів." /><small>156 / 1000</small></label></div>
          </Card>
          <Card>
            <CardHeader title="Статуси й маркування" subtitle="Комерційне просування та редакційна рекомендація — окремі поля" />
            <div className="toggle-grid"><Toggle checked label="Опубліковано" /><Toggle checked label="Перевірено редакцією" /><Toggle checked label="Ми рекомендуємо" /><Toggle checked={false} label="Реклама / партнер" /><Toggle checked label="Доступно без персоналу" /><Toggle checked={false} label="Інклюзивний доступ" /></div>
          </Card>
          <Card>
            <CardHeader title="Практичні атрибути" />
            <div className="attribute-editor"><Tag active>З дітьми 7+</Tag><Tag active>Пішки</Tag><Tag active>Паркування</Tag><Tag active>Літо</Tag><Tag active>Осінь</Tag><Tag>Зима</Tag><Tag active>Середня складність</Tag><button type="button"><Plus size={17} /> Додати тег</button></div>
          </Card>
        </div>
        <Card className="location-editor-map">
          <CardHeader title="Геопозиція" subtitle="48.4031, 24.4528" />
          <div className="mini-admin-map"><span className="map-road map-road--one" /><span className="map-river" /><button type="button" className="location-map-pin"><MapPin size={24} /></button></div>
          <div className="coordinate-fields"><label><span>Широта</span><input defaultValue="48.4031" /></label><label><span>Довгота</span><input defaultValue="24.4528" /></label></div>
          <StatusBadge tone="green"><BadgeCheck size={16} /> Координати в межах регіону</StatusBadge>
        </Card>
      </div>
    </div>
  );
}

function QrAnalytics() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="QR management" title="QR-аналітика" description="Ефективність точок входу, кампаній і контекстних сценаріїв." action={<div className="heading-actions"><button className="select-button" type="button">Останні 30 днів <ChevronDown size={18} /></button><PrimaryButton icon={<Plus size={20} />}>Нова QR-точка</PrimaryButton></div>} />
      <div className="metric-grid metric-grid--four">
        <MetricCard label="Усього сканувань" value="124 820" delta="+18,4% до попереднього" icon={<QrCode size={24} />} />
        <MetricCard label="Унікальні відкриття" value="82 416" delta="66,0% від сканувань" icon={<UsersRound size={24} />} tone="lime" />
        <MetricCard label="Активна дія" value="33 702" delta="40,9% від відкриттів" icon={<TrendingUp size={24} />} tone="blue" />
        <MetricCard label="Конверсія в покупку" value="8.4%" delta="6 924 транзакції" icon={<CircleDollarSign size={24} />} tone="neutral" />
      </div>
      <div className="qr-analytics-grid">
        <Card>
          <CardHeader title="Динаміка сканувань" subtitle="Статичні QR-точки входу" action={<div className="chart-legend"><span><i className="legend-dot legend-dot--green" /> Сканування</span><span><i className="legend-dot legend-dot--lime" /> Активні дії</span></div>} />
          <div className="line-chart-mock"><span className="line-chart-grid" /><div className="line-chart-bars">{[42, 48, 39, 54, 58, 62, 55, 68, 74, 66, 81, 78].map((value, index) => <span key={index}><i style={{ height: `${value}%` }} /><em style={{ height: `${Math.max(16, value * 0.45)}%` }} /></span>)}</div><div className="line-chart-labels"><span>16 чер</span><span>23 чер</span><span>30 чер</span><span>7 лип</span><span>15 лип</span></div></div>
        </Card>
        <Card>
          <CardHeader title="Типи точок входу" subtitle="Частка унікальних відкриттів" />
          <div className="source-breakdown">
            {[["Готелі / садиби", "42%", 42, "green"], ["Туристичні стенди", "24%", 24, "lime"], ["Вокзали / автостанції", "18%", 18, "blue"], ["Амбасадори", "10%", 10, "orange"], ["Інше", "6%", 6, "neutral"]].map(([name, value, percent, tone]) => <div key={name as string}><span className={`source-icon source-icon--${tone}`}><QrCode size={19} /></span><div><span><strong>{name as string}</strong><em>{value as string}</em></span><ProgressBar value={percent as number} /></div></div>)}
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Точки QR" subtitle="Статус, контекст і конверсія" action={<SearchField placeholder="ID, назва або локація" />} />
        <Table headers={["QR-точка", "Тип / контекст", "Регіон", "Скани", "Активні дії", "Конверсія", "Статус", ""]} columns="1.35fr 1.25fr 1fr .75fr .9fr .75fr .75fr 40px">
          {[
            ["QR‑HOT‑0184 · Коруна", "Готель · place_id 384", "Івано‑Франківська", "8 420", "3 846", "45.7%", "Активний", "green"], ["QR‑BUS‑0042 · Яремче", "Автостанція · region", "Івано‑Франківська", "6 184", "2 108", "34.1%", "Активний", "green"], ["QR‑AMB‑0288 · Марія", "Амбасадор · campaign", "Усі регіони", "1 482", "386", "26.0%", "Активний", "green"], ["QR‑HOT‑0092 · Стара вивіска", "Готель · place_id 118", "Закарпатська", "84", "8", "9.5%", "Деактивовано", "neutral"],
          ].map((row) => <TableRow key={row[0]} columns="1.35fr 1.25fr 1fr .75fr .9fr .75fr .75fr 40px"><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span>{row[4]}</span><strong>{row[5]}</strong><StatusBadge tone={row[7] as "green" | "neutral"}>{row[6]}</StatusBadge><IconButton label="Більше"><MoreHorizontal size={20} /></IconButton></TableRow>)}
        </Table>
      </Card>
    </div>
  );
}

function LedgerScreen() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Finance / immutable ledger" title="Журнал фінансових операцій" description="Записи не редагуються й не видаляються; будь-яке виправлення створюється як окреме сторнування." action={<div className="heading-actions"><SecondaryButton icon={<Download size={20} />}>Експорт statement</SecondaryButton><PrimaryButton icon={<RotateCcw size={20} />}>Створити сторно</PrimaryButton></div>} />
      <div className="ledger-balance-grid">
        <MetricCard label="Gross volume" value="4 820 640 ₴" delta="2 804 transaction entries" icon={<Banknote size={24} />} />
        <MetricCard label="Комісія платформи" value="241 032 ₴" delta="Середня ставка 5%" icon={<Percent size={24} />} tone="lime" />
        <MetricCard label="Bonus liability" value="684 280 ₴" delta="Доступні бонуси" icon={<WalletCards size={24} />} tone="blue" />
        <MetricCard label="Сторнування" value="38 420 ₴" delta="24 reversal entries" icon={<RotateCcw size={24} />} tone="orange" />
      </div>
      <Card tone="dark" className="ledger-principle"><Database size={29} /><div><strong>Незмінний журнал — єдине джерело фінансової правди</strong><p>Баланс користувача, партнера й платформи є проєкцією debit / credit entries. Пряме редагування суми або видалення запису відсутнє навіть у суперадміна.</p></div><StatusBadge tone="lime"><ShieldCheck size={16} /> Append-only</StatusBadge></Card>
      <Card className="ledger-table-card">
        <div className="table-toolbar"><SearchField placeholder="Entry ID, transaction, партнер або користувач" /><div><button type="button"><Filter size={19} /> Тип</button><button type="button"><CalendarDays size={19} /> Період</button><button type="button"><Layers3 size={19} /> Регіон</button></div></div>
        <Table headers={["Entry / transaction", "Рахунок", "Debit", "Credit", "Партнер", "Працівник", "Час", "Статус"]} columns="1.4fr 1.15fr .75fr .75fr 1fr 1fr 1fr .75fr">
          {[
            ["LE‑984201 / TRX‑24819", "user_bonus_available", "—", "+120", "Грибова хата", "Олена Бойко", "15.07 · 14:28:04", "Posted", "green"], ["LE‑984202 / TRX‑24819", "partner_receivable", "2 000 ₴", "—", "Грибова хата", "Олена Бойко", "15.07 · 14:28:04", "Posted", "green"], ["LE‑984203 / TRX‑24819", "platform_commission", "—", "120 ₴", "Грибова хата", "Олена Бойко", "15.07 · 14:28:04", "Posted", "green"], ["LE‑983904 / REV‑24755", "partner_receivable", "—", "2 400 ₴", "Коруна SPA", "Оксана Романюк", "14.07 · 18:02:11", "Reversal", "orange"],
          ].map((row) => <TableRow key={row[0]} columns="1.4fr 1.15fr .75fr .75fr 1fr 1fr 1fr .75fr"><strong>{row[0]}</strong><code>{row[1]}</code><span>{row[2]}</span><span>{row[3]}</span><span>{row[4]}</span><span>{row[5]}</span><span>{row[6]}</span><StatusBadge tone={row[8] as "green" | "orange"}>{row[7]}</StatusBadge></TableRow>)}
        </Table>
      </Card>
      <div className="ledger-bottom-grid">
        <Card>
          <CardHeader title="Схема сторнування" subtitle="REV‑24755 посилається на TRX‑24755" />
          <div className="reversal-flow"><div><span><FileCheck2 size={22} /></span><div><small>Початкова</small><strong>TRX‑24755</strong><p>+2 400 ₴ · +120 бонусів</p></div></div><ArrowRight size={24} /><div className="is-reversal"><span><RotateCcw size={22} /></span><div><small>Сторно</small><strong>REV‑24755</strong><p>−2 400 ₴ · −120 бонусів</p></div></div></div>
        </Card>
        <Card tone="soft" className="dual-approval-card"><ShieldAlert size={26} /><div><strong>Dual approval для великих сум</strong><p>Коригування понад 10 000 ₴ потребує двох різних фінансових операторів.</p></div><StatusBadge tone="orange">Політика активна</StatusBadge></Card>
      </div>
    </div>
  );
}

function ReviewModeration() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Content moderation" title="Модерація відгуків" description="Партнер може відповісти або поскаржитися, але не видалити відгук самостійно." action={<div className="heading-actions"><StatusBadge tone="orange">12 у черзі</StatusBadge><button className="select-button" type="button">Усі причини <ChevronDown size={18} /></button></div>} />
      <div className="review-moderation-layout">
        <Card className="review-queue-card">
          <CardHeader title="Черга" subtitle="За пріоритетом" />
          <div className="review-queue">
            {[
              ["#RV‑8841", "Олена В. → Садиба «Обрій»", "Скарга партнера", "18 хв", "active"], ["#RV‑8838", "Ігор Л. → Tatariv Transfer", "Ненормативна лексика", "1 год", ""], ["#RV‑8831", "Марія К. → Грибова хата", "Персональні дані", "3 год", ""], ["#RV‑8814", "Андрій М. → Коруна SPA", "Апеляція користувача", "8 год", ""],
            ].map(([id, title, reason, time, active]) => <button className={active ? "is-active" : ""} type="button" key={id}><span className="review-queue__flag"><Flag size={19} /></span><div><strong>{id}</strong><p>{title}</p><small>{reason}</small></div><span>{time}</span></button>)}
          </div>
        </Card>
        <div className="review-case">
          <Card>
            <CardHeader title="Відгук #RV‑8841" subtitle="Подано 15 липня о 09:48" action={<StatusBadge tone="green"><BadgeCheck size={16} /> Візит підтверджено</StatusBadge>} />
            <div className="review-case__author"><Avatar initials="ОВ" tone="green" size="large" /><div><strong>Олена Власюк</strong><span><Star size={16} fill="currentColor" /> 2.0 · бронювання #BK‑10314</span></div></div>
            <blockquote>«Номер був чистий, але адміністратор відмовився допомогти з раннім заселенням. У переписці мені відповіли досить грубо.»</blockquote>
            <div className="review-evidence"><button type="button"><ImageIcon size={23} /><span><strong>Фото 1</strong><small>JPG · 1,4 МБ</small></span></button><button type="button"><MessageCircle size={23} /><span><strong>Діалог</strong><small>6 повідомлень</small></span></button><button type="button"><CalendarDays size={23} /><span><strong>Бронювання</strong><small>Завершено</small></span></button></div>
          </Card>
          <Card tone="soft" className="partner-complaint"><div><Building2 size={22} /><strong>Скарга партнера</strong><StatusBadge tone="orange">Наклеп</StatusBadge></div><p>«Клієнту пояснили, що раннє заселення неможливе через зайнятість номера. Просимо видалити відгук.»</p></Card>
        </div>
        <Card className="moderation-decision-panel">
          <CardHeader title="Рішення" subtitle="Потрібна обґрунтована дія" />
          <div className="policy-checks"><div><Check size={16} /><span>Подія підтверджена</span></div><div><Check size={16} /><span>Персональних даних немає</span></div><div><Check size={16} /><span>Правила мови не порушено</span></div><div><Info size={16} /><span>Негативний досвід ≠ порушення</span></div></div>
          <button className="decision-option decision-option--keep" type="button"><CheckCircle2 size={22} /><div><strong>Залишити відгук</strong><small>Скаргу партнера відхилити</small></div></button>
          <button className="decision-option" type="button"><RefreshCcw size={22} /><div><strong>Повернути на редагування</strong><small>Якщо є конкретне порушення</small></div></button>
          <button className="decision-option decision-option--remove" type="button"><XCircle size={22} /><div><strong>Приховати</strong><small>Лише з посиланням на правило</small></div></button>
          <label className="textarea-field"><span>Обґрунтування</span><textarea defaultValue="Відгук описує суб’єктивний досвід і не порушує правил. Підтверджене бронювання наявне." /></label>
          <PrimaryButton icon={<ShieldCheck size={20} />}>Зберегти рішення</PrimaryButton>
        </Card>
      </div>
    </div>
  );
}

function AuditLog() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Security / audit" title="Журнал дій" description="Незмінна історія фінансових, рольових, модераційних і ризикових операцій." action={<SecondaryButton icon={<Download size={20} />}>Експорт CSV</SecondaryButton>} />
      <div className="audit-summary-grid"><Card tone="dark"><Fingerprint size={25} /><div><small>Подій за 24 години</small><strong>18 420</strong></div><MiniTrend values={[58, 64, 54, 70, 82, 74, 90]} tone="lime" /></Card><MetricCard label="Фінансові дії" value="2 864" delta="Усі з idempotency key" icon={<CircleDollarSign size={24} />} /><MetricCard label="Зміни ролей" value="46" delta="8 ризикових" icon={<LockKeyhole size={24} />} tone="orange" /><MetricCard label="Модераційні рішення" value="128" delta="SLA 94%" icon={<FileCheck2 size={24} />} tone="blue" /></div>
      <Card className="audit-table-card">
        <div className="table-toolbar"><SearchField placeholder="Actor, action, entity або session" /><div><button type="button"><Filter size={19} /> Категорія</button><button type="button"><ShieldAlert size={19} /> Ризик</button><button type="button"><CalendarDays size={19} /> Період</button></div></div>
        <Table headers={["Час / event ID", "Автор", "Дія", "Сутність", "Зміна", "IP / session", "Результат", ""]} columns="1.15fr 1.1fr 1.35fr 1fr 1.5fr 1.1fr .8fr 40px">
          {[
            ["10:24:18 · EV‑98422", "Олег С. · finance", "settlement.adjustment.create", "ST‑0714", "amount: 0 → +2400", "185.24.* · ss_84f", "Success", "green"], ["10:21:04 · EV‑98418", "Ірина П. · regional", "partner.approve", "PR‑1046", "pending → approved", "91.198.* · ss_a82", "Success", "green"], ["10:18:42 · EV‑98402", "System · risk", "transaction.hold", "TRX‑24812", "risk_score: 42 → 88", "10.0.* · worker", "Held", "orange"], ["10:12:16 · EV‑98386", "Андрій К. · superadmin", "user.role.update", "USR‑1842", "moderator → regional_admin", "194.44.* · ss_7c1", "2FA passed", "blue"], ["10:08:11 · EV‑98354", "Оксана Р. · partner", "booking.status.update", "BK‑10482", "pending → confirmed", "31.43.* · ss_b19", "Success", "green"],
          ].map((row) => <TableRow key={row[0]} columns="1.15fr 1.1fr 1.35fr 1fr 1.5fr 1.1fr .8fr 40px"><code>{row[0]}</code><strong>{row[1]}</strong><code>{row[2]}</code><span>{row[3]}</span><code>{row[4]}</code><span>{row[5]}</span><StatusBadge tone={row[7] as "green" | "orange" | "blue"}>{row[6]}</StatusBadge><IconButton label="Деталі"><ChevronRight size={20} /></IconButton></TableRow>)}
        </Table>
      </Card>
      <Card tone="soft" className="audit-retention-note"><ShieldCheck size={25} /><div><strong>Audit log не є звичайною історією інтерфейсу</strong><p>Записи append-only, мають кореляційний ID, actor, session, old/new values і retention policy. Видалення з адмінки відсутнє.</p></div></Card>
    </div>
  );
}

export function AmbassadorScreen({ slug }: { slug: string }) {
  return slug === "ambassador-campaigns" ? <AmbassadorCampaigns /> : <AmbassadorDashboard />;
}

export function RegionalScreen({ slug, navigate }: { slug: string; navigate: Navigate }) {
  if (slug === "regional-partners") return <RegionalPartners />;
  if (slug === "regional-content") return <RegionalContent />;
  return <RegionalDashboard navigate={navigate} />;
}

export function AdminScreen({ slug, navigate }: { slug: string; navigate: Navigate }) {
  switch (slug) {
    case "partner-moderation": return <PartnerModeration />;
    case "location-editor": return <LocationEditor />;
    case "emergency-services": return <EmergencyServicesSettings />;
    case "qr-analytics": return <QrAnalytics />;
    case "ledger": return <LedgerScreen />;
    case "review-moderation": return <ReviewModeration />;
    case "audit-log": return <AuditLog />;
    default: return <AdminDashboard navigate={navigate} />;
  }
}
