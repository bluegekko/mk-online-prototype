gameUi = {
    createCardElement: function(card, player, space) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.laptipus.toLowerCase()}`;
        cardDiv.dataset.cardId = card.id;

        player = player ? player : card.tulajdonos
        const playerMp = gameState.state.playerAttributes[player].mp;

        mp_text = card.laptipus === "Toronyszint" ? 
            (helper.getValue(card, "mp") === 4 ? "" : helper.getValue(card, "mp") + " MP " ) 
            : helper.getValue(card, "mp") + " MP " ;
        
        cardDiv.innerHTML = `
            <div class="card-header">${mp_text}${card.nev}</div>
            <div class="card-content">
                ${card.alapszint ? `<div class="alapszint">Alapszint: ${helper.getValue(card, "alapszint")}</div>` : ''}
                ${card.fal != null ? `<div class="fal">FAL: ${helper.getValue(card, "fal")}</div>` : ''}
                ${card.helyzet ? `<div class="helyzet">Helyzet: ${card.helyzet}</div>` : ''}
            </div>
        `;

        const kivalasztas = gameState.state.playerAttributes['player'].kivalasztas;
        if (kivalasztas.includes(card)) {
            cardDiv.classList.add('selected');
            console.log("kivalasztott", card)
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
            // TODO celpontValidalas ellenorzese
            button.disabled = playerMp < helper.getValue(card, "mp") || !abilityFunctions.hasznalhatoAktualisFazisban(card) ;
            button.onclick = (e) => {
                e.stopPropagation();
                gameAction.leidezesKezbol(player, card.id);
            };
            cardDiv.appendChild(button);
        }

        if (space === 'toronyszintek' && player === helper.ellenfel('player')) {
            const ellenfelToronyszintek = gameState.state.playerSpaces[player]['toronyszintek'];
            if (ellenfelToronyszintek.length > 0 && ellenfelToronyszintek[0] === card) {
                const ostromButton = document.createElement('button');
                ostromButton.textContent = 'Ostrom';
                ostromButton.disabled = 
                        playerMp < 2 
                ostromButton.onclick = (e) => {
                    e.stopPropagation();
                    gameAction.ostrom('player', card);
                };
                cardDiv.appendChild(ostromButton);
            }
        }

        // Add buttons for activatable effects
        if (card.hatasok) {
            card.hatasok.forEach((hatas, index) => {
                if (abilityFunctions.aktivizalhato(hatas)) {
                    const effectButton = document.createElement('button');
                    effectButton.textContent = hatas.kiirtnev || 'Hatás aktiválás';
                    effectButton.className = 'effect-button';
                    effectButton.disabled = 
                        playerMp < helper.getValue(hatas, "mp") 
                        || !abilityFunctions.hasznalhatoAktualisFazisban(hatas) 
                        || hatas.tipus == "képesség" && !gameState.jelenSpaces.includes(space) 
                        || (gameEffect[hatas.szoveg] && !gameEffect[hatas.szoveg].celpontValidalas(kivalasztas));
                    effectButton.onclick = (e) => {
                        e.stopPropagation();
                        gameAction.hatasAktivizalas(player, card, hatas);
                    };
                    cardDiv.appendChild(effectButton);
                }
            });
        }

        // Leidéző gomb
        if (card.laptipus === 'Kalandozó' && (space === 'sor' || space === 'manover')) {
            const leidezoButton = document.createElement('button');
            leidezoButton.textContent = 'Leidéző';
            leidezoButton.className = 'leidezo-button';
            
            const aktualisLeidezo = gameState.state.playerAttributes[player].leidezo;
            const isLeidezo = aktualisLeidezo === card;
            
            if (isLeidezo) {
                leidezoButton.classList.add('active');
                cardDiv.classList.add('leidezo');
            }
            
            leidezoButton.onclick = (e) => {
                e.stopPropagation();
                if (aktualisLeidezo === card) {
                    gameState.state.playerAttributes[player].leidezo = null;
                } else {
                    gameState.state.playerAttributes[player].leidezo = card;
                }
                gameUi.render();
            };
            cardDiv.appendChild(leidezoButton);
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