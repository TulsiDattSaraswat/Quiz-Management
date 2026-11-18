// Quiz App JavaScript

let currentQuiz = null;
let currentQuestions = [];
let editingQuizId = null;
let quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
let attempts = JSON.parse(localStorage.getItem('attempts')) || [];
let timerInterval = null;
let timeRemaining = 0;

// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function goHome() {
    if (timerInterval) clearInterval(timerInterval);
    currentQuiz = null;
    currentQuestions = [];
    showScreen('homeScreen');
}

function goToCreateQuiz() {
    currentQuestions = [];
    document.getElementById('quizForm').reset();
    document.getElementById('questionsContainer').innerHTML = '';
    addQuestion(); // Add one empty question
    showScreen('createQuizScreen');
}

function goToQuizList() {
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('searchInput').value = '';
    displayQuizList();
    showScreen('quizListScreen');
}

// Question Management
function addQuestion() {
    const questionIndex = currentQuestions.length;
    const question = {
        text: '',
        options: ['', ''],
        correctAnswer: 0
    };
    currentQuestions.push(question);
    renderQuestions();
}

function removeQuestion(index) {
    currentQuestions.splice(index, 1);
    renderQuestions();
}

function addOption(questionIndex) {
    currentQuestions[questionIndex].options.push('');
    renderQuestions();
}

function removeOption(questionIndex, optionIndex) {
    currentQuestions[questionIndex].options.splice(optionIndex, 1);
    renderQuestions();
}

function updateQuestion(questionIndex, field, value) {
    currentQuestions[questionIndex][field] = value;
}

function updateOption(questionIndex, optionIndex, value) {
    currentQuestions[questionIndex].options[optionIndex] = value;
}

function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';

    currentQuestions.forEach((question, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-box';
        
        let optionsHTML = '';
        question.options.forEach((option, oIndex) => {
            optionsHTML += `
                <div class="option-group">
                    <input type="text" 
                           value="${option}" 
                           placeholder="Option ${oIndex + 1}"
                           oninput="updateOption(${qIndex}, ${oIndex}, this.value)">
                    <button type="button" onclick="removeOption(${qIndex}, ${oIndex})">Remove</button>
                </div>
            `;
        });

        questionDiv.innerHTML = `
            <h3>Question ${qIndex + 1}</h3>
            <div class="form-group">
                <label>Question Text:</label>
                <textarea placeholder="Enter your question"
                          oninput="updateQuestion(${qIndex}, 'text', null, this.value)">${question.text}</textarea>
            </div>
            
            <div class="form-group">
                <label>Options:</label>
                ${optionsHTML}
                <button type="button" onclick="addOption(${qIndex})" class="btn btn-secondary">Add Option</button>
            </div>

            <div class="form-group">
                <label for="correctAnswer${qIndex}">Correct Answer:</label>
                <select id="correctAnswer${qIndex}" onchange="updateQuestion(${qIndex}, 'correctAnswer', null, this.value)">
                    ${question.options.map((opt, idx) => 
                        `<option value="${idx}" ${idx === question.correctAnswer ? 'selected' : ''}>Option ${idx + 1}</option>`
                    ).join('')}
                </select>
            </div>

            <button type="button" onclick="removeQuestion(${qIndex})" class="remove-question">Remove Question</button>
        `;

        container.appendChild(questionDiv);
    });
}

// Quiz Save and Management
function saveQuiz() {
    const title = document.getElementById('quizTitle').value.trim();
    const description = document.getElementById('quizDescription').value.trim();

    if (!title) {
        alert('Please enter a quiz title');
        return;
    }

    if (currentQuestions.length === 0) {
        alert('Please add at least one question');
        return;
    }

    // Validate all questions have text and options
    for (let i = 0; i < currentQuestions.length; i++) {
        const q = currentQuestions[i];
        if (!q.text.trim()) {
            alert(`Question ${i + 1} is missing text`);
            return;
        }
        if (q.options.some(opt => !opt.trim())) {
            alert(`Question ${i + 1} has empty options`);
            return;
        }
    }

    const quiz = {
        id: Date.now(),
        title: title,
        description: description,
        questions: JSON.parse(JSON.stringify(currentQuestions)),
        createdAt: new Date().toLocaleDateString(),
        timer: parseInt(document.getElementById('quizTimer').value) || 0
    };

    quizzes.push(quiz);
    localStorage.setItem('quizzes', JSON.stringify(quizzes));

    alert('Quiz saved successfully!');
    goHome();
}

