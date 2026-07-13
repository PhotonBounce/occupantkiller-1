window.AshVale = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var steamSpheres = [];
    var ashParticles = [];
    var time = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        steamSpheres = [];
        ashParticles = [];
        time = 0;
        buildValleyFloor();
        buildAshDunes();
        buildBuriedRuins();
        buildPartialVehicles();
        buildVolcanicVents();
        buildSurvivorCamp();
        buildMilitaryPost();
        buildAshTrees();
        buildCollapsedChurch();
        buildRoadMarkers();
        buildSupplyDrop();
        buildRubblePiles();
        setupLighting();
    }

    function buildValleyFloor() {
        var floorColor = 0xccccbb;
        var floorGeometry = new THREE.BoxGeometry(200, 2, 200);
        var floorMaterial = new THREE.MeshLambertMaterial({ color: floorColor });
        var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.position.y = -1;
        scene.add(floorMesh);
        objects.push(floorMesh);

        for (var i = 0; i < 8; i++) {
            var px = (Math.random() - 0.5) * 180;
            var pz = (Math.random() - 0.5) * 180;
            var sectionGeometry = new THREE.BoxGeometry(30, 1.5, 30);
            var sectionMaterial = new THREE.MeshLambertMaterial({ color: 0xbbbbaa });
            var sectionMesh = new THREE.Mesh(sectionGeometry, sectionMaterial);
            sectionMesh.position.set(px, -0.8, pz);
            scene.add(sectionMesh);
            objects.push(sectionMesh);
        }
    }

    function buildAshDunes() {
        var dunePositions = [
            { x: -60, z: -40, type: 'box' },
            { x: -40, z: 50, type: 'sphere' },
            { x: 20, z: -70, type: 'box' },
            { x: 70, z: 20, type: 'sphere' },
            { x: -80, z: 80, type: 'box' },
            { x: 50, z: -60, type: 'sphere' },
            { x: 30, z: 60, type: 'box' },
            { x: -30, z: -30, type: 'sphere' }
        ];

        for (var i = 0; i < dunePositions.length; i++) {
            var pos = dunePositions[i];
            if (pos.type === 'box') {
                var duneGeometry = new THREE.BoxGeometry(25, 15, 25);
                var duneMaterial = new THREE.MeshLambertMaterial({ color: 0xd9d9cc });
                var duneMesh = new THREE.Mesh(duneGeometry, duneMaterial);
                duneMesh.position.set(pos.x, 7, pos.z);
                scene.add(duneMesh);
                objects.push(duneMesh);
            } else {
                var sphereGeometry = new THREE.SphereGeometry(12, 8, 8);
                var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xd0d0c0 });
                var sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphereMesh.position.set(pos.x, 10, pos.z);
                scene.add(sphereMesh);
                objects.push(sphereMesh);
            }
        }
    }

    function buildBuriedRuins() {
        var ruinPositions = [
            { x: -50, z: 20 },
            { x: 30, z: -50 },
            { x: -20, z: -80 },
            { x: 60, z: 40 },
            { x: 10, z: 70 }
        ];

        for (var i = 0; i < ruinPositions.length; i++) {
            var pos = ruinPositions[i];
            var roofGeometry = new THREE.BoxGeometry(20, 8, 20);
            var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });
            var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
            roofMesh.position.set(pos.x, 1, pos.z);
            scene.add(roofMesh);
            objects.push(roofMesh);

            var wallGeometry = new THREE.BoxGeometry(18, 3, 18);
            var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x777766 });
            var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            wallMesh.position.set(pos.x, -2, pos.z);
            scene.add(wallMesh);
            objects.push(wallMesh);
        }
    }

    function buildPartialVehicles() {
        var vehiclePositions = [
            { x: 45, z: -20 },
            { x: -65, z: -50 },
            { x: 75, z: 60 }
        ];

        for (var i = 0; i < vehiclePositions.length; i++) {
            var pos = vehiclePositions[i];
            var chassisGeometry = new THREE.BoxGeometry(12, 4, 18);
            var chassisMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
            chassisMesh.position.set(pos.x, -1, pos.z);
            scene.add(chassisMesh);
            objects.push(chassisMesh);

            var roofGeometry = new THREE.BoxGeometry(12, 2, 18);
            var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x555544 });
            var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
            roofMesh.position.set(pos.x, 3, pos.z);
            scene.add(roofMesh);
            objects.push(roofMesh);

            for (var j = 0; j < 2; j++) {
                var windowGeometry = new THREE.BoxGeometry(2, 2, 1);
                var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
                var windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(pos.x - 4 + j * 8, 2, pos.z + 8);
                scene.add(windowMesh);
                objects.push(windowMesh);
            }
        }
    }

    function buildVolcanicVents() {
        var ventPositions = [
            { x: -90, z: -90 },
            { x: 85, z: -80 },
            { x: -75, z: 85 }
        ];

        for (var i = 0; i < ventPositions.length; i++) {
            var pos = ventPositions[i];
            var ventGeometry = new THREE.CylinderGeometry(6, 8, 2, 8);
            var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x444433 });
            var ventMesh = new THREE.Mesh(ventGeometry, ventMaterial);
            ventMesh.position.set(pos.x, 0.5, pos.z);
            scene.add(ventMesh);
            objects.push(ventMesh);

            for (var j = 0; j < 4; j++) {
                var steamGeometry = new THREE.SphereGeometry(3, 6, 6);
                var steamMaterial = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
                var steamMesh = new THREE.Mesh(steamGeometry, steamMaterial);
                steamMesh.position.set(pos.x, 8 + j * 2, pos.z);
                scene.add(steamMesh);
                objects.push(steamMesh);
                steamSpheres.push({
                    mesh: steamMesh,
                    baseY: 8 + j * 2,
                    baseX: pos.x,
                    baseZ: pos.z,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    function buildSurvivorCamp() {
        var campCenterX = 0;
        var campCenterZ = 0;

        for (var t = 0; t < 3; t++) {
            var tentX = campCenterX - 15 + t * 15;
            var tentZ = campCenterZ;
            var leftSideGeometry = new THREE.BoxGeometry(8, 10, 12);
            var leftSideMaterial = new THREE.MeshLambertMaterial({ color: 0xccbb99 });
            var leftSideMesh = new THREE.Mesh(leftSideGeometry, leftSideMaterial);
            leftSideMesh.position.set(tentX - 4, 5, tentZ);
            leftSideMesh.rotation.z = 0.4;
            scene.add(leftSideMesh);
            objects.push(leftSideMesh);

            var rightSideGeometry = new THREE.BoxGeometry(8, 10, 12);
            var rightSideMaterial = new THREE.MeshLambertMaterial({ color: 0xccbb99 });
            var rightSideMesh = new THREE.Mesh(rightSideGeometry, rightSideMaterial);
            rightSideMesh.position.set(tentX + 4, 5, tentZ);
            rightSideMesh.rotation.z = -0.4;
            scene.add(rightSideMesh);
            objects.push(rightSideMesh);
        }

        for (var b = 0; b < 5; b++) {
            var barrelX = campCenterX - 20 + b * 10;
            var barrelGeometry = new THREE.CylinderGeometry(2, 2, 5, 8);
            var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x555544 });
            var barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrelMesh.position.set(barrelX, 2.5, campCenterZ - 8);
            scene.add(barrelMesh);
            objects.push(barrelMesh);

            var fireGeometry = new THREE.SphereGeometry(2, 6, 6);
            var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xff8800 });
            var fireMesh = new THREE.Mesh(fireGeometry, fireMaterial);
            fireMesh.position.set(barrelX, 6, campCenterZ - 8);
            scene.add(fireMesh);
            objects.push(fireMesh);
        }

        var storageGeometry = new THREE.BoxGeometry(20, 5, 10);
        var storageMaterial = new THREE.MeshLambertMaterial({ color: 0x777755 });
        var storageMesh = new THREE.Mesh(storageGeometry, storageMaterial);
        storageMesh.position.set(campCenterX, 2.5, campCenterZ + 15);
        scene.add(storageMesh);
        objects.push(storageMesh);
    }

    function buildMilitaryPost() {
        var postX = -50;
        var postZ = 50;

        var buildingGeometry = new THREE.BoxGeometry(25, 12, 20);
        var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
        buildingMesh.position.set(postX, 6, postZ);
        scene.add(buildingMesh);
        objects.push(buildingMesh);

        var towerGeometry = new THREE.CylinderGeometry(4, 5, 20, 8);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
        towerMesh.position.set(postX + 12, 10, postZ);
        scene.add(towerMesh);
        objects.push(towerMesh);

        var platformGeometry = new THREE.BoxGeometry(10, 1, 10);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
        platformMesh.position.set(postX + 12, 21, postZ);
        scene.add(platformMesh);
        objects.push(platformMesh);

        for (var w = 0; w < 4; w++) {
            var wx = postX - 10 + w * 6;
            var windowGeometry = new THREE.BoxGeometry(3, 3, 1);
            var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
            var windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
            windowMesh.position.set(wx, 8, postZ - 9.5);
            scene.add(windowMesh);
            objects.push(windowMesh);
        }
    }

    function buildAshTrees() {
        var treePositions = [
            { x: -100, z: 20 },
            { x: 90, z: -40 },
            { x: 40, z: 80 },
            { x: -70, z: -70 }
        ];

        for (var i = 0; i < treePositions.length; i++) {
            var pos = treePositions[i];
            var trunkGeometry = new THREE.CylinderGeometry(2, 3, 20, 8);
            var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x444433 });
            var trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunkMesh.position.set(pos.x, 10, pos.z);
            scene.add(trunkMesh);
            objects.push(trunkMesh);

            for (var j = 0; j < 6; j++) {
                var coatingGeometry = new THREE.SphereGeometry(3, 6, 6);
                var coatingMaterial = new THREE.MeshLambertMaterial({ color: 0xccccbb });
                var coatingMesh = new THREE.Mesh(coatingGeometry, coatingMaterial);
                var angle = (j / 6) * Math.PI * 2;
                coatingMesh.position.set(
                    pos.x + Math.cos(angle) * 4,
                    5 + j * 2,
                    pos.z + Math.sin(angle) * 4
                );
                scene.add(coatingMesh);
                objects.push(coatingMesh);
            }
        }
    }

    function buildCollapsedChurch() {
        var churchX = 50;
        var churchZ = -80;

        var spireGeometry = new THREE.BoxGeometry(4, 30, 4);
        var spireMaterial = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var spireMesh = new THREE.Mesh(spireGeometry, spireMaterial);
        spireMesh.position.set(churchX, 10, churchZ);
        spireMesh.rotation.z = 0.5;
        scene.add(spireMesh);
        objects.push(spireMesh);

        var baseGeometry = new THREE.BoxGeometry(20, 2, 20);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.set(churchX, 0.5, churchZ);
        scene.add(baseMesh);
        objects.push(baseMesh);

        var ruinsGeometry = new THREE.BoxGeometry(18, 8, 18);
        var ruinsMaterial = new THREE.MeshLambertMaterial({ color: 0x777766 });
        var ruinsMesh = new THREE.Mesh(ruinsGeometry, ruinsMaterial);
        ruinsMesh.position.set(churchX, 2, churchZ);
        scene.add(ruinsMesh);
        objects.push(ruinsMesh);
    }

    function buildRoadMarkers() {
        var markerPositions = [
            { x: -40, z: -60 },
            { x: 0, z: -40 },
            { x: 40, z: -20 },
            { x: 60, z: 0 },
            { x: 50, z: 40 }
        ];

        for (var i = 0; i < markerPositions.length; i++) {
            var pos = markerPositions[i];
            var poleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 6);
            var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
            poleMesh.position.set(pos.x, 2, pos.z);
            scene.add(poleMesh);
            objects.push(poleMesh);

            var ashCoverGeometry = new THREE.SphereGeometry(2.5, 6, 6);
            var ashCoverMaterial = new THREE.MeshLambertMaterial({ color: 0xccccbb });
            var ashCoverMesh = new THREE.Mesh(ashCoverGeometry, ashCoverMaterial);
            ashCoverMesh.position.set(pos.x, 0.5, pos.z);
            scene.add(ashCoverMesh);
            objects.push(ashCoverMesh);
        }
    }

    function buildSupplyDrop() {
        var dropX = 0;
        var dropZ = -50;

        for (var c = 0; c < 4; c++) {
            var cx = dropX - 4 + (c % 2) * 8;
            var cz = dropZ - 4 + Math.floor(c / 2) * 8;
            var crateGeometry = new THREE.BoxGeometry(6, 6, 6);
            var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x888866 });
            var crateMesh = new THREE.Mesh(crateGeometry, crateMaterial);
            crateMesh.position.set(cx, 3, cz);
            scene.add(crateMesh);
            objects.push(crateMesh);
        }

        var parachuteGeometry = new THREE.ConeGeometry(8, 2, 8);
        var parachuteMaterial = new THREE.MeshLambertMaterial({ color: 0xffccaa });
        var parachuteMesh = new THREE.Mesh(parachuteGeometry, parachuteMaterial);
        parachuteMesh.position.set(dropX, 20, dropZ);
        scene.add(parachuteMesh);
        objects.push(parachuteMesh);
    }

    function buildRubblePiles() {
        var rubblePositions = [
            { x: -35, z: 35 },
            { x: 25, z: 25 },
            { x: -55, z: -25 },
            { x: 75, z: 45 },
            { x: 15, z: -85 }
        ];

        for (var i = 0; i < rubblePositions.length; i++) {
            var pos = rubblePositions[i];
            for (var j = 0; j < 5; j++) {
                var rx = pos.x - 6 + Math.random() * 12;
                var ry = 0.5 + j * 1.5;
                var rz = pos.z - 6 + Math.random() * 12;
                var rockGeometry = new THREE.BoxGeometry(3, 2, 3);
                var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x777766 });
                var rockMesh = new THREE.Mesh(rockGeometry, rockMaterial);
                rockMesh.position.set(rx, ry, rz);
                rockMesh.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3);
                scene.add(rockMesh);
                objects.push(rockMesh);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xccccbb, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(40, 60, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var ventGlow1 = new THREE.PointLight(0xff8800, 0.5, 50);
        ventGlow1.position.set(-90, 8, -90);
        scene.add(ventGlow1);
        lights.push(ventGlow1);

        var ventGlow2 = new THREE.PointLight(0xff8800, 0.5, 50);
        ventGlow2.position.set(85, 8, -80);
        scene.add(ventGlow2);
        lights.push(ventGlow2);

        var ventGlow3 = new THREE.PointLight(0xff8800, 0.5, 50);
        ventGlow3.position.set(-75, 8, 85);
        scene.add(ventGlow3);
        lights.push(ventGlow3);
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < steamSpheres.length; i++) {
            var steam = steamSpheres[i];
            var bob = Math.sin(time + steam.phase) * 2;
            steam.mesh.position.y = steam.baseY + bob;
            steam.mesh.position.x = steam.baseX + Math.cos(time * 0.5 + steam.phase) * 0.5;
            steam.mesh.position.z = steam.baseZ + Math.sin(time * 0.5 + steam.phase) * 0.5;
        }

        for (var j = 0; j < ashParticles.length; j++) {
            var particle = ashParticles[j];
            particle.mesh.position.y -= 5 * delta;
            if (particle.mesh.position.y < -10) {
                particle.mesh.position.y = 50 + Math.random() * 20;
                particle.mesh.position.x = (Math.random() - 0.5) * 200;
                particle.mesh.position.z = (Math.random() - 0.5) * 200;
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
        steamSpheres = [];
        ashParticles = [];
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
