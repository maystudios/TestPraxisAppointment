// js/main-dashboard.js
import { getCurrentUser } from './store.js';
import { initAuth } from './auth.js'; // For logout button
import { initDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("main-dashboard.js: DOMContentLoaded.");
    const currentUser = getCurrentUser();
    console.log("main-dashboard.js: Current user from store:", currentUser);

    if (!currentUser) {
        console.log("main-dashboard.js: No user logged in. Redirecting to login.html");
        window.location.href = 'login.html';
    } else {
        console.log("main-dashboard.js: User logged in. Initializing auth (for logout) and dashboard.");
        initAuth(); // Sets up logout button listener
        initDashboard(); // Initializes the main dashboard functionality
    }
});