function displayQuizList() {
    const container = document.getElementById('quizListContainer');
    
    if (quizzes.length === 0) {
        container.innerHTML = '<div class="empty-message">No quizzes available. Create one first!</div>';
        return;
    }

    container.innerHTML = '';
    quizzes.forEach(quiz => {
        const quizCard = document.createElement('div');
        quizCard.className = 'quiz-card';
        const timerInfo = quiz.timer > 0 ? ` | ⏱️ ${quiz.timer} min` : ' | ⏱️ Unlimited';
        quizCard.innerHTML = `
            <div class="quiz-info">
                <h3>${quiz.title}</h3>
                <p>${quiz.description || 'No description'}</p>
                <p style="font-size: 12px; color: #999;">Created: ${quiz.createdAt} | Questions: ${quiz.questions.length}${timerInfo}</p>
            </div>
            <div class="quiz-card-action">
                <button onclick="startQuiz(${quiz.id})" class="btn btn-primary">Take Quiz</button>
                <button onclick="editQuiz(${quiz.id})" class="btn btn-secondary">✏️ Edit</button>
                <button onclick="deleteQuiz(${quiz.id})" class="btn btn-secondary">Delete</button>
            </div>
        `;
        container.appendChild(quizCard);
    });
}

function deleteQuiz(quizId) {
    if (confirm('Are you sure you want to delete this quiz?')) {
        quizzes = quizzes.filter(q => q.id !== quizId);
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
        displayQuizList();
    }
}

// Search Quizzes
function searchQuizzes() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('quizListContainer');
    
    if (quizzes.length === 0) {
        container.innerHTML = '<div class="empty-message">No quizzes available. Create one first!</div>';
        return;
    }

    const filteredQuizzes = quizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchInput)
    );

    container.innerHTML = '';
    
    if (filteredQuizzes.length === 0) {
        container.innerHTML = '<div class="empty-message">No quizzes found matching your search.</div>';
        return;
    }

    filteredQuizzes.forEach(quiz => {
        const quizCard = document.createElement('div');
        quizCard.className = 'quiz-card';
        quizCard.innerHTML = `
            <div class="quiz-info">
                <h3>${quiz.title}</h3>
                <p>${quiz.description || 'No description'}</p>
                <p style="font-size: 12px; color: #999;">Created: ${quiz.createdAt} | Questions: ${quiz.questions.length}</p>
            </div>
            <div class="quiz-card-action">
                <button onclick="startQuiz(${quiz.id})" class="btn btn-primary">Take Quiz</button>
                <button onclick="editQuiz(${quiz.id})" class="btn btn-secondary">✏️ Edit</button>
                <button onclick="deleteQuiz(${quiz.id})" class="btn btn-secondary">Delete</button>
            </div>
        `;
        container.appendChild(quizCard);
    });
}

// Edit Quiz Functions
function editQuiz(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    editingQuizId = quizId;
    currentQuestions = JSON.parse(JSON.stringify(quiz.questions));
    
    document.getElementById('editQuizTitle').value = quiz.title;
    document.getElementById('editQuizDescription').value = quiz.description || '';
    document.getElementById('editQuizTimer').value = quiz.timer || 0;
    
    renderEditQuestions();
    showScreen('editQuizScreen');
}

