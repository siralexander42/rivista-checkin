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
    loadMagazine();
    
    // Form submission
    document.getElementById('blockForm').addEventListener('submit', handleBlockFormSubmit);
});

// Carica rivista e blocchi
async function loadMagazine() {
    try {
        const response = await apiRequest(`/admin/magazines/${magazineId}`);
        magazine = response.data;
        
        // Aggiorna header
        document.getElementById('magazineName').textContent = magazine.name;
        document.getElementById('magazineEdition').textContent = `Edizione ${magazine.editionNumber} • ${magazine.edition}`;
        
        // Imposta toggle loading screen
        const loadingToggle = document.getElementById('showLoadingScreen');
        if (loadingToggle) {
            loadingToggle.checked = magazine.showLoadingScreen || false;
            
            // Aggiungi listener per salvare automaticamente
            loadingToggle.addEventListener('change', async (e) => {
                try {
                    await apiRequest(`/admin/magazines/${magazineId}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            showLoadingScreen: e.target.checked
                        })
                    });
                    
                    // Feedback visivo
                    const container = loadingToggle.closest('div');
                    const originalBg = container.style.background;
                    container.style.background = 'rgba(34, 197, 94, 0.15)';
                    container.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                    setTimeout(() => {
                        container.style.background = originalBg;
                        container.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                    }, 1000);
                } catch (error) {
                    console.error('Errore salvataggio loading screen:', error);
                    alert('Errore nel salvataggio delle impostazioni');
                    e.target.checked = !e.target.checked;
                }
            });
        }
        
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
    
    blocksList.innerHTML = blocks.map((block, index) => {
        const preview = getBlockPreview(block);
        const hasContent = preview && preview.trim().length > 0;
        
        return `
        <div class="block-card-modern" draggable="true" data-block-id="${block._id}" data-position="${index}">
            <!-- Header Card - Sempre Visibile -->
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
                            ${block.data?.title ? `<span class="block-card-title-inline">${block.data.title}</span>` : ''}
                        </div>
                        <div class="block-card-meta">
                            ${getBlockMeta(block)}
                        </div>
                    </div>
                </div>
                
                <div class="block-card-right">
                    <button class="btn-icon-modern btn-icon-edit" onclick="event.stopPropagation(); editBlock('${block._id}')" title="Modifica">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.43741 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn-icon-modern ${block.visible ? 'btn-icon-hide' : 'btn-icon-show'}" onclick="event.stopPropagation(); toggleBlockVisibility('${block._id}')" title="${block.visible ? 'Nascondi' : 'Mostra'}">
                        ${block.visible ? 
                            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06L17.94 17.94Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.59 10.59C10.2087 10.9712 9.9092 11.4251 9.70848 11.9241C9.50777 12.4232 9.40997 12.9575 9.42054 13.4952C9.43111 14.0329 9.54989 14.5631 9.77005 15.0535C9.99022 15.5439 10.3071 15.9845 10.7019 16.3481C11.0967 16.7118 11.5613 16.9915 12.0679 17.1695C12.5745 17.3474 13.1122 17.4198 13.6495 17.3826C14.1869 17.3454 14.7118 17.1993 15.1914 16.9532C15.671 16.7071 16.0958 16.3663 16.4401 15.9501" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' :
                            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                        }
                    </button>
                    <button class="btn-icon-modern btn-icon-delete" onclick="event.stopPropagation(); deleteBlock('${block._id}')" title="Elimina">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn-icon-modern btn-icon-expand" title="${hasContent ? 'Espandi/Comprimi' : 'Nessun contenuto'}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Body Card - Collassabile -->
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
    
    // Aggiungi drag & drop
    initDragAndDrop();
}

// Icone per tipi di blocco (Icons8 SVG)
function getBlockIcon(type) {
    const icons = {
        cover: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 50 50"><path d="M 7 2 L 7 48 L 43 48 L 43 14.59375 L 42.71875 14.28125 L 30.71875 2.28125 L 30.40625 2 Z M 9 4 L 29 4 L 29 16 L 41 16 L 41 46 L 9 46 Z M 31 5.4375 L 39.5625 14 L 31 14 Z M 15 22 L 15 24 L 35 24 L 35 22 Z M 15 28 L 15 30 L 31 30 L 31 28 Z M 15 34 L 15 36 L 35 36 L 35 34 Z M 15 40 L 15 42 L 29 42 L 29 40 Z"/></svg>',
        hero: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 50 50"><path d="M 5 8 C 3.355469 8 2 9.355469 2 11 L 2 39 C 2 40.644531 3.355469 42 5 42 L 45 42 C 46.644531 42 48 40.644531 48 39 L 48 11 C 48 9.355469 46.644531 8 45 8 Z M 5 10 L 45 10 C 45.566406 10 46 10.433594 46 11 L 46 39 C 46 39.566406 45.566406 40 45 40 L 5 40 C 4.433594 40 4 39.566406 4 39 L 4 11 C 4 10.433594 4.433594 10 5 10 Z M 11.5 15 C 9.574219 15 8 16.574219 8 18.5 C 8 20.425781 9.574219 22 11.5 22 C 13.425781 22 15 20.425781 15 18.5 C 15 16.574219 13.425781 15 11.5 15 Z M 35.699219 19.886719 L 25.199219 30.386719 L 20.699219 25.886719 L 6.199219 40.386719 L 7.613281 41.800781 L 20.699219 28.714844 L 25.199219 33.214844 L 37.113281 21.300781 Z"/></svg>',
        article: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 30 30"><path d="M 6 3 C 4.3550302 3 3 4.3550302 3 6 L 3 24 C 3 25.64497 4.3550302 27 6 27 L 24 27 C 25.64497 27 27 25.64497 27 24 L 27 9.4140625 L 26.707031 9.1210938 L 18.878906 1.2929688 L 18.585938 1 L 6 1 C 4.3550302 1 3 2.3550302 3 4 L 3 6 C 3 4.3550302 4.3550302 3 6 3 L 17 3 L 17 10 L 24 10 L 24 24 C 24 24.56503 23.56503 25 23 25 L 7 25 C 6.4349698 25 6 24.56503 6 24 L 6 6 C 6 5.4349698 6.4349698 5 7 5 L 17 5 L 17 3 L 6 3 z M 19 4.4140625 L 22.585938 8 L 19 8 L 19 4.4140625 z M 9 13 L 9 15 L 21 15 L 21 13 L 9 13 z M 9 17 L 9 19 L 21 19 L 21 17 L 9 17 z M 9 21 L 9 23 L 18 23 L 18 21 L 9 21 z"/></svg>',
        gallery: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 50 50"><path d="M 6 6 C 4.34375 6 3 7.34375 3 9 L 3 41 C 3 42.65625 4.34375 44 6 44 L 44 44 C 45.65625 44 47 42.65625 47 41 L 47 9 C 47 7.34375 45.65625 6 44 6 Z M 6 8 L 44 8 C 44.554688 8 45 8.445313 45 9 L 45 32.8125 L 37.40625 25.21875 C 36.238281 24.050781 34.359375 24.050781 33.1875 25.21875 L 19.71875 38.6875 L 14.59375 33.5625 C 13.425781 32.394531 11.546875 32.394531 10.375 33.5625 L 5 38.9375 L 5 9 C 5 8.445313 5.445313 8 6 8 Z M 14.5 12 C 11.476563 12 9 14.476563 9 17.5 C 9 20.523438 11.476563 23 14.5 23 C 17.523438 23 20 20.523438 20 17.5 C 20 14.476563 17.523438 12 14.5 12 Z M 14.5 14 C 16.445313 14 18 15.554688 18 17.5 C 18 19.445313 16.445313 21 14.5 21 C 12.554688 21 11 19.445313 11 17.5 C 11 15.554688 12.554688 14 14.5 14 Z M 35.3125 27.03125 L 45 36.71875 L 45 41 C 45 41.554688 44.554688 42 44 42 L 6 42 C 5.445313 42 5 41.554688 5 41 L 5 41.75 L 12.1875 34.5625 C 12.773438 33.976563 13.800781 33.976563 14.375 34.5625 L 19.5 39.6875 L 19.5 39.71875 L 20.90625 41.09375 L 21.875 40.125 L 35.3125 27.03125 Z"/></svg>',
        text: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 50 50"><path d="M 8 2 L 8 6 L 21 6 L 21 48 L 29 48 L 29 6 L 42 6 L 42 2 Z M 8 2"/></svg>',
        quote: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 30 30"><path d="M 9 6 C 5.6862915 6 3 8.6862915 3 12 L 3 13 C 3 16.313708 5.6862915 19 9 19 C 9.9885184 19 10.91978 18.754017 11.730469 18.322266 C 11.168926 20.399233 9.5467853 22.294823 6.7167969 23.285156 L 6.2167969 23.445312 L 7.2832031 26.554688 L 7.7832031 26.394531 C 13.556215 24.492177 16 20.171887 16 15 L 16 12 C 16 8.6862915 13.313708 6 10 6 L 9 6 z M 21 6 C 17.686292 6 15 8.6862915 15 12 L 15 13 C 15 16.313708 17.686292 19 21 19 C 21.988518 19 22.91978 18.754017 23.730469 18.322266 C 23.168926 20.399233 21.546785 22.294823 18.716797 23.285156 L 18.216797 23.445312 L 19.283203 26.554688 L 19.783203 26.394531 C 25.556215 24.492177 28 20.171887 28 15 L 28 12 C 28 8.6862915 25.313708 6 22 6 L 21 6 z"/></svg>',
        video: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 50 50"><path d="M 6 6 C 4.34375 6 3 7.34375 3 9 L 3 41 C 3 42.65625 4.34375 44 6 44 L 34 44 C 35.65625 44 37 42.65625 37 41 L 37 31.90625 L 46.40625 38.1875 C 46.589844 38.316406 46.792969 38.375 47 38.375 C 47.199219 38.375 47.398438 38.316406 47.59375 38.1875 C 47.855469 38 48 37.714844 48 37.40625 L 48 12.59375 C 48 12.285156 47.855469 12 47.59375 11.8125 C 47.328125 11.625 46.976563 11.625 46.71875 11.8125 L 37 18.09375 L 37 9 C 37 7.34375 35.65625 6 34 6 Z M 6 8 L 34 8 C 34.554688 8 35 8.445313 35 9 L 35 41 C 35 41.554688 34.554688 42 34 42 L 6 42 C 5.445313 42 5 41.554688 5 41 L 5 9 C 5 8.445313 5.445313 8 6 8 Z M 37 20.90625 L 46 14.40625 L 46 35.59375 L 37 29.09375 Z"/></svg>',
        custom: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 50 50"><path d="M 22.205078 2 A 1.0001 1.0001 0 0 0 21.21875 2.8378906 L 20.246094 8.7929688 C 19.076509 9.1331971 17.961243 9.5922728 16.910156 10.164062 L 11.996094 6.6542969 A 1.0001 1.0001 0 0 0 10.708984 6.7597656 L 6.8183594 10.646484 A 1.0001 1.0001 0 0 0 6.7070312 11.927734 L 10.164062 16.873047 C 9.583454 17.930271 9.1142383 19.051824 8.765625 20.232422 L 2.8359375 21.21875 A 1.0001 1.0001 0 0 0 2.0019531 22.205078 L 2.0019531 27.705078 A 1.0001 1.0001 0 0 0 2.8261719 28.691406 L 8.7597656 29.742188 C 9.1064607 30.920739 9.5727226 32.043065 10.154297 33.101562 L 6.6542969 37.998047 A 1.0001 1.0001 0 0 0 6.7597656 39.285156 L 10.648438 43.175781 A 1.0001 1.0001 0 0 0 11.927734 43.289062 L 16.882812 39.804688 C 17.936999 40.39548 19.054994 40.857928 20.228516 41.21875 L 21.21875 47.164062 A 1.0001 1.0001 0 0 0 22.205078 48 L 27.705078 48 A 1.0001 1.0001 0 0 0 28.691406 47.173828 L 29.751953 41.1875 C 30.920633 40.838997 32.033372 40.369697 33.082031 39.791016 L 38.070312 43.291016 A 1.0001 1.0001 0 0 0 39.351562 43.179688 L 43.240234 39.287109 A 1.0001 1.0001 0 0 0 43.34375 37.996094 L 39.787109 33.058594 C 40.355783 32.014958 40.813915 30.908875 41.154297 29.748047 L 47.171875 28.693359 A 1.0001 1.0001 0 0 0 47.998047 27.707031 L 47.998047 22.207031 A 1.0001 1.0001 0 0 0 47.160156 21.220703 L 41.152344 20.238281 C 40.80968 19.078827 40.350281 17.974723 39.78125 16.931641 L 43.289062 11.933594 A 1.0001 1.0001 0 0 0 43.177734 10.652344 L 39.287109 6.7636719 A 1.0001 1.0001 0 0 0 37.996094 6.6601562 L 33.072266 10.201172 C 32.023186 9.6248101 30.909713 9.1579916 29.738281 8.8125 L 28.691406 2.828125 A 1.0001 1.0001 0 0 0 27.705078 2 L 22.205078 2 z M 23.056641 4 L 26.865234 4 L 27.861328 9.6855469 A 1.0001 1.0001 0 0 0 28.603516 10.484375 C 30.066026 10.848832 31.439607 11.426549 32.693359 12.185547 A 1.0001 1.0001 0 0 0 33.794922 12.142578 L 38.474609 8.7792969 L 41.167969 11.472656 L 37.835938 16.220703 A 1.0001 1.0001 0 0 0 37.796875 17.310547 C 38.548366 18.561471 39.118333 19.926379 39.482422 21.380859 A 1.0001 1.0001 0 0 0 40.291016 22.125 L 45.998047 23.058594 L 45.998047 26.867188 L 40.279297 27.871094 A 1.0001 1.0001 0 0 0 39.482422 28.617188 C 39.122545 30.069817 38.552234 31.434687 37.800781 32.685547 A 1.0001 1.0001 0 0 0 37.845703 33.785156 L 41.224609 38.474609 L 38.53125 41.169922 L 33.791016 37.84375 A 1.0001 1.0001 0 0 0 32.697266 37.808594 C 31.44975 38.567585 30.074755 39.148028 28.617188 39.517578 A 1.0001 1.0001 0 0 0 27.876953 40.3125 L 26.867188 46 L 23.052734 46 L 22.111328 40.337891 A 1.0001 1.0001 0 0 0 21.365234 39.53125 C 19.90185 39.170557 18.522094 38.59371 17.259766 37.835938 A 1.0001 1.0001 0 0 0 16.171875 37.875 L 11.46875 41.169922 L 8.7734375 38.470703 L 12.097656 33.824219 A 1.0001 1.0001 0 0 0 12.138672 32.724609 C 11.372652 31.458855 10.793319 30.079213 10.433594 28.609375 A 1.0001 1.0001 0 0 0 9.6328125 27.867188 L 4.0019531 26.867188 L 4.0019531 23.052734 L 9.6289062 22.117188 A 1.0001 1.0001 0 0 0 10.435547 21.373047 C 10.804273 19.898143 11.383325 18.518729 12.146484 17.255859 A 1.0001 1.0001 0 0 0 12.111328 16.164062 L 8.8261719 11.46875 L 11.523438 8.7734375 L 16.185547 12.105469 A 1.0001 1.0001 0 0 0 17.28125 12.148438 C 18.536908 11.394293 19.919867 10.822081 21.384766 10.462891 A 1.0001 1.0001 0 0 0 22.132812 9.6523438 L 23.056641 4 z M 25 17 C 20.593567 17 17 20.593567 17 25 C 17 29.406433 20.593567 33 25 33 C 29.406433 33 33 29.406433 33 25 C 33 20.593567 29.406433 17 25 17 z M 25 19 C 28.325553 19 31 21.674447 31 25 C 31 28.325553 28.325553 31 25 31 C 21.674447 31 19 28.325553 19 25 C 19 21.674447 21.674447 19 25 19 z"/></svg>'
    };
    return icons[type] || icons.custom;
}

// Nomi per tipi di blocco
function getBlockTypeName(type) {
    const names = {
        cover: 'Copertina',
        hero: 'Hero Section',
        article: 'Articolo',
        gallery: 'Gallery Story',
        text: 'Testo',
        quote: 'Citazione',
        video: 'Video',
        fluid: 'Fluid Block',
        carousel: 'Carousel',
        custom: 'Personalizzato'
    };
    return names[type] || 'Sconosciuto';
}

// Meta info per ogni tipo di blocco
function getBlockMeta(block) {
    const parts = [];
    
    // Helper per icone SVG inline
    const icons = {
        sommario: '<svg style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:2px" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="2" stroke-width="1.5"/><line x1="7" y1="9" x2="17" y2="9" stroke-width="1.5"/><line x1="7" y1="13" x2="17" y2="13" stroke-width="1.5"/><line x1="7" y1="17" x2="12" y2="17" stroke-width="1.5"/></svg>',
        image: '<svg style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:2px" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="1.5"/><path d="M21 15L16 10L5 21" stroke-width="1.5"/></svg>',
        box: '<svg style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:2px" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/><path d="M3 9h18M9 3v18" stroke-width="1.5"/></svg>',
        card: '<svg style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:2px" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="6" width="20" height="12" rx="2" stroke-width="1.5"/><path d="M2 10h20" stroke-width="1.5"/></svg>'
    };
    
    switch(block.type) {
        case 'cover':
            if (block.data?.subtitle) parts.push(`${block.data.subtitle}`);
            if (block.data?.sommario?.length) parts.push(`${icons.sommario}${block.data.sommario.length} voci`);
            if (block.data?.backgrounds?.length) parts.push(`${icons.image}${block.data.backgrounds.length} sfondi`);
            break;
        case 'fluid':
            if (block.data?.fluidBlocks?.length) parts.push(`${icons.box}${block.data.fluidBlocks.length} sezioni`);
            break;
        case 'gallery':
            if (block.data?.subtitle) parts.push(`${block.data.subtitle}`);
            if (block.data?.images?.length) parts.push(`${icons.image}${block.data.images.length} immagini`);
            break;
        case 'carousel':
            if (block.data?.subtitle) parts.push(`${block.data.subtitle}`);
            if (block.data?.cards?.length) parts.push(`${icons.card}${block.data.cards.length} card`);
            break;
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Nessuna info disponibile';
}

// Toggle espansione card
function toggleBlockCard(header) {
    const card = header.closest('.block-card-modern');
    const body = card.querySelector('.block-card-body');
    const expandBtn = card.querySelector('.btn-icon-expand');
    
    if (!body) return; // Nessun contenuto da mostrare
    
    card.classList.toggle('expanded');
    
    // Anima l'icona
    if (card.classList.contains('expanded')) {
        expandBtn.style.transform = 'rotate(180deg)';
    } else {
        expandBtn.style.transform = 'rotate(0deg)';
    }
}

// Preview contenuto blocco
function getBlockPreview(block) {
    switch (block.type) {
        case 'cover':
            const sommarioCount = block.settings?.sommario?.length || 0;
            return `
                <h3>📰 ${block.title || 'Copertina'}</h3>
                ${block.subtitle ? `<p><strong>${block.subtitle}</strong></p>` : ''}
                ${block.images?.length ? `<p>🖼️ ${block.images.length} immagini di sfondo</p>` : ''}
                ${sommarioCount > 0 ? `<p>📋 ${sommarioCount} voci nel sommario</p>` : ''}
            `;
        
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
            const statsCount = block.stats?.length || 0;
            const featuresCount = block.features?.length || 0;
            return `
                <h3>🖼️ ${block.title || 'Gallery Story'}</h3>
                ${block.tag ? `<p><span style="background: rgba(34, 197, 94, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${block.tag}</span></p>` : ''}
                ${block.intro ? `<p style="color: var(--text-light); margin-top: 8px;">${block.intro.substring(0, 100)}...</p>` : ''}
                ${statsCount > 0 ? `<p style="margin-top: 8px;">📊 ${statsCount} statistiche</p>` : ''}
                ${block.showQuote && block.quote?.text ? `<p style="margin-top: 8px;">💬 Citazione presente</p>` : ''}
                ${featuresCount > 0 ? `<p style="margin-top: 8px;">✓ ${featuresCount} features</p>` : ''}
                <p>🖼️ ${block.images?.length || 0} immagini</p>
                ${block.darkMode ? '<p style="margin-top: 8px;">🌙 Modalità scura</p>' : ''}
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
        
        case 'fluid':
            const fluidBlocksCount = block.fluidBlocks?.length || 0;
            return `
                <h3>🌊 ${block.title || 'Parallasse Block'}</h3>
                ${block.tag ? `<p><span style="background: rgba(211, 228, 252, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${block.tag}</span></p>` : ''}
                ${block.intro ? `<p style="color: var(--text-light); margin-top: 8px;">${block.intro.substring(0, 100)}...</p>` : ''}
                ${fluidBlocksCount > 0 ? `<p style="margin-top: 12px;">📄 ${fluidBlocksCount} blocchi di testo con immagini</p>` : ''}
                ${block.summaryTitle ? `<p style="margin-top: 8px;">📋 Sommario: ${block.summaryTitle}</p>` : ''}
                ${block.ctaText ? `<p style="margin-top: 8px;">🔗 CTA: ${block.ctaText}</p>` : ''}
            `;
        
        case 'carousel':
            const cardsCount = block.cards?.length || 0;
            return `
                <h3>🎠 ${block.title || 'Carousel Storie'}</h3>
                ${block.subtitle ? `<p style="color: var(--text-light); margin-top: 8px;">${block.subtitle}</p>` : ''}
                <p style="margin-top: 12px;">🗂️ ${cardsCount} ${cardsCount === 1 ? 'card' : 'cards'}</p>
                ${cardsCount > 0 ? `<p style="margin-top: 8px; font-size: 12px; color: var(--text-light);">Clicca per modificare le card</p>` : ''}
            `;
        
        default:
            return '<p>Blocco personalizzato</p>';
    }
}

// Mostra modal tipi blocco con animazione moderna
function showBlockTypesModal() {
    const modal = document.getElementById('blockTypesModal');
    modal.classList.add('active');
    
    // Blocca scroll della pagina sottostante
    document.body.style.overflow = 'hidden';
    
    // Anima le card in sequenza
    setTimeout(() => {
        const cards = modal.querySelectorAll('.block-type-modern');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 10);
            }, index * 60);
        });
    }, 50);
}

// Chiudi modal tipi blocco
function closeBlockTypesModal() {
    const modal = document.getElementById('blockTypesModal');
    modal.classList.remove('active');
    
    // Ripristina scroll della pagina
    document.body.style.overflow = '';
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
    
    // Blocca scroll della pagina sottostante
    document.body.style.overflow = 'hidden';
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
    
    // Blocca scroll della pagina sottostante
    document.body.style.overflow = 'hidden';
}

// Genera form dinamico basato sul tipo di blocco
function generateBlockForm(type, data = {}) {
    const formContent = document.getElementById('blockFormContent');
    
    const forms = {
        cover: `
            <div style="display: grid; grid-template-columns: 1fr 500px; gap: 24px; align-items: start;">
                <div class="form-section">
                <h4 style="margin-bottom: 16px;">📸 Copertina Rivista</h4>
                
                <div class="form-group">
                    <label for="title">Titolo Principale *</label>
                    <input type="text" id="title" required value="${data.title || ''}" placeholder="Alta Badia" oninput="updateBlockPreview()">
                </div>
                
                <div class="form-group">
                    <label for="subtitle">Sottotitolo</label>
                    <input type="text" id="subtitle" value="${data.subtitle || ''}" placeholder="Tre settimane di eventi per vivere l'autunno sulle Dolomiti" oninput="updateBlockPreview()">
                </div>
                
                <div class="form-group">
                    <label for="content">Descrizione</label>
                    <textarea id="content" rows="4" placeholder="Testo descrittivo della copertina..." oninput="updateBlockPreview()">${data.content || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="images">Immagini di sfondo (una per riga) *</label>
                    <textarea id="images" rows="6" required placeholder="https://esempio.com/bg1.jpg
https://esempio.com/bg2.jpg
https://esempio.com/bg3.jpg
https://esempio.com/bg4.jpg" oninput="updateBlockPreview()">${(data.images || []).join('\n')}</textarea>
                    <small>⚠️ Inserisci almeno 1 immagine. Le immagini si alterneranno automaticamente</small>
                </div>
                
                <div class="form-group">
                    <label><svg style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 5 8 A 2.0002 2.0002 0 1 0 5 12 L 45 12 A 2.0002 2.0002 0 1 0 45 8 L 5 8 z M 5 23 A 2.0002 2.0002 0 1 0 5 27 L 45 27 A 2.0002 2.0002 0 1 0 45 23 L 5 23 z M 5 38 A 2.0002 2.0002 0 1 0 5 42 L 45 42 A 2.0002 2.0002 0 1 0 45 38 L 5 38 z"/></svg> Sommario "In questo numero"</label>
                    <div id="sommarioItems" style="margin-top: 12px;">
                        ${generateSommarioFields(data.settings?.sommario || [])}
                    </div>
                    <button type="button" onclick="addSommarioItem()" class="btn btn-secondary" style="margin-top: 8px;">
                        <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 25 2 C 24.730469 2 24.476563 2.105469 24.292969 2.292969 L 2.292969 24.292969 C 1.90625 24.679688 1.90625 25.320313 2.292969 25.707031 L 24.292969 47.707031 C 24.683594 48.097656 25.316406 48.097656 25.707031 47.707031 L 47.707031 25.707031 C 48.097656 25.316406 48.097656 24.683594 47.707031 24.292969 L 25.707031 2.292969 C 25.523438 2.105469 25.269531 2 25 2 Z M 25 4.414063 L 45.585938 25 L 25 45.585938 L 4.414063 25 Z M 24 16 L 24 26 L 14 26 L 14 28 L 24 28 L 24 38 L 26 38 L 26 28 L 36 28 L 36 26 L 26 26 L 26 16 Z"/></svg> Aggiungi voce sommario
                    </button>
                    <small>Gli elementi del sommario appariranno nel dropdown in alto</small>
                </div>
            </div>
            <div id="blockPreview" style="position: relative;">
                <!-- Anteprima live verrà inserita qui -->
            </div>
            </div>
        `,
        
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
            <div style="display: grid; grid-template-columns: 1fr 400px; gap: 24px; align-items: start;">
                <div class="form-section">
                <h4 style="margin-bottom: 16px;">🖼️ Gallery Story - Blocco Completo con Stats, Citazioni e Immagini</h4>
                <p style="color: var(--text-light); margin-bottom: 24px; line-height: 1.6;">
                    Blocco ricco che combina testo, statistiche animate, citazioni, features list e galleria immagini scrollabili.
                </p>
                
                <div class="form-group">
                    <label for="tag">Occhiello/Categoria *</label>
                    <input type="text" id="tag" required value="${data.tag || ''}" placeholder="Destinazioni" oninput="updateGalleryPreview()">
                    <small>Es: "Destinazioni", "Enogastronomia", "Ospitalità"</small>
                </div>
                
                <div class="form-group">
                    <label for="title">Titolo Principale *</label>
                    <input type="text" id="title" required value="${data.title || ''}" placeholder="Repubblica Ceca: La magia del Natale" oninput="updateGalleryPreview()">
                    <small>Usa <br> per andare a capo nel titolo</small>
                </div>
                
                <div class="form-group">
                    <label for="intro">Sommario/Lead Text *</label>
                    <textarea id="intro" rows="4" required placeholder="Praga si trasforma in un villaggio incantato quando arriva novembre. I mercatini natalizi illuminano le strade medievali..." oninput="updateGalleryPreview()">${data.intro || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="backgroundImage">🖼️ Immagine di Sfondo Sezione</label>
                    <input type="url" id="backgroundImage" value="${data.backgroundImage || ''}" placeholder="https://images.unsplash.com/photo-..." oninput="updateGalleryPreview()">
                    <small>URL dell'immagine di sfondo per l'intera sezione (opzionale - default: immagine generica)</small>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="showStats" ${data.showStats ? 'checked' : ''} onchange="toggleStatsFields(); updateGalleryPreview()">
                        📊 Mostra Statistiche/Numbers Animate
                    </label>
                </div>
                
                <div id="statsFields" style="display: ${data.showStats ? 'block' : 'none'}; margin-left: 24px; padding: 16px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid var(--primary);">
                    <div class="form-group">
                        <label for="stat1Number">Statistica 1 - Numero</label>
                        <input type="text" id="stat1Number" value="${data.stats?.[0]?.number || ''}" placeholder="150+" oninput="updateGalleryPreview()">
                    </div>
                    <div class="form-group">
                        <label for="stat1Label">Statistica 1 - Etichetta</label>
                        <input type="text" id="stat1Label" value="${data.stats?.[0]?.label || ''}" placeholder="Mercatini" oninput="updateGalleryPreview()">
                    </div>
                    
                    <div class="form-group">
                        <label for="stat2Number">Statistica 2 - Numero</label>
                        <input type="text" id="stat2Number" value="${data.stats?.[1]?.number || ''}" placeholder="30 giorni" oninput="updateGalleryPreview()">
                    </div>
                    <div class="form-group">
                        <label for="stat2Label">Statistica 2 - Etichetta</label>
                        <input type="text" id="stat2Label" value="${data.stats?.[1]?.label || ''}" placeholder="Di festa" oninput="updateGalleryPreview()">
                    </div>
                    
                    <div class="form-group">
                        <label for="stat3Number">Statistica 3 - Numero (opzionale)</label>
                        <input type="text" id="stat3Number" value="${data.stats?.[2]?.number || ''}" placeholder="1094" oninput="updateGalleryPreview()">
                    </div>
                    <div class="form-group">
                        <label for="stat3Label">Statistica 3 - Etichetta</label>
                        <input type="text" id="stat3Label" value="${data.stats?.[2]?.label || ''}" placeholder="Anno di origine" oninput="updateGalleryPreview()">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="showQuote" ${data.showQuote ? 'checked' : ''} onchange="toggleQuoteFields(); updateGalleryPreview()">
                        💬 Mostra Citazione
                    </label>
                </div>
                
                <div id="quoteFields" style="display: ${data.showQuote ? 'block' : 'none'}; margin-left: 24px; padding: 16px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid var(--primary);">
                    <div class="form-group">
                        <label for="quoteText">Testo Citazione</label>
                        <textarea id="quoteText" rows="3" placeholder="La vera cucina napoletana è un atto d'amore..." oninput="updateGalleryPreview()">${data.quote?.text || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="quoteAuthor">Autore Citazione</label>
                        <input type="text" id="quoteAuthor" value="${data.quote?.author || ''}" placeholder="Massimo Cosmo" oninput="updateGalleryPreview()">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="showFeatures" ${data.showFeatures ? 'checked' : ''} onchange="toggleFeaturesFields(); updateGalleryPreview()">
                        ✓ Mostra Elenco Puntato
                    </label>
                </div>
                
                <div id="featuresFields" style="display: ${data.showFeatures ? 'block' : 'none'}; margin-left: 24px; padding: 16px; background: rgba(99, 102, 241, 0.05); border-radius: 8px; border-left: 3px solid var(--primary);">
                    <div class="form-group">
                        <label for="features">Voci Elenco (una per riga)</label>
                        <textarea id="features" rows="5" placeholder="Suite storiche restaurate\nSpa con trattamenti esclusivi\nRistorante gourmet\nGiardini all'italiana" oninput="updateGalleryPreview()">${(data.features || []).join('\n')}</textarea>
                        <small>Ogni riga sarà una voce dell'elenco con checkmark ✓</small>
                    </div>
                </div>
                
                <h4 style="margin: 32px 0 16px 0; padding-top: 24px; border-top: 2px solid rgba(99, 102, 241, 0.2);">📸 Galleria Immagini</h4>
                
                <div id="galleryImagesList">
                    ${generateGalleryImagesFields(data.galleryImages || [])}
                </div>
                
                <button type="button" onclick="addGalleryImage()" class="btn btn-secondary" style="margin-top: 12px;">
                    <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 25 2 C 24.730469 2 24.476563 2.105469 24.292969 2.292969 L 2.292969 24.292969 C 1.90625 24.679688 1.90625 25.320313 2.292969 25.707031 L 24.292969 47.707031 C 24.683594 48.097656 25.316406 48.097656 25.707031 47.707031 L 47.707031 25.707031 C 48.097656 25.316406 48.097656 24.683594 47.707031 24.292969 L 25.707031 2.292969 C 25.523438 2.105469 25.269531 2 25 2 Z M 25 4.414063 L 45.585938 25 L 25 45.585938 L 4.414063 25 Z M 24 16 L 24 26 L 14 26 L 14 28 L 24 28 L 24 38 L 26 38 L 26 28 L 36 28 L 36 26 L 26 26 L 26 16 Z"/></svg>
                    Aggiungi Immagine
                </button>
                <small style="display: block; margin-top: 8px; color: var(--text-light);">Inserisci almeno 3 immagini con didascalie</small>
                
                <h4 style="margin: 32px 0 16px 0; padding-top: 24px; border-top: 2px solid rgba(99, 102, 241, 0.2);">🔗 Call to Action</h4>
                
                <div class="form-group">
                    <label for="ctaText">Testo Bottone *</label>
                    <input type="text" id="ctaText" required value="${data.ctaText || ''}" placeholder="Leggi la storia completa →" oninput="updateGalleryPreview()">
                </div>
                
                <div class="form-group">
                    <label for="ctaLink">Link Bottone</label>
                    <input type="url" id="ctaLink" value="${data.ctaLink || ''}" placeholder="https://" oninput="updateGalleryPreview()">
                </div>
                
                <div class="form-group">
                    <label for="summaryTitle">📋 Titolo per il Sommario *</label>
                    <input type="text" id="summaryTitle" required value="${data.summaryTitle || ''}" placeholder="Repubblica Ceca: la magia del Natale">
                    <small>Questo titolo apparirà nella lista del sommario della rivista</small>
                </div>
            </div>
            <div id="blockPreview" style="position: relative;">
                <!-- Anteprima live verrà inserita qui -->
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
        `,
        
        fluid: `
            <div style="display: grid; grid-template-columns: 1fr 400px; gap: 24px; align-items: start;">
                <div class="form-section">
                <h4 style="margin-bottom: 16px;">🌊 Parallasse Block - Scroll con Immagini Parallasse</h4>
                <p style="color: var(--text-light); margin-bottom: 24px; line-height: 1.6;">
                    Blocco in stile Apple/Wanderlust: testo scrollabile a sinistra con immagini che cambiano automaticamente a destra.
                    Ogni blocco di testo corrisponde a un'immagine specifica.
                </p>
                
                <div class="form-group">
                    <label for="tag">Tag/Categoria *</label>
                    <input type="text" id="tag" required value="${data.tag || ''}" placeholder="Destinazioni" oninput="updateFluidPreview()">
                    <small>Es: "Destinazioni", "Food & Wine", "Culture"</small>
                </div>
                
                <div class="form-group">
                    <label for="title">Titolo Principale *</label>
                    <input type="text" id="title" required value="${data.title || ''}" placeholder="Cremona: La città che suona e cucina" oninput="updateFluidPreview()">
                </div>
                
                <div class="form-group">
                    <label for="intro">Intro/Sottotitolo *</label>
                    <textarea id="intro" rows="3" required placeholder="Breve introduzione al contenuto..." oninput="updateFluidPreview()">${data.intro || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="previewImage">🖼️ Foto di Anteprima Iniziale *</label>
                    <input type="url" id="previewImage" required value="${data.previewImage || ''}" placeholder="https://..." oninput="updateFluidPreview(); initPreviewImageCropper()">
                    <small>Questa sarà la prima immagine visualizzata quando si carica il blocco</small>
                </div>
                
                <div class="form-group">
                    <div id="previewImageCropper"></div>
                </div>
                
                <input type="hidden" id="previewImageCropData" value='${JSON.stringify(data.previewImageCropData || {})}'>
                
                <div class="form-group">
                    <label for="summaryTitle">📋 Titolo per il Sommario *</label>
                    <input type="text" id="summaryTitle" required value="${data.summaryTitle || ''}" placeholder="Cremona: la città dei liutai">
                    <small>Questo titolo apparirà nella lista del sommario della rivista</small>
                </div>
                
                <div class="form-group">
                    <label><svg style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 5 8 A 2.0002 2.0002 0 1 0 5 12 L 45 12 A 2.0002 2.0002 0 1 0 45 8 L 5 8 z M 5 23 A 2.0002 2.0002 0 1 0 5 27 L 45 27 A 2.0002 2.0002 0 1 0 45 23 L 5 23 z M 5 38 A 2.0002 2.0002 0 1 0 5 42 L 45 42 A 2.0002 2.0002 0 1 0 45 38 L 5 38 z"/></svg> Blocchi di Testo + Immagini</label>
                    <small style="display: block; margin-bottom: 16px;">Ogni blocco di testo è associato a un'immagine. Man mano che l'utente scrolla, l'immagine a destra cambia automaticamente.</small>
                    <div id="fluidBlocks" style="margin-top: 12px;">
                        ${generateFluidBlocksFields(data.fluidBlocks || [])}
                    </div>
                    <button type="button" onclick="addFluidBlock()" class="btn btn-secondary" style="margin-top: 12px;">
                        <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 25 2 C 24.730469 2 24.476563 2.105469 24.292969 2.292969 L 2.292969 24.292969 C 1.90625 24.679688 1.90625 25.320313 2.292969 25.707031 L 24.292969 47.707031 C 24.683594 48.097656 25.316406 48.097656 25.707031 47.707031 L 47.707031 25.707031 C 48.097656 25.316406 48.097656 24.683594 47.707031 24.292969 L 25.707031 2.292969 C 25.523438 2.105469 25.269531 2 25 2 Z M 25 4.414063 L 45.585938 25 L 25 45.585938 L 4.414063 25 Z M 24 16 L 24 26 L 14 26 L 14 28 L 24 28 L 24 38 L 26 38 L 26 28 L 36 28 L 36 26 L 26 26 L 26 16 Z"/></svg> Aggiungi Blocco di Testo + Immagine
                    </button>
                </div>
                
                <div class="form-group">
                    <label for="ctaText">Testo Call-to-Action (opzionale)</label>
                    <input type="text" id="ctaText" value="${data.ctaText || ''}" placeholder="Scopri di più su Cremona →">
                    <small>Verrà mostrato nell'ultimo blocco di testo</small>
                </div>
                
                <div class="form-group">
                    <label for="ctaLink">Link Call-to-Action</label>
                    <input type="url" id="ctaLink" value="${data.ctaLink || ''}" placeholder="https://..." oninput="updateBlockPreview()">
                </div>
            </div>
            <div id="blockPreview" style="position: relative;">
                <!-- Anteprima live verrà inserita qui -->
            </div>
            </div>
        `,
        
        carousel: `
            <div style="display: grid; grid-template-columns: 1fr 400px; gap: 24px; align-items: start;">
                <div class="form-section">
                <h4 style="margin-bottom: 16px;">🎠 Carousel Stories - Stile Relais & Châteaux</h4>
                <p style="color: var(--text-light); margin-bottom: 24px; line-height: 1.6;">
                    Carousel orizzontale con card che linkano ad articoli o storie. Design ispirato a Relais & Châteaux.
                </p>
                
                <div class="form-group">
                    <label for="title">Titolo Sezione *</label>
                    <input type="text" id="title" required value="${data.title || ''}" placeholder="Viaggiare secondo i propri desideri" oninput="updateBlockPreview()">
                </div>
                
                <div class="form-group">
                    <label for="subtitle">Sottotitolo</label>
                    <input type="text" id="subtitle" value="${data.subtitle || ''}" placeholder="Scopri le nostre destinazioni" oninput="updateBlockPreview()">
                </div>
                
                <h4 style="margin: 32px 0 16px 0; padding-top: 24px; border-top: 2px solid rgba(99, 102, 241, 0.2);">🎴 Card Carousel</h4>
                
                <div id="carouselCardsList">
                    ${generateCarouselCardsFields(data.cards || [])}
                </div>
                
                <button type="button" onclick="addCarouselCard()" class="btn btn-secondary" style="margin-top: 12px;">
                    <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 25 2 C 24.730469 2 24.476563 2.105469 24.292969 2.292969 L 2.292969 24.292969 C 1.90625 24.679688 1.90625 25.320313 2.292969 25.707031 L 24.292969 47.707031 C 24.683594 48.097656 25.316406 48.097656 25.707031 47.707031 L 47.707031 25.707031 C 48.097656 25.316406 48.097656 24.683594 47.707031 24.292969 L 25.707031 2.292969 C 25.523438 2.105469 25.269531 2 25 2 Z M 25 4.414063 L 45.585938 25 L 25 45.585938 L 4.414063 25 Z M 24 16 L 24 26 L 14 26 L 14 28 L 24 28 L 24 38 L 26 38 L 26 28 L 36 28 L 36 26 L 26 26 L 26 16 Z"/></svg>
                    Aggiungi Card
                </button>
                <small style="display: block; margin-top: 8px; color: var(--text-light);">Inserisci almeno 3 card per il carousel</small>
                
                <h4 style="margin: 32px 0 16px 0; padding-top: 24px; border-top: 2px solid rgba(99, 102, 241, 0.2);">⚙️ Impostazioni</h4>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="infiniteScroll" ${data.infiniteScroll ? 'checked' : ''} onchange="updateBlockPreview()">
                        🔄 Scroll Infinito (Circolare)
                    </label>
                    <small style="display: block; margin-top: 8px; color: var(--text-light);">
                        Se attivo, il carousel scorrerà all'infinito tornando alla prima card dopo l'ultima. Altrimenti avrà un inizio e una fine.
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="summaryTitle">📋 Titolo per il Sommario *</label>
                    <input type="text" id="summaryTitle" required value="${data.summaryTitle || ''}" placeholder="Storie dal mondo">
                    <small>Questo titolo apparirà nella lista del sommario della rivista</small>
                </div>
            </div>
            <div id="blockPreview" style="position: relative;">
                <!-- Anteprima live verrà inserita qui -->
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
    
    // Inizializza funzionalità specifiche per tipo
    if (type === 'fluid') {
        setTimeout(() => {
            initFluidBlockDragDrop();
            initAllFluidCroppers();
            updateBlockPreview();
        }, 300);
    } else {
        // Per tutti gli altri tipi, carica l'anteprima
        setTimeout(() => {
            updateBlockPreview();
        }, 100);
    }
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
        },
        settings: {}
    };
    
    // Cover: gestisci immagini multiple e sommario
    if (type === 'cover') {
        const imagesText = document.getElementById('images').value;
        blockData.images = imagesText.split('\n').filter(url => url.trim());
        delete blockData.image;
        
        // Raccogli sommario
        blockData.settings.sommario = collectSommarioData();
    }
    
    // Gallery: converti textarea in array e raccogli tutti i dati
    if (type === 'gallery') {
        // Raccogli immagini con didascalie
        blockData.galleryImages = collectGalleryImagesData();
        
        blockData.tag = document.getElementById('tag')?.value || '';
        blockData.intro = document.getElementById('intro')?.value || '';
        blockData.backgroundImage = document.getElementById('backgroundImage')?.value || '';
        blockData.summaryTitle = document.getElementById('summaryTitle')?.value || '';
        blockData.ctaText = document.getElementById('ctaText')?.value || '';
        blockData.ctaLink = document.getElementById('ctaLink')?.value || '';
        
        // Stats
        blockData.showStats = document.getElementById('showStats')?.checked !== false;
        blockData.stats = [];
        if (blockData.showStats) {
            for (let i = 1; i <= 3; i++) {
                const number = document.getElementById(`stat${i}Number`)?.value;
                const label = document.getElementById(`stat${i}Label`)?.value;
                if (number && label) {
                    blockData.stats.push({ number, label });
                }
            }
        }
        
        // Quote
        blockData.showQuote = document.getElementById('showQuote')?.checked || false;
        if (blockData.showQuote) {
            blockData.quote = {
                text: document.getElementById('quoteText')?.value || '',
                author: document.getElementById('quoteAuthor')?.value || ''
            };
        }
        
        // Features
        blockData.showFeatures = document.getElementById('showFeatures')?.checked || false;
        if (blockData.showFeatures) {
            const featuresText = document.getElementById('features')?.value || '';
            blockData.features = featuresText.split('\n').filter(f => f.trim());
        }
        
        // Validazione
        if (blockData.galleryImages.length < 3) {
            alert('⚠️ Inserisci almeno 3 immagini nella galleria!');
            return;
        }
        
        delete blockData.image;
        delete blockData.content;
        delete blockData.images;
    }
    
    // Fluid: gestisci blocchi multipli con immagini
    if (type === 'fluid') {
        blockData.tag = document.getElementById('tag')?.value || '';
        blockData.intro = document.getElementById('intro')?.value || '';
        blockData.previewImage = document.getElementById('previewImage')?.value || '';
        blockData.summaryTitle = document.getElementById('summaryTitle')?.value || '';
        blockData.ctaText = document.getElementById('ctaText')?.value || '';
        blockData.ctaLink = document.getElementById('ctaLink')?.value || '';
        blockData.fluidBlocks = collectFluidBlocksData();
        
        // Salva crop data dell'immagine di anteprima
        const previewCropDataInput = document.getElementById('previewImageCropData');
        try {
            blockData.previewImageCropData = previewCropDataInput ? JSON.parse(previewCropDataInput.value) : {};
        } catch (e) {
            blockData.previewImageCropData = {};
        }
        
        // Valida che ci sia almeno un blocco
        if (blockData.fluidBlocks.length === 0) {
            alert('⚠️ Aggiungi almeno un blocco di testo + immagine!');
            return;
        }
        
        // Valida foto di anteprima
        if (!blockData.previewImage) {
            alert('⚠️ Inserisci la foto di anteprima iniziale!');
            return;
        }
    }
    
    // Carousel: gestisci card multiple
    if (type === 'carousel') {
        blockData.summaryTitle = document.getElementById('summaryTitle')?.value || '';
        blockData.cards = collectCarouselCardsData();
        blockData.infiniteScroll = document.getElementById('infiniteScroll')?.checked || false;
        
        console.log('🎠 CAROUSEL SAVE DEBUG:', {
            infiniteCheckbox: document.getElementById('infiniteScroll'),
            infiniteChecked: document.getElementById('infiniteScroll')?.checked,
            infiniteScrollValue: blockData.infiniteScroll,
            cards: blockData.cards.length
        });
        
        // Validazione
        if (blockData.cards.length < 3) {
            alert('⚠️ Inserisci almeno 3 card nel carousel!');
            return;
        }
        
        delete blockData.image;
        delete blockData.content;
        delete blockData.link;
    }
    
    try {
        if (blockId) {
            // Update
            console.log('📤 Sending UPDATE to server:', blockData);
            await apiRequest(`/admin/magazines/${magazineId}/blocks/${blockId}`, {
                method: 'PUT',
                body: JSON.stringify(blockData)
            });
            alert('✅ Blocco aggiornato!');
        } else {
            // Create
            console.log('📤 Sending CREATE to server:', blockData);
            await apiRequest(`/admin/magazines/${magazineId}/blocks`, {
                method: 'POST',
                body: JSON.stringify(blockData)
            });
            alert('✅ Blocco aggiunto!');
        }
        
        // 🔄 RIGENERA AUTOMATICAMENTE L'HTML DOPO OGNI SALVATAGGIO
        console.log('🔄 Rigenerazione automatica HTML...');
        try {
            await fetch(`https://rivista-checkin.onrender.com/api/admin/magazines/${magazineId}/generate-html`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('✅ HTML rigenerato automaticamente');
        } catch (regenError) {
            console.error('⚠️ Errore rigenerazione HTML:', regenError);
            // Non bloccare il flusso se la rigenerazione fallisce
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
    
    // Ripristina scroll della pagina
    document.body.style.overflow = '';
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
        
        // 🔄 RIGENERA HTML dopo modifica visibilità
        try {
            await fetch(`https://rivista-checkin.onrender.com/api/admin/magazines/${magazineId}/generate-html`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) { console.error('⚠️ Errore rigenerazione:', e); }
        
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
        
        // 🔄 RIGENERA HTML dopo eliminazione
        try {
            await fetch(`https://rivista-checkin.onrender.com/api/admin/magazines/${magazineId}/generate-html`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) { console.error('⚠️ Errore rigenerazione:', e); }
        
        alert('✅ Blocco eliminato!');
        loadMagazine();
    } catch (error) {
        console.error('Errore eliminazione blocco:', error);
        alert('❌ Errore nell\'eliminazione');
    }
}

// Drag & Drop per riordinamento
function initDragAndDrop() {
    const blockItems = document.querySelectorAll('.block-card-modern, .block-item');
    
    blockItems.forEach(item => {
        item.setAttribute('draggable', 'true');
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
        
        // 🔄 RIGENERA HTML dopo riordino
        try {
            await fetch(`https://rivista-checkin.onrender.com/api/admin/magazines/${magazineId}/generate-html`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) { console.error('⚠️ Errore rigenerazione:', e); }
        
    } catch (error) {
        console.error('Errore riordinamento:', error);
    }
}

// ============================================
// HELPER PER SOMMARIO (blocco cover)
// ============================================

// Genera campi sommario esistenti
function generateSommarioFields(sommarioItems = []) {
    if (sommarioItems.length === 0) {
        return '<p style="color: #94a3b8; font-size: 14px;">Nessuna voce. Clicca "Aggiungi voce sommario"</p>';
    }
    
    return sommarioItems.map((item, index) => `
        <div class="sommario-field" style="display: flex; gap: 8px; margin-bottom: 12px;">
            <input type="text" 
                   class="sommario-text" 
                   placeholder="Testo voce" 
                   value="${item.text || ''}" 
                   style="flex: 2;">
            <input type="text" 
                   class="sommario-link" 
                   placeholder="Link (es. #sezione)" 
                   value="${item.link || ''}" 
                   style="flex: 1;">
            <button type="button" 
                    onclick="removeSommarioItem(this)" 
                    class="btn btn-sm btn-danger">
                <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>
            </button>
        </div>
    `).join('');
    
}

// Aggiungi voce sommario
function addSommarioItem() {
    const container = document.getElementById('sommarioItems');
    const currentContent = container.innerHTML;
    
    // Rimuovi messaggio "Nessuna voce" se presente
    if (currentContent.includes('Nessuna voce')) {
        container.innerHTML = '';
    }
    
    const newField = document.createElement('div');
    newField.className = 'sommario-field';
    newField.style.cssText = 'display: flex; gap: 8px; margin-bottom: 12px;';
    newField.innerHTML = `
        <input type="text" 
               class="sommario-text" 
               placeholder="Testo voce" 
               style="flex: 2;">
        <input type="text" 
               class="sommario-link" 
               placeholder="Link (es. #sezione)" 
               style="flex: 1;">
        <button type="button" 
                onclick="removeSommarioItem(this)" 
                class="btn btn-sm btn-danger">
            <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>
        </button>
    `;
    
    container.appendChild(newField);
}

// Rimuovi voce sommario
function removeSommarioItem(button) {
    const container = document.getElementById('sommarioItems');
    button.parentElement.remove();
    
    // Se non ci sono più voci, mostra messaggio
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; font-size: 14px;">Nessuna voce. Clicca "Aggiungi voce sommario"</p>';
    }
}

// Raccogli dati sommario dal form
function collectSommarioData() {
    const fields = document.querySelectorAll('.sommario-field');
    const sommario = [];
    
    fields.forEach(field => {
        const text = field.querySelector('.sommario-text')?.value || '';
        const link = field.querySelector('.sommario-link')?.value || '';
        
        if (text.trim()) {
            sommario.push({ text, link });
        }
    });
    
    return sommario;
}

// ============================================
// PARALLASSE BLOCK HELPERS
// ============================================
// ============================================

// Genera campi per i blocchi fluid
function generateFluidBlocksFields(fluidBlocks = []) {
    if (fluidBlocks.length === 0) {
        return '<p style="color: #94a3b8; font-size: 14px;">Nessun blocco. Clicca "Aggiungi Blocco di Testo + Immagine"</p>';
    }
    
    return fluidBlocks.map((block, index) => `
        <div class="fluid-block-field" draggable="true" style="background: var(--bg-gradient-light); border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(51, 51, 130, 0.1); cursor: move;">
            <div class="fluid-block-header" onclick="toggleFluidBlock(this)" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; user-select: none;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="drag-handle" style="cursor: grab; color: var(--text-light);">⠿</span>
                    <strong style="color: var(--primary); font-size: 14px;">📄 Blocco ${index + 1}</strong>
                    <span class="fluid-block-preview" style="color: var(--text-light); font-size: 12px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${block.heading || block.text?.substring(0, 50) || 'Nuovo blocco'}...</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="toggle-icon" style="transition: transform 0.3s; color: var(--primary);">▼</span>
                    <button type="button" 
                            onclick="event.stopPropagation(); removeFluidBlock(this)" 
                            class="btn btn-sm btn-danger" style="padding: 4px 8px;">
                        <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>
                    </button>
                </div>
            </div>
            <div class="fluid-block-content" style="padding: 0 20px 20px; display: block;">
            
            <div class="form-group" style="margin-bottom: 12px;">
                <label style="font-size: 13px; font-weight: 600;">Titolo Sezione (opzionale)</label>
                <input type="text" 
                       class="fluid-heading" 
                       placeholder="Un patrimonio che nasce dal suono" 
                       value="${block.heading || ''}" 
                       style="width: 100%;"
                       oninput="updateFluidPreview()">
            </div>
            
            <div class="form-group" style="margin-bottom: 12px;">
                <label style="font-size: 13px; font-weight: 600;">Testo *</label>
                <textarea class="fluid-text" 
                          rows="4" 
                          placeholder="Scrivi il testo del blocco..." 
                          style="width: 100%;"
                          oninput="updateFluidPreview()">${block.text || ''}</textarea>
            </div>
            
            <div class="form-group" style="margin-bottom: 12px;">
                <label style="font-size: 13px; font-weight: 600;">Testo in Evidenza (opzionale)</label>
                <textarea class="fluid-highlight" 
                          rows="2" 
                          placeholder="Testo da evidenziare con sfondo e bordo..." 
                          style="width: 100%;"
                          oninput="updateFluidPreview()">${block.highlight || ''}</textarea>
                <small>Questo testo apparirà con sfondo colorato e bordo a sinistra</small>
            </div>
            
            <div class="form-group">
                <label style="font-size: 13px; font-weight: 600;">URL Immagine *</label>
                <input type="url" 
                       class="fluid-image" 
                       id="fluidImage${index}"
                       placeholder="https://esempio.com/immagine.jpg" 
                       value="${block.image || ''}" 
                       style="width: 100%;"
                       oninput="updateFluidPreview(); initFluidImageCropperByElement(this)">
                <small>Questa immagine verrà mostrata quando l'utente legge questo blocco</small>
            </div>
            
            <div class="form-group">
                <div id="fluidCropper${index}"></div>
            </div>
            
            <input type="hidden" class="fluid-crop-data" value='${JSON.stringify(block.cropData || {})}'>
            </div>
        </div>
    `).join('');
}

// Toggle espansione blocco fluid
function toggleFluidBlock(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
    }
}

// Aggiungi blocco fluid
function addFluidBlock() {
    const container = document.getElementById('fluidBlocks');
    const currentContent = container.innerHTML;
    
    // Rimuovi messaggio "Nessun blocco" se presente
    if (currentContent.includes('Nessun blocco')) {
        container.innerHTML = '';
    }
    
    const index = container.children.length;
    const newBlock = document.createElement('div');
    newBlock.className = 'fluid-block-field';
    newBlock.draggable = true;
    newBlock.style.cssText = 'background: var(--bg-gradient-light); border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(51, 51, 130, 0.1); cursor: move;';
    newBlock.innerHTML = `
        <div class="fluid-block-header" onclick="toggleFluidBlock(this)" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; user-select: none;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="drag-handle" style="cursor: grab; color: var(--text-light);">⠿</span>
                <strong style="color: var(--primary); font-size: 14px;">📄 Blocco ${index + 1}</strong>
                <span class="fluid-block-preview" style="color: var(--text-light); font-size: 12px;">Nuovo blocco...</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="toggle-icon" style="transition: transform 0.3s; color: var(--primary);">▼</span>
                <button type="button" 
                        onclick="event.stopPropagation(); removeFluidBlock(this)" 
                        class="btn btn-sm btn-danger" style="padding: 4px 8px;">
                    <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>
                </button>
            </div>
        </div>
        <div class="fluid-block-content" style="padding: 0 20px 20px; display: block;">
        
        <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 13px; font-weight: 600;">Titolo Sezione (opzionale)</label>
            <input type="text" 
                   class="fluid-heading" 
                   placeholder="Un patrimonio che nasce dal suono" 
                   style="width: 100%;"
                   oninput="updateFluidPreview()">
        </div>
        
        <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 13px; font-weight: 600;">Testo *</label>
            <textarea class="fluid-text" 
                      rows="4" 
                      placeholder="Scrivi il testo del blocco..." 
                      style="width: 100%;"
                      oninput="updateFluidPreview()"></textarea>
        </div>
        
        <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 13px; font-weight: 600;">Testo in Evidenza (opzionale)</label>
            <textarea class="fluid-highlight" 
                      rows="2" 
                      placeholder="Testo da evidenziare con sfondo e bordo..." 
                      style="width: 100%;"
                      oninput="updateFluidPreview()"></textarea>
            <small>Questo testo apparirà con sfondo colorato e bordo a sinistra</small>
        </div>
        
        <div class="form-group">
            <label style="font-size: 13px; font-weight: 600;">URL Immagine *</label>
            <input type="url" 
                   class="fluid-image"
                   id="fluidImage${index}" 
                   placeholder="https://esempio.com/immagine.jpg" 
                   style="width: 100%;"
                   oninput="updateFluidPreview(); initFluidImageCropper(${index})">
            <small>Questa immagine verrà mostrata quando l'utente legge questo blocco</small>
        </div>
        
        <div class="form-group">
            <div id="fluidCropper${index}"></div>
        </div>
        
        <input type="hidden" class="fluid-crop-data" value='{}'>
        </div>
    `;
    
    container.appendChild(newBlock);
    initFluidBlockDragDrop();
    updateFluidPreview();
}

// Rimuovi blocco fluid
function removeFluidBlock(button) {
    const container = document.getElementById('fluidBlocks');
    button.closest('.fluid-block-field').remove();
    
    // Riaggiorna numerazione
    const blocks = container.querySelectorAll('.fluid-block-field');
    blocks.forEach((block, index) => {
        block.querySelector('strong').textContent = `📄 Blocco ${index + 1}`;
    });
    
    // Se non ci sono più blocchi, mostra messaggio
    if (blocks.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; font-size: 14px;">Nessun blocco. Clicca "Aggiungi Blocco di Testo + Immagine"</p>';
    }
}

// Raccogli dati fluid blocks dal form
function collectFluidBlocksData() {
    const fields = document.querySelectorAll('.fluid-block-field');
    const fluidBlocks = [];
    
    fields.forEach(field => {
        const heading = field.querySelector('.fluid-heading')?.value || '';
        const text = field.querySelector('.fluid-text')?.value || '';
        const highlight = field.querySelector('.fluid-highlight')?.value || '';
        const image = field.querySelector('.fluid-image')?.value || '';
        const cropDataInput = field.querySelector('.fluid-crop-data');
        
        let cropData = {};
        try {
            cropData = cropDataInput ? JSON.parse(cropDataInput.value) : {};
        } catch (e) {}
        
        if (text.trim() && image.trim()) {
            fluidBlocks.push({ heading, text, highlight, image, cropData });
        }
    });
    
    return fluidBlocks;
}

// Drag & Drop per blocchi fluid
let draggedFluidBlock = null;

function initFluidBlockDragDrop() {
    const fluidBlocks = document.querySelectorAll('.fluid-block-field');
    
    fluidBlocks.forEach(block => {
        block.removeEventListener('dragstart', handleFluidDragStart);
        block.removeEventListener('dragover', handleFluidDragOver);
        block.removeEventListener('drop', handleFluidDrop);
        block.removeEventListener('dragend', handleFluidDragEnd);
        
        block.addEventListener('dragstart', handleFluidDragStart);
        block.addEventListener('dragover', handleFluidDragOver);
        block.addEventListener('drop', handleFluidDrop);
        block.addEventListener('dragend', handleFluidDragEnd);
    });
}

function handleFluidDragStart(e) {
    draggedFluidBlock = this;
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleFluidDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedFluidBlock) {
        const container = this.parentElement;
        const allBlocks = [...container.querySelectorAll('.fluid-block-field')];
        const draggedIndex = allBlocks.indexOf(draggedFluidBlock);
        const targetIndex = allBlocks.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentElement.insertBefore(draggedFluidBlock, this.nextSibling);
        } else {
            this.parentElement.insertBefore(draggedFluidBlock, this);
        }
    }
}

function handleFluidDrop(e) {
    e.stopPropagation();
    return false;
}

function handleFluidDragEnd(e) {
    this.style.opacity = '1';
    
    // Riaggiorna numerazione
    const container = document.getElementById('fluidBlocks');
    const blocks = container.querySelectorAll('.fluid-block-field');
    blocks.forEach((block, index) => {
        block.querySelector('strong').textContent = `📄 Blocco ${index + 1}`;
    });
    
    updateFluidPreview();
}

// Anteprima live universale per tutti i blocchi
async function updateBlockPreview() {
    const blockType = document.getElementById('blockType')?.value;
    const previewContainer = document.getElementById('blockPreview');
    
    if (!previewContainer || !blockType) return;
    
    // Raccogli i dati del blocco corrente
    const blockData = collectCurrentBlockData();
    
    try {
        // Chiama il backend per generare l'HTML con i CSS reali
        const response = await fetch(`${API_BASE_URL}/admin/blocks/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: blockType, data: blockData })
        });
        
        const result = await response.json();
        
        if (result.success && result.html) {
            // Crea iframe con HTML reale e CSS della rivista
            previewContainer.innerHTML = `
                <div style="position: sticky; top: 20px;">
                    <div style="padding: 12px 16px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border-radius: 10px 10px 0 0;">
                        <h3 style="margin: 0 0 3px 0; font-size: 14px; font-weight: 600;">📱 Anteprima Live</h3>
                        <p style="margin: 0; font-size: 11px; opacity: 0.85;">${getBlockTypeName(blockType)}</p>
                    </div>
                    <iframe 
                        style="width: 100%; height: 500px; border: none; border-radius: 0 0 10px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); background: white; display: block;"
                        srcdoc="${escapeHtml(result.html)}"
                    ></iframe>
                </div>
            `;
        }
    } catch (error) {
        console.error('Errore anteprima:', error);
        previewContainer.innerHTML = `
            <div style="position: sticky; top: 20px; background: #fee2e2; border-radius: 10px; padding: 16px; text-align: center; color: #dc2626;">
                <p style="margin: 0; font-size: 13px;">⚠️ Errore nel caricamento dell'anteprima</p>
            </div>
        `;
    }
}

// Raccogli dati del blocco corrente dal form
function collectCurrentBlockData() {
    const type = document.getElementById('blockType')?.value;
    
    const data = {
        title: document.getElementById('title')?.value || '',
        subtitle: document.getElementById('subtitle')?.value || '',
        content: document.getElementById('content')?.value || '',
        image: document.getElementById('image')?.value || '',
        link: document.getElementById('link')?.value || '',
        buttonText: document.getElementById('buttonText')?.value || '',
        visible: document.getElementById('visible')?.checked !== false,
        style: {
            layout: document.getElementById('styleLayout')?.value || 'center',
            textColor: document.getElementById('styleTextColor')?.value || '#ffffff',
            bgColor: document.getElementById('styleBgColor')?.value || '#000000'
        }
    };
    
    // Dati specifici per tipo
    if (type === 'cover') {
        const imagesText = document.getElementById('images')?.value || '';
        data.images = imagesText.split('\n').filter(url => url.trim());
        data.settings = {
            sommario: collectSommarioData()
        };
    }
    
    if (type === 'gallery') {
        const imagesText = document.getElementById('images')?.value || '';
        data.images = imagesText.split('\n').filter(url => url.trim());
        data.settings = {
            columns: parseInt(document.getElementById('settingsColumns')?.value) || 3,
            gap: parseInt(document.getElementById('settingsGap')?.value) || 16,
            aspectRatio: document.getElementById('settingsAspectRatio')?.value || '16/9'
        };
    }
    
    if (type === 'fluid') {
        data.tag = document.getElementById('tag')?.value || '';
        data.intro = document.getElementById('intro')?.value || '';
        data.previewImage = document.getElementById('previewImage')?.value || '';
        data.summaryTitle = document.getElementById('summaryTitle')?.value || '';
        data.ctaText = document.getElementById('ctaText')?.value || '';
        data.ctaLink = document.getElementById('ctaLink')?.value || '';
        data.fluidBlocks = collectFluidBlocksData();
    }
    
    if (type === 'carousel') {
        data.summaryTitle = document.getElementById('summaryTitle')?.value || '';
        data.cards = collectCarouselCardsData();
        data.infiniteScroll = document.getElementById('infiniteScroll')?.checked || false;
    }
    
    return data;
}

// Ottieni nome leggibile del tipo di blocco
function getBlockTypeName(type) {
    const names = {
        cover: 'Blocco Copertina',
        hero: 'Hero Block',
        article: 'Articolo',
        gallery: 'Galleria',
        text: 'Testo',
        quote: 'Citazione',
        video: 'Video',
        fluid: 'Parallasse Block',
        custom: 'Blocco Personalizzato'
    };
    return names[type] || type;
}

// Escape HTML per iframe srcdoc
function escapeHtml(html) {
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Mantieni updateFluidPreview come alias per retrocompatibilità
function updateFluidPreview() {
    updateBlockPreview();
}

// ============================================
// ANTEPRIMA E PUBBLICAZIONE
// ============================================

// Anteprima rivista - Genera HTML su Render e apre l'anteprima
async function previewMagazine() {
    // Apri la finestra immediatamente per evitare il blocco popup su iPad/Safari
    const previewWindow = window.open('about:blank', '_blank');
    
    try {
        // Genera l'HTML su Render
        const response = await fetch(`https://rivista-checkin.onrender.com/api/admin/magazines/${magazineId}/generate-html`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.previewUrl) {
            // Aggiorna l'URL della finestra già aperta
            previewWindow.location.href = result.previewUrl;
        } else {
            previewWindow.close();
            throw new Error(result.error || 'Errore nella generazione dell\'anteprima');
        }
    } catch (error) {
        if (previewWindow && !previewWindow.closed) {
            previewWindow.close();
        }
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
            alert(`✅ RIVISTA PUBBLICATA CON SUCCESSO!\n\n📄 File: ${response.fileName}\n🌐 URL: ${response.url}\n📅 Data: ${new Date(response.magazine.publishDate).toLocaleString('it-IT')}\n\n🎉 La tua rivista è ora online!`);
            
            // Ricarica i dati
            await loadMagazine();
            
            // Apri la rivista pubblicata
            if (confirm('Vuoi aprire la rivista pubblicata?')) {
                window.open(`../../${response.fileName}`, '_blank');
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

// ============================================
// IMAGE CROPPER PER BLOCCHI FLUID
// ============================================

// Store dei cropper attivi
window.fluidCroppers = {};
window.previewImageCropper = null;

// Inizializza cropper per immagine di anteprima
function initPreviewImageCropper() {
    const imageInput = document.getElementById('previewImage');
    const cropperContainer = document.getElementById('previewImageCropper');
    const cropDataInput = document.getElementById('previewImageCropData');
    
    console.log('initPreviewImageCropper chiamata');
    console.log('imageInput:', imageInput);
    console.log('cropperContainer:', cropperContainer);
    
    if (!imageInput || !cropperContainer) {
        console.warn('Elementi non trovati per preview image cropper');
        return;
    }
    
    const imageUrl = imageInput.value.trim();
    console.log('imageUrl:', imageUrl);
    
    if (!imageUrl || !(imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        cropperContainer.innerHTML = '';
        return;
    }
    
    // Recupera crop data esistente
    let existingCropData = {};
    try {
        existingCropData = cropDataInput ? JSON.parse(cropDataInput.value) : {};
    } catch (e) {}
    
    console.log('Creazione cropper per preview image:', imageUrl);
    
    // Distruggi cropper esistente
    if (window.previewImageCropper) {
        window.previewImageCropper.destroy();
        window.previewImageCropper = null;
    }
    
    // Crea nuovo cropper
    setTimeout(() => {
        // Cattura il riferimento in una variabile locale per evitare problemi di closure
        const targetCropDataInput = cropDataInput;
        
        window.previewImageCropper = new ImageCropper('previewImageCropper', {
            imageUrl: imageUrl,
            aspectRatio: 16/9,
            cropData: existingCropData,
            onChange: (cropData) => {
                console.log('onChange chiamato per previewImageCropper', cropData);
                console.log('targetCropDataInput:', targetCropDataInput);
                
                if (targetCropDataInput) {
                    targetCropDataInput.value = JSON.stringify(cropData);
                    console.log('Nuovo valore cropData preview:', targetCropDataInput.value);
                } else {
                    console.error('cropDataInput non trovato per preview image');
                }
            }
        });
        console.log('Preview image cropper creato');
    }, 200);
}

// Inizializza cropper per un blocco fluid usando l'elemento input
function initFluidImageCropperByElement(inputElement) {
    if (!inputElement) return;
    
    const index = inputElement.id.replace('fluidImage', '');
    const cropperContainer = document.getElementById(`fluidCropper${index}`);
    
    console.log('initFluidImageCropperByElement per index:', index);
    console.log('inputElement:', inputElement);
    console.log('cropperContainer:', cropperContainer);
    
    if (!inputElement || !cropperContainer) {
        console.warn('Elementi non trovati per index:', index);
        return;
    }
    
    const imageUrl = inputElement.value.trim();
    console.log('imageUrl:', imageUrl);
    
    if (!imageUrl || !(imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        cropperContainer.innerHTML = '';
        return;
    }
    
    // Recupera crop data esistente se presente
    const cropDataInput = inputElement.closest('.fluid-block-content').querySelector('.fluid-crop-data');
    
    console.log('cropDataInput trovato:', cropDataInput);
    console.log('cropDataInput ID (se presente):', cropDataInput?.id);
    console.log('cropDataInput value:', cropDataInput?.value);
    
    let existingCropData = {};
    try {
        existingCropData = cropDataInput ? JSON.parse(cropDataInput.value) : {};
    } catch (e) {}
    
    console.log('Creazione cropper per:', imageUrl);
    console.log('Existing crop data:', existingCropData);
    
    // Distruggi cropper esistente
    if (window.fluidCroppers[index]) {
        window.fluidCroppers[index].destroy();
        delete window.fluidCroppers[index];
    }
    
    // Crea nuovo cropper con riferimento esplicito al cropDataInput
    setTimeout(() => {
        // Cattura il riferimento in una variabile locale per evitare problemi di closure
        const targetCropDataInput = cropDataInput;
        
        window.fluidCroppers[index] = new ImageCropper(`fluidCropper${index}`, {
            imageUrl: imageUrl,
            aspectRatio: 16/9,
            cropData: existingCropData,
            onChange: (cropData) => {
                console.log(`onChange chiamato per cropper ${index}`, cropData);
                console.log('targetCropDataInput:', targetCropDataInput);
                
                // Aggiorna hidden input con crop data
                if (targetCropDataInput) {
                    console.log('Aggiornamento cropData per index', index);
                    targetCropDataInput.value = JSON.stringify(cropData);
                    console.log('Nuovo valore:', targetCropDataInput.value);
                } else {
                    console.error('cropDataInput non trovato per index', index);
                }
            }
        });
        console.log('Cropper creato per index:', index);
    }, 200);
}

// Inizializza cropper per un blocco fluid (versione con indice - DEPRECATED, usa initFluidImageCropperByElement)
function initFluidImageCropper(index) {
    const imageInput = document.getElementById(`fluidImage${index}`);
    if (imageInput) {
        initFluidImageCropperByElement(imageInput);
    }
}

// Inizializza tutti i cropper quando si apre il modal di modifica
function initAllFluidCroppers() {
    console.log('initAllFluidCroppers chiamata');
    
    // Inizializza cropper per immagine di anteprima
    const previewImage = document.getElementById('previewImage');
    if (previewImage && previewImage.value.trim()) {
        console.log('Inizializzazione cropper immagine anteprima');
        initPreviewImageCropper();
    }
    
    // Inizializza cropper per blocchi fluid
    const fluidBlocks = document.querySelectorAll('.fluid-block-field');
    console.log('Blocchi fluid trovati:', fluidBlocks.length);
    
    fluidBlocks.forEach((block, index) => {
        const imageInput = block.querySelector('.fluid-image');
        console.log(`Blocco ${index}, imageInput:`, imageInput, 'value:', imageInput?.value);
        if (imageInput && imageInput.value.trim()) {
            initFluidImageCropper(index);
        }
    });
}

// ============================================
// GALLERY STORY BLOCK HELPERS
// ============================================

function toggleStatsFields() {
    const showStats = document.getElementById("showStats").checked;
    document.getElementById("statsFields").style.display = showStats ? "block" : "none";
}

function toggleQuoteFields() {
    const showQuote = document.getElementById("showQuote").checked;
    document.getElementById("quoteFields").style.display = showQuote ? "block" : "none";
}

function toggleFeaturesFields() {
    const showFeatures = document.getElementById("showFeatures").checked;
    document.getElementById("featuresFields").style.display = showFeatures ? "block" : "none";
}

function updateGalleryPreview() {
    // TODO: Implementa anteprima live del blocco gallery
    console.log("Gallery preview update");
}

// Genera campi per le immagini della gallery
function generateGalleryImagesFields(images = []) {
    if (images.length === 0) {
        return '<p style="color: #94a3b8; font-size: 14px; padding: 20px; text-align: center; background: rgba(148, 163, 184, 0.1); border-radius: 8px;">Nessuna immagine. Clicca "Aggiungi Immagine"</p>';
    }
    
    return images.map((img, index) => `
        <div class="gallery-image-field" draggable="true" style="background: var(--bg-gradient-light); border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(51, 51, 130, 0.1); cursor: move;">
            <div class="gallery-image-header" onclick="toggleGalleryImage(this)" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; user-select: none;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="drag-handle" style="cursor: grab; color: var(--text-light);">⠿</span>
                    <strong style="color: var(--primary); font-size: 14px;">📸 Immagine ${index + 1}</strong>
                    <span class="gallery-image-preview" style="color: var(--text-light); font-size: 12px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${img.caption || 'Senza didascalia'}...</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="toggle-icon" style="transition: transform 0.3s; color: var(--primary);">▼</span>
                    <button type="button" 
                            onclick="event.stopPropagation(); removeGalleryImage(this)" 
                            class="btn btn-sm btn-danger" style="padding: 4px 8px;">
                        <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>
                    </button>
                </div>
            </div>
            <div class="gallery-image-content" style="padding: 0 20px 20px; display: block;">
            
            <div class="form-group" style="margin-bottom: 12px;">
                <label style="font-size: 13px; font-weight: 600;">URL Immagine *</label>
                <input type="url" 
                       class="gallery-image-url" 
                       id="galleryImage${index}"
                       placeholder="https://esempio.com/immagine.jpg" 
                       value="${img.url || ''}" 
                       style="width: 100%;"
                       oninput="updateGalleryPreview(); initGalleryImageCropperByElement(this)">
            </div>
            
            <div class="form-group">
                <div id="galleryCropper${index}"></div>
            </div>
            
            <input type="hidden" class="gallery-crop-data" value='${JSON.stringify(img.cropData || {})}'>
            
            <div class="form-group">
                <label style="font-size: 13px; font-weight: 600;">Didascalia</label>
                <input type="text" 
                       class="gallery-image-caption" 
                       placeholder="Praga: la magia del Natale" 
                       value="${img.caption || ''}" 
                       style="width: 100%;"
                       oninput="updateGalleryPreview()">
                <small>Questa didascalia apparirà sotto l'immagine</small>
            </div>
            </div>
        </div>
    `).join('');
}

// Toggle espansione immagine gallery
function toggleGalleryImage(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
    }
}

// Aggiungi immagine gallery
function addGalleryImage() {
    const container = document.getElementById('galleryImagesList');
    const currentContent = container.innerHTML;
    
    // Rimuovi messaggio "Nessuna immagine" se presente
    if (currentContent.includes('Nessuna immagine')) {
        container.innerHTML = '';
    }
    
    const index = container.children.length;
    const newImage = document.createElement('div');
    newImage.className = 'gallery-image-field';
    newImage.draggable = true;
    newImage.style.cssText = 'background: var(--bg-gradient-light); border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(51, 51, 130, 0.1); cursor: move;';
    
    newImage.innerHTML = `
        <div class="gallery-image-header" onclick="toggleGalleryImage(this)" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; user-select: none;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="drag-handle" style="cursor: grab; color: var(--text-light);">⠿</span>
                <strong style="color: var(--primary); font-size: 14px;">📸 Immagine ${index + 1}</strong>
                <span class="gallery-image-preview" style="color: var(--text-light); font-size: 12px;">Nuova immagine...</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="toggle-icon" style="transition: transform 0.3s; color: var(--primary);">▼</span>
                <button type="button" 
                        onclick="event.stopPropagation(); removeGalleryImage(this)" 
                        class="btn btn-sm btn-danger" style="padding: 4px 8px;">
                    <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>
                </button>
            </div>
        </div>
        <div class="gallery-image-content" style="padding: 0 20px 20px; display: block;">
        
        <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 13px; font-weight: 600;">URL Immagine *</label>
            <input type="url" 
                   class="gallery-image-url" 
                   id="galleryImage${index}"
                   placeholder="https://esempio.com/immagine.jpg" 
                   value="" 
                   style="width: 100%;"
                   oninput="updateGalleryPreview(); initGalleryImageCropperByElement(this)">
        </div>
        
        <div class="form-group">
            <div id="galleryCropper${index}"></div>
        </div>
        
        <input type="hidden" class="gallery-crop-data" value='{}'>
        
        <div class="form-group">
            <label style="font-size: 13px; font-weight: 600;">Didascalia</label>
            <input type="text" 
                   class="gallery-image-caption" 
                   placeholder="Praga: la magia del Natale" 
                   value="" 
                   style="width: 100%;"
                   oninput="updateGalleryPreview()">
        </div>
        
        <div class="form-group">
            <label style="font-size: 13px; font-weight: 600;">Didascalia</label>
            <input type="text" 
                   class="gallery-image-caption" 
                   placeholder="Praga: la magia del Natale" 
                   value="" 
                   style="width: 100%;"
                   oninput="updateGalleryPreview()">
            <small>Questa didascalia apparirà sotto l'immagine</small>
        </div>
        </div>
    `;
    
    container.appendChild(newImage);
    updateGalleryPreview();
}

// Rimuovi immagine gallery
function removeGalleryImage(button) {
    const field = button.closest('.gallery-image-field');
    
    // Trova l'indice e distruggi il cropper se esiste
    const imageInput = field.querySelector('.gallery-image-url');
    if (imageInput && imageInput.id) {
        const index = imageInput.id.replace('galleryImage', '');
        if (window.galleryCroppers && window.galleryCroppers[index]) {
            console.log('Distruggo gallery cropper index:', index);
            window.galleryCroppers[index].destroy();
            delete window.galleryCroppers[index];
        }
    }
    
    field.remove();
    updateGalleryPreview();
    
    // Se non ci sono più immagini, mostra il messaggio
    const container = document.getElementById('galleryImagesList');
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; font-size: 14px; padding: 20px; text-align: center; background: rgba(148, 163, 184, 0.1); border-radius: 8px;">Nessuna immagine. Clicca "Aggiungi Immagine"</p>';
    }
}

// Raccogli dati delle immagini gallery
function collectGalleryImagesData() {
    const fields = document.querySelectorAll('.gallery-image-field');
    const images = [];
    
    fields.forEach((field) => {
        const url = field.querySelector('.gallery-image-url')?.value.trim();
        const caption = field.querySelector('.gallery-image-caption')?.value.trim();
        const cropDataInput = field.querySelector('.gallery-crop-data');
        
        let cropData = {};
        try {
            cropData = cropDataInput ? JSON.parse(cropDataInput.value) : {};
        } catch (e) {}
        
        if (url) {
            images.push({
                url,
                caption: caption || '',
                cropData
            });
        }
    });
    
    return images;
}

// Inizializza cropper per immagine gallery usando l'elemento input
function initGalleryImageCropperByElement(inputElement) {
    if (!inputElement) return;
    
    const index = inputElement.id.replace('galleryImage', '');
    const cropperContainer = document.getElementById(`galleryCropper${index}`);
    
    console.log('initGalleryImageCropperByElement per index:', index);
    console.log('inputElement:', inputElement);
    console.log('cropperContainer:', cropperContainer);
    
    if (!inputElement || !cropperContainer) {
        console.warn('Elementi non trovati per gallery image index:', index);
        return;
    }
    
    const imageUrl = inputElement.value.trim();
    console.log('Gallery imageUrl:', imageUrl);
    
    if (!imageUrl || !(imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        cropperContainer.innerHTML = '';
        return;
    }
    
    // Recupera crop data esistente se presente
    const cropDataInput = inputElement.closest('.gallery-image-content').querySelector('.gallery-crop-data');
    
    console.log('Gallery cropDataInput trovato:', cropDataInput);
    console.log('Gallery cropDataInput value:', cropDataInput?.value);
    
    let existingCropData = {};
    try {
        existingCropData = cropDataInput ? JSON.parse(cropDataInput.value) : {};
    } catch (e) {}
    
    console.log('Creazione gallery cropper per:', imageUrl);
    console.log('Existing crop data:', existingCropData);
    
    // Distruggi cropper esistente
    if (window.galleryCroppers && window.galleryCroppers[index]) {
        window.galleryCroppers[index].destroy();
        delete window.galleryCroppers[index];
    }
    
    // Inizializza array se non esiste
    if (!window.galleryCroppers) {
        window.galleryCroppers = {};
    }
    
    // Crea nuovo cropper con riferimento esplicito al cropDataInput
    setTimeout(() => {
        // Cattura il riferimento in una variabile locale per evitare problemi di closure
        const targetCropDataInput = cropDataInput;
        
        window.galleryCroppers[index] = new ImageCropper(`galleryCropper${index}`, {
            imageUrl: imageUrl,
            aspectRatio: 16/9,
            cropData: existingCropData,
            onChange: (cropData) => {
                console.log(`onChange chiamato per gallery cropper ${index}`, cropData);
                console.log('targetCropDataInput:', targetCropDataInput);
                
                // Aggiorna hidden input con crop data
                if (targetCropDataInput) {
                    console.log('Aggiornamento cropData per gallery image index', index);
                    targetCropDataInput.value = JSON.stringify(cropData);
                    console.log('Nuovo valore:', targetCropDataInput.value);
                } else {
                    console.error('cropDataInput non trovato per gallery image index', index);
                }
            }
        });
        console.log('Gallery cropper creato per index:', index);
    }, 200);
}

// ============================
// CAROUSEL FUNCTIONS
// ============================

// Genera campi per le card del carousel
function generateCarouselCardsFields(cards = []) {
    if (cards.length === 0) {
        return '<p style="color: #94a3b8; font-size: 14px; padding: 20px; text-align: center; background: rgba(148, 163, 184, 0.1); border-radius: 8px;">Nessuna card. Clicca "Aggiungi Card"</p>';
    }
    
    return cards.map((card, index) => `
        <div class="carousel-card-field" draggable="true" style="background: var(--bg-gradient-light); border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(99, 102, 241, 0.2); cursor: move;">
            <div class="carousel-card-header" onclick="toggleCarouselCard(this)" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; user-select: none;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="drag-handle" style="cursor: grab; color: var(--text-light);">⠿</span>
                    <strong style="color: var(--primary); font-size: 14px;">🎴 Card ${index + 1}</strong>
                    <span class="carousel-card-preview" style="color: var(--text-light); font-size: 12px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${card.title || 'Senza titolo'}...</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="toggle-icon" style="transition: transform 0.3s; color: var(--primary);">▼</span>
                    <button type="button" 
                            onclick="event.stopPropagation(); removeCarouselCard(this)" 
                            class="btn btn-sm btn-danger" style="padding: 4px 8px;">
                        <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>
                    </button>
                </div>
            </div>
            <div class="carousel-card-content" style="padding: 0 20px 20px; display: block;">
            
            <div class="form-group" style="margin-bottom: 12px;">
                <label style="font-size: 13px; font-weight: 600;">URL Immagine *</label>
                <input type="url" 
                       class="carousel-card-image" 
                       id="carouselCardImage${index}"
                       placeholder="https://esempio.com/immagine.jpg" 
                       value="${card.image || ''}" 
                       style="width: 100%;"
                       oninput="updateBlockPreview(); initCarouselCardCropperByElement(this)">
            </div>
            
            <div class="form-group">
                <div id="carouselCropper${index}"></div>
            </div>
            
            <input type="hidden" class="carousel-crop-data" value='${JSON.stringify(card.cropData || {})}'>
            
            <div class="form-group">
                <label style="font-size: 13px; font-weight: 600;">Titolo *</label>
                <input type="text" 
                       class="carousel-card-title" 
                       placeholder="Titolo della storia" 
                       value="${card.title || ''}" 
                       style="width: 100%;"
                       oninput="updateBlockPreview()">
            </div>
            
            <div class="form-group">
                <label style="font-size: 13px; font-weight: 600;">Descrizione</label>
                <textarea class="carousel-card-description" 
                          rows="3"
                          placeholder="Breve descrizione della storia..." 
                          style="width: 100%;"
                          oninput="updateBlockPreview()">${card.description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label style="font-size: 13px; font-weight: 600;">Categoria</label>
                <input type="text" 
                       class="carousel-card-category" 
                       placeholder="Es: Arte e Cultura" 
                       value="${card.category || ''}" 
                       style="width: 100%;"
                       oninput="updateBlockPreview()">
            </div>
            
            <div class="form-group">
                <label style="font-size: 13px; font-weight: 600;">Link *</label>
                <input type="url" 
                       class="carousel-card-link" 
                       placeholder="https://..." 
                       value="${card.link || ''}" 
                       style="width: 100%;"
                       oninput="updateBlockPreview()">
                <small>Link all'articolo o storia completa</small>
            </div>
            </div>
        </div>
    `).join('');
}

// Toggle espansione card carousel
function toggleCarouselCard(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
    }
}

// Aggiungi card carousel
function addCarouselCard() {
    const container = document.getElementById('carouselCardsList');
    const currentContent = container.innerHTML;
    
    // Rimuovi messaggio "Nessuna card" se presente
    if (currentContent.includes('Nessuna card')) {
        container.innerHTML = '';
    }
    
    const index = container.children.length;
    const newCard = document.createElement('div');
    newCard.className = 'carousel-card-field';
    newCard.draggable = true;
    newCard.style.cssText = 'background: var(--bg-gradient-light); border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(99, 102, 241, 0.2); cursor: move;';
    
    newCard.innerHTML = `
        <div class="carousel-card-header" onclick="toggleCarouselCard(this)" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; user-select: none;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="drag-handle" style="cursor: grab; color: var(--text-light);">⠿</span>
                <strong style="color: var(--primary); font-size: 14px;">🎴 Card ${index + 1}</strong>
                <span class="carousel-card-preview" style="color: var(--text-light); font-size: 12px;">Nuova card...</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="toggle-icon" style="transition: transform 0.3s; color: var(--primary);">▼</span>
                <button type="button" 
                        onclick="event.stopPropagation(); removeCarouselCard(this)" 
                        class="btn btn-sm btn-danger" style="padding: 4px 8px;">
                    <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>
                </button>
            </div>
        </div>
        <div class="carousel-card-content" style="padding: 0 20px 20px; display: block;">
        
        <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 13px; font-weight: 600;">URL Immagine *</label>
            <input type="url" 
                   class="carousel-card-image" 
                   id="carouselCardImage${index}"
                   placeholder="https://esempio.com/immagine.jpg" 
                   value="" 
                   style="width: 100%;"
                   oninput="updateBlockPreview(); initCarouselCardCropperByElement(this)">
        </div>
        
        <div class="form-group">
            <div id="carouselCropper${index}"></div>
        </div>
        
        <input type="hidden" class="carousel-crop-data" value='{}'>
        
        <div class="form-group">
            <label style="font-size: 13px; font-weight: 600;">Titolo *</label>
            <input type="text" 
                   class="carousel-card-title" 
                   placeholder="Titolo della storia" 
                   value="" 
                   style="width: 100%;"
                   oninput="updateBlockPreview()">
        </div>
        
        <div class="form-group">
            <label style="font-size: 13px; font-weight: 600;">Descrizione</label>
            <textarea class="carousel-card-description" 
                      rows="3"
                      placeholder="Breve descrizione della storia..." 
                      style="width: 100%;"
                      oninput="updateBlockPreview()"></textarea>
        </div>
        
        <div class="form-group">
            <label style="font-size: 13px; font-weight: 600;">Categoria</label>
            <input type="text" 
                   class="carousel-card-category" 
                   placeholder="Es: Arte e Cultura" 
                   value="" 
                   style="width: 100%;"
                   oninput="updateBlockPreview()">
        </div>
        
        <div class="form-group">
            <label style="font-size: 13px; font-weight: 600;">Link *</label>
            <input type="url" 
                   class="carousel-card-link" 
                   placeholder="https://..." 
                   value="" 
                   style="width: 100%;"
                   oninput="updateBlockPreview()">
            <small>Link all'articolo o storia completa</small>
        </div>
        </div>
    `;
    
    container.appendChild(newCard);
    updateBlockPreview();
}

// Rimuovi card carousel
function removeCarouselCard(button) {
    const field = button.closest('.carousel-card-field');
    
    // Trova l'indice e distruggi il cropper se esiste
    const imageInput = field.querySelector('.carousel-card-image');
    if (imageInput && imageInput.id) {
        const index = imageInput.id.replace('carouselCardImage', '');
        if (window.carouselCroppers && window.carouselCroppers[index]) {
            console.log('Distruggo carousel cropper index:', index);
            window.carouselCroppers[index].destroy();
            delete window.carouselCroppers[index];
        }
    }
    
    field.remove();
    updateBlockPreview();
    
    // Se non ci sono più card, mostra il messaggio
    const container = document.getElementById('carouselCardsList');
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; font-size: 14px; padding: 20px; text-align: center; background: rgba(148, 163, 184, 0.1); border-radius: 8px;">Nessuna card. Clicca "Aggiungi Card"</p>';
    }
}

// Raccogli dati delle card carousel
function collectCarouselCardsData() {
    const fields = document.querySelectorAll('.carousel-card-field');
    const cards = [];
    
    fields.forEach((field) => {
        const image = field.querySelector('.carousel-card-image')?.value.trim();
        const title = field.querySelector('.carousel-card-title')?.value.trim();
        const description = field.querySelector('.carousel-card-description')?.value.trim();
        const category = field.querySelector('.carousel-card-category')?.value.trim();
        const link = field.querySelector('.carousel-card-link')?.value.trim();
        const cropDataInput = field.querySelector('.carousel-crop-data');
        
        let cropData = {};
        try {
            cropData = cropDataInput ? JSON.parse(cropDataInput.value) : {};
        } catch (e) {}
        
        if (image && title && link) {
            cards.push({
                image,
                title,
                description: description || '',
                category: category || '',
                link,
                cropData
            });
        }
    });
    
    return cards;
}

// Inizializza cropper per card carousel usando l'elemento input
function initCarouselCardCropperByElement(inputElement) {
    if (!inputElement) return;
    
    const imageUrl = inputElement.value.trim();
    if (!imageUrl) return;
    
    // Trova l'indice dal campo
    const index = inputElement.id ? inputElement.id.replace('carouselCardImage', '') : '';
    if (!index) {
        console.error('Impossibile determinare index per carousel card cropper');
        return;
    }
    
    console.log('initCarouselCardCropperByElement per index:', index);
    
    // Trova il container del cropper e il campo hidden per crop data
    const cropperContainer = document.getElementById(`carouselCropper${index}`);
    const cardField = inputElement.closest('.carousel-card-field');
    const cropDataInput = cardField ? cardField.querySelector('.carousel-crop-data') : null;
    
    if (!cropperContainer || !cropDataInput) {
        console.error('Container cropper o cropDataInput non trovato per carousel card index:', index);
        return;
    }
    
    // Leggi crop data esistente
    let existingCropData = {};
    try {
        existingCropData = cropDataInput ? JSON.parse(cropDataInput.value) : {};
    } catch (e) {}
    
    console.log('Creazione carousel cropper per:', imageUrl);
    console.log('Existing crop data:', existingCropData);
    
    // Distruggi cropper esistente
    if (window.carouselCroppers && window.carouselCroppers[index]) {
        window.carouselCroppers[index].destroy();
        delete window.carouselCroppers[index];
    }
    
    // Inizializza array se non esiste
    if (!window.carouselCroppers) {
        window.carouselCroppers = {};
    }
    
    // Crea nuovo cropper con aspect ratio 2:3 (stile portrait per carousel)
    setTimeout(() => {
        const targetCropDataInput = cropDataInput;
        
        window.carouselCroppers[index] = new ImageCropper(`carouselCropper${index}`, {
            imageUrl: imageUrl,
            aspectRatio: 2/3,
            cropData: existingCropData,
            onChange: (cropData) => {
                console.log(`onChange chiamato per carousel cropper ${index}`, cropData);
                
                if (targetCropDataInput) {
                    console.log('Aggiornamento cropData per carousel card index', index);
                    targetCropDataInput.value = JSON.stringify(cropData);
                    console.log('Nuovo valore:', targetCropDataInput.value);
                } else {
                    console.error('cropDataInput non trovato per carousel card index', index);
                }
            }
        });
        console.log('Carousel cropper creato per index:', index);
    }, 200);
}

