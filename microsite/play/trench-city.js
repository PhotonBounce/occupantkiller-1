window.TrenchCity = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var explosionLight = null;
    var mortarSmoke = [];
    var time = 0;

    var COLORS = {
        concrete: 0x888888,
        trenchBrown: 0x4a3728,
        sandbagKhaki: 0xd4af8f,
        explosionOrange: 0xff6600,
        darkEarth: 0x3d2817,
        rubbleGray: 0x666666,
        brickRed: 0x8b4513,
        metalGray: 0x333333
    };

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        mortarSmoke = [];
        time = 0;

        buildTrenches();
        buildCityRuins();
        buildBunkers();
        buildBarricades();
        buildDecorations();
        buildCraters();
        buildWireLines();
        buildRubblePiles();
        setupLighting();
    }

    function buildTrenches() {
        var trenchStartX = -80;
        var trenchStartZ = -100;
        var trenchLength = 200;
        var trenchWidth = 8;
        var trenchDepth = 12;

        // Main north-south trench corridor
        var northTrench = new THREE.BoxGeometry(trenchWidth, trenchDepth, trenchLength);
        var northTrenchMat = new THREE.MeshLambertMaterial({ color: COLORS.trenchBrown });
        var northTrenchMesh = new THREE.Mesh(northTrench, northTrenchMat);
        northTrenchMesh.position.set(trenchStartX, -trenchDepth / 2, trenchStartZ);
        scene.add(northTrenchMesh);
        objects.push(northTrenchMesh);

        // East-west connecting trench
        var eastTrench = new THREE.BoxGeometry(trenchLength, trenchDepth, trenchWidth);
        var eastTrenchMat = new THREE.MeshLambertMaterial({ color: COLORS.trenchBrown });
        var eastTrenchMesh = new THREE.Mesh(eastTrench, eastTrenchMat);
        eastTrenchMesh.position.set(0, -trenchDepth / 2, 20);
        scene.add(eastTrenchMesh);
        objects.push(eastTrenchMesh);

        // Secondary zigzag trench section
        var zigzagTrench = new THREE.BoxGeometry(trenchWidth, trenchDepth, 80);
        var zigzagMat = new THREE.MeshLambertMaterial({ color: COLORS.darkEarth });
        var zigzagMesh = new THREE.Mesh(zigzagTrench, zigzagMat);
        zigzagMesh.position.set(60, -trenchDepth / 2, -50);
        zigzagMesh.rotation.z = 0.3;
        scene.add(zigzagMesh);
        objects.push(zigzagMesh);

        // Sandbag walls lining trenches (north side)
        for (var i = 0; i < 25; i++) {
            var sandbag = new THREE.BoxGeometry(2, 1.5, 1.5);
            var sandbagMat = new THREE.MeshLambertMaterial({ color: COLORS.sandbagKhaki });
            var sandbagMesh = new THREE.Mesh(sandbag, sandbagMat);
            sandbagMesh.position.set(trenchStartX - 5, -trenchDepth + 2, trenchStartZ - 100 + i * 8);
            scene.add(sandbagMesh);
            objects.push(sandbagMesh);
        }

        // Sandbag walls lining trenches (south side)
        for (var i = 0; i < 25; i++) {
            var sandbag = new THREE.BoxGeometry(2, 1.5, 1.5);
            var sandbagMat = new THREE.MeshLambertMaterial({ color: COLORS.sandbagKhaki });
            var sandbagMesh = new THREE.Mesh(sandbag, sandbagMat);
            sandbagMesh.position.set(trenchStartX + 5, -trenchDepth + 2, trenchStartZ - 100 + i * 8);
            scene.add(sandbagMesh);
            objects.push(sandbagMesh);
        }

        // Fire step platforms (narrow ledges inside trench)
        for (var i = 0; i < 12; i++) {
            var fireStep = new THREE.BoxGeometry(2, 1, 3);
            var fireStepMat = new THREE.MeshLambertMaterial({ color: COLORS.concrete });
            var fireStepMesh = new THREE.Mesh(fireStep, fireStepMat);
            fireStepMesh.position.set(trenchStartX - 3, -trenchDepth + 1, trenchStartZ - 100 + i * 16);
            scene.add(fireStepMesh);
            objects.push(fireStepMesh);
        }

        // Fire step platforms (east side)
        for (var i = 0; i < 12; i++) {
            var fireStep = new THREE.BoxGeometry(3, 1, 2);
            var fireStepMat = new THREE.MeshLambertMaterial({ color: COLORS.concrete });
            var fireStepMesh = new THREE.Mesh(fireStep, fireStepMat);
            fireStepMesh.position.set(-80 + i * 16, -trenchDepth + 1, 25);
            scene.add(fireStepMesh);
            objects.push(fireStepMesh);
        }

        // Observation slits in walls (small boxes representing windows/ports)
        for (var i = 0; i < 8; i++) {
            var slit = new THREE.BoxGeometry(0.5, 0.8, 0.3);
            var slitMat = new THREE.MeshLambertMaterial({ color: COLORS.metalGray });
            var slitMesh = new THREE.Mesh(slit, slitMat);
            slitMesh.position.set(trenchStartX - 5.5, -trenchDepth + 3, trenchStartZ - 100 + i * 25);
            scene.add(slitMesh);
            objects.push(slitMesh);
        }
    }

    function buildCityRuins() {
        // Building 1 - corner ruins
        var building1Wall1 = new THREE.BoxGeometry(25, 18, 2);
        var ruinMat = new THREE.MeshLambertMaterial({ color: COLORS.rubbleGray });
        var building1Wall1Mesh = new THREE.Mesh(building1Wall1, ruinMat);
        building1Wall1Mesh.position.set(40, 8, -60);
        scene.add(building1Wall1Mesh);
        objects.push(building1Wall1Mesh);

        var building1Wall2 = new THREE.BoxGeometry(2, 15, 25);
        var building1Wall2Mesh = new THREE.Mesh(building1Wall2, ruinMat);
        building1Wall2Mesh.position.set(53, 7, -47);
        scene.add(building1Wall2Mesh);
        objects.push(building1Wall2Mesh);

        var building1Wall3 = new THREE.BoxGeometry(25, 12, 2);
        var building1Wall3Mesh = new THREE.Mesh(building1Wall3, ruinMat);
        building1Wall3Mesh.position.set(40, 5, -35);
        scene.add(building1Wall3Mesh);
        objects.push(building1Wall3Mesh);

        // Building 2 - damaged structure
        var building2Frame1 = new THREE.BoxGeometry(20, 20, 2);
        var building2Frame1Mesh = new THREE.Mesh(building2Frame1, ruinMat);
        building2Frame1Mesh.position.set(-50, 9, 50);
        building2Frame1Mesh.rotation.y = 0.4;
        scene.add(building2Frame1Mesh);
        objects.push(building2Frame1Mesh);

        var building2Frame2 = new THREE.BoxGeometry(2, 18, 20);
        var building2Frame2Mesh = new THREE.Mesh(building2Frame2, ruinMat);
        building2Frame2Mesh.position.set(-65, 8, 55);
        building2Frame2Mesh.rotation.y = 0.4;
        scene.add(building2Frame2Mesh);
        objects.push(building2Frame2Mesh);

        // Building 3 - partial collapse
        var building3Wall1 = new THREE.BoxGeometry(30, 10, 2);
        var building3Wall1Mesh = new THREE.Mesh(building3Wall1, ruinMat);
        building3Wall1Mesh.position.set(-30, 5, -80);
        scene.add(building3Wall1Mesh);
        objects.push(building3Wall1Mesh);

        var building3Wall2 = new THREE.BoxGeometry(2, 14, 30);
        var building3Wall2Mesh = new THREE.Mesh(building3Wall2, ruinMat);
        building3Wall2Mesh.position.set(-15, 6, -80);
        scene.add(building3Wall2Mesh);
        objects.push(building3Wall2Mesh);

        // Building 4 - heavily damaged
        var building4Debris1 = new THREE.BoxGeometry(15, 8, 15);
        var building4Debris1Mesh = new THREE.Mesh(building4Debris1, ruinMat);
        building4Debris1Mesh.position.set(80, 3, 40);
        building4Debris1Mesh.rotation.z = 0.2;
        scene.add(building4Debris1Mesh);
        objects.push(building4Debris1Mesh);

        var building4Debris2 = new THREE.BoxGeometry(18, 6, 12);
        var building4Debris2Mesh = new THREE.Mesh(building4Debris2, ruinMat);
        building4Debris2Mesh.position.set(95, 2, 50);
        building4Debris2Mesh.rotation.z = -0.3;
        scene.add(building4Debris2Mesh);
        objects.push(building4Debris2Mesh);

        // Additional partial walls for visual complexity
        for (var i = 0; i < 6; i++) {
            var wallFragment = new THREE.BoxGeometry(12 + i * 2, 6 + i, 2);
            var fragmentMesh = new THREE.Mesh(wallFragment, ruinMat);
            fragmentMesh.position.set(-70 + i * 20, 2 + i, 20 + i * 10);
            fragmentMesh.rotation.y = i * 0.3;
            scene.add(fragmentMesh);
            objects.push(fragmentMesh);
        }
    }

    function buildBunkers() {
        // Underground bunker entrance in trench floor
        var hatchCover = new THREE.BoxGeometry(4, 0.8, 4);
        var hatchMat = new THREE.MeshLambertMaterial({ color: COLORS.metalGray });
        var hatchMesh = new THREE.Mesh(hatchCover, hatchMat);
        hatchMesh.position.set(-80, -11.5, 0);
        scene.add(hatchMesh);
        objects.push(hatchMesh);

        // Stairway boxes (descending steps)
        for (var i = 0; i < 5; i++) {
            var stair = new THREE.BoxGeometry(3.5, 1.2, 1.5);
            var stairMat = new THREE.MeshLambertMaterial({ color: COLORS.concrete });
            var stairMesh = new THREE.Mesh(stair, stairMat);
            stairMesh.position.set(-80, -12 - i * 1.5, i * 1.2);
            scene.add(stairMesh);
            objects.push(stairMesh);
        }

        // Bunker walls and compartments
        var bunkerWall1 = new THREE.BoxGeometry(15, 6, 2);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: COLORS.concrete });
        var bunkerWall1Mesh = new THREE.Mesh(bunkerWall1, bunkerMat);
        bunkerWall1Mesh.position.set(-80, -15, 8);
        scene.add(bunkerWall1Mesh);
        objects.push(bunkerWall1Mesh);

        var bunkerWall2 = new THREE.BoxGeometry(2, 6, 12);
        var bunkerWall2Mesh = new THREE.Mesh(bunkerWall2, bunkerMat);
        bunkerWall2Mesh.position.set(-73, -15, 2);
        scene.add(bunkerWall2Mesh);
        objects.push(bunkerWall2Mesh);

        var bunkerWall3 = new THREE.BoxGeometry(15, 6, 2);
        var bunkerWall3Mesh = new THREE.Mesh(bunkerWall3, bunkerMat);
        bunkerWall3Mesh.position.set(-80, -15, -4);
        scene.add(bunkerWall3Mesh);
        objects.push(bunkerWall3Mesh);

        // Additional bunker compartments
        var bunkerBox1 = new THREE.BoxGeometry(8, 5, 8);
        var bunkerBox1Mesh = new THREE.Mesh(bunkerBox1, bunkerMat);
        bunkerBox1Mesh.position.set(-60, -16, 0);
        scene.add(bunkerBox1Mesh);
        objects.push(bunkerBox1Mesh);

        var bunkerBox2 = new THREE.BoxGeometry(8, 5, 8);
        var bunkerBox2Mesh = new THREE.Mesh(bunkerBox2, bunkerMat);
        bunkerBox2Mesh.position.set(-75, -16, 12);
        scene.add(bunkerBox2Mesh);
        objects.push(bunkerBox2Mesh);
    }

    function buildBarricades() {
        // Vehicle wreck barriers
        var vehicleBody = new THREE.BoxGeometry(6, 3, 12);
        var vehicleMat = new THREE.MeshLambertMaterial({ color: COLORS.metalGray });
        var vehicleMesh = new THREE.Mesh(vehicleBody, vehicleMat);
        vehicleMesh.position.set(30, 1, -20);
        vehicleMesh.rotation.z = 0.15;
        scene.add(vehicleMesh);
        objects.push(vehicleMesh);

        var vehicleWheel1 = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16);
        var wheelMat = new THREE.MeshLambertMaterial({ color: COLORS.metalGray });
        var wheelMesh1 = new THREE.Mesh(vehicleWheel1, wheelMat);
        wheelMesh1.position.set(25, 1.5, -15);
        scene.add(wheelMesh1);
        objects.push(wheelMesh1);

        var wheelMesh2 = new THREE.Mesh(vehicleWheel1, wheelMat);
        wheelMesh2.position.set(35, 1.5, -15);
        scene.add(wheelMesh2);
        objects.push(wheelMesh2);

        var wheelMesh3 = new THREE.Mesh(vehicleWheel1, wheelMat);
        wheelMesh3.position.set(25, 1.5, -25);
        scene.add(wheelMesh3);
        objects.push(wheelMesh3);

        var wheelMesh4 = new THREE.Mesh(vehicleWheel1, wheelMat);
        wheelMesh4.position.set(35, 1.5, -25);
        scene.add(wheelMesh4);
        objects.push(wheelMesh4);

        // Sandbag stack barricades
        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 5; col++) {
                var sandbagStack = new THREE.BoxGeometry(2, 1.5, 2);
                var sandbagMat = new THREE.MeshLambertMaterial({ color: COLORS.sandbagKhaki });
                var sandbagStackMesh = new THREE.Mesh(sandbagStack, sandbagMat);
                sandbagStackMesh.position.set(50 + col * 2.5, 1.5 + row * 1.5, -35 + row * 3);
                scene.add(sandbagStackMesh);
                objects.push(sandbagStackMesh);
            }
        }

        // Secondary barricade line
        for (var i = 0; i < 10; i++) {
            var barricade = new THREE.BoxGeometry(3, 2, 1.5);
            var barricadeMat = new THREE.MeshLambertMaterial({ color: COLORS.sandbagKhaki });
            var barricadeMesh = new THREE.Mesh(barricade, barricadeMat);
            barricadeMesh.position.set(-40 + i * 4, 1, 70);
            barricadeMesh.rotation.y = Math.random() * 0.2;
            scene.add(barricadeMesh);
            objects.push(barricadeMesh);
        }
    }

    function buildDecorations() {
        // Mortar pit and mortar
        var pitCylinder = new THREE.CylinderGeometry(3, 3.5, 2.5, 12);
        var pitMat = new THREE.MeshLambertMaterial({ color: COLORS.darkEarth });
        var pitMesh = new THREE.Mesh(pitCylinder, pitMat);
        pitMesh.position.set(-40, -10, -30);
        scene.add(pitMesh);
        objects.push(pitMesh);

        // Mortar gun
        var mortarBase = new THREE.CylinderGeometry(1.2, 1.5, 1, 12);
        var mortarMat = new THREE.MeshLambertMaterial({ color: COLORS.metalGray });
        var mortarBaseMesh = new THREE.Mesh(mortarBase, mortarMat);
        mortarBaseMesh.position.set(-40, -8.5, -30);
        scene.add(mortarBaseMesh);
        objects.push(mortarBaseMesh);

        var mortarTube = new THREE.CylinderGeometry(0.6, 0.7, 4, 12);
        var mortarTubeMesh = new THREE.Mesh(mortarTube, mortarMat);
        mortarTubeMesh.position.set(-40, -5, -30);
        mortarTubeMesh.rotation.z = 0.6;
        scene.add(mortarTubeMesh);
        objects.push(mortarTubeMesh);

        var mortarCone = new THREE.ConeGeometry(0.7, 1.2, 12);
        var mortarConeMesh = new THREE.Mesh(mortarCone, mortarMat);
        mortarConeMesh.position.set(-36.5, -2.5, -27);
        mortarConeMesh.rotation.z = 0.6;
        scene.add(mortarConeMesh);
        objects.push(mortarConeMesh);

        // Distant smoke clouds (animated spheres for mortar)
        var smokeCloud = new THREE.SphereGeometry(2, 8, 8);
        var smokeMat = new THREE.MeshLambertMaterial({
            color: 0x999999,
            transparent: true,
            opacity: 0.4
        });
        var smokeCloudMesh = new THREE.Mesh(smokeCloud, smokeMat);
        smokeCloudMesh.position.set(-35, 8, -50);
        scene.add(smokeCloudMesh);
        objects.push(smokeCloudMesh);
        mortarSmoke.push({ mesh: smokeCloudMesh, time: 0 });

        // Ammo crates
        for (var i = 0; i < 6; i++) {
            var ammoCrate = new THREE.BoxGeometry(2, 2, 2);
            var crateMat = new THREE.MeshLambertMaterial({ color: COLORS.brickRed });
            var crateMesh = new THREE.Mesh(ammoCrate, crateMat);
            crateMesh.position.set(-50 + i * 3, 1, -20);
            crateMesh.rotation.y = Math.random() * 0.3;
            scene.add(crateMesh);
            objects.push(crateMesh);
        }

        // Barrel obstacles
        for (var i = 0; i < 4; i++) {
            var barrel = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 8);
            var barrelMat = new THREE.MeshLambertMaterial({ color: COLORS.metalGray });
            var barrelMesh = new THREE.Mesh(barrel, barrelMat);
            barrelMesh.position.set(20 + i * 5, 0.9, 15);
            scene.add(barrelMesh);
            objects.push(barrelMesh);
        }

        // Sandbag piles (scattered)
        for (var i = 0; i < 12; i++) {
            var sandbagPile = new THREE.BoxGeometry(1.5, 1.2, 1.5);
            var sandMat = new THREE.MeshLambertMaterial({ color: COLORS.sandbagKhaki });
            var sandMesh = new THREE.Mesh(sandbagPile, sandMat);
            sandMesh.position.set(-20 + Math.random() * 40, 0.6, -10 + Math.random() * 40);
            sandMesh.rotation.y = Math.random() * Math.PI;
            scene.add(sandMesh);
            objects.push(sandMesh);
        }
    }

    function buildCraters() {
        // Shell crater 1 (sunken sphere-like)
        var crater1 = new THREE.SphereGeometry(8, 12, 12);
        var craterMat = new THREE.MeshLambertMaterial({ color: COLORS.darkEarth });
        var crater1Mesh = new THREE.Mesh(crater1, craterMat);
        crater1Mesh.position.set(70, -2, -40);
        crater1Mesh.scale.set(1, 0.4, 1);
        scene.add(crater1Mesh);
        objects.push(crater1Mesh);

        // Crater lip (rim)
        var craterLip1 = new THREE.CylinderGeometry(8.5, 8, 0.5, 16);
        var lipMat = new THREE.MeshLambertMaterial({ color: COLORS.trenchBrown });
        var craterLip1Mesh = new THREE.Mesh(craterLip1, lipMat);
        craterLip1Mesh.position.set(70, 0.5, -40);
        scene.add(craterLip1Mesh);
        objects.push(craterLip1Mesh);

        // Shell crater 2
        var crater2 = new THREE.SphereGeometry(6, 10, 10);
        var crater2Mesh = new THREE.Mesh(crater2, craterMat);
        crater2Mesh.position.set(-20, -1.5, 60);
        crater2Mesh.scale.set(1, 0.5, 1);
        scene.add(crater2Mesh);
        objects.push(crater2Mesh);

        var craterLip2 = new THREE.CylinderGeometry(6.5, 6, 0.5, 16);
        var craterLip2Mesh = new THREE.Mesh(craterLip2, lipMat);
        craterLip2Mesh.position.set(-20, 0, 60);
        scene.add(craterLip2Mesh);
        objects.push(craterLip2Mesh);

        // Shell crater 3
        var crater3 = new THREE.SphereGeometry(5, 10, 10);
        var crater3Mesh = new THREE.Mesh(crater3, craterMat);
        crater3Mesh.position.set(50, -1, 80);
        crater3Mesh.scale.set(1, 0.45, 1);
        scene.add(crater3Mesh);
        objects.push(crater3Mesh);

        var craterLip3 = new THREE.CylinderGeometry(5.5, 5, 0.5, 16);
        var craterLip3Mesh = new THREE.Mesh(craterLip3, lipMat);
        craterLip3Mesh.position.set(50, 0, 80);
        scene.add(craterLip3Mesh);
        objects.push(craterLip3Mesh);
    }

    function buildWireLines() {
        // Overhead communication wire lines (LineSegments)
        var wireVertices = [];

        // Main communication line north
        wireVertices.push(new THREE.Vector3(-80, 8, -100));
        wireVertices.push(new THREE.Vector3(-80, 8, 100));

        // Communication line east
        wireVertices.push(new THREE.Vector3(-100, 8, 0));
        wireVertices.push(new THREE.Vector3(100, 8, 0));

        // Diagonal communication line
        wireVertices.push(new THREE.Vector3(-80, 8, -80));
        wireVertices.push(new THREE.Vector3(80, 8, 80));

        // Secondary wire
        wireVertices.push(new THREE.Vector3(-80, 7, -80));
        wireVertices.push(new THREE.Vector3(80, 7, 80));

        // Cross wire
        wireVertices.push(new THREE.Vector3(-60, 9, -60));
        wireVertices.push(new THREE.Vector3(60, 9, 60));

        var wireGeometry = new THREE.BufferGeometry();
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(
            new Float32Array(wireVertices.flatMap(v => [v.x, v.y, v.z])),
            3
        ));

        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 });
        var wireLines = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wireLines);
        objects.push(wireLines);

        // Support poles for wires (small cylinders)
        for (var i = 0; i < 6; i++) {
            var pole = new THREE.CylinderGeometry(0.3, 0.35, 8, 8);
            var poleMat = new THREE.MeshLambertMaterial({ color: COLORS.metalGray });
            var poleMesh = new THREE.Mesh(pole, poleMat);
            poleMesh.position.set(-70 + i * 30, 4, -80 + i * 20);
            scene.add(poleMesh);
            objects.push(poleMesh);
        }
    }

    function buildRubblePiles() {
        // Building collapse rubble (mix of spheres and boxes)
        for (var i = 0; i < 8; i++) {
            var rubbleBox = new THREE.BoxGeometry(3 + Math.random() * 2, 2 + Math.random(), 3 + Math.random() * 2);
            var rubbleMat = new THREE.MeshLambertMaterial({ color: COLORS.rubbleGray });
            var rubbleMesh = new THREE.Mesh(rubbleBox, rubbleMat);
            rubbleMesh.position.set(40 + Math.random() * 20, 2 + i * 0.5, -50 + Math.random() * 20);
            rubbleMesh.rotation.x = Math.random() * 0.3;
            rubbleMesh.rotation.y = Math.random() * Math.PI;
            rubbleMesh.rotation.z = Math.random() * 0.3;
            scene.add(rubbleMesh);
            objects.push(rubbleMesh);
        }

        // Brick piles (multiple boxes)
        for (var i = 0; i < 10; i++) {
            var brick = new THREE.BoxGeometry(1.5, 0.8, 2.5);
            var brickMat = new THREE.MeshLambertMaterial({ color: COLORS.brickRed });
            var brickMesh = new THREE.Mesh(brick, brickMat);
            brickMesh.position.set(-40 + Math.random() * 15, 0.5 + i * 0.4, 40 + Math.random() * 15);
            brickMesh.rotation.y = Math.random() * Math.PI;
            scene.add(brickMesh);
            objects.push(brickMesh);
        }

        // Stone rubble spheres
        for (var i = 0; i < 6; i++) {
            var stone = new THREE.SphereGeometry(1.5 + Math.random(), 8, 8);
            var stoneMat = new THREE.MeshLambertMaterial({ color: COLORS.concrete });
            var stoneMesh = new THREE.Mesh(stone, stoneMat);
            stoneMesh.position.set(20 + Math.random() * 30, 0.8 + Math.random() * 2, 30 + Math.random() * 40);
            scene.add(stoneMesh);
            objects.push(stoneMesh);
        }
    }

    function setupLighting() {
        // Ambient light for base illumination
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (sun/overcast sky)
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 60, 100);
        dirLight.castShadow = true;
        scene.add(dirLight);
        lights.push(dirLight);

        // Trench lighting (point lights in key trench positions)
        var trenchLight1 = new THREE.PointLight(0xffcc99, 0.6, 40);
        trenchLight1.position.set(-80, -5, -50);
        scene.add(trenchLight1);
        lights.push(trenchLight1);

        var trenchLight2 = new THREE.PointLight(0xffcc99, 0.6, 40);
        trenchLight2.position.set(-80, -5, 50);
        scene.add(trenchLight2);
        lights.push(trenchLight2);

        // Mortar pit area lighting
        var mortarLight = new THREE.PointLight(0xffaa77, 0.5, 35);
        mortarLight.position.set(-40, -5, -30);
        scene.add(mortarLight);
        lights.push(mortarLight);

        // Bunker entrance lighting
        var bunkerLight = new THREE.PointLight(0xff9966, 0.4, 30);
        bunkerLight.position.set(-80, -10, 0);
        scene.add(bunkerLight);
        lights.push(bunkerLight);

        // Explosion flash light (animated)
        explosionLight = new THREE.PointLight(COLORS.explosionOrange, 0, 80);
        explosionLight.position.set(40, 20, -40);
        scene.add(explosionLight);
        lights.push(explosionLight);
    }

    function update(delta) {
        time += delta;

        // Animate distant explosion flash (periodic burst)
        var explosionCycle = Math.sin(time * 0.5) * 0.5 + 0.5;
        if (explosionCycle > 0.7) {
            explosionLight.intensity = (explosionCycle - 0.7) * 5;
        } else {
            explosionLight.intensity = 0;
        }

        // Animate mortar smoke (rising and fading)
        for (var i = 0; i < mortarSmoke.length; i++) {
            var smoke = mortarSmoke[i];
            smoke.time += delta;

            // Rise animation
            smoke.mesh.position.y = 8 + smoke.time * 2;

            // Fade out
            smoke.mesh.material.opacity = Math.max(0, 0.4 - smoke.time * 0.15);

            // Reset after animation complete
            if (smoke.time > 3) {
                smoke.time = 0;
                smoke.mesh.position.y = 8;
                smoke.mesh.material.opacity = 0.4;
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
        mortarSmoke = [];
        explosionLight = null;
        scene = null;
        camera = null;
        time = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
