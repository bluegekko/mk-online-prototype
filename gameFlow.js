gameFlow = {
    duplapassz: function() {
        const fazis = gameState.state.fazis;
        const idofonal = fazis.idofonal;
        const aktualisFazis = fazis.aktualisFazis;
        const manoverState = fazis.manover;
        
        if(idofonal.folyamatban){
            if (idofonal.hatasok.length > 0) {
                aktualisHatas = idofonal.hatasok.pop();
                console.log(aktualisHatas)
                if (aktualisHatas.isCard) {
                    aktualisHatas.ervenyesul();
                } else {
                    gameEffect[aktualisHatas.szoveg].ervenyesul(aktualisHatas);
                }
                return;
            } else {
                if (!gameFlow.mpKotottFazis(aktualisFazis)) {                    
                    gameFlow.kovetkezoFazis();
                    return;
                } 
                gameFlow.idofonalZaras();
                return;
            }
        }
        if (aktualisFazis.nev = 'Manőverek fázisa') {
            gameFlow.kovetkezoFazis();
            return;
        }
        if (aktualisFazis.nev = 'Harci körök' && manoverState.harciKorokVege) {
            gameFlow.kovetkezoFazis();
            return;
        } 
        if (aktualisFazis.nev = 'Harci körök' && !manoverState.harciKorokVege) {
            gameFlow.ujHarciKor();
        }
    },

    mpKotottFazis: function(fazis) {
        return fazis.nev == "Manőverek fázisa" || fazis.nev == "Harci körök";
    },

    kovetkezoFazis: function() {
        // TODO implement
        gameState.state.fazis.aktualisFazis.fazisVege();
        gameFlow.idofonalZaras();
        gameState.state.fazis.aktualisFazis = gameState.state.fazis.aktualisFazis.kovetkezoFazis();
        // TODO implement
        gameState.state.fazis.aktualisFazis.fazisEleje();
    },

    idofonalNyitas: function(effect) {
        gameState.state.fazis.idofonal.folyamatban = true
        if (effect) gameState.state.fazis.idofonal.hatasok.push(effect)
    },

    idofonalZaras: function() {
        gameState.state.fazis.idofonal.folyamatban = false;
        
        if (!gameState.state.fazis.manover.folyamatban) {
            gameState.players.forEach(player => {
                gameState.jelenSpaces.forEach(space => {
                    gameState.state.playerSpaces[player][space].forEach(card => {
                        if (card.laptipus === 'Kalandozó') {
                            const sebzes = card.sebzes || 0;
                            if (sebzes > 0) {
                                card.helyzet = 'Sérült';
                                card.sebzes = 0;
                            }
                        }
                    });
                });
            });
        }
    },

    manoverVege: function(player) {
        const manoverState = gameState.state.fazis.manover;
        const manoverCards = [...gameState.state.playerSpaces[player].manover];
        manoverCards.forEach(card => {
            gameAction.kartyaMozgatasJatekter(player, 'manover', 'sor', card)
        });

        if (manoverState.sikeresJatekos === player && manoverState.aktualisManover == "ostrom") {
            console.log("sikeresség aktiválva")
            gameAction.kartyaMozgatasJatekter(
                helper.ellenfel(player), 'toronyszintek', 'mult', manoverState.szinhely);
            
        }

        gameState.state.fazis.manover = helper.resetManoverState();
    },

    forduloKezdete: {
        nev: "Forduló kezdete",
        kovetkezoFazis: function() {
            return gameFlow.eroforrasFazis;
        },
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: function() {},
    },

    eroforrasFazis: {
        nev: "Erőforrás fázis",
        kovetkezoFazis: function() {return gameFlow.manoverekFazisa;},
        fazisEleje: function() {
            gameState.players.forEach(player => {
                const playerAttributes = gameState.state.playerAttributes[player];
                playerAttributes.mp += 4
                // Kör eleji regenerálás: minden Pihenő -> Éber a Sorban
                gameState.state.playerSpaces[player].sor.forEach(card => {
                    if (card.helyzet === "Pihenő") {
                        card.helyzet = "Éber";
                    } else if (card.helyzet === "Sérült") {
                        card.helyzet = "Pihenő";
                    }
                });

                // Húzás 7 lapra
                const kezbenLevok = gameState.state.playerSpaces[player].kez.length;
                const huzandoLapok = 7 - kezbenLevok;
                
                if (huzandoLapok > 0) {
                    for (let i = 0; i < huzandoLapok; i++) {
                        gameAction.laphuzas(player);
                    }
                }
            });
            gameFlow.idofonalNyitas(null)
        },
        fazisVege: function() {},
    },

    manoverekFazisa: {
        nev: "Manőverek fázisa",
        kovetkezoFazis: function() {return gameFlow.forduloVege;},
        fazisEleje: function() {},
        fazisVege: function() {},
    },

    forduloVege: {
        nev: "Forduló vége",
        kovetkezoFazis: function() {return gameFlow.forduloKezdete;},
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: function() {},
    },

    kezdemenyezoCsapatSorElhagyas: {
        nev: "Kezdeményező csapat sorelhagyása",
        // TODO felszerelkezés a fazis elején
        kovetkezoFazis: function() {
            const manoverState = gameState.state.fazis.manover;
            const aktualisManover = manoverState.aktualisManover;
            if (aktualisManover === 'ostrom') {
                return gameFlow.toronyszintFelfedese;
            } else if (aktualisManover === 'építmény bevétele') {
                return gameFlow.akadalylapokAktivizalasa;
            } else {
                return gameFlow.akadalyozoCsapatSorElhagyas;
            }
        },
        fazisEleje: function() {},
        fazisVege: function() {},
    },

    akadalyozoCsapatSorElhagyas: {
        nev: "Akadályozó csapat sorelhagyása",
        kovetkezoFazis: function() {
            const manoverState = gameState.state.fazis.manover;
            const aktualisManover = manoverState.aktualisManover;;
            const kezdemenyezoJatekos = manoverState.kezdemenyezoJatekos;
            const playerSpaces = gameState.state.playerSpaces;
            if (playerSpaces[kezdemenyezoJatekos].manover.length > 0 &&
                playerSpaces[helper.ellenfel(kezdemenyezoJatekos)].manover.length > 0) {
                return gameFlow.harcElokeszites;
            }
            if (aktualisManover === 'küldetés' && manoverState.kuldetesFolytatas) {
                return gameFlow.akadalylapokAktivizalasa;
            } else {
                // FELTÉTELEZÉS: csak manőverek fázisában lehet manőverezni.
                gameFlow.manoverVege(kezdemenyezoJatekos);
                return gameFlow.manoverekFazisa;
            }
        },
        fazisEleje: function() {},
        fazisVege: function() {},
    },

    toronyszintFelfedese: {
        nev: "Toronyszint felfedése",
        kovetkezoFazis: function() {return gameFlow.akadalylapokAktivizalasa;},
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: function() {},
    },

    akadalylapokAktivizalasa: {
        nev: "Akadálylapok aktivizálása",
        kovetkezoFazis: function() {
            const manoverState = gameState.state.fazis.manover;
            const aktualisManover = manoverState.aktualisManover;
            const kezdemenyezoJatekos = manoverState.kezdemenyezoJatekos;
            const playerAttributes = gameState.state.playerAttributes;
            if (aktualisManover === 'küldetés') {
                return gameFlow.kuldetesFeltetelTeljesites;
            } else if (playerAttributes[helper.ellenfel(kezdemenyezoJatekos)].akadalyozas) {
                return gameFlow.akadalyozoCsapatSorElhagyas;
            } else {
                return gameFlow.manoverekFazisa;
            }
        },
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: function() {
            const manoverState = gameState.state.fazis.manover;
            const aktualisManover = manoverState.aktualisManover;
            const kezdemenyezoJatekos = manoverState.kezdemenyezoJatekos;
            const playerAttributes = gameState.state.playerAttributes;
            
            if (aktualisManover !== 'küldetés' && 
                    !playerAttributes[helper.ellenfel(kezdemenyezoJatekos)].akadalyozas) {
                
                const manoverCards = gameState.state.playerSpaces[kezdemenyezoJatekos].manover;
                const osszszint = manoverCards.reduce((sum, card) => {
                    if (card.laptipus === 'Kalandozó') {
                        return sum + (card.alapszint || 0) + (card.alapszintModositas || 0) - 
                            (card.sebzes || 0);
                    }
                    return sum;
                }, 0);
                
                const szinhely = manoverState.manoverSzinhely;
                const fal = szinhely?.fal || 0;
                
                if ((aktualisManover == "ostrom" || aktualisManover == "építmény bevétele") 
                        && osszszint > fal) {
                    manoverState.sikeresJatekos = kezdemenyezoJatekos;
                    console.log(manoverState.sikeresJatekos)
                } else if (manoverCards.length > 0) {
                    manoverState.sikeresJatekos = kezdemenyezoJatekos;
                }
                
                gameFlow.manoverVege(kezdemenyezoJatekos);
            }
        },
    },

    kuldetesFeltetelTeljesites: {
        nev: "Küldetés feltétel teljesítés",
        kovetkezoFazis: function() {return gameFlow.manoverekFazisa;},
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: function() {},
    },

    harcElokeszites: {
        nev: "Harc előkészítés",
        kovetkezoFazis: function() {return gameFlow.harciKorok;},
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: function() {},
    },

    harciKorok: {
        nev: "Harci körök",
        kovetkezoFazis: function() {return gameFlow.harcEredmenyenekMeghatarozasa;},
        fazisEleje: function() {},
        fazisVege: function() {},
    },

    harcEredmenyenekMeghatarozasa: {
        nev: "Harc eredményének meghatározása",
        kovetkezoFazis: function() {
            const manoverState = gameState.state.fazis.manover;
            const aktualisManover = manoverState.aktualisManover;
            if (aktualisManover === 'küldetés' && manoverState.kuldetesFolytatas) {
                return gameFlow.akadalylapokAktivizalasa;
            }
            return gameFlow.manoverekFazisa;
        },
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: function() {},
    },
}