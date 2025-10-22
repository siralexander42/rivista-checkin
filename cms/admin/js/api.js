// API Client per comunicare con il backend

// Usa l'URL di produzione se disponibile, altrimenti localhost
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : 'https://rivista-checkin.onrender.com/api';

// Helper per le richieste autenticate
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);
        
        // Se 401, logout automatico
        if (response.status === 401) {
            localStorage.removeItem('cms_token');
            localStorage.removeItem('cms_user');
            window.location.href = 'login.html';
            throw new Error('Sessione scaduta');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Errore nella richiesta');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// API Methods
const api = {
    // Generic methods
    get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
    
    post: (endpoint, data) => apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    put: (endpoint, data) => apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    delete: (endpoint) => apiRequest(endpoint, {
        method: 'DELETE'
    }),
    
    // Articles
    getArticles: () => apiRequest('/admin/articles'),
    
    getArticle: (id) => apiRequest(`/admin/articles/${id}`),
    
    createArticle: (data) => apiRequest('/admin/articles', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    updateArticle: (id, data) => apiRequest(`/admin/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    deleteArticle: (id) => apiRequest(`/admin/articles/${id}`, {
        method: 'DELETE'
    }),
    
    // Public (per anteprima)
    getPublicArticles: () => fetch(`${API_BASE_URL}/articles`).then(r => r.json())
};
