window.SalcombeKingsbridge = (function() {
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

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 9120;
        var oz = 0;

        // 1. Kingsbridge estuary — wide tidal inlet
        makebox(80, 0.5, 50, 0x336699, ox + 0, 0, oz + 0);

        // 2. Salcombe waterfront — 12 pastel painted buildings
        var houseColors = [0xFF9966, 0xFFDD44, 0x88DDFF, 0xAAFF88, 0xFF9966, 0xFFDD44, 0x88DDFF, 0xAAFF88, 0xFF9966, 0xFFDD44, 0x88DDFF, 0xAAFF88];
        for (var i = 0; i < 12; i++) {
            makebox(4, 5, 5, houseColors[i], ox + (-27 + i * 5), 2.5, oz + (-22));
        }

        // 3. South Sands beach — golden sand cove
        makebox(30, 0.5, 20, 0xF5E080, ox + 30, 0, oz + 20);

        // 4. Fort Charles ruin — Civil War artillery fort: 3 wall sections
        makebox(6, 1, 3, 0x888870, ox + (-30), 0.5, oz + 15);
        makebox(6, 1, 3, 0x888870, ox + (-24), 0.5, oz + 20);
        makebox(6, 1, 3, 0x888870, ox + (-30), 0.5, oz + 20);
        // collapsed corner tower (partial cylinder)
        makecylinder(3, 3, 5, 8, 0x888870, ox + (-30), 2.5, oz + 15);
        // cannon position box
        makebox(2, 0.6, 1, 0x555544, ox + (-28), 1.3, oz + 17);

        // 5. Salcombe Yacht Club — white building with flagpoles and dinghy racks
        makebox(12, 6, 5, 0xEEEEEE, ox + 10, 3, oz + (-22));
        // 3 flagpoles
        makecylinder(0.1, 0.1, 6, 6, 0xCCCCCC, ox + 6, 6, oz + (-22));
        makecylinder(0.1, 0.1, 6, 6, 0xCCCCCC, ox + 10, 6, oz + (-22));
        makecylinder(0.1, 0.1, 6, 6, 0xCCCCCC, ox + 14, 6, oz + (-22));
        // 3 dinghy racks — rack top + 2 legs each
        for (var j = 0; j < 3; j++) {
            makebox(4, 1, 0.5, 0x886644, ox + (4 + j * 5), 1, oz + (-18));
            makebox(0.2, 1, 0.2, 0x886644, ox + (2.9 + j * 5), 0.5, oz + (-18));
            makebox(0.2, 1, 0.2, 0x886644, ox + (5.1 + j * 5), 0.5, oz + (-18));
        }

        // 6. Ferry pontoon — floating dock and water taxi
        makebox(10, 0.5, 3, 0x778888, ox + 0, 0.25, oz + 22);
        // water taxi hull
        makebox(4, 1, 1.5, 0x445566, ox + 6, 0.75, oz + 22);

        // 7. Marine hotel — clifftop hotel with bay windows
        makebox(20, 10, 8, 0xEEDDBB, ox + (-10), 5, oz + (-10));
        // 4 bay windows
        makebox(3, 3, 0.4, 0x99BBDD, ox + (-17), 6, oz + (-14.2));
        makebox(3, 3, 0.4, 0x99BBDD, ox + (-12), 6, oz + (-14.2));
        makebox(3, 3, 0.4, 0x99BBDD, ox + (-7), 6, oz + (-14.2));
        makebox(3, 3, 0.4, 0x99BBDD, ox + (-2), 6, oz + (-14.2));

        // 8. Kingsbridge town — 8 Georgian buildings at estuary head
        for (var k = 0; k < 8; k++) {
            makebox(5, 7, 5, 0xBBAA88, ox + (-35 + k * 6), 3.5, oz + (-30));
        }
        // market square war memorial obelisk
        makebox(1, 1, 6, 0x999988, ox + (-10), 3, oz + (-35));

        // 9. Tidal creeks — 3 narrow channel boxes branching off estuary
        makebox(3, 0.3, 20, 0x334466, ox + (-20), 0.15, oz + 10);
        makebox(3, 0.3, 20, 0x334466, ox + (10), 0.15, oz + 10);
        makebox(3, 0.3, 20, 0x334466, ox + (25), 0.15, oz + 5);

        // 10. Crabbing jetty — wooden pier: main deck + 6 pile cylinders + 4 crabbing buckets
        makebox(1, 0.5, 15, 0x6B4423, ox + 20, 0.25, oz + 15);
        // 6 pile cylinders
        for (var p = 0; p < 6; p++) {
            makecylinder(0.3, 0.3, 4, 6, 0x5A3A1A, ox + 20, -1.75, oz + (8 + p * 2));
        }
        // 4 crabbing buckets (small cylinders)
        makecylinder(0.2, 0.2, 0.3, 8, 0xFF4422, ox + 19.5, 0.65, oz + 12);
        makecylinder(0.2, 0.2, 0.3, 8, 0x44AAFF, ox + 20.5, 0.65, oz + 14);
        makecylinder(0.2, 0.2, 0.3, 8, 0xFFCC00, ox + 19.5, 0.65, oz + 16);
        makecylinder(0.2, 0.2, 0.3, 8, 0x44DD44, ox + 20.5, 0.65, oz + 18);

        // Extra scenic details to reach 55-65 objects total
        // Estuary mooring buoys
        makesphere(0.4, 6, 6, 0xFF6600, ox + 5, 0.6, oz + 5);
        makesphere(0.4, 6, 6, 0xFF6600, ox + (-5), 0.6, oz + 8);
        makesphere(0.4, 6, 6, 0xFF6600, ox + 12, 0.6, oz + (-3));

        // Salcombe harbour wall
        makebox(40, 1.5, 1, 0x999977, ox + 0, 0.75, oz + (-20));

        // Cafe on waterfront
        makebox(5, 4, 4, 0xFF9966, ox + 22, 2, oz + (-22));

        // Beach huts at South Sands (3 small colourful boxes)
        makebox(2, 2.5, 2, 0xFF4444, ox + 24, 1.25, oz + 15);
        makebox(2, 2.5, 2, 0x4444FF, ox + 27, 1.25, oz + 15);
        makebox(2, 2.5, 2, 0x44AA44, ox + 30, 1.25, oz + 15);

        // Lighthouse on headland
        makecylinder(1.2, 1.5, 8, 8, 0xFFFFEE, ox + (-38), 4, oz + (-5));
        makecone(1.5, 2, 8, 0xFF2222, ox + (-38), 9, oz + (-5));
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
