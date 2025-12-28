let allQuestions = [];
let activeQuestions = [];
let currentQuestionIndex = 0;
let answers = {};
let currentLang = 'en';
let translations = {};
let diseaseTranslations = {};

// Load questions and settings
async function loadQuestions() {
    try {
        const response = await fetch('nephro_questions_enhanced.json');
        const data = await response.json();

        translations = data.interface_translations;
        diseaseTranslations = data.disease_translations;
        allQuestions = data.questions;

        // Load instructor settings
        const settings = localStorage.getItem('questionSettings');
        let questionSettings = {};

        if (settings) {
            questionSettings = JSON.parse(settings);
        }

        // Filter to only active questions
        activeQuestions = allQuestions.filter(q => {
            const setting = questionSettings[q.id];
            return !setting || setting.active !== false;
        });

        // Sort by priority (high priority first)
        activeQuestions.sort((a, b) => {
            const settingA = questionSettings[a.id];
            const settingB = questionSettings[b.id];
            const priorityA = settingA?.priority || 'none';
            const priorityB = settingB?.priority || 'none';

            if (priorityA === 'high' && priorityB !== 'high') return -1;
            if (priorityA !== 'high' && priorityB === 'high') return 1;
            if (priorityA === 'low' && priorityB === 'none') return -1;
            if (priorityA === 'none' && priorityB === 'low') return 1;

            return 0;
        });

        if (activeQuestions.length === 0) {
            document.getElementById('questions-container').innerHTML =
                '<div style="background:white;padding:50px;border-radius:15px;text-align:center;color:#666;">' +
                '<p style="font-size:20px;">No questions are currently active.</p>' +
                '<p style="margin-top:10px;">Please contact your instructor.</p>' +
                '</div>';
            return;
        }

        updateInterfaceLanguage();
        renderCurrentQuestion();
        updateProgress();

    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('questions-container').innerHTML =
            '<div style="background:white;padding:50px;border-radius:15px;text-align:center;color:#f56565;">' +
            '<p style="font-size:20px;">Error loading questions</p>' +
            '<p style="margin-top:10px;">Please ensure nephro_questions_enhanced.json is available.</p>' +
            '</div>';
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
    renderCurrentQuestion();
}

function updateInterfaceLanguage() {
    const titleText = currentLang === 'en' ? 'Nephropathology Student Portal' : 'Nefropatologijos studentų portalas';
    document.getElementById('header-title').textContent = titleText;
    document.getElementById('header-subtitle').textContent = t('subtitle');
    document.getElementById('progress-label').textContent = t('total_questions');
    const scoreLabel = currentLang === 'en' ? 'Current Score' : 'Dabartinis rezultatas';
    document.getElementById('score-label-current').textContent = scoreLabel;
    document.getElementById('completion-title').textContent = 'Assessment Complete!';
    document.getElementById('completion-subtitle').textContent = "You've answered all questions";
    document.getElementById('score-label').textContent = t('answer');
    if (document.getElementById('btn-restart')) {
        document.getElementById('btn-restart').textContent = 'Start Over';
    }
}

function renderCurrentQuestion() {
    if (currentQuestionIndex >= activeQuestions.length) {
        showCompletion();
        return;
    }

    const question = activeQuestions[currentQuestionIndex];
    const userAnswer = answers[question.id];
    const hasAnswered = userAnswer !== undefined;

    const container = document.getElementById('questions-container');

    const answerOptions = [
        { letter: 'A', text: t('both_true_explains') },
        { letter: 'B', text: t('both_true_not_explains') },
        { letter: 'C', text: t('assertion_true_reason_false') },
        { letter: 'D', text: t('assertion_false_reason_true') },
        { letter: 'E', text: t('both_false') }
    ];

    const correctAnswer = question.en.answer;

    // Build image HTML if image exists
    let imageHtml = '';
    if (question.image) {
        const imagePath = `Textbook_LT/${question.image}`;
        const imageCaption = currentLang === 'en'
            ? 'Click to enlarge'
            : 'Spustelėkite norėdami padidinti';

        imageHtml = `
            <div class="question-image">
                <img src="${imagePath}"
                     alt="Medical image"
                     onclick="openLightbox('${imagePath}', '${question[currentLang].assertion}')"
                     onerror="this.parentElement.style.display='none'">
                <div class="zoom-hint">🔍 ${imageCaption}</div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="question-card active">
            <div class="question-header">
                <span class="question-number">${t('question_bank')}: ${currentQuestionIndex + 1} / ${activeQuestions.length}</span>
                <span class="badge badge-${question.difficulty}">${t(question.difficulty)}</span>
            </div>

            ${imageHtml}

            <div class="question-content">
                <div class="content-section">
                    <span class="content-label">${t('assertion')}</span>
                    <div class="content-text">${question[currentLang].assertion}</div>
                </div>

                <div class="content-section">
                    <span class="content-label">${t('reason')}</span>
                    <div class="content-text">${question[currentLang].reason}</div>
                </div>
            </div>

            <div class="answer-prompt">${t('choose_answer')}</div>
            <div class="answer-options">
                ${answerOptions.map(option => {
                    let classes = 'answer-option';
                    if (hasAnswered) {
                        if (option.letter === correctAnswer) {
                            classes += ' correct';
                        } else if (option.letter === userAnswer && userAnswer !== correctAnswer) {
                            classes += ' incorrect';
                        }
                    } else if (userAnswer === option.letter) {
                        classes += ' selected';
                    }

                    return `
                        <div class="${classes}" onclick="${hasAnswered ? '' : 'selectAnswer(' + question.id + ', \'' + option.letter + '\')'}">
                            <span class="answer-letter">${option.letter}</span>
                            ${option.text}
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="explanation-box ${hasAnswered ? 'show' : ''}" id="explanation-box">
                <div class="explanation-label">${t('explanation')}</div>
                <div class="explanation-text">${question[currentLang].explanation}</div>
            </div>

            <div class="navigation">
                <button class="btn btn-secondary" onclick="previousQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>
                    ← Previous
                </button>
                <button class="btn btn-primary" onclick="${hasAnswered ? 'nextQuestion()' : 'submitAnswer()'}" id="next-btn">
                    ${hasAnswered ? (currentQuestionIndex === activeQuestions.length - 1 ? 'Finish' : 'Next →') : 'Submit Answer'}
                </button>
            </div>
        </div>
    `;
}

function selectAnswer(questionId, answer) {
    answers[questionId] = answer;
    renderCurrentQuestion();
}

function submitAnswer() {
    const question = activeQuestions[currentQuestionIndex];
    if (!answers[question.id]) {
        alert('Please select an answer first.');
        return;
    }

    renderCurrentQuestion();
}

function nextQuestion() {
    currentQuestionIndex++;
    updateProgress();
    renderCurrentQuestion();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateProgress();
        renderCurrentQuestion();
    }
}

function updateProgress() {
    const answered = Object.keys(answers).length;
    const total = activeQuestions.length;
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

    // Calculate current score
    const correct = activeQuestions.filter(q =>
        answers[q.id] === q.en.answer
    ).length;
    const scorePercentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    document.getElementById('progress-stats').textContent = `${answered} / ${total}`;
    document.getElementById('current-score').textContent = `${scorePercentage}% (${correct}/${answered})`;

    const fillElement = document.getElementById('progress-fill');
    fillElement.style.width = percentage + '%';
    fillElement.textContent = percentage + '%';
}

function showCompletion() {
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = '';

    const correct = activeQuestions.filter(q =>
        answers[q.id] === q.en.answer
    ).length;

    const total = activeQuestions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    document.getElementById('final-score').textContent = percentage + '%';
    document.getElementById('completion-card').classList.add('show');

    // Update completion text
    const completionCard = document.getElementById('completion-card');
    completionCard.querySelector('p').textContent = `${correct} / ${total} ${t('answer')}`;
}

function restartAssessment() {
    currentQuestionIndex = 0;
    answers = {};
    document.getElementById('completion-card').classList.remove('show');
    renderCurrentQuestion();
    updateProgress();
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

// Load questions on page load
window.addEventListener('DOMContentLoaded', loadQuestions);
