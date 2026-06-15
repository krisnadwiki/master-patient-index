# Registrasi Pasien Satu Sehat (Web Version)

Aplikasi berbasis web untuk pencarian, pendaftaran, dan pembaruan data pasien pada platform SATUSEHAT Kementerian Kesehatan RI. Aplikasi ini dibangun menggunakan PHP Native (tanpa framework), HTML5, Bootstrap 5, dan JavaScript murni.

![alt text](assets/img/register-umum.png)

## Fitur Utama

1. **Pencarian Pasien (Cari Pasien by NIK)**
   Memungkinkan pengguna mencari data pasien yang telah terdaftar di SATUSEHAT hanya dengan memasukkan 16 digit NIK.

2. **Registrasi Pasien Umum (Alur Otomatis Cari → Daftar)**
   Pendaftaran pasien umum kini mengikuti alur SATUSEHAT terbaru:

   * Sistem akan melakukan pencarian pasien berdasarkan NIK terlebih dahulu.
   * Jika pasien sudah terdaftar, sistem tidak akan mengirimkan permintaan pembuatan pasien (POST), melainkan langsung menampilkan Nomor IHS yang sudah ada beserta notifikasi bahwa pasien telah terdaftar.
   * Jika pasien belum ditemukan, sistem akan melanjutkan proses pembuatan pasien menggunakan payload minimal sesuai spesifikasi SATUSEHAT.

3. **Pendaftaran Pasien Bayi Baru Lahir**
   Formulir khusus untuk mendaftarkan bayi baru lahir dengan menggunakan referensi NIK Ibu Kandung, urutan kelahiran (jika kembar), serta data wali sesuai standar FHIR SATUSEHAT.

4. **Update Data Pasien (PATCH)**
   Mendukung pembaruan data pasien menggunakan metode HTTP `PATCH` dengan format `JSON Patch`.

   * Nomor IHS digunakan sebagai identitas target yang wajib diisi.
   * Pengguna dapat memperbarui data tertentu tanpa harus mengirim ulang seluruh data pasien.
   * Hanya field yang diisi pada formulir yang akan dikirim ke SATUSEHAT menggunakan operasi `"replace"`.

5. **Master Data Wilayah (Cascading Dropdowns)**
   Terintegrasi dengan Master Data Kemkes yang diotomatisasi secara asinkron dari backend. Mendukung pencarian berbasis **Tom Select**, sehingga data Provinsi, Kota/Kabupaten, Kecamatan, dan Kelurahan dapat dipilih dengan mudah beserta kode referensinya. Backend juga menangani proses pagination secara otomatis untuk mendapatkan seluruh data wilayah.

6. **Kredensial Dinamis & Auto-Token**
   Mendukung perpindahan antara lingkungan Staging dan Production. Jika file `.env` tersedia, Access Token akan dihasilkan dan dikelola secara otomatis saat halaman pertama kali dimuat.

7. **Validasi & Integritas Payload FHIR**
   Mendukung validasi format NIK, RT/RW, nomor telepon, serta memastikan payload yang dikirim mengikuti standar FHIR SATUSEHAT yang berlaku.

8. **Human-Readable Response**
   Respons dari server SATUSEHAT ditampilkan dalam bentuk antarmuka yang mudah dipahami. Informasi keberhasilan maupun kegagalan dipresentasikan dalam format yang lebih ramah pengguna, termasuk detail diagnostik apabila terjadi kesalahan.

## Persyaratan Sistem

* PHP 8.1 atau lebih baru
* Ekstensi PHP:

  * `curl`
  * `session`

## Cara Menjalankan (Local Development)

1. Pastikan PHP telah terpasang pada sistem.

2. Salin atau clone folder aplikasi ke komputer Anda.

3. Salin file `.env.example` menjadi `.env`, kemudian isi kredensial SATUSEHAT yang dimiliki.

4. Buka terminal dan masuk ke direktori aplikasi:

   ```bash
   cd path/to/satusehat
   ```

5. Jalankan web server bawaan PHP:

   ```bash
   php -S localhost:8000
   ```

6. Buka browser dan akses:

   ```text
   http://localhost:8000
   ```

## Cara Penggunaan

1. Jika file `.env` telah dikonfigurasi, sistem akan melakukan proses autentikasi secara otomatis saat halaman dibuka dan memuat daftar provinsi.

