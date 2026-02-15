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
            this.state.playerAttributes[player] = {
                mp: 6,
                kivalasztas: [],
                kuldetesFolytatas: true,
                harciKorokVege: false,
                akadalyozas: true,
                leidezo: null,
                kezmeret: {"ertek": 7},
                csapatmeret: {"ertek": 0}
            };
        });

        // Kezdő kártyák kiosztása
        if (this.customDeck && this.customDeck.length > 0) {
            this.customDeck.forEach(card => {
                this.state.eventSor.push({
                    tipus: "kártyahozzáadás",
                    nev: card.nev,
                    player: 'player',
                    hova: 'jovo'
                });
            });
        } else {
            const kezdoKartyak = [
                "Határok feszegetése",
                "A túlvilág hívása",
                "Salnarri kopjatörő",
                "Ezüst Ököl stratéga",
                "Lángtáncoltatás",
                "Spaonter",
                "Spaonter",
                "Spaonter"
            ];
            kezdoKartyak.forEach(nev => {
                this.state.eventSor.push({
                    tipus: "kártyahozzáadás",
                    nev: nev,
                    player: 'player',
                    hova: 'jovo'
                });
            });
        }

        ['Spaonter', 'Spaonter'].forEach(nev => {
            this.state.eventSor.push({
                tipus: "kártyahozzáadás",
                nev: nev,
                player: 'opponent',
                hova: 'manover'
            });
        });

        // Toronyszintek beállítása mindkét játékosnak
        this.players.forEach(player => {
            ['Pénzesház', 'Pihenőszoba', 'Pihenőszoba'].forEach(nev => {
                this.state.eventSor.push({
                    tipus: "kártyahozzáadás",
                    nev: nev,
                    player: player,
                    hova: 'toronyszintek'
                });
            });
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
                                    hatas.forras = card;
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

        // TODO kikapcsolás

        // laphatások bekapcsolása
        this.state.figyelok.push({
            esemenytipus: "kártyahozzáadás",
            forras: "szabály",
            allando: true,
            ervenyesul: (esemeny) => {
                const card = this.state.playerSpaces[esemeny.player][esemeny.hova].at(-1);
                if (card && card.hatasok) {
                    card.hatasok.forEach(hatas => {
                        if (hatas.tipus === 'laphatás' && 
                                !abilityFunctions.aktivizalhato(hatas) && 
                                !hatas.jelek.includes('harci')) {
                            const folyamatosKepesseg = gameEffect[hatas.szoveg];
                            hatas.forras = card;
                            if (folyamatosKepesseg && folyamatosKepesseg.bekapcsolas) {
                                folyamatosKepesseg.bekapcsolas({card: card, hatas: hatas});
                            }
                        }
                    });
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
