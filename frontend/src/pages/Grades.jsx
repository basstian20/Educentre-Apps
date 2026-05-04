import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Modal, Empty, StatusBadge } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, fmtDate, formatApiError } from "@/lib/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Grades() {
  const { t } = useLang();
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [selectedAssId, setSelectedAssId] = useState("");
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ class_id: "", name: "", type: "test", assessment_date: new Date().toISOString().slice(0, 10), max_score: 100, pass_score: 50, weightage: 30 });

  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data || []));
  }, []);

  useEffect(() => {
    if (!classId) return;
    api.get("/assessments", { params: { class_id: classId } }).then((r) => setAssessments(r.data || []));
    api.get("/enrollments", { params: { class_id: classId } }).then(async (r) => {
      const ids = (r.data || []).filter((e) => e.status === "active").map((e) => e.student_id);
      if (ids.length) {
        const all = await api.get("/students").then((rr) => rr.data || []);
        setStudents(all.filter((s) => ids.includes(s.id)));
      } else setStudents([]);
    });
  }, [classId]);

  useEffect(() => {
    if (!selectedAssId) return;
    api.get("/grades", { params: { assessment_id: selectedAssId } }).then((r) => {
      const map = {};
      (r.data || []).forEach((g) => { map[g.student_id] = { score: g.score, remark: g.remark }; });
      setGrades(map);
    });
  }, [selectedAssId]);

  const create = async () => {
    try {
      await api.post("/assessments", { ...form, class_id: classId });
      toast.success("Assessment created");
      setOpen(false);
      api.get("/assessments", { params: { class_id: classId } }).then((r) => setAssessments(r.data || []));
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const saveGrades = async () => {
    if (!selectedAssId) return;
    try {
      const entries = students.map((s) => ({ student_id: s.id, score: grades[s.id]?.score ? parseFloat(grades[s.id].score) : null, remark: grades[s.id]?.remark || "" }));
      await api.post("/grades", { assessment_id: selectedAssId, entries });
      toast.success("Grades saved");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const publish = async () => {
    if (!selectedAssId) return;
    try {
      await api.post("/assessments/publish", { assessment_id: selectedAssId });
      toast.success("Published");
      api.get("/assessments", { params: { class_id: classId } }).then((r) => setAssessments(r.data || []));
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const ass = assessments.find((a) => a.id === selectedAssId);
  const isAdminOrEdu = user?.role === "admin" || user?.role === "educator";

  return (
    <Layout title={t.enterGrades} subtitle={isAdminOrEdu ? "Manage assessments and scores" : "View results"}>
      <Card className="mb-5" testid="grades-controls"
        action={isAdminOrEdu && classId && (
          <Btn onClick={() => { setForm({ ...form, class_id: classId }); setOpen(true); }} size="sm" testid="new-assessment-btn">
            <Plus className="w-4 h-4" />
            {t.assessmentName}
          </Btn>
        )}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label={t.classes} value={classId} onChange={(e) => { setClassId(e.target.value); setSelectedAssId(""); }} testid="grade-class"
            options={[{ value: "", label: "—" }, ...classes.map((c) => ({ value: c.id, label: c.subject_name }))]} />
          <Select label="Assessment" value={selectedAssId} onChange={(e) => setSelectedAssId(e.target.value)} testid="grade-assessment"
            options={[{ value: "", label: "—" }, ...assessments.map((a) => ({ value: a.id, label: `${a.name} (${a.type})` }))]} />
        </div>
      </Card>

      {ass && (
        <Card
          title={ass.name}
          testid="grade-table"
          action={
            isAdminOrEdu && (
              <div className="flex gap-2">
                <StatusBadge status={ass.is_published ? "published" : "unpublished"} label={ass.is_published ? t.published : t.unpublished} />
                <Btn onClick={saveGrades} size="sm" testid="save-grades">{t.saveAll}</Btn>
                {!ass.is_published && <Btn onClick={publish} size="sm" variant="success" testid="publish-grades">{t.publish}</Btn>}
              </div>
            )
          }
        >
          {students.length === 0 ? <Empty message={t.noData} /> : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-outfit">
                    <th className="text-left px-5 py-3">{t.student}</th>
                    <th className="text-left px-5 py-3">{t.score} / {ass.max_score}</th>
                    <th className="text-left px-5 py-3">{t.remark}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100" data-testid={`grade-row-${s.id}`}>
                      <td className="px-5 py-3">
                        <div className="font-outfit font-semibold text-sm">{s.full_name}</div>
                        <div className="text-xs text-slate-500 font-jakarta">{s.student_code}</div>
                      </td>
                      <td className="px-5 py-3 w-32">
                        <input
                          type="number"
                          value={grades[s.id]?.score ?? ""}
                          onChange={(e) => setGrades({ ...grades, [s.id]: { ...(grades[s.id] || {}), score: e.target.value } })}
                          data-testid={`grade-score-${s.id}`}
                          className="w-24 h-9 px-2 rounded-lg border border-slate-300 text-sm"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          value={grades[s.id]?.remark ?? ""}
                          onChange={(e) => setGrades({ ...grades, [s.id]: { ...(grades[s.id] || {}), remark: e.target.value } })}
                          data-testid={`grade-remark-${s.id}`}
                          className="w-full h-9 px-2 rounded-lg border border-slate-300 text-sm"
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Assessment"
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn><Btn onClick={create} testid="submit-assessment">{t.save}</Btn></>}
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label={t.assessmentName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2" testid="ass-name" />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[{ value: "quiz", label: "Quiz" }, { value: "test", label: "Test" }, { value: "assignment", label: "Assignment" }, { value: "project", label: "Project" }]} />
          <Input label={t.dueDate} type="date" value={form.assessment_date} onChange={(e) => setForm({ ...form, assessment_date: e.target.value })} />
          <Input label={t.maxScore} type="number" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: parseFloat(e.target.value) })} />
          <Input label="Pass Score" type="number" value={form.pass_score} onChange={(e) => setForm({ ...form, pass_score: parseFloat(e.target.value) })} />
        </div>
      </Modal>
    </Layout>
  );
}
