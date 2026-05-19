import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Select, Modal, Empty, StatusBadge } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, fmtIDR, fmtDate, formatApiError } from "@/lib/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Invoices() {
  const { t } = useLang();
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(null);
  const [form, setForm] = useState({ student_id: "", billing_month: new Date().toISOString().slice(0, 7), description: "Monthly tuition", amount: 0, due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) });
  const [payForm, setPayForm] = useState({ amount: 0, method: "cash" });
  const isAdmin = user?.role === "admin";

  const load = () => api.get("/invoices").then((r) => setList(r.data || []));
  useEffect(() => {
    load();
    if (isAdmin) api.get("/students").then((r) => setStudents(r.data || []));
  }, [isAdmin]);

  const create = async () => {
    try {
      await api.post("/invoices", { student_id: form.student_id, billing_month: form.billing_month, items: [{ description: form.description, amount: parseFloat(form.amount) }], due_date: form.due_date });
      toast.success("Invoice created");
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

  const studentName = (sid) => students.find((s) => s.id === sid)?.full_name || sid?.slice(0, 8);

  return (
    <Layout
      title={user?.role === "parent" ? t.fees : t.invoices}
      subtitle={`${list.length} invoices`}
      actions={isAdmin && <Btn onClick={() => setOpen(true)} size="sm" testid="new-invoice-btn"><Plus className="w-4 h-4" />{t.invoices}</Btn>}
    >
      <Card>
        {list.length === 0 ? <Empty message={t.noData} /> : (
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-outfit">
                  <th className="text-left px-5 py-3">{t.invoiceNumber}</th>
                  {isAdmin && <th className="text-left px-5 py-3">{t.student}</th>}
                  <th className="text-left px-5 py-3">{t.description}</th>
                  <th className="text-left px-5 py-3">{t.amount}</th>
                  <th className="text-left px-5 py-3">{t.dueDate}</th>
                  <th className="text-left px-5 py-3">{t.status}</th>
                  <th className="text-left px-5 py-3">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 row-hover" data-testid={`invoice-row-${inv.id}`}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{inv.invoice_number}</td>
                    {isAdmin && <td className="px-5 py-3 text-sm font-jakarta">{studentName(inv.student_id)}</td>}
                    <td className="px-5 py-3 text-sm font-jakarta">{(inv.items || []).map((i) => i.description).join(", ")}</td>
                    <td className="px-5 py-3 font-outfit font-semibold">{fmtIDR(inv.total_amount)}</td>
                    <td className="px-5 py-3 text-sm font-jakarta">{fmtDate(inv.due_date)}</td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} label={t[`status${inv.status?.charAt(0).toUpperCase()}${inv.status?.slice(1)}`] || inv.status} /></td>
                    <td className="px-5 py-3">
                      {inv.status !== "paid" && (
                        <Btn size="sm" variant="outline" onClick={() => { setPayOpen(inv); setPayForm({ amount: inv.balance_due, method: "cash" }); }} testid={`pay-${inv.id}`}>
                          {t.payNow}
                        </Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t.invoices}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Btn><Btn onClick={create} testid="submit-invoice">{t.save}</Btn></>}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label={t.student} value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} testid="inv-student"
            options={[{ value: "", label: "—" }, ...students.map((s) => ({ value: s.id, label: s.full_name }))]} className="sm:col-span-2" />
          <Input label={t.billingMonth} type="month" value={form.billing_month} onChange={(e) => setForm({ ...form, billing_month: e.target.value })} />
          <Input label={t.dueDate} type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <Input label={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" testid="inv-desc" />
          <Input label="Amount (IDR)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="sm:col-span-2" testid="inv-amount" />
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
