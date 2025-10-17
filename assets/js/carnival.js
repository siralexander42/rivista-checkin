// ==============================================
// CARNIVAL ANIMATIONS - APPLE STYLE
// ==============================================

function initCarnivalAnimations() {
    console.log('🎭 Inizializzazione animazioni Carnevale...');
    
    // Intersection Observer per animazioni scroll
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Osserva tutti i panel
    document.querySelectorAll('.carnival-panel').forEach(panel => {
        observer.observe(panel);
    });
    
    // Parallax effect sulle immagini
    initCarnivalParallax();
    
    // Smooth scroll per i link
    initCarnivalSmoothScroll();
    
    // Hero Widget Slideshow
    initHeroSlideshow();
    
    // Animated Counters
    initCarnivalCounterAnimation();
    
    console.log('✅ Animazioni Carnevale attive');
}

function initCarnivalCounterAnimation() {
    // Cerca sia .stat-number che .stat-item strong
    const statNumbers = document.querySelectorAll('.stat-number, .stat-item strong');
    console.log('🎭 Carnival counters trovati:', statNumbers.length);
    
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const animateCounter = (element) => {
        const originalText = element.textContent;
        const hasText = originalText.includes('anni');
        const target = parseInt(element.getAttribute('data-target') || originalText.replace(/[^\d]/g, ''));
        
        console.log('🎬 Carnival counter starting:', originalText, 'Target:', target);
        
        if (isNaN(target) || target === 0) {
            console.log('❌ Invalid carnival counter:', originalText);
            return;
        }
        
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                const displayValue = Math.floor(current);
                element.textContent = hasText ? displayValue + ' anni' : displayValue.toLocaleString('it-IT');
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = hasText ? target + ' anni' : target.toLocaleString('it-IT');
            }
        };
        
        updateCounter();
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                console.log('✅ Carnival counter visible:', entry.target.textContent);
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, observerOptions);
    
    statNumbers.forEach(num => {
        counterObserver.observe(num);
        console.log('👁️ Carnival observer attached to:', num.textContent);
    });
    
    console.log('🔢 Contatori Carnival attivati');
}

function initHeroSlideshow() {
    const slides = document.querySelectorAll('.carnival-hero-slide');
    const indicators = document.querySelectorAll('.carnival-hero-indicators .indicator');
    
    if (!slides.length || !indicators.length) return;
    
    let currentSlide = 0;
    const slideInterval = 6000; // 6 secondi
    
    function showSlide(index) {
        // Rimuovi active da tutti
        slides.forEach(s => s.classList.remove('active'));
        indicators.forEach(i => i.classList.remove('active'));
        
        // Aggiungi active al corrente
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
        
        currentSlide = index;
    }
    
    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }
    
    // Auto-play
    let autoplay = setInterval(nextSlide, slideInterval);
    
    // Click sugli indicatori
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index);
            // Reset autoplay
            clearInterval(autoplay);
            autoplay = setInterval(nextSlide, slideInterval);
        });
    });
    
    console.log('🎬 Slideshow hero attivo');
}

function initCarnivalParallax() {
    const panels = document.querySelectorAll('.carnival-panel');
    
    window.addEventListener('scroll', () => {
        panels.forEach(panel => {
            const rect = panel.getBoundingClientRect();
            const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
            
            if (scrollPercent >= 0 && scrollPercent <= 1) {
                const image = panel.querySelector('.panel-image');
                if (image) {
                    const yPos = -(scrollPercent * 20);
                    image.style.transform = `translateY(${yPos}%)`;
                }
            }
        });
    }, { passive: true });
}

function initCarnivalSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Inizializza quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarnivalAnimations);
} else {
    initCarnivalAnimations();
}
