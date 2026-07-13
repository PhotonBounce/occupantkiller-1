window.CokeYard = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var smokeParticles = [];
    var animationTime = 0;

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        smokeParticles = [];
        animationTime = 0;

        buildYardFloor();
        buildBlastFurnaces();
        buildCokePiles();
        buildConveyors();
        buildCoolingTowers();
        buildCheckpoint();
        buildRailSpur();
        buildSmokeStacks();
        setupLighting();
    }

    function buildYardFloor() {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x222211 });
        var dustMat = new THREE.MeshLambertMaterial({ color: 0x1a1a15 });

        var tileWidth = 50;
        var tileDepth = 40;
        var tileHeight = 0.5;

        var mainFloor = new THREE.BoxGeometry(tileWidth, tileHeight, tileDepth);
        addMesh(mainFloor, concreteMat, 0, 0, 0);

        for (var i = 0; i < 8; i++) {
            var offsetX = (Math.random() - 0.5) * tileWidth;
            var offsetZ = (Math.random() - 0.5) * tileDepth;
            var dustTile = new THREE.BoxGeometry(8, tileHeight + 0.1, 6);
            addMesh(dustTile, dustMat, offsetX, 0.05, offsetZ);
        }

        var borderMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var borderWidth = 1;

        var northBorder = new THREE.BoxGeometry(tileWidth + 4, tileHeight, borderWidth);
        addMesh(northBorder, borderMat, 0, 0, tileDepth / 2 + 1);

        var southBorder = new THREE.BoxGeometry(tileWidth + 4, tileHeight, borderWidth);
        addMesh(southBorder, borderMat, 0, 0, -tileDepth / 2 - 1);

        var eastBorder = new THREE.BoxGeometry(borderWidth, tileHeight, tileDepth);
        addMesh(eastBorder, borderMat, tileWidth / 2 + 1, 0, 0);

        var westBorder = new THREE.BoxGeometry(borderWidth, tileHeight, tileDepth);
        addMesh(westBorder, borderMat, -tileWidth / 2 - 1, 0, 0);
    }

    function buildBlastFurnaces() {
        var furnaceMat = new THREE.MeshLambertMaterial({ color: 0x882200 });
        var tuyereMat = new THREE.MeshLambertMaterial({ color: 0x444422 });
        var glowMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });

        var furnacePositions = [
            { x: -15, z: 10 },
            { x: 0, z: 10 },
            { x: 15, z: 10 }
        ];

        for (var f = 0; f < furnacePositions.length; f++) {
            var pos = furnacePositions[f];

            var furnaceGeo = new THREE.CylinderGeometry(4, 4.5, 22, 16);
            var furnace = addMesh(furnaceGeo, furnaceMat, pos.x, 11, pos.z);
            furnace.castShadow = true;
            furnace.receiveShadow = true;

            for (var t = 0; t < 6; t++) {
                var angle = (t / 6) * Math.PI * 2;
                var tuyereX = pos.x + Math.cos(angle) * 5;
                var tuyereZ = pos.z + Math.sin(angle) * 5;
                var tuyereGeo = new THREE.BoxGeometry(2, 1.5, 2);
                addMesh(tuyereGeo, tuyereMat, tuyereX, 2, tuyereZ);
            }

            var glowGeo = new THREE.SphereGeometry(3.5, 12, 12);
            var glow = addMesh(glowGeo, glowMat, pos.x, 23, pos.z);
            glow.userData.isGlowLight = true;
            glow.userData.baseFurnaceIndex = f;
        }
    }

    function buildCokePiles() {
        var cokeMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
        var darkCokeMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1f });

        var pilePositions = [
            { x: -18, z: -15, size: 3.5 },
            { x: -12, z: -18, size: 3 },
            { x: -5, z: -16, size: 3.2 },
            { x: 5, z: -17, size: 2.8 },
            { x: 12, z: -19, size: 3.1 },
            { x: 18, z: -16, size: 3.4 },
            { x: -8, z: -25, size: 2.5 },
            { x: 8, z: -26, size: 2.6 },
            { x: 0, z: -20, size: 2.9 },
            { x: 15, z: -22, size: 3.3 }
        ];

        for (var p = 0; p < pilePositions.length; p++) {
            var pilePos = pilePositions[p];
            var matToUse = (p % 2 === 0) ? cokeMat : darkCokeMat;

            var pileGeo = new THREE.SphereGeometry(pilePos.size, 10, 10);
            addMesh(pileGeo, matToUse, pilePos.x, pilePos.size, pilePos.z);

            for (var c = 0; c < 3; c++) {
                var chunkSize = pilePos.size * 0.5;
                var offsetX = (Math.random() - 0.5) * pilePos.size * 1.5;
                var offsetZ = (Math.random() - 0.5) * pilePos.size * 1.5;
                var chunkGeo = new THREE.SphereGeometry(chunkSize, 8, 8);
                addMesh(chunkGeo, matToUse, pilePos.x + offsetX, pilePos.size * 0.5, pilePos.z + offsetZ);
            }

            if (p % 3 === 0) {
                var steamGeo = new THREE.SphereGeometry(1.2, 8, 8);
                var steam = addMesh(steamGeo, new THREE.MeshLambertMaterial({ color: 0xcccccc }), pilePos.x, pilePos.size + 2, pilePos.z);
                steam.userData.isSteam = true;
                steam.userData.baseY = pilePos.size + 2;
                smokeParticles.push(steam);
            }
        }
    }

    function buildConveyors() {
        var beltMat = new THREE.MeshLambertMaterial({ color: 0x440000 });
        var rollerMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var cokeMat = new THREE.MeshLambertMaterial({ color: 0x333322 });

        var conveyorConfigs = [
            { startX: -18, startZ: -10, endX: -18, endZ: 0, angle: 0 },
            { startX: 0, startZ: -12, endX: 0, endZ: 2, angle: 0 },
            { startX: 18, startZ: -10, endX: 18, endZ: 1, angle: 0 }
        ];

        for (var cv = 0; cv < conveyorConfigs.length; cv++) {
            var config = conveyorConfigs[cv];
            var midX = (config.startX + config.endX) / 2;
            var midZ = (config.startZ + config.endZ) / 2;
            var length = Math.sqrt(Math.pow(config.endX - config.startX, 2) + Math.pow(config.endZ - config.startZ, 2));
            var height = 1;

            var beltGeo = new THREE.BoxGeometry(3, height, length);
            addMesh(beltGeo, beltMat, midX, height, midZ);

            for (var r = 0; r < 6; r++) {
                var rollerZ = config.startZ + (r / 5) * (config.endZ - config.startZ);
                var rollerGeo = new THREE.CylinderGeometry(0.6, 0.6, 3.5, 12);
                addMesh(rollerGeo, rollerMat, midX, height + 0.3, rollerZ);
            }

            for (var ch = 0; ch < 5; ch++) {
                var chunkZ = config.startZ + (ch / 4) * (config.endZ - config.startZ);
                var chunkGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
                var chunk = addMesh(chunkGeo, cokeMat, midX + 0.5, height + 1, chunkZ);
                chunk.userData.isCokeChunk = true;
                chunk.userData.baseZ = config.startZ;
                chunk.userData.endZ = config.endZ;
                chunk.userData.speed = 0.03 * (cv + 1);
            }
        }
    }

    function buildCoolingTowers() {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        var steamMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });

        var towerPositions = [
            { x: -8, z: 15 },
            { x: 8, z: 15 }
        ];

        for (var tw = 0; tw < towerPositions.length; tw++) {
            var towerPos = towerPositions[tw];

            var towerGeo = new THREE.CylinderGeometry(5, 5.5, 16, 20);
            addMesh(towerGeo, concreteMat, towerPos.x, 8, towerPos.z);

            var rimGeo = new THREE.CylinderGeometry(5, 5, 0.8, 20);
            addMesh(rimGeo, concreteMat, towerPos.x, 16.5, towerPos.z);

            for (var st = 0; st < 4; st++) {
                var steamGeo = new THREE.SphereGeometry(1.5, 10, 10);
                var steam = addMesh(steamGeo, steamMat, towerPos.x + (Math.random() - 0.5) * 4, 17 + st * 1.5, towerPos.z + (Math.random() - 0.5) * 4);
                steam.userData.isSteam = true;
                steam.userData.baseY = 17 + st * 1.5;
                steam.userData.startTime = st * 0.5;
                smokeParticles.push(steam);
            }
        }
    }

    function buildCheckpoint() {
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var boothMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var armMat = new THREE.MeshLambertMaterial({ color: 0xaa0000 });

        var gateWidth = 8;
        var gateHeight = 4;
        var gateThickness = 0.3;

        var gatePostLeftGeo = new THREE.BoxGeometry(0.8, gateHeight + 2, 0.8);
        addMesh(gatePostLeftGeo, gateMat, -gateWidth / 2 - 1, gateHeight / 2 + 1, 18);

        var gatePostRightGeo = new THREE.BoxGeometry(0.8, gateHeight + 2, 0.8);
        addMesh(gatePostRightGeo, gateMat, gateWidth / 2 + 1, gateHeight / 2 + 1, 18);

        var gateBarGeo = new THREE.BoxGeometry(gateWidth, gateThickness, gateThickness);
        addMesh(gateBarGeo, gateMat, 0, gateHeight + 1, 18);

        var barrierArmGeo = new THREE.BoxGeometry(6, 0.4, 0.4);
        var arm = addMesh(barrierArmGeo, armMat, 0, 1.5, 18);
        arm.userData.isBarrier = true;
        arm.userData.baseRotation = 0;

        var boothGeo = new THREE.BoxGeometry(4, 3, 3);
        addMesh(boothGeo, boothMat, 0, 1.5, 22);

        for (var sb = 0; sb < 6; sb++) {
            var angle = (sb / 6) * Math.PI * 2;
            var sbx = Math.cos(angle) * 8;
            var sbz = 18 + Math.sin(angle) * 8;
            var sandbagGeo = new THREE.BoxGeometry(1.5, 1, 1);
            addMesh(sandbagGeo, sandbagMat, sbx, 0.5, sbz);
        }
    }

    function buildRailSpur() {
        var railMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var carMat = new THREE.MeshLambertMaterial({ color: 0x4d0000 });

        var railSpacing = 2.5;
        var railLength = 50;

        var railPoints1 = [
            new THREE.Vector3(-railSpacing / 2, 0.1, -20),
            new THREE.Vector3(-railSpacing / 2, 0.1, 15)
        ];
        var railGeometry1 = new THREE.BufferGeometry().setFromPoints(railPoints1);
        var rail1 = new THREE.LineSegments(railGeometry1, new THREE.LineBasicMaterial({ color: 0x1a1a1a, linewidth: 3 }));
        scene.add(rail1);
        objects.push(rail1);

        var railPoints2 = [
            new THREE.Vector3(railSpacing / 2, 0.1, -20),
            new THREE.Vector3(railSpacing / 2, 0.1, 15)
        ];
        var railGeometry2 = new THREE.BufferGeometry().setFromPoints(railPoints2);
        var rail2 = new THREE.LineSegments(railGeometry2, new THREE.LineBasicMaterial({ color: 0x1a1a1a, linewidth: 3 }));
        scene.add(rail2);
        objects.push(rail2);

        for (var cr = 0; cr < 3; cr++) {
            var carZ = -15 + cr * 8;
            var carBody = new THREE.BoxGeometry(2, 2, 4);
            addMesh(carBody, carMat, 0, 1, carZ);

            for (var w = 0; w < 4; w++) {
                var wheelX = (w < 2) ? -0.8 : 0.8;
                var wheelZ = carZ + (w % 2 === 0 ? -1 : 1);
                var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
                addMesh(wheelGeo, railMat, wheelX, 0.6, wheelZ);
            }

            for (var load = 0; load < 3; load++) {
                var loadGeo = new THREE.BoxGeometry(1.5, 1, 1);
                addMesh(loadGeo, new THREE.MeshLambertMaterial({ color: 0x333322 }), (load - 1) * 0.7, 2.5, carZ);
            }
        }
    }

    function buildSmokeStacks() {
        var stackMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var smokeMat = new THREE.MeshLambertMaterial({ color: 0x555544 });

        var stackPositions = [
            { x: -12, z: 8 },
            { x: 12, z: 8 }
        ];

        for (var st = 0; st < stackPositions.length; st++) {
            var stackPos = stackPositions[st];

            var stackGeo = new THREE.CylinderGeometry(1.5, 1.5, 30, 12);
            addMesh(stackGeo, stackMat, stackPos.x, 15, stackPos.z);

            var capGeo = new THREE.ConeGeometry(1.8, 1, 12);
            addMesh(capGeo, stackMat, stackPos.x, 30.5, stackPos.z);

            for (var sm = 0; sm < 6; sm++) {
                var smokeGeo = new THREE.SphereGeometry(1.2, 10, 10);
                var smoke = addMesh(smokeGeo, smokeMat, stackPos.x + (Math.random() - 0.5) * 3, 31 + sm * 2, stackPos.z + (Math.random() - 0.5) * 2);
                smoke.userData.isSmoke = true;
                smoke.userData.baseY = 31 + sm * 2;
                smoke.userData.stackIndex = st;
                smoke.userData.startOffset = sm * 0.3;
                smokeParticles.push(smoke);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x442200, 0.5);
        addLight(ambientLight);

        var dirLight = new THREE.DirectionalLight(0xffaa44, 0.8);
        dirLight.position.set(-20, 25, 15);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        addLight(dirLight);

        var furnace1Glow = new THREE.PointLight(0xFF4400, 1.5, 25);
        furnace1Glow.position.set(-15, 23, 10);
        addLight(furnace1Glow);

        var furnace2Glow = new THREE.PointLight(0xFF4400, 1.5, 25);
        furnace2Glow.position.set(0, 23, 10);
        addLight(furnace2Glow);

        var furnace3Glow = new THREE.PointLight(0xFF4400, 1.5, 25);
        furnace3Glow.position.set(15, 23, 10);
        addLight(furnace3Glow);
    }

    function update(delta) {
        animationTime += delta;

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];

            if (obj.userData.isCokeChunk) {
                var progress = (animationTime * obj.userData.speed) % 1.0;
                obj.position.z = obj.userData.baseZ + progress * (obj.userData.endZ - obj.userData.baseZ);
            }

            if (obj.userData.isBarrier) {
                obj.rotation.z = Math.sin(animationTime * 2) * 0.3;
            }
        }

        for (var s = 0; s < smokeParticles.length; s++) {
            var particle = smokeParticles[s];
            var offset = (particle.userData.startTime || 0) + (particle.userData.startOffset || 0);
            var cycleTime = (animationTime + offset) % 4.0;
            var newY = particle.userData.baseY + Math.sin(cycleTime * Math.PI * 1.5) * 3;
            particle.position.y = newY;
            particle.scale.x = 1 + (cycleTime / 4.0) * 0.5;
            particle.scale.y = 1 + (cycleTime / 4.0) * 0.5;
            particle.scale.z = 1 + (cycleTime / 4.0) * 0.5;
            particle.material.opacity = Math.max(0, 1 - (cycleTime / 4.0));
        }

        for (var l = 0; l < lights.length; l++) {
            if (lights[l].userData && lights[l].userData.isGlowLight !== undefined) {
                var furnaceIndex = lights[l].userData.baseFurnaceIndex;
                lights[l].intensity = 1.5 + Math.sin(animationTime * 3 + furnaceIndex) * 0.5;
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
        smokeParticles = [];
        scene = null;
        camera = null;
        animationTime = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
