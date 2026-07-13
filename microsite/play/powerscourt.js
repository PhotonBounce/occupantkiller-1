window.Powerscourt = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 17520;
    var OZ = 0;

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, seg, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, seg);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildMansion() {
        // Main mansion body
        makeBox(50, 22, 20, 0xD4C5A9, 0, 11, 0);

        // Central pediment
        makeBox(20, 4, 6, 0xC8BAA0, 0, 24, -7);

        // 6 Ionic pilasters across facade
        var pilasterPositions = [-20, -12, -4, 4, 12, 20];
        var i;
        for (i = 0; i < pilasterPositions.length; i++) {
            makeCylinder(1.5, 1.5, 18, 6, 0xC8BAA0, pilasterPositions[i], 9, -10);
        }

        // 12 sash windows with white surrounds
        var windowRow1X = [-18, -10, -2, 6, 14];
        var windowRow2X = [-14, -6, 2, 10];
        var j;
        for (j = 0; j < windowRow1X.length; j++) {
            // White surround
            makeBox(2.5, 4.5, 0.5, 0xFFFFFF, windowRow1X[j], 12, -10.3);
            // Glass
            makeBox(2, 4, 0.3, 0x87CEEB, windowRow1X[j], 12, -10.5);
        }
        for (j = 0; j < windowRow2X.length; j++) {
            // White surround
            makeBox(2.5, 4.5, 0.5, 0xFFFFFF, windowRow2X[j], 6, -10.3);
            // Glass
            makeBox(2, 4, 0.3, 0x87CEEB, windowRow2X[j], 6, -10.5);
        }
        // Remaining 3 windows upper level other positions
        makeBox(2.5, 4.5, 0.5, 0xFFFFFF, -22, 12, -10.3);
        makeBox(2, 4, 0.3, 0x87CEEB, -22, 12, -10.5);
        makeBox(2.5, 4.5, 0.5, 0xFFFFFF, 22, 12, -10.3);
        makeBox(2, 4, 0.3, 0x87CEEB, 22, 12, -10.5);
        makeBox(2.5, 4.5, 0.5, 0xFFFFFF, 18, 6, -10.3);
        makeBox(2, 4, 0.3, 0x87CEEB, 18, 6, -10.5);
    }

    function buildItalianGarden() {
        // 3 descending terrace levels
        makeBox(60, 2, 20, 0xD0C8B0, 0, -1, 30);
        makeBox(56, 2, 20, 0xD0C8B0, 0, -3, 52);
        makeBox(52, 2, 20, 0xD0C8B0, 0, -5, 74);

        // Ornamental wrought iron gates - 2 gate panels
        makeBox(12, 12, 0.5, 0x222222, -20, 6, 20);
        makeBox(12, 12, 0.5, 0x222222, 20, 6, 20);

        // 16 bars total - 8 per gate
        var b;
        for (b = 0; b < 8; b++) {
            makeBox(0.5, 10, 0.5, 0x333333, -20 + (-5.25 + b * 1.5), 6, 20.3);
        }
        for (b = 0; b < 8; b++) {
            makeBox(0.5, 10, 0.5, 0x333333, 20 + (-5.25 + b * 1.5), 6, 20.3);
        }
    }

    function buildTritonLake() {
        // Lake
        makeCylinder(20, 20, 1, 16, 0x1B6CA8, 0, -6.5, 110);

        // Winged horse plinth
        makeBox(3, 6, 3, 0x777777, 0, -3.5, 110);

        // Horse body
        makeBox(4, 3, 6, 0x888888, 0, 0.5, 110);

        // Wings
        makeBox(1, 6, 8, 0x888888, -3, 2, 110);
        makeBox(1, 6, 8, 0x888888, 3, 2, 110);
    }

    function buildJapaneseGardens() {
        // 8 boxed hedges
        var hx;
        var hedgeXPositions = [-35, -23, -11, 1, 13, 25, 37, 49];
        for (hx = 0; hx < hedgeXPositions.length; hx++) {
            makeBox(1.5, 3, 12, 0x1A4A1A, hedgeXPositions[hx], 1.5, 160);
        }

        // 3 stone lanterns - each has base cylinder + cone cap
        var lx;
        var lanternPositions = [-20, 0, 20];
        for (lx = 0; lx < lanternPositions.length; lx++) {
            makeCylinder(2, 2, 4, 6, 0xC8C0B0, lanternPositions[lx], 2, 170);
            makeCone(2.5, 3, 6, 0xC8C0B0, lanternPositions[lx], 5.5, 170);
        }

        // Stream
        makeBox(2, 0.5, 20, 0x1B6CA8, 0, -0.25, 180);

        // Curved red bridge over stream
        makeBox(3, 1, 12, 0xCC0000, 0, 0.5, 180);
    }

    function buildWaterfall() {
        // Rocky cliff behind
        makeBox(15, 50, 8, 0x5A5040, 0, 25, 240);
        makeBox(12, 40, 6, 0x5A5040, 4, 20, 236);

        // 3 cascade sections stacked to imply fall
        makeBox(4, 40, 4, 0x6BB8E0, 0, 50, 240);
        makeBox(3, 30, 3, 0x6BB8E0, 1, 20, 241);
        makeBox(4, 20, 4, 0x6BB8E0, -1, 5, 242);

        // Spray pool at base
        makeCylinder(6, 6, 1, 16, 0x87CEEB, 0, -6, 244);
    }

    function buildWalledGarden() {
        // 4 walls
        makeBox(2, 6, 30, 0x888878, -32, 3, -60);
        makeBox(2, 6, 30, 0x888878, 32, 3, -60);
        makeBox(30, 6, 2, 0x888878, 0, 3, -46);
        makeBox(30, 6, 2, 0x888878, 0, 3, -74);

        // 10 espaliered fruit trees fan-trained on walls
        var t;
        var treeX = [-25, -18, -11, -4, 3, 10, 17, 24];
        for (t = 0; t < 8; t++) {
            makeBox(0.5, 8, 8, 0x4A2C0A, treeX[t], 4, -45.5);
        }
        makeBox(0.5, 8, 8, 0x4A2C0A, -31.5, 4, -60);
        makeBox(0.5, 8, 8, 0x4A2C0A, 31.5, 4, -60);

        // 6 vegetable beds
        var v;
        var bedX = [-18, -6, 6];
        var bedZ = [-55, -65];
        for (v = 0; v < bedX.length; v++) {
            makeBox(4, 1, 8, 0x3A2010, bedX[v], 0, bedZ[0]);
            makeBox(4, 1, 8, 0x3A2010, bedX[v], 0, bedZ[1]);
        }
    }

    function buildPepperpotTowers() {
        // Left tower
        makeCylinder(5, 5, 16, 8, 0xC8BAA0, -33, 8, 0);
        makeCone(5, 8, 8, 0xAAAAAA, -33, 20, 0);
        makeCylinder(2.5, 2.5, 0.5, 12, 0xFFFFFF, -33, 12, 0);

        // Right tower
        makeCylinder(5, 5, 16, 8, 0xC8BAA0, 33, 8, 0);
        makeCone(5, 8, 8, 0xAAAAAA, 33, 20, 0);
        makeCylinder(2.5, 2.5, 0.5, 12, 0xFFFFFF, 33, 12, 0);
    }

    function buildWicklowMountains() {
        // Heather moorland foreground
        makeBox(40, 1, 20, 0x8A4A6A, 0, -0.5, -60);

        // Sugar Loaf mountain base
        makeBox(30, 30, 20, 0x6A7A6A, 0, 15, -80);

        // Sugar Loaf cone
        makeCone(10, 20, 8, 0x7A8A7A, 0, 40, -80);
    }

    function build() {
        buildMansion();
        buildItalianGarden();
        buildTritonLake();
        buildJapaneseGardens();
        buildWaterfall();
        buildWalledGarden();
        buildPepperpotTowers();
        buildWicklowMountains();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
    }

    function update(delta) {
        // Static environment — no per-frame updates required
        void delta;
    }

    function reset() {
        var k;
        for (k = 0; k < objects.length; k++) {
            scene.remove(objects[k]);
            if (objects[k].geometry) {
                objects[k].geometry.dispose();
            }
            if (objects[k].material) {
                objects[k].material.dispose();
            }
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
