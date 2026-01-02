let allQuestions = [];
let questionSettings = {};
let currentLang = 'en';
let translations = {};
let diseaseTranslations = {};
let editingQuestion = null;

// Auto-save variables
let jsonFolderHandle = null;
let autoSaveEnabled = false;
let originalData = null;

// IndexedDB for persisting folder handle
const DB_NAME = 'InstructorPortalDB';
const DB_VERSION = 1;
const STORE_NAME = 'folderHandles';
let db = null;

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

async function saveFolderHandle(handle) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(handle, 'jsonFolder');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function loadFolderHandle() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('jsonFolder');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function clearSavedHandle() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete('jsonFolder');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function selectJSONFolder() {
    try {
        if (!window.showDirectoryPicker) {
            alert('Your browser does not support the File System Access API.\n\nPlease use:\n- Chrome 86+ or Edge 86+\n\nOr continue using manual Export JSON button.');
            return;
        }

        const handle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });

        jsonFolderHandle = handle;
        await saveFolderHandle(handle);

        document.getElementById('folder-status').textContent = `📁 ${handle.name}`;
        document.getElementById('folder-status').style.color = '#48bb78';
        document.getElementById('auto-save-toggle').disabled = false;

        showToast('[OK] Folder selected! Enable auto-save toggle to start.');
    } catch (error) {
        if (error.name === 'AbortError') {
            showToast('[INFO] Folder selection cancelled');
        } else if (error.name === 'SecurityError' || error.message.includes('system files')) {
            alert('Cannot access this folder due to system restrictions.\n\nTry selecting a folder:\n- Outside your Git repository\n- In Documents or Desktop\n- Not containing .git or system files');
        } else {
            console.error('Folder selection error:', error);
            alert('Error selecting folder: ' + error.message);
        }
    }
}

function toggleAutoSave() {
    autoSaveEnabled = document.getElementById('auto-save-toggle').checked;

    if (autoSaveEnabled) {
        document.getElementById('auto-save-status').textContent = '✅ Auto-save ON';
        document.getElementById('auto-save-status').style.color = '#48bb78';
        showToast('[OK] Auto-save enabled! Changes will save automatically.');
    } else {
        document.getElementById('auto-save-status').textContent = '⭕ Auto-save OFF';
        document.getElementById('auto-save-status').style.color = '#999';
        showToast('[INFO] Auto-save disabled');
    }
}

async function autoSaveJSON() {
    if (!autoSaveEnabled || !jsonFolderHandle) {
        return;
    }

    try {
        // Check if we still have permission
        const permission = await jsonFolderHandle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
            const newPermission = await jsonFolderHandle.requestPermission({ mode: 'readwrite' });
            if (newPermission !== 'granted') {
                showToast('[ERROR] Permission denied');
                return;
            }
        }

        // Create complete JSON with updated questions AND settings
        const exportData = {
            metadata: {
                title: "Nephropathology Assessment - Bilingual (EN/LT)",
                languages: ["en", "lt"],
                total_questions: allQuestions.length,
                created: new Date().toISOString(),
                version: "3.6-persistent-settings",
                translation_method: "Google Translate with medical terminology preservation + manual editing"
            },
            interface_translations: translations,
            disease_translations: diseaseTranslations,
            question_settings: questionSettings,
            questions: allQuestions
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        // Save to backup file
        const backupFileName = 'nephro_questions_auto_updated.json';
        const backupHandle = await jsonFolderHandle.getFileHandle(backupFileName, { create: true });
        const backupWritable = await backupHandle.createWritable();
        await backupWritable.write(jsonString);
        await backupWritable.close();

        // Also save to main file so changes persist after refresh
        try {
            const mainFileName = 'nephro_questions_enhanced.json';
            const mainHandle = await jsonFolderHandle.getFileHandle(mainFileName, { create: true });
            const mainWritable = await mainHandle.createWritable();
            await mainWritable.write(jsonString);
            await mainWritable.close();
            showToast('[OK] Auto-saved (changes will persist after refresh)');
        } catch (mainError) {
            console.log('Could not save to main file:', mainError);
            showToast('[OK] Auto-saved to backup file only');
        }
    } catch (error) {
        console.error('Auto-save error:', error);
        showToast('[ERROR] Auto-save failed: ' + error.message);

        if (error.name === 'NotAllowedError') {
            autoSaveEnabled = false;
            document.getElementById('auto-save-toggle').checked = false;
            document.getElementById('auto-save-status').textContent = '⭕ Auto-save OFF';
            document.getElementById('auto-save-status').style.color = '#999';
            await clearSavedHandle();
            jsonFolderHandle = null;
            document.getElementById('folder-status').textContent = '📁 No folder selected';
            document.getElementById('folder-status').style.color = '#999';
            document.getElementById('auto-save-toggle').disabled = true;
        }
    }
}

function showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #333;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInUp 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

async function checkFolderAccess() {
    try {
        await initDB();
        const savedHandle = await loadFolderHandle();

        if (savedHandle) {
            const permission = await savedHandle.queryPermission({ mode: 'readwrite' });

            if (permission === 'granted') {
                jsonFolderHandle = savedHandle;
                document.getElementById('folder-status').textContent = `📁 ${savedHandle.name}`;
                document.getElementById('folder-status').style.color = '#48bb78';
                document.getElementById('auto-save-toggle').disabled = false;
                showToast('[OK] Restored saved folder');
            } else {
                await clearSavedHandle();
            }
        }
    } catch (error) {
        console.error('Error checking folder access:', error);
        await clearSavedHandle();
    }
}

// Load bilingual questions
async function loadQuestions() {
    try {
        const response = await fetch('nephro_questions_enhanced.json');
        const data = await response.json();

        // Store translations
        translations = data.interface_translations;
        diseaseTranslations = data.disease_translations;
        allQuestions = data.questions;

        // Load settings from JSON file first (if available), then fall back to localStorage
        if (data.question_settings) {
            // Settings from JSON file (most reliable)
            questionSettings = data.question_settings;
            console.log('✓ Loaded settings from JSON file');
        } else {
            // Fall back to localStorage
            const saved = localStorage.getItem('questionSettings');
            if (saved) {
                questionSettings = JSON.parse(saved);
                console.log('✓ Loaded settings from localStorage');
            } else {
                questionSettings = {};
            }
        }

        // Ensure all questions have settings with proper defaults
        allQuestions.forEach(q => {
            if (!questionSettings[q.id]) {
                // New question without settings - use defaults
                questionSettings[q.id] = { active: true, priority: 'none', modality: 'None' };
            } else {
                // Existing question - only fill in missing fields, don't overwrite
                if (questionSettings[q.id].active === undefined) questionSettings[q.id].active = true;
                if (!questionSettings[q.id].priority) questionSettings[q.id].priority = 'none';
                if (!questionSettings[q.id].modality) questionSettings[q.id].modality = 'None';
            }
        });

        // Save to localStorage as backup
        localStorage.setItem('questionSettings', JSON.stringify(questionSettings));

        populateDiseaseFilter();
        updateInterfaceLanguage();
        applyFilters();
        updateStats();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading questions. Make sure nephro_questions_enhanced.json is available.');
    }
}

function t(key) {
    return translations[currentLang][key] || key;
}

function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-lt').classList.toggle('active', lang === 'lt');
    updateInterfaceLanguage();
    renderQuestions(getFilteredQuestions());
}

