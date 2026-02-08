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
    getValue: function(obj, property) {
        const valueStructure = obj[property];
        
        let ertek = valueStructure.ertek || 0;

        const ertekObjektum = JSON.parse(JSON.stringify(valueStructure));

        for (const szamolasMod of gameState.state.szamolasModositok) {
            if (szamolasMod.feltetel(obj) && szamolasMod.tulajdonsag == property) {
                szamolasMod.vegrehajtas(ertekObjektum);
            }
        }
        
        if (ertekObjektum.modositas) {
            for (let mod of ertekObjektum.modositas) {
                if (mod.limit === undefined || ertek < mod.limit) {
                    ertek += mod.ertek;
                }
            }
        }
        
        if (ertekObjektum.limit) {
            if (ertekObjektum.limit[0] !== null && ertek < ertekObjektum.limit[0]) ertek = ertekObjektum.limit[0];
            if (ertekObjektum.limit[1] !== null && ertek > ertekObjektum.limit[1]) ertek = ertekObjektum.limit[1];
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

    kezdoJelenJatekter: function(card) {
        switch (card.laptipus) {
            case "Kalandozó":
                return "sor";
            case "Akciólap":
                return helper.isFelszereles(card) ? "raktar" : "jelenlapok";
            case "Toronyszint":
                return "toronyszintek";
            default:
                return "jelenlapok";
        }
    }
}