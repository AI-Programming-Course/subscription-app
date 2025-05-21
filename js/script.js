// ==========================================
// SubTracker - Enhanced Subscription Manager
// ==========================================

// Initialize subscriptions from localStorage or empty array
let subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || [];
let editIndex = -1; // For tracking which subscription is being edited

// Cache DOM elements
const subscriptionsList = document.getElementById('subscriptions-list');
const subscriptionForm = document.getElementById('subscription-form');
const subscriptionModal = document.getElementById('subscription-modal');
const modalTitle = document.getElementById('modal-title');
const addButton = document.getElementById('add-btn');
const closeButton = document.querySelector('.close');
const cancelButton = document.getElementById('cancel-btn');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const sortBySelect = document.getElementById('sort-by');
const themeToggle = document.getElementById('theme-toggle');

// Dashboard elements
const monthlyTotal = document.getElementById('monthly-cost');
const yearlyTotal = document.getElementById('yearly-cost');
const subCount = document.getElementById('sub-count');
const nextRenewal = document.getElementById('next-renewal');

/**
 * Theme Toggle Functionality
 */
function initTheme() {
    // Check for stored theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Redraw charts with new theme colors
    setTimeout(updateCharts, 100);
}

function updateThemeIcon(theme) {
    themeToggle.innerHTML = theme === 'light' ?
        '<i class="fas fa-moon"></i>' :
        '<i class="fas fa-sun"></i>';
}

/**
 * Modal Control Functions
 */
function openModal(isEdit = false, index = -1) {
    modalTitle.textContent = isEdit ? 'Edit Subscription' : 'Add New Subscription';
    subscriptionModal.style.display = 'flex';
    editIndex = index;

    // Clear form if adding new, populate if editing
    if (isEdit && index >= 0) {
        const sub = subscriptions[index];
        document.getElementById('name').value = sub.name;
        document.getElementById('price').value = sub.price;
        document.getElementById('category').value = sub.category || 'other';
        document.getElementById('date').value = sub.date;
        document.getElementById('notes').value = sub.notes || '';
    } else {
        subscriptionForm.reset();

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }
}

function closeModal() {
    subscriptionModal.style.display = 'none';
    subscriptionForm.reset();
    editIndex = -1;
}

/**
 * Data Management Functions
 */
function saveSubscriptions() {
    console.log('Saving subscriptions to localStorage:', subscriptions);
    try {
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        console.log('Subscriptions saved successfully');
    } catch (error) {
        console.error('Error saving subscriptions:', error);
    }
}

function calculateDaysUntilRenewal(dateString) {
    const renewalDate = new Date(dateString);
    const today = new Date();

    // Reset time portion for accurate day calculation
    renewalDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = renewalDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

function getNextRenewalInfo() {
    if (subscriptions.length === 0) return { name: 'None', days: Infinity };

    let nextSub = subscriptions[0];
    let minDays = calculateDaysUntilRenewal(nextSub.date);

    subscriptions.forEach(sub => {
        const days = calculateDaysUntilRenewal(sub.date);
        if (days >= 0 && days < minDays) {
            minDays = days;
            nextSub = sub;
        }
    });

    return {
        name: nextSub.name,
        days: minDays,
        date: new Date(nextSub.date)
    };
}

/**
 * Update Dashboard Statistics
 */
function updateDashboard() {
    // Calculate totals
    const monthly = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.price), 0);
    const yearly = monthly * 12;

    // Update dashboard
    monthlyTotal.textContent = formatCurrency(monthly);
    yearlyTotal.textContent = formatCurrency(yearly);
    subCount.textContent = subscriptions.length;

    // Find next renewal
    const next = getNextRenewalInfo();

    if (next.name === 'None') {
        nextRenewal.textContent = 'None';
    } else {
        const dateOptions = { month: 'short', day: 'numeric' };
        let renewalText = `${next.name} - ${next.date.toLocaleDateString(undefined, dateOptions)}`;

        if (next.days === 0) {
            renewalText += ' (Today)';
        } else if (next.days > 0) {
            renewalText += ` (in ${next.days} day${next.days === 1 ? '' : 's'})`;
        } else {
            renewalText += ' (Overdue)';
        }

        nextRenewal.textContent = renewalText;
    }
}

/**
 * Filter and Sort Functions
 */
