window.DartmoorPrison = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14120;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function buildGround() {
        // Main moorland ground - heather colour (purple-brown)
        makeBox(2000, 2, 2000, 0x6b4c6e, X_OFFSET, -1, 0);

        // Boggy patches - dark brown
        makeBox(120, 0.5, 80, 0x3b2012, X_OFFSET + 400, 0.2, 200);
        makeBox(90, 0.5, 60, 0x3b2012, X_OFFSET + 350, 0.2, 280);
        makeBox(150, 0.5, 100, 0x3b2012, X_OFFSET - 300, 0.2, 400);
        makeBox(80, 0.5, 70, 0x3b2012, X_OFFSET + 600, 0.2, -150);
        makeBox(110, 0.5, 90, 0x2e1a0a, X_OFFSET - 500, 0.2, -300);

        // Bracken areas - olive green
        makeBox(200, 0.5, 150, 0x7a8c3a, X_OFFSET + 200, 0.2, -400);
        makeBox(180, 0.5, 120, 0x6e7c30, X_OFFSET - 400, 0.2, -200);
        makeBox(160, 0.5, 140, 0x7a8c3a, X_OFFSET + 700, 0.2, 300);
        makeBox(140, 0.5, 110, 0x6e7c30, X_OFFSET - 600, 0.2, 500);
    }

    function buildPrisonWall() {
        var px = X_OFFSET;
        var pz = 0;
        var wallColor = 0x7d7167; // granite grey
        var wallH = 12;
        var wallW = 4;

        // North wall
        makeBox(200, wallH, wallW, wallColor, px, wallH / 2, pz - 100);
        // South wall
        makeBox(200, wallH, wallW, wallColor, px, wallH / 2, pz + 100);
        // West wall
        makeBox(wallW, wallH, 200, wallColor, px - 100, wallH / 2, pz);
        // East wall
        makeBox(wallW, wallH, 200, wallColor, px + 100, wallH / 2, pz);

        // Watchtowers - NW, NE, SW, SE corners
        buildWatchtower(px - 100, pz - 100, wallColor);
        buildWatchtower(px + 100, pz - 100, wallColor);
        buildWatchtower(px - 100, pz + 100, wallColor);
        buildWatchtower(px + 100, pz + 100, wallColor);
    }

    function buildWatchtower(x, z, wallColor) {
        // Tower base
        makeBox(14, 18, 14, wallColor, x, 9, z);
        // Tower parapet
        makeBox(16, 3, 16, 0x6a6058, x, 19.5, z);
        // Tower roof cone
        makeCone(7, 6, 4, 0x4a3c30, x, 24, z);
        // Merlon teeth on parapet
        makeBox(3, 2, 2, wallColor, x - 5, 22, z - 7);
        makeBox(3, 2, 2, wallColor, x, 22, z - 7);
        makeBox(3, 2, 2, wallColor, x + 5, 22, z - 7);
        makeBox(3, 2, 2, wallColor, x - 5, 22, z + 7);
        makeBox(3, 2, 2, wallColor, x, 22, z + 7);
        makeBox(3, 2, 2, wallColor, x + 5, 22, z + 7);
    }

    function buildGatehouse() {
        var px = X_OFFSET;
        var wallColor = 0x7d7167;
        // Gatehouse body - south wall centre
        makeBox(30, 16, 14, 0x6e6460, px, 8, 107);
        // Gate arch posts
        makeBox(4, 14, 4, wallColor, px - 6, 7, 107);
        makeBox(4, 14, 4, wallColor, px + 6, 7, 107);
        // Portcullis arch lintel
        makeBox(16, 3, 4, 0x5a5048, px, 15, 107);
        // Portcullis bars (vertical)
        makeBox(1, 10, 1, 0x3a3028, px - 4, 7, 107);
        makeBox(1, 10, 1, 0x3a3028, px - 2, 7, 107);
        makeBox(1, 10, 1, 0x3a3028, px, 7, 107);
        makeBox(1, 10, 1, 0x3a3028, px + 2, 7, 107);
        makeBox(1, 10, 1, 0x3a3028, px + 4, 7, 107);
        // Portcullis bars (horizontal)
        makeBox(12, 1, 1, 0x3a3028, px, 4, 107);
        makeBox(12, 1, 1, 0x3a3028, px, 8, 107);
        makeBox(12, 1, 1, 0x3a3028, px, 12, 107);
        // Gatehouse battlements
        makeBox(3, 3, 2, wallColor, px - 10, 17, 107);
        makeBox(3, 3, 2, wallColor, px - 5, 17, 107);
        makeBox(3, 3, 2, wallColor, px, 17, 107);
        makeBox(3, 3, 2, wallColor, px + 5, 17, 107);
        makeBox(3, 3, 2, wallColor, px + 10, 17, 107);
    }

    function buildCellBlocks() {
        var px = X_OFFSET;
        var blockColor = 0x857d74;
        var roofColor = 0x5a5248;

        // Cell block A - main long block
        makeBox(80, 14, 22, blockColor, px - 10, 7, -40);
        makeBox(82, 2, 24, roofColor, px - 10, 14.5, -40);

        // Cell block B
        makeBox(80, 14, 22, blockColor, px - 10, 7, 20);
        makeBox(82, 2, 24, roofColor, px - 10, 14.5, 20);

        // Cell block C - shorter
        makeBox(50, 14, 22, blockColor, px + 30, 7, -10);
        makeBox(52, 2, 24, roofColor, px + 30, 14.5, -10);

        // Cell windows (small dark squares)
        var i;
        for (i = 0; i < 8; i++) {
            makeBox(2, 3, 0.5, 0x1a1a1a, px - 50 + i * 10, 8, -29);
            makeBox(2, 3, 0.5, 0x1a1a1a, px - 50 + i * 10, 8, -51);
            makeBox(2, 3, 0.5, 0x1a1a1a, px - 50 + i * 10, 8, 9);
            makeBox(2, 3, 0.5, 0x1a1a1a, px - 50 + i * 10, 8, 31);
        }
    }

    function buildGovernorsHouse() {
        var px = X_OFFSET;
        // Main house body
        makeBox(28, 12, 20, 0x8a7e72, px + 60, 6, -60);
        // Roof
        makeBox(30, 4, 22, 0x4a3e34, px + 60, 13, -60);
        // Chimney stacks
        makeCylinder(1.2, 1.2, 6, 6, 0x6a5e54, px + 54, 18, -58);
        makeCylinder(1.2, 1.2, 6, 6, 0x6a5e54, px + 66, 18, -58);
        // Front door
        makeBox(3, 5, 0.5, 0x3a2a1a, px + 60, 2.5, -50);
        // Windows
        makeBox(4, 4, 0.5, 0x1a2a3a, px + 52, 7, -50);
        makeBox(4, 4, 0.5, 0x1a2a3a, px + 68, 7, -50);
        makeBox(4, 4, 0.5, 0x1a2a3a, px + 52, 7, -70);
        makeBox(4, 4, 0.5, 0x1a2a3a, px + 68, 7, -70);
    }

    function buildChapel() {
        var px = X_OFFSET;
        // Chapel nave
        makeBox(24, 16, 40, 0x8a8070, px - 70, 8, -30);
        // Pitched roof
        makeBox(26, 4, 42, 0x5a5248, px - 70, 17, -30);
        // Bell tower
        makeBox(8, 24, 8, 0x7d7268, px - 70, 12, -50);
        // Tower roof
        makeCone(5, 8, 4, 0x4a3e34, px - 70, 28, -50);
        // Gothic windows (dark pointed arches approximated with boxes)
        makeBox(3, 8, 0.5, 0x1a1a2a, px - 70, 10, -10);
        makeBox(3, 8, 0.5, 0x1a1a2a, px - 70, 10, -30);
        makeBox(3, 8, 0.5, 0x1a1a2a, px - 70, 10, -50);
        // Chapel door
        makeBox(4, 6, 0.5, 0x3a2a1a, px - 70, 3, -11);
    }

    function buildParadeGround() {
        var px = X_OFFSET;
        // Paved parade ground (lighter grey)
        makeBox(100, 0.4, 60, 0x9a9288, px, 0.2, -15);
        // Flagpole
        makeCylinder(0.3, 0.3, 18, 6, 0xc8b89a, px + 20, 9, -15);
        // Flag (small box)
        makeBox(5, 3, 0.2, 0xcc0000, px + 23, 18, -15);
    }

    function buildExerciseYard() {
        var px = X_OFFSET;
        // Exercise yard surface
        makeBox(60, 0.3, 50, 0x8a8278, px + 20, 0.15, 50);
        // Low dividing walls
        makeBox(60, 3, 2, 0x7a7068, px + 20, 1.5, 30);
    }

    function buildPrison() {
        buildPrisonWall();
        buildGatehouse();
        buildCellBlocks();
        buildGovernorsHouse();
        buildChapel();
        buildParadeGround();
        buildExerciseYard();
    }

    function buildHaytor() {
        // Haytor Rocks - iconic stacked granite blocks east of prison
        var hx = X_OFFSET + 500;
        var hz = -300;
        var graniteColor = 0x9a9288;
        // Main tor stack - lower base
        makeBox(30, 8, 20, graniteColor, hx, 4, hz);
        // Second layer
        makeBox(24, 7, 16, 0x8a8478, hx + 1, 11.5, hz - 1);
        // Third layer
        makeBox(18, 6, 12, 0x9e9890, hx + 2, 18, hz);
        // Top capstone
        makeBox(12, 5, 8, graniteColor, hx - 1, 23.5, hz + 1);
        // Secondary stack
        makeBox(16, 6, 12, graniteColor, hx + 20, 3, hz + 8);
        makeBox(12, 5, 9, 0x8a8478, hx + 20, 8.5, hz + 8);
        makeBox(8, 4, 6, 0x9e9890, hx + 21, 13, hz + 7);
    }

    function buildYesTor() {
        var yx = X_OFFSET - 600;
        var yz = -500;
        var graniteColor = 0x9e9890;
        // Prominent peak
        makeBox(40, 10, 35, graniteColor, yx, 5, yz);
        makeBox(30, 8, 25, 0x8e8880, yx, 14, yz);
        makeBox(20, 8, 18, graniteColor, yx + 2, 22, yz - 1);
        makeBox(14, 6, 12, 0xaeaaa0, yx, 29, yz);
        // Craggy outcrops nearby
        makeBox(12, 5, 10, graniteColor, yx + 25, 2.5, yz + 15);
        makeBox(10, 4, 8, 0x8e8880, yx + 25, 7, yz + 15);
        makeBox(16, 6, 12, graniteColor, yx - 20, 3, yz - 18);
        makeBox(10, 5, 8, 0xaeaaa0, yx - 20, 8.5, yz - 18);
    }

    function buildGreatMisTor() {
        var mx = X_OFFSET - 200;
        var mz = 600;
        var graniteColor = 0x928e84;
        // Great Mis Tor stack
        makeBox(35, 9, 28, graniteColor, mx, 4.5, mz);
        makeBox(26, 7, 20, 0x82807a, mx - 1, 13, mz + 1);
        makeBox(18, 7, 14, graniteColor, mx + 1, 20.5, mz);
        makeBox(12, 5, 10, 0xa2a09a, mx, 27, mz - 1);
        // Surrounding boulders
        makeBox(8, 4, 6, graniteColor, mx + 22, 2, mz + 12);
        makeBox(6, 3, 5, 0x82807a, mx + 30, 1.5, mz - 10);
        makeBox(10, 4, 8, graniteColor, mx - 18, 2, mz + 20);
        makeBox(7, 3, 6, 0xa2a09a, mx - 25, 1.5, mz - 15);
    }

    function buildTors() {
        buildHaytor();
        buildYesTor();
        buildGreatMisTor();
    }

    function buildPony(x, z) {
        var bodyColor = 0x6b5a48; // dark bay
        var headColor = 0x5e4e3c;
        // Body - stocky cylinder
        makeCylinder(2, 2, 6, 8, bodyColor, x, 3, z);
        // Head - sphere
        makeSphere(1.5, 6, 6, headColor, x + 4, 5, z);
        // Legs - thin cylinders
        makeCylinder(0.4, 0.4, 3, 6, 0x4a3c2c, x - 1.5, 1.5, z - 1);
        makeCylinder(0.4, 0.4, 3, 6, 0x4a3c2c, x + 1.5, 1.5, z - 1);
        makeCylinder(0.4, 0.4, 3, 6, 0x4a3c2c, x - 1.5, 1.5, z + 1);
        makeCylinder(0.4, 0.4, 3, 6, 0x4a3c2c, x + 1.5, 1.5, z + 1);
        // Tail
        makeCylinder(0.5, 0.3, 3, 6, 0x3a2c1c, x - 4, 4, z);
        // Mane
        makeBox(1, 2, 1, 0x3a2c1c, x + 2, 6.5, z);
    }

    function buildWildPonies() {
        // Scattered herd across the moorland
        buildPony(X_OFFSET + 300, 350);
        buildPony(X_OFFSET + 320, 370);
        buildPony(X_OFFSET + 280, 390);
        buildPony(X_OFFSET - 350, 450);
        buildPony(X_OFFSET - 370, 470);
        buildPony(X_OFFSET + 550, -200);
        buildPony(X_OFFSET + 580, -220);
        buildPony(X_OFFSET + 560, -180);
        buildPony(X_OFFSET - 150, 700);
        buildPony(X_OFFSET - 170, 720);
    }

    function buildGrimspound() {
        // Bronze Age walled settlement - circular enclosure
        var gx = X_OFFSET + 350;
        var gz = -600;
        var wallColor = 0x7a7268;
        var wallH = 3;
        var wallW = 2.5;
        var r = 40;
        var i;
        var segments = 16;
        var angleStep = (Math.PI * 2) / segments;

        // Build circular wall from box segments (approximated as polygon)
        for (i = 0; i < segments; i++) {
            // Leave a gap for entrance (segment 0)
            if (i === 0) {
                continue;
            }
            var angle = i * angleStep;
            var wx = gx + Math.cos(angle) * r;
            var wz = gz + Math.sin(angle) * r;
            var seg = new THREE.BoxGeometry(wallW, wallH, 8);
            var mat = new THREE.MeshLambertMaterial({ color: wallColor });
            var mesh = new THREE.Mesh(seg, mat);
            mesh.position.set(wx, wallH / 2, wz);
            mesh.rotation.y = -angle;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Hut circles inside - small ring walls
        buildHutCircle(gx + 10, gz + 5, 6);
        buildHutCircle(gx - 8, gz - 10, 5);
        buildHutCircle(gx + 15, gz - 12, 5);
        buildHutCircle(gx - 15, gz + 8, 6);
        buildHutCircle(gx + 2, gz - 20, 4);
        buildHutCircle(gx - 5, gz + 18, 4);

        // Entrance stones
        makeBox(wallW, wallH, 3, wallColor, gx + r + 2, wallH / 2, gz + 5);
        makeBox(wallW, wallH, 3, wallColor, gx + r + 2, wallH / 2, gz - 5);
    }

    function buildHutCircle(cx, cz, radius) {
        var hutColor = 0x6a6258;
        var hutH = 2;
        var segments = 10;
        var i;
        var angleStep = (Math.PI * 2) / segments;

        for (i = 0; i < segments; i++) {
            var angle = i * angleStep;
            var wx = cx + Math.cos(angle) * radius;
            var wz = cz + Math.sin(angle) * radius;
            var seg = new THREE.BoxGeometry(1.5, hutH, 3);
            var mat = new THREE.MeshLambertMaterial({ color: hutColor });
            var mesh = new THREE.Mesh(seg, mat);
            mesh.position.set(wx, hutH / 2, wz);
            mesh.rotation.y = -angle;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildMerrivaleStoneRows() {
        // Merrivale stone rows - multiple parallel rows of upright stones
        var sx = X_OFFSET - 400;
        var sz = 200;
        var stoneColor = 0x8a8278;
        var i;
        var numStones = 20;

        // Row 1 - northern row
        for (i = 0; i < numStones; i++) {
            makeBox(1.5, 2.5, 1, stoneColor, sx + i * 8, 1.25, sz);
        }

        // Row 2 - parallel southern row
        for (i = 0; i < numStones; i++) {
            makeBox(1.5, 2.5, 1, stoneColor, sx + i * 8, 1.25, sz + 12);
        }

        // Terminal stone (taller, at east end)
        makeBox(3, 5, 1.5, 0x7a7068, sx + numStones * 8, 2.5, sz + 6);

        // Second shorter row
        for (i = 0; i < 12; i++) {
            makeBox(1.2, 2, 0.8, stoneColor, sx + i * 7, 1, sz + 30);
        }

        // Cairn circle - ring of stones at western end
        buildCairnCircle(sx - 20, sz + 6, 12);

        // Second cairn circle
        buildCairnCircle(sx + 100, sz - 40, 8);
    }

    function buildCairnCircle(cx, cz, radius) {
        var stoneColor = 0x7e7a70;
        var i;
        var numStones = 14;
        var angleStep = (Math.PI * 2) / numStones;

        for (i = 0; i < numStones; i++) {
            var angle = i * angleStep;
            var wx = cx + Math.cos(angle) * radius;
            var wz = cz + Math.sin(angle) * radius;
            makeBox(2, 1.5, 1.5, stoneColor, wx, 0.75, wz);
        }

        // Central cairn mound
        makeSphere(3, 6, 6, 0x8a8278, cx, 1.5, cz);
    }

    function build() {
        buildGround();
        buildPrison();
        buildTors();
        buildWildPonies();
        buildGrimspound();
        buildMerrivaleStoneRows();
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
