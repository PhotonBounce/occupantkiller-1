window.LindisfarnePriory = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z, rx, ry, rz) {
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
        buildSea();
        buildMudflats();
        buildCauseway();
        buildPrioryRuins();
        buildStMarysChurch();
        buildLindisfarneCastle();
        buildVillage();
        buildHarbour();
        buildBoatHuts();
        buildPrioryMuseum();
        buildCarvedStones();
        buildBebloweCrag();
    }

    // ---- GROUND / ISLAND BASE ----
    function buildGround() {
        // Main island ground — flat terrain base using boxes
        var geoGround = new THREE.BoxGeometry(800, 4, 600);
        addMesh(geoGround, 0xB8B060, 20960, -2, 0);

        // Low dune ridges along north coast
        var geoDune1 = new THREE.BoxGeometry(200, 6, 30);
        addMesh(geoDune1, 0xC8B870, 20860, 0, -270);

        var geoDune2 = new THREE.BoxGeometry(160, 5, 25);
        addMesh(geoDune2, 0xC4B468, 21100, 0, -260);

        // Heathland / grass patches
        var geoHeath1 = new THREE.BoxGeometry(120, 2, 100);
        addMesh(geoHeath1, 0x7A9A50, 20800, 1, 80);

        var geoHeath2 = new THREE.BoxGeometry(100, 2, 80);
        addMesh(geoHeath2, 0x6E8E44, 21100, 1, -60);
    }

    // ---- NORTH SEA ----
    function buildSea() {
        // Sea surrounding the island — three panels
        // North sea
        var geoSeaN = new THREE.BoxGeometry(1200, 3, 400);
        addMesh(geoSeaN, 0x005577, 20960, -3, -500);

        // East sea
        var geoSeaE = new THREE.BoxGeometry(400, 3, 800);
        addMesh(geoSeaE, 0x005577, 21560, -3, 0);

        // South sea / estuary
        var geoSeaS = new THREE.BoxGeometry(1200, 3, 300);
        addMesh(geoSeaS, 0x004466, 20960, -3, 500);

        // West sea / tidal channel
        var geoSeaW = new THREE.BoxGeometry(400, 3, 800);
        addMesh(geoSeaW, 0x005577, 20360, -3, 0);

        // Wave crests — thin elongated boxes
        var geoWave1 = new THREE.BoxGeometry(300, 1, 6);
        addMesh(geoWave1, 0x99CCDD, 20960, -1, -340);

        var geoWave2 = new THREE.BoxGeometry(200, 1, 5);
        addMesh(geoWave2, 0x99CCDD, 21100, -1, -420);

        var geoWave3 = new THREE.BoxGeometry(250, 1, 5);
        addMesh(geoWave3, 0xAADDEE, 20750, -1, -460);
    }

    // ---- MUDFLATS ----
    function buildMudflats() {
        // Vast tidal mudflats to south and west
        var geoMud1 = new THREE.BoxGeometry(700, 2, 300);
        addMesh(geoMud1, 0xB8A888, 20700, -1, 380);

        var geoMud2 = new THREE.BoxGeometry(500, 2, 200);
        addMesh(geoMud2, 0xBAAA8A, 21050, -1, 430);

        var geoMud3 = new THREE.BoxGeometry(400, 2, 250);
        addMesh(geoMud3, 0xB2A280, 20560, -1, 200);

        // Mudflat channels / runnels — dark thin strips
        var geoChan1 = new THREE.BoxGeometry(300, 1, 8);
        addMesh(geoChan1, 0x8A7A60, 20800, 0, 360, 0, 0.3);

        var geoChan2 = new THREE.BoxGeometry(200, 1, 6);
        addMesh(geoChan2, 0x8A7A60, 21000, 0, 400, 0, -0.2);
    }

    // ---- CAUSEWAY ----
    function buildCauseway() {
        // Tidal road causeway to mainland — stretching west
        var geoCause = new THREE.BoxGeometry(500, 3, 18);
        addMesh(geoCause, 0x888888, 20460, 0, 280);

        // Causeway refuge box — raised shelter
        var geoRefuge = new THREE.BoxGeometry(8, 10, 8);
        addMesh(geoRefuge, 0x999999, 20540, 5, 280);
        var geoRefugeRoof = new THREE.ConeGeometry(6, 4, 4);
        addMesh(geoRefugeRoof, 0x777777, 20540, 12, 280);

        // Causeway marker poles
        var geoPole1 = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
        addMesh(geoPole1, 0x444444, 20350, 6, 275);
        var geoPole2 = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
        addMesh(geoPole2, 0x444444, 20300, 6, 275);
        var geoPole3 = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
        addMesh(geoPole3, 0x444444, 20250, 6, 275);
    }

    // ---- PRIORY RUINS ----
    function buildPrioryRuins() {
        var ox = 20920;
        var oz = -30;
        var col = 0xCD5C5C;
        var darkCol = 0xB04848;

        // ---- NAVE NORTH WALL ----
        var geoNaveNWall = new THREE.BoxGeometry(90, 18, 3);
        addMesh(geoNaveNWall, col, ox - 5, 9, oz - 22);

        // ---- NAVE SOUTH WALL (partially standing) ----
        var geoNaveSWall = new THREE.BoxGeometry(60, 14, 3);
        addMesh(geoNaveSWall, col, ox - 20, 7, oz + 22);

        // ---- NAVE ARCADE PIERS (north side) ----
        var geoPier = new THREE.BoxGeometry(3, 16, 3);
        addMesh(geoPier, darkCol, ox - 30, 8, oz - 18);
        addMesh(geoPier, darkCol, ox - 10, 8, oz - 18);
        addMesh(geoPier, darkCol, ox + 10, 8, oz - 18);
        addMesh(geoPier, darkCol, ox + 30, 8, oz - 18);

        // ---- NAVE ARCADE ARCHES (north) — represented by thin box lintels ----
        var geoArch = new THREE.BoxGeometry(18, 3, 2);
        addMesh(geoArch, darkCol, ox - 20, 16, oz - 18);
        addMesh(geoArch, darkCol, ox + 0, 16, oz - 18);
        addMesh(geoArch, darkCol, ox + 20, 16, oz - 18);

        // ---- NAVE ARCADE PIERS (south side) ----
        addMesh(geoPier, darkCol, ox - 30, 8, oz + 18);
        addMesh(geoPier, darkCol, ox - 10, 8, oz + 18);
        addMesh(geoPier, darkCol, ox + 10, 8, oz + 18);
        addMesh(geoPier, darkCol, ox + 30, 8, oz + 18);

        // South arcade lintels
        addMesh(geoArch, darkCol, ox - 20, 16, oz + 18);
        addMesh(geoArch, darkCol, ox + 0, 16, oz + 18);
        addMesh(geoArch, darkCol, ox + 20, 16, oz + 18);

        // ---- CROSSING — THE FAMOUS RAINBOW ARCH ----
        // Two massive crossing piers
        var geoCrossPier = new THREE.BoxGeometry(5, 28, 5);
        addMesh(geoCrossPier, col, ox + 45, 14, oz - 12);
        addMesh(geoCrossPier, col, ox + 45, 14, oz + 12);

        // Rainbow arch — the surviving single arch over the crossing
        // Built from box segments to form an arch curve
        var geoArchBase1 = new THREE.BoxGeometry(4, 8, 5);
        addMesh(geoArchBase1, col, ox + 45, 22, oz - 9, 0.4);
        addMesh(geoArchBase1, col, ox + 45, 22, oz + 9, -0.4);

        var geoArchCrown = new THREE.BoxGeometry(4, 6, 18);
        addMesh(geoArchCrown, col, ox + 45, 29, oz, 0, 0, 0.15);

        var geoArchTop = new THREE.BoxGeometry(3, 4, 16);
        addMesh(geoArchTop, darkCol, ox + 45, 33, oz);

        // ---- TOWER STUMP ----
        var geoTowerStump = new THREE.BoxGeometry(14, 20, 14);
        addMesh(geoTowerStump, col, ox + 45, 10, oz);

        // Tower stump top — ragged broken parapet
        var geoTowerTop = new THREE.BoxGeometry(16, 4, 16);
        addMesh(geoTowerTop, darkCol, ox + 45, 22, oz);

        // ---- WEST FRONT ----
        var geoWestFront = new THREE.BoxGeometry(6, 26, 48);
        addMesh(geoWestFront, col, ox - 49, 13, oz);

        // West front blind arcading — vertical pilaster strips
        var geoPilaster = new THREE.BoxGeometry(3, 24, 2);
        addMesh(geoPilaster, darkCol, ox - 46, 12, oz - 16);
        addMesh(geoPilaster, darkCol, ox - 46, 12, oz);
        addMesh(geoPilaster, darkCol, ox - 46, 12, oz + 16);

        // West door arch
        var geoWDoor = new THREE.BoxGeometry(2, 10, 6);
        addMesh(geoWDoor, 0x8B2020, ox - 46, 5, oz);

        // ---- CHANCEL EAST WALL (partial) ----
        var geoChancelE = new THREE.BoxGeometry(4, 20, 30);
        addMesh(geoChancelE, col, ox + 80, 10, oz);

        // East window opening — dark void
        var geoEWin = new THREE.BoxGeometry(2, 8, 6);
        addMesh(geoEWin, 0x222222, ox + 78, 12, oz);

        // ---- TRANSEPT STUBS ----
        var geoNTransept = new THREE.BoxGeometry(20, 15, 5);
        addMesh(geoNTransept, col, ox + 55, 7, oz - 28);

        var geoSTransept = new THREE.BoxGeometry(20, 12, 5);
        addMesh(geoSTransept, col, ox + 55, 6, oz + 28);

        // ---- PRIORY PRECINCT WALL ----
        var geoPrecW = new THREE.BoxGeometry(200, 8, 3);
        addMesh(geoPrecW, 0xB04848, ox, 4, oz + 60);

        var geoPrecS = new THREE.BoxGeometry(3, 8, 120);
        addMesh(geoPrecS, 0xB04848, ox + 96, 4, oz);
    }

    // ---- ST MARY'S CHURCH ----
    function buildStMarysChurch() {
        var ox = 20870;
        var oz = 60;
        var col = 0xCD5C5C;

        // Nave
        var geoNave = new THREE.BoxGeometry(40, 14, 18);
        addMesh(geoNave, col, ox, 7, oz);

        // Chancel
        var geoChancel = new THREE.BoxGeometry(20, 12, 16);
        addMesh(geoChancel, col, ox + 28, 6, oz);

        // West tower
        var geoTower = new THREE.BoxGeometry(12, 24, 12);
        addMesh(geoTower, col, ox - 24, 12, oz);

        // Tower battlements
        var geoBatt = new THREE.BoxGeometry(14, 4, 14);
        addMesh(geoBatt, 0xB04848, ox - 24, 26, oz);

        // Pitched nave roof
        var geoRoof = new THREE.BoxGeometry(42, 6, 4);
        addMesh(geoRoof, 0x6B3030, ox, 17, oz - 7, 0, 0, 0.4);
        addMesh(geoRoof, 0x6B3030, ox, 17, oz + 7, 0, 0, -0.4);

        // Chancel roof ridge
        var geoChRoof = new THREE.BoxGeometry(22, 5, 3);
        addMesh(geoChRoof, 0x6B3030, ox + 28, 15, oz - 6, 0, 0, 0.4);
        addMesh(geoChRoof, 0x6B3030, ox + 28, 15, oz + 6, 0, 0, -0.4);

        // Porch
        var geoPorch = new THREE.BoxGeometry(8, 10, 10);
        addMesh(geoPorch, col, ox - 4, 5, oz + 14);

        // South door
        var geoDoor = new THREE.BoxGeometry(2, 6, 4);
        addMesh(geoDoor, 0x222222, ox - 4, 3, oz + 14);
    }

    // ---- LINDISFARNE CASTLE ON BEBLOWE CRAG ----
    function buildBebloweCrag() {
        // Rocky basalt mound
        var geoCrag1 = new THREE.BoxGeometry(50, 18, 40);
        addMesh(geoCrag1, 0x3A3530, 21160, 9, -120);

        var geoCrag2 = new THREE.BoxGeometry(36, 22, 28);
        addMesh(geoCrag2, 0x2E2A25, 21160, 11, -120);

        var geoCrag3 = new THREE.BoxGeometry(24, 26, 20);
        addMesh(geoCrag3, 0x352F28, 21162, 13, -118);
    }

    function buildLindisfarneCastle() {
        var ox = 21160;
        var oz = -120;
        var col = 0x7A6A5A;
        var base = 26; // height of crag top

        // Main castle block — Tudor/Lutyens conversion
        var geoMain = new THREE.BoxGeometry(28, 16, 22);
        addMesh(geoMain, col, ox, base + 8, oz);

        // Upper battery / gun platform
        var geoBattery = new THREE.BoxGeometry(30, 6, 24);
        addMesh(geoBattery, 0x6A5A4A, ox, base + 20, oz);

        // South-west tower (the distinctive profile)
        var geoSWTower = new THREE.BoxGeometry(10, 22, 10);
        addMesh(geoSWTower, col, ox - 14, base + 11, oz + 10);

        // North-east tower
        var geoNETower = new THREE.BoxGeometry(10, 18, 10);
        addMesh(geoNETower, col, ox + 14, base + 9, oz - 10);

        // Lutyens domestic wing addition (lower, to east)
        var geoDomWing = new THREE.BoxGeometry(18, 10, 14);
        addMesh(geoDomWing, 0x8A7A6A, ox + 20, base + 5, oz + 6);

        // Castle parapet / battlements
        var geoPara1 = new THREE.BoxGeometry(4, 4, 24);
        addMesh(geoPara1, 0x5A4A3A, ox - 13, base + 24, oz);

        var geoPara2 = new THREE.BoxGeometry(4, 4, 24);
        addMesh(geoPara2, 0x5A4A3A, ox + 13, base + 24, oz);

        // Flagpole
        var geoFlag = new THREE.CylinderGeometry(0.3, 0.3, 14, 5);
        addMesh(geoFlag, 0xCCCCCC, ox, base + 32, oz - 8);

        // Flag pennant
        var geoFlagPen = new THREE.BoxGeometry(6, 3, 1);
        addMesh(geoFlagPen, 0xCC0000, ox + 3, base + 38, oz - 8);

        // Steps up crag — tiered box steps
        var geoStep1 = new THREE.BoxGeometry(8, 4, 8);
        addMesh(geoStep1, 0x5A5248, ox - 22, base - 6, oz + 14);
        var geoStep2 = new THREE.BoxGeometry(8, 8, 8);
        addMesh(geoStep2, 0x5A5248, ox - 18, base - 2, oz + 14);
        var geoStep3 = new THREE.BoxGeometry(8, 12, 8);
        addMesh(geoStep3, 0x5A5248, ox - 14, base + 2, oz + 14);
    }

    // ---- HOLY ISLAND VILLAGE ----
    function buildVillage() {
        var col = 0xF5F0E8;
        var roofCol = 0x8A7060;

        // Row of cottages along main street
        buildCottage(20960, 0, 100, col, roofCol);
        buildCottage(20980, 0, 100, col, roofCol);
        buildCottage(21000, 0, 100, 0xEEE8D8, roofCol);
        buildCottage(21020, 0, 100, col, 0x7A6050);
        buildCottage(20940, 0, 100, col, roofCol);
        buildCottage(20920, 0, 100, 0xEDE6D4, roofCol);

        // Second row / back lane
        buildCottage(20960, 0, 130, col, roofCol);
        buildCottage(20990, 0, 130, col, 0x807060);
        buildCottage(20930, 0, 125, 0xEEE8DA, roofCol);

        // The Ship Inn / pub
        var geoPub = new THREE.BoxGeometry(18, 14, 14);
        addMesh(geoPub, 0xDDCCAA, 20960, 7, 80);
        var geoPubRoof = new THREE.BoxGeometry(20, 5, 6);
        addMesh(geoPubRoof, 0x6A5A48, 20960, 17, 83, 0, 0, 0.5);
        addMesh(geoPubRoof, 0x6A5A48, 20960, 17, 77, 0, 0, -0.5);

        // Pub sign post
        var geoSignPost = new THREE.CylinderGeometry(0.3, 0.3, 8, 5);
        addMesh(geoSignPost, 0x5A4030, 20970, 4, 74);
        var geoSign = new THREE.BoxGeometry(4, 3, 0.4);
        addMesh(geoSign, 0x8B4513, 20970, 8, 74);

        // Village green / open area
        var geoGreen = new THREE.BoxGeometry(40, 1, 40);
        addMesh(geoGreen, 0x6A8A50, 21000, 0, 80);

        // Market cross
        var geoCrossBase = new THREE.BoxGeometry(3, 1, 3);
        addMesh(geoCrossBase, 0x888888, 21000, 0.5, 80);
        var geoCrossShaft = new THREE.CylinderGeometry(0.4, 0.6, 8, 6);
        addMesh(geoCrossShaft, 0x888888, 21000, 4, 80);
        var geoCrossHead = new THREE.BoxGeometry(4, 1, 1);
        addMesh(geoCrossHead, 0x888888, 21000, 9, 80);

        // Manse / larger building
        var geoManse = new THREE.BoxGeometry(20, 16, 14);
        addMesh(geoManse, 0xEEE5D0, 20890, 8, 90);
        var geoManseRoof = new THREE.BoxGeometry(22, 4, 6);
        addMesh(geoManseRoof, 0x706050, 20890, 18, 87, 0, 0, 0.45);
        addMesh(geoManseRoof, 0x706050, 20890, 18, 93, 0, 0, -0.45);
    }

    function buildCottage(x, y, z, wallCol, roofCol) {
        var geoWalls = new THREE.BoxGeometry(14, 10, 10);
        addMesh(geoWalls, wallCol, x, y + 5, z);

        // Pitched roof — two sloped sides
        var geoRoofL = new THREE.BoxGeometry(16, 3, 5);
        addMesh(geoRoofL, roofCol, x, y + 11, z - 3, 0, 0, 0.45);
        var geoRoofR = new THREE.BoxGeometry(16, 3, 5);
        addMesh(geoRoofR, roofCol, x, y + 11, z + 3, 0, 0, -0.45);

        // Chimney stack
        var geoChimney = new THREE.BoxGeometry(2, 5, 2);
        addMesh(geoChimney, 0xAA9980, x + 4, y + 14, z - 1);

        // Door
        var geoDoor = new THREE.BoxGeometry(1, 5, 3);
        addMesh(geoDoor, 0x5A3820, x - 7, y + 2, z);

        // Window
        var geoWin = new THREE.BoxGeometry(1, 3, 3);
        addMesh(geoWin, 0x889AAA, x - 7, y + 6, z + 3);
    }

    // ---- LINDISFARNE HARBOUR ----
    function buildHarbour() {
        // Harbour water
        var geoHarbWater = new THREE.BoxGeometry(120, 2, 80);
        addMesh(geoHarbWater, 0x006994, 21080, -2, 200);

        // Harbour pier / jetty — L-shaped
        var geoPier1 = new THREE.BoxGeometry(6, 5, 120);
        addMesh(geoPier1, 0x777066, 21020, 2, 200);

        var geoPier2 = new THREE.BoxGeometry(100, 5, 6);
        addMesh(geoPier2, 0x777066, 21060, 2, 240);

        // Mooring bollards
        var geoBollard = new THREE.CylinderGeometry(0.6, 0.6, 3, 6);
        addMesh(geoBollard, 0x444444, 21024, 4, 175);
        addMesh(geoBollard, 0x444444, 21024, 4, 190);
        addMesh(geoBollard, 0x444444, 21024, 4, 205);

        // Fishing boats — simple hull shapes
        buildBoat(21060, 1, 200, 0.0);
        buildBoat(21080, 1, 210, 0.1);
        buildBoat(21100, 1, 195, -0.05);

        // Slipway
        var geoSlip = new THREE.BoxGeometry(12, 3, 30);
        addMesh(geoSlip, 0x888888, 21025, 0, 175, 0.15);
    }

    function buildBoat(x, y, z, ry) {
        var geoHull = new THREE.BoxGeometry(14, 4, 5);
        addMesh(geoHull, 0x2244AA, x, y + 2, z, 0, ry);

        var geoCabin = new THREE.BoxGeometry(6, 4, 4);
        addMesh(geoCabin, 0xDDDDCC, x - 2, y + 6, z, 0, ry);

        var geoMast = new THREE.CylinderGeometry(0.2, 0.2, 12, 5);
        addMesh(geoMast, 0x8B6914, x + 3, y + 10, z, 0, ry);
    }

    // ---- UPTURNED BOAT HUTS ----
    function buildBoatHuts() {
        // Iconic upturned herring boats used as storage sheds
        buildBoatHut(21050, 0, 250);
        buildBoatHut(21070, 0, 250);
        buildBoatHut(21090, 0, 250);
    }

    function buildBoatHut(x, y, z) {
        // Hull — an upturned box wider at top
        var geoHutHull = new THREE.BoxGeometry(14, 5, 7);
        addMesh(geoHutHull, 0x2A1A0A, x, y + 5, z);

        // Curved hull suggestion — narrowing roof top
        var geoHutTop = new THREE.BoxGeometry(12, 3, 5);
        addMesh(geoHutTop, 0x1A0A00, x, y + 9, z);

        // Door cutout fill
        var geoHutDoor = new THREE.BoxGeometry(1, 4, 3);
        addMesh(geoHutDoor, 0x3A2A1A, x - 7, y + 2, z);

        // Feet / base planks
        var geoPlank1 = new THREE.BoxGeometry(16, 1, 1);
        addMesh(geoPlank1, 0x5A4030, x, y + 0.5, z - 3);
        var geoPlank2 = new THREE.BoxGeometry(16, 1, 1);
        addMesh(geoPlank2, 0x5A4030, x, y + 0.5, z + 3);
    }

    // ---- PRIORY MUSEUM ----
    function buildPrioryMuseum() {
        var ox = 20840;
        var oz = -60;
        var col = 0xD3D3D3;

        // Main museum building — English Heritage visitor centre
        var geoMusMain = new THREE.BoxGeometry(30, 10, 18);
        addMesh(geoMusMain, col, ox, 5, oz);

        // Extension / gallery wing
        var geoMusWing = new THREE.BoxGeometry(20, 8, 14);
        addMesh(geoMusWing, 0xC8C8C8, ox + 22, 4, oz);

        // Flat roof parapet
        var geoMusRoof = new THREE.BoxGeometry(32, 2, 20);
        addMesh(geoMusRoof, 0xBBBBBB, ox, 11, oz);

        // Entrance portico
        var geoPortico = new THREE.BoxGeometry(10, 10, 8);
        addMesh(geoPortico, 0xDDDDDD, ox - 18, 5, oz);

        // Portico columns
        var geoCol1 = new THREE.CylinderGeometry(0.6, 0.6, 10, 8);
        addMesh(geoCol1, 0xCCCCCC, ox - 20, 5, oz - 3);
        var geoCol2 = new THREE.CylinderGeometry(0.6, 0.6, 10, 8);
        addMesh(geoCol2, 0xCCCCCC, ox - 20, 5, oz + 3);

        // Entrance steps
        var geoStep1 = new THREE.BoxGeometry(10, 2, 10);
        addMesh(geoStep1, 0xAAAAAA, ox - 23, 1, oz);
        var geoStep2 = new THREE.BoxGeometry(10, 1, 8);
        addMesh(geoStep2, 0xAAAAAA, ox - 22, 2, oz);

        // Display cases visible through window — just hint boxes
        var geoCase = new THREE.BoxGeometry(6, 4, 1);
        addMesh(geoCase, 0x8899AA, ox - 5, 4, oz + 9);
        addMesh(geoCase, 0x8899AA, ox + 5, 4, oz + 9);
    }

    // ---- ANCIENT CARVED STONES ----
    function buildCarvedStones() {
        // Lindisfarne Gospels-era grave markers and cross fragments near priory
        var col = 0xC8B89A;

        // Standing cross slab
        var geoCross1 = new THREE.BoxGeometry(1.5, 12, 5);
        addMesh(geoCross1, col, 20910, 6, -10);
        var geoCrossArm1 = new THREE.BoxGeometry(1.5, 4, 12);
        addMesh(geoCrossArm1, col, 20910, 9, -10);

        // Grave cover slab
        var geoSlab1 = new THREE.BoxGeometry(6, 0.8, 18);
        addMesh(geoSlab1, 0xB4A48A, 20905, 0.4, 0);

        // Pillow stone — carved Viking-era
        var geoSlab2 = new THREE.BoxGeometry(4, 0.8, 10);
        addMesh(geoSlab2, col, 20900, 0.4, -15);

        // Cross head fragment
        var geoCrossFrag = new THREE.BoxGeometry(8, 8, 1.5);
        addMesh(geoCrossFrag, col, 20895, 4, -5);

        // Stone fragment leaning against wall
        var geoFrag2 = new THREE.BoxGeometry(1.5, 6, 4);
        addMesh(geoFrag2, 0xBBAA90, 20928, 3, 55, 0, 0, 0.25);

        // Carved grave marker row
        var geoMarker1 = new THREE.BoxGeometry(2, 5, 4);
        addMesh(geoMarker1, col, 20915, 2, 52);
        var geoMarker2 = new THREE.BoxGeometry(2, 4, 4);
        addMesh(geoMarker2, col, 20922, 2, 52);
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

    return { init: init, update: update, reset: reset };
}());
