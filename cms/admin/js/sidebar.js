// sidebar.js - Gestione Sidebar Unificata
// Questo modulo gestisce la sidebar in modo centralizzato per tutte le pagine admin

/**
 * Inizializza la sidebar con la configurazione appropriata
 * @param {string} activePage - Il nome della pagina corrente (es: 'dashboard', 'magazines', 'users', etc.)
 */
function initSidebar(activePage = '') {
    const user = getCurrentUser();
    
    // Mostra messaggio di benvenuto
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage && user && user.name) {
        welcomeMessage.textContent = `Ciao ${user.name}`;
    }
    
    // Gestisci visibilità elementi basati sul ruolo
    handleRoleBasedVisibility(user);
    
    // Applica ordine personalizzato dalla modalità sviluppatore
    applySidebarOrder();
    
    // Imposta la pagina attiva
    setActivePage(activePage);
    
    // Aggiungi event listeners
    setupSidebarEventListeners();
}

/**
 * Applica l'ordine personalizzato della sidebar salvato nel localStorage
 */
function applySidebarOrder() {
    const savedOrder = localStorage.getItem('sidebarOrder');
    if (!savedOrder) return;
    
    try {
        const sidebarOrder = JSON.parse(savedOrder);
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (!sidebarNav) return;
        
        // Ottieni tutti gli elementi nav-item
        const navItems = Array.from(sidebarNav.querySelectorAll('.nav-item'));
        
        // Crea una mappa ID -> elemento
        const itemsMap = {};
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            const id = item.getAttribute('id');
            
            // Determina l'ID dell'elemento
            let itemId = null;
            if (href === 'index.html') itemId = 'dashboard';
            else if (href === 'magazines.html') itemId = 'magazines';
            else if (href === 'statistiche.html') itemId = 'statistiche';
            else if (href === 'permissions.html') itemId = 'permissions';
            else if (href === 'logs.html') itemId = 'logs';
            else if (href === 'adv.html') itemId = 'adv';
            else if (id === 'usersNavItem') itemId = 'users';
            else if (id === 'devModeNavItem') itemId = 'developer';
            
            if (itemId) {
                itemsMap[itemId] = item;
            }
        });
        
        // Riordina gli elementi secondo l'ordine salvato
        const orderedItems = sidebarOrder
            .sort((a, b) => a.order - b.order)
            .map(item => itemsMap[item.id])
            .filter(item => item !== undefined);
        
        // Svuota la sidebar nav e ri-aggiungi gli elementi nell'ordine corretto
        sidebarNav.innerHTML = '';
        orderedItems.forEach(item => {
            sidebarNav.appendChild(item);
        });
        
    } catch (e) {
        console.error('Errore applicazione ordine sidebar:', e);
    }
}

/**
 * Gestisce la visibilità degli elementi della sidebar in base al ruolo utente
 */
function handleRoleBasedVisibility(user) {
    if (!user) return;
    
    // Mostra Modalità Sviluppatore e Permessi solo per super-admin
    const devModeNavItem = document.getElementById('devModeNavItem');
    const permissionsNavItem = document.getElementById('permissionsNavItem');
    
    if (user.role === 'super-admin') {
        if (devModeNavItem) {
            devModeNavItem.style.display = 'flex';
            devModeNavItem.href = 'developer.html';
        }
        if (permissionsNavItem) {
            permissionsNavItem.style.display = 'flex';
        }
    } else {
        if (devModeNavItem) {
            devModeNavItem.style.display = 'none';
        }
        if (permissionsNavItem) {
            permissionsNavItem.style.display = 'none';
        }
    }
}

/**
 * Imposta la classe 'active' sulla pagina corrente
 */
function setActivePage(activePage) {
    if (!activePage) return;
    
    // Rimuovi tutte le classi active
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mappa delle pagine ai loro ID o href
    const pageMap = {
        'dashboard': { href: 'index.html' },
        'magazines': { href: 'magazines.html' },
        'users': { id: 'usersNavItem' },
        'permissions': { href: 'permissions.html' },
        'logs': { href: 'logs.html' },
        'developer': { id: 'devModeNavItem' },
        'blocks': { href: 'blocks.html' },
        'articles': { href: 'articles.html' },
        'adv': { href: 'adv.html' },
        'statistiche': { href: 'statistiche.html' }
    };
    
    const target = pageMap[activePage];
    if (target) {
        let navItem;
        if (target.href) {
            navItem = document.querySelector(`.nav-item[href="${target.href}"]`);
        } else if (target.id) {
            navItem = document.getElementById(target.id);
        }
        
        if (navItem) {
            navItem.classList.add('active');
        }
    }
}

