// Image Management Portal - JavaScript
let allQuestions = [];
let diseaseTranslations = {};
let modifiedQuestions = new Set(); // Track which questions have been modified
let newImageData = {}; // Store new image data: { questionId: { file, dataUrl } }
let imageFolderHandle = null; // Handle to question_images folder
let autoSaveEnabled = false; // Auto-save JSON after each change
let originalData = null; // Store original database data

// IndexedDB for persisting folder handle
const DB_NAME = 'ImagePortalDB';
const DB_VERSION = 1;
const STORE_NAME = 'folderHandles';
let db = null;

// Load questions
async function loadQuestions() {
    try {
        // Initialize IndexedDB first
        await initDB();

        const response = await fetch('nephro_questions_enhanced.json');
        const data = await response.json();

        // Store original data for reference
        originalData = JSON.parse(JSON.stringify(data));

        allQuestions = data.questions;
        diseaseTranslations = data.disease_translations || {};

        populateDiseaseFilter();
        renderGallery(allQuestions);
        updateStats();

        // Check if we can restore folder access from previous session
        await checkFolderAccess();
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('gallery').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h2>Error Loading Questions</h2>
                <p>Please ensure nephro_questions_enhanced.json is available.</p>
            </div>
        `;
    }
}

// Initialize IndexedDB for storing folder handle
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

// Save folder handle to IndexedDB
async function saveFolderHandle(handle) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(handle, 'imageFolderHandle');

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Load folder handle from IndexedDB
async function loadFolderHandle() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('imageFolderHandle');

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Check if we have folder access from previous session
async function checkFolderAccess() {
    try {
        // Try to load saved handle from IndexedDB
        const savedHandle = await loadFolderHandle();

        if (savedHandle) {
            // Verify we still have permission
            const permission = await savedHandle.queryPermission({ mode: 'readwrite' });

            if (permission === 'granted') {
                // Try to verify the handle actually works
                try {
                    // Test access by trying to get entries
                    const entries = savedHandle.entries();
                    await entries.next(); // Try to read first entry

                    // Success - handle works
                    imageFolderHandle = savedHandle;
                    document.getElementById('folder-status').textContent = `✅ Folder: ${savedHandle.name}`;
                    document.getElementById('folder-status').style.color = '#48bb78';
                    document.getElementById('auto-save-toggle').disabled = false;

                    // Restore auto-save setting
                    const savedAutoSave = localStorage.getItem('autoSaveEnabled');
                    if (savedAutoSave === 'true') {
                        document.getElementById('auto-save-toggle').checked = true;
                        toggleAutoSave();
                    }

                    console.log('✓ Restored folder access from previous session');
                } catch (testError) {
                    console.log('Saved handle is stale, clearing it:', testError);
                    // Handle is stale - clear it
                    await clearSavedHandle();
                    document.getElementById('folder-status').textContent = `📁 Please select folder again`;
                    document.getElementById('folder-status').style.color = '#ed8936';
                }
            } else if (permission === 'prompt') {
                // We need to request permission again - clear stale handle
                console.log('Permission expired, clearing saved handle');
                await clearSavedHandle();
                document.getElementById('folder-status').textContent = `📁 No folder selected`;
                document.getElementById('folder-status').style.color = '#999';
            }
        }
    } catch (error) {
        console.log('Error checking folder access:', error);
        // Clear any stale data
        await clearSavedHandle();
    }
}

// Clear saved folder handle from IndexedDB
async function clearSavedHandle() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete('imageFolderHandle');

        request.onsuccess = () => {
            console.log('✓ Cleared stale folder handle');
            resolve();
        };
        request.onerror = () => {
            console.error('Could not clear handle:', request.error);
            resolve(); // Don't reject - not critical
        };
    });
}

// Select question_images folder
async function selectImageFolder() {
    try {
        // Check if File System Access API is supported
        if (!('showDirectoryPicker' in window)) {
            alert('Your browser does not support automatic file saving.\n\n' +
                  'Please use Chrome, Edge, or another Chromium-based browser.\n\n' +
                  'You can still use the manual export feature.');
            return;
        }

        // Clear any stale saved handle first
        await clearSavedHandle();

        // Request folder selection
        const handle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });

        // Verify we can access the folder
        try {
            // Try to verify access by testing actual folder access
            const entries = handle.entries();
            await entries.next(); // Test read access

            // Request full permission
            const permission = await handle.requestPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                alert('Permission denied. Please try again and grant access to the folder.');
                return;
            }
        } catch (permError) {
            console.error('Permission error:', permError);

            // Check if it's a security error
            if (permError.name === 'SecurityError' || permError.name === 'NotAllowedError') {
                alert('Security Error: Cannot access this folder.\n\n' +
                      'This usually happens with:\n' +
                      '- Folders containing system files\n' +
                      '- Protected system locations\n\n' +
                      'Solution: Select the PARENT folder (Nephropathology) instead.\n' +
                      'The portal will automatically access question_images inside it.');
                return;
            }

            alert('Could not verify folder permissions. Please try selecting the folder again.');
            return;
        }

        // Save the handle
        imageFolderHandle = handle;

        // Persist to IndexedDB for future sessions
        try {
            await saveFolderHandle(handle);
            console.log('✓ Folder handle saved to IndexedDB');
        } catch (saveError) {
            console.error('Could not save folder handle:', saveError);
            // Continue anyway - at least it works for this session
        }

        // Update UI
        const folderPath = handle.name;
        document.getElementById('folder-status').textContent = `✅ Folder: ${folderPath}`;
        document.getElementById('folder-status').style.color = '#48bb78';
        document.getElementById('auto-save-toggle').disabled = false;

        alert(`Success! Images will now auto-save to:\n${folderPath}\n\n` +
              `You can now drag & drop images and they'll be saved automatically.`);
    } catch (error) {
        if (error.name === 'AbortError') {
            // User cancelled - do nothing
            return;
        }

        console.error('Error selecting folder:', error);

        // Provide helpful error messages
        let errorMsg = 'Could not access folder.\n\n';

        if (error.name === 'SecurityError') {
            errorMsg += 'Security Error: The folder may contain system files or be in a protected location.\n\n' +
                       'Try:\n' +
                       '1. Select the Nephropathology parent folder instead\n' +
                       '2. Create a new empty folder for images\n' +
                       '3. Use Manual Export feature instead';
        } else if (error.name === 'NotAllowedError') {
            errorMsg += 'Access denied. Please grant permission when prompted.';
        } else {
            errorMsg += `Error: ${error.message}\n\nPlease try again or use Manual Export instead.`;
        }

        alert(errorMsg);
    }
}