function renderEditQuestions() {
    const container = document.getElementById('editQuestionsContainer');
    container.innerHTML = '';

    currentQuestions.forEach((question, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-box';
        
        let optionsHTML = '';
        question.options.forEach((option, oIndex) => {
            optionsHTML += `
                <div class="option-group">
                    <input type="text" 
                           value="${option}" 
                           placeholder="Option ${oIndex + 1}"
                           oninput="updateQuestion(${qIndex}, 'options', ${oIndex}, this.value)">
                    <button type="button" onclick="removeOptionFromEdit(${qIndex}, ${oIndex})">Remove</button>
                </div>
            `;
        });

        questionDiv.innerHTML = `
            <h3>Question ${qIndex + 1}</h3>
            <div class="form-group">
                <label>Question Text:</label>
                <textarea placeholder="Enter your question"
                          oninput="updateQuestion(${qIndex}, 'text', null, this.value)">${question.text}</textarea>
            </div>
            
            <div class="form-group">
                <label>Options:</label>
                ${optionsHTML}
                <button type="button" onclick="addOptionToEdit(${qIndex})" class="btn btn-secondary">Add Option</button>
            </div>

            <div class="form-group">
                <label for="editCorrectAnswer${qIndex}">Correct Answer:</label>
                <select id="editCorrectAnswer${qIndex}" onchange="updateQuestion(${qIndex}, 'correctAnswer', null, this.value)">
                    ${question.options.map((opt, idx) => 
                        `<option value="${idx}" ${idx === question.correctAnswer ? 'selected' : ''}>Option ${idx + 1}</option>`
                    ).join('')}
                </select>
            </div>

            <button type="button" onclick="removeQuestionFromEdit(${qIndex})" class="remove-question">Remove Question</button>
        `;

        container.appendChild(questionDiv);
    });
}

function updateQuestion(qIndex, field, optIndex, value) {
    if (field === 'text') {
        currentQuestions[qIndex].text = value;
    } else if (field === 'options') {
        currentQuestions[qIndex].options[optIndex] = value;
    } else if (field === 'correctAnswer') {
        currentQuestions[qIndex].correctAnswer = parseInt(value);
    }
}

function addOptionToEdit(qIndex) {
    currentQuestions[qIndex].options.push('');
    renderEditQuestions();
}

function removeOptionFromEdit(qIndex, optIndex) {
    currentQuestions[qIndex].options.splice(optIndex, 1);
    renderEditQuestions();
}

function removeQuestionFromEdit(qIndex) {
    currentQuestions.splice(qIndex, 1);
    renderEditQuestions();
}

function addQuestionToEdit() {
    const question = {
        text: '',
        options: ['', ''],
        correctAnswer: 0
    };
    currentQuestions.push(question);
    renderEditQuestions();
}

function saveEditedQuiz() {
    const title = document.getElementById('editQuizTitle').value.trim();
    const description = document.getElementById('editQuizDescription').value.trim();

    if (!title) {
        alert('Please enter a quiz title');
        return;
    }

    if (currentQuestions.length === 0) {
        alert('Please add at least one question');
        return;
    }

    // Validate all questions
    for (let i = 0; i < currentQuestions.length; i++) {
        const q = currentQuestions[i];
        if (!q.text.trim()) {
            alert(`Question ${i + 1} is missing text`);
            return;
        }
        if (q.options.some(opt => !opt.trim())) {
            alert(`Question ${i + 1} has empty options`);
            return;
        }
    }

    // Find and update the quiz
    const quizIndex = quizzes.findIndex(q => q.id === editingQuizId);
    if (quizIndex !== -1) {
        quizzes[quizIndex].title = title;
        quizzes[quizIndex].description = description;
        quizzes[quizIndex].questions = JSON.parse(JSON.stringify(currentQuestions));
        quizzes[quizIndex].timer = parseInt(document.getElementById('editQuizTimer').value) || 0;
        
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
        alert('Quiz updated successfully!');
        editingQuizId = null;
        currentQuestions = [];
        goToQuizList();
    }
}

