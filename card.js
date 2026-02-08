// Kártya gyár modul
cardFactory = {
    idSeq: 1,
    
    uid: function(prefix) { 
        return (prefix || "c") + "_" + (this.idSeq++); 
    },
    
    createBaseCard: function({ laptipus, prefix, nev, mp, tulajdonsagok, szinesito, idotartam, fazis, hatasok}) {
        return {
            id: this.uid(prefix),
            isCard: true,
            laptipus: laptipus,
            nev: nev,
            mp: mp,
            szinesito: szinesito,
            tulajdonsagok: tulajdonsagok,
            idotartam: idotartam,
            fazis: fazis,
            hatasok: hatasok,
        };
    },
    
    kalandozo: (params) => { 
        return { 
            ...cardFactory.createBaseCard({
                laptipus: "Kalandozó",
                prefix: "k",
                idotartam: "Végleges",
                fazis: "Sor",
                ...params
            }),
            fokaszt: params.fokaszt,
            alkaszt: params.alkaszt,
            alapszint: params.alapszint,
            jellem: params.jellem,
            szferak: params.szferak,
            kepzettsegek: params.kepzettsegek,
            alapkepessegek: params.alapkepessegek,
            ervenyesul: function() {
                gameState.state.playerSpaces[this.tulajdonos]['sor'].push(this);
                this.helyzet = "Éber";
            }
        }; 
    },

    toronyszint: (params) => { 
        return { 
            ...cardFactory.createBaseCard({
                laptipus: "Toronyszint",
                prefix: "t",
                idotartam: "Végleges",
                fazis: "Sor",
                ...params
            }),
            fal: params.fal,
        }; 
    },

    esemenylap: (params) => { 
        return { 
            ...cardFactory.createBaseCard({
                laptipus: "Eseménylap",
                prefix: "e",
                fazis: "Sor",
                ...params
            }),
            ervenyesul: function() {
                const hatas = helper.ervenyesuloHatas(this);
                console.log("érvényesülő hatás: " + hatas)
                if (hatas) {
                    gameEffect[hatas.szoveg].ervenyesul(this);
                }
            }
        }; 
    },

    akadalylap: (params) => { 
        return { 
            ...cardFactory.createBaseCard({
                laptipus: "Akadálylap",
                prefix: "ay",
                idotartam: "Felhasználás",
                fazis: "Sor",
                ...params
            }),
            akadalytipus: params.akadalytipus,
        }; 
    },

    akciolap: (params) => { 
        return { 
            ...cardFactory.createBaseCard({
                laptipus: "Akciólap",
                prefix: "ao",
                ...params
            }),
            akciotipus: params.akciotipus,
            tipus: params.tipus ? params.tipus : null,
            altipus: params.altipus ? params.altipus : null,
            fokaszt: params.fokaszt,
            alkaszt: params.alkaszt,
            sebzes: params.sebzes,
            ervenyesul: function() {
                const hatas = helper.ervenyesuloHatas(this);
                console.log("érvényesülő hatás: " + hatas)
                if (hatas) {
                    gameEffect[hatas.szoveg].ervenyesul(this);
                }
            }
        }; 
    },

    epitmeny: (params) => {
        return {
            ...cardFactory.createBaseCard({
                laptipus: "Építmény",
                prefix: "ep",
                idotartam: "Végleges",
                fazis: "Sor",
                ...params
            }),
            feltetel: params.feltetel,
            dp: params.dp,
        };
    },

    kuldetes: (params) => {
        return {
            ...cardFactory.createBaseCard({
                laptipus: "Küldetés",
                prefix: "ku",
                idotartam: "Végleges",
                fazis: "Sor",
                ...params
            }),
            helyszin: params.helyszin,
            feltetel: params.feltetel,
            dp: params.dp,
        };
    },


    fromLibrary: (nev) => {
        const nevLower = nev.toLowerCase();
        const cardData = cardLibrary.find(card => card.nev.toLowerCase().startsWith(nevLower));
        if (!cardData) throw new Error(`Kártya nem található: ${nev}`);
        
        const cardDataCopy = JSON.parse(JSON.stringify(cardData));
        
        const tipusMap = {
            "Kalandozó": cardFactory.kalandozo,
            "Toronyszint": cardFactory.toronyszint,
            "Eseménylap": cardFactory.esemenylap,
            "Akadálylap": cardFactory.akadalylap,
            "Akciólap": cardFactory.akciolap,
            "Építmény": cardFactory.epitmeny,
            "Küldetés": cardFactory.kuldetes
        };        
        const constructor = tipusMap[cardDataCopy.laptipus];
        if (!constructor) throw new Error(`Nem támogatott kártyatípus: ${cardDataCopy.laptipus}`);
        return constructor(cardDataCopy);
    },
};

