window.IronWharf = (function() {
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
        buildWharf();
    }

    function buildWharf() {
        // Blast furnace tower - tall cylinder with cone top
        var furnaceGeometry = new THREE.CylinderGeometry(6, 8, 25, 16);
        var furnaceMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var furnace = new THREE.Mesh(furnaceGeometry, furnaceMaterial);
        furnace.position.set(-25, 12.5, -20);
        scene.add(furnace);
        objects.push(furnace);

        // Furnace top cone
        var coneGeometry = new THREE.ConeGeometry(6, 8, 16);
        var coneMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(-25, 29, -20);
        scene.add(cone);
        objects.push(cone);

        // Iron ingot stack 1 - stacked boxes
        var ingotGeometry = new THREE.BoxGeometry(3, 2, 4);
        var ingotMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        for (var i = 0; i < 5; i++) {
            var ingot = new THREE.Mesh(ingotGeometry, ingotMaterial);
            ingot.position.set(10, 1 + i * 2, -15);
            scene.add(ingot);
            objects.push(ingot);
        }

        // Iron ingot stack 2 - offset position
        for (var i = 0; i < 4; i++) {
            var ingot2 = new THREE.Mesh(ingotGeometry, ingotMaterial);
            ingot2.position.set(15, 1 + i * 2, -22);
            scene.add(ingot2);
            objects.push(ingot2);
        }

        // Cooling water tank - large cylinder
        var tankGeometry = new THREE.CylinderGeometry(5, 5, 12, 12);
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x5a6a7a });
        var tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.set(20, 6, 15);
        scene.add(tank);
        objects.push(tank);

        // Cargo ship hull - large box
        var hullGeometry = new THREE.BoxGeometry(15, 8, 30);
        var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        var hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.set(-5, 4, 25);
        scene.add(hull);
        objects.push(hull);

        // Ship cabin superstructure
        var cabinGeometry = new THREE.BoxGeometry(8, 10, 8);
        var cabinMaterial = new THREE.MeshLambertMaterial({ color: 0xa52a2a });
        var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(-5, 13, 30);
        scene.add(cabin);
        objects.push(cabin);

        // Loading crane base - tall cylinder
        var craneBaseGeometry = new THREE.CylinderGeometry(1.5, 2, 20, 8);
        var craneBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var craneBase = new THREE.Mesh(craneBaseGeometry, craneBaseMaterial);
        craneBase.position.set(-18, 10, 10);
        scene.add(craneBase);
        objects.push(craneBase);

        // Crane arm boom - long cylinder angled
        var boomGeometry = new THREE.CylinderGeometry(0.8, 0.8, 22, 8);
        var boomMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var boom = new THREE.Mesh(boomGeometry, boomMaterial);
        boom.position.set(-8, 22, 8);
        boom.rotation.z = Math.PI / 6;
        scene.add(boom);
        objects.push(boom);

        // Metallic storage spheres for ore
        var sphereGeometry = new THREE.SphereGeometry(3, 16, 16);
        var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x6a5aaa });
        var sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere1.position.set(8, 3, 5);
        scene.add(sphere1);
        objects.push(sphere1);

        var sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere2.position.set(15, 3, 8);
        scene.add(sphere2);
        objects.push(sphere2);

        // Rusted support pillars
        var pillarGeometry = new THREE.CylinderGeometry(2, 2, 18, 8);
        var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar1.position.set(-30, 9, 0);
        scene.add(pillar1);
        objects.push(pillar1);

        var pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar2.position.set(30, 9, 0);
        scene.add(pillar2);
        objects.push(pillar2);

        // Storage platform - flat tall box
        var platformGeometry = new THREE.BoxGeometry(12, 1, 14);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x545454 });
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(-15, 16, -28);
        scene.add(platform);
        objects.push(platform);

        // Metal framework - thin box frames
        var frameGeometry = new THREE.BoxGeometry(1, 20, 1);
        var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var frame1 = new THREE.Mesh(frameGeometry, frameMaterial);
        frame1.position.set(25, 10, -25);
        scene.add(frame1);
        objects.push(frame1);

        var frame2 = new THREE.Mesh(frameGeometry, frameMaterial);
        frame2.position.set(28, 10, -18);
        scene.add(frame2);
        objects.push(frame2);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for harsh industrial feel
        var dirLight = new THREE.DirectionalLight(0xffffcc, 0.8);
        dirLight.position.set(20, 30, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate loading crane rotation
        if (objects.length > 8) {
            objects[8].rotation.y += 0.0005;
        }
        // Slight rotation on storage spheres
        if (objects.length > 10) {
            objects[9].rotation.x += 0.0003;
            objects[10].rotation.z += 0.0002;
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
