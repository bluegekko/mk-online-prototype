(function () {
    // Eseménykezelők beállítása
    function initializeEventListeners() {
        // Vezérlő gombok eseménykezelői
        document.getElementById('newGameBtn').addEventListener('click', ujJatek);
        document.getElementById('passBtn').addEventListener('click', passz);
        
        // Billentyűzet eseménykezelő
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                passz();
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
        gameFlow.duplapassz(gameState.state);
        gameUi.render();
    }

    // Játék inicializálása amikor az oldal betöltődött
    document.addEventListener('DOMContentLoaded', () => {
        initializeEventListeners();
        gameState.initializeState();
    });

    // Debug helper globálisan elérhető
    window.debug = {
        getState: () => gameState.state,
        addCard: (player, space, card) => {
            gameState.state.players[player][space].push(card);
            gameState.render();
        },
        setMP: (amount) => {
            gameState.state.mp = amount;
            gameState.render();
        }
    };
})();
