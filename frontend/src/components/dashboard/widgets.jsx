import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { CountUp, Spark } from "./charts";

/** tx("Indonesia", "English"): pola dua bahasa yang sama dengan halaman lain. */
export function useTx() {
  const { lang } = useLang();
  return useCallback((id, en) => (lang === "id" ? id : en), [lang]);
}

/** Jam sekarang, diperbarui tiap menit agar status sesi (berjalan/selesai) ikut bergeser. */
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

/** "next" | "now" | "done" untuk satu sesi kelas pada hari ini. */
export function sessionStatus(cls, now) {
  const start = toMinutes(cls.time_start);
  const end = toMinutes(cls.time_end);
  if (start === null) return "next";
  const current = now.getHours() * 60 + now.getMinutes();
  if (current < start) return "next";
  if (end !== null && current >= end) return "done";
  return "now";
}

/** Hari ini: 1 = Senin ... 7 = Minggu (sama dengan schedule_days di backend). */
export const todayDow = (now = new Date()) => now.getDay() || 7;

/** Tanggal lokal YYYY-MM-DD (bukan UTC, supaya tidak meleset di pagi hari WIB). */
export const localISO = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

export function initials(value = "") {
  return value.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "EC";
}

/** Kartu dasbor dengan judul dan tautan opsional. */
export function DCard({ title, to, action, testid, className = "", children }) {
  const tx = useTx();
  return (
    <section className={`dcard clay-card ${className}`} data-testid={testid}>
      {(title || to) && (
        <header className="dcard-head">
          <h2>{title}</h2>
          {to && (
            <Link className="dcard-link" to={to}>
              {action || tx("Lihat semua", "View all")}
            </Link>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

/** Kartu angka utama: bola ikon 3D, angka menghitung naik, mini-grafik opsional. */
export function KpiTile({ label, value, format, sub, icon: Icon, tone = 1, testid, spark, loading }) {
  return (
    <div className="kpi clay-card clay-hover" style={{ "--t": `var(--c${tone})` }} data-testid={testid}>
      {loading ? (
        <SkeletonBlock compact />
      ) : (
        <>
          <span className="clay-orb ki">{Icon && <Icon className="h-5 w-5" strokeWidth={2.2} />}</span>
          <div className="kl">{label}</div>
          <div className="kv">
            {typeof value === "number" ? <CountUp value={value} format={format} /> : <span className="num">{value}</span>}
          </div>
          {sub && <div className="ks">{sub}</div>}
          <Spark values={spark} />
        </>
      )}
    </div>
  );
}

/** Garis waktu sesi hari ini. items: { id, title, time, meta, status, extra }. */
export function Timeline({ items }) {
  const tx = useTx();
  const label = {
    now: [tx("Berjalan", "In progress"), "badge-green"],
    done: [tx("Selesai", "Done"), "badge-gray"],
    next: [tx("Akan datang", "Upcoming"), "badge-blue"],
  };
  return (
    <ol className="tl">
      {items.map((item) => {
        const [text, cls] = label[item.status] || label.next;
        return (
          <li key={item.id} className={`tli ${item.status}`}>
            <span className="tld" aria-hidden="true" />
            <div className="tlh">
              <b>{item.title}</b>
              <span className="tlt">{item.time}</span>
            </div>
            <small>{item.meta}</small>
            <div className="tla">
              <span className={`badge ${cls}`}>{text}</span>
              {item.extra}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Kartu rapor yang bisa dibalik. Depan: nama, rata-rata. Belakang: rata-rata per mata pelajaran.
 * subjects: [{ id, name, avg, color }]
 */
export function FlipCard({ name, code, meta, avg, subjects }) {
  const tx = useTx();
  const [flipped, setFlipped] = useState(false);
  const toggle = () => setFlipped((v) => !v);
  const onKey = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };
  return (
    <div
      className={`flip ${flipped ? "flipped" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={tx("Balik kartu rapor", "Flip report card")}
      onClick={toggle}
      onKeyDown={onKey}
      data-testid="card-report-flip"
    >
      <div className="fl-in">
        <div className="fl-f" aria-hidden={flipped}>
          <div className="fl-top">
            <span className="fl-chip">{tx("KARTU RAPOR", "REPORT CARD")}</span>
            <span>{code}</span>
          </div>
          <h3>{name}</h3>
          <p>{meta}</p>
          <div className="fl-avg">
            <b>{avg === null ? "—" : Math.round(avg)}</b>
            <small>{tx("rata-rata nilai", "average score")}</small>
          </div>
          <small className="hintf">{tx("Ketuk untuk membalik", "Tap to flip")}</small>
        </div>
        <div className="fl-b" aria-hidden={!flipped}>
          <div className="fl-top">
            <span className="fl-chip">{tx("PER MATA PELAJARAN", "BY SUBJECT")}</span>
          </div>
          {subjects.length ? (
            <div className="fl-list">
              {subjects.map((s) => (
                <div className="fl-r" key={s.id} style={{ "--c": s.color || "var(--pri)" }}>
                  <span><i className="sdot" />{s.name}</span>
                  <b>{Math.round(s.avg)}</b>
                  <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, s.avg))}%` }} /></div>
                </div>
              ))}
            </div>
          ) : (
            <p>{tx("Belum ada nilai terbit", "No published results yet")}</p>
          )}
          <small className="hintf">{tx("Ketuk untuk kembali", "Tap to flip back")}</small>
        </div>
      </div>
    </div>
  );
}

export function EmptyBlock({ icon: Icon = CalendarDays, title, text }) {
  return (
    <div className="dempty">
      <span className="clay-orb dempty-ic"><Icon className="h-5 w-5" /></span>
      <strong>{title}</strong>
      {text && <small>{text}</small>}
    </div>
  );
}

export function SkeletonBlock({ compact = false }) {
  return (
    <div className={`skeleton-stack ${compact ? "py-1" : "py-3"}`} role="status" aria-label="Loading">
      <span />
      <span />
      {!compact && <span />}
    </div>
  );
}
