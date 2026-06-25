window.RiftCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        // Main lava rift crack - deep glowing orange trench
        var riftGeometry = new THREE.BoxGeometry(80, 40, 8);
        var riftMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var rift = new THREE.Mesh(riftGeometry, riftMaterial);
        rift.position.set(0, -20, 0);
        scene.add(rift);
        objects.push(rift);

        // Volcanic rock fortification walls - dark jagged stacked boxes
        var rockColor = 0x2a2a2a;
        var rockMaterial = new THREE.MeshLambertMaterial({ color: rockColor });

        // Left fortress wall stack
        var wall1 = new THREE.Mesh(new THREE.BoxGeometry(6, 12, 24), rockMaterial);
        wall1.position.set(-25, 0, -15);
        scene.add(wall1);
        objects.push(wall1);

        var wall2 = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 20), rockMaterial);
        wall2.position.set(-25, 8, 5);
        scene.add(wall2);
        objects.push(wall2);

        // Right fortress wall stack
        var wall3 = new THREE.Mesh(new THREE.BoxGeometry(6, 12, 24), rockMaterial);
        wall3.position.set(25, 0, -15);
        scene.add(wall3);
        objects.push(wall3);

        var wall4 = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 20), rockMaterial);
        wall4.position.set(25, 8, 5);
        scene.add(wall4);
        objects.push(wall4);

        // Central defensive wall
        var wallCenter = new THREE.Mesh(new THREE.BoxGeometry(50, 8, 4), rockMaterial);
        wallCenter.position.set(0, 5, 20);
        scene.add(wallCenter);
        objects.push(wallCenter);

        // Thermal vent power extractors - cylinder pipes with sphere bubble tops
        // Extractor 1
        var pipeGeometry = new THREE.CylinderGeometry(3, 3, 20, 16);
        var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe1.position.set(-15, 5, -20);
        scene.add(pipe1);
        objects.push(pipe1);

        var bubbleGeometry = new THREE.SphereGeometry(5, 12, 12);
        var bubbleMaterial = new THREE.MeshLambertMaterial({ color: 0xff9933 });
        var bubble1 = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble1.position.set(-15, 20, -20);
        scene.add(bubble1);
        objects.push(bubble1);

        // Extractor 2
        var pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe2.position.set(0, 5, -25);
        scene.add(pipe2);
        objects.push(pipe2);

        var bubble2 = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble2.position.set(0, 20, -25);
        scene.add(bubble2);
        objects.push(bubble2);

        // Extractor 3
        var pipe3 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe3.position.set(15, 5, -20);
        scene.add(pipe3);
        objects.push(pipe3);

        var bubble3 = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble3.position.set(15, 20, -20);
        scene.add(bubble3);
        objects.push(bubble3);

        // Obsidian weapon storage bunker - dark conical structure
        var bunkerConeGeometry = new THREE.ConeGeometry(8, 18, 12);
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var bunker = new THREE.Mesh(bunkerConeGeometry, bunkerMaterial);
        bunker.position.set(0, 8, 25);
        scene.add(bunker);
        objects.push(bunker);

        // Bunker base box foundation
        var bunkerBase = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 16), bunkerMaterial);
        bunkerBase.position.set(0, 1, 25);
        scene.add(bunkerBase);
        objects.push(bunkerBase);

        // Magma-cooled defensive walls - reddish cooling structures
        var cooledMaterial = new THREE.MeshLambertMaterial({ color: 0x8b3a3a });
        var cooledWall1 = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 20), cooledMaterial);
        cooledWall1.position.set(-20, 3, 10);
        scene.add(cooledWall1);
        objects.push(cooledWall1);

        var cooledWall2 = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 20), cooledMaterial);
        cooledWall2.position.set(20, 3, 10);
        scene.add(cooledWall2);
        objects.push(cooledWall2);

        // Additional volcanic rock formation - accent pieces
        var rockAccent = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), rockMaterial);
        rockAccent.position.set(-30, 2, 0);
        scene.add(rockAccent);
        objects.push(rockAccent);

        var rockAccent2 = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), rockMaterial);
        rockAccent2.position.set(30, 2, 0);
        scene.add(rockAccent2);
        objects.push(rockAccent2);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var riftGlow = new THREE.PointLight(0xff6600, 1.5, 80);
        riftGlow.position.set(0, 0, 0);
        scene.add(riftGlow);
        lights.push(riftGlow);
    }

    function update(delta) {
        // Pulse the rift glow
        if (lights.length > 1) {
            var pulse = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
            lights[1].intensity = pulse;
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
