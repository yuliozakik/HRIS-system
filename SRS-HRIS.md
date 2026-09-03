# Software Requirements Specification (SRS)
# Sistem Informasi HRIS Modern

**Versi**: 0.1 (Draft)
**Tanggal**: 3 September 2026
**Status**: Draft

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen
Dokumen ini menjelaskan kebutuhan fungsional dan non-fungsional untuk pengembangan Sistem Informasi HRIS (Human Resource Information System) modern, yang digunakan untuk mengelola data karyawan, absensi, cuti, penggajian, dan pelaporan SDM secara terpusat.

### 1.2 Ruang Lingkup Produk
Sistem mencakup modul inti manajemen SDM: data karyawan, absensi, cuti/izin, dan penggajian, ditambah modul pelaporan. Modul rekrutmen dan penilaian kinerja masuk sebagai fase lanjutan (bukan prioritas rilis pertama). Sistem dibangun sebagai aplikasi web dengan arsitektur client-server berbasis REST API.

### 1.3 Definisi, Akronim, dan Singkatan

| Istilah | Keterangan |
|---|---|
| HRIS | Human Resource Information System |
| RBAC | Role-Based Access Control |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |
| API | Application Programming Interface |
| UC | Use Case |

### 1.4 Referensi
- Kebijakan SDM internal perusahaan (menyusul, jika ada)
- Peraturan ketenagakerjaan yang berlaku (UU Ketenagakerjaan, PP Pengupahan)
- UU Pelindungan Data Pribadi (UU PDP)

### 1.5 Gambaran Umum Dokumen
Dokumen ini terdiri dari deskripsi umum sistem (bab 2), kebutuhan fungsional per modul (bab 3), kebutuhan non-fungsional (bab 4), kebutuhan antarmuka eksternal (bab 5), dan daftar use case (bab 6).

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk
Sistem dibangun sebagai produk baru dengan stack:

- **Frontend**: Next.js (React)
- **Backend**: NestJS (Node.js, TypeScript)
- **Database**: PostgreSQL
- **Cache / Job queue**: Redis
- **File storage**: MinIO / S3-compatible (dokumen karyawan, slip gaji PDF)
- **Infrastruktur**: Docker

### 2.2 Fungsi Produk (Ringkasan Modul)
- Autentikasi & Manajemen Akses
- Manajemen Data Karyawan
- Absensi & Waktu Kerja
- Cuti & Izin
- Penggajian
- Pelaporan & Analitik
- Rekrutmen *(fase lanjutan)*
- Penilaian Kinerja *(fase lanjutan)*

### 2.3 Karakteristik Pengguna

| Kelas Pengguna | Deskripsi |
|---|---|
| Employee | Karyawan biasa — akses data diri, ajukan cuti, lihat slip gaji |
| Manager | Approval cuti/lembur tim, lihat laporan tim |
| HR Admin | Kelola data karyawan, payroll, konfigurasi kebijakan |
| Superadmin | Kelola akses sistem, konfigurasi global |

### 2.4 Batasan
- Harus mematuhi regulasi ketenagakerjaan yang berlaku
- Data pribadi karyawan harus terenkripsi sesuai UU PDP
- Sistem berjalan di infrastruktur cloud/on-premise perusahaan (Docker-based)

### 2.5 Asumsi dan Ketergantungan
- Pengguna memiliki akses internet yang stabil
- Integrasi ke sistem payroll bank / BPJS bersifat opsional di fase awal
- Struktur organisasi (departemen, jabatan) sudah terdefinisi sebelum data karyawan dimasukkan

---

## 3. Kebutuhan Fungsional

### 3.1 Modul Autentikasi & Manajemen Akses
- **FR-AUTH-01**: Sistem harus menyediakan login menggunakan email/username dan password
- **FR-AUTH-02**: Sistem harus mendukung refresh token untuk menjaga sesi login
- **FR-AUTH-03**: Sistem harus menerapkan RBAC berdasarkan kelas pengguna (Employee, Manager, HR Admin, Superadmin)
- **FR-AUTH-04**: Sistem harus mencatat log aktivitas login (audit trail)
- **FR-AUTH-05**: Sistem harus mendukung reset password melalui email

### 3.2 Modul Manajemen Data Karyawan
- **FR-EMP-01**: Sistem harus dapat menyimpan data pribadi karyawan (nama, NIK, alamat, kontak, dst.)
- **FR-EMP-02**: Sistem harus dapat mengelola struktur organisasi (departemen, jabatan, atasan langsung)
- **FR-EMP-03**: Sistem harus dapat mencatat riwayat jabatan/mutasi karyawan
- **FR-EMP-04**: Sistem harus dapat mengunggah dan menyimpan dokumen karyawan (KTP, kontrak kerja, ijazah)
- **FR-EMP-05**: HR Admin harus dapat menonaktifkan/mengarsipkan data karyawan yang resign

