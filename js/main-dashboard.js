// js/main-dashboard.js
import { getCurrentUser, setCurrentDisplayDate, getCurrentDisplayDate } from './store.js';
import { initAuth } from './auth.js';
import { initDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("main-dashboard.js: DOMContentLoaded.");
    const currentUser = getCurrentUser(); // Holt den User aus localStorage (via store)
    const currentUserDisplay = document.getElementById('current-user-display');

    if (currentUserDisplay && currentUser) {
        currentUserDisplay.innerHTML = `<i class="bi bi-person-circle me-1"></i> ${currentUser}`;
    } else if (currentUserDisplay) {
        currentUserDisplay.textContent = 'Nicht angemeldet'; // Fallback
    }


    if (!currentUser) {
        console.log("main-dashboard.js: No user logged in. Redirecting to login.html");
        window.location.href = 'login.html';
        return; // Stop further execution if redirecting
    }
    
    console.log("main-dashboard.js: User logged in. Initializing.");
    // Ensure current display date is initialized correctly
    let initialDate = getCurrentDisplayDate(); // Gets normalized date from store/localStorage/default
    setCurrentDisplayDate(initialDate); // Sets it back to store, ensuring normalization and localStorage update

    initAuth(); 
    initDashboard(); 
});