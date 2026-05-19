import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Modal, Empty } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, fmtDate, formatApiError } from "@/lib/api";
import { Plus, FileText, Link2, Video } from "lucide-react";
import { toast } from "sonner";

const ICON = { file: FileText, link: Link2, video: Video };

export default function Materials() {
  const { t } = useLang();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ class_id: "", title: "", type: "link", external_url: "", description: "" });
  const canUpload = user?.role === "admin" || user?.role === "educator";

  const load = () => api.get("/materials").then((r) => setList(r.data || []));
  useEffect(() => {
    load();
    api.get("/classes").then((r) => setClasses(r.data || []));
  }, []);

  const submit = async () => {
    try {
      await api.post("/materials", form);
      toast.success("Material added");
      setOpen(false);
      setForm({ class_id: "", title: "", type: "link", external_url: "", description: "" });
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const findClass = (cid) => classes.find((c) => c.id === cid);

  return (
    <Layout title={t.materials} subtitle={`${list.length} resources`}
      actions={canUpload && (
        <Btn onClick={() => setOpen(true)} size="sm" testid="add-material-btn"><Plus className="w-4 h-4" />{t.addMaterial}</Btn>
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.length === 0 ? (
          <div className="col-span-3"><Empty message={t.noData} /></div>
        ) : (
          list.map((m) => {
            const Icon = ICON[m.type] || FileText;
            const c = findClass(m.class_id);
            return (
              <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:-translate-y-0.5 transition" data-testid={`material-${m.id}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-outfit font-semibold text-sm truncate">{m.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-jakarta">{c?.subject_name || "—"}</div>
                  </div>
                </div>
                {m.description && <div className="text-xs text-slate-600 mt-3 font-jakarta line-clamp-2">{m.description}</div>}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-jakarta">{fmtDate(m.created_at)} · {m.uploader_name || "—"}</span>
                  {(m.external_url || m.file_url) && (
                    <a href={m.external_url || m.file_url} target="_blank" rel="noreferrer" className="text-xs font-outfit font-semibold text-blue-600 hover:underline" data-testid={`material-open-${m.id}`}>
                      Open →
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t.addMaterial}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn><Btn onClick={submit} testid="submit-material">{t.save}</Btn></>}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label={t.classes} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} testid="mat-class"
            options={[{ value: "", label: "—" }, ...classes.map((c) => ({ value: c.id, label: c.subject_name }))]} className="sm:col-span-2" />
          <Input label={t.materialTitle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="sm:col-span-2" testid="mat-title" />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[{ value: "link", label: "Link" }, { value: "file", label: "File" }, { value: "video", label: "Video" }]} />
          <Input label={t.materialUrl} value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} testid="mat-url" />
          <Input label={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" />
        </div>
      </Modal>
    </Layout>
  );
}
