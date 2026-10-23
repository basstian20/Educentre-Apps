import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Textarea, Modal, Empty, ErrorState, SkeletonRows } from "@/components/UI";
import { ConfirmModal, NoMatches, Pagination, RowActions, SearchBox, useTable } from "@/components/TableTools";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLoadState } from "@/lib/useLoadState";
import { api, fmtDate, formatApiError } from "@/lib/api";
import { Plus, Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function Announcements() {
  const { t } = useLang();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const canPost = user?.role === "admin" || user?.role === "educator";

  const [state, track] = useLoadState();
  const load = () => track(api.get("/announcements").then((r) => setList(r.data || [])));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const table = useTable(list, { searchKeys: ["title", "body", "created_by_name"], pageSize: 8 });
  const canManage = (a) => user?.role === "admin" || a.created_by === user?.id;

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", body: "", audience: "all" });
    setOpen(true);
  };
  const openEdit = (a) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body, audience: a.audience });
    setOpen(true);
  };

  const remove = async () => {
    try {
      await api.delete(`/announcements/${removing.id}`);
      toast.success(t.removed);
      setRemoving(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const submit = async () => {
    try {
      if (editing) {
        await api.patch(`/announcements/${editing.id}`, form);
        toast.success(t.saved);
      } else {
        await api.post("/announcements", form);
        toast.success(t.toastAnnouncementPosted);
      }
      setOpen(false);
      setForm({ title: "", body: "", audience: "all" });
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <Layout title={t.announcements} subtitle={`${list.length} ${t.unitPosts}`}
      actions={canPost && <Btn onClick={openAdd} size="sm" testid="new-announce-btn"><Plus className="w-4 h-4" />{t.new}</Btn>}
    >
      {state.loading ? <Card><SkeletonRows rows={3} /></Card> : state.error ? <Card><ErrorState onRetry={load} /></Card> : list.length === 0 ? (
        <Card><Empty message={t.noData} icon={Megaphone} action={canPost && <Btn size="sm" onClick={openAdd}><Plus className="w-4 h-4" />{t.new}</Btn>} /></Card>
      ) : (
        <>
        <div className="mb-4 flex"><SearchBox value={table.query} onChange={table.setQuery} testid="announce-search" /></div>
        {table.total === 0 ? <Card><NoMatches onClear={() => table.setQuery("")} /></Card> : (
        <div className="space-y-3">
          {table.rows.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-card" data-testid={`announce-${a.id}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-outfit font-semibold text-base">{a.title}</h3>
                      <div className="text-xs text-slate-600 font-jakarta mt-0.5">{a.created_by_name} · {fmtDate(a.created_at)} · <span className="badge badge-blue">{a.audience}</span></div>
                    </div>
                    {canManage(a) && <RowActions testid={`announce-${a.id}`} onEdit={() => openEdit(a)} onDelete={() => setRemoving(a)} />}
                  </div>
                  <p className="text-sm text-slate-700 mt-3 font-jakarta whitespace-pre-wrap">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
        <Pagination table={table} />
        </>
      )}

      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        message={removing ? `${removing.title}. ${t.deleteHint}` : ""}
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `${t.edit}: ${editing.title}` : t.announcements}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn><Btn onClick={submit} testid="submit-announce">{t.post}</Btn></>}
      >
        <div className="space-y-3">
          <Input label={t.title} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} testid="announce-title" />
          <Textarea label={t.body} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} testid="announce-body" />
          <Select label={t.audience} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
            options={[{ value: "all", label: t.audAll }, { value: "parents", label: t.audParents }, { value: "students", label: t.audStudents }, { value: "educators", label: t.audEducators }, ...(form.audience === "class" ? [{ value: "class", label: t.audClass }] : [])]} />
        </div>
      </Modal>
    </Layout>
  );
}
