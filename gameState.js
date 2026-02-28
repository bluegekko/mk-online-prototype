window.gameState = {
    // Alap játékterek definíciója
    baseSpaces: {
        kez: { name: 'kez', displayName: 'Kéz' },
        sor: { name: 'sor', displayName: 'Sor' },
        manover: { name: 'manover', displayName: 'Manőver' },
        raktar: { name: 'raktar', displayName: 'Raktár' },
        toronyszintek: { name: 'toronyszintek', displayName: 'Torony' },
        kuldetesek: { name: 'kuldetesek', displayName: 'Megoldásra váró küldetések' },
        megoldottkuldetesek: { name: 'megoldottkuldetesek', displayName: 'Megoldott küldetések halmaza' },
        jelenlapok: { name: 'jelenLapok', displayName: '' },
        jovo: { name: 'jovo', displayName: 'Jövő' },
        mult: { name: 'mult', displayName: 'Múlt' },
        melyseg: { name: 'melyseg', displayName: 'Mélység' }
    },

    jelenSpaces: ['sor', 'manover', 'raktar', 'toronyszintek', 'jelenlapok', 'kuldetesek'],

    // Játékosok definíciója
    players: ['player', 'opponent'],

    // Játékállapot
    state: {
        mode: 'ai',
        playerSpaces: {},
        playerAttributes: {},
        fazis: {
            aktualisFazis: gameFlow.forduloKezdete,
            manover: helper.resetManoverState(),
            idofonal: {
                hatasok: [],
                valasztasfolyamatban: true,
            },
            prioritas: 'player',
            legutobbiMpKotottManover: null,
            egypassz: false,
        },
        aktualisJatekos: 'player',
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
            valasztasfolyamatban: false,
            prioritas: 'player',
            legutobbiMpKotottManover: null,
            egypassz: false,
        };

        this.state.fazis.aktualisFazis = gameFlow.manoverekFazisa;
        this.state.fazis.idofonal.folyamatban = false;

        this.state.aktualisJatekos = 'player',
        this.state.eventSor = [];
        this.state.figyelok = [];
        this.state.szamolasModositok = [];
        this.state.valasztas = {
                tipus: null,
                folyamatban: false,
                min: null,
                max: null,
                opciok: [],
                valasztott: [],
        },

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
                csapatmeret: {"ertek": 0},
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
                "Megkerülő hadmozdulat",
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
                hova: 'sor'
            });
        });

        ['Spaonter', 'Spaonter', 'Spaonter'].forEach(nev => {
            this.state.eventSor.push({
                tipus: "kártyahozzáadás",
                nev: nev,
                player: 'player',
                hova: 'sor'
            });
        });

        ['Megkerülő hadmozdulat'].forEach(nev => {
            this.state.eventSor.push({
                tipus: "kártyahozzáadás",
                nev: nev,
                player: 'player',
                hova: 'kuldetesek'
            });
        });

        ['Megkerülő hadmozdulat'].forEach(nev => {
            this.state.eventSor.push({
                tipus: "kártyahozzáadás",
                nev: nev,
                player: 'opponent',
                hova: 'kuldetesek'
            });
        });

        ['Lángtáncoltatás'].forEach(nev => {
            this.state.eventSor.push({
                tipus: "kártyahozzáadás",
                nev: nev,
                player: 'player',
                hova: 'mult'
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

        // Start AI loop if AI mode
        if (this.state.mode === 'ai') {
            enemyAI.start();
        } else {
            enemyAI.stop();
        }

        jatekszabalyFigyelok.inicializalas();

        eventHandler.resolve();

        console.log('Initial state:', this.state);
        console.log('Player cards:', this.state.playerSpaces.player.kez);
        console.log('Player tower:', this.state.playerSpaces.player.toronyszintek);
        gameUi.render();
        
    },
    
};

// Játék inicializálása
window.gameState.initializeState();
gameUi.render();
