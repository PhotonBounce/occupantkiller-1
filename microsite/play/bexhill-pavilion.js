window.BexhillPavilion = (function() {
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

    function add(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return add(mesh);
    }

    function cylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return add(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return add(mesh);
    }

    function build() {
        var ox = 6800;
        var oz = 0;

        // --- De La Warr Pavilion main block ---
        // Main 3-story curved block 40x12x10
        box(40, 12, 10, 0xF8F8F8, ox + 0, 6, oz + 0);

        // Chamfered corner approximations (east corners)
        box(3, 12, 3, 0xF8F8F8, ox + 20.5, 6, oz + 4.5);
        box(3, 12, 3, 0xF8F8F8, ox + 20.5, 6, oz - 4.5);
        // West corners
        box(3, 12, 3, 0xF8F8F8, ox - 20.5, 6, oz + 4.5);
        box(3, 12, 3, 0xF8F8F8, ox - 20.5, 6, oz - 4.5);

        // Horizontal window bands - floor 1 (y=2)
        box(38, 1.2, 0.2, 0x88AABB, ox + 0, 2.5, oz + 5.1);
        box(38, 1.2, 0.2, 0x88AABB, ox + 0, 2.5, oz - 5.1);
        // floor 2 (y=6)
        box(38, 1.2, 0.2, 0x88AABB, ox + 0, 6.0, oz + 5.1);
        box(38, 1.2, 0.2, 0x88AABB, ox + 0, 6.0, oz - 5.1);
        // floor 3 (y=10)
        box(38, 1.2, 0.2, 0x88AABB, ox + 0, 9.5, oz + 5.1);
        box(38, 1.2, 0.2, 0x88AABB, ox + 0, 9.5, oz - 5.1);

        // Side window bands
        box(0.2, 1.2, 8, 0x88AABB, ox + 21, 2.5, oz + 0);
        box(0.2, 1.2, 8, 0x88AABB, ox + 21, 6.0, oz + 0);
        box(0.2, 1.2, 8, 0x88AABB, ox + 21, 9.5, oz + 0);
        box(0.2, 1.2, 8, 0x88AABB, ox - 21, 2.5, oz + 0);
        box(0.2, 1.2, 8, 0x88AABB, ox - 21, 6.0, oz + 0);
        box(0.2, 1.2, 8, 0x88AABB, ox - 21, 9.5, oz + 0);

        // Circular staircase tower at east end
        cylinder(4, 4, 12, 16, 0xF8F8F8, ox + 24, 6, oz + 0);

        // Roof parapet
        box(40, 0.5, 10, 0xEEEEEE, ox + 0, 12.25, oz + 0);

        // --- Pavilion terraces - 3 stepped levels ---
        box(30, 1, 5, 0xF0F0F0, ox - 5, 0.5, oz + 12);
        box(30, 1, 5, 0xF0F0F0, ox - 5, 2.5, oz + 9);
        box(30, 1, 5, 0xF0F0F0, ox - 5, 4.5, oz + 6);

        // --- Seafront promenade ---
        box(80, 0.3, 8, 0xCCCCBB, ox + 0, -0.15, oz + 19);

        // --- Beach shingle ---
        box(80, 0.3, 20, 0x888877, ox + 0, -0.15, oz + 34);

        // --- Sea ---
        box(80, 0.3, 25, 0x4488BB, ox + 0, -0.3, oz + 54);

        // --- Victorian seafront hotels ---
        // Hotel 1
        box(15, 12, 10, 0x9B3A2A, ox - 60, 6, oz - 5);
        // Hotel 2
        box(15, 12, 10, 0x9B3A2A, ox - 40, 6, oz - 5);
        // Hotel 3
        box(15, 12, 10, 0x9B3A2A, ox + 40, 6, oz - 5);
        // Hotel 4
        box(15, 12, 10, 0x9B3A2A, ox + 60, 6, oz - 5);

        // Hotel ornamental details (window rows)
        box(13, 0.4, 0.2, 0xC8A87A, ox - 60, 3, oz + 0.1);
        box(13, 0.4, 0.2, 0xC8A87A, ox - 60, 6, oz + 0.1);
        box(13, 0.4, 0.2, 0xC8A87A, ox - 40, 3, oz + 0.1);
        box(13, 0.4, 0.2, 0xC8A87A, ox - 40, 6, oz + 0.1);
        box(13, 0.4, 0.2, 0xC8A87A, ox + 40, 3, oz + 0.1);
        box(13, 0.4, 0.2, 0xC8A87A, ox + 40, 6, oz + 0.1);
        box(13, 0.4, 0.2, 0xC8A87A, ox + 60, 3, oz + 0.1);
        box(13, 0.4, 0.2, 0xC8A87A, ox + 60, 6, oz + 0.1);

        // --- Edwardian bandstand ---
        // Base platform
        cylinder(5, 5, 1, 12, 0x1A4A1A, ox - 15, 0.5, oz + 19);
        // 8 iron columns around perimeter
        var bsAngle, bsX, bsZ;
        for (var i = 0; i < 8; i++) {
            bsAngle = (i / 8) * Math.PI * 2;
            bsX = ox - 15 + Math.cos(bsAngle) * 4.2;
            bsZ = oz + 19 + Math.sin(bsAngle) * 4.2;
            cylinder(0.3, 0.3, 4, 6, 0x1A4A1A, bsX, 3, bsZ);
        }
        // Roof cone
        cone(6, 3, 12, 0x1A4A1A, ox - 15, 6.5, oz + 19);

        // --- Beach huts ---
        var hutColors = [
            0xFF3333, 0xFF8800, 0xFFDD00, 0x33CC33, 0x3399FF,
            0x9933FF, 0xFF66AA, 0x00CCCC, 0xFF4400, 0xAACC00,
            0xFF99CC, 0x66FFAA, 0x3366FF, 0xFFCC33, 0xCC33FF
        ];
        for (var h = 0; h < 15; h++) {
            box(2.5, 2, 3, hutColors[h], ox - 35 + h * 5, 1, oz + 27);
            // Hut roof
            box(2.7, 0.4, 3.2, 0xCCCCCC, ox - 35 + h * 5, 2.2, oz + 27);
        }

        // --- Marina ---
        // Jetty base
        box(30, 0.3, 4, 0xAAA099, ox + 20, -0.15, oz + 60);
        // 6 boat hulls + masts
        for (var m = 0; m < 6; m++) {
            box(6, 1, 2, 0xDDCCAA, ox + 5 + m * 6, 0.5, oz + 60);
            cylinder(0.2, 0.2, 8, 6, 0x888888, ox + 5 + m * 6, 5, oz + 60);
        }

        // --- Bexhill Old Town church ---
        // Nave
        box(14, 8, 8, 0xBBB8A0, ox - 80, 4, oz - 10);
        // Tower
        box(4, 14, 4, 0xBBB8A0, ox - 87, 7, oz - 10);
        // Spire
        cone(2.5, 6, 8, 0xA0A08A, ox - 87, 17, oz - 10);
        // Church windows
        box(0.2, 2, 1, 0x88AABB, ox - 72.9, 5, oz - 10);
        box(0.2, 2, 1, 0x88AABB, ox - 72.9, 5, oz - 7);
        box(0.2, 2, 1, 0x88AABB, ox - 72.9, 5, oz - 13);
        // Nave roof ridge
        box(14, 0.5, 0.5, 0xA0A08A, ox - 80, 8.25, oz - 10);
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
