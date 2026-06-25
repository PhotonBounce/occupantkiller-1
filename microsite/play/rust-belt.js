window.RustBelt = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var craneWheel = null;
    var steamStack = null;
    var steamCloud = null;

    // Color palette for rust belt theme
    var colorRustOrange = 0xb8621b;
    var colorDarkRust = 0x8b4513;
    var colorIndustrialGray = 0x555555;
    var colorDarkGray = 0x333333;
    var colorSootBlack = 0x1a1a1a;
    var colorConcrete = 0x888888;
    var colorMetalDull = 0x696969;
    var colorSmokeWhite = 0xcccccc;

    function buildFactories() {
        // Factory 1 - Large main factory building
        var mainFactoryGeom = new THREE.BoxGeometry(60, 35, 40);
        var mainFactoryMat = new THREE.MeshLambertMaterial({ color: colorDarkRust });
        var mainFactory = new THREE.Mesh(mainFactoryGeom, mainFactoryMat);
        mainFactory.position.set(-50, 17.5, 0);
        mainFactory.castShadow = true;
        mainFactory.receiveShadow = true;
        scene.add(mainFactory);
        objects.push(mainFactory);

        // Factory 1 - Multiple smokestacks
        for (var i = 0; i < 4; i++) {
            var stackGeom = new THREE.CylinderGeometry(2.5, 2.8, 45, 12);
            var stackMat = new THREE.MeshLambertMaterial({ color: colorSootBlack });
            var stack = new THREE.Mesh(stackGeom, stackMat);
            stack.position.set(-60 + i * 8, 45, 5);
            stack.castShadow = true;
            stack.receiveShadow = true;
            scene.add(stack);
            objects.push(stack);
        }

        // Factory 1 - Collapsed tilted smokestack
        var collapsedStackGeom = new THREE.CylinderGeometry(2.2, 2.5, 40, 12);
        var collapsedStackMat = new THREE.MeshLambertMaterial({ color: colorDarkGray });
        var collapsedStack = new THREE.Mesh(collapsedStackGeom, collapsedStackMat);
        collapsedStack.position.set(-75, 28, 15);
        collapsedStack.rotation.z = 0.45;
        collapsedStack.castShadow = true;
        collapsedStack.receiveShadow = true;
        scene.add(collapsedStack);
        objects.push(collapsedStack);

        // Factory 1 - Broken window areas (boxes)
        for (var i = 0; i < 6; i++) {
            var windowGeom = new THREE.BoxGeometry(4, 4, 1);
            var windowMat = new THREE.MeshLambertMaterial({ color: colorSootBlack });
            var window = new THREE.Mesh(windowGeom, windowMat);
            window.position.set(-30 - i * 8, 20 + (i % 2) * 5, -20);
            window.castShadow = true;
            scene.add(window);
            objects.push(window);
        }

        // Factory 2 - Secondary factory building
        var factory2Geom = new THREE.BoxGeometry(45, 28, 35);
        var factory2Mat = new THREE.MeshLambertMaterial({ color: colorDarkRust });
        var factory2 = new THREE.Mesh(factory2Geom, factory2Mat);
        factory2.position.set(60, 14, -20);
        factory2.castShadow = true;
        factory2.receiveShadow = true;
        scene.add(factory2);
        objects.push(factory2);

        // Factory 2 - Twin smokestacks
        for (var i = 0; i < 2; i++) {
            var stack2Geom = new THREE.CylinderGeometry(2, 2.3, 40, 10);
            var stack2Mat = new THREE.MeshLambertMaterial({ color: colorSootBlack });
            var stack2 = new THREE.Mesh(stack2Geom, stack2Mat);
            stack2.position.set(45 + i * 15, 42, -25);
            stack2.castShadow = true;
            stack2.receiveShadow = true;
            scene.add(stack2);
            objects.push(stack2);
        }

        // Steam stack reference for animation
        steamStack = objects[objects.length - 1];
    }

    function buildRustedMachinery() {
        // Machinery heap 1
        for (var i = 0; i < 5; i++) {
            var machineGeom = new THREE.SphereGeometry(3 + i * 0.5, 8, 8);
            var machineMat = new THREE.MeshLambertMaterial({ color: colorRustOrange });
            var machine = new THREE.Mesh(machineGeom, machineMat);
            machine.position.set(-30 + i * 4, 8 + i * 2, 30);
            machine.castShadow = true;
            machine.receiveShadow = true;
            scene.add(machine);
            objects.push(machine);
        }

        // Machinery heap 2 - mixed spheres and boxes
        for (var i = 0; i < 4; i++) {
            var mechGeom = new THREE.BoxGeometry(4, 5, 6);
            var mechMat = new THREE.MeshLambertMaterial({ color: colorIndustrialGray });
            var mech = new THREE.Mesh(mechGeom, mechMat);
            mech.position.set(20 + i * 6, 7 + i * 1.5, 45);
            mech.rotation.y = Math.random() * Math.PI;
            mech.castShadow = true;
            mech.receiveShadow = true;
            scene.add(mech);
            objects.push(mech);
        }

        // Machinery heap 3 - spheres
        for (var i = 0; i < 3; i++) {
            var sphereGeom = new THREE.SphereGeometry(2.5, 10, 10);
            var sphereMat = new THREE.MeshLambertMaterial({ color: colorRustOrange });
            var sphere = new THREE.Mesh(sphereGeom, sphereMat);
            sphere.position.set(-70 + i * 8, 5 + i * 1, -40);
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            scene.add(sphere);
            objects.push(sphere);
        }

        // Heavy machinery column
        var machineColumnGeom = new THREE.CylinderGeometry(3.5, 4, 25, 14);
        var machineColumnMat = new THREE.MeshLambertMaterial({ color: colorDarkGray });
        var machineColumn = new THREE.Mesh(machineColumnGeom, machineColumnMat);
        machineColumn.position.set(-85, 12.5, 20);
        machineColumn.castShadow = true;
        machineColumn.receiveShadow = true;
        scene.add(machineColumn);
        objects.push(machineColumn);
    }

    function buildRailyard() {
        // Rail tracks - parallel lines with cross ties
        var trackMaterial = new THREE.MeshLambertMaterial({ color: colorMetalDull });

        // Main rails (long boxes)
        var rail1Geom = new THREE.BoxGeometry(1, 0.8, 200);
        var rail1 = new THREE.Mesh(rail1Geom, trackMaterial);
        rail1.position.set(-8, 0.4, -50);
        rail1.castShadow = true;
        rail1.receiveShadow = true;
        scene.add(rail1);
        objects.push(rail1);

        var rail2Geom = new THREE.BoxGeometry(1, 0.8, 200);
        var rail2 = new THREE.Mesh(rail2Geom, trackMaterial);
        rail2.position.set(8, 0.4, -50);
        rail2.castShadow = true;
        rail2.receiveShadow = true;
        scene.add(rail2);
        objects.push(rail2);

        // Rail ties (cylinder cross beams)
        for (var i = 0; i < 12; i++) {
            var tieGeom = new THREE.CylinderGeometry(0.4, 0.4, 17, 8);
            var tieMat = new THREE.MeshLambertMaterial({ color: colorDarkGray });
            var tie = new THREE.Mesh(tieGeom, tieMat);
            tie.position.set(0, 0.4, -100 + i * 18);
            tie.rotation.z = Math.PI / 2;
            tie.castShadow = true;
            tie.receiveShadow = true;
            scene.add(tie);
            objects.push(tie);
        }

        // Abandoned rail cars
        for (var i = 0; i < 3; i++) {
            var carBodyGeom = new THREE.BoxGeometry(8, 5, 12);
            var carBodyMat = new THREE.MeshLambertMaterial({ color: colorRustOrange });
            var carBody = new THREE.Mesh(carBodyGeom, carBodyMat);
            carBody.position.set(30 + i * 25, 2.5, -80 - i * 15);
            carBody.castShadow = true;
            carBody.receiveShadow = true;
            scene.add(carBody);
            objects.push(carBody);

            // Wheels for each car
            for (var j = 0; j < 4; j++) {
                var wheelGeom = new THREE.CylinderGeometry(1.2, 1.2, 1, 16);
                var wheelMat = new THREE.MeshLambertMaterial({ color: colorSootBlack });
                var wheel = new THREE.Mesh(wheelGeom, wheelMat);
                wheel.position.set(26 + i * 25 + j * 3, 1.2, -82 - i * 15);
                wheel.rotation.z = Math.PI / 2;
                wheel.castShadow = true;
                wheel.receiveShadow = true;
                scene.add(wheel);
                objects.push(wheel);
            }
        }
    }

    function buildWarehouses() {
        // Warehouse 1 - Main warehouse structure
        var warehouse1Geom = new THREE.BoxGeometry(50, 22, 45);
        var warehouse1Mat = new THREE.MeshLambertMaterial({ color: colorConcrete });
        var warehouse1 = new THREE.Mesh(warehouse1Geom, warehouse1Mat);
        warehouse1.position.set(-40, 11, -90);
        warehouse1.castShadow = true;
        warehouse1.receiveShadow = true;
        scene.add(warehouse1);
        objects.push(warehouse1);

        // Warehouse 1 - Collapsed sections (tilted boxes)
        for (var i = 0; i < 3; i++) {
            var collapseGeom = new THREE.BoxGeometry(15, 8, 10);
            var collapseMat = new THREE.MeshLambertMaterial({ color: colorDarkGray });
            var collapse = new THREE.Mesh(collapseGeom, collapseMat);
            collapse.position.set(-50 + i * 20, 12, -110);
            collapse.rotation.z = 0.3 - i * 0.1;
            collapse.castShadow = true;
            collapse.receiveShadow = true;
            scene.add(collapse);
            objects.push(collapse);
        }

        // Warehouse 2 - Secondary warehouse
        var warehouse2Geom = new THREE.BoxGeometry(40, 20, 35);
        var warehouse2Mat = new THREE.MeshLambertMaterial({ color: colorConcrete });
        var warehouse2 = new THREE.Mesh(warehouse2Geom, warehouse2Mat);
        warehouse2.position.set(45, 10, -110);
        warehouse2.castShadow = true;
        warehouse2.receiveShadow = true;
        scene.add(warehouse2);
        objects.push(warehouse2);

        // Warehouse 2 - Partially collapsed roof sections
        for (var i = 0; i < 2; i++) {
            var roofGeom = new THREE.BoxGeometry(18, 6, 14);
            var roofMat = new THREE.MeshLambertMaterial({ color: colorDarkGray });
            var roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.set(35 + i * 25, 15, -115);
            roof.rotation.x = 0.25;
            roof.castShadow = true;
            roof.receiveShadow = true;
            scene.add(roof);
            objects.push(roof);
        }

        // Sandbag fortifications on warehouse walls
        for (var i = 0; i < 5; i++) {
            var sandbagGeom = new THREE.BoxGeometry(3, 2, 2);
            var sandbagMat = new THREE.MeshLambertMaterial({ color: colorIndustrialGray });
            var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
            sandbag.position.set(-35 + i * 5, 18, -66);
            sandbag.castShadow = true;
            sandbag.receiveShadow = true;
            scene.add(sandbag);
            objects.push(sandbag);
        }

        // Additional military fortification stack
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 2; j++) {
                var fortGeom = new THREE.BoxGeometry(2.5, 2, 2.5);
                var fortMat = new THREE.MeshLambertMaterial({ color: colorIndustrialGray });
                var fort = new THREE.Mesh(fortGeom, fortMat);
                fort.position.set(55 + i * 3, 10 + j * 2, -100);
                fort.castShadow = true;
                fort.receiveShadow = true;
                scene.add(fort);
                objects.push(fort);
            }
        }
    }

    function buildDefenses() {
        // Military observation tower
        var towerGeom = new THREE.BoxGeometry(6, 30, 6);
        var towerMat = new THREE.MeshLambertMaterial({ color: colorIndustrialGray });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(80, 15, 50);
        tower.castShadow = true;
        tower.receiveShadow = true;
        scene.add(tower);
        objects.push(tower);

        // Guard post platforms (boxes on tower)
        for (var i = 0; i < 2; i++) {
            var platformGeom = new THREE.BoxGeometry(8, 2, 8);
            var platformMat = new THREE.MeshLambertMaterial({ color: colorDarkGray });
            var platform = new THREE.Mesh(platformGeom, platformMat);
            platform.position.set(80, 12 + i * 10, 50);
            platform.castShadow = true;
            platform.receiveShadow = true;
            scene.add(platform);
            objects.push(platform);
        }

        // Concrete barrier walls
        for (var i = 0; i < 4; i++) {
            var barrierGeom = new THREE.BoxGeometry(12, 3, 2);
            var barrierMat = new THREE.MeshLambertMaterial({ color: colorConcrete });
            var barrier = new THREE.Mesh(barrierGeom, barrierMat);
            barrier.position.set(-90 + i * 40, 1.5, 60);
            barrier.castShadow = true;
            barrier.receiveShadow = true;
            scene.add(barrier);
            objects.push(barrier);
        }
    }

    function buildCrane() {
        // Crane mast (vertical cylinder tower)
        var mastGeom = new THREE.CylinderGeometry(1.5, 2, 40, 10);
        var mastMat = new THREE.MeshLambertMaterial({ color: colorIndustrialGray });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-85, 20, -30);
        mast.castShadow = true;
        mast.receiveShadow = true;
        scene.add(mast);
        objects.push(mast);

        // Crane boom (horizontal box beam)
        var boomGeom = new THREE.BoxGeometry(35, 2, 2);
        var boomMat = new THREE.MeshLambertMaterial({ color: colorIndustrialGray });
        var boom = new THREE.Mesh(boomGeom, boomMat);
        boom.position.set(-67, 38, -30);
        boom.castShadow = true;
        boom.receiveShadow = true;
        scene.add(boom);
        objects.push(boom);

        // Crane pulley wheel (rotating sphere)
        var wheelGeom = new THREE.SphereGeometry(1.8, 12, 12);
        var wheelMat = new THREE.MeshLambertMaterial({ color: colorMetalDull });
        craneWheel = new THREE.Mesh(wheelGeom, wheelMat);
        craneWheel.position.set(-50, 36, -30);
        craneWheel.castShadow = true;
        craneWheel.receiveShadow = true;
        scene.add(craneWheel);
        objects.push(craneWheel);
    }

    function buildWaterTower() {
        // Tank cylinder
        var tankGeom = new THREE.CylinderGeometry(6, 6, 10, 14);
        var tankMat = new THREE.MeshLambertMaterial({ color: colorRustOrange });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(75, 20, 20);
        tank.castShadow = true;
        tank.receiveShadow = true;
        scene.add(tank);
        objects.push(tank);

        // Support legs (cylinders)
        for (var i = 0; i < 4; i++) {
            var legGeom = new THREE.CylinderGeometry(1, 1.2, 18, 8);
            var legMat = new THREE.MeshLambertMaterial({ color: colorIndustrialGray });
            var leg = new THREE.Mesh(legGeom, legMat);
            var angle = (Math.PI / 2) * i;
            leg.position.set(75 + Math.cos(angle) * 5, 9, 20 + Math.sin(angle) * 5);
            leg.castShadow = true;
            leg.receiveShadow = true;
            scene.add(leg);
            objects.push(leg);
        }
    }

    function buildOverpass() {
        // Overpass deck (horizontal box spanning the scene)
        var deckGeom = new THREE.BoxGeometry(120, 3, 15);
        var deckMat = new THREE.MeshLambertMaterial({ color: colorConcrete });
        var deck = new THREE.Mesh(deckGeom, deckMat);
        deck.position.set(0, 22, 40);
        deck.castShadow = true;
        deck.receiveShadow = true;
        scene.add(deck);
        objects.push(deck);

        // Overpass support piers (cylinders)
        for (var i = 0; i < 3; i++) {
            var pierGeom = new THREE.CylinderGeometry(3, 3.5, 20, 12);
            var pierMat = new THREE.MeshLambertMaterial({ color: colorConcrete });
            var pier = new THREE.Mesh(pierGeom, pierMat);
            pier.position.set(-40 + i * 40, 10, 40);
            pier.castShadow = true;
            pier.receiveShadow = true;
            scene.add(pier);
            objects.push(pier);
        }
    }

    function buildEnvironment() {
        // Ground plane (large box as base)
        var groundGeom = new THREE.BoxGeometry(200, 1, 200);
        var groundMat = new THREE.MeshLambertMaterial({ color: colorSootBlack });
        var ground = new THREE.Mesh(groundGeom, groundMat);
        ground.position.set(0, -0.5, 0);
        ground.receiveShadow = true;
        scene.add(ground);
        objects.push(ground);

        // Atmospheric debris cones (scattered)
        for (var i = 0; i < 8; i++) {
            var debrisGeom = new THREE.ConeGeometry(1.5, 3, 8);
            var debrisMat = new THREE.MeshLambertMaterial({ color: colorDarkGray });
            var debris = new THREE.Mesh(debrisGeom, debrisMat);
            debris.position.set(-80 + Math.random() * 160, 1.5, -80 + Math.random() * 160);
            debris.rotation.y = Math.random() * Math.PI;
            debris.castShadow = true;
            debris.receiveShadow = true;
            scene.add(debris);
            objects.push(debris);
        }
    }

    function setupLighting() {
        // Ambient light for overall scene illumination
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (sun-like)
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(100, 80, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -150;
        dirLight.shadow.camera.right = 150;
        dirLight.shadow.camera.top = 150;
        dirLight.shadow.camera.bottom = -150;
        scene.add(dirLight);
        lights.push(dirLight);

        // Point light - factory spotlight effect
        var pointLight1 = new THREE.PointLight(colorRustOrange, 0.4, 80);
        pointLight1.position.set(-50, 30, 0);
        pointLight1.castShadow = true;
        scene.add(pointLight1);
        lights.push(pointLight1);

        // Point light - warehouse area
        var pointLight2 = new THREE.PointLight(0x888888, 0.3, 70);
        pointLight2.position.set(-40, 20, -90);
        pointLight2.castShadow = true;
        scene.add(pointLight2);
        lights.push(pointLight2);

        // Point light - tower area
        var pointLight3 = new THREE.PointLight(0x999999, 0.35, 60);
        pointLight3.position.set(80, 25, 50);
        pointLight3.castShadow = true;
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    function animateSteam() {
        if (steamStack) {
            // Simple upward bobbing motion for steam effect
            steamStack.position.y += Math.sin(Date.now() * 0.001) * 0.15;
        }
    }

    function animateCrane() {
        if (craneWheel) {
            craneWheel.rotation.y += 0.03;
            craneWheel.rotation.x += 0.02;
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];

        buildFactories();
        buildRustedMachinery();
        buildRailyard();
        buildWarehouses();
        buildDefenses();
        buildCrane();
        buildWaterTower();
        buildOverpass();
        buildEnvironment();
        setupLighting();
    }

    function update(delta) {
        animateCrane();
        animateSteam();
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
        craneWheel = null;
        steamStack = null;
        steamCloud = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
