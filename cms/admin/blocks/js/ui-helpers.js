// ============================================
// STATS MODAL FUNCTIONS
// ============================================

function openStatsModal(magazineId, magazineName, views, blocks) {
    document.getElementById('statsModalTitle').textContent = magazineName;
    document.getElementById('statsViews').textContent = views.toLocaleString();
    document.getElementById('statsBlocks').textContent = blocks;
    
    // Calcola giorni online (simulato per ora)
    const daysOnline = Math.floor(Math.random() * 90) + 1;
    document.getElementById('statsDays').textContent = daysOnline;
    
    // Calcola media giornaliera
    const avgDaily = daysOnline > 0 ? Math.round(views / daysOnline) : 0;
    document.getElementById('statsAvg').textContent = avgDaily.toLocaleString();
    
    document.getElementById('statsModal').classList.add('active');
}

function closeStatsModal() {
    document.getElementById('statsModal').classList.remove('active');
}

// Chiudi modal cliccando fuori
document.getElementById('statsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'statsModal') {
        closeStatsModal();
    }
});

// Chiudi modal con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeStatsModal();
    }
});

// ============================================
// MAGAZINE SETTINGS MANAGEMENT
// ============================================

let currentMagazineData = null;

/**
 * Apre il modal delle impostazioni rivista completo
 */
async function openEditMagazineModal() {
    const magazineId = getMagazineId();
    
    if (!magazineId) {
        alert('Errore: ID rivista non trovato');
        return;
    }
    
    try {
        // Usa apiRequest invece di fetch per usare il corretto API_BASE_URL
        const result = await apiRequest(`/admin/magazines/${magazineId}`);
        const magazine = result.data;
        currentMagazineData = magazine;
        
        // Popola form completo con dati esistenti
        document.getElementById('magazineId').value = magazine._id;
        document.getElementById('name').value = magazine.name || '';
        document.getElementById('slug').value = magazine.slug || '';
        document.getElementById('edition').value = magazine.edition || '';
        document.getElementById('editionNumber').value = magazine.editionNumber || '';
        document.getElementById('subtitle').value = magazine.subtitle || '';
        document.getElementById('description').value = magazine.description || '';
        document.getElementById('coverImage').value = magazine.coverImage || '';
        document.getElementById('ogImage').value = magazine.ogImage || magazine.coverImage || '';
        document.getElementById('status').value = magazine.status || 'draft';
        document.getElementById('featured').checked = magazine.featured || false;
        
        if (magazine.publishDate) {
            const date = new Date(magazine.publishDate);
            document.getElementById('publishDate').value = date.toISOString().slice(0, 16);
        }
        
        // Apri modal
        const modal = document.getElementById('magazineSettingsModal');
        if (modal) {
            modal.classList.add('active');
        }
        
    } catch (error) {
        console.error('Errore caricamento impostazioni:', error);
        alert('Errore: ' + error.message);
        showNotification('Errore nel caricamento delle impostazioni', 'error');
    }
}

/**
 * Chiude il modal delle impostazioni (stesso metodo di magazines.html)
 */
function closeMagazineSettings() {
    document.getElementById('magazineSettingsModal').classList.remove('active');
}

/**
 * Salva i dati completi della rivista
 */
async function saveMagazineData(event) {
    if (event) event.preventDefault();
    
    const magazineId = document.getElementById('magazineId').value;
    if (!magazineId) return;
    
    const magazineData = {
        name: document.getElementById('name').value.trim(),
        slug: document.getElementById('slug').value.trim(),
        edition: document.getElementById('edition').value.trim(),
        editionNumber: parseInt(document.getElementById('editionNumber').value),
        subtitle: document.getElementById('subtitle').value.trim(),
        description: document.getElementById('description').value.trim(),
        coverImage: document.getElementById('coverImage').value.trim(),
        ogImage: document.getElementById('ogImage').value.trim(),
        status: document.getElementById('status').value,
        featured: document.getElementById('featured').checked,
        publishDate: document.getElementById('publishDate').value || null
    };
    
    try {
        // Usa apiRequest invece di fetch
        await apiRequest(`/admin/magazines/${magazineId}`, {
            method: 'PUT',
            body: JSON.stringify(magazineData)
        });
        
        showNotification('Impostazioni salvate con successo', 'success');
        closeMagazineSettings();
        
        // Ricarica i dati della rivista per aggiornare UI
        await loadMagazine();
        
    } catch (error) {
        console.error('Errore salvataggio:', error);
        showNotification('Errore nel salvataggio delle impostazioni', 'error');
    }
}

/**
 * Aggiorna il contatore caratteri
 */
function updateCharCounter(inputId, counterId, maxChars) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    
    if (!input || !counter) return;
    
    const length = input.value.length;
    counter.textContent = length;
    
    // Rimuovi classi precedenti
    counter.classList.remove('warning', 'error');
    
    // Aggiungi classe appropriata
    if (length > maxChars) {
        counter.classList.add('error');
    } else if (length > maxChars * 0.9) {
        counter.classList.add('warning');
    }
}

/**
 * Ottiene l'ID della rivista corrente dall'URL
 */
function getMagazineId() {
    const params = new URLSearchParams(window.location.search);
    // Cerca sia 'magazine' che 'id' per retrocompatibilità
    return params.get('magazine') || params.get('id');
}

/**
 * Mostra notifica toast
 */
function showNotification(message, type = 'info') {
    // Rimuovi notifiche precedenti
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
        info: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// ============================================
// INITIALIZATION
// ============================================

// Inizializza pagina
document.addEventListener('DOMContentLoaded', () => {
    // Inizializza sidebar unificata
    initSidebar('blocks');
});

lucide.createIcons();
