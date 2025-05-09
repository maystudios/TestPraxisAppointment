// js/calendarView.js
import { getAppointmentsForResource, getSelectedResources, getResources, getDashboardViewType, addAppointment, updateAppointment as storeUpdateAppointment, deleteAppointment as storeDeleteAppointment, store } from './store.js'; // Aliased for clarity
import { attachDragDropEventListeners, makeDroppable } from './dragDrop.js';

const calendarContainer = document.getElementById('kalender-bereich');
// Modal elements (Bootstrap 5)
const neuerTerminModalEl = document.getElementById('neuerTerminModal');
let neuerTerminModalInstance = null; // To store the Bootstrap Modal instance

const appointmentIdInput = document.getElementById('appointment-id-input');
const neuerTerminTitelEl = document.getElementById('neuer-termin-titel');
const neuerTerminDatumEl = document.getElementById('neuer-termin-datum');
const neuerTerminZeitEl = document.getElementById('neuer-termin-zeit');
const neuerTerminDauerEl = document.getElementById('neuer-termin-dauer');
const neuerTerminRessourceSelectEl = document.getElementById('neuer-termin-ressource-select');
const neuerTerminRessourceHiddenEl = document.getElementById('neuer-termin-ressource-hidden');

const saveTerminBtn = document.getElementById('save-neuer-termin-btn');
// const cancelTerminBtn = document.getElementById('cancel-neuer-termin-btn'); // Bootstrap handles this with data-bs-dismiss

let currentRenderedDate = new Date();

if (neuerTerminModalEl) {
    neuerTerminModalInstance = new bootstrap.Modal(neuerTerminModalEl);
} else {
    console.error("Neuer Termin Modal element not found!");
}

function renderCalendar(dateToDisplay = new Date(), viewType = getDashboardViewType()) {
    currentRenderedDate = new Date(dateToDisplay);
    if (!calendarContainer) {
        console.error("Calendar container not found!");
        return;
    }
    calendarContainer.innerHTML = ''; 

    const selectedResourceIds = getSelectedResources();
    const allResources = getResources();
    const resourcesToDisplay = allResources.filter(r => selectedResourceIds.includes(r.id));

    if (resourcesToDisplay.length === 0 && selectedResourceIds.length > 0) {
        calendarContainer.innerHTML = '<p class="text-center text-muted">Ausgewählte Ressourcen nicht gefunden.</p>';
        return;
    }
     if (selectedResourceIds.length === 0) {
        calendarContainer.innerHTML = '<p class="text-center text-muted">Bitte wählen Sie eine Ressource.</p>';
        return;
    }

    if (viewType === 'tagesansicht') {
        renderTagesansicht(currentRenderedDate, resourcesToDisplay);
    } else if (viewType === 'wochenansicht') {
        renderWochenansicht(currentRenderedDate, resourcesToDisplay);
    } else if (viewType === 'monatsansicht') {
        renderMonatsansicht(currentRenderedDate, resourcesToDisplay);
    }
    document.querySelectorAll('.calendar-slot, .resource-column, .day-cell').forEach(makeDroppable);
}

