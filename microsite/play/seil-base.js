window.SeilBase = (function() {
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
        var material = null;
        var geometry = null;
        var mesh = null;

        // Main island terrain
        geometry = new THREE.BoxGeometry(60, 8, 50);
        material = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -4, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);

        // Clachan Bridge - main bridge deck
        geometry = new THREE.BoxGeometry(40, 2, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-15, 3, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Clachan Bridge - humpback arch (cylinder curved section)
        geometry = new THREE.CylinderGeometry(12, 12, 8, 16, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-15, 6, 5);
        mesh.scale.set(1, 0.6, 1);
        scene.add(mesh);
        objects.push(mesh);

        // Left guard post at bridge
        geometry = new THREE.CylinderGeometry(2, 2.5, 6, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 3, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Right guard post at bridge
        geometry = new THREE.CylinderGeometry(2, 2.5, 6, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-10, 3, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Slate quarry cliff - terrace level 1
        geometry = new THREE.BoxGeometry(25, 4, 20);
        material = new THREE.MeshLambertMaterial({ color: 0x505050 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(20, 6, -10);
        scene.add(mesh);
        objects.push(mesh);

        // Slate quarry cliff - terrace level 2
        geometry = new THREE.BoxGeometry(20, 4, 18);
        material = new THREE.MeshLambertMaterial({ color: 0x555555 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(22, 12, -8);
        scene.add(mesh);
        objects.push(mesh);

        // Stone hut at quarry (sniper position)
        geometry = new THREE.BoxGeometry(6, 5, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(28, 15, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Easdale Island ferry ramp
        geometry = new THREE.BoxGeometry(12, 2, 18);
        material = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, -2, 20);
        mesh.rotation.z = 0.2;
        scene.add(mesh);
        objects.push(mesh);

        // Ferry ramp mooring bollard 1
        geometry = new THREE.CylinderGeometry(1.5, 1.8, 4, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-30, 1, 20);
        scene.add(mesh);
        objects.push(mesh);

        // Ferry ramp mooring bollard 2
        geometry = new THREE.CylinderGeometry(1.5, 1.8, 4, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 1, 25);
        scene.add(mesh);
        objects.push(mesh);

        // Underwater quarry pool - diving bell
        geometry = new THREE.CylinderGeometry(3, 3.5, 5, 12);
        material = new THREE.MeshLambertMaterial({ color: 0x4a5a7a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(15, -8, 25);
        scene.add(mesh);
        objects.push(mesh);

        // Diving bell cable (LineSegments)
        var cableGeometry = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            15, -3, 25,
            15, 5, 25
        ]);
        cableGeometry.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 2 });
        var cableLine = new THREE.LineSegments(cableGeometry, cableMaterial);
        scene.add(cableLine);
        objects.push(cableLine);

        // Ammunition store - base building
        geometry = new THREE.BoxGeometry(10, 4, 14);
        material = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 0, -22);
        scene.add(mesh);
        objects.push(mesh);

        // Ammunition store - left roof section
        geometry = new THREE.BoxGeometry(5.5, 2, 14);
        material = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(2.5, 4.5, -22);
        mesh.rotation.z = 0.35;
        scene.add(mesh);
        objects.push(mesh);

        // Ammunition store - right roof section
        geometry = new THREE.BoxGeometry(5.5, 2, 14);
        material = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(7.5, 4.5, -22);
        mesh.rotation.z = -0.35;
        scene.add(mesh);
        objects.push(mesh);

        // Coastal watch station - hut
        geometry = new THREE.BoxGeometry(5, 5, 5);
        material = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-30, 1, -15);
        scene.add(mesh);
        objects.push(mesh);

        // Coastal watch station - telescope mount cylinder
        geometry = new THREE.CylinderGeometry(0.8, 1, 7, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-30, 6, -15);
        scene.add(mesh);
        objects.push(mesh);

        // Island perimeter wire fence line 1
        var fenceGeometry1 = new THREE.BufferGeometry();
        var fencePositions1 = new Float32Array([
            -28, 1, 28,
            28, 1, 28,
            28, 1, -28,
            -28, 1, -28,
            -28, 1, 28
        ]);
        fenceGeometry1.setAttribute('position', new THREE.BufferAttribute(fencePositions1, 3));
        var fenceMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 1 });
        var fenceLine1 = new THREE.LineSegments(fenceGeometry1, fenceMaterial);
        scene.add(fenceLine1);
        objects.push(fenceLine1);

        // Perimeter corner post 1
        geometry = new THREE.CylinderGeometry(0.6, 0.7, 3, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-28, 1.5, 28);
        scene.add(mesh);
        objects.push(mesh);

        // Perimeter corner post 2
        geometry = new THREE.CylinderGeometry(0.6, 0.7, 3, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(28, 1.5, 28);
        scene.add(mesh);
        objects.push(mesh);

        // Perimeter corner post 3
        geometry = new THREE.CylinderGeometry(0.6, 0.7, 3, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(28, 1.5, -28);
        scene.add(mesh);
        objects.push(mesh);

        // Perimeter corner post 4
        geometry = new THREE.CylinderGeometry(0.6, 0.7, 3, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-28, 1.5, -28);
        scene.add(mesh);
        objects.push(mesh);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 25, 20);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation logic here if needed
    }

    function reset() {
        var i = 0;
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
