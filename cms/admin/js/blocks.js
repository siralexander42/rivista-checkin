// blocks.js - Gestione Blocchi Rivista

let magazine = null;
let blocks = [];
let currentBlock = null;

// Ottieni ID rivista dalla URL
const urlParams = new URLSearchParams(window.location.search);
const magazineId = urlParams.get('magazine');

if (!magazineId) {
    alert('ID rivista mancante!');
    window.location.href = 'magazines.html';
}

// Carica dati all'avvio
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadMagazine();
    
    // Form submission
    document.getElementById('blockForm').addEventListener('submit', handleBlockFormSubmit);
});

// Carica info utente
function loadUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
    }
}

// Carica rivista e blocchi
async function loadMagazine() {
    try {
        const response = await apiRequest(`/admin/magazines/${magazineId}`);
        magazine = response.data;
        
        // Aggiorna header
        document.getElementById('magazineName').textContent = magazine.name;
        document.getElementById('magazineEdition').textContent = `Edizione ${magazine.editionNumber} • ${magazine.edition}`;
        
        // Carica blocchi
        blocks = magazine.blocks || [];
        blocks.sort((a, b) => a.position - b.position);
        
        displayBlocks();
    } catch (error) {
        console.error('Errore caricamento rivista:', error);
        alert('Errore nel caricamento della rivista');
        window.location.href = 'magazines.html';
    }
}