// Take Quiz
function startQuiz(quizId) {
    currentQuiz = quizzes.find(q => q.id === quizId);
    if (!currentQuiz) return;

    document.getElementById('quizTitleDisplay').textContent = currentQuiz.title;
    const content = document.getElementById('quizContent');
    content.innerHTML = '';

    currentQuiz.questions.forEach((question, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';

        const optionsHTML = question.options.map((option, oIndex) => `
            <label>
                <input type="radio" name="question${qIndex}" value="${oIndex}">
                ${option}
            </label>
        `).join('');

        questionDiv.innerHTML = `
            <h4>Question ${qIndex + 1}: ${question.text}</h4>
            ${optionsHTML}
        `;

        content.appendChild(questionDiv);
    });

    showScreen('takeQuizScreen');

    // Handle timer
    if (currentQuiz.timer && currentQuiz.timer > 0) {
        timeRemaining = currentQuiz.timer * 60; // Convert to seconds
        document.getElementById('timerDisplay').style.display = 'flex';
        updateTimerDisplay();
        startTimer();
    } else {
        document.getElementById('timerDisplay').style.display = 'none';
        if (timerInterval) clearInterval(timerInterval);
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            handleTimeExpiry();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerValue').textContent = timeString;
    
    // Change color when time is running out
    const timerElement = document.getElementById('timerDisplay');
    if (timeRemaining <= 60) {
        timerElement.classList.add('timer-warning');
    } else {
        timerElement.classList.remove('timer-warning');
    }
}

function handleTimeExpiry() {
    alert('Time is up! Your quiz has been submitted.');
    submitQuiz();
}

function submitQuiz() {
    if (!currentQuiz) return;

    if (timerInterval) clearInterval(timerInterval);

    let correctCount = 0;
    const results = [];

    currentQuiz.questions.forEach((question, qIndex) => {
        const selectedAnswer = document.querySelector(`input[name="question${qIndex}"]:checked`);
        const userAnswerIndex = selectedAnswer ? parseInt(selectedAnswer.value) : -1;
        const isCorrect = userAnswerIndex === question.correctAnswer;

        if (isCorrect) correctCount++;

        results.push({
            question: question.text,
            userAnswer: userAnswerIndex >= 0 ? question.options[userAnswerIndex] : 'Not answered',
            correctAnswer: question.options[question.correctAnswer],
            isCorrect: isCorrect
        });
    });

    // Track attempt
    const totalQuestions = currentQuiz.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    
    const attempt = {
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.title,
        score: correctCount,
        total: totalQuestions,
        percentage: percentage,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };
    
    attempts.push(attempt);
    localStorage.setItem('attempts', JSON.stringify(attempts));

    displayResults(correctCount, results);
}

function displayResults(correctCount, results) {
    const totalQuestions = currentQuiz.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    let resultsHTML = `
        <div class="score-display">
            Your Score: ${correctCount} / ${totalQuestions} (${percentage}%)
        </div>
    `;

    results.forEach((result, index) => {
        const resultClass = result.isCorrect ? 'correct' : 'incorrect';
        resultsHTML += `
            <div class="result-item ${resultClass}">
                <h4>Question ${index + 1}: ${result.question}</h4>
                <p><strong>Your Answer:</strong> ${result.userAnswer}</p>
                <p><strong>Correct Answer:</strong> ${result.correctAnswer}</p>
                <p><strong>Status:</strong> ${result.isCorrect ? '✓ Correct' : '✗ Incorrect'}</p>
            </div>
        `;
    });

    document.getElementById('resultsContent').innerHTML = resultsHTML;
    showScreen('resultsScreen');
}

// Statistics Functions
function viewQuizStats(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const quizAttempts = attempts.filter(a => a.quizId === quizId);
    
    if (quizAttempts.length === 0) {
        const statsHTML = `
            <div class="stats-card">
                <p class="empty-message">No attempts yet. Take the quiz to see statistics!</p>
            </div>
        `;
        document.getElementById('statsContent').innerHTML = statsHTML;
        showScreen('statsScreen');
        return;
    }

    // Calculate stats
    const scores = quizAttempts.map(a => a.percentage);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    const totalAttempts = quizAttempts.length;

    let statsHTML = `
        <div class="stats-card">
            <h3>${quiz.title}</h3>
            
            <div class="stats-grid">
                <div class="stat-box info">
                    <div class="stat-value">${totalAttempts}</div>
                    <div class="stat-label">Total Attempts</div>
                </div>
                <div class="stat-box success">
                    <div class="stat-value">${averageScore}%</div>
                    <div class="stat-label">Average Score</div>
                </div>
                <div class="stat-box success">
                    <div class="stat-value">${bestScore}%</div>
                    <div class="stat-label">Best Score</div>
                </div>
                <div class="stat-box warning">
                    <div class="stat-value">${worstScore}%</div>
                    <div class="stat-label">Worst Score</div>
                </div>
            </div>

            <div class="attempts-history">
                <h4>📋 Recent Attempts</h4>
                ${quizAttempts.reverse().map((attempt, index) => `
                    <div class="attempt-item ${attempt.percentage === 100 ? 'perfect' : ''}">
                        <div class="attempt-info">
                            <div class="attempt-date">${attempt.date} at ${attempt.time}</div>
                        </div>
                        <div class="attempt-score">
                            ${attempt.score}/${attempt.total} (${attempt.percentage}%)
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('statsContent').innerHTML = statsHTML;
    showScreen('statsScreen');
}

// Show all statistics
function showAllStats() {
    if (attempts.length === 0) {
        const statsHTML = `
            <div class="stats-card">
                <p class="empty-message">No quiz attempts yet. Take some quizzes to see statistics!</p>
            </div>
        `;
        document.getElementById('allStatsContent').innerHTML = statsHTML;
        showScreen('allStatsScreen');
        return;
    }

    // Group attempts by quiz
    const quizStats = {};
    attempts.forEach(attempt => {
        if (!quizStats[attempt.quizId]) {
            quizStats[attempt.quizId] = {
                quizTitle: attempt.quizTitle,
                attempts: []
            };
        }
        quizStats[attempt.quizId].attempts.push(attempt);
    });

    // Calculate overall and per-quiz stats
    const allScores = attempts.map(a => a.percentage);
    const overallAverage = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    const overallBest = Math.max(...allScores);
    const totalQuizzesAttempted = quizzes.length;
    const totalAttempts = attempts.length;

    let statsHTML = `
        <div class="stats-card">
            <h3>Overall Performance</h3>
            
            <div class="stats-grid">
                <div class="stat-box info">
                    <div class="stat-value">${totalAttempts}</div>
                    <div class="stat-label">Total Attempts</div>
                </div>
                <div class="stat-box success">
                    <div class="stat-value">${overallAverage}%</div>
                    <div class="stat-label">Average Score</div>
                </div>
                <div class="stat-box success">
                    <div class="stat-value">${overallBest}%</div>
                    <div class="stat-label">Best Score</div>
                </div>
                <div class="stat-box info">
                    <div class="stat-value">${totalQuizzesAttempted}</div>
                    <div class="stat-label">Quizzes Created</div>
                </div>
            </div>
        </div>
    `;

    // Per-quiz statistics
    statsHTML += `<div class="stats-card"><h3>Per-Quiz Statistics</h3>`;
    
    Object.values(quizStats).forEach(stats => {
        const scores = stats.attempts.map(a => a.percentage);
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const bestScore = Math.max(...scores);
        const attempts_count = stats.attempts.length;

        statsHTML += `
            <div class="quiz-stat-item">
                <h4>${stats.quizTitle}</h4>
                <div class="stats-grid-small">
                    <div class="stat-box-small">
                        <div class="stat-value-small">${attempts_count}</div>
                        <div class="stat-label-small">Attempts</div>
                    </div>
                    <div class="stat-box-small">
                        <div class="stat-value-small">${avgScore}%</div>
                        <div class="stat-label-small">Average</div>
                    </div>
                    <div class="stat-box-small">
                        <div class="stat-value-small">${bestScore}%</div>
                        <div class="stat-label-small">Best</div>
                    </div>
                </div>
            </div>
        `;
    });

    statsHTML += `</div>`;

    document.getElementById('allStatsContent').innerHTML = statsHTML;
    showScreen('allStatsScreen');
}

// Export and Import Functions
function openExportModal() {
    if (quizzes.length === 0) {
        alert('⚠️ No quizzes to export!\n\nCreate some quizzes first.');
        return;
    }

    // Open export modal
    showExportModal();
}

function showExportModal() {
    document.getElementById('exportModal').classList.remove('hidden');
    updateExportView();
}

function closeExportModal() {
    document.getElementById('exportModal').classList.add('hidden');
    // Reset selections
    document.querySelector('input[name="exportType"][value="all"]').checked = true;
    updateExportView();
}

function updateExportView() {
    const exportType = document.querySelector('input[name="exportType"]:checked').value;
    const selectedContainer = document.getElementById('selectedQuizzesContainer');

    if (exportType === 'all') {
        selectedContainer.style.display = 'none';
    } else {
        selectedContainer.style.display = 'block';
        renderQuizCheckboxes();
    }
}

function renderQuizCheckboxes() {
    const container = document.getElementById('quizCheckboxes');
    container.innerHTML = '';

    quizzes.forEach((quiz, index) => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'quiz-checkbox-item';
        
        checkboxDiv.innerHTML = `
            <input type="checkbox" value="${index}" class="quiz-checkbox" onchange="updateSelectAllState()">
            <label>
                <span class="quiz-title">${quiz.title}</span>
                <span class="quiz-count">${quiz.questions.length} question(s)</span>
            </label>
        `;
        
        container.appendChild(checkboxDiv);
    });

    updateSelectAllState();
}

