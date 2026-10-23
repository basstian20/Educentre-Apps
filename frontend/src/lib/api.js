import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Attach token from localStorage if present (Bearer fallback)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ec_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Server messages are English; show Indonesian when that language is selected.
const ID_ERRORS = {
  "Email already exists": "Email sudah terdaftar",
  "Email already registered": "Email sudah terdaftar",
  "Invalid email or password": "Email atau kata sandi salah",
  "Account disabled": "Akun dinonaktifkan",
  "Not authenticated": "Silakan masuk terlebih dahulu",
  "Token expired": "Sesi berakhir, silakan masuk lagi",
  "Insufficient permissions": "Anda tidak punya izin untuk tindakan ini",
  "Already enrolled in this class": "Siswa sudah terdaftar di kelas ini",
  "Class is full": "Kelas sudah penuh",
  "Current password is incorrect": "Kata sandi saat ini salah",
  "Name can't be empty": "Nama tidak boleh kosong",
  "New password must be at least 6 characters": "Kata sandi baru minimal 6 karakter",
  "The file is empty": "File kosong",
  "File is too large (max 5 MB)": "File terlalu besar (maks. 5 MB)",
  "This invoice has payments and can't be deleted": "Tagihan ini sudah ada pembayaran dan tidak bisa dihapus",
  "Amounts can't be changed after a payment was recorded": "Jumlah tidak bisa diubah setelah ada pembayaran",
  "Not allowed to open this file": "Anda tidak boleh membuka file ini",
  "Not allowed to view this invoice": "Anda tidak boleh melihat tagihan ini",
  "Not allowed to view this report": "Anda tidak boleh melihat rapor ini",
  "You can only change your own announcements": "Anda hanya bisa mengubah pengumuman milik sendiri",
  "Announcement not found": "Pengumuman tidak ditemukan",
  "Assessment not found": "Penilaian tidak ditemukan",
  "Class not found": "Kelas tidak ditemukan",
  "Educator not found": "Pengajar tidak ditemukan",
  "File not found": "File tidak ditemukan",
  "Invoice not found": "Tagihan tidak ditemukan",
  "Parent not found": "Orang tua tidak ditemukan",
  "Student not found": "Siswa tidak ditemukan",
  "Something went wrong. Please try again.": "Terjadi kesalahan. Silakan coba lagi.",
};

function currentLang() {
  try {
    return localStorage.getItem("ec_lang") || "en";
  } catch {
    return "en"; // storage unavailable
  }
}

function translateError(message) {
  return currentLang() === "id" ? ID_ERRORS[message] || message : message;
}

export function formatApiError(detail) {
  if (detail == null) return translateError("Something went wrong. Please try again.");
  if (typeof detail === "string") return translateError(detail);
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const fmtIDR = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (s) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(currentLang() === "id" ? "id-ID" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return s;
  }
};
