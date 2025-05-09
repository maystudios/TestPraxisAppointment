// js/calendarView.js
import {
    getAppointmentsForResource, getSelectedResources, getResources, getResourceById,
    getDashboardViewType, addAppointment, updateAppointment as storeUpdateAppointment,
    deleteAppointment as storeDeleteAppointment, store, getMockedSystemTimeForIndicator,
    getMockedLogicalToday
} from './store.js';
import { attachDragDropEventListeners, makeDroppable } from './dragDrop.js';
import { refreshStatsAndDisplay } from './dashboard.js';

const neuerTerminModalEl = document.getElementById('neuerTerminModal');
let neuerTerminModalInstance = null; 
const appointmentIdInput = document.getElementById('appointment-id-input');
const neuerTerminTitelEl = document.getElementById('neuer-termin-titel');
const neuerTerminDatumEl = document.getElementById('neuer-termin-datum');
const neuerTerminZeitEl = document.getElementById('neuer-termin-zeit');
const neuerTerminDauerEl = document.getElementById('neuer-termin-dauer');
const neuerTerminRessourceSelectEl = document.getElementById('neuer-termin-ressource-select');
const appointmentNotesEl = document.getElementById('appointment-notes');
const saveTerminBtn = document.getElementById('save-neuer-termin-btn');

let currentRenderedDateInternal = new Date(); // Internal tracker for this module

if (neuerTerminModalEl) {
    neuerTerminModalInstance = new bootstrap.Modal(neuerTerminModalEl);
}

// Helper to get YYYY-MM-DD string from a Date object
function getDateString(dateObj) {
    return dateObj.toISOString().split('T')[0];
}


function renderCalendar(dateToDisplay, viewType) { // dateToDisplay is already normalized (midnight) from dashboard.js
    console.log(`calendarView: renderCalendar called for date: ${getDateString(dateToDisplay)}, view: ${viewType}`);
    currentRenderedDateInternal = new Date(dateToDisplay); // Keep an internal copy, normalized

    const calendarContainer = document.getElementById('kalender-bereich');
    if (!calendarContainer) {
        console.error("Calendar container not found!");
        refreshStatsAndDisplay(); // Still update stats (likely to show 0)
        return;
    }
    // Clear previous content AFTER checks, so "Lade..." is visible briefly
    calendarContainer.innerHTML = ''; 

    const selectedResourceIds = getSelectedResources();
    const allResources = getResources();
    const resourcesToDisplay = allResources.filter(r => selectedResourceIds.includes(r.id));
    
    const initialLoadMsg = document.querySelector('#kalender-bereich .initial-load-message');
    if(initialLoadMsg) initialLoadMsg.style.display = 'none';


    if (resourcesToDisplay.length === 0) {
        calendarContainer.innerHTML = '<div class="alert alert-warning text-center m-3" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i>Bitte wählen Sie mindestens eine Ressource aus dem Filter aus.</div>';
        refreshStatsAndDisplay();
        return;
    }
    
    if (viewType === 'tagesansicht') {
        renderTagesansicht(currentRenderedDateInternal, resourcesToDisplay);
    } else if (viewType === 'wochenansicht') {
        renderWochenansicht(currentRenderedDateInternal, resourcesToDisplay);
    } else if (viewType === 'monatsansicht') {
        renderMonatsansicht(currentRenderedDateInternal, resourcesToDisplay);
    } else {
        calendarContainer.innerHTML = '<p class="text-danger text-center m-3">Unbekannter Ansichtstyp!</p>';
    }
    
    document.querySelectorAll('.calendar-slot, .resource-column, .day-cell').forEach(makeDroppable);
    refreshStatsAndDisplay(); // Refresh stats after calendar is drawn and appointments are placed
}

