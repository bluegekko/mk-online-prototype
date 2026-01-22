helper = {
    ellenfel: function(player){
        if(player === 'player') {
            return 'opponent'
        } else {
            return 'player'
        }
    },

    ervenyesuloHatas: function(card) {return card.hatasok.find(h => h.ervenyesules === true);}

}