// Image Management Portal - JavaScript
let allQuestions = [];
let diseaseTranslations = {};
let modifiedQuestions = new Set(); // Track which questions have been modified
let newImageData = {}; // Store new image data: { questionId: { file, dataUrl } }

// Load questions
async function loadQuestions() {
    try {
        const response = await fetch('nephro_questions_enhanced.json');
        const data = await response.json();

        allQuestions = data.questions;
        diseaseTranslations = data.disease_translations || {};

        populateDiseaseFilter();
        renderGallery(allQuestions);
        updateStats();
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
            imageSrc = `Textbook_LT/${q.image}`;
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

function processImageFile(file, questionId) {
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
    reader.onload = function(e) {
        // Store the new image data
        newImageData[questionId] = {
            file: file,
            dataUrl: e.target.result
        };

        // Mark as modified
        modifiedQuestions.add(questionId);

        // Update the card display
        updateCardImage(questionId, e.target.result, file.name);
        updateStats();
    };

    reader.readAsDataURL(file);
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

function removeImage(questionId) {
    if (confirm('Remove the image from this question? This will update the database when exported.')) {
        const question = allQuestions.find(q => q.id === questionId);
        if (question) {
            // Mark for removal by setting image to null
            newImageData[questionId] = {
                file: null,
                dataUrl: null,
                removed: true
            };
            modifiedQuestions.add(questionId);
            applyFilters();
            updateStats();
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
