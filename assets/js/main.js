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

    function generatePatientCardHtml(res, options = {}) {
        const { showUpdateBtn = false } = options;
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
            <div class="card border border-ss-primary mb-3 shadow-sm rounded-1 patient-card"
                 data-ihs="${ihs}"
                 data-nama="${name}"
                 data-tgl="${tgl}"
                 data-jk="${jk === 'male' ? 'Laki-laki' : jk === 'female' ? 'Perempuan' : jk}">
                <div class="card-header bg-light border-bottom border-ss-primary fw-bold d-flex justify-content-between align-items-center">
                    <span class="text-ss-primary"><i class="bi bi-person-fill me-2"></i>${name}</span>
                    <span class="badge bg-ss-primary text-white copy-ihs-badge" role="button" title="Klik untuk menyalin IHS" style="cursor:pointer" data-ihs="${ihs}">IHS: ${ihs} <i class="bi bi-clipboard ms-1" style="font-size:0.75em"></i></span>
                </div>
                <div class="card-body">
                    <div class="row g-2 text-sm">
                        ${infoItems}
                    </div>
                    ${showUpdateBtn ? `
                    <div class="mt-3 pt-2 border-top">
                        <button type="button" class="btn btn-ss-primary w-100 py-2 fw-medium btn-update-from-search">
                            <i class="bi bi-pencil-square me-2"></i>Update Identitas Pasien
                        </button>
                    </div>` : ''}
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
                    patientCardsHtml += generatePatientCardHtml(item.resource, { showUpdateBtn: true });
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

        // --- SIMGos Logic ---
        let simgosIhsHref = '';
        let simgosNikHref = '';
        let showSimgosPanel = false;

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
                showSimgosPanel = true;
                if (extractedIhs) simgosIhsHref = `${simgosBaseUrl}/webservice/kemkes/ihs/patient?id=${extractedIhs}`;
                if (isNikValid) simgosNikHref = `${simgosBaseUrl}/webservice/kemkes/ihs/patient?nik=${extractedNik}`;
            }
        }

        const simgosPanelHtml = showSimgosPanel ? `
            <div class="alert alert-light border mb-3 p-3" id="simgos-action-panel">
                <h6 class="fw-bold text-ss-primary mb-2" style="font-size: 0.85rem;"><i class="bi bi-link-45deg me-1"></i>Update Patient ke SIMGos</h6>
                <div class="d-flex gap-2">
                    <a href="${simgosIhsHref}" target="_blank" class="btn btn-outline-ss-primary fw-medium btn-sm flex-fill" id="btn-simgos-ihs">Update by IHS</a>
                    <a href="${simgosNikHref || '#'}" target="_blank" class="btn btn-outline-ss-primary fw-medium btn-sm flex-fill ${simgosNikHref ? '' : 'disabled'}" id="btn-simgos-nik">Update by NIK</a>
                </div>
            </div>
        ` : '';

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

                    ${simgosPanelHtml}

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
        
        responseContent.innerHTML = cardHtml;
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

    // Show SIMGos buttons in Umum & Bayi tabs if credentials are configured
    if (hasSimgosCredentials) {
        const simgosUmumWrapper = document.getElementById('simgos-search-wrapper-umum');
        const simgosBayiWrapper = document.getElementById('simgos-search-wrapper-bayi');
        if (simgosUmumWrapper) simgosUmumWrapper.classList.remove('d-none');
        if (simgosBayiWrapper) simgosBayiWrapper.classList.remove('d-none');
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
    const simgosSearchWrapper = document.getElementById('simgos-search-wrapper');

    function toggleSearchFields() {
        const selectedType = document.querySelector('input[name="search_type"]:checked')?.value;
        
        if (fieldsIdentitas) fieldsIdentitas.classList.add('d-none');
        if (fieldsIhs) fieldsIhs.classList.add('d-none');
        if (fieldsBayi) fieldsBayi.classList.add('d-none');
        if (simgosSearchWrapper) simgosSearchWrapper.classList.add('d-none');

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
            if (simgosSearchWrapper && hasSimgosCredentials) simgosSearchWrapper.classList.remove('d-none');
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

    // --- Copy IHS Badge Click ---
    document.addEventListener('click', function(e) {
        const badge = e.target.closest('.copy-ihs-badge');
        if (badge) {
            const ihsValue = badge.getAttribute('data-ihs');
            if (ihsValue) {
                navigator.clipboard.writeText(ihsValue).then(() => {
                    showToast('success', `IHS ${ihsValue} berhasil disalin ke clipboard.`);
                    const icon = badge.querySelector('i');
                    if (icon) {
                        icon.className = 'bi bi-check2 ms-1';
                        setTimeout(() => { icon.className = 'bi bi-clipboard ms-1'; }, 2000);
                    }
                }).catch(err => {
                    console.error('Failed to copy IHS: ', err);
                });
            }
        }
    });

    // --- Delegated: Update Identitas from search result ---
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-update-from-search');
        if (!btn) return;

        const card = btn.closest('.patient-card');
        if (!card) return;

        const ihs   = card.dataset.ihs || '';
        const nama  = card.dataset.nama || '';
        const tgl   = card.dataset.tgl || '';
        const jk    = card.dataset.jk || '';

        // Fill Update tab required fields
        const pIhs   = document.getElementById('p_ihs');
        const pNama  = document.getElementById('p_nama_existing');
        const pTgl   = document.getElementById('p_tgl_existing');
        const pJk    = document.getElementById('p_jk_existing');

        if (pIhs)  pIhs.value = ihs;
        if (pNama) pNama.value = nama;
        if (pTgl)  pTgl.value = tgl;
        if (pJk)   pJk.value = jk;

        // Switch to Update tab
        const patchTab = document.getElementById('patch-tab');
        if (patchTab) {
            const tab = new bootstrap.Tab(patchTab);
            tab.show();
        }

        showToast('success', 'Data pasien berhasil diisi ke form Update. Silakan lengkapi kolom yang ingin diubah.');
    });

    // --- SIMGos Search Pasien Logic (shared across Search, Umum, Bayi) ---
    const simgosSearchModalEl = document.getElementById('simgosSearchModal');
    const btnSimgosSearch = document.getElementById('btn-simgos-search');
    const btnSimgosSearchAction = document.getElementById('btn-simgos-search-action');
    const btnSimgosReset = document.getElementById('btn-simgos-reset');
    const simgosSearchStatus = document.getElementById('simgos-search-status');
    const simgosModalTitle = document.getElementById('simgos-modal-title');
    let simgosSearchModalInstance = null;
    let simgosFormContext = 'search'; // 'search' | 'umum' | 'bayi'

    const simgosContextTitles = {
        search: 'Cari Pasien dari SIMGos',
        umum: 'Ambil Data Registrasi Umum dari SIMGos',
        bayi: 'Ambil Data Registrasi Bayi dari SIMGos'
    };

    if (simgosSearchModalEl) {
        simgosSearchModalInstance = new bootstrap.Modal(simgosSearchModalEl);
    }

    // Helper: reset SIMGos modal fields
    function resetSimgosModal() {
        document.getElementById('simgos_norm').value = '';
        document.getElementById('simgos_tgl_lahir').value = '';
        simgosSearchStatus.classList.add('d-none');
        btnSimgosSearchAction.disabled = false;
    }

    function openSimgosModal(context) {
        simgosFormContext = context;
        if (simgosModalTitle) simgosModalTitle.textContent = simgosContextTitles[context] || simgosContextTitles.search;
        resetSimgosModal();
        if (simgosSearchModalInstance) simgosSearchModalInstance.show();
    }

    // Search tab button
    if (btnSimgosSearch) {
        btnSimgosSearch.addEventListener('click', () => openSimgosModal('search'));
    }

    // Umum & Bayi tab buttons
    document.querySelectorAll('.btn-simgos-search-form').forEach(btn => {
        btn.addEventListener('click', () => openSimgosModal(btn.dataset.form));
    });

    if (btnSimgosReset) {
        btnSimgosReset.addEventListener('click', () => resetSimgosModal());
    }

    // --- Helper: auto-fill wilayah dropdowns following the cascade hierarchy ---
    // Loads each level via API, sets native value BEFORE creating TomSelect
    // Example: WILAYAH=3518111011
    //   Provinsi=35 → load Kota → 3518 → load Kec → 351811 → load Desa → 3518111011
    async function autofillWilayah(wilayahCode, provId, kotaId, kecId, desaId) {
        if (!wilayahCode || wilayahCode.length < 2) return;
        const provCode = wilayahCode.substring(0, 2);
        const kotaCode = wilayahCode.substring(0, 4);
        const kecCode  = wilayahCode.substring(0, 6);
        const desaCode = wilayahCode.substring(0, 10);

        const provEl = document.getElementById(provId);
        const kotaEl = document.getElementById(kotaId);
        const kecEl  = document.getElementById(kecId);
        const desaEl = document.getElementById(desaId);

        // Find matching option value by SIMGos code (handles dot-format like "35.18")
        function findMatchValue(el, code) {
            if (!el || !code) return null;
            for (let opt of el.options) {
                if (opt.value && opt.value.replace(/\./g, '') === code) {
                    return opt.value;
                }
            }
            return null;
        }

        // Load options, set native value, then create TomSelect
        // This ensures TomSelect reads the pre-selected value during init
        async function loadAndSetValue(el, type, parentCode, matchCode) {
            if (!el) return null;

            // Destroy existing TomSelect
            if (tsInstances[el.id]) {
                tsInstances[el.id].destroy();
                delete tsInstances[el.id];
            }

            const items = await fetchWilayah(type, parentCode);
            if (!items || items.length === 0) return null;

            let defaultText = 'Pilih...';
            if (type === 'provinces') defaultText = 'Pilih Provinsi...';
            else if (type === 'cities') defaultText = 'Pilih Kab/Kota...';
            else if (type === 'districts') defaultText = 'Pilih Kecamatan...';
            else if (type === 'sub-districts') defaultText = 'Pilih Kel/Desa...';

            let html = `<option value="">${defaultText}</option>`;
            items.forEach(item => {
                html += `<option value="${item.code}">[${item.code}] - ${item.name}</option>`;
            });

            el.innerHTML = html;
            el.disabled = false;

            // Set native value BEFORE creating TomSelect
            const matched = findMatchValue(el, matchCode);
            if (matched) el.value = matched;

            // Create TomSelect — it reads the pre-selected value from native select
            tsInstances[el.id] = new TomSelect(el, {
                create: false,
                sortField: { field: 'text', direction: 'asc' },
                placeholder: 'Ketik untuk mencari...'
            });

            return matched;
        }

        // Enable downstream selects upfront
        [kotaEl, kecEl, desaEl].forEach(el => {
            if (el) {
                el.disabled = false;
                if (tsInstances[el.id]) tsInstances[el.id].enable();
            }
        });

        // Level 1: Provinsi
        const provValue = await loadAndSetValue(provEl, 'provinces', '', provCode);
        if (!provValue) return;

        // Level 2: Kab/Kota (parent = selected provinsi code)
        const kotaValue = await loadAndSetValue(kotaEl, 'cities', provValue, kotaCode);
        if (!kotaValue) return;

        // Level 3: Kecamatan (parent = selected kota code)
        const kecValue = await loadAndSetValue(kecEl, 'districts', kotaValue, kecCode);
        if (!kecValue) return;

        // Level 4: Kelurahan/Desa (parent = selected kec code)
        await loadAndSetValue(desaEl, 'sub-districts', kecValue, desaCode);
    }

    // --- Helper: safe set select value by matching text ---
    function setSelectByText(selectEl, text) {
        if (!selectEl || !text) return;
        const normalised = text.toLowerCase().replace(/[\s-]+/g, '');
        for (let opt of selectEl.options) {
            if (opt.value.toLowerCase().replace(/[\s-]+/g, '') === normalised) {
                selectEl.value = opt.value;
                return;
            }
        }
        // Fallback: try text content match
        for (let opt of selectEl.options) {
            if (opt.text.toLowerCase().replace(/[\s-]+/g, '') === normalised) {
                selectEl.value = opt.value;
                return;
            }
        }
    }

    // --- Auto-fill Umum form ---
    async function autofillFormUmum(raw) {
        const nik = extractNik(raw);
        const nama = (raw.NAMA || '').trim();

        const tgl = (raw.TANGGAL_LAHIR || '').split(' ')[0];
        const tempatLahir = raw.REFERENSI?.TEMPATLAHIR?.DESKRIPSI || '';
        const jkDesc = raw.REFERENSI?.JENISKELAMIN?.DESKRIPSI || '';
        const alamat = raw.ALAMAT || '';
        const rt = raw.RT ? raw.RT.padStart(3, '0') : '';
        const rw = raw.RW ? raw.RW.padStart(3, '0') : '';
        const wilayah = raw.WILAYAH || '';
        const wnCode = raw.KEWARGANEGARAAN || '';
        const maritalDesc = raw.REFERENSI?.STATUS_PERKAWINAN?.DESKRIPSI || '';
        const phone = extractPhone(raw);

        // Identity fields — Nama uses NAMA only (no Gelar Depan/Belakang)
        if (nik) document.getElementById('u_nik').value = nik;
        if (nama) document.getElementById('u_nama').value = nama;
        if (tgl) document.getElementById('u_tgl').value = tgl;
        if (tempatLahir) document.getElementById('u_tempat').value = tempatLahir;
        setSelectByText(document.getElementById('u_jk'), jkDesc);
        if (wnCode === '71' || wnCode === '1') document.getElementById('u_wn').value = 'WNI';
        else if (wnCode === '2') document.getElementById('u_wn').value = 'WNA';

        // Marital status: map description to dropdown code
        const maritalMap = {
            'belum kawin': 'S', 'belum menikah': 'S',
            'kawin': 'M', 'menikah': 'M',
            'cerai hidup': 'D',
            'cerai mati': 'W'
        };
        const maritalKey = maritalDesc.toLowerCase();
        if (maritalMap[maritalKey]) document.getElementById('u_marital').value = maritalMap[maritalKey];

        // Address fields
        if (alamat) document.getElementById('u_alamat').value = alamat;
        if (rt) document.getElementById('u_rt').value = rt;
        if (rw) document.getElementById('u_rw').value = rw;
        if (phone) document.getElementById('u_phone_mobile').value = phone;

        // Wilayah — load cascade hierarchy, then set values from code
        if (wilayah) await autofillWilayah(wilayah, 'u_prov', 'u_kota', 'u_kec', 'u_desa');
    }

    // --- Auto-fill Bayi form ---
    async function autofillFormBayi(raw) {
        const nik = extractNik(raw);
        const gelarDepan = (raw.GELAR_DEPAN || '').trim();
        const nama = (raw.NAMA || '').trim();
        // Bayi: concat Gelar Depan only if it starts with "BY NY" (case insensitive)
        const isByNy = gelarDepan.toUpperCase().startsWith('BY');
        const namaBayi = isByNy ? `${gelarDepan} ${nama}` : nama;

        const tgl = (raw.TANGGAL_LAHIR || '').split(' ')[0];
        const tempatLahir = raw.REFERENSI?.TEMPATLAHIR?.DESKRIPSI || '';
        const jkDesc = raw.REFERENSI?.JENISKELAMIN?.DESKRIPSI || '';
        const alamat = raw.ALAMAT || '';
        const rt = raw.RT ? raw.RT.padStart(3, '0') : '';
        const rw = raw.RW ? raw.RW.padStart(3, '0') : '';
        const wilayah = raw.WILAYAH || '';
        const wnCode = raw.KEWARGANEGARAAN || '';
        const phone = extractPhone(raw);

        // Identity fields (NIK Ibu NOT filled — not available in SIMGos response)
        if (nik) document.getElementById('b_nik_anak').value = nik;
        if (namaBayi) document.getElementById('b_nama_anak').value = namaBayi;
        if (tgl) document.getElementById('b_tgl').value = tgl;
        if (tempatLahir) document.getElementById('b_tempat').value = tempatLahir;
        setSelectByText(document.getElementById('b_jk'), jkDesc);
        if (wnCode === '71' || wnCode === '1') document.getElementById('b_wn').value = 'WNI';
        else if (wnCode === '2') document.getElementById('b_wn').value = 'WNA';

        // Address fields
        if (alamat) document.getElementById('b_alamat').value = alamat;
        if (rt) document.getElementById('b_rt').value = rt;
        if (rw) document.getElementById('b_rw').value = rw;
        if (phone) document.getElementById('b_phone_mobile').value = phone;

        // Wilayah — load cascade hierarchy, then set values from code
        if (wilayah) await autofillWilayah(wilayah, 'b_prov', 'b_kota', 'b_kec', 'b_desa');
    }

    // --- Helper: extract NIK from KARTUIDENTITAS ---
    function extractNik(raw) {
        if (!raw.KARTUIDENTITAS || !Array.isArray(raw.KARTUIDENTITAS)) return '';
        const kartu = raw.KARTUIDENTITAS.find(k => k.JENIS === '1');
        return kartu ? (kartu.NOMOR || '') : '';
    }

    // --- Helper: extract phone from KONTAK ---
    function extractPhone(raw) {
        if (!raw.KONTAK || !Array.isArray(raw.KONTAK)) return '';
        const kontak = raw.KONTAK.find(k => k.JENIS === '3');
        return kontak ? (kontak.NOMOR || '') : '';
    }

    // --- Main SIMGos search action handler ---
    if (btnSimgosSearchAction) {
        btnSimgosSearchAction.addEventListener('click', async () => {
            const norm = document.getElementById('simgos_norm').value.trim();
            const tglLahir = document.getElementById('simgos_tgl_lahir').value.trim();

            if (!norm || !tglLahir) {
                showToast('error', 'No. RM dan Tanggal Lahir wajib diisi.');
                return;
            }

            btnSimgosSearchAction.disabled = true;
            simgosSearchStatus.classList.remove('d-none');

            const formData = new URLSearchParams();
            formData.append('csrf_token', csrfToken);
            formData.append('norm', norm);
            formData.append('tgl_lahir', tglLahir);

            try {
                const response = await fetch('api/simgos_get_pasien.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const p = data.data;
                    const raw = p.raw || {};

                    // Show loading state in modal during autofill
                    simgosSearchStatus.innerHTML = `
                        <div class="text-center py-3">
                            <div class="spinner-border text-ss-primary mb-2" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <div class="fw-medium">Mohon ditunggu, sedang melakukan pengisian form otomatis...</div>
                        </div>
                    `;

                    if (simgosFormContext === 'umum') {
                        await autofillFormUmum(raw);
                    } else if (simgosFormContext === 'bayi') {
                        await autofillFormBayi(raw);
                    } else {
                        // Search tab: fill search form fields
                        if (p.nik) document.getElementById('s_nik').value = p.nik;
                        if (p.nama) document.getElementById('s_nama').value = p.nama;
                        if (p.tgl_lahir) document.getElementById('s_tgl').value = p.tgl_lahir;
                        if (p.jk) document.getElementById('s_jk').value = p.jk;
                    }

                    if (simgosSearchModalInstance) simgosSearchModalInstance.hide();
                    showToast('success', `Pasien "${p.nama}" berhasil ditemukan dan data telah diisi.`);

                    // For search context: auto-trigger SATUSEHAT search to get IHS number
                    if (simgosFormContext === 'search') {
                        setTimeout(() => {
                            const btnSearchAction = document.getElementById('btn-search-action');
                            if (btnSearchAction) btnSearchAction.click();
                        }, 600);
                    }
                } else {
                    showToast('error', data.error || 'Gagal mencari pasien dari SIMGos.');
                }
            } catch (error) {
                showToast('error', 'Terjadi kesalahan koneksi ke SIMGos.');
            } finally {
                btnSimgosSearchAction.disabled = false;
                simgosSearchStatus.classList.add('d-none');
                simgosSearchStatus.innerHTML = `
                    <div class="alert alert-light border text-center mb-0">
                        <div class="spinner-border spinner-border-sm text-ss-primary me-2" role="status"></div>
                        <span>Mencari pasien di SIMGos...</span>
                    </div>
                `;
            }
        });
    }

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
