import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api, formatApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function ResetPassword() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      toast.success(t.resetDone);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout testid="reset-page" kicker={t.forgotKicker} title={t.resetTitle} subtitle={t.resetSubtitle}>
      {token ? (
        <form className="lg-form" onSubmit={onSubmit}>
          <label className="lg-field">
            <span>{t.newPassword}</span>
            <div>
              <LockKeyhole className="h-4 w-4" />
              <input
                className="field-clay"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                data-testid="reset-password"
              />
            </div>
          </label>
          <label className="lg-field">
            <span>{t.confirmPassword}</span>
            <div>
              <LockKeyhole className="h-4 w-4" />
              <input
                className="field-clay"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                data-testid="reset-confirm"
              />
            </div>
          </label>
          {error && (
            <div className="lg-error" role="alert" data-testid="reset-error">
              {error}
            </div>
          )}
          <button className="btn-clay is-pri lg-submit" type="submit" disabled={loading} data-testid="reset-submit">
            <span>{loading ? t.sending : t.resetPassword}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link className="lg-back" to="/login">
            <ArrowLeft className="h-4 w-4" /> {t.backToLogin}
          </Link>
        </form>
      ) : (
        <div className="lg-form" data-testid="reset-missing-token">
          <div className="lg-error" role="alert">{t.resetMissingToken}</div>
          <Link className="lg-back" to="/forgot-password">
            <ArrowLeft className="h-4 w-4" /> {t.forgotTitle}
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
