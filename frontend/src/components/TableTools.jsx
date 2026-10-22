import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Search, Trash2 } from "lucide-react";
import { Btn, Modal } from "@/components/UI";
import { useLang } from "@/lib/i18n";

const PAGE_SIZE = 10;

const compare = (a, b) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

// Client-side search, sort and paging for a list.
//   searchKeys: item fields (or getters) the search box looks at
//   sorters:    { columnKey: (item) => comparable value }
//   filter:     optional extra predicate (e.g. status dropdown)
export function useTable(items, { searchKeys = [], sorters = {}, defaultSort = null, filter, pageSize = PAGE_SIZE } = {}) {
  const [query, setQueryRaw] = useState("");
  const [sort, setSort] = useState(defaultSort ? { key: defaultSort, dir: "asc" } : { key: null, dir: "asc" });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter && !filter(item)) return false;
      if (!q) return true;
      return searchKeys.some((k) => {
        const v = typeof k === "function" ? k(item) : item[k];
        return v != null && String(v).toLowerCase().includes(q);
      });
    });
    // searchKeys/filter are stable per page render; items + query drive the result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, filter]);

  const sorted = useMemo(() => {
    const get = sorters[sort.key];
    if (!get) return filtered;
    const out = filtered.slice().sort((a, b) => compare(get(a), get(b)));
    return sort.dir === "desc" ? out.reverse() : out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize);

  return {
    rows,
    all: sorted,
    total: sorted.length,
    query,
    setQuery: (v) => {
      setQueryRaw(v);
      setPage(1);
    },
    sort,
    toggleSort: (key) => {
      setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
      setPage(1);
    },
    page: current,
    pageCount,
    pageSize,
    setPage,
    resetPage: () => setPage(1),
  };
}

export function SearchBox({ value, onChange, testid, className = "" }) {
  const { t } = useLang();
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${t.search}…`}
        aria-label={t.search}
        data-testid={testid}
        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-jakarta"
      />
    </div>
  );
}

// A clickable table header that sorts its column.
export function SortTh({ label, k, table, className = "px-5 py-3" }) {
  const active = table.sort.key === k;
  const Icon = !active ? ChevronsUpDown : table.sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={className} aria-sort={active ? (table.sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => table.toggleSort(k)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider font-outfit hover:text-slate-900 ${active ? "text-slate-900" : ""}`}
      >
        {label}
        <Icon className="h-3 w-3" aria-hidden="true" />
      </button>
    </th>
  );
}

export function Pagination({ table }) {
  const { t } = useLang();
  if (table.total <= table.pageSize) return null;
  const from = (table.page - 1) * table.pageSize + 1;
  const to = Math.min(table.total, table.page * table.pageSize);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-jakarta" data-testid="pagination">
      <span>
        {t.showing} {from}–{to} {t.of} {table.total}
      </span>
      <div className="flex items-center gap-2">
        <Btn size="sm" variant="outline" disabled={table.page <= 1} onClick={() => table.setPage(table.page - 1)} testid="page-prev">
          {t.previous}
        </Btn>
        <span className="tabular-nums">
          {table.page} / {table.pageCount}
        </span>
        <Btn size="sm" variant="outline" disabled={table.page >= table.pageCount} onClick={() => table.setPage(table.page + 1)} testid="page-next">
          {t.next}
        </Btn>
      </div>
    </div>
  );
}

const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500";

// Edit / delete icon buttons for the last column of a row.
export function RowActions({ onEdit, onDelete, deleteLabel, deleteIcon: DeleteIcon = Trash2, testid }) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <button type="button" onClick={onEdit} className={iconBtn} aria-label={t.edit} title={t.edit} data-testid={testid && `${testid}-edit`}>
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${iconBtn} hover:!bg-red-50 hover:text-red-600`}
          aria-label={deleteLabel || t.delete}
          title={deleteLabel || t.delete}
          data-testid={testid && `${testid}-delete`}
        >
          <DeleteIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, busy }) {
  const { t } = useLang();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || t.deleteTitle}
      size="sm"
      testid="confirm-modal"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>{t.cancel}</Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={busy} testid="confirm-yes">
            {confirmLabel || t.delete}
          </Btn>
        </>
      }
    >
      <p className="text-sm leading-6 text-slate-600 font-jakarta">{message || t.deleteHint}</p>
    </Modal>
  );
}

// Shown when search/filters hide every row.
export function NoMatches({ onClear }) {
  const { t } = useLang();
  return (
    <div className="py-12 text-center" data-testid="no-matches">
      <div className="text-sm font-semibold text-slate-700 font-outfit">{t.noResults}</div>
      <div className="mt-1 text-xs text-slate-600 font-jakarta">{t.noResultsHint}</div>
      {onClear && (
        <div className="mt-4">
          <Btn size="sm" variant="outline" onClick={onClear}>{t.clearFilters}</Btn>
        </div>
      )}
    </div>
  );
}
