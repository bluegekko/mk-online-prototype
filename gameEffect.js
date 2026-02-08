gameEffect = {
    vanParameter: function(card, parameter) {
        const parameterKicsi = parameter.toLowerCase();
        return card.szinesito && card.szinesito.toLowerCase().includes(parameterKicsi) || card.nev && card.nev.toLowerCase().includes(parameterKicsi);
    },

    jelenbenVan: function(card) {
        // TODO currentspace referencia
        for (player of gameState.players) {
            for (space of gameState.jelenSpaces) {
                if (gameState.state.playerSpaces[player][space].includes(card)) {
                    return true;
                }
            }
        }
        return false;
    },

    idofonalbanVan: function(card) {
        if (gameState.state.fazis.idofonal.hatasok.includes(card)) {
            return true;
        }
        return false;
    },

    sebzoAkciolapCelpontValidalas: function(celpontok) {
        if (celpontok.length === 0) return false;
        celpont = celpontok[0];
        return gameEffect.jelenbenVan(celpont) && celpont.laptipus === 'Kalandozó';
    },

    kasztValidalas: function(leidezo, card) {
        // TODO
        return true;
    },

    feltetelValidalas: function(hatas, player) {
         if (hatas.isCard && hatas.laptipus === 'Akciólap') {
            const leidezo = gameState.state.playerAttributes[player].leidezo;
            if (leidezo && leidezo.helyzet !== 'Éber') return false;
            if (!this.kasztValidalas(leidezo, hatas)) return false;
         }
         return true;
    },

    celpontValasztas: function(hatas, player) {
        console.log("celpont valasztas: ", hatas)
        kivalasztas = gameState.state.playerAttributes[player].kivalasztas;
        if (hatas.isCard){
            if (hatas.laptipus === 'Akciólap' && hatas.sebzes !== undefined) {
                    if (!gameEffect.sebzoAkciolapCelpontValidalas(kivalasztas)) return false;
                    hatas.sebzesCelpont = kivalasztas[0];
                    kivalasztas = kivalasztas.slice(1);
            }

            ervenyesuloHatas = helper.ervenyesuloHatas(hatas);
            if (!ervenyesuloHatas) {
                return true;
            }
            if (gameEffect[ervenyesuloHatas.szoveg].celpontValidalas(kivalasztas)) {
                hatas.celpont = [...kivalasztas];
                return true;
            }
        } else {
            if (gameEffect[hatas.szoveg].celpontValidalas(kivalasztas)) {
                hatas.celpont = [...kivalasztas];
                return true;
            }
        }
        return false;
    },

    "Célpont kalandozó kap 1 alapszintet." : {
        ervenyesul: function(card) {
            if (!this.celpontValidalas(card.celpont)) return; // semlegesítésnek számít
            gameState.state.eventSor.push({
                tipus: "értékmódosítás",
                forras: card.isCard ? card : card.forras,
                hataskor: [card.celpont],
                ertektipus: "alapszint",
                ertek: 1
            })
        },

        celpontValidalas: function(celpontok) {
            if (!celpontok || celpontok.length !== 1) return false;
            const card = celpontok[0];
            return gameEffect.jelenbenVan(card) && card.laptipus === 'Kalandozó';
        },
    },

    "Játékosa Sorába 2 jelző Zombi kerül pihenő helyzetben." : {
        ervenyesul: function(card) {
            for (let i = 0; i < 2; i++) {
                card = gameAction.kartyaHozzaadas("Zombi", card.tulajdonos, 'sor');
                card.helyzet = "Pihenő";
            }
        },

        celpontValidalas: function(card) {return true;}
    },

    "Célpont salnarri kalandozó alapszintje 1-gyel nő a forduló végéig. A képesség pihenő és sérült helyzetben is aktivizálható." : {
        ervenyesul: function(hatas) {
            if (!this.celpontValidalas(hatas.celpont)) return;
            gameState.state.eventSor.push({
                tipus: "értékmódosítás",
                idotartam: "Forduló",
                forras: hatas.isCard ? hatas : hatas.forras,
                hataskor: [hatas.celpont],
                ertektipus: "alapszint",
                ertek: 1
            })
            delete hatas.celpont;
        },

        celpontValidalas: function(celpontok) {
            console.log("salnarri celpont validalas: ", celpontok)
            if (!celpontok || celpontok.length !== 1) return false;
            const card = celpontok[0];
            return gameEffect.jelenbenVan(card) && card.laptipus === 'Kalandozó' && gameEffect.vanParameter(card, 'salnar');
        },
    },

    "A képesség aktivizálásának feltétele a feláldozása. Minden kalandozó pihenő helyzetbe fordul." : {
        ervenyesul: function(hatas) {
            const kalandozok = [];
            for (const player of gameState.players) {
                for (const space of gameState.jelenSpaces) {
                    gameState.state.playerSpaces[player][space].forEach(card => {
                        if (card.laptipus === 'Kalandozó') {
                            kalandozok.push(card);
                        }
                    });
                }
            }
            gameState.state.eventSor.push({
                tipus: "helyzetbeállítás",
                forras: hatas.isCard ? hatas : hatas.forras,
                hataskor: kalandozok,
                helyzet: "pihenő"
            });
        },

        celpontValidalas: function(celpontok) {return true;}
    },

    "Az ellenséges kalandozók asztrálja 1-gyel csökken." : {
        ervenyesul: function(hatas) {
            const ellenfel = helper.ellenfel(hatas.tulajdonos);
            const ellenfelKalandozok = gameState.jelenSpaces.flatMap(space =>
                gameState.state.playerSpaces[ellenfel][space].filter(card => card.laptipus === 'Kalandozó')
            );            
            gameState.state.eventSor.push({
                tipus: "értékmódosítás",
                forras: hatas.isCard ? hatas : hatas.forras,
                hataskor: ellenfelKalandozok,
                ertektipus: "alapkepessegek.Asztral",
                ertek: -1
            })
        },

        celpontValidalas: function(celpontok) {return true;}
    },

    "Célpont felszerelés elveszíti képességeit." : {
        ervenyesul: function(hatas) {
            if (!this.celpontValidalas(hatas.celpont)) return;
            hatas.celpont[0].hatasok = hatas.celpont[0].hatasok.filter(h => h.tipus === 'laphatás');
        },

        celpontValidalas: function(celpontok) {
            if (!celpontok || celpontok.length !== 1) return false;
            const card = celpontok[0];
            return gameEffect.jelenbenVan(card) && helper.isFelszereles(card);
        },
    },

    "Olyan kalandozó lapok MP-igénye 1-gyel nő, akik nem emberek.": {
        bekapcsolas: function(hatas) {
            console.log("MP növelés hozzáadva");
            gameState.state.szamolasModositok.push({
                forras: hatas.card,
                tulajdonsag: "mp",
                feltetel: function(card) {
                    const nemEmberFaj = helper.fajok.find(faj => 
                            faj !== 'ember' && gameEffect.vanParameter(card, faj) &&
                            !gameEffect.vanParameter(card, 'ember')
                    );
                    return card.isCard && card.laptipus == "Kalandozó" && nemEmberFaj;
                },
                vegrehajtas: function(ertek) {
                    ertek.modositas = ertek.modositas || []; 
                    ertek.modositas.push({"ertek": 1});                }
            })
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.szamolasModositok.findIndex(mod => mod.forras === hatas.card);
            if (index !== -1) gameState.state.szamolasModositok.splice(index, 1);
        }
    },

    "Kap 1 alapszintet. Célpont kalandozó veszít 1 alapszintet. A hatás a harc végéig tart.": {
        ervenyesul: function(hatas) {
            if (!this.celpontValidalas(hatas.celpont)) return;
            
            gameState.state.eventSor.push({
                tipus: "értékmódosítás",
                forras: hatas.isCard ? hatas : hatas.forras,
                hataskor: [hatas.forras],
                idotartam: "Harc",
                ertektipus: "alapszint",
                ertek: 1
            });

            gameState.state.eventSor.push({
                tipus: "értékmódosítás",
                forras: hatas.isCard ? hatas : hatas.forras,
                hataskor: [hatas.celpont[0]],
                idotartam: "Harc",
                ertektipus: "alapszint",
                ertek: -1
            });
        },

        celpontValidalas: function(celpontok) {
            if (!celpontok || celpontok.length !== 1) return false;
            const card = celpontok[0];
            return gameEffect.jelenbenVan(card) && card.laptipus === 'Kalandozó';
        },
    },
    "Az ellenfél kalandozói +1 szintet sebződnek az általa leidézett természet szférájú varázslatoktól.": {
        bekapcsolas: function(hatas) {
            gameState.state.figyelok.push({
                esemenytipus: "sebzés",
                forras: hatas.card,
                allando: true,
                idozites: "előtte",
                ervenyesul: (triggerEsemeny) => {
                    console.log("sebzes figyelo", triggerEsemeny);
                    if (triggerEsemeny.forras && 
                            triggerEsemeny.forras.akciotipus && 
                            triggerEsemeny.forras.akciotipus === 'Varázslat' && 
                            triggerEsemeny.forras.szferak.includes('Természet') &&
                            triggerEsemeny.forras.leidezo === hatas.card &&
                            triggerEsemeny.hataskor && triggerEsemeny.hataskor[0].laptipus === 'Kalandozó' &&
                            triggerEsemeny.hataskor[0].tulajdonos !== hatas.card.tulajdonos) {
                        console.log("sebzés növelés");
                        triggerEsemeny.ertek += 1;
                    }
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.figyelok.findIndex(figyelo => figyelo.forras === hatas.card);
            if (index !== -1) gameState.state.figyelok.splice(index, 1);
        }
    },
    "Alapszintje 1-gyel nő, ha játékosa irányít nevesített HARCMŰVÉSZ-t.": {
        bekapcsolas: function(hatas) {
            gameState.state.szamolasModositok.push({
                forras: hatas.card,
                tulajdonsag: "alapszint",
                feltetel: function(card) {
                    return card === hatas.card;
                },
                vegrehajtas: function(ertek) {
                    const player = hatas.card.tulajdonos;
                    const vanNevesitettHarcmuvesz = gameState.state.playerSpaces[player].sor.some(c => 
                        c.fokaszt && c.fokaszt.includes('HARCMŰVÉSZ') && c.tulajdonsag.includes('nevesített'));
                    if (vanNevesitettHarcmuvesz) {
                        ertek.modositas = ertek.modositas || [];
                        ertek.modositas.push({"ertek": 1});
                    }
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.szamolasModositok.findIndex(mod => mod.forras === hatas.card);
            if (index !== -1) gameState.state.szamolasModositok.splice(index, 1);
        }
    },

    "Kalandozók sorelhagyó manőverből semmiképpen nem térhetnek vissza Sorba éber helyzetben.": {
        bekapcsolas: function(hatas) {
            gameState.state.figyelok.push({
                esemenytipus: "kártyamozgatás",
                forras: hatas.card,
                allando: true,
                ervenyesul: (triggerEsemeny) => {
                    if (gameState.state.fazis.sorelhagyoManover && 
                        triggerEsemeny.hova === "sor" && 
                        triggerEsemeny.ujHelyzet === "éber") {
                        triggerEsemeny.ujHelyzet = "pihenő";
                    }
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.figyelok.findIndex(figyelo => figyelo.forras === hatas.card);
            if (index !== -1) gameState.state.figyelok.splice(index, 1);
        }
    },

    "Akciólapok sebzése legfeljebb 1-gyel lehet több, mint az MP-értékük. Ha az MP-értékében szerepel X, akkor sebzése legfeljebb 2 lehet.": {
        bekapcsolas: function(hatas) {
            gameState.state.figyelok.push({
                esemenytipus: "sebzés",
                forras: hatas.card,
                allando: true,
                ervenyesul: (triggerEsemeny) => {
                    if (triggerEsemeny.forras && triggerEsemeny.forras.laptipus === "Akciólap") {
                        const mpErtek = triggerEsemeny.forras.mp.ertek;
                        const maxSebzes = triggerEsemeny.forras.mp.ertek.toString().includes('X') ? 2 : mpErtek + 1;
                        if (triggerEsemeny.ertek > maxSebzes) {
                            triggerEsemeny.ertek = maxSebzes;
                        }
                    }
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.figyelok.findIndex(figyelo => figyelo.forras === hatas.card);
            if (index !== -1) gameState.state.figyelok.splice(index, 1);
        }
    },
    
    "Kap 1 alapszintet, amikor az ellenfél eseménylapot idéz le.": {
        bekapcsolas: function(hatas) {
            gameState.state.figyelok.push({
                esemenytipus: "lapleidézés",
                forras: hatas.card,
                allando: true,
                ervenyesul: (triggerEsemeny) => {
                    if (triggerEsemeny.lap && triggerEsemeny.lap.laptipus === "Eseménylap" &&
                        triggerEsemeny.player !== hatas.card.tulajdonos) {
                        gameState.state.eventSor.push({
                            tipus: "értékmódosítás",
                            forras: hatas.card,
                            hataskor: [hatas.card],
                            ertektipus: "alapszint",
                            ertek: 1
                        });
                    }
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.figyelok.findIndex(figyelo => figyelo.forras === hatas.card);
            if (index !== -1) gameState.state.figyelok.splice(index, 1);
        }
    },

    "Célpont toroni kalandozó sérült helyzetbe fordul.": {
        ervenyesul: function(hatas) {
            if (!this.celpontValidalas(hatas.celpont)) return;
            gameState.state.eventSor.push({
                tipus: "helyzetbeállítás",
                forras: hatas.forras,
                hataskor: [hatas.celpont[0]],
                helyzet: "Sérült"
            });
        },
        celpontValidalas: function(celpontok) {
            if (!celpontok || celpontok.length !== 1) return false;
            const card = celpontok[0];
            return gameEffect.jelenbenVan(card) && card.laptipus === 'Kalandozó' && gameEffect.vanParameter(card, 'toroni');
        }
    },

    "Dwoon kalandozók + 1 szintet sebződnek minden sebzésforrásból.": {
        bekapcsolas: function(hatas) {
            gameState.state.figyelok.push({
                esemenytipus: "sebzés",
                forras: hatas.card,
                allando: true,
                ervenyesul: (triggerEsemeny) => {
                    if (triggerEsemeny.hataskor && triggerEsemeny.hataskor[0].laptipus === 'Kalandozó' &&
                        gameEffect.vanParameter(triggerEsemeny.hataskor[0], 'dwoon')) {
                        triggerEsemeny.ertek += 1;
                    }
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.figyelok.findIndex(figyelo => figyelo.forras === hatas.card);
            if (index !== -1) gameState.state.figyelok.splice(index, 1);
        }
    },

    "Játékosa fegyver tárgyainak MP-igénye 1-gyel csökken.": {
        bekapcsolas: function(hatas) {
            gameState.state.szamolasModositok.push({
                forras: hatas.card,
                tulajdonsag: "mp",
                feltetel: function(card) {
                    return card.tulajdonos === hatas.card.tulajdonos && 
                           card.laptipus === "Akciólap" && 
                           card.akciotipus === "Tárgy" && 
                           card.tipus.includes("fegyver");
                },
                vegrehajtas: function(ertek) {
                    ertek.modositas = ertek.modositas || [];
                    ertek.modositas.push({"ertek": -1});
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.szamolasModositok.findIndex(mod => mod.forras === hatas.card);
            if (index !== -1) gameState.state.szamolasModositok.splice(index, 1);
        }
    },

    "Pihenő helyzetben kerül a Jelenbe.": {
        bekapcsolas: function(hatas) {
            gameState.state.figyelok.push({
                esemenytipus: "kártyamozgatás",
                forras: hatas.card,
                allando: true,
                idozites: "előtte",
                ervenyesul: (triggerEsemeny) => {
                    if (triggerEsemeny.hataskor && triggerEsemeny.hataskor[0] === hatas.card &&
                        gameState.jelenSpaces.includes(triggerEsemeny.hova)) {
                        triggerEsemeny.ujHelyzet = "Pihenő";
                    }
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.figyelok.findIndex(figyelo => figyelo.forras === hatas.card);
            if (index !== -1) gameState.state.figyelok.splice(index, 1);
        }
    },

    "Célpont Hajózás képzettséggel rendelkező kalandozó gyógyul 1 szintet.": {
        ervenyesul: function(hatas) {
            if (!this.celpontValidalas(hatas.celpont)) return;
            gameState.state.eventSor.push({
                tipus: "gyógyulás",
                forras: hatas.isCard ? hatas : hatas.forras,
                hataskor: [hatas.celpont[0]],
                gyogyulas: 1
            });
        },
        celpontValidalas: function(celpontok) {
            if (!celpontok || celpontok.length !== 1) return false;
            const card = celpontok[0];
            return gameEffect.jelenbenVan(card) && card.laptipus === 'Kalandozó' && 
                   card.kepzettsegek && card.kepzettsegek.includes('Hajózás');
        }
    },

    "Jelenbe kerülése után a forduló végéig, amikor az ellenfél sikertelen egy sorelhagyó manőverben, akkor veszít 1 MP-t.": {
        bekapcsolas: function(hatas) {
            gameState.state.figyelok.push({
                esemenytipus: "kártyamozgatás",
                forras: hatas.card,
                allando: false,
                ervenyesul: (triggerEsemeny) => {
                    if (triggerEsemeny.hataskor && triggerEsemeny.hataskor[0] === hatas.card &&
                        gameState.jelenSpaces.includes(triggerEsemeny.hova)) {
                        gameState.state.figyelok.push({
                            esemenytipus: "sikertelenség",
                            forras: hatas.card,
                            allando: false,
                            ervenyesul: (triggerEsemeny) => {
                                if (triggerEsemeny.player !== hatas.card.tulajdonos) {
                                    gameState.state.playerAttributes[triggerEsemeny.player].mp = 
                                        Math.max(0, gameState.state.playerAttributes[triggerEsemeny.player].mp - 1);
                                }
                            }
                        });
                        gameState.state.figyelok.push({
                            esemenytipus: "Forduló vége",
                            forras: hatas.card,
                            allando: false,
                            ervenyesul: (triggerEsemeny) => {
                                gameState.state.figyelok = gameState.state.figyelok.filter(f => 
                                    !(f.forras === hatas.card && (f.esemenytipus === "sikertelenség" || f.esemenytipus === "Forduló vége")));
                            }
                        });
                    }
                }
            });
        },
        kikapcsolas: function(hatas) {
            gameState.state.figyelok = gameState.state.figyelok.filter(f => f.forras !== hatas.card);
        }
    },

    "Semlegesít célpont 0 MP-igényű eseménylapot.": {
        ervenyesul: function(hatas) {
            if (!this.celpontValidalas(hatas.celpont)) return;
            gameState.state.eventSor.push({
                tipus: "semlegesítés",
                forras: hatas.isCard ? hatas : hatas.forras,
                celpont: hatas.celpont[0]
            });
        },
        celpontValidalas: function(celpontok) {
            if (!celpontok || celpontok.length !== 1) return false;
            const card = celpontok[0];
            return card.isCard && card.laptipus === 'Eseménylap' && helper.getValue(card, "mp") === 0;
        }
    },

    "Az ellenfél toronyszint lapjainak MP-igénye 1-gyel nő.": {
        bekapcsolas: function(hatas) {
            gameState.state.szamolasModositok.push({
                forras: hatas.card,
                tulajdonsag: "mp",
                feltetel: function(card) {
                    return card.laptipus === "Toronyszint" && card.tulajdonos !== hatas.card.tulajdonos;
                },
                vegrehajtas: function(ertek) {
                    ertek.modositas = ertek.modositas || [];
                    ertek.modositas.push({"ertek": 1});
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.szamolasModositok.findIndex(mod => mod.forras === hatas.card);
            if (index !== -1) gameState.state.szamolasModositok.splice(index, 1);
        }
    },

    "Az általa leidézett varázslatok MP-igénye 1-gyel csökken, de nem csökkenhet 1 alá.": {
        bekapcsolas: function(hatas) {
            // TODO akkor is működjön, ha még leidézés előtt vagyunk, de más szempontból ne számítson (pl ne tudjam kijelölni leidézőként, és aztán 1 MP-s varázslatként visszavenni más lappal)
            gameState.state.szamolasModositok.push({
                forras: hatas.card,
                tulajdonsag: "mp",
                feltetel: function(card) {
                    return card.laptipus === "Akciólap" && card.akciotipus === "Varázslat" && 
                           card.leidezo === hatas.card;
                },
                vegrehajtas: function(ertek) {
                    ertek.modositas = ertek.modositas || [];
                    const ujErtek = Math.max(1, ertek.ertek - 1);
                    ertek.modositas.push({"ertek": ujErtek - ertek.ertek});
                }
            });
        },
        kikapcsolas: function(hatas) {
            const index = gameState.state.szamolasModositok.findIndex(mod => mod.forras === hatas.card);
            if (index !== -1) gameState.state.szamolasModositok.splice(index, 1);
        }
    },
}