document.addEventListener('DOMContentLoaded', function () {
    // Views
    const startseiteView = document.getElementById('startseite-view');
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');

    // Buttons
    const zumLoginBtn = document.getElementById('zum-login-btn');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Kalender Elemente (Beispielhaft)
    const kalenderBereich = document.getElementById('kalender-bereich');
    const neuerTerminDialog = document.getElementById('neuer-termin-dialog');
    const neuerTerminZeit = document.getElementById('neuer-termin-zeit');
    const neuerTerminRessource = document.getElementById('neuer-termin-ressource');

    // Mock Daten
    const mockAppointments = {
        zahnarzt1: [
            { id: 'termin1', time: '09:30', duration: 30, title: 'Kontrolle Max Mustermann', resource: 'zahnarzt1' },
            { id: 'termin2', time: '11:00', duration: 60, title: 'PZR Erika Mustermann', resource: 'zahnarzt1' }
        ],
        zahnarzt2: [
            { id: 'termin3', time: '10:00', duration: 45, title: 'Beratung Klaus Klein', resource: 'zahnarzt2' }
        ],
        helferin1: [],
        helferin2: []
    };

    // Aktueller Zustand
    let currentUser = null;
    let currentView = 'tagesansicht'; // tagesansicht, wochenansicht, monatsansicht
    let selectedResources = ['zahnarzt1', 'zahnarzt2', 'helferin1', 'helferin2']; // Alle standardmäßig ausgewählt

    // --- Navigation / View Switching ---
    function showView(viewToShow) {
        startseiteView.style.display = 'none';
        loginView.style.display = 'none';
        dashboardView.style.display = 'none';
        viewToShow.style.display = viewToShow === dashboardView ? 'block' : 'flex'; // Flex für zentrierte Views
        if (viewToShow === loginView) loginView.style.display = 'block'; // Login hat eigene Struktur
        if (viewToShow === dashboardView) dashboardView.style.display = 'block';


    }

    if (zumLoginBtn) {
        zumLoginBtn.addEventListener('click', () => {
            showView(loginView);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            // Mock login: Jeder Username ist ok, Passwort wird nicht geprüft
            if (username) {
                currentUser = username;
                showView(dashboardView);
                renderDashboard();
            } else {
                alert('Bitte Benutzernamen eingeben.');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            currentUser = null;
            showView(startseiteView);
        });
    }
    
    // --- Dashboard Logik ---
    function renderDashboard() {
        if (!currentUser) return;
        console.log(`Dashboard für ${currentUser} wird gerendert. Ansicht: ${currentView}`);
        // Hier würde die Logik zum Rendern des Kalenders basierend auf
        // currentView und selectedResources implementiert.
        // Fürs Erste zeigen wir nur die Spalte für zahnarzt1, wenn ausgewählt.
        updateResourceColumnsVisibility();
        renderAppointments(); // Termine für sichtbare Ressourcen rendern
    }

    // Ressourcenfilter Logik
    const resourceCheckboxes = document.querySelectorAll('#dashboard-view .form-check-input');
    resourceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            selectedResources = Array.from(resourceCheckboxes)
                                   .filter(i => i.checked)
                                   .map(i => i.value);
            updateResourceColumnsVisibility();
            renderAppointments(); // Termine neu rendern nach Filteränderung
        });
    });

    function updateResourceColumnsVisibility() {
        const columns = document.querySelectorAll('#kalender-bereich .resource-column');
        columns.forEach(col => {
            if (selectedResources.includes(col.dataset.resource)) {
                col.style.display = 'block';
            } else {
                col.style.display = 'none';
            }
        });
    }
    
    function renderAppointments() {
        // Alte Termine entfernen (vereinfacht - besser wäre es, nur betroffene Spalten zu aktualisieren)
        document.querySelectorAll('.termin-karte').forEach(tk => tk.remove());

        selectedResources.forEach(resourceKey => {
            const resourceColumn = document.querySelector(`.resource-column[data-resource="${resourceKey}"]`);
            if (resourceColumn && mockAppointments[resourceKey]) {
                mockAppointments[resourceKey].forEach(termin => {
                    const terminDiv = document.createElement('div');
                    terminDiv.className = 'termin-karte card mb-1';
                    terminDiv.id = termin.id;
                    terminDiv.draggable = true;
                    terminDiv.innerHTML = `<div class="card-body p-2">${termin.title} (${termin.time} - Dauer: ${termin.duration}min)</div>`;
                    
                    // Drag & Drop Event Listener
                    terminDiv.addEventListener('dragstart', handleDragStart);
                    terminDiv.addEventListener('dragend', handleDragEnd);

                    // Kontextmenü-Stub
                    terminDiv.addEventListener('click', () => {
                        alert(`Termin geklickt: ${termin.title}. Optionen: Editieren/Löschen (Mock)`);
                        // Hier könnte ein richtiges Kontextmenü oder Modal geöffnet werden
                    });
                    
                    // Einfache Einfüge-Logik (vor dem ersten Slot oder am Ende)
                    const firstSlot = resourceColumn.querySelector('.calendar-slot');
                    if (firstSlot) {
                        resourceColumn.insertBefore(terminDiv, firstSlot.nextSibling); // Nach dem ersten Slot einfügen
                    } else {
                        resourceColumn.appendChild(terminDiv);
                    }
                });
            }
        });
    }

    // Drag & Drop Handler
    let draggedItem = null;

    function handleDragStart(e) {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0); // Verzögerung für visuelles Feedback
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.id); // ID des Termins übertragen
    }

    function handleDragEnd() {
        setTimeout(() => this.classList.remove('dragging'), 0);
        draggedItem = null;
    }

    const calendarSlots = document.querySelectorAll('.calendar-slot, .resource-column'); // Auch ganze Spalten als Drop-Zone
    calendarSlots.forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragenter', handleDragEnter);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
    });
    
    function handleDragOver(e) {
        e.preventDefault(); // Notwendig, um 'drop' Event zu erlauben
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e) {
        e.preventDefault();
        this.classList.add('drag-over-active'); // Visuelles Feedback für Drop-Zone
    }

    function handleDragLeave() {
        this.classList.remove('drag-over-active');
    }

    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over-active');
        if (draggedItem) {
            const targetResource = this.dataset.resource || this.closest('.resource-column').dataset.resource;
            const targetTime = this.dataset.time; // Zeit des Slots, falls es ein Slot ist

            // Mock-Logik: Termin verschieben
            // In einer echten Anwendung: Update der Datenquelle und Neu-Rendern
            console.log(`Termin "${draggedItem.id}" verschoben zu Ressource "${targetResource}" (Zeit: ${targetTime || 'unbestimmt'})`);
            
            // Einfaches DOM-Update (visuell)
            const targetColumn = document.querySelector(`.resource-column[data-resource="${targetResource}"]`);
            if (targetColumn) {
                 // Wenn auf einen Slot gedroppt, versuche davor einzufügen
                if (this.classList.contains('calendar-slot')) {
                    this.parentNode.insertBefore(draggedItem, this);
                } else { // Sonst ans Ende der Spalte
                    targetColumn.appendChild(draggedItem);
                }
            }
            // Hier müsste der mockAppointments Datensatz aktualisiert werden
            // und dann renderAppointments() aufgerufen werden.
            // Für dieses Beispiel belassen wir es beim DOM-Update.
        }
    }

    // "Neuer Termin" bei Klick auf leere Zeitspanne (Mock)
    document.querySelectorAll('.calendar-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            const resource = this.closest('.resource-column').dataset.resource;
            const time = this.dataset.time;
            neuerTerminZeit.textContent = time;
            neuerTerminRessource.textContent = resource;
            neuerTerminDialog.style.display = 'block';
        });
    });


    // Initialisierung
    showView(startseiteView); // Starte mit der Startseite
    // renderDashboard(); // Initial das Dashboard rendern, falls direkt eingestiegen wird (z.B. nach Reload wenn eingeloggt)
});