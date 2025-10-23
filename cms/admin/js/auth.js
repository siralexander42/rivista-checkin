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
    return user && user.role === 'super-admin';
}

// Gestione accesso pagina Utenti
function handleUsersAccess(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    
    console.log('=== DEBUG handleUsersAccess ===');
    console.log('User object:', user);
    console.log('User role:', user?.role);
    console.log('Is super-admin?:', user?.role === 'super-admin');
    
    // Super admin: accesso diretto senza password
    if (user && user.role === 'super-admin') {
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
