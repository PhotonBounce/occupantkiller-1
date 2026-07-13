window.DenePost = (function() {
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

        // Ancient oak tree 1 - thick cylinder trunk
        geometry = new THREE.CylinderGeometry(4, 5, 35, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 17.5, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Oak tree 1 - large sphere canopy
        geometry = new THREE.SphereGeometry(12, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 32, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Ancient oak tree 2 - thick cylinder trunk
        geometry = new THREE.CylinderGeometry(4.5, 5.5, 38, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(20, 19, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Oak tree 2 - large sphere canopy
        geometry = new THREE.SphereGeometry(13, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x355c1a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(20, 34, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Ancient oak tree 3 - thick cylinder trunk
        geometry = new THREE.CylinderGeometry(4, 4.8, 33, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 16.5, -25);
        scene.add(mesh);
        objects.push(mesh);

        // Oak tree 3 - large sphere canopy
        geometry = new THREE.SphereGeometry(11.5, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 30, -25);
        scene.add(mesh);
        objects.push(mesh);

        // Sniper tree-hide platform - box nestled between trunks
        geometry = new THREE.BoxGeometry(8, 3, 7);
        material = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-2.5, 28, -2.5);
        scene.add(mesh);
        objects.push(mesh);

        // Underground ammunition bunker entrance - box hatch
        geometry = new THREE.BoxGeometry(6, 2, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(15, 1, 8);
        scene.add(mesh);
        objects.push(mesh);

        // Bunker lock pattern - LineSegments
        var lockPoints = [];
        lockPoints.push(new THREE.Vector3(15, 1.5, 5));
        lockPoints.push(new THREE.Vector3(15, 1.5, 11));
        lockPoints.push(new THREE.Vector3(12, 1.5, 8));
        lockPoints.push(new THREE.Vector3(18, 1.5, 8));
        lockPoints.push(new THREE.Vector3(15, 1.5, 5));
        var lockGeometry = new THREE.BufferGeometry().setFromPoints(lockPoints);
        material = new THREE.LineBasicMaterial({ color: 0xAAAA00 });
        var lockLines = new THREE.LineSegments(lockGeometry, material);
        scene.add(lockLines);
        objects.push(lockLines);

        // Ivy-covered stone wall ruins 1 - box wall segment
        geometry = new THREE.BoxGeometry(10, 4, 1);
        material = new THREE.MeshLambertMaterial({ color: 0x7a7a5c });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 2, 10);
        scene.add(mesh);
        objects.push(mesh);

        // Ivy cluster on wall 1 - sphere
        geometry = new THREE.SphereGeometry(2.5, 6, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x3d6c2b });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-18, 3.5, 10.5);
        scene.add(mesh);
        objects.push(mesh);

        // Stone wall ruins 2 - box wall segment
        geometry = new THREE.BoxGeometry(8, 3.5, 1);
        material = new THREE.MeshLambertMaterial({ color: 0x8a8a6c });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 1.75, -15);
        scene.add(mesh);
        objects.push(mesh);

        // Ivy cluster on wall 2 - sphere
        geometry = new THREE.SphereGeometry(2, 6, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x3d6c2b });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(26, 2.5, -14.5);
        scene.add(mesh);
        objects.push(mesh);

        // Trip-wire alarm system - cylinder posts
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x555555 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-15, 3, 20);
        scene.add(mesh);
        objects.push(mesh);

        // Trip-wire alarm system - LineSegments wire
        var wirePoints = [];
        wirePoints.push(new THREE.Vector3(-15, 4.5, 20));
        wirePoints.push(new THREE.Vector3(10, 4.5, 25));
        wirePoints.push(new THREE.Vector3(22, 4.5, 5));
        var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
        material = new THREE.LineBasicMaterial({ color: 0xFF6600 });
        var wireLines = new THREE.LineSegments(wireGeometry, material);
        scene.add(wireLines);
        objects.push(wireLines);

        // Observation post central cone
        geometry = new THREE.ConeGeometry(3, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x6b5d4f });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 4, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Ambient light for the wooded valley
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light simulating dappled sunlight through canopy
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(30, 40, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation loop - can add subtle animations here
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                // Optional subtle rotation for certain objects
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
