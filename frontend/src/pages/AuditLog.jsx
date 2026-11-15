import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ScrollText } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, Empty, ErrorState, Input, Select, SkeletonRows } from "@/components/UI";
import { Pagination, SearchBox } from "@/components/TableTools";
import { useLang } from "@/lib/i18n";
import { api } from "@/lib/api";

const PAGE_SIZE = 25;
const ACTIONS = [
  "create", "update", "delete", "restore", "purge", "import", "publish",
  "login_success", "login_locked", "unlock", "password_change", "password_reset_requested", "password_reset",
];
const ENTITIES = [
  "student", "educator", "parent", "class", "enrollment", "attendance", "assessment", "grades",
  "invoice", "payment", "material", "announcement", "settings", "user", "auth",
];

const TONE = {
  create: "bg-emerald-100 text-emerald-800",
  restore: "bg-emerald-100 text-emerald-800",
  publish: "bg-emerald-100 text-emerald-800",
  import: "bg-emerald-100 text-emerald-800",
  update: "bg-sky-100 text-sky-800",
  delete: "bg-amber-100 text-amber-800",
  purge: "bg-rose-100 text-rose-800",
  login_locked: "bg-rose-100 text-rose-800",
};

const show = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

function Changes({ changes, t }) {
  const rows = Object.entries(changes || {});
  if (!rows.length) return <p className="text-xs text-slate-600 font-sans">{t.auditNoChanges}</p>;
  return (
    <table className="w-full text-xs font-sans" data-testid="audit-changes">
      <thead>
        <tr className="text-left text-slate-600">
          <th className="py-1 pr-3 font-bold">{t.auditField}</th>
          <th className="py-1 pr-3 font-bold">{t.auditBefore}</th>
          <th className="py-1 font-bold">{t.auditAfter}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([field, c]) => (
          <tr key={field} className="align-top border-t border-slate-200/70">
            <td className="py-1 pr-3 font-semibold text-slate-900 break-all">{field}</td>
            <td className="py-1 pr-3 font-semibold text-rose-500 break-all">{show(c?.from)}</td>
            <td className="py-1 font-semibold text-emerald-500 break-all">{show(c?.to)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AuditLog() {
  const { t, lang } = useLang();
  const [filters, setFilters] = useState({ q: "", entity: "", action: "", date_from: "", date_to: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null); // {items,total}
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(null);

  const setFilter = (key) => (value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const load = useCallback(() => {
    const params = { limit: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE };
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
    setError(false);
    api
      .get("/audit-logs", { params })
      .then((r) => setData(r.data))
      .catch(() => {
        setError(true);
        setData({ items: [], total: 0 });
      });
  }, [filters, page]);

  // debounce typing in the search box; selects/dates trigger the same effect immediately enough
  useEffect(() => {
    const id = setTimeout(load, filters.q ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, filters.q]);

  const total = data?.total || 0;
  const table = useMemo(
    () => ({ page, setPage, total, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) }),
    [page, total]
  );

  const when = (iso) => new Date(iso).toLocaleString(lang === "id" ? "id-ID" : "en-GB", { dateStyle: "medium", timeStyle: "medium" });
  const actionLabel = (a) => t[`auditAction_${a}`] || a;
  const entityLabel = (e) => t[`auditEntity_${e}`] || e;
  const all = (label) => ({ value: "", label });

  return (
    <Layout title={t.auditTitle} subtitle={t.auditSubtitle}>
      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <SearchBox value={filters.q} onChange={setFilter("q")} testid="audit-search" />
        <Select
          value={filters.entity}
          onChange={(e) => setFilter("entity")(e.target.value)}
          options={[all(t.auditAllEntities), ...ENTITIES.map((v) => ({ value: v, label: entityLabel(v) }))]}
          testid="audit-entity"
        />
        <Select
          value={filters.action}
          onChange={(e) => setFilter("action")(e.target.value)}
          options={[all(t.auditAllActions), ...ACTIONS.map((v) => ({ value: v, label: actionLabel(v) }))]}
          testid="audit-action"
        />
        <Input type="date" value={filters.date_from} onChange={(e) => setFilter("date_from")(e.target.value)} aria-label={t.auditFrom} testid="audit-from" />
        <Input type="date" value={filters.date_to} onChange={(e) => setFilter("date_to")(e.target.value)} aria-label={t.auditTo} testid="audit-to" />
      </div>

      <Card testid="audit-card">
        {data === null ? (
          <SkeletonRows rows={6} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : data.items.length === 0 ? (
          <Empty message={t.auditEmpty} icon={ScrollText} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm font-sans" data-testid="audit-table">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                  <th className="w-8" />
                  <th className="py-2 pr-3 font-bold">{t.auditWhen}</th>
                  <th className="py-2 pr-3 font-bold">{t.auditActor}</th>
                  <th className="py-2 pr-3 font-bold">{t.auditActionCol}</th>
                  <th className="py-2 pr-3 font-bold">{t.auditEntityCol}</th>
                  <th className="py-2 font-bold">{t.auditSummary}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => {
                  const expanded = open === row.id;
                  const Chevron = expanded ? ChevronDown : ChevronRight;
                  return (
                    <Fragment key={row.id}>
                      <tr className="border-t border-slate-200/70 align-top" data-testid={`audit-row-${row.id}`}>
                        <td className="py-2.5">
                          <button
                            type="button"
                            onClick={() => setOpen(expanded ? null : row.id)}
                            aria-expanded={expanded}
                            aria-label={expanded ? t.auditHideChanges : t.auditShowChanges}
                            className="rounded p-1 text-slate-600 hover:bg-slate-100"
                            data-testid={`audit-toggle-${row.id}`}
                          >
                            <Chevron className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap text-xs text-slate-700">{when(row.at)}</td>
                        <td className="py-2.5 pr-3">
                          <div className="font-semibold text-slate-900">{row.actor_name || t.auditAnonymous}</div>
                          <div className="text-xs text-slate-600">
                            {row.actor_role ? t[`role_${row.actor_role}`] || row.actor_role : ""}
                            {row.ip ? ` · ${row.ip}` : ""}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[row.action] || "bg-slate-100 text-slate-800"}`}>
                            {actionLabel(row.action)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-800">{entityLabel(row.entity)}</td>
                        <td className="py-2.5 text-slate-900">{row.summary}</td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/70">
                          <td />
                          <td colSpan={5} className="px-1 py-3">
                            <Changes changes={row.changes} t={t} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination table={table} />
      </Card>
    </Layout>
  );
}
