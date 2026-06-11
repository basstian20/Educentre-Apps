import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { formatApiError } from "@/lib/api";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  { roleKey: "role_admin", email: "admin@educentre.id", password: "admin123", icon: BarChart3, tone: "teal" },
  { roleKey: "role_educator", email: "fariz@educentre.id", password: "educator123", icon: GraduationCap, tone: "purple" },
  { roleKey: "role_student", email: "aiman@educentre.id", password: "student123", icon: BookOpen, tone: "orange" },
  { roleKey: "role_parent", email: "ibu.nur@educentre.id", password: "parent123", icon: Users, tone: "pink" },
];

export default function Login() {
  const { login } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@educentre.id");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="login-canvas" data-testid="login-page">
      <div className="login-shell">
        <section className="login-story" aria-label={t.appName}>
          <Brand t={t} />

          <div className="login-story-copy">
            <div className="login-eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === "id" ? "Ruang belajar yang lebih terhubung" : "A more connected learning space"}
            </div>
            <h1>
              {lang === "id"
                ? "Kelola setiap langkah pembelajaran dengan tenang."
                : "Manage every step of learning with clarity."}
            </h1>
            <p>
              {lang === "id"
                ? "Satu ruang kerja untuk manajemen, pengajar, siswa, dan orang tua. Semua informasi penting tetap dekat dan mudah dipahami."
                : "One calm workspace for management, educators, students, and parents. Everything important stays close and easy to understand."}
            </p>
            <div className="login-benefits">
              {[
                lang === "id" ? "Jadwal dan kehadiran terpusat" : "Centralized schedules and attendance",
                lang === "id" ? "Progres akademik yang jelas" : "Clear academic progress",
                lang === "id" ? "Tagihan dan komunikasi terpadu" : "Connected billing and communication",
              ].map((item) => (
                <div key={item}>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <LearningIllustration />
          <div className="login-story-footer">
            <span>{lang === "id" ? "Dipercaya untuk pembelajaran sehari-hari" : "Built for everyday learning"}</span>
            <span className="login-live-dot" />
            <strong>EduCentre OS</strong>
          </div>
        </section>

        <section className="login-form-side">
          <div className="login-mobile-head">
            <Brand t={t} compact />
            <LanguageSwitch lang={lang} setLang={setLang} />
          </div>

          <div className="login-form-card">
            <div className="hidden justify-end md:flex">
              <LanguageSwitch lang={lang} setLang={setLang} />
            </div>

            <div className="login-form-heading">
              <div className="login-welcome-icon"><GraduationCap className="h-5 w-5" /></div>
              <div>
                <div className="login-kicker">{lang === "id" ? "Selamat datang kembali" : "Welcome back"}</div>
                <h2>{t.welcomeBack}</h2>
              </div>
            </div>
            <p className="login-subtitle">{t.loginSubtitle}</p>

            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
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
                <div className="login-error" data-testid="login-error" role="alert">
                  {error}
                </div>
              )}
              <button className="login-submit" type="submit" data-testid="login-submit" disabled={loading}>
                <span>{loading ? t.signingIn : t.signIn}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="login-divider">
              <span>{lang === "id" ? "atau gunakan akun demo" : "or use a demo account"}</span>
            </div>

            <div className="login-demo-grid">
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
                    className="login-demo-card"
                  >
                    <span className={`login-demo-icon ${account.tone}`}><Icon className="h-4 w-4" /></span>
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
      </div>
    </main>
  );
}

function Brand({ t, compact = false }) {
  return (
    <div className={`login-brand ${compact ? "compact" : ""}`}>
      <div className="login-brand-mark">E<span /></div>
      <div>
        <div className="login-brand-name">{t.appName}</div>
        <div className="login-brand-subtitle">Learning OS</div>
      </div>
    </div>
  );
}

function LanguageSwitch({ lang, setLang }) {
  return (
    <div className="login-language" data-testid="login-lang">
      {["en", "id"].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLang(item)}
          data-testid={`login-lang-${item}`}
          className={lang === item ? "active" : ""}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function LoginField({ label, icon: Icon, testid, ...props }) {
  return (
    <label className="login-field">
      <span>{label}</span>
      <div>
        <Icon className="h-4 w-4" />
        <input data-testid={testid} required {...props} />
      </div>
    </label>
  );
}

function LearningIllustration() {
  return (
    <div className="login-illustration" aria-hidden="true">
      <div className="login-orbit orbit-one" />
      <div className="login-orbit orbit-two" />
      <div className="login-illustration-card">
        <div className="illustration-card-top">
          <span><BookOpen /></span>
          <i />
        </div>
        <div className="illustration-lines"><span /><span /><span /></div>
        <div className="illustration-progress"><span /></div>
      </div>
      <div className="login-floating-icon icon-users"><Users /></div>
      <div className="login-floating-icon icon-cap"><GraduationCap /></div>
      <div className="login-floating-icon icon-chart"><BarChart3 /></div>
    </div>
  );
}
