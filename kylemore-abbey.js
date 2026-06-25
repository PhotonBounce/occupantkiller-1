window.KylemoreAbbey = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 17400;
    var OZ = 0;

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        return mesh;
    }

    function addMesh(mesh, x, y, z) {
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildAbbey() {
        // Main building — 50w x 18d x 20h
        var mainBody = makeMesh(new THREE.BoxGeometry(50, 20, 18), 0x5A5A5A);
        addMesh(mainBody, 0, 10, 0);

        // 3 Gothic bay towers — 8x8x26
        var tower1 = makeMesh(new THREE.BoxGeometry(8, 26, 8), 0x5A5A5A);
        addMesh(tower1, -20, 13, 0);

        var tower2 = makeMesh(new THREE.BoxGeometry(8, 26, 8), 0x5A5A5A);
        addMesh(tower2, 0, 13, 0);

        var tower3 = makeMesh(new THREE.BoxGeometry(8, 26, 8), 0x5A5A5A);
        addMesh(tower3, 20, 13, 0);

        // 6 pointed window arches — 3x12x0.5 color 0x87CEEB
        var i;
        var windowPositions = [-20, -12, -4, 4, 12, 20];
        for (i = 0; i < 6; i++) {
            var arch = makeMesh(new THREE.BoxGeometry(3, 12, 0.5), 0x87CEEB);
            addMesh(arch, windowPositions[i], 12, -9.1);
        }

        // 4 turrets — CylinderGeometry r=2.5 h=24 seg=8 color 0x4A4A4A
        var turretPositions = [
            [-26, -10],
            [26, -10],
            [-26, 10],
            [26, 10]
        ];
        for (i = 0; i < 4; i++) {
            var turret = makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 24, 8), 0x4A4A4A);
            addMesh(turret, turretPositions[i][0], 12, turretPositions[i][1]);
        }
    }

    function buildGothicChurch() {
        // Church body — 12w x 8d x 16h color 0x4A4A4A
        var churchBody = makeMesh(new THREE.BoxGeometry(12, 16, 8), 0x4A4A4A);
        addMesh(churchBody, 35, 8, 20);

        // Rose window — CylinderGeometry r=3 h=0.5 seg=12 color 0x87CEEB on west facade
        var roseWindow = makeMesh(new THREE.CylinderGeometry(3, 3, 0.5, 12), 0x87CEEB);
        roseWindow.rotation.x = Math.PI / 2;
        addMesh(roseWindow, 35, 12, 15.9);

        // Slender spire — ConeGeometry r=3 h=14 color 0x3A3A3A
        var spire = makeMesh(new THREE.ConeGeometry(3, 14, 8), 0x3A3A3A);
        addMesh(spire, 35, 23, 20);

        // Flying buttresses — 3 BoxGeometry 1x1x8 angled
        var i;
        var buttressOffsets = [-3, 0, 3];
        for (i = 0; i < 3; i++) {
            var buttress = makeMesh(new THREE.BoxGeometry(1, 1, 8), 0x4A4A4A);
            var bm = addMesh(buttress, 29, 10, 20 + buttressOffsets[i]);
            bm.rotation.z = Math.PI / 6;
        }
    }

    function buildLake() {
        // 6 water tiles — 25x0.5x20 color 0x1B6CA8
        var i;
        var tileOffsets = [-62, -37, -12, 13, 38, 63];
        for (i = 0; i < 6; i++) {
            var tile = makeMesh(new THREE.BoxGeometry(25, 0.5, 20), 0x1B6CA8);
            addMesh(tile, tileOffsets[i], -0.25, -40);
        }

        // Reflection — 3 BoxGeometry 50x1x10 color 0x3A4A5A at water level
        var reflectionOffsets = [-55, 0, 55];
        for (i = 0; i < 3; i++) {
            var refl = makeMesh(new THREE.BoxGeometry(50, 1, 10), 0x3A4A5A);
            addMesh(refl, reflectionOffsets[i], 0, -35);
        }
    }

    function buildMountains() {
        // 4 large mountains
        var mtnData = [
            { w: 40, h: 35, d: 20, x: -80, z: -80, snowR: 6 },
            { w: 35, h: 30, d: 18, x: -40, z: -90, snowR: 5 },
            { w: 45, h: 28, d: 22, x: 20, z: -85, snowR: 7 },
            { w: 30, h: 25, d: 15, x: 70, z: -75, snowR: 5 }
        ];
        var i;
        for (i = 0; i < mtnData.length; i++) {
            var m = mtnData[i];
            var mtn = makeMesh(new THREE.BoxGeometry(m.w, m.h, m.d), 0x4A5A6A);
            addMesh(mtn, m.x, m.h / 2, m.z);

            // Snow cap
            var snow = makeMesh(new THREE.SphereGeometry(m.snowR, 8, 8), 0xF0F0F0);
            addMesh(snow, m.x, m.h + m.snowR * 0.5, m.z);
        }
    }

    function buildWalledGarden() {
        // 4 walls — BoxGeometry 2x6x30 color 0x5A5A5A
        var wallData = [
            { x: -40, z: 45, rx: 0 },
            { x: -70, z: 60, rx: Math.PI / 2 },
            { x: -40, z: 75, rx: 0 },
            { x: -10, z: 60, rx: Math.PI / 2 }
        ];
        var i;
        for (i = 0; i < 4; i++) {
            var wall = makeMesh(new THREE.BoxGeometry(2, 6, 30), 0x5A5A5A);
            var wm = addMesh(wall, wallData[i].x, 3, wallData[i].z);
            wm.rotation.y = wallData[i].rx;
        }

        // Herbaceous borders — 8 flower beds alternating colors
        var flowerColors = [0xFF69B4, 0xFFD700, 0xFF6600, 0x9400D3, 0xFF69B4, 0xFFD700, 0xFF6600, 0x9400D3];
        var flowerX = [-65, -60, -55, -50, -45, -40, -35, -30];
        for (i = 0; i < 8; i++) {
            var bed = makeMesh(new THREE.BoxGeometry(2, 1, 12), flowerColors[i]);
            addMesh(bed, flowerX[i], 0.5, 60);
        }

        // Garden paths — BoxGeometry 2x0.3x20 color 0xD0C0A0
        var pathZ = [50, 70];
        for (i = 0; i < 2; i++) {
            var path = makeMesh(new THREE.BoxGeometry(2, 0.3, 20), 0xD0C0A0);
            addMesh(path, -48, 0.15, pathZ[i]);
        }
    }

    function buildMausoleum() {
        // Main body — 8w x 8d x 12h color 0x5A5A5A
        var body = makeMesh(new THREE.BoxGeometry(8, 12, 8), 0x5A5A5A);
        addMesh(body, 50, 6, 30);

        // 4 corner pillars — CylinderGeometry r=1.5 h=14 color 0x6A6A6A
        var pillarCorners = [
            [-3, -3],
            [3, -3],
            [-3, 3],
            [3, 3]
        ];
        var i;
        for (i = 0; i < 4; i++) {
            var pillar = makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 14, 8), 0x6A6A6A);
            addMesh(pillar, 50 + pillarCorners[i][0], 7, 30 + pillarCorners[i][1]);
        }

        // Pyramid roof — BoxGeometry 10x4x10 color 0x444444
        var roof = makeMesh(new THREE.BoxGeometry(10, 4, 10), 0x444444);
        addMesh(roof, 50, 14, 30);

        // Iron gate — BoxGeometry 6x6x0.5 color 0x333333
        var gate = makeMesh(new THREE.BoxGeometry(6, 6, 0.5), 0x333333);
        addMesh(gate, 50, 3, 25.8);
    }

    function buildBogland() {
        // 6 boggy ground tiles — 20x0.5x15 color 0x5A3A1A
        var i;
        var bogX = [-90, -70, -50, -30, -10, 10];
        for (i = 0; i < 6; i++) {
            var bog = makeMesh(new THREE.BoxGeometry(20, 0.5, 15), 0x5A3A1A);
            addMesh(bog, bogX[i], -0.25, 55);
        }

        // 3 stream channels — BoxGeometry 2x0.5x30 color 0x1B6CA8
        var streamX = [-85, -55, -25];
        for (i = 0; i < 3; i++) {
            var stream = makeMesh(new THREE.BoxGeometry(2, 0.5, 30), 0x1B6CA8);
            addMesh(stream, streamX[i], 0, 55);
        }

        // 8 whin/gorse bushes — SphereGeometry r=2 color 0xFFD700
        var gorsePosns = [
            [-92, 60], [-80, 52], [-68, 58], [-56, 50],
            [-44, 62], [-32, 54], [-20, 60], [-8, 50]
        ];
        for (i = 0; i < 8; i++) {
            var gorse = makeMesh(new THREE.SphereGeometry(2, 8, 8), 0xFFD700);
            addMesh(gorse, gorsePosns[i][0], 2, gorsePosns[i][1]);
        }
    }

    function buildWoodland() {
        // 15 trees — trunk CylinderGeometry r=1.5 h=14, canopy SphereGeometry r=8
        var treePosns = [
            [-55, 5], [-50, 12], [-45, 3], [-60, 8], [-65, 15],
            [-48, 22], [-42, 10], [-38, 18], [-55, 25], [-62, 20],
            [-70, 10], [-35, 5], [-30, 15], [-75, 18], [-32, 28]
        ];
        var i;
        for (i = 0; i < 15; i++) {
            var tx = treePosns[i][0];
            var tz = treePosns[i][1];

            var trunk = makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 14, 8), 0x3D1F08);
            addMesh(trunk, tx, 7, tz);

            var canopy = makeMesh(new THREE.SphereGeometry(8, 8, 8), 0x1A5A1A);
            addMesh(canopy, tx, 20, tz);
        }

        // 4 rhododendron clumps — SphereGeometry r=4 color 0xFF1493
        var rhodoX = [-58, -45, -68, -35];
        var rhodoZ = [30, 35, 28, 32];
        for (i = 0; i < 4; i++) {
            var rhodo = makeMesh(new THREE.SphereGeometry(4, 8, 8), 0xFF1493);
            addMesh(rhodo, rhodoX[i], 4, rhodoZ[i]);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function build() {
        buildAbbey();
        buildGothicChurch();
        buildLake();
        buildMountains();
        buildWalledGarden();
        buildMausoleum();
        buildBogland();
        buildWoodland();
    }

    function update(delta) {
        // No animation needed for static environment
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
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
