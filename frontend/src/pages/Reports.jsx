import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, StatTile, Empty } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { api, fmtIDR } from "@/lib/api";
import { TrendingUp, Users, BookOpen, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function Reports() {
  const { t } = useLang();
  const [stats, setStats] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
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
    });
  }, []);

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
  const STATUS_COLORS = { paid: "#10B981", unpaid: "#F59E0B", overdue: "#EF4444", partial: "#3B82F6" };

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
      { label: "Total Students", value: students.length },
      { label: "Total Classes", value: classes.length },
      { label: "Total Invoices", value: invoices.length },
      { label: "Paid Invoices", value: invoices.filter((i) => i.status === "paid").length },
      { label: "Overdue", value: invoices.filter((i) => i.status === "overdue").length },
      { label: "Total Revenue", value: fmtIDR(invoices.reduce((s, i) => s + (i.amount_paid || 0), 0)) },
    ],
    [students, classes, invoices]
  );

  return (
    <Layout title={t.reports} subtitle="Business intelligence & operational metrics">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label={t.activeStudents} value={stats.active_students ?? 0} icon={Users} color="#2563EB" />
        <StatTile label={t.activeClasses} value={stats.active_classes ?? 0} icon={BookOpen} color="#059669" />
        <StatTile label={t.revenueThisMonth} value={fmtIDR(stats.revenue_this_month)} icon={TrendingUp} color="#D97706" />
        <StatTile label={t.outstandingFees} value={fmtIDR(stats.outstanding_fees)} icon={AlertTriangle} color="#DC2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <Card title="Class Utilisation" testid="report-utilisation">
          {utilData.length === 0 ? <Empty message={t.noData} /> : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={utilData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="enrolled" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="capacity" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card title="Invoice Status Breakdown" testid="report-status">
          {statusData.length === 0 ? <Empty message={t.noData} /> : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius="42%" outerRadius="68%" dataKey="value" labelLine={false}>
                    {statusData.map((s, i) => <Cell key={i} fill={STATUS_COLORS[s.name] || "#94A3B8"} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        <Card title="Top Classes by Fee" testid="report-fees">
          <div className="space-y-2">
            {topClassesByFee.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-100">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-1 h-8 rounded-full" style={{ background: c.color_hex }} />
                    <div className="min-w-0">
                      <div className="font-outfit font-semibold text-sm">{c.subject_name}</div>
                      <div className="text-xs text-slate-500 font-jakarta">{c.educator_name}</div>
                    </div>
                  </div>
                  <span className="font-outfit font-bold text-sm">{fmtIDR(c.fee_amount)}</span>
                </div>
              ))}
          </div>
        </Card>
        <Card title="Quick Stats" testid="report-summary">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickMetrics.map((m) => (
              <div key={m.label} className="p-4 rounded-lg bg-slate-50">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-outfit">{m.label}</div>
                <div className="text-2xl font-outfit font-bold mt-1">{m.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
