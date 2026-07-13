window.BrokenDam = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var waterSpray = [];
    var turbines = [];
    var rotationState = {};

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        waterSpray = [];
        turbines = [];
        rotationState = { turbineAngle: 0, sprayPhase: 0 };
        buildDamWall();
        buildBreachSection();
        buildFloodPlain();
        buildDefenses();
        buildInfrastructure();
        buildTurbines();
        buildWaterSpray();
        buildAccessStructures();
        setupLighting();
    }

    function buildDamWall() {
        var concreteColor = 0x888888;
        var damThickness = 15;
        var damHeight = 120;
        var damLength = 200;

        // Main dam wall sections
        var mainWall = new THREE.Mesh(
            new THREE.BoxGeometry(damLength, damHeight, damThickness),
            new THREE.MeshLambertMaterial({ color: concreteColor })
        );
        mainWall.position.set(0, damHeight / 2, -50);
        scene.add(mainWall);
        objects.push(mainWall);

        // Left wall segment
        var leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(80, damHeight, damThickness),
            new THREE.MeshLambertMaterial({ color: concreteColor })
        );
        leftWall.position.set(-110, damHeight / 2, -50);
        scene.add(leftWall);
        objects.push(leftWall);

        // Right wall segment
        var rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(80, damHeight, damThickness),
            new THREE.MeshLambertMaterial({ color: concreteColor })
        );
        rightWall.position.set(110, damHeight / 2, -50);
        scene.add(rightWall);
        objects.push(rightWall);

        // Support buttresses
        for (var i = 0; i < 8; i++) {
            var buttressX = -180 + (i * 50);
            var buttress = new THREE.Mesh(
                new THREE.BoxGeometry(12, damHeight * 0.8, 20),
                new THREE.MeshLambertMaterial({ color: 0x666666 })
            );
            buttress.position.set(buttressX, damHeight * 0.4, -40);
            scene.add(buttress);
            objects.push(buttress);
        }

        // Dam base reinforcement
        var baseReinforce = new THREE.Mesh(
            new THREE.BoxGeometry(damLength + 40, 8, damThickness + 20),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        baseReinforce.position.set(0, 4, -50);
        scene.add(baseReinforce);
        objects.push(baseReinforce);
    }

    function buildBreachSection() {
        var breachWidth = 80;
        var breachHeight = 85;
        var breachDepth = 12;
        var damHeight = 120;

        // Ruined left side of breach
        var leftBreach = new THREE.Mesh(
            new THREE.BoxGeometry(25, breachHeight * 0.6, breachDepth),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        leftBreach.position.set(-45, damHeight * 0.4, -50);
        leftBreach.rotation.z = 0.2;
        scene.add(leftBreach);
        objects.push(leftBreach);

        // Ruined right side of breach
        var rightBreach = new THREE.Mesh(
            new THREE.BoxGeometry(25, breachHeight * 0.7, breachDepth),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        rightBreach.position.set(45, damHeight * 0.35, -50);
        rightBreach.rotation.z = -0.15;
        scene.add(rightBreach);
        objects.push(rightBreach);

        // Rubble pile at breach base
        for (var i = 0; i < 15; i++) {
            var rubbleX = -30 + Math.random() * 60;
            var rubbleY = 15 + Math.random() * 30;
            var rubbleZ = -50 + Math.random() * 20;
            var rubbleSize = 3 + Math.random() * 5;
            var rubble = new THREE.Mesh(
                new THREE.BoxGeometry(rubbleSize, rubbleSize * 0.8, rubbleSize * 1.2),
                new THREE.MeshLambertMaterial({ color: 0x666666 })
            );
            rubble.position.set(rubbleX, rubbleY, rubbleZ);
            rubble.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            scene.add(rubble);
            objects.push(rubble);
        }

        // Emergency closure gate (partial)
        var closureGate = new THREE.Mesh(
            new THREE.BoxGeometry(40, 30, 2),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        closureGate.position.set(0, 75, -48);
        closureGate.rotation.z = 0.35;
        scene.add(closureGate);
        objects.push(closureGate);
    }

    function buildFloodPlain() {
        var waterColor = 0x1a4d6d;
        var floodWidth = 500;
        var floodLength = 400;

        // Main flood water level
        var floodWater = new THREE.Mesh(
            new THREE.BoxGeometry(floodWidth, 2, floodLength),
            new THREE.MeshLambertMaterial({ color: waterColor })
        );
        floodWater.position.set(0, 20, 100);
        scene.add(floodWater);
        objects.push(floodWater);

        // Deep water zone (darker)
        var deepWater = new THREE.Mesh(
            new THREE.BoxGeometry(floodWidth * 0.8, 40, floodLength * 0.7),
            new THREE.MeshLambertMaterial({ color: 0x0d2d3d })
        );
        deepWater.position.set(50, 0, 120);
        scene.add(deepWater);
        objects.push(deepWater);

        // Flood water flowing through channel
        for (var i = 0; i < 6; i++) {
            var channelSegment = new THREE.Mesh(
                new THREE.BoxGeometry(120, 2, 35),
                new THREE.MeshLambertMaterial({ color: 0x2d5a7a })
            );
            channelSegment.position.set(0, 18 - (i * 3), -30 + (i * 20));
            scene.add(channelSegment);
            objects.push(channelSegment);
        }

        // Submerged vehicle 1 (truck top)
        var truck1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 3, 16),
            new THREE.MeshLambertMaterial({ color: 0x8b0000 })
        );
        truck1.position.set(-60, 21, 80);
        truck1.rotation.y = 0.3;
        scene.add(truck1);
        objects.push(truck1);

        // Submerged vehicle 2 (car roof)
        var car1 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 2.5, 10),
            new THREE.MeshLambertMaterial({ color: 0x1a1a2e })
        );
        car1.position.set(40, 21.2, 120);
        car1.rotation.y = -0.5;
        scene.add(car1);
        objects.push(car1);

        // Submerged vehicle 3
        var truck2 = new THREE.Mesh(
            new THREE.BoxGeometry(7, 2.8, 14),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        truck2.position.set(80, 20.8, 160);
        truck2.rotation.y = 1.2;
        scene.add(truck2);
        objects.push(truck2);

        // Submerged vehicle 4
        var bus = new THREE.Mesh(
            new THREE.BoxGeometry(9, 3.5, 20),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        bus.position.set(-90, 20.5, 140);
        bus.rotation.y = 0.8;
        scene.add(bus);
        objects.push(bus);

        // Submerged debris piles
        for (var i = 0; i < 8; i++) {
            var debrisX = -200 + Math.random() * 400;
            var debrisZ = 50 + Math.random() * 250;
            var debrisSize = 4 + Math.random() * 8;
            var debris = new THREE.Mesh(
                new THREE.BoxGeometry(debrisSize * 1.5, debrisSize * 0.6, debrisSize),
                new THREE.MeshLambertMaterial({ color: 0x3d3d2d })
            );
            debris.position.set(debrisX, 15 + Math.random() * 8, debrisZ);
            debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            scene.add(debris);
            objects.push(debris);
        }
    }

    function buildDefenses() {
        var sandbagColor = 0xd4a574;
        var damHeight = 120;

        // Sandbag position 1 (top of dam)
        for (var i = 0; i < 4; i++) {
            var sandbag1 = new THREE.Mesh(
                new THREE.BoxGeometry(3, 1.5, 2),
                new THREE.MeshLambertMaterial({ color: sandbagColor })
            );
            sandbag1.position.set(-50 + (i * 5), damHeight + 2, -48);
            scene.add(sandbag1);
            objects.push(sandbag1);
        }

        // Sandbag position 2 (spillway control area)
        for (var i = 0; i < 5; i++) {
            var sandbag2 = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 1.5, 2),
                new THREE.MeshLambertMaterial({ color: sandbagColor })
            );
            sandbag2.position.set(30 + (i * 4), damHeight * 0.2, 10);
            scene.add(sandbag2);
            objects.push(sandbag2);
        }

        // Guard post 1 (left wall)
        var guardPost1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 20, 8),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        guardPost1.position.set(-140, 35, -50);
        scene.add(guardPost1);
        objects.push(guardPost1);

        // Guard post 2 (right wall)
        var guardPost2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 20, 8),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        guardPost2.position.set(140, 35, -50);
        scene.add(guardPost2);
        objects.push(guardPost2);

        // Guard post 3 (breach zone)
        var guardPost3 = new THREE.Mesh(
            new THREE.BoxGeometry(10, 15, 10),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        guardPost3.position.set(0, 25, 20);
        scene.add(guardPost3);
        objects.push(guardPost3);

        // Defensive barriers (spillway control)
        for (var i = 0; i < 6; i++) {
            var barrier = new THREE.Mesh(
                new THREE.BoxGeometry(25, 3, 2),
                new THREE.MeshLambertMaterial({ color: 0x666666 })
            );
            barrier.position.set(-50 + (i * 20), 50, 35);
            scene.add(barrier);
            objects.push(barrier);
        }
    }

    function buildInfrastructure() {
        var damHeight = 120;

        // Walkway on dam top
        var walkway = new THREE.Mesh(
            new THREE.BoxGeometry(180, 1.5, 4),
            new THREE.MeshLambertMaterial({ color: 0x777777 })
        );
        walkway.position.set(0, damHeight + 1, -48);
        scene.add(walkway);
        objects.push(walkway);

        // Walkway railings (left side)
        for (var i = 0; i < 18; i++) {
            var points = [
                new THREE.Vector3(-90 + (i * 10), damHeight + 2.5, -50),
                new THREE.Vector3(-90 + (i * 10), damHeight + 3.5, -50)
            ];
            var railing = new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints(points),
                new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 })
            );
            scene.add(railing);
            objects.push(railing);
        }

        // Walkway railings (right side)
        for (var i = 0; i < 18; i++) {
            var points = [
                new THREE.Vector3(-90 + (i * 10), damHeight + 2.5, -46),
                new THREE.Vector3(-90 + (i * 10), damHeight + 3.5, -46)
            ];
            var railing = new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints(points),
                new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 })
            );
            scene.add(railing);
            objects.push(railing);
        }

        // Crane mast
        var mast = new THREE.Mesh(
            new THREE.BoxGeometry(3, 50, 3),
            new THREE.MeshLambertMaterial({ color: 0xaa8844 })
        );
        mast.position.set(-80, 65, -45);
        scene.add(mast);
        objects.push(mast);

        // Crane boom
        var boom = new THREE.Mesh(
            new THREE.BoxGeometry(40, 2, 2),
            new THREE.MeshLambertMaterial({ color: 0x996633 })
        );
        boom.position.set(-60, 115, -45);
        scene.add(boom);
        objects.push(boom);

        // Crane cable/hook
        var hook = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        hook.position.set(-40, 95, -45);
        scene.add(hook);
        objects.push(hook);

        // Control room structure
        var controlRoom = new THREE.Mesh(
            new THREE.BoxGeometry(12, 10, 12),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        controlRoom.position.set(100, 50, -50);
        scene.add(controlRoom);
        objects.push(controlRoom);

        // Control room roof
        var controlRoof = new THREE.Mesh(
            new THREE.BoxGeometry(14, 2, 14),
            new THREE.MeshLambertMaterial({ color: 0x777777 })
        );
        controlRoof.position.set(100, 60, -50);
        scene.add(controlRoof);
        objects.push(controlRoof);

        // Emergency diesel generator shelter
        var genShelter = new THREE.Mesh(
            new THREE.BoxGeometry(10, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        genShelter.position.set(-120, 40, -45);
        scene.add(genShelter);
        objects.push(genShelter);

        // Pumping station structure
        var pumpStation = new THREE.Mesh(
            new THREE.BoxGeometry(15, 12, 15),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        pumpStation.position.set(0, 30, 40);
        scene.add(pumpStation);
        objects.push(pumpStation);
    }

    function buildTurbines() {
        var damHeight = 120;

        // Turbine building at dam base
        var turbineHouse = new THREE.Mesh(
            new THREE.BoxGeometry(50, 25, 30),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        turbineHouse.position.set(0, 12.5, 0);
        scene.add(turbineHouse);
        objects.push(turbineHouse);

        // Turbine house entrance
        var entrance = new THREE.Mesh(
            new THREE.BoxGeometry(8, 10, 2),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        entrance.position.set(-20, 10, 15);
        scene.add(entrance);
        objects.push(entrance);

        // Individual turbines
        for (var i = 0; i < 4; i++) {
            var turbineX = -15 + (i * 10);

            // Turbine housing
            var turbineHousing = new THREE.Mesh(
                new THREE.CylinderGeometry(4, 4, 8, 16),
                new THREE.MeshLambertMaterial({ color: 0x666666 })
            );
            turbineHousing.position.set(turbineX, 15, 5);
            scene.add(turbineHousing);
            objects.push(turbineHousing);

            // Turbine rotor (cylinder that rotates)
            var turbineRotor = new THREE.Mesh(
                new THREE.CylinderGeometry(3.5, 3.5, 6, 16),
                new THREE.MeshLambertMaterial({ color: 0xaa8844 })
            );
            turbineRotor.position.set(turbineX, 15, 5);
            turbineRotor.castShadow = true;
            scene.add(turbineRotor);
            objects.push(turbineRotor);
            turbines.push(turbineRotor);

            // Turbine shaft support
            var shaftSupport = new THREE.Mesh(
                new THREE.BoxGeometry(2, 6, 2),
                new THREE.MeshLambertMaterial({ color: 0x555555 })
            );
            shaftSupport.position.set(turbineX, 8, 5);
            scene.add(shaftSupport);
            objects.push(shaftSupport);
        }

        // Generator unit 1
        var generator1 = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 12, 16),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        generator1.position.set(-20, 20, 15);
        generator1.rotation.z = Math.PI / 2;
        scene.add(generator1);
        objects.push(generator1);

        // Generator unit 2
        var generator2 = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 12, 16),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        generator2.position.set(20, 20, 15);
        generator2.rotation.z = Math.PI / 2;
        scene.add(generator2);
        objects.push(generator2);

        // Inlet pipes
        for (var i = 0; i < 4; i++) {
            var pipeX = -15 + (i * 10);
            var inlet = new THREE.Mesh(
                new THREE.CylinderGeometry(3, 3, 15, 12),
                new THREE.MeshLambertMaterial({ color: 0x444444 })
            );
            inlet.position.set(pipeX, 30, -10);
            inlet.rotation.x = Math.PI / 2.5;
            scene.add(inlet);
            objects.push(inlet);
        }

        // Outlet pipes
        for (var i = 0; i < 4; i++) {
            var pipeX = -15 + (i * 10);
            var outlet = new THREE.Mesh(
                new THREE.CylinderGeometry(2.5, 2.5, 20, 12),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            outlet.position.set(pipeX, 0, 20);
            outlet.rotation.x = Math.PI / 2.5;
            scene.add(outlet);
            objects.push(outlet);
        }
    }

    function buildWaterSpray() {
        // Spray particles at breach
        for (var i = 0; i < 40; i++) {
            var spray = new THREE.Mesh(
                new THREE.SphereGeometry(0.8, 6, 6),
                new THREE.MeshLambertMaterial({ color: 0xcccccc })
            );
            var startX = -30 + Math.random() * 60;
            var startY = 60 + Math.random() * 30;
            var startZ = -40 + Math.random() * 20;
            spray.position.set(startX, startY, startZ);
            spray.userData.startPos = { x: startX, y: startY, z: startZ };
            spray.userData.velocity = {
                x: (Math.random() - 0.5) * 8,
                y: (Math.random() - 0.5) * 6 - 2,
                z: (Math.random() - 0.5) * 8 + 2
            };
            spray.userData.life = Math.random();
            scene.add(spray);
            objects.push(spray);
            waterSpray.push(spray);
        }

        // Overflow spray from spillway
        for (var i = 0; i < 20; i++) {
            var spillSpray = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 6, 6),
                new THREE.MeshLambertMaterial({ color: 0xdddddd })
            );
            var startX = -40 + Math.random() * 80;
            var startY = 50 + Math.random() * 20;
            var startZ = 30 + Math.random() * 15;
            spillSpray.position.set(startX, startY, startZ);
            spillSpray.userData.startPos = { x: startX, y: startY, z: startZ };
            spillSpray.userData.velocity = {
                x: (Math.random() - 0.5) * 6,
                y: (Math.random() - 0.5) * 8 - 3,
                z: (Math.random() - 0.5) * 6 + 3
            };
            spillSpray.userData.life = Math.random();
            scene.add(spillSpray);
            objects.push(spillSpray);
            waterSpray.push(spillSpray);
        }
    }

    function buildAccessStructures() {
        // Metal scaffolding on dam face (left side)
        for (var row = 0; row < 6; row++) {
            for (var col = 0; col < 5; col++) {
                var scaffoldX = -90 + (col * 30);
                var scaffoldY = 20 + (row * 18);
                var horizontal = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.8, 0.8, 25, 8),
                    new THREE.MeshLambertMaterial({ color: 0x555555 })
                );
                horizontal.position.set(scaffoldX, scaffoldY, -45);
                horizontal.rotation.z = Math.PI / 2;
                scene.add(horizontal);
                objects.push(horizontal);
            }
        }

        // Maintenance stairs (zigzag pattern on dam)
        for (var i = 0; i < 8; i++) {
            var stairX = -100 + (i * 25);
            var stairY = 15 + (i * 14);
            var step = new THREE.Mesh(
                new THREE.BoxGeometry(3, 1.5, 8),
                new THREE.MeshLambertMaterial({ color: 0x777777 })
            );
            step.position.set(stairX, stairY, -45);
            scene.add(step);
            objects.push(step);
        }

        // Spillway gates (right side structure)
        var spillGate1 = new THREE.Mesh(
            new THREE.BoxGeometry(35, 25, 2),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        spillGate1.position.set(100, 40, 0);
        scene.add(spillGate1);
        objects.push(spillGate1);

        // Spillway gate mechanism
        var gateMech = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 20, 12),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        gateMech.position.set(85, 55, 0);
        gateMech.rotation.z = Math.PI / 2;
        scene.add(gateMech);
        objects.push(gateMech);

        // Overflow channel walls
        var channelWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(3, 20, 100),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        channelWallLeft.position.set(-65, 20, 50);
        scene.add(channelWallLeft);
        objects.push(channelWallLeft);

        var channelWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(3, 20, 100),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        channelWallRight.position.set(65, 20, 50);
        scene.add(channelWallRight);
        objects.push(channelWallRight);

        // Channel bottom sections
        for (var i = 0; i < 5; i++) {
            var channelBottom = new THREE.Mesh(
                new THREE.BoxGeometry(130, 2, 20),
                new THREE.MeshLambertMaterial({ color: 0x555555 })
            );
            channelBottom.position.set(0, 10, 30 + (i * 25));
        scene.add(channelBottom);
            objects.push(channelBottom);
        }

        // Reinforced observation tower
        var tower = new THREE.Mesh(
            new THREE.BoxGeometry(8, 40, 8),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        tower.position.set(-150, 20, 30);
        scene.add(tower);
        objects.push(tower);

        // Tower top platform
        var towerTop = new THREE.Mesh(
            new THREE.BoxGeometry(12, 2, 12),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        towerTop.position.set(-150, 42, 30);
        scene.add(towerTop);
        objects.push(towerTop);

        // Floodgate structure (emergency closure system)
        var floodGate = new THREE.Mesh(
            new THREE.BoxGeometry(150, 20, 3),
            new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        floodGate.position.set(0, 35, 25);
        scene.add(floodGate);
        objects.push(floodGate);

        // Blast barriers (concrete wedges)
        for (var i = 0; i < 6; i++) {
            var barrierX = -120 + (i * 40);
            var barrier = new THREE.Mesh(
                new THREE.BoxGeometry(20, 8, 5),
                new THREE.MeshLambertMaterial({ color: 0x666666 })
            );
            barrier.position.set(barrierX, 8, 50);
            barrier.rotation.z = 0.3;
            scene.add(barrier);
            objects.push(barrier);
        }

        // Personnel shelter bunkers
        for (var i = 0; i < 4; i++) {
            var bunkerX = -80 + (i * 50);
            var bunker = new THREE.Mesh(
                new THREE.BoxGeometry(12, 6, 14),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            bunker.position.set(bunkerX, 25, 70);
            scene.add(bunker);
            objects.push(bunker);
        }
    }

    function setupLighting() {
        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (sun)
        var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(100, 150, 50);
        sunLight.castShadow = true;
        scene.add(sunLight);
        lights.push(sunLight);

        // Light at breach zone
        var breachLight = new THREE.PointLight(0x6699ff, 0.6, 150);
        breachLight.position.set(0, 80, 0);
        scene.add(breachLight);
        lights.push(breachLight);

        // Light at turbine house
        var turbineLight = new THREE.PointLight(0xffaa44, 0.5, 100);
        turbineLight.position.set(0, 25, 0);
        scene.add(turbineLight);
        lights.push(turbineLight);

        // Emergency warning lights on dam
        for (var i = 0; i < 4; i++) {
            var warnLight = new THREE.PointLight(0xff4400, 0.4, 80);
            warnLight.position.set(-100 + (i * 70), 125, -50);
            scene.add(warnLight);
            lights.push(warnLight);
        }
    }

    function update(delta) {
        rotationState.turbineAngle += delta * 3;
        rotationState.sprayPhase += delta * 2;

        // Animate turbine rotors
        for (var i = 0; i < turbines.length; i++) {
            turbines[i].rotation.z = rotationState.turbineAngle;
        }

        // Animate water spray particles
        for (var i = 0; i < waterSpray.length; i++) {
            var spray = waterSpray[i];
            if (spray.userData && spray.userData.velocity) {
                spray.position.x += spray.userData.velocity.x * delta;
                spray.position.y += spray.userData.velocity.y * delta;
                spray.position.z += spray.userData.velocity.z * delta;

                spray.userData.life += delta;
                if (spray.userData.life > 3) {
                    spray.position.set(
                        spray.userData.startPos.x,
                        spray.userData.startPos.y,
                        spray.userData.startPos.z
                    );
                    spray.userData.life = 0;
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
        waterSpray = [];
        turbines = [];
        scene = null;
        camera = null;
        rotationState = {};
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
