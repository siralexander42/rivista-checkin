// =============================================================================
// SOMMARIO FLOTTANTE - FLOATING INDEX
// Versione ultra-elegante con dropdown
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    const toggleHero = document.querySelector('.sommario-toggle-hero');
    const dropdownHero = document.querySelector('.hero-sommario-dropdown');
    const floatingBtn = document.querySelector('.floating-sommario-btn');
    const floatingMenu = document.querySelector('.floating-sommario-menu');
    const hero = document.querySelector('.hero-simple');
    
    if (!toggleHero || !dropdownHero || !floatingBtn || !floatingMenu) return;
    
    // =============================================================================
    // MOSTRA DROPDOWN AUTOMATICAMENTE PER 5 SECONDI ALL'AVVIO
    // =============================================================================
    
    setTimeout(() => {
        dropdownHero.classList.add('show-initial');
        
        // Rimuovi la classe dopo l'animazione
        setTimeout(() => {
            dropdownHero.classList.remove('show-initial');
        }, 5000);
    }, 1500); // Inizia dopo 1.5 secondi (dopo il caricamento)
    
    // =============================================================================
    // TOGGLE DROPDOWN HERO (FRECCIA TRA LOGO E COVER)
    // =============================================================================
    
    toggleHero.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownHero.classList.toggle('active');
        toggleHero.classList.toggle('active');
    });
    
    // =============================================================================
    // GESTIONE VISIBILITÀ PULSANTE FLOTTANTE
    // =============================================================================
    
    function handleScroll() {
        const cremonaSection = document.querySelector('#cremona');
        const cremonaTop = cremonaSection ? cremonaSection.getBoundingClientRect().top : 0;
        
        // Mostra il pulsante flottante quando si raggiunge la sezione Cremona
        if (cremonaTop <= window.innerHeight / 2) {
            floatingBtn.style.display = 'flex';
            setTimeout(() => {
                floatingBtn.style.opacity = '1';
                floatingBtn.style.transform = 'scale(1) translateY(0)';
            }, 10);
        } else {
            floatingBtn.style.opacity = '0';
            floatingBtn.style.transform = 'scale(0.8) translateY(20px)';
            setTimeout(() => {
                if (cremonaTop > window.innerHeight / 2) {
                    floatingBtn.style.display = 'none';
                }
            }, 300);
            // Chiudi il menu se aperto
            floatingMenu.classList.remove('active');
            floatingBtn.classList.remove('active');
        }
    }
    
    // Inizializza stili
    floatingBtn.style.opacity = '0';
    floatingBtn.style.transform = 'scale(0.8) translateY(20px)';
    floatingBtn.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Ascolta lo scroll con throttle per performance
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Controlla subito all'avvio
    handleScroll();
    
    // =============================================================================
    // TOGGLE MENU FLOTTANTE
    // =============================================================================
    
    floatingBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        floatingMenu.classList.toggle('active');
        floatingBtn.classList.toggle('active');
    });
    
    // =============================================================================
    // SMOOTH SCROLL AI LINK
    // =============================================================================
    
    const allSommarioLinks = document.querySelectorAll('.sommario-link');
    
    allSommarioLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Chiudi i menu
                floatingMenu.classList.remove('active');
                floatingBtn.classList.remove('active');
                dropdownHero.classList.remove('active');
                toggleHero.classList.remove('active');
                
                // Smooth scroll
                const offsetTop = targetElement.offsetTop - 80; // 80px per la navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Effetto highlight sulla sezione di destinazione
                targetElement.style.transition = 'opacity 0.6s ease';
                const originalOpacity = window.getComputedStyle(targetElement).opacity;
                targetElement.style.opacity = '0.7';
                
                setTimeout(() => {
                    targetElement.style.opacity = originalOpacity;
                    setTimeout(() => {
                        targetElement.style.transition = '';
                    }, 600);
                }, 300);
            }
        });
    });
    
    // =============================================================================
    // CHIUDI MENU CLICCANDO FUORI
    // =============================================================================
    
    document.addEventListener('click', function(e) {
        if (!floatingMenu.contains(e.target) && !floatingBtn.contains(e.target)) {
            floatingMenu.classList.remove('active');
            floatingBtn.classList.remove('active');
        }
        
        if (!dropdownHero.contains(e.target) && !toggleHero.contains(e.target)) {
            dropdownHero.classList.remove('active');
            toggleHero.classList.remove('active');
        }
    });
    
    // =============================================================================
    // EVIDENZIA SEZIONE ATTIVA
    // =============================================================================
    
    const sections = document.querySelectorAll('section[id]');
    
    function highlightActiveSection() {
        const scrollPos = window.scrollY + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                // Rimuovi active da tutti
                allSommarioLinks.forEach(link => {
                    link.classList.remove('active-section');
                });
                
                // Aggiungi active al link corrispondente
                const activeLink = document.querySelector(`.sommario-link[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active-section');
                }
            }
        });
    }
    
    // Stile per sezione attiva
    const style = document.createElement('style');
    style.textContent = `
        .sommario-link.active-section {
            background: rgba(255, 255, 255, 0.08) !important;
            border-color: rgba(255, 255, 255, 0.2) !important;
            color: #ffffff !important;
        }
        .sommario-link.active-section::before {
            transform: scaleY(1) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Controlla la sezione attiva durante lo scroll
    let activeCheckTicking = false;
    window.addEventListener('scroll', function() {
        if (!activeCheckTicking) {
            window.requestAnimationFrame(function() {
                highlightActiveSection();
                activeCheckTicking = false;
            });
            activeCheckTicking = true;
        }
    });
    
    // Controlla subito
    highlightActiveSection();
    
});
