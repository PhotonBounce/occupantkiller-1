window.RadarHill = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var radarSpeeds = [0.003, 0.005, 0.002];
    var radarRotations = [0, 0, 0];
    var antennaBlinkStates = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        antennaBlinkStates = [];
        buildHill();
        buildRadarDishes();
        buildAntennas();
        buildCommunicationTower();
        buildFacilityEntrance();
        buildBunkers();
        buildDefenses();
        buildFuelBuilding();
        buildPerimeterFence();
        buildCableRuns();
        setupLighting();
    }

    function buildHill() {
        var brownColor = 0x3d2817;
        var oliveColor = 0x556B2F;
        var materialBrown = new THREE.MeshLambertMaterial({ color: brownColor });
        var materialOlive = new THREE.MeshLambertMaterial({ color: oliveColor });

        var boxGeometry1 = new THREE.BoxGeometry(250, 40, 250);
        var hillBase = new THREE.Mesh(boxGeometry1, materialBrown);
        hillBase.position.set(0, 20, 0);
        hillBase.castShadow = true;
        hillBase.receiveShadow = true;
        scene.add(hillBase);
        objects.push(hillBase);

        var boxGeometry2 = new THREE.BoxGeometry(180, 35, 180);
        var hillMid = new THREE.Mesh(boxGeometry2, materialOlive);
        hillMid.position.set(0, 60, 0);
        hillMid.castShadow = true;
        hillMid.receiveShadow = true;
        scene.add(hillMid);
        objects.push(hillMid);

        var boxGeometry3 = new THREE.BoxGeometry(110, 30, 110);
        var hillTop = new THREE.Mesh(boxGeometry3, materialBrown);
        hillTop.position.set(0, 92, 0);
        hillTop.castShadow = true;
        hillTop.receiveShadow = true;
        scene.add(hillTop);
        objects.push(hillTop);

        var boxGeometry4 = new THREE.BoxGeometry(70, 25, 70);
        var hillPeak = new THREE.Mesh(boxGeometry4, materialOlive);
        hillPeak.position.set(0, 117, 0);
        hillPeak.castShadow = true;
        hillPeak.receiveShadow = true;
        scene.add(hillPeak);
        objects.push(hillPeak);

        var boxGeometry5 = new THREE.BoxGeometry(200, 8, 200);
        var hillPlatform = new THREE.Mesh(boxGeometry5, materialBrown);
        hillPlatform.position.set(0, 142, 0);
        hillPlatform.castShadow = true;
        hillPlatform.receiveShadow = true;
        scene.add(hillPlatform);
        objects.push(hillPlatform);
    }

    function buildRadarDishes() {
        var grayColor = 0x808080;
        var redColor = 0xFF0000;
        var materialGray = new THREE.MeshLambertMaterial({ color: grayColor });
        var materialRed = new THREE.MeshLambertMaterial({ color: redColor });

        var positions = [
            { x: -60, z: -40 },
            { x: 60, z: -40 },
            { x: 0, z: 60 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var cylinderGeometry = new THREE.CylinderGeometry(8, 8, 15, 16);
            var radarBase = new THREE.Mesh(cylinderGeometry, materialGray);
            radarBase.position.set(pos.x, 155, pos.z);
            radarBase.castShadow = true;
            radarBase.receiveShadow = true;
            scene.add(radarBase);
            objects.push(radarBase);

            var boxGeometry = new THREE.BoxGeometry(45, 3, 45);
            var radarDish = new THREE.Mesh(boxGeometry, materialRed);
            radarDish.position.set(pos.x, 165, pos.z);
            radarDish.castShadow = true;
            radarDish.receiveShadow = true;
            radarDish.userData.radarIndex = i;
            scene.add(radarDish);
            objects.push(radarDish);

            var cylinderGeometry2 = new THREE.CylinderGeometry(2, 2, 30, 8);
            var radarArm = new THREE.Mesh(cylinderGeometry2, materialGray);
            radarArm.position.set(pos.x, 175, pos.z);
            radarArm.castShadow = true;
            radarArm.receiveShadow = true;
            radarArm.userData.radarIndex = i;
            scene.add(radarArm);
            objects.push(radarArm);
        }
    }

    function buildAntennas() {
        var redColor = 0xFF0000;
        var whiteColor = 0xFFFFFF;
        var blackColor = 0x000000;
        var materialRed = new THREE.MeshLambertMaterial({ color: redColor });
        var materialWhite = new THREE.MeshLambertMaterial({ color: whiteColor });
        var materialBlack = new THREE.MeshLambertMaterial({ color: blackColor });

        var antennaHeights = [25, 35, 45, 30, 40, 28, 38, 50, 32, 42];
        var antennaX = [-40, -20, 0, 20, 40, -30, 10, 30, -10, 50];
        var antennaZ = [20, 40, 10, 30, 50, 15, 35, 25, 45, 5];

        for (var i = 0; i < antennaHeights.length; i++) {
            var height = antennaHeights[i];
            var cylinderGeometry = new THREE.CylinderGeometry(0.8, 0.8, height, 6);
            var antenna = new THREE.Mesh(cylinderGeometry, materialRed);
            antenna.position.set(antennaX[i], 150 + height / 2, antennaZ[i]);
            antenna.castShadow = true;
            antenna.receiveShadow = true;
            antenna.userData.antennaIndex = i;
            scene.add(antenna);
            objects.push(antenna);

            var sphereGeometry = new THREE.SphereGeometry(2.5, 8, 8);
            var antennaTip = new THREE.Mesh(sphereGeometry, materialWhite);
            antennaTip.position.set(antennaX[i], 150 + height, antennaZ[i]);
            antennaTip.castShadow = true;
            antennaTip.receiveShadow = true;
            antennaTip.userData.antennaIndex = i;
            antennaTip.userData.isTip = true;
            scene.add(antennaTip);
            objects.push(antennaTip);
            antennaBlinkStates.push(true);
        }
    }

    function buildCommunicationTower() {
        var grayColor = 0x808080;
        var materialGray = new THREE.MeshLambertMaterial({ color: grayColor });

        var cylinderGeometry = new THREE.CylinderGeometry(4, 4, 120, 12);
        var towerMast = new THREE.Mesh(cylinderGeometry, materialGray);
        towerMast.position.set(-80, 180, -80);
        towerMast.castShadow = true;
        towerMast.receiveShadow = true;
        scene.add(towerMast);
        objects.push(towerMast);

        var boxGeometry1 = new THREE.BoxGeometry(40, 4, 4);
        var crossArm1 = new THREE.Mesh(boxGeometry1, materialGray);
        crossArm1.position.set(-80, 200, -80);
        crossArm1.castShadow = true;
        crossArm1.receiveShadow = true;
        scene.add(crossArm1);
        objects.push(crossArm1);

        var boxGeometry2 = new THREE.BoxGeometry(4, 4, 40);
        var crossArm2 = new THREE.Mesh(boxGeometry2, materialGray);
        crossArm2.position.set(-80, 210, -80);
        crossArm2.castShadow = true;
        crossArm2.receiveShadow = true;
        scene.add(crossArm2);
        objects.push(crossArm2);

        var boxGeometry3 = new THREE.BoxGeometry(30, 4, 4);
        var crossArm3 = new THREE.Mesh(boxGeometry3, materialGray);
        crossArm3.position.set(-80, 220, -80);
        crossArm3.castShadow = true;
        crossArm3.receiveShadow = true;
        scene.add(crossArm3);
        objects.push(crossArm3);

        var boxGeometry4 = new THREE.BoxGeometry(4, 4, 30);
        var crossArm4 = new THREE.Mesh(boxGeometry4, materialGray);
        crossArm4.position.set(-80, 230, -80);
        crossArm4.castShadow = true;
        crossArm4.receiveShadow = true;
        scene.add(crossArm4);
        objects.push(crossArm4);
    }

    function buildFacilityEntrance() {
        var oliveColor = 0x556B2F;
        var materialOlive = new THREE.MeshLambertMaterial({ color: oliveColor });

        var boxGeometry1 = new THREE.BoxGeometry(30, 2, 30);
        var hatchFrame = new THREE.Mesh(boxGeometry1, materialOlive);
        hatchFrame.position.set(50, 142, 50);
        hatchFrame.castShadow = true;
        hatchFrame.receiveShadow = true;
        scene.add(hatchFrame);
        objects.push(hatchFrame);

        var boxGeometry2 = new THREE.BoxGeometry(24, 1, 24);
        var hatchDoor = new THREE.Mesh(boxGeometry2, materialOlive);
        hatchDoor.position.set(50, 143.5, 50);
        hatchDoor.castShadow = true;
        hatchDoor.receiveShadow = true;
        scene.add(hatchDoor);
        objects.push(hatchDoor);

        var boxGeometry3 = new THREE.BoxGeometry(28, 15, 28);
        var entranceShaft = new THREE.Mesh(boxGeometry3, materialOlive);
        entranceShaft.position.set(50, 125, 50);
        entranceShaft.castShadow = true;
        entranceShaft.receiveShadow = true;
        scene.add(entranceShaft);
        objects.push(entranceShaft);
    }

    function buildBunkers() {
        var grayColor = 0x808080;
        var materialGray = new THREE.MeshLambertMaterial({ color: grayColor });

        var bunkerPositions = [
            { x: -100, z: -100 },
            { x: 100, z: -100 },
            { x: -100, z: 100 },
            { x: 100, z: 100 }
        ];

        for (var i = 0; i < bunkerPositions.length; i++) {
            var pos = bunkerPositions[i];
            var boxGeometry = new THREE.BoxGeometry(35, 25, 35);
            var bunker = new THREE.Mesh(boxGeometry, materialGray);
            bunker.position.set(pos.x, 150, pos.z);
            bunker.castShadow = true;
            bunker.receiveShadow = true;
            scene.add(bunker);
            objects.push(bunker);

            var roofGeometry = new THREE.BoxGeometry(40, 8, 40);
            var bunkerRoof = new THREE.Mesh(roofGeometry, materialGray);
            bunkerRoof.position.set(pos.x, 169, pos.z);
            bunkerRoof.castShadow = true;
            bunkerRoof.receiveShadow = true;
            scene.add(bunkerRoof);
            objects.push(bunkerRoof);

            var slitGeometry = new THREE.BoxGeometry(20, 6, 2);
            var viewSlit = new THREE.Mesh(slitGeometry, materialGray);
            viewSlit.position.set(pos.x, 157, pos.z + 18);
            viewSlit.castShadow = true;
            viewSlit.receiveShadow = true;
            scene.add(viewSlit);
            objects.push(viewSlit);
        }
    }

    function buildDefenses() {
        var sandColor = 0xC2B280;
        var materialSand = new THREE.MeshLambertMaterial({ color: sandColor });

        var defensePositions = [
            { x: -50, z: -50 },
            { x: 50, z: -50 },
            { x: -50, z: 50 },
            { x: 50, z: 50 },
            { x: 0, z: -75 },
            { x: 0, z: 75 }
        ];

        for (var i = 0; i < defensePositions.length; i++) {
            var pos = defensePositions[i];
            var boxGeometry = new THREE.BoxGeometry(25, 12, 25);
            var sandbag = new THREE.Mesh(boxGeometry, materialSand);
            sandbag.position.set(pos.x, 150, pos.z);
            sandbag.castShadow = true;
            sandbag.receiveShadow = true;
            scene.add(sandbag);
            objects.push(sandbag);

            var cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
            var gunMount = new THREE.Mesh(cylinderGeometry, materialSand);
            gunMount.position.set(pos.x, 158, pos.z);
            gunMount.castShadow = true;
            gunMount.receiveShadow = true;
            scene.add(gunMount);
            objects.push(gunMount);
        }
    }

    function buildFuelBuilding() {
        var grayColor = 0x808080;
        var materialGray = new THREE.MeshLambertMaterial({ color: grayColor });

        var boxGeometry1 = new THREE.BoxGeometry(50, 30, 40);
        var fuelBuilding = new THREE.Mesh(boxGeometry1, materialGray);
        fuelBuilding.position.set(80, 155, 30);
        fuelBuilding.castShadow = true;
        fuelBuilding.receiveShadow = true;
        scene.add(fuelBuilding);
        objects.push(fuelBuilding);

        var cylinderGeometry = new THREE.CylinderGeometry(5, 5, 60, 16);
        var exhaustPipe = new THREE.Mesh(cylinderGeometry, materialGray);
        exhaustPipe.position.set(80, 190, 30);
        exhaustPipe.castShadow = true;
        exhaustPipe.receiveShadow = true;
        scene.add(exhaustPipe);
        objects.push(exhaustPipe);

        var boxGeometry2 = new THREE.BoxGeometry(8, 25, 8);
        var vent1 = new THREE.Mesh(boxGeometry2, materialGray);
        vent1.position.set(70, 172, 35);
        vent1.castShadow = true;
        vent1.receiveShadow = true;
        scene.add(vent1);
        objects.push(vent1);

        var boxGeometry3 = new THREE.BoxGeometry(8, 25, 8);
        var vent2 = new THREE.Mesh(boxGeometry3, materialGray);
        vent2.position.set(90, 172, 25);
        vent2.castShadow = true;
        vent2.receiveShadow = true;
        scene.add(vent2);
        objects.push(vent2);

        var boxGeometry4 = new THREE.BoxGeometry(45, 4, 35);
        var fuelRoof = new THREE.Mesh(boxGeometry4, materialGray);
        fuelRoof.position.set(80, 170, 30);
        fuelRoof.castShadow = true;
        fuelRoof.receiveShadow = true;
        scene.add(fuelRoof);
        objects.push(fuelRoof);
    }

    function buildPerimeterFence() {
        var fenceColor = 0x404040;
        var materialFence = new THREE.MeshLambertMaterial({ color: fenceColor });

        var fenceLength = 400;
        var fenceSpacing = 50;
        var posts = [];

        for (var x = -fenceLength / 2; x <= fenceLength / 2; x += fenceSpacing) {
            var cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
            var post = new THREE.Mesh(cylinderGeometry, materialFence);
            post.position.set(x, 150, -fenceLength / 2);
            post.castShadow = true;
            post.receiveShadow = true;
            scene.add(post);
            objects.push(post);
            posts.push({ x: x, z: -fenceLength / 2 });

            var boxGeometry = new THREE.BoxGeometry(fenceSpacing - 2, 15, 2);
            var rail = new THREE.Mesh(boxGeometry, materialFence);
            rail.position.set(x + fenceSpacing / 2 - 1, 155, -fenceLength / 2);
            rail.castShadow = true;
            rail.receiveShadow = true;
            scene.add(rail);
            objects.push(rail);
        }

        for (var z = -fenceLength / 2; z <= fenceLength / 2; z += fenceSpacing) {
            var cylinderGeometry2 = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
            var post2 = new THREE.Mesh(cylinderGeometry2, materialFence);
            post2.position.set(fenceLength / 2, 150, z);
            post2.castShadow = true;
            post2.receiveShadow = true;
            scene.add(post2);
            objects.push(post2);

            var boxGeometry2 = new THREE.BoxGeometry(2, 15, fenceSpacing - 2);
            var rail2 = new THREE.Mesh(boxGeometry2, materialFence);
            rail2.position.set(fenceLength / 2, 155, z + fenceSpacing / 2 - 1);
            rail2.castShadow = true;
            rail2.receiveShadow = true;
            scene.add(rail2);
            objects.push(rail2);
        }

        for (var x2 = -fenceLength / 2; x2 <= fenceLength / 2; x2 += fenceSpacing) {
            var cylinderGeometry3 = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
            var post3 = new THREE.Mesh(cylinderGeometry3, materialFence);
            post3.position.set(x2, 150, fenceLength / 2);
            post3.castShadow = true;
            post3.receiveShadow = true;
            scene.add(post3);
            objects.push(post3);

            var boxGeometry3 = new THREE.BoxGeometry(fenceSpacing - 2, 15, 2);
            var rail3 = new THREE.Mesh(boxGeometry3, materialFence);
            rail3.position.set(x2 + fenceSpacing / 2 - 1, 155, fenceLength / 2);
            rail3.castShadow = true;
            rail3.receiveShadow = true;
            scene.add(rail3);
            objects.push(rail3);
        }

        for (var z2 = -fenceLength / 2; z2 <= fenceLength / 2; z2 += fenceSpacing) {
            var cylinderGeometry4 = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
            var post4 = new THREE.Mesh(cylinderGeometry4, materialFence);
            post4.position.set(-fenceLength / 2, 150, z2);
            post4.castShadow = true;
            post4.receiveShadow = true;
            scene.add(post4);
            objects.push(post4);

            var boxGeometry4 = new THREE.BoxGeometry(2, 15, fenceSpacing - 2);
            var rail4 = new THREE.Mesh(boxGeometry4, materialFence);
            rail4.position.set(-fenceLength / 2, 155, z2 + fenceSpacing / 2 - 1);
            rail4.castShadow = true;
            rail4.receiveShadow = true;
            scene.add(rail4);
            objects.push(rail4);
        }
    }

    function buildCableRuns() {
        var cableColor = 0x2F4F4F;
        var materialCable = new THREE.LineBasicMaterial({ color: cableColor, linewidth: 2 });

        var cableLines = [
            { start: [0, 150, 0], end: [-80, 180, -80] },
            { start: [0, 150, 0], end: [80, 155, 30] },
            { start: [-60, 165, -40], end: [-80, 180, -80] },
            { start: [60, 165, -40], end: [-80, 180, -80] },
            { start: [0, 150, 0], end: [50, 143, 50] },
            { start: [-100, 150, -100], end: [-80, 180, -80] },
            { start: [100, 150, -100], end: [-80, 180, -80] },
            { start: [-100, 150, 100], end: [80, 155, 30] },
            { start: [100, 150, 100], end: [80, 155, 30] }
        ];

        for (var i = 0; i < cableLines.length; i++) {
            var cable = cableLines[i];
            var geometry = new THREE.BufferGeometry();
            var positions = new Float32Array([
                cable.start[0], cable.start[1], cable.start[2],
                cable.end[0], cable.end[1], cable.end[2]
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            var cableLine = new THREE.LineSegments(geometry, materialCable);
            scene.add(cableLine);
            objects.push(cableLine);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -300;
        directionalLight.shadow.camera.right = 300;
        directionalLight.shadow.camera.top = 300;
        directionalLight.shadow.camera.bottom = -300;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xff0000, 0.6, 150);
        pointLight1.position.set(-60, 170, -40);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xff0000, 0.6, 150);
        pointLight2.position.set(60, 170, -40);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0xff0000, 0.6, 150);
        pointLight3.position.set(0, 175, 60);
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    function update(delta) {
        var radarMeshes = [];
        var antennaMeshes = [];

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.userData.radarIndex !== undefined) {
                radarMeshes.push(obj);
            }
            if (obj.userData.antennaIndex !== undefined) {
                antennaMeshes.push(obj);
            }
        }

        for (var j = 0; j < radarMeshes.length; j++) {
            var mesh = radarMeshes[j];
            var idx = mesh.userData.radarIndex;
            radarRotations[idx] += radarSpeeds[idx];
            mesh.rotation.y = radarRotations[idx];
        }

        for (var k = 0; k < antennaMeshes.length; k++) {
            var antMesh = antennaMeshes[k];
            var aIdx = antMesh.userData.antennaIndex;
            if (antMesh.userData.isTip) {
                var blinkFreq = 0.5 + (aIdx * 0.1) % 0.5;
                var newBlink = Math.sin(Date.now() * 0.003 * (1 + blinkFreq)) > 0;
                if (newBlink !== antennaBlinkStates[aIdx]) {
                    antennaBlinkStates[aIdx] = newBlink;
                    antMesh.visible = newBlink;
                }
            }
        }
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
        radarRotations = [0, 0, 0];
        antennaBlinkStates = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
