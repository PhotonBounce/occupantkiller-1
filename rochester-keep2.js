window.RochesterKeep2 = (function() {
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
        var ox = 6280;
        var oz = 0;

        // ---- Rochester Cathedral ----
        // Long nave 40x16x12
        makebox(40, 12, 16, 0xCCBBAA, ox + 0, 6, oz + 0);

        // Central crossing tower 10x10x20
        makebox(10, 20, 10, 0xCCBBAA, ox + 0, 10, oz + 0);

        // ConeGeometry cap on crossing tower
        makecone(6, 8, 8, 0xBBAA99, ox + 0, 24, oz + 0);

        // West front twin tower left 6x6x18
        makebox(6, 18, 6, 0xCCBBAA, ox - 14, 9, oz + 5);

        // West front twin tower right 6x6x18
        makebox(6, 18, 6, 0xCCBBAA, ox - 14, 9, oz - 5);

        // ConeGeometry cap left tower
        makecone(4, 6, 8, 0xBBAA99, ox - 14, 21, oz + 5);

        // ConeGeometry cap right tower
        makecone(4, 6, 8, 0xBBAA99, ox - 14, 21, oz - 5);

        // Chancel east end extension
        makebox(12, 10, 12, 0xCCBBAA, ox + 22, 5, oz + 0);

        // ---- Rochester Castle Keep ----
        // Square Norman keep 15x15x22
        makebox(15, 22, 15, 0xCC9966, ox + 80, 11, oz - 20);

        // Four corner turrets CylinderGeometry 2r x 24 tall
        makecylinder(2, 2, 24, 8, 0xBB8855, ox + 80 - 7, 12, oz - 20 - 7);
        makecylinder(2, 2, 24, 8, 0xBB8855, ox + 80 + 7, 12, oz - 20 - 7);
        makecylinder(2, 2, 24, 8, 0xBB8855, ox + 80 - 7, 12, oz - 20 + 7);
        makecylinder(2, 2, 24, 8, 0xBB8855, ox + 80 + 7, 12, oz - 20 + 7);

        // Crenellated parapet (box row along top)
        makebox(15, 2, 1, 0xCC9966, ox + 80, 23, oz - 20 - 7);
        makebox(15, 2, 1, 0xCC9966, ox + 80, 23, oz - 20 + 7);
        makebox(1, 2, 15, 0xCC9966, ox + 80 - 7, 23, oz - 20);
        makebox(1, 2, 15, 0xCC9966, ox + 80 + 7, 23, oz - 20);

        // ---- Eastgate House (Dickens) ----
        // Elizabethan manor 20x12x9 brick
        makebox(20, 9, 12, 0x8B3A2A, ox + 40, 4.5, oz + 30);

        // Dutch gable left
        makebox(4, 4, 1, 0x8B3A2A, ox + 30, 11, oz + 30 - 6);
        makecone(2, 3, 4, 0x7A2A1A, ox + 30, 14.5, oz + 30 - 6);

        // Dutch gable right
        makebox(4, 4, 1, 0x8B3A2A, ox + 50, 11, oz + 30 - 6);
        makecone(2, 3, 4, 0x7A2A1A, ox + 50, 14.5, oz + 30 - 6);

        // Four decorative chimneys
        makecylinder(0.4, 0.4, 3, 6, 0x5A2A1A, ox + 33, 14, oz + 26);
        makecylinder(0.4, 0.4, 3, 6, 0x5A2A1A, ox + 37, 14, oz + 26);
        makecylinder(0.4, 0.4, 3, 6, 0x5A2A1A, ox + 43, 14, oz + 26);
        makecylinder(0.4, 0.4, 3, 6, 0x5A2A1A, ox + 47, 14, oz + 26);

        // ---- High Street Victorian Shops (15 shops) ----
        // Each shop 5x7x7, timber frame / brick alternating
        var shopColors = [0x8B6914, 0x885533, 0x8B6914, 0x885533, 0x8B6914,
                          0x885533, 0x8B6914, 0x885533, 0x8B6914, 0x885533,
                          0x8B6914, 0x885533, 0x8B6914, 0x885533, 0x8B6914];
        for (var i = 0; i < 15; i++) {
            makebox(5, 7, 7, shopColors[i], ox - 30 + i * 6, 3.5, oz + 55);
        }

        // ---- Medway Bridge ----
        // Road deck 55x1x4
        makebox(55, 1, 4, 0xBBAA88, ox - 60, 3, oz - 60);

        // 5 support piers 4x2x8 (width x height x depth)
        makebox(4, 8, 2, 0xBBAA88, ox - 82, 4, oz - 60);
        makebox(4, 8, 2, 0xBBAA88, ox - 71, 4, oz - 60);
        makebox(4, 8, 2, 0xBBAA88, ox - 60, 4, oz - 60);
        makebox(4, 8, 2, 0xBBAA88, ox - 49, 4, oz - 60);
        makebox(4, 8, 2, 0xBBAA88, ox - 38, 4, oz - 60);

        // Bridge arch decorative (SphereGeometry half-arches visual stand-in)
        makebox(55, 2, 1, 0xBBAA88, ox - 60, 2, oz - 58);

        // ---- Rochester Museum (former guildhall) ----
        // 15x10x7
        makebox(15, 7, 10, 0xCCBBAA, ox + 20, 3.5, oz + 50);

        // Guildhall portico columns
        makecylinder(0.5, 0.5, 7, 8, 0xCCBBAA, ox + 14, 3.5, oz + 45);
        makecylinder(0.5, 0.5, 7, 8, 0xCCBBAA, ox + 17, 3.5, oz + 45);
        makecylinder(0.5, 0.5, 7, 8, 0xCCBBAA, ox + 23, 3.5, oz + 45);
        makecylinder(0.5, 0.5, 7, 8, 0xCCBBAA, ox + 26, 3.5, oz + 45);

        // ---- Corn Exchange ----
        // 18th century facade 18x12x8 classical
        makebox(18, 8, 12, 0xD4C9A8, ox - 20, 4, oz + 50);

        // Ornate pediment (triangular shape via thin box)
        makebox(18, 3, 1, 0xD4C9A8, ox - 20, 10, oz + 44);

        // Pediment cone/cap
        makecone(9, 4, 3, 0xD4C9A8, ox - 20, 13, oz + 44);

        // Classical columns front facade
        makecylinder(0.6, 0.6, 8, 8, 0xD4C9A8, ox - 26, 4, oz + 44);
        makecylinder(0.6, 0.6, 8, 8, 0xD4C9A8, ox - 22, 4, oz + 44);
        makecylinder(0.6, 0.6, 8, 8, 0xD4C9A8, ox - 18, 4, oz + 44);
        makecylinder(0.6, 0.6, 8, 8, 0xD4C9A8, ox - 14, 4, oz + 44);

        // ---- Waterfront Pubs on Esplanade (4 pubs) ----
        // 10x8x7 dark timber
        makebox(10, 7, 8, 0x443322, ox - 80, 3.5, oz - 10);
        makebox(10, 7, 8, 0x443322, ox - 80, 3.5, oz + 5);
        makebox(10, 7, 8, 0x443322, ox - 80, 3.5, oz + 20);
        makebox(10, 7, 8, 0x443322, ox - 80, 3.5, oz + 35);

        // Pub chimneys
        makecylinder(0.4, 0.4, 3, 6, 0x332211, ox - 76, 9, oz - 10);
        makecylinder(0.4, 0.4, 3, 6, 0x332211, ox - 76, 9, oz + 5);
        makecylinder(0.4, 0.4, 3, 6, 0x332211, ox - 76, 9, oz + 20);
        makecylinder(0.4, 0.4, 3, 6, 0x332211, ox - 76, 9, oz + 35);

        // ---- Extra detail: Cathedral flying buttresses ----
        makebox(2, 8, 2, 0xCCBBAA, ox + 8, 4, oz + 9);
        makebox(2, 8, 2, 0xCCBBAA, ox + 4, 4, oz + 9);
        makebox(2, 8, 2, 0xCCBBAA, ox - 4, 4, oz + 9);
        makebox(2, 8, 2, 0xCCBBAA, ox - 8, 4, oz + 9);

        // Cathedral south transept
        makebox(10, 14, 8, 0xCCBBAA, ox + 4, 7, oz + 10);

        // Castle outer wall section
        makebox(30, 5, 2, 0xCC9966, ox + 70, 2.5, oz - 6);
        makebox(2, 5, 20, 0xCC9966, ox + 66, 2.5, oz - 16);
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
