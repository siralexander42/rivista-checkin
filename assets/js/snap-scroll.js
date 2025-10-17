/**
 * FULLPAGE SCROLL SYSTEM - Effetto rivista con pagine
 * Disabilitato su mobile per scroll nativo
 */

(function() {
    'use strict';

    let currentPageIndex = 0;
    let isAnimating = false;
    let pages = [];
    let canScroll = true;
    let isMobile = false;
    
    // Inizializza dopo che il loading è completato
    window.addEventListener('loadingComplete', init);
    
    function init() {
        console.log('🎬 Inizializzo Fullpage Scroll System...');
        
        // Rileva se siamo su mobile
        isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            console.log('📱 Mobile rilevato - fullpage disabilitato, scroll nativo attivo');
            return; // Non inizializzare fullpage su mobile
        }
        
        // Seleziona tutte le sezioni principali
        pages = Array.from(document.querySelectorAll(
            '.hero-simple, .cremona-scroll-section, .story-section, .carnival-hero-widget, .articles-grid'
        ));
        
        if (pages.length === 0) {
            console.warn('⚠️ Nessuna pagina trovata');
            return;
        }
        
        console.log(`📄 Trovate ${pages.length} pagine - Desktop mode`);
        
        // Setup iniziale delle pagine
        pages.forEach((page, index) => {
            page.classList.add('fp-section');
            page.style.position = 'fixed';
            page.style.top = '0';
            page.style.left = '0';
            page.style.width = '100%';
            page.style.height = '100vh';
            page.style.zIndex = '1';
            
            if (index === 0) {
                page.classList.add('fp-active');
                page.style.opacity = '1';
                page.style.visibility = 'visible';
            } else {
                page.style.opacity = '0';
                page.style.visibility = 'hidden';
            }
        });
        
        // Event listeners
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('keydown', onKeyDown);
        
        // Touch support per tablet
        let touchStartY = 0;
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        window.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    moveDown();
                } else {
                    moveUp();
                }
            }
        }, { passive: true });
        
        console.log('✅ Fullpage Scroll System attivo (Desktop)');
    }
    
    function onWheel(e) {
        e.preventDefault();
        
        if (!canScroll || isAnimating) return;
        
        const currentPage = pages[currentPageIndex];
        
        // Se siamo su Cremona, gestisci lo scroll interno
        if (currentPage && currentPage.classList.contains('cremona-scroll-section')) {
            const scrollTop = currentPage.scrollTop;
            const scrollHeight = currentPage.scrollHeight;
            const clientHeight = currentPage.clientHeight;
            
            const isAtTop = scrollTop <= 1;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
            
            const scrollingDown = e.deltaY > 0;
            const scrollingUp = e.deltaY < 0;
            
            // Se non siamo ai limiti, lascia scrollare internamente
            if ((scrollingDown && !isAtBottom) || (scrollingUp && !isAtTop)) {
                return; // Lascia gestire lo scroll nativo di Cremona
            }
        }
        
        // Cambio pagina
        canScroll = false;
        setTimeout(() => { canScroll = true; }, 700);
        
        if (e.deltaY > 0) {
            moveDown();
        } else {
            moveUp();
        }
    }
    
    function onKeyDown(e) {
        if (isAnimating) return;
        
        switch(e.key) {
            case 'ArrowDown':
            case 'PageDown':
                e.preventDefault();
                moveDown();
                break;
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                moveUp();
                break;
        }
    }
    
    function moveDown() {
        if (currentPageIndex >= pages.length - 1) return;
        moveTo(currentPageIndex + 1);
    }
    
    function moveUp() {
        if (currentPageIndex <= 0) return;
        moveTo(currentPageIndex - 1);
    }
    
    function moveTo(index) {
        if (isAnimating || index < 0 || index >= pages.length) return;
        
        isAnimating = true;
        
        const currentPage = pages[currentPageIndex];
        const nextPage = pages[index];
        const direction = index > currentPageIndex ? 'down' : 'up';
        
        console.log(`📖 Cambio pagina: ${currentPageIndex} → ${index} (${direction})`);
        
        // Rimuovi classi precedenti
        currentPage.className = currentPage.className.replace(/slide-\S+/g, '').trim();
        nextPage.className = nextPage.className.replace(/slide-\S+/g, '').trim();
        
        // Animazione slide
        if (direction === 'down') {
            currentPage.classList.add('slide-out-up');
            nextPage.classList.add('slide-in-from-bottom');
        } else {
            currentPage.classList.add('slide-out-down');
            nextPage.classList.add('slide-in-from-top');
        }
        
        // Setup pagina successiva
        nextPage.style.visibility = 'visible';
        nextPage.style.zIndex = '3';
        nextPage.classList.add('fp-active');
        
        // Rimuovi active dalla corrente
        currentPage.classList.remove('fp-active');
        
        setTimeout(() => {
            currentPage.style.visibility = 'hidden';
            currentPage.style.zIndex = '1';
            currentPage.className = currentPage.className.replace(/slide-\S+/g, '').trim();
            
            nextPage.style.zIndex = '2';
            nextPage.className = nextPage.className.replace(/slide-\S+/g, '').trim();
            nextPage.classList.add('fp-section', 'fp-active');
            
            currentPageIndex = index;
            isAnimating = false;
        }, 700);
    }
    
})();
