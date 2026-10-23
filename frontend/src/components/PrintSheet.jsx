import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Btn, ErrorState, SkeletonRows } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useTheme, applyTheme } from "@/lib/theme";

// Plain A4-style page for invoices, receipts and report cards.
// The toolbar and everything marked .no-print disappear when printing,
// so "Save as PDF" in the print dialog gives a clean document.
export default function PrintSheet({ loading, error, onRetry, children }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Documents are paper: always light, then back to the user's theme when leaving the page.
  useEffect(() => {
    applyTheme("light");
    return () => applyTheme(theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 print:bg-white print:p-0 sm:px-6">
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3">
        <Btn variant="outline" size="sm" onClick={() => navigate(-1)} testid="print-back">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Btn>
        <Btn size="sm" onClick={() => window.print()} disabled={loading || error} testid="print-btn">
          <Printer className="h-4 w-4" />
          {t.printSave}
        </Btn>
      </div>
      <main className="print-sheet mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-card sm:p-10" data-testid="print-sheet">
        {loading ? <SkeletonRows rows={6} /> : error ? <ErrorState onRetry={onRetry} /> : children}
      </main>
    </div>
  );
}

export function SheetHeader({ centre, heading, meta }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-800 pb-4">
      <div>
        <div className="font-outfit text-xl font-bold text-slate-900">{centre?.centre_name || "EduCentre"}</div>
        {centre?.address && <div className="mt-1 whitespace-pre-line text-xs text-slate-600 font-jakarta">{centre.address}</div>}
        <div className="text-xs text-slate-600 font-jakarta">{[centre?.phone, centre?.email].filter(Boolean).join(" · ")}</div>
      </div>
      <div className="text-right">
        <div className="font-outfit text-2xl font-bold tracking-wide text-slate-900">{heading}</div>
        {meta && <div className="mt-1 text-xs text-slate-600 font-jakarta">{meta}</div>}
      </div>
    </header>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-outfit">{label}</div>
      <div className="mt-0.5 text-sm text-slate-900 font-jakarta">{children || "—"}</div>
    </div>
  );
}
