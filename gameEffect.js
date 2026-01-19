gameEffect = {
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
            const inSor = gameState.state.playerSpaces['player']['sor'].includes(card);
            const inManover = gameState.state.playerSpaces['player']['manover'].includes(card);
            return (inSor || inManover) && card.laptipus === 'Kalandozó';
        },

        celpontValasztas: function(card) {
            console.log("celpont valasztas: ", card)
            const kivalasztas = gameState.state.playerAttributes['player'].kivalasztas;
            if (this.celpontValidalas(kivalasztas)) {
                card.celpont = [...kivalasztas];
                return true;
            }
            return false;
        }
    },
    "Játékosa Sorába 2 jelző Zombi kerül pihenő helyzetben." : {
        ervenyesul: function(card) {
            for (let i = 0; i < 2; i++) {
                const zombi = cardFactory.fromLibrary("Zombi");
                zombi.tulajdonos = card.tulajdonos;
                gameState.state.playerSpaces[card.tulajdonos]['sor'].push(zombi);
            }
        },

        celpontValidalas: function(card) {return true;}
    }

}