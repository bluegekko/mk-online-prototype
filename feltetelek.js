feltetel = {
    // Küldetés feltételek:
    // "Álöltözet + Lopózás" - két képzettség együtt
    // "SZERENCSEVADÁSZ+HARCOS" - két főkaszt együtt
    // "Toroni Tolvaj" - szinesítő + alkaszt
    // "Lélektan/Orvtámadás" - két képzettség egyike
    // "Toroni+ember" - két szinesítő együtt
    // "Vallatás/Vallás" - két képzettség egyike
    // "Elitharcos/vihargárdista" - két szinesítő egyike
    // "Élet/rend jellem" - két jellem egyike
    // "Hadvezetés/Taktika" - két képzettség egyike
    // "Lesvetés+Orvtámadás" - két képzettség együtt
    // "Méregkeverés+Politika" - két képzettség együtt
    // "Toroni Iker" - szinesítő + szinesítő
    // "Fejvadász/Tolvaj" - két alkaszt egyike
    // "Goblin/ork" - két szinesítő egyike
    // "Herbalizmus/Méregkeverés" - két képzettség egyike
    // "Álöltözet/Lopózás" - két képzettség egyike
    // "SZERENCSEVADÁSZ" - főkaszt
    // "Zárnyitás" - képzettség
    // "Cápa/Iker" - két szinesítő egyike
    // "Kínzás/Vallatás" - két képzettség egyike
    // "Mágiaismeret/Stratégia" - két képzettség egyike
    
    // Építmény feltétel:
    // "Toroni" - szinesítő

    teljesul: function(feltetelStr, kalandozok) {
        if (feltetelStr.includes('/')) {
            const parts = feltetelStr.split('/');
            return parts.some(req => {
                const subParts = req.trim().split(/\s+/).filter(p => p.toLowerCase() !== 'jellem');
                if (subParts.length > 1) {
                    return kalandozok.some(k => subParts.every(p => this.illeszkedik(k, p)));
                }
                if (subParts.length === 1) {
                    return kalandozok.some(k => this.illeszkedik(k, subParts[0]));
                }
                return false;
            });
        }
        
        if (feltetelStr.includes('+')) {
            const parts = feltetelStr.split('+');
            return parts.every(req => 
                kalandozok.some(k => this.illeszkedik(k, req.trim()))
            );
        }
        
        const parts = feltetelStr.trim().split(/\s+/);
        if (parts.length > 1) {
            return kalandozok.some(k => parts.every(p => this.illeszkedik(k, p)));
        }
        
        return kalandozok.some(k => this.illeszkedik(k, feltetelStr.trim()));
    },

    illeszkedik: function(kalandozo, feltetel) {
        const f = feltetel.toLowerCase();
        
        if (f === 'ember') {
            return helper.vanEmberFaj(kalandozo);
        }
        
        if (kalandozo.fokaszt?.some(fk => fk.toLowerCase() === f)) return true;
        if (kalandozo.alkaszt?.some(ak => ak.toLowerCase() === f)) return true;
        if (kalandozo.kepzettsegek?.some(k => k.toLowerCase() === f)) return true;
        if (kalandozo.szinesito?.toLowerCase().includes(f)) return true;
        if (kalandozo.jellem?.toLowerCase() === f) return true;
        
        return false;
    }
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = feltetel;
}