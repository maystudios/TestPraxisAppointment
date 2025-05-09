// js/store.js

// Function to get initial state from localStorage or defaults
function getInitialState() {
    const storedUser = localStorage.getItem('praxisCurrentUser');
    const storedViewType = localStorage.getItem('praxisDashboardViewType');
    const storedResources = localStorage.getItem('praxisSelectedResources');

    return {
        currentUser: storedUser ? JSON.parse(storedUser) : null,
        // currentView is not persisted, it's determined by the HTML page loaded
        dashboardViewType: storedViewType || 'tagesansicht',
        selectedResources: storedResources ? JSON.parse(storedResources) : ['zahnarzt1', 'zahnarzt2'],
        appointments: { // Default appointments, not persisted for this mock
            zahnarzt1: [
                { id: 'termin1', time: '09:30', duration: 30, title: 'Kontrolle Max Mustermann', resource: 'zahnarzt1', date: '2025-05-10' },
                { id: 'termin2', time: '11:00', duration: 60, title: 'PZR Erika Mustermann', resource: 'zahnarzt1', date: '2025-05-10' }
            ],
            zahnarzt2: [
                { id: 'termin3', time: '10:00', duration: 45, title: 'Beratung Klaus Klein', resource: 'zahnarzt2', date: '2025-05-10' },
                { id: 'termin5', time: '14:00', duration: 90, title: 'Wurzelbehandlung Lisa Kurz', resource: 'zahnarzt2', date: '2025-05-12' }
            ],
            helferin1: [
                { id: 'termin4', time: '14:00', duration: 30, title: 'Assistenz Hr. Dr. Müller', resource: 'helferin1', date: '2025-05-10'}
            ],
            helferin2: []
        },
        resources: [ // Default resources
            { id: 'zahnarzt1', name: 'Zahnarzt 1', type: 'arzt' },
            { id: 'zahnarzt2', name: 'Zahnarzt 2', type: 'arzt' },
            { id: 'helferin1', name: 'Helferin 1', type: 'assistenz' },
            { id: 'helferin2', name: 'Helferin 2', type: 'assistenz' }
        ]
    };
}

const store = getInitialState();
console.log("Store initialized:", JSON.parse(JSON.stringify(store)));


function setCurrentUser(username) {
    store.currentUser = username;
    if (username) {
        localStorage.setItem('praxisCurrentUser', JSON.stringify(username));
    } else {
        localStorage.removeItem('praxisCurrentUser');
    }
    console.log("setCurrentUser:", store.currentUser);
}

function getCurrentUser() {
    // Ensure store is source of truth after initial load
    const storedUser = localStorage.getItem('praxisCurrentUser');
    store.currentUser = storedUser ? JSON.parse(storedUser) : null;
    return store.currentUser;
}

function setDashboardViewType(viewType) {
    store.dashboardViewType = viewType;
    localStorage.setItem('praxisDashboardViewType', viewType);
    console.log("setDashboardViewType:", store.dashboardViewType);
}

function getDashboardViewType() {
    store.dashboardViewType = localStorage.getItem('praxisDashboardViewType') || 'tagesansicht';
    return store.dashboardViewType;
}

function setSelectedResources(resourcesArray) {
    store.selectedResources = resourcesArray;
    localStorage.setItem('praxisSelectedResources', JSON.stringify(resourcesArray));
    console.log("setSelectedResources:", store.selectedResources);
}

function getSelectedResources() {
    const stored = localStorage.getItem('praxisSelectedResources');
    store.selectedResources = stored ? JSON.parse(stored) : ['zahnarzt1', 'zahnarzt2'];
    return store.selectedResources;
}

// Appointment and Resource getters/setters remain largely the same,
// but they operate on the 'store' object which is initialized from localStorage for some parts.

function getAppointmentsForResource(resourceId, date) {
    // Ensure appointments for the resource exist
    if (!store.appointments[resourceId]) {
        return [];
    }
    return store.appointments[resourceId].filter(app => app.date === date) || [];
}

function getAllAppointments() {
    let all = [];
    for (const resourceKey in store.appointments) {
        if (store.appointments.hasOwnProperty(resourceKey) && Array.isArray(store.appointments[resourceKey])) {
             all = all.concat(store.appointments[resourceKey]);
        }
    }
    return all;
}

function getResources() {
    return store.resources;
}

function updateAppointment(updatedAppointment) {
    let foundAndUpdated = false;
    for (const resourceKey in store.appointments) {
        if (!store.appointments.hasOwnProperty(resourceKey) || !Array.isArray(store.appointments[resourceKey])) continue;

        const resourceAppointments = store.appointments[resourceKey];
        const index = resourceAppointments.findIndex(app => app.id === updatedAppointment.id);

        if (index !== -1) {
            if (resourceKey !== updatedAppointment.resource) {
                resourceAppointments.splice(index, 1);
                if (!store.appointments[updatedAppointment.resource]) {
                    store.appointments[updatedAppointment.resource] = [];
                }
                store.appointments[updatedAppointment.resource].push(updatedAppointment);
            } else {
                resourceAppointments[index] = { ...resourceAppointments[index], ...updatedAppointment };
            }
            foundAndUpdated = true;
            break;
        }
    }
    if(foundAndUpdated){
        console.log('Store updated (updateAppointment):', JSON.parse(JSON.stringify(store.appointments)));
        // NOTE: Persisting all appointments to localStorage can be heavy for large datasets.
        // For this example, we are not persisting the appointments themselves to localStorage, only user/view prefs.
    } else {
        console.warn(`Appointment with ID ${updatedAppointment.id} not found for update.`);
    }
    return foundAndUpdated;
}

function addAppointment(newAppointment) {
    if (!newAppointment || !newAppointment.resource || !newAppointment.id) {
        console.error("Invalid appointment data for addAppointment:", newAppointment);
        return false;
    }
    if (!store.appointments[newAppointment.resource]) {
        store.appointments[newAppointment.resource] = [];
    }
    if (store.appointments[newAppointment.resource].some(app => app.id === newAppointment.id)) {
        console.warn(`Appointment with ID ${newAppointment.id} already exists. Attempting update.`);
        return updateAppointment(newAppointment);
    }
    store.appointments[newAppointment.resource].push(newAppointment);
    console.log('Store updated (addAppointment):', JSON.parse(JSON.stringify(store.appointments)));
    return true;
}

function deleteAppointment(appointmentId) {
    let foundAndDeleted = false;
    for (const resourceKey in store.appointments) {
         if (!store.appointments.hasOwnProperty(resourceKey) || !Array.isArray(store.appointments[resourceKey])) continue;
        const resourceAppointments = store.appointments[resourceKey];
        const index = resourceAppointments.findIndex(app => app.id === appointmentId);
        if (index !== -1) {
            resourceAppointments.splice(index, 1);
            foundAndDeleted = true;
            break;
        }
    }
    if(foundAndDeleted){
        console.log(`Appointment ${appointmentId} deleted.`);
    } else {
         console.warn(`Appointment with ID ${appointmentId} not found for deletion.`);
    }
    return foundAndDeleted;
}

export {
    store, // Exporting for direct read if needed, but prefer getters.
    setCurrentUser,
    getCurrentUser,
    setDashboardViewType,
    getDashboardViewType,
    setSelectedResources,
    getSelectedResources,
    getAppointmentsForResource,
    getAllAppointments,
    getResources,
    updateAppointment,
    addAppointment,
    deleteAppointment
};