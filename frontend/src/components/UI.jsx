export function StatTile({ label, value, sub, icon: Icon, color = "#2563EB", testid }) {
  return (
    <div
      className="kpi-tile bg-white border border-slate-200 rounded-xl p-5 shadow-card relative overflow-hidden"
      data-testid={testid}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider font-outfit">{label}</div>
          <div className="text-3xl font-outfit font-bold text-slate-900 mt-2 leading-none">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-2 font-jakarta">{sub}</div>}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${color}15`, color }}
          >
            <Icon className="w-5 h-5" strokeWidth={2.2} />
          </div>
        )}
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </div>
  );
}

export function Card({ title, action, children, testid, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-card ${className}`} data-testid={testid}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          {title && <h3 className="font-outfit font-semibold text-slate-900 text-base">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
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

export function Empty({ message, action }) {
  return (
    <div className="text-center py-12">
      <div className="text-sm text-slate-400 font-jakarta">{message}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled, testid, type = "button", className = "" }) {
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testid}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none font-outfit ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ label, type = "text", value, onChange, placeholder, testid, className = "", ...rest }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-xs font-medium text-slate-600 mb-1.5 font-outfit">{label}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-testid={testid}
        className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-jakarta"
        {...rest}
      />
    </label>
  );
}

export function Select({ label, value, onChange, options, testid, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-xs font-medium text-slate-600 mb-1.5 font-outfit">{label}</span>}
      <select
        value={value}
        onChange={onChange}
        data-testid={testid}
        className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-jakarta"
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
      {label && <span className="block text-xs font-medium text-slate-600 mb-1.5 font-outfit">{label}</span>}
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        data-testid={testid}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-jakarta resize-y"
      />
    </label>
  );
}

export function Modal({ open, onClose, title, children, testid, footer, size = "md" }) {
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid={testid}
      style={{ background: "rgba(15, 23, 42, 0.5)" }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl w-full ${widths[size]} shadow-2xl animate-fadeUp`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-outfit font-semibold text-lg text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none" data-testid="modal-close">
            ×
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
