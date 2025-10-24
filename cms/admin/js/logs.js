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
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>Nessun log trovato</h3><p>Nessun accesso con i filtri selezionati</p></div>';
            return;
        }

        // Render con layout compatto
        container.innerHTML = logs.map(log => {
            const date = new Date(log.createdAt).toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const statusClass = log.success ? 'status-published' : 'status-inactive';
            const statusLabel = log.success ? 'Riuscito' : 'Fallito';
            const statusIcon = log.success ? '✅' : '❌';

            const errorMsg = log.errorMessage || '';
            const email = log.email || '-';
            const ipAddress = log.ipAddress || '-';
            const userAgent = log.userAgent ? truncate(log.userAgent, 60) : '-';

            return `
                <div class="compact-card ${!log.success ? 'log-failed' : ''}" style="${!log.success ? 'border-color: #fee2e2; background: #fff5f5;' : ''}">
                    <div class="compact-avatar" style="${log.success ? 'background: linear-gradient(135deg, #10b981 0%, #059669 100%);' : 'background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);'}">
                        ${statusIcon}
                    </div>
                    
                    <div class="compact-content">
                        <div class="compact-main">
                            <div class="compact-title">
                                ${log.username}
                                ${!log.success && errorMsg ? `<span style="font-size: 11px; color: #ef4444; font-weight: 500;">(${errorMsg})</span>` : ''}
                            </div>
                            <div class="compact-details">
                                <span>📧 ${email}</span>
                                <span>🌐 ${ipAddress}</span>
                                <span>🕐 ${date}</span>
                            </div>
                            ${userAgent !== '-' ? `<div style="font-size: 11px; color: #9ca3af; margin-top: 4px;" title="${log.userAgent || ''}">${userAgent}</div>` : ''}
                        </div>
                        
                        <div class="compact-meta">
                            <span class="compact-badge ${statusClass}">${statusLabel}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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
