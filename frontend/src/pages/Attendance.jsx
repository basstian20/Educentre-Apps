import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Select, Empty, StatusBadge } from "@/components/UI";
import { useTx } from "@/components/dashboard/widgets";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, fmtDate, formatApiError } from "@/lib/api";
import { toast } from "sonner";

const STATUSES = [
  { key: "present", color: "present" },
  { key: "late", color: "late" },
  { key: "absent", color: "absent" },
  { key: "excused", color: "excused" },
];

const HISTORY_PAGE = 100;

export default function Attendance() {
  const { t } = useLang();
  const tx = useTx();
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loadingMore, setLoadingMore] = useState(false);

  const isMarker = user?.role === "admin" || user?.role === "educator";

  // Riwayat dipaginasi di server: satu bulan per tampilan, "muat lebih banyak" untuk sisanya.
  const historyParams = useCallback(
    (extra = {}) => ({
      ...(classId ? { class_id: classId } : {}),
      ...(month ? { date_from: `${month}-01`, date_to: `${month}-31` } : {}),
      limit: HISTORY_PAGE,
      ...extra,
    }),
    [classId, month],
  );

  const loadHistory = useCallback(() => {
    if (isMarker && !classId) {
      setHistory([]);
      setTotal(0);
      return Promise.resolve();
    }
    return api
      .get("/attendance", { params: historyParams() })
      .then((r) => {
        setHistory(r.data?.items || []);
        setTotal(r.data?.total || 0);
      })
      .catch(() => {
        setHistory([]);
        setTotal(0);
      });
  }, [isMarker, classId, historyParams]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await api.get("/attendance", { params: historyParams({ skip: history.length }) });
      setHistory((prev) => [...prev, ...(r.data?.items || [])]);
      setTotal(r.data?.total || 0);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data || []));
  }, []);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      setMarks({});
      return;
    }
    if (isMarker) {
      // load enrolled students
      api.get("/enrollments", { params: { class_id: classId } }).then(async (r) => {
        const ids = (r.data || []).filter((e) => e.status === "active").map((e) => e.student_id);
        if (ids.length) {
          const all = await api.get("/students").then((rr) => rr.data || []);
          const list = all.filter((s) => ids.includes(s.id));
          setStudents(list);
          const initial = {};
          list.forEach((s) => (initial[s.id] = "present"));
          setMarks(initial);
        } else {
          setStudents([]);
        }
      });
    }
  }, [classId, isMarker]);

  const submit = async () => {
    try {
      const records = Object.entries(marks).map(([student_id, status]) => ({ student_id, status }));
      await api.post("/attendance", { class_id: classId, session_date: date, records });
      toast.success(t.toastAttendanceSaved);
      loadHistory();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <Layout title={isMarker ? t.markAttendance : t.attendance} subtitle={fmtDate(date)}>
      {isMarker && (
        <Card className="mb-5" testid="att-controls">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              label={t.classes}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              testid="att-class"
              options={[{ value: "", label: "—" }, ...classes.map((c) => ({ value: c.id, label: c.subject_name }))]}
            />
            <div>
              <span className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">{t.dueDate}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="att-date"
                className="field-clay h-11 px-4 text-sm"
              />
            </div>
          </div>
        </Card>
      )}

      {isMarker && classId && (
        <Card title={`${students.length} ${t.students.toLowerCase()}`} testid="att-grid"
          action={<Btn onClick={submit} testid="att-submit">{t.save}</Btn>}
        >
          {students.length === 0 ? <Empty message={t.noData} /> : (
            <div className="space-y-2">
              {students.map((s) => (
                <div key={s.id} className="att-row" data-testid={`att-row-${s.id}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="avatar-clay" style={{ "--t": "var(--c2)" }}>
                      {s.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-heading font-semibold text-sm">{s.full_name}</div>
                      <div className="text-xs text-slate-600 font-sans">{s.student_code}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:justify-end">
                    {STATUSES.map((st) => (
                      <button
                        key={st.key}
                        data-testid={`att-${s.id}-${st.key}`}
                        onClick={() => setMarks({ ...marks, [s.id]: st.key })}
                        className={`attendance-btn w-full sm:w-auto ${marks[s.id] === st.key ? `active-${st.color}` : ""}`}
                      >
                        {t[`status${st.key.charAt(0).toUpperCase()}${st.key.slice(1)}`]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card
        title={`${tx("Riwayat presensi", "Attendance records")} (${history.length}/${total})`}
        className="mt-5"
        testid="att-history"
        action={
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            data-testid="att-month"
            aria-label={tx("Bulan", "Month")}
            className="field-clay h-10 px-3 text-sm"
          />
        }
      >
        {history.length === 0 ? <Empty message={t.noData} /> : (
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <table className="rtable clay-table w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3">{t.dueDate}</th>
                  <th className="text-left px-5 py-3">{t.student}</th>
                  <th className="text-left px-5 py-3">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="px-5 py-3 text-sm font-sans">{fmtDate(h.session_date)}</td>
                    <td className="px-5 py-3 text-sm font-sans">{h.student_name}</td>
                    <td className="px-5 py-3"><StatusBadge status={h.status} label={t[`status${h.status?.charAt(0).toUpperCase()}${h.status?.slice(1)}`] || h.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length < total && (
              <div className="px-5 pt-4 text-center">
                <Btn variant="outline" onClick={loadMore} disabled={loadingMore} testid="att-load-more">
                  {loadingMore ? "…" : tx("Muat lebih banyak", "Load more")}
                </Btn>
              </div>
            )}
          </div>
        )}
      </Card>
    </Layout>
  );
}
