window.BlairCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 20480;
    var CY = 0;
    var CZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildCummingsTower();
        buildMainBlock();
        buildNorthWing();
        buildSouthWing();
        buildCornerTurrets();
        buildSpires();
        buildCrenellations();
        buildChimneys();
        buildParadeGround();
        buildFlagpole();
        buildCastleGardens();
        buildDianasGrove();
        buildRiverGarry();
        buildBlaireAtholVillage();
        buildAtholArmsHotel();
        buildPassOfKilliecrankie();
        buildSoldiersLeap();
        buildStBridesChurch();
        buildOldBridgeOfTilt();
        buildRiverTilt();
        buildSurroundingTerrain();
        buildWalls();
    }

    function buildGround() {
        // Main estate ground — green parkland
        makeBox(1200, 2, 1200, 0x4a7a2a, 0, -1, 0);
        // Estate road approach — pale gravel
        makeBox(20, 2, 400, 0xD4C9A8, 0, 0, -250);
        // Entrance drive continuation
        makeBox(20, 2, 200, 0xD4C9A8, 0, 0, 100);
    }

    function buildCummingsTower() {
        // Cumming's Tower — central tall tower, brilliant white harled
        makeBox(22, 80, 22, 0xFFFFFF, 0, 40, 0);
        // Tower upper section
        makeBox(20, 20, 20, 0xFFFFF8, 0, 90, 0);
        // Tower battlements base ring
        makeBox(24, 4, 24, 0xFFFFFF, 0, 102, 0);
        // Tower windows row 1 (dark recesses)
        makeBox(3, 5, 1, 0x222222, -5, 30, -12);
        makeBox(3, 5, 1, 0x222222, 5, 30, -12);
        makeBox(3, 5, 1, 0x222222, -5, 50, -12);
        makeBox(3, 5, 1, 0x222222, 5, 50, -12);
        makeBox(3, 5, 1, 0x222222, -5, 70, -12);
        makeBox(3, 5, 1, 0x222222, 5, 70, -12);
        // Tower windows facing south
        makeBox(3, 5, 1, 0x222222, -5, 30, 12);
        makeBox(3, 5, 1, 0x222222, 5, 30, 12);
        makeBox(3, 5, 1, 0x222222, 0, 60, 12);
    }

    function buildMainBlock() {
        // Georgian main block — white harled facade, wide and stately
        makeBox(100, 55, 30, 0xFFFFFF, 0, 27, -8);
        // Main block rear
        makeBox(95, 50, 20, 0xF8F8F0, 0, 25, 22);
        // Parapet / roof line
        makeBox(104, 5, 34, 0xFFFFFF, 0, 57, -8);
        // Pitched roof slate grey
        makeBox(98, 12, 28, 0x5A5A6A, 0, 65, -8);
        // Front entrance portico
        makeBox(18, 30, 8, 0xFFF8F0, 0, 15, -27);
        // Portico pediment
        makeBox(20, 6, 8, 0xFFFFFF, 0, 32, -27);
        // Portico columns (cylinders)
        makeCylinder(1, 1, 28, 8, 0xF5F0E8, -6, 14, -27);
        makeCylinder(1, 1, 28, 8, 0xF5F0E8, -2, 14, -27);
        makeCylinder(1, 1, 28, 8, 0xF5F0E8, 2, 14, -27);
        makeCylinder(1, 1, 28, 8, 0xF5F0E8, 6, 14, -27);
        // Front door arch
        makeBox(5, 8, 2, 0x1A1A2A, 0, 5, -28);
        // Main block windows — front facade row 1
        makeBox(4, 7, 1, 0x222233, -35, 22, -24);
        makeBox(4, 7, 1, 0x222233, -22, 22, -24);
        makeBox(4, 7, 1, 0x222233, 22, 22, -24);
        makeBox(4, 7, 1, 0x222233, 35, 22, -24);
        // Main block windows — front facade row 2
        makeBox(4, 7, 1, 0x222233, -35, 38, -24);
        makeBox(4, 7, 1, 0x222233, -22, 38, -24);
        makeBox(4, 7, 1, 0x222233, 22, 38, -24);
        makeBox(4, 7, 1, 0x222233, 35, 38, -24);
        // Main block windows — front facade row 3
        makeBox(4, 6, 1, 0x222233, -35, 50, -24);
        makeBox(4, 6, 1, 0x222233, -22, 50, -24);
        makeBox(4, 6, 1, 0x222233, 22, 50, -24);
        makeBox(4, 6, 1, 0x222233, 35, 50, -24);
    }

    function buildNorthWing() {
        // North wing extending left from main block
        makeBox(60, 45, 28, 0xFFFFFF, -80, 22, -6);
        makeBox(62, 4, 30, 0xFFFFFF, -80, 47, -6);
        makeBox(58, 10, 24, 0x5A5A6A, -80, 53, -6);
        // North wing windows
        makeBox(4, 7, 1, 0x222233, -60, 22, -22);
        makeBox(4, 7, 1, 0x222233, -75, 22, -22);
        makeBox(4, 7, 1, 0x222233, -90, 22, -22);
        makeBox(4, 7, 1, 0x222233, -60, 36, -22);
        makeBox(4, 7, 1, 0x222233, -75, 36, -22);
        makeBox(4, 7, 1, 0x222233, -90, 36, -22);
        // North service courtyard wall
        makeBox(55, 10, 4, 0xE8E0D0, -90, 5, -50);
    }

    function buildSouthWing() {
        // South wing extending right from main block
        makeBox(60, 45, 28, 0xFFFFFF, 80, 22, -6);
        makeBox(62, 4, 30, 0xFFFFFF, 80, 47, -6);
        makeBox(58, 10, 24, 0x5A5A6A, 80, 53, -6);
        // South wing windows
        makeBox(4, 7, 1, 0x222233, 60, 22, -22);
        makeBox(4, 7, 1, 0x222233, 75, 22, -22);
        makeBox(4, 7, 1, 0x222233, 90, 22, -22);
        makeBox(4, 7, 1, 0x222233, 60, 36, -22);
        makeBox(4, 7, 1, 0x222233, 75, 36, -22);
        makeBox(4, 7, 1, 0x222233, 90, 36, -22);
        // South stable block
        makeBox(40, 20, 22, 0xE8E0D0, 120, 10, 20);
        makeBox(40, 3, 22, 0x4A4A5A, 120, 22, 20);
    }

    function buildCornerTurrets() {
        // Four corner turrets on Cumming's Tower — CylinderGeometry
        makeCylinder(5, 5, 30, 10, 0xFFFFFF, -11, 95, -11);
        makeCylinder(5, 5, 30, 10, 0xFFFFFF, 11, 95, -11);
        makeCylinder(5, 5, 30, 10, 0xFFFFFF, -11, 95, 11);
        makeCylinder(5, 5, 30, 10, 0xFFFFFF, 11, 95, 11);
        // Corner turrets on main block corners
        makeCylinder(6, 6, 50, 10, 0xFFFFFF, -50, 25, -16);
        makeCylinder(6, 6, 50, 10, 0xFFFFFF, 50, 25, -16);
        makeCylinder(6, 6, 40, 10, 0xFFFFFF, -110, 20, -16);
        makeCylinder(6, 6, 40, 10, 0xFFFFFF, 110, 20, -16);
        // Turret caps — small cones
        makeCone(6, 12, 10, 0x5A5A6A, -50, 53, -16);
        makeCone(6, 12, 10, 0x5A5A6A, 50, 53, -16);
        makeCone(6, 12, 10, 0x5A5A6A, -110, 43, -16);
        makeCone(6, 12, 10, 0x5A5A6A, 110, 43, -16);
    }

    function buildSpires() {
        // ConeGeometry spires on Cumming's Tower turrets
        makeCone(5.5, 18, 10, 0x4A4A5A, -11, 115, -11);
        makeCone(5.5, 18, 10, 0x4A4A5A, 11, 115, -11);
        makeCone(5.5, 18, 10, 0x4A4A5A, -11, 115, 11);
        makeCone(5.5, 18, 10, 0x4A4A5A, 11, 115, 11);
        // Central main tower spire
        makeCone(8, 25, 12, 0x3A3A4A, 0, 118, 0);
        // Decorative finials
        makeSphere(1.5, 6, 6, 0x8A7A5A, 0, 131, 0);
        makeSphere(1, 6, 6, 0x8A7A5A, -11, 127, -11);
        makeSphere(1, 6, 6, 0x8A7A5A, 11, 127, -11);
        makeSphere(1, 6, 6, 0x8A7A5A, -11, 127, 11);
        makeSphere(1, 6, 6, 0x8A7A5A, 11, 127, 11);
    }

    function buildCrenellations() {
        // Crenellated parapet — series of merlons along main block
        var i;
        for (i = -45; i <= 45; i += 10) {
            makeBox(5, 5, 3, 0xFFFFFF, i, 60, -24);
        }
        // Rear parapet merlons
        for (i = -45; i <= 45; i += 10) {
            makeBox(5, 5, 3, 0xFFFFFF, i, 58, 24);
        }
        // Tower parapet merlons
        for (i = 0; i < 4; i++) {
            makeBox(4, 5, 4, 0xFFFFFF, -10 + (i * 7), 106, -12);
            makeBox(4, 5, 4, 0xFFFFFF, -10 + (i * 7), 106, 12);
        }
    }

    function buildChimneys() {
        // Multiple chimney stacks — white harled
        makeCylinder(2, 2, 14, 8, 0xE8E0D0, -30, 72, -4);
        makeCylinder(2, 2, 14, 8, 0xE8E0D0, -10, 72, -4);
        makeCylinder(2, 2, 14, 8, 0xE8E0D0, 10, 72, -4);
        makeCylinder(2, 2, 14, 8, 0xE8E0D0, 30, 72, -4);
        // North wing chimneys
        makeCylinder(2, 2, 12, 8, 0xE8E0D0, -70, 60, -2);
        makeCylinder(2, 2, 12, 8, 0xE8E0D0, -90, 60, -2);
        // South wing chimneys
        makeCylinder(2, 2, 12, 8, 0xE8E0D0, 70, 60, -2);
        makeCylinder(2, 2, 12, 8, 0xE8E0D0, 90, 60, -2);
        // Chimney pots
        makeCylinder(1, 1.5, 4, 6, 0x8A6A5A, -30, 80, -4);
        makeCylinder(1, 1.5, 4, 6, 0x8A6A5A, -10, 80, -4);
        makeCylinder(1, 1.5, 4, 6, 0x8A6A5A, 10, 80, -4);
        makeCylinder(1, 1.5, 4, 6, 0x8A6A5A, 30, 80, -4);
    }

    function buildParadeGround() {
        // Atholl Highlanders parade ground — vibrant green
        makeBox(180, 1, 120, 0x4a7c3f, 0, 0, 160);
        // Perimeter line markings — pale
        makeBox(180, 1, 2, 0xD4C9A8, 0, 0, 100);
        makeBox(180, 1, 2, 0xD4C9A8, 0, 0, 218);
        makeBox(2, 1, 120, 0xD4C9A8, -89, 0, 160);
        makeBox(2, 1, 120, 0xD4C9A8, 89, 0, 160);
        // Viewing stand / grandstand
        makeBox(50, 8, 12, 0xC8B89A, -60, 4, 105);
        makeBox(50, 2, 12, 0x8A7A6A, -60, 9, 105);
    }

    function buildFlagpole() {
        // Flagpole — tall cylinder
        makeCylinder(0.5, 0.5, 50, 8, 0x8A8A8A, 0, 25, 155);
        // Flag base
        makeSphere(1.2, 6, 6, 0xC8A020, 0, 51, 155);
        // Murray tartan standard — red/green/blue block representing flag
        makeBox(12, 7, 0.5, 0x4a7c3f, 6, 47, 155);
        makeBox(12, 2, 0.5, 0xC81820, 6, 50, 155);
        makeBox(12, 2, 0.5, 0x1820C8, 6, 44, 155);
    }

    function buildCastleGardens() {
        // Formal walled garden to north-east
        makeBox(100, 2, 80, 0x3A6A2A, 160, 0, -60);
        // Garden walls
        makeBox(100, 6, 2, 0xC8B89A, 160, 3, -20);
        makeBox(100, 6, 2, 0xC8B89A, 160, 3, -100);
        makeBox(2, 6, 80, 0xC8B89A, 110, 3, -60);
        makeBox(2, 6, 80, 0xC8B89A, 210, 3, -60);
        // Parterre hedging rows — dark green boxes
        makeBox(6, 4, 60, 0x1A4A1A, 130, 2, -60);
        makeBox(6, 4, 60, 0x1A4A1A, 145, 2, -60);
        makeBox(6, 4, 60, 0x1A4A1A, 175, 2, -60);
        makeBox(6, 4, 60, 0x1A4A1A, 190, 2, -60);
        // Gravel path through garden
        makeBox(8, 1, 80, 0xD4C9A8, 160, 0, -60);
        // Garden ornamental pond
        makeBox(20, 1, 20, 0x006994, 160, 0, -60);
        // Garden gate pillars
        makeCylinder(1.5, 1.5, 8, 8, 0xC8B89A, 155, 4, -20);
        makeCylinder(1.5, 1.5, 8, 8, 0xC8B89A, 165, 4, -20);
    }

    function buildDianasGrove() {
        // Diana's Grove — tall woodland trees (cylinders for trunks, cones for canopy)
        var treePositions = [
            [-180, 80], [-200, 60], [-220, 100], [-160, 120], [-240, 80],
            [-190, 140], [-210, 50], [-170, 90], [-230, 110], [-195, 65]
        ];
        var i;
        for (i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var tz = treePositions[i][1];
            // Trunk
            makeCylinder(2, 2.5, 30, 8, 0x5A3A1A, tx, 15, tz);
            // Canopy — tall cone for grove conifers (larch/Douglas fir)
            makeCone(10, 40, 8, 0x1A4A1A, tx, 50, tz);
        }
        // Grove ground
        makeBox(120, 1, 120, 0x2A5A1A, -200, 0, 90);
    }

    function buildRiverGarry() {
        // River Garry flowing through the estate
        makeBox(25, 1, 400, 0x006994, -250, 0, 50);
        // River banks
        makeBox(30, 2, 400, 0x5A7A3A, -270, 0, 50);
        makeBox(30, 2, 400, 0x5A7A3A, -230, 0, 50);
        // River shallows / rapids white water
        makeBox(25, 1, 10, 0xC8E8F0, -250, 1, 30);
        makeBox(25, 1, 10, 0xC8E8F0, -250, 1, 80);
    }

    function buildRiverTilt() {
        // River Tilt — joins River Garry at Blair Atholl
        makeBox(15, 1, 200, 0x006994, -80, 0, 250);
        // Tilt banks
        makeBox(20, 2, 200, 0x4A6A3A, -95, 0, 250);
        makeBox(20, 2, 200, 0x4A6A3A, -65, 0, 250);
    }

    function buildBlaireAtholVillage() {
        // Blair Atholl village — stone cottages in warm sandstone
        var cottageData = [
            [180, 280], [200, 295], [220, 275], [240, 290], [260, 280],
            [180, 310], [200, 325], [220, 305]
        ];
        var i;
        for (i = 0; i < cottageData.length; i++) {
            var cx = cottageData[i][0];
            var cz = cottageData[i][1];
            // Cottage walls
            makeBox(14, 10, 10, 0xD4C9A8, cx, 5, cz);
            // Cottage roof
            makeBox(16, 5, 12, 0x6A5A4A, cx, 12, cz);
            // Cottage chimney
            makeCylinder(0.8, 0.8, 6, 6, 0xC8B89A, cx + 4, 17, cz);
            // Cottage window
            makeBox(2.5, 2.5, 0.5, 0x222233, cx - 3, 6, cz - 6);
            makeBox(2.5, 2.5, 0.5, 0x222233, cx + 3, 6, cz - 6);
        }
        // Village road
        makeBox(12, 1, 80, 0xB0A890, 220, 0, 300);
    }

    function buildAtholArmsHotel() {
        // Atholl Arms Hotel — larger building, white rendered
        makeBox(35, 18, 20, 0xF5F0E8, 300, 9, 290);
        // Hotel upper storey
        makeBox(35, 8, 20, 0xEDE8DC, 300, 22, 290);
        // Hotel roof
        makeBox(37, 8, 22, 0x5A4A3A, 300, 30, 290);
        // Hotel chimneys
        makeCylinder(1.2, 1.2, 10, 8, 0xC8B89A, 288, 36, 285);
        makeCylinder(1.2, 1.2, 10, 8, 0xC8B89A, 312, 36, 285);
        // Hotel sign board
        makeBox(16, 3, 0.5, 0x1A3A1A, 300, 16, 280);
        // Hotel windows
        makeBox(3, 4, 0.5, 0x222233, 288, 12, 280);
        makeBox(3, 4, 0.5, 0x222233, 296, 12, 280);
        makeBox(3, 4, 0.5, 0x222233, 304, 12, 280);
        makeBox(3, 4, 0.5, 0x222233, 312, 12, 280);
        makeBox(3, 4, 0.5, 0x222233, 288, 22, 280);
        makeBox(3, 4, 0.5, 0x222233, 296, 22, 280);
        makeBox(3, 4, 0.5, 0x222233, 304, 22, 280);
        makeBox(3, 4, 0.5, 0x222233, 312, 22, 280);
        // Hotel car park gravel
        makeBox(40, 1, 25, 0xC0B098, 300, 0, 310);
    }

    function buildPassOfKilliecrankie() {
        // Pass of Killiecrankie — dramatic wooded gorge to north-east
        // Gorge floor — narrow dark
        makeBox(30, 1, 200, 0x2A4A1A, -300, -20, -150);
        // Gorge left cliff wall
        makeBox(20, 60, 200, 0x5A6A4A, -320, 10, -150);
        // Gorge right cliff wall
        makeBox(20, 60, 200, 0x5A6A4A, -280, 10, -150);
        // Dense woodland on gorge rim — dark green conifers
        var gorgeTreeX = [-340, -355, -345, -360, -350];
        var gorgeTreeZ = [-100, -130, -170, -200, -220];
        var i;
        for (i = 0; i < gorgeTreeX.length; i++) {
            makeCylinder(1.5, 2, 25, 8, 0x3A2A1A, gorgeTreeX[i], 12, gorgeTreeZ[i]);
            makeCone(9, 35, 8, 0x1A4A1A, gorgeTreeX[i], 37, gorgeTreeZ[i]);
        }
        var gorgeTreeX2 = [-260, -245, -255, -240, -250];
        for (i = 0; i < gorgeTreeX2.length; i++) {
            makeCylinder(1.5, 2, 25, 8, 0x3A2A1A, gorgeTreeX2[i], 12, gorgeTreeZ[i]);
            makeCone(9, 35, 8, 0x3d6b30, gorgeTreeX2[i], 37, gorgeTreeZ[i]);
        }
        // Battle of Killiecrankie 1689 memorial cairn
        makeCone(5, 8, 8, 0x9A8A7A, -300, 4, -180);
        makeSphere(1.5, 6, 6, 0x7A6A5A, -300, 9, -180);
    }

    function buildSoldiersLeap() {
        // Soldier's Leap — rocky outcrop either side of river gorge
        // Left rock
        makeBox(8, 6, 8, 0x7A7A6A, -265, 3, -110);
        makeCone(3, 4, 6, 0x8A8A7A, -265, 8, -110);
        // Right rock (across the gorge)
        makeBox(8, 6, 8, 0x7A7A6A, -235, 3, -110);
        makeCone(3, 4, 6, 0x8A8A7A, -235, 8, -110);
        // Water between rocks — river channel
        makeBox(28, 1, 20, 0x006994, -250, -5, -110);
        // Interpretive marker post
        makeCylinder(0.5, 0.5, 5, 6, 0x5A3A1A, -248, 2, -118);
        makeBox(4, 2, 0.3, 0xC8A020, -248, 6, -118);
    }

    function buildStBridesChurch() {
        // St Bride's Church — small estate church, warm sandstone
        makeBox(20, 14, 12, 0xC8B89A, -30, 7, 220);
        // Church roof
        makeBox(22, 6, 14, 0x6A5A4A, -30, 16, 220);
        // Church tower
        makeBox(8, 22, 8, 0xC8B89A, -44, 11, 220);
        // Church tower battlements
        makeBox(10, 3, 10, 0xC8B89A, -44, 24, 220);
        // Church tower cone spire
        makeCone(4, 10, 8, 0x5A4A3A, -44, 31, 220);
        // Church windows — pointed arches represented as tall thin boxes
        makeBox(3, 6, 0.5, 0xA8B8C8, -24, 8, 214);
        makeBox(3, 6, 0.5, 0xA8B8C8, -30, 8, 214);
        makeBox(3, 6, 0.5, 0xA8B8C8, -36, 8, 214);
        // Church entrance door
        makeBox(4, 7, 0.5, 0x3A2A1A, -30, 4, 214);
        // Church graveyard wall
        makeBox(50, 4, 2, 0xC8B89A, -30, 2, 230);
        makeBox(2, 4, 30, 0xC8B89A, -55, 2, 215);
        makeBox(2, 4, 30, 0xC8B89A, -5, 2, 215);
        // Graveyard ground
        makeBox(50, 1, 30, 0x3A5A2A, -30, 0, 215);
        // Grave markers
        makeBox(2, 4, 0.5, 0x9A9A8A, -40, 2, 218);
        makeBox(2, 4, 0.5, 0x9A9A8A, -35, 2, 222);
        makeBox(2, 4, 0.5, 0x9A9A8A, -20, 2, 218);
    }

    function buildOldBridgeOfTilt() {
        // Old Bridge of Tilt — stone arch bridge over River Tilt
        // Bridge deck
        makeBox(20, 3, 8, 0xC8B89A, -80, 3, 195);
        // Bridge arch supports (cylinders representing stone piers)
        makeCylinder(3, 3, 10, 8, 0xC8B89A, -80, 0, 195);
        // Bridge parapets either side
        makeBox(20, 3, 1, 0xB8A888, -80, 5, 190);
        makeBox(20, 3, 1, 0xB8A888, -80, 5, 200);
        // Bridge approach road north
        makeBox(8, 1, 20, 0xC0B098, -80, 0, 178);
        // Bridge approach road south
        makeBox(8, 1, 20, 0xC0B098, -80, 0, 212);
        // Capstone finials on bridge
        makeSphere(1.2, 6, 6, 0x9A8A7A, -90, 7, 190);
        makeSphere(1.2, 6, 6, 0x9A8A7A, -70, 7, 190);
        makeSphere(1.2, 6, 6, 0x9A8A7A, -90, 7, 200);
        makeSphere(1.2, 6, 6, 0x9A8A7A, -70, 7, 200);
    }

    function buildWalls() {
        // Estate boundary walls — stone
        makeBox(400, 8, 4, 0xC8B89A, 0, 4, -200);
        makeBox(4, 8, 300, 0xC8B89A, -200, 4, -50);
        makeBox(4, 8, 300, 0xC8B89A, 200, 4, -50);
        // Entrance gate piers
        makeCylinder(3, 3, 12, 8, 0xC8B89A, -12, 6, -200);
        makeCylinder(3, 3, 12, 8, 0xC8B89A, 12, 6, -200);
        // Gate pier caps
        makeCone(3.5, 5, 8, 0xA8987A, -12, 14, -200);
        makeCone(3.5, 5, 8, 0xA8987A, 12, 14, -200);
        // Gate decorative spheres
        makeSphere(2, 8, 8, 0xC8A020, -12, 18, -200);
        makeSphere(2, 8, 8, 0xC8A020, 12, 18, -200);
    }

    function buildSurroundingTerrain() {
        // Surrounding hills — Beinn a' Ghlo range visible
        makeBox(200, 80, 200, 0x4A6A3A, -500, -10, -300);
        makeBox(150, 100, 150, 0x3A5A2A, -600, 10, -200);
        makeCone(80, 120, 8, 0x5A7A4A, -550, 80, -350);
        makeCone(60, 100, 8, 0x4A6A3A, -450, 60, -250);
        // Heather moorland
        makeBox(300, 2, 200, 0x7A4A6A, 300, 0, -200);
        // Glen Tilt forested hillside
        makeBox(200, 60, 100, 0x2A5A2A, -200, 10, -350);
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

    return { init: init, update: update, reset: reset };
}());
