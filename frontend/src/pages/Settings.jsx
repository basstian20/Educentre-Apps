import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, Btn, Input, Textarea } from "@/components/UI";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function Settings() {
  const { t } = useLang();
  const { user, setUser } = useAuth();
  const isAdmin = user?.role === "admin";

  const [profile, setProfile] = useState({ full_name: user?.full_name || "", phone: user?.phone || "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [centre, setCentre] = useState({ centre_name: "", address: "", phone: "", email: "" });
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api.get("/settings").then((r) => setCentre({ centre_name: "", address: "", phone: "", email: "", ...r.data })).catch(() => {});
  }, []);

  const run = async (name, fn, okMessage) => {
    setBusy(name);
    try {
      await fn();
      toast.success(okMessage);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setBusy("");
    }
  };

  const saveProfile = () =>
    run("profile", async () => {
      const { data } = await api.patch("/auth/me", profile);
      setUser(data);
    }, t.profileSaved);

  const savePassword = async () => {
    if (pw.new_password !== pw.confirm) {
      toast.error(t.passwordMismatch);
      return;
    }
    await run("password", async () => {
      await api.post("/auth/change-password", { current_password: pw.current_password, new_password: pw.new_password });
      setPw({ current_password: "", new_password: "", confirm: "" });
    }, t.passwordChanged);
  };

  const saveCentre = () =>
    run("centre", () => api.put("/settings", { centre_name: centre.centre_name, address: centre.address, phone: centre.phone, email: centre.email }), t.saved);

  return (
    <Layout title={t.settingsTitle} subtitle={t.settingsSubtitle}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title={t.profile} testid="profile-card">
          <div className="space-y-3">
            <Input label={t.fullName} value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} testid="profile-name" />
            <Input label={t.email} value={user?.email || ""} disabled readOnly />
            <Input label={t.phone} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} testid="profile-phone" />
            <Btn onClick={saveProfile} disabled={busy === "profile" || !profile.full_name.trim()} testid="profile-save">{t.save}</Btn>
          </div>
        </Card>

        <Card title={t.changePassword} testid="password-card">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              savePassword();
            }}
          >
            <Input label={t.currentPassword} type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} testid="pw-current" />
            <Input label={t.newPassword} type="password" autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} testid="pw-new" />
            <Input label={t.confirmPassword} type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} testid="pw-confirm" />
            <Btn type="submit" disabled={busy === "password" || !pw.current_password || !pw.new_password} testid="pw-save">{t.changePassword}</Btn>
          </form>
        </Card>

        {isAdmin && (
          <Card title={t.centreDetails} testid="centre-card" className="lg:col-span-2">
            <p className="mb-3 text-xs text-slate-600 font-jakarta">{t.centreHint}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label={t.centreName} value={centre.centre_name} onChange={(e) => setCentre({ ...centre, centre_name: e.target.value })} className="sm:col-span-2" testid="centre-name" />
              <Textarea label={t.address} rows={2} value={centre.address || ""} onChange={(e) => setCentre({ ...centre, address: e.target.value })} className="sm:col-span-2" />
              <Input label={t.phone} value={centre.phone || ""} onChange={(e) => setCentre({ ...centre, phone: e.target.value })} />
              <Input label={t.email} value={centre.email || ""} onChange={(e) => setCentre({ ...centre, email: e.target.value })} />
            </div>
            <div className="mt-4">
              <Btn onClick={saveCentre} disabled={busy === "centre" || !centre.centre_name.trim()} testid="centre-save">{t.save}</Btn>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
