// ==============================================
// JAVASCRIPT SOMMARIO - INTERAZIONI AVANZATE
// ==============================================

class SommarioPage {
    constructor() {
        this.currentSection = null;
        this.isAnimating = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.setupCardInteractions();
        this.setupResponsiveFeatures();
        this.preloadSections();
    }

    // ==============================================
    // EVENT LISTENERS
    // ==============================================

    setupEventListeners() {
        // Cards delle sezioni
        const sectionCards = document.querySelectorAll('.section-card');
        sectionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const section = card.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Articoli in evidenza
        const featuredArticles = document.querySelectorAll('[data-article]');
        featuredArticles.forEach(article => {
            article.addEventListener('click', (e) => {
                const articleId = article.dataset.article;
                this.navigateToArticle(articleId);
            });
        });

        // Rubriche
        const rubricheItems = document.querySelectorAll('.rubrica-item');
        rubricheItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.openRubrica(item);
            });
        });

        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubmit(e);
            });
        }

        // Scroll per animazioni
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 16));

        // Resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Gesture navigation per mobile
        this.setupGestureNavigation();
    }

    // ==============================================
    // ANIMAZIONI INIZIALI
    // ==============================================

    initializeAnimations() {
        // Anima le card in sequenza
        const sectionCards = document.querySelectorAll('.section-card');
        sectionCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 200 + (index * 150));
        });

        // Anima gli articoli in evidenza
        const featuredItems = document.querySelectorAll('.featured-item');
        featuredItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(30px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.6s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 1000 + (index * 200));
        });

        // Anima le rubriche
        const rubricheItems = document.querySelectorAll('.rubrica-item');
        rubricheItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(30px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.6s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, 1500 + (index * 100));
        });
    }

    // ==============================================
    // INTERAZIONI CARDS
    // ==============================================

    setupCardInteractions() {
        const sectionCards = document.querySelectorAll('.section-card');
        
        sectionCards.forEach(card => {
            // Effetto magnetico
            card.addEventListener('mousemove', (e) => {
                this.createMagneticEffect(card, e);
            });

            card.addEventListener('mouseleave', () => {
                this.resetMagneticEffect(card);
            });

            // Effetto ripple al click
            card.addEventListener('click', (e) => {
                this.createRippleEffect(card, e);
            });

            // Preview al hover
            card.addEventListener('mouseenter', () => {
                this.showCardPreview(card);
            });

            card.addEventListener('mouseleave', () => {
                this.hideCardPreview(card);
            });
        });

        // Interazioni articoli in evidenza
        const featuredArticles = document.querySelectorAll('[data-article]');
        featuredArticles.forEach(article => {
            article.addEventListener('mouseenter', () => {
                this.highlightArticle(article);
            });

            article.addEventListener('mouseleave', () => {
                this.unhighlightArticle(article);
            });
        });
    }

    createMagneticEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;
        
        const rotateX = deltaY * 8;
        const rotateY = deltaX * 8;
        const translateX = deltaX * 10;
        const translateY = deltaY * 10;
        
        element.style.transform = `
            perspective(1000px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            translateX(${translateX}px)
            translateY(${translateY}px)
            scale(1.02)
        `;
    }

    resetMagneticEffect(element) {
        element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateX(0) translateY(0) scale(1)';
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
            animation: ripple 0.8s ease-out;
            left: ${x - 10}px;
            top: ${y - 10}px;
            pointer-events: none;
            z-index: 1000;
        `;
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 800);
    }

    showCardPreview(card) {
        const section = card.dataset.section;
        // Implementa preview dei contenuti della sezione
        console.log(`Showing preview for section: ${section}`);
        
        // Aggiunge un effetto di glow
        card.style.boxShadow = '0 0 30px rgba(196, 30, 58, 0.4)';
    }

    hideCardPreview(card) {
        card.style.boxShadow = '';
    }

    highlightArticle(article) {
        article.style.transform = 'translateY(-5px) scale(1.02)';
        article.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.3)';
    }

    unhighlightArticle(article) {
        article.style.transform = '';
        article.style.boxShadow = '';
    }

    // ==============================================
    // NAVIGAZIONE
    // ==============================================

    async navigateToSection(section) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        console.log(`Navigating to section: ${section}`);
        
        // Effetto di transizione
        await this.createTransitionEffect('section');
        
        // Qui implementeremo il caricamento della sezione
        window.location.href = `${section}.html`;
        
        this.isAnimating = false;
    }

    async navigateToArticle(articleId) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        console.log(`Navigating to article: ${articleId}`);
        
        // Effetto di transizione
        await this.createTransitionEffect('article');
        
        // Qui implementeremo il caricamento dell'articolo
        window.location.href = `../articoli/${articleId}.html`;
        
        this.isAnimating = false;
    }

    openRubrica(rubricaItem) {
        // Implementa l'apertura delle rubriche
        const title = rubricaItem.querySelector('.rubrica-title').textContent;
        console.log(`Opening rubrica: ${title}`);
        
        // Effetto di espansione
        rubricaItem.style.transform = 'scale(1.05)';
        setTimeout(() => {
            rubricaItem.style.transform = '';
        }, 200);
    }

    async createTransitionEffect(type) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'page-transition-effect';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, 
                    rgba(26, 26, 26, 0.95), 
                    rgba(196, 30, 58, 0.9));
                z-index: 9999;
                opacity: 0;
                backdrop-filter: blur(0px);
                transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            `;
            
            document.body.appendChild(overlay);
            
            // Anima l'overlay
            setTimeout(() => {
                overlay.style.opacity = '1';
                overlay.style.backdropFilter = 'blur(20px)';
            }, 50);
            
            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 800);
        });
    }

    // ==============================================
    // NEWSLETTER
    // ==============================================

    async handleNewsletterSubmit(event) {
        const form = event.target;
        const email = form.querySelector('.newsletter-input').value;
        const button = form.querySelector('.newsletter-button');
        
        if (!this.isValidEmail(email)) {
            this.showNotification('Inserisci un indirizzo email valido', 'error');
            return;
        }
        
        // Animazione di caricamento
        const originalText = button.textContent;
        button.textContent = 'INVIANDO...';
        button.disabled = true;
        
        try {
            // Simula l'invio
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showNotification('Iscrizione completata! Grazie.', 'success');
            form.reset();
            
        } catch (error) {
            this.showNotification('Errore durante l\'iscrizione. Riprova.', 'error');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 25px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'success' ? 'background: linear-gradient(45deg, #4CAF50, #45a049);' : 'background: linear-gradient(45deg, #f44336, #da190b);'}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // ==============================================
    // GESTURE NAVIGATION
    // ==============================================

    setupGestureNavigation() {
        let startX, startY, startTime;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            const diffTime = Date.now() - startTime;
            
            // Swipe detection
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100 && diffTime < 300) {
                if (diffX > 0) {
                    this.handleSwipeLeft();
                } else {
                    this.handleSwipeRight();
                }
            }
            
            startX = startY = null;
        }, { passive: true });
    }

    handleSwipeLeft() {
        // Naviga alla prossima sezione
        console.log('Swipe left detected');
    }

    handleSwipeRight() {
        // Torna indietro
        window.history.back();
    }

    // ==============================================
    // SCROLL E RESPONSIVE
    // ==============================================

    handleScroll() {
        const scrollY = window.scrollY;
        const panels = document.querySelectorAll('.sommario-panel');
        
        panels.forEach((panel, index) => {
            const rect = panel.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                const scrollProgress = Math.max(0, Math.min(1, 
                    (window.innerHeight - rect.top) / window.innerHeight
                ));
                
                // Effetto parallax leggero
                const offset = scrollProgress * 20;
                panel.style.transform = `translateY(${offset}px)`;
            }
        });
    }

    handleResize() {
        // Adatta il layout per diverse dimensioni
        const width = window.innerWidth;
        
        if (width < 768) {
            this.enableMobileLayout();
        } else {
            this.enableDesktopLayout();
        }
    }

    enableMobileLayout() {
        // Ottimizzazioni per mobile
        const panels = document.querySelectorAll('.sommario-panel');
        panels.forEach(panel => {
            panel.style.transform = 'none';
        });
    }

    enableDesktopLayout() {
        // Ripristina effetti desktop
        // Implementa se necessario
    }

    // ==============================================
    // PRELOAD E PERFORMANCE
    // ==============================================

    preloadSections() {
        const sections = ['viaggi', 'enogastronomia', 'ospitalita', 'cultura'];
        
        sections.forEach(section => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = `${section}.html`;
            document.head.appendChild(link);
        });
    }

    // ==============================================
    // UTILITY FUNCTIONS
    // ==============================================

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

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
// STILI CSS DINAMICI
// ==============================================

const sommarioStyles = `
    @keyframes ripple {
        to {
            transform: scale(20);
            opacity: 0;
        }
    }
    
    .notification {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    
    .page-transition-effect {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .page-transition-effect::before {
        content: '';
        width: 50px;
        height: 50px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top: 3px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

// Inserisci gli stili
const sommarioStyleSheet = document.createElement('style');
sommarioStyleSheet.textContent = sommarioStyles;
document.head.appendChild(sommarioStyleSheet);

// ==============================================
// INIZIALIZZAZIONE
// ==============================================

document.addEventListener('DOMContentLoaded', () => {
    window.sommarioPage = new SommarioPage();
});