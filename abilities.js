abilityFunctions = {
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
        if (!aktivizalhato(hatas)) {
            return null;
        }
        if (hatas.jelek.includes("megszakito") || hatas.jelek.includes("harc_elotti")) {
            return "gyors hatás"
        } else {
            return "mp-kötött"
        }
    },

    fazis: function(hatas) {
        // TODO
    }
}