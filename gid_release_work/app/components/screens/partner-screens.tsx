"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Link2,
  ListFilter,
  MessageSquareText,
  MoreHorizontal,
  Percent,
  Phone,
  Plus,
  QrCode,
  RefreshCcw,
  ScanLine,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Upload,
  UsersRound,
  WalletCards,
  Waves,
  X,
} from "lucide-react";
import type { RoleKey } from "../../lib/navigation";
import {
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
  SelectLike,
  StatusBadge,
  Table,
  TableRow,
  TimeBadge,
  Toggle,
} from "../ui";

type Navigate = (role: RoleKey, slug: string) => void;

function PartnerDashboard({ navigate }: { navigate: Navigate }) {
  return (
    <div className="screen-stack">
      <PageHeading
        eyebrow="Середа, 15 липня"
        title="Доброго ранку, Оксано"
        description="Коруна SPA · Татарів · дані оновлено щойно"
        action={
          <div className="heading-actions">
            <IconButton label="Сповіщення">
              <Bell size={23} />
            </IconButton>
            <PrimaryButton onClick={() => navigate("partner", "scanner")} icon={<ScanLine size={20} />}>
              Сканувати QR
            </PrimaryButton>
          </div>
        }
      />

      <div className="metric-grid metric-grid--four">
        <MetricCard label="Бронювання сьогодні" value="18" delta="+4 до вчора" icon={<CalendarCheck size={24} />} />
        <MetricCard label="Підтверджений виторг" value="42 680 ₴" delta="+12,4% за тиждень" icon={<TrendingUp size={24} />} tone="lime" />
        <MetricCard label="QR-операції" value="24" delta="Середній чек 1 778 ₴" icon={<QrCode size={24} />} tone="blue" />
        <MetricCard label="Рейтинг" value="4.9" delta="328 перевірених відгуків" icon={<Star size={24} />} tone="neutral" />
      </div>

      <div className="dashboard-grid dashboard-grid--main">
        <Card className="revenue-card">
          <CardHeader
            title="Операції за 7 днів"
            subtitle="Підтверджені покупки через QR"
            action={
              <button className="select-button" type="button">
                7 днів <ChevronDown size={18} />
              </button>
            }
          />
          <div className="revenue-summary">
            <div>
              <small>Загальна сума</small>
              <strong>284 560 ₴</strong>
              <span className="positive-value">
                <ArrowUpRight size={17} /> 18,2%
              </span>
            </div>
            <div className="chart-legend">
              <span>
                <i className="legend-dot legend-dot--green" /> Поточний тиждень
              </span>
              <span>
                <i className="legend-dot legend-dot--muted" /> Попередній
              </span>
            </div>
          </div>
          <div className="bar-chart bar-chart--revenue" aria-label="Виторг за сім днів">
            {[46, 63, 52, 78, 67, 91, 82].map((value, index) => (
              <div key={`${value}-${index}`}>
                <span style={{ height: `${value}%` }}>
                  {index === 5 ? <em>56,2k</em> : null}
                </span>
                <small>{["Чт", "Пт", "Сб", "Нд", "Пн", "Вт", "Ср"][index]}</small>
              </div>
            ))}
          </div>
        </Card>

        <Card className="today-card">
          <CardHeader
            title="Завантаження ресурсів"
            subtitle="Сьогодні"
            action={<button type="button" onClick={() => navigate("partner", "calendar")}>Календар</button>}
          />
          <div className="resource-load-list">
            {[
              ["Чан №1", "8 із 10 слотів", 80, "green"],
              ["Чан №2", "6 із 10 слотів", 60, "lime"],
              ["SPA-кімната", "5 із 8 слотів", 63, "blue"],
              ["Масажист Марія", "7 із 8 слотів", 88, "orange"],
            ].map(([name, meta, value, tone]) => (
              <div className="resource-load" key={name as string}>
                <div>
                  <span className={`resource-dot resource-dot--${tone}`} />
                  <strong>{name as string}</strong>
                  <small>{meta as string}</small>
                </div>
                <ProgressBar value={value as number} />
              </div>
            ))}
          </div>
          <div className="occupancy-footer">
            <span>
              <strong>74%</strong>
              <small>середня зайнятість</small>
            </span>
            <MiniTrend values={[52, 60, 54, 75, 68, 84, 74]} />
          </div>
        </Card>
      </div>

      <div className="dashboard-grid dashboard-grid--bottom">
        <Card>
          <CardHeader
            title="Найближчі бронювання"
            subtitle="Наступні дві години"
            action={<button type="button" onClick={() => navigate("partner", "calendar")}>Усі бронювання</button>}
          />
          <div className="upcoming-bookings">
            {[
              ["15:30", "Марина Коваль", "Чан №1 · 4 гості", "Підтверджено", "green"],
              ["16:00", "Ігор Левченко", "Масаж · 1 гість", "Очікує", "orange"],
              ["16:30", "Олена Власюк", "SPA для двох", "Підтверджено", "green"],
            ].map(([time, name, service, status, tone]) => (
              <button type="button" key={time as string} onClick={() => navigate("partner", "booking-details")}>
                <TimeBadge>{time as string}</TimeBadge>
                <Avatar initials={(name as string).split(" ").map((part) => part[0]).join("")} tone={tone === "orange" ? "orange" : "green"} />
                <div>
                  <strong>{name as string}</strong>
                  <small>{service as string}</small>
                </div>
                <StatusBadge tone={tone as "green" | "orange"}>{status as string}</StatusBadge>
                <ChevronRight size={20} />
              </button>
            ))}
          </div>
        </Card>
        <Card tone="dark" className="partner-balance-card">
          <div className="partner-balance-card__top">
            <span>
              <WalletCards size={23} /> Баланс взаєморозрахунків
            </span>
            <button type="button" aria-label="Переглянути">
              <Eye size={22} />
            </button>
          </div>
          <div>
            <small>До виплати платформі</small>
            <strong>12 480 ₴</strong>
            <span>за 01–15 липня</span>
          </div>
          <button type="button" onClick={() => navigate("partner", "partner-finance")}>
            Відкрити фінанси <ArrowRight size={19} />
          </button>
        </Card>
      </div>
    </div>
  );
}

function ScannerScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="screen-stack scanner-layout">
      <PageHeading
        eyebrow="Партнерський режим · Касир"
        title="Сканер QR клієнта"
        description="Коруна SPA · зміна #148 · Олена Бойко"
        action={<StatusBadge tone="green" dot>Камера доступна</StatusBadge>}
      />
      <div className="scanner-grid">
        <Card tone="dark" className="scanner-camera-card">
          <div className="scanner-camera-card__top">
            <span>
              <ScanLine size={23} /> Сканування
            </span>
            <button type="button">
              <Camera size={22} /> Змінити камеру
            </button>
          </div>
          <div className="scanner-camera">
            <span className="scanner-corner scanner-corner--tl" />
            <span className="scanner-corner scanner-corner--tr" />
            <span className="scanner-corner scanner-corner--bl" />
            <span className="scanner-corner scanner-corner--br" />
            <i className="scanner-line" />
            <QrCode size={91} strokeWidth={1.3} />
          </div>
          <h2>Наведіть камеру на QR клієнта</h2>
          <p>Код має бути згенерований у розділі «Мій QR» і діяти не більше 60 секунд.</p>
          <button className="scanner-manual" type="button">
            <Link2 size={19} /> Ввести код вручну
          </button>
        </Card>
        <div className="scanner-side">
          <Card>
            <CardHeader title="Перед операцією" subtitle="Швидка перевірка безпеки" />
            <div className="scanner-checklist">
              {[
                "QR показує сам клієнт",
                "Код активний і не використаний",
                "Сума буде показана клієнту",
                "Операція створиться лише після підтвердження",
              ].map((item) => (
                <div key={item}>
                  <span><Check size={16} /></span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card tone="lime" className="scanner-demo-card">
            <span><Sparkles size={25} /></span>
            <div>
              <strong>QR клієнта зчитано</strong>
              <p>Код активний. Перейдіть до введення суми операції.</p>
            </div>
            <PrimaryButton onClick={() => navigate("partner", "new-operation")} icon={<ArrowRight size={20} />}>
              Продовжити
            </PrimaryButton>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NewOperationScreen({ navigate }: { navigate: Navigate }) {
  const [spend, setSpend] = useState(true);
  return (
    <div className="screen-stack operation-screen">
      <PageHeading
        eyebrow="QR успішно перевірено"
        title="Нова операція"
        description="Токен дійсний ще 38 секунд · повторне використання заблоковано"
        action={<StatusBadge tone="green"><BadgeCheck size={16} /> Клієнта знайдено</StatusBadge>}
      />
      <div className="operation-grid">
        <div className="operation-main">
          <Card className="customer-found-card">
            <Avatar initials="АМ" tone="green" size="large" />
            <div>
              <small>Клієнт</small>
              <h2>Андрій Мазка</h2>
              <span>@andrii_travel · учасник з 2026</span>
            </div>
            <div className="customer-balance">
              <small>Доступно</small>
              <strong>1 280</strong>
              <span>бонусів</span>
            </div>
          </Card>
          <Card>
            <CardHeader title="Дані операції" subtitle="Перевірте суму перед надсиланням клієнту" />
            <div className="operation-form">
              <label className="amount-field">
                <span>Сума чека</span>
                <div>
                  <input aria-label="Сума чека" defaultValue="2400.00" />
                  <strong>₴</strong>
                </div>
              </label>
              <SelectLike label="Категорія операції" value="Послуги SPA" />
              <SelectLike label="Працівник" value="Олена Бойко · касир" />
            </div>
            <div className="bonus-toggle-row">
              <Toggle checked={spend} label="Дозволити списання бонусів" />
              <button type="button" onClick={() => setSpend(!spend)}>
                {spend ? "Вимкнути" : "Увімкнути"}
              </button>
            </div>
            {spend ? (
              <label className="bonus-spend-field">
                <span>Списати бонусів</span>
                <div>
                  <button type="button"><ChevronLeft size={19} /></button>
                  <input aria-label="Списати бонусів" defaultValue="400" />
                  <button type="button"><ChevronRight size={19} /></button>
                </div>
                <small>Максимум 20% чека · доступно 1 280</small>
              </label>
            ) : null}
          </Card>
        </div>
        <Card tone="soft" className="operation-summary-card">
          <CardHeader title="Попередній розрахунок" subtitle="Quote не змінює баланс" />
          <div className="operation-summary-merchant">
            <span><Waves size={25} /></span>
            <div>
              <strong>Коруна SPA</strong>
              <small>Партнер · Татарів</small>
            </div>
          </div>
          <div className="operation-summary-lines">
            <div><span>Сума чека</span><strong>2 400,00 ₴</strong></div>
            <div><span>Списання бонусів</span><strong>−400,00 ₴</strong></div>
            <div><span>До сплати</span><strong>2 000,00 ₴</strong></div>
            <div><span>Нарахування 5%</span><strong className="positive-value">+120 бонусів</strong></div>
            <div><span>Комісія платформи</span><strong>120,00 ₴</strong></div>
          </div>
          <Card tone="lime" className="operation-note">
            <ShieldCheck size={22} />
            <p>Після підтвердження клієнтом створяться transaction, bonus entries і settlement entries.</p>
          </Card>
          <PrimaryButton onClick={() => navigate("partner", "partner-dashboard")} icon={<Send size={20} />}>
            Надіслати на підтвердження
          </PrimaryButton>
          <button className="button button--danger-ghost" type="button">Скасувати операцію</button>
        </Card>
      </div>
    </div>
  );
}

const calendarResources = [
  { name: "Чан №1", color: "green" },
  { name: "Чан №2", color: "lime" },
  { name: "SPA-кімната", color: "blue" },
  { name: "Масажист", color: "orange" },
];

const calendarBookings = [
  { resource: 0, start: 1, span: 2, name: "Марина Коваль", meta: "4 гості", tone: "green" },
  { resource: 1, start: 0, span: 2, name: "Іван Петренко", meta: "6 гостей", tone: "lime" },
  { resource: 2, start: 2, span: 2, name: "Олена Власюк", meta: "2 гості", tone: "blue" },
  { resource: 3, start: 3, span: 1, name: "Ігор Левченко", meta: "60 хв", tone: "orange" },
  { resource: 0, start: 5, span: 2, name: "Андрій Мазка", meta: "2 гості", tone: "green" },
  { resource: 1, start: 4, span: 2, name: "Ручний запис", meta: "закритий слот", tone: "neutral" },
];

function CalendarScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="screen-stack calendar-screen">
      <PageHeading
        eyebrow="Бронювання"
        title="Календар ресурсів"
        description="Коруна SPA · середа, 15 липня"
        action={
          <div className="heading-actions">
            <button className="select-button" type="button">День <ChevronDown size={18} /></button>
            <PrimaryButton icon={<Plus size={20} />}>Ручне бронювання</PrimaryButton>
          </div>
        }
      />
      <Card className="calendar-toolbar-card">
        <div className="calendar-nav">
          <button type="button"><ChevronLeft size={22} /></button>
          <div><strong>15 липня 2026</strong><small>Середа · сьогодні</small></div>
          <button type="button"><ChevronRight size={22} /></button>
          <button type="button" className="today-button">Сьогодні</button>
        </div>
        <div className="calendar-filters">
          <button type="button"><Filter size={19} /> 4 ресурси</button>
          <button type="button"><ListFilter size={19} /> Усі статуси</button>
        </div>
      </Card>
      <Card className="resource-calendar-card">
        <div className="resource-calendar">
          <div className="resource-calendar__corner">Ресурс</div>
          {["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"].map((time) => (
            <div className="resource-calendar__time" key={time}>{time}</div>
          ))}
          {calendarResources.map((resource, resourceIndex) => (
            <div className="resource-calendar__row" key={resource.name}>
              <div className="resource-calendar__resource">
                <span className={`resource-dot resource-dot--${resource.color}`} />
                <strong>{resource.name}</strong>
                <small>{resourceIndex < 2 ? "buffer 30 хв" : "buffer 15 хв"}</small>
              </div>
              <div className="resource-calendar__slots">
                {Array.from({ length: 8 }).map((_, index) => <span key={index} />)}
                {calendarBookings.filter((booking) => booking.resource === resourceIndex).map((booking) => (
                  <button
                    key={`${booking.name}-${booking.start}`}
                    type="button"
                    className={`calendar-booking calendar-booking--${booking.tone}`}
                    style={{ gridColumn: `${booking.start + 1} / span ${booking.span}` }}
                    onClick={() => navigate("partner", "booking-details")}
                  >
                    <strong>{booking.name}</strong>
                    <small>{booking.meta}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <span className="calendar-now-line" />
        </div>
      </Card>
      <div className="calendar-summary-grid">
        <Card><span className="summary-icon summary-icon--green"><CalendarCheck size={23} /></span><div><small>Підтверджено</small><strong>14</strong></div></Card>
        <Card><span className="summary-icon summary-icon--orange"><Clock3 size={23} /></span><div><small>Очікує</small><strong>3</strong></div></Card>
        <Card><span className="summary-icon summary-icon--blue"><Plus size={23} /></span><div><small>Ручні записи</small><strong>5</strong></div></Card>
        <Card><span className="summary-icon summary-icon--neutral"><RefreshCcw size={23} /></span><div><small>Перенесено</small><strong>1</strong></div></Card>
      </div>
    </div>
  );
}

function BookingDetailsScreen() {
  return (
    <div className="screen-stack">
      <PageHeading
        eyebrow="Бронювання #BK‑10482"
        title="Карпатський чан №1"
        description="Створено клієнтом 15 липня о 09:42"
        action={<StatusBadge tone="green" dot>Підтверджено</StatusBadge>}
      />
      <div className="booking-details-grid">
        <div className="booking-details-main">
          <Card className="booking-customer-card">
            <CardHeader title="Клієнт" subtitle="Контактні дані передано за згодою" />
            <div className="customer-profile-row">
              <Avatar initials="АМ" tone="green" size="large" />
              <div><strong>Андрій Мазка</strong><span>@andrii_travel</span></div>
              <button type="button"><Phone size={20} /> +380 67 123 45 67</button>
              <IconButton label="Написати"><MessageSquareText size={22} /></IconButton>
            </div>
          </Card>
          <Card>
            <CardHeader title="Деталі бронювання" />
            <div className="booking-detail-fields">
              <div><span><CalendarDays size={20} /></span><small>Дата</small><strong>15 липня 2026</strong></div>
              <div><span><Clock3 size={20} /></span><small>Час</small><strong>18:00–20:00</strong></div>
              <div><span><Waves size={20} /></span><small>Ресурс</small><strong>Чан №1</strong></div>
              <div><span><UsersRound size={20} /></span><small>Гості</small><strong>2 дорослих</strong></div>
            </div>
            <div className="booking-comment"><strong>Коментар клієнта</strong><p>Підготуйте, будь ласка, чай без цукру. Будемо на 10 хвилин раніше.</p></div>
          </Card>
          <Card>
            <CardHeader title="Історія статусів" />
            <div className="status-history">
              <div><span><Check size={16} /></span><div><strong>Підтверджено партнером</strong><p>Оксана Романюк · 10:04</p></div></div>
              <div><span><Check size={16} /></span><div><strong>Створено клієнтом</strong><p>Telegram Mini App · 09:42</p></div></div>
            </div>
          </Card>
        </div>
        <div className="booking-details-side">
          <Card tone="dark" className="booking-price-card">
            <small>Вартість бронювання</small>
            <strong>2 400 ₴</strong>
            <span>Оплата на місці</span>
            <div><span>Завдаток</span><strong>Не потрібен</strong></div>
          </Card>
          <Card>
            <CardHeader title="Дії" />
            <div className="booking-actions-list">
              <button type="button"><CalendarDays size={20} /> Перенести бронювання <ChevronRight size={19} /></button>
              <button type="button"><RefreshCcw size={20} /> Запропонувати інший час <ChevronRight size={19} /></button>
              <button type="button"><MessageSquareText size={20} /> Написати клієнту <ChevronRight size={19} /></button>
              <button type="button" className="is-danger"><X size={20} /> Скасувати бронювання <ChevronRight size={19} /></button>
            </div>
          </Card>
          <Card tone="lime" className="conflict-free-card"><ShieldCheck size={23} /><div><strong>Конфліктів немає</strong><p>Buffer 30 хв до і після слота збережено.</p></div></Card>
        </div>
      </div>
    </div>
  );
}

function PlaceEditorScreen() {
  const [tab, setTab] = useState("Основне");
  return (
    <div className="screen-stack editor-screen">
      <PageHeading
        eyebrow="Редактор закладу"
        title="Коруна SPA"
        description="Шаблон: чан / сауна · востаннє оновлено сьогодні о 10:12"
        action={<div className="heading-actions"><SecondaryButton icon={<Eye size={20} />}>Попередній перегляд</SecondaryButton><PrimaryButton icon={<Check size={20} />}>Зберегти зміни</PrimaryButton></div>}
      />
      <div className="editor-status-bar">
        <div><StatusBadge tone="green" dot>Опубліковано</StatusBadge><span>Повнота профілю 86%</span></div>
        <ProgressBar value={86} />
      </div>
      <div className="editor-layout">
        <Card className="editor-tabs-card">
          {[
            ["Основне", Store], ["Медіа", ImageIcon], ["Графік", Clock3], ["Послуги", Sparkles], ["Ресурси", Waves], ["Бонуси", Percent], ["Контакти", Phone],
          ].map(([label, Icon]) => {
            const TabIcon = Icon as typeof Store;
            return <button className={tab === label ? "is-active" : ""} type="button" key={label as string} onClick={() => setTab(label as string)}><TabIcon size={22} />{label as string}<ChevronRight size={18} /></button>;
          })}
        </Card>
        <div className="editor-content">
          <Card>
            <CardHeader title="Основна інформація" subtitle="Ці дані бачить турист у картці місця" />
            <div className="editor-form-grid">
              <label className="text-field"><span>Назва закладу</span><input defaultValue="Коруна SPA" /></label>
              <label className="text-field"><span>Категорія</span><input defaultValue="Чани та SPA" /></label>
              <label className="text-field text-field--full"><span>Короткий опис</span><textarea defaultValue="Карпатські чани, SPA-програми та масаж у готелі «Коруна» з видом на гори." /><small>91 / 180</small></label>
              <label className="text-field"><span>Середній чек</span><input defaultValue="2400 ₴" /></label>
              <label className="text-field"><span>Мови обслуговування</span><input defaultValue="Українська, English" /></label>
            </div>
          </Card>
          <Card>
            <CardHeader title="Головне фото" subtitle="Рекомендований формат 16:9, до 10 МБ" />
            <div className="image-editor-row">
              <span className="image-editor-preview"><Waves size={35} /></span>
              <div><strong>koruna-spa-cover.jpg</strong><small>1920 × 1080 · 1,8 МБ</small><span><button type="button"><Upload size={18} /> Замінити</button><button type="button" className="is-danger"><X size={18} /> Видалити</button></span></div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Практичні атрибути" subtitle="Допомагають пошуку та фільтрації" />
            <div className="toggle-grid">
              <Toggle checked label="Паркування" /><Toggle checked label="З дітьми" /><Toggle checked label="Домашні тварини" /><Toggle checked={false} label="Інклюзивність" /><Toggle checked label="Працюємо взимку" /><Toggle checked label="Wi‑Fi" />
            </div>
          </Card>
        </div>
        <Card className="editor-preview-card">
          <CardHeader title="Як бачить турист" subtitle="Мобільна картка" />
          <div className="mini-place-preview">
            <span className="mini-place-preview__art"><StatusBadge tone="lime">Партнер</StatusBadge></span>
            <div><small>Чани та SPA</small><h3>Коруна SPA</h3><p><Star size={14} fill="currentColor" /> 4.9 · Татарів</p><StatusBadge tone="green" dot>Відкрито до 21:00</StatusBadge></div>
          </div>
          <button type="button" className="text-button">Відкрити повний preview <ArrowRight size={18} /></button>
        </Card>
      </div>
    </div>
  );
}

function ReviewsOffersScreen() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Репутація та попит" title="Відгуки й акції" description="Відповідайте гостям і заповнюйте вільні слоти без прихованої реклами." action={<PrimaryButton icon={<Plus size={20} />}>Створити акцію</PrimaryButton>} />
      <div className="metric-grid metric-grid--four">
        <MetricCard label="Середній рейтинг" value="4.9" delta="+0,1 за місяць" icon={<Star size={24} />} />
        <MetricCard label="Нові відгуки" value="18" delta="5 без відповіді" icon={<MessageSquareText size={24} />} tone="orange" />
        <MetricCard label="Активні акції" value="3" delta="1 завершується сьогодні" icon={<Sparkles size={24} />} tone="lime" />
        <MetricCard label="Конверсія акцій" value="12.8%" delta="84 бронювання" icon={<TrendingUp size={24} />} tone="blue" />
      </div>
      <div className="reviews-offers-grid">
        <Card>
          <CardHeader title="Останні відгуки" subtitle="Тільки після підтвердженої події" action={<button type="button">Усі відгуки</button>} />
          <div className="review-admin-list">
            {[
              ["Андрій Мазка", "5.0", "Дуже атмосферно, чан підготували вчасно. Окрема подяка за чай!", "Сьогодні · покупка #24819", true],
              ["Марина Коваль", "4.0", "Все сподобалося, але чекали рушники приблизно 10 хвилин.", "Учора · бронювання #10451", false],
              ["Ігор Левченко", "5.0", "Чудовий масаж і дуже привітний персонал.", "13 липня · бронювання #10398", true],
            ].map(([name, rating, text, meta, answered]) => (
              <article key={name as string}>
                <div className="review-admin-list__head"><Avatar initials={(name as string).split(" ").map((p) => p[0]).join("")} /><div><strong>{name as string}</strong><span><Star size={14} fill="currentColor" /> {rating as string}</span></div><StatusBadge tone="green"><BadgeCheck size={14} /> Перевірений</StatusBadge></div>
                <p>{text as string}</p><small>{meta as string}</small>
                <button type="button">{answered ? "Переглянути відповідь" : "Відповісти"} <ArrowRight size={17} /></button>
              </article>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Активні пропозиції" subtitle="Прозоро позначаються як партнерські" />
          <div className="offer-list">
            {[
              ["−15% на слот о 16:00", "Чан №2 · сьогодні", "18 переглядів · 2 бронювання", "До 15:30", "lime"],
              ["SPA для двох + чай", "SPA-кімната · будні", "126 переглядів · 14 бронювань", "До 31.07", "green"],
              ["+10% бонусами", "Усі послуги · нові клієнти", "84 операції", "До 20.07", "blue"],
            ].map(([title, meta, stat, date, tone]) => (
              <div key={title as string} className="offer-row"><span className={`offer-row__icon offer-row__icon--${tone}`}><Percent size={22} /></span><div><strong>{title as string}</strong><small>{meta as string}</small><p>{stat as string}</p></div><div><StatusBadge tone={tone as "green" | "lime" | "blue"}>{date as string}</StatusBadge><button type="button"><MoreHorizontal size={22} /></button></div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PartnerFinanceScreen() {
  return (
    <div className="screen-stack">
      <PageHeading eyebrow="Фінанси партнера" title="Взаєморозрахунки" description="Коруна SPA · звітний період 01–15 липня 2026" action={<div className="heading-actions"><button className="select-button" type="button">01–15 липня <ChevronDown size={18} /></button><SecondaryButton icon={<FileText size={20} />}>Експорт</SecondaryButton></div>} />
      <div className="finance-balance-grid">
        <Card tone="dark" className="finance-main-balance"><span><WalletCards size={24} /> Поточне сальдо</span><strong>−12 480 ₴</strong><p>Партнер винен платформі</p><div><small>Наступний розрахунок</small><strong>20 липня 2026</strong></div></Card>
        <MetricCard label="Підтверджені продажі" value="284 560 ₴" delta="160 QR-операцій" icon={<CreditCard size={24} />} />
        <MetricCard label="Комісія платформи" value="14 228 ₴" delta="Середня ставка 5%" icon={<Percent size={24} />} tone="orange" />
        <MetricCard label="Компенсація бонусів" value="1 748 ₴" delta="За використані бонуси" icon={<CircleDollarSign size={24} />} tone="lime" />
      </div>
      <div className="finance-grid">
        <Card>
          <CardHeader title="Рух за період" subtitle="Зведення без зміни початкових операцій" />
          <div className="settlement-breakdown">
            <div><span><i className="legend-dot legend-dot--green" /> Продажі через QR</span><strong>+284 560 ₴</strong></div>
            <div><span><i className="legend-dot legend-dot--orange" /> Комісія платформи</span><strong>−14 228 ₴</strong></div>
            <div><span><i className="legend-dot legend-dot--lime" /> Компенсація списаних бонусів</span><strong>+1 748 ₴</strong></div>
            <div><span><i className="legend-dot legend-dot--blue" /> Повернення / сторно</span><strong>−2 400 ₴</strong></div>
            <div className="settlement-breakdown__total"><span>До сплати платформі</span><strong>12 480 ₴</strong></div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Статус розрахунку" subtitle="Період закриває фінансовий оператор" />
          <div className="settlement-status">
            <div className="settlement-status__progress"><span className="is-done"><Check size={16} /></span><i /><span className="is-done"><Check size={16} /></span><i /><span>3</span></div>
            <div className="settlement-status__labels"><span><strong>Період завершено</strong><small>15 липня</small></span><span><strong>Звірка операцій</strong><small>До 18 липня</small></span><span><strong>Оплата</strong><small>До 20 липня</small></span></div>
          </div>
          <Card tone="lime" className="settlement-document"><FileText size={24} /><div><strong>Statement #ST‑2026‑0715</strong><p>Буде доступний після звірки</p></div><StatusBadge tone="orange">Формується</StatusBadge></Card>
        </Card>
      </div>
      <Card>
        <CardHeader title="Останні фінансові операції" subtitle="Кожен рядок має посилання на transaction і працівника" action={<SearchField placeholder="ID або клієнт" />} />
        <Table headers={["Операція", "Дата / працівник", "Сума", "Бонуси", "Комісія", "Статус"]} columns="1.5fr 1.25fr .8fr .8fr .8fr .75fr">
          {[
            ["#TRX‑24819 · Андрій Мазка", "15.07, 14:28 · Олена Бойко", "2 400 ₴", "−400 / +120", "120 ₴", "Підтверджено", "green"],
            ["#TRX‑24804 · Марина Коваль", "15.07, 12:14 · Ігор Лис", "3 200 ₴", "+160", "160 ₴", "Підтверджено", "green"],
            ["#REV‑24755 · Олена Власюк", "14.07, 18:02 · Оксана Романюк", "−2 400 ₴", "Сторно", "−120 ₴", "Повернення", "orange"],
          ].map((row) => <TableRow key={row[0]} columns="1.5fr 1.25fr .8fr .8fr .8fr .75fr"><strong>{row[0]}</strong><span>{row[1]}</span><strong>{row[2]}</strong><span>{row[3]}</span><span>{row[4]}</span><StatusBadge tone={row[6] as "green" | "orange"}>{row[5]}</StatusBadge></TableRow>)}
        </Table>
      </Card>
    </div>
  );
}

export function PartnerScreen({ slug, navigate }: { slug: string; navigate: Navigate }) {
  switch (slug) {
    case "partner-dashboard": return <PartnerDashboard navigate={navigate} />;
    case "scanner": return <ScannerScreen navigate={navigate} />;
    case "new-operation": return <NewOperationScreen navigate={navigate} />;
    case "calendar": return <CalendarScreen navigate={navigate} />;
    case "booking-details": return <BookingDetailsScreen />;
    case "place-editor": return <PlaceEditorScreen />;
    case "reviews-offers": return <ReviewsOffersScreen />;
    case "partner-finance": return <PartnerFinanceScreen />;
    default: return <PartnerDashboard navigate={navigate} />;
  }
}
