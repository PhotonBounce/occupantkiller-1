window.GlencoeValley = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14840;

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

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function buildValleyFloor() {
        // Main valley floor - flat glacial base
        makeBox(1200, 4, 2000, 0x4a6741, X_OFFSET, 0, 0);
        // Valley floor grass patches
        makeBox(400, 3, 600, 0x3d5c36, X_OFFSET - 200, 1, -200);
        makeBox(350, 3, 500, 0x526b45, X_OFFSET + 180, 1, 300);
        makeBox(300, 3, 400, 0x445e3b, X_OFFSET - 100, 1, 600);

        // Boggy areas - darker green patches
        makeBox(200, 2, 300, 0x2d4a2d, X_OFFSET + 300, 1, -100);
        makeBox(150, 2, 250, 0x263d26, X_OFFSET - 280, 1, 400);
        makeBox(180, 2, 200, 0x2d4a2d, X_OFFSET + 100, 1, 700);
    }

    function buildRiverCoe() {
        // River Coe - winding blue through valley floor
        makeBox(30, 2, 400, 0x2255aa, X_OFFSET - 80, 1, -600);
        makeBox(25, 2, 300, 0x1e4d9e, X_OFFSET - 40, 1, -250);
        makeBox(28, 2, 350, 0x2255aa, X_OFFSET + 10, 1, 50);
        makeBox(22, 2, 280, 0x1e4d9e, X_OFFSET + 60, 1, 350);
        makeBox(26, 2, 320, 0x2255aa, X_OFFSET + 20, 1, 650);
        makeBox(30, 2, 250, 0x1e4d9e, X_OFFSET - 30, 1, 900);
        // Wider sections / pools
        makeBox(60, 2, 80, 0x1a4488, X_OFFSET - 60, 1, -400);
        makeBox(50, 2, 70, 0x1a4488, X_OFFSET + 40, 1, 200);
        makeBox(55, 2, 90, 0x1a4488, X_OFFSET + 10, 1, 500);
    }

    function buildA82Road() {
        // A82 road running along valley - grey strip
        makeBox(18, 2, 400, 0x666666, X_OFFSET + 200, 1, -600);
        makeBox(16, 2, 350, 0x666666, X_OFFSET + 210, 1, -250);
        makeBox(18, 2, 400, 0x666666, X_OFFSET + 200, 1, 100);
        makeBox(16, 2, 350, 0x666666, X_OFFSET + 205, 1, 450);
        makeBox(18, 2, 300, 0x666666, X_OFFSET + 195, 1, 760);
        // Road markings - white centre line
        makeBox(3, 3, 400, 0xeeeeee, X_OFFSET + 200, 2, -600);
        makeBox(3, 3, 350, 0xeeeeee, X_OFFSET + 210, 2, -250);
        makeBox(3, 3, 400, 0xeeeeee, X_OFFSET + 200, 2, 100);
    }

    function buildThreeSisters() {
        // Beinn Fhada (Long Mountain) - westernmost spur
        // Massive base
        makeBox(500, 320, 600, 0x4a4040, X_OFFSET - 700, 160, -400);
        // Upper section
        makeBox(400, 250, 500, 0x3d3535, X_OFFSET - 700, 470, -400);
        // Peak ridge
        makeBox(280, 180, 380, 0x332b2b, X_OFFSET - 700, 695, -400);
        // Summit
        makeBox(140, 120, 200, 0x2a2222, X_OFFSET - 700, 845, -380);
        // Sheer valley-side face - near-vertical cliff
        makeBox(50, 500, 580, 0x2e2626, X_OFFSET - 470, 250, -400);
        // Rock buttresses
        makeBox(80, 200, 80, 0x3a3030, X_OFFSET - 490, 100, -300);
        makeBox(80, 180, 80, 0x3a3030, X_OFFSET - 490, 90, -500);
        // Snow patches near summit
        makeBox(100, 15, 80, 0xddddee, X_OFFSET - 690, 910, -370);
        makeBox(60, 12, 50, 0xddddee, X_OFFSET - 730, 880, -420);

        // Gearr Aonach (Short Ridge) - middle spur
        makeBox(450, 300, 550, 0x453c3c, X_OFFSET - 680, 150, 0);
        makeBox(360, 240, 440, 0x3a3232, X_OFFSET - 680, 420, 0);
        makeBox(260, 170, 320, 0x302828, X_OFFSET - 680, 640, 0);
        makeBox(130, 110, 180, 0x282020, X_OFFSET - 680, 800, 10);
        // Valley cliff face
        makeBox(50, 450, 540, 0x2a2222, X_OFFSET - 460, 225, 0);
        // Rock buttresses
        makeBox(75, 190, 75, 0x383030, X_OFFSET - 475, 95, 80);
        makeBox(70, 170, 70, 0x383030, X_OFFSET - 475, 85, -80);
        // Snow patches
        makeBox(90, 14, 70, 0xddddee, X_OFFSET - 670, 870, 20);
        makeBox(50, 10, 45, 0xddddee, X_OFFSET - 710, 845, -30);

        // Aonach Dubh (Black Ridge) - easternmost, most dramatic
        makeBox(480, 340, 600, 0x3c3333, X_OFFSET - 660, 170, 420);
        makeBox(380, 270, 480, 0x322a2a, X_OFFSET - 660, 455, 420);
        makeBox(280, 200, 360, 0x28221f, X_OFFSET - 660, 690, 420);
        makeBox(150, 140, 220, 0x221c1c, X_OFFSET - 660, 870, 430);
        // Famous cave entrance (Ossian's Cave) represented as dark indent
        makeBox(30, 40, 20, 0x0a0808, X_OFFSET - 480, 250, 400);
        // Sheer cliff face
        makeBox(50, 520, 590, 0x261e1e, X_OFFSET - 440, 260, 420);
        // Rock towers
        makeBox(60, 220, 60, 0x362e2e, X_OFFSET - 455, 110, 500);
        makeBox(55, 200, 55, 0x362e2e, X_OFFSET - 455, 100, 340);
        // Snow patches
        makeBox(110, 16, 85, 0xddddee, X_OFFSET - 650, 1000, 440);
        makeBox(70, 12, 55, 0xddddee, X_OFFSET - 690, 960, 380);
        makeBox(45, 10, 40, 0xddddee, X_OFFSET - 640, 980, 490);
    }

    function buildBideanNamBian() {
        // Bidean nam Bian - highest peak in Argyll at ~1150m
        // Massive mountain base behind Three Sisters
        makeBox(800, 400, 900, 0x3d3535, X_OFFSET - 900, 200, 100);
        // Mid section
        makeBox(650, 350, 750, 0x332b2b, X_OFFSET - 880, 580, 80);
        // Upper mountain
        makeBox(480, 280, 560, 0x2a2222, X_OFFSET - 860, 895, 60);
        // Summit pyramid
        makeCone(160, 320, 6, 0x221a1a, X_OFFSET - 850, 1205, 50);
        // Secondary summit - Stob Coire Sgreamhach
        makeBox(280, 220, 300, 0x2e2626, X_OFFSET - 950, 760, -150);
        makeCone(90, 200, 5, 0x221a1a, X_OFFSET - 950, 1050, -150);
        // Connecting ridge
        makeBox(200, 80, 400, 0x302828, X_OFFSET - 900, 850, -50);
        // Extensive snow fields near summit
        makeBox(200, 20, 150, 0xdde0ee, X_OFFSET - 850, 1080, 30);
        makeBox(150, 18, 120, 0xdde0ee, X_OFFSET - 890, 1060, 100);
        makeBox(120, 16, 100, 0xdde0ee, X_OFFSET - 820, 1040, -60);
        makeBox(180, 22, 140, 0xdde0ee, X_OFFSET - 860, 1100, 80);
        // Snow on summit cone
        makeBox(100, 30, 80, 0xeeeeff, X_OFFSET - 850, 1350, 50);
        // Deep corries (bowl-shaped hollows)
        makeBox(300, 150, 200, 0x251e1e, X_OFFSET - 820, 700, -100);
        makeBox(280, 140, 180, 0x251e1e, X_OFFSET - 870, 720, 180);

        // South Glencoe ridgeline extending from Bidean
        makeBox(600, 280, 200, 0x3a3232, X_OFFSET - 800, 140, -700);
        makeBox(500, 240, 200, 0x332b2b, X_OFFSET - 800, 380, -700);
        makeBox(380, 160, 180, 0x2a2222, X_OFFSET - 800, 580, -700);
    }

    function buildNorthRidgeline() {
        // North side of valley - steep scree slopes and ridges
        // Aonach Eagach ridge - famously narrow ridge
        makeBox(1400, 260, 200, 0x454040, X_OFFSET + 750, 130, -200);
        makeBox(1400, 200, 180, 0x3a3535, X_OFFSET + 750, 360, -200);
        makeBox(1200, 140, 160, 0x302b2b, X_OFFSET + 750, 520, -200);
        // Pinnacle ridge
        makeBox(100, 200, 40, 0x2a2525, X_OFFSET + 600, 620, -200);
        makeBox(80, 180, 40, 0x2a2525, X_OFFSET + 700, 610, -200);
        makeBox(90, 220, 40, 0x2a2525, X_OFFSET + 800, 630, -200);
        makeBox(75, 190, 40, 0x2a2525, X_OFFSET + 900, 615, -200);
        makeBox(85, 210, 40, 0x2a2525, X_OFFSET + 1000, 625, -200);
        // Scree slopes below ridge
        makeBox(400, 60, 200, 0x5a5050, X_OFFSET + 600, 30, -200);
        makeBox(400, 50, 180, 0x554b4b, X_OFFSET + 800, 25, -190);
        makeBox(300, 55, 190, 0x5a5050, X_OFFSET + 1000, 28, -195);
        // Sgor nam Fiannaidh - west end
        makeBox(250, 320, 300, 0x3d3838, X_OFFSET + 450, 160, -250);
        makeCone(80, 180, 5, 0x2e2929, X_OFFSET + 450, 490, -250);
        // Meall Dearg
        makeBox(220, 300, 280, 0x3d3838, X_OFFSET + 1100, 150, -230);
        makeCone(70, 160, 5, 0x2e2929, X_OFFSET + 1100, 470, -230);
    }

    function buildMassacreSite() {
        // 1692 Glencoe Massacre memorial site
        // Near Glencoe village - memorial cairn
        var cairnX = X_OFFSET + 180;
        var cairnZ = -850;

        // Memorial cairn - stacked stone structure
        makeCylinder(20, 30, 60, 8, 0x7a7a6a, cairnX, 30, cairnZ);
        makeCylinder(15, 22, 40, 8, 0x6e6e5e, cairnX, 80, cairnZ);
        makeCylinder(8, 16, 30, 8, 0x636356, cairnX, 115, cairnZ);
        // Top stone
        makeBox(20, 12, 20, 0x5a5a4e, cairnX, 136, cairnZ);

        // Memorial cross/marker
        makeBox(4, 50, 4, 0x555548, cairnX + 40, 25, cairnZ);
        makeBox(24, 4, 4, 0x555548, cairnX + 40, 45, cairnZ);

        // Information boards
        makeBox(30, 25, 3, 0x8b7355, cairnX - 50, 12, cairnZ + 15);
        makeBox(30, 25, 3, 0x8b7355, cairnX - 50, 12, cairnZ - 15);
        // Board posts
        makeBox(3, 30, 3, 0x6b5535, cairnX - 62, 15, cairnZ + 15);
        makeBox(3, 30, 3, 0x6b5535, cairnX - 38, 15, cairnZ + 15);

        // Visitor layby off A82
        makeBox(120, 2, 60, 0x777777, cairnX + 100, 1, cairnZ);
        // Layby gravel/tarmac detail
        makeBox(118, 1, 58, 0x888888, cairnX + 100, 2, cairnZ);
        // Parking area markers
        makeBox(2, 3, 55, 0xffffff, cairnX + 60, 2, cairnZ);
        makeBox(2, 3, 55, 0xffffff, cairnX + 158, 2, cairnZ);

        // Surrounding memorial garden area
        makeBox(100, 3, 80, 0x3d5c36, cairnX, 1, cairnZ + 50);
        // Remembrance stones/rocks
        makeBox(8, 6, 8, 0x888878, cairnX - 20, 3, cairnZ + 60);
        makeBox(10, 8, 10, 0x888878, cairnX + 20, 4, cairnZ + 70);
        makeBox(7, 5, 7, 0x888878, cairnX + 5, 3, cairnZ + 40);

        // Glencoe village buildings (simple boxes)
        makeBox(60, 30, 50, 0xccb896, X_OFFSET + 300, 15, -900);
        makeBox(50, 28, 45, 0xc4b08a, X_OFFSET + 380, 14, -920);
        makeBox(55, 32, 48, 0xd4c4a0, X_OFFSET + 260, 16, -960);
        // Roofs
        makeCone(45, 25, 4, 0x8b6b4a, X_OFFSET + 300, 43, -900);
        makeCone(38, 22, 4, 0x8b6b4a, X_OFFSET + 380, 41, -920);
        makeCone(42, 24, 4, 0x8b6b4a, X_OFFSET + 260, 44, -960);
    }

    function buildRannochMoor() {
        // Rannoch Moor - vast bleak boggy moorland to east
        var mX = X_OFFSET + 1800;

        // Main moor surface - dark peaty brown
        makeBox(2000, 4, 2400, 0x4a3d2a, mX, 0, 200);
        // Bog pools and lochans - dark water
        makeBox(180, 3, 240, 0x112233, mX - 400, 1, -100);
        makeBox(220, 3, 180, 0x0e1f2e, mX + 200, 1, 300);
        makeBox(150, 3, 200, 0x112233, mX + 500, 1, 600);
        makeBox(280, 3, 120, 0x0e1f2e, mX - 200, 1, 700);
        makeBox(100, 3, 150, 0x112233, mX + 300, 1, -300);
        makeBox(90, 3, 110, 0x0e1f2e, mX - 100, 1, 1000);
        makeBox(200, 3, 160, 0x112233, mX + 600, 1, 900);
        // Loch Ba - larger water body
        makeBox(600, 4, 400, 0x0d1e2e, mX + 400, 1, 1200);
        // Reed edges around lochs
        makeBox(190, 5, 10, 0x5a6b3a, mX - 400, 2, 20);
        makeBox(10, 5, 250, 0x5a6b3a, mX - 500, 2, -100);

        // Scattered moorland rocks
        makeBox(25, 18, 30, 0x6a6050, mX - 300, 9, 200);
        makeBox(30, 22, 25, 0x6a6050, mX + 100, 11, 500);
        makeBox(20, 15, 22, 0x6a6050, mX + 450, 8, 100);
        makeBox(35, 28, 32, 0x6a6050, mX - 150, 14, 800);
        makeBox(18, 12, 20, 0x6a6050, mX + 650, 6, 400);
        makeBox(28, 20, 25, 0x6a6050, mX - 600, 10, 600);
        makeBox(22, 16, 18, 0x6a6050, mX + 200, 8, 1000);
        makeBox(40, 30, 35, 0x6a6050, mX + 750, 15, 700);

        // Heather patches - purple-ish
        makeBox(150, 4, 120, 0x6b4f6b, mX - 350, 2, 400);
        makeBox(120, 4, 100, 0x5e4460, mX + 350, 2, 600);
        makeBox(180, 4, 140, 0x6b4f6b, mX - 100, 2, 900);
        makeBox(100, 4, 90, 0x5e4460, mX + 550, 2, 200);

        // Isolated tor/rocky outcrop
        makeBox(80, 60, 70, 0x5a5248, mX + 800, 30, 400);
        makeBox(60, 40, 55, 0x504844, mX + 800, 90, 400);
        makeBox(35, 25, 30, 0x484040, mX + 800, 140, 400);

        // Fence line crossing moor
        makeBox(2, 12, 800, 0x8b6b3a, mX - 500, 6, 400);
        makeBox(2, 12, 2, 0x7a5a2a, mX - 500, 6, 0);
        makeBox(2, 12, 2, 0x7a5a2a, mX - 500, 6, 200);
        makeBox(2, 12, 2, 0x7a5a2a, mX - 500, 6, 400);
        makeBox(2, 12, 2, 0x7a5a2a, mX - 500, 6, 600);
        makeBox(2, 12, 2, 0x7a5a2a, mX - 500, 6, 800);
    }

    function buildSignalRock() {
        // Signal Rock and NTS Visitor Centre / woodland
        var vX = X_OFFSET + 50;
        var vZ = -1100;

        // NTS Visitor Centre building
        makeBox(120, 40, 80, 0xb8a080, vX, 20, vZ);
        makeBox(116, 36, 76, 0xc4ac8c, vX, 20, vZ);
        // Roof
        makeBox(130, 15, 90, 0x8b6b4a, vX, 48, vZ);
        // Windows
        makeBox(20, 15, 3, 0x88aacc, vX - 30, 22, vZ - 41);
        makeBox(20, 15, 3, 0x88aacc, vX + 30, 22, vZ - 41);
        // Car park
        makeBox(200, 2, 100, 0x888888, vX, 1, vZ - 120);
        makeBox(3, 3, 90, 0xffffff, vX - 40, 2, vZ - 120);
        makeBox(3, 3, 90, 0xffffff, vX, 2, vZ - 120);
        makeBox(3, 3, 90, 0xffffff, vX + 40, 2, vZ - 120);

        // Signal Rock - prominent rocky outcrop
        makeBox(45, 55, 50, 0x6a6258, vX - 200, 28, vZ + 100);
        makeBox(35, 30, 38, 0x5e5650, vX - 200, 83, vZ + 100);
        makeBox(20, 20, 22, 0x524e48, vX - 200, 113, vZ + 100);

        // Woodland trees - conifers represented as cones/cylinders
        var treePositions = [
            [vX - 100, vZ + 50],
            [vX - 130, vZ + 30],
            [vX - 80, vZ + 80],
            [vX + 120, vZ + 60],
            [vX + 140, vZ + 30],
            [vX + 100, vZ + 90],
            [vX - 150, vZ + 120],
            [vX + 80, vZ + 120],
            [vX - 60, vZ + 150],
            [vX + 160, vZ + 100],
            [vX - 180, vZ + 80],
            [vX + 60, vZ + 140],
            [vX - 250, vZ + 60],
            [vX + 200, vZ + 50],
            [vX - 220, vZ + 140],
            [vX + 180, vZ + 140]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tx = treePositions[t][0];
            var tz = treePositions[t][1];
            // Trunk
            makeCylinder(4, 5, 25, 6, 0x5c3d1e, tx, 12, tz);
            // Canopy - layered cones
            makeCone(22, 35, 7, 0x2a4a1e, tx, 45, tz);
            makeCone(17, 28, 7, 0x234018, tx, 62, tz);
            makeCone(11, 20, 7, 0x1e3614, tx, 76, tz);
        }

        // Waterfall - white cascade down cliff
        makeBox(15, 120, 8, 0xeeeeff, vX - 300, 60, vZ + 150);
        makeBox(18, 80, 10, 0xdde0ff, vX - 300, 180, vZ + 150);
        // Plunge pool
        makeBox(50, 4, 50, 0x2255aa, vX - 300, 2, vZ + 150);

        // River Coe rushing through woodland
        makeBox(22, 3, 300, 0x1e4d9e, vX - 320, 2, vZ + 50);
        makeBox(28, 3, 200, 0x2255aa, vX - 310, 2, vZ - 100);
        // Rocky river bed
        makeBox(30, 4, 300, 0x4a4030, vX - 320, 1, vZ + 50);

        // Woodland path
        makeBox(8, 2, 200, 0x8b7355, vX - 150, 2, vZ + 100);
        makeBox(8, 2, 150, 0x8b7355, vX - 180, 2, vZ + 180);
        makeBox(8, 2, 160, 0x7a6445, vX - 240, 2, vZ + 130);
    }

    function buildSceneryExtras() {
        // Additional highland character features

        // Lochan na Fola (small lochan in valley)
        makeBox(100, 3, 80, 0x112233, X_OFFSET - 100, 1, -700);
        makeBox(70, 3, 50, 0x0e1f2e, X_OFFSET - 80, 1, -720);

        // Scattered highland cattle (simple box forms)
        makeBox(20, 12, 30, 0x6b4a1e, X_OFFSET + 150, 6, 100);
        makeBox(20, 12, 30, 0x5a3d18, X_OFFSET + 120, 6, 200);
        makeBox(20, 12, 30, 0x6b4a1e, X_OFFSET + 180, 6, 150);
        // Heads
        makeSphere(7, 6, 6, 0x6b4a1e, X_OFFSET + 165, 18, 85);
        makeSphere(7, 6, 6, 0x5a3d18, X_OFFSET + 135, 18, 185);
        makeSphere(7, 6, 6, 0x6b4a1e, X_OFFSET + 195, 18, 135);

        // Old ruined cottage (roofless)
        makeBox(40, 20, 35, 0x8a7a6a, X_OFFSET + 350, 10, 200);
        makeBox(36, 16, 31, 0x7a6a5a, X_OFFSET + 350, 10, 200);
        // Wall only - open top
        makeBox(40, 4, 3, 0x8a7a6a, X_OFFSET + 350, 26, 183);
        makeBox(40, 4, 3, 0x8a7a6a, X_OFFSET + 350, 26, 217);
        makeBox(3, 4, 35, 0x8a7a6a, X_OFFSET + 331, 26, 200);
        makeBox(3, 4, 35, 0x8a7a6a, X_OFFSET + 369, 26, 200);

        // Loose boulders from glacial erratics
        makeBox(35, 25, 30, 0x6e6462, X_OFFSET - 200, 12, 300);
        makeBox(28, 20, 25, 0x6e6462, X_OFFSET + 100, 10, -200);
        makeBox(40, 30, 35, 0x6e6462, X_OFFSET - 300, 15, 600);
        makeBox(22, 16, 20, 0x6e6462, X_OFFSET + 280, 8, 400);
        makeBox(32, 24, 28, 0x6e6462, X_OFFSET - 50, 12, 800);

        // Bracken / autumn colours
        makeBox(180, 4, 140, 0x8b5e1e, X_OFFSET - 100, 2, 500);
        makeBox(120, 4, 100, 0x9b6e2e, X_OFFSET + 200, 2, 700);
        makeBox(150, 4, 120, 0x8b5e1e, X_OFFSET - 200, 2, 800);

        // Dead/bare birch trees on hillside
        var birchPos = [
            [X_OFFSET - 380, 200],
            [X_OFFSET - 360, 300],
            [X_OFFSET - 400, 400],
            [X_OFFSET - 370, 500]
        ];
        for (var b = 0; b < birchPos.length; b++) {
            var bx = birchPos[b][0];
            var bz = birchPos[b][1];
            makeCylinder(2, 3, 20, 5, 0xc8c0b0, bx, 10, bz);
            makeBox(16, 2, 3, 0xb8b0a0, bx, 22, bz);
            makeBox(3, 2, 12, 0xb8b0a0, bx, 20, bz);
        }

        // Mountain stream crossing valley from north ridge
        makeBox(8, 2, 180, 0x2255aa, X_OFFSET + 500, 1, -300);
        makeBox(10, 2, 120, 0x1e4d9e, X_OFFSET + 480, 1, -150);
        // Stream delta/fan
        makeBox(30, 2, 40, 0x1a4488, X_OFFSET + 460, 1, -50);
    }

    function buildAmbientLight() {
        // Fog/mist effect represented as pale overlay boxes at valley edges
        makeBox(50, 200, 2000, 0xd0d8e8, X_OFFSET - 900, 100, 0);
        makeBox(50, 150, 2000, 0xd0d8e8, X_OFFSET + 900, 75, 0);
    }

    function build() {
        buildValleyFloor();
        buildRiverCoe();
        buildA82Road();
        buildThreeSisters();
        buildBideanNamBian();
        buildNorthRidgeline();
        buildMassacreSite();
        buildRannochMoor();
        buildSignalRock();
        buildSceneryExtras();
        buildAmbientLight();
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
