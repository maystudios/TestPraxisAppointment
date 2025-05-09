// js/main-login.js
import { getCurrentUser } from './store.js';
import { initAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("main-login.js: DOMContentLoaded.");
    const currentUser = getCurrentUser();
    console.log("main-login.js: Current user from store:", currentUser);

    if (currentUser) {
        console.log("main-login.js: User already logged in. Redirecting to dashboard.html");
        window.location.href = 'dashboard.html';
    } else {
        console.log("main-login.js: No user logged in. Initializing auth for login form.");
        initAuth();
    }
});