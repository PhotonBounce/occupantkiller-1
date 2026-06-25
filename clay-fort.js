window.ClayFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var catapultArm = null;
    var catapultArmBase = null;

    var CLAY_COLOR = 0xD4A574;
    var TERRA_COLOR = 0xC86432;
    var DARK_SHADOW = 0x3d2817;
    var SAND_COLOR = 0xEDC9AF;
    var RUST_COLOR = 0x8B4513;
    var DARK_IRON = 0x2a2a2a;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        catapultArm = null;
        catapultArmBase = null;

        buildDesertFloor();
        buildDryMoat();
        buildClayWalls();
        buildTowers();
        buildInnerCompound();
        buildWells();
        buildArmoury();
        buildGatehouse();
        buildCatapults();
        buildStalls();
        buildPotStore();
        setupLighting();
    }

    function buildDesertFloor() {
        var floorGeo = new THREE.BoxGeometry(300, 1, 300);
        var floorMat = new THREE.MeshLambertMaterial({ color: SAND_COLOR });
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -0.5;
        scene.add(floor);
        objects.push(floor);
    }

    function buildDryMoat() {
        var moatDepth = 3;
        var moatWidth = 15;
        var moatMaterial = new THREE.MeshLambertMaterial({ color: 0xA68A64 });

        var cornerRadius = 85;
        var moatOuterSize = cornerRadius + 50;

        var northMoatGeo = new THREE.BoxGeometry(200, moatDepth, moatWidth);
        var northMoat = new THREE.Mesh(northMoatGeo, moatMaterial);
        northMoat.position.set(0, -moatDepth / 2, -moatOuterSize);
        scene.add(northMoat);
        objects.push(northMoat);

        var southMoatGeo = new THREE.BoxGeometry(200, moatDepth, moatWidth);
        var southMoat = new THREE.Mesh(southMoatGeo, moatMaterial);
        southMoat.position.set(0, -moatDepth / 2, moatOuterSize);
        scene.add(southMoat);
        objects.push(southMoat);

        var eastMoatGeo = new THREE.BoxGeometry(moatWidth, moatDepth, 200);
        var eastMoat = new THREE.Mesh(eastMoatGeo, moatMaterial);
        eastMoat.position.set(moatOuterSize, -moatDepth / 2, 0);
        scene.add(eastMoat);
        objects.push(eastMoat);

        var westMoatGeo = new THREE.BoxGeometry(moatWidth, moatDepth, 200);
        var westMoat = new THREE.Mesh(westMoatGeo, moatMaterial);
        westMoat.position.set(-moatOuterSize, -moatDepth / 2, 0);
        scene.add(westMoat);
        objects.push(westMoat);
    }

    function buildClayWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: CLAY_COLOR });
        var wallHeight = 12;
        var baseThickness = 8;
        var topThickness = 5;

        var northWallGeo = new THREE.BoxGeometry(160, wallHeight, baseThickness);
        var northWall = new THREE.Mesh(northWallGeo, wallMaterial);
        northWall.position.set(0, wallHeight / 2, -70);
        scene.add(northWall);
        objects.push(northWall);

        var southWallGeo = new THREE.BoxGeometry(160, wallHeight, baseThickness);
        var southWall = new THREE.Mesh(southWallGeo, wallMaterial);
        southWall.position.set(0, wallHeight / 2, 70);
        scene.add(southWall);
        objects.push(southWall);

        var eastWallGeo = new THREE.BoxGeometry(baseThickness, wallHeight, 160);
        var eastWall = new THREE.Mesh(eastWallGeo, wallMaterial);
        eastWall.position.set(70, wallHeight / 2, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        var westWallGeo = new THREE.BoxGeometry(baseThickness, wallHeight, 160);
        var westWall = new THREE.Mesh(westWallGeo, wallMaterial);
        westWall.position.set(-70, wallHeight / 2, 0);
        scene.add(westWall);
        objects.push(westWall);

        buildLoopholes();
        buildWallStairs();
    }

    function buildLoopholes() {
        var loopholeMaterial = new THREE.MeshLambertMaterial({ color: DARK_SHADOW });
        var loopholeSpacing = 30;
        var loopholeSize = 1.5;
        var loopholeHeight = 3;

        for (var i = -60; i <= 60; i += loopholeSpacing) {
            var northLoopGeo = new THREE.BoxGeometry(loopholeSize, loopholeHeight, 0.5);
            var northLoop = new THREE.Mesh(northLoopGeo, loopholeMaterial);
            northLoop.position.set(i, 8, -70);
            scene.add(northLoop);
            objects.push(northLoop);

            var southLoopGeo = new THREE.BoxGeometry(loopholeSize, loopholeHeight, 0.5);
            var southLoop = new THREE.Mesh(southLoopGeo, loopholeMaterial);
            southLoop.position.set(i, 8, 70);
            scene.add(southLoop);
            objects.push(southLoop);

            var eastLoopGeo = new THREE.BoxGeometry(0.5, loopholeHeight, loopholeSize);
            var eastLoop = new THREE.Mesh(eastLoopGeo, loopholeMaterial);
            eastLoop.position.set(70, 8, i);
            scene.add(eastLoop);
            objects.push(eastLoop);

            var westLoopGeo = new THREE.BoxGeometry(0.5, loopholeHeight, loopholeSize);
            var westLoop = new THREE.Mesh(westLoopGeo, loopholeMaterial);
            westLoop.position.set(-70, 8, i);
            scene.add(westLoop);
            objects.push(westLoop);
        }
    }

    function buildWallStairs() {
        var stairMaterial = new THREE.MeshLambertMaterial({ color: TERRA_COLOR });
        var stairCount = 6;
        var stairWidth = 2;
        var stairDepth = 1.5;

        for (var side = 0; side < 2; side++) {
            var startX = side === 0 ? 50 : -50;

            for (var i = 0; i < stairCount; i++) {
                var stairGeo = new THREE.BoxGeometry(stairWidth, 1.5 + i * 0.8, stairDepth);
                var stair = new THREE.Mesh(stairGeo, stairMaterial);
                stair.position.set(startX, 1 + i * 1.5, -65);
                scene.add(stair);
                objects.push(stair);
            }
        }
    }

    function buildTowers() {
        var towerRadius = 8;
        var towerHeight = 16;
        var towerMaterial = new THREE.MeshLambertMaterial({ color: CLAY_COLOR });
        var capMaterial = new THREE.MeshLambertMaterial({ color: TERRA_COLOR });

        var corners = [
            { x: 65, z: -65 },
            { x: 65, z: 65 },
            { x: -65, z: 65 },
            { x: -65, z: -65 }
        ];

        for (var c = 0; c < corners.length; c++) {
            var corner = corners[c];

            var towerGeo = new THREE.CylinderGeometry(towerRadius, towerRadius * 1.2, towerHeight, 16);
            var tower = new THREE.Mesh(towerGeo, towerMaterial);
            tower.position.set(corner.x, towerHeight / 2, corner.z);
            scene.add(tower);
            objects.push(tower);

            var capGeo = new THREE.ConeGeometry(towerRadius * 1.1, 4, 16);
            var cap = new THREE.Mesh(capGeo, capMaterial);
            cap.position.set(corner.x, towerHeight + 2, corner.z);
            scene.add(cap);
            objects.push(cap);

            buildTowerBattlements(corner.x, towerHeight, corner.z);
            buildTowerLoopholes(corner.x, corner.z);
            buildTowerBallista(corner.x, towerHeight, corner.z);
        }
    }

    function buildTowerBattlements() {
        var args = arguments;
        var towerX = args[0];
        var towerHeight = args[1];
        var towerZ = args[2];
        var battlementMaterial = new THREE.MeshLambertMaterial({ color: TERRA_COLOR });

        for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            var offsetX = Math.cos(angle) * 9;
            var offsetZ = Math.sin(angle) * 9;

            var battlementGeo = new THREE.BoxGeometry(1, 2, 1);
            var battlement = new THREE.Mesh(battlementGeo, battlementMaterial);
            battlement.position.set(towerX + offsetX, towerHeight + 1, towerZ + offsetZ);
            scene.add(battlement);
            objects.push(battlement);
        }
    }

    function buildTowerLoopholes() {
        var towerX = arguments[0];
        var towerZ = arguments[1];
        var loopholeMaterial = new THREE.MeshLambertMaterial({ color: DARK_SHADOW });

        for (var h = 4; h < 12; h += 3) {
            for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                var offsetX = Math.cos(angle) * 8;
                var offsetZ = Math.sin(angle) * 8;

                var loopholeGeo = new THREE.BoxGeometry(0.8, 1.5, 0.4);
                var loophole = new THREE.Mesh(loopholeGeo, loopholeMaterial);
                loophole.position.set(towerX + offsetX, h, towerZ + offsetZ);
                scene.add(loophole);
                objects.push(loophole);
            }
        }
    }

    function buildTowerBallista() {
        var towerX = arguments[0];
        var towerHeight = arguments[1];
        var towerZ = arguments[2];
        var ballistaMaterial = new THREE.MeshLambertMaterial({ color: RUST_COLOR });

        var frameGeo = new THREE.BoxGeometry(5, 2, 5);
        var frame = new THREE.Mesh(frameGeo, ballistaMaterial);
        frame.position.set(towerX, towerHeight - 2, towerZ);
        scene.add(frame);
        objects.push(frame);

        var armGeo = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
        var arm = new THREE.Mesh(armGeo, ballistaMaterial);
        arm.position.set(towerX, towerHeight - 1, towerZ);
        arm.rotation.z = Math.PI / 6;
        scene.add(arm);
        objects.push(arm);
    }

    function buildInnerCompound() {
        var compoundSize = 120;
        var compoundFloorGeo = new THREE.BoxGeometry(compoundSize, 0.5, compoundSize);
        var compoundFloorMat = new THREE.MeshLambertMaterial({ color: 0xC9A876 });
        var compoundFloor = new THREE.Mesh(compoundFloorGeo, compoundFloorMat);
        compoundFloor.position.y = 0.25;
        scene.add(compoundFloor);
        objects.push(compoundFloor);

        buildCompoundStorage();
        buildCompoundBarracks();
    }

    function buildCompoundStorage() {
        var storageX = -35;
        var storageZ = -30;
        var storageWidth = 20;
        var storageDepth = 15;
        var storageHeight = 8;
        var storageMat = new THREE.MeshLambertMaterial({ color: TERRA_COLOR });

        var storageWallGeo = new THREE.BoxGeometry(storageWidth, storageHeight, storageDepth);
        var storageWall = new THREE.Mesh(storageWallGeo, storageMat);
        storageWall.position.set(storageX, storageHeight / 2, storageZ);
        scene.add(storageWall);
        objects.push(storageWall);

        var roofGeo = new THREE.BoxGeometry(storageWidth + 2, 1, storageDepth + 2);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xB8860B });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(storageX, storageHeight + 0.5, storageZ);
        scene.add(roof);
        objects.push(roof);

        for (var x = -8; x <= 8; x += 4) {
            for (var z = -6; z <= 6; z += 4) {
                var chestGeo = new THREE.BoxGeometry(2, 1.5, 2);
                var chestMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
                var chest = new THREE.Mesh(chestGeo, chestMat);
                chest.position.set(storageX + x, 1, storageZ + z);
                scene.add(chest);
                objects.push(chest);
            }
        }
    }

    function buildCompoundBarracks() {
        var barracksX = 35;
        var barracksZ = -30;
        var barracksWidth = 25;
        var barracksDepth = 20;
        var barracksHeight = 6;
        var barracksMat = new THREE.MeshLambertMaterial({ color: CLAY_COLOR });

        var barracksWallGeo = new THREE.BoxGeometry(barracksWidth, barracksHeight, barracksDepth);
        var barracksWall = new THREE.Mesh(barracksWallGeo, barracksMat);
        barracksWall.position.set(barracksX, barracksHeight / 2, barracksZ);
        scene.add(barracksWall);
        objects.push(barracksWall);

        var roofGeo = new THREE.BoxGeometry(barracksWidth + 2, 1, barracksDepth + 2);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(barracksX, barracksHeight + 0.5, barracksZ);
        scene.add(roof);
        objects.push(roof);

        for (var b = 0; b < 4; b++) {
            var benchGeo = new THREE.BoxGeometry(3, 0.8, 1);
            var benchMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
            var bench = new THREE.Mesh(benchGeo, benchMat);
            bench.position.set(barracksX - 8 + b * 5, 0.8, barracksZ);
            scene.add(bench);
            objects.push(bench);
        }
    }

    function buildWells() {
        var wellPositions = [
            { x: 0, z: 20 },
            { x: -25, z: 35 },
            { x: 25, z: 35 }
        ];

        for (var w = 0; w < wellPositions.length; w++) {
            var wellPos = wellPositions[w];
            buildSingleWell(wellPos.x, wellPos.z);
        }
    }

    function buildSingleWell(wellX, wellZ) {
        var wellShaftGeo = new THREE.CylinderGeometry(3, 3.2, 8, 12);
        var wellShaftMat = new THREE.MeshLambertMaterial({ color: DARK_SHADOW });
        var wellShaft = new THREE.Mesh(wellShaftGeo, wellShaftMat);
        wellShaft.position.set(wellX, 3, wellZ);
        scene.add(wellShaft);
        objects.push(wellShaft);

        var copingGeo = new THREE.BoxGeometry(8, 1, 8);
        var copingMat = new THREE.MeshLambertMaterial({ color: TERRA_COLOR });
        var coping = new THREE.Mesh(copingGeo, copingMat);
        coping.position.set(wellX, 8, wellZ);
        scene.add(coping);
        objects.push(coping);

        var ropeWheelGeo = new THREE.CylinderGeometry(2, 2, 1, 8);
        var ropeWheelMat = new THREE.MeshLambertMaterial({ color: RUST_COLOR });
        var ropeWheel = new THREE.Mesh(ropeWheelGeo, ropeWheelMat);
        ropeWheel.position.set(wellX - 4, 9, wellZ);
        ropeWheel.rotation.z = Math.PI / 2;
        scene.add(ropeWheel);
        objects.push(ropeWheel);

        var bucketGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 8);
        var bucketMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var bucket = new THREE.Mesh(bucketGeo, bucketMat);
        bucket.position.set(wellX - 4, 6, wellZ);
        scene.add(bucket);
        objects.push(bucket);
    }

    function buildArmoury() {
        var armouryX = -30;
        var armouryZ = 35;
        var armouryWidth = 18;
        var armouryDepth = 18;
        var armouryHeight = 7;
        var armouryMat = new THREE.MeshLambertMaterial({ color: 0xAA7A57 });

        var armouryWallGeo = new THREE.BoxGeometry(armouryWidth, armouryHeight, armouryDepth);
        var armouryWall = new THREE.Mesh(armouryWallGeo, armouryMat);
        armouryWall.position.set(armouryX, armouryHeight / 2, armouryZ);
        scene.add(armouryWall);
        objects.push(armouryWall);

        var roofGeo = new THREE.BoxGeometry(armouryWidth + 2, 1, armouryDepth + 2);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(armouryX, armouryHeight + 0.5, armouryZ);
        scene.add(roof);
        objects.push(roof);

        var doorGeo = new THREE.BoxGeometry(3, 5, 0.5);
        var doorMat = new THREE.MeshLambertMaterial({ color: DARK_IRON });
        var door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(armouryX, 2.5, armouryZ - 9);
        scene.add(door);
        objects.push(door);

        buildArmouryRacks(armouryX, armouryZ);
    }

    function buildArmouryRacks(armouryX, armouryZ) {
        var rackMat = new THREE.MeshLambertMaterial({ color: 0x654321 });

        for (var i = 0; i < 3; i++) {
            var rackGeo = new THREE.BoxGeometry(12, 5, 2);
            var rack = new THREE.Mesh(rackGeo, rackMat);
            rack.position.set(armouryX, 3, armouryZ - 6 + i * 4);
            scene.add(rack);
            objects.push(rack);

            for (var j = 0; j < 4; j++) {
                var swordGeo = new THREE.BoxGeometry(0.3, 3, 0.1);
                var swordMat = new THREE.MeshLambertMaterial({ color: RUST_COLOR });
                var sword = new THREE.Mesh(swordGeo, swordMat);
                sword.position.set(armouryX - 4 + j * 2.5, 4, armouryZ - 6 + i * 4);
                sword.rotation.z = Math.PI / 6;
                scene.add(sword);
                objects.push(sword);
            }
        }
    }

    function buildGatehouse() {
        var gateX = 0;
        var gateZ = -70;
        var gateTowerWidth = 12;
        var gateTowerHeight = 14;
        var gateTowerDepth = 8;
        var gateGapWidth = 6;
        var gateTowerMat = new THREE.MeshLambertMaterial({ color: TERRA_COLOR });

        var leftTowerGeo = new THREE.BoxGeometry(gateTowerWidth, gateTowerHeight, gateTowerDepth);
        var leftTower = new THREE.Mesh(leftTowerGeo, gateTowerMat);
        leftTower.position.set(gateX - 12, gateTowerHeight / 2, gateZ);
        scene.add(leftTower);
        objects.push(leftTower);

        var rightTowerGeo = new THREE.BoxGeometry(gateTowerWidth, gateTowerHeight, gateTowerDepth);
        var rightTower = new THREE.Mesh(rightTowerGeo, gateTowerMat);
        rightTower.position.set(gateX + 12, gateTowerHeight / 2, gateZ);
        scene.add(rightTower);
        objects.push(rightTower);

        buildPortcullis(gateX, 8, gateZ);
        buildGatehouse_HeavyDoor(gateX, 5, gateZ);
    }

    function buildPortcullis(gateX, gateY, gateZ) {
        var portcullisMat = new THREE.MeshLambertMaterial({ color: DARK_IRON });
        var barSpacing = 0.8;

        for (var x = -2.5; x <= 2.5; x += barSpacing) {
            var barGeo = new THREE.BoxGeometry(0.4, 7, 0.3);
            var bar = new THREE.Mesh(barGeo, portcullisMat);
            bar.position.set(gateX + x, gateY, gateZ);
            scene.add(bar);
            objects.push(bar);
        }

        var framingGeo = new THREE.BoxGeometry(6, 1, 0.5);
        var framingMat = new THREE.MeshLambertMaterial({ color: RUST_COLOR });
        var topFraming = new THREE.Mesh(framingGeo, framingMat);
        topFraming.position.set(gateX, gateY + 3.5, gateZ);
        scene.add(topFraming);
        objects.push(topFraming);

        var bottomFraming = new THREE.Mesh(framingGeo, framingMat);
        bottomFraming.position.set(gateX, gateY - 3.5, gateZ);
        scene.add(bottomFraming);
        objects.push(bottomFraming);
    }

    function buildGatehouse_HeavyDoor(gateX, gateY, gateZ) {
        var doorGeo = new THREE.BoxGeometry(5, 10, 0.8);
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        var door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(gateX, gateY, gateZ + 2);
        scene.add(door);
        objects.push(door);

        for (var i = 0; i < 4; i++) {
            var studGeo = new THREE.SphereGeometry(0.4, 8, 8);
            var studMat = new THREE.MeshLambertMaterial({ color: RUST_COLOR });
            var stud = new THREE.Mesh(studGeo, studMat);
            stud.position.set(gateX - 1.5 + i * 1, 6 - i * 2, gateZ + 2);
            scene.add(stud);
            objects.push(stud);
        }
    }

    function buildCatapults() {
        var catapultPositions = [
            { x: 45, z: -45 },
            { x: -45, z: 45 }
        ];

        for (var c = 0; c < catapultPositions.length; c++) {
            var pos = catapultPositions[c];
            buildSingleCatapult(pos.x, pos.z);
        }
    }

    function buildSingleCatapult(catX, catZ) {
        var frameGeo = new THREE.BoxGeometry(6, 3, 6);
        var frameMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(catX, 2, catZ);
        scene.add(frame);
        objects.push(frame);
        catapultArmBase = frame;

        var armGeo = new THREE.CylinderGeometry(0.6, 0.6, 12, 8);
        var armMat = new THREE.MeshLambertMaterial({ color: RUST_COLOR });
        var arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(catX, 3.5, catZ);
        arm.rotation.z = Math.PI / 4;
        scene.add(arm);
        objects.push(arm);
        catapultArm = arm;

        var cupGeo = new THREE.BoxGeometry(3, 1, 3);
        var cupMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var cup = new THREE.Mesh(cupGeo, cupMat);
        cup.position.set(catX + 4, 8, catZ);
        scene.add(cup);
        objects.push(cup);

        buildCatapultAmmo(catX, catZ);
    }

    function buildCatapultAmmo(catX, catZ) {
        var ammoStackX = catX - 4;
        var ammoStackZ = catZ - 4;
        var ammoMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        for (var layer = 0; layer < 3; layer++) {
            for (var row = 0; row < 2; row++) {
                var ammoGeo = new THREE.SphereGeometry(1.2, 8, 8);
                var ammo = new THREE.Mesh(ammoGeo, ammoMat);
                ammo.position.set(ammoStackX + row * 2.5, 1.5 + layer * 2.5, ammoStackZ);
                scene.add(ammo);
                objects.push(ammo);
            }
        }
    }

    function buildStalls() {
        var stallPositions = [
            { x: -20, z: 10 },
            { x: 20, z: 10 },
            { x: 0, z: -10 }
        ];

        for (var s = 0; s < stallPositions.length; s++) {
            var pos = stallPositions[s];
            buildSingleStall(pos.x, pos.z);
        }
    }

    function buildSingleStall(stallX, stallZ) {
        var postGeo = new THREE.CylinderGeometry(0.8, 0.8, 5, 8);
        var postMat = new THREE.MeshLambertMaterial({ color: RUST_COLOR });

        for (var p = 0; p < 4; p++) {
            var post = new THREE.Mesh(postGeo, postMat);
            post.position.set(stallX - 3 + p * 2, 2.5, stallZ);
            scene.add(post);
            objects.push(post);
        }

        var awningGeo = new THREE.BoxGeometry(8, 0.5, 4);
        var awningMat = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
        var awning = new THREE.Mesh(awningGeo, awningMat);
        awning.position.set(stallX, 5, stallZ);
        scene.add(awning);
        objects.push(awning);

        var tableGeo = new THREE.BoxGeometry(6, 0.8, 3);
        var tableMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(stallX, 1, stallZ);
        scene.add(table);
        objects.push(table);

        for (var i = 0; i < 3; i++) {
            var goodsGeo = new THREE.BoxGeometry(1, 1, 1);
            var goodsMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
            var goods = new THREE.Mesh(goodsGeo, goodsMat);
            goods.position.set(stallX - 2 + i * 2, 1.5, stallZ);
            scene.add(goods);
            objects.push(goods);
        }
    }

    function buildPotStore() {
        var potStackX = 0;
        var potStackZ = -25;
        var potMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });

        for (var layer = 0; layer < 4; layer++) {
            var potsInLayer = 3 - layer;
            for (var p = 0; p < potsInLayer; p++) {
                var potGeo = new THREE.CylinderGeometry(1.5, 1.8, 3, 12);
                var pot = new THREE.Mesh(potGeo, potMat);
                pot.position.set(potStackX - 2 + p * 3, 1.5 + layer * 3, potStackZ);
                scene.add(pot);
                objects.push(pot);

                var lidGeo = new THREE.ConeGeometry(1.6, 0.8, 12);
                var lidMat = new THREE.MeshLambertMaterial({ color: 0xB8860B });
                var lid = new THREE.Mesh(lidGeo, lidMat);
                lid.position.set(potStackX - 2 + p * 3, 4.5 + layer * 3, potStackZ);
                scene.add(lid);
                objects.push(lid);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 80, 50);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var torchLight1 = new THREE.PointLight(0xFFAA44, 0.6, 30);
        torchLight1.position.set(65, 14, -65);
        scene.add(torchLight1);
        lights.push(torchLight1);

        var torchLight2 = new THREE.PointLight(0xFFAA44, 0.6, 30);
        torchLight2.position.set(-65, 14, 65);
        scene.add(torchLight2);
        lights.push(torchLight2);

        var gateLight = new THREE.PointLight(0xFFAAAA, 0.4, 40);
        gateLight.position.set(0, 10, -70);
        scene.add(gateLight);
        lights.push(gateLight);
    }

    function update(delta) {
        if (catapultArm) {
            var oscillation = Math.sin(Date.now() * 0.002) * 0.5;
            catapultArm.rotation.z = Math.PI / 4 + oscillation;
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
        catapultArm = null;
        catapultArmBase = null;
    }

    return { init: init, update: update, reset: reset };
}());
