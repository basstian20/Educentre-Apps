import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Empty } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { api, fmtDate } from "@/lib/api";

export default function Results() {
  const { t } = useLang();
  const [grades, setGrades] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/grades"), api.get("/assessments"), api.get("/classes")]).then(([g, a, c]) => {
      setGrades(g.data || []);
      setAssessments(a.data || []);
      setClasses(c.data || []);
    });
  }, []);

  const enriched = grades
    .map((g) => {
      const a = assessments.find((x) => x.id === g.assessment_id);
      const c = a ? classes.find((cl) => cl.id === a.class_id) : null;
      return { ...g, assessment: a, classObj: c };
    })
    .filter((g) => g.assessment);

  return (
    <Layout title={t.myResults} subtitle="Published assessments only">
      <Card>
        {enriched.length === 0 ? <Empty message={t.noData} /> : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full">
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
