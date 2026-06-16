<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/functions.php';

$csrf_token = generate_csrf_token();

$staging_id = getenv('STAGING_CLIENT_ID') ?: '';
$staging_secret = getenv('STAGING_CLIENT_SECRET') ?: '';
$prod_id = getenv('PRODUCTION_CLIENT_ID') ?: '';
$prod_secret = getenv('PRODUCTION_CLIENT_SECRET') ?: '';

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registrasi Pasien SATUSEHAT</title>
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <!-- Formal Fonts: Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
    <!-- TomSelect for searchable dropdowns -->
    <link href="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/css/tom-select.bootstrap5.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <script>
        const envConfig = {
            Staging: { id: "<?= htmlspecialchars($staging_id) ?>", secret: "<?= htmlspecialchars($staging_secret) ?>" },
            Production: { id: "<?= htmlspecialchars($prod_id) ?>", secret: "<?= htmlspecialchars($prod_secret) ?>" }
        };
    </script>
</head>
<body class="bg-ss-light">

<!-- Sticky Header -->
<nav class="navbar navbar-expand-lg bg-white sticky-top border-bottom ss-header">
    <div class="container-fluid px-4 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
            <img src="favicon.png"
                alt="SATUSEHAT"
                class="me-2"
                style="width: 36px; height: 36px; object-fit: contain;">
            <h1 class="navbar-brand fw-bold mb-0 text-ss-primary fs-4">
                Registrasi Pasien SATUSEHAT
            </h1>
            <span id="env-badge" class="badge bg-danger ms-2" style="font-size: 0.8rem;">Production</span>
        </div>
        <div>
            <!-- <button class="btn btn-outline-ss-primary bg-white fw-medium btn-sm me-2 shadow-sm border" id="btn-generate">
                <i class="bi bi-key-fill me-1"></i>Generate Token
            </button> -->
            <button class="btn btn-outline-ss-primary fw-medium btn-sm me-2 shadow-sm" id="btn-generate">
                <i class="bi bi-key-fill me-1"></i>Generate Token
            </button>
            <button class="btn btn-light btn-sm fw-medium border shadow-sm" data-bs-toggle="modal" data-bs-target="#settingsModal">
                <i class="bi bi-gear-fill me-1"></i>Kredensial
            </button>
        </div>
    </div>
</nav>

<!-- Modal Kredensial -->
<!-- Modal Kredensial -->
<div class="modal fade" id="settingsModal" tabindex="-1" aria-labelledby="settingsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-0 border-0 shadow">

            <div class="modal-header bg-ss-primary text-white rounded-0">
                <h5 class="modal-title fw-semibold" id="settingsModalLabel">
                    Pengaturan Kredensial API
                </h5>

                <button type="button"
                        class="btn-close btn-close-white"
                        data-bs-dismiss="modal"
                        aria-label="Close">
                </button>
            </div>

            <div class="modal-body">

                <!-- Client ID -->
                <div class="mb-3">
                    <label for="client_id" class="form-label fw-medium">
                        Client ID <span class="text-danger">*</span>
                    </label>

                    <input type="text"
                           id="client_id"
                           class="form-control rounded-0"
                           autocomplete="off">
                </div>

                <!-- Client Secret -->
                <div class="mb-3">
                    <label for="client_secret" class="form-label fw-medium">
                        Client Secret <span class="text-danger">*</span>
                    </label>

                    <input type="password"
                           id="client_secret"
                           class="form-control rounded-0"
                           autocomplete="off">
                </div>

                <!-- Environment -->
                <div class="mb-0">
                    <label class="form-label fw-medium">
                        Environment
                    </label>

                    <div class="d-flex flex-column gap-2">
                        <div class="form-check">
                            <input class="form-check-input"
                                   type="radio"
                                   name="env_var"
                                   id="env_staging"
                                   value="Staging">

                            <label class="form-check-label" for="env_staging">
                                Staging (Testing)
                            </label>
                        </div>

                        <div class="form-check">
                            <input class="form-check-input"
                                   type="radio"
                                   name="env_var"
                                   id="env_prod"
                                   value="Production"
                                   checked>

                            <label class="form-check-label" for="env_prod">
                                Production (Live)
                            </label>
                        </div>
                    </div>
                </div>

            </div>

            <div class="modal-footer">
                <button type="button"
                        class="btn btn-outline-primary rounded-1 px-4"
                        data-bs-dismiss="modal">
                    Tutup
                </button>
            </div>

        </div>
    </div>
