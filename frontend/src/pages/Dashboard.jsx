import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { api, fmtIDR } from "@/lib/api";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Megaphone,
  Receipt,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

const ROLE_COPY = {
  admin: { en: "Centre overview", id: "Ikhtisar pusat" },
  educator: { en: "Teaching overview", id: "Ikhtisar mengajar" },
  student: { en: "Learning overview", id: "Ikhtisar belajar" },
  parent: { en: "Family overview", id: "Ikhtisar keluarga" },
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [stats, setStats] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const requests = [
      api.get("/dashboard/stats"),
      api.get("/announcements"),
    ];

    if (user?.role === "admin") {
      requests.push(api.get("/students"), api.get("/invoices"));
    } else if (user?.role === "student" || user?.role === "parent") {
      requests.push(api.get("/invoices"), api.get("/grades"));
    }

    Promise.allSettled(requests).then((results) => {
      if (!active) return;
      setStats(results[0].status === "fulfilled" ? results[0].value.data || {} : {});
      setAnnouncements(results[1].status === "fulfilled" ? results[1].value.data || [] : []);

      if (user?.role === "admin") {
        setStudents(results[2]?.status === "fulfilled" ? results[2].value.data || [] : []);
        setInvoices(results[3]?.status === "fulfilled" ? results[3].value.data || [] : []);
      } else if (user?.role === "student" || user?.role === "parent") {
        setInvoices(results[2]?.status === "fulfilled" ? results[2].value.data || [] : []);
        setGrades(results[3]?.status === "fulfilled" ? results[3].value.data || [] : []);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  const firstName = (user?.full_name || "").split(" ")[0];
  const dateLabel = new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <Layout
      title="Dashboard"
      subtitle={`${t.welcome}, ${firstName} · ${ROLE_COPY[user?.role]?.[lang] || dateLabel}`}
    >
      <div className="dashboard-grid" data-testid="dashboard-overview">
        <div className="space-y-4">
          <NextClassCard stats={stats} loading={loading} lang={lang} />
          <OverviewTable
            role={user?.role}
            students={students}
            invoices={invoices}
            grades={grades}
            stats={stats}
            loading={loading}
            lang={lang}
          />
        </div>

        <div className="space-y-4">
          <LearningStatsCard role={user?.role} stats={stats} loading={loading} lang={lang} />
          <MetricGrid role={user?.role} stats={stats} loading={loading} lang={lang} />
          <ReminderCard announcements={announcements} lang={lang} />
        </div>
      </div>
    </Layout>
  );
}

function GlassCard({ children, className = "", testid }) {
  return (
    <section className={`dashboard-card ${className}`} data-testid={testid}>
      {children}
    </section>
  );
}

function CardHeader({ title, to, action, lang }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-[#294a55] font-outfit">{title}</h2>
      {to && (
        <Link className="dashboard-link" to={to}>
          {action || (lang === "id" ? "Lihat semua" : "View all")}
        </Link>
      )}
    </div>
  );
}

function NextClassCard({ stats, loading, lang }) {
  const nextClass = (stats.today_classes || [])[0];

  return (
    <GlassCard testid="card-next-class">
      <CardHeader
        title={lang === "id" ? "Kelas Berikutnya" : "Next Class"}
        to="/classes"
        action={lang === "id" ? "Lihat jadwal" : "View schedule"}
        lang={lang}
      />
      {loading ? (
        <CardSkeleton />
      ) : nextClass ? (
        <div className="next-class-layout">
          <div className="class-symbol">
            <BookOpen className="h-7 w-7" />
          </div>
          <div className="min-w-0 text-center">
            <div className="truncate text-base font-semibold text-[#294a55] font-outfit">{nextClass.subject_name}</div>
            <div className="mt-1 text-[11px] text-[#6f8987]">{nextClass.educator_name || (lang === "id" ? "Pengajar" : "Educator")}</div>
          </div>
          <div className="time-badge">
            <Clock3 className="h-3.5 w-3.5" />
            <span>{nextClass.time_start || "--:--"}</span>
          </div>
          <div className="class-symbol class-symbol-alt">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#294a55] font-outfit">{nextClass.room || (lang === "id" ? "Ruang belum ditentukan" : "Room to be confirmed")}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6f8987]">
              <CalendarDays className="h-3.5 w-3.5" />
              {DAYS[new Date().getDay()]}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title={lang === "id" ? "Tidak ada kelas hari ini" : "No classes today"}
          text={lang === "id" ? "Jadwal berikutnya akan muncul di sini." : "Your next scheduled class will appear here."}
        />
      )}
    </GlassCard>
  );
}

function LearningStatsCard({ role, stats, loading, lang }) {
  const attendance = Number(stats.attendance_pct ?? (role === "admin" ? 100 : 0));
  const progress = Math.max(0, Math.min(100, attendance));
  const values = role === "admin"
    ? [
        [lang === "id" ? "Siswa aktif" : "Active students", stats.active_students ?? 0],
        [lang === "id" ? "Kelas aktif" : "Active classes", stats.active_classes ?? 0],
        [lang === "id" ? "Pengajar" : "Educators", stats.active_educators ?? 0],
        [lang === "id" ? "Terlambat" : "Overdue", stats.overdue_invoices ?? 0],
      ]
    : [
        [lang === "id" ? "Kehadiran" : "Attendance", `${attendance}%`],
        [lang === "id" ? "Kelas aktif" : "Active classes", stats.active_classes ?? stats.my_classes ?? 0],
        [lang === "id" ? "Hari ini" : "Today", (stats.today_classes || []).length],
        [lang === "id" ? "Tertunda" : "Pending", stats.pending_assessments ?? 0],
      ];

  return (
    <GlassCard testid="card-learning-statistics">
      <CardHeader title={lang === "id" ? "Statistik Pembelajaran" : "Learning Statistics"} to="/reports" lang={lang} />
      {loading ? <CardSkeleton /> : (
        <>
          <div className="progress-track" aria-label={`${progress}%`}>
            <span style={{ width: `${progress}%` }} />
            <i />
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {values.map(([label, value]) => (
              <div key={label} className="stat-mini">
                <div>{label}</div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}

function MetricGrid({ role, stats, loading, lang }) {
  const metrics = getMetrics(role, stats, lang);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="metric-grid">
      {metrics.map(({ label, value, icon: Icon, tone, testid }) => (
        <GlassCard className="metric-card" testid={testid} key={label}>
          {loading ? <CardSkeleton compact /> : (
            <div className="flex items-center gap-3">
              <div className={`metric-icon ${tone}`}><Icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#78908f]">{label}</div>
                <div className="mt-1 truncate text-xl font-semibold text-[#294a55] font-outfit">{value}</div>
              </div>
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

function getMetrics(role, stats, lang) {
  if (role === "admin") {
    return [
      { label: lang === "id" ? "Total Siswa" : "Total Students", value: stats.active_students ?? 0, icon: Users, tone: "teal", testid: "stat-students" },
      { label: lang === "id" ? "Kelas Aktif" : "Active Classes", value: stats.active_classes ?? 0, icon: BookOpen, tone: "purple", testid: "stat-classes" },
      { label: lang === "id" ? "Pendapatan Bulan Ini" : "Monthly Revenue", value: fmtIDR(stats.revenue_this_month), icon: TrendingUp, tone: "pink", testid: "stat-revenue" },
      { label: lang === "id" ? "Pengajar Aktif" : "Active Educators", value: stats.active_educators ?? 0, icon: GraduationCap, tone: "orange", testid: "stat-educators" },
    ];
  }
  if (role === "educator") {
    return [
      { label: lang === "id" ? "Kelas Saya" : "My Classes", value: stats.my_classes ?? 0, icon: BookOpen, tone: "teal", testid: "stat-myclasses" },
      { label: lang === "id" ? "Total Siswa" : "Total Students", value: stats.total_students ?? 0, icon: Users, tone: "purple", testid: "stat-mystudents" },
      { label: lang === "id" ? "Kelas Hari Ini" : "Classes Today", value: (stats.today_classes || []).length, icon: CalendarDays, tone: "pink", testid: "stat-today" },
      { label: lang === "id" ? "Penilaian Tertunda" : "Pending Assessments", value: stats.pending_assessments ?? 0, icon: Award, tone: "orange", testid: "stat-pending" },
    ];
  }
  return [
    { label: lang === "id" ? "Kelas Aktif" : "Active Classes", value: stats.active_classes ?? 0, icon: BookOpen, tone: "teal", testid: "stat-classes" },
    { label: lang === "id" ? "Kehadiran" : "Attendance Rate", value: `${stats.attendance_pct ?? 100}%`, icon: CheckCircle2, tone: "purple", testid: "stat-attendance" },
    { label: lang === "id" ? "Tagihan Aktif" : "Outstanding Fees", value: fmtIDR(stats.outstanding_fees), icon: Receipt, tone: "pink", testid: "stat-fees" },
    { label: lang === "id" ? "Kelas Hari Ini" : "Classes Today", value: (stats.today_classes || []).length, icon: CalendarDays, tone: "orange", testid: "stat-today" },
  ];
}

function OverviewTable({ role, students, invoices, grades, stats, loading, lang }) {
  const rows = useMemo(() => {
    if (role === "admin") {
      return students.slice(0, 6).map((student) => {
        const studentInvoices = invoices.filter((invoice) => invoice.student_id === student.id);
        const hasDue = studentInvoices.some((invoice) => invoice.status !== "paid");
        return {
          id: student.id,
          name: student.full_name,
          meta: student.student_code || student.school_year || "Student",
          status: student.status || "active",
          detail: hasDue ? (lang === "id" ? "Belum lunas" : "Payment due") : (lang === "id" ? "Lunas" : "Clear"),
          tone: hasDue ? "warning" : "success",
        };
      });
    }
    if (role === "parent") {
      return (stats.children || []).slice(0, 6).map((student) => ({
        id: student.id,
        name: student.full_name,
        meta: student.student_code || student.school_year || "Student",
        status: student.status || "active",
        detail: `${stats.attendance_pct ?? 100}% ${lang === "id" ? "hadir" : "attendance"}`,
        tone: "success",
      }));
    }
    if (role === "student") {
      return grades.slice(0, 6).map((grade) => ({
        id: grade.id,
        name: grade.assessment_name || grade.letter_grade || (lang === "id" ? "Hasil belajar" : "Learning result"),
        meta: grade.letter_grade || `${grade.score ?? 0}/${grade.max_score ?? 0}`,
        status: lang === "id" ? "Selesai" : "Completed",
        detail: `${Number(grade.percentage || 0).toFixed(0)}%`,
        tone: "success",
      }));
    }
    return (stats.today_classes || []).slice(0, 6).map((item) => ({
      id: item.id,
      name: item.subject_name,
      meta: item.room || (lang === "id" ? "Ruang belum ada" : "Room pending"),
      status: lang === "id" ? "Hari ini" : "Today",
      detail: `${item.time_start || "--:--"} - ${item.time_end || "--:--"}`,
      tone: "success",
    }));
  }, [grades, invoices, lang, role, stats, students]);

  const title = role === "admin"
    ? (lang === "id" ? "Ringkasan Siswa" : "Student Overview")
    : role === "student"
      ? (lang === "id" ? "Hasil Terbaru" : "Recent Results")
      : role === "parent"
        ? (lang === "id" ? "Ringkasan Anak" : "Children Overview")
        : (lang === "id" ? "Jadwal Hari Ini" : "Today's Schedule");
  const target = role === "student" ? "/results" : role === "educator" ? "/classes" : "/students";

  return (
    <GlassCard testid="card-overview-table">
      <CardHeader title={title} to={target} lang={lang} />
      {loading ? <CardSkeleton /> : rows.length ? (
        <div className="overflow-x-auto">
          <table className="overview-table">
            <thead>
              <tr>
                <th>{role === "educator" ? (lang === "id" ? "Kelas" : "Class") : (lang === "id" ? "Nama" : "Name")}</th>
                <th>{lang === "id" ? "Detail" : "Details"}</th>
                <th>{lang === "id" ? "Status" : "Status"}</th>
                <th>{role === "admin" ? (lang === "id" ? "Pembayaran" : "Payment") : (lang === "id" ? "Ringkasan" : "Summary")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || index}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="student-avatar">{initials(row.name)}</span>
                      <span className="font-semibold text-[#294a55] font-outfit">{row.name}</span>
                    </div>
                  </td>
                  <td>{row.meta}</td>
                  <td><span className="status-pill">{row.status}</span></td>
                  <td><span className={`payment-state ${row.tone}`}>{row.detail}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={UserRound}
          title={lang === "id" ? "Belum ada data" : "No data yet"}
          text={lang === "id" ? "Data terbaru akan tampil di sini." : "Recent activity will appear here."}
        />
      )}
    </GlassCard>
  );
}

function ReminderCard({ announcements, lang }) {
  const latest = announcements[0];
  return (
    <section className="reminder-card" data-testid="card-announcements">
      <div className="relative z-10 max-w-[70%]">
        <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/70">
          {latest ? (lang === "id" ? "Pengumuman terbaru" : "Latest announcement") : (lang === "id" ? "Jangan lupa" : "Don't forget")}
        </div>
        <h2 className="text-xl font-semibold leading-tight text-white font-outfit">
          {latest?.title || (lang === "id" ? "Siapkan materi untuk kelas mendatang" : "Prepare materials for upcoming classes")}
        </h2>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/75">
          {latest?.body || (lang === "id" ? "Pastikan materi pembelajaran siap sebelum sesi dimulai." : "Keep lesson resources ready before the next session begins.")}
        </p>
        <Link className="reminder-button" to={latest ? "/announcements" : "/materials"}>
          {latest ? (lang === "id" ? "Lihat pengumuman" : "View announcement") : (lang === "id" ? "Lihat materi" : "View materials")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="reminder-art" aria-hidden="true">
        <span className="art-orb" />
        <span className="art-book"><BookOpen /></span>
        <span className="art-spark"><Sparkles /></span>
        <span className="art-message"><Megaphone /></span>
      </div>
    </section>
  );
}

function CardSkeleton({ compact = false }) {
  return (
    <div className={`skeleton-stack ${compact ? "py-1" : "py-4"}`} aria-label="Loading">
      <span />
      <span />
      {!compact && <span />}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center text-center">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/55 text-[#356f83]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-[#294a55] font-outfit">{title}</div>
      <div className="mt-1 text-[11px] text-[#78908f]">{text}</div>
    </div>
  );
}

function initials(value = "") {
  return value.split(" ").filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase() || "EC";
}
