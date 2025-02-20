function toggleNav() {
    const sidebar = document.getElementById("side_nav");
    const content = document.querySelector(".content");

    if (sidebar.classList.contains("closed")) {
        sidebar.classList.remove("closed");
        content.style.marginLeft = "250px";
    } else {
        sidebar.classList.add("closed");
        content.style.marginLeft = "0";
    }
}

function initializePage() {
    const sidebar = document.getElementById("side_nav");
    const content = document.querySelector(".content");
    
    if (sidebar && content) {
        sidebar.style.width = "250px";
        content.style.marginLeft = "250px";
    }
    
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        const modeIcon = document.getElementById('mode-icon');
        if (modeIcon) {
            modeIcon.src = 'Images/bright-mode.png';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const darkMode = localStorage.getItem('darkMode');
    
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        const modeIcon = document.getElementById('mode-icon');
        if (modeIcon) {
            modeIcon.src = 'Images/bright-mode.png';
        }
    }
});

function darkMode() {
    const body = document.body;
    const modeIcon = document.getElementById('mode-icon');

    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        if (modeIcon) {
            modeIcon.src = 'Images/bright-mode.png';
        }
    } else {
        localStorage.setItem('darkMode', 'disabled');
        if (modeIcon) {
            modeIcon.src = 'Images/night-mode.png';
        }
    }
}

document.addEventListener('DOMContentLoaded', initializePage);

window.initializePage = initializePage;

function updateNotifications() {
    const notificationContent = document.querySelector('.notification-content');
    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
    
    let campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
    let notifications = [];
    
    campaigns.forEach(campaign => {
        const endDate = new Date(campaign.endDate);
        
        if (campaign.status === 'Active' && endDate <= twoWeeksFromNow && endDate >= today) {
            const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            notifications.push({ 
                campaignName: campaign.campaignName, 
                endDate, 
                daysLeft 
            });
        }
    });
    
    const bellIcon = document.getElementById('bell-icon');
    let notificationDot = document.querySelector('.notification-dot');
    
    if (!notificationDot) {
        notificationDot = document.createElement('div');
        notificationDot.className = 'notification-dot';
        bellIcon.parentElement.appendChild(notificationDot);
    }
    
    notificationDot.style.display = notifications.length > 0 ? 'block' : 'none';
    
    notificationContent.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationContent.innerHTML = '<div class="notification-item">There are no upcoming events</div>';
        return;
    }
    
    notifications.sort((a, b) => a.endDate - b.endDate);
    
    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        notificationItem.innerHTML = `
            <div class="campaign-info">
                <div>${notification.campaignName}</div>
                <div class="days-left">Ends in ${notification.daysLeft} days</div>
            </div>
        `;
        notificationContent.appendChild(notificationItem);
    });
}

function checkAndUpdateStatus() {
    const today = new Date();
    let campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
    let statusUpdated = false;
    
    campaigns = campaigns.map(campaign => {
        const endDate = new Date(campaign.endDate);
        if (endDate < today && campaign.status === 'Active') {
            campaign.status = 'Completed';
            statusUpdated = true;
        }
        return campaign;
    });
    
    if (statusUpdated) {
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
        updateNotifications();
        
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            updateTableFromStorage();
        }
    }
}

function updateTableFromStorage() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    const campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
    tableBody.innerHTML = '';
    
    campaigns.forEach(campaign => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${campaign.campaignName}</td>
            <td>${campaign.startDate}</td>
            <td>${campaign.endDate}</td>
            <td><span class="status-cell ${getStatusClass(campaign.status)}">${campaign.status}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function getStatusClass(status) {
    const statusClasses = {
        'Active': 'status-active',
        'Inactive': 'status-inactive',
        'Completed': 'status-completed'
    };
    return statusClasses[status] || '';
}

document.addEventListener('DOMContentLoaded', function() {
    updateNotifications();
    checkAndUpdateStatus();
    setInterval(checkAndUpdateStatus, 60000);
    
    const bellIcon = document.getElementById('bell-icon');
    if (bellIcon) {
        bellIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            const panel = document.getElementById('notification-panel');
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
            updateNotifications();
            console.log("Bell icon clicked, notifications updated.");
        });
    }

    document.addEventListener('click', function(e) {
        const panel = document.getElementById('notification-panel');
        if (!e.target.closest('.notification-button')) {
            panel.style.display = 'none';
        }
    });
});