window.gameState = {
    // Alap játékterek definíciója
    baseSpaces: {
        kez: { name: 'kez', displayName: 'Kéz' },
        sor: { name: 'sor', displayName: 'Sor' },
        manover: { name: 'manover', displayName: 'Manőver' },
        raktar: { name: 'raktar', displayName: 'Raktár' },
        toronyszintek: { name: 'toronyszintek', displayName: 'Torony' },
        jelenlapok: { name: 'jelenLapok', displayName: '' },
        jovo: { name: 'jovo', displayName: 'Jövő' },
        mult: { name: 'mult', displayName: 'Múlt' },
        melyseg: { name: 'melyseg', displayName: 'Mélység' }
    },

    jelenSpaces: ['sor', 'manover', 'raktar', 'toronyszintek', 'jelenlapok'],

    // Játékosok definíciója
    players: ['player', 'opponent'],

    // Játékállapot
    state: {
        playerSpaces: {},
        playerAttributes: {},
        fazis: {
            aktualisFazis: gameFlow.forduloKezdete,
            manover: helper.resetManoverState(),
            idofonal: {
                hatasok: [],
                folyamatban: true,
            },
            prioritas: 'player',
            legutobbiMpKotottManover: null,
        },
        eventSor: [],
        figyelok: [],
        szamolasModositok: [],
    },

    // Játékállapot inicializálása
    initializeState: function() {
        // Initialize state.fazis
        this.state.fazis = {
            aktualisFazis: gameFlow.forduloKezdete,
            manover: helper.resetManoverState(),
            idofonal: {
                hatasok: [],
                folyamatban: true,
            },
            idotartamosHatasok: [],
            prioritas: 'player',
            legutobbiMpKotottManover: null,
        };

        this.state.eventSor = [];
        this.state.figyelok = [];
        this.state.szamolasModositok = [];

        // Játékterek inicializálása minden játékosnak
        this.players.forEach(player => {
            this.state.playerSpaces[player] = {};
            Object.keys(this.baseSpaces).forEach(space => {
                this.state.playerSpaces[player][space] = [];
            });
        });

        // Kezdő tulajdonságok.
        this.players.forEach(player => {
            this.state.playerAttributes[player] = {};
            this.state.playerAttributes[player].mp = 6;
            this.state.playerAttributes[player].kivalasztas = [];
            this.state.playerAttributes[player].kuldetesFolytatas = true;
            this.state.playerAttributes[player].harciKorokVege = false;
            this.state.playerAttributes[player].akadalyozas = true;
            this.state.playerAttributes[player].leidezo = null;
            this.state.playerAttributes[player].kezmeret = {"ertek": 7};
        });

        // Kezdő kártyák kiosztása
        this.state.playerSpaces['player'].jovo = [
            cardFactory.fromLibrary("Határok feszegetése"),
            cardFactory.fromLibrary("A túlvilág hívása"),
            cardFactory.fromLibrary("Salnarri kopjatörő"),
            cardFactory.fromLibrary("Ezüst Ököl stratéga"),
            cardFactory.fromLibrary("Lángtáncoltatás"),
            cardFactory.fromLibrary("Spaonter"),
            cardFactory.fromLibrary("Spaonter"),
            cardFactory.fromLibrary("Spaonter"),
        ];

        this.state.playerSpaces['opponent'].manover = [
            cardFactory.fromLibrary("Spaonter"),
            cardFactory.fromLibrary("Spaonter"),
        ];

        // Toronyszintek beállítása mindkét játékosnak
        this.players.forEach(player => {
            this.state.playerSpaces[player].toronyszintek = [
                cardFactory.fromLibrary("Pénzesház"),
                cardFactory.fromLibrary("Pihenőszoba"),
                cardFactory.fromLibrary("Pihenőszoba")
            ];
        });

         this.players.forEach(player => {
            Object.keys(this.baseSpaces).forEach(space => {
                this.state.playerSpaces[player][space].forEach(card => {
                    card.tulajdonos = player;
                });
            });
        });

        // állandó képességek bekapcsolása
        this.state.figyelok.push({
            esemenytipus: "kártyamozgatás",
            forras: "szabály",
            allando: true,
            ervenyesul: (esemeny) => {
                if (this.jelenSpaces.includes(esemeny.hova) && !this.jelenSpaces.includes(esemeny.honnan)) {
                    for (const card of esemeny.hataskor) {
                        if (card.hatasok) {
                            for (const hatas of card.hatasok) {
                                if (hatas.tipus === 'képesség' &&
                                    !abilityFunctions.aktivizalhato(hatas) && 
                                    !hatas.jelek.includes('harci')) {
                                    const folyamatosKepesseg = gameEffect[hatas.szoveg];
                                    if (folyamatosKepesseg && folyamatosKepesseg.bekapcsolas) {
                                        folyamatosKepesseg.bekapcsolas({card: card, hatas: hatas});
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log('Initial state:', this.state);
        console.log('Player cards:', this.state.playerSpaces.player.kez);
        console.log('Player tower:', this.state.playerSpaces.player.toronyszintek);
        gameUi.render();
        
    },
    
};

// Játék inicializálása
window.gameState.initializeState();
gameUi.render();
