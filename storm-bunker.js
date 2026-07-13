window.StormBunker = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var radarMesh = null;
    var lightningBolts = [];
    var raindrops = [];
    var lightningActive = false;
    var lightningTimer = 0;
    var nextLightningTime = 0;
    var radarRotation = 0;
    var rainParticles = [];

    function addObject(mesh) {
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function createConcreteBunker() {
        // Main bunker entrance
        var mainBox = new THREE.Mesh(
            new THREE.BoxGeometry(20, 12, 30),
            new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9, metalness: 0.1 })
        );
        mainBox.position.set(0, 6, 0);
        mainBox.castShadow = true;
        mainBox.receiveShadow = true;
        addObject(mainBox);

        // Thick concrete walls - north side
        var wallNorth = new THREE.Mesh(
            new THREE.BoxGeometry(25, 14, 3),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95, metalness: 0.05 })
        );
        wallNorth.position.set(0, 7, 16);
        wallNorth.castShadow = true;
        wallNorth.receiveShadow = true;
        addObject(wallNorth);

        // Thick concrete walls - south side
        var wallSouth = new THREE.Mesh(
            new THREE.BoxGeometry(25, 14, 3),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95, metalness: 0.05 })
        );
        wallSouth.position.set(0, 7, -16);
        wallSouth.castShadow = true;
        wallSouth.receiveShadow = true;
        addObject(wallSouth);

        // Thick concrete walls - east side
        var wallEast = new THREE.Mesh(
            new THREE.BoxGeometry(3, 14, 32),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95, metalness: 0.05 })
        );
        wallEast.position.set(13, 7, 0);
        wallEast.castShadow = true;
        wallEast.receiveShadow = true;
        addObject(wallEast);

        // Thick concrete walls - west side
        var wallWest = new THREE.Mesh(
            new THREE.BoxGeometry(3, 14, 32),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95, metalness: 0.05 })
        );
        wallWest.position.set(-13, 7, 0);
        wallWest.castShadow = true;
        wallWest.receiveShadow = true;
        addObject(wallWest);

        // Reinforced roof slabs
        var roofMain = new THREE.Mesh(
            new THREE.BoxGeometry(26, 2, 32),
            new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85, metalness: 0.15 })
        );
        roofMain.position.set(0, 14, 0);
        roofMain.castShadow = true;
        roofMain.receiveShadow = true;
        addObject(roofMain);

        // Support pillar 1
        var pillar1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 10, 2),
            new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8, metalness: 0.2 })
        );
        pillar1.position.set(-6, 5, -8);
        pillar1.castShadow = true;
        pillar1.receiveShadow = true;
        addObject(pillar1);

        // Support pillar 2
        var pillar2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 10, 2),
            new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8, metalness: 0.2 })
        );
        pillar2.position.set(6, 5, -8);
        pillar2.castShadow = true;
        pillar2.receiveShadow = true;
        addObject(pillar2);

        // Support pillar 3
        var pillar3 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 10, 2),
            new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8, metalness: 0.2 })
        );
        pillar3.position.set(-6, 5, 8);
        pillar3.castShadow = true;
        pillar3.receiveShadow = true;
        addObject(pillar3);

        // Support pillar 4
        var pillar4 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 10, 2),
            new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8, metalness: 0.2 })
        );
        pillar4.position.set(6, 5, 8);
        pillar4.castShadow = true;
        pillar4.receiveShadow = true;
        addObject(pillar4);

        // Gun embrasures - narrow slots in walls
        for (var i = 0; i < 4; i++) {
            var embrasure = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 2, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1.0, metalness: 0.0 })
            );
            embrasure.position.set(-11, 7 + i * 2.5, 15.5);
            embrasure.castShadow = true;
            addObject(embrasure);
        }

        // Gun embrasures - east side
        for (var i = 0; i < 3; i++) {
            var embrasureE = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 2, 1.5),
                new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1.0, metalness: 0.0 })
            );
            embrasureE.position.set(12.5, 7 + i * 3, -5 + i * 4);
            embrasureE.castShadow = true;
            addObject(embrasureE);
        }

        return 14;
    }

    function createLightningRods() {
        // Main lightning rod - tallest
        var rodMain = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 25, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.9 })
        );
        rodMain.position.set(-20, 20, 10);
        rodMain.castShadow = true;
        addObject(rodMain);

        var tipMain = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, roughness: 0.2, metalness: 0.95 })
        );
        tipMain.position.set(-20, 32.5, 10);
        tipMain.castShadow = true;
        addObject(tipMain);

        // Secondary lightning rod - east
        var rodEast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 20, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.9 })
        );
        rodEast.position.set(22, 18, -15);
        rodEast.castShadow = true;
        addObject(rodEast);

        var tipEast = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, roughness: 0.2, metalness: 0.95 })
        );
        tipEast.position.set(22, 28, -15);
        tipEast.castShadow = true;
        addObject(tipEast);

        // Tertiary lightning rod - west
        var rodWest = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 22, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.9 })
        );
        rodWest.position.set(-25, 19, -8);
        rodWest.castShadow = true;
        addObject(rodWest);

        var tipWest = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, roughness: 0.2, metalness: 0.95 })
        );
        tipWest.position.set(-25, 30, -8);
        tipWest.castShadow = true;
        addObject(tipWest);

        // Small lightning rod - north
        var rodNorth = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 18, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.9 })
        );
        rodNorth.position.set(15, 17, 20);
        rodNorth.castShadow = true;
        addObject(rodNorth);

        var tipNorth = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, roughness: 0.2, metalness: 0.95 })
        );
        tipNorth.position.set(15, 26, 20);
        tipNorth.castShadow = true;
        addObject(tipNorth);
    }

    function createSandbagWalls() {
        // Sandbag wall - north perimeter
        for (var x = -12; x <= 12; x += 2.4) {
            for (var y = 0; y < 3; y++) {
                var sandbag = new THREE.Mesh(
                    new THREE.BoxGeometry(2.2, 1.2, 1.5),
                    new THREE.MeshStandardMaterial({ color: 0x4a5a2a, roughness: 0.95, metalness: 0.0 })
                );
                sandbag.position.set(x, 0.6 + y * 1.3, 22 + Math.random() * 0.3);
                sandbag.rotation.z = (Math.random() - 0.5) * 0.2;
                sandbag.castShadow = true;
                sandbag.receiveShadow = true;
                addObject(sandbag);
            }
        }

        // Sandbag wall - south perimeter
        for (var x = -12; x <= 12; x += 2.4) {
            for (var y = 0; y < 3; y++) {
                var sandbagS = new THREE.Mesh(
                    new THREE.BoxGeometry(2.2, 1.2, 1.5),
                    new THREE.MeshStandardMaterial({ color: 0x4a5a2a, roughness: 0.95, metalness: 0.0 })
                );
                sandbagS.position.set(x, 0.6 + y * 1.3, -22 - Math.random() * 0.3);
                sandbagS.rotation.z = (Math.random() - 0.5) * 0.2;
                sandbagS.castShadow = true;
                sandbagS.receiveShadow = true;
                addObject(sandbagS);
            }
        }

        // Sandbag wall - east perimeter
        for (var z = -10; z <= 10; z += 2.4) {
            for (var y = 0; y < 3; y++) {
                var sandbagE = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 1.2, 2.2),
                    new THREE.MeshStandardMaterial({ color: 0x4a5a2a, roughness: 0.95, metalness: 0.0 })
                );
                sandbagE.position.set(18 + Math.random() * 0.3, 0.6 + y * 1.3, z);
                sandbagE.rotation.z = (Math.random() - 0.5) * 0.2;
                sandbagE.castShadow = true;
                sandbagE.receiveShadow = true;
                addObject(sandbagE);
            }
        }

        // Sandbag wall - west perimeter
        for (var z = -10; z <= 10; z += 2.4) {
            for (var y = 0; y < 3; y++) {
                var sandbagW = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 1.2, 2.2),
                    new THREE.MeshStandardMaterial({ color: 0x4a5a2a, roughness: 0.95, metalness: 0.0 })
                );
                sandbagW.position.set(-18 - Math.random() * 0.3, 0.6 + y * 1.3, z);
                sandbagW.rotation.z = (Math.random() - 0.5) * 0.2;
                sandbagW.castShadow = true;
                sandbagW.receiveShadow = true;
                addObject(sandbagW);
            }
        }
    }

    function createFloodedTrenches() {
        // Trench channel - north to south
        var trenchWater = new THREE.Mesh(
            new THREE.BoxGeometry(6, 3, 35),
            new THREE.MeshStandardMaterial({ color: 0x4a6b8f, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 0.7 })
        );
        trenchWater.position.set(-28, 1.5, 0);
        trenchWater.castShadow = true;
        trenchWater.receiveShadow = true;
        addObject(trenchWater);

        // Trench walls
        var trenchWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(1, 3.5, 35),
            new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.85, metalness: 0.05 })
        );
        trenchWallLeft.position.set(-31.5, 1.75, 0);
        trenchWallLeft.castShadow = true;
        addObject(trenchWallLeft);

        var trenchWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(1, 3.5, 35),
            new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.85, metalness: 0.05 })
        );
        trenchWallRight.position.set(-24.5, 1.75, 0);
        trenchWallRight.castShadow = true;
        addObject(trenchWallRight);

        // Secondary trench east-west
        var trenchWaterE = new THREE.Mesh(
            new THREE.BoxGeometry(40, 3, 5),
            new THREE.MeshStandardMaterial({ color: 0x4a6b8f, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 0.7 })
        );
        trenchWaterE.position.set(-5, 1.5, -25);
        trenchWaterE.castShadow = true;
        trenchWaterE.receiveShadow = true;
        addObject(trenchWaterE);

        var trenchWallETop = new THREE.Mesh(
            new THREE.BoxGeometry(40, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.85, metalness: 0.05 })
        );
        trenchWallETop.position.set(-5, 3, -27.5);
        trenchWallETop.castShadow = true;
        addObject(trenchWallETop);

        var trenchWallEBottom = new THREE.Mesh(
            new THREE.BoxGeometry(40, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.85, metalness: 0.05 })
        );
        trenchWallEBottom.position.set(-5, 3, -22.5);
        trenchWallEBottom.castShadow = true;
        addObject(trenchWallEBottom);
    }

    function createPowerLines() {
        // Broken pole 1
        var pole1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.6, 16, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.2 })
        );
        pole1.position.set(30, 8, 10);
        pole1.rotation.z = 0.3;
        pole1.castShadow = true;
        addObject(pole1);

        // Broken pole 2
        var pole2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.6, 16, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.2 })
        );
        pole2.position.set(45, 8, 0);
        pole2.rotation.z = 0.25;
        pole2.castShadow = true;
        addObject(pole2);

        // Sagging wire pattern 1
        var wirePoints1 = [
            new THREE.Vector3(30, 15, 10),
            new THREE.Vector3(35, 12, 8),
            new THREE.Vector3(40, 10, 6),
            new THREE.Vector3(45, 12, 0)
        ];
        var wireGeom1 = new THREE.BufferGeometry().setFromPoints(wirePoints1);
        var wireMat1 = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
        var wireLine1 = new THREE.LineSegments(wireGeom1, wireMat1);
        addObject(wireLine1);

        // Sagging wire pattern 2
        var wirePoints2 = [
            new THREE.Vector3(30, 14, 10),
            new THREE.Vector3(35, 11, 8),
            new THREE.Vector3(40, 9, 6),
            new THREE.Vector3(45, 11, 0)
        ];
        var wireGeom2 = new THREE.BufferGeometry().setFromPoints(wirePoints2);
        var wireMat2 = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
        var wireLine2 = new THREE.LineSegments(wireGeom2, wireMat2);
        addObject(wireLine2);

        // Sagging wire pattern 3
        var wirePoints3 = [
            new THREE.Vector3(30, 13, 10),
            new THREE.Vector3(35, 10, 8),
            new THREE.Vector3(40, 8, 6),
            new THREE.Vector3(45, 10, 0)
        ];
        var wireGeom3 = new THREE.BufferGeometry().setFromPoints(wirePoints3);
        var wireMat3 = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
        var wireLine3 = new THREE.LineSegments(wireGeom3, wireMat3);
        addObject(wireLine3);
    }

    function createEmergencyShelters() {
        // Shelter cluster - northwest
        var shelterNW1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 5),
            new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8, metalness: 0.1 })
        );
        shelterNW1.position.set(-32, 2, 28);
        shelterNW1.castShadow = true;
        shelterNW1.receiveShadow = true;
        addObject(shelterNW1);

        var shelterNW2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 4, 5),
            new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8, metalness: 0.1 })
        );
        shelterNW2.position.set(-40, 2, 28);
        shelterNW2.castShadow = true;
        shelterNW2.receiveShadow = true;
        addObject(shelterNW2);

        // Shelter cluster - northeast
        var shelterNE1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 5),
            new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8, metalness: 0.1 })
        );
        shelterNE1.position.set(32, 2, 28);
        shelterNE1.castShadow = true;
        shelterNE1.receiveShadow = true;
        addObject(shelterNE1);

        var shelterNE2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 4, 5),
            new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8, metalness: 0.1 })
        );
        shelterNE2.position.set(40, 2, 28);
        shelterNE2.castShadow = true;
        shelterNE2.receiveShadow = true;
        addObject(shelterNE2);

        // Shelter cluster - southwest
        var shelterSW1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 5),
            new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8, metalness: 0.1 })
        );
        shelterSW1.position.set(-32, 2, -28);
        shelterSW1.castShadow = true;
        shelterSW1.receiveShadow = true;
        addObject(shelterSW1);

        var shelterSW2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 4, 5),
            new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8, metalness: 0.1 })
        );
        shelterSW2.position.set(-40, 2, -28);
        shelterSW2.castShadow = true;
        shelterSW2.receiveShadow = true;
        addObject(shelterSW2);

        // Shelter cluster - southeast
        var shelterSE1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 5),
            new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8, metalness: 0.1 })
        );
        shelterSE1.position.set(32, 2, -28);
        shelterSE1.castShadow = true;
        shelterSE1.receiveShadow = true;
        addObject(shelterSE1);

        var shelterSE2 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 4, 5),
            new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8, metalness: 0.1 })
        );
        shelterSE2.position.set(40, 2, -28);
        shelterSE2.castShadow = true;
        shelterSE2.receiveShadow = true;
        addObject(shelterSE2);
    }

    function createStormDrains() {
        // Storm drain 1 - north trench
        var drain1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 4, 12),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 })
        );
        drain1.position.set(-28, 1, -8);
        drain1.castShadow = true;
        addObject(drain1);

        // Storm drain 2 - middle
        var drain2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 4, 12),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 })
        );
        drain2.position.set(-28, 1, 0);
        drain2.castShadow = true;
        addObject(drain2);

        // Storm drain 3 - south
        var drain3 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 4, 12),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 })
        );
        drain3.position.set(-28, 1, 8);
        drain3.castShadow = true;
        addObject(drain3);

        // Storm drain 4 - east trench
        var drain4 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 4, 12),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 })
        );
        drain4.position.set(-15, 1, -25);
        drain4.castShadow = true;
        addObject(drain4);

        // Storm drain 5 - east trench mid
        var drain5 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 4, 12),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 })
        );
        drain5.position.set(5, 1, -25);
        drain5.castShadow = true;
        addObject(drain5);
    }

    function createDebrisField() {
        // Scattered timber logs
        for (var i = 0; i < 8; i++) {
            var timber = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.4, 4),
                new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9, metalness: 0.0 })
            );
            var angle = Math.random() * Math.PI * 2;
            var dist = 35 + Math.random() * 8;
            timber.position.set(Math.cos(angle) * dist, 0.4, Math.sin(angle) * dist);
            timber.rotation.z = Math.random() * Math.PI;
            timber.rotation.y = angle;
            timber.castShadow = true;
            timber.receiveShadow = true;
            addObject(timber);
        }

        // Scattered sandbags in debris
        for (var i = 0; i < 10; i++) {
            var debrisSandbag = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1.0, 1.2),
                new THREE.MeshStandardMaterial({ color: 0x5a6a3a, roughness: 0.9, metalness: 0.0 })
            );
            var angle2 = Math.random() * Math.PI * 2;
            var dist2 = 32 + Math.random() * 10;
            debrisSandbag.position.set(Math.cos(angle2) * dist2, 0.5, Math.sin(angle2) * dist2);
            debrisSandbag.rotation.z = (Math.random() - 0.5) * 0.4;
            debrisSandbag.castShadow = true;
            debrisSandbag.receiveShadow = true;
            addObject(debrisSandbag);
        }

        // Equipment crates in debris field
        for (var i = 0; i < 6; i++) {
            var crate = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 2),
                new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.85, metalness: 0.05 })
            );
            var angle3 = Math.random() * Math.PI * 2;
            var dist3 = 38 + Math.random() * 7;
            crate.position.set(Math.cos(angle3) * dist3, 1, Math.sin(angle3) * dist3);
            crate.rotation.y = Math.random() * Math.PI;
            crate.castShadow = true;
            crate.receiveShadow = true;
            addObject(crate);
        }
    }

    function createRadarInstallation() {
        // Radar tower base
        var radarBase = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, 4),
            new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8, metalness: 0.2 })
        );
        radarBase.position.set(-35, 1, -35);
        radarBase.castShadow = true;
        radarBase.receiveShadow = true;
        addObject(radarBase);

        // Radar tower
        var radarTower = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.8, 18, 8),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.7, metalness: 0.3 })
        );
        radarTower.position.set(-35, 10, -35);
        radarTower.castShadow = true;
        addObject(radarTower);

        // Radar dish (rotating)
        var radarDish = new THREE.Mesh(
            new THREE.CylinderGeometry(3.5, 3.5, 0.8, 32),
            new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.4, metalness: 0.6 })
        );
        radarDish.position.set(-35, 19, -35);
        radarDish.castShadow = true;
        addObject(radarDish);
        radarMesh = radarDish;

        // Radar support arms
        for (var i = 0; i < 3; i++) {
            var armAngle = (i / 3) * Math.PI * 2;
            var armX = Math.cos(armAngle) * 2.5;
            var armZ = Math.sin(armAngle) * 2.5;
            var arm = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.4, 5),
                new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7, metalness: 0.3 })
            );
            arm.position.set(-35 + armX, 19, -35 + armZ);
            arm.rotation.z = armAngle;
            arm.castShadow = true;
            addObject(arm);
        }
    }

    function createAmmoDepot() {
        // Main depot building
        var depotMain = new THREE.Mesh(
            new THREE.BoxGeometry(14, 8, 12),
            new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.85, metalness: 0.1 })
        );
        depotMain.position.set(35, 4, 20);
        depotMain.castShadow = true;
        depotMain.receiveShadow = true;
        addObject(depotMain);

        // Ammunition crate stacks outside
        for (var x = 0; x < 4; x++) {
            for (var z = 0; z < 3; z++) {
                for (var y = 0; y < 2; y++) {
                    var ammoCrate = new THREE.Mesh(
                        new THREE.BoxGeometry(2.2, 2.0, 2.2),
                        new THREE.MeshStandardMaterial({ color: 0x6a7a4a, roughness: 0.8, metalness: 0.05 })
                    );
                    ammoCrate.position.set(25 + x * 2.5, 1 + y * 2.2, 10 + z * 2.5);
                    ammoCrate.castShadow = true;
                    ammoCrate.receiveShadow = true;
                    addObject(ammoCrate);
                }
            }
        }

        // Additional crates stacked high
        for (var i = 0; i < 3; i++) {
            var highCrate = new THREE.Mesh(
                new THREE.BoxGeometry(2.2, 2.0, 2.2),
                new THREE.MeshStandardMaterial({ color: 0x6a7a4a, roughness: 0.8, metalness: 0.05 })
            );
            highCrate.position.set(20 + i * 2.5, 5 + i * 2, 20);
            highCrate.castShadow = true;
            highCrate.receiveShadow = true;
            addObject(highCrate);
        }
    }

    function createAAGunEmplacements() {
        // AA Gun emplacement 1 - northeast
        var platform1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1, 8),
            new THREE.MeshStandardMaterial({ color: 0x4a5a6a, roughness: 0.8, metalness: 0.1 })
        );
        platform1.position.set(32, 0.5, 10);
        platform1.castShadow = true;
        addObject(platform1);

        var gun1A = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 })
        );
        gun1A.position.set(32, 2, 10);
        gun1A.rotation.x = -0.5;
        gun1A.castShadow = true;
        addObject(gun1A);

        var gun1B = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 })
        );
        gun1B.position.set(32, 2, 15);
        gun1B.rotation.x = -0.5;
        gun1B.castShadow = true;
        addObject(gun1B);

        // AA Gun emplacement 2 - northwest
        var platform2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1, 8),
            new THREE.MeshStandardMaterial({ color: 0x4a5a6a, roughness: 0.8, metalness: 0.1 })
        );
        platform2.position.set(-32, 0.5, 10);
        platform2.castShadow = true;
        addObject(platform2);

        var gun2A = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 })
        );
        gun2A.position.set(-32, 2, 10);
        gun2A.rotation.x = -0.5;
        gun2A.castShadow = true;
        addObject(gun2A);

        var gun2B = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 })
        );
        gun2B.position.set(-32, 2, 15);
        gun2B.rotation.x = -0.5;
        gun2B.castShadow = true;
        addObject(gun2B);

        // AA Gun emplacement 3 - southeast
        var platform3 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1, 8),
            new THREE.MeshStandardMaterial({ color: 0x4a5a6a, roughness: 0.8, metalness: 0.1 })
        );
        platform3.position.set(32, 0.5, -10);
        platform3.castShadow = true;
        addObject(platform3);

        var gun3 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 })
        );
        gun3.position.set(32, 2, -10);
        gun3.rotation.x = -0.5;
        gun3.castShadow = true;
        addObject(gun3);

        // AA Gun emplacement 4 - southwest
        var platform4 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1, 8),
            new THREE.MeshStandardMaterial({ color: 0x4a5a6a, roughness: 0.8, metalness: 0.1 })
        );
        platform4.position.set(-32, 0.5, -10);
        platform4.castShadow = true;
        addObject(platform4);

        var gun4 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 6, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 })
        );
        gun4.position.set(-32, 2, -10);
        gun4.rotation.x = -0.5;
        gun4.castShadow = true;
        addObject(gun4);
    }

    function createLightningBolts() {
        // Static lightning bolt patterns for animation
        var bolt1Points = [
            new THREE.Vector3(-20, 32, 10),
            new THREE.Vector3(-18, 28, 12),
            new THREE.Vector3(-22, 24, 8),
            new THREE.Vector3(-19, 20, 11),
            new THREE.Vector3(-21, 15, 9),
            new THREE.Vector3(-17, 8, 13)
        ];
        var boltGeom1 = new THREE.BufferGeometry().setFromPoints(bolt1Points);
        var boltMat1 = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
        var boltLine1 = new THREE.LineSegments(boltGeom1, boltMat1);
        boltLine1.visible = false;
        lightningBolts.push({ mesh: boltLine1, visible: false });
        addObject(boltLine1);

        // Lightning bolt 2
        var bolt2Points = [
            new THREE.Vector3(22, 28, -15),
            new THREE.Vector3(20, 24, -13),
            new THREE.Vector3(24, 20, -17),
            new THREE.Vector3(21, 15, -14),
            new THREE.Vector3(23, 8, -18)
        ];
        var boltGeom2 = new THREE.BufferGeometry().setFromPoints(bolt2Points);
        var boltMat2 = new THREE.LineBasicMaterial({ color: 0x8888ff, linewidth: 2 });
        var boltLine2 = new THREE.LineSegments(boltGeom2, boltMat2);
        boltLine2.visible = false;
        lightningBolts.push({ mesh: boltLine2, visible: false });
        addObject(boltLine2);

        // Lightning bolt 3
        var bolt3Points = [
            new THREE.Vector3(-25, 30, -8),
            new THREE.Vector3(-23, 26, -6),
            new THREE.Vector3(-27, 22, -10),
            new THREE.Vector3(-24, 16, -7),
            new THREE.Vector3(-26, 8, -11)
        ];
        var boltGeom3 = new THREE.BufferGeometry().setFromPoints(bolt3Points);
        var boltMat3 = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
        var boltLine3 = new THREE.LineSegments(boltGeom3, boltMat3);
        boltLine3.visible = false;
        lightningBolts.push({ mesh: boltLine3, visible: false });
        addObject(boltLine3);

        // Lightning bolt 4 - branching
        var bolt4Points = [
            new THREE.Vector3(15, 26, 20),
            new THREE.Vector3(13, 22, 22),
            new THREE.Vector3(17, 18, 18),
            new THREE.Vector3(14, 12, 21),
            new THREE.Vector3(16, 5, 19)
        ];
        var boltGeom4 = new THREE.BufferGeometry().setFromPoints(bolt4Points);
        var boltMat4 = new THREE.LineBasicMaterial({ color: 0xaaaaff, linewidth: 2 });
        var boltLine4 = new THREE.LineSegments(boltGeom4, boltMat4);
        boltLine4.visible = false;
        lightningBolts.push({ mesh: boltLine4, visible: false });
        addObject(boltLine4);
    }

    function createRaindrops() {
        // Create rain particle system
        for (var i = 0; i < 40; i++) {
            var raindrop = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 4, 4),
                new THREE.MeshStandardMaterial({ color: 0x7b9bcc, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.6 })
            );
            var x = (Math.random() - 0.5) * 80;
            var z = (Math.random() - 0.5) * 80;
            var y = 30 + Math.random() * 20;
            raindrop.position.set(x, y, z);
            raindrop.velocity = new THREE.Vector3(0, -(8 + Math.random() * 4), 0);
            rainParticles.push(raindrop);
            addObject(raindrop);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lightningBolts = [];
        rainParticles = [];
        radarMesh = null;
        radarRotation = 0;
        lightningActive = false;
        lightningTimer = 0;
        nextLightningTime = 1 + Math.random() * 3;

        // Create all environment components
        createConcreteBunker();
        createLightningRods();
        createSandbagWalls();
        createFloodedTrenches();
        createPowerLines();
        createEmergencyShelters();
        createStormDrains();
        createDebrisField();
        createRadarInstallation();
        createAmmoDepot();
        createAAGunEmplacements();
        createLightningBolts();
        createRaindrops();

        return objects.length;
    }

    function update(delta) {
        // Update radar rotation
        if (radarMesh) {
            radarRotation += delta * 0.5;
            radarMesh.rotation.y = radarRotation;
        }

        // Lightning effect - random flashes
        lightningTimer += delta;
        if (lightningTimer >= nextLightningTime) {
            lightningActive = true;
            lightningTimer = 0;
            nextLightningTime = 1.5 + Math.random() * 4;

            // Activate random lightning bolts
            for (var i = 0; i < lightningBolts.length; i++) {
                if (Math.random() > 0.6) {
                    lightningBolts[i].mesh.visible = true;
                }
            }

            // Deactivate after short duration
            setTimeout(function() {
                for (var i = 0; i < lightningBolts.length; i++) {
                    lightningBolts[i].mesh.visible = false;
                }
                lightningActive = false;
            }, 150);
        }

        // Update raindrops
        for (var i = 0; i < rainParticles.length; i++) {
            var drop = rainParticles[i];
            drop.position.add(drop.velocity.clone().multiplyScalar(delta));

            // Reset raindrop when it hits bottom
            if (drop.position.y < -5) {
                drop.position.y = 50 + Math.random() * 10;
                drop.position.x = (Math.random() - 0.5) * 80;
                drop.position.z = (Math.random() - 0.5) * 80;
            }
        }
    }

    function reset() {
        // Remove all objects from scene
        for (var i = objects.length - 1; i >= 0; i--) {
            scene.remove(objects[i]);
        }
        objects = [];
        lightningBolts = [];
        rainParticles = [];
        radarMesh = null;
        radarRotation = 0;
        lightningTimer = 0;
        lightningActive = false;
        nextLightningTime = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
