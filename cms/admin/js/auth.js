// Gestione autenticazione

// Controlla se l'utente è loggato
function checkAuth() {
    const token = localStorage.getItem('cms_token');
    const currentPage = window.location.pathname;
    
    // Se non c'è token e non siamo nella pagina di login, redirect
    if (!token && !currentPage.includes('login.html')) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Se c'è token e siamo nella pagina di login, redirect alla dashboard
    if (token && currentPage.includes('login.html')) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Logout
function logout() {
    if (confirm('Vuoi davvero uscire?')) {
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
        window.location.href = 'login.html';
    }
}

// Ottieni il token per le richieste API
function getAuthToken() {
    return localStorage.getItem('cms_token');
}

// Ottieni le info utente
function getCurrentUser() {
    const userJson = localStorage.getItem('cms_user');
    return userJson ? JSON.parse(userJson) : null;
}

// Controlla se l'utente è super admin
function isSuperAdmin() {
    const user = getCurrentUser();
    return user && (user.role === 'super-admin' || user.username === 'alessandro.venturini');
}

// Gestione accesso pagina Utenti
function handleUsersAccess(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    
    console.log('=== DEBUG handleUsersAccess ===');
    console.log('User object:', user);
    console.log('User role:', user?.role);
    console.log('User username:', user?.username);
    console.log('User name:', user?.name);
    console.log('Is super-admin?:', user?.role === 'super-admin');
    console.log('Username check:', user?.username === 'alessandro.venturini');
    console.log('Name check:', user?.name === 'alessandro.venturini');
    console.log('Name includes alessandro:', user?.name?.toLowerCase().includes('alessandro'));
    
    // Super admin: accesso diretto senza password
    // Controlla sia per role che per username/name che contiene alessandro
    if (user && (
        user.role === 'super-admin' || 
        user.username === 'alessandro.venturini' ||
        user.name?.toLowerCase().includes('alessandro') ||
        user.username?.toLowerCase().includes('alessandro')
    )) {
        console.log('✅ Super admin detected - redirecting to users.html');
        window.location.href = 'users.html';
        return;
    }
    
    console.log('⚠️ Not super admin - requesting password');
    
    // Altri utenti: richiesta password
    const password = prompt('🔒 Inserisci la password per accedere alla gestione utenti:');
    
    if (password === 'alessandro.venturini') {
        window.location.href = 'users.html';
    } else if (password !== null) {
        alert('❌ Password errata');
    }
}

// Controlla autenticazione all'avvio (tranne che per login.html)
if (!window.location.pathname.includes('login.html')) {
    checkAuth();
}
