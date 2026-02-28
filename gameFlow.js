gameFlow = {
    // TODO sikeresség

    passz: function() {
        const fazis = gameState.state.fazis;
        if (gameState.state.fazis.egypassz) {
            this.duplapassz();
            eventHandler.resolve({tipus: "aktívjátékos"});
            gameState.state.fazis.egypassz = false;
        } else {
            gameState.state.fazis.egypassz = true;
            gameState.state.fazis.prioritas = helper.ellenfel(gameState.state.fazis.prioritas);
        }
    },

    duplapassz: function() {
        const fazis = gameState.state.fazis;
        const idofonal = fazis.idofonal;
        const aktualisFazis = fazis.aktualisFazis;
        const manoverState = fazis.manover;
        
        if (idofonal.folyamatban) {
            if (idofonal.hatasok.length > 0) {
                eventHandler.resolve({tipus: "időfonalvisszafejtés"});
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
        if (aktualisFazis.nev === 'Manőverek fázisa') {
            gameFlow.kovetkezoFazis();
            return;
        }
        // TODO harci körök vége mindkét játékostól
        if (aktualisFazis.nev === 'Harci körök' && manoverState.harciKorokVege) {
            gameFlow.kovetkezoFazis();
            return;
        } 
        if (aktualisFazis.nev === 'Harci körök' && !manoverState.harciKorokVege) {
            gameFlow.ujHarciKor();
        }
    },

    mpKotottFazis: function(fazis) {
        return fazis.nev == "Manőverek fázisa" || fazis.nev == "Harci körök";
    },

    kovetkezoFazis: async function() {
        await gameState.state.fazis.aktualisFazis.fazisVege();
        gameFlow.idofonalZaras();
        eventHandler.resolve();
        const kovetkezoFazis = await gameState.state.fazis.aktualisFazis.kovetkezoFazis();
        gameState.state.fazis.aktualisFazis = kovetkezoFazis;
        await gameState.state.fazis.aktualisFazis.fazisEleje();
        await eventHandler.resolve();
    },

    idofonalNyitas: function(effect) {
        gameState.state.fazis.idofonal.folyamatban = true
        if (effect) gameState.state.fazis.idofonal.hatasok.push(effect)
    },

    idofonalZaras: function() {
        gameState.state.fazis.idofonal.folyamatban = false;

        gameState.players.forEach(player => {
            gameState.jelenSpaces.forEach(space => {
                gameState.state.playerSpaces[player][space].forEach(card => {
                    if (card.laptipus === 'Kalandozó') {
                        const sebzes = card.sebzes || 0;
                        if (sebzes >= helper.getValue(card, "alapszint")) {
                            // TODO nevesítés
                            gameAction.kartyaMozgatasJatekter(player, space, 'mult', card);
                        } else if (sebzes > 0 && !gameState.state.fazis.manover.folyamatban) {
                            card.helyzet = 'Sérült';
                            card.sebzes = 0;
                        }
                    }
                });
            });
        });
        
    },

    manoverVege: function(player) {
        const manoverState = gameState.state.fazis.manover;
        const manoverCards = [...gameState.state.playerSpaces[player].manover];
        manoverCards.forEach(card => {
            gameAction.kartyaMozgatasJatekter(player, 'manover', 'sor', card)
        });

        if (manoverState.sikeresJatekos === player && manoverState.kezdemenyezoJatekos === player && manoverState.aktualisManover == "ostrom") {
            console.log("sikeresség aktiválva")
            gameAction.kartyaMozgatasJatekter(
                helper.ellenfel(player), 'toronyszintek', 'mult', manoverState.szinhely);
        }

        // TODO építmény bevétel

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
                gameState.state.eventSor.push({
                    tipus: "mpnyerés",
                    forras: "szabály",
                    player: player,
                    ertek: 4
                });

                gameState.state.eventSor.push({
                    tipus: "visszaforgatás",
                    forras: "szabály",
                    player: player
                });

                gameState.state.eventSor.push({
                    tipus: "lapkiigazítás",
                    forras: "szabály",
                    player: player
                });

                eventHandler.resolve();

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
        fazisVege: function() {
            eventHandler.resolve({
                tipus: "Forduló vége"
            });
        },
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
        fazisEleje: function() {
            const manoverState = gameState.state.fazis.manover;
            manoverState.manoverezoJatekos = manoverState.kezdemenyezoJatekos;
            gameFlow.idofonalNyitas(null);
        },
        fazisVege: function() {},
    },

    akadalyozoCsapatSorElhagyas: {
        nev: "Akadályozó csapat sorelhagyása",
        kovetkezoFazis: async function() {
            const manoverState = gameState.state.fazis.manover;
            const aktualisManover = manoverState.aktualisManover;
            const kezdemenyezoJatekos = manoverState.kezdemenyezoJatekos;
            const akadalyozoJatekos = helper.ellenfel(kezdemenyezoJatekos);
            const playerSpaces = gameState.state.playerSpaces;
            
            if (playerSpaces[kezdemenyezoJatekos].manover.length > 0 &&
                playerSpaces[akadalyozoJatekos].manover.length > 0) {
                return gameFlow.harcElokeszites;
            }
            
            if (aktualisManover === 'küldetés') {
                if (playerSpaces[akadalyozoJatekos].manover.length === 0) {
                    return gameFlow.akadalylapokAktivizalasa;
                }
                
                // Nem az igazi itt, de fontos, hogy azután legyen, hogy a kalandozóknak volt ideje meghalni
                await eventHandler.resolve({
                    tipus: "küldetésfolytatásdöntés",
                    player: akadalyozoJatekos
                });
                
                if (manoverState.kuldetesFolytatas) {
                    manoverState.manoverezoJatekos = akadalyozoJatekos;
                    gameState.state.eventSor.push({
                        tipus: "manővervége",
                        player: kezdemenyezoJatekos
                    });
                    return gameFlow.akadalylapokAktivizalasa;
                }
            }
            
            gameState.state.eventSor.push({
                tipus: "manővervége",
                player: kezdemenyezoJatekos
            });
            return gameFlow.manoverekFazisa;
        },
        fazisEleje: async function() {
            const manoverState = gameState.state.fazis.manover;
            const kezdemenyezoJatekos = manoverState.kezdemenyezoJatekos;
            const akadalyozoJatekos = helper.ellenfel(kezdemenyezoJatekos);
            const playerAttributes = gameState.state.playerAttributes;
            if ((playerAttributes[helper.ellenfel(kezdemenyezoJatekos)].akadalyozocsapat || []).length === 0) {
                    gameState.state.eventSor.push({
                    tipus: "akadályozócsapatválasztás",
                    player: akadalyozoJatekos
                });    
            }
            gameState.state.eventSor.push({
                tipus: "akadályozócsapatsorelhagyás",
                player: akadalyozoJatekos
            });
            gameFlow.idofonalNyitas(null);
        },
        fazisVege: function() {
            // TODO manőver vége, ha üres a csapat
            // TODO manőver vége, ha üres az akadályozó csapat, és ilyenkor sikeres
        },
    },

    toronyszintFelfedese: {
        nev: "Toronyszint felfedése",
        kovetkezoFazis: function() {return gameFlow.akadalylapokAktivizalasa;},
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: function() {
            // TODO manőver vége, ha üres a csapat
        },
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
            } else if ((playerAttributes[helper.ellenfel(kezdemenyezoJatekos)].akadalyozocsapat || []).length > 0) {
                return gameFlow.akadalyozoCsapatSorElhagyas;
            } else {
                return gameFlow.manoverekFazisa;
            }
        },
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: async function() {
            const manoverState = gameState.state.fazis.manover;
            const aktualisManover = manoverState.aktualisManover;
            const kezdemenyezoJatekos = manoverState.kezdemenyezoJatekos;
            const playerAttributes = gameState.state.playerAttributes;

            if ((aktualisManover == "ostrom" || aktualisManover == "építmény bevétele")) {
                await eventHandler.resolve({
                    tipus: "akadályozócsapatválasztás",
                    player: helper.ellenfel(kezdemenyezoJatekos)
                });
            }
            
            if (aktualisManover !== 'küldetés' && 
                    playerAttributes[helper.ellenfel(kezdemenyezoJatekos)].akadalyozocsapat.length === 0) {
                
                const manoverCards = gameState.state.playerSpaces[kezdemenyezoJatekos].manover;
                const osszszint = manoverCards.reduce((sum, card) => {
                    if (card.laptipus === 'Kalandozó') {
                        return sum + helper.getValue(card, "alapszint") - (card.sebzes || 0);
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
            // TODO manőver vége, ha üres a csapat
        },
    },

    kuldetesFeltetelTeljesites: {
        nev: "Küldetés feltétel teljesítés",
        kovetkezoFazis: function() {return gameFlow.manoverekFazisa;},
        fazisEleje: function() {
            const manoverState = gameState.state.fazis.manover;
            gameState.state.eventSor.push({
                tipus: "feltételválasztás",
                player: manoverState.manoverezoJatekos,
                feltetelek: manoverState.szinhely.feltetel,
                forrasesemeny: {
                    tipus: "megoldásdöntés",
                    player: manoverState.manoverezoJatekos,
                }
            });
            gameFlow.idofonalNyitas(null)
        },
        fazisVege: function() {
            const manoverState = gameState.state.fazis.manover;
            gameState.state.eventSor.push({
                    tipus: "manővervége",
                    player: manoverState.manoverezoJatekos
            });
        },
    },

    harcElokeszites: {
        nev: "Harc előkészítés",
        kovetkezoFazis: function() {return gameFlow.harciKorok;},
        fazisEleje: function() {gameFlow.idofonalNyitas(null)},
        fazisVege: function() {
            // TODO hadrend állítás
        },
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
        fazisEleje: function() {
            // TODO csapatszint összehasonlítás, harc nyertesének beállítása ez alapján
            const manoverState = gameState.state.fazis.manover;
            const kezdemenyezoJatekos = manoverState.kezdemenyezoJatekos;
            const akadalyozoJatekos = helper.ellenfel(kezdemenyezoJatekos);
            
            const kezdemenyezoCsapatszint = helper.getValue(kezdemenyezoJatekos, "csapatszint");
            const akadalyozoCsapatszint = helper.getValue(akadalyozoJatekos, "csapatszint");
            
            if (kezdemenyezoCsapatszint > akadalyozoCsapatszint) {
                manoverState.harcNyertes = kezdemenyezoJatekos;
            } else if (akadalyozoCsapatszint > kezdemenyezoCsapatszint) {
                manoverState.harcNyertes = akadalyozoJatekos;
            } else {
                manoverState.harcNyertes = null;
            }
            // Ha egyenlő, akkor nincs győztes (harcNyertes marad null)
            
            gameFlow.idofonalNyitas(null);
        },
        fazisVege: async function() {
            const manoverState = gameState.state.fazis.manover;
            if (manoverState.harcNyertes && manoverState.aktualisManover === 'küldetés') {
                const nyertesJatekos = manoverState.harcNyertes;
                await eventHandler.resolve({
                    tipus: "küldetésfolytatásdöntés",
                    player: nyertesJatekos
                });
            }

            gameState.state.eventSor.push({
                tipus: "Harc vége"
            });
            
            gameState.players.forEach(player => {
                const nyertesEsKuldetesEsFolytatas = manoverState.harcNyertes === player && 
                    manoverState.aktualisManover === 'küldetés' && 
                    manoverState.kuldetesFolytatas;
                
                if (!nyertesEsKuldetesEsFolytatas) {
                    gameState.state.eventSor.push({
                        tipus: "manővervége",
                        player: player
                    });
                } else {
                    manoverState.manoverezoJatekos = manoverState.harcNyertes;
                }
            });
        },
    },
}