// Konfeti ringan di kanvas sementara (tanpa pustaka). Tidak berbuat apa-apa pada mode gerak hemat.
const COLORS = ["--pri", "--ok", "--warn", "--info", "--bad", "--pl"];

export function fireConfetti({ x = 0.5, y = 0.35, count = 110 } = {}) {
  if (typeof document === "undefined") return;
  if (document.documentElement.dataset.motion === "lite") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const css = getComputedStyle(document.documentElement);
  const palette = COLORS.map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
  if (palette.length === 0) palette.push("#2563eb", "#10b981", "#f59e0b");

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const ox = x * window.innerWidth;
  const oy = y * window.innerHeight;
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2;
    const v = 4 + Math.random() * 9;
    return {
      x: ox, y: oy,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
      c: palette[Math.floor(Math.random() * palette.length)],
    };
  });

  const start = performance.now();
  const DURATION = 2200;
  const tick = (now) => {
    const t = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const fade = Math.max(0, 1 - Math.max(0, t - 1400) / (DURATION - 1400));
    parts.forEach((p) => {
      p.vy += 0.22;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (t < DURATION) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
