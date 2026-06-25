window.SumpBase = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildBase();
    }

    function buildBase() {
        // Flooded basement bunker with low box rooms
        var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var floorGeometry = new THREE.BoxGeometry(80, 2, 80);
        var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -5;
        scene.add(floor);
        objects.push(floor);

        // Massive industrial sump pump columns (cylinder bodies)
        var pumpMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var pumpGeometry = new THREE.CylinderGeometry(4, 4, 20, 16);

        var pump1 = new THREE.Mesh(pumpGeometry, pumpMaterial);
        pump1.position.set(-20, 0, -15);
        scene.add(pump1);
        objects.push(pump1);

        var pump2 = new THREE.Mesh(pumpGeometry, pumpMaterial);
        pump2.position.set(0, 0, -20);
        scene.add(pump2);
        objects.push(pump2);

        var pump3 = new THREE.Mesh(pumpGeometry, pumpMaterial);
        pump3.position.set(20, 0, -10);
        scene.add(pump3);
        objects.push(pump3);

        // Pump housings (box geometries around cylinders)
        var housingMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var housingGeometry = new THREE.BoxGeometry(10, 22, 10);

        var housing1 = new THREE.Mesh(housingGeometry, housingMaterial);
        housing1.position.set(-20, 0, -15);
        scene.add(housing1);
        objects.push(housing1);

        var housing2 = new THREE.Mesh(housingGeometry, housingMaterial);
        housing2.position.set(0, 0, -20);
        scene.add(housing2);
        objects.push(housing2);

        // Waterlogged ammunition lockers (stacked boxes half-submerged)
        var lockerMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var lockerGeometry = new THREE.BoxGeometry(8, 8, 8);

        var locker1 = new THREE.Mesh(lockerGeometry, lockerMaterial);
        locker1.position.set(-25, -2, 10);
        scene.add(locker1);
        objects.push(locker1);

        var locker2 = new THREE.Mesh(lockerGeometry, lockerMaterial);
        locker2.position.set(-25, 6, 10);
        scene.add(locker2);
        objects.push(locker2);

        var locker3 = new THREE.Mesh(lockerGeometry, lockerMaterial);
        locker3.position.set(-17, -2, 10);
        scene.add(locker3);
        objects.push(locker3);

        var locker4 = new THREE.Mesh(lockerGeometry, lockerMaterial);
        locker4.position.set(-17, 6, 10);
        scene.add(locker4);
        objects.push(locker4);

        // Emergency generator arrays (box generators with cylinder exhaust pipes)
        var generatorMaterial = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
        var generatorGeometry = new THREE.BoxGeometry(12, 10, 12);

        var generator1 = new THREE.Mesh(generatorGeometry, generatorMaterial);
        generator1.position.set(15, 0, 20);
        scene.add(generator1);
        objects.push(generator1);

        var generator2 = new THREE.Mesh(generatorGeometry, generatorMaterial);
        generator2.position.set(30, 0, 20);
        scene.add(generator2);
        objects.push(generator2);

        // Exhaust pipes (cylinder geometries)
        var exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var exhaustGeometry = new THREE.CylinderGeometry(2, 2, 15, 8);

        var exhaust1 = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust1.position.set(15, 8, 20);
        scene.add(exhaust1);
        objects.push(exhaust1);

        var exhaust2 = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust2.position.set(30, 8, 20);
        scene.add(exhaust2);
        objects.push(exhaust2);

        // Escape ladder shafts (cylinder shafts)
        var shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var shaftGeometry = new THREE.CylinderGeometry(3, 3, 30, 12);

        var shaft1 = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft1.position.set(-30, 5, 0);
        scene.add(shaft1);
        objects.push(shaft1);

        var shaft2 = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft2.position.set(30, 5, -25);
        scene.add(shaft2);
        objects.push(shaft2);

        // Ladder rungs (LineSegments)
        var rungMaterial = new THREE.LineBasicMaterial({ color: 0xffaa00 });
        var rungGeometry = new THREE.BufferGeometry();
        var rungPositions = new Float32Array([
            -32, 0, 0,  -28, 0, 0,
            -32, 3, 0,  -28, 3, 0,
            -32, 6, 0,  -28, 6, 0,
            -32, 9, 0,  -28, 9, 0,
            -32, 12, 0, -28, 12, 0,
            -32, 15, 0, -28, 15, 0,
            -32, 18, 0, -28, 18, 0
        ]);
        rungGeometry.setAttribute('position', new THREE.BufferAttribute(rungPositions, 3));
        var rungs1 = new THREE.LineSegments(rungGeometry, rungMaterial);
        scene.add(rungs1);
        objects.push(rungs1);

        var rung2Geometry = new THREE.BufferGeometry();
        var rung2Positions = new Float32Array([
            28, 0, -25,  32, 0, -25,
            28, 3, -25,  32, 3, -25,
            28, 6, -25,  32, 6, -25,
            28, 9, -25,  32, 9, -25,
            28, 12, -25, 32, 12, -25,
            28, 15, -25, 32, 15, -25,
            28, 18, -25, 32, 18, -25
        ]);
        rung2Geometry.setAttribute('position', new THREE.BufferAttribute(rung2Positions, 3));
        var rungs2 = new THREE.LineSegments(rung2Geometry, rungMaterial);
        scene.add(rungs2);
        objects.push(rungs2);

        // Wall fixtures (spheres and cones for atmospheric detail)
        var fixtureMatGray = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var fixtureMatRust = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

        var fixture1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), fixtureMatGray);
        fixture1.position.set(-30, 10, -30);
        scene.add(fixture1);
        objects.push(fixture1);

        var fixture2 = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 8), fixtureMatRust);
        fixture2.position.set(25, 15, 25);
        scene.add(fixture2);
        objects.push(fixture2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0xffaa00, 0.8, 60);
        pointLight.position.set(0, 15, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Animate pump cylinders rotation
        if (objects.length > 0) {
            for (var i = 0; i < Math.min(3, objects.length); i++) {
                if (objects[i] && objects[i].rotation) {
                    objects[i].rotation.y += delta * 0.5;
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
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