2. Jika belum menggunakan `.env`, klik menu **Kredensial**, masukkan Client ID dan Client Secret, kemudian klik **Generate Token**.

3. Gunakan fitur melalui tab yang tersedia:

   ### Tab 1 – Cari Pasien

   * Masukkan 16 digit NIK.
   * Klik **Cari Pasien**.
   * Sistem akan menampilkan data pasien beserta Nomor IHS apabila ditemukan.

   ### Tab 2 – Registrasi Umum

   * Lengkapi data pasien.
   * Klik **POST Patient Umum**.
   * Sistem akan menjalankan alur otomatis:

     1. Mencari pasien berdasarkan NIK.
     2. Jika pasien sudah terdaftar, Nomor IHS akan langsung ditampilkan.
     3. Jika belum terdaftar, sistem akan melakukan pembuatan data pasien baru.

   ### Tab 3 – Registrasi Bayi

   * Isi data kelahiran bayi.
   * Klik **POST Patient Bayi** untuk mengirim data ke SATUSEHAT.

   ### Tab 4 – Update Pasien

   * Masukkan **Nomor IHS** pasien yang akan diperbarui.
   * Isi satu atau lebih data yang ingin diubah.
   * Klik **PATCH Data Pasien**.
   * Sistem hanya akan mengirim field yang diisi menggunakan mekanisme JSON Patch.

4. Seluruh aktivitas API akan ditampilkan pada **Panel Respons API** di sisi kanan halaman.

## Struktur Direktori

```text
satusehat/
├── api/                               # Endpoint backend yang dipanggil melalui AJAX
│   ├── clear_session.php
│   ├── generate_token.php             # Menghasilkan Access Token SATUSEHAT
│   ├── get_wilayah.php                # Proxy & Aggregator Master Data Wilayah Kemkes
│   ├── patch_pasien.php               # Endpoint PATCH data pasien
│   ├── post_pasien_bayi.php           # Membentuk payload pasien bayi
│   ├── post_pasien_umum.php           # Alur cari pasien → daftar pasien umum
│   └── search_pasien.php              # GET pasien berdasarkan NIK
│
├── assets/
│   ├── css/
│   │   └── style.css                  # Styling aplikasi
│   └── js/
│       └── main.js                    # AJAX, Tom Select, event handler, parsing respons
│
├── includes/
│   ├── config.php                     # Konfigurasi awal dan parser .env
│   ├── functions.php                  # Fungsi utilitas
│   ├── logger.php                     # Logging aplikasi
│   └── satusehat.php                  # Fungsi integrasi SATUSEHAT (GET, POST, PATCH)
│
├── logs/
│   └── app.log                        # Catatan aktivitas aplikasi
│
├── .env.example                       # Template konfigurasi SATUSEHAT
├── favicon.ico                        # Ikon aplikasi
├── index.php                          # Halaman utama aplikasi
└── README.md                          # Dokumentasi aplikasi
```

## Alur Registrasi Pasien Umum

```text
Input Data Pasien
        │
        ▼
Cari Pasien berdasarkan NIK
        │
 ┌──────┴──────┐
 │             │
 ▼             ▼
Ditemukan   Tidak ditemukan
 │             │
 ▼             ▼
Tampilkan   POST Create Patient
Nomor IHS        │
 │               ▼
 └────────► Tampilkan Nomor IHS Baru
```

## Alur Update Data Pasien

```text
Input Nomor IHS
        │
        ▼
Isi Field yang Ingin Diubah
        │
        ▼
Bentuk JSON Patch Secara Dinamis
        │
        ▼
PATCH Patient ke SATUSEHAT
        │
        ▼
Tampilkan Respons Berhasil/Gagal
```

## Referensi

Implementasi aplikasi ini disusun berdasarkan dokumentasi resmi SATUSEHAT Platform terkait Master Patient Index (MPI).

[SATUSEHAT Platform – Master Patient Index (MPI)](https://satusehat.kemkes.go.id/platform/docs/id/master-data/master-patient-index/preliminary/)

> Seluruh alur pencarian pasien, pembuatan pasien baru, serta pembaruan data pasien diupayakan mengikuti ketentuan yang berlaku pada dokumentasi resmi SATUSEHAT. Dokumentasi tersebut dapat berubah sewaktu-waktu sehingga perlu dilakukan penyesuaian apabila terdapat pembaruan spesifikasi dari Kementerian Kesehatan Republik Indonesia.