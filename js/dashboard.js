// js/dashboard.js
import {
    setSelectedResources, getSelectedResources, getResources, getResourceById,
    setDashboardViewType, getDashboardViewType,
    setCurrentDisplayDate, getCurrentDisplayDate, getMockedLogicalToday, // Use getMockedLogicalToday
    calculateQuickStats, getQuickStats, store
} from './store.js';
import { renderCalendar } from './calendarView.js';
import { makeDroppable } from './dragDrop.js';

let dynamicDateHeaderEl, calendarLoadingOverlayEl, initialLoadMessageEl;
let statNextAppointmentEl, statTotalAppointmentsEl, statUtilizationEl;
let viewTypeButtons = [];

function initDashboard() {
    console.log("dashboard.js: initDashboard - Start.");
    
    dynamicDateHeaderEl = document.getElementById('dynamic-date-header');
    calendarLoadingOverlayEl = document.getElementById('calendar-loading-overlay');
    initialLoadMessageEl = document.querySelector('#kalender-bereich .initial-load-message');
    statNextAppointmentEl = document.getElementById('stat-next-appointment');
    statTotalAppointmentsEl = document.getElementById('stat-total-appointments');
    statUtilizationEl = document.getElementById('stat-utilization');
    viewTypeButtons = document.querySelectorAll('#dashboardNav .nav-link[data-viewtype]');

    viewTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => setViewTypeAndUpdate(btn.dataset.viewtype));
    });
    
    document.getElementById('prev-day-btn')?.addEventListener('click', () => navigateDate(-1));
    document.getElementById('next-day-btn')?.addEventListener('click', () => navigateDate(1));
    document.getElementById('today-btn')?.addEventListener('click', () => navigateToToday());
    document.getElementById('select-all-resources')?.addEventListener('click', toggleAllResources);

    setupResourceFilters();
    updateActiveViewButton();
    
    const initialDateToDisplay = getCurrentDisplayDate(); // Already normalized
    console.log("dashboard.js: Initial date for display (from getCurrentDisplayDate):", initialDateToDisplay.toISOString().split('T')[0]);

    updateDynamicDateHeader(initialDateToDisplay, getDashboardViewType());
    showLoading(true);
    if(initialLoadMessageEl) initialLoadMessageEl.style.display = 'none'; // Hide initial text

    setTimeout(() => {
        renderCalendar(initialDateToDisplay, getDashboardViewType());
        showLoading(false);
    }, 150); // Reduced delay

    const kalenderBereich = document.getElementById('kalender-bereich');
    if (kalenderBereich) makeDroppable(kalenderBereich);
    
    console.log("dashboard.js: initDashboard - End.");
}

function showLoading(isLoading) {
    if (calendarLoadingOverlayEl) {
        calendarLoadingOverlayEl.style.display = isLoading ? 'flex' : 'none';
    }
     if (initialLoadMessageEl && !isLoading) { // Hide initial message once loading is done
        initialLoadMessageEl.style.display = 'none';
    }
}

function updateDynamicDateHeader(date, viewType) {
    if (!dynamicDateHeaderEl) return;
    // ... (options definitions) ...
    // (Keine Änderung hier, aber sicherstellen, dass `date` das normalisierte Datum ist)
    const optionsDay = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const optionsWeek = { year: 'numeric', month: 'short', day: 'numeric' };
    const optionsMonth = { year: 'numeric', month: 'long' };
    let headerText = "";

    if (viewType === 'tagesansicht') {
        headerText = date.toLocaleDateString('de-DE', optionsDay);
    } else if (viewType === 'wochenansicht') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - (date.getDay() + 6) % 7);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        headerText = `Woche: ${startOfWeek.toLocaleDateString('de-DE', optionsWeek)} - ${endOfWeek.toLocaleDateString('de-DE', optionsWeek)}`;
    } else if (viewType === 'monatsansicht') {
        headerText = date.toLocaleDateString('de-DE', optionsMonth);
    }
    dynamicDateHeaderEl.textContent = headerText;
}

function updateActiveViewButton() {
    const currentViewType = getDashboardViewType();
    viewTypeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.viewtype === currentViewType);
        btn.classList.toggle('fw-bold', btn.dataset.viewtype === currentViewType);
    });
}

function setViewTypeAndUpdate(viewType) {
    const currentDate = getCurrentDisplayDate(); // Normalized
    setDashboardViewType(viewType);
    updateActiveViewButton();
    updateDynamicDateHeader(currentDate, viewType);
    showLoading(true);
    if(initialLoadMessageEl) initialLoadMessageEl.style.display = 'none';
    setTimeout(() => {
        renderCalendar(currentDate, viewType); 
        showLoading(false);
    }, 100);
}

function navigateDate(offset) {
    let currentDate = getCurrentDisplayDate(); // Normalized
    const viewType = getDashboardViewType();
    // ... (logic for date adjustment) ...
    if (viewType === 'tagesansicht') {
        currentDate.setDate(currentDate.getDate() + offset);
    } else if (viewType === 'wochenansicht') {
        currentDate.setDate(currentDate.getDate() + (offset * 7));
    } else if (viewType === 'monatsansicht') {
        const currentMonth = currentDate.getMonth();
        currentDate.setMonth(currentMonth + offset, 1); // Set to 1st to avoid month skips
    }
    setCurrentDisplayDate(currentDate); // Stores normalized date
    updateDynamicDateHeader(currentDate, viewType);
    showLoading(true);
    if(initialLoadMessageEl) initialLoadMessageEl.style.display = 'none';
    setTimeout(() => {
        renderCalendar(currentDate, viewType);
        showLoading(false);
    }, 100);
}

