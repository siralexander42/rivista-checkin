/**
 * BLOCK TYPE CREATOR
 * Editor visuale per creare e modificare tipi di blocco
 */

class BlockTypeCreator {
    constructor() {
        this.currentBlock = null;
        this.fields = [];
        this.isDragging = false;
        this.draggedField = null;
    }

    /**
     * Apre il creator per un nuovo blocco
     */
    open(blockId = null) {
        if (blockId) {
            // Modalità edit
            this.currentBlock = blockTypesManager.getBlockType(blockId);
            if (!blockTypesManager.isCustomBlock(blockId)) {
                // Duplica blocco predefinito per editarlo
                const newName = prompt('Crea una copia modificabile di questo blocco.\nNome:', this.currentBlock.name + ' (Custom)');
                if (!newName) return;
                
                this.currentBlock = blockTypesManager.duplicateBlockType(blockId, newName);
            }
            this.fields = [...this.currentBlock.fields];
        } else {
            // Nuovo blocco
            this.currentBlock = {
                name: '',
                description: '',
                icon: '📦',
                category: 'content',
                tags: [],
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fields: [],
                defaultData: {}
            };
            this.fields = [];
        }

        this.render();
        document.getElementById('blockCreatorModal').classList.add('active');
    }

    /**
     * Chiude il creator
     */
    close() {
        document.getElementById('blockCreatorModal').classList.remove('active');
        this.currentBlock = null;
        this.fields = [];
    }

    /**
     * Renderizza l'interfaccia
     */
    render() {
        const modal = document.getElementById('blockCreatorContent');
        if (!modal) return;

        modal.innerHTML = `
            <div class="creator-layout">
                <!-- Sidebar: Proprietà Blocco -->
                <div class="creator-sidebar">
                    <h3 style="margin: 0 0 20px 0; color: #d4d4d4; font-size: 16px;">⚙️ Proprietà Blocco</h3>
                    
                    <div class="form-group">
                        <label>Nome Blocco *</label>
                        <input type="text" id="blockName" value="${this.currentBlock.name}" placeholder="es: Hero Animato">
                    </div>

                    <div class="form-group">
                        <label>Descrizione</label>
                        <textarea id="blockDescription" rows="3" placeholder="Descrivi a cosa serve questo blocco...">${this.currentBlock.description}</textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Icona</label>
                            <input type="text" id="blockIcon" value="${this.currentBlock.icon}" maxlength="2" style="text-align: center; font-size: 24px;">
                        </div>
                        <div class="form-group">
                            <label>Categoria</label>
                            <select id="blockCategory">
                                <option value="hero" ${this.currentBlock.category === 'hero' ? 'selected' : ''}>Hero</option>
                                <option value="content" ${this.currentBlock.category === 'content' ? 'selected' : ''}>Content</option>
                                <option value="media" ${this.currentBlock.category === 'media' ? 'selected' : ''}>Media</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Gradiente Header</label>
                        <select id="blockGradient" onchange="updateGradientPreview()">
                            <option value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">Purple</option>
                            <option value="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">Pink</option>
                            <option value="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">Blue</option>
                            <option value="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">Green</option>
                            <option value="linear-gradient(135deg, #fa709a 0%, #fee140 100%)">Sunset</option>
                        </select>
                        <div id="gradientPreview" style="height: 60px; border-radius: 6px; margin-top: 8px; background: ${this.currentBlock.gradient};"></div>
                    </div>

                    <div class="form-group">
                        <label>Tags (separati da virgola)</label>
                        <input type="text" id="blockTags" value="${this.currentBlock.tags.join(', ')}" placeholder="Animato, Premium, Hero">
                    </div>
                </div>

                <!-- Main: Field Editor -->
                <div class="creator-main">
                    <div class="creator-header">
                        <h3 style="margin: 0; color: #d4d4d4; font-size: 16px;">📝 Campi del Blocco</h3>
                        <button class="btn-add-field" onclick="blockCreator.addField()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Aggiungi Campo
                        </button>
                    </div>

                    <div class="fields-container" id="fieldsContainer">
                        ${this.fields.length === 0 ? `
                            <div class="empty-fields">
                                <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
                                <p>Nessun campo aggiunto</p>
                                <p style="font-size: 12px; color: #858585;">Clicca "Aggiungi Campo" per iniziare</p>
                            </div>
                        ` : this.fields.map((field, index) => this.renderField(field, index)).join('')}
                    </div>
                </div>

                <!-- Preview -->
                <div class="creator-preview">
                    <h3 style="margin: 0 0 16px 0; color: #d4d4d4; font-size: 16px;">👁️ Preview</h3>
                    <div class="preview-card" id="previewCard">
                        ${this.renderPreview()}
                    </div>
                </div>
            </div>

            <div class="creator-footer">
                <button class="btn-creator btn-cancel" onclick="blockCreator.close()">Annulla</button>
                <button class="btn-creator btn-save" onclick="blockCreator.save()">
                    ${this.currentBlock.id ? '💾 Salva Modifiche' : '✨ Crea Blocco'}
                </button>
            </div>
        `;

        // Set gradient select
        const gradientSelect = document.getElementById('blockGradient');
        if (gradientSelect) {
            gradientSelect.value = this.currentBlock.gradient;
        }

        this.attachFieldEvents();
    }

