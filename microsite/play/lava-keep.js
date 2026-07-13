window.LavaKeep = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var pulsePhase = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        pulsePhase = 0;
        buildLavaField();
        buildKeepStructure();
        buildLavaChannels();
        buildBridges();
        buildDefenses();
        buildArsenal();
        buildVolcanoCore();
        buildRockFormations();
        buildCoolingFlows();
        setupLighting();
    }

    function buildLavaField() {
        var fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var baseGeometry = new THREE.BoxGeometry(120, 2, 120);
        var baseMesh = new THREE.Mesh(baseGeometry, fieldMaterial);
        baseMesh.position.y = -1;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        scene.add(baseMesh);
        objects.push(baseMesh);

        var crackMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600, emissive: 0xff3300 });
        var crackPositions = [
            [-40, 0.1, 0], [40, 0.1, 0], [0, 0.1, -40], [0, 0.1, 40],
            [-30, 0.1, -30], [30, 0.1, 30], [-30, 0.1, 30], [30, 0.1, -30],
            [-50, 0.1, -20], [50, 0.1, 20], [20, 0.1, -50], [-20, 0.1, 50]
        ];
        for (var i = 0; i < crackPositions.length; i++) {
            var crackGeo = new THREE.BoxGeometry(80, 0.2, 0.8);
            var crackMesh = new THREE.Mesh(crackGeo, crackMaterial);
            crackMesh.position.set(crackPositions[i][0], crackPositions[i][1], crackPositions[i][2]);
            if (i % 2 === 0) crackMesh.rotation.z = Math.PI / 4;
            scene.add(crackMesh);
            objects.push(crackMesh);
        }

        var impactPositions = [
            [-35, 0, 35], [35, 0, -35], [0, 0, 50], [-50, 0, 0]
        ];
        var impactMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        for (var i = 0; i < impactPositions.length; i++) {
            var impactGeo = new THREE.BoxGeometry(12, 0.5, 12);
            var impactMesh = new THREE.Mesh(impactGeo, impactMaterial);
            impactMesh.position.set(impactPositions[i][0], impactPositions[i][1], impactPositions[i][2]);
            scene.add(impactMesh);
            objects.push(impactMesh);
        }
    }

    function buildKeepStructure() {
        var obsidianMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var mainTowerGeo = new THREE.BoxGeometry(24, 45, 24);
        var mainTowerMesh = new THREE.Mesh(mainTowerGeo, obsidianMaterial);
        mainTowerMesh.position.set(0, 22, 0);
        mainTowerMesh.castShadow = true;
        mainTowerMesh.receiveShadow = true;
        scene.add(mainTowerMesh);
        objects.push(mainTowerMesh);

        var roofGeo = new THREE.ConeGeometry(16, 12, 8);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x151515 });
        var roofMesh = new THREE.Mesh(roofGeo, roofMaterial);
        roofMesh.position.set(0, 50, 0);
        roofMesh.castShadow = true;
        scene.add(roofMesh);
        objects.push(roofMesh);

        var roofPeakGeo = new THREE.CylinderGeometry(3, 3, 8, 6);
        var roofPeakMesh = new THREE.Mesh(roofPeakGeo, obsidianMaterial);
        roofPeakMesh.position.set(0, 56, 0);
        roofPeakMesh.castShadow = true;
        scene.add(roofPeakMesh);
        objects.push(roofPeakMesh);

        var rampartDim = [
            {x: 35, z: 0}, {x: -35, z: 0}, {x: 0, z: 35}, {x: 0, z: -35},
            {x: 25, z: 25}, {x: -25, z: 25}, {x: 25, z: -25}, {x: -25, z: -25}
        ];
        for (var i = 0; i < rampartDim.length; i++) {
            var rampartGeo = new THREE.BoxGeometry(5, 8, 5);
            var rampartMesh = new THREE.Mesh(rampartGeo, obsidianMaterial);
            rampartMesh.position.set(rampartDim[i].x, 25, rampartDim[i].z);
            rampartMesh.castShadow = true;
            scene.add(rampartMesh);
            objects.push(rampartMesh);
        }

        var battlmentCount = 12;
        for (var i = 0; i < battlmentCount; i++) {
            var angle = (i / battlmentCount) * Math.PI * 2;
            var radius = 14;
            var bx = Math.cos(angle) * radius;
            var bz = Math.sin(angle) * radius;
            var battleGeo = new THREE.BoxGeometry(3, 6, 3);
            var battleMesh = new THREE.Mesh(battleGeo, obsidianMaterial);
            battleMesh.position.set(bx, 48, bz);
            battleMesh.castShadow = true;
            scene.add(battleMesh);
            objects.push(battleMesh);
        }
    }

    function buildLavaChannels() {
        var channelPositions = [
            [0, 0, 0], [30, 0, 30], [-30, 0, -30], [40, 0, -40], [-40, 0, 40],
            [50, 0, 0], [-50, 0, 0], [0, 0, 50], [0, 0, -50]
        ];

        for (var i = 0; i < channelPositions.length; i++) {
            var channelWallsMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var leftWallGeo = new THREE.BoxGeometry(0.8, 8, 25);
            var leftWallMesh = new THREE.Mesh(leftWallGeo, channelWallsMat);
            leftWallMesh.position.set(channelPositions[i][0] - 2, 4, channelPositions[i][2]);
            scene.add(leftWallMesh);
            objects.push(leftWallMesh);

            var rightWallGeo = new THREE.BoxGeometry(0.8, 8, 25);
            var rightWallMesh = new THREE.Mesh(rightWallGeo, channelWallsMat);
            rightWallMesh.position.set(channelPositions[i][0] + 2, 4, channelPositions[i][2]);
            scene.add(rightWallMesh);
            objects.push(rightWallMesh);

            var glowMat = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff2200 });
            var glowGeo = new THREE.SphereGeometry(1.2, 6, 6);
            var glowMesh = new THREE.Mesh(glowGeo, glowMat);
            glowMesh.position.set(channelPositions[i][0], 2, channelPositions[i][2]);
            scene.add(glowMesh);
            objects.push(glowMesh);
        }
    }

    function buildBridges() {
        var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var bridgePositions = [
            [0, 2, 0], [30, 2, 30], [-30, 2, -30], [40, 2, -40]
        ];

        for (var i = 0; i < bridgePositions.length; i++) {
            var planksPerBridge = 8;
            for (var j = 0; j < planksPerBridge; j++) {
                var plankGeo = new THREE.BoxGeometry(5, 0.5, 3);
                var plankMesh = new THREE.Mesh(plankGeo, bridgeMaterial);
                plankMesh.position.set(
                    bridgePositions[i][0] + (j - planksPerBridge / 2) * 3,
                    bridgePositions[i][1],
                    bridgePositions[i][2]
                );
                plankMesh.castShadow = true;
                plankMesh.receiveShadow = true;
                scene.add(plankMesh);
                objects.push(plankMesh);
            }

            var railMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var railLeftGeo = new THREE.BoxGeometry(0.4, 1.5, 24);
            var railLeftMesh = new THREE.Mesh(railLeftGeo, railMat);
            railLeftMesh.position.set(bridgePositions[i][0] - 3, 2.5, bridgePositions[i][2]);
            scene.add(railLeftMesh);
            objects.push(railLeftMesh);

            var railRightGeo = new THREE.BoxGeometry(0.4, 1.5, 24);
            var railRightMesh = new THREE.Mesh(railRightGeo, railMat);
            railRightMesh.position.set(bridgePositions[i][0] + 3, 2.5, bridgePositions[i][2]);
            scene.add(railRightMesh);
            objects.push(railRightMesh);
        }

        var ropeBridgeVertices = new Float32Array([
            -30, 5, -30, 30, 5, 30,
            -30, 3, -30, 30, 3, 30,
            -28, 4, -28, 28, 4, 28,
            -32, 4, -32, 32, 4, 32
        ]);
        var ropeBridgeGeo = new THREE.BufferGeometry();
        ropeBridgeGeo.setAttribute('position', new THREE.BufferAttribute(ropeBridgeVertices, 3));
        var ropeBridgeIndices = new Uint16Array([0, 1, 2, 3, 4, 5, 6, 7]);
        ropeBridgeGeo.setIndex(new THREE.BufferAttribute(ropeBridgeIndices, 1));
        var ropeMat = new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 2 });
        var ropeBridgeMesh = new THREE.LineSegments(ropeBridgeGeo, ropeMat);
        scene.add(ropeBridgeMesh);
        objects.push(ropeBridgeMesh);
    }

    function buildDefenses() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var wallThickness = 1.5;
        var wallHeight = 15;
        var wallLength = 80;

        var northWallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
        var northWallMesh = new THREE.Mesh(northWallGeo, wallMaterial);
        northWallMesh.position.set(0, 7.5, -45);
        northWallMesh.castShadow = true;
        scene.add(northWallMesh);
        objects.push(northWallMesh);

        var southWallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
        var southWallMesh = new THREE.Mesh(southWallGeo, wallMaterial);
        southWallMesh.position.set(0, 7.5, 45);
        southWallMesh.castShadow = true;
        scene.add(southWallMesh);
        objects.push(southWallMesh);

        var eastWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
        var eastWallMesh = new THREE.Mesh(eastWallGeo, wallMaterial);
        eastWallMesh.position.set(45, 7.5, 0);
        eastWallMesh.castShadow = true;
        scene.add(eastWallMesh);
        objects.push(eastWallMesh);

        var westWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
        var westWallMesh = new THREE.Mesh(westWallGeo, wallMaterial);
        westWallMesh.position.set(-45, 7.5, 0);
        westWallMesh.castShadow = true;
        scene.add(westWallMesh);
        objects.push(westWallMesh);

        var cornerPositions = [
            [45, 8, 45], [-45, 8, 45], [45, 8, -45], [-45, 8, -45]
        ];
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        for (var i = 0; i < cornerPositions.length; i++) {
            var towerGeo = new THREE.CylinderGeometry(4, 5, 18, 8);
            var towerMesh = new THREE.Mesh(towerGeo, towerMaterial);
            towerMesh.position.set(cornerPositions[i][0], cornerPositions[i][1], cornerPositions[i][2]);
            towerMesh.castShadow = true;
            scene.add(towerMesh);
            objects.push(towerMesh);

            var towerCapGeo = new THREE.ConeGeometry(4, 6, 8);
            var towerCapMesh = new THREE.Mesh(towerCapGeo, towerMaterial);
            towerCapMesh.position.set(cornerPositions[i][0], cornerPositions[i][1] + 12, cornerPositions[i][2]);
            towerCapMesh.castShadow = true;
            scene.add(towerCapMesh);
            objects.push(towerCapMesh);
        }

        var rampartEnt = 16;
        for (var i = 0; i < rampartEnt; i++) {
            var rampGeo = new THREE.BoxGeometry(4, 2, 2);
            var rampMesh = new THREE.Mesh(rampGeo, wallMaterial);
            rampMesh.position.set(-40 + (i * 5), 15.5, -45);
            scene.add(rampMesh);
            objects.push(rampMesh);
        }

        for (var i = 0; i < rampartEnt; i++) {
            var rampGeo = new THREE.BoxGeometry(4, 2, 2);
            var rampMesh = new THREE.Mesh(rampGeo, wallMaterial);
            rampMesh.position.set(-40 + (i * 5), 15.5, 45);
            scene.add(rampMesh);
            objects.push(rampMesh);
        }
    }

    function buildArsenal() {
        var arsenalMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
        var arsenalGeo = new THREE.BoxGeometry(16, 20, 16);
        var arsenalMesh = new THREE.Mesh(arsenalGeo, arsenalMaterial);
        arsenalMesh.position.set(0, 10, 0);
        arsenalMesh.castShadow = true;
        scene.add(arsenalMesh);
        objects.push(arsenalMesh);

        var cageMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var rackCount = 12;
        for (var i = 0; i < rackCount; i++) {
            var angle = (i / rackCount) * Math.PI * 2;
            var x = Math.cos(angle) * 6;
            var z = Math.sin(angle) * 6;
            var rackGeo = new THREE.BoxGeometry(2, 12, 2);
            var rackMesh = new THREE.Mesh(rackGeo, cageMaterial);
            rackMesh.position.set(x, 10, z);
            scene.add(rackMesh);
            objects.push(rackMesh);
        }

        var shelfCount = 8;
        for (var i = 0; i < shelfCount; i++) {
            var shelfGeo = new THREE.BoxGeometry(10, 0.4, 10);
            var shelfMesh = new THREE.Mesh(shelfGeo, cageMaterial);
            shelfMesh.position.set(0, 6 + (i * 2), 0);
            scene.add(shelfMesh);
            objects.push(shelfMesh);
        }

        var chestCount = 6;
        var chestPositions = [
            [-5, 2, -5], [5, 2, -5], [0, 2, 5], [-5, 2, 5], [5, 2, 5], [0, 2, -5]
        ];
        for (var i = 0; i < chestCount; i++) {
            var chestGeo = new THREE.BoxGeometry(3, 2, 3);
            var chestMesh = new THREE.Mesh(chestGeo, arsenalMaterial);
            chestMesh.position.set(chestPositions[i][0], chestPositions[i][1], chestPositions[i][2]);
            scene.add(chestMesh);
            objects.push(chestMesh);
        }
    }

    function buildVolcanoCore() {
        var volcanoMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var baseGeo = new THREE.CylinderGeometry(35, 40, 8, 16);
        var baseMesh = new THREE.Mesh(baseGeo, volcanoMaterial);
        baseMesh.position.set(-60, 0, -60);
        baseMesh.castShadow = true;
        scene.add(baseMesh);
        objects.push(baseMesh);

        var peakGeo = new THREE.ConeGeometry(28, 40, 16);
        var peakMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        var peakMesh = new THREE.Mesh(peakGeo, peakMaterial);
        peakMesh.position.set(-60, 20, -60);
        peakMesh.castShadow = true;
        scene.add(peakMesh);
        objects.push(peakMesh);

        var craterGeo = new THREE.CylinderGeometry(12, 15, 4, 12);
        var craterMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var craterMesh = new THREE.Mesh(craterGeo, craterMaterial);
        craterMesh.position.set(-60, 38, -60);
        scene.add(craterMesh);
        objects.push(craterMesh);

        var lavaPoolGeo = new THREE.SphereGeometry(10, 8, 8);
        var lavaPoolMaterial = new THREE.MeshLambertMaterial({ color: 0xff3300, emissive: 0xff5500 });
        var lavaPoolMesh = new THREE.Mesh(lavaPoolGeo, lavaPoolMaterial);
        lavaPoolMesh.position.set(-60, 40, -60);
        scene.add(lavaPoolMesh);
        objects.push(lavaPoolMesh);

        var rimCount = 8;
        for (var i = 0; i < rimCount; i++) {
            var angle = (i / rimCount) * Math.PI * 2;
            var x = -60 + Math.cos(angle) * 14;
            var z = -60 + Math.sin(angle) * 14;
            var rimGeo = new THREE.BoxGeometry(3, 1.5, 3);
            var rimMesh = new THREE.Mesh(rimGeo, volcanoMaterial);
            rimMesh.position.set(x, 37, z);
            scene.add(rimMesh);
            objects.push(rimMesh);
        }
    }

    function buildRockFormations() {
        var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var rockPositions = [
            [30, 1, -50], [-30, 1, 50], [50, 1, 30], [-50, 1, -30],
            [45, 1, 45], [-45, 1, -45], [60, 1, 0], [-60, 1, 0]
        ];

        for (var i = 0; i < rockPositions.length; i++) {
            var clusterSize = 4;
            for (var j = 0; j < clusterSize; j++) {
                var size = 2 + Math.random() * 3;
                var rockGeo = new THREE.SphereGeometry(size, 5, 5);
                var rockMesh = new THREE.Mesh(rockGeo, rockMaterial);
                rockMesh.position.set(
                    rockPositions[i][0] + (Math.random() - 0.5) * 8,
                    rockPositions[i][1] + size,
                    rockPositions[i][2] + (Math.random() - 0.5) * 8
                );
                scene.add(rockMesh);
                objects.push(rockMesh);
            }
        }

        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var boulderPositions = [
            [20, 2, 0], [-20, 2, 0], [0, 2, 20], [0, 2, -20]
        ];
        for (var i = 0; i < boulderPositions.length; i++) {
            var boulderGeo = new THREE.BoxGeometry(6, 4, 6);
            var boulderMesh = new THREE.Mesh(boulderGeo, boulderMat);
            boulderMesh.position.set(boulderPositions[i][0], boulderPositions[i][1], boulderPositions[i][2]);
            scene.add(boulderMesh);
            objects.push(boulderMesh);
        }
    }

    function buildCoolingFlows() {
        var coolMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a3a });
        var flowPositions = [
            [35, 0, 25], [-35, 0, -25], [25, 0, -35], [-25, 0, 35]
        ];

        for (var i = 0; i < flowPositions.length; i++) {
            var flowGeo = new THREE.BoxGeometry(12, 2, 30);
            var flowMesh = new THREE.Mesh(flowGeo, coolMaterial);
            flowMesh.position.set(flowPositions[i][0], flowPositions[i][1], flowPositions[i][2]);
            scene.add(flowMesh);
            objects.push(flowMesh);

            var edgeMat = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff2200 });
            var edgeCount = 6;
            for (var j = 0; j < edgeCount; j++) {
                var edgeGeo = new THREE.SphereGeometry(1.5, 6, 6);
                var edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
                edgeMesh.position.set(
                    flowPositions[i][0] + (j - edgeCount / 2) * 4,
                    flowPositions[i][1] + 1.5,
                    flowPositions[i][2]
                );
                scene.add(edgeMesh);
                objects.push(edgeMesh);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x333333);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(30, 40, 30);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.left = -100;
        mainLight.shadow.camera.right = 100;
        mainLight.shadow.camera.top = 100;
        mainLight.shadow.camera.bottom = -100;
        scene.add(mainLight);
        lights.push(mainLight);

        var lavaGlowLight = new THREE.PointLight(0xff3300, 0.5, 100);
        lavaGlowLight.position.set(0, 5, 0);
        scene.add(lavaGlowLight);
        lights.push(lavaGlowLight);

        var volcanoCoreLight = new THREE.PointLight(0xff4400, 0.7, 150);
        volcanoCoreLight.position.set(-60, 40, -60);
        scene.add(volcanoCoreLight);
        lights.push(volcanoCoreLight);

        var keepLight = new THREE.PointLight(0xffccaa, 0.3, 80);
        keepLight.position.set(0, 50, 0);
        scene.add(keepLight);
        lights.push(keepLight);
    }

    function update(delta) {
        pulsePhase += delta;
        var pulseFactor = 0.5 + 0.5 * Math.sin(pulsePhase * 2);

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.material && obj.material.emissive) {
                if (obj.material.color.getHex() === 0xff4400 || obj.material.color.getHex() === 0xff3300 || obj.material.color.getHex() === 0xff6600) {
                    obj.material.emissiveIntensity = pulseFactor * 0.8;
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
        pulsePhase = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
