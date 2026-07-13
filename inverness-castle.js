window.InvernessCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 19880;
    var CY = 0;
    var CZ = 0;

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildCastleHill();
        buildInvernessCastle();
        buildRiverNess();
        buildBridges();
        buildCathedral();
        buildVictorianMarket();
        buildHighStreet();
        buildOldHighChurch();
        buildMuseum();
        buildEdenCourtTheatre();
        buildNessIslands();
        buildTomnahurichHill();
        buildCrownArea();
        buildRailwayStation();
        buildStreetLamps();
    }

    function buildGround() {
        // Ground base — flat city ground using thin box
        var geoGround = new THREE.BoxGeometry(900, 1, 900);
        makeMesh(geoGround, 0x7a9e6a, CX, CY - 0.5, CZ);

        // Pavement areas around city centre
        var geoPave = new THREE.BoxGeometry(300, 0.5, 200);
        makeMesh(geoPave, 0xD8D0C0, CX, CY, CZ + 20);

        // Road surface High Street
        var geoRoad = new THREE.BoxGeometry(250, 0.6, 18);
        makeMesh(geoRoad, 0x555555, CX, CY, CZ + 10);
    }

    function buildCastleHill() {
        // The red sandstone hill the castle sits on
        var geoHill = new THREE.CylinderGeometry(55, 80, 28, 8);
        makeMesh(geoHill, 0x8B7355, CX - 120, CY + 14, CZ - 80);

        // Upper hill plateau
        var geoPlat = new THREE.CylinderGeometry(40, 52, 6, 8);
        makeMesh(geoPlat, 0x7a6a45, CX - 120, CY + 31, CZ - 80);
    }

    function buildInvernessCastle() {
        var bx = CX - 120;
        var by = CY + 34;
        var bz = CZ - 80;

        // Main castle block — central keep
        var geoKeep = new THREE.BoxGeometry(36, 28, 22);
        makeMesh(geoKeep, 0xCD5C5C, bx, by + 14, bz);

        // North wing
        var geoNWing = new THREE.BoxGeometry(18, 22, 14);
        makeMesh(geoNWing, 0xCD5C5C, bx - 22, by + 11, bz - 4);

        // South wing
        var geoSWing = new THREE.BoxGeometry(18, 22, 14);
        makeMesh(geoSWing, 0xCD5C5C, bx - 22, by + 11, bz + 4);

        // West facade connecting block
        var geoWFront = new THREE.BoxGeometry(8, 26, 22);
        makeMesh(geoWFront, 0xB84040, bx - 18, by + 13, bz);

        // East rear block
        var geoERear = new THREE.BoxGeometry(12, 20, 18);
        makeMesh(geoERear, 0xCD5C5C, bx + 22, by + 10, bz);

        // Round tower — north (CylinderGeometry)
        var geoTowerN = new THREE.CylinderGeometry(6, 7, 34, 12);
        makeMesh(geoTowerN, 0xC44040, bx - 18, by + 17, bz - 11);

        // Round tower — south
        var geoTowerS = new THREE.CylinderGeometry(6, 7, 34, 12);
        makeMesh(geoTowerS, 0xC44040, bx - 18, by + 17, bz + 11);

        // Corner turret — NE
        var geoTurretNE = new THREE.CylinderGeometry(3.5, 4, 20, 10);
        makeMesh(geoTurretNE, 0xB83030, bx + 18, by + 10, bz - 11);

        // Corner turret — SE
        var geoTurretSE = new THREE.CylinderGeometry(3.5, 4, 20, 10);
        makeMesh(geoTurretSE, 0xB83030, bx + 18, by + 10, bz + 11);

        // Spire on north tower (ConeGeometry)
        var geoSpireN = new THREE.ConeGeometry(7, 14, 12);
        makeMesh(geoSpireN, 0x7a1a1a, bx - 18, by + 38, bz - 11);

        // Spire on south tower
        var geoSpireS = new THREE.ConeGeometry(7, 14, 12);
        makeMesh(geoSpireS, 0x7a1a1a, bx - 18, by + 38, bz + 11);

        // Cone roof on NE turret
        var geoRoofNE = new THREE.ConeGeometry(4.5, 8, 10);
        makeMesh(geoRoofNE, 0x7a1a1a, bx + 18, by + 24, bz - 11);

        // Cone roof on SE turret
        var geoRoofSE = new THREE.ConeGeometry(4.5, 8, 10);
        makeMesh(geoRoofSE, 0x7a1a1a, bx + 18, by + 24, bz + 11);

        // Battlements — north parapet row (boxes)
        for (var i = 0; i < 5; i++) {
            var geoBat = new THREE.BoxGeometry(3, 3, 2);
            makeMesh(geoBat, 0xAA3030, bx - 8 + i * 7, by + 29, bz - 11);
        }

        // Battlements — south parapet row
        for (var j = 0; j < 5; j++) {
            var geoBatS = new THREE.BoxGeometry(3, 3, 2);
            makeMesh(geoBatS, 0xAA3030, bx - 8 + j * 7, by + 29, bz + 11);
        }

        // Battlements — east parapet
        for (var k = 0; k < 3; k++) {
            var geoBatE = new THREE.BoxGeometry(2, 3, 3);
            makeMesh(geoBatE, 0xAA3030, bx + 18, by + 27, bz - 4 + k * 4);
        }

        // Flagpole (thin cylinder)
        var geoFlagPole = new THREE.CylinderGeometry(0.3, 0.3, 12, 6);
        makeMesh(geoFlagPole, 0x888888, bx, by + 42, bz);

        // Flag (small box)
        var geoFlag = new THREE.BoxGeometry(5, 3, 0.2);
        makeMesh(geoFlag, 0x003399, bx + 2.5, by + 47, bz);

        // Castle entrance archway base
        var geoArch = new THREE.BoxGeometry(8, 10, 4);
        makeMesh(geoArch, 0x994040, bx + 4, by + 5, bz);

        // Courtyard wall segment
        var geoWall = new THREE.BoxGeometry(40, 8, 2);
        makeMesh(geoWall, 0xB84040, bx, by + 4, bz + 14);

        // Steps up to castle entrance
        var geoStep1 = new THREE.BoxGeometry(10, 2, 4);
        makeMesh(geoStep1, 0x9a7a5a, bx + 10, by + 1, bz);
        var geoStep2 = new THREE.BoxGeometry(10, 4, 3);
        makeMesh(geoStep2, 0x9a7a5a, bx + 8, by + 2, bz);
    }

    function buildRiverNess() {
        // River Ness flows roughly north-south through the city
        // Represented as a series of wide flat boxes

        // Main river channel — south section
        var geoRiverS = new THREE.BoxGeometry(28, 1, 250);
        makeMesh(geoRiverS, 0x006994, CX + 30, CY - 0.3, CZ + 100);

        // Main river channel — centre
        var geoRiverC = new THREE.BoxGeometry(30, 1, 200);
        makeMesh(geoRiverC, 0x1570A0, CX + 28, CY - 0.3, CZ - 20);

        // Main river channel — north section
        var geoRiverN = new THREE.BoxGeometry(26, 1, 180);
        makeMesh(geoRiverN, 0x006994, CX + 26, CY - 0.3, CZ - 200);

        // River bank — east side
        var geoBankE = new THREE.BoxGeometry(8, 2, 600);
        makeMesh(geoBankE, 0x8B7355, CX + 46, CY + 0.5, CZ - 50);

        // River bank — west side
        var geoBankW = new THREE.BoxGeometry(8, 2, 600);
        makeMesh(geoBankW, 0x8B7355, CX + 12, CY + 0.5, CZ - 50);

        // River slight bend — box representing the curve at Ness Islands
        var geoRiverBend = new THREE.BoxGeometry(35, 1, 60);
        makeMesh(geoRiverBend, 0x006994, CX + 35, CY - 0.3, CZ + 220);
    }

    function buildBridges() {
        // Ness Bridge — main city centre bridge
        var geoNessBridge = new THREE.BoxGeometry(80, 3, 16);
        makeMesh(geoNessBridge, 0xD4C9B0, CX - 10, CY + 1.5, CZ + 20);

        // Bridge parapets
        var geoParN = new THREE.BoxGeometry(80, 4, 2);
        makeMesh(geoParN, 0xC8B89A, CX - 10, CY + 3.5, CZ + 12);
        var geoParS = new THREE.BoxGeometry(80, 4, 2);
        makeMesh(geoParS, 0xC8B89A, CX - 10, CY + 3.5, CZ + 28);

        // Greig Street Bridge (pedestrian)
        var geoGreig = new THREE.BoxGeometry(70, 2, 8);
        makeMesh(geoGreig, 0x999999, CX - 5, CY + 1, CZ - 80);

        // Greig Street bridge supports
        var geoSupN = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        makeMesh(geoSupN, 0x777777, CX + 15, CY + 4, CZ - 80);
        var geoSupS = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        makeMesh(geoSupS, CX + 45, CY + 4, CZ - 80);

        // Infirmary Bridge
        var geoInfirm = new THREE.BoxGeometry(65, 2, 10);
        makeMesh(geoInfirm, 0xC8B89A, CX - 8, CY + 1, CZ - 160);

        // Suspension bridge to Ness Islands
        var geoSusp = new THREE.BoxGeometry(50, 1.5, 6);
        makeMesh(geoSusp, 0x888888, CX + 8, CY + 2, CZ + 200);

        // Suspension bridge pylons
        var geoPylonA = new THREE.BoxGeometry(2, 14, 2);
        makeMesh(geoPylonA, 0x666666, CX - 8, CY + 7, CZ + 200);
        var geoPylonB = new THREE.BoxGeometry(2, 14, 2);
        makeMesh(geoPylonB, 0x666666, CX + 25, CY + 7, CZ + 200);
    }

    function buildCathedral() {
        // Inverness Cathedral — sandstone twin-tower cathedral on west bank
        var cx = CX - 30;
        var cy = CY;
        var cz = CZ - 60;

        // Nave main body
        var geoNave = new THREE.BoxGeometry(22, 18, 50);
        makeMesh(geoNave, 0xC8B89A, cx, cy + 9, cz);

        // Nave roof (ridge)
        var geoNaveRoof = new THREE.BoxGeometry(20, 6, 48);
        makeMesh(geoNaveRoof, 0xB0A08A, cx, cy + 21, cz);

        // Apse (east end)
        var geoApse = new THREE.CylinderGeometry(9, 10, 16, 8);
        makeMesh(geoApse, 0xC8B89A, cx, cy + 8, cz + 28);

        // Apse roof cone
        var geoApseRoof = new THREE.ConeGeometry(10, 10, 8);
        makeMesh(geoApseRoof, 0xB0A08A, cx, cy + 21, cz + 28);

        // North tower
        var geoTowerNCath = new THREE.BoxGeometry(10, 36, 10);
        makeMesh(geoTowerNCath, 0xC8B89A, cx - 9, cy + 18, cz - 24);

        // South tower
        var geoTowerSCath = new THREE.BoxGeometry(10, 36, 10);
        makeMesh(geoTowerSCath, 0xC8B89A, cx + 9, cy + 18, cz - 24);

        // North tower spire
        var geoSpireNCath = new THREE.ConeGeometry(6, 16, 8);
        makeMesh(geoSpireNCath, 0x9A8A7A, cx - 9, cy + 44, cz - 24);

        // South tower spire
        var geoSpireSCath = new THREE.ConeGeometry(6, 16, 8);
        makeMesh(geoSpireSCath, 0x9A8A7A, cx + 9, cy + 44, cz - 24);

        // Transept north
        var geoTransN = new THREE.BoxGeometry(14, 14, 16);
        makeMesh(geoTransN, 0xC8B89A, cx - 15, cy + 7, cz);

        // Transept south
        var geoTransS = new THREE.BoxGeometry(14, 14, 16);
        makeMesh(geoTransS, 0xC8B89A, cx + 15, cy + 7, cz);

        // Cathedral grounds low wall
        var geoGrndWall = new THREE.BoxGeometry(60, 3, 2);
        makeMesh(geoGrndWall, 0xAA9A8A, cx, cy + 1.5, cz - 38);
    }

    function buildVictorianMarket() {
        // Victorian Market — covered market hall
        var mx = CX - 20;
        var my = CY;
        var mz = CZ + 50;

        // Main market hall
        var geoHall = new THREE.BoxGeometry(40, 16, 60);
        makeMesh(geoHall, 0xCD5C5C, mx, my + 8, mz);

        // Glass roof (light blue)
        var geoGlassRoof = new THREE.BoxGeometry(36, 6, 56);
        makeMesh(geoGlassRoof, 0x88AACC, mx, my + 19, mz);

        // Roof ridge beam
        var geoRidge = new THREE.BoxGeometry(4, 4, 58);
        makeMesh(geoRidge, 0x8B6050, mx, my + 22, mz);

        // Arcade entrance — north
        var geoArcadeN = new THREE.BoxGeometry(14, 12, 6);
        makeMesh(geoArcadeN, 0xB84040, mx, my + 6, mz - 33);

        // Arcade entrance — south
        var geoArcadeS = new THREE.BoxGeometry(14, 12, 6);
        makeMesh(geoArcadeS, 0xB84040, mx, my + 6, mz + 33);

        // Arcade columns north
        var geoColN1 = new THREE.CylinderGeometry(1, 1.2, 10, 8);
        makeMesh(geoColN1, 0xD4C0B0, mx - 5, my + 5, mz - 36);
        var geoColN2 = new THREE.CylinderGeometry(1, 1.2, 10, 8);
        makeMesh(geoColN2, 0xD4C0B0, mx + 5, my + 5, mz - 36);

        // Side entrance east
        var geoSideE = new THREE.BoxGeometry(6, 10, 12);
        makeMesh(geoSideE, 0xB84040, mx + 23, my + 5, mz);

        // Market clock tower
        var geoClockTower = new THREE.BoxGeometry(6, 22, 6);
        makeMesh(geoClockTower, 0xCD5C5C, mx - 20, my + 11, mz - 30);
        var geoClockCap = new THREE.ConeGeometry(4.5, 8, 4);
        makeMesh(geoClockCap, 0x8B6050, mx - 20, my + 26, mz - 30);
    }

    function buildHighStreet() {
        // High Street — row of Georgian/Victorian commercial buildings east side
        var colours = [0xF5F0E8, 0xCD5C5C, 0xE8E0D8, 0xD4C9B0, 0xF5F0E8, 0xCD5C5C];
        for (var i = 0; i < 6; i++) {
            var geoShop = new THREE.BoxGeometry(14, 14 + i % 3 * 2, 18);
            makeMesh(geoShop, colours[i], CX + 60 + i * 16, CY + 7 + i % 3, CZ + 10);
        }

        // Bridge Street buildings — west side
        var bColours = [0xCD5C5C, 0xF5F0E8, 0xD4C9B0, 0xCD5C5C];
        for (var j = 0; j < 4; j++) {
            var geoBldg = new THREE.BoxGeometry(12, 16, 16);
            makeMesh(geoBldg, bColours[j], CX - 80 - j * 14, CY + 8, CZ + 10);
        }

        // Corner building — Victorian corner block
        var geoCorner = new THREE.BoxGeometry(18, 20, 18);
        makeMesh(geoCorner, 0xCD5C5C, CX + 40, CY + 10, CZ + 20);

        // Corner dome
        var geoCornerDome = new THREE.SphereGeometry(5, 8, 6);
        makeMesh(geoCornerDome, 0x888888, CX + 40, CY + 22, CZ + 20);

        // Town House — civic building on High Street
        var geoTownHouse = new THREE.BoxGeometry(24, 18, 20);
        makeMesh(geoTownHouse, 0xF5F0E8, CX + 20, CY + 9, CZ - 30);

        // Town House columns
        for (var k = 0; k < 4; k++) {
            var geoTHCol = new THREE.CylinderGeometry(0.8, 1, 14, 8);
            makeMesh(geoTHCol, 0xFFFFFF, CX + 9 + k * 5, CY + 7, CZ - 40);
        }

        // Town House pediment
        var geoPediment = new THREE.BoxGeometry(26, 5, 4);
        makeMesh(geoPediment, 0xF5F0E8, CX + 20, CY + 20, CZ - 40);
    }

    function buildOldHighChurch() {
        // Old High Church — ancient church on raised ground above river
        var ox = CX + 50;
        var oy = CY;
        var oz = CZ - 100;

        // Raised churchyard mound
        var geoMound = new THREE.CylinderGeometry(30, 40, 8, 8);
        makeMesh(geoMound, 0x5a7a40, ox, oy + 4, oz);

        // Church nave
        var geoChurch = new THREE.BoxGeometry(16, 14, 36);
        makeMesh(geoChurch, 0xC8B89A, ox, oy + 15, oz);

        // Church roof
        var geoChurchRoof = new THREE.BoxGeometry(14, 5, 34);
        makeMesh(geoChurchRoof, 0xA09080, ox, oy + 24, oz);

        // Square tower
        var geoSqTower = new THREE.BoxGeometry(10, 28, 10);
        makeMesh(geoSqTower, 0xC0B09A, ox, oy + 22, oz - 20);

        // Tower battlements
        var geoTBatN = new THREE.BoxGeometry(12, 3, 3);
        makeMesh(geoTBatN, 0xB0A08A, ox, oy + 37, oz - 18);
        var geoTBatE = new THREE.BoxGeometry(3, 3, 12);
        makeMesh(geoTBatE, 0xB0A08A, ox + 5, oy + 37, oz - 20);

        // Churchyard wall
        var geoYardWall = new THREE.BoxGeometry(70, 4, 2);
        makeMesh(geoYardWall, 0x9A8A7A, ox, oy + 6, oz + 22);
    }

    function buildMuseum() {
        // Inverness Museum & Art Gallery — in town centre
        var mx = CX - 10;
        var my = CY;
        var mz = CZ - 40;

        // Main museum block
        var geoMuseum = new THREE.BoxGeometry(30, 14, 24);
        makeMesh(geoMuseum, 0xD4C9B0, mx, my + 7, mz);

        // Museum entrance portico
        var geoPortico = new THREE.BoxGeometry(16, 12, 8);
        makeMesh(geoPortico, 0xC8BEB0, mx, my + 6, mz - 16);

        // Portico columns
        var geoMusCol1 = new THREE.CylinderGeometry(0.7, 0.8, 10, 8);
        makeMesh(geoMusCol1, 0xDDDDCC, mx - 5, my + 5, mz - 20);
        var geoMusCol2 = new THREE.CylinderGeometry(0.7, 0.8, 10, 8);
        makeMesh(geoMusCol2, 0xDDDDCC, mx, my + 5, mz - 20);
        var geoMusCol3 = new THREE.CylinderGeometry(0.7, 0.8, 10, 8);
        makeMesh(geoMusCol3, 0xDDDDCC, mx + 5, my + 5, mz - 20);

        // Museum upper floor
        var geoMusUpper = new THREE.BoxGeometry(28, 6, 22);
        makeMesh(geoMusUpper, 0xD0C5B8, mx, my + 17, mz);

        // Museum flat roof parapet
        var geoMusPar = new THREE.BoxGeometry(32, 2, 26);
        makeMesh(geoMusPar, 0xC0B8A8, mx, my + 21, mz);
    }

    function buildEdenCourtTheatre() {
        // Eden Court Theatre — modern arts centre on river bank
        var ex = CX - 60;
        var ey = CY;
        var ez = CZ - 120;

        // Modern main auditorium block
        var geoAudi = new THREE.BoxGeometry(40, 18, 36);
        makeMesh(geoAudi, 0xD3D3D3, ex, ey + 9, ez);

        // Theatre fly tower
        var geoFlyTower = new THREE.BoxGeometry(20, 32, 20);
        makeMesh(geoFlyTower, 0xC8C8C8, ex - 5, ey + 16, ez + 8);

        // Glass foyer front
        var geoFoyer = new THREE.BoxGeometry(36, 12, 8);
        makeMesh(geoFoyer, 0xAABBCC, ex, ey + 6, ez - 22);

        // Cinema wing
        var geoCinema = new THREE.BoxGeometry(26, 14, 24);
        makeMesh(geoCinema, 0xBBBBBB, ex + 32, ey + 7, ez);

        // Theatre flat roof
        var geoThRoof = new THREE.BoxGeometry(42, 2, 38);
        makeMesh(geoThRoof, 0xAAAAAA, ex, ey + 19, ez);

        // Bishop's Palace remnant wall (adjacent historic building)
        var geoBPWall = new THREE.BoxGeometry(20, 10, 3);
        makeMesh(geoBPWall, 0xC8B89A, ex + 30, ey + 5, ez - 22);
    }

    function buildNessIslands() {
        // Ness Islands — wooded islands in the river south of city
        var ix = CX + 28;
        var iz = CZ + 230;

        // Main island — north
        var geoIslandN = new THREE.BoxGeometry(22, 2, 38);
        makeMesh(geoIslandN, 0x4a7c3f, ix, CY + 1, iz - 20);

        // Main island — south
        var geoIslandS = new THREE.BoxGeometry(18, 2, 30);
        makeMesh(geoIslandS, 0x4a7c3f, ix, CY + 1, iz + 20);

        // Trees on islands — cylinders as trunks with cone tops
        for (var t = 0; t < 6; t++) {
            var tx = ix - 6 + t * 4;
            var tz = iz - 12 + (t % 3) * 10;
            var geoTrunk = new THREE.CylinderGeometry(0.5, 0.7, 6, 6);
            makeMesh(geoTrunk, 0x5C3A1E, tx, CY + 4, tz);
            var geoCanopy = new THREE.ConeGeometry(3.5, 7, 7);
            makeMesh(geoCanopy, 0x2D6A2D, tx, CY + 11, tz);
        }

        // Second suspension bridge to islands
        var geoSusp2 = new THREE.BoxGeometry(48, 1.5, 5);
        makeMesh(geoSusp2, 0x888888, ix, CY + 2, iz - 38);

        // Bridge pylons
        var geoPyl1 = new THREE.BoxGeometry(1.5, 12, 1.5);
        makeMesh(geoPyl1, 0x666666, ix - 18, CY + 6, iz - 38);
        var geoPyl2 = new THREE.BoxGeometry(1.5, 12, 1.5);
        makeMesh(geoPyl2, 0x666666, ix + 18, CY + 6, iz - 38);
    }

    function buildTomnahurichHill() {
        // Tomnahurich — steep wooded cemetery hill south of city
        var tx = CX - 80;
        var tz = CZ + 280;

        // Hill main mass
        var geoHillMain = new THREE.CylinderGeometry(12, 55, 45, 10);
        makeMesh(geoHillMain, 0x3d6b30, tx, CY + 22, tz);

        // Hill upper cone — distinctive ship-like silhouette
        var geoHillTop = new THREE.ConeGeometry(14, 22, 10);
        makeMesh(geoHillTop, 0x2d5520, tx, CY + 55, tz);

        // Cemetery perimeter wall
        var geoCemWall1 = new THREE.BoxGeometry(120, 3, 2);
        makeMesh(geoCemWall1, 0x888880, tx, CY + 1.5, tz - 58);

        // Cemetery gate pillars
        var geoGatePilL = new THREE.BoxGeometry(3, 8, 3);
        makeMesh(geoGatePilL, 0x999990, tx - 8, CY + 4, tz - 58);
        var geoGatePilR = new THREE.BoxGeometry(3, 8, 3);
        makeMesh(geoGatePilR, 0x999990, tx + 8, CY + 4, tz - 58);

        // Trees on hill slopes
        for (var h = 0; h < 5; h++) {
            var htx = tx - 20 + h * 10;
            var htz = tz + 10 + (h % 2) * 8;
            var geoHTree = new THREE.CylinderGeometry(0.5, 0.8, 8, 6);
            makeMesh(geoHTree, 0x4A2C12, htx, CY + 4, htz);
            var geoHLeaf = new THREE.SphereGeometry(4, 7, 5);
            makeMesh(geoHLeaf, 0x2A5A1A, htx, CY + 12, htz);
        }
    }

    function buildCrownArea() {
        // Crown Area — Victorian villas on slopes above river, east bank
        var villas = [
            [CX + 80, CY, CZ - 60],
            [CX + 96, CY, CZ - 80],
            [CX + 110, CY, CZ - 50],
            [CX + 80, CY, CZ - 110],
            [CX + 96, CY, CZ - 130]
        ];

        for (var v = 0; v < villas.length; v++) {
            var vx = villas[v][0];
            var vy = villas[v][1];
            var vz = villas[v][2];

            // Villa main block
            var geoVilla = new THREE.BoxGeometry(12, 10, 14);
            makeMesh(geoVilla, 0xF5F0E8, vx, vy + 5, vz);

            // Villa roof
            var geoVillaRoof = new THREE.BoxGeometry(13, 4, 15);
            makeMesh(geoVillaRoof, 0x8B5C3A, vx, vy + 12, vz);

            // Bay window
            var geoBay = new THREE.BoxGeometry(4, 7, 5);
            makeMesh(geoBay, 0xEEEAE0, vx, vy + 3.5, vz - 9);
        }

        // Crown slope — raised ground
        var geoCrownSlope = new THREE.BoxGeometry(80, 6, 120);
        makeMesh(geoCrownSlope, 0x5a8040, CX + 95, CY + 3, CZ - 90);
    }

    function buildRailwayStation() {
        // Inverness Railway Station — Victorian terminus
        var sx = CX + 80;
        var sy = CY;
        var sz = CZ + 80;

        // Main station building
        var geoStation = new THREE.BoxGeometry(50, 16, 22);
        makeMesh(geoStation, 0xD4C9B0, sx, sy + 8, sz);

        // Station train shed — large roof structure
        var geoShed = new THREE.BoxGeometry(55, 20, 60);
        makeMesh(geoShed, 0xB8B0A0, sx, sy + 10, sz + 40);

        // Shed roof apex
        var geoShedRoof = new THREE.BoxGeometry(52, 6, 58);
        makeMesh(geoShedRoof, 0x88AACC, sx, sy + 23, sz + 40);

        // Station clock tower
        var geoStClockTower = new THREE.BoxGeometry(8, 26, 8);
        makeMesh(geoStClockTower, 0xD4C9B0, sx - 20, sy + 13, sz);

        // Clock tower cap
        var geoStCap = new THREE.ConeGeometry(6, 10, 4);
        makeMesh(geoStCap, 0x9A8A7A, sx - 20, sy + 31, sz);

        // Platform canopy supports
        for (var p = 0; p < 5; p++) {
            var geoSup = new THREE.CylinderGeometry(0.8, 0.8, 18, 8);
            makeMesh(geoSup, 0x555555, sx - 20 + p * 10, sy + 9, sz + 20);
        }

        // Station entrance canopy
        var geoEntrance = new THREE.BoxGeometry(28, 6, 10);
        makeMesh(geoEntrance, 0xC8C0B0, sx, sy + 17, sz - 11);

        // Rail tracks (dark box)
        var geoTrack1 = new THREE.BoxGeometry(3, 1, 120);
        makeMesh(geoTrack1, 0x333333, sx - 8, sy, sz + 40);
        var geoTrack2 = new THREE.BoxGeometry(3, 1, 120);
        makeMesh(geoTrack2, 0x333333, sx + 8, sy, sz + 40);

        // Signal box
        var geoSignalBox = new THREE.BoxGeometry(8, 10, 8);
        makeMesh(geoSignalBox, 0xD4C9B0, sx + 35, sy + 5, sz + 20);
    }

    function buildStreetLamps() {
        // Street lamps along High Street
        var lampPositions = [
            [CX + 50, CZ + 5],
            [CX + 70, CZ + 5],
            [CX + 90, CZ + 5],
            [CX - 40, CZ + 5],
            [CX - 60, CZ + 5],
            [CX - 5, CZ - 50],
            [CX - 5, CZ - 80]
        ];

        for (var l = 0; l < lampPositions.length; l++) {
            var lx = lampPositions[l][0];
            var lz = lampPositions[l][1];

            // Lamp post
            var geoPost = new THREE.CylinderGeometry(0.3, 0.4, 10, 6);
            makeMesh(geoPost, 0x444444, lx, CY + 5, lz);

            // Lamp head
            var geoLampHead = new THREE.SphereGeometry(0.8, 6, 5);
            makeMesh(geoLampHead, 0xFFFFCC, lx, CY + 10.5, lz);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