// Mostra blocchi
function displayBlocks() {
    const blocksList = document.getElementById('blocksList');
    const emptyState = document.getElementById('emptyState');
    
    if (blocks.length === 0) {
        blocksList.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    blocksList.style.display = 'flex';
    emptyState.style.display = 'none';
    
    blocksList.innerHTML = blocks.map((block, index) => `
        <div class="block-item" draggable="true" data-block-id="${block._id}" data-position="${index}">
            <div class="block-header">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span class="drag-handle" title="Trascina per riordinare">⋮⋮</span>
                    <div>
                        <div class="block-type-badge">
                            ${getBlockIcon(block.type)} ${getBlockTypeName(block.type)}
                        </div>
                        ${!block.visible ? '<span class="badge" style="margin-left: 8px; background: #fef3c7; color: #92400e;">👁️ Nascosto</span>' : ''}
                    </div>
                </div>
                <div class="block-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editBlock('${block._id}')">
                        ✏️ Modifica
                    </button>
                    <button class="btn btn-sm ${block.visible ? 'btn-secondary' : 'btn-success'}" onclick="toggleBlockVisibility('${block._id}')">
                        ${block.visible ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBlock('${block._id}')">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="block-content-preview">
                ${getBlockPreview(block)}
            </div>
        </div>
    `).join('');
    
    // Aggiungi drag & drop
    initDragAndDrop();
}

// Icone per tipi di blocco
function getBlockIcon(type) {
    const icons = {
        hero: '🎨',
        article: '📝',
        gallery: '🖼️',
        text: '📄',
        quote: '💬',
        video: '🎥',
        custom: '⚙️'
    };
    return icons[type] || '📦';
}

// Nomi per tipi di blocco
function getBlockTypeName(type) {
    const names = {
        hero: 'Hero Section',
        article: 'Articolo',
        gallery: 'Gallery',
        text: 'Testo',
        quote: 'Citazione',
        video: 'Video',
        custom: 'Personalizzato'
    };
    return names[type] || 'Sconosciuto';
}

// Preview contenuto blocco
function getBlockPreview(block) {
    switch (block.type) {
        case 'hero':
            return `
                <h3>${block.title || 'Hero senza titolo'}</h3>
                ${block.subtitle ? `<p>${block.subtitle}</p>` : ''}
                ${block.image ? `<img src="${block.image}" alt="${block.title}">` : ''}
            `;
        
        case 'article':
            return `
                <h3>${block.title || 'Articolo senza titolo'}</h3>
                ${block.content ? `<p>${block.content.substring(0, 150)}...</p>` : ''}
                ${block.image ? `<img src="${block.image}" alt="${block.title}">` : ''}
            `;
        
        case 'gallery':
            return `
                <h3>${block.title || 'Gallery'}</h3>
                <p>${block.images?.length || 0} immagini</p>
            `;
        
        case 'text':
            return `
                ${block.title ? `<h3>${block.title}</h3>` : ''}
                <p>${block.content?.substring(0, 200) || 'Nessun contenuto'}...</p>
            `;
        
        case 'quote':
            return `
                <p style="font-style: italic; font-size: 18px;">"${block.content || 'Citazione'}"</p>
                ${block.subtitle ? `<p style="margin-top: 8px;">— ${block.subtitle}</p>` : ''}
            `;
        
        case 'video':
            return `
                <h3>${block.title || 'Video'}</h3>
                ${block.link ? `<p>🎥 ${block.link}</p>` : '<p>Nessun video collegato</p>'}
            `;
        
        default:
            return '<p>Blocco personalizzato</p>';
    }
}

// Mostra modal tipi blocco
function showBlockTypesModal() {
    document.getElementById('blockTypesModal').classList.add('active');
}

// Chiudi modal tipi blocco
function closeBlockTypesModal() {
    document.getElementById('blockTypesModal').classList.remove('active');
}

// Aggiungi nuovo blocco
async function addBlock(type) {
    closeBlockTypesModal();
    currentBlock = null;
    
    // Reset form
    document.getElementById('blockForm').reset();
    document.getElementById('blockId').value = '';
    document.getElementById('blockType').value = type;
    document.getElementById('editModalTitle').textContent = `Nuovo Blocco ${getBlockTypeName(type)}`;
    
    // Genera form dinamico
    generateBlockForm(type);
    
    document.getElementById('editBlockModal').classList.add('active');
}

// Modifica blocco esistente
function editBlock(blockId) {
    const block = blocks.find(b => b._id === blockId);
    if (!block) return;
    
    currentBlock = block;
    
    document.getElementById('editModalTitle').textContent = `Modifica ${getBlockTypeName(block.type)}`;
    document.getElementById('blockId').value = block._id;
    document.getElementById('blockType').value = block.type;
    
    // Genera form e popola con dati esistenti
    generateBlockForm(block.type, block);
    
    document.getElementById('editBlockModal').classList.add('active');
}

// Genera form dinamico basato sul tipo di blocco
function generateBlockForm(type, data = {}) {
    const formContent = document.getElementById('blockFormContent');
    
    const forms = {
        hero: `
            <div class="form-section">
                <div class="form-group">
                    <label for="title">Titolo *</label>
                    <input type="text" id="title" required value="${data.title || ''}" placeholder="Benvenuti a CHECK-IN">
                </div>
                
                <div class="form-group">
                    <label for="subtitle">Sottotitolo</label>
                    <input type="text" id="subtitle" value="${data.subtitle || ''}" placeholder="Il magazine del viaggio">
                </div>
                
                <div class="form-group">
                    <label for="image">Immagine di sfondo</label>
                    <input type="url" id="image" value="${data.image || ''}" placeholder="https://esempio.com/hero.jpg">
                </div>
                
                <div class="form-group">
                    <label for="link">Link bottone (opzionale)</label>
                    <input type="url" id="link" value="${data.link || ''}" placeholder="https://...">
                </div>
                
                <div class="form-group">
                    <label for="buttonText">Testo bottone</label>
                    <input type="text" id="buttonText" value="${data.buttonText || ''}" placeholder="Scopri di più">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="styleLayout">Layout</label>
                        <select id="styleLayout">
                            <option value="center" ${data.style?.layout === 'center' ? 'selected' : ''}>Centro</option>
                            <option value="left" ${data.style?.layout === 'left' ? 'selected' : ''}>Sinistra</option>
                            <option value="right" ${data.style?.layout === 'right' ? 'selected' : ''}>Destra</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="styleHeight">Altezza</label>
                        <select id="styleHeight">
                            <option value="auto" ${data.style?.height === 'auto' ? 'selected' : ''}>Auto</option>
                            <option value="500px" ${data.style?.height === '500px' ? 'selected' : ''}>Media</option>
                            <option value="100vh" ${data.style?.height === '100vh' ? 'selected' : ''}>Schermo intero</option>
                        </select>
                    </div>
                </div>
            </div>
        `,
        
        article: `
            <div class="form-section">
                <div class="form-group">
                    <label for="title">Titolo *</label>
                    <input type="text" id="title" required value="${data.title || ''}" placeholder="Titolo articolo">
                </div>
                
                <div class="form-group">
                    <label for="subtitle">Sottotitolo</label>
                    <input type="text" id="subtitle" value="${data.subtitle || ''}" placeholder="Breve descrizione">
                </div>
                
                <div class="form-group">
                    <label for="content">Contenuto *</label>
                    <textarea id="content" rows="8" required placeholder="Scrivi il contenuto dell'articolo...">${data.content || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="image">Immagine</label>
                    <input type="url" id="image" value="${data.image || ''}" placeholder="https://esempio.com/article.jpg">
                </div>
                
                <div class="form-group">
                    <label for="link">Link esterno (opzionale)</label>
                    <input type="url" id="link" value="${data.link || ''}" placeholder="https://...">
                </div>
                
                <div class="form-group">
                    <label for="buttonText">Testo link</label>
                    <input type="text" id="buttonText" value="${data.buttonText || ''}" placeholder="Leggi tutto">
                </div>
            </div>
        `,
        
        gallery: `
            <div class="form-section">
                <div class="form-group">
                    <label for="title">Titolo</label>
                    <input type="text" id="title" value="${data.title || ''}" placeholder="Gallery">
                </div>
                
                <div class="form-group">
                    <label for="images">URL Immagini (una per riga)</label>
                    <textarea id="images" rows="6" placeholder="https://esempio.com/img1.jpg
https://esempio.com/img2.jpg
https://esempio.com/img3.jpg">${(data.images || []).join('\n')}</textarea>
                    <small>Inserisci un URL per riga</small>
                </div>
            </div>
        `,
        
        text: `
            <div class="form-section">
                <div class="form-group">
                    <label for="title">Titolo (opzionale)</label>
                    <input type="text" id="title" value="${data.title || ''}" placeholder="Titolo sezione">
                </div>
                
                <div class="form-group">
                    <label for="content">Testo *</label>
                    <textarea id="content" rows="10" required placeholder="Scrivi il testo...">${data.content || ''}</textarea>
                </div>
            </div>
        `,
        
        quote: `
            <div class="form-section">
                <div class="form-group">
                    <label for="content">Citazione *</label>
                    <textarea id="content" rows="4" required placeholder="Inserisci la citazione...">${data.content || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="subtitle">Autore</label>
                    <input type="text" id="subtitle" value="${data.subtitle || ''}" placeholder="Nome autore">
                </div>
            </div>
        `,
        
        video: `
            <div class="form-section">
                <div class="form-group">
                    <label for="title">Titolo</label>
                    <input type="text" id="title" value="${data.title || ''}" placeholder="Titolo video">
                </div>
                
                <div class="form-group">
                    <label for="link">URL Video (YouTube, Vimeo) *</label>
                    <input type="url" id="link" required value="${data.link || ''}" placeholder="https://www.youtube.com/watch?v=...">
                </div>
                
                <div class="form-group">
                    <label for="content">Descrizione</label>
                    <textarea id="content" rows="3" placeholder="Descrizione del video...">${data.content || ''}</textarea>
                </div>
            </div>
        `
    };
    
    formContent.innerHTML = forms[type] || '<p>Tipo blocco non supportato</p>';
    
    // Aggiungi campo visibilità per tutti i tipi
    formContent.innerHTML += `
        <div class="form-section">
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="visible" ${data.visible !== false ? 'checked' : ''}>
                    Blocco visibile
                </label>
            </div>
        </div>
    `;
}

// Submit form blocco
async function handleBlockFormSubmit(e) {
    e.preventDefault();
    
    const blockId = document.getElementById('blockId').value;
    const type = document.getElementById('blockType').value;
    
    // Raccogli dati dal form
    const blockData = {
        type,
        title: document.getElementById('title')?.value || '',
        subtitle: document.getElementById('subtitle')?.value || '',
        content: document.getElementById('content')?.value || '',
        image: document.getElementById('image')?.value || '',
        link: document.getElementById('link')?.value || '',
        buttonText: document.getElementById('buttonText')?.value || '',
        visible: document.getElementById('visible')?.checked !== false,
        style: {
            layout: document.getElementById('styleLayout')?.value || 'center',
            height: document.getElementById('styleHeight')?.value || 'auto'
        }
    };
    
    // Gallery: converti textarea in array
    if (type === 'gallery') {
        const imagesText = document.getElementById('images').value;
        blockData.images = imagesText.split('\n').filter(url => url.trim());
        delete blockData.image;
    }
    
    try {
        if (blockId) {
            // Update
            await apiRequest(`/admin/magazines/${magazineId}/blocks/${blockId}`, {
                method: 'PUT',
                body: JSON.stringify(blockData)
            });
            alert('✅ Blocco aggiornato!');
        } else {
            // Create
            await apiRequest(`/admin/magazines/${magazineId}/blocks`, {
                method: 'POST',
                body: JSON.stringify(blockData)
            });
            alert('✅ Blocco aggiunto!');
        }
        
        closeEditBlockModal();
        loadMagazine();
    } catch (error) {
        console.error('Errore salvataggio blocco:', error);
        alert('❌ Errore: ' + error.message);
    }
}

// Chiudi modal modifica
function closeEditBlockModal() {
    document.getElementById('editBlockModal').classList.remove('active');
    currentBlock = null;
}

// Toggle visibilità blocco
async function toggleBlockVisibility(blockId) {
    const block = blocks.find(b => b._id === blockId);
    if (!block) return;
    
    try {
        await apiRequest(`/admin/magazines/${magazineId}/blocks/${blockId}`, {
            method: 'PUT',
            body: JSON.stringify({ visible: !block.visible })
        });
        
        loadMagazine();
    } catch (error) {
        console.error('Errore toggle visibilità:', error);
        alert('Errore nell\'aggiornamento della visibilità');
    }
}

// Elimina blocco
async function deleteBlock(blockId) {
    if (!confirm('Sei sicuro di voler eliminare questo blocco?')) return;
    
    try {
        await apiRequest(`/admin/magazines/${magazineId}/blocks/${blockId}`, {
            method: 'DELETE'
        });
        
        alert('✅ Blocco eliminato!');
        loadMagazine();
    } catch (error) {
        console.error('Errore eliminazione blocco:', error);
        alert('❌ Errore nell\'eliminazione');
    }
}

// Drag & Drop per riordinamento
function initDragAndDrop() {
    const blockItems = document.querySelectorAll('.block-item');
    
    blockItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(this.parentElement, e.clientY);
    if (afterElement == null) {
        this.parentElement.appendChild(draggedElement);
    } else {
        this.parentElement.insertBefore(draggedElement, afterElement);
    }
}

function handleDrop(e) {
    e.stopPropagation();
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Aggiorna ordine nel backend
    updateBlocksOrder();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.block-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Aggiorna ordine blocchi
async function updateBlocksOrder() {
    const blockItems = document.querySelectorAll('.block-item');
    const newOrder = Array.from(blockItems).map((item, index) => ({
        id: item.dataset.blockId,
        position: index
    }));
    
    try {
        await apiRequest(`/admin/magazines/${magazineId}/blocks/reorder`, {
            method: 'PUT',
            body: JSON.stringify({ blocks: newOrder })
        });
    } catch (error) {
        console.error('Errore riordinamento:', error);
    }
}

// ============================================
// ANTEPRIMA E PUBBLICAZIONE
// ============================================

// Anteprima rivista - Genera HTML e apre in nuova finestra
async function previewMagazine() {
    try {
        const response = await apiRequest(`/admin/magazines/${magazineId}/generate-html`, {
            method: 'POST'
        });
        
        if (response.success && response.html) {
            // Apri preview in nuova finestra
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(response.html);
            previewWindow.document.close();
        }
    } catch (error) {
        console.error('Errore generazione preview:', error);
        alert('❌ Errore nella generazione dell\'anteprima: ' + error.message);
    }
}

// Pubblica rivista - Genera HTML e salva su index.html
async function publishMagazine() {
    if (blocks.length === 0) {
        alert('⚠️ Aggiungi almeno un blocco prima di pubblicare!');
        return;
    }
    
    if (!confirm(`🚀 Sei sicuro di voler pubblicare "${magazine.name}"?\n\nQuesta azione:\n✅ Genererà l'HTML completo\n✅ Sostituirà l'index.html pubblico\n✅ Renderà la rivista visibile online`)) {
        return;
    }
    
    try {
        // Mostra loading
        const publishBtn = event.target;
        const originalText = publishBtn.innerHTML;
        publishBtn.disabled = true;
        publishBtn.innerHTML = '⏳ Pubblicazione...';
        
        // Pubblica
        const response = await apiRequest(`/admin/magazines/${magazineId}/publish`, {
            method: 'POST'
        });
        
        if (response.success) {
            alert(`✅ RIVISTA PUBBLICATA CON SUCCESSO!\n\n📄 File: ${response.path}\n🌐 URL: ${response.url}\n📅 Data: ${new Date(response.magazine.publishDate).toLocaleString('it-IT')}\n\n🎉 La tua rivista è ora online!`);
            
            // Ricarica i dati
            await loadMagazine();
            
            // Apri la rivista pubblicata
            if (confirm('Vuoi aprire la rivista pubblicata?')) {
                window.open('../../index.html', '_blank');
            }
        }
        
        publishBtn.disabled = false;
        publishBtn.innerHTML = originalText;
        
    } catch (error) {
        console.error('Errore pubblicazione:', error);
        alert('❌ Errore nella pubblicazione: ' + error.message);
        publishBtn.disabled = false;
        publishBtn.innerHTML = originalText;
    }
}

// Close modals on click outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeBlockTypesModal();
        closeEditBlockModal();
    }
});
