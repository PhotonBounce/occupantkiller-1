window.TyroneSperrins = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 19280;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return mesh;
    }

    function makeSphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 10, 8);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return mesh;
    }

    function makeCone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return mesh;
    }

    function build() {
        buildMoorlandBase();
        buildSperrinMountains();
        buildHeatherMoorland();
        buildBeaghmore();
        buildCreagan();
        buildGlenellyValley();
        buildUlsterAmericanFolkPark();
        buildGoldPanningRiver();
        buildTyroneFarmsteads();
        buildStrabane();
    }

    // --- MOORLAND BASE ---
    function buildMoorlandBase() {
        // Wide green moorland floor
        addMesh(makeBox(2400, 20, 1800, 0x4A7C59, 0, -10, 0));
        // Secondary moorland layer slightly raised
        addMesh(makeBox(1200, 12, 900, 0x3D6B4A, 80, -4, 60));
    }

    // --- SPERRIN MOUNTAIN RANGE ---
    function buildSperrinMountains() {
        // Sawel peak — highest point (725m) large central mountain
        addMesh(makeBox(300, 320, 280, 0x4A7C59, 0, 160, -200));
        addMesh(makeSphere(160, 0x5A8C69, 0, 310, -200));
        // Sawel secondary ridge
        addMesh(makeBox(400, 200, 150, 0x3D6B4A, -80, 100, -160));

        // Mullaghclogha peak — second highest
        addMesh(makeBox(260, 280, 240, 0x4A7C59, 280, 140, -180));
        addMesh(makeSphere(140, 0x5A8C69, 280, 270, -180));

        // Meenard Mountain — western flank
        addMesh(makeBox(200, 200, 220, 0x4A7C59, -320, 100, -140));
        addMesh(makeSphere(110, 0x5A8C69, -320, 190, -140));

        // Carnanelly ridge to the east
        addMesh(makeBox(350, 160, 180, 0x4A7C59, 450, 80, -160));
        addMesh(makeSphere(90, 0x5A8C69, 450, 150, -160));

        // Long sweeping southern ridge — BoxGeometry spine
        addMesh(makeBox(900, 120, 120, 0x3D6B4A, 100, 60, -120));

        // Northern moorland swell
        addMesh(makeBox(600, 80, 200, 0x4A7C59, -100, 40, 200));
        addMesh(makeSphere(80, 0x5A8C69, -100, 80, 200));

        // Rocky outcrops — small box clusters on ridgelines
        addMesh(makeBox(30, 40, 25, 0x6B6B5A, 20, 325, -198));
        addMesh(makeBox(20, 30, 20, 0x6B6B5A, -15, 320, -205));
        addMesh(makeBox(25, 35, 22, 0x6B6B5A, 35, 315, -192));
        addMesh(makeBox(28, 38, 26, 0x6B6B5A, 295, 280, -182));
        addMesh(makeBox(22, 28, 18, 0x6B6B5A, 268, 272, -175));

        // Transition foothills — medium spheres
        addMesh(makeSphere(70, 0x4A7C59, 160, 50, -80));
        addMesh(makeSphere(60, 0x4A7C59, -200, 45, -90));
        addMesh(makeSphere(55, 0x4A7C59, 380, 40, -70));
        addMesh(makeSphere(65, 0x3D6B4A, -350, 55, -100));
    }

    // --- HEATHER MOORLAND ---
    function buildHeatherMoorland() {
        // Purple heather patches scattered on hillsides — SphereGeometry clusters
        addMesh(makeSphere(45, 0x8B1A8B, -60, 185, -195));
        addMesh(makeSphere(38, 0x9B2A9B, -90, 170, -185));
        addMesh(makeSphere(42, 0x7A0A7A, 60, 200, -210));
        addMesh(makeSphere(36, 0x8B1A8B, 120, 170, -190));
        addMesh(makeSphere(50, 0x8B1A8B, 200, 150, -165));
        addMesh(makeSphere(32, 0x9B2A9B, 240, 160, -175));
        addMesh(makeSphere(40, 0x7A0A7A, -200, 140, -150));
        addMesh(makeSphere(35, 0x8B1A8B, -260, 145, -155));
        // Heather on northern moorland
        addMesh(makeSphere(55, 0x8B1A8B, -80, 70, 180));
        addMesh(makeSphere(48, 0x9B2A9B, 40, 65, 210));
        addMesh(makeSphere(44, 0x7A0A7A, 160, 60, 195));
        // Low heather ground cover patches
        addMesh(makeSphere(60, 0x8B1A8B, -400, 30, -50));
        addMesh(makeSphere(52, 0x9B2A9B, 500, 28, -30));
    }

    // --- BEAGHMORE STONE CIRCLES ---
    function buildBeaghmore() {
        var bx = -500;
        var bz = 150;
        var by = 22;

        // Seven stone circles — each ring of small BoxGeometry stones
        // Circle A
        buildStoneCircle(bx, by, bz, 35, 7);
        // Circle B
        buildStoneCircle(bx + 80, by, bz, 30, 7);
        // Circle C
        buildStoneCircle(bx + 10, by, bz + 80, 28, 6);
        // Circle D
        buildStoneCircle(bx + 90, by, bz + 80, 32, 6);
        // Circle E
        buildStoneCircle(bx - 60, by, bz + 60, 25, 5);
        // Circle F
        buildStoneCircle(bx + 160, by, bz + 40, 28, 6);
        // Circle G
        buildStoneCircle(bx + 50, by, bz + 160, 30, 6);

        // Stone rows — lines of small stones between circles
        buildStoneRow(bx + 35, by, bz, bx + 45, by, bz + 80, 8);
        buildStoneRow(bx + 115, by, bz + 5, bx + 155, by, bz + 40, 5);

        // Cairn mounds — CylinderGeometry flat mounds
        addMesh(makeCylinder(18, 22, 8, 0x8B7355, bx + 180, by + 4, bz + 120));
        addMesh(makeCylinder(14, 18, 6, 0x9B8365, bx - 80, by + 3, bz + 140));
        addMesh(makeCylinder(20, 25, 10, 0x8B7355, bx + 40, by + 5, bz + 200));
    }

    function buildStoneCircle(cx, cy, cz, radius, count) {
        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var sx = cx + Math.cos(angle) * radius - OX;
            var sz = cz + Math.sin(angle) * radius - OZ;
            var sh = 5 + Math.random() * 4;
            addMesh(makeBox(4, sh, 4, 0x8B7355, sx, cy + sh * 0.5, sz));
        }
    }

    function buildStoneRow(x1, y1, z1, x2, y2, z2, count) {
        for (var i = 0; i < count; i++) {
            var t = i / (count - 1);
            var sx = x1 + (x2 - x1) * t - OX;
            var sz = z1 + (z2 - z1) * t - OZ;
            addMesh(makeBox(3, 6, 3, 0x8B7355, sx, y1 + 3, sz));
        }
    }

    // --- AN CREAGAN VISITOR CENTRE ---
    function buildCreagan() {
        var cx = 350;
        var cz = 300;
        var cy = 22;

        // Main visitor centre building — modern flat-roofed
        addMesh(makeBox(80, 18, 50, 0xF5F5F5, cx, cy + 9, cz));
        // Roof overhang
        addMesh(makeBox(88, 3, 58, 0xDDDDDD, cx, cy + 18, cz));
        // Glazed entrance section
        addMesh(makeBox(20, 18, 8, 0x87CEEB, cx, cy + 9, cz - 29));
        // Side annex
        addMesh(makeBox(30, 14, 25, 0xF0F0F0, cx + 55, cy + 7, cz));
        // Car park area — flat dark surface
        addMesh(makeBox(100, 2, 60, 0x555555, cx + 80, cy + 1, cz));
        // Outdoor reconstruction area — ring of standing stones
        buildStoneCircle(OX + cx - 80, cy + 22, OZ + cz + 60, 20, 8);
        // Small interpretive building
        addMesh(makeBox(15, 10, 12, 0xF5F5F5, cx - 70, cy + 5, cz + 50));
        addMesh(makeCone(10, 8, 0xCD853F, cx - 70, cy + 14, cz + 50));
        // Flagpole
        addMesh(makeCylinder(0.5, 0.5, 25, 0xAAAAAA, cx + 50, cy + 12, cz - 30));
    }

    // --- GLENELLY VALLEY ---
    function buildGlenellyValley() {
        var vx = 0;
        var vz = 350;

        // Valley floor — green farmland
        addMesh(makeBox(800, 10, 300, 0x228B22, vx, 8, vz));

        // Hedgerows dividing fields — dark brown BoxGeometry lines
        addMesh(makeBox(200, 8, 4, 0x5C3317, vx - 150, 14, vz - 80));
        addMesh(makeBox(4, 8, 200, 0x5C3317, vx - 50, 14, vz + 20));
        addMesh(makeBox(200, 8, 4, 0x5C3317, vx + 100, 14, vz + 80));
        addMesh(makeBox(4, 8, 180, 0x5C3317, vx + 200, 14, vz - 50));
        addMesh(makeBox(150, 8, 4, 0x5C3317, vx - 300, 14, vz + 60));

        // White farmhouses in the valley
        addMesh(makeBox(18, 10, 12, 0xFFFFF0, vx - 200, 18, vz - 60));
        addMesh(makeCone(12, 8, 0x8B4513, vx - 200, 28, vz - 60));

        addMesh(makeBox(16, 10, 12, 0xFFFFF0, vx + 80, 18, vz + 50));
        addMesh(makeCone(11, 8, 0x8B4513, vx + 80, 28, vz + 50));

        addMesh(makeBox(20, 10, 14, 0xFFFFF0, vx + 300, 18, vz - 30));
        addMesh(makeCone(13, 8, 0x8B4513, vx + 300, 28, vz - 30));

        // Valley river — blue-green BoxGeometry strip
        addMesh(makeBox(700, 3, 18, 0x2E8B8B, vx - 50, 12, vz));
    }

    // --- ULSTER AMERICAN FOLK PARK ---
    function buildUlsterAmericanFolkPark() {
        var px = -320;
        var pz = 420;
        var py = 18;

        // 18th century Ulster thatched cottage 1
        addMesh(makeBox(22, 10, 12, 0xFFFFF0, px, py + 5, pz));
        addMesh(makeBox(26, 5, 16, 0xC4A35A, px, py + 12, pz)); // thatched roof
        // Cottage 2
        addMesh(makeBox(18, 10, 10, 0xFFFFF0, px + 40, py + 5, pz + 10));
        addMesh(makeBox(22, 5, 14, 0xC4A35A, px + 40, py + 12, pz + 10));
        // Cottage 3
        addMesh(makeBox(20, 10, 12, 0xFFFFF0, px + 80, py + 5, pz - 5));
        addMesh(makeBox(24, 5, 16, 0xC4A35A, px + 80, py + 12, pz - 5));

        // American frontier log cabin 1
        addMesh(makeBox(24, 12, 14, 0x8B5A2B, px + 130, py + 6, pz + 20));
        addMesh(makeBox(28, 6, 18, 0x6B4020, px + 130, py + 15, pz + 20));
        // Log cabin 2
        addMesh(makeBox(20, 12, 14, 0x8B5A2B, px + 170, py + 6, pz - 10));
        addMesh(makeBox(24, 6, 18, 0x6B4020, px + 170, py + 15, pz - 10));

        // Emigrant ship replica — box hull + masts
        // Hull
        addMesh(makeBox(60, 14, 18, 0x4A2F1A, px - 30, py + 7, pz + 100));
        // Deck
        addMesh(makeBox(58, 3, 16, 0x6B4A2A, px - 30, py + 15, pz + 100));
        // Main mast
        addMesh(makeCylinder(1, 1, 50, 0x4A3010, px - 30, py + 40, pz + 100));
        // Foremast
        addMesh(makeCylinder(0.8, 0.8, 40, 0x4A3010, px - 50, py + 35, pz + 100));
        // Mizzen mast
        addMesh(makeCylinder(0.8, 0.8, 35, 0x4A3010, px - 10, py + 32, pz + 100));
        // Bowsprit
        addMesh(makeCylinder(0.6, 0.6, 25, 0x4A3010, px - 63, py + 28, pz + 100));

        // Site boundary wall
        addMesh(makeBox(260, 6, 4, 0x9B8B7B, px + 60, py + 3, pz - 40));
        addMesh(makeBox(4, 6, 160, 0x9B8B7B, px - 70, py + 3, pz + 40));

        // Museum visitor centre building
        addMesh(makeBox(50, 14, 30, 0xE8E8D0, px - 60, py + 7, pz - 10));
        addMesh(makeBox(54, 4, 34, 0xCCCCBB, px - 60, py + 15, pz - 10));
    }

    // --- GOLD PANNING RIVER SITE ---
    function buildGoldPanningRiver() {
        var rx = 600;
        var rz = 100;
        var ry = 16;

        // River channel
        addMesh(makeBox(300, 4, 20, 0x2E5FA0, rx, ry + 2, rz));
        // Golden sand bars — DAA520
        addMesh(makeBox(60, 5, 14, 0xDAA520, rx - 80, ry + 3, rz - 2));
        addMesh(makeBox(40, 5, 10, 0xDAA520, rx + 20, ry + 3, rz + 1));
        addMesh(makeBox(50, 5, 12, 0xDAA520, rx + 100, ry + 3, rz - 1));
        // Gravel banks
        addMesh(makeBox(300, 4, 10, 0xB8A898, rx, ry + 2, rz + 15));
        addMesh(makeBox(300, 4, 10, 0xB8A898, rx, ry + 2, rz - 15));
        // Small interpretive hut at site
        addMesh(makeBox(12, 8, 10, 0xC4A35A, rx - 120, ry + 4, rz - 25));
        addMesh(makeCone(8, 6, 0x8B4513, rx - 120, ry + 11, rz - 25));
        // Panning equipment — small box shapes
        addMesh(makeBox(3, 1, 3, 0x8B4513, rx - 85, ry + 5, rz - 5));
        addMesh(makeBox(3, 1, 3, 0x8B4513, rx + 25, ry + 5, rz + 2));
    }

    // --- TYRONE FARMSTEADS ---
    function buildTyroneFarmsteads() {
        // Farmstead cluster 1 — east side
        var f1x = 700;
        var f1z = -80;
        var f1y = 20;

        addMesh(makeBox(22, 10, 14, 0xFFFFF0, f1x, f1y + 5, f1z));
        addMesh(makeCone(14, 8, 0x8B4513, f1x, f1y + 14, f1z));
        addMesh(makeBox(30, 8, 14, 0x8B4513, f1x + 35, f1y + 4, f1z));
        addMesh(makeBox(34, 3, 18, 0x6B3010, f1x + 35, f1y + 9, f1z));
        // Stone boundary walls
        addMesh(makeBox(70, 5, 3, 0x8B7355, f1x + 10, f1y + 2, f1z + 20));
        addMesh(makeBox(3, 5, 50, 0x8B7355, f1x - 15, f1y + 2, f1z + 5));
        addMesh(makeBox(3, 5, 50, 0x8B7355, f1x + 60, f1y + 2, f1z + 5));

        // Farmstead cluster 2 — north side
        var f2x = -600;
        var f2z = 300;
        var f2y = 20;

        addMesh(makeBox(20, 10, 12, 0xFFFFF0, f2x, f2y + 5, f2z));
        addMesh(makeCone(13, 8, 0x8B4513, f2x, f2y + 14, f2z));
        addMesh(makeBox(28, 8, 12, 0x8B4513, f2x - 32, f2y + 4, f2z));
        addMesh(makeBox(32, 3, 16, 0x6B3010, f2x - 32, f2y + 9, f2z));
        addMesh(makeBox(60, 5, 3, 0x8B7355, f2x - 15, f2y + 2, f2z - 18));
        addMesh(makeBox(3, 5, 45, 0x8B7355, f2x + 25, f2y + 2, f2z - 3));

        // Farmstead cluster 3 — south moorland edge
        var f3x = 180;
        var f3z = 480;
        var f3y = 18;

        addMesh(makeBox(18, 10, 12, 0xFFFFF0, f3x, f3y + 5, f3z));
        addMesh(makeCone(12, 8, 0x8B4513, f3x, f3y + 14, f3z));
        addMesh(makeBox(26, 8, 12, 0x8B4513, f3x + 30, f3y + 4, f3z));
        addMesh(makeBox(30, 3, 16, 0x6B3010, f3x + 30, f3y + 9, f3z));
        addMesh(makeBox(3, 5, 40, 0x8B7355, f3x - 12, f3y + 2, f3z + 5));
    }

    // --- STRABANE TOWN ---
    function buildStrabane() {
        var tx = -700;
        var tz = 500;
        var ty = 16;

        // Main street buildings — CD5C5C brick terrace
        addMesh(makeBox(200, 20, 18, 0xCD5C5C, tx, ty + 10, tz));
        // Taller civic building
        addMesh(makeBox(30, 30, 20, 0xCD5C5C, tx - 60, ty + 15, tz));
        // Church spire
        addMesh(makeBox(14, 24, 14, 0xDDDDDD, tx + 80, ty + 12, tz));
        addMesh(makeCone(8, 20, 0x888888, tx + 80, ty + 34, tz));
        // River Mourne — runs along town
        addMesh(makeBox(400, 3, 22, 0x2E6B9A, tx, ty + 1, tz + 40));
        // Bridge over river
        addMesh(makeBox(24, 5, 22, 0x9B8B7B, tx - 10, ty + 5, tz + 40));
        // Side street terrace
        addMesh(makeBox(18, 16, 80, 0xCD5C5C, tx + 110, ty + 8, tz + 10));
        // Market square area
        addMesh(makeBox(50, 2, 50, 0x666666, tx - 80, ty + 1, tz - 20));
        // Small commercial building
        addMesh(makeBox(20, 14, 16, 0xB85050, tx - 130, ty + 7, tz));
        addMesh(makeBox(20, 14, 16, 0xB85050, tx - 160, ty + 7, tz));
    }

    function update(delta) {
        // Static environment, no animation needed
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
