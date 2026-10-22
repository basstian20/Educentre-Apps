import { useState } from "react";
import { Download, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Btn, Modal } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { api, formatApiError } from "@/lib/api";
import { downloadText, parseCsv } from "@/lib/csv";

const TEMPLATE =
  "full_name,email,phone,dob,school_name,school_year\n" +
  "Aulia Putri,aulia@example.com,081234567890,2012-05-14,SMP Harapan,Year 7\n";

const FIELDS = ["full_name", "email", "phone", "dob", "school_name", "school_year"];

export default function StudentImport({ open, onClose, onDone }) {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const reset = () => {
    setRows([]);
    setFileName("");
    setResult(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    const parsed = parseCsv(await file.text()).map((r) => Object.fromEntries(FIELDS.map((f) => [f, r[f] || ""])));
    setRows(parsed);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/students/import", {
        rows: rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v || null]))),
      });
      setResult(data);
      if (data.created > 0) {
        toast.success(`${data.created} ${t.importDone}`);
        onDone();
      }
      setRows([]);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t.importTitle}
      size="lg"
      testid="import-modal"
      footer={
        <>
          <Btn variant="ghost" onClick={close}>{t.cancel}</Btn>
          <Btn onClick={submit} disabled={busy || rows.length === 0} testid="import-submit">
            {t.importNow}
            {rows.length > 0 && ` (${rows.length})`}
          </Btn>
        </>
      }
    >
      <p className="text-sm leading-6 text-slate-600 font-jakarta">{t.importHint}</p>
      <p className="mt-1 text-xs text-slate-600 font-jakarta">{t.importDefaultPassword}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Btn variant="outline" size="sm" onClick={() => downloadText("students-template.csv", TEMPLATE)}>
          <Download className="h-4 w-4" />
          {t.downloadTemplate}
        </Btn>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 font-outfit focus-within:ring-2 focus-within:ring-teal-500">
          <FileUp className="h-4 w-4" />
          {t.chooseFile}
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} data-testid="import-file" />
        </label>
      </div>

      {fileName && rows.length > 0 && (
        <div className="mt-4" data-testid="import-preview">
          <div className="mb-2 text-xs font-semibold text-slate-700 font-outfit">
            {fileName}: {rows.length} {t.importPreview}
          </div>
          <div className="max-h-56 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">full_name</th>
                  <th className="px-3 py-2">email</th>
                  <th className="px-3 py-2">school_year</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-1.5">{r.full_name || "—"}</td>
                    <td className="px-3 py-1.5">{r.email || "—"}</td>
                    <td className="px-3 py-1.5">{r.school_year || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 20 && <div className="mt-1 text-xs text-slate-600">+ {rows.length - 20}…</div>}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-jakarta" data-testid="import-result" role="status">
          <div className="font-semibold text-slate-800">
            {result.created} {t.importDone}
            {result.errors.length > 0 && `, ${result.errors.length} ${t.importSkipped}`}
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-32 list-disc space-y-0.5 overflow-auto pl-5 text-xs text-red-700">
              {result.errors.map((er) => (
                <li key={er.row}>
                  #{er.row} {er.email}: {er.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
