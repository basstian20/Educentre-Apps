import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { api, fmtIDR } from "@/lib/api";
import { AreaChart, Donut, Ring } from "@/components/dashboard/charts";
import {
  DCard,
  EmptyBlock,
  FlipCard,
  KpiTile,
  SkeletonBlock,
  Timeline,
  initials,
  localISO,
  sessionStatus,
  todayDow,
  useNow,
  useTx,
} from "@/components/dashboard/widgets";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Megaphone,
  Receipt,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

const ROLE_COPY = {
  admin: { en: "Centre overview", id: "Ikhtisar pusat" },
  educator: { en: "Teaching overview", id: "Ikhtisar mengajar" },
  student: { en: "Learning overview", id: "Ikhtisar belajar" },
  parent: { en: "Family overview", id: "Ikhtisar keluarga" },
};

/** Rupiah ringkas untuk kartu KPI yang sempit; jumlah lengkap tampil di baris keterangan. */
const compactIDR = (lang) => (n) => {
  const abs = Math.abs(n);
  const unit = lang === "id"
    ? [[1e9, " M"], [1e6, " jt"], [1e3, " rb"]]
    : [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  const hit = unit.find(([size]) => abs >= size);
  if (!hit) return fmtIDR(n);
  const value = new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-GB", { maximumFractionDigits: 1 }).format(n / hit[0]);
  return `Rp ${value}${hit[1]}`;
};
const studentsLabel = (tx, n) => `${n} ${n === 1 ? tx("siswa", "student") : tx("siswa", "students")}`;

const ok = (result, fallback) => (result?.status === "fulfilled" ? result.value.data ?? fallback : fallback);
const sum = (list) => list.reduce((a, b) => a + b, 0);
const average = (list) => (list.length ? sum(list) / list.length : null);

export default function Dashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const tx = useTx();
  const now = useNow();
  const role = user?.role;

  const [data, setData] = useState({ stats: {}, announcements: [], classes: [], students: [], invoices: [], grades: [], assessments: [], attendance: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [kidId, setKidId] = useState(null);
  const [kidAttendance, setKidAttendance] = useState([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const wanted = {
      stats: "/dashboard/stats",
      announcements: "/announcements",
      classes: "/classes",
      ...(role === "admin" && { students: "/students", invoices: "/invoices", attendance: "/attendance", payments: "/payments" }),
      ...(role === "educator" && { attendance: "/attendance", assessments: "/assessments" }),
      ...((role === "student" || role === "parent") && { invoices: "/invoices", grades: "/grades", assessments: "/assessments" }),
    };
    const keys = Object.keys(wanted);
    Promise.allSettled(keys.map((key) => api.get(wanted[key]))).then((results) => {
      if (!active) return;
      const next = { stats: {}, announcements: [], classes: [], students: [], invoices: [], grades: [], assessments: [], attendance: [], payments: [] };
      keys.forEach((key, i) => {
        next[key] = ok(results[i], key === "stats" ? {} : []);
      });
      setData(next);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user?.id, role]);

  const { stats, announcements, classes, students, invoices, grades, assessments, attendance, payments } = data;

  // Siswa/orang tua: anak yang sedang dilihat (orang tua bisa memilih).
  const kids = useMemo(() => {
    if (role === "parent") return stats.children || [];
    if (role === "student" && stats.student) return [stats.student];
    return [];
  }, [role, stats]);
  const kid = kids.find((k) => k.id === kidId) || kids[0] || null;

  useEffect(() => {
    if (!kid?.id || (role !== "student" && role !== "parent")) {
      setKidAttendance([]);
      return undefined;
    }
    let active = true;
    api
      .get("/attendance", { params: { student_id: kid.id } })
      .then((r) => active && setKidAttendance(r.data || []))
      .catch(() => active && setKidAttendance([]));
    return () => {
      active = false;
    };
  }, [kid?.id, role]);

  const firstName = (user?.full_name || "").split(" ")[0];
  const dateLabel = new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now);
  // stats.today_classes belum memuat nama pengajar dan jumlah siswa; lengkapi dari /classes.
  const todayClasses = useMemo(() => {
    const byId = Object.fromEntries(classes.map((c) => [c.id, c]));
    const source = role === "educator" || role === "student" || role === "parent"
      ? (stats.today_classes || []).map((c) => ({ ...c, ...(byId[c.id] || {}) }))
      : classes.filter((c) => (c.schedule_days || []).includes(todayDow(now)));
    return source.slice().sort((a, b) => String(a.time_start).localeCompare(String(b.time_start)));
  }, [role, stats, classes, now]);

  const common = { data, loading, tx, lang, now, todayClasses, kid, kids, setKidId, kidAttendance };

  return (
    <Layout title={tx("Dasbor", "Dashboard")} subtitle={`${tx("Selamat datang", "Welcome")}, ${firstName} · ${ROLE_COPY[role]?.[lang] || dateLabel}`}>
      <div className="dg" data-testid="dashboard-overview">
        {role === "admin" && <AdminView {...common} />}
        {role === "educator" && <EducatorView {...common} />}
        {(role === "student" || role === "parent") && <FamilyView {...common} role={role} />}
        <AnnouncementsCard announcements={announcements} loading={loading} tx={tx} />
      </div>
    </Layout>
  );
}

/* ---------- Data turunan ---------- */

/** Persen hadir per tanggal sesi (maksimal 8 tanggal terakhir). Nyata dari catatan absensi. */
function attendanceSeries(records, lang) {
  const byDate = {};
  records.forEach((r) => {
    if (!r.session_date) return;
    byDate[r.session_date] = byDate[r.session_date] || { present: 0, total: 0 };
    byDate[r.session_date].total += 1;
    if (r.status === "present") byDate[r.session_date].present += 1;
  });
  const dates = Object.keys(byDate).sort().slice(-8);
  return {
    values: dates.map((d) => Math.round((100 * byDate[d].present) / byDate[d].total)),
    labels: dates.map((d) => new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short" }).format(new Date(`${d}T00:00:00`))),
  };
}

/** Pendapatan per bulan (6 bulan terakhir yang punya pembayaran), untuk mini-grafik. */
function revenueSeries(payments) {
  const byMonth = {};
  payments.forEach((p) => {
    const key = (p.paid_at || "").slice(0, 7);
    if (key) byMonth[key] = (byMonth[key] || 0) + (Number(p.amount) || 0);
  });
  return Object.keys(byMonth).sort().slice(-6).map((k) => byMonth[k]);
}

/* ---------- Admin ---------- */

function AdminView({ data, loading, tx, lang, now, todayClasses }) {
  const { stats, students, invoices, classes, attendance, payments } = data;
  const today = localISO(now);
  const series = useMemo(() => attendanceSeries(attendance, lang), [attendance, lang]);
  const spark = useMemo(() => revenueSeries(payments), [payments]);
  const counts = useMemo(() => {
    const c = { paid: 0, partial: 0, unpaid: 0, overdue: 0 };
    invoices.forEach((i) => {
      if (c[i.status] !== undefined) c[i.status] += 1;
    });
    return c;
  }, [invoices]);
  const paidPct = invoices.length ? Math.round((100 * counts.paid) / invoices.length) : 0;
  const nameOf = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s.full_name])), [students]);
  const openInvoices = useMemo(
    () => invoices.filter((i) => i.status !== "paid").sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))).slice(0, 4),
    [invoices],
  );
  // Sesi yang sudah mulai hari ini tetapi absensinya belum ada.
  const unsaved = useMemo(
    () => todayClasses.filter((c) => sessionStatus(c, now) !== "next" && !attendance.some((a) => a.class_id === c.id && a.session_date === today)),
    [todayClasses, attendance, now, today],
  );

  return (
    <>
      <div className="dg-kpis" data-testid="metric-grid">
        <KpiTile loading={loading} tone={1} icon={Users} testid="stat-students" label={tx("Siswa aktif", "Active students")} value={stats.active_students ?? 0} sub={tx(`dari ${students.length} terdaftar`, `of ${students.length} enrolled`)} />
        <KpiTile loading={loading} tone={2} icon={BookOpen} testid="stat-classes" label={tx("Kelas aktif", "Active classes")} value={stats.active_classes ?? 0} sub={tx("sedang berjalan", "running")} />
        <KpiTile loading={loading} tone={3} icon={GraduationCap} testid="stat-educators" label={tx("Pengajar aktif", "Active educators")} value={stats.active_educators ?? 0} sub={tx("aktif mengajar", "teaching")} />
        <KpiTile loading={loading} tone={4} icon={TrendingUp} testid="stat-revenue" label={tx("Pendapatan bulan ini", "Monthly revenue")} value={Number(stats.revenue_this_month) || 0} format={compactIDR(lang)} sub={fmtIDR(stats.revenue_this_month || 0)} spark={spark} />
        <KpiTile loading={loading} tone={5} icon={Wallet} testid="stat-outstanding" label={tx("Belum lunas", "Outstanding")} value={Number(stats.outstanding_fees) || 0} format={compactIDR(lang)} sub={`${fmtIDR(stats.outstanding_fees || 0)} · ${tx(`${stats.overdue_invoices ?? 0} terlambat`, `${stats.overdue_invoices ?? 0} overdue`)}`} />
      </div>

      <DCard className="span-4" testid="card-learning-statistics" title={tx("Kehadiran per tanggal sesi", "Attendance by session date")} to="/reports">
        {loading ? <SkeletonBlock /> : series.values.length ? (
          <AreaChart values={series.values} labels={series.labels} unit="%" label={tx("Grafik persentase kehadiran per tanggal sesi", "Attendance percentage by session date")} />
        ) : (
          <EmptyBlock icon={CalendarDays} title={tx("Belum ada data kehadiran", "No attendance data yet")} text={tx("Grafik muncul setelah absensi diisi.", "The chart appears once attendance is recorded.")} />
        )}
      </DCard>

      <DCard className="span-2" title={tx("Status tagihan", "Invoice status")} to="/invoices">
        {loading ? <SkeletonBlock /> : invoices.length ? (
          <>
            <Donut
              label={tx("Diagram status tagihan", "Invoice status chart")}
              center={[`${paidPct}%`, tx("lunas", "paid")]}
              segments={[
                { value: counts.paid, color: "var(--ok)" },
                { value: counts.partial, color: "var(--info)" },
                { value: counts.unpaid, color: "var(--warn)" },
                { value: counts.overdue, color: "var(--bad)" },
              ]}
            />
            <div className="legend">
              <span><i style={{ background: "var(--ok)" }} />{tx("Lunas", "Paid")} {counts.paid}</span>
              <span><i style={{ background: "var(--info)" }} />{tx("Sebagian", "Partial")} {counts.partial}</span>
              <span><i style={{ background: "var(--warn)" }} />{tx("Belum", "Unpaid")} {counts.unpaid}</span>
              <span><i style={{ background: "var(--bad)" }} />{tx("Terlambat", "Overdue")} {counts.overdue}</span>
            </div>
          </>
        ) : (
          <EmptyBlock icon={Receipt} title={tx("Belum ada tagihan", "No invoices yet")} />
        )}
      </DCard>

      <DCard className="span-3" testid="card-next-class" title={tx("Jadwal hari ini", "Today's schedule")} to="/classes" action={tx("Lihat jadwal", "View schedule")}>
        {loading ? <SkeletonBlock /> : todayClasses.length ? (
          <Timeline
            items={todayClasses.map((c) => ({
              id: c.id,
              title: c.subject_name,
              time: `${c.time_start || "--:--"}–${c.time_end || "--:--"}`,
              meta: `${c.educator_name || tx("Pengajar", "Educator")} · ${c.room || tx("Ruang belum ditentukan", "Room to be confirmed")} · ${studentsLabel(tx, c.enrolled_count ?? 0)}`,
              status: sessionStatus(c, now),
            }))}
          />
        ) : (
          <EmptyBlock title={tx("Tidak ada kelas hari ini", "No classes today")} text={tx("Jadwal berikutnya akan muncul di sini.", "Your next scheduled class will appear here.")} />
        )}
      </DCard>

      <DCard className="span-3" title={tx("Perlu tindakan", "Needs attention")}>
        {loading ? <SkeletonBlock /> : unsaved.length || stats.overdue_invoices ? (
          <ul className="dlist">
            {unsaved.map((c) => (
              <li key={c.id} className="alert">
                <span className="grow"><b>{tx(`Absensi ${c.subject_name} belum diisi`, `${c.subject_name} attendance not recorded`)}</b><small>{c.time_start} · {c.educator_name}</small></span>
                <Link className="dbtn" to="/attendance">{tx("Buka", "Open")}</Link>
              </li>
            ))}
            {stats.overdue_invoices > 0 && (
              <li className="alert">
                <span className="grow"><b>{tx(`${stats.overdue_invoices} tagihan terlambat`, `${stats.overdue_invoices} overdue invoices`)}</b><small>{tx("Catat pembayaran atau hubungi orang tua", "Record a payment or contact parents")}</small></span>
                <Link className="dbtn" to="/invoices">{tx("Lihat", "View")}</Link>
              </li>
            )}
          </ul>
        ) : (
          <EmptyBlock icon={CheckCircle2} title={tx("Semua beres", "All clear")} />
        )}
      </DCard>

      <DCard className="span-2" title={tx("Kapasitas kelas", "Class capacity")} to="/classes">
        {loading ? <SkeletonBlock /> : classes.length ? (
          <div className="rings">
            {classes.slice(0, 6).map((c) => {
              const cap = Number(c.capacity) || 0;
              const n = Number(c.enrolled_count) || 0;
              return <Ring key={c.id} pct={cap ? (100 * n) / cap : 0} value={`${n}/${cap}`} sub={c.subject_name} color={c.color_hex || "var(--pri)"} />;
            })}
          </div>
        ) : (
          <EmptyBlock icon={BookOpen} title={tx("Belum ada kelas", "No classes yet")} />
        )}
      </DCard>

      <DCard className="span-4" title={tx("Tagihan terbuka", "Open invoices")} to="/invoices">
        {loading ? <SkeletonBlock /> : openInvoices.length ? (
          <ul className="dlist">
            {openInvoices.map((i) => (
              <li key={i.id}>
                <span className="grow"><b>{nameOf[i.student_id] || i.student_name || i.invoice_number}</b><small>{i.invoice_number} · {tx("tempo", "due")} {i.due_date}</small></span>
                <b className="num">{fmtIDR(i.balance_due)}</b>
                <span className={`badge ${i.status === "overdue" ? "badge-red" : i.status === "partial" ? "badge-blue" : "badge-amber"}`}>
                  {i.status === "overdue" ? tx("Terlambat", "Overdue") : i.status === "partial" ? tx("Sebagian", "Partial") : tx("Belum bayar", "Unpaid")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyBlock icon={CheckCircle2} title={tx("Tidak ada tagihan terbuka", "No open invoices")} />
        )}
      </DCard>

      <StudentTable className="span-6" students={students} invoices={invoices} loading={loading} tx={tx} />
    </>
  );
}

function StudentTable({ className, students, invoices, loading, tx }) {
  const rows = students.slice(0, 6).map((s) => {
    const due = invoices.some((i) => i.student_id === s.id && i.status !== "paid");
    return { id: s.id, name: s.full_name, meta: s.student_code || s.school_year || "Student", status: s.status || "active", due };
  });
  return (
    <DCard className={className} testid="card-overview-table" title={tx("Ringkasan siswa", "Student overview")} to="/students">
      {loading ? <SkeletonBlock /> : rows.length ? (
        <div className="overflow-x-auto">
          <table className="overview-table">
            <thead>
              <tr>
                <th>{tx("Nama", "Name")}</th>
                <th>{tx("Detail", "Details")}</th>
                <th>{tx("Status", "Status")}</th>
                <th>{tx("Pembayaran", "Payment")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><div className="flex items-center gap-2.5"><span className="student-avatar">{initials(row.name)}</span><span className="font-semibold">{row.name}</span></div></td>
                  <td>{row.meta}</td>
                  <td><span className={`badge ${row.status === "active" ? "badge-green" : "badge-gray"}`}>{row.status}</span></td>
                  <td><span className={`badge ${row.due ? "badge-amber" : "badge-green"}`}>{row.due ? tx("Belum lunas", "Payment due") : tx("Lunas", "Clear")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyBlock icon={UserRound} title={tx("Belum ada data", "No data yet")} text={tx("Data terbaru akan tampil di sini.", "Recent activity will appear here.")} />
      )}
    </DCard>
  );
}

/* ---------- Educator ---------- */

function EducatorView({ data, loading, tx, lang, now, todayClasses }) {
  const { stats, classes, attendance, assessments } = data;
  const today = localISO(now);
  const myIds = useMemo(() => new Set(classes.map((c) => c.id)), [classes]);
  const mine = useMemo(() => attendance.filter((a) => myIds.has(a.class_id)), [attendance, myIds]);
  const series = useMemo(() => attendanceSeries(mine, lang), [mine, lang]);
  const saved = (c) => mine.some((a) => a.class_id === c.id && a.session_date === today);
  const savedCount = todayClasses.filter(saved).length;
  const drafts = useMemo(() => assessments.filter((a) => !a.is_published && myIds.has(a.class_id)), [assessments, myIds]);
  const classOf = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);

  return (
    <>
      <div className="dg-kpis k4" data-testid="metric-grid">
        <KpiTile loading={loading} tone={1} icon={BookOpen} testid="stat-myclasses" label={tx("Kelas saya", "My classes")} value={stats.my_classes ?? 0} sub={tx("aktif", "active")} />
        <KpiTile loading={loading} tone={2} icon={Users} testid="stat-mystudents" label={tx("Total siswa", "Total students")} value={stats.total_students ?? 0} sub={tx("di semua kelas", "across all classes")} />
        <KpiTile loading={loading} tone={3} icon={CalendarDays} testid="stat-today" label={tx("Kelas hari ini", "Classes today")} value={todayClasses.length} sub={tx("sesi", "sessions")} />
        <KpiTile loading={loading} tone={5} icon={Award} testid="stat-pending" label={tx("Penilaian tertunda", "Pending assessments")} value={stats.pending_assessments ?? 0} sub={tx("belum terbit", "unpublished")} />
      </div>

      <DCard className="span-4" testid="card-learning-statistics" title={tx("Kehadiran kelas saya", "My classes' attendance")} to="/attendance" action={tx("Isi absensi", "Mark attendance")}>
        {loading ? <SkeletonBlock /> : series.values.length ? (
          <AreaChart values={series.values} labels={series.labels} unit="%" label={tx("Grafik persentase kehadiran kelas saya", "Attendance percentage of my classes")} />
        ) : (
          <EmptyBlock icon={CalendarDays} title={tx("Belum ada data kehadiran", "No attendance data yet")} text={tx("Grafik muncul setelah absensi diisi.", "The chart appears once attendance is recorded.")} />
        )}
      </DCard>

      <DCard className="span-2" title={tx("Absensi hari ini", "Today's attendance")}>
        {loading ? <SkeletonBlock /> : (
          <Donut
            label={tx("Diagram absensi hari ini", "Today's attendance chart")}
            center={[`${savedCount}/${todayClasses.length}`, tx("tersimpan", "saved")]}
            segments={[
              { value: savedCount, color: "var(--ok)" },
              { value: Math.max(0, todayClasses.length - savedCount), color: "var(--warn)" },
            ]}
          />
        )}
      </DCard>

      <DCard className="span-3" testid="card-next-class" title={tx("Jadwal hari ini", "Today's schedule")} to="/classes" action={tx("Lihat jadwal", "View schedule")}>
        <div data-testid="card-overview-table">
          {loading ? <SkeletonBlock /> : todayClasses.length ? (
            <Timeline
              items={todayClasses.map((c) => ({
                id: c.id,
                title: c.subject_name,
                time: `${c.time_start || "--:--"}–${c.time_end || "--:--"}`,
                meta: `${c.room || tx("Ruang belum ditentukan", "Room to be confirmed")} · ${studentsLabel(tx, classOf[c.id]?.enrolled_count ?? 0)}`,
                status: sessionStatus(c, now),
                extra: saved(c)
                  ? <span className="badge badge-green">{tx("Absen tersimpan", "Attendance saved")}</span>
                  : <Link className="dbtn" to="/attendance">{tx("Isi absensi", "Mark attendance")}</Link>,
              }))}
            />
          ) : (
            <EmptyBlock title={tx("Tidak ada kelas hari ini", "No classes today")} text={tx("Jadwal berikutnya akan muncul di sini.", "Your next scheduled class will appear here.")} />
          )}
        </div>
      </DCard>

      <DCard className="span-3" title={tx("Nilai menunggu", "Grades waiting")} to="/grades">
        {loading ? <SkeletonBlock /> : drafts.length ? (
          <ul className="dlist">
            {drafts.slice(0, 5).map((a) => (
              <li key={a.id}>
                <span className="grow"><b>{a.name}</b><small>{classOf[a.class_id]?.subject_name} · {a.assessment_date}</small></span>
                <span className="badge badge-amber">{tx("Draf", "Draft")}</span>
                <Link className="dbtn" to="/grades">{tx("Input", "Enter")}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyBlock icon={Award} title={tx("Semua nilai sudah terbit", "All grades published")} />
        )}
      </DCard>
    </>
  );
}

/* ---------- Siswa dan orang tua ---------- */

function FamilyView({ data, loading, tx, lang, now, todayClasses, kid, kids, setKidId, kidAttendance, role }) {
  const { stats, invoices, grades, assessments, classes } = data;
  const kidGrades = useMemo(() => grades.filter((g) => !kid || g.student_id === kid.id), [grades, kid]);
  const kidInvoices = useMemo(() => invoices.filter((i) => !kid || i.student_id === kid.id), [invoices, kid]);
  const assessmentOf = useMemo(() => Object.fromEntries(assessments.map((a) => [a.id, a])), [assessments]);
  const classOf = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);

  const scored = useMemo(() => kidGrades.filter((g) => g.percentage !== null && g.percentage !== undefined), [kidGrades]);
  const avg = average(scored.map((g) => Number(g.percentage)));
  const passed = scored.filter((g) => g.is_passed).length;
  const attPct = kidAttendance.length
    ? Math.round((100 * kidAttendance.filter((a) => a.status === "present").length) / kidAttendance.length)
    : Math.round(Number(stats.attendance_pct ?? 100));
  const subjects = useMemo(() => {
    const by = {};
    scored.forEach((g) => {
      const cls = classOf[assessmentOf[g.assessment_id]?.class_id];
      const key = cls?.id || "other";
      by[key] = by[key] || { id: key, name: cls?.subject_name || tx("Lainnya", "Other"), color: cls?.color_hex, values: [] };
      by[key].values.push(Number(g.percentage));
    });
    return Object.values(by).map((s) => ({ ...s, avg: average(s.values) }));
  }, [scored, classOf, assessmentOf, tx]);

  const next = todayClasses.find((c) => sessionStatus(c, now) !== "done");
  const nextStatus = next ? sessionStatus(next, now) : null;
  const progress = (() => {
    if (!next || nextStatus !== "now") return 0;
    const [sh, sm] = String(next.time_start).split(":").map(Number);
    const [eh, em] = String(next.time_end).split(":").map(Number);
    const total = eh * 60 + em - (sh * 60 + sm);
    return total > 0 ? Math.round((100 * (now.getHours() * 60 + now.getMinutes() - (sh * 60 + sm))) / total) : 0;
  })();
  const openInvoices = kidInvoices.filter((i) => i.status !== "paid").slice(0, 3);
  const recent = scored.slice(0, 4);
  const kidName = kid?.full_name || "";

  return (
    <>
      {role === "parent" && kids.length > 0 && (
        <div className="kids span-6" data-testid="card-overview-table">
          {kids.map((k) => (
            <button key={k.id} type="button" className={`kidc clay-card clay-hover ${k.id === kid?.id ? "on" : ""}`} onClick={() => setKidId(k.id)} aria-pressed={k.id === kid?.id}>
              <span className="student-avatar">{initials(k.full_name)}</span>
              <span className="min-w-0"><b>{k.full_name}</b><small>{k.school_year || k.student_code}</small></span>
            </button>
          ))}
        </div>
      )}

      <div className="dg-kpis k4" data-testid="metric-grid">
        <KpiTile loading={loading} tone={1} icon={BookOpen} testid="stat-classes" label={tx("Kelas aktif", "Active classes")} value={stats.active_classes ?? 0} />
        <KpiTile loading={loading} tone={4} icon={CheckCircle2} testid="stat-attendance" label={tx("Kehadiran", "Attendance rate")} value={attPct} format={(n) => `${n}%`} sub={role === "parent" && kid ? kid.full_name.split(" ")[0] : undefined} />
        <KpiTile loading={loading} tone={5} icon={Receipt} testid="stat-fees" label={tx("Tagihan aktif", "Outstanding fees")} value={Number(stats.outstanding_fees) || 0} format={compactIDR(lang)} sub={fmtIDR(stats.outstanding_fees || 0)} />
        <KpiTile loading={loading} tone={3} icon={CalendarDays} testid="stat-today" label={tx("Kelas hari ini", "Classes today")} value={todayClasses.length} />
      </div>

      <DCard className="span-4 hero" testid="card-next-class" title={tx(`Kelas berikutnya${role === "parent" && kidName ? ` · ${kidName.split(" ")[0]}` : ""}`, `Next class${role === "parent" && kidName ? ` · ${kidName.split(" ")[0]}` : ""}`)} to="/classes" action={tx("Lihat jadwal", "View schedule")}>
        {loading ? <SkeletonBlock /> : next ? (
          <div className="hero-c" style={{ "--c": next.color_hex || "var(--pri)" }}>
            <div className="min-w-0">
              <h3>{next.subject_name}</h3>
              <p>{tx("Hari ini", "Today")} · {next.time_start}–{next.time_end} · {next.room || tx("Ruang belum ditentukan", "Room to be confirmed")}</p>
              <p className="who">{next.educator_name || tx("Pengajar", "Educator")}</p>
              <span className={`badge ${nextStatus === "now" ? "badge-green" : nextStatus === "done" ? "badge-gray" : "badge-blue"}`}>
                {nextStatus === "now" ? tx("Sedang berjalan", "In progress") : nextStatus === "done" ? tx("Selesai", "Done") : tx("Akan datang", "Upcoming")}
              </span>
            </div>
            <Ring pct={progress} value={nextStatus === "now" ? `${progress}%` : "—"} sub={tx("berjalan", "elapsed")} color={next.color_hex || "var(--pri)"} />
          </div>
        ) : (
          <EmptyBlock
            title={todayClasses.length ? tx("Tidak ada kelas lagi hari ini", "No more classes today") : tx("Tidak ada kelas hari ini", "No classes today")}
            text={tx("Jadwal berikutnya akan muncul di sini.", "Your next scheduled class will appear here.")}
          />
        )}
      </DCard>

      <div className="span-2 flipwrap">
        {kid && !loading ? (
          <FlipCard key={kid.id} name={kid.full_name} code={kid.student_code} meta={[kid.school_year, kid.school_name].filter(Boolean).join(" · ")} avg={avg} subjects={subjects} />
        ) : (
          <DCard><SkeletonBlock /></DCard>
        )}
      </div>

      <DCard className="span-3" testid="card-learning-statistics" title={tx("Ringkasan belajar", "Learning summary")} to="/results">
        {loading ? <SkeletonBlock /> : (
          <div className="rings r3">
            <Ring pct={attPct} value={`${attPct}%`} sub={tx("Kehadiran", "Attendance")} color="var(--ok)" />
            <Ring pct={avg ?? 0} value={avg === null ? "—" : Math.round(avg)} sub={tx("Rata-rata nilai", "Average score")} color="var(--pri)" />
            <Ring pct={scored.length ? (100 * passed) / scored.length : 0} value={`${passed}/${scored.length}`} sub={tx("Lulus", "Passed")} color="var(--info)" />
          </div>
        )}
      </DCard>

      <DCard className="span-3" title={tx("Biaya", "Fees")} to="/invoices" action={tx("Detail", "Details")}>
        {loading ? <SkeletonBlock /> : openInvoices.length ? (
          <ul className="dlist">
            {openInvoices.map((i) => (
              <li key={i.id}>
                <span className="grow"><b>{i.invoice_number}</b><small>{tx("tempo", "due")} {i.due_date}</small></span>
                <b className="num">{fmtIDR(i.balance_due)}</b>
                <span className={`badge ${i.status === "overdue" ? "badge-red" : i.status === "partial" ? "badge-blue" : "badge-amber"}`}>
                  {i.status === "overdue" ? tx("Terlambat", "Overdue") : i.status === "partial" ? tx("Sebagian", "Partial") : tx("Belum bayar", "Unpaid")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyBlock icon={CheckCircle2} title={tx("Tidak ada tagihan terbuka", "No open invoices")} />
        )}
      </DCard>

      <DCard className="span-6" {...(role === "student" ? { testid: "card-overview-table" } : {})} title={tx("Hasil terbaru", "Recent results")} to="/results">
        {loading ? <SkeletonBlock /> : recent.length ? (
          <ul className="dlist">
            {recent.map((g) => {
              const a = assessmentOf[g.assessment_id];
              const good = g.is_passed;
              return (
                <li key={g.id}>
                  <span className="grow"><b>{a?.name || g.letter_grade || tx("Hasil belajar", "Learning result")}</b><small>{classOf[a?.class_id]?.subject_name} · {a?.assessment_date}</small></span>
                  <div className="pbar"><i className={good ? "" : "bad"} style={{ width: `${Math.max(0, Math.min(100, g.percentage))}%` }} /></div>
                  <span className={`score ${good ? "" : "bad"}`}>{Math.round(g.percentage)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyBlock icon={Award} title={tx("Belum ada hasil terbit", "No published results yet")} />
        )}
      </DCard>
    </>
  );
}

/* ---------- Pengumuman (semua peran) ---------- */

function AnnouncementsCard({ announcements, loading, tx }) {
  const list = announcements.slice(0, 3);
  return (
    <DCard className="span-6" testid="card-announcements" title={tx("Pengumuman terbaru", "Latest announcements")} to="/announcements">
      {loading ? <SkeletonBlock /> : list.length ? (
        <ul className="dlist">
          {list.map((a) => (
            <li key={a.id} className="an">
              <span className="clay-orb dempty-ic" aria-hidden="true"><Megaphone className="h-4 w-4" /></span>
              <span className="grow"><b>{a.title}</b><small className="clamp2">{a.body}</small></span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyBlock icon={Megaphone} title={tx("Belum ada pengumuman", "No announcements yet")} text={tx("Pengumuman baru akan tampil di sini.", "New announcements will appear here.")} />
      )}
    </DCard>
  );
}
