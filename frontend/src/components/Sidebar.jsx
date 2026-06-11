import { useLang } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardList,
  CheckSquare,
  Award,
  FolderOpen,
  Receipt,
  Megaphone,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  X,
  User as UserIcon,
  BookOpen,
  Heart,
} from "lucide-react";

const ROLE_TITLES = {
  admin: "role_admin",
  educator: "role_educator",
  student: "role_student",
  parent: "role_parent",
};

const ROLE_COLORS = {
  admin: "var(--role-management)",
  educator: "var(--role-educator)",
  student: "var(--role-student)",
  parent: "var(--role-parent)",
};

function getNav(role, t) {
  if (role === "admin")
    return [
      { section: t.overview, items: [
        { label: t.dashboard, to: "/dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
        { label: t.reports, to: "/reports", icon: BarChart3, testid: "nav-reports" },
      ]},
      { section: t.people, items: [
        { label: t.students, to: "/students", icon: Users, testid: "nav-students" },
        { label: t.educators, to: "/educators", icon: GraduationCap, testid: "nav-educators" },
        { label: t.parents, to: "/parents", icon: Heart, testid: "nav-parents" },
      ]},
      { section: t.academics, items: [
        { label: t.classes, to: "/classes", icon: Calendar, testid: "nav-classes" },
        { label: t.enrollment, to: "/enrollment", icon: ClipboardList, testid: "nav-enrollment" },
        { label: t.attendance, to: "/attendance", icon: CheckSquare, testid: "nav-attendance" },
        { label: t.grades, to: "/grades", icon: Award, testid: "nav-grades" },
        { label: t.materials, to: "/materials", icon: FolderOpen, testid: "nav-materials" },
      ]},
      { section: t.finance, items: [
        { label: t.invoices, to: "/invoices", icon: Receipt, testid: "nav-invoices" },
      ]},
      { section: t.system, items: [
        { label: t.announcements, to: "/announcements", icon: Megaphone, testid: "nav-announcements" },
      ]},
    ];
  if (role === "educator")
    return [
      { section: t.overview, items: [
        { label: t.myDashboard, to: "/dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
      ]},
      { section: t.academics, items: [
        { label: t.myClasses, to: "/classes", icon: BookOpen, testid: "nav-myclasses" },
        { label: t.markAttendance, to: "/attendance", icon: CheckSquare, testid: "nav-attendance" },
        { label: t.enterGrades, to: "/grades", icon: Award, testid: "nav-grades" },
        { label: t.materials, to: "/materials", icon: FolderOpen, testid: "nav-materials" },
      ]},
      { section: t.system, items: [
        { label: t.announcements, to: "/announcements", icon: Megaphone, testid: "nav-announcements" },
      ]},
    ];
  if (role === "student")
    return [
      { section: t.overview, items: [
        { label: t.myDashboard, to: "/dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
      ]},
      { section: t.academics, items: [
        { label: t.mySchedule, to: "/classes", icon: Calendar, testid: "nav-myclasses" },
        { label: t.myResults, to: "/results", icon: Award, testid: "nav-results" },
        { label: t.materials, to: "/materials", icon: FolderOpen, testid: "nav-materials" },
        { label: t.attendance, to: "/attendance", icon: CheckSquare, testid: "nav-attendance" },
      ]},
      { section: t.finance, items: [
        { label: t.myFees, to: "/invoices", icon: Receipt, testid: "nav-invoices" },
      ]},
      { section: t.system, items: [
        { label: t.announcements, to: "/announcements", icon: Megaphone, testid: "nav-announcements" },
      ]},
    ];
  if (role === "parent")
    return [
      { section: t.overview, items: [
        { label: t.myDashboard, to: "/dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
      ]},
      { section: t.academics, items: [
        { label: t.myChildren, to: "/students", icon: Users, testid: "nav-mychildren" },
        { label: t.results, to: "/results", icon: Award, testid: "nav-results" },
        { label: t.attendance, to: "/attendance", icon: CheckSquare, testid: "nav-attendance" },
        { label: t.classes, to: "/classes", icon: Calendar, testid: "nav-classes" },
      ]},
      { section: t.finance, items: [
        { label: t.fees, to: "/invoices", icon: Receipt, testid: "nav-invoices" },
      ]},
      { section: t.system, items: [
        { label: t.announcements, to: "/announcements", icon: Megaphone, testid: "nav-announcements" },
      ]},
    ];
  return [];
}

export default function Sidebar({ open = false, onClose }) {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const sections = getNav(user.role, t);
  const roleColor = ROLE_COLORS[user.role];
  const roleLabel = t[ROLE_TITLES[user.role]];

  const initials = (user.full_name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`sidebar-glass fixed inset-y-0 left-0 z-50 flex w-64 max-w-[82vw] flex-col transition-transform duration-200 md:inset-y-6 md:left-6 md:w-[212px] md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="sidebar"
      >
      <div className="px-5 pb-5 pt-7">
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg font-outfit"
            style={{ background: "linear-gradient(135deg, #356f83, #78a99d)" }}
          >
            E
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white/70 bg-[#f4cf63]" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold leading-tight text-[#294a55] font-outfit">{t.appName}</div>
            <div className="mt-1 text-[9px] uppercase leading-tight tracking-[0.2em] text-[#73908e]">Learning OS</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-[#668584] transition hover:bg-white/50 hover:text-[#164e50] md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1">
        {sections.map((sec) => (
          <div key={`sec-${sec.section}`} className="mb-3">
            <div className="mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-widest text-[#87a09f] font-outfit">
              {sec.section}
            </div>
            {sec.items.map((it) => {
              const Icon = it.icon;
              return (
                <NavLink
                  key={it.to + it.label}
                  to={it.to}
                  data-testid={it.testid}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `relative mb-0.5 flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-[12px] font-medium transition-all ${
                      isActive
                        ? "nav-active text-white shadow-lg"
                        : "text-[#587775] hover:bg-white/45 hover:text-[#164e50]"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                  <span>{it.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-2xl border border-white/55 bg-white/30 p-2">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white font-outfit"
            style={{ background: `linear-gradient(135deg, ${roleColor}, #78a99d)` }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-xs font-medium text-[#294a55] font-outfit">{user.full_name}</div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-[#789391]">{roleLabel}</div>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="rounded-lg p-2 text-[#789391] transition hover:bg-white/50 hover:text-[#164e50]"
            title={t.logout}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
