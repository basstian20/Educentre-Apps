import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Modal, Empty, ErrorState, SkeletonCards } from "@/components/UI";
import { ConfirmModal, NoMatches, Pagination, RowActions, SearchBox, useTable } from "@/components/TableTools";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLoadState } from "@/lib/useLoadState";
import { api, formatApiError, fmtIDR } from "@/lib/api";
import { Plus, BookOpen, GraduationCap, Clock, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function Classes() {
  const { t } = useLang();
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [educators, setEducators] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const blankForm = () => ({
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
  const [form, setForm] = useState(blankForm);

  const [state, track] = useLoadState();
  const load = () => track(api.get("/classes").then((r) => setClasses(r.data || [])));
  useEffect(() => {
    load();
    api.get("/educators").then((r) => setEducators(r.data || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const table = useTable(classes, {
    searchKeys: ["subject_name", "level", "room", "educator_name"],
    sorters: { name: (c) => c.subject_name },
    defaultSort: "name",
    pageSize: 9,
  });

  const openAdd = () => {
    setEditing(null);
    setForm(blankForm());
    setOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      ...blankForm(),
      subject_name: c.subject_name || "",
      level: c.level || "",
      educator_id: c.educator_id || "",
      room: c.room || "",
      description: c.description || "",
      color_hex: c.color_hex || "#3B82F6",
      capacity: c.capacity ?? 0,
      fee_amount: c.fee_amount ?? 0,
      schedule_days: c.schedule_days || [],
      time_start: c.time_start || "08:00",
      time_end: c.time_end || "09:30",
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        await api.patch(`/classes/${editing.id}`, form);
        toast.success(t.saved);
      } else {
        await api.post("/classes", form);
        toast.success(t.toastClassCreated);
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/classes/${removing.id}`);
      toast.success(t.removed);
      setRemoving(null);
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
        <Btn onClick={openAdd} size="sm" testid="add-class-btn">
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
      {!state.loading && !state.error && classes.length > 0 && (
        <div className="mb-4 flex"><SearchBox value={table.query} onChange={table.setQuery} testid="class-search" /></div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.loading ? <SkeletonCards /> : state.error ? (
          <div className="col-span-full"><Card><ErrorState onRetry={load} /></Card></div>
        ) : classes.length === 0 ? (
          <div className="col-span-full"><Card><Empty message={t.noData} icon={BookOpen} action={isAdmin && <Btn size="sm" onClick={openAdd}><Plus className="w-4 h-4" />{t.addClass}</Btn>} /></Card></div>
        ) : table.total === 0 ? (
          <div className="col-span-full"><Card><NoMatches onClear={() => table.setQuery("")} /></Card></div>
        ) : (
          table.rows.map((c) => (
            <div
              key={c.id}
              className="clay-card clay-hover class-card"
              style={{ "--t": c.color_hex || "var(--pri)" }}
              data-testid={`class-card-${c.id}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2 pl-2">
                <div className="min-w-0 flex-1">
                  <div className="font-outfit font-extrabold text-slate-900 text-base [overflow-wrap:anywhere]">{c.subject_name}</div>
                  <div className="text-xs text-slate-600 font-jakarta mt-0.5">{c.level} · {c.room}</div>
                </div>
                {isAdmin && <div className="flex-shrink-0"><RowActions testid={`class-${c.id}`} onEdit={() => openEdit(c)} onDelete={() => setRemoving(c)} /></div>}
              </div>
              <div className="class-meta mt-3 pl-2">
                <div><GraduationCap />{c.educator_name || "—"}</div>
                <div><Clock />{c.time_start} – {c.time_end}</div>
                <div><CalendarDays />{(c.schedule_days || []).map((d) => t.days[d]).join(", ")}</div>
              </div>
              <div className="pl-2 pt-3 mt-3 border-t border-line">
                <div className="fill-bar" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, c.capacity ? ((c.enrolled_count || 0) / c.capacity) * 100 : 0)}%` }} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                  <span className="text-xs text-slate-600 font-jakarta">{c.enrolled_count}/{c.capacity} {t.enrolled.toLowerCase()}</span>
                  <span className="text-sm font-outfit font-extrabold text-slate-900">{fmtIDR(c.fee_amount)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Pagination table={table} />

      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        message={removing ? `${removing.subject_name}. ${t.deleteHint}` : ""}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `${t.edit}: ${editing.subject_name}` : t.addClass}
        size="lg"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn>
            <Btn onClick={submit} testid="submit-class">{t.save}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label={t.subject} value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} className="sm:col-span-2" testid="class-subject" />
          <Input label={t.level} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
          <Select
            label={t.educator}
            value={form.educator_id}
            onChange={(e) => setForm({ ...form, educator_id: e.target.value })}
            testid="class-educator"
            options={[{ value: "", label: t.selectPlaceholder }, ...educators.map((edu) => ({ value: edu.id, label: edu.full_name }))]}
          />
          <Input label={t.room} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          <Input label={t.capacity} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value || "0") })} />
          <Input label={`${t.fee} (IDR)`} type="number" value={form.fee_amount} onChange={(e) => setForm({ ...form, fee_amount: parseFloat(e.target.value || "0") })} />
          <Input label={t.colorLabel} type="color" value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} />
          <Input label={t.startTime} type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} />
          <Input label={t.endTime} type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} />
          <div className="sm:col-span-2">
            <span className="block text-xs font-bold text-slate-600 mb-1.5 font-jakarta">{t.schedule_days}</span>
            <div className="flex flex-wrap gap-2">
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
                  aria-pressed={form.schedule_days.includes(d)}
                  className={`day-chip ${form.schedule_days.includes(d) ? "is-on" : ""}`}
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
  const classesForDay = (day) =>
    classes
      .filter((c) => (c.schedule_days || []).includes(day))
      .sort((a, b) => (a.time_start || "").localeCompare(b.time_start || ""));

  return (
    <>
      <div className="space-y-3 md:hidden">
        {days.map((d) => (
          <div key={d} className="tt-day">
            <div className="tt-day-h font-outfit">
              {t.days[d]}
            </div>
            <div className="space-y-2 p-3">
              {classesForDay(d).length === 0 ? (
                <div className="text-xs text-slate-600 font-jakarta">{t.noClasses}</div>
              ) : (
                classesForDay(d).map((c) => (
                  <div key={`${c.id}-mobile-${d}`} className="tt-item" style={{ "--t": c.color_hex || "var(--pri)" }}>
                    <div className="font-outfit text-sm font-semibold text-slate-900">{c.subject_name}</div>
                    <div className="mt-1 text-xs text-slate-600 font-jakarta">
                      {c.time_start}-{c.time_end} - {c.room}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[760px] relative">
        <div className="tt-grid grid" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
          <div className="tt-head" />
          {days.map((d) => (
            <div key={d} className="tt-head font-outfit">
              {t.days[d]}
            </div>
          ))}
          {hours.map((h) => (
            <div key={`row-${h}`} className="contents">
              <div className="tt-hour font-jakarta" style={{ height: cellH }}>
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
                className="tt-block"
                style={{
                  top,
                  left,
                  width,
                  height: Math.max(40, height),
                  "--t": c.color_hex || "var(--pri)",
                }}
                title={c.subject_name}
              >
                <div className="tt-n truncate">{c.subject_name}</div>
                <div className="tt-s truncate">{c.room}</div>
                <div className="tt-s">{c.time_start}–{c.time_end}</div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </>
  );
}
