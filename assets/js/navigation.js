// ==============================================
// SISTEMA DI NAVIGAZIONE AVANZATO CHECK-IN
// ==============================================

class NavigationSystem {
    constructor() {
        this.currentPage = 'home';
        this.isTransitioning = false;
        this.transitionDuration = 1200;
        this.pages = new Map();
        this.history = ['home'];
        this.gestureStartX = 0;
        this.gestureStartY = 0;
        this.init();
    }

    init() {
        this.createTransitionElements();
        this.setupGestureNavigation();
        this.setupKeyboardNavigation();
        this.preloadPages();
    }

    // ==============================================
    // ELEMENTI DI TRANSIZIONE
    // ==============================================

    createTransitionElements() {
        // Overlay principale per transizioni
        const transitionOverlay = document.createElement('div');
        transitionOverlay.className = 'page-transition-overlay';
        transitionOverlay.innerHTML = `
            <div class="transition-content">
                <div class="transition-logo">
                    <img src="assets/images/checkin-testata-hd.svg" alt="CHECK-IN">
                </div>
                <div class="transition-progress">
                    <div class="progress-bar"></div>
                </div>
                <div class="transition-text">Caricamento...</div>
            </div>
        `;
        document.body.appendChild(transitionOverlay);

        // Particles per effetti
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'transition-particles';
        transitionOverlay.appendChild(particlesContainer);

        this.createParticles(particlesContainer);
    }

