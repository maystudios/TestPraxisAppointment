// js/dragDrop.js
import { updateAppointment } from './store.js';
import { renderCalendar } from './calendarView.js'; // To re-render after drop

let draggedItem = null; // The appointment card being dragged
let originalResource = null;
let originalTime = null; // Or other original properties

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
    originalTime = this.dataset.time; // Assuming time is a data attribute on the card

    setTimeout(() => this.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.id); // id of the appointment
}

function handleDragEnd() {
    if (draggedItem) { // Check if draggedItem is not null
      draggedItem.classList.remove('dragging');
    }
    draggedItem = null;
    originalResource = null;
    originalTime = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    // Add visual cue to drop target, e.g., highlight
    if (this.classList.contains('calendar-slot') || this.classList.contains('resource-column')) {
        this.classList.add('drag-over-active');
    }
}

function handleDragLeave(e) {
    // Remove visual cue from drop target
    if (this.classList.contains('calendar-slot') || this.classList.contains('resource-column')) {
        this.classList.remove('drag-over-active');
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedItem && (this.classList.contains('calendar-slot') || this.classList.contains('resource-column'))) {
        this.classList.remove('drag-over-active');
        const appointmentId = draggedItem.id;
        const targetResource = this.dataset.resource || this.closest('.resource-column')?.dataset.resource;
        const targetTime = this.dataset.time; // Time of the slot, if applicable

        if (!targetResource) {
            console.error("Drop target has no resource defined!");
            return;
        }

        console.log(`Attempting to drop appointment ${appointmentId} to resource ${targetResource} at time ${targetTime || 'any'}`);

        // Mock update: In a real app, update backend, then update store, then re-render.
        // For now, directly update store and re-render.
        const success = updateAppointment({
            id: appointmentId,
            resource: targetResource,
            time: targetTime || originalTime, // If dropped on column, keep original time or a default
            // date might also change if dropping on a different day in week/month view
        });

        if (success) {
            // Re-render the calendar to reflect the change
            // This needs access to the current date/view type from store
            renderCalendar(new Date(draggedItem.dataset.date || '2025-05-10'), store.dashboardViewType);
        } else {
            console.error("Failed to update appointment in store.");
            // Optionally, revert visual drag if store update fails
        }
    }
    // Ensure dragging class is removed even if drop is not on a valid target but dragend doesn't fire correctly
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
    }
    draggedItem = null;
}

export { attachDragDropEventListeners, makeDroppable };