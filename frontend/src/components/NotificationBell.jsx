import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Bell, CalendarClock, MessageCircle, UserX } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, fmtDate, fmtIDR } from "@/lib/api";
import { fill, whatsappNumber } from "@/lib/text";

const SEEN_KEY = (userId) => `ec_seen_notifs_${userId}`;

const readSeen = (userId) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY(userId)) || "[]"));
  } catch {
    return new Set();
  }
};
const writeSeen = (userId, ids) => {
  try {
    localStorage.setItem(SEEN_KEY(userId), JSON.stringify([...ids].slice(-200)));
  } catch {
    /* storage unavailable: the badge just won't remember what was read */
  }
};

const ICONS = { invoice_overdue: AlertTriangle, invoice_due_soon: CalendarClock, absent: UserX, classes_today: CalendarClock };
const TONE = { danger: "text-red-600 bg-red-50", warning: "text-amber-700 bg-amber-50", info: "text-teal-700 bg-teal-50" };

export default function NotificationBell() {
  const { t } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [seen, setSeen] = useState(() => new Set());
  const [open, setOpen] = useState(false);
  const [centre, setCentre] = useState("EduCentre");
  const wrapRef = useRef(null);

  const load = useCallback(() => {
    if (!user) return;
    api.get("/notifications").then((r) => setItems(r.data || [])).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    setSeen(readSeen(user.id));
    load();
    if (user.role === "admin") api.get("/settings").then((r) => setCentre(r.data?.centre_name || "EduCentre")).catch(() => {});
    const timer = setInterval(load, 120000);
    return () => clearInterval(timer);
  }, [user, load]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((n) => !seen.has(n.id)).length;

  const toggle = () => {
    if (!open) load();
    setOpen((o) => !o);
  };

  const markAllRead = () => {
    const next = new Set([...seen, ...items.map((n) => n.id)]);
    setSeen(next);
    writeSeen(user.id, next);
  };

  const message = (n) => {
    const vars = {
      name: n.student_name,
      invoice: n.invoice_number,
      amount: fmtIDR(n.amount),
      date: fmtDate(n.due_date || n.date),
      count: n.count,
    };
    const key = { invoice_overdue: "notifOverdue", invoice_due_soon: "notifDueSoon", absent: "notifAbsent", classes_today: "notifClassesToday" }[n.kind];
    return fill(t[key], vars);
  };

  const whatsappHref = (n) => {
    const number = whatsappNumber(n.phone);
    if (!number || n.kind !== "invoice_overdue") return null;
    const text = fill(t.waReminder, { centre, invoice: n.invoice_number, name: n.student_name, amount: fmtIDR(n.amount), date: fmtDate(n.due_date) });
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="glass-icon-button relative"
        title={t.notifTitle}
        aria-label={`${t.notifTitle}${unread ? ` (${unread})` : ""}`}
        aria-expanded={open}
        onClick={toggle}
        data-testid="notif-btn"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
            data-testid="notif-count"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t.notifTitle}
          className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,22rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl"
          data-testid="notif-panel"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-outfit text-sm font-semibold text-slate-900">{t.notifTitle}</h2>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-semibold text-teal-700 hover:underline" data-testid="notif-mark-read">
                {t.notifMarkAllRead}
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-600 font-jakarta">{t.notifEmpty}</li>}
            {items.map((n) => {
              const Icon = ICONS[n.kind] || Bell;
              const wa = whatsappHref(n);
              return (
                <li key={n.id} className={`flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0 ${seen.has(n.id) ? "" : "bg-teal-50/40"}`} data-testid="notif-item">
                  <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${TONE[n.severity] || TONE.info}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link to={n.link || "/dashboard"} onClick={() => setOpen(false)} className="block text-xs leading-5 text-slate-700 font-jakarta hover:text-slate-950">
                      {message(n)}
                    </Link>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                        data-testid="notif-whatsapp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {t.sendWhatsapp}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