function updateInterfaceLanguage() {
    document.getElementById('header-title').textContent = t('title');
    document.getElementById('header-subtitle').textContent = t('subtitle');
    document.getElementById('label-total').textContent = t('total_questions');
    document.getElementById('label-active').textContent = t('active_questions');
    document.getElementById('label-inactive').textContent = t('inactive_questions');
    document.getElementById('label-priority').textContent = t('high_priority');
    document.getElementById('bulk-actions-title').textContent = t('bulk_actions');
    document.getElementById('btn-activate-all').textContent = t('activate_all');
    document.getElementById('btn-deactivate-all').textContent = t('deactivate_all');
    document.getElementById('btn-activate-filtered').textContent = t('activate_filtered');
    document.getElementById('btn-deactivate-filtered').textContent = t('deactivate_filtered');
    document.getElementById('btn-reset').textContent = t('reset_all');
    document.getElementById('btn-export-json').textContent = 'Export JSON';
    document.getElementById('btn-export-excel').textContent = 'Export Excel';
    document.getElementById('btn-export-gift').textContent = 'Export Moodle GIFT';
    document.getElementById('btn-import').textContent = t('import_settings');
    document.getElementById('filters-title').textContent = t('filters');
    document.getElementById('label-disease').textContent = t('disease');
    document.getElementById('label-difficulty').textContent = t('difficulty');
    document.getElementById('label-status').textContent = t('status');
    document.getElementById('label-priority-filter').textContent = t('priority');
    document.getElementById('option-all-diseases').textContent = t('all_diseases');
    document.getElementById('option-all-levels').textContent = t('all_levels');
    document.getElementById('option-easy').textContent = t('easy');
    document.getElementById('option-medium').textContent = t('medium');
    document.getElementById('option-hard').textContent = t('hard');
    document.getElementById('option-all').textContent = t('all');
    document.getElementById('option-active').textContent = t('active_only');
    document.getElementById('option-inactive').textContent = t('inactive_only');
    document.getElementById('option-all-priorities').textContent = t('all_priorities');
    document.getElementById('option-high').textContent = t('high');
    document.getElementById('option-low').textContent = t('low');
    document.getElementById('option-none').textContent = t('none');
    document.getElementById('search-box').placeholder = t('search_questions');
    document.getElementById('question-bank-title').textContent = t('question_bank');

    populateDiseaseFilter();
}

function populateDiseaseFilter() {
    const select = document.getElementById('filter-disease');
    const currentValue = select.value;

    const options = '<option value="all">' + t('all_diseases') + '</option>' +
        Object.keys(diseaseTranslations).map(diseaseId => {
            const name = diseaseTranslations[diseaseId][currentLang];
            return '<option value="' + diseaseId + '">' + name + '</option>';
        }).join('');

    select.innerHTML = options;
    select.value = currentValue;
}

function getFilteredQuestions() {
    const diseaseFilter = document.getElementById('filter-disease').value;
    const difficultyFilter = document.getElementById('filter-difficulty').value;
    const statusFilter = document.getElementById('filter-status').value;
    const priorityFilter = document.getElementById('filter-priority').value;
    const modalityFilter = document.getElementById('filter-modality').value;
    const searchTerm = document.getElementById('search-box').value.toLowerCase();

    return allQuestions.filter(q => {
        const settings = questionSettings[q.id] || { active: true, priority: 'none', modality: 'None' };

        if (diseaseFilter !== 'all' && q.disease_id !== diseaseFilter) return false;
        if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
        if (statusFilter !== 'all' && ((statusFilter === 'active' && !settings.active) || (statusFilter === 'inactive' && settings.active))) return false;
        if (priorityFilter !== 'all' && settings.priority !== priorityFilter) return false;
        if (modalityFilter !== 'all' && settings.modality !== modalityFilter) return false;

        if (searchTerm) {
            const searchableText = (
                q.en.assertion + ' ' + q.en.reason + ' ' + q.en.explanation + ' ' +
                q.lt.assertion + ' ' + q.lt.reason + ' ' + q.lt.explanation
            ).toLowerCase();
            if (!searchableText.includes(searchTerm)) return false;
        }

        return true;
    });
}

function applyFilters() {
    const filtered = getFilteredQuestions();
    renderQuestions(filtered);
    updateAnswerStats(filtered);
}

function updateAnswerStats(filteredQuestions) {
    const answerCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    filteredQuestions.forEach(q => {
        const answer = q.en.answer.toUpperCase();
        if (answerCounts.hasOwnProperty(answer)) {
            answerCounts[answer]++;
        }
    });

    document.getElementById('stat-answer-a').textContent = answerCounts.A;
    document.getElementById('stat-answer-b').textContent = answerCounts.B;
    document.getElementById('stat-answer-c').textContent = answerCounts.C;
    document.getElementById('stat-answer-d').textContent = answerCounts.D;
    document.getElementById('stat-answer-e').textContent = answerCounts.E;
}

