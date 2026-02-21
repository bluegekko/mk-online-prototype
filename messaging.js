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
    createKivalasztasUpdateMessage: function(player, cardIds) {
        return {
            type: this.messageTypes.KIVALASZTAS_UPDATE,
            player: player,
            cardIds: cardIds,
            sequence: ++this.sequenceNumber
        };
    },

    // Process incoming message
    processMessage: function(message) {
        if (message.sequence !== this.expectedSequence) {
            console.error(`Message sequence error. Expected: ${this.expectedSequence}, Got: ${message.sequence}`);
            return false;
        }
        
        this.expectedSequence++;
        
        switch(message.type) {
            case this.messageTypes.LEIDEZESKEZ:
                gameAction.leidezesKezbol(message.player, message.cardId);
                break;
            case this.messageTypes.HATAS_AKTIVIZALAS:
                const card = this.findCardById(message.cardId);
                const hatas = card?.hatasok?.[message.hatasIndex];
                if (card && hatas) {
                    gameAction.hatasAktivizalas(message.player, card, hatas);
                }
                break;
            case this.messageTypes.OSTROM:
                const ostromCard = this.findCardById(message.cardId);
                if (ostromCard) {
                    gameAction.ostrom(message.player, ostromCard);
                }
                break;
            case this.messageTypes.KULDETESMEGOLDAS:
                const questCard = this.findCardById(message.cardId);
                if (questCard) {
                    gameAction.kuldetesMegoldas(message.player, questCard);
                }
                break;
            case this.messageTypes.PASSZ:
                gameAction.passz();
                break;
            case this.messageTypes.KIVALASZTAS_UPDATE:
                this.updateKivalasztas(message.player, message.cardIds);
                break;
        }
        
        return true;
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
    updateKivalasztas: function(player, cardIds) {
        const cards = cardIds.map(id => this.findCardById(id)).filter(card => card);
        gameState.state.playerAttributes[player].kivalasztas = cards;
    }
};