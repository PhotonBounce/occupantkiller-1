window.WoldCamp = (function() {
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
        // Earthwork ring 1 - stacked boxes forming ring barrier
        var ring1Outer = new THREE.Mesh(
            new THREE.BoxGeometry(60, 2, 60),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        ring1Outer.position.set(0, 0.5, 0);
        scene.add(ring1Outer);
        objects.push(ring1Outer);

        var ring1Inner = new THREE.Mesh(
            new THREE.BoxGeometry(40, 2, 40),
            new THREE.MeshLambertMaterial({ color: 0xA0826D })
        );
        ring1Inner.position.set(0, 1.5, 0);
        scene.add(ring1Inner);
        objects.push(ring1Inner);

        // Earthwork ring 2 - inner defensive circle
        var ring2Box = new THREE.Mesh(
            new THREE.BoxGeometry(25, 3, 25),
            new THREE.MeshLambertMaterial({ color: 0x9D7E6F })
        );
        ring2Box.position.set(0, 2, 0);
        scene.add(ring2Box);
        objects.push(ring2Box);

        // Bronze Age barrow mound - large sphere repurposed as ammo dump
        var barrowMound = new THREE.Mesh(
            new THREE.SphereGeometry(12, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x7A6B5D })
        );
        barrowMound.position.set(-25, 6, -20);
        barrowMound.scale.set(1, 0.8, 1);
        scene.add(barrowMound);
        objects.push(barrowMound);

        // Standing stone array - vertical cylinders for communication
        var stone1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 15, 8),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        stone1.position.set(20, 7.5, -15);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 18, 8),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        stone2.position.set(25, 9, 5);
        scene.add(stone2);
        objects.push(stone2);

        var stone3 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 16, 8),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        stone3.position.set(10, 8, 20);
        scene.add(stone3);
        objects.push(stone3);

        // Tank trap pits - recessed boxes
        var pit1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 8),
            new THREE.MeshLambertMaterial({ color: 0x5C4033 })
        );
        pit1.position.set(-15, -1, 10);
        scene.add(pit1);
        objects.push(pit1);

        var pit2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 8),
            new THREE.MeshLambertMaterial({ color: 0x6B4423 })
        );
        pit2.position.set(-20, -1, -5);
        scene.add(pit2);
        objects.push(pit2);

        var pit3 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 8),
            new THREE.MeshLambertMaterial({ color: 0x5C4033 })
        );
        pit3.position.set(15, -1, 15);
        scene.add(pit3);
        objects.push(pit3);

        // Dolmen gate - Neolithic style checkpoint arch using cones and boxes
        var dolmenLeft = new THREE.Mesh(
            new THREE.BoxGeometry(2, 10, 2),
            new THREE.MeshLambertMaterial({ color: 0x8B8680 })
        );
        dolmenLeft.position.set(-8, 5, -28);
        scene.add(dolmenLeft);
        objects.push(dolmenLeft);

        var dolmenRight = new THREE.Mesh(
            new THREE.BoxGeometry(2, 10, 2),
            new THREE.MeshLambertMaterial({ color: 0x8B8680 })
        );
        dolmenRight.position.set(8, 5, -28);
        scene.add(dolmenRight);
        objects.push(dolmenRight);

        var dolmenTop = new THREE.Mesh(
            new THREE.BoxGeometry(18, 2, 2),
            new THREE.MeshLambertMaterial({ color: 0x9E9E9E })
        );
        dolmenTop.position.set(0, 10.5, -28);
        scene.add(dolmenTop);
        objects.push(dolmenTop);

        // Central command tent structure - cone
        var tentCone = new THREE.Mesh(
            new THREE.ConeGeometry(6, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0xCD853F })
        );
        tentCone.position.set(0, 6, 0);
        scene.add(tentCone);
        objects.push(tentCone);

        // Ammunition storage sphere
        var ammoDump = new THREE.Mesh(
            new THREE.SphereGeometry(5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        ammoDump.position.set(28, 3, 18);
        scene.add(ammoDump);
        objects.push(ammoDump);

        // Guard tower cylinder
        var guardTower = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        );
        guardTower.position.set(-28, 4, 15);
        scene.add(guardTower);
        objects.push(guardTower);

        // Supply depot box
        var supplyBox = new THREE.Mesh(
            new THREE.BoxGeometry(10, 4, 10),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        supplyBox.position.set(18, 2, -25);
        scene.add(supplyBox);
        objects.push(supplyBox);

        // Lookout sphere on post
        var lookoutBall = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        lookoutBall.position.set(-18, 8, 22);
        scene.add(lookoutBall);
        objects.push(lookoutBall);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation logic placeholder
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