/**
 * Configura gli event listeners per la sidebar
 */
function setupSidebarEventListeners() {
    // Gestione click su Utenti
    const usersNavItem = document.getElementById('usersNavItem');
    if (usersNavItem) {
        // Rimuovi eventuali listener precedenti
        const newUsersNavItem = usersNavItem.cloneNode(true);
        usersNavItem.parentNode.replaceChild(newUsersNavItem, usersNavItem);
        
        newUsersNavItem.addEventListener('click', handleUsersAccess);
    }
    
    // Gestione click Modalità Sviluppatore
    const devModeNavItem = document.getElementById('devModeNavItem');
    if (devModeNavItem) {
        // Rimuovi eventuali listener precedenti
        const newDevModeNavItem = devModeNavItem.cloneNode(true);
        devModeNavItem.parentNode.replaceChild(newDevModeNavItem, devModeNavItem);
        
        newDevModeNavItem.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'developer.html';
        });
    }
    
    // Gestione click ADV
    const advNavItem = document.getElementById('advNavItem');
    if (advNavItem) {
        // Rimuovi eventuali listener precedenti
        const newAdvNavItem = advNavItem.cloneNode(true);
        advNavItem.parentNode.replaceChild(newAdvNavItem, advNavItem);
        
        newAdvNavItem.addEventListener('click', (e) => {
            e.preventDefault();
            alert('📢 Gestione ADV in arrivo!\n\nQui potrai configurare banner pubblicitari e sponsorizzazioni.');
        });
    }
}

/**
 * Renderizza la sidebar HTML
 * Questa funzione può essere usata per iniettare la sidebar in pagine che non ce l'hanno
 */
function renderSidebar() {
    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                <img src="https://www.italiaatavola.net/images/testate/checkin-testata-hd.svg" alt="CHECK-IN" style="width: 100%; max-width: 180px; filter: brightness(0) invert(1);">
                <p id="welcomeMessage" style="color: rgba(255, 255, 255, 0.9); font-size: 12px; margin-top: 12px; font-weight: 500; letter-spacing: 0.5px; min-height: 18px; padding-left: 8px;"></p>
            </div>
            
            <nav class="sidebar-nav">
                <a href="index.html" class="nav-item">
                    <span>Dashboard</span>
                </a>
                <a href="magazines.html" class="nav-item">
                    <span>Riviste</span>
                </a>
                <a href="#" class="nav-item" id="usersNavItem">
                    <span>Utenti</span>
                </a>
                <a href="permissions.html" class="nav-item" id="permissionsNavItem" style="display: none;">
                    <span>Permessi</span>
                </a>
                <a href="logs.html" class="nav-item">
                    <span>Log Accessi</span>
                </a>
                <a href="#" class="nav-item" id="devModeNavItem" style="display: none;">
                    <span>Modalità Sviluppatore</span>
                </a>
                <a href="adv.html" class="nav-item">
                    <span>ADV</span>
                </a>
            </nav>
            
            <div class="sidebar-footer">
                <button onclick="logout()" class="btn btn-danger btn-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 25 2 C 12.308594 2 2 12.308594 2 25 C 2 37.691406 12.308594 48 25 48 C 37.691406 48 48 37.691406 48 25 C 48 12.308594 37.691406 2 25 2 Z M 25 4 C 36.609375 4 46 13.390625 46 25 C 46 36.609375 36.609375 46 25 46 C 13.390625 46 4 36.609375 4 25 C 4 13.390625 13.390625 4 25 4 Z M 32.990234 15.986328 A 1.0001 1.0001 0 0 0 32.292969 16.292969 L 25 23.585938 L 17.707031 16.292969 A 1.0001 1.0001 0 0 0 16.990234 15.990234 A 1.0001 1.0001 0 0 0 16.292969 17.707031 L 23.585938 25 L 16.292969 32.292969 A 1.0001 1.0001 0 1 0 17.707031 33.707031 L 25 26.414063 L 32.292969 33.707031 A 1.0001 1.0001 0 1 0 33.707031 32.292969 L 26.414063 25 L 33.707031 17.707031 A 1.0001 1.0001 0 0 0 32.990234 15.986328 Z"/></svg>
                    CHECK-OUT
                </button>
            </div>
        </aside>
    `;
}

// Esporta le funzioni per l'uso globale
if (typeof window !== 'undefined') {
    window.initSidebar = initSidebar;
    window.renderSidebar = renderSidebar;
    window.setActivePage = setActivePage;
}
