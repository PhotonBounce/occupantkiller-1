window.StamfordTown = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 21840;
    var BASE_Y = 0;
    var BASE_Z = 0;

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

    function makeLine(geo, color) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function build() {
        buildGround();
        buildStMaryChurch();
        buildAllSaintsChurch();
        buildStMartinsChurch();
        buildGeorgeHotel();
        buildBroadStreet();
        buildRiverWelland();
        buildTownBridge();
        buildBurghleyHouse();
        buildMedievalWalls();
        buildSheepMarket();
        buildStoneBuildings();
    }

    function buildGround() {
        // Ground plane using flat box
        var groundGeo = new THREE.BoxGeometry(600, 1, 600);
        makeMesh(groundGeo, 0x5A7A3A, BASE_X, BASE_Y - 0.5, BASE_Z);

        // Road surface - Broad Street main road
        var roadGeo = new THREE.BoxGeometry(8, 0.5, 300);
        makeMesh(roadGeo, 0x777777, BASE_X, BASE_Y + 0.1, BASE_Z);

        // East-west cross road
        var crossRoadGeo = new THREE.BoxGeometry(200, 0.5, 8);
        makeMesh(crossRoadGeo, 0x777777, BASE_X, BASE_Y + 0.1, BASE_Z + 20);

        // St Martin's road south of bridge
        var southRoadGeo = new THREE.BoxGeometry(8, 0.5, 80);
        makeMesh(southRoadGeo, 0x777777, BASE_X, BASE_Y + 0.1, BASE_Z + 80);
    }

    function buildStMaryChurch() {
        // St Mary's Church — one of England's finest medieval spires
        // Main nave
        var naveGeo = new THREE.BoxGeometry(18, 14, 36);
        makeMesh(naveGeo, 0xD4C8A0, BASE_X - 40, BASE_Y + 7, BASE_Z - 60);

        // Chancel (east end)
        var chancelGeo = new THREE.BoxGeometry(12, 12, 18);
        makeMesh(chancelGeo, 0xD4C8A0, BASE_X - 40, BASE_Y + 6, BASE_Z - 87);

        // Tower base
        var towerGeo = new THREE.BoxGeometry(10, 22, 10);
        makeMesh(towerGeo, 0xD4C8A0, BASE_X - 40, BASE_Y + 11, BASE_Z - 42);

        // Tower parapet
        var parapetGeo = new THREE.BoxGeometry(11, 3, 11);
        makeMesh(parapetGeo, 0xD4C8A0, BASE_X - 40, BASE_Y + 23.5, BASE_Z - 42);

        // Spire — tall octagonal limestone spire (signature feature)
        var spireGeo = new THREE.ConeGeometry(5, 55, 8);
        makeMesh(spireGeo, 0xD4C8A0, BASE_X - 40, BASE_Y + 52.5, BASE_Z - 42);

        // Spire pinnacles (4 corner pinnacles on tower)
        var pinnGeo1 = new THREE.ConeGeometry(0.8, 6, 4);
        makeMesh(pinnGeo1, 0xD4C8A0, BASE_X - 43, BASE_Y + 28, BASE_Z - 39);
        var pinnGeo2 = new THREE.ConeGeometry(0.8, 6, 4);
        makeMesh(pinnGeo2, 0xD4C8A0, BASE_X - 37, BASE_Y + 28, BASE_Z - 39);
        var pinnGeo3 = new THREE.ConeGeometry(0.8, 6, 4);
        makeMesh(pinnGeo3, 0xD4C8A0, BASE_X - 43, BASE_Y + 28, BASE_Z - 45);
        var pinnGeo4 = new THREE.ConeGeometry(0.8, 6, 4);
        makeMesh(pinnGeo4, 0xD4C8A0, BASE_X - 37, BASE_Y + 28, BASE_Z - 45);

        // South aisle
        var aisleGeo = new THREE.BoxGeometry(8, 11, 34);
        makeMesh(aisleGeo, 0xD4C8A0, BASE_X - 49, BASE_Y + 5.5, BASE_Z - 61);

        // Porch
        var porchGeo = new THREE.BoxGeometry(5, 8, 5);
        makeMesh(porchGeo, 0xD4C8A0, BASE_X - 49, BASE_Y + 4, BASE_Z - 52);
    }

    function buildAllSaintsChurch() {
        // All Saints Church — medieval church with prominent tower
        // Nave
        var naveGeo = new THREE.BoxGeometry(14, 12, 28);
        makeMesh(naveGeo, 0xD4C8A0, BASE_X + 30, BASE_Y + 6, BASE_Z - 50);

        // Tower (All Saints has a notable perpendicular tower)
        var towerGeo = new THREE.BoxGeometry(9, 24, 9);
        makeMesh(towerGeo, 0xD4C8A0, BASE_X + 30, BASE_Y + 12, BASE_Z - 35);

        // Tower top parapet
        var parapetGeo = new THREE.BoxGeometry(10, 2.5, 10);
        makeMesh(parapetGeo, 0xD4C8A0, BASE_X + 30, BASE_Y + 25.25, BASE_Z - 35);

        // Tower pinnacles
        var tpGeo1 = new THREE.ConeGeometry(0.7, 5, 4);
        makeMesh(tpGeo1, 0xD4C8A0, BASE_X + 27, BASE_Y + 29, BASE_Z - 32);
        var tpGeo2 = new THREE.ConeGeometry(0.7, 5, 4);
        makeMesh(tpGeo2, 0xD4C8A0, BASE_X + 33, BASE_Y + 29, BASE_Z - 32);
        var tpGeo3 = new THREE.ConeGeometry(0.7, 5, 4);
        makeMesh(tpGeo3, 0xD4C8A0, BASE_X + 27, BASE_Y + 29, BASE_Z - 38);
        var tpGeo4 = new THREE.ConeGeometry(0.7, 5, 4);
        makeMesh(tpGeo4, 0xD4C8A0, BASE_X + 33, BASE_Y + 29, BASE_Z - 38);

        // Chancel
        var chancelGeo = new THREE.BoxGeometry(10, 10, 16);
        makeMesh(chancelGeo, 0xD4C8A0, BASE_X + 30, BASE_Y + 5, BASE_Z - 67);

        // North aisle
        var northAisleGeo = new THREE.BoxGeometry(7, 9, 26);
        makeMesh(northAisleGeo, 0xD4C8A0, BASE_X + 38, BASE_Y + 4.5, BASE_Z - 50);
    }

    function buildStMartinsChurch() {
        // St Martin's Church — old borough south of the Welland
        // Nave
        var naveGeo = new THREE.BoxGeometry(13, 11, 24);
        makeMesh(naveGeo, 0xD4C8A0, BASE_X + 5, BASE_Y + 5.5, BASE_Z + 110);

        // Tower
        var towerGeo = new THREE.BoxGeometry(8, 20, 8);
        makeMesh(towerGeo, 0xD4C8A0, BASE_X + 5, BASE_Y + 10, BASE_Z + 96);

        // Battlemented parapet
        var parapetGeo = new THREE.BoxGeometry(9, 2, 9);
        makeMesh(parapetGeo, 0xD4C8A0, BASE_X + 5, BASE_Y + 21, BASE_Z + 96);

        // Pinnacles
        var sp1Geo = new THREE.ConeGeometry(0.6, 4, 4);
        makeMesh(sp1Geo, 0xD4C8A0, BASE_X + 2, BASE_Y + 25, BASE_Z + 93);
        var sp2Geo = new THREE.ConeGeometry(0.6, 4, 4);
        makeMesh(sp2Geo, 0xD4C8A0, BASE_X + 8, BASE_Y + 25, BASE_Z + 93);
        var sp3Geo = new THREE.ConeGeometry(0.6, 4, 4);
        makeMesh(sp3Geo, 0xD4C8A0, BASE_X + 2, BASE_Y + 25, BASE_Z + 99);
        var sp4Geo = new THREE.ConeGeometry(0.6, 4, 4);
        makeMesh(sp4Geo, 0xD4C8A0, BASE_X + 8, BASE_Y + 25, BASE_Z + 99);

        // Chancel
        var chGeo = new THREE.BoxGeometry(9, 9, 14);
        makeMesh(chGeo, 0xD4C8A0, BASE_X + 5, BASE_Y + 4.5, BASE_Z + 126);

        // Churchyard wall
        var cwGeo1 = new THREE.BoxGeometry(30, 2, 1);
        makeMesh(cwGeo1, 0xBBB8A0, BASE_X + 5, BASE_Y + 1, BASE_Z + 88);
        var cwGeo2 = new THREE.BoxGeometry(1, 2, 40);
        makeMesh(cwGeo2, 0xBBB8A0, BASE_X - 10, BASE_Y + 1, BASE_Z + 108);
        var cwGeo3 = new THREE.BoxGeometry(1, 2, 40);
        makeMesh(cwGeo3, 0xBBB8A0, BASE_X + 20, BASE_Y + 1, BASE_Z + 108);
    }

    function buildGeorgeHotel() {
        // The George Hotel — ancient coaching inn on St Martin's/High Street
        // Main inn building (substantial 3-storey Georgian frontage)
        var mainGeo = new THREE.BoxGeometry(30, 16, 18);
        makeMesh(mainGeo, 0xDEB887, BASE_X - 25, BASE_Y + 8, BASE_Z + 10);

        // Inn yard wing (north range)
        var northWingGeo = new THREE.BoxGeometry(18, 12, 14);
        makeMesh(northWingGeo, 0xDEB887, BASE_X - 25, BASE_Y + 6, BASE_Z - 6);

        // Inn yard wing (south range)
        var southWingGeo = new THREE.BoxGeometry(18, 12, 14);
        makeMesh(southWingGeo, 0xDEB887, BASE_X - 25, BASE_Y + 6, BASE_Z + 26);

        // Gallows sign post left
        var postLeftGeo = new THREE.CylinderGeometry(0.3, 0.3, 10, 6);
        makeMesh(postLeftGeo, 0x5C3A1E, BASE_X - 11, BASE_Y + 5, BASE_Z + 10);

        // Gallows sign post right
        var postRightGeo = new THREE.CylinderGeometry(0.3, 0.3, 10, 6);
        makeMesh(postRightGeo, 0x5C3A1E, BASE_X - 4, BASE_Y + 5, BASE_Z + 10);

        // Gallows crossbeam spanning road
        var crossbeamGeo = new THREE.BoxGeometry(8, 0.5, 0.5);
        makeMesh(crossbeamGeo, 0x5C3A1E, BASE_X - 7.5, BASE_Y + 10, BASE_Z + 10);

        // Sign board
        var signGeo = new THREE.BoxGeometry(4, 2, 0.3);
        makeMesh(signGeo, 0xDEB887, BASE_X - 7.5, BASE_Y + 9, BASE_Z + 10);

        // Roof
        var roofGeo = new THREE.BoxGeometry(31, 3, 19);
        makeMesh(roofGeo, 0xC8A87A, BASE_X - 25, BASE_Y + 17.5, BASE_Z + 10);

        // Stable block at rear
        var stableGeo = new THREE.BoxGeometry(20, 8, 12);
        makeMesh(stableGeo, 0xDEB887, BASE_X - 46, BASE_Y + 4, BASE_Z + 10);
    }

    function buildBroadStreet() {
        // Medieval townhouses along Broad Street — bay windows, jetted storeys
        // West side of Broad Street
        var th1Geo = new THREE.BoxGeometry(10, 14, 10);
        makeMesh(th1Geo, 0xD4C8A0, BASE_X - 10, BASE_Y + 7, BASE_Z - 20);

        var th2Geo = new THREE.BoxGeometry(10, 12, 10);
        makeMesh(th2Geo, 0xD4C8A0, BASE_X - 10, BASE_Y + 6, BASE_Z - 32);

        var th3Geo = new THREE.BoxGeometry(10, 15, 10);
        makeMesh(th3Geo, 0xD4C8A0, BASE_X - 10, BASE_Y + 7.5, BASE_Z - 44);

        // Bay window protrusions
        var bay1Geo = new THREE.BoxGeometry(2, 4, 3);
        makeMesh(bay1Geo, 0xD4C8A0, BASE_X - 5, BASE_Y + 7, BASE_Z - 20);
        var bay2Geo = new THREE.BoxGeometry(2, 4, 3);
        makeMesh(bay2Geo, 0xD4C8A0, BASE_X - 5, BASE_Y + 7, BASE_Z - 32);

        // East side of Broad Street
        var th4Geo = new THREE.BoxGeometry(10, 13, 10);
        makeMesh(th4Geo, 0xD4C8A0, BASE_X + 10, BASE_Y + 6.5, BASE_Z - 18);

        var th5Geo = new THREE.BoxGeometry(10, 14, 10);
        makeMesh(th5Geo, 0xD4C8A0, BASE_X + 10, BASE_Y + 7, BASE_Z - 30);

        var th6Geo = new THREE.BoxGeometry(10, 11, 10);
        makeMesh(th6Geo, 0xD4C8A0, BASE_X + 10, BASE_Y + 5.5, BASE_Z - 42);

        // Bay windows east side
        var bay3Geo = new THREE.BoxGeometry(2, 4, 3);
        makeMesh(bay3Geo, 0xD4C8A0, BASE_X + 15, BASE_Y + 7, BASE_Z - 18);

        // Rooflines — gabled
        var roof1Geo = new THREE.BoxGeometry(11, 3, 11);
        makeMesh(roof1Geo, 0xBBB098, BASE_X - 10, BASE_Y + 15.5, BASE_Z - 20);
        var roof2Geo = new THREE.BoxGeometry(11, 3, 11);
        makeMesh(roof2Geo, 0xBBB098, BASE_X - 10, BASE_Y + 13.5, BASE_Z - 32);
        var roof3Geo = new THREE.BoxGeometry(11, 3, 11);
        makeMesh(roof3Geo, 0xBBB098, BASE_X - 10, BASE_Y + 17, BASE_Z - 44);

        // Pavement/flagstone strip
        var pave1Geo = new THREE.BoxGeometry(3, 0.3, 60);
        makeMesh(pave1Geo, 0xC8C4B0, BASE_X - 6, BASE_Y + 0.2, BASE_Z - 30);
        var pave2Geo = new THREE.BoxGeometry(3, 0.3, 60);
        makeMesh(pave2Geo, 0xC8C4B0, BASE_X + 6, BASE_Y + 0.2, BASE_Z - 30);
    }

    function buildRiverWelland() {
        // River Welland flowing east-west south of town
        var riverGeo = new THREE.BoxGeometry(300, 0.6, 18);
        makeMesh(riverGeo, 0x4682B4, BASE_X, BASE_Y + 0.3, BASE_Z + 58);

        // River bank (north) — raised stone revetment
        var bankNGeo = new THREE.BoxGeometry(300, 2, 4);
        makeMesh(bankNGeo, 0xD4C8A0, BASE_X, BASE_Y + 1, BASE_Z + 49);

        // River bank (south)
        var bankSGeo = new THREE.BoxGeometry(300, 2, 4);
        makeMesh(bankSGeo, 0xD4C8A0, BASE_X, BASE_Y + 1, BASE_Z + 67);

        // Millstone (old mill site)
        var millstoneGeo = new THREE.CylinderGeometry(3, 3, 0.5, 12);
        makeMesh(millstoneGeo, 0xBBB8A0, BASE_X - 80, BASE_Y + 0.8, BASE_Z + 53);

        // Water mill remnant wall
        var millGeo = new THREE.BoxGeometry(12, 6, 8);
        makeMesh(millGeo, 0xD4C8A0, BASE_X - 80, BASE_Y + 3, BASE_Z + 50);

        // Meadow strip south of river
        var meadowGeo = new THREE.BoxGeometry(300, 0.4, 60);
        makeMesh(meadowGeo, 0x4A7A28, BASE_X, BASE_Y + 0.2, BASE_Z + 90);
    }

    function buildTownBridge() {
        // Town Bridge — medieval stone bridge with multiple arches over the Welland
        // Bridge deck
        var deckGeo = new THREE.BoxGeometry(12, 2, 20);
        makeMesh(deckGeo, 0xD4C8A0, BASE_X, BASE_Y + 2.5, BASE_Z + 58);

        // Bridge parapet north
        var parNGeo = new THREE.BoxGeometry(12, 2, 1);
        makeMesh(parNGeo, 0xD4C8A0, BASE_X, BASE_Y + 4, BASE_Z + 48);

        // Bridge parapet south
        var parSGeo = new THREE.BoxGeometry(12, 2, 1);
        makeMesh(parSGeo, 0xD4C8A0, BASE_X, BASE_Y + 4, BASE_Z + 68);

        // Bridge pier 1
        var pier1Geo = new THREE.BoxGeometry(3, 5, 4);
        makeMesh(pier1Geo, 0xD4C8A0, BASE_X, BASE_Y + 2.5, BASE_Z + 53);

        // Bridge pier 2
        var pier2Geo = new THREE.BoxGeometry(3, 5, 4);
        makeMesh(pier2Geo, 0xD4C8A0, BASE_X, BASE_Y + 2.5, BASE_Z + 63);

        // Arch voussoir visual (half-cylinder approximation with boxes)
        var arch1Geo = new THREE.BoxGeometry(10, 2, 3);
        makeMesh(arch1Geo, 0xBBB8A0, BASE_X, BASE_Y + 5, BASE_Z + 56);

        var arch2Geo = new THREE.BoxGeometry(10, 2, 3);
        makeMesh(arch2Geo, 0xBBB8A0, BASE_X, BASE_Y + 5, BASE_Z + 60);

        // Bridge cutwaters (triangular protections) using boxes angled
        var cutGeo1 = new THREE.BoxGeometry(1.5, 4, 2);
        makeMesh(cutGeo1, 0xD4C8A0, BASE_X - 5.5, BASE_Y + 1.5, BASE_Z + 58, 0, 0.785, 0);
        var cutGeo2 = new THREE.BoxGeometry(1.5, 4, 2);
        makeMesh(cutGeo2, 0xD4C8A0, BASE_X + 5.5, BASE_Y + 1.5, BASE_Z + 58, 0, 0.785, 0);
    }

    function buildBurghleyHouse() {
        // Burghley House — magnificent Elizabethan mansion to SE
        // Main house block (enormous)
        var mainGeo = new THREE.BoxGeometry(50, 18, 40);
        makeMesh(mainGeo, 0xF5F5DC, BASE_X + 150, BASE_Y + 9, BASE_Z + 150);

        // Six grand towers (signature feature)
        var t1Geo = new THREE.CylinderGeometry(5, 5.5, 28, 8);
        makeMesh(t1Geo, 0xF5F5DC, BASE_X + 130, BASE_Y + 14, BASE_Z + 138);

        var t2Geo = new THREE.CylinderGeometry(5, 5.5, 28, 8);
        makeMesh(t2Geo, 0xF5F5DC, BASE_X + 170, BASE_Y + 14, BASE_Z + 138);

        var t3Geo = new THREE.CylinderGeometry(5, 5.5, 28, 8);
        makeMesh(t3Geo, 0xF5F5DC, BASE_X + 130, BASE_Y + 14, BASE_Z + 162);

        var t4Geo = new THREE.CylinderGeometry(5, 5.5, 28, 8);
        makeMesh(t4Geo, 0xF5F5DC, BASE_X + 170, BASE_Y + 14, BASE_Z + 162);

        var t5Geo = new THREE.CylinderGeometry(4, 4.5, 25, 8);
        makeMesh(t5Geo, 0xF5F5DC, BASE_X + 150, BASE_Y + 12.5, BASE_Z + 135);

        var t6Geo = new THREE.CylinderGeometry(4, 4.5, 25, 8);
        makeMesh(t6Geo, 0xF5F5DC, BASE_X + 150, BASE_Y + 12.5, BASE_Z + 165);

        // Tower caps (Elizabethan lead domes)
        var cap1Geo = new THREE.SphereGeometry(5.5, 8, 6);
        makeMesh(cap1Geo, 0x7A8A7A, BASE_X + 130, BASE_Y + 30, BASE_Z + 138);
        var cap2Geo = new THREE.SphereGeometry(5.5, 8, 6);
        makeMesh(cap2Geo, 0x7A8A7A, BASE_X + 170, BASE_Y + 30, BASE_Z + 138);
        var cap3Geo = new THREE.SphereGeometry(5.5, 8, 6);
        makeMesh(cap3Geo, 0x7A8A7A, BASE_X + 130, BASE_Y + 30, BASE_Z + 162);
        var cap4Geo = new THREE.SphereGeometry(5.5, 8, 6);
        makeMesh(cap4Geo, 0x7A8A7A, BASE_X + 170, BASE_Y + 30, BASE_Z + 162);
        var cap5Geo = new THREE.SphereGeometry(4.5, 8, 6);
        makeMesh(cap5Geo, 0x7A8A7A, BASE_X + 150, BASE_Y + 28, BASE_Z + 135);
        var cap6Geo = new THREE.SphereGeometry(4.5, 8, 6);
        makeMesh(cap6Geo, 0x7A8A7A, BASE_X + 150, BASE_Y + 28, BASE_Z + 165);

        // Great gatehouse
        var gateGeo = new THREE.BoxGeometry(14, 22, 10);
        makeMesh(gateGeo, 0xF5F5DC, BASE_X + 150, BASE_Y + 11, BASE_Z + 128);

        // Gatehouse turrets
        var gTurret1Geo = new THREE.CylinderGeometry(2.5, 3, 20, 6);
        makeMesh(gTurret1Geo, 0xF5F5DC, BASE_X + 144, BASE_Y + 10, BASE_Z + 128);
        var gTurret2Geo = new THREE.CylinderGeometry(2.5, 3, 20, 6);
        makeMesh(gTurret2Geo, 0xF5F5DC, BASE_X + 156, BASE_Y + 10, BASE_Z + 128);

        // Park boundary wall
        var parkWall1Geo = new THREE.BoxGeometry(120, 3, 1);
        makeMesh(parkWall1Geo, 0xD4C8A0, BASE_X + 150, BASE_Y + 1.5, BASE_Z + 120);
        var parkWall2Geo = new THREE.BoxGeometry(1, 3, 60);
        makeMesh(parkWall2Geo, 0xD4C8A0, BASE_X + 90, BASE_Y + 1.5, BASE_Z + 150);

        // Park trees (represented as cylinders topped with spheres)
        var tree1TrunkGeo = new THREE.CylinderGeometry(0.8, 1, 8, 6);
        makeMesh(tree1TrunkGeo, 0x4A2A0A, BASE_X + 120, BASE_Y + 4, BASE_Z + 140);
        var tree1CanopyGeo = new THREE.SphereGeometry(5, 7, 5);
        makeMesh(tree1CanopyGeo, 0x2A5A1A, BASE_X + 120, BASE_Y + 12, BASE_Z + 140);

        var tree2TrunkGeo = new THREE.CylinderGeometry(0.8, 1, 8, 6);
        makeMesh(tree2TrunkGeo, 0x4A2A0A, BASE_X + 135, BASE_Y + 4, BASE_Z + 135);
        var tree2CanopyGeo = new THREE.SphereGeometry(5, 7, 5);
        makeMesh(tree2CanopyGeo, 0x2A5A1A, BASE_X + 135, BASE_Y + 12, BASE_Z + 135);
    }

    function buildMedievalWalls() {
        // Medieval town walls — fragment including St Peter's Gate
        // South wall section
        var wall1Geo = new THREE.BoxGeometry(40, 6, 2);
        makeMesh(wall1Geo, 0xBBB8A0, BASE_X - 60, BASE_Y + 3, BASE_Z - 10);

        // East wall section
        var wall2Geo = new THREE.BoxGeometry(2, 6, 40);
        makeMesh(wall2Geo, 0xBBB8A0, BASE_X - 80, BASE_Y + 3, BASE_Z - 30);

        // St Peter's Gate — arch gatehouse
        var gateBodyGeo = new THREE.BoxGeometry(10, 12, 4);
        makeMesh(gateBodyGeo, 0xBBB8A0, BASE_X - 60, BASE_Y + 6, BASE_Z - 10);

        // Gate arch lintel
        var lintelGeo = new THREE.BoxGeometry(5, 1.5, 5);
        makeMesh(lintelGeo, 0xBBB8A0, BASE_X - 60, BASE_Y + 5, BASE_Z - 10);

        // Battlements on gate
        var battGeo = new THREE.BoxGeometry(11, 2, 5);
        makeMesh(battGeo, 0xBBB8A0, BASE_X - 60, BASE_Y + 13, BASE_Z - 10);

        // Wall walk merlon 1
        var merlon1Geo = new THREE.BoxGeometry(2, 2, 2);
        makeMesh(merlon1Geo, 0xBBB8A0, BASE_X - 55, BASE_Y + 8, BASE_Z - 10);
        // Wall walk merlon 2
        var merlon2Geo = new THREE.BoxGeometry(2, 2, 2);
        makeMesh(merlon2Geo, 0xBBB8A0, BASE_X - 50, BASE_Y + 7, BASE_Z - 10);
        // Wall walk merlon 3
        var merlon3Geo = new THREE.BoxGeometry(2, 2, 2);
        makeMesh(merlon3Geo, 0xBBB8A0, BASE_X - 45, BASE_Y + 7, BASE_Z - 10);

        // Wall tower
        var wallTowerGeo = new THREE.BoxGeometry(7, 9, 7);
        makeMesh(wallTowerGeo, 0xBBB8A0, BASE_X - 80, BASE_Y + 4.5, BASE_Z - 10);
    }

    function buildSheepMarket() {
        // Sheep Market — old medieval market area
        // Market place surface
        var marketGeo = new THREE.BoxGeometry(40, 0.3, 30);
        makeMesh(marketGeo, 0x999888, BASE_X + 60, BASE_Y + 0.2, BASE_Z - 10);

        // Market cross (stone column)
        var crossShaftGeo = new THREE.CylinderGeometry(0.4, 0.6, 8, 6);
        makeMesh(crossShaftGeo, 0xD4C8A0, BASE_X + 60, BASE_Y + 4, BASE_Z - 10);

        // Cross steps
        var step1Geo = new THREE.CylinderGeometry(2, 2.5, 0.6, 6);
        makeMesh(step1Geo, 0xD4C8A0, BASE_X + 60, BASE_Y + 0.3, BASE_Z - 10);
        var step2Geo = new THREE.CylinderGeometry(1.4, 1.6, 0.6, 6);
        makeMesh(step2Geo, 0xD4C8A0, BASE_X + 60, BASE_Y + 0.9, BASE_Z - 10);

        // Cross top finial
        var crossTopGeo = new THREE.ConeGeometry(0.5, 2, 4);
        makeMesh(crossTopGeo, 0xD4C8A0, BASE_X + 60, BASE_Y + 9, BASE_Z - 10);

        // Market building (old shambles / butchers row)
        var shamblesGeo = new THREE.BoxGeometry(20, 8, 8);
        makeMesh(shamblesGeo, 0xD4C8A0, BASE_X + 60, BASE_Y + 4, BASE_Z - 25);

        // Market building roof
        var shRoofGeo = new THREE.BoxGeometry(21, 2, 9);
        makeMesh(shRoofGeo, 0xBBB098, BASE_X + 60, BASE_Y + 9, BASE_Z - 25);

        // Surrounding townhouses (north side of market)
        var mh1Geo = new THREE.BoxGeometry(12, 13, 9);
        makeMesh(mh1Geo, 0xD4C8A0, BASE_X + 48, BASE_Y + 6.5, BASE_Z + 2);
        var mh2Geo = new THREE.BoxGeometry(12, 11, 9);
        makeMesh(mh2Geo, 0xD4C8A0, BASE_X + 62, BASE_Y + 5.5, BASE_Z + 2);
        var mh3Geo = new THREE.BoxGeometry(12, 14, 9);
        makeMesh(mh3Geo, 0xD4C8A0, BASE_X + 76, BASE_Y + 7, BASE_Z + 2);

        // Roofs
        var mroof1Geo = new THREE.BoxGeometry(13, 2.5, 10);
        makeMesh(mroof1Geo, 0xBBB098, BASE_X + 48, BASE_Y + 14.25, BASE_Z + 2);
        var mroof2Geo = new THREE.BoxGeometry(13, 2.5, 10);
        makeMesh(mroof2Geo, 0xBBB098, BASE_X + 62, BASE_Y + 12.25, BASE_Z + 2);
        var mroof3Geo = new THREE.BoxGeometry(13, 2.5, 10);
        makeMesh(mroof3Geo, 0xBBB098, BASE_X + 76, BASE_Y + 15.25, BASE_Z + 2);
    }

    function buildStoneBuildings() {
        // Additional Stamford stone buildings filling out the town fabric
        // High Street East buildings
        var hs1Geo = new THREE.BoxGeometry(10, 12, 9);
        makeMesh(hs1Geo, 0xD4C8A0, BASE_X + 15, BASE_Y + 6, BASE_Z + 15);
        var hs2Geo = new THREE.BoxGeometry(10, 10, 9);
        makeMesh(hs2Geo, 0xD4C8A0, BASE_X + 27, BASE_Y + 5, BASE_Z + 15);
        var hs3Geo = new THREE.BoxGeometry(10, 13, 9);
        makeMesh(hs3Geo, 0xD4C8A0, BASE_X + 39, BASE_Y + 6.5, BASE_Z + 15);

        // St George's Square area
        var sg1Geo = new THREE.BoxGeometry(10, 11, 9);
        makeMesh(sg1Geo, 0xD4C8A0, BASE_X + 15, BASE_Y + 5.5, BASE_Z - 8);
        var sg2Geo = new THREE.BoxGeometry(10, 14, 9);
        makeMesh(sg2Geo, 0xD4C8A0, BASE_X + 27, BASE_Y + 7, BASE_Z - 8);

        // Red Lion Square buildings
        var rl1Geo = new THREE.BoxGeometry(11, 12, 9);
        makeMesh(rl1Geo, 0xD4C8A0, BASE_X - 20, BASE_Y + 6, BASE_Z + 15);
        var rl2Geo = new THREE.BoxGeometry(11, 10, 9);
        makeMesh(rl2Geo, 0xD4C8A0, BASE_X - 32, BASE_Y + 5, BASE_Z + 15);

        // Scotgate (former medieval gate area)
        var scot1Geo = new THREE.BoxGeometry(9, 11, 9);
        makeMesh(scot1Geo, 0xD4C8A0, BASE_X - 50, BASE_Y + 5.5, BASE_Z - 30);
        var scot2Geo = new THREE.BoxGeometry(9, 13, 9);
        makeMesh(scot2Geo, 0xD4C8A0, BASE_X - 61, BASE_Y + 6.5, BASE_Z - 30);

        // St Paul's Street buildings
        var sp1Geo = new THREE.BoxGeometry(9, 10, 9);
        makeMesh(sp1Geo, 0xD4C8A0, BASE_X - 50, BASE_Y + 5, BASE_Z - 50);
        var sp2Geo = new THREE.BoxGeometry(9, 12, 9);
        makeMesh(sp2Geo, 0xD4C8A0, BASE_X - 61, BASE_Y + 6, BASE_Z - 50);

        // Roofs on additional buildings
        var ar1Geo = new THREE.BoxGeometry(11, 2, 10);
        makeMesh(ar1Geo, 0xBBB098, BASE_X + 15, BASE_Y + 13, BASE_Z + 15);
        var ar2Geo = new THREE.BoxGeometry(11, 2, 10);
        makeMesh(ar2Geo, 0xBBB098, BASE_X + 27, BASE_Y + 11, BASE_Z + 15);
        var ar3Geo = new THREE.BoxGeometry(11, 2, 10);
        makeMesh(ar3Geo, 0xBBB098, BASE_X + 39, BASE_Y + 14, BASE_Z + 15);

        // Tall Georgian terrace on Ironmonger Street
        var ironGeo = new THREE.BoxGeometry(40, 16, 10);
        makeMesh(ironGeo, 0xD4C8A0, BASE_X - 55, BASE_Y + 8, BASE_Z - 70);
        var ironRoofGeo = new THREE.BoxGeometry(41, 3, 11);
        makeMesh(ironRoofGeo, 0xBBB098, BASE_X - 55, BASE_Y + 17.5, BASE_Z - 70);

        // Browne's Hospital — medieval almshouse
        var browneGeo = new THREE.BoxGeometry(22, 11, 12);
        makeMesh(browneGeo, 0xD4C8A0, BASE_X + 50, BASE_Y + 5.5, BASE_Z - 50);
        var browneRoofGeo = new THREE.BoxGeometry(23, 2.5, 13);
        makeMesh(browneRoofGeo, 0xBBB098, BASE_X + 50, BASE_Y + 12.25, BASE_Z - 50);
        // Chapel wing
        var chapelGeo = new THREE.BoxGeometry(8, 10, 8);
        makeMesh(chapelGeo, 0xD4C8A0, BASE_X + 60, BASE_Y + 5, BASE_Z - 54);
        var chapelRoofGeo = new THREE.BoxGeometry(9, 2, 9);
        makeMesh(chapelRoofGeo, 0xBBB098, BASE_X + 60, BASE_Y + 11, BASE_Z - 54);

        // Street lamp posts (wrought-iron style, cylindrical)
        var lamp1Geo = new THREE.CylinderGeometry(0.15, 0.2, 6, 5);
        makeMesh(lamp1Geo, 0x2A2A2A, BASE_X - 6, BASE_Y + 3, BASE_Z - 10);
        var lamp1TopGeo = new THREE.SphereGeometry(0.4, 5, 4);
        makeMesh(lamp1TopGeo, 0xFFFFCC, BASE_X - 6, BASE_Y + 6.4, BASE_Z - 10);

        var lamp2Geo = new THREE.CylinderGeometry(0.15, 0.2, 6, 5);
        makeMesh(lamp2Geo, 0x2A2A2A, BASE_X + 6, BASE_Y + 3, BASE_Z - 10);
        var lamp2TopGeo = new THREE.SphereGeometry(0.4, 5, 4);
        makeMesh(lamp2TopGeo, 0xFFFFCC, BASE_X + 6, BASE_Y + 6.4, BASE_Z - 10);

        var lamp3Geo = new THREE.CylinderGeometry(0.15, 0.2, 6, 5);
        makeMesh(lamp3Geo, 0x2A2A2A, BASE_X - 6, BASE_Y + 3, BASE_Z + 25);
        var lamp3TopGeo = new THREE.SphereGeometry(0.4, 5, 4);
        makeMesh(lamp3TopGeo, 0xFFFFCC, BASE_X - 6, BASE_Y + 6.4, BASE_Z + 25);

        // Town Hall / Assembly rooms
        var townHallGeo = new THREE.BoxGeometry(24, 14, 14);
        makeMesh(townHallGeo, 0xD4C8A0, BASE_X + 20, BASE_Y + 7, BASE_Z - 55);
        var townHallRoofGeo = new THREE.BoxGeometry(25, 3, 15);
        makeMesh(townHallRoofGeo, 0xBBB098, BASE_X + 20, BASE_Y + 15.5, BASE_Z - 55);
        // Columns on portico
        var col1Geo = new THREE.CylinderGeometry(0.6, 0.8, 10, 8);
        makeMesh(col1Geo, 0xE8E0C8, BASE_X + 14, BASE_Y + 5, BASE_Z - 49);
        var col2Geo = new THREE.CylinderGeometry(0.6, 0.8, 10, 8);
        makeMesh(col2Geo, 0xE8E0C8, BASE_X + 18, BASE_Y + 5, BASE_Z - 49);
        var col3Geo = new THREE.CylinderGeometry(0.6, 0.8, 10, 8);
        makeMesh(col3Geo, 0xE8E0C8, BASE_X + 22, BASE_Y + 5, BASE_Z - 49);
        var col4Geo = new THREE.CylinderGeometry(0.6, 0.8, 10, 8);
        makeMesh(col4Geo, 0xE8E0C8, BASE_X + 26, BASE_Y + 5, BASE_Z - 49);
    }

    function update(delta) {
        // No animation needed for static town environment
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
