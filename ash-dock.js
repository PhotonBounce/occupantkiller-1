window.AshDock = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var ashParticles = [];
    var emberGlows = [];
    var time = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        ashParticles = [];
        emberGlows = [];
        time = 0;
        buildDockPiers();
        buildAshFields();
        buildFactoryRuins();
        buildWaterfront();
        buildStorageYard();
        buildDefenses();
        buildAshfall();
        buildVehicles();
        buildCraneRuins();
        buildShelter();
        setupLighting();
    }

    function buildDockPiers() {
        var pillarHeight = 8;
        var pillarWidth = 1.5;
        var pillarDepth = 1.2;
        for (var i = 0; i < 6; i++) {
            for (var j = 0; j < 4; j++) {
                var geometry = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarDepth);
                var material = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
                var mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(i * 12 - 30, pillarHeight / 2 - 2, j * 10 - 15);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                objects.push(mesh);
            }
        }
        for (var i = 0; i < 5; i++) {
            var deckGeometry = new THREE.BoxGeometry(12, 0.8, 40);
            var deckMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
            var deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
            deckMesh.position.set(i * 12 - 24, 2, 0);
            deckMesh.castShadow = true;
            deckMesh.receiveShadow = true;
            scene.add(deckMesh);
            objects.push(deckMesh);
        }
        var edgeGeometry = new THREE.BoxGeometry(60, 0.4, 0.8);
        var edgeMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edgeMesh.position.set(0, 2.8, 20);
        edgeMesh.castShadow = true;
        scene.add(edgeMesh);
        objects.push(edgeMesh);
    }

    function buildAshFields() {
        for (var i = 0; i < 25; i++) {
            var ashHeap = new THREE.BoxGeometry(
                4 + Math.random() * 3,
                2 + Math.random() * 4,
                5 + Math.random() * 3
            );
            var ashMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
            var ashMesh = new THREE.Mesh(ashHeap, ashMat);
            ashMesh.position.set(
                Math.random() * 80 - 40,
                (ashHeap.parameters.height) / 2 - 4,
                Math.random() * 100 - 30
            );
            ashMesh.rotation.z = Math.random() * 0.3 - 0.15;
            ashMesh.rotation.x = Math.random() * 0.2 - 0.1;
            ashMesh.castShadow = true;
            ashMesh.receiveShadow = true;
            scene.add(ashMesh);
            objects.push(ashMesh);
        }
    }

    function buildFactoryRuins() {
        for (var i = 0; i < 4; i++) {
            var wallGeometry = new THREE.BoxGeometry(3, 12, 20);
            var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
            var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            wallMesh.position.set(
                i * 25 - 35,
                6,
                50 + Math.random() * 10
            );
            wallMesh.rotation.z = (Math.random() - 0.5) * 0.4;
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            scene.add(wallMesh);
            objects.push(wallMesh);
        }
        for (var i = 0; i < 6; i++) {
            var stackGeometry = new THREE.CylinderGeometry(2, 2.3, 18, 8);
            var stackMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
            var stackMesh = new THREE.Mesh(stackGeometry, stackMaterial);
            stackMesh.position.set(
                Math.random() * 50 - 25,
                9,
                45 + Math.random() * 20
            );
            if (Math.random() > 0.4) {
                stackMesh.rotation.z = (Math.random() - 0.5) * 0.8;
            }
            stackMesh.castShadow = true;
            stackMesh.receiveShadow = true;
            scene.add(stackMesh);
            objects.push(stackMesh);
        }
    }

    function buildWaterfront() {
        var waterGeometry = new THREE.BoxGeometry(200, 8, 80);
        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A2E });
        var waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        waterMesh.position.set(0, -4, -50);
        waterMesh.receiveShadow = true;
        scene.add(waterMesh);
        objects.push(waterMesh);
        for (var i = 0; i < 30; i++) {
            var floatingAshGeometry = new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 6, 6);
            var ashFloatMaterial = new THREE.MeshLambertMaterial({ color: 0xB0B0B0 });
            var floatingMesh = new THREE.Mesh(floatingAshGeometry, ashFloatMaterial);
            floatingMesh.position.set(
                Math.random() * 180 - 90,
                -1 + Math.random() * 2,
                -50 + Math.random() * 60
            );
            floatingMesh.castShadow = true;
            floatingMesh.receiveShadow = true;
            scene.add(floatingMesh);
            objects.push(floatingMesh);
        }
    }

    function buildStorageYard() {
        for (var i = 0; i < 15; i++) {
            var containerGeometry = new THREE.BoxGeometry(3.5, 4, 6.5);
            var containerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            var containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
            containerMesh.position.set(
                Math.random() * 50 - 25,
                2 - Math.random() * 1.5,
                Math.random() * 40 - 20
            );
            containerMesh.rotation.z = (Math.random() - 0.5) * 0.5;
            containerMesh.rotation.x = (Math.random() - 0.5) * 0.3;
            containerMesh.castShadow = true;
            containerMesh.receiveShadow = true;
            scene.add(containerMesh);
            objects.push(containerMesh);
        }
    }

    function buildDefenses() {
        for (var i = 0; i < 8; i++) {
            var sandbagGeometry = new THREE.BoxGeometry(2, 1.2, 4);
            var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x9B8B7E });
            var sandbagMesh = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
            sandbagMesh.position.set(
                i * 8 - 28,
                -1 + Math.random() * 0.5,
                60
            );
            sandbagMesh.castShadow = true;
            sandbagMesh.receiveShadow = true;
            scene.add(sandbagMesh);
            objects.push(sandbagMesh);
        }
        for (var i = 0; i < 4; i++) {
            var barrierGeometry = new THREE.BoxGeometry(1, 2, 3);
            var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
            var barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrierMesh.position.set(
                Math.random() * 30 - 15,
                1,
                55 + Math.random() * 3
            );
            barrierMesh.castShadow = true;
            scene.add(barrierMesh);
            objects.push(barrierMesh);
        }
    }

    function buildAshfall() {
        for (var i = 0; i < 120; i++) {
            var ashflakeGeometry = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 4, 4);
            var ashflakeMaterial = new THREE.MeshLambertMaterial({ color: 0xD3D3D3 });
            var ashflakeMesh = new THREE.Mesh(ashflakeGeometry, ashflakeMaterial);
            ashflakeMesh.position.set(
                Math.random() * 150 - 75,
                Math.random() * 60 - 10,
                Math.random() * 150 - 75
            );
            ashflakeMesh.userData.vx = (Math.random() - 0.5) * 0.8;
            ashflakeMesh.userData.vy = -0.5 - Math.random() * 0.8;
            ashflakeMesh.userData.vz = (Math.random() - 0.5) * 0.5;
            ashflakeMesh.castShadow = true;
            scene.add(ashflakeMesh);
            ashParticles.push(ashflakeMesh);
            objects.push(ashflakeMesh);
        }
    }

    function buildVehicles() {
        for (var i = 0; i < 5; i++) {
            var carBodyGeometry = new THREE.BoxGeometry(1.8, 1.6, 4.5);
            var carBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
            var carBodyMesh = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
            carBodyMesh.position.set(
                Math.random() * 60 - 30,
                -1 - Math.random() * 2,
                Math.random() * 60
            );
            carBodyMesh.rotation.z = (Math.random() - 0.5) * 0.4;
            carBodyMesh.castShadow = true;
            carBodyMesh.receiveShadow = true;
            scene.add(carBodyMesh);
            objects.push(carBodyMesh);
            for (var j = 0; j < 2; j++) {
                var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8);
                var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
                var wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheelMesh.rotation.z = Math.PI / 2;
                wheelMesh.position.set(
                    carBodyMesh.position.x + (j - 0.5) * 1.4,
                    carBodyMesh.position.y - 0.5,
                    carBodyMesh.position.z + (Math.random() - 0.5) * 3
                );
                scene.add(wheelMesh);
                objects.push(wheelMesh);
            }
        }
    }

    function buildCraneRuins() {
        var mastGeometry = new THREE.CylinderGeometry(0.6, 0.8, 25, 8);
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
        mastMesh.position.set(-40, 12.5, 30);
        mastMesh.rotation.z = 0.5;
        mastMesh.castShadow = true;
        mastMesh.receiveShadow = true;
        scene.add(mastMesh);
        objects.push(mastMesh);
        var armGeometry = new THREE.CylinderGeometry(0.35, 0.4, 15, 8);
        var armMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var armMesh = new THREE.Mesh(armGeometry, armMaterial);
        armMesh.rotation.z = Math.PI / 2;
        armMesh.position.set(-40 + 6, 22, 30);
        armMesh.castShadow = true;
        scene.add(armMesh);
        objects.push(armMesh);
        var hookGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
        var hookMaterial = new THREE.MeshLambertMaterial({ color: 0x303030 });
        var hookMesh = new THREE.Mesh(hookGeometry, hookMaterial);
        hookMesh.position.set(-40 + 12, 15, 30);
        hookMesh.castShadow = true;
        hookMesh.receiveShadow = true;
        scene.add(hookMesh);
        objects.push(hookMesh);
    }

    function buildShelter() {
        var shelterGeometry = new THREE.BoxGeometry(8, 5, 10);
        var shelterMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
        var shelterMesh = new THREE.Mesh(shelterGeometry, shelterMaterial);
        shelterMesh.position.set(35, 2.5, 45);
        shelterMesh.castShadow = true;
        shelterMesh.receiveShadow = true;
        scene.add(shelterMesh);
        objects.push(shelterMesh);
        var roofGeometry = new THREE.BoxGeometry(9, 1, 11);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        roofMesh.position.set(35, 5.5, 45);
        roofMesh.castShadow = true;
        scene.add(roofMesh);
        objects.push(roofMesh);
        for (var i = 0; i < 4; i++) {
            var barricadeGeometry = new THREE.BoxGeometry(1.5, 2, 4);
            var barricadeMaterial = new THREE.MeshLambertMaterial({ color: 0x5C5C5C });
            var barricadeMesh = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
            barricadeMesh.position.set(
                35 + (i - 1.5) * 1.8,
                1,
                50
            );
            barricadeMesh.castShadow = true;
            scene.add(barricadeMesh);
            objects.push(barricadeMesh);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x666666);
        scene.add(ambientLight);
        lights.push(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
        directionalLight.position.set(50, 40, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        lights.push(directionalLight);
        for (var i = 0; i < 8; i++) {
            var emberLight = new THREE.PointLight(0xFF6633, 0.5, 20);
            emberLight.position.set(
                Math.random() * 80 - 40,
                2 + Math.random() * 3,
                Math.random() * 80 - 20
            );
            scene.add(emberLight);
            lights.push(emberLight);
            emberGlows.push({
                light: emberLight,
                baseIntensity: 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function updateAshfall(delta) {
        for (var i = 0; i < ashParticles.length; i++) {
            var particle = ashParticles[i];
            particle.position.x += particle.userData.vx * delta;
            particle.position.y += particle.userData.vy * delta;
            particle.position.z += particle.userData.vz * delta;
            if (particle.position.y < -20) {
                particle.position.y = 50;
                particle.position.x = Math.random() * 150 - 75;
                particle.position.z = Math.random() * 150 - 75;
            }
        }
    }

    function updateEmbers(delta) {
        time += delta;
        for (var i = 0; i < emberGlows.length; i++) {
            var ember = emberGlows[i];
            var pulse = Math.sin(time * 3 + ember.phase) * 0.3 + 0.7;
            ember.light.intensity = ember.baseIntensity * pulse;
        }
    }

    function update(delta) {
        updateAshfall(delta);
        updateEmbers(delta);
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
        ashParticles = [];
        emberGlows = [];
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
