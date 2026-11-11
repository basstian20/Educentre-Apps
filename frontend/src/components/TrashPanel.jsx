import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Card, Btn, Empty, SkeletonRows } from "@/components/UI";
import { ConfirmModal } from "@/components/TableTools";
import { useLang } from "@/lib/i18n";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

const TYPES = ["", "parents", "announcements", "materials", "invoices"];

export default function TrashPanel() {
  const { t, lang } = useLang();
  const [type, setType] = useState("");
  const [items, setItems] = useState(null);
  const [purging, setPurging] = useState(null);
  const [busy, setBusy] = useState(false);

  const label = {
    "": t.trashAll,
    parents: t.trashParents,
    announcements: t.trashAnnouncements,
    materials: t.trashMaterials,
    invoices: t.trashInvoices,
  };

  const load = useCallback(() => {
    api
      .get("/trash", { params: type ? { type } : {} })
      .then((r) => setItems(r.data))
      .catch((e) => {
        setItems([]);
        toast.error(formatApiError(e.response?.data?.detail));
      });
  }, [type]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  const act = async (fn, okMessage) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMessage);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setBusy(false);
      setPurging(null);
    }
  };

  const when = (iso) => new Date(iso).toLocaleString(lang === "id" ? "id-ID" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Card title={t.trashTitle} testid="trash-card" className="lg:col-span-2">
      <p className="mb-3 text-xs text-slate-600 font-sans">{t.trashHint}</p>
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {TYPES.map((k) => (
          <Btn key={k || "all"} size="sm" variant={type === k ? "primary" : "outline"} onClick={() => setType(k)} testid={`trash-tab-${k || "all"}`}>
            {label[k]}
          </Btn>
        ))}
      </div>

      {items === null ? (
        <SkeletonRows rows={3} />
      ) : items.length === 0 ? (
        <Empty message={t.trashEmpty} icon={Trash2} />
      ) : (
        <ul className="divide-y divide-slate-200/70" data-testid="trash-list">
          {items.map((it) => (
            <li key={`${it.type}-${it.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3" data-testid={`trash-item-${it.id}`}>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 font-sans">{it.title}</div>
                <div className="text-xs text-slate-600 font-sans">
                  {label[it.type]}
                  {it.subtitle ? ` · ${it.subtitle}` : ""} · {t.deletedOn} {when(it.deleted_at)}
                  {it.deleted_by_name ? ` ${t.deletedBy} ${it.deleted_by_name}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <Btn size="sm" variant="outline" disabled={busy} onClick={() => act(() => api.post(`/trash/${it.type}/${it.id}/restore`), t.restored)} testid={`trash-restore-${it.id}`}>
                  <RotateCcw className="h-4 w-4" />
                  {t.restore}
                </Btn>
                <Btn size="sm" variant="danger" disabled={busy} onClick={() => setPurging(it)} testid={`trash-purge-${it.id}`}>
                  <Trash2 className="h-4 w-4" />
                  {t.purge}
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!purging}
        onClose={() => setPurging(null)}
        onConfirm={() => act(() => api.delete(`/trash/${purging.type}/${purging.id}`), t.purged)}
        title={t.purge}
        confirmLabel={t.purge}
        message={purging ? `${purging.title}. ${t.purgeConfirm}` : ""}
        busy={busy}
      />
    </Card>
  );
}
