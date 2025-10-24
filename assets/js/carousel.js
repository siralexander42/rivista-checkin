/**
 * Carousel Stories - JavaScript
 * Gestisce la navigazione e lo scroll del carousel con supporto per modalità infinita
 */

document.addEventListener('DOMContentLoaded', function() {
    // === CAROUSEL STORIES ===
    document.querySelectorAll('.carousel-stories-track').forEach(track => {
        const carouselId = track.getAttribute('data-carousel');
        const isInfinite = track.getAttribute('data-infinite') === 'true';
        const cards = Array.from(track.querySelectorAll('.carousel-story-card'));
        const prevBtn = document.querySelector(`.carousel-nav-btn.prev[data-carousel="${carouselId}"]`);
        const nextBtn = document.querySelector(`.carousel-nav-btn.next[data-carousel="${carouselId}"]`);
        const dots = document.querySelectorAll(`.carousel-dot[data-carousel="${carouselId}"]`);
        
        if (cards.length === 0) return;
        
        let currentIndex = 0;
        let isTransitioning = false;
        
        // INFINITE LOOP: Clone ALL cards
        if (isInfinite && cards.length > 0) {
            // Clone ALL cards and append to end
            cards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.classList.add('clone');
                clone.setAttribute('data-cloned', 'end');
                track.appendChild(clone);
            });
            
            // Clone ALL cards and prepend to start
            [...cards].reverse().forEach(card => {
                const clone = card.cloneNode(true);
                clone.classList.add('clone');
                clone.setAttribute('data-cloned', 'start');
                track.insertBefore(clone, track.firstChild);
            });
            
            // Start at first real card (after prepended clones)
            currentIndex = cards.length;
            // Wait for layout calculation before setting scroll position
            setTimeout(() => {
                const currentCardWidth = getCardWidth();
                track.scrollTo({
                    left: currentIndex * currentCardWidth,
                    behavior: 'auto'
                });
            }, 10);
        }
        
        const allCards = Array.from(track.querySelectorAll('.carousel-story-card'));
        
        // Calcola la larghezza della card includendo margini
        const getCardWidth = () => {
            if (allCards.length === 0) return 0;
            const card = allCards[0];
            const marginRight = parseInt(getComputedStyle(card).marginRight) || 0;
            return card.offsetWidth + marginRight;
        };
        
        const cardWidth = getCardWidth();
        
        function updateDots() {
            if (isInfinite) {
                const realIndex = (currentIndex - cards.length + cards.length) % cards.length;
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === realIndex);
                });
            } else {
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === currentIndex);
                });
            }
        }
        
        function scrollToIndex(index, smooth = true) {
            const currentCardWidth = getCardWidth();
            const scrollAmount = index * currentCardWidth;
            track.scrollTo({
                left: scrollAmount,
                behavior: smooth ? 'smooth' : 'auto'
            });
            currentIndex = index;
            updateDots();
            
            // Update button visibility (only for non-infinite)
            if (!isInfinite && prevBtn && nextBtn) {
                prevBtn.style.opacity = currentIndex > 0 ? '1' : '0';
                nextBtn.style.opacity = currentIndex < allCards.length - 1 ? '1' : '0';
            }
        }
        
        // Infinite scroll: monitor scroll position and teleport seamlessly
        if (isInfinite) {
            track.addEventListener('scroll', () => {
                if (isTransitioning) return;
                
                const currentCardWidth = getCardWidth();
                const scrollLeft = track.scrollLeft;
                
                // Calcola bounds per il teletrasporto
                // Total cards = original + clones at start + clones at end
                const totalCards = cards.length * 3; // original + start clones + end clones
                const maxScrollThreshold = (cards.length * 2) * currentCardWidth; // End of clones at end
                const minScrollThreshold = (cards.length - 1) * currentCardWidth; // Start of first clones
                
                // If scrolled past the end clones, teleport to equivalent position in original cards
                if (scrollLeft >= maxScrollThreshold) {
                    isTransitioning = true;
                    const newScrollLeft = scrollLeft - (cards.length * currentCardWidth);
                    track.scrollTo({
                        left: newScrollLeft,
                        behavior: 'auto'
                    });
                    currentIndex = Math.round(newScrollLeft / currentCardWidth);
                    updateDots();
                    setTimeout(() => { isTransitioning = false; }, 100);
                }
                // If scrolled before the start clones, teleport to equivalent position in end clones
                else if (scrollLeft <= minScrollThreshold) {
                    isTransitioning = true;
                    const newScrollLeft = scrollLeft + (cards.length * currentCardWidth);
                    track.scrollTo({
                        left: newScrollLeft,
                        behavior: 'auto'
                    });
                    currentIndex = Math.round(newScrollLeft / currentCardWidth);
                    updateDots();
                    setTimeout(() => { isTransitioning = false; }, 100);
                } else {
                    // Update current index based on scroll position
                    currentIndex = Math.round(scrollLeft / currentCardWidth);
                    updateDots();
                }
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (isInfinite) {
                    currentIndex--;
                    scrollToIndex(currentIndex);
                } else {
                    const newIndex = Math.max(0, currentIndex - 1);
                    scrollToIndex(newIndex);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (isInfinite) {
                    currentIndex++;
                    scrollToIndex(currentIndex);
                } else {
                    const newIndex = Math.min(allCards.length - 1, currentIndex + 1);
                    scrollToIndex(newIndex);
                }
            });
        }
        
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.getAttribute('data-index'));
                if (isInfinite) {
                    scrollToIndex(index + cards.length); // Offset for prepended clones
                } else {
                    scrollToIndex(index);
                }
            });
        });
        
        // Initialize button visibility
        if (!isInfinite && prevBtn && nextBtn) {
            prevBtn.style.opacity = '0';
            nextBtn.style.opacity = '1';
        } else if (isInfinite && prevBtn && nextBtn) {
            prevBtn.style.opacity = '1';
            nextBtn.style.opacity = '1';
        }
        
        // Log per debug
        console.log(`✅ Carousel ${carouselId} initialized:`, {
            infinite: isInfinite,
            originalCards: cards.length,
            totalCards: allCards.length,
            currentIndex,
            cardWidth: getCardWidth(),
            infiniteAttr: track.getAttribute('data-infinite')
        });
        
        // Se il carosello è infinito, verifica che abbia abbastanza card
        if (isInfinite && cards.length < 3) {
            console.warn(`⚠️ Carosello infinito con ${cards.length} card potrebbe non funzionare correttamente. Raccomandato minimo 3 card.`);
        }
    });
});
