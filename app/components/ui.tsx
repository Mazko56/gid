"use client";

import { Children, createContext, useContext, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  MoreHorizontal,
  Search,
} from "lucide-react";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="page-heading__action">{action}</div> : null}
    </header>
  );
}

export function Card({
  children,
  className = "",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "soft" | "dark" | "lime";
}) {
  return (
    <section className={`card card--${tone} ${className}`.trim()}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  icon,
  tone = "green",
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
  tone?: "green" | "lime" | "blue" | "neutral" | "orange";
}) {
  return (
    <Card className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top">
        <span className="metric-card__label">{label}</span>
        {icon ? <span className="metric-card__icon">{icon}</span> : null}
      </div>
      <strong>{value}</strong>
      {delta ? <small>{delta}</small> : null}
    </Card>
  );
}

export function PrimaryButton({
  children,
  onClick,
  icon,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`button button--primary ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
      {icon ?? <ArrowUpRight size={20} strokeWidth={2.2} />}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  icon,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`button button--secondary ${className}`.trim()}
      onClick={onClick}
    >
      <span>{children}</span>
      {icon ?? <ChevronRight size={20} />}
    </button>
  );
}

export function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="icon-button"
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function StatusBadge({
  children,
  tone = "green",
  dot = false,
}: {
  children: ReactNode;
  tone?: "green" | "lime" | "orange" | "blue" | "red" | "neutral";
  dot?: boolean;
}) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {dot ? <i aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function SearchField({ placeholder = "Пошук" }: { placeholder?: string }) {
  return (
    <label className="search-field">
      <Search size={22} />
      <input aria-label={placeholder} placeholder={placeholder} />
    </label>
  );
}

export function Tag({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button className={`tag ${active ? "is-active" : ""}`} type="button">
      {children}
    </button>
  );
}

export function RowLink({
  icon,
  title,
  subtitle,
  value,
  onClick,
  leadingTone = "green",
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value?: ReactNode;
  onClick?: () => void;
  leadingTone?: "green" | "lime" | "orange" | "blue" | "red" | "neutral";
}) {
  return (
    <button className="row-link" type="button" onClick={onClick}>
      {icon ? (
        <span className={`row-link__icon row-link__icon--${leadingTone}`}>
          {icon}
        </span>
      ) : null}
      <span className="row-link__copy">
        <strong>{title}</strong>
        {subtitle ? <small>{subtitle}</small> : null}
      </span>
      {value ? <span className="row-link__value">{value}</span> : null}
      <ChevronRight className="row-link__chevron" size={20} />
    </button>
  );
}

export function Avatar({
  initials,
  tone = "green",
  size = "medium",
}: {
  initials: string;
  tone?: "green" | "lime" | "orange" | "blue" | "neutral";
  size?: "small" | "medium" | "large";
}) {
  return (
    <span className={`avatar avatar--${tone} avatar--${size}`}>{initials}</span>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress-wrap">
      {label ? (
        <div className="progress-label">
          <span>{label}</span>
          <strong>{value}%</strong>
        </div>
      ) : null}
      <span className="progress-bar">
        <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </span>
    </div>
  );
}

export function MiniTrend({
  values,
  tone = "green",
}: {
  values: number[];
  tone?: "green" | "lime" | "blue" | "orange";
}) {
  const maximum = Math.max(...values, 1);
  return (
    <div className={`mini-trend mini-trend--${tone}`} aria-label="Діаграма">
      {values.map((value, index) => (
        <i
          key={`${value}-${index}`}
          style={{ height: `${Math.max(12, (value / maximum) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function TimelineItem({
  time,
  title,
  description,
  state = "done",
  children,
}: {
  time: string;
  title: string;
  description: string;
  state?: "done" | "active" | "upcoming";
  children?: ReactNode;
}) {
  return (
    <div className={`timeline-item timeline-item--${state}`}>
      <span className="timeline-item__time">{time}</span>
      <span className="timeline-item__marker">
        {state === "done" ? <Check size={14} /> : null}
      </span>
      <div className="timeline-item__content">
        <strong>{title}</strong>
        <p>{description}</p>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Table({
  headers,
  children,
  columns,
}: {
  headers: string[];
  children: ReactNode;
  columns?: string;
}) {
  return (
    <div className="data-table-wrap">
      <div
        className="data-table data-table__head"
        style={{ gridTemplateColumns: columns }}
      >
        {headers.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>
      <TableHeadersContext.Provider value={headers}>
        <div className="data-table__body">{children}</div>
      </TableHeadersContext.Provider>
    </div>
  );
}

const TableHeadersContext = createContext<string[]>([]);

export function TableRow({
  children,
  columns,
}: {
  children: ReactNode;
  columns?: string;
}) {
  const headers = useContext(TableHeadersContext);

  return (
    <div className="data-table data-table__row" style={{ gridTemplateColumns: columns }}>
      {Children.map(children, (child, index) => (
        <div className="data-table__cell" data-label={headers[index] ?? ""}>
          {child}
        </div>
      ))}
    </div>
  );
}

export function Toggle({ checked = true, label }: { checked?: boolean; label: string }) {
  return (
    <span className="toggle-field">
      <span className={`toggle ${checked ? "is-checked" : ""}`} aria-hidden="true">
        <i />
      </span>
      <span>{label}</span>
    </span>
  );
}

export function SelectLike({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="field-like">
      <span>{label}</span>
      <strong>{value}</strong>
      <ChevronRight size={20} />
    </label>
  );
}

export function ActivityRow({
  title,
  meta,
  status,
  tone = "green",
}: {
  title: string;
  meta: string;
  status: string;
  tone?: "green" | "lime" | "orange" | "blue" | "red" | "neutral";
}) {
  return (
    <div className="activity-row">
      <span className={`activity-row__dot activity-row__dot--${tone}`} />
      <div>
        <strong>{title}</strong>
        <p>{meta}</p>
      </div>
      <StatusBadge tone={tone}>{status}</StatusBadge>
      <button type="button" aria-label="Більше">
        <MoreHorizontal size={23} />
      </button>
    </div>
  );
}

export function TimeBadge({ children }: { children: ReactNode }) {
  return (
    <span className="time-badge">
      <Clock3 size={17} />
      {children}
    </span>
  );
}
