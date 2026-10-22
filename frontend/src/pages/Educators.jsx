import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Modal, StatusBadge, Empty, ErrorState, SkeletonRows } from "@/components/UI";
import { ConfirmModal, NoMatches, Pagination, RowActions, SearchBox, SortTh, useTable } from "@/components/TableTools";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLoadState } from "@/lib/useLoadState";
import { api, formatApiError } from "@/lib/api";
import { Plus, GraduationCap, UserX } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = { full_name: "", email: "", password: "", phone: "", subjects: "", employment_type: "full_time", qualifications: "", status: "active" };
const EMPLOYMENT = ["full_time", "part_time", "freelance", "contract"];

export default function Educators() {
  const { t } = useLang();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const isAdmin = user?.role === "admin";

  const [state, track] = useLoadState();
  const load = () => track(api.get("/educators").then((r) => setList(r.data || [])));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const table = useTable(list, {
    searchKeys: ["full_name", "email", "staff_code", (e) => (e.subjects || []).join(" ")],
    sorters: {
      name: (e) => e.full_name,
      code: (e) => e.staff_code,
      subject: (e) => (e.subjects || []).join(", "),
      type: (e) => e.employment_type,
      status: (e) => e.status,
    },
    defaultSort: "name",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };
  const openEdit = (e) => {
    setEditing(e);
    setForm({
      ...EMPTY_FORM,
      full_name: e.full_name || "",
      phone: e.phone || "",
      subjects: (e.subjects || []).join(", "),
      employment_type: e.employment_type || "full_time",
      qualifications: e.qualifications || "",
      status: e.status || "active",
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      const subjects = form.subjects.split(",").map((s) => s.trim()).filter(Boolean);
      if (editing) {
        const { full_name, phone, employment_type, qualifications, status } = form;
        await api.patch(`/educators/${editing.id}`, { full_name, phone, subjects, employment_type, qualifications, status });
        toast.success(t.saved);
      } else {
        await api.post("/educators", { ...form, subjects });
        toast.success("Educator added");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const deactivate = async () => {
    try {
      await api.delete(`/educators/${removing.id}`);
      toast.success(t.saved);
      setRemoving(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const reactivate = async (e) => {
    try {
      await api.patch(`/educators/${e.id}`, { status: "active" });
      toast.success(t.saved);
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  return (
    <Layout
      title={t.educators}
      subtitle={`${list.length} ${t.educators.toLowerCase()}`}
      actions={isAdmin && (
        <Btn onClick={openAdd} testid="add-educator-btn" size="sm">
          <Plus className="w-4 h-4" />
          {t.addEducator}
        </Btn>
      )}
    >
      <Card>
        <div className="mb-4 flex">
          <SearchBox value={table.query} onChange={table.setQuery} testid="educator-search" />
        </div>
        {state.loading ? <SkeletonRows /> : state.error ? <ErrorState onRetry={load} /> : list.length === 0 ? (
          <Empty message={t.noData} icon={GraduationCap} action={isAdmin && <Btn size="sm" onClick={openAdd}><Plus className="w-4 h-4" />{t.addEducator}</Btn>} />
        ) : table.total === 0 ? (
          <NoMatches onClear={() => table.setQuery("")} />
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 text-[11px] text-slate-600 font-outfit text-left">
                    <SortTh label={t.name} k="name" table={table} />
                    <SortTh label={t.code} k="code" table={table} />
                    <SortTh label={t.subject} k="subject" table={table} />
                    <SortTh label="Type" k="type" table={table} />
                    <SortTh label={t.status} k="status" table={table} />
                    {isAdmin && <th className="px-5 py-3"><span className="sr-only">{t.actions}</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((e) => (
                    <tr key={e.id} className="border-t border-slate-100 row-hover" data-testid={`educator-row-${e.id}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-outfit font-semibold">
                            {e.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="font-outfit font-semibold text-sm">{e.full_name}</div>
                            <div className="text-xs text-slate-600 font-jakarta">{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{e.staff_code}</td>
                      <td className="px-5 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {(e.subjects || []).map((s) => (
                            <span key={s} className="badge badge-blue">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={e.employment_type} label={e.employment_type?.replace("_", " ")} /></td>
                      <td className="px-5 py-3"><StatusBadge status={e.status} label={e.status === "active" ? t.statusActive : t.statusInactive} /></td>
                      {isAdmin && (
                        <td className="px-5 py-3">
                          {e.status === "inactive" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Btn size="sm" variant="outline" onClick={() => reactivate(e)}>{t.reactivate}</Btn>
                              <RowActions testid={`educator-${e.id}`} onEdit={() => openEdit(e)} />
                            </div>
                          ) : (
                            <RowActions
                              testid={`educator-${e.id}`}
                              onEdit={() => openEdit(e)}
                              onDelete={() => setRemoving(e)}
                              deleteLabel={t.deactivate}
                              deleteIcon={UserX}
                            />
                          )}
                        </td>
                      )}
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
        title={editing ? `${t.edit}: ${editing.full_name}` : t.addEducator}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn>
            <Btn onClick={submit} testid="submit-add-educator">{t.save}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label={t.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="sm:col-span-2" testid="edu-form-name" />
          {!editing && (
            <>
              <Input label={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} testid="edu-form-email" />
              <Input label={t.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </>
          )}
          <Input label={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select
            label="Type"
            value={form.employment_type}
            onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            options={EMPLOYMENT.map((v) => ({ value: v, label: v.replace("_", " ") }))}
          />
          <Input label="Subjects (comma)" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} testid="edu-form-subjects" className="sm:col-span-2" />
          <Input label="Qualifications" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} className="sm:col-span-2" />
          {editing && (
            <Select
              label={t.status}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: "active", label: t.statusActive },
                { value: "inactive", label: t.statusInactive },
              ]}
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
    </Layout>
  );
}
