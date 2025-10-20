/**
 * PAGE NAVIGATION - Magazine-style scroll snap controller
 * Gestisce il tracking delle "pagine" e l'indicatore visivo
 */

(function() {
    'use strict';

    class PageNavigation {
        constructor() {
            this.sections = document.querySelectorAll('section[id]');
            this.currentPage = 1;
            this.totalPages = this.sections.length;
            this.indicator = null;
            this.init();
        }

        init() {
            console.log('📖 Page Navigation initialized:', this.totalPages, 'pages');

            // Crea indicatore pagine
            this.createIndicator();

            // Setup Intersection Observer per tracking
            this.setupPageObserver();

            // Touch gestures per mobile
            this.setupTouchGestures();

            // Mostra indicatore dopo 2 secondi
            setTimeout(() => {
                if (this.indicator) {
                    this.indicator.classList.add('visible');
                }
            }, 2000);

            // Nascondi dopo 3 secondi di inattività
            this.setupAutoHide();
        }

        createIndicator() {
            this.indicator = document.createElement('div');
            this.indicator.className = 'page-indicator';
            this.indicator.innerHTML = `
                <span class="current-page">${this.currentPage}</span> / <span class="total-pages">${this.totalPages}</span>
            `;
            document.body.appendChild(this.indicator);
        }

        updateIndicator(pageNumber) {
            if (this.currentPage === pageNumber) return;
            
            this.currentPage = pageNumber;
            const currentPageSpan = this.indicator.querySelector('.current-page');
            if (currentPageSpan) {
                currentPageSpan.textContent = this.currentPage;
            }

            // Mostra temporaneamente l'indicatore
            this.showIndicator();
            console.log('📄 Current page:', this.currentPage);
        }

        showIndicator() {
            if (this.indicator) {
                this.indicator.classList.add('visible');
                
                // Reset auto-hide timer
                clearTimeout(this.hideTimeout);
                this.hideTimeout = setTimeout(() => {
                    this.indicator.classList.remove('visible');
                }, 3000);
            }
        }

        setupPageObserver() {
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.5 // Sezione è "attiva" quando 50% visibile
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Aggiungi classe in-view per animazioni
                        entry.target.classList.add('in-view');
                        
                        // Calcola numero pagina
                        const pageNumber = Array.from(this.sections).indexOf(entry.target) + 1;
                        this.updateIndicator(pageNumber);
                    } else {
                        // Rimuovi classe quando esce dal viewport
                        entry.target.classList.remove('in-view');
                    }
                });
            }, observerOptions);

            // Osserva tutte le sezioni
            this.sections.forEach(section => {
                observer.observe(section);
            });

            // Attiva la prima sezione immediatamente
            if (this.sections[0]) {
                this.sections[0].classList.add('in-view');
            }
        }

        setupTouchGestures() {
            let touchStartY = 0;
            let touchEndY = 0;

            document.addEventListener('touchstart', (e) => {
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                touchEndY = e.changedTouches[0].screenY;
                this.handleSwipe(touchStartY, touchEndY);
            }, { passive: true });
        }

        handleSwipe(startY, endY) {
            const swipeDistance = startY - endY;
            const threshold = 50; // Minimo 50px per considerarlo swipe

            if (Math.abs(swipeDistance) > threshold) {
                // Mostra indicatore durante swipe
                this.showIndicator();

                // Swipe up = pagina successiva
                // Swipe down = pagina precedente
                const currentSection = document.querySelector('section.in-view');
                if (!currentSection) return;

                const targetSection = swipeDistance > 0 
                    ? currentSection.nextElementSibling 
                    : currentSection.previousElementSibling;

                if (targetSection && targetSection.tagName === 'SECTION' && targetSection.hasAttribute('id')) {
                    targetSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        }

        setupAutoHide() {
            let scrollTimeout;
            
            window.addEventListener('scroll', () => {
                // Mostra durante scroll
                this.showIndicator();
            }, { passive: true });
        }
    }

    // Inizializza dopo DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new PageNavigation();
        });
    } else {
        new PageNavigation();
    }

})();
