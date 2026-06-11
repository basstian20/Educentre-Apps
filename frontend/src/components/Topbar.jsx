import { useLang } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { Bell, Menu, Search } from "lucide-react";

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

export default function Topbar({ title, subtitle, actions, onMenuClick }) {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();
  const roleColor = user ? ROLE_COLORS[user.role] : "#2563EB";
  const roleLabel = user ? t[ROLE_LABELS[user.role]] : "";

  return (
    <header
      className="topbar-glass sticky top-0 z-30 flex min-h-[112px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8"
      data-testid="topbar"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="glass-icon-button md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-outfit font-semibold leading-tight text-[#294a55] sm:text-3xl" data-testid="page-title">
            {title}
          </h1>
          {subtitle && (
            <div className="mb-1 truncate text-[11px] font-semibold tracking-wide text-[#4f8090] font-jakarta">{subtitle}</div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        {actions && <div className="flex min-w-0 flex-wrap justify-end gap-2">{actions}</div>}
        <button className="glass-icon-button hidden sm:inline-flex" title="Search" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
        <div className="lang-switcher flex rounded-full p-0.5" data-testid="lang-switcher">
          {["en", "id"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              data-testid={`lang-${l}`}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                lang === l ? "bg-white/80 text-[#164e50] shadow-sm" : "text-[#668584] hover:text-[#164e50]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          className="glass-icon-button relative"
          title="Notifications"
          data-testid="notif-btn"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        {user && (
          <div className="profile-chip hidden items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 sm:flex" data-testid="role-pill">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${roleColor}, #78a99d)` }}
            >
              {(user.full_name || "U").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="max-w-28 truncate text-xs font-semibold text-[#294a55] font-outfit">{user.full_name}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#76908f]">{roleLabel}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
