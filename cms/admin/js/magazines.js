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
                    <button class="btn btn-sm btn-info" onclick="toggleChildPages('${magazine._id}')" title="Pagine Figlie">
                        📄 Pagine <span class="toggle-icon" id="toggle-${magazine._id}">▼</span>
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
            
            <!-- Blocco Collassabile Pagine Figlie -->
            <div class="child-pages-collapse" id="child-pages-${magazine._id}" style="display: none;">
                <div class="child-pages-collapse-header">
                    <h4>📄 Pagine Figlie</h4>
                    <button class="btn btn-sm btn-primary" onclick="showCreateChildPageInline('${magazine._id}')">
                        ➕ Nuova Pagina
                    </button>
                </div>
                <div class="child-pages-collapse-list" id="child-list-${magazine._id}">
                    <div class="loading-inline">Caricamento...</div>
                </div>
            </div>
        </div>
    `}).join('');
}

// Toggle collassa/espandi pagine figlie
async function toggleChildPages(magazineId) {
    const collapseDiv = document.getElementById(`child-pages-${magazineId}`);
    const toggleIcon = document.getElementById(`toggle-${magazineId}`);
    const listDiv = document.getElementById(`child-list-${magazineId}`);
    
    if (collapseDiv.style.display === 'none') {
        // Espandi
        collapseDiv.style.display = 'block';
        toggleIcon.textContent = '▲';
        
        // Carica pagine figlie
        try {
            const response = await apiRequest(`/admin/magazines/${magazineId}/child-pages`);
            const childPages = response.data;
            
            if (childPages.length === 0) {
                listDiv.innerHTML = `
                    <div class="empty-state-inline">
                        <p>📄 Nessuna pagina figlia ancora</p>
                        <button class="btn btn-sm btn-primary" onclick="showCreateChildPageInline('${magazineId}')">
                            Crea la prima pagina
                        </button>
                    </div>
                `;
            } else {
                listDiv.innerHTML = childPages.map(page => `
                    <div class="child-page-inline-item">
                        <div class="child-page-inline-info">
                            <h5>${page.name}</h5>
                            <div class="child-page-inline-meta">
                                <span class="badge badge-${page.status === 'published' ? 'success' : page.status === 'draft' ? 'warning' : 'secondary'}">
                                    ${page.status === 'published' ? 'Pubblicato' : page.status === 'draft' ? 'Bozza' : 'Archiviato'}
                                </span>
                                <span>/${page.slug}</span>
                                <span>${page.blocks?.length || 0} blocchi</span>
                            </div>
                        </div>
                        <div class="child-page-inline-actions">
                            ${page.status === 'published' ? `
                                <button class="btn btn-sm btn-secondary" onclick="window.open('${getChildPageUrl(magazineId, page.slug)}', '_blank')" title="Apri">
                                    🔗
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-primary" onclick="editChildPage('${page._id}')" title="Modifica">
                                ✏️
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteChildPageInline('${page._id}', '${page.name}', '${magazineId}')" title="Elimina">
                                🗑️
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Errore caricamento pagine figlie:', error);
            listDiv.innerHTML = '<div class="error-inline">Errore nel caricamento</div>';
        }
    } else {
        // Collassa
        collapseDiv.style.display = 'none';
        toggleIcon.textContent = '▼';
    }
}

// Mostra form creazione inline
function showCreateChildPageInline(magazineId) {
    const listDiv = document.getElementById(`child-list-${magazineId}`);
    
    listDiv.innerHTML = `
        <div class="child-page-inline-form">
            <h5>Nuova Pagina Figlia</h5>
            <form onsubmit="createChildPageInline(event, '${magazineId}')">
                <div class="form-group-inline">
                    <label>Nome *</label>
                    <input type="text" id="inline-name-${magazineId}" required placeholder="es. Speciale Carnevale Venezia">
                </div>
                <div class="form-group-inline">
                    <label>URL (slug) *</label>
                    <input type="text" id="inline-slug-${magazineId}" required placeholder="es. speciale-carnevale-venezia" pattern="[a-z0-9-]+">
                </div>
                <div class="form-group-inline">
                    <label>Meta Description</label>
                    <textarea id="inline-meta-${magazineId}" rows="2" maxlength="160" placeholder="Descrizione SEO (max 160 caratteri)"></textarea>
                </div>
                <div class="form-actions-inline">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="cancelCreateInline('${magazineId}')">
                        Annulla
                    </button>
                    <button type="submit" class="btn btn-sm btn-primary">
                        ✅ Crea
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Auto-slug
    document.getElementById(`inline-name-${magazineId}`).addEventListener('input', (e) => {
        const slugInput = document.getElementById(`inline-slug-${magazineId}`);
        if (!slugInput.dataset.manuallyEdited) {
            slugInput.value = generateSlug(e.target.value);
        }
    });
    
    document.getElementById(`inline-slug-${magazineId}`).addEventListener('input', () => {
        document.getElementById(`inline-slug-${magazineId}`).dataset.manuallyEdited = 'true';
    });
}

