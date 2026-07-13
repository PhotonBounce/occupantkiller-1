window.TowerLondon = (function() {
    'use strict';

    var OX = 4600;
    var OZ = 2200;
    var objects = [];
    var scene = null;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildwhitetower() {
        // Central Norman keep 16x18x16
        makebox(16, 18, 16, 0xF5F5F5, 0, 9, 0);

        // Crown Jewels vault suggestion — brighter inner box
        makebox(6, 4, 6, 0xFFFFCC, 0, 3, 0);

        // 4 corner turrets — CylinderGeometry radius 2, height 20
        var turretOffsets = [
            [-9, -9],
            [9, -9],
            [-9, 9],
            [9, 9]
        ];
        for (var i = 0; i < turretOffsets.length; i++) {
            var tx = turretOffsets[i][0];
            var tz = turretOffsets[i][1];
            makecylinder(2, 2, 20, 8, 0xF0F0F0, tx, 10, tz);
            // Cone cap on each turret
            makecone(2.5, 4, 8, 0xCCCCCC, tx, 22, tz);
        }
    }

    function buildouterward() {
        // Perimeter curtain wall — 50x45 footprint, 6 tall, hollow box walls
        var wallColor = 0x888888;
        var wallH = 6;
        // North wall
        makebox(50, wallH, 2, wallColor, 0, wallH / 2, -23.5);
        // South wall
        makebox(50, wallH, 2, wallColor, 0, wallH / 2, 23.5);
        // East wall
        makebox(2, wallH, 45, wallColor, 25, wallH / 2, 0);
        // West wall
        makebox(2, wallH, 45, wallColor, -25, wallH / 2, 0);

        // 13 mural towers Box 4x10x4 at intervals around perimeter
        var muralColor = 0x888888;
        // North wall towers
        makebox(4, 10, 4, muralColor, -20, 5, -24);
        makebox(4, 10, 4, muralColor, 0, 5, -24);
        makebox(4, 10, 4, muralColor, 20, 5, -24);
        // South wall towers
        makebox(4, 10, 4, muralColor, -20, 5, 24);
        makebox(4, 10, 4, muralColor, 0, 5, 24);
        makebox(4, 10, 4, muralColor, 20, 5, 24);
        // East wall towers
        makebox(4, 10, 4, muralColor, 26, 5, -15);
        makebox(4, 10, 4, muralColor, 26, 5, 0);
        makebox(4, 10, 4, muralColor, 26, 5, 15);
        // West wall towers
        makebox(4, 10, 4, muralColor, -26, 5, -15);
        makebox(4, 10, 4, muralColor, -26, 5, 0);
        makebox(4, 10, 4, muralColor, -26, 5, 15);
        // Corner tower
        makebox(4, 10, 4, muralColor, 26, 5, -24);
    }

    function buildtraitsgate() {
        // Traitors Gate in south wall — watergate entrance from Thames
        // Left pier
        makebox(2, 5, 2, 0x777777, -4, 2.5, 23.5);
        // Right pier
        makebox(2, 5, 2, 0x777777, 4, 2.5, 23.5);
        // Arch lintel
        makebox(6, 1, 2, 0x777777, 0, 5.5, 23.5);
        // Portcullis hanging in arch
        makebox(5, 4, 0.3, 0x444444, 0, 3, 23.5);
    }

    function buildbloodytower() {
        // Bloody Tower gatehouse 8x12x6
        makebox(8, 12, 6, 0x888888, -18, 6, 10);
        // Portcullis slot
        makebox(3, 5, 0.3, 0x333333, -18, 4, 7);
    }

    function buildtowerbridge() {
        var bridgeX = 55;
        var bridgeColor = 0x888888;
        var steelColor = 0x4682B4;

        // North Gothic tower
        makebox(8, 20, 6, bridgeColor, bridgeX, 10, -5);
        // North tower pinnacles
        makecone(1.5, 5, 8, 0x777777, bridgeX - 3, 22.5, -5);
        makecone(1.5, 5, 8, 0x777777, bridgeX + 3, 22.5, -5);

        // South Gothic tower
        makebox(8, 20, 6, bridgeColor, bridgeX, 10, 5);
        // South tower pinnacles
        makecone(1.5, 5, 8, 0x777777, bridgeX - 3, 22.5, 5);
        makecone(1.5, 5, 8, 0x777777, bridgeX + 3, 22.5, 5);

        // High walkway between towers (top level)
        makebox(6, 1.5, 40, steelColor, bridgeX, 19, 0);

        // Low road level bascule bridge deck
        makebox(6, 1.5, 40, steelColor, bridgeX, 6, 0);

        // West steel side span
        makebox(6, 1.5, 20, steelColor, bridgeX - 20, 6, -5);
        // East steel side span
        makebox(6, 1.5, 20, steelColor, bridgeX + 20, 6, 5);
    }

    function buildthames() {
        // Thames foreshore water surface
        makebox(80, 1, 10, 0x4169E1, 55, 0, 0);
    }

    function buildhmsbelfast() {
        var shipX = 40;
        var shipZ = 35;

        // Hull
        makebox(40, 8, 10, 0x808080, shipX, 4, shipZ);

        // Superstructure
        makebox(20, 4, 6, 0x909090, shipX, 10, shipZ);

        // Gun turrets — Box approximation
        makebox(4, 2, 4, 0x707070, shipX - 14, 9, shipZ);
        makebox(4, 2, 4, 0x707070, shipX + 14, 9, shipZ);
        makebox(4, 2, 4, 0x707070, shipX, 9, shipZ);

        // Gun barrels
        makebox(6, 0.5, 0.5, 0x606060, shipX - 14, 10.5, shipZ - 3);
        makebox(6, 0.5, 0.5, 0x606060, shipX + 14, 10.5, shipZ - 3);

        // Funnels — CylinderGeometry
        makecylinder(1, 1.2, 5, 8, 0x555555, shipX - 2, 15, shipZ);
        makecylinder(1, 1.2, 5, 8, 0x555555, shipX + 2, 15, shipZ);

        // Mast
        makecylinder(0.2, 0.2, 12, 6, 0x666666, shipX - 10, 18, shipZ);
    }

    function buildyeomanwarder() {
        // Beefeater guard at main gate (west wall)
        var gx = -28;
        var gz = 0;

        // Body — navy blue
        makebox(1.5, 3, 1, 0x000080, gx, 2.5, gz);
        // Head
        makebox(1, 1, 1, 0xFFCCAA, gx, 4.5, gz);
        // Hat
        makebox(1.2, 0.8, 1.2, 0x000000, gx, 5.3, gz);
        // Red sash / livery detail
        makebox(1.6, 0.5, 1.1, 0xFF0000, gx, 2, gz);
        // Left arm
        makebox(0.5, 2, 0.5, 0x000080, gx - 1.1, 2.5, gz);
        // Right arm
        makebox(0.5, 2, 0.5, 0x000080, gx + 1.1, 2.5, gz);
        // Left leg
        makebox(0.6, 1.5, 0.6, 0x000080, gx - 0.5, 0.75, gz);
        // Right leg
        makebox(0.6, 1.5, 0.6, 0x000080, gx + 0.5, 0.75, gz);
    }

    function buildtowerhillscaffold() {
        // Tower Hill scaffold memorial site — outside castle to north-west
        var mx = -35;
        var mz = -35;

        // Memorial marker slab
        makebox(6, 0.3, 4, 0x555555, mx, 0.15, mz);
        // Execution block
        makebox(1.5, 0.8, 1, 0x8B4513, mx, 0.55, mz);
        // Upright post
        makebox(0.3, 4, 0.3, 0x6B3A1F, mx + 1, 2.5, mz + 0.5);
        // Cross beam
        makebox(3, 0.3, 0.3, 0x6B3A1F, mx, 4.65, mz + 0.5);
    }

    function buildground() {
        // Castle courtyard ground
        makebox(48, 0.5, 43, 0x9E8B6B, 0, -0.25, 0);
        // Outer moat / ground surrounding
        makebox(70, 0.5, 70, 0x7A9A5A, 0, -0.5, 0);
    }

    function init(sceneRef) {
        scene = sceneRef;
        objects = [];

        buildground();
        buildouterward();
        buildwhitetower();
        buildtraitsgate();
        buildbloodytower();
        buildthames();
        buildtowerbridge();
        buildhmsbelfast();
        buildyeomanwarder();
        buildtowerhillscaffold();
    }

    function update(delta) {
        // Static environment — no per-frame logic needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
    }

    return { init: init, update: update, reset: reset };
}());
