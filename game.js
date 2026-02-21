(function () {
    // Eseménykezelők beállítása
    function initializeEventListeners() {
        // Vezérlő gombok eseménykezelői
        document.getElementById('newGameBtn').addEventListener('click', ujJatek);
        document.getElementById('addCardBtn').addEventListener('click', kartyaHozzaadas);
        
        // Billentyűzet eseménykezelő
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' && document.activeElement.id === 'cardNameInput') {
                e.preventDefault();
                kartyaHozzaadas();
            }
        });
        
        // Card name input - megakadályozza a Space billentyű továbbterjesztését
        document.getElementById('cardNameInput').addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
    }

    function ujJatek() {
        gameState.initializeState();
        gameUi.render();
    }

    // Kártya hozzáadása kézhez
    function kartyaHozzaadas() {
        const input = document.getElementById('cardNameInput');
        const cardName = input.value.trim();
        if (cardName) {
            gameAction.kartyaHozzaadas(cardName, gameState.state.aktualisJatekos, 'kez')
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
