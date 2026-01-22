gameAction = {
    kartyaMozgatas: function(fromSpace, toSpace, cardId) {
        const cardIndex = fromSpace.findIndex(card => card.id === cardId);
        
        if (cardIndex !== -1) {
            const [card] = fromSpace.splice(cardIndex, 1);
            toSpace.push(card);
        }
    },

    laphuzas: function(player) {
        if (gameState.state.playerSpaces[player].jovo.length === 0) {
            console.log(`Nincs több húzható lap ${player} Jövő pakijában!`);
            return false;
        }
    
        const drawnCard = gameState.state.playerSpaces[player].jovo[0];
        this.kartyaMozgatas(
            gameState.state.playerSpaces[player]['jovo'],
            gameState.state.playerSpaces[player]['kez'],  
            drawnCard.id);
        
        console.log(`${player} húzott egy lapot: `, drawnCard);
        return true;
    },

    // Kártya kijátszása kézből
    leidezesKezbol: function(player, cardId) {
        // TODO kell, hogy cardId legyen?
        const card = gameState.state.playerSpaces[player].kez.find(c => c.id === cardId);
        console.log("lap kijátszása: ", card)
        if (!card || gameState.state.playerAttributes[player].mp < card.mp) return;

        // Hatás célpont választás ellenőrzése
        if (!gameEffect.celpontValasztas(card, player)) {
            return;
        }

        gameState.state.playerAttributes[player].mp -= card.mp;
        kez = gameState.state.playerSpaces[player]['kez'];
        const cardIndex = kez.findIndex(card => card.id === cardId);
        kez.splice(cardIndex, 1);
        gameFlow.idofonalNyitas(gameState.state, card)
        gameUi.render();
    },

    hatasAktivizalas: function(player, hatas) {
        if (!hatas) return;
        if (hatas.mp && gameState.state.playerAttributes[player].mp < hatas.mpErtek) return;

        if (!gameEffect.celpontValasztas(hatas, player)) {
            return;
        }
        
        console.log("Hatás aktiválása: ", hatas);

        gameFlow.idofonalNyitas(gameState.state, hatas)
        gameUi.render();
    }
}