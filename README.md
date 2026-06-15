# Registrasi Pasien Satu Sehat (Web Version)

Aplikasi berbasis web untuk pendaftaran pasien (Umum dan Bayi Baru Lahir) serta pencarian data pasien ke platform Satu Sehat Kementerian Kesehatan RI. Aplikasi ini dibuat menggunakan PHP Native (tanpa framework), HTML5, Bootstrap 5, dan JavaScript murni.

## Fitur Utama

1. **Pencarian Pasien (Cari Pasien by NIK)**
   Memungkinkan pengguna untuk melacak data pasien yang sudah terdaftar di Satu Sehat hanya dengan memasukkan 16 digit NIK.
2. **Pendaftaran Pasien Umum**
   Formulir komprehensif untuk mendaftarkan pasien umum. Mendukung input data mulai dari demografi, kontak darurat, status pernikahan, hingga pengenal sekunder (Paspor & KK).
3. **Pendaftaran Pasien Bayi Baru Lahir**
   Formulir khusus untuk mendaftarkan bayi baru lahir dengan menggunakan referensi NIK Ibu Kandung, urutan kelahiran (jika kembar), dan data wali.
4. **Master Data Wilayah (*Cascading Dropdowns*)**
   Terintegrasi dengan Master Data Kemkes yang diotomatisasi secara asinkron dari backend. Memungkinkan pencarian (ketik cerdas) berbasis library **Tom Select**, sehingga data Provinsi, Kota/Kabupaten, Kecamatan, dan Kelurahan dapat ditarik dengan mudah beserta [Kode Kemendagri]-nya. Backend juga secara cerdas menangani *pagination loop* untuk menarik semua data wilayah sekaligus.
5. **Kredensial Dinamis & Auto-Token**
   Mendukung pergantian mulus antara Staging (Testing) dan Production. Jika Anda menggunakan file `.env`, *Access Token* otomatis digenerate dan dikelola (*Auto-Token*) saat memuat halaman pertama kali.
6. **Validasi & Integritas Payload FHIR**
   Mendukung pengecekan format NIK, format RT/RW, nomor kontak. Payload mematuhi ketat *administrativeCode* dan format `multipleBirthInteger` standar FHIR SATUSEHAT.
7. **Human-Readable Response**
   Hasil dari server SATUSEHAT dirender sebagai notifikasi bergaya kartu modern (*Card UI*) di panel sebelah kanan, yang mengekstrak alasan gagal (*Diagnostics* & *Details*) ke dalam bentuk tabel rapi.

## Persyaratan Sistem

- **PHP 8.1+**
- Ekstensi PHP: `curl`, `session`

## Cara Menjalankan (Local Development)

1. Pastikan PHP sudah terinstall.
2. Clone/Copy folder aplikasi ini ke komputer Anda.
3. *Copy* `satusehat/.env.example` menjadi `satusehat/.env` lalu isi dengan *Client ID* & *Secret* yang Anda miliki.
4. Buka terminal/cmd dan masuk ke dalam folder aplikasi:
   ```bash
   cd path/to/satusehat
   ```
5. Jalankan web server bawaan PHP:
   ```bash
   php -S localhost:8000
   ```
6. Buka browser dan akses URL: `http://localhost:8000`

## Cara Penggunaan

1. Jika Anda telah mengisi file `.env`, saat membuka halaman sistem akan otomatis mencoba melakukan otentikasi (**Auto-Generate Token**) dan memuat daftar *Provinsi* ke memori.
2. Jika belum, Anda bisa klik tombol **<i class="bi bi-gear-fill"></i> Kredensial** di Navbar untuk memasukkan Client ID dan Client Secret secara manual, kemudian klik tombol **<i class="bi bi-key-fill"></i> Generate Token**.
3. Anda kini bisa menggunakan ketiga fitur utama melalui Tab Menu:
   - **Tab 1 (Cari Pasien)**: Masukkan 16 digit NIK dan klik "Cari Pasien".
   - **Tab 2 (Registrasi Umum)**: Isi form, perhatikan dropdown wilayah yang bisa diketik, lalu klik **"POST Patient Umum"** di bagian bawah.
   - **Tab 3 (Registrasi Bayi)**: Isi form kelahiran dengan NIK Ibu, lalu klik **"POST Patient Bayi"**.
4. Seluruh interaksi akan memunculkan response yang mudah dipahami pada **Panel Respons API** di bagian kanan halaman.

## Struktur Direktori

```text
satusehat/
├── api/                        # Endpoint backend yang dipanggil via AJAX
│   ├── generate_token.php      # Menghasilkan Access Token
│   ├── get_wilayah.php         # Proxy & Aggregator Master Data Wilayah Kemkes
│   ├── post_pasien_bayi.php    # Membentuk Payload & POST pasien Bayi
│   ├── post_pasien_umum.php    # Membentuk Payload & POST pasien Umum
│   └── search_pasien.php       # GET pasien by NIK
├── assets/
│   ├── css/
│   │   └── style.css           # Styling kustom bernuansa Kemenkes (Putih-Biru)
│   └── js/
│       └── main.js             # Logika interaksi UI, AJAX Fetch, TomSelect, & Parsing Output
├── includes/
│   ├── config.php              # Pengaturan awal, parser .env, inisialisasi session
│   ├── functions.php           # Utilitas (Logger, Sanitizer, CSRF Validation)
│   └── satusehat.php           # Kumpulan fungsi cURL ke server API Satu Sehat
├── logs/
│   └── app.log                 # Catatan log aktivitas API secara server-side
├── .env.example                # Template konfigurasi Client ID & Secret
├── favicon.ico                 # Ikon situs web
├── index.php                   # Halaman Antarmuka Utama (UI)
└── README.md                   # Dokumentasi Aplikasi
```
