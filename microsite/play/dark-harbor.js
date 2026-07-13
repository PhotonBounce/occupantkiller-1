window.DarkHarbor = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var boatStates = [];
    var searchlightStates = [];
    var waterMeshes = [];
    var time = 0;

    function buildWater() {
        var waterGeom = new THREE.BoxGeometry(200, 8, 200);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x0a1428 });
        var waterMesh = new THREE.Mesh(waterGeom, waterMat);
        waterMesh.position.set(0, -10, 0);
        waterMesh.receiveShadow = true;
        scene.add(waterMesh);
        objects.push(waterMesh);
        waterMeshes.push(waterMesh);
    }

    function buildDocks() {
        var plankColor = 0x3a2415;
        var poleColor = 0x1a1410;
        var dockPositions = [
            { x: -40, z: -20 },
            { x: -40, z: 20 },
            { x: 40, z: -20 },
            { x: 40, z: 20 }
        ];
        for (var d = 0; d < dockPositions.length; d++) {
            var pos = dockPositions[d];
            var plankGeom = new THREE.BoxGeometry(50, 3, 20);
            var plankMat = new THREE.MeshLambertMaterial({ color: plankColor });
            var plankMesh = new THREE.Mesh(plankGeom, plankMat);
            plankMesh.position.set(pos.x, -3, pos.z);
            plankMesh.castShadow = true;
            plankMesh.receiveShadow = true;
            scene.add(plankMesh);
            objects.push(plankMesh);
            for (var p = 0; p < 5; p++) {
                var poleGeom = new THREE.CylinderGeometry(1.5, 1.5, 15, 16);
                var poleMat = new THREE.MeshLambertMaterial({ color: poleColor });
                var poleMesh = new THREE.Mesh(poleGeom, poleMat);
                poleMesh.position.set(pos.x - 20 + p * 10, -10, pos.z);
                poleMesh.castShadow = true;
                poleMesh.receiveShadow = true;
                scene.add(poleMesh);
                objects.push(poleMesh);
            }
        }
    }

    function buildShips() {
        var shipConfigs = [
            { x: -60, z: -50, length: 40, width: 15, height: 12, color: 0x4a4a4a },
            { x: -60, z: 0, length: 50, width: 18, height: 14, color: 0x3a3a3a },
            { x: -60, z: 50, length: 35, width: 12, height: 10, color: 0x5a5a5a }
        ];
        for (var s = 0; s < shipConfigs.length; s++) {
            var cfg = shipConfigs[s];
            var hullGeom = new THREE.BoxGeometry(cfg.length, cfg.height, cfg.width);
            var hullMat = new THREE.MeshLambertMaterial({ color: cfg.color });
            var hullMesh = new THREE.Mesh(hullGeom, hullMat);
            hullMesh.position.set(cfg.x, 0, cfg.z);
            hullMesh.castShadow = true;
            hullMesh.receiveShadow = true;
            scene.add(hullMesh);
            objects.push(hullMesh);
            boatStates.push({ mesh: hullMesh, baseY: hullMesh.position.y, amplitude: 0.3, frequency: 0.5 + s * 0.1 });
            var deckGeom = new THREE.BoxGeometry(cfg.length - 2, 2, cfg.width);
            var deckMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var deckMesh = new THREE.Mesh(deckGeom, deckMat);
            deckMesh.position.set(cfg.x, cfg.height / 2 + 1, cfg.z);
            deckMesh.castShadow = true;
            scene.add(deckMesh);
            objects.push(deckMesh);
            var cabinGeom = new THREE.BoxGeometry(cfg.length / 3, cfg.height / 1.5, cfg.width / 1.5);
            var cabinMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var cabinMesh = new THREE.Mesh(cabinGeom, cabinMat);
            cabinMesh.position.set(cfg.x + cfg.length / 3, cfg.height / 2 + 5, cfg.z);
            cabinMesh.castShadow = true;
            scene.add(cabinMesh);
            objects.push(cabinMesh);
        }
    }

    function buildWarehouses() {
        var warehouseConfigs = [
            { x: 50, z: -60, width: 40, depth: 50, height: 30 },
            { x: 50, z: 60, width: 40, depth: 50, height: 30 },
            { x: 100, z: 0, width: 35, depth: 45, height: 28 }
        ];
        for (var w = 0; w < warehouseConfigs.length; w++) {
            var cfg = warehouseConfigs[w];
            var wallMat = new THREE.MeshLambertMaterial({ color: 0x2a2410 });
            var wallGeom = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
            var wallMesh = new THREE.Mesh(wallGeom, wallMat);
            wallMesh.position.set(cfg.x, cfg.height / 2 - 2, cfg.z);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            scene.add(wallMesh);
            objects.push(wallMesh);
            for (var cw = 0; cw < 3; cw++) {
                var cacheGeom = new THREE.BoxGeometry(10, 8, 10);
                var cacheMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
                var cacheMesh = new THREE.Mesh(cacheGeom, cacheMat);
                cacheMesh.position.set(cfg.x - cfg.width / 3 + cw * cfg.width / 3, 5, cfg.z - cfg.depth / 3);
                cacheMesh.castShadow = true;
                scene.add(cacheMesh);
                objects.push(cacheMesh);
            }
        }
    }

    function buildCrane() {
        var mastGeom = new THREE.CylinderGeometry(2, 2, 50, 16);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var mastMesh = new THREE.Mesh(mastGeom, mastMat);
        mastMesh.position.set(-20, 25, -40);
        mastMesh.castShadow = true;
        scene.add(mastMesh);
        objects.push(mastMesh);
        var boomGeom = new THREE.BoxGeometry(30, 2, 2);
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var boomMesh = new THREE.Mesh(boomGeom, boomMat);
        boomMesh.position.set(-5, 45, -40);
        boomMesh.castShadow = true;
        scene.add(boomMesh);
        objects.push(boomMesh);
        var hookGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var hookMat = new THREE.MeshLambertMaterial({ color: 0x8a8a8a });
        var hookMesh = new THREE.Mesh(hookGeom, hookMat);
        hookMesh.position.set(10, 42, -40);
        hookMesh.castShadow = true;
        scene.add(hookMesh);
        objects.push(hookMesh);
    }

    function buildDefenses() {
        var towerPositions = [
            { x: 80, z: -70 },
            { x: 80, z: 70 }
        ];
        for (var t = 0; t < towerPositions.length; t++) {
            var tpos = towerPositions[t];
            var towerGeom = new THREE.CylinderGeometry(4, 4, 40, 16);
            var towerMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var towerMesh = new THREE.Mesh(towerGeom, towerMat);
            towerMesh.position.set(tpos.x, 20, tpos.z);
            towerMesh.castShadow = true;
            scene.add(towerMesh);
            objects.push(towerMesh);
            var searchlightGeom = new THREE.ConeGeometry(3, 4, 12);
            var searchMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var searchMesh = new THREE.Mesh(searchlightGeom, searchMat);
            searchMesh.position.set(tpos.x, 42, tpos.z);
            searchMesh.castShadow = true;
            scene.add(searchMesh);
            objects.push(searchMesh);
            searchlightStates.push({ mesh: searchMesh, baseY: searchMesh.position.y, amplitude: 60, frequency: 0.3 + t * 0.2 });
        }
    }

    function buildSpeedboat() {
        var hullGeom = new THREE.BoxGeometry(15, 4, 6);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var hullMesh = new THREE.Mesh(hullGeom, hullMat);
        hullMesh.position.set(20, 2, -70);
        hullMesh.castShadow = true;
        scene.add(hullMesh);
        objects.push(hullMesh);
        boatStates.push({ mesh: hullMesh, baseY: hullMesh.position.y, amplitude: 0.2, frequency: 0.7 });
        var cabinGeom = new THREE.BoxGeometry(6, 3, 4);
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var cabinMesh = new THREE.Mesh(cabinGeom, cabinMat);
        cabinMesh.position.set(20, 5, -70);
        cabinMesh.castShadow = true;
        scene.add(cabinMesh);
        objects.push(cabinMesh);
    }

    function buildSubmarine() {
        var hullGeom = new THREE.CylinderGeometry(6, 6, 50, 20);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
        var hullMesh = new THREE.Mesh(hullGeom, hullMat);
        hullMesh.position.set(-100, -5, 80);
        hullMesh.castShadow = true;
        hullMesh.receiveShadow = true;
        scene.add(hullMesh);
        objects.push(hullMesh);
        var conningGeom = new THREE.CylinderGeometry(3, 3, 15, 16);
        var conningMat = new THREE.MeshLambertMaterial({ color: 0x2a2a3a });
        var conningMesh = new THREE.Mesh(conningGeom, conningMat);
        conningMesh.position.set(-100, 2, 80);
        conningMesh.castShadow = true;
        scene.add(conningMesh);
        objects.push(conningMesh);
        for (var p = 0; p < 3; p++) {
            var portGeom = new THREE.SphereGeometry(1.2, 8, 8);
            var portMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var portMesh = new THREE.Mesh(portGeom, portMat);
            portMesh.position.set(-100 - 10 + p * 10, 0, 80);
            portMesh.castShadow = true;
            scene.add(portMesh);
            objects.push(portMesh);
        }
    }

    function buildFueldrums() {
        var drumPositions = [
            { x: -40, z: -20 },
            { x: -40, z: 20 },
            { x: 40, z: -20 },
            { x: 40, z: 20 }
        ];
        for (var d = 0; d < drumPositions.length; d++) {
            var dpos = drumPositions[d];
            for (var dr = 0; dr < 4; dr++) {
                var drumGeom = new THREE.CylinderGeometry(2, 2, 8, 12);
                var drumMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
                var drumMesh = new THREE.Mesh(drumGeom, drumMat);
                drumMesh.position.set(dpos.x + dr * 5, 4, dpos.z);
                drumMesh.castShadow = true;
                drumMesh.receiveShadow = true;
                scene.add(drumMesh);
                objects.push(drumMesh);
            }
        }
    }

    function buildChains() {
        var shipPositions = [
            { x: -60, z: -50 },
            { x: -60, z: 0 },
            { x: -60, z: 50 }
        ];
        for (var s = 0; s < shipPositions.length; s++) {
            var spos = shipPositions[s];
            var dpos = spos.z < 0 ? { x: -40, z: -20 } : (spos.z > 0 ? { x: -40, z: 20 } : { x: -40, z: -20 });
            var points = [
                new THREE.Vector3(spos.x, 5, spos.z),
                new THREE.Vector3(dpos.x, -3, dpos.z)
            ];
            var lineGeom = new THREE.BufferGeometry().setFromPoints(points);
            var lineMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 2 });
            var lineMesh = new THREE.LineSegments(lineGeom, lineMat);
            scene.add(lineMesh);
            objects.push(lineMesh);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x2a3a4a, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0x5a6a7a, 0.5);
        directionalLight.position.set(50, 60, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -150;
        directionalLight.shadow.camera.right = 150;
        directionalLight.shadow.camera.top = 150;
        directionalLight.shadow.camera.bottom = -150;
        directionalLight.shadow.camera.far = 300;
        scene.add(directionalLight);
        lights.push(directionalLight);
        var searchlight1 = new THREE.PointLight(0xffffff, 0.8, 100);
        searchlight1.position.set(80, 45, -70);
        searchlight1.castShadow = true;
        scene.add(searchlight1);
        lights.push(searchlight1);
        var searchlight2 = new THREE.PointLight(0xffffff, 0.8, 100);
        searchlight2.position.set(80, 45, 70);
        searchlight2.castShadow = true;
        scene.add(searchlight2);
        lights.push(searchlight2);
        var dockLight1 = new THREE.PointLight(0x8a6a3a, 0.6, 50);
        dockLight1.position.set(-40, 10, -20);
        scene.add(dockLight1);
        lights.push(dockLight1);
        var dockLight2 = new THREE.PointLight(0x8a6a3a, 0.6, 50);
        dockLight2.position.set(-40, 10, 20);
        scene.add(dockLight2);
        lights.push(dockLight2);
        var warehouseLight = new THREE.PointLight(0x6a5a3a, 0.5, 80);
        warehouseLight.position.set(50, 20, 0);
        scene.add(warehouseLight);
        lights.push(warehouseLight);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        boatStates = [];
        searchlightStates = [];
        waterMeshes = [];
        buildWater();
        buildDocks();
        buildShips();
        buildWarehouses();
        buildCrane();
        buildDefenses();
        buildSpeedboat();
        buildSubmarine();
        buildFueldrums();
        buildChains();
        setupLighting();
    }

    function update(delta) {
        time += delta;
        for (var i = 0; i < boatStates.length; i++) {
            var boat = boatStates[i];
            boat.mesh.position.y = boat.baseY + Math.sin(time * boat.frequency) * boat.amplitude;
        }
        for (var j = 0; j < searchlightStates.length; j++) {
            var searchlight = searchlightStates[j];
            var rotationAngle = Math.sin(time * searchlight.frequency) * 1.2;
            searchlight.mesh.rotation.z = rotationAngle;
        }
        for (var w = 0; w < waterMeshes.length; w++) {
            var waterMesh = waterMeshes[w];
            var shimmerScale = 1 + Math.sin(time * 0.8) * 0.05;
            waterMesh.scale.y = shimmerScale;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        boatStates = [];
        searchlightStates = [];
        waterMeshes = [];
        scene = null;
        camera = null;
        time = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
