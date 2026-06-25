window.SevenSisters = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 16520;
    var OFFSET_Z = 0;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildCliffPeaks() {
        var heights = [20, 18, 22, 19, 24, 17, 21];
        var spacing = 10;
        for (var i = 0; i < 7; i++) {
            var h = heights[i];
            var px = i * (12 + spacing) - 3 * (12 + spacing);
            makeBox(12, h, 15, 0xFFFFF0, px, h / 2, 0);
        }
    }

    function buildCliffBases() {
        var heights = [20, 18, 22, 19, 24, 17, 21];
        var spacing = 10;
        for (var i = 0; i < 7; i++) {
            var px = i * (12 + spacing) - 3 * (12 + spacing);
            makeBox(12, 4, 4, 0xE8E8DC, px, 2, -2);
        }
    }

    function buildSea() {
        var tilePositions = [
            [-60, -30], [-20, -30], [20, -30],
            [-60, -60], [-20, -60], [20, -60]
        ];
        for (var i = 0; i < tilePositions.length; i++) {
            makeBox(30, 0.5, 25, 0x006994, tilePositions[i][0], 0, tilePositions[i][1]);
        }
        var sprayPositions = [
            [-55, 1.5, -8], [0, 1.5, -8], [50, 1.5, -8]
        ];
        for (var j = 0; j < sprayPositions.length; j++) {
            makeSphere(1.5, 0xFFFFFF, sprayPositions[j][0], sprayPositions[j][1], sprayPositions[j][2]);
        }
    }

    function buildDownsGrassland() {
        var grassPositions = [
            -80, -55, -30, -5, 20, 45, 70, 95
        ];
        for (var i = 0; i < 8; i++) {
            makeBox(20, 3, 15, 0x4A9A4A, grassPositions[i], 1.5, 25);
        }
    }

    function buildSheep() {
        var sheepData = [
            [-75, 0, 20], [-60, 0, 28], [-45, 0, 22],
            [-30, 0, 30], [-15, 0, 25], [0, 0, 32],
            [15, 0, 20], [30, 0, 27], [45, 0, 22],
            [60, 0, 30], [75, 0, 25], [-70, 0, 35],
            [-20, 0, 38], [25, 0, 35], [65, 0, 33]
        ];
        for (var i = 0; i < sheepData.length; i++) {
            var sx = sheepData[i][0];
            var sy = sheepData[i][1];
            var sz = sheepData[i][2];
            makeSphere(1.5, 0xF5F5F0, sx, sy + 2.5, sz);
            makeBox(0.8, 1.5, 0.8, 0xF5F5F0, sx, sy + 1.0, sz);
            makeSphere(0.8, 0xF5F5F0, sx, sy + 4.3, sz);
        }
    }

    function buildCuckmereHaven() {
        makeBox(20, 0.5, 15, 0xD4C5A9, 0, 0, 55);
        makeBox(4, 0.5, 15, 0x4A90D4, 0, 0.1, 55);
        var meanderPositions = [
            [-3, 0.1, 45], [2, 0.1, 37], [-2, 0.1, 29]
        ];
        for (var i = 0; i < meanderPositions.length; i++) {
            makeBox(3, 0.5, 8, 0x4A90D4, meanderPositions[i][0], meanderPositions[i][1], meanderPositions[i][2]);
        }
    }

    function buildCottages() {
        var cottagePositions = [-25, -12, 1, 14];
        for (var i = 0; i < 4; i++) {
            var cx = cottagePositions[i];
            makeBox(6, 8, 5, 0xFFFFF0, cx, 4, 35);
            makeBox(1, 4, 1, 0xCC5500, cx, 12, 35);
            makeBox(4, 1, 2, 0x2D7A2D, cx, 0.5, 32);
        }
    }

    function buildSouthDownsWay() {
        makeBox(3, 0.4, 70, 0xF0E8D0, 0, 0.2, 15);
        var postPositions = [-25, -8, 8, 25];
        for (var i = 0; i < 4; i++) {
            makeBox(0.4, 6, 0.4, 0x4A2C0A, postPositions[i], 3, 15);
            makeBox(1, 1, 0.3, 0xFFD700, postPositions[i], 6.5, 15);
        }
    }

    function buildSeafordHead() {
        makeBox(30, 25, 20, 0xFFFFF0, 100, 12.5, 0);
        makeBox(6, 3, 6, 0x666666, 100, 26, 0);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function build() {
        buildCliffPeaks();
        buildCliffBases();
        buildSea();
        buildDownsGrassland();
        buildSheep();
        buildCuckmereHaven();
        buildCottages();
        buildSouthDownsWay();
        buildSeafordHead();
    }

    function update(delta) {
        // static environment — no per-frame updates needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) objects[i].geometry.dispose();
            if (objects[i].material) objects[i].material.dispose();
        }
        objects = [];
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
