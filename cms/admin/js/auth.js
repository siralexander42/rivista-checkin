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

// Controlla autenticazione all'avvio (tranne che per login.html)
if (!window.location.pathname.includes('login.html')) {
    checkAuth();
}
