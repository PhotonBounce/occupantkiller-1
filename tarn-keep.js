window.TarnKeep = (function() {
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
        var greyMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var darkGreyMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var lightBlueMaterial = new THREE.MeshLambertMaterial({ color: 0xb0d0ff });
        var iceMaterial = new THREE.MeshLambertMaterial({ color: 0xd0e8ff });

        // Main keep tower base - central stone block
        var keepGeom = new THREE.BoxGeometry(20, 25, 20);
        var keepMesh = new THREE.Mesh(keepGeom, greyMaterial);
        keepMesh.position.set(0, 12.5, 0);
        scene.add(keepMesh);
        objects.push(keepMesh);

        // Keep tower ice cap on top
        var capGeom = new THREE.BoxGeometry(20, 4, 20);
        var capMesh = new THREE.Mesh(capGeom, whiteMaterial);
        capMesh.position.set(0, 29.5, 0);
        scene.add(capMesh);
        objects.push(capMesh);

        // Northern fortress wall section
        var wallNGeom = new THREE.BoxGeometry(35, 15, 8);
        var wallNMesh = new THREE.Mesh(wallNGeom, greyMaterial);
        wallNMesh.position.set(0, 7.5, -22);
        scene.add(wallNMesh);
        objects.push(wallNMesh);

        // Northern wall ice cap
        var capNGeom = new THREE.BoxGeometry(35, 3, 8);
        var capNMesh = new THREE.Mesh(capNGeom, whiteMaterial);
        capNMesh.position.set(0, 19.5, -22);
        scene.add(capNMesh);
        objects.push(capNMesh);

        // Southern fortress wall section
        var wallSGeom = new THREE.BoxGeometry(35, 15, 8);
        var wallSMesh = new THREE.Mesh(wallSGeom, greyMaterial);
        wallSMesh.position.set(0, 7.5, 22);
        scene.add(wallSMesh);
        objects.push(wallSMesh);

        // Southern wall ice cap
        var capSGeom = new THREE.BoxGeometry(35, 3, 8);
        var capSMesh = new THREE.Mesh(capSGeom, whiteMaterial);
        capSMesh.position.set(0, 19.5, 22);
        scene.add(capSMesh);
        objects.push(capSMesh);

        // Eastern fortress wall section
        var wallEGeom = new THREE.BoxGeometry(8, 15, 35);
        var wallEMesh = new THREE.Mesh(wallEGeom, greyMaterial);
        wallEMesh.position.set(22, 7.5, 0);
        scene.add(wallEMesh);
        objects.push(wallEMesh);

        // Eastern wall ice cap
        var capEGeom = new THREE.BoxGeometry(8, 3, 35);
        var capEMesh = new THREE.Mesh(capEGeom, whiteMaterial);
        capEMesh.position.set(22, 19.5, 0);
        scene.add(capEMesh);
        objects.push(capEMesh);

        // Avalanche defense barrier 1 - wedge ramp left
        var rampGeom1 = new THREE.ConeGeometry(12, 8, 4);
        var rampMesh1 = new THREE.Mesh(rampGeom1, darkGreyMaterial);
        rampMesh1.rotation.x = Math.PI / 2;
        rampMesh1.rotation.z = Math.PI / 4;
        rampMesh1.position.set(-20, 4, -25);
        scene.add(rampMesh1);
        objects.push(rampMesh1);

        // Avalanche defense barrier 2 - wedge ramp right
        var rampGeom2 = new THREE.ConeGeometry(12, 8, 4);
        var rampMesh2 = new THREE.Mesh(rampGeom2, darkGreyMaterial);
        rampMesh2.rotation.x = Math.PI / 2;
        rampMesh2.rotation.z = -Math.PI / 4;
        rampMesh2.position.set(20, 4, -25);
        scene.add(rampMesh2);
        objects.push(rampMesh2);

        // Frozen supply cache - ice sphere 1
        var iceGeom1 = new THREE.SphereGeometry(5, 16, 16);
        var iceMesh1 = new THREE.Mesh(iceGeom1, iceMaterial);
        iceMesh1.position.set(-15, 8, 15);
        scene.add(iceMesh1);
        objects.push(iceMesh1);

        // Frozen supply cache - ice sphere 2
        var iceGeom2 = new THREE.SphereGeometry(4.5, 16, 16);
        var iceMesh2 = new THREE.Mesh(iceGeom2, iceMaterial);
        iceMesh2.position.set(10, 7, 20);
        scene.add(iceMesh2);
        objects.push(iceMesh2);

        // Frozen supply cache - storage box under ice
        var storageGeom = new THREE.BoxGeometry(10, 6, 10);
        var storageMesh = new THREE.Mesh(storageGeom, darkGreyMaterial);
        storageMesh.position.set(-15, 3, 15);
        scene.add(storageMesh);
        objects.push(storageMesh);

        // Glacier observation post cylinder turret
        var postGeom = new THREE.CylinderGeometry(6, 8, 18, 12);
        var postMesh = new THREE.Mesh(postGeom, greyMaterial);
        postMesh.position.set(-25, 9, 8);
        scene.add(postMesh);
        objects.push(postMesh);

        // Observation post ice cap
        var postCapGeom = new THREE.ConeGeometry(6, 4, 12);
        var postCapMesh = new THREE.Mesh(postCapGeom, whiteMaterial);
        postCapMesh.position.set(-25, 22, 8);
        scene.add(postCapMesh);
        objects.push(postCapMesh);

        // Rope bridge cable supports - left pillar
        var pillarLGeom = new THREE.CylinderGeometry(2, 2, 20, 8);
        var pillarLMesh = new THREE.Mesh(pillarLGeom, darkGreyMaterial);
        pillarLMesh.position.set(-30, 10, -18);
        scene.add(pillarLMesh);
        objects.push(pillarLMesh);

        // Rope bridge cable supports - right pillar
        var pillarRGeom = new THREE.CylinderGeometry(2, 2, 20, 8);
        var pillarRMesh = new THREE.Mesh(pillarRGeom, darkGreyMaterial);
        pillarRMesh.position.set(30, 10, -18);
        scene.add(pillarRMesh);
        objects.push(pillarRMesh);

        // Rope bridge cables - diagonal left cable
        var cableGeom1 = new THREE.BufferGeometry();
        var cableVerts1 = new Float32Array([
            -30, 20, -18,
            0, 5, -18
        ]);
        cableGeom1.setAttribute('position', new THREE.BufferAttribute(cableVerts1, 3));
        var cableMesh1 = new THREE.LineSegments(cableGeom1, new THREE.LineBasicMaterial({ color: 0x8b7355, linewidth: 2 }));
        scene.add(cableMesh1);
        objects.push(cableMesh1);

        // Rope bridge cables - diagonal right cable
        var cableGeom2 = new THREE.BufferGeometry();
        var cableVerts2 = new Float32Array([
            30, 20, -18,
            0, 5, -18
        ]);
        cableGeom2.setAttribute('position', new THREE.BufferAttribute(cableVerts2, 3));
        var cableMesh2 = new THREE.LineSegments(cableGeom2, new THREE.LineBasicMaterial({ color: 0x8b7355, linewidth: 2 }));
        scene.add(cableMesh2);
        objects.push(cableMesh2);

        // Secondary stone watchtower - east side
        var towerEGeom = new THREE.BoxGeometry(10, 16, 10);
        var towerEMesh = new THREE.Mesh(towerEGeom, greyMaterial);
        towerEMesh.position.set(28, 8, 12);
        scene.add(towerEMesh);
        objects.push(towerEMesh);

        // Secondary watchtower ice cap
        var towerECapGeom = new THREE.BoxGeometry(10, 3, 10);
        var towerECapMesh = new THREE.Mesh(towerECapGeom, whiteMaterial);
        towerECapMesh.position.set(28, 20.5, 12);
        scene.add(towerECapMesh);
        objects.push(towerECapMesh);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows and atmosphere
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 30, 15);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Gentle rotation animation for observation post
        if (objects.length > 14) {
            objects[14].rotation.y += delta * 0.1;
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
