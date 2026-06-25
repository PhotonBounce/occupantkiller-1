window.WinchesterGreatHall = (function() {
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
        var ox = 10000;
        var oz = 0;

        // ---- 1. Winchester Great Hall ----
        // Main hall box 35x12x14
        makebox(35, 12, 14, 0x888870, ox + 0, 6, oz + 0);

        // 12 marble column cylinders (6 each side), inside the hall
        var colPositions = [-12, -7, -2, 2, 7, 12];
        for (var ci = 0; ci < colPositions.length; ci++) {
            makecylinder(0.5, 0.5, 8, 8, 0xCCCCBB, ox + colPositions[ci], 4, oz + 4);
            makecylinder(0.5, 0.5, 8, 8, 0xCCCCBB, ox + colPositions[ci], 4, oz - 4);
        }

        // West window — large flat box at west end
        makebox(5, 8, 0.3, 0x88AABB, ox - 17.5, 8, oz + 0);

        // ---- 2. King Arthur's Round Table ----
        // Hanging on the west wall, vertical (rotated)
        var tableGeo = new THREE.CylinderGeometry(5, 5, 0.2, 16);
        var tableMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var tableMesh = new THREE.Mesh(tableGeo, tableMat);
        tableMesh.position.set(ox - 17.0, 9, oz + 0);
        tableMesh.rotation.z = Math.PI / 2;
        scene.add(tableMesh);
        objects.push(tableMesh);

        // 8 radiating divider boxes — alternating green/cream
        var wedgeColors = [0x228B22, 0xEEEECC, 0x228B22, 0xEEEECC, 0x228B22, 0xEEEECC, 0x228B22, 0xEEEECC];
        for (var wi = 0; wi < 8; wi++) {
            var wangle = (wi / 8) * Math.PI * 2;
            var wgeo = new THREE.BoxGeometry(0.2, 0.25, 5);
            var wmat = new THREE.MeshLambertMaterial({ color: wedgeColors[wi] });
            var wmesh = new THREE.Mesh(wgeo, wmat);
            wmesh.position.set(ox - 16.85, 9 + Math.sin(wangle) * 2.5, oz + Math.cos(wangle) * 2.5);
            wmesh.rotation.x = wangle;
            scene.add(wmesh);
            objects.push(wmesh);
        }

        // ---- 3. Winchester Cathedral ----
        // Nave box 50x14x16
        makebox(50, 14, 16, 0x998866, ox + 80, 7, oz + 0);
        // West front 25x18x1.5
        makebox(25, 18, 1.5, 0x998866, ox + 55.25, 9, oz + 0);
        // Central tower 7x7x20
        makebox(7, 20, 7, 0x998866, ox + 80, 10, oz + 0);
        // Transept north 12x10x10
        makebox(12, 10, 10, 0x998866, ox + 80, 5, oz + 13);
        // Transept south 12x10x10
        makebox(12, 10, 10, 0x998866, ox + 80, 5, oz - 13);

        // ---- 4. Winchester College ----
        // Main gate tower 6x5x12
        makebox(6, 12, 5, 0x888870, ox - 60, 6, oz + 40);
        // College buildings around courtyard
        makebox(20, 9, 8, 0x888870, ox - 70, 4.5, oz + 50);
        makebox(20, 9, 8, 0x888870, ox - 50, 4.5, oz + 50);
        makebox(8, 9, 20, 0x888870, ox - 60, 4.5, oz + 60);

        // ---- 5. The Buttercross — medieval market cross ----
        // 4 pillars
        makecylinder(0.4, 0.4, 6, 8, 0x888870, ox + 30, 3, oz + 30);
        makecylinder(0.4, 0.4, 6, 8, 0x888870, ox + 34, 3, oz + 30);
        makecylinder(0.4, 0.4, 6, 8, 0x888870, ox + 30, 3, oz + 34);
        makecylinder(0.4, 0.4, 6, 8, 0x888870, ox + 34, 3, oz + 34);
        // Gothic canopy top (cone)
        makecone(4, 5, 8, 0x888870, ox + 32, 9.5, oz + 32);
        // Canopy flat cap
        makebox(8, 0.3, 8, 0x888870, ox + 32, 6.15, oz + 32);

        // ---- 6. Winchester High Street ----
        // Main road surface 4x0.2x50
        makebox(4, 0.2, 50, 0x998866, ox + 20, 0.1, oz + 0);
        // 10 varied buildings along the street
        makebox(5, 6, 5, 0xBBAA88, ox + 15, 3, oz - 20);
        makebox(6, 7, 5, 0xCC9966, ox + 15, 3.5, oz - 14);
        makebox(5, 5, 5, 0xBBAA88, ox + 15, 2.5, oz - 8);
        makebox(7, 8, 5, 0xCC9966, ox + 15, 4, oz - 2);
        makebox(5, 6, 5, 0xBBAA88, ox + 15, 3, oz + 4);
        makebox(8, 5, 5, 0xCC9966, ox + 25, 2.5, oz - 18);
        makebox(5, 7, 5, 0xBBAA88, ox + 25, 3.5, oz - 12);
        makebox(6, 6, 5, 0xCC9966, ox + 25, 3, oz - 6);
        makebox(5, 5, 5, 0xBBAA88, ox + 25, 2.5, oz + 0);
        // Guildhall 14x8x9
        makebox(14, 9, 8, 0xBBAA88, ox + 25, 4.5, oz + 10);

        // ---- 7. City wall ----
        // 3 wall sections 12x0.8x4
        makebox(12, 4, 0.8, 0x888866, ox - 30, 2, oz - 30);
        makebox(12, 4, 0.8, 0x888866, ox - 42, 2, oz - 30);
        makebox(0.8, 4, 12, 0x888866, ox - 48, 2, oz - 24);
        // Westgate 8x5x10 with archway passage
        makebox(8, 10, 5, 0x888866, ox - 30, 5, oz - 45);
        // Archway passage gap (top section)
        makebox(8, 4, 5, 0x888866, ox - 30, 12, oz - 45);
        // Arch sides
        makebox(2, 10, 5, 0x888866, ox - 35, 5, oz - 45);
        makebox(2, 10, 5, 0x888866, ox - 25, 5, oz - 45);

        // ---- 8. St Giles Hill — viewpoint mound ----
        // Cone hill 15r x 8h
        makecone(15, 8, 16, 0x6A7A30, ox + 60, 4, oz - 60);
        // Fair site flat on top 15x0.3x15
        makebox(15, 0.3, 15, 0x7A8A40, ox + 60, 8.15, oz - 60);

        // ---- 9. King Alfred statue ----
        // Pedestal cylinder 2r x 3h
        makecylinder(2, 2, 3, 12, 0x888880, ox + 35, 1.5, oz + 60);
        // Body box 0.8x2x0.5
        makebox(0.8, 2, 0.5, 0xB87333, ox + 35, 4, oz + 60);
        // Head sphere 0.4r
        makesphere(0.4, 8, 8, 0xB87333, ox + 35, 5.4, oz + 60);
        // Sword box 0.15x4x0.1
        makebox(0.15, 4, 0.1, 0xB87333, ox + 35.6, 4.5, oz + 60);
        // Shield box small
        makebox(0.1, 0.8, 0.6, 0xB87333, ox + 34.5, 4, oz + 60);

        // ---- 10. River Itchen ----
        // Chalk stream flat 2x0.2x60
        makebox(2, 0.2, 60, 0x44AACC, ox - 80, 0.1, oz + 10);
        // Water meadows 30x0.3x20
        makebox(30, 0.3, 20, 0x558830, ox - 90, 0.15, oz + 10);
        // Riverside vegetation — a few small boxes
        makebox(1, 2, 1, 0x337722, ox - 79, 1, oz - 10);
        makebox(1, 3, 1, 0x337722, ox - 81, 1.5, oz + 0);
        makebox(1, 2.5, 1, 0x337722, ox - 79, 1.25, oz + 15);
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
