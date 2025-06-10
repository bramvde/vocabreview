document.addEventListener('DOMContentLoaded', () => {
    const addColumnBtn = document.getElementById('addColumn');
    const addRowBtn = document.getElementById('addRow');
    const clearAllBtn = document.getElementById('clearAll');
    const saveLocalBtn = document.getElementById('saveLocal');
    const loadLocalBtn = document.getElementById('loadLocal');
    const exportCSVBtn = document.getElementById('exportCSV');
    const importCSVBtn = document.getElementById('importCSVBtn');
    const importCSVInput = document.getElementById('importCSV');
    const wordListTable = document.getElementById('wordListTable');
    const tableHeaderRow = document.getElementById('tableHeader');
    const tableBody = wordListTable.querySelector('tbody');
    const wordlistNameInput = document.getElementById('wordlistName');
    const configureQuizBtn = document.getElementById('configureQuiz');
    const startQuizBtn = document.getElementById('startQuiz');
    const endQuizBtn = document.getElementById('endQuiz');
    const quizSection = document.getElementById('quiz-section');

    const MIN_COLUMNS = 2; // Keep a minimum of 2 columns
    const MAX_COLUMNS = 5; // Keep a maximum of 5 columns (or your desired limit)

    // --- Core Table Management Functions ---

    function createColumnHeader(index, headerText = `Column ${index + 1}`) {
        const th = document.createElement('th');
        th.classList.add('column-header-cell'); // Add a class for styling/selection

        const headerContainer = document.createElement('div');
        headerContainer.style.display = 'flex';
        headerContainer.style.alignItems = 'center';
        headerContainer.style.gap = '5px'; // Add some spacing between input and button

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Column ${index + 1}`;
        input.value = headerText; // Default or provided header text
        input.dataset.colIndex = index;
        input.addEventListener('input', (event) => {
            console.log('Header input changed'); // Debug
            saveDataToLocalStorage();
        });


        headerContainer.appendChild(input);

        // Add remove column button if current columns > MIN_COLUMNS
        const currentColumnCount = tableHeaderRow.children.length - 1; // Number of existing data columns before this one is added
        if (currentColumnCount > MIN_COLUMNS) {
            const removeColBtn = document.createElement('button');
            removeColBtn.textContent = 'x'; // Simple minus sign
            removeColBtn.classList.add('remove-column-btn');
            removeColBtn.title = `Remove Column ${index + 1}`;
            removeColBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent input click when button is clicked
                removeColumn(removeColBtn.parentElement.parentElement.cellIndex); // Get the index of the column to remove
            });
            headerContainer.appendChild(removeColBtn);
        }

        th.appendChild(headerContainer);

        return th;

    }

    function addColumn() {
        const currentColumnCount = tableHeaderRow.children.length - 1; // Subtract 1 for the delete row header
        if (currentColumnCount >= MAX_COLUMNS) {
            alert(`You cannot add more than ${MAX_COLUMNS} columns.`);
            return;
        }

        // Add header for new column
        const newColIndex = currentColumnCount;
        const newTh = createColumnHeader(newColIndex);
        tableHeaderRow.insertBefore(newTh, tableHeaderRow.lastChild); // Insert before delete row header

        // Add a new cell to each existing row
        Array.from(tableBody.children).forEach(row => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.addEventListener('input', saveDataToLocalStorage);
            td.appendChild(input);
            row.insertBefore(td, row.lastChild); // Insert before delete button cell
        });

        // Update all column headers to potentially show/hide delete buttons
        updateColumnHeadersDisplay();

        // Ensure at least one row exists after adding column
        if (tableBody.children.length === 0) {
            addRow();
        }
        saveDataToLocalStorage();
    }

    // New function to remove a specific column by index
    function removeColumn(colIndexToRemove) {
        const currentColumnCount = tableHeaderRow.children.length - 1; // Subtract 1 for the delete row header
        if (currentColumnCount <= MIN_COLUMNS) {
            alert(`You must have at least ${MIN_COLUMNS} columns.`);
            return;
        }

        if (!confirm(`Are you sure you want to remove Column ${colIndexToRemove + 1}? All data in this column will be lost.`)) {
            return;
        }

        // Remove the header for the specified column
        tableHeaderRow.children[colIndexToRemove].remove();

        // Remove the corresponding data cell from each row
        Array.from(tableBody.children).forEach(row => {
            if (row.children[colIndexToRemove]) {
                row.children[colIndexToRemove].remove();
            }
        });

        // Re-index remaining column headers for consistency (optional but good practice)
        Array.from(tableHeaderRow.children).forEach((th, index) => {
            if (th.querySelector('input')) { // Exclude the delete row header
                th.querySelector('input').dataset.colIndex = index;
            }
        });

        // Update all column headers to potentially show/hide delete buttons
        updateColumnHeadersDisplay();
        saveDataToLocalStorage();
    }


    function addRow(data = []) {
        const tr = document.createElement('tr');
        const currentColumnCount = tableHeaderRow.children.length - 1; // Get actual number of data columns

        for (let i = 0; i < currentColumnCount; i++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = data[i] || ''; // Populate with data if provided
            input.addEventListener('input', saveDataToLocalStorage); // Save on input change
            td.appendChild(input);
            tr.appendChild(td);
        }

        // Add delete button column
        const deleteTd = document.createElement('td');
        deleteTd.classList.add('delete-column');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'x';
        deleteBtn.classList.add('delete-row-btn');
        deleteBtn.addEventListener('click', () => {
            tr.remove();
            saveDataToLocalStorage(); // Save after row deletion
        });
        deleteTd.appendChild(deleteBtn);
        tr.appendChild(deleteTd);

        tableBody.appendChild(tr);
        saveDataToLocalStorage(); // Save after adding a row
    }

    function clearAllData() {
        if (confirm('Are you sure you want to clear all word lists? This cannot be undone.')) {
            tableBody.innerHTML = '';
            tableHeaderRow.innerHTML = ''; // Clear headers
            wordlistNameInput.value = ''; // Clear wordlist name input

            // Re-initialize with MIN_COLUMNS
            for (let i = 0; i < MIN_COLUMNS; i++) {
                tableHeaderRow.appendChild(createColumnHeader(i));
            }
            // Add the placeholder for the delete row button
            tableHeaderRow.innerHTML += '<th></th>';

            addRow(); // Add initial empty row
            localStorage.removeItem('wordListData'); // Clear stored data

            saveDataToLocalStorage();
        }
    }

    // --- Local Storage Functions ---
    // Saves data to localStorage whenever something changes

    function saveDataToLocalStorage() {
        const allRowsData = [];
        Array.from(tableBody.children).forEach(row => {
            const rowData = Array.from(row.querySelectorAll('td input[type="text"]')).map(input => input.value);
            allRowsData.push(rowData);
        });

        // Robustly get header values from the input inside the header's div
        const columnHeaders = Array.from(tableHeaderRow.querySelectorAll('.column-header-cell')).map(th => {
            const input = th.querySelector('div > input[type="text"]');
            return input ? input.value : '';
        });

        const wordlistName = wordlistNameInput.value || '';

        const dataToSave = {
            name: wordlistName,
            headers: columnHeaders,
            rows: allRowsData
        };
        localStorage.setItem('wordListData', JSON.stringify(dataToSave));
    }

    // This function now dynamically creates headers based on loaded data, including remove buttons
    function loadDataFromLocalStorage() {
        const savedData = localStorage.getItem('wordListData');
        if (savedData) {
            const data = JSON.parse(savedData);

            // Restore wordlist name
            wordlistNameInput.value = data.name || '';

            tableHeaderRow.innerHTML = ''; // Clear existing headers
            data.headers.forEach((headerText, index) => {
                tableHeaderRow.appendChild(createColumnHeader(index, headerText));
            });
            // Ensure delete column header is present
            tableHeaderRow.innerHTML += '<th></th>';


            // Load Rows
            tableBody.innerHTML = ''; // Clear current rows
            data.rows.forEach(rowData => {
                // Ensure row has correct number of cells based on loaded columns
                const paddedRowData = Array(data.headers.length).fill('').map((_, idx) => rowData[idx] || '');
                addRow(paddedRowData);
            });

            if (data.rows.length === 0 || tableBody.children.length === 0) {
                addRow();
            }
        } else {
            // If no data, initialize with default MIN_COLUMNS
            tableHeaderRow.innerHTML = ''; // Clear any default HTML headers
            for (let i = 0; i < MIN_COLUMNS; i++) {
                tableHeaderRow.appendChild(createColumnHeader(i));
            }
            // Add the placeholder for the delete row button
            tableHeaderRow.innerHTML += '<th></th>';
            addRow(); // Add an initial empty row
        }
        updateColumnHeadersDisplay(); // Ensure visibility of remove buttons is correct on load
    }

    // New function to update the visibility of column delete buttons
    function updateColumnHeadersDisplay() {
        const currentColumnCount = tableHeaderRow.children.length - 1; // Get actual number of data columns
        Array.from(tableHeaderRow.querySelectorAll('.column-header-cell')).forEach((th, index) => {
            const div = th.querySelector('div');
            if (!div) return; // Skip if no div found (shouldn't happen)
            // Ensure the input exists
            if (!div.querySelector('input')) return; // Skip if no input found (shouldn't happen)
            // Get the input element
            const input = div.querySelector('input');
            if (!input) return; // Skip if no input found (shouldn't happen)

            // Update placeholder and value if default (not custom by user)
            // Only update value if it still says "Column X"
            // Or if it's currently empty, to ensure default is set
            input.placeholder = `Column ${index + 1}`;

            const removeBtn = th.querySelector('.remove-column-btn');
            if (removeBtn) {
                // Show button if column count is > MIN_COLUMNS, hide otherwise
                removeBtn.style.display = currentColumnCount > MIN_COLUMNS ? 'inline-block' : 'none';
                removeBtn.title = `Remove Column ${index + 1}`;
            } else if (currentColumnCount > MIN_COLUMNS && index >= MIN_COLUMNS) {
                // Ensure the remove button exists for columns that should have it
                if (!th.querySelector('.remove-column-btn')) { // Check if button is missing
                    const removeColBtn = document.createElement('button');
                    removeColBtn.textContent = 'x'; // Simple minus sign
                    removeColBtn.classList.add('remove-column-btn');
                    removeColBtn.title = `Remove Column ${index + 1}`;
                    removeColBtn.style.display = 'inline-block'; // Ensure consistent display
                    removeColBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        removeColumn(index);
                    });
                    th.querySelector('div').appendChild(removeColBtn); // Append to the header container
                }
            }
        });
    }

    // --- CSV Import/Export --- (No significant changes here, as it works with dynamic columns)

    function exportToCSV() {
        const rows = [];
        const wordlistName = document.getElementById('wordlistName')?.value || '';
        // Add the name as the first line
        rows.push(`"${wordlistName.replace(/"/g, '""')}"`);

        const headerInputs = Array.from(tableHeaderRow.querySelectorAll('th input[type="text"]'));
        const headers = headerInputs.map(input => `"${input.value.replace(/"/g, '""')}"`);
        rows.push(headers.join(','));

        Array.from(tableBody.children).forEach(row => {
            const rowData = Array.from(row.querySelectorAll('td input[type="text"]'))
                .map(input => `"${input.value.replace(/"/g, '""')}"`);
            rows.push(rowData.join(','));
        });

        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Sanitize the wordlist name for use in a filename
        let safeName = wordlistName.trim().replace(/[^a-z0-9_\-]+/gi, '_');
        if (!safeName) safeName = 'vocab-review-wordlist';
        const filename = `${safeName}-${new Date().toISOString().split('T')[0]}.csv`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importFromCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            const lines = csvText.split('\n').filter(line => line.trim() !== '');

            if (lines.length < 2) {
                alert('CSV file is empty or malformed.');
                return;
            }

            // First line is the name
            const nameLine = lines[0];
            const wordlistName = nameLine.replace(/^"|"$/g, '').replace(/""/g, '"');
            const headerValues = lines[1].split(',').map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const newNumColumns = headerValues.length;

            if (newNumColumns < MIN_COLUMNS || newNumColumns > MAX_COLUMNS) {
                alert(`CSV file has ${newNumColumns} columns. Please ensure between ${MIN_COLUMNS} and ${MAX_COLUMNS} columns.`);
                return;
            }

            // Set the name in the input
            const nameInput = document.getElementById('wordlistName');
            if (nameInput) nameInput.value = wordlistName;

            tableHeaderRow.innerHTML = '';
            headerValues.forEach((val, index) => {
                tableHeaderRow.appendChild(createColumnHeader(index, val));
            });
            tableHeaderRow.innerHTML += '<th></th>';

            tableBody.innerHTML = '';
            for (let i = 2; i < lines.length; i++) { // Start from line 2 (after name and header)
                const rowValues = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                const paddedRowValues = Array(newNumColumns).fill('').map((_, idx) => rowValues[idx] || '');
                addRow(paddedRowValues);
            }
            saveDataToLocalStorage();
            updateColumnHeadersDisplay(); // Update button visibility after import
        };
        reader.readAsText(file);
    }

    function configureQuiz() {
        // Create overlay background
        let overlay = document.getElementById('quiz-config-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'quiz-config-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = 0;
            overlay.style.left = 0;
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0,0,0,0.5)';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = 1000;
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = ''; // Clear previous content

        // Create modal box
        const modal = document.createElement('div');
        modal.style.background = '#fff';
        modal.style.padding = '24px';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)';
        modal.style.minWidth = '340px';
        modal.style.maxWidth = '95vw';

        // Get headers
        const headers = Array.from(tableHeaderRow.querySelectorAll('.column-header-cell input')).map(input => input.value || input.placeholder);

        // Try to load previous config from sessionStorage
        let prevConfig = null;
        try {
            prevConfig = JSON.parse(sessionStorage.getItem('quizConfig'));
        } catch (e) {
            prevConfig = null;
        }

        // Build table for selection
        let tableHtml = `<table style="border-collapse:collapse;margin-bottom:16px;">
            <thead>
                <tr>
                    <th style="padding:4px 8px;border-bottom:1px solid #ccc;"></th>
                    ${headers.map((h, i) => `<th style="padding:4px 8px;border-bottom:1px solid #ccc;">${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding:4px 8px;">Question</td>
                    ${headers.map((_, i) => `<td style="text-align:center;"><input type="checkbox" class="quiz-question-col" data-col="${i}"></td>`).join('')}
                </tr>
                <tr>
                    <td style="padding:4px 8px;">Answer</td>
                    ${headers.map((_, i) => `<td style="text-align:center;"><input type="checkbox" class="quiz-answer-col" data-col="${i}"></td>`).join('')}
                </tr>
            </tbody>
        </table>`;

        modal.innerHTML = `
            <h2>Configure Quiz</h2>
            ${tableHtml}
            <label>
                <input type="checkbox" id="quiz-random-order" checked>
                Randomize question order
            </label>
            <br><br>
            <button id="quiz-config-ok">OK</button>
            <button id="quiz-config-cancel">Cancel</button>
            <div id="quiz-config-error" style="color:red;margin-top:8px;display:none;"></div>
        `;

        // Set checkboxes based on previous config, or use defaults
        const questionChecks = modal.querySelectorAll('.quiz-question-col');
        const answerChecks = modal.querySelectorAll('.quiz-answer-col');
        const randomOrderCheckbox = modal.querySelector('#quiz-random-order');

        if (prevConfig && Array.isArray(prevConfig.questionCols) && Array.isArray(prevConfig.answerCols)) {
            questionChecks.forEach((chk, idx) => {
                chk.checked = prevConfig.questionCols.includes(idx);
            });
            answerChecks.forEach((chk, idx) => {
                chk.checked = prevConfig.answerCols.includes(idx);
            });
            if (typeof prevConfig.randomOrder === 'boolean') {
                randomOrderCheckbox.checked = prevConfig.randomOrder;
            }
        } else {
            // Default: first column as question, second as answer if possible
            if (headers.length > 0) {
                questionChecks[0].checked = true;
            }
            if (headers.length > 1) {
                answerChecks[1].checked = true;
            }
            randomOrderCheckbox.checked = true;
        }

        // Prevent a column from being both question and answer at the same time
        function syncCheckboxes() {
            questionChecks.forEach((qChk, idx) => {
                qChk.addEventListener('change', () => {
                    if (qChk.checked) {
                        answerChecks[idx].checked = false;
                    }
                });
            });
            answerChecks.forEach((aChk, idx) => {
                aChk.addEventListener('change', () => {
                    if (aChk.checked) {
                        questionChecks[idx].checked = false;
                    }
                });
            });
        }
        syncCheckboxes();

        // Button handlers
        modal.querySelector('#quiz-config-cancel').onclick = () => {
            overlay.remove();
        };
        modal.querySelector('#quiz-config-ok').onclick = () => {
            // Gather selected columns
            const questionCols = Array.from(questionChecks)
            .map((chk, idx) => chk.checked ? idx : null)
            .filter(idx => idx !== null);
            const answerCols = Array.from(answerChecks)
            .map((chk, idx) => chk.checked ? idx : null)
            .filter(idx => idx !== null);

            const errorDiv = modal.querySelector('#quiz-config-error');
            if (questionCols.length === 0 || answerCols.length === 0) {
            errorDiv.textContent = 'Please select at least one question column and one answer column.';
            errorDiv.style.display = '';
            return;
            }
            errorDiv.style.display = 'none';

            // Also store the names of the selected columns
            const questionColNames = questionCols.map(idx => headers[idx]);
            const answerColNames = answerCols.map(idx => headers[idx]);

            // Build config object
            const config = {
            questionCols,
            answerCols,
            questionColNames,
            answerColNames,
            randomOrder: randomOrderCheckbox.checked
            };
            // Save to sessionStorage
            sessionStorage.setItem('quizConfig', JSON.stringify(config));
            overlay.remove();
        };

        overlay.appendChild(modal);
    }

    function startQuiz() {
        // Get the quiz configuration from sessionStorage
        let quizConfig;
        try {
            quizConfig = JSON.parse(sessionStorage.getItem('quizConfig'));
        } catch (e) {
            alert('Quiz configuration is invalid or not set. Please configure the quiz first.');
            return;
        }

        // Get the wordlist from localStorage
        const savedData = localStorage.getItem('wordListData');
        if (!savedData) {
            alert('No word list data found. Please create or load a word list first.');
            return;
        }
        const data = JSON.parse(savedData);

        // Set the quiz name
        document.getElementById('quizName').textContent = data.name + " - QUIZ" || 'Vocabulary Quiz';

        // Clear previous quiz content
        const quizContent = document.getElementById('quizContent');
        quizContent.innerHTML = ''; // Clear previous content
        const questionCols = quizConfig.questionCols || [];
        const answerCols = quizConfig.answerCols || [];
        const questionColsNames = quizConfig.questionColNames || [];
        const answerColsNames = quizConfig.answerColNames || [];
        const randomOrder = quizConfig.randomOrder || false;
        const rows = data.rows || [];
        if (rows.length === 0) {
            alert('No words available for the quiz. Please add words to your word list.');
            return;
        }
        // Create an array of questions based on the selected columns
        let questions = [];
        rows.forEach((row, rowIndex) => {
            // Gather all question column values for this row
            const questionFields = questionCols.map(qColIndex => row[qColIndex] || '');
            // Gather all answer column values for this row
            const answerFields = answerCols.map(aColIndex => row[aColIndex] || '');
            // Only add if at least one question and one answer field is non-empty
            if (questionFields.some(q => q) && answerFields.some(a => a)) {
            questions.push({
                question: questionFields,
                answers: answerFields,
                rowIndex: rowIndex
            });
            }
        });
        if (questions.length === 0) {
            alert('No valid questions found in the selected columns. Please check your word list.');
            return;
        }
        // Randomize the order of questions if configured
        if (randomOrder) {
            questions.sort(() => Math.random() - 0.5);
        }

        // Initiate quiz

        const quizContainer = document.getElementById('quizContent');
        quizContainer.innerHTML = ''; // Clear previous quiz content

        // Create space for feedback (reserve space to prevent layout shift)
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'quizFeedback';
        feedbackDiv.style.marginBottom = '16px';
        feedbackDiv.style.minHeight = '24px'; // Reserve space for one line of feedback
        quizContainer.appendChild(feedbackDiv);
        
        // Create question element depending on the number of question columns
        questionCols.forEach((qColIndex, qIndex) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('quiz-question');
            questionDiv.innerHTML = `<strong>${questionColsNames[qIndex]}:</strong> <span class="question-text"></span>`;
            quizContainer.appendChild(questionDiv);
        }
        );

        // Create answer elements depending on the number of answer columns
        answerCols.forEach((aColIndex, aIndex) => {
            const answerDiv = document.createElement('div');
            answerDiv.classList.add('quiz-answer');
            answerDiv.innerHTML = `<input type="text" class="answer-input" placeholder="Type your answer here...">`;
            quizContainer.appendChild(answerDiv);
        });

        updateProgressBar(0, questions.length); // Initialize progress bar

        // Add Enter key handler to answer inputs
        setTimeout(() => {
            const answerInputs = Array.from(document.querySelectorAll('.quiz-answer .answer-input'));
            answerInputs.forEach((input, idx) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                e.preventDefault();
                if (idx === answerInputs.length - 1) {
                    // Last input: trigger "Next"
                    document.getElementById('nextQuestion').click();
                    // After moving to next question, focus the first input
                    setTimeout(() => {
                    const newInputs = Array.from(document.querySelectorAll('.quiz-answer .answer-input'));
                    if (newInputs[0]) newInputs[0].focus();
                    }, 0);
                } else {
                    // Not last: focus next input
                    answerInputs[idx + 1].focus();
                }
                }
            });
            });
        }, 0);

        // Real Quiz logic
        let currentQuestionIndex = 0;
        let correctAnswers = 0;
        const questionTextElements = document.querySelectorAll('.quiz-question .question-text');
        const answerInputs = document.querySelectorAll('.quiz-answer .answer-input');
        const nextButton = document.getElementById('nextQuestion');
        nextButton.textContent = 'Next';
        nextButton.classList.add('quiz-next-button');
        nextButton.addEventListener('click', () => {
            // Check answers
            let allCorrect = true;
            answerInputs.forEach((input, index) => {
            const answer = input.value.trim();
            const correctAnswer = questions[currentQuestionIndex].answers[index] || '';
            if (answer.toLowerCase() === correctAnswer.toLowerCase()) {
                input.classList.remove('incorrect');
                input.classList.add('correct');
            } else {
                input.classList.remove('correct');
                input.classList.add('incorrect');
                allCorrect = false;
            }
            });

            // Only increment score if all answers are correct for this question
            if (allCorrect) {
            correctAnswers++;
            feedbackDiv.innerHTML = '<span style="color:green;font-weight:bold;">&#10003; Correct!</span>';
            } else {
            feedbackDiv.innerHTML = `<span style="color:red;font-weight:bold;">&#10007; Incorrect! Correct answer: ${questions[currentQuestionIndex].answers.join(', ')}</span>`;
            // Add the current question to the end of the questions array to ask again later
            questions.push(questions[currentQuestionIndex]);
            }
            updateProgressBar(currentQuestionIndex + 1, questions.length);

            // Move to next question
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
            loadQuestion(currentQuestionIndex);
            } else {
            // End of quiz
            showResults(correctAnswers, questions.length);
            }
        });
        // Function to load a question
        function loadQuestion(index) {
            const question = questions[index];
            questionTextElements.forEach((el, qIndex) => {
                el.textContent = question.question[qIndex] || '';
            });
            answerInputs.forEach((input, aIndex) => {
                input.value = ''; // Clear previous answers
                input.placeholder = `${answerColsNames[aIndex]}...`;
                input.classList.remove('correct', 'incorrect'); // Reset styles
            });
        }
        // Load the first question
        loadQuestion(currentQuestionIndex);

        

        // Show the quiz section && hide the main word list section
        quizContent.style.display = 'block';
        const quizControls = document.getElementById('quizControls');
        quizControls.style.display = 'flex';
        quizSection.style.display = 'block';
        document.getElementById('list-section').style.display = 'none';
        document.getElementById('quizResults').style.display = 'none';

    }

    function updateProgressBar(current, total) {
        const progressFill = document.getElementById('quizProgressFill');
        const progressText = document.getElementById('quizProgressText');
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${current} of ${total}`;
        }
    }

    function showResults(correctAnswers, totalQuestions) {
        const quizResults = document.getElementById('quizResults');
        quizResults.innerHTML = `<h2>Quiz Completed!</h2>
            <p>You answered ${correctAnswers} out of ${totalQuestions} questions correctly.</p>
            <button id="endQuizBtn">End Quiz</button>`;
        const endQuizBtn = document.getElementById('endQuizBtn');
        endQuizBtn.addEventListener('click', endQuiz);
        quizResults.style.display = 'block';
        const quizContent = document.getElementById('quizContent');
        quizContent.style.display = 'none';
        const quizControls = document.getElementById('quizControls');
        quizControls.style.display = 'none';
    }

    function endQuiz() {
        // Hide the quiz section and show the main word list section
        quizSection.style.display = 'none';
        document.getElementById('list-section').style.display = 'block';
        const quizResults = document.getElementById('quizResults');
        quizResults.style.display = 'none'; // Hide the results section

        // Clear the quiz name
        document.getElementById('quizName').textContent = '';
    }

    // --- Event Listeners ---
    addColumnBtn.addEventListener('click', addColumn);
    addRowBtn.addEventListener('click', () => addRow());
    clearAllBtn.addEventListener('click', clearAllData);
    saveLocalBtn.addEventListener('click', saveDataToLocalStorage);
    loadLocalBtn.addEventListener('click', loadDataFromLocalStorage);
    exportCSVBtn.addEventListener('click', exportToCSV);
    importCSVBtn.addEventListener('click', () => importCSVInput.click());
    importCSVInput.addEventListener('change', importFromCSV);
    wordlistNameInput.addEventListener('input', saveDataToLocalStorage);
    configureQuizBtn.addEventListener('click', configureQuiz);
    startQuizBtn.addEventListener('click', startQuiz);
    endQuizBtn.addEventListener('click', endQuiz);

    // Initial setup
    loadDataFromLocalStorage();
});