function filterAndSortSubscriptions() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    const sortValue = sortBySelect.value;

    // Validate subscriptions array first
    const validSubscriptions = subscriptions.filter(sub =>
        sub && typeof sub === 'object' && sub.name && typeof sub.name === 'string'
    );

    // If we found invalid subscriptions, log and fix them
    if (validSubscriptions.length !== subscriptions.length) {
        console.error('Found invalid subscriptions:',
            subscriptions.filter(sub => !(sub && typeof sub === 'object' && sub.name && typeof sub.name === 'string')));
        subscriptions = validSubscriptions;
        saveSubscriptions(); // Save the fixed array
    }

    // First, filter by search term and category
    let filtered = subscriptions.filter(sub => {
        // Safety check before accessing properties
        const subName = (sub.name && typeof sub.name === 'string') ? sub.name.toLowerCase() : '';
        const subNotes = (sub.notes && typeof sub.notes === 'string') ? sub.notes.toLowerCase() : '';

        const matchesSearch = subName.includes(searchTerm) || subNotes.includes(searchTerm);
        const matchesCategory = categoryValue === 'all' || sub.category === categoryValue;

        return matchesSearch && matchesCategory;
    });

    // Then, sort the filtered results
    filtered.sort((a, b) => {
        switch (sortValue) {
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            case 'price':
                return parseFloat(b.price || 0) - parseFloat(a.price || 0);
            case 'date':
                return new Date(a.date || 0) - new Date(b.date || 0);
            default:
                return 0;
        }
    });

    displaySubscriptions(filtered);
}

/**
 * Display Subscriptions in UI
 */
