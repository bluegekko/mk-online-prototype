gameAction = {
    moveCard: function(fromSpace, toSpace, cardId) {
        const cardIndex = fromSpace.findIndex(card => card.id === cardId);
        
        if (cardIndex !== -1) {
            const [card] = fromSpace.splice(cardIndex, 1);
            toSpace.push(card);
        }
    },

    drawCard: function(player) {
        if (gameState.state.playerSpaces[player].jovo.length === 0) {
            console.log(`Nincs több húzható lap ${player} Jövő pakijában!`);
            return false;
        }
    
        const drawnCard = gameState.state.playerSpaces[player].jovo[0];
        this.moveCard(
            gameState.state.playerSpaces[player]['jovo'],
            gameState.state.playerSpaces[player]['kez'],  
            drawnCard.id);
        
        console.log(`${player} húzott egy lapot: `, drawnCard);
        return true;
    },

    // Kártya kijátszása kézből
    playCardFromHand: function(player, cardId) {
        const card = gameState.state.playerSpaces[player].kez.find(c => c.id === cardId);
        if (!card || gameState.state.playerAttributes[player].mp < card.mp) return;

        gameState.state.playerAttributes[player].mp -= card.mp;
        kez = gameState.state.playerSpaces[player]['kez'];
        const cardIndex = kez.findIndex(card => card.id === cardId);
        kez.splice(cardIndex, 1);
        gameFlow.idofonalNyitas(gameState.state, card)
        gameUi.render();
    }
}