function createAppointmentElement(app) {
    const terminDiv = document.createElement('div');
    terminDiv.className = 'termin-karte card mb-1 shadow-sm';
    terminDiv.id = app.id;
    terminDiv.draggable = true;
    terminDiv.dataset.resource = app.resource;
    terminDiv.dataset.time = app.time;
    terminDiv.dataset.date = app.date; // This is YYYY-MM-DD string
    terminDiv.dataset.duration = app.duration;
    terminDiv.dataset.notes = app.notes || "";
    terminDiv.dataset.patientId = app.patientId || "";

    const resource = getResourceById(app.resource);
    if (resource && resource.color) {
        terminDiv.style.backgroundColor = resource.color;
        // Basic contrast check (a library like chroma.js would be better)
        const r = parseInt(resource.color.slice(1,3), 16);
        const g = parseInt(resource.color.slice(3,5), 16);
        const b = parseInt(resource.color.slice(5,7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        terminDiv.style.color = luminance > 0.45 ? '#212529' : '#ffffff'; // Adjusted threshold
        // Make buttons inside also contrast
        const actionButtonColor = luminance > 0.45 ? '#555' : '#eee';


        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-2';
        const patientDisplay = app.patientId ? `<span class="badge bg-light text-dark small me-1">${app.patientId}</span>` : '';
        cardBody.innerHTML = `
            ${patientDisplay}
            <h6 class="card-title small mb-0" style="color: inherit;">${app.title}</h6>
            <p class="card-text small opacity-75 mb-0" style="color: inherit;">${app.time} (${app.duration} Min.)${app.notes ? ' <i class="bi bi-card-text" title="Notizen vorhanden"></i>' : ''}</p>
            <div class="mt-1 d-flex justify-content-end termin-actions">
                <button class="btn btn-sm py-0 px-1 me-1 edit-termin-btn" title="Bearbeiten" style="color: ${actionButtonColor}; border-color: ${actionButtonColor}33; background-color: ${actionButtonColor}1A"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-sm py-0 px-1 delete-termin-btn" title="Löschen" style="color: ${actionButtonColor}; border-color: ${actionButtonColor}33; background-color: ${actionButtonColor}1A"><i class="bi bi-trash"></i></button>
            </div>
        `;
         terminDiv.appendChild(cardBody);
    } else { // Fallback if no color
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-2';
        const patientDisplay = app.patientId ? `<span class="badge bg-light text-dark small me-1">${app.patientId}</span>` : '';
        cardBody.innerHTML = `
             ${patientDisplay}
            <h6 class="card-title small mb-0">${app.title}</h6>
            <p class="card-text small opacity-75 mb-0">${app.time} (${app.duration} Min.)${app.notes ? ' <i class="bi bi-card-text" title="Notizen vorhanden"></i>' : ''}</p>
            <div class="mt-1 d-flex justify-content-end termin-actions">
                <button class="btn btn-sm btn-outline-secondary py-0 px-1 me-1 edit-termin-btn" title="Bearbeiten"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-sm btn-outline-secondary py-0 px-1 delete-termin-btn" title="Löschen"><i class="bi bi-trash"></i></button>
            </div>
        `;
        terminDiv.appendChild(cardBody);
    }


    attachDragDropEventListeners(terminDiv);

    terminDiv.querySelector('.edit-termin-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openNeuerTerminDialog(app.time, app.resource, app.date, app.title, app.duration, app.id, app.notes, app.patientId);
    });
    terminDiv.querySelector('.delete-termin-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Möchten Sie den Termin "${app.title}" wirklich löschen?`)) {
            const success = storeDeleteAppointment(app.id);
            if (success) renderCalendar(currentRenderedDateInternal, getDashboardViewType());
            else alert("Fehler beim Löschen des Termins.");
        }
    });
    return terminDiv;
}

function populateResourceSelectModal(selectedResourceId) {
    if (!neuerTerminRessourceSelectEl) return;
    neuerTerminRessourceSelectEl.innerHTML = '';
    getResources().forEach(resource => {
        const option = document.createElement('option');
        option.value = resource.id;
        option.textContent = resource.name;
        if (resource.id === selectedResourceId) option.selected = true;
        neuerTerminRessourceSelectEl.appendChild(option);
    });
}