### 3.3 Modul Absensi & Waktu Kerja
- **FR-ATT-01**: Sistem harus mencatat jam masuk dan jam keluar karyawan
- **FR-ATT-02**: Sistem harus mendukung pengaturan shift kerja
- **FR-ATT-03**: Sistem harus dapat menghitung keterlambatan dan lembur secara otomatis
- **FR-ATT-04**: Manager harus dapat melihat rekap absensi tim

### 3.4 Modul Cuti & Izin
- **FR-LEV-01**: Karyawan harus dapat mengajukan cuti/izin melalui sistem
- **FR-LEV-02**: Sistem harus menghitung sisa saldo cuti secara otomatis
- **FR-LEV-03**: Manager harus dapat menyetujui atau menolak pengajuan cuti
- **FR-LEV-04**: Sistem harus mengirim notifikasi status pengajuan ke karyawan

### 3.5 Modul Penggajian
- **FR-PAY-01**: Sistem harus dapat menghitung gaji berdasarkan komponen (gaji pokok, tunjangan, potongan)
- **FR-PAY-02**: Sistem harus dapat menghasilkan slip gaji dalam format PDF
- **FR-PAY-03**: Sistem harus dapat memproses payroll secara batch untuk seluruh karyawan
- **FR-PAY-04**: Sistem harus mencatat riwayat penggajian per periode

### 3.6 Modul Pelaporan & Analitik
- **FR-REP-01**: Sistem harus dapat menghasilkan laporan absensi, cuti, dan payroll
- **FR-REP-02**: Sistem harus dapat mengekspor laporan ke format Excel/PDF
- **FR-REP-03**: Dashboard harus menampilkan ringkasan data SDM (jumlah karyawan, turnover, dll.)

### 3.7 Modul Rekrutmen *(Fase Lanjutan)*
- **FR-REC-01**: Sistem harus dapat mencatat lowongan pekerjaan
- **FR-REC-02**: Sistem harus dapat mengelola data pelamar dan status seleksi

### 3.8 Modul Penilaian Kinerja *(Fase Lanjutan)*
- **FR-PERF-01**: Sistem harus mendukung siklus penilaian kinerja periodik
- **FR-PERF-02**: Manager harus dapat memberikan skor dan feedback ke karyawan

---

## 4. Kebutuhan Non-Fungsional

| ID | Kategori | Deskripsi |
|---|---|---|
| NFR-01 | Performa | Waktu respons API rata-rata di bawah 2 detik untuk operasi umum |
| NFR-02 | Keamanan | Data sensitif dienkripsi saat disimpan (at rest) dan saat transit (in transit) |
| NFR-03 | Skalabilitas | Sistem dapat menangani penambahan jumlah karyawan tanpa perubahan arsitektur signifikan |
| NFR-04 | Ketersediaan | Target uptime 99% di luar jadwal maintenance |
| NFR-05 | Usability | Antarmuka dapat digunakan tanpa training khusus untuk fungsi dasar |
| NFR-06 | Maintainability | Kode mengikuti struktur modular (NestJS module pattern) agar mudah dikembangkan |
| NFR-07 | Kepatuhan | Sistem mematuhi UU PDP untuk pengelolaan data pribadi karyawan |

---

## 5. Kebutuhan Antarmuka Eksternal

### 5.1 Antarmuka Pengguna
Web application, responsive, dapat diakses melalui desktop dan mobile browser.

### 5.2 Antarmuka Perangkat Lunak
- REST API (NestJS) sebagai kontrak utama antara frontend dan backend
- Format data: JSON
- Autentikasi API: JWT Bearer Token

### 5.3 Antarmuka Komunikasi
- Email notification (approval cuti, notifikasi payroll)
- *(Opsional)* Integrasi WhatsApp/Slack untuk notifikasi

---

## 6. Use Case

### 6.1 Daftar Aktor
- Employee
- Manager
- HR Admin
- Superadmin

### 6.2 Daftar Use Case

| ID | Use Case | Aktor |
|---|---|---|
| UC-01 | Login ke sistem | Semua aktor |
| UC-02 | Mengajukan cuti | Employee |
| UC-03 | Menyetujui/menolak cuti | Manager |
| UC-04 | Mengelola data karyawan | HR Admin |
| UC-05 | Memproses payroll bulanan | HR Admin |
| UC-06 | Melihat slip gaji | Employee |
| UC-07 | Melihat laporan tim | Manager |
| UC-08 | Konfigurasi kebijakan cuti/payroll | HR Admin |
| UC-09 | Mengelola akses pengguna | Superadmin |

---

## 7. Lampiran

### 7.1 Glosarium
- **Payroll**: Proses perhitungan dan pembayaran gaji karyawan
- **RBAC**: Metode pengaturan akses berdasarkan peran pengguna

### 7.2 Catatan
Dokumen ini merupakan draft awal dan dapat berkembang seiring diskusi kebutuhan lebih lanjut, khususnya untuk modul Rekrutmen dan Penilaian Kinerja yang masih bersifat opsional/fase lanjutan.
