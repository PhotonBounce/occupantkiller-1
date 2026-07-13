window.DumfriesPost = (function() {
    'use strict';

    var WORLD_X = 2380;
    var WORLD_Z = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
        return mesh;
    }

    function buildMidsteeple(scene) {
        // Main steeple tower body
        var tower = makeBox(5, 24, 5, 0xD4A97A, 0, 12, 0);
        scene.add(tower);

        // Clock face north
        var clockN = makeBox(3, 3, 0.3, 0xEEDDCC, 0, 18, -2.65);
        scene.add(clockN);

        // Clock face south
        var clockS = makeBox(3, 3, 0.3, 0xEEDDCC, 0, 18, 2.65);
        scene.add(clockS);

        // Clock face east
        var clockE = makeBox(0.3, 3, 3, 0xEEDDCC, 2.65, 18, 0);
        scene.add(clockE);

        // Clock face west
        var clockW = makeBox(0.3, 3, 3, 0xEEDDCC, -2.65, 18, 0);
        scene.add(clockW);

        // Clock hand hour (line segments)
        var hGeo = new THREE.BoxGeometry(0.15, 1.2, 0.15);
        var hMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var hourN = new THREE.Mesh(hGeo, hMat);
        hourN.position.set(WORLD_X + 0, 18.3, WORLD_Z + -2.7);
        scene.add(hourN);

        var minuteN = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), hMat);
        minuteN.position.set(WORLD_X + 0.2, 18.5, WORLD_Z + -2.7);
        scene.add(minuteN);

        // Parapet / battlements at top of tower
        var parapet = makeBox(5.5, 1.5, 5.5, 0xC49A6A, 0, 24.75, 0);
        scene.add(parapet);

        // Battlement cutouts (lighter blocks atop parapet)
        var bp1 = makeBox(1, 1.2, 0.4, 0xBB8B60, -1.5, 25.9, -2.8);
        scene.add(bp1);
        var bp2 = makeBox(1, 1.2, 0.4, 0xBB8B60, 0.5, 25.9, -2.8);
        scene.add(bp2);
        var bp3 = makeBox(1, 1.2, 0.4, 0xBB8B60, 2.5, 25.9, -2.8);
        scene.add(bp3);
        var bp4 = makeBox(1, 1.2, 0.4, 0xBB8B60, -1.5, 25.9, 2.8);
        scene.add(bp4);
        var bp5 = makeBox(1, 1.2, 0.4, 0xBB8B60, 0.5, 25.9, 2.8);
        scene.add(bp5);
        var bp6 = makeBox(1, 1.2, 0.4, 0xBB8B60, 2.5, 25.9, 2.8);
        scene.add(bp6);

        // Weathervane pole
        var pole = makeCylinder(0.06, 0.06, 3, 6, 0x888888, 0, 27.5, 0);
        scene.add(pole);

        // Weathervane sphere finial
        var finial = makeSphere(0.2, 6, 6, 0xAAAA00, 0, 29.1, 0);
        scene.add(finial);

        // Weathervane arrow (cone)
        var vane = makeCone(0.15, 0.6, 4, 0xCCCC00, 0.3, 29, 0);
        scene.add(vane);

        // Base plinth
        var plinth = makeBox(6.5, 1.5, 6.5, 0xBB9966, 0, 0.75, 0);
        scene.add(plinth);

        // Arched doorway suggestion (darker inset)
        var door = makeBox(1.2, 2.5, 0.4, 0x664433, 0, 2, -2.8);
        scene.add(door);
    }

    function buildDevorgillaBridge(scene) {
        // Main bridge deck spanning the River Nith
        var deck = makeBox(40, 4, 6, 0x9A8A78, 0, 4, 60);
        scene.add(deck);

        // 9 arch piers under bridge
        var pierPositions = [
            -18, -13.5, -9, -4.5, 0, 4.5, 9, 13.5, 18
        ];
        for (var i = 0; i < pierPositions.length; i++) {
            var pierX = pierPositions[i];
            var pier = makeBox(3, 5, 5, 0x8A7A68, pierX, 1.5, 60);
            scene.add(pier);

            // Arch keystone suggestion
            var arch = makeBox(2.5, 1.5, 5.2, 0xAA9A88, pierX, 3.5, 60);
            scene.add(arch);
        }

        // Parapet walls on bridge
        var parapetL = makeBox(40, 1.5, 0.5, 0xB0A090, 0, 6.75, 57.25);
        scene.add(parapetL);
        var parapetR = makeBox(40, 1.5, 0.5, 0xB0A090, 0, 6.75, 62.75);
        scene.add(parapetR);

        // Cutwater buttresses (triangular prow shapes on upstream side)
        for (var j = 0; j < 9; j++) {
            var cwX = pierPositions[j];
            var cw = makeCone(1.2, 3, 3, 0x9A8A78, cwX, 2.5, 54);
            scene.add(cw);
        }

        // Approach ramp east
        var rampE = makeBox(8, 3, 6, 0x9A8A78, 24, 2.5, 60);
        scene.add(rampE);

        // Approach ramp west
        var rampW = makeBox(8, 3, 6, 0x9A8A78, -24, 2.5, 60);
        scene.add(rampW);
    }

    function buildBurnsHouse(scene) {
        // Main house body
        var house = makeBox(10, 6, 8, 0xD4A97A, -40, 3, -20);
        scene.add(house);

        // Slate roof (dark grey, box ridge)
        var roof = makeBox(11, 2.5, 9, 0x4A4A5A, -40, 7.25, -20);
        scene.add(roof);

        // Roof ridge
        var ridge = makeBox(10.5, 0.6, 1, 0x3A3A4A, -40, 8.3, -20);
        scene.add(ridge);

        // Chimney stack left
        var chiL = makeCylinder(0.4, 0.4, 3, 6, 0x887766, -43, 10, -20);
        scene.add(chiL);

        // Chimney stack right
        var chiR = makeCylinder(0.4, 0.4, 3, 6, 0x887766, -37, 10, -20);
        scene.add(chiR);

        // Front door
        var door = makeBox(1.5, 2.5, 0.4, 0x4A3322, -40, 1.25, -24.2);
        scene.add(door);

        // Windows front x2
        var winFL = makeBox(1.5, 1.5, 0.3, 0x99BBCC, -43, 3, -24.2);
        scene.add(winFL);
        var winFR = makeBox(1.5, 1.5, 0.3, 0x99BBCC, -37, 3, -24.2);
        scene.add(winFR);

        // Side windows
        var winSL = makeBox(0.3, 1.5, 1.5, 0x99BBCC, -45.2, 3, -20);
        scene.add(winSL);
        var winSR = makeBox(0.3, 1.5, 1.5, 0x99BBCC, -34.8, 3, -20);
        scene.add(winSR);

        // Museum plaque slab on wall
        var plaque = makeBox(1.8, 1.0, 0.25, 0x666655, -40, 4.5, -24.25);
        scene.add(plaque);

        // Garden wall low
        var gardenWall = makeBox(14, 1.2, 0.5, 0xBBAA88, -40, 0.6, -26);
        scene.add(gardenWall);

        // Gate post left
        var gateL = makeBox(0.5, 2.0, 0.5, 0xAA9977, -43, 1, -26);
        scene.add(gateL);

        // Gate post right
        var gateR = makeBox(0.5, 2.0, 0.5, 0xAA9977, -37, 1, -26);
        scene.add(gateR);
    }

    function buildGreyfriarsChurch(scene) {
        // Main nave body
        var nave = makeBox(20, 10, 10, 0x9A8A78, 50, 5, -30);
        scene.add(nave);

        // Chancel extension east
        var chancel = makeBox(8, 9, 8, 0x9A8A78, 64, 4.5, -30);
        scene.add(chancel);

        // Tower at west end
        var tower = makeBox(6, 16, 6, 0x8A7A68, 37, 8, -30);
        scene.add(tower);

        // Tower parapet
        var tParapet = makeBox(7, 1.5, 7, 0x887766, 37, 16.75, -30);
        scene.add(tParapet);

        // Tower spire cone
        var spire = makeCone(2.5, 8, 4, 0x776655, 37, 21, -30);
        scene.add(spire);

        // Nave roof
        var naveRoof = makeBox(21, 3, 11, 0x5A5A6A, 50, 11.5, -30);
        scene.add(naveRoof);
        var naveRidge = makeBox(20, 0.7, 1.2, 0x4A4A5A, 50, 12.85, -30);
        scene.add(naveRidge);

        // Chancel roof
        var chancRoof = makeBox(9, 2.5, 9, 0x5A5A6A, 64, 10.25, -30);
        scene.add(chancRoof);

        // Bloodstained altar box inside (visible through doorway)
        var altar = makeBox(2.5, 1.2, 1.5, 0xCC2200, 64, 0.6, -30);
        scene.add(altar);

        // Altar bloodstain darkening
        var stain = makeBox(2.6, 0.15, 1.6, 0x881100, 64, 1.28, -30);
        scene.add(stain);

        // Doorway arch (dark inset)
        var doorW = makeBox(2, 3, 0.4, 0x332211, 40, 2, -30);
        scene.add(doorW);

        // Gothic lancet windows on nave sides
        var winN1 = makeBox(1.5, 3, 0.3, 0x8899AA, 44, 5, -35.2);
        scene.add(winN1);
        var winN2 = makeBox(1.5, 3, 0.3, 0x8899AA, 50, 5, -35.2);
        scene.add(winN2);
        var winN3 = makeBox(1.5, 3, 0.3, 0x8899AA, 56, 5, -35.2);
        scene.add(winN3);
        var winS1 = makeBox(1.5, 3, 0.3, 0x8899AA, 44, 5, -24.8);
        scene.add(winS1);
        var winS2 = makeBox(1.5, 3, 0.3, 0x8899AA, 50, 5, -24.8);
        scene.add(winS2);
        var winS3 = makeBox(1.5, 3, 0.3, 0x8899AA, 56, 5, -24.8);
        scene.add(winS3);

        // Graveyard perimeter wall
        var wallN = makeBox(32, 1.5, 0.6, 0x887766, 50, 0.75, -40);
        scene.add(wallN);
        var wallS = makeBox(32, 1.5, 0.6, 0x887766, 50, 0.75, -18);
        scene.add(wallS);
        var wallE = makeBox(0.6, 1.5, 22, 0x887766, 72, 0.75, -29);
        scene.add(wallE);
        var wallW = makeBox(0.6, 1.5, 22, 0x887766, 34, 0.75, -29);
        scene.add(wallW);

        // Gravestones (a few representative ones)
        var gs1 = makeBox(0.5, 1.5, 0.2, 0x888878, 55, 0.75, -37);
        scene.add(gs1);
        var gs2 = makeBox(0.5, 1.8, 0.2, 0x888878, 58, 0.9, -37);
        scene.add(gs2);
        var gs3 = makeBox(0.5, 1.3, 0.2, 0x888878, 61, 0.65, -37);
        scene.add(gs3);
        var gs4 = makeBox(0.5, 1.6, 0.2, 0x888878, 55, 0.8, -22);
        scene.add(gs4);
        var gs5 = makeBox(0.5, 1.4, 0.2, 0x888878, 59, 0.7, -22);
        scene.add(gs5);
    }

    function buildLincluden(scene) {
        // Ruined choir north wall fragment
        var wallN1 = makeBox(12, 7, 1.2, 0x8A8A78, -80, 3.5, -60);
        scene.add(wallN1);

        // Gap in north wall
        var wallN2 = makeBox(6, 5, 1.2, 0x8A8A78, -65, 2.5, -60);
        scene.add(wallN2);

        // South wall fragment
        var wallS1 = makeBox(15, 6, 1.2, 0x8A8A78, -78, 3, -70);
        scene.add(wallS1);

        // South wall gap then continuation
        var wallS2 = makeBox(5, 4, 1.2, 0x8A8A78, -62, 2, -70);
        scene.add(wallS2);

        // East gable end (partial)
        var gableE = makeBox(1.2, 9, 12, 0x8A8A78, -57, 4.5, -65);
        scene.add(gableE);

        // East gable top triangle suggestion
        var gableTop = makeCone(4.5, 4, 3, 0x7A7A68, -57, 11.5, -65);
        scene.add(gableTop);

        // West end fragment
        var gableW = makeBox(1.2, 6, 8, 0x8A8A78, -89, 3, -65);
        scene.add(gableW);

        // Column stump remains
        var col1 = makeCylinder(0.6, 0.7, 4, 8, 0x9A9A88, -75, 2, -63);
        scene.add(col1);
        var col2 = makeCylinder(0.6, 0.7, 3, 8, 0x9A9A88, -70, 1.5, -63);
        scene.add(col2);
        var col3 = makeCylinder(0.6, 0.7, 5, 8, 0x9A9A88, -65, 2.5, -63);
        scene.add(col3);

        // Capital blocks on stumps
        var cap1 = makeBox(1.4, 0.5, 1.4, 0xAAAAAA, -75, 4.25, -63);
        scene.add(cap1);
        var cap2 = makeBox(1.4, 0.5, 1.4, 0xAAAAAA, -70, 3.75, -63);
        scene.add(cap2);
        var cap3 = makeBox(1.4, 0.5, 1.4, 0xAAAAAA, -65, 5.25, -63);
        scene.add(cap3);

        // Fallen stone blocks on ground
        var fallen1 = makeBox(2, 0.8, 1, 0x888878, -73, 0.4, -67);
        scene.add(fallen1);
        var fallen2 = makeBox(1.5, 0.6, 1.2, 0x888878, -68, 0.3, -68);
        scene.add(fallen2);
        var fallen3 = makeBox(2.5, 0.7, 0.9, 0x888878, -82, 0.35, -62);
        scene.add(fallen3);

        // Lancet window opening in east gable (dark insert)
        var lancet = makeBox(0.5, 4, 1.5, 0x333322, -56.5, 6, -65);
        scene.add(lancet);
    }

    function buildRiverNith(scene) {
        // River Nith flows roughly north-south through town
        // Main river channel segments (wide, shallow water boxes)

        // Northern reach
        var riv1 = makeBox(8, 0.8, 40, 0x1A6B8A, 5, 0.1, -10);
        scene.add(riv1);

        // Through bridge section
        var riv2 = makeBox(8, 0.8, 25, 0x1A6B8A, 5, 0.1, 47);
        scene.add(riv2);

        // Under bridge
        var rivBridge = makeBox(6, 0.8, 15, 0x155E7A, 5, 0.8, 62);
        scene.add(rivBridge);

        // South of bridge
        var riv3 = makeBox(8, 0.8, 40, 0x1A6B8A, 5, 0.1, 85);
        scene.add(riv3);

        // Deeper southern reach towards Lincluden
        var riv4 = makeBox(7, 0.8, 50, 0x1A6B8A, 5, 0.1, 130);
        scene.add(riv4);

        // River bend near Lincluden — offset
        var rivBend = makeBox(20, 0.8, 8, 0x1A6B8A, -35, 0.1, -55);
        scene.add(rivBend);

        // Nith at Lincluden
        var rivLinc = makeBox(8, 0.8, 40, 0x1A6B8A, -65, 0.1, -55);
        scene.add(rivLinc);

        // River bank edges (dark earth)
        var bankL1 = makeBox(2, 0.5, 150, 0x5A4A30, 10, 0.2, 65);
        scene.add(bankL1);
        var bankR1 = makeBox(2, 0.5, 150, 0x5A4A30, 0, 0.2, 65);
        scene.add(bankR1);

        // Ripple surface detail strips (lighter blue)
        var ripple1 = makeBox(6, 0.15, 3, 0x2A8BAA, 5, 0.95, 20);
        scene.add(ripple1);
        var ripple2 = makeBox(6, 0.15, 3, 0x2A8BAA, 5, 0.95, 35);
        scene.add(ripple2);
        var ripple3 = makeBox(6, 0.15, 3, 0x2A8BAA, 5, 0.95, 80);
        scene.add(ripple3);
        var ripple4 = makeBox(6, 0.15, 3, 0x2A8BAA, 5, 0.95, 100);
        scene.add(ripple4);
    }

    function buildTownStreets(scene) {
        // High Street cobblestone (flat box ground)
        var highSt = makeBox(10, 0.3, 80, 0x888880, 0, -0.05, -20);
        scene.add(highSt);

        // Buccleuch Street
        var buccleuch = makeBox(60, 0.3, 8, 0x888880, -30, -0.05, -15);
        scene.add(buccleuch);

        // Bank Street
        var bankSt = makeBox(8, 0.3, 40, 0x888880, -18, -0.05, 20);
        scene.add(bankSt);

        // Irish Street approaching bridge
        var irishSt = makeBox(8, 0.3, 55, 0x888880, 5, -0.05, 30);
        scene.add(irishSt);

        // Pavement kerbs along High Street
        var kerbL = makeBox(1, 0.4, 80, 0x999990, -5.5, 0.05, -20);
        scene.add(kerbL);
        var kerbR = makeBox(1, 0.4, 80, 0x999990, 5.5, 0.05, -20);
        scene.add(kerbR);
    }

    function buildTownBuildings(scene) {
        // Row of Georgian town buildings along High Street
        var positions = [
            [-25, -10],
            [-25, -20],
            [-25, -30],
            [-25, -40],
            [25, -10],
            [25, -20],
            [25, -30],
            [25, -40]
        ];
        var colors = [0xD4A97A, 0xBBAA88, 0xCCAA88, 0xD4A97A, 0xBBAACC, 0xCCBBAA, 0xD4A97A, 0xBBAA88];
        var heights = [8, 7, 9, 6, 8, 7, 9, 6];

        for (var i = 0; i < positions.length; i++) {
            var bx = positions[i][0];
            var bz = positions[i][1];
            var bh = heights[i];
            var bc = colors[i];

            var bldg = makeBox(9, bh, 9, bc, bx, bh / 2, bz);
            scene.add(bldg);

            var bRoof = makeBox(9.5, 2, 9.5, 0x4A4A5A, bx, bh + 1, bz);
            scene.add(bRoof);
        }

        // Globe Inn (Burns' favourite tavern)
        var globeInn = makeBox(8, 7, 8, 0xCC9966, -35, 3.5, 5);
        scene.add(globeInn);
        var globeSign = makeBox(3, 1, 0.3, 0x885533, -35, 7, 1.2);
        scene.add(globeSign);
        var globeRoof = makeBox(9, 2.5, 9, 0x3A3A4A, -35, 8.25, 5);
        scene.add(globeRoof);

        // Globe Inn sign globe sphere
        var globe = makeSphere(0.5, 8, 8, 0x2244AA, -35, 8.5, 1.0);
        scene.add(globe);
    }

    function buildMarketCross(scene) {
        // Market Cross monument
        var crossBase = makeBox(2.5, 0.8, 2.5, 0xBBAA88, 8, 0.4, -5);
        scene.add(crossBase);

        var crossShaft = makeCylinder(0.25, 0.35, 5, 8, 0xAA9977, 8, 3.3, -5);
        scene.add(crossShaft);

        var crossCap = makeCone(0.5, 1.2, 8, 0x998866, 8, 6.5, -5);
        scene.add(crossCap);
    }

    function buildBurnsStatue(scene) {
        // Robert Burns statue base (plinth)
        var plinth = makeBox(2, 2, 2, 0x888888, -5, 1, -8);
        scene.add(plinth);

        // Statue body (cylinder approximation)
        var body = makeCylinder(0.5, 0.6, 2.2, 8, 0x777777, -5, 3.1, -8);
        scene.add(body);

        // Head sphere
        var head = makeSphere(0.35, 8, 8, 0x777777, -5, 4.45, -8);
        scene.add(head);

        // Arm outstretched (box)
        var arm = makeBox(1.2, 0.25, 0.25, 0x777777, -4.4, 3.2, -8);
        scene.add(arm);
    }

    function init(scene) {
        buildMidsteeple(scene);
        buildDevorgillaBridge(scene);
        buildBurnsHouse(scene);
        buildGreyfriarsChurch(scene);
        buildLincluden(scene);
        buildRiverNith(scene);
        buildTownStreets(scene);
        buildTownBuildings(scene);
        buildMarketCross(scene);
        buildBurnsStatue(scene);
    }

    return {
        init: init,
        worldX: WORLD_X,
        worldZ: WORLD_Z
    };

}());