// Crea pagina inline
async function createChildPageInline(e, magazineId) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById(`inline-name-${magazineId}`).value,
        slug: document.getElementById(`inline-slug-${magazineId}`).value,
        metaDescription: document.getElementById(`inline-meta-${magazineId}`).value,
        status: 'draft'
    };
    
    try {
        await apiRequest(`/admin/magazines/${magazineId}/child-pages`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        alert('✅ Pagina creata con successo!');
        
        // Ricarica lista
        toggleChildPages(magazineId); // Chiudi
        setTimeout(() => toggleChildPages(magazineId), 100); // Riapri e ricarica
    } catch (error) {
        console.error('Errore creazione:', error);
        alert('❌ Errore: ' + error.message);
    }
}

// Annulla creazione inline
async function cancelCreateInline(magazineId) {
    toggleChildPages(magazineId); // Chiudi
    setTimeout(() => toggleChildPages(magazineId), 100); // Riapri e ricarica
}

// Elimina pagina inline
async function deleteChildPageInline(pageId, pageName, magazineId) {
    if (!confirm(`Sei sicuro di voler eliminare "${pageName}"?`)) {
        return;
    }
    
    try {
        await apiRequest(`/admin/child-pages/${pageId}`, {
            method: 'DELETE'
        });
        
        alert('✅ Pagina eliminata!');
        
        // Ricarica lista
        toggleChildPages(magazineId); // Chiudi
        setTimeout(() => toggleChildPages(magazineId), 100); // Riapri e ricarica
    } catch (error) {
        console.error('Errore eliminazione:', error);
        alert('❌ Errore: ' + error.message);
    }
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

// Gestisci pagine figlie
async function manageChildPages(magazineId) {
    try {
        const response = await apiRequest(`/admin/magazines/${magazineId}/child-pages`);
        const childPages = response.data;
        const magazine = magazines.find(m => m._id === magazineId);
        
        // Mostra modal con lista pagine figlie
        showChildPagesModal(magazineId, magazine.name, childPages);
    } catch (error) {
        console.error('Errore caricamento pagine figlie:', error);
        alert('Errore nel caricamento delle pagine figlie');
    }
}

// Mostra modal pagine figlie
function showChildPagesModal(magazineId, magazineName, childPages) {
    const modal = document.getElementById('childPagesModal');
    document.getElementById('childPagesModalTitle').textContent = `Pagine Figlie - ${magazineName}`;
    document.getElementById('childPagesMagazineId').value = magazineId;
    
    const list = document.getElementById('childPagesList');
    
    if (childPages.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <div class="empty-state-icon">📄</div>
                <h3>Nessuna pagina figlia</h3>
                <p>Crea la prima pagina tematica per questa rivista</p>
            </div>
        `;
    } else {
        list.innerHTML = childPages.map(page => `
            <div class="block-card-modern child-page-card">
                <div class="block-card-header">
                    <div class="block-card-left">
                        <div class="block-icon-badge" style="background:linear-gradient(135deg,#3C3D8F 0%,#2A2B5F 100%);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" stroke="white" stroke-width="1.5"/><path d="M3 9H21" stroke="white" stroke-width="1.5"/><path d="M9 9V21" stroke="white" stroke-width="1.5"/></svg>
                        </div>
                        <div class="block-card-info">
                            <div class="block-card-title-row">
                                <span class="block-card-type">${page.name}</span>
                                <span class="block-status-badge ${page.status === 'published' ? 'visible' : 'hidden'}">${page.status === 'published' ? 'PUBBLICATA' : 'BOZZA'}</span>
                            </div>
                            <div class="block-card-meta">/${page.slug} &nbsp;•&nbsp; ${page.blocks?.length || 0} blocchi &nbsp;•&nbsp; ${page.views || 0} views</div>
                        </div>
                    </div>
                    <div class="block-card-right">
                        ${page.status === 'published' ? `
                        <button class="btn-icon-modern btn-icon-preview" title="Anteprima" onclick="window.open('${getChildPageUrl(magazineId, page.slug)}', '_blank')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                        ` : ''}
                        <button class="btn-icon-modern btn-icon-edit" title="Modifica" onclick="editChildPage('${page._id}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.43741 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                        <button class="btn-icon-modern btn-icon-delete" title="Elimina" onclick="deleteChildPage('${page._id}', '${page.name}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    modal.classList.add('active');
}

// Chiudi modal pagine figlie
function closeChildPagesModal() {
    document.getElementById('childPagesModal').classList.remove('active');
    document.getElementById('createChildPageForm').reset();
    document.getElementById('createChildPageSection').style.display = 'none';
    document.getElementById('childPagesList').style.display = 'block';
}

// Mostra form creazione pagina figlia
function showCreateChildPageForm() {
    document.getElementById('childPagesList').style.display = 'none';
    document.getElementById('createChildPageSection').style.display = 'block';
    
    // Auto-generate slug
    document.getElementById('childPageName').addEventListener('input', (e) => {
        const slugInput = document.getElementById('childPageSlug');
        if (!slugInput.dataset.manuallyEdited) {
            slugInput.value = generateSlug(e.target.value);
        }
    });
    
    document.getElementById('childPageSlug').addEventListener('input', () => {
        document.getElementById('childPageSlug').dataset.manuallyEdited = 'true';
    });
}

// Annulla creazione pagina figlia
function cancelCreateChildPage() {
    document.getElementById('createChildPageSection').style.display = 'none';
    document.getElementById('childPagesList').style.display = 'block';
    document.getElementById('createChildPageForm').reset();
}

// Crea pagina figlia
async function createChildPage(e) {
    e.preventDefault();
    
    const magazineId = document.getElementById('childPagesMagazineId').value;
    const data = {
        name: document.getElementById('childPageName').value,
        slug: document.getElementById('childPageSlug').value,
        metaDescription: document.getElementById('childPageMetaDescription').value,
        status: 'draft'
    };
    
    try {
        const response = await apiRequest(`/admin/magazines/${magazineId}/child-pages`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        alert('✅ Pagina figlia creata con successo!');
        
        // Ricarica lista
        const listResponse = await apiRequest(`/admin/magazines/${magazineId}/child-pages`);
        const magazine = magazines.find(m => m._id === magazineId);
        showChildPagesModal(magazineId, magazine.name, listResponse.data);
        
        // Reset form
        document.getElementById('createChildPageForm').reset();
        document.getElementById('createChildPageSection').style.display = 'none';
        document.getElementById('childPagesList').style.display = 'block';
    } catch (error) {
        console.error('Errore creazione pagina figlia:', error);
        alert('❌ Errore: ' + error.message);
    }
}

// Modifica pagina figlia (redirect a page-blocks.html)
function editChildPage(pageId) {
    window.location.href = `page-blocks.html?page=${pageId}`;
}

// Elimina pagina figlia
async function deleteChildPage(pageId, pageName) {
    if (!confirm(`Sei sicuro di voler eliminare "${pageName}"?\n\n⚠️ Questa azione eliminerà anche tutti i blocchi della pagina.`)) {
        return;
    }
    
    try {
        await apiRequest(`/admin/child-pages/${pageId}`, {
            method: 'DELETE'
        });
        
        alert('✅ Pagina figlia eliminata con successo!');
        
        // Ricarica lista
        const magazineId = document.getElementById('childPagesMagazineId').value;
        const listResponse = await apiRequest(`/admin/magazines/${magazineId}/child-pages`);
        const magazine = magazines.find(m => m._id === magazineId);
        showChildPagesModal(magazineId, magazine.name, listResponse.data);
    } catch (error) {
        console.error('Errore eliminazione pagina figlia:', error);
        alert('❌ Errore: ' + error.message);
    }
}

// Get URL pubblica pagina figlia
function getChildPageUrl(magazineId, pageSlug) {
    const magazine = magazines.find(m => m._id === magazineId);
    if (!magazine) return '#';
    
    // URL formato: /rivista-slug/pagina-slug
    const baseUrl = window.location.origin;
    return `${baseUrl}/${magazine.slug}/${pageSlug}`;
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
