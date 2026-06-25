window.CorrieBase = (function() {
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
        // Bowl-shaped glacial cirque box walls on three sides
        var cirqueBackWall = new THREE.Mesh(
            new THREE.BoxGeometry(80, 60, 10),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        cirqueBackWall.position.set(0, 30, -35);
        scene.add(cirqueBackWall);
        objects.push(cirqueBackWall);

        var cirqueLeftWall = new THREE.Mesh(
            new THREE.BoxGeometry(10, 60, 50),
            new THREE.MeshLambertMaterial({ color: 0x9B8B75 })
        );
        cirqueLeftWall.position.set(-40, 30, -10);
        scene.add(cirqueLeftWall);
        objects.push(cirqueLeftWall);

        var cirqueRightWall = new THREE.Mesh(
            new THREE.BoxGeometry(10, 60, 50),
            new THREE.MeshLambertMaterial({ color: 0x9B8B75 })
        );
        cirqueRightWall.position.set(40, 30, -10);
        scene.add(cirqueRightWall);
        objects.push(cirqueRightWall);

        // Scree slope field - many small sphere boulders at base
        for (var i = 0; i < 12; i++) {
            var boulder = new THREE.Mesh(
                new THREE.SphereGeometry(2 + Math.random() * 3, 8, 8),
                new THREE.MeshLambertMaterial({ color: 0x6B5A47 })
            );
            boulder.position.set(
                -30 + Math.random() * 60,
                2 + Math.random() * 4,
                -20 + Math.random() * 30
            );
            scene.add(boulder);
            objects.push(boulder);
        }

        // Alpine lake frozen surface - box ice platform
        var icePlatform = new THREE.Mesh(
            new THREE.BoxGeometry(50, 1, 30),
            new THREE.MeshLambertMaterial({ color: 0xE0F0FF })
        );
        icePlatform.position.set(0, 0, 15);
        scene.add(icePlatform);
        objects.push(icePlatform);

        // Glacial melt stream supply - cylinder pipe
        var streamPipe = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 25, 16),
            new THREE.MeshLambertMaterial({ color: 0x4A90E2 })
        );
        streamPipe.position.set(-25, 18, -25);
        streamPipe.rotation.z = Math.PI / 4;
        scene.add(streamPipe);
        objects.push(streamPipe);

        // Glacial melt stream supply - box reservoir
        var reservoir = new THREE.Mesh(
            new THREE.BoxGeometry(12, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x5BA3F5 })
        );
        reservoir.position.set(-20, 8, -28);
        scene.add(reservoir);
        objects.push(reservoir);

        // Cliff face rappelling ropes - LineSegments descent lines
        for (var j = 0; j < 4; j++) {
            var ropeGeom = new THREE.BufferGeometry();
            var positions = new Float32Array([
                -35 + j * 20, 55, -35,
                -35 + j * 20, 5, -30
            ]);
            ropeGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            var ropeLine = new THREE.LineSegments(
                ropeGeom,
                new THREE.MeshLambertMaterial({ color: 0xFFD700 })
            );
            scene.add(ropeLine);
            objects.push(ropeLine);
        }

        // Mountaineering equipment store - box shelter
        var shelter = new THREE.Mesh(
            new THREE.BoxGeometry(16, 12, 10),
            new THREE.MeshLambertMaterial({ color: 0xC41E3A })
        );
        shelter.position.set(25, 6, 10);
        scene.add(shelter);
        objects.push(shelter);

        // Mountaineering equipment store - sphere oxygen tanks
        for (var k = 0; k < 3; k++) {
            var oxygenTank = new THREE.Mesh(
                new THREE.SphereGeometry(2.5, 16, 16),
                new THREE.MeshLambertMaterial({ color: 0x228B22 })
            );
            oxygenTank.position.set(20 + k * 6, 8, 5);
            scene.add(oxygenTank);
            objects.push(oxygenTank);
        }

        // High-altitude sniper hide - narrow box crack in cliff
        var sniperHide = new THREE.Mesh(
            new THREE.BoxGeometry(3, 15, 8),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        sniperHide.position.set(-38, 25, -32);
        scene.add(sniperHide);
        objects.push(sniperHide);

        // Emergency avalanche bunker - box buried structure
        var bunker = new THREE.Mesh(
            new THREE.BoxGeometry(18, 10, 14),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        bunker.position.set(0, 2, -20);
        scene.add(bunker);
        objects.push(bunker);

        // Emergency avalanche bunker - cylinder air tube
        var airTube = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        airTube.position.set(8, 12, -20);
        scene.add(airTube);
        objects.push(airTube);

        // Cone-shaped avalanche deflector on cliff face
        var deflector = new THREE.Mesh(
            new THREE.ConeGeometry(8, 20, 12),
            new THREE.MeshLambertMaterial({ color: 0xA9A9A9 })
        );
        deflector.position.set(-42, 35, -30);
        scene.add(deflector);
        objects.push(deflector);

        // Additional decorative cone for visual interest
        var rockOutcrop = new THREE.Mesh(
            new THREE.ConeGeometry(5, 12, 10),
            new THREE.MeshLambertMaterial({ color: 0x8B7765 })
        );
        rockOutcrop.position.set(32, 8, -15);
        scene.add(rockOutcrop);
        objects.push(rockOutcrop);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(20, 40, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Gentle rotation of oxygen tanks
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry.type === 'SphereGeometry') {
                objects[i].rotation.y += 0.001;
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