    /**
     * Renderizza un campo
     */
    renderField(field, index) {
        return `
            <div class="field-editor-item" data-index="${index}" draggable="true">
                <div class="field-drag-handle">⋮⋮</div>
                <div class="field-editor-content">
                    <div class="field-editor-row">
                        <input type="text" class="field-label" value="${field.label}" placeholder="Label" onchange="blockCreator.updateField(${index}, 'label', this.value)">
                        <input type="text" class="field-id" value="${field.id}" placeholder="ID" onchange="blockCreator.updateField(${index}, 'id', this.value)">
                        <select class="field-type" onchange="blockCreator.updateField(${index}, 'type', this.value)">
                            <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                            <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Textarea</option>
                            <option value="image" ${field.type === 'image' ? 'selected' : ''}>Image</option>
                            <option value="image-list" ${field.type === 'image-list' ? 'selected' : ''}>Image List</option>
                            <option value="image-gallery" ${field.type === 'image-gallery' ? 'selected' : ''}>Image Gallery</option>
                            <option value="repeater" ${field.type === 'repeater' ? 'selected' : ''}>Repeater</option>
                            <option value="group" ${field.type === 'group' ? 'selected' : ''}>Group</option>
                        </select>
                        <label class="field-required">
                            <input type="checkbox" ${field.required ? 'checked' : ''} onchange="blockCreator.updateField(${index}, 'required', this.checked)">
                            Obbligatorio
                        </label>
                        <button class="btn-delete-field" onclick="blockCreator.deleteField(${index})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <input type="text" class="field-help" value="${field.help || ''}" placeholder="Testo di aiuto (opzionale)" onchange="blockCreator.updateField(${index}, 'help', this.value)">
                </div>
            </div>
        `;
    }

    /**
     * Renderizza preview
     */
    renderPreview() {
        const name = document.getElementById('blockName')?.value || this.currentBlock.name || 'Nuovo Blocco';
        const description = document.getElementById('blockDescription')?.value || this.currentBlock.description || 'Descrizione blocco';
        const icon = document.getElementById('blockIcon')?.value || this.currentBlock.icon || '📦';
        const category = document.getElementById('blockCategory')?.value || this.currentBlock.category || 'content';
        const tags = document.getElementById('blockTags')?.value.split(',').map(t => t.trim()).filter(t => t) || this.currentBlock.tags || [];
        const gradient = document.getElementById('blockGradient')?.value || this.currentBlock.gradient;

        return `
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
                    <span class="block-meta-item">📋 ${this.fields.length} campi</span>
                    <span class="block-meta-item">📁 ${category}</span>
                </div>
            </div>
        `;
    }

    /**
     * Aggiorna preview in real-time
     */
    updatePreview() {
        const preview = document.getElementById('previewCard');
        if (preview) {
            preview.innerHTML = this.renderPreview();
        }
    }

    /**
     * Aggiunge un nuovo campo
     */
    addField() {
        const newField = {
            id: `field_${Date.now()}`,
            label: 'Nuovo Campo',
            type: 'text',
            required: false,
            help: ''
        };
        this.fields.push(newField);
        this.render();
    }

    /**
     * Aggiorna un campo
     */
    updateField(index, key, value) {
        if (this.fields[index]) {
            this.fields[index][key] = value;
            this.updatePreview();
        }
    }

    /**
     * Elimina un campo
     */
    deleteField(index) {
        if (confirm('Eliminare questo campo?')) {
            this.fields.splice(index, 1);
            this.render();
        }
    }

    /**
     * Attach drag & drop eventi
     */
    attachFieldEvents() {
        const items = document.querySelectorAll('.field-editor-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedField = parseInt(item.getAttribute('data-index'));
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
                
                if (this.draggedField !== null && this.draggedField !== dropIndex) {
                    const [removed] = this.fields.splice(this.draggedField, 1);
                    this.fields.splice(dropIndex, 0, removed);
                    this.render();
                }
            });
        });

        // Input eventi per preview
        ['blockName', 'blockDescription', 'blockIcon', 'blockCategory', 'blockTags', 'blockGradient'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updatePreview());
            }
        });
    }

    /**
     * Salva il blocco
     */
    save() {
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
            fields: this.fields,
            defaultData: this.generateDefaultData()
        };

        try {
            let result;
            if (this.currentBlock.id) {
                // Aggiorna esistente
                result = blockTypesManager.updateBlockType(this.currentBlock.id, blockData);
                showNotification(`Blocco "${result.name}" aggiornato!`, 'success');
            } else {
                // Crea nuovo
                result = blockTypesManager.createBlockType(blockData);
                showNotification(`Blocco "${result.name}" creato!`, 'success');
            }

            renderBlockTypesList();
            this.close();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    /**
     * Genera dati di default dai campi
     */
    generateDefaultData() {
        const defaults = {};
        this.fields.forEach(field => {
            switch (field.type) {
                case 'text':
                case 'textarea':
                    defaults[field.id] = '';
                    break;
                case 'image':
                    defaults[field.id] = '';
                    break;
                case 'image-list':
                    defaults[field.id] = [];
                    break;
                case 'image-gallery':
                    defaults[field.id] = [];
                    break;
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
}

// Istanza globale
const blockCreator = new BlockTypeCreator();

// Helper: update gradient preview
function updateGradientPreview() {
    const select = document.getElementById('blockGradient');
    const preview = document.getElementById('gradientPreview');
    if (select && preview) {
        preview.style.background = select.value;
    }
}

// Override della funzione openBlockTypeCreator
function openBlockTypeCreator() {
    blockCreator.open();
}

// Override della funzione editBlockType
function editBlockType(id) {
    blockCreator.open(id);
}
