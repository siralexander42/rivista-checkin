// pages.js - Gestione Editor Pagine Figlie
let currentPage = null;
let currentBlocks = [];
let currentBlock = null;
let parentMagazineBlocks = [];

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('id');
    
    if (!pageId) {
        showNotification('ID pagina mancante', 'error');
        setTimeout(() => window.location.href = 'magazines.html', 1500);
        return;
    }
    
    await loadPage(pageId);
});

async function loadPage(pageId) {
    try {
        console.log('📄 Caricamento pagina figlia:', pageId);
        const response = await apiRequest(`/admin/child-pages/${pageId}`);
        currentPage = response.data;
        
        console.log('✅ Pagina caricata:', currentPage);
        
        // Salva dati globalmente
        window.currentPageData = currentPage;
        
        updatePageHeader();
        currentBlocks = currentPage.blocks || [];
        
        // Carica blocchi della rivista madre
        if (currentPage.parentMagazineId) {
            await loadParentMagazineBlocks(currentPage.parentMagazineId);
        }
        
        displayBlocks();
    } catch (error) {
        console.error('❌ Errore caricamento pagina:', error);
        showNotification('Errore nel caricamento della pagina', 'error');
        setTimeout(() => window.location.href = 'magazines.html', 2000);
    }
}

async function loadParentMagazineBlocks(magazineId) {
    try {
        console.log('📚 Caricamento blocchi rivista madre:', magazineId);
        const response = await apiRequest(`/admin/magazines/${magazineId}`);
        const magazine = response.data;
        parentMagazineBlocks = magazine.blocks || [];
        console.log('✅ Blocchi rivista madre caricati:', parentMagazineBlocks.length);
    } catch (error) {
        console.error('❌ Errore caricamento blocchi rivista:', error);
        parentMagazineBlocks = [];
    }
}

function updatePageHeader() {
    document.getElementById('pageName').textContent = currentPage.title || currentPage.name;
    document.getElementById('pageInfo').textContent = currentPage.slug;
    
    if (currentPage.parentMagazineId) {
        loadMagazineName(currentPage.parentMagazineId);
    }
}

async function loadMagazineName(magazineId) {
    try {
        const response = await apiRequest(`/admin/magazines/${magazineId}`);
        const magazine = response.data;
        document.getElementById('magazineInfo').textContent = `${magazine.name} - ${magazine.edition}`;
    } catch (error) {
        console.error('Errore caricamento nome rivista:', error);
    }
}

function goBackToMagazine() {
    if (currentPage && currentPage.parentMagazineId) {
        window.location.href = `blocks.html?magazine=${currentPage.parentMagazineId}`;
    } else {
        window.location.href = 'magazines.html';
    }
}

function openEditPageModal() {
    showNotification('Impostazioni pagina in fase di implementazione', 'info');
}

async function previewPage() {
    if (!currentPage) return;
    
    showNotification('Generazione anteprima...', 'info');
    
    try {
        const response = await apiRequest(`/admin/child-pages/${currentPage._id}/generate-html`, {
            method: 'POST'
        });
        
        if (response.success && response.previewUrl) {
            window.open(response.previewUrl, '_blank');
            showNotification('Anteprima generata!', 'success');
        } else {
            showNotification('Errore nella generazione dell\'anteprima', 'error');
        }
    } catch (error) {
        console.error('Errore anteprima:', error);
        showNotification('Errore: ' + error.message, 'error');
    }
}

