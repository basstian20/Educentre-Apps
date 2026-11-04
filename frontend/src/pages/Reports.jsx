import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, StatTile, Empty, ErrorState, SkeletonCards, SkeletonRows } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useLoadState } from "@/lib/useLoadState";
import { api, fmtIDR } from "@/lib/api";
import { TrendingUp, Users, BookOpen, AlertTriangle, Download } from "lucide-react";
import { Btn } from "@/components/UI";
import { exportCsv } from "@/lib/csv";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// Recharts menulis warna sebagai atribut SVG, yang tidak mengenal var(--token).
// Nilai token dibaca dari CSS dan dibaca ulang saat tema terang/gelap berganti.
const TOKENS = ["pri", "ok", "warn", "bad", "mut", "ink", "soft", "line", "surface"];
function useTokens() {
  const read = () => {
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(TOKENS.map((k) => [k, cs.getPropertyValue(`--${k}`).trim()]));
  };
  const [tok, setTok] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setTok(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return tok;
}

export default function Reports() {
  const { t } = useLang();
  const tok = useTokens();
  const [stats, setStats] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [state, track] = useLoadState();
  const load = useCallback(
    () =>
      track(
        Promise.all([
          api.get("/dashboard/stats"),
          api.get("/invoices"),
          api.get("/classes"),
          api.get("/students"),
        ]).then(([s, i, c, st]) => {
          setStats(s.data || {});
          setInvoices(i.data || []);
          setClasses(c.data || []);
          setStudents(st.data || []);
        })
      ),
    [track]
  );
  useEffect(() => { load(); }, [load]);

  // Status breakdown — memoised
  const statusData = useMemo(
    () =>
      Object.entries(
        invoices.reduce((acc, inv) => {
          acc[inv.status] = (acc[inv.status] || 0) + 1;
          return acc;
        }, {})
      ).map(([k, v]) => ({ name: k, value: v })),
    [invoices]
  );
  const STATUS_COLORS = { paid: tok.ok, unpaid: tok.warn, overdue: tok.bad, partial: tok.pri };
  const AXIS = { fontSize: 12, fill: tok.mut };
  const TIP = { contentStyle: { background: tok.surface, border: `1px solid ${tok.line}`, borderRadius: 16, color: tok.ink, fontSize: 12 }, itemStyle: { color: tok.ink }, cursor: { fill: tok.soft } };

  // Class utilisation — memoised
  const utilData = useMemo(
    () => classes.map((c) => ({ name: c.subject_name?.slice(0, 14), enrolled: c.enrolled_count || 0, capacity: c.capacity })),
    [classes]
  );

  // Top classes by fee — memoised expensive sort
  const topClassesByFee = useMemo(
    () => classes.slice().sort((a, b) => (b.fee_amount || 0) - (a.fee_amount || 0)).slice(0, 6),
    [classes]
  );

  // Quick stats — memoised aggregation
  const quickMetrics = useMemo(
    () => [
      { label: t.rpTotalStudents, value: students.length },
      { label: t.rpTotalClasses, value: classes.length },
      { label: t.rpTotalInvoices, value: invoices.length },
      { label: t.rpPaidInvoices, value: invoices.filter((i) => i.status === "paid").length },
      { label: t.statusOverdue, value: invoices.filter((i) => i.status === "overdue").length },
      { label: t.rpTotalRevenue, value: fmtIDR(invoices.reduce((s, i) => s + (i.amount_paid || 0), 0)) },
    ],
    [students, classes, invoices, t]
  );

  const exportClasses = () =>
    exportCsv("class-report.csv", [
      { label: t.subject, value: (c) => c.subject_name },
      { label: t.level, value: (c) => c.level },
      { label: t.educator, value: (c) => c.educator_name },
      { label: t.enrolled, value: (c) => c.enrolled_count },
      { label: t.capacity, value: (c) => c.capacity },
      { label: t.fee, value: (c) => c.fee_amount },
    ], classes);

  return (
    <Layout
      title={t.reports}
      subtitle={t.rpSubtitle}
      actions={<Btn variant="outline" size="sm" onClick={exportClasses} disabled={classes.length === 0} ariaLabel={t.exportCsv} testid="export-report-btn"><Download className="w-4 h-4" /><span className="hidden sm:inline">{t.exportCsv}</span></Btn>}
    >
      {state.loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><SkeletonCards count={4} /></div>
          <Card className="mt-5"><SkeletonRows rows={4} /></Card>
        </>
      ) : state.error ? (
        <Card><ErrorState onRetry={load} /></Card>
      ) : (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label={t.activeStudents} value={stats.active_students ?? 0} icon={Users} color="var(--c1)" />
        <StatTile label={t.activeClasses} value={stats.active_classes ?? 0} icon={BookOpen} color="var(--c4)" />
        <StatTile label={t.revenueThisMonth} value={fmtIDR(stats.revenue_this_month)} icon={TrendingUp} color="var(--c3)" />
        <StatTile label={t.outstandingFees} value={fmtIDR(stats.outstanding_fees)} icon={AlertTriangle} color="var(--c5)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <Card title={t.rpClassUtilisation} testid="report-utilisation">
          {utilData.length === 0 ? <Empty message={t.noData} /> : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={utilData}>
                  <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                  <Tooltip {...TIP} />
                  <Bar dataKey="enrolled" fill={tok.pri} radius={[10, 10, 0, 0]} />
                  <Bar dataKey="capacity" fill={tok.soft} stroke={tok.line} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card title={t.rpInvoiceStatus} testid="report-status">
          {statusData.length === 0 ? <Empty message={t.noData} /> : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius="42%" outerRadius="68%" dataKey="value" labelLine={false}>
                    {statusData.map((s, i) => <Cell key={i} fill={STATUS_COLORS[s.name] || tok.mut} stroke={tok.surface} strokeWidth={3} />)}
                  </Pie>
                  <Tooltip {...TIP} />
                  <Legend wrapperStyle={{ fontSize: 12, color: tok.mut }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <Card title={t.rpTopClasses} testid="report-fees">
          <div className="space-y-2">
            {topClassesByFee.map((c) => (
                <div key={c.id} className="att-row sm:flex-wrap" style={{ "--t": c.color_hex || "var(--pri)" }}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-8 w-1.5 rounded-full" style={{ background: "var(--t)" }} />
                    <div className="min-w-0">
                      <div className="font-heading font-semibold text-sm">{c.subject_name}</div>
                      <div className="text-xs text-slate-600 font-sans">{c.educator_name}</div>
                    </div>
                  </div>
                  <span className="font-heading font-bold text-sm">{fmtIDR(c.fee_amount)}</span>
                </div>
              ))}
          </div>
        </Card>
        <Card title={t.rpQuickStats} testid="report-summary">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickMetrics.map((m) => (
              <div key={m.label} className="metric-tile">
                <div className="k font-heading">{m.label}</div>
                <div className="v">{m.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      </>
      )}
    </Layout>
  );
}
