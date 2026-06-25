window.FirthPost = (function() {
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
        var i, mesh, geometry, material;

        // Pillbox 1: Elevated on cylinder stilts (tidal mudflat defense)
        // Cylinder stilt base
        geometry = new THREE.CylinderGeometry(2, 2.5, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x556B7A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 4, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Pillbox box structure on top
        geometry = new THREE.BoxGeometry(6, 4, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x3D4A52 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 10, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Pillbox 2: Second elevated position
        geometry = new THREE.CylinderGeometry(2, 2.5, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x556B7A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(20, 4, -25);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.BoxGeometry(6, 4, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x3D4A52 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(20, 10, -25);
        scene.add(mesh);
        objects.push(mesh);

        // Anti-landing craft obstacles: angled box stakes
        geometry = new THREE.BoxGeometry(2, 6, 0.8);
        material = new THREE.MeshLambertMaterial({ color: 0x7B4A2F });
        mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = 0.4;
        mesh.position.set(-10, 3, 15);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.BoxGeometry(2, 6, 0.8);
        material = new THREE.MeshLambertMaterial({ color: 0x7B4A2F });
        mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = -0.4;
        mesh.position.set(0, 3, 18);
        scene.add(mesh);
        objects.push(mesh);

        // Obstacle poles (cylinders)
        geometry = new THREE.CylinderGeometry(0.6, 0.6, 5, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x556B7A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(10, 2.5, 20);
        scene.add(mesh);
        objects.push(mesh);

        // Coastal artillery emplacement: box gun mount
        geometry = new THREE.BoxGeometry(4, 3, 5);
        material = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-15, 1.5, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Cylinder barrel (gun)
        geometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = 0.3;
        mesh.position.set(-15, 4.5, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Lighthouse repurposed as OP tower: tall cylinder
        geometry = new THREE.CylinderGeometry(3, 3.5, 20, 12);
        material = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 10, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Lighthouse cone cap
        geometry = new THREE.ConeGeometry(3.5, 4, 12);
        material = new THREE.MeshLambertMaterial({ color: 0xD4381B });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 22, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Lighthouse sphere light beacon
        geometry = new THREE.SphereGeometry(1.5, 16, 16);
        material = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 24.5, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Barrage balloon: sphere balloon
        geometry = new THREE.SphereGeometry(4, 16, 16);
        material = new THREE.MeshLambertMaterial({ color: 0x808080 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-30, 18, -15);
        scene.add(mesh);
        objects.push(mesh);

        // Barrage balloon cables (LineSegments)
        var balloonCables = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -30, 18, -15,  -28, 2, -14,
            -30, 18, -15,  -32, 2, -16,
            -30, 18, -15,  -30, 2, -18,
            -30, 18, -15,  -30, 2, -12
        ]);
        balloonCables.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        material = new THREE.MeshLambertMaterial({ color: 0x444444 });
        mesh = new THREE.LineSegments(balloonCables, material);
        scene.add(mesh);
        objects.push(mesh);

        // Sea-mine layer launch ramp: sloped box
        geometry = new THREE.BoxGeometry(5, 2, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x556B7A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = 0.25;
        mesh.position.set(15, 1, -10);
        scene.add(mesh);
        objects.push(mesh);

        // Tidal causeway defense: box road section
        geometry = new THREE.BoxGeometry(8, 1, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 0.5, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Causeway bollards (cylinder posts)
        geometry = new THREE.CylinderGeometry(0.7, 0.8, 2, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-2, 1, 0);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.CylinderGeometry(0.7, 0.8, 2, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(12, 1, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Searchlight tower: cylinder base
        geometry = new THREE.CylinderGeometry(1.5, 2, 6, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x556B7A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 3, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Searchlight dome
        geometry = new THREE.SphereGeometry(2, 12, 12);
        material = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 8, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Ammunition storage bunker: box
        geometry = new THREE.BoxGeometry(7, 3, 5);
        material = new THREE.MeshLambertMaterial({ color: 0x3D3D3D });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(10, 1.5, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Lights
        var light1 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        light1.position.set(30, 40, 30);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xFFFFFF, 0.4);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i].rotation !== undefined) {
                objects[i].rotation.y += delta * 0.1;
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