function createAppointmentElement(app) {
    const terminDiv = document.createElement('div');
    // ... (rest of createAppointmentElement is largely the same, ensure it calls openNeuerTerminDialog correctly)
    terminDiv.className = 'termin-karte card mb-1 shadow-sm';
    terminDiv.id = app.id;
    terminDiv.draggable = true;
    terminDiv.dataset.resource = app.resource;
    terminDiv.dataset.time = app.time;
    terminDiv.dataset.date = app.date;
    terminDiv.dataset.duration = app.duration;

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body p-2';
    cardBody.innerHTML = `
        <h6 class="card-title small mb-0">${app.title}</h6>
        <p class="card-text small text-muted mb-0">${app.time} (${app.duration} Min.)</p>
        <div class="mt-1 d-flex justify-content-end">
            <button class="btn btn-sm btn-outline-primary py-0 px-1 me-1 edit-termin-btn" title="Bearbeiten"><i class="bi bi-pencil-square"></i></button>
            <button class="btn btn-sm btn-outline-danger py-0 px-1 delete-termin-btn" title="Löschen"><i class="bi bi-trash"></i></button>
        </div>
    `;
    terminDiv.appendChild(cardBody);
    attachDragDropEventListeners(terminDiv);

    cardBody.querySelector('.edit-termin-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openNeuerTerminDialog(app.time, app.resource, app.date, app.title, app.duration, app.id);
    });
    cardBody.querySelector('.delete-termin-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Möchten Sie den Termin "${app.title}" wirklich löschen?`)) {
            const success = storeDeleteAppointment(app.id);
            if (success) {
                renderCalendar(currentRenderedDate, getDashboardViewType());
            } else {
                alert("Fehler beim Löschen des Termins.");
            }
        }
    });
    return terminDiv;
}


function populateResourceSelectModal(selectedResourceId) {
    if (!neuerTerminRessourceSelectEl) return;
    neuerTerminRessourceSelectEl.innerHTML = ''; // Clear old options
    const resources = getResources();
    resources.forEach(resource => {
        const option = document.createElement('option');
        option.value = resource.id;
        option.textContent = resource.name;
        if (resource.id === selectedResourceId) {
            option.selected = true;
        }
        neuerTerminRessourceSelectEl.appendChild(option);
    });
}


function openNeuerTerminDialog(time, resourceId, date, title = '', duration = 30, existingAppointmentId = null) {
    if (!neuerTerminModalInstance || !neuerTerminTitelEl || !neuerTerminDatumEl || !neuerTerminZeitEl || !neuerTerminDauerEl || !neuerTerminRessourceSelectEl || !appointmentIdInput) {
        console.error("New/Edit appointment modal elements not found!");
        return;
    }
    
    appointmentIdInput.value = existingAppointmentId || '';
    neuerTerminTitelEl.value = title;
    neuerTerminDatumEl.value = date;
    neuerTerminZeitEl.value = time; // This can be made editable if needed
    neuerTerminDauerEl.value = duration;

    populateResourceSelectModal(resourceId);
    // The select is disabled in HTML, we set its value and store it in hidden if it remains disabled.
    // If it were enabled, we'd use its value directly.
    neuerTerminRessourceHiddenEl.value = resourceId; 


    const modalLabel = document.getElementById('neuerTerminModalLabel');
    if (modalLabel) {
        modalLabel.textContent = existingAppointmentId ? 'Termin bearbeiten' : 'Neuer Termin';
    }
    neuerTerminModalInstance.show();
}

if (saveTerminBtn) {
    saveTerminBtn.addEventListener('click', () => {
        const existingId = appointmentIdInput.value;
        const appointmentData = {
            id: existingId || 'termin' + Date.now(),
            title: neuerTerminTitelEl.value.trim(),
            time: neuerTerminZeitEl.value, // Assuming this is set and readonly from slot
            duration: parseInt(neuerTerminDauerEl.value),
            resource: neuerTerminRessourceSelectEl.value, // Get value from select
            date: neuerTerminDatumEl.value
        };

        if (!appointmentData.title) {
            alert("Bitte einen Titel für den Termin eingeben.");
            neuerTerminTitelEl.focus();
            return;
        }
        if (isNaN(appointmentData.duration) || appointmentData.duration <=0) {
            alert("Bitte eine gültige Dauer eingeben.");
            neuerTerminDauerEl.focus();
            return;
        }

        let success;
        if (existingId) {
            success = storeUpdateAppointment(appointmentData);
        } else {
            success = addAppointment(appointmentData);
        }

        if (success) {
            neuerTerminModalInstance.hide();
            renderCalendar(currentRenderedDate, getDashboardViewType());
        } else {
            alert("Fehler beim Speichern des Termins. Überprüfen Sie die Konsolenausgabe.");
        }
    });
}

