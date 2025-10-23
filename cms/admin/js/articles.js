// Gestione articoli

let currentEditId = null;

// Carica lista articoli
async function loadArticles() {
    const container = document.getElementById('articlesContainer');
    const filterCategory = document.getElementById('filterCategory').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    try {
        container.innerHTML = '<p class="loading">Caricamento...</p>';
        
        let articles = await api.getArticles();
        
        // Applica filtri
        if (filterCategory) {
            articles = articles.filter(a => a.category === filterCategory);
        }
        if (filterStatus) {
            articles = articles.filter(a => a.status === filterStatus);
        }
        
        if (articles.length === 0) {
            container.innerHTML = '<p class="loading">Nessun articolo trovato</p>';
            return;
        }
        
        // Renderizza articoli
        container.innerHTML = articles.map(article => `
            <div class="article-item">
                <div class="article-info">
                    <h3>${article.title}</h3>
                    <p>
                        ${getCategoryIcon(article.category)} ${article.category} • 
                        ${article.status === 'published' ? '✅ Pubblicato' : '📋 Bozza'}
                        ${article.featured ? ' • ⭐ In evidenza' : ''}
                    </p>
                </div>
                <div class="article-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editArticle('${article._id}')">
                        ✏️ Modifica
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteArticle('${article._id}', '${article.title}')">
                        🗑️ Elimina
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Errore caricamento articoli:', error);
        container.innerHTML = '<p class="loading">Errore nel caricamento degli articoli</p>';
    }
}

// Mostra/nascondi form
function toggleForm() {
    const form = document.getElementById('articleForm');
    const list = document.getElementById('articlesList');
    
    if (form.style.display === 'none') {
        form.style.display = 'block';
        list.style.display = 'none';
        resetForm();
    } else {
        form.style.display = 'none';
        list.style.display = 'block';
    }
}

// Reset form
function resetForm() {
    document.getElementById('editArticleForm').reset();
    document.getElementById('articleId').value = '';
    document.getElementById('formTitle').textContent = 'Nuovo Articolo';
    currentEditId = null;
}

// Annulla modifica
function cancelEdit() {
    toggleForm();
    loadArticles();
}

// Modifica articolo
async function editArticle(id) {
    try {
        const articles = await api.getArticles();
        const article = articles.find(a => a._id === id);
        
        if (!article) {
            alert('Articolo non trovato');
            return;
        }
        
        // Popola form
        document.getElementById('articleId').value = article._id;
        document.getElementById('title').value = article.title;
        document.getElementById('description').value = article.description;
        document.getElementById('link').value = article.link;
        document.getElementById('image').value = article.image;
        document.getElementById('category').value = article.category;
        document.getElementById('status').value = article.status;
        document.getElementById('featured').checked = article.featured || false;
        
        document.getElementById('formTitle').textContent = 'Modifica Articolo';
        currentEditId = id;
        
        // Mostra form
        document.getElementById('articleForm').style.display = 'block';
        document.getElementById('articlesList').style.display = 'none';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Errore caricamento articolo:', error);
        alert('Errore nel caricamento dell\'articolo');
    }
}

// Elimina articolo
async function deleteArticle(id, title) {
    if (!confirm(`Vuoi davvero eliminare l'articolo "${title}"?`)) {
        return;
    }
    
    try {
        await api.deleteArticle(id);
        alert('Articolo eliminato con successo!');
        loadArticles();
    } catch (error) {
        console.error('Errore eliminazione articolo:', error);
        alert('Errore nell\'eliminazione dell\'articolo');
    }
}

// Salva articolo (crea o modifica)
document.getElementById('editArticleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        link: document.getElementById('link').value,
        image: document.getElementById('image').value,
        category: document.getElementById('category').value,
        status: document.getElementById('status').value,
        featured: document.getElementById('featured').checked
    };
    
    try {
        if (currentEditId) {
            // Modifica
            await api.updateArticle(currentEditId, formData);
            alert('Articolo aggiornato con successo!');
        } else {
            // Creazione
            await api.createArticle(formData);
            alert('Articolo creato con successo!');
        }
        
        cancelEdit();
    } catch (error) {
        console.error('Errore salvataggio articolo:', error);
        alert('Errore nel salvataggio dell\'articolo: ' + error.message);
    }
});

// Helper: icona categoria
function getCategoryIcon(category) {
    const icons = {
        'viaggi': '🧳',
        'enogastronomia': '🍷',
        'ospitalita': '🏨',
        'cultura': '🎭'
    };
    return icons[category] || '📝';
}

// Carica info utente
const user = getCurrentUser();
if (user) {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
}

// Carica articoli all'avvio
loadArticles();

// Gestione parametri URL (per edit diretto)
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('edit');
if (editId) {
    editArticle(editId);
}

// Gestione click ADV
const advNavItem = document.getElementById('advNavItem');
if (advNavItem) {
    advNavItem.addEventListener('click', (e) => {
        e.preventDefault();
        alert('📢 Gestione ADV in arrivo!\n\nQui potrai configurare banner pubblicitari e sponsorizzazioni.');
    });
}
