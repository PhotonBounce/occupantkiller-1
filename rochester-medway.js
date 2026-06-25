window.RochesterMedway = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X = 10840;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function placeMesh(mesh, x, y, z) {
        mesh.position.set(x, y, z);
        addMesh(mesh);
    }

    function buildCastle() {
        var keepColor = 0x8B7355;
        var stoneColor = 0x9E8B6E;
        var towerColor = 0x7A6645;

        // Main keep body — 12x12 base, 30 high
        var keepGeo = new THREE.BoxGeometry(12, 30, 12);
        var keep = makeMesh(keepGeo, keepColor);
        placeMesh(keep, X + 0, 15, -20);

        // Keep top parapet
        var parapetGeo = new THREE.BoxGeometry(13, 2, 13);
        var parapet = makeMesh(parapetGeo, keepColor);
        placeMesh(parapet, X + 0, 31, -20);

        // Corner turrets (4)
        var turretPositions = [
            [X - 7, -20],
            [X + 7, -20],
            [X - 7, -33],
            [X + 7, -33]
        ];
        for (var ti = 0; ti < turretPositions.length; ti++) {
            var tGeo = new THREE.CylinderGeometry(1.8, 2, 34, 8);
            var turret = makeMesh(tGeo, towerColor);
            placeMesh(turret, turretPositions[ti][0], 17, turretPositions[ti][1]);

            var tCapGeo = new THREE.ConeGeometry(2.2, 4, 8);
            var tCap = makeMesh(tCapGeo, 0x5C4A30);
            placeMesh(tCap, turretPositions[ti][0], 36, turretPositions[ti][1]);
        }

        // Forebuilding (entrance structure on south face)
        var foreGeo = new THREE.BoxGeometry(6, 18, 5);
        var fore = makeMesh(foreGeo, stoneColor);
        placeMesh(fore, X + 0, 9, -14);

        // Forebuilding stair turret
        var fTurretGeo = new THREE.CylinderGeometry(1.5, 1.8, 20, 8);
        var fTurret = makeMesh(fTurretGeo, towerColor);
        placeMesh(fTurret, X - 4, 10, -12);

        // Great hall windows suggestion — small protruding blocks
        for (var wi = 0; wi < 3; wi++) {
            var winGeo = new THREE.BoxGeometry(1.5, 2.5, 0.5);
            var win = makeMesh(winGeo, 0x6B5A3E);
            placeMesh(win, X - 3 + wi * 3, 22, -14.3);
        }

        // Curtain wall — north side
        var cwNGeo = new THREE.BoxGeometry(40, 8, 2);
        var cwN = makeMesh(cwNGeo, stoneColor);
        placeMesh(cwN, X + 0, 4, -45);

        // Curtain wall — east side
        var cwEGeo = new THREE.BoxGeometry(2, 8, 30);
        var cwE = makeMesh(cwEGeo, stoneColor);
        placeMesh(cwE, X + 20, 4, -30);

        // Curtain wall — west side
        var cwWGeo = new THREE.BoxGeometry(2, 8, 30);
        var cwW = makeMesh(cwWGeo, stoneColor);
        placeMesh(cwW, X - 20, 4, -30);

        // Curtain wall — south side
        var cwSGeo = new THREE.BoxGeometry(40, 8, 2);
        var cwS = makeMesh(cwSGeo, stoneColor);
        placeMesh(cwS, X + 0, 4, -15);

        // D-shaped mural tower on north curtain wall
        var dTowerGeo = new THREE.CylinderGeometry(5, 5.5, 12, 8, 1, false, 0, Math.PI);
        var dTower = makeMesh(dTowerGeo, towerColor);
        dTower.position.set(X + 8, 6, -45);
        addMesh(dTower);

        // D-tower cap
        var dCapGeo = new THREE.CylinderGeometry(0.5, 5.5, 3, 8);
        var dCap = makeMesh(dCapGeo, 0x5C4A30);
        placeMesh(dCap, X + 8, 13.5, -45);

        // Castle gatehouse
        var gateGeo = new THREE.BoxGeometry(8, 10, 6);
        var gate = makeMesh(gateGeo, stoneColor);
        placeMesh(gate, X + 0, 5, -13);

        var gateLeftGeo = new THREE.CylinderGeometry(2, 2.2, 12, 8);
        var gateLeft = makeMesh(gateLeftGeo, towerColor);
        placeMesh(gateLeft, X - 5, 6, -13);

        var gateRightGeo = new THREE.CylinderGeometry(2, 2.2, 12, 8);
        var gateRight = makeMesh(gateRightGeo, towerColor);
        placeMesh(gateRight, X + 5, 6, -13);
    }

    function buildCathedral() {
        var navColor = 0x9E8B6E;
        var towerColor = 0x8B7A5A;
        var roofColor = 0x5A7A5A;

        // Norman nave — long and wide
        var naveGeo = new THREE.BoxGeometry(14, 14, 55);
        var nave = makeMesh(naveGeo, navColor);
        placeMesh(nave, X + 55, 7, -28);

        // Nave roof ridge
        var naveRoofGeo = new THREE.BoxGeometry(4, 6, 55);
        var naveRoof = makeMesh(naveRoofGeo, roofColor);
        placeMesh(naveRoof, X + 55, 17, -28);

        // Nave roof slope left
        var nRoofLGeo = new THREE.BoxGeometry(6, 1, 55);
        var nRoofL = makeMesh(nRoofLGeo, roofColor);
        nRoofL.rotation.z = Math.PI / 6;
        placeMesh(nRoofL, X + 59, 14, -28);

        // Nave roof slope right
        var nRoofRGeo = new THREE.BoxGeometry(6, 1, 55);
        var nRoofR = makeMesh(nRoofRGeo, roofColor);
        nRoofR.rotation.z = -Math.PI / 6;
        placeMesh(nRoofR, X + 51, 14, -28);

        // West front facade
        var westGeo = new THREE.BoxGeometry(16, 16, 2);
        var west = makeMesh(westGeo, navColor);
        placeMesh(west, X + 55, 8, -55.5);

        // Twin west towers
        var wtL = new THREE.BoxGeometry(5, 28, 5);
        var wTowerL = makeMesh(wtL, towerColor);
        placeMesh(wTowerL, X + 49, 14, -57);

        var wtR = new THREE.BoxGeometry(5, 28, 5);
        var wTowerR = makeMesh(wtR, towerColor);
        placeMesh(wTowerR, X + 61, 14, -57);

        // West tower spires
        var spLGeo = new THREE.ConeGeometry(3.5, 10, 4);
        var spL = makeMesh(spLGeo, roofColor);
        placeMesh(spL, X + 49, 33, -57);

        var spRGeo = new THREE.ConeGeometry(3.5, 10, 4);
        var spR = makeMesh(spRGeo, roofColor);
        placeMesh(spR, X + 61, 33, -57);

        // Central crossing tower
        var crossGeo = new THREE.BoxGeometry(10, 22, 10);
        var crossTower = makeMesh(crossGeo, towerColor);
        placeMesh(crossTower, X + 55, 11, -22);

        // Central tower parapet
        var crossParGeo = new THREE.BoxGeometry(11, 2.5, 11);
        var crossPar = makeMesh(crossParGeo, towerColor);
        placeMesh(crossPar, X + 55, 23, -22);

        // Transept north
        var transNGeo = new THREE.BoxGeometry(12, 14, 14);
        var transN = makeMesh(transNGeo, navColor);
        placeMesh(transN, X + 48, 7, -22);

        // Transept south
        var transSGeo = new THREE.BoxGeometry(12, 14, 14);
        var transS = makeMesh(transSGeo, navColor);
        placeMesh(transS, X + 62, 7, -22);

        // Chancel / choir
        var chanGeo = new THREE.BoxGeometry(12, 12, 22);
        var chancel = makeMesh(chanGeo, navColor);
        placeMesh(chancel, X + 55, 6, -1);

        // Chancel roof
        var chanRoofGeo = new THREE.BoxGeometry(3, 5, 22);
        var chanRoof = makeMesh(chanRoofGeo, roofColor);
        placeMesh(chanRoof, X + 55, 14.5, -1);

        // Chapter house — octagonal suggestion (box approximation)
        var chGeo = new THREE.CylinderGeometry(7, 7, 10, 8);
        var chHouse = makeMesh(chGeo, navColor);
        placeMesh(chHouse, X + 44, 5, -5);

        var chRoofGeo = new THREE.ConeGeometry(8, 6, 8);
        var chRoof = makeMesh(chRoofGeo, roofColor);
        placeMesh(chRoof, X + 44, 13, -5);

        // Cloisters suggestion — low arcade walls forming a square
        var cloisPositions = [
            { geo: new THREE.BoxGeometry(18, 4, 1.5), x: X + 47, z: -12 },
            { geo: new THREE.BoxGeometry(18, 4, 1.5), x: X + 47, z: -2 },
            { geo: new THREE.BoxGeometry(1.5, 4, 12), x: X + 38.5, z: -7 },
            { geo: new THREE.BoxGeometry(1.5, 4, 12), x: X + 55.5, z: -7 }
        ];
        for (var ci = 0; ci < cloisPositions.length; ci++) {
            var cl = makeMesh(cloisPositions[ci].geo, 0xA08060);
            placeMesh(cl, cloisPositions[ci].x, 2, cloisPositions[ci].z);
        }
    }

    function buildMedwayRiver() {
        var waterColor = 0x2E5E8E;
        var sandColor = 0xC8B888;

        // River Medway — wide tidal river running roughly east-west
        var riverGeo = new THREE.BoxGeometry(200, 0.3, 40);
        var river = makeMesh(riverGeo, waterColor);
        placeMesh(river, X + 60, 0.15, 30);

        // River banks — mudflats / tidal
        var bankNGeo = new THREE.BoxGeometry(200, 0.4, 8);
        var bankN = makeMesh(bankNGeo, sandColor);
        placeMesh(bankN, X + 60, 0.2, 10);

        var bankSGeo = new THREE.BoxGeometry(200, 0.4, 8);
        var bankS = makeMesh(bankSGeo, sandColor);
        placeMesh(bankS, X + 60, 0.2, 50);

        // Rochester Bridge — stone arch road bridge
        var bridgeDeckGeo = new THREE.BoxGeometry(44, 1.5, 6);
        var bridgeDeck = makeMesh(bridgeDeckGeo, 0x888888);
        placeMesh(bridgeDeck, X + 40, 3, 30);

        // Bridge piers
        for (var pi = 0; pi < 4; pi++) {
            var pierGeo = new THREE.BoxGeometry(3, 5, 6);
            var pier = makeMesh(pierGeo, 0x777777);
            placeMesh(pier, X + 22 + pi * 11, 2, 30);
        }

        // Bridge arches suggestion — slightly raised blocks between piers
        for (var ai = 0; ai < 3; ai++) {
            var archGeo = new THREE.BoxGeometry(8, 2, 5);
            var arch = makeMesh(archGeo, 0x999999);
            placeMesh(arch, X + 27.5 + ai * 11, 4, 30);
        }

        // Bridge parapets
        var bParNGeo = new THREE.BoxGeometry(44, 1, 0.5);
        var bParN = makeMesh(bParNGeo, 0x888888);
        placeMesh(bParN, X + 40, 4.5, 27.2);

        var bParSGeo = new THREE.BoxGeometry(44, 1, 0.5);
        var bParS = makeMesh(bParSGeo, 0x888888);
        placeMesh(bParS, X + 40, 4.5, 32.8);

        // M2 road bridge — modern cable-stay
        // Deck
        var m2DeckGeo = new THREE.BoxGeometry(60, 1, 8);
        var m2Deck = makeMesh(m2DeckGeo, 0xAAAAAA);
        placeMesh(m2Deck, X + 100, 5, 30);

        // Pylon towers (2 — concrete H-frame style)
        var pylonLGeo = new THREE.BoxGeometry(2, 30, 2);
        var pylonL = makeMesh(pylonLGeo, 0xCCCCCC);
        placeMesh(pylonL, X + 88, 15, 28);

        var pylonL2Geo = new THREE.BoxGeometry(2, 30, 2);
        var pylonL2 = makeMesh(pylonL2Geo, 0xCCCCCC);
        placeMesh(pylonL2, X + 88, 15, 32);

        var pylonCLGeo = new THREE.BoxGeometry(2, 2, 6);
        var pylonCL = makeMesh(pylonCLGeo, 0xCCCCCC);
        placeMesh(pylonCL, X + 88, 25, 30);

        var pylonRGeo = new THREE.BoxGeometry(2, 30, 2);
        var pylonR = makeMesh(pylonRGeo, 0xCCCCCC);
        placeMesh(pylonR, X + 112, 15, 28);

        var pylonR2Geo = new THREE.BoxGeometry(2, 30, 2);
        var pylonR2 = makeMesh(pylonR2Geo, 0xCCCCCC);
        placeMesh(pylonR2, X + 112, 15, 32);

        var pylonCRGeo = new THREE.BoxGeometry(2, 2, 6);
        var pylonCR = makeMesh(pylonCRGeo, 0xCCCCCC);
        placeMesh(pylonCR, X + 112, 25, 30);

        // M2 bridge cable stays — LineSegments
        var cablePoints = [];
        // Left pylon cables
        cablePoints.push(X + 88, 30, 30);  cablePoints.push(X + 70, 5, 30);
        cablePoints.push(X + 88, 30, 30);  cablePoints.push(X + 75, 5, 30);
        cablePoints.push(X + 88, 30, 30);  cablePoints.push(X + 80, 5, 30);
        cablePoints.push(X + 88, 30, 30);  cablePoints.push(X + 85, 5, 30);
        cablePoints.push(X + 88, 30, 30);  cablePoints.push(X + 93, 5, 30);
        cablePoints.push(X + 88, 30, 30);  cablePoints.push(X + 98, 5, 30);
        // Right pylon cables
        cablePoints.push(X + 112, 30, 30); cablePoints.push(X + 102, 5, 30);
        cablePoints.push(X + 112, 30, 30); cablePoints.push(X + 107, 5, 30);
        cablePoints.push(X + 112, 30, 30); cablePoints.push(X + 117, 5, 30);
        cablePoints.push(X + 112, 30, 30); cablePoints.push(X + 122, 5, 30);
        cablePoints.push(X + 112, 30, 30); cablePoints.push(X + 127, 5, 30);
        cablePoints.push(X + 112, 30, 30); cablePoints.push(X + 132, 5, 30);

        var cableGeo = new THREE.BufferGeometry();
        cableGeo.setAttribute('position', new THREE.Float32BufferAttribute(cablePoints, 3));
        var cableMat = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
        var cables = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cables);
        objects.push(cables);
    }

    function buildHighStreet() {
        var brickColor = 0x8B5E3C;
        var plasterColor = 0xE8D8B8;
        var timberColor = 0x5C3A1E;
        var roofColor = 0x8B3A3A;
        var slateColor = 0x555566;

        // High Street runs along z = -60 to -100
        // Ground plane / road surface
        var roadGeo = new THREE.BoxGeometry(6, 0.2, 60);
        var road = makeMesh(roadGeo, 0x444444);
        placeMesh(road, X + 30, 0.1, -80);

        // Pavement
        var pavNGeo = new THREE.BoxGeometry(3, 0.15, 60);
        var pavN = makeMesh(pavNGeo, 0x999988);
        placeMesh(pavN, X + 34.5, 0.07, -80);

        var pavSGeo = new THREE.BoxGeometry(3, 0.15, 60);
        var pavS = makeMesh(pavSGeo, 0x999988);
        placeMesh(pavS, X + 25.5, 0.07, -80);

        // Bull Hotel — large coaching inn (3 storeys, wide facade)
        var bullGeo = new THREE.BoxGeometry(14, 12, 8);
        var bull = makeMesh(bullGeo, plasterColor);
        placeMesh(bull, X + 28, 6, -65);

        var bullRoofGeo = new THREE.BoxGeometry(14.5, 3, 8.5);
        var bullRoof = makeMesh(bullRoofGeo, slateColor);
        placeMesh(bullRoof, X + 28, 13.5, -65);

        // Bull Hotel sign fascia
        var bullFasGeo = new THREE.BoxGeometry(10, 1.5, 0.3);
        var bullFas = makeMesh(bullFasGeo, 0x8B0000);
        placeMesh(bullFas, X + 28, 8, -61.1);

        // Bull Hotel archway (coach entrance)
        var archLGeo = new THREE.BoxGeometry(1, 6, 8);
        var archL = makeMesh(archLGeo, brickColor);
        placeMesh(archL, X + 22.5, 3, -65);

        var archRGeo = new THREE.BoxGeometry(1, 6, 8);
        var archR = makeMesh(archRGeo, brickColor);
        placeMesh(archR, X + 25.5, 3, -65);

        var archTopGeo = new THREE.BoxGeometry(3, 1.5, 8);
        var archTop = makeMesh(archTopGeo, brickColor);
        placeMesh(archTop, X + 24, 6.5, -65);

        // Eastgate House — Tudor, distinctive red brick and timber
        var eastGeo = new THREE.BoxGeometry(12, 11, 7);
        var east = makeMesh(eastGeo, brickColor);
        placeMesh(east, X + 28, 5.5, -78);

        // Eastgate gables (3 Dutch gables)
        for (var gi = 0; gi < 3; gi++) {
            var gableGeo = new THREE.BoxGeometry(3, 4, 1);
            var gable = makeMesh(gableGeo, brickColor);
            placeMesh(gable, X + 23 + gi * 4, 13, -74.5);

            var gableCapGeo = new THREE.ConeGeometry(1.8, 2.5, 4);
            var gableCap = makeMesh(gableCapGeo, slateColor);
            placeMesh(gableCap, X + 23 + gi * 4, 16, -74.5);
        }

        // Eastgate timber framing suggestion — dark horizontal bands
        for (var tfi = 0; tfi < 3; tfi++) {
            var tfGeo = new THREE.BoxGeometry(12, 0.5, 0.3);
            var tf = makeMesh(tfGeo, timberColor);
            placeMesh(tf, X + 28, 3 + tfi * 3.5, -74.6);
        }

        // Corn Exchange — with dome
        var cornGeo = new THREE.BoxGeometry(10, 10, 9);
        var corn = makeMesh(cornGeo, plasterColor);
        placeMesh(corn, X + 28, 5, -90);

        var cornDrumGeo = new THREE.CylinderGeometry(3.5, 4, 3, 12);
        var cornDrum = makeMesh(cornDrumGeo, plasterColor);
        placeMesh(cornDrum, X + 28, 11.5, -90);

        var cornDomeGeo = new THREE.SphereGeometry(3.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var cornDome = makeMesh(cornDomeGeo, 0x6B8E6B);
        placeMesh(cornDome, X + 28, 13, -90);

        var cornLanternGeo = new THREE.CylinderGeometry(0.8, 1.2, 2, 8);
        var cornLantern = makeMesh(cornLanternGeo, plasterColor);
        placeMesh(cornLantern, X + 28, 17, -90);

        // Victorian commercial frontages — terrace of shops
        var shopColors = [0xB87A5E, 0xD4B896, 0x8B6655, 0xC8A87E, 0xA0785A];
        for (var si = 0; si < 5; si++) {
            var shopGeo = new THREE.BoxGeometry(5, 9, 7);
            var shop = makeMesh(shopGeo, shopColors[si]);
            placeMesh(shop, X + 23 + si * 5.5, 4.5, -100);

            var shopRGeo = new THREE.BoxGeometry(5.2, 2, 7.2);
            var shopR = makeMesh(shopRGeo, slateColor);
            placeMesh(shopR, X + 23 + si * 5.5, 10, -100);

            // Cornice
            var corniceGeo = new THREE.BoxGeometry(5.4, 0.8, 0.3);
            var cornice = makeMesh(corniceGeo, plasterColor);
            placeMesh(cornice, X + 23 + si * 5.5, 9.4, -96.6);
        }
    }

    function buildChathamDockyard() {
        var brickColor = 0x7A5540;
        var darkBrick = 0x5C3A28;
        var slateColor = 0x445566;
        var concreteColor = 0xAAAAAA;

        // View across river — dockyard on south bank
        var dockyardBase = X + 60;

        // Dry docks — rectangular excavations (dark water/dock floor)
        for (var di = 0; di < 3; di++) {
            var dockGeo = new THREE.BoxGeometry(18, 1, 30);
            var dock = makeMesh(dockGeo, 0x1A3A5A);
            placeMesh(dock, dockyardBase + di * 22, -0.5, 75);

            // Dock walls
            var dockWallLGeo = new THREE.BoxGeometry(1, 4, 30);
            var dockWallL = makeMesh(dockWallLGeo, darkBrick);
            placeMesh(dockWallL, dockyardBase + di * 22 - 9.5, 2, 75);

            var dockWallRGeo = new THREE.BoxGeometry(1, 4, 30);
            var dockWallR = makeMesh(dockWallRGeo, darkBrick);
            placeMesh(dockWallR, dockyardBase + di * 22 + 9.5, 2, 75);

            var dockWallBGeo = new THREE.BoxGeometry(18, 4, 1);
            var dockWallB = makeMesh(dockWallBGeo, darkBrick);
            placeMesh(dockWallB, dockyardBase + di * 22, 2, 90.5);
        }

        // Rope Walk building — very long, narrow, single storey
        var ropeWalkGeo = new THREE.BoxGeometry(200, 6, 8);
        var ropeWalk = makeMesh(ropeWalkGeo, brickColor);
        placeMesh(ropeWalk, dockyardBase + 40, 3, 110);

        var ropeRoofGeo = new THREE.BoxGeometry(200, 1.5, 8.5);
        var ropeRoof = makeMesh(ropeRoofGeo, slateColor);
        placeMesh(ropeRoof, dockyardBase + 40, 6.75, 110);

        // Rope walk ridge
        var ropeRidgeGeo = new THREE.BoxGeometry(200, 1, 2);
        var ropeRidge = makeMesh(ropeRidgeGeo, darkBrick);
        placeMesh(ropeRidge, dockyardBase + 40, 7.5, 110);

        // Ropery chimneys — several along the building
        var chimneyPositions = [-80, -50, -20, 10, 40, 70, 100, 130];
        for (var chi = 0; chi < chimneyPositions.length; chi++) {
            var chiGeo = new THREE.BoxGeometry(2, 8, 2);
            var chi_mesh = makeMesh(chiGeo, darkBrick);
            placeMesh(chi_mesh, dockyardBase + 40 + chimneyPositions[chi], 11, 110);

            var chiCapGeo = new THREE.CylinderGeometry(1.2, 1.4, 1.5, 8);
            var chiCap = makeMesh(chiCapGeo, 0x333333);
            placeMesh(chiCap, dockyardBase + 40 + chimneyPositions[chi], 15.5, 110);
        }

        // Dockyard warehouses / storehouses
        for (var wi = 0; wi < 4; wi++) {
            var wGeo = new THREE.BoxGeometry(20, 12, 12);
            var warehouse = makeMesh(wGeo, brickColor);
            placeMesh(warehouse, dockyardBase + wi * 24, 6, 58);

            var wRoofGeo = new THREE.BoxGeometry(20.5, 3, 12.5);
            var wRoof = makeMesh(wRoofGeo, slateColor);
            placeMesh(wRoof, dockyardBase + wi * 24, 13.5, 58);
        }

        // Dockyard gate / commissioner's house suggestion
        var gateHouseGeo = new THREE.BoxGeometry(12, 9, 8);
        var gateHouse = makeMesh(gateHouseGeo, brickColor);
        placeMesh(gateHouse, dockyardBase - 20, 4.5, 56);

        var gateHouseRGeo = new THREE.BoxGeometry(12.5, 2, 8.5);
        var gateHouseR = makeMesh(gateHouseRGeo, slateColor);
        placeMesh(gateHouseR, dockyardBase - 20, 10, 56);

        // Guard towers at dockyard entrance
        var gtLGeo = new THREE.CylinderGeometry(2, 2.5, 11, 8);
        var gtL = makeMesh(gtLGeo, concreteColor);
        placeMesh(gtL, dockyardBase - 27, 5.5, 56);

        var gtRGeo = new THREE.CylinderGeometry(2, 2.5, 11, 8);
        var gtR = makeMesh(gtRGeo, concreteColor);
        placeMesh(gtR, dockyardBase - 13, 5.5, 56);

        // Mast house / boat store — large shed
        var mastGeo = new THREE.BoxGeometry(30, 10, 18);
        var mast = makeMesh(mastGeo, darkBrick);
        placeMesh(mast, dockyardBase + 120, 5, 70);

        var mastRoofGeo = new THREE.BoxGeometry(30.5, 2, 18.5);
        var mastRoof = makeMesh(mastRoofGeo, slateColor);
        placeMesh(mastRoof, dockyardBase + 120, 11, 70);
    }

    function buildGroundPlane() {
        // Ground for the Rochester area
        var groundGeo = new THREE.BoxGeometry(400, 0.5, 200);
        var ground = makeMesh(groundGeo, 0x5A7A3A);
        placeMesh(ground, X + 60, -0.25, -20);

        // Castle grounds — gravel/courtyard
        var courtyardGeo = new THREE.BoxGeometry(50, 0.3, 50);
        var courtyard = makeMesh(courtyardGeo, 0xC8B888);
        placeMesh(courtyard, X + 0, 0.15, -28);

        // Cathedral precinct
        var precinctGeo = new THREE.BoxGeometry(60, 0.3, 70);
        var precinct = makeMesh(precinctGeo, 0xC0B890);
        placeMesh(precinct, X + 55, 0.15, -25);

        // Road approaching bridge
        var roadBridgeGeo = new THREE.BoxGeometry(6, 0.3, 25);
        var roadBridge = makeMesh(roadBridgeGeo, 0x555555);
        placeMesh(roadBridge, X + 40, 0.15, 15);
    }

    function build() {
        buildGroundPlane();
        buildCastle();
        buildCathedral();
        buildMedwayRiver();
        buildHighStreet();
        buildChathamDockyard();
    }

    function update(delta) { }

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