function toggleSelectAll() {
    const isChecked = document.getElementById('selectAllCheckbox').checked;
    document.querySelectorAll('.quiz-checkbox').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox');
    const checkedCount = document.querySelectorAll('.quiz-checkbox:checked').length;
    document.getElementById('selectAllCheckbox').checked = checkedCount === checkboxes.length && checkboxes.length > 0;
}

function performExport() {
    const exportType = document.querySelector('input[name="exportType"]:checked').value;
    const exportFormat = document.querySelector('input[name="exportFormat"]:checked').value;
    let quizzesToExport = [];

    if (exportType === 'all') {
        quizzesToExport = quizzes;
    } else {
        const selectedCheckboxes = document.querySelectorAll('.quiz-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            alert('⚠️ Please select at least one quiz to export!');
            return;
        }

        selectedCheckboxes.forEach(checkbox => {
            const index = parseInt(checkbox.value);
            quizzesToExport.push(quizzes[index]);
        });
    }

    if (exportFormat === 'json') {
        exportToJSON(quizzesToExport);
    } else {
        exportToExcel(quizzesToExport);
    }

    alert(`✅ Success!\n\n${quizzesToExport.length} quiz(zes) exported successfully!\n\nKeep this file safe for backups!`);
    closeExportModal();
}

