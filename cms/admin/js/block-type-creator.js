/**
 * BLOCK TYPE CREATOR - Versione Semplificata
 * Editor per creare e modificare tipi di blocco
 */

let currentEditingBlock = null;
let fieldsArray = [];

/**
 * Apre il creator
 */
function openBlockTypeCreator(blockId = null) {
    currentEditingBlock = blockId;
    fieldsArray = [];
    
    if (blockId) {
        // Modalità edit - carica dati blocco
        const block = blockTypesManager.getBlockType(blockId);
        
        if (!blockTypesManager.isCustomBlock(blockId)) {
            // Duplica blocco predefinito
            const newName = prompt('Crea una copia modificabile di questo blocco.\nNome:', block.name + ' (Custom)');
            if (!newName) return;
            
            const duplicated = blockTypesManager.duplicateBlockType(blockId, newName);
            currentEditingBlock = duplicated.id;
            loadBlockData(duplicated);
        } else {
            loadBlockData(block);
        }
    } else {
        // Nuovo blocco - reset form
        document.getElementById('blockName').value = '';
        document.getElementById('blockDescription').value = '';
        document.getElementById('blockIcon').value = '📦';
        document.getElementById('blockCategory').value = 'content';
        document.getElementById('blockGradient').value = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        document.getElementById('blockTags').value = '';
        document.getElementById('blockSchemaType').value = '';
        updateGradientPreview();
        renderFields();
    }
    
    document.getElementById('blockCreatorModal').classList.add('active');
    updatePreview();
}

/**
 * Carica dati di un blocco esistente
 */
function loadBlockData(block) {
    document.getElementById('blockName').value = block.name;
    document.getElementById('blockDescription').value = block.description;
    document.getElementById('blockIcon').value = block.icon;
    document.getElementById('blockCategory').value = block.category;
    document.getElementById('blockGradient').value = block.gradient;
    document.getElementById('blockTags').value = block.tags.join(', ');
    document.getElementById('blockSchemaType').value = block.schemaType || '';
    
    fieldsArray = block.fields ? [...block.fields] : [];
    
    updateGradientPreview();
    renderFields();
    updatePreview();
}

/**
 * Chiude il creator
 */
function closeBlockCreator() {
    document.getElementById('blockCreatorModal').classList.remove('active');
    currentEditingBlock = null;
    fieldsArray = [];
}

/**
 * Aggiunge un nuovo campo
 */
function addNewField() {
    const newField = {
        id: `field_${Date.now()}`,
        label: 'Nuovo Campo',
        type: 'text',
        required: false,
        help: '',
        variable: '' // Per mappare a variabili schema.org
    };
    
    fieldsArray.push(newField);
    renderFields();
    updatePreview();
}

/**
 * Renderizza la lista campi
 */