function openNeuerTerminDialog(time, resourceId, date_YYYY_MM_DD, title = '', duration = 30, existingAppointmentId = null, notes = '', patientId = '') {
    if (!neuerTerminModalInstance) return;
    
    appointmentIdInput.value = existingAppointmentId || '';
    neuerTerminTitelEl.value = title;
    neuerTerminDatumEl.value = date_YYYY_MM_DD; // Date is YYYY-MM-DD string
    neuerTerminZeitEl.value = time;
    neuerTerminDauerEl.value = duration;
    appointmentNotesEl.value = notes;
    document.getElementById('mock-patient-search').value = patientId;

    populateResourceSelectModal(resourceId);
    neuerTerminRessourceSelectEl.value = resourceId;

    const modalLabel = document.getElementById('neuerTerminModalLabel');
    if (modalLabel) modalLabel.textContent = existingAppointmentId ? 'Termin bearbeiten' : 'Neuer Termin';
    
    neuerTerminModalInstance.show();
}

if (saveTerminBtn) {
    saveTerminBtn.addEventListener('click', () => {
        const existingId = appointmentIdInput.value;
        const appointmentData = {
            id: existingId || 'termin' + Date.now(),
            title: neuerTerminTitelEl.value.trim(),
            time: neuerTerminZeitEl.value,
            duration: parseInt(neuerTerminDauerEl.value),
            resource: neuerTerminRessourceSelectEl.value,
            date: neuerTerminDatumEl.value, // This is YYYY-MM-DD string
            notes: appointmentNotesEl.value.trim(),
            patientId: document.getElementById('mock-patient-search').value.trim()
        };

        if (!appointmentData.title) { alert("Titel fehlt."); neuerTerminTitelEl.focus(); return; }
        if (isNaN(appointmentData.duration) || appointmentData.duration <= 0) { alert("Dauer ungültig."); neuerTerminDauerEl.focus(); return; }

        let success = existingId ? storeUpdateAppointment(appointmentData) : addAppointment(appointmentData);

        if (success) {
            neuerTerminModalInstance.hide();
            renderCalendar(currentRenderedDateInternal, getDashboardViewType());
        } else {
            alert("Fehler: Termin nicht gespeichert.");
        }
    });
}

function renderTagesansicht(dateForView, resources) { // dateForView is normalized (midnight)
    const dateString_YYYY_MM_DD = getDateString(dateForView);
    const calendarContainer = document.getElementById('kalender-bereich');

    const row = document.createElement('div');
    row.className = 'row g-0 position-relative day-view-row'; // Added class for easier targeting

    const nowIndicatorTime = getMockedSystemTimeForIndicator();
    if (dateString_YYYY_MM_DD === getDateString(nowIndicatorTime)) {
        const currentTimeIndicator = document.createElement('div');
        currentTimeIndicator.className = 'current-time-indicator';
        const startHour = 8; const totalHours = 10;
        const minutesPastStart = (nowIndicatorTime.getHours() - startHour) * 60 + nowIndicatorTime.getMinutes();
        const percentagePast = Math.max(0, Math.min(100, (minutesPastStart / (totalHours * 60)) * 100));
        if (percentagePast >= 0 && percentagePast <= 100) {
            currentTimeIndicator.style.top = `${percentagePast}%`;
            row.appendChild(currentTimeIndicator);
        }
    }

    let appointmentsFoundOnThisDay = false;
    resources.forEach(resource => {
        const column = document.createElement('div');
        let colClass = resources.length === 1 ? 'col-12' : resources.length === 2 ? 'col-md-6' : resources.length === 3 ? 'col-md-4' : 'col';
        column.className = `${colClass} resource-column border-end p-0`;
        column.dataset.resource = resource.id;

        const title = document.createElement('h6');
        title.className = 'text-center p-2 sticky-top shadow-sm resource-title';
        title.style.top = '0px';
        title.textContent = resource.name;
        if (resource.color) {
            title.style.backgroundColor = resource.color;
            const r = parseInt(resource.color.slice(1,3),16), g=parseInt(resource.color.slice(3,5),16), b=parseInt(resource.color.slice(5,7),16);
            title.style.color = ((0.299*r + 0.587*g + 0.114*b)/255) > 0.45 ? '#212529':'#fff';
        }
        column.appendChild(title);

        const slotContainer = document.createElement('div');
        slotContainer.className = 'time-slots-container';
        for (let hour = 8; hour < 18; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 30) {
                const timeStr = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                const slot = document.createElement('div');
                slot.className = 'calendar-slot p-1 border-bottom';
                slot.dataset.time = timeStr;
                slot.dataset.date = dateString_YYYY_MM_DD;
                slot.dataset.resource = resource.id;
                slot.innerHTML = `<span class="slot-time">${timeStr}</span>`;
                slot.style.minHeight = '40px';
                slot.addEventListener('click', function() { openNeuerTerminDialog(timeStr, resource.id, dateString_YYYY_MM_DD); });
                makeDroppable(slot);
                slotContainer.appendChild(slot);
            }
        }
        column.appendChild(slotContainer);
        
        const appointments = getAppointmentsForResource(resource.id, dateString_YYYY_MM_DD);
        if (appointments.length > 0) appointmentsFoundOnThisDay = true;
        appointments.forEach(app => {
            const terminDiv = createAppointmentElement(app);
            const targetSlot = slotContainer.querySelector(`.calendar-slot[data-time="${app.time}"]`) || slotContainer.querySelector(`.calendar-slot[data-time^="${app.time.substring(0,2)}"]`);
            if (targetSlot) targetSlot.appendChild(terminDiv);
            else slotContainer.appendChild(terminDiv);
        });
        row.appendChild(column);
    });
    calendarContainer.appendChild(row);
    
    if (!appointmentsFoundOnThisDay && resources.length > 0) { // If any resources were displayed but no appts
        calendarContainer.innerHTML = '<div class="alert alert-info text-center m-3">Keine Termine für die ausgewählten Ressourcen an diesem Tag.</div>';
    }
}

