import { useLang } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { Link } from "react-router-dom";
import { Menu, Moon, Search, Sparkles, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useMotion } from "../lib/motion";
import NotificationBell from "./NotificationBell";

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

export default function Topbar({ title, subtitle, actions, onMenuClick, onSearch }) {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { motion, stored, setMotion, systemReduced } = useMotion();
  const roleColor = user ? ROLE_COLORS[user.role] : "#2563EB";
  const roleLabel = user ? t[ROLE_LABELS[user.role]] : "";

  return (
    <header
      className="topbar-glass sticky top-0 z-30 flex min-h-[96px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:min-h-[112px] sm:gap-4 sm:py-5 sm:px-6 lg:px-8"
      data-testid="topbar"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="glass-icon-button md:hidden"
          aria-label={t.openNav}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[26px] font-heading font-extrabold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[33px]" data-testid="page-title">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1 truncate text-xs font-semibold tracking-wide text-mut font-sans">{subtitle}</div>
          )}
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
        {actions && <div className="flex min-w-0 flex-wrap justify-end gap-2">{actions}</div>}
        {onSearch && (
          <button type="button" onClick={onSearch} className="cmd-trigger" aria-label={t.cmdOpen} data-testid="open-command-palette">
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">{t.cmdOpen}</span>
            <kbd className="hidden lg:inline">Ctrl K</kbd>
          </button>
        )}
        <div className="lang-switcher flex rounded-full p-0.5" data-testid="lang-switcher">
          {["en", "id"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              data-testid={`lang-${l}`}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                lang === l ? "bg-pri text-[color:var(--pri-ink)] shadow-sm" : "text-mut hover:text-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggle}
          className="glass-icon-button"
          aria-label={t.themeToggle}
          title={theme === "dark" ? t.themeLight : t.themeDark}
          data-testid="theme-toggle"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setMotion(stored === "full" ? "lite" : "full")}
          className="glass-icon-button"
          aria-pressed={motion === "full"}
          aria-label={`${t.motionLabel}: ${motion === "full" ? t.motionFull : systemReduced ? t.motionSystemLite : t.motionLite}`}
          title={systemReduced ? t.motionSystemLite : `${t.motionLabel}: ${motion === "full" ? t.motionFull : t.motionLite}`}
          disabled={systemReduced}
          data-testid="motion-toggle"
        >
          <Sparkles className={`h-4 w-4 ${motion === "full" ? "" : "opacity-40"}`} />
        </button>
        <NotificationBell />
        {user && (
          <Link to="/settings" className="profile-chip hidden items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 sm:flex" data-testid="role-pill" title={t.settingsTitle}>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${roleColor}, var(--info))` }}
            >
              {(user.full_name || "U").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="max-w-28 truncate text-xs font-semibold text-ink font-heading">{user.full_name}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-mut">{roleLabel}</div>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
