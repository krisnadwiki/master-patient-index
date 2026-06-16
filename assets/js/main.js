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

    function generatePatientCardHtml(res) {
        let name = res.name && res.name.length > 0 ? res.name[0].text : '-';
        let ihs = res.id || '-';
        
        let nik = '-';
        let kk = '-';
        if (res.identifier) {
            const idNik = res.identifier.find(id => id.system === "https://fhir.kemkes.go.id/id/nik");
            if (idNik) nik = idNik.value;
            const idKk = res.identifier.find(id => id.system === "https://fhir.kemkes.go.id/id/kk");
            if (idKk) kk = idKk.value;
        }

        let tgl = res.birthDate || '-';
        let jk = res.gender || '-';
        
        let wn = '-';
        if (res.extension) {
            const extWn = res.extension.find(ext => ext.url === "https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus");
            if (extWn) wn = extWn.valueCode;
        }

        let tempat = '-';
        if (res.extension) {
            const extTempat = res.extension.find(ext => ext.url === "https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace");
            if (extTempat && extTempat.valueAddress) tempat = extTempat.valueAddress.city;
        }

        let alamatStr = '-';
        if (res.address && res.address.length > 0) {
            let a = res.address[0];
            alamatStr = a.line && a.line.length > 0 ? a.line.join(', ') : '';
            if (a.city) alamatStr += (alamatStr ? ', ' : '') + a.city;
            if (!alamatStr) alamatStr = '-';
        }
        
        let marital = '-';
        if (res.maritalStatus && res.maritalStatus.text) {
            marital = res.maritalStatus.text;
        }
        
        let active = typeof res.active !== 'undefined' ? (res.active ? 'Ya' : 'Tidak') : '-';
        let deceased = typeof res.deceasedBoolean !== 'undefined' ? (res.deceasedBoolean ? 'Ya' : 'Tidak') : '-';
        
        let lastUpdated = '-';
        if (res.meta && res.meta.lastUpdated) {
            lastUpdated = new Date(res.meta.lastUpdated).toLocaleString('id-ID');
        }

        let infoItems = '';
        if(nik !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>NIK:</strong> ${nik}</div>`;
        if(kk !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>KK:</strong> ${kk}</div>`;
        if(jk !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>Jenis Kelamin:</strong> ${jk}</div>`;
        if(tgl !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>Tgl Lahir:</strong> ${tgl}</div>`;
        if(tempat !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>Tempat Lahir:</strong> ${tempat}</div>`;
        if(wn !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>Kewarganegaraan:</strong> ${wn}</div>`;
        if(marital !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>Status Pernikahan:</strong> ${marital}</div>`;
        if(active !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>Status Aktif:</strong> ${active}</div>`;
        if(deceased !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>Meninggal:</strong> ${deceased}</div>`;
        if(lastUpdated !== '-') infoItems += `<div class="col-sm-6 mb-1"><strong>Terakhir Diperbarui:</strong> ${lastUpdated}</div>`;
        if(alamatStr !== '-') infoItems += `<div class="col-sm-12 mt-2 pt-2 border-top"><strong>Alamat:</strong> ${alamatStr}</div>`;

        return `
            <div class="card border border-ss-primary mb-3 shadow-sm rounded-1">
                <div class="card-header bg-light border-bottom border-ss-primary fw-bold d-flex justify-content-between align-items-center">
                    <span class="text-ss-primary"><i class="bi bi-person-fill me-2"></i>${name}</span>
                    <span class="badge bg-ss-primary text-white">IHS: ${ihs}</span>
                </div>
                <div class="card-body">
                    <div class="row g-2 text-sm">
                        ${infoItems}
                    </div>
                </div>
            </div>
        `;
    }

    // --- Response Panel Logic ---
    function renderResponse(reqData, resData) {
        if (responseEmpty) responseEmpty.style.display = 'none';

        const timestamp = new Date().toLocaleString('id-ID');
        const accId = 'acc-' + Date.now();
        
        let statusHtml = '';
        if (resData.isSuccess) {
            let patientCardsHtml = '';
            
            if (reqData.type === 'Cari Pasien' && resData.raw.response && resData.raw.response.entry) {
                resData.raw.response.entry.forEach((item) => {
                    patientCardsHtml += generatePatientCardHtml(item.resource);
                });
                
                statusHtml = `
                    <div class="mb-3">
                        <h6 class="text-ss-primary fw-bold mb-3"><i class="bi bi-search me-2"></i>Hasil Pencarian (Total: ${resData.raw.response?.total || 0})</h6>
                        ${patientCardsHtml || '<div class="alert alert-warning border-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>Pasien tidak ditemukan.</div>'}
                    </div>
                `;
            } else {
                let existingAlert = (resData.raw && resData.raw.existing) 
                    ? `<div class="alert alert-warning py-2 mb-2 border-0"><i class="bi bi-info-circle-fill me-2"></i>${resData.raw.message}</div>` 
                    : '';
                let titleText = (resData.raw && resData.raw.existing) ? 'Pasien Sudah Terdaftar' : 'Permintaan Berhasil';

                // Attempt to generate patient card if we have a resource
                if (resData.raw.response) {
                    if (resData.raw.response.resourceType === 'Patient') {
                        patientCardsHtml = generatePatientCardHtml(resData.raw.response);
                    } else if (resData.raw.response.entry && resData.raw.response.entry.length > 0) {
                        patientCardsHtml = generatePatientCardHtml(resData.raw.response.entry[0].resource);
                    }
                }

                statusHtml = `
                    <div class="box-success mb-3">
                        <h6 class="text-success fw-bold mb-3"><i class="bi bi-check-circle-fill me-2"></i>${titleText}</h6>
                        ${existingAlert}
                        ${patientCardsHtml}
                        <div class="mb-1 mt-2"><strong>Pesan :</strong> ${resData.message}</div>
                        <div class="mb-1"><strong>Waktu Selesai :</strong> ${timestamp}</div>
                    </div>
                `;
            }
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
                    <h6 class="text-danger fw-bold mb-3"><i class="bi bi-x-circle-fill me-2"></i>Permintaan Gagal</h6>
                    <div class="mb-1"><strong>HTTP Code :</strong> ${resData.httpCode}</div>
                    <div class="mb-1"><strong>Pesan :</strong> ${resData.message}</div>
                    ${diagnosticsHtml}
                </div>
            `;
        }

        let requestBodyHtml = '';
        if (resData.raw && resData.raw.request_body) {
            const reqBodyString = JSON.stringify(resData.raw.request_body, null, 2);
            requestBodyHtml = `
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed py-2" type="button" data-bs-toggle="collapse" data-bs-target="#req-${accId}">
                                    <i class="bi bi-file-earmark-code me-2"></i> Lihat Request Body JSON
                                </button>
                            </h2>
                            <div id="req-${accId}" class="accordion-collapse collapse" data-bs-parent="#acc-${accId}">
                                <div class="accordion-body p-0 position-relative">
                                    <button class="btn btn-sm btn-light position-absolute top-0 end-0 m-2 copy-btn shadow-sm" data-clipboard-target="#req-code-${accId}" title="Copy Request JSON"><i class="bi bi-clipboard"></i></button>
                                    <pre class="json-pre m-0"><code id="req-code-${accId}">${reqBodyString}</code></pre>
                                </div>
                            </div>
                        </div>
            `;
        }

        // To make the response JSON cleaner, we can optionally remove request_body from it before stringifying
        let rawResponse = { ...resData.raw };
        if (rawResponse.request_body) delete rawResponse.request_body;
        const rawJsonString = JSON.stringify(rawResponse, null, 2);

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
                        ${requestBodyHtml}
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed py-2" type="button" data-bs-toggle="collapse" data-bs-target="#col-${accId}">
                                    <i class="bi bi-code-slash me-2"></i> Lihat Respons Lengkap (JSON)
                                </button>
                            </h2>
                            <div id="col-${accId}" class="accordion-collapse collapse" data-bs-parent="#acc-${accId}">
                                <div class="accordion-body p-0 position-relative">
                                    <button class="btn btn-sm btn-light position-absolute top-0 end-0 m-2 copy-btn shadow-sm" data-clipboard-target="#res-code-${accId}" title="Copy Response JSON"><i class="bi bi-clipboard"></i></button>
                                    <pre class="json-pre m-0"><code id="res-code-${accId}">${rawJsonString}</code></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        responseContent.innerHTML = cardHtml; // Replace existing

        // SIMGos Logic
        const simgosPanel = document.getElementById('simgos-action-panel');
        const btnSimgosIhs = document.getElementById('btn-simgos-ihs');
        const btnSimgosNik = document.getElementById('btn-simgos-nik');
        
        if (simgosPanel) {
            simgosPanel.classList.add('d-none');
            btnSimgosIhs.classList.add('disabled');
            btnSimgosIhs.removeAttribute('href');
            btnSimgosNik.classList.add('disabled');
            btnSimgosNik.removeAttribute('href');

            const urlSimgosInput = document.getElementById('url_simgos');
            const simgosBaseUrl = urlSimgosInput ? urlSimgosInput.value.trim() : '';

            if (resData.isSuccess && simgosBaseUrl) {
                let extractedIhs = resData.ihs || resData.raw.id || null;
                let extractedNik = null;
                
                if (resData.raw.response) {
                    if (resData.raw.response.entry && resData.raw.response.entry.length > 0) {
                        const firstRes = resData.raw.response.entry[0].resource;
                        if (!extractedIhs) extractedIhs = firstRes.id;
                        if (firstRes.identifier) {
                            const nikId = firstRes.identifier.find(id => id.system === "https://fhir.kemkes.go.id/id/nik");
                            if (nikId) extractedNik = nikId.value;
                        }
                    } else if (resData.raw.response.resourceType === 'Patient') {
                        const res = resData.raw.response;
                        if (!extractedIhs) extractedIhs = res.id;
                        if (res.identifier) {
                            const nikId = res.identifier.find(id => id.system === "https://fhir.kemkes.go.id/id/nik");
                            if (nikId) extractedNik = nikId.value;
                        }
                    }
                }

                // Validasi NIK: Hanya 16 digit angka (abaikan masking ################)
                let isNikValid = false;
                if (extractedNik && /^\d{16}$/.test(extractedNik)) {
                    isNikValid = true;
                }

                if (extractedIhs || isNikValid) {
                    simgosPanel.classList.remove('d-none');
                    
                    if (extractedIhs) {
                        btnSimgosIhs.href = `${simgosBaseUrl}/webservice/kemkes/ihs/patient?id=${extractedIhs}`;
                        btnSimgosIhs.classList.remove('disabled');
                    }
                    
                    if (isNikValid) {
                        btnSimgosNik.href = `${simgosBaseUrl}/webservice/kemkes/ihs/patient?nik=${extractedNik}`;
                        btnSimgosNik.classList.remove('disabled');
                    }
                }
            }
        }
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
    
    // Init URL SIMGos from .env default
    const urlSimgosInput = document.getElementById('url_simgos');
    if (urlSimgosInput && typeof defaultSimgosUrl !== 'undefined') {
        urlSimgosInput.value = defaultSimgosUrl;
    }

    // --- Clear Form ---
    let clearFormModalInstance = null;
    const clearFormModalEl = document.getElementById('clearFormModal');
    if (clearFormModalEl) {
        clearFormModalInstance = new bootstrap.Modal(clearFormModalEl);
    }

    document.querySelectorAll('.btn-clear').forEach(btn => {
        btn.addEventListener('click', () => {
            if (clearFormModalInstance) {
                clearFormModalInstance.show();
            }
        });
    });

    const btnConfirmClear = document.getElementById('btn-confirm-clear');
    if (btnConfirmClear) {
        btnConfirmClear.addEventListener('click', () => {
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
            
            if (clearFormModalInstance) {
                clearFormModalInstance.hide();
            }
        });
    }

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
    const radioTypes = document.querySelectorAll('input[name="search_type"]');
    const fieldsIdentitas = document.getElementById('search-fields-identitas');
    const fieldsIhs = document.getElementById('search-fields-ihs');
    const fieldsBayi = document.getElementById('search-fields-bayi');

    function toggleSearchFields() {
        const selectedType = document.querySelector('input[name="search_type"]:checked')?.value;
        
        if (fieldsIdentitas) fieldsIdentitas.classList.add('d-none');
        if (fieldsIhs) fieldsIhs.classList.add('d-none');
        if (fieldsBayi) fieldsBayi.classList.add('d-none');

        // remove required
        document.getElementById('s_nik').required = false;
        document.getElementById('s_nama').required = false;
        document.getElementById('s_tgl').required = false;
        document.getElementById('s_jk').required = false;
        document.getElementById('s_ihs').required = false;
        document.getElementById('s_nik_ibu').required = false;
        document.getElementById('s_tgl_bayi').required = false;

        if (selectedType === 'identitas') {
            if(fieldsIdentitas) fieldsIdentitas.classList.remove('d-none');
        } else if (selectedType === 'ihs') {
            if(fieldsIhs) fieldsIhs.classList.remove('d-none');
            document.getElementById('s_ihs').required = true;
        } else if (selectedType === 'bayi') {
            if(fieldsBayi) fieldsBayi.classList.remove('d-none');
            document.getElementById('s_nik_ibu').required = true;
        }
    }

    if (radioTypes.length > 0) {
        radioTypes.forEach(radio => radio.addEventListener('change', toggleSearchFields));
        toggleSearchFields();
    }

    document.getElementById('btn-search-action').addEventListener('click', async () => {
        const formSearch = document.getElementById('form-search');
        if (!formSearch.reportValidity()) return;

        const type = document.querySelector('input[name="search_type"]:checked').value;
        const env = document.querySelector('input[name="env_var"]:checked').value;
        
        let endpoint = '';
        const formData = new URLSearchParams();
        formData.append('csrf_token', csrfToken);
        formData.append('type', type);

        if (type === 'identitas') {
            const nik = document.getElementById('s_nik').value.trim();
            const nama = document.getElementById('s_nama').value.trim();
            const tgl = document.getElementById('s_tgl').value.trim();
            const jk = document.getElementById('s_jk').value;

            if (!nik && (!nama || !tgl || !jk)) {
                showToast('error', 'Jika NIK kosong, Nama Lengkap, Tanggal Lahir, dan Jenis Kelamin harus diisi semua.');
                return;
            }

            formData.append('s_nik', nik);
            formData.append('s_nama', nama);
            formData.append('s_tgl', tgl);
            formData.append('s_jk', jk);
            
            endpoint = `/fhir-r4/v1/Patient?`;
            let params = [];
            if(nik) params.push(`identifier=https://fhir.kemkes.go.id/id/nik|${nik}`);
            if(nama) params.push(`name=${encodeURIComponent(nama)}`);
            if(tgl) params.push(`birthdate=${tgl}`);
            if(jk) params.push(`gender=${jk === 'Laki-laki' ? 'male' : 'female'}`);
            endpoint += params.join('&');

        } else if (type === 'ihs') {
            const ihs = document.getElementById('s_ihs').value.trim();
            formData.append('s_ihs', ihs);
            endpoint = `/fhir-r4/v1/Patient/${ihs}`;
        } else if (type === 'bayi') {
            const nikIbu = document.getElementById('s_nik_ibu').value.trim();
            const tglBayi = document.getElementById('s_tgl_bayi').value.trim();
            formData.append('s_nik_ibu', nikIbu);
            formData.append('s_tgl_bayi', tglBayi);
            
            endpoint = `/fhir-r4/v1/Patient?identifier=https://fhir.kemkes.go.id/id/nik-ibu|${nikIbu}`;
            if(tglBayi) endpoint += `&birthdate=${tglBayi}`;
        }
        
        const reqData = { type: 'Cari Pasien', env: env, endpoint: endpoint };

        setLoadingState('btn-search-action', true);

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

    // --- Global Clipboard Logic ---
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.copy-btn');
        if (btn) {
            const targetId = btn.getAttribute('data-clipboard-target');
            const el = document.querySelector(targetId);
            if (el) {
                navigator.clipboard.writeText(el.innerText).then(() => {
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="bi bi-check2 text-success"></i>';
                    setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            }
        }
    });

});