function exportToJSON(quizzesToExport) {
    const dataStr = JSON.stringify(quizzesToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quizzes_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportToExcel(quizzesToExport) {
    const workbook = XLSX.utils.book_new();
    
    quizzesToExport.forEach((quiz, quizIndex) => {
        const wsData = [];
        
        // Add quiz header
        wsData.push(['Quiz Title:', quiz.title]);
        wsData.push(['Description:', quiz.description || 'N/A']);
        wsData.push(['Created:', quiz.createdAt || new Date().toLocaleDateString()]);
        wsData.push([]);
        
        // Add questions
        wsData.push(['Question #', 'Question Text', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Answer']);
        
        quiz.questions.forEach((question, qIndex) => {
            const row = [
                qIndex + 1,
                question.text,
                question.options[0] || '',
                question.options[1] || '',
                question.options[2] || '',
                question.options[3] || '',
                question.options[question.correctAnswer] || ''
            ];
            wsData.push(row);
        });
        
        wsData.push([]);
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
            { wch: 12 },
            { wch: 30 },
            { wch: 20 },
            { wch: 20 },
            { wch: 20 },
            { wch: 20 },
            { wch: 20 }
        ];
        
        const sheetName = quiz.title.substring(0, 31).replace(/[?\\/:*\[\]]/g, '');
        XLSX.utils.book_append_sheet(workbook, ws, sheetName || `Quiz${quizIndex + 1}`);
    });
    
    XLSX.writeFile(workbook, `quizzes_${new Date().getTime()}.xlsx`);
}

function importQuizzes(event) {
    const file = event.target.files[0];
    
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isJSON = fileName.endsWith('.json');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isJSON && !isExcel) {
        alert('❌ Invalid file format!\n\nPlease select a .json or .xlsx file only.\n\nSupported formats:\n• JSON (.json)\n• Excel (.xlsx, .xls)');
        document.getElementById('importFile').value = '';
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let importedQuizzes = [];

            if (isJSON) {
                // For JSON, read as text
                importedQuizzes = JSON.parse(e.target.result);
            } else if (isExcel) {
                // For Excel, read as ArrayBuffer
                importedQuizzes = parseExcelToQuizzes(e.target.result);
            }
            
            if (!Array.isArray(importedQuizzes)) {
                alert('❌ Invalid format!\n\nThe file must contain quiz data.\n\nPlease use a valid quiz file exported from this app.');
                document.getElementById('importFile').value = '';
                return;
            }

            if (importedQuizzes.length === 0) {
                alert('⚠️ The file contains no quizzes.');
                document.getElementById('importFile').value = '';
                return;
            }

            // Validate imported quizzes
            importedQuizzes = importedQuizzes.filter(q => q && q.title && q.questions);

            if (importedQuizzes.length === 0) {
                alert('❌ No valid quizzes found in the file.');
                document.getElementById('importFile').value = '';
                return;
            }

            // Merge or replace based on user choice
            if (quizzes.length > 0) {
                const choice = confirm(
                    `📋 You have ${quizzes.length} existing quiz(zes).\n\n` +
                    `Click OK to MERGE (keep existing + add new)\n` +
                    `Click Cancel to REPLACE (remove existing and use only imported)`
                );

                if (choice) {
                    // Merge
                    quizzes = [...quizzes, ...importedQuizzes];
                } else {
                    // Replace
                    quizzes = importedQuizzes;
                }
            } else {
                quizzes = importedQuizzes;
            }

            localStorage.setItem('quizzes', JSON.stringify(quizzes));
            alert(`✅ Success!\n\nImported ${importedQuizzes.length} quiz(zes) successfully!`);
            
            // Reset file input
            document.getElementById('importFile').value = '';
            
            // Show quizzes if on home screen
            if (document.getElementById('homeScreen').classList.contains('hidden') === false) {
                goToQuizList();
            }
        } catch (error) {
            alert('❌ Error reading file!\n\nMake sure the file is valid.\n\nError: ' + error.message);
            document.getElementById('importFile').value = '';
        }
    };

    // Use appropriate reading method based on file type
    if (isJSON) {
        reader.readAsText(file);
    } else if (isExcel) {
        reader.readAsArrayBuffer(file);
    }
}

function parseExcelToQuizzes(arrayBuffer) {
    const quizzes = [];
    
    try {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const quiz = parseSheetToQuiz(data, sheetName);
            if (quiz && quiz.questions.length > 0) {
                quizzes.push(quiz);
            }
        });
    } catch (error) {
        console.error('Error parsing Excel:', error);
    }
    
    return quizzes;
}