// Tagesansicht, Wochenansicht, Monatsansicht, getStartOfWeek functions remain the same
// Ensure they call openNeuerTerminDialog correctly. Example for Tagesansicht slot click:
// slot.addEventListener('click', function() {
//     openNeuerTerminDialog(timeStr, resource.id, dateString);
// });
// (Make sure renderTagesansicht, renderWochenansicht, renderMonatsansicht are here)
function renderTagesansicht(date, resources) {
    const dateString = date.toISOString().split('T')[0];
    const dayHeader = document.createElement('h4'); 
    dayHeader.textContent = `${date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
    dayHeader.className = 'mb-3 text-center fw-normal';
    calendarContainer.appendChild(dayHeader);

    const row = document.createElement('div');
    row.className = 'row g-0'; 

    resources.forEach(resource => {
        const column = document.createElement('div');
        let colClass = 'col';
        if (resources.length === 1) colClass = 'col-12';
        else if (resources.length === 2) colClass = 'col-md-6';
        else if (resources.length === 3) colClass = 'col-md-4';
        else colClass = 'col-md-3'; 

        column.className = `${colClass} resource-column border-end p-1`; 
        column.dataset.resource = resource.id;

        const title = document.createElement('h6'); 
        title.className = 'text-center bg-light p-2 rounded-top sticky-top shadow-sm';
        title.style.top = '70px'; 
        title.textContent = resource.name;
        column.appendChild(title);

        const slotContainer = document.createElement('div');
        slotContainer.className = 'time-slots-container'; 
        for (let hour = 8; hour < 18; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 30) {
                const timeStr = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                const slot = document.createElement('div');
                slot.className = 'calendar-slot p-2 border-bottom';
                slot.dataset.time = timeStr;
                slot.dataset.date = dateString;
                slot.dataset.resource = resource.id;
                slot.innerHTML = `<span class="slot-time">${timeStr}</span>`; 
                slot.style.minHeight = '45px'; 
                
                slot.addEventListener('click', function() { // Ensure this is correct
                    openNeuerTerminDialog(timeStr, resource.id, dateString);
                });
                makeDroppable(slot);
                slotContainer.appendChild(slot);
            }
        }
        column.appendChild(slotContainer);
        
        const appointments = getAppointmentsForResource(resource.id, dateString);
        appointments.forEach(app => {
            const terminDiv = createAppointmentElement(app);
            const targetSlotContainer = slotContainer.querySelector(`.calendar-slot[data-time="${app.time}"]`) || slotContainer.querySelector(`.calendar-slot[data-time^="${app.time.substring(0,2)}"]`);
            if (targetSlotContainer) {
                targetSlotContainer.appendChild(terminDiv);
            } else {
                slotContainer.appendChild(terminDiv); 
            }
        });
        row.appendChild(column);
    });
    calendarContainer.appendChild(row);
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
}

function renderWochenansicht(date, resources) {
    const weekHeader = document.createElement('h4');
    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    weekHeader.textContent = `Woche: ${startOfWeek.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    weekHeader.className = 'mb-3 text-center fw-normal';
    calendarContainer.appendChild(weekHeader);

    const table = document.createElement('table');
    table.className = 'table table-bordered week-view-table'; 

    const headerRow = table.createTHead().insertRow();
    const thCorner = document.createElement('th');
    thCorner.innerHTML = '<i class="bi bi-person-lines-fill"></i>/<i class="bi bi-calendar3-week"></i>'; 
    thCorner.className = 'text-center bg-light sticky-top';
    thCorner.style.top = '70px';
    headerRow.appendChild(thCorner);

    resources.forEach(resource => {
        const th = document.createElement('th');
        th.className = 'text-center bg-light sticky-top';
        th.style.top = '70px';
        th.textContent = resource.name;
        th.dataset.resource = resource.id;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    for (let i = 0; i < 7; i++) { 
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);
        const dateString = currentDay.toISOString().split('T')[0];

        const dayRow = tbody.insertRow();
        const dayCellLabel = dayRow.insertCell();
        dayCellLabel.className = 'fw-bold bg-light-subtle week-day-label'; 
        dayCellLabel.innerHTML = `${currentDay.toLocaleDateString('de-DE', { weekday: 'short' })} <br class="d-none d-md-block"/> <span class="small">${currentDay.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })}</span>`;

        resources.forEach(resource => {
            const cell = dayRow.insertCell();
            cell.className = 'day-cell position-relative'; 
            cell.dataset.date = dateString;
            cell.dataset.resource = resource.id; // For dropping
            makeDroppable(cell); 

            cell.addEventListener('click', function(e) {
                if (e.target === cell || e.target.closest('.week-day-label') === dayCellLabel) { 
                     openNeuerTerminDialog('09:00', resource.id, dateString); 
                }
            });

            const appointments = getAppointmentsForResource(resource.id, dateString);
            appointments.forEach(app => {
                const terminDiv = createAppointmentElement(app);
                terminDiv.style.fontSize = '0.75rem'; 
                terminDiv.classList.add('mb-0'); 
                cell.appendChild(terminDiv);
            });
        });
    }
    calendarContainer.appendChild(table);
}

function renderMonatsansicht(date, resources) {
    const monthHeader = document.createElement('h4');
    monthHeader.textContent = `${date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
    monthHeader.className = 'mb-3 text-center fw-normal';
    calendarContainer.appendChild(monthHeader);

    const table = document.createElement('table');
    table.className = 'table table-bordered month-view-table';

    const tHead = table.createTHead();
    const headerRow = tHead.insertRow();
    const daysOfWeek = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    daysOfWeek.forEach(day => {
        const th = document.createElement('th');
        th.className = 'text-center bg-light';
        th.textContent = day;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 

    let currentCalDate = new Date(firstDayOfMonth);
    currentCalDate.setDate(firstDayOfMonth.getDate() - firstDayOfWeek); 

    for (let week = 0; week < 6; week++) { 
        const weekRow = tbody.insertRow();
        for (let day = 0; day < 7; day++) {
            const cell = weekRow.insertCell();
            cell.className = 'day-cell position-relative';
            cell.style.height = '120px'; 
            const dateString = currentCalDate.toISOString().split('T')[0];
            cell.dataset.date = dateString;
            
            if (currentCalDate.getMonth() === date.getMonth()) {
                cell.innerHTML = `<div class="day-number p-1">${currentCalDate.getDate()}</div>`;
                cell.classList.remove('other-month');
                makeDroppable(cell); 

                cell.addEventListener('click', function(e) {
                     if (e.target === cell || e.target.classList.contains('day-number')) {
                         openNeuerTerminDialog('09:00', getSelectedResources()[0] || getResources()[0].id, dateString);
                     }
                });
                // Display appointments for ALL selected resources in this cell
                getSelectedResources().forEach(resourceId => {
                    const appointments = getAppointmentsForResource(resourceId, dateString);
                    appointments.forEach(app => {
                        if (resources.find(r => r.id === app.resource)) { 
                            const terminDiv = createAppointmentElement(app);
                            terminDiv.style.fontSize = '0.7rem'; 
                            terminDiv.classList.add('mb-0');
                            terminDiv.setAttribute('title', `${app.title} (${getResources().find(r=>r.id === app.resource)?.name})`);
                            cell.appendChild(terminDiv);
                        }
                    });
                });
            } else {
                cell.innerHTML = `<div class="day-number text-muted p-1">${currentCalDate.getDate()}</div>`;
                cell.classList.add('other-month', 'bg-light-subtle');
            }
            currentCalDate.setDate(currentCalDate.getDate() + 1);
        }
        if (currentCalDate.getMonth() !== date.getMonth() && currentCalDate.getDate() > 7) { 
            break;
        }
    }
    calendarContainer.appendChild(table);
}


export { renderCalendar, createAppointmentElement, openNeuerTerminDialog };