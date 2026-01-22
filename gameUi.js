gameUi = {
    createCardElement: function(card, player, space) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.laptipus.toLowerCase()}`;
        cardDiv.dataset.cardId = card.id;

        mp_text = card.laptipus === "Toronyszint" ? (card.mp === 4 ? "" : card.mp + " MP " ) : card.mp + " MP " ;
        alapszintmodositas = card.alapszintModositas ? card.alapszintModositas : 0
        alapszint = card.alapszint + alapszintmodositas
        
        cardDiv.innerHTML = `
            <div class="card-header">${mp_text}${card.nev}</div>
            <div class="card-content">
                ${card.alapszint ? `<div class="alapszint">Alapszint: ${alapszint}</div>` : ''}
                ${card.fal != null ? `<div class="fal">FAL: ${card.fal}</div>` : ''}
            </div>
        `;

        const kivalasztas = gameState.state.playerAttributes['player'].kivalasztas;
        if (kivalasztas.includes(card)) {
            cardDiv.classList.add('selected');
        }
        
        cardDiv.onclick = () => {
            const index = kivalasztas.indexOf(card);
            if (index === -1) {
                kivalasztas.push(card);
            } else {
                kivalasztas.splice(index, 1);
            }
            gameUi.render();
        };

        if (space === 'kez') {
            const button = document.createElement('button');
            button.textContent = 'Leidéz';
            const playerMp = gameState.state.playerAttributes[player].mp;
            // TODO celpontValidalas ellenorzese
            button.disabled = playerMp < card.mp ;
            button.onclick = (e) => {
                e.stopPropagation();
                gameAction.leidezesKezbol(player, card.id);
            };
            cardDiv.appendChild(button);
        }

        // Add buttons for activatable effects
        if (card.hatasok) {
            card.hatasok.forEach((hatas, index) => {
                if (abilityFunctions.aktivizalhato(hatas)) {
                    // TODO celpontValidalas ellenorzese    
                    const effectButton = document.createElement('button');
                    effectButton.textContent = hatas.kiirtnev || 'Hatás aktiválás';
                    effectButton.className = 'effect-button';
                    effectButton.onclick = (e) => {
                        e.stopPropagation();
                        gameAction.hatasAktivizalas(player, hatas);
                    };
                    cardDiv.appendChild(effectButton);
                }
            });
        }

        return cardDiv;
    },

    createHatasElement: function(hatas) {
        const hatasDiv = document.createElement('div');
        hatasDiv.className = 'card hatas';
        hatasDiv.innerHTML = `
            <div class="card-header">${hatas.kiirtnev || 'Hatás'}</div>
        `;
        return hatasDiv;
    },

    render: function() {    
        // MP megjelenítése
        console.log('Current MP:', gameState.state.playerAttributes['player'].mp)
        console.log('Current phase:', gameState.state.fazis.aktualisFazis);
        document.getElementById('mp').textContent = gameState.state.playerAttributes['player'].mp;
        document.getElementById('aktualisFazis').textContent = gameState.state.fazis.aktualisFazis.nev;

        // Időfonal hatások megjelenítése
        const idofonalContainer = document.getElementById('idofonal');
        if (idofonalContainer) {
            idofonalContainer.innerHTML = '';
            const hatasok = gameState.state.fazis.idofonal.hatasok;
            if (hatasok && hatasok.length > 0) {
                hatasok.forEach(hatas => {
                    if (hatas.isCard) {
                        const hatasElement = this.createCardElement(hatas, null, 'idofonal');
                        idofonalContainer.appendChild(hatasElement);
                    } else {
                        const hatasElement = this.createHatasElement(hatas);
                        idofonalContainer.appendChild(hatasElement);
                    }
                });
            }
            // TODO üres, de folyamatban lévő időfonal jelzése
        }
    
        // Játékterek frissítése
        gameState.players.forEach(player => {
            Object.keys(gameState.baseSpaces).forEach(space => {
                const prefix = player === 'player' ? 'player' : 'opponent';
                const containerId = `${prefix}-${space}`;
                
                const container = document.getElementById(containerId);
                if (!container) {
                    return;
                }
    
                const cards = gameState.state.playerSpaces[player][space];
            
                // Tartalom frissítése
                container.innerHTML = '';
                
                if (cards && cards.length > 0) {
                    cards.forEach(card => {
                        const cardElement = this.createCardElement(card, player, space);
                        container.appendChild(cardElement);
                    });
                }
    
                // Empty state és számláló kezelése
                const emptyId = `${containerId}Empty`;
                const countId = `${containerId}Count`;
                
                const emptyDiv = document.getElementById(emptyId);
                const countElement = document.getElementById(countId);
    
                if (emptyDiv) {
                    emptyDiv.style.display = cards && cards.length > 0 ? 'none' : 'block';
                }
                
                if (countElement) {
                    countElement.textContent = cards ? cards.length : 0;
                }
            });
        });
    }
}