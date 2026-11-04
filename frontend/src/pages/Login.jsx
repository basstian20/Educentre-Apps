import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatApiError } from "@/lib/api";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  LockKeyhole,
  Mail,
  Moon,
  Sun,
  Users,
} from "lucide-react";

// Warna ikon akun demo memakai deret warna KPI (--c1..--c5), bukan hex.
const DEMO_ACCOUNTS = [
  { roleKey: "role_admin", email: "admin@educentre.id", password: "admin123", icon: BarChart3, tone: 1 },
  { roleKey: "role_educator", email: "fariz@educentre.id", password: "educator123", icon: GraduationCap, tone: 4 },
  { roleKey: "role_student", email: "aiman@educentre.id", password: "student123", icon: BookOpen, tone: 3 },
  { roleKey: "role_parent", email: "ibu.nur@educentre.id", password: "parent123", icon: Users, tone: 2 },
];

export default function Login() {
  const { login } = useAuth();
  const { lang, setLang, t } = useLang();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@educentre.id");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  // Bentuk tanah liat di hero bergeser halus mengikuti kursor. Mati bila sistem meminta gerak hemat.
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

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const id = lang === "id";

  return (
    <main className="lg" ref={rootRef} data-testid="login-page">
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
              <LanguageSwitch lang={lang} setLang={setLang} />
              <button
                type="button"
                className="glass-icon-button"
                onClick={toggle}
                aria-label={t.themeToggle}
                title={theme === "dark" ? t.themeLight : t.themeDark}
                data-testid="login-theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="lg-kicker">{id ? "Portal masuk" : "Sign-in portal"}</div>
          <h1>{t.welcomeBack}</h1>
          <p className="lg-sub">{t.loginSubtitle}</p>

          <form className="lg-form" onSubmit={onSubmit}>
            <LoginField
              label={t.email}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              testid="login-email"
              autoComplete="email"
              icon={Mail}
            />
            <LoginField
              label={t.password}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              testid="login-password"
              autoComplete="current-password"
              icon={LockKeyhole}
            />
            {error && (
              <div className="lg-error" data-testid="login-error" role="alert">
                {error}
              </div>
            )}
            <button className="btn-clay is-pri lg-submit" type="submit" data-testid="login-submit" disabled={loading}>
              <span>{loading ? t.signingIn : t.signIn}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="lg-divider">
            <span>{id ? "atau gunakan akun demo" : "or use a demo account"}</span>
          </div>

          <div className="lg-demos">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                    setError("");
                  }}
                  data-testid={`demo-${account.email}`}
                  className="lg-demo clay-card clay-hover"
                  style={{ "--t": `var(--c${account.tone})` }}
                >
                  <span className="clay-orb lg-demo-ic"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0">
                    <strong>{t[account.roleKey]}</strong>
                    <small>{account.email}</small>
                  </span>
                </button>
              );
            })}
          </div>
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
          <h2>
            {id ? "Kelola setiap langkah pembelajaran dengan tenang." : "Manage every step of learning with clarity."}
          </h2>
          <p>
            {id
              ? "Satu ruang kerja untuk manajemen, pengajar, siswa, dan orang tua. Semua informasi penting tetap dekat dan mudah dipahami."
              : "One calm workspace for management, educators, students, and parents. Everything important stays close and easy to understand."}
          </p>
          <div className="lg-roles">
            {["role_admin", "role_educator", "role_student", "role_parent"].map((key) => (
              <span key={key}>{t[key]}</span>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}

function LanguageSwitch({ lang, setLang }) {
  return (
    <div className="lg-lang" data-testid="login-lang">
      {["en", "id"].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLang(item)}
          data-testid={`login-lang-${item}`}
          className={lang === item ? "active" : ""}
          aria-pressed={lang === item}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function LoginField({ label, icon: Icon, testid, ...props }) {
  return (
    <label className="lg-field">
      <span>{label}</span>
      <div>
        <Icon className="h-4 w-4" />
        <input className="field-clay" data-testid={testid} required {...props} />
      </div>
    </label>
  );
}
