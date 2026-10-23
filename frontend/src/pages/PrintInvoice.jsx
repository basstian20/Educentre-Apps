import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import PrintSheet, { Field, SheetHeader } from "@/components/PrintSheet";
import { StatusBadge } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useLoadState } from "@/lib/useLoadState";
import { api, fmtDate, fmtIDR } from "@/lib/api";

const METHODS = { cash: "cash", bank_transfer: "bank", qris: "qris", ewallet: "ewallet" };

// One page, two documents: the invoice itself, or (with ?payment=<id>) a receipt for one payment.
export default function PrintInvoice() {
  const { t } = useLang();
  const { id } = useParams();
  const [params] = useSearchParams();
  const paymentId = params.get("payment");
  const [doc, setDoc] = useState(null);
  const [state, track] = useLoadState();

  const load = useCallback(() => track(api.get(`/invoices/${id}/document`).then((r) => setDoc(r.data))), [id, track]);
  useEffect(() => { load(); }, [load]);

  const inv = doc?.invoice;
  const payments = doc?.payments || [];
  const payment = paymentId ? payments.find((p) => p.id === paymentId) : null;
  const methodLabel = (m) => t[METHODS[m]] || m;

  return (
    <PrintSheet loading={state.loading} error={state.error || (!state.loading && !!doc && !!paymentId && !payment)} onRetry={load}>
      {doc && (payment ? <Receipt doc={doc} payment={payment} t={t} methodLabel={methodLabel} /> : (
        <>
          <SheetHeader centre={doc.centre} heading={t.invoiceHeading} meta={`${inv.invoice_number} · ${fmtDate(inv.created_at)}`} />

          <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label={t.billedTo}>{doc.student.full_name}</Field>
            <Field label={t.code}>{doc.student.student_code}</Field>
            <Field label={t.dueDate}>{fmtDate(inv.due_date)}</Field>
            <Field label={t.status}><StatusBadge status={inv.status} label={t[`status${inv.status?.charAt(0).toUpperCase()}${inv.status?.slice(1)}`] || inv.status} /></Field>
            <Field label={t.parent}>{doc.parent?.full_name}</Field>
            <Field label={t.school}>{[doc.student.school_name, doc.student.school_year].filter(Boolean).join(" · ")}</Field>
            <Field label={t.billingMonth}>{inv.billing_month}</Field>
          </section>

          <table className="mt-6 w-full text-left text-sm font-jakarta">
            <thead>
              <tr className="border-b border-slate-300 text-[11px] uppercase tracking-wider text-slate-600 font-outfit">
                <th className="py-2">{t.description}</th>
                <th className="py-2 text-right">{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((it, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2">{it.description}</td>
                  <td className="py-2 text-right">{fmtIDR(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm font-jakarta">
            <div className="flex justify-between"><dt>{t.amount}</dt><dd>{fmtIDR(inv.total_amount)}</dd></div>
            <div className="flex justify-between"><dt>{t.amountPaid}</dt><dd>{fmtIDR(inv.amount_paid)}</dd></div>
            <div className="flex justify-between border-t border-slate-300 pt-1 font-outfit text-base font-bold"><dt>{t.balanceDue}</dt><dd>{fmtIDR(inv.balance_due)}</dd></div>
          </dl>

          {payments.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-outfit">{t.paymentHistory}</h2>
              <table className="w-full text-left text-sm font-jakarta">
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-1.5">{fmtDate(p.paid_at)}</td>
                      <td className="py-1.5">{methodLabel(p.method)}</td>
                      <td className="py-1.5 text-right">{fmtIDR(p.amount)}</td>
                      <td className="no-print py-1.5 pl-3 text-right">
                        <Link to={`/invoices/${inv.id}/print?payment=${p.id}`} className="text-xs font-semibold text-teal-700 hover:underline" data-testid={`receipt-link-${p.id}`}>
                          {t.printReceipt}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          <footer className="mt-10 text-center text-[11px] text-slate-500 font-jakarta">{t.printFooter}</footer>
        </>
      ))}
    </PrintSheet>
  );
}

function Receipt({ doc, payment, t, methodLabel }) {
  const inv = doc.invoice;
  const paidThrough = doc.payments
    .filter((p) => (p.paid_at || "") <= (payment.paid_at || ""))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = Math.max(0, (inv.total_amount || 0) - paidThrough);

  return (
    <>
      <SheetHeader centre={doc.centre} heading={t.receiptHeading} meta={`#${payment.id.slice(0, 8).toUpperCase()} · ${fmtDate(payment.paid_at)}`} />
      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label={t.student}>{doc.student.full_name}</Field>
        <Field label={t.invoiceNumber}>{inv.invoice_number}</Field>
        <Field label={t.paidOn}>{fmtDate(payment.paid_at)}</Field>
        <Field label={t.paymentMethod}>{methodLabel(payment.method)}</Field>
        <Field label={t.refLabel}>{payment.reference_number}</Field>
      </section>
      <div className="mt-8 rounded-xl border-2 border-slate-800 p-6 text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-outfit">{t.amountPaid}</div>
        <div className="mt-1 font-outfit text-3xl font-bold text-slate-900">{fmtIDR(payment.amount)}</div>
      </div>
      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm font-jakarta">
        <div className="flex justify-between"><dt>{t.amount}</dt><dd>{fmtIDR(inv.total_amount)}</dd></div>
        <div className="flex justify-between"><dt>{t.balanceDue}</dt><dd>{fmtIDR(remaining)}</dd></div>
      </dl>
      <footer className="mt-10 text-center text-sm text-slate-700 font-jakarta">{t.thankYou}</footer>
    </>
  );
}