function parseSheetToQuiz(data, sheetName) {
    if (!data || data.length === 0) return null;
    
    let quiz = {
        id: Date.now() + Math.random(),
        title: sheetName,
        description: '',
        questions: [],
        createdAt: new Date().toLocaleDateString()
    };
    
    let i = 0;
    
    // Parse header info
    for (; i < data.length; i++) {
        if (!data[i][0]) continue;
        
        const firstCol = String(data[i][0]).toLowerCase();
        
        if (firstCol.includes('title')) {
            quiz.title = data[i][1] || sheetName;
        } else if (firstCol.includes('description')) {
            quiz.description = data[i][1] || '';
        } else if (firstCol.includes('created')) {
            quiz.createdAt = data[i][1] || new Date().toLocaleDateString();
        } else if (firstCol.includes('question #')) {
            // Found the questions header
            break;
        }
    }
    
    // Parse questions
    for (i = i + 1; i < data.length; i++) {
        if (!data[i] || !data[i][0]) continue;
        
        const firstCol = String(data[i][0]).trim();
        if (!firstCol || isNaN(parseInt(firstCol))) continue;
        
        const questionText = data[i][1] || '';
        if (!questionText) continue;
        
        const options = [
            data[i][2] || '',
            data[i][3] || '',
            data[i][4] || '',
            data[i][5] || ''
        ].filter(opt => opt);
        
        if (options.length < 2) continue;
        
        const correctAnswerText = data[i][6] || '';
        let correctAnswer = 0;
        
        if (correctAnswerText) {
            correctAnswer = options.indexOf(correctAnswerText);
            if (correctAnswer === -1) correctAnswer = 0;
        }
        
        quiz.questions.push({
            text: questionText,
            options: options,
            correctAnswer: correctAnswer
        });
    }
    
    return quiz;
}

// Format Guide Functions
function showFormatGuide() {
    showScreen('formatGuideScreen');
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Activate selected button
    event.target.classList.add('active');
}

// Initialize
goHome();
