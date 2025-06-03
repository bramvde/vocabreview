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
        input.addEventListener('input', saveDataToLocalStorage); // Save header changes

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

        tableHeaderRow.appendChild(th);

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
                createColumnHeader(i);
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
                createColumnHeader(index, headerText);
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
                createColumnHeader(i);
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
                createColumnHeader(index, val);
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

    // Initial setup
    loadDataFromLocalStorage(); // Attempt to load saved data on page load
});