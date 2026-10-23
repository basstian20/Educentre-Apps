import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, StatusBadge, Modal, Empty, ErrorState, SkeletonRows } from "@/components/UI";
import { ConfirmModal, NoMatches, Pagination, RowActions, SearchBox, SortTh, useTable } from "@/components/TableTools";
import StudentImport from "@/components/StudentImport";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLoadState } from "@/lib/useLoadState";
import { api, formatApiError } from "@/lib/api";
import { Link } from "react-router-dom";
import { Download, FileText, Plus, Upload, UserX, Users } from "lucide-react";
import { exportCsv } from "@/lib/csv";
import { toast } from "sonner";

const EMPTY_FORM = { full_name: "", email: "", password: "", phone: "", school_year: "Year 5", school_name: "", dob: "", parent_id: "", status: "active" };

export default function Students() {
  const { t } = useLang();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [parents, setParents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const isAdmin = user?.role === "admin";
  const [state, track] = useLoadState();

  const load = useCallback(() => track(api.get("/students").then((r) => setStudents(r.data || []))), [track]);

  useEffect(() => {
    load();
    if (isAdmin) api.get("/users", { params: { role: "parent" } }).then((r) => setParents(r.data || []));
  }, [load, isAdmin]);

  const table = useTable(students, {
    searchKeys: ["full_name", "email", "student_code", "school_name"],
    sorters: {
      name: (s) => s.full_name,
      code: (s) => s.student_code,
      school: (s) => s.school_name,
      year: (s) => s.school_year,
      status: (s) => s.status,
    },
    defaultSort: "name",
    filter: useCallback((s) => !statusFilter || s.status === statusFilter, [statusFilter]),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ ...EMPTY_FORM, full_name: s.full_name || "", phone: s.phone || "", school_year: s.school_year || "", school_name: s.school_name || "", dob: s.dob || "", status: s.status || "active" });
    setOpen(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        const { full_name, phone, school_year, school_name, dob, status } = form;
        await api.patch(`/students/${editing.id}`, { full_name, phone, school_year, school_name, dob: dob || null, status });
        toast.success(t.saved);
      } else {
        await api.post("/students", form);
        toast.success(t.toastStudentAdded);
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const deactivate = async () => {
    try {
      await api.delete(`/students/${removing.id}`);
      toast.success(t.saved);
      setRemoving(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const reactivate = async (s) => {
    try {
      await api.patch(`/students/${s.id}`, { status: "active" });
      toast.success(t.saved);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const exportStudents = () =>
    exportCsv("students.csv", [
      { label: t.code, value: (s) => s.student_code },
      { label: t.name, value: (s) => s.full_name },
      { label: t.email, value: (s) => s.email },
      { label: t.phone, value: (s) => s.phone },
      { label: t.school, value: (s) => s.school_name },
      { label: t.yearLevel, value: (s) => s.school_year },
      { label: t.status, value: (s) => s.status },
    ], table.all);

  const clearFilters = () => {
    table.setQuery("");
    setStatusFilter("");
  };

  return (
    <Layout
      title={user?.role === "parent" ? t.myChildren : t.students}
      subtitle={`${students.length} ${t.students.toLowerCase()}`}
      actions={
        isAdmin && (
          <>
            <Btn onClick={exportStudents} testid="export-students-btn" size="sm" variant="outline" ariaLabel={t.exportCsv} disabled={students.length === 0}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t.exportCsv}</span>
            </Btn>
            <Btn onClick={() => setImportOpen(true)} testid="import-students-btn" size="sm" variant="outline" ariaLabel={t.importStudents}>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{t.importStudents}</span>
            </Btn>
            <Btn onClick={openAdd} testid="add-student-btn" size="sm">
              <Plus className="w-4 h-4" />
              {t.addStudent}
            </Btn>
          </>
        )
      }
    >
      <Card testid="students-card">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <SearchBox value={table.query} onChange={table.setQuery} testid="student-search" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            testid="student-status-filter"
            options={[
              { value: "", label: t.allStatuses },
              { value: "active", label: t.statusActive },
              { value: "inactive", label: t.statusInactive },
            ]}
            className="md:w-48"
          />
        </div>

        {state.loading ? <SkeletonRows /> : state.error ? <ErrorState onRetry={load} /> : students.length === 0 ? (
          <Empty
            message={t.noData}
            icon={Users}
            action={isAdmin && <Btn size="sm" onClick={openAdd}><Plus className="w-4 h-4" />{t.addStudent}</Btn>}
          />
        ) : table.total === 0 ? (
          <NoMatches onClear={clearFilters} />
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="rtable w-full min-w-[720px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-[11px] text-slate-600 font-outfit">
                    <SortTh label={t.name} k="name" table={table} />
                    <SortTh label={t.code} k="code" table={table} />
                    <SortTh label={t.school} k="school" table={table} />
                    <SortTh label={t.yearLevel} k="year" table={table} />
                    <SortTh label={t.status} k="status" table={table} />
                    <th className="px-5 py-3 text-right uppercase tracking-wider"><span className="sr-only">{t.actions}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100 row-hover" data-testid={`student-row-${s.id}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-outfit font-semibold">
                            {s.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="font-outfit font-semibold text-sm">{s.full_name}</div>
                            <div className="text-xs text-slate-600 font-jakarta">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.student_code}</td>
                      <td className="px-5 py-3 text-sm">{s.school_name || "—"}</td>
                      <td className="px-5 py-3 text-sm">{s.school_year || "—"}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={s.status} label={t[`status${s.status?.charAt(0).toUpperCase()}${s.status?.slice(1)}`] || s.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/students/${s.id}/report`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                            aria-label={t.reportCard}
                            title={t.reportCard}
                            data-testid={`report-${s.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                          {isAdmin && s.status === "active" && (
                            <RowActions
                              testid={`student-${s.id}`}
                              onEdit={() => openEdit(s)}
                              onDelete={() => setRemoving(s)}
                              deleteLabel={t.deactivate}
                              deleteIcon={UserX}
                            />
                          )}
                          {isAdmin && s.status !== "active" && (
                            <>
                              <Btn size="sm" variant="outline" onClick={() => reactivate(s)}>{t.reactivate}</Btn>
                              <RowActions testid={`student-${s.id}`} onEdit={() => openEdit(s)} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination table={table} />
          </>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `${t.edit}: ${editing.full_name}` : t.addStudent}
        testid="add-student-modal"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)} testid="cancel-add">{t.cancel}</Btn>
            <Btn onClick={submit} testid="submit-add-student">{t.save}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label={t.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} testid="form-name" className="sm:col-span-2" />
          {!editing && (
            <>
              <Input label={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} testid="form-email" />
              <Input label={t.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} testid="form-password" />
            </>
          )}
          <Input label={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} testid="form-phone" />
          <Input label={t.dob} type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} testid="form-dob" />
          <Input label={t.school} value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} testid="form-school" />
          <Input label={t.yearLevel} value={form.school_year} onChange={(e) => setForm({ ...form, school_year: e.target.value })} testid="form-year" />
          {editing ? (
            <Select
              label={t.status}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              testid="form-status"
              options={[
                { value: "active", label: t.statusActive },
                { value: "inactive", label: t.statusInactive },
              ]}
              className="sm:col-span-2"
            />
          ) : (
            <Select
              label={t.parent}
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              testid="form-parent"
              options={[{ value: "", label: t.nonePlaceholder }, ...parents.map((p) => ({ value: p.id, label: p.full_name }))]}
              className="sm:col-span-2"
            />
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={deactivate}
        title={t.deactivateTitle}
        message={removing ? `${removing.full_name}. ${t.deactivateHint}` : ""}
        confirmLabel={t.deactivate}
      />

      <StudentImport open={importOpen} onClose={() => setImportOpen(false)} onDone={load} />
    </Layout>
  );
}