async function publishPage() {
    if (!currentPage) return;
    if (!confirm('Vuoi pubblicare questa pagina? Sarà visibile pubblicamente.')) return;
    
    try {
        await apiRequest(`/admin/child-pages/${currentPage._id}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'published',
                publishDate: new Date().toISOString()
            })
        });
        showNotification('Pagina pubblicata con successo!', 'success');
        await loadPage(currentPage._id);
    } catch (error) {
        showNotification('Errore: ' + error.message, 'error');
    }
}

function displayBlocks() {
    const container = document.getElementById('blocksList');
    const emptyState = document.getElementById('emptyState');
    
    if (!currentBlocks || currentBlocks.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'flex';
    emptyState.style.display = 'none';
    
    container.innerHTML = currentBlocks.map((block, index) => {
        const preview = getBlockPreview(block);
        const hasContent = preview && preview.trim().length > 0;
        
        return `
        <div class="block-card-modern" draggable="true" data-block-id="${block._id}" data-position="${index}">
            <div class="block-card-header" onclick="toggleBlockCard(this)">
                <div class="block-card-left">
                    <svg class="drag-handle-modern" title="Trascina per riordinare" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50">
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
                        <div class="block-card-meta">
                            ${getBlockMeta(block)}
                        </div>
                    </div>
                </div>
                
                <div class="block-card-right">
                    <button class="btn-icon-modern btn-icon-delete" onclick="event.stopPropagation(); deleteBlock('${block._id}')" title="Elimina">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    ${hasContent ? `
                    <button class="btn-icon-modern btn-icon-expand" title="Espandi/Comprimi">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    ` : ''}
                </div>
            </div>
            
            ${hasContent ? `
            <div class="block-card-body">
                <div class="block-card-content">
                    ${preview}
                </div>
            </div>
            ` : ''}
        </div>
        `;
    }).join('');
    
    initDragAndDrop();
}

// Mostra modal selezione blocchi dalla rivista madre
function showBlockTypesModal() {
    if (!parentMagazineBlocks || parentMagazineBlocks.length === 0) {
        showNotification('Nessun blocco disponibile nella rivista madre', 'warning');
        return;
    }
    
    // Crea modal dinamico
    const modalHTML = `
        <div id="selectBlockModal" class="modal-modern active" onclick="if(event.target === this) closeSelectBlockModal()">
            <div class="modal-content-modern" style="max-width: 900px;" onclick="event.stopPropagation()">
                <div class="modal-header-modern">
                    <h2>Seleziona Blocco dalla Rivista Madre</h2>
                    <button onclick="closeSelectBlockModal()" class="modal-close-btn-modern">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body-modern" style="max-height: 70vh; overflow-y: auto;">
                    <p style="margin-bottom: 20px; color: #64748b;">Seleziona un blocco dalla rivista madre da aggiungere a questa pagina:</p>
                    
                    <div style="display: grid; gap: 12px;">
                        ${parentMagazineBlocks.map((block, index) => `
                            <div class="block-select-card" onclick="addBlockFromParent('${block._id}')" style="padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px;">
                                <div class="block-icon-badge" style="flex-shrink: 0;">
                                    ${getBlockIcon(block.type)}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">
                                        ${block.title || getBlockTypeName(block.type)}
                                    </div>
                                    <div style="font-size: 13px; color: #64748b;">
                                        ${getBlockTypeName(block.type)} • Posizione ${index + 1}
                                    </div>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .block-select-card:hover {
                border-color: #6366f1 !important;
                background: #f8f9ff !important;
                transform: translateX(4px);
            }
        </style>
    `;
    
    // Aggiungi modal al body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    document.body.style.overflow = 'hidden';
}

function closeSelectBlockModal() {
    const modal = document.getElementById('selectBlockModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.parentElement.remove(), 300);
    }
    document.body.style.overflow = '';
}

async function addBlockFromParent(parentBlockId) {
    const parentBlock = parentMagazineBlocks.find(b => b._id === parentBlockId);
    if (!parentBlock) {
        showNotification('Blocco non trovato', 'error');
        return;
    }
    
    closeSelectBlockModal();
    
    try {
        showNotification('Aggiunta blocco in corso...', 'info');
        
        // Crea copia del blocco senza _id
        const newBlock = {
            ...parentBlock,
            position: currentBlocks.length,
            visible: true
        };
        delete newBlock._id;
        
        // Aggiungi blocco alla pagina figlia
        const response = await apiRequest(`/admin/child-pages/${currentPage._id}/blocks`, {
            method: 'POST',
            body: JSON.stringify(newBlock)
        });
        
        if (response.success) {
            showNotification('Blocco aggiunto con successo!', 'success');
            await loadPage(currentPage._id);
        } else {
            showNotification('Errore nell\'aggiunta del blocco', 'error');
        }
    } catch (error) {
        console.error('Errore aggiunta blocco:', error);
        showNotification('Errore: ' + error.message, 'error');
    }
}

async function deleteBlock(blockId) {
    if (!confirm('Sei sicuro di voler eliminare questo blocco?')) return;
    
    try {
        await apiRequest(`/admin/child-pages/${currentPage._id}/blocks/${blockId}`, {
            method: 'DELETE'
        });
        
        showNotification('Blocco eliminato', 'success');
        await loadPage(currentPage._id);
    } catch (error) {
        showNotification('Errore: ' + error.message, 'error');
    }
}

function toggleBlockCard(header) {
    const card = header.closest('.block-card-modern');
    const body = card.querySelector('.block-card-body');
    if (!body) return;
    
    card.classList.toggle('expanded');
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
        await apiRequest(`/admin/child-pages/${currentPage._id}/blocks/reorder`, {
            method: 'PUT',
            body: JSON.stringify({ blocks: newOrder })
        });
        
        showNotification('Ordine salvato', 'success');
        await loadPage(currentPage._id);
    } catch (error) {
        showNotification('Errore: ' + error.message, 'error');
    }
}

// Funzioni di supporto (importate da blocks.js)
function getBlockTypeName(type) {
    const names = {
        cover: 'Copertina',
        hero: 'Hero',
        article: 'Articolo',
        gallery: 'Gallery',
        text: 'Testo',
        quote: 'Citazione',
        video: 'Video',
        fluid: 'Parallasse',
        carousel: 'Carousel'
    };
    return names[type] || type;
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
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="4" width="14" height="16" rx="2" stroke="white" stroke-width="1.5"/><path d="M2 8V16C2 16.5523 2.44772 17 3 17H4" stroke="white" stroke-width="1.5" stroke-linecap="round"/><path d="M22 8V16C22 16.5523 21.5523 17 21 17H20" stroke="white" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="white"/></svg>'
        },
        hero: {
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        },
        article: {
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        },
        text: {
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20M10 3V21M14 3V21" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        },
        quote: {
            gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 8H5V13H8L10 16V8Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 8H14V13H17L19 16V8Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        },
        video: {
            gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
            svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.54 6.42C22.4212 5.94541 22.1793 5.51057 21.8387 5.15941C21.498 4.80824 21.0707 4.55318 20.6 4.42C18.88 4 12 4 12 4C12 4 5.12 4 3.4 4.46C2.92933 4.59318 2.50206 4.84824 2.16143 5.19941C1.82081 5.55057 1.57882 5.98541 1.46 6.46C1.14521 8.20556 0.991228 9.97631 1 11.75C0.988771 13.537 1.14277 15.3213 1.46 17.08C1.59098 17.5398 1.83827 17.9581 2.17811 18.2945C2.51794 18.6308 2.93878 18.8738 3.4 19C5.12 19.46 12 19.46 12 19.46C12 19.46 18.88 19.46 20.6 19C21.0707 18.8668 21.498 18.6118 21.8387 18.2606C22.1793 17.9094 22.4212 17.4746 22.54 17C22.8524 15.2676 23.0063 13.5103 23 11.75C23.0112 9.96295 22.8572 8.1787 22.54 6.42Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.75 15.02L15.5 11.75L9.75 8.48V15.02Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
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
    // Anteprima semplificata
    if (block.content) {
        return `<p style="color: #64748b; font-size: 14px; line-height: 1.6;">${block.content.substring(0, 200)}${block.content.length > 200 ? '...' : ''}</p>`;
    }
    return '';
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #1e293b;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        border-left: 4px solid ${colors[type]};
        z-index: 100000;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
