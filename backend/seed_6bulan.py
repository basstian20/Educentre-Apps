"""Isi database dengan data sampel seolah pusat les sudah beroperasi 6 bulan.

Jalankan manual (tidak dipanggil saat startup):

    python seed_6bulan.py --dry-run                       # hitung saja, tanpa menulis
    python seed_6bulan.py --yes --backup-dir <folder>      # cadangkan lalu isi
    python seed_6bulan.py --rollback --yes                 # hapus persis yang pernah disisipkan

Data lama tidak diubah atau dihapus. Dokumen yang disisipkan dicatat di koleksi
`seed_manifest` agar bisa ditarik kembali tanpa menambah kolom penanda ke dokumen.
Target database mengikuti MONGO_URL / DB_NAME (lihat backend/.env).
"""
import argparse
import asyncio
import json
import os
import random
import sys
import uuid
from datetime import date, datetime, timedelta, timezone

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from auth import hash_password  # noqa: E402
from database import get_db, close_client  # noqa: E402

MANIFEST_ID = "sampel-6bulan"
MONTHS_BACK = 6
HOLIDAYS = {"2026-05-27", "2026-08-17"}  # Idul Adha, HUT RI (perkiraan)

MONTH_ID = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus",
            "September", "Oktober", "November", "Desember"]

MALE = ["Dimas", "Raka", "Fajar", "Bayu", "Rizky", "Arif", "Naufal", "Kevin", "Alvin", "Hafiz",
        "Gilang", "Rafi", "Daffa", "Farhan", "Ilham", "Zaki", "Reyhan", "Bagas", "Yusuf", "Adit",
        "Faisal", "Rangga", "Satria", "Wahyu"]
FEMALE = ["Salsa", "Nadia", "Aulia", "Putri", "Keisha", "Zahra", "Alya", "Citra", "Dinda", "Fitri",
          "Hana", "Intan", "Jasmine", "Khansa", "Laila", "Maya", "Nayla", "Olivia", "Qonita", "Rania",
          "Syifa", "Tiara", "Vania", "Yasmin"]
MIDDLE = ["Aditya", "Putra", "Kirana", "Maharani", "Pratama", "Ayu", "Nugraha", "Permata", "Surya",
          "Lestari", "Ramadhan", "Anindya", "Prasetyo", "Dwi", "Cahya", "Bintang"]
FAMILY = ["Wijaya", "Santoso", "Hidayat", "Kusuma", "Pratama", "Siregar", "Nasution", "Lubis", "Hakim",
          "Setiawan", "Gunawan", "Rahman", "Saputra", "Utomo", "Wibowo", "Halim", "Purnomo", "Susanto",
          "Maulana", "Firmansyah", "Harahap", "Simanjuntak", "Lestari", "Budiman", "Kurniawan", "Andriani",
          "Permana", "Suhendra", "Sembiring", "Tanjung", "Yulianto", "Zulkifli", "Anwar", "Basri",
          "Cahyono", "Darmawan", "Effendi", "Ginting", "Hartono"]
FATHER = ["Agus", "Budi", "Hendra", "Joko", "Rudi", "Andi", "Eko", "Bambang", "Dedi", "Slamet"]
MOTHER = ["Siti", "Dewi", "Rina", "Lilis", "Wati", "Yuni", "Ratna", "Endang", "Fitria", "Murni"]
STREETS = ["Jl. Mawar", "Jl. Melati", "Jl. Kenanga", "Jl. Anggrek", "Jl. Cempaka", "Jl. Dahlia",
           "Jl. Flamboyan", "Jl. Kamboja", "Jl. Teratai", "Jl. Sakura"]
AREAS = ["Jakarta Selatan", "Jakarta Timur", "Depok", "Bekasi", "Tangerang Selatan"]

NEW_EDUCATORS = [
    {"name": "Bu Ratna Sari", "email": "ratna@educentre.id", "subjects": ["English", "Bahasa Indonesia"],
     "qual": "S.Pd English Education, Universitas Negeri Jakarta", "phone": "+62 812-6666-0003"},
    {"name": "Pak Dimas Prakoso", "email": "dimas@educentre.id", "subjects": ["Science", "Mathematics"],
     "qual": "S.Si Physics, Institut Teknologi Bandung", "phone": "+62 812-6666-0004"},
]
NEW_CLASSES = [
    {"subject": "English Year 5", "level": "Year 5", "edu": 0, "room": "Room C", "color": "#EC4899",
     "fee": 600000, "days": [3, 5], "start": "15:30", "end": "17:00"},
    {"subject": "Science Year 3", "level": "Year 3", "edu": 1, "room": "Lab 1", "color": "#14B8A6",
     "fee": 650000, "days": [1, 4], "start": "15:30", "end": "17:00"},
]
PAY_METHODS = ["bank_transfer"] * 5 + ["cash"] * 3 + ["qris"] * 2 + ["ewallet"]


