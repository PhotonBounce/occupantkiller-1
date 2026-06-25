window.GunWharf = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var patrolBoats = [];
    var boatTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        patrolBoats = [];
        boatTime = 0;
        buildWaterSurface();
        buildDockPiers();
        buildGunEmplacements();
        buildAmmunitionStorage();
        buildNavalGuns();
        buildPatrolVessels();
        buildFortWalls();
        buildSupplyDepot();
        buildCraneSystem();
        buildShellStorage();
        buildGuardShack();
        buildAntiAircraftGuns();
        buildFloodlights();
        setupLighting();
    }

    function buildWaterSurface() {
        var waterGeom = new THREE.BoxGeometry(400, 2, 300);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
        var waterMesh = new THREE.Mesh(waterGeom, waterMat);
        waterMesh.position.set(0, -25, 80);
        waterMesh.castShadow = true;
        waterMesh.receiveShadow = true;
        scene.add(waterMesh);
        objects.push(waterMesh);
    }

    function buildDockPiers() {
        for (var p = 0; p < 3; p++) {
            var pierX = -80 + p * 80;
            var pierGeom = new THREE.BoxGeometry(15, 3, 120);
            var pierMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var pierMesh = new THREE.Mesh(pierGeom, pierMat);
            pierMesh.position.set(pierX, 0, 0);
            pierMesh.castShadow = true;
            pierMesh.receiveShadow = true;
            scene.add(pierMesh);
            objects.push(pierMesh);

            for (var i = 0; i < 8; i++) {
                var pilingGeom = new THREE.CylinderGeometry(1.5, 1.5, 30, 8);
                var pilingMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
                var pilingMesh = new THREE.Mesh(pilingGeom, pilingMat);
                pilingMesh.position.set(pierX - 6 + i * 2, -15, -40 + i * 15);
                pilingMesh.castShadow = true;
                pilingMesh.receiveShadow = true;
                scene.add(pilingMesh);
                objects.push(pilingMesh);
            }
        }
    }

    function buildGunEmplacements() {
        var emplacements = [
            { x: -60, z: -40 },
            { x: -60, z: 40 },
            { x: 60, z: -40 },
            { x: 60, z: 40 }
        ];

        for (var e = 0; e < emplacements.length; e++) {
            var emp = emplacements[e];
            var platformGeom = new THREE.BoxGeometry(20, 2, 20);
            var platformMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var platformMesh = new THREE.Mesh(platformGeom, platformMat);
            platformMesh.position.set(emp.x, 2, emp.z);
            platformMesh.castShadow = true;
            platformMesh.receiveShadow = true;
            scene.add(platformMesh);
            objects.push(platformMesh);

            var baseGeom = new THREE.CylinderGeometry(8, 10, 4, 16);
            var baseMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
            var baseMesh = new THREE.Mesh(baseGeom, baseMat);
            baseMesh.position.set(emp.x, 4, emp.z);
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            scene.add(baseMesh);
            objects.push(baseMesh);
        }
    }

    function buildNavalGuns() {
        var gunPositions = [
            { x: -60, z: -40, rotZ: 0.3 },
            { x: -60, z: 40, rotZ: -0.3 },
            { x: 60, z: -40, rotZ: 0.3 },
            { x: 60, z: 40, rotZ: -0.3 }
        ];

        for (var g = 0; g < gunPositions.length; g++) {
            var gunPos = gunPositions[g];
            var barrelGeom = new THREE.CylinderGeometry(1.2, 1.2, 35, 12);
            var barrelMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var barrelMesh = new THREE.Mesh(barrelGeom, barrelMat);
            barrelMesh.rotation.z = gunPos.rotZ;
            barrelMesh.position.set(gunPos.x, 15, gunPos.z);
            barrelMesh.castShadow = true;
            barrelMesh.receiveShadow = true;
            scene.add(barrelMesh);
            objects.push(barrelMesh);

            var breechGeom = new THREE.CylinderGeometry(2, 2, 5, 12);
            var breechMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var breechMesh = new THREE.Mesh(breechGeom, breechMat);
            breechMesh.position.set(gunPos.x, 7, gunPos.z);
            breechMesh.castShadow = true;
            breechMesh.receiveShadow = true;
            scene.add(breechMesh);
            objects.push(breechMesh);

            var mountGeom = new THREE.BoxGeometry(6, 3, 6);
            var mountMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var mountMesh = new THREE.Mesh(mountGeom, mountMat);
            mountMesh.position.set(gunPos.x, 4, gunPos.z);
            mountMesh.castShadow = true;
            mountMesh.receiveShadow = true;
            scene.add(mountMesh);
            objects.push(mountMesh);
        }
    }

    function buildAmmunitionStorage() {
        var hoistGeom = new THREE.BoxGeometry(8, 25, 8);
        var hoistMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        var hoistMesh = new THREE.Mesh(hoistGeom, hoistMat);
        hoistMesh.position.set(-40, 12, -60);
        hoistMesh.castShadow = true;
        hoistMesh.receiveShadow = true;
        scene.add(hoistMesh);
        objects.push(hoistMesh);

        for (var h = 0; h < 3; h++) {
            var ammoBoxGeom = new THREE.BoxGeometry(6, 6, 6);
            var ammoBoxMat = new THREE.MeshLambertMaterial({ color: 0x8a8a3a });
            var ammoBoxMesh = new THREE.Mesh(ammoBoxGeom, ammoBoxMat);
            ammoBoxMesh.position.set(-40 + h * 10, 2 + h * 8, -60);
            ammoBoxMesh.castShadow = true;
            ammoBoxMesh.receiveShadow = true;
            scene.add(ammoBoxMesh);
            objects.push(ammoBoxMesh);
        }

        var magazineGeom = new THREE.BoxGeometry(40, 15, 50);
        var magazineMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var magazineMesh = new THREE.Mesh(magazineGeom, magazineMat);
        magazineMesh.position.set(0, -10, 0);
        magazineMesh.castShadow = true;
        magazineMesh.receiveShadow = true;
        scene.add(magazineMesh);
        objects.push(magazineMesh);

        var reinforcementGeom = new THREE.BoxGeometry(42, 17, 52);
        var reinforcementMat = new THREE.MeshLambertMaterial({ color: 0x5a5a3a });
        var reinforcementMesh = new THREE.Mesh(reinforcementGeom, reinforcementMat);
        reinforcementMesh.position.set(0, -11, 0);
        reinforcementMesh.scale.set(1.05, 1.05, 1.05);
        scene.add(reinforcementMesh);
        objects.push(reinforcementMesh);
    }

    function buildPatrolVessels() {
        var vesselPositions = [
            { x: -100, z: 60 },
            { x: 100, z: -80 }
        ];

        for (var v = 0; v < vesselPositions.length; v++) {
            var vesselPos = vesselPositions[v];
            var hullGeom = new THREE.BoxGeometry(12, 5, 25);
            var hullMat = new THREE.MeshLambertMaterial({ color: 0x1a3a1a });
            var hullMesh = new THREE.Mesh(hullGeom, hullMat);
            hullMesh.position.set(vesselPos.x, -5, vesselPos.z);
            hullMesh.castShadow = true;
            hullMesh.receiveShadow = true;
            scene.add(hullMesh);
            objects.push(hullMesh);
            patrolBoats.push(hullMesh);

            var superGeom = new THREE.BoxGeometry(8, 6, 8);
            var superMat = new THREE.MeshLambertMaterial({ color: 0x2a4a2a });
            var superMesh = new THREE.Mesh(superGeom, superMat);
            superMesh.position.set(vesselPos.x, 3, vesselPos.z - 5);
            superMesh.castShadow = true;
            superMesh.receiveShadow = true;
            scene.add(superMesh);
            objects.push(superMesh);

            var gunMountGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
            var gunMountMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var gunMountMesh = new THREE.Mesh(gunMountGeom, gunMountMat);
            gunMountMesh.position.set(vesselPos.x, 9, vesselPos.z);
            gunMountMesh.castShadow = true;
            gunMountMesh.receiveShadow = true;
            scene.add(gunMountMesh);
            objects.push(gunMountMesh);

            var radarGeom = new THREE.CylinderGeometry(2, 1.5, 3, 8);
            var radarMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
            var radarMesh = new THREE.Mesh(radarGeom, radarMat);
            radarMesh.position.set(vesselPos.x, 11, vesselPos.z - 2);
            radarMesh.castShadow = true;
            radarMesh.receiveShadow = true;
            scene.add(radarMesh);
            objects.push(radarMesh);
        }
    }

    function buildFortWalls() {
        var wallSegments = [
            { x: -80, z: -80 },
            { x: -80, z: 80 },
            { x: 80, z: -80 },
            { x: 80, z: 80 }
        ];

        for (var w = 0; w < wallSegments.length; w++) {
            var wall = wallSegments[w];
            var wallGeom = new THREE.BoxGeometry(30, 12, 4);
            var wallMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var wallMesh = new THREE.Mesh(wallGeom, wallMat);
            wallMesh.position.set(wall.x, 6, wall.z);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            scene.add(wallMesh);
            objects.push(wallMesh);

            var buttressGeom = new THREE.BoxGeometry(4, 10, 8);
            var buttressMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var buttressMesh = new THREE.Mesh(buttressGeom, buttressMat);
            buttressMesh.position.set(wall.x - 10, 5, wall.z);
            buttressMesh.castShadow = true;
            buttressMesh.receiveShadow = true;
            scene.add(buttressMesh);
            objects.push(buttressMesh);

            var buttress2Mesh = new THREE.Mesh(buttressGeom, buttressMat);
            buttress2Mesh.position.set(wall.x + 10, 5, wall.z);
            buttress2Mesh.castShadow = true;
            buttress2Mesh.receiveShadow = true;
            scene.add(buttress2Mesh);
            objects.push(buttress2Mesh);
        }

        var connectWall1Geom = new THREE.BoxGeometry(150, 10, 4);
        var connectWallMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var connectWall1Mesh = new THREE.Mesh(connectWall1Geom, connectWallMat);
        connectWall1Mesh.position.set(0, 5, -80);
        connectWall1Mesh.castShadow = true;
        connectWall1Mesh.receiveShadow = true;
        scene.add(connectWall1Mesh);
        objects.push(connectWall1Mesh);

        var connectWall2Mesh = new THREE.Mesh(connectWall1Geom, connectWallMat);
        connectWall2Mesh.position.set(0, 5, 80);
        connectWall2Mesh.castShadow = true;
        connectWall2Mesh.receiveShadow = true;
        scene.add(connectWall2Mesh);
        objects.push(connectWall2Mesh);
    }

    function buildSupplyDepot() {
        var depotGeom = new THREE.BoxGeometry(35, 10, 25);
        var depotMat = new THREE.MeshLambertMaterial({ color: 0x4a5a4a });
        var depotMesh = new THREE.Mesh(depotGeom, depotMat);
        depotMesh.position.set(40, 5, 60);
        depotMesh.castShadow = true;
        depotMesh.receiveShadow = true;
        scene.add(depotMesh);
        objects.push(depotMesh);

        for (var d = 0; d < 4; d++) {
            var crateGeom = new THREE.BoxGeometry(4, 4, 4);
            var crateMat = new THREE.MeshLambertMaterial({ color: 0x6a5a2a });
            var crateMesh = new THREE.Mesh(crateGeom, crateMat);
            crateMesh.position.set(30 + d * 8, 2 + d * 2, 60);
            crateMesh.castShadow = true;
            crateMesh.receiveShadow = true;
            scene.add(crateMesh);
            objects.push(crateMesh);
        }

        var roofGeom = new THREE.BoxGeometry(35, 1, 25);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x3a4a3a });
        var roofMesh = new THREE.Mesh(roofGeom, roofMat);
        roofMesh.position.set(40, 10, 60);
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        scene.add(roofMesh);
        objects.push(roofMesh);
    }

    function buildCraneSystem() {
        var boomGeom = new THREE.BoxGeometry(6, 4, 45);
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x6a6a2a });
        var boomMesh = new THREE.Mesh(boomGeom, boomMat);
        boomMesh.rotation.z = 0.15;
        boomMesh.position.set(-80, 25, -40);
        boomMesh.castShadow = true;
        boomMesh.receiveShadow = true;
        scene.add(boomMesh);
        objects.push(boomMesh);

        var cabinGeom = new THREE.BoxGeometry(10, 8, 10);
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0x5a5a3a });
        var cabinMesh = new THREE.Mesh(cabinGeom, cabinMat);
        cabinMesh.position.set(-80, 16, -40);
        cabinMesh.castShadow = true;
        cabinMesh.receiveShadow = true;
        scene.add(cabinMesh);
        objects.push(cabinMesh);

        var towerGeom = new THREE.CylinderGeometry(3, 3, 20, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var towerMesh = new THREE.Mesh(towerGeom, towerMat);
        towerMesh.position.set(-80, 10, -40);
        towerMesh.castShadow = true;
        towerMesh.receiveShadow = true;
        scene.add(towerMesh);
        objects.push(towerMesh);

        var hookGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var hookMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var hookMesh = new THREE.Mesh(hookGeom, hookMat);
        hookMesh.position.set(-55, 35, -10);
        hookMesh.castShadow = true;
        hookMesh.receiveShadow = true;
        scene.add(hookMesh);
        objects.push(hookMesh);
    }

    function buildShellStorage() {
        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 5; col++) {
                var shellGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
                var shellMat = new THREE.MeshLambertMaterial({ color: 0x7a7a2a });
                var shellMesh = new THREE.Mesh(shellGeom, shellMat);
                shellMesh.position.set(50 + col * 4, 2 + row * 4, 20);
                shellMesh.castShadow = true;
                shellMesh.receiveShadow = true;
                scene.add(shellMesh);
                objects.push(shellMesh);
            }
        }

        for (var layer = 0; layer < 3; layer++) {
            var storageGeom = new THREE.BoxGeometry(25, 4, 12);
            var storageMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
            var storageMesh = new THREE.Mesh(storageGeom, storageMat);
            storageMesh.position.set(65, 3 + layer * 5, 35);
            storageMesh.castShadow = true;
            storageMesh.receiveShadow = true;
            scene.add(storageMesh);
            objects.push(storageMesh);
        }
    }

    function buildGuardShack() {
        var shackGeom = new THREE.BoxGeometry(12, 8, 10);
        var shackMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
        var shackMesh = new THREE.Mesh(shackGeom, shackMat);
        shackMesh.position.set(-120, 4, 0);
        shackMesh.castShadow = true;
        shackMesh.receiveShadow = true;
        scene.add(shackMesh);
        objects.push(shackMesh);

        var roofShackGeom = new THREE.BoxGeometry(12, 1, 10);
        var roofShackMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var roofShackMesh = new THREE.Mesh(roofShackGeom, roofShackMat);
        roofShackMesh.position.set(-120, 8, 0);
        roofShackMesh.castShadow = true;
        roofShackMesh.receiveShadow = true;
        scene.add(roofShackMesh);
        objects.push(roofShackMesh);

        var doorGeom = new THREE.BoxGeometry(2, 5, 0.5);
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var doorMesh = new THREE.Mesh(doorGeom, doorMat);
        doorMesh.position.set(-126, 2.5, 5);
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;
        scene.add(doorMesh);
        objects.push(doorMesh);

        var windowGeom = new THREE.BoxGeometry(2, 2, 0.5);
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a3a });
        var windowMesh = new THREE.Mesh(windowGeom, windowMat);
        windowMesh.position.set(-114, 4, 5);
        windowMesh.castShadow = true;
        windowMesh.receiveShadow = true;
        scene.add(windowMesh);
        objects.push(windowMesh);
    }

    function buildAntiAircraftGuns() {
        var aaPositions = [
            { x: -100, z: -60 },
            { x: 100, z: 60 },
            { x: -40, z: -120 },
            { x: 40, z: 120 }
        ];

        for (var aa = 0; aa < aaPositions.length; aa++) {
            var aaPos = aaPositions[aa];
            var aaMountGeom = new THREE.BoxGeometry(8, 2, 8);
            var aaMountMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var aaMountMesh = new THREE.Mesh(aaMountGeom, aaMountMat);
            aaMountMesh.position.set(aaPos.x, 1, aaPos.z);
            aaMountMesh.castShadow = true;
            aaMountMesh.receiveShadow = true;
            scene.add(aaMountMesh);
            objects.push(aaMountMesh);

            var aaBarrelGeom = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
            var aaBarrelMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var aaBarrelMesh = new THREE.Mesh(aaBarrelGeom, aaBarrelMat);
            aaBarrelMesh.rotation.z = 0.7;
            aaBarrelMesh.position.set(aaPos.x, 8, aaPos.z);
            aaBarrelMesh.castShadow = true;
            aaBarrelMesh.receiveShadow = true;
            scene.add(aaBarrelMesh);
            objects.push(aaBarrelMesh);

            var aaShieldGeom = new THREE.BoxGeometry(6, 6, 3);
            var aaShieldMat = new THREE.MeshLambertMaterial({ color: 0x6a6a4a });
            var aaShieldMesh = new THREE.Mesh(aaShieldGeom, aaShieldMat);
            aaShieldMesh.position.set(aaPos.x, 5, aaPos.z + 2);
            aaShieldMesh.castShadow = true;
            aaShieldMesh.receiveShadow = true;
            scene.add(aaShieldMesh);
            objects.push(aaShieldMesh);
        }
    }

    function buildFloodlights() {
        var floodPositions = [
            { x: -120, z: -100 },
            { x: 120, z: 100 },
            { x: -120, z: 100 },
            { x: 120, z: -100 }
        ];

        for (var f = 0; f < floodPositions.length; f++) {
            var floodPos = floodPositions[f];
            var poleGeom = new THREE.CylinderGeometry(0.8, 0.8, 30, 8);
            var poleMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var poleMesh = new THREE.Mesh(poleGeom, poleMat);
            poleMesh.position.set(floodPos.x, 15, floodPos.z);
            poleMesh.castShadow = true;
            poleMesh.receiveShadow = true;
            scene.add(poleMesh);
            objects.push(poleMesh);

            var housingGeom = new THREE.BoxGeometry(3, 2, 4);
            var housingMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
            var housingMesh = new THREE.Mesh(housingGeom, housingMat);
            housingMesh.position.set(floodPos.x, 30, floodPos.z);
            housingMesh.castShadow = true;
            housingMesh.receiveShadow = true;
            scene.add(housingMesh);
            objects.push(housingMesh);

            var lensGeom = new THREE.SphereGeometry(1.5, 8, 8);
            var lensMat = new THREE.MeshLambertMaterial({ color: 0xffff8a });
            var lensMesh = new THREE.Mesh(lensGeom, lensMat);
            lensMesh.position.set(floodPos.x, 30, floodPos.z + 3);
            scene.add(lensMesh);
            objects.push(lensMesh);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xffff8a, 0.4, 150);
        pointLight1.position.set(-120, 30, 0);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xffff8a, 0.4, 150);
        pointLight2.position.set(120, 30, 0);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var hemispherLight = new THREE.HemisphereLight(0x87ceeb, 0x4a4a4a, 0.4);
        scene.add(hemispherLight);
        lights.push(hemispherLight);
    }

    function update(delta) {
        boatTime += delta;
        for (var b = 0; b < patrolBoats.length; b++) {
            var boat = patrolBoats[b];
            boat.position.y = -5 + Math.sin(boatTime * 1.5) * 0.8;
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
        patrolBoats = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
