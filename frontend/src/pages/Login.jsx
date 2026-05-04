import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { formatApiError } from "@/lib/api";
import { Btn, Input } from "@/components/UI";
import { GraduationCap } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@educentre.id");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
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

  const quickFill = (em, pw) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left: image side */}
      <div
        className="hidden md:block md:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.pexels.com/photos/35865718/pexels-photo-35865718.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200)",
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.65), rgba(37,99,235,0.55))" }} />
        <div className="relative h-full flex flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-outfit font-bold text-xl">{t.appName}</div>
              <div className="text-xs text-white/70">{t.appSubtitle}</div>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-outfit font-semibold leading-tight">
              {lang === "id" ? "Bimbel modern, dikelola dengan elegan." : "Modern tuition centres, run with elegance."}
            </h2>
            <p className="text-white/80 mt-3 text-sm font-jakarta max-w-md">
              {lang === "id"
                ? "Satu sistem untuk manajemen, pengajar, siswa, dan orang tua. Otomatiskan tagihan, kehadiran, dan progres akademik."
                : "One system for management, educators, students, and parents. Automate billing, attendance, and academic progress."}
            </p>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-8">
            <div className="flex bg-slate-100 rounded-lg p-0.5" data-testid="login-lang">
              {["en", "id"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  data-testid={`login-lang-${l}`}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition ${
                    lang === l ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <h1 className="text-3xl font-outfit font-semibold text-slate-900 tracking-tight">{t.welcomeBack}</h1>
          <p className="text-sm text-slate-500 mt-2 font-jakarta">{t.loginSubtitle}</p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Input
              label={t.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              testid="login-email"
              required
              autoComplete="email"
            />
            <Input
              label={t.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              testid="login-password"
              required
              autoComplete="current-password"
            />
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-jakarta" data-testid="login-error">
                {error}
              </div>
            )}
            <Btn type="submit" testid="login-submit" disabled={loading} className="w-full" size="lg">
              {loading ? t.signingIn : t.signIn}
            </Btn>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-outfit font-semibold mb-3">
              {lang === "id" ? "Akun Demo" : "Demo Accounts"}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: t.role_admin, em: "admin@educentre.id", pw: "admin123", color: "#2563EB" },
                { role: t.role_educator, em: "fariz@educentre.id", pw: "educator123", color: "#059669" },
                { role: t.role_student, em: "aiman@educentre.id", pw: "student123", color: "#D97706" },
                { role: t.role_parent, em: "ibu.nur@educentre.id", pw: "parent123", color: "#7C3AED" },
              ].map((a) => (
                <button
                  key={a.em}
                  type="button"
                  onClick={() => quickFill(a.em, a.pw)}
                  data-testid={`demo-${a.em}`}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider font-outfit" style={{ color: a.color }}>
                    {a.role}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate font-jakarta">{a.em}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
