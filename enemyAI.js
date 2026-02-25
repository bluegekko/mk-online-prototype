enemyAI = {
    running: false,
    
    start: function() {
        if (this.running) return;
        this.running = true;
        this.loop();
    },
    
    stop: function() {
        this.running = false;
    },
    
    loop: function() {
        if (!this.running) return;
        
        if (gameState.state.mode === 'ai') {
            const aiPlayer = helper.ellenfel(gameState.state.aktualisJatekos);
            
            if (gameState.state.fazis.prioritas === aiPlayer) {
                gameFlow.passz();
                gameUi.render();
            }
        }
        
        setTimeout(() => this.loop(), 1);
    }
}