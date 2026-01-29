eventHandler = {
    resolve: function() {
        while (esemeny = gameState.state.eventSor.shift()) {
            // subscriptions az eventType listáján végigmegyünk, is triggerelünk eventeket (feltételes kiértékelés)
            eventHandler.eventResolver[esemeny.tipus](esemeny);
        }
    },

    eventResolver: {
        "laphúzás": function(esemeny) {
            for (let i = 0; i < esemeny.szam; i++) {
                gameAction.laphuzas(esemeny.player);
            }
        },
        "lapkiigazítás": function(esemeny) {
            const playerAttributes = gameState.state.playerAttributes[esemeny.player];
            laphuzas = {
                tipus: "laphúzás",
                player: esemeny.player,
                forras: "lapkiigazítás",
                szam: helper.getValue(playerAttributes.kezmeret) - playerAttributes.kez.length
            }
            gameState.state.eventSor.push(laphuzas);
        },
    }
}