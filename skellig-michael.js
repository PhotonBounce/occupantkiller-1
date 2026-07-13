window.SkelligMichael = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var puffins = [];
    var puffinVelocities = [];
    var time = 0;

    var OFFSET_X = 17440;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function addMesh(geometry, material, x, y, z, rx, ry, rz) {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(OFFSET_X + (x || 0), y || 0, OFFSET_Z + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildIslandRock() {
        var darkSandstone = makeMaterial(0x3A3530);
        var darkCliff = makeMaterial(0x2A2520);

        addMesh(new THREE.BoxGeometry(20, 40, 18), darkSandstone, 0, 20, 0);
        addMesh(new THREE.BoxGeometry(16, 48, 14), darkSandstone, 2, 44, 2);
        addMesh(new THREE.BoxGeometry(12, 52, 10), darkSandstone, 0, 66, 0);

        var protrusions = [
            [-8, 10, 5, 0, 0, 0.3],
            [9, 14, -4, 0, 0, -0.25],
            [-7, 22, -6, 0, 0.1, 0.35],
            [8, 30, 7, 0, -0.1, -0.3],
            [-9, 38, 3, 0, 0, 0.28],
            [6, 50, -5, 0, 0.2, -0.32],
            [-5, 58, 6, 0, 0, 0.22],
            [7, 62, -3, 0, -0.15, 0.4],
            [-6, 70, 4, 0, 0.1, -0.38],
            [5, 78, -2, 0, 0, 0.3]
        ];

        for (var i = 0; i < protrusions.length; i++) {
            var p = protrusions[i];
            addMesh(new THREE.BoxGeometry(4, 8, 3), darkCliff, p[0], p[1], p[2], p[3], p[4], p[5]);
        }
    }

    function buildSteps() {
        var stoneMat = makeMaterial(0xD4C5A9);
        var chainMat = new THREE.LineBasicMaterial({ color: 0x555555 });

        var stairPositions = [
            [-4, 12, 6],
            [-2, 16, 8],
            [0, 20, 7],
            [2, 24, 6],
            [-1, 28, 5],
            [-3, 32, 4],
            [1, 36, 3],
            [3, 40, 2],
            [0, 44, 1],
            [-2, 48, 0],
            [1, 52, -1],
            [-1, 56, -2]
        ];

        for (var i = 0; i < stairPositions.length; i++) {
            var sp = stairPositions[i];
            addMesh(new THREE.BoxGeometry(4, 0.5, 3), stoneMat, sp[0], sp[1], sp[2]);
        }

        var railPoints = [
            new THREE.Vector3(OFFSET_X - 4, 12, OFFSET_Z + 6),
            new THREE.Vector3(OFFSET_X + 0, 32, OFFSET_Z + 3),
            new THREE.Vector3(OFFSET_X - 1, 56, OFFSET_Z - 2)
        ];
        var railGeom = new THREE.BufferGeometry().setFromPoints(railPoints);
        var rail = new THREE.LineSegments(railGeom, chainMat);
        scene.add(rail);
        objects.push(rail);

        var railPoints2 = [
            new THREE.Vector3(OFFSET_X + 4, 12, OFFSET_Z + 6),
            new THREE.Vector3(OFFSET_X + 3, 32, OFFSET_Z + 2),
            new THREE.Vector3(OFFSET_X + 1, 56, OFFSET_Z - 2)
        ];
        var railGeom2 = new THREE.BufferGeometry().setFromPoints(railPoints2);
        var rail2 = new THREE.LineSegments(railGeom2, chainMat);
        scene.add(rail2);
        objects.push(rail2);

        var railPoints3 = [
            new THREE.Vector3(OFFSET_X - 2, 20, OFFSET_Z + 7),
            new THREE.Vector3(OFFSET_X + 2, 38, OFFSET_Z + 2),
            new THREE.Vector3(OFFSET_X + 0, 52, OFFSET_Z - 1)
        ];
        var railGeom3 = new THREE.BufferGeometry().setFromPoints(railPoints3);
        var rail3 = new THREE.LineSegments(railGeom3, chainMat);
        scene.add(rail3);
        objects.push(rail3);
    }

    function buildBeeHiveHuts() {
        var stoneMat = makeMaterial(0x8B7355);
        var darkEntrance = makeMaterial(0x111111);

        var hutPositions = [
            [-8, 64, -6],
            [-2, 64, -8],
            [4, 64, -6],
            [6, 64, 0],
            [0, 64, 4],
            [-6, 64, 2]
        ];

        for (var i = 0; i < hutPositions.length; i++) {
            var hp = hutPositions[i];

            var hutGeom = new THREE.SphereGeometry(4, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
            var hut = new THREE.Mesh(hutGeom, stoneMat);
            hut.position.set(OFFSET_X + hp[0], hp[1], OFFSET_Z + hp[2]);
            scene.add(hut);
            objects.push(hut);

            addMesh(new THREE.BoxGeometry(1, 2, 1.5), darkEntrance, hp[0], hp[1] - 2, hp[2] + 4);
        }

        addMesh(new THREE.BoxGeometry(2, 4, 30), stoneMat, 0, 62, -10);
        addMesh(new THREE.BoxGeometry(30, 4, 2), stoneMat, 0, 62, 8);
        addMesh(new THREE.BoxGeometry(2, 4, 30), stoneMat, 14, 62, -2);
        addMesh(new THREE.BoxGeometry(2, 4, 30), stoneMat, -14, 62, -2);
    }

    function buildOratory() {
        var limestoneMat = makeMaterial(0x8B7355);
        var roofMat = makeMaterial(0x888878);

        addMesh(new THREE.BoxGeometry(6, 4, 4), limestoneMat, 8, 62, -12);
        addMesh(new THREE.BoxGeometry(7, 3, 5), roofMat, 8, 65, -12);
    }

    function buildOcean() {
        var deepAtlantic = makeMaterial(0x1A3A6A);
        var whitecap = makeMaterial(0xFFFFFF);

        var waterTiles = [
            [-40, -1, -40],
            [-15, -1, -40],
            [10, -1, -40],
            [35, -1, -40],
            [-40, -1, 20],
            [-15, -1, 20],
            [10, -1, 20],
            [35, -1, 20]
        ];

        for (var i = 0; i < waterTiles.length; i++) {
            var wt = waterTiles[i];
            addMesh(new THREE.BoxGeometry(25, 0.5, 20), deepAtlantic, wt[0], wt[1], wt[2]);
        }

        var wavePositions = [
            [-18, 2, -10],
            [18, 2, -10],
            [-15, 2, 10],
            [15, 2, 10]
        ];

        for (var j = 0; j < wavePositions.length; j++) {
            var wp = wavePositions[j];
            addMesh(new THREE.SphereGeometry(4, 8, 8), whitecap, wp[0], wp[1], wp[2]);
        }
    }

    function buildPuffin(px, py, pz) {
        var blackMat = makeMaterial(0x111111);
        var beakMat = makeMaterial(0xFF6600);
        var chestMat = makeMaterial(0xF5F5F5);

        var group = new THREE.Group();
        group.position.set(OFFSET_X + px, py, OFFSET_Z + pz);

        var bodyGeom = new THREE.SphereGeometry(0.8, 6, 6);
        var body = new THREE.Mesh(bodyGeom, blackMat);
        body.position.set(0, 0, 0);
        group.add(body);

        var headGeom = new THREE.SphereGeometry(0.5, 6, 6);
        var head = new THREE.Mesh(headGeom, blackMat);
        head.position.set(0, 1.1, 0);
        group.add(head);

        var beakGeom = new THREE.BoxGeometry(0.6, 0.3, 0.8);
        var beak = new THREE.Mesh(beakGeom, beakMat);
        beak.position.set(0, 1.1, 0.7);
        group.add(beak);

        var chestGeom = new THREE.BoxGeometry(0.7, 1, 0.5);
        var chest = new THREE.Mesh(chestGeom, chestMat);
        chest.position.set(0, 0, 0.7);
        group.add(chest);

        scene.add(group);
        objects.push(group);
        return group;
    }

    function buildPuffins() {
        var ledgePositions = [
            [-6, 60, 8],
            [-3, 60, 9],
            [0, 60, 10],
            [3, 60, 9],
            [6, 60, 8],
            [-8, 68, -4],
            [-4, 68, -5],
            [0, 68, -6],
            [4, 68, -5],
            [8, 68, -4],
            [-5, 75, 2],
            [-2, 75, 3],
            [2, 75, 2],
            [5, 75, 1]
        ];

        for (var i = 0; i < ledgePositions.length; i++) {
            var lp = ledgePositions[i];
            var puffin = buildPuffin(lp[0], lp[1], lp[2]);
            puffins.push(puffin);
            puffinVelocities.push({ vx: 0, vy: 0, vz: 0, flying: false, phase: 0 });
        }

        var flyingPositions = [
            [-20, 30, -15],
            [-25, 35, -10],
            [-15, 40, -20],
            [-30, 25, 5],
            [20, 32, -18],
            [22, 38, 10]
        ];

        for (var j = 0; j < flyingPositions.length; j++) {
            var fp = flyingPositions[j];
            var flyingPuffin = buildPuffin(fp[0], fp[1], fp[2]);
            puffins.push(flyingPuffin);
            puffinVelocities.push({ vx: 0.05, vy: 0, vz: 0.03, flying: true, phase: j * 1.047 });
        }
    }

    function buildLighthouse() {
        var whiteMat = makeMaterial(0xFFFFFF);
        var lensMat = makeMaterial(0x87CEEB);

        addMesh(new THREE.CylinderGeometry(4, 4, 20, 8), whiteMat, 20, 10, -20);
        addMesh(new THREE.BoxGeometry(12, 6, 6), whiteMat, 14, 3, -28);
        addMesh(new THREE.CylinderGeometry(3, 3, 4, 8), lensMat, 20, 22, -20);
    }

    function buildJediTemple() {
        var stoneMat = makeMaterial(0xD4C5A9);
        var pillarMat = makeMaterial(0x8B7355);
        var archMat = makeMaterial(0x8B7355);
        var darkPassage = makeMaterial(0x111111);

        addMesh(new THREE.BoxGeometry(8, 0.5, 6), stoneMat, -4, 93, -2);
        addMesh(new THREE.BoxGeometry(8, 0.5, 6), stoneMat, 4, 95, 0);
        addMesh(new THREE.BoxGeometry(8, 0.5, 6), stoneMat, 0, 97, -4);

        var pillarCorners = [
            [-5, 92, -5],
            [5, 92, -5],
            [-5, 92, 5],
            [5, 92, 5]
        ];

        for (var i = 0; i < pillarCorners.length; i++) {
            var pc = pillarCorners[i];
            addMesh(new THREE.CylinderGeometry(0.8, 0.8, 6, 6), pillarMat, pc[0], pc[1], pc[2]);
        }

        addMesh(new THREE.BoxGeometry(6, 8, 2), archMat, 0, 97, -8);
        addMesh(new THREE.BoxGeometry(4, 6, 2.5), darkPassage, 0, 96, -8);
    }

    function build() {
        buildIslandRock();
        buildSteps();
        buildBeeHiveHuts();
        buildOratory();
        buildOcean();
        buildPuffins();
        buildLighthouse();
        buildJediTemple();
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < puffins.length; i++) {
            var puffin = puffins[i];
            var vel = puffinVelocities[i];

            if (vel.flying) {
                var radius = 12;
                var speed = 0.4;
                var phase = vel.phase;
                puffin.position.x = OFFSET_X + (-20 + Math.cos(time * speed + phase) * radius);
                puffin.position.y = 30 + Math.sin(time * speed * 0.7 + phase) * 6;
                puffin.position.z = OFFSET_Z + (Math.sin(time * speed + phase) * radius * 0.6);
                puffin.rotation.y = time * speed + phase + Math.PI / 2;
            } else {
                puffin.rotation.y = Math.sin(time * 0.5 + i) * 0.2;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) objects[i].geometry.dispose();
            if (objects[i].material) objects[i].material.dispose();
        }
        objects = [];
        puffins = [];
        puffinVelocities = [];
        time = 0;
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
