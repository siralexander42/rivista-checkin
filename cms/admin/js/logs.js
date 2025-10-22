// ============================================
// GESTIONE LOG ACCESSI - CHECK-IN CMS
// ============================================

let filterTimeout = null;

// Verifica accesso alla pagina
window.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('cms_user') || '{}');
    
    // Solo super-admin può accedere
    if (!user || user.role !== 'super-admin') {
        alert('Accesso negato. Solo i super-admin possono accedere a questa pagina.');
        window.location.href = 'index.html';
        return;
    }

    loadStats();
    loadLogs();
});

// Carica statistiche
async function loadStats() {
    try {
        const result = await api.get('/login-logs/stats');
        
        if (result.success) {
            const stats = result.data;
            document.getElementById('totalAccesses').textContent = stats.total;
            document.getElementById('successfulAccesses').textContent = stats.successful;
            document.getElementById('failedAccesses').textContent = stats.failed;
            document.getElementById('recent24h').textContent = stats.last24h.failed;
        }
    } catch (error) {
        console.error('Errore caricamento statistiche:', error);
        // In caso di errore, mostra 0 invece di crash
        document.getElementById('totalAccesses').textContent = '0';
        document.getElementById('successfulAccesses').textContent = '0';
        document.getElementById('failedAccesses').textContent = '0';
        document.getElementById('recent24h').textContent = '0';
    }
}

// Carica log accessi
async function loadLogs() {
    const container = document.getElementById('logsContainer');
    const filterStatus = document.getElementById('filterStatus').value;
    const filterLimit = document.getElementById('filterLimit').value;
    const filterUsername = document.getElementById('filterUsername').value.trim();
    
    try {
        let url = `/login-logs?limit=${filterLimit}`;
        if (filterStatus !== '') {
            url += `&success=${filterStatus}`;
        }
        if (filterUsername) {
            url += `&username=${encodeURIComponent(filterUsername)}`;
        }
        
        const result = await api.get(url);
        
        if (!result.success || !result.data) {
            throw new Error('Errore nel caricamento dei log');
        }

        const logs = result.data;

        if (logs.length === 0) {
            container.innerHTML = '<p class="empty-state">Nessun log trovato con i filtri selezionati</p>';
            return;
        }

        // Render tabella
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Data/Ora</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Esito</th>
                        <th>Errore</th>
                        <th>IP Address</th>
                        <th>User Agent</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => renderLogRow(log)).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Errore caricamento log:', error);
        
        let errorMessage = error.message || 'Errore sconosciuto';
        if (errorMessage.includes('401') || errorMessage.includes('Token') || errorMessage.includes('Sessione')) {
            errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
        
        container.innerHTML = `
            <div class="error-state">
                <p>❌ Errore nel caricamento dei log</p>
                <p>${errorMessage}</p>
                <button onclick="loadLogs()" class="btn btn-secondary">Riprova</button>
            </div>
        `;
    }
}

// Render riga log
function renderLogRow(log) {
    const date = new Date(log.createdAt).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const statusBadge = log.success 
        ? '<span class="badge badge-published">✅ Riuscito</span>'
        : '<span class="badge badge-danger">❌ Fallito</span>';

    const errorMsg = log.errorMessage || '-';
    const email = log.email || '-';
    const ipAddress = log.ipAddress || '-';
    const userAgent = log.userAgent ? truncate(log.userAgent, 50) : '-';

    return `
        <tr class="${!log.success ? 'log-failed' : ''}">
            <td style="white-space: nowrap;">${date}</td>
            <td><code>${log.username}</code></td>
            <td style="font-size: 13px;">${email}</td>
            <td>${statusBadge}</td>
            <td style="color: var(--danger); font-size: 13px;">${errorMsg}</td>
            <td><code style="font-size: 12px;">${ipAddress}</code></td>
            <td style="font-size: 11px; color: var(--gray-600);" title="${log.userAgent || ''}">${userAgent}</td>
        </tr>
    `;
}

// Filtra per username (debounced)
function filterByUsername() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        loadLogs();
    }, 500);
}

// Pulisci log vecchi
async function cleanupOldLogs() {
    const days = prompt('Elimina log più vecchi di quanti giorni?', '30');
    
    if (!days || isNaN(days)) {
        return;
    }

    if (!confirm(`Sei sicuro di voler eliminare i log più vecchi di ${days} giorni?`)) {
        return;
    }

    try {
        const result = await api.delete(`/login-logs/cleanup?days=${days}`);
        
        if (result.success) {
            alert(result.message);
            loadStats();
            loadLogs();
        }
    } catch (error) {
        alert('Errore durante la pulizia: ' + error.message);
    }
}

// Utility: tronca stringa
function truncate(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}
