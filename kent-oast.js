window.KentOast = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var cowlVanes = [];
    var OFFSET_X = 16600;
    var OFFSET_Z = 0;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeCylinder(rTop, rBot, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeSphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildKilns() {
        var kilnPositions = [
            [-12, 0, 0],
            [0, 0, 0],
            [12, 0, 0]
        ];
        var i;
        for (i = 0; i < kilnPositions.length; i++) {
            var kx = kilnPositions[i][0];
            var kz = kilnPositions[i][2];

            var kiln = makeCylinder(5, 5, 16, 8, 0xCC5500, kx, 8, kz);
            addObj(kiln);

            var cowl = makeCone(5.5, 10, 8, 0xFFFFF0, kx, 21, kz);
            addObj(cowl);

            var vane1 = makeBox(0.3, 6, 3, 0xFFFFFF, kx, 27, kz);
            addObj(vane1);
            cowlVanes.push(vane1);

            var vane2 = makeBox(3, 6, 0.3, 0xFFFFFF, kx, 27, kz);
            addObj(vane2);
            cowlVanes.push(vane2);
        }
    }

    function buildBarn() {
        var barn = makeBox(14, 12, 10, 0xCC5500, 0, 6, 20);
        addObj(barn);

        var roof1 = makeBox(16, 3, 7, 0x555555, -2, 13, 17);
        roof1.rotation.z = 0.4;
        addObj(roof1);

        var roof2 = makeBox(16, 3, 7, 0x555555, 2, 13, 17);
        roof2.rotation.z = -0.4;
        addObj(roof2);

        var winPositions = [
            [-5, 6, 25.1],
            [-1.5, 6, 25.1],
            [1.5, 6, 25.1],
            [5, 6, 25.1],
            [-5, 9, 25.1],
            [-1.5, 9, 25.1],
            [1.5, 9, 25.1],
            [5, 9, 25.1]
        ];
        var j;
        for (j = 0; j < winPositions.length; j++) {
            var wx = winPositions[j][0];
            var wy = winPositions[j][1];
            var wz = winPositions[j][2];
            var slit = makeBox(0.5, 4, 0.5, 0x111111, wx, wy, wz - OFFSET_Z);
            addObj(slit);
        }
    }

    function buildHopGarden() {
        var row, col;
        for (row = 0; row < 6; row++) {
            for (col = 0; col < 10; col++) {
                var px = -22 + col * 5;
                var pz = 40 + row * 8;
                var pole = makeBox(0.4, 8, 0.4, 0x4A2C0A, px, 4, pz);
                addObj(pole);
            }
            var stringBar = makeBox(0.1, 0.1, 40, 0x8B6914, -22 + 4.5 * 5, 8, 40 + row * 8);
            addObj(stringBar);

            var hopCount;
            for (hopCount = 0; hopCount < 5; hopCount++) {
                var hx = -22 + hopCount * 10;
                var hz = 40 + row * 8;
                var hop = makeSphere(2, 0x2D8B2D, hx, 8, hz);
                addObj(hop);
            }
        }
    }

    function buildAppleOrchard() {
        var col, row;
        for (col = 0; col < 4; col++) {
            for (row = 0; row < 5; row++) {
                var tx = 30 + col * 12;
                var tz = -20 + row * 12;

                var trunk = makeCylinder(0.8, 0.8, 6, 8, 0x5C2E0A, tx, 3, tz);
                addObj(trunk);

                var canopy = makeSphere(5, 0x3A8A3A, tx, 9, tz);
                addObj(canopy);

                var a;
                for (a = 0; a < 10; a++) {
                    var angle = (a / 10) * Math.PI * 2;
                    var ar = 3 + Math.sin(a * 1.7) * 1.5;
                    var ax = tx + Math.cos(angle) * ar;
                    var az = tz + Math.sin(angle) * ar;
                    var ay = 7 + Math.cos(a * 0.9) * 2;
                    var apple = makeSphere(0.6, 0xCC2200, ax - OFFSET_X, ay, az - OFFSET_Z);
                    addObj(apple);
                }
            }
        }
    }

    function buildFarmhouse() {
        var house = makeBox(18, 12, 12, 0xCC5500, -40, 6, -30);
        addObj(house);

        var winFramePositions = [
            [-46, 7, -24],
            [-40, 7, -24],
            [-34, 7, -24],
            [-46, 11, -24],
            [-40, 11, -24],
            [-34, 11, -24]
        ];
        var w;
        for (w = 0; w < winFramePositions.length; w++) {
            var fx = winFramePositions[w][0];
            var fy = winFramePositions[w][1];
            var fz = winFramePositions[w][2];
            var frame = makeBox(2, 3, 0.3, 0xF5F5F5, fx - OFFSET_X, fy, fz - OFFSET_Z);
            addObj(frame);
            var pane = makeBox(1.5, 2.5, 0.3, 0x87CEEB, fx - OFFSET_X, fy, fz - OFFSET_Z + 0.2);
            addObj(pane);
        }

        var chimney1 = makeBox(1.5, 6, 1.5, 0x993300, -44, 15, -30);
        addObj(chimney1);
        var chimney2 = makeBox(1.5, 6, 1.5, 0x993300, -36, 15, -30);
        addObj(chimney2);

        var leanto = makeBox(8, 4, 6, 0xCC5500, -31, 4, -28);
        addObj(leanto);
    }

    function buildPub() {
        var pubBody = makeBox(12, 10, 8, 0xF5DEB3, 20, 5, -50);
        addObj(pubBody);

        var signPole = makeCylinder(0.3, 0.3, 4, 6, 0x2C1810, 27, 5, -46);
        addObj(signPole);
        var signBoard = makeBox(3, 2, 0.3, 0x2C1810, 27, 8, -46);
        addObj(signBoard);

        var tablePositions = [
            [12, 0, -42],
            [18, 0, -42],
            [12, 0, -46],
            [18, 0, -46]
        ];
        var t;
        for (t = 0; t < tablePositions.length; t++) {
            var tbx = tablePositions[t][0];
            var tbz = tablePositions[t][2];

            var tabletop = makeBox(3, 0.5, 1.5, 0x6B4423, tbx, 2, tbz);
            addObj(tabletop);

            var legOffsets = [
                [-1, -1],
                [1, -1],
                [-1, 1],
                [1, 1]
            ];
            var l;
            for (l = 0; l < legOffsets.length; l++) {
                var lx = tbx + legOffsets[l][0];
                var lz = tbz + legOffsets[l][1];
                var leg = makeBox(0.3, 1, 0.3, 0x6B4423, lx, 1, lz);
                addObj(leg);
            }
        }
    }

    function buildCricketGround() {
        var green = makeBox(40, 0.5, 40, 0x4A9A4A, -20, 0.25, -100);
        addObj(green);

        var wicketX = -20;
        var wicketZ = -100;
        var wick1 = makeBox(0.3, 4, 0.3, 0xF5F5F0, wicketX - 1, 2.5, wicketZ);
        addObj(wick1);
        var wick2 = makeBox(0.3, 4, 0.3, 0xF5F5F0, wicketX, 2.5, wicketZ);
        addObj(wick2);
        var wick3 = makeBox(0.3, 4, 0.3, 0xF5F5F0, wicketX + 1, 2.5, wicketZ);
        addObj(wick3);

        var pavilion = makeBox(16, 8, 6, 0xF5F5F0, -20, 4, -116);
        addObj(pavilion);

        var postXs = [-26, -22, -18, -14];
        var p;
        for (p = 0; p < postXs.length; p++) {
            var post = makeCylinder(0.4, 0.4, 6, 8, 0xFFFFFF, postXs[p], 3, -113);
            addObj(post);
        }
    }

    function buildLane() {
        var road = makeBox(4, 0.3, 60, 0xA08060, 60, 0.15, -50);
        addObj(road);

        var hedge1 = makeBox(2, 3, 60, 0x1A5A1A, 63, 1.5, -50);
        addObj(hedge1);
        var hedge2 = makeBox(2, 3, 60, 0x1A5A1A, 57, 1.5, -50);
        addObj(hedge2);

        var fp1 = makeBox(0.3, 5, 0.3, 0x4A2C0A, 62, 2.5, -30);
        addObj(fp1);
        var fp1arm = makeBox(3, 0.5, 0.5, 0x4A2C0A, 63.5, 5, -30);
        addObj(fp1arm);

        var fp2 = makeBox(0.3, 5, 0.3, 0x4A2C0A, 62, 2.5, -60);
        addObj(fp2);
        var fp2arm = makeBox(3, 0.5, 0.5, 0x4A2C0A, 63.5, 5, -60);
        addObj(fp2arm);
    }

    function build() {
        buildKilns();
        buildBarn();
        buildHopGarden();
        buildAppleOrchard();
        buildFarmhouse();
        buildPub();
        buildCricketGround();
        buildLane();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        cowlVanes = [];
    }

    function update(delta) {
        var i;
        for (i = 0; i < cowlVanes.length; i++) {
            cowlVanes[i].rotation.y += delta * 0.5;
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
        cowlVanes = [];
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