function navigateToToday() {
    const todayNormalized = getMockedLogicalToday(); // This is already normalized (midnight)
    console.log("dashboard.js: Navigating to Today (mocked, normalized):", todayNormalized.toISOString().split('T')[0]);
    setCurrentDisplayDate(todayNormalized); 

    const viewType = getDashboardViewType();
    updateDynamicDateHeader(todayNormalized, viewType);
    showLoading(true);
    if(initialLoadMessageEl) initialLoadMessageEl.style.display = 'none';
    setTimeout(() => {
        renderCalendar(todayNormalized, viewType);
        showLoading(false);
    }, 100);
}

function setupResourceFilters() {
    const filterContainer = document.getElementById('resource-filter-container');
    if (!filterContainer) return;
    filterContainer.innerHTML = ''; 
    const allResources = getResources();
    const currentSelectedIds = getSelectedResources();

    allResources.forEach(resource => {
        // ... (input, label, badge creation as before) ...
        const div = document.createElement('div');
        div.className = 'form-check form-check-inline me-3';
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.id = `filter-${resource.id}`;
        input.value = resource.id;
        input.checked = currentSelectedIds.includes(resource.id);
        if (resource.color) {
            input.style.backgroundColor = input.checked ? resource.color : '#fff';
            input.style.borderColor = resource.color;
        }
        input.addEventListener('change', (e) => {
            if (resource.color) { // Ensure resource.color exists
                e.target.style.backgroundColor = e.target.checked ? resource.color : '#fff';
            }
            handleResourceFilterChange();
        });
        const label = document.createElement('label');
        label.className = 'form-check-label small';
        label.htmlFor = `filter-${resource.id}`;
        label.textContent = resource.name;
        const badge = document.createElement('span');
        badge.id = `badge-${resource.id}`;
        badge.className = 'badge rounded-pill bg-secondary ms-1';
        label.appendChild(badge);
        div.appendChild(input);
        div.appendChild(label);
        filterContainer.appendChild(div);
    });
}

function toggleAllResources() {
    const checkboxes = document.querySelectorAll('#resource-filter-container .form-check-input');
    const allResourceIds = getResources().map(r => r.id);
    const currentlySelected = getSelectedResources();
    let newSelectedResources;

    if (currentlySelected.length < allResourceIds.length) {
        newSelectedResources = allResourceIds;
    } else {
        newSelectedResources = []; // Deselect all
    }
    
    checkboxes.forEach(cb => {
        const resource = getResourceById(cb.value);
        cb.checked = newSelectedResources.includes(cb.value);
        if (resource && resource.color) {
            cb.style.backgroundColor = cb.checked ? resource.color : '#fff';
        }
    });
    setSelectedResources(newSelectedResources);
    
    const currentDate = getCurrentDisplayDate(); // Normalized
    showLoading(true);
    if(initialLoadMessageEl) initialLoadMessageEl.style.display = 'none';
    setTimeout(() => {
        renderCalendar(currentDate, getDashboardViewType());
        showLoading(false);
    }, 100);
}

function handleResourceFilterChange() {
    const checkboxes = document.querySelectorAll('#resource-filter-container .form-check-input');
    const newSelectedResources = Array.from(checkboxes)
                                   .filter(i => i.checked)
                                   .map(i => i.value);
    setSelectedResources(newSelectedResources);
    
    const currentDate = getCurrentDisplayDate(); // Normalized
    showLoading(true);
    if(initialLoadMessageEl) initialLoadMessageEl.style.display = 'none';
    setTimeout(() => {
        renderCalendar(currentDate, getDashboardViewType());
        showLoading(false);
    }, 100);
}

function updateQuickStatsDisplay() {
    const stats = getQuickStats();
    const todayForStats = getCurrentDisplayDate(); // Normalized
    const todayString = todayForStats.toISOString().split('T')[0];

    if (statNextAppointmentEl) {
        if (stats.nextUpcomingAppointment && todayString === getMockedLogicalToday().toISOString().split('T')[0]) { // Only show next if it's "logical today"
            statNextAppointmentEl.innerHTML = `${stats.nextUpcomingAppointment.time} <span class="fw-bold">${stats.nextUpcomingAppointment.title}</span> <small>(${stats.nextUpcomingAppointment.resourceName})</small>`;
        } else {
            statNextAppointmentEl.textContent = "N/A";
        }
    }
    if (statTotalAppointmentsEl) statTotalAppointmentsEl.textContent = stats.totalAppointmentsToday;
    if (statUtilizationEl) statUtilizationEl.textContent = stats.utilizationPercent;

    getResources().forEach(resource => {
        const badgeEl = document.getElementById(`badge-${resource.id}`);
        if (badgeEl) {
            // Count appointments for the *currently displayed date* for this resource
            const count = store.appointments[resource.id]?.filter(app => app.date === todayString).length || 0;
            badgeEl.textContent = count;
            const resourceColor = getResourceById(resource.id)?.color;
            if (count > 0 && resourceColor) {
                badgeEl.style.backgroundColor = resourceColor;
                // Basic contrast check for badge text color
                // This is a very simple heuristic, Chroma.js would be better
                const r = parseInt(resourceColor.slice(1, 3), 16);
                const g = parseInt(resourceColor.slice(3, 5), 16);
                const b = parseInt(resourceColor.slice(5, 7), 16);
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                badgeEl.style.color = luminance > 0.5 ? '#333' : '#fff';
            } else {
                badgeEl.style.backgroundColor = '#6c757d'; // Bootstrap secondary
                badgeEl.style.color = '#fff';
            }
        }
    });
}

function refreshStatsAndDisplay() {
    const currentDate = getCurrentDisplayDate(); // Normalized
    calculateQuickStats(currentDate);
    updateQuickStatsDisplay();
}

export { initDashboard, refreshStatsAndDisplay };