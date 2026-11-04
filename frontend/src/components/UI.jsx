import { useEffect, useId, useRef } from "react";
import { AlertTriangle, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function StatTile({ label, value, sub, icon: Icon, color = "var(--c1)", testid }) {
  return (
    <div
      className="kpi-tile clay-card clay-hover p-5 relative overflow-hidden"
      style={{ "--t": color }}
      data-testid={testid}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 tracking-wide font-sans">{label}</div>
          <div className="num break-words text-2xl font-extrabold text-slate-900 mt-2 leading-none tracking-tight sm:text-3xl">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-2 font-sans">{sub}</div>}
        </div>
        {Icon && (
          <div className="clay-orb h-11 w-11">
            <Icon className="w-5 h-5" strokeWidth={2.2} />
          </div>
        )}
      </div>
    </div>
  );
}

export function Card({ title, action, children, testid, className = "" }) {
  return (
    <div className={`clay-card ${className}`} data-testid={testid}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-1 sm:px-5">
          {title && <h3 className="min-w-0 font-heading font-extrabold text-slate-900 text-[17px] tracking-tight">{title}</h3>}
          {action && <div className="flex min-w-0 flex-wrap items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-4 sm:p-5 ${title || action ? "pt-3 sm:pt-3" : ""}`}>{children}</div>
    </div>
  );
}

const STATUS_MAP = {
  paid: "badge-green",
  unpaid: "badge-amber",
  overdue: "badge-red",
  partial: "badge-blue",
  active: "badge-green",
  inactive: "badge-gray",
  suspended: "badge-red",
  graduated: "badge-blue",
  pending: "badge-amber",
  approved: "badge-green",
  rejected: "badge-red",
  present: "badge-green",
  late: "badge-amber",
  absent: "badge-red",
  excused: "badge-gray",
  full_time: "badge-blue",
  part_time: "badge-purple",
  freelance: "badge-amber",
  contract: "badge-gray",
  withdrawn: "badge-red",
  completed: "badge-blue",
  draft: "badge-gray",
  published: "badge-green",
  unpublished: "badge-gray",
};

export function StatusBadge({ status, label, testid }) {
  const cls = STATUS_MAP[status] || "badge-gray";
  return (
    <span className={`badge ${cls}`} data-testid={testid}>
      {label || status}
    </span>
  );
}

export function Empty({ message, hint, icon: Icon = Sparkles, action }) {
  const { t } = useLang();
  return (
    <div className="text-center py-12" data-testid="empty-state">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pri/10 text-pri">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="text-sm font-semibold text-slate-700 font-heading">{message}</div>
      <div className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-600 font-sans">{hint || t.emptyHint}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }) {
  const { t } = useLang();
  return (
    <div className="text-center py-12" role="alert" data-testid="error-state">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bad/15 text-bad">
        <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="text-sm font-semibold text-slate-700 font-heading">{t.loadFailed}</div>
      <div className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-600 font-sans">{t.loadFailedHint}</div>
      {onRetry && (
        <div className="mt-4">
          <Btn variant="outline" size="sm" onClick={onRetry} testid="retry-btn">
            <RefreshCw className="h-3.5 w-3.5" />
            {t.retry}
          </Btn>
        </div>
      )}
    </div>
  );
}

// Placeholder shapes shown while a list loads.
export function SkeletonRows({ rows = 5 }) {
  const { t } = useLang();
  return (
    <div className="space-y-3 py-1" role="status" aria-label={t.loadingLabel} data-testid="loading-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="sk h-9 w-9 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <span className="sk block h-3 w-1/3 rounded-full" />
            <span className="sk block h-2.5 w-1/2 rounded-full" />
          </div>
          <span className="sk hidden h-5 w-16 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6 }) {
  const { t } = useLang();
  return (
    <div className="contents" role="status" aria-label={t.loadingLabel} data-testid="loading-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="clay-card p-5">
          <span className="sk mb-3 block h-4 w-2/5 rounded-full" />
          <span className="sk mb-2 block h-3 w-4/5 rounded-full" />
          <span className="sk block h-3 w-3/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function RoleHero({ eyebrow, title, subtitle, color = "var(--pri)", icon: Icon, children, testid }) {
  return (
    <section
      className="clay-card relative mb-5 overflow-hidden p-5 sm:p-6" style={{ "--t": color }}
      data-testid={testid}
    >
      <div className="absolute inset-y-0 right-0 hidden w-1/2 sm:block" style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--t) 9%, transparent))" }} />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <div className="clay-orb h-12 w-12">
              <Icon className="h-6 w-6" strokeWidth={2.1} />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">{eyebrow}</div>
            )}
            <h2 className="text-2xl font-heading font-extrabold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
            {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 font-sans">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="relative min-w-0 lg:max-w-md">{children}</div>}
      </div>
    </section>
  );
}

export function ActionPanel({ title, subtitle, color = "var(--pri)", icon: Icon, actionLabel, onAction, children, testid }) {
  return (
    <div className="rounded-[20px] bg-slate-50 p-4" data-testid={testid}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm" style={{ color }}>
            <Icon className="h-5 w-5" strokeWidth={2.1} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-heading text-sm font-semibold text-slate-950">{title}</div>
          {subtitle && <div className="mt-1 text-xs leading-5 text-slate-500 font-sans">{subtitle}</div>}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold font-heading"
          style={{ color }}
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function InsightCard({ label, value, detail, color = "var(--pri)", testid }) {
  return (
    <div className="clay-card p-4" data-testid={testid}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">{label}</div>
      </div>
      <div className="num mt-2 break-words text-xl font-extrabold text-slate-950">{value}</div>
      {detail && <div className="mt-1 text-xs leading-5 text-slate-500 font-sans">{detail}</div>}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled, testid, type = "button", className = "", ariaLabel }) {
  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };
  const variants = {
    primary: "is-pri",
    secondary: "is-soft",
    outline: "",
    danger: "is-bad",
    ghost: "is-ghost",
    success: "is-ok",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      data-testid={testid}
      className={`btn-clay inline-flex max-w-full items-center justify-center gap-2 text-center font-bold disabled:opacity-50 disabled:pointer-events-none font-sans ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ label, type = "text", value, onChange, placeholder, testid, className = "", ...rest }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">{label}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-testid={testid}
        className="field-clay h-11 px-4 text-sm"
        {...rest}
      />
    </label>
  );
}

export function Select({ label, value, onChange, options, testid, className = "", disabled }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">{label}</span>}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        data-testid={testid}
        className="field-clay h-11 px-4 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Textarea({ label, value, onChange, rows = 3, testid, placeholder, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">{label}</span>}
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        data-testid={testid}
        className="field-clay px-4 py-2.5 text-sm resize-y"
      />
    </label>
  );
}

export function Modal({ open, onClose, title, children, testid, footer, size = "md" }) {
  const { t } = useLang();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();

  // Keyboard support: focus moves into the dialog, Tab stays inside it, Escape closes it,
  // and focus returns to whatever opened it.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? [...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        : [];
    const first = panel?.querySelector("input:not([disabled]),select:not([disabled]),textarea:not([disabled])") || focusables()[0];
    first?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 pb-24 pt-16 sm:p-4 sm:pb-4"
      data-testid={testid}
      style={{ background: "rgba(13, 22, 48, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`clay-card w-full ${widths[size]} animate-fadeUp`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-5 pb-2 flex items-center justify-between gap-3 sm:px-6">
          <h2 id={titleId} className="min-w-0 font-heading font-extrabold text-lg text-slate-900 tracking-tight sm:text-xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t.close} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-xl leading-none" data-testid="modal-close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="px-4 py-5 max-h-[calc(100dvh-18.5rem)] overflow-y-auto sm:max-h-[70vh] sm:px-6">{children}</div>
        {footer && <div className="px-4 pt-3 pb-5 flex flex-wrap justify-end gap-2 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}
