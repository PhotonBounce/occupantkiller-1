window.BlastCrater = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var smokeSpheres = [];
    var fireLights = [];
    var time = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        smokeSpheres = [];
        fireLights = [];
        time = 0;
        buildCraterfield();
        buildRubble();
        buildWrecks();
        buildSurvivors();
        buildSmoke();
        buildOrdnance();
        buildOverpass();
        buildMedics();
        setupLighting();
    }

    function buildCraterfield() {
        var craterPositions = [
            [ -50, 0, -60 ], [ 20, 0, -80 ], [ 70, 0, -40 ],
            [ -80, 0, 20 ], [ 0, 0, 0 ], [ 60, 0, 30 ],
            [ -30, 0, 60 ], [ 40, 0, 70 ], [ -90, 0, -20 ]
        ];
        for (var i = 0; i < craterPositions.length; i++) {
            var pos = craterPositions[i];
            createCrater(pos[0], pos[1], pos[2], Math.random() * 8 + 12);
        }
    }

    function createCrater(x, y, z, radius) {
        var craterGeom = new THREE.ConeGeometry(radius, radius * 0.6, 32, 8);
        var craterMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var craterMesh = new THREE.Mesh(craterGeom, craterMat);
        craterMesh.position.set(x, y - radius * 0.3, z);
        scene.add(craterMesh);
        objects.push(craterMesh);

        var rimCount = Math.floor(radius * 0.8);
        for (var i = 0; i < rimCount; i++) {
            var angle = (i / rimCount) * Math.PI * 2;
            var rimX = x + Math.cos(angle) * radius;
            var rimZ = z + Math.sin(angle) * radius;
            var rubbleGeom = new THREE.SphereGeometry(radius * 0.15, 8, 8);
            var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
            var rubbleMesh = new THREE.Mesh(rubbleGeom, rubbleMat);
            rubbleMesh.position.set(rimX, y + radius * 0.1, rimZ);
            rubbleMesh.rotation.x = Math.random() * Math.PI;
            rubbleMesh.rotation.z = Math.random() * Math.PI;
            scene.add(rubbleMesh);
            objects.push(rubbleMesh);
        }
    }

    function buildRubble() {
        var rubbleZones = [
            [ -60, 0, -50 ], [ 30, 0, -70 ], [ 80, 0, -30 ],
            [ -70, 0, 40 ], [ 50, 0, 50 ], [ -40, 0, 70 ]
        ];
        for (var i = 0; i < rubbleZones.length; i++) {
            var zone = rubbleZones[i];
            for (var j = 0; j < 8; j++) {
                var offsetX = (Math.random() - 0.5) * 30;
                var offsetZ = (Math.random() - 0.5) * 30;
                var fragGeom = new THREE.BoxGeometry(
                    Math.random() * 6 + 3,
                    Math.random() * 4 + 2,
                    Math.random() * 6 + 3
                );
                var fragMat = new THREE.MeshLambertMaterial({ color: 0x5a4a38 });
                var fragMesh = new THREE.Mesh(fragGeom, fragMat);
                fragMesh.position.set(zone[0] + offsetX, 1, zone[2] + offsetZ);
                fragMesh.rotation.x = Math.random() * Math.PI;
                fragMesh.rotation.y = Math.random() * Math.PI;
                fragMesh.rotation.z = Math.random() * Math.PI;
                scene.add(fragMesh);
                objects.push(fragMesh);
            }
        }
    }

    function buildWrecks() {
        var wreckPositions = [
            [ -45, -8, -55 ], [ 25, -10, -75 ], [ 65, -8, -35 ],
            [ -75, -8, 25 ], [ 35, -8, 45 ], [ -35, -8, 65 ]
        ];
        for (var i = 0; i < wreckPositions.length; i++) {
            var pos = wreckPositions[i];
            createVehicleWreck(pos[0], pos[1], pos[2]);
        }
    }

    function createVehicleWreck(x, y, z) {
        var hullGeom = new THREE.BoxGeometry(12, 5, 6);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x1a0f08 });
        var hullMesh = new THREE.Mesh(hullGeom, hullMat);
        hullMesh.position.set(x, y, z);
        hullMesh.rotation.z = (Math.random() - 0.5) * 0.5;
        scene.add(hullMesh);
        objects.push(hullMesh);

        var cabinGeom = new THREE.BoxGeometry(6, 4, 5);
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0x220d04 });
        var cabinMesh = new THREE.Mesh(cabinGeom, cabinMat);
        cabinMesh.position.set(x + 2, y + 3, z);
        scene.add(cabinMesh);
        objects.push(cabinMesh);

        for (var i = 0; i < 3; i++) {
            var flameGeom = new THREE.SphereGeometry(2 + i * 1.5, 8, 8);
            var flameMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
            var flameMesh = new THREE.Mesh(flameGeom, flameMat);
            flameMesh.position.set(x + i * 2, y + 6 + i * 1, z);
            scene.add(flameMesh);
            objects.push(flameMesh);
        }

        var tyreFl = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
        var tyreMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var tyreFm = new THREE.Mesh(tyreFl, tyreMat);
        tyreFm.position.set(x - 4, y - 2, z - 2);
        tyreFm.rotation.z = Math.PI / 2;
        scene.add(tyreFm);
        objects.push(tyreFm);

        var tyreFr = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
        var tyreFr = new THREE.Mesh(tyreFr, tyreMat);
        tyreFr.position.set(x - 4, y - 2, z + 2);
        tyreFr.rotation.z = Math.PI / 2;
        scene.add(tyreFr);
        objects.push(tyreFr);
    }

    function buildSurvivors() {
        var pitPositions = [
            [ -20, 0, -40 ], [ 45, 0, -20 ], [ -60, 0, -10 ],
            [ 10, 0, 30 ], [ -40, 0, 45 ], [ 55, 0, 15 ]
        ];
        for (var i = 0; i < pitPositions.length; i++) {
            var pos = pitPositions[i];
            createFoxhole(pos[0], pos[1], pos[2]);
        }
    }

    function createFoxhole(x, y, z) {
        var pitGeom = new THREE.BoxGeometry(3, 2, 5);
        var pitMat = new THREE.MeshLambertMaterial({ color: 0x2d1f0f });
        var pitMesh = new THREE.Mesh(pitGeom, pitMat);
        pitMesh.position.set(x, y - 1, z);
        scene.add(pitMesh);
        objects.push(pitMesh);

        for (var i = 0; i < 4; i++) {
            var bagGeom = new THREE.BoxGeometry(3.5, 0.5, 1);
            var bagMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
            var bagMesh = new THREE.Mesh(bagGeom, bagMat);
            bagMesh.position.set(x, y + i * 0.6, z - 2.5);
            scene.add(bagMesh);
            objects.push(bagMesh);
        }

        var sideGeom = new THREE.BoxGeometry(0.4, 2.5, 5);
        var sideMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var sideL = new THREE.Mesh(sideGeom, sideMat);
        sideL.position.set(x - 1.8, y, z);
        scene.add(sideL);
        objects.push(sideL);

        var sideR = new THREE.Mesh(sideGeom, sideMat);
        sideR.position.set(x + 1.8, y, z);
        scene.add(sideR);
        objects.push(sideR);
    }

    function buildSmoke() {
        var smokeZones = [
            [ -50, 0, -60 ], [ 20, 0, -80 ], [ 70, 0, -40 ],
            [ -80, 0, 20 ], [ 0, 0, 0 ], [ 60, 0, 30 ],
            [ -30, 0, 60 ], [ 40, 0, 70 ]
        ];
        for (var i = 0; i < smokeZones.length; i++) {
            var zone = smokeZones[i];
            createSmokeColumn(zone[0], zone[1], zone[2]);
        }
    }

    function createSmokeColumn(x, y, z) {
        for (var level = 0; level < 6; level++) {
            var smokeGeom = new THREE.SphereGeometry(4 - level * 0.5, 8, 8);
            var smokeMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var smokeMesh = new THREE.Mesh(smokeGeom, smokeMat);
            smokeMesh.position.set(x, y + level * 3 + 2, z);
            smokeMesh.userData.baseY = y + level * 3 + 2;
            smokeMesh.userData.oscillation = Math.random() * 0.3;
            scene.add(smokeMesh);
            objects.push(smokeMesh);
            smokeSpheres.push(smokeMesh);
        }
    }

    function buildOrdnance() {
        var bombPositions = [
            [ -25, 2, -30 ], [ 15, 2, -45 ], [ 50, 2, 10 ],
            [ -70, 2, -50 ], [ 30, 2, 50 ], [ -45, 2, 30 ],
            [ 70, 2, 55 ], [ -15, 2, 75 ], [ 55, 2, -60 ]
        ];
        for (var i = 0; i < bombPositions.length; i++) {
            var pos = bombPositions[i];
            createOrdnancemarker(pos[0], pos[1], pos[2]);
        }
    }

    function createOrdnancemarker(x, y, z) {
        var bombGeom = new THREE.CylinderGeometry(1.2, 0.8, 4, 16);
        var bombMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var bombMesh = new THREE.Mesh(bombGeom, bombMat);
        bombMesh.position.set(x, y + 2, z);
        scene.add(bombMesh);
        objects.push(bombMesh);

        var noseconeGeom = new THREE.ConeGeometry(1.2, 1.5, 16);
        var noseMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        var noseMesh = new THREE.Mesh(noseconeGeom, noseMat);
        noseMesh.position.set(x, y + 4.5, z);
        scene.add(noseMesh);
        objects.push(noseMesh);

        var stripeGeom = new THREE.CylinderGeometry(1.3, 1.3, 0.3, 16);
        var stripeMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        for (var i = 0; i < 3; i++) {
            var stripeMesh = new THREE.Mesh(stripeGeom, stripeMat);
            stripeMesh.position.set(x, y + 0.5 + i * 1, z);
            scene.add(stripeMesh);
            objects.push(stripeMesh);
        }
    }

    function buildOverpass() {
        var deckGeom = new THREE.BoxGeometry(40, 1.5, 8);
        var deckMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var deckMesh = new THREE.Mesh(deckGeom, deckMat);
        deckMesh.position.set(80, 8, -60);
        deckMesh.rotation.z = 0.3;
        scene.add(deckMesh);
        objects.push(deckMesh);

        var pier1Geom = new THREE.CylinderGeometry(2, 2, 10, 16);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var pier1Mesh = new THREE.Mesh(pier1Geom, pierMat);
        pier1Mesh.position.set(60, 0, -60);
        pier1Mesh.rotation.z = 0.4;
        scene.add(pier1Mesh);
        objects.push(pier1Mesh);

        var pier2Mesh = new THREE.Mesh(pier1Geom, pierMat);
        pier2Mesh.position.set(100, 0, -60);
        pier2Mesh.rotation.z = 0.35;
        scene.add(pier2Mesh);
        objects.push(pier2Mesh);

        var rubbleGeom = new THREE.BoxGeometry(6, 4, 5);
        for (var i = 0; i < 5; i++) {
            var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var rubbleMesh = new THREE.Mesh(rubbleGeom, rubbleMat);
            rubbleMesh.position.set(80 + (Math.random() - 0.5) * 20, 5 + i * 1.5, -60);
            rubbleMesh.rotation.x = Math.random() * Math.PI;
            rubbleMesh.rotation.y = Math.random() * Math.PI;
            scene.add(rubbleMesh);
            objects.push(rubbleMesh);
        }
    }

    function buildMedics() {
        var medStationX = -90;
        var medStationZ = 50;

        var crateGeom = new THREE.BoxGeometry(2, 2, 2);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        for (var i = 0; i < 4; i++) {
            var crateMesh = new THREE.Mesh(crateGeom, crateMat);
            crateMesh.position.set(medStationX + i * 2.5, 1, medStationZ);
            scene.add(crateMesh);
            objects.push(crateMesh);
        }

        var crossGeom = new THREE.SphereGeometry(1.5, 16, 16);
        var crossMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        for (var i = 0; i < 4; i++) {
            var crossMesh = new THREE.Mesh(crossGeom, crossMat);
            crossMesh.position.set(medStationX + i * 2.5, 3.5, medStationZ);
            scene.add(crossMesh);
            objects.push(crossMesh);
        }

        var tentGeom = new THREE.ConeGeometry(4, 3.5, 8);
        var tentMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var tentMesh = new THREE.Mesh(tentGeom, tentMat);
        tentMesh.position.set(medStationX + 5, 1.75, medStationZ + 8);
        scene.add(tentMesh);
        objects.push(tentMesh);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var dirLight = new THREE.DirectionalLight(0xffccaa, 0.8);
        dirLight.position.set(100, 150, 100);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -200;
        dirLight.shadow.camera.right = 200;
        dirLight.shadow.camera.top = 200;
        dirLight.shadow.camera.bottom = -200;
        scene.add(dirLight);
        lights.push(dirLight);

        var craterLights = [
            [ -50, 5, -60, 0xff4400 ], [ 20, 5, -80, 0xff4400 ], [ 70, 5, -40, 0xff4400 ],
            [ -80, 5, 20, 0xff4400 ], [ 0, 5, 0, 0xff4400 ], [ 60, 5, 30, 0xff4400 ],
            [ -30, 5, 60, 0xff4400 ], [ 40, 5, 70, 0xff4400 ]
        ];
        for (var i = 0; i < craterLights.length; i++) {
            var cl = craterLights[i];
            var fire = new THREE.PointLight(cl[3], 1.5, 50);
            fire.position.set(cl[0], cl[1], cl[2]);
            fire.userData.baseIntensity = 1.5;
            scene.add(fire);
            lights.push(fire);
            fireLights.push(fire);
        }
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < smokeSpheres.length; i++) {
            var sphere = smokeSpheres[i];
            var wobble = Math.sin(time * 2 + i * 0.5) * sphere.userData.oscillation;
            sphere.position.y = sphere.userData.baseY + wobble + time * 0.5;
            sphere.position.x += Math.sin(time * 1.5 + i) * 0.02;
            sphere.position.z += Math.cos(time * 1.3 + i) * 0.02;
        }

        for (var i = 0; i < fireLights.length; i++) {
            var light = fireLights[i];
            var flicker = 0.7 + Math.sin(time * 8 + i * 1.2) * 0.3;
            light.intensity = light.userData.baseIntensity * flicker;
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
        smokeSpheres = [];
        fireLights = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
