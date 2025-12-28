let allQuestions = [];
let questionSettings = {};
let currentLang = 'en';
let translations = {};
let diseaseTranslations = {};
let editingQuestion = null;

// Load bilingual questions
async function loadQuestions() {
    try {
        const response = await fetch('nephro_questions_enhanced.json');
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

        // Build image HTML if image exists
        let imageHtml = '';
        if (q.image) {
            const imagePath = `Textbook_LT/${q.image}`;
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

function exportJSON() {
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
window.addEventListener('DOMContentLoaded', loadQuestions);
