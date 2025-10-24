// ============================================
// GESTIONE UTENTI - CHECK-IN CMS
// ============================================

let currentUser = null;
let userToDelete = null;
let hasAccess = false;

// Verifica accesso alla pagina
window.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('cms_user') || '{}');
    
    // Solo super-admin può accedere (controllo già fatto da handleUsersAccess in auth.js)
    if (!user || (user.role !== 'super-admin' && user.username !== 'alessandro.venturini')) {
        alert('Accesso negato. Solo i super-admin possono accedere a questa pagina.');
        window.location.href = 'index.html';
        return;
    }

    // Accesso garantito - carica gli utenti
    hasAccess = true;
    loadUsers();
});

// Carica lista utenti
async function loadUsers() {
    const container = document.getElementById('usersContainer');
    
    try {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div></div>';
        
        const result = await api.get('/users');
        
        if (!result.success || !result.data) {
            throw new Error('Errore nel caricamento degli utenti');
        }

        const users = result.data;

        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state-modern">
                    <i data-lucide="users"></i>
                    <h3>Nessun utente trovato</h3>
                    <p>Inizia creando il primo utente</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        // Render list
        container.innerHTML = `
            <div class="users-list">
                ${users.map(user => renderUserCard(user)).join('')}
            </div>
        `;
        lucide.createIcons();
    } catch (error) {
        console.error('Errore caricamento utenti:', error);
        container.innerHTML = `
            <div class="error-state">
                <p>❌ Errore nel caricamento degli utenti</p>
                <p>${error.message}</p>
                <button onclick="loadUsers()" class="btn btn-secondary">Riprova</button>
            </div>
        `;
    }
}

// Render card utente
function renderUserCard(user) {
    const roleLabels = {
        'super-admin': 'Super Admin',
        'admin': 'Admin',
        'editor': 'Editor'
    };

    const roleClasses = {
        'super-admin': 'role-super-admin',
        'admin': 'role-admin',
        'editor': 'role-editor'
    };

    const statusBadge = user.isActive 
        ? '<span class="status-badge status-active">Attivo</span>'
        : '<span class="status-badge status-inactive">Inattivo</span>';

    const currentUserId = JSON.parse(localStorage.getItem('cms_user')).id;
    const isSelf = user._id === currentUserId;

    // Iniziali per avatar
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return `
        <div class="user-card">
            <div class="user-avatar">${initials}</div>
            <div class="user-info">
                <div class="user-main">
                    <h3 class="user-name">
                        ${user.name}
                        ${isSelf ? '<span style="font-size: 11px; color: #6366f1; font-weight: 500;">(Tu)</span>' : ''}
                    </h3>
                    <div class="user-details">
                        <span class="user-username">@${user.username}</span>
                        <span class="user-email">
                            <i data-lucide="mail"></i>
                            ${user.email}
                        </span>
                    </div>
                </div>
                <div class="user-meta">
                    <span class="user-role-badge ${roleClasses[user.role]}">
                        ${roleLabels[user.role] || user.role}
                    </span>
                    ${statusBadge}
                </div>
            </div>
            <div class="user-actions">
                <button onclick="editUser('${user._id}')" class="btn btn-secondary btn-icon-only" title="Modifica">
                    <i data-lucide="edit-2"></i>
                </button>
                ${!isSelf ? `
                    <button onclick="deleteUser('${user._id}', '${user.name}')" class="btn btn-danger btn-icon-only" title="Elimina">
                        <i data-lucide="trash-2"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Mostra modal creazione
function showCreateModal() {
    currentUser = null;
    document.getElementById('modalTitle').textContent = 'Nuovo Utente';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userActive').checked = true;
    document.getElementById('passwordRequired').style.display = 'inline';
    document.getElementById('passwordHint').style.display = 'none';
    document.getElementById('userPassword').required = true;
    document.getElementById('formError').style.display = 'none';
    document.getElementById('userModal').classList.add('active');
}

// Modifica utente
async function editUser(userId) {
    try {
        const result = await api.get('/users');
        const user = result.data.find(u => u._id === userId);
        
        if (!user) {
            throw new Error('Utente non trovato');
        }

        currentUser = user;
        document.getElementById('modalTitle').textContent = 'Modifica Utente';
        document.getElementById('userId').value = user._id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userActive').checked = user.isActive;
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = false;
        document.getElementById('passwordRequired').style.display = 'none';
        document.getElementById('passwordHint').style.display = 'block';
        document.getElementById('formError').style.display = 'none';
        document.getElementById('userModal').classList.add('active');
    } catch (error) {
        alert('Errore nel caricamento dell\'utente: ' + error.message);
    }
}

// Salva utente
async function saveUser() {
    const userId = document.getElementById('userId').value;
    const name = document.getElementById('userName').value.trim();
    const username = document.getElementById('userUsername').value.trim().toLowerCase();
    const email = document.getElementById('userEmail').value.trim().toLowerCase();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const isActive = document.getElementById('userActive').checked;
    const errorDiv = document.getElementById('formError');

    errorDiv.style.display = 'none';

    // Validazione
    if (!name || !username || !email || !role) {
        errorDiv.textContent = 'Compila tutti i campi obbligatori';
        errorDiv.style.display = 'block';
        return;
    }

    if (!userId && !password) {
        errorDiv.textContent = 'La password è obbligatoria per i nuovi utenti';
        errorDiv.style.display = 'block';
        return;
    }

    if (password && password.length < 6) {
        errorDiv.textContent = 'La password deve essere di almeno 6 caratteri';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const userData = {
            name,
            username,
            email,
            role,
            isActive
        };

        if (password) {
            userData.password = password;
        }

        let result;
        if (userId) {
            // Aggiornamento
            result = await api.put(`/users/${userId}`, userData);
        } else {
            // Creazione
            result = await api.post('/users', userData);
        }

        if (result.success) {
            closeUserModal();
            loadUsers();
        }
    } catch (error) {
        errorDiv.textContent = error.message || 'Errore nel salvataggio';
        errorDiv.style.display = 'block';
    }
}

// Elimina utente
function deleteUser(userId, userName) {
    userToDelete = userId;
    document.getElementById('deleteUserName').textContent = userName;
    document.getElementById('deleteModal').classList.add('active');
}

// Conferma eliminazione
async function confirmDelete() {
    if (!userToDelete) return;

    try {
        const result = await api.delete(`/users/${userToDelete}`);
        
        if (result.success) {
            closeDeleteModal();
            loadUsers();
        }
    } catch (error) {
        alert('Errore nell\'eliminazione: ' + error.message);
    }
}

// Chiudi modal
function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
    currentUser = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    userToDelete = null;
}

// Chiudi modal al click fuori
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'userModal') closeUserModal();
        if (e.target.id === 'deleteModal') closeDeleteModal();
    }
});
