helper = {
    ellenfel: function(player){
        if(player === 'player') {
            return 'opponent'
        } else {
            return 'player'
        }
    },

    ervenyesuloHatas: function(card) {return card.hatasok.find(h => h.ervenyesules === true);},

    isFelszereles: function(card) {
        return card.laptipus === 'Akciólap' && (card.akciotipus == "Tárgy" || card.akciotipus == "Varázstárgy");
    },

    resetManoverState: function() {
        return {
            aktualisManover: null,
            folyamatban: false,
            kezdemenyezoJatekos: null,
            szinhely: null,
            sikeresJatekos: null,
        };
    },
}