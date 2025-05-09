// js/store.js

function getInitialState() {
    const storedUser = localStorage.getItem('praxisCurrentUser');
    const storedViewType = localStorage.getItem('praxisDashboardViewType');
    const storedResources = localStorage.getItem('praxisSelectedResources');
    let storedCurrentDate = localStorage.getItem('praxisCurrentDisplayDate');

    // CORE MOCKED DATES:
    // This is "TODAY" for all logical operations (e.g., what date "Today" button goes to). Set to Midnight.
    const MOCKED_LOGICAL_TODAY = new Date('2025-05-09T00:00:00');
    // This is the specific time for the "current time indicator" line on "TODAY".
    const MOCKED_SYSTEM_TIME_FOR_INDICATOR = new Date('2025-05-09T10:30:00');

    let initialDisplayDate;
    if (storedCurrentDate) {
        initialDisplayDate = new Date(storedCurrentDate);
        initialDisplayDate.setHours(0, 0, 0, 0); // Normalize from localStorage
    } else {
        initialDisplayDate = new Date(MOCKED_LOGICAL_TODAY); // Default to our mocked "today"
    }

    return {
        currentUser: storedUser ? JSON.parse(storedUser) : null,
        dashboardViewType: storedViewType || 'tagesansicht',
        selectedResources: storedResources ? JSON.parse(storedResources) : ['zahnarzt1', 'zahnarzt2'],
        currentDisplayDate: initialDisplayDate,
        mockedSystemTimeForIndicator: MOCKED_SYSTEM_TIME_FOR_INDICATOR,
        mockedLogicalToday: MOCKED_LOGICAL_TODAY, // Store this for easier access
        appointments: {
            zahnarzt1: [
                { id: 'termin1', time: '09:00', duration: 60, title: 'Kontrolle Max Mustermann', resource: 'zahnarzt1', date: '2025-05-09', patientId: 'p123', notes: 'Standardkontrolle.' },
                { id: 'termin2', time: '11:30', duration: 30, title: 'PZR Erika Mustermann', resource: 'zahnarzt1', date: '2025-05-09', patientId: 'p456', notes: 'Regelmäßige PZR.' },
                { id: 'termin6', time: '14:00', duration: 45, title: 'Füllung Anna Schmidt', resource: 'zahnarzt1', date: '2025-05-09', patientId: 'p789', notes: 'Karies oben links.' },
                { id: 'termin7', time: '10:00', duration: 60, title: 'Beratung N. Patient', resource: 'zahnarzt1', date: '2025-05-10', patientId: 'pNew', notes: 'Erstgespräch.' },
            ],
            zahnarzt2: [
                { id: 'termin3', time: '08:30', duration: 90, title: 'WB L. Kurz', resource: 'zahnarzt2', date: '2025-05-09', patientId: 'p101', notes: 'Fortsetzung WB.' },
                { id: 'termin5', time: '15:00', duration: 60, title: 'Prothese H. Meier', resource: 'zahnarzt2', date: '2025-05-09', patientId: 'p112', notes: 'Druckstellen.' },
                { id: 'termin8', time: '11:00', duration: 30, title: 'Kontrolle Kind', resource: 'zahnarzt2', date: '2025-05-12', patientId: 'pChild', notes: 'Halbjährlich.' },
            ],
            helferin1: [
                { id: 'termin4', time: '09:00', duration: 60, title: 'Assist. Dr. Grün (Max M.)', resource: 'helferin1', date: '2025-05-09', patientId: 'p123', notes: '' },
                { id: 'termin9', time: '15:00', duration: 60, title: 'Instrumente', resource: 'helferin1', date: '2025-05-09', patientId: '', notes: 'Sterilisation.'},
            ],
            helferin2: [
                { id: 'termin10', time: '08:30', duration: 90, title: 'Assist. Dr. Weiß (L. Kurz)', resource: 'helferin2', date: '2025-05-09', patientId: 'p101', notes: ''},
            ]
        },
        resources: [
            { id: 'zahnarzt1', name: 'Dr. E. Grün', type: 'arzt', color: '#66BB6A' },
            { id: 'zahnarzt2', name: 'Dr. K. Weiß', type: 'arzt', color: '#AED581' },
            { id: 'helferin1', name: 'M. Schnell', type: 'assistenz', color: '#FFAB91' },
            { id: 'helferin2', name: 'P. Lang', type: 'assistenz', color: '#FFCC80' }
        ],
        quickStats: { totalAppointmentsToday: 0, utilizationPercent: 0, nextUpcomingAppointment: null }
    };
}

