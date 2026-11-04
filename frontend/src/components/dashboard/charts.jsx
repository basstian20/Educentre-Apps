import { useEffect, useRef, useState } from "react";

// Grafik SVG ringan untuk dasbor (Tahap 3). Semua warna berasal dari variabel CSS (theme.css),
// sehingga otomatis mengikuti mode terang/gelap. Animasi menggambar diri ada di dashboard.css.

const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Angka yang menghitung naik. Langsung ke nilai akhir bila sistem meminta gerak hemat. */
export function useCountUp(target, duration = 900) {
  const goal = Number.isFinite(Number(target)) ? Number(target) : 0;
  const [value, setValue] = useState(() => (prefersReducedMotion() ? goal : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(goal);
      return undefined;
    }
    let frame = 0;
    let start = 0;
    const step = (now) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      setValue(goal * (1 - (1 - p) ** 3));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [goal, duration]);

  return value;
}

export function CountUp({ value, format }) {
  const current = useCountUp(value);
  const done = Math.round(current) === Math.round(Number(value) || 0);
  const shown = done ? Number(value) || 0 : Math.round(current);
  return <span className="num">{format ? format(shown) : shown.toLocaleString("id-ID")}</span>;
}

/** Lebar elemen (px) yang ikut berubah saat jendela diubah, supaya teks grafik tetap 12 px. */
function useWidth(ref, fallback = 520) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => setWidth(Math.max(240, Math.round(el.clientWidth)));
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

const round1 = (n) => Math.round(n * 10) / 10;

/** Garis mini di kartu KPI. Hanya digambar bila ada minimal 2 titik data nyata. */
export function Spark({ values }) {
  if (!values || values.length < 2) return null;
  const w = 96;
  const h = 30;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [round1((i * w) / (values.length - 1)), round1(h - 3 - ((v - min) / range) * (h - 8))]);
  const d = `M${pts.map((p) => p.join(",")).join(" L")}`;
  const last = pts[pts.length - 1];
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path className="sp-fill" d={`${d} L${w},${h} L0,${h}Z`} />
      <path className="sp-line" pathLength="1" d={d} />
      <circle className="sp-dot" cx={last[0]} cy={last[1]} r="2.4" />
    </svg>
  );
}

function smooth(p) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i += 1) {
    const [x0, y0] = p[i];
    const [x1, y1] = p[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

/** Grafik area dengan garis yang menggambar diri. values: angka; labels: teks sumbu x. */
export function AreaChart({ values, labels, unit = "", label }) {
  const ref = useRef(null);
  const W = useWidth(ref);
  const H = 200;
  const l = 38;
  const r = 12;
  const t = 14;
  const b = 28;
  // Persen selalu 0-100 supaya bentuk garis jujur; angka lain menyesuaikan data.
  const isPct = unit === "%";
  const lo = isPct ? 0 : Math.max(0, Math.floor((Math.min(...values) - 8) / 10) * 10);
  let hi = isPct ? 100 : Math.ceil(Math.max(...values) / 10) * 10;
  if (hi <= lo) hi = lo + 10;
  const pts = values.map((v, i) => [
    round1(values.length === 1 ? (l + W - r) / 2 : l + (i * (W - l - r)) / (values.length - 1)),
    round1(t + (1 - (v - lo) / (hi - lo)) * (H - t - b)),
  ]);
  const line = smooth(pts);
  const grid = [0, 1, 2, 3].map((g) => ({ y: t + (g * (H - t - b)) / 3, v: Math.round(hi - (g * (hi - lo)) / 3) }));
  // Hindari label sumbu x saling menimpa di layar sempit: tampilkan tiap n-label.
  const every = Math.max(1, Math.ceil((labels.length * 46) / (W - l - r)));

  return (
    <div ref={ref} className="area-wrap">
      <svg className="area" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {grid.map((g) => (
          <g key={g.y}>
            <line className="gl" x1={l} x2={W - r} y1={g.y} y2={g.y} />
            <text className="gt" x={l - 6} y={g.y + 4} textAnchor="end">{g.v}{unit}</text>
          </g>
        ))}
        {pts.length > 1 && (
          <>
            <path className="ar-fill" d={`${line} L${pts[pts.length - 1][0]},${H - b} L${pts[0][0]},${H - b}Z`} />
            <path className="ar-line" pathLength="1" d={line} />
          </>
        )}
        {pts.map((p, i) => (
          <g key={`${labels[i]}-${i}`}>
            <circle className="ar-dot" style={{ "--i": i }} cx={p[0]} cy={p[1]} r="4" />
            {i % every === 0 && <text className="gt" x={p[0]} y={H - 8} textAnchor="middle">{labels[i]}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Donat status. segments: [{ value, color }] (color = variabel CSS). center: [besar, kecil]. */
export function Donut({ segments, center, label }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <div className="donut2" role="img" aria-label={label}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="dn-bg" cx="60" cy="60" r="46" />
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          const dash = Math.max(0, pct - 1.2);
          const node = s.value > 0 && (
            <circle
              key={i}
              className="dn"
              style={{ "--i": i, stroke: s.color }}
              cx="60"
              cy="60"
              r="46"
              pathLength="100"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += pct;
          return node;
        })}
      </svg>
      <div className="dn-c">
        <b>{center[0]}</b>
        <small>{center[1]}</small>
      </div>
    </div>
  );
}

/** Cincin progres. pct 0-100; color = variabel CSS atau hex dari data. */
export function Ring({ pct, value, sub, color = "var(--pri)" }) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return (
    <div className="rg">
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle className="rg-bg" cx="40" cy="40" r="32" />
        <circle className="rg-v" style={{ stroke: color }} cx="40" cy="40" r="32" pathLength="100" strokeDasharray={`${safe} 100`} />
      </svg>
      <div className="rg-c"><b>{value}</b></div>
      <span>{sub}</span>
    </div>
  );
}
