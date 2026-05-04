import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Textarea, Modal, Empty } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, fmtDate, formatApiError } from "@/lib/api";
import { Plus, Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function Announcements() {
  const { t } = useLang();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });
  const canPost = user?.role === "admin" || user?.role === "educator";

  const load = () => api.get("/announcements").then((r) => setList(r.data || []));
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      await api.post("/announcements", form);
      toast.success("Announcement posted");
      setOpen(false);
      setForm({ title: "", body: "", audience: "all" });
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <Layout title={t.announcements} subtitle={`${list.length} posts`}
      actions={canPost && <Btn onClick={() => setOpen(true)} size="sm" testid="new-announce-btn"><Plus className="w-4 h-4" />{t.new}</Btn>}
    >
      {list.length === 0 ? <Empty message={t.noData} /> : (
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-card" data-testid={`announce-${a.id}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-outfit font-semibold text-base">{a.title}</h3>
                      <div className="text-xs text-slate-500 font-jakarta mt-0.5">{a.created_by_name} · {fmtDate(a.created_at)} · <span className="badge badge-blue">{a.audience}</span></div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mt-3 font-jakarta whitespace-pre-wrap">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t.announcements}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn><Btn onClick={submit} testid="submit-announce">{t.post}</Btn></>}
      >
        <div className="space-y-3">
          <Input label={t.title} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} testid="announce-title" />
          <Textarea label={t.body} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} testid="announce-body" />
          <Select label={t.audience} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
            options={[{ value: "all", label: "All" }, { value: "parents", label: "Parents" }, { value: "students", label: "Students" }, { value: "educators", label: "Educators" }]} />
        </div>
      </Modal>
    </Layout>
  );
}
