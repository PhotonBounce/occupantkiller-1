window.WireFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var flareLights = [];
    var flareOffsets = [];

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function addLineSegments(geometry, material, x, y, z) {
        var line = new THREE.LineSegments(geometry, material);
        line.position.set(x, y, z);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function buildBattleground() {
        var mudMat = new THREE.MeshLambertMaterial({ color: 0x3D2B1A });
        var x, z;
        for (x = -100; x < 100; x += 50) {
            for (z = -100; z < 100; z += 50) {
                addMesh(new THREE.BoxGeometry(50, 1, 50), mudMat, x, 0, z);
            }
        }
        var craterMat = new THREE.MeshLambertMaterial({ color: 0x2A1F14 });
        var craterGeo = new THREE.BoxGeometry(15, 3, 15);
        addMesh(craterGeo, craterMat, 20, -1.5, -30);
        addMesh(craterGeo, craterMat, -35, -1.5, 25);
        addMesh(craterGeo, craterMat, 60, -1.5, -50);
        addMesh(craterGeo, craterMat, -50, -1.5, -40);
        var debrisGeo = new THREE.SphereGeometry(0.5, 4, 4);
        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var di;
        for (di = 0; di < 20; di++) {
            addMesh(debrisGeo, debrisMat, 20 + Math.random() * 10 - 5, 0.5, -30 + Math.random() * 10 - 5);
        }
    }

    function buildTrenchNetwork() {
        var revetMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var trenchMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        var i, j;
        for (i = 0; i < 3; i++) {
            var trenchZ = -40 + i * 40;
            var trenchX;
            for (trenchX = -80; trenchX < 80; trenchX += 20) {
                addMesh(new THREE.BoxGeometry(20, 2, 2), trenchMat, trenchX, -1, trenchZ);
            }
            addMesh(new THREE.BoxGeometry(1, 3, 100), revetMat, -85, 0.5, trenchZ);
            addMesh(new THREE.BoxGeometry(1, 3, 100), revetMat, 85, 0.5, trenchZ);
            for (j = 0; j < 8; j++) {
                addMesh(new THREE.BoxGeometry(20, 0.3, 0.5), revetMat, -80 + j * 20, 0.5, trenchZ - 1.5);
                addMesh(new THREE.BoxGeometry(20, 0.3, 0.5), revetMat, -80 + j * 20, 0.5, trenchZ + 1.5);
            }
        }
        var fireStepMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        for (i = 0; i < 3; i++) {
            trenchZ = -40 + i * 40;
            for (j = 0; j < 8; j++) {
                addMesh(new THREE.BoxGeometry(5, 0.5, 1), fireStepMat, -80 + j * 20, 1.5, trenchZ - 2.5);
                addMesh(new THREE.BoxGeometry(5, 0.5, 1), fireStepMat, -80 + j * 20, 1.5, trenchZ + 2.5);
            }
        }
    }

    function buildWireEntanglements() {
        var postGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var wireLineGeo = new THREE.BufferGeometry();
        var wireLineMat = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
        var wireZ, wireX, beltIdx, postIdx;
        var beltOffsets = [-25, -15, 0, 15, 25, 40];
        for (beltIdx = 0; beltIdx < 6; beltIdx++) {
            wireZ = beltOffsets[beltIdx];
            for (postIdx = 0; postIdx < 15; postIdx++) {
                wireX = -70 + postIdx * 10;
                addMesh(postGeo, postMat, wireX, 1.5, wireZ);
            }
            var vertices = [];
            for (postIdx = 0; postIdx < 15; postIdx++) {
                wireX = -70 + postIdx * 10;
                vertices.push(wireX, 1, wireZ);
                vertices.push(wireX + 10, 1, wireZ);
                vertices.push(wireX, 2.5, wireZ);
                vertices.push(wireX + 10, 2.5, wireZ);
            }
            wireLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            addLineSegments(wireLineGeo, wireLineMat, 0, 0, 0);
        }
    }

    function buildMachineGunNests() {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var sandMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var mgBarrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var nestIdx;
        var nestPositions = [
            [-60, 40],
            [60, -35],
            [-50, -60],
            [50, 30],
            [0, 60]
        ];
        for (nestIdx = 0; nestIdx < 5; nestIdx++) {
            var nx = nestPositions[nestIdx][0];
            var nz = nestPositions[nestIdx][1];
            addMesh(new THREE.BoxGeometry(8, 1, 8), concreteMat, nx, 0, nz);
            addMesh(new THREE.BoxGeometry(8, 2, 0.5), sandMat, nx, 1, nz - 4);
            addMesh(new THREE.BoxGeometry(8, 2, 0.5), sandMat, nx, 1, nz + 4);
            addMesh(new THREE.BoxGeometry(0.5, 2, 8), sandMat, nx - 4, 1, nz);
            addMesh(new THREE.BoxGeometry(0.5, 2, 8), sandMat, nx + 4, 1, nz);
            addMesh(new THREE.BoxGeometry(2, 0.5, 8), concreteMat, nx, 2, nz);
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 4, 6), mgBarrelMat, nx, 2.5, nz);
        }
    }

    function buildBunkerSystem() {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var scopeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var bunkerIdx;
        var bunkerPos = [
            [-70, -70],
            [70, 70],
            [0, -50]
        ];
        for (bunkerIdx = 0; bunkerIdx < 3; bunkerIdx++) {
            var bx = bunkerPos[bunkerIdx][0];
            var bz = bunkerPos[bunkerIdx][1];
            addMesh(new THREE.BoxGeometry(12, 3, 12), concreteMat, bx, 1.5, bz);
            addMesh(new THREE.BoxGeometry(12, 0.5, 12), concreteMat, bx, 4, bz);
            addMesh(new THREE.BoxGeometry(3, 2.5, 12), doorMat, bx - 5, 1.25, bz);
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8), scopeMat, bx, 4.5, bz);
            addMesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), scopeMat, bx, 5.2, bz);
        }
    }

    function buildCommunicationLines() {
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var wireLineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
        var wireX, wireZ, idx;
        for (wireX = -60; wireX < 70; wireX += 15) {
            addMesh(poleGeo, poleMat, wireX, 2.5, -70);
            addMesh(poleGeo, poleMat, wireX, 2.5, 0);
            addMesh(poleGeo, poleMat, wireX, 2.5, 70);
        }
        var wireVertices = [];
        for (idx = 0; idx < 10; idx++) {
            wireX = -60 + idx * 15;
            wireVertices.push(wireX, 5, -70);
            wireVertices.push(wireX + 15, 5, -70);
            wireVertices.push(wireX, 5, 0);
            wireVertices.push(wireX + 15, 5, 0);
            wireVertices.push(wireX, 5, 70);
            wireVertices.push(wireX + 15, 5, 70);
        }
        var wireGeo = new THREE.BufferGeometry();
        wireGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wireVertices), 3));
        addLineSegments(wireGeo, wireLineMat, 0, 0, 0);
    }

    function buildArtilleryHoles() {
        var scorchMat = new THREE.MeshLambertMaterial({ color: 0x1A1410 });
        var debrisGeo = new THREE.SphereGeometry(0.6, 4, 4);
        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var craterGeo = new THREE.BoxGeometry(20, 4, 20);
        var holeIdx, debIdx;
        var holePositions = [
            [-75, 50],
            [40, 75],
            [-40, -75],
            [75, -45],
            [30, 20],
            [-55, 35],
            [60, -70],
            [-30, -30]
        ];
        for (holeIdx = 0; holeIdx < 8; holeIdx++) {
            var hx = holePositions[holeIdx][0];
            var hz = holePositions[holeIdx][1];
            addMesh(craterGeo, scorchMat, hx, -2, hz);
            for (debIdx = 0; debIdx < 5; debIdx++) {
                addMesh(debrisGeo, debrisMat, hx + Math.random() * 15 - 7.5, 1, hz + Math.random() * 15 - 7.5);
            }
        }
    }

    function buildSupplyRoute() {
        var boardMat = new THREE.MeshLambertMaterial({ color: 0x704020 });
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
        var boardIdx, crateIdx;
        for (boardIdx = 0; boardIdx < 20; boardIdx++) {
            addMesh(new THREE.BoxGeometry(2, 0.2, 4), boardMat, -80 + boardIdx * 8, -0.5, 0);
        }
        var cratePositions = [
            [-70, 0],
            [-40, 0],
            [0, 0],
            [40, 0]
        ];
        for (crateIdx = 0; crateIdx < 4; crateIdx++) {
            var cx = cratePositions[crateIdx][0];
            var cz = cratePositions[crateIdx][1];
            addMesh(new THREE.BoxGeometry(3, 2, 3), crateMat, cx, 1.5, cz);
            addMesh(new THREE.BoxGeometry(3, 2, 3), crateMat, cx + 3.5, 1.5, cz);
            addMesh(new THREE.BoxGeometry(3, 2, 3), crateMat, cx + 7, 1.5, cz);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x445544, 0.6);
        addLight(ambientLight);
        var flareLight1 = new THREE.PointLight(0xFFFFAA, 1.5, 150);
        flareLight1.position.set(-50, 40, -50);
        addLight(flareLight1);
        flareLights.push(flareLight1);
        flareOffsets.push(0);
        var flareLight2 = new THREE.PointLight(0xFFFFAA, 1.5, 150);
        flareLight2.position.set(50, 35, 50);
        addLight(flareLight2);
        flareLights.push(flareLight2);
        flareOffsets.push(Math.PI * 0.7);
        var flareLight3 = new THREE.PointLight(0xFFFFAA, 1.5, 150);
        flareLight3.position.set(0, 45, 0);
        addLight(flareLight3);
        flareLights.push(flareLight3);
        flareOffsets.push(Math.PI * 1.4);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        flareLights = [];
        flareOffsets = [];
        buildBattleground();
        buildTrenchNetwork();
        buildWireEntanglements();
        buildMachineGunNests();
        buildBunkerSystem();
        buildCommunicationLines();
        buildArtilleryHoles();
        buildSupplyRoute();
        setupLighting();
    }

    function update(delta) {
        var idx;
        for (idx = 0; idx < flareLights.length; idx++) {
            var light = flareLights[idx];
            var offset = flareOffsets[idx];
            var timeVal = Date.now() * 0.001;
            var bobAmount = Math.sin(timeVal + offset) * 8;
            light.position.y = 35 + bobAmount;
            light.intensity = 1.5 + Math.sin(timeVal + offset) * 0.3;
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        flareLights = [];
        flareOffsets = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
