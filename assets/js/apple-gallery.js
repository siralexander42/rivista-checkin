// ==============================================
// APPLE-STYLE GALLERY - CHECK-IN
// ==============================================

class AppleGallery {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 0;
        this.isAnimating = false;
        this.autoplayInterval = null;
        this.autoplayDelay = 5000;
        this.init();
    }

    init() {
        this.setupControls();
        this.setupAutoplay();
        this.setupKeyboard();
        this.setupSwipe();
        this.setupIntersectionObserver();
        
        // Attendi che gli articoli siano caricati
        setTimeout(() => {
            this.updateSlideCount();
            this.startAutoplay();
        }, 1000);
    }

    setupControls() {
        const prevBtn = document.querySelector('.gallery-nav.prev');
        const nextBtn = document.querySelector('.gallery-nav.next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSlide());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }
    }

    setupAutoplay() {
        const gallery = document.querySelector('.gallery-section');
        
        if (gallery) {
            gallery.addEventListener('mouseenter', () => this.stopAutoplay());
            gallery.addEventListener('mouseleave', () => this.startAutoplay());
        }
    }

    startAutoplay() {
        this.stopAutoplay();
        this.autoplayInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoplayDelay);
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
            }
        });
    }

    setupSwipe() {
        const gallery = document.querySelector('.gallery-container');
        if (!gallery) return;

        let startX = 0;
        let startY = 0;
        let diffX = 0;

        gallery.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        gallery.addEventListener('touchmove', (e) => {
            if (!startX) return;
            diffX = e.touches[0].clientX - startX;
            const diffY = e.touches[0].clientY - startY;

            // Se è uno swipe orizzontale
            if (Math.abs(diffX) > Math.abs(diffY)) {
                e.preventDefault();
            }
        }, { passive: false });

        gallery.addEventListener('touchend', () => {
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.previousSlide();
                } else {
                    this.nextSlide();
                }
            }
            startX = 0;
            diffX = 0;
        }, { passive: true });
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.startAutoplay();
                } else {
                    this.stopAutoplay();
                }
            });
        }, options);

        const gallerySection = document.querySelector('.gallery-section');
        if (gallerySection) {
            observer.observe(gallerySection);
        }
    }

    updateSlideCount() {
        const items = document.querySelectorAll('.gallery-item');
        this.totalSlides = items.length;
    }

    nextSlide() {
        if (this.isAnimating) return;
        
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(this.currentSlide);
    }

    previousSlide() {
        if (this.isAnimating) return;
        
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(this.currentSlide);
    }

    goToSlide(index) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentSlide = index;

        const items = document.querySelectorAll('.gallery-item');
        const dots = document.querySelectorAll('.gallery-dot');
        const track = document.querySelector('.gallery-track');

        // Rimuovi active da tutti
        items.forEach(item => item.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Aggiungi active al corrente
        if (items[index]) {
            items[index].classList.add('active');
            
            // Effetto parallax
            this.applyParallaxEffect(items[index]);
        }
        
        if (dots[index]) {
            dots[index].classList.add('active');
        }

        // Trasla il track
        if (track) {
            const translateX = -index * 100;
            track.style.transform = `translateX(${translateX}%)`;
        }

        // Reset animazione
        setTimeout(() => {
            this.isAnimating = false;
        }, 800);

        // Reset e restart autoplay
        this.startAutoplay();
    }

    applyParallaxEffect(item) {
        const image = item.querySelector('.gallery-image img');
        const content = item.querySelector('.gallery-content');
        
        if (image) {
            image.style.transform = 'scale(1) translateY(0)';
            setTimeout(() => {
                image.style.transform = 'scale(1.02) translateY(-10px)';
            }, 100);
        }

        if (content) {
            const elements = content.querySelectorAll('.gallery-category, .gallery-title, .gallery-description, .gallery-link');
            elements.forEach((el, i) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    el.style.transition = 'all 0.6s cubic-bezier(0.28, 0.11, 0.32, 1)';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 200 + (i * 100));
            });
        }
    }
}

// ==============================================
// SEZIONI INTERATTIVE
// ==============================================

class SectionsInteractive {
    constructor() {
        this.init();
    }

    init() {
        this.setupSectionCards();
        this.setupScrollAnimations();
    }

    setupSectionCards() {
        const cards = document.querySelectorAll('.section-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const section = card.dataset.section;
                this.navigateToSection(section);
            });

            // Effetto mouse move 3D
            card.addEventListener('mousemove', (e) => {
                this.apply3DEffect(card, e);
            });

            card.addEventListener('mouseleave', () => {
                this.reset3DEffect(card);
            });
        });
    }

    apply3DEffect(card, event) {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `
            perspective(1000px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            translateY(-8px)
            scale(1.02)
        `;
    }

    reset3DEffect(card) {
        card.style.transform = '';
    }

    navigateToSection(section) {
        // Effetto di transizione
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #333382, #D3E4FC);
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.6s cubic-bezier(0.28, 0.11, 0.32, 1);
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            window.location.href = `sezioni/${section}.html`;
        }, 600);
    }

    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        const cards = document.querySelectorAll('.section-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(40px)';
            card.style.transition = `all 0.8s cubic-bezier(0.28, 0.11, 0.32, 1) ${index * 0.1}s`;
            observer.observe(card);
        });
    }
}

// ==============================================
// NAVBAR SCROLL EFFECT
// ==============================================

class NavbarController {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.lastScroll = 0;
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    }

    handleScroll() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }

        // Hide on scroll down, show on scroll up
        if (currentScroll > this.lastScroll && currentScroll > 200) {
            this.navbar.style.transform = 'translateY(-100%)';
        } else {
            this.navbar.style.transform = 'translateY(0)';
        }

        this.lastScroll = currentScroll;
    }
}

// ==============================================
// INIZIALIZZAZIONE
// ==============================================

document.addEventListener('DOMContentLoaded', () => {
    window.appleGallery = new AppleGallery();
    window.sectionsInteractive = new SectionsInteractive();
    window.navbarController = new NavbarController();
    
    console.log('🍎 Apple-style magazine initialized');
});