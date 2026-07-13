window.BournemouthPier = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 9760;
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

    function makecyl(rt, rb, h, color, x, y, z, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 10, 10);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildpier();
        buildbeach();
        buildrussellcotes();
        buildchines();
        buildlowergardens();
        buildclifflift();
        buildhotels();
        buildbeachhuts();
        buildpavilion();
        buildwindsurfers();
    }

    function buildpier() {
        // Pier deck
        makebox(50, 0.5, 8, 0x334455, 25, 1.25, -10);
        // Pier entrance arch
        makebox(8, 0.5, 6, 0x223344, 0, 2.5, -10);
        // 10 cylinder pier supports
        var sx = [4, 9, 14, 19, 24, 29, 34, 39, 44, 49];
        for (var i = 0; i < sx.length; i++) {
            makecyl(0.5, 0.5, 6, 0x223344, sx[i], -1.75, -10);
        }
        // Pier head pavilion
        makebox(12, 6, 8, 0x334455, 49, 4.25, -10);
        // Pavilion dome
        makesphere(5, 0x445566, 49, 10.25, -10);
    }

    function buildbeach() {
        // Sandy beach
        makebox(120, 0.5, 35, 0xF5E080, 20, 0, 10);
    }

    function buildrussellcotes() {
        // Main villa building
        makebox(14, 10, 10, 0xEEDDAA, -30, 5, -50);
        // Turret cylinder
        makecyl(3, 3, 12, 0xDDCC99, -30, 12, -50);
        // Arched windows x6
        var wx = [-36, -33, -30, -27, -24, -21];
        for (var i = 0; i < wx.length; i++) {
            makebox(2, 3, 0.4, 0x887755, wx[i], 6, -45.2);
        }
        // Ornate balcony
        makebox(14, 0.4, 2, 0xCCBB88, -30, 3.2, -45.5);
        // Balcony brackets x4
        var bx = [-35, -31, -27, -23];
        for (var j = 0; j < bx.length; j++) {
            makebox(0.4, 1.2, 0.8, 0xCCBB88, bx[j], 2.4, -45.5);
        }
    }

    function buildchines() {
        // Red cliff face
        makebox(30, 20, 8, 0x886644, -20, 10, -55);
        // Wooded ravine 1
        makebox(4, 15, 6, 0x334422, -12, 7.5, -55);
        // Wooded ravine 2
        makebox(4, 15, 6, 0x334422, -26, 7.5, -55);
    }

    function buildlowergardens() {
        // Linear park
        makebox(5, 0.3, 60, 0x447730, -5, 0.15, -25);
        // Victorian bandstand columns x8
        var angles = [0, 0.785, 1.571, 2.356, 3.142, 3.927, 4.712, 5.498];
        for (var i = 0; i < angles.length; i++) {
            var bx2 = -5 + Math.cos(angles[i]) * 2.2;
            var bz = -25 + Math.sin(angles[i]) * 2.2;
            makecyl(0.2, 0.2, 4, 0x998855, bx2, 2, bz);
        }
        // Bandstand roof
        makebox(5, 0.3, 5, 0x887744, -5, 4.15, -25);
        // Flower beds x4
        makebox(3, 0.3, 2, 0x994422, -5, 0.3, -35);
        makebox(3, 0.3, 2, 0x994422, -5, 0.3, -30);
        makebox(3, 0.3, 2, 0x994422, -5, 0.3, -20);
        makebox(3, 0.3, 2, 0x994422, -5, 0.3, -15);
    }

    function buildclifflift() {
        // Angled track rail 1
        var rail1 = makebox(0.2, 0.2, 20, 0x555555, -42, 5, -48);
        if (rail1) {
            rail1.rotation.x = -0.6109;
        }
        // Angled track rail 2
        var rail2 = makebox(0.2, 0.2, 20, 0x555555, -40, 5, -48);
        if (rail2) {
            rail2.rotation.x = -0.6109;
        }
        // Car 1
        var car1 = makebox(2, 1.5, 1.2, 0x4488CC, -41, 2, -43);
        if (car1) {
            car1.rotation.x = -0.6109;
        }
        // Car 2
        var car2 = makebox(2, 1.5, 1.2, 0x4488CC, -41, 8, -53);
        if (car2) {
            car2.rotation.x = -0.6109;
        }
    }

    function buildhotels() {
        // 4 grand clifftop hotels
        var hpos = [
            [-60, -50],
            [-40, -50],
            [10, -50],
            [30, -50]
        ];
        for (var i = 0; i < hpos.length; i++) {
            var hx = hpos[i][0];
            var hz = hpos[i][1];
            // Main hotel block
            makebox(20, 12, 12, 0xEEDDBB, hx, 6, hz);
            // Bay windows
            makebox(3, 8, 1.5, 0xDDCCAA, hx - 6, 5, hz - 6.7);
            makebox(3, 8, 1.5, 0xDDCCAA, hx + 6, 5, hz - 6.7);
            // Terrace garden
            makebox(20, 0.3, 4, 0x447730, hx, 12.15, hz - 8);
        }
    }

    function buildbeachhuts() {
        // 12 colourful beach huts
        var colors = [0xFF6644, 0xFFDD00, 0x44CCFF, 0x88EE44, 0xFF44AA, 0xBB44FF];
        for (var i = 0; i < 12; i++) {
            var hx = -50 + i * 3.5;
            var col = colors[i % 6];
            // Hut body
            makebox(2, 2, 2.5, col, hx, 1, 22);
            // Hut roof (cone)
            makecone(1.4, 1, col, hx, 2.5, 22);
        }
    }

    function buildpavilion() {
        // Main pavilion
        makebox(25, 15, 10, 0xEEEEEE, -70, 7.5, -40);
        // Art deco marquee sign
        makebox(20, 0.4, 3, 0xCCCCCC, -70, 16, -35.1);
        // Facade pillars x4
        var px = [-78, -72, -66, -60];
        for (var i = 0; i < px.length; i++) {
            makecyl(0.5, 0.5, 15, 0xDDDDDD, px[i], 7.5, -35);
        }
    }

    function buildwindsurfers() {
        // Windsurfer 1
        makebox(2, 0.2, 0.7, 0xFF4422, 30, 0.6, 5);
        makecone(0.1, 5, 0xFF4422, 30, 3.1, 5);
        makebox(2, 3, 0.05, 0xFF4422, 31.1, 3.1, 5);

        // Windsurfer 2
        makebox(2, 0.2, 0.7, 0x4488CC, 35, 0.6, 8);
        makecone(0.1, 5, 0x4488CC, 35, 3.1, 8);
        makebox(2, 3, 0.05, 0x4488CC, 36.1, 3.1, 8);

        // Windsurfer 3
        makebox(2, 0.2, 0.7, 0xFF4422, 40, 0.6, 3);
        makecone(0.1, 5, 0xFF4422, 40, 3.1, 3);
        makebox(2, 3, 0.05, 0xFF4422, 41.1, 3.1, 3);
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
