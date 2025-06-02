document.addEventListener('DOMContentLoaded', () => {
    const numColumnsInput = document.getElementById('numColumns');
    const applyColumnsBtn = document.getElementById('applyColumns');
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

    let currentColumns = parseInt(numColumnsInput.value); // Default to 2

    // --- Core Table Management Functions ---

    function createColumnHeader(index) {
        const th = document.createElement('th');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Column ${index + 1}`;
        input.value = `Column ${index + 1}`; // Default header text
        input.dataset.colIndex = index; // Store index for reference
        input.addEventListener('input', saveColumnHeader);
        th.appendChild(input);
        return th;
    }

    function saveColumnHeader(event) {
        const colIndex = event.target.dataset.colIndex;
        // This will be saved with the data later or separately if needed
        // For now, it just updates the visual header
    }

    function updateTableColumns() {
        const newColumns = parseInt(numColumnsInput.value);
        if (isNaN(newColumns) || newColumns < 2 || newColumns > 5) {
            alert('Please enter a number between 2 and 5 for columns.');
            numColumnsInput.value = currentColumns; // Reset to previous valid value
            return;
        }

        currentColumns = newColumns;

        // Update Headers
        tableHeaderRow.innerHTML = ''; // Clear existing headers
        for (let i = 0; i < currentColumns; i++) {
            tableHeaderRow.appendChild(createColumnHeader(i));
        }
        // Add delete column for rows
        tableHeaderRow.innerHTML += '<th></th>'; // Empty header for delete button column

        // Update Rows
        const rows = Array.from(tableBody.children);
        rows.forEach(row => {
            // Remove/add cells to match new column count
            while (row.children.length > currentColumns + 1) { // +1 for delete button
                row.removeChild(row.lastChild);
            }
            while (row.children.length < currentColumns + 1) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'text';
                td.appendChild(input);
                row.insertBefore(td, row.lastChild); // Insert before delete button cell
            }
        });

        // Initialize table if empty
        if (tableBody.children.length === 0) {
            addRow();
        }
        saveDataToLocalStorage(); // Save changes to structure
    }

    function addRow(data = Array(currentColumns).fill('')) {
        const tr = document.createElement('tr');
        for (let i = 0; i < currentColumns; i++) {
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
        deleteBtn.textContent = 'X';
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
            // Reset to default columns if desired, or keep current
            numColumnsInput.value = 2;
            updateTableColumns(); // This will also add an empty row
            localStorage.removeItem('wordListData'); // Clear stored data
            localStorage.removeItem('columnHeaders'); // Clear stored headers
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

        const columnHeaders = Array.from(tableHeaderRow.querySelectorAll('th input[type="text"]')).map(input => input.value);

        const dataToSave = {
            columns: currentColumns,
            headers: columnHeaders,
            rows: allRowsData
        };
        localStorage.setItem('wordListData', JSON.stringify(dataToSave));
    }

    function loadDataFromLocalStorage() {
        const savedData = localStorage.getItem('wordListData');
        if (savedData) {
            const data = JSON.parse(savedData);
            numColumnsInput.value = data.columns;
            currentColumns = data.columns; // Update current columns for consistency

            // Load Headers
            tableHeaderRow.innerHTML = '';
            data.headers.forEach((headerText, index) => {
                const th = createColumnHeader(index);
                th.querySelector('input').value = headerText; // Set saved header text
                tableHeaderRow.appendChild(th);
            });
            tableHeaderRow.innerHTML += '<th></th>'; // Empty header for delete button column


            // Load Rows
            tableBody.innerHTML = ''; // Clear current rows
            data.rows.forEach(rowData => {
                addRow(rowData); // Add row with saved data
            });

            // Ensure at least one empty row if no data was loaded
            if (data.rows.length === 0) {
                addRow();
            }
        } else {
            // If no data, initialize with default
            updateTableColumns();
        }
    }

    // --- CSV Import/Export ---

    function exportToCSV() {
        const rows = [];
        // Add headers
        const headerInputs = Array.from(tableHeaderRow.querySelectorAll('th input[type="text"]'));
        const headers = headerInputs.map(input => `"${input.value.replace(/"/g, '""')}"`); // Quote and escape
        rows.push(headers.join(','));

        // Add data rows
        Array.from(tableBody.children).forEach(row => {
            const rowData = Array.from(row.querySelectorAll('td input[type="text"]'))
                .map(input => `"${input.value.replace(/"/g, '""')}"`); // Quote and escape
            rows.push(rowData.join(','));
        });

        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vocab-review-wordlist-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up
    }

    function importFromCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            const lines = csvText.split('\n').filter(line => line.trim() !== ''); // Remove empty lines

            if (lines.length === 0) {
                alert('CSV file is empty or malformed.');
                return;
            }

            // Assume first line is header, parse it to determine columns
            const headerValues = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const newNumColumns = headerValues.length;

            if (newNumColumns < 2 || newNumColumns > 5) {
                alert(`CSV file has ${newNumColumns} columns. Cannot import. Please ensure 2-5 columns.`);
                return;
            }

            // Update UI to match CSV columns
            numColumnsInput.value = newNumColumns;
            updateTableColumns(); // This will clear existing and set up new structure

            // Set headers
            const currentHeaderInputs = Array.from(tableHeaderRow.querySelectorAll('th input[type="text"]'));
            headerValues.forEach((val, index) => {
                if (currentHeaderInputs[index]) {
                    currentHeaderInputs[index].value = val;
                }
            });


            // Populate table body with data from CSV
            tableBody.innerHTML = ''; // Clear existing rows
            for (let i = 1; i < lines.length; i++) { // Start from second line (data rows)
                const rowValues = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                // Ensure row has correct number of columns, padding with empty strings if needed
                const paddedRowValues = Array(newNumColumns).fill('').map((_, idx) => rowValues[idx] || '');
                addRow(paddedRowValues);
            }
            saveDataToLocalStorage(); // Save imported data
        };
        reader.readAsText(file);
    }


    // --- Event Listeners ---
    applyColumnsBtn.addEventListener('click', updateTableColumns);
    addRowBtn.addEventListener('click', () => addRow());
    clearAllBtn.addEventListener('click', clearAllData);
    saveLocalBtn.addEventListener('click', saveDataToLocalStorage); // Redundant if inputs save on change, but good for explicit save
    loadLocalBtn.addEventListener('click', loadDataFromLocalStorage); // Explicit load button
    exportCSVBtn.addEventListener('click', exportToCSV);
    importCSVBtn.addEventListener('click', () => importCSVInput.click()); // Trigger hidden file input
    importCSVInput.addEventListener('change', importFromCSV);

    // Initial setup
    loadDataFromLocalStorage(); // Attempt to load saved data on page load
});