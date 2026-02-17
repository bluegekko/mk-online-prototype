// Unit tesztek a feltetel.teljesul() függvényhez


function runTests() {
    // Böngészőben a globális feltetel objektumot használjuk
    if (typeof feltetel === 'undefined') {
        console.error('A feltetel objektum nem található. Győződj meg róla, hogy a feltetelek.js be van töltve.');
        return;
    }
    const tests = [
        // Egyszerű feltételek
        {
            name: "Egyszerű képzettség",
            feltetel: "Zárnyitás",
            kalandozok: [{kepzettsegek: ["Zárnyitás"]}],
            expected: true
        },
        {
            name: "Egyszerű főkaszt",
            feltetel: "SZERENCSEVADÁSZ",
            kalandozok: [{fokaszt: ["SZERENCSEVADÁSZ"]}],
            expected: true
        },
        {
            name: "Egyszerű színesítő",
            feltetel: "Toroni",
            kalandozok: [{szinesito: "Toroni harcos"}],
            expected: true
        },
        
        // Szóközzel elválasztott (AND - egy kalandozó)
        {
            name: "Toroni Tolvaj - teljesül",
            feltetel: "Toroni Tolvaj",
            kalandozok: [{szinesito: "Toroni", alkaszt: ["Tolvaj"]}],
            expected: true
        },
        {
            name: "Toroni Tolvaj - nem teljesül (két kalandozó)",
            feltetel: "Toroni Tolvaj",
            kalandozok: [{szinesito: "Toroni"}, {alkaszt: ["Tolvaj"]}],
            expected: false
        },
        {
            name: "Toroni Iker - teljesül",
            feltetel: "Toroni Iker",
            kalandozok: [{szinesito: "Toroni Iker"}],
            expected: true
        },
        
        // + operátor (AND - egy kalandozó)
        {
            name: "SZERENCSEVADÁSZ+HARCOS - teljesül",
            feltetel: "SZERENCSEVADÁSZ+HARCOS",
            kalandozok: [{fokaszt: ["SZERENCSEVADÁSZ", "HARCOS"]}],
            expected: true
        },
        {
            name: "SZERENCSEVADÁSZ+HARCOS - két kalandozó teljesül",
            feltetel: "SZERENCSEVADÁSZ+HARCOS",
            kalandozok: [{fokaszt: ["SZERENCSEVADÁSZ"]}, {fokaszt: ["HARCOS"]}],
            expected: true
        },
        {
            name: "Lesvetés+Orvtámadás - teljesül egy kalandozóval",
            feltetel: "Lesvetés+Orvtámadás",
            kalandozok: [{kepzettsegek: ["Lesvetés", "Orvtámadás"]}],
            expected: true
        },
        {
            name: "Lesvetés+Orvtámadás - teljesül két kalandozóval",
            feltetel: "Lesvetés+Orvtámadás",
            kalandozok: [{kepzettsegek: ["Lesvetés"]}, {kepzettsegek: ["Orvtámadás"]}],
            expected: true
        },
        {
            name: "Toroni+ember - teljesül",
            feltetel: "Toroni+ember",
            kalandozok: [{szinesito: "Toroni ember"}],
            expected: true
        },
        {
            name: "Toroni+ember - teljesül",
            feltetel: "Toroni+ember",
            kalandozok: [{szinesito: "Toroni"}],
            expected: true
        },


        
        // / operátor (OR)
        {
            name: "Fejvadász/Tolvaj - teljesül Fejvadász",
            feltetel: "Fejvadász/Tolvaj",
            kalandozok: [{alkaszt: ["Fejvadász"]}],
            expected: true
        },
        {
            name: "Fejvadász/Tolvaj - teljesül Tolvaj",
            feltetel: "Fejvadász/Tolvaj",
            kalandozok: [{alkaszt: ["Tolvaj"]}],
            expected: true
        },
        {
            name: "Fejvadász/Tolvaj - nem teljesül",
            feltetel: "Fejvadász/Tolvaj",
            kalandozok: [{alkaszt: ["Harcos"]}],
            expected: false
        },
        {
            name: "Lélektan/Orvtámadás - teljesül",
            feltetel: "Lélektan/Orvtámadás",
            kalandozok: [{kepzettsegek: ["Lélektan"]}],
            expected: true
        },
        
        // / operátor szóközzel (komplex)
        {
            name: "Élet/rend jellem - teljesül Élet jellem",
            feltetel: "Élet/rend jellem",
            kalandozok: [{jellem: "Élet"}],
            expected: true
        },
        {
            name: "Élet/rend jellem - teljesül rend jellem",
            feltetel: "Élet/rend jellem",
            kalandozok: [{jellem: "rend"}],
            expected: true
        },
        {
            name: "Élet/rend jellem - nem teljesül",
            feltetel: "Élet/rend jellem",
            kalandozok: [{jellem: "Káosz"}],
            expected: false
        },
        {
            name: "Élet/rend jellem - nem teljesül (csak jellem)",
            feltetel: "Élet/rend jellem",
            kalandozok: [{kepzettsegek: ["jellem"]}],
            expected: false
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        const result = feltetel.teljesul(test.feltetel, test.kalandozok);
        if (result === test.expected) {
            console.log(`✓ ${test.name}`);
            passed++;
        } else {
            console.error(`✗ ${test.name}`);
            console.error(`  Feltétel: "${test.feltetel}"`);
            console.error(`  Várt: ${test.expected}, Kapott: ${result}`);
            failed++;
        }
    });
    
    console.log(`\n${passed} teszt sikeres, ${failed} teszt sikertelen`);
}

// Futtatás
runTests();
