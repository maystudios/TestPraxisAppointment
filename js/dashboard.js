// js/dashboard.js
import { setSelectedResources, getSelectedResources, getResources, setDashboardViewType, getDashboardViewType, store } from './store.js'; // Added store for direct access if needed
import { renderCalendar } from './calendarView.js';
import { makeDroppable } from './dragDrop.js';

let currentDisplayDate = new Date(); 

function initDashboard() {
    console.log("dashboard.js: initDashboard - Start. Current display date:", currentDisplayDate, "View type from store:", getDashboardViewType());
    
    // Event Listeners for view type buttons
    const tagBtn = document.getElementById('ansicht-tag');
    const wocheBtn = document.getElementById('ansicht-woche');
    const monatBtn = document.getElementById('ansicht-monat');

    if(tagBtn) tagBtn.addEventListener('click', () => setViewTypeAndUpdate('tagesansicht')); else console.warn("dashboard.js: ansicht-tag button not found");
    if(wocheBtn) wocheBtn.addEventListener('click', () => setViewTypeAndUpdate('wochenansicht')); else console.warn("dashboard.js: ansicht-woche button not found");
    if(monatBtn) monatBtn.addEventListener('click', () => setViewTypeAndUpdate('monatsansicht')); else console.warn("dashboard.js: ansicht-monat button not found");
    console.log("dashboard.js: View type listeners setup attempted.");

    // Navigation buttons for date
    const prevBtn = document.getElementById('prev-day-btn');
    const nextBtn = document.getElementById('next-day-btn');
    const todayBtn = document.getElementById('today-btn');

    if(prevBtn) prevBtn.addEventListener('click', () => navigateDate(-1)); else console.warn("dashboard.js: prev-day-btn not found");
    if(nextBtn) nextBtn.addEventListener('click', () => navigateDate(1)); else console.warn("dashboard.js: next-day-btn not found");
    if(todayBtn) todayBtn.addEventListener('click', () => navigateToToday()); else console.warn("dashboard.js: today-btn not found");
    console.log("dashboard.js: Date navigation listeners setup attempted.");

    setupResourceFilters();
    console.log("dashboard.js: setupResourceFilters completed.");

    console.log("dashboard.js: Calling renderCalendar with date:", currentDisplayDate, "and view type:", getDashboardViewType());
    renderCalendar(currentDisplayDate, getDashboardViewType());
    console.log("dashboard.js: renderCalendar completed.");

    const kalenderBereich = document.getElementById('kalender-bereich');
    if (kalenderBereich) {
        makeDroppable(kalenderBereich);
        console.log("dashboard.js: makeDroppable on kalender-bereich completed.");
    } else {
        console.error("dashboard.js: kalender-bereich not found for makeDroppable!");
    }
    console.log("dashboard.js: initDashboard - End.");
}

function setViewTypeAndUpdate(viewType) {
    console.log(`dashboard.js: setViewTypeAndUpdate called with viewType: ${viewType}`);
    setDashboardViewType(viewType);
    renderCalendar(currentDisplayDate, viewType);
}

function navigateDate(offset) {
    const viewType = getDashboardViewType();
    console.log(`dashboard.js: navigateDate called with offset: ${offset}, current viewType: ${viewType}`);
    // ... (rest of navigateDate logic) ...
    if (viewType === 'tagesansicht') {
        currentDisplayDate.setDate(currentDisplayDate.getDate() + offset);
    } else if (viewType === 'wochenansicht') {
        currentDisplayDate.setDate(currentDisplayDate.getDate() + (offset * 7));
    } else if (viewType === 'monatsansicht') {
        currentDisplayDate.setMonth(currentDisplayDate.getMonth() + offset);
    }
    renderCalendar(new Date(currentDisplayDate), viewType);
}

function navigateToToday() {
    console.log("dashboard.js: navigateToToday called.");
    currentDisplayDate = new Date();
    renderCalendar(currentDisplayDate, getDashboardViewType());
}

function setupResourceFilters() {
    const filterContainer = document.getElementById('resource-filter-container');
    if (!filterContainer) {
        console.error("dashboard.js: Resource filter container not found!");
        return;
    }
    console.log("dashboard.js: setupResourceFilters - container found.");
    // ... (rest of setupResourceFilters logic) ...
    filterContainer.innerHTML = ''; 
    const allResources = getResources();
    const currentSelected = getSelectedResources();

    allResources.forEach(resource => {
        const div = document.createElement('div');
        div.className = 'form-check form-check-inline';
        
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.id = `filter-${resource.id}`;
        input.value = resource.id;
        input.checked = currentSelected.includes(resource.id);
        input.addEventListener('change', handleResourceFilterChange);

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `filter-${resource.id}`;
        label.textContent = resource.name;

        div.appendChild(input);
        div.appendChild(label);
        filterContainer.appendChild(div);
    });
}

function handleResourceFilterChange() {
    console.log("dashboard.js: handleResourceFilterChange called.");
    // ... (rest of handleResourceFilterChange logic) ...
    const checkboxes = document.querySelectorAll('#resource-filter-container .form-check-input');
    const newSelectedResources = Array.from(checkboxes)
                                   .filter(i => i.checked)
                                   .map(i => i.value);
    setSelectedResources(newSelectedResources);
    renderCalendar(currentDisplayDate, getDashboardViewType());
}

function clearDashboard() {
    console.log("dashboard.js: clearDashboard called.");
    const calendarContainer = document.getElementById('kalender-bereich');
    if (calendarContainer) {
        calendarContainer.innerHTML = '<p class="text-center text-muted">Bitte einloggen, um das Dashboard anzuzeigen.</p>';
    }
    currentDisplayDate = new Date(); // Reset date
}

export { initDashboard, clearDashboard };