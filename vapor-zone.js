window.VaporZone = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var steamClouds = [];
    var fans = [];
    var time = 0;

    function buildIndustrialPipes() {
        var color = 0x888888;
        var pipeGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        var pipeMaterial = new THREE.MeshLambertMaterial({ color: color });

        var pipe1 = new THREE.Mesh(pipeGeom, pipeMaterial);
        pipe1.position.set(-5, 2, 0);
        pipe1.rotation.z = Math.PI / 4;
        scene.add(pipe1);
        objects.push(pipe1);

        var pipe2 = new THREE.Mesh(pipeGeom, pipeMaterial);
        pipe2.position.set(0, 2, -5);
        pipe2.rotation.x = Math.PI / 3;
        scene.add(pipe2);
        objects.push(pipe2);

        var pipe3 = new THREE.Mesh(pipeGeom, pipeMaterial);
        pipe3.position.set(5, 3, 2);
        pipe3.rotation.z = Math.PI / 6;
        scene.add(pipe3);
        objects.push(pipe3);

        var pipe4 = new THREE.Mesh(pipeGeom, pipeMaterial);
        pipe4.position.set(-3, 4, 5);
        pipe4.rotation.x = Math.PI / 5;
        scene.add(pipe4);
        objects.push(pipe4);

        var pipe5 = new THREE.Mesh(pipeGeom, pipeMaterial);
        pipe5.position.set(3, 2.5, -3);
        pipe5.rotation.y = Math.PI / 4;
        scene.add(pipe5);
        objects.push(pipe5);
    }

    function buildSteamVents() {
        var ventHeight = 8;
        var cylinderGeom = new THREE.CylinderGeometry(0.5, 0.6, ventHeight, 8);
        var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

        var positions = [
            [-8, ventHeight / 2, -8],
            [8, ventHeight / 2, -8],
            [-8, ventHeight / 2, 8],
            [8, ventHeight / 2, 8],
            [0, ventHeight / 2, 0]
        ];

        for (var i = 0; i < positions.length; i++) {
            var vent = new THREE.Mesh(cylinderGeom, cylinderMaterial);
            vent.position.set(positions[i][0], positions[i][1], positions[i][2]);
            scene.add(vent);
            objects.push(vent);

            var cloudGeom = new THREE.SphereGeometry(0.8, 8, 8);
            var cloudMaterial = new THREE.MeshLambertMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.6
            });
            var cloud = new THREE.Mesh(cloudGeom, cloudMaterial);
            cloud.position.set(positions[i][0], ventHeight + 0.5, positions[i][2]);
            scene.add(cloud);
            objects.push(cloud);
            steamClouds.push({
                mesh: cloud,
                baseY: ventHeight + 0.5,
                amplitude: 0.5,
                speed: 0.8 + i * 0.1
            });
        }
    }

    function buildChemicalTanks() {
        var tankHeight = 6;
        var tankGeom = new THREE.CylinderGeometry(1.2, 1.2, tankHeight, 12);
        var yellowMaterial = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
        var orangeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8800 });

        var tank1 = new THREE.Mesh(tankGeom, yellowMaterial);
        tank1.position.set(-10, tankHeight / 2, -10);
        scene.add(tank1);
        objects.push(tank1);

        var tank2 = new THREE.Mesh(tankGeom, orangeMaterial);
        tank2.position.set(10, tankHeight / 2, -10);
        scene.add(tank2);
        objects.push(tank2);

        var tank3 = new THREE.Mesh(tankGeom, yellowMaterial);
        tank3.position.set(-10, tankHeight / 2, 10);
        scene.add(tank3);
        objects.push(tank3);

        var tank4 = new THREE.Mesh(tankGeom, orangeMaterial);
        tank4.position.set(10, tankHeight / 2, 10);
        scene.add(tank4);
        objects.push(tank4);

        var tank5 = new THREE.Mesh(tankGeom, yellowMaterial);
        tank5.position.set(0, tankHeight / 2, -15);
        scene.add(tank5);
        objects.push(tank5);
    }

    function buildHazmatFacility() {
        var boxGeom = new THREE.BoxGeometry(12, 8, 10);
        var hazmatMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var facility = new THREE.Mesh(boxGeom, hazmatMaterial);
        facility.position.set(-15, 4, 0);
        scene.add(facility);
        objects.push(facility);

        var stripeGeom = new THREE.BoxGeometry(12.2, 0.4, 0.1);
        var stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });

        for (var i = 0; i < 6; i++) {
            var stripe = new THREE.Mesh(stripeGeom, stripeMaterial);
            stripe.position.set(-15, 2 + i * 1.2, 5.05);
            scene.add(stripe);
            objects.push(stripe);
        }
    }

    function buildGasCanisterClusters() {
        var canisterGeom = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
        var redMaterial = new THREE.MeshLambertMaterial({ color: 0xDD0000 });
        var greenMaterial = new THREE.MeshLambertMaterial({ color: 0x00DD00 });

        var clusterPositions = [
            [-12, 1, 5],
            [12, 1, -5],
            [0, 1, 12],
            [5, 1, -12],
            [-5, 1, -12]
        ];

        for (var j = 0; j < clusterPositions.length; j++) {
            var basePos = clusterPositions[j];
            for (var i = 0; i < 6; i++) {
                var canister = new THREE.Mesh(canisterGeom, i % 2 === 0 ? redMaterial : greenMaterial);
                var offsetX = (i % 3) * 0.8 - 0.8;
                var offsetZ = Math.floor(i / 3) * 0.8;
                canister.position.set(basePos[0] + offsetX, basePos[1], basePos[2] + offsetZ);
                scene.add(canister);
                objects.push(canister);
            }
        }
    }

    function buildDecontaminationShowers() {
        var frameGeom = new THREE.BoxGeometry(1, 3, 1);
        var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

        var showerPositions = [
            [-7, 1.5, -7],
            [7, 1.5, -7],
            [-7, 1.5, 7],
            [7, 1.5, 7]
        ];

        for (var i = 0; i < showerPositions.length; i++) {
            var frame = new THREE.Mesh(frameGeom, frameMaterial);
            frame.position.set(showerPositions[i][0], showerPositions[i][1], showerPositions[i][2]);
            scene.add(frame);
            objects.push(frame);

            var headGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
            var head = new THREE.Mesh(headGeom, new THREE.MeshLambertMaterial({ color: 0x666666 }));
            head.position.set(showerPositions[i][0], 3.2, showerPositions[i][2]);
            scene.add(head);
            objects.push(head);
        }
    }

    function buildWarningMarkers() {
        var coneGeom = new THREE.ConeGeometry(0.4, 1.5, 8);
        var coneMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });

        var markerPositions = [
            [-3, 0.75, -3],
            [3, 0.75, -3],
            [-3, 0.75, 3],
            [3, 0.75, 3],
            [0, 0.75, 0]
        ];

        for (var i = 0; i < markerPositions.length; i++) {
            var cone = new THREE.Mesh(coneGeom, coneMaterial);
            cone.position.set(markerPositions[i][0], markerPositions[i][1], markerPositions[i][2]);
            scene.add(cone);
            objects.push(cone);

            var postGeom = new THREE.CylinderGeometry(0.1, 0.1, 1, 6);
            var post = new THREE.Mesh(postGeom, new THREE.MeshLambertMaterial({ color: 0xFF8800 }));
            post.position.set(markerPositions[i][0], 0.5, markerPositions[i][2]);
            scene.add(post);
            objects.push(post);
        }
    }

    function buildResearchLab() {
        var labGeom = new THREE.BoxGeometry(10, 6, 8);
        var labMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var lab = new THREE.Mesh(labGeom, labMaterial);
        lab.position.set(15, 3, 0);
        scene.add(lab);
        objects.push(lab);

        var windowGeom = new THREE.BoxGeometry(1.5, 1.5, 0.2);
        var windowMaterial = new THREE.MeshLambertMaterial({
            color: 0x88BBFF,
            transparent: true,
            opacity: 0.4
        });

        var windowPositions = [
            [10.1, 3, -2],
            [10.1, 3, 2],
            [20.1, 3, -2],
            [20.1, 3, 2]
        ];

        for (var i = 0; i < windowPositions.length; i++) {
            var window = new THREE.Mesh(windowGeom, windowMaterial);
            window.position.set(windowPositions[i][0], windowPositions[i][1], windowPositions[i][2]);
            scene.add(window);
            objects.push(window);
        }
    }

    function buildVentilationFans() {
        var fanHubGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 8);
        var hubMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var fanPositions = [
            [-18, 7, -12],
            [18, 7, 12]
        ];

        for (var i = 0; i < fanPositions.length; i++) {
            var hub = new THREE.Mesh(fanHubGeom, hubMaterial);
            hub.position.set(fanPositions[i][0], fanPositions[i][1], fanPositions[i][2]);
            scene.add(hub);
            objects.push(hub);

            var bladeGeom = new THREE.BoxGeometry(3, 0.2, 0.3);
            var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

            for (var j = 0; j < 3; j++) {
                var blade = new THREE.Mesh(bladeGeom, bladeMaterial);
                blade.position.set(fanPositions[i][0], fanPositions[i][1], fanPositions[i][2]);
                blade.rotation.z = (j * Math.PI * 2 / 3);
                scene.add(blade);
                objects.push(blade);
                fans.push({
                    mesh: blade,
                    center: fanPositions[i],
                    index: j
                });
            }
        }
    }

    function buildEmergencyBlastDoors() {
        var doorGeom = new THREE.BoxGeometry(3, 4, 0.5);
        var doorMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });

        var doorPositions = [
            [-20, 2, 0],
            [20, 2, 0],
            [0, 2, -15],
            [0, 2, 15]
        ];

        for (var i = 0; i < doorPositions.length; i++) {
            var door = new THREE.Mesh(doorGeom, doorMaterial);
            door.position.set(doorPositions[i][0], doorPositions[i][1], doorPositions[i][2]);
            scene.add(door);
            objects.push(door);
        }
    }

    function buildContaminationPools() {
        var poolGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var greenMaterial = new THREE.MeshLambertMaterial({
            color: 0x00AA00,
            transparent: true,
            opacity: 0.7
        });
        var yellowMaterial = new THREE.MeshLambertMaterial({
            color: 0xCCCC00,
            transparent: true,
            opacity: 0.7
        });

        var poolPositions = [
            [-12, 0.5, -12],
            [-12, 0.5, 12],
            [12, 0.5, -12],
            [12, 0.5, 12],
            [-5, 0.5, -15],
            [5, 0.5, -15],
            [15, 0.5, -12],
            [15, 0.5, 12],
            [0, 0.5, -18]
        ];

        for (var i = 0; i < poolPositions.length; i++) {
            var pool = new THREE.Mesh(poolGeom, i % 2 === 0 ? greenMaterial : yellowMaterial);
            pool.position.set(poolPositions[i][0], poolPositions[i][1], poolPositions[i][2]);
            scene.add(pool);
            objects.push(pool);
        }
    }

    function buildAdditionalStructures() {
        var boxGeom = new THREE.BoxGeometry(2, 2, 2);
        var grayMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var yellowMaterial = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });

        for (var i = 0; i < 8; i++) {
            var box = new THREE.Mesh(boxGeom, i % 2 === 0 ? grayMaterial : yellowMaterial);
            var angle = (i / 8) * Math.PI * 2;
            box.position.set(Math.cos(angle) * 12, 1, Math.sin(angle) * 12);
            scene.add(box);
            objects.push(box);
        }

        var cylinderGeom = new THREE.CylinderGeometry(0.4, 0.5, 4, 12);
        var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

        for (var i = 0; i < 6; i++) {
            var cylinder = new THREE.Mesh(cylinderGeom, cylinderMaterial);
            var angle = (i / 6) * Math.PI * 2;
            cylinder.position.set(Math.cos(angle) * 8, 2, Math.sin(angle) * 8);
            scene.add(cylinder);
            objects.push(cylinder);
        }

        var coneGeom = new THREE.ConeGeometry(0.5, 2, 8);
        var coneMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });

        for (var i = 0; i < 5; i++) {
            var cone = new THREE.Mesh(coneGeom, coneMaterial);
            cone.position.set(-8 + i * 4, 1, -18);
            scene.add(cone);
            objects.push(cone);
        }
    }

    function buildMoreDetails() {
        var smallBoxGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        var detailMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

        for (var i = 0; i < 12; i++) {
            var box = new THREE.Mesh(smallBoxGeom, detailMaterial);
            box.position.set(-20 + Math.random() * 40, 0.3 + Math.random() * 2, -20 + Math.random() * 40);
            scene.add(box);
            objects.push(box);
        }

        var smallCylinderGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 6);
        var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

        for (var i = 0; i < 10; i++) {
            var cyl = new THREE.Mesh(smallCylinderGeom, cylinderMaterial);
            cyl.position.set(-18 + Math.random() * 36, 0.8, -18 + Math.random() * 36);
            cyl.rotation.z = Math.random() * Math.PI;
            scene.add(cyl);
            objects.push(cyl);
        }
    }

    function createLights() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight1 = new THREE.PointLight(0xffffff, 0.8, 40);
        pointLight1.position.set(-15, 8, -15);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xffffff, 0.8, 40);
        pointLight2.position.set(15, 8, 15);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0xffff99, 0.6, 30);
        pointLight3.position.set(0, 6, 0);
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        steamClouds = [];
        fans = [];
        time = 0;

        buildIndustrialPipes();
        buildSteamVents();
        buildChemicalTanks();
        buildHazmatFacility();
        buildGasCanisterClusters();
        buildDecontaminationShowers();
        buildWarningMarkers();
        buildResearchLab();
        buildVentilationFans();
        buildEmergencyBlastDoors();
        buildContaminationPools();
        buildAdditionalStructures();
        buildMoreDetails();
        createLights();
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < steamClouds.length; i++) {
            var cloud = steamClouds[i];
            cloud.mesh.position.y = cloud.baseY + Math.sin(time * cloud.speed) * cloud.amplitude;
        }

        for (var i = 0; i < fans.length; i++) {
            var fan = fans[i];
            fan.mesh.rotation.z += 0.05;
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
        steamClouds = [];
        fans = [];
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
