/**
 * BLOCK TYPES MANAGER
 * Sistema completo per gestire, modificare e creare tipi di blocco
 */

class BlockTypesManager {
    constructor() {
        // Verifica che lo schema sia disponibile
        if (typeof BLOCK_TYPES_SCHEMA === 'undefined') {
            console.error('BLOCK_TYPES_SCHEMA non trovato! Assicurati che block-types-schema.js sia caricato prima.');
            this.schema = {};
        } else {
            this.schema = BLOCK_TYPES_SCHEMA;
        }
        this.customBlocks = this.loadCustomBlocks();
        this.allBlocks = { ...this.schema, ...this.customBlocks };
    }

    // Carica blocchi custom salvati
    loadCustomBlocks() {
        const saved = localStorage.getItem('custom_block_types');
        return saved ? JSON.parse(saved) : {};
    }

    // Salva blocchi custom
    saveCustomBlocks() {
        localStorage.setItem('custom_block_types', JSON.stringify(this.customBlocks));
    }

    // Ottieni tutti i tipi di blocco
    getAllBlockTypes() {
        return this.allBlocks;
    }

    // Ottieni un tipo specifico
    getBlockType(id) {
        return this.allBlocks[id];
    }

    // Verifica se è un blocco custom
    isCustomBlock(id) {
        return !!this.customBlocks[id];
    }

    // Crea nuovo tipo di blocco
    createBlockType(data) {
        const id = this.generateBlockId(data.name);
        
        const blockType = {
            id: id,
            name: data.name,
            description: data.description,
            icon: data.icon || '📦',
            category: data.category || 'content',
            tags: data.tags || [],
            gradient: data.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fields: data.fields || [],
            defaultData: data.defaultData || {},
            isCustom: true,
            createdAt: new Date().toISOString()
        };

        this.customBlocks[id] = blockType;
        this.allBlocks[id] = blockType;
        this.saveCustomBlocks();

        return blockType;
    }

    // Modifica tipo di blocco esistente
    updateBlockType(id, data) {
        if (!this.isCustomBlock(id)) {
            throw new Error('Non è possibile modificare blocchi predefiniti. Creane uno nuovo basato su questo.');
        }

        this.customBlocks[id] = {
            ...this.customBlocks[id],
            ...data,
            id: id,
            isCustom: true,
            updatedAt: new Date().toISOString()
        };

        this.allBlocks[id] = this.customBlocks[id];
        this.saveCustomBlocks();

        return this.customBlocks[id];
    }

    // Duplica un blocco (anche predefinito)
    duplicateBlockType(id, newName) {
        const original = this.getBlockType(id);
        if (!original) {
            throw new Error('Blocco non trovato');
        }

        const duplicate = JSON.parse(JSON.stringify(original));
        duplicate.name = newName || `${original.name} (Copia)`;
        duplicate.isCustom = true;
        delete duplicate.id;

        return this.createBlockType(duplicate);
    }

    // Elimina tipo di blocco custom
    deleteBlockType(id) {
        if (!this.isCustomBlock(id)) {
            throw new Error('Non è possibile eliminare blocchi predefiniti');
        }

        delete this.customBlocks[id];
        delete this.allBlocks[id];
        this.saveCustomBlocks();
    }

    // Genera ID univoco
    generateBlockId(name) {
        const base = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        let id = base;
        let counter = 1;
        
        while (this.allBlocks[id]) {
            id = `${base}-${counter}`;
            counter++;
        }

        return id;
    }

    // Esporta schema completo
    exportSchema() {
        return {
            predefined: this.schema,
            custom: this.customBlocks,
            exportDate: new Date().toISOString()
        };
    }

    // Importa schema
    importSchema(data) {
        if (data.custom) {
            this.customBlocks = data.custom;
            this.allBlocks = { ...this.schema, ...this.customBlocks };
            this.saveCustomBlocks();
        }
    }
}

// Inizializza manager globale
const blockTypesManager = new BlockTypesManager();

// ============================================
// UI FUNCTIONS
// ============================================

/**
 * Renderizza lista blocchi nella developer mode
 */
