window.RockLab = (function() {
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
        buildLab();
    }

    function buildLab() {
        // Rock walls and structure
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
        var wall1 = new THREE.Mesh(new THREE.BoxGeometry(80, 40, 10), wallMat);
        wall1.position.set(0, 0, -35);
        scene.add(wall1);
        objects.push(wall1);

        var wall2 = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 70), wallMat);
        wall2.position.set(-35, 0, 0);
        scene.add(wall2);
        objects.push(wall2);

        // Ceiling support columns
        var colMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var col1 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 35, 8), colMat);
        col1.position.set(-20, 2.5, -20);
        scene.add(col1);
        objects.push(col1);

        var col2 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 35, 8), colMat);
        col2.position.set(15, 2.5, 10);
        scene.add(col2);
        objects.push(col2);

        var col3 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 35, 8), colMat);
        col3.position.set(5, 2.5, -25);
        scene.add(col3);
        objects.push(col3);

        // Sample tables with cylindrical legs
        var tableMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var tableTop1 = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 15), tableMat);
        tableTop1.position.set(-20, 10, 5);
        scene.add(tableTop1);
        objects.push(tableTop1);

        var tableLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 6), colMat);
        tableLeg1.position.set(-25, 6, 0);
        scene.add(tableLeg1);
        objects.push(tableLeg1);

        var tableLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 6), colMat);
        tableLeg2.position.set(-15, 6, 10);
        scene.add(tableLeg2);
        objects.push(tableLeg2);

        // Sample table 2
        var tableTop2 = new THREE.Mesh(new THREE.BoxGeometry(18, 2, 12), tableMat);
        tableTop2.position.set(18, 11, 18);
        scene.add(tableTop2);
        objects.push(tableTop2);

        var tableLeg3 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 9, 6), colMat);
        tableLeg3.position.set(12, 6.5, 15);
        scene.add(tableLeg3);
        objects.push(tableLeg3);

        var tableLeg4 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 9, 6), colMat);
        tableLeg4.position.set(24, 6.5, 21);
        scene.add(tableLeg4);
        objects.push(tableLeg4);

        // Drilling rig with cone drill bit
        var rigMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var rigBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 2, 12), rigMat);
        rigBase.position.set(-8, 1, -15);
        scene.add(rigBase);
        objects.push(rigBase);

        var rigPole = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 25, 8), rigMat);
        rigPole.position.set(-8, 13, -15);
        scene.add(rigPole);
        objects.push(rigPole);

        var drillBit = new THREE.Mesh(new THREE.ConeGeometry(2.5, 8, 8), new THREE.MeshLambertMaterial({ color: 0xFFD700 }));
        drillBit.position.set(-8, 2, -15);
        scene.add(drillBit);
        objects.push(drillBit);

        // Crystal specimen display spheres
        var crystalMat1 = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
        var crystal1 = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), crystalMat1);
        crystal1.position.set(25, 15, -8);
        scene.add(crystal1);
        objects.push(crystal1);

        var crystalMat2 = new THREE.MeshLambertMaterial({ color: 0x00CED1 });
        var crystal2 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 32, 32), crystalMat2);
        crystal2.position.set(30, 12, 12);
        scene.add(crystal2);
        objects.push(crystal2);

        var crystalMat3 = new THREE.MeshLambertMaterial({ color: 0x9370DB });
        var crystal3 = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), crystalMat3);
        crystal3.position.set(-30, 14, 8);
        scene.add(crystal3);
        objects.push(crystal3);

        // Analysis equipment - cylindrical tanks
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var tank1 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 12, 16), tankMat);
        tank1.position.set(10, 8, 25);
        scene.add(tank1);
        objects.push(tank1);

        var tank2 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 10, 16), new THREE.MeshLambertMaterial({ color: 0x228B22 }));
        tank2.position.set(-15, 8, 20);
        scene.add(tank2);
        objects.push(tank2);

        // Ground/floor
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var floor = new THREE.Mesh(new THREE.BoxGeometry(100, 1, 100), floorMat);
        floor.position.set(0, -0.5, 0);
        scene.add(floor);
        objects.push(floor);

        // Lighting
        var ambLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(20, 30, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Rotate crystals slowly
        if (objects.length > 16) {
            objects[16].rotation.y += 0.3 * delta;
            objects[17].rotation.z += 0.2 * delta;
            objects[18].rotation.x += 0.25 * delta;
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
