import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, StatusBadge, Modal, Empty } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, formatApiError } from "@/lib/api";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function Students() {
  const { t } = useLang();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [parents, setParents] = useState([]);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", school_year: "Year 5", school_name: "", dob: "", parent_id: "" });
  const isAdmin = user?.role === "admin";

  const load = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get("/students", { params }).then((r) => setStudents(r.data || []));
  }, [search, statusFilter]);

  useEffect(() => {
    load();
    if (isAdmin) api.get("/users", { params: { role: "parent" } }).then((r) => setParents(r.data || []));
  }, [load, isAdmin]);

  const submit = async () => {
    try {
      await api.post("/students", form);
      toast.success("Student added");
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", phone: "", school_year: "Year 5", school_name: "", dob: "", parent_id: "" });
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <Layout
      title={user?.role === "parent" ? t.myChildren : t.students}
      subtitle={`${students.length} ${t.students.toLowerCase()}`}
      actions={
        isAdmin && (
          <Btn onClick={() => setOpen(true)} testid="add-student-btn" size="sm">
            <Plus className="w-4 h-4" />
            {t.addStudent}
          </Btn>
        )
      }
    >
      <Card testid="students-card">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t.search}…`}
              data-testid="student-search"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            testid="student-status-filter"
            options={[
              { value: "", label: `All ${t.status}` },
              { value: "active", label: t.statusActive },
              { value: "inactive", label: t.statusInactive },
            ]}
            className="md:w-48"
          />
        </div>

        {students.length === 0 ? (
          <Empty message={t.noData} />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-outfit">
                  <th className="px-5 py-3">{t.name}</th>
                  <th className="px-5 py-3">{t.code}</th>
                  <th className="px-5 py-3">{t.school}</th>
                  <th className="px-5 py-3">{t.yearLevel}</th>
                  <th className="px-5 py-3">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 row-hover" data-testid={`student-row-${s.id}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-outfit font-semibold">
                          {s.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="font-outfit font-semibold text-sm">{s.full_name}</div>
                          <div className="text-xs text-slate-500 font-jakarta">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.student_code}</td>
                    <td className="px-5 py-3 text-sm">{s.school_name || "—"}</td>
                    <td className="px-5 py-3 text-sm">{s.school_year || "—"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={s.status} label={t[`status${s.status?.charAt(0).toUpperCase()}${s.status?.slice(1)}`] || s.status} />
                    </td>
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
        title={t.addStudent}
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
          <Input label={t.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} testid="form-email" />
          <Input label={t.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} testid="form-password" />
          <Input label={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} testid="form-phone" />
          <Input label={t.dob} type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} testid="form-dob" />
          <Input label={t.school} value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} testid="form-school" />
          <Input label={t.yearLevel} value={form.school_year} onChange={(e) => setForm({ ...form, school_year: e.target.value })} testid="form-year" />
          <Select
            label={t.parent}
            value={form.parent_id}
            onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
            testid="form-parent"
            options={[{ value: "", label: "— None —" }, ...parents.map((p) => ({ value: p.id, label: p.full_name }))]}
            className="sm:col-span-2"
          />
        </div>
      </Modal>
    </Layout>
  );
}
