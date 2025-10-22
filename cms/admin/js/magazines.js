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
    
    // Controlla se deve aprire il modal di creazione
    if (localStorage.getItem('createNew') === 'true') {
        localStorage.removeItem('createNew');
        setTimeout(() => showCreateModal(), 500);
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
        magazinesList.innerHTML = '<div class="loading">Caricamento riviste...</div>';
        
        const response = await apiRequest('/admin/magazines');
        magazines = response.data;
        
        displayMagazines();
    } catch (error) {
        console.error('Errore caricamento riviste:', error);
        document.getElementById('magazinesList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Errore nel caricamento</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
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
        
        const coverHTML = coverImage 
            ? `<img src="${coverImage}" alt="${magazine.name}">`
            : '📖';
        
        return `
        <div class="magazine-card" data-id="${magazine._id}">
            <div class="magazine-cover">
                ${coverHTML}
                <div class="magazine-status-badge">
                    ${getBadgeHTML(magazine.status)}
                </div>
            </div>
            
            <div class="magazine-content">
                <div class="magazine-header">
                    <div class="magazine-edition">
                        Edizione ${magazine.editionNumber} • ${magazine.edition}
                    </div>
                    <h3 class="magazine-title">${magazine.name}</h3>
                    ${magazine.subtitle ? `<p class="magazine-subtitle">${magazine.subtitle}</p>` : ''}
                </div>
                
                <div class="magazine-meta">
                    <span>📊 ${magazine.blocks?.length || 0} blocchi</span>
                    <span>👁️ ${magazine.views || 0} visite</span>
                </div>
                
                <div class="magazine-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editBlocks('${magazine._id}')">
                        ✏️ Modifica
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="editMagazine('${magazine._id}')">
                        ⚙️ Impostazioni
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// Badge status
function getBadgeHTML(status) {
    const badges = {
        'draft': '<span class="badge badge-draft">Bozza</span>',
        'published': '<span class="badge badge-published">Pubblicata</span>',
        'archived': '<span class="badge badge-archived">Archiviata</span>'
    };
    return badges[status] || '';
}

// Filtra riviste
function filterMagazines() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filtered = magazines.filter(magazine => {
        const matchesSearch = !searchTerm || 
            magazine.name.toLowerCase().includes(searchTerm) ||
            magazine.edition.toLowerCase().includes(searchTerm) ||
            magazine.slug.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || magazine.status === statusFilter;
        
        return matchesSearch && matchesStatus;
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
        document.getElementById('metaTitle').value = currentMagazine.metaTitle;
        document.getElementById('metaDescription').value = currentMagazine.metaDescription;
        document.getElementById('metaKeywords').value = currentMagazine.metaKeywords?.join(', ') || '';
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
    const keywords = document.getElementById('metaKeywords').value;
    
    const data = {
        name: document.getElementById('name').value,
        slug: document.getElementById('slug').value,
        edition: document.getElementById('edition').value,
        editionNumber: parseInt(document.getElementById('editionNumber').value),
        subtitle: document.getElementById('subtitle').value,
        description: document.getElementById('description').value,
        coverImage: document.getElementById('coverImage').value,
        ogImage: document.getElementById('ogImage').value,
        metaTitle: document.getElementById('metaTitle').value,
        metaDescription: document.getElementById('metaDescription').value,
        metaKeywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
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
