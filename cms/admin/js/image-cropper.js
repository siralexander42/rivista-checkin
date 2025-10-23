/* ============================================
   IMAGE CROPPER - Interactive Crop Tool
   Per blocchi parallasse con anteprima precisa
   ============================================ */

class ImageCropper {
    constructor(containerId, options = {}) {
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
                                <div class="cropper-preview-image" id="cropperPreview">
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
                                        <span class="cropper-info-value" id="cropX">0%</span>
                                    </div>
                                    <div class="cropper-info-row">
                                        <span class="cropper-info-label">Posizione Y:</span>
                                        <span class="cropper-info-value" id="cropY">0%</span>
                                    </div>
                                    <div class="cropper-info-row">
                                        <span class="cropper-info-label">Larghezza:</span>
                                        <span class="cropper-info-value" id="cropWidth">100%</span>
                                    </div>
                                    <div class="cropper-info-row">
                                        <span class="cropper-info-label">Altezza:</span>
                                        <span class="cropper-info-value" id="cropHeight">100%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.canvasWrapper = this.container.querySelector('.cropper-canvas-wrapper');
        this.previewElement = document.getElementById('cropperPreview');
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
        img.crossOrigin = 'anonymous';
        
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
                    <div class="cropper-placeholder-text">Errore nel caricamento dell'immagine</div>
                </div>
            `;
        };
        
        img.src = url;
    }
    
    renderCanvas() {
        this.canvasWrapper.innerHTML = `
            <button class="cropper-reset-btn" onclick="this.closest('.image-cropper-container').imageCropper.resetSelection()">
                🔄 Reset
            </button>
            <div class="cropper-canvas">
                <img src="${this.imageUrl}" class="cropper-image" draggable="false">
                <div class="cropper-overlay">
                    <div class="cropper-selection">
                        <div class="cropper-handle nw"></div>
                        <div class="cropper-handle n"></div>
                        <div class="cropper-handle ne"></div>
                        <div class="cropper-handle w"></div>
                        <div class="cropper-handle e"></div>
                        <div class="cropper-handle sw"></div>
                        <div class="cropper-handle s"></div>
                        <div class="cropper-handle se"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.canvas = this.canvasWrapper.querySelector('.cropper-canvas');
        this.imageElement = this.canvas.querySelector('.cropper-image');
        this.selection = this.canvas.querySelector('.cropper-selection');
        
        // Store reference for reset button
        this.canvasWrapper.querySelector('.image-cropper-container').imageCropper = this;
        
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
        // Selection drag
        this.selection.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('cropper-handle')) return;
            
            this.isDragging = true;
            this.dragStart = {
                x: e.clientX - this.selection.offsetLeft,
                y: e.clientY - this.selection.offsetTop
            };
            e.preventDefault();
        });
        
        // Handle resize
        this.selection.querySelectorAll('.cropper-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                this.isResizing = true;
                this.resizeHandle = handle.className.split(' ')[1];
                this.dragStart = {
                    x: e.clientX,
                    y: e.clientY,
                    selectionX: this.selection.offsetLeft,
                    selectionY: this.selection.offsetTop,
                    selectionWidth: this.selection.offsetWidth,
                    selectionHeight: this.selection.offsetHeight
                };
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        // Mouse move
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleDrag(e);
            } else if (this.isResizing) {
                this.handleResize(e);
            }
        });
        
        // Mouse up
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isResizing = false;
            this.resizeHandle = null;
        });
    }
    
    handleDrag(e) {
        const canvasRect = this.canvas.getBoundingClientRect();
        let x = e.clientX - this.dragStart.x;
        let y = e.clientY - this.dragStart.y;
        
        // Limiti
        x = Math.max(0, Math.min(x, canvasRect.width - this.selection.offsetWidth));
        y = Math.max(0, Math.min(y, canvasRect.height - this.selection.offsetHeight));
        
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
        
        // Aspect ratio constraint
        if (this.aspectRatio && !['w', 'e'].includes(this.resizeHandle)) {
            if (['n', 's'].includes(this.resizeHandle)) {
                width = height * this.aspectRatio;
                if (this.resizeHandle === 'n') {
                    x = this.dragStart.selectionX - (width - this.dragStart.selectionWidth) / 2;
                }
            } else {
                height = width / this.aspectRatio;
            }
        }
        
        // Minimum size
        width = Math.max(50, width);
        height = Math.max(50, height);
        
        // Limiti canvas
        x = Math.max(0, Math.min(x, canvasRect.width - width));
        y = Math.max(0, Math.min(y, canvasRect.height - height));
        width = Math.min(width, canvasRect.width - x);
        height = Math.min(height, canvasRect.height - y);
        
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
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Converti a percentuali dell'immagine originale
        this.cropData = {
            x: (this.selection.offsetLeft / canvasRect.width * 100).toFixed(2),
            y: (this.selection.offsetTop / canvasRect.height * 100).toFixed(2),
            width: (this.selection.offsetWidth / canvasRect.width * 100).toFixed(2),
            height: (this.selection.offsetHeight / canvasRect.height * 100).toFixed(2),
            unit: '%'
        };
        
        // Callback
        this.onChange(this.cropData);
    }
    
    updatePreview() {
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const scaleX = this.imageWidth / canvasRect.width;
        const scaleY = this.imageHeight / canvasRect.height;
        
        const cropX = this.selection.offsetLeft * scaleX;
        const cropY = this.selection.offsetTop * scaleY;
        const cropWidth = this.selection.offsetWidth * scaleX;
        const cropHeight = this.selection.offsetHeight * scaleY;
        
        this.previewElement.innerHTML = `
            <div style="width: 100%; height: 0; padding-bottom: ${(cropHeight/cropWidth*100)}%; position: relative; overflow: hidden; background: #f8f9fa;">
                <img src="${this.imageUrl}" 
                     style="position: absolute; top: ${-(cropY/cropHeight*100)}%; left: ${-(cropX/cropWidth*100)}%; width: ${(this.imageWidth/cropWidth*100)}%; height: auto;">
            </div>
        `;
    }
    
    updateInfo() {
        document.getElementById('cropX').textContent = this.cropData.x + '%';
        document.getElementById('cropY').textContent = this.cropData.y + '%';
        document.getElementById('cropWidth').textContent = this.cropData.width + '%';
        document.getElementById('cropHeight').textContent = this.cropData.height + '%';
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
