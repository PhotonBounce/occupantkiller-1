window.Glendalough = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 17280;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeMesh(geo, mat) {
        var m = new THREE.Mesh(geo, mat);
        objects.push(m);
        return m;
    }

    function buildRoundTower() {
        var shaftGeo = new THREE.CylinderGeometry(4, 4, 32, 8);
        var shaftMat = makeMaterial(0x888878);
        var shaft = makeMesh(shaftGeo, shaftMat);
        shaft.position.set(OX + 0, 16, OZ + 0);
        scene.add(shaft);

        var capGeo = new THREE.ConeGeometry(4, 8, 8);
        var capMat = makeMaterial(0x777868);
        var cap = makeMesh(capGeo, capMat);
        cap.position.set(OX + 0, 36, OZ + 0);
        scene.add(cap);

        var doorGeo = new THREE.BoxGeometry(1.5, 3, 0.5);
        var doorMat = makeMaterial(0x222222);
        var door = makeMesh(doorGeo, doorMat);
        door.position.set(OX + 0, 8, OZ + 4.1);
        scene.add(door);

        var winPositions = [
            [0, 20, 4.1],
            [4.1, 20, 0],
            [0, 20, -4.1],
            [-4.1, 20, 0]
        ];
        var winMat = makeMaterial(0x111111);
        for (var i = 0; i < winPositions.length; i++) {
            var wp = winPositions[i];
            var winGeo = new THREE.BoxGeometry(1, 2, 0.3);
            var win = makeMesh(winGeo, winMat);
            win.position.set(OX + wp[0], wp[1], OZ + wp[2]);
            scene.add(win);
        }
    }

    function buildCathedralRuins() {
        var bodyGeo = new THREE.BoxGeometry(28, 16, 14);
        var bodyMat = makeMaterial(0x888878);
        var body = makeMesh(bodyGeo, bodyMat);
        body.position.set(OX + 60, 8, OZ + 0);
        scene.add(body);

        var windowMat = makeMaterial(0x87CEEB);
        var lancetPositions = [
            [60 - 14.1, 10, -9],
            [60 - 14.1, 10, -3],
            [60 - 14.1, 10, 3],
            [60 - 14.1, 10, 9],
            [60 + 14.1, 10, -9],
            [60 + 14.1, 10, -3],
            [60 + 14.1, 10, 3],
            [60 + 14.1, 10, 9]
        ];
        for (var i = 0; i < lancetPositions.length; i++) {
            var lp = lancetPositions[i];
            var lancetGeo = new THREE.BoxGeometry(0.5, 10, 3);
            var lancet = makeMesh(lancetGeo, windowMat);
            lancet.position.set(OX + lp[0], lp[1], OZ + lp[2]);
            scene.add(lancet);
        }

        var archGeo = new THREE.BoxGeometry(8, 10, 2);
        var archMat = makeMaterial(0x888878);
        var arch = makeMesh(archGeo, archMat);
        arch.position.set(OX + 60, 8, OZ + 0);
        scene.add(arch);

        var archOpenGeo = new THREE.BoxGeometry(5, 8, 2.2);
        var archOpenMat = makeMaterial(0x111111);
        var archOpen = makeMesh(archOpenGeo, archOpenMat);
        archOpen.position.set(OX + 60, 7, OZ + 0);
        scene.add(archOpen);
    }

    function buildStKevinsChurch() {
        var bodyGeo = new THREE.BoxGeometry(10, 10, 8);
        var bodyMat = makeMaterial(0x888878);
        var body = makeMesh(bodyGeo, bodyMat);
        body.position.set(OX - 50, 5, OZ + 30);
        scene.add(body);

        var roofGeo = new THREE.BoxGeometry(11, 3, 9);
        var roofMat = makeMaterial(0x777777);
        var roof = makeMesh(roofGeo, roofMat);
        roof.position.set(OX - 50, 11.5, OZ + 30);
        scene.add(roof);

        var chimGeo = new THREE.CylinderGeometry(2, 2, 10, 8);
        var chimMat = makeMaterial(0x888878);
        var chim = makeMesh(chimGeo, chimMat);
        chim.position.set(OX - 55, 10, OZ + 30);
        scene.add(chim);
    }

    function buildGateway() {
        var pillarMat = makeMaterial(0x888878);

        var pillar1Geo = new THREE.BoxGeometry(3, 8, 3);
        var pillar1 = makeMesh(pillar1Geo, pillarMat);
        pillar1.position.set(OX - 20, 4, OZ - 5);
        scene.add(pillar1);

        var pillar2Geo = new THREE.BoxGeometry(3, 8, 3);
        var pillar2 = makeMesh(pillar2Geo, pillarMat);
        pillar2.position.set(OX - 20, 4, OZ + 5);
        scene.add(pillar2);

        var lintelGeo = new THREE.BoxGeometry(8, 2, 3);
        var lintelMat = makeMaterial(0x888878);
        var lintel = makeMesh(lintelGeo, lintelMat);
        lintel.position.set(OX - 20, 9, OZ + 0);
        scene.add(lintel);

        var pathGeo = new THREE.BoxGeometry(4, 0.3, 20);
        var pathMat = makeMaterial(0xD4C5A9);
        var path = makeMesh(pathGeo, pathMat);
        path.position.set(OX - 30, 0.15, OZ + 0);
        scene.add(path);
    }

    function buildLakesAndSlopes() {
        var lakeMat = makeMaterial(0x1B6CA8);
        var lakeOffsets = [
            [200, 0],
            [225, 20],
            [210, -15],
            [240, 10],
            [220, -5]
        ];
        for (var i = 0; i < lakeOffsets.length; i++) {
            var lo = lakeOffsets[i];
            var lakeGeo = new THREE.BoxGeometry(20, 0.5, 15);
            var lake = makeMesh(lakeGeo, lakeMat);
            lake.position.set(OX + lo[0], 0.25, OZ + lo[1]);
            scene.add(lake);
        }

        var slopeMat = makeMaterial(0x4A8A4A);
        var slopes = [
            [100, 10, 80, 30, 20, 15],
            [-80, 9, 60, 25, 18, 12],
            [130, 11, -70, 28, 22, 14],
            [-60, 8, -60, 22, 16, 10]
        ];
        for (var j = 0; j < slopes.length; j++) {
            var sl = slopes[j];
            var slopeGeo = new THREE.BoxGeometry(sl[3], sl[4], sl[5]);
            var slope = makeMesh(slopeGeo, slopeMat);
            slope.position.set(OX + sl[0], sl[4] / 2, OZ + sl[2]);
            scene.add(slope);
        }
    }

    function buildWoodedValley() {
        var trunkMat = makeMaterial(0x4A2C0A);
        var canopyMat = makeMaterial(0x228B22);
        var treePositions = [
            [-30, -40], [-40, -20], [-35, 20], [-45, 50],
            [-25, -60], [-50, -10], [-55, 30], [-20, 60],
            [20, -50], [25, -30], [30, 40], [35, 60],
            [45, -20], [50, 10], [40, -60], [55, 50],
            [-60, -50], [-65, 40], [65, -30], [70, 20]
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var tp = treePositions[i];
            var trunkGeo = new THREE.CylinderGeometry(1.2, 1.2, 10, 8);
            var trunk = makeMesh(trunkGeo, trunkMat);
            trunk.position.set(OX + tp[0], 5, OZ + tp[1]);
            scene.add(trunk);

            var canopyGeo = new THREE.SphereGeometry(7, 8, 6);
            var canopy = makeMesh(canopyGeo, canopyMat);
            canopy.position.set(OX + tp[0], 14, OZ + tp[1]);
            scene.add(canopy);
        }

        var boulderMat = makeMaterial(0x888878);
        var boulders = [
            [-38, -35, 3],
            [-42, 45, 4],
            [28, -42, 2.5],
            [48, 30, 3],
            [-28, 55, 4],
            [60, -40, 2.5]
        ];
        for (var j = 0; j < boulders.length; j++) {
            var bl = boulders[j];
            var boulderGeo = new THREE.SphereGeometry(bl[2], 8, 6);
            var boulder = makeMesh(boulderGeo, boulderMat);
            boulder.position.set(OX + bl[0], bl[2] * 0.5, OZ + bl[1]);
            scene.add(boulder);
        }
    }

    function buildCrossesAndGraveyard() {
        var graveyardGeo = new THREE.BoxGeometry(15, 0.3, 20);
        var graveyardMat = makeMaterial(0x3A6A3A);
        var graveyard = makeMesh(graveyardGeo, graveyardMat);
        graveyard.position.set(OX + 30, 0.15, OZ - 40);
        scene.add(graveyard);

        var crossMat = makeMaterial(0xAAAAAA);
        var crossPositions = [
            [25, -35], [27, -38], [29, -42], [31, -36],
            [33, -40], [35, -34], [37, -38], [39, -44]
        ];
        for (var i = 0; i < crossPositions.length; i++) {
            var cp = crossPositions[i];

            var shaftGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
            var shaft = makeMesh(shaftGeo, crossMat);
            shaft.position.set(OX + cp[0], 4, OZ + cp[1]);
            scene.add(shaft);

            var ringGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 12);
            var ring = makeMesh(ringGeo, crossMat);
            ring.position.set(OX + cp[0], 6, OZ + cp[1]);
            scene.add(ring);

            var armsGeo = new THREE.BoxGeometry(0.5, 0.5, 5);
            var arms = makeMesh(armsGeo, crossMat);
            arms.position.set(OX + cp[0], 6, OZ + cp[1]);
            scene.add(arms);
        }
    }

    function buildStKevinsCell() {
        var cellGeo = new THREE.SphereGeometry(4, 8, 6);
        var cellMat = makeMaterial(0x888878);
        var cell = makeMesh(cellGeo, cellMat);
        cell.position.set(OX - 80, 2, OZ + 0);
        scene.add(cell);

        var entranceGeo = new THREE.BoxGeometry(1.5, 2, 2);
        var entranceMat = makeMaterial(0x222222);
        var entrance = makeMesh(entranceGeo, entranceMat);
        entrance.position.set(OX - 80, 1, OZ + 4);
        scene.add(entrance);

        var floorGeo = new THREE.BoxGeometry(4, 0.2, 4);
        var floorMat = makeMaterial(0xD4C5A9);
        var floor = makeMesh(floorGeo, floorMat);
        floor.position.set(OX - 80, 0.1, OZ + 0);
        scene.add(floor);
    }

    function build() {
        buildRoundTower();
        buildCathedralRuins();
        buildStKevinsChurch();
        buildGateway();
        buildLakesAndSlopes();
        buildWoodedValley();
        buildCrossesAndGraveyard();
        buildStKevinsCell();
    }

    function update(delta) {
        void delta;
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

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };
}());
