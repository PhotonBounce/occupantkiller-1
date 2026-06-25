window.SidmouthEsplanade = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 9280;
        var oz = 0;

        // 1. Red sandstone cliffs — 3 large sections flanking beach
        makebox(20, 25, 8, 0xBB4422, ox - 35, 12.5, oz - 5);
        makebox(15, 30, 8, 0xBB4422, ox - 20, 15, oz + 8);
        makebox(25, 20, 6, 0xBB4422, ox + 40, 10, oz - 3);

        // 2. Pebble beach — red-tinged shingle
        makebox(60, 0.5, 20, 0x9A6644, ox, 0.25, oz + 15);

        // 3. Regency esplanade — seafront promenade
        makebox(70, 0.3, 5, 0x998866, ox, 0.15, oz);

        // Cast-iron lamp posts x 8
        var lamppositions = [
            -28, -20, -12, -4, 4, 12, 20, 28
        ];
        for (var i = 0; i < lamppositions.length; i++) {
            makecylinder(0.15, 0.15, 5, 8, 0x333333, ox + lamppositions[i], 2.5, oz - 1.5);
            makesphere(0.2, 6, 6, 0x333333, ox + lamppositions[i], 5.2, oz - 1.5);
        }

        // 4. Regency villas — 10 elegant white stucco buildings
        for (var v = 0; v < 10; v++) {
            var vx = ox - 45 + v * 9;
            var vz = oz - 10;
            // Main villa body
            makebox(6, 8, 8, 0xF5F5F0, vx, 4, vz);
            // Two pilasters per building
            makebox(0.3, 0.3, 8, 0xE8E8E2, vx - 2.5, 4, vz + 4.15);
            makebox(0.3, 0.3, 8, 0xE8E8E2, vx + 2.5, 4, vz + 4.15);
            // Two bay windows per building
            makebox(2, 3, 0.4, 0xDDDDD8, vx - 1.5, 3.5, vz + 4.35);
            makebox(2, 3, 0.4, 0xDDDDD8, vx + 1.5, 3.5, vz + 4.35);
        }

        // 5. The Sidmouth Hotel
        makebox(20, 10, 10, 0xEEEEDD, ox + 5, 5, oz - 22);
        // Covered veranda
        makebox(20, 0.4, 4, 0xDDDDCC, ox + 5, 0.5, oz - 15.8);
        // Veranda columns x 6
        var colpositions = [-8, -4, 0, 4, 8, 12];
        for (var c = 0; c < colpositions.length; c++) {
            makecylinder(0.3, 0.3, 3, 8, 0xCCCCBB, ox - 5 + colpositions[c], 1.5, oz - 13.8);
        }

        // 6. Jacob's Ladder — beach access stairs
        for (var s = 0; s < 6; s++) {
            makebox(2, 0.4, 0.8, 0x996655, ox - 30 + s * 0.5, 0.2 + s * 0.4, oz - 1 + s * 0.8);
        }
        // Handrails
        makebox(0.1, 0.1, 10, 0x774433, ox - 31, 2.5, oz + 2);
        makebox(0.1, 0.1, 10, 0x774433, ox - 29, 2.5, oz + 2);

        // 7. Connaught Gardens — cliff-top gardens
        // Low terrace wall
        makebox(15, 0.5, 0.8, 0x998877, ox - 20, 25.5, oz - 18);
        // 4 ornamental trees
        for (var t = 0; t < 4; t++) {
            var tx = ox - 24 + t * 5;
            makecylinder(0.3, 0.3, 5, 8, 0x447733, tx, 27.5, oz - 18);
            makesphere(3, 8, 8, 0x447733, tx, 32, oz - 18);
        }

        // 8. Folk Festival stage
        // Platform
        makebox(12, 0.5, 8, 0xAA8855, ox + 20, 0.25, oz - 8);
        // Back screen
        makebox(12, 6, 0.5, 0x887744, ox + 20, 3.5, oz - 12.25);
        // Speaker towers
        makebox(1, 1, 4, 0x333333, ox + 14, 2, oz - 8);
        makebox(1, 1, 4, 0x333333, ox + 26, 2, oz - 8);

        // 9. Cricket ground
        // Outfield
        makebox(40, 0.3, 30, 0x55881A, ox - 10, 0.15, oz - 45);
        // Sight screen
        makebox(6, 3, 0.3, 0xEEEEEE, ox + 18, 1.65, oz - 45);
        // Pavilion
        makebox(14, 6, 5, 0xDDCC99, ox - 20, 3, oz - 57);

        // 10. Red cliff viewpoint
        // Terrace wall
        makebox(10, 0.5, 1.2, 0x888870, ox - 5, 26, oz - 25);
        // Telescope mounting box
        makebox(0.5, 0.5, 0.5, 0x555544, ox, 26.5, oz - 25);
        // Telescope cylinder
        makecylinder(0.3, 0.3, 0.8, 8, 0x333333, ox, 27.15, oz - 25);
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
