import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Select, Empty } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { api, fmtIDR, formatApiError } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Enrollment() {
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]);

  useEffect(() => {
    api.get("/students").then((r) => setStudents(r.data || []));
    api.get("/classes").then((r) => setClasses(r.data || []));
  }, []);

  const totalFee = selectedClasses.reduce((sum, cid) => {
    const c = classes.find((x) => x.id === cid);
    return sum + (c?.fee_amount || 0);
  }, 0);

  const submit = async () => {
    try {
      for (const cid of selectedClasses) {
        await api.post("/enrollments", { student_id: studentId, class_id: cid });
      }
      toast.success("Enrollment confirmed");
      setStep(1);
      setStudentId("");
      setSelectedClasses([]);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const steps = [t.studentInfo, t.selectCourses, t.feePlan, t.confirmStep];

  return (
    <Layout title={t.enrollment} subtitle="4-step wizard">
      {/* Stepper */}
      <Card className="mb-5" testid="enrollment-stepper">
        <div className="flex items-center justify-between">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-outfit ${
                    step > i + 1
                      ? "bg-blue-600 text-white"
                      : step === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium font-outfit ${step >= i + 1 ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-3 ${step > i + 1 ? "bg-blue-600" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {step === 1 && (
        <Card title={t.studentInfo}>
          <Select
            label={t.selectStudent}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            testid="enroll-select-student"
            options={[{ value: "", label: "—" }, ...students.map((s) => ({ value: s.id, label: `${s.full_name} (${s.student_code})` }))]}
          />
          <div className="mt-5 flex justify-end">
            <Btn disabled={!studentId} onClick={() => setStep(2)} testid="enroll-next-1">{t.next}</Btn>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title={t.selectCourses} testid="enroll-courses">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {classes.map((c) => {
              const checked = selectedClasses.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  data-testid={`enroll-class-${c.id}`}
                  onClick={() =>
                    setSelectedClasses(checked ? selectedClasses.filter((x) => x !== c.id) : [...selectedClasses, c.id])
                  }
                  className={`text-left p-4 rounded-xl border-2 transition ${
                    checked ? "border-blue-600 bg-blue-50/40" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-outfit font-semibold text-sm">{c.subject_name}</div>
                      <div className="text-xs text-slate-500 font-jakarta mt-0.5">{c.educator_name} · {c.room}</div>
                      <div className="text-xs text-slate-500 font-jakarta mt-1">
                        {(c.schedule_days || []).map((d) => t.days[d]).join(", ")} · {c.time_start}–{c.time_end}
                      </div>
                    </div>
                    <div className="text-sm font-outfit font-bold">{fmtIDR(c.fee_amount)}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex justify-between">
            <Btn variant="ghost" onClick={() => setStep(1)}>{t.back}</Btn>
            <Btn disabled={selectedClasses.length === 0} onClick={() => setStep(3)} testid="enroll-next-2">{t.next}</Btn>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title={t.feePlan} testid="enroll-feeplan">
          <div className="space-y-2">
            {selectedClasses.map((cid) => {
              const c = classes.find((x) => x.id === cid);
              return (
                <div key={cid} className="flex justify-between p-3 rounded-lg border border-slate-200">
                  <span className="text-sm font-jakarta">{c?.subject_name}</span>
                  <span className="text-sm font-outfit font-semibold">{fmtIDR(c?.fee_amount)}</span>
                </div>
              );
            })}
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 mt-3">
              <span className="font-outfit font-semibold">{t.totalPerMonth}</span>
              <span className="font-outfit font-bold text-lg">{fmtIDR(totalFee)}</span>
            </div>
          </div>
          <div className="mt-5 flex justify-between">
            <Btn variant="ghost" onClick={() => setStep(2)}>{t.back}</Btn>
            <Btn onClick={() => setStep(4)} testid="enroll-next-3">{t.next}</Btn>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card title={t.confirmStep} testid="enroll-confirm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">{t.student}</span><span className="font-outfit font-semibold">{students.find((s) => s.id === studentId)?.full_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{t.classes}</span><span className="font-outfit font-semibold text-right">{selectedClasses.map((cid) => classes.find((c) => c.id === cid)?.subject_name).join(", ")}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{t.totalPerMonth}</span><span className="font-outfit font-bold">{fmtIDR(totalFee)}</span></div>
          </div>
          <div className="mt-5 flex justify-between">
            <Btn variant="ghost" onClick={() => setStep(3)}>{t.back}</Btn>
            <Btn variant="success" onClick={submit} testid="enroll-submit">{t.confirm}</Btn>
          </div>
        </Card>
      )}
    </Layout>
  );
}
