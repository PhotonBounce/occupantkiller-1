window.NewryCanal = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 19200;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        if (sx !== undefined) mesh.scale.set(sx, sy, sz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildCanal();
        buildCanalLocks();
        buildTowpath();
        buildTowpathTrees();
        buildClanryeRiver();
        buildNewryTown();
        buildTownHall();
        buildStPatricksCathedral();
        buildStPatricksChurchOfIreland();
        buildNewryMuseum();
        buildCanalbarge();
        buildCamloughMountain();
        buildMiscDetails();
    }

    function buildGround() {
        // Ground plane approximated with a large flat box
        var groundGeo = new THREE.BoxGeometry(2400, 4, 2400);
        makeMesh(groundGeo, 0x5C7A3E, BASE_X, BASE_Y - 2, BASE_Z);

        // Hillside ground for cathedral hill
        var hillGeo = new THREE.BoxGeometry(180, 60, 180);
        makeMesh(hillGeo, 0x4A6A30, BASE_X - 80, BASE_Y + 20, BASE_Z - 220);

        // Secondary rise for Church of Ireland
        var hill2Geo = new THREE.BoxGeometry(140, 40, 140);
        makeMesh(hill2Geo, 0x4A6A30, BASE_X + 100, BASE_Y + 10, BASE_Z - 200);
    }

    function buildCanal() {
        // Main canal water channel — long straight run north-south
        var canalGeo = new THREE.BoxGeometry(40, 4, 1200);
        makeMesh(canalGeo, 0x006994, BASE_X, BASE_Y - 1, BASE_Z + 100);

        // Canal stone embankment west side
        var embankWGeo = new THREE.BoxGeometry(12, 8, 1200);
        makeMesh(embankWGeo, 0x808080, BASE_X - 28, BASE_Y + 2, BASE_Z + 100);

        // Canal stone embankment east side
        var embankEGeo = new THREE.BoxGeometry(12, 8, 1200);
        makeMesh(embankEGeo, 0x808080, BASE_X + 28, BASE_Y + 2, BASE_Z + 100);

        // Canal northern extension
        var canalN2Geo = new THREE.BoxGeometry(40, 4, 400);
        makeMesh(canalN2Geo, 0x006994, BASE_X, BASE_Y - 1, BASE_Z - 700);

        // Canal embankment extensions north
        var embankWN2Geo = new THREE.BoxGeometry(12, 8, 400);
        makeMesh(embankWN2Geo, 0x808080, BASE_X - 28, BASE_Y + 2, BASE_Z - 700);

        var embankEN2Geo = new THREE.BoxGeometry(12, 8, 400);
        makeMesh(embankEN2Geo, 0x808080, BASE_X + 28, BASE_Y + 2, BASE_Z - 700);

        // Canal southern extension towards town center
        var canalS3Geo = new THREE.BoxGeometry(40, 4, 300);
        makeMesh(canalS3Geo, 0x006994, BASE_X, BASE_Y - 1, BASE_Z + 750);

        // Canal stone bed (bottom visible through shallow water)
        var canalBedGeo = new THREE.BoxGeometry(36, 2, 1800);
        makeMesh(canalBedGeo, 0x5A5A5A, BASE_X, BASE_Y - 3, BASE_Z + 100);
    }

    function buildCanalLocks() {
        // Lock 1 — lower lock chamber
        var lock1ChamberGeo = new THREE.BoxGeometry(44, 10, 60);
        makeMesh(lock1ChamberGeo, 0x696969, BASE_X, BASE_Y + 4, BASE_Z + 300);

        // Lock 1 gate A (west leaf)
        var lock1GateAGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock1GateAGeo, 0x696969, BASE_X - 10, BASE_Y + 6, BASE_Z + 270);

        // Lock 1 gate B (east leaf)
        var lock1GateBGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock1GateBGeo, 0x696969, BASE_X + 10, BASE_Y + 6, BASE_Z + 270);

        // Lock 1 gate downstream A
        var lock1GateDnAGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock1GateDnAGeo, 0x696969, BASE_X - 10, BASE_Y + 6, BASE_Z + 330);

        // Lock 1 gate downstream B
        var lock1GateDnBGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock1GateDnBGeo, 0x696969, BASE_X + 10, BASE_Y + 6, BASE_Z + 330);

        // Lock 1 paddle sluice west
        var paddle1WGeo = new THREE.BoxGeometry(3, 8, 3);
        makeMesh(paddle1WGeo, 0x4A3000, BASE_X - 22, BASE_Y + 6, BASE_Z + 270);

        // Lock 1 paddle sluice east
        var paddle1EGeo = new THREE.BoxGeometry(3, 8, 3);
        makeMesh(paddle1EGeo, 0x4A3000, BASE_X + 22, BASE_Y + 6, BASE_Z + 270);

        // Lock 1 water in chamber
        var lock1WaterGeo = new THREE.BoxGeometry(38, 3, 56);
        makeMesh(lock1WaterGeo, 0x005A7A, BASE_X, BASE_Y + 1, BASE_Z + 300);

        // Lock 2 — upper lock chamber (tiered, higher elevation)
        var lock2ChamberGeo = new THREE.BoxGeometry(44, 10, 60);
        makeMesh(lock2ChamberGeo, 0x696969, BASE_X, BASE_Y + 8, BASE_Z + 180);

        // Lock 2 gate A
        var lock2GateAGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock2GateAGeo, 0x696969, BASE_X - 10, BASE_Y + 10, BASE_Z + 150);

        // Lock 2 gate B
        var lock2GateBGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock2GateBGeo, 0x696969, BASE_X + 10, BASE_Y + 10, BASE_Z + 150);

        // Lock 2 gate downstream A
        var lock2GateDnAGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock2GateDnAGeo, 0x696969, BASE_X - 10, BASE_Y + 10, BASE_Z + 210);

        // Lock 2 gate downstream B
        var lock2GateDnBGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock2GateDnBGeo, 0x696969, BASE_X + 10, BASE_Y + 10, BASE_Z + 210);

        // Lock 2 water in chamber
        var lock2WaterGeo = new THREE.BoxGeometry(38, 3, 56);
        makeMesh(lock2WaterGeo, 0x005A7A, BASE_X, BASE_Y + 5, BASE_Z + 180);

        // Lock 2 paddle west
        var paddle2WGeo = new THREE.BoxGeometry(3, 8, 3);
        makeMesh(paddle2WGeo, 0x4A3000, BASE_X - 22, BASE_Y + 10, BASE_Z + 150);

        // Lock 2 paddle east
        var paddle2EGeo = new THREE.BoxGeometry(3, 8, 3);
        makeMesh(paddle2EGeo, 0x4A3000, BASE_X + 22, BASE_Y + 10, BASE_Z + 150);

        // Lock 3 — further north
        var lock3ChamberGeo = new THREE.BoxGeometry(44, 10, 60);
        makeMesh(lock3ChamberGeo, 0x696969, BASE_X, BASE_Y + 4, BASE_Z - 50);

        // Lock 3 gate A
        var lock3GateAGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock3GateAGeo, 0x696969, BASE_X - 10, BASE_Y + 6, BASE_Z - 80);

        // Lock 3 gate B
        var lock3GateBGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock3GateBGeo, 0x696969, BASE_X + 10, BASE_Y + 6, BASE_Z - 80);

        // Lock 3 gate downstream A
        var lock3GateDnAGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock3GateDnAGeo, 0x696969, BASE_X - 10, BASE_Y + 6, BASE_Z - 20);

        // Lock 3 gate downstream B
        var lock3GateDnBGeo = new THREE.BoxGeometry(18, 14, 3);
        makeMesh(lock3GateDnBGeo, 0x696969, BASE_X + 10, BASE_Y + 6, BASE_Z - 20);

        // Lock 3 water
        var lock3WaterGeo = new THREE.BoxGeometry(38, 3, 56);
        makeMesh(lock3WaterGeo, 0x005A7A, BASE_X, BASE_Y + 1, BASE_Z - 50);

        // Lock keeper's cottage
        var cottageBuildingGeo = new THREE.BoxGeometry(20, 16, 16);
        makeMesh(cottageBuildingGeo, 0xC8B89A, BASE_X + 50, BASE_Y + 8, BASE_Z + 300);

        // Cottage roof
        var cottageRoofGeo = new THREE.ConeGeometry(16, 10, 4);
        makeMesh(cottageRoofGeo, 0x8B2020, BASE_X + 50, BASE_Y + 21, BASE_Z + 300, 0, Math.PI * 0.25, 0);

        // Cottage chimney
        var cottageChimneyGeo = new THREE.BoxGeometry(4, 10, 4);
        makeMesh(cottageChimneyGeo, 0x8B4040, BASE_X + 53, BASE_Y + 28, BASE_Z + 298);
    }

    function buildTowpath() {
        // Towpath — packed gravel path alongside canal west side
        var towpathGeo = new THREE.BoxGeometry(20, 2, 1800);
        makeMesh(towpathGeo, 0xB8A880, BASE_X - 50, BASE_Y + 1, BASE_Z + 100);

        // East service path
        var eastPathGeo = new THREE.BoxGeometry(14, 2, 1200);
        makeMesh(eastPathGeo, 0xA89870, BASE_X + 50, BASE_Y + 1, BASE_Z + 100);

        // Stone mooring bollard 1
        var bollard1Geo = new THREE.CylinderGeometry(1.5, 2, 6, 8);
        makeMesh(bollard1Geo, 0x696969, BASE_X - 22, BASE_Y + 3, BASE_Z + 50);

        // Stone mooring bollard 2
        var bollard2Geo = new THREE.CylinderGeometry(1.5, 2, 6, 8);
        makeMesh(bollard2Geo, 0x696969, BASE_X - 22, BASE_Y + 3, BASE_Z + 150);

        // Stone mooring bollard 3
        var bollard3Geo = new THREE.CylinderGeometry(1.5, 2, 6, 8);
        makeMesh(bollard3Geo, 0x696969, BASE_X - 22, BASE_Y + 3, BASE_Z - 50);

        // Stone mooring bollard 4 east
        var bollard4Geo = new THREE.CylinderGeometry(1.5, 2, 6, 8);
        makeMesh(bollard4Geo, 0x696969, BASE_X + 22, BASE_Y + 3, BASE_Z + 100);

        // Low stone wall west side
        var wallWGeo = new THREE.BoxGeometry(4, 6, 1200);
        makeMesh(wallWGeo, 0x888888, BASE_X - 64, BASE_Y + 3, BASE_Z + 100);

        // Low stone wall east side
        var wallEGeo = new THREE.BoxGeometry(4, 6, 1200);
        makeMesh(wallEGeo, 0x888888, BASE_X + 64, BASE_Y + 3, BASE_Z + 100);

        // Stone bridge over canal — arch approximated with a flat box
        var bridgeDeckGeo = new THREE.BoxGeometry(80, 5, 22);
        makeMesh(bridgeDeckGeo, 0x808080, BASE_X, BASE_Y + 10, BASE_Z - 150);

        // Bridge parapet west
        var bridgeParWGeo = new THREE.BoxGeometry(3, 8, 22);
        makeMesh(bridgeParWGeo, 0x888888, BASE_X - 38, BASE_Y + 13, BASE_Z - 150);

        // Bridge parapet east
        var bridgeParEGeo = new THREE.BoxGeometry(3, 8, 22);
        makeMesh(bridgeParEGeo, 0x888888, BASE_X + 38, BASE_Y + 13, BASE_Z - 150);

        // Bridge arch support west
        var archSupWGeo = new THREE.BoxGeometry(10, 14, 14);
        makeMesh(archSupWGeo, 0x777777, BASE_X - 22, BASE_Y + 6, BASE_Z - 150);

        // Bridge arch support east
        var archSupEGeo = new THREE.BoxGeometry(10, 14, 14);
        makeMesh(archSupEGeo, 0x777777, BASE_X + 22, BASE_Y + 6, BASE_Z - 150);
    }

    function buildTowpathTrees() {
        // Row of trees along west towpath
        var treePositionsZ = [ -600, -480, -360, -240, -120, 0, 120, 240, 360, 480, 600 ];
        for (var i = 0; i < treePositionsZ.length; i++) {
            var tz = BASE_Z + treePositionsZ[i];
            // Trunk
            var trunkGeo = new THREE.CylinderGeometry(1.5, 2.2, 14, 8);
            makeMesh(trunkGeo, 0x5C3A1E, BASE_X - 72, BASE_Y + 7, tz);
            // Canopy
            var canopyGeo = new THREE.SphereGeometry(9, 8, 6);
            makeMesh(canopyGeo, 0x228B22, BASE_X - 72, BASE_Y + 19, tz);
        }

        // East side trees — sparser row
        var eastTreeZ = [ -540, -300, -60, 180, 420 ];
        for (var j = 0; j < eastTreeZ.length; j++) {
            var etz = BASE_Z + eastTreeZ[j];
            var eTrunkGeo = new THREE.CylinderGeometry(1.5, 2.2, 14, 8);
            makeMesh(eTrunkGeo, 0x5C3A1E, BASE_X + 72, BASE_Y + 7, etz);
            var eCanopyGeo = new THREE.SphereGeometry(9, 8, 6);
            makeMesh(eCanopyGeo, 0x228B22, BASE_X + 72, BASE_Y + 19, etz);
        }
    }

    function buildClanryeRiver() {
        // Clanrye River — meets canal at town centre, flowing roughly west-east
        var riverMainGeo = new THREE.BoxGeometry(800, 4, 28);
        makeMesh(riverMainGeo, 0x006994, BASE_X - 200, BASE_Y - 1, BASE_Z + 600);

        // River bend section joining canal
        var riverBendGeo = new THREE.BoxGeometry(28, 4, 80);
        makeMesh(riverBendGeo, 0x005A7A, BASE_X + 200, BASE_Y - 1, BASE_Z + 560);

        // River bank north
        var riverBankNGeo = new THREE.BoxGeometry(800, 5, 10);
        makeMesh(riverBankNGeo, 0x4A6A30, BASE_X - 200, BASE_Y + 1, BASE_Z + 587);

        // River bank south
        var riverBankSGeo = new THREE.BoxGeometry(800, 5, 10);
        makeMesh(riverBankSGeo, 0x4A6A30, BASE_X - 200, BASE_Y + 1, BASE_Z + 613);

        // River mouth stone wall west
        var riverMouthWGeo = new THREE.BoxGeometry(8, 10, 30);
        makeMesh(riverMouthWGeo, 0x808080, BASE_X - 600, BASE_Y + 4, BASE_Z + 600);

        // River tree 1
        var rTrunk1Geo = new THREE.CylinderGeometry(1.5, 2, 12, 8);
        makeMesh(rTrunk1Geo, 0x5C3A1E, BASE_X - 320, BASE_Y + 6, BASE_Z + 580);
        var rCanopy1Geo = new THREE.SphereGeometry(8, 8, 6);
        makeMesh(rCanopy1Geo, 0x1A7A22, BASE_X - 320, BASE_Y + 17, BASE_Z + 580);

        // River tree 2
        var rTrunk2Geo = new THREE.CylinderGeometry(1.5, 2, 12, 8);
        makeMesh(rTrunk2Geo, 0x5C3A1E, BASE_X - 450, BASE_Y + 6, BASE_Z + 620);
        var rCanopy2Geo = new THREE.SphereGeometry(8, 8, 6);
        makeMesh(rCanopy2Geo, 0x1A7A22, BASE_X - 450, BASE_Y + 17, BASE_Z + 620);
    }

    function buildNewryTown() {
        // Victorian/Georgian terrace row north
        var terr1Geo = new THREE.BoxGeometry(200, 30, 24);
        makeMesh(terr1Geo, 0xCD5C5C, BASE_X + 160, BASE_Y + 15, BASE_Z + 400);

        // Terrace row south
        var terr2Geo = new THREE.BoxGeometry(200, 30, 24);
        makeMesh(terr2Geo, 0xBB4A4A, BASE_X + 160, BASE_Y + 15, BASE_Z + 500);

        // Terrace row west (opposite side of market street)
        var terr3Geo = new THREE.BoxGeometry(24, 30, 180);
        makeMesh(terr3Geo, 0xCD5C5C, BASE_X + 300, BASE_Y + 15, BASE_Z + 440);

        // Georgian row east of canal
        var georgian1Geo = new THREE.BoxGeometry(160, 26, 20);
        makeMesh(georgian1Geo, 0xC8785A, BASE_X + 160, BASE_Y + 13, BASE_Z + 100);

        // Market building
        var market1Geo = new THREE.BoxGeometry(80, 22, 60);
        makeMesh(market1Geo, 0xCC6655, BASE_X + 200, BASE_Y + 11, BASE_Z + 250);

        // Market roof
        var marketRoofGeo = new THREE.BoxGeometry(84, 8, 64);
        makeMesh(marketRoofGeo, 0x882222, BASE_X + 200, BASE_Y + 26, BASE_Z + 250);

        // Old warehouse on canal bank (now arts centre)
        var warehouseGeo = new THREE.BoxGeometry(60, 36, 40);
        makeMesh(warehouseGeo, 0xA05040, BASE_X + 80, BASE_Y + 18, BASE_Z + 450);

        // Warehouse roof
        var warehouseRoofGeo = new THREE.BoxGeometry(64, 6, 44);
        makeMesh(warehouseRoofGeo, 0x602020, BASE_X + 80, BASE_Y + 39, BASE_Z + 450);

        // Shop row — lower storey blocks
        var shops1Geo = new THREE.BoxGeometry(120, 12, 18);
        makeMesh(shops1Geo, 0xD06050, BASE_X + 160, BASE_Y + 6, BASE_Z + 320);

        // Upper floors above shops
        var shops1UpperGeo = new THREE.BoxGeometry(120, 16, 18);
        makeMesh(shops1UpperGeo, 0xBB4A4A, BASE_X + 160, BASE_Y + 22, BASE_Z + 320);

        // Road surface — Hill Street / Merchant's Quay approximation
        var roadGeo = new THREE.BoxGeometry(20, 2, 800);
        makeMesh(roadGeo, 0x404040, BASE_X + 100, BASE_Y + 1, BASE_Z + 400);

        // Road surface — Sugar Island area cross road
        var road2Geo = new THREE.BoxGeometry(300, 2, 18);
        makeMesh(road2Geo, 0x404040, BASE_X + 160, BASE_Y + 1, BASE_Z + 550);

        // Lamp post 1
        var lamp1PostGeo = new THREE.CylinderGeometry(0.6, 0.8, 20, 6);
        makeMesh(lamp1PostGeo, 0x333333, BASE_X + 102, BASE_Y + 10, BASE_Z + 380);
        var lamp1HeadGeo = new THREE.BoxGeometry(3, 2, 3);
        makeMesh(lamp1HeadGeo, 0xFFDD88, BASE_X + 102, BASE_Y + 21, BASE_Z + 380);

        // Lamp post 2
        var lamp2PostGeo = new THREE.CylinderGeometry(0.6, 0.8, 20, 6);
        makeMesh(lamp2PostGeo, 0x333333, BASE_X + 102, BASE_Y + 10, BASE_Z + 480);
        var lamp2HeadGeo = new THREE.BoxGeometry(3, 2, 3);
        makeMesh(lamp2HeadGeo, 0xFFDD88, BASE_X + 102, BASE_Y + 21, BASE_Z + 480);

        // Old Newry post office
        var postOfficeGeo = new THREE.BoxGeometry(30, 24, 22);
        makeMesh(postOfficeGeo, 0xCC6644, BASE_X + 260, BASE_Y + 12, BASE_Z + 300);

        // Post office upper pediment
        var postPedGeo = new THREE.BoxGeometry(32, 6, 4);
        makeMesh(postPedGeo, 0xBB5533, BASE_X + 260, BASE_Y + 27, BASE_Z + 289);
    }

    function buildTownHall() {
        // Town Hall main building — Victorian civic
        var townHallGeo = new THREE.BoxGeometry(60, 32, 40);
        makeMesh(townHallGeo, 0xCD5C5C, BASE_X + 220, BASE_Y + 16, BASE_Z + 450);

        // Town Hall upper storey
        var townHallUpperGeo = new THREE.BoxGeometry(56, 16, 36);
        makeMesh(townHallUpperGeo, 0xBB4A4A, BASE_X + 220, BASE_Y + 40, BASE_Z + 450);

        // Clock tower base
        var clockTowerBaseGeo = new THREE.BoxGeometry(18, 50, 18);
        makeMesh(clockTowerBaseGeo, 0xCC5050, BASE_X + 220, BASE_Y + 57, BASE_Z + 450);

        // Clock tower middle section
        var clockTowerMidGeo = new THREE.BoxGeometry(14, 20, 14);
        makeMesh(clockTowerMidGeo, 0xBB4444, BASE_X + 220, BASE_Y + 92, BASE_Z + 450);

        // Clock face N
        var clockFaceNGeo = new THREE.BoxGeometry(10, 10, 2);
        makeMesh(clockFaceNGeo, 0xF0F0F0, BASE_X + 220, BASE_Y + 90, BASE_Z + 443);

        // Clock face S
        var clockFaceSGeo = new THREE.BoxGeometry(10, 10, 2);
        makeMesh(clockFaceSGeo, 0xF0F0F0, BASE_X + 220, BASE_Y + 90, BASE_Z + 457);

        // Clock tower spire
        var clockSpireGeo = new THREE.ConeGeometry(7, 30, 4);
        makeMesh(clockSpireGeo, 0x555555, BASE_X + 220, BASE_Y + 117, BASE_Z + 450, 0, Math.PI * 0.25, 0);

        // Town Hall portico columns (4 pillars)
        var col1Geo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        makeMesh(col1Geo, 0xEEEEEE, BASE_X + 200, BASE_Y + 10, BASE_Z + 430);
        var col2Geo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        makeMesh(col2Geo, 0xEEEEEE, BASE_X + 213, BASE_Y + 10, BASE_Z + 430);
        var col3Geo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        makeMesh(col3Geo, 0xEEEEEE, BASE_X + 226, BASE_Y + 10, BASE_Z + 430);
        var col4Geo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        makeMesh(col4Geo, 0xEEEEEE, BASE_X + 239, BASE_Y + 10, BASE_Z + 430);

        // Portico pediment
        var porticoPedGeo = new THREE.BoxGeometry(44, 6, 4);
        makeMesh(porticoPedGeo, 0xDDDDDD, BASE_X + 220, BASE_Y + 22, BASE_Z + 430);

        // Town Hall steps
        var steps1Geo = new THREE.BoxGeometry(50, 2, 6);
        makeMesh(steps1Geo, 0xB0B0B0, BASE_X + 220, BASE_Y + 1, BASE_Z + 428);

        var steps2Geo = new THREE.BoxGeometry(50, 4, 4);
        makeMesh(steps2Geo, 0xA8A8A8, BASE_X + 220, BASE_Y + 3, BASE_Z + 426);

        // Town Hall side wing left
        var wingLGeo = new THREE.BoxGeometry(18, 24, 36);
        makeMesh(wingLGeo, 0xCC5050, BASE_X + 185, BASE_Y + 12, BASE_Z + 450);

        // Town Hall side wing right
        var wingRGeo = new THREE.BoxGeometry(18, 24, 36);
        makeMesh(wingRGeo, 0xCC5050, BASE_X + 255, BASE_Y + 12, BASE_Z + 450);
    }

    function buildStPatricksCathedral() {
        // St Patrick's Catholic Cathedral — on hill, Gothic stone
        var cathedralBodyGeo = new THREE.BoxGeometry(40, 44, 80);
        makeMesh(cathedralBodyGeo, 0x808080, BASE_X - 80, BASE_Y + 72, BASE_Z - 220);

        // Cathedral nave roof
        var cathedralRoofGeo = new THREE.BoxGeometry(34, 16, 80);
        makeMesh(cathedralRoofGeo, 0x666666, BASE_X - 80, BASE_Y + 100, BASE_Z - 220);

        // Cathedral west facade
        var cathedralFacadeGeo = new THREE.BoxGeometry(40, 50, 8);
        makeMesh(cathedralFacadeGeo, 0x7A7A7A, BASE_X - 80, BASE_Y + 75, BASE_Z - 260);

        // Cathedral main tower left
        var catTowerLGeo = new THREE.BoxGeometry(14, 80, 14);
        makeMesh(catTowerLGeo, 0x777777, BASE_X - 96, BASE_Y + 90, BASE_Z - 262);

        // Cathedral main tower right
        var catTowerRGeo = new THREE.BoxGeometry(14, 80, 14);
        makeMesh(catTowerRGeo, 0x777777, BASE_X - 64, BASE_Y + 90, BASE_Z - 262);

        // Tower spire left
        var catSpireLGeo = new THREE.ConeGeometry(7, 40, 4);
        makeMesh(catSpireLGeo, 0x555555, BASE_X - 96, BASE_Y + 150, BASE_Z - 262, 0, Math.PI * 0.25, 0);

        // Tower spire right
        var catSpireRGeo = new THREE.ConeGeometry(7, 40, 4);
        makeMesh(catSpireRGeo, 0x555555, BASE_X - 64, BASE_Y + 150, BASE_Z - 262, 0, Math.PI * 0.25, 0);

        // Cathedral transept north
        var catTransNGeo = new THREE.BoxGeometry(16, 36, 32);
        makeMesh(catTransNGeo, 0x808080, BASE_X - 80, BASE_Y + 68, BASE_Z - 248);

        // Cathedral transept south
        var catTransSGeo = new THREE.BoxGeometry(16, 36, 32);
        makeMesh(catTransSGeo, 0x808080, BASE_X - 80, BASE_Y + 68, BASE_Z - 192);

        // Cathedral apse (east end)
        var catApseGeo = new THREE.CylinderGeometry(18, 18, 44, 6);
        makeMesh(catApseGeo, 0x7A7A7A, BASE_X - 80, BASE_Y + 72, BASE_Z - 180);

        // Cathedral apse roof cone
        var catApseRoofGeo = new THREE.ConeGeometry(19, 14, 6);
        makeMesh(catApseRoofGeo, 0x606060, BASE_X - 80, BASE_Y + 101, BASE_Z - 180);

        // Cathedral steps leading up hill
        var catSteps1Geo = new THREE.BoxGeometry(30, 3, 10);
        makeMesh(catSteps1Geo, 0x909090, BASE_X - 80, BASE_Y + 48, BASE_Z - 258);

        var catSteps2Geo = new THREE.BoxGeometry(30, 5, 10);
        makeMesh(catSteps2Geo, 0x888888, BASE_X - 80, BASE_Y + 46, BASE_Z - 248);

        var catSteps3Geo = new THREE.BoxGeometry(30, 7, 10);
        makeMesh(catSteps3Geo, 0x888888, BASE_X - 80, BASE_Y + 44, BASE_Z - 238);
    }

    function buildStPatricksChurchOfIreland() {
        // St Patrick's Church of Ireland — companion church, Gothic but smaller
        var coiBodyGeo = new THREE.BoxGeometry(30, 32, 60);
        makeMesh(coiBodyGeo, 0x909090, BASE_X + 100, BASE_Y + 26, BASE_Z - 200);

        // CoI roof
        var coiRoofGeo = new THREE.BoxGeometry(28, 12, 60);
        makeMesh(coiRoofGeo, 0x6A6A6A, BASE_X + 100, BASE_Y + 48, BASE_Z - 200);

        // CoI tower
        var coiTowerGeo = new THREE.BoxGeometry(14, 60, 14);
        makeMesh(coiTowerGeo, 0x888888, BASE_X + 100, BASE_Y + 60, BASE_Z - 230);

        // CoI tower spire
        var coiSpireGeo = new THREE.ConeGeometry(7, 35, 4);
        makeMesh(coiSpireGeo, 0x555555, BASE_X + 100, BASE_Y + 105, BASE_Z - 230, 0, Math.PI * 0.25, 0);

        // CoI porch
        var coiPorchGeo = new THREE.BoxGeometry(16, 20, 10);
        makeMesh(coiPorchGeo, 0x909090, BASE_X + 100, BASE_Y + 20, BASE_Z - 230);

        // CoI churchyard wall
        var coiWall1Geo = new THREE.BoxGeometry(60, 6, 3);
        makeMesh(coiWall1Geo, 0x808080, BASE_X + 100, BASE_Y + 3, BASE_Z - 175);

        var coiWall2Geo = new THREE.BoxGeometry(3, 6, 70);
        makeMesh(coiWall2Geo, 0x808080, BASE_X + 131, BASE_Y + 3, BASE_Z - 210);

        var coiWall3Geo = new THREE.BoxGeometry(3, 6, 70);
        makeMesh(coiWall3Geo, 0x808080, BASE_X + 69, BASE_Y + 3, BASE_Z - 210);

        // Churchyard tree 1
        var cTrunk1Geo = new THREE.CylinderGeometry(1.2, 1.8, 18, 7);
        makeMesh(cTrunk1Geo, 0x4A2E0E, BASE_X + 90, BASE_Y + 9, BASE_Z - 205);
        var cCanopy1Geo = new THREE.SphereGeometry(7, 7, 5);
        makeMesh(cCanopy1Geo, 0x1A6622, BASE_X + 90, BASE_Y + 23, BASE_Z - 205);

        // Churchyard tree 2
        var cTrunk2Geo = new THREE.CylinderGeometry(1.2, 1.8, 18, 7);
        makeMesh(cTrunk2Geo, 0x4A2E0E, BASE_X + 115, BASE_Y + 9, BASE_Z - 185);
        var cCanopy2Geo = new THREE.SphereGeometry(7, 7, 5);
        makeMesh(cCanopy2Geo, 0x1A6622, BASE_X + 115, BASE_Y + 23, BASE_Z - 185);

        // Churchyard grave marker slab 1
        var grave1Geo = new THREE.BoxGeometry(3, 8, 1);
        makeMesh(grave1Geo, 0xAAAAAA, BASE_X + 108, BASE_Y + 4, BASE_Z - 195);

        // Churchyard grave marker slab 2
        var grave2Geo = new THREE.BoxGeometry(3, 8, 1);
        makeMesh(grave2Geo, 0xAAAAAA, BASE_X + 95, BASE_Y + 4, BASE_Z - 210);
    }

    function buildNewryMuseum() {
        // Newry Museum — civic building on canal bank
        var museumGeo = new THREE.BoxGeometry(50, 28, 36);
        makeMesh(museumGeo, 0xCC8855, BASE_X + 80, BASE_Y + 14, BASE_Z - 50);

        // Museum roof
        var museumRoofGeo = new THREE.BoxGeometry(54, 10, 40);
        makeMesh(museumRoofGeo, 0x995533, BASE_X + 80, BASE_Y + 33, BASE_Z - 50);

        // Museum entrance portico
        var museumPortGeo = new THREE.BoxGeometry(20, 18, 8);
        makeMesh(museumPortGeo, 0xDDAA77, BASE_X + 80, BASE_Y + 9, BASE_Z - 68);

        // Museum portico pediment
        var museumPedGeo = new THREE.BoxGeometry(22, 5, 3);
        makeMesh(museumPedGeo, 0xCCAA77, BASE_X + 80, BASE_Y + 19, BASE_Z - 72);

        // Museum column 1
        var mCol1Geo = new THREE.CylinderGeometry(1.2, 1.2, 16, 7);
        makeMesh(mCol1Geo, 0xEEDDBB, BASE_X + 71, BASE_Y + 8, BASE_Z - 70);

        // Museum column 2
        var mCol2Geo = new THREE.CylinderGeometry(1.2, 1.2, 16, 7);
        makeMesh(mCol2Geo, 0xEEDDBB, BASE_X + 89, BASE_Y + 8, BASE_Z - 70);

        // Museum flagpole
        var flagpoleGeo = new THREE.CylinderGeometry(0.4, 0.5, 26, 6);
        makeMesh(flagpoleGeo, 0xCCCCCC, BASE_X + 60, BASE_Y + 13, BASE_Z - 50);

        // Flag
        var flagGeo = new THREE.BoxGeometry(10, 5, 1);
        makeMesh(flagGeo, 0x007700, BASE_X + 55, BASE_Y + 26, BASE_Z - 50);
    }

    function buildCanalbarge() {
        // Traditional wooden canal barge — hull
        var bargeHullGeo = new THREE.BoxGeometry(48, 8, 10);
        makeMesh(bargeHullGeo, 0x8B4513, BASE_X + 8, BASE_Y + 2, BASE_Z - 300);

        // Barge cabin/hold cover
        var bargeCabinGeo = new THREE.BoxGeometry(20, 7, 8);
        makeMesh(bargeCabinGeo, 0x7A3A10, BASE_X - 6, BASE_Y + 9, BASE_Z - 300);

        // Barge cabin roof
        var bargeCabinRoofGeo = new THREE.BoxGeometry(22, 2, 10);
        makeMesh(bargeCabinRoofGeo, 0x552200, BASE_X - 6, BASE_Y + 13, BASE_Z - 300);

        // Barge bow (front angled block)
        var bargeBowGeo = new THREE.BoxGeometry(10, 6, 10);
        makeMesh(bargeBowGeo, 0x7A3A10, BASE_X + 23, BASE_Y + 3, BASE_Z - 300, 0, 0, 0.3);

        // Barge tiller/rudder
        var bargeRudderGeo = new THREE.BoxGeometry(2, 5, 2);
        makeMesh(bargeRudderGeo, 0x5C3000, BASE_X - 22, BASE_Y + 4, BASE_Z - 300);

        // Barge chimney stack (stove pipe)
        var bargeChimneyGeo = new THREE.CylinderGeometry(0.8, 1, 8, 6);
        makeMesh(bargeChimneyGeo, 0x222222, BASE_X - 6, BASE_Y + 17, BASE_Z - 301);

        // Barge mooring rope loop (thick cylinder as coiled rope)
        var bargeRopeGeo = new THREE.CylinderGeometry(2, 2, 2, 8);
        makeMesh(bargeRopeGeo, 0xC8A060, BASE_X + 20, BASE_Y + 6, BASE_Z - 295);
    }

    function buildCamloughMountain() {
        // Camlough Mountain — green mountain mass to northwest
        var mountainBaseGeo = new THREE.BoxGeometry(600, 200, 500);
        makeMesh(mountainBaseGeo, 0x4A7C59, BASE_X - 900, BASE_Y + 80, BASE_Z - 600);

        // Mountain secondary peak
        var mountainPeakGeo = new THREE.ConeGeometry(220, 280, 6);
        makeMesh(mountainPeakGeo, 0x3D6B4A, BASE_X - 900, BASE_Y + 290, BASE_Z - 600);

        // Mountain shoulder ridge
        var mountainRidgeGeo = new THREE.BoxGeometry(400, 120, 300);
        makeMesh(mountainRidgeGeo, 0x4A7C59, BASE_X - 700, BASE_Y + 50, BASE_Z - 500);

        // Mountain foothills
        var foothillGeo = new THREE.BoxGeometry(300, 60, 200);
        makeMesh(foothillGeo, 0x3E6640, BASE_X - 600, BASE_Y + 20, BASE_Z - 450);

        // Camlough lake at base (small reservoir)
        var lakeGeo = new THREE.BoxGeometry(180, 3, 140);
        makeMesh(lakeGeo, 0x005580, BASE_X - 800, BASE_Y + 1, BASE_Z - 480);
    }

    function buildMiscDetails() {
        // Canal towpath bench 1
        var bench1SeatGeo = new THREE.BoxGeometry(6, 1, 2);
        makeMesh(bench1SeatGeo, 0x8B6040, BASE_X - 50, BASE_Y + 4, BASE_Z + 20);
        var bench1LegAGeo = new THREE.BoxGeometry(1, 4, 2);
        makeMesh(bench1LegAGeo, 0x333333, BASE_X - 52, BASE_Y + 2, BASE_Z + 20);
        var bench1LegBGeo = new THREE.BoxGeometry(1, 4, 2);
        makeMesh(bench1LegBGeo, 0x333333, BASE_X - 48, BASE_Y + 2, BASE_Z + 20);

        // Canal towpath bench 2
        var bench2SeatGeo = new THREE.BoxGeometry(6, 1, 2);
        makeMesh(bench2SeatGeo, 0x8B6040, BASE_X - 50, BASE_Y + 4, BASE_Z - 200);
        var bench2LegAGeo = new THREE.BoxGeometry(1, 4, 2);
        makeMesh(bench2LegAGeo, 0x333333, BASE_X - 52, BASE_Y + 2, BASE_Z - 200);
        var bench2LegBGeo = new THREE.BoxGeometry(1, 4, 2);
        makeMesh(bench2LegBGeo, 0x333333, BASE_X - 48, BASE_Y + 2, BASE_Z - 200);

        // Information sign post canal heritage
        var signPostGeo = new THREE.CylinderGeometry(0.5, 0.6, 10, 6);
        makeMesh(signPostGeo, 0x555555, BASE_X - 50, BASE_Y + 5, BASE_Z - 160);
        var signBoardGeo = new THREE.BoxGeometry(8, 5, 1);
        makeMesh(signBoardGeo, 0xDDBB44, BASE_X - 50, BASE_Y + 12, BASE_Z - 160);

        // Rubble stone wall along town edge
        var townWall1Geo = new THREE.BoxGeometry(180, 8, 5);
        makeMesh(townWall1Geo, 0x888877, BASE_X + 100, BASE_Y + 4, BASE_Z + 130);

        // Distant hills east — Slieve Gullion direction
        var eastHillGeo = new THREE.BoxGeometry(700, 120, 400);
        makeMesh(eastHillGeo, 0x4A6040, BASE_X + 900, BASE_Y + 40, BASE_Z - 200);

        var eastHillPeakGeo = new THREE.ConeGeometry(200, 180, 5);
        makeMesh(eastHillPeakGeo, 0x3E5535, BASE_X + 900, BASE_Y + 170, BASE_Z - 200);

        // Abandoned warehouse ruins near canal south
        var ruinWall1Geo = new THREE.BoxGeometry(5, 18, 40);
        makeMesh(ruinWall1Geo, 0x888070, BASE_X + 80, BASE_Y + 9, BASE_Z + 700);

        var ruinWall2Geo = new THREE.BoxGeometry(40, 14, 5);
        makeMesh(ruinWall2Geo, 0x888070, BASE_X + 80, BASE_Y + 7, BASE_Z + 680);

        // Canal marker stone at entry
        var markerStoneGeo = new THREE.BoxGeometry(5, 12, 4);
        makeMesh(markerStoneGeo, 0xAAAAAA, BASE_X - 24, BASE_Y + 6, BASE_Z - 490);

        // Weeping willow tree near river bank (thin drooping canopy)
        var willowTrunkGeo = new THREE.CylinderGeometry(1.5, 2.5, 16, 8);
        makeMesh(willowTrunkGeo, 0x5C3A1E, BASE_X - 280, BASE_Y + 8, BASE_Z + 595);
        var willowCanopyGeo = new THREE.SphereGeometry(14, 8, 5);
        makeMesh(willowCanopyGeo, 0x2E8B22, BASE_X - 280, BASE_Y + 22, BASE_Z + 595, 0, 0, 0, 1, 0.6, 1);

        // Second willow
        var willow2TrunkGeo = new THREE.CylinderGeometry(1.5, 2.5, 16, 8);
        makeMesh(willow2TrunkGeo, 0x5C3A1E, BASE_X - 380, BASE_Y + 8, BASE_Z + 610);
        var willow2CanopyGeo = new THREE.SphereGeometry(14, 8, 5);
        makeMesh(willow2CanopyGeo, 0x2E8B22, BASE_X - 380, BASE_Y + 22, BASE_Z + 610, 0, 0, 0, 1, 0.6, 1);

        // Electricity pylon near edge of town
        var pylonBaseGeo = new THREE.BoxGeometry(2, 40, 2);
        makeMesh(pylonBaseGeo, 0xAAAAAA, BASE_X + 350, BASE_Y + 20, BASE_Z + 200);
        var pylonArmGeo = new THREE.BoxGeometry(30, 2, 2);
        makeMesh(pylonArmGeo, 0xBBBBBB, BASE_X + 350, BASE_Y + 38, BASE_Z + 200);

        // Second pylon
        var pylon2BaseGeo = new THREE.BoxGeometry(2, 40, 2);
        makeMesh(pylon2BaseGeo, 0xAAAAAA, BASE_X + 350, BASE_Y + 20, BASE_Z + 350);
        var pylon2ArmGeo = new THREE.BoxGeometry(30, 2, 2);
        makeMesh(pylon2ArmGeo, 0xBBBBBB, BASE_X + 350, BASE_Y + 38, BASE_Z + 350);

        // Old mill building beside canal (linen milling heritage)
        var millGeo = new THREE.BoxGeometry(70, 40, 50);
        makeMesh(millGeo, 0xAA7755, BASE_X - 130, BASE_Y + 20, BASE_Z + 200);

        // Mill roof
        var millRoofGeo = new THREE.BoxGeometry(74, 10, 54);
        makeMesh(millRoofGeo, 0x774433, BASE_X - 130, BASE_Y + 45, BASE_Z + 200);

        // Mill chimney
        var millChimneyGeo = new THREE.CylinderGeometry(4, 5, 60, 8);
        makeMesh(millChimneyGeo, 0x886644, BASE_X - 150, BASE_Y + 30, BASE_Z + 200);

        // Mill chimney top ring
        var millChimTopGeo = new THREE.CylinderGeometry(5.5, 4, 4, 8);
        makeMesh(millChimTopGeo, 0x666644, BASE_X - 150, BASE_Y + 62, BASE_Z + 200);

        // Canal end terminus basin (wide turning area)
        var basinGeo = new THREE.BoxGeometry(100, 4, 80);
        makeMesh(basinGeo, 0x006994, BASE_X, BASE_Y - 1, BASE_Z - 880);

        // Basin stone quay wall
        var basinQuayGeo = new THREE.BoxGeometry(100, 8, 8);
        makeMesh(basinQuayGeo, 0x707070, BASE_X, BASE_Y + 3, BASE_Z - 924);

        // Newry town boundary stone
        var boundaryStonGeo = new THREE.BoxGeometry(4, 10, 2);
        makeMesh(boundaryStonGeo, 0xB0B0B0, BASE_X + 140, BASE_Y + 5, BASE_Z + 560);

        // Additional market stall shade
        var stallGeo = new THREE.BoxGeometry(14, 2, 10);
        makeMesh(stallGeo, 0xFF8844, BASE_X + 180, BASE_Y + 14, BASE_Z + 240);

        var stallPostAGeo = new THREE.CylinderGeometry(0.6, 0.6, 14, 6);
        makeMesh(stallPostAGeo, 0x888888, BASE_X + 174, BASE_Y + 7, BASE_Z + 240);

        var stallPostBGeo = new THREE.CylinderGeometry(0.6, 0.6, 14, 6);
        makeMesh(stallPostBGeo, 0x888888, BASE_X + 186, BASE_Y + 7, BASE_Z + 240);
    }

    function update(delta) {
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
