window.BalmoralCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BX = 19960;
    var BY = 0;
    var BZ = 0;

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
        mesh.position.set(BX + x, BY + y, BZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BX + x, BY + y, BZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BX + x, BY + y, BZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BX + x, BY + y, BZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildMainTower();
        buildCastleWings();
        buildBallroom();
        buildTurrets();
        buildBattlements();
        buildClockFace();
        buildRoyalGardens();
        buildFlagpole();
        buildCrathieKirk();
        buildRiverDee();
        buildCaledonianForest();
        buildCairngormMountains();
        buildGatehouse();
        buildStablesBlock();
        buildShootingLodge();
        buildHeatherMoorland();
        buildAmbientLighting();
    }

    function buildGround() {
        // Main estate ground - large flat base
        makeBox(800, 2, 600, 0x5a8a3c, 0, -1, 0);
        // Gravel courtyard in front of castle
        makeBox(120, 1, 80, 0xC8B89A, 0, 0.5, 30);
        // Rear lawn
        makeBox(160, 1, 100, 0x4a7c3f, 0, 0.5, -60);
        // Driveway approach
        makeBox(20, 1, 200, 0xB0A090, -80, 0.5, 80);
    }

    function buildMainTower() {
        // Primary Scottish Baronial main tower - tall
        makeBox(22, 60, 22, 0xF0EDE0, 0, 30, 0);
        // Tower upper section - slightly narrower
        makeBox(18, 25, 18, 0xF0EDE0, 0, 72, 0);
        // Parapet walkway band
        makeBox(24, 4, 24, 0xE0DDD0, 0, 86, 0);
        // Main entrance arch block
        makeBox(10, 14, 6, 0xD8D5C8, 0, 7, 11);
        // Entrance door recess
        makeBox(6, 10, 3, 0x3A2A1A, 0, 6, 13);
        // Window rows - front face, 3 rows of 3
        makeBox(3, 4, 1, 0x2A3A5A, -6, 18, 11);
        makeBox(3, 4, 1, 0x2A3A5A, 0, 18, 11);
        makeBox(3, 4, 1, 0x2A3A5A, 6, 18, 11);
        makeBox(3, 4, 1, 0x2A3A5A, -6, 30, 11);
        makeBox(3, 4, 1, 0x2A3A5A, 0, 30, 11);
        makeBox(3, 4, 1, 0x2A3A5A, 6, 30, 11);
        makeBox(3, 4, 1, 0x2A3A5A, -6, 42, 11);
        makeBox(3, 4, 1, 0x2A3A5A, 0, 42, 11);
        makeBox(3, 4, 1, 0x2A3A5A, 6, 42, 11);
        // Round turret attached to main tower - left front
        makeCylinder(4, 4, 50, 12, 0xF0EDE0, -13, 40, 8);
        // Turret spire
        makeCone(5, 18, 12, 0x4A5A6A, -13, 69, 8);
        // Round turret - right front
        makeCylinder(4, 4, 50, 12, 0xF0EDE0, 13, 40, 8);
        makeCone(5, 18, 12, 0x4A5A6A, 13, 69, 8);
    }

    function buildCastleWings() {
        // Left wing - substantial two-storey block
        makeBox(50, 30, 20, 0xF0EDE0, -48, 15, -5);
        // Left wing roof parapet
        makeBox(52, 4, 22, 0xE0DDD0, -48, 32, -5);
        // Right wing
        makeBox(50, 30, 20, 0xF0EDE0, 48, 15, -5);
        makeBox(52, 4, 22, 0xE0DDD0, 48, 32, -5);
        // Left wing connector to main tower
        makeBox(14, 28, 20, 0xF0EDE0, -18, 14, -5);
        // Right wing connector
        makeBox(14, 28, 20, 0xF0EDE0, 18, 14, -5);
        // Left wing end turret cylinder
        makeCylinder(4, 4, 35, 12, 0xF0EDE0, -73, 17, -5);
        makeCone(5, 14, 12, 0x4A5A6A, -73, 38, -5);
        // Right wing end turret cylinder
        makeCylinder(4, 4, 35, 12, 0xF0EDE0, 73, 17, -5);
        makeCone(5, 14, 12, 0x4A5A6A, 73, 38, -5);
        // Left wing windows
        makeBox(3, 4, 1, 0x2A3A5A, -40, 12, 6);
        makeBox(3, 4, 1, 0x2A3A5A, -50, 12, 6);
        makeBox(3, 4, 1, 0x2A3A5A, -60, 12, 6);
        makeBox(3, 4, 1, 0x2A3A5A, -40, 22, 6);
        makeBox(3, 4, 1, 0x2A3A5A, -50, 22, 6);
        makeBox(3, 4, 1, 0x2A3A5A, -60, 22, 6);
        // Right wing windows
        makeBox(3, 4, 1, 0x2A3A5A, 40, 12, 6);
        makeBox(3, 4, 1, 0x2A3A5A, 50, 12, 6);
        makeBox(3, 4, 1, 0x2A3A5A, 60, 12, 6);
        makeBox(3, 4, 1, 0x2A3A5A, 40, 22, 6);
        makeBox(3, 4, 1, 0x2A3A5A, 50, 22, 6);
        makeBox(3, 4, 1, 0x2A3A5A, 60, 22, 6);
    }

    function buildBallroom() {
        // Victorian ballroom addition - rear of castle
        makeBox(60, 22, 35, 0xF0EDE0, 0, 11, -50);
        // Ballroom clerestory upper windows section
        makeBox(55, 8, 5, 0xF0EDE0, 0, 24, -33);
        // Ballroom roof ridge
        makeBox(58, 5, 32, 0xD0CCC0, 0, 30, -50);
        // Large ballroom windows - tall arched effect using boxes
        makeBox(5, 12, 2, 0x2A3A5A, -20, 14, -32);
        makeBox(5, 12, 2, 0x2A3A5A, -10, 14, -32);
        makeBox(5, 12, 2, 0x2A3A5A, 0, 14, -32);
        makeBox(5, 12, 2, 0x2A3A5A, 10, 14, -32);
        makeBox(5, 12, 2, 0x2A3A5A, 20, 14, -32);
        // Ballroom corner turrets
        makeCylinder(3, 3, 26, 10, 0xF0EDE0, -30, 13, -50);
        makeCone(4, 10, 10, 0x4A5A6A, -30, 31, -50);
        makeCylinder(3, 3, 26, 10, 0xF0EDE0, 30, 13, -50);
        makeCone(4, 10, 10, 0x4A5A6A, 30, 31, -50);
    }

    function buildTurrets() {
        // Additional decorative corner turrets on main tower top
        makeCylinder(2, 2, 15, 8, 0xF0EDE0, -9, 80, -9);
        makeCone(3, 8, 8, 0x4A5A6A, -9, 91, -9);
        makeCylinder(2, 2, 15, 8, 0xF0EDE0, 9, 80, -9);
        makeCone(3, 8, 8, 0x4A5A6A, 9, 91, -9);
        makeCylinder(2, 2, 15, 8, 0xF0EDE0, -9, 80, 9);
        makeCone(3, 8, 8, 0x4A5A6A, -9, 91, 9);
        makeCylinder(2, 2, 15, 8, 0xF0EDE0, 9, 80, 9);
        makeCone(3, 8, 8, 0x4A5A6A, 9, 91, 9);
    }

    function buildBattlements() {
        // Battlements on main tower parapet - merlons
        makeBox(3, 5, 3, 0xE8E5D8, -9, 90, 12);
        makeBox(3, 5, 3, 0xE8E5D8, -3, 90, 12);
        makeBox(3, 5, 3, 0xE8E5D8, 3, 90, 12);
        makeBox(3, 5, 3, 0xE8E5D8, 9, 90, 12);
        makeBox(3, 5, 3, 0xE8E5D8, -9, 90, -12);
        makeBox(3, 5, 3, 0xE8E5D8, -3, 90, -12);
        makeBox(3, 5, 3, 0xE8E5D8, 3, 90, -12);
        makeBox(3, 5, 3, 0xE8E5D8, 9, 90, -12);
        // Side battlements
        makeBox(3, 5, 3, 0xE8E5D8, -12, 90, -6);
        makeBox(3, 5, 3, 0xE8E5D8, -12, 90, 0);
        makeBox(3, 5, 3, 0xE8E5D8, -12, 90, 6);
        makeBox(3, 5, 3, 0xE8E5D8, 12, 90, -6);
        makeBox(3, 5, 3, 0xE8E5D8, 12, 90, 0);
        makeBox(3, 5, 3, 0xE8E5D8, 12, 90, 6);
    }

    function buildClockFace() {
        // Clock face on main tower - south face
        makeCylinder(4, 4, 0.8, 16, 0xF5F0E8, 0, 56, 11.5);
        // Clock hands as boxes
        makeBox(0.5, 5, 0.5, 0x1A1A1A, 0, 58, 12);
        makeBox(0.5, 3.5, 0.5, 0x1A1A1A, 1, 57, 12);
    }

    function buildRoyalGardens() {
        // Formal parterre garden - geometric beds
        makeBox(40, 0.5, 40, 0x4a7c3f, -100, 1, 20);
        // Central parterre path cross
        makeBox(40, 0.6, 3, 0xC8B89A, -100, 1, 20);
        makeBox(3, 0.6, 40, 0xC8B89A, -100, 1, 20);
        // Rose garden - red sphere bushes
        makeSphere(3, 8, 8, 0xCC2222, -115, 4, 10);
        makeSphere(3, 8, 8, 0xCC2222, -105, 4, 10);
        makeSphere(3, 8, 8, 0xCC2222, -95, 4, 10);
        makeSphere(3, 8, 8, 0xCC2222, -85, 4, 10);
        makeSphere(3, 8, 8, 0xDD1111, -115, 4, 30);
        makeSphere(3, 8, 8, 0xDD1111, -105, 4, 30);
        makeSphere(3, 8, 8, 0xDD1111, -95, 4, 30);
        makeSphere(3, 8, 8, 0xDD1111, -85, 4, 30);
        // Topiary box spheres
        makeSphere(4, 8, 8, 0x2A5A2A, -110, 5, 20);
        makeSphere(4, 8, 8, 0x2A5A2A, -90, 5, 20);
        // Herbaceous border hedge
        makeBox(60, 4, 4, 0x2d5e1e, -100, 3, -5);
        // Garden fountain - cylinder basin
        makeCylinder(5, 5, 2, 12, 0xC0C8D0, -100, 2, 20);
        makeCylinder(1, 1, 8, 8, 0xC0C8D0, -100, 6, 20);
        makeSphere(2, 8, 8, 0x006994, -100, 10.5, 20);
        // Sundial on plinth
        makeBox(2, 3, 2, 0xB0A898, -90, 2.5, 35);
        makeCylinder(2, 2, 0.5, 8, 0x888888, -90, 4.5, 35);
    }

    function buildFlagpole() {
        // Royal warrant flagpole
        makeCylinder(0.3, 0.3, 40, 6, 0x888888, 30, 20, 20);
        // Flag body
        makeBox(10, 6, 0.5, 0x003399, 37, 37, 20);
        // Flag cross (St Andrews)
        makeBox(10, 1.5, 0.6, 0xFFFFFF, 37, 37, 20);
        makeBox(1.5, 6, 0.6, 0xFFFFFF, 37, 37, 20);
        // Flag point light placeholder (bright box to simulate light glow)
        makeBox(1, 1, 1, 0xFFFF88, 30, 41, 20);
    }

    function buildCrathieKirk() {
        // Small granite church - east of castle
        makeBox(20, 14, 30, 0xC8B89A, 120, 7, -20);
        // Pointed nave roof
        makeBox(22, 5, 32, 0x8A7A6A, 120, 18, -20);
        // Square tower
        makeBox(10, 24, 10, 0xC8B89A, 128, 12, -30);
        // Tower parapet
        makeBox(12, 3, 12, 0xB8A898, 128, 26, -30);
        // Tower battlements
        makeBox(3, 3, 3, 0xC8B89A, 124, 28, -33);
        makeBox(3, 3, 3, 0xC8B89A, 130, 28, -33);
        makeBox(3, 3, 3, 0xC8B89A, 124, 28, -27);
        makeBox(3, 3, 3, 0xC8B89A, 130, 28, -27);
        // Church door
        makeBox(4, 7, 1, 0x3A2A1A, 120, 4, -5);
        // Church windows
        makeBox(2, 5, 1, 0x2A3A5A, 110, 10, -5);
        makeBox(2, 5, 1, 0x2A3A5A, 130, 10, -5);
        // Churchyard stone wall
        makeBox(50, 3, 1, 0xA8A098, 120, 2, 5);
        makeBox(50, 3, 1, 0xA8A098, 120, 2, -45);
        makeBox(1, 3, 50, 0xA8A098, 95, 2, -20);
        // Gravestones
        makeBox(1, 3, 2, 0x888080, 105, 2, -10);
        makeBox(1, 3, 2, 0x888080, 108, 2, -15);
        makeBox(1, 3, 2, 0x888080, 105, 2, -25);
    }

    function buildRiverDee() {
        // River Dee - winding blue sections (approximated with angled boxes)
        makeBox(300, 1, 18, 0x006994, -50, 0.8, 200);
        makeBox(18, 1, 120, 0x006994, -180, 0.8, 140);
        makeBox(200, 1, 18, 0x006994, -270, 0.8, 80);
        // River bank gravel / shingle
        makeBox(300, 0.8, 5, 0xC8B89A, -50, 0.7, 209);
        makeBox(300, 0.8, 5, 0xC8B89A, -50, 0.7, 191);
        // Fishing pool - slightly deeper blue
        makeCylinder(14, 14, 1, 12, 0x004A6A, -130, 0.9, 200);
        // Stepping stones
        makeBox(3, 1, 3, 0x888888, -50, 1.2, 200);
        makeBox(3, 1, 3, 0x888888, -54, 1.2, 200);
        makeBox(3, 1, 3, 0x888888, -58, 1.2, 200);
        makeBox(3, 1, 3, 0x888888, -62, 1.2, 200);
        // River pebbles bed shimmer
        makeBox(280, 0.3, 14, 0x1A5A88, -55, 0.6, 200);
    }

    function buildCaledonianForest() {
        // Caledonian Pine trees - hillside coverage
        // Each tree: cylinder trunk + cone canopy
        var treePositions = [
            [150, 0, -60], [165, 0, -50], [155, 0, -80], [175, 0, -70],
            [180, 0, -40], [160, 0, -100], [190, 0, -90], [145, 0, -110],
            [200, 0, -60], [185, 0, -120], [170, 0, -130], [155, 0, -140],
            [-150, 0, -60], [-165, 0, -50], [-155, 0, -80], [-175, 0, -70],
            [-180, 0, -40], [-160, 0, -100], [-190, 0, -90], [-145, 0, -110],
            [140, 0, 150], [155, 0, 160], [165, 0, 140], [175, 0, 170],
            [-140, 0, 150], [-155, 0, 160], [-165, 0, 140]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];
            var tx = tp[0];
            var ty = tp[1];
            var tz = tp[2];
            var h = 14 + (t % 5) * 2;
            // Trunk
            makeCylinder(0.8, 1.2, h, 6, 0x5A3A1A, tx, ty + h / 2, tz);
            // Lower canopy cone
            makeCone(5, 10, 8, 0x2d5e1e, tx, ty + h + 3, tz);
            // Upper canopy cone
            makeCone(3, 8, 8, 0x1E4A14, tx, ty + h + 9, tz);
        }
    }

    function buildCairngormMountains() {
        // Rolling Cairngorm plateau mountains in background - heathery grey
        makeBox(200, 60, 80, 0x8B8B8B, -200, 30, -250);
        makeBox(180, 80, 80, 0x848484, -60, 40, -280);
        makeBox(200, 70, 80, 0x909090, 100, 35, -260);
        makeBox(160, 55, 80, 0x7A7A7A, 250, 27, -240);
        makeBox(150, 45, 80, 0x8F8F8F, -340, 22, -220);
        // Snow-capped peaks (white tops on tallest mountains)
        makeBox(180, 10, 70, 0xF0EEE8, -60, 84, -280);
        makeBox(150, 8, 70, 0xF0EEE8, 100, 73, -260);
        // Heather moorland foreground - purple-brown
        makeBox(400, 2, 80, 0x7A5A6A, 0, 1.5, -160);
        makeBox(300, 2, 60, 0x8A6A7A, 150, 1.5, -130);
        makeBox(300, 2, 60, 0x8A6A7A, -150, 1.5, -130);
        // Rocky outcrops
        makeBox(12, 8, 10, 0x888888, -220, 5, -150);
        makeBox(8, 6, 8, 0x7A7A7A, -225, 4, -160);
        makeBox(10, 5, 12, 0x909090, 200, 3.5, -150);
    }

    function buildGatehouse() {
        // Ornate gothic gatehouse at estate entrance
        makeBox(12, 18, 10, 0xF0EDE0, -200, 9, 80);
        // Right pillar of gate
        makeBox(12, 18, 10, 0xF0EDE0, -170, 9, 80);
        // Arch above gate
        makeBox(42, 5, 10, 0xF0EDE0, -185, 19, 80);
        // Gatehouse turrets
        makeCylinder(3, 3, 24, 10, 0xF0EDE0, -206, 12, 80);
        makeCone(4, 10, 10, 0x4A5A6A, -206, 28, 80);
        makeCylinder(3, 3, 24, 10, 0xF0EDE0, -164, 12, 80);
        makeCone(4, 10, 10, 0x4A5A6A, -164, 28, 80);
        // Gate pillars battlements
        makeBox(3, 4, 3, 0xE8E5D8, -204, 23, 77);
        makeBox(3, 4, 3, 0xE8E5D8, -198, 23, 77);
        makeBox(3, 4, 3, 0xE8E5D8, -175, 23, 77);
        makeBox(3, 4, 3, 0xE8E5D8, -169, 23, 77);
        // Gatehouse windows
        makeBox(3, 5, 1, 0x2A3A5A, -200, 10, 75);
        makeBox(3, 5, 1, 0x2A3A5A, -170, 10, 75);
        // Iron gate representation
        makeBox(15, 10, 1, 0x2A2A2A, -192, 6, 80);
        makeBox(15, 10, 1, 0x2A2A2A, -178, 6, 80);
    }

    function buildStablesBlock() {
        // Large stable courtyard
        // North block
        makeBox(80, 14, 14, 0xE8E4D8, 80, 7, -80);
        // East block
        makeBox(14, 14, 50, 0xE8E4D8, 114, 7, -105);
        // West block
        makeBox(14, 14, 50, 0xE8E4D8, 46, 7, -105);
        // Cupola on stable roof
        makeCylinder(3, 3, 10, 8, 0xD8D4C8, 80, 20, -80);
        makeCone(3.5, 6, 8, 0x5A6A4A, 80, 29, -80);
        // Stable roof
        makeBox(82, 5, 16, 0xC8C4B8, 80, 16, -80);
        // Stable doors
        makeBox(4, 6, 1, 0x5A3A1A, 68, 4, -73);
        makeBox(4, 6, 1, 0x5A3A1A, 78, 4, -73);
        makeBox(4, 6, 1, 0x5A3A1A, 88, 4, -73);
        // Clock tower on stables
        makeBox(6, 20, 6, 0xE8E4D8, 80, 10, -80);
        makeCylinder(3, 3, 1, 8, 0xF5F0E8, 80, 21, -80);
        // Stable yard surface
        makeBox(56, 0.5, 40, 0xB8B0A0, 80, 0.5, -105);
    }

    function buildShootingLodge() {
        // Traditional shooting lodge on hillside - north east
        makeBox(25, 12, 18, 0xC8B89A, 200, 16, -100);
        // Roof
        makeBox(27, 5, 20, 0x8A7060, 200, 23, -100);
        // Lodge chimney stacks
        makeBox(3, 10, 3, 0xB0A090, 194, 29, -100);
        makeBox(3, 10, 3, 0xB0A090, 206, 29, -100);
        // Chimney pots
        makeCylinder(1, 1, 4, 6, 0x888888, 194, 37, -100);
        makeCylinder(1, 1, 4, 6, 0x888888, 206, 37, -100);
        // Lodge porch
        makeBox(8, 7, 6, 0xC8B89A, 200, 4.5, -91);
        // Lodge windows
        makeBox(3, 4, 1, 0x2A3A5A, 190, 9, -91);
        makeBox(3, 4, 1, 0x2A3A5A, 210, 9, -91);
        // Hillside embankment under lodge
        makeBox(30, 8, 20, 0x6A8A4A, 200, 9, -100);
        // Lodge approach path
        makeBox(5, 0.5, 50, 0xA0987A, 200, 1, -70);
    }

    function buildHeatherMoorland() {
        // Heather clumps as small sphere clusters
        makeSphere(2, 6, 6, 0x9A5A8A, -120, 2.5, -50);
        makeSphere(2, 6, 6, 0x8A4A7A, -115, 2.5, -65);
        makeSphere(2, 6, 6, 0x9A5A8A, -125, 2.5, -70);
        makeSphere(2, 6, 6, 0xAA6A9A, 130, 2.5, -50);
        makeSphere(2, 6, 6, 0x9A5A8A, 120, 2.5, -65);
        makeSphere(2, 6, 6, 0x8A4A7A, 135, 2.5, -70);
        // Bracken fern areas - yellow-green boxes
        makeBox(20, 1.5, 10, 0x8A9A3A, -80, 1.5, -100);
        makeBox(20, 1.5, 10, 0x7A8A30, 80, 1.5, -100);
        makeBox(30, 1.5, 8, 0x8A9A3A, 0, 1.5, -120);
    }

    function buildAmbientLighting() {
        // Ambient light marker - glowing sphere placeholder at castle top
        makeSphere(3, 8, 8, 0xFFFFAA, 0, 100, 0);
        // Estate lamp posts along driveway
        makeCylinder(0.3, 0.3, 8, 6, 0x444444, -80, 4, 60);
        makeSphere(1, 6, 6, 0xFFDD88, -80, 9, 60);
        makeCylinder(0.3, 0.3, 8, 6, 0x444444, -80, 4, 100);
        makeSphere(1, 6, 6, 0xFFDD88, -80, 9, 100);
        makeCylinder(0.3, 0.3, 8, 6, 0x444444, -80, 4, 140);
        makeSphere(1, 6, 6, 0xFFDD88, -80, 9, 140);
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
