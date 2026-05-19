import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { ActionPanel, Card, Empty, RoleHero, StatTile, StatusBadge } from "@/components/UI";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { api, fmtIDR } from "@/lib/api";
import { Users, GraduationCap, BookOpen, Receipt, AlertTriangle, TrendingUp, CheckCircle, Megaphone, Award, CalendarDays, Heart } from "lucide-react";

const ROLE_GREETING = {
  admin: { en: "Centre overview", id: "Ikhtisar pusat" },
  educator: { en: "Today's teaching plan", id: "Rencana mengajar hari ini" },
  student: { en: "Your learning today", id: "Pembelajaran hari ini" },
  parent: { en: "Your children's progress", id: "Progres anak Anda" },
};

const ROLE_META = {
  admin: {
    color: "#2563EB",
    icon: TrendingUp,
    eyebrow: { en: "Operations command", id: "Pusat operasional" },
    title: { en: "Keep the centre moving with fewer surprises.", id: "Pantau operasional bimbel tanpa kejutan." },
    subtitle: {
      en: "Fees, classes, people, and announcements are grouped into one daily operating view.",
      id: "Tagihan, kelas, orang, dan pengumuman diringkas dalam satu tampilan kerja harian.",
    },
  },
  educator: {
    color: "#059669",
    icon: GraduationCap,
    eyebrow: { en: "Teaching desk", id: "Ruang mengajar" },
    title: { en: "A cleaner path from class prep to attendance.", id: "Alur mengajar lebih ringkas dari persiapan sampai presensi." },
    subtitle: {
      en: "Focus on today's sessions, pending assessments, and the students who need attention.",
      id: "Fokus pada sesi hari ini, penilaian tertunda, dan siswa yang perlu perhatian.",
    },
  },
  student: {
    color: "#D97706",
    icon: Award,
    eyebrow: { en: "Learning cockpit", id: "Ruang belajar" },
    title: { en: "Know what is next, what changed, and what is due.", id: "Lihat jadwal berikutnya, hasil terbaru, dan tagihan aktif." },
    subtitle: {
      en: "Schedule, materials, attendance, grades, and fees stay visible without digging through menus.",
      id: "Jadwal, materi, presensi, nilai, dan biaya tetap terlihat tanpa harus banyak mencari.",
    },
  },
  parent: {
    color: "#7C3AED",
    icon: Heart,
    eyebrow: { en: "Family view", id: "Pantauan keluarga" },
    title: { en: "A calm view of progress, attendance, and payments.", id: "Pantau progres, presensi, dan pembayaran dengan lebih tenang." },
    subtitle: {
      en: "Important updates about your children are grouped into one readable parent workspace.",
      id: "Update penting anak dirangkum dalam ruang pantau orang tua yang mudah dibaca.",
    },
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [stats, setStats] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);

  useEffect(() => {
    api.get("/dashboard/stats").then((r) => setStats(r.data || {}));
    api.get("/announcements").then((r) => setAnnouncements(r.data || []));
    if (user?.role === "admin" || user?.role === "student" || user?.role === "parent") {
      api.get("/invoices").then((r) => setRecentInvoices((r.data || []).slice(0, 5)));
    }
    if (user?.role === "student" || user?.role === "parent") {
      api.get("/grades").then((r) => setRecentGrades((r.data || []).slice(0, 5)));
    }
  }, [user?.role, user?.id]);

  const today = new Date();
  const greetSub = ROLE_GREETING[user?.role]?.[lang] || "";
  const greetName = (user?.full_name || "").split(" ")[0];
  const roleMeta = ROLE_META[user?.role] || ROLE_META.admin;
  const HeroIcon = roleMeta.icon;

  return (
    <Layout
      title={`${t.welcome}, ${greetName}`}
      subtitle={`${greetSub} · ${today.toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}`}
    >
      <RoleHero
        eyebrow={roleMeta.eyebrow[lang]}
        title={roleMeta.title[lang]}
        subtitle={roleMeta.subtitle[lang]}
        color={roleMeta.color}
        icon={HeroIcon}
        testid="dashboard-role-hero"
      >
        {user?.role === "admin" && (
          <ActionPanel
            title={lang === "id" ? "Prioritas hari ini" : "Today priority"}
            subtitle={`${stats.overdue_invoices ?? 0} ${t.overdueInvoices.toLowerCase()} - ${fmtIDR(stats.outstanding_fees)} ${lang === "id" ? "belum lunas" : "outstanding"}`}
            color={roleMeta.color}
            icon={AlertTriangle}
          />
        )}
        {user?.role === "educator" && (
          <ActionPanel
            title={lang === "id" ? "Kelas berikutnya" : "Next class"}
            subtitle={(stats.today_classes || [])[0] ? `${(stats.today_classes || [])[0].subject_name} - ${(stats.today_classes || [])[0].time_start}` : t.noClasses}
            color={roleMeta.color}
            icon={CalendarDays}
          />
        )}
        {user?.role === "student" && (
          <ActionPanel
            title={lang === "id" ? "Progress belajar" : "Learning progress"}
            subtitle={`${t.attendanceRate}: ${stats.attendance_pct ?? 100}% - ${t.activeClasses}: ${stats.active_classes ?? 0}`}
            color={roleMeta.color}
            icon={CheckCircle}
          />
        )}
        {user?.role === "parent" && (
          <ActionPanel
            title={lang === "id" ? "Ringkasan anak" : "Children snapshot"}
            subtitle={`${stats.children_count ?? 0} ${t.children.toLowerCase()} - ${fmtIDR(stats.outstanding_fees)} ${lang === "id" ? "tagihan aktif" : "active fees"}`}
            color={roleMeta.color}
            icon={Users}
          />
        )}
      </RoleHero>
      {user?.role === "admin" && <AdminDash stats={stats} announcements={announcements} t={t} />}
      {user?.role === "educator" && <EducatorDash stats={stats} announcements={announcements} t={t} />}
      {user?.role === "student" && <StudentDash stats={stats} invoices={recentInvoices} grades={recentGrades} announcements={announcements} t={t} />}
      {user?.role === "parent" && <ParentDash stats={stats} invoices={recentInvoices} grades={recentGrades} announcements={announcements} t={t} />}
    </Layout>
  );
}