const store = getInitialState();
console.log("Store initialized. Initial display date:", store.currentDisplayDate.toISOString().split('T')[0]);


function normalizeDate(date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

function setCurrentUser(username) {
    store.currentUser = username;
    if (username) localStorage.setItem('praxisCurrentUser', JSON.stringify(username));
    else localStorage.removeItem('praxisCurrentUser');
}
function getCurrentUser() {
    const storedUser = localStorage.getItem('praxisCurrentUser');
    store.currentUser = storedUser ? JSON.parse(storedUser) : null;
    return store.currentUser;
}

function setDashboardViewType(viewType) {
    store.dashboardViewType = viewType;
    localStorage.setItem('praxisDashboardViewType', viewType);
}
function getDashboardViewType() {
    store.dashboardViewType = localStorage.getItem('praxisDashboardViewType') || 'tagesansicht';
    return store.dashboardViewType;
}

function setSelectedResources(resourcesArray) {
    store.selectedResources = resourcesArray;
    localStorage.setItem('praxisSelectedResources', JSON.stringify(resourcesArray));
}
function getSelectedResources() {
    const stored = localStorage.getItem('praxisSelectedResources');
    store.selectedResources = stored ? JSON.parse(stored) : [store.resources[0].id, store.resources[1].id];
    return store.selectedResources;
}

function setCurrentDisplayDate(date) {
    store.currentDisplayDate = normalizeDate(date);
    localStorage.setItem('praxisCurrentDisplayDate', store.currentDisplayDate.toISOString());
}
function getCurrentDisplayDate() {
    // Prioritize store.currentDisplayDate if it's already a valid date from current session's logic
    if (store.currentDisplayDate instanceof Date && !isNaN(store.currentDisplayDate)) {
         // Ensure it's normalized if somehow it wasn't (e.g. direct manipulation for testing)
        store.currentDisplayDate = normalizeDate(store.currentDisplayDate);
        return new Date(store.currentDisplayDate); // Return a copy
    }
    // Fallback to localStorage or default mocked logical today
    const storedDate = localStorage.getItem('praxisCurrentDisplayDate');
    let dateToUse = storedDate ? new Date(storedDate) : new Date(store.mockedLogicalToday);
    store.currentDisplayDate = normalizeDate(dateToUse);
    return new Date(store.currentDisplayDate); // Return a copy
}

function getMockedSystemTimeForIndicator() {
    return new Date(store.mockedSystemTimeForIndicator);
}
function getMockedLogicalToday() {
    return new Date(store.mockedLogicalToday);
}

function getAppointmentsForResource(resourceId, dateString_YYYY_MM_DD) {
    if (!store.appointments[resourceId]) return [];
    return store.appointments[resourceId].filter(app => app.date === dateString_YYYY_MM_DD);
}

function getAllAppointmentsForDate(dateString_YYYY_MM_DD) {
    let appointmentsOnDate = [];
    for (const resourceId in store.appointments) {
        if (store.appointments.hasOwnProperty(resourceId) && Array.isArray(store.appointments[resourceId])) {
            const resourceAppointments = store.appointments[resourceId].filter(app => app.date === dateString_YYYY_MM_DD);
            appointmentsOnDate = appointmentsOnDate.concat(resourceAppointments);
        }
    }
    return appointmentsOnDate;
}

function getResources() { return store.resources; }
function getResourceById(resourceId) { return store.resources.find(r => r.id === resourceId); }

function updateAppointment(updatedAppointment) {
    let foundAndUpdated = false;
    for (const resourceKey in store.appointments) {
        if (!store.appointments.hasOwnProperty(resourceKey) || !Array.isArray(store.appointments[resourceKey])) continue;
        const resourceAppointments = store.appointments[resourceKey];
        const index = resourceAppointments.findIndex(app => app.id === updatedAppointment.id);
        if (index !== -1) {
            const originalAppointment = resourceAppointments[index];
            if (resourceKey !== updatedAppointment.resource) {
                resourceAppointments.splice(index, 1);
                if (!store.appointments[updatedAppointment.resource]) store.appointments[updatedAppointment.resource] = [];
                store.appointments[updatedAppointment.resource].push({...originalAppointment, ...updatedAppointment});
            } else {
                resourceAppointments[index] = { ...originalAppointment, ...updatedAppointment };
            }
            foundAndUpdated = true;
            break;
        }
    }
    if(foundAndUpdated) calculateQuickStats(getCurrentDisplayDate());
    return foundAndUpdated;
}

function addAppointment(newAppointment) {
    if (!newAppointment || !newAppointment.resource || !newAppointment.id) return false;
    if (!store.appointments[newAppointment.resource]) store.appointments[newAppointment.resource] = [];
    if (store.appointments[newAppointment.resource].some(app => app.id === newAppointment.id)) {
        return updateAppointment(newAppointment);
    }
    store.appointments[newAppointment.resource].push(newAppointment);
    calculateQuickStats(getCurrentDisplayDate());
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
    if(foundAndDeleted) calculateQuickStats(getCurrentDisplayDate());
    return foundAndDeleted;
}

function calculateQuickStats(dateForStats) { // dateForStats is already normalized
    const dateString = dateForStats.toISOString().split('T')[0];
    const appointmentsForDay = getAllAppointmentsForDate(dateString)
                              .filter(app => getSelectedResources().includes(app.resource));

    store.quickStats.totalAppointmentsToday = appointmentsForDay.length;

    const totalSlots = getSelectedResources().length * 20; // 8-18h = 10h = 20 slots of 30min
    store.quickStats.utilizationPercent = totalSlots > 0 ? Math.min(100, Math.round((appointmentsForDay.length / totalSlots) * 100)) : 0;

    store.quickStats.nextUpcomingAppointment = null;
    const nowIndicatorTime = getMockedSystemTimeForIndicator();
    if (dateString === nowIndicatorTime.toISOString().split('T')[0]) { // Only if viewing "today"
        const upcoming = appointmentsForDay
            .filter(app => {
                const [hours, minutes] = app.time.split(':');
                const appTime = new Date(dateString);
                appTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                return appTime >= nowIndicatorTime;
            })
            .sort((a, b) => a.time.localeCompare(b.time));

        if (upcoming.length > 0) {
            const nextApp = upcoming[0];
            const resource = getResourceById(nextApp.resource);
            store.quickStats.nextUpcomingAppointment = {
                time: nextApp.time,
                title: nextApp.title,
                resourceName: resource ? resource.name : nextApp.resource
            };
        }
    }
}
function getQuickStats() { return store.quickStats; }

export {
    store, setCurrentUser, getCurrentUser,
    setDashboardViewType, getDashboardViewType,
    setSelectedResources, getSelectedResources,
    setCurrentDisplayDate, getCurrentDisplayDate,
    getMockedSystemTimeForIndicator, getMockedLogicalToday,
    getAppointmentsForResource, getAllAppointmentsForDate,
    getResources, getResourceById,
    updateAppointment, addAppointment, deleteAppointment,
    calculateQuickStats, getQuickStats
};