document.addEventListener('DOMContentLoaded', () => {

    const csrfToken = document.getElementById('csrf_token').value;
    const responseContent = document.getElementById('response-content');
    const responseEmpty = document.getElementById('response-empty');
    const responseOverlay = document.getElementById('response-overlay');
    const toastContainer = document.querySelector('.toast-container');

    // --- Toast Notification Logic ---
    function showToast(type, message) {
        let bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
        let icon = type === 'success' ? 'bi-check-circle' : 'bi-x-circle';
        
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi ${icon} me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(toastEl, { delay: 5000 });
        bsToast.show();
        
        // Remove from DOM after hidden
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

    // --- Loading State ---
    function setLoadingState(btnId, isLoading) {
        const btn = document.getElementById(btnId);
        if (isLoading) {
            responseOverlay.classList.remove('d-none');
            responseOverlay.classList.add('d-flex');
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Memproses...';
            btn.disabled = true;
        } else {
            responseOverlay.classList.remove('d-flex');
            responseOverlay.classList.add('d-none');
            btn.innerHTML = btn.dataset.originalText;
            btn.disabled = false;
        }
    }

    // --- Response Panel Logic ---
    function renderResponse(reqData, resData) {
        if (responseEmpty) responseEmpty.style.display = 'none';

        const timestamp = new Date().toLocaleString('id-ID');
        const accId = 'acc-' + Date.now();
        
        let statusHtml = '';
        if (resData.isSuccess) {
            let ihsHtml = resData.ihs ? `<div class="mb-2"><strong>IHS Number :</strong> <code>${resData.ihs}</code></div>` : '';
            let existingAlert = (resData.raw && resData.raw.existing) 
                ? `<div class="alert alert-warning py-2 mb-2 border-0"><i class="bi bi-info-circle-fill me-2"></i>${resData.raw.message}</div>` 
                : '';
            let titleText = (resData.raw && resData.raw.existing) ? 'Pasien Sudah Terdaftar' : 'Permintaan Berhasil';

            statusHtml = `
                <div class="box-success mb-3">
                    <h6 class="text-success fw-bold mb-3"><i class="bi bi-check-circle-fill me-2"></i>${titleText}</h6>
                    ${existingAlert}
                    ${ihsHtml}
                    <div class="mb-1"><strong>Pesan :</strong> ${resData.message}</div>
                    <div class="mb-1"><strong>Waktu Selesai :</strong> ${timestamp}</div>
                </div>
            `;
        } else {
            let diagnosticsHtml = '';
            
            // Try parse issue array
            if (resData.raw && resData.raw.details && resData.raw.details.response) {
                try {
                    let parsed = JSON.parse(resData.raw.details.response);
                    if (parsed.issue && Array.isArray(parsed.issue)) {
                        let rows = '';
                        parsed.issue.forEach(iss => {
                            let diag = iss.diagnostics || '-';
                            let detail = iss.details?.text || '-';
                            let code = iss.code || '-';
                            rows += `<tr><td><code>${code}</code></td><td>${detail}</td><td>${diag}</td></tr>`;
                        });
                        diagnosticsHtml = `
                            <div class="table-responsive mt-3">
                                <table class="table table-bordered table-diagnostics mb-0">
                                    <thead><tr><th>Issue Code</th><th>Details</th><th>Diagnostics</th></tr></thead>
                                    <tbody>${rows}</tbody>
                                </table>
                            </div>
                        `;
                    }
                } catch(e) {}
            }

            statusHtml = `
                <div class="box-danger mb-3">
                    <h6 class="text-danger fw-bold mb-3"><i class="bi bi-x-circle-fill me-2"></i>Registrasi gagal</h6>
                    <div class="mb-1"><strong>HTTP Code :</strong> ${resData.httpCode}</div>
                    <div class="mb-1"><strong>Pesan :</strong> ${resData.message}</div>
                    ${diagnosticsHtml}
                </div>
            `;
        }

        // Search Success special render
        if (reqData.type === 'Cari Pasien' && resData.isSuccess) {
            let rows = '';
            if (resData.raw.response && resData.raw.response.entry) {
                resData.raw.response.entry.forEach((item, i) => {
                    let res = item.resource;
                    let name = res.name && res.name.length > 0 ? res.name[0].text : '-';
                    rows += `<tr><td>${i+1}</td><td>${name}</td><td><code>${res.id}</code></td></tr>`;
                });
            }
            statusHtml = `
                <div class="box-info mb-3">
                    <h6 class="text-primary fw-bold mb-3"><i class="bi bi-info-circle-fill me-2"></i>Pencarian Selesai</h6>
                    <div class="mb-2"><strong>Total Ditemukan :</strong> ${resData.raw.response?.total || 0}</div>
                    <table class="table table-bordered table-diagnostics mb-0">
                        <thead><tr><th>No</th><th>Nama Pasien</th><th>ID IHS</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="3" class="text-center">Citizen Not Exists</td></tr>'}</tbody>
                    </table>
                </div>
            `;
        }

        const rawJsonString = JSON.stringify(resData.raw || {}, null, 2);

        const cardHtml = `
            <div class="res-card mb-3">
                <div class="res-header d-flex justify-content-between">
                    <span><i class="bi bi-arrow-right-circle me-2 text-secondary"></i>${reqData.type}</span>
                    <span class="text-muted fw-normal">${timestamp}</span>
                </div>
                <div class="res-body">
                    <div class="row mb-3 pb-2 border-bottom">
                        <div class="col-6 mb-2">
                            <span class="text-muted d-block" style="font-size:0.75rem;">Environment</span>
                            <span class="fw-medium">${reqData.env}</span>
                        </div>
                        <div class="col-6 mb-2">
                            <span class="text-muted d-block" style="font-size:0.75rem;">Endpoint</span>
                            <span class="fw-medium">${reqData.endpoint}</span>
                        </div>
                    </div>
                    
                    ${statusHtml}

                    <div class="accordion accordion-flush mt-3 border" id="acc-${accId}">
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed py-2" type="button" data-bs-toggle="collapse" data-bs-target="#col-${accId}">
                                    <i class="bi bi-code-slash me-2"></i> Lihat Respons Lengkap (JSON)
                                </button>
                            </h2>
                            <div id="col-${accId}" class="accordion-collapse collapse" data-bs-parent="#acc-${accId}">
                                <div class="accordion-body p-0">
                                    <pre class="json-pre m-0"><code>${rawJsonString}</code></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        responseContent.innerHTML = cardHtml; // Replace existing
    }


    // --- Credentials Auto-populate ---
    const envBadge = document.getElementById('env-badge');
    
    function applyEnv() {
        const selectedEnv = document.querySelector('input[name="env_var"]:checked').value;
        const creds = envConfig[selectedEnv];
        document.getElementById('client_id').value = creds.id;
        document.getElementById('client_secret').value = creds.secret;
        
        if(selectedEnv === 'Production') {
            envBadge.className = 'badge bg-danger ms-2';
            envBadge.textContent = 'Production';
        } else {
            envBadge.className = 'badge bg-warning text-dark ms-2';
            envBadge.textContent = 'Staging';
        }
    }

    document.querySelectorAll('input[name="env_var"]').forEach(radio => {
        radio.addEventListener('change', applyEnv);
    });

    applyEnv();

    // --- Clear Form ---
    document.querySelectorAll('.btn-clear').forEach(btn => {
        btn.addEventListener('click', () => {
            if(confirm('Bersihkan semua input pada form?')) {
                document.getElementById('form-umum').reset();
                document.getElementById('form-bayi').reset();
                document.getElementById('form-search').reset();
                if(document.getElementById('form-patch')) document.getElementById('form-patch').reset();
                
                // Sync TomSelect instances
                for (let id in tsInstances) {
                    if (tsInstances[id]) {
                        tsInstances[id].clear(true);
                    }
                }
                
                if (responseEmpty) responseEmpty.style.display = 'block';
                responseContent.innerHTML = '';
                responseContent.appendChild(responseEmpty);
            }
        });
    });

    // --- Generate Token ---
    let currentAccessToken = '';
    
    document.getElementById('btn-generate').addEventListener('click', async () => {
        const client_id = document.getElementById('client_id').value.trim();
        const client_secret = document.getElementById('client_secret').value.trim();
        const env = document.querySelector('input[name="env_var"]:checked').value;

        if (!client_id || !client_secret) {
            showToast('error', 'Gagal memperoleh token SATUSEHAT. Periksa Client ID, Client Secret, dan Environment.');
            return;
        }

        setLoadingState('btn-generate', true);

        const formData = new URLSearchParams();
        formData.append('csrf_token', csrfToken);
        formData.append('client_id', client_id);
        formData.append('client_secret', client_secret);
        formData.append('env', env);

        try {
            const response = await fetch('api/generate_token.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            const data = await response.json();

            if (response.ok && data.success) {
                currentAccessToken = data.access_token;
                showToast('success', 'Token SATUSEHAT berhasil diperoleh.');
                initProvinces(); // Load provinces from API once token is ready
            } else {
                showToast('error', 'Gagal memperoleh token SATUSEHAT. Periksa Client ID, Client Secret, dan Environment.');
            }
        } catch (error) {
            showToast('error', 'Gagal memperoleh token SATUSEHAT. Terjadi kesalahan koneksi.');
        } finally {
            setLoadingState('btn-generate', false);
        }
    });

    // --- Copy Token (Removed) ---

    // --- POST Patient Logic ---
    document.querySelectorAll('.btn-post').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const btnTarget = e.currentTarget;
        // Active Tab Logic
        const isUmumActive = document.getElementById('umum').classList.contains('active');
        const isBayiActive = document.getElementById('bayi').classList.contains('active');
        
        if (!isUmumActive && !isBayiActive) {
            showToast('error', 'Harap buka tab Registrasi Umum atau Registrasi Bayi untuk mendaftarkan pasien.');
            return;
        }

        let endpoint = isUmumActive ? 'api/post_pasien_umum.php' : 'api/post_pasien_bayi.php';
        let formId = isUmumActive ? 'form-umum' : 'form-bayi';
        let typeName = isUmumActive ? 'Registrasi Umum' : 'Registrasi Bayi Baru Lahir';
        
        const form = document.getElementById(formId);
        if (!form.reportValidity()) return; 

        const formData = new URLSearchParams();
        formData.append('csrf_token', csrfToken);

        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.id) formData.append(input.id, input.value);
        });

        const env = document.querySelector('input[name="env_var"]:checked').value;
        const reqData = { type: typeName, env: env, endpoint: '/fhir-r4/v1/Patient' };
        
        const originalText = btnTarget.innerHTML;
        btnTarget.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Memproses...';
        btnTarget.disabled = true;
        responseOverlay.classList.remove('d-none');
        responseOverlay.classList.add('d-flex');

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast('success', 'Registrasi pasien berhasil dikirim ke SATUSEHAT.');
                renderResponse(reqData, {
                    isSuccess: true,
                    httpCode: response.status,
                    message: 'Success',
                    ihs: data.id,
                    raw: data
                });
            } else {
                showToast('error', 'Registrasi pasien gagal diproses. Silakan periksa detail respons.');
                renderResponse(reqData, {
                    isSuccess: false,
                    httpCode: response.status,
                    message: data.error || 'Failed',
                    raw: data
                });
            }
        } catch (error) {
            showToast('error', 'Terjadi kesalahan koneksi.');
            renderResponse(reqData, {
                isSuccess: false,
                httpCode: 0,
                message: error.message,
                raw: { error: error.message }
            });
        } finally {
            responseOverlay.classList.remove('d-flex');
            responseOverlay.classList.add('d-none');
            btnTarget.innerHTML = originalText;
            btnTarget.disabled = false;
        }
    });
    });

    // --- Search Patient Logic ---
    document.getElementById('btn-search-action').addEventListener('click', async () => {
        const formSearch = document.getElementById('form-search');
        if (!formSearch.reportValidity()) return;

        const keyword = document.getElementById('s_keyword').value.trim();
        const type = document.getElementById('s_type').value;
        const env = document.querySelector('input[name="env_var"]:checked').value;
        
        const endpoint = type === 'ihs' ? `/fhir-r4/v1/Patient/${keyword}` : `/fhir-r4/v1/Patient?identifier=...${keyword}`;
        const reqData = { type: 'Cari Pasien', env: env, endpoint: endpoint };

        setLoadingState('btn-search-action', true);

        const formData = new URLSearchParams();
        formData.append('csrf_token', csrfToken);
        formData.append('keyword', keyword);
        formData.append('type', type);

        try {
            const response = await fetch('api/search_pasien.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString() });
            const data = await response.json();

            if (response.ok && data.success) {
                renderResponse(reqData, {
                    isSuccess: true,
                    httpCode: response.status,
                    message: 'Success',
                    raw: data
                });
            } else {
                renderResponse(reqData, {
                    isSuccess: false,
                    httpCode: response.status,
                    message: data.error || 'Terjadi kesalahan.',
                    raw: data
                });
            }
        } catch (error) { 
            renderResponse(reqData, {
                isSuccess: false,
                httpCode: 0,
                message: error.message,
                raw: { error: error.message }
            });
        } finally { 
            setLoadingState('btn-search-action', false); 
        }
    });

    // --- Patch Patient Logic ---
    const btnPatch = document.querySelector('.btn-patch');
    if (btnPatch) {
        btnPatch.addEventListener('click', async (e) => {
            e.preventDefault();
            const formPatch = document.getElementById('form-patch');
            if (!formPatch.reportValidity()) return;

            const btnTarget = e.currentTarget;
            const originalText = btnTarget.innerHTML;
            
            btnTarget.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Memproses...';
            btnTarget.disabled = true;
            responseOverlay.classList.remove('d-none');
            responseOverlay.classList.add('d-flex');

            const formData = new URLSearchParams();
            formData.append('csrf_token', csrfToken);

            const inputs = formPatch.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.id) formData.append(input.id, input.value);
            });

            const env = document.querySelector('input[name="env_var"]:checked').value;
            const ihsTarget = document.getElementById('p_ihs').value.trim();
            const reqData = { type: 'Update Data Pasien', env: env, endpoint: `/fhir-r4/v1/Patient/${ihsTarget}` };

            try {
                const response = await fetch('api/patch_pasien.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showToast('success', 'Data pasien berhasil di-update (PATCH) ke SATUSEHAT.');
                    renderResponse(reqData, {
                        isSuccess: true,
                        httpCode: response.status,
                        message: 'Success',
                        raw: data
                    });
                } else {
                    showToast('error', 'Update data pasien gagal diproses.');
                    renderResponse(reqData, {
                        isSuccess: false,
                        httpCode: response.status,
                        message: data.error || 'Failed',
                        raw: data
                    });
                }
            } catch (error) {
                showToast('error', 'Terjadi kesalahan koneksi.');
                renderResponse(reqData, {
                    isSuccess: false,
                    httpCode: 0,
                    message: error.message,
                    raw: { error: error.message }
                });
            } finally {
                responseOverlay.classList.remove('d-flex');
                responseOverlay.classList.add('d-none');
                btnTarget.innerHTML = originalText;
                btnTarget.disabled = false;
            }
        });
    }

    // --- Master Data Wilayah Logic ---
    async function fetchWilayah(type, parentCode = '') {
        const url = `api/get_wilayah.php?type=${type}&parent=${parentCode}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok && data.success) {
                return data.data;
            }
            return [];
        } catch (e) {
            console.error('Fetch Wilayah Error:', e);
            return [];
        }
    }

    let tsInstances = {};
    
    function updateSelectState(selectEl, isDisabled, htmlContent) {
        if (tsInstances[selectEl.id]) {
            tsInstances[selectEl.id].destroy();
        }
        selectEl.innerHTML = htmlContent;
        selectEl.disabled = isDisabled;
        
        if (!isDisabled) {
            tsInstances[selectEl.id] = new TomSelect(selectEl, {
                create: false,
                sortField: { field: "text", direction: "asc" },
                placeholder: 'Ketik untuk mencari...'
            });
        }
    }

    async function populateSelect(selectEl, type, parentCode = '') {
        updateSelectState(selectEl, true, '<option value="">Loading...</option>');
        
        const items = await fetchWilayah(type, parentCode);
        
        let defaultText = 'Pilih...';
        if (type === 'provinces') defaultText = 'Pilih Provinsi...';
        else if (type === 'cities') defaultText = 'Pilih Kab/Kota...';
        else if (type === 'districts') defaultText = 'Pilih Kecamatan...';
        else if (type === 'sub-districts') defaultText = 'Pilih Kel/Desa...';

        let newHtml = `<option value="">${defaultText}</option>`;
        
        if (items && items.length > 0) {
            items.forEach(item => {
                newHtml += `<option value="${item.code}">[${item.code}] - ${item.name}</option>`;
            });
            updateSelectState(selectEl, false, newHtml);
        } else {
            updateSelectState(selectEl, true, `<option value="">Data tidak ditemukan</option>`);
        }
    }

    // Trigger province load
    let provincesLoaded = false;
    async function initProvinces() {
        if (!provincesLoaded) {
            const resU = await populateSelect(document.getElementById('u_prov'), 'provinces');
            const resB = await populateSelect(document.getElementById('b_prov'), 'provinces');
            const resP = await populateSelect(document.getElementById('p_prov'), 'provinces');
            // If data is populated successfully, mark as loaded
            if (document.getElementById('u_prov').options.length > 1) {
                provincesLoaded = true;
            }
        }
    }



    // Bind change events to all select elements with class 'wilayah-select'
    document.querySelectorAll('.wilayah-select').forEach(select => {
        select.addEventListener('change', async function() {
            const targetId = this.dataset.target;
            const targetType = this.dataset.type;
            const val = this.value;
            
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            // Clear downstream targets recursively
            let currentTarget = targetEl;
            while (currentTarget) {
                updateSelectState(currentTarget, true, `<option value="">Pilih...</option>`);
                const nextId = currentTarget.dataset.target;
                currentTarget = nextId ? document.getElementById(nextId) : null;
            }

            if (val) {
                await populateSelect(targetEl, targetType, val);
            }
        });
    });

    // Auto-generate token if credentials are set to automatically fetch provinces on load
    setTimeout(() => {
        const clientId = document.getElementById('client_id').value.trim();
        const clientSecret = document.getElementById('client_secret').value.trim();
        if (clientId && clientSecret) {
            document.getElementById('btn-generate').click();
        }
    }, 500);

});