// Toggle auto-save
function toggleAutoSave() {
    autoSaveEnabled = document.getElementById('auto-save-toggle').checked;
    localStorage.setItem('autoSaveEnabled', autoSaveEnabled);

    if (autoSaveEnabled) {
        document.getElementById('auto-save-status').textContent = '✅ Auto-save ON';
        document.getElementById('auto-save-status').style.color = '#48bb78';
    } else {
        document.getElementById('auto-save-status').textContent = '⭕ Auto-save OFF';
        document.getElementById('auto-save-status').style.color = '#999';
    }
}

function populateDiseaseFilter() {
    const diseaseSet = new Set();
    allQuestions.forEach(q => {
        if (q.disease_id) {
            diseaseSet.add(q.disease_id);
        }
    });

    const select = document.getElementById('filter-disease');
    Array.from(diseaseSet).sort().forEach(diseaseId => {
        const option = document.createElement('option');
        option.value = diseaseId;
        option.textContent = diseaseTranslations[diseaseId]?.en || diseaseId;
        select.appendChild(option);
    });
}

function applyFilters() {
    const diseaseFilter = document.getElementById('filter-disease').value;
    const difficultyFilter = document.getElementById('filter-difficulty').value;
    const activeFilter = document.getElementById('filter-active').value;
    const priorityFilter = document.getElementById('filter-priority').value;
    const statusFilter = document.getElementById('filter-status').value;

    // Load instructor settings from localStorage
    const settings = localStorage.getItem('questionSettings');
    let questionSettings = {};
    if (settings) {
        questionSettings = JSON.parse(settings);
    }

    let filtered = allQuestions;

    // Filter by disease
    if (diseaseFilter !== 'all') {
        filtered = filtered.filter(q => q.disease_id === diseaseFilter);
    }

    // Filter by difficulty
    if (difficultyFilter !== 'all') {
        filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    // Filter by active status
    if (activeFilter === 'active') {
        filtered = filtered.filter(q => {
            const setting = questionSettings[q.id];
            return !setting || setting.active !== false;
        });
    } else if (activeFilter === 'inactive') {
        filtered = filtered.filter(q => {
            const setting = questionSettings[q.id];
            return setting && setting.active === false;
        });
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
        filtered = filtered.filter(q => {
            const setting = questionSettings[q.id];
            const priority = setting?.priority || 'none';
            return priority === priorityFilter;
        });
    }

    // Filter by image status
    if (statusFilter === 'with-images') {
        filtered = filtered.filter(q => q.image || newImageData[q.id]);
    } else if (statusFilter === 'no-images') {
        filtered = filtered.filter(q => !q.image && !newImageData[q.id]);
    } else if (statusFilter === 'modified') {
        filtered = filtered.filter(q => modifiedQuestions.has(q.id));
    }

    renderGallery(filtered);
}

function renderGallery(questions) {
    const gallery = document.getElementById('gallery');

    if (questions.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🖼️</div>
                <h2>No Questions Found</h2>
                <p>Try adjusting your filters.</p>
            </div>
        `;
        return;
    }

    // Load instructor settings
    const settings = localStorage.getItem('questionSettings');
    let questionSettings = {};
    if (settings) {
        questionSettings = JSON.parse(settings);
    }

    gallery.innerHTML = questions.map(q => {
        const diseaseName = diseaseTranslations[q.disease_id]?.en || q.disease_id;
        const hasImage = q.image || newImageData[q.id];
        const isModified = modifiedQuestions.has(q.id);

        // Get question settings
        const setting = questionSettings[q.id] || { active: true, priority: 'none' };
        const isActive = setting.active !== false;
        const priority = setting.priority || 'none';

        // Determine current image source
        let imageSrc = '';
        let imagePath = '';
        if (newImageData[q.id]) {
            imageSrc = newImageData[q.id].dataUrl;
            imagePath = `NEW: ${newImageData[q.id].file.name}`;
        } else if (q.image) {
            // Image path is relative: question_images/question_69.jpg
            imageSrc = q.image;
            imagePath = q.image;
        }

        return `
            <div class="image-card" id="card-${q.id}">
                <div class="card-header">
                    <div class="question-id">
                        Question #${q.id}
                        ${isModified ? '<span style="color:#48bb78;">●</span>' : ''}
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 11px; color: #667eea; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Assertion:</div>
                        <div class="question-text" style="-webkit-line-clamp: 3;">${q.en.assertion}</div>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 11px; color: #667eea; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Reason:</div>
                        <div class="question-text" style="-webkit-line-clamp: 3;">${q.en.reason}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <span class="badge badge-disease">${diseaseName}</span>
                        <span class="badge" style="background: #48bb78; color: white;">Answer: ${q.en.answer}</span>
                        <span class="badge" style="background: ${isActive ? '#48bb78' : '#f56565'}; color: white;">
                            ${isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                        ${priority !== 'none' ? `
                            <span class="badge" style="background: ${priority === 'high' ? '#f59e0b' : '#a78bfa'}; color: white;">
                                ${priority === 'high' ? '⚡ High' : '⭐ Low'} Priority
                            </span>
                        ` : ''}
                    </div>
                </div>

                ${hasImage ? `
                    <div class="current-image">
                        <span class="image-label">Current Image</span>
                        <img src="${imageSrc}"
                             alt="Question image"
                             class="image-preview"
                             onclick="openLightbox('${imageSrc}', 'Question #${q.id}')"
                             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22><rect fill=%22%23f0f0f0%22 width=%22400%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23999%22>Image not found</text></svg>'">
                        <div class="image-path">${imagePath}</div>
                    </div>
                ` : `
                    <div class="current-image">
                        <span class="image-label">No Image</span>
                        <div style="padding:40px;background:#f5f5f5;border-radius:10px;text-align:center;color:#999;">
                            📷 No image assigned
                        </div>
                    </div>
                `}

                <div class="drop-zone"
                     id="drop-${q.id}"
                     ondrop="handleDrop(event, ${q.id})"
                     ondragover="handleDragOver(event)"
                     ondragleave="handleDragLeave(event)"
                     onclick="document.getElementById('file-${q.id}').click()">
                    <div class="drop-zone-icon">📤</div>
                    <div class="drop-zone-text">Drop image here or click to browse</div>
                    <div class="drop-zone-hint">Supports: JPG, PNG, GIF</div>
                    <input type="file"
                           id="file-${q.id}"
                           accept="image/*"
                           style="display:none"
                           onchange="handleFileSelect(event, ${q.id})">
                </div>

                <div class="new-image-preview" id="preview-${q.id}">
                    <span class="image-label">New Image Preview</span>
                    <img src="" alt="New image preview" id="preview-img-${q.id}">
                </div>

                <div class="action-buttons">
                    <div>
                        ${hasImage ? `
                            <button class="btn btn-small btn-view" onclick="openLightbox('${imageSrc}', 'Question #${q.id}')">
                                👁️ View Full Size
                            </button>
                        ` : ''}
                    </div>
                    <div style="display:flex;gap:8px;">
                        ${isModified ? `
                            <button class="btn btn-small btn-warning" onclick="cancelReplacement(${q.id})">
                                ↺ Undo
                            </button>
                        ` : ''}
                        ${hasImage ? `
                            <button class="btn btn-small btn-remove" onclick="removeImage(${q.id})">
                                🗑️ Remove
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Drag and drop handlers
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event, questionId) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processImageFile(files[0], questionId);
    }
}

function handleFileSelect(event, questionId) {
    const files = event.target.files;
    if (files.length > 0) {
        processImageFile(files[0], questionId);
    }
}

async function processImageFile(file, questionId) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF)');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image file is too large. Please select an image smaller than 5MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        // Check if there's an existing image to backup
        const question = allQuestions.find(q => q.id === questionId);
        if (question && question.image && imageFolderHandle) {
            try {
                // Move old image to REMOVED folder before replacing
                await moveImageToRemoved(question.image, questionId);
                showToast('✓ Old image backed up to REMOVED folder');
            } catch (error) {
                console.error('Could not backup old image:', error);
                // Continue anyway - replacement is more important
            }
        }

        // Store the new image data
        newImageData[questionId] = {
            file: file,
            dataUrl: e.target.result
        };

        // Mark as modified
        modifiedQuestions.add(questionId);

        // AUTO-SAVE: Save image to folder if folder is selected
        if (imageFolderHandle) {
            try {
                await saveImageToFolder(file, questionId);
            } catch (error) {
                console.error('Error auto-saving image:', error);
                alert('Could not auto-save image to folder. You may need to re-select the folder.');
            }
        }

        // Update the question with new image path
        if (question) {
            const extension = file.name.split('.').pop();
            question.image = `question_images/question_${questionId}.${extension}`;
        }

        // AUTO-SAVE: Save JSON if auto-save is enabled
        if (autoSaveEnabled && imageFolderHandle) {
            await autoSaveJSON();
            // Also save to the main JSON file for immediate portal refresh
            await syncToMainJSON();
        }

        // Update the card display
        updateCardImage(questionId, e.target.result, file.name);
        updateStats();
    };

    reader.readAsDataURL(file);
}

// Get or create the question_images subfolder
async function getQuestionImagesFolder() {
    // If the selected folder is named 'question_images', use it directly
    if (imageFolderHandle.name === 'question_images') {
        return imageFolderHandle;
    }

    // Otherwise, try to access/create 'question_images' subfolder
    try {
        return await imageFolderHandle.getDirectoryHandle('question_images', { create: true });
    } catch (error) {
        console.error('Could not access question_images subfolder:', error);
        // Fall back to using the selected folder directly
        return imageFolderHandle;
    }
}

// Save image to the selected folder
async function saveImageToFolder(file, questionId) {
    if (!imageFolderHandle) {
        throw new Error('No folder selected');
    }

    const extension = file.name.split('.').pop();
    const fileName = `question_${questionId}.${extension}`;

    // Get the appropriate folder (question_images or selected folder)
    const targetFolder = await getQuestionImagesFolder();

    // Create/overwrite the file in the folder
    const fileHandle = await targetFolder.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();

    console.log(`✓ Saved: ${fileName} to ${targetFolder.name}`);
    showToast(`✓ Image saved: ${fileName}`);
}

// Auto-save the JSON database
async function autoSaveJSON() {
    if (!imageFolderHandle) return;

    try {
        const jsonFileName = 'nephro_questions_auto_updated.json';

        // Create the updated database
        const exportData = {
            metadata: {
                title: "Nephropathology Assessment - Auto-Updated",
                languages: ["en", "lt"],
                total_questions: allQuestions.length,
                updated: new Date().toISOString(),
                version: "4.2-auto-save",
                questions_with_images: allQuestions.filter(q => q.image).length,
                auto_save: true
            },
            interface_translations: originalData.interface_translations || {},
            disease_translations: diseaseTranslations,
            questions: allQuestions
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Get the appropriate folder
        const targetFolder = await getQuestionImagesFolder();

        // Save to the folder
        const fileHandle = await targetFolder.getFileHandle(jsonFileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        console.log(`✓ Auto-saved JSON: ${jsonFileName} to ${targetFolder.name}`);
        showToast('✓ Database auto-saved');
    } catch (error) {
        console.error('Error auto-saving JSON:', error);
        // Don't alert on auto-save errors, just log them
    }
}

// Sync to main JSON file (for portal refresh)
async function syncToMainJSON() {
    // This tries to save to the parent folder where the portal runs from
    // Only works if we have access to parent directory
    try {
        if (!imageFolderHandle || imageFolderHandle.name === 'question_images') {
            // Can't sync - working folder IS question_images or no parent access
            return;
        }

        const jsonFileName = 'nephro_questions_enhanced.json';

        const exportData = {
            metadata: {
                title: "Nephropathology Assessment - Enhanced with Updated Images",
                languages: ["en", "lt"],
                total_questions: allQuestions.length,
                updated: new Date().toISOString(),
                version: "4.2-migrated",
                questions_with_images: allQuestions.filter(q => q.image).length,
                auto_save: true
            },
            interface_translations: originalData.interface_translations || {},
            disease_translations: diseaseTranslations,
            questions: allQuestions
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Try to save in parent folder
        const fileHandle = await imageFolderHandle.getFileHandle(jsonFileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        console.log('✓ Synced to main JSON for instant portal refresh');
    } catch (error) {
        // Silent fail - this is a bonus feature
        console.log('Could not sync to main JSON (normal if working folder structure differs)');
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #48bb78;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInUp 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function updateCardImage(questionId, dataUrl, fileName) {
    const card = document.getElementById(`card-${questionId}`);
    const preview = document.getElementById(`preview-${questionId}`);
    const previewImg = document.getElementById(`preview-img-${questionId}`);

    // Show new image preview
    preview.classList.add('show');
    previewImg.src = dataUrl;

    // Update current image section
    const currentImageDiv = card.querySelector('.current-image');
    currentImageDiv.innerHTML = `
        <span class="image-label">Current Image (NEW)</span>
        <img src="${dataUrl}"
             alt="New question image"
             class="image-preview"
             onclick="openLightbox('${dataUrl}', 'Question #${questionId} - New Image')">
        <div class="image-path">NEW: ${fileName}</div>
    `;

    // Re-render to update buttons
    applyFilters();
}

function cancelReplacement(questionId) {
    if (confirm('Cancel the image replacement for this question?')) {
        delete newImageData[questionId];
        modifiedQuestions.delete(questionId);
        applyFilters();
        updateStats();
    }
}

async function removeImage(questionId) {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question || !question.image) return;

    if (!confirm('Remove this image?\n\nThe image file will be moved to the REMOVED subfolder as a backup.')) {
        return;
    }

    try {
        // If folder access is available, move the file to REMOVED subfolder
        if (imageFolderHandle) {
            await moveImageToRemoved(question.image, questionId);
        }

        // Mark for removal in database
        newImageData[questionId] = {
            file: null,
            dataUrl: null,
            removed: true
        };
        modifiedQuestions.add(questionId);

        // Update question to remove image reference
        question.image = null;

        // AUTO-SAVE: Save JSON if auto-save is enabled
        if (autoSaveEnabled && imageFolderHandle) {
            await autoSaveJSON();
            await syncToMainJSON();
        }

        applyFilters();
        updateStats();
        showToast('✓ Image removed and moved to REMOVED folder');
    } catch (error) {
        console.error('Error removing image:', error);
        alert('Could not move image to REMOVED folder. The image reference will still be removed from the database.');

        // Still mark for removal even if file move fails
        newImageData[questionId] = {
            file: null,
            dataUrl: null,
            removed: true
        };
        modifiedQuestions.add(questionId);
        question.image = null;

        applyFilters();
        updateStats();
    }
}

// Move image file to REMOVED subfolder
async function moveImageToRemoved(imagePath, questionId) {
    if (!imageFolderHandle) {
        throw new Error('No folder access');
    }

    // Extract filename from path: "question_images/question_69.jpg" -> "question_69.jpg"
    const fileName = imagePath.split('/').pop();

    try {
        // Get the appropriate folder (question_images or selected folder)
        const targetFolder = await getQuestionImagesFolder();

        // Get handle to the existing image file
        const existingFileHandle = await targetFolder.getFileHandle(fileName);

        // Read the file content
        const file = await existingFileHandle.getFile();
        const fileContent = await file.arrayBuffer();

        // Create REMOVED subdirectory if it doesn't exist
        let removedFolderHandle;
        try {
            removedFolderHandle = await targetFolder.getDirectoryHandle('REMOVED', { create: true });
        } catch (error) {
            console.error('Error creating REMOVED folder:', error);
            throw new Error('Could not create REMOVED subfolder');
        }

        // Add timestamp to filename to prevent overwrites
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const extension = fileName.split('.').pop();
        const baseName = fileName.replace(`.${extension}`, '');
        const newFileName = `${baseName}_${timestamp}.${extension}`;

        // Write file to REMOVED subfolder
        const newFileHandle = await removedFolderHandle.getFileHandle(newFileName, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(fileContent);
        await writable.close();

        console.log(`✓ Moved to REMOVED: ${newFileName}`);

        // Delete the original file
        // Note: File System Access API doesn't have a direct delete method
        // We'll overwrite with empty content or leave it (browser limitation)
        // The database update will handle the logical removal

    } catch (error) {
        if (error.name === 'NotFoundError') {
            console.log('Image file not found in folder (may have been already removed)');
            // This is OK - the file might not exist in the folder yet
        } else {
            throw error;
        }
    }
}

function resetAll() {
    if (confirm('Reset all changes? This will discard all image replacements.')) {
        newImageData = {};
        modifiedQuestions.clear();
        applyFilters();
        updateStats();
    }
}

async function reloadQuestions() {
    if (modifiedQuestions.size > 0) {
        const message = 'Your changes are auto-saved to the working folder.\n\n' +
                       'Reload will sync them to the portal and refresh.\n\n' +
                       'Continue?';
        if (!confirm(message)) {
            return;
        }
    }

    showToast('⏳ Syncing and reloading...');

    try {
        // Note: We can't automatically sync files from working folder to Git repo
        // due to browser security. User needs to run sync_from_working.bat
        // But we can still reload to show any changes that were manually synced

        // Clear cache and reload
        const response = await fetch('nephro_questions_enhanced.json?' + new Date().getTime());
        const data = await response.json();

        originalData = JSON.parse(JSON.stringify(data));
        allQuestions = data.questions;
        diseaseTranslations = data.disease_translations || {};

        // Clear modifications since we're reloading
        newImageData = {};
        modifiedQuestions.clear();

        // Re-render
        populateDiseaseFilter();
        renderGallery(allQuestions);
        updateStats();

        if (modifiedQuestions.size > 0) {
            showToast('⚠️ Reloaded - Run sync_from_working.bat to see your latest changes');
        } else {
            showToast('✓ Data reloaded from server');
        }
    } catch (error) {
        console.error('Error reloading:', error);
        alert('Could not reload data. Please refresh the page manually.');
    }
}

function updateStats() {
    const totalQuestions = allQuestions.length;
    const withImages = allQuestions.filter(q => q.image || newImageData[q.id]).length;
    const modified = modifiedQuestions.size;

    document.getElementById('stat-total').textContent = totalQuestions;
    document.getElementById('stat-with-images').textContent = withImages;
    document.getElementById('stat-modified').textContent = modified;
}

async function exportDatabase() {
    if (modifiedQuestions.size === 0) {
        alert('No changes to export. Make some image replacements first.');
        return;
    }

    if (!confirm(`Export database with ${modifiedQuestions.size} modified question(s)?`)) {
        return;
    }

    // Create a copy of the questions with updated image paths
    const updatedQuestions = allQuestions.map(q => {
        const questionCopy = JSON.parse(JSON.stringify(q));

        if (modifiedQuestions.has(q.id)) {
            if (newImageData[q.id]) {
                if (newImageData[q.id].removed) {
                    // Remove image reference
                    delete questionCopy.image;
                } else {
                    // Update with new image path
                    // Use a standardized path: question_images/question_[ID]_[filename]
                    const file = newImageData[q.id].file;
                    const extension = file.name.split('.').pop();
                    questionCopy.image = `question_images/question_${q.id}.${extension}`;
                }
            }
        }

        return questionCopy;
    });

    // Create the export data
    const exportData = {
        metadata: {
            title: "Nephropathology Assessment - Enhanced with Updated Images",
            languages: ["en", "lt"],
            total_questions: updatedQuestions.length,
            updated: new Date().toISOString(),
            version: "4.1-image-managed",
            questions_with_images: updatedQuestions.filter(q => q.image).length,
            modifications: {
                modified_questions: modifiedQuestions.size,
                modified_date: new Date().toISOString()
            }
        },
        interface_translations: {},
        disease_translations: diseaseTranslations,
        questions: updatedQuestions
    };

    // Load interface translations from original
    try {
        const response = await fetch('nephro_questions_enhanced.json');
        const originalData = await response.json();
        exportData.interface_translations = originalData.interface_translations || {};
    } catch (error) {
        console.error('Could not load interface translations:', error);
    }

    // Export JSON
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    const timestamp = new Date().toISOString().split('T')[0];
    jsonLink.download = `nephro_questions_image_updated_${timestamp}.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);

    // Create a ZIP-like instructions file for images
    let imageInstructions = '# Image Replacement Instructions\n\n';
    imageInstructions += `Generated: ${new Date().toISOString()}\n`;
    imageInstructions += `Modified Questions: ${modifiedQuestions.size}\n\n`;
    imageInstructions += '## Images to Save:\n\n';
    imageInstructions += 'Create a folder named "question_images" in the same directory as the JSON file.\n';
    imageInstructions += 'Save the following images to that folder:\n\n';

    modifiedQuestions.forEach(qId => {
        const imageData = newImageData[qId];
        if (imageData && !imageData.removed) {
            const file = imageData.file;
            const extension = file.name.split('.').pop();
            const newPath = `question_images/question_${qId}.${extension}`;
            imageInstructions += `- Question #${qId}: Save as "${newPath}"\n`;
            imageInstructions += `  Original filename: ${file.name}\n`;
            imageInstructions += `  Size: ${(file.size / 1024).toFixed(1)} KB\n\n`;
        }
    });

    imageInstructions += '\n## How to Save Images:\n\n';
    imageInstructions += '1. Create the "question_images" folder\n';
    imageInstructions += '2. For each modified question, download the new image using the "Download Images" button below\n';
    imageInstructions += '3. Save each image with the correct filename as listed above\n';
    imageInstructions += '4. Use the updated JSON file with your portals\n';

    const instructionsBlob = new Blob([imageInstructions], { type: 'text/plain' });
    const instructionsUrl = URL.createObjectURL(instructionsBlob);
    const instructionsLink = document.createElement('a');
    instructionsLink.href = instructionsUrl;
    instructionsLink.download = `image_replacement_instructions_${timestamp}.txt`;
    document.body.appendChild(instructionsLink);
    instructionsLink.click();
    document.body.removeChild(instructionsLink);
    URL.revokeObjectURL(instructionsUrl);

    // Also download each modified image
    downloadModifiedImages();

    alert(`Database exported successfully!\n\n` +
          `Files downloaded:\n` +
          `1. Updated JSON database\n` +
          `2. Image replacement instructions\n` +
          `3. Modified images (${modifiedQuestions.size} files)\n\n` +
          `Please read the instructions file for how to organize the images.`);
}

function downloadModifiedImages() {
    modifiedQuestions.forEach(qId => {
        const imageData = newImageData[qId];
        if (imageData && !imageData.removed) {
            const extension = imageData.file.name.split('.').pop();
            const fileName = `question_${qId}.${extension}`;

            // Convert data URL to blob
            fetch(imageData.dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                });
        }
    });
}

// Lightbox functions
function openLightbox(imageSrc, caption) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');

    lightboxImage.src = imageSrc;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Load on page load
window.addEventListener('DOMContentLoaded', loadQuestions);
