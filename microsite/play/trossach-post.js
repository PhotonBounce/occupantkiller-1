window.TrossachPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        var material;
        var geometry;
        var mesh;

        // Rocky terrain base - brown boxes forming ground level
        geometry = new THREE.BoxGeometry(60, 2, 60);
        material = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -3, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Left cliff face - tall brown box
        geometry = new THREE.BoxGeometry(8, 35, 40);
        material = new THREE.MeshLambertMaterial({ color: 0x5C3317 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-26, 12, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Right cliff face - tall brown box
        geometry = new THREE.BoxGeometry(8, 35, 40);
        material = new THREE.MeshLambertMaterial({ color: 0x5C3317 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(26, 12, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Defensive wall box barricade across pass
        geometry = new THREE.BoxGeometry(50, 8, 4);
        material = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 5, -18);
        scene.add(mesh);
        objects.push(mesh);

        // Clifftop observation post - tall cylinder support
        geometry = new THREE.CylinderGeometry(3, 4, 28, 16);
        material = new THREE.MeshLambertMaterial({ color: 0x7A6B5D });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 10, 20);
        scene.add(mesh);
        objects.push(mesh);

        // Clifftop OP platform box on top of cylinder
        geometry = new THREE.BoxGeometry(12, 2, 12);
        material = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 25, 20);
        scene.add(mesh);
        objects.push(mesh);

        // Boulder field anti-vehicle obstacle - sphere 1
        geometry = new THREE.SphereGeometry(4, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x6B6B6B });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-15, 2, -8);
        scene.add(mesh);
        objects.push(mesh);

        // Boulder field - sphere 2
        geometry = new THREE.SphereGeometry(5, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 3, -12);
        scene.add(mesh);
        objects.push(mesh);

        // Boulder field - sphere 3
        geometry = new THREE.SphereGeometry(4.5, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x696969 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(12, 2, -5);
        scene.add(mesh);
        objects.push(mesh);

        // Boulder field - sphere 4
        geometry = new THREE.SphereGeometry(3.5, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x5D5D5D });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-8, 2, 8);
        scene.add(mesh);
        objects.push(mesh);

        // Ambush concealment position - box hide in rock face
        geometry = new THREE.BoxGeometry(8, 6, 5);
        material = new THREE.MeshLambertMaterial({ color: 0x4A3F35 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(20, 8, -25);
        scene.add(mesh);
        objects.push(mesh);

        // Rope bridge support cylinder left side
        geometry = new THREE.CylinderGeometry(2, 2, 18, 12);
        material = new THREE.MeshLambertMaterial({ color: 0x7A6B5D });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-18, 12, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Rope bridge support cylinder right side
        geometry = new THREE.CylinderGeometry(2, 2, 18, 12);
        material = new THREE.MeshLambertMaterial({ color: 0x7A6B5D });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(18, 12, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Rope bridge planks box
        geometry = new THREE.BoxGeometry(30, 1.5, 3);
        material = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 22, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Mountain spring water cylinder pipe
        geometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 12);
        material = new THREE.MeshLambertMaterial({ color: 0x2C5F2D });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 6, 12);
        scene.add(mesh);
        objects.push(mesh);

        // Water cistern box
        geometry = new THREE.BoxGeometry(6, 6, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x4A7C4E });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 3, 12);
        scene.add(mesh);
        objects.push(mesh);

        // Pass guardian signal fire post - tall cylinder
        geometry = new THREE.CylinderGeometry(2.5, 3, 32, 14);
        material = new THREE.MeshLambertMaterial({ color: 0x5C4A3A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-30, 8, -2);
        scene.add(mesh);
        objects.push(mesh);

        // Signal fire sphere on top
        geometry = new THREE.SphereGeometry(3.5, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0xFF6B35 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-30, 28, -2);
        scene.add(mesh);
        objects.push(mesh);

        // Rope bridge suspension cables - LineSegments
        var cableGeometry = new THREE.BufferGeometry();
        var cablePoints = [
            new THREE.Vector3(-18, 20, 15),
            new THREE.Vector3(-15, 22, 15),
            new THREE.Vector3(-12, 20, 15),
            new THREE.Vector3(-9, 22, 15),
            new THREE.Vector3(-6, 20, 15),
            new THREE.Vector3(-3, 22, 15),
            new THREE.Vector3(0, 20, 15),
            new THREE.Vector3(3, 22, 15),
            new THREE.Vector3(6, 20, 15),
            new THREE.Vector3(9, 22, 15),
            new THREE.Vector3(12, 20, 15),
            new THREE.Vector3(15, 22, 15),
            new THREE.Vector3(18, 20, 15)
        ];
        cableGeometry.setFromPoints(cablePoints);
        var cableMaterial = new THREE.LineBasicMaterial({ color: 0x8B6F47, linewidth: 2 });
        var cables = new THREE.LineSegments(cableGeometry, cableMaterial);
        scene.add(cables);
        objects.push(cables);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadow
        var directionalLight = new THREE.DirectionalLight(0xFFFFCC, 0.8);
        directionalLight.position.set(15, 25, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate signal fire sphere rotation
        if (objects.length > 18) {
            objects[18].rotation.y += delta * 1.5;
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
