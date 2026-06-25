window.TarPit = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var bubbleGroups = [];
    var bubbleAnimationTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        bubbleGroups = [];
        bubbleAnimationTime = 0;
        buildTarPools();
        buildRefinery();
        buildPipelines();
        buildWatchposts();
        buildVehicles();
        buildWorkerCamp();
        buildExtractionRigs();
        buildPumpHouses();
        setupLighting();
    }

    function buildTarPools() {
        var poolMaterial = new THREE.MeshLambertMaterial({ color: 0x1a0f05 });
        var tarColor = 0x2a1f10;

        // Main tar pool field
        var pool1Geometry = new THREE.BoxGeometry(80, 2, 60);
        var pool1 = new THREE.Mesh(pool1Geometry, poolMaterial);
        pool1.position.set(0, -1, 0);
        scene.add(pool1);
        objects.push(pool1);

        // Secondary tar pool
        var pool2Geometry = new THREE.BoxGeometry(50, 2, 40);
        var pool2 = new THREE.Mesh(pool2Geometry, poolMaterial);
        pool2.position.set(-45, -1, -50);
        scene.add(pool2);
        objects.push(pool2);

        // Tar pool 3
        var pool3Geometry = new THREE.BoxGeometry(40, 2, 35);
        var pool3 = new THREE.Mesh(pool3Geometry, poolMaterial);
        pool3.position.set(50, -1, -45);
        scene.add(pool3);
        objects.push(pool3);

        // Add bubble clusters to tar pools
        addBubblesToPool(0, 0, 30);
        addBubblesToPool(-30, 0, -35);
        addBubblesToPool(35, 0, -20);
        addBubblesToPool(20, 0, 20);
        addBubblesToPool(-50, 0, 20);
    }

    function addBubblesToPool(x, y, z) {
        var bubbleMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var bubbleGroup = [];

        for (var i = 0; i < 8; i++) {
            var bubbleGeometry = new THREE.SphereGeometry(1.5 + Math.random() * 1.5, 8, 8);
            var bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            bubble.position.set(x + (Math.random() - 0.5) * 15, y + i * 0.8, z + (Math.random() - 0.5) * 15);
            bubble.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4);
            scene.add(bubble);
            objects.push(bubble);
            bubbleGroup.push(bubble);
        }
        bubbleGroups.push(bubbleGroup);
    }

    function buildRefinery() {
        var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var storageColor = 0x8b6f47;
        var storageMaterial = new THREE.MeshLambertMaterial({ color: storageColor });

        // Distillation towers - tall box structures
        for (var i = 0; i < 3; i++) {
            var towerGeometry = new THREE.BoxGeometry(8, 35, 8);
            var tower = new THREE.Mesh(towerGeometry, metalMaterial);
            tower.position.set(-30 + i * 15, 17.5, 30);
            scene.add(tower);
            objects.push(tower);

            // Add pipe connectors
            var connectorGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
            var connector = new THREE.Mesh(connectorGeometry, metalMaterial);
            connector.position.set(-30 + i * 15 + 5, 12, 30);
            connector.rotation.z = Math.PI / 2;
            scene.add(connector);
            objects.push(connector);
        }

        // Storage tanks - large cylinders
        for (var i = 0; i < 4; i++) {
            var tankGeometry = new THREE.CylinderGeometry(6, 6, 20, 12);
            var tank = new THREE.Mesh(tankGeometry, storageMaterial);
            tank.position.set(-20 + i * 18, 10, 60);
            scene.add(tank);
            objects.push(tank);

            // Tank cap box
            var capGeometry = new THREE.BoxGeometry(13, 2, 13);
            var cap = new THREE.Mesh(capGeometry, metalMaterial);
            cap.position.set(-20 + i * 18, 20.5, 60);
            scene.add(cap);
            objects.push(cap);

            // Tank valve boxes
            for (var j = 0; j < 2; j++) {
                var valveGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
                var valve = new THREE.Mesh(valveGeometry, metalMaterial);
                valve.position.set(-20 + i * 18 + (j === 0 ? -4 : 4), 8, 60);
                scene.add(valve);
                objects.push(valve);
            }
        }

        // Processing vats - box containers
        for (var i = 0; i < 5; i++) {
            var vatGeometry = new THREE.BoxGeometry(10, 12, 10);
            var vat = new THREE.Mesh(vatGeometry, storageMaterial);
            vat.position.set(-35 + i * 14, 6, 75);
            scene.add(vat);
            objects.push(vat);
        }
    }

    function buildPipelines() {
        var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

        // Main pipeline network - horizontal runs
        var pipeSegments = [
            { x: 0, y: 5, z: 0, length: 60, rotX: 0, rotY: 0 },
            { x: -30, y: 8, z: 20, length: 40, rotX: 0, rotY: 0 },
            { x: 20, y: 6, z: -15, length: 35, rotX: 0, rotY: 0 },
            { x: -10, y: 10, z: 40, length: 50, rotX: 0, rotY: 0 },
            { x: 35, y: 4, z: 10, length: 45, rotX: 0, rotY: 0 }
        ];

        for (var i = 0; i < pipeSegments.length; i++) {
            var seg = pipeSegments[i];
            var pipeGeometry = new THREE.CylinderGeometry(1.2, 1.2, seg.length, 10);
            var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            pipe.position.set(seg.x, seg.y, seg.z);
            pipe.rotation.z = Math.PI / 2;
            scene.add(pipe);
            objects.push(pipe);
        }

        // Vertical risers
        for (var i = 0; i < 6; i++) {
            var riserGeometry = new THREE.CylinderGeometry(1.2, 1.2, 25, 10);
            var riser = new THREE.Mesh(riserGeometry, pipeMaterial);
            riser.position.set(-40 + i * 20, 12.5, 50);
            scene.add(riser);
            objects.push(riser);
        }

        // Branch pipes
        for (var i = 0; i < 8; i++) {
            var branchGeometry = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
            var branch = new THREE.Mesh(branchGeometry, pipeMaterial);
            branch.position.set(-50 + i * 15, 3 + i * 1.5, -30);
            branch.rotation.z = Math.PI / 2 + (Math.random() * 0.3);
            scene.add(branch);
            objects.push(branch);
        }
    }

    function buildWatchposts() {
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        // Corner watchtower positions
        var corners = [
            { x: -60, z: -60 },
            { x: 60, z: -60 },
            { x: -60, z: 60 },
            { x: 60, z: 60 }
        ];

        for (var c = 0; c < corners.length; c++) {
            var corner = corners[c];

            // Tower base
            var baseGeometry = new THREE.BoxGeometry(6, 30, 6);
            var base = new THREE.Mesh(baseGeometry, towerMaterial);
            base.position.set(corner.x, 15, corner.z);
            scene.add(base);
            objects.push(base);

            // Tower observation platform
            var platformGeometry = new THREE.BoxGeometry(12, 2, 12);
            var platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(corner.x, 31, corner.z);
            scene.add(platform);
            objects.push(platform);

            // Guard booth on platform
            var boothGeometry = new THREE.BoxGeometry(4, 4, 4);
            var booth = new THREE.Mesh(boothGeometry, towerMaterial);
            booth.position.set(corner.x, 34, corner.z);
            scene.add(booth);
            objects.push(booth);

            // Spotlight cone - cylinder
            var spotGeometry = new THREE.CylinderGeometry(2, 1.5, 3, 8);
            var spot = new THREE.Mesh(spotGeometry, new THREE.MeshLambertMaterial({ color: 0xffff99 }));
            spot.position.set(corner.x, 37, corner.z);
            scene.add(spot);
            objects.push(spot);
        }

        // Perimeter fence posts - small boxes
        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var radius = 65;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius;

            var postGeometry = new THREE.BoxGeometry(1, 12, 1);
            var post = new THREE.Mesh(postGeometry, towerMaterial);
            post.position.set(x, 6, z);
            scene.add(post);
            objects.push(post);
        }
    }

    function buildVehicles() {
        var vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        // Truck convoy - 5 trucks
        for (var t = 0; t < 5; t++) {
            var baseX = -40 + t * 12;

            // Truck cabin
            var cabinGeometry = new THREE.BoxGeometry(3, 3, 5);
            var cabin = new THREE.Mesh(cabinGeometry, vehicleMaterial);
            cabin.position.set(baseX, 2.5, -70);
            scene.add(cabin);
            objects.push(cabin);

            // Truck bed
            var bedGeometry = new THREE.BoxGeometry(4, 3, 12);
            var bed = new THREE.Mesh(bedGeometry, vehicleMaterial);
            bed.position.set(baseX + 1, 2.5, -60);
            scene.add(bed);
            objects.push(bed);

            // Wheels
            for (var w = 0; w < 4; w++) {
                var wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1.2, 12);
                var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                var wheelX = baseX + (w < 2 ? -1.5 : 1.5);
                var wheelZ = -68 + (w % 2 === 0 ? 0 : -10);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(wheelX, 1.5, wheelZ);
                scene.add(wheel);
                objects.push(wheel);
            }
        }

        // Abandoned vehicles sunk in tar
        for (var v = 0; v < 3; v++) {
            var carX = -20 + v * 35;
            var carZ = -30 + v * 25;

            // Sunken car body
            var carGeometry = new THREE.BoxGeometry(3, 2, 6);
            var car = new THREE.Mesh(carGeometry, vehicleMaterial);
            car.position.set(carX, -0.5, carZ);
            car.rotation.y = Math.random() * Math.PI;
            scene.add(car);
            objects.push(car);

            // Sunken wheels
            for (var w = 0; w < 2; w++) {
                var wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12);
                var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(carX + (w === 0 ? -1.5 : 1.5), -0.8, carZ);
                scene.add(wheel);
                objects.push(wheel);
            }
        }
    }

    function buildWorkerCamp() {
        var barrackMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });

        // Barracks buildings in grid
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 2; col++) {
                var barrackGeometry = new THREE.BoxGeometry(12, 8, 16);
                var barrack = new THREE.Mesh(barrackGeometry, barrackMaterial);
                barrack.position.set(-35 + col * 20, 4, 70 + row * 20);
                scene.add(barrack);
                objects.push(barrack);

                // Roof peak - cone
                var roofGeometry = new THREE.ConeGeometry(7, 5, 8);
                var roof = new THREE.Mesh(roofGeometry, new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
                roof.position.set(-35 + col * 20, 10.5, 70 + row * 20);
                scene.add(roof);
                objects.push(roof);
            }
        }

        // Fence perimeter - horizontal rails as cylinders
        for (var i = 0; i < 8; i++) {
            var railGeometry = new THREE.CylinderGeometry(0.4, 0.4, 25, 6);
            var rail = new THREE.Mesh(railGeometry, fenceMaterial);
            rail.position.set(-50 + i * 15, 3, 85);
            rail.rotation.z = Math.PI / 2;
            scene.add(rail);
            objects.push(rail);
        }

        // Fence posts
        for (var i = 0; i < 10; i++) {
            var postGeometry = new THREE.BoxGeometry(0.8, 6, 0.8);
            var post = new THREE.Mesh(postGeometry, fenceMaterial);
            post.position.set(-50 + i * 12, 3, 85);
            scene.add(post);
            objects.push(post);
        }

        // Guard shack in camp
        var shackGeometry = new THREE.BoxGeometry(6, 5, 6);
        var shack = new THREE.Mesh(shackGeometry, new THREE.MeshLambertMaterial({ color: 0x505050 }));
        shack.position.set(-20, 2.5, 100);
        scene.add(shack);
        objects.push(shack);
    }

    function buildExtractionRigs() {
        var derrickMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var drillMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });

        // Oil rig array
        for (var r = 0; r < 4; r++) {
            var rigX = -40 + r * 30;
            var rigZ = 20;

            // Derrick frame - box structure
            var derrickGeometry = new THREE.BoxGeometry(8, 25, 8);
            var derrick = new THREE.Mesh(derrickGeometry, derrickMaterial);
            derrick.position.set(rigX, 12.5, rigZ);
            scene.add(derrick);
            objects.push(derrick);

            // Main drill pipe - cylinder
            var drillGeometry = new THREE.CylinderGeometry(1.5, 1.5, 30, 10);
            var drill = new THREE.Mesh(drillGeometry, drillMaterial);
            drill.position.set(rigX, 15, rigZ);
            scene.add(drill);
            objects.push(drill);

            // Counterweight box
            var weightGeometry = new THREE.BoxGeometry(6, 4, 6);
            var weight = new THREE.Mesh(weightGeometry, new THREE.MeshLambertMaterial({ color: 0x707070 }));
            weight.position.set(rigX - 8, 20, rigZ);
            scene.add(weight);
            objects.push(weight);

            // Pump motor base
            var motorBaseGeometry = new THREE.BoxGeometry(5, 3, 5);
            var motorBase = new THREE.Mesh(motorBaseGeometry, derrickMaterial);
            motorBase.position.set(rigX, 1.5, rigZ - 8);
            scene.add(motorBase);
            objects.push(motorBase);

            // Pump motor cylinder
            var motorGeometry = new THREE.CylinderGeometry(2, 2, 4, 10);
            var motor = new THREE.Mesh(motorGeometry, drillMaterial);
            motor.position.set(rigX, 3.5, rigZ - 8);
            scene.add(motor);
            objects.push(motor);

            // Collection tank
            var collectorGeometry = new THREE.CylinderGeometry(4, 4, 8, 12);
            var collector = new THREE.Mesh(collectorGeometry, new THREE.MeshLambertMaterial({ color: 0x6b5a3a }));
            collector.position.set(rigX + 8, 4, rigZ);
            scene.add(collector);
            objects.push(collector);
        }
    }

    function buildPumpHouses() {
        var houseMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var stackMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });

        // Pump house structures
        for (var p = 0; p < 5; p++) {
            var houseX = -50 + p * 25;
            var houseZ = -40;

            // Building box
            var buildingGeometry = new THREE.BoxGeometry(8, 6, 8);
            var building = new THREE.Mesh(buildingGeometry, houseMaterial);
            building.position.set(houseX, 3, houseZ);
            scene.add(building);
            objects.push(building);

            // Exhaust stack
            var stackGeometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 10);
            var stack = new THREE.Mesh(stackGeometry, stackMaterial);
            stack.position.set(houseX + 3, 8, houseZ);
            scene.add(stack);
            objects.push(stack);

            // Stack cap cone
            var capGeometry = new THREE.ConeGeometry(2, 2, 8);
            var cap = new THREE.Mesh(capGeometry, new THREE.MeshLambertMaterial({ color: 0x6a5a4a }));
            cap.position.set(houseX + 3, 13, houseZ);
            scene.add(cap);
            objects.push(cap);
        }

        // Burn pit - fire glow with rocks
        var pitX = 45;
        var pitZ = -30;

        // Pit walls - boxes
        for (var i = 0; i < 4; i++) {
            var wallGeometry = new THREE.BoxGeometry(12, 4, 2);
            var wall = new THREE.Mesh(wallGeometry, new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
            wall.position.set(pitX + (i < 2 ? -6 : 6), 2, pitZ + (i % 2 === 0 ? -6 : 6));
            wall.rotation.y = i * Math.PI / 2;
            scene.add(wall);
            objects.push(wall);
        }

        // Fire sphere cluster
        var fireColor = 0xff6600;
        var fireGroup = [];
        for (var f = 0; f < 12; f++) {
            var fireGeometry = new THREE.SphereGeometry(1.5 + Math.random() * 2, 8, 8);
            var fire = new THREE.Mesh(fireGeometry, new THREE.MeshLambertMaterial({ color: fireColor }));
            fire.position.set(pitX + (Math.random() - 0.5) * 8, 2 + f * 0.6, pitZ + (Math.random() - 0.5) * 8);
            scene.add(fire);
            objects.push(fire);
            fireGroup.push(fire);
        }
        bubbleGroups.push(fireGroup);
    }

    function setupLighting() {
        // Ambient light
        var ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light - sun
        var sunLight = new THREE.DirectionalLight(0xccaa88, 0.8);
        sunLight.position.set(50, 60, 40);
        sunLight.castShadow = false;
        scene.add(sunLight);
        lights.push(sunLight);

        // Point light from fire
        var fireLight = new THREE.PointLight(0xff6600, 0.6, 100);
        fireLight.position.set(45, 10, -30);
        scene.add(fireLight);
        lights.push(fireLight);

        // Industrial yellow lights at watchposts
        for (var i = 0; i < 4; i++) {
            var angle = (i / 4) * Math.PI * 2;
            var x = Math.cos(angle) * 60;
            var z = Math.sin(angle) * 60;
            var postLight = new THREE.PointLight(0xffff88, 0.4, 80);
            postLight.position.set(x, 35, z);
            scene.add(postLight);
            lights.push(postLight);
        }
    }

    function update(delta) {
        bubbleAnimationTime += delta;

        // Animate bubble oscillation
        for (var g = 0; g < bubbleGroups.length; g++) {
            var group = bubbleGroups[g];
            for (var b = 0; b < group.length; b++) {
                var bubble = group[b];
                var offsetY = Math.sin(bubbleAnimationTime * 2 + b * 0.5) * 1.5;
                var baseY = bubble.userData.baseY || bubble.position.y;
                if (!bubble.userData.baseY) {
                    bubble.userData.baseY = bubble.position.y;
                }
                bubble.position.y = baseY + offsetY;
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
        bubbleGroups = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
