abilityFunctions = {
    szimplaMPKotottJelek: [["egyperjatekos"], ["egyszeri"], ["elforgato"], ["elveszendo"], ["ismetelheto"]],
    harciFazisok: ["Harc előkészítés", "Harci körök", "Harc eredményének meghatározása"],
    sorFazisok: ["Forduló kezdete", "Erőforrás fázis", "Manőverek fázisa", "Forduló vége"],

    aktivizalhato: function(hatas) {
        return (hatas.jelek.length !== 0 && !hatas.jelek.includes("allando")) || 
        hatas.jelek.includes("egyszeri") ||
        hatas.jelek.includes("elforgato") ||
        hatas.jelek.includes("elveszendo") ||
        hatas.jelek.includes("harc_elotti") ||
        hatas.jelek.includes("ismetelheto") ||
        hatas.jelek.includes("megszakito")
    },

    folyamatos: function(hatas) {
        // TODO
    },

    idozitett: function(hatas) {
        // TODO
    },

    sebesseg: function(hatas) {
        if (hatas.jelek.includes("megszakito") || hatas.jelek.includes("harc_elotti")) {
            return "gyors hatás"
        } else {
            return "mp-kötött"
        }
    },

    fazis: function(hatas) {
        if (hatas.jelek.includes("harci")) {
            return "Harc"
        }
        if (abilityFunctions.sebesseg(hatas) === "mp-kötött") {
            return "Sor";
        } 
        if (hatas.jelek.includes("harc_elotti")) {
            return 'Harc előkészítés';
        }
        return "Sor/Manőver";
    },

    hasznalhatoAktualisFazisban: function(hatas) {
        if (hatas.isCard) {
            fazis = hatas.fazis ? hatas.fazis : abilityFunctions.fazis(helper.ervenyesuloHatas(hatas));
            sebesseg = helper.ervenyesuloHatas(hatas) ? abilityFunctions.sebesseg(helper.ervenyesuloHatas(hatas)) : "mp-kötött";
            // TODO Tömegek dühének kioltása
            jelek = helper.ervenyesuloHatas(hatas) ? helper.ervenyesuloHatas(hatas).jelek : []
            akciolap = hatas.laptipus == "Akciólap"
        } else {
            fazis = abilityFunctions.fazis(hatas);
            sebesseg = abilityFunctions.sebesseg(hatas);
            jelek = hatas.jelek
            akciolap = false;
        }
        if (sebesseg == "mp-kötött" && gameState.state.fazis.idofonal.folyamatban) {
            return false;
        }

        if (fazis == "Harc előkészítés") {
            return gameState.state.fazis.aktualisFazis.nev === 'Harc előkészítés';
        }
        if (fazis == "Harc") {
            return gameState.state.fazis.aktualisFazis.nev === 'Harci körök';
        } 
        if (fazis == "Sor" && sebesseg == "mp-kötött") {
            return gameState.state.fazis.aktualisFazis.nev === 'Manőverek fázisa';
        }

        // Csak kártyán lehetséges, amik kijátszhatóak harcban is Manőver fázis esetén
        if (fazis == "Manőver") {
            return !abilityFunctions.sorFazisok.includes(gameState.state.fazis.aktualisFazis.nev);
        }

        if (!jelek.includes("allando") && !akciolap) {
            return !abilityFunctions.harciFazisok.includes(gameState.state.fazis.aktualisFazis.nev);
        }

        if (jelek.includes("allando") || akciolap) {
            return true;
        }

        console.log("Nem lefedett fázis scenárió")
        return true; 
    },

}