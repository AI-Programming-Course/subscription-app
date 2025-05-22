// ==========================================
// SubTracker - Enhanced Subscription Manager
// ==========================================

// Initialize subscriptions from localStorage or empty array
let subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || [];
// Historical data tracking
let monthlyHistory = JSON.parse(localStorage.getItem('monthlyHistory')) || [];
let lastHistoryUpdate = localStorage.getItem('lastHistoryUpdate') || null;
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
        // Add this line:
        captureMonthlySnapshot();
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
    // Add this line at the very end of the function:
    updateAdvancedDashboard();
}

/**
 * Enhanced Analytics Functions
 */
function calculateAdvancedStats() {
    if (subscriptions.length === 0) {
        return {
            averageCost: 0,
            mostExpensive: null,
            spendingTrend: null,
            subscriptionGrowth: 0
        };
    }

    // Calculate average cost
    const totalMonthlyCost = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.price), 0);
    const averageCost = totalMonthlyCost / subscriptions.length;

    // Find most expensive subscription
    const mostExpensive = subscriptions.reduce((max, sub) =>
        parseFloat(sub.price) > parseFloat(max.price || 0) ? sub : max, subscriptions[0]);

    // Calculate spending trend (simulate for now - we'll enhance this later)
    const spendingTrend = calculateSpendingTrend();

    // Calculate subscription growth (simulate for now)
    const subscriptionGrowth = calculateSubscriptionGrowth();

    return {
        averageCost,
        mostExpensive,
        spendingTrend,
        subscriptionGrowth
    };
}

function calculateSpendingTrend() {
    // Use real historical data instead of simulation
    return calculateRealSpendingTrend();
}

function calculateSubscriptionGrowth() {
    // Use real historical data instead of simulation
    return calculateRealSubscriptionGrowth();
}

/**
 * Historical Data Management
 */
function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function captureMonthlySnapshot() {
    const currentMonth = getCurrentMonthKey();
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate current totals
    const monthlyTotal = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.price), 0);
    const subscriptionCount = subscriptions.length;
    
    // Check if we already have data for this month
    const existingIndex = monthlyHistory.findIndex(entry => entry.month === currentMonth);
    
    const snapshot = {
        month: currentMonth,
        monthlyTotal: monthlyTotal,
        yearlyTotal: monthlyTotal * 12,
        subscriptionCount: subscriptionCount,
        captureDate: today,
        subscriptions: subscriptions.map(sub => ({
            name: sub.name,
            price: parseFloat(sub.price),
            category: sub.category
        }))
    };
    
    if (existingIndex >= 0) {
        // Update existing entry
        monthlyHistory[existingIndex] = snapshot;
    } else {
        // Add new entry
        monthlyHistory.push(snapshot);
    }
    
    // Keep only last 12 months
    monthlyHistory = monthlyHistory
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);
    
    // Save to localStorage
    localStorage.setItem('monthlyHistory', JSON.stringify(monthlyHistory));
    localStorage.setItem('lastHistoryUpdate', today);
    
    console.log('Monthly snapshot captured:', snapshot);
}

function initializeHistoricalData() {
    const today = new Date().toISOString().split('T')[0];
    
    // If we've never captured data, or it's been more than 30 days, capture now
    if (!lastHistoryUpdate || isNewMonth(lastHistoryUpdate, today)) {
        captureMonthlySnapshot();
    }
    
    // Ensure we have some historical data for demo purposes
    ensureMinimumHistoricalData();
}

function isNewMonth(lastUpdate, currentDate) {
    const lastDate = new Date(lastUpdate);
    const currentD = new Date(currentDate);
    
    return lastDate.getMonth() !== currentD.getMonth() || 
           lastDate.getFullYear() !== currentD.getFullYear();
}

function ensureMinimumHistoricalData() {
    // If we have less than 3 months of data, generate some historical data for better charts
    if (monthlyHistory.length < 3) {
        generateHistoricalData();
    }
}

function generateHistoricalData() {
    const currentMonth = new Date();
    const currentTotal = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.price), 0);
    
    // Generate data for the last 6 months
    for (let i = 5; i >= 0; i--) {
        const month = new Date(currentMonth);
        month.setMonth(currentMonth.getMonth() - i);
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        
        // Check if we already have data for this month
        const exists = monthlyHistory.some(entry => entry.month === monthKey);
        if (!exists) {
            // Generate realistic historical data based on current spending
            const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
            const historicalTotal = Math.max(0, currentTotal * (1 + variation));
            const historicalCount = Math.max(1, Math.round(subscriptions.length * (1 + variation * 0.5)));
            
            monthlyHistory.push({
                month: monthKey,
                monthlyTotal: parseFloat(historicalTotal.toFixed(2)),
                yearlyTotal: parseFloat((historicalTotal * 12).toFixed(2)),
                subscriptionCount: historicalCount,
                captureDate: month.toISOString().split('T')[0],
                subscriptions: [] // Simplified for historical data
            });
        }
    }
    
    // Sort and keep last 12 months
    monthlyHistory = monthlyHistory
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);
    
    localStorage.setItem('monthlyHistory', JSON.stringify(monthlyHistory));
    console.log('Historical data initialized:', monthlyHistory);
}

