window.MarlboroughDowns = (function() {
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

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 16, 16);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 9960;
        var oz = 0;

        // 1. Silbury Hill — massive prehistoric mound (half buried sphere)
        makesphere(25, 0x6A7030, ox + 0, -10, oz + 0);
        // flat top approximation box
        makebox(30, 2, 30, 0x6A7030, ox + 0, 14, oz + 0);

        // 2. West Kennet Long Barrow — megalithic tomb
        makebox(50, 2, 10, 0x777060, ox + 100, 1, oz + 20);
        // facade stones — 3 slab boxes
        makebox(0.5, 3, 2, 0x888870, ox + 124, 2.5, oz + 17);
        makebox(0.5, 3, 2, 0x888870, ox + 124, 2.5, oz + 20);
        makebox(0.5, 3, 2, 0x888870, ox + 124, 2.5, oz + 23);
        // blocking stone
        makebox(1, 4, 3, 0x888870, ox + 125, 3, oz + 20);

        // 3. Marlborough College — main range
        makebox(30, 10, 10, 0xCC8855, ox - 80, 5, oz - 30);
        // west wing
        makebox(15, 8, 9, 0xCC8855, ox - 95, 4, oz - 40);
        // east wing
        makebox(15, 8, 9, 0xCC8855, ox - 65, 4, oz - 40);
        // chapel
        makebox(8, 6, 12, 0xAA7744, ox - 80, 8, oz - 48);
        // college mound — old castle mound (half buried sphere)
        makesphere(10, 0x6A7030, ox - 60, -4, oz - 20);

        // 4. Marlborough High Street — England's widest high street
        makebox(5, 0.2, 60, 0x888866, ox - 150, 0.1, oz + 0);
        // Georgian/Tudor buildings — north side (5 buildings)
        makebox(5, 5, 6, 0xBBAA88, ox - 168, 2.5, oz - 12);
        makebox(5, 5, 6, 0xCC9966, ox - 168, 2.5, oz - 6);
        makebox(5, 5, 6, 0xBBAA88, ox - 168, 2.5, oz + 0);
        makebox(5, 5, 6, 0xCC9966, ox - 168, 2.5, oz + 6);
        makebox(5, 5, 6, 0xBBAA88, ox - 168, 2.5, oz + 12);
        // Georgian/Tudor buildings — south side (5 buildings)
        makebox(5, 5, 6, 0xCC9966, ox - 132, 2.5, oz - 12);
        makebox(5, 5, 6, 0xBBAA88, ox - 132, 2.5, oz - 6);
        makebox(5, 5, 6, 0xCC9966, ox - 132, 2.5, oz + 0);
        makebox(5, 5, 6, 0xBBAA88, ox - 132, 2.5, oz + 6);
        makebox(5, 5, 6, 0xCC9966, ox - 132, 2.5, oz + 12);

        // 5. River Kennet — chalk stream
        makebox(2, 0.2, 60, 0x44AACC, ox - 200, 0.1, oz + 10);

        // 6. White Horse chalk figure — Pewsey White Horse
        makebox(15, 0.3, 8, 0xEEEECC, ox + 60, 5, oz - 80);

        // 7. Savernake Forest — 8 massive oak trees
        // tree 1
        makecylinder(0.6, 0.6, 6, 0x553311, ox + 200, 3, oz + 0);
        makesphere(6, 0x558822, ox + 200, 9, oz + 0);
        // tree 2
        makecylinder(0.6, 0.6, 6, 0x553311, ox + 212, 3, oz + 5);
        makesphere(6, 0x558822, ox + 212, 9, oz + 5);
        // tree 3
        makecylinder(0.6, 0.6, 6, 0x553311, ox + 220, 3, oz - 5);
        makesphere(6, 0x558822, ox + 220, 9, oz - 5);
        // tree 4
        makecylinder(0.6, 0.6, 6, 0x553311, ox + 207, 3, oz - 10);
        makesphere(6, 0x558822, ox + 207, 9, oz - 10);
        // tree 5
        makecylinder(0.6, 0.6, 6, 0x553311, ox + 230, 3, oz + 10);
        makesphere(6, 0x558822, ox + 230, 9, oz + 10);
        // tree 6
        makecylinder(0.6, 0.6, 6, 0x553311, ox + 225, 3, oz - 15);
        makesphere(6, 0x558822, ox + 225, 9, oz - 15);
        // tree 7
        makecylinder(0.6, 0.6, 6, 0x553311, ox + 215, 3, oz + 18);
        makesphere(6, 0x558822, ox + 215, 9, oz + 18);
        // tree 8
        makecylinder(0.6, 0.6, 6, 0x553311, ox + 235, 3, oz + 0);
        makesphere(6, 0x558822, ox + 235, 9, oz + 0);

        // 8. Avebury Manor — Elizabethan manor house
        makebox(20, 10, 9, 0xCC9944, ox + 160, 5, oz - 60);
        // topiary garden — 6 cube hedges
        makebox(2, 2, 2, 0x336622, ox + 150, 1, oz - 48);
        makebox(2, 2, 2, 0x336622, ox + 154, 1, oz - 48);
        makebox(2, 2, 2, 0x336622, ox + 158, 1, oz - 48);
        makebox(2, 2, 2, 0x336622, ox + 162, 1, oz - 48);
        makebox(2, 2, 2, 0x336622, ox + 166, 1, oz - 48);
        makebox(2, 2, 2, 0x336622, ox + 170, 1, oz - 48);

        // 9. Tan Hill fair site — ancient hilltop
        makebox(30, 0.3, 20, 0x7A8A40, ox - 50, 15, oz + 80);
        // 3 standing stones
        makebox(0.4, 2.5, 0.4, 0x888870, ox - 55, 16.55, oz + 78);
        makebox(0.4, 2.5, 0.4, 0x888870, ox - 50, 16.55, oz + 78);
        makebox(0.4, 2.5, 0.4, 0x888870, ox - 45, 16.55, oz + 78);

        // 10. Wiltshire downs — rolling chalk hills (4 cone hills)
        makecone(20, 8, 0x9A9A60, ox + 300, 4, oz + 0);
        makecone(20, 8, 0x9A9A60, ox + 340, 4, oz + 40);
        makecone(20, 8, 0x9A9A60, ox - 300, 4, oz - 50);
        makecone(20, 8, 0x9A9A60, ox - 260, 4, oz + 60);
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