function renderFields() {
    const container = document.getElementById('fieldsContainer');
    
    if (fieldsArray.length === 0) {
        container.innerHTML = `
            <div class="empty-fields">
                <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
                <p>Nessun campo aggiunto</p>
                <p style="font-size: 12px; color: #858585;">Clicca "Aggiungi Campo" per iniziare</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = fieldsArray.map((field, index) => `
        <div class="field-editor-item" data-index="${index}" draggable="true">
            <div class="field-drag-handle">⋮⋮</div>
            <div class="field-editor-content">
                <div class="field-editor-row">
                    <input type="text" class="field-label" value="${field.label}" 
                           placeholder="Label" onchange="updateFieldProperty(${index}, 'label', this.value)">
                    <input type="text" class="field-id" value="${field.id}" 
                           placeholder="ID" onchange="updateFieldProperty(${index}, 'id', this.value)">
                    <select class="field-type" onchange="updateFieldProperty(${index}, 'type', this.value)">
                        <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                        <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Textarea</option>
                        <option value="image" ${field.type === 'image' ? 'selected' : ''}>Image</option>
                        <option value="image-list" ${field.type === 'image-list' ? 'selected' : ''}>Image List</option>
                        <option value="image-gallery" ${field.type === 'image-gallery' ? 'selected' : ''}>Image Gallery</option>
                        <option value="repeater" ${field.type === 'repeater' ? 'selected' : ''}>Repeater</option>
                        <option value="group" ${field.type === 'group' ? 'selected' : ''}>Group</option>
                    </select>
                    <label class="field-required">
                        <input type="checkbox" ${field.required ? 'checked' : ''} 
                               onchange="updateFieldProperty(${index}, 'required', this.checked)">
                        Obbligatorio
                    </label>
                    <button class="btn-delete-field" onclick="deleteField(${index})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <input type="text" class="field-help" value="${field.help || ''}" 
                       placeholder="Testo di aiuto (opzionale)" 
                       onchange="updateFieldProperty(${index}, 'help', this.value)">
                <input type="text" class="field-variable" value="${field.variable || ''}" 
                       placeholder="Variabile Schema.org (es: headline, image, author)" 
                       onchange="updateFieldProperty(${index}, 'variable', this.value)"
                       style="background: #2a2d2e; border: 1px solid #3c3c3c; color: #4ec9b0; padding: 6px 10px; border-radius: 4px; font-size: 11px; font-family: monospace; margin-top: 6px;">
            </div>
        </div>
    `).join('');
    
    // Attach drag & drop
    attachDragAndDrop();
}

/**
 * Aggiorna proprietà di un campo
 */
function updateFieldProperty(index, key, value) {
    if (fieldsArray[index]) {
        fieldsArray[index][key] = value;
        updatePreview();
    }
}

/**
 * Elimina un campo
 */
function deleteField(index) {
    if (confirm('Eliminare questo campo?')) {
        fieldsArray.splice(index, 1);
        renderFields();
        updatePreview();
    }
}

/**
 * Drag & Drop per riordinare campi
 */
let draggedIndex = null;

function attachDragAndDrop() {
    const items = document.querySelectorAll('.field-editor-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedIndex = parseInt(item.getAttribute('data-index'));
            item.style.opacity = '0.4';
        });
        
        item.addEventListener('dragend', (e) => {
            item.style.opacity = '1';
        });
        
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropIndex = parseInt(item.getAttribute('data-index'));
            
            if (draggedIndex !== null && draggedIndex !== dropIndex) {
                const [removed] = fieldsArray.splice(draggedIndex, 1);
                fieldsArray.splice(dropIndex, 0, removed);
                renderFields();
                updatePreview();
            }
        });
    });
}

/**
 * Aggiorna preview
 */
function updatePreview() {
    const name = document.getElementById('blockName').value || 'Nuovo Blocco';
    const description = document.getElementById('blockDescription').value || 'Descrizione blocco';
    const icon = document.getElementById('blockIcon').value || '📦';
    const category = document.getElementById('blockCategory').value || 'content';
    const gradient = document.getElementById('blockGradient').value;
    const tags = document.getElementById('blockTags').value.split(',').map(t => t.trim()).filter(t => t);
    
    const preview = document.getElementById('previewCard');
    preview.innerHTML = `
        <div class="block-type-header" style="background: ${gradient};">
            <div class="block-type-icon">${icon}</div>
            <span class="block-custom-badge">CUSTOM</span>
        </div>
        <div class="block-type-body">
            <h3 class="block-type-title">${name}</h3>
            <p class="block-type-description">${description}</p>
            <div class="block-type-tags">
                ${tags.map(tag => `<span class="block-tag">${tag}</span>`).join('')}
            </div>
            <div class="block-type-meta">
                <span class="block-meta-item">📋 ${fieldsArray.length} campi</span>
                <span class="block-meta-item">📁 ${category}</span>
            </div>
        </div>
    `;
}

/**
 * Aggiorna preview gradiente
 */
function updateGradientPreview() {
    const gradient = document.getElementById('blockGradient').value;
    document.getElementById('gradientPreview').style.background = gradient;
    updatePreview();
}

/**
 * Salva il blocco
 */
function saveNewBlock() {
    const name = document.getElementById('blockName').value.trim();
    
    if (!name) {
        alert('Inserisci il nome del blocco');
        return;
    }
    
    const blockData = {
        name: name,
        description: document.getElementById('blockDescription').value.trim(),
        icon: document.getElementById('blockIcon').value || '📦',
        category: document.getElementById('blockCategory').value,
        tags: document.getElementById('blockTags').value.split(',').map(t => t.trim()).filter(t => t),
        gradient: document.getElementById('blockGradient').value,
        schemaType: document.getElementById('blockSchemaType').value,
        fields: fieldsArray,
        defaultData: generateDefaultData()
    };
    
    try {
        let result;
        if (currentEditingBlock && blockTypesManager.isCustomBlock(currentEditingBlock)) {
            result = blockTypesManager.updateBlockType(currentEditingBlock, blockData);
            showNotification(`Blocco "${result.name}" aggiornato!`, 'success');
        } else {
            result = blockTypesManager.createBlockType(blockData);
            showNotification(`Blocco "${result.name}" creato!`, 'success');
        }
        
        renderBlockTypesList();
        closeBlockCreator();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Genera dati di default
 */
function generateDefaultData() {
    const defaults = {};
    fieldsArray.forEach(field => {
        switch (field.type) {
            case 'text':
            case 'textarea':
                defaults[field.id] = '';
                break;
            case 'image':
                defaults[field.id] = '';
                break;
            case 'image-list':
            case 'image-gallery':
            case 'repeater':
                defaults[field.id] = [];
                break;
            case 'group':
                defaults[field.id] = {};
                break;
        }
    });
    return defaults;
}

/**
 * Override editBlockType
 */
function editBlockType(id) {
    openBlockTypeCreator(id);
}

// Auto-update preview quando si modificano i campi del form
document.addEventListener('DOMContentLoaded', () => {
    ['blockName', 'blockDescription', 'blockIcon', 'blockCategory', 'blockTags'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updatePreview);
        }
    });
});
