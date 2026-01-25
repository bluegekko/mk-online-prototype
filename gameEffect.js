gameEffect = {
    vanParameter: function(card, parameter) {
        const parameterKicsi = parameter.toLowerCase();
        return card.szinesito && card.szinesito.toLowerCase().includes(parameterKicsi) || card.nev && card.nev.toLowerCase().includes(parameterKicsi);
    },

    ertekTorles: function(card, ertek, modosito) {
        const index = card[ertek].modositas.indexOf(modosito);
        if (index !== -1) card[ertek].modositas.splice(modosito, 1);
    },

    ertekTorlesRegisztralas: function(card, ertek, modosito, idotartam) {
        gameState.state.fazis.idotartamosHatasok.push({
            idotartam: idotartam,
            torles: () => gameEffect.ertekTorles(card, ertek, modosito)
        });
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
            console.log("hatas ervenyesules: ", card)
            if (!this.celpontValidalas(card.celpont)) return; // semlegesítésnek számít
            console.log("hatas celpontja: ", card.celpont[0])
            if (!card.alapszint.modositas) card.alapszint.modositas = [];
            card.alapszint.modositas.push({ertek: 1});
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
            // TODO időtartam
            if (!hatas.celpont[0].alapszint.modositas) hatas.celpont[0].alapszint.modositas = [];
            hatas.celpont[0].alapszint.modositas.push({ertek: 1});
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
            for (const player of gameState.players) {
                for (const space of gameState.jelenSpaces) {
                    const cards = gameState.state.playerSpaces[player][space];
                    cards.forEach(card => {
                        if (card.laptipus === 'Kalandozó') {
                            card.helyzet = 'pihenő';
                        }
                    });
                }
            }
        },

        celpontValidalas: function(celpontok) {return true;}
    },

    "Az ellenséges kalandozók asztrálja 1-gyel csökken." : {
        ervenyesul: function(hatas) {
            const ellenfel = helper.ellenfel(hatas.tulajdonos);
            for (const space of gameState.jelenSpaces) {
                gameState.state.playerSpaces[ellenfel][space].forEach(card => {
                    if (card.laptipus === 'Kalandozó') {
                        if (!card.alapkepessegek.Asztral.modositas) card.alapkepessegek.Asztral.modositas = [];
                        card.alapkepessegek.Asztral.modositas.push({ertek: -1});
                    }
                });
            }
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
        folyamatos: function(card) {
            for (const player of gameState.players) {
                Object.keys(gameState.baseSpaces).forEach(space => {
                    gameState.state.playerSpaces[player][space].forEach(lap => {
                        if (lap.laptipus !== 'Kalandozó') return;
                        
                        const nemEmberFaj = helper.fajok.find(faj => 
                            faj !== 'ember' && gameEffect.vanParameter(lap, faj) &&
                            !gameEffect.vanParameter(lap, 'ember')
                        );
                        
                        if (nemEmberFaj) {
                            if (!lap.mp.modositas) lap.mp.modositas = [];
                            lap.mp.modositas.push({ertek: 1});
                        }
                    });
                });
            }
        }
    },

    "Kap 1 alapszintet. Célpont kalandozó veszít 1 alapszintet. A hatás a harc végéig tart.": {
        ervenyesul: function(hatas) {
            if (!this.celpontValidalas(hatas.celpont)) return;
            
            const forras = hatas.forras;
            const celpont = hatas.celpont[0];
            const forrasMod = {ertek: 1};
            const celpontMod = {ertek: -1};
            
            if (!forras.alapszint.modositas) forras.alapszint.modositas = [];
            forras.alapszint.modositas.push(forrasMod);
            
            if (!celpont.alapszint.modositas) hatas.celpont[0].alapszint.modositas = [];
            celpont.alapszint.modositas.push(celpontMod);

            gameEffect.ertekTorlesRegisztralas(forras, "alapszint", forrasMod, 'Harc');
            gameEffect.ertekTorlesRegisztralas(celpont, "alapszint", celpontMod, 'Harc')
            
        },

        celpontValidalas: function(celpontok) {
            if (!celpontok || celpontok.length !== 1) return false;
            const card = celpontok[0];
            return gameEffect.jelenbenVan(card) && card.laptipus === 'Kalandozó';
        },
    },

     "Kap 1 fizikumot. Célpont kalandozó veszít 1 asztrált. A hatás a harc végéig tart.": {},

}