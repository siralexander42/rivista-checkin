/**
 * SPLIT-FLAP EFFECT - Airport Board Anni '70
 * TEST VISIVO IMMEDIATO
 */

(function() {
    'use strict';

    console.log('🚀 SPLIT-FLAP LOADING...');

    class SplitFlapEffect {
        constructor() {
            this.sections = Array.from(document.querySelectorAll('section'));
            this.currentSection = null;
            console.log('📚 Found', this.sections.length, 'sections total');
            this.init();
        }

        init() {
            console.log('✈️ Split-Flap Effect - INITIALIZING');
            
            // TEST IMMEDIATO - Applica flip alla seconda sezione dopo 2 secondi
            setTimeout(() => {
                const testSection = this.sections.find(s => 
                    !s.classList.contains('hero-simple') && 
                    !s.classList.contains('cremona-scroll-section')
                );
                if (testSection) {
                    console.log('🧪 TEST: Applying flip to', testSection.className);
                    testSection.classList.add('flipped');
                }
            }, 2000);
            
            // Listener scroll normale
            let scrollEndTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollEndTimeout);
                scrollEndTimeout = setTimeout(() => {
                    this.triggerFlipOnCurrentSection();
                }, 150);
            }, { passive: true });
            
            console.log('✅ Listeners attached');
        }

        triggerFlipOnCurrentSection() {
            const windowHeight = window.innerHeight;
            const windowCenter = windowHeight / 2;
            
            let closestSection = null;
            let minDistance = Infinity;
            
            this.sections.forEach(section => {
                // Skip hero e cremona
                if (section.classList.contains('hero-simple') || 
                    section.classList.contains('cremona-scroll-section')) {
                    return;
                }

                const rect = section.getBoundingClientRect();
                const sectionCenter = rect.top + (rect.height / 2);
                const distance = Math.abs(sectionCenter - windowCenter);
                
                if (distance < minDistance && rect.top < windowHeight && rect.bottom > 0) {
                    minDistance = distance;
                    closestSection = section;
                }
            });
            
            if (closestSection && closestSection !== this.currentSection) {
                const sectionId = closestSection.id || closestSection.className.split(' ')[0];
                console.log('📖 FLIP TRIGGERED!', sectionId, 'distance:', minDistance.toFixed(0));
                
                // Remove old
                if (this.currentSection) {
                    this.currentSection.classList.remove('flipped');
                }
                
                // Add new con force reflow
                closestSection.classList.remove('flipped');
                void closestSection.offsetWidth;
                closestSection.classList.add('flipped');
                
                this.currentSection = closestSection;
            }
        }
    }

    // Init con delay per aspettare loading screen
    function initFlip() {
        console.log('🎬 Document ready, creating SplitFlapEffect...');
        new SplitFlapEffect();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFlip);
    } else {
        initFlip();
    }

})();
