eventHandler = {
    resolve: function() {
        while (esemeny = gameState.state.eventSor.shift()) {
            // subscriptions az eventType listáján végigmegyünk, is triggerelünk eventeket (feltételes kiértékelés)
            console.log("Resolving: ", esemeny.tipus);
            eventHandler.eventResolver[esemeny.tipus](esemeny);
            eventHandler.figyelokAktivalasa(esemeny);
        }
    },

    esemenytipusIdotartamhoz: function(idotartam) {
        switch(idotartam) {
            case "Harc":
                return "Harc vége";
            case "Forduló":
                return "Forduló vége";
            default:
                return "kártya";
        }
    },

    eventResolver: {
        "laphúzás": function(esemeny) {
            for (let i = 0; i < esemeny.szam; i++) {
                gameAction.laphuzas(esemeny.player);
            }
        },
        "lapkiigazítás": function(esemeny) {
            const playerAttributes = gameState.state.playerAttributes[esemeny.player]
            const playerSpaces = gameState.state.playerSpaces[esemeny.player];
            laphuzas = {
                tipus: "laphúzás",
                player: esemeny.player,
                forras: "lapkiigazítás",
                szam: helper.getValue(playerAttributes.kezmeret) - playerSpaces.kez.length
            }
            gameState.state.eventSor.push(laphuzas);
        },
        "értékmódosítás": function(esemeny) {
            for (const alany of esemeny.hataskor) {
                console.log("modositas: ", alany);
                if (!alany[esemeny.ertektipus].modositas) alany[esemeny.ertektipus].modositas = [];
                const modosito = {ertek: esemeny.ertek};
                alany[esemeny.ertektipus].modositas.push(modosito);

                if (esemeny.idotartam) {  
                    gameState.state.figyelok.push({
                        esemenytipus: eventHandler.esemenytipusIdotartamhoz(esemeny.idotartam),
                        forras: esemeny.forras,
                        allando: false,
                        ervenyesul: () => {
                            gameState.state.eventSor.push({
                                tipus: "értékmódosítástörlés", 
                                forras: esemeny.forras, 
                                card: alany,
                                ertek: "alapszint", 
                                modosito: modosito});
                        }
                    })
                    console.log("figyelo: ", gameState.state.figyelok[gameState.state.figyelok.length - 1])
                }
            }
        },
        "értékmódosítástörlés": function(esemeny) {
            console.log("torles: ", esemeny);
            const index = esemeny.card[esemeny.ertek].modositas.indexOf(esemeny.modosito);
            console.log("index:", index)
            if (index !== -1) esemeny.card[esemeny.ertek].modositas.splice(esemeny.modosito, 1);
        },
        "Harc vége": function(esemeny) {}
    },

    figyelokAktivalasa: function(esemeny) {
        for (figyelo of gameState.state.figyelok) {
            console.log("figyelo vizsgálat: ", figyelo.esemenytipus, " === ", esemeny.tipus, "?")
            if (figyelo.esemenytipus === esemeny.tipus){
                figyelo.ervenyesul();
            }
        }

    }
}