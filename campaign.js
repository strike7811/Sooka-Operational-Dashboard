function setStatusStyle(status) {
    const statusClasses = {
        'Active': 'status-active',
        'Inactive': 'status-inactive',
        'Expired': 'status-expired'
    };
    
    return `status-cell ${statusClasses[status] || ''}`;
}

function createTableRow(data) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${data.campaignName}</td>
        <td>${data.startDate}</td>
        <td>${data.endDate}</td>
        <td>${data.description || 'No description provided'}</td>
        <td><span class="${setStatusStyle(data.status)}">${data.status}</span></td>
        <td>
            <button class="edit-button" onclick="editRecord('${data.campaignName}')">
                <img src="Images/edit-button.png" alt="Edit" class="icon" style="width: 20px; height: 20px;">
            </button>
            <button class="delete-button" onclick="deleteRecord('${data.campaignName}')">
                <img src="Images/delete.png" alt="Delete" class="icon" style="width: 20px; height: 20px;">
            </button>
        </td>
    `;
    return row;
}

function fetchCampaigns() {
    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        method: 'GET',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        const campaigns = data.content ? JSON.parse(atob(data.content)) : [];
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
        updateTableFromStorage();
        updatePagination();
    })
    .catch(error => {
        console.error('Error fetching campaigns:', error);
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Cannot Load the Record: ${error.message}</td></tr>`;
    });
}

function editRecord(campaignName) {
    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        method: 'GET',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const campaigns = JSON.parse(atob(data.content));
        const campaign = campaigns.find(c => c.campaignName === campaignName);
        
        if (campaign) {
            document.getElementById('campaignName').value = campaign.campaignName;
            document.getElementById('startDate').value = campaign.startDate;
            document.getElementById('endDate').value = campaign.endDate;
            document.getElementById('description').value = campaign.description || '';
            document.getElementById('status').value = campaign.status;
            
            document.getElementById('campaignForm').setAttribute('data-editing', campaignName);
            document.querySelector('#campaignForm button[type="submit"]').textContent = 'Edit Record';
            
            modal.style.display = "block";
        }
    })
    .catch(error => console.error('Error fetching campaign for edit:', error));
}

function addNewRecord(formData) {
    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        method: 'GET',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(data => {
        let campaigns = JSON.parse(atob(data.content));
        const editingCampaign = document.getElementById('campaignForm').getAttribute('data-editing');
        
        if (editingCampaign) {
            campaigns = campaigns.map(campaign => 
                campaign.campaignName === editingCampaign ? 
                    {...campaign, ...formData, timestamp: campaign.timestamp} :
                    campaign
            );
            document.getElementById('campaignForm').removeAttribute('data-editing');
            document.querySelector('#campaignForm button[type="submit"]').textContent = 'Add Record';
        } else {
            formData.timestamp = Date.now();
            campaigns.push(formData);
        }

        const updatedContent = btoa(JSON.stringify(campaigns));
        
        return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: editingCampaign ? 'Update campaign' : 'Add new campaign',
                content: updatedContent,
                sha: data.sha
            })
        });
    })
    .then(() => {
        fetchCampaigns();
        modal.style.display = "none";
        document.getElementById('campaignForm').reset();
    })
    .catch(error => console.error('Error updating campaigns:', error));
}

const modal = document.getElementById('addRecordModal');
const addBtn = document.getElementById('addRecordBtn');
const closeBtn = document.querySelector('.close');

addBtn.onclick = function() {
    modal.style.display = "block";
}

closeBtn.onclick = function() {
    modal.style.display = "none";
    document.getElementById('campaignForm').reset();
    document.getElementById('campaignForm').removeAttribute('data-editing');
    document.querySelector('#campaignForm button[type="submit"]').textContent = 'Add Record';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

document.getElementById('campaignForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        campaignName: document.getElementById('campaignName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        description: document.getElementById('description').value,
        status: document.getElementById('status').value
    };

    addNewRecord(formData);
});

