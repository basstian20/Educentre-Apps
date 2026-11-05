import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Modal, Empty, ErrorState, SkeletonCards } from "@/components/UI";
import { ConfirmModal, NoMatches, Pagination, RowActions, SearchBox, useTable } from "@/components/TableTools";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLoadState } from "@/lib/useLoadState";
import { api, formatApiError, fmtIDR } from "@/lib/api";
import { Plus, BookOpen, GraduationCap, Clock, CalendarDays, Users } from "lucide-react";
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
                  <div className="font-heading font-extrabold text-slate-900 text-base [overflow-wrap:anywhere]">{c.subject_name}</div>
                  <div className="text-xs text-slate-600 font-sans mt-0.5">{c.level} · {c.room}</div>
                </div>
                {isAdmin && <div className="flex-shrink-0"><RowActions testid={`class-${c.id}`} onEdit={() => openEdit(c)} onDelete={() => setRemoving(c)} /></div>}
              </div>
              <div className="class-meta mt-3 pl-2">
                {(c.child_names || []).length > 0 && <div className="font-semibold"><Users />{c.child_names.join(", ")}</div>}
                <div><GraduationCap />{c.educator_name || "—"}</div>
                <div><Clock />{c.time_start} – {c.time_end}</div>
                <div><CalendarDays />{(c.schedule_days || []).map((d) => t.days[d]).join(", ")}</div>
              </div>
              <div className="pl-2 pt-3 mt-3 border-t border-line">
                <div className="fill-bar" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, c.capacity ? ((c.enrolled_count || 0) / c.capacity) * 100 : 0)}%` }} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                  <span className="text-xs text-slate-600 font-sans">{c.enrolled_count}/{c.capacity} {t.enrolled.toLowerCase()}</span>
                  {user?.role !== "student" && <span className="text-sm font-heading font-extrabold text-slate-900">{fmtIDR(c.fee_amount)}</span>}
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
            <span className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">{t.schedule_days}</span>
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

const toMin = (str) => {
  const [h, m] = (str || "00:00").split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Bagi kelas yang jamnya bertumpuk di satu hari ke beberapa lajur agar tidak saling menimpa. */
function layoutDay(items) {
  const sorted = items.slice().sort((a, b) => toMin(a.time_start) - toMin(b.time_start) || toMin(a.time_end) - toMin(b.time_end));
  const placed = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    cluster.forEach((p) => placed.push({ ...p, lanes }));
    cluster = [];
  };
  const laneEnds = [];
  sorted.forEach((c) => {
    const start = toMin(c.time_start);
    if (cluster.length && start >= clusterEnd) {
      flush();
      laneEnds.length = 0;
    }
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = toMin(c.time_end);
    cluster.push({ c, lane });
    clusterEnd = Math.max(clusterEnd, toMin(c.time_end));
  });
  if (cluster.length) flush();
  return placed;
}

function Timetable({ classes, t }) {
  const scheduled = classes.filter((c) => c.time_start && c.time_end);
  const hasKids = scheduled.some((c) => (c.child_names || []).length);
  const kidsOf = (c) => (c.child_names || []).join(", ");

  // Jam dan hari mengikuti jadwal yang ada: tidak menampilkan ruang kosong di luar itu.
  const startHour = scheduled.length ? Math.floor(Math.min(...scheduled.map((c) => toMin(c.time_start))) / 60) : 8;
  const endHour = scheduled.length ? Math.max(startHour + 1, Math.ceil(Math.max(...scheduled.map((c) => toMin(c.time_end))) / 60)) : 12;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const usedDays = [1, 2, 3, 4, 5, 6, 7].filter((d) => scheduled.some((c) => (c.schedule_days || []).includes(d)));
  const days = usedDays.length ? usedDays : [1, 2, 3, 4, 5];

  const headH = 40;
  const cellH = 56;
  const minHeight = hasKids ? 58 : 40;
  const classesForDay = (day) =>
    scheduled
      .filter((c) => (c.schedule_days || []).includes(day))
      .sort((a, b) => (a.time_start || "").localeCompare(b.time_start || ""));

  return (
    <>
      <div className="space-y-3 md:hidden">
        {days.map((d) => (
          <div key={d} className="tt-day">
            <div className="tt-day-h font-heading">
              {t.days[d]}
            </div>
            <div className="space-y-2 p-3">
              {classesForDay(d).map((c) => (
                <div key={`${c.id}-mobile-${d}`} className="tt-item" style={{ "--t": c.color_hex || "var(--pri)" }}>
                  <div className="font-heading text-sm font-semibold text-slate-900">{c.subject_name}</div>
                  {kidsOf(c) && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-800 font-sans" data-testid="tt-child">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">{kidsOf(c)}</span>
                    </div>
                  )}
                  <div className="mt-1 text-xs text-slate-600 font-sans">
                    {c.time_start}-{c.time_end} - {c.room}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {usedDays.length === 0 && <div className="text-xs text-slate-600 font-sans">{t.noClasses}</div>}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <div className="relative" style={{ minWidth: 60 + days.length * 108 }}>
          <div className="tt-grid grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, minmax(0, 1fr))`, gridTemplateRows: `${headH}px repeat(${hours.length}, ${cellH}px)` }}>
            <div className="tt-head" style={{ padding: 0 }} />
            {days.map((d) => (
              <div key={d} className="tt-head font-heading" style={{ padding: 0, lineHeight: `${headH}px` }}>
                {t.days[d]}
              </div>
            ))}
            {hours.map((h) => (
              <div key={`row-${h}`} className="contents">
                <div className="tt-hour font-sans">
                  {h}:00
                </div>
                {days.map((d) => (
                  <div key={`cell-${h}-${d}`} className="timetable-cell" />
                ))}
              </div>
            ))}
          </div>
          {/* Blok kelas */}
          {days.flatMap((d, dayIdx) =>
            layoutDay(classesForDay(d)).map(({ c, lane, lanes }) => {
              const top = headH + ((toMin(c.time_start) - startHour * 60) / 60) * cellH;
              const height = ((toMin(c.time_end) - toMin(c.time_start)) / 60) * cellH;
              const colW = `((100% - 60px) / ${days.length})`;
              return (
                <div
                  key={`${c.id}-${d}`}
                  className="tt-block"
                  style={{
                    top: top + 1,
                    left: `calc(60px + ${dayIdx} * ${colW} + ${colW} * ${lane} / ${lanes} + 2px)`,
                    width: `calc(${colW} / ${lanes} - 4px)`,
                    height: Math.max(minHeight, height - 2),
                    "--t": c.color_hex || "var(--pri)",
                  }}
                  title={[c.subject_name, kidsOf(c), c.room, `${c.time_start}–${c.time_end}`].filter(Boolean).join(" · ")}
                >
                  <div className="tt-n truncate">{c.subject_name}</div>
                  {kidsOf(c) && <div className="tt-kid truncate" data-testid="tt-child">{kidsOf(c)}</div>}
                  <div className="tt-s truncate">{c.room}</div>
                  <div className="tt-s">{c.time_start}–{c.time_end}</div>
                </div>
              );
            })
          )}
        </div>
        {usedDays.length === 0 && <div className="py-3 text-center text-xs text-slate-600 font-sans">{t.noClasses}</div>}
      </div>
    </>
  );
}
