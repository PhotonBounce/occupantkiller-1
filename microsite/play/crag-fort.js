window.CragFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var torches = [];

    function buildCragBase() {
        var darkGray = 0x3a3a3a;
        var cragHeights = [8, 12, 10, 15, 9, 13, 11, 14, 10, 12, 9, 11, 13, 8, 10, 12, 11, 9, 14, 10];
        var cragWidth = 80;
        var cragDepth = 70;
        var blockSize = 8;
        var xOffset = -40;
        var zOffset = -35;

        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 10; j++) {
                var height = cragHeights[i * 10 + j] || 10;
                var geometry = new THREE.BoxGeometry(blockSize, height, blockSize);
                var material = new THREE.MeshLambertMaterial({ color: darkGray });
                var mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(xOffset + i * blockSize, height / 2, zOffset + j * blockSize);
                mesh.rotation.x = (Math.random() - 0.5) * 0.2;
                mesh.rotation.z = (Math.random() - 0.5) * 0.2;
                scene.add(mesh);
                objects.push(mesh);
            }
        }

        for (var i = 0; i < 5; i++) {
            var stoneGeo = new THREE.BoxGeometry(15 + Math.random() * 10, 6 + Math.random() * 4, 12 + Math.random() * 8);
            var stoneMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
            stoneMesh.position.set(-30 + Math.random() * 60, 40 + Math.random() * 20, -25 + Math.random() * 50);
            stoneMesh.rotation.x = (Math.random() - 0.5) * 0.3;
            stoneMesh.rotation.z = (Math.random() - 0.5) * 0.3;
            scene.add(stoneMesh);
            objects.push(stoneMesh);
        }
    }

    function buildFortWalls() {
        var stoneColor = 0x5a5a5a;
        var wallHeight = 12;
        var wallThickness = 2;

        var northWall = new THREE.BoxGeometry(80, wallHeight, wallThickness);
        var wallMat = new THREE.MeshLambertMaterial({ color: stoneColor });
        var northMesh = new THREE.Mesh(northWall, wallMat);
        northMesh.position.set(0, wallHeight / 2 + 25, -35);
        scene.add(northMesh);
        objects.push(northMesh);

        var southWall = new THREE.BoxGeometry(80, wallHeight, wallThickness);
        var southMesh = new THREE.Mesh(southWall, wallMat);
        southMesh.position.set(0, wallHeight / 2 + 25, 35);
        scene.add(southMesh);
        objects.push(southMesh);

        var eastWall = new THREE.BoxGeometry(wallThickness, wallHeight, 70);
        var eastMesh = new THREE.Mesh(eastWall, wallMat);
        eastMesh.position.set(40, wallHeight / 2 + 25, 0);
        scene.add(eastMesh);
        objects.push(eastMesh);

        var westWall = new THREE.BoxGeometry(wallThickness, wallHeight, 70);
        var westMesh = new THREE.Mesh(westWall, wallMat);
        westMesh.position.set(-40, wallHeight / 2 + 25, 0);
        scene.add(westMesh);
        objects.push(westMesh);

        for (var i = 0; i < 12; i++) {
            var loopGeo = new THREE.BoxGeometry(0.8, 1.5, 1);
            var loopMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var loopMesh = new THREE.Mesh(loopGeo, loopMat);
            loopMesh.position.set(-35 + i * 6, 8 + 20, -35.5);
            scene.add(loopMesh);
            objects.push(loopMesh);
        }

        for (var i = 0; i < 12; i++) {
            var loopGeo = new THREE.BoxGeometry(0.8, 1.5, 1);
            var loopMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var loopMesh = new THREE.Mesh(loopGeo, loopMat);
            loopMesh.position.set(-35 + i * 6, 8 + 20, 35.5);
            scene.add(loopMesh);
            objects.push(loopMesh);
        }

        for (var i = 0; i < 8; i++) {
            var loopGeo = new THREE.BoxGeometry(1, 1.5, 0.8);
            var loopMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var loopMesh = new THREE.Mesh(loopGeo, loopMat);
            loopMesh.position.set(40.5, 8 + 20, -30 + i * 8);
            scene.add(loopMesh);
            objects.push(loopMesh);
        }

        for (var i = 0; i < 8; i++) {
            var loopGeo = new THREE.BoxGeometry(1, 1.5, 0.8);
            var loopMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var loopMesh = new THREE.Mesh(loopGeo, loopMat);
            loopMesh.position.set(-40.5, 8 + 20, -30 + i * 8);
            scene.add(loopMesh);
            objects.push(loopMesh);
        }
    }

    function buildTurrets() {
        var turretRadius = 4;
        var turretHeight = 16;

        var turretPositions = [
            { x: -38, z: -33 },
            { x: 38, z: -33 },
            { x: 38, z: 33 },
            { x: -38, z: 33 }
        ];

        for (var t = 0; t < turretPositions.length; t++) {
            var pos = turretPositions[t];

            var cylinderGeo = new THREE.CylinderGeometry(turretRadius, turretRadius, turretHeight, 12);
            var stoneMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
            var cylinder = new THREE.Mesh(cylinderGeo, stoneMat);
            cylinder.position.set(pos.x, turretHeight / 2 + 25, pos.z);
            scene.add(cylinder);
            objects.push(cylinder);

            var coneGeo = new THREE.ConeGeometry(turretRadius * 1.1, 3, 12);
            var coneMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
            var cone = new THREE.Mesh(coneGeo, coneMat);
            cone.position.set(pos.x, turretHeight + 25 + 1.5, pos.z);
            scene.add(cone);
            objects.push(cone);

            for (var i = 0; i < 4; i++) {
                var crenelGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
                var crenelMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
                var crenel = new THREE.Mesh(crenelGeo, crenelMat);
                crenel.position.set(pos.x + Math.cos(i * Math.PI / 2) * 4.5, turretHeight + 25 + 1, pos.z + Math.sin(i * Math.PI / 2) * 4.5);
                scene.add(crenel);
                objects.push(crenel);
            }
        }
    }

    function buildKeep() {
        var keepWidth = 20;
        var keepDepth = 20;
        var keepHeight = 40;

        var keepGeo = new THREE.BoxGeometry(keepWidth, keepHeight, keepDepth);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var keep = new THREE.Mesh(keepGeo, keepMat);
        keep.position.set(0, keepHeight / 2 + 25, 0);
        scene.add(keep);
        objects.push(keep);

        var roofGeo = new THREE.ConeGeometry(15, 8, 8);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(0, keepHeight + 25 + 4, 0);
        scene.add(roof);
        objects.push(roof);

        for (var i = 0; i < 6; i++) {
            var windowGeo = new THREE.BoxGeometry(2, 2.5, 0.5);
            var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var window = new THREE.Mesh(windowGeo, windowMat);
            var level = 10 + i * 4;
            var side = i % 2;
            var offset = side === 0 ? 10.5 : -10.5;
            var zPos = (i % 2 === 0) ? 10.5 : -10.5;
            window.position.set(offset, level + 25, (i < 3) ? 10.5 : -10.5);
            scene.add(window);
            objects.push(window);
        }

        for (var i = 0; i < 8; i++) {
            var crenelGeo = new THREE.BoxGeometry(2, 3, 1.5);
            var crenelMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var crenel = new THREE.Mesh(crenelGeo, crenelMat);
            var angle = i * Math.PI / 4;
            crenel.position.set(Math.cos(angle) * 10.5, keepHeight + 25 + 1.5, Math.sin(angle) * 10.5);
            scene.add(crenel);
            objects.push(crenel);
        }
    }

    function buildSiegeEquipment() {
        var catapultX = -25;
        var catapultZ = -28;

        var frameGeo = new THREE.BoxGeometry(3, 4, 3);
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var frame = new THREE.Mesh(frameGeo, woodMat);
        frame.position.set(catapultX, 2 + 25, catapultZ);
        scene.add(frame);
        objects.push(frame);

        var beamGeo = new THREE.BoxGeometry(2, 0.5, 6);
        var beam = new THREE.Mesh(beamGeo, woodMat);
        beam.position.set(catapultX, 4.5 + 25, catapultZ);
        beam.rotation.z = 0.3;
        scene.add(beam);
        objects.push(beam);

        var armGeo = new THREE.BoxGeometry(1, 0.4, 8);
        var arm = new THREE.Mesh(armGeo, woodMat);
        arm.position.set(catapultX, 5 + 25, catapultZ);
        arm.rotation.z = 0.5;
        scene.add(arm);
        objects.push(arm);

        var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 3, 8);
        var metalMat = new THREE.MeshLambertMaterial({ color: 0xa9a9a9 });
        var barrel = new THREE.Mesh(barrelGeo, metalMat);
        barrel.position.set(catapultX - 2, 3 + 25, catapultZ);
        barrel.rotation.z = Math.PI / 6;
        scene.add(barrel);
        objects.push(barrel);

        var cannonPosX = 15;
        var cannonPosZ = -28;

        var carriageGeo = new THREE.BoxGeometry(2, 1.5, 4);
        var carriage = new THREE.Mesh(carriageGeo, woodMat);
        carriage.position.set(cannonPosX, 1 + 25, cannonPosZ);
        scene.add(carriage);
        objects.push(carriage);

        var cannonBarrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 4, 10);
        var cannonBarrel = new THREE.Mesh(cannonBarrelGeo, metalMat);
        cannonBarrel.position.set(cannonPosX, 2.5 + 25, cannonPosZ);
        cannonBarrel.rotation.z = Math.PI / 5;
        scene.add(cannonBarrel);
        objects.push(cannonBarrel);

        var cannonBallGeo = new THREE.SphereGeometry(0.5, 8, 8);
        var cannonBall = new THREE.Mesh(cannonBallGeo, metalMat);
        cannonBall.position.set(cannonPosX + 3, 2.5 + 25, cannonPosZ);
        scene.add(cannonBall);
        objects.push(cannonBall);
    }

    function buildSupplyRooms() {
        var storeColors = [0x6a5a4a, 0x7a6a5a];

        var storePosX = [-15, 15];
        var storePosZ = [-15, 15];

        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                var storeGeo = new THREE.BoxGeometry(8, 6, 8);
                var storeMat = new THREE.MeshLambertMaterial({ color: storeColors[(i + j) % 2] });
                var store = new THREE.Mesh(storeGeo, storeMat);
                store.position.set(storePosX[i], 3 + 25, storePosZ[j]);
                scene.add(store);
                objects.push(store);

                var doorGeo = new THREE.BoxGeometry(2.5, 3, 0.3);
                var doorMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
                var door = new THREE.Mesh(doorGeo, doorMat);
                door.position.set(storePosX[i], 4 + 25, storePosZ[j] + 4.2);
                scene.add(door);
                objects.push(door);
            }
        }

        for (var b = 0; b < 8; b++) {
            var barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);
            var barrelMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
            var barrel = new THREE.Mesh(barrelGeo, barrelMat);
            barrel.position.set(-15 - 2 + Math.random() * 4, 0.5 + 25, -15 - 2 + Math.random() * 4);
            scene.add(barrel);
            objects.push(barrel);
        }
    }

    function buildEscapeTunnel() {
        var tunnelX = -35;
        var tunnelZ = 25;
        var tunnelHeight = 6;
        var tunnelWidth = 4;
        var tunnelDepth = 15;

        var tunnelGeo = new THREE.BoxGeometry(tunnelWidth, tunnelHeight, tunnelDepth);
        var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
        tunnel.position.set(tunnelX, tunnelHeight / 2 + 20, tunnelZ);
        scene.add(tunnel);
        objects.push(tunnel);

        var entranceGeo = new THREE.BoxGeometry(tunnelWidth + 1, tunnelHeight + 1, 2);
        var entranceMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var entrance = new THREE.Mesh(entranceGeo, entranceMat);
        entrance.position.set(tunnelX, tunnelHeight / 2 + 20, tunnelZ - tunnelDepth / 2 - 1);
        scene.add(entrance);
        objects.push(entrance);

        for (var t = 0; t < 4; t++) {
            var timberGeo = new THREE.BoxGeometry(0.3, tunnelHeight - 1, tunnelWidth - 0.5);
            var timberMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
            var timber = new THREE.Mesh(timberGeo, timberMat);
            timber.position.set(tunnelX - 1.5 + t * 1, tunnelHeight / 2 + 20, tunnelZ);
            scene.add(timber);
            objects.push(timber);
        }

        var cragGapX = 30;
        var cragGapZ = 0;

        for (var i = 0; i < 5; i++) {
            var segGeo = new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(cragGapX - 3, 20 + 25 - i * 1, cragGapZ - 2),
                    new THREE.Vector3(cragGapX + 3, 20 + 25 - i * 1.2, cragGapZ + 2)
                ])
            );
            var segMat = new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 3 });
            segGeo.material = segMat;
            scene.add(segGeo);
            objects.push(segGeo);
        }

        for (var i = 0; i < 5; i++) {
            var segGeo = new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(cragGapX - 3, 20 + 25 - i * 1, cragGapZ + 2),
                    new THREE.Vector3(cragGapX + 3, 20 + 25 - i * 1.2, cragGapZ - 2)
                ])
            );
            var segMat = new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 3 });
            segGeo.material = segMat;
            scene.add(segGeo);
            objects.push(segGeo);
        }
    }

    function buildGatehouse() {
        var gateX = 0;
        var gateZ = -38;
        var gateTowerWidth = 8;
        var gateTowerHeight = 14;

        var leftTowerGeo = new THREE.BoxGeometry(gateTowerWidth, gateTowerHeight, gateTowerWidth);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var leftTower = new THREE.Mesh(leftTowerGeo, gateMat);
        leftTower.position.set(gateX - 8, gateTowerHeight / 2 + 25, gateZ);
        scene.add(leftTower);
        objects.push(leftTower);

        var rightTower = new THREE.Mesh(leftTowerGeo, gateMat);
        rightTower.position.set(gateX + 8, gateTowerHeight / 2 + 25, gateZ);
        scene.add(rightTower);
        objects.push(rightTower);

        var gateGeo = new THREE.BoxGeometry(12, 6, 1);
        var gateMatWood = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var gate = new THREE.Mesh(gateGeo, gateMatWood);
        gate.position.set(gateX, 3 + 25, gateZ);
        scene.add(gate);
        objects.push(gate);

        var portcullisGeo = new THREE.BoxGeometry(10, 8, 0.5);
        var portcullisMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var portcullis = new THREE.Mesh(portcullisGeo, portcullisMat);
        portcullis.position.set(gateX, 4 + 25, gateZ - 0.8);
        scene.add(portcullis);
        objects.push(portcullis);

        var overhang1Geo = new THREE.BoxGeometry(16, 2, 4);
        var overhangMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var overhang1 = new THREE.Mesh(overhang1Geo, overhangMat);
        overhang1.position.set(gateX, gateTowerHeight + 25 - 1, gateZ - 2);
        scene.add(overhang1);
        objects.push(overhang1);

        for (var h = 0; h < 4; h++) {
            var holeGeo = new THREE.BoxGeometry(2, 1.5, 1);
            var holeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var hole = new THREE.Mesh(holeGeo, holeMat);
            hole.position.set(gateX - 5 + h * 3, gateTowerHeight + 25 - 1, gateZ - 3);
            scene.add(hole);
            objects.push(hole);
        }
    }

    function buildDrawbridge() {
        var bridgeX = 30;
        var bridgeZ = 0;
        var bridgeWidth = 8;
        var bridgeDepth = 6;
        var bridgeHeight = 1.5;

        var bridgeGeo = new THREE.BoxGeometry(bridgeWidth, bridgeHeight, bridgeDepth);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(bridgeX, 18 + 25, bridgeZ);
        scene.add(bridge);
        objects.push(bridge);

        var chain1Geo = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(bridgeX - 4, 20 + 25, bridgeZ - 3),
                new THREE.Vector3(bridgeX - 4, 25 + 25, bridgeZ - 8)
            ])
        );
        var chainMat = new THREE.LineBasicMaterial({ color: 0xa9a9a9, linewidth: 2 });
        chain1Geo.material = chainMat;
        scene.add(chain1Geo);
        objects.push(chain1Geo);

        var chain2Geo = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(bridgeX + 4, 20 + 25, bridgeZ - 3),
                new THREE.Vector3(bridgeX + 4, 25 + 25, bridgeZ - 8)
            ])
        );
        chain2Geo.material = chainMat;
        scene.add(chain2Geo);
        objects.push(chain2Geo);

        var anchorGeo = new THREE.BoxGeometry(1, 2, 1);
        var anchorMat = new THREE.MeshLambertMaterial({ color: 0xa9a9a9 });
        var anchor1 = new THREE.Mesh(anchorGeo, anchorMat);
        anchor1.position.set(bridgeX - 4, 26 + 25, bridgeZ - 8);
        scene.add(anchor1);
        objects.push(anchor1);

        var anchor2 = new THREE.Mesh(anchorGeo, anchorMat);
        anchor2.position.set(bridgeX + 4, 26 + 25, bridgeZ - 8);
        scene.add(anchor2);
        objects.push(anchor2);
    }

    function buildMerchandise() {
        var merchColors = [0xa9a9a9, 0xcd853f, 0x8b4513];

        for (var i = 0; i < 6; i++) {
            var crate = new THREE.BoxGeometry(2, 2, 2);
            var crateMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
            var crateMesh = new THREE.Mesh(crate, crateMat);
            crateMesh.position.set(-10 + i * 3, 1 + 25, -25);
            scene.add(crateMesh);
            objects.push(crateMesh);
        }

        for (var i = 0; i < 4; i++) {
            var bale = new THREE.BoxGeometry(3, 1.5, 1.5);
            var baleMat = new THREE.MeshLambertMaterial({ color: 0xcd853f });
            var baleMesh = new THREE.Mesh(bale, baleMat);
            baleMesh.position.set(-15 + i * 4, 0.75 + 25, 20);
            scene.add(baleMesh);
            objects.push(baleMesh);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 40, 30);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var torchPositions = [
            { x: -35, z: -25 },
            { x: 35, z: -25 },
            { x: 35, z: 25 },
            { x: -35, z: 25 },
            { x: -15, z: 0 },
            { x: 15, z: 0 }
        ];

        for (var t = 0; t < torchPositions.length; t++) {
            var torch = new THREE.PointLight(0xff8800, 1.5, 30);
            torch.position.set(torchPositions[t].x, 8 + 25, torchPositions[t].z);
            scene.add(torch);
            lights.push(torch);
            torches.push(torch);
        }
    }

    function update(delta) {
        for (var i = 0; i < torches.length; i++) {
            torches[i].intensity = 1.3 + Math.sin(Date.now() * 0.003 + i) * 0.3;
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        torches = [];

        buildCragBase();
        buildFortWalls();
        buildTurrets();
        buildKeep();
        buildGatehouse();
        buildSiegeEquipment();
        buildSupplyRooms();
        buildEscapeTunnel();
        buildDrawbridge();
        buildMerchandise();
        setupLighting();
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
        torches = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
