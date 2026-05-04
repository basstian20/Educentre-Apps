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

export default function Sidebar() {
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
    <aside
      className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col"
      style={{ background: "var(--sidebar-bg)" }}
      data-testid="sidebar"
    >
      <div className="px-5 pt-6 pb-4 border-b border-white/5 grain">
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-outfit font-bold text-white text-lg"
            style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)` }}
          >
            E
          </div>
          <div>
            <div className="font-outfit font-semibold text-white text-base leading-tight">{t.appName}</div>
            <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{t.appSubtitle}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((sec, si) => (
          <div key={si} className="mb-5">
            <div className="text-[10px] font-outfit font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">
              {sec.section}
            </div>
            {sec.items.map((it) => {
              const Icon = it.icon;
              return (
                <NavLink
                  key={it.to + it.label}
                  to={it.to}
                  data-testid={it.testid}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all ${
                      isActive
                        ? "text-white bg-blue-600/15"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`
                  }
                  style={({ isActive }) => (isActive ? { color: "#3B82F6" } : {})}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                  <span>{it.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-outfit font-semibold text-white text-xs flex-shrink-0"
            style={{ background: roleColor }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate font-outfit">{user.full_name}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{roleLabel}</div>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
            title={t.logout}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
