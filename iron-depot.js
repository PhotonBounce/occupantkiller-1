window.IronDepot = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var craneHookY = 0;
    var craneSwingAngle = 0;
    var warningLightRotation = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        craneHookY = 0;
        craneSwingAngle = 0;
        warningLightRotation = 0;

        buildDepotYard();
        buildWarehouses();
        buildCranes();
        buildRailyard();
        buildDefenses();
        buildFuelStorage();
        buildAdminBlock();
        buildPerimeterWall();
        buildGateCheckpoint();
        setupLighting();
    }

    function update(delta) {
        craneSwingAngle += delta * 0.3;
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].userData && objects[i].userData.type === 'craneHook') {
                    objects[i].position.x = Math.sin(craneSwingAngle) * 8;
                    objects[i].position.y = 18 + Math.cos(craneSwingAngle * 0.5) * 2;
                }
                if (objects[i].userData && objects[i].userData.type === 'warningLight') {
                    warningLightRotation += delta * 8;
                    if (objects[i].material) {
                        objects[i].material.emissive.setHex(Math.sin(warningLightRotation) > 0 ? 0xff4400 : 0x880000);
                    }
                }
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
        scene = null;
        camera = null;
    }

    function buildDepotYard() {
        var groundGeometry = new THREE.BoxGeometry(200, 1, 150);
        var groundMaterial = new THREE.MeshLambertMaterial({color: 0x444444});
        var ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = -0.5;
        ground.userData = {type: 'ground'};
        scene.add(ground);
        objects.push(ground);

        var railColor = 0x1a1a1a;
        var railMaterial = new THREE.MeshLambertMaterial({color: railColor});

        for (var i = 0; i < 5; i++) {
            var railX = -40 + i * 20;
            var railGeometry = new THREE.BoxGeometry(200, 0.5, 2);
            var rail = new THREE.Mesh(railGeometry, railMaterial);
            rail.position.set(railX, 0.25, 0);
            scene.add(rail);
            objects.push(rail);
        }

        var boundaryMaterial = new THREE.MeshLambertMaterial({color: 0xffff00});
        var boundaryGeometry = new THREE.BoxGeometry(200, 0.3, 1);
        var boundaryNorth = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        boundaryNorth.position.set(0, 0.15, 75);
        scene.add(boundaryNorth);
        objects.push(boundaryNorth);

        var boundarySouth = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        boundarySouth.position.set(0, 0.15, -75);
        scene.add(boundarySouth);
        objects.push(boundarySouth);

        var boundaryGeometry2 = new THREE.BoxGeometry(1, 0.3, 150);
        var boundaryEast = new THREE.Mesh(boundaryGeometry2, boundaryMaterial);
        boundaryEast.position.set(100, 0.15, 0);
        scene.add(boundaryEast);
        objects.push(boundaryEast);

        var boundaryWest = new THREE.Mesh(boundaryGeometry2, boundaryMaterial);
        boundaryWest.position.set(-100, 0.15, 0);
        scene.add(boundaryWest);
        objects.push(boundaryWest);
    }

    function buildWarehouses() {
        var warehouseColor = 0x666666;
        var warehouseMaterial = new THREE.MeshLambertMaterial({color: warehouseColor});
        var roofMaterial = new THREE.MeshLambertMaterial({color: 0x8b4513});

        for (var w = 0; w < 3; w++) {
            var warehouseX = -50 + w * 50;
            var warehouseZ = -40;

            var wallGeometry = new THREE.BoxGeometry(40, 15, 30);
            var warehouse = new THREE.Mesh(wallGeometry, warehouseMaterial);
            warehouse.position.set(warehouseX, 7.5, warehouseZ);
            scene.add(warehouse);
            objects.push(warehouse);

            var roofGeometry = new THREE.BoxGeometry(42, 2, 32);
            var roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(warehouseX, 16, warehouseZ);
            scene.add(roof);
            objects.push(roof);

            var doorGeometry = new THREE.BoxGeometry(8, 12, 1.5);
            var doorMaterial = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
            var door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(warehouseX - 10, 6, warehouseZ + 15.5);
            scene.add(door);
            objects.push(door);

            var door2 = new THREE.Mesh(doorGeometry, doorMaterial);
            door2.position.set(warehouseX + 10, 6, warehouseZ + 15.5);
            scene.add(door2);
            objects.push(door2);

            for (var d = 0; d < 4; d++) {
                var windowGeometry = new THREE.BoxGeometry(3, 3, 1);
                var windowMaterial = new THREE.MeshLambertMaterial({color: 0x333333});
                var window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(warehouseX - 15 + d * 10, 12, warehouseZ + 15.2);
                scene.add(window);
                objects.push(window);
            }
        }
    }

    function buildCranes() {
        var craneX = 20;
        var craneZ = 30;
        var legMaterial = new THREE.MeshLambertMaterial({color: 0x444444});
        var beamMaterial = new THREE.MeshLambertMaterial({color: 0x555555});

        var legGeometry = new THREE.BoxGeometry(3, 20, 3);
        var legFL = new THREE.Mesh(legGeometry, legMaterial);
        legFL.position.set(craneX - 10, 10, craneZ - 10);
        scene.add(legFL);
        objects.push(legFL);

        var legFR = new THREE.Mesh(legGeometry, legMaterial);
        legFR.position.set(craneX + 10, 10, craneZ - 10);
        scene.add(legFR);
        objects.push(legFR);

        var legBL = new THREE.Mesh(legGeometry, legMaterial);
        legBL.position.set(craneX - 10, 10, craneZ + 10);
        scene.add(legBL);
        objects.push(legBL);

        var legBR = new THREE.Mesh(legGeometry, legMaterial);
        legBR.position.set(craneX + 10, 10, craneZ + 10);
        scene.add(legBR);
        objects.push(legBR);

        var beamGeometry = new THREE.BoxGeometry(25, 2, 3);
        var beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(craneX, 20.5, craneZ);
        scene.add(beam);
        objects.push(beam);

        var pullGeometry = new THREE.BoxGeometry(3, 25, 3);
        var pulley = new THREE.Mesh(pullGeometry, beamMaterial);
        pulley.position.set(craneX, 20.5, craneZ);
        scene.add(pulley);
        objects.push(pulley);

        var hookGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 16);
        var hookMaterial = new THREE.MeshLambertMaterial({color: 0xff8800});
        var hook = new THREE.Mesh(hookGeometry, hookMaterial);
        hook.position.set(craneX, 18, craneZ);
        hook.userData = {type: 'craneHook'};
        scene.add(hook);
        objects.push(hook);

        var cableGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        var cableMaterial = new THREE.MeshLambertMaterial({color: 0xcccccc});
        var cable = new THREE.Mesh(cableGeometry, cableMaterial);
        cable.position.set(craneX, 19, craneZ);
        scene.add(cable);
        objects.push(cable);
    }

    function buildRailyard() {
        var railCarMaterial = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
        var wheelMaterial = new THREE.MeshLambertMaterial({color: 0x222222});

        for (var r = 0; r < 4; r++) {
            var carZ = -50 + r * 15;

            var carGeometry = new THREE.BoxGeometry(35, 5, 8);
            var car = new THREE.Mesh(carGeometry, railCarMaterial);
            car.position.set(0, 2.5, carZ);
            scene.add(car);
            objects.push(car);

            for (var w = 0; w < 4; w++) {
                var wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
                var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(-15 + w * 10, 1, carZ - 5);
                scene.add(wheel);
                objects.push(wheel);
            }

            for (var b = 0; b < 2; b++) {
                var beamGeometry = new THREE.CylinderGeometry(2, 2, 30, 8);
                var beam = new THREE.Mesh(beamGeometry, new THREE.MeshLambertMaterial({color: 0x999999}));
                beam.rotation.z = Math.PI / 2;
                beam.position.set(0, 8, carZ);
                scene.add(beam);
                objects.push(beam);
            }
        }
    }

    function buildDefenses() {
        var aaGunZ = 60;
        var aaGunX = 70;

        var baseGeometry = new THREE.BoxGeometry(5, 3, 5);
        var baseMaterial = new THREE.MeshLambertMaterial({color: 0x666666});
        var base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(aaGunX, 1.5, aaGunZ);
        scene.add(base);
        objects.push(base);

        var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 15, 16);
        var barrelMaterial = new THREE.MeshLambertMaterial({color: 0x333333});
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.x = Math.PI / 6;
        barrel.position.set(aaGunX, 5, aaGunZ);
        scene.add(barrel);
        objects.push(barrel);

        var mountGeometry = new THREE.BoxGeometry(4, 2, 4);
        var mount = new THREE.Mesh(mountGeometry, baseMaterial);
        mount.position.set(aaGunX, 3, aaGunZ);
        scene.add(mount);
        objects.push(mount);

        var ammoBunkerX = -70;
        var ammoBunkerZ = 40;
        var bunkerGeometry = new THREE.BoxGeometry(20, 6, 15);
        var bunkerMaterial = new THREE.MeshLambertMaterial({color: 0x555555});
        var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
        bunker.position.set(ammoBunkerX, 3, ammoBunkerZ);
        scene.add(bunker);
        objects.push(bunker);

        var blastWallGeometry = new THREE.BoxGeometry(25, 4, 2);
        var wallMaterial = new THREE.MeshLambertMaterial({color: 0x444444});
        var blastWall = new THREE.Mesh(blastWallGeometry, wallMaterial);
        blastWall.position.set(ammoBunkerX, 2, ammoBunkerZ + 10);
        scene.add(blastWall);
        objects.push(blastWall);

        var ammoStackGeometry = new THREE.BoxGeometry(3, 3, 3);
        var ammoMaterial = new THREE.MeshLambertMaterial({color: 0xbb4400});
        for (var s = 0; s < 6; s++) {
            for (var t = 0; t < 3; t++) {
                var stack = new THREE.Mesh(ammoStackGeometry, ammoMaterial);
                stack.position.set(ammoBunkerX - 8 + s * 3, 1.5 + t * 3, ammoBunkerZ);
                scene.add(stack);
                objects.push(stack);
            }
        }
    }

    function buildFuelStorage() {
        var fuelAreaX = 50;
        var fuelAreaZ = -50;

        var drumMaterial = new THREE.MeshLambertMaterial({color: 0xff6600});
        var drumGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);

        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 6; col++) {
                var drumX = fuelAreaX - 12 + col * 4;
                var drumZ = fuelAreaZ - 8 + row * 4;
                var drum = new THREE.Mesh(drumGeometry, drumMaterial);
                drum.position.set(drumX, 2, drumZ);
                scene.add(drum);
                objects.push(drum);

                var lidGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
                var lidMaterial = new THREE.MeshLambertMaterial({color: 0xdd5500});
                var lid = new THREE.Mesh(lidGeometry, lidMaterial);
                lid.position.set(drumX, 4.25, drumZ);
                scene.add(lid);
                objects.push(lid);
            }
        }

        var shelterGeometry = new THREE.BoxGeometry(28, 8, 20);
        var shelterMaterial = new THREE.MeshLambertMaterial({color: 0x888888});
        var shelter = new THREE.Mesh(shelterGeometry, shelterMaterial);
        shelter.position.set(fuelAreaX, 4, fuelAreaZ);
        scene.add(shelter);
        objects.push(shelter);

        var supportGeometry = new THREE.BoxGeometry(2, 8, 2);
        var supportMaterial = new THREE.MeshLambertMaterial({color: 0x555555});
        var supports = [
            [-12, -8], [12, -8], [-12, 8], [12, 8]
        ];
        for (var sup = 0; sup < supports.length; sup++) {
            var support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(fuelAreaX + supports[sup][0], 4, fuelAreaZ + supports[sup][1]);
            scene.add(support);
            objects.push(support);
        }
    }

    function buildAdminBlock() {
        var adminX = -80;
        var adminZ = -60;

        var buildingGeometry = new THREE.BoxGeometry(20, 12, 18);
        var buildingMaterial = new THREE.MeshLambertMaterial({color: 0x888888});
        var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(adminX, 6, adminZ);
        scene.add(building);
        objects.push(building);

        var roofGeometry = new THREE.BoxGeometry(22, 2, 20);
        var roofMaterial = new THREE.MeshLambertMaterial({color: 0x333333});
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(adminX, 13, adminZ);
        scene.add(roof);
        objects.push(roof);

        var windowMaterial = new THREE.MeshLambertMaterial({color: 0x4444ff});
        var windowGeometry = new THREE.BoxGeometry(3, 3, 1);

        for (var floor = 0; floor < 2; floor++) {
            for (var win = 0; win < 3; win++) {
                var windowZ = adminZ - 8;
                var windowY = 3 + floor * 5;
                var windowX = adminX - 6 + win * 6;
                var window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(windowX, windowY, windowZ);
                scene.add(window);
                objects.push(window);
            }
        }

        var doorGeometry = new THREE.BoxGeometry(4, 8, 1);
        var doorMaterial = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
        var door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(adminX, 4, adminZ + 9);
        scene.add(door);
        objects.push(door);

        var chimney1Geometry = new THREE.CylinderGeometry(1, 1, 4, 8);
        var chimneySmokeColor = new THREE.MeshLambertMaterial({color: 0x666666});
        var chimney1 = new THREE.Mesh(chimney1Geometry, chimneySmokeColor);
        chimney1.position.set(adminX - 5, 14, adminZ - 5);
        scene.add(chimney1);
        objects.push(chimney1);

        var chimney2 = new THREE.Mesh(chimney1Geometry, chimneySmokeColor);
        chimney2.position.set(adminX + 5, 14, adminZ - 5);
        scene.add(chimney2);
        objects.push(chimney2);
    }

    function buildPerimeterWall() {
        var wallMaterial = new THREE.MeshLambertMaterial({color: 0x999999});
        var wallHeight = 8;
        var wallThickness = 1.5;

        var northWallGeometry = new THREE.BoxGeometry(200, wallHeight, wallThickness);
        var northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
        northWall.position.set(0, wallHeight / 2, 76);
        scene.add(northWall);
        objects.push(northWall);

        var southWallGeometry = new THREE.BoxGeometry(200, wallHeight, wallThickness);
        var southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
        southWall.position.set(0, wallHeight / 2, -76);
        scene.add(southWall);
        objects.push(southWall);

        var eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 150);
        var eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(101, wallHeight / 2, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        var westWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        westWall.position.set(-101, wallHeight / 2, 0);
        scene.add(westWall);
        objects.push(westWall);

        var towerGeometry = new THREE.BoxGeometry(6, wallHeight + 4, 6);
        var towerMaterial = new THREE.MeshLambertMaterial({color: 0x777777});
        var towerPositions = [
            [-80, 76], [80, 76], [-80, -76], [80, -76],
            [-101, -50], [-101, 50], [101, -50], [101, 50]
        ];
        for (var t = 0; t < towerPositions.length; t++) {
            var tower = new THREE.Mesh(towerGeometry, towerMaterial);
            tower.position.set(towerPositions[t][0], wallHeight / 2 + 2, towerPositions[t][1]);
            scene.add(tower);
            objects.push(tower);
        }
    }

    function buildGateCheckpoint() {
        var gateX = 0;
        var gateZ = -80;

        var gatePillarGeometry = new THREE.BoxGeometry(2, 6, 2);
        var gatePillarMaterial = new THREE.MeshLambertMaterial({color: 0x666666});
        var pillarL = new THREE.Mesh(gatePillarGeometry, gatePillarMaterial);
        pillarL.position.set(gateX - 6, 3, gateZ);
        scene.add(pillarL);
        objects.push(pillarL);

        var pillarR = new THREE.Mesh(gatePillarGeometry, gatePillarMaterial);
        pillarR.position.set(gateX + 6, 3, gateZ);
        scene.add(pillarR);
        objects.push(pillarR);

        var armGeometry = new THREE.BoxGeometry(14, 1, 0.8);
        var armMaterial = new THREE.MeshLambertMaterial({color: 0xff0000});
        var arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.set(gateX, 5, gateZ);
        arm.userData = {type: 'gateArm'};
        scene.add(arm);
        objects.push(arm);

        var guardBoxGeometry = new THREE.BoxGeometry(4, 4, 4);
        var guardBoxMaterial = new THREE.MeshLambertMaterial({color: 0x888888});
        var guardBox = new THREE.Mesh(guardBoxGeometry, guardBoxMaterial);
        guardBox.position.set(gateX - 8, 2, gateZ - 6);
        scene.add(guardBox);
        objects.push(guardBox);

        var windowGeometry = new THREE.BoxGeometry(2, 2, 1);
        var windowMaterial = new THREE.MeshLambertMaterial({color: 0x333333});
        var window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(gateX - 8, 3, gateZ - 8);
        scene.add(window);
        objects.push(window);

        var roofGeometry = new THREE.BoxGeometry(5, 1, 5);
        var roofMaterial = new THREE.MeshLambertMaterial({color: 0x555555});
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(gateX - 8, 5, gateZ - 6);
        scene.add(roof);
        objects.push(roof);
    }

    function buildForklifts() {
        var forkLiftMaterial = new THREE.MeshLambertMaterial({color: 0xffff00});
        var mastMaterial = new THREE.MeshLambertMaterial({color: 0xcccccc});

        for (var f = 0; f < 3; f++) {
            var forkX = -30 + f * 30;
            var forkZ = 20;

            var bodyGeometry = new THREE.BoxGeometry(3, 3, 5);
            var body = new THREE.Mesh(bodyGeometry, forkLiftMaterial);
            body.position.set(forkX, 1.5, forkZ);
            scene.add(body);
            objects.push(body);

            var mastGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
            var mast = new THREE.Mesh(mastGeometry, mastMaterial);
            mast.position.set(forkX, 4, forkZ);
            scene.add(mast);
            objects.push(mast);

            var forkGeometry = new THREE.BoxGeometry(0.5, 0.5, 3);
            var forkMaterial = new THREE.MeshLambertMaterial({color: 0x444444});
            var forkL = new THREE.Mesh(forkGeometry, forkMaterial);
            forkL.position.set(forkX - 1.5, 1, forkZ + 2.5);
            scene.add(forkL);
            objects.push(forkL);

            var forkR = new THREE.Mesh(forkGeometry, forkMaterial);
            forkR.position.set(forkX + 1.5, 1, forkZ + 2.5);
            scene.add(forkR);
            objects.push(forkR);

            var seatGeometry = new THREE.SphereGeometry(0.8, 8, 8);
            var seatMaterial = new THREE.MeshLambertMaterial({color: 0x333333});
            var seat = new THREE.Mesh(seatGeometry, seatMaterial);
            seat.position.set(forkX, 3, forkZ - 1);
            scene.add(seat);
            objects.push(seat);
        }
    }

    function buildBeamStacks() {
        var beamMaterial = new THREE.MeshLambertMaterial({color: 0xaaaaaa});
        var stackPositions = [
            [40, -20], [50, -20], [60, -20],
            [40, 20], [50, 20], [60, 20]
        ];

        for (var sp = 0; sp < stackPositions.length; sp++) {
            var stackX = stackPositions[sp][0];
            var stackZ = stackPositions[sp][1];

            for (var layer = 0; layer < 4; layer++) {
                for (var beam = 0; beam < 3; beam++) {
                    var beamGeometry = new THREE.BoxGeometry(2, 1, 8);
                    var beamMesh = new THREE.Mesh(beamGeometry, beamMaterial);
                    beamMesh.position.set(stackX - 3 + beam * 3, 0.5 + layer * 1.5, stackZ);
                    scene.add(beamMesh);
                    objects.push(beamMesh);
                }
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(80, 60, 50);
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -120;
        dirLight.shadow.camera.right = 120;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        dirLight.castShadow = true;
        scene.add(dirLight);
        lights.push(dirLight);

        var pointLight1 = new THREE.PointLight(0xff8800, 1, 100);
        pointLight1.position.set(20, 12, 30);
        pointLight1.castShadow = true;
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xff4400, 0.8, 80);
        pointLight2.position.set(70, 20, 60);
        pointLight2.userData = {type: 'warningLight'};
        var warnMaterial = new THREE.MeshLambertMaterial({color: 0xff4400, emissive: 0xff4400});
        var warnGeometry = new THREE.SphereGeometry(2, 16, 16);
        var warnLight = new THREE.Mesh(warnGeometry, warnMaterial);
        warnLight.position.set(70, 20, 60);
        warnLight.userData = {type: 'warningLight'};
        scene.add(warnLight);
        objects.push(warnLight);

        var pointLight3 = new THREE.PointLight(0xffff00, 0.6, 60);
        pointLight3.position.set(-80, 15, -60);
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    buildForklifts();
    buildBeamStacks();

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
