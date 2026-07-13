window.SwampGate = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var gunboat = null;
    var portcullisLight = null;
    var waterChannel = null;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildSwampTerrain();
        buildWaterChannel();
        buildGateFortress();
        buildBridgeCrossing();
        buildWatchtowers();
        buildDefenses();
        buildVegetation();
        buildSupplyBarge();
        buildGunboat();
        buildChainBoom();
        setupLighting();
    }

    function buildSwampTerrain() {
        var swampGeometry = new THREE.BoxGeometry(200, 3, 150);
        var swampMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d2d });
        var swampBase = new THREE.Mesh(swampGeometry, swampMaterial);
        swampBase.position.y = -3;
        scene.add(swampBase);
        objects.push(swampBase);

        var mudPatch1 = new THREE.Mesh(
            new THREE.BoxGeometry(80, 2, 60),
            new THREE.MeshLambertMaterial({ color: 0x2a2416 })
        );
        mudPatch1.position.set(-60, -2, -40);
        scene.add(mudPatch1);
        objects.push(mudPatch1);

        var mudPatch2 = new THREE.Mesh(
            new THREE.BoxGeometry(70, 2, 70),
            new THREE.MeshLambertMaterial({ color: 0x3a3426 })
        );
        mudPatch2.position.set(70, -2, 30);
        scene.add(mudPatch2);
        objects.push(mudPatch2);

        var mudPatch3 = new THREE.Mesh(
            new THREE.BoxGeometry(60, 2, 50),
            new THREE.MeshLambertMaterial({ color: 0x2d2818 })
        );
        mudPatch3.position.set(0, -2, -60);
        scene.add(mudPatch3);
        objects.push(mudPatch3);
    }

    function buildWaterChannel() {
        var waterGeometry = new THREE.BoxGeometry(50, 4, 180);
        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a2a });
        waterChannel = new THREE.Mesh(waterGeometry, waterMaterial);
        waterChannel.position.set(0, -2, 0);
        scene.add(waterChannel);
        objects.push(waterChannel);
    }

    function buildGateFortress() {
        var mainWall = new THREE.Mesh(
            new THREE.BoxGeometry(60, 25, 15),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        mainWall.position.set(0, 12, -35);
        scene.add(mainWall);
        objects.push(mainWall);

        var wallTop = new THREE.Mesh(
            new THREE.BoxGeometry(65, 3, 18),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        wallTop.position.set(0, 27, -35);
        scene.add(wallTop);
        objects.push(wallTop);

        var crenelLeft = new THREE.Mesh(
            new THREE.BoxGeometry(8, 4, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        crenelLeft.position.set(-20, 30, -35);
        scene.add(crenelLeft);
        objects.push(crenelLeft);

        var crenelMid1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 4, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        crenelMid1.position.set(0, 30, -35);
        scene.add(crenelMid1);
        objects.push(crenelMid1);

        var crenelRight = new THREE.Mesh(
            new THREE.BoxGeometry(8, 4, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        crenelRight.position.set(20, 30, -35);
        scene.add(crenelRight);
        objects.push(crenelRight);

        var gateArchLeft = new THREE.Mesh(
            new THREE.BoxGeometry(12, 20, 8),
            new THREE.MeshLambertMaterial({ color: 0x606060 })
        );
        gateArchLeft.position.set(-18, 10, -35);
        scene.add(gateArchLeft);
        objects.push(gateArchLeft);

        var gateArchRight = new THREE.Mesh(
            new THREE.BoxGeometry(12, 20, 8),
            new THREE.MeshLambertMaterial({ color: 0x606060 })
        );
        gateArchRight.position.set(18, 10, -35);
        scene.add(gateArchRight);
        objects.push(gateArchRight);

        var gateOpening = new THREE.Mesh(
            new THREE.BoxGeometry(36, 18, 2),
            new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
        );
        gateOpening.position.set(0, 10, -35);
        scene.add(gateOpening);
        objects.push(gateOpening);

        buildPortcullis();

        var armoryBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(30, 16, 20),
            new THREE.MeshLambertMaterial({ color: 0x7a7a7a })
        );
        armoryBuilding.position.set(0, 8, 5);
        scene.add(armoryBuilding);
        objects.push(armoryBuilding);

        var armoryRoof = new THREE.Mesh(
            new THREE.BoxGeometry(32, 3, 22),
            new THREE.MeshLambertMaterial({ color: 0x656565 })
        );
        armoryRoof.position.set(0, 19, 5);
        scene.add(armoryRoof);
        objects.push(armoryRoof);

        for (var i = 0; i < 5; i++) {
            var crate = new THREE.Mesh(
                new THREE.BoxGeometry(6, 6, 6),
                new THREE.MeshLambertMaterial({ color: 0x8B7355 })
            );
            crate.position.set(-10 + i * 5, 3, 15);
            scene.add(crate);
            objects.push(crate);
        }
    }

    function buildPortcullis() {
        var barSpacing = 3;
        var barWidth = 0.4;
        var barHeight = 18;
        var barDepth = 0.2;

        for (var i = -8; i <= 8; i++) {
            var barGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
            var barMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var bar = new THREE.Mesh(barGeometry, barMaterial);
            bar.position.set(i * barSpacing, 10, -35);
            scene.add(bar);
            objects.push(bar);
        }

        var horizontalBar1 = new THREE.Mesh(
            new THREE.BoxGeometry(36, 0.4, 0.2),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        horizontalBar1.position.set(0, 3, -35);
        scene.add(horizontalBar1);
        objects.push(horizontalBar1);

        var horizontalBar2 = new THREE.Mesh(
            new THREE.BoxGeometry(36, 0.4, 0.2),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        horizontalBar2.position.set(0, 17, -35);
        scene.add(horizontalBar2);
        objects.push(horizontalBar2);
    }

    function buildBridgeCrossing() {
        var deckMaterial = new THREE.MeshLambertMaterial({ color: 0x8B8B83 });

        var span1Deck = new THREE.Mesh(
            new THREE.BoxGeometry(45, 2, 15),
            deckMaterial
        );
        span1Deck.position.set(-25, 0, -15);
        scene.add(span1Deck);
        objects.push(span1Deck);

        var span2Deck = new THREE.Mesh(
            new THREE.BoxGeometry(50, 2, 15),
            deckMaterial
        );
        span2Deck.position.set(0, 2, 0);
        scene.add(span2Deck);
        objects.push(span2Deck);

        var span3Deck = new THREE.Mesh(
            new THREE.BoxGeometry(45, 2, 15),
            deckMaterial
        );
        span3Deck.position.set(25, 0, 15);
        scene.add(span3Deck);
        objects.push(span3Deck);

        var support1 = new THREE.Mesh(
            new THREE.BoxGeometry(48, 5, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        support1.position.set(-25, -3, -15);
        scene.add(support1);
        objects.push(support1);

        var support2 = new THREE.Mesh(
            new THREE.BoxGeometry(50, 5, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        support2.position.set(0, -1, 0);
        scene.add(support2);
        objects.push(support2);

        var support3 = new THREE.Mesh(
            new THREE.BoxGeometry(48, 5, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        support3.position.set(25, -3, 15);
        scene.add(support3);
        objects.push(support3);

        var archLeft = new THREE.Mesh(
            new THREE.BoxGeometry(3, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x606060 })
        );
        archLeft.position.set(-20, -4, 0);
        scene.add(archLeft);
        objects.push(archLeft);

        var archRight = new THREE.Mesh(
            new THREE.BoxGeometry(3, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x606060 })
        );
        archRight.position.set(20, -4, 0);
        scene.add(archRight);
        objects.push(archRight);

        var railing1 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 45),
            new THREE.MeshLambertMaterial({ color: 0x505050 })
        );
        railing1.position.set(-22.5, 2, 0);
        scene.add(railing1);
        objects.push(railing1);

        var railing2 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 45),
            new THREE.MeshLambertMaterial({ color: 0x505050 })
        );
        railing2.position.set(22.5, 2, 0);
        scene.add(railing2);
        objects.push(railing2);
    }

    function buildWatchtowers() {
        var towerPositions = [
            [-70, 0, -50],
            [70, 0, -50],
            [-80, 0, 40],
            [80, 0, 40]
        ];

        for (var p = 0; p < towerPositions.length; p++) {
            var pos = towerPositions[p];
            buildSingleTower(pos[0], pos[1], pos[2]);
        }
    }

    function buildSingleTower(x, y, z) {
        var supportPole1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 18, 12),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        supportPole1.position.set(x - 3, y + 9, z - 3);
        scene.add(supportPole1);
        objects.push(supportPole1);

        var supportPole2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 18, 12),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        supportPole2.position.set(x + 3, y + 9, z - 3);
        scene.add(supportPole2);
        objects.push(supportPole2);

        var supportPole3 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 18, 12),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        supportPole3.position.set(x - 3, y + 9, z + 3);
        scene.add(supportPole3);
        objects.push(supportPole3);

        var supportPole4 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 18, 12),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        supportPole4.position.set(x + 3, y + 9, z + 3);
        scene.add(supportPole4);
        objects.push(supportPole4);

        var platform = new THREE.Mesh(
            new THREE.BoxGeometry(16, 1, 16),
            new THREE.MeshLambertMaterial({ color: 0x8B8B83 })
        );
        platform.position.set(x, y + 18, z);
        scene.add(platform);
        objects.push(platform);

        var guardPost = new THREE.Mesh(
            new THREE.BoxGeometry(12, 3, 12),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        guardPost.position.set(x, y + 19.5, z);
        scene.add(guardPost);
        objects.push(guardPost);

        var crenelTower1 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        crenelTower1.position.set(x - 5, y + 21.5, z - 5);
        scene.add(crenelTower1);
        objects.push(crenelTower1);

        var crenelTower2 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        crenelTower2.position.set(x + 5, y + 21.5, z - 5);
        scene.add(crenelTower2);
        objects.push(crenelTower2);

        var crenelTower3 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        crenelTower3.position.set(x - 5, y + 21.5, z + 5);
        scene.add(crenelTower3);
        objects.push(crenelTower3);

        var crenelTower4 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        crenelTower4.position.set(x + 5, y + 21.5, z + 5);
        scene.add(crenelTower4);
        objects.push(crenelTower4);
    }

    function buildDefenses() {
        var barricade1 = new THREE.Mesh(
            new THREE.BoxGeometry(30, 3, 4),
            new THREE.MeshLambertMaterial({ color: 0xC9A876 })
        );
        barricade1.position.set(-30, 1, -50);
        scene.add(barricade1);
        objects.push(barricade1);

        var barricade2 = new THREE.Mesh(
            new THREE.BoxGeometry(30, 3, 4),
            new THREE.MeshLambertMaterial({ color: 0xC9A876 })
        );
        barricade2.position.set(30, 1, -50);
        scene.add(barricade2);
        objects.push(barricade2);

        var barricade3 = new THREE.Mesh(
            new THREE.BoxGeometry(30, 3, 4),
            new THREE.MeshLambertMaterial({ color: 0xC9A876 })
        );
        barricade3.position.set(-30, 1, 50);
        scene.add(barricade3);
        objects.push(barricade3);

        var barricade4 = new THREE.Mesh(
            new THREE.BoxGeometry(30, 3, 4),
            new THREE.MeshLambertMaterial({ color: 0xC9A876 })
        );
        barricade4.position.set(30, 1, 50);
        scene.add(barricade4);
        objects.push(barricade4);

        for (var i = 0; i < 6; i++) {
            var sandbag1 = new THREE.Mesh(
                new THREE.BoxGeometry(4, 2, 2),
                new THREE.MeshLambertMaterial({ color: 0xD2A679 })
            );
            sandbag1.position.set(-40 + i * 15, 1, -55);
            scene.add(sandbag1);
            objects.push(sandbag1);

            var sandbag2 = new THREE.Mesh(
                new THREE.BoxGeometry(4, 2, 2),
                new THREE.MeshLambertMaterial({ color: 0xD2A679 })
            );
            sandbag2.position.set(-40 + i * 15, 1, 55);
            scene.add(sandbag2);
            objects.push(sandbag2);
        }

        var wallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(4, 12, 80),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        wallLeft.position.set(-50, 6, 0);
        scene.add(wallLeft);
        objects.push(wallLeft);

        var wallRight = new THREE.Mesh(
            new THREE.BoxGeometry(4, 12, 80),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        wallRight.position.set(50, 6, 0);
        scene.add(wallRight);
        objects.push(wallRight);

        var parapet1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 50),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        parapet1.position.set(-23, 3, 0);
        scene.add(parapet1);
        objects.push(parapet1);

        var parapet2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 50),
            new THREE.MeshLambertMaterial({ color: 0x707070 })
        );
        parapet2.position.set(23, 3, 0);
        scene.add(parapet2);
        objects.push(parapet2);
    }

    function buildVegetation() {
        var rootPositions = [
            [-30, -1, 20],
            [35, -1, 10],
            [-45, -1, -20],
            [40, -1, -30]
        ];

        for (var r = 0; r < rootPositions.length; r++) {
            var rootPos = rootPositions[r];
            var rootArch = new THREE.Mesh(
                new THREE.CylinderGeometry(2.5, 3, 20, 16),
                new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
            );
            rootArch.position.set(rootPos[0], rootPos[1], rootPos[2]);
            rootArch.scale.z = 0.3;
            scene.add(rootArch);
            objects.push(rootArch);

            var rootBulge = new THREE.Mesh(
                new THREE.SphereGeometry(1.8, 8, 8),
                new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
            );
            rootBulge.position.set(rootPos[0], rootPos[1] + 3, rootPos[2]);
            scene.add(rootBulge);
            objects.push(rootBulge);
        }

        var shrubPositions = [
            [-60, 0, 30],
            [60, 0, -40],
            [-70, 0, 0],
            [70, 0, 50]
        ];

        for (var s = 0; s < shrubPositions.length; s++) {
            var shrubPos = shrubPositions[s];
            var shrub = new THREE.Mesh(
                new THREE.SphereGeometry(4, 8, 8),
                new THREE.MeshLambertMaterial({ color: 0x3a5a3a })
            );
            shrub.position.set(shrubPos[0], shrubPos[1] + 3, shrubPos[2]);
            scene.add(shrub);
            objects.push(shrub);
        }

        for (var i = 0; i < 8; i++) {
            var treeBase = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 2, 12, 12),
                new THREE.MeshLambertMaterial({ color: 0x6B4423 })
            );
            var treeX = -80 + i * 25;
            var treeZ = 70 + Math.sin(i) * 20;
            treeBase.position.set(treeX, 6, treeZ);
            scene.add(treeBase);
            objects.push(treeBase);

            var treeCrown = new THREE.Mesh(
                new THREE.ConeGeometry(6, 10, 12),
                new THREE.MeshLambertMaterial({ color: 0x2a4a2a })
            );
            treeCrown.position.set(treeX, 16, treeZ);
            scene.add(treeCrown);
            objects.push(treeCrown);
        }
    }

    function buildSupplyBarge() {
        var hull = new THREE.Mesh(
            new THREE.BoxGeometry(35, 5, 18),
            new THREE.MeshLambertMaterial({ color: 0x8B6F47 })
        );
        hull.position.set(-60, -0.5, 0);
        scene.add(hull);
        objects.push(hull);

        var cargoBase = new THREE.Mesh(
            new THREE.BoxGeometry(30, 2, 14),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        cargoBase.position.set(-60, 2.5, 0);
        scene.add(cargoBase);
        objects.push(cargoBase);

        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 3; j++) {
                var crate = new THREE.Mesh(
                    new THREE.BoxGeometry(5, 4, 4),
                    new THREE.MeshLambertMaterial({ color: 0xA0826D })
                );
                crate.position.set(-65 + i * 7, 4.5 + j * 4.5, -4 + j * 4);
                scene.add(crate);
                objects.push(crate);
            }
        }

        var cabin = new THREE.Mesh(
            new THREE.BoxGeometry(12, 6, 10),
            new THREE.MeshLambertMaterial({ color: 0x8B8B83 })
        );
        cabin.position.set(-48, 6, 0);
        scene.add(cabin);
        objects.push(cabin);
    }

    function buildGunboat() {
        var boatHull = new THREE.Mesh(
            new THREE.BoxGeometry(28, 4, 12),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        boatHull.position.set(50, -0.5, 0);
        scene.add(boatHull);
        objects.push(boatHull);
        gunboat = boatHull;

        var boatCabin = new THREE.Mesh(
            new THREE.BoxGeometry(12, 5, 10),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        boatCabin.position.set(48, 2.5, 0);
        scene.add(boatCabin);
        objects.push(boatCabin);

        var smokeStack1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        smokeStack1.position.set(50, 6, -3);
        scene.add(smokeStack1);
        objects.push(smokeStack1);

        var smokeStack2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        smokeStack2.position.set(50, 6, 3);
        scene.add(smokeStack2);
        objects.push(smokeStack2);

        var gunMount = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 3),
            new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
        );
        gunMount.position.set(55, 3, 0);
        scene.add(gunMount);
        objects.push(gunMount);

        var gunBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 6, 12),
            new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
        );
        gunBarrel.position.set(59, 4, 0);
        gunBarrel.rotation.z = Math.PI / 2;
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        var shield = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 5),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        shield.position.set(58, 4, 0);
        scene.add(shield);
        objects.push(shield);

        var bow = new THREE.Mesh(
            new THREE.ConeGeometry(3, 4, 12),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        bow.position.set(64, 0.5, 0);
        bow.rotation.z = Math.PI / 2;
        scene.add(bow);
        objects.push(bow);

        var anchor = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x505050 })
        );
        anchor.position.set(45, 0, 0);
        scene.add(anchor);
        objects.push(anchor);
    }

    function buildChainBoom() {
        var boomSegments = [];
        var segmentCount = 20;

        for (var i = 0; i < segmentCount; i++) {
            var x1 = -25 + (i / segmentCount) * 50;
            var x2 = -25 + ((i + 1) / segmentCount) * 50;
            var y = -0.5 + Math.sin(i / 5) * 1.5;

            var points = [
                new THREE.Vector3(x1, y, 0),
                new THREE.Vector3(x2, y + 0.3, 0)
            ];

            var geometry = new THREE.BufferGeometry().setFromPoints(points);
            var material = new THREE.LineBasicMaterial({ color: 0x505050, linewidth: 2 });
            var line = new THREE.LineSegments(geometry, material);
            scene.add(line);
            objects.push(line);
            boomSegments.push(line);
        }

        var buoyLeft = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        buoyLeft.position.set(-28, 1, 0);
        scene.add(buoyLeft);
        objects.push(buoyLeft);

        var buoyRight = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        buoyRight.position.set(28, 1, 0);
        scene.add(buoyRight);
        objects.push(buoyRight);

        var buoyMid = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        buoyMid.position.set(0, 1.2, 0);
        scene.add(buoyMid);
        objects.push(buoyMid);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(100, 80, 50);
        sunLight.castShadow = true;
        scene.add(sunLight);
        lights.push(sunLight);

        var fortressLight = new THREE.PointLight(0xff8800, 1, 60);
        fortressLight.position.set(0, 15, -30);
        scene.add(fortressLight);
        lights.push(fortressLight);

        portcullisLight = new THREE.PointLight(0xff0000, 0.8, 40);
        portcullisLight.position.set(0, 12, -35);
        scene.add(portcullisLight);
        lights.push(portcullisLight);

        var boatLight = new THREE.PointLight(0xffaa00, 0.7, 50);
        boatLight.position.set(50, 8, 0);
        scene.add(boatLight);
        lights.push(boatLight);

        var swampMist = new THREE.AmbientLight(0x3d5a3d, 0.3);
        scene.add(swampMist);
        lights.push(swampMist);

        for (var i = 0; i < 4; i++) {
            var towerLight = new THREE.PointLight(0xffffcc, 0.6, 45);
            var xPos = (i % 2 === 0) ? -70 : 70;
            var zPos = (i < 2) ? -50 : 40;
            towerLight.position.set(xPos, 20, zPos);
            scene.add(towerLight);
            lights.push(towerLight);
        }
    }

    function update(delta) {
        if (gunboat !== null && delta > 0) {
            gunboat.position.y = -0.5 + Math.sin(Date.now() * 0.001) * 0.3;
        }

        if (portcullisLight !== null) {
            var flicker = 0.5 + Math.random() * 0.5;
            portcullisLight.intensity = 0.8 * flicker;
            if (Math.random() < 0.05) {
                portcullisLight.intensity = 0.1;
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
        gunboat = null;
        portcullisLight = null;
        waterChannel = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
