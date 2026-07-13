window.MudCity = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var rainParticles = [];
    var ripplePool = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        rainParticles = [];
        ripplePool = [];
        buildStreets();
        buildBuildings();
        buildMarket();
        buildBarricades();
        buildCheckpoints();
        buildWells();
        buildRubble();
        buildMinarets();
        buildMosques();
        setupLighting();
        setupRain();
    }

    function update(delta) {
        updateRain(delta);
        updateRipples(delta);
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        for (i = 0; i < rainParticles.length; i++) {
            scene.remove(rainParticles[i]);
        }
        for (i = 0; i < ripplePool.length; i++) {
            scene.remove(ripplePool[i]);
        }
        objects = [];
        lights = [];
        rainParticles = [];
        ripplePool = [];
        scene = null;
        camera = null;
    }

    function buildStreets() {
        var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x5C4033 });

        // Main street ground
        var mainStreetGeom = new THREE.BoxGeometry(60, 0.5, 200);
        var mainStreet = new THREE.Mesh(mainStreetGeom, groundMaterial);
        mainStreet.position.set(0, -0.25, 0);
        scene.add(mainStreet);
        objects.push(mainStreet);

        // Cross street
        var crossStreetGeom = new THREE.BoxGeometry(120, 0.5, 40);
        var crossStreet = new THREE.Mesh(crossStreetGeom, groundMaterial);
        crossStreet.position.set(0, -0.25, 40);
        scene.add(crossStreet);
        objects.push(crossStreet);

        // Side alley 1
        var alley1Geom = new THREE.BoxGeometry(30, 0.5, 100);
        var alley1 = new THREE.Mesh(alley1Geom, groundMaterial);
        alley1.position.set(-50, -0.25, 60);
        scene.add(alley1);
        objects.push(alley1);

        // Side alley 2
        var alley2Geom = new THREE.BoxGeometry(30, 0.5, 80);
        var alley2 = new THREE.Mesh(alley2Geom, groundMaterial);
        alley2.position.set(50, -0.25, 20);
        scene.add(alley2);
        objects.push(alley2);

        // Narrow winding path
        var pathGeom = new THREE.BoxGeometry(15, 0.5, 120);
        var path = new THREE.Mesh(pathGeom, groundMaterial);
        path.position.set(-70, -0.25, -20);
        path.rotation.z = 0.3;
        scene.add(path);
        objects.push(path);
    }

    function buildBuildings() {
        var ochreColor = 0xCC9966;
        var tanColor = 0xD2B48C;
        var brickMaterial = new THREE.MeshLambertMaterial({ color: ochreColor });
        var tanMaterial = new THREE.MeshLambertMaterial({ color: tanColor });

        // Building cluster 1: Northwest corner
        var b1Geom = new THREE.BoxGeometry(25, 12, 30);
        var b1 = new THREE.Mesh(b1Geom, brickMaterial);
        b1.position.set(-45, 6, -60);
        scene.add(b1);
        objects.push(b1);

        // Roof
        var r1Geom = new THREE.BoxGeometry(27, 1, 32);
        var r1 = new THREE.Mesh(r1Geom, tanMaterial);
        r1.position.set(-45, 12.5, -60);
        scene.add(r1);
        objects.push(r1);

        // Building cluster 2: Northeast
        var b2Geom = new THREE.BoxGeometry(20, 10, 25);
        var b2 = new THREE.Mesh(b2Geom, brickMaterial);
        b2.position.set(40, 5, -70);
        scene.add(b2);
        objects.push(b2);

        // Roof
        var r2Geom = new THREE.BoxGeometry(22, 1, 27);
        var r2 = new THREE.Mesh(r2Geom, tanMaterial);
        r2.position.set(40, 10.5, -70);
        scene.add(r2);
        objects.push(r2);

        // Building cluster 3: South side
        var b3Geom = new THREE.BoxGeometry(35, 14, 28);
        var b3 = new THREE.Mesh(b3Geom, brickMaterial);
        b3.position.set(0, 7, 80);
        scene.add(b3);
        objects.push(b3);

        // Roof
        var r3Geom = new THREE.BoxGeometry(37, 1, 30);
        var r3 = new THREE.Mesh(r3Geom, tanMaterial);
        r3.position.set(0, 14.5, 80);
        scene.add(r3);
        objects.push(r3);

        // Building cluster 4: West side
        var b4Geom = new THREE.BoxGeometry(18, 11, 35);
        var b4 = new THREE.Mesh(b4Geom, brickMaterial);
        b4.position.set(-65, 5.5, 30);
        scene.add(b4);
        objects.push(b4);

        // Roof
        var r4Geom = new THREE.BoxGeometry(20, 1, 37);
        var r4 = new THREE.Mesh(r4Geom, tanMaterial);
        r4.position.set(-65, 11.5, 30);
        scene.add(r4);
        objects.push(r4);

        // Building cluster 5: East side
        var b5Geom = new THREE.BoxGeometry(22, 13, 32);
        var b5 = new THREE.Mesh(b5Geom, brickMaterial);
        b5.position.set(70, 6.5, 15);
        scene.add(b5);
        objects.push(b5);

        // Roof
        var r5Geom = new THREE.BoxGeometry(24, 1, 34);
        var r5 = new THREE.Mesh(r5Geom, tanMaterial);
        r5.position.set(70, 13.5, 15);
        scene.add(r5);
        objects.push(r5);

        // Building cluster 6: Center-left
        var b6Geom = new THREE.BoxGeometry(19, 9, 28);
        var b6 = new THREE.Mesh(b6Geom, brickMaterial);
        b6.position.set(-30, 4.5, -10);
        scene.add(b6);
        objects.push(b6);

        // Roof
        var r6Geom = new THREE.BoxGeometry(21, 1, 30);
        var r6 = new THREE.Mesh(r6Geom, tanMaterial);
        r6.position.set(-30, 9.5, -10);
        scene.add(r6);
        objects.push(r6);

        // Building cluster 7: Center-right
        var b7Geom = new THREE.BoxGeometry(23, 12, 26);
        var b7 = new THREE.Mesh(b7Geom, brickMaterial);
        b7.position.set(32, 6, 5);
        scene.add(b7);
        objects.push(b7);

        // Roof
        var r7Geom = new THREE.BoxGeometry(25, 1, 28);
        var r7 = new THREE.Mesh(r7Geom, tanMaterial);
        r7.position.set(32, 12.5, 5);
        scene.add(r7);
        objects.push(r7);

        // Damaged building partial wall
        var damageGeom = new THREE.BoxGeometry(15, 8, 3);
        var damage = new THREE.Mesh(damageGeom, brickMaterial);
        damage.position.set(-15, 4, 50);
        damage.rotation.z = 0.2;
        scene.add(damage);
        objects.push(damage);

        // Building window details (small boxes)
        var windowGeom = new THREE.BoxGeometry(2, 2, 0.5);
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var positions = [
            [-45, 10, -75], [-45, 7, -75], [-45, 4, -75],
            [40, 8, -85], [40, 5, -85],
            [0, 12, 65], [0, 9, 65], [0, 6, 65],
            [-65, 8, 15], [-65, 5, 15],
            [70, 11, 0], [70, 8, 0], [70, 5, 0],
            [-30, 6, -25], [-30, 3, -25],
            [32, 10, -10], [32, 7, -10], [32, 4, -10]
        ];
        var i;
        for (i = 0; i < positions.length; i++) {
            var window = new THREE.Mesh(windowGeom, darkMat);
            window.position.set(positions[i][0], positions[i][1], positions[i][2]);
            scene.add(window);
            objects.push(window);
        }
    }

    function buildMarket() {
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var canvasMat = new THREE.MeshLambertMaterial({ color: 0xFAA043 });

        // Market stall 1
        var stallFrame1Geom = new THREE.BoxGeometry(4, 3, 2);
        var stallFrame1 = new THREE.Mesh(stallFrame1Geom, woodMat);
        stallFrame1.position.set(-20, 1.5, 40);
        scene.add(stallFrame1);
        objects.push(stallFrame1);

        var stallRoof1Geom = new THREE.BoxGeometry(5, 0.5, 3);
        var stallRoof1 = new THREE.Mesh(stallRoof1Geom, canvasMat);
        stallRoof1.position.set(-20, 3.5, 40);
        scene.add(stallRoof1);
        objects.push(stallRoof1);

        // Market stall 2
        var stallFrame2Geom = new THREE.BoxGeometry(3.5, 3, 2.5);
        var stallFrame2 = new THREE.Mesh(stallFrame2Geom, woodMat);
        stallFrame2.position.set(-12, 1.5, 42);
        scene.add(stallFrame2);
        objects.push(stallFrame2);

        var stallRoof2Geom = new THREE.BoxGeometry(4.5, 0.5, 3.5);
        var stallRoof2 = new THREE.Mesh(stallRoof2Geom, canvasMat);
        stallRoof2.position.set(-12, 3.5, 42);
        scene.add(stallRoof2);
        objects.push(stallRoof2);

        // Market stall 3
        var stallFrame3Geom = new THREE.BoxGeometry(4, 3, 2);
        var stallFrame3 = new THREE.Mesh(stallFrame3Geom, woodMat);
        stallFrame3.position.set(-4, 1.5, 44);
        scene.add(stallFrame3);
        objects.push(stallFrame3);

        var stallRoof3Geom = new THREE.BoxGeometry(5, 0.5, 3);
        var stallRoof3 = new THREE.Mesh(stallRoof3Geom, canvasMat);
        stallRoof3.position.set(-4, 3.5, 44);
        scene.add(stallRoof3);
        objects.push(stallRoof3);

        // Market stall 4
        var stallFrame4Geom = new THREE.BoxGeometry(3, 3, 2.5);
        var stallFrame4 = new THREE.Mesh(stallFrame4Geom, woodMat);
        stallFrame4.position.set(8, 1.5, 46);
        scene.add(stallFrame4);
        objects.push(stallFrame4);

        var stallRoof4Geom = new THREE.BoxGeometry(4, 0.5, 3.5);
        var stallRoof4 = new THREE.Mesh(stallRoof4Geom, canvasMat);
        stallRoof4.position.set(8, 3.5, 46);
        scene.add(stallRoof4);
        objects.push(stallRoof4);

        // Market tables (boxes)
        var tableGeom = new THREE.BoxGeometry(3, 0.5, 1.5);
        var tablePositions = [
            [-20, 1, 38],
            [-12, 1, 40],
            [-4, 1, 42],
            [8, 1, 44]
        ];
        var i;
        for (i = 0; i < tablePositions.length; i++) {
            var table = new THREE.Mesh(tableGeom, woodMat);
            table.position.set(tablePositions[i][0], tablePositions[i][1], tablePositions[i][2]);
            scene.add(table);
            objects.push(table);
        }
    }

    function buildBarricades() {
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xA0A040 });
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

        // Sandbag barriers
        var sandbag1Geom = new THREE.BoxGeometry(20, 2, 1);
        var sandbag1 = new THREE.Mesh(sandbag1Geom, sandbagMat);
        sandbag1.position.set(20, 1, -30);
        scene.add(sandbag1);
        objects.push(sandbag1);

        var sandbag2Geom = new THREE.BoxGeometry(1, 2, 12);
        var sandbag2 = new THREE.Mesh(sandbag2Geom, sandbagMat);
        sandbag2.position.set(10, 1, -24);
        scene.add(sandbag2);
        objects.push(sandbag2);

        // Overturned vehicles (box approximation)
        var vehicleGeom = new THREE.BoxGeometry(8, 3, 3);
        var vehicle1 = new THREE.Mesh(vehicleGeom, metalMat);
        vehicle1.position.set(0, 1.5, 60);
        vehicle1.rotation.z = 0.4;
        scene.add(vehicle1);
        objects.push(vehicle1);

        var vehicle2 = new THREE.Mesh(vehicleGeom, metalMat);
        vehicle2.position.set(-40, 1.5, 5);
        vehicle2.rotation.z = -0.3;
        scene.add(vehicle2);
        objects.push(vehicle2);

        // Market table barricade
        var tableBarGeom = new THREE.BoxGeometry(2, 1, 0.8);
        var positions = [
            [15, 1, 38],
            [18, 1, 38],
            [21, 1, 38],
            [24, 1, 38]
        ];
        var i;
        for (i = 0; i < positions.length; i++) {
            var tableBar = new THREE.Mesh(tableBarGeom, woodMat);
            tableBar.position.set(positions[i][0], positions[i][1], positions[i][2]);
            scene.add(tableBar);
            objects.push(tableBar);
        }
    }

    function buildCheckpoints() {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var khakiMat = new THREE.MeshLambertMaterial({ color: 0x9B8B7E });

        // T-wall barriers
        var twall1Geom = new THREE.BoxGeometry(2, 3, 15);
        var twall1 = new THREE.Mesh(twall1Geom, concreteMat);
        twall1.position.set(-35, 1.5, 65);
        scene.add(twall1);
        objects.push(twall1);

        var twall2Geom = new THREE.BoxGeometry(15, 3, 2);
        var twall2 = new THREE.Mesh(twall2Geom, concreteMat);
        twall2.position.set(-28, 1.5, 57);
        scene.add(twall2);
        objects.push(twall2);

        var twall3Geom = new THREE.BoxGeometry(2, 3, 15);
        var twall3 = new THREE.Mesh(twall3Geom, concreteMat);
        twall3.position.set(-21, 1.5, 65);
        scene.add(twall3);
        objects.push(twall3);

        // Guard box
        var guardBoxGeom = new THREE.BoxGeometry(4, 3, 4);
        var guardBox = new THREE.Mesh(guardBoxGeom, khakiMat);
        guardBox.position.set(-28, 1.5, 73);
        scene.add(guardBox);
        objects.push(guardBox);

        // Guard roof
        var guardRoofGeom = new THREE.BoxGeometry(5, 0.5, 5);
        var guardRoof = new THREE.Mesh(guardRoofGeom, concreteMat);
        guardRoof.position.set(-28, 3.5, 73);
        scene.add(guardRoof);
        objects.push(guardRoof);

        // Second checkpoint
        var twall4Geom = new THREE.BoxGeometry(2, 2.5, 12);
        var twall4 = new THREE.Mesh(twall4Geom, concreteMat);
        twall4.position.set(35, 1.25, -45);
        scene.add(twall4);
        objects.push(twall4);

        var twall5Geom = new THREE.BoxGeometry(12, 2.5, 2);
        var twall5 = new THREE.Mesh(twall5Geom, concreteMat);
        twall5.position.set(41, 1.25, -39);
        scene.add(twall5);
        objects.push(twall5);

        var guardBoxGeom2 = new THREE.BoxGeometry(4, 3, 4);
        var guardBox2 = new THREE.Mesh(guardBoxGeom2, khakiMat);
        guardBox2.position.set(47, 1.5, -45);
        scene.add(guardBox2);
        objects.push(guardBox2);
    }

    function buildWells() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a4d7a });

        // Well in courtyard
        var wellCylGeom = new THREE.CylinderGeometry(3, 3, 6, 16);
        var well = new THREE.Mesh(wellCylGeom, stoneMat);
        well.position.set(-55, 3, -20);
        scene.add(well);
        objects.push(well);

        // Well parapet (box around top)
        var parapetGeom = new THREE.BoxGeometry(7, 1, 7);
        var parapet = new THREE.Mesh(parapetGeom, stoneMat);
        parapet.position.set(-55, 6, -20);
        scene.add(parapet);
        objects.push(parapet);

        // Water inside well
        var waterGeom = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16);
        var waterMesh = new THREE.Mesh(waterGeom, waterMat);
        waterMesh.position.set(-55, 1, -20);
        scene.add(waterMesh);
        objects.push(waterMesh);

        // Second well
        var well2CylGeom = new THREE.CylinderGeometry(2.5, 2.5, 5, 16);
        var well2 = new THREE.Mesh(well2CylGeom, stoneMat);
        well2.position.set(60, 2.5, 50);
        scene.add(well2);
        objects.push(well2);

        var parapet2Geom = new THREE.BoxGeometry(6, 0.8, 6);
        var parapet2 = new THREE.Mesh(parapet2Geom, stoneMat);
        parapet2.position.set(60, 5.4, 50);
        scene.add(parapet2);
        objects.push(parapet2);

        var water2Geom = new THREE.CylinderGeometry(2, 2, 0.4, 16);
        var water2Mesh = new THREE.Mesh(water2Geom, waterMat);
        water2Mesh.position.set(60, 0.5, 50);
        scene.add(water2Mesh);
        objects.push(water2Mesh);
    }

    function buildRubble() {
        var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

        // Collapsed wall debris
        var rubble1Geom = new THREE.BoxGeometry(8, 3, 2);
        var rubble1 = new THREE.Mesh(rubble1Geom, rubbleMat);
        rubble1.position.set(25, 1.5, 70);
        rubble1.rotation.z = 0.5;
        scene.add(rubble1);
        objects.push(rubble1);

        var rubble2Geom = new THREE.BoxGeometry(6, 2, 3);
        var rubble2 = new THREE.Mesh(rubble2Geom, rubbleMat);
        rubble2.position.set(28, 1, 75);
        rubble2.rotation.z = -0.4;
        scene.add(rubble2);
        objects.push(rubble2);

        var rubble3Geom = new THREE.BoxGeometry(5, 2, 2);
        var rubble3 = new THREE.Mesh(rubble3Geom, rubbleMat);
        rubble3.position.set(32, 1, 78);
        rubble3.rotation.z = 0.3;
        scene.add(rubble3);
        objects.push(rubble3);

        // Rock sphere chunks
        var rockGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var rockPositions = [
            [20, 1.5, 72],
            [35, 2, 80],
            [22, 1, 76],
            [30, 1.5, 74]
        ];
        var i;
        for (i = 0; i < rockPositions.length; i++) {
            var rock = new THREE.Mesh(rockGeom, rockMat);
            rock.position.set(rockPositions[i][0], rockPositions[i][1], rockPositions[i][2]);
            scene.add(rock);
            objects.push(rock);
        }

        // Additional rubble pieces
        var rubble4Geom = new THREE.BoxGeometry(4, 1.5, 3);
        var rubble4 = new THREE.Mesh(rubble4Geom, rubbleMat);
        rubble4.position.set(-50, 0.75, 55);
        rubble4.rotation.z = 0.6;
        scene.add(rubble4);
        objects.push(rubble4);

        var rubble5Geom = new THREE.BoxGeometry(3, 2, 2);
        var rubble5 = new THREE.Mesh(rubble5Geom, rubbleMat);
        rubble5.position.set(-48, 1, 58);
        rubble5.rotation.z = -0.2;
        scene.add(rubble5);
        objects.push(rubble5);
    }

    function buildMinarets() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xAA8877 });
        var goldMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });

        // Minaret tower
        var minaretCylGeom = new THREE.CylinderGeometry(2, 2.5, 25, 12);
        var minaret = new THREE.Mesh(minaretCylGeom, stoneMat);
        minaret.position.set(-75, 12.5, -80);
        scene.add(minaret);
        objects.push(minaret);

        // Balcony
        var balconyGeom = new THREE.BoxGeometry(6, 0.5, 6);
        var balcony = new THREE.Mesh(balconyGeom, goldMat);
        balcony.position.set(-75, 20, -80);
        scene.add(balcony);
        objects.push(balcony);

        // Minaret top cone
        var coneGeom = new THREE.ConeGeometry(1.5, 6, 12);
        var cone = new THREE.Mesh(coneGeom, goldMat);
        cone.position.set(-75, 28, -80);
        scene.add(cone);
        objects.push(cone);

        // Sphere on top of cone
        var sphereGeom = new THREE.SphereGeometry(0.8, 8, 8);
        var topSphere = new THREE.Mesh(sphereGeom, goldMat);
        topSphere.position.set(-75, 31, -80);
        scene.add(topSphere);
        objects.push(topSphere);

        // Second minaret
        var minaret2CylGeom = new THREE.CylinderGeometry(1.8, 2.2, 22, 12);
        var minaret2 = new THREE.Mesh(minaret2CylGeom, stoneMat);
        minaret2.position.set(75, 11, 85);
        scene.add(minaret2);
        objects.push(minaret2);

        var balcony2Geom = new THREE.BoxGeometry(5.5, 0.5, 5.5);
        var balcony2 = new THREE.Mesh(balcony2Geom, goldMat);
        balcony2.position.set(75, 18, 85);
        scene.add(balcony2);
        objects.push(balcony2);

        var cone2Geom = new THREE.ConeGeometry(1.3, 5, 12);
        var cone2 = new THREE.Mesh(cone2Geom, goldMat);
        cone2.position.set(75, 25, 85);
        scene.add(cone2);
        objects.push(cone2);
    }

    function buildMosques() {
        var archMat = new THREE.MeshLambertMaterial({ color: 0xBB9966 });

        // Arch doorway segments
        var arch1Geom = new THREE.BoxGeometry(1.5, 8, 3);
        var arch1 = new THREE.Mesh(arch1Geom, archMat);
        arch1.position.set(-70, 4, 5);
        scene.add(arch1);
        objects.push(arch1);

        var arch2Geom = new THREE.BoxGeometry(8, 1.5, 3);
        var arch2 = new THREE.Mesh(arch2Geom, archMat);
        arch2.position.set(-67, 7.5, 5);
        scene.add(arch2);
        objects.push(arch2);

        var arch3Geom = new THREE.BoxGeometry(1.5, 8, 3);
        var arch3 = new THREE.Mesh(arch3Geom, archMat);
        arch3.position.set(-64, 4, 5);
        scene.add(arch3);
        objects.push(arch3);

        // Arch middle decoration
        var archMidGeom = new THREE.ConeGeometry(1.2, 2, 8);
        var archMid = new THREE.Mesh(archMidGeom, archMat);
        archMid.position.set(-67, 8.2, 5);
        archMid.rotation.x = Math.PI * 0.5;
        scene.add(archMid);
        objects.push(archMid);

        // Courtyard walls
        var courtyard1Geom = new THREE.BoxGeometry(20, 3, 1);
        var courtyard1 = new THREE.Mesh(courtyard1Geom, archMat);
        courtyard1.position.set(-55, 1.5, -10);
        scene.add(courtyard1);
        objects.push(courtyard1);

        var courtyard2Geom = new THREE.BoxGeometry(1, 3, 15);
        var courtyard2 = new THREE.Mesh(courtyard2Geom, archMat);
        courtyard2.position.set(-45, 1.5, -2);
        scene.add(courtyard2);
        objects.push(courtyard2);

        var courtyard3Geom = new THREE.BoxGeometry(1, 3, 15);
        var courtyard3 = new THREE.Mesh(courtyard3Geom, archMat);
        courtyard3.position.set(-65, 1.5, -2);
        scene.add(courtyard3);
        objects.push(courtyard3);

        var woodMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var doorGeom = new THREE.BoxGeometry(3, 5, 0.8);
        var door = new THREE.Mesh(doorGeom, woodMat);
        door.position.set(-55, 2.5, -9.5);
        scene.add(door);
        objects.push(door);
    }

    function setupLighting() {
        // Ambient light for base illumination
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Main directional light (monsoon overcast sky)
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(50, 60, 40);
        dirLight.target.position.set(0, 0, 0);
        scene.add(dirLight);
        scene.add(dirLight.target);
        lights.push(dirLight);

        // Shadow light
        var shadowLight = new THREE.DirectionalLight(0xFFFFFF, 0.4);
        shadowLight.position.set(-40, 40, -50);
        scene.add(shadowLight);
        lights.push(shadowLight);

        // Warm accent light
        var warmLight = new THREE.PointLight(0xFFAA00, 0.5);
        warmLight.position.set(0, 20, 0);
        scene.add(warmLight);
        lights.push(warmLight);

        // Cooler light from other direction
        var coolLight = new THREE.PointLight(0x6699FF, 0.3);
        coolLight.position.set(-80, 30, 90);
        scene.add(coolLight);
        lights.push(coolLight);
    }

    function setupRain() {
        var rainMat = new THREE.MeshLambertMaterial({ color: 0xCCDDEE });
        var i;
        for (i = 0; i < 150; i++) {
            var dropGeom = new THREE.SphereGeometry(0.1, 4, 4);
            var drop = new THREE.Mesh(dropGeom, rainMat);
            drop.position.set(
                Math.random() * 200 - 100,
                Math.random() * 150 + 50,
                Math.random() * 200 - 100
            );
            drop.velocity = Math.random() * 0.5 + 0.2;
            scene.add(drop);
            rainParticles.push(drop);
            objects.push(drop);
        }
    }

    function updateRain(delta) {
        var i;
        for (i = 0; i < rainParticles.length; i++) {
            var drop = rainParticles[i];
            drop.position.y -= drop.velocity * delta * 100;
            if (drop.position.y < 0) {
                drop.position.y = 150;
                drop.position.x = Math.random() * 200 - 100;
                drop.position.z = Math.random() * 200 - 100;
            }
        }
    }

    function updateRipples(delta) {
        var i;
        for (i = ripplePool.length - 1; i >= 0; i--) {
            var ripple = ripplePool[i];
            ripple.scale.x += delta * 5;
            ripple.scale.y += delta * 5;
            ripple.material.opacity -= delta * 2;
            if (ripple.material.opacity <= 0) {
                scene.remove(ripple);
                ripplePool.splice(i, 1);
            }
        }
    }

    var woodMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
