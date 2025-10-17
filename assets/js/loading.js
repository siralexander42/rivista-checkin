/**
 * LOADING SCREEN - Departure Board Animation
 * Simula tabellone partenze vintage anni '70 con flip meccanici
 */

(function() {
    'use strict';

    // Attendi che il DOM sia pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDepartureBoard);
    } else {
        initDepartureBoard();
    }

    function initDepartureBoard() {
        const flipLetters = document.querySelectorAll('.flip-letter[data-flips]');
        
        flipLetters.forEach((letter, index) => {
            const flipsData = letter.getAttribute('data-flips');
            if (!flipsData) return;
            
            // Parse: "S,E,I,7,S" -> [S, E, I, 7, S]
            const sequence = flipsData.split(',');
            const finalLetter = sequence[sequence.length - 1];
            
            // Timing MOLTO più lento - finisce a ~3.9 secondi
            const baseDelay = 150 + (index * 40); // Delay iniziale per ogni lettera
            const flipDuration = 380; // Durata di ogni flip (molto più lento)
            
            // Anima ogni flip
            sequence.forEach((char, flipIndex) => {
                setTimeout(() => {
                    letter.textContent = char;
                    letter.setAttribute('data-letter', char);
                }, baseDelay + (flipIndex * flipDuration));
            });
        });
    }

    // Flight animation timing - no need to update bar, animation is pure CSS
    const duration = 2500; // 2.5 secondi
    
    setTimeout(() => {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                
                // 🎬 TRIGGERA IL TYPEWRITER DOPO IL LOADING
                window.dispatchEvent(new Event('loadingComplete'));
                console.log('✅ Loading completato - typewriter può partire');
            }, 500);
        }
    }, duration + 400);
})();
