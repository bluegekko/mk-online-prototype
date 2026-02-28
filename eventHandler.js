eventHandler = {
    resolve: async function(ujEsemeny) {
        if (ujEsemeny) {gameState.state.eventSor.push(ujEsemeny);}
        let esemeny;
        while (esemeny = gameState.state.eventSor.shift()) {
            console.log("Resolving: ", esemeny.tipus);
            eventHandler.figyelokEloAktivalasa(esemeny);
            await eventHandler.eventResolver[esemeny.tipus](esemeny);
            eventHandler.figyelokUtoAktivalasa(esemeny);
        }
        
        gameState.state.playerAttributes[gameState.state.aktualisJatekos].kivalasztas = [];
        gameUi.render();
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
        "aktívjátékos" : function(esemeny) {
            const playerMp = gameState.state.playerAttributes.player.mp;
            const opponentMp = gameState.state.playerAttributes.opponent.mp;
            
            if (playerMp > opponentMp) {
                gameState.state.fazis.prioritas = 'player';
            } else if (opponentMp > playerMp) {
                gameState.state.fazis.prioritas = 'opponent';
            } else {
                // Egyenlő MP esetén a régebben MP-kötött manővert végrehajtó játékos
                const legutobbiMpKotottManover = gameState.state.fazis.legutobbiMpKotottManover;
                
                if (legutobbiMpKotottManover === 'player') {
                    gameState.state.fazis.prioritas = 'opponent';
                } else {
                    gameState.state.fazis.prioritas = 'player';
                }
            }
        },
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
                forras: "szabály",
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
        "Forduló vége": function(esemeny) {
            gameState.state.figyelok = gameState.state.figyelok.filter(figyelo => 
                figyelo.idotartam !== "Forduló"
            );
        },
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
        "kártyaválasztás": async function(esemeny) {
            gameState.state.valasztas = {
                tipus: "kártyaválasztás",
                player: esemeny.player,
                min: esemeny.szam,
                max: esemeny.szam,
                opciok: esemeny.hataskor || [],
                valasztott: [],
                kesz: false
            };
            await playerActionWrapper.executeAction('opciovalasztas', esemeny.player);
            
            esemeny.forrasesemeny.hataskor = gameState.state.playerAttributes[esemeny.player].kivalasztas;
            gameState.state.valasztas = null;
            gameState.state.eventSor.push(esemeny.forrasesemeny);
        },
        "feltételválasztás": async function(esemeny) {
            const manoverCsapat = gameState.state.playerSpaces[esemeny.player].manover;
            const teljesulheto = esemeny.feltetelek.filter(f => feltetel.teljesul(f, manoverCsapat));
            
            gameState.state.valasztas = {
                tipus: "feltételválasztás",
                player: esemeny.player,
                min: 0,
                max: teljesulheto.length,
                opciok: esemeny.feltetelek,
                valasztott: [],
                kesz: false
            };
            await playerActionWrapper.executeAction('opciovalasztas', esemeny.player);
            
            esemeny.forrasesemeny.teljesitettFeltetelek = gameState.state.valasztas.valasztott;
            gameState.state.valasztas = null;
            gameState.state.eventSor.push(esemeny.forrasesemeny);
        },
        "megoldásdöntés": async function(esemeny) {
            kuldetes = gameState.state.fazis.manover.szinhely;
            if (esemeny.teljesitettFeltetelek.length === 0) return;
            if (gameState.state.playerAttributes[esemeny.player].mp < helper.getValue(kuldetes, "mp")) return;

            gameState.state.valasztas = {
                tipus: "megoldásdöntés",
                player: esemeny.player,
                min: 1,
                max: 1,
                opciok: ["Megoldom", "Nem oldom meg"],
                valasztott: []
            };
            await playerActionWrapper.executeAction('opciovalasztas', esemeny.player);
            
            if (gameState.state.valasztas.valasztott.includes("Megoldom")) {
                gameState.state.eventSor.push({
                    tipus: "küldetésmegoldás",
                    player: esemeny.player,
                    kuldetes: kuldetes,
                    teljesitettFeltetelek: esemeny.teljesitettFeltetelek
                });
            }
            gameState.state.valasztas = null;
        },
        "küldetésmegoldás": function(esemeny) {
            gameState.state.eventSor.push({
                tipus: "mpfizetés",
                player: esemeny.player,
                ertek: helper.getValue(esemeny.kuldetes, "mp")
            });
            gameState.state.eventSor.push({
                tipus: "kártyamozgatás",
                player: esemeny.player,
                honnan: "kuldetesek",
                hova: "megoldottkuldetesek",
                hataskor: [esemeny.kuldetes]
            });
        },
        "küldetésfolytatásdöntés": async function(esemeny) {
            gameState.state.valasztas = {
                tipus: "küldetésfolytatásdöntés",
                player: esemeny.player,
                min: 1,
                max: 1,
                opciok: ["Folytatom", "Nem folytatom"],
                valasztott: []
            };
            await playerActionWrapper.executeAction('opciovalasztas', esemeny.player);
            
            const manoverState = gameState.state.fazis.manover;
            if (gameState.state.valasztas.valasztott.includes("Folytatom")) {
                manoverState.kuldetesFolytatas = true;
                manoverState.manoverezoJatekos = esemeny.player;
            } else {
                manoverState.kuldetesFolytatas = false;
            }
            gameState.state.valasztas = null;
        },
        "kártyahozzáadás": function(esemeny) {
            gameAction.kartyaHozzaadas(esemeny.nev, esemeny.player, esemeny.hova, esemeny.helyzet);
        },
        "időfonalbakerülés": function(esemeny) {
            gameState.state.fazis.idofonal.hatasok.push(esemeny.hatas);
        },
        "gyógyulás": function(esemeny) {
            for (const card of esemeny.hataskor) {
                card.sebzes = Math.max(0, (card.sebzes || 0) - esemeny.gyogyulas);
            }
        },
        "semlegesítés": function(esemeny) {
            // TODO
        },
        "mpvesztés": function(esemeny) {
            gameState.state.playerAttributes[esemeny.player].mp = 
                Math.max(0, gameState.state.playerAttributes[esemeny.player].mp - esemeny.ertek);
        },
        "mpfizetés": function(esemeny) {
            gameState.state.playerAttributes[esemeny.player].mp = 
                Math.max(0, gameState.state.playerAttributes[esemeny.player].mp - esemeny.ertek);
        },
        "mpnyerés": function(esemeny) {
            gameState.state.playerAttributes[esemeny.player].mp += esemeny.ertek;
        },
        "visszaforgatás": function(esemeny) {
            const kalandozok = gameState.state.playerSpaces[esemeny.player].sor.filter(card => card.laptipus === 'Kalandozó');
            kalandozok.forEach(card => {
                if (card.helyzet === "Pihenő") {
                    gameState.state.eventSor.push({
                        tipus: "helyzetbeállítás",
                        forras: "szabály",
                        hataskor: [card],
                        helyzet: "Éber"
                    });
                } else if (card.helyzet === "Sérült") {
                    gameState.state.eventSor.push({
                        tipus: "helyzetbeállítás",
                        forras: "szabály",
                        hataskor: [card],
                        helyzet: "Pihenő"
                    });
                }
            });
        },
        "manővervége": function(esemeny) {
            const manoverCards = [...gameState.state.playerSpaces[esemeny.player].manover];
            manoverCards.forEach(card => {
                gameState.state.eventSor.push({
                    tipus: "kártyamozgatás",
                    forras: "szabály",
                    player: esemeny.player,
                    honnan: "manover",
                    hova: "sor",
                    hataskor: [card],
                    ujHelyzet: "Pihenő",
                });
            });

            const masikJatekos = helper.ellenfel(esemeny.player);
            if (gameState.state.playerSpaces[masikJatekos].manover.length === 0) {
                gameState.state.fazis.manover = helper.resetManoverState();
            }
        },
        "akadályozócsapatválasztás": async function(esemeny){
            const eberKalandozok = gameState.state.playerSpaces[esemeny.player].sor.filter(card => card.helyzet === 'Éber');

            gameState.state.valasztas = {
                tipus: "kártyaválasztás",
                player: esemeny.player,
                min: 0,
                max: null,
                opciok: eberKalandozok,
                valasztott: []
            };
            await playerActionWrapper.executeAction('opciovalasztas', esemeny.player);
            gameState.state.playerAttributes[esemeny.player].akadalyozocsapat = [...gameState.state.valasztas.valasztott];
            gameState.state.valasztas = null;
        },
        "akadályozócsapatsorelhagyás": function(esemeny) {
            const akadalyozocsapat = gameState.state.playerAttributes[esemeny.player].akadalyozocsapat || [];
            akadalyozocsapat.forEach(card => {
                gameState.state.eventSor.push({
                    tipus: "kártyamozgatás",
                    forras: "szabály",
                    player: esemeny.player,
                    honnan: "sor",
                    hova: "manover",
                    hataskor: [card]
                });
            });
        },
        "feláldozás": function(esemeny) {
            for (const card of esemeny.hataskor) {
                const honnan = gameState.state.playerSpaces[esemeny.player].sor.includes(card) ? "sor" : "manover";
                gameState.state.eventSor.push({
                    tipus: "kártyamozgatás",
                    forras: "szabály",
                    player: esemeny.player,
                    honnan: honnan,
                    hova: "mult",
                    hataskor: [card]
                });
            }
        },
        "csatolás": function(esemeny) {
            if (!esemeny.hova.csatoltlapok) {
                esemeny.hova.csatoltlapok = [];
            }
            esemeny.hova.csatoltlapok.push(esemeny.lap);
            esemeny.lap.csatoltHely = esemeny.hova;
        },
        "akadálylapcsatolás": function(esemeny) {
            if (gameEffect.akadalylapCsatolasValidalas(esemeny.hova)) {
                gameState.state.eventSor.push({
                    tipus: "csatolás",
                    lap: esemeny.lap,
                    hova: esemeny.hova
                });
                return;
            }
        },
        "sebzés": function(esemeny) {
            for (const card of esemeny.hataskor) {
                card.sebzes = (card.sebzes || 0) + esemeny.sebzes;
            }
        },
        "lapérvényesülés": function(esemeny) {
            if (!(esemeny.forras.laptipus === "Akadálylap" && esemeny.forras.akadalylapmod === "csatolás") && esemeny.hatas && esemeny.hatas.szoveg) {
                gameEffect[esemeny.hatas.szoveg].ervenyesul(esemeny.forras);
            }
        },
        "képességlaphatásérvényesülés": function(esemeny) {
            gameEffect[esemeny.hatas.szoveg].ervenyesul(esemeny.hatas)
        },
        "lapleidézés": function(esemeny) {
            esemeny.lap.fizetes(esemeny.player);
            gameState.state.eventSor.push({
                tipus: "kártyamozgatás",
                player: esemeny.player,
                honnan: esemeny.honnan,
                hova: "idofonal",
                hataskor: [esemeny.lap]
            });
            gameFlow.idofonalNyitas();
        },
        "időfonalvisszafejtés": function(esemeny) {
            const fazis = gameState.state.fazis;
            const idofonal = fazis.idofonal;
            if (idofonal.hatasok.length > 0) {
                aktualisHatas = idofonal.hatasok.at(-1);
                console.log(aktualisHatas)
                if (aktualisHatas.isCard) {
                    if (aktualisHatas.laptipus === 'Akadálylap' && aktualisHatas.akadalylapmod === "csatolás") {
                        gameState.state.eventSor.push({
                            tipus: "akadálylapcsatolás",
                            lap: aktualisHatas,
                            hova: aktualisHatas.csatolas
                        });
                    }

                     // TODO akadálylap múltba menjen, ha nem lehet csatolni
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
                    idofonal.hatasok.pop()
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