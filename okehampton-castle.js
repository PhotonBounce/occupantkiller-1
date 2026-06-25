window.OkehamptonCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 9520;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 6);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildspur();
        buildkeep();
        buildgreathall();
        buildchapel();
        buildgatetower();
        buildriver();
        buildgorge();
        buildtown();
        buildmuseum();
        buildponies();
    }

    function buildspur() {
        // Castle spur — rocky promontory ridge
        makebox(40, 6, 12, 0x777060, 0, 3, 0);
        // Steep side walls to suggest cliff drop
        makebox(40, 10, 2, 0x666050, 0, -2, 7);
        makebox(40, 10, 2, 0x666050, 0, -2, -7);
    }

    function buildkeep() {
        // Norman keep — square keep on highest point
        makebox(10, 14, 10, 0x888870, -14, 13, 0);
        // Corner pilasters x4
        makebox(2, 14, 2, 0x888870, -19, 13, -5);
        makebox(2, 14, 2, 0x888870, -9, 13, -5);
        makebox(2, 14, 2, 0x888870, -19, 13, 5);
        makebox(2, 14, 2, 0x888870, -9, 13, 5);
    }

    function buildgreathall() {
        // Great Hall range — long domestic range
        makebox(25, 8, 6, 0x888870, 5, 10, 0);
        // Interior floor
        makebox(23, 0.3, 5, 0x776655, 5, 6.15, 0);
        // End walls to suggest roofless ruin
        makebox(1, 8, 6, 0x777760, -7.5, 10, 0);
        makebox(1, 8, 6, 0x777760, 17.5, 10, 0);
    }

    function buildchapel() {
        // Chapel — castle chapel
        makebox(8, 8, 8, 0x998866, 18, 10, -10);
        // Lancet window gaps (thin decorative boxes)
        makebox(0.8, 2, 0.1, 0x665544, 15, 11, -14.05);
        makebox(0.8, 2, 0.1, 0x665544, 18, 11, -14.05);
        makebox(0.8, 2, 0.1, 0x665544, 21, 11, -14.05);
        // Apse box at east end
        makebox(4, 6, 4, 0x998866, 24, 9, -10);
    }

    function buildgatetower() {
        // Gate tower — entry through cliff
        makebox(8, 10, 10, 0x888870, -20, 11, 12);
        // Portcullis groove (thin inset box)
        makebox(0.3, 8, 4, 0x555544, -20, 8, 12);
        // Passage gap suggestion (dark interior box)
        makebox(3, 4, 10, 0x222222, -20, 8, 12);
    }

    function buildriver() {
        // West Okement River — rocky stream in gorge
        makebox(3, 0.2, 40, 0x336688, 30, -8, 0);
        // Stepping stones x5
        makebox(0.8, 0.3, 0.8, 0x887755, 28, -7.75, -16);
        makebox(0.8, 0.3, 0.8, 0x887755, 29.5, -7.75, -8);
        makebox(0.8, 0.3, 0.8, 0x887755, 30.5, -7.75, 0);
        makebox(0.8, 0.3, 0.8, 0x887755, 29, -7.75, 8);
        makebox(0.8, 0.3, 0.8, 0x887755, 31, -7.75, 16);
    }

    function buildgorge() {
        // Gorge cliff — steep sided rocky valley, both sides
        makebox(10, 20, 8, 0x777060, 36, -3, 0);
        makebox(8, 18, 6, 0x777060, 24, -4, 0);
        // Opposite cliff face
        makebox(10, 20, 8, 0x666655, 36, -3, 18);
        makebox(8, 18, 6, 0x666655, 24, -4, 18);
    }

    function buildtown() {
        // Okehampton town — 8 buildings on valley floor
        var colors = [0xBBAA88, 0xCC9966, 0xBBAA88, 0xCC9966, 0xBBAA88, 0xCC9966, 0xBBAA88, 0xCC9966];
        var positions = [
            [-10, 2, 30], [-4, 2, 32], [2, 2, 30], [8, 2, 32],
            [-10, 2, 42], [-4, 2, 44], [2, 2, 42], [8, 2, 44]
        ];
        for (var i = 0; i < 8; i++) {
            makebox(5, 6, 5, colors[i], positions[i][0], positions[i][1], positions[i][2]);
            // Simple pitched roof using cone shape via box
            makebox(5.5, 2, 5.5, colors[i] - 0x111111, positions[i][0], positions[i][1] + 4, positions[i][2]);
        }
    }

    function buildmuseum() {
        // Museum of Dartmoor Life — converted mill
        makebox(12, 8, 6, 0x887755, -26, 6, 30);
        // Millwheel approximated by CylinderGeometry
        makecyl(3, 3, 0.5, 0x664422, -32.5, 6, 30, Math.PI / 2, 0, 0);
        // Mill chimney
        makebox(1.5, 5, 1.5, 0x776644, -22, 12.5, 30);
    }

    function buildponies() {
        // Dartmoor ponies — 3 ponies on moor
        buildpony(10, 2, 20);
        buildpony(14, 2, 24);
        buildpony(6, 2, 26);
    }

    function buildpony(px, py, pz) {
        // Body
        makebox(1.2, 0.8, 0.6, 0x5A3515, px, py + 0.4, pz);
        // Head
        makesphere(0.3, 0x5A3515, px + 0.7, py + 0.9, pz);
        // Legs x4
        makecyl(0.15, 0.15, 0.7, 0x4A2A10, px + 0.35, py - 0.15, pz + 0.18, 0, 0, 0);
        makecyl(0.15, 0.15, 0.7, 0x4A2A10, px + 0.35, py - 0.15, pz - 0.18, 0, 0, 0);
        makecyl(0.15, 0.15, 0.7, 0x4A2A10, px - 0.35, py - 0.15, pz + 0.18, 0, 0, 0);
        makecyl(0.15, 0.15, 0.7, 0x4A2A10, px - 0.35, py - 0.15, pz - 0.18, 0, 0, 0);
    }

    function update(delta) { }

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
