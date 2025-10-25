// pages.js - Gestione Editor Pagine Figlie
let currentPage = null;
let currentBlocks = [];

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('page');
    
    if (!pageId) {
        alert('ID pagina mancante');
        window.location.href = 'magazines.html';
        return;
    }
    
    await loadPage(pageId);
});

async function loadPage(pageId) {
    try {
        const response = await apiRequest(`/admin/child-pages/${pageId}`);
        currentPage = response.data;
        updatePageHeader();
        currentBlocks = currentPage.blocks || [];
        displayBlocks();
    } catch (error) {
        console.error('Errore caricamento pagina:', error);
        alert('Errore nel caricamento della pagina');
        window.location.href = 'magazines.html';
    }
}

function updatePageHeader() {
    document.getElementById('pageName').textContent = currentPage.name;
    document.getElementById('pageInfo').textContent = currentPage.name;
    
    if (currentPage.parentMagazine) {
        const magazineInfo = currentPage.parentMagazine.name 
            ? currentPage.parentMagazine.name + ' - ' + currentPage.parentMagazine.edition
            : 'Rivista';
        document.getElementById('magazineInfo').textContent = magazineInfo;
    }
}

function goBackToMagazine() {
    window.location.href = 'magazines.html';
}

function openEditPageModal() {
    alert('Modal impostazioni - Da implementare');
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
    if (!currentPage) return;
    if (!confirm('Vuoi pubblicare questa pagina?')) return;
    
    try {
        await apiRequest('/admin/child-pages/' + currentPage._id, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'published',
                publishDate: new Date().toISOString()
            })
        });
        alert('Pagina pubblicata!');
        await loadPage(currentPage._id);
    } catch (error) {
        alert('Errore: ' + error.message);
    }
}

function getPagePublicUrl() {
    if (!currentPage || !currentPage.parentMagazine) return '#';
    const magazineSlug = currentPage.parentMagazine.slug;
    const pageSlug = currentPage.slug;
    return window.location.origin + '/' + magazineSlug + '/' + pageSlug;
}

function displayBlocks() {
    const container = document.getElementById('blocksList');
    const emptyState = document.getElementById('emptyState');
    
    if (!currentBlocks || currentBlocks.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = currentBlocks.map((block, index) => {
        const blockTypeName = getBlockTypeName(block.type);
        const blockIcon = getBlockIcon(block.type);
        
        return '<div class="block-item" data-block-id="' + block._id + '">' +
            '<div class="block-content">' +
            '<div class="block-header">' +
            '<div class="block-info">' +
            '<span class="block-icon">' + blockIcon + '</span>' +
            '<div><h4>' + (block.title || blockTypeName) + '</h4></div>' +
            '</div></div></div></div>';
    }).join('');
}

function getBlockTypeName(type) {
    const names = {
        'cover': 'Copertina',
        'hero': 'Hero',
        'article': 'Articolo',
        'gallery': 'Gallery',
        'text': 'Testo',
        'quote': 'Citazione',
        'video': 'Video',
        'fluid': 'Parallasse',
        'carousel': 'Carousel'
    };
    return names[type] || type;
}

function getBlockIcon(type) {
    const icons = {
        'cover': '🎨',
        'hero': '🌟',
        'article': '📰',
        'gallery': '🖼️',
        'text': '📝',
        'quote': '💬',
        'video': '🎥',
        'fluid': '🌊',
        'carousel': '🎠'
    };
    return icons[type] || '📦';
}

function showBlockTypesModal() {
    alert('Da implementare');
}
