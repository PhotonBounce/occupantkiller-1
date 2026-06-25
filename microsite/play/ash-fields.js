window.AshFields = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var ashParticles = [];
    var emberLights = [];
    var animationTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        ashParticles = [];
        emberLights = [];
        animationTime = 0;

        buildCharredRuins();
        buildAshDrifts();
        buildEmberPits();
        buildTankHusks();
        buildDeadTrees();
        buildCollapsedBridge();
        buildCraterFields();
        buildMilitaryEquipment();
        buildAmbientLighting();
        buildAshParticles();
    }

    function buildCharredRuins() {
        var charcoalColor = 0x1a1a1a;
        var darkGrayColor = 0x2a2a2a;

        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
                var x = (c - 1.5) * 40;
                var z = (r - 1.5) * 40;
                var buildingHeight = Math.random() * 20 + 15;

                var mainWall = new THREE.Mesh(
                    new THREE.BoxGeometry(12, buildingHeight, 12),
                    new THREE.MeshLambertMaterial({ color: charcoalColor })
                );
                mainWall.position.set(x, buildingHeight / 2, z);
                mainWall.castShadow = true;
                mainWall.receiveShadow = true;
                scene.add(mainWall);
                objects.push(mainWall);

                var wallCount = Math.floor(Math.random() * 3) + 1;
                for (var w = 0; w < wallCount; w++) {
                    var wallX = x + (Math.random() - 0.5) * 20;
                    var wallZ = z + (Math.random() - 0.5) * 20;
                    var wallHeight = buildingHeight * (Math.random() * 0.6 + 0.4);
                    var wall = new THREE.Mesh(
                        new THREE.BoxGeometry(8, wallHeight, 3),
                        new THREE.MeshLambertMaterial({ color: darkGrayColor })
                    );
                    wall.position.set(wallX, wallHeight / 2, wallZ);
                    wall.rotation.y = Math.random() * Math.PI;
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    scene.add(wall);
                    objects.push(wall);
                }

                var roofBeamCount = Math.floor(Math.random() * 5) + 2;
                for (var b = 0; b < roofBeamCount; b++) {
                    var beamX = x + (Math.random() - 0.5) * 15;
                    var beamZ = z + (Math.random() - 0.5) * 15;
                    var beam = new THREE.Mesh(
                        new THREE.BoxGeometry(2, 1, 8),
                        new THREE.MeshLambertMaterial({ color: 0x0d0d0d })
                    );
                    beam.position.set(beamX, buildingHeight - 2, beamZ);
                    beam.rotation.z = Math.random() * 0.3;
                    beam.castShadow = true;
                    beam.receiveShadow = true;
                    scene.add(beam);
                    objects.push(beam);
                }
            }
        }
    }

    function buildAshDrifts() {
        var ashWhite = 0xe8e8e8;
        var lightGray = 0xcccccc;
        var driftCount = 12;

        for (var d = 0; d < driftCount; d++) {
            var driftX = (Math.random() - 0.5) * 150;
            var driftZ = (Math.random() - 0.5) * 150;
            var driftSize = Math.random() * 3 + 2;
            var sphereCount = Math.floor(Math.random() * 8) + 5;

            for (var s = 0; s < sphereCount; s++) {
                var offsetX = (Math.random() - 0.5) * 15;
                var offsetZ = (Math.random() - 0.5) * 15;
                var offsetY = s * 1.5;
                var sphereRadius = Math.random() * 2 + 1;
                var color = Math.random() > 0.5 ? ashWhite : lightGray;

                var ashSphere = new THREE.Mesh(
                    new THREE.SphereGeometry(sphereRadius, 8, 8),
                    new THREE.MeshLambertMaterial({ color: color })
                );
                ashSphere.position.set(driftX + offsetX, offsetY + 0.5, driftZ + offsetZ);
                ashSphere.castShadow = true;
                ashSphere.receiveShadow = true;
                scene.add(ashSphere);
                objects.push(ashSphere);
                ashParticles.push({
                    mesh: ashSphere,
                    baseY: ashSphere.position.y,
                    speed: Math.random() * 0.01 + 0.005
                });
            }
        }
    }

    function buildEmberPits() {
        var emberOrange = 0xff4500;
        var emberRed = 0xcc2200;
        var pitCount = 18;

        for (var p = 0; p < pitCount; p++) {
            var pitX = (Math.random() - 0.5) * 140;
            var pitZ = (Math.random() - 0.5) * 140;
            var pitSize = Math.random() * 1.5 + 0.8;

            var emberBox = new THREE.Mesh(
                new THREE.BoxGeometry(pitSize, 0.8, pitSize),
                new THREE.MeshLambertMaterial({ color: emberRed, emissive: 0x660000 })
            );
            emberBox.position.set(pitX, 0.4, pitZ);
            emberBox.castShadow = true;
            emberBox.receiveShadow = true;
            scene.add(emberBox);
            objects.push(emberBox);

            var emberLight = new THREE.PointLight(emberOrange, 1.5, 20);
            emberLight.position.set(pitX, 2, pitZ);
            scene.add(emberLight);
            lights.push(emberLight);
            emberLights.push({
                light: emberLight,
                baseIntensity: 1.5,
                index: emberLights.length
            });

            var emberEmissive = new THREE.Mesh(
                new THREE.BoxGeometry(pitSize * 0.6, 0.3, pitSize * 0.6),
                new THREE.MeshLambertMaterial({ color: emberOrange, emissive: emberOrange })
            );
            emberEmissive.position.set(pitX, 0.8, pitZ);
            scene.add(emberEmissive);
            objects.push(emberEmissive);
        }
    }

    function buildTankHusks() {
        var tankBlack = 0x0a0a0a;
        var tankGray = 0x1f1f1f;
        var tankOrange = 0xff6600;
        var tankCount = 6;

        for (var t = 0; t < tankCount; t++) {
            var tankX = (Math.random() - 0.5) * 120;
            var tankZ = (Math.random() - 0.5) * 120;
            var tankRotation = Math.random() * Math.PI * 2;

            var hull = new THREE.Mesh(
                new THREE.BoxGeometry(6, 3, 10),
                new THREE.MeshLambertMaterial({ color: tankBlack })
            );
            hull.position.set(tankX, 1.5, tankZ);
            hull.rotation.y = tankRotation;
            hull.castShadow = true;
            hull.receiveShadow = true;
            scene.add(hull);
            objects.push(hull);

            var turret = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.8, 2, 6),
                new THREE.MeshLambertMaterial({ color: tankGray })
            );
            turret.position.set(tankX, 3.2, tankZ);
            turret.rotation.z = Math.random() * 0.4 - 0.2;
            turret.castShadow = true;
            turret.receiveShadow = true;
            scene.add(turret);
            objects.push(turret);

            var barrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.4, 6, 4),
                new THREE.MeshLambertMaterial({ color: tankBlack })
            );
            barrel.position.set(tankX, 3.2, tankZ + 3);
            barrel.rotation.x = Math.random() * 0.3 - 0.15;
            barrel.castShadow = true;
            barrel.receiveShadow = true;
            scene.add(barrel);
            objects.push(barrel);

            for (var g = 0; g < 3; g++) {
                var glowBox = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.4, 0.8),
                    new THREE.MeshLambertMaterial({ color: tankOrange, emissive: 0x330000 })
                );
                glowBox.position.set(
                    tankX + (Math.random() - 0.5) * 5,
                    2 + Math.random() * 2,
                    tankZ + (Math.random() - 0.5) * 8
                );
                scene.add(glowBox);
                objects.push(glowBox);
            }
        }
    }

    function buildDeadTrees() {
        var charcoal = 0x1a1a1a;
        var darkBark = 0x0d0d0d;
        var treeCount = 25;

        for (var tr = 0; tr < treeCount; tr++) {
            var treeX = (Math.random() - 0.5) * 140;
            var treeZ = (Math.random() - 0.5) * 140;
            var treeHeight = Math.random() * 15 + 10;
            var treeRadius = Math.random() * 0.3 + 0.15;

            var trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(treeRadius, treeRadius * 1.2, treeHeight, 4),
                new THREE.MeshLambertMaterial({ color: darkBark })
            );
            trunk.position.set(treeX, treeHeight / 2, treeZ);
            trunk.rotation.z = (Math.random() - 0.5) * 0.15;
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            scene.add(trunk);
            objects.push(trunk);

            for (var b = 0; b < 2; b++) {
                var branchHeight = treeHeight * (0.3 + Math.random() * 0.5);
                var branchLength = Math.random() * 4 + 2;
                var branchRadius = treeRadius * 0.6;
                var branch = new THREE.Mesh(
                    new THREE.CylinderGeometry(branchRadius, branchRadius * 0.5, branchLength, 3),
                    new THREE.MeshLambertMaterial({ color: charcoal })
                );
                branch.position.set(
                    treeX + branchLength * 0.4,
                    branchHeight,
                    treeZ + branchLength * 0.3
                );
                branch.rotation.z = Math.random() * 0.6;
                branch.rotation.x = Math.random() * 0.4;
                branch.castShadow = true;
                branch.receiveShadow = true;
                scene.add(branch);
                objects.push(branch);
            }
        }
    }

    function buildCollapsedBridge() {
        var concreteGray = 0x333333;
        var rustBrown = 0x6b4423;
        var bridgeX = -40;
        var bridgeZ = -60;
        var bridgeLength = 60;
        var bridgeWidth = 12;
        var bridgeHeight = 2;

        var bridgeDeck = new THREE.Mesh(
            new THREE.BoxGeometry(bridgeWidth, bridgeHeight, bridgeLength),
            new THREE.MeshLambertMaterial({ color: concreteGray })
        );
        bridgeDeck.position.set(bridgeX, 3, bridgeZ);
        bridgeDeck.rotation.z = 0.15;
        bridgeDeck.castShadow = true;
        bridgeDeck.receiveShadow = true;
        scene.add(bridgeDeck);
        objects.push(bridgeDeck);

        for (var s = 0; s < 6; s++) {
            var supportX = bridgeX + (s - 2.5) * 12;
            var support = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, Math.random() * 3 + 2, 3),
                new THREE.MeshLambertMaterial({ color: rustBrown })
            );
            support.position.set(supportX, support.geometry.parameters.height / 2, bridgeZ);
            support.castShadow = true;
            support.receiveShadow = true;
            scene.add(support);
            objects.push(support);
        }

        for (var c = 0; c < 8; c++) {
            var cableX = bridgeX + (Math.random() - 0.5) * 8;
            var cableZ = bridgeZ + (Math.random() - 0.5) * 50;
            var cablePiece = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, Math.random() * 8 + 4, 3),
                new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
            );
            cablePiece.position.set(cableX, Math.random() * 5 + 6, cableZ);
            cablePiece.rotation.x = Math.random() * Math.PI;
            cablePiece.castShadow = true;
            scene.add(cablePiece);
            objects.push(cablePiece);
        }
    }

    function buildCraterFields() {
        var craterCount = 8;
        var darkRed = 0x330000;
        var craterDarkGray = 0x1f1f1f;

        for (var cr = 0; cr < craterCount; cr++) {
            var craterX = (Math.random() - 0.5) * 130;
            var craterZ = (Math.random() - 0.5) * 130;
            var craterRadius = Math.random() * 8 + 4;
            var craterDepth = Math.random() * 6 + 3;

            var craterCone = new THREE.Mesh(
                new THREE.ConeGeometry(craterRadius, craterDepth, 12),
                new THREE.MeshLambertMaterial({ color: darkRed })
            );
            craterCone.position.set(craterX, -craterDepth / 2 + 0.5, craterZ);
            craterCone.scale.y = -1;
            craterCone.castShadow = true;
            craterCone.receiveShadow = true;
            scene.add(craterCone);
            objects.push(craterCone);

            for (var rc = 0; rc < 4; rc++) {
                var rimAngle = (rc / 4) * Math.PI * 2;
                var rimX = craterX + Math.cos(rimAngle) * craterRadius;
                var rimZ = craterZ + Math.sin(rimAngle) * craterRadius;
                var rimPiece = new THREE.Mesh(
                    new THREE.BoxGeometry(3, 1.5, 3),
                    new THREE.MeshLambertMaterial({ color: craterDarkGray })
                );
                rimPiece.position.set(rimX, 0.75, rimZ);
                rimPiece.castShadow = true;
                rimPiece.receiveShadow = true;
                scene.add(rimPiece);
                objects.push(rimPiece);
            }
        }
    }

    function buildMilitaryEquipment() {
        var equipmentCount = 10;
        var steelGray = 0x404040;
        var darkMetal = 0x1a1a1a;

        for (var eq = 0; eq < equipmentCount; eq++) {
            var equipX = (Math.random() - 0.5) * 140;
            var equipZ = (Math.random() - 0.5) * 140;
            var equipType = Math.floor(Math.random() * 3);

            if (equipType === 0) {
                var turretBase = new THREE.Mesh(
                    new THREE.CylinderGeometry(2, 2.5, 1.5, 8),
                    new THREE.MeshLambertMaterial({ color: steelGray })
                );
                turretBase.position.set(equipX, 0.75, equipZ);
                turretBase.castShadow = true;
                turretBase.receiveShadow = true;
                scene.add(turretBase);
                objects.push(turretBase);

                var gunMount = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 2, 4),
                    new THREE.MeshLambertMaterial({ color: darkMetal })
                );
                gunMount.position.set(equipX, 2, equipZ);
                gunMount.rotation.z = Math.random() * 0.5 - 0.25;
                gunMount.castShadow = true;
                gunMount.receiveShadow = true;
                scene.add(gunMount);
                objects.push(gunMount);
            } else if (equipType === 1) {
                var crateStack = new THREE.Mesh(
                    new THREE.BoxGeometry(2.5, 3, 2.5),
                    new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
                );
                crateStack.position.set(equipX, 1.5, equipZ);
                crateStack.castShadow = true;
                crateStack.receiveShadow = true;
                scene.add(crateStack);
                objects.push(crateStack);

                for (var cl = 0; cl < 2; cl++) {
                    var crateLid = new THREE.Mesh(
                        new THREE.BoxGeometry(2.5, 0.2, 2.5),
                        new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
                    );
                    crateLid.position.set(equipX, 3.2 + cl * 1.5, equipZ);
                    scene.add(crateLid);
                    objects.push(crateLid);
                }
            } else {
                var radarDish = new THREE.Mesh(
                    new THREE.SphereGeometry(1.8, 6, 6),
                    new THREE.MeshLambertMaterial({ color: steelGray })
                );
                radarDish.position.set(equipX, 2, equipZ);
                radarDish.scale.set(1, 0.4, 1);
                radarDish.castShadow = true;
                radarDish.receiveShadow = true;
                scene.add(radarDish);
                objects.push(radarDish);

                var radarPole = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.3, 4, 3),
                    new THREE.MeshLambertMaterial({ color: darkMetal })
                );
                radarPole.position.set(equipX, 4, equipZ);
                radarPole.castShadow = true;
                radarPole.receiveShadow = true;
                scene.add(radarPole);
                objects.push(radarPole);
            }
        }
    }

    function buildAmbientLighting() {
        var ambientLight = new THREE.AmbientLight(0x444444);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffa500, 0.8);
        directionalLight.position.set(100, 80, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -150;
        directionalLight.shadow.camera.right = 150;
        directionalLight.shadow.camera.top = 150;
        directionalLight.shadow.camera.bottom = -150;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function buildAshParticles() {
        var ashWhite = 0xd0d0d0;
        var particleCount = 80;

        for (var ap = 0; ap < particleCount; ap++) {
            var particleX = (Math.random() - 0.5) * 160;
            var particleY = Math.random() * 40 + 5;
            var particleZ = (Math.random() - 0.5) * 160;
            var particleSize = Math.random() * 0.3 + 0.1;

            var ashParticle = new THREE.Mesh(
                new THREE.SphereGeometry(particleSize, 4, 4),
                new THREE.MeshLambertMaterial({ color: ashWhite })
            );
            ashParticle.position.set(particleX, particleY, particleZ);
            ashParticle.castShadow = false;
            ashParticle.receiveShadow = false;
            scene.add(ashParticle);
            objects.push(ashParticle);
            ashParticles.push({
                mesh: ashParticle,
                baseY: particleY,
                speed: Math.random() * 0.008 + 0.003,
                driftX: (Math.random() - 0.5) * 0.02,
                driftZ: (Math.random() - 0.5) * 0.02
            });
        }
    }

    function update(delta) {
        animationTime += delta;

        for (var ap = 0; ap < ashParticles.length; ap++) {
            var particle = ashParticles[ap];
            if (particle.speed !== undefined) {
                particle.mesh.position.y = particle.baseY + Math.sin(animationTime * particle.speed) * 2;
                particle.mesh.position.x += particle.driftX;
                particle.mesh.position.z += particle.driftZ;

                if (particle.mesh.position.x > 100) particle.mesh.position.x = -100;
                if (particle.mesh.position.x < -100) particle.mesh.position.x = 100;
                if (particle.mesh.position.z > 100) particle.mesh.position.z = -100;
                if (particle.mesh.position.z < -100) particle.mesh.position.z = 100;
            }
        }

        for (var el = 0; el < emberLights.length; el++) {
            var emberLight = emberLights[el];
            var pulseIntensity = Math.sin(animationTime * (0.8 + el * 0.1)) * 0.3 + 0.7;
            emberLight.light.intensity = emberLight.baseIntensity * pulseIntensity;
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
        ashParticles = [];
        emberLights = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
