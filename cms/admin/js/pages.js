// pages.js - Gestione Editor Pagine Figlie
let childPage = null;
let blocks = [];
let parentMagazine = null;

// Ottieni ID pagina dalla URL
const urlParams = new URLSearchParams(window.location.search);
const pageId = urlParams.get('page'); // CAMBIATO DA 'id' A 'page'

if (!pageId) {
    alert('ID pagina mancante!');
    window.location.href = 'magazines.html';
}

// Carica dati all'avvio
document.addEventListener('DOMContentLoaded', () => {
    loadChildPage();
});

// Carica pagina figlia e blocchi
async function loadChildPage() {
    try {
        const response = await apiRequest(`/admin/child-pages/${pageId}`);
        childPage = response.data;
        
        console.log('📄 Pagina figlia caricata:', childPage);
        console.log('🔗 parentMagazineId:', childPage.parentMagazineId);
        
        // Carica info rivista madre
        if (childPage.parentMagazineId) {
            console.log('📚 Carico rivista madre con ID:', childPage.parentMagazineId);
            const magResponse = await apiRequest(`/admin/magazines/${childPage.parentMagazineId}`);
            parentMagazine = magResponse.data;
            console.log('✅ Rivista madre caricata:', parentMagazine);
            console.log('📦 Blocchi disponibili:', parentMagazine.blocks ? parentMagazine.blocks.length : 0);
        } else {
            console.error('❌ childPage.parentMagazineId è undefined/null!');
        }
        
        // Aggiorna header
        document.getElementById('pageName').textContent = childPage.title || childPage.name;
        document.getElementById('pageInfo').textContent = childPage.slug;
        if (parentMagazine) {
            document.getElementById('magazineInfo').textContent = `${parentMagazine.name} - ${parentMagazine.edition}`;
        }
        
        // Carica blocchi
        blocks = childPage.blocks || [];
        blocks.sort((a, b) => a.position - b.position);
        
        displayBlocks();
    } catch (error) {
        console.error('Errore caricamento pagina:', error);
        alert('Errore nel caricamento della pagina');
        window.location.href = 'magazines.html';
    }
}

// Mostra blocchi UGUALE ALLA RIVISTA MADRE
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
    
    blocksList.innerHTML = blocks.map((block, index) => {
        const preview = getBlockPreview(block);
        const hasContent = preview && preview.trim().length > 0;
        
        return `
        <div class="block-card-modern" draggable="true" data-block-id="${block._id}" data-position="${index}">
            <!-- Header Card -->
            <div class="block-card-header" onclick="toggleBlockCard(this)">
                <div class="block-card-left">
                    <svg class="drag-handle-modern" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50">
                        <path d="M 0 7.5 L 0 12.5 L 50 12.5 L 50 7.5 Z M 0 22.5 L 0 27.5 L 50 27.5 L 50 22.5 Z M 0 37.5 L 0 42.5 L 50 42.5 L 50 37.5 Z"/>
                    </svg>
                    
                    <div class="block-icon-badge">
                        ${getBlockIcon(block.type)}
                    </div>
                    
                    <div class="block-card-info">
                        <div class="block-card-title-row">
                            <span class="block-card-type">${getBlockTypeName(block.type)}</span>
                            ${!block.visible ? '<span class="block-status-badge hidden">Nascosto</span>' : '<span class="block-status-badge visible">Visibile</span>'}
                            ${block.title ? `<span class="block-card-title-inline">${block.title}</span>` : ''}
                        </div>
                        <div class="block-card-meta">${getBlockMeta(block)}</div>
                    </div>
                </div>
                
                <div class="block-card-right">
                    <button class="btn-icon-modern btn-icon-delete" onclick="event.stopPropagation(); deleteBlock('${block._id}')" title="Elimina">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    ${hasContent ? `<button class="btn-icon-modern btn-icon-expand" title="Espandi">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>` : ''}
                </div>
            </div>
            
            ${hasContent ? `<div class="block-card-body"><div class="block-card-content">${preview}</div></div>` : ''}
        </div>
        `;
    }).join('');
    
    initDragAndDrop();
}

