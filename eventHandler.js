eventHandler = {
    resolve: function(ujEsemeny) {
        if (ujEsemeny) {gameState.state.eventSor.push(ujEsemeny);}
        while (esemeny = gameState.state.eventSor.shift()) {
            console.log("Resolving: ", esemeny.tipus);
            eventHandler.figyelokEloAktivalasa(esemeny);
            eventHandler.eventResolver[esemeny.tipus](esemeny);
            eventHandler.figyelokUtoAktivalasa(esemeny);
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
                szam: helper.getValue(playerAttributes, "kezmeret") - playerSpaces.kez.length
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
                        ervenyesul: (triggerEsemeny) => {
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
        "Harc vége": function(esemeny) {},
        "helyzetbeállítás": function(esemeny) {
            for (const card of esemeny.hataskor) {
                card.helyzet = esemeny.helyzet;
            }
        },
        "kártyamozgatás": function(esemeny) {
            for (const card of esemeny.hataskor) {
                console.log("move: ", card, " from ", esemeny.honnan, " to ", esemeny.hova)
                gameAction.kartyaMozgatasJatekter(esemeny.player, esemeny.honnan, esemeny.hova, card);
                if (card.laptipus === "Kalandozó" && esemeny.ujHelyzet) {
                    card.helyzet = esemeny.ujHelyzet;
                } 
            }
        },
        "sebzés": function(esemeny) {
            for (const card of esemeny.hataskor) {
                card.sebzes = (card.sebzes || 0) + esemeny.sebzes;
            }
        },
        "lapérvényesülés": function(esemeny) {
            if (esemeny.hatas && esemeny.hatas.szoveg) {
                gameEffect[esemeny.hatas.szoveg].ervenyesul(esemeny.forras);
            }
        },
        "képességlaphatásérvényesülés": function(esemeny) {
            gameEffect[esemeny.hatas.szoveg].ervenyesul(esemeny.hatas)
        },
        "lapleidézés": function(esemeny) {},
        "gyógyulás": function(esemeny) {
            for (const card of esemeny.hataskor) {
                card.sebzes = Math.max(0, (card.sebzes || 0) - esemeny.gyogyulas);
            }
        },
        "időfonalvisszafejtés": function(esemeny) {
            const fazis = gameState.state.fazis;
            const idofonal = fazis.idofonal;
            if (idofonal.hatasok.length > 0) {
                aktualisHatas = idofonal.hatasok.at(-1);
                console.log(aktualisHatas)
                if (aktualisHatas.isCard) {
                    gameState.state.eventSor.push({
                        tipus: "kártyamozgatás",
                        player: aktualisHatas.tulajdonos,
                        honnan: "idofonal",
                        hova: helper.kezdoJelenJatekter(card),
                        hataskor: [aktualisHatas],
                        ujHelyzet: "Éber",
                    });
                    if (card.sebzesCelpont) {
                        gameState.state.eventSor.push({
                            tipus: "sebzés",
                            forras: aktualisHatas,
                            hataskor: [card.sebzesCelpont],
                            sebzes: helper.getValue(card, "sebzes")
                        });
                    }
                    gameState.state.eventSor.push({
                        tipus: "lapérvényesülés",
                        forras: aktualisHatas,
                        hatas: helper.ervenyesuloHatas(aktualisHatas),
                    });
                } else {
                    gameState.state.eventSor.push({
                        tipus: "képességlaphatásérvényesülés",
                        forras: aktualisHatas.forras,
                        hatas: aktualisHatas,
                    });
                }
            }
        }
    },

    figyelokEloAktivalasa: function(esemeny) {
        for (figyelo of gameState.state.figyelok) {
            console.log("figyelo vizsgálat: ", figyelo.esemenytipus, " === ", esemeny.tipus, "?")
            if (figyelo.esemenytipus === esemeny.tipus && figyelo.idozites == "előtte"){
                figyelo.ervenyesul(esemeny);
            }
        }

    },

    figyelokUtoAktivalasa: function(esemeny) {
        for (figyelo of gameState.state.figyelok) {
            console.log("figyelo vizsgálat: ", figyelo.esemenytipus, " === ", esemeny.tipus, "?")
            if (figyelo.esemenytipus === esemeny.tipus && (!figyelo.idozites || figyelo.idozites == "utána")){
                figyelo.ervenyesul(esemeny);
            }
        }

    },
}