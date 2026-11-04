import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Globe, LogOut, Moon, Settings as SettingsIcon, Sparkles, Sun } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { getNav } from "./Sidebar";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/i18n";
import { useMotion } from "../lib/motion";
import { useTheme } from "../lib/theme";

// Ctrl+K / Cmd+K membuka palet: pindah halaman, aksi cepat, dan (untuk admin) cari siswa.
export default function CommandPalette({ open, onOpenChange }) {
  const { t, lang, setLang } = useLang();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { stored, setMotion, systemReduced } = useMotion();
  const navigate = useNavigate();
  const [students, setStudents] = useState(null);

  // Daftar siswa diambil sekali, hanya saat palet pertama kali dibuka oleh admin.
  useEffect(() => {
    if (!open || students !== null || user?.role !== "admin") return;
    let cancelled = false;
    api.get("/students").then((r) => !cancelled && setStudents(r.data || [])).catch(() => !cancelled && setStudents([]));
    return () => { cancelled = true; };
  }, [open, students, user]);

  const pages = useMemo(() => {
    if (!user) return [];
    const items = getNav(user.role, t).flatMap((sec) => sec.items);
    items.push({ label: t.settings, to: "/settings", icon: SettingsIcon });
    return items;
  }, [user, t]);

  if (!user) return null;

  const run = (fn) => () => {
    onOpenChange(false);
    fn();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cmd-dialog overflow-hidden p-0" aria-describedby={undefined} data-testid="command-palette">
        <DialogTitle className="sr-only">{t.cmdTitle}</DialogTitle>
        <Command className="cmd-root">
          <CommandInput placeholder={t.cmdPlaceholder} data-testid="command-input" />
          <CommandList>
            <CommandEmpty>{t.cmdEmpty}</CommandEmpty>
            <CommandGroup heading={t.cmdPages}>
              {pages.map((p) => {
                const Icon = p.icon;
                return (
                  <CommandItem key={p.to + p.label} value={`${t.cmdPages} ${p.label}`} onSelect={run(() => navigate(p.to))} data-testid={`cmd-page-${p.to.slice(1)}`}>
                    <Icon /> {p.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading={t.cmdActions}>
              <CommandItem value={`${t.cmdActions} ${t.themeToggle}`} onSelect={run(toggle)}>
                {theme === "dark" ? <Sun /> : <Moon />} {theme === "dark" ? t.themeLight : t.themeDark}
              </CommandItem>
              <CommandItem value={`${t.cmdActions} ${t.cmdSwitchLang}`} onSelect={run(() => setLang(lang === "en" ? "id" : "en"))}>
                <Globe /> {t.cmdSwitchLang}
              </CommandItem>
              {!systemReduced && (
                <CommandItem value={`${t.cmdActions} ${t.cmdToggleMotion}`} onSelect={run(() => setMotion(stored === "full" ? "lite" : "full"))}>
                  <Sparkles /> {t.cmdToggleMotion}
                  <CommandShortcut>{stored === "full" ? t.motionFull : t.motionLite}</CommandShortcut>
                </CommandItem>
              )}
              <CommandItem value={`${t.cmdActions} ${t.logout}`} onSelect={run(logout)}>
                <LogOut /> {t.logout}
              </CommandItem>
            </CommandGroup>
            {students && students.length > 0 && (
              <CommandGroup heading={t.cmdStudents}>
                {students.map((s) => (
                  <CommandItem key={s.id} value={`${t.cmdStudents} ${s.full_name} ${s.student_code || ""}`} onSelect={run(() => navigate(`/students/${s.id}/report`))}>
                    <FileText /> {s.full_name}
                    <CommandShortcut>{t.cmdOpenReport}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