    createParticles(container) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: rgba(212, 175, 55, ${Math.random() * 0.8 + 0.2});
                border-radius: 50%;
                animation: particleFloat ${Math.random() * 3 + 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            container.appendChild(particle);
        }
    }

    // ==============================================
    // TRANSIZIONI PAGINA
    // ==============================================

    async navigateToPage(pageUrl, direction = 'forward', transitionType = 'slide') {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        const overlay = document.querySelector('.page-transition-overlay');
        
        try {
            // Avvia transizione in uscita
            await this.startTransition(overlay, direction, transitionType);
            
            // Carica nuova pagina
            await this.loadPage(pageUrl);
            
            // Completa transizione in entrata
            await this.completeTransition(overlay, direction, transitionType);
            
        } catch (error) {
            console.error('Errore durante la navigazione:', error);
        } finally {
            this.isTransitioning = false;
        }
    }

    async startTransition(overlay, direction, type) {
        return new Promise((resolve) => {
            overlay.classList.add('active');
            
            // Diversi tipi di transizione
            switch (type) {
                case 'slide':
                    this.slideTransition(overlay, direction, 'in');
                    break;
                case 'fade':
                    this.fadeTransition(overlay, 'in');
                    break;
                case 'zoom':
                    this.zoomTransition(overlay, 'in');
                    break;
                case 'flip':
                    this.flipTransition(overlay, direction, 'in');
                    break;
            }
            
            setTimeout(resolve, this.transitionDuration / 2);
        });
    }

    async completeTransition(overlay, direction, type) {
        return new Promise((resolve) => {
            setTimeout(() => {
                switch (type) {
                    case 'slide':
                        this.slideTransition(overlay, direction, 'out');
                        break;
                    case 'fade':
                        this.fadeTransition(overlay, 'out');
                        break;
                    case 'zoom':
                        this.zoomTransition(overlay, 'out');
                        break;
                    case 'flip':
                        this.flipTransition(overlay, direction, 'out');
                        break;
                }
                
                setTimeout(() => {
                    overlay.classList.remove('active');
                    resolve();
                }, this.transitionDuration / 2);
            }, 100);
        });
    }

    // ==============================================
    // TIPI DI TRANSIZIONE
    // ==============================================

    slideTransition(element, direction, phase) {
        const isLeft = direction === 'left' || direction === 'back';
        const translateX = phase === 'in' ? (isLeft ? '-100%' : '100%') : '0%';
        const finalX = phase === 'in' ? '0%' : (isLeft ? '100%' : '-100%');
        
        element.style.transform = `translateX(${translateX})`;
        element.style.transition = `transform ${this.transitionDuration / 2}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        setTimeout(() => {
            element.style.transform = `translateX(${finalX})`;
        }, 50);
    }

    fadeTransition(element, phase) {
        const opacity = phase === 'in' ? '1' : '0';
        element.style.opacity = opacity;
        element.style.transition = `opacity ${this.transitionDuration / 2}ms ease`;
    }

    zoomTransition(element, phase) {
        const scale = phase === 'in' ? 'scale(1)' : 'scale(0.8)';
        const opacity = phase === 'in' ? '1' : '0';
        
        element.style.transform = scale;
        element.style.opacity = opacity;
        element.style.transition = `all ${this.transitionDuration / 2}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    }

    flipTransition(element, direction, phase) {
        const isVertical = direction === 'up' || direction === 'down';
        const isReverse = direction === 'up' || direction === 'left';
        const rotate = isVertical ? 'rotateX' : 'rotateY';
        const deg = phase === 'in' ? (isReverse ? '-90deg' : '90deg') : '0deg';
        const finalDeg = phase === 'in' ? '0deg' : (isReverse ? '90deg' : '-90deg');
        
        element.style.transform = `${rotate}(${deg})`;
        element.style.transition = `transform ${this.transitionDuration / 2}ms ease`;
        
        setTimeout(() => {
            element.style.transform = `${rotate}(${finalDeg})`;
        }, 50);
    }

    // ==============================================
    // GESTIONE GESTURE E SWIPE
    // ==============================================

    setupGestureNavigation() {
        let startX, startY, startTime;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = startY - currentY;
            
            // Visual feedback durante lo swipe
            this.showSwipeIndicator(diffX, diffY);
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            const diffTime = Date.now() - startTime;
            
            // Determina la direzione dello swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50 && diffTime < 300) {
                if (diffX > 0) {
                    this.handleSwipe('left');
                } else {
                    this.handleSwipe('right');
                }
            } else if (Math.abs(diffY) > 50 && diffTime < 300) {
                if (diffY > 0) {
                    this.handleSwipe('up');
                } else {
                    this.handleSwipe('down');
                }
            }
            
            this.hideSwipeIndicator();
            startX = startY = null;
        }, { passive: true });
    }

    showSwipeIndicator(diffX, diffY) {
        let indicator = document.querySelector('.swipe-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'swipe-indicator';
            document.body.appendChild(indicator);
        }
        
        const direction = Math.abs(diffX) > Math.abs(diffY) 
            ? (diffX > 0 ? 'left' : 'right')
            : (diffY > 0 ? 'up' : 'down');
            
        indicator.textContent = `Swipe ${direction}`;
        indicator.style.opacity = Math.min(Math.abs(diffX + diffY) / 100, 1);
    }

    hideSwipeIndicator() {
        const indicator = document.querySelector('.swipe-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
        }
    }

    handleSwipe(direction) {
        console.log(`Swipe detected: ${direction}`);
        
        switch (direction) {
            case 'left':
                this.navigateNext();
                break;
            case 'right':
                this.navigateBack();
                break;
            case 'up':
                this.navigateToSection();
                break;
            case 'down':
                this.navigateToHome();
                break;
        }
    }

    // ==============================================
    // NAVIGAZIONE TASTIERA
    // ==============================================

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.isTransitioning) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.navigateBack();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateToSection();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateToHome();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.navigateToHome();
                    break;
                case ' ':
                    e.preventDefault();
                    this.handleSpaceBar();
                    break;
            }
        });
    }

    // ==============================================
    // LOGICA DI NAVIGAZIONE
    // ==============================================

    navigateNext() {
        // Implementa la logica per andare alla prossima pagina
        console.log('Navigate to next page');
    }

    navigateBack() {
        if (this.history.length > 1) {
            this.history.pop();
            const previousPage = this.history[this.history.length - 1];
            this.navigateToPage(previousPage, 'back', 'slide');
        }
    }

    navigateToSection() {
        // Naviga alla pagina delle sezioni
        this.navigateToPage('sezioni/sommario.html', 'up', 'flip');
    }

    navigateToHome() {
        this.navigateToPage('index.html', 'down', 'fade');
    }

    handleSpaceBar() {
        // Azione personalizzata per la barra spaziatrice
        console.log('Space bar pressed');
    }

    // ==============================================
    // CARICAMENTO PAGINE
    // ==============================================

    async loadPage(url) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simula il caricamento della pagina
                // In un'implementazione reale, qui caricheresti il contenuto
                console.log(`Loading page: ${url}`);
                resolve();
            }, 500);
        });
    }

    preloadPages() {
        // Precarica le pagine più importanti
        const importantPages = [
            'sezioni/sommario.html',
            'sezioni/viaggi.html',
            'sezioni/enogastronomia.html'
        ];
        
        importantPages.forEach(page => {
            this.preloadPage(page);
        });
    }

    async preloadPage(url) {
        try {
            // Implementa il preload delle pagine per performance migliori
            console.log(`Preloading: ${url}`);
        } catch (error) {
            console.warn(`Failed to preload: ${url}`, error);
        }
    }
}

