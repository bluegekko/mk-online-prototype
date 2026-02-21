enemyAI = {
    isWaiting: false,
    
    checkAndAct: function() {
        if (gameState.state.mode !== 'ai') return;
        if (this.isWaiting) return;
        
        const aiPlayer = helper.ellenfel(gameState.state.aktualisJatekos);
        
        if (gameState.state.fazis.prioritas === aiPlayer) {
            this.isWaiting = true;
            setTimeout(() => {
                gameFlow.passz();
                this.isWaiting = false;
            }, 1);
        }
    }
}