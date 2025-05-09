// js/ui.js
// import { getCurrentView } from './store.js'; // Not strictly needed here anymore

const views = {}; // To store references to view elements

function initViews() {
    views.startseite = document.getElementById('startseite-view');
    views.login = document.getElementById('login-view');
    views.dashboard = document.getElementById('dashboard-view');
    console.log("ui.js: initViews completed. Views object:", views);
    // The actual showing of the view is handled in main.js after initViews
}

function showView(viewName) {
    console.log(`ui.js: showView called for '${viewName}'. Hiding all views first.`);
    let viewFoundInDom = false;
    // Hide all views first
    for (const key in views) {
        if (views[key]) { // Check if the view element exists in the views object
            views[key].style.display = 'none';
        } else {
            console.warn(`ui.js: View element for key '${key}' not found in views object during hide all.`);
        }
    }

    // Show the target view
    if (views[viewName] && typeof views[viewName].style !== 'undefined') { // Check if the target viewName is a valid key and a DOM element
        viewFoundInDom = true;
        if (viewName === 'dashboard') {
            views[viewName].style.display = 'block';
        } else if (viewName === 'login') {
            views[viewName].style.display = 'block'; 
        } else if (viewName === 'startseite') {
            views[viewName].style.display = 'flex'; 
        } else {
            views[viewName].style.display = 'block'; // Default for any other potential views
        }
        console.log(`ui.js: View '${viewName}' display set to: ${views[viewName].style.display}`);
    } else {
        console.error(`ui.js: Target view element for '${viewName}' not found in views object or is not a valid DOM element. views[viewName]:`, views[viewName]);
    }
    return viewFoundInDom; // Return if the view was found and style applied
}

export { initViews, showView };