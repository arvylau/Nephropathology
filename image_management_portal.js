// Image Management Portal - JavaScript
let allQuestions = [];
let diseaseTranslations = {};
let modifiedQuestions = new Set(); // Track which questions have been modified
let newImageData = {}; // Store new image data: { questionId: { file, dataUrl } }
let imageFolderHandle = null; // Handle to question_images folder
let autoSaveEnabled = false; // Auto-save JSON after each change
let originalData = null; // Store original database data

// Load questions
async function loadQuestions() {
    try {
        const response = await fetch('nephro_questions_enhanced.json');
        const data = await response.json();

        // Store original data for reference
        originalData = JSON.parse(JSON.stringify(data));

        allQuestions = data.questions;
        diseaseTranslations = data.disease_translations || {};

        populateDiseaseFilter();
        renderGallery(allQuestions);
        updateStats();
        checkFolderAccess();
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

// Check if we have folder access from previous session
async function checkFolderAccess() {
    const folderPath = localStorage.getItem('imageFolderPath');
    if (folderPath) {
        document.getElementById('folder-status').textContent = `📁 ${folderPath}`;
        document.getElementById('folder-status').style.color = '#48bb78';
    }
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

        imageFolderHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });

        const folderPath = imageFolderHandle.name;
        localStorage.setItem('imageFolderPath', folderPath);

        document.getElementById('folder-status').textContent = `✅ Folder: ${folderPath}`;
        document.getElementById('folder-status').style.color = '#48bb78';
        document.getElementById('auto-save-toggle').disabled = false;

        alert(`Success! Images will now auto-save to:\n${folderPath}\n\nYou can now drag & drop images and they'll be saved automatically.`);
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error selecting folder:', error);
            alert('Could not access folder. Please try again.');
        }
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
    const statusFilter = document.getElementById('filter-status').value;

    let filtered = allQuestions;

    // Filter by disease
    if (diseaseFilter !== 'all') {
        filtered = filtered.filter(q => q.disease_id === diseaseFilter);
    }

    // Filter by status
    if (statusFilter === 'with-images') {
        filtered = filtered.filter(q => q.image || newImageData[q.id]);
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

    gallery.innerHTML = questions.map(q => {
        const diseaseName = diseaseTranslations[q.disease_id]?.en || q.disease_id;
        const hasImage = q.image || newImageData[q.id];
        const isModified = modifiedQuestions.has(q.id);

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
                    <div class="question-text">${q.en.assertion}</div>
                    <span class="badge badge-disease">${diseaseName}</span>
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
        const question = allQuestions.find(q => q.id === questionId);
        if (question) {
            const extension = file.name.split('.').pop();
            question.image = `question_images/question_${questionId}.${extension}`;
        }

        // AUTO-SAVE: Save JSON if auto-save is enabled
        if (autoSaveEnabled && imageFolderHandle) {
            await autoSaveJSON();
        }

        // Update the card display
        updateCardImage(questionId, e.target.result, file.name);
        updateStats();
    };

    reader.readAsDataURL(file);
}

// Save image to the selected folder
async function saveImageToFolder(file, questionId) {
    if (!imageFolderHandle) {
        throw new Error('No folder selected');
    }

    const extension = file.name.split('.').pop();
    const fileName = `question_${questionId}.${extension}`;

    // Create/overwrite the file in the folder
    const fileHandle = await imageFolderHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();

    console.log(`✓ Saved: ${fileName}`);
    showToast(`✓ Image saved: ${fileName}`);
}

// Auto-save the JSON database
async function autoSaveJSON() {
    if (!imageFolderHandle) return;

    try {
        // Get parent directory of question_images folder
        // We'll save the JSON in the same parent directory
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

        // Try to save in parent directory
        // This requires getting parent, which isn't directly supported
        // So we'll save to the question_images folder itself
        const fileHandle = await imageFolderHandle.getFileHandle(jsonFileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        console.log(`✓ Auto-saved JSON: ${jsonFileName}`);
        showToast('✓ Database auto-saved');
    } catch (error) {
        console.error('Error auto-saving JSON:', error);
        // Don't alert on auto-save errors, just log them
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
        // Get handle to the existing image file
        const existingFileHandle = await imageFolderHandle.getFileHandle(fileName);

        // Read the file content
        const file = await existingFileHandle.getFile();
        const fileContent = await file.arrayBuffer();

        // Create REMOVED subdirectory if it doesn't exist
        let removedFolderHandle;
        try {
            removedFolderHandle = await imageFolderHandle.getDirectoryHandle('REMOVED', { create: true });
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
