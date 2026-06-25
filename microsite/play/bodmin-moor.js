window.BodminMoor = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 8720;
    var OZ = 0;

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function place(mesh, x, y, z) {
        mesh.position.set(OX + x, y, OZ + z);
        return mesh;
    }

    function buildRoughTor() {
        var base = makeMesh(new THREE.ConeGeometry(15, 20, 8), 0x888870);
        place(base, -60, 10, -80);
        addMesh(base);

        var cap1 = makeMesh(new THREE.BoxGeometry(5, 6, 5), 0x888870);
        place(cap1, -60, 23, -80);
        addMesh(cap1);

        var cap2 = makeMesh(new THREE.BoxGeometry(4, 4, 4), 0x7A7A60);
        place(cap2, -60, 29, -80);
        addMesh(cap2);

        var cap3 = makeMesh(new THREE.BoxGeometry(3, 5, 3), 0x6E6E58);
        place(cap3, -60, 33.5, -80);
        addMesh(cap3);
    }

    function buildBrownWilly() {
        var base = makeMesh(new THREE.ConeGeometry(12, 16, 8), 0x7A7A60);
        place(base, 40, 8, -100);
        addMesh(base);

        var cap1 = makeMesh(new THREE.BoxGeometry(4, 5, 4), 0x7A7A60);
        place(cap1, 40, 18.5, -100);
        addMesh(cap1);

        var cap2 = makeMesh(new THREE.BoxGeometry(3, 3, 3), 0x6E6E58);
        place(cap2, 40, 23, -100);
        addMesh(cap2);

        var cap3 = makeMesh(new THREE.BoxGeometry(2, 4, 2), 0x666650);
        place(cap3, 40, 26.5, -100);
        addMesh(cap3);
    }

    function buildJamaicaInn() {
        var body = makeMesh(new THREE.BoxGeometry(20, 6, 8), 0x776655);
        place(body, 0, 3, 20);
        addMesh(body);

        var roof = makeMesh(new THREE.BoxGeometry(21, 1, 9), 0x554433);
        place(roof, 0, 6.5, 20);
        addMesh(roof);

        var sign = makeMesh(new THREE.BoxGeometry(3, 0.1, 1), 0xAA8833);
        place(sign, -8, 6, 16.5);
        addMesh(sign);

        var post = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x554422);
        place(post, -8, 4, 16.5);
        addMesh(post);

        var wallN = makeMesh(new THREE.BoxGeometry(24, 2, 0.4), 0x665544);
        place(wallN, 0, 1, 10);
        addMesh(wallN);

        var wallS = makeMesh(new THREE.BoxGeometry(24, 2, 0.4), 0x665544);
        place(wallS, 0, 1, 32);
        addMesh(wallS);

        var wallE = makeMesh(new THREE.BoxGeometry(0.4, 2, 22), 0x665544);
        place(wallE, 12, 1, 21);
        addMesh(wallE);

        var wallW = makeMesh(new THREE.BoxGeometry(0.4, 2, 22), 0x665544);
        place(wallW, -12, 1, 21);
        addMesh(wallW);
    }

    function buildHurlers() {
        var radius = 12;
        var cx = -30;
        var cz = 50;
        for (var i = 0; i < 9; i++) {
            var angle = (i / 9) * Math.PI * 2;
            var sx = cx + Math.cos(angle) * radius;
            var sz = cz + Math.sin(angle) * radius;
            var stone = makeMesh(new THREE.CylinderGeometry(0.4, 0.5, 2, 6), 0x888880);
            place(stone, sx, 1, sz);
            addMesh(stone);
        }

        var fallen = makeMesh(new THREE.BoxGeometry(2, 0.5, 0.8), 0x888880);
        place(fallen, cx + 14, 0.25, cz - 2);
        fallen.rotation.z = 0.3;
        addMesh(fallen);
    }

    function buildHutCircles() {
        var circles = [
            { cx: 20, cz: 60 },
            { cx: -10, cz: 75 },
            { cx: 50, cz: 55 }
        ];

        for (var c = 0; c < circles.length; c++) {
            var cx = circles[c].cx;
            var cz = circles[c].cz;
            for (var i = 0; i < 8; i++) {
                var angle = (i / 8) * Math.PI * 2;
                var sx = cx + Math.cos(angle) * 4;
                var sz = cz + Math.sin(angle) * 4;
                var block = makeMesh(new THREE.BoxGeometry(2, 0.5, 0.8), 0x998866);
                place(block, sx, 0.25, sz);
                block.rotation.y = angle;
                addMesh(block);
            }
        }
    }

    function buildPonies() {
        var ponyData = [
            { px: -20, pz: 30 },
            { px: -25, pz: 35 },
            { px: 10, pz: 45 },
            { px: 15, pz: 42 }
        ];

        for (var p = 0; p < ponyData.length; p++) {
            var px = ponyData[p].px;
            var pz = ponyData[p].pz;

            var body = makeMesh(new THREE.BoxGeometry(1.5, 1, 0.8), 0x8B5A2B);
            place(body, px, 1.2, pz);
            addMesh(body);

            var head = makeMesh(new THREE.SphereGeometry(0.4, 6, 6), 0x8B5A2B);
            place(head, px + 0.9, 1.8, pz);
            addMesh(head);

            var legOffsets = [
                { lx: 0.4, lz: 0.2 },
                { lx: 0.4, lz: -0.2 },
                { lx: -0.4, lz: 0.2 },
                { lx: -0.4, lz: -0.2 }
            ];

            for (var l = 0; l < legOffsets.length; l++) {
                var leg = makeMesh(new THREE.CylinderGeometry(0.15, 0.12, 0.8, 5), 0x7A4F25);
                place(leg, px + legOffsets[l].lx, 0.4, pz + legOffsets[l].lz);
                addMesh(leg);
            }
        }
    }

    function buildBoggyPool() {
        var pool = makeMesh(new THREE.BoxGeometry(20, 0.3, 15), 0x334455);
        place(pool, 30, 0.05, 10);
        addMesh(pool);
    }

    function buildAncientCross() {
        var plinth = makeMesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), 0x999077);
        place(plinth, -50, 0.75, 30);
        addMesh(plinth);

        var vertical = makeMesh(new THREE.BoxGeometry(0.15, 1.5, 0.15), 0x999077);
        place(vertical, -50, 2.25, 30);
        addMesh(vertical);

        var crossbar = makeMesh(new THREE.BoxGeometry(1.5, 0.15, 0.15), 0x999077);
        place(crossbar, -50, 2.8, 30);
        addMesh(crossbar);
    }

    function buildChinaClayTip() {
        var tip = makeMesh(new THREE.ConeGeometry(8, 12, 8), 0xEEEECC);
        place(tip, 80, 6, -30);
        addMesh(tip);
    }

    function buildMoorlandTrack() {
        var sections = [
            { tx: -5, tz: -10, ry: 0.1 },
            { tx: -3, tz: 5, ry: -0.05 },
            { tx: 0, tz: 20, ry: 0.08 },
            { tx: 4, tz: 35, ry: -0.1 }
        ];

        for (var i = 0; i < sections.length; i++) {
            var track = makeMesh(new THREE.BoxGeometry(2, 0.2, 15), 0xBBAA88);
            place(track, sections[i].tx, 0.1, sections[i].tz);
            track.rotation.y = sections[i].ry;
            addMesh(track);
        }
    }

    function build() {
        buildRoughTor();
        buildBrownWilly();
        buildJamaicaInn();
        buildHurlers();
        buildHutCircles();
        buildPonies();
        buildBoggyPool();
        buildAncientCross();
        buildChinaClayTip();
        buildMoorlandTrack();
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
