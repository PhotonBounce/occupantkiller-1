window.FortWilliamBase = (function() {
    'use strict';

    var WORLD_X = 1750;
    var WORLD_Z = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildBenNevis(scene) {
        var bx = WORLD_X - 80;
        var bz = WORLD_Z - 120;

        var layers = [
            { w: 120, h: 40, d: 110, color: 0x6B7B5E, y: 20 },
            { w: 95,  h: 45, d: 88,  color: 0x7A8C6A, y: 62 },
            { w: 74,  h: 50, d: 68,  color: 0x8A7060, y: 109 },
            { w: 56,  h: 55, d: 52,  color: 0x9E9080, y: 161 },
            { w: 38,  h: 50, d: 36,  color: 0xC8C0B8, y: 213 },
            { w: 22,  h: 36, d: 20,  color: 0xFFFFFF, y: 254 }
        ];

        var i;
        for (i = 0; i < layers.length; i++) {
            var l = layers[i];
            scene.add(makeBox(l.w, l.h, l.d, l.color, bx, l.y, bz));
        }

        scene.add(makeSphere(10, 8, 6, 0xFFFFFF, bx, 275, bz));
    }

    function buildOldFort(scene) {
        var fx = WORLD_X - 20;
        var fz = WORLD_Z + 60;

        var walls = [
            { w: 28, h: 5, d: 2.5, x: fx,      y: 2.5, z: fz },
            { w: 28, h: 5, d: 2.5, x: fx,      y: 2.5, z: fz + 26 },
            { w: 2.5, h: 5, d: 26, x: fx - 13, y: 2.5, z: fz + 13 },
            { w: 2.5, h: 5, d: 12, x: fx + 13, y: 2.5, z: fz + 6 },
            { w: 2.5, h: 3, d: 8,  x: fx + 13, y: 1.5, z: fz + 22 },
            { w: 6,  h: 3,  d: 2.5, x: fx - 4, y: 1.5, z: fz + 13 },
            { w: 10, h: 4,  d: 2.5, x: fx + 5, y: 2.0, z: fz - 1 },
            { w: 4,  h: 2,  d: 4,   x: fx - 12, y: 1.0, z: fz + 26 }
        ];

        var i;
        for (i = 0; i < walls.length; i++) {
            var w = walls[i];
            scene.add(makeBox(w.w, w.h, w.d, 0x8A7A6A, w.x, w.y, w.z));
        }

        scene.add(makeSphere(1.8, 6, 5, 0x8A7A6A, fx - 13, 6.3, fz));
        scene.add(makeSphere(1.8, 6, 5, 0x8A7A6A, fx + 13, 6.3, fz));
        scene.add(makeSphere(1.8, 6, 5, 0x8A7A6A, fx - 13, 6.3, fz + 26));
    }

    function buildAluminiumSmelter(scene) {
        var sx = WORLD_X + 60;
        var sz = WORLD_Z + 20;

        scene.add(makeBox(50, 18, 32, 0x6A6A6A, sx,       9,  sz));
        scene.add(makeBox(32, 14, 22, 0x6A6A6A, sx + 42,  7,  sz - 4));
        scene.add(makeBox(28, 22, 18, 0x6A6A6A, sx - 42,  11, sz + 6));
        scene.add(makeBox(20, 10, 28, 0x6A6A6A, sx + 4,   5,  sz + 36));
        scene.add(makeBox(24, 12, 16, 0x5A5A5A, sx + 22,  6,  sz - 28));
        scene.add(makeBox(36, 8,  20, 0x787878, sx - 20,  4,  sz - 24));

        scene.add(makeCylinder(3, 4, 60, 8, 0x5A5A5A, sx + 10, 30, sz - 8));
        scene.add(makeCylinder(2.5, 3.2, 48, 8, 0x5A5A5A, sx - 8, 24, sz + 10));
        scene.add(makeCylinder(3.5, 4.5, 42, 8, 0x646464, sx + 30, 21, sz + 14));

        scene.add(makeCylinder(4, 4, 2, 8, 0x888888, sx + 10, 61, sz - 8));
        scene.add(makeCylinder(3.2, 3.2, 2, 8, 0x888888, sx - 8, 49, sz + 10));
        scene.add(makeCylinder(4.5, 4.5, 2, 8, 0x888888, sx + 30, 43, sz + 14));
    }

    function buildGondolaPylons(scene) {
        var startX = WORLD_X - 30;
        var startZ = WORLD_Z - 10;
        var endX   = WORLD_X - 74;
        var endZ   = WORLD_Z - 90;

        var numPylons = 6;
        var i;
        for (i = 0; i < numPylons; i++) {
            var t = i / (numPylons - 1);
            var px = startX + t * (endX - startX);
            var pz = startZ + t * (endZ - startZ);
            var elevation = t * 22;

            scene.add(makeCylinder(0.5, 0.5, 14, 6, 0xA0A0A0, px, elevation + 7, pz));

            scene.add(makeBox(6, 0.6, 0.6, 0x909090, px, elevation + 14.3, pz));

            scene.add(makeSphere(0.7, 6, 4, 0x787878, px - 3, elevation + 14.3, pz));
            scene.add(makeSphere(0.7, 6, 4, 0x787878, px + 3, elevation + 14.3, pz));
        }
    }

    function buildRailwayStation(scene) {
        var rx = WORLD_X + 10;
        var rz = WORLD_Z + 100;

        scene.add(makeBox(16, 6, 8, 0xD4A97A, rx, 3, rz));

        scene.add(makeCone(4, 3, 4, 0x8B4A2A, rx, 7.5, rz));

        scene.add(makeBox(20, 0.4, 6, 0xB0B0A0, rx + 2, 0.2, rz + 10));

        scene.add(makeBox(0.2, 1.2, 6, 0x444444, rx - 8, 0.8, rz + 10));
        scene.add(makeBox(0.2, 1.2, 6, 0x444444, rx,     0.8, rz + 10));
        scene.add(makeBox(0.2, 1.2, 6, 0x444444, rx + 8, 0.8, rz + 10));

        scene.add(makeBox(6, 8, 5, 0xC49060, rx + 14, 4, rz));
        scene.add(makeCone(3, 2.5, 4, 0x8B4A2A, rx + 14, 9.25, rz));

        scene.add(makeBox(0.4, 5, 0.4, 0x333333, rx + 14, 2.5, rz + 4));
        scene.add(makeBox(2.5, 0.3, 0.3, 0xAA2222, rx + 15.25, 5.0, rz + 4));
        scene.add(makeBox(2.5, 0.3, 0.3, 0xAA2222, rx + 15.25, 3.5, rz + 4));

        scene.add(makeBox(16, 4, 2, 0xD4A97A, rx, 2, rz - 6));
        scene.add(makeBox(0.6, 4, 0.6, 0x5A4030, rx - 7, 2, rz - 7.3));
        scene.add(makeBox(0.6, 4, 0.6, 0x5A4030, rx,     2, rz - 7.3));
        scene.add(makeBox(0.6, 4, 0.6, 0x5A4030, rx + 7, 2, rz - 7.3));
        scene.add(makeBox(16, 0.4, 2.6, 0xA09080, rx, 4.2, rz - 6.3));
    }

    function buildCommandoPillboxes(scene) {
        var vx = WORLD_X - 50;
        var vz = WORLD_Z + 140;

        var positions = [
            { x: vx,       z: vz },
            { x: vx + 28,  z: vz - 6 },
            { x: vx + 56,  z: vz + 4 },
            { x: vx + 84,  z: vz - 2 },
            { x: vx + 112, z: vz + 8 }
        ];

        var i;
        for (i = 0; i < positions.length; i++) {
            var p = positions[i];

            scene.add(makeBox(5, 2.5, 5, 0x909090, p.x, 1.25, p.z));
            scene.add(makeBox(5.4, 0.4, 5.4, 0x808080, p.x, 2.7, p.z));

            scene.add(makeBox(0.3, 1.2, 1.8, 0x606060, p.x - 2.65, 1.6, p.z));
            scene.add(makeBox(0.3, 1.2, 1.8, 0x606060, p.x + 2.65, 1.6, p.z));
            scene.add(makeBox(1.8, 1.2, 0.3, 0x606060, p.x, 1.6, p.z - 2.65));
            scene.add(makeBox(1.8, 1.2, 0.3, 0x606060, p.x, 1.6, p.z + 2.65));
        }

        scene.add(makeBox(112, 0.2, 3, 0xC8C8B8, vx + 56, 0.1, vz + 20));
    }

    function buildLineSegmentMarkers(scene) {
        var geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        var mat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

        var points = [
            [WORLD_X - 200, 0.25, WORLD_Z - 200],
            [WORLD_X + 200, 0.25, WORLD_Z - 200],
            [WORLD_X + 200, 0.25, WORLD_Z + 200],
            [WORLD_X - 200, 0.25, WORLD_Z + 200]
        ];

        var i;
        for (i = 0; i < points.length; i++) {
            var marker = new THREE.Mesh(geo, mat);
            marker.position.set(points[i][0], points[i][1], points[i][2]);
            scene.add(marker);
        }
    }

    function buildAmbientDetails(scene) {
        var i;

        for (i = 0; i < 5; i++) {
            var tx = WORLD_X - 60 + i * 18;
            var tz = WORLD_Z + 80;
            scene.add(makeCylinder(0.3, 0.5, 4, 5, 0x4A3A2A, tx, 2, tz));
            scene.add(makeCone(1.5, 5, 5, 0x2A5A2A, tx, 6.5, tz));
        }

        scene.add(makeBox(80, 0.3, 30, 0x7A8070, WORLD_X - 10, 0.15, WORLD_Z + 70));

        scene.add(makeBox(4, 3, 4, 0xA09080, WORLD_X + 35, 1.5, WORLD_Z + 88));
        scene.add(makeBox(3, 3, 3, 0x909080, WORLD_X + 42, 1.5, WORLD_Z + 92));
        scene.add(makeBox(3.5, 2.5, 3.5, 0xB0A090, WORLD_X + 28, 1.25, WORLD_Z + 95));

        scene.add(makeCylinder(1, 1.4, 8, 6, 0xB8B0A0, WORLD_X + 55, 4, WORLD_Z + 50));
        scene.add(makeCone(2, 2, 6, 0x9A8880, WORLD_X + 55, 9, WORLD_Z + 50));
    }

    function build(scene) {
        buildBenNevis(scene);
        buildOldFort(scene);
        buildAluminiumSmelter(scene);
        buildGondolaPylons(scene);
        buildRailwayStation(scene);
        buildCommandoPillboxes(scene);
        buildLineSegmentMarkers(scene);
        buildAmbientDetails(scene);
    }

    return {
        build: build,
        WORLD_X: WORLD_X,
        WORLD_Z: WORLD_Z
    };

}());
