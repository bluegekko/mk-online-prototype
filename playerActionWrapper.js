const playerActionWrapper = {
    // Execute player action with messaging and UI update
    executeAction: async function(actionType, player, ...params) {
        let message = null;
        let selectionMessage = null;
        
        // Execute action and create messages together
        switch(actionType) {
            case 'leidezesKezbol':
                gameAction.leidezesKezbol(player, params[0]);
                if (gameState.state.mode === 'online') {
                    const kivalasztas = gameState.state.playerAttributes[player].kivalasztas;
                    const leidezo = gameState.state.playerAttributes[player].leidezo;
                    selectionMessage = messaging.createKivalasztasUpdateMessage(player, kivalasztas, leidezo);
                    message = messaging.createLeidezesKezMessage(player, params[0].id);
                }
                break;
            case 'hatasAktivizalas':
                gameAction.hatasAktivizalas(player, params[0], params[1]);
                if (gameState.state.mode === 'online') {
                    const kivalasztas = gameState.state.playerAttributes[player].kivalasztas;
                    const leidezo = gameState.state.playerAttributes[player].leidezo;
                    selectionMessage = messaging.createKivalasztasUpdateMessage(player, kivalasztas, leidezo);
                    const hatasIndex = params[0].hatasok.indexOf(params[1]);
                    message = messaging.createHatasAktivizalasMessage(player, params[0].id, hatasIndex);
                }
                break;
            case 'ostrom':
                gameAction.ostrom(player, params[0]);
                if (gameState.state.mode === 'online') {
                    const kivalasztas = gameState.state.playerAttributes[player].kivalasztas;
                    const leidezo = gameState.state.playerAttributes[player].leidezo;
                    selectionMessage = messaging.createKivalasztasUpdateMessage(player, kivalasztas, leidezo);
                    message = messaging.createOstromMessage(player, params[0].id);
                }
                break;
            case 'kuldetesMegoldas':
                gameAction.kuldetesMegoldas(player, params[0]);
                if (gameState.state.mode === 'online') {
                    const kivalasztas = gameState.state.playerAttributes[player].kivalasztas;
                    const leidezo = gameState.state.playerAttributes[player].leidezo;
                    selectionMessage = messaging.createKivalasztasUpdateMessage(player, kivalasztas, leidezo);
                    message = messaging.createKuldetesMegoldasMessage(player, params[0].id);
                }
                break;
            case 'passz':
                gameAction.passz();
                if (gameState.state.mode === 'online') {
                    message = messaging.createPasszMessage(player);
                }
                break;
            case 'opciovalasztas':
                await gameAction.opciovalasztas(player);
                if (gameState.state.mode === 'online' && player === gameState.state.aktualisJatekos) {
                    message = messaging.createValasztasUpdateMessage(gameState.state.valasztas.valasztott);
                }
                break;
        }
        
        // Send messages if online mode
        if (peerConnection.connection) {
            if (selectionMessage) {
                peerConnection.sendMessage(selectionMessage);
            }
            if (message) {
                console.log('Wrapper sending message for action:', actionType, message);
                peerConnection.sendMessage(message);
            }
        } else if (gameState.state.mode === 'online' && message) {
            console.warn('Online mode but no connection available for action:', actionType);
        }
        
        // Update UI
        gameUi.render();
    }
};