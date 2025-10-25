// magazines.js - Gestione Riviste

let magazines = [];
let currentMagazine = null;

// Carica riviste all'avvio
document.addEventListener('DOMContentLoaded', () => {
    loadMagazines();
    
    // Form submission
    document.getElementById('magazineForm').addEventListener('submit', handleFormSubmit);
    
    // Auto-generate slug from name
    document.getElementById('name').addEventListener('input', (e) => {
        const slugInput = document.getElementById('slug');
        if (!slugInput.dataset.manuallyEdited) {
            slugInput.value = generateSlug(e.target.value);
        }
    });
    
    document.getElementById('slug').addEventListener('input', () => {
        document.getElementById('slug').dataset.manuallyEdited = 'true';
    });
    
    // Controlla se deve aprire il modal di creazione da localStorage
    if (localStorage.getItem('createNew') === 'true') {
        localStorage.removeItem('createNew');
        setTimeout(() => showCreateModal(), 500);
    }
    
    // Controlla se deve aprire il modal di creazione da parametro URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
        setTimeout(() => {
            showCreateModal();
            // Rimuovi il parametro dall'URL senza ricaricare la pagina
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
    }
});

// Genera slug da testo
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Carica tutte le riviste
async function loadMagazines() {
    try {
        const magazinesList = document.getElementById('magazinesList');
        magazinesList.innerHTML = '<div class="loading"></div>';
        
        const response = await apiRequest('/admin/magazines');
        magazines = response.data;
        
        populateYearFilter();
        displayMagazines();
    } catch (error) {
        console.error('Errore caricamento riviste:', error);
        document.getElementById('magazinesList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 50 50"><path d="M 25 2 C 12.308594 2 2 12.308594 2 25 C 2 37.691406 12.308594 48 25 48 C 37.691406 48 48 37.691406 48 25 C 48 12.308594 37.691406 2 25 2 Z M 25 4 C 36.609375 4 46 13.390625 46 25 C 46 36.609375 36.609375 46 25 46 C 13.390625 46 4 36.609375 4 25 C 4 13.390625 13.390625 4 25 4 Z M 25 11 C 24.445313 11 24 11.445313 24 12 L 24 25.5625 C 23.988281 26.101563 24.277344 26.597656 24.746094 26.84375 L 32.746094 31.84375 C 33.230469 32.097656 33.828125 31.9375 34.121094 31.476563 C 34.410156 31.015625 34.289063 30.402344 33.84375 30.0625 L 26.34375 25.40625 L 26 25.1875 L 26 12 C 26 11.445313 25.554688 11 25 11 Z"/></svg>
                </div>
                <h3>Errore nel caricamento</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Popola filtro anni
function populateYearFilter() {
    const yearFilter = document.getElementById('yearFilter');
    if (!yearFilter) return;
    
    // Estrai anni unici dalle riviste
    const years = [...new Set(magazines.map(m => {
        // Estrai anno dalla data di creazione o dall'edizione
        if (m.createdAt) {
            return new Date(m.createdAt).getFullYear();
        }
        // Prova a estrarre anno dall'edizione (es. "GENNAIO 25" -> 2025)
        const match = m.edition.match(/\d{2,4}/);
        if (match) {
            let year = parseInt(match[0]);
            if (year < 100) year += 2000; // Converti 25 in 2025
            return year;
        }
        return new Date().getFullYear();
    }))].sort((a, b) => b - a); // Ordina decrescente
    
    // Aggiungi opzioni
    yearFilter.innerHTML = '<option value="">Tutti gli anni</option>' + 
        years.map(year => `<option value="${year}">${year}</option>`).join('');
}

// Mostra riviste
function displayMagazines(filteredMagazines = null) {
    const magazinesList = document.getElementById('magazinesList');
    const list = filteredMagazines || magazines;
    
    if (list.length === 0) {
        magazinesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📖</div>
                <h3>Nessuna rivista trovata</h3>
                <p>Crea la tua prima rivista per iniziare!</p>
                <button class="btn btn-primary" onclick="showCreateModal()">
                    ➕ Crea Rivista
                </button>
            </div>
        `;
        return;
    }
    
    magazinesList.innerHTML = list.map(magazine => {
        // Cerca cover image dal blocco cover
        let coverImage = magazine.coverImage;
        if (!coverImage && magazine.blocks) {
            const coverBlock = magazine.blocks.find(b => b.type === 'cover');
            if (coverBlock && coverBlock.images && coverBlock.images.length > 0) {
                coverImage = coverBlock.images[0];
            }
        }
        
        // Status badge
        const statusBadges = {
            'draft': 'status-draft',
            'published': 'status-published',
            'archived': 'status-archived'
        };
        const statusClass = statusBadges[magazine.status] || 'status-draft';
        const statusLabels = {
            'draft': 'Bozza',
            'published': 'Pubblicata',
            'archived': 'Archiviata'
        };
        const statusLabel = statusLabels[magazine.status] || magazine.status;
        
        // Thumbnail
        const thumbnailHTML = coverImage 
            ? `<img src="${coverImage}" alt="${magazine.name}" class="compact-thumbnail">`
            : `<div class="compact-avatar">📖</div>`;
        
        return `
        <div class="compact-card" data-id="${magazine._id}">
            ${thumbnailHTML}
            
            <div class="compact-content">
                <div class="compact-main">
                    <div class="compact-title">
                        ${magazine.name}
                        ${magazine.featured ? '<span style="color: #f59e0b;">⭐</span>' : ''}
                    </div>
                    <div class="compact-details">
                        <span>📅 ${magazine.edition}</span>
                        <span>📊 ${magazine.blocks?.length || 0} blocchi</span>
                        <span>👁️ ${magazine.views || 0} visite</span>
                    </div>
                </div>
                
                <div class="compact-meta">
                    <span class="compact-badge ${statusClass}">${statusLabel}</span>
                </div>
                
                <div class="compact-actions">
                    <button class="btn btn-sm btn-primary" onclick="editBlocks('${magazine._id}')" title="Modifica Blocchi">
                        ✏️ Modifica
                    </button>
                    ${magazine.status === 'published' ? `
                    <button class="btn btn-sm btn-success" onclick="window.open('/${magazine.slug}', '_blank')" title="Apri Rivista">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                            <path d="M18 13v6a2 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M15 3h6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="openStatsModal('${magazine._id}', '${magazine.name.replace(/'/g, "\\'")}', ${magazine.views || 0}, ${magazine.blocks?.length || 0})" title="Statistiche">
                        📊
                    </button>
                    ` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="editMagazine('${magazine._id}')" title="Impostazioni">
                        ⚙️
                    </button>
                </div>
                </div>
            </div>
        </div>
    `}).join('');
}

// Filtra riviste
function filterMagazines() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const yearFilter = document.getElementById('yearFilter')?.value;
    
    const filtered = magazines.filter(magazine => {
        const matchesSearch = !searchTerm || 
            magazine.name.toLowerCase().includes(searchTerm) ||
            magazine.edition.toLowerCase().includes(searchTerm) ||
            magazine.slug.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || magazine.status === statusFilter;
        
        // Filtro per anno
        let matchesYear = true;
        if (yearFilter) {
            const year = parseInt(yearFilter);
            if (magazine.createdAt) {
                matchesYear = new Date(magazine.createdAt).getFullYear() === year;
            } else {
                // Prova a estrarre anno dall'edizione
                const match = magazine.edition.match(/\d{2,4}/);
                if (match) {
                    let editionYear = parseInt(match[0]);
                    if (editionYear < 100) editionYear += 2000;
                    matchesYear = editionYear === year;
                }
            }
        }
        
        return matchesSearch && matchesStatus && matchesYear;
    });
    
    displayMagazines(filtered);
}

// Mostra modal crea
function showCreateModal() {
    currentMagazine = null;
    document.getElementById('modalTitle').textContent = 'Nuova Rivista';
    document.getElementById('magazineForm').reset();
    document.getElementById('magazineId').value = '';
    document.getElementById('slug').dataset.manuallyEdited = '';
    
    // Nascondi pulsante elimina in modalità creazione
    document.getElementById('deleteButton').style.display = 'none';
    
    // Set default values
    document.getElementById('status').value = 'draft';
    
    document.getElementById('magazineModal').classList.add('active');
}

// Modifica rivista
async function editMagazine(id) {
    try {
        const response = await apiRequest(`/admin/magazines/${id}`);
        currentMagazine = response.data;
        
        document.getElementById('modalTitle').textContent = 'Impostazioni Rivista';
        document.getElementById('magazineId').value = currentMagazine._id;
        
        // Mostra pulsante elimina solo in edit mode
        document.getElementById('deleteButton').style.display = 'block';
        
        // Popola il form
        document.getElementById('name').value = currentMagazine.name;
        document.getElementById('slug').value = currentMagazine.slug;
        document.getElementById('edition').value = currentMagazine.edition;
        document.getElementById('editionNumber').value = currentMagazine.editionNumber;
        document.getElementById('subtitle').value = currentMagazine.subtitle || '';
        document.getElementById('description').value = currentMagazine.description || '';
        document.getElementById('coverImage').value = currentMagazine.coverImage || '';
        document.getElementById('ogImage').value = currentMagazine.ogImage || '';
        document.getElementById('status').value = currentMagazine.status;
        document.getElementById('featured').checked = currentMagazine.featured || false;
        
        if (currentMagazine.publishDate) {
            const date = new Date(currentMagazine.publishDate);
            document.getElementById('publishDate').value = date.toISOString().slice(0, 16);
        }
        
        document.getElementById('magazineModal').classList.add('active');
    } catch (error) {
        console.error('Errore caricamento rivista:', error);
        alert('Errore nel caricamento della rivista');
    }
}

// Gestisci blocchi
function editBlocks(id) {
    // Reindirizza alla pagina di gestione blocchi
    window.location.href = `blocks.html?magazine=${id}`;
}

// Chiudi modal
function closeModal() {
    document.getElementById('magazineModal').classList.remove('active');
    currentMagazine = null;
}

// Submit form
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const magazineId = document.getElementById('magazineId').value;
    
    const data = {
        name: document.getElementById('name').value,
        slug: document.getElementById('slug').value,
        edition: document.getElementById('edition').value,
        editionNumber: parseInt(document.getElementById('editionNumber').value),
        subtitle: document.getElementById('subtitle').value,
        description: document.getElementById('description').value,
        coverImage: document.getElementById('coverImage').value,
        ogImage: document.getElementById('ogImage').value,
        status: document.getElementById('status').value,
        publishDate: document.getElementById('publishDate').value || null,
        featured: document.getElementById('featured').checked
    };
    
    try {
        if (magazineId) {
            // Update
            await apiRequest(`/admin/magazines/${magazineId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            alert('✅ Rivista aggiornata con successo!');
        } else {
            // Create
            await apiRequest('/admin/magazines', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            alert('✅ Rivista creata con successo!');
        }
        
        closeModal();
        loadMagazines();
    } catch (error) {
        console.error('Errore salvataggio rivista:', error);
        alert('❌ Errore: ' + error.message);
    }
}

// Gestisce eliminazione dal modal impostazioni
async function handleDelete() {
    if (!currentMagazine) return;
    
    if (!confirm(`Sei sicuro di voler eliminare "${currentMagazine.name}"?\n\n⚠️ Questa azione eliminerà anche tutti i blocchi contenuti nella rivista.`)) {
        return;
    }
    
    try {
        await apiRequest(`/admin/magazines/${currentMagazine._id}`, {
            method: 'DELETE'
        });
        
        alert('✅ Rivista eliminata con successo!');
        closeModal();
        loadMagazines();
    } catch (error) {
        console.error('Errore eliminazione rivista:', error);
        alert('❌ Errore nell\'eliminazione: ' + error.message);
    }
}

// Elimina rivista (vecchia funzione - mantenuta per retrocompatibilità)
async function deleteMagazine(id) {
    const magazine = magazines.find(m => m._id === id);
    if (!magazine) return;
    
    if (!confirm(`Sei sicuro di voler eliminare "${magazine.name}"?\n\n⚠️ Questa azione eliminerà anche tutti i blocchi contenuti nella rivista.`)) {
        return;
    }
    
    try {
        await apiRequest(`/admin/magazines/${id}`, {
            method: 'DELETE'
        });
        
        alert('✅ Rivista eliminata con successo!');
        loadMagazines();
    } catch (error) {
        console.error('Errore eliminazione rivista:', error);
        alert('❌ Errore nell\'eliminazione: ' + error.message);
    }
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const modal = document.getElementById('magazineModal');
    if (e.target === modal) {
        closeModal();
    }
});