function getStartOfWeek(date) { // date is normalized (midnight)
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff)); // This also returns a date at midnight
}

function renderWochenansicht(dateForView, resources) { // dateForView is normalized
    const calendarContainer = document.getElementById('kalender-bereich');
    const startOfWeek = getStartOfWeek(dateForView); // Also normalized
    
    const table = document.createElement('table');
    table.className = 'table table-bordered week-view-table'; 
    const headerRow = table.createTHead().insertRow();
    const thCorner = document.createElement('th');
    thCorner.innerHTML = '<i class="bi bi-calendar3-week"></i>'; 
    thCorner.className = 'text-center bg-light sticky-top week-view-corner';
    thCorner.style.top = '0px';
    headerRow.appendChild(thCorner);

    resources.forEach(resource => {
        const th = document.createElement('th');
        th.className = 'text-center sticky-top resource-title-week';
        th.style.top = '0px';
        th.textContent = resource.name;
        if (resource.color) {
            th.style.backgroundColor = resource.color;
            const r=parseInt(resource.color.slice(1,3),16),g=parseInt(resource.color.slice(3,5),16),b=parseInt(resource.color.slice(5,7),16);
            th.style.color = ((0.299*r+0.587*g+0.114*b)/255)>0.45?'#212529':'#fff';
        }
        th.dataset.resource = resource.id;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    let hasAppointmentsThisWeek = false;
    for (let i = 0; i < 7; i++) { 
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i); // currentDay is also normalized
        const dateString_YYYY_MM_DD = getDateString(currentDay);

        const dayRow = tbody.insertRow();
        const dayCellLabel = dayRow.insertCell();
        dayCellLabel.className = 'fw-bold bg-light-subtle week-day-label p-2'; 
        dayCellLabel.innerHTML = `${currentDay.toLocaleDateString('de-DE', { weekday: 'short' })}<br><span class="fw-normal small">${currentDay.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })}</span>`;

        resources.forEach(resource => {
            const cell = dayRow.insertCell();
            cell.className = 'day-cell position-relative p-1'; 
            cell.dataset.date = dateString_YYYY_MM_DD;
            cell.dataset.resource = resource.id;
            makeDroppable(cell); 
            cell.addEventListener('click', (e) => {
                if (e.target === cell || e.target.closest('.week-day-label') === dayCellLabel) { 
                     openNeuerTerminDialog('09:00', resource.id, dateString_YYYY_MM_DD); 
                }
            });
            const appointments = getAppointmentsForResource(resource.id, dateString_YYYY_MM_DD);
            if (appointments.length > 0) hasAppointmentsThisWeek = true;
            appointments.forEach(app => {
                const terminDiv = createAppointmentElement(app);
                terminDiv.style.fontSize = '0.7rem'; 
                terminDiv.classList.add('mb-0'); 
                cell.appendChild(terminDiv);
            });
        });
    }
    calendarContainer.appendChild(table);
    if (!hasAppointmentsThisWeek && resources.length > 0) {
         calendarContainer.innerHTML = '<div class="alert alert-info text-center m-3">Keine Termine für die ausgewählten Ressourcen in dieser Woche.</div>';
    }
}

function renderMonatsansicht(dateForView, resources) { // dateForView is normalized
    const calendarContainer = document.getElementById('kalender-bereich');
    const firstDayOfMonth = new Date(dateForView.getFullYear(), dateForView.getMonth(), 1); // Normalized
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
    let currentCalDate = new Date(firstDayOfMonth);
    currentCalDate.setDate(firstDayOfMonth.getDate() - firstDayOfWeek); // Normalized

    const table = document.createElement('table');
    table.className = 'table table-bordered month-view-table';
    const tHead = table.createTHead();
    const headerRow = tHead.insertRow();
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(day => {
        const th = document.createElement('th');
        th.className = 'text-center bg-light p-2 small'; th.textContent = day;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    let hasAppointmentsThisMonth = false;
    for (let week = 0; week < 6; week++) { 
        const weekRow = tbody.insertRow();
        for (let day = 0; day < 7; day++) {
            const cell = weekRow.insertCell();
            cell.className = 'day-cell position-relative p-1';
            cell.style.height = '100px';
            const dateString_YYYY_MM_DD = getDateString(currentCalDate); // currentCalDate is normalized
            cell.dataset.date = dateString_YYYY_MM_DD;
            
            if (currentCalDate.getMonth() === dateForView.getMonth()) {
                cell.innerHTML = `<div class="day-number small p-1">${currentCalDate.getDate()}</div>`;
                makeDroppable(cell); 
                cell.addEventListener('click', (e) => {
                     if (e.target === cell || e.target.classList.contains('day-number')) {
                         openNeuerTerminDialog('09:00', getSelectedResources()[0] || getResources()[0].id, dateString_YYYY_MM_DD);
                     }
                });
                getSelectedResources().forEach(resourceId => {
                    const appointments = getAppointmentsForResource(resourceId, dateString_YYYY_MM_DD);
                    if (appointments.length > 0) hasAppointmentsThisMonth = true;
                    appointments.forEach(app => {
                        if (resources.find(r => r.id === app.resource)) { 
                            const terminDiv = createAppointmentElement(app);
                            terminDiv.style.fontSize = '0.6rem'; 
                            terminDiv.classList.add('mb-0', 'p-1');
                            terminDiv.setAttribute('title', `${app.title} (${getResourceById(app.resource)?.name})`);
                            cell.appendChild(terminDiv);
                        }
                    });
                });
            } else {
                cell.innerHTML = `<div class="day-number text-muted small p-1">${currentCalDate.getDate()}</div>`;
                cell.classList.add('other-month');
            }
            currentCalDate.setDate(currentCalDate.getDate() + 1); // Still normalized
        }
        if (currentCalDate.getMonth() !== dateForView.getMonth() && currentCalDate.getDate() > 7 && week > 3) break;
    }
    calendarContainer.appendChild(table);
    if (!hasAppointmentsThisMonth && resources.length > 0) {
         calendarContainer.innerHTML = '<div class="alert alert-info text-center m-3">Keine Termine für die ausgewählten Ressourcen in diesem Monat.</div>';
    }
}

export { renderCalendar }; // Only export renderCalendar, others are internal