function toggleBlockCard(header) {
    const card = header.closest('.block-card-modern');
    const body = card.querySelector('.block-card-body');
    if (body) card.classList.toggle('expanded');
}

function initDragAndDrop() {
    const cards = document.querySelectorAll('.block-card-modern');
    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.5';
}

function handleDragOver(e) {
    e.preventDefault();
    return false;
}

function handleDrop(e) {
    e.stopPropagation();
    if (draggedElement !== this) {
        const allCards = [...document.querySelectorAll('.block-card-modern')];
        const draggedIndex = allCards.indexOf(draggedElement);
        const targetIndex = allCards.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
        saveBlocksOrder();
    }
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    draggedElement = null;
}

async function saveBlocksOrder() {
    const cards = document.querySelectorAll('.block-card-modern');
    const newOrder = Array.from(cards).map((card, index) => ({
        id: card.dataset.blockId,
        position: index
    }));
    
    try {
        await apiRequest(`/admin/child-pages/${pageId}/blocks/reorder`, {
            method: 'PUT',
            body: JSON.stringify({ blocks: newOrder })
        });
        alert('Ordine salvato');
    } catch (error) {
        alert('Errore: ' + error.message);
    }
}

function goBackToMagazine() {
    if (childPage && childPage.parentMagazineId) {
        window.location.href = `blocks.html?magazine=${childPage.parentMagazineId}`;
    } else {
        window.location.href = 'magazines.html';
    }
}

// AGGIUNGI BLOCCO - Mostra blocchi della rivista madre
async function showBlockTypesModal() {
    console.log('🔍 showBlockTypesModal chiamato');
    console.log('📚 parentMagazine:', parentMagazine);
    console.log('📦 Blocchi:', parentMagazine ? parentMagazine.blocks : 'N/A');
    
    if (!parentMagazine) {
        alert('Rivista madre non caricata. Ricarica la pagina.');
        return;
    }
    
    if (!parentMagazine.blocks || parentMagazine.blocks.length === 0) {
        alert(`Nessun blocco disponibile nella rivista madre "${parentMagazine.name}"`);
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'selectBlockModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h2>Seleziona Blocco dalla Rivista Madre</h2>
                <button class="modal-close" onclick="closeSelectBlockModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 20px; color: #64748b;">Seleziona un blocco da aggiungere:</p>
                <div style="display: grid; gap: 12px;">
                    ${parentMagazine.blocks.map((block, index) => `
                        <div onclick="addBlockFromParent('${block._id}')" style="padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 32px;">${getBlockIconSimple(block.type)}</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #1e293b;">${block.title || getBlockTypeName(block.type)}</div>
                                <div style="font-size: 13px; color: #64748b;">${getBlockTypeName(block.type)} • Posizione ${index + 1}</div>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5V19M5 12H19" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    modal.onclick = (e) => { if (e.target === modal) closeSelectBlockModal(); };
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeSelectBlockModal() {
    const modal = document.getElementById('selectBlockModal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

async function addBlockFromParent(parentBlockId) {
    const parentBlock = parentMagazine.blocks.find(b => b._id === parentBlockId);
    if (!parentBlock) {
        alert('Blocco non trovato');
        return;
    }
    
    closeSelectBlockModal();
    
    try {
        const newBlock = { ...parentBlock, position: blocks.length, visible: true };
        delete newBlock._id;
        
        const response = await apiRequest(`/admin/child-pages/${pageId}/blocks`, {
            method: 'POST',
            body: JSON.stringify(newBlock)
        });
        
        if (response.success) {
            alert('Blocco aggiunto!');
            await loadChildPage();
        }
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore: ' + error.message);
    }
}

async function deleteBlock(blockId) {
    if (!confirm('Eliminare questo blocco?')) return;
    
    try {
        await apiRequest(`/admin/child-pages/${pageId}/blocks/${blockId}`, { method: 'DELETE' });
        alert('Blocco eliminato');
        await loadChildPage();
    } catch (error) {
        alert('Errore: ' + error.message);
    }
}

async function previewPage() {
    if (!currentPage) return;
    
    try {
        // Genera HTML per anteprima
        const response = await apiRequest(`/admin/child-pages/${currentPage._id}/generate-html`, {
            method: 'POST'
        });
        
        if (response.success && response.previewUrl) {
            // Apri anteprima in nuova finestra
            window.open(response.previewUrl, '_blank');
        } else {
            alert('Errore nella generazione dell\'anteprima');
        }
    } catch (error) {
        console.error('Errore anteprima:', error);
        alert('Errore: ' + error.message);
    }
}

async function publishPage() {
    if (!childPage) return;
    if (!confirm('Vuoi pubblicare questa pagina?')) return;
    
    try {
        await apiRequest(`/admin/child-pages/${pageId}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'published',
                publishDate: new Date().toISOString()
            })
        });
        alert('Pagina pubblicata!');
        await loadChildPage();
    } catch (error) {
        alert('Errore: ' + error.message);
    }
}

