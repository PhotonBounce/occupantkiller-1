window.BogMill = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var waterWheelGroup = null;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildBogTerrain();
        buildBogPools();
        buildWatermill();
        buildMillRace();
        buildGrainStorage();
        buildBridges();
        buildDefenses();
        buildBoatDock();
        buildTreesAndReeds();
        buildSnipperPlatform();
        buildAmmunitionCache();
        buildFogMist();
        setupLighting();
    }

    function buildBogTerrain() {
        var colors = [0x3d3028, 0x4a3f35, 0x2d2416, 0x5a4d42, 0x4a4035];
        var colorIdx = 0;
        var startX = -40;
        var startZ = -40;
        var tileSize = 5;
        var tilesPerSide = 16;
        for (var xi = 0; xi < tilesPerSide; xi++) {
            for (var zi = 0; zi < tilesPerSide; zi++) {
                var x = startX + xi * tileSize;
                var z = startZ + zi * tileSize;
                var heightVar = Math.sin(x * 0.1) * 0.3 + Math.cos(z * 0.1) * 0.3;
                var geom = new THREE.BoxGeometry(tileSize - 0.1, 0.5, tileSize - 0.1);
                var mat = new THREE.MeshLambertMaterial({ color: colors[colorIdx % colors.length] });
                var mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(x, heightVar - 0.25, z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                objects.push(mesh);
                colorIdx++;
            }
        }
    }

    function buildBogPools() {
        var poolPositions = [
            { x: -15, z: -20 }, { x: 10, z: -15 }, { x: -25, z: 5 },
            { x: 20, z: 10 }, { x: -5, z: 25 }, { x: 30, z: -5 },
            { x: -30, z: 30 }, { x: 15, z: 28 }
        ];
        for (var i = 0; i < poolPositions.length; i++) {
            var poolPos = poolPositions[i];
            var poolGeom = new THREE.BoxGeometry(6, 0.3, 6);
            var poolMat = new THREE.MeshLambertMaterial({ color: 0x1a2030 });
            var poolMesh = new THREE.Mesh(poolGeom, poolMat);
            poolMesh.position.set(poolPos.x, -0.15, poolPos.z);
            poolMesh.castShadow = true;
            poolMesh.receiveShadow = true;
            scene.add(poolMesh);
            objects.push(poolMesh);
        }
    }

    function buildWatermill() {
        var buildingGeom = new THREE.BoxGeometry(8, 10, 6);
        var buildingMat = new THREE.MeshLambertMaterial({ color: 0x5a5045 });
        var buildingMesh = new THREE.Mesh(buildingGeom, buildingMat);
        buildingMesh.position.set(0, 5, 0);
        buildingMesh.castShadow = true;
        buildingMesh.receiveShadow = true;
        scene.add(buildingMesh);
        objects.push(buildingMesh);

        waterWheelGroup = new THREE.Group();
        var wheelGeom = new THREE.CylinderGeometry(3.5, 3.5, 0.6, 32);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var wheelMesh = new THREE.Mesh(wheelGeom, wheelMat);
        wheelMesh.rotation.z = Math.PI / 2;
        wheelMesh.castShadow = true;
        waterWheelGroup.add(wheelMesh);

        var wheelPaddles = 8;
        for (var p = 0; p < wheelPaddles; p++) {
            var angle = (p / wheelPaddles) * Math.PI * 2;
            var paddleGeom = new THREE.BoxGeometry(0.3, 1.2, 3);
            var paddleMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
            var paddleMesh = new THREE.Mesh(paddleGeom, paddleMat);
            paddleMesh.position.set(0, Math.cos(angle) * 2.5, Math.sin(angle) * 2.5);
            paddleMesh.castShadow = true;
            waterWheelGroup.add(paddleMesh);
        }

        waterWheelGroup.position.set(5, 3.5, 0);
        waterWheelGroup.rotation.x = Math.PI / 2;
        scene.add(waterWheelGroup);
        objects.push(waterWheelGroup);

        var wheelAxleGeom = new THREE.CylinderGeometry(0.2, 0.2, 1, 16);
        var wheelAxleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var wheelAxleMesh = new THREE.Mesh(wheelAxleGeom, wheelAxleMat);
        wheelAxleMesh.position.set(5, 3.5, 0);
        wheelAxleMesh.rotation.z = Math.PI / 2;
        wheelAxleMesh.castShadow = true;
        scene.add(wheelAxleMesh);
        objects.push(wheelAxleMesh);

        var roofGeom = new THREE.ConeGeometry(5, 3, 4);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x3d3028 });
        var roofMesh = new THREE.Mesh(roofGeom, roofMat);
        roofMesh.position.set(0, 10.5, 0);
        roofMesh.castShadow = true;
        scene.add(roofMesh);
        objects.push(roofMesh);
    }

    function buildMillRace() {
        var raceGeom = new THREE.BoxGeometry(2, 1, 8);
        var raceMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var raceMesh = new THREE.Mesh(raceGeom, raceMat);
        raceMesh.position.set(5, 1.5, 4);
        raceMesh.castShadow = true;
        raceMesh.receiveShadow = true;
        scene.add(raceMesh);
        objects.push(raceMesh);

        var channelWallGeom = new THREE.BoxGeometry(0.3, 1, 8);
        for (var w = 0; w < 2; w++) {
            var wallX = 4.15 + (w * 1.7);
            var wallMesh = new THREE.Mesh(channelWallGeom, raceMat);
            wallMesh.position.set(wallX, 2, 4);
            wallMesh.castShadow = true;
            scene.add(wallMesh);
            objects.push(wallMesh);
        }

        var intakeGeom = new THREE.BoxGeometry(3, 1.5, 2);
        var intakeMat = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });
        var intakeMesh = new THREE.Mesh(intakeGeom, intakeMat);
        intakeMesh.position.set(5, 1.5, 12);
        intakeMesh.castShadow = true;
        scene.add(intakeMesh);
        objects.push(intakeMesh);
    }

    function buildGrainStorage() {
        var silo1Geom = new THREE.CylinderGeometry(2.5, 2.5, 6, 32);
        var siloMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var silo1Mesh = new THREE.Mesh(silo1Geom, siloMat);
        silo1Mesh.position.set(-12, 3, -8);
        silo1Mesh.castShadow = true;
        silo1Mesh.receiveShadow = true;
        scene.add(silo1Mesh);
        objects.push(silo1Mesh);

        var silo2Geom = new THREE.CylinderGeometry(2, 2, 5, 32);
        var silo2Mesh = new THREE.Mesh(silo2Geom, siloMat);
        silo2Mesh.position.set(-6, 2.5, -10);
        silo2Mesh.castShadow = true;
        silo2Mesh.receiveShadow = true;
        scene.add(silo2Mesh);
        objects.push(silo2Mesh);

        var granaryGeom = new THREE.BoxGeometry(6, 4, 5);
        var granaryMat = new THREE.MeshLambertMaterial({ color: 0x5a5045 });
        var granaryMesh = new THREE.Mesh(granaryGeom, granaryMat);
        granaryMesh.position.set(-9, 2, -16);
        granaryMesh.castShadow = true;
        granaryMesh.receiveShadow = true;
        scene.add(granaryMesh);
        objects.push(granaryMesh);

        var roofGeom = new THREE.ConeGeometry(3.5, 2, 4);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x3d3028 });
        var roofMesh = new THREE.Mesh(roofGeom, roofMat);
        roofMesh.position.set(-9, 4.5, -16);
        roofMesh.castShadow = true;
        scene.add(roofMesh);
        objects.push(roofMesh);
    }

    function buildBridges() {
        var bridgePairs = [
            { x: -15, z: -20 }, { x: 10, z: -15 }, { x: -25, z: 5 },
            { x: 20, z: 10 }
        ];

        for (var b = 0; b < bridgePairs.length; b++) {
            var bp = bridgePairs[b];
            var plankGeom = new THREE.BoxGeometry(3.5, 0.4, 4);
            var plankMat = new THREE.MeshLambertMaterial({ color: 0x8b8b7a });
            var plankMesh = new THREE.Mesh(plankGeom, plankMat);
            plankMesh.position.set(bp.x, 0.2, bp.z);
            plankMesh.castShadow = true;
            plankMesh.receiveShadow = true;
            scene.add(plankMesh);
            objects.push(plankMesh);

            var postGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 16);
            var postMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
            for (var ps = 0; ps < 4; ps++) {
                var postX = bp.x - 1 + (ps % 2) * 2;
                var postZ = bp.z - 1.5 + Math.floor(ps / 2) * 3;
                var postMesh = new THREE.Mesh(postGeom, postMat);
                postMesh.position.set(postX, -0.1, postZ);
                postMesh.castShadow = true;
                scene.add(postMesh);
                objects.push(postMesh);
            }
        }
    }

    function buildDefenses() {
        var barricadePositions = [
            { x: -20, z: 15 }, { x: 15, z: 20 }, { x: 25, z: -10 },
            { x: -35, z: -25 }
        ];

        for (var ba = 0; ba < barricadePositions.length; ba++) {
            var bp = barricadePositions[ba];
            for (var bl = 0; bl < 3; bl++) {
                var logGeom = new THREE.BoxGeometry(0.4, 0.4, 3);
                var logMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
                var logMesh = new THREE.Mesh(logGeom, logMat);
                logMesh.position.set(bp.x, 0.4 + bl * 0.5, bp.z);
                logMesh.rotation.y = (bl % 2) * Math.PI / 4;
                logMesh.castShadow = true;
                scene.add(logMesh);
                objects.push(logMesh);
            }
        }

        var stakePositions = [
            { x: -18, z: 17 }, { x: 17, z: 22 }, { x: 27, z: -8 },
            { x: -33, z: -23 }, { x: -12, z: 8 }, { x: 8, z: -12 }
        ];

        for (var st = 0; st < stakePositions.length; st++) {
            var sp = stakePositions[st];
            var stakeGeom = new THREE.ConeGeometry(0.15, 1.8, 16);
            var stakeMat = new THREE.MeshLambertMaterial({ color: 0x2a2417 });
            var stakeMesh = new THREE.Mesh(stakeGeom, stakeMat);
            stakeMesh.position.set(sp.x, 0.9, sp.z);
            stakeMesh.castShadow = true;
            scene.add(stakeMesh);
            objects.push(stakeMesh);
        }
    }

    function buildBoatDock() {
        var dockGeom = new THREE.BoxGeometry(5, 0.5, 3);
        var dockMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var dockMesh = new THREE.Mesh(dockGeom, dockMat);
        dockMesh.position.set(35, 0, 5);
        dockMesh.castShadow = true;
        dockMesh.receiveShadow = true;
        scene.add(dockMesh);
        objects.push(dockMesh);

        var pilingGeom = new THREE.CylinderGeometry(0.25, 0.25, 2, 16);
        var pilingMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        for (var pi = 0; pi < 4; pi++) {
            var pilingX = 33 + (pi % 2) * 4;
            var pilingZ = 3 + Math.floor(pi / 2) * 4;
            var pilingMesh = new THREE.Mesh(pilingGeom, pilingMat);
            pilingMesh.position.set(pilingX, -0.5, pilingZ);
            pilingMesh.castShadow = true;
            scene.add(pilingMesh);
            objects.push(pilingMesh);
        }

        var boatHullGeom = new THREE.BoxGeometry(4, 1.2, 2);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x5a4535 });
        var boatMesh = new THREE.Mesh(boatHullGeom, boatMat);
        boatMesh.position.set(40, 0.6, 5);
        boatMesh.castShadow = true;
        boatMesh.receiveShadow = true;
        scene.add(boatMesh);
        objects.push(boatMesh);

        var gunwaleGeom = new THREE.BoxGeometry(4.2, 0.3, 2.2);
        var gunwaleMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var gunwaleMesh = new THREE.Mesh(gunwaleGeom, gunwaleMat);
        gunwaleMesh.position.set(40, 1.8, 5);
        gunwaleMesh.castShadow = true;
        scene.add(gunwaleMesh);
        objects.push(gunwaleMesh);
    }

    function buildTreesAndReeds() {
        var treePositions = [
            { x: -30, z: 20 }, { x: -25, z: 15 }, { x: 30, z: 25 },
            { x: 28, z: 18 }, { x: -35, z: -30 }, { x: -20, z: -35 },
            { x: 35, z: -20 }
        ];

        for (var tr = 0; tr < treePositions.length; tr++) {
            var tp = treePositions[tr];
            var tiltAngle = (Math.random() - 0.5) * 0.4;
            var treeGeom = new THREE.CylinderGeometry(0.35, 0.45, 7, 16);
            var treeMat = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });
            var treeMesh = new THREE.Mesh(treeGeom, treeMat);
            treeMesh.position.set(tp.x, 3.5, tp.z);
            treeMesh.rotation.z = tiltAngle;
            treeMesh.castShadow = true;
            treeMesh.receiveShadow = true;
            scene.add(treeMesh);
            objects.push(treeMesh);
        }

        var reedZones = [
            { x: -20, z: -22, count: 12 }, { x: 12, z: -14, count: 10 },
            { x: -25, z: 8, count: 15 }, { x: 22, z: 12, count: 12 },
            { x: -5, z: 28, count: 10 }
        ];

        for (var rz = 0; rz < reedZones.length; rz++) {
            var zone = reedZones[rz];
            for (var rc = 0; rc < zone.count; rc++) {
                var reedX = zone.x + (Math.random() - 0.5) * 3;
                var reedZ = zone.z + (Math.random() - 0.5) * 3;
                var reedGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8);
                var reedMat = new THREE.MeshLambertMaterial({ color: 0x4a6b3d });
                var reedMesh = new THREE.Mesh(reedGeom, reedMat);
                reedMesh.position.set(reedX, 1.25, reedZ);
                reedMesh.castShadow = true;
                scene.add(reedMesh);
                objects.push(reedMesh);
            }
        }
    }

    function buildSnipperPlatform() {
        var supportGeom = new THREE.CylinderGeometry(0.4, 0.5, 8, 16);
        var supportMat = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });
        var supportMesh = new THREE.Mesh(supportGeom, supportMat);
        supportMesh.position.set(-32, 4, 18);
        supportMesh.castShadow = true;
        scene.add(supportMesh);
        objects.push(supportMesh);

        var platformGeom = new THREE.BoxGeometry(3, 0.5, 2.5);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var platformMesh = new THREE.Mesh(platformGeom, platformMat);
        platformMesh.position.set(-32, 8.5, 18);
        platformMesh.castShadow = true;
        platformMesh.receiveShadow = true;
        scene.add(platformMesh);
        objects.push(platformMesh);

        var railGeom = new THREE.BoxGeometry(3.3, 0.4, 0.3);
        var railMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        for (var ra = 0; ra < 2; ra++) {
            var railZ = 18 - 1 + ra * 2;
            var railMesh = new THREE.Mesh(railGeom, railMat);
            railMesh.position.set(-32, 9.3, railZ);
            railMesh.castShadow = true;
            scene.add(railMesh);
            objects.push(railMesh);
        }
    }

    function buildAmmunitionCache() {
        var crateGeom = new THREE.BoxGeometry(1.5, 1.2, 1.2);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        for (var cr = 0; cr < 5; cr++) {
            var crateX = -18 + cr * 1.8;
            var crateZ = -22;
            var crateY = cr >= 3 ? 1.5 : 0.6;
            var crateMesh = new THREE.Mesh(crateGeom, crateMat);
            crateMesh.position.set(crateX, crateY, crateZ);
            crateMesh.castShadow = true;
            crateMesh.receiveShadow = true;
            scene.add(crateMesh);
            objects.push(crateMesh);
        }

        var netGeom = new THREE.BoxGeometry(8, 2, 2.5);
        var netMat = new THREE.MeshLambertMaterial({ color: 0x5a6b4a });
        var netMesh = new THREE.Mesh(netGeom, netMat);
        netMesh.position.set(-18, 2, -22);
        netMesh.castShadow = true;
        netMesh.receiveShadow = true;
        scene.add(netMesh);
        objects.push(netMesh);
    }

    function buildFogMist() {
        var mistZones = [
            { x: -15, z: -20, count: 8 }, { x: 10, z: -15, count: 6 },
            { x: -25, z: 5, count: 7 }, { x: 20, z: 10, count: 5 },
            { x: -5, z: 25, count: 9 }, { x: 30, z: -5, count: 6 },
            { x: -30, z: 30, count: 8 }, { x: 15, z: 28, count: 7 }
        ];

        for (var mz = 0; mz < mistZones.length; mz++) {
            var zone = mistZones[mz];
            for (var mc = 0; mc < zone.count; mc++) {
                var mistX = zone.x + (Math.random() - 0.5) * 4;
                var mistZ = zone.z + (Math.random() - 0.5) * 4;
                var mistGeom = new THREE.SphereGeometry(1.2, 8, 8);
                var mistMat = new THREE.MeshLambertMaterial({ color: 0x9b9b9b, transparent: true, opacity: 0.15 });
                var mistMesh = new THREE.Mesh(mistGeom, mistMat);
                mistMesh.position.set(mistX, 0.8 + Math.random() * 1.2, mistZ);
                scene.add(mistMesh);
                objects.push(mistMesh);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xcccccc, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(30, 20, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var missileLight = new THREE.PointLight(0xff6b35, 0.5, 20);
        missileLight.position.set(-32, 8.5, 18);
        scene.add(missileLight);
        lights.push(missileLight);

        var dockLight = new THREE.PointLight(0xffaa44, 0.4, 15);
        dockLight.position.set(35, 2, 5);
        scene.add(dockLight);
        lights.push(dockLight);
    }

    function update(delta) {
        if (waterWheelGroup) {
            waterWheelGroup.rotation.x += delta * 0.3;
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
        waterWheelGroup = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
