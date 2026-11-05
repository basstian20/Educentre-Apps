import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api, formatApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function ForgotPassword() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [debugUrl, setDebugUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setDebugUrl(data.debug_reset_url || ""); // hanya ada di server dev/demo tanpa email sungguhan
      setSent(true);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout testid="forgot-page" kicker={t.forgotKicker} title={t.forgotTitle} subtitle={t.forgotSubtitle}>
      {sent ? (
        <div className="lg-form" data-testid="forgot-sent">
          <div className="lg-notice" role="status">{t.resetLinkSent}</div>
          {debugUrl && (
            <a className="lg-notice lg-notice-dev" href={debugUrl} data-testid="forgot-debug-link">
              {t.devResetLink}
            </a>
          )}
          <Link className="lg-back" to="/login">
            <ArrowLeft className="h-4 w-4" /> {t.backToLogin}
          </Link>
        </div>
      ) : (
        <form className="lg-form" onSubmit={onSubmit}>
          <label className="lg-field">
            <span>{t.email}</span>
            <div>
              <Mail className="h-4 w-4" />
              <input
                className="field-clay"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                data-testid="forgot-email"
              />
            </div>
          </label>
          {error && (
            <div className="lg-error" role="alert" data-testid="forgot-error">
              {error}
            </div>
          )}
          <button className="btn-clay is-pri lg-submit" type="submit" disabled={loading} data-testid="forgot-submit">
            <span>{loading ? t.sending : t.sendResetLink}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link className="lg-back" to="/login">
            <ArrowLeft className="h-4 w-4" /> {t.backToLogin}
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
