window.SaltMine = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var crystalRotations = [];
    var drippingParticles = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        crystalRotations = [];
        drippingParticles = [];
        buildMainTunnel();
        buildSaltWalls();
        buildCrystalFormations();
        buildMiningEquipment();
        buildExtractedBlocks();
        buildChamberRooms();
        buildWeaponsCache();
        buildLighting();
        buildPillarSupports();
        buildBrinePool();
        buildEmergencyExit();
        buildStorageRacks();
        buildVentShafts();
        buildSupportBeams();
        buildDecorations();
    }

    function buildMainTunnel() {
        var tunnelLength = 200;
        var tunnelWidth = 25;
        var tunnelHeight = 20;

        var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var floorGeometry = new THREE.BoxGeometry(tunnelWidth, 1, tunnelLength);
        var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -tunnelHeight / 2 - 0.5;
        floor.receiveShadow = true;
        scene.add(floor);
        objects.push(floor);

        var ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var ceilingGeometry = new THREE.BoxGeometry(tunnelWidth, 1, tunnelLength);
        var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.position.y = tunnelHeight / 2 + 0.5;
        ceiling.receiveShadow = true;
        scene.add(ceiling);
        objects.push(ceiling);

        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f0 });
        var wallGeometry = new THREE.BoxGeometry(1, tunnelHeight, tunnelLength);

        var leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.position.x = -tunnelWidth / 2 - 0.5;
        leftWall.receiveShadow = true;
        scene.add(leftWall);
        objects.push(leftWall);

        var rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.position.x = tunnelWidth / 2 + 0.5;
        rightWall.receiveShadow = true;
        scene.add(rightWall);
        objects.push(rightWall);
    }

    function buildSaltWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0e8 });
        var saltCount = 35;

        for (var i = 0; i < saltCount; i++) {
            var x = Math.random() * 40 - 20;
            var z = Math.random() * 150 - 75;
            var y = Math.random() * 8 - 5;

            var rockGeometry = new THREE.BoxGeometry(2 + Math.random() * 3, 3 + Math.random() * 4, 1 + Math.random() * 2);
            var rock = new THREE.Mesh(rockGeometry, wallMaterial);
            rock.position.set(x, y, z);
            rock.rotation.z = Math.random() * Math.PI;
            rock.castShadow = true;
            rock.receiveShadow = true;
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildCrystalFormations() {
        var crystalCount = 60;
        var crystalMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5ff });
        var blueCrystalMaterial = new THREE.MeshLambertMaterial({ color: 0xe8f0ff });

        for (var i = 0; i < crystalCount; i++) {
            var x = Math.random() * 50 - 25;
            var z = Math.random() * 180 - 90;
            var y = Math.random() * 12 - 6;

            var sphereGeometry = new THREE.SphereGeometry(0.8, 8, 8);
            var sphere = new THREE.Mesh(sphereGeometry, i % 3 === 0 ? blueCrystalMaterial : crystalMaterial);
            sphere.position.set(x, y, z);
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            scene.add(sphere);
            objects.push(sphere);
            crystalRotations.push({ mesh: sphere, speed: 0.5 + Math.random() });

            var coneGeometry = new THREE.ConeGeometry(0.6, 2.5, 6);
            var cone = new THREE.Mesh(coneGeometry, crystalMaterial);
            cone.position.set(x + 1.2, y + 1.5, z);
            cone.rotation.x = Math.random() * Math.PI * 2;
            cone.castShadow = true;
            cone.receiveShadow = true;
            scene.add(cone);
            objects.push(cone);
        }
    }

    function buildMiningEquipment() {
        var equipMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var baseX = -15;
        var baseZ = 0;

        var drillCylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
        var drillCylinder = new THREE.Mesh(drillCylinderGeometry, equipMaterial);
        drillCylinder.position.set(baseX, 0, baseZ);
        drillCylinder.castShadow = true;
        drillCylinder.receiveShadow = true;
        scene.add(drillCylinder);
        objects.push(drillCylinder);

        var drillHeadGeometry = new THREE.ConeGeometry(1.2, 1.5, 8);
        var drillHead = new THREE.Mesh(drillHeadGeometry, equipMaterial);
        drillHead.position.set(baseX, 2.25, baseZ);
        drillHead.castShadow = true;
        drillHead.receiveShadow = true;
        scene.add(drillHead);
        objects.push(drillHead);

        var drillBaseGeometry = new THREE.BoxGeometry(4, 0.8, 4);
        var drillBase = new THREE.Mesh(drillBaseGeometry, equipMaterial);
        drillBase.position.set(baseX, -2, baseZ);
        drillBase.castShadow = true;
        drillBase.receiveShadow = true;
        scene.add(drillBase);
        objects.push(drillBase);

        var cartX = baseX + 12;
        var cartGeometry = new THREE.BoxGeometry(3, 2, 6);
        var cart = new THREE.Mesh(cartGeometry, new THREE.MeshLambertMaterial({ color: 0x704030 }));
        cart.position.set(cartX, 1, baseZ);
        cart.castShadow = true;
        cart.receiveShadow = true;
        scene.add(cart);
        objects.push(cart);

        var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 12);
        var wheelPositions = [
            { x: cartX - 1, z: baseZ - 3 },
            { x: cartX - 1, z: baseZ + 3 },
            { x: cartX + 1, z: baseZ - 3 },
            { x: cartX + 1, z: baseZ + 3 }
        ];

        for (var w = 0; w < wheelPositions.length; w++) {
            var wheelPos = wheelPositions[w];
            var wheel = new THREE.Mesh(wheelGeometry, equipMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(wheelPos.x, 0.8, wheelPos.z);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            scene.add(wheel);
            objects.push(wheel);
        }
    }

    function buildExtractedBlocks() {
        var blockMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var stackX = 12;
        var stackZ = -20;
        var blockSize = 1.5;
        var blockCount = 0;

        for (var layer = 0; layer < 4; layer++) {
            for (var row = 0; row < 3; row++) {
                for (var col = 0; col < 3; col++) {
                    var blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
                    var block = new THREE.Mesh(blockGeometry, blockMaterial);
                    block.position.set(
                        stackX + col * blockSize,
                        layer * blockSize - 5,
                        stackZ + row * blockSize
                    );
                    block.castShadow = true;
                    block.receiveShadow = true;
                    scene.add(block);
                    objects.push(block);
                    blockCount++;
                }
            }
        }
    }

    function buildChamberRooms() {
        var chambersData = [
            { x: -25, z: 30, name: 'north' },
            { x: 25, z: 30, name: 'northeast' },
            { x: -25, z: -30, name: 'south' },
            { x: 25, z: -30, name: 'southeast' }
        ];

        var chamberMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f0 });
        var entranceMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

        for (var c = 0; c < chambersData.length; c++) {
            var chamber = chambersData[c];
            var chamberWidth = 15;
            var chamberHeight = 18;
            var chamberDepth = 12;

            var wallGeometry = new THREE.BoxGeometry(1, chamberHeight, chamberDepth);
            var leftChamberWall = new THREE.Mesh(wallGeometry, chamberMaterial);
            leftChamberWall.position.set(chamber.x - chamberWidth / 2, 0, chamber.z);
            leftChamberWall.castShadow = true;
            leftChamberWall.receiveShadow = true;
            scene.add(leftChamberWall);
            objects.push(leftChamberWall);

            var rightChamberWall = new THREE.Mesh(wallGeometry, chamberMaterial);
            rightChamberWall.position.set(chamber.x + chamberWidth / 2, 0, chamber.z);
            rightChamberWall.castShadow = true;
            rightChamberWall.receiveShadow = true;
            scene.add(rightChamberWall);
            objects.push(rightChamberWall);

            var backWallGeometry = new THREE.BoxGeometry(chamberWidth, chamberHeight, 1);
            var backChamberWall = new THREE.Mesh(backWallGeometry, chamberMaterial);
            backChamberWall.position.set(chamber.x, 0, chamber.z + chamberDepth / 2);
            backChamberWall.castShadow = true;
            backChamberWall.receiveShadow = true;
            scene.add(backChamberWall);
            objects.push(backChamberWall);

            var entranceGeometry = new THREE.BoxGeometry(4, 6, 1);
            var entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
            entrance.position.set(chamber.x, 0, chamber.z - chamberDepth / 2);
            entrance.castShadow = true;
            entrance.receiveShadow = true;
            scene.add(entrance);
            objects.push(entrance);

            var floorGeometry = new THREE.BoxGeometry(chamberWidth, 0.5, chamberDepth);
            var chamberFloor = new THREE.Mesh(floorGeometry, new THREE.MeshLambertMaterial({ color: 0x3a3a2a }));
            chamberFloor.position.set(chamber.x, -chamberHeight / 2 - 1, chamber.z);
            chamberFloor.castShadow = true;
            chamberFloor.receiveShadow = true;
            scene.add(chamberFloor);
            objects.push(chamberFloor);
        }
    }

    function buildWeaponsCache() {
        var cacheX = 20;
        var cacheZ = 60;
        var ammoBoxMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var barreMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 4; col++) {
                var boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                var ammoBox = new THREE.Mesh(boxGeometry, ammoBoxMaterial);
                ammoBox.position.set(
                    cacheX - 3 + col * 2,
                    -5 + row * 2,
                    cacheZ
                );
                ammoBox.castShadow = true;
                ammoBox.receiveShadow = true;
                scene.add(ammoBox);
                objects.push(ammoBox);
            }
        }

        for (var b = 0; b < 5; b++) {
            var barrelGeometry = new THREE.CylinderGeometry(1, 1, 2.5, 16);
            var barrel = new THREE.Mesh(barrelGeometry, barreMaterial);
            barrel.position.set(cacheX + 8, -4 + b * 1.2, cacheZ);
            barrel.castShadow = true;
            barrel.receiveShadow = true;
            scene.add(barrel);
            objects.push(barrel);
        }
    }

    function buildLighting() {
        var lightCount = 60;
        var stripMaterial = new THREE.MeshLambertMaterial({ color: 0xffffcc });

        for (var i = 0; i < lightCount; i++) {
            var x = Math.random() * 40 - 20;
            var z = Math.random() * 180 - 90;
            var y = 8;

            var stripGeometry = new THREE.BoxGeometry(6, 0.3, 0.3);
            var strip = new THREE.Mesh(stripGeometry, stripMaterial);
            strip.position.set(x, y, z);
            strip.castShadow = true;
            strip.receiveShadow = true;
            scene.add(strip);
            objects.push(strip);

            var pointLight = new THREE.PointLight(0xffffcc, 1.2, 25);
            pointLight.position.set(x, y - 0.5, z);
            pointLight.castShadow = true;
            scene.add(pointLight);
            lights.push(pointLight);

            var glowGeometry = new THREE.SphereGeometry(0.4, 8, 8);
            var glowMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
            var glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
            glowSphere.position.set(x, y, z);
            scene.add(glowSphere);
            objects.push(glowSphere);
        }

        var ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function buildPillarSupports() {
        var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0e8 });
        var pillarPositions = [
            { x: -15, z: -50 },
            { x: 0, z: -30 },
            { x: 15, z: -50 },
            { x: -15, z: 0 },
            { x: 15, z: 0 },
            { x: -15, z: 50 },
            { x: 0, z: 70 },
            { x: 15, z: 50 }
        ];

        for (var p = 0; p < pillarPositions.length; p++) {
            var pos = pillarPositions[p];
            var pillarGeometry = new THREE.CylinderGeometry(1.5, 1.5, 18, 12);
            var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pos.x, 0, pos.z);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            scene.add(pillar);
            objects.push(pillar);

            var capGeometry = new THREE.SphereGeometry(1.6, 8, 8);
            var capMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5ff });
            var cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.set(pos.x, 9, pos.z);
            cap.scale.set(1, 0.4, 1);
            cap.castShadow = true;
            cap.receiveShadow = true;
            scene.add(cap);
            objects.push(cap);
        }
    }

    function buildBrinePool() {
        var poolX = 0;
        var poolZ = -80;
        var poolWidth = 18;
        var poolDepth = 16;

        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
        var waterGeometry = new THREE.BoxGeometry(poolWidth, 0.5, poolDepth);
        var water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.set(poolX, -7, poolZ);
        water.receiveShadow = true;
        scene.add(water);
        objects.push(water);

        var saltCrystalMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5ff });
        var surfaceCrystalCount = 40;

        for (var s = 0; s < surfaceCrystalCount; s++) {
            var crystalX = poolX + (Math.random() - 0.5) * poolWidth;
            var crystalZ = poolZ + (Math.random() - 0.5) * poolDepth;

            var surfaceCrystalGeometry = new THREE.SphereGeometry(0.5, 6, 6);
            var surfaceCrystal = new THREE.Mesh(surfaceCrystalGeometry, saltCrystalMaterial);
            surfaceCrystal.position.set(crystalX, -6.5, crystalZ);
            surfaceCrystal.castShadow = true;
            surfaceCrystal.receiveShadow = true;
            scene.add(surfaceCrystal);
            objects.push(surfaceCrystal);

            drippingParticles.push({
                mesh: surfaceCrystal,
                startY: -6.5,
                currentY: -6.5,
                speed: 0.02 + Math.random() * 0.03,
                resetY: -6.5
            });
        }

        var poolEdgeMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0e8 });
        var edgeGeometry = new THREE.BoxGeometry(poolWidth + 2, 1, poolDepth + 2);
        var edge = new THREE.Mesh(edgeGeometry, poolEdgeMaterial);
        edge.position.set(poolX, -7.8, poolZ);
        edge.castShadow = true;
        edge.receiveShadow = true;
        scene.add(edge);
        objects.push(edge);
    }

    function buildEmergencyExit() {
        var exitX = 18;
        var exitZ = 85;
        var ladderMaterial = new THREE.MeshLambertMaterial({ color: 0xb8860b });
        var exitTunnelMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

        var tunnelGeometry = new THREE.CylinderGeometry(2.5, 2.5, 15, 8);
        var tunnel = new THREE.Mesh(tunnelGeometry, exitTunnelMaterial);
        tunnel.position.set(exitX, 4, exitZ);
        tunnel.castShadow = true;
        tunnel.receiveShadow = true;
        scene.add(tunnel);
        objects.push(tunnel);

        var rungCount = 10;
        for (var r = 0; r < rungCount; r++) {
            var rungGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2.2, 8);
            var rung = new THREE.Mesh(rungGeometry, ladderMaterial);
            rung.rotation.z = Math.PI / 2;
            rung.position.set(exitX, -2 + r * 1.4, exitZ);
            rung.castShadow = true;
            rung.receiveShadow = true;
            scene.add(rung);
            objects.push(rung);
        }

        var sideCount = 2;
        for (var side = 0; side < sideCount; side++) {
            var sideX = exitX + (side === 0 ? -1.2 : 1.2);
            var points = [
                new THREE.Vector3(sideX, -2, exitZ),
                new THREE.Vector3(sideX, 12, exitZ)
            ];
            var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            var line = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0xb8860b }));
            scene.add(line);
            objects.push(line);
        }
    }

    function buildStorageRacks() {
        var rackMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var crateColor = new THREE.MeshLambertMaterial({ color: 0x8b7355 });

        for (var rack = 0; rack < 5; rack++) {
            var rackX = -25 + rack * 12;
            var rackZ = -60;

            for (var level = 0; level < 3; level++) {
                var shelfGeometry = new THREE.BoxGeometry(6, 0.3, 2);
                var shelf = new THREE.Mesh(shelfGeometry, rackMaterial);
                shelf.position.set(rackX, -3 + level * 2.5, rackZ);
                shelf.castShadow = true;
                shelf.receiveShadow = true;
                scene.add(shelf);
                objects.push(shelf);

                for (var crate = 0; crate < 3; crate++) {
                    var crateGeometry = new THREE.BoxGeometry(1.8, 1.5, 1.5);
                    var crateBox = new THREE.Mesh(crateGeometry, crateColor);
                    crateBox.position.set(rackX - 2 + crate * 2, -2.5 + level * 2.5, rackZ);
                    crateBox.castShadow = true;
                    crateBox.receiveShadow = true;
                    scene.add(crateBox);
                    objects.push(crateBox);
                }
            }
        }
    }

    function buildVentShafts() {
        var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var grilMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });

        for (var vent = 0; vent < 12; vent++) {
            var ventX = -30 + vent * 5;
            var ventZ = 40;

            var shaftGeometry = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
            var shaft = new THREE.Mesh(shaftGeometry, ventMaterial);
            shaft.position.set(ventX, 6, ventZ);
            shaft.castShadow = true;
            shaft.receiveShadow = true;
            scene.add(shaft);
            objects.push(shaft);

            var grilGeometry = new THREE.BoxGeometry(1.8, 0.2, 1.8);
            var gril = new THREE.Mesh(grilGeometry, grilMaterial);
            gril.position.set(ventX, 8.3, ventZ);
            gril.castShadow = true;
            gril.receiveShadow = true;
            scene.add(gril);
            objects.push(gril);

            for (var bar = 0; bar < 5; bar++) {
                var barGeometry = new THREE.BoxGeometry(0.1, 1.6, 0.1);
                var barA = new THREE.Mesh(barGeometry, grilMaterial);
                barA.rotation.z = Math.PI / 4;
                barA.position.set(ventX - 0.4 + bar * 0.2, 6.5, ventZ);
                barA.castShadow = true;
                barA.receiveShadow = true;
                scene.add(barA);
                objects.push(barA);
            }
        }
    }

    function buildSupportBeams() {
        var beamMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });

        for (var beam = 0; beam < 6; beam++) {
            var beamX = -15 + beam * 6;
            var beamZ = 20;

            var beamGeometry = new THREE.BoxGeometry(0.5, 12, 0.5);
            var vertBeam = new THREE.Mesh(beamGeometry, beamMaterial);
            vertBeam.position.set(beamX, 0, beamZ);
            vertBeam.castShadow = true;
            vertBeam.receiveShadow = true;
            scene.add(vertBeam);
            objects.push(vertBeam);

            var boltGeometry = new THREE.SphereGeometry(0.15, 6, 6);
            for (var bolt = 0; bolt < 3; bolt++) {
                var boltMesh = new THREE.Mesh(boltGeometry, beamMaterial);
                boltMesh.position.set(beamX, -3 + bolt * 6, beamZ);
                boltMesh.castShadow = true;
                boltMesh.receiveShadow = true;
                scene.add(boltMesh);
                objects.push(boltMesh);
            }
        }
    }

    function buildDecorations() {
        var decMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5ff });
        var signMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });

        for (var sign = 0; sign < 5; sign++) {
            var signX = -15 + sign * 8;
            var signZ = -75;

            var signGeometry = new THREE.BoxGeometry(2.5, 1.5, 0.2);
            var signBoard = new THREE.Mesh(signGeometry, signMaterial);
            signBoard.position.set(signX, 5, signZ);
            signBoard.castShadow = true;
            signBoard.receiveShadow = true;
            scene.add(signBoard);
            objects.push(signBoard);
        }

        for (var dec = 0; dec < 15; dec++) {
            var decX = Math.random() * 30 - 15;
            var decZ = Math.random() * 100 - 50;

            var decGeometry = new THREE.SphereGeometry(0.4, 6, 6);
            var decoration = new THREE.Mesh(decGeometry, decMaterial);
            decoration.position.set(decX, 7, decZ);
            decoration.castShadow = true;
            decoration.receiveShadow = true;
            scene.add(decoration);
            objects.push(decoration);
        }
    }

    function update(delta) {
        for (var c = 0; c < crystalRotations.length; c++) {
            var crystal = crystalRotations[c];
            crystal.mesh.rotation.x += crystal.speed * delta * 0.5;
            crystal.mesh.rotation.y += crystal.speed * delta * 0.3;
            crystal.mesh.position.y += Math.sin(crystal.mesh.rotation.y) * delta * 0.1;
        }

        for (var d = 0; d < drippingParticles.length; d++) {
            var drop = drippingParticles[d];
            drop.currentY -= drop.speed;
            if (drop.currentY < drop.startY - 3) {
                drop.currentY = drop.resetY;
            }
            drop.mesh.position.y = drop.currentY;
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
        crystalRotations = [];
        drippingParticles = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
