import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, FileText } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, Empty, ErrorState, SkeletonRows } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useLoadState } from "@/lib/useLoadState";
import { api, fmtDate } from "@/lib/api";

export default function Results() {
  const { t } = useLang();
  const [grades, setGrades] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [kids, setKids] = useState([]);

  const [state, track] = useLoadState();
  const load = useCallback(
    () =>
      track(
        Promise.all([api.get("/grades"), api.get("/assessments"), api.get("/classes")]).then(([g, a, c]) => {
          setGrades(g.data || []);
          setAssessments(a.data || []);
          setClasses(c.data || []);
        })
      ),
    [track]
  );
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get("/students").then((r) => setKids(r.data || [])).catch(() => {});
  }, []);

  const enriched = grades
    .map((g) => {
      const a = assessments.find((x) => x.id === g.assessment_id);
      const c = a ? classes.find((cl) => cl.id === a.class_id) : null;
      return { ...g, assessment: a, classObj: c };
    })
    .filter((g) => g.assessment);

  return (
    <Layout
      title={t.myResults}
      subtitle="Published assessments only"
      actions={kids.map((k) => (
        <Link
          key={k.id}
          to={`/students/${k.id}/report`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 font-outfit"
          data-testid={`report-link-${k.id}`}
        >
          <FileText className="h-4 w-4" />
          {t.reportCard}{kids.length > 1 ? `: ${k.full_name}` : ""}
        </Link>
      ))}
    >
      <Card>
        {state.loading ? <SkeletonRows /> : state.error ? <ErrorState onRetry={load} /> : enriched.length === 0 ? <Empty message={t.noData} icon={ClipboardList} /> : (
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-outfit">
                  <th className="text-left px-5 py-3">{t.subject}</th>
                  <th className="text-left px-5 py-3">{t.assessmentName}</th>
                  <th className="text-left px-5 py-3">{t.score}</th>
                  <th className="text-left px-5 py-3">Grade</th>
                  <th className="text-left px-5 py-3">{t.dueDate}</th>
                  <th className="text-left px-5 py-3">{t.remark}</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((g) => (
                  <tr key={g.id} className="border-t border-slate-100 row-hover" data-testid={`result-row-${g.id}`}>
                    <td className="px-5 py-3 font-outfit font-semibold text-sm">{g.classObj?.subject_name || "—"}</td>
                    <td className="px-5 py-3 text-sm">{g.assessment.name}</td>
                    <td className="px-5 py-3 font-outfit font-semibold">{g.score}/{g.max_score}</td>
                    <td className="px-5 py-3"><span className="badge badge-blue">{g.letter_grade || "—"}</span></td>
                    <td className="px-5 py-3 text-sm font-jakarta">{fmtDate(g.assessment.assessment_date)}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 font-jakarta">{g.remark || "—"}</td>
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
