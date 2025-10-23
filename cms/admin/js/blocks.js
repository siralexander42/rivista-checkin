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
    
    blocksList.innerHTML = blocks.map((block, index) => `
        <div class="block-item" draggable="true" data-block-id="${block._id}" data-position="${index}">
            <div class="block-header">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <svg class="drag-handle" title="Trascina per riordinare" style="width: 20px; height: 20px; color: var(--text-light); cursor: grab;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 0 7.5 L 0 12.5 L 50 12.5 L 50 7.5 Z M 0 22.5 L 0 27.5 L 50 27.5 L 50 22.5 Z M 0 37.5 L 0 42.5 L 50 42.5 L 50 37.5 Z"/></svg>
                    <div>
                        <div class="block-type-badge">
                            ${getBlockIcon(block.type)}
                            ${getBlockTypeName(block.type)}
                        </div>
                        ${!block.visible ? '<span class="badge" style="margin-left: 8px; background: #fef3c7; color: #92400e;"><svg style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 4.9375 3.96875 L 3.96875 4.9375 L 10.21875 11.1875 C 7.753906 13.691406 5.882813 16.679688 4.625 19.40625 C 4.429688 19.839844 4.425781 20.335938 4.613281 20.769531 C 7.929688 28.683594 15.757813 34 25 34 C 28.347656 34 31.515625 33.234375 34.34375 31.90625 L 45.0625 42.625 L 46.03125 41.65625 Z M 25 7 C 21.652344 7 18.484375 7.765625 15.65625 9.09375 L 18.28125 11.71875 C 20.394531 10.617188 22.851563 10 25 10 C 33.527344 10 40.664063 15.773438 43.375 23.8125 C 42.699219 25.621094 41.800781 27.308594 40.75 28.875 L 43.0625 31.1875 C 44.535156 29.160156 45.734375 26.945313 46.59375 24.59375 C 46.789063 24.160156 46.792969 23.664063 46.605469 23.230469 C 43.289063 15.316406 35.460938 10 25 10 C 24.996094 10 25.003906 10 25 10 Z M 25 15 C 23.203125 15 21.585938 15.605469 20.3125 16.59375 L 23.40625 19.6875 C 23.910156 19.265625 24.523438 19 25.1875 19 C 26.746094 19 28 20.253906 28 21.8125 C 28 22.476563 27.734375 23.089844 27.3125 23.59375 L 30.40625 26.6875 C 31.394531 25.414063 32 23.796875 32 22 C 32 18.136719 28.863281 15 25 15 Z M 12.5 17.15625 C 11.027344 19.183594 9.828125 21.398438 8.96875 23.75 C 8.773438 24.183594 8.769531 24.679688 8.957031 25.113281 C 12.273438 33.027344 20.101563 38.34375 30.34375 38.34375 C 32.898438 38.34375 35.328125 37.878906 37.5625 37.0625 L 34.75 34.25 C 31.921875 35.566406 28.753906 36.34375 25.40625 36.34375 C 16.878906 36.34375 9.742188 30.570313 7.03125 22.53125 C 7.707031 20.722656 8.605469 19.035156 9.65625 17.46875 Z M 25 24 C 25.203125 24 25.402344 24.019531 25.59375 24.0625 L 20.0625 18.53125 C 20.019531 18.722656 20 18.921875 20 19.125 C 20 21.886719 22.238281 24.125 25 24.125 Z"/></svg> Nascosto</span>' : ''}
                    </div>
                </div>
                <div class="block-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editBlock('${block._id}')">
                        <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 43.125 2 C 41.878906 2 40.636719 2.488281 39.6875 3.4375 L 38.875 4.25 L 45.75 11.125 C 45.746094 11.128906 46.5625 10.3125 46.5625 10.3125 C 48.464844 8.410156 48.460938 5.335938 46.5625 3.4375 C 45.609375 2.484375 44.371094 2 43.125 2 Z M 37.34375 6.03125 C 37.117188 6.0625 36.90625 6.175781 36.75 6.34375 L 4.3125 38.8125 C 4.183594 38.929688 4.085938 39.082031 4.03125 39.25 L 2.03125 46.75 C 1.941406 47.09375 2.042969 47.457031 2.292969 47.707031 C 2.542969 47.957031 2.90625 48.058594 3.25 47.96875 L 10.75 45.96875 C 10.917969 45.914063 11.070313 45.816406 11.1875 45.6875 L 43.65625 13.25 C 44.054688 12.863281 44.058594 12.226563 43.671875 11.828125 C 43.285156 11.429688 42.648438 11.425781 42.25 11.8125 L 9.96875 44.09375 L 5.90625 40.03125 L 38.1875 7.75 C 38.488281 7.460938 38.578125 7.011719 38.410156 6.628906 C 38.242188 6.246094 37.855469 6.007813 37.4375 6.03125 C 37.40625 6.03125 37.375 6.03125 37.34375 6.03125 Z"/></svg> Modifica
                    </button>
                    <button class="btn btn-sm ${block.visible ? 'btn-secondary' : 'btn-success'}" onclick="toggleBlockVisibility('${block._id}')">
                        ${block.visible ? '<svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 4.9375 3.96875 L 3.96875 4.9375 L 10.21875 11.1875 C 7.753906 13.691406 5.882813 16.679688 4.625 19.40625 C 4.429688 19.839844 4.425781 20.335938 4.613281 20.769531 C 7.929688 28.683594 15.757813 34 25 34 C 28.347656 34 31.515625 33.234375 34.34375 31.90625 L 45.0625 42.625 L 46.03125 41.65625 Z M 25 7 C 21.652344 7 18.484375 7.765625 15.65625 9.09375 L 18.28125 11.71875 C 20.394531 10.617188 22.851563 10 25 10 C 33.527344 10 40.664063 15.773438 43.375 23.8125 C 42.699219 25.621094 41.800781 27.308594 40.75 28.875 L 43.0625 31.1875 C 44.535156 29.160156 45.734375 26.945313 46.59375 24.59375 C 46.789063 24.160156 46.792969 23.664063 46.605469 23.230469 C 43.289063 15.316406 35.460938 10 25 10 C 24.996094 10 25.003906 10 25 10 Z M 25 15 C 23.203125 15 21.585938 15.605469 20.3125 16.59375 L 23.40625 19.6875 C 23.910156 19.265625 24.523438 19 25.1875 19 C 26.746094 19 28 20.253906 28 21.8125 C 28 22.476563 27.734375 23.089844 27.3125 23.59375 L 30.40625 26.6875 C 31.394531 25.414063 32 23.796875 32 22 C 32 18.136719 28.863281 15 25 15 Z M 12.5 17.15625 C 11.027344 19.183594 9.828125 21.398438 8.96875 23.75 C 8.773438 24.183594 8.769531 24.679688 8.957031 25.113281 C 12.273438 33.027344 20.101563 38.34375 30.34375 38.34375 C 32.898438 38.34375 35.328125 37.878906 37.5625 37.0625 L 34.75 34.25 C 31.921875 35.566406 28.753906 36.34375 25.40625 36.34375 C 16.878906 36.34375 9.742188 30.570313 7.03125 22.53125 C 7.707031 20.722656 8.605469 19.035156 9.65625 17.46875 Z M 25 24 C 25.203125 24 25.402344 24.019531 25.59375 24.0625 L 20.0625 18.53125 C 20.019531 18.722656 20 18.921875 20 19.125 C 20 21.886719 22.238281 24.125 25 24.125 Z"/></svg>' : '<svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 50 50"><path d="M 25 7 C 14.757813 7 6.929688 15.316406 3.613281 23.230469 C 3.425781 23.664063 3.429688 24.160156 3.625 24.59375 C 6.941406 32.507813 14.769531 40.824219 25.011719 40.824219 C 35.253906 40.824219 43.082031 32.507813 46.398438 24.59375 C 46.59375 24.160156 46.597656 23.664063 46.410156 23.230469 C 43.09375 15.316406 35.265625 7 25 7 Z M 25 10 C 33.527344 10 40.664063 16.726563 43.375 23.8125 C 40.675781 30.886719 33.539063 37.613281 25.011719 37.613281 C 16.484375 37.613281 9.347656 30.886719 6.636719 23.8125 C 9.335938 16.726563 16.472656 10 25 10 Z M 25 15 C 21.136719 15 18 18.136719 18 22 C 18 25.863281 21.136719 29 25 29 C 28.863281 29 32 25.863281 32 22 C 32 18.136719 28.863281 15 25 15 Z M 25 19 C 26.746094 19 28 20.253906 28 22 C 28 23.746094 26.746094 25 25 25 C 23.253906 25 22 23.746094 22 22 C 22 20.253906 23.253906 19 25 19 Z"/></svg>'} ${block.visible ? 'Nascondi' : 'Mostra'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBlock('${block._id}')">
                        <svg style="width: 14px; height: 14px;" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg> Elimina
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
        gallery: 'Gallery',
        text: 'Testo',
        quote: 'Citazione',
        video: 'Video',
        fluid: 'Parallasse Block',
        custom: 'Personalizzato'
    };
    return names[type] || 'Sconosciuto';
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
                    <input type="url" id="previewImage" required value="${data.previewImage || ''}" placeholder="https://..." oninput="updateFluidPreview()">
                    <small>Questa sarà la prima immagine visualizzata quando si carica il blocco</small>
                </div>
                
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
            updateBlockPreview();
        }, 100);
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
    
    // Gallery: converti textarea in array
    if (type === 'gallery') {
        const imagesText = document.getElementById('images').value;
        blockData.images = imagesText.split('\n').filter(url => url.trim());
        delete blockData.image;
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
                       placeholder="https://esempio.com/immagine.jpg" 
                       value="${block.image || ''}" 
                       style="width: 100%;"
                       oninput="updateFluidPreview()">
                <small>Questa immagine verrà mostrata quando l'utente legge questo blocco</small>
            </div>
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
                   placeholder="https://esempio.com/immagine.jpg" 
                   style="width: 100%;"
                   oninput="updateFluidPreview()">
            <small>Questa immagine verrà mostrata quando l'utente legge questo blocco</small>
        </div>
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
        
        if (text.trim() && image.trim()) {
            fluidBlocks.push({ heading, text, highlight, image });
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
    
    // Ottieni modalità viewport (default desktop)
    const viewportMode = previewContainer.dataset.viewportMode || 'desktop';
    const isMobile = viewportMode === 'mobile';
    
    try {
        // Chiama il backend per generare l'HTML con i CSS reali
        const result = await apiRequest('/admin/blocks/preview', {
            method: 'POST',
            body: JSON.stringify({ type: blockType, data: blockData })
        });
        
        if (result.success && result.html) {
            previewContainer.innerHTML = `
                <div style="position: sticky; top: 20px;">
                    <div style="padding: 12px 20px; background: #333382; color: white; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0; font-size: 16px;">📱 Anteprima Live</h3>
                            <p style="margin: 0; font-size: 12px; opacity: 0.8;">${isMobile ? '📱 Mobile' : '🖥️ Desktop'}</p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" onclick="switchViewport('desktop')" style="padding: 6px 12px; border: none; background: ${!isMobile ? 'white' : 'rgba(255,255,255,0.2)'}; color: ${!isMobile ? '#333382' : 'white'}; border-radius: 6px; cursor: pointer; font-size: 12px;">Desktop</button>
                            <button type="button" onclick="switchViewport('mobile')" style="padding: 6px 12px; border: none; background: ${isMobile ? 'white' : 'rgba(255,255,255,0.2)'}; color: ${isMobile ? '#333382' : 'white'}; border-radius: 6px; cursor: pointer; font-size: 12px;">Mobile</button>
                        </div>
                    </div>
                    <div style="background: #f1f5f9; border-radius: 0 0 12px 12px; padding: 20px; text-align: center;">
                        <iframe 
                            style="width: 350px; height: 500px; border: none; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"
                            srcdoc="${escapeHtml(result.html)}"
                        ></iframe>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Errore anteprima:', error);
        previewContainer.innerHTML = `
            <div style="background: #fee; border-radius: 12px; padding: 20px; text-align: center; color: #c00;">
                <p>⚠️ Errore anteprima: ${error.message}</p>
            </div>
        `;
    }
}

// Switch viewport mode
function switchViewport(mode) {
    event?.preventDefault();
    event?.stopPropagation();
    
    const previewContainer = document.getElementById('blockPreview');
    if (previewContainer) {
        previewContainer.dataset.viewportMode = mode;
        updateBlockPreview();
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

// Anteprima rivista - Genera HTML e apre in nuova finestra
async function previewMagazine() {
    try {
        const response = await apiRequest(`/admin/magazines/${magazineId}/generate-html`, {
            method: 'POST'
        });
        
        if (response.success && response.previewUrl) {
            // Apri preview tramite URL persistente
            window.open(response.previewUrl, '_blank');
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
