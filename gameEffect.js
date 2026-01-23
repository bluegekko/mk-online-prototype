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
        return gameEffect.jelenbenVan(card) && card.laptipus === 'Kalandozó';
    },

    celpontValasztas: function(hatas, player) {
        console.log("celpont valasztas: ", hatas)
        const kivalasztas = gameState.state.playerAttributes[player].kivalasztas;
        if (hatas.isCard){
            ervenyesuloHatas = hatas.hatasok.find(h => h.ervenyesules === true);
            if (!ervenyesuloHatas) {
                if (hatas.sebzes) {
                    if (!sebzoAkciolapCelpontValidalas) return false;
                    hatas.celpont = [...kivalasztas];
                    return true;
                } else {
                    return true;
                }
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
            card.celpont[0].alapszintModositas = (card.celpont.alapszintModositas || 0) + 1;
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
                const zombi = cardFactory.fromLibrary("Zombi");
                zombi.tulajdonos = card.tulajdonos;
                zombi.helyzet = "Éber";
                gameState.state.playerSpaces[card.tulajdonos]['sor'].push(zombi);
            }
        },

        celpontValidalas: function(card) {return true;}
    },
    "Célpont salnarri kalandozó alapszintje 1-gyel nő a forduló végéig. A képesség pihenő és sérült helyzetben is aktivizálható." : {
        ervenyesul: function(hatas) {
            if (!this.celpontValidalas(hatas.celpont)) return;
            // TODO időtartam
            hatas.celpont[0].alapszintModositas = (hatas.celpont[0].alapszintModositas || 0) + 1;
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
    }
}