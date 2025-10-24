/**
 * Carousel Stories - JavaScript
 * Gestisce la navigazione e lo scroll del carousel con supporto per modalità infinita
 */

document.addEventListener('DOMContentLoaded', function() {
    // === CAROUSEL STORIES ===
    document.querySelectorAll('.carousel-stories-track').forEach(track => {
        const carouselId = track.getAttribute('data-carousel');
        const isInfinite = track.getAttribute('data-infinite') === 'true';
        const cards = track.querySelectorAll('.carousel-story-card');
        const prevBtn = document.querySelector(`.carousel-nav-btn.prev[data-carousel="${carouselId}"]`);
        const nextBtn = document.querySelector(`.carousel-nav-btn.next[data-carousel="${carouselId}"]`);
        const dots = document.querySelectorAll(`.carousel-dot[data-carousel="${carouselId}"]`);
        
        if (cards.length === 0) return;
        
        let currentIndex = 0;
        const cardWidth = cards[0].offsetWidth + 24; // card width + gap
        
        function scrollToIndex(index) {
            const scrollAmount = index * cardWidth;
            track.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
            currentIndex = index;
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            
            // Update button visibility (only for non-infinite)
            if (!isInfinite && prevBtn && nextBtn) {
                prevBtn.style.opacity = currentIndex > 0 ? '1' : '0';
                nextBtn.style.opacity = currentIndex < cards.length - 1 ? '1' : '0';
            }
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                let newIndex;
                if (isInfinite) {
                    // Modalità circolare: dalla prima card torna all'ultima
                    newIndex = currentIndex - 1 < 0 ? cards.length - 1 : currentIndex - 1;
                } else {
                    // Modalità normale: si ferma alla prima
                    newIndex = Math.max(0, currentIndex - 1);
                }
                scrollToIndex(newIndex);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                let newIndex;
                if (isInfinite) {
                    // Modalità circolare: dall'ultima card torna alla prima
                    newIndex = (currentIndex + 1) % cards.length;
                } else {
                    // Modalità normale: si ferma all'ultima
                    newIndex = Math.min(cards.length - 1, currentIndex + 1);
                }
                scrollToIndex(newIndex);
            });
        }
        
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.getAttribute('data-index'));
                scrollToIndex(index);
            });
        });
        
        // Initialize button visibility
        if (!isInfinite && prevBtn && nextBtn) {
            // Modalità normale: nasconde prev all'inizio
            prevBtn.style.opacity = '0';
            nextBtn.style.opacity = '1';
        } else if (isInfinite && prevBtn && nextBtn) {
            // Modalità infinita: entrambi sempre visibili
            prevBtn.style.opacity = '1';
            nextBtn.style.opacity = '1';
        }
        
        // Log per debug
        console.log(`Carousel ${carouselId} initialized:`, {
            infinite: isInfinite,
            cards: cards.length,
            currentIndex
        });
    });
});
