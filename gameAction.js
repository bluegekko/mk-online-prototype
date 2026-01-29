gameAction = {

    kartyaMozgatasJatekter: function(player, fromSpaceNev, toSpaceNev, card) {
        // TODO múlt, mélység, kéz, jövő, cserepakli mindig tulajdonoshoz menjen
        // TODO jelző lapok megszűnnek, ha jelenből kikerülnek
        this.kartyaMozgatas(
            gameState.state.playerSpaces[player][fromSpaceNev],
            gameState.state.playerSpaces[player][toSpaceNev],  
            card.id);
        if (card.laptipus === 'Kalandozó' && fromSpaceNev == 'manover' && toSpaceNev == 'sor') {
                card.helyzet = 'Pihenő';
        }    
    },

    kartyaMozgatas: function(fromSpace, toSpace, cardId) {
        const cardIndex = fromSpace.findIndex(card => card.id === cardId);
        
        if (cardIndex !== -1) {
            const [card] = fromSpace.splice(cardIndex, 1);
            toSpace.push(card);
            console.log("kártyamozgás", fromSpace, toSpace, card)
        }
    },

    laphuzas: function(player) {
        if (gameState.state.playerSpaces[player].jovo.length === 0) {
            console.log(`Nincs több húzható lap ${player} Jövő pakijában!`);
            return false;
        }
    
        const drawnCard = gameState.state.playerSpaces[player].jovo[0];
        this.kartyaMozgatasJatekter(player, 'jovo', 'kez', drawnCard)
        
        console.log(`${player} húzott egy lapot: `, drawnCard);
        return true;
    },

    // Kártya hozzáadása kézhez
    kartyaHozzaadas: function (nev, player, space) {
        const card = cardFactory.fromLibrary(nev);
        if (card) {
            card.tulajdonos = player;
            gameState.state.playerSpaces[player][space].push(card);
            if (card.laptipus === 'Kalandozó' && (space == 'manover' || space == 'sor')) {
                card.helyzet = 'Éber';
            }
            return card;
        }
    },

    // Kártya kijátszása kézből
    leidezesKezbol: function(player, cardId) {
        // TODO kell, hogy cardId legyen?
        card = gameState.state.playerSpaces[player].kez.find(c => c.id === cardId);
        console.log("lap kijátszása: ", card)
        if (!card || gameState.state.playerAttributes[player].mp < helper.getValue(card.mp)) return;

        if (!gameEffect.feltetelValidalas(card, player)) return;

        // Hatás célpont választás ellenőrzése
        if (!gameEffect.celpontValasztas(card, player)) {
            return;
        }

        if (card.laptipus == "Akciólap") {
            card.leidezo = gameState.state.playerAttributes[player].leidezo;
        }
        gameState.state.playerAttributes[player].mp -= helper.getValue(card.mp);
        kez = gameState.state.playerSpaces[player]['kez'];
        const cardIndex = kez.findIndex(card => card.id === cardId);
        kez.splice(cardIndex, 1);
        gameFlow.idofonalNyitas(card)
        gameUi.render();
    },

    hatasAktivizalas: function(player, card, hatas) {
        if (!hatas) return;
        if (hatas.mp && gameState.state.playerAttributes[player].mp < helper.getValue(hatas.mp)) return;

        if (!gameEffect.celpontValasztas(hatas, player)) {
            return;
        }
        
        console.log("Hatás aktiválása: ", hatas);
        gameState.state.playerAttributes[player].mp -= helper.getValue(hatas.mp);
        hatas.forras = card;

        gameFlow.idofonalNyitas(hatas)
        gameUi.render();
    },

    manoverKivalasztasValidalas: function(kivalasztas, limit) {
        const kalandozok = [];
        const felszerelesek = [];
        
        for (const card of kivalasztas) {
            if (card.laptipus === 'Kalandozó' && card.helyzet == 'Éber') {
                kalandozok.push(card);
            } else if (helper.isFelszereles(card)) {
                felszerelesek.push(card);
            } else {
                console.log("Hibás kiválasztás: csak éber kalandozók és felszerelések lehetnek");
                return false;
            }
        }
        
        if (kalandozok.length > limit || kalandozok.length < 1) {
            console.log("Hibás kiválasztás: legalább 1, legfeljebb 3 kalandozó lehet");
            return false;
        }
        
        return { kalandozok, felszerelesek };
    },

    ostrom: function(player, card) {
        if (gameState.state.playerAttributes[player].mp < 2) return;
        if (gameState.state.fazis.idofonal.folyamatban) return;
        console.log("Ostrom");

        kivalasztas = gameState.state.playerAttributes[player].kivalasztas;
        csapatmeret = 3;
        const validalas = this.manoverKivalasztasValidalas(kivalasztas, csapatmeret);
        
        if (!validalas) return;
        
        const { kalandozok, felszerelesek } = validalas;

        gameState.state.playerAttributes[player].mp -= 2;

        kalandozok.forEach(kalandozo => {
            this.kartyaMozgatasJatekter(player, 'sor', 'manover', kalandozo)
        });

        gameState.state.fazis.manover.kezdemenyezoJatekos = player;
        gameState.state.fazis.manover.aktualisManover = "ostrom";
        gameState.state.fazis.manover.szinhely = card;

        gameState.state.fazis.aktualisFazis = gameFlow.kezdemenyezoCsapatSorElhagyas;
        gameState.state.fazis.aktualisFazis.fazisEleje();

        gameUi.render();

    }
}