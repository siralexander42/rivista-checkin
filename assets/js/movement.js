// =============================================================================
// LAGO DI GARDA - MOVIMENTO ANIMATIONS
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Hero Image Rotation
    const imageStack = document.querySelector('.movement-image-stack');
    if (imageStack) {
        const images = imageStack.querySelectorAll('.movement-img');
        let currentIndex = 0;

        function rotateImages() {
            images[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].classList.add('active');
        }

        // Cambia immagine ogni 5 secondi
        setInterval(rotateImages, 5000);
    }

    // AOS (Animate On Scroll) - Simple Implementation
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);

    // Osserva tutti gli elementi con data-aos
    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });

    // Card Hover Effects - Parallax sul numero
    const cards = document.querySelectorAll('.movement-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            const number = card.querySelector('.movement-card-number');
            if (number) {
                number.style.transform = `translate(${rotateY}px, ${rotateX}px)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            const number = card.querySelector('.movement-card-number');
            if (number) {
                number.style.transform = 'translate(0, 0)';
            }
        });
    });

    // =============================================================================
    // INTERACTIVE MAP FUNCTIONALITY - Google Maps + Custom Markers
    // =============================================================================
    
    const customMarkers = document.querySelectorAll('.custom-marker');
    const mapPopups = document.querySelectorAll('.map-popup');
    const mapContainer = document.querySelector('.garda-map-container');
    let activePopup = null;
    let activeMarker = null;

    // Chiudi popup attivo
    function closeActivePopup() {
        if (activePopup) {
            activePopup.classList.remove('active');
            activePopup = null;
        }
        if (activeMarker) {
            activeMarker.classList.remove('active');
            activeMarker = null;
        }
    }

        // Aggiungi event listener ai marker custom - CLICK invece di hover
    customMarkers.forEach(marker => {
        marker.addEventListener('click', function(e) {
            e.stopPropagation();
            const location = this.getAttribute('data-location');
            const popup = document.getElementById(`popup-${location}`);
            
            if (!popup) return;

            // Se clicco sullo stesso marker, chiudi
            if (activePopup === popup) {
                closeActivePopup();
                return;
            }

            // Chiudi il popup precedente
            closeActivePopup();

            // Apri il nuovo popup e posizionalo a destra del marker
            popup.classList.add('active');
            this.classList.add('active');
            activePopup = popup;
            activeMarker = this;
            
            // Posiziona il popup a destra del marker
            const markerRect = this.getBoundingClientRect();
            const popupWidth = 320;
            const windowHeight = window.innerHeight;
            
            // Calcola posizione base: 20px a destra del marker
            let leftPos = markerRect.right + 20;
            let topPos = markerRect.top + (markerRect.height / 2);
            
            // Se esce dallo schermo a destra, metti a sinistra del marker
            if (leftPos + popupWidth > window.innerWidth - 20) {
                leftPos = markerRect.left - popupWidth - 20;
            }
            
            // Assicurati che non esca dallo schermo verticalmente
            const popupHeight = popup.offsetHeight || 400;
            if (topPos - (popupHeight / 2) < 20) {
                topPos = 20 + (popupHeight / 2);
            } else if (topPos + (popupHeight / 2) > windowHeight - 20) {
                topPos = windowHeight - 20 - (popupHeight / 2);
            }
            
            popup.style.left = `${leftPos}px`;
            popup.style.top = `${topPos}px`;
            popup.style.transform = 'translateY(-50%)';
        });
    });

    // Mantieni il popup aperto quando il mouse è sopra
    mapPopups.forEach(popup => {
        popup.addEventListener('mouseenter', function() {
            this.classList.add('active');
        });
    });

    // Pulsante chiudi popup
    document.querySelectorAll('.popup-close').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeActivePopup();
        });
    });

    // Chiudi popup quando si clicca fuori
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-marker') && !e.target.closest('.map-popup')) {
            closeActivePopup();
        }
    });
});
