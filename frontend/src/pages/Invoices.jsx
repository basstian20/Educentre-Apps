import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Modal, Empty, ErrorState, SkeletonRows, StatusBadge } from "@/components/UI";
import { ConfirmModal, NoMatches, Pagination, RowActions, SearchBox, SortTh, useTable } from "@/components/TableTools";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLoadState } from "@/lib/useLoadState";
import { api, fmtIDR, fmtDate, formatApiError } from "@/lib/api";
import { Link } from "react-router-dom";
import { Download, Plus, Printer, Receipt } from "lucide-react";
import { exportCsv } from "@/lib/csv";
import { toast } from "sonner";

export default function Invoices() {
  const { t } = useLang();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const blankForm = () => ({ student_id: "", billing_month: new Date().toISOString().slice(0, 7), description: "Monthly tuition", amount: 0, due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) });
  const [form, setForm] = useState(blankForm);
  const [payForm, setPayForm] = useState({ amount: 0, method: "cash" });
  const isAdmin = user?.role === "admin";

  const [state, track] = useLoadState();
  const load = () => track(api.get("/invoices").then((r) => setList(r.data || [])));
  useEffect(() => {
    load();
    if (isAdmin) api.get("/students").then((r) => setStudents(r.data || []));
  }, [isAdmin]);

  const studentName = (sid) => students.find((s) => s.id === sid)?.full_name || sid?.slice(0, 8);

  const table = useTable(list, {
    searchKeys: ["invoice_number", (i) => studentName(i.student_id), (i) => (i.items || []).map((x) => x.description).join(" ")],
    sorters: {
      number: (i) => i.invoice_number,
      student: (i) => studentName(i.student_id),
      amount: (i) => i.total_amount,
      due: (i) => i.due_date,
      status: (i) => i.status,
    },
    defaultSort: "due",
    filter: useCallback((i) => !statusFilter || i.status === statusFilter, [statusFilter]),
  });

  // Amounts are locked once money was received, or when the invoice has several line items.
  const amountLocked = !!editing && (editing.amount_paid > 0 || (editing.items || []).length !== 1);

  const openAdd = () => {
    setEditing(null);
    setForm(blankForm());
    setOpen(true);
  };
  const openEdit = (inv) => {
    setEditing(inv);
    setForm({
      student_id: inv.student_id,
      billing_month: inv.billing_month || "",
      description: (inv.items || []).map((i) => i.description).join(", "),
      amount: inv.total_amount,
      due_date: inv.due_date || "",
    });
    setOpen(true);
  };

  const create = async () => {
    try {
      if (editing) {
        const body = { billing_month: form.billing_month, due_date: form.due_date };
        if (!amountLocked) body.items = [{ description: form.description, amount: parseFloat(form.amount) }];
        await api.patch(`/invoices/${editing.id}`, body);
        toast.success(t.saved);
      } else {
        await api.post("/invoices", { student_id: form.student_id, billing_month: form.billing_month, items: [{ description: form.description, amount: parseFloat(form.amount) }], due_date: form.due_date });
        toast.success("Invoice created");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const recordPayment = async () => {
    if (!payOpen) return;
    try {
      await api.post("/payments", { invoice_id: payOpen.id, amount: parseFloat(payForm.amount), method: payForm.method });
      toast.success("Payment recorded");
      setPayOpen(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const exportInvoices = () =>
    exportCsv("invoices.csv", [
      { label: t.invoiceNumber, value: (i) => i.invoice_number },
      { label: t.student, value: (i) => studentName(i.student_id) },
      { label: t.description, value: (i) => (i.items || []).map((x) => x.description).join("; ") },
      { label: t.amount, value: (i) => i.total_amount },
      { label: t.amountPaid, value: (i) => i.amount_paid },
      { label: t.balanceDue, value: (i) => i.balance_due },
      { label: t.dueDate, value: (i) => i.due_date },
      { label: t.status, value: (i) => i.status },
    ], table.all);

  const remove = async () => {
    try {
      await api.delete(`/invoices/${removing.id}`);
      toast.success(t.removed);
      setRemoving(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <Layout
      title={user?.role === "parent" ? t.fees : t.invoices}
      subtitle={`${list.length} invoices`}
      actions={isAdmin && (
        <>
          <Btn variant="outline" size="sm" onClick={exportInvoices} testid="export-invoices-btn" disabled={list.length === 0}><Download className="w-4 h-4" />{t.exportCsv}</Btn>
          <Btn onClick={openAdd} size="sm" testid="new-invoice-btn"><Plus className="w-4 h-4" />{t.invoices}</Btn>
        </>
      )}
    >
      <Card>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <SearchBox value={table.query} onChange={table.setQuery} testid="invoice-search" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            testid="invoice-status-filter"
            options={[
              { value: "", label: t.allStatuses },
              { value: "unpaid", label: t.statusUnpaid || "Unpaid" },
              { value: "partial", label: t.statusPartial || "Partial" },
              { value: "paid", label: t.statusPaid || "Paid" },
              { value: "overdue", label: t.statusOverdue || "Overdue" },
            ]}
            className="md:w-48"
          />
        </div>
        {state.loading ? <SkeletonRows /> : state.error ? <ErrorState onRetry={load} /> : list.length === 0 ? (
          <Empty message={t.noData} icon={Receipt} action={isAdmin && <Btn size="sm" onClick={openAdd}><Plus className="w-4 h-4" />{t.invoices}</Btn>} />
        ) : table.total === 0 ? (
          <NoMatches onClear={() => { table.setQuery(""); setStatusFilter(""); }} />
        ) : (
          <>
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] text-slate-600 font-outfit text-left">
                  <SortTh label={t.invoiceNumber} k="number" table={table} />
                  {isAdmin && <SortTh label={t.student} k="student" table={table} />}
                  <th className="px-5 py-3 uppercase tracking-wider">{t.description}</th>
                  <SortTh label={t.amount} k="amount" table={table} />
                  <SortTh label={t.dueDate} k="due" table={table} />
                  <SortTh label={t.status} k="status" table={table} />
                  <th className="px-5 py-3 uppercase tracking-wider">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 row-hover" data-testid={`invoice-row-${inv.id}`}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{inv.invoice_number}</td>
                    {isAdmin && <td className="px-5 py-3 text-sm font-jakarta">{studentName(inv.student_id)}</td>}
                    <td className="px-5 py-3 text-sm font-jakarta">{(inv.items || []).map((i) => i.description).join(", ")}</td>
                    <td className="px-5 py-3 font-outfit font-semibold">{fmtIDR(inv.total_amount)}</td>
                    <td className="px-5 py-3 text-sm font-jakarta">{fmtDate(inv.due_date)}</td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} label={t[`status${inv.status?.charAt(0).toUpperCase()}${inv.status?.slice(1)}`] || inv.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/invoices/${inv.id}/print`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                          aria-label={t.printInvoice}
                          title={t.printInvoice}
                          data-testid={`print-${inv.id}`}
                        >
                          <Printer className="h-4 w-4" />
                        </Link>
                        {inv.status !== "paid" && (
                          <Btn size="sm" variant="outline" onClick={() => { setPayOpen(inv); setPayForm({ amount: inv.balance_due, method: "cash" }); }} testid={`pay-${inv.id}`}>
                            {t.payNow}
                          </Btn>
                        )}
                        {isAdmin && (
                          <RowActions
                            testid={`invoice-${inv.id}`}
                            onEdit={() => openEdit(inv)}
                            onDelete={!(inv.amount_paid > 0) ? () => setRemoving(inv) : undefined}
                          />
                        )}
                      </div>
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

      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        message={removing ? `${removing.invoice_number}. ${t.deleteHint}` : ""}
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `${t.edit}: ${editing.invoice_number}` : t.invoices}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn><Btn onClick={create} testid="submit-invoice">{t.save}</Btn></>}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label={t.student} value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} testid="inv-student" disabled={!!editing}
            options={[{ value: "", label: "—" }, ...students.map((s) => ({ value: s.id, label: s.full_name }))]} className="sm:col-span-2" />
          <Input label={t.billingMonth} type="month" value={form.billing_month} onChange={(e) => setForm({ ...form, billing_month: e.target.value })} />
          <Input label={t.dueDate} type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <Input label={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" testid="inv-desc" disabled={amountLocked} />
          <Input label="Amount (IDR)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="sm:col-span-2" testid="inv-amount" disabled={amountLocked} />
          {amountLocked && <p className="sm:col-span-2 text-xs text-slate-600 font-jakarta">Amounts can't be changed after a payment was recorded.</p>}
        </div>
      </Modal>

      <Modal open={!!payOpen} onClose={() => setPayOpen(null)} title={t.payNow}
        footer={<><Btn variant="ghost" onClick={() => setPayOpen(null)}>{t.cancel}</Btn><Btn variant="success" onClick={recordPayment} testid="submit-payment">{t.record}</Btn></>}
      >
        {payOpen && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 font-jakarta">Balance: <span className="font-outfit font-bold text-slate-900">{fmtIDR(payOpen.balance_due)}</span></div>
            <Input label="Amount" type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} testid="pay-amount" />
            <Select label={t.paymentMethod} value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
              options={[{ value: "cash", label: t.cash }, { value: "bank_transfer", label: t.bank }, { value: "qris", label: t.qris }, { value: "ewallet", label: t.ewallet }]} />
          </div>
        )}
      </Modal>
    </Layout>
  );
}
