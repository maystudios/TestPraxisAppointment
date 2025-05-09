// js/dragDrop.js
import { updateAppointment as updateStoreAppointment, store, getCurrentDisplayDate, getDashboardViewType } from './store.js'; // Added store functions
import { renderCalendar } from './calendarView.js'; // To re-render after drop

let draggedItem = null;
let originalResource = null;
let originalTime = null;
let originalDateString = null; // Store as YYYY-MM-DD string

function attachDragDropEventListeners(element) {
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);
}

function makeDroppable(element) {
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    draggedItem = this;
    originalResource = this.dataset.resource;
    originalTime = this.dataset.time;
    originalDateString = this.dataset.date; // This is already YYYY-MM-DD from createAppointmentElement

    setTimeout(() => this.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.id);
}

function handleDragEnd() {
    if (draggedItem) draggedItem.classList.remove('dragging');
    draggedItem = null;
    originalResource = null;
    originalTime = null;
    originalDateString = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (this.classList.contains('calendar-slot') || this.classList.contains('resource-column') || this.classList.contains('day-cell')) {
        this.classList.add('drag-over-active');
    }
}

function handleDragLeave(e) {
    if (this.classList.contains('calendar-slot') || this.classList.contains('resource-column') || this.classList.contains('day-cell')) {
        this.classList.remove('drag-over-active');
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedItem && (this.classList.contains('calendar-slot') || this.classList.contains('resource-column') || this.classList.contains('day-cell'))) {
        this.classList.remove('drag-over-active');
        
        const appointmentId = draggedItem.id;
        const droppedOnResource = this.dataset.resource || this.closest('.resource-column')?.dataset.resource || this.closest('[data-resource]')?.dataset.resource;
        const droppedOnTime = this.dataset.time; // From calendar-slot in day view
        const droppedOnDateString = this.dataset.date; // YYYY-MM-DD string from slot/cell

        if (!droppedOnResource || !droppedOnDateString) {
            console.error("Drop target missing resource or date string!", this.dataset);
            handleDragEnd(); return;
        }

        const updatedAppointmentData = {
            id: appointmentId,
            resource: droppedOnResource,
            time: droppedOnTime || originalTime || '09:00',
            date: droppedOnDateString, // Use YYYY-MM-DD string
            duration: parseInt(draggedItem.dataset.duration) || 30
        };
        
        const success = updateStoreAppointment(updatedAppointmentData);

        if (success) {
            // The date for re-rendering should be relevant to the current view.
            // getCurrentDisplayDate() from store will give the currently viewed date, normalized.
            renderCalendar(getCurrentDisplayDate(), getDashboardViewType());
        } else {
            console.error("Failed to update appointment in store.");
        }
    }
    handleDragEnd();
}

export { attachDragDropEventListeners, makeDroppable };