// ==============================================
// STILI CSS PER LE TRANSIZIONI
// ==============================================

const navigationStyles = `
    .page-transition-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, 
            rgba(26, 26, 26, 0.95) 0%, 
            rgba(196, 30, 58, 0.85) 50%, 
            rgba(15, 15, 15, 0.95) 100%);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        backdrop-filter: blur(20px);
        transition: all 0.3s ease;
    }
    
    .page-transition-overlay.active {
        opacity: 1;
        visibility: visible;
    }
    
    .transition-content {
        text-align: center;
        color: white;
        z-index: 2;
        position: relative;
    }
    
    .transition-logo img {
        width: 200px;
        height: auto;
        margin-bottom: 2rem;
        animation: logoSpin 2s ease-in-out infinite alternate;
    }
    
    .transition-progress {
        width: 200px;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        margin: 0 auto 1rem;
        overflow: hidden;
    }
    
    .progress-bar {
        width: 0;
        height: 100%;
        background: linear-gradient(90deg, var(--primary-gold), var(--primary-red));
        border-radius: 2px;
        animation: progressLoad 1s ease-in-out infinite;
    }
    
    .transition-text {
        font-family: var(--font-sans);
        font-size: 0.9rem;
        letter-spacing: 2px;
        opacity: 0.8;
    }
    
    .transition-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }
    
    .swipe-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(196, 30, 58, 0.9);
        color: white;
        padding: 1rem 2rem;
        border-radius: 25px;
        font-weight: 600;
        letter-spacing: 1px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        backdrop-filter: blur(10px);
    }
    
    @keyframes logoSpin {
        0% { transform: rotateY(0deg) scale(1); }
        100% { transform: rotateY(10deg) scale(1.05); }
    }
    
    @keyframes progressLoad {
        0% { width: 0; }
        50% { width: 70%; }
        100% { width: 100%; }
    }
    
    @keyframes particleFloat {
        0%, 100% { 
            transform: translateY(0) rotate(0deg); 
            opacity: 0.7;
        }
        50% { 
            transform: translateY(-20px) rotate(180deg); 
            opacity: 1;
        }
    }
`;

// Inserisci gli stili
const navStyleSheet = document.createElement('style');
navStyleSheet.textContent = navigationStyles;
document.head.appendChild(navStyleSheet);

// ==============================================
// ESPORTAZIONE E INIZIALIZZAZIONE
// ==============================================

// Inizializza il sistema di navigazione
window.navigationSystem = new NavigationSystem();

// Rendi disponibile globalmente
window.NavigationSystem = NavigationSystem;