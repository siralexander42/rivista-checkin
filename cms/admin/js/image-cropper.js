/* ============================================
   IMAGE CROPPER - Interactive Crop Tool
   Per blocchi parallasse con anteprima precisa
   ============================================ */

class ImageCropper {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.imageUrl = options.imageUrl || '';
        this.aspectRatio = options.aspectRatio || 16/9; // Default 16:9 per parallasse
        this.onChange = options.onChange || (() => {});
        
        // Crop data
        this.cropData = options.cropData || {
            x: 0,
            y: 0,
            
            width: 100,
            height: 100,
            unit: '%' // Usiamo percentuali per responsive
        };
        
        this.isDragging = false;
        this.isResizing = false;
        this.dragStart = { x: 0, y: 0 };
        this.resizeHandle = null;
        
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        this.render();
        this.attachEvents();
        
        if (this.imageUrl) {
            this.loadImage(this.imageUrl);
        }
    }
    
    render() {
        this.container.innerHTML = `
            <div class="image-cropper-container">
                <div class="image-cropper-header">
                    <h4>🖼️ Selezione Area Immagine</h4>
                    <div class="cropper-ratio-selector">
                        <button class="cropper-ratio-btn ${this.aspectRatio === 16/9 ? 'active' : ''}" data-ratio="16:9">16:9</button>
                        <button class="cropper-ratio-btn ${this.aspectRatio === 4/3 ? 'active' : ''}" data-ratio="4:3">4:3</button>
                        <button class="cropper-ratio-btn ${this.aspectRatio === 1 ? 'active' : ''}" data-ratio="1:1">1:1</button>
                        <button class="cropper-ratio-btn ${this.aspectRatio === 3/4 ? 'active' : ''}" data-ratio="3:4">3:4</button>
                        <button class="cropper-ratio-btn ${this.aspectRatio === null ? 'active' : ''}" data-ratio="free">Libero</button>
                    </div>
                </div>
                <div class="image-cropper-body">
                    <div class="cropper-main-area">
                        <div class="cropper-canvas-wrapper">
                            <div class="cropper-placeholder">
                                <div class="cropper-placeholder-icon">📷</div>
                                <div class="cropper-placeholder-text">Carica un'immagine per iniziare</div>
                            </div>
                        </div>
                        <div class="cropper-preview-panel">
                            <div class="cropper-preview-box">
                                <h5>Anteprima Crop</h5>
                                <div class="cropper-preview-image" id="cropperPreview_${this.containerId}">
                                    <div style="padding: 40px; text-align: center; color: #94a3b8;">
                                        <div style="font-size: 32px; margin-bottom: 8px;">👁️</div>
                                        <div style="font-size: 12px;">Nessuna selezione</div>
                                    </div>
                                </div>
                            </div>
                            <div class="cropper-preview-box">
                                <h5>Informazioni</h5>
                                <div class="cropper-info">
                                    <div class="cropper-info-row">
                                        <span class="cropper-info-label">Posizione X:</span>
                                        <span class="cropper-info-value" id="cropX_${this.containerId}">0%</span>
                                    </div>
                                    <div class="cropper-info-row">
                                        <span class="cropper-info-label">Posizione Y:</span>
                                        <span class="cropper-info-value" id="cropY_${this.containerId}">0%</span>
                                    </div>
                                    <div class="cropper-info-row">
                                        <span class="cropper-info-label">Larghezza:</span>
                                        <span class="cropper-info-value" id="cropWidth_${this.containerId}">100%</span>
                                    </div>
                                    <div class="cropper-info-row">
                                        <span class="cropper-info-label">Altezza:</span>
                                        <span class="cropper-info-value" id="cropHeight_${this.containerId}">100%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.canvasWrapper = this.container.querySelector('.cropper-canvas-wrapper');
        this.previewElement = document.getElementById(`cropperPreview_${this.containerId}`);
    }
    
    attachEvents() {
        // Ratio selector
        this.container.querySelectorAll('.cropper-ratio-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ratio = e.target.dataset.ratio;
                this.setAspectRatio(ratio);
                
                // Update active state
                this.container.querySelectorAll('.cropper-ratio-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
    
    setAspectRatio(ratio) {
        switch(ratio) {
            case '16:9': this.aspectRatio = 16/9; break;
            case '4:3': this.aspectRatio = 4/3; break;
            case '1:1': this.aspectRatio = 1; break;
            case '3:4': this.aspectRatio = 3/4; break;
            case 'free': this.aspectRatio = null; break;
        }
        
        if (this.image) {
            this.resetSelection();
        }
    }
    
    loadImage(url) {
        this.imageUrl = url;
        
        // Show loading
        this.canvasWrapper.innerHTML = `
            <div class="cropper-loading">
                <div class="loading"></div>
            </div>
        `;
        
        const img = new Image();
        // Rimosso crossOrigin per evitare problemi CORS
        // img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            this.image = img;
            this.imageWidth = img.naturalWidth;
            this.imageHeight = img.naturalHeight;
            
            this.renderCanvas();
            this.initSelection();
        };
        
        img.onerror = () => {
            this.canvasWrapper.innerHTML = `
                <div class="cropper-placeholder">
                    <div class="cropper-placeholder-icon">⚠️</div>
                    <div class="cropper-placeholder-text">Errore nel caricamento dell'immagine<br><small style="font-size: 11px; margin-top: 8px; display: block;">Verifica che l'URL sia corretto</small></div>
                </div>
            `;
        };
        
        img.src = url;
    }
    
    renderCanvas() {
        this.canvasWrapper.innerHTML = `
            <button class="cropper-reset-btn" id="cropperResetBtn_${this.containerId}">
                🔄 Reset
            </button>
            <div class="cropper-canvas">
                <img src="${this.imageUrl}" class="cropper-image" draggable="false" id="cropperImage_${this.containerId}">
                <div class="cropper-selection" id="cropperSelection_${this.containerId}" style="position: absolute; border: 3px solid #3C3D8F; cursor: move;">
                    <div class="cropper-handle nw" style="position: absolute; top: -6px; left: -6px;"></div>
                    <div class="cropper-handle n" style="position: absolute; top: -6px; left: 50%; margin-left: -6px;"></div>
                    <div class="cropper-handle ne" style="position: absolute; top: -6px; right: -6px;"></div>
                    <div class="cropper-handle w" style="position: absolute; top: 50%; left: -6px; margin-top: -6px;"></div>
                    <div class="cropper-handle e" style="position: absolute; top: 50%; right: -6px; margin-top: -6px;"></div>
                    <div class="cropper-handle sw" style="position: absolute; bottom: -6px; left: -6px;"></div>
                    <div class="cropper-handle s" style="position: absolute; bottom: -6px; left: 50%; margin-left: -6px;"></div>
                    <div class="cropper-handle se" style="position: absolute; bottom: -6px; right: -6px;"></div>
                </div>
            </div>
        `;
        
        this.canvas = this.canvasWrapper.querySelector('.cropper-canvas');
        this.imageElement = document.getElementById(`cropperImage_${this.containerId}`);
        this.selection = document.getElementById(`cropperSelection_${this.containerId}`);
        
        // Reset button
        const resetBtn = document.getElementById(`cropperResetBtn_${this.containerId}`);
        resetBtn.addEventListener('click', () => this.resetSelection());
        
        this.attachCanvasEvents();
    }
    
    initSelection() {
        // Inizializza la selezione con l'aspect ratio corretto
        const canvasRect = this.canvas.getBoundingClientRect();
        
        if (this.aspectRatio) {
            // Calcola dimensioni per aspect ratio
            let width = canvasRect.width * 0.8;
            let height = width / this.aspectRatio;
            
            if (height > canvasRect.height * 0.8) {
                height = canvasRect.height * 0.8;
                width = height * this.aspectRatio;
            }
            
            const x = (canvasRect.width - width) / 2;
            const y = (canvasRect.height - height) / 2;
            
            this.updateSelection(x, y, width, height);
        } else {
            // Selezione libera: 80% dell'immagine
            const width = canvasRect.width * 0.8;
            const height = canvasRect.height * 0.8;
            const x = canvasRect.width * 0.1;
            const y = canvasRect.height * 0.1;
            
            this.updateSelection(x, y, width, height);
        }
    }
    
    resetSelection() {
        this.initSelection();
    }
    
    attachCanvasEvents() {
        console.log('attachCanvasEvents chiamata');
        console.log('selection:', this.selection);
        
        if (!this.selection) {
            console.error('Selection element not found!');
            return;
        }
        
        const that = this; // Mantieni riferimento a this
        
        // Drag della selezione
        this.selection.onmousedown = function(e) {
            console.log('mousedown su selection');
            
            // Se clicco su un handle, non fare drag
            if (e.target.classList.contains('cropper-handle')) {
                console.log('Click su handle, gestito separatamente');
                return;
            }
            
            console.log('Inizio drag della selezione');
            that.isDragging = true;
            const canvasRect = that.canvas.getBoundingClientRect();
            that.dragStart = {
                x: e.clientX - canvasRect.left - that.selection.offsetLeft,
                y: e.clientY - canvasRect.top - that.selection.offsetTop
            };
            e.preventDefault();
            return false;
        };
        
        // Handle resize - uno per uno
        const handles = this.selection.querySelectorAll('.cropper-handle');
        console.log('Handle trovati:', handles.length);
        
        handles.forEach(handle => {
            handle.onmousedown = function(e) {
                console.log('mousedown su handle:', this.className);
                that.isResizing = true;
                
                // Identifica quale handle
                if (this.classList.contains('nw')) that.resizeHandle = 'nw';
                else if (this.classList.contains('ne')) that.resizeHandle = 'ne';
                else if (this.classList.contains('sw')) that.resizeHandle = 'sw';
                else if (this.classList.contains('se')) that.resizeHandle = 'se';
                else if (this.classList.contains('n')) that.resizeHandle = 'n';
                else if (this.classList.contains('s')) that.resizeHandle = 's';
                else if (this.classList.contains('w')) that.resizeHandle = 'w';
                else if (this.classList.contains('e')) that.resizeHandle = 'e';
                
                console.log('resizeHandle:', that.resizeHandle);
                
                const canvasRect = that.canvas.getBoundingClientRect();
                that.dragStart = {
                    x: e.clientX,
                    y: e.clientY,
                    canvasX: canvasRect.left,
                    canvasY: canvasRect.top,
                    selectionX: that.selection.offsetLeft,
                    selectionY: that.selection.offsetTop,
                    selectionWidth: that.selection.offsetWidth,
                    selectionHeight: that.selection.offsetHeight
                };
                
                e.preventDefault();
                e.stopPropagation();
                return false;
            };
        });
        
        // Mouse move globale
        document.onmousemove = function(e) {
            if (that.isDragging) {
                console.log('Dragging...');
                that.handleDrag(e);
            } else if (that.isResizing) {
                console.log('Resizing...', that.resizeHandle);
                that.handleResize(e);
            }
        };
        
        // Mouse up globale
        document.onmouseup = function() {
            if (that.isDragging) console.log('Fine drag');
            if (that.isResizing) console.log('Fine resize');
            that.isDragging = false;
            that.isResizing = false;
            that.resizeHandle = null;
        };
        
        console.log('Event listeners attaccati con onmousedown');
    }
    
    handleDrag(e) {
        const canvasRect = this.canvas.getBoundingClientRect();
        let x = e.clientX - canvasRect.left - this.dragStart.x;
        let y = e.clientY - canvasRect.top - this.dragStart.y;
        
        // Usa clientWidth/clientHeight invece di width/height per dimensioni accurate
        const maxX = this.canvas.clientWidth - this.selection.offsetWidth;
        const maxY = this.canvas.clientHeight - this.selection.offsetHeight;
        
        // Limiti
        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));
        
        this.updateSelection(x, y, this.selection.offsetWidth, this.selection.offsetHeight);
    }
    
    handleResize(e) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        
        let x = this.dragStart.selectionX;
        let y = this.dragStart.selectionY;
        let width = this.dragStart.selectionWidth;
        let height = this.dragStart.selectionHeight;
        
        // Calculate new dimensions based on handle
        switch(this.resizeHandle) {
            case 'nw':
                x += deltaX;
                y += deltaY;
                width -= deltaX;
                height -= deltaY;
                break;
            case 'ne':
                y += deltaY;
                width += deltaX;
                height -= deltaY;
                break;
            case 'sw':
                x += deltaX;
                width -= deltaX;
                height += deltaY;
                break;
            case 'se':
                width += deltaX;
                height += deltaY;
                break;
            case 'n':
                y += deltaY;
                height -= deltaY;
                break;
            case 's':
                height += deltaY;
                break;
            case 'w':
                x += deltaX;
                width -= deltaX;
                break;
            case 'e':
                width += deltaX;
                break;
        }
        
        // Applica aspect ratio solo se impostato
        if (this.aspectRatio) {
            // Per handle laterali, calcola in base all'aspect ratio
            if (['w', 'e'].includes(this.resizeHandle)) {
                height = width / this.aspectRatio;
            } else if (['n', 's'].includes(this.resizeHandle)) {
                width = height * this.aspectRatio;
                // Centra orizzontalmente
                x = this.dragStart.selectionX - (width - this.dragStart.selectionWidth) / 2;
            } else {
                // Handle angolari: mantieni aspect ratio basandoti sulla larghezza
                height = width / this.aspectRatio;
                
                // Aggiusta posizione per handle nord
                if (this.resizeHandle === 'nw' || this.resizeHandle === 'ne') {
                    y = this.dragStart.selectionY + this.dragStart.selectionHeight - height;
                }
                if (this.resizeHandle === 'nw' || this.resizeHandle === 'sw') {
                    x = this.dragStart.selectionX + this.dragStart.selectionWidth - width;
                }
            }
        }
        
        // Minimum size
        const minSize = 50;
        width = Math.max(minSize, width);
        height = Math.max(minSize, height);
        
        // Limiti canvas - usa clientWidth/clientHeight per dimensioni accurate
        const maxWidth = this.canvas.clientWidth;
        const maxHeight = this.canvas.clientHeight;
        
        x = Math.max(0, x);
        y = Math.max(0, y);
        
        // Non superare i bordi destro e inferiore
        if (x + width > maxWidth) {
            width = maxWidth - x;
            if (this.aspectRatio) {
                height = width / this.aspectRatio;
            }
        }
        
        if (y + height > maxHeight) {
            height = maxHeight - y;
            if (this.aspectRatio) {
                width = height * this.aspectRatio;
            }
        }
        
        this.updateSelection(x, y, width, height);
    }
    
    updateSelection(x, y, width, height) {
        this.selection.style.left = x + 'px';
        this.selection.style.top = y + 'px';
        this.selection.style.width = width + 'px';
        this.selection.style.height = height + 'px';
        
        this.updateCropData();
        this.updatePreview();
        this.updateInfo();
    }
    
    updateCropData() {
        // Usa clientWidth/clientHeight per calcoli accurati
        const canvasWidth = this.canvas.clientWidth;
        const canvasHeight = this.canvas.clientHeight;
        
        // Converti a percentuali dell'immagine originale
        this.cropData = {
            x: (this.selection.offsetLeft / canvasWidth * 100).toFixed(2),
            y: (this.selection.offsetTop / canvasHeight * 100).toFixed(2),
            width: (this.selection.offsetWidth / canvasWidth * 100).toFixed(2),
            height: (this.selection.offsetHeight / canvasHeight * 100).toFixed(2),
            unit: '%'
        };
        
        // Callback
        this.onChange(this.cropData);
    }
    
    updatePreview() {
        if (!this.previewElement || !this.canvas || !this.selection) return;
        
        // Usa clientWidth/clientHeight per calcoli accurati
        const canvasWidth = this.canvas.clientWidth;
        const canvasHeight = this.canvas.clientHeight;
        
        // Posizione e dimensioni del crop in pixel
        const cropX = this.selection.offsetLeft;
        const cropY = this.selection.offsetTop;
        const cropWidth = this.selection.offsetWidth;
        const cropHeight = this.selection.offsetHeight;
        
        // Calcola lo scale per mostrare l'immagine completa nel canvas
        const scaleX = 100 / (cropWidth / canvasWidth);
        const scaleY = 100 / (cropHeight / canvasHeight);
        
        // Posizione dell'immagine nell'anteprima (negativa per spostare a sinistra/alto)
        const offsetX = -(cropX / cropWidth * 100);
        const offsetY = -(cropY / cropHeight * 100);
        
        // Crea anteprima
        this.previewElement.innerHTML = `
            <div style="width: 100%; height: 0; padding-bottom: ${(cropHeight/cropWidth*100)}%; position: relative; overflow: hidden; background: #f1f5f9; border-radius: 8px;">
                <img src="${this.imageUrl}" 
                     style="position: absolute; 
                            left: ${offsetX}%; 
                            top: ${offsetY}%; 
                            width: ${scaleX}%; 
                            height: auto;
                            transform-origin: top left;">
            </div>
        `;
    }
    
    updateInfo() {
        document.getElementById(`cropX_${this.containerId}`).textContent = this.cropData.x + '%';
        document.getElementById(`cropY_${this.containerId}`).textContent = this.cropData.y + '%';
        document.getElementById(`cropWidth_${this.containerId}`).textContent = this.cropData.width + '%';
        document.getElementById(`cropHeight_${this.containerId}`).textContent = this.cropData.height + '%';
    }
    
    getCropData() {
        return this.cropData;
    }
    
    setCropData(data) {
        if (!this.canvas) return;
        
        this.cropData = data;
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const x = (parseFloat(data.x) / 100) * canvasRect.width;
        const y = (parseFloat(data.y) / 100) * canvasRect.height;
        const width = (parseFloat(data.width) / 100) * canvasRect.width;
        const height = (parseFloat(data.height) / 100) * canvasRect.height;
        
        this.updateSelection(x, y, width, height);
    }
}

// Helper function per integrare nei form
function initImageCropper(inputId, cropperId, options = {}) {
    const input = document.getElementById(inputId);
    if (!input) return null;
    
    const cropper = new ImageCropper(cropperId, options);
    
    // Auto-update quando cambia l'URL
    input.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            setTimeout(() => cropper.loadImage(url), 300);
        }
    });
    
    // Carica subito se c'è già un URL
    if (input.value.trim()) {
        setTimeout(() => cropper.loadImage(input.value.trim()), 300);
    }
    
    return cropper;
}
