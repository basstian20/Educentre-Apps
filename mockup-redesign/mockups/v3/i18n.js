/* Kamus ID/EN untuk label inti (navigasi, judul, tombol utama, status, peran). Indonesia adalah bahasa utama. */
(function(){
var L={
 id:{appName:'EduCentre',dashboard:'Dasbor',myDashboard:'Dasbor saya',reports:'Laporan',students:'Siswa',educators:'Pendidik',parents:'Orang tua',classes:'Kelas',myClasses:'Kelas saya',mySchedule:'Jadwal saya',enrollment:'Pendaftaran',attendance:'Absensi',markAttendance:'Isi absensi',myAttendance:'Kehadiran',grades:'Nilai',enterGrades:'Input nilai',results:'Hasil',myResults:'Hasil saya',materials:'Materi',invoices:'Tagihan',myFees:'Biaya saya',fees:'Biaya',announcements:'Pengumuman',settings:'Pengaturan',children:'Anak saya',
  overview:'Ringkasan',people:'Orang',academics:'Akademik',finance:'Keuangan',system:'Sistem',
  role_admin:'Admin',role_educator:'Educator',role_student:'Siswa',role_parent:'Orang tua',
  add:'Tambah',save:'Simpan',cancel:'Batal',edit:'Ubah',del:'Hapus',search:'Cari…',next:'Lanjut',back:'Kembali',confirm:'Konfirmasi',print:'Cetak',export:'Ekspor CSV',import:'Impor CSV',close:'Tutup',
  logout:'Keluar',login:'Masuk',demo:'Coba akun demo',welcome:'Selamat datang',noData:'Belum ada data',noMatch:'Tidak ada yang cocok',
  paid:'Lunas',unpaid:'Belum bayar',overdue:'Terlambat',partial:'Sebagian',
  present:'Hadir',late:'Telat',absent:'Absen',excused:'Izin',
  published:'Terbit',draft:'Draf',active:'Aktif',inactive:'Nonaktif',
  newStudent:'Tambah siswa',newInvoice:'Buat tagihan',recordPayment:'Catat pembayaran',publish:'Terbitkan',saveAll:'Simpan semua',
  notifications:'Notifikasi',darkMode:'Mode gelap',language:'Bahasa',today:'Hari ini',nextClass:'Kelas berikutnya',credit:'Dikembangkan oleh NobleDev'},
 en:{appName:'EduCentre',dashboard:'Dashboard',myDashboard:'My dashboard',reports:'Reports',students:'Students',educators:'Educators',parents:'Parents',classes:'Classes',myClasses:'My classes',mySchedule:'My schedule',enrollment:'Enrollment',attendance:'Attendance',markAttendance:'Mark attendance',myAttendance:'Attendance',grades:'Grades',enterGrades:'Enter grades',results:'Results',myResults:'My results',materials:'Materials',invoices:'Invoices',myFees:'My fees',fees:'Fees',announcements:'Announcements',settings:'Settings',children:'My children',
  overview:'Overview',people:'People',academics:'Academics',finance:'Finance',system:'System',
  role_admin:'Admin',role_educator:'Educator',role_student:'Student',role_parent:'Parent',
  add:'Add',save:'Save',cancel:'Cancel',edit:'Edit',del:'Delete',search:'Search…',next:'Next',back:'Back',confirm:'Confirm',print:'Print',export:'Export CSV',import:'Import CSV',close:'Close',
  logout:'Log out',login:'Sign in',demo:'Try a demo account',welcome:'Welcome',noData:'No data yet',noMatch:'No matches',
  paid:'Paid',unpaid:'Unpaid',overdue:'Overdue',partial:'Partial',
  present:'Present',late:'Late',absent:'Absent',excused:'Excused',
  published:'Published',draft:'Draft',active:'Active',inactive:'Inactive',
  newStudent:'Add student',newInvoice:'New invoice',recordPayment:'Record payment',publish:'Publish',saveAll:'Save all',
  notifications:'Notifications',darkMode:'Dark mode',language:'Language',today:'Today',nextClass:'Next class',credit:'Developed by NobleDev'}
};
window.EDUI18N={t:function(lang,k){return (L[lang]&&L[lang][k])||L.id[k]||k}};
})();