function renderQuestions(questions) {
    const container = document.getElementById('questions-list');

    if (questions.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No questions match the current filters.</p>';
        return;
    }

    container.innerHTML = questions.map((q, index) => {
        const settings = questionSettings[q.id] || { active: true, priority: 'none', modality: 'None' };
        const diseaseNameEN = diseaseTranslations[q.disease_id]?.en || q.disease_id;
        const diseaseNameLT = diseaseTranslations[q.disease_id]?.lt || q.disease_id;

        // Build image HTML if image exists
        let imageHtml = '';
        if (q.image) {
            // Image path is relative: question_images/question_69.jpg
            const imagePath = q.image;
            imageHtml = `
                <div class="question-image">
                    <img src="${imagePath}"
                         alt="Medical image"
                         onclick="openLightbox('${imagePath}', '#${q.id}: ${q.en.assertion}')"
                         onerror="this.parentElement.style.display='none'">
                    <div class="zoom-hint">🔍 Click to enlarge</div>
                </div>
            `;
        }

        return `<div class="question-card ${settings.active ? '' : 'inactive'}" id="q-${q.id}" data-editing="false">
            <div class="question-header">
                <div class="question-meta">
                    <span class="question-id">#${q.id}</span>
                    <span class="badge badge-${settings.active ? 'active' : 'inactive'}">
                        ${settings.active ? t('active') : t('inactive')}
                    </span>
                    <span class="badge badge-${q.difficulty}">
                        ${t(q.difficulty)}
                    </span>
                    ${settings.priority !== 'none' ? `<span class="badge badge-priority-${settings.priority}">
                        ★ ${settings.priority === 'high' ? t('high') : t('low')} ${t('priority')}
                    </span>` : ''}
                    <span class="badge" style="background:#9f7aea;color:white;">
                        🎯 ${settings.modality || 'None'}
                    </span>
                    ${q.image ? '<span class="badge" style="background:#e3f2fd;color:#1976d2;">📷 Image</span>' : ''}
                </div>
                <div class="question-actions">
                    <button class="btn btn-info btn-edit" onclick="toggleEdit(${q.id})">
                        Edit
                    </button>
                    <button class="btn ${settings.active ? 'btn-danger' : 'btn-success'}" onclick="toggleActive(${q.id})">
                        ${settings.active ? t('deactivate') : t('activate')}
                    </button>
                </div>
            </div>
            ${imageHtml}
            <div class="question-content">
                <div class="bilingual-content">
                    <div class="lang-column">
                        <h4>English</h4>
                        <div class="content-section">
                            <span class="content-label">${t('assertion')}:</span>
                            <div class="content-text">${q.en.assertion}</div>
                            <textarea class="edit-textarea" data-field="en.assertion">${q.en.assertion}</textarea>
                        </div>
                        <div class="content-section">
                            <span class="content-label">${t('reason')}:</span>
                            <div class="content-text">${q.en.reason}</div>
                            <textarea class="edit-textarea" data-field="en.reason">${q.en.reason}</textarea>
                        </div>
                        <div class="content-section">
                            <span class="content-label">${t('explanation')}:</span>
                            <div class="content-text">${q.en.explanation}</div>
                            <textarea class="edit-textarea" data-field="en.explanation">${q.en.explanation}</textarea>
                        </div>
                    </div>
                    <div class="lang-column">
                        <h4>Lietuvių</h4>
                        <div class="content-section">
                            <span class="content-label">${t('assertion')}:</span>
                            <div class="content-text">${q.lt.assertion}</div>
                            <textarea class="edit-textarea" data-field="lt.assertion">${q.lt.assertion}</textarea>
                        </div>
                        <div class="content-section">
                            <span class="content-label">${t('reason')}:</span>
                            <div class="content-text">${q.lt.reason}</div>
                            <textarea class="edit-textarea" data-field="lt.reason">${q.lt.reason}</textarea>
                        </div>
                        <div class="content-section">
                            <span class="content-label">${t('explanation')}:</span>
                            <div class="content-text">${q.lt.explanation}</div>
                            <textarea class="edit-textarea" data-field="lt.explanation">${q.lt.explanation}</textarea>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <span class="content-label">${t('answer')}:</span> <strong>${q.en.answer}</strong>
                </div>
            </div>
            <div class="priority-controls">
                <span style="font-weight:600; color:#555; margin-right:8px;">Priority:</span>
                <button class="btn btn-warning priority-btn" onclick="setPriority(${q.id}, 'high')">
                    ★ ${t('high')}
                </button>
                <button class="btn btn-success priority-btn" onclick="setPriority(${q.id}, 'low')">
                    ★ ${t('low')}
                </button>
                <button class="btn btn-danger priority-btn" onclick="setPriority(${q.id}, 'none')">
                    ✕ ${t('none')}
                </button>
                <div style="border-left:2px solid #e0e0e0; margin:0 10px;"></div>
                <span style="font-weight:600; color:#555; margin-right:8px;">Modality:</span>
                <button class="btn btn-danger priority-btn" onclick="setModality(${q.id}, 'None')">
                    ✕ None
                </button>
                <button class="btn priority-btn" style="background:#9f7aea;color:white;" onclick="setModality(${q.id}, 'Self')">
                    Self
                </button>
                <button class="btn priority-btn" style="background:#6366f1;color:white;" onclick="setModality(${q.id}, 'Test1')">
                    Test1
                </button>
                <button class="btn priority-btn" style="background:#8b5cf6;color:white;" onclick="setModality(${q.id}, 'Test2')">
                    Test2
                </button>
                <button class="btn priority-btn" style="background:#a855f7;color:white;" onclick="setModality(${q.id}, 'Test3')">
                    Test3
                </button>
                <div class="edit-buttons" style="display:none; margin-left:auto; gap:8px;">
                    <button class="btn btn-success" onclick="saveEdit(${q.id})">Save Changes</button>
                    <button class="btn btn-danger" onclick="cancelEdit(${q.id})">Cancel</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function toggleEdit(qId) {
    const card = document.getElementById('q-' + qId);
    const isEditing = card.getAttribute('data-editing') === 'true';

    if (isEditing) {
        cancelEdit(qId);
    } else {
        card.setAttribute('data-editing', 'true');
        card.classList.add('edit-mode');
        card.querySelector('.btn-edit').textContent = 'Cancel';
        const editButtons = card.querySelector('.edit-buttons');
        editButtons.style.display = 'flex';
        editingQuestion = qId;
    }
}

async function saveEdit(qId) {
    const card = document.getElementById('q-' + qId);
    const textareas = card.querySelectorAll('.edit-textarea');
    const question = allQuestions.find(q => q.id === qId);

    textareas.forEach(textarea => {
        const field = textarea.getAttribute('data-field');
        const parts = field.split('.');
        if (parts.length === 2) {
            question[parts[0]][parts[1]] = textarea.value;
        }
    });

    // Update display
    card.querySelectorAll('.content-text').forEach((div, index) => {
        div.textContent = textareas[index].value;
    });

    card.setAttribute('data-editing', 'false');
    card.classList.remove('edit-mode');
    card.querySelector('.btn-edit').textContent = 'Edit';
    card.querySelector('.edit-buttons').style.display = 'none';
    editingQuestion = null;

    // Auto-save if enabled
    await autoSaveJSON();

    if (!autoSaveEnabled) {
        alert('Changes saved in browser! Use "Export JSON" to save permanently.');
    }
}

function cancelEdit(qId) {
    const card = document.getElementById('q-' + qId);
    const question = allQuestions.find(q => q.id === qId);

    // Reset textareas to original values
    const textareas = card.querySelectorAll('.edit-textarea');
    textareas.forEach(textarea => {
        const field = textarea.getAttribute('data-field');
        const parts = field.split('.');
        if (parts.length === 2) {
            textarea.value = question[parts[0]][parts[1]];
        }
    });

    card.setAttribute('data-editing', 'false');
    card.classList.remove('edit-mode');
    card.querySelector('.btn-edit').textContent = 'Edit';
    card.querySelector('.edit-buttons').style.display = 'none';
    editingQuestion = null;
}

async function toggleActive(qId) {
    if (!questionSettings[qId]) {
        questionSettings[qId] = { active: true, priority: 'none', modality: 'None' };
    }
    questionSettings[qId].active = !questionSettings[qId].active;
    saveSettings();
    applyFilters();
    updateStats();
    await autoSaveJSON();
}

async function setPriority(qId, priority) {
    if (!questionSettings[qId]) {
        questionSettings[qId] = { active: true, priority: 'none', modality: 'None' };
    }
    questionSettings[qId].priority = priority;
    saveSettings();
    applyFilters();
    updateStats();
    await autoSaveJSON();
}

async function setModality(qId, modality) {
    if (!questionSettings[qId]) {
        questionSettings[qId] = { active: true, priority: 'none', modality: 'None' };
    }
    questionSettings[qId].modality = modality;
    saveSettings();
    applyFilters();
    updateStats();
    await autoSaveJSON();
}

async function activateAll() {
    allQuestions.forEach(q => {
        questionSettings[q.id] = { ...questionSettings[q.id], active: true };
    });
    saveSettings();
    applyFilters();
    updateStats();
    await autoSaveJSON();
}

async function deactivateAll() {
    allQuestions.forEach(q => {
        questionSettings[q.id] = { ...questionSettings[q.id], active: false };
    });
    saveSettings();
    applyFilters();
    updateStats();
    await autoSaveJSON();
}

async function activateFiltered() {
    const filtered = getFilteredQuestions();
    filtered.forEach(q => {
        questionSettings[q.id] = { ...questionSettings[q.id], active: true };
    });
    saveSettings();
    applyFilters();
    updateStats();
    await autoSaveJSON();
}

async function deactivateFiltered() {
    const filtered = getFilteredQuestions();
    filtered.forEach(q => {
        questionSettings[q.id] = { ...questionSettings[q.id], active: false };
    });
    saveSettings();
    applyFilters();
    updateStats();
    await autoSaveJSON();
}

async function resetAll() {
    if (confirm('Reset all settings to default? This cannot be undone.')) {
        allQuestions.forEach(q => {
            questionSettings[q.id] = { active: true, priority: 'none' };
        });
        saveSettings();
        applyFilters();
        updateStats();
        await autoSaveJSON();
    }
}

function exportJSON() {
    // Create complete JSON with updated questions AND settings
    const exportData = {
        metadata: {
            title: "Nephropathology Assessment - Bilingual (EN/LT)",
            languages: ["en", "lt"],
            total_questions: allQuestions.length,
            created: new Date().toISOString(),
            version: "3.6-persistent-settings",
            translation_method: "Google Translate with medical terminology preservation + manual editing"
        },
        interface_translations: translations,
        disease_translations: diseaseTranslations,
        question_settings: questionSettings,
        questions: allQuestions
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nephro_questions_bilingual_edited.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('JSON file exported with all edits! You can replace the original file with this one.');
}

function exportExcel() {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Prepare data for Excel
    const excelData = allQuestions.map(q => {
        const settings = questionSettings[q.id] || { active: true, priority: 'none' };
        const diseaseEN = diseaseTranslations[q.disease_id]?.en || q.disease_id;
        const diseaseLT = diseaseTranslations[q.disease_id]?.lt || q.disease_id;

        return {
            'ID': q.id,
            'Active': settings.active ? 'Yes' : 'No',
            'Priority': settings.priority,
            'Disease (EN)': diseaseEN,
            'Disease (LT)': diseaseLT,
            'Difficulty': q.difficulty,
            'Topic': q.topic,
            'Assertion (EN)': q.en.assertion,
            'Assertion (LT)': q.lt.assertion,
            'Reason (EN)': q.en.reason,
            'Reason (LT)': q.lt.reason,
            'Answer': q.en.answer,
            'Explanation (EN)': q.en.explanation,
            'Explanation (LT)': q.lt.explanation
        };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },   // ID
        { wch: 8 },   // Active
        { wch: 10 },  // Priority
        { wch: 30 },  // Disease EN
        { wch: 30 },  // Disease LT
        { wch: 10 },  // Difficulty
        { wch: 20 },  // Topic
        { wch: 60 },  // Assertion EN
        { wch: 60 },  // Assertion LT
        { wch: 60 },  // Reason EN
        { wch: 60 },  // Reason LT
        { wch: 8 },   // Answer
        { wch: 70 },  // Explanation EN
        { wch: 70 }   // Explanation LT
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Nephropathology Questions');

    // Generate Excel file
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `nephropathology_questions_${timestamp}.xlsx`);

    alert('Excel file exported successfully!');
}

function exportMoodleGIFT() {
    let giftText = '// Nephropathology Assessment - Moodle GIFT Format\n';
    giftText += '// Generated: ' + new Date().toISOString() + '\n';
    giftText += '// Total Questions: ' + allQuestions.length + '\n\n';

    // Filter to only active questions
    const activeQs = allQuestions.filter(q => {
        const settings = questionSettings[q.id];
        return !settings || settings.active !== false;
    });

    activeQs.forEach((q, index) => {
        const diseaseEN = diseaseTranslations[q.disease_id]?.en || q.disease_id;
        const diseaseLT = diseaseTranslations[q.disease_id]?.lt || q.disease_id;

        // Question title
        giftText += `// Question ${index + 1} - ${diseaseEN}\n`;
        giftText += `::Q${q.id} - ${diseaseEN}::\n`;

        // Question text (bilingual)
        giftText += `[html]<div class="nephro-question">\n`;
        giftText += `<p><strong>English:</strong></p>\n`;
        giftText += `<p><strong>Assertion:</strong> ${escapeGIFT(q.en.assertion)}</p>\n`;
        giftText += `<p><strong>Reason:</strong> ${escapeGIFT(q.en.reason)}</p>\n`;
        giftText += `<p><strong>Lietuvių:</strong></p>\n`;
        giftText += `<p><strong>Teiginys:</strong> ${escapeGIFT(q.lt.assertion)}</p>\n`;
        giftText += `<p><strong>Priežastis:</strong> ${escapeGIFT(q.lt.reason)}</p>\n`;
        giftText += `</div>\n`;

        // Multiple choice options
        giftText += `{\n`;

        const options = [
            { letter: 'A', text: 'Both assertion and reason are true, and the reason correctly explains the assertion' },
            { letter: 'B', text: 'Both assertion and reason are true, but the reason does NOT correctly explain the assertion' },
            { letter: 'C', text: 'Assertion is true, but the reason is false' },
            { letter: 'D', text: 'Assertion is false, but the reason is true' },
            { letter: 'E', text: 'Both assertion and reason are false' }
        ];

        options.forEach(option => {
            if (option.letter === q.en.answer) {
                giftText += `\t=A: ${escapeGIFT(option.text)}\n`;
            } else {
                giftText += `\t~A: ${escapeGIFT(option.text)}\n`;
            }
        });

        giftText += `}\n\n`;

        // Feedback/Explanation
        giftText += `// Explanation (EN): ${escapeGIFT(q.en.explanation)}\n`;
        giftText += `// Explanation (LT): ${escapeGIFT(q.lt.explanation)}\n`;
        giftText += `\n`;
    });

    // Create and download file
    const blob = new Blob([giftText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `nephropathology_moodle_${timestamp}.gift`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Moodle GIFT file exported! ${activeQs.length} active questions included.`);
}

function escapeGIFT(text) {
    // Escape special GIFT characters
    return text
        .replace(/\\/g, '\\\\')
        .replace(/~/g, '\\~')
        .replace(/=/g, '\\=')
        .replace(/#/g, '\\#')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/:/g, '\\:');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            allQuestions = data.questions;
            translations = data.interface_translations;
            diseaseTranslations = data.disease_translations;

            populateDiseaseFilter();
            applyFilters();
            updateStats();
            alert('Data imported successfully!');
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function updateStats() {
    const total = allQuestions.length;
    const active = allQuestions.filter(q => questionSettings[q.id]?.active !== false).length;
    const inactive = total - active;
    const highPriority = allQuestions.filter(q => questionSettings[q.id]?.priority === 'high').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-inactive').textContent = inactive;
    document.getElementById('stat-priority').textContent = highPriority;
}

function saveSettings() {
    localStorage.setItem('questionSettings', JSON.stringify(questionSettings));
}

// Lightbox functions for image zoom
function openLightbox(imageSrc, caption) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');

    lightboxImage.src = imageSrc;
    lightboxImage.alt = caption;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('active');

    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';
}

// Close lightbox with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Load on page load
window.addEventListener('DOMContentLoaded', async () => {
    await loadQuestions();
    await checkFolderAccess();
});
