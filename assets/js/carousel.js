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
        
        // INFINITE LOOP: Clone first and last cards
        if (isInfinite && cards.length > 0) {
            // Clone first 3 cards and append to end
            const firstClones = cards.slice(0, 3).map(card => {
                const clone = card.cloneNode(true);
                clone.classList.add('clone');
                return clone;
            });
            
            // Clone last 3 cards and prepend to start
            const lastClones = cards.slice(-3).map(card => {
                const clone = card.cloneNode(true);
                clone.classList.add('clone');
                return clone;
            });
            
            // Add clones
            lastClones.forEach(clone => track.insertBefore(clone, track.firstChild));
            firstClones.forEach(clone => track.appendChild(clone));
            
            // Start at first real card (after prepended clones)
            currentIndex = 3;
            const cardWidth = cards[0].offsetWidth + 24;
            track.scrollLeft = currentIndex * cardWidth;
        }
        
        const allCards = Array.from(track.querySelectorAll('.carousel-story-card'));
        const cardWidth = allCards[0].offsetWidth + 24;
        
        function scrollToIndex(index, smooth = true) {
            if (isTransitioning) return;
            
            const scrollAmount = index * cardWidth;
            track.scrollTo({
                left: scrollAmount,
                behavior: smooth ? 'smooth' : 'auto'
            });
            currentIndex = index;
            
            // Update dots (only for real cards, not clones)
            if (isInfinite) {
                const realIndex = (index - 3 + cards.length) % cards.length;
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === realIndex);
                });
            } else {
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
            }
            
            // Update button visibility (only for non-infinite)
            if (!isInfinite && prevBtn && nextBtn) {
                prevBtn.style.opacity = currentIndex > 0 ? '1' : '0';
                nextBtn.style.opacity = currentIndex < allCards.length - 1 ? '1' : '0';
            }
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (isTransitioning) return;
                
                if (isInfinite) {
                    currentIndex--;
                    scrollToIndex(currentIndex);
                    
                    // Check if we need to "teleport"
                    if (currentIndex <= 2) {
                        isTransitioning = true;
                        setTimeout(() => {
                            // Jump to end (without animation)
                            currentIndex = cards.length + 2;
                            scrollToIndex(currentIndex, false);
                            isTransitioning = false;
                        }, 300);
                    }
                } else {
                    const newIndex = Math.max(0, currentIndex - 1);
                    scrollToIndex(newIndex);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (isTransitioning) return;
                
                if (isInfinite) {
                    currentIndex++;
                    scrollToIndex(currentIndex);
                    
                    // Check if we need to "teleport"
                    if (currentIndex >= cards.length + 3) {
                        isTransitioning = true;
                        setTimeout(() => {
                            // Jump to start (without animation)
                            currentIndex = 3;
                            scrollToIndex(currentIndex, false);
                            isTransitioning = false;
                        }, 300);
                    }
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
                    scrollToIndex(index + 3); // Offset for clones
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
            currentIndex
        });
    });
});
