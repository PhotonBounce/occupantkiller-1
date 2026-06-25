window.SkopjeOldBazaar = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 23640;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, mat, x, y, z, rx, ry, rz) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function matLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildGround();
        buildVardarRiver();
        buildStoneBridge();
        buildWarriorOnHorse();
        buildMacedoniaSquare();
        buildKaleFortress();
        buildOldBazaar();
        buildMustaphaPashaMosque();
        buildHolocaustMemorial();
        buildSkopje2014Buildings();
        buildMillenniumCross();
    }

    function buildGround() {
        // Ground plane approximated with a very flat box
        var geoGround = new THREE.BoxGeometry(800, 1, 800);
        var matGround = matLambert(0x7A8B5A);
        addMesh(geoGround, matGround, 0, -0.5, 0);

        // City pavement zones — Macedonia Square area
        var geoPave = new THREE.BoxGeometry(120, 0.3, 120);
        var matPave = matLambert(0xD4C8C0);
        addMesh(geoPave, matPave, 0, 0.15, 0);

        // Old Bazaar ground
        var geoBazaarGround = new THREE.BoxGeometry(160, 0.3, 100);
        var matBazaarGround = matLambert(0xCC8833);
        addMesh(geoBazaarGround, matBazaarGround, -180, 0.15, -60);

        // Kale hill approximation
        var geoHill = new THREE.CylinderGeometry(80, 120, 40, 8);
        var matHill = matLambert(0x8B7355);
        addMesh(geoHill, matHill, -280, 20, -120);
    }

    function buildVardarRiver() {
        // Vardar River — long flat box cutting through the city
        var geoRiver = new THREE.BoxGeometry(700, 0.5, 30);
        var matRiver = matLambert(0x2A6A8A);
        addMesh(geoRiver, matRiver, 0, 0.25, 20);

        // River banks
        var geoBankLeft = new THREE.BoxGeometry(700, 1, 5);
        var matBank = matLambert(0xA0946E);
        addMesh(geoBankLeft, matBank, 0, 0.5, 6);

        var geoBankRight = new THREE.BoxGeometry(700, 1, 5);
        addMesh(geoBankRight, matBank, 0, 0.5, 34);

        // River depth shading strip
        var geoRiverDeep = new THREE.BoxGeometry(700, 0.4, 10);
        var matDeep = matLambert(0x1A4F6A);
        addMesh(geoRiverDeep, matDeep, 0, 0.4, 20);
    }

    function buildStoneBridge() {
        // Stone Bridge (Kamen Most) — 13-arch Roman/Ottoman bridge over Vardar
        var bridgeMat = matLambert(0xC8B890);

        // Main bridge deck
        var geoDeck = new THREE.BoxGeometry(130, 2.5, 12);
        addMesh(geoDeck, bridgeMat, 0, 1.25, 20);

        // 12 stone arch piers below the deck
        for (var i = 0; i < 12; i++) {
            var geoPier = new THREE.BoxGeometry(4, 6, 10);
            addMesh(geoPier, bridgeMat, -55 + i * 10, -2, 20);
        }

        // Ornamental railing posts — left side
        for (var j = 0; j < 13; j++) {
            var geoPost = new THREE.BoxGeometry(1, 3, 1);
            addMesh(geoPost, bridgeMat, -60 + j * 10, 3.5, 15);
        }

        // Ornamental railing posts — right side
        for (var k = 0; k < 13; k++) {
            var geoPostR = new THREE.BoxGeometry(1, 3, 1);
            addMesh(geoPostR, bridgeMat, -60 + k * 10, 3.5, 25);
        }

        // Railing bars
        var geoRailLeft = new THREE.BoxGeometry(130, 0.8, 0.5);
        addMesh(geoRailLeft, bridgeMat, 0, 4.7, 15);
        var geoRailRight = new THREE.BoxGeometry(130, 0.8, 0.5);
        addMesh(geoRailRight, bridgeMat, 0, 4.7, 25);

        // Bridge gate towers at each end
        var geoTowerL = new THREE.BoxGeometry(6, 12, 14);
        addMesh(geoTowerL, bridgeMat, -68, 6, 20);
        var geoTowerR = new THREE.BoxGeometry(6, 12, 14);
        addMesh(geoTowerR, bridgeMat, 68, 6, 20);
    }

    function buildWarriorOnHorse() {
        // Alexander the Great / Warrior on a Horse monument at Macedonia Square
        var bronzeMat = matLambert(0xD4A850);
        var stoneMat = matLambert(0xB0A888);
        var waterMat = matLambert(0x3A8AAA);

        // Massive fountain basin — wide low cylinder
        var geoBasin = new THREE.CylinderGeometry(22, 24, 2, 16);
        addMesh(geoBasin, stoneMat, 0, 1, -30);

        // Basin inner water surface
        var geoWater = new THREE.CylinderGeometry(20, 20, 0.5, 16);
        addMesh(geoWater, waterMat, 0, 1.8, -30);

        // Tall central pedestal
        var geoPedBase = new THREE.BoxGeometry(8, 3, 8);
        addMesh(geoPedBase, stoneMat, 0, 3, -30);

        var geoPedMid = new THREE.BoxGeometry(6, 8, 6);
        addMesh(geoPedMid, stoneMat, 0, 8, -30);

        var geoPedTop = new THREE.BoxGeometry(5, 2, 5);
        addMesh(geoPedTop, stoneMat, 0, 13, -30);

        // Horse body — rearing up (tilted box)
        var geoHorseBody = new THREE.BoxGeometry(3, 6, 7);
        addMesh(geoHorseBody, bronzeMat, 0, 17, -30, -0.4, 0, 0);

        // Horse neck
        var geoHorseNeck = new THREE.CylinderGeometry(1.2, 1.5, 4, 8);
        addMesh(geoHorseNeck, bronzeMat, 0, 21, -31, -0.5, 0, 0);

        // Horse head
        var geoHorseHead = new THREE.BoxGeometry(2, 2.5, 3);
        addMesh(geoHorseHead, bronzeMat, 0, 23.5, -33);

        // Horse front legs raised
        var geoLegFR = new THREE.CylinderGeometry(0.5, 0.6, 4, 6);
        addMesh(geoLegFR, bronzeMat, 1, 16, -26, -0.8, 0, 0.2);
        var geoLegFL = new THREE.CylinderGeometry(0.5, 0.6, 4, 6);
        addMesh(geoLegFL, bronzeMat, -1, 16, -26, -0.8, 0, -0.2);

        // Horse rear legs
        var geoLegBR = new THREE.CylinderGeometry(0.5, 0.7, 5, 6);
        addMesh(geoLegBR, bronzeMat, 1, 14, -32, 0.1, 0, 0.1);
        var geoLegBL = new THREE.CylinderGeometry(0.5, 0.7, 5, 6);
        addMesh(geoLegBL, bronzeMat, -1, 14, -32, 0.1, 0, -0.1);

        // Horse tail
        var geoTail = new THREE.CylinderGeometry(0.3, 0.6, 4, 6);
        addMesh(geoTail, bronzeMat, 0, 16, -28, 0.8, 0, 0);

        // Rider torso — armored
        var geoRiderTorso = new THREE.BoxGeometry(2.2, 3.5, 2);
        addMesh(geoRiderTorso, bronzeMat, 0, 21, -30);

        // Rider head with helmet
        var geoRiderHead = new THREE.SphereGeometry(0.9, 8, 8);
        addMesh(geoRiderHead, bronzeMat, 0, 24.5, -30);

        // Helmet crest
        var geoHelmetCrest = new THREE.BoxGeometry(0.4, 1.5, 1.8);
        addMesh(geoHelmetCrest, bronzeMat, 0, 25.8, -30);

        // Rider arm holding sword aloft
        var geoArm = new THREE.CylinderGeometry(0.35, 0.4, 4, 6);
        addMesh(geoArm, bronzeMat, 1.5, 23, -30, 0, 0, -1.1);

        // Sword blade
        var geoSwordBlade = new THREE.BoxGeometry(0.3, 5, 0.15);
        addMesh(geoSwordBlade, bronzeMat, 3.5, 26, -30);

        // Sword guard / crossguard
        var geoSwordGuard = new THREE.BoxGeometry(1.5, 0.4, 0.3);
        addMesh(geoSwordGuard, bronzeMat, 3.5, 23.5, -30);

        // Water jet nozzles around basin
        var jetMat = matLambert(0x5AB8D8);
        for (var n = 0; n < 8; n++) {
            var angle = (n / 8) * Math.PI * 2;
            var jx = Math.cos(angle) * 16;
            var jz = Math.sin(angle) * 16 - 30;
            var geoJet = new THREE.CylinderGeometry(0.15, 0.3, 5, 5);
            addMesh(geoJet, jetMat, jx, 3, jz, -0.3, angle, 0);
        }

        // Allegorical figures at pedestal base
        for (var f = 0; f < 4; f++) {
            var fa = (f / 4) * Math.PI * 2;
            var fx = Math.cos(fa) * 4;
            var fz = Math.sin(fa) * 4 - 30;
            var geoFigure = new THREE.CylinderGeometry(0.4, 0.6, 4, 6);
            addMesh(geoFigure, bronzeMat, fx, 3.5, fz);
        }
    }

    function buildMacedoniaSquare() {
        // Triumphal Arch — Macedonia Gate
        var archMat = matLambert(0xE8E0D0);

        // Left pillar
        var geoArchL = new THREE.BoxGeometry(6, 20, 6);
        addMesh(geoArchL, archMat, -12, 10, -60);

        // Right pillar
        var geoArchR = new THREE.BoxGeometry(6, 20, 6);
        addMesh(geoArchR, archMat, 12, 10, -60);

        // Arch lintel top
        var geoLintel = new THREE.BoxGeometry(30, 6, 6);
        addMesh(geoLintel, archMat, 0, 20, -60);

        // Arch crowning attic story
        var geoAttic = new THREE.BoxGeometry(34, 5, 7);
        addMesh(geoAttic, archMat, 0, 25.5, -60);

        // Arch relief panels (decorative boxes)
        var geoPanelL = new THREE.BoxGeometry(4, 5, 1);
        addMesh(geoPanelL, matLambert(0xD4C8B8), -8, 15, -57);
        var geoPanelR = new THREE.BoxGeometry(4, 5, 1);
        addMesh(geoPanelR, matLambert(0xD4C8B8), 8, 15, -57);

        // Plaza fountain (secondary)
        var geoFountainBase = new THREE.CylinderGeometry(8, 9, 1.5, 12);
        addMesh(geoFountainBase, matLambert(0xD0C8B8), 40, 0.75, -40);

        var geoFountainWater = new THREE.CylinderGeometry(7, 7, 0.5, 12);
        addMesh(geoFountainWater, matLambert(0x3A8AAA), 40, 1.5, -40);

        var geoFountainCenter = new THREE.CylinderGeometry(0.8, 1, 6, 8);
        addMesh(geoFountainCenter, matLambert(0xD0C8B8), 40, 4, -40);

        // Allegorical sculptures on square
        var sculpMat = matLambert(0xC8C0B0);
        var sculptPositions = [
            [-30, -50], [30, -50], [-30, -70], [30, -70]
        ];
        for (var s = 0; s < sculptPositions.length; s++) {
            var geoSculpt = new THREE.CylinderGeometry(0.5, 0.8, 5, 6);
            addMesh(geoSculpt, sculpMat, sculptPositions[s][0], 2.5, sculptPositions[s][1]);
            var geoSculptTop = new THREE.SphereGeometry(0.8, 6, 6);
            addMesh(geoSculptTop, sculpMat, sculptPositions[s][0], 6, sculptPositions[s][1]);
        }

        // Flag poles around the square
        var flagMat = matLambert(0xCCCCCC);
        for (var fp = 0; fp < 6; fp++) {
            var geoFlagPole = new THREE.CylinderGeometry(0.15, 0.2, 14, 5);
            addMesh(geoFlagPole, flagMat, -25 + fp * 10, 7, -80);
            var geoFlag = new THREE.BoxGeometry(3, 2, 0.1);
            addMesh(geoFlag, matLambert(0xCC2222), -23.5 + fp * 10, 13, -80);
        }
    }

    function buildKaleFortress() {
        // Kale Fortress — Byzantine/Ottoman hilltop fortress
        var wallMat = matLambert(0xC8B880);
        var towerMat = matLambert(0xB8A870);

        // Hilltop platform (approximated as flat box on top of hill)
        var geoPlatform = new THREE.BoxGeometry(100, 4, 80);
        addMesh(geoPlatform, wallMat, -280, 42, -120);

        // Main curtain walls — north, south, east, west
        var geoWallN = new THREE.BoxGeometry(100, 12, 5);
        addMesh(geoWallN, wallMat, -280, 49, -80);

        var geoWallS = new THREE.BoxGeometry(100, 12, 5);
        addMesh(geoWallS, wallMat, -280, 49, -160);

        var geoWallE = new THREE.BoxGeometry(5, 12, 80);
        addMesh(geoWallE, wallMat, -232, 49, -120);

        var geoWallW = new THREE.BoxGeometry(5, 12, 80);
        addMesh(geoWallW, wallMat, -328, 49, -120);

        // Crenellations on north wall
        for (var c = 0; c < 10; c++) {
            var geoCren = new THREE.BoxGeometry(5, 4, 4);
            addMesh(geoCren, wallMat, -325 + c * 10, 57, -80);
        }

        // Crenellations on south wall
        for (var cs = 0; cs < 10; cs++) {
            var geoCrenS = new THREE.BoxGeometry(5, 4, 4);
            addMesh(geoCrenS, wallMat, -325 + cs * 10, 57, -160);
        }

        // Round towers at corners
        var geoTowerNE = new THREE.CylinderGeometry(8, 9, 18, 10);
        addMesh(geoTowerNE, towerMat, -232, 51, -80);

        var geoTowerNW = new THREE.CylinderGeometry(8, 9, 18, 10);
        addMesh(geoTowerNW, towerMat, -328, 51, -80);

        var geoTowerSE = new THREE.CylinderGeometry(8, 9, 18, 10);
        addMesh(geoTowerSE, towerMat, -232, 51, -160);

        var geoTowerSW = new THREE.CylinderGeometry(8, 9, 18, 10);
        addMesh(geoTowerSW, towerMat, -328, 51, -160);

        // Square mid-wall towers
        var geoTowerMidN = new THREE.BoxGeometry(10, 16, 10);
        addMesh(geoTowerMidN, towerMat, -280, 52, -80);

        var geoTowerMidS = new THREE.BoxGeometry(10, 16, 10);
        addMesh(geoTowerMidS, towerMat, -280, 52, -160);

        // Conical tower roofs
        var geoRoofNE = new THREE.ConeGeometry(9, 8, 10);
        addMesh(geoRoofNE, matLambert(0xA09070), -232, 63, -80);

        var geoRoofNW = new THREE.ConeGeometry(9, 8, 10);
        addMesh(geoRoofNW, matLambert(0xA09070), -328, 63, -80);

        var geoRoofSE = new THREE.ConeGeometry(9, 8, 10);
        addMesh(geoRoofSE, matLambert(0xA09070), -232, 63, -160);

        var geoRoofSW = new THREE.ConeGeometry(9, 8, 10);
        addMesh(geoRoofSW, matLambert(0xA09070), -328, 63, -160);

        // Inner keep / donjon
        var geoKeep = new THREE.BoxGeometry(20, 22, 20);
        addMesh(geoKeep, towerMat, -280, 54, -120);

        var geoKeepRoof = new THREE.BoxGeometry(22, 3, 22);
        addMesh(geoKeepRoof, wallMat, -280, 66.5, -120);

        // Gate arch
        var geoGateL = new THREE.BoxGeometry(3, 10, 4);
        addMesh(geoGateL, wallMat, -274, 47, -80);
        var geoGateR = new THREE.BoxGeometry(3, 10, 4);
        addMesh(geoGateR, wallMat, -286, 47, -80);
        var geoGateTop = new THREE.BoxGeometry(12, 3, 4);
        addMesh(geoGateTop, wallMat, -280, 50.5, -80);
    }

    function buildOldBazaar() {
        // Old Bazaar (Čaršija) — Ottoman bazaar complex
        var bazaarMat = matLambert(0xCC8833);
        var roofMat = matLambert(0x885522);
        var stoneMat = matLambert(0xBBA077);

        // Main covered market lane — east-west
        var geoLane1 = new THREE.BoxGeometry(120, 0.2, 8);
        addMesh(geoLane1, stoneMat, -180, 0.1, -60);

        // Covered lane roof arcade
        var geoRoof1 = new THREE.BoxGeometry(120, 1, 10);
        addMesh(geoRoof1, roofMat, -180, 6, -60);

        // Second covered lane — parallel
        var geoLane2 = new THREE.BoxGeometry(120, 0.2, 8);
        addMesh(geoLane2, stoneMat, -180, 0.1, -80);
        var geoRoof2 = new THREE.BoxGeometry(120, 1, 10);
        addMesh(geoRoof2, roofMat, -180, 6, -80);

        // Cross lane
        var geoLane3 = new THREE.BoxGeometry(8, 0.2, 40);
        addMesh(geoLane3, stoneMat, -140, 0.1, -70);
        var geoRoof3 = new THREE.BoxGeometry(10, 1, 40);
        addMesh(geoRoof3, roofMat, -140, 6, -70);

        // Shop rows — north side of main lane
        for (var sh = 0; sh < 10; sh++) {
            var geoShop = new THREE.BoxGeometry(10, 5, 8);
            addMesh(geoShop, bazaarMat, -235 + sh * 12, 2.5, -50);
        }

        // Shop rows — south side
        for (var shs = 0; shs < 10; shs++) {
            var geoShopS = new THREE.BoxGeometry(10, 5, 8);
            addMesh(geoShopS, bazaarMat, -235 + shs * 12, 2.5, -90);
        }

        // Hans (caravanserai) — large courtyard inn
        var geoHanWallN = new THREE.BoxGeometry(40, 8, 3);
        addMesh(geoHanWallN, stoneMat, -200, 4, -110);
        var geoHanWallS = new THREE.BoxGeometry(40, 8, 3);
        addMesh(geoHanWallS, stoneMat, -200, 4, -140);
        var geoHanWallE = new THREE.BoxGeometry(3, 8, 30);
        addMesh(geoHanWallE, stoneMat, -182, 4, -125);
        var geoHanWallW = new THREE.BoxGeometry(3, 8, 30);
        addMesh(geoHanWallW, stoneMat, -218, 4, -125);

        // Han inner courtyard rooms
        for (var hr = 0; hr < 5; hr++) {
            var geoHanRoom = new THREE.BoxGeometry(7, 5, 6);
            addMesh(geoHanRoom, bazaarMat, -216 + hr * 8, 2.5, -113);
        }

        // Daut Pasha Hamam bathhouse — large domed structure
        var geoHamamBase = new THREE.BoxGeometry(30, 6, 25);
        addMesh(geoHamamBase, matLambert(0xC09050), -155, 3, -95);

        // Hamam domes (multiple small domes = cylinders topped with spheres)
        for (var d = 0; d < 3; d++) {
            var geoDomeCyl = new THREE.CylinderGeometry(4, 5, 3, 8);
            addMesh(geoDomeCyl, matLambert(0xB08848), -165 + d * 8, 8.5, -95);
            var geoDomeSph = new THREE.SphereGeometry(4, 8, 6);
            addMesh(geoDomeSph, matLambert(0xB08848), -165 + d * 8, 12, -95);
        }

        // Painted Mosque (Alaca Mosque) with frescoed exterior
        var geoMosqueBase = new THREE.BoxGeometry(22, 8, 22);
        addMesh(geoMosqueBase, matLambert(0xE8C878), -115, 4, -75);

        // Mosque dome
        var geoMosqueDomeCyl = new THREE.CylinderGeometry(8, 9, 3, 12);
        addMesh(geoMosqueDomeCyl, matLambert(0xD4B864), -115, 9.5, -75);
        var geoMosqueDome = new THREE.SphereGeometry(8, 12, 8);
        addMesh(geoMosqueDome, matLambert(0xD4B864), -115, 13, -75);

        // Mosque minaret
        var geoMinaretShaft = new THREE.CylinderGeometry(1.2, 1.8, 22, 8);
        addMesh(geoMinaretShaft, matLambert(0xE0C880), -127, 11, -75);
        var geoMinaretBalcony = new THREE.CylinderGeometry(2.2, 2.2, 1, 8);
        addMesh(geoMinaretBalcony, matLambert(0xD4B864), -127, 22.5, -75);
        var geoMinaretTop = new THREE.ConeGeometry(1.2, 5, 8);
        addMesh(geoMinaretTop, matLambert(0xC8A840), -127, 26, -75);

        // Mosque entrance porch
        var geoPorch = new THREE.BoxGeometry(10, 5, 4);
        addMesh(geoPorch, matLambert(0xE0C870), -115, 2.5, -65);

        // Colorful fresco panel decorations on mosque walls
        var frescoColors = [0xE05030, 0x4080C0, 0x50A050, 0xD4A020];
        for (var fr = 0; fr < 4; fr++) {
            var geoFresco = new THREE.BoxGeometry(5, 4, 0.3);
            addMesh(geoFresco, matLambert(frescoColors[fr]), -122 + fr * 6, 5, -67);
        }

        // Bazaar entrance gate
        var geoGatePost1 = new THREE.BoxGeometry(3, 10, 3);
        addMesh(geoGatePost1, stoneMat, -108, 5, -60);
        var geoGatePost2 = new THREE.BoxGeometry(3, 10, 3);
        addMesh(geoGatePost2, stoneMat, -108, 5, -70);
        var geoGateArch = new THREE.BoxGeometry(3, 4, 14);
        addMesh(geoGateArch, stoneMat, -108, 11, -65);

        // Bazaar clock tower
        var geoClockTower = new THREE.BoxGeometry(5, 18, 5);
        addMesh(geoClockTower, stoneMat, -170, 9, -65);
        var geoClockRoof = new THREE.ConeGeometry(4, 5, 4);
        addMesh(geoClockRoof, roofMat, -170, 20.5, -65);
        var geoClockFace = new THREE.BoxGeometry(4, 4, 0.5);
        addMesh(geoClockFace, matLambert(0xF0E8D0), -170, 13, -63);
    }

    function buildMustaphaPashaMosque() {
        // Mustafa Pasha Mosque — Ottoman mosque with garden
        var mosqueMat = matLambert(0xD4C890);
        var minaretMat = matLambert(0xC8BC80);
        var gardenMat = matLambert(0x5A8A3A);

        // Mosque main building
        var geoBody = new THREE.BoxGeometry(28, 10, 28);
        addMesh(geoBody, mosqueMat, -240, 5, -50);

        // Drum below dome
        var geoDrum = new THREE.CylinderGeometry(10, 11, 4, 12);
        addMesh(geoDrum, mosqueMat, -240, 12, -50);

        // Main dome
        var geoDome = new THREE.SphereGeometry(10, 12, 8);
        addMesh(geoDome, minaretMat, -240, 17, -50);

        // Minaret shaft
        var geoMinShaft = new THREE.CylinderGeometry(1.4, 2, 28, 8);
        addMesh(geoMinShaft, minaretMat, -254, 14, -50);

        // Minaret balcony
        var geoMinBalc = new THREE.CylinderGeometry(2.5, 2.5, 1, 8);
        addMesh(geoMinBalc, mosqueMat, -254, 28.5, -50);

        // Minaret cap
        var geoMinCap = new THREE.ConeGeometry(1.4, 6, 8);
        addMesh(geoMinCap, minaretMat, -254, 32.5, -50);

        // Entrance porch / portico
        var geoPortico = new THREE.BoxGeometry(28, 5, 6);
        addMesh(geoPortico, mosqueMat, -240, 2.5, -37);

        // Portico columns
        for (var pc = 0; pc < 4; pc++) {
            var geoPorCol = new THREE.CylinderGeometry(0.6, 0.7, 5, 8);
            addMesh(geoPorCol, matLambert(0xE0D8C0), -252 + pc * 8, 2.5, -34);
        }

        // Garden courtyard wall
        var geoGardenWallN = new THREE.BoxGeometry(50, 3, 1.5);
        addMesh(geoGardenWallN, matLambert(0xB8AC78), -240, 1.5, -20);
        var geoGardenWallE = new THREE.BoxGeometry(1.5, 3, 35);
        addMesh(geoGardenWallE, matLambert(0xB8AC78), -215, 1.5, -37);
        var geoGardenWallW = new THREE.BoxGeometry(1.5, 3, 35);
        addMesh(geoGardenWallW, matLambert(0xB8AC78), -265, 1.5, -37);

        // Garden trees (cylinders + cones)
        var treeTrunkMat = matLambert(0x6B4226);
        var treeTopMat = matLambert(0x3A7A2A);
        var treePositions = [
            [-230, -28], [-240, -28], [-250, -28], [-230, -45], [-250, -45]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var geoTrunk = new THREE.CylinderGeometry(0.4, 0.5, 4, 6);
            addMesh(geoTrunk, treeTrunkMat, treePositions[t][0], 2, treePositions[t][1]);
            var geoTreeTop = new THREE.ConeGeometry(3, 6, 8);
            addMesh(geoTreeTop, treeTopMat, treePositions[t][0], 7, treePositions[t][1]);
        }

        // Garden fountain
        var geoGarFountain = new THREE.CylinderGeometry(4, 5, 1, 10);
        addMesh(geoGarFountain, matLambert(0xC8BC90), -240, 0.5, -37);
        var geoGarWater = new THREE.CylinderGeometry(3.5, 3.5, 0.3, 10);
        addMesh(geoGarWater, matLambert(0x3A8AAA), -240, 1, -37);
    }

    function buildHolocaustMemorial() {
        // Holocaust Memorial Center — Skopje Jewish heritage museum
        var memMat = matLambert(0x333344);
        var stoneMat = matLambert(0x555566);

        // Main memorial building — dark modernist block
        var geoBuilding = new THREE.BoxGeometry(30, 12, 20);
        addMesh(geoBuilding, memMat, 120, 6, -50);

        // Angled entrance canopy
        var geoCanopy = new THREE.BoxGeometry(14, 0.8, 8);
        addMesh(geoCanopy, stoneMat, 110, 6, -41, 0.2, 0, 0);

        // Memorial stele / pillar — Star of David approximated with box columns
        var geoStele1 = new THREE.BoxGeometry(1, 8, 1);
        addMesh(geoStele1, matLambert(0x444455), 118, 4, -35);
        var geoStele2 = new THREE.BoxGeometry(1, 8, 1);
        addMesh(geoStele2, matLambert(0x444455), 120, 4, -35);
        var geoStele3 = new THREE.BoxGeometry(1, 8, 1);
        addMesh(geoStele3, matLambert(0x444455), 122, 4, -35);

        // Memorial cross beam
        var geoBeam = new THREE.BoxGeometry(8, 1, 1);
        addMesh(geoBeam, matLambert(0x444455), 120, 7.5, -35);

        // Reflection pool
        var geoPool = new THREE.BoxGeometry(20, 0.3, 12);
        addMesh(geoPool, matLambert(0x223344), 120, 0.15, -70);

        // Low memorial walls with inscriptions (represented as flat boxes)
        var geoWall1 = new THREE.BoxGeometry(25, 2, 0.5);
        addMesh(geoWall1, stoneMat, 120, 1, -80);
        var geoWall2 = new THREE.BoxGeometry(25, 2, 0.5);
        addMesh(geoWall2, stoneMat, 120, 1, -60);

        // Menorah sculpture (approximated with cylinders)
        var geoMenBase = new THREE.CylinderGeometry(0.3, 0.6, 1.5, 6);
        addMesh(geoMenBase, matLambert(0xAA9900), 130, 0.75, -40);
        var geoMenCenter = new THREE.CylinderGeometry(0.2, 0.25, 4, 6);
        addMesh(geoMenCenter, matLambert(0xAA9900), 130, 3.5, -40);
        // Menorah arms
        for (var ma = -3; ma <= 3; ma++) {
            if (ma !== 0) {
                var geoArm = new THREE.CylinderGeometry(0.12, 0.15, 2.5, 5);
                addMesh(geoArm, matLambert(0xAA9900), 130 + ma * 0.7, 3, -40, 0, 0, 0.5 * (ma / Math.abs(ma)));
            }
        }
    }

    function buildSkopje2014Buildings() {
        // Skopje 2014 Project — neoclassical facade buildings
        var neoMat = matLambert(0xF0EDE8);
        var columnMat = matLambert(0xE8E4DC);
        var accentMat = matLambert(0xD4C8B0);

        // Museum of Macedonia — large neoclassical block
        var geoMuseum = new THREE.BoxGeometry(50, 18, 30);
        addMesh(geoMuseum, neoMat, 80, 9, 60);

        // Museum colonnade — front facade columns
        for (var mc = 0; mc < 8; mc++) {
            var geoMCol = new THREE.CylinderGeometry(0.9, 1.1, 14, 8);
            addMesh(geoMCol, columnMat, 58 + mc * 6, 7, 46);
        }

        // Museum pediment
        var geoPediment = new THREE.BoxGeometry(52, 4, 5);
        addMesh(geoPediment, neoMat, 80, 19, 47);
        var geoPedimentTriangle = new THREE.ConeGeometry(26, 8, 3);
        addMesh(geoPedimentTriangle, neoMat, 80, 25, 47, 0, 0, 0);

        // Museum steps
        var geoSteps1 = new THREE.BoxGeometry(52, 1, 4);
        addMesh(geoSteps1, accentMat, 80, 0.5, 43);
        var geoSteps2 = new THREE.BoxGeometry(52, 1, 4);
        addMesh(geoSteps2, accentMat, 80, 1.5, 46);

        // Government buildings row — neoclassical
        var buildingPositions = [
            [40, 90], [-40, 90], [80, 90]
        ];
        for (var b = 0; b < buildingPositions.length; b++) {
            var geoGovBldg = new THREE.BoxGeometry(35, 16, 25);
            addMesh(geoGovBldg, neoMat, buildingPositions[b][0], 8, buildingPositions[b][1]);

            // Cornice
            var geoCorn = new THREE.BoxGeometry(37, 2, 27);
            addMesh(geoCorn, accentMat, buildingPositions[b][0], 17, buildingPositions[b][1]);

            // Facade columns
            for (var gc = 0; gc < 4; gc++) {
                var geoGovCol = new THREE.CylinderGeometry(0.6, 0.7, 12, 8);
                addMesh(geoGovCol, columnMat, buildingPositions[b][0] - 9 + gc * 6, 6, buildingPositions[b][1] - 13);
            }
        }

        // Statue on top of museum — winged victory approximation
        var geoStatuePed = new THREE.BoxGeometry(3, 5, 3);
        addMesh(geoStatuePed, neoMat, 80, 20.5, 75);
        var geoStatueFig = new THREE.CylinderGeometry(0.5, 0.8, 6, 6);
        addMesh(geoStatueFig, matLambert(0xD4A850), 80, 25.5, 75);
        var geoStatueHead = new THREE.SphereGeometry(0.7, 8, 6);
        addMesh(geoStatueHead, matLambert(0xD4A850), 80, 29, 75);

        // Skopje 2014 themed lamp posts
        var lampMat = matLambert(0x222222);
        var lampGlowMat = matLambert(0xFFEE88);
        for (var lp = 0; lp < 5; lp++) {
            var geoLampPost = new THREE.CylinderGeometry(0.18, 0.22, 10, 6);
            addMesh(geoLampPost, lampMat, -20 + lp * 20, 5, 45);
            var geoLampHead = new THREE.SphereGeometry(0.6, 6, 6);
            addMesh(geoLampHead, lampGlowMat, -20 + lp * 20, 10.5, 45);
        }
    }

    function buildMillenniumCross() {
        // Millennium Cross on Mount Vodno — 66m illuminated cross
        var crossMat = matLambert(0xCCCCCC);
        var mountainMat = matLambert(0x667744);
        var cableMat = matLambert(0x888888);

        // Mount Vodno hill mass
        var geoMountain = new THREE.ConeGeometry(120, 200, 8);
        addMesh(geoMountain, mountainMat, 300, 100, -250);

        // Cross vertical shaft
        var geoCrossVertical = new THREE.BoxGeometry(3, 66, 3);
        addMesh(geoCrossVertical, crossMat, 300, 233, -250);

        // Cross horizontal beam
        var geoCrossHorizontal = new THREE.BoxGeometry(30, 3, 3);
        addMesh(geoCrossHorizontal, crossMat, 300, 222, -250);

        // Cross illumination panels (light strips)
        var lightMat = matLambert(0xFFFFEE);
        var geoLightStrip = new THREE.BoxGeometry(1, 60, 1);
        addMesh(geoLightStrip, lightMat, 301.5, 233, -249);
        var geoLightStripH = new THREE.BoxGeometry(28, 1, 1);
        addMesh(geoLightStripH, lightMat, 300, 222, -249);

        // Cable car pylons going up the mountain
        var pylonMat = matLambert(0x888888);
        for (var py = 0; py < 4; py++) {
            var height = 8 + py * 20;
            var geoP = new THREE.CylinderGeometry(0.8, 1, height, 6);
            addMesh(geoP, pylonMat, 150 + py * 40, height / 2, -180 - py * 15);

            // Cable car box
            var geoCableCar = new THREE.BoxGeometry(2.5, 3, 1.5);
            addMesh(geoCableCar, matLambert(0xEE4422), 150 + py * 40, height + 2, -180 - py * 15);
        }

        // Summit plateau
        var geoSummitPlat = new THREE.CylinderGeometry(15, 18, 3, 8);
        addMesh(geoSummitPlat, mountainMat, 300, 201.5, -250);

        // Cross base foundation
        var geoCrossBase = new THREE.BoxGeometry(10, 5, 10);
        addMesh(geoCrossBase, crossMat, 300, 204.5, -250);
    }

    function update(delta) {
        // Static environment — no animation needed
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
