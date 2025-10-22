// ============================================
// GESTIONE UTENTI - CHECK-IN CMS
// ============================================

let currentUser = null;
let userToDelete = null;
let hasAccess = false;

// Verifica accesso alla pagina
window.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('cms_user') || '{}');
    
    // Solo super-admin può accedere
    if (!user || user.role !== 'super-admin') {
        alert('Accesso negato. Solo i super-admin possono accedere a questa pagina.');
        window.location.href = 'index.html';
        return;
    }

    // Mostra modal password
    document.getElementById('passwordModal').style.display = 'flex';
    
    // Focus sul campo password
    document.getElementById('accessPassword').focus();
    
    // Enter per verificare
    document.getElementById('accessPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyAccess();
        }
    });
});

// Verifica password speciale
async function verifyAccess() {
    const password = document.getElementById('accessPassword').value;
    const errorDiv = document.getElementById('passwordError');
    
    errorDiv.style.display = 'none';
    
    if (!password) {
        errorDiv.textContent = 'Inserisci la password';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const result = await api.post('/users/verify-access', { password });
        
        if (result.success) {
            hasAccess = true;
            document.getElementById('passwordModal').style.display = 'none';
            loadUsers();
        }
    } catch (error) {
        errorDiv.textContent = error.message || 'Password non corretta';
        errorDiv.style.display = 'block';
        document.getElementById('accessPassword').value = '';
        document.getElementById('accessPassword').focus();
    }
}

// Carica lista utenti
async function loadUsers() {
    const container = document.getElementById('usersContainer');
    
    try {
        const result = await api.get('/users');
        
        if (!result.success || !result.data) {
            throw new Error('Errore nel caricamento degli utenti');
        }

        const users = result.data;

        if (users.length === 0) {
            container.innerHTML = '<p class="empty-state">Nessun utente trovato</p>';
            return;
        }

        // Render tabella
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Ruolo</th>
                        <th>Stato</th>
                        <th>Ultimo Accesso</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => renderUserRow(user)).join('')}
                </tbody>
            </table>
        `;
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

// Render riga utente
function renderUserRow(user) {
    const roleLabels = {
        'super-admin': 'Super Admin',
        'admin': 'Admin',
        'editor': 'Editor'
    };

    const roleColors = {
        'super-admin': 'var(--danger)',
        'admin': 'var(--primary)',
        'editor': 'var(--gray-600)'
    };

    const statusBadge = user.isActive 
        ? '<span class="badge badge-published">Attivo</span>'
        : '<span class="badge badge-draft">Disattivato</span>';

    const lastLogin = user.lastLogin 
        ? new Date(user.lastLogin).toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Mai';

    const currentUserId = JSON.parse(localStorage.getItem('cms_user')).id;
    const isSelf = user._id === currentUserId;

    return `
        <tr>
            <td><strong>${user.name}</strong></td>
            <td><code>${user.username}</code></td>
            <td>${user.email}</td>
            <td>
                <span style="color: ${roleColors[user.role]}; font-weight: 600;">
                    ${roleLabels[user.role] || user.role}
                </span>
            </td>
            <td>${statusBadge}</td>
            <td style="font-size: 13px; color: var(--gray-600);">${lastLogin}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editUser('${user._id}')" class="btn btn-sm btn-secondary" title="Modifica">
                        ✏️
                    </button>
                    ${!isSelf ? `
                        <button onclick="deleteUser('${user._id}', '${user.name}')" class="btn btn-sm btn-danger" title="Elimina">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
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
    document.getElementById('userModal').style.display = 'flex';
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
        document.getElementById('userModal').style.display = 'flex';
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
    document.getElementById('deleteModal').style.display = 'flex';
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
    document.getElementById('userModal').style.display = 'none';
    currentUser = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    userToDelete = null;
}

// Chiudi modal al click fuori
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'userModal') closeUserModal();
        if (e.target.id === 'deleteModal') closeDeleteModal();
    }
});
