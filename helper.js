helper = {
    ellenfel: function(player){
        if(player === 'player') {
            return 'opponent'
        } else {
            return 'player'
        }
    },

    // óelf és elf ugyanaz
    // jelenleg csak simán includes van, ami nem mindig felel meg
    fajok: ["ember", "ork", "elf", "aun", "kyr", "aquir", "törpe", "anur",],

    ervenyesuloHatas: function(card) {return card.hatasok.find(h => h.ervenyesules === true);},

    isFelszereles: function(card) {
        return card.laptipus === 'Akciólap' && (card.akciotipus == "Tárgy" || card.akciotipus == "Varázstárgy");
    },

    exampleFullValueStructure: {
        ertek: 3,
        modositas: [{ertek: -2, limit: 2}, {ertek: -1}],
        limit: [1, null],
        erosModositas: [],
        erosLimit: [null, null],
    },

    // TODO erős hatások implementálása
    // limites hatások sorrendje
    // beállító hatások
    getValue: function(valueStructure) {
        if (typeof valueStructure === 'number') return valueStructure;
        
        let ertek = valueStructure.ertek || 0;
        
        if (valueStructure.modositas) {
            for (let mod of valueStructure.modositas) {
                if (mod.limit === undefined || ertek < mod.limit) {
                    ertek += mod.ertek;
                }
            }
        }
        
        if (valueStructure.limit) {
            if (valueStructure.limit[0] !== null && ertek < valueStructure.limit[0]) ertek = valueStructure.limit[0];
            if (valueStructure.limit[1] !== null && ertek > valueStructure.limit[1]) ertek = valueStructure.limit[1];
        }
        
        return ertek;
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