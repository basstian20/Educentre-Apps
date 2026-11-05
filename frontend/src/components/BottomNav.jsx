import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { getNav } from "./Sidebar";

// Menu yang paling sering dipakai tiap peran; sisanya lewat tombol "Lainnya" (menu geser).
const PICKS = {
  admin: ["nav-dashboard", "nav-students", "nav-classes", "nav-invoices"],
  educator: ["nav-dashboard", "nav-myclasses", "nav-attendance", "nav-grades"],
  student: ["nav-dashboard", "nav-myclasses", "nav-results", "nav-attendance"],
  parent: ["nav-dashboard", "nav-mychildren", "nav-results", "nav-invoices"],
};

export default function BottomNav({ onMore }) {
  const { t } = useLang();
  const { user } = useAuth();
  if (!user) return null;
  const all = getNav(user.role, t).flatMap((sec) => sec.items);
  const items = (PICKS[user.role] || [])
    .map((id) => all.find((it) => it.testid === id))
    .filter(Boolean);

  return (
    <nav className="bottom-nav md:hidden" aria-label={t.navMain} data-testid="bottom-nav">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <NavLink key={it.to} to={it.to} className={({ isActive }) => `bi ${isActive ? "act" : ""}`} data-testid={`bnav-${it.testid}`}>
            <Icon strokeWidth={2.2} />
            <span>{it.label}</span>
          </NavLink>
        );
      })}
      <button type="button" className="bi" onClick={onMore} data-testid="bnav-more" aria-label={t.openNav}>
        <Menu strokeWidth={2.2} />
        <span>{t.navMore}</span>
      </button>
    </nav>
  );
}
