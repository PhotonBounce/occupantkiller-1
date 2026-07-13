window.LochyKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Main fortress keep tower - tall central structure
        var keepGeom = new THREE.BoxGeometry(20, 50, 20);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var keepMesh = new THREE.Mesh(keepGeom, keepMat);
        keepMesh.position.set(0, 25, 0);
        scene.add(keepMesh);
        objects.push(keepMesh);

        // Keep crenellations - upper box structure
        var crenelGeom = new THREE.BoxGeometry(24, 8, 24);
        var crenelMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var crenelMesh = new THREE.Mesh(crenelGeom, crenelMat);
        crenelMesh.position.set(0, 54, 0);
        scene.add(crenelMesh);
        objects.push(crenelMesh);

        // Left flanking drum tower
        var drumLeftGeom = new THREE.CylinderGeometry(8, 8, 45, 16);
        var drumMat = new THREE.MeshLambertMaterial({ color: 0x7A3E1F });
        var drumLeftMesh = new THREE.Mesh(drumLeftGeom, drumMat);
        drumLeftMesh.position.set(-25, 22.5, -20);
        scene.add(drumLeftMesh);
        objects.push(drumLeftMesh);

        // Left drum tower cone cap
        var coneLeftGeom = new THREE.ConeGeometry(10, 12, 16);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x5C2E0F });
        var coneLeftMesh = new THREE.Mesh(coneLeftGeom, coneMat);
        coneLeftMesh.position.set(-25, 51.5, -20);
        scene.add(coneLeftMesh);
        objects.push(coneLeftMesh);

        // Right flanking drum tower
        var drumRightGeom = new THREE.CylinderGeometry(8, 8, 45, 16);
        var drumRightMesh = new THREE.Mesh(drumRightGeom, drumMat);
        drumRightMesh.position.set(25, 22.5, -20);
        scene.add(drumRightMesh);
        objects.push(drumRightMesh);

        // Right drum tower cone cap
        var coneRightMesh = new THREE.Mesh(coneLeftGeom, coneMat);
        coneRightMesh.position.set(25, 51.5, -20);
        scene.add(coneRightMesh);
        objects.push(coneRightMesh);

        // Natural cliff defense face - rear box cliff
        var cliffGeom = new THREE.BoxGeometry(60, 40, 8);
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var cliffMesh = new THREE.Mesh(cliffGeom, cliffMat);
        cliffMesh.position.set(0, 20, -32);
        scene.add(cliffMesh);
        objects.push(cliffMesh);

        // Highland regiment barracks - long box building
        var barracksGeom = new THREE.BoxGeometry(35, 12, 15);
        var barracksMat = new THREE.MeshLambertMaterial({ color: 0x9B6B47 });
        var barracksMesh = new THREE.Mesh(barracksGeom, barracksMat);
        barracksMesh.position.set(-15, 6, 15);
        scene.add(barracksMesh);
        objects.push(barracksMesh);

        // Forge and armory structure - main box
        var forgeGeom = new THREE.BoxGeometry(18, 10, 18);
        var forgeMat = new THREE.MeshLambertMaterial({ color: 0x8B5A3C });
        var forgeMesh = new THREE.Mesh(forgeGeom, forgeMat);
        forgeMesh.position.set(20, 5, 18);
        scene.add(forgeMesh);
        objects.push(forgeMesh);

        // Forge fire - sphere in center
        var forgeFireGeom = new THREE.SphereGeometry(5, 16, 16);
        var forgeFireMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var forgeFireMesh = new THREE.Mesh(forgeFireGeom, forgeFireMat);
        forgeFireMesh.position.set(20, 12, 18);
        scene.add(forgeFireMesh);
        objects.push(forgeFireMesh);

        // Postern gate escape tunnel - box tunnel
        var tunnelGeom = new THREE.BoxGeometry(6, 8, 25);
        var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var tunnelMesh = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnelMesh.position.set(-28, 4, 5);
        scene.add(tunnelMesh);
        objects.push(tunnelMesh);

        // Postern gate door frame - cylinder
        var doorGeom = new THREE.CylinderGeometry(4, 4, 8, 12);
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x3E3E3E });
        var doorMesh = new THREE.Mesh(doorGeom, doorMat);
        doorMesh.rotation.z = Math.PI / 2;
        doorMesh.position.set(-28, 4, 30);
        scene.add(doorMesh);
        objects.push(doorMesh);

        // Highland cattle pen defensive posts - first cylinder post
        var postGeom = new THREE.CylinderGeometry(2, 2, 12, 8);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var post1Mesh = new THREE.Mesh(postGeom, postMat);
        post1Mesh.position.set(-15, 6, -15);
        scene.add(post1Mesh);
        objects.push(post1Mesh);

        // Highland cattle pen post 2
        var post2Mesh = new THREE.Mesh(postGeom, postMat);
        post2Mesh.position.set(10, 6, -18);
        scene.add(post2Mesh);
        objects.push(post2Mesh);

        // Cattle pen rail - LineSegments between posts
        var railGeometry = new THREE.BufferGeometry();
        var railPositions = new Float32Array([
            -15, 8, -15,
            10, 8, -18
        ]);
        railGeometry.setAttribute('position', new THREE.BufferAttribute(railPositions, 3));
        var railMat = new THREE.LineBasicMaterial({ color: 0x8B4513 });
        var railMesh = new THREE.LineSegments(railGeometry, railMat);
        scene.add(railMesh);
        objects.push(railMesh);

        // Storage building - additional box structure
        var storageGeom = new THREE.BoxGeometry(14, 9, 14);
        var storageMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var storageMesh = new THREE.Mesh(storageGeom, storageMat);
        storageMesh.position.set(-20, 4.5, -8);
        scene.add(storageMesh);
        objects.push(storageMesh);

        // Ambient light for overall illumination
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Point light from forge fire
        var pointLight = new THREE.PointLight(0xFF6347, 1, 50);
        pointLight.position.set(20, 12, 18);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Animation updates can be added here
        // For now, keep structure static for fortress environment
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
