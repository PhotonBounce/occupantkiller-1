window.BeamishMuseum = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 21160;
    var OY = 0;
    var OZ = 0;

    function makeMesh(geometry, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z, rx, ry, rz) {
        return makeMesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z, rx, ry, rz) {
        return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), color, x, y, z, rx, ry, rz);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        return makeMesh(new THREE.SphereGeometry(r, ws, hs), color, x, y, z);
    }

    function makeCone(r, h, segs, color, x, y, z, rx, ry, rz) {
        return makeMesh(new THREE.ConeGeometry(r, h, segs), color, x, y, z, rx, ry, rz);
    }

    function addLines(points, color, x, y, z) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        line.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        scene.add(line);
        objects.push(line);
        return line;
    }

    function buildGround() {
        makeBox(400, 0.5, 200, 0x7a9c5a, 0, -0.25, 0);
    }

    function buildEdwardianHighStreet() {
        var shopColor = 0xCD5C5C;
        var facadeColor = 0xF5F0E8;
        var roofColor = 0x8B6355;
        var windowColor = 0x87CEEB;
        var i;
        var shopPositions = [-60, -40, -20, 0, 20, 40];
        var shopLabels = [shopColor, facadeColor, shopColor, facadeColor, shopColor, facadeColor];

        for (i = 0; i < shopPositions.length; i++) {
            var sx = shopPositions[i];
            var sc = shopLabels[i];
            makeBox(18, 10, 10, sc, sx, 5, -50);
            makeBox(18, 1, 10, roofColor, sx, 10.5, -50);
            makeBox(4, 3, 0.5, windowColor, sx - 4, 5, -45);
            makeBox(4, 3, 0.5, windowColor, sx + 4, 5, -45);
            makeBox(3, 6, 0.5, 0x8B4513, sx, 3, -45);
        }

        makeBox(22, 14, 12, 0xD4C9A8, -85, 7, -50);
        makeBox(22, 2, 12, 0x8B7355, -85, 15, -50);
        makeBox(5, 5, 0.5, windowColor, -85 - 6, 8, -44);
        makeBox(5, 5, 0.5, windowColor, -85 + 6, 8, -44);
        makeBox(3, 7, 0.5, 0x5C3317, -85, 3.5, -44);
        makeBox(8, 2, 0.5, 0x8B7355, -85, 13, -44);

        makeBox(26, 12, 12, 0xF5F0E8, 75, 6, -50);
        makeBox(26, 2, 12, 0x888888, 75, 13, -50);
        makeBox(5, 5, 0.5, windowColor, 75 - 7, 7, -44);
        makeBox(5, 5, 0.5, windowColor, 75 + 7, 7, -44);
        makeBox(2, 0.3, 12, 0xAAAAAA, 75, 5, -44);

        makeBox(22, 11, 10, 0xCD5C5C, -110, 5.5, -50);
        makeBox(22, 1, 10, 0x7B3B3B, -110, 11.5, -50);
        makeBox(6, 3, 0.5, windowColor, -110 - 5, 6, -45);
        makeBox(6, 3, 0.5, windowColor, -110 + 5, 6, -45);
        makeBox(4, 7, 0.5, 0x8B0000, -110, 3.5, -45);
        makeBox(12, 1, 0.5, 0xFFD700, -110, 10.5, -45);
    }

    function buildTownRoad() {
        makeBox(300, 0.2, 12, 0x555555, 0, 0.1, -30);
        makeBox(300, 0.05, 2, 0xAAAAAA, 0, 0.15, -24);
        makeBox(300, 0.05, 2, 0xAAAAAA, 0, 0.15, -36);
        makeBox(300, 0.6, 3, 0xBBBBBB, 0, 0.3, -20);
        makeBox(300, 0.6, 3, 0xBBBBBB, 0, 0.3, -42);
    }

    function buildTramcar() {
        var tx = -20;
        var tz = -30;
        makeBox(12, 4, 4, 0xCC4444, tx, 4, tz);
        makeBox(12, 3, 4, 0xF5F0E8, tx, 7.5, tz);
        makeBox(0.3, 0.3, 4, 0x333333, tx - 5, 6, tz - 2);
        makeBox(0.3, 0.3, 4, 0x333333, tx + 5, 6, tz - 2);
        makeBox(0.3, 0.3, 4, 0x333333, tx - 5, 6, tz + 2);
        makeBox(0.3, 0.3, 4, 0x333333, tx + 5, 6, tz + 2);
        makeBox(12, 0.5, 4.5, 0xCC4444, tx, 9.2, tz);
        makeCyl(0.7, 0.7, 0.4, 12, 0x333333, tx - 4, 1.5, tz - 2.2);
        makeCyl(0.7, 0.7, 0.4, 12, 0x333333, tx + 4, 1.5, tz - 2.2);
        makeCyl(0.7, 0.7, 0.4, 12, 0x333333, tx - 4, 1.5, tz + 2.2);
        makeCyl(0.7, 0.7, 0.4, 12, 0x333333, tx + 4, 1.5, tz + 2.2);
        makeBox(0.3, 5, 0.3, 0xCCCC00, tx - 5.5, 11.5, tz);
        makeBox(0.2, 0.2, 300, 0x888888, 0, 0.15, tz - 0.9);
        makeBox(0.2, 0.2, 300, 0x888888, 0, 0.15, tz + 0.9);
    }

    function buildGaslamps() {
        var i;
        var lampPositions = [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80];
        for (i = 0; i < lampPositions.length; i++) {
            makeCyl(0.15, 0.2, 6, 8, 0x444444, lampPositions[i], 3, -22);
            makeSphere(0.4, 8, 8, 0xFFFF88, lampPositions[i], 6.5, -22);
        }
    }

    function buildCollieryVillage() {
        var cottageColor = 0x555555;
        var roofColor = 0x333333;
        var j;
        var cottageRow = [40, 60, 80, 100, 120];

        for (j = 0; j < cottageRow.length; j++) {
            makeBox(9, 5, 7, cottageColor, cottageRow[j], 2.5, 40);
            makeBox(9, 1.5, 7.5, roofColor, cottageRow[j], 6.25, 40, 0.2, 0, 0);
            makeBox(1.5, 3, 0.4, 0x8B7355, cottageRow[j] - 2, 1.5, 36.8);
            makeCyl(0.4, 0.5, 3, 8, 0x666666, cottageRow[j] + 3, 8, 40);

            makeBox(9, 5, 7, cottageColor, cottageRow[j], 2.5, 55);
            makeBox(9, 1.5, 7.5, roofColor, cottageRow[j], 6.25, 55, 0.2, 0, 0);
            makeBox(1.5, 3, 0.4, 0x8B7355, cottageRow[j] - 2, 1.5, 51.8);
            makeCyl(0.4, 0.5, 3, 8, 0x666666, cottageRow[j] + 3, 8, 55);
        }

        makeBox(18, 12, 12, 0x888888, 160, 6, 47);
        makeCone(5, 10, 4, 0x666666, 160, 17, 47);
        makeCyl(1.5, 2, 30, 12, 0x555555, 175, 15, 47);
        makeBox(5, 5, 5, 0x444444, 160, 5, 60);
        makeBox(6, 3, 4, 0x777777, 160, 1.5, 35);

        makeBox(14, 9, 10, 0x888888, 30, 4.5, 47);
        makeCone(7, 5, 4, 0x777777, 30, 12.5, 47);
        makeBox(6, 7, 0.5, 0x6B6B6B, 30, 3.5, 42);
        makeBox(2, 3, 0.5, 0x8B7355, 30, 1.5, 42);

        makeBox(12, 8, 9, 0x666666, 5, 4, 47);
        makeBox(12, 2, 9, 0x444444, 5, 9, 47);
        makeBox(3, 5, 0.5, 0x87CEEB, 5 - 3, 4, 42.5);
        makeBox(3, 5, 0.5, 0x87CEEB, 5 + 3, 4, 42.5);
        makeCone(0.8, 3, 4, 0x555555, 5, 11.5, 47);
    }

    function buildWaggonway() {
        var rcolor = 0x5a3e28;
        makeBox(0.3, 0.3, 120, 0x5a3e28, -30, 0.25, 80);
        makeBox(0.3, 0.3, 120, 0x5a3e28, -30, 0.25, 80, 0, 0, 0);
        makeBox(0.3, 0.3, 120, 0x5a3e28, -27, 0.25, 80);
        var sleepers = [-40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70];
        var s;
        for (s = 0; s < sleepers.length; s++) {
            makeBox(5, 0.4, 0.8, 0x3d2b1a, -30, 0.2, 80 + sleepers[s]);
        }

        var lx = -30;
        var lz = 60;
        makeCyl(1.5, 1.5, 8, 12, 0x8B7355, lx, 2.5, lz, 0, 0, Math.PI / 2);
        makeCyl(0.8, 0.8, 3, 12, 0x555555, lx - 3, 2.5, lz);
        makeBox(3, 1, 4, 0x5a3e28, lx + 2, 1, lz);
        makeCyl(1.0, 1.0, 0.4, 16, 0x333333, lx - 6, 1.2, lz - 1.5);
        makeCyl(1.0, 1.0, 0.4, 16, 0x333333, lx - 6, 1.2, lz + 1.5);
        makeCyl(0.6, 0.6, 0.4, 16, 0x333333, lx + 6, 1.2, lz - 1.5);
        makeCyl(0.6, 0.6, 0.4, 16, 0x333333, lx + 6, 1.2, lz + 1.5);
        makeBox(1, 3, 2, 0x555555, lx - 2, 2.5, lz);
        makeCyl(0.4, 0.4, 4, 8, 0x777777, lx - 1, 4, lz, 0, 0, Math.PI / 3);
        makeSphere(0.5, 8, 8, 0x333333, lx - 3, 6, lz);

        var wx = -30;
        var wz = 100;
        makeBox(5, 2, 2.5, rcolor, wx, 1.5, wz);
        makeBox(5, 2, 2.5, rcolor, wx, 1.5, wz + 6);
        makeCyl(0.5, 0.5, 0.3, 12, 0x333333, wx - 2, 0.8, wz - 1.3);
        makeCyl(0.5, 0.5, 0.3, 12, 0x333333, wx + 2, 0.8, wz - 1.3);
        makeCyl(0.5, 0.5, 0.3, 12, 0x333333, wx - 2, 0.8, wz + 1.3);
        makeCyl(0.5, 0.5, 0.3, 12, 0x333333, wx + 2, 0.8, wz + 1.3);
    }

    function buildBandstand() {
        var bx = 20;
        var bz = -10;
        makeCyl(8, 8, 0.5, 12, 0xC8B89A, bx, 0.25, bz);
        makeCyl(0.4, 0.4, 4, 8, 0xC8B89A, bx - 6, 2, bz - 0);
        makeCyl(0.4, 0.4, 4, 8, 0xC8B89A, bx + 6, 2, bz);
        makeCyl(0.4, 0.4, 4, 8, 0xC8B89A, bx, 2, bz - 6);
        makeCyl(0.4, 0.4, 4, 8, 0xC8B89A, bx, 2, bz + 6);
        makeCyl(0.4, 0.4, 4, 8, 0xC8B89A, bx - 4.2, 2, bz - 4.2);
        makeCyl(0.4, 0.4, 4, 8, 0xC8B89A, bx + 4.2, 2, bz - 4.2);
        makeCyl(0.4, 0.4, 4, 8, 0xC8B89A, bx - 4.2, 2, bz + 4.2);
        makeCyl(0.4, 0.4, 4, 8, 0xC8B89A, bx + 4.2, 2, bz + 4.2);
        makeCone(9, 5, 12, 0x8B7355, bx, 7, bz);
        makeCyl(0.3, 0.3, 6, 8, 0xC8B89A, bx, 3, bz);
    }

    function buildBeamishHall() {
        var hx = -140;
        var hz = -80;
        makeBox(50, 16, 30, 0xD4C9B0, hx, 8, hz);
        makeBox(50, 2, 30, 0xC4B49A, hx, 17, hz);
        makeBox(12, 18, 10, 0xD4C9B0, hx - 30, 9, hz);
        makeBox(12, 18, 10, 0xD4C9B0, hx + 30, 9, hz);
        makeBox(10, 5, 0.5, 0x87CEEB, hx - 15, 9, hz - 15);
        makeBox(10, 5, 0.5, 0x87CEEB, hx, 9, hz - 15);
        makeBox(10, 5, 0.5, 0x87CEEB, hx + 15, 9, hz - 15);
        makeBox(4, 9, 0.5, 0x8B7355, hx, 4.5, hz - 15);
        makeBox(50, 0.4, 30, 0xD4C9B0, hx, 19.2, hz);
        makeCyl(0.8, 0.8, 4, 8, 0xD4C9B0, hx - 8, 19.5, hz - 14);
        makeCyl(0.8, 0.8, 4, 8, 0xD4C9B0, hx + 8, 19.5, hz - 14);

        makeBox(80, 0.3, 50, 0x5a8a3a, hx - 50, 0.15, hz - 60);
        makeSphere(4, 8, 8, 0x2a6a1a, hx - 60, 5, hz - 50);
        makeSphere(3.5, 8, 8, 0x2a6a1a, hx - 70, 4, hz - 40);
        makeSphere(4, 8, 8, 0x2a7a2a, hx - 50, 5, hz - 70);
    }

    function buildDriftMine() {
        var mx = 80;
        var mz = 85;
        makeBox(8, 0.5, 1, 0x555555, mx, 0.25, mz);
        makeBox(0.5, 6, 0.5, 0x5a3e28, mx - 4, 3, mz);
        makeBox(0.5, 6, 0.5, 0x5a3e28, mx + 4, 3, mz);
        makeBox(9, 0.5, 0.5, 0x5a3e28, mx, 6, mz);
        makeBox(3, 4, 0.5, 0x333333, mx - 2.5, 2, mz);
        makeBox(3, 4, 0.5, 0x333333, mx + 2.5, 2, mz);
        makeBox(0.4, 4, 2, 0x5a3e28, mx - 3, 2, mz + 2);
        makeBox(0.4, 4, 2, 0x5a3e28, mx + 3, 2, mz + 2);
        makeBox(6, 0.3, 2, 0x5a3e28, mx, 4, mz + 2);
        makeCyl(0.3, 0.4, 5, 6, 0x333333, mx - 4, 3.5, mz + 1, 0, 0, 0.2);
        makeCyl(0.3, 0.4, 5, 6, 0x333333, mx + 4, 3.5, mz + 1, 0, 0, -0.2);
        makeBox(0.4, 6, 6, 0x444444, mx, 3, mz + 5);
    }

    function buildSunInn() {
        var px = -110;
        var pz = -50;
        makeBox(22, 11, 10, 0xCD5C5C, px, 5.5, pz);
        makeBox(22, 1.5, 10, 0x7B3B3B, px, 11.7, pz);
        makeBox(6, 4, 0.5, 0x87CEEB, px - 6, 7, pz - 5);
        makeBox(6, 4, 0.5, 0x87CEEB, px + 6, 7, pz - 5);
        makeBox(4, 7, 0.5, 0x8B0000, px, 3.5, pz - 5);
        makeBox(12, 1, 0.5, 0xFFD700, px, 10.5, pz - 5);
        makeBox(16, 0.4, 0.5, 0xFFD700, px, 6, pz - 5.1);
        makeCyl(0.15, 0.2, 3, 8, 0x444444, px - 9, 1.5, pz - 5);
        makeBox(2, 0.2, 0.5, 0xFFD700, px - 9, 3.2, pz - 5);
    }

    function buildDentist() {
        var dx = 62;
        var dz = -50;
        makeBox(16, 10, 9, 0xF5F0E8, dx, 5, dz);
        makeBox(16, 1, 9, 0x8B7355, dx, 10.5, dz);
        makeBox(5, 5, 0.5, 0x87CEEB, dx - 4, 6, dz - 4.5);
        makeBox(5, 5, 0.5, 0x87CEEB, dx + 4, 6, dz - 4.5);
        makeBox(2.5, 6, 0.5, 0x8B7355, dx, 3, dz - 4.5);
        makeBox(3, 5, 0.4, 0xD4C9B0, dx - 0.5, 4, dz - 2);
        makeCyl(0.6, 0.3, 4, 8, 0x888888, dx + 3, 2, dz - 2);
        makeBox(2, 0.3, 1.5, 0xC8B89A, dx + 3, 4.2, dz - 2);
    }

    function buildFairground() {
        var fx = 90;
        var fz = -20;
        makeCyl(0.5, 0.5, 7, 8, 0xCC4444, fx, 3.5, fz);
        makeCone(10, 4, 16, 0xCC4444, fx, 9, fz);
        makeCyl(8, 8, 0.4, 16, 0xFFD700, fx, 5, fz);
        var k;
        var horseAngles = [0, 0.785, 1.57, 2.356, 3.14, 3.927, 4.712, 5.497];
        for (k = 0; k < horseAngles.length; k++) {
            var hx2 = fx + Math.sin(horseAngles[k]) * 7;
            var hz2 = fz + Math.cos(horseAngles[k]) * 7;
            makeCyl(0.15, 0.15, 4, 6, 0xCC4444, hx2, 5, hz2);
            makeBox(1.5, 1, 0.8, 0xF5F0E8, hx2, 3.5, hz2);
            makeSphere(0.4, 6, 6, 0xF5F0E8, hx2, 4.3, hz2);
        }
        makeCyl(4, 4, 0.5, 16, 0xCC4444, fx + 20, 0.25, fz);
        makeCyl(4, 4, 0.5, 16, 0x8B0000, fx + 20, 3, fz);
        makeCyl(0.4, 0.4, 3, 8, 0xCC4444, fx + 20, 1.7, fz);
        makeBox(3, 8, 3, 0xFFD700, fx + 30, 4, fz);
        makeBox(3, 1, 3, 0xCC4444, fx + 30, 8.5, fz);
    }

    function buildChapel() {
        var cx = 10;
        var cz = 47;
        makeBox(14, 10, 12, 0x888888, cx, 5, cz);
        makeCone(7, 5, 4, 0x777777, cx, 12.5, cz);
        makeCyl(0.5, 0.5, 8, 4, 0x999999, cx, 14, cz);
        makeCone(0.8, 2, 4, 0x777777, cx, 18.5, cz);
        makeBox(3, 7, 0.5, 0x5a3e28, cx, 3.5, cz - 6);
        makeBox(4, 5, 0.5, 0x87CEEB, cx - 4, 6, cz - 6);
        makeBox(4, 5, 0.5, 0x87CEEB, cx + 4, 6, cz - 6);
    }

    function build() {
        buildGround();
        buildEdwardianHighStreet();
        buildTownRoad();
        buildTramcar();
        buildGaslamps();
        buildCollieryVillage();
        buildWaggonway();
        buildBandstand();
        buildBeamishHall();
        buildDriftMine();
        buildSunInn();
        buildDentist();
        buildFairground();
        buildChapel();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
