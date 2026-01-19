abilityFunctions = {
    aktivizalhato: function(hatas) {
        return hatas.jelek.lenght === 0 || !hatas.jelek.includes("allando") || 
        hatas.jelek.includes("egyszeri") ||
        hatas.jelek.includes("elforgato") ||
        hatas.jelek.includes("elveszendo") ||
        hatas.jelek.includes("harc_elotti") ||
        hatas.jelek.includes("ismetelheto") ||
        hatas.jelek.includes("megszakito")
    },

    sebesseg: function(hatas) {
        // TODO
    },

    fazis: function(hatas) {
        // TODO
    }
}