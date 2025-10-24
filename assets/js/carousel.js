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
                track.appendChild(clone);
            });
            
            // Clone ALL cards and prepend to start
            [...cards].reverse().forEach(card => {
                const clone = card.cloneNode(true);
                clone.classList.add('clone');
                track.insertBefore(clone, track.firstChild);
            });
            
            // Start at first real card (after prepended clones)
            currentIndex = cards.length;
            const cardWidth = cards[0].offsetWidth + 24;
            track.scrollLeft = currentIndex * cardWidth;
        }
        
        const allCards = Array.from(track.querySelectorAll('.carousel-story-card'));
        const cardWidth = allCards[0].offsetWidth + 24;
        
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
            const scrollAmount = index * cardWidth;
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
                
                const scrollLeft = track.scrollLeft;
                const maxScroll = (cards.length * 2 - 1) * cardWidth;
                const minScroll = cardWidth;
                
                // If scrolled past the end clones, teleport to real cards
                if (scrollLeft >= maxScroll) {
                    isTransitioning = true;
                    track.scrollLeft = scrollLeft - (cards.length * cardWidth);
                    currentIndex = currentIndex - cards.length;
                    updateDots();
                    setTimeout(() => { isTransitioning = false; }, 50);
                }
                // If scrolled before the start clones, teleport to real cards
                else if (scrollLeft <= minScroll) {
                    isTransitioning = true;
                    track.scrollLeft = scrollLeft + (cards.length * cardWidth);
                    currentIndex = currentIndex + cards.length;
                    updateDots();
                    setTimeout(() => { isTransitioning = false; }, 50);
                } else {
                    // Update current index based on scroll position
                    currentIndex = Math.round(scrollLeft / cardWidth);
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
            currentIndex
        });
    });
});
