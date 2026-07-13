window.WarBunker = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var radarDish = null;
    var emergencyLights = [];
    var antennaWire = null;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        emergencyLights = [];
        buildExterior();
        buildInterior();
        buildDefenses();
        buildEquipment();
        buildTunnels();
        buildDamage();
        buildSupplies();
        setupLighting();
    }

    function buildExterior() {
        var concreteGray = 0x808080;
        var darkEarth = 0x4a3728;
        var mainGeom = new THREE.BoxGeometry(30, 20, 15);
        var mainMat = new THREE.MeshLambertMaterial({ color: concreteGray });
        var mainBunker = new THREE.Mesh(mainGeom, mainMat);
        mainBunker.position.set(0, 10, 0);
        scene.add(mainBunker);
        objects.push(mainBunker);

        var topRoofGeom = new THREE.BoxGeometry(32, 2, 17);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x707070 });
        var roofMesh = new THREE.Mesh(topRoofGeom, roofMat);
        roofMesh.position.set(0, 21, 0);
        scene.add(roofMesh);
        objects.push(roofMesh);

        var northWall = new THREE.BoxGeometry(30, 20, 1);
        var wallMat = new THREE.MeshLambertMaterial({ color: concreteGray });
        var northWallMesh = new THREE.Mesh(northWall, wallMat);
        northWallMesh.position.set(0, 10, -7.5);
        scene.add(northWallMesh);
        objects.push(northWallMesh);

        var southWall = new THREE.BoxGeometry(30, 20, 1);
        var southWallMesh = new THREE.Mesh(southWall, wallMat);
        southWallMesh.position.set(0, 10, 7.5);
        scene.add(southWallMesh);
        objects.push(southWallMesh);

        var eastWall = new THREE.BoxGeometry(1, 20, 15);
        var eastWallMesh = new THREE.Mesh(eastWall, wallMat);
        eastWallMesh.position.set(15, 10, 0);
        scene.add(eastWallMesh);
        objects.push(eastWallMesh);

        var westWall = new THREE.BoxGeometry(1, 20, 15);
        var westWallMesh = new THREE.Mesh(westWall, wallMat);
        westWallMesh.position.set(-15, 10, 0);
        scene.add(westWallMesh);
        objects.push(westWallMesh);

        var antiTankDitchOuter = new THREE.BoxGeometry(40, 2, 25);
        var dirtMat = new THREE.MeshLambertMaterial({ color: darkEarth });
        var ditchOuter = new THREE.Mesh(antiTankDitchOuter, dirtMat);
        ditchOuter.position.set(0, -1, 0);
        scene.add(ditchOuter);
        objects.push(ditchOuter);

        var antiTankDitchInner = new THREE.BoxGeometry(34, 1.5, 19);
        var ditchInner = new THREE.Mesh(antiTankDitchInner, dirtMat);
        ditchInner.position.set(0, -0.5, 0);
        scene.add(ditchInner);
        objects.push(ditchInner);

        for (var i = 0; i < 6; i++) {
            var slitGeom = new THREE.BoxGeometry(1, 1.5, 0.3);
            var slitMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var slit = new THREE.Mesh(slitGeom, slitMat);
            slit.position.set(-10 + i * 4, 12, -7.6);
            scene.add(slit);
            objects.push(slit);
        }

        for (var i = 0; i < 4; i++) {
            var ventGeom = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
            var ventMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
            var vent = new THREE.Mesh(ventGeom, ventMat);
            vent.position.set(-8 + i * 5, 22, 5);
            scene.add(vent);
            objects.push(vent);
        }

        for (var i = 0; i < 3; i++) {
            var ventTopGeom = new THREE.ConeGeometry(1, 1, 8);
            var ventTopMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
            var ventTop = new THREE.Mesh(ventTopGeom, ventTopMat);
            ventTop.position.set(-8 + i * 5, 25.5, 5);
            scene.add(ventTop);
            objects.push(ventTop);
        }
    }

    function buildInterior() {
        var khakiColor = 0xc3b091;
        var metalColor = 0xa8a8a8;
        var darkWood = 0x3d2817;

        var floorGeom = new THREE.BoxGeometry(28, 0.5, 13);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var floor = new THREE.Mesh(floorGeom, floorMat);
        floor.position.set(0, 0.25, 0);
        scene.add(floor);
        objects.push(floor);

        var tableGeom = new THREE.BoxGeometry(8, 1, 3);
        var tableMat = new THREE.MeshLambertMaterial({ color: darkWood });
        var table = new THREE.Mesh(tableGeom, tableMat);
        table.position.set(-5, 2, 0);
        scene.add(table);
        objects.push(table);

        var consoleLeftGeom = new THREE.BoxGeometry(3, 2, 1.5);
        var consoleMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var consoleLeft = new THREE.Mesh(consoleLeftGeom, consoleMat);
        consoleLeft.position.set(-8, 3, 0);
        scene.add(consoleLeft);
        objects.push(consoleLeft);

        var consoleRightGeom = new THREE.BoxGeometry(3, 2, 1.5);
        var consoleRight = new THREE.Mesh(consoleRightGeom, consoleMat);
        consoleRight.position.set(-2, 3, 0);
        scene.add(consoleRight);
        objects.push(consoleRight);

        for (var i = 0; i < 8; i++) {
            var buttonGeom = new THREE.SphereGeometry(0.2, 8, 8);
            var buttonMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
            var button = new THREE.Mesh(buttonGeom, buttonMat);
            button.position.set(-8.5 + i * 0.7, 3.8, -0.5);
            scene.add(button);
            objects.push(button);
        }

        var mapBoardGeom = new THREE.BoxGeometry(6, 4, 0.3);
        var mapMat = new THREE.MeshLambertMaterial({ color: 0xf5deb3 });
        var mapBoard = new THREE.Mesh(mapBoardGeom, mapMat);
        mapBoard.position.set(5, 5, 0);
        scene.add(mapBoard);
        objects.push(mapBoard);

        var gridLines = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-3, 3, 0.2), new THREE.Vector3(3, 3, 0.2),
                new THREE.Vector3(-3, -3, 0.2), new THREE.Vector3(3, -3, 0.2),
                new THREE.Vector3(-3, 0, 0.2), new THREE.Vector3(3, 0, 0.2),
                new THREE.Vector3(0, 3, 0.2), new THREE.Vector3(0, -3, 0.2)
            ]),
            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
        );
        gridLines.position.set(5, 5, 0);
        scene.add(gridLines);
        objects.push(gridLines);

        var chairGeom = new THREE.BoxGeometry(1, 1.5, 1);
        var chairMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var chair1 = new THREE.Mesh(chairGeom, chairMat);
        chair1.position.set(-7, 1, 2);
        scene.add(chair1);
        objects.push(chair1);

        var chair2 = new THREE.Mesh(chairGeom, chairMat);
        chair2.position.set(-3, 1, 2);
        scene.add(chair2);
        objects.push(chair2);

        for (var i = 0; i < 4; i++) {
            var shelfGeom = new THREE.BoxGeometry(2, 3, 1);
            var shelfMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
            var shelf = new THREE.Mesh(shelfGeom, shelfMat);
            shelf.position.set(8 + i * 2.5, 4, 4);
            scene.add(shelf);
            objects.push(shelf);
        }

        var cableGeom = new THREE.CylinderGeometry(0.1, 0.1, 15, 4);
        var cableMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var cable = new THREE.Mesh(cableGeom, cableMat);
        cable.position.set(0, 8, 0);
        scene.add(cable);
        objects.push(cable);
    }

    function buildDefenses() {
        var khakiColor = 0xc3b091;
        var metalColor = 0xa8a8a8;

        var pillarGeom = new THREE.CylinderGeometry(1.5, 1.5, 18, 8);
        var concreteGrayMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var pillar1 = new THREE.Mesh(pillarGeom, concreteGrayMat);
        pillar1.position.set(8, 10, -3);
        scene.add(pillar1);
        objects.push(pillar1);

        var pillar2 = new THREE.Mesh(pillarGeom, concreteGrayMat);
        pillar2.position.set(-8, 10, 3);
        scene.add(pillar2);
        objects.push(pillar2);

        var pillboxBaseGeom = new THREE.CylinderGeometry(3, 3.5, 2, 12);
        var pillboxBase = new THREE.Mesh(pillboxBaseGeom, concreteGrayMat);
        pillboxBase.position.set(12, 11, 5);
        scene.add(pillboxBase);
        objects.push(pillboxBase);

        var pillboxDomeGeom = new THREE.SphereGeometry(2.5, 12, 8);
        var pillboxDome = new THREE.Mesh(pillboxDomeGeom, concreteGrayMat);
        pillboxDome.position.set(12, 14, 5);
        scene.add(pillboxDome);
        objects.push(pillboxDome);

        var gunSlitGeom = new THREE.BoxGeometry(0.4, 0.8, 0.2);
        var gunSlitMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var gunSlit = new THREE.Mesh(gunSlitGeom, gunSlitMat);
        gunSlit.position.set(12, 13.5, 7);
        scene.add(gunSlit);
        objects.push(gunSlit);

        for (var i = 0; i < 12; i++) {
            var sandbagGeom = new THREE.BoxGeometry(1.2, 0.8, 1);
            var sandbagMat = new THREE.MeshLambertMaterial({ color: khakiColor });
            var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
            var angle = (i / 12) * Math.PI * 2;
            sandbag.position.set(Math.cos(angle) * 6, 1, Math.sin(angle) * 6);
            scene.add(sandbag);
            objects.push(sandbag);
        }

        var gunBarrelGeom = new THREE.CylinderGeometry(0.3, 0.35, 4, 8);
        var gunMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var gunBarrel = new THREE.Mesh(gunBarrelGeom, gunMat);
        gunBarrel.rotation.z = Math.PI / 6;
        gunBarrel.position.set(6, 3, -8);
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        var gunMountGeom = new THREE.CylinderGeometry(0.8, 1, 1.5, 8);
        var gunMount = new THREE.Mesh(gunMountGeom, concreteGrayMat);
        gunMount.position.set(6, 1.5, -8);
        scene.add(gunMount);
        objects.push(gunMount);

        for (var i = 0; i < 6; i++) {
            var wireGeom = new THREE.BoxGeometry(0.1, 2, 0.1);
            var wireMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var fence = new THREE.Mesh(wireGeom, wireMat);
            fence.position.set(-14 + i * 4, 2, 9);
            scene.add(fence);
            objects.push(fence);
        }

        for (var i = 0; i < 5; i++) {
            var spikesGeom = new THREE.ConeGeometry(0.2, 1, 4);
            var spikeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            var spike = new THREE.Mesh(spikesGeom, spikeMat);
            spike.position.set(-14 + i * 4, 3, 9);
            scene.add(spike);
            objects.push(spike);
        }

        var doorLeftGeom = new THREE.BoxGeometry(2.5, 3, 0.5);
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
        var doorLeft = new THREE.Mesh(doorLeftGeom, doorMat);
        doorLeft.position.set(-2, 5, -7.5);
        doorLeft.rotation.z = 0.3;
        scene.add(doorLeft);
        objects.push(doorLeft);

        var doorRight = new THREE.Mesh(doorLeftGeom, doorMat);
        doorRight.position.set(2, 5, -7.5);
        doorRight.rotation.z = -0.3;
        scene.add(doorRight);
        objects.push(doorRight);
    }

    function buildEquipment() {
        var metalColor = 0xa8a8a8;
        var blackColor = 0x1a1a1a;

        var antennaBaseGeom = new THREE.CylinderGeometry(1, 1, 1, 8);
        var antennaMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var antennaBase = new THREE.Mesh(antennaBaseGeom, antennaMat);
        antennaBase.position.set(0, 22, -7);
        scene.add(antennaBase);
        objects.push(antennaBase);

        var antennaPoleGeom = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
        var antennaPole = new THREE.Mesh(antennaPoleGeom, antennaMat);
        antennaPole.position.set(0, 27, -7);
        scene.add(antennaPole);
        objects.push(antennaPole);

        var antennaTopGeom = new THREE.SphereGeometry(0.4, 8, 8);
        var antennaTop = new THREE.Mesh(antennaTopGeom, antennaMat);
        antennaTop.position.set(0, 31.5, -7);
        scene.add(antennaTop);
        objects.push(antennaTop);

        antennaWire = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-2, 30, -7), new THREE.Vector3(0, 31.5, -7),
                new THREE.Vector3(2, 30, -7), new THREE.Vector3(0, 31.5, -7),
                new THREE.Vector3(0, 31.5, -7), new THREE.Vector3(0, 31.5, -5),
                new THREE.Vector3(0, 31.5, -7), new THREE.Vector3(0, 31.5, -9)
            ]),
            new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 1 })
        );
        scene.add(antennaWire);
        objects.push(antennaWire);

        var radarBaseGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 8);
        var radarBase = new THREE.Mesh(radarBaseGeom, antennaMat);
        radarBase.position.set(8, 23, -7);
        scene.add(radarBase);
        objects.push(radarBase);

        radarDish = new THREE.Mesh(
            new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        radarDish.position.set(8, 24.5, -7);
        scene.add(radarDish);
        objects.push(radarDish);

        var generatorBlockGeom = new THREE.BoxGeometry(3, 2, 2);
        var generatorMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var generatorBlock = new THREE.Mesh(generatorBlockGeom, generatorMat);
        generatorBlock.position.set(-10, 2, -4);
        scene.add(generatorBlock);
        objects.push(generatorBlock);

        var exhaustPipeGeom = new THREE.CylinderGeometry(0.4, 0.4, 4, 6);
        var exhaustMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var exhaustPipe = new THREE.Mesh(exhaustPipeGeom, exhaustMat);
        exhaustPipe.position.set(-10, 5, -4);
        scene.add(exhaustPipe);
        objects.push(exhaustPipe);

        var exhaustCapGeom = new THREE.ConeGeometry(0.6, 0.8, 6);
        var exhaustCap = new THREE.Mesh(exhaustCapGeom, exhaustMat);
        exhaustCap.position.set(-10, 7.5, -4);
        scene.add(exhaustCap);
        objects.push(exhaustCap);

        for (var i = 0; i < 3; i++) {
            var fuelCanGeom = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
            var fuelMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
            var fuelCan = new THREE.Mesh(fuelCanGeom, fuelMat);
            fuelCan.position.set(-11 + i * 0.8, 1.5, -3);
            scene.add(fuelCan);
            objects.push(fuelCan);
        }

        var batteryGeom = new THREE.BoxGeometry(1.5, 0.8, 1.2);
        var batteryMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        for (var i = 0; i < 4; i++) {
            var battery = new THREE.Mesh(batteryGeom, batteryMat);
            battery.position.set(-11 + i * 0.5, 2.5, -4.5);
            scene.add(battery);
            objects.push(battery);
        }

        var lightFixture1Geom = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
        var lightMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var lightFixture1 = new THREE.Mesh(lightFixture1Geom, lightMat);
        lightFixture1.position.set(-6, 19.5, 0);
        scene.add(lightFixture1);
        objects.push(lightFixture1);

        var lightBulb1Geom = new THREE.SphereGeometry(0.25, 8, 8);
        var bulbMat = new THREE.MeshLambertMaterial({ color: 0xffff99 });
        var bulb1 = new THREE.Mesh(lightBulb1Geom, bulbMat);
        bulb1.position.set(-6, 19.8, 0);
        scene.add(bulb1);
        emergencyLights.push(bulb1);
        objects.push(bulb1);

        var lightFixture2 = new THREE.Mesh(lightFixture1Geom, lightMat);
        lightFixture2.position.set(6, 19.5, 0);
        scene.add(lightFixture2);
        objects.push(lightFixture2);

        var bulb2 = new THREE.Mesh(lightBulb1Geom, bulbMat);
        bulb2.position.set(6, 19.8, 0);
        scene.add(bulb2);
        emergencyLights.push(bulb2);
        objects.push(bulb2);

        var lightFixture3 = new THREE.Mesh(lightFixture1Geom, lightMat);
        lightFixture3.position.set(0, 19.5, -6);
        scene.add(lightFixture3);
        objects.push(lightFixture3);

        var bulb3 = new THREE.Mesh(lightBulb1Geom, bulbMat);
        bulb3.position.set(0, 19.8, -6);
        scene.add(bulb3);
        emergencyLights.push(bulb3);
        objects.push(bulb3);
    }

    function buildTunnels() {
        var concreteGray = 0x808080;
        var darkEarth = 0x4a3728;

        var tunnelEastGeom = new THREE.BoxGeometry(15, 3, 2);
        var tunnelMat = new THREE.MeshLambertMaterial({ color: concreteGray });
        var tunnelEast = new THREE.Mesh(tunnelEastGeom, tunnelMat);
        tunnelEast.position.set(22, 2, 0);
        scene.add(tunnelEast);
        objects.push(tunnelEast);

        var tunnelWestGeom = new THREE.BoxGeometry(15, 3, 2);
        var tunnelWest = new THREE.Mesh(tunnelWestGeom, tunnelMat);
        tunnelWest.position.set(-22, 2, 0);
        scene.add(tunnelWest);
        objects.push(tunnelWest);

        var stairGeom = new THREE.BoxGeometry(2, 0.5, 2);
        var stairMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
        for (var i = 0; i < 8; i++) {
            var stair = new THREE.Mesh(stairGeom, stairMat);
            stair.position.set(0, 1 + i * 0.7, -5);
            scene.add(stair);
            objects.push(stair);
        }

        var handrailGeom = new THREE.CylinderGeometry(0.1, 0.1, 7, 4);
        var railMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var handrail = new THREE.Mesh(handrailGeom, railMat);
        handrail.position.set(1.5, 4, -5);
        handrail.rotation.z = Math.PI / 4;
        scene.add(handrail);
        objects.push(handrail);

        var metalColor = 0xa8a8a8;
        var supportBeamGeom = new THREE.CylinderGeometry(0.4, 0.4, 12, 6);
        var supportMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var support1 = new THREE.Mesh(supportBeamGeom, supportMat);
        support1.position.set(-5, 6, 3);
        scene.add(support1);
        objects.push(support1);

        var support2 = new THREE.Mesh(supportBeamGeom, supportMat);
        support2.position.set(5, 6, 3);
        scene.add(support2);
        objects.push(support2);

        for (var i = 0; i < 4; i++) {
            var pipeGeom = new THREE.CylinderGeometry(0.2, 0.2, 10, 4);
            var pipeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var pipe = new THREE.Mesh(pipeGeom, pipeMat);
            pipe.position.set(-6 + i * 3, 8, 5);
            pipe.rotation.z = Math.PI / 6;
            scene.add(pipe);
            objects.push(pipe);
        }
    }

    function buildDamage() {
        var crackMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        var crackGeom1 = new THREE.BoxGeometry(0.3, 3, 0.2);
        var crack1 = new THREE.Mesh(crackGeom1, crackMat);
        crack1.position.set(-12, 8, -7.4);
        scene.add(crack1);
        objects.push(crack1);

        var crackGeom2 = new THREE.BoxGeometry(2, 0.3, 0.2);
        var crack2 = new THREE.Mesh(crackGeom2, crackMat);
        crack2.position.set(10, 12, -7.4);
        scene.add(crack2);
        objects.push(crack2);

        var bulletHoleGeom = new THREE.SphereGeometry(0.15, 8, 8);
        var holeMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        for (var i = 0; i < 6; i++) {
            var hole = new THREE.Mesh(bulletHoleGeom, holeMat);
            hole.position.set(-8 + i * 3, 11, -7.45);
            scene.add(hole);
            objects.push(hole);
        }

        var rubbleGeom = new THREE.BoxGeometry(1.5, 0.8, 1.2);
        var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        for (var i = 0; i < 5; i++) {
            var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
            rubble.position.set(-12 + i * 2, 0.5, -6);
            rubble.rotation.x = Math.random() * 0.5;
            rubble.rotation.z = Math.random() * 0.5;
            scene.add(rubble);
            objects.push(rubble);
        }

        var scorchGeom = new THREE.BoxGeometry(3, 1.5, 0.1);
        var scorchMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var scorch = new THREE.Mesh(scorchGeom, scorchMat);
        scorch.position.set(10, 15, -7.45);
        scene.add(scorch);
        objects.push(scorch);
    }

    function buildSupplies() {
        var woodColor = 0x8b4513;
        var khakiColor = 0xc3b091;

        var crateGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        var crateMat = new THREE.MeshLambertMaterial({ color: woodColor });
        for (var i = 0; i < 4; i++) {
            var crate = new THREE.Mesh(crateGeom, crateMat);
            crate.position.set(10 + i * 2, 1.2, 3);
            scene.add(crate);
            objects.push(crate);
        }

        var ammoBoxGeom = new THREE.BoxGeometry(1, 1, 1);
        var ammoMat = new THREE.MeshLambertMaterial({ color: 0xaa8844 });
        for (var i = 0; i < 6; i++) {
            var ammoBox = new THREE.Mesh(ammoBoxGeom, ammoMat);
            ammoBox.position.set(-12 + i * 1.2, 1, 3);
            scene.add(ammoBox);
            objects.push(ammoBox);
        }

        var medicalBoxGeom = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        var medicalMat = new THREE.MeshLambertMaterial({ color: 0xffcccc });
        for (var i = 0; i < 3; i++) {
            var medBox = new THREE.Mesh(medicalBoxGeom, medicalMat);
            medBox.position.set(-8 + i * 1, 1.5, 2);
            scene.add(medBox);
            objects.push(medBox);
        }

        var tankGeom = new THREE.CylinderGeometry(0.6, 0.6, 2, 8);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var waterTank = new THREE.Mesh(tankGeom, tankMat);
        waterTank.position.set(12, 2, -5);
        scene.add(waterTank);
        objects.push(waterTank);

        var roofNetGeom = new THREE.BoxGeometry(32, 1, 17);
        var netMat = new THREE.MeshLambertMaterial({ color: khakiColor });
        var roofNet = new THREE.Mesh(roofNetGeom, netMat);
        roofNet.position.set(0, 23, 0);
        scene.add(roofNet);
        objects.push(roofNet);

        for (var i = 0; i < 8; i++) {
            var weightGeom = new THREE.SphereGeometry(0.4, 8, 8);
            var weightMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var weight = new THREE.Mesh(weightGeom, weightMat);
            weight.position.set(-12 + i * 3, 23.8, -6);
            scene.add(weight);
            objects.push(weight);
        }

        var toolRackGeom = new THREE.BoxGeometry(3, 3, 0.5);
        var toolMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var toolRack = new THREE.Mesh(toolRackGeom, toolMat);
        toolRack.position.set(-6, 6, 5);
        scene.add(toolRack);
        objects.push(toolRack);

        var toolGeom = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 4);
        var toolMat2 = new THREE.MeshLambertMaterial({ color: metalColor });
        for (var i = 0; i < 5; i++) {
            var tool = new THREE.Mesh(toolGeom, toolMat2);
            tool.position.set(-7.5 + i * 0.5, 6.5, 5);
            tool.rotation.z = Math.PI / 4;
            scene.add(tool);
            objects.push(tool);
        }

        var metalColor = 0xa8a8a8;
        var barelGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
        var barelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var barrel1 = new THREE.Mesh(barelGeom, barelMat);
        barrel1.position.set(8, 1, -3);
        scene.add(barrel1);
        objects.push(barrel1);

        var barrel2 = new THREE.Mesh(barelGeom, barelMat);
        barrel2.position.set(9, 1, -3.5);
        scene.add(barrel2);
        objects.push(barrel2);

        var deckchairGeom = new THREE.BoxGeometry(1.5, 0.8, 0.5);
        var deckMat = new THREE.MeshLambertMaterial({ color: khakiColor });
        var deckchair = new THREE.Mesh(deckchairGeom, deckMat);
        deckchair.position.set(6, 1.2, 5);
        deckchair.rotation.z = 0.2;
        scene.add(deckchair);
        objects.push(deckchair);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 10);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xffff99, 0.6, 15);
        pointLight1.position.set(-6, 19.8, 0);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xffff99, 0.6, 15);
        pointLight2.position.set(6, 19.8, 0);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0xffff99, 0.6, 15);
        pointLight3.position.set(0, 19.8, -6);
        scene.add(pointLight3);
        lights.push(pointLight3);

        var spotLight = new THREE.SpotLight(0xffffff, 0.8);
        spotLight.position.set(0, 15, 0);
        spotLight.target.position.set(0, 0, 0);
        scene.add(spotLight);
        lights.push(spotLight);
    }

    function update(delta) {
        if (radarDish) {
            radarDish.rotation.y += delta * 1.5;
        }

        if (emergencyLights && emergencyLights.length > 0) {
            var blinkPhase = Math.sin(delta * 5) * 0.5 + 0.5;
            for (var i = 0; i < emergencyLights.length; i++) {
                emergencyLights[i].material.emissive.setScalar(blinkPhase * 0.8);
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
        emergencyLights = [];
        radarDish = null;
        antennaWire = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
