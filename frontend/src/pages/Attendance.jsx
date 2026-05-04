import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Select, Empty, StatusBadge } from "@/components/UI";
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

export default function Attendance() {
  const { t } = useLang();
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [history, setHistory] = useState([]);

  const isMarker = user?.role === "admin" || user?.role === "educator";

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
    api.get("/attendance", { params: { class_id: classId } }).then((r) => setHistory(r.data || []));
  }, [classId, isMarker]);

  // For students/parents: load own attendance
  useEffect(() => {
    if (!isMarker) {
      api.get("/attendance").then((r) => setHistory(r.data || []));
    }
  }, [isMarker]);

  const submit = async () => {
    try {
      const records = Object.entries(marks).map(([student_id, status]) => ({ student_id, status }));
      await api.post("/attendance", { class_id: classId, session_date: date, records });
      toast.success("Attendance saved");
      api.get("/attendance", { params: { class_id: classId } }).then((r) => setHistory(r.data || []));
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
              <span className="block text-xs font-medium text-slate-600 mb-1.5 font-outfit">{t.dueDate}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="att-date"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm"
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
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100" data-testid={`att-row-${s.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-outfit font-semibold">
                      {s.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="font-outfit font-semibold text-sm">{s.full_name}</div>
                      <div className="text-xs text-slate-500 font-jakarta">{s.student_code}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {STATUSES.map((st) => (
                      <button
                        key={st.key}
                        data-testid={`att-${s.id}-${st.key}`}
                        onClick={() => setMarks({ ...marks, [s.id]: st.key })}
                        className={`attendance-btn ${marks[s.id] === st.key ? `active-${st.color}` : ""}`}
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

      <Card title={`Recent records (${history.length})`} className="mt-5" testid="att-history">
        {history.length === 0 ? <Empty message={t.noData} /> : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-outfit">
                  <th className="text-left px-5 py-3">{t.dueDate}</th>
                  <th className="text-left px-5 py-3">{t.student}</th>
                  <th className="text-left px-5 py-3">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 30).map((h) => (
                  <tr key={h.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 text-sm font-jakarta">{fmtDate(h.session_date)}</td>
                    <td className="px-5 py-3 text-sm font-jakarta">{h.student_id?.slice(0, 8)}…</td>
                    <td className="px-5 py-3"><StatusBadge status={h.status} label={t[`status${h.status?.charAt(0).toUpperCase()}${h.status?.slice(1)}`] || h.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
}
