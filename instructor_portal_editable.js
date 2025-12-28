let allQuestions = [];
let questionSettings = {};
let currentLang = 'en';
let translations = {};
let diseaseTranslations = {};
let editingQuestion = null;

// Load bilingual questions
async function loadQuestions() {
    try {
        const response = await fetch('nephro_questions_bilingual.json');
        const data = await response.json();

        // Store translations
        translations = data.interface_translations;
        diseaseTranslations = data.disease_translations;
        allQuestions = data.questions;

        // Load settings from localStorage
        const saved = localStorage.getItem('questionSettings');
        if (saved) {
            questionSettings = JSON.parse(saved);
        } else {
            allQuestions.forEach(q => {
                questionSettings[q.id] = {
                    active: true,
                    priority: 'none'
                };
            });
        }

        populateDiseaseFilter();
        updateInterfaceLanguage();
        applyFilters();
        updateStats();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading questions. Make sure nephro_questions_bilingual.json is available.');
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
    document.getElementById('btn-export').textContent = t('export_settings');
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
    const searchTerm = document.getElementById('search-box').value.toLowerCase();

    return allQuestions.filter(q => {
        const settings = questionSettings[q.id] || { active: true, priority: 'none' };

        if (diseaseFilter !== 'all' && q.disease_id !== diseaseFilter) return false;
        if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
        if (statusFilter !== 'all' && ((statusFilter === 'active' && !settings.active) || (statusFilter === 'inactive' && settings.active))) return false;
        if (priorityFilter !== 'all' && settings.priority !== priorityFilter) return false;

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
}

function renderQuestions(questions) {
    const container = document.getElementById('questions-list');

    if (questions.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No questions match the current filters.</p>';
        return;
    }

    container.innerHTML = questions.map((q, index) => {
        const settings = questionSettings[q.id] || { active: true, priority: 'none' };
        const diseaseNameEN = diseaseTranslations[q.disease_id]?.en || q.disease_id;
        const diseaseNameLT = diseaseTranslations[q.disease_id]?.lt || q.disease_id;

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
                <button class="btn btn-warning priority-btn" onclick="setPriority(${q.id}, 'high')">
                    ★ ${t('high')}
                </button>
                <button class="btn btn-success priority-btn" onclick="setPriority(${q.id}, 'low')">
                    ★ ${t('low')}
                </button>
                <button class="btn btn-danger priority-btn" onclick="setPriority(${q.id}, 'none')">
                    ✕ ${t('none')}
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

function saveEdit(qId) {
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

    alert('Changes saved! Use "Export JSON" to save permanently.');
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

function toggleActive(qId) {
    if (!questionSettings[qId]) {
        questionSettings[qId] = { active: true, priority: 'none' };
    }
    questionSettings[qId].active = !questionSettings[qId].active;
    saveSettings();
    applyFilters();
    updateStats();
}

function setPriority(qId, priority) {
    if (!questionSettings[qId]) {
        questionSettings[qId] = { active: true, priority: 'none' };
    }
    questionSettings[qId].priority = priority;
    saveSettings();
    applyFilters();
    updateStats();
}

function activateAll() {
    allQuestions.forEach(q => {
        questionSettings[q.id] = { ...questionSettings[q.id], active: true };
    });
    saveSettings();
    applyFilters();
    updateStats();
}

function deactivateAll() {
    allQuestions.forEach(q => {
        questionSettings[q.id] = { ...questionSettings[q.id], active: false };
    });
    saveSettings();
    applyFilters();
    updateStats();
}

function activateFiltered() {
    const filtered = getFilteredQuestions();
    filtered.forEach(q => {
        questionSettings[q.id] = { ...questionSettings[q.id], active: true };
    });
    saveSettings();
    applyFilters();
    updateStats();
}

function deactivateFiltered() {
    const filtered = getFilteredQuestions();
    filtered.forEach(q => {
        questionSettings[q.id] = { ...questionSettings[q.id], active: false };
    });
    saveSettings();
    applyFilters();
    updateStats();
}

function resetAll() {
    if (confirm('Reset all settings to default? This cannot be undone.')) {
        allQuestions.forEach(q => {
            questionSettings[q.id] = { active: true, priority: 'none' };
        });
        saveSettings();
        applyFilters();
        updateStats();
    }
}

function exportData() {
    // Create complete JSON with updated questions
    const exportData = {
        metadata: {
            title: "Nephropathology Assessment - Bilingual (EN/LT)",
            languages: ["en", "lt"],
            total_questions: allQuestions.length,
            created: new Date().toISOString(),
            version: "3.4-editable-bilingual",
            translation_method: "Google Translate with medical terminology preservation + manual editing"
        },
        interface_translations: translations,
        disease_translations: diseaseTranslations,
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

// Load on page load
window.addEventListener('DOMContentLoaded', loadQuestions);