</div>

<div class="container-fluid px-4 py-4">

    <div class="row">
        <!-- Kolom Kiri: Form -->
        <div class="col-xl-7 col-lg-6 mb-4">
            
                    <ul class="nav nav-tabs ss-tabs nav-fill mb-4 border-0" id="myTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active fw-bold py-3" id="search-tab" data-bs-toggle="tab" data-bs-target="#search" type="button" role="tab"><i class="bi bi-search me-2"></i>Cari Pasien</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link fw-bold py-3" id="umum-tab" data-bs-toggle="tab" data-bs-target="#umum" type="button" role="tab"><i class="bi bi-person-lines-fill me-2"></i>Registrasi Umum</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link fw-bold py-3" id="bayi-tab" data-bs-toggle="tab" data-bs-target="#bayi" type="button" role="tab"><i class="bi bi-person-badge-fill me-2"></i>Registrasi Bayi</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link fw-bold py-3" id="patch-tab" data-bs-toggle="tab" data-bs-target="#patch" type="button" role="tab"><i class="bi bi-pencil-square me-2"></i>Update Data</button>
                        </li>
                    </ul>

            <div class="tab-content bg-white border border-top-0 p-4 shadow-sm" id="myTabContent" style="min-height: 500px;">
                
                <!-- Tab Cari Pasien -->
                <div class="tab-pane fade show active"
                    id="search"
                    role="tabpanel"
                    aria-labelledby="search-tab">

                    <form id="form-search">

                        <div class="mb-4 text-center">
                            <div class="btn-group w-100" role="group">
                                <input type="radio" class="btn-check" name="search_type" id="search_type_identitas" value="identitas" checked>
                                <label class="btn btn-outline-ss-primary px-2" for="search_type_identitas">Identitas Pasien</label>

                                <input type="radio" class="btn-check" name="search_type" id="search_type_ihs" value="ihs">
                                <label class="btn btn-outline-ss-primary px-2" for="search_type_ihs">Nomor IHS</label>

                                <input type="radio" class="btn-check" name="search_type" id="search_type_bayi" value="bayi">
                                <label class="btn btn-outline-ss-primary px-2" for="search_type_bayi">Bayi Baru Lahir</label>
                            </div>
                        </div>

                        <div id="search-fields-identitas" class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label for="s_nik" class="form-label fw-medium">NIK</label>
                                <input type="text" class="form-control" id="s_nik" pattern="\d{16}" maxlength="16" placeholder="16 Digit NIK" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                            </div>
                            <div class="col-md-6">
                                <label for="s_nama" class="form-label fw-medium">Nama Lengkap</label>
                                <input type="text" class="form-control" id="s_nama" placeholder="Contoh: John Doe">
                            </div>
                            <div class="col-md-6">
                                <label for="s_tgl" class="form-label fw-medium">Tanggal Lahir</label>
                                <input type="date" class="form-control" id="s_tgl" max="<?= date('Y-m-d') ?>">
                            </div>
                            <div class="col-md-6">
                                <label for="s_jk" class="form-label fw-medium">Jenis Kelamin</label>
                                <select class="form-select" id="s_jk">
                                    <option value="" selected>Pilih...</option>
                                    <option value="Laki-laki">Laki-laki</option>
                                    <option value="Perempuan">Perempuan</option>
                                </select>
                            </div>
                        </div>

                        <div id="search-fields-ihs" class="row g-3 mb-3 d-none">
                            <div class="col-12">
                                <label for="s_ihs" class="form-label fw-medium">Masukkan Nomor IHS</label>
                                <input type="text" class="form-control" id="s_ihs" placeholder="Contoh: P0123456789">
                            </div>
                        </div>

                        <div id="search-fields-bayi" class="row g-3 mb-3 d-none">
                            <div class="col-md-6">
                                <label for="s_nik_ibu" class="form-label fw-medium">NIK Ibu</label>
                                <input type="text" class="form-control" id="s_nik_ibu" pattern="\d{16}" maxlength="16" placeholder="Contoh: 1234567890123456" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                            </div>
                            <div class="col-md-6">
                                <label for="s_tgl_bayi" class="form-label fw-medium">Tanggal Lahir Bayi</label>
                                <input type="date" class="form-control" id="s_tgl_bayi" max="<?= date('Y-m-d') ?>">
                                <div class="form-text">Opsional jika hanya menggunakan NIK Ibu</div>
                            </div>
                        </div>

                        <div class="mt-4">
                            <button type="button" class="btn btn-ss-primary px-4 py-2 fw-medium w-100" id="btn-search-action">
                                <i class="bi bi-search me-2"></i>Cari Pasien
                            </button>
                        </div>

                        <div class="form-text mt-3 text-center">
                            Pastikan Anda telah melakukan Generate Token sebelum melakukan pencarian.
                        </div>

                    </form>
                </div>

                <!-- Tab Registrasi Umum -->
                <div class="tab-pane fade" id="umum" role="tabpanel" aria-labelledby="umum-tab">
                    <form id="form-umum">
                        
                        <div class="accordion mb-4" id="accordionUtamaUmum">
                            <div class="accordion-item border-0 bg-transparent">
                                <h2 class="accordion-header">
                                    <button class="accordion-button bg-light rounded-1 fw-bold text-ss-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseUtamaUmum" aria-expanded="true" aria-controls="collapseUtamaUmum">
                                        Identitas Utama
                                    </button>
                                </h2>
                                <div id="collapseUtamaUmum" class="accordion-collapse collapse show" data-bs-parent="#accordionUtamaUmum">
                                    <div class="accordion-body border mt-2 bg-white rounded-1">
                                        <div class="row g-3 mb-2">
                                            <div class="col-md-6">
                                                <label for="u_nik" class="form-label fw-medium">NIK <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control rounded-1" id="u_nik" required pattern="\d{16}" maxlength="16" title="NIK harus terdiri dari 16 digit angka" placeholder="Contoh: 1234567890123456" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                                                <div class="form-text">16 digit angka.</div>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="u_nama" class="form-label fw-medium">Nama Lengkap <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control rounded-1" id="u_nama" required placeholder="Contoh: John Doe">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="u_tgl" class="form-label fw-medium">Tanggal Lahir <span class="text-danger">*</span></label>
                                                <input type="date" class="form-control rounded-1" id="u_tgl" max="<?= date('Y-m-d') ?>" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="u_tempat" class="form-label fw-medium">Tempat Lahir (Kota)</label>
                                                <input type="text" class="form-control rounded-1" id="u_tempat" placeholder="Contoh: Jakarta">
                                            </div>
                                            <div class="col-md-4">
                                                <label for="u_jk" class="form-label fw-medium">Jenis Kelamin <span class="text-danger">*</span></label>
                                                <select class="form-select rounded-1" id="u_jk" required>
                                                    <option value="" selected disabled hidden>Pilih...</option>
                                                    <option value="Laki-laki">Laki-laki</option>
                                                    <option value="Perempuan">Perempuan</option>
                                                </select>
                                            </div>
                                            <div class="col-md-4">
                                                <label for="u_wn" class="form-label fw-medium">Kewarganegaraan</label>
                                                <select class="form-select rounded-1" id="u_wn">
                                                    <option value="WNI" selected>WNI</option>
                                                    <option value="WNA">WNA</option>
                                                </select>
                                            </div>
                                            <div class="col-md-4">
                                                <label for="u_marital" class="form-label fw-medium">Status Pernikahan <span class="text-danger">*</span></label>
                                                <select class="form-select rounded-1" id="u_marital" required>
                                                    <option value="" selected disabled hidden>Pilih...</option>
                                                    <option value="M">Menikah</option>
                                                    <option value="S">Belum Menikah</option>
                                                    <option value="D">Cerai Hidup</option>
                                                    <option value="W">Cerai Mati</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="accordion mb-4" id="accordionAlamatUmum">
                            <div class="accordion-item border-0 bg-transparent">
                                <h2 class="accordion-header">
                                    <button class="accordion-button bg-light rounded-1 fw-bold text-ss-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAlamatUmum" aria-expanded="true" aria-controls="collapseAlamatUmum">
                                        Alamat Domisili
                                    </button>
                                </h2>
                                <div id="collapseAlamatUmum" class="accordion-collapse collapse show" data-bs-parent="#accordionAlamatUmum">
                                    <div class="accordion-body border mt-2 bg-white rounded-1">
                                        <div class="row g-3 mb-2">
                                            <div class="col-12">
                                                <label for="u_alamat" class="form-label fw-medium">Alamat Lengkap (Sesuai KTP) <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control rounded-1" id="u_alamat" required placeholder="Contoh: Jl. Merdeka No. 10">
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="u_prov" class="form-label fw-medium">Provinsi</label>
                                                <select class="form-select rounded-1 wilayah-select" id="u_prov" data-target="u_kota" data-type="cities">
                                                    <option value="">Pilih Provinsi...</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="u_kota" class="form-label fw-medium">Kab/Kota</label>
                                                <select class="form-select rounded-1 wilayah-select" id="u_kota" data-target="u_kec" data-type="districts" disabled>
                                                    <option value="">Pilih Kab/Kota...</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="u_kec" class="form-label fw-medium">Kecamatan</label>
                                                <select class="form-select rounded-1 wilayah-select" id="u_kec" data-target="u_desa" data-type="sub-districts" disabled>
                                                    <option value="">Pilih Kecamatan...</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="u_desa" class="form-label fw-medium">Kelurahan/Desa</label>
                                                <select class="form-select rounded-1" id="u_desa" disabled>
                                                    <option value="">Pilih Kel/Desa...</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="u_rt" class="form-label fw-medium">RT</label>
                                                <input type="text" class="form-control rounded-1" id="u_rt" pattern="\d{3}" maxlength="3" title="Harus 3 digit angka, contoh: 001" placeholder="001">
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="u_rw" class="form-label fw-medium">RW</label>
                                                <input type="text" class="form-control rounded-1" id="u_rw" pattern="\d{3}" maxlength="3" title="Harus 3 digit angka, contoh: 002" placeholder="002">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="accordion mb-4" id="accordionOpsionalUmum">
                            <div class="accordion-item border-0 bg-transparent">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed bg-light rounded-1 fw-bold text-ss-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOpsionalUmum" aria-expanded="false" aria-controls="collapseOpsionalUmum">
                                        Identitas Tambahan, Kontak & Keluarga (Opsional)
                                    </button>
                                </h2>
                                <div id="collapseOpsionalUmum" class="accordion-collapse collapse" data-bs-parent="#accordionOpsionalUmum">
                                    <div class="accordion-body border mt-2 bg-white rounded-1">
                                        
                                        <h6 class="fw-bold mb-3">Identitas Tambahan</h6>
                                        <div class="row g-3 mb-4">
                                            <div class="col-md-6">
                                                <label for="u_paspor" class="form-label fw-medium">Nomor Paspor</label>
                                                <input type="text" class="form-control rounded-1" id="u_paspor" placeholder="A1234567">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="u_kk" class="form-label fw-medium">Nomor Kartu Keluarga</label>
                                                <input type="text" class="form-control rounded-1" id="u_kk" pattern="\d{16}" maxlength="16" title="KK harus terdiri dari 16 digit angka" placeholder="Contoh: 1234567890123456" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                                            </div>
                                        </div>

                                        <h6 class="fw-bold mb-3">Kontak & Keluarga</h6>
                                        <div class="row g-3 mb-2">
                                            <div class="col-md-6">
                                                <label for="u_phone_mobile" class="form-label fw-medium">No. HP (Mobile)</label>
                                                <input type="text" class="form-control rounded-1" id="u_phone_mobile" pattern="\d+" title="Hanya angka diperbolehkan" placeholder="081234567890" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="u_email" class="form-label fw-medium">Email</label>
                                                <input type="email" class="form-control rounded-1" id="u_email" placeholder="email@contoh.com">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="u_contact_name" class="form-label fw-medium">Nama Kontak Darurat</label>
                                                <input type="text" class="form-control rounded-1" id="u_contact_name" placeholder="Nama Keluarga/Kerabat">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="u_contact_phone" class="form-label fw-medium">No. HP Kontak Darurat</label>
                                                <input type="text" class="form-control rounded-1" id="u_contact_phone" pattern="\d+" title="Hanya angka diperbolehkan" placeholder="081234567890" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="u_kembar" class="form-label fw-medium">Status Kelahiran</label>
                                                <select class="form-select rounded-1" id="u_kembar">
                                                    <option value="Tunggal" selected>Tunggal</option>
                                                    <option value="Kembar">Kembar</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="u_urutan" class="form-label fw-medium">Urutan Kelahiran</label>
                                                <input type="number" class="form-control rounded-1" id="u_urutan" min="1" placeholder="1">
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                            <button type="button" class="btn btn-ss-primary fw-medium px-5 py-2 rounded-1 btn-post">
                                <i class="bi bi-send-fill me-1"></i>POST Patient Umum
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Tab Registrasi Bayi -->
                <div class="tab-pane fade" id="bayi" role="tabpanel" aria-labelledby="bayi-tab">
                    <form id="form-bayi">
                        
                        <div class="accordion mb-4" id="accordionUtamaBayi">
                            <div class="accordion-item border-0 bg-transparent">
                                <h2 class="accordion-header">
                                    <button class="accordion-button bg-light rounded-1 fw-bold text-ss-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseUtamaBayi" aria-expanded="true" aria-controls="collapseUtamaBayi">
                                        Data Kelahiran Bayi
                                    </button>
                                </h2>
                                <div id="collapseUtamaBayi" class="accordion-collapse collapse show" data-bs-parent="#accordionUtamaBayi">
                                    <div class="accordion-body border mt-2 bg-white rounded-1">
                                        <div class="row g-3 mb-2">
                                            <div class="col-md-6">
                                                <label for="b_nik_ibu" class="form-label fw-medium">NIK Ibu Kandung <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control rounded-1" id="b_nik_ibu" required pattern="\d{16}" maxlength="16" title="NIK harus terdiri dari 16 digit angka" placeholder="Contoh: 1234567890123456" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                                                <div class="form-text">Sangat penting untuk referensi relasi.</div>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="b_nik_anak" class="form-label fw-medium">NIK Bayi (Opsional)</label>
                                                <input type="text" class="form-control rounded-1" id="b_nik_anak" pattern="\d{16}" maxlength="16" title="NIK harus terdiri dari 16 digit angka" placeholder="Contoh: 1234567890123456" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                                            </div>
                                            <div class="col-md-8">
                                                <label for="b_nama_anak" class="form-label fw-medium">Nama Bayi <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control rounded-1" id="b_nama_anak" required placeholder='Contoh: By Ny. Fulan'>
                                                <div class="form-text">Gunakan format "By Ny. [Nama Ibu]" jika belum diberi nama.</div>
                                            </div>
                                            <div class="col-md-4">
                                                <label for="b_tgl" class="form-label fw-medium">Tanggal Lahir <span class="text-danger">*</span></label>
                                                <input type="date" class="form-control rounded-1" id="b_tgl" value="<?= date('Y-m-d') ?>" max="<?= date('Y-m-d') ?>" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="b_tempat" class="form-label fw-medium">Tempat Lahir (Kota)</label>
                                                <input type="text" class="form-control rounded-1" id="b_tempat" placeholder="Contoh: Surabaya">
                                            </div>
                                            <div class="col-md-3">
                                                <label for="b_jk" class="form-label fw-medium">Jenis Kelamin <span class="text-danger">*</span></label>
                                                <select class="form-select rounded-1" id="b_jk" required>
                                                    <option value="" selected disabled hidden>Pilih...</option>
                                                    <option value="Laki-laki">Laki-laki</option>
                                                    <option value="Perempuan">Perempuan</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3">
                                                <label for="b_wn" class="form-label fw-medium">Kewarganegaraan</label>
                                                <select class="form-select rounded-1" id="b_wn">
                                                    <option value="WNI" selected>WNI</option>
                                                    <option value="WNA">WNA</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="b_kembar" class="form-label fw-medium">Status Kelahiran <span class="text-danger">*</span></label>
                                                <select class="form-select rounded-1" id="b_kembar">
                                                    <option value="Tunggal" selected>Tunggal</option>
                                                    <option value="Kembar">Kembar</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="b_urutan" class="form-label fw-medium">Urutan Kelahiran</label>
                                                <input type="number" class="form-control rounded-1" id="b_urutan" min="1" value="1" placeholder="1">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="accordion mb-4" id="accordionAlamatBayi">
                            <div class="accordion-item border-0 bg-transparent">
                                <h2 class="accordion-header">
                                    <button class="accordion-button bg-light rounded-1 fw-bold text-ss-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAlamatBayi" aria-expanded="true" aria-controls="collapseAlamatBayi">
                                        Alamat Domisili
                                    </button>
                                </h2>
                                <div id="collapseAlamatBayi" class="accordion-collapse collapse show" data-bs-parent="#accordionAlamatBayi">
                                    <div class="accordion-body border mt-2 bg-white rounded-1">
                                        <div class="row g-3 mb-2">
                                            <div class="col-12">
                                                <label for="b_alamat" class="form-label fw-medium">Alamat Lengkap (Sesuai KTP) <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control rounded-1" id="b_alamat" required placeholder="Contoh: Jl. Diponegoro No. 5">
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="b_prov" class="form-label fw-medium">Provinsi</label>
                                                <select class="form-select rounded-1 wilayah-select" id="b_prov" data-target="b_kota" data-type="cities">
                                                    <option value="">Pilih Provinsi...</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="b_kota" class="form-label fw-medium">Kab/Kota</label>
                                                <select class="form-select rounded-1 wilayah-select" id="b_kota" data-target="b_kec" data-type="districts" disabled>
                                                    <option value="">Pilih Kab/Kota...</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="b_kec" class="form-label fw-medium">Kecamatan</label>
                                                <select class="form-select rounded-1 wilayah-select" id="b_kec" data-target="b_desa" data-type="sub-districts" disabled>
                                                    <option value="">Pilih Kecamatan...</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="b_desa" class="form-label fw-medium">Kelurahan/Desa</label>
                                                <select class="form-select rounded-1" id="b_desa" disabled>
                                                    <option value="">Pilih Kel/Desa...</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="b_rt" class="form-label fw-medium">RT</label>
                                                <input type="text" class="form-control rounded-1" id="b_rt" pattern="\d{3}" maxlength="3" title="Harus 3 digit angka, contoh: 001" placeholder="001">
                                            </div>
                                            <div class="col-md-3 col-6">
                                                <label for="b_rw" class="form-label fw-medium">RW</label>
                                                <input type="text" class="form-control rounded-1" id="b_rw" pattern="\d{3}" maxlength="3" title="Harus 3 digit angka, contoh: 002" placeholder="002">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="accordion mb-4" id="accordionOpsionalBayi">
                            <div class="accordion-item border-0 bg-transparent">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed bg-light rounded-1 fw-bold text-ss-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOpsionalBayi" aria-expanded="false" aria-controls="collapseOpsionalBayi">
                                        Data Wali / Penanggung Jawab (Opsional)
                                    </button>
                                </h2>
                                <div id="collapseOpsionalBayi" class="accordion-collapse collapse" data-bs-parent="#accordionOpsionalBayi">
                                    <div class="accordion-body border mt-2 bg-white rounded-1">
                                        
                                        <div class="row g-3 mb-2">
                                            <div class="col-md-4">
                                                <label for="b_contact_name" class="form-label fw-medium">Nama Wali</label>
                                                <input type="text" class="form-control rounded-1" id="b_contact_name" placeholder="Nama Wali">
                                            </div>
                                            <div class="col-md-4">
                                                <label for="b_contact_phone" class="form-label fw-medium">No. HP Wali</label>
                                                <input type="text" class="form-control rounded-1" id="b_contact_phone" pattern="\d+" title="Hanya angka diperbolehkan" placeholder="081234567890" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                                            </div>
                                            <div class="col-md-4">
                                                <label for="b_phone_mobile" class="form-label fw-medium">No. HP Alternatif</label>
                                                <input type="text" class="form-control rounded-1" id="b_phone_mobile" pattern="\d+" title="Hanya angka diperbolehkan" placeholder="081234567890" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                            <button type="button" class="btn btn-ss-primary fw-medium px-5 py-2 rounded-1 btn-post">
                                <i class="bi bi-send-fill me-1"></i>POST Patient Bayi
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Tab Update Pasien -->
                <div class="tab-pane fade" id="patch" role="tabpanel" tabindex="0">
                    <div class="alert alert-info border-0 rounded-1 d-flex align-items-center" role="alert">
                        <i class="bi bi-info-circle-fill me-3 fs-4"></i>
                        <div>Gunakan form ini untuk memperbarui (PATCH) data pasien di SATUSEHAT. Hanya isi kolom yang ingin diubah.</div>
                    </div>

                    <form id="form-patch">
                        <div class="card border-0 bg-light mb-4 rounded-1">
                            <div class="card-body p-4">
                                <h6 class="fw-bold text-ss-primary border-bottom pb-2 mb-3"><i class="bi bi-person-check-fill me-2"></i>Data Wajib (Target & Validasi)</h6>
                                <div class="alert alert-warning mb-4 border-0">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Penting:</strong> Masukkan Nomor IHS dan Data Existing untuk validasi PATCH.
                                </div>
                                <div class="row g-3">
                                    <div class="col-md-12">
                                        <label for="p_ihs" class="form-label fw-medium">Nomor IHS Pasien <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control rounded-1" id="p_ihs" required placeholder="Contoh: P1234567890">
                                    </div>
                                    <div class="col-md-12">
                                        <label for="p_nama_existing" class="form-label fw-medium">Nama Lengkap Existing <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control rounded-1" id="p_nama_existing" required placeholder="Nama Lengkap Pasien Saat Ini">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_tgl_existing" class="form-label fw-medium">Tanggal Lahir Existing <span class="text-danger">*</span></label>
                                        <input type="date" class="form-control rounded-1" id="p_tgl_existing" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_jk_existing" class="form-label fw-medium">Jenis Kelamin Existing <span class="text-danger">*</span></label>
                                        <select class="form-select rounded-1" id="p_jk_existing" required>
                                            <option value="" selected disabled hidden>Pilih...</option>
                                            <option value="Laki-laki">Laki-laki</option>
                                            <option value="Perempuan">Perempuan</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card border-0 mb-4 rounded-1">
                            <div class="card-body p-4 border border-top-0 rounded-1">
                                <h6 class="fw-bold text-ss-primary border-bottom pb-2 mb-3"><i class="bi bi-pencil-square me-2"></i>Data Baru (Update Opsional)</h6>
                                <div class="alert alert-info mb-4 border-0">
                                    <i class="bi bi-info-circle-fill me-2"></i>Hanya isi kolom yang ingin Anda ubah. Kosongkan jika tidak ada perubahan.
                                </div>
                                <div class="row g-3 mb-4">
                                    <div class="col-md-6">
                                        <label for="p_nik" class="form-label fw-medium">NIK Baru</label>
                                        <input type="text" class="form-control rounded-1" id="p_nik" pattern="\d{16}" maxlength="16" placeholder="Contoh: 1234567890123456" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_nama" class="form-label fw-medium">Nama Lengkap Baru</label>
                                        <input type="text" class="form-control rounded-1" id="p_nama" placeholder="Contoh: John Doe">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_tgl" class="form-label fw-medium">Tanggal Lahir Baru</label>
                                        <input type="date" class="form-control rounded-1" id="p_tgl" max="<?= date('Y-m-d') ?>">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_jk" class="form-label fw-medium">Jenis Kelamin Baru</label>
                                        <select class="form-select rounded-1" id="p_jk">
                                            <option value="">Tidak Diubah</option>
                                            <option value="Laki-laki">Laki-laki</option>
                                            <option value="Perempuan">Perempuan</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_marital" class="form-label fw-medium">Status Pernikahan Baru</label>
                                        <select class="form-select rounded-1" id="p_marital">
                                            <option value="">Tidak Diubah</option>
                                            <option value="S">Single</option>
                                            <option value="M">Married</option>
                                            <option value="D">Divorced</option>
                                            <option value="W">Widowed</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_wn" class="form-label fw-medium">Kewarganegaraan Baru</label>
                                        <select class="form-select rounded-1" id="p_wn">
                                            <option value="">Tidak Diubah</option>
                                            <option value="WNI">WNI</option>
                                            <option value="WNA">WNA</option>
                                        </select>
                                    </div>
                                    <div class="col-md-12">
                                        <label for="p_tempat" class="form-label fw-medium">Tempat Lahir Baru</label>
                                        <input type="text" class="form-control rounded-1" id="p_tempat" placeholder="Contoh: Jakarta">
                                    </div>
                                </div>

                                <h6 class="fw-bold text-ss-primary border-bottom pb-2 mb-3 mt-4">Alamat & Wilayah Baru</h6>
                                <div class="mb-4">
                                    <label for="p_alamat" class="form-label fw-medium">Alamat Jalan</label>
                                    <textarea class="form-control rounded-1" id="p_alamat" rows="2" placeholder="Contoh: JL. KH. WAKHID HASYIM"></textarea>
                                </div>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label for="p_prov" class="form-label fw-medium">Provinsi</label>
                                        <select class="form-select rounded-1 wilayah-select" id="p_prov" data-target="p_kota" data-type="cities">
                                            <option value="">Loading...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_kota" class="form-label fw-medium">Kota / Kabupaten</label>
                                        <select class="form-select rounded-1 wilayah-select" id="p_kota" data-target="p_kec" data-type="districts" disabled>
                                            <option value="">Pilih...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_kec" class="form-label fw-medium">Kecamatan</label>
                                        <select class="form-select rounded-1 wilayah-select" id="p_kec" data-target="p_desa" data-type="sub-districts" disabled>
                                            <option value="">Pilih...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_desa" class="form-label fw-medium">Kelurahan / Desa</label>
                                        <select class="form-select rounded-1" id="p_desa" disabled>
                                            <option value="">Pilih...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_rt" class="form-label fw-medium">RT</label>
                                        <input type="text" class="form-control rounded-1" id="p_rt" placeholder="Contoh: 001" pattern="\d{3}" maxlength="3" title="Harus 3 digit angka">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="p_rw" class="form-label fw-medium">RW</label>
                                        <input type="text" class="form-control rounded-1" id="p_rw" placeholder="Contoh: 005" pattern="\d{3}" maxlength="3" title="Harus 3 digit angka">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                            <button type="submit" class="btn btn-ss-primary fw-medium px-5 py-2 rounded-1 w-100 btn-patch">
                                <i class="bi bi-cloud-arrow-up-fill me-2"></i>PATCH Data Pasien
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>

        <!-- Kolom Kanan: Response Panel -->
        <div class="col-xl-5 col-lg-6 position-relative">
            <div class="card rounded-1 border shadow-sm sticky-top" style="top: 80px; min-height: 500px;" id="response-panel-container">
                <!-- Overlay Loading -->
                <div id="response-overlay" class="position-absolute w-100 h-100 bg-white bg-opacity-75 d-none justify-content-center align-items-center" style="z-index: 10;">
                    <div class="text-center">
                        <div class="spinner-border text-ss-primary" role="status"></div>
                        <div class="mt-2 fw-medium text-ss-primary">Memproses...</div>
                    </div>
                </div>

                <div class="card-header bg-ss-secondary text-dark fw-bold border-bottom d-flex justify-content-between align-items-center py-3">
                    <span><i class="bi bi-display me-2"></i>Panel Respons API</span>
                    <button type="button" class="btn btn-outline-danger fw-medium px-4 rounded-1 btn-clear">
                        <i class="bi bi-trash me-1"></i>Clear Form
                    </button>
                </div>
                
                
                <div class="card-body overflow-auto p-0 bg-light" id="response-content" style="max-height: 70vh;">
                    <!-- Default State -->
                    <div class="text-center text-muted p-5" id="response-empty">
                        <i class="bi bi-server" style="font-size: 3rem; color: #cbd5e1;"></i>
                        <p class="mt-3 mb-0">Lakukan request untuk melihat hasil di sini.</p>
                    </div>
                    
                    <!-- Dynamic Content Will Be Injected Here by JS -->
                </div>
            </div>
        </div>
    </div>

</div>

<!-- Clear Form Confirmation Modal -->
<div class="modal fade" id="clearFormModal" tabindex="-1" aria-labelledby="clearFormModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header border-bottom-0">
                <h5 class="modal-title fw-bold text-danger" id="clearFormModalLabel"><i class="bi bi-exclamation-triangle-fill me-2"></i>Konfirmasi</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center py-4">
                <p class="fs-5 mb-0">Apakah Anda yakin ingin membersihkan semua form?</p>
                <p class="text-muted mt-2">Data yang belum disubmit akan hilang.</p>
            </div>
            <div class="modal-footer border-top-0 d-flex justify-content-center">
                <button type="button" class="btn btn-light px-4 fw-medium" data-bs-dismiss="modal">Batal</button>
                <button type="button" class="btn btn-danger px-4 fw-medium" id="btn-confirm-clear">Bersihkan Form</button>
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap Toasts Container -->
<div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1055;">
    <!-- Toasts injected via JS -->
</div>

<!-- Global CSRF Token -->
<input type="hidden" id="csrf_token" value="<?= htmlspecialchars($csrf_token) ?>">

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tom-select@2.2.2/dist/js/tom-select.complete.min.js"></script>
<script src="assets/js/main.js"></script>
</body>
</html>
