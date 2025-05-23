// ==========================================
// SubTracker - Enhanced Subscription Manager
// Phase 4: Subscription Insights
// ==========================================

// Initialize subscriptions from localStorage or sample data
let subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || [
    {
        name: "Netflix",
        price: 15.99,
        category: "entertainment",
        date: "2025-06-15",
        startDate: "2023-01-15",
        notes: "Family plan"
    },
    {
        name: "Spotify",
        price: 9.99,
        category: "entertainment",
        date: "2025-05-28",
        startDate: "2022-08-01",
        notes: "Premium subscription"
    },
    {
        name: "Adobe Creative Suite",
        price: 52.99,
        category: "productivity",
        date: "2025-06-01",
        startDate: "2024-01-01",
        notes: "Annual plan"
    },
    {
        name: "Notion",
        price: 8.00,
        category: "productivity",
        date: "2025-05-30",
        startDate: "2024-03-15",
        notes: "Pro plan"
    },
    {
        name: "Dropbox",
        price: 11.99,
        category: "utilities",
        date: "2025-06-10",
        startDate: "2023-09-01",
        notes: "2TB storage"
    }
];

// Historical data tracking
let monthlyHistory = JSON.parse(localStorage.getItem('monthlyHistory')) || [
    {
        month: "2024-12",
        monthlyTotal: 95.96,
        yearlyTotal: 1151.52,
        subscriptionCount: 4,
        captureDate: "2024-12-31"
    },
    {
        month: "2025-01",
        monthlyTotal: 98.96,
        yearlyTotal: 1187.52,
        subscriptionCount: 5,
        captureDate: "2025-01-31"
    },
    {
        month: "2025-02",
        monthlyTotal: 98.96,
        yearlyTotal: 1187.52,
        subscriptionCount: 5,
        captureDate: "2025-02-28"
    },
    {
        month: "2025-03",
        monthlyTotal: 98.96,
        yearlyTotal: 1187.52,
        subscriptionCount: 5,
        captureDate: "2025-03-31"
    },
    {
        month: "2025-04",
        monthlyTotal: 98.96,
        yearlyTotal: 1187.52,
        subscriptionCount: 5,
        captureDate: "2025-04-30"
    },
    {
        month: "2025-05",
        monthlyTotal: 98.96,
        yearlyTotal: 1187.52,
        subscriptionCount: 5,
        captureDate: "2025-05-31"
    }
];

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
        document.getElementById('start-date').value = sub.startDate || '';
        document.getElementById('notes').value = sub.notes || '';
    } else {
        subscriptionForm.reset();

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        document.getElementById('start-date').value = today;
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
 * Phase 4: Subscription Insights Functions
 */
function calculateSubscriptionAge(startDate) {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const today = new Date();
    
    const diffTime = today - start;
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    
    return Math.max(0, diffMonths);
}

function calculateCostEfficiency(subscription) {
    const age = calculateSubscriptionAge(subscription.startDate);
    const monthlyPrice = parseFloat(subscription.price);
    
    if (age === 0) return { efficiency: 'unknown', score: 0 };
    
    // Simple efficiency calculation: longer usage = better efficiency
    const dailyCost = monthlyPrice / 30.44;
    const totalCost = monthlyPrice * age;
    
    // Efficiency based on price and usage duration
    let efficiency = 'medium';
    let score = age / monthlyPrice; // Higher is better
    
    if (score > 2) efficiency = 'high';
    else if (score < 0.5) efficiency = 'low';
    
    return { efficiency, score, dailyCost, totalCost };
}

function analyzeSubscriptionInsights() {
    if (subscriptions.length === 0) {
        return {
            costEfficiency: { mostEfficient: null, leastEfficient: null, avgDailyCost: 0, savingsPotential: 0 },
            lifecycle: { longestRunning: null, newestAddition: null, averageAge: 0, lifetimeValue: 0 },
            renewalPatterns: { thisWeek: 0, thisMonth: 0, overdue: 0, peakMonth: null },
            upcomingRenewals: []
        };
    }

    // Cost Efficiency Analysis
    let mostEfficient = null;
    let leastEfficient = null;
    let totalDailyCost = 0;
    let maxScore = -1;
    let minScore = Infinity;

    subscriptions.forEach(sub => {
        const efficiency = calculateCostEfficiency(sub);
        totalDailyCost += efficiency.dailyCost || 0;
        
        if (efficiency.score > maxScore) {
            maxScore = efficiency.score;
            mostEfficient = { ...sub, efficiency: efficiency.efficiency };
        }
        
        if (efficiency.score < minScore && efficiency.score > 0) {
            minScore = efficiency.score;
            leastEfficient = { ...sub, efficiency: efficiency.efficiency };
        }
    });

    const avgDailyCost = totalDailyCost / subscriptions.length;
    
    // Calculate potential savings (simplified)
    const highestCost = Math.max(...subscriptions.map(s => parseFloat(s.price)));
    const lowestCost = Math.min(...subscriptions.map(s => parseFloat(s.price)));
    const savingsPotential = (highestCost - lowestCost) * 12;

    // Lifecycle Analysis
    let longestRunning = null;
    let newestAddition = null;
    let totalAge = 0;
    let maxAge = -1;
    let minAge = Infinity;
    let totalLifetimeValue = 0;

    subscriptions.forEach(sub => {
        const age = calculateSubscriptionAge(sub.startDate);
        totalAge += age;
        
        const lifetimeValue = age * parseFloat(sub.price);
        totalLifetimeValue += lifetimeValue;
        
        if (age > maxAge) {
            maxAge = age;
            longestRunning = { ...sub, age };
        }
        
        if (age < minAge) {
            minAge = age;
            newestAddition = { ...sub, age };
        }
    });

    const averageAge = totalAge / subscriptions.length;

    // Renewal Patterns Analysis
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let thisWeek = 0;
    let thisMonth = 0;
    let overdue = 0;
    const monthCounts = {};

    subscriptions.forEach(sub => {
        const renewalDate = new Date(sub.date);
        const daysUntil = calculateDaysUntilRenewal(sub.date);
        
        if (daysUntil < 0) overdue++;
        else if (renewalDate <= oneWeekFromNow) thisWeek++;
        else if (renewalDate <= oneMonthFromNow) thisMonth++;
        
        const month = renewalDate.getMonth();
        monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    // Find peak renewal month
    let peakMonth = null;
    let maxRenewals = 0;
    Object.entries(monthCounts).forEach(([month, count]) => {
        if (count > maxRenewals) {
            maxRenewals = count;
            peakMonth = new Date(2025, parseInt(month), 1).toLocaleDateString('en-US', { month: 'long' });
        }
    });

    // Upcoming Renewals (next 30 days)
    const upcomingRenewals = subscriptions
        .filter(sub => {
            const days = calculateDaysUntilRenewal(sub.date);
            return days >= 0 && days <= 30;
        })
        .sort((a, b) => calculateDaysUntilRenewal(a.date) - calculateDaysUntilRenewal(b.date))
        .slice(0, 10); // Show top 10

    return {
        costEfficiency: {
            mostEfficient,
            leastEfficient,
            avgDailyCost,
            savingsPotential
        },
        lifecycle: {
            longestRunning,
            newestAddition,
            averageAge,
            lifetimeValue: totalLifetimeValue
        },
        renewalPatterns: {
            thisWeek,
            thisMonth,
            overdue,
            peakMonth
        },
        upcomingRenewals
    };
}

function updateSubscriptionInsights() {
    const insights = analyzeSubscriptionInsights();

    // Update Cost Efficiency
    document.getElementById('most-efficient').textContent = 
        insights.costEfficiency.mostEfficient ? 
        `${insights.costEfficiency.mostEfficient.name} (${insights.costEfficiency.mostEfficient.efficiency})` : 'None';

    document.getElementById('least-efficient').textContent = 
        insights.costEfficiency.leastEfficient ? 
        `${insights.costEfficiency.leastEfficient.name} (${insights.costEfficiency.leastEfficient.efficiency})` : 'None';

    document.getElementById('avg-daily-cost').textContent = formatCurrency(insights.costEfficiency.avgDailyCost);
    document.getElementById('savings-potential').textContent = formatCurrency(insights.costEfficiency.savingsPotential);

    // Update Lifecycle
    document.getElementById('longest-running').textContent = 
        insights.lifecycle.longestRunning ? 
        `${insights.lifecycle.longestRunning.name} (${insights.lifecycle.longestRunning.age} months)` : 'None';

    document.getElementById('newest-addition').textContent = 
        insights.lifecycle.newestAddition ? 
        `${insights.lifecycle.newestAddition.name} (${insights.lifecycle.newestAddition.age} months)` : 'None';

    document.getElementById('average-age').textContent = `${Math.round(insights.lifecycle.averageAge)} months`;
    document.getElementById('lifetime-value').textContent = formatCurrency(insights.lifecycle.lifetimeValue);

    // Update Renewal Patterns
    document.getElementById('renewals-week').textContent = `${insights.renewalPatterns.thisWeek} renewal${insights.renewalPatterns.thisWeek === 1 ? '' : 's'}`;
    document.getElementById('renewals-month').textContent = `${insights.renewalPatterns.thisMonth} renewal${insights.renewalPatterns.thisMonth === 1 ? '' : 's'}`;
    document.getElementById('renewals-overdue').textContent = `${insights.renewalPatterns.overdue} service${insights.renewalPatterns.overdue === 1 ? '' : 's'}`;
    document.getElementById('peak-month').textContent = insights.renewalPatterns.peakMonth || 'None';

    // Update Upcoming Renewals Timeline
    const renewalTimeline = document.getElementById('renewal-timeline');
    renewalTimeline.innerHTML = '';

    if (insights.upcomingRenewals.length === 0) {
        renewalTimeline.innerHTML = '<p class="empty-message">No upcoming renewals in the next 30 days.</p>';
    } else {
        insights.upcomingRenewals.forEach(sub => {
            const days = calculateDaysUntilRenewal(sub.date);
            const renewalDate = new Date(sub.date);
            const formattedDate = renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            let statusText = '';
            if (days === 0) statusText = 'Today';
            else if (days === 1) statusText = 'Tomorrow';
            else statusText = `${days} days`;
            
            const renewalItem = document.createElement('div');
            renewalItem.className = 'renewal-item';
            renewalItem.innerHTML = `
                <span class="renewal-service">${sub.name}</span>
                <span class="renewal-date">${formattedDate} (${statusText})</span>
            `;
            renewalTimeline.appendChild(renewalItem);
        });
    }
}

function generateLifecycleChart() {
    const ctx = document.getElementById('lifecycle-chart').getContext('2d');

    // Group subscriptions by age ranges
    const ageRanges = {
        'New (0-3 months)': 0,
        'Mature (4-12 months)': 0,
        'Veteran (1+ years)': 0
    };

    subscriptions.forEach(sub => {
        const age = calculateSubscriptionAge(sub.startDate);
        if (age <= 3) ageRanges['New (0-3 months)']++;
        else if (age <= 12) ageRanges['Mature (4-12 months)']++;
        else ageRanges['Veteran (1+ years)']++;
    });

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ageRanges),
            datasets: [{
                data: Object.values(ageRanges),
                backgroundColor: ['#339af0', '#40c057', '#9c36b5'],
                borderColor: 'transparent',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${value} subscription${value === 1 ? '' : 's'} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function generateEfficiencyChart() {
    const ctx = document.getElementById('efficiency-chart').getContext('2d');

    // Create scatter plot data
    const data = subscriptions.map(sub => {
        const age = calculateSubscriptionAge(sub.startDate);
        const efficiency = calculateCostEfficiency(sub);
        return {
            x: age,
            y: parseFloat(sub.price),
            label: sub.name,
            efficiency: efficiency.efficiency
        };
    });

    // Color points based on efficiency
    const pointColors = data.map(point => {
        switch(point.efficiency) {
            case 'high': return '#40c057';
            case 'low': return '#fa5252';
            default: return '#fd7e14';
        }
    });

    return new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Subscriptions',
                data: data,
                backgroundColor: pointColors,
                borderColor: pointColors,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Age (months)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Monthly Cost ($)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    ticks: {
                        callback: value => '$' + value.toFixed(2),
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
                        title: function(context) {
                            return context[0].raw.label;
                        },
                        label: function(context) {
                            const point = context.raw;
                            return [
                                `Age: ${point.x} months`,
                                `Cost: $${point.y.toFixed(2)}/month`,
                                `Efficiency: ${point.efficiency}`
                            ];
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
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

    updateAdvancedDashboard();
    updateCategoryInsights();
    updateSubscriptionInsights(); // Phase 4 addition
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

    // Calculate spending trend
    const spendingTrend = calculateRealSpendingTrend();

    // Calculate subscription growth
    const subscriptionGrowth = calculateRealSubscriptionGrowth();

    return {
        averageCost,
        mostExpensive,
        spendingTrend,
        subscriptionGrowth
    };
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

/**
 * Category Analytics Functions
 */
function analyzeCategoryData() {
    if (subscriptions.length === 0) {
        return {
            categories: {},
            topSpending: null,
            fastestGrowing: null,
            mostSubscriptions: null,
            averagePerCategory: 0
        };
    }

    // Group by category
    const categories = {};
    subscriptions.forEach(sub => {
        const category = sub.category || 'other';
        if (!categories[category]) {
            categories[category] = {
                name: category,
                totalSpent: 0,
                count: 0,
                subscriptions: [],
                averageCost: 0
            };
        }
        categories[category].totalSpent += parseFloat(sub.price);
        categories[category].count += 1;
        categories[category].subscriptions.push(sub);
    });

    // Calculate averages
    Object.keys(categories).forEach(key => {
        categories[key].averageCost = categories[key].totalSpent / categories[key].count;
    });

    // Find top spending category
    const topSpending = Object.values(categories).reduce((max, cat) =>
        cat.totalSpent > (max?.totalSpent || 0) ? cat : max, null);

    // Find category with most subscriptions
    const mostSubscriptions = Object.values(categories).reduce((max, cat) =>
        cat.count > (max?.count || 0) ? cat : max, null);

    // Calculate average per category
    const totalCategories = Object.keys(categories).length;
    const averagePerCategory = totalCategories > 0 ?
        Object.values(categories).reduce((sum, cat) => sum + cat.totalSpent, 0) / totalCategories : 0;

    // Calculate fastest growing (simplified - based on current data)
    const fastestGrowing = Object.values(categories).reduce((max, cat) =>
        cat.averageCost > (max?.averageCost || 0) ? cat : max, null);

    return {
        categories,
        topSpending,
        fastestGrowing,
        mostSubscriptions,
        averagePerCategory
    };
}

function updateCategoryInsights() {
    const analysis = analyzeCategoryData();

    // Update top spending category
    if (analysis.topSpending) {
        document.getElementById('top-category').textContent =
            analysis.topSpending.name.charAt(0).toUpperCase() + analysis.topSpending.name.slice(1);
        document.getElementById('top-category-amount').textContent =
            formatCurrency(analysis.topSpending.totalSpent);
    } else {
        document.getElementById('top-category').textContent = 'None';
        document.getElementById('top-category-amount').textContent = '$0.00';
    }

    // Update fastest growing
    if (analysis.fastestGrowing) {
        document.getElementById('growing-category').textContent =
            analysis.fastestGrowing.name.charAt(0).toUpperCase() + analysis.fastestGrowing.name.slice(1);
        document.getElementById('growing-category-change').textContent =
            `${formatCurrency(analysis.fastestGrowing.averageCost)} avg`;
    } else {
        document.getElementById('growing-category').textContent = 'None';
        document.getElementById('growing-category-change').textContent = '0%';
    }

    // Update most subscriptions
    if (analysis.mostSubscriptions) {
        document.getElementById('most-subs-category').textContent =
            analysis.mostSubscriptions.name.charAt(0).toUpperCase() + analysis.mostSubscriptions.name.slice(1);
        document.getElementById('most-subs-count').textContent =
            `${analysis.mostSubscriptions.count} service${analysis.mostSubscriptions.count === 1 ? '' : 's'}`;
    } else {
        document.getElementById('most-subs-category').textContent = 'None';
        document.getElementById('most-subs-count').textContent = '0 services';
    }

    // Update average per category
    const categoryCount = Object.keys(analysis.categories).length;
    document.getElementById('avg-per-category').textContent =
        `${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'}`;
    document.getElementById('avg-category-spend').textContent =
        formatCurrency(analysis.averagePerCategory);

    // Update category breakdown
    updateCategoryBreakdown(analysis.categories);
}

function updateCategoryBreakdown(categories) {
    const categoryList = document.getElementById('category-list');
    categoryList.innerHTML = '';

    if (Object.keys(categories).length === 0) {
        categoryList.innerHTML = '<p class="empty-message">No category data available.</p>';
        return;
    }

    // Sort categories by total spending
    const sortedCategories = Object.values(categories).sort((a, b) => b.totalSpent - a.totalSpent);

    sortedCategories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-breakdown-item';

        const categoryName = category.name.charAt(0).toUpperCase() + category.name.slice(1);
        const percentage = ((category.totalSpent / sortedCategories.reduce((sum, cat) => sum + cat.totalSpent, 0)) * 100).toFixed(1);

        categoryItem.innerHTML = `
            <div class="category-breakdown-header">
                <span class="category-breakdown-name">
                    <span class="subscription-category category-${category.name}">${categoryName}</span>
                </span>
                <span class="category-breakdown-total">${formatCurrency(category.totalSpent)}</span>
            </div>
            <div class="category-breakdown-details">
                <span>${category.count} subscription${category.count === 1 ? '' : 's'}</span>
                <span>•</span>
                <span>Avg: ${formatCurrency(category.averageCost)}</span>
                <span>•</span>
                <span>${percentage}% of total</span>
            </div>
            <div class="category-breakdown-bar">
                <div class="category-breakdown-fill category-${category.name}" style="width: ${percentage}%"></div>
            </div>
        `;

        categoryList.appendChild(categoryItem);
    });
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

        // Calculate age and efficiency for display
        const age = calculateSubscriptionAge(subscription.startDate);
        const efficiency = calculateCostEfficiency(subscription);

        // Create subscription item
        const subscriptionItem = document.createElement('div');
        subscriptionItem.classList.add('subscription-item');
        subscriptionItem.innerHTML = `
            <div class="subscription-header">
                <div>
                    <h3>${subscription.name}</h3>
                    <span class="subscription-category category-${subscription.category || 'other'}">${subscription.category || 'other'}</span>
                    ${age > 0 ? `<span class="age-badge age-${age <= 3 ? 'new' : age <= 12 ? 'mature' : 'veteran'}">${age} month${age === 1 ? '' : 's'}</span>` : ''}
                </div>
            </div>
            <div class="subscription-body">
                <div class="subscription-price">${formatCurrency(subscription.price)}/month</div>
                <div class="subscription-detail">
                    <i class="far fa-calendar-alt"></i>
                    <span>Renews: ${formattedDate} ${statusTag}</span>
                </div>
                ${efficiency.efficiency !== 'unknown' ? `
                <div class="subscription-detail">
                    <i class="fas fa-chart-line"></i>
                    <span>Efficiency: <span class="efficiency-indicator efficiency-${efficiency.efficiency}">${efficiency.efficiency}</span></span>
                </div>` : ''}
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

    // Get form values
    const name = document.getElementById('name').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const startDate = document.getElementById('start-date').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // Validate input
    if (!name || isNaN(price) || price <= 0 || !date) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    // Create subscription object
    const subscription = { name, price, category, date, notes };
    if (startDate) subscription.startDate = startDate;

    // Add or update the subscription
    if (editIndex >= 0) {
        subscriptions[editIndex] = subscription;
    } else {
        subscriptions.push(subscription);
    }

    // Save and update UI
    saveSubscriptions();
    filterAndSortSubscriptions();
    updateDashboard();
    updateCharts();
    closeModal();
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
            updateCharts();
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

    // Use historical data if available
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

        // Add current month data
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
                        label: function (context) {
                            return 'Monthly Spending: $' + context.raw.toFixed(2);
                        },
                        afterLabel: function (context) {
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

// Store chart instances
let categoryChartInstance = null;
let trendChartInstance = null;
let lifecycleChartInstance = null;
let efficiencyChartInstance = null;

function updateCharts() {
    // Destroy existing charts
    if (categoryChartInstance) categoryChartInstance.destroy();
    if (trendChartInstance) trendChartInstance.destroy();
    if (lifecycleChartInstance) lifecycleChartInstance.destroy();
    if (efficiencyChartInstance) efficiencyChartInstance.destroy();

    // Generate new charts
    categoryChartInstance = generateCategoryChart();
    trendChartInstance = generateTrendChart();
    lifecycleChartInstance = generateLifecycleChart();
    efficiencyChartInstance = generateEfficiencyChart();
}

/**
 * Initialize the Application
 */
function initApp() {
    console.log('Initializing app');

    // Validate the subscriptions array
    if (!Array.isArray(subscriptions)) {
        console.error('Subscriptions is not an array, resetting to sample data');
        subscriptions = [
            {
                name: "Netflix",
                price: 15.99,
                category: "entertainment",
                date: "2025-06-15",
                startDate: "2023-01-15",
                notes: "Family plan"
            }
        ];
        saveSubscriptions();
    }

    // Initialize historical data
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