import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PrintSheet, { Field, SheetHeader } from "@/components/PrintSheet";
import { useLang } from "@/lib/i18n";
import { useLoadState } from "@/lib/useLoadState";
import { api, fmtDate } from "@/lib/api";

const pct = (v) => (v == null ? "—" : `${v}%`);

export default function ReportCard() {
  const { t } = useLang();
  const { sid } = useParams();
  const [report, setReport] = useState(null);
  const [state, track] = useLoadState();

  const load = useCallback(() => track(api.get(`/students/${sid}/report`).then((r) => setReport(r.data))), [sid, track]);
  useEffect(() => { load(); }, [load]);

  return (
    <PrintSheet loading={state.loading} error={state.error} onRetry={load}>
      {report && (
        <>
          <SheetHeader centre={report.centre} heading={t.reportCardHeading} meta={`${t.generatedOn} ${fmtDate(report.generated_at)}`} />

          <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label={t.name}>{report.student.full_name}</Field>
            <Field label={t.code}>{report.student.student_code}</Field>
            <Field label={t.school}>{report.student.school_name}</Field>
            <Field label={t.yearLevel}>{report.student.school_year}</Field>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-300 p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-outfit">{t.attendanceSummary}</div>
              <div className="mt-1 font-outfit text-2xl font-bold text-slate-900">{pct(report.attendance.percentage)}</div>
              <div className="mt-1 text-xs text-slate-600 font-jakarta">
                {["present", "late", "absent", "excused"]
                  .map((k) => `${report.attendance[k]} ${(t[`status${k[0].toUpperCase()}${k.slice(1)}`] || k).toLowerCase()}`)
                  .join(" · ")}
              </div>
            </div>
            <div className="rounded-xl border border-slate-300 p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-outfit">{t.averageScore}</div>
              <div className="mt-1 font-outfit text-2xl font-bold text-slate-900">{pct(report.average_percentage)}</div>
            </div>
          </section>

          {report.classes.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-outfit">{t.classes}</h2>
              <table className="w-full text-left text-sm font-jakarta">
                <thead>
                  <tr className="border-b border-slate-300 text-[11px] uppercase tracking-wider text-slate-600 font-outfit">
                    <th className="py-2">{t.subject}</th>
                    <th className="py-2">{t.educator}</th>
                    <th className="py-2 text-right">{t.attendance}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.classes.map((c, i) => {
                    const a = c.attendance;
                    const total = a.present + a.late + a.absent + a.excused;
                    return (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2">{c.subject_name}{c.level ? ` (${c.level})` : ""}</td>
                        <td className="py-2">{c.educator_name}</td>
                        <td className="py-2 text-right">{total ? `${a.present + a.late}/${total}` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-outfit">{t.results}</h2>
            {report.grades.length === 0 ? (
              <p className="text-sm text-slate-600 font-jakarta">{t.noData}</p>
            ) : (
              <table className="w-full text-left text-sm font-jakarta">
                <thead>
                  <tr className="border-b border-slate-300 text-[11px] uppercase tracking-wider text-slate-600 font-outfit">
                    <th className="py-2">{t.subject}</th>
                    <th className="py-2">{t.assessmentName}</th>
                    <th className="py-2">{t.dueDate}</th>
                    <th className="py-2 text-right">{t.score}</th>
                    <th className="py-2 text-right">{t.gradeLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.grades.map((g, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2">{g.class_name}</td>
                      <td className="py-2">{g.assessment_name}</td>
                      <td className="py-2">{fmtDate(g.date)}</td>
                      <td className="py-2 text-right">{g.score}/{g.max_score}</td>
                      <td className="py-2 text-right font-semibold">{g.letter_grade || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <footer className="mt-10 text-center text-[11px] text-slate-500 font-jakarta">{t.printFooter}</footer>
        </>
      )}
    </PrintSheet>
  );
}
