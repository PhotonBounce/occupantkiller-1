window.FortWilliam = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14880;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function build() {
        buildBenNevis();
        buildJacobiteViaduct();
        buildGlenfinnanMonument();
        buildLochLinnhe();
        buildAonachMorGondola();
        buildFortWilliamTown();
    }

    function buildBenNevis() {
        // Main mountain base — very large box
        var base = makeMesh(new THREE.BoxGeometry(1200, 900, 1000), 0x7a6a55);
        base.position.set(X_OFFSET + 400, 450, -800);
        addObj(base);

        // Second tier
        var mid = makeMesh(new THREE.BoxGeometry(900, 600, 750), 0x8a7a65);
        mid.position.set(X_OFFSET + 420, 1200, -820);
        addObj(mid);

        // Upper tier
        var upper = makeMesh(new THREE.BoxGeometry(600, 400, 500), 0x9a8a75);
        upper.position.set(X_OFFSET + 440, 1650, -840);
        addObj(upper);

        // Summit plateau — flattened box
        var summit = makeMesh(new THREE.BoxGeometry(350, 80, 300), 0xaaaaaa);
        summit.position.set(X_OFFSET + 450, 1895, -855);
        addObj(summit);

        // North face CWM — sheer cliff face boxes (darker, steeper)
        var cliff1 = makeMesh(new THREE.BoxGeometry(400, 700, 60), 0x5a4a38);
        cliff1.position.set(X_OFFSET + 300, 1050, -380);
        addObj(cliff1);

        var cliff2 = makeMesh(new THREE.BoxGeometry(300, 500, 60), 0x4a3a2a);
        cliff2.position.set(X_OFFSET + 550, 950, -390);
        addObj(cliff2);

        var cliff3 = makeMesh(new THREE.BoxGeometry(200, 600, 60), 0x5a4a38);
        cliff3.position.set(X_OFFSET + 180, 1100, -400);
        addObj(cliff3);

        // Observatory ruins at top — small boxes
        var obs1 = makeMesh(new THREE.BoxGeometry(40, 25, 35), 0x888888);
        obs1.position.set(X_OFFSET + 460, 1945, -840);
        addObj(obs1);

        var obs2 = makeMesh(new THREE.BoxGeometry(25, 20, 25), 0x777777);
        obs2.position.set(X_OFFSET + 500, 1940, -870);
        addObj(obs2);

        var obsWall = makeMesh(new THREE.BoxGeometry(70, 15, 8), 0x999999);
        obsWall.position.set(X_OFFSET + 470, 1940, -855);
        addObj(obsWall);

        // Tourist path — series of flat boxes winding up south side
        var pathSteps = [
            [X_OFFSET + 300, 300, -200],
            [X_OFFSET + 320, 450, -350],
            [X_OFFSET + 350, 600, -480],
            [X_OFFSET + 370, 750, -590],
            [X_OFFSET + 390, 900, -680],
            [X_OFFSET + 400, 1050, -740],
            [X_OFFSET + 420, 1200, -790],
            [X_OFFSET + 435, 1350, -820]
        ];
        for (var pi = 0; pi < pathSteps.length; pi++) {
            var pathSeg = makeMesh(new THREE.BoxGeometry(60, 8, 80), 0xc8b89a);
            pathSeg.position.set(pathSteps[pi][0], pathSteps[pi][1], pathSteps[pi][2]);
            addObj(pathSeg);
        }

        // Snow cap on summit
        var snow = makeMesh(new THREE.BoxGeometry(360, 30, 310), 0xffffff);
        snow.position.set(X_OFFSET + 450, 1940, -855);
        addObj(snow);

        // Snowfields on upper slopes
        var snowSlope1 = makeMesh(new THREE.BoxGeometry(200, 20, 200), 0xeeeeee);
        snowSlope1.position.set(X_OFFSET + 480, 1730, -870);
        addObj(snowSlope1);

        var snowSlope2 = makeMesh(new THREE.BoxGeometry(150, 20, 150), 0xeeeeee);
        snowSlope2.position.set(X_OFFSET + 350, 1720, -820);
        addObj(snowSlope2);
    }

    function buildJacobiteViaduct() {
        // Glenfinnan Viaduct — 21 curved arches landmark
        // Main viaduct deck spanning in an arc
        var viaductX = X_OFFSET - 600;
        var viaductZ = 200;
        var viaductY = 120;

        // Deck — long curved box approximated by segments
        var numArches = 21;
        var archSpan = 35;
        var radius = 400;

        for (var ai = 0; ai < numArches; ai++) {
            var angle = (ai / (numArches - 1)) * Math.PI * 0.5 - Math.PI * 0.25;
            var ax = viaductX + Math.sin(angle) * radius;
            var az = viaductZ + Math.cos(angle) * radius - radius;

            // Arch pier — tall thin cylinder
            var pier = makeMesh(new THREE.CylinderGeometry(5, 7, viaductY + 10, 6), 0xc8b89a);
            pier.position.set(ax, (viaductY + 10) / 2, az);
            addObj(pier);

            // Arch opening — smaller box cut-out represented by dark box behind pier
            var archFill = makeMesh(new THREE.BoxGeometry(archSpan - 6, viaductY - 20, 8), 0xd4c4a8);
            archFill.position.set(ax, viaductY * 0.4, az - 4);
            addObj(archFill);

            // Deck section above arch
            var deck = makeMesh(new THREE.BoxGeometry(archSpan + 2, 12, 22), 0xbcac90);
            deck.position.set(ax, viaductY + 6, az);
            addObj(deck);
        }

        // Viaduct approach embankments
        var embankL = makeMesh(new THREE.BoxGeometry(80, 80, 60), 0x6a7a55);
        embankL.position.set(viaductX - 340, 40, viaductZ - 30);
        addObj(embankL);

        var embankR = makeMesh(new THREE.BoxGeometry(80, 80, 60), 0x6a7a55);
        embankR.position.set(viaductX + 340, 40, viaductZ - 30);
        addObj(embankR);

        // Steam locomotive body
        var locoX = viaductX - 80;
        var locoZ = viaductZ - 150;
        var locoY = viaductY + 12;

        var locoBody = makeMesh(new THREE.BoxGeometry(55, 22, 16), 0x222222);
        locoBody.position.set(locoX, locoY + 11, locoZ);
        addObj(locoBody);

        // Boiler — cylinder on top
        var boiler = makeMesh(new THREE.CylinderGeometry(8, 8, 50, 8), 0x333333);
        boiler.rotation.z = Math.PI / 2;
        boiler.position.set(locoX - 2, locoY + 20, locoZ);
        addObj(boiler);

        // Smokestack
        var stack = makeMesh(new THREE.CylinderGeometry(3, 4, 15, 6), 0x111111);
        stack.position.set(locoX - 20, locoY + 33, locoZ);
        addObj(stack);

        // Steam puff — sphere
        var steam = makeMesh(new THREE.SphereGeometry(8, 6, 6), 0xdddddd);
        steam.position.set(locoX - 20, locoY + 46, locoZ);
        addObj(steam);

        // Cab
        var cab = makeMesh(new THREE.BoxGeometry(16, 18, 16), 0x2a2a2a);
        cab.position.set(locoX + 22, locoY + 20, locoZ);
        addObj(cab);

        // Wheels — cylinders
        var wheelPositions = [
            [locoX - 18, locoY + 4, locoZ - 8],
            [locoX - 18, locoY + 4, locoZ + 8],
            [locoX + 2, locoY + 4, locoZ - 8],
            [locoX + 2, locoY + 4, locoZ + 8],
            [locoX + 20, locoY + 4, locoZ - 8],
            [locoX + 20, locoY + 4, locoZ + 8]
        ];
        for (var wi = 0; wi < wheelPositions.length; wi++) {
            var wheel = makeMesh(new THREE.CylinderGeometry(5, 5, 3, 8), 0x444444);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(wheelPositions[wi][0], wheelPositions[wi][1], wheelPositions[wi][2]);
            addObj(wheel);
        }

        // Passenger cars — 3 cars
        for (var ci = 0; ci < 3; ci++) {
            var carX = locoX + 75 + ci * 65;
            var car = makeMesh(new THREE.BoxGeometry(60, 18, 16), 0x8b0000);
            car.position.set(carX, locoY + 9, locoZ);
            addObj(car);

            // Car roof
            var carRoof = makeMesh(new THREE.BoxGeometry(62, 6, 18), 0x6b0000);
            carRoof.position.set(carX, locoY + 21, locoZ);
            addObj(carRoof);

            // Car windows — row of small boxes
            for (var wj = 0; wj < 4; wj++) {
                var win = makeMesh(new THREE.BoxGeometry(8, 6, 2), 0x88aacc);
                win.position.set(carX - 20 + wj * 14, locoY + 12, locoZ - 9);
                addObj(win);
            }
        }
    }

    function buildGlenfinnanMonument() {
        var monX = X_OFFSET - 900;
        var monZ = 500;

        // Circular base
        var base = makeMesh(new THREE.CylinderGeometry(25, 30, 12, 16), 0xd4c4a0);
        base.position.set(monX, 6, monZ);
        addObj(base);

        // Monument column
        var column = makeMesh(new THREE.CylinderGeometry(6, 9, 120, 12), 0xc8b88a);
        column.position.set(monX, 66, monZ);
        addObj(column);

        // Capital on top of column
        var capital = makeMesh(new THREE.CylinderGeometry(10, 6, 10, 12), 0xbcac7a);
        capital.position.set(monX, 127, monZ);
        addObj(capital);

        // Kilted Highland warrior — body (cylinder torso)
        var torso = makeMesh(new THREE.CylinderGeometry(4, 5, 14, 8), 0x4a6a4a);
        torso.position.set(monX, 144, monZ);
        addObj(torso);

        // Head (sphere)
        var head = makeMesh(new THREE.SphereGeometry(4, 8, 6), 0xc8a07a);
        head.position.set(monX, 156, monZ);
        addObj(head);

        // Kilt (cone)
        var kilt = makeMesh(new THREE.ConeGeometry(6, 10, 8), 0x2a4a8a);
        kilt.position.set(monX, 135, monZ);
        addObj(kilt);

        // Raised arm (box)
        var arm = makeMesh(new THREE.BoxGeometry(3, 16, 3), 0x4a6a4a);
        arm.rotation.z = -Math.PI / 4;
        arm.position.set(monX + 9, 150, monZ);
        addObj(arm);

        // Sword (thin box)
        var sword = makeMesh(new THREE.BoxGeometry(1.5, 22, 1.5), 0xaaaaaa);
        sword.rotation.z = -Math.PI / 5;
        sword.position.set(monX + 16, 158, monZ);
        addObj(sword);

        // Loch Shiel — long thin water loch extending behind
        var loch = makeMesh(new THREE.BoxGeometry(120, 2, 1200), 0x1a4a7a);
        loch.position.set(monX, 0, monZ + 700);
        addObj(loch);

        // Loch shore hills
        var hill1 = makeMesh(new THREE.BoxGeometry(200, 180, 400), 0x3a5a30);
        hill1.position.set(monX - 180, 90, monZ + 400);
        addObj(hill1);

        var hill2 = makeMesh(new THREE.BoxGeometry(180, 160, 400), 0x4a6a40);
        hill2.position.set(monX + 170, 80, monZ + 500);
        addObj(hill2);
    }

    function buildLochLinnhe() {
        var lochX = X_OFFSET - 200;
        var lochZ = 800;

        // Main sea loch — large flat blue expanse
        var lochMain = makeMesh(new THREE.BoxGeometry(2400, 4, 600), 0x1a3a6a);
        lochMain.position.set(lochX, -2, lochZ);
        addObj(lochMain);

        // Tidal flats — shallower lighter areas
        var tidals = [
            [lochX - 900, 0, lochZ - 280, 400, 2, 60, 0x2a5a8a],
            [lochX + 900, 0, lochZ - 280, 350, 2, 60, 0x2a5a8a],
            [lochX, 0, lochZ + 280, 800, 2, 60, 0x2a5a8a]
        ];
        for (var ti = 0; ti < tidals.length; ti++) {
            var tidal = makeMesh(new THREE.BoxGeometry(tidals[ti][3], tidals[ti][4], tidals[ti][5]), tidals[ti][6]);
            tidal.position.set(tidals[ti][0], tidals[ti][1], tidals[ti][2]);
            addObj(tidal);
        }

        // Fort William town shoreline
        var shore = makeMesh(new THREE.BoxGeometry(600, 6, 80), 0xd4c4a0);
        shore.position.set(lochX + 100, 3, lochZ - 340);
        addObj(shore);

        // Marine pier
        var pierBase = makeMesh(new THREE.BoxGeometry(16, 10, 200), 0x8a7a65);
        pierBase.position.set(lochX + 50, 5, lochZ - 240);
        addObj(pierBase);

        // Pier posts
        for (var pp = 0; pp < 6; pp++) {
            var post = makeMesh(new THREE.CylinderGeometry(2, 2, 14, 6), 0x6a5a45);
            post.position.set(lochX + 42 + pp * 6, 7, lochZ - 150 - pp * 28);
            addObj(post);
        }

        // Pier building/office
        var pierBuilding = makeMesh(new THREE.BoxGeometry(22, 16, 24), 0xccbbaa);
        pierBuilding.position.set(lochX + 50, 13, lochZ - 340);
        addObj(pierBuilding);

        var pierRoof = makeMesh(new THREE.BoxGeometry(24, 6, 26), 0x996644);
        pierRoof.position.set(lochX + 50, 24, lochZ - 340);
        addObj(pierRoof);

        // Ferry boat to Ardnamurchan
        var ferry = makeMesh(new THREE.BoxGeometry(60, 12, 22), 0xffffff);
        ferry.position.set(lochX - 300, 6, lochZ - 50);
        addObj(ferry);

        var ferryDeck = makeMesh(new THREE.BoxGeometry(62, 8, 24), 0xdddddd);
        ferryDeck.position.set(lochX - 300, 16, lochZ - 50);
        addObj(ferryDeck);

        var ferryCabin = makeMesh(new THREE.BoxGeometry(30, 12, 20), 0xaaaacc);
        ferryCabin.position.set(lochX - 310, 26, lochZ - 50);
        addObj(ferryCabin);

        var ferryFunnel = makeMesh(new THREE.CylinderGeometry(3, 4, 14, 8), 0xcc3322);
        ferryFunnel.position.set(lochX - 295, 34, lochZ - 50);
        addObj(ferryFunnel);

        // Far shore mountains
        var farShore1 = makeMesh(new THREE.BoxGeometry(800, 400, 300), 0x5a6a4a);
        farShore1.position.set(lochX - 400, 200, lochZ + 500);
        addObj(farShore1);

        var farShore2 = makeMesh(new THREE.BoxGeometry(600, 350, 300), 0x6a7a5a);
        farShore2.position.set(lochX + 600, 175, lochZ + 480);
        addObj(farShore2);

        // Loch water shimmer patches
        var shimmer1 = makeMesh(new THREE.BoxGeometry(300, 1, 200), 0x2a5a9a);
        shimmer1.position.set(lochX - 500, 0, lochZ + 100);
        addObj(shimmer1);

        var shimmer2 = makeMesh(new THREE.BoxGeometry(250, 1, 180), 0x2a5a9a);
        shimmer2.position.set(lochX + 400, 0, lochZ + 50);
        addObj(shimmer2);
    }

    function buildAonachMorGondola() {
        var aonachX = X_OFFSET + 800;
        var aonachZ = -400;

        // Aonach Mor hill mass
        var hill = makeMesh(new THREE.BoxGeometry(700, 600, 600), 0x8a9a7a);
        hill.position.set(aonachX + 100, 300, aonachZ - 200);
        addObj(hill);

        var hillUpper = makeMesh(new THREE.BoxGeometry(500, 350, 450), 0x7a8a6a);
        hillUpper.position.set(aonachX + 110, 775, aonachZ - 210);
        addObj(hillUpper);

        // Base gondola station
        var baseStation = makeMesh(new THREE.BoxGeometry(50, 20, 40), 0xaaaaaa);
        baseStation.position.set(aonachX, 10, aonachZ);
        addObj(baseStation);

        var baseRoof = makeMesh(new THREE.BoxGeometry(54, 8, 44), 0x888888);
        baseRoof.position.set(aonachX, 24, aonachZ);
        addObj(baseRoof);

        // Top gondola station
        var topStation = makeMesh(new THREE.BoxGeometry(45, 18, 38), 0x999999);
        topStation.position.set(aonachX + 180, 615, aonachZ - 220);
        addObj(topStation);

        var topRoof = makeMesh(new THREE.BoxGeometry(48, 7, 40), 0x777777);
        topRoof.position.set(aonachX + 180, 628, aonachZ - 220);
        addObj(topRoof);

        // Cable towers — cylinder poles
        var towerPositions = [
            [aonachX + 40, 0, aonachZ - 40, 80],
            [aonachX + 80, 0, aonachZ - 80, 100],
            [aonachX + 120, 0, aonachZ - 130, 120],
            [aonachX + 155, 0, aonachZ - 180, 110]
        ];

        for (var ti = 0; ti < towerPositions.length; ti++) {
            var towerH = towerPositions[ti][3];
            var tower = makeMesh(new THREE.CylinderGeometry(3, 4, towerH, 8), 0x666666);
            tower.position.set(towerPositions[ti][0], towerH / 2, towerPositions[ti][2]);
            addObj(tower);

            // Cross arm on tower
            var arm = makeMesh(new THREE.BoxGeometry(20, 3, 3), 0x555555);
            arm.position.set(towerPositions[ti][0], towerH + 1.5, towerPositions[ti][2]);
            addObj(arm);
        }

        // Cable lines using LineSegments
        var cableGeo = new THREE.BufferGeometry();
        var cableVerts = [];

        // Left cable
        cableVerts.push(aonachX, 20, aonachZ);
        cableVerts.push(aonachX + 40, 81, aonachZ - 40);
        cableVerts.push(aonachX + 40, 81, aonachZ - 40);
        cableVerts.push(aonachX + 80, 101, aonachZ - 80);
        cableVerts.push(aonachX + 80, 101, aonachZ - 80);
        cableVerts.push(aonachX + 120, 121, aonachZ - 130);
        cableVerts.push(aonachX + 120, 121, aonachZ - 130);
        cableVerts.push(aonachX + 155, 111, aonachZ - 180);
        cableVerts.push(aonachX + 155, 111, aonachZ - 180);
        cableVerts.push(aonachX + 180, 615, aonachZ - 220);

        cableGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cableVerts), 3));
        var cableLines = new THREE.LineSegments(cableGeo, new THREE.MeshLambertMaterial({ color: 0x333333 }));
        scene.add(cableLines);
        objects.push(cableLines);

        // Gondola cars on cable — small boxes
        var gondolaPositions = [
            [aonachX + 50, 95, aonachZ - 55],
            [aonachX + 90, 115, aonachZ - 95],
            [aonachX + 130, 135, aonachZ - 145]
        ];
        for (var gi = 0; gi < gondolaPositions.length; gi++) {
            var gondola = makeMesh(new THREE.BoxGeometry(10, 12, 8), 0xcc4400);
            gondola.position.set(gondolaPositions[gi][0], gondolaPositions[gi][1], gondolaPositions[gi][2]);
            addObj(gondola);

            // Gondola roof
            var gondRoof = makeMesh(new THREE.BoxGeometry(11, 3, 9), 0xaa3300);
            gondRoof.position.set(gondolaPositions[gi][0], gondolaPositions[gi][1] + 7.5, gondolaPositions[gi][2]);
            addObj(gondRoof);
        }

        // Ski runs — white bands on hill
        var skiRunDefs = [
            [aonachX + 60, 400, aonachZ - 80, 30, 8, 300],
            [aonachX + 130, 420, aonachZ - 130, 30, 8, 280],
            [aonachX + 200, 390, aonachZ - 100, 25, 8, 260]
        ];
        for (var si = 0; si < skiRunDefs.length; si++) {
            var run = makeMesh(new THREE.BoxGeometry(skiRunDefs[si][3], skiRunDefs[si][4], skiRunDefs[si][5]), 0xeeeeff);
            run.position.set(skiRunDefs[si][0], skiRunDefs[si][1], skiRunDefs[si][2]);
            addObj(run);
        }

        // Car park at base
        var carpark = makeMesh(new THREE.BoxGeometry(120, 3, 80), 0x888880);
        carpark.position.set(aonachX - 80, 1.5, aonachZ + 60);
        addObj(carpark);
    }

    function buildFortWilliamTown() {
        var townX = X_OFFSET - 100;
        var townZ = 600;

        // High Street — ground plane
        var street = makeMesh(new THREE.BoxGeometry(400, 3, 30), 0x7a7a7a);
        street.position.set(townX, 1.5, townZ - 280);
        addObj(street);

        // High Street shops — row of varied boxes
        var shopDefs = [
            [townX - 160, 0, townZ - 300, 30, 28, 22, 0xd4b896],
            [townX - 125, 0, townZ - 300, 26, 22, 22, 0xc8a882],
            [townX - 92, 0, townZ - 300, 28, 30, 22, 0xddc0a4],
            [townX - 58, 0, townZ - 300, 24, 24, 22, 0xcc9966],
            [townX - 28, 0, townZ - 300, 26, 20, 22, 0xd4b08c],
            [townX + 4, 0, townZ - 300, 30, 26, 22, 0xbbaa88],
            [townX + 38, 0, townZ - 300, 28, 22, 22, 0xddcc99],
            [townX + 70, 0, townZ - 300, 24, 28, 22, 0xccbb88],
            [townX + 100, 0, townZ - 300, 28, 24, 22, 0xd4c090],
            [townX + 132, 0, townZ - 300, 26, 20, 22, 0xbba87a]
        ];
        for (var si = 0; si < shopDefs.length; si++) {
            var shop = makeMesh(new THREE.BoxGeometry(shopDefs[si][3], shopDefs[si][4], shopDefs[si][5]), shopDefs[si][6]);
            shop.position.set(shopDefs[si][0], shopDefs[si][1] + shopDefs[si][4] / 2, shopDefs[si][2]);
            addObj(shop);

            // Shop roof
            var shopRoof = makeMesh(new THREE.BoxGeometry(shopDefs[si][3] + 2, 5, shopDefs[si][5] + 2), 0x8a6644);
            shopRoof.position.set(shopDefs[si][0], shopDefs[si][4] + 2.5, shopDefs[si][2]);
            addObj(shopRoof);
        }

        // Ben Nevis Distillery
        var distX = townX + 220;
        var distZ = townZ - 290;

        var distMain = makeMesh(new THREE.BoxGeometry(50, 35, 40), 0xccbb99);
        distMain.position.set(distX, 17.5, distZ);
        addObj(distMain);

        var distRoof = makeMesh(new THREE.BoxGeometry(52, 8, 42), 0x774422);
        distRoof.position.set(distX, 39, distZ);
        addObj(distRoof);

        // Pagoda kiln — conical roof with cylinder
        var kilnBase = makeMesh(new THREE.CylinderGeometry(8, 9, 30, 8), 0xaaa088);
        kilnBase.position.set(distX - 15, 15, distZ - 18);
        addObj(kilnBase);

        var kilnCone = makeMesh(new THREE.ConeGeometry(10, 14, 8), 0x665533);
        kilnCone.position.set(distX - 15, 37, distZ - 18);
        addObj(kilnCone);

        var kilnBase2 = makeMesh(new THREE.CylinderGeometry(7, 8, 30, 8), 0xaaa088);
        kilnBase2.position.set(distX + 15, 15, distZ - 18);
        addObj(kilnBase2);

        var kilnCone2 = makeMesh(new THREE.ConeGeometry(9, 13, 8), 0x665533);
        kilnCone2.position.set(distX + 15, 37, distZ - 18);
        addObj(kilnCone2);

        // West Highland Museum
        var museumX = townX - 220;
        var museumZ = townZ - 295;

        var museum = makeMesh(new THREE.BoxGeometry(55, 30, 42), 0xddccaa);
        museum.position.set(museumX, 15, museumZ);
        addObj(museum);

        var museumRoof = makeMesh(new THREE.BoxGeometry(57, 7, 44), 0x887766);
        museumRoof.position.set(museumX, 33.5, museumZ);
        addObj(museumRoof);

        // Museum entrance columns
        var col1 = makeMesh(new THREE.CylinderGeometry(2, 2, 24, 6), 0xeeddcc);
        col1.position.set(museumX - 12, 12, museumZ - 22);
        addObj(col1);

        var col2 = makeMesh(new THREE.CylinderGeometry(2, 2, 24, 6), 0xeeddcc);
        col2.position.set(museumX, 12, museumZ - 22);
        addObj(col2);

        var col3 = makeMesh(new THREE.CylinderGeometry(2, 2, 24, 6), 0xeeddcc);
        col3.position.set(museumX + 12, 12, museumZ - 22);
        addObj(col3);

        // War Memorial — obelisk style
        var memX = townX;
        var memZ = townZ - 230;

        var memBase = makeMesh(new THREE.BoxGeometry(18, 6, 18), 0xcccccc);
        memBase.position.set(memX, 3, memZ);
        addObj(memBase);

        var memStep = makeMesh(new THREE.BoxGeometry(14, 5, 14), 0xbbbbbb);
        memStep.position.set(memX, 8.5, memZ);
        addObj(memStep);

        var memObelisk = makeMesh(new THREE.BoxGeometry(7, 50, 7), 0xaaaaaa);
        memObelisk.position.set(memX, 36, memZ);
        addObj(memObelisk);

        var memPeak = makeMesh(new THREE.ConeGeometry(5, 10, 4), 0x999999);
        memPeak.position.set(memX, 66, memZ);
        addObj(memPeak);

        // Surrounding greenery / park
        var park = makeMesh(new THREE.BoxGeometry(60, 2, 60), 0x3a7a3a);
        park.position.set(memX, 1, memZ);
        addObj(park);

        // Trees around memorial
        var treePos = [
            [memX - 22, memZ - 22],
            [memX + 22, memZ - 22],
            [memX - 22, memZ + 22],
            [memX + 22, memZ + 22]
        ];
        for (var trI = 0; trI < treePos.length; trI++) {
            var trunk = makeMesh(new THREE.CylinderGeometry(1.5, 2, 10, 6), 0x5a3a1a);
            trunk.position.set(treePos[trI][0], 5, treePos[trI][1]);
            addObj(trunk);

            var crown = makeMesh(new THREE.ConeGeometry(6, 14, 6), 0x2a6a2a);
            crown.position.set(treePos[trI][0], 17, treePos[trI][1]);
            addObj(crown);
        }

        // Ground terrain around town
        var ground = makeMesh(new THREE.BoxGeometry(800, 4, 400), 0x5a7a4a);
        ground.position.set(townX, -2, townZ - 200);
        addObj(ground);
    }

    function update(delta) {
        // No per-frame animation needed for static environment
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
