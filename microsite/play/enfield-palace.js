window.EnfieldPalace = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12160;

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

    function buildFortyHall() {
        var bx = X_OFFSET + 0;
        var bz = -200;

        // Ground / forecourt
        makeBox(120, 1, 80, 0xC8B89A, bx, 0, bz + 20);

        // Main mansion body — 5-bay facade, red brick
        makeBox(80, 18, 30, 0x8B3A2A, bx, 9, bz);

        // Central slightly-projecting bay
        makeBox(18, 20, 4, 0x7A2E20, bx, 10, bz - 17);

        // Central pediment (triangular form via cone pair)
        makeBox(18, 2, 4, 0x6E2918, bx, 21, bz - 17);
        makeCone(9, 6, 3, 0x6E2918, bx, 26, bz - 17);

        // Roof
        makeBox(80, 4, 30, 0x5C3317, bx, 20, bz);

        // Windows — 5 bays, 2 storeys
        var bayOffsets = [-32, -16, 0, 16, 32];
        for (var b = 0; b < bayOffsets.length; b++) {
            // Ground floor windows
            makeBox(6, 5, 1, 0xADD8E6, bx + bayOffsets[b], 6, bz - 16);
            // First floor windows
            makeBox(6, 5, 1, 0xADD8E6, bx + bayOffsets[b], 14, bz - 16);
        }

        // Chimney stacks — tall, pairs
        makeCylinder(1, 1, 12, 6, 0x7A2E20, bx - 36, 26, bz);
        makeCylinder(1, 1, 12, 6, 0x7A2E20, bx - 28, 26, bz);
        makeCylinder(1, 1, 12, 6, 0x7A2E20, bx + 28, 26, bz);
        makeCylinder(1, 1, 12, 6, 0x7A2E20, bx + 36, 26, bz);

        // Chimney pots
        makeCone(1.2, 3, 6, 0x5C3317, bx - 36, 33, bz);
        makeCone(1.2, 3, 6, 0x5C3317, bx - 28, 33, bz);
        makeCone(1.2, 3, 6, 0x5C3317, bx + 28, 33, bz);
        makeCone(1.2, 3, 6, 0x5C3317, bx + 36, 33, bz);

        // Wings — flanking bays
        makeBox(20, 14, 25, 0x8B3A2A, bx - 50, 7, bz);
        makeBox(20, 14, 25, 0x8B3A2A, bx + 50, 7, bz);

        // Wing roofs
        makeBox(20, 3, 25, 0x5C3317, bx - 50, 15.5, bz);
        makeBox(20, 3, 25, 0x5C3317, bx + 50, 15.5, bz);

        // Gate piers — forecourt entrance
        makeBox(4, 8, 4, 0xC8B89A, bx - 20, 4, bz + 45);
        makeBox(4, 8, 4, 0xC8B89A, bx + 20, 4, bz + 45);
        // Pier caps
        makeSphere(3, 6, 6, 0xB0A080, bx - 20, 9, bz + 45);
        makeSphere(3, 6, 6, 0xB0A080, bx + 20, 9, bz + 45);

        // Gate piers flanking drive
        makeBox(3, 6, 3, 0xC8B89A, bx - 8, 3, bz + 55);
        makeBox(3, 6, 3, 0xC8B89A, bx + 8, 3, bz + 55);

        // Walled garden — east of hall
        makeBox(50, 5, 1, 0x8B3A2A, bx + 90, 2.5, bz - 25);
        makeBox(50, 5, 1, 0x8B3A2A, bx + 90, 2.5, bz + 25);
        makeBox(1, 5, 50, 0x8B3A2A, bx + 65, 2.5, bz);
        makeBox(1, 5, 50, 0x8B3A2A, bx + 115, 2.5, bz);

        // Garden beds inside walled garden
        makeBox(12, 0.5, 8, 0x4A7C2A, bx + 80, 0.5, bz - 10);
        makeBox(12, 0.5, 8, 0x4A7C2A, bx + 80, 0.5, bz + 10);
        makeBox(12, 0.5, 8, 0x4A7C2A, bx + 100, 0.5, bz - 10);
        makeBox(12, 0.5, 8, 0x4A7C2A, bx + 100, 0.5, bz + 10);

        // Forecourt gravel path
        makeBox(12, 0.3, 60, 0xD2B48C, bx, 0.2, bz + 20);
    }

    function buildOakTree(x, z) {
        // Trunk
        makeCylinder(1.2, 1.6, 8, 7, 0x4A2F1A, x, 4, z);
        // Canopy — layered spheres for veteran oak look
        makeSphere(7, 8, 6, 0x2D5A1B, x, 13, z);
        makeSphere(5, 7, 5, 0x3A6E22, x - 4, 12, z + 2);
        makeSphere(5, 7, 5, 0x2D5A1B, x + 3, 11, z - 3);
        makeSphere(4, 6, 5, 0x4A7C2A, x, 16, z + 1);
    }

    function buildEnfieldChase() {
        // Meadow ground — large open expanse
        makeBox(400, 0.5, 300, 0x7AB648, X_OFFSET + 100, -0.3, 100);

        // Veteran oak trees — scattered across the chase
        buildOakTree(X_OFFSET - 80, 50);
        buildOakTree(X_OFFSET - 140, 120);
        buildOakTree(X_OFFSET + 60, 180);
        buildOakTree(X_OFFSET + 160, 80);
        buildOakTree(X_OFFSET + 220, 200);
        buildOakTree(X_OFFSET - 60, 260);
        buildOakTree(X_OFFSET + 300, 140);
        buildOakTree(X_OFFSET - 200, 200);
        buildOakTree(X_OFFSET + 180, 280);
        buildOakTree(X_OFFSET - 120, -80);
        buildOakTree(X_OFFSET + 80, -120);
        buildOakTree(X_OFFSET + 240, -60);

        // Deer — 6 fallow deer grazing in the meadow
        buildDeer(X_OFFSET + 50, 150);
        buildDeer(X_OFFSET + 80, 170);
        buildDeer(X_OFFSET + 120, 140);
        buildDeer(X_OFFSET - 30, 220);
        buildDeer(X_OFFSET + 200, 100);
        buildDeer(X_OFFSET + 260, 180);
    }

    function buildDeer(x, z) {
        // Body
        makeBox(4, 2.5, 1.8, 0xC4A35A, x, 3, z);
        // Neck
        makeBox(1, 2, 1, 0xC4A35A, x + 1.8, 4.5, z);
        // Head
        makeSphere(1, 6, 5, 0xB8953C, x + 2.4, 5.8, z);
        // Legs
        makeCylinder(0.25, 0.25, 2.5, 4, 0xAA8530, x + 1.2, 1.5, z + 0.5);
        makeCylinder(0.25, 0.25, 2.5, 4, 0xAA8530, x + 1.2, 1.5, z - 0.5);
        makeCylinder(0.25, 0.25, 2.5, 4, 0xAA8530, x - 1.2, 1.5, z + 0.5);
        makeCylinder(0.25, 0.25, 2.5, 4, 0xAA8530, x - 1.2, 1.5, z - 0.5);
        // Antlers (small cones)
        makeCone(0.3, 2, 4, 0x8B6914, x + 2.4, 7.2, z + 0.3);
        makeCone(0.3, 2, 4, 0x8B6914, x + 2.4, 7.2, z - 0.3);
    }

    function buildNewRiver() {
        var rx = X_OFFSET - 280;

        // River channel — straight artificial waterway
        makeBox(12, 0.5, 500, 0x2E6FA8, rx, 0.1, 100);

        // Riverbanks
        makeBox(4, 1, 500, 0x8B7355, rx - 8, 0.5, 100);
        makeBox(4, 1, 500, 0x8B7355, rx + 8, 0.5, 100);

        // Towpath
        makeBox(6, 0.5, 500, 0xC4A882, rx - 14, 0.3, 100);

        // Brick sluice gate north
        makeBox(14, 6, 4, 0x8B3A2A, rx, 3, -60);
        makeBox(10, 4, 2, 0x5C8EAD, rx, 2, -58);
        // Sluice pillars
        makeCylinder(1, 1, 7, 6, 0x7A2E20, rx - 6, 3.5, -60);
        makeCylinder(1, 1, 7, 6, 0x7A2E20, rx + 6, 3.5, -60);

        // Brick sluice gate south
        makeBox(14, 6, 4, 0x8B3A2A, rx, 3, 260);
        makeBox(10, 4, 2, 0x5C8EAD, rx, 2, 262);
        makeCylinder(1, 1, 7, 6, 0x7A2E20, rx - 6, 3.5, 260);
        makeCylinder(1, 1, 7, 6, 0x7A2E20, rx + 6, 3.5, 260);

        // Towpath milestones
        makeBox(1, 2, 1, 0xD0D0D0, rx - 15, 1, 0);
        makeBox(1, 2, 1, 0xD0D0D0, rx - 15, 1, 100);
        makeBox(1, 2, 1, 0xD0D0D0, rx - 15, 1, 200);
    }

    function buildEnfieldMarket() {
        var mx = X_OFFSET - 80;
        var mz = -400;

        // Market square cobbled ground
        makeBox(120, 0.5, 100, 0xA09070, mx, 0.2, mz);

        // St Andrew's Parish Church
        // Nave
        makeBox(22, 18, 50, 0xC8B89A, mx - 40, 9, mz);
        // Chancel
        makeBox(14, 16, 20, 0xC8B89A, mx - 40, 8, mz - 35);
        // Tower
        makeBox(14, 36, 14, 0xB0A080, mx - 40, 18, mz + 30);
        // Tower battlements
        makeBox(14, 3, 14, 0x9A8870, mx - 40, 38, mz + 30);
        makeBox(3, 4, 3, 0x9A8870, mx - 47, 40, mz + 23);
        makeBox(3, 4, 3, 0x9A8870, mx - 33, 40, mz + 23);
        makeBox(3, 4, 3, 0x9A8870, mx - 47, 40, mz + 37);
        makeBox(3, 4, 3, 0x9A8870, mx - 33, 40, mz + 37);
        // Church roof
        makeCone(12, 8, 4, 0x8B7355, mx - 40, 23, mz);
        // Church spire on tower
        makeCone(5, 20, 4, 0x8B7355, mx - 40, 46, mz + 30);
        // Church windows
        makeBox(4, 8, 1, 0xADD8E6, mx - 29, 10, mz);
        makeBox(4, 8, 1, 0xADD8E6, mx - 29, 10, mz - 12);
        makeBox(4, 8, 1, 0xADD8E6, mx - 29, 10, mz + 12);
        // Church door arch
        makeBox(5, 8, 1, 0x6B4226, mx - 29, 5, mz + 24);

        // Georgian Market House — central, colonnade
        makeBox(30, 10, 20, 0xE8DCC8, mx, 5, mz);
        // Columns
        makeCylinder(1, 1, 10, 8, 0xD4C8A8, mx - 12, 5, mz - 10);
        makeCylinder(1, 1, 10, 8, 0xD4C8A8, mx - 6, 5, mz - 10);
        makeCylinder(1, 1, 10, 8, 0xD4C8A8, mx, 5, mz - 10);
        makeCylinder(1, 1, 10, 8, 0xD4C8A8, mx + 6, 5, mz - 10);
        makeCylinder(1, 1, 10, 8, 0xD4C8A8, mx + 12, 5, mz - 10);
        // Market house pediment
        makeCone(17, 5, 3, 0xDDD0B0, mx, 13, mz - 10);
        // Market house roof
        makeBox(30, 3, 20, 0xA08060, mx, 11.5, mz);
        // Cupola
        makeCylinder(2, 2, 4, 8, 0xD4C8A8, mx, 14, mz);
        makeCone(2, 4, 8, 0xA08060, mx, 18, mz);

        // Market stalls — around the square
        makeBox(8, 3, 5, 0xCC4444, mx + 30, 1.5, mz - 20);
        makeBox(8, 3, 5, 0x44AA44, mx + 30, 1.5, mz - 10);
        makeBox(8, 3, 5, 0xAAAA22, mx + 30, 1.5, mz);
        makeBox(8, 3, 5, 0x4444CC, mx + 30, 1.5, mz + 10);
        makeBox(8, 3, 5, 0xCC8844, mx + 30, 1.5, mz + 20);

        // Stall awnings (flat boxes on top)
        makeBox(10, 0.5, 7, 0xCC4444, mx + 30, 3.5, mz - 20);
        makeBox(10, 0.5, 7, 0x44AA44, mx + 30, 3.5, mz - 10);
        makeBox(10, 0.5, 7, 0xAAAA22, mx + 30, 3.5, mz);
        makeBox(10, 0.5, 7, 0x4444CC, mx + 30, 3.5, mz + 10);
        makeBox(10, 0.5, 7, 0xCC8844, mx + 30, 3.5, mz + 20);

        // Georgian terraced shops around square
        makeBox(80, 12, 15, 0xDDD0C0, mx + 10, 6, mz + 55);
        makeBox(80, 12, 15, 0xD0C8B8, mx + 10, 6, mz - 55);

        // Shop roofs
        makeBox(80, 2, 15, 0x8A7A6A, mx + 10, 13, mz + 55);
        makeBox(80, 2, 15, 0x8A7A6A, mx + 10, 13, mz - 55);

        // Pub sign post
        makeCylinder(0.3, 0.3, 10, 6, 0x4A3020, mx - 30, 5, mz + 20);
        makeBox(6, 4, 0.5, 0x8B3A2A, mx - 30, 10, mz + 20);
    }

    function buildTurkeyBrook() {
        var bx = X_OFFSET + 50;

        // Turkey Brook — natural winding stream
        // Approximated with offset box segments to suggest meander
        makeBox(6, 0.5, 60, 0x4A90D9, bx, 0.1, 30);
        makeBox(6, 0.5, 40, 0x4A90D9, bx + 10, 0.1, 80);
        makeBox(6, 0.5, 50, 0x4A90D9, bx + 25, 0.1, 120);
        makeBox(6, 0.5, 40, 0x4A90D9, bx + 15, 0.1, 160);
        makeBox(6, 0.5, 50, 0x4A90D9, bx, 0.1, 200);
        makeBox(6, 0.5, 40, 0x4A90D9, bx - 10, 0.1, 240);

        // Streambanks
        makeBox(3, 1, 60, 0x7A5C3A, bx - 5, 0.5, 30);
        makeBox(3, 1, 60, 0x7A5C3A, bx + 5, 0.5, 30);
        makeBox(3, 1, 40, 0x7A5C3A, bx + 5, 0.5, 80);
        makeBox(3, 1, 40, 0x7A5C3A, bx + 15, 0.5, 80);
        makeBox(3, 1, 50, 0x7A5C3A, bx + 20, 0.5, 120);
        makeBox(3, 1, 50, 0x7A5C3A, bx + 30, 0.5, 120);

        // Stone footbridge over Turkey Brook
        var fbx = bx + 10;
        var fbz = 100;
        // Bridge deck
        makeBox(16, 2, 6, 0x9A9080, fbx, 2, fbz);
        // Bridge arch (represented by box below deck)
        makeBox(8, 3, 6, 0x8A8070, fbx, 0, fbz);
        // Bridge parapets
        makeBox(16, 2, 1, 0xA0968A, fbx, 3.5, fbz - 3.5);
        makeBox(16, 2, 1, 0xA0968A, fbx, 3.5, fbz + 3.5);
        // Bridge parapet end caps
        makeBox(2, 3, 8, 0xA0968A, fbx - 8, 3.5, fbz);
        makeBox(2, 3, 8, 0xA0968A, fbx + 8, 3.5, fbz);

        // Riparian vegetation — willows and rushes
        makeCylinder(0.8, 1.2, 10, 6, 0x3A2818, bx - 8, 5, 60);
        makeSphere(5, 7, 5, 0x4A7030, bx - 8, 12, 60);
        makeCylinder(0.8, 1.2, 9, 6, 0x3A2818, bx + 35, 4.5, 130);
        makeSphere(4, 7, 5, 0x3E6828, bx + 35, 11, 130);
        makeCylinder(0.8, 1.2, 11, 6, 0x3A2818, bx - 12, 5.5, 180);
        makeSphere(5, 7, 5, 0x4A7030, bx - 12, 13, 180);

        // Reed clumps
        makeCylinder(1.5, 1, 4, 8, 0x7A8A30, bx + 4, 2, 50);
        makeCylinder(1.5, 1, 4, 8, 0x7A8A30, bx - 4, 2, 90);
        makeCylinder(1.5, 1, 4, 8, 0x7A8A30, bx + 20, 2, 140);
        makeCylinder(1.5, 1, 4, 8, 0x7A8A30, bx + 10, 2, 210);
    }

    function buildGroundPlane() {
        // Base ground for entire module area
        makeBox(800, 0.5, 800, 0x6A9A3A, X_OFFSET, -0.5, 0);
    }

    function build() {
        buildGroundPlane();
        buildFortyHall();
        buildEnfieldChase();
        buildNewRiver();
        buildEnfieldMarket();
        buildTurkeyBrook();
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
