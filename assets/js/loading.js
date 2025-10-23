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

    // Progress bar animation
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) {
        let progress = 0;
        const duration = 4000; // 4 secondi
        const steps = 80;
        const increment = 100 / steps;
        const stepDuration = duration / steps;

        const progressInterval = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                setTimeout(() => {
                    const loadingScreen = document.querySelector('.loading-screen');
                    if (loadingScreen) {
                        loadingScreen.style.opacity = '0';
                        setTimeout(() => {
                            loadingScreen.style.display = 'none';
                        }, 500);
                    }
                }, 400);
            }
            loadingBar.style.width = progress + '%';
        }, stepDuration);
    }
})();
