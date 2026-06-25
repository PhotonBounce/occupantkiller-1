window.MastHill = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var radarDishes = [];
    var warningLight = null;
    var smokeParticles = [];

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

    function addLine(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        radarDishes = [];
        smokeParticles = [];

        buildHillTerrain();
        buildMainMast();
        buildRadarArrays();
        buildControlBunker();
        buildCableTrench();
        buildPerimeterDefense();
        buildSignalTowers();
        buildAttackDamage();
        setupLighting();
    }

    function buildHillTerrain() {
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x4A5A2A });
        var baseSize = 35;
        var layers = 5;
        var heightPerLayer = 2;

        for (var i = 0; i < layers; i++) {
            var size = baseSize - (i * 4);
            var height = heightPerLayer;
            var geo = new THREE.BoxGeometry(size, height, size);
            var mesh = addMesh(geo, terrainMat, 0, i * heightPerLayer + height * 0.5, 0);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        var hilltopMat = new THREE.MeshLambertMaterial({ color: 0x5A6A3A });
        var topGeo = new THREE.BoxGeometry(8, 1, 8);
        var topMesh = addMesh(topGeo, hilltopMat, 0, 10.5, 0);
        topMesh.castShadow = true;
        topMesh.receiveShadow = true;
    }

    function buildMainMast() {
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        var mastGeo = new THREE.CylinderGeometry(0.8, 0.8, 45, 16);
        var mast = addMesh(mastGeo, mastMat, 0, 10 + 22.5, 0);
        mast.castShadow = true;
        mast.receiveShadow = true;

        var midpointY = 10 + 22.5;

        var anchors = [
            new THREE.Vector3(12, 2, 12),
            new THREE.Vector3(-12, 2, 12),
            new THREE.Vector3(-12, 2, -12),
            new THREE.Vector3(12, 2, -12)
        ];

        for (var i = 0; i < anchors.length; i++) {
            var points = [
                new THREE.Vector3(0, midpointY, 0),
                anchors[i]
            ];
            addLine(points, 0xAAAAAA);
        }

        var baseRingGeo = new THREE.CylinderGeometry(2, 2, 0.5, 16);
        var baseRingMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var baseRing = addMesh(baseRingGeo, baseRingMat, 0, 10.2, 0);
        baseRing.castShadow = true;
        baseRing.receiveShadow = true;
    }

    function buildRadarArrays() {
        var positions = [
            { x: 8, y: 15, z: 8, rotation: 0 },
            { x: -10, y: 14, z: 7, rotation: Math.PI / 4 },
            { x: 6, y: 16, z: -10, rotation: -Math.PI / 3 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            buildRadarUnit(pos.x, pos.y, pos.z, pos.rotation, i);
        }
    }

    function buildRadarUnit(x, y, z, rot, index) {
        var dishMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
        var armMat = new THREE.MeshLambertMaterial({ color: 0x666655 });

        var mountGeo = new THREE.CylinderGeometry(0.6, 0.6, 3, 12);
        var mount = addMesh(mountGeo, armMat, x, y - 1.5, z);
        mount.castShadow = true;
        mount.receiveShadow = true;

        var dishGeo = new THREE.BoxGeometry(8, 0.3, 8);
        var dish = addMesh(dishGeo, dishMat, x, y + 2, z);
        dish.castShadow = true;
        dish.receiveShadow = true;
        dish.rotation.x = rot;

        var backBraceGeo = new THREE.BoxGeometry(0.4, 3, 8);
        var backBrace = addMesh(backBraceGeo, armMat, x, y, z);
        backBrace.castShadow = true;
        backBrace.receiveShadow = true;

        radarDishes.push({ mount: mount, dish: dish, brace: backBrace, index: index });
    }

    function buildControlBunker() {
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var bunkerGeo = new THREE.BoxGeometry(6, 3, 8);
        var bunker = addMesh(bunkerGeo, bunkerMat, -8, 8, 2);
        bunker.castShadow = true;
        bunker.receiveShadow = true;

        var doorMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
        var doorGeo = new THREE.BoxGeometry(2, 2.5, 0.3);
        var door = addMesh(doorGeo, doorMat, -8, 8.5, 10.2);
        door.castShadow = true;

        var roofGeo = new THREE.BoxGeometry(7, 0.5, 9);
        var roof = addMesh(roofGeo, bunkerMat, -8, 10.5, 2);
        roof.castShadow = true;
        roof.receiveShadow = true;

        var windowGeo = new THREE.BoxGeometry(1.5, 1, 0.2);
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var window1 = addMesh(windowGeo, windowMat, -6.5, 9, 10);
        var window2 = addMesh(windowGeo, windowMat, -9.5, 9, 10);

        var antennaPosts = [
            { x: -6, y: 11, z: 0 },
            { x: -10, y: 11, z: 0 }
        ];

        for (var i = 0; i < antennaPosts.length; i++) {
            var postGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
            var postMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
            var post = addMesh(postGeo, postMat, antennaPosts[i].x, antennaPosts[i].y, antennaPosts[i].z);
            post.castShadow = true;

            var tipGeo = new THREE.ConeGeometry(0.2, 0.6, 8);
            var tip = addMesh(tipGeo, postMat, antennaPosts[i].x, antennaPosts[i].y + 1.3, antennaPosts[i].z);
            tip.castShadow = true;
        }
    }

    function buildCableTrench() {
        var trenchMat = new THREE.MeshLambertMaterial({ color: 0x3A3A2A });
        var trenchGeo = new THREE.BoxGeometry(2, 1, 12);
        var trench = addMesh(trenchGeo, trenchMat, -3, 9, 0);
        trench.castShadow = true;

        var cableMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
        var cablePositions = [
            { x: -3.5, z: 0 },
            { x: -2.5, z: 0 },
            { x: -3, z: 0.5 }
        ];

        for (var i = 0; i < cablePositions.length; i++) {
            var cableGeo = new THREE.CylinderGeometry(0.15, 0.15, 12, 8);
            var cable = addMesh(cableGeo, cableMat, cablePositions[i].x, 9.5, cablePositions[i].z);
            cable.rotation.z = Math.PI / 2;
            cable.castShadow = true;
        }
    }

    function buildPerimeterDefense() {
        var postMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var wireColor = 0x888888;
        var fenceRadius = 20;
        var postHeight = 2;
        var postRadius = 0.3;

        var fencePoints = [
            { x: 18, z: 18 },
            { x: -18, z: 18 },
            { x: -18, z: -18 },
            { x: 18, z: -18 }
        ];

        for (var i = 0; i < fencePoints.length; i++) {
            var postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 8);
            var post = addMesh(postGeo, postMat, fencePoints[i].x, 11, fencePoints[i].z);
            post.castShadow = true;

            var nextIdx = (i + 1) % fencePoints.length;
            var wirePoints = [
                new THREE.Vector3(fencePoints[i].x, 11.5, fencePoints[i].z),
                new THREE.Vector3(fencePoints[nextIdx].x, 11.5, fencePoints[nextIdx].z)
            ];
            addLine(wirePoints, wireColor);

            var midWirePoints = [
                new THREE.Vector3(fencePoints[i].x, 11, fencePoints[i].z),
                new THREE.Vector3(fencePoints[nextIdx].x, 11, fencePoints[nextIdx].z)
            ];
            addLine(midWirePoints, wireColor);
        }

        var sandbagPositions = [
            { x: 16, z: 0, rot: 0 },
            { x: -16, z: 0, rot: 0 },
            { x: 0, z: 16, rot: Math.PI / 2 },
            { x: 0, z: -16, rot: Math.PI / 2 }
        ];

        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        for (var i = 0; i < sandbagPositions.length; i++) {
            var pos = sandbagPositions[i];
            for (var j = 0; j < 3; j++) {
                var bagGeo = new THREE.BoxGeometry(1, 0.6, 2);
                var bag = addMesh(bagGeo, sandbagMat, pos.x, 11 + j * 0.7, pos.z);
                bag.rotation.y = pos.rot;
                bag.castShadow = true;
                bag.receiveShadow = true;
            }
        }
    }

    function buildSignalTowers() {
        var towerPositions = [
            { x: 14, z: -8 },
            { x: -14, z: -12 },
            { x: 10, z: 12 }
        ];

        for (var i = 0; i < towerPositions.length; i++) {
            buildSignalTower(towerPositions[i].x, towerPositions[i].z);
        }
    }

    function buildSignalTower(x, z) {
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
        var basePlatformGeo = new THREE.BoxGeometry(2, 0.4, 2);
        var basePlatform = addMesh(basePlatformGeo, towerMat, x, 11.2, z);
        basePlatform.castShadow = true;

        var mainTowerGeo = new THREE.CylinderGeometry(0.5, 0.5, 25, 12);
        var mainTower = addMesh(mainTowerGeo, towerMat, x, 23, z);
        mainTower.castShadow = true;
        mainTower.receiveShadow = true;

        var crossbarMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        for (var h = 15; h <= 25; h += 4) {
            var crossGeo = new THREE.BoxGeometry(6, 0.2, 0.2);
            var cross1 = addMesh(crossGeo, crossbarMat, x, h, z);
            cross1.castShadow = true;

            var crossGeo2 = new THREE.BoxGeometry(0.2, 0.2, 6);
            var cross2 = addMesh(crossGeo2, crossbarMat, x, h, z);
            cross2.castShadow = true;
        }

        var equipBoxGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
        var equipMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var equipBox = addMesh(equipBoxGeo, equipMat, x, 12.5, z);
        equipBox.castShadow = true;
        equipBox.receiveShadow = true;
    }

    function buildAttackDamage() {
        var craterPositions = [
            { x: 10, z: -8, radius: 3 },
            { x: -8, z: 10, radius: 2.5 },
            { x: 4, z: 4, radius: 2 }
        ];

        var craterMat = new THREE.MeshLambertMaterial({ color: 0x2A2A1A });
        for (var i = 0; i < craterPositions.length; i++) {
            var pos = craterPositions[i];
            var craterGeo = new THREE.SphereGeometry(pos.radius, 8, 6);
            var crater = addMesh(craterGeo, craterMat, pos.x, 5 + pos.radius * 0.3, pos.z);
            crater.scale.y = 0.3;
            crater.castShadow = true;
        }

        radarDishes[0].dish.rotation.z = Math.PI / 6;
        radarDishes[0].dish.position.y -= 1.5;

        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var debris1Geo = new THREE.BoxGeometry(1.5, 0.5, 0.8);
        var debris1 = addMesh(debris1Geo, debrisMat, radarDishes[0].x + 3, 12, radarDishes[0].z - 2);
        debris1.rotation.z = Math.PI / 3;
        debris1.castShadow = true;

        var debris2Geo = new THREE.BoxGeometry(1, 0.3, 1);
        var debris2 = addMesh(debris2Geo, debrisMat, radarDishes[0].x + 4, 11.5, radarDishes[0].z - 1);
        debris2.castShadow = true;

        var fenceBreachGeo = new THREE.BoxGeometry(4, 0.5, 0.3);
        var fenceMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
        var breachPost = addMesh(fenceBreachGeo, fenceMat, 18, 10.5, 0);
        breachPost.rotation.z = Math.PI / 3;
        breachPost.castShadow = true;

        for (var i = 0; i < 5; i++) {
            var smokeGeo = new THREE.SphereGeometry(1.5 + i * 0.3, 6, 6);
            var smokeMat = new THREE.MeshLambertMaterial({ color: 0x555555, opacity: 0.4, transparent: true });
            var smoke = addMesh(smokeGeo, smokeMat, 10, 14 + i * 1.5, -10);
            smoke.scale.y = 0.6;
            smokeParticles.push({ mesh: smoke, index: i });
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x3A4A2A, 0.7);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0x888899, 0.8);
        directionalLight.position.set(20, 30, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        addLight(directionalLight);

        warningLight = new THREE.PointLight(0xFF3333, 1, 50);
        warningLight.position.set(0, 57, 0);
        addLight(warningLight);

        var redWarnGeo = new THREE.SphereGeometry(0.3, 8, 8);
        var redWarnMat = new THREE.MeshLambertMaterial({ color: 0xFF3333 });
        var redWarn = addMesh(redWarnGeo, redWarnMat, 0, 57, 0);
        redWarn.castShadow = true;
    }

    function update(delta) {
        if (!scene || !camera) return;

        for (var i = 0; i < radarDishes.length; i++) {
            var radar = radarDishes[i];
            var speeds = [0.4, 0.6, 0.3];
            radar.dish.rotation.y += speeds[i] * delta;
        }

        if (warningLight) {
            var intensity = 1.5 + Math.sin(Date.now() * 0.005) * 0.8;
            warningLight.intensity = intensity;
        }

        for (var i = 0; i < smokeParticles.length; i++) {
            var particle = smokeParticles[i];
            particle.mesh.position.y += 0.3 * delta;
            particle.mesh.position.x += Math.sin(Date.now() * 0.0001 + particle.index) * 0.05;
            particle.mesh.rotation.y += 0.1 * delta;
            if (particle.mesh.position.y > 35) {
                particle.mesh.position.y = 14;
            }
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
        radarDishes = [];
        smokeParticles = [];
        scene = null;
        camera = null;
        warningLight = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
