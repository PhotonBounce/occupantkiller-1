window.StormGate = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var raindrops = [];
    var lightningLights = [];
    var debrisBoxes = [];
    var time = 0;

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

    function buildMountainBase() {
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
        var tileGeo = new THREE.BoxGeometry(1, 0.2, 1);
        var gridSize = 40;
        var tileSpacing = 1.1;

        for (var x = 0; x < gridSize; x++) {
            for (var z = 0; z < gridSize; z++) {
                var posX = (x - gridSize / 2) * tileSpacing;
                var posZ = (z - gridSize / 2) * tileSpacing;
                addMesh(tileGeo, baseMat, posX, -0.1, posZ);
            }
        }

        var boulderGeo = new THREE.SphereGeometry(0.8, 6, 6);
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        for (var i = 0; i < 25; i++) {
            var rx = (Math.random() - 0.5) * 35;
            var rz = (Math.random() - 0.5) * 35;
            var ry = Math.random() * 0.5;
            addMesh(boulderGeo, boulderMat, rx, ry, rz);
        }
    }

    function buildGateTowers() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var towerGeo = new THREE.BoxGeometry(8, 24, 8);

        var leftTower = addMesh(towerGeo, stoneMat, -10, 12, 0);
        var rightTower = addMesh(towerGeo, stoneMat, 10, 12, 0);

        var archCap1Geo = new THREE.CylinderGeometry(6, 6, 2, 8);
        var archCap1 = addMesh(archCap1Geo, stoneMat, -10, 24, 0);
        var archCap2 = addMesh(archCap1Geo, stoneMat, 10, 24, 0);

        var archSupport = new THREE.BoxGeometry(12, 2, 8);
        addMesh(archSupport, stoneMat, 0, 24.5, 0);
    }

    function buildPortcullis() {
        var ironMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barGeo = new THREE.BoxGeometry(0.3, 12, 0.3);

        var barCount = 8;
        var spacing = 1.3;
        for (var i = 0; i < barCount; i++) {
            var barX = (i - barCount / 2) * spacing;
            addMesh(barGeo, ironMat, barX, 12, 0);
        }

        var crossBarGeo = new THREE.BoxGeometry(12, 0.3, 0.3);
        for (var j = 0; j < 6; j++) {
            var barY = 6 + j * 2;
            addMesh(crossBarGeo, ironMat, 0, barY, 0);
        }
    }

    function buildWallBattlements() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var wallGeo = new THREE.BoxGeometry(24, 6, 2);
        var mainWall = addMesh(wallGeo, stoneMat, 0, 12, 4);

        var crenelGeo = new THREE.BoxGeometry(2, 3, 2);
        var crenelMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
        for (var c = 0; c < 6; c++) {
            var cx = -10 + c * 4;
            addMesh(crenelGeo, crenelMat, cx, 16, 4);
        }

        var innerWallGeo = new THREE.BoxGeometry(24, 4, 1);
        addMesh(innerWallGeo, stoneMat, 0, 12, -3);
    }

    function buildStormDamage() {
        var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var rubbleGeo = new THREE.BoxGeometry(1.5, 1, 1.5);

        for (var r = 0; r < 15; r++) {
            var rx = -8 + Math.random() * 16;
            var ry = 8 + Math.random() * 8;
            var rz = -2 + Math.random() * 4;
            addMesh(rubbleGeo, rubbleMat, rx, ry, rz);
        }

        var scorchMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var scorchGeo = new THREE.SphereGeometry(1.2, 5, 5);
        for (var s = 0; s < 8; s++) {
            var sx = -12 + Math.random() * 20;
            var sy = 10 + Math.random() * 10;
            var sz = Math.random() * 6 - 3;
            addMesh(scorchGeo, scorchMat, sx, sy, sz);
        }

        var crackedCornerGeo = new THREE.BoxGeometry(3, 6, 3);
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        addMesh(crackedCornerGeo, darkMat, -8.5, 16, 1);
    }

    function buildDefensePositions() {
        var slitGeo = new THREE.BoxGeometry(0.8, 1.5, 0.3);
        var slitMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

        for (var s = 0; s < 6; s++) {
            var sx = -12 + s * 5;
            var sy = 14 + Math.floor(s / 3) * 4;
            addMesh(slitGeo, slitMat, sx, sy, 3.5);
        }

        var catapultBaseMat = new THREE.MeshLambertMaterial({ color: 0x554444 });
        var catapultGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 8);
        for (var c = 0; c < 3; c++) {
            var cx = -8 + c * 8;
            addMesh(catapultGeo, catapultBaseMat, cx, 19, 3);
        }

        var armMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
        var armGeo = new THREE.BoxGeometry(4, 0.4, 0.4);
        for (var a = 0; a < 3; a++) {
            var ax = -8 + a * 8;
            addMesh(armGeo, armMat, ax, 20, 3);
        }
    }

    function buildLightningRods() {
        var rodMat = new THREE.MeshLambertMaterial({ color: 0x222244 });
        var rodGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);

        var rod1 = addMesh(rodGeo, rodMat, -10, 28, -3);
        var rod2 = addMesh(rodGeo, rodMat, -10, 28, 3);
        var rod3 = addMesh(rodGeo, rodMat, 10, 28, -3);
        var rod4 = addMesh(rodGeo, rodMat, 10, 28, 3);
        var rod5 = addMesh(rodGeo, rodMat, 0, 28, 0);

        var capMat = new THREE.MeshLambertMaterial({ color: 0x333355 });
        var capGeo = new THREE.ConeGeometry(0.6, 1.5, 6);
        addMesh(capGeo, capMat, -10, 32, -3);
        addMesh(capGeo, capMat, -10, 32, 3);
        addMesh(capGeo, capMat, 10, 32, -3);
        addMesh(capGeo, capMat, 10, 32, 3);
        addMesh(capGeo, capMat, 0, 32, 0);

        createLightningBolts();
    }

    function createLightningBolts() {
        var rodPositions = [
            [-10, 28, -3], [-10, 28, 3], [10, 28, -3], [10, 28, 3], [0, 28, 0]
        ];

        for (var b = 0; b < rodPositions.length; b++) {
            var pos = rodPositions[b];
            var points = [];
            points.push(new THREE.Vector3(pos[0], pos[1], pos[2]));

            var steps = 6;
            for (var p = 0; p < steps; p++) {
                var y = pos[1] - (p + 1) * 6;
                var x = pos[0] + (Math.random() - 0.5) * 3;
                var z = pos[2] + (Math.random() - 0.5) * 3;
                points.push(new THREE.Vector3(x, y, z));
            }

            var geo = new THREE.BufferGeometry();
            geo.setFromPoints(points);
            var mat = new THREE.LineBasicMaterial({ color: 0xccccff, linewidth: 2 });
            var line = new THREE.LineSegments(geo, mat);
            scene.add(line);
            objects.push(line);
        }
    }

    function buildStormEffects() {
        var rainMat = new THREE.MeshLambertMaterial({ color: 0x4488cc });
        var rainGeo = new THREE.SphereGeometry(0.15, 4, 4);

        for (var r = 0; r < 60; r++) {
            var rx = (Math.random() - 0.5) * 30;
            var ry = 35 + Math.random() * 15;
            var rz = (Math.random() - 0.5) * 20;
            var rainDrop = addMesh(rainGeo, rainMat, rx, ry, rz);
            raindrops.push({
                mesh: rainDrop,
                startY: ry,
                x: rx,
                z: rz
            });
        }

        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var debrisGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
        for (var d = 0; d < 30; d++) {
            var dx = (Math.random() - 0.5) * 40;
            var dy = 25 + Math.random() * 20;
            var dz = (Math.random() - 0.5) * 25;
            var debris = addMesh(debrisGeo, debrisMat, dx, dy, dz);
            debris.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
            debrisBoxes.push({
                mesh: debris,
                velY: -0.5 - Math.random() * 1.5,
                velX: (Math.random() - 0.5) * 2,
                velZ: (Math.random() - 0.5) * 2
            });
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x223344, 0.6);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0x666666, 0.4);
        directionalLight.position.set(10, 20, 10);
        addLight(directionalLight);

        var stormLight1 = new THREE.PointLight(0xffffff, 0, 60);
        stormLight1.position.set(-15, 25, -5);
        addLight(stormLight1);
        lightningLights.push(stormLight1);

        var stormLight2 = new THREE.PointLight(0xffffff, 0, 60);
        stormLight2.position.set(15, 25, 5);
        addLight(stormLight2);
        lightningLights.push(stormLight2);
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < raindrops.length; i++) {
            var raindrop = raindrops[i];
            raindrop.mesh.position.y -= 6 * delta;

            if (raindrop.mesh.position.y < 0) {
                raindrop.mesh.position.y = raindrop.startY;
            }
        }

        for (var d = 0; d < debrisBoxes.length; d++) {
            var debris = debrisBoxes[d];
            debris.mesh.position.y += debris.velY * delta;
            debris.mesh.position.x += debris.velX * delta;
            debris.mesh.position.z += debris.velZ * delta;
            debris.mesh.rotation.x += 2 * delta;
            debris.mesh.rotation.y += 3 * delta;

            if (debris.mesh.position.y < 0) {
                debris.mesh.position.y = 25 + Math.random() * 20;
                debris.mesh.position.x = (Math.random() - 0.5) * 40;
                debris.mesh.position.z = (Math.random() - 0.5) * 25;
            }
        }

        for (var l = 0; l < lightningLights.length; l++) {
            var light = lightningLights[l];
            var flashChance = 0.01;
            if (Math.random() < flashChance) {
                light.intensity = 1.5 + Math.random() * 1;
            } else {
                light.intensity = Math.max(0, light.intensity - 3 * delta);
            }
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        raindrops = [];
        lightningLights = [];
        debrisBoxes = [];
        time = 0;

        buildMountainBase();
        buildGateTowers();
        buildPortcullis();
        buildWallBattlements();
        buildStormDamage();
        buildDefensePositions();
        buildLightningRods();
        buildStormEffects();
        setupLighting();
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var j = 0; j < lights.length; j++) {
            scene.remove(lights[j]);
        }
        objects = [];
        lights = [];
        raindrops = [];
        lightningLights = [];
        debrisBoxes = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
