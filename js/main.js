// js/main.js
import { initViews, showView as displayView } from './ui.js';
import { initAuth } from './auth.js';
import { getCurrentUser, getCurrentView, setView } from './store.js';
import { initDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("main.js: DOMContentLoaded event fired.");
    initViews();
    console.log("main.js: initViews() called.");
    initAuth();
    console.log("main.js: initAuth() called.");

    const initialView = getCurrentView();
    const currentUser = getCurrentUser();
    console.log(`main.js: Initial state - currentUser=${currentUser}, initialView=${initialView}`);

    if (currentUser && initialView === 'dashboard') {
        console.log("main.js: Condition: currentUser && initialView === 'dashboard'. Showing dashboard.");
        displayView('dashboard');
        initDashboard();
    } else if (!currentUser && initialView === 'dashboard') {
        console.log("main.js: Condition: !currentUser && initialView === 'dashboard'. Redirecting to login.");
        setView('login'); // Update store
        displayView('login'); // Show UI
    } else {
        console.log(`main.js: Condition: Else. Showing initialView or default: ${initialView || 'startseite'}`);
        displayView(initialView || 'startseite');
    }
    console.log("main.js: DOMContentLoaded handler finished.");
});