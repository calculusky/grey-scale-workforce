
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries

    const categories = [
        {name: '1ST UPRISER CABLE BURNT', weight: '4', type: "HT FAULT", category: "CABLE FAULTS"},
        {name: 'ABNORMAL NOISE FROM TRANSFORMER', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: '1ST UPRISER CABLE PUNCTURE', weight: '4', type: "HT FAULT", category: "CABLE FAULTS"},
        {name: '1ST UPRISER CABLE TERMINATION BURNT', weight: '4', type: "HT FAULT", category: "CABLE FAULTS"},
        {name: 'AMI METER BREAKER TRIP', weight: '2', type: "LT FAULT", category: "CUSTOMER METER ISSUES"},
        {name: 'ARCING ON DT GANG ISOLATOR', weight: '3', type: "DT FAULT", category: "GANG ISOLATOR FAULTS"},
        {name: 'ARCING ON FEEDER GANG ISOLATOR', weight: '4', type: "HT FAULT", category: "GANG ISOLATOR FAULTS"},
        {name: 'ARCING ON TRANSFORMER HV BUSHING', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'ARCING ON TRANSFORMER LV BUSHING', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'BAD FEEDER PILLAR (BOX)', weight: '3', type: "DT FAULT", category: "FEEDER PILLAR FAULTS"},
        {name: 'BAD HRC FUSE/FUSE LINK', weight: '3', type: "DT FAULT", category: "FEEDER PILLAR FAULTS"},
        {name: 'BAD/CORRODED PIN CONTACT (HV)', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'BAD/CORRODED PIN CONTACT (LV)', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'BAD/FAULTY HVDS BREAKER', weight: '3', type: "DT FAULT", category: "HVDS DT BREAKER FAULTS"},
        {name: 'BLANK DT METER DISPLAY (AMI)', weight: '3', type: "DT FAULT", category: "METER FAULTS"},
        {name: 'BROKEN CROSSARM AND SHATTERED INSULATOR', weight: '4', type: "HT FAULT", category: "POLES"},
        {name: 'BROKEN/TILTED WOODEN CROSS ARM', weight: '4', type: "HT FAULT", category: "POLES"},
        {name: 'BURNT CABLE AND CABLE LUG', weight: '3', type: "DT FAULT", category: "CABLE FAULTS"},
        {name: 'BURNT CABLE LUG', weight: '3', type: "DT FAULT", category: "CABLE FAULTS"},
        {name: 'BURNT CUSTOMER METER', weight: '2', type: "LT FAULT", category: "CUSTOMER METER ISSUES"},
        {name: 'BURNT CUSTOMER METER FUSE', weight: '2', type: "LT FAULT", category: "CUSTOMER METER ISSUES"},
        {name: 'BURNT DT METER (AMI)', weight: '3', type: "DT FAULT", category: "METER FAULTS"},
        {name: 'BURNT DT SUBSTATION LV CABLES', weight: '3', type: "DT FAULT", category: "CABLE FAULTS"},
        {name: 'BURNT HVDS LV CABLE', weight: '3', type: "DT FAULT", category: "CABLE FAULTS"},
        {name: 'BURNT F/P FUSE & UPRISER CUT', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'BURNT FEEDER PILLAR FUSE', weight: '3', type: "DT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'BURNT LT RETILENS CABLE', weight: '2', type: "LT FAULT", category: "CABLE FAULTS"},
        {name: 'BURNT XLPE CABLE', weight: '3', type: "DT FAULT", category: "CABLE FAULTS"},
        {name: 'BURNT/CORRODED FEEDER PILLAR UNIT', weight: '3', type: "DT FAULT", category: "FEEDER PILLAR FAULTS"},
        {name: 'BURNT/CORRODED HV THIMBLE', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'BURNT/CORRODED LV THIMBLE', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'BURNT/MELTED FEEDER PILLAR BAR', weight: '3', type: "DT FAULT", category: "FEEDER PILLAR FAULTS"},
        {name: 'BURST TRANSFORMER TANK', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'CRACKED/SHATTERED HV BUSHINGS', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'CRACKED/SHATTERED LV BUSHINGS', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'CRACKED/SHATTERED PLINTH', weight: '3', type: "DT FAULT", category: "STRUCTURAL FAULTS"},
        {name: 'CUSTOMER SERVICE WIRE PARTIAL CONTACT', weight: '2', type: "LT FAULT", category: "INDIVIDUAL CUSTOMER ISSUES"},
        {name: 'CUT/BURNT CUSTOMER SERVICE WIRE', weight: '2', type: "LT FAULT", category: "INDIVIDUAL CUSTOMER ISSUES"},
        {name: 'D-FUSE JUMPER CUT', weight: '4', type: "HT FAULT", category: "HT JUMPER CUT"},
        {name: 'DT COMMISSIONING', weight: '1', type: "OPERATIONS", category: "NEW PROJECTS"},
        {name: 'DT LOAD READING', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'DT METER INSTALLATION', weight: '1', type: "OPERATIONS", category: "METER INSTALLATION"},
        {name: 'DT METER NOT FUNCTIONAL (AMI)', weight: '3', type: "DT FAULT", category: "METER FAULTS"},
        {name: 'DT METER READING', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'DT PREVENTIVE MAINTENANCE', weight: '1', type: "OPERATIONS", category: "PREVENTIVE MAINTENANCE"},
        {name: 'DT SWAPPING', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'DT UPRATING', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'DT(s) TRANSFER TO NEW FEEDER', weight: '1', type: "OPERATIONS", category: "NETWORK RESTRUCTURING"},
        {name: 'E/F', weight: '4', type: "HT FAULT", category: "EARTH FAULTS"},
        {name: 'ENERGISED HT STAY ASSEMBLY', weight: '4', type: "HT FAULT", category: "POLES"},
        {name: 'ENERGISED LT STAY ASSEMBLY', weight: '2', type: "LT FAULT", category: "POLES"},
        {name: 'FAILED DT', weight: '3', type: "DT FAULT", category: "TRANSFORMER LOSS IN CIRCUIT"},
        {name: 'FALLEN/BROKEN HT POLE', weight: '4', type: "HT FAULT", category: "POLES"},
        {name: 'FALLEN/BROKEN LT POLE', weight: '2', type: "LT FAULT", category: "POLES"},
        {name: 'FAULTY AMI METER', weight: '2', type: "LT FAULT", category: "CUSTOMER METER ISSUES"},
        {name: 'FAULTY ANALOG METER', weight: '2', type: "LT FAULT", category: "CUSTOMER METER ISSUES"},
        {name: 'FAULTY DT METER PROGRAMMING', weight: '3', type: "DT FAULT", category: "METER FAULTS"},
        {name: 'FAULTY PPM METER (Not AMI)', weight: '2', type: "LT FAULT", category: "CUSTOMER METER ISSUES"},
        {name: 'FEEDER LOAD SHEDDING', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'FEEDER PREVENTIVE MAINTENANCE', weight: '1', type: "OPERATIONS", category: "PREVENTIVE MAINTENANCE"},
        {name: 'FIRE OUTBREAK', weight: '3', type: "DT FAULT", category: "OTHER"},
        {name: 'HIGH DT TEMPERATURE (OVERHEATING)', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'HIGH EARTHING RESISTANCE', weight: '3', type: "DT FAULT", category: "ISSUES WITH S/S EARTHING"},
        {name: 'HIGH VOLTAGE', weight: '2', type: "LT FAULT", category: "ISSUES WITH NEUTRAL"},
        {name: 'HT FEEDER EXTENSION', weight: '1', type: "OPERATIONS", category: "NETWORK RESTRUCTURING"},
        {name: 'HT JUMPER CUT', weight: '4', type: "HT FAULT", category: "HT JUMPER CUT"},
        {name: 'HT JUMPER CUT AND SHATTERED INSULATOR', weight: '4', type: "HT FAULT", category: "MULTIPLE HT FAULTS"},
        {name: 'HT MAINLINE CUT', weight: '4', type: "HT FAULT", category: "HT MAINLINE CUT"},
        {name: 'HT MAINLINE CUT AND SHATTERED INSULATOR', weight: '4', type: "HT FAULT", category: "MULTIPLE HT FAULTS"},
        {name: 'HV DISTRIBUTION NETWORK MAINTENANCE (Safety)', weight: '1', type: "OPERATIONS", category: "NETWORK ISSUES RESOLUTION"},
        {name: 'HV NETWORK DEFECTS CORRECTION (Cetaam)', weight: '1', type: "OPERATIONS", category: "NETWORK ISSUES RESOLUTION"},
        {name: 'HVDS BREAKER TRIP', weight: '3', type: "DT FAULT", category: "HVDS DT BREAKER FAULTS"},
        {name: 'INTERNAL OPEN CIRCUIT (HV)', weight: '3', type: "DT FAULT", category: "DT OPEN CIRCUIT"},
        {name: 'INTERNAL OPEN CIRCUIT (LV)', weight: '3', type: "DT FAULT", category: "DT OPEN CIRCUIT"},
        {name: 'INTERNAL SHORT CIRCUIT (HV)', weight: '3', type: "DT FAULT", category: "DT SHORT CIRCUIT"},
        {name: 'INTERNAL SHORT CIRCUIT (LV)', weight: '3', type: "DT FAULT", category: "DT SHORT CIRCUIT"},
        {name: 'INST. O/C AND E/F', weight: '4', type: "HT FAULT", category: "EARTH FAULTS"},
        {name: 'INTERCONNECTOR CABLE BURNT', weight: '4', type: "HT FAULT", category: "CABLE FAULTS"},
        {name: 'INTERCONNECTOR CABLE PUNCTURE', weight: '4', type: "HT FAULT", category: "CABLE FAULTS"},
        {name: 'INTERCONNECTOR CABLE TERMINATION BURNT', weight: '4', type: "HT FAULT", category: "CABLE FAULTS"},
        {name: 'LOAD BALANCING', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'LOAD BREAK/DIVERSION', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'LOADING OF SUBSTATION', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'LOCAL LOAD SHEDDING', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'LOW OIL LEVEL', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'LOW VOLTAGE', weight: '2', type: "LT FAULT", category: "ISSUES WITH NEUTRAL"},
        {name: 'LT JUMPER AND MAINLINE CUT', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'LT JUMPER AND UPRISER CUT', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'LT JUMPER CUT', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'LT LINE EXTENSION', weight: '1', type: "OPERATIONS", category: "NETWORK RESTRUCTURING"},
        {name: 'LT MAINLINE CUT', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'LT MAINLINE TWISTED', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'LT PREVENTIVE MAINTENANCE', weight: '1', type: "OPERATIONS", category: "PREVENTIVE MAINTENANCE"},
        {name: 'LT TWISTED MAINLINE AND MAINLINE CUT', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'LT UPRISER AND MAINLINE CUT', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'LT UPRISER CABLE PUNCTURE/BURNT', weight: '3', type: "DT FAULT", category: "CABLE FAULTS"},
        {name: 'LT UPRISER CUT', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'LT UPRISER CUT AND TWISTED MAINLINE', weight: '2', type: "LT FAULT", category: "LOSS OF PHASE(S)"},
        {name: 'LV DISTRIBUTION NETWORK MAINTENANCE (Safety)', weight: '1', type: "OPERATIONS", category: "NETWORK ISSUES RESOLUTION"},
        {name: 'LV NETWORK DEFECTS CORRECTION (Cetaam)', weight: '1', type: "OPERATIONS", category: "NETWORK ISSUES RESOLUTION"},
        {name: 'MD CASH DRIVE', weight: '1', type: "OPERATIONS", category: "COMMERCIAL OPERATIONS"},
        {name: 'MD DISCONNECTION', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'MD METER INSTALLATION', weight: '1', type: "OPERATIONS", category: "METER INSTALLATION"},
        {name: 'MD RECONNECTION', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'NEW FEEDER COMMISSIONING', weight: '1', type: "OPERATIONS", category: "NEW PROJECTS"},
        {name: 'NEW LT LINE COMMISSIONING', weight: '1', type: "OPERATIONS", category: "NEW PROJECTS"},
        {name: 'NEW MD SERVICE CONNECTION', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'NEW NMD SERVICE CONNECTION', weight: '1', type: "OPERATIONS", category: "COMMERCIAL OPERATIONS"},
        {name: 'NMD CASH DRIVE', weight: '1', type: "OPERATIONS", category: "COMMERCIAL OPERATIONS"},
        {name: 'NMD DISCONNECTION', weight: '1', type: "OPERATIONS", category: "COMMERCIAL OPERATIONS"},
        {name: 'NMD METER INSTALLATION', weight: '1', type: "OPERATIONS", category: "METER INSTALLATION"},
        {name: 'NMD RECONNECTION', weight: '1', type: "OPERATIONS", category: "COMMERCIAL OPERATIONS"},
        {name: 'NO RELAY INDICATION', weight: '4', type: "HT FAULT", category: "OTHER"},
        {name: 'NO CONTINUITY', weight: '1', type: "OPERATIONS", category: "OTHER"},
        {name: 'O/C', weight: '4', type: "HT FAULT", category: "EARTH FAULTS"},
        {name: 'O/C & E/F', weight: '4', type: "HT FAULT", category: "EARTH FAULTS"},
        {name: 'OIL LEAKAGE FROM HV BUSHINGS', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'OIL LEAKAGE FROM LV BUSHINGS', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'OIL LEAKAGE FROM TAP CHANGER', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'OIL LEAKAGE FROM THE TRANSFORMER FINS', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'OIL LEAKAGE FROM TRANSFORMER TOP/BODY', weight: '3', type: "DT FAULT", category: "TRANSFORMER FAULTS"},
        {name: 'OPENED ON EMERGENCY', weight: '4', type: "HT FAULT", category: "EMERGENCY"},
        {name: 'PHASE IMBALANCE (LOAD DROP)', weight: '4', type: "HT FAULT", category: "EMERGENCY"},
        {name: 'PLACE SUBSTATION ON SOAK', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'RUPTURED 1NO. J&P FUSE', weight: '3', type: "DT FAULT", category: "RUPTURED J&P FUSE(S)"},
        {name: 'RUPTURED 2NO. J&P FUSE', weight: '3', type: "DT FAULT", category: "RUPTURED J&P FUSE(S)"},
        {name: 'RUPTURED 3NO. J&P FUSE', weight: '3', type: "DT FAULT", category: "RUPTURED J&P FUSE(S)"},
        {name: 'RUPTURED LINE J&P FUSE', weight: '4', type: "HT FAULT", category: "RUPTURED J&P FUSE(S)"},
        {name: 'SAFE WORKING SPACE', weight: '1', type: "OPERATIONS", category: "TECHNICAL OPERATIONS"},
        {name: 'SECTIONALIZED', weight: '4', type: "HT FAULT", category: "HT FEEDER SECTIONALIZATION"},
        {name: 'SECTIONALIZED (POOR VISIBILITY)', weight: '4', type: "HT FAULT", category: "HT FEEDER SECTIONALIZATION"},
        {name: 'SHATTERED D-FUSE ASSEMBLY', weight: '3', type: "DT FAULT", category: "D-FUSE ASSEMBLY FAULT"},
        {name: 'SHATTERED DISC INSULATOR', weight: '4', type: "HT FAULT", category: "POLES"},
        {name: 'SHATTERED HT STAY INSULATOR', weight: '4', type: "HT FAULT", category: "STRUCTURAL FAULTS"},
        {name: 'SHATTERED LA AND D-FUSE ASSEMBLY', weight: '3', type: "DT FAULT", category: "LA & D-FUSE ASSEMBLY"},
        {name: 'SHATTERED LIGHTNING ARRESTERS', weight: '3', type: "DT FAULT", category: "LIGHTNING ARRESTERS FAULT"},
        {name: 'SHATTERED LT STAY INSULATOR', weight: '2', type: "LT FAULT", category: "STRUCTURAL FAULTS"},
        {name: 'SHATTERED PIN INSULATOR', weight: '4', type: "HT FAULT", category: "POLES"},
        {name: 'SHATTERED POT INSULATOR', weight: '4', type: "HT FAULT", category: "POLES"},
        {name: 'SHATTERED SHACKLE INSULATOR', weight: '2', type: "LT FAULT", category: "POLES"},
        {name: 'SINKING PLINTH', weight: '3', type: "DT FAULT", category: "STRUCTURAL FAULTS"},
        {name: 'SNAPPED HT STAY WIRE', weight: '4', type: "HT FAULT", category: "STRUCTURAL FAULTS"},
        {name: 'SNAPPED LT STAY WIRE', weight: '2', type: "LT FAULT", category: "STRUCTURAL FAULTS"},
        {name: 'VANDALIZED 1ST UPRISER CABLE', weight: '4', type: "HT FAULT", category: "CABLE VANDALIZATION"},
        {name: 'VANDALIZED DT HV CABLES', weight: '3', type: "DT FAULT", category: "CABLE VANDALIZATION"},
        {name: 'VANDALIZED DT LV CABLES', weight: '3', type: "DT FAULT", category: "CABLE VANDALIZATION"},
        {name: 'VANDALIZED INTERCONNECTOR CABLE', weight: '4', type: "HT FAULT", category: "CABLE VANDALIZATION"},
        {name: 'VOLTAGE FLUCTUATION', weight: '2', type: "LT FAULT", category: "ISSUES WITH NEUTRAL"},
        {name: 'XLPE CABLE PUNCTURE', weight: '3', type: "DT FAULT", category: "CABLE FAULTS"},
        {name: 'XLPE TERMINATION BURNT',  weight: '3', type: "DT FAULT", category: "CABLE FAULTS"},

        {name: 'CABLE FAULTS', type: null, weight: null},
        {name: 'TRANSFORMER FAULTS', type: null, weight: null},
        {name: 'CUSTOMER METER ISSUES', type: null, weight: null},
        {name: 'GANG ISOLATOR FAULTS', type: null, weight: null},
        {name: 'FEEDER PILLAR FAULTS', type: null, weight: null},
        {name: 'HVDS DT BREAKER FAULTS', type: null, weight: null},
        {name: 'METER FAULTS', type: null, weight: null},
        {name: 'POLES', type: null, weight: null},
        {name: 'LOSS OF PHASE(S)', type: null, weight: null},
        {name: 'STRUCTURAL FAULTS', type: null, weight: null},
        {name: 'INDIVIDUAL CUSTOMER ISSUES', type: null, weight: null},
        {name: 'NEW PROJECTS', type: null, weight: null},
        {name: 'TECHNICAL OPERATIONS', type: null, weight: null},
        {name: 'METER INSTALLATION', type: null, weight: null},
        {name: 'PREVENTIVE MAINTENANCE', type: null, weight: null},
        {name: 'NETWORK RESTRUCTURING', type: null, weight: null},
        {name: 'NETWORK ISSUES RESOLUTION', type: null, weight: null},
        {name: 'EARTH FAULTS', type: null, weight: null},
        {name: 'TRANSFORMER LOSS IN CIRCUIT', type: null, weight: null},
        {name: 'OTHER', type: null, weight: null},
        {name: 'ISSUES WITH S/S EARTHING', type: null, weight: null},
        {name: 'ISSUES WITH NEUTRAL', type: null, weight: null},
        {name: 'COMMERCIAL OPERATIONS', type: null, weight: null},
        {name: 'EMERGENCY', type: null, weight: null},
        {name: 'RUPTURED J&P FUSE(S)', type: null, weight: null},
        {name: 'MULTIPLE HT FAULTS', type: null, weight: null},
        {name: 'HT FEEDER SECTIONALIZATION', type: null, weight: null},
        {name: 'D-FUSE ASSEMBLY FAULT', type: null, weight: null},
        {name: 'LA & D-FUSE ASSEMBLY', type: null, weight: null},
        {name: 'LIGHTNING ARRESTERS FAULT', type: null, weight: null},
        {name: 'CABLE VANDALIZATION', type: null, weight: null},
        {name: 'DT OPEN CIRCUIT', type: null, weight: null},
        {name: 'DT SHORT CIRCUIT', type: null, weight: null}
    ];

    console.log("STARTED SEEDING CATEGORIZATION");

    // Duplicate categories data
    const filterCategories = JSON.parse(JSON.stringify(categories));
    let seedCount = 0;

    for (let cat in filterCategories){
        // check if category key in filterCategories
        if ("category" in filterCategories[cat]) {
            // Remove category key from filterCategories
            delete filterCategories[cat].category;
        }
        seedCount++;
    }


    // async function catById(cat) {
    //     let catId;
    //     return knex('fault_categories').where({name: categories[cat].category}).select('id')
    //         .then(function (id) {
    //             catId = JSON.parse(JSON.stringify(id));
    //             // subCatById.push(subCatId[0].id);
    //             return catId[0].id;
    //         });
    // }
    //
    // async function subCatById(cat) {
    //     // let subCatById= [];
    //     let subCatId;
    //     return knex('fault_categories').where({name: categories[cat].name}).select('id')
    //         .then(function (id) {
    //             subCatId = JSON.parse(JSON.stringify(id));
    //             // subCatById.push(subCatId[0].id);
    //             return subCatId[0].id;
    //         });
    // }
    //
    //
    // let count = 1;
    // let subCategories = [];
    //
    // for (let cat in categories) {
    //     if ("category" in categories[cat]) {
    //         // console.log("--------++++++++++++");
    //         Promise.all([catById(cat), subCatById(cat)]).then((val) => {
    //             console.log(val);
    //             subCategories.push({parent_category_id: val[0], child_category_id: val[1]});
    //             return knex('fault_categories_subs').insert(subCategories);
    //         }).catch(err=> {
    //             console.log(err);
    //         });
    //     }
    //
    // }


    if (categories.length === seedCount) {

            console.log(`FINISHED INSERTING ${filterCategories.length} CATEGORIES`);

            return knex('fault_categories').del()
        .then(function () {
            // Inserts seed entries
            return knex('fault_categories').insert(filterCategories);
        })

        .then(function () {
            console.log("Done seeding! Exit");
        });

    }


};
