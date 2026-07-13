window.IronWall = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animationState = {};

    function createMainWallSegment(x, z, length, height, thickness) {
        var geometry = new THREE.BoxGeometry(length, height, thickness);
        var material = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, height / 2, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
        objects.push(wall);
        return wall;
    }

    function createMachineGunEmplacement(x, z) {
        var platformGeometry = new THREE.BoxGeometry(3, 0.5, 3);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(x, 5, z);
        platform.castShadow = true;
        scene.add(platform);
        objects.push(platform);

        var barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 12);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(x, 5.8, z);
        barrel.rotation.z = Math.PI / 6;
        barrel.castShadow = true;
        scene.add(barrel);
        objects.push(barrel);

        var supportGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var support = new THREE.Mesh(supportGeometry, supportMaterial);
        support.position.set(x, 4.2, z);
        support.castShadow = true;
        scene.add(support);
        objects.push(support);

        return { platform: platform, barrel: barrel, support: support };
    }

    function createGuardTower(x, z) {
        var towerGeometry = new THREE.BoxGeometry(2.5, 8, 2.5);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(x, 4, z);
        tower.castShadow = true;
        tower.receiveShadow = true;
        scene.add(tower);
        objects.push(tower);

        var searchlightGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        var searchlightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var searchlight = new THREE.Mesh(searchlightGeometry, searchlightMaterial);
        searchlight.position.set(x, 8.5, z);
        searchlight.castShadow = true;
        scene.add(searchlight);
        objects.push(searchlight);
        animationState.searchlight = searchlight;

        var reflectorGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
        var reflectorMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var reflector = new THREE.Mesh(reflectorGeometry, reflectorMaterial);
        reflector.position.set(x, 8.35, z);
        reflector.castShadow = true;
        scene.add(reflector);
        objects.push(reflector);

        return { tower: tower, searchlight: searchlight, reflector: reflector };
    }

    function createMinfieldMarker(x, z) {
        var warningPostGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        var warningPostMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var warningPost = new THREE.Mesh(warningPostGeometry, warningPostMaterial);
        warningPost.position.set(x, 0.6, z);
        warningPost.castShadow = true;
        scene.add(warningPost);
        objects.push(warningPost);

        for (var i = 0; i < 4; i++) {
            var sphereGeometry = new THREE.SphereGeometry(0.25, 8, 8);
            var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
            var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(x + Math.cos(i * Math.PI / 2) * 0.6, 0.3, z + Math.sin(i * Math.PI / 2) * 0.6);
            sphere.castShadow = true;
            scene.add(sphere);
            objects.push(sphere);
        }

        return warningPost;
    }

    function createTankTrap(x, z) {
        for (var i = 0; i < 5; i++) {
            var coneGeometry = new THREE.ConeGeometry(0.4, 0.8, 6);
            var coneMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
            var cone = new THREE.Mesh(coneGeometry, coneMaterial);
            cone.position.set(x + (i - 2) * 0.5, 0.4, z);
            cone.castShadow = true;
            scene.add(cone);
            objects.push(cone);
        }
    }

    function createRazorWireCoil(x, z) {
        var points = [];
        for (var i = 0; i < 32; i++) {
            var angle = (i / 32) * Math.PI * 4;
            var radius = 0.8;
            var px = x + Math.cos(angle) * radius;
            var pz = z + Math.sin(angle) * radius;
            var py = 0.4 + (i / 32) * 1.2;
            points.push(new THREE.Vector3(px, py, pz));
        }
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var material = new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 2 });
        var coil = new THREE.LineSegments(geometry, material);
        scene.add(coil);
        objects.push(coil);
        return coil;
    }

    function createArtilleryBunker(x, z) {
        var bunkerGeometry = new THREE.BoxGeometry(4, 2, 3.5);
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
        bunker.position.set(x, 1, z);
        bunker.castShadow = true;
        bunker.receiveShadow = true;
        scene.add(bunker);
        objects.push(bunker);

        var roofGeometry = new THREE.BoxGeometry(4.2, 0.6, 3.7);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, 2.3, z);
        roof.castShadow = true;
        scene.add(roof);
        objects.push(roof);

        var gunPortGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.3);
        var gunPortMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var gunPort = new THREE.Mesh(gunPortGeometry, gunPortMaterial);
        gunPort.position.set(x + 1.8, 1.2, z - 1.9);
        gunPort.castShadow = true;
        scene.add(gunPort);
        objects.push(gunPort);

        return { bunker: bunker, roof: roof, gunPort: gunPort };
    }

    function createUndergroundHatch(x, z) {
        var hatchGeometry = new THREE.BoxGeometry(1.8, 0.3, 1.8);
        var hatchMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
        hatch.position.set(x, 0.15, z);
        hatch.rotation.y = Math.PI / 4;
        hatch.castShadow = true;
        scene.add(hatch);
        objects.push(hatch);

        var shaftGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        var shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.set(x, -1.5, z);
        shaft.castShadow = true;
        scene.add(shaft);
        objects.push(shaft);

        return { hatch: hatch, shaft: shaft };
    }

    function createAntennaArray(x, z) {
        var baseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, 0.15, z);
        base.castShadow = true;
        scene.add(base);
        objects.push(base);

        for (var i = 0; i < 6; i++) {
            var rodGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 6);
            var rodMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var rod = new THREE.Mesh(rodGeometry, rodMaterial);
            rod.position.set(x + Math.cos(i * Math.PI / 3) * 0.5, 1.15, z + Math.sin(i * Math.PI / 3) * 0.5);
            rod.castShadow = true;
            scene.add(rod);
            objects.push(rod);
        }

        var dishGeometry = new THREE.SphereGeometry(0.6, 12, 8);
        var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var dish = new THREE.Mesh(dishGeometry, dishMaterial);
        dish.position.set(x, 2.5, z);
        dish.scale.z = 0.3;
        dish.castShadow = true;
        scene.add(dish);
        objects.push(dish);
        animationState.radarDish = dish;

        return { base: base, dish: dish };
    }

    function createAmmunitionBunker(x, z) {
        var storageGeometry = new THREE.BoxGeometry(3, 2.5, 2.5);
        var storageMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var storage = new THREE.Mesh(storageGeometry, storageMaterial);
        storage.position.set(x, 1.25, z);
        storage.castShadow = true;
        storage.receiveShadow = true;
        scene.add(storage);
        objects.push(storage);

        for (var i = 0; i < 2; i++) {
            var doorGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.1);
            var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(x - 1.2 + i * 2.4, 1.5, z - 1.3);
            door.castShadow = true;
            scene.add(door);
            objects.push(door);
        }

        return storage;
    }

    function createBlastShield(x, z) {
        var shieldGeometry = new THREE.BoxGeometry(2, 2, 0.4);
        var shieldMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.set(x, 1, z);
        shield.rotation.z = Math.PI / 6;
        shield.castShadow = true;
        shield.receiveShadow = true;
        scene.add(shield);
        objects.push(shield);
        return shield;
    }

    function buildWallPerimeter() {
        createMainWallSegment(0, -30, 60, 6, 2);
        createMainWallSegment(0, 30, 60, 6, 2);
        createMainWallSegment(-30, 0, 60, 6, 2);
        createMainWallSegment(30, 0, 60, 6, 2);
    }

    function buildGunEmplacements() {
        createMachineGunEmplacement(-20, -28);
        createMachineGunEmplacement(-10, -28);
        createMachineGunEmplacement(0, -28);
        createMachineGunEmplacement(10, -28);
        createMachineGunEmplacement(20, -28);
        createMachineGunEmplacement(-20, 28);
        createMachineGunEmplacement(-10, 28);
        createMachineGunEmplacement(0, 28);
        createMachineGunEmplacement(10, 28);
        createMachineGunEmplacement(20, 28);
        createMachineGunEmplacement(-28, -20);
        createMachineGunEmplacement(-28, -10);
        createMachineGunEmplacement(-28, 0);
        createMachineGunEmplacement(-28, 10);
        createMachineGunEmplacement(-28, 20);
        createMachineGunEmplacement(28, -20);
        createMachineGunEmplacement(28, -10);
        createMachineGunEmplacement(28, 0);
        createMachineGunEmplacement(28, 10);
        createMachineGunEmplacement(28, 20);
    }

    function buildGuardTowers() {
        createGuardTower(-25, -25);
        createGuardTower(0, -25);
        createGuardTower(25, -25);
        createGuardTower(-25, 0);
        createGuardTower(25, 0);
        createGuardTower(-25, 25);
        createGuardTower(0, 25);
        createGuardTower(25, 25);
    }

    function buildMinefields() {
        for (var i = -3; i <= 3; i++) {
            for (var j = -3; j <= 3; j++) {
                createMinfieldMarker(-35 + i * 4, -35 + j * 4);
            }
        }
        for (var i = -3; i <= 3; i++) {
            for (var j = -3; j <= 3; j++) {
                createMinfieldMarker(35 - i * 4, -35 + j * 4);
            }
        }
    }

    function buildTankTraps() {
        for (var i = -2; i <= 2; i++) {
            createTankTrap(-32, -15 + i * 6);
            createTankTrap(32, -15 + i * 6);
            createTankTrap(-15 + i * 6, -32);
            createTankTrap(-15 + i * 6, 32);
        }
    }

    function buildRazorWire() {
        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var radius = 38;
            var px = Math.cos(angle) * radius;
            var pz = Math.sin(angle) * radius;
            createRazorWireCoil(px, pz);
        }
    }

    function buildArtilleryBunkers() {
        createArtilleryBunker(-20, -20);
        createArtilleryBunker(20, -20);
        createArtilleryBunker(-20, 20);
        createArtilleryBunker(20, 20);
    }

    function buildHatches() {
        createUndergroundHatch(-10, -10);
        createUndergroundHatch(10, -10);
        createUndergroundHatch(-10, 10);
        createUndergroundHatch(10, 10);
    }

    function buildAntennas() {
        createAntennaArray(0, 0);
    }

    function buildAmmoBunkers() {
        createAmmunitionBunker(-15, 0);
        createAmmunitionBunker(15, 0);
        createAmmunitionBunker(0, -15);
        createAmmunitionBunker(0, 15);
    }

    function buildBlastShields() {
        createBlastShield(-5, -28);
        createBlastShield(5, -28);
        createBlastShield(-28, -5);
        createBlastShield(-28, 5);
        createBlastShield(5, 28);
        createBlastShield(-5, 28);
        createBlastShield(28, -5);
        createBlastShield(28, 5);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var spotLight = new THREE.SpotLight(0xffff00, 1, 100, Math.PI / 4, 0.8, 2);
        spotLight.position.set(0, 12, 0);
        spotLight.castShadow = true;
        scene.add(spotLight);
        lights.push(spotLight);
        animationState.spotLight = spotLight;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animationState = {};

        buildWallPerimeter();
        buildGunEmplacements();
        buildGuardTowers();
        buildMinefields();
        buildTankTraps();
        buildRazorWire();
        buildArtilleryBunkers();
        buildHatches();
        buildAntennas();
        buildAmmoBunkers();
        buildBlastShields();
        setupLighting();
    }

    function update(delta) {
        if (animationState.searchlight) {
            animationState.searchlight.rotation.y += delta * 1.5;
        }
        if (animationState.radarDish) {
            animationState.radarDish.rotation.y += delta * 2.0;
        }
        if (animationState.spotLight) {
            animationState.spotLight.position.x = Math.sin(Date.now() * 0.001) * 40;
            animationState.spotLight.position.z = Math.cos(Date.now() * 0.001) * 40;
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
        animationState = {};
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
