const REFUNDS_URL = 'https://raw.githubusercontent.com/strike7811/Sooka-Operational-Dashboard/main/refunds.json';

let currentPage = 1;
const recordsPerPage = 4;
let totalRecords = [];
let filteredRecords = [];

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('recordModal');
    const addButton = document.querySelector('.add-button');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const recordForm = document.getElementById('recordForm');
    const recordsContainer = document.querySelector('.records-container');

    function displayRecords(records) {
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const recordsToShow = records.slice(startIndex, endIndex);
        
        recordsContainer.innerHTML = '';
        recordsToShow.forEach(record => {
            const recordElement = createRefundRecord(record);
            recordsContainer.appendChild(recordElement);
        });

        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        const currentPageSpan = document.querySelector('.current-page');
        
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = endIndex >= records.length;
        currentPageSpan.textContent = currentPage;
    }

    function fetchRefunds() {
        fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/refunds.json`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        })
        .then(response => response.json())
        .then(data => {
            try {
                totalRecords = JSON.parse(atob(data.content));
                filteredRecords = [];
                displayRecords(totalRecords);
                updateCounts();
            } catch (error) {
                console.error('Error parsing refunds data:', error);
                recordsContainer.innerHTML = '<div class="error-message">Error parsing refund records</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching refunds:', error);
            recordsContainer.innerHTML = '<div class="error-message">Unable to load refund records</div>';
        });
    }

    function createRefundRecord(refund) {
        const newRecord = document.createElement('div');
        newRecord.className = 'record-box';
        
        newRecord.innerHTML = `
            <div class="record-header">
                <h3>${refund.customerName}</h3>
                <div class="status-tag ${refund.status}">
                    ${refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                </div>
            </div>
            <div class="record-details">
                <h4>Email:</h4>
                <p>${refund.customerEmail}</p>
                <h4>Date:</h4>
                <p>${refund.issueDate}</p>
                <h4>Issue:</h4>
                <p>${refund.issue}</p>
            </div>
            <div class="record-amount">
                <div class="amount-label">Refund Amount</div>
                <div class="amount-value">RM ${refund.refundAmount}</div>
            </div>
        `;

        return newRecord;
    }

    addButton.addEventListener('click', () => {
        modal.classList.add('show');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    const statusFilter = document.querySelector('.status-filter select');
    const searchInput = document.querySelector('.search-bar input');

    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayRecords(filteredRecords.length > 0 ? filteredRecords : totalRecords);
        }
    });

    nextBtn.addEventListener('click', () => {
        const records = filteredRecords.length > 0 ? filteredRecords : totalRecords;
        if (currentPage * recordsPerPage < records.length) {
            currentPage++;
            displayRecords(records);
        }
    });

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const currentStatus = statusFilter.value;
        
        filteredRecords = totalRecords.filter(record => {
            const matchesSearch = record.customerName.toLowerCase().includes(searchTerm) || 
                                record.customerEmail.toLowerCase().includes(searchTerm);
            const matchesStatus = currentStatus === '' || record.status === currentStatus;
            return matchesSearch && matchesStatus;
        });

        currentPage = 1;
        displayRecords(filteredRecords);
        
        let totalCount = 0;
        let pendingCount = 0;
        let completedCount = 0;
        let rejectedCount = 0;

        filteredRecords.forEach(record => {
            totalCount++;
            if (record.status === 'pending') pendingCount++;
            else if (record.status === 'completed') completedCount++;
            else if (record.status === 'rejected') rejectedCount++;
        });

        document.querySelector('.status-box.total .count').innerText = totalCount;
        document.querySelector('.status-box.pending .count').innerText = pendingCount;
        document.querySelector('.status-box.completed .count').innerText = completedCount;
        document.querySelector('.status-box.rejected .count').innerText = rejectedCount;
    }

    searchInput.addEventListener('input', performSearch);
    statusFilter.addEventListener('change', performSearch);

    function updateCounts() {
        let totalCount = 0;
        let pendingCount = 0;
        let completedCount = 0;
        let rejectedCount = 0;

        // 使用 totalRecords 而不是 DOM 元素来计算
        totalRecords.forEach(record => {
            totalCount++;
            if (record.status === 'pending') pendingCount++;
            else if (record.status === 'completed') completedCount++;
            else if (record.status === 'rejected') rejectedCount++;
        });

        document.querySelector('.status-box.total .count').innerText = totalCount;
        document.querySelector('.status-box.pending .count').innerText = pendingCount;
        document.querySelector('.status-box.completed .count').innerText = completedCount;
        document.querySelector('.status-box.rejected .count').innerText = rejectedCount;
    }

    recordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newRefund = {
            customerName: document.getElementById('customerName').value,
            customerEmail: document.getElementById('customerEmail').value,
            issueDate: document.getElementById('issueDate').value,
            issue: document.getElementById('issue').value,
            refundAmount: document.getElementById('refundAmount').value,
            status: document.getElementById('status').value,
            zendeskTicket: document.getElementById('zendesk-ticket').value
        };

        fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/refunds.json`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const refunds = JSON.parse(atob(data.content));
            refunds.unshift(newRefund);
            
            return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/refunds.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Add new refund record',
                    content: btoa(JSON.stringify(refunds)),
                    sha: data.sha
                })
            });
        })
        .then(() => {
            recordForm.reset();
            modal.classList.remove('show');
            // 添加成功后重新加载页面
            window.location.reload();
        })
        .catch(error => {
            console.error('Error adding new refund:', error);
            alert('Error adding new refund. Please try again.');
        });
    });

    fetchRefunds();
}); 