function renderBlockTypesList() {
    const container = document.getElementById('blockTypesGrid');
    if (!container) return;

    const blocks = blockTypesManager.getAllBlockTypes();
    const blockIds = Object.keys(blocks);

    if (blockIds.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #858585; grid-column: 1/-1;">
                <div style="font-size: 64px; margin-bottom: 16px;">📦</div>
                <p>Nessun tipo di blocco disponibile</p>
            </div>
        `;
        return;
    }

    container.innerHTML = blockIds.map(id => {
        const block = blocks[id];
        const isCustom = blockTypesManager.isCustomBlock(id);
        
        return `
            <div class="block-type-card" data-block-id="${id}">
                <div class="block-type-header" style="background: ${block.gradient};">
                    <div class="block-type-icon">${block.icon}</div>
                    ${isCustom ? '<span class="block-custom-badge">CUSTOM</span>' : ''}
                </div>
                <div class="block-type-body">
                    <h3 class="block-type-title">${block.name}</h3>
                    <p class="block-type-description">${block.description}</p>
                    <div class="block-type-tags">
                        ${block.tags.map(tag => `<span class="block-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="block-type-meta">
                        <span class="block-meta-item">📋 ${block.fields.length} campi</span>
                        <span class="block-meta-item">📁 ${block.category}</span>
                    </div>
                </div>
                <div class="block-type-actions">
                    <button class="btn-block-action" onclick="viewBlockType('${id}')" title="Visualizza">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    ${isCustom ? `
                        <button class="btn-block-action" onclick="editBlockType('${id}')" title="Modifica">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2"/>
                                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="btn-block-action" onclick="duplicateBlockType('${id}')" title="Duplica">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    ${isCustom ? `
                        <button class="btn-block-action btn-danger" onclick="deleteBlockType('${id}')" title="Elimina">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Visualizza dettagli tipo blocco
 */
function viewBlockType(id) {
    const block = blockTypesManager.getBlockType(id);
    if (!block) return;

    const modal = document.getElementById('blockTypeViewModal');
    if (!modal) return;

    // Popola modal
    document.getElementById('viewBlockName').textContent = block.name;
    document.getElementById('viewBlockDescription').textContent = block.description;
    document.getElementById('viewBlockIcon').textContent = block.icon;
    document.getElementById('viewBlockCategory').textContent = block.category;
    document.getElementById('viewBlockTags').innerHTML = block.tags.map(tag => 
        `<span class="block-tag">${tag}</span>`
    ).join('');

    // Mostra campi
    const fieldsContainer = document.getElementById('viewBlockFields');
    fieldsContainer.innerHTML = block.fields.map((field, index) => `
        <div class="field-item">
            <div class="field-header">
                <strong>${index + 1}. ${field.label}</strong>
                <span class="field-type-badge">${field.type}</span>
            </div>
            <div class="field-meta">
                <span>ID: <code>${field.id}</code></span>
                ${field.required ? '<span class="required-badge">Obbligatorio</span>' : ''}
            </div>
            ${field.help ? `<p class="field-help">${field.help}</p>` : ''}
        </div>
    `).join('');

    // Mostra JSON
    document.getElementById('viewBlockJSON').textContent = JSON.stringify(block, null, 2);

    modal.classList.add('active');
}

/**
 * Duplica tipo blocco
 */
function duplicateBlockType(id) {
    const block = blockTypesManager.getBlockType(id);
    const newName = prompt('Nome per il blocco duplicato:', `${block.name} (Copia)`);
    
    if (!newName) return;

    try {
        const newBlock = blockTypesManager.duplicateBlockType(id, newName);
        showNotification(`Blocco "${newBlock.name}" creato con successo!`, 'success');
        renderBlockTypesList();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Elimina tipo blocco custom
 */
function deleteBlockType(id) {
    const block = blockTypesManager.getBlockType(id);
    
    if (!confirm(`Sei sicuro di voler eliminare il blocco "${block.name}"?\n\nQuesta azione non può essere annullata.`)) {
        return;
    }

    try {
        blockTypesManager.deleteBlockType(id);
        showNotification(`Blocco "${block.name}" eliminato`, 'success');
        renderBlockTypesList();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Esporta schema blocchi
 */
function exportBlockSchema() {
    const schema = blockTypesManager.exportSchema();
    const dataStr = JSON.stringify(schema, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `block-types-schema-${Date.now()}.json`;
    link.click();
    
    showNotification('Schema esportato con successo!', 'success');
}

/**
 * Importa schema blocchi
 */
function importBlockSchema() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                blockTypesManager.importSchema(data);
                showNotification('Schema importato con successo!', 'success');
                renderBlockTypesList();
            } catch (error) {
                showNotification('Errore nell\'importazione: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Inizializza quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderBlockTypesList();
    });
} else {
    renderBlockTypesList();
}
