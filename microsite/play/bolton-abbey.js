window.BoltonAbbey = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(21080 + x, y, z);
        return addMesh(mesh);
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(21080 + x, y, z);
        return addMesh(mesh);
    }

    function sph(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(21080 + x, y, z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(21080 + x, y, z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildPrioryRuins();
        buildParishChurch();
        buildRiverWharfe();
        buildStrid();
        buildStridWood();
        buildBardenTower();
        buildBoltonBridge();
        buildCavendishPavilion();
        buildRailwayStation();
        buildLocomotive();
        buildDalesScenery();
    }

    function buildGround() {
        // Ground base — large flat box as estate ground
        box(600, 2, 600, 0x3d6b30, 0, -1, 0);
        // Limestone path through estate
        box(200, 0.5, 4, 0xC8C0A8, -60, 0.5, 10);
        box(4, 0.5, 80, 0xC8C0A8, 40, 0.5, -30);
        // Grassy bank near river
        box(60, 3, 20, 0x4a7a3a, -20, 1.5, -40);
    }

    function buildPrioryRuins() {
        var stone = 0xD4C9B0;

        // --- Nave: long roofless walls ---
        // North nave wall
        box(60, 8, 2, stone, -30, 4, -15);
        // South nave wall
        box(60, 8, 2, stone, -30, 4, -5);
        // West end ruined gable (partial)
        box(2, 10, 12, stone, -60, 5, -10);
        // East ruined crossing wall, shorter — collapsed
        box(2, 5, 12, stone, 0, 2.5, -10);

        // Nave column stumps along interior
        cyl(0.6, 0.7, 4, 8, stone, -50, 2, -8);
        cyl(0.6, 0.7, 4, 8, stone, -40, 2, -8);
        cyl(0.6, 0.7, 4, 8, stone, -30, 2, -8);
        cyl(0.6, 0.7, 4, 8, stone, -20, 2, -8);
        cyl(0.6, 0.7, 4, 8, stone, -10, 2, -8);
        // South side stumps
        cyl(0.6, 0.7, 4, 8, stone, -50, 2, -12);
        cyl(0.6, 0.7, 4, 8, stone, -30, 2, -12);
        cyl(0.6, 0.7, 4, 8, stone, -10, 2, -12);

        // West tower — tall, with pointed window arch suggestion
        box(8, 22, 8, stone, -65, 11, -10);
        // Window void suggestion: dark recess box
        box(2.5, 5, 1, 0x2a2a2a, -65, 16, -14);
        // Tower top crenellations
        box(2, 2, 2, stone, -67, 23, -12);
        box(2, 2, 2, stone, -63, 23, -12);
        box(2, 2, 2, stone, -67, 23, -8);
        box(2, 2, 2, stone, -63, 23, -8);
        // Pointed arch keystone over tower window
        cone(1.5, 3, 4, stone, -65, 20, -14);

        // Crossing walls (transepts, short stub ruins)
        box(2, 6, 18, stone, 0, 3, -1);
        box(2, 4, 18, stone, 0, 2, -19);
        // Crossing tower remnant
        box(8, 12, 8, stone, 1, 6, -10);

        // Choir ruins — east end, lower broken walls
        box(30, 4, 2, stone, 16, 2, -15);
        box(30, 4, 2, stone, 16, 2, -5);
        box(2, 4, 12, stone, 31, 2, -10);
        // Fallen rubble heaps
        box(4, 1.5, 3, stone, 10, 0.75, -10);
        box(3, 1.2, 2.5, stone, 14, 0.6, -13);
        box(5, 1, 4, stone, 22, 0.5, -7);

        // Chapter house remnant
        box(12, 3, 12, stone, 10, 1.5, 5);
        box(12, 0.5, 12, 0x8B8070, 10, 3.25, 5);

        // Processional doorway arch suggestion
        box(2, 6, 3, stone, -2, 3, -5);
        cone(1.2, 2.5, 4, stone, -2, 7.2, -5);
    }

    function buildParishChurch() {
        var stone = 0xD4C9B0;
        var roofCol = 0x8B7B6B;
        var glass = 0x4A6B8A;

        // West end of nave — still used, intact
        // Body of church
        box(28, 10, 14, stone, -75, 5, -10);
        // Roof (gabled — two boxes for slope approximation)
        box(30, 3, 7, roofCol, -75, 11.5, -13);
        box(30, 3, 7, roofCol, -75, 11.5, -7);
        // Ridge box
        box(30, 1, 2, roofCol, -75, 13.5, -10);

        // Porch
        box(5, 7, 6, stone, -90, 3.5, -10);
        // Porch roof
        box(6, 1.5, 7, roofCol, -90, 7.5, -10);

        // Windows (dark glass)
        box(1, 3, 2, glass, -76, 6, -17);
        box(1, 3, 2, glass, -80, 6, -17);
        box(1, 3, 2, glass, -84, 6, -17);
        box(1, 3, 2, glass, -76, 6, -3);
        box(1, 3, 2, glass, -84, 6, -3);

        // Door
        box(3, 5, 1, 0x5C4030, -75, 2.5, -17);

        // Bell tower on west end
        box(6, 18, 6, stone, -92, 9, -10);
        // Bell tower top
        box(7, 1, 7, stone, -92, 18.5, -10);
        // Tower crenellations
        box(2, 2, 2, stone, -94, 20, -12);
        box(2, 2, 2, stone, -90, 20, -12);
        box(2, 2, 2, stone, -94, 20, -8);
        box(2, 2, 2, stone, -90, 20, -8);
        // Belfry opening
        box(1.5, 3, 1, 0x2a2a2a, -92, 14, -13);
    }

    function buildRiverWharfe() {
        var water = 0x006994;
        var limestone = 0xC8C0A8;

        // Main river channel — wide flat box
        box(300, 0.8, 18, water, 50, 0.2, -60);
        // River bank edges (limestone)
        box(300, 1.5, 2, limestone, 50, 0.75, -70);
        box(300, 1.5, 2, limestone, 50, 0.75, -50);

        // Stepping stones across river
        box(2, 0.5, 2, limestone, 20, 0.6, -60);
        box(2, 0.5, 2, limestone, 24, 0.6, -60);
        box(2, 0.5, 2, limestone, 28, 0.6, -60);
        box(2, 0.5, 2, limestone, 32, 0.6, -61);
        box(2, 0.5, 2, limestone, 36, 0.6, -60);
        box(2, 0.5, 2, limestone, 40, 0.6, -59);

        // Limestone boulders in river
        sph(1.5, 6, 6, limestone, 15, 1, -55);
        sph(2, 6, 6, limestone, 35, 1, -65);
        sph(1.2, 6, 6, limestone, 55, 1, -58);
    }

    function buildStrid() {
        var water = 0x006994;
        var darkRock = 0x4A4035;
        var limestone = 0xC8C0A8;

        // The Strid — river narrows dramatically to ~2m gorge
        // Gorge walls on each side (high rock faces)
        box(30, 10, 3, darkRock, 130, 5, -58);
        box(30, 10, 3, darkRock, 130, 5, -62);
        // Gorge floor water
        box(30, 1, 2, water, 130, 0.5, -60);
        // Overhanging rock ledges
        box(30, 2, 4, darkRock, 130, 10, -56);
        box(30, 2, 4, darkRock, 130, 10, -64);
        // Deep dark water channel
        box(30, 4, 1.8, 0x003355, 130, -2, -60);
        // Upstream broadening
        box(20, 0.8, 12, water, 105, 0.2, -60);
        // Downstream broadening
        box(20, 0.8, 12, water, 155, 0.2, -60);
        // Surrounding boulders
        sph(2.5, 6, 6, darkRock, 118, 2, -56);
        sph(3, 6, 6, darkRock, 145, 2.5, -64);
        sph(1.8, 6, 6, limestone, 122, 1.5, -64);
    }

    function buildStridWood() {
        var oak = 0x2d6b2a;
        var darkOak = 0x1e4d1e;
        var trunk = 0x5C3D20;

        // Ancient oaks along gorge — trunks + canopies
        var treePositions = [
            [100, -55], [108, -52], [115, -50], [120, -48],
            [125, -45], [135, -45], [142, -47], [150, -50],
            [100, -70], [108, -73], [118, -72], [128, -70],
            [138, -68], [148, -72], [155, -70]
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var tz = treePositions[i][1];
            var th = 8 + (i % 4) * 2;
            // Trunk
            cyl(0.4, 0.6, th, 6, trunk, tx, th / 2, tz);
            // Canopy
            sph(3.5 + (i % 3), 7, 7, i % 2 === 0 ? oak : darkOak, tx, th + 3, tz);
        }

        // Undergrowth bushes
        sph(1.5, 5, 5, oak, 110, 1, -65);
        sph(1.2, 5, 5, darkOak, 125, 1, -67);
        sph(1.8, 5, 5, oak, 140, 1, -63);
    }

    function buildBardenTower() {
        var stone = 0x8B7355;
        var darkStone = 0x6B5535;

        // Main tower body — ruined
        box(10, 20, 10, stone, 80, 10, 60);
        // Ruined upper section (partial)
        box(10, 6, 5, stone, 80, 24, 60);
        // Rubble at base
        box(14, 2, 14, darkStone, 80, 1, 60);
        // Adjacent ruined wall
        box(2, 10, 20, stone, 90, 5, 60);
        box(20, 4, 2, stone, 80, 2, 70);
        // Window openings (dark recesses)
        box(2, 3, 3, 0x2a2a2a, 75, 12, 60);
        box(2, 3, 3, 0x2a2a2a, 75, 18, 60);
        // Crenellated top
        box(3, 3, 3, stone, 77, 22, 56);
        box(3, 3, 3, stone, 83, 22, 56);
        box(3, 3, 3, stone, 77, 22, 64);
        box(3, 3, 3, stone, 83, 22, 64);
        // Hillside mound
        box(30, 4, 30, 0x6B8B50, 80, 2, 60);
    }

    function buildBoltonBridge() {
        var stone = 0xC8B89A;

        // Bridge road deck
        box(30, 2, 8, stone, 50, 3, -60);
        // Arch under bridge (semi-circle suggestion with cylinders/boxes)
        cyl(4, 4, 8, 10, stone, 50, 0, -60);
        box(6, 6, 9, stone, 50, 0, -60);
        // Bridge piers
        box(3, 8, 8, stone, 42, 4, -60);
        box(3, 8, 8, stone, 58, 4, -60);
        // Parapet walls
        box(30, 2, 1, stone, 50, 5, -64);
        box(30, 2, 1, stone, 50, 5, -56);
        // Approach road
        box(20, 1, 8, 0xB8A88A, 35, 1, -60);
        box(20, 1, 8, 0xB8A88A, 65, 1, -60);
    }

    function buildCavendishPavilion() {
        var cream = 0xD4C9B0;
        var roofCol = 0x7B6B5B;
        var glass = 0x8AAABB;

        // Main pavilion building
        box(20, 7, 12, cream, -10, 3.5, -80);
        // Pitched roof
        box(22, 2, 6, roofCol, -10, 8, -83);
        box(22, 2, 6, roofCol, -10, 8, -77);
        box(22, 1, 2, roofCol, -10, 9.5, -80);
        // Veranda/porch
        box(20, 4, 4, cream, -10, 2, -91);
        // Veranda roof
        box(22, 1, 5, roofCol, -10, 4.5, -91);
        // Veranda posts
        cyl(0.3, 0.3, 4, 6, roofCol, -18, 2, -93);
        cyl(0.3, 0.3, 4, 6, roofCol, -10, 2, -93);
        cyl(0.3, 0.3, 4, 6, roofCol, -2, 2, -93);
        // Windows
        box(3, 3, 1, glass, -16, 4, -86);
        box(3, 3, 1, glass, -10, 4, -86);
        box(3, 3, 1, glass, -4, 4, -86);
        // Chimney
        box(2, 5, 2, 0x8B7B6B, -18, 11, -82);
        // Picnic area near river
        box(4, 0.5, 2, 0x8B6030, 0, 0.5, -90);
        box(2, 1.5, 0.5, 0x8B6030, -2, 1, -90);
        box(2, 1.5, 0.5, 0x8B6030, 2, 1, -90);
    }

    function buildRailwayStation() {
        var stone = 0xD3D3D3;
        var brick = 0xB87050;
        var roofCol = 0x6B6B6B;
        var rail = 0x555555;

        // Station building
        box(18, 8, 10, brick, -80, 4, 80);
        // Station roof
        box(20, 2, 6, roofCol, -80, 9, 83);
        box(20, 2, 6, roofCol, -80, 9, 77);
        // Platform
        box(40, 1, 6, stone, -75, 0.5, 88);
        // Platform canopy
        box(40, 0.5, 6, roofCol, -75, 5, 88);
        // Canopy supports
        cyl(0.2, 0.2, 5, 6, roofCol, -90, 2.5, 88);
        cyl(0.2, 0.2, 5, 6, roofCol, -80, 2.5, 88);
        cyl(0.2, 0.2, 5, 6, roofCol, -70, 2.5, 88);
        cyl(0.2, 0.2, 5, 6, roofCol, -60, 2.5, 88);

        // Rails (two parallel)
        box(80, 0.3, 0.4, rail, -70, 0.3, 92);
        box(80, 0.3, 0.4, rail, -70, 0.3, 94);
        // Sleepers/ties
        for (var i = 0; i < 8; i++) {
            box(0.4, 0.3, 4, 0x5C3D20, -100 + i * 10, 0.2, 93);
        }

        // Signal box
        box(6, 8, 6, brick, -55, 4, 82);
        box(6, 2, 7, roofCol, -55, 9, 82);
        // Signal post
        cyl(0.2, 0.2, 8, 6, rail, -60, 4, 90);
        box(3, 0.5, 0.5, 0xCC2200, -58.5, 8, 90);

        // Station name board suggestion
        box(6, 1, 0.5, 0x1B5E20, -75, 3, 86);

        // Water tower for locomotive
        cyl(2, 2.5, 8, 8, stone, -95, 4, 82);
        box(4, 1.5, 4, stone, -95, 8.5, 82);
    }

    function buildLocomotive() {
        var steel = 0x333333;
        var red = 0xCC2200;
        var brass = 0xB8860B;
        var wheel = 0x222222;
        var smoke = 0x888888;

        // Locomotive base/footplate
        box(14, 1.5, 4, steel, -78, 1, 93);
        // Main boiler — cylinder
        cyl(1.8, 1.8, 10, 12, red, -78, 3.8, 93);
        // Boiler orientation (rotated in z)
        // Firebox at rear
        box(4, 3.5, 4, steel, -84, 3, 93);
        // Smokebox at front
        box(3, 3.5, 4, steel, -72, 3, 93);
        // Chimney
        cyl(0.5, 0.7, 3, 8, steel, -71, 7, 93);
        cone(0.8, 0.6, 8, smoke, -71, 9, 93);
        // Dome on boiler
        sph(1, 7, 7, brass, -77, 5.8, 93);
        // Safety valve dome
        cyl(0.5, 0.5, 1, 8, brass, -79, 6, 93);

        // Driving wheels
        cyl(1.4, 1.4, 0.5, 12, wheel, -76, 1.5, 91);
        cyl(1.4, 1.4, 0.5, 12, wheel, -80, 1.5, 91);
        cyl(1.4, 1.4, 0.5, 12, wheel, -76, 1.5, 95);
        cyl(1.4, 1.4, 0.5, 12, wheel, -80, 1.5, 95);
        // Small front wheels
        cyl(0.9, 0.9, 0.5, 10, wheel, -72, 1.5, 91);
        cyl(0.9, 0.9, 0.5, 10, wheel, -72, 1.5, 95);
        // Tender behind locomotive
        box(8, 3, 4, steel, -87, 2, 93);
        box(8, 1.5, 4.5, 0x111111, -87, 4, 93);
        // Tender wheels
        cyl(0.9, 0.9, 0.5, 10, wheel, -85, 1.5, 91);
        cyl(0.9, 0.9, 0.5, 10, wheel, -89, 1.5, 91);
        cyl(0.9, 0.9, 0.5, 10, wheel, -85, 1.5, 95);
        cyl(0.9, 0.9, 0.5, 10, wheel, -89, 1.5, 95);

        // Cab windows
        box(1, 2, 1, 0x6699AA, -83, 4.5, 91);
        box(1, 2, 1, 0x6699AA, -83, 4.5, 95);
    }

    function buildDalesScenery() {
        var hillGreen = 0x3d6b30;
        var moorland = 0x6B4E71;
        var heather = 0x8B4F8B;
        var limestone = 0xC8C0A8;
        var gritstone = 0x9B8B70;

        // Rolling limestone hills — large box forms
        box(80, 18, 60, hillGreen, 100, 9, 40);
        box(60, 14, 50, hillGreen, -120, 7, 50);
        box(50, 22, 50, hillGreen, 160, 11, 20);
        box(70, 10, 40, hillGreen, -100, 5, -90);

        // Purple heather moorland on higher ground
        box(60, 6, 50, moorland, 120, 22, 40);
        box(50, 4, 40, heather, -110, 17, 55);
        box(40, 8, 35, moorland, 170, 22, 25);

        // Limestone pavement outcrops (clints and grykes)
        box(20, 1.5, 15, limestone, 90, 15, 30);
        box(15, 2, 12, limestone, 110, 19, 35);
        box(18, 1.2, 10, limestone, -115, 12, 48);

        // Dry stone walls criss-crossing fields
        box(50, 1.5, 0.5, gritstone, -40, 1, 25);
        box(0.5, 1.5, 40, gritstone, -65, 1, 5);
        box(50, 1.5, 0.5, gritstone, 30, 1, 30);
        box(0.5, 1.5, 50, gritstone, 5, 1, 55);
        box(40, 1.5, 0.5, gritstone, 60, 1, 10);
        box(0.5, 1.5, 30, gritstone, 40, 1, -30);

        // Isolated limestone erratics / boulders on moor
        sph(3, 7, 7, limestone, 140, 22, 38);
        sph(2, 7, 7, limestone, 155, 20, 42);
        sph(2.5, 7, 7, gritstone, -105, 14, 52);

        // Moorland sheep tracks (pale worn paths)
        box(60, 0.3, 1.2, 0xD4CEB8, 60, 14, 36);
        box(1.2, 0.3, 40, 0xD4CEB8, 90, 18, 28);

        // Distant fell / skyline ridge
        box(200, 30, 20, 0x6B8B6B, 0, 15, 120);
        box(150, 25, 20, 0x5B7B5B, 80, 12, 140);
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
