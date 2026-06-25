window.LeedsCastle = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var swanObjects = [];
    var time = 0;

    var OFFSET_X = 16920;
    var OFFSET_Z = 0;

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        return mesh;
    }

    function addAt(mesh, x, y, z) {
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildLake() {
        var positions = [
            [0, 0, -55],
            [0, 0, 55],
            [-55, 0, 0],
            [55, 0, 0],
            [-40, 0, -40],
            [40, 0, -40],
            [-40, 0, 40],
            [40, 0, 40],
            [0, 0, -30],
            [0, 0, 30]
        ];
        var i;
        for (i = 0; i < positions.length; i++) {
            var geo = new THREE.BoxGeometry(25, 0.5, 20);
            var mesh = makeMesh(geo, 0x1B6CA8);
            addAt(mesh, positions[i][0], positions[i][1], positions[i][2]);
        }
    }

    function buildIsland() {
        var baseGeo = new THREE.BoxGeometry(35, 3, 25);
        addAt(makeMesh(baseGeo, 0x5A8A5A), 0, 1.5, 0);

        var topGeo = new THREE.BoxGeometry(25, 5, 18);
        addAt(makeMesh(topGeo, 0x5A8A5A), 0, 5.5, 0);
    }

    function buildGloriette() {
        var body = new THREE.BoxGeometry(16, 20, 14);
        addAt(makeMesh(body, 0x8B7355), -30, 18, 0);

        var cornerOffsets = [
            [-8, 7],
            [8, 7],
            [-8, -7],
            [8, -7]
        ];
        var i;
        for (i = 0; i < cornerOffsets.length; i++) {
            var towerGeo = new THREE.CylinderGeometry(4, 4, 24, 8);
            addAt(makeMesh(towerGeo, 0x7A6545), -30 + cornerOffsets[i][0], 20, cornerOffsets[i][1]);
        }

        var bridgeGeo = new THREE.BoxGeometry(4, 2, 12);
        addAt(makeMesh(bridgeGeo, 0xD4C5A9), -15, 9, 0);
    }

    function buildMainCastle() {
        var body = new THREE.BoxGeometry(30, 18, 16);
        addAt(makeMesh(body, 0x8B7355), 0, 17, 0);

        var towerPositions = [
            [-15, 0],
            [0, 0],
            [15, 0]
        ];
        var i;
        for (i = 0; i < towerPositions.length; i++) {
            var towerGeo = new THREE.BoxGeometry(7, 22, 7);
            addAt(makeMesh(towerGeo, 0x7A6545), towerPositions[i][0], 19, towerPositions[i][1]);
        }

        var bayGeo = new THREE.BoxGeometry(8, 10, 2);
        addAt(makeMesh(bayGeo, 0x87CEEB), 0, 14, 9);
    }

    function buildBarbican() {
        var gateBody = new THREE.BoxGeometry(14, 20, 8);
        addAt(makeMesh(gateBody, 0x8B7355), 0, 18, 40);

        var tower1Geo = new THREE.CylinderGeometry(4, 4, 22, 6);
        addAt(makeMesh(tower1Geo, 0x7A6545), -9, 19, 40);

        var tower2Geo = new THREE.CylinderGeometry(4, 4, 22, 6);
        addAt(makeMesh(tower2Geo, 0x7A6545), 9, 19, 40);

        var drawbridgeGeo = new THREE.BoxGeometry(8, 1, 16);
        addAt(makeMesh(drawbridgeGeo, 0x6B4423), 0, 8, 52);

        var portGeo1 = new THREE.BoxGeometry(0.3, 12, 0.3);
        addAt(makeMesh(portGeo1, 0x333333), -2, 14, 38);

        var portGeo2 = new THREE.BoxGeometry(0.3, 12, 0.3);
        addAt(makeMesh(portGeo2, 0x333333), 2, 14, 38);
    }

    function buildMaze() {
        var hedgeLayouts = [
            { w: 1.5, h: 5, d: 20, x: 60, z: -70 },
            { w: 20, h: 5, d: 1.5, x: 70, z: -60 },
            { w: 1.5, h: 5, d: 20, x: 80, z: -70 },
            { w: 20, h: 5, d: 1.5, x: 70, z: -80 },
            { w: 1.5, h: 5, d: 20, x: 65, z: -65 },
            { w: 20, h: 5, d: 1.5, x: 72, z: -68 },
            { w: 1.5, h: 5, d: 20, x: 75, z: -72 },
            { w: 20, h: 5, d: 1.5, x: 68, z: -75 },
            { w: 1.5, h: 5, d: 20, x: 85, z: -65 },
            { w: 20, h: 5, d: 1.5, x: 62, z: -78 }
        ];
        var i;
        for (i = 0; i < hedgeLayouts.length; i++) {
            var hl = hedgeLayouts[i];
            var geo = new THREE.BoxGeometry(hl.w, hl.h, hl.d);
            addAt(makeMesh(geo, 0x1A4A1A), hl.x, hl.h / 2, hl.z);
        }

        var grottoGeo = new THREE.CylinderGeometry(4, 4, 3, 8);
        addAt(makeMesh(grottoGeo, 0x5A4A3A), 70, 1.5, -70);
    }

    function buildVineyard() {
        var row, col;
        for (row = 0; row < 5; row++) {
            for (col = 0; col < 12; col++) {
                var postGeo = new THREE.BoxGeometry(0.4, 6, 0.4);
                addAt(makeMesh(postGeo, 0x4A2C0A), 60 + col * 3, 3, 60 + row * 6);

                var vineGeo = new THREE.SphereGeometry(1.5, 6, 6);
                addAt(makeMesh(vineGeo, 0x2D8B2D), 60 + col * 3, 7, 60 + row * 6);
            }

            var trellisGeo = new THREE.BoxGeometry(0.1, 0.1, 30);
            addAt(makeMesh(trellisGeo, 0x4A2C0A), 76.5, 6, 60 + row * 6);
        }
    }

    function buildSwans() {
        var swanPositions = [
            [-35, 0, -30],
            [-45, 0, 10],
            [-20, 0, -50],
            [30, 0, -45],
            [50, 0, -20],
            [45, 0, 25],
            [10, 0, 50],
            [-30, 0, 40]
        ];
        var i;
        for (i = 0; i < swanPositions.length; i++) {
            var sx = swanPositions[i][0];
            var sy = swanPositions[i][1];
            var sz = swanPositions[i][2];

            var floatGeo = new THREE.BoxGeometry(1.5, 0.3, 2.5);
            var floatMesh = makeMesh(floatGeo, 0x111111);
            addAt(floatMesh, sx, 0.65, sz);

            var bodyGeo = new THREE.SphereGeometry(1.5, 8, 8);
            var bodyMesh = makeMesh(bodyGeo, 0x111111);
            addAt(bodyMesh, sx, 1.8, sz);

            var neck1Geo = new THREE.BoxGeometry(0.5, 4, 0.5);
            var neck1Mesh = makeMesh(neck1Geo, 0x111111);
            neck1Mesh.rotation.z = 0.3;
            addAt(neck1Mesh, sx + 0.4, 3.8, sz);

            var neck2Geo = new THREE.BoxGeometry(0.5, 4, 0.5);
            var neck2Mesh = makeMesh(neck2Geo, 0x111111);
            neck2Mesh.rotation.z = -0.3;
            addAt(neck2Mesh, sx + 0.8, 6.5, sz);

            var beakGeo = new THREE.BoxGeometry(0.8, 0.3, 1);
            var beakMesh = makeMesh(beakGeo, 0xFF6600);
            addAt(beakMesh, sx + 1.2, 8, sz);

            swanObjects.push({
                float: floatMesh,
                body: bodyMesh,
                neck1: neck1Mesh,
                neck2: neck2Mesh,
                beak: beakMesh,
                baseX: OFFSET_X + sx,
                baseZ: OFFSET_Z + sz,
                phase: i * 0.78
            });
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        swanObjects = [];
        time = 0;
    }

    function build() {
        buildLake();
        buildIsland();
        buildGloriette();
        buildMainCastle();
        buildBarbican();
        buildMaze();
        buildVineyard();
        buildSwans();
    }

    function update(delta) {
        time += delta;
        var i, swan, bob, sway;
        for (i = 0; i < swanObjects.length; i++) {
            swan = swanObjects[i];
            bob = Math.sin(time * 0.8 + swan.phase) * 0.1;
            sway = Math.sin(time * 0.5 + swan.phase) * 0.05;

            swan.float.position.y = 0.65 + bob;
            swan.body.position.y = 1.8 + bob;
            swan.neck1.position.y = 3.8 + bob;
            swan.neck1.position.x = swan.baseX + 0.4 + sway;
            swan.neck2.position.y = 6.5 + bob;
            swan.neck2.position.x = swan.baseX + 0.8 + sway;
            swan.beak.position.y = 8 + bob;
            swan.beak.position.x = swan.baseX + 1.2 + sway;
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
        swanObjects = [];
        time = 0;
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
