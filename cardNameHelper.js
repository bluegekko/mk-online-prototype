const cardNameHelper = {
    findCardByPartialName: function(partialName) {
        if (!partialName) return null;
        
        const searchTerm = partialName.toLowerCase().trim();
        
        // Exact match first
        let found = cardLibrary.find(card => card.nev.toLowerCase() === searchTerm);
        if (found) return found.nev;
        
        // Partial match
        found = cardLibrary.find(card => card.nev.toLowerCase().includes(searchTerm));
        if (found) return found.nev;
        
        return null;
    }
};