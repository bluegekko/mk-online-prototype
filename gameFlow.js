gameFlow = {
    duplapassz: function(state) {
        if(state.fazis.idofonal.folyamatban){
            if (state.fazis.idofonal.hatasok.length > 0) {
                aktualisHatas = state.fazis.idofonal.hatasok.pop();
                aktualisHatas.ervenyesul();
                return;
            } else {
                gameFlow.idofonalZaras(state)
                if (!gameFlow.mpKotottFazis(state.fazis.aktualisFazis)) {                    
                    gameFlow.kovetkezoFazis(state);
                    return;
                }
                return;
            }
        }
        if (state.fazis.aktualisFazis.nev = 'Manőverek fázisa') {
            gameFlow.kovetkezoFazis(state);
            return;
        }
        if (state.fazis.aktualisFazis.nev = 'Harci körök' && state.fazis.manover.harciKorokVege) {
            gameFlow.kovetkezoFazis(state);
            return;
        } 
        if (state.fazis.aktualisFazis.nev = 'Harci körök' && !state.fazis.manover.harciKorokVege) {
            gameFlow.ujHarciKor(state);
        }
    },

    mpKotottFazis: function(fazis) {
        return fazis.nev == "Manőverek fázisa" || fazis.nev == "Harci körök";
    },

    kovetkezoFazis: function(state) {
        // TODO implement
        state.fazis.aktualisFazis.fazisVege(state);
        state.fazis.aktualisFazis = state.fazis.aktualisFazis.kovetkezoFazis(state);
        // TODO implement
        state.fazis.aktualisFazis.fazisEleje(state);
    },

    idofonalNyitas: function(state, effect) {
        state.fazis.idofonal.folyamatban = true
        if (effect) state.fazis.idofonal.hatasok.push(effect)
    },

    idofonalZaras: function(state) {
        state.fazis.idofonal.folyamatban = false
    },

    forduloKezdete: {
        nev: "Forduló kezdete",
        kovetkezoFazis: function(state) {
            return gameFlow.eroforrasFazis;
        },
        fazisEleje: function(state) {gameFlow.idofonalNyitas(state, null)},
        fazisVege: function(state) {},
    },

    eroforrasFazis: {
        nev: "Erőforrás fázis",
        kovetkezoFazis: function(state) {return gameFlow.manoverekFazisa;},
        fazisEleje: function(state) {
            window.gameState.players.forEach(player => {
                state.playerAttributes[player].mp += 4
                // Kör eleji regenerálás: minden Pihenő -> Éber a Sorban
                state.playerSpaces[player].sor.forEach(card => {
                    if (card.helyzet === "Pihenő") {
                        card.helyzet = "Éber";
                    }
                });

                // Húzás 7 lapra
                const kezbenLevok = state.playerSpaces[player].kez.length;
                const huzandoLapok = 7 - kezbenLevok;
                
                if (huzandoLapok > 0) {
                    for (let i = 0; i < huzandoLapok; i++) {
                        gameAction.laphuzas(player);
                    }
                }
            });
            gameFlow.idofonalNyitas(state, null)
        },
        fazisVege: function(state) {},
    },

    manoverekFazisa: {
        nev: "Manőverek fázisa",
        kovetkezoFazis: function(state) {return gameFlow.forduloVege;},
        fazisEleje: function(state) {},
        fazisVege: function(state) {},
    },

    forduloVege: {
        nev: "Forduló vége",
        kovetkezoFazis: function(state) {return gameFlow.forduloKezdete;},
        fazisEleje: function(state) {gameFlow.idofonalNyitas(state, null)},
        fazisVege: function(state) {},
    },

    kezdemenyezoCsapatSorElhagyas: {
        nev: "Kezdeményező csapat sorelhagyása",
        // TODO felszerelkezés a fazis elején
        kovetkezoFazis: function(state) {
            if (state.manover.aktualisManover === 'ostrom') {
                return gameFlow.toronyszintFelfedese;
            } else if (state.manover.aktualisManover === 'építmény bevétele') {
                return gameFlow.akadalylapokAktivizalasa;
            } else {
                return gameFlow.akadalyozoCsapatSorElhagyas;
            }
        },
        fazisEleje: function(state) {},
        fazisVege: function(state) {},
    },

    akadalyozoCsapatSorElhagyas: {
        nev: "Akadályozó csapat sorelhagyása",
        kovetkezoFazis: function(state) {
            if (state.playerSpaces[state.manover.kezdemenyezoJatekos].manover.length > 0 &&
                state.playerSpaces[helper.ellenfel(state.manover.kezdemenyezoJatekos)].manover.length > 0) {
                return gameFlow.harcElokeszites;
            }
            if (state.manover.aktualisManover === 'küldetés' && state.manover.kuldetesFolytatas) {
                return gameFlow.akadalylapokAktivizalasa;
            } else {
                // FELTÉTELEZÉS: csak manőverek fázisában lehet manőverezni.
                return gameFlow.manoverekFazisa;
            }
        },
        fazisEleje: function(state) {},
        fazisVege: function(state) {},
    },

    toronyszintFelfedese: {
        nev: "Toronyszint felfedése",
        kovetkezoFazis: function(state) {return gameFlow.akadalylapokAktivizalasa;},
        fazisEleje: function(state) {},
        fazisVege: function(state) {},
    },

    akadalylapokAktivizalasa: {
        nev: "Akadálylapok aktivizálása",
        kovetkezoFazis: function(state) {
            if (state.manover.aktualisManover === 'küldetés') {
                return gameFlow.kuldetesFeltetelTeljesites;
            } else {
                return gameFlow.akadalyozoCsapatSorElhagyas;
            }
        },
        fazisEleje: function(state) {},
        fazisVege: function(state) {},
    },

    kuldetesFeltetelTeljesites: {
        nev: "Küldetés feltétel teljesítés",
        kovetkezoFazis: function(state) {return gameFlow.manoverekFazisa;},
        fazisEleje: function(state) {},
        fazisVege: function(state) {},
    },

    harcElokeszites: {
        nev: "Harc előkészítés",
        kovetkezoFazis: function(state) {return gameFlow.harciKorok;},
        fazisEleje: function(state) {},
        fazisVege: function(state) {},
    },

    harciKorok: {
        nev: "Harci körök",
        kovetkezoFazis: function(state) {return gameFlow.harcEredmenyenekMeghatarozasa;},
        fazisEleje: function(state) {},
        fazisVege: function(state) {},
    },

    harcEredmenyenekMeghatarozasa: {
        nev: "Harc eredményének meghatározása",
        kovetkezoFazis: function(state) {
            if (state.manover.aktualisManover === 'küldetés' && state.manover.kuldetesFolytatas) {
                return gameFlow.akadalylapokAktivizalasa;
            }
            return gameFlow.manoverekFazisa;
        },
        fazisEleje: function(state) {},
        fazisVege: function(state) {},
    },
}