import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Modal, Empty } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, formatApiError, fmtIDR } from "@/lib/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function Classes() {
  const { t } = useLang();
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [educators, setEducators] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject_name: "",
    level: "Year 5",
    educator_id: "",
    room: "Room A",
    description: "",
    color_hex: "#3B82F6",
    capacity: 20,
    fee_amount: 600000,
    schedule_days: [1, 3],
    time_start: "08:00",
    time_end: "09:30",
  });

  const load = () => api.get("/classes").then((r) => setClasses(r.data || []));
  useEffect(() => {
    load();
    api.get("/educators").then((r) => setEducators(r.data || []));
  }, []);

  const submit = async () => {
    try {
      await api.post("/classes", form);
      toast.success("Class created");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <Layout
      title={user?.role === "student" ? t.mySchedule : t.classes}
      subtitle={`${classes.length} ${t.classes.toLowerCase()}`}
      actions={isAdmin && (
        <Btn onClick={() => setOpen(true)} size="sm" testid="add-class-btn">
          <Plus className="w-4 h-4" />
          {t.addClass}
        </Btn>
      )}
    >
      {/* Weekly Timetable */}
      <Card title={t.timetable} testid="timetable-card" className="mb-5">
        <Timetable classes={classes} t={t} />
      </Card>

      {/* Class list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-3"><Empty message={t.noData} /></div>
        ) : (
          classes.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:-translate-y-0.5 transition-transform"
              data-testid={`class-card-${c.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-1 self-stretch rounded-full mr-3" style={{ background: c.color_hex }} />
                <div className="flex-1">
                  <div className="font-outfit font-semibold text-slate-900">{c.subject_name}</div>
                  <div className="text-xs text-slate-500 font-jakarta mt-0.5">{c.level} · {c.room}</div>
                </div>
              </div>
              <div className="text-xs text-slate-600 font-jakarta mt-3">
                <div>👩‍🏫 {c.educator_name || "—"}</div>
                <div className="mt-1">🕐 {c.time_start} – {c.time_end}</div>
                <div className="mt-1">📅 {(c.schedule_days || []).map((d) => t.days[d]).join(", ")}</div>
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-jakarta">{c.enrolled_count}/{c.capacity} {t.enrolled.toLowerCase()}</span>
                <span className="text-xs font-outfit font-semibold text-slate-900">{fmtIDR(c.fee_amount)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.addClass}
        size="lg"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn>
            <Btn onClick={submit} testid="submit-class">{t.save}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label={t.subject} value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} className="col-span-2" testid="class-subject" />
          <Input label={t.level} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
          <Select
            label={t.educator}
            value={form.educator_id}
            onChange={(e) => setForm({ ...form, educator_id: e.target.value })}
            testid="class-educator"
            options={[{ value: "", label: "— Select —" }, ...educators.map((edu) => ({ value: edu.id, label: edu.full_name }))]}
          />
          <Input label={t.room} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          <Input label={t.capacity} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value || "0") })} />
          <Input label={`${t.fee} (IDR)`} type="number" value={form.fee_amount} onChange={(e) => setForm({ ...form, fee_amount: parseFloat(e.target.value || "0") })} />
          <Input label="Color" type="color" value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} />
          <Input label="Start" type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} />
          <Input label="End" type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} />
          <div className="col-span-2">
            <span className="block text-xs font-medium text-slate-600 mb-1.5 font-outfit">{t.schedule_days}</span>
            <div className="flex gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  data-testid={`day-toggle-${d}`}
                  onClick={() =>
                    setForm({
                      ...form,
                      schedule_days: form.schedule_days.includes(d) ? form.schedule_days.filter((x) => x !== d) : [...form.schedule_days, d],
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-outfit font-semibold border transition ${
                    form.schedule_days.includes(d)
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  {t.days[d]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

function Timetable({ classes, t }) {
  const startHour = 8;
  const endHour = 18;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const days = [1, 2, 3, 4, 5, 6, 7];

  const minutesFromStart = (timeStr) => {
    const [h, m] = (timeStr || "00:00").split(":").map(Number);
    return (h - startHour) * 60 + m;
  };
  const cellH = 56;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px] relative">
        <div className="grid border-l border-t border-slate-200" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
          <div className="bg-slate-50 border-r border-b border-slate-200" />
          {days.map((d) => (
            <div key={d} className="text-center py-2 bg-slate-50 border-r border-b border-slate-200 text-xs font-outfit font-semibold text-slate-600">
              {t.days[d]}
            </div>
          ))}
          {hours.map((h) => (
            <div key={`row-${h}`} className="contents">
              <div className="text-center text-[11px] text-slate-400 py-1 border-r border-b border-slate-200 font-jakarta" style={{ height: cellH }}>
                {h}:00
              </div>
              {days.map((d) => (
                <div key={`cell-${h}-${d}`} className="timetable-cell" />
              ))}
            </div>
          ))}
        </div>
        {/* Render class blocks */}
        {classes.map((c) =>
          (c.schedule_days || []).map((d) => {
            const dayIdx = days.indexOf(d);
            if (dayIdx < 0) return null;
            const top = (minutesFromStart(c.time_start) / 60) * cellH + cellH; // first row is header
            const height = ((minutesFromStart(c.time_end) - minutesFromStart(c.time_start)) / 60) * cellH;
            const left = `calc(60px + ${dayIdx} * ((100% - 60px) / 7) + 2px)`;
            const width = `calc((100% - 60px) / 7 - 4px)`;
            return (
              <div
                key={`${c.id}-${d}`}
                className="absolute rounded-lg p-2 shadow-sm border-l-2 cursor-pointer hover:-translate-y-0.5 transition"
                style={{
                  top,
                  left,
                  width,
                  height: Math.max(40, height),
                  background: `${c.color_hex}1A`,
                  borderColor: c.color_hex,
                }}
                title={c.subject_name}
              >
                <div className="text-[11px] font-outfit font-semibold text-slate-900 truncate">{c.subject_name}</div>
                <div className="text-[10px] text-slate-600 font-jakarta truncate">{c.room}</div>
                <div className="text-[10px] text-slate-500 font-jakarta">{c.time_start}–{c.time_end}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
