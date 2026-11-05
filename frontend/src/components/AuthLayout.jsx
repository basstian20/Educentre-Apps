import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

// Kerangka halaman publik (lupa/atur ulang kata sandi) yang memakai gaya layar masuk (login.css).
export default function AuthLayout({ kicker, title, subtitle, testid, children }) {
  const { lang, setLang, t } = useLang();
  const { theme, toggle } = useTheme();
  const rootRef = useRef(null);
  const id = lang === "id";

  // Bentuk tanah liat di hero bergeser halus mengikuti kursor; mati bila sistem meminta gerak hemat.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let frame = 0;
    const onMove = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--px", (event.clientX / window.innerWidth - 0.5).toFixed(3));
        el.style.setProperty("--py", (event.clientY / window.innerHeight - 0.5).toFixed(3));
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className="lg" ref={rootRef} data-testid={testid}>
      <section className="lg-form-side">
        <div className="lg-form-in">
          <div className="lg-top">
            <div className="lg-brand">
              <span className="clay-orb lg-brand-mark" aria-hidden="true">E</span>
              <div>
                <div className="lg-brand-name">{t.appName}</div>
                <div className="lg-brand-sub">Learning OS</div>
              </div>
            </div>
            <div className="lg-tools">
              <div className="lg-lang">
                {["en", "id"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLang(item)}
                    className={lang === item ? "active" : ""}
                    aria-pressed={lang === item}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="glass-icon-button"
                onClick={toggle}
                aria-label={t.themeToggle}
                title={theme === "dark" ? t.themeLight : t.themeDark}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="lg-kicker">{kicker}</div>
          <h1>{title}</h1>
          <p className="lg-sub">{subtitle}</p>
          {children}
        </div>
      </section>

      <aside className="lg-hero" aria-label={t.appName}>
        <div className="clay" aria-hidden="true">
          <i className="cl-sp" />
          <i className="cl-tor" />
          <i className="cl-cb" />
          <i className="cl-pl" />
          <i className="cl-st" />
          <i className="cl-sm" />
        </div>
        <div className="lg-hero-in">
          <h2>{id ? "Kelola setiap langkah pembelajaran dengan tenang." : "Manage every step of learning with clarity."}</h2>
        </div>
      </aside>
    </main>
  );
}
