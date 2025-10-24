// adv.js - Gestione ADV

let advs = [];
let currentAdv = null;

// Inizializza pagina
document.addEventListener('DOMContentLoaded', () => {
    initSidebar('adv');
    loadAdvs();
    loadMagazinesForFilter();
});

// Carica tutti gli ADV
async function loadAdvs() {
    const container = document.getElementById('advContainer');
    
    try {
        // TODO: sostituire con chiamata API reale
        // const response = await apiRequest('/admin/advs');
        // advs = response.data;
        
        // Dati di esempio per ora
        advs = [
            {
                _id: '1',
                clientName: 'Beachcomber Hotels',
                headline: 'Scopri la magia del Natale al Beachcomber',
                subtitle: 'Approfitta del 40% di sconto su soggiorni dal 20 al 26 dicembre',
                ctaText: 'SCOPRI DI PIÙ',
                ctaUrl: 'https://beachcomber.com',
                heroImage: 'https://via.placeholder.com/1920x1080',
                status: 'active',
                startDate: '2025-12-01',
                endDate: '2025-12-26',
                clicks: 145,
                views: 2340
            },
            {
                _id: '2',
                clientName: 'Mont Choisy Le Golf',
                headline: 'Esperienza golfistica esclusiva al Mont Choisy Le Golf',
                subtitle: "Mont Choisy Le Golf, l'unico campo 18 buche nel nord di Mauritius",
                ctaText: 'SCOPRI DI PIÙ',
                ctaUrl: 'https://montchoisy.com',
                heroImage: 'https://via.placeholder.com/1920x1080',
                status: 'scheduled',
                startDate: '2025-11-01',
                endDate: '2025-11-30',
                clicks: 0,
                views: 0
            }
        ];
        
        renderAdvs(advs);
        
    } catch (error) {
        console.error('Errore caricamento ADV:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Errore nel caricamento</h3>
                <p>Impossibile caricare gli annunci pubblicitari.</p>
            </div>
        `;
    }
}

// Renderizza lista ADV
function renderAdvs(data) {
    const container = document.getElementById('advContainer');
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">📢</div>
                <h3>Nessun annuncio pubblicitario</h3>
                <p>Inizia creando il primo ADV!</p>
                <button class="btn btn-primary" onclick="showCreateAdvModal()">
                    ➕ Crea Primo ADV
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = data.map(adv => {
        const statusBadge = getStatusBadge(adv.status);
        const ctr = adv.views > 0 ? ((adv.clicks / adv.views) * 100).toFixed(2) : '0.00';
        
        return `
            <div class="adv-card" data-id="${adv._id}">
                <div class="adv-card-image" style="background-image: url('${adv.heroImage}');">
                    <div class="adv-card-overlay">
                        <span class="adv-status-badge ${statusBadge.class}">${statusBadge.label}</span>
                    </div>
                </div>
                
                <div class="adv-card-content">
                    <div class="adv-card-header">
                        <h3 class="adv-card-title">${adv.headline}</h3>
                        <p class="adv-card-client">${adv.clientName}</p>
                    </div>
                    
                    <p class="adv-card-subtitle">${adv.subtitle || ''}</p>
                    
                    <div class="adv-card-stats">
                        <div class="adv-stat">
                            <span class="adv-stat-label">Visualizzazioni</span>
                            <span class="adv-stat-value">${adv.views.toLocaleString()}</span>
                        </div>
                        <div class="adv-stat">
                            <span class="adv-stat-label">Click</span>
                            <span class="adv-stat-value">${adv.clicks.toLocaleString()}</span>
                        </div>
                        <div class="adv-stat">
                            <span class="adv-stat-label">CTR</span>
                            <span class="adv-stat-value">${ctr}%</span>
                        </div>
                    </div>
                    
                    <div class="adv-card-dates">
                        <small>
                            <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                            ${formatDate(adv.startDate)} → ${formatDate(adv.endDate)}
                        </small>
                    </div>
                    
                    <div class="adv-card-actions">
                        <button class="btn btn-sm btn-outline" onclick="viewAdvStats('${adv._id}')" title="Statistiche">
                            <i data-lucide="bar-chart"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="previewAdvById('${adv._id}')" title="Anteprima">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="editAdv('${adv._id}')" title="Modifica">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAdv('${adv._id}')" title="Elimina">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Re-init lucide icons
    lucide.createIcons();
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'active': { label: 'Attivo', class: 'status-published' },
        'scheduled': { label: 'Programmato', class: 'status-draft' },
        'expired': { label: 'Scaduto', class: 'status-archived' },
        'draft': { label: 'Bozza', class: 'status-draft' }
    };
    return badges[status] || { label: status, class: '' };
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Filtra ADV
function filterAdvs() {
    const statusFilter = document.getElementById('statusFilter').value;
    const clientFilter = document.getElementById('clientFilter').value;
    const searchTerm = document.getElementById('searchAdv').value.toLowerCase();
    
    let filtered = advs;
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(adv => adv.status === statusFilter);
    }
    
    if (clientFilter !== 'all') {
        filtered = filtered.filter(adv => adv.clientName === clientFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(adv => 
            adv.headline.toLowerCase().includes(searchTerm) ||
            adv.clientName.toLowerCase().includes(searchTerm)
        );
    }
    
    renderAdvs(filtered);
}

// Carica riviste per filtro target
async function loadMagazinesForFilter() {
    try {
        const response = await apiRequest('/admin/magazines');
        const magazines = response.data;
        
        const select = document.getElementById('advTargetMagazines');
        select.innerHTML = magazines.map(mag => 
            `<option value="${mag._id}">${mag.name} - ${mag.edition}</option>`
        ).join('');
        
        // Popola anche filtro clienti
        const clients = [...new Set(advs.map(adv => adv.clientName))];
        const clientSelect = document.getElementById('clientFilter');
        clientSelect.innerHTML = '<option value="all">Tutti i clienti</option>' + 
            clients.map(client => `<option value="${client}">${client}</option>`).join('');
            
    } catch (error) {
        console.error('Errore caricamento riviste:', error);
    }
}

// Mostra modal creazione
function showCreateAdvModal() {
    currentAdv = null;
    document.getElementById('advModalTitle').innerHTML = '<i data-lucide="megaphone"></i> Nuovo Annuncio Pubblicitario';
    document.getElementById('advForm').reset();
    document.getElementById('advId').value = '';
    document.getElementById('advModal').classList.add('active');
    lucide.createIcons();
}

// Chiudi modal
function closeAdvModal() {
    document.getElementById('advModal').classList.remove('active');
}

// Toggle media input
function toggleMediaInput() {
    const mediaType = document.getElementById('advMediaType').value;
    
    document.getElementById('mediaImageSection').style.display = mediaType === 'image' ? 'block' : 'none';
    document.getElementById('mediaGallerySection').style.display = mediaType === 'gallery' ? 'block' : 'none';
    document.getElementById('mediaVideoSection').style.display = mediaType === 'video' ? 'block' : 'none';
}

// Salva ADV
async function saveAdv() {
    const formData = {
        clientName: document.getElementById('advClientName').value,
        headline: document.getElementById('advHeadline').value,
        subtitle: document.getElementById('advSubtitle').value,
        ctaText: document.getElementById('advCtaText').value,
        ctaUrl: document.getElementById('advCtaUrl').value,
        mediaType: document.getElementById('advMediaType').value,
        textPosition: document.getElementById('advTextPosition').value,
        textColor: document.getElementById('advTextColor').value,
        ctaColor: document.getElementById('advCtaColor').value,
        ctaTextColor: document.getElementById('advCtaTextColor').value,
        startDate: document.getElementById('advStartDate').value,
        endDate: document.getElementById('advEndDate').value,
        showCountdown: document.getElementById('advShowCountdown').checked,
        disclaimer: document.getElementById('advDisclaimer').value,
        notes: document.getElementById('advNotes').value,
        utmSource: document.getElementById('advUtmSource').value,
        utmMedium: document.getElementById('advUtmMedium').value,
        utmCampaign: document.getElementById('advUtmCampaign').value,
        status: 'active'
    };
    
    // Validazione
    if (!formData.clientName || !formData.headline || !formData.ctaText || !formData.ctaUrl) {
        alert('Compila tutti i campi obbligatori');
        return;
    }
    
    try {
        // TODO: Upload immagini e salvataggio
        console.log('Salvataggio ADV:', formData);
        alert('ADV salvato con successo!');
        closeAdvModal();
        loadAdvs();
    } catch (error) {
        console.error('Errore salvataggio ADV:', error);
        alert('Errore nel salvataggio dell\'ADV');
    }
}

// Salva bozza
async function saveAdvDraft() {
    // Simile a saveAdv ma con status = 'draft'
    alert('Bozza salvata!');
}

// Anteprima ADV
function previewAdv() {
    const headline = document.getElementById('advHeadline').value;
    const subtitle = document.getElementById('advSubtitle').value;
    const ctaText = document.getElementById('advCtaText').value;
    const textColor = document.getElementById('advTextColor').value;
    const ctaColor = document.getElementById('advCtaColor').value;
    const ctaTextColor = document.getElementById('advCtaTextColor').value;
    const textPosition = document.getElementById('advTextPosition').value;
    
    const [vertical, horizontal] = textPosition.split('-');
    
    const alignItems = vertical === 'top' ? 'flex-start' : vertical === 'bottom' ? 'flex-end' : 'center';
    const justifyContent = horizontal === 'left' ? 'flex-start' : horizontal === 'right' ? 'flex-end' : 'center';
    
    const previewHTML = `
        <div style="
            position: relative;
            width: 100%;
            height: 600px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: ${alignItems};
            justify-content: ${justifyContent};
            padding: 60px;
            color: ${textColor};
            text-align: ${horizontal};
        ">
            <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.3);"></div>
            <div style="position: relative; z-index: 1; max-width: 800px;">
                <h1 style="font-size: 48px; font-weight: 700; margin-bottom: 24px; line-height: 1.2;">
                    ${headline || 'Il tuo titolo qui'}
                </h1>
                <p style="font-size: 20px; margin-bottom: 32px; line-height: 1.6;">
                    ${subtitle || 'Il tuo sottotitolo qui'}
                </p>
                <button style="
                    background: ${ctaColor};
                    color: ${ctaTextColor};
                    padding: 16px 40px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">
                    ${ctaText || 'SCOPRI DI PIÙ'}
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('previewContainer').innerHTML = previewHTML;
    document.getElementById('previewModal').classList.add('active');
}

// Chiudi modal anteprima
function closePreviewModal() {
    document.getElementById('previewModal').classList.remove('active');
}

// Anteprima ADV esistente
function previewAdvById(id) {
    const adv = advs.find(a => a._id === id);
    if (!adv) return;
    
    const previewHTML = `
        <div style="
            position: relative;
            width: 100%;
            height: 600px;
            background-image: url('${adv.heroImage}');
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px;
            color: white;
            text-align: center;
        ">
            <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.4);"></div>
            <div style="position: relative; z-index: 1; max-width: 800px;">
                <h1 style="font-size: 48px; font-weight: 700; margin-bottom: 24px;">
                    ${adv.headline}
                </h1>
                <p style="font-size: 20px; margin-bottom: 32px;">
                    ${adv.subtitle}
                </p>
                <button style="
                    background: white;
                    color: black;
                    padding: 16px 40px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    text-transform: uppercase;
                ">
                    ${adv.ctaText}
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('previewContainer').innerHTML = previewHTML;
    document.getElementById('previewModal').classList.add('active');
}

// Modifica ADV
function editAdv(id) {
    const adv = advs.find(a => a._id === id);
    if (!adv) return;
    
    currentAdv = adv;
    document.getElementById('advModalTitle').innerHTML = '<i data-lucide="edit"></i> Modifica Annuncio';
    document.getElementById('advId').value = adv._id;
    document.getElementById('advClientName').value = adv.clientName;
    document.getElementById('advHeadline').value = adv.headline;
    document.getElementById('advSubtitle').value = adv.subtitle || '';
    document.getElementById('advCtaText').value = adv.ctaText;
    document.getElementById('advCtaUrl').value = adv.ctaUrl;
    
    document.getElementById('advModal').classList.add('active');
    lucide.createIcons();
}

// Elimina ADV
async function deleteAdv(id) {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return;
    
    try {
        // TODO: chiamata API
        console.log('Elimina ADV:', id);
        alert('ADV eliminato con successo!');
        loadAdvs();
    } catch (error) {
        console.error('Errore eliminazione ADV:', error);
        alert('Errore nell\'eliminazione dell\'ADV');
    }
}

// Visualizza statistiche
function viewAdvStats(id) {
    const adv = advs.find(a => a._id === id);
    if (!adv) return;
    
    alert(`Statistiche ${adv.clientName}\n\nVisualizzazioni: ${adv.views}\nClick: ${adv.clicks}\nCTR: ${((adv.clicks/adv.views)*100).toFixed(2)}%`);
}

// Chiudi modal con click fuori
document.getElementById('advModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'advModal') closeAdvModal();
});

document.getElementById('previewModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'previewModal') closePreviewModal();
});
