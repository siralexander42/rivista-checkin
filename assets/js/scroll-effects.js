// ==============================================
// SCROLL EFFECTS AVANZATI - STILE APPLE
// ==============================================

class ScrollEffects {
    constructor() {
        this.init();
    }

    init() {
        this.initPinnedSections();
        this.initImageSequence();
        this.initHorizontalScroll();
        this.initRevealOnScroll();
    }

    // ==============================================
    // SEZIONI PINNED - Testo fisso, immagini scorrono
    // ==============================================
    initPinnedSections() {
        const pinnedSections = document.querySelectorAll('.pinned-section');
        
        pinnedSections.forEach(section => {
            const content = section.querySelector('.pinned-content');
            const images = section.querySelector('.scrolling-images');
            const imageItems = images?.querySelectorAll('.scroll-image-item');
            
            if (!content || !images || !imageItems) return;

            let observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animatePinnedSection(section, content, images, imageItems);
                    }
                });
            }, {
                threshold: 0.1
            });

            observer.observe(section);
        });
    }

    animatePinnedSection(section, content, images, imageItems) {
        window.addEventListener('scroll', () => {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top;
            const sectionHeight = rect.height;
            const windowHeight = window.innerHeight;

            // Calcola progress (0 = top dello schermo, 1 = bottom)
            const progress = Math.max(0, Math.min(1, -sectionTop / (sectionHeight - windowHeight)));

            // Pin il contenuto quando la sezione è visibile
            if (sectionTop <= 0 && sectionTop + sectionHeight > windowHeight) {
                content.style.position = 'fixed';
                content.style.top = '50%';
                content.style.transform = 'translateY(-50%)';
            } else if (sectionTop > 0) {
                content.style.position = 'absolute';
                content.style.top = '50%';
                content.style.transform = 'translateY(-50%)';
            } else {
                content.style.position = 'absolute';
                content.style.top = 'auto';
                content.style.bottom = '0';
                content.style.transform = 'none';
            }

            // Scrolla le immagini
            const totalImages = imageItems.length;
            const currentIndex = Math.floor(progress * totalImages);

            imageItems.forEach((item, index) => {
                const itemProgress = Math.max(0, Math.min(1, (progress * totalImages) - index));
                
                if (index === currentIndex) {
                    item.style.opacity = '1';
                    item.style.transform = `translateY(${(1 - itemProgress) * 100}px) scale(${0.9 + itemProgress * 0.1})`;
                } else if (index < currentIndex) {
                    item.style.opacity = '0.3';
                    item.style.transform = 'translateY(-50px) scale(0.9)';
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(100px) scale(0.9)';
                }
            });
        }, { passive: true });
    }

    // ==============================================
    // IMAGE SEQUENCE - Animazione frame by frame
    // ==============================================
    initImageSequence() {
        const sequences = document.querySelectorAll('.image-sequence');
        
        sequences.forEach(sequence => {
            const canvas = sequence.querySelector('canvas');
            const images = JSON.parse(sequence.dataset.images || '[]');
            
            if (!canvas || images.length === 0) return;

            const context = canvas.getContext('2d');
            const imageObjects = [];
            let imagesLoaded = 0;

            // Preload images
            images.forEach((src, index) => {
                const img = new Image();
                img.onload = () => {
                    imagesLoaded++;
                    if (imagesLoaded === images.length) {
                        this.animateSequence(sequence, canvas, context, imageObjects);
                    }
                };
                img.src = src;
                imageObjects[index] = img;
            });
        });
    }

    animateSequence(sequence, canvas, context, images) {
        const updateCanvas = () => {
            const rect = sequence.getBoundingClientRect();
            const scrollProgress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
            
            const frameIndex = Math.min(
                images.length - 1,
                Math.floor(scrollProgress * images.length)
            );

            const img = images[frameIndex];
            if (img && img.complete) {
                canvas.width = img.width;
                canvas.height = img.height;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, 0, 0);
            }
        };

        window.addEventListener('scroll', updateCanvas, { passive: true });
        updateCanvas();
    }

    // ==============================================
    // HORIZONTAL SCROLL - Scroll orizzontale
    // ==============================================
    initHorizontalScroll() {
        const horizontalSections = document.querySelectorAll('.horizontal-scroll');
        
        horizontalSections.forEach(section => {
            const wrapper = section.querySelector('.horizontal-wrapper');
            const items = section.querySelectorAll('.horizontal-item');
            
            if (!wrapper || !items.length) return;

            const totalWidth = items.length * items[0].offsetWidth;
            section.style.height = totalWidth + 'px';

            window.addEventListener('scroll', () => {
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top;
                const progress = -sectionTop / (rect.height - window.innerHeight);
                
                if (progress >= 0 && progress <= 1) {
                    const translateX = progress * (totalWidth - window.innerWidth);
                    wrapper.style.transform = `translateX(-${translateX}px)`;
                }
            }, { passive: true });
        });
    }

    // ==============================================
    // REVEAL ON SCROLL - Elementi che appaiono
    // ==============================================
    initRevealOnScroll() {
        const reveals = document.querySelectorAll('[data-reveal]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    
                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                    }, delay);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        reveals.forEach(el => observer.observe(el));
    }
}

// ==============================================
// PARALLAX LAYERS
// ==============================================

class ParallaxLayers {
    constructor() {
        this.init();
    }

    init() {
        const layers = document.querySelectorAll('[data-speed]');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            layers.forEach(layer => {
                const speed = parseFloat(layer.dataset.speed);
                const yPos = -(scrolled * speed);
                layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
        }, { passive: true });
    }
}

// ==============================================
// WIDGET INTERATTIVI
// ==============================================

class InteractiveWidgets {
    constructor() {
        this.init();
    }

    init() {
        this.initStatsCounter();
        this.initFlipCards();
        this.initExpandables();
    }

    initStatsCounter() {
        const counters = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.target);
                    this.animateCounter(entry.target, target);
                    observer.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element, target) {
        let current = 0;
        const increment = target / 60;
        const duration = 2000;
        const stepTime = duration / 60;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, stepTime);
    }

    initFlipCards() {
        const cards = document.querySelectorAll('.flip-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });
        });
    }

    initExpandables() {
        const expandables = document.querySelectorAll('.expandable');
        
        expandables.forEach(item => {
            const trigger = item.querySelector('.expandable-trigger');
            const content = item.querySelector('.expandable-content');
            
            if (trigger && content) {
                trigger.addEventListener('click', () => {
                    const isOpen = item.classList.contains('open');
                    
                    if (isOpen) {
                        content.style.maxHeight = '0';
                        item.classList.remove('open');
                    } else {
                        content.style.maxHeight = content.scrollHeight + 'px';
                        item.classList.add('open');
                    }
                });
            }
        });
    }
}

// ==============================================
// INIZIALIZZAZIONE
// ==============================================

document.addEventListener('DOMContentLoaded', () => {
    new ScrollEffects();
    new ParallaxLayers();
    new InteractiveWidgets();
    
    console.log('🎯 Scroll effects initialized');
});