window.FossCamp = (function() {
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
        var material, geometry, mesh;
        var i;

        // Waterfall - massive tall water column (cylinder)
        geometry = new THREE.CylinderGeometry(8, 8, 60, 32);
        material = new THREE.MeshLambertMaterial({color: 0x4a90e2});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 25, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Cliff layers - stacked boxes for rocky cliff face
        var colors = [0x8b7355, 0xa0826d, 0x996633, 0x7a6a5a];
        for (i = 0; i < 4; i++) {
            geometry = new THREE.BoxGeometry(20, 8, 12);
            material = new THREE.MeshLambertMaterial({color: colors[i]});
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-12, 2 + i * 10, -8);
            scene.add(mesh);
            objects.push(mesh);
        }

        // Power generator shed - main structure
        geometry = new THREE.BoxGeometry(16, 10, 14);
        material = new THREE.MeshLambertMaterial({color: 0x2c3e50});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(15, 5, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Generator shed roof - cone top
        geometry = new THREE.ConeGeometry(9, 6, 8);
        material = new THREE.MeshLambertMaterial({color: 0x34495e});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(15, 15, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Mist-shrouded sniper hide 1 - sphere mist ball
        geometry = new THREE.SphereGeometry(5, 16, 16);
        material = new THREE.MeshLambertMaterial({color: 0xb0c4de, transparent: true});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 12, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Mist-shrouded sniper hide 2 - sphere mist ball
        geometry = new THREE.SphereGeometry(4, 16, 16);
        material = new THREE.MeshLambertMaterial({color: 0xc0d0e0, transparent: true});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(8, 18, 20);
        scene.add(mesh);
        objects.push(mesh);

        // Mist-shrouded sniper hide 3 - sphere mist ball
        geometry = new THREE.SphereGeometry(4.5, 16, 16);
        material = new THREE.MeshLambertMaterial({color: 0xb8c8d8, transparent: true});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-15, 15, -18);
        scene.add(mesh);
        objects.push(mesh);

        // Water wheel fortification - main wheel hub
        geometry = new THREE.CylinderGeometry(7, 7, 2, 24);
        material = new THREE.MeshLambertMaterial({color: 0x8b4513});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 8, 28);
        scene.add(mesh);
        objects.push(mesh);

        // Water wheel fortification - support structure
        geometry = new THREE.BoxGeometry(3, 12, 20);
        material = new THREE.MeshLambertMaterial({color: 0x654321});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 6, 35);
        scene.add(mesh);
        objects.push(mesh);

        // Rope pulley elevator drum - main cylinder
        geometry = new THREE.CylinderGeometry(3, 3, 8, 24);
        material = new THREE.MeshLambertMaterial({color: 0x696969});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 20, 10);
        scene.add(mesh);
        objects.push(mesh);

        // Elevator support tower - tall cylinder
        geometry = new THREE.CylinderGeometry(2, 2, 30, 16);
        material = new THREE.MeshLambertMaterial({color: 0x505050});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 15, 10);
        scene.add(mesh);
        objects.push(mesh);

        // Rope pulley frame - cone structural element
        geometry = new THREE.ConeGeometry(4, 6, 8);
        material = new THREE.MeshLambertMaterial({color: 0x606060});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 28, 10);
        scene.add(mesh);
        objects.push(mesh);

        // Camp barracks - box structure
        geometry = new THREE.BoxGeometry(18, 8, 10);
        material = new THREE.MeshLambertMaterial({color: 0x8b7355});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 4, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Watchtower - tall cylinder
        geometry = new THREE.CylinderGeometry(2.5, 2.5, 22, 12);
        material = new THREE.MeshLambertMaterial({color: 0x5a4a3a});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(30, 11, -22);
        scene.add(mesh);
        objects.push(mesh);

        // Watchtower cap - cone
        geometry = new THREE.ConeGeometry(3.5, 5, 8);
        material = new THREE.MeshLambertMaterial({color: 0x4a3a2a});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(30, 24, -22);
        scene.add(mesh);
        objects.push(mesh);

        // Rope and pulley system - LineSegments for rope
        var ropeGeometry = new THREE.BufferGeometry();
        var ropePositions = new Float32Array([
            25, 30, 10,
            25, 0, 10,
            20, 25, 15,
            30, 25, 5
        ]);
        ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
        var ropeMaterial = new THREE.LineBasicMaterial({color: 0xd4a574});
        var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
        scene.add(rope);
        objects.push(rope);

        // Ground platform - large base box
        geometry = new THREE.BoxGeometry(70, 2, 70);
        material = new THREE.MeshLambertMaterial({color: 0x3d5a3d});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -1, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Ambient light for overall illumination
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for waterfall misting effect
        var directionalLight = new THREE.DirectionalLight(0x87ceeb, 0.8);
        directionalLight.position.set(20, 30, -20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }
    function update(delta) {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.3;
            }
        }
    }
    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }
    return {init: init, update: update, reset: reset};
}());
