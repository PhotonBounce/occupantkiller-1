window.HexTown = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var barrels = [];

    function buildStreetGrid() {
        var gridSize = 12;
        var hexSize = 15;
        var streetColor = 0x2a2a2a;
        var pavingColor = 0x444444;

        for (var x = -gridSize; x <= gridSize; x++) {
            for (var z = -gridSize; z <= gridSize; z++) {
                var offsetX = x * hexSize;
                var offsetZ = z * hexSize * 0.866;
                if (x % 2 === 1) offsetZ += hexSize * 0.433;

                var geometry = new THREE.BoxGeometry(hexSize * 0.9, 0.3, hexSize * 0.9);
                var material = new THREE.MeshLambertMaterial({ color: pavingColor });
                var mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(offsetX, -0.15, offsetZ);
                scene.add(mesh);
                objects.push(mesh);
            }
        }

        for (var i = -gridSize * 2; i <= gridSize * 2; i++) {
            var geometry = new THREE.BoxGeometry(0.5, 0.3, gridSize * 50);
            var material = new THREE.MeshLambertMaterial({ color: streetColor });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(i * hexSize * 0.5, -0.15, 0);
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildBuildings() {
        var buildingPositions = [
            { x: 0, z: 0, h: 6 },
            { x: 30, z: 30, h: 4 },
            { x: -30, z: 30, h: 5 },
            { x: 30, z: -30, h: 3 },
            { x: -30, z: -30, h: 6 },
            { x: 60, z: 0, h: 3 },
            { x: -60, z: 0, h: 4 },
            { x: 0, z: 60, h: 5 },
            { x: 0, z: -60, h: 4 },
            { x: 45, z: 45, h: 3 },
            { x: -45, z: 45, h: 6 },
            { x: 45, z: -45, h: 3 },
            { x: -45, z: -45, h: 5 },
            { x: 90, z: 30, h: 4 },
            { x: -90, z: 30, h: 3 },
            { x: 90, z: -30, h: 5 }
        ];

        for (var i = 0; i < buildingPositions.length; i++) {
            var pos = buildingPositions[i];
            var height = pos.h * 4;
            var width = 12;
            var depth = 12;

            var geometry = new THREE.BoxGeometry(width, height, depth);
            var material = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(pos.x, height * 0.5, pos.z);
            scene.add(mesh);
            objects.push(mesh);

            buildShopFronts(pos.x, pos.z, width, depth);
            buildFireEscapes(pos.x, pos.z, width, height);

            if (i % 3 === 0) {
                buildSniperNest(pos.x, pos.z, height);
            }

            buildDebris(pos.x, pos.z);
        }
    }

    function buildShopFronts(x, z, width, depth) {
        var awningGeometry = new THREE.BoxGeometry(width * 0.8, 1.5, 1.2);
        var awningMaterial = new THREE.MeshLambertMaterial({ color: 0x8a3a1a });
        var awning = new THREE.Mesh(awningGeometry, awningMaterial);
        awning.position.set(x, 2, z + depth * 0.5);
        scene.add(awning);
        objects.push(awning);

        for (var i = 0; i < 3; i++) {
            var windowGeometry = new THREE.BoxGeometry(2, 2, 0.2);
            var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
            var window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(x - 4 + i * 4, 3, z + depth * 0.5 + 0.5);
            scene.add(window);
            objects.push(window);
        }
    }

    function buildFireEscapes(x, z, width, height) {
        var stepCount = Math.floor(height / 5);
        for (var i = 0; i < stepCount; i++) {
            var stepGeometry = new THREE.BoxGeometry(3, 0.5, 1.5);
            var stepMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(x + width * 0.5 - 2, 2 + i * 5, z - depth * 0.5 + 2);
            scene.add(step);
            objects.push(step);
        }
    }

    function buildSniperNest(x, z, height) {
        var platformGeometry = new THREE.BoxGeometry(8, 0.5, 8);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(x, height + 1, z);
        scene.add(platform);
        objects.push(platform);

        for (var i = 0; i < 4; i++) {
            var angle = (i / 4) * Math.PI * 2;
            var sandGeometry = new THREE.BoxGeometry(1.5, 1, 2);
            var sandMaterial = new THREE.MeshLambertMaterial({ color: 0xc9a961 });
            var sandbag = new THREE.Mesh(sandGeometry, sandMaterial);
            sandbag.position.set(
                x + Math.cos(angle) * 4,
                height + 1.5,
                z + Math.sin(angle) * 4
            );
            scene.add(sandbag);
            objects.push(sandbag);
        }
    }

    function buildDebris(x, z) {
        var debrisCount = 5;
        for (var i = 0; i < debrisCount; i++) {
            var geometry = new THREE.SphereGeometry(Math.random() * 1.5 + 0.5, 6, 6);
            var material = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                x + Math.random() * 8 - 4,
                0.5,
                z + Math.random() * 8 - 4
            );
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildBarricades() {
        var barricadePositions = [
            { x: 15, z: 0 },
            { x: -15, z: 0 },
            { x: 0, z: 15 },
            { x: 0, z: -15 },
            { x: 45, z: 15 },
            { x: -45, z: 15 },
            { x: 45, z: -15 },
            { x: -45, z: -15 }
        ];

        for (var i = 0; i < barricadePositions.length; i++) {
            var pos = barricadePositions[i];

            var concreteGeometry = new THREE.BoxGeometry(8, 2, 1.5);
            var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
            var concrete = new THREE.Mesh(concreteGeometry, concreteMaterial);
            concrete.position.set(pos.x, 1, pos.z);
            scene.add(concrete);
            objects.push(concrete);

            var vehicleGeometry = new THREE.BoxGeometry(5, 2, 2);
            var vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
            vehicle.position.set(pos.x + 3, 1.5, pos.z + 2);
            vehicle.rotation.z = Math.random() * 0.5;
            scene.add(vehicle);
            objects.push(vehicle);
        }
    }

    function buildSniperNests() {
        var nestCount = 3;
        for (var i = 0; i < nestCount; i++) {
            var angle = (i / nestCount) * Math.PI * 2;
            var x = Math.cos(angle) * 80;
            var z = Math.sin(angle) * 80;

            var platformGeometry = new THREE.BoxGeometry(6, 0.5, 6);
            var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(x, 25, z);
            scene.add(platform);
            objects.push(platform);

            var railGeometry = new THREE.BoxGeometry(6, 0.5, 0.3);
            var railMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var rail = new THREE.Mesh(railGeometry, railMaterial);
            rail.position.set(x, 26, z + 3);
            scene.add(rail);
            objects.push(rail);
        }
    }

    function buildSubway() {
        var entranceX = -70;
        var entranceZ = -70;

        var stairGeometry = new THREE.BoxGeometry(6, 2, 1);
        var stairMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        for (var i = 0; i < 5; i++) {
            var stair = new THREE.Mesh(stairGeometry, stairMaterial);
            stair.position.set(entranceX, 1 - i * 0.8, entranceZ + i * 1.5);
            scene.add(stair);
            objects.push(stair);
        }

        for (var i = 0; i < 4; i++) {
            var columnGeometry = new THREE.CylinderGeometry(1.2, 1.2, 8, 8);
            var columnMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(entranceX - 3 + i * 2, 4, entranceZ - 4);
            scene.add(column);
            objects.push(column);
        }

        var entranceFrameGeometry = new THREE.BoxGeometry(8, 5, 0.3);
        var entranceFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var entranceFrame = new THREE.Mesh(entranceFrameGeometry, entranceFrameMaterial);
        entranceFrame.position.set(entranceX, 3, entranceZ + 6);
        scene.add(entranceFrame);
        objects.push(entranceFrame);
    }

    function buildCheckpoints() {
        var checkpointPositions = [
            { x: 50, z: 50 },
            { x: -50, z: 50 },
            { x: 50, z: -50 },
            { x: -50, z: -50 }
        ];

        for (var i = 0; i < checkpointPositions.length; i++) {
            var pos = checkpointPositions[i];

            var gateGeometry = new THREE.BoxGeometry(8, 3, 0.5);
            var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var gate = new THREE.Mesh(gateGeometry, gateMaterial);
            gate.position.set(pos.x, 1.5, pos.z);
            scene.add(gate);
            objects.push(gate);

            for (var j = 0; j < 2; j++) {
                var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 6);
                var postMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
                var post = new THREE.Mesh(postGeometry, postMaterial);
                post.position.set(pos.x - 4 + j * 8, 2, pos.z);
                scene.add(post);
                objects.push(post);
            }

            var barrierGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
            var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
            var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrier.position.set(pos.x, 1.5, pos.z + 3);
            barrier.rotation.z = Math.PI * 0.3;
            scene.add(barrier);
            objects.push(barrier);
        }
    }

    function buildVehicles() {
        var vehiclePositions = [
            { x: 75, z: 0, rot: 0.3 },
            { x: -75, z: 0, rot: -0.2 },
            { x: 0, z: 75, rot: 0.5 },
            { x: 0, z: -75, rot: -0.4 }
        ];

        for (var i = 0; i < vehiclePositions.length; i++) {
            var pos = vehiclePositions[i];

            var bodyGeometry = new THREE.BoxGeometry(5, 2.5, 2.5);
            var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xcc5533 });
            var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.set(pos.x, 1.5, pos.z);
            body.rotation.z = pos.rot;
            scene.add(body);
            objects.push(body);

            for (var j = 0; j < 4; j++) {
                var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 8);
                var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
                var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                var wheelX = j % 2 === 0 ? -2 : 2;
                var wheelZ = j < 2 ? -1.5 : 1.5;
                wheel.position.set(pos.x + wheelX, 0.8, pos.z + wheelZ);
                wheel.rotation.x = Math.PI * 0.5;
                scene.add(wheel);
                objects.push(wheel);
            }

            var windowGeometry = new THREE.BoxGeometry(2, 1.5, 0.3);
            var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
            var window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(pos.x, 2.5, pos.z);
            scene.add(window);
            objects.push(window);
        }
    }

    function buildBurningBarrels() {
        var barrelPositions = [
            { x: 20, z: 20 },
            { x: -20, z: 20 },
            { x: 20, z: -20 },
            { x: -20, z: -20 },
            { x: 0, z: 0 },
            { x: 40, z: 0 },
            { x: -40, z: 0 },
            { x: 0, z: 40 },
            { x: 0, z: -40 }
        ];

        for (var i = 0; i < barrelPositions.length; i++) {
            var pos = barrelPositions[i];

            var barrelGeometry = new THREE.CylinderGeometry(1, 1.2, 2, 8);
            var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.position.set(pos.x, 1, pos.z);
            scene.add(barrel);
            objects.push(barrel);

            for (var j = 0; j < 3; j++) {
                var fireGeometry = new THREE.SphereGeometry(0.8, 6, 6);
                var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xff5500 });
                var fire = new THREE.Mesh(fireGeometry, fireMaterial);
                fire.position.set(pos.x, 2.5 + j * 0.8, pos.z);
                scene.add(fire);
                objects.push(fire);
                barrels.push({ mesh: fire, index: i * 3 + j });
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 150, 100);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var x = Math.cos(angle) * 100;
            var z = Math.sin(angle) * 100;

            var lightGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 6);
            var lightMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var lightPole = new THREE.Mesh(lightGeometry, lightMaterial);
            lightPole.position.set(x, 10, z);
            scene.add(lightPole);
            objects.push(lightPole);

            var globeGeometry = new THREE.SphereGeometry(0.8, 8, 8);
            var globeMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
            var globe = new THREE.Mesh(globeGeometry, globeMaterial);
            globe.position.set(x, 20.5, z);
            scene.add(globe);
            objects.push(globe);

            var pointLight = new THREE.PointLight(0xffcc99, 0.6, 50);
            pointLight.position.set(x, 20.5, z);
            scene.add(pointLight);
            lights.push(pointLight);
        }
    }

    function update(delta) {
        for (var i = 0; i < barrels.length; i++) {
            var barrel = barrels[i];
            var baseScale = 0.8 + Math.sin(Date.now() * 0.005 + i) * 0.3;
            barrel.mesh.scale.set(baseScale, baseScale, baseScale);
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
        barrels = [];
        scene = null;
        camera = null;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        barrels = [];
        buildStreetGrid();
        buildBuildings();
        buildBarricades();
        buildSniperNests();
        buildSubway();
        buildCheckpoints();
        buildVehicles();
        buildBurningBarrels();
        setupLighting();
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
