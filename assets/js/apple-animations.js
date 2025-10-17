// ==============================================
// ADVANCED ANIMATIONS - APPLE STYLE
// ==============================================

class AppleAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.initHeroAnimations();
        this.initScrollReveal();
        this.initParallax();
        this.initMagneticButtons();
        this.initSmoothScroll();
    }

    // ==============================================
    // HERO REVEAL ANIMATIONS
    // ==============================================
    initHeroAnimations() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        const title = hero.querySelector('.hero-title');
        const subtitle = hero.querySelector('.hero-subtitle');
        const scrollIndicator = hero.querySelector('.scroll-indicator');

        // Split text per animazione lettera per lettera
        if (title) {
            this.revealText(title, 0);
        }

        if (subtitle) {
            this.revealText(subtitle, 400);
        }

        if (scrollIndicator) {
            setTimeout(() => {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.transform = 'translateY(0)';
            }, 800);
        }
    }

    revealText(element, delay = 0) {
        const text = element.textContent;
        element.textContent = '';
        element.style.opacity = '1';

        const words = text.split(' ');
        
        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.marginRight = '0.3em';
            
            const letters = word.split('');
            letters.forEach((letter, letterIndex) => {
                const span = document.createElement('span');
                span.textContent = letter;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                span.style.transform = 'translateY(20px)';
                span.style.transition = 'all 0.6s cubic-bezier(0.28, 0.11, 0.32, 1)';
                
                setTimeout(() => {
                    span.style.opacity = '1';
                    span.style.transform = 'translateY(0)';
                }, delay + (wordIndex * 50) + (letterIndex * 30));
                
                wordSpan.appendChild(span);
            });
            
            element.appendChild(wordSpan);
        });
    }

    // ==============================================
    // SCROLL REVEAL
    // ==============================================
    initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -80px 0px'
        });

        revealElements.forEach(el => observer.observe(el));

        // Auto-add reveal class to sections
        const sections = document.querySelectorAll('section:not(.hero)');
        sections.forEach(section => {
            section.classList.add('reveal');
        });
    }

    // ==============================================
    // PARALLAX EFFECT
    // ==============================================
    initParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(el => {
                const speed = el.dataset.parallax || 0.5;
                const yPos = -(scrolled * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
        }, { passive: true });
    }

    // ==============================================
    // MAGNETIC BUTTONS
    // ==============================================
    initMagneticButtons() {
        const magneticButtons = document.querySelectorAll('.btn, .gallery-link, .nav-link');
        
        magneticButtons.forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
            });
        });
    }

    // ==============================================
    // SMOOTH SCROLL
    // ==============================================
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                
                if (target) {
                    const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// ==============================================
// CURSOR PERSONALIZZATO
// ==============================================

class CustomCursor {
    constructor() {
        this.cursor = null;
        this.cursorFollower = null;
        this.init();
    }

    init() {
        // Crea cursor
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        this.cursor.style.cssText = `
            width: 8px;
            height: 8px;
            background: #333382;
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 99999;
            mix-blend-mode: difference;
            transition: transform 0.2s ease;
        `;

        // Crea follower
        this.cursorFollower = document.createElement('div');
        this.cursorFollower.className = 'cursor-follower';
        this.cursorFollower.style.cssText = `
            width: 40px;
            height: 40px;
            border: 1px solid #333382;
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 99998;
            mix-blend-mode: difference;
            transition: transform 0.3s cubic-bezier(0.28, 0.11, 0.32, 1);
        `;

        document.body.appendChild(this.cursor);
        document.body.appendChild(this.cursorFollower);

        // Mouse move
        document.addEventListener('mousemove', (e) => {
            this.cursor.style.left = e.clientX - 4 + 'px';
            this.cursor.style.top = e.clientY - 4 + 'px';
            
            this.cursorFollower.style.left = e.clientX - 20 + 'px';
            this.cursorFollower.style.top = e.clientY - 20 + 'px';
        });

        // Hover interattivi
        const interactiveElements = document.querySelectorAll('a, button, .gallery-item, .section-card');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.style.transform = 'scale(1.5)';
                this.cursorFollower.style.transform = 'scale(1.5)';
            });

            el.addEventListener('mouseleave', () => {
                this.cursor.style.transform = 'scale(1)';
                this.cursorFollower.style.transform = 'scale(1)';
            });
        });
    }
}

// ==============================================
// LOADING SCREEN
// ==============================================

class LoadingScreen {
    constructor() {
        this.init();
    }

    init() {
        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-logo">
                    <img src="assets/images/checkin-testata-hd.svg" alt="CHECK-IN">
                </div>
                <div class="loader-progress">
                    <div class="loader-bar"></div>
                </div>
            </div>
        `;
        
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #333382, #1a1a2e);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.8s cubic-bezier(0.28, 0.11, 0.32, 1);
        `;

        document.body.appendChild(loader);

        // Style loader content
        const loaderContent = loader.querySelector('.loader-content');
        loaderContent.style.cssText = `
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;

        const loaderLogo = loader.querySelector('.loader-logo');
        loaderLogo.style.cssText = `
            margin-bottom: 3rem;
            animation: pulse 2s ease-in-out infinite;
        `;
        
        const logoImg = loaderLogo.querySelector('img');
        logoImg.style.cssText = `
            max-width: 300px;
            height: auto;
        `;

        const loaderProgress = loader.querySelector('.loader-progress');
        loaderProgress.style.cssText = `
            width: 200px;
            height: 2px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            overflow: hidden;
        `;

        const loaderBar = loader.querySelector('.loader-bar');
        loaderBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: #D3E4FC;
            transition: width 0.3s ease;
        `;

        // Animate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 100) progress = 100;
            
            loaderBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loader.style.opacity = '0';
                    setTimeout(() => {
                        loader.remove();
                    }, 800);
                }, 300);
            }
        }, 200);

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==============================================
// IMAGE LAZY LOADING
// ==============================================

class LazyLoad {
    constructor() {
        this.init();
    }

    init() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });

        images.forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ==============================================
// GALLERY DOTS CONTROLLER
// ==============================================

class GalleryDots {
    constructor() {
        this.init();
    }

    init() {
        const track = document.querySelector('.gallery-track');
        const indicators = document.querySelector('.gallery-indicators');
        
        if (!track || !indicators) return;

        // Crea dots
        const items = track.querySelectorAll('.gallery-item');
        items.forEach((item, index) => {
            const dot = document.createElement('div');
            dot.className = 'gallery-dot';
            if (index === 0) dot.classList.add('active');
            
            dot.addEventListener('click', () => {
                if (window.appleGallery) {
                    window.appleGallery.goToSlide(index);
                }
            });
            
            indicators.appendChild(dot);
        });
    }
}

// ==============================================
// INIZIALIZZAZIONE
// ==============================================

window.addEventListener('DOMContentLoaded', () => {
    // Loading screen
    new LoadingScreen();
    
    // Animazioni principali
    setTimeout(() => {
        new AppleAnimations();
        new LazyLoad();
        new GalleryDots();
        
        // Cursor solo su desktop
        if (window.innerWidth > 768) {
            new CustomCursor();
        }
    }, 100);
    
    console.log('✨ Advanced animations initialized');
});