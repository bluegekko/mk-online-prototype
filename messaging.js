messaging = {
    sequenceNumber: 0,
    expectedSequence: 1,
    
    // Message types for player actions
    messageTypes: {
        LEIDEZESKEZ: 'leidezeskez',
        HATAS_AKTIVIZALAS: 'hatas_aktivizalas', 
        OSTROM: 'ostrom',
        KULDETESMEGOLDAS: 'kuldetesmegoldas',
        PASSZ: 'passz',
        KIVALASZTAS_UPDATE: 'kivalasztas_update'
    },

    // Create message for card play from hand
    createLeidezesKezMessage: function(player, cardId) {
        return {
            type: this.messageTypes.LEIDEZESKEZ,
            player: player,
            cardId: cardId,
            sequence: ++this.sequenceNumber
        };
    },

    // Create message for ability activation
    createHatasAktivizalasMessage: function(player, cardId, hatasIndex) {
        return {
            type: this.messageTypes.HATAS_AKTIVIZALAS,
            player: player,
            cardId: cardId,
            hatasIndex: hatasIndex,
            sequence: ++this.sequenceNumber
        };
    },

    // Create message for siege action
    createOstromMessage: function(player, cardId) {
        return {
            type: this.messageTypes.OSTROM,
            player: player,
            cardId: cardId,
            sequence: ++this.sequenceNumber
        };
    },

    // Create message for quest completion
    createKuldetesMegoldasMessage: function(player, cardId) {
        return {
            type: this.messageTypes.KULDETESMEGOLDAS,
            player: player,
            cardId: cardId,
            sequence: ++this.sequenceNumber
        };
    },

    // Create message for pass action
    createPasszMessage: function(player) {
        return {
            type: this.messageTypes.PASSZ,
            player: player,
            sequence: ++this.sequenceNumber
        };
    },

    // Create message for selection update
    createKivalasztasUpdateMessage: function(player, cardIds, leidezo) {
        return {
            type: this.messageTypes.KIVALASZTAS_UPDATE,
            player: player,
            cardIds: cardIds.map(card => card.id),
            leidezoPeerId: leidezo ? leidezo.id : null,
            sequence: ++this.sequenceNumber
        };
    },

    // Process incoming message
    processMessage: function(message) {
        console.log('Processing message:', message.type, message);
        
        if (message.sequence !== this.expectedSequence) {
            console.error(`Message sequence error. Expected: ${this.expectedSequence}, Got: ${message.sequence}`);
            return false;
        }
        
        this.expectedSequence++;
        
        switch(message.type) {
            case this.messageTypes.LEIDEZESKEZ:
                const leidezesCard = this.findCardById(message.cardId);
                if (leidezesCard) {
                    console.log('Executing leidezesKezbol for:', message.player, leidezesCard.nev);
                    gameAction.leidezesKezbol(message.player, leidezesCard);
                }
                break;
            case this.messageTypes.HATAS_AKTIVIZALAS:
                const card = this.findCardById(message.cardId);
                const hatas = card?.hatasok?.[message.hatasIndex];
                if (card && hatas) {
                    console.log('Executing hatasAktivizalas for:', message.player, card.nev);
                    gameAction.hatasAktivizalas(message.player, card, hatas);
                }
                break;
            case this.messageTypes.OSTROM:
                const ostromCard = this.findCardById(message.cardId);
                if (ostromCard) {
                    console.log('Executing ostrom for:', message.player, ostromCard.nev);
                    gameAction.ostrom(message.player, ostromCard);
                }
                break;
            case this.messageTypes.KULDETESMEGOLDAS:
                const questCard = this.findCardById(message.cardId);
                if (questCard) {
                    console.log('Executing kuldetesMegoldas for:', message.player, questCard.nev);
                    gameAction.kuldetesMegoldas(message.player, questCard);
                }
                break;
            case this.messageTypes.PASSZ:
                console.log('Executing passz for:', message.player);
                gameFlow.passz();
                break;
            case this.messageTypes.KIVALASZTAS_UPDATE:
                console.log('Updating kivalasztas for:', message.player);
                this.updateKivalasztas(message.player, message.cardIds, message.leidezoPeerId);
                break;
        }
        
        console.log('Message processed successfully');
        return true;
    },
    
    // Process message and trigger UI update
    processMessageWithRender: function(message) {
        const result = this.processMessage(message);
        if (result) {
            gameUi.render();
        }
        return result;
    },

    // Helper function to find card by ID
    findCardById: function(cardId) {
        for (const player of gameState.players) {
            for (const space of Object.keys(gameState.baseSpaces)) {
                const cards = gameState.state.playerSpaces[player][space];
                const card = cards.find(c => c.id === cardId);
                if (card) return card;
            }
        }
        return null;
    },

    // Update player selection
    updateKivalasztas: function(player, cardIds, leidezoPeerId) {
        const cards = cardIds.map(id => this.findCardById(id)).filter(card => card);
        gameState.state.playerAttributes[player].kivalasztas = cards;
        
        if (leidezoPeerId) {
            const leidezoPeer = this.findCardById(leidezoPeerId);
            gameState.state.playerAttributes[player].leidezo = leidezoPeer;
        } else {
            gameState.state.playerAttributes[player].leidezo = null;
        }
    }
};