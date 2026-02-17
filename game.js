(function () {
    // Eseménykezelők beállítása
    function initializeEventListeners() {
        // Vezérlő gombok eseménykezelői
        document.getElementById('newGameBtn').addEventListener('click', ujJatek);
        document.getElementById('passBtn').addEventListener('click', passz);
        document.getElementById('addCardBtn').addEventListener('click', kartyaHozzaadas);
        
        // Billentyűzet eseménykezelő
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!gameState.state.valasztasFolyamatban) {
                    passz();
                }
            }
            if (e.code === 'Enter' && document.activeElement.id === 'cardNameInput') {
                e.preventDefault();
                kartyaHozzaadas();
            }
        });
    }

    // Új játék indítása
    function ujJatek() {
        gameState.initializeState();
        gameUi.render();
    }

    // Új kör kezdése
    function passz() {
        if (gameState.state.valasztasFolyamatban) return;
        gameFlow.duplapassz(gameState.state);
        gameUi.render();
    }

    // Kártya hozzáadása kézhez
    function kartyaHozzaadas() {
        const input = document.getElementById('cardNameInput');
        const cardName = input.value.trim();
        if (cardName) {
            gameAction.kartyaHozzaadas(cardName, 'player', 'kez')
        }
        input.value = '';
        gameUi.render();
    }

    // Játék inicializálása amikor az oldal betöltődött
    document.addEventListener('DOMContentLoaded', () => {
        initializeEventListeners();
        gameState.initializeState();
    });
})();