function displaySubscriptions(subsToDisplay = subscriptions) {
    subscriptionsList.innerHTML = '';

    if (subsToDisplay.length === 0) {
        subscriptionsList.innerHTML = '<p class="empty-message">No subscriptions found.</p>';
        return;
    }

    subsToDisplay.forEach((subscription, index) => {
        // Find the actual index in the main subscriptions array
        const originalIndex = subscriptions.findIndex(s =>
            s.name === subscription.name &&
            s.date === subscription.date &&
            s.price === subscription.price);

        // Calculate days until renewal
        const daysUntil = calculateDaysUntilRenewal(subscription.date);

        // Create status tag based on days until renewal
        let statusTag = '';
        if (daysUntil < 0) {
            statusTag = '<span class="status-tag overdue">Overdue</span>';
        } else if (daysUntil === 0) {
            statusTag = '<span class="status-tag due-today">Today</span>';
        } else if (daysUntil <= 7) {
            statusTag = `<span class="status-tag due-soon">${daysUntil} day${daysUntil === 1 ? '' : 's'}</span>`;
        }

        // Format renewal date
        const renewalDate = new Date(subscription.date);
        const formattedDate = renewalDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Create subscription item
        const subscriptionItem = document.createElement('div');
        subscriptionItem.classList.add('subscription-item');
        subscriptionItem.innerHTML = `
            <div class="subscription-header">
                <div>
                    <h3>${subscription.name}</h3>
                    <span class="subscription-category category-${subscription.category || 'other'}">${subscription.category || 'other'}</span>
                </div>
            </div>
            <div class="subscription-body">
                <div class="subscription-price">${formatCurrency(subscription.price)}/month</div>
                <div class="subscription-detail">
                    <i class="far fa-calendar-alt"></i>
                    <span>Renews: ${formattedDate} ${statusTag}</span>
                </div>
                ${subscription.notes ? `
                <div class="subscription-detail">
                    <i class="far fa-sticky-note"></i>
                    <span>${subscription.notes}</span>
                </div>` : ''}
            </div>
            <div class="subscription-actions">
                <button class="edit-btn" data-index="${originalIndex}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-btn" data-index="${originalIndex}">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;

        subscriptionsList.appendChild(subscriptionItem);
    });

    // Update dashboard after display update
    updateDashboard();
}

/**
 * Handle Add/Edit Form Submission
 */
function handleFormSubmit(e) {
    e.preventDefault();

    // Add debugging
    console.log('Form submitted');

    // Get form values
    const name = document.getElementById('name').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const notes = document.getElementById('notes').value.trim();

    // Log the values to check if they are correctly captured
    console.log('Form values:', { name, price, category, date, notes });

    // Validate input
    if (!name || isNaN(price) || price <= 0 || !date) {
        console.log('Validation failed', { name, price, date });
        alert('Please fill in all required fields correctly.');
        return;
    }

    // Create subscription object
    const subscription = { name, price, category, date, notes };
    console.log('Subscription object created:', subscription);

    // Add or update the subscription
    if (editIndex >= 0) {
        console.log('Updating subscription at index:', editIndex);
        subscriptions[editIndex] = subscription;
    } else {
        console.log('Adding new subscription');
        subscriptions.push(subscription);
    }

    console.log('Updated subscriptions array:', subscriptions);

    // Save and update UI
    saveSubscriptions();
    filterAndSortSubscriptions();
    updateDashboard();
    updateCharts(); // Add this line
    closeModal();

    // Show confirmation
    const action = editIndex >= 0 ? 'updated' : 'added';
    console.log(`Subscription ${action}: ${name}`);
}

/**
 * Handle Subscription Actions (Edit/Delete)
 */
function handleSubscriptionAction(e) {
    const button = e.target.closest('.edit-btn, .delete-btn');
    if (!button) return;

    const index = parseInt(button.dataset.index);

    if (button.classList.contains('edit-btn')) {
        openModal(true, index);
    } else if (button.classList.contains('delete-btn')) {
        if (confirm(`Are you sure you want to delete ${subscriptions[index].name}?`)) {
            subscriptions.splice(index, 1);
            saveSubscriptions();
            filterAndSortSubscriptions();
            updateDashboard();
            updateCharts(); // Add this line
        }
    }
}

function generateCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Group subscriptions by category and sum prices
    const categoryData = {};
    
    subscriptions.forEach(sub => {
        const category = sub.category || 'other';
        if (!categoryData[category]) {
            categoryData[category] = 0;
        }
        categoryData[category] += parseFloat(sub.price);
    });
    
    // Prepare data for chart
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    
    // Define colors for categories
    const categoryColors = {
        'entertainment': '#9c36b5',
        'productivity': '#339af0',
        'utilities': '#20c997',
        'other': '#868e96'
    };
    
    const colors = labels.map(label => categoryColors[label] || '#868e96');
    
    // Create chart and return instance
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: 'transparent',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `$${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function generateTrendChart() {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    // Create data for the next 6 months
    const months = [];
    const monthlyAmounts = [];
    
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
        const month = new Date(currentDate);
        month.setMonth(currentDate.getMonth() + i);
        
        const monthName = month.toLocaleString('default', { month: 'short' });
        const year = month.getFullYear();
        const label = `${monthName} ${year}`;
        
        months.push(label);
        monthlyAmounts.push(calculateMonthTotal(month));
    }
    
    // Create chart and return instance
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Monthly Spending',
                data: monthlyAmounts,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value.toFixed(2),
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + context.raw.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function calculateMonthTotal(targetMonth) {
    // Calculate monthly total for a specific month
    return subscriptions.reduce((total, sub) => {
        return total + parseFloat(sub.price);
    }, 0);
}

// Store chart instances
let categoryChartInstance = null;
let trendChartInstance = null;

function updateCharts() {
    // Destroy existing charts
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }
    
    if (trendChartInstance) {
        trendChartInstance.destroy();
    }
    
    // Generate new charts
    categoryChartInstance = generateCategoryChart();
    trendChartInstance = generateTrendChart();
}

/**
 * Initialize the Application
 */
function initApp() {
    console.log('Initializing app');

    // Validate the subscriptions array
    if (!Array.isArray(subscriptions)) {
        console.error('Subscriptions is not an array, resetting to empty array');
        subscriptions = [];
        saveSubscriptions();
    } else {
        console.log('Initial subscriptions from localStorage:', subscriptions);
    }

    // Set up event listeners
    subscriptionForm.addEventListener('submit', handleFormSubmit);
    addButton.addEventListener('click', () => openModal(false));
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    subscriptionsList.addEventListener('click', handleSubscriptionAction);
    themeToggle.addEventListener('click', toggleTheme);

    // Set up search and filter functionality
    searchInput.addEventListener('input', filterAndSortSubscriptions);
    categoryFilter.addEventListener('change', filterAndSortSubscriptions);
    sortBySelect.addEventListener('change', filterAndSortSubscriptions);

    // Initialize theme
    initTheme();

    // Initial display
    filterAndSortSubscriptions();
    updateDashboard();
    updateCharts();

    // Log initial stats
    console.log(`Loaded ${subscriptions.length} subscriptions`);
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
    if (e.target === subscriptionModal) {
        closeModal();
    }
});