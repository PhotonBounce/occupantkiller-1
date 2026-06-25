window.RockFortress = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animationState = {
        elevatorPosition: 0,
        elevatorDirection: 1,
        searchlightAngle: 0,
        cableRotation: 0
    };

    var colors = {
        graniteGray: 0x6B7280,
        rockyBrown: 0x8B6F47,
        fortressStone: 0x7A8FA3,
        mountainShadow: 0x4A5568,
        darkGray: 0x2D3748,
        lightGray: 0x9CA3AF,
        steelGray: 0x5A6B7A
    };

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animationState = { elevatorPosition: 0, elevatorDirection: 1, searchlightAngle: 0, cableRotation: 0 };

        buildCliffFace();
        buildFortress();
        buildTunnels();
        buildGunPositions();
        buildScree();
        buildElevator();
        buildWatchtower();
        buildRopeLadders();
        buildPaths();
        buildBoulders();
        buildBarricades();
        setupLighting();
    }

    function buildCliffFace() {
        var mainCliffGeometry = new THREE.BoxGeometry(150, 200, 40);
        var mainCliffMaterial = new THREE.MeshLambertMaterial({ color: colors.graniteGray });
        var mainCliff = new THREE.Mesh(mainCliffGeometry, mainCliffMaterial);
        mainCliff.position.set(0, 50, -30);
        mainCliff.castShadow = true;
        mainCliff.receiveShadow = true;
        scene.add(mainCliff);
        objects.push(mainCliff);

        var cliffSection1 = new THREE.BoxGeometry(60, 150, 35);
        var cliffMat1 = new THREE.MeshLambertMaterial({ color: colors.mountainShadow });
        var cliff1 = new THREE.Mesh(cliffSection1, cliffMat1);
        cliff1.position.set(-50, 80, -20);
        cliff1.castShadow = true;
        cliff1.receiveShadow = true;
        scene.add(cliff1);
        objects.push(cliff1);

        var cliffSection2 = new THREE.BoxGeometry(60, 130, 35);
        var cliffMat2 = new THREE.MeshLambertMaterial({ color: colors.rockyBrown });
        var cliff2 = new THREE.Mesh(cliffSection2, cliffMat2);
        cliff2.position.set(50, 70, -20);
        cliff2.castShadow = true;
        cliff2.receiveShadow = true;
        scene.add(cliff2);
        objects.push(cliff2);

        var cliffSection3 = new THREE.BoxGeometry(40, 180, 30);
        var cliffMat3 = new THREE.MeshLambertMaterial({ color: colors.darkGray });
        var cliff3 = new THREE.Mesh(cliffSection3, cliffMat3);
        cliff3.position.set(0, 100, -15);
        cliff3.castShadow = true;
        cliff3.receiveShadow = true;
        scene.add(cliff3);
        objects.push(cliff3);

        var baseRock = new THREE.BoxGeometry(180, 40, 50);
        var baseRockMat = new THREE.MeshLambertMaterial({ color: colors.graniteGray });
        var rockBase = new THREE.Mesh(baseRock, baseRockMat);
        rockBase.position.set(0, -20, -25);
        rockBase.castShadow = true;
        rockBase.receiveShadow = true;
        scene.add(rockBase);
        objects.push(rockBase);
    }

    function buildFortress() {
        var fortressBuilding1 = new THREE.BoxGeometry(35, 45, 25);
        var fortressMat = new THREE.MeshLambertMaterial({ color: colors.fortressStone });
        var fort1 = new THREE.Mesh(fortressBuilding1, fortressMat);
        fort1.position.set(-30, 30, -5);
        fort1.castShadow = true;
        fort1.receiveShadow = true;
        scene.add(fort1);
        objects.push(fort1);

        var fortressBuilding2 = new THREE.BoxGeometry(40, 50, 28);
        var fort2 = new THREE.Mesh(fortressBuilding2, fortressMat);
        fort2.position.set(40, 35, -8);
        fort2.castShadow = true;
        fort2.receiveShadow = true;
        scene.add(fort2);
        objects.push(fort2);

        var fortressCore = new THREE.BoxGeometry(50, 60, 30);
        var coreMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
        var core = new THREE.Mesh(fortressCore, coreMat);
        core.position.set(0, 45, -10);
        core.castShadow = true;
        core.receiveShadow = true;
        scene.add(core);
        objects.push(core);

        var roofSection1 = new THREE.BoxGeometry(35, 8, 25);
        var roofMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
        var roof1 = new THREE.Mesh(roofSection1, roofMat);
        roof1.position.set(-30, 78, -5);
        roof1.castShadow = true;
        scene.add(roof1);
        objects.push(roof1);

        var roofSection2 = new THREE.BoxGeometry(40, 8, 28);
        var roof2 = new THREE.Mesh(roofSection2, roofMat);
        roof2.position.set(40, 83, -8);
        roof2.castShadow = true;
        scene.add(roof2);
        objects.push(roof2);

        var roofCore = new THREE.BoxGeometry(50, 8, 30);
        var roof3 = new THREE.Mesh(roofCore, roofMat);
        roof3.position.set(0, 98, -10);
        roof3.castShadow = true;
        scene.add(roof3);
        objects.push(roof3);

        var fortWall1 = new THREE.BoxGeometry(20, 35, 3);
        var wallMat = new THREE.MeshLambertMaterial({ color: colors.mountainShadow });
        var wall1 = new THREE.Mesh(fortWall1, wallMat);
        wall1.position.set(-45, 45, 10);
        wall1.castShadow = true;
        scene.add(wall1);
        objects.push(wall1);

        var fortWall2 = new THREE.BoxGeometry(3, 40, 20);
        var wall2 = new THREE.Mesh(fortWall2, wallMat);
        wall2.position.set(50, 50, 0);
        wall2.castShadow = true;
        scene.add(wall2);
        objects.push(wall2);

        var ammoStackPositions = [
            { x: -25, y: 5, z: 10 },
            { x: -20, y: 5, z: 10 },
            { x: 30, y: 8, z: 12 },
            { x: 35, y: 8, z: 12 },
            { x: 0, y: 10, z: 15 },
            { x: 5, y: 10, z: 15 }
        ];

        for (var q = 0; q < ammoStackPositions.length; q++) {
            var crateGeometry = new THREE.BoxGeometry(5, 6, 5);
            var crateMat = new THREE.MeshLambertMaterial({ color: colors.rockyBrown });
            var crate = new THREE.Mesh(crateGeometry, crateMat);
            crate.position.set(ammoStackPositions[q].x, ammoStackPositions[q].y, ammoStackPositions[q].z);
            crate.castShadow = true;
            scene.add(crate);
            objects.push(crate);
        }

        for (var r = 0; r < 12; r++) {
            var sandbag = new THREE.BoxGeometry(4, 3, 2);
            var sandbagMat = new THREE.MeshLambertMaterial({ color: colors.rockyBrown });
            var sandbagMesh = new THREE.Mesh(sandbag, sandbagMat);
            sandbagMesh.position.set(-50 + r * 8, 5, 5);
            sandbagMesh.castShadow = true;
            scene.add(sandbagMesh);
            objects.push(sandbagMesh);
        }
    }

    function buildTunnels() {
        var tunnelEntrance1 = new THREE.BoxGeometry(25, 35, 28);
        var tunnelMat = new THREE.MeshLambertMaterial({ color: colors.rockyBrown });
        var tunnel1 = new THREE.Mesh(tunnelEntrance1, tunnelMat);
        tunnel1.position.set(-40, 20, 5);
        tunnel1.castShadow = true;
        tunnel1.receiveShadow = true;
        scene.add(tunnel1);
        objects.push(tunnel1);

        var tunnelArch1Top = new THREE.ConeGeometry(13, 10, 8);
        var archMat = new THREE.MeshLambertMaterial({ color: colors.graniteGray });
        var arch1 = new THREE.Mesh(tunnelArch1Top, archMat);
        arch1.position.set(-40, 40, 5);
        arch1.castShadow = true;
        scene.add(arch1);
        objects.push(arch1);

        var tunnelEntrance2 = new THREE.BoxGeometry(22, 32, 25);
        var tunnel2 = new THREE.Mesh(tunnelEntrance1, tunnelMat);
        tunnel2.position.set(45, 25, 8);
        tunnel2.castShadow = true;
        tunnel2.receiveShadow = true;
        scene.add(tunnel2);
        objects.push(tunnel2);

        var arch2 = new THREE.Mesh(tunnelArch1Top, archMat);
        arch2.position.set(45, 42, 8);
        arch2.castShadow = true;
        scene.add(arch2);
        objects.push(arch2);

        var tunnelCorridor = new THREE.BoxGeometry(18, 28, 80);
        var corridorMat = new THREE.MeshLambertMaterial({ color: colors.mountainShadow });
        var corridor = new THREE.Mesh(tunnelCorridor, corridorMat);
        corridor.position.set(0, 22, 40);
        corridor.castShadow = true;
        scene.add(corridor);
        objects.push(corridor);

        var tunnelSupport1 = new THREE.CylinderGeometry(2.5, 2.5, 28, 8);
        var supportMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
        var support1 = new THREE.Mesh(tunnelSupport1, supportMat);
        support1.position.set(-6, 36, 50);
        support1.castShadow = true;
        scene.add(support1);
        objects.push(support1);

        var support2 = new THREE.Mesh(tunnelSupport1, supportMat);
        support2.position.set(6, 36, 50);
        support2.castShadow = true;
        scene.add(support2);
        objects.push(support2);

        var support3 = new THREE.Mesh(tunnelSupport1, supportMat);
        support3.position.set(-6, 36, 10);
        support3.castShadow = true;
        scene.add(support3);
        objects.push(support3);

        var support4 = new THREE.Mesh(tunnelSupport1, supportMat);
        support4.position.set(6, 36, 10);
        support4.castShadow = true;
        scene.add(support4);
        objects.push(support4);
    }

    function buildGunPositions() {
        var gunEmplacement1 = new THREE.BoxGeometry(28, 18, 20);
        var gunMat = new THREE.MeshLambertMaterial({ color: colors.fortressStone });
        var gun1 = new THREE.Mesh(gunEmplacement1, gunMat);
        gun1.position.set(-35, 75, 5);
        gun1.castShadow = true;
        gun1.receiveShadow = true;
        scene.add(gun1);
        objects.push(gun1);

        var gunBarrel1 = new THREE.CylinderGeometry(1.5, 1.5, 20, 16);
        var barrelMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
        var barrel1 = new THREE.Mesh(gunBarrel1, barrelMat);
        barrel1.position.set(-35, 82, 20);
        barrel1.rotation.z = Math.PI / 4;
        barrel1.castShadow = true;
        scene.add(barrel1);
        objects.push(barrel1);

        var gunEmplacement2 = new THREE.BoxGeometry(30, 20, 22);
        var gun2 = new THREE.Mesh(gunEmplacement1, gunMat);
        gun2.position.set(38, 80, 8);
        gun2.castShadow = true;
        gun2.receiveShadow = true;
        scene.add(gun2);
        objects.push(gun2);

        var barrel2 = new THREE.Mesh(gunBarrel1, barrelMat);
        barrel2.position.set(38, 88, 22);
        barrel2.rotation.z = Math.PI / 5;
        barrel2.castShadow = true;
        scene.add(barrel2);
        objects.push(barrel2);

        var gunShield1 = new THREE.BoxGeometry(15, 12, 2);
        var shieldMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
        var shield1 = new THREE.Mesh(gunShield1, shieldMat);
        shield1.position.set(-35, 82, 16);
        shield1.castShadow = true;
        scene.add(shield1);
        objects.push(shield1);

        var shield2 = new THREE.Mesh(gunShield1, shieldMat);
        shield2.position.set(38, 87, 18);
        shield2.castShadow = true;
        scene.add(shield2);
        objects.push(shield2);

        var gunEmplacement3 = new THREE.BoxGeometry(25, 16, 18);
        var gun3 = new THREE.Mesh(gunEmplacement3, gunMat);
        gun3.position.set(-5, 110, 10);
        gun3.castShadow = true;
        gun3.receiveShadow = true;
        scene.add(gun3);
        objects.push(gun3);

        var barrel3 = new THREE.Mesh(gunBarrel1, barrelMat);
        barrel3.position.set(-5, 120, 24);
        barrel3.rotation.z = Math.PI / 6;
        barrel3.castShadow = true;
        scene.add(barrel3);
        objects.push(barrel3);
    }

    function buildScree() {
        var screeColors = [colors.rockyBrown, colors.graniteGray, colors.mountainShadow, colors.darkGray];

        for (var i = 0; i < 40; i++) {
            var screeGeometry = new THREE.SphereGeometry(Math.random() * 4 + 2, 8, 8);
            var screeColor = screeColors[Math.floor(Math.random() * screeColors.length)];
            var screeMat = new THREE.MeshLambertMaterial({ color: screeColor });
            var screeMesh = new THREE.Mesh(screeGeometry, screeMat);

            var xPos = (Math.random() - 0.5) * 140;
            var zPos = -10 + Math.random() * 20;
            screeMesh.position.set(xPos, -35 + Math.random() * 8, zPos);
            screeMesh.castShadow = true;
            screeMesh.receiveShadow = true;
            scene.add(screeMesh);
            objects.push(screeMesh);
        }
    }

    function buildElevator() {
        var elevatorPlatform = new THREE.BoxGeometry(16, 4, 16);
        var elevatorMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
        var platform = new THREE.Mesh(elevatorPlatform, elevatorMat);
        platform.position.set(-55, -5, -15);
        platform.castShadow = true;
        platform.receiveShadow = true;
        platform.userData = { isElevator: true };
        scene.add(platform);
        objects.push(platform);

        var shaftWall1 = new THREE.BoxGeometry(3, 120, 16);
        var shaftMat = new THREE.MeshLambertMaterial({ color: colors.rockyBrown });
        var shaft1 = new THREE.Mesh(shaftWall1, shaftMat);
        shaft1.position.set(-64, 50, -15);
        shaft1.castShadow = true;
        scene.add(shaft1);
        objects.push(shaft1);

        var shaft2 = new THREE.Mesh(shaftWall1, shaftMat);
        shaft2.position.set(-46, 50, -15);
        shaft2.castShadow = true;
        scene.add(shaft2);
        objects.push(shaft2);

        var shaftWall2 = new THREE.BoxGeometry(20, 120, 3);
        var shaft3 = new THREE.Mesh(shaftWall2, shaftMat);
        shaft3.position.set(-55, 50, -23);
        shaft3.castShadow = true;
        scene.add(shaft3);
        objects.push(shaft3);

        var shaft4 = new THREE.Mesh(shaftWall2, shaftMat);
        shaft4.position.set(-55, 50, -7);
        shaft4.castShadow = true;
        scene.add(shaft4);
        objects.push(shaft4);

        var cableGeometry = new THREE.CylinderGeometry(0.8, 0.8, 120, 8);
        var cableMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
        var cable = new THREE.Mesh(cableGeometry, cableMat);
        cable.position.set(-55, 50, -15);
        cable.castShadow = true;
        cable.userData = { isCable: true };
        scene.add(cable);
        objects.push(cable);
    }

    function buildWatchtower() {
        var towerBase = new THREE.BoxGeometry(18, 12, 18);
        var towerBaseMat = new THREE.MeshLambertMaterial({ color: colors.fortressStone });
        var base = new THREE.Mesh(towerBase, towerBaseMat);
        base.position.set(60, 140, -5);
        base.castShadow = true;
        base.receiveShadow = true;
        scene.add(base);
        objects.push(base);

        var towerShaft = new THREE.CylinderGeometry(5, 5, 50, 12);
        var shaftMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
        var shaft = new THREE.Mesh(towerShaft, shaftMat);
        shaft.position.set(60, 155, -5);
        shaft.castShadow = true;
        shaft.receiveShadow = true;
        scene.add(shaft);
        objects.push(shaft);

        var towerTop = new THREE.BoxGeometry(16, 8, 16);
        var topMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
        var top = new THREE.Mesh(towerTop, topMat);
        top.position.set(60, 188, -5);
        top.castShadow = true;
        top.receiveShadow = true;
        scene.add(top);
        objects.push(top);

        var searchlightBase = new THREE.CylinderGeometry(2, 2, 2, 12);
        var searchlightMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
        var searchBase = new THREE.Mesh(searchlightBase, searchlightMat);
        searchBase.position.set(60, 195, -5);
        searchBase.castShadow = true;
        scene.add(searchBase);
        objects.push(searchBase);

        var searchlightHead = new THREE.SphereGeometry(3, 12, 8);
        var searchHeadMat = new THREE.MeshLambertMaterial({ color: colors.lightGray });
        var searchHead = new THREE.Mesh(searchlightHead, searchHeadMat);
        searchHead.position.set(60, 198, -5);
        searchHead.castShadow = true;
        searchHead.userData = { isSearchlight: true };
        scene.add(searchHead);
        objects.push(searchHead);

        var railing1 = new THREE.BoxGeometry(14, 1, 1);
        var railMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
        var rail1 = new THREE.Mesh(railing1, railMat);
        rail1.position.set(60, 184, 6);
        rail1.castShadow = true;
        scene.add(rail1);
        objects.push(rail1);

        var rail2 = new THREE.Mesh(railing1, railMat);
        rail2.position.set(60, 184, -16);
        rail2.castShadow = true;
        scene.add(rail2);
        objects.push(rail2);

        var railing2 = new THREE.BoxGeometry(1, 1, 14);
        var rail3 = new THREE.Mesh(railing2, railMat);
        rail3.position.set(67, 184, -5);
        rail3.castShadow = true;
        scene.add(rail3);
        objects.push(rail3);

        var rail4 = new THREE.Mesh(railing2, railMat);
        rail4.position.set(53, 184, -5);
        rail4.castShadow = true;
        scene.add(rail4);
        objects.push(rail4);
    }

    function buildRopeLadders() {
        var ladderLeft = new THREE.BoxGeometry(1.5, 50, 1.5);
        var ladderMat = new THREE.MeshLambertMaterial({ color: colors.rockyBrown });
        var leftRope = new THREE.Mesh(ladderLeft, ladderMat);
        leftRope.position.set(-50, 50, 12);
        leftRope.castShadow = true;
        scene.add(leftRope);
        objects.push(leftRope);

        var ladderRight = new THREE.BoxGeometry(1.5, 50, 1.5);
        var rightRope = new THREE.Mesh(ladderRight, ladderMat);
        rightRope.position.set(-35, 50, 12);
        rightRope.castShadow = true;
        scene.add(rightRope);
        objects.push(rightRope);

        for (var i = 0; i < 12; i++) {
            var rung = new THREE.BoxGeometry(16, 1.5, 1.5);
            var rungMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
            var rungMesh = new THREE.Mesh(rung, rungMat);
            rungMesh.position.set(-42.5, 25 + i * 4, 12);
            rungMesh.castShadow = true;
            scene.add(rungMesh);
            objects.push(rungMesh);
        }

        var ladder2Left = new THREE.BoxGeometry(1.5, 40, 1.5);
        var leftRope2 = new THREE.Mesh(ladder2Left, ladderMat);
        leftRope2.position.set(30, 60, 15);
        leftRope2.castShadow = true;
        scene.add(leftRope2);
        objects.push(leftRope2);

        var ladder2Right = new THREE.BoxGeometry(1.5, 40, 1.5);
        var rightRope2 = new THREE.Mesh(ladder2Right, ladderMat);
        rightRope2.position.set(45, 60, 15);
        rightRope2.castShadow = true;
        scene.add(rightRope2);
        objects.push(rightRope2);

        for (var j = 0; j < 10; j++) {
            var rung2 = new THREE.BoxGeometry(16, 1.5, 1.5);
            var rung2Mesh = new THREE.Mesh(rung2, rungMat);
            rung2Mesh.position.set(37.5, 40 + j * 4, 15);
            rung2Mesh.castShadow = true;
            scene.add(rung2Mesh);
            objects.push(rung2Mesh);
        }
    }

    function buildPaths() {
        var pathSegment1 = new THREE.BoxGeometry(25, 3, 15);
        var pathMat = new THREE.MeshLambertMaterial({ color: colors.graniteGray });
        var path1 = new THREE.Mesh(pathSegment1, pathMat);
        path1.position.set(-40, 0, 20);
        path1.castShadow = true;
        path1.receiveShadow = true;
        scene.add(path1);
        objects.push(path1);

        var pathSegment2 = new THREE.BoxGeometry(25, 3, 15);
        var path2 = new THREE.Mesh(pathSegment2, pathMat);
        path2.position.set(40, 15, 25);
        path2.castShadow = true;
        path2.receiveShadow = true;
        scene.add(path2);
        objects.push(path2);

        var pathSegment3 = new THREE.BoxGeometry(20, 3, 12);
        var path3 = new THREE.Mesh(pathSegment3, pathMat);
        path3.position.set(0, 30, 35);
        path3.castShadow = true;
        path3.receiveShadow = true;
        scene.add(path3);
        objects.push(path3);

        var pathSegment4 = new THREE.BoxGeometry(22, 3, 13);
        var path4 = new THREE.Mesh(pathSegment4, pathMat);
        path4.position.set(-25, 18, 28);
        path4.castShadow = true;
        path4.receiveShadow = true;
        scene.add(path4);
        objects.push(path4);

        var pathSegment5 = new THREE.BoxGeometry(23, 3, 14);
        var path5 = new THREE.Mesh(pathSegment5, pathMat);
        path5.position.set(20, 25, 32);
        path5.castShadow = true;
        path5.receiveShadow = true;
        scene.add(path5);
        objects.push(path5);

        var pathEdge1 = new THREE.BoxGeometry(1.5, 2, 15);
        var edgeMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
        var edge1 = new THREE.Mesh(pathEdge1, edgeMat);
        edge1.position.set(-51.5, 3.5, 20);
        edge1.castShadow = true;
        scene.add(edge1);
        objects.push(edge1);

        var pathEdge2 = new THREE.Mesh(pathEdge1, edgeMat);
        pathEdge2.position.set(-28.5, 3.5, 20);
        pathEdge2.castShadow = true;
        scene.add(pathEdge2);
        objects.push(pathEdge2);
    }

    function buildBoulders() {
        var boulderPositions = [
            { x: -30, y: 80, z: 25 },
            { x: -25, y: 85, z: 28 },
            { x: -35, y: 88, z: 22 },
            { x: 35, y: 90, z: 30 },
            { x: 40, y: 88, z: 32 },
            { x: 32, y: 92, z: 28 },
            { x: 5, y: 100, z: 18 },
            { x: 0, y: 105, z: 15 },
            { x: -5, y: 102, z: 20 },
            { x: 15, y: 95, z: 35 },
            { x: -15, y: 98, z: 30 },
            { x: 25, y: 105, z: 25 },
            { x: -20, y: 110, z: 20 },
            { x: 45, y: 85, z: 35 },
            { x: -50, y: 95, z: 28 }
        ];

        for (var i = 0; i < boulderPositions.length; i++) {
            var boulderGeometry = new THREE.SphereGeometry(Math.random() * 3 + 2.5, 10, 10);
            var boulderMat = new THREE.MeshLambertMaterial({ color: colors.rockyBrown });
            var boulder = new THREE.Mesh(boulderGeometry, boulderMat);
            boulder.position.set(boulderPositions[i].x, boulderPositions[i].y, boulderPositions[i].z);
            boulder.castShadow = true;
            boulder.receiveShadow = true;
            scene.add(boulder);
            objects.push(boulder);
        }
    }

    function buildBarricades() {
        var barricadePositions = [
            { x: -50, y: 10, z: 15 },
            { x: -45, y: 12, z: 18 },
            { x: -40, y: 8, z: 20 },
            { x: 45, y: 15, z: 22 },
            { x: 50, y: 18, z: 20 },
            { x: 35, y: 14, z: 25 },
            { x: 0, y: 20, z: 30 },
            { x: 5, y: 22, z: 32 },
            { x: -5, y: 18, z: 28 }
        ];

        for (var i = 0; i < barricadePositions.length; i++) {
            var barricade = new THREE.BoxGeometry(8, 6, 2);
            var barricadeMat = new THREE.MeshLambertMaterial({ color: colors.rockyBrown });
            var barricadeMesh = new THREE.Mesh(barricade, barricadeMat);
            barricadeMesh.position.set(barricadePositions[i].x, barricadePositions[i].y, barricadePositions[i].z);
            barricadeMesh.castShadow = true;
            barricadeMesh.receiveShadow = true;
            scene.add(barricadeMesh);
            objects.push(barricadeMesh);
        }

        var defenseWallLeft = new THREE.BoxGeometry(3, 15, 25);
        var defenseWallMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
        var wall1 = new THREE.Mesh(defenseWallLeft, defenseWallMat);
        wall1.position.set(-70, 20, 0);
        wall1.castShadow = true;
        scene.add(wall1);
        objects.push(wall1);

        var defenseWallRight = new THREE.BoxGeometry(3, 15, 25);
        var wall2 = new THREE.Mesh(defenseWallRight, defenseWallMat);
        wall2.position.set(70, 20, 0);
        wall2.castShadow = true;
        scene.add(wall2);
        objects.push(wall2);

        for (var j = 0; j < 8; j++) {
            var post = new THREE.CylinderGeometry(1.2, 1.2, 18, 8);
            var postMat = new THREE.MeshLambertMaterial({ color: colors.rockyBrown });
            var postMesh = new THREE.Mesh(post, postMat);
            postMesh.position.set(-60 + j * 20, 15, 10);
            postMesh.castShadow = true;
            scene.add(postMesh);
            objects.push(postMesh);
        }

        for (var k = 0; k < 6; k++) {
            var crossbeam = new THREE.BoxGeometry(18, 1.5, 1.5);
            var beamMat = new THREE.MeshLambertMaterial({ color: colors.steelGray });
            var beamMesh = new THREE.Mesh(crossbeam, beamMat);
            beamMesh.position.set(0, 8 + k * 3, 10);
            beamMesh.castShadow = true;
            scene.add(beamMesh);
            objects.push(beamMesh);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(100, 150, 80);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.left = -200;
        sunLight.shadow.camera.right = 200;
        sunLight.shadow.camera.top = 200;
        sunLight.shadow.camera.bottom = -200;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        scene.add(sunLight);
        lights.push(sunLight);

        var fortressLight = new THREE.PointLight(0xaabbff, 0.6, 100);
        fortressLight.position.set(-30, 60, 0);
        fortressLight.castShadow = true;
        scene.add(fortressLight);
        lights.push(fortressLight);

        var towerLight = new THREE.PointLight(0xffffaa, 0.8, 120);
        towerLight.position.set(60, 200, -5);
        towerLight.castShadow = true;
        scene.add(towerLight);
        lights.push(towerLight);
    }

    function update(delta) {
        if (!scene || !camera) {
            return;
        }

        animationState.elevatorPosition += animationState.elevatorDirection * delta * 0.15;
        if (animationState.elevatorPosition > 60) {
            animationState.elevatorDirection = -1;
        } else if (animationState.elevatorPosition < 0) {
            animationState.elevatorDirection = 1;
        }

        for (var i = 0; i < objects.length; i++) {
            if (objects[i].userData && objects[i].userData.isElevator) {
                objects[i].position.y = -5 + animationState.elevatorPosition;
            }
        }

        animationState.searchlightAngle += delta * 0.5;
        var searchlightIndex = -1;
        for (var j = 0; j < objects.length; j++) {
            if (objects[j].userData && objects[j].userData.isSearchlight) {
                searchlightIndex = j;
                break;
            }
        }

        if (searchlightIndex >= 0) {
            var baseAngle = Math.sin(animationState.searchlightAngle) * 0.6;
            objects[searchlightIndex].rotation.z = baseAngle;
        }

        animationState.cableRotation += delta * 0.3;
        for (var k = 0; k < objects.length; k++) {
            if (objects[k].userData && objects[k].userData.isCable) {
                objects[k].rotation.y = animationState.cableRotation;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            if (scene && objects[i]) {
                scene.remove(objects[i]);
            }
        }
        for (var j = 0; j < lights.length; j++) {
            if (scene && lights[j]) {
                scene.remove(lights[j]);
            }
        }
        objects = [];
        lights = [];
        scene = null;
        camera = null;
        animationState = { elevatorPosition: 0, elevatorDirection: 1, searchlightAngle: 0, cableRotation: 0 };
    }

    return { init: init, update: update, reset: reset };
}());