document.getElementById('statusFilter').addEventListener('change', function() {
    const selectedStatus = this.value;
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach(row => {
        const statusCell = row.querySelector('td:last-child span');
        const status = statusCell.textContent.trim();
        
        if (selectedStatus === 'all' || status === selectedStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

document.getElementById('searchInput').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach(row => {
        const campaignName = row.querySelector('td:first-child').textContent.toLowerCase();
        const matchesSearch = campaignName.includes(searchTerm);
        const statusFilter = document.getElementById('statusFilter').value;
        const status = row.querySelector('td:last-child span').textContent.trim();

        if (statusFilter === 'all') {
            row.style.display = matchesSearch ? '' : 'none';
        } else {
            row.style.display = (matchesSearch && status === statusFilter) ? '' : 'none';
        }
    });
});

let currentPage = 1;
const recordsPerPage = 9;

function updatePagination() {
    const campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
    const totalPages = Math.ceil(campaigns.length / recordsPerPage);
    
    document.getElementById('totalPages').textContent = totalPages || 1;
    document.getElementById('currentPage').textContent = currentPage;

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
}

function changePage(direction) {
    const campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
    const totalPages = Math.ceil(campaigns.length / recordsPerPage);
    
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    updateTableFromStorage();
    updatePagination();
}

function updateTableFromStorage() {
    const tableBody = document.getElementById('tableBody');
    let campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
    
    campaigns.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const paginatedCampaigns = campaigns.slice(start, end);

    if (paginatedCampaigns.length === 0) {
        const noRecordsRow = document.createElement('tr');
        noRecordsRow.innerHTML = '<td colspan="6" style="text-align: center;">Record not found</td>';
        tableBody.appendChild(noRecordsRow);
    } else {
        paginatedCampaigns.forEach(campaign => {
            const row = createTableRow(campaign);
            tableBody.appendChild(row);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    fetchCampaigns();
    
    document.getElementById('searchInput').addEventListener('input', function() {
        currentPage = 1;
        filterRecords();
    });

    document.getElementById('statusFilter').addEventListener('change', function() {
        currentPage = 1;
        filterCampaigns();
    });

    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
});

function filterTable(searchTerm, status) {
    const tableBody = document.getElementById('tableBody');
    const campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];

    const filteredCampaigns = campaigns.filter(campaign => {
        const matchesSearch = campaign.campaignName.toLowerCase().includes(searchTerm);
        const matchesStatus = status ? campaign.status === status : true;
        return matchesSearch && matchesStatus;
    });

    if (filteredCampaigns.length === 0) {
        const noRecordsRow = document.createElement('tr');
        noRecordsRow.innerHTML = '<td colspan="5">No records found</td>';
        tableBody.appendChild(noRecordsRow);
    }
}

function filterCampaigns() {
    const filterValue = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#tableBody tr');

    rows.forEach(row => {
        const statusCell = row.querySelector('.status-cell');
        if (statusCell) {
            const statusText = statusCell.textContent.trim();
            if (filterValue === 'all' || statusText === filterValue) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

function filterRecords() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const rows = document.querySelectorAll('#tableBody tr');

    rows.forEach(row => {
        const campaignName = row.querySelector('td:first-child').textContent.toLowerCase();
        const matchesSearch = campaignName.includes(searchTerm);
        const statusFilter = document.getElementById('statusFilter').value;
        const statusCell = row.querySelector('.status-cell');
        const statusText = statusCell ? statusCell.textContent.trim() : '';

        if ((statusFilter === 'all' || statusText === statusFilter) && matchesSearch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function deleteRecord(campaignName) {
    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        method: 'GET',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(data => {
        let campaigns = data.content ? JSON.parse(atob(data.content)) : [];
        campaigns = campaigns.filter(campaign => campaign.campaignName !== campaignName);
        
        const updatedContent = btoa(JSON.stringify(campaigns));
        const sha = data.sha;

        fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Delete campaign',
                content: updatedContent,
                sha: sha
            })
        })
        .then(() => {
            fetchCampaigns();
        })
        .catch(error => console.error('Error deleting campaign:', error));
    })
    .catch(error => console.error('Error fetching campaigns:', error));
}

function downloadCSV() {
    const tableBody = document.getElementById("tableBody");
    const rows = Array.from(tableBody.querySelectorAll("tr"));

    if (rows.length === 0) {
        return;
    }

    const columnNames = "Campaign Name,Start Date,End Date,Description,Status";
    const csvContent = columnNames + "\n"
        + rows.map(row => 
            Array.from(row.cells)
                .slice(0, -1)
                .map(cell => cell.innerText)
                .join(",")
        ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "campaign_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

document.getElementById("downloadCsvBtn").addEventListener("click", downloadCSV);

