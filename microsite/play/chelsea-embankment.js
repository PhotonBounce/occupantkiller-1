window.ChelseaEmbankment = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11240;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObject(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geometry, color, options) {
        var params = { color: color };
        if (options) {
            if (options.emissive !== undefined) params.emissive = options.emissive;
        }
        var mat = new THREE.MeshLambertMaterial(params);
        return new THREE.Mesh(geometry, mat);
    }

    function buildThamesForeshore() {
        // Wide muddy foreshore along the river
        var shoreGeo = new THREE.BoxGeometry(600, 1, 40);
        var shore = makeMesh(shoreGeo, 0x8B7355);
        shore.position.set(X_OFFSET, -0.5, 80);
        addObject(shore);

        // Sandy patches
        var i;
        for (i = 0; i < 12; i++) {
            var sandGeo = new THREE.BoxGeometry(30 + Math.floor(i * 3.7) % 20, 0.5, 10 + Math.floor(i * 2.3) % 8);
            var sand = makeMesh(sandGeo, 0xC2B280);
            sand.position.set(X_OFFSET - 250 + i * 45, 0, 72 + (i % 3) * 5);
            addObject(sand);
        }

        // Houseboats moored along foreshore
        var boatColors = [0x8B6914, 0x4A6741, 0x7B4C2A, 0x2E4A6B, 0x6B3A2E];
        for (i = 0; i < 5; i++) {
            // Hull
            var hullGeo = new THREE.BoxGeometry(22, 3, 6);
            var hull = makeMesh(hullGeo, boatColors[i]);
            hull.position.set(X_OFFSET - 180 + i * 70, 1.5, 85);
            addObject(hull);

            // Cabin superstructure
            var cabinGeo = new THREE.BoxGeometry(14, 4, 5);
            var cabin = makeMesh(cabinGeo, boatColors[(i + 2) % 5]);
            cabin.position.set(X_OFFSET - 180 + i * 70, 5, 85);
            addObject(cabin);

            // Cabin roof
            var roofGeo = new THREE.BoxGeometry(15, 0.5, 5.5);
            var roof = makeMesh(roofGeo, 0x333333);
            roof.position.set(X_OFFSET - 180 + i * 70, 7.2, 85);
            addObject(roof);

            // Chimney
            var chimneyGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 6);
            var chimney = makeMesh(chimneyGeo, 0x222222);
            chimney.position.set(X_OFFSET - 175 + i * 70, 8.2, 85);
            addObject(chimney);
        }

        // Riverside path / embankment wall
        var wallGeo = new THREE.BoxGeometry(600, 3, 4);
        var wall = makeMesh(wallGeo, 0x9E9E8A);
        wall.position.set(X_OFFSET, 1.5, 62);
        addObject(wall);

        // Embankment path surface
        var pathGeo = new THREE.BoxGeometry(600, 0.5, 12);
        var path = makeMesh(pathGeo, 0xB0A898);
        path.position.set(X_OFFSET, 3.2, 56);
        addObject(path);
    }

    function buildAlbertBridge() {
        // Albert Bridge suspension bridge: centered around X_OFFSET, crossing Thames
        var bx = X_OFFSET;
        var bz = 75; // at river level
        var i;

        // Bridge deck
        var deckGeo = new THREE.BoxGeometry(200, 1.5, 14);
        var deck = makeMesh(deckGeo, 0xD4C5A9);
        deck.position.set(bx, 8, bz);
        addObject(deck);

        // Deck side railings (south side)
        var railSGeo = new THREE.BoxGeometry(200, 1, 0.4);
        var railS = makeMesh(railSGeo, 0xFFB6C1);
        railS.position.set(bx, 9, bz + 7);
        addObject(railS);

        // Deck side railings (north side)
        var railNGeo = new THREE.BoxGeometry(200, 1, 0.4);
        var railN = makeMesh(railNGeo, 0xFFB6C1);
        railN.position.set(bx, 9, bz - 7);
        addObject(railN);

        // 4 pink suspension towers
        var towerPositions = [
            { x: bx - 60, z: bz + 7 },
            { x: bx - 60, z: bz - 7 },
            { x: bx + 60, z: bz + 7 },
            { x: bx + 60, z: bz - 7 }
        ];

        for (i = 0; i < towerPositions.length; i++) {
            var tp = towerPositions[i];

            // Tower shaft lower
            var shaftGeo = new THREE.BoxGeometry(2.5, 28, 2.5);
            var shaft = makeMesh(shaftGeo, 0xFF9EAD);
            shaft.position.set(tp.x, 14, tp.z);
            addObject(shaft);

            // Tower Gothic arch top
            var archTopGeo = new THREE.BoxGeometry(3, 4, 3);
            var archTop = makeMesh(archTopGeo, 0xFF8FA0);
            archTop.position.set(tp.x, 29, tp.z);
            addObject(archTop);

            // Tower pinnacle
            var pinnacleGeo = new THREE.ConeGeometry(1, 5, 4);
            var pinnacle = makeMesh(pinnacleGeo, 0xFF7A8E);
            pinnacle.position.set(tp.x, 33.5, tp.z);
            addObject(pinnacle);

            // Tower cross-beam horizontal
            var crossGeo = new THREE.BoxGeometry(0.6, 1, 16);
            var cross = makeMesh(crossGeo, 0xFF9EAD);
            cross.position.set(tp.x, 26, bz);
            addObject(cross);
        }

        // Suspension cables — LineSegments from towers down to deck
        // Left span cables (west towers)
        var leftCablePoints = [];
        var j;
        for (j = 0; j <= 16; j++) {
            var t = j / 16;
            var cx = (bx - 100) + t * 40;
            var cy = 8 + 18 * (1 - 4 * (t - 0.5) * (t - 0.5)) * 0;
            // Catenary approximation
            var cat = 18 * (t - 1) * (t - 1) + 8;
            leftCablePoints.push(cx, 28 - (28 - 8) * (1 - Math.abs(t - 1)), bz + 7);
        }

        // Main span cables from west towers to east towers (south side)
        var mainCablePointsSouth = [];
        for (j = 0; j <= 24; j++) {
            var tm = j / 24;
            var cmx = (bx - 60) + tm * 120;
            var cmy = 26 - 18 * 4 * tm * (1 - tm);
            mainCablePointsSouth.push(cmx, cmy, bz + 7);
        }

        var mainCableGeoS = new THREE.BufferGeometry();
        var mainCableVertsS = new Float32Array(mainCablePointsSouth);
        mainCableGeoS.setAttribute('position', new THREE.BufferAttribute(mainCableVertsS, 3));
        var mainCableIdxS = [];
        for (j = 0; j < 24; j++) {
            mainCableIdxS.push(j, j + 1);
        }
        mainCableGeoS.setIndex(mainCableIdxS);
        var cableMatS = new THREE.MeshLambertMaterial({ color: 0xC8A0A8 });
        var mainCableS = new THREE.LineSegments(mainCableGeoS, cableMatS);
        addObject(mainCableS);

        // Main span cables north side
        var mainCablePointsN = [];
        for (j = 0; j <= 24; j++) {
            var tn = j / 24;
            var cmnx = (bx - 60) + tn * 120;
            var cmny = 26 - 18 * 4 * tn * (1 - tn);
            mainCablePointsN.push(cmnx, cmny, bz - 7);
        }

        var mainCableGeoN = new THREE.BufferGeometry();
        var mainCableVertsN = new Float32Array(mainCablePointsN);
        mainCableGeoN.setAttribute('position', new THREE.BufferAttribute(mainCableVertsN, 3));
        var mainCableIdxN = [];
        for (j = 0; j < 24; j++) {
            mainCableIdxN.push(j, j + 1);
        }
        mainCableGeoN.setIndex(mainCableIdxN);
        var cableMatN = new THREE.MeshLambertMaterial({ color: 0xC8A0A8 });
        var mainCableN = new THREE.LineSegments(mainCableGeoN, cableMatN);
        addObject(mainCableN);

        // Vertical hanger cables from main cable down to deck
        var hangerPoints = [];
        for (j = 0; j <= 12; j++) {
            var th = j / 12;
            var hx = (bx - 60) + th * 120;
            var hy_top = 26 - 18 * 4 * th * (1 - th);
            var hy_bot = 8.7;
            // South side hangers
            hangerPoints.push(hx, hy_top, bz + 7);
            hangerPoints.push(hx, hy_bot, bz + 7);
        }

        var hangerGeo = new THREE.BufferGeometry();
        var hangerVerts = new Float32Array(hangerPoints);
        hangerGeo.setAttribute('position', new THREE.BufferAttribute(hangerVerts, 3));
        var hangerIdx = [];
        for (j = 0; j < 13; j++) {
            hangerIdx.push(j * 2, j * 2 + 1);
        }
        hangerGeo.setIndex(hangerIdx);
        var hangerMat = new THREE.MeshLambertMaterial({ color: 0xD4A0B0 });
        var hangers = new THREE.LineSegments(hangerGeo, hangerMat);
        addObject(hangers);

        // West approach span cables south
        var westCablePointsS = [];
        for (j = 0; j <= 10; j++) {
            var tw = j / 10;
            var wx = (bx - 100) + tw * 40;
            var wy = 8 + (26 - 8) * tw;
            westCablePointsS.push(wx, wy, bz + 7);
        }
        var westCableGeoS = new THREE.BufferGeometry();
        westCableGeoS.setAttribute('position', new THREE.BufferAttribute(new Float32Array(westCablePointsS), 3));
        var westIdxS = [];
        for (j = 0; j < 10; j++) { westIdxS.push(j, j + 1); }
        westCableGeoS.setIndex(westIdxS);
        addObject(new THREE.LineSegments(westCableGeoS, new THREE.MeshLambertMaterial({ color: 0xC8A0A8 })));

        // East approach span cables south
        var eastCablePointsS = [];
        for (j = 0; j <= 10; j++) {
            var te = j / 10;
            var ex = (bx + 60) + te * 40;
            var ey = 26 - (26 - 8) * te;
            eastCablePointsS.push(ex, ey, bz + 7);
        }
        var eastCableGeoS = new THREE.BufferGeometry();
        eastCableGeoS.setAttribute('position', new THREE.BufferAttribute(new Float32Array(eastCablePointsS), 3));
        var eastIdxS = [];
        for (j = 0; j < 10; j++) { eastIdxS.push(j, j + 1); }
        eastCableGeoS.setIndex(eastIdxS);
        addObject(new THREE.LineSegments(eastCableGeoS, new THREE.MeshLambertMaterial({ color: 0xC8A0A8 })));

        // 40 lamp posts along bridge deck
        for (i = 0; i < 40; i++) {
            var lx = (bx - 95) + i * (190 / 39);
            var lz = (i % 2 === 0) ? bz + 6 : bz - 6;

            // Lamp post pole
            var poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 4.5, 5);
            var pole = makeMesh(poleGeo, 0xFFB6C1);
            pole.position.set(lx, 11, lz);
            addObject(pole);

            // Lamp globe
            var globeGeo = new THREE.SphereGeometry(0.35, 6, 4);
            var globe = makeMesh(globeGeo, 0xFFFFCC);
            globe.position.set(lx, 13.5, lz);
            addObject(globe);
        }

        // Gothic arch decorations on central span
        for (i = 0; i < 5; i++) {
            var archX = bx - 40 + i * 20;
            var archGeo = new THREE.BoxGeometry(2, 6, 0.5);
            var arch = makeMesh(archGeo, 0xFFB6C1);
            arch.position.set(archX, 11.5, bz + 7.1);
            addObject(arch);

            var archGeo2 = new THREE.BoxGeometry(2, 6, 0.5);
            var arch2 = makeMesh(archGeo2, 0xFFB6C1);
            arch2.position.set(archX, 11.5, bz - 7.1);
            addObject(arch2);
        }

        // Bridge approach ramps
        var rampWGeo = new THREE.BoxGeometry(45, 1.5, 14);
        var rampW = makeMesh(rampWGeo, 0xC8C0B0);
        rampW.position.set(bx - 122, 4.5, bz);
        rampW.rotation.z = 0.12;
        addObject(rampW);

        var rampEGeo = new THREE.BoxGeometry(45, 1.5, 14);
        var rampE = makeMesh(rampEGeo, 0xC8C0B0);
        rampE.position.set(bx + 122, 4.5, bz);
        rampE.rotation.z = -0.12;
        addObject(rampE);
    }

    function buildRoyalHospitalChelsea() {
        // Royal Hospital Chelsea — Wren baroque complex
        // Located north of embankment, centered around X_OFFSET - 50
        var rhx = X_OFFSET - 50;
        var rhz = -60; // north of path
        var i;

        // Ground courtyard (Figure Court)
        var courtGeo = new THREE.BoxGeometry(120, 0.5, 80);
        var court = makeMesh(courtGeo, 0xCCBB99);
        court.position.set(rhx, 0.2, rhz);
        addObject(court);

        // Central main block (chapel and great hall)
        var mainGeo = new THREE.BoxGeometry(60, 18, 22);
        var main = makeMesh(mainGeo, 0x8B2020);
        main.position.set(rhx, 9, rhz);
        addObject(main);

        // Central chapel dome
        var domeGeo = new THREE.SphereGeometry(9, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
        var dome = makeMesh(domeGeo, 0xB0B0B0);
        dome.position.set(rhx, 18, rhz);
        addObject(dome);

        // Dome drum
        var drumGeo = new THREE.CylinderGeometry(9, 9, 5, 12);
        var drum = makeMesh(drumGeo, 0x9E9E9E);
        drum.position.set(rhx, 15.5, rhz);
        addObject(drum);

        // Dome lantern
        var lanternGeo = new THREE.CylinderGeometry(2, 2.5, 4, 8);
        var lantern = makeMesh(lanternGeo, 0xB0B0B0);
        lantern.position.set(rhx, 26, rhz);
        addObject(lantern);

        // Lantern cupola
        var cupolaGeo = new THREE.SphereGeometry(2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var cupola = makeMesh(cupolaGeo, 0x888888);
        cupola.position.set(rhx, 30, rhz);
        addObject(cupola);

        // East wing (long red brick)
        var eastWingGeo = new THREE.BoxGeometry(55, 15, 20);
        var eastWing = makeMesh(eastWingGeo, 0x8B2020);
        eastWing.position.set(rhx + 58, 7.5, rhz);
        addObject(eastWing);

        // East wing roof
        var eastRoofGeo = new THREE.BoxGeometry(57, 2, 22);
        var eastRoof = makeMesh(eastRoofGeo, 0x5A3030);
        eastRoof.position.set(rhx + 58, 15.5, rhz);
        addObject(eastRoof);

        // West wing (long red brick)
        var westWingGeo = new THREE.BoxGeometry(55, 15, 20);
        var westWing = makeMesh(westWingGeo, 0x8B2020);
        westWing.position.set(rhx - 58, 7.5, rhz);
        addObject(westWing);

        // West wing roof
        var westRoofGeo = new THREE.BoxGeometry(57, 2, 22);
        var westRoof = makeMesh(westRoofGeo, 0x5A3030);
        westRoof.position.set(rhx - 58, 15.5, rhz);
        addObject(westRoof);

        // Colonnaded portico on south facade
        for (i = 0; i < 8; i++) {
            var colGeo = new THREE.CylinderGeometry(0.6, 0.7, 12, 8);
            var col = makeMesh(colGeo, 0xE8DCC8);
            col.position.set(rhx - 14 + i * 4, 6, rhz + 11.5);
            addObject(col);
        }

        // Portico entablature
        var entabGeo = new THREE.BoxGeometry(32, 2, 2);
        var entab = makeMesh(entabGeo, 0xE0D4C0);
        entab.position.set(rhx, 12.5, rhz + 11.5);
        addObject(entab);

        // Portico pediment
        var pediGeo = new THREE.BoxGeometry(32, 4, 1);
        var pedi = makeMesh(pediGeo, 0xDDD0BC);
        pedi.position.set(rhx, 15, rhz + 11.5);
        addObject(pedi);

        // Flanking pavilions
        var pavEGeo = new THREE.BoxGeometry(16, 17, 20);
        var pavE = makeMesh(pavEGeo, 0x8B2020);
        pavE.position.set(rhx + 38, 8.5, rhz);
        addObject(pavE);

        var pavWGeo = new THREE.BoxGeometry(16, 17, 20);
        var pavW = makeMesh(pavWGeo, 0x8B2020);
        pavW.position.set(rhx - 38, 8.5, rhz);
        addObject(pavW);

        // Figure Court statue (Charles II)
        var statuePedGeo = new THREE.BoxGeometry(2.5, 3, 2.5);
        var statuePed = makeMesh(statuePedGeo, 0xDDD8CC);
        statuePed.position.set(rhx, 1.5, rhz + 20);
        addObject(statuePed);

        var statueBodyGeo = new THREE.BoxGeometry(1.2, 3, 1);
        var statueBody = makeMesh(statueBodyGeo, 0xCCC8BC);
        statueBody.position.set(rhx, 5, rhz + 20);
        addObject(statueBody);

        var statueHeadGeo = new THREE.SphereGeometry(0.6, 6, 4);
        var statueHead = makeMesh(statueHeadGeo, 0xCCC8BC);
        statueHead.position.set(rhx, 7, rhz + 20);
        addObject(statueHead);

        // Perimeter wall
        var northWallGeo = new THREE.BoxGeometry(130, 3, 1.5);
        var northWall = makeMesh(northWallGeo, 0x9B3333);
        northWall.position.set(rhx, 1.5, rhz - 42);
        addObject(northWall);

        var southWallGeo = new THREE.BoxGeometry(130, 3, 1.5);
        var southWall = makeMesh(southWallGeo, 0x9B3333);
        southWall.position.set(rhx, 1.5, rhz + 42);
        addObject(southWall);

        // Gate piers at south entrance
        var gateE = new THREE.BoxGeometry(2, 5, 2);
        var gatePierE = makeMesh(gateE, 0xBBA090);
        gatePierE.position.set(rhx + 6, 2.5, rhz + 42);
        addObject(gatePierE);

        var gateW = new THREE.BoxGeometry(2, 5, 2);
        var gatePierW = makeMesh(gateW, 0xBBA090);
        gatePierW.position.set(rhx - 6, 2.5, rhz + 42);
        addObject(gatePierW);
    }

    function buildChelseaPhysicGarden() {
        // Chelsea Physic Garden — walled garden east of Royal Hospital
        var cpx = X_OFFSET + 120;
        var cpz = -30;
        var i;

        // Garden ground
        var gardenGeo = new THREE.BoxGeometry(90, 0.3, 70);
        var garden = makeMesh(gardenGeo, 0x4A6741);
        garden.position.set(cpx, 0.1, cpz);
        addObject(garden);

        // Brick perimeter walls
        var wallNGeo = new THREE.BoxGeometry(92, 4, 1.5);
        var wallN = makeMesh(wallNGeo, 0x9B4422);
        wallN.position.set(cpx, 2, cpz - 36);
        addObject(wallN);

        var wallSGeo = new THREE.BoxGeometry(92, 4, 1.5);
        var wallS = makeMesh(wallSGeo, 0x9B4422);
        wallS.position.set(cpx, 2, cpz + 36);
        addObject(wallS);

        var wallEGeo = new THREE.BoxGeometry(1.5, 4, 72);
        var wallE = makeMesh(wallEGeo, 0x9B4422);
        wallE.position.set(cpx + 46, 2, cpz);
        addObject(wallE);

        var wallWGeo = new THREE.BoxGeometry(1.5, 4, 72);
        var wallW = makeMesh(wallWGeo, 0x9B4422);
        wallW.position.set(cpx - 46, 2, cpz);
        addObject(wallW);

        // Greenhouse — glass panels (BoxGeometry, white frames)
        var ghBaseGeo = new THREE.BoxGeometry(28, 0.5, 18);
        var ghBase = makeMesh(ghBaseGeo, 0xCCCCCC);
        ghBase.position.set(cpx + 20, 0.3, cpz - 18);
        addObject(ghBase);

        // Greenhouse walls (glass panes simulated)
        var ghWallSGeo = new THREE.BoxGeometry(28, 8, 0.4);
        var ghWallS = makeMesh(ghWallSGeo, 0xAADDCC);
        ghWallS.position.set(cpx + 20, 4.3, cpz - 9.2);
        addObject(ghWallS);

        var ghWallNGeo = new THREE.BoxGeometry(28, 8, 0.4);
        var ghWallN = makeMesh(ghWallNGeo, 0xAADDCC);
        ghWallN.position.set(cpx + 20, 4.3, cpz - 26.8);
        addObject(ghWallN);

        var ghWallEGeo = new THREE.BoxGeometry(0.4, 8, 18);
        var ghWallE = makeMesh(ghWallEGeo, 0xAADDCC);
        ghWallE.position.set(cpx + 34.2, 4.3, cpz - 18);
        addObject(ghWallE);

        var ghWallWGeo = new THREE.BoxGeometry(0.4, 8, 18);
        var ghWallW = makeMesh(ghWallWGeo, 0xAADDCC);
        ghWallW.position.set(cpx + 5.8, 4.3, cpz - 18);
        addObject(ghWallW);

        // Greenhouse roof (glass panels)
        var ghRoofGeo = new THREE.BoxGeometry(29, 0.5, 19);
        var ghRoof = makeMesh(ghRoofGeo, 0x88CCBB);
        ghRoof.position.set(cpx + 20, 8.5, cpz - 18);
        addObject(ghRoof);

        // Greenhouse ridge
        var ghRidgeGeo = new THREE.BoxGeometry(29, 1, 1);
        var ghRidge = makeMesh(ghRidgeGeo, 0xFFFFFF);
        ghRidge.position.set(cpx + 20, 9.2, cpz - 18);
        addObject(ghRidge);

        // Herb beds (rows of low raised beds)
        for (i = 0; i < 6; i++) {
            var bedGeo = new THREE.BoxGeometry(18, 0.6, 4);
            var bed = makeMesh(bedGeo, 0x5D4037);
            bed.position.set(cpx - 15, 0.4, cpz - 25 + i * 9);
            addObject(bed);

            // Plants/herbs on each bed
            var plantGeo = new THREE.BoxGeometry(17, 0.8, 3.5);
            var plant = makeMesh(plantGeo, 0x558B2F);
            plant.position.set(cpx - 15, 1, cpz - 25 + i * 9);
            addObject(plant);
        }

        // Sundial
        var sundialBaseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.6, 8);
        var sundialBase = makeMesh(sundialBaseGeo, 0xCCBB99);
        sundialBase.position.set(cpx, 0.3, cpz);
        addObject(sundialBase);

        var sundialPedGeo = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
        var sundialPed = makeMesh(sundialPedGeo, 0xBBAA88);
        sundialPed.position.set(cpx, 2, cpz);
        addObject(sundialPed);

        var sundialTopGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.2, 12);
        var sundialTop = makeMesh(sundialTopGeo, 0xDDCC88);
        sundialTop.position.set(cpx, 3.5, cpz);
        addObject(sundialTop);

        // Garden pond
        var pondGeo = new THREE.BoxGeometry(14, 0.4, 10);
        var pond = makeMesh(pondGeo, 0x2C6E7A);
        pond.position.set(cpx + 10, 0.3, cpz + 20);
        addObject(pond);

        // Pond surround
        var pondSurroundGeo = new THREE.BoxGeometry(16, 0.6, 12);
        var pondSurround = makeMesh(pondSurroundGeo, 0x9E8A70);
        pondSurround.position.set(cpx + 10, 0.1, cpz + 20);
        addObject(pondSurround);

        // Garden paths (gravel)
        var pathEWGeo = new THREE.BoxGeometry(88, 0.2, 2.5);
        var pathEW = makeMesh(pathEWGeo, 0xD4C4A0);
        pathEW.position.set(cpx, 0.2, cpz);
        addObject(pathEW);

        var pathNSGeo = new THREE.BoxGeometry(2.5, 0.2, 68);
        var pathNS = makeMesh(pathNSGeo, 0xD4C4A0);
        pathNS.position.set(cpx, 0.2, cpz);
        addObject(pathNS);

        // Trees (large specimens)
        var treePositions = [
            { x: cpx - 30, z: cpz - 15 },
            { x: cpx - 30, z: cpz + 15 },
            { x: cpx + 30, z: cpz + 15 },
            { x: cpx - 10, z: cpz - 28 }
        ];

        for (i = 0; i < treePositions.length; i++) {
            var tp = treePositions[i];
            var trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 6, 7);
            var trunk = makeMesh(trunkGeo, 0x4E342E);
            trunk.position.set(tp.x, 3, tp.z);
            addObject(trunk);

            var canopyGeo = new THREE.SphereGeometry(4.5, 8, 6);
            var canopy = makeMesh(canopyGeo, 0x2E7D32);
            canopy.position.set(tp.x, 10, tp.z);
            addObject(canopy);
        }
    }

    function buildCheyneWalk() {
        // Cheyne Walk — Georgian terrace houses along riverside
        var cwx = X_OFFSET - 200;
        var cwz = 30;
        var i;

        // Riverside promenade
        var promenadeGeo = new THREE.BoxGeometry(300, 0.3, 8);
        var promenade = makeMesh(promenadeGeo, 0xC8C0B0);
        promenade.position.set(cwx + 100, 3.2, cwz + 25);
        addObject(promenade);

        // Terrace houses — Georgian brick
        var houseConfigs = [
            { w: 10, h: 14, d: 12, color: 0xB05030 },
            { w: 12, h: 16, d: 12, color: 0xA04828 },
            { w: 10, h: 14, d: 12, color: 0xBB5535 },
            { w: 11, h: 15, d: 12, color: 0xA85230 },
            { w: 13, h: 16, d: 12, color: 0xB04E2E },
            { w: 10, h: 14, d: 12, color: 0xBB5535 },
            { w: 12, h: 15, d: 12, color: 0xA04828 },
            { w: 10, h: 16, d: 12, color: 0xB05030 },
            { w: 11, h: 14, d: 12, color: 0xA85232 },
            { w: 12, h: 15, d: 12, color: 0xBB5535 }
        ];

        var xPos = cwx;
        for (i = 0; i < houseConfigs.length; i++) {
            var hc = houseConfigs[i];
            xPos += hc.w * 0.5;

            // House body
            var houseGeo = new THREE.BoxGeometry(hc.w - 0.5, hc.h, hc.d);
            var house = makeMesh(houseGeo, hc.color);
            house.position.set(xPos, hc.h * 0.5, cwz);
            addObject(house);

            // Roof
            var houseRoofGeo = new THREE.BoxGeometry(hc.w - 0.3, 1.5, hc.d);
            var houseRoof = makeMesh(houseRoofGeo, 0x333333);
            houseRoof.position.set(xPos, hc.h + 0.75, cwz);
            addObject(houseRoof);

            // White painted ground floor stucco
            var stuccoGeo = new THREE.BoxGeometry(hc.w - 0.5, 3.5, hc.d + 0.1);
            var stucco = makeMesh(stuccoGeo, 0xE8E0D0);
            stucco.position.set(xPos, 1.75, cwz);
            addObject(stucco);

            // Door
            var doorGeo = new THREE.BoxGeometry(1.2, 2.8, 0.3);
            var door = makeMesh(doorGeo, 0x1A1A2E);
            door.position.set(xPos, 1.4, cwz + hc.d * 0.5 + 0.15);
            addObject(door);

            // Door fanlight
            var fanlightGeo = new THREE.SphereGeometry(0.6, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);
            var fanlight = makeMesh(fanlightGeo, 0xAAAAFF);
            fanlight.position.set(xPos, 2.9, cwz + hc.d * 0.5 + 0.15);
            addObject(fanlight);

            // Steps
            var step1Geo = new THREE.BoxGeometry(2, 0.3, 1);
            var step1 = makeMesh(step1Geo, 0xDDD8CC);
            step1.position.set(xPos, 0.3, cwz + hc.d * 0.5 + 0.6);
            addObject(step1);

            var step2Geo = new THREE.BoxGeometry(2, 0.6, 0.7);
            var step2 = makeMesh(step2Geo, 0xDDD8CC);
            step2.position.set(xPos, 0.6, cwz + hc.d * 0.5 + 0.95);
            addObject(step2);

            // Chimneys
            var chimney1Geo = new THREE.BoxGeometry(1, 2.5, 1);
            var chimney1 = makeMesh(chimney1Geo, hc.color);
            chimney1.position.set(xPos - 2, hc.h + 2, cwz);
            addObject(chimney1);

            var chimney2Geo = new THREE.BoxGeometry(1, 2, 1);
            var chimney2 = makeMesh(chimney2Geo, hc.color);
            chimney2.position.set(xPos + 2, hc.h + 1.75, cwz);
            addObject(chimney2);

            // Windows (sash windows)
            var floors = [4, 7.5, 11];
            var f;
            for (f = 0; f < floors.length; f++) {
                if (floors[f] < hc.h - 1) {
                    var winGeo = new THREE.BoxGeometry(1.4, 2, 0.2);
                    var win = makeMesh(winGeo, 0xCCDDFF);
                    win.position.set(xPos - 2.5, floors[f], cwz + hc.d * 0.5 + 0.1);
                    addObject(win);

                    var winGeo2 = new THREE.BoxGeometry(1.4, 2, 0.2);
                    var win2 = makeMesh(winGeo2, 0xCCDDFF);
                    win2.position.set(xPos + 2.5, floors[f], cwz + hc.d * 0.5 + 0.1);
                    addObject(win2);
                }
            }

            xPos += hc.w * 0.5 + 0.5;
        }

        // Garden squares between houses and embankment
        var gardenSqGeo = new THREE.BoxGeometry(60, 0.2, 18);
        var gardenSq = makeMesh(gardenSqGeo, 0x4A7A40);
        gardenSq.position.set(cwx + 60, 3.2, cwz + 13);
        addObject(gardenSq);

        var gardenSq2Geo = new THREE.BoxGeometry(50, 0.2, 18);
        var gardenSq2 = makeMesh(gardenSq2Geo, 0x4A7A40);
        gardenSq2.position.set(cwx + 200, 3.2, cwz + 13);
        addObject(gardenSq2);

        // Garden square trees
        var sqTreePositions = [
            { x: cwx + 40, z: cwz + 12 },
            { x: cwx + 70, z: cwz + 14 },
            { x: cwx + 100, z: cwz + 11 },
            { x: cwx + 185, z: cwz + 13 },
            { x: cwx + 215, z: cwz + 12 }
        ];

        for (i = 0; i < sqTreePositions.length; i++) {
            var stp = sqTreePositions[i];
            var sqTrunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 5, 6);
            var sqTrunk = makeMesh(sqTrunkGeo, 0x4E342E);
            sqTrunk.position.set(stp.x, 5.7, stp.z);
            addObject(sqTrunk);

            var sqCanopyGeo = new THREE.SphereGeometry(3.5, 7, 5);
            var sqCanopy = makeMesh(sqCanopyGeo, 0x388E3C);
            sqCanopy.position.set(stp.x, 11, stp.z);
            addObject(sqCanopy);
        }

        // Iron railings along garden squares (represented as thin posts)
        for (i = 0; i < 20; i++) {
            var railPostGeo = new THREE.BoxGeometry(0.15, 1.8, 0.15);
            var railPost = makeMesh(railPostGeo, 0x222222);
            railPost.position.set(cwx + 32 + i * 3, 4.2, cwz + 4);
            addObject(railPost);
        }

        // Embankment street lamps
        for (i = 0; i < 10; i++) {
            var lampPoleGeo = new THREE.CylinderGeometry(0.1, 0.12, 5, 5);
            var lampPole = makeMesh(lampPoleGeo, 0x333333);
            lampPole.position.set(cwx + 20 + i * 28, 5.7, cwz + 25);
            addObject(lampPole);

            var lampGlobeGeo = new THREE.SphereGeometry(0.4, 6, 4);
            var lampGlobe = makeMesh(lampGlobeGeo, 0xFFFFDD);
            lampGlobe.position.set(cwx + 20 + i * 28, 8.5, cwz + 25);
            addObject(lampGlobe);
        }
    }

    function buildGroundPlane() {
        // Base ground covering the full area
        var groundGeo = new THREE.BoxGeometry(700, 0.5, 200);
        var ground = makeMesh(groundGeo, 0x6B8E5A);
        ground.position.set(X_OFFSET, -0.25, -20);
        addObject(ground);

        // Road (Chelsea Embankment road)
        var roadGeo = new THREE.BoxGeometry(600, 0.4, 14);
        var road = makeMesh(roadGeo, 0x444444);
        road.position.set(X_OFFSET, 3.4, 45);
        addObject(road);

        // Road centre line
        var centreLineGeo = new THREE.BoxGeometry(580, 0.1, 0.5);
        var centreLine = makeMesh(centreLineGeo, 0xFFFF00);
        centreLine.position.set(X_OFFSET, 3.65, 45);
        addObject(centreLine);

        // Pavement north side of road
        var pavNGeo = new THREE.BoxGeometry(600, 0.3, 5);
        var pavN = makeMesh(pavNGeo, 0xBBB0A0);
        pavN.position.set(X_OFFSET, 3.45, 38);
        addObject(pavN);

        // Pavement south side of road
        var pavSGeo = new THREE.BoxGeometry(600, 0.3, 5);
        var pavS = makeMesh(pavSGeo, 0xBBB0A0);
        pavS.position.set(X_OFFSET, 3.45, 52);
        addObject(pavS);

        // Thames river surface
        var riverGeo = new THREE.BoxGeometry(700, 0.8, 60);
        var river = makeMesh(riverGeo, 0x1A4A6B);
        river.position.set(X_OFFSET, -0.4, 110);
        addObject(river);

        // River subtle surface ripples (flat boxes)
        var i;
        for (i = 0; i < 8; i++) {
            var rippleGeo = new THREE.BoxGeometry(60 + i * 10, 0.05, 3);
            var ripple = makeMesh(rippleGeo, 0x1E5278);
            ripple.position.set(X_OFFSET - 200 + i * 60, 0.2, 95 + i * 4);
            addObject(ripple);
        }
    }

    function build() {
        buildGroundPlane();
        buildThamesForeshore();
        buildAlbertBridge();
        buildRoyalHospitalChelsea();
        buildChelseaPhysicGarden();
        buildCheyneWalk();
    }

    function update(delta) {
        // Static environment — no per-frame updates required
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