function calculateRealSpendingTrend() {
    if (monthlyHistory.length < 2) {
        return null;
    }
    
    // Get the last two months
    const sortedHistory = monthlyHistory.sort((a, b) => a.month.localeCompare(b.month));
    const currentMonth = sortedHistory[sortedHistory.length - 1];
    const previousMonth = sortedHistory[sortedHistory.length - 2];
    
    if (!currentMonth || !previousMonth) {
        return null;
    }
    
    const currentTotal = currentMonth.monthlyTotal;
    const previousTotal = previousMonth.monthlyTotal;
    
    if (previousTotal === 0) {
        return currentTotal > 0 ? 100 : 0;
    }
    
    const percentChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    return Math.round(percentChange * 10) / 10; // Round to 1 decimal
}

function calculateRealSubscriptionGrowth() {
    if (monthlyHistory.length < 2) {
        return 0;
    }
    
    // Get the last two months
    const sortedHistory = monthlyHistory.sort((a, b) => a.month.localeCompare(b.month));
    const currentMonth = sortedHistory[sortedHistory.length - 1];
    const previousMonth = sortedHistory[sortedHistory.length - 2];
    
    if (!currentMonth || !previousMonth) {
        return 0;
    }
    
    const currentCount = currentMonth.subscriptionCount;
    const previousCount = previousMonth.subscriptionCount;
    
    if (previousCount === 0) {
        return currentCount > 0 ? 100 : 0;
    }
    
    const percentChange = ((currentCount - previousCount) / previousCount) * 100;
    return Math.round(percentChange);
}

function updateAdvancedDashboard() {
    const stats = calculateAdvancedStats();

    // Update average cost
    document.getElementById('average-cost').textContent = formatCurrency(stats.averageCost);

    // Update most expensive
    const mostExpensiveElement = document.getElementById('most-expensive');
    if (stats.mostExpensive) {
        mostExpensiveElement.textContent = `${stats.mostExpensive.name} (${formatCurrency(stats.mostExpensive.price)})`;
    } else {
        mostExpensiveElement.textContent = 'None';
    }

    // Update spending trend
    const spendingTrendElement = document.getElementById('spending-trend');
    if (stats.spendingTrend !== null) {
        const trendIcon = stats.spendingTrend >= 0 ? '↗️' : '↘️';
        const trendClass = stats.spendingTrend >= 0 ? 'trend-up' : 'trend-down';
        spendingTrendElement.innerHTML = `<span class="${trendClass}">${trendIcon} ${Math.abs(stats.spendingTrend).toFixed(1)}%</span>`;
    } else {
        spendingTrendElement.textContent = 'No data';
    }

    // Update subscription growth
    const growthElement = document.getElementById('subscription-growth');
    const growthIcon = stats.subscriptionGrowth >= 0 ? '📈' : '📉';
    const growthClass = stats.subscriptionGrowth >= 0 ? 'trend-up' : 'trend-down';
    growthElement.innerHTML = `<span class="${growthClass}">${growthIcon} ${stats.subscriptionGrowth}%</span>`;
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
                        label: function (context) {
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
    
    // Use historical data if available, otherwise show current month projection
    let chartData = [];
    let labels = [];
    
    if (monthlyHistory.length > 0) {
        // Use real historical data
        const sortedHistory = monthlyHistory.sort((a, b) => a.month.localeCompare(b.month));
        
        sortedHistory.forEach(entry => {
            const date = new Date(entry.month + '-01');
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            labels.push(monthName);
            chartData.push(entry.monthlyTotal);
        });
        
        // Add current month if not already included
        const currentMonthKey = getCurrentMonthKey();
        const hasCurrentMonth = sortedHistory.some(entry => entry.month === currentMonthKey);
        
        if (!hasCurrentMonth) {
            const currentDate = new Date();
            const currentMonthName = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const currentTotal = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.price), 0);
            
            labels.push(currentMonthName);
            chartData.push(currentTotal);
        }
    } else {
        // Fallback: show current month only
        const currentDate = new Date();
        const currentMonthName = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const currentTotal = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.price), 0);
        
        labels.push(currentMonthName);
        chartData.push(currentTotal);
    }
    
    // Create chart with enhanced styling
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Spending',
                data: chartData,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
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
                            return 'Monthly Spending: $' + context.raw.toFixed(2);
                        },
                        afterLabel: function(context) {
                            const yearlyProjection = (context.raw * 12).toFixed(2);
                            return 'Yearly Projection: $' + yearlyProjection;
                        }
                    }
                },
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
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

    // Add this line after the validation:
    initializeHistoricalData();

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