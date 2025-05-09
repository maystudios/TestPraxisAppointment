// js/auth.js
import { setCurrentUser } from './store.js';
// No need for showView or clearDashboard from here, as page navigation handles UI changes.

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn'); // Will only be present on dashboard.html

    console.log("auth.js: initAuth called.");

    if (loginForm) {
        console.log("auth.js: Login form found.");
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("auth.js: Login form submitted!");
            const usernameInput = document.getElementById('username');
            const username = usernameInput.value;

            if (username) {
                setCurrentUser(username); // This now saves to localStorage via store.js
                console.log("auth.js: User set. Redirecting to dashboard.html");
                window.location.href = 'dashboard.html';
            } else {
                alert('Bitte Benutzernamen eingeben.');
                console.warn("auth.js: Username was empty.");
            }
        });
    } else {
        // This is expected if initAuth is called on dashboard.html where no login form exists
        console.log("auth.js: Login form (id='login-form') not found on this page.");
    }

    if (logoutBtn) {
        console.log("auth.js: Logout button found.");
        logoutBtn.addEventListener('click', () => {
            console.log("auth.js: Logout button clicked.");
            setCurrentUser(null); // This now clears from localStorage via store.js
            console.log("auth.js: User cleared. Redirecting to index.html");
            window.location.href = 'index.html';
        });
    } else {
        // Expected if on login.html
        console.log("auth.js: Logout button (id='logout-btn') not found on this page.");
    }
}

export { initAuth };