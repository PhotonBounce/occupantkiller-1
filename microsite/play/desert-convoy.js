window.DesertConvoy = (function() {
    'use strict';

    var scene, camera;
    var elements = {};
    var hudElements = {};
    var elapsedTime = 0;
    var keyStates = {};
    var lastHTime = 0;

    function init(_scene, _camera) {
        scene = _scene;
        camera = _camera;

        createDesertGround();
        createDuneHills();
        createOasis();
        createCamels();
        createSmugglersRiding();
        createGroundSmugglers();
        createBorderPatrol();
        createPatrolVehicles();
        createDrone();
        createBioweaponContainer();
        createCheckpointGate();
        createAncientRuinsWall();
        createHeatShimmer();
        createRadioEquipment();
        createSupplyCache();
        createHUD();
        setupKeyListeners();
    }

    function createDesertGround() {
        var geometry = new THREE.BoxGeometry(400, 0.3, 400);
        var material = new THREE.MeshStandardMaterial({ color: 0xd4a050 });
        var ground = new THREE.Mesh(geometry, material);
        ground.position.y = -0.15;
        ground.receiveShadow = true;
        scene.add(ground);
        elements.ground = ground;
    }

    function createDuneHills() {
        var dunePositions = [
            { x: -100, z: -150, height: 40 },
            { x: 120, z: -100, height: 35 },
            { x: -80, z: 100, height: 30 },
            { x: 140, z: 120, height: 45 }
        ];

        elements.dunes = [];
        dunePositions.forEach(function(pos) {
            var geometry = new THREE.BoxGeometry(80, pos.height, 100);
            var material = new THREE.MeshStandardMaterial({ color: 0xc9964a });
            var dune = new THREE.Mesh(geometry, material);
            dune.position.set(pos.x, pos.height / 2, pos.z);
            dune.castShadow = true;
            dune.receiveShadow = true;
            dune.scale.z = 0.7;
            scene.add(dune);
            elements.dunes.push(dune);
        });
    }

    function createOasis() {
        var geometry = new THREE.BoxGeometry(15, 0.1, 15);
        var material = new THREE.MeshStandardMaterial({
            color: 0x1a7a6b,
            emissive: 0x0d4a44
        });
        var water = new THREE.Mesh(geometry, material);
        water.position.set(80, 0.05, -80);
        water.receiveShadow = true;
        scene.add(water);
        elements.oasisWater = water;

        createPalmTrees();
    }

    function createPalmTrees() {
        var palmPositions = [
            { x: 85, z: -75 },
            { x: 75, z: -85 },
            { x: 90, z: -90 }
        ];

        elements.palmTrees = [];
        palmPositions.forEach(function(pos) {
            var trunkGeometry = new THREE.BoxGeometry(2, 20, 2);
            var trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
            var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(pos.x, 10, pos.z);
            trunk.castShadow = true;
            scene.add(trunk);

            var canopyGeometry = new THREE.BoxGeometry(12, 12, 12);
            var canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x2d7d2d });
            var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
            canopy.position.set(pos.x, 22, pos.z);
            canopy.castShadow = true;
            scene.add(canopy);

            elements.palmTrees.push({ trunk: trunk, canopy: canopy });
        });
    }

    function createCamels() {
        var camelPositions = [
            { x: -30, z: 0 },
            { x: -10, z: 0 },
            { x: 10, z: 0 },
            { x: 30, z: 0 }
        ];

        elements.camels = [];
        camelPositions.forEach(function(pos) {
            var group = new THREE.Group();
            group.position.set(pos.x, 0, pos.z);

            var bodyGeometry = new THREE.BoxGeometry(8, 8, 14);
            var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xc19a6b });
            var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 5;
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            var neckGeometry = new THREE.BoxGeometry(2, 8, 3);
            var neckMaterial = new THREE.MeshStandardMaterial({ color: 0xb8956a });
            var neck = new THREE.Mesh(neckGeometry, neckMaterial);
            neck.position.set(0, 12, 4);
            neck.castShadow = true;
            group.add(neck);

            var headGeometry = new THREE.BoxGeometry(3, 4, 3);
            var headMaterial = new THREE.MeshStandardMaterial({ color: 0xb8956a });
            var head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.set(0, 17, 5);
            head.castShadow = true;
            group.add(head);

            var legPositions = [
                { x: -3, z: -3 },
                { x: 3, z: -3 },
                { x: -3, z: 3 },
                { x: 3, z: 3 }
            ];
            legPositions.forEach(function(legPos) {
                var legGeometry = new THREE.BoxGeometry(1.5, 6, 1.5);
                var legMaterial = new THREE.MeshStandardMaterial({ color: 0xa0826d });
                var leg = new THREE.Mesh(legGeometry, legMaterial);
                leg.position.set(legPos.x, 3, legPos.z);
                leg.castShadow = true;
                group.add(leg);
            });

            scene.add(group);
            elements.camels.push(group);
        });
    }

    function createSmugglersRiding() {
        elements.smugglersRiding = [];

        for (var i = 0; i < 2; i++) {
            var riderGeometry = new THREE.BoxGeometry(3, 6, 2);
            var riderMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
            var rider = new THREE.Mesh(riderGeometry, riderMaterial);
            rider.position.set(-30 + i * 40, 13, 0);
            rider.castShadow = true;
            scene.add(rider);
            elements.smugglersRiding.push(rider);
        }
    }

    function createGroundSmugglers() {
        var positions = [
            { x: -60, z: -15 },
            { x: -60, z: 15 },
            { x: 60, z: -15 },
            { x: 60, z: 15 }
        ];

        elements.groundSmugglers = [];
        positions.forEach(function(pos) {
            var geometry = new THREE.BoxGeometry(2.5, 6, 2);
            var material = new THREE.MeshStandardMaterial({ color: 0x2d2d2d });
            var figure = new THREE.Mesh(geometry, material);
            figure.position.set(pos.x, 3, pos.z);
            figure.castShadow = true;
            scene.add(figure);
            elements.groundSmugglers.push(figure);
        });
    }

    function createBorderPatrol() {
        var positions = [
            { x: 80, z: 0 },
            { x: 85, z: -8 },
            { x: 85, z: 8 }
        ];

        elements.borderPatrol = [];
        positions.forEach(function(pos) {
            var geometry = new THREE.BoxGeometry(2.5, 6, 2);
            var material = new THREE.MeshStandardMaterial({ color: 0xc9a961 });
            var soldier = new THREE.Mesh(geometry, material);
            soldier.position.set(pos.x, 3, pos.z);
            soldier.castShadow = true;
            scene.add(soldier);
            elements.borderPatrol.push(soldier);
        });
    }

    function createPatrolVehicles() {
        elements.patrolVehicles = [];

        for (var i = 0; i < 2; i++) {
            var group = new THREE.Group();
            group.position.set(100 + i * 40, 0, -30);

            var bodyGeometry = new THREE.BoxGeometry(12, 8, 20);
            var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 4;
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            var wheelGeometry = new THREE.BoxGeometry(3, 3, 4);
            var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            var wheelPositions = [
                { x: -4, z: -8 },
                { x: 4, z: -8 },
                { x: -4, z: 8 },
                { x: 4, z: 8 }
            ];
            wheelPositions.forEach(function(wheelPos) {
                var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel.position.set(wheelPos.x, 2, wheelPos.z);
                wheel.castShadow = true;
                group.add(wheel);
            });

            var lightGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.5);
            var lightMaterial = new THREE.MeshStandardMaterial({
                color: 0xffff00,
                emissive: 0xff8800
            });
            var light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(0, 9, -10);
            group.add(light);

            scene.add(group);
            elements.patrolVehicles.push(group);
        }
    }

    function createDrone() {
        var group = new THREE.Group();
        group.position.set(0, 50, 0);

        var bodyGeometry = new THREE.BoxGeometry(3, 2, 3);
        var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);

        var propPositions = [
            { x: 5, z: 5 },
            { x: -5, z: 5 },
            { x: 5, z: -5 },
            { x: -5, z: -5 }
        ];
        var propGeometry = new THREE.BoxGeometry(1, 0.2, 8);
        var propMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        propPositions.forEach(function(pos) {
            var prop = new THREE.Mesh(propGeometry, propMaterial);
            prop.position.set(pos.x, 0, pos.z);
            prop.castShadow = true;
            group.add(prop);
        });

        scene.add(group);
        elements.drone = group;
    }

    function createBioweaponContainer() {
        var geometry = new THREE.BoxGeometry(6, 4, 8);
        var material = new THREE.MeshStandardMaterial({
            color: 0x1a5c1a,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        var container = new THREE.Mesh(geometry, material);
        container.position.set(-10, 7, 2);
        container.castShadow = true;
        scene.add(container);
        elements.bioweapon = container;
    }

    function createCheckpointGate() {
        var group = new THREE.Group();
        group.position.set(60, 0, 0);

        var boothGeometry = new THREE.BoxGeometry(8, 6, 8);
        var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
        var booth = new THREE.Mesh(boothGeometry, boothMaterial);
        booth.position.set(0, 3, 0);
        booth.castShadow = true;
        group.add(booth);

        var barGeometry = new THREE.BoxGeometry(25, 1, 0.5);
        var barMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        var bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.position.set(0, 6, 5);
        bar.castShadow = true;
        group.add(bar);

        scene.add(group);
        elements.checkpointGate = group;
    }

    function createAncientRuinsWall() {
        elements.ruinsWall = [];
        var positions = [
            { x: -120, z: 60 },
            { x: -100, z: 65 },
            { x: -80, z: 60 }
        ];

        positions.forEach(function(pos) {
            var geometry = new THREE.BoxGeometry(12, 15, 4);
            var material = new THREE.MeshStandardMaterial({ color: 0x8b7765 });
            var wall = new THREE.Mesh(geometry, material);
            wall.position.set(pos.x, 7.5, pos.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);
            elements.ruinsWall.push(wall);
        });
    }

    function createHeatShimmer() {
        elements.heatShimmer = [];
        var positions = [
            { x: -50, z: 50 },
            { x: 50, z: -50 },
            { x: 0, z: 80 },
            { x: -80, z: 0 }
        ];

        positions.forEach(function(pos) {
            var geometry = new THREE.BoxGeometry(10, 0.2, 10);
            var material = new THREE.MeshStandardMaterial({
                color: 0xffeecc,
                emissive: 0xffddaa,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.4
            });
            var shimmer = new THREE.Mesh(geometry, material);
            shimmer.position.set(pos.x, 0.5, pos.z);
            scene.add(shimmer);
            elements.heatShimmer.push(shimmer);
        });
    }

    function createRadioEquipment() {
        var vehicleIndex = 0;
        var vehiclePos = elements.patrolVehicles[vehicleIndex].position;

        var antennaGeometry = new THREE.BoxGeometry(0.5, 15, 0.5);
        var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(vehiclePos.x, vehiclePos.y + 12, vehiclePos.z);
        antenna.castShadow = true;
        scene.add(antenna);
        elements.antenna = antenna;

        var screenGeometry = new THREE.BoxGeometry(3, 2, 0.3);
        var screenMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00aa00,
            emissiveIntensity: 0.8
        });
        var screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(vehiclePos.x + 3, vehiclePos.y + 5, vehiclePos.z);
        scene.add(screen);
        elements.radioScreen = screen;
    }

    function createSupplyCache() {
        var geometry = new THREE.BoxGeometry(8, 4, 6);
        var material = new THREE.MeshStandardMaterial({
            color: 0x6b4423,
            emissive: 0xff6600,
            emissiveIntensity: 0.3
        });
        var cache = new THREE.Mesh(geometry, material);
        cache.position.set(-120, 2, -80);
        cache.castShadow = true;
        scene.add(cache);
        elements.supplyCache = cache;
    }

    function createHUD() {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');

        function updateHUDTexture() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, 512, 128);

            ctx.fillStyle = '#00ff00';
            ctx.font = 'Bold 32px Arial';
            ctx.fillText('SMUGGLERS: 6', 20, 50);
            ctx.font = 'Bold 24px Arial';
            ctx.fillText('PATROL TEAM: 3', 20, 85);
            ctx.fillText('BIOWEAPON: LOCATED', 250, 85);
        }

        updateHUDTexture();
        var texture = new THREE.CanvasTexture(canvas);
        var geometry = new THREE.BoxGeometry(6, 1.5, 0.1);
        var material = new THREE.MeshStandardMaterial({ map: texture, emissive: 0x00ff00 });
        var hudMesh = new THREE.Mesh(geometry, material);
        hudMesh.position.set(camera.position.x - 5, camera.position.y + 2, camera.position.z - 3);
        hudMesh.renderOrder = 1000;
        scene.add(hudMesh);

        hudElements.canvas = canvas;
        hudElements.mesh = hudMesh;
        hudElements.updateTexture = updateHUDTexture;
    }

    function setupKeyListeners() {
        document.addEventListener('keydown', function(e) {
            keyStates[e.key] = true;
            if (e.key === 'h' || e.key === 'H') {
                var now = Date.now();
                if (now - lastHTime < 400) {
                    if (keyStates['b'] || keyStates['B']) {
                        activateBioweaponMode();
                    }
                }
                lastHTime = now;
            }
        });

        document.addEventListener('keyup', function(e) {
            keyStates[e.key] = false;
        });
    }

    function activateBioweaponMode() {
        if (elements.bioweapon) {
            elements.bioweapon.material.emissiveIntensity = 1.0;
        }
    }

    function update(delta) {
        elapsedTime += delta;

        if (elements.camels && elements.camels.length > 0) {
            elements.camels.forEach(function(camel) {
                camel.rotation.z = Math.sin(elapsedTime * 2) * 0.05;
            });
        }

        if (elements.drone) {
            var radius = 60;
            elements.drone.position.x = Math.cos(elapsedTime * 0.5) * radius;
            elements.drone.position.z = Math.sin(elapsedTime * 0.5) * radius;
            elements.drone.rotation.y = elapsedTime * 0.5;
        }

        if (elements.patrolVehicles && elements.patrolVehicles.length > 0) {
            elements.patrolVehicles.forEach(function(vehicle) {
                vehicle.position.x -= delta * 5;
            });
        }

        if (elements.borderPatrol && elements.borderPatrol.length > 0) {
            elements.borderPatrol.forEach(function(soldier) {
                soldier.position.x -= delta * 3;
            });
        }

        if (elements.heatShimmer && elements.heatShimmer.length > 0) {
            elements.heatShimmer.forEach(function(shimmer) {
                shimmer.material.emissiveIntensity = 0.3 + Math.sin(elapsedTime * 3) * 0.2;
            });
        }

        if (hudElements.mesh && camera) {
            hudElements.mesh.position.copy(camera.position);
            hudElements.mesh.position.x -= 5;
            hudElements.mesh.position.y += 2;
            hudElements.mesh.position.z -= 3;
        }
    }

    function reset() {
        elapsedTime = 0;
        keyStates = {};
        lastHTime = 0;

        if (elements.bioweapon) {
            elements.bioweapon.material.emissiveIntensity = 0.5;
        }

        if (elements.camels && elements.camels.length > 0) {
            elements.camels.forEach(function(camel, i) {
                camel.rotation.z = 0;
                var positions = [
                    { x: -30, z: 0 },
                    { x: -10, z: 0 },
                    { x: 10, z: 0 },
                    { x: 30, z: 0 }
                ];
                if (positions[i]) {
                    camel.position.set(positions[i].x, 0, positions[i].z);
                }
            });
        }

        if (elements.patrolVehicles && elements.patrolVehicles.length > 0) {
            elements.patrolVehicles.forEach(function(vehicle, i) {
                vehicle.position.set(100 + i * 40, 0, -30);
            });
        }

        if (elements.borderPatrol && elements.borderPatrol.length > 0) {
            elements.borderPatrol.forEach(function(soldier, i) {
                var positions = [
                    { x: 80, z: 0 },
                    { x: 85, z: -8 },
                    { x: 85, z: 8 }
                ];
                if (positions[i]) {
                    soldier.position.set(positions[i].x, 3, positions[i].z);
                }
            });
        }
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
