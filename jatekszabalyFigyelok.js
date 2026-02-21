jatekszabalyFigyelok = {
    inicializalas: function() {
        // állandó képességek bekapcsolása
        gameState.state.figyelok.push({
            esemenytipus: "kártyamozgatás",
            forras: "szabály",
            allando: true,
            ervenyesul: (esemeny) => {
                if (gameState.jelenSpaces.includes(esemeny.hova) && !gameState.jelenSpaces.includes(esemeny.honnan)) {
                    for (const card of esemeny.hataskor) {
                        if (card.hatasok) {
                            for (const hatas of card.hatasok) {
                                if (hatas.tipus === 'képesség' &&
                                        !abilityFunctions.aktivizalhato(hatas) && 
                                        !hatas.jelek.includes('harci')) {
                                    const folyamatosKepesseg = gameEffect[hatas.szoveg];
                                    hatas.forras = card;
                                    if (folyamatosKepesseg && folyamatosKepesseg.bekapcsolas) {
                                        folyamatosKepesseg.bekapcsolas({card: card, hatas: hatas});
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // laphatások bekapcsolása
        gameState.state.figyelok.push({
            esemenytipus: "kártyahozzáadás",
            forras: "szabály",
            allando: true,
            ervenyesul: (esemeny) => {
                const card = gameState.state.playerSpaces[esemeny.player][esemeny.hova].at(-1);
                if (card && card.hatasok) {
                    card.hatasok.forEach(hatas => {
                        if (hatas.tipus === 'laphatás' && 
                                !abilityFunctions.aktivizalhato(hatas) && 
                                !hatas.jelek.includes('harci')) {
                            const folyamatosKepesseg = gameEffect[hatas.szoveg];
                            hatas.forras = card;
                            if (folyamatosKepesseg && folyamatosKepesseg.bekapcsolas) {
                                folyamatosKepesseg.bekapcsolas({card: card, hatas: hatas});
                            }
                        }
                    });
                }
            }
        });

        // időtartamos lapok kezelése
        gameState.state.figyelok.push({
            esemenytipus: "Forduló vége",
            forras: "szabály",
            allando: true,
            ervenyesul: (esemeny) => {
                gameState.players.forEach(player => {
                    gameState.jelenSpaces.forEach(space => {
                        const cards = [...gameState.state.playerSpaces[player][space]];
                        cards.forEach(card => {
                            if (card.idotartam === "Forduló") {
                                gameState.state.eventSor.push({
                                    tipus: "kártyamozgatás",
                                    player: player,
                                    honnan: space,
                                    hova: "mult",
                                    hataskor: [card]
                                });
                            }
                        });
                    });
                });
            }
        });

        gameState.state.figyelok.push({
            esemenytipus: "Harc vége",
            forras: "szabály",
            allando: true,
            ervenyesul: (esemeny) => {
                gameState.players.forEach(player => {
                    gameState.jelenSpaces.forEach(space => {
                        const cards = [...gameState.state.playerSpaces[player][space]];
                        cards.forEach(card => {
                            if (card.idotartam === "Harc") {
                                gameState.state.eventSor.push({
                                    tipus: "kártyamozgatás",
                                    player: player,
                                    honnan: space,
                                    hova: "mult",
                                    hataskor: [card]
                                });
                            }
                        });
                    });
                });
            }
        });

        // akadálylapok csatolás nélkül múltba kerülnek
        gameState.state.figyelok.push({
            esemenytipus: "kártyamozgatás",
            forras: "szabály",
            allando: true,
            ervenyesul: (esemeny) => {
                if (esemeny.honnan === 'idofonal' && gameState.jelenSpaces.includes(esemeny.hova)) {
                    esemeny.hataskor.forEach(card => {
                        if (card.laptipus === 'Akadálylap' && card.akadalylapmod === 'csatolás' && !card.csatoltHely) {
                            esemeny.hova = 'mult';
                        }
                    });
                }
            }
        });
    }
};
