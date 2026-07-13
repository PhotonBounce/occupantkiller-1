window.CelbridgeManor = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 19080;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildCastletownHouse();
        buildColonnadeWings();
        buildPavilions();
        buildPrintRoom();
        buildFormalAvenue();
        buildParklandTrees();
        buildWonderfulBarn();
        buildRiverLiffey();
        buildCelbridgeVillage();
        buildOldBridge();
        buildWalledGarden();
        buildCoachHouses();
        buildClockTower();
        buildTeaRooms();
        buildHaHaWall();
        buildEstateFences();
        buildSkyBox();
    }

    function buildGround() {
        // Main parkland ground — large flat box
        makeMesh(new THREE.BoxGeometry(1200, 2, 1200), 0x228B22, 0, -1, 0);
        // Formal approach forecourt — gravel
        makeMesh(new THREE.BoxGeometry(60, 1, 300), 0x8B7355, 0, -0.4, -200);
        // Rear garden lawn
        makeMesh(new THREE.BoxGeometry(300, 1, 200), 0x32CD32, 0, -0.4, 160);
    }

    function buildCastletownHouse() {
        // === MAIN CENTRAL BLOCK ===
        // Ground floor
        makeMesh(new THREE.BoxGeometry(120, 12, 40), 0xF5F0E8, 0, 6, 0);
        // First floor
        makeMesh(new THREE.BoxGeometry(118, 10, 38), 0xF5F0E8, 0, 17, 0);
        // Second floor / attic
        makeMesh(new THREE.BoxGeometry(116, 8, 36), 0xF5F0E8, 0, 26, 0);
        // Roof parapet
        makeMesh(new THREE.BoxGeometry(122, 2, 42), 0xE8E0D0, 0, 31, 0);

        // === MAIN ENTRANCE PORTICO ===
        // Portico base steps
        makeMesh(new THREE.BoxGeometry(24, 1.5, 6), 0xDDD5C0, 0, 0.75, -22);
        makeMesh(new THREE.BoxGeometry(20, 1.5, 5), 0xDDD5C0, 0, 2.25, -22);
        // Portico columns (6 columns)
        makeMesh(new THREE.CylinderGeometry(0.8, 0.9, 16, 10), 0xF0EBE0, -10, 9, -23);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.9, 16, 10), 0xF0EBE0, -6, 9, -23);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.9, 16, 10), 0xF0EBE0, -2, 9, -23);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.9, 16, 10), 0xF0EBE0, 2, 9, -23);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.9, 16, 10), 0xF0EBE0, 6, 9, -23);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.9, 16, 10), 0xF0EBE0, 10, 9, -23);
        // Portico entablature
        makeMesh(new THREE.BoxGeometry(26, 2.5, 3), 0xEDE5D0, 0, 18, -23);
        // Portico pediment
        makeMesh(new THREE.BoxGeometry(26, 1, 3), 0xEDE5D0, 0, 20, -23);

        // === WINDOWS — GROUND FLOOR (13 bays) ===
        var winColor = 0x87CEEB;
        var winFrameColor = 0xF5F0E8;
        for (var i = -6; i <= 6; i++) {
            // Ground floor windows
            makeMesh(new THREE.BoxGeometry(5, 8, 0.5), winColor, i * 9, 7, -20.3);
            makeMesh(new THREE.BoxGeometry(5.5, 8.5, 0.3), winFrameColor, i * 9, 7, -20.6);
            // First floor windows
            makeMesh(new THREE.BoxGeometry(4.5, 7, 0.5), winColor, i * 9, 18, -19.3);
            makeMesh(new THREE.BoxGeometry(5, 7.5, 0.3), winFrameColor, i * 9, 18, -19.6);
            // Second floor windows (smaller)
            makeMesh(new THREE.BoxGeometry(3.5, 4, 0.5), winColor, i * 9, 27, -18.3);
        }

        // === MAIN DOORWAY ===
        makeMesh(new THREE.BoxGeometry(6, 10, 1), 0x3D2B1F, 0, 6, -20.5);
        // Door fanlight
        makeMesh(new THREE.SphereGeometry(3, 8, 4, 0, Math.PI), 0x87CEEB, 0, 12, -20.5);

        // === CHIMNEYS ===
        makeMesh(new THREE.BoxGeometry(3, 8, 3), 0xC8B89A, -40, 36, 5);
        makeMesh(new THREE.BoxGeometry(3, 8, 3), 0xC8B89A, -20, 36, 5);
        makeMesh(new THREE.BoxGeometry(3, 8, 3), 0xC8B89A, 0, 36, 5);
        makeMesh(new THREE.BoxGeometry(3, 8, 3), 0xC8B89A, 20, 36, 5);
        makeMesh(new THREE.BoxGeometry(3, 8, 3), 0xC8B89A, 40, 36, 5);
    }

    function buildColonnadeWings() {
        // === LEFT CURVED COLONNADE ===
        // Colonnade base / corridor
        makeMesh(new THREE.BoxGeometry(50, 6, 8), 0xF0EBE0, -95, 3, -5);
        // Left colonnade columns — curved row approximated with angled CylinderGeometry
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, -72, 5, -8);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, -78, 5, -10);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, -84, 5, -11);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, -90, 5, -11);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, -96, 5, -10);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, -102, 5, -8);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, -108, 5, -5);
        // Colonnade entablature
        makeMesh(new THREE.BoxGeometry(52, 2, 4), 0xEDE5D0, -95, 10, -9);

        // === RIGHT CURVED COLONNADE ===
        makeMesh(new THREE.BoxGeometry(50, 6, 8), 0xF0EBE0, 95, 3, -5);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, 72, 5, -8);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, 78, 5, -10);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, 84, 5, -11);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, 90, 5, -11);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, 96, 5, -10);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, 102, 5, -8);
        makeMesh(new THREE.CylinderGeometry(0.7, 0.8, 8, 10), 0xF5F0E8, 108, 5, -5);
        makeMesh(new THREE.BoxGeometry(52, 2, 4), 0xEDE5D0, 95, 10, -9);
    }

    function buildPavilions() {
        // === LEFT PAVILION FLANKER ===
        makeMesh(new THREE.BoxGeometry(35, 22, 30), 0xF5F0E8, -137, 11, 0);
        // Left pavilion roof
        makeMesh(new THREE.BoxGeometry(37, 3, 32), 0xE8E0D0, -137, 23.5, 0);
        // Left pavilion windows
        makeMesh(new THREE.BoxGeometry(5, 7, 0.5), 0x87CEEB, -137, 8, -15.3);
        makeMesh(new THREE.BoxGeometry(5, 7, 0.5), 0x87CEEB, -137, 17, -15.3);
        // Left pavilion chimney
        makeMesh(new THREE.BoxGeometry(3, 7, 3), 0xC8B89A, -145, 29, 5);

        // === RIGHT PAVILION FLANKER ===
        makeMesh(new THREE.BoxGeometry(35, 22, 30), 0xF5F0E8, 137, 11, 0);
        // Right pavilion roof
        makeMesh(new THREE.BoxGeometry(37, 3, 32), 0xE8E0D0, 137, 23.5, 0);
        // Right pavilion windows
        makeMesh(new THREE.BoxGeometry(5, 7, 0.5), 0x87CEEB, 137, 8, -15.3);
        makeMesh(new THREE.BoxGeometry(5, 7, 0.5), 0x87CEEB, 137, 17, -15.3);
        // Right pavilion chimney
        makeMesh(new THREE.BoxGeometry(3, 7, 3), 0xC8B89A, 145, 29, 5);
    }

    function buildPrintRoom() {
        // Print Room is visible through large windows on east side of house
        // Interior wall behind glass
        makeMesh(new THREE.BoxGeometry(25, 14, 1), 0xFFF8F0, 30, 14, 18.8);
        // Large print room windows
        makeMesh(new THREE.BoxGeometry(10, 11, 0.6), 0x87CEEB, 22, 14, 19.6);
        makeMesh(new THREE.BoxGeometry(10, 11, 0.6), 0x87CEEB, 38, 14, 19.6);
        // Window frames
        makeMesh(new THREE.BoxGeometry(10.5, 11.5, 0.3), 0xF5F0E8, 22, 14, 19.9);
        makeMesh(new THREE.BoxGeometry(10.5, 11.5, 0.3), 0xF5F0E8, 38, 14, 19.9);
        // Interior ceiling cornice suggestion
        makeMesh(new THREE.BoxGeometry(24, 1, 20), 0xFFF0E0, 30, 21, 9);
    }

    function buildFormalAvenue() {
        // Long gravel avenue leading to house
        makeMesh(new THREE.BoxGeometry(14, 0.5, 500), 0x8B7355, 0, 0.25, -330);
        // Avenue edge strips
        makeMesh(new THREE.BoxGeometry(1, 0.5, 500), 0x7A6245, -7, 0.25, -330);
        makeMesh(new THREE.BoxGeometry(1, 0.5, 500), 0x7A6245, 7, 0.25, -330);

        // Avenue trees — pairs flanking the road
        var treePositions = [-60, -90, -120, -150, -180, -210, -240, -270, -300, -330, -360, -390];
        for (var t = 0; t < treePositions.length; t++) {
            var tz = treePositions[t];
            // Left tree trunk
            makeMesh(new THREE.CylinderGeometry(0.6, 0.8, 8, 7), 0x5C3317, -18, 4, tz);
            // Left tree canopy
            makeMesh(new THREE.SphereGeometry(5, 7, 5), 0x2D5A1B, -18, 12, tz);
            // Right tree trunk
            makeMesh(new THREE.CylinderGeometry(0.6, 0.8, 8, 7), 0x5C3317, 18, 4, tz);
            // Right tree canopy
            makeMesh(new THREE.SphereGeometry(5, 7, 5), 0x2D5A1B, 18, 12, tz);
        }
    }

    function buildParklandTrees() {
        // Scattered parkland trees
        var parkTrees = [
            [-80, -80], [100, -60], [-140, 20], [160, 30],
            [-200, 50], [220, 80], [-60, 100], [90, 120],
            [-180, 150], [200, 160], [-120, -50], [140, -40],
            [250, 20], [-250, 40], [300, -20], [-300, 60]
        ];
        for (var p = 0; p < parkTrees.length; p++) {
            var px = parkTrees[p][0];
            var pz = parkTrees[p][1];
            makeMesh(new THREE.CylinderGeometry(0.7, 1.0, 10, 7), 0x5C3317, px, 5, pz);
            makeMesh(new THREE.SphereGeometry(6, 7, 5), 0x2A5210, px, 14, pz);
        }
    }

    function buildWonderfulBarn() {
        // Wonderful Barn — corkscrew tapered barn near Leixlip, placed north-east of estate
        var bx = 250;
        var bz = -80;
        // Foundation
        makeMesh(new THREE.CylinderGeometry(9, 10, 3, 12), 0x8B7355, bx, 1.5, bz);
        // Main tapering sections stacked — each narrower and offset slightly
        makeMesh(new THREE.CylinderGeometry(8.5, 9, 6, 12), 0x8B7355, bx, 6, bz);
        makeMesh(new THREE.CylinderGeometry(7.5, 8.5, 6, 12), 0x8B7355, bx, 12, bz);
        makeMesh(new THREE.CylinderGeometry(6.5, 7.5, 6, 12), 0x8B7355, bx, 18, bz);
        makeMesh(new THREE.CylinderGeometry(5.5, 6.5, 6, 12), 0x8B7355, bx, 24, bz);
        makeMesh(new THREE.CylinderGeometry(4.5, 5.5, 6, 12), 0x8B7355, bx, 30, bz);
        makeMesh(new THREE.CylinderGeometry(3.5, 4.5, 6, 12), 0x8B7355, bx, 36, bz);
        makeMesh(new THREE.CylinderGeometry(2.5, 3.5, 5, 12), 0x8B7355, bx, 42, bz);
        // Conical cap
        makeMesh(new THREE.ConeGeometry(3, 5, 12), 0x7A6245, bx, 47, bz);

        // External spiral staircase steps winding up the barn
        // Each step is a BoxGeometry placed at increasing height and rotated angle
        var stepCount = 24;
        for (var s = 0; s < stepCount; s++) {
            var angle = (s / stepCount) * Math.PI * 4; // two full rotations
            var radius = 9.5 - (s / stepCount) * 5;
            var sx2 = bx + Math.cos(angle) * radius;
            var sz2 = bz + Math.sin(angle) * radius;
            var sy2 = (s / stepCount) * 44 + 1;
            var stepMesh = makeMesh(new THREE.BoxGeometry(2.5, 0.5, 1.2), 0x7A6245, sx2 - OX, sy2, sz2 - OZ);
            stepMesh.rotation.y = angle + Math.PI / 2;
        }
    }

    function buildRiverLiffey() {
        // River Liffey flowing through estate — long winding water body
        makeMesh(new THREE.BoxGeometry(20, 0.8, 400), 0x006994, -180, -0.4, 100);
        // River bend sections
        makeMesh(new THREE.BoxGeometry(100, 0.8, 20), 0x006994, -130, -0.4, 300);
        makeMesh(new THREE.BoxGeometry(20, 0.8, 120), 0x006994, -80, -0.4, 260);
        // River banks
        makeMesh(new THREE.BoxGeometry(4, 1.5, 400), 0x6B5A3E, -192, 0, 100);
        makeMesh(new THREE.BoxGeometry(4, 1.5, 400), 0x6B5A3E, -168, 0, 100);
    }

    function buildCelbridgeVillage() {
        // Georgian village buildings along main street
        var villageZ = -420;
        // Row of Georgian terraced houses
        makeMesh(new THREE.BoxGeometry(12, 14, 10), 0xCD5C5C, -30, 7, villageZ);
        makeMesh(new THREE.BoxGeometry(12, 16, 10), 0xB85450, -18, 8, villageZ);
        makeMesh(new THREE.BoxGeometry(12, 14, 10), 0xCD5C5C, -6, 7, villageZ);
        makeMesh(new THREE.BoxGeometry(14, 18, 12), 0xA0522D, 8, 9, villageZ);
        makeMesh(new THREE.BoxGeometry(12, 14, 10), 0xCD5C5C, 22, 7, villageZ);
        makeMesh(new THREE.BoxGeometry(12, 16, 10), 0xB85450, 34, 8, villageZ);
        // Village church
        makeMesh(new THREE.BoxGeometry(16, 22, 24), 0x9B9B9B, -50, 11, villageZ - 10);
        makeMesh(new THREE.ConeGeometry(4, 14, 8), 0x8B8B8B, -50, 29, villageZ - 10);
        // Church tower
        makeMesh(new THREE.BoxGeometry(7, 30, 7), 0x9B9B9B, -50, 15, villageZ - 22);
        makeMesh(new THREE.ConeGeometry(4.5, 8, 8), 0x8B8B8B, -50, 34, villageZ - 22);
        // Village street / road
        makeMesh(new THREE.BoxGeometry(10, 0.5, 200), 0x5A5A5A, 0, 0.25, villageZ + 100);
        // Village pub / inn
        makeMesh(new THREE.BoxGeometry(14, 12, 10), 0x8B4513, 50, 6, villageZ);
        makeMesh(new THREE.BoxGeometry(14, 1.5, 10), 0x7A3B0B, 50, 12.75, villageZ);
        // Pub sign post
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), 0x5C3317, 44, 4, villageZ - 6);
        makeMesh(new THREE.BoxGeometry(3, 2, 0.2), 0x8B4513, 44, 9, villageZ - 6);
    }

    function buildOldBridge() {
        // Old stone bridge over the Liffey at Celbridge
        var bridgeZ = -50;
        // Main bridge deck
        makeMesh(new THREE.BoxGeometry(24, 2, 10), 0x8B8682, -180, 2, bridgeZ);
        // Bridge arch supports — large cylinders rotated to suggest arches
        makeMesh(new THREE.CylinderGeometry(5, 5, 2.5, 10), 0x7A7572, -180, 0.5, bridgeZ);
        // Bridge parapets
        makeMesh(new THREE.BoxGeometry(24, 3, 1), 0x9B9B8E, -180, 4, bridgeZ - 5);
        makeMesh(new THREE.BoxGeometry(24, 3, 1), 0x9B9B8E, -180, 4, bridgeZ + 5);
        // Bridge pillars
        makeMesh(new THREE.BoxGeometry(3, 6, 8), 0x8B8682, -168, 1, bridgeZ);
        makeMesh(new THREE.BoxGeometry(3, 6, 8), 0x8B8682, -192, 1, bridgeZ);
    }

    function buildWalledGarden() {
        // High walled garden enclosure — north-east of main house
        var wgx = 80;
        var wgz = 80;
        var wallH = 14;
        var wallT = 2;
        // North wall
        makeMesh(new THREE.BoxGeometry(80, wallH, wallT), 0x8B7355, wgx, wallH / 2, wgz - 40);
        // South wall
        makeMesh(new THREE.BoxGeometry(80, wallH, wallT), 0x8B7355, wgx, wallH / 2, wgz + 40);
        // East wall
        makeMesh(new THREE.BoxGeometry(wallT, wallH, 80), 0x8B7355, wgx + 40, wallH / 2, wgz);
        // West wall with gateway
        makeMesh(new THREE.BoxGeometry(30, wallH, wallT), 0x8B7355, wgx - 25, wallH / 2, wgz);
        makeMesh(new THREE.BoxGeometry(30, wallH, wallT), 0x8B7355, wgx + 10, wallH / 2, wgz);
        // Gateway arch above entrance
        makeMesh(new THREE.BoxGeometry(10, 4, 3), 0x8B7355, wgx - 8, wallH - 1, wgz);
        // Interior garden paths
        makeMesh(new THREE.BoxGeometry(1.5, 0.3, 78), 0xA08860, wgx, 0.15, wgz);
        makeMesh(new THREE.BoxGeometry(78, 0.3, 1.5), 0xA08860, wgx, 0.15, wgz);
        // Garden beds
        makeMesh(new THREE.BoxGeometry(30, 0.8, 30), 0x5C3A1E, wgx - 15, 0.4, wgz - 15);
        makeMesh(new THREE.BoxGeometry(30, 0.8, 30), 0x5C3A1E, wgx + 15, 0.4, wgz + 15);
    }

    function buildCoachHouses() {
        // Stone stable yard west of main house
        var cx = -180;
        var cz = 60;
        // Main stable block
        makeMesh(new THREE.BoxGeometry(50, 12, 20), 0x8B7355, cx, 6, cz);
        // Stable roof
        makeMesh(new THREE.BoxGeometry(52, 2, 22), 0x7A6245, cx, 13, cz);
        // Stable yard wall — north
        makeMesh(new THREE.BoxGeometry(50, 7, 2), 0x8B7355, cx, 3.5, cz - 30);
        // Stable yard wall — south
        makeMesh(new THREE.BoxGeometry(50, 7, 2), 0x8B7355, cx, 3.5, cz + 30);
        // Stable yard wall — east
        makeMesh(new THREE.BoxGeometry(2, 7, 60), 0x8B7355, cx + 25, 3.5, cz);
        // Stable doors — arched openings
        makeMesh(new THREE.BoxGeometry(4, 8, 1), 0x3D2B1F, cx - 15, 5, cz - 10.5);
        makeMesh(new THREE.BoxGeometry(4, 8, 1), 0x3D2B1F, cx, 5, cz - 10.5);
        makeMesh(new THREE.BoxGeometry(4, 8, 1), 0x3D2B1F, cx + 15, 5, cz - 10.5);
        // Stable windows (upper)
        makeMesh(new THREE.BoxGeometry(3, 3, 0.5), 0x87CEEB, cx - 15, 10, cz - 10.3);
        makeMesh(new THREE.BoxGeometry(3, 3, 0.5), 0x87CEEB, cx, 10, cz - 10.3);
        makeMesh(new THREE.BoxGeometry(3, 3, 0.5), 0x87CEEB, cx + 15, 10, cz - 10.3);
    }

    function buildClockTower() {
        // Clock tower above stable yard gateway
        var cx = -155;
        var cz = 60;
        // Tower base
        makeMesh(new THREE.BoxGeometry(8, 24, 8), 0x8B7355, cx, 12, cz - 30);
        // Clock faces (four sides — simplified as blue squares)
        makeMesh(new THREE.BoxGeometry(5, 5, 0.4), 0x87CEEB, cx, 20, cz - 34.2);
        makeMesh(new THREE.BoxGeometry(0.4, 5, 5), 0x87CEEB, cx - 4.2, 20, cz - 30);
        makeMesh(new THREE.BoxGeometry(0.4, 5, 5), 0x87CEEB, cx + 4.2, 20, cz - 30);
        // Bell tower section
        makeMesh(new THREE.BoxGeometry(7, 6, 7), 0x9B8C78, cx, 27, cz - 30);
        // Octagonal spire
        makeMesh(new THREE.ConeGeometry(4.5, 10, 8), 0x7A6245, cx, 35, cz - 30);
    }

    function buildTeaRooms() {
        // Converted outbuilding tea rooms — south side of coach houses
        var tx = -180;
        var tz = 110;
        // Main tea room building
        makeMesh(new THREE.BoxGeometry(28, 10, 16), 0x9B8C78, tx, 5, tz);
        // Roof
        makeMesh(new THREE.BoxGeometry(30, 2, 18), 0x8B7355, tx, 11, tz);
        // Large windows
        makeMesh(new THREE.BoxGeometry(6, 5, 0.5), 0x87CEEB, tx - 8, 6, tz - 8.3);
        makeMesh(new THREE.BoxGeometry(6, 5, 0.5), 0x87CEEB, tx + 8, 6, tz - 8.3);
        // Outdoor seating area — terrace
        makeMesh(new THREE.BoxGeometry(28, 0.5, 14), 0xD2C4A8, tx, 0.25, tz + 15);
        // Outdoor tables
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 8), 0xD2B48C, tx - 8, 1.2, tz + 13);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 8), 0xD2B48C, tx, 1.2, tz + 13);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 8), 0xD2B48C, tx + 8, 1.2, tz + 13);
        // Table legs
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), 0xC4A882, tx - 8, 0.8, tz + 13);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), 0xC4A882, tx, 0.8, tz + 13);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), 0xC4A882, tx + 8, 0.8, tz + 13);
        // Outdoor umbrellas
        makeMesh(new THREE.ConeGeometry(3, 2, 8), 0xCC4444, tx - 8, 4.5, tz + 13);
        makeMesh(new THREE.ConeGeometry(3, 2, 8), 0x4466CC, tx, 4.5, tz + 13);
        makeMesh(new THREE.ConeGeometry(3, 2, 8), 0x44AA44, tx + 8, 4.5, tz + 13);
        // Umbrella poles
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 6), 0x888888, tx - 8, 2.5, tz + 13);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 6), 0x888888, tx, 2.5, tz + 13);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 6), 0x888888, tx + 8, 2.5, tz + 13);
    }

    function buildHaHaWall() {
        // Ha-Ha wall — long sunken retaining wall along south edge of formal garden
        // The wall is sunk into a ditch — represented as a thin tall box
        // Trench / ditch
        makeMesh(new THREE.BoxGeometry(280, 2, 4), 0x4A3A2A, 0, -1.8, 55);
        // Retaining wall face (inner / house-side)
        makeMesh(new THREE.BoxGeometry(280, 5, 1.5), 0x8B7355, 0, 1.5, 54);
        // Low turf wall cap (outer / field side is level with ground)
        makeMesh(new THREE.BoxGeometry(280, 0.5, 2), 0x5A8A3A, 0, 0.25, 57);
    }

    function buildEstateFences() {
        // Estate boundary fence posts and rails — wrought iron style
        var fenceZ = -60;
        for (var f = -10; f <= 10; f++) {
            var fx = f * 12;
            // Post
            makeMesh(new THREE.BoxGeometry(0.6, 8, 0.6), 0x2A2A2A, fx, 4, fenceZ);
            // Pointed finial on post
            makeMesh(new THREE.ConeGeometry(0.4, 1.5, 4), 0x2A2A2A, fx, 8.75, fenceZ);
        }
        // Horizontal rails
        makeMesh(new THREE.BoxGeometry(240, 0.5, 0.4), 0x2A2A2A, 0, 5.5, fenceZ);
        makeMesh(new THREE.BoxGeometry(240, 0.5, 0.4), 0x2A2A2A, 0, 3, fenceZ);
        // Main gate pillars
        makeMesh(new THREE.BoxGeometry(3, 14, 3), 0xC8B89A, -12, 7, fenceZ);
        makeMesh(new THREE.BoxGeometry(3, 14, 3), 0xC8B89A, 12, 7, fenceZ);
        // Gate pillar balls
        makeMesh(new THREE.SphereGeometry(1.8, 8, 6), 0xD4C9B0, -12, 15, fenceZ);
        makeMesh(new THREE.SphereGeometry(1.8, 8, 6), 0xD4C9B0, 12, 15, fenceZ);
    }

    function buildSkyBox() {
        // Ambient sky sphere
        var skyGeo = new THREE.SphereGeometry(900, 12, 8);
        var skyMat = new THREE.MeshLambertMaterial({ color: 0x87CEEB, side: THREE.BackSide });
        var sky = new THREE.Mesh(skyGeo, skyMat);
        sky.position.set(OX, 0, OZ);
        scene.add(sky);
        objects.push(sky);

        // Sun sphere
        makeMesh(new THREE.SphereGeometry(30, 10, 8), 0xFFFF99, 400, 400, -400);
    }

    function update(delta) {
        // No per-frame updates required for static environment
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
