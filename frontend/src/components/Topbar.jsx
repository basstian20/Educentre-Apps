import { useLang } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { Bell } from "lucide-react";

const ROLE_COLORS = {
  admin: "#2563EB",
  educator: "#059669",
  student: "#D97706",
  parent: "#7C3AED",
};

const ROLE_LABELS = {
  admin: "role_admin",
  educator: "role_educator",
  student: "role_student",
  parent: "role_parent",
};

export default function Topbar({ title, subtitle, actions }) {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();
  const roleColor = user ? ROLE_COLORS[user.role] : "#2563EB";
  const roleLabel = user ? t[ROLE_LABELS[user.role]] : "";

  return (
    <header
      className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6"
      data-testid="topbar"
    >
      <div className="min-w-0">
        <h1 className="text-xl font-outfit font-semibold text-slate-900 leading-tight truncate" data-testid="page-title">
          {title}
        </h1>
        {subtitle && (
          <div className="text-xs text-slate-500 mt-0.5 truncate font-jakarta">{subtitle}</div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Role pill */}
        {user && (
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold font-outfit"
            style={{ background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30` }}
            data-testid="role-pill"
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulseDot" style={{ background: roleColor }} />
            {roleLabel}
          </div>
        )}

        {/* Lang switcher */}
        <div className="flex bg-slate-100 rounded-lg p-0.5" data-testid="lang-switcher">
          {["en", "id"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              data-testid={`lang-${l}`}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition ${
                lang === l ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          title="Notifications"
          data-testid="notif-btn"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
