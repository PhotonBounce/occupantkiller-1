window.PerranporthDunes = (function() {
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
        mesh.position.set(8600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(8600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 10, 10);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(8600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(8600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        // 1. Perranporth beach — wide golden sand 100x40x0.5
        makebox(100, 0.5, 40, 0xF5E060, 0, -0.25, 0);

        // 2. Sand dunes — 8 large dune hills (half-spheres embedded in ground)
        // Varying heights 4-8, embedded so only top half shows
        makesphere(10, 0xE8C840, -30, -6, -12);
        makesphere(10, 0xE8C840, -15, -7, -16);
        makesphere(10, 0xE8C840, 5, -5, -18);
        makesphere(10, 0xE8C840, 20, -4, -15);
        makesphere(10, 0xE8C840, -40, -3, -10);
        makesphere(10, 0xE8C840, 35, -6, -13);
        makesphere(10, 0xE8C840, 45, -5, -17);
        makesphere(10, 0xE8C840, -25, -8, -20);

        // 3. St Piran's oratory — ancient ruins: low stone walls, partially buried
        // Raised floor (partially buried)
        makebox(4, 0.4, 3, 0x999077, -45, 0.2, 5);
        // Walls — low, roofless
        makebox(4, 1.2, 0.3, 0x999077, -45, 0.6, 3.65);   // front wall
        makebox(4, 1.2, 0.3, 0x999077, -45, 0.6, 6.35);   // back wall
        makebox(0.3, 1.2, 3, 0x999077, -43.15, 0.6, 5);   // right wall
        makebox(0.3, 1.2, 3, 0x999077, -46.85, 0.6, 5);   // left wall (gap for entrance)
        // Archaeology marker stakes
        makecyl(0.1, 0.1, 1, 0x888866, -44, 0.5, 4.5);
        makecyl(0.1, 0.1, 1, 0x888866, -46, 0.5, 5.5);
        makecyl(0.1, 0.1, 1, 0x888866, -44.5, 0.5, 6);
        makecyl(0.1, 0.1, 1, 0x888866, -45.5, 0.5, 4);

        // 4. Surf school — beach hut cluster: 3 huts
        // Hut 1 — blue
        makebox(4, 3, 3, 0x4488CC, 10, 1.5, 10);
        // Hut 2 — orange
        makebox(4, 3, 3, 0xFF6622, 15, 1.5, 10);
        // Hut 3 — green
        makebox(4, 3, 3, 0x22AA44, 20, 1.5, 10);
        // Surfboard racks for hut 1 (2 uprights + crossbar)
        makebox(0.15, 2, 0.15, 0x996633, 8.5, 1, 10);
        makebox(0.15, 2, 0.15, 0x996633, 9.5, 1, 10);
        makebox(1, 0.15, 0.15, 0x996633, 9, 1.5, 10);
        // Surfboard racks for hut 2
        makebox(0.15, 2, 0.15, 0x996633, 13.5, 1, 10);
        makebox(0.15, 2, 0.15, 0x996633, 14.5, 1, 10);
        makebox(1, 0.15, 0.15, 0x996633, 14, 1.5, 10);

        // 5. Perranporth town — cliff-top: 8 buildings
        makebox(5, 5, 5, 0xCC9966, -60, 2.5, -25);
        makebox(6, 5, 6, 0xCC9966, -52, 2.5, -25);
        makebox(7, 5, 5, 0xCC9966, -44, 2.5, -26);
        makebox(5, 5, 5, 0xCC9966, -36, 2.5, -24);
        makebox(8, 5, 6, 0xCC9966, -27, 2.5, -25);
        makebox(6, 5, 5, 0xCC9966, -18, 2.5, -26);
        makebox(5, 5, 6, 0xCC9966, -10, 2.5, -25);
        makebox(7, 5, 5, 0xCC9966, -2, 2.5, -24);

        // 6. Dune buggy tracks — wheel ruts: 4 narrow groove boxes, parallel tracks
        makebox(0.3, 0.2, 20, 0xD4B040, -20, 0.1, -5);
        makebox(0.3, 0.2, 20, 0xD4B040, -18.5, 0.1, -5);
        makebox(0.3, 0.2, 20, 0xD4B040, -10, 0.1, -8);
        makebox(0.3, 0.2, 20, 0xD4B040, -8.5, 0.1, -8);

        // 7. Beach volleyball court
        // 4 post cylinders
        makecyl(0.2, 0.2, 3, 0xEEEEEE, 30, 1.5, -5);
        makecyl(0.2, 0.2, 3, 0xEEEEEE, 42, 1.5, -5);
        makecyl(0.2, 0.2, 3, 0xEEEEEE, 30, 1.5, 5);
        makecyl(0.2, 0.2, 3, 0xEEEEEE, 42, 1.5, 5);
        // Net box
        makebox(12, 0.15, 1, 0xEEEEEE, 36, 2.5, 0);

        // 8. Lifeguard tower — raised platform
        // 4 legs
        makecyl(0.3, 0.3, 4, 0xCC2222, 50, 2, -3);
        makecyl(0.3, 0.3, 4, 0xCC2222, 53, 2, -3);
        makecyl(0.3, 0.3, 4, 0xCC2222, 50, 2, 0);
        makecyl(0.3, 0.3, 4, 0xCC2222, 53, 2, 0);
        // Platform box
        makebox(3, 2.5, 3, 0xCC2222, 51.5, 5.25, -1.5);
        // Flag pole
        makecyl(0.1, 0.1, 3, 0xCC2222, 51.5, 8.0, -1.5);
        // Flag box
        makebox(1, 0.6, 0.05, 0xFF4444, 52.0, 9.2, -1.5);

        // 9. Coastal path signpost
        // Wooden post
        makebox(0.2, 3, 0.2, 0x8B6040, -5, 1.5, 15);
        // Directional arrow 1
        makebox(2, 0.3, 0.15, 0x8B6040, -4, 2.8, 15);
        // Directional arrow 2
        makebox(2, 0.3, 0.15, 0x8B6040, -5.5, 2.3, 15);

        // 10. Cave opening — dark arch cut into cliff face
        makebox(5, 4, 3, 0x222222, -55, 2, -22);
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
