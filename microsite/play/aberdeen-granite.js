window.AberdeenGranite = (function() {
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(edges, mat);
        ls.position.set(x, y, z);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function buildMarischalCollege() {
        var ox = 15120 + 0;
        var oz = -80;
        var graniteGrey = 0xb0b8c0;
        var darkGranite = 0x7a8490;
        var pinnacleWhite = 0xd0d8e0;

        // Main great hall body
        makeBox(60, 28, 24, graniteGrey, ox, 14, oz);

        // Central Mitchell Tower
        makeBox(10, 52, 10, graniteGrey, ox, 26, oz - 4);
        makeCone(6, 14, 4, darkGranite, ox, 59, oz - 4);

        // Left flanking tower
        makeBox(10, 44, 10, graniteGrey, ox - 28, 22, oz);
        makeCone(5, 12, 4, darkGranite, ox - 28, 50, oz);
        // Left tower pinnacles
        makeCone(1.5, 6, 4, pinnacleWhite, ox - 31, 50, oz - 4);
        makeCone(1.5, 6, 4, pinnacleWhite, ox - 25, 50, oz - 4);
        makeCone(1.5, 6, 4, pinnacleWhite, ox - 31, 50, oz + 4);
        makeCone(1.5, 6, 4, pinnacleWhite, ox - 25, 50, oz + 4);

        // Right flanking tower
        makeBox(10, 44, 10, graniteGrey, ox + 28, 22, oz);
        makeCone(5, 12, 4, darkGranite, ox + 28, 50, oz);
        // Right tower pinnacles
        makeCone(1.5, 6, 4, pinnacleWhite, ox + 31, 50, oz - 4);
        makeCone(1.5, 6, 4, pinnacleWhite, ox + 25, 50, oz - 4);
        makeCone(1.5, 6, 4, pinnacleWhite, ox + 31, 50, oz + 4);
        makeCone(1.5, 6, 4, pinnacleWhite, ox + 25, 50, oz + 4);

        // Gothic facade detail strips
        makeBox(60, 2, 1, pinnacleWhite, ox, 10, oz - 12);
        makeBox(60, 2, 1, pinnacleWhite, ox, 18, oz - 12);
        makeBox(60, 2, 1, pinnacleWhite, ox, 26, oz - 12);

        // Courtyard wings
        makeBox(12, 20, 40, graniteGrey, ox - 32, 10, oz + 20);
        makeBox(12, 20, 40, graniteGrey, ox + 32, 10, oz + 20);

        // Courtyard ground
        makeBox(64, 0.5, 40, 0x909898, ox, 0.25, oz + 20);

        // Entrance arch
        makeBox(16, 24, 4, darkGranite, ox, 12, oz - 13);
        makeBox(16, 4, 4, pinnacleWhite, ox, 25, oz - 13);

        // Mitchell Tower top spire detail
        makeBox(6, 4, 6, darkGranite, ox, 54, oz - 4);
        makeCone(3, 8, 4, pinnacleWhite, ox, 60, oz - 4);

        // Small pinnacles along main roof
        for (var pi = -24; pi <= 24; pi += 8) {
            makeCone(1, 4, 4, pinnacleWhite, ox + pi, 30, oz - 12);
        }

        // Quad paving
        makeBox(58, 0.3, 38, 0x888e94, ox, 0.15, oz + 18);
    }

    function buildAberdeenHarbour() {
        var ox = 15120 + 120;
        var oz = 60;
        var stoneGrey = 0x8a9098;
        var darkStone = 0x5a6268;
        var metalGrey = 0x6a7278;
        var waterBlue = 0x1a4a6a;
        var rustOrange = 0xb85c2a;

        // Harbour water basin
        makeBox(180, 0.5, 100, waterBlue, ox, -0.5, oz);

        // North harbour wall
        makeBox(200, 8, 10, stoneGrey, ox, 4, oz - 55);
        // South harbour wall
        makeBox(200, 8, 10, stoneGrey, ox, 4, oz + 55);
        // West quay
        makeBox(10, 8, 100, stoneGrey, ox - 95, 4, oz);
        // East breakwater
        makeBox(10, 6, 120, darkStone, ox + 95, 3, oz);

        // Fish Market Hall
        makeBox(60, 12, 30, 0xc0c8d0, ox - 50, 6, oz - 38);
        makeBox(60, 4, 30, metalGrey, ox - 50, 14, oz - 38);
        makeCylinder(1, 1, 16, 8, 0xd0d0d0, ox - 26, 18, oz - 38);
        makeCylinder(1, 1, 16, 8, 0xd0d0d0, ox - 50, 18, oz - 38);
        makeCylinder(1, 1, 16, 8, 0xd0d0d0, ox - 74, 18, oz - 38);

        // Harbour Master Tower
        makeBox(10, 22, 10, stoneGrey, ox + 60, 11, oz - 46);
        makeBox(14, 4, 14, 0x708090, ox + 60, 24, oz - 46);
        makeCone(5, 8, 4, darkStone, ox + 60, 30, oz - 46);
        // Windows on tower
        makeBox(2, 3, 1, 0x9ab0c8, ox + 60, 20, oz - 52);
        makeBox(2, 3, 1, 0x9ab0c8, ox + 63, 20, oz - 49);

        // Oil supply vessel 1
        makeBox(44, 6, 12, 0x2a3a4a, ox + 10, 2, oz + 10);
        makeBox(14, 8, 10, 0x3a4a5a, ox + 22, 6, oz + 10);
        makeCylinder(1.5, 1.5, 20, 8, 0xd04020, ox + 22, 18, oz + 10);
        makeBox(6, 2, 8, metalGrey, ox - 8, 6, oz + 10);

        // Oil supply vessel 2
        makeBox(38, 5, 10, 0x1a2a3a, ox - 30, 1.5, oz + 30);
        makeBox(10, 7, 8, 0x2a3a4a, ox - 24, 5.5, oz + 30);
        makeCylinder(1, 1, 16, 8, rustOrange, ox - 24, 15, oz + 30);

        // Fishing trawler
        makeBox(22, 4, 8, 0x4a5a2a, ox + 60, 1, oz + 20);
        makeBox(6, 6, 6, 0x5a6a3a, ox + 65, 6, oz + 20);
        makeCylinder(0.8, 0.8, 14, 6, 0x303a20, ox + 65, 13, oz + 20);

        // Dockside crane
        makeBox(3, 30, 3, metalGrey, ox + 80, 15, oz - 40);
        makeBox(24, 2, 2, metalGrey, ox + 92, 30, oz - 40);
        makeBox(2, 20, 2, metalGrey, ox + 104, 20, oz - 40);
        // Crane cable
        makeBox(0.5, 14, 0.5, 0x404040, ox + 104, 13, oz - 40);

        // Dock warehouses
        makeBox(40, 14, 20, 0xa0a8b0, ox - 60, 7, oz - 38);
        makeBox(40, 4, 20, metalGrey, ox - 60, 16, oz - 38);
        makeBox(30, 14, 20, 0x909898, ox - 10, 7, oz - 38);

        // Bollards along quay
        for (var bi = -80; bi <= 80; bi += 20) {
            makeCylinder(1.2, 1.2, 3, 8, darkStone, ox + bi, 1.5, oz - 50);
        }

        // Lighthouse at harbour entrance
        makeCylinder(3, 4, 22, 10, 0xd0d8e0, ox + 95, 11, oz - 5);
        makeCylinder(2, 2, 3, 10, metalGrey, ox + 95, 23, oz - 5);
        makeCone(2, 5, 10, 0xe84040, ox + 95, 27, oz - 5);
    }

    function buildKingsCollege() {
        var ox = 15120 - 100;
        var oz = -160;
        var sandGranite = 0xc8b890;
        var darkSand = 0x988860;
        var leadGrey = 0x808888;
        var grassGreen = 0x3a6830;

        // King's College Chapel — main body
        makeBox(30, 20, 50, sandGranite, ox, 10, oz);
        makeBox(30, 3, 50, darkSand, ox, 21.5, oz);

        // Crown Tower (unique crown spire) — round tower with crown
        makeCylinder(6, 7, 34, 12, sandGranite, ox, 17, oz - 18);
        // Crown spire base ring
        makeCylinder(7, 7, 2, 12, darkSand, ox, 35, oz - 18);
        // Crown flying buttresses (4 sides)
        makeBox(2, 8, 1, sandGranite, ox, 37, oz - 26);
        makeBox(2, 8, 1, sandGranite, ox, 37, oz - 10);
        makeBox(1, 8, 2, sandGranite, ox - 8, 37, oz - 18);
        makeBox(1, 8, 2, sandGranite, ox + 8, 37, oz - 18);
        // Crown spire
        makeCylinder(2, 5, 6, 8, leadGrey, ox, 41, oz - 18);
        makeCone(2, 10, 8, leadGrey, ox, 46, oz - 18);

        // Chapel buttresses
        makeBox(4, 20, 4, sandGranite, ox - 16, 10, oz - 20);
        makeBox(4, 20, 4, sandGranite, ox + 16, 10, oz - 20);
        makeBox(4, 20, 4, sandGranite, ox - 16, 10, oz);
        makeBox(4, 20, 4, sandGranite, ox + 16, 10, oz);
        makeBox(4, 20, 4, sandGranite, ox - 16, 10, oz + 20);
        makeBox(4, 20, 4, sandGranite, ox + 16, 10, oz + 20);

        // King's College Quad buildings
        makeBox(10, 16, 50, sandGranite, ox - 30, 8, oz);
        makeBox(10, 16, 50, sandGranite, ox + 30, 8, oz);
        makeBox(60, 16, 10, sandGranite, ox, 8, oz + 30);

        // Quad gate tower
        makeBox(12, 22, 10, sandGranite, ox, 11, oz + 30);
        makeBox(4, 4, 4, darkSand, ox - 4, 23, oz + 30);
        makeBox(4, 4, 4, darkSand, ox + 4, 23, oz + 30);
        makeCone(2, 6, 4, leadGrey, ox - 4, 27, oz + 30);
        makeCone(2, 6, 4, leadGrey, ox + 4, 27, oz + 30);

        // Quad courtyard lawn
        makeBox(46, 0.2, 42, grassGreen, ox, 0.1, oz + 2);

        // Old Aberdeen street cobbles
        makeBox(80, 0.3, 12, 0x807870, ox, 0.15, oz + 50);

        // Adjacent university buildings
        makeBox(24, 18, 30, sandGranite, ox - 60, 9, oz - 20);
        makeBox(24, 18, 30, sandGranite, ox + 60, 9, oz - 20);
        makeCone(3, 9, 4, darkSand, ox - 60, 22, oz - 20);
        makeCone(3, 9, 4, darkSand, ox + 60, 22, oz - 20);

        // Library building
        makeBox(36, 14, 24, 0xd0c8a8, ox - 20, 7, oz - 80);
        makeBox(36, 2, 24, darkSand, ox - 20, 15, oz - 80);
    }

    function buildCityCentre() {
        var ox = 15120 + 30;
        var oz = -10;
        var graniteGrey = 0xb8c0c8;
        var darkGranite = 0x7a8490;
        var victGranite = 0x909aa2;
        var roadGrey = 0x505868;
        var pavingGrey = 0x6a7278;

        // Union Street — main thoroughfare (runs east-west)
        makeBox(200, 0.3, 18, roadGrey, ox + 10, 0.15, oz + 50);
        // Pavements
        makeBox(200, 0.3, 5, pavingGrey, ox + 10, 0.2, oz + 42);
        makeBox(200, 0.3, 5, pavingGrey, ox + 10, 0.2, oz + 58);

        // Aberdeen Town House — Victorian Gothic
        makeBox(40, 26, 20, graniteGrey, ox - 30, 13, oz + 50);
        // Town House central tower
        makeBox(12, 46, 12, victGranite, ox - 30, 23, oz + 50);
        makeCone(6, 14, 4, darkGranite, ox - 30, 50, oz + 50);
        makeBox(20, 3, 1, 0xd0d8e0, ox - 30, 28, oz + 40);
        // Town House pinnacles
        makeCone(1.5, 5, 4, 0xd0d8e0, ox - 38, 33, oz + 42);
        makeCone(1.5, 5, 4, 0xd0d8e0, ox - 22, 33, oz + 42);
        makeCone(1.5, 5, 4, 0xd0d8e0, ox - 38, 33, oz + 58);
        makeCone(1.5, 5, 4, 0xd0d8e0, ox - 22, 33, oz + 58);

        // Mercat Cross — historic market cross
        makeCylinder(4, 4, 1.5, 8, pavingGrey, ox + 20, 0.75, oz + 50);
        makeCylinder(1, 1, 10, 8, graniteGrey, ox + 20, 6, oz + 50);
        makeSphere(2, 8, 8, 0xd0c8a0, ox + 20, 12.5, oz + 50);

        // War Memorial
        makeBox(8, 2, 8, darkGranite, ox + 50, 1, oz + 50);
        makeCylinder(2, 2, 18, 10, graniteGrey, ox + 50, 10, oz + 50);
        makeBox(6, 6, 6, darkGranite, ox + 50, 21, oz + 50);
        makeSphere(2.5, 8, 8, 0xd0a030, ox + 50, 25, oz + 50);

        // Granite buildings along Union Street — north side
        makeBox(28, 22, 18, graniteGrey, ox + 70, 11, oz + 42);
        makeBox(28, 3, 18, darkGranite, ox + 70, 23.5, oz + 42);
        makeBox(22, 18, 18, victGranite, ox + 100, 9, oz + 42);
        makeBox(30, 24, 18, graniteGrey, ox + 128, 12, oz + 42);
        makeBox(30, 3, 18, darkGranite, ox + 128, 25.5, oz + 42);

        // Granite buildings along Union Street — south side
        makeBox(32, 20, 18, graniteGrey, ox + 70, 10, oz + 58);
        makeBox(26, 22, 18, victGranite, ox + 100, 11, oz + 58);
        makeBox(36, 18, 18, graniteGrey, ox + 130, 9, oz + 58);

        // Bon Accord Shopping Centre
        makeBox(70, 18, 50, 0xa8b0b8, ox + 20, 9, oz - 30);
        makeBox(70, 2, 50, darkGranite, ox + 20, 19, oz - 30);
        makeBox(10, 18, 50, 0xb0b8c0, ox - 15, 9, oz - 30);
        makeBox(10, 18, 50, 0xb0b8c0, ox + 55, 9, oz - 30);
        // Atrium / entrance dome
        makeCylinder(12, 12, 4, 12, 0xc8d0d8, ox + 20, 20, oz - 30);
        makeCylinder(10, 10, 2, 12, 0x90a0b0, ox + 20, 22.5, oz - 30);

        // St Nicholas Kirk (church)
        makeBox(30, 18, 50, graniteGrey, ox - 80, 9, oz + 50);
        makeBox(10, 34, 10, graniteGrey, ox - 80, 17, oz + 30);
        makeCone(5, 12, 4, darkGranite, ox - 80, 40, oz + 30);
        makeBox(4, 8, 4, 0xd0d8e0, ox - 88, 26, oz + 30);
        makeBox(4, 8, 4, 0xd0d8e0, ox - 72, 26, oz + 30);

        // Castlegate / Castle Street area
        makeBox(20, 16, 20, graniteGrey, ox + 60, 8, oz + 80);
        makeBox(20, 3, 20, darkGranite, ox + 60, 17.5, oz + 80);
        makeBox(14, 26, 14, victGranite, ox + 80, 13, oz + 80);
        makeCone(5, 10, 4, darkGranite, ox + 80, 29, oz + 80);

        // Street lampposts
        for (var li = 0; li <= 160; li += 20) {
            makeCylinder(0.3, 0.3, 8, 6, 0x303840, ox - 70 + li, 4, oz + 42);
            makeSphere(0.8, 6, 6, 0xffee88, ox - 70 + li, 9, oz + 42);
        }
    }

    function buildNorthSeaOil() {
        var ox = 15120 + 280;
        var oz = 80;
        var steelGrey = 0x607080;
        var darkMetal = 0x404850;
        var yellow = 0xd0a020;
        var orange = 0xd06020;
        var waterDeep = 0x0a2a4a;

        // Sea surface
        makeBox(160, 0.5, 160, waterDeep, ox, -3, oz);

        // Oil platform jacket legs (4 main legs)
        makeCylinder(3, 4, 60, 10, steelGrey, ox - 30, 27, oz - 30);
        makeCylinder(3, 4, 60, 10, steelGrey, ox + 30, 27, oz - 30);
        makeCylinder(3, 4, 60, 10, steelGrey, ox - 30, 27, oz + 30);
        makeCylinder(3, 4, 60, 10, steelGrey, ox + 30, 27, oz + 30);

        // Cross bracing on jacket
        makeBox(60, 2, 2, darkMetal, ox, 10, oz - 30);
        makeBox(60, 2, 2, darkMetal, ox, 10, oz + 30);
        makeBox(2, 2, 60, darkMetal, ox - 30, 10, oz);
        makeBox(2, 2, 60, darkMetal, ox + 30, 10, oz);
        makeBox(60, 2, 2, darkMetal, ox, 25, oz - 30);
        makeBox(60, 2, 2, darkMetal, ox, 25, oz + 30);
        makeBox(2, 2, 60, darkMetal, ox - 30, 25, oz);
        makeBox(2, 2, 60, darkMetal, ox + 30, 25, oz);
        makeBox(60, 2, 2, darkMetal, ox, 40, oz - 30);
        makeBox(60, 2, 2, darkMetal, ox, 40, oz + 30);
        makeBox(2, 2, 60, darkMetal, ox - 30, 40, oz);
        makeBox(2, 2, 60, darkMetal, ox + 30, 40, oz);

        // Main deck / topside
        makeBox(74, 4, 74, 0x506070, ox, 57, oz);

        // Drilling derrick
        makeBox(6, 44, 6, steelGrey, ox, 79, oz);
        makeCone(4, 8, 4, steelGrey, ox, 103, oz);

        // Accommodation module
        makeBox(28, 14, 18, 0x708090, ox - 22, 66, oz - 22);
        makeBox(28, 2, 18, yellow, ox - 22, 73, oz - 22);
        makeBox(16, 10, 16, 0x608090, ox - 22, 83, oz - 22);

        // Process module
        makeBox(24, 12, 20, darkMetal, ox + 18, 64, oz + 10);
        makeCylinder(3, 3, 14, 8, steelGrey, ox + 26, 70, oz + 10);
        makeCylinder(2, 2, 10, 8, steelGrey, ox + 12, 68, oz + 10);

        // Flare boom
        makeBox(2, 2, 50, darkMetal, ox - 5, 60, oz + 40);
        makeSphere(3, 8, 8, 0xff6010, ox - 5, 62, oz + 65);
        makeSphere(2, 8, 8, 0xffa030, ox - 5, 65, oz + 65);

        // Helipad
        makeCylinder(12, 12, 1, 12, 0x405060, ox + 25, 59, oz - 28);
        makeCylinder(10, 10, 0.2, 12, yellow, ox + 25, 59.5, oz - 28);

        // Crane on platform
        makeBox(3, 20, 3, steelGrey, ox + 28, 69, oz + 20);
        makeBox(18, 2, 2, steelGrey, ox + 37, 79, oz + 20);
        makeBox(2, 14, 2, steelGrey, ox + 46, 72, oz + 20);

        // Supply vessel near platform
        makeBox(48, 6, 14, 0x1a2a3a, ox + 70, 55, oz);
        makeBox(14, 8, 12, 0x2a3a4a, ox + 84, 59, oz);
        makeCylinder(1.5, 1.5, 18, 8, orange, ox + 84, 69, oz);

        // Wave marker buoy
        makeSphere(4, 8, 8, 0xe83020, ox - 70, -1, oz - 50);
        makeCylinder(0.5, 0.5, 10, 6, 0xe83020, ox - 70, 7, oz - 50);
    }

    function buildBalmoral() {
        var ox = 15120 - 200;
        var oz = -280;
        var castleGrey = 0xc8c0b8;
        var darkCastle = 0x908880;
        var slateBlue = 0x6878a0;
        var greenGrass = 0x2a5828;
        var riverBlue = 0x2a5880;
        var treeGreen = 0x1a4820;

        // Grounds / estate
        makeBox(200, 0.3, 180, greenGrass, ox, 0.15, oz);

        // River Dee
        makeBox(200, 0.3, 20, riverBlue, ox, 0.1, oz + 100);

        // Balmoral Castle main tower (keep)
        makeBox(18, 36, 18, castleGrey, ox - 10, 18, oz - 20);
        makeCone(9, 16, 4, slateBlue, ox - 10, 44, oz - 20);

        // Secondary towers
        makeBox(10, 26, 10, castleGrey, ox + 16, 13, oz - 10);
        makeCone(5, 12, 4, slateBlue, ox + 16, 31, oz - 10);
        makeBox(10, 22, 10, castleGrey, ox - 28, 11, oz - 20);
        makeCone(5, 10, 4, slateBlue, ox - 28, 27, oz - 20);
        makeBox(10, 20, 10, castleGrey, ox - 10, 10, oz + 10);
        makeCone(5, 10, 4, slateBlue, ox - 10, 25, oz + 10);

        // Connecting range buildings
        makeBox(36, 14, 16, castleGrey, ox + 4, 7, oz - 18);
        makeBox(36, 3, 16, darkCastle, ox + 4, 15.5, oz - 18);
        makeBox(20, 14, 16, castleGrey, ox - 22, 7, oz - 20);
        makeBox(20, 3, 16, darkCastle, ox - 22, 15.5, oz - 20);

        // Battlements / crenellations on main tower
        for (var ci = -6; ci <= 6; ci += 4) {
            makeBox(2, 3, 2, castleGrey, ox - 10 + ci, 38, oz - 28);
            makeBox(2, 3, 2, castleGrey, ox - 10 + ci, 38, oz - 12);
        }
        for (var cj = -6; cj <= 6; cj += 4) {
            makeBox(2, 3, 2, castleGrey, ox - 18, 38, oz - 20 + cj);
            makeBox(2, 3, 2, castleGrey, ox - 2, 38, oz - 20 + cj);
        }

        // Turrets on tower corners
        makeCylinder(2, 2, 8, 8, castleGrey, ox - 18, 36, oz - 28);
        makeCone(2, 5, 8, slateBlue, ox - 18, 42, oz - 28);
        makeCylinder(2, 2, 8, 8, castleGrey, ox - 2, 36, oz - 28);
        makeCone(2, 5, 8, slateBlue, ox - 2, 42, oz - 28);
        makeCylinder(2, 2, 8, 8, castleGrey, ox - 18, 36, oz - 12);
        makeCone(2, 5, 8, slateBlue, ox - 18, 42, oz - 12);
        makeCylinder(2, 2, 8, 8, castleGrey, ox - 2, 36, oz - 12);
        makeCone(2, 5, 8, slateBlue, ox - 2, 42, oz - 12);

        // Deer park fence
        makeBox(120, 2, 1, darkCastle, ox, 1, oz + 50);
        makeBox(1, 2, 80, darkCastle, ox - 60, 1, oz + 10);
        makeBox(1, 2, 80, darkCastle, ox + 60, 1, oz + 10);

        // Deer (stylised as simple shapes)
        makeBox(4, 3, 6, 0x8a6040, ox - 30, 2.5, oz + 30);
        makeCylinder(0.6, 0.6, 4, 6, 0x8a6040, ox - 30, 5.5, oz + 27);
        makeBox(4, 3, 6, 0x7a5030, ox + 20, 2.5, oz + 40);
        makeCylinder(0.6, 0.6, 4, 6, 0x7a5030, ox + 20, 5.5, oz + 37);
        makeBox(4, 3, 6, 0x9a7050, ox - 10, 2.5, oz + 60);
        makeCylinder(0.6, 0.6, 4, 6, 0x9a7050, ox - 10, 5.5, oz + 57);

        // Pine trees (Scots pine — conical)
        for (var ti = 0; ti < 8; ti++) {
            var tx = ox - 80 + ti * 22;
            var tz = oz - 60;
            makeCylinder(1, 1, 10, 6, 0x5a4020, tx, 5, tz);
            makeCone(6, 18, 8, treeGreen, tx, 19, tz);
            makeCone(5, 14, 8, treeGreen, tx, 22, tz);
        }
        for (var tj = 0; tj < 6; tj++) {
            var tx2 = ox + 70;
            var tz2 = oz - 40 + tj * 18;
            makeCylinder(1, 1, 10, 6, 0x5a4020, tx2, 5, tz2);
            makeCone(6, 18, 8, treeGreen, tx2, 19, tz2);
        }

        // Gatehouse / estate entrance
        makeBox(6, 12, 12, castleGrey, ox - 70, 6, oz + 90);
        makeBox(6, 12, 12, castleGrey, ox - 60, 6, oz + 90);
        makeBox(14, 4, 6, castleGrey, ox - 65, 14, oz + 90);
        makeCone(3, 8, 4, slateBlue, ox - 70, 20, oz + 90);
        makeCone(3, 8, 4, slateBlue, ox - 60, 20, oz + 90);

        // Driveway to castle
        makeBox(12, 0.3, 80, 0x706858, ox - 65, 0.2, oz + 50);
    }

    function build() {
        buildMarischalCollege();
        buildAberdeenHarbour();
        buildKingsCollege();
        buildCityCentre();
        buildNorthSeaOil();
        buildBalmoral();
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
