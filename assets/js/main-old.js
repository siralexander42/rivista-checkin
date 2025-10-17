// ==============================================
// MAIN JavaScript per CHECK-IN Rivista Digitale
// ==============================================

class CheckInMagazine {
    constructor() {
        this.isLoaded = false;
        this.currentSection = 'home';
        this.init();
    }

    init() {
        this.bindEvents();
        this.handleLoader();
        this.initializeAnimations();
        this.setupParallax();
    }

    // ==============================================
    // GESTIONE LOADER E INIZIALIZZAZIONE
    // ==============================================

    handleLoader() {
        const loader = document.getElementById('loader');
        
        // Simula caricamento delle risorse
        setTimeout(() => {
            loader.classList.add('hidden');
            this.isLoaded = true;
            this.startMainAnimations();
        }, 3500);
    }

    startMainAnimations() {
        // Avvia le animazioni sequenziali della copertina
        this.animateText();
        this.setupMouseEffects();
        this.initializeCardEffects();
    }

    // ==============================================
    // ANIMAZIONI TESTO E ELEMENTI
    // ==============================================

    animateText() {
        // Gli elementi con .animate-text sono già gestiti da CSS
        // Qui aggiungiamo effetti aggiuntivi
        const titleLines = document.querySelectorAll('.title-line');
        
        titleLines.forEach((line, index) => {
            line.addEventListener('animationend', () => {
                this.addTextShimmer(line);
            });
        });
    }

    addTextShimmer(element) {
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        
        const shimmer = document.createElement('div');
        shimmer.style.cssText = `
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
            animation: shimmerEffect 3s ease-in-out infinite;
            pointer-events: none;
        `;
        
        element.appendChild(shimmer);
    }

    // ==============================================
    // EFFETTI MOUSE E PARALLAX
    // ==============================================

    setupMouseEffects() {
        const parallaxBg = document.querySelector('.parallax-bg');
        const coverContent = document.querySelector('.cover-content');
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isLoaded) return;
            
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            // Effetto parallax con mouse
            const moveX = (mouseX - 0.5) * 20;
            const moveY = (mouseY - 0.5) * 20;
            
            parallaxBg.style.transform = `translate(${-5 + moveX}px, ${-5 + moveY}px)`;
            
            // Effetto sottile sui contenuti
            coverContent.style.transform = `translate(${moveX * 0.5}px, ${moveY * 0.5}px)`;
        });
    }

    setupParallax() {
        // Parallax con scroll (per future pagine)
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            const parallaxBg = document.querySelector('.parallax-bg');
            if (parallaxBg) {
                parallaxBg.style.transform = `translate3d(0, ${rate}px, 0)`;
            }
        });
    }

    // ==============================================
    // EFFETTI CARDS E INTERAZIONI
    // ==============================================

    initializeCardEffects() {
        const previewCards = document.querySelectorAll('.preview-card');
        
        previewCards.forEach(card => {
            this.setupCardEffects(card);
        });
    }

    setupCardEffects(card) {
        // Effetto magnetico
        card.addEventListener('mouseenter', (e) => {
            card.style.transition = 'transform 0.3s ease';
            card.style.zIndex = '1000';
        });

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const deltaX = (x - centerX) / centerX;
            const deltaY = (y - centerY) / centerY;
            
            const rotateX = deltaY * 5;
            const rotateY = deltaX * 5;
            
            card.style.transform = `
                translateX(-10px) 
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg) 
                scale(1.02)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.6s ease';
            card.style.transform = 'translateX(0) perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            card.style.zIndex = 'auto';
        });

        // Click effect con ripple
        card.addEventListener('click', (e) => {
            this.createRippleEffect(card, e);
            // Qui implementeremo la navigazione agli articoli
            this.navigateToArticle(card.dataset.article);
        });
    }

    createRippleEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background: rgba(196, 30, 58, 0.6);
            border-radius: 50%;
            transform: scale(0);
            animation: rippleEffect 0.6s ease-out;
            left: ${x - 10}px;
            top: ${y - 10}px;
            pointer-events: none;
            z-index: 1000;
        `;
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // ==============================================
    // NAVIGAZIONE E TRANSIZIONI
    // ==============================================

    bindEvents() {
        // Pulsante principale di entrata
        document.addEventListener('DOMContentLoaded', () => {
            const enterButton = document.getElementById('enterMagazine');
            if (enterButton) {
                enterButton.addEventListener('click', () => {
                    this.enterMagazine();
                });
            }

            // Pulsanti di navigazione sezioni
            const navButtons = document.querySelectorAll('.nav-button');
            navButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.navigateToSection(button.dataset.section);
                });
            });
        });
    }

    enterMagazine() {
        // Transizione di entrata con effetto cinematico
        const cover = document.querySelector('.magazine-cover');
        
        // Effetto zoom out e fade
        cover.style.transition = 'transform 1.5s ease, opacity 1.5s ease';
        cover.style.transform = 'scale(0.8)';
        cover.style.opacity = '0.3';
        
        setTimeout(() => {
            // Qui caricheremo la pagina sommario
            this.loadSummaryPage();
        }, 1500);
    }

    navigateToSection(section) {
        console.log(`Navigating to section: ${section}`);
        // Implementeremo la navigazione alle sezioni
        this.loadSectionPage(section);
    }

    navigateToArticle(articleId) {
        console.log(`Navigating to article: ${articleId}`);
        // Implementeremo la navigazione agli articoli
        this.loadArticlePage(articleId);
    }

    loadSummaryPage() {
        // Placeholder per caricare la pagina sommario
        window.location.href = 'sezioni/sommario.html';
    }

    loadSectionPage(section) {
        // Placeholder per caricare le sezioni
        window.location.href = `sezioni/${section}.html`;
    }

    loadArticlePage(articleId) {
        // Placeholder per caricare gli articoli
        window.location.href = `articoli/${articleId}.html`;
    }

    // ==============================================
    // UTILITY E RESPONSIVE
    // ==============================================

    handleResize() {
        // Gestione del resize della finestra
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // Performance optimization
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// ==============================================
// ANIMAZIONI CSS DINAMICHE
// ==============================================

// Aggiungi stili CSS dinamici per le animazioni
const dynamicStyles = `
    @keyframes shimmerEffect {
        0% { left: -100%; }
        100% { left: 100%; }
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(20);
            opacity: 0;
        }
    }
    
    .page-transition {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, var(--primary-red), var(--primary-dark));
        z-index: 9998;
        opacity: 0;
        visibility: hidden;
        transition: all 1s ease;
    }
    
    .page-transition.active {
        opacity: 1;
        visibility: visible;
    }
`;

// Inserisci gli stili dinamici
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// ==============================================
// INIZIALIZZAZIONE
// ==============================================

// Inizializza l'applicazione quando il DOM è carico
document.addEventListener('DOMContentLoaded', () => {
    window.checkInMagazine = new CheckInMagazine();
    
    // Gestione resize
    window.addEventListener('resize', window.checkInMagazine.debounce(() => {
        window.checkInMagazine.handleResize();
    }, 250));
    
    // Imposta altezza viewport per mobile
    window.checkInMagazine.handleResize();
});

// Prevenzione del reload accidentale durante le transizioni
window.addEventListener('beforeunload', (e) => {
    if (window.checkInMagazine && !window.checkInMagazine.isLoaded) {
        e.preventDefault();
        e.returnValue = '';
    }
});