function openEditPageModal() {
    alert('Impostazioni pagina - Da implementare');
}

// Funzioni di supporto
function getBlockTypeName(type) {
    const names = {
        cover: 'Copertina', hero: 'Hero', article: 'Articolo',
        gallery: 'Gallery', text: 'Testo', quote: 'Citazione',
        video: 'Video', fluid: 'Parallasse', carousel: 'Carousel'
    };
    return names[type] || type;
}

function getBlockIconSimple(type) {
    const icons = {
        cover: '🎨', hero: '🌟', article: '📰', gallery: '🖼️',
        text: '📝', quote: '💬', video: '🎥', fluid: '🌊', carousel: '🎠'
    };
    return icons[type] || '📦';
}

function getBlockIcon(type) {
    const iconConfigs = {
        cover: {
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="white" stroke-width="2"/><path d="M4 8H20" stroke="white" stroke-width="2"/><path d="M8 4V20" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="2" fill="white"/></svg>'
        },
        fluid: {
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12C3 12 5.5 7 12 7C18.5 7 21 12 21 12C21 12 18.5 17 12 17C5.5 17 3 12 3 12Z" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="white" stroke-width="1.5"/></svg>'
        },
        gallery: {
            gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="14" rx="2" stroke="white" stroke-width="1.5"/><path d="M2 14L7 9L12 14L17 9L22 14" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="10.5" r="1.5" fill="white"/></svg>'
        },
        carousel: {
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="4" width="14" height="16" rx="2" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="white"/></svg>'
        },
        hero: {
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="1.5"/></svg>'
        },
        article: {
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" stroke-width="1.5"/></svg>'
        },
        text: {
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20M10 3V21M14 3V21" stroke="white" stroke-width="1.5"/></svg>'
        },
        quote: {
            gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 8H5V13H8L10 16V8Z" stroke="white" stroke-width="1.5"/></svg>'
        },
        video: {
            gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.75 15.02L15.5 11.75L9.75 8.48V15.02Z" stroke="white" stroke-width="1.5"/></svg>'
        }
    };
    
    const config = iconConfigs[type] || iconConfigs.article;
    return `<div style="background: ${config.gradient}; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">${config.svg}</div>`;
}

function getBlockMeta(block) {
    if (block.type === 'cover') return `${(block.images || []).length} immagini`;
    if (block.subtitle) return block.subtitle;
    if (block.content) return block.content.substring(0, 50) + '...';
    return 'Nessuna descrizione';
}

function getBlockPreview(block) {
    if (block.content) {
        return `<p style="color: #64748b; font-size: 14px; line-height: 1.6;">${block.content.substring(0, 200)}${block.content.length > 200 ? '...' : ''}</p>`;
    }
    return '';
}
