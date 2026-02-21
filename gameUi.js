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
                ${card.dp != null ? `<div class="dp">DP: ${helper.getValue(card, "dp")}</div>` : ''}
                ${card.csatoltlapok && card.csatoltlapok.length > 0 ? `
                    <div class="csatolt-lapok" onclick="gameUi.showCsatoltLapokPanel(event, '${card.id}')">
                        Csatolt lapok (${card.csatoltlapok.length}):<br>
                        ${card.csatoltlapok.map(lap => lap.nev).join('<br>')}
                    </div>
                ` : ''}
            </div>
        `;

        const kivalasztas = gameState.state.playerAttributes[gameState.state.aktualisJatekos].kivalasztas;
        if (kivalasztas.includes(card)) {
            cardDiv.classList.add('selected');
            console.log("kivalasztott", card)
        }
        
        const valaszthatoKartyak = gameState.state.valaszthatoKartyak || [];
        if (valaszthatoKartyak.includes(card)) {
            cardDiv.classList.add('selectable');
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

        if (space === 'kez' && player === gameState.state.aktualisJatekos) {
            const button = document.createElement('button');
            button.textContent = 'Leidéz';
            // TODO celpontValidalas ellenorzese
            button.disabled = !card.leidezheto(player);
            button.onclick = (e) => {
                e.stopPropagation();
                gameAction.leidezesKezbol(player, card.id);
            };
            cardDiv.appendChild(button);
        }

        if (space === 'toronyszintek' && player === helper.ellenfel(gameState.state.aktualisJatekos)) {
            const ellenfelToronyszintek = gameState.state.playerSpaces[player]['toronyszintek'];
            if (ellenfelToronyszintek.length > 0 && ellenfelToronyszintek[0] === card) {
                const ostromButton = document.createElement('button');
                ostromButton.textContent = 'Ostrom';
                ostromButton.disabled = 
                        playerMp < 2 || !abilityFunctions.hasznalhatoAktualisFazisban({
                            fazis: "Sor",
                            sebesseg: "mp-kötött"
                        })
                ostromButton.onclick = (e) => {
                    e.stopPropagation();
                    gameAction.ostrom(gameState.state.aktualisJatekos, card);
                };
                cardDiv.appendChild(ostromButton);
            }
        }

        if (space === 'kuldetesek') {
            const kuldetesButton = document.createElement('button');
            kuldetesButton.textContent = 'Manőver';
            kuldetesButton.disabled = !abilityFunctions.hasznalhatoAktualisFazisban({
                fazis: "Sor",
                sebesseg: 'mp-kötött'
            });
            kuldetesButton.onclick = (e) => {
                e.stopPropagation();
                gameAction.kuldetesMegoldas(gameState.state.aktualisJatekos, card);
            };
            cardDiv.appendChild(kuldetesButton);
            
            // Feltételválasztás UI manőver közben
            const feltetelValasztas = gameState.state.feltetelValasztas;
            if (feltetelValasztas && card.feltetel && gameState.state.fazis.manover.szinhely === card) {
                const feltetelek = card.feltetel;
                const manoverCsapat = gameState.state.playerSpaces[gameState.state.fazis.manover.kezdemenyezoJatekos].manover;
                
                feltetelek.forEach((feltetelStr, index) => {
                    const teljesul = feltetel.teljesul(feltetelStr, manoverCsapat);
                    const valasztva = feltetelValasztas.valasztott.includes(index);
                    
                    const feltetelBtn = document.createElement('button');
                    feltetelBtn.textContent = feltetelStr + (teljesul ? ' ✓' : ' ✗');
                    feltetelBtn.disabled = !teljesul || valasztva;
                    feltetelBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (!valasztva) {
                            feltetelValasztas.valasztott.push(index);
                            gameUi.render();
                        }
                    };
                    cardDiv.appendChild(feltetelBtn);
                });
                
                const keszBtn = document.createElement('button');
                keszBtn.textContent = 'Kész';
                keszBtn.onclick = (e) => {
                    e.stopPropagation();
                    feltetelValasztas.kesz = true;
                };
                cardDiv.appendChild(keszBtn);
            }
            
            // Megoldásdöntés UI
            if (gameState.state.megoldasDontes === null && gameState.state.fazis.manover.szinhely === card) {
                const megoldBtn = document.createElement('button');
                megoldBtn.textContent = 'Megoldja';
                megoldBtn.onclick = (e) => {
                    e.stopPropagation();
                    gameState.state.megoldasDontes = true;
                };
                cardDiv.appendChild(megoldBtn);
                
                const nemMegoldBtn = document.createElement('button');
                nemMegoldBtn.textContent = 'Nem oldja meg';
                nemMegoldBtn.onclick = (e) => {
                    e.stopPropagation();
                    gameState.state.megoldasDontes = false;
                };
                cardDiv.appendChild(nemMegoldBtn);
            }
        }

        // Add buttons for activatable effects
        if (card.hatasok && card.tulajdonos === gameState.state.aktualisJatekos) {
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
        if (card.laptipus === 'Kalandozó' && (space === 'sor' || space === 'manover') && card.tulajdonos === gameState.state.aktualisJatekos) {
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

    showCsatoltLapokPanel: function(event, cardId) {
        event.stopPropagation();
        const card = this.findCardById(cardId);
        if (!card || !card.csatoltlapok) return;
        
        const title = `Csatolt lapok - ${card.nev} (${card.csatoltlapok.length})`;
        
        // Toggle működés
        const existingPanel = document.querySelector('.space-panel');
        if (existingPanel) {
            const existingTitle = existingPanel.querySelector('.space-panel-title').textContent;
            if (existingTitle.startsWith(`Csatolt lapok - ${card.nev}`)) {
                existingPanel.remove();
                return;
            }
        }
        
        this.showPanel(title, card.csatoltlapok, card.tulajdonos, 'panel');
    },

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

    render: function() {    
        // MP megjelenítése
        console.log('Current MP:', gameState.state.playerAttributes[gameState.state.aktualisJatekos].mp)
        console.log('Current phase:', gameState.state.fazis.aktualisFazis);
        document.getElementById('mp').textContent = gameState.state.playerAttributes[gameState.state.aktualisJatekos].mp;
        document.getElementById('aktualisFazis').textContent = gameState.state.fazis.aktualisFazis.nev;

        // Passz gomb disabled állapota
        const passzBtn = document.getElementById('passBtn');
        if (passzBtn) {
            passzBtn.disabled = gameState.state.valasztasFolyamatban || 
                               gameState.state.fazis.prioritas !== gameState.state.aktualisJatekos;
        }

        // Nyitott panel frissítése
        const existingPanel = document.querySelector('.space-panel');
        if (existingPanel) {
            const title = existingPanel.querySelector('.space-panel-title');
            if (title) {
                const match = title.textContent.match(/(Saját|Ellenfél) - (Mélység|Múlt|Jövő|Kéz|Megoldott küldetések)/);
                if (match) {
                    const playerName = match[1];
                    const displayName = match[2];
                    const player = playerName === 'Saját' ? gameState.state.aktualisJatekos : helper.ellenfel(gameState.state.aktualisJatekos);
                    const spaceMap = {'Mélység': 'melyseg', 'Múlt': 'mult', 'Jövő': 'jovo', 'Kéz': 'kez', 'Megoldott küldetések': 'megoldottkuldetesek'};
                    const spaceName = spaceMap[displayName];
                    const cards = gameState.state.playerSpaces[player][spaceName];
                    
                    title.textContent = `${playerName} - ${displayName} (${cards.length})`;
                    
                    const container = existingPanel.querySelector('.space-panel-cards');
                    if (container) {
                        container.innerHTML = '';
                        if (cards.length === 0) {
                            const emptyMsg = document.createElement('p');
                            emptyMsg.className = 'space-panel-empty';
                            emptyMsg.textContent = 'Nincs lap ebben a területben.';
                            container.appendChild(emptyMsg);
                        } else {
                            this.refreshPanelCards(container, cards, player, spaceName);
                        }
                    }
                }
            }
        }

        // Deck input event listeners (only add once)
        if (!this.deckListenersAdded) {
            document.getElementById('deckToggleBtn').onclick = () => {
                const deckInput = document.getElementById('deckInput');
                const toggleBtn = document.getElementById('deckToggleBtn');
                if (deckInput.style.display === 'none') {
                    deckInput.style.display = 'block';
                    toggleBtn.textContent = '▲ Pakli';
                } else {
                    deckInput.style.display = 'none';
                    toggleBtn.textContent = '▼ Pakli';
                }
            };
            
            document.getElementById('loadDeckBtn').onclick = () => {
                this.loadDeckFromText();
            };
            
            document.getElementById('playerSwitchBtn').onclick = () => {
                gameState.state.aktualisJatekos = gameState.state.aktualisJatekos === 'player' ? 'opponent' : 'player';
                this.render();
            };
            
            // Ctrl key for player switching
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && !e.repeat) {
                    gameState.state.aktualisJatekos = gameState.state.aktualisJatekos === 'player' ? 'opponent' : 'player';
                    this.render();
                }
            });
            
            // Prevent space key from passing when typing in deck textarea
            document.getElementById('deckTextarea').onkeydown = (e) => {
                e.stopPropagation();
            };
            
            // Tutorial close button
            document.getElementById('tutorialClose').onclick = () => {
                document.getElementById('tutorialPopup').classList.remove('expanded');
            };
            
            // Tutorial expand on click
            document.getElementById('tutorialPopup').onclick = (e) => {
                if (!e.target.closest('.tutorial-content')) {
                    document.getElementById('tutorialPopup').classList.add('expanded');
                }
            };
            
            this.deckListenersAdded = true;
        }

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
        const aktualisJatekos = gameState.state.aktualisJatekos || 'player';
        
        // Player mapping: melyik játékos kártyái jelenjenek meg melyik UI pozícióban
        const uiPlayers = aktualisJatekos === 'opponent' ? 
            ['opponent', 'player'] : ['player', 'opponent'];
        
        uiPlayers.forEach((actualPlayer, index) => {
            const uiPrefix = index === 0 ? 'player' : 'opponent';
            
            Object.keys(gameState.baseSpaces).forEach(space => {
                const containerId = `${uiPrefix}-${space}`;
                
                const container = document.getElementById(containerId);
                if (!container) {
                    return;
                }
    
                const cards = gameState.state.playerSpaces[actualPlayer][space];
            
                // Tartalom frissítése
                container.innerHTML = '';
                
                if (cards && cards.length > 0) {
                    cards.forEach(card => {
                        const cardElement = this.createCardElement(card, actualPlayer, space);
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
                
                // Küldetések subzone megjelenítése/elrejtése
                if (space === 'kuldetesek') {
                    const subzoneId = `${uiPrefix}-kuldetesekSubzone`;
                    const subzone = document.getElementById(subzoneId);
                    if (subzone) {
                        subzone.style.display = cards && cards.length > 0 ? 'block' : 'none';
                    }
                }
            });

            // Mélység, Múlt, Jövő gombok hozzáadása
            const jelenZone = uiPrefix === 'player' ? 
                document.querySelector('.zone[aria-labelledby="jelenCim"]') :
                document.querySelector('.zone[aria-labelledby="enemyJelenCim"]');
            
            if (jelenZone) {
                let buttonsContainer = jelenZone.querySelector('.space-buttons');
                if (!buttonsContainer) {
                    buttonsContainer = document.createElement('div');
                    buttonsContainer.className = 'space-buttons';
                    buttonsContainer.style.cssText = 'display: flex; gap: 5px; justify-content: flex-end; margin-top: 10px;';
                    jelenZone.appendChild(buttonsContainer);
                }
                
                buttonsContainer.innerHTML = '';
                
                const spaces = uiPrefix === 'player' ? ['megoldottkuldetesek', 'jovo', 'mult', 'melyseg'] : ['megoldottkuldetesek', 'kez', 'jovo', 'mult', 'melyseg'];
                const spaceNames = {'melyseg': 'Mélység', 'mult': 'Múlt', 'jovo': 'Jövő', 'kez': 'Kéz', 'megoldottkuldetesek': 'Megoldott küldetések'};
                
                spaces.forEach(spaceName => {
                    const button = document.createElement('button');
                    const count = gameState.state.playerSpaces[actualPlayer][spaceName].length;
                    button.textContent = `${spaceNames[spaceName]} (${count})`;
                    button.style.cssText = 'font-size: 10px; padding: 4px 6px; background: #4a90e2; color: white; border: 1px solid #357abd; border-radius: 3px; cursor: pointer;';
                    button.onclick = () => {
                        this.showSpaceCards(actualPlayer, spaceName, spaceNames[spaceName]);
                    };
                    buttonsContainer.appendChild(button);
                });
            };
        })
    },

    showPanel: function(title, cards, player, spaceName) {
        // Meglévő panel eltávolítása
        const existingPanel = document.querySelector('.space-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // Új panel létrehozása
        const panel = document.createElement('div');
        panel.className = 'space-panel';
        
        const header = document.createElement('div');
        header.className = 'space-panel-header';
        
        const titleElement = document.createElement('h4');
        titleElement.className = 'space-panel-title';
        titleElement.textContent = title;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'space-panel-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => {
            panel.remove();
            gameUi.render();
        };
        
        header.appendChild(titleElement);
        header.appendChild(closeBtn);
        panel.appendChild(header);
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'space-panel-cards';
        
        if (cards.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'space-panel-empty';
            emptyMsg.textContent = 'Nincs lap ebben a területben.';
            cardsContainer.appendChild(emptyMsg);
        } else {
            cards.forEach(card => {
                const cardElement = this.createCardElement(card, player, spaceName);
                if (spaceName !== 'panel') {
                    const originalOnClick = cardElement.onclick;
                    cardElement.onclick = () => {
                        originalOnClick();
                        setTimeout(() => this.refreshPanelCards(cardsContainer, cards, player, spaceName), 10);
                    };
                }
                cardsContainer.appendChild(cardElement);
            });
        }
        
        panel.appendChild(cardsContainer);
        document.body.appendChild(panel);
        
        // Panel bezárása kattintásra a játék területén
        const closeOnClickOutside = (e) => {
            if (e.target && e.target.nodeType === Node.ELEMENT_NODE && !panel.contains(e.target)) {
                panel.remove();
                document.querySelector('.container').removeEventListener('click', closeOnClickOutside);
                gameUi.render();
            }
        };
        
        setTimeout(() => {
            document.querySelector('.container').addEventListener('click', closeOnClickOutside);
        }, 100);
    },

    loadDeckFromText: function() {
        const deckText = document.getElementById('deckTextarea').value;
        const lines = deckText.split('\n').filter(line => line.trim());
        const newDeck = [];
        
        for (const line of lines) {
            const match = line.trim().match(/^(\d+)\s+(.+)$/);
            if (match) {
                const count = parseInt(match[1]);
                const cardName = match[2].trim();
                
                for (let i = 0; i < count; i++) {
                    try {
                        const card = cardFactory.fromLibrary(cardName);
                        newDeck.push(card);
                    } catch (error) {
                        console.warn(`Kártya nem található: ${cardName}`);
                    }
                }
            }
        }
        
        if (newDeck.length > 0) {
            gameState.customDeck = newDeck;
            gameState.initializeState();
            
            // Hide deck input after loading
            document.getElementById('deckInput').style.display = 'none';
            document.getElementById('deckToggleBtn').textContent = '▼ Pakli';
            
            this.render();
            console.log(`Pakli betöltve: ${newDeck.length} kártya`);
        }
    },

    showSpaceCards: function(player, spaceName, displayName) {
        const cards = gameState.state.playerSpaces[player][spaceName];
        const playerName = player === gameState.state.aktualisJatekos ? 'Saját' : 'Ellenfél';
        const title = `${playerName} - ${displayName} (${cards.length})`;
        
        // Toggle működés
        const existingPanel = document.querySelector('.space-panel');
        if (existingPanel) {
            const existingTitle = existingPanel.querySelector('.space-panel-title').textContent;
            if (existingTitle.startsWith(`${playerName} - ${displayName}`)) {
                existingPanel.remove();
                return;
            }
        }
        
        this.showPanel(title, cards, player, spaceName);
    },

    refreshPanelCards: function(container, cards, player, spaceName) {
        container.innerHTML = '';
        cards.forEach(card => {
            const cardElement = this.createCardElement(card, player, spaceName);
            const originalOnClick = cardElement.onclick;
            cardElement.onclick = () => {
                originalOnClick();
                setTimeout(() => this.refreshPanelCards(container, cards, player, spaceName), 10);
            };
            container.appendChild(cardElement);
        });
    }
}