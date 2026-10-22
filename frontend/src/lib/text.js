// Fills {placeholders} in a translated string: fill(t.notifAbsent, { name, date })
export function fill(template, vars = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ""));
}

// Indonesian numbers are often written 08xx; WhatsApp links need the 62 country code.
export function whatsappNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}
