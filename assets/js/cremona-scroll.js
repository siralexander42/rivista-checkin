/**
 * CREMONA SCROLL EXPERIENCE
 * Gestisce il cambio immagini basato sullo scroll della sezione intera
 */

(function() {
    'use strict';

    function initCremonaScroll() {
        const section = document.querySelector('.cremona-scroll-section');
        const textBlocks = document.querySelectorAll('.cremona-text-block');
        const images = document.querySelectorAll('.cremona-img');
        
        if (!section || !textBlocks.length || !images.length) return;

        console.log('🏛️ Cremona Scroll initialized:', textBlocks.length, 'blocks');

        // Attiva il primo blocco e immagine di default
        if (textBlocks[0]) textBlocks[0].classList.add('active');
        if (images[0]) images[0].classList.add('active');

        // Funzione per determinare quale blocco è più visibile
        function updateActiveBlock() {
            const sectionRect = section.getBoundingClientRect();
            const centerY = window.innerHeight / 2;
            
            let activeBlock = null;
            let minDistance = Infinity;

            textBlocks.forEach((block) => {
                const blockRect = block.getBoundingClientRect();
                const blockCenter = blockRect.top + blockRect.height / 2;
                const distance = Math.abs(blockCenter - centerY);

                if (distance < minDistance && blockRect.top < centerY && blockRect.bottom > centerY) {
                    minDistance = distance;
                    activeBlock = block;
                }
            });

            if (activeBlock) {
                // Attiva il blocco di testo
                textBlocks.forEach(block => block.classList.remove('active'));
                activeBlock.classList.add('active');

                // Cambia l'immagine corrispondente
                const imageIndex = activeBlock.getAttribute('data-image');
                if (imageIndex) {
                    images.forEach(img => img.classList.remove('active'));
                    const targetImage = document.querySelector(`.cremona-img[data-index="${imageIndex}"]`);
                    if (targetImage && !targetImage.classList.contains('active')) {
                        targetImage.classList.add('active');
                        console.log('📸 Image switched to:', imageIndex);
                    }
                }
            }
        }

        // Ascolta lo scroll della sezione
        let ticking = false;
        section.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateActiveBlock();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Aggiorna anche al caricamento
        updateActiveBlock();
    }

    // Inizializza quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCremonaScroll);
    } else {
        initCremonaScroll();
    }

})();
