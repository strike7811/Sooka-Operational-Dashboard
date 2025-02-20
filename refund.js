document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('recordModal');
    const addButton = document.querySelector('.add-button');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const recordForm = document.getElementById('recordForm');
    const recordsContainer = document.querySelector('.records-container');

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
    
    statusFilter.addEventListener('change', function() {
        const selectedStatus = this.value;
        const records = document.querySelectorAll('.record-box');
        
        records.forEach(record => {
            const recordStatus = record.querySelector('.status-tag').classList[1];
            
            if (selectedStatus === '' || recordStatus === selectedStatus) {
                record.style.display = 'block';
            } else {
                record.style.display = 'none';
            }
        });
    });

    const searchInput = document.querySelector('.search-bar input');

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const records = document.querySelectorAll('.record-box');
        
        records.forEach(record => {
            const name = record.querySelector('.record-header h3').textContent.toLowerCase();
            const email = record.querySelector('.record-details p').textContent.toLowerCase();
            const currentStatus = document.querySelector('.status-filter select').value;
            const recordStatus = record.querySelector('.status-tag').classList[1];
            
            const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);
            const matchesStatus = currentStatus === '' || recordStatus === currentStatus;
            
            if (matchesSearch && matchesStatus) {
                record.style.display = 'block';
            } else {
                record.style.display = 'none';
            }
        });
    }

    searchInput.addEventListener('input', performSearch);

    statusFilter.addEventListener('change', performSearch);

    const totalCountElement = document.querySelector('.status-box.total .count');
    const pendingCountElement = document.querySelector('.status-box.pending .count');
    const completedCountElement = document.querySelector('.status-box.completed .count');
    const rejectedCountElement = document.querySelector('.status-box.rejected .count');

    function updateCounts() {
        const records = document.querySelectorAll('.record-box');
        let totalCount = 0;
        let pendingCount = 0;
        let completedCount = 0;
        let rejectedCount = 0;

        records.forEach(record => {
            totalCount++;
            const recordStatus = record.querySelector('.status-tag').classList[1];
            if (recordStatus === 'pending') {
                pendingCount++;
            } else if (recordStatus === 'completed') {
                completedCount++;
            } else if (recordStatus === 'rejected') {
                rejectedCount++;
            }
        });

        totalCountElement.innerText = totalCount;
        pendingCountElement.innerText = pendingCount;
        completedCountElement.innerText = completedCount;
        rejectedCountElement.innerText = rejectedCount;
    }

    recordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const selectedStatus = document.getElementById('status').value;
        const currentFilter = statusFilter.value;
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        const newRecord = document.createElement('div');
        newRecord.className = 'record-box';
        
        const customerName = document.getElementById('customerName').value;
        const customerEmail = document.getElementById('customerEmail').value;
        
        newRecord.innerHTML = `
            <div class="record-header">
                <h3>${customerName}</h3>
                <div class="status-tag ${selectedStatus}">
                    ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                </div>
            </div>
            <div class="record-details">
                <h4>Email:</h4>
                <p>${customerEmail}</p>
                <h4>Date:</h4>
                <p>${document.getElementById('issueDate').value}</p>
                <h4>Issue:</h4>
                <p>${document.getElementById('issue').value}</p>
            </div>
            <div class="record-amount">
                <div class="amount-label">Refund Amount</div>
                <div class="amount-value">RM ${document.getElementById('refundAmount').value}</div>
            </div>
        `;

        const matchesSearch = searchTerm === '' || 
            customerName.toLowerCase().includes(searchTerm) || 
            customerEmail.toLowerCase().includes(searchTerm);
        const matchesStatus = currentFilter === '' || selectedStatus === currentFilter;

        if (!matchesSearch || !matchesStatus) {
            newRecord.style.display = 'none';
        }

        recordsContainer.insertBefore(newRecord, recordsContainer.firstChild);
        
        updateCounts();

        recordForm.reset();
        modal.classList.remove('show');
    });

    window.onload = updateCounts;
}); 