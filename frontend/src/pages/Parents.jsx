import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Modal, Empty } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { api, formatApiError } from "@/lib/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Parents() {
  const { t } = useLang();
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", occupation: "", children_ids: [] });

  const load = () => api.get("/parents").then((r) => setList(r.data || []));
  useEffect(() => {
    load();
    api.get("/students").then((r) => setStudents(r.data || []));
  }, []);

  const submit = async () => {
    try {
      await api.post("/parents", form);
      toast.success("Parent added");
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", phone: "", occupation: "", children_ids: [] });
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
        <Btn onClick={() => setOpen(true)} size="sm" testid="add-parent-btn">
          <Plus className="w-4 h-4" />
          {t.parents}
        </Btn>
      }
    >
      <Card>
        {list.length === 0 ? (
          <Empty message={t.noData} />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-outfit">
                  <th className="text-left px-5 py-3">{t.name}</th>
                  <th className="text-left px-5 py-3">{t.email}</th>
                  <th className="text-left px-5 py-3">{t.phone}</th>
                  <th className="text-left px-5 py-3">{t.childrenLinked}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.parents}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn>
            <Btn onClick={submit} testid="submit-add-parent">{t.save}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label={t.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="col-span-2" testid="parent-form-name" />
          <Input label={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} testid="parent-form-email" />
          <Input label={t.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input label={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
          <div className="col-span-2">
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
    </Layout>
  );
}
