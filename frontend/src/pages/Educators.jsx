import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Modal, StatusBadge, Empty } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, formatApiError } from "@/lib/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Educators() {
  const { t } = useLang();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", subjects: "", employment_type: "full_time", qualifications: "" });
  const isAdmin = user?.role === "admin";

  const load = () => api.get("/educators").then((r) => setList(r.data || []));
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      const payload = { ...form, subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean) };
      await api.post("/educators", payload);
      toast.success("Educator added");
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", phone: "", subjects: "", employment_type: "full_time", qualifications: "" });
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <Layout
      title={t.educators}
      subtitle={`${list.length} ${t.educators.toLowerCase()}`}
      actions={isAdmin && (
        <Btn onClick={() => setOpen(true)} testid="add-educator-btn" size="sm">
          <Plus className="w-4 h-4" />
          {t.addEducator}
        </Btn>
      )}
    >
      <Card>
        {list.length === 0 ? (
          <Empty message={t.noData} />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-outfit">
                  <th className="text-left px-5 py-3">{t.name}</th>
                  <th className="text-left px-5 py-3">{t.code}</th>
                  <th className="text-left px-5 py-3">{t.subject}</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 row-hover" data-testid={`educator-row-${e.id}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-outfit font-semibold">
                          {e.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="font-outfit font-semibold text-sm">{e.full_name}</div>
                          <div className="text-xs text-slate-500 font-jakarta">{e.email}</div>
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
                    <td className="px-5 py-3"><StatusBadge status={e.status} label={t.statusActive} /></td>
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
        title={t.addEducator}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn>
            <Btn onClick={submit} testid="submit-add-educator">{t.save}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label={t.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="sm:col-span-2" testid="edu-form-name" />
          <Input label={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} testid="edu-form-email" />
          <Input label={t.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input label={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Subjects (comma)" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} testid="edu-form-subjects" />
          <Input label="Qualifications" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} className="sm:col-span-2" />
        </div>
      </Modal>
    </Layout>
  );
}