def _id():
    return str(uuid.uuid4())


def _iso(d, hour=8, minute=0):
    """ISO UTC string for a date at a local (WIB, UTC+7) hour."""
    dt = datetime(d.year, d.month, d.day, hour, minute, tzinfo=timezone(timedelta(hours=7)))
    return dt.astimezone(timezone.utc).isoformat()


def _add_months(d, n):
    m = d.month - 1 + n
    return date(d.year + m // 12, m % 12 + 1, 1)


def _letter(pct):
    for cutoff, g in [(90, "A"), (80, "A-"), (75, "B+"), (70, "B"), (65, "B-"), (60, "C+"), (50, "C"), (40, "D")]:
        if pct >= cutoff:
            return g
    return "F"


def _clip(x, lo, hi):
    return max(lo, min(hi, x))


def _phone(n):
    return f"+62 813-{n // 10000 % 10000:04d}-{n % 10000:04d}"


async def build(db, today, rng):
    """Bangun semua dokumen baru di memori (membaca data lama, tanpa menulis)."""
    first_month = _add_months(today.replace(day=1), -MONTHS_BACK)
    months = [_add_months(first_month, i) for i in range(MONTHS_BACK + 1)]  # 6 bulan penuh + bulan berjalan

    admin = await db.users.find_one({"role": "admin"}, {"_id": 0, "id": 1})
    if not admin:
        sys.exit("Admin tidak ditemukan; jalankan backend sekali dulu agar seed dasar terbentuk.")
    old_students = await db.students.find({}, {"_id": 0}).to_list(5000)
    old_classes = await db.classes.find({}, {"_id": 0}).to_list(500)
    old_educators = await db.educators.find({}, {"_id": 0}).to_list(500)
    old_enrolls = await db.enrollments.find({}, {"_id": 0}).to_list(5000)
    old_invoices = await db.invoices.find({}, {"_id": 0, "student_id": 1, "billing_month": 1}).to_list(50000)
    old_att = await db.attendance.find({}, {"_id": 0, "class_id": 1, "session_date": 1, "student_id": 1}).to_list(100000)
    n_students0 = await db.students.count_documents({})
    n_parents0 = await db.parents.count_documents({})
    n_edu0 = await db.educators.count_documents({})
    n_inv0 = await db.invoices.count_documents({})
    old_emails = {u["email"] for u in await db.users.find({}, {"_id": 0, "email": 1}).to_list(50000)}
    if len(old_classes) != 4 or n_students0 > 25 or n_parents0 > 20:
        sys.exit(f"Dasar tidak sesuai harapan (kelas={len(old_classes)}, siswa={n_students0}, "
                 f"orang tua={n_parents0}); skrip dirancang untuk seed dasar 4 kelas + sedikit data.")
    old_y5 = sum(1 for s in old_students if s.get("school_year") == "Year 5")
    old_y3 = sum(1 for s in old_students if s.get("school_year") == "Year 3")
    if old_y5 + old_y3 != n_students0:
        sys.exit("Ada siswa lama dengan jenjang selain Year 3 / Year 5; sesuaikan skrip.")
    new_y5, new_y3 = 25 - old_y5, 25 - old_y3        # target 25 siswa per jenjang = 50 siswa
    n_pairs = 9                                      # keluarga dengan 2 anak (1 Year 5 + 1 Year 3)
    n_fam = n_pairs + (new_y5 - n_pairs) + (new_y3 - n_pairs)
    if n_parents0 + n_fam != 40:
        sys.exit(f"Total orang tua akan {n_parents0 + n_fam}, bukan 40; sesuaikan skrip.")

    new = {k: [] for k in ["users", "educators", "parents", "students", "classes", "enrollments",
                           "invoices", "payments", "attendance", "assessments", "grades",
                           "materials", "announcements"]}
    h_edu, h_par, h_stu = hash_password("educator123"), hash_password("parent123"), hash_password("student123")

    # ── Pendidik baru ──
    edu_docs = list(old_educators)
    for i, spec in enumerate(NEW_EDUCATORS):
        uid, eid = _id(), _id()
        new["users"].append({"id": uid, "email": spec["email"], "password_hash": h_edu, "full_name": spec["name"],
                             "role": "educator", "phone": spec["phone"], "is_active": True,
                             "created_at": _iso(first_month - timedelta(days=20))})
        e = {"id": eid, "user_id": uid, "staff_code": f"EDU-{today.year}-{n_edu0 + i + 1:04d}",
             "full_name": spec["name"], "email": spec["email"], "phone": spec["phone"],
             "subjects": spec["subjects"], "employment_type": "full_time", "qualifications": spec["qual"],
             "status": "active", "hire_date": _iso(first_month - timedelta(days=20)),
             "created_at": _iso(first_month - timedelta(days=20))}
        new["educators"].append(e)
        edu_docs.append(e)
    edu_user = {e["id"]: e["user_id"] for e in edu_docs}
    edu_name = {e["id"]: e["full_name"] for e in edu_docs}

    # ── Kelas baru ──
    classes = list(old_classes)
    for spec in NEW_CLASSES:
        c = {"id": _id(), "subject_name": spec["subject"], "level": spec["level"],
             "educator_id": new["educators"][spec["edu"]]["id"], "room": spec["room"],
             "description": f"{spec['subject']} weekly session", "color_hex": spec["color"], "capacity": 20,
             "fee_amount": spec["fee"], "schedule_days": spec["days"], "time_start": spec["start"],
             "time_end": spec["end"], "is_active": True, "created_at": _iso(first_month - timedelta(days=15))}
        new["classes"].append(c)
        classes.append(c)
    cls = {c["id"]: c for c in classes}
    by_level = {}
    for c in classes:
        by_level.setdefault(c["level"], []).append(c)

    # ── Siswa & orang tua baru: 48 siswa (24 Year 5, 24 Year 3), 39 orang tua (9 punya 2 anak) ──
    plan = [("Year 5", "Year 3")] * n_pairs + [("Year 5",)] * (new_y5 - n_pairs) + [("Year 3",)] * (new_y3 - n_pairs)
    rng.shuffle(plan)
    families = rng.sample(FAMILY, len(plan))
    stu_counter = 0
    joiners = set(rng.sample(range(new_y5 + new_y3), 6))  # 6 siswa bergabung bertahap Juni-Agustus
    kid_idx = 0
    all_students = list(old_students)
    for fi, levels in enumerate(plan):
        fam = families[fi]
        father = rng.random() < 0.5
        pname = f"{'Bapak' if father else 'Ibu'} {rng.choice(FATHER if father else MOTHER)} {fam}"
        puid, pid = _id(), _id()
        pn = n_parents0 + fi + 1
        pemail = f"ortu{fi + 1:02d}@educentre.id"
        created = _iso(first_month - timedelta(days=rng.randint(3, 25)))
        new["users"].append({"id": puid, "email": pemail, "password_hash": h_par, "full_name": pname,
                             "role": "parent", "phone": _phone(900000 + pn), "is_active": True, "created_at": created})
        kids = []
        for lv in levels:
            stu_counter += 1
            male = rng.random() < 0.5
            sname = f"{rng.choice(MALE if male else FEMALE)} {rng.choice(MIDDLE)} {fam}"
            if kid_idx in joiners:
                join = first_month + timedelta(days=rng.randint(31, 120))
                join = join.replace(day=rng.randint(1, 5))
            else:
                join = first_month - timedelta(days=rng.randint(1, 10))
            kid_idx += 1
            suid, sid = _id(), _id()
            semail = f"siswa{stu_counter:02d}@educentre.id"
            year = 2014 + rng.randint(0, 1) if lv == "Year 5" else 2016 + rng.randint(0, 1)
            new["users"].append({"id": suid, "email": semail, "password_hash": h_stu, "full_name": sname,
                                 "role": "student", "phone": _phone(100000 + stu_counter), "is_active": True,
                                 "created_at": _iso(join)})
            st = {"id": sid, "user_id": suid, "student_code": f"SC-{today.year}-{n_students0 + stu_counter:04d}",
                  "full_name": sname, "email": semail, "phone": _phone(100000 + stu_counter),
                  "dob": f"{year}-{rng.randint(1, 12):02d}-{rng.randint(1, 28):02d}",
                  "gender": "male" if male else "female", "school_name": rng.choice(["SD Pelita Bangsa", "SD Harapan Nusantara", "SD Cendekia"]),
                  "school_year": lv, "address": f"{rng.choice(STREETS)} No. {rng.randint(1, 80)}, {rng.choice(AREAS)}",
                  "parent_id": puid, "medical_notes": None, "status": "active",
                  "enrolled_at": _iso(join), "created_at": _iso(join)}
            kids.append(st)
            new["students"].append(st)
            all_students.append(st)
        new["parents"].append({"id": pid, "user_id": puid, "full_name": pname, "email": pemail,
                               "phone": _phone(900000 + pn), "occupation": rng.choice(
                                   ["Karyawan Swasta", "Wiraswasta", "Guru", "Dokter", "PNS", "Pedagang", "Perawat", "Akuntan"]),
                               "children_ids": [k["id"] for k in kids], "created_at": created})

    # ── Pendaftaran: tiap siswa baru 2 kelas sesuai jenjang, menjaga kapasitas ≤ 20 ──
    load = {c["id"]: 0 for c in classes}
    enrolls = []  # (student_id, class_id, start_date)
    for e in old_enrolls:
        load[e["class_id"]] += 1
        enrolls.append((e["student_id"], e["class_id"], first_month))  # siswa lama dianggap aktif sejak awal
    enrolled_old = {e["student_id"] for e in old_enrolls}
    for st in old_students:                      # siswa lama tanpa kelas (mis. ditambah lewat aplikasi)
        if st["id"] in enrolled_old:
            continue
        pool = sorted(by_level[st["school_year"]], key=lambda c: (load[c["id"]], rng.random()))[:2]
        for c in pool:
            load[c["id"]] += 1
            enrolls.append((st["id"], c["id"], first_month))
            new["enrollments"].append({"id": _id(), "student_id": st["id"], "class_id": c["id"],
                                       "status": "active", "enrolled_at": st.get("enrolled_at") or _iso(first_month)})
    for st in new["students"]:
        pool = sorted(by_level[st["school_year"]], key=lambda c: (load[c["id"]], rng.random()))[:2]
        join = datetime.fromisoformat(st["enrolled_at"]).astimezone(timezone(timedelta(hours=7))).date()
        for c in pool:
            load[c["id"]] += 1
            enrolls.append((st["id"], c["id"], max(join, first_month)))
            new["enrollments"].append({"id": _id(), "student_id": st["id"], "class_id": c["id"],
                                       "status": "active", "enrolled_at": st["enrolled_at"]})
    assert max(load.values()) <= 20, f"kapasitas terlampaui: {load}"
    stu_classes = {}
    for sid, cid, start in enrolls:
        stu_classes.setdefault(sid, []).append((cid, start))

    # kemampuan siswa & kehadiran dasar
    ability = {s["id"]: _clip(rng.gauss(72, 10), 45, 94) for s in all_students}
    subj_off = {(s["id"], c["id"]): rng.gauss(0, 4) for s in all_students for c in classes}
    presence = {s["id"]: _clip(rng.gauss(0.92, 0.04), 0.75, 0.99) for s in all_students}
    parent_kids = {}
    for s in all_students:
        parent_kids.setdefault(s["parent_id"], []).append(s["id"])

    # ── Tagihan & pembayaran ──
    old_inv_keys = {(i["student_id"], i["billing_month"]) for i in old_invoices}
    inv_no = n_inv0
    for m in months:
        ym = m.strftime("%Y-%m")
        due = m.replace(day=10)
        for s in all_students:
            if (s["id"], ym) in old_inv_keys:
                continue
            items = []
            for cid, start in stu_classes.get(s["id"], []):
                if start <= _add_months(m, 1) - timedelta(days=1):
                    items.append({"description": f"Monthly tuition — {cls[cid]['subject_name']}", "amount": cls[cid]["fee_amount"]})
            if not items:
                continue
            subtotal = sum(i["amount"] for i in items)
            sibling = len(parent_kids.get(s["parent_id"], [])) > 1
            discount = int(round(subtotal * 0.10 / 1000) * 1000) if sibling else 0
            total = subtotal - discount
            inv_no += 1
            inv = {"id": _id(), "invoice_number": f"INV-{today.year}-{inv_no:05d}", "student_id": s["id"],
                   "billing_month": ym, "items": items, "subtotal": subtotal, "discount_amount": discount,
                   "tax_amount": 0, "total_amount": total, "amount_paid": 0, "balance_due": total,
                   "due_date": due.isoformat(), "status": "unpaid",
                   "notes": "Diskon saudara kandung 10%" if sibling else None, "created_at": _iso(m, 8)}
            # skenario pembayaran menurut bulan
            r = rng.random()
            if m == months[-1]:                      # bulan berjalan
                scen = "full" if r < 0.15 else "none"
            elif m == months[-2]:                    # bulan lalu
                scen = "full" if r < 0.65 else ("partial" if r < 0.80 else "none")
            elif m == months[-3]:
                scen = "full" if r < 0.90 else ("partial" if r < 0.96 else "none")
            else:
                scen = "full" if r < 0.88 else ("instalment" if r < 0.98 else "late")
            pays = []
            method = rng.choice(PAY_METHODS)

            def mkpay(amount, when):
                ref = None if method == "cash" else f"{method[:3].upper()}-{when.strftime('%Y%m%d')}-{rng.randint(1000, 9999)}"
                return {"id": _id(), "invoice_id": inv["id"], "amount": int(amount), "method": method,
                        "reference_number": ref, "paid_at": _iso(when, rng.randint(9, 20), rng.randint(0, 59)),
                        "recorded_by": admin["id"], "notes": None}

            if scen == "full":
                lo, hi = (-6, 4) if m < months[-1] else (-3, 0)
                when = min(due + timedelta(days=rng.randint(lo, hi)), today)
                when = max(when, m)
                pays.append(mkpay(total, when))
            elif scen == "late":
                pays.append(mkpay(total, min(due + timedelta(days=rng.randint(8, 25)), today)))
            elif scen == "instalment":
                first = int(round(total * rng.choice([0.4, 0.5, 0.6]) / 1000) * 1000)
                w1 = max(min(due + timedelta(days=rng.randint(-4, 2)), today), m)
                pays.append(mkpay(first, w1))
                pays.append(mkpay(total - first, min(w1 + timedelta(days=rng.randint(10, 24)), today)))
            elif scen == "partial":
                first = int(round(total * rng.choice([0.3, 0.5]) / 1000) * 1000)
                pays.append(mkpay(first, max(min(due + timedelta(days=rng.randint(-3, 3)), today), m)))
            paid = sum(p["amount"] for p in pays)
            inv["amount_paid"] = paid
            inv["balance_due"] = max(0, total - paid)
            if inv["balance_due"] == 0:
                inv["status"] = "paid"
            elif due < today:
                inv["status"] = "overdue"      # sama dengan perilaku GET /invoices
            else:
                inv["status"] = "partial" if paid else "unpaid"
            if pays:
                inv["payment_method"] = method
            new["invoices"].append(inv)
            new["payments"].extend(pays)

    # ── Presensi: semua sesi terjadwal dari awal periode sampai kemarin ──
    have_att = {(a["class_id"], a["session_date"], a["student_id"]) for a in old_att}
    cls_students = {}
    for sid, cid, start in enrolls:
        cls_students.setdefault(cid, []).append((sid, start))
    sessions = {}  # class_id -> [date]
    for c in classes:
        d = first_month
        out = []
        while d < today:
            if d.isoweekday() in c["schedule_days"] and d.isoformat() not in HOLIDAYS:
                out.append(d)
            d += timedelta(days=1)
        sessions[c["id"]] = out
        marker = edu_user[c["educator_id"]]
        for d in out:
            for sid, start in cls_students.get(c["id"], []):
                if d < start or (c["id"], d.isoformat(), sid) in have_att:
                    continue
                if rng.random() < presence[sid]:
                    status = "late" if rng.random() < 0.06 else "present"
                else:
                    status = "excused" if rng.random() < 0.45 else "absent"
                new["attendance"].append({"id": _id(), "class_id": c["id"], "session_date": d.isoformat(),
                                          "student_id": sid, "status": status, "note": None,
                                          "marked_by": marker, "marked_at": _iso(d, 20, rng.randint(0, 40))})

    # ── Asesmen & nilai: kuis (~tgl 15) dan ujian (~tgl 26) tiap bulan penuh ──
    unpublished_cls = set(rng.sample([c["id"] for c in classes], 2))
    for c in classes:
        sched = c["schedule_days"]
        for m in months[:-1]:
            ym = m.strftime("%Y-%m")
            for kind, anchor, weight, label in (("quiz", 14, 20, "Kuis"), ("test", 25, 30, "Ujian")):
                d = m.replace(day=anchor)
                while d.isoweekday() not in sched:
                    d += timedelta(days=1)
                if d >= today:
                    continue
                last_month_test = (m == months[-2] and kind == "test" and c["id"] in unpublished_cls)
                a = {"id": _id(), "class_id": c["id"], "name": f"{label} {MONTH_ID[m.month]} — {c['subject_name']}",
                     "type": kind, "assessment_date": d.isoformat(), "max_score": 100, "pass_score": 50,
                     "weightage": weight, "is_published": not last_month_test,
                     "published_at": None if last_month_test else _iso(d + timedelta(days=2), 16),
                     "created_by": edu_user[c["educator_id"]], "created_at": _iso(d - timedelta(days=3), 10)}
                new["assessments"].append(a)
                trend = (months.index(m)) * 1.2
                for sid, start in cls_students.get(c["id"], []):
                    if d < start:
                        continue
                    base = {"id": _id(), "assessment_id": a["id"], "student_id": sid,
                            "entered_by": edu_user[c["educator_id"]], "entered_at": _iso(d + timedelta(days=1), 15),
                            "max_score": 100, "remark": None}
                    if rng.random() < 0.03:
                        base.update({"score": None, "is_absent": True, "percentage": None,
                                     "letter_grade": None, "is_passed": None})
                    else:
                        sc = int(round(_clip(rng.gauss(ability[sid] + subj_off[(sid, c["id"])] + trend - (3 if kind == "test" else 0), 7), 20, 100)))
                        base.update({"score": sc, "is_absent": False, "percentage": float(sc),
                                     "letter_grade": _letter(sc), "is_passed": sc >= 50,
                                     "remark": "Pertahankan, sangat baik!" if sc >= 90 else ("Perlu latihan tambahan." if sc < 55 else None)})
                    new["grades"].append(base)

    # ── Materi & pengumuman ──
    topics = {"Mathematics": ["Pecahan dan Desimal", "Bangun Datar"], "English": ["Grammar: Tenses", "Reading Comprehension"],
              "Science": ["Sistem Tata Surya", "Makhluk Hidup"]}
    for i, c in enumerate(classes):
        key = next(k for k in topics if c["subject_name"].startswith(k))
        for j, t in enumerate(topics[key]):
            d = first_month + timedelta(days=30 * (j + 1) + i)
            new["materials"].append({"id": _id(), "class_id": c["id"], "title": f"{c['subject_name']} — {t}",
                                     "type": "link", "external_url": "https://example.com/materi", "file_url": None,
                                     "description": f"Catatan dan latihan: {t}.", "uploaded_by": edu_user[c["educator_id"]],
                                     "uploader_name": edu_name[c["educator_id"]], "created_at": _iso(d, 14)})
    ann = [("Selamat datang semester baru", "Kelas dimulai sesuai jadwal. Silakan cek jadwal di aplikasi.", "all", 2),
           ("Libur Idul Adha", "Tidak ada kelas pada 27 Mei 2026. Kelas pengganti akan diinformasikan.", "all", 25),
           ("Pengingat pembayaran SPP", "Mohon melunasi SPP paling lambat tanggal 10 setiap bulan.", "parents", 40),
           ("Libur Hari Kemerdekaan", "Tidak ada kelas pada 17 Agustus 2026. Dirgahayu RI!", "all", 105),
           ("Jadwal ujian bulanan", "Ujian bulanan dilaksanakan akhir bulan. Siswa mohon mempersiapkan diri.", "students", 140),
           ("Rapat guru bulanan", "Rapat evaluasi pendidik hari Jumat pukul 16.00.", "educators", 160)]
    for title, body, aud, off in ann:
        new["announcements"].append({"id": _id(), "title": title, "body": body, "audience": aud, "class_id": None,
                                     "created_by": admin["id"], "created_by_name": "EduCentre Admin",
                                     "created_at": _iso(first_month + timedelta(days=off), 9)})

    check(new, all_students, cls_students, old_emails)
    return new


def check(new, all_students, cls_students, old_emails):
    """Konsistensi internal sebelum menulis apa pun."""
    paid = {}
    for p in new["payments"]:
        paid[p["invoice_id"]] = paid.get(p["invoice_id"], 0) + p["amount"]
    for i in new["invoices"]:
        assert i["amount_paid"] == paid.get(i["id"], 0), i["invoice_number"]
        assert i["balance_due"] == i["total_amount"] - i["amount_paid"], i["invoice_number"]
        assert i["amount_paid"] <= i["total_amount"], i["invoice_number"]
    assert len({i["invoice_number"] for i in new["invoices"]}) == len(new["invoices"])
    assert len({u["email"] for u in new["users"]}) == len(new["users"])
    assert not ({u["email"] for u in new["users"]} & old_emails), "email bentrok dengan akun lama"
    enrolled = {(sid, cid) for cid, rows in cls_students.items() for sid, _ in rows}
    aclass = {a["id"]: a["class_id"] for a in new["assessments"]}
    for g in new["grades"]:
        assert (g["student_id"], aclass[g["assessment_id"]]) in enrolled
    assert len(all_students) == 50, len(all_students)


async def dump_backup(db, folder):
    os.makedirs(folder, exist_ok=True)
    for name in await db.list_collection_names():
        docs = await db[name].find({}).to_list(None)
        with open(os.path.join(folder, f"{name}.json"), "w", encoding="utf-8") as f:
            json.dump(docs, f, default=str, ensure_ascii=False)
        print(f"  cadangan {name}: {len(docs)}")


async def insert_all(db, new):
    manifest = {}
    for coll, docs in new.items():
        if not docs:
            continue
        for i in range(0, len(docs), 1000):
            await db[coll].insert_many([dict(d) for d in docs[i:i + 1000]], ordered=False)
        manifest[coll] = [d["id"] for d in docs]
        print(f"  disisipkan {coll}: {len(docs)}")
    await db.seed_manifest.insert_one({"id": MANIFEST_ID, "created_at": datetime.now(timezone.utc).isoformat(),
                                       "inserted": manifest})
    # tambahkan anak ke daftar anak orang tua lama tidak diperlukan: orang tua lama tetap dengan anak lamanya


async def rollback(db):
    m = await db.seed_manifest.find_one({"id": MANIFEST_ID})
    if not m:
        sys.exit("Tidak ada manifest; tidak ada yang bisa ditarik kembali.")
    for coll, ids in m["inserted"].items():
        r = await db[coll].delete_many({"id": {"$in": ids}})
        print(f"  dihapus {coll}: {r.deleted_count}")
    await db.seed_manifest.delete_one({"id": MANIFEST_ID})


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--yes", action="store_true", help="konfirmasi menulis ke database target")
    ap.add_argument("--rollback", action="store_true")
    ap.add_argument("--backup-dir", help="folder cadangan JSON (wajib saat menulis)")
    ap.add_argument("--today", help="override tanggal hari ini (YYYY-MM-DD), untuk uji")
    args = ap.parse_args()

    db = get_db()
    host = os.environ["MONGO_URL"].split("@")[-1].split("/")[0].split("?")[0]
    print(f"Target: database '{os.environ['DB_NAME']}' di {host}")
    today = date.fromisoformat(args.today) if args.today else date.today()

    try:
        if args.rollback:
            if not args.yes:
                sys.exit("Tambahkan --yes untuk rollback.")
            await rollback(db)
            return
        if await db.seed_manifest.find_one({"id": MANIFEST_ID}):
            sys.exit("Data sampel 6 bulan sudah pernah diisi (manifest ada). Gunakan --rollback dulu.")
        new = await build(db, today, random.Random(2026))
        print("Akan dibuat:")
        for k, v in new.items():
            print(f"  {k}: {len(v)}")
        if args.dry_run or not args.yes:
            print("(dry-run: tidak ada yang ditulis)")
            return
        if not args.backup_dir:
            sys.exit("--backup-dir wajib saat menulis.")
        print("Mencadangkan data saat ini...")
        await dump_backup(db, args.backup_dir)
        print("Menulis...")
        await insert_all(db, new)
        print("Selesai.")
    finally:
        close_client()


if __name__ == "__main__":
    asyncio.run(main())
