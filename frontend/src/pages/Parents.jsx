import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Modal, Empty, ErrorState, SkeletonRows } from "@/components/UI";
import { ConfirmModal, NoMatches, Pagination, RowActions, SearchBox, SortTh, useTable } from "@/components/TableTools";
import { useLang } from "@/lib/i18n";
import { useLoadState } from "@/lib/useLoadState";
import { api, formatApiError } from "@/lib/api";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = { full_name: "", email: "", password: "", phone: "", occupation: "", children_ids: [] };

export default function Parents() {
  const { t } = useLang();
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [state, track] = useLoadState();
  const load = () => track(api.get("/parents").then((r) => setList(r.data || [])));
  useEffect(() => {
    load();
    api.get("/students").then((r) => setStudents(r.data || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const table = useTable(list, {
    searchKeys: ["full_name", "email", "phone"],
    sorters: {
      name: (p) => p.full_name,
      email: (p) => p.email,
      phone: (p) => p.phone,
      children: (p) => (p.children_ids || []).length,
    },
    defaultSort: "name",
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...EMPTY_FORM, full_name: p.full_name || "", phone: p.phone || "", occupation: p.occupation || "", children_ids: p.children_ids || [] });
    setOpen(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        const { full_name, phone, occupation, children_ids } = form;
        await api.patch(`/parents/${editing.id}`, { full_name, phone, occupation, children_ids });
        toast.success(t.saved);
      } else {
        await api.post("/parents", form);
        toast.success(t.toastParentAdded);
      }
      setOpen(false);
      load();
      api.get("/students").then((r) => setStudents(r.data || []));
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/parents/${removing.id}`);
      toast.success(t.removed);
      setRemoving(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <Layout
      title={t.parents}
      subtitle={`${list.length} ${t.parents.toLowerCase()}`}
      actions={
        <Btn onClick={openAdd} size="sm" testid="add-parent-btn">
          <Plus className="w-4 h-4" />
          {t.addParent}
        </Btn>
      }
    >
      <Card>
        <div className="mb-4 flex">
          <SearchBox value={table.query} onChange={table.setQuery} testid="parent-search" />
        </div>
        {state.loading ? <SkeletonRows /> : state.error ? <ErrorState onRetry={load} /> : list.length === 0 ? (
          <Empty message={t.noData} icon={Users} action={<Btn size="sm" onClick={openAdd}><Plus className="w-4 h-4" />{t.addParent}</Btn>} />
        ) : table.total === 0 ? (
          <NoMatches onClear={() => table.setQuery("")} />
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="rtable w-full min-w-[680px]">
                <thead>
                  <tr className="bg-slate-50 text-[11px] text-slate-600 font-outfit text-left">
                    <SortTh label={t.name} k="name" table={table} />
                    <SortTh label={t.email} k="email" table={table} />
                    <SortTh label={t.phone} k="phone" table={table} />
                    <SortTh label={t.childrenLinked} k="children" table={table} />
                    <th className="px-5 py-3"><span className="sr-only">{t.actions}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 row-hover" data-testid={`parent-row-${p.id}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-outfit font-semibold">
                            {p.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </div>
                          <div className="font-outfit font-semibold text-sm">{p.full_name}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm">{p.email}</td>
                      <td className="px-5 py-3 text-sm">{p.phone || "—"}</td>
                      <td className="px-5 py-3 text-sm">{(p.children_ids || []).length} {t.children}</td>
                      <td className="px-5 py-3">
                        <RowActions testid={`parent-${p.id}`} onEdit={() => openEdit(p)} onDelete={() => setRemoving(p)} />
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
        title={editing ? `${t.edit}: ${editing.full_name}` : t.addParent}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn>
            <Btn onClick={submit} testid="submit-add-parent">{t.save}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label={t.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="sm:col-span-2" testid="parent-form-name" />
          {!editing && (
            <>
              <Input label={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} testid="parent-form-email" />
              <Input label={t.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </>
          )}
          <Input label={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label={t.occupation} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
          <div className="sm:col-span-2">
            <span className="block text-xs font-medium text-slate-600 mb-1.5 font-outfit">{t.childrenLinked}</span>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.children_ids.includes(s.id)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.children_ids, s.id]
                        : form.children_ids.filter((id) => id !== s.id);
                      setForm({ ...form, children_ids: next });
                    }}
                  />
                  <span>{s.full_name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        message={removing ? `${removing.full_name}. ${t.deleteHint}` : ""}
      />
    </Layout>
  );
}
