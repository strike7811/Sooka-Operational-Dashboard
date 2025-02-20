const modal = document.getElementById("addRecordModal");
const addRecordBtn = document.getElementById("addRecordBtn");
const closeBtn = document.querySelector(".close");
const form = document.getElementById("recordForm");
const tableBody = document.getElementById("tableBody");
const cancelBtn = document.querySelector('.btn-cancel');

addRecordBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

cancelBtn.addEventListener('click', () => {
    modal.style.display = "none";
});

document.getElementById('recordForm').addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        
        const inputs = Array.from(this.querySelectorAll('input'));
        
        inputs.forEach(input => {
            input.setAttribute('autocomplete', 'off');
        });
        
        const currentIndex = inputs.indexOf(document.activeElement);
        
        if (currentIndex > -1) {
            let nextIndex;
            if (e.key === 'ArrowUp') {
                if (currentIndex === 0) return;
                nextIndex = currentIndex - 1;
            } else {
                if (currentIndex === inputs.length - 1) return;
                nextIndex = currentIndex + 1;
            }
            
            inputs[nextIndex].focus();
            inputs[nextIndex].select();
        }
    }
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    try {
        const formData = {
            channelList: document.getElementById("channelList").value,
            status: document.getElementById("status").value,
            vodAssets: document.getElementById("vodAssets").value,
            vodPackage: document.getElementById("vodPackage").value,
            providerContent: document.getElementById("providerContent").value,
            linearEPG: document.getElementById("linearEPG").value,
            linearPoster: document.getElementById("linearPoster").value,
            linearPlayback: document.getElementById("linearPlayback").value,
            maxisEPG: document.getElementById("maxisEPG").value,
            maxisPoster: document.getElementById("maxisPoster").value,
            maxisPlayback: document.getElementById("maxisPlayback").value
        };

        if (!Object.values(formData).every(value => value)) {
            alert("Please fill in all required fields");
            return;
        }

        addNewRecord(formData);
        form.reset();
        modal.style.display = "none";
        
        const totalRows = document.querySelectorAll('#tableBody tr').length;
        if (totalRows > recordsPerPage) {
            currentPage = 1;
        }
        updatePagination();
        
    } catch (error) {
        console.error("Detailed error:", error);
        console.error("Error stack:", error.stack);
        alert(`Error adding record: ${error.message}`);
    }
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

function handleDepartmentChange() {
    const department = document.getElementById('departmentSelect').value;
    const table = document.querySelector('table');
    const headers = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tbody tr');

    const maxisColumns = [8, 9, 10];
    const sookaColumns = [3, 5, 6, 7];

    headers.forEach((header, index) => {
        header.style.display = '';
        rows.forEach(row => {
            row.cells[index].style.display = '';
        });
    });

    switch(department) {
        case 'Ads Operation':
            maxisColumns.forEach(index => {
                headers[index].style.display = 'none';
                rows.forEach(row => {
                    row.cells[index].style.display = 'none';
                });
            });
            break;
            
        case 'MCMC':
            sookaColumns.forEach(index => {
                headers[index].style.display = 'none';
                rows.forEach(row => {
                    row.cells[index].style.display = 'none';
                });
            });
            break;
            
        case 'Content Right Tracker':
            break;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    handleDepartmentChange();
});

let currentPage = 1;
const recordsPerPage = 10;
let filteredRows = [];

function updatePagination() {
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    
    rows.forEach(row => row.style.display = 'none');
    
    const department = document.getElementById('departmentSelect').value;
    filteredRows = rows.filter(row => {
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / recordsPerPage));
    
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, filteredRows.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        filteredRows[i].style.display = '';
    }
}

function addNewRecord(formData) {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>${formData.channelList}</td>
        <td>${formData.status}</td>
        <td>${formData.vodAssets}</td>
        <td>${formData.vodPackage}</td>
        <td>${formData.providerContent}</td>
        <td>${formData.linearEPG}</td>
        <td>${formData.linearPoster}</td>
        <td>${formData.linearPlayback}</td>
        <td>${formData.maxisEPG}</td>
        <td>${formData.maxisPoster}</td>
        <td>${formData.maxisPlayback}</td>
    `;
    

    tableBody.insertBefore(newRow, tableBody.firstChild);
    
    currentPage = 1;
    updatePagination();
}

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredRows.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
    }
});

document.getElementById('departmentSelect').addEventListener('change', function() {
    currentPage = 1;
    handleDepartmentChange();
    updatePagination();
});

document.addEventListener('DOMContentLoaded', function() {
    updatePagination();
});