function AdminDash({ stats, announcements, t }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile testid="stat-students" label={t.activeStudents} value={stats.active_students ?? 0} icon={Users} color="#2563EB" />
        <StatTile testid="stat-classes" label={t.activeClasses} value={stats.active_classes ?? 0} icon={BookOpen} color="#059669" />
        <StatTile testid="stat-revenue" label={t.revenueThisMonth} value={fmtIDR(stats.revenue_this_month)} icon={TrendingUp} color="#D97706" />
        <StatTile testid="stat-outstanding" label={t.outstandingFees} value={fmtIDR(stats.outstanding_fees)} sub={`${stats.overdue_invoices ?? 0} ${t.overdueInvoices.toLowerCase()}`} icon={AlertTriangle} color="#DC2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
        <Card title={t.activeEducators} testid="card-educators" className="lg:col-span-1">
          <div className="text-2xl font-outfit font-bold text-slate-900 sm:text-3xl">{stats.active_educators ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1 font-jakarta">{t.appName} faculty</div>
        </Card>
        <Card title={t.announcements} testid="card-announcements" className="lg:col-span-2">
          {announcements.length === 0 ? (
            <Empty message={t.noData} />
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-outfit font-semibold text-sm text-slate-900">{a.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-jakarta line-clamp-2">{a.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function EducatorDash({ stats, announcements, t }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile testid="stat-myclasses" label={t.myClasses} value={stats.my_classes ?? 0} icon={BookOpen} color="#059669" />
        <StatTile testid="stat-mystudents" label={t.activeStudents} value={stats.total_students ?? 0} icon={Users} color="#2563EB" />
        <StatTile testid="stat-pending" label={t.pendingTasks} value={stats.pending_assessments ?? 0} icon={CheckCircle} color="#D97706" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <Card title={t.todaysClasses} testid="card-today">
          {(stats.today_classes || []).length === 0 ? (
            <Empty message={t.noClasses} />
          ) : (
            <div className="space-y-2">
              {(stats.today_classes || []).map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50">
                  <div className="w-1 h-10 rounded-full" style={{ background: c.color_hex || "#3B82F6" }} />
                  <div className="flex-1">
                    <div className="font-outfit font-semibold text-sm text-slate-900">{c.subject_name}</div>
                    <div className="text-xs text-slate-500 font-jakarta">{c.time_start} – {c.time_end} · {c.room}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title={t.announcements} testid="card-announcements">
          {announcements.length === 0 ? (
            <Empty message={t.noData} />
          ) : (
            <div className="space-y-2">
              {announcements.slice(0, 4).map((a) => (
                <div key={a.id} className="p-3 rounded-lg hover:bg-slate-50">
                  <div className="font-outfit font-semibold text-sm text-slate-900">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-jakarta line-clamp-2">{a.body}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function StudentDash({ stats, invoices, grades, announcements, t }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile testid="stat-classes" label={t.activeClasses} value={stats.active_classes ?? 0} icon={BookOpen} color="#D97706" />
        <StatTile testid="stat-attendance" label={t.attendanceRate} value={`${stats.attendance_pct ?? 100}%`} icon={CheckCircle} color="#059669" />
        <StatTile testid="stat-fees" label={t.outstandingFees} value={fmtIDR(stats.outstanding_fees)} icon={Receipt} color="#DC2626" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <Card title={t.todaysClasses} testid="card-today">
          {(stats.today_classes || []).length === 0 ? <Empty message={t.noClasses} /> : (
            <div className="space-y-2">
              {(stats.today_classes || []).map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100">
                  <div className="w-1 h-10 rounded-full" style={{ background: c.color_hex || "#D97706" }} />
                  <div className="flex-1">
                    <div className="font-outfit font-semibold text-sm">{c.subject_name}</div>
                    <div className="text-xs text-slate-500 font-jakarta">{c.time_start} – {c.time_end} · {c.room}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title={t.myResults} testid="card-results">
          {grades.length === 0 ? <Empty message={t.noData} /> : (
            <div className="space-y-2">
              {grades.map((g) => (
                <div key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-100">
                  <div className="flex-1">
                    <div className="font-outfit font-semibold text-sm">{g.letter_grade || "—"}</div>
                    <div className="text-xs text-slate-500 font-jakarta">{g.score}/{g.max_score} · {g.percentage?.toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function ParentDash({ stats, invoices, grades, announcements, t }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile testid="stat-children" label={t.children} value={stats.children_count ?? 0} icon={Users} color="#7C3AED" />
        <StatTile testid="stat-classes" label={t.activeClasses} value={stats.active_classes ?? 0} icon={BookOpen} color="#2563EB" />
        <StatTile testid="stat-attendance" label={t.attendanceRate} value={`${stats.attendance_pct ?? 100}%`} icon={CheckCircle} color="#059669" />
        <StatTile testid="stat-fees" label={t.outstandingFees} value={fmtIDR(stats.outstanding_fees)} icon={Receipt} color="#DC2626" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <Card title={t.children} testid="card-children">
          {(stats.children || []).length === 0 ? <Empty message={t.noData} /> : (
            <div className="space-y-2">
              {(stats.children || []).map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-outfit font-semibold text-xs">
                    {s.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1">
                    <div className="font-outfit font-semibold text-sm">{s.full_name}</div>
                    <div className="text-xs text-slate-500 font-jakarta">{s.student_code} · {s.school_year}</div>
                  </div>
                  <StatusBadge status={s.status} label={t.statusActive} />
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title={t.announcements} testid="card-announcements">
          {announcements.length === 0 ? <Empty message={t.noData} /> : (
            <div className="space-y-2">
              {announcements.slice(0, 4).map((a) => (
                <div key={a.id} className="p-3 rounded-lg hover:bg-slate-50">
                  <div className="font-outfit font-semibold text-sm">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-jakarta line-clamp-2">{a.body}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
