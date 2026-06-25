window.HoltKeep = (function() {
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
        // Central stone fortress keep (main tower)
        var keepGeometry = new THREE.BoxGeometry(20, 30, 20);
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5B4E });
        var keepMesh = new THREE.Mesh(keepGeometry, keepMaterial);
        keepMesh.position.set(0, 15, 0);
        scene.add(keepMesh);
        objects.push(keepMesh);

        // Riverside watchtower on stilts - tall cylinder stilt supports
        var stiltGeometry = new THREE.CylinderGeometry(2, 2, 25, 8);
        var stiltMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var stilt1 = new THREE.Mesh(stiltGeometry, stiltMaterial);
        stilt1.position.set(25, 12.5, -20);
        scene.add(stilt1);
        objects.push(stilt1);

        var stilt2 = new THREE.Mesh(stiltGeometry, stiltMaterial);
        stilt2.position.set(35, 12.5, -15);
        scene.add(stilt2);
        objects.push(stilt2);

        // Watchtower platform on top of stilts
        var towerGeometry = new THREE.BoxGeometry(15, 8, 12);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x5D4E37 });
        var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
        towerMesh.position.set(30, 28, -17);
        scene.add(towerMesh);
        objects.push(towerMesh);

        // Tree root defensive network - snake-like cylinder formations
        var rootGeometry = new THREE.CylinderGeometry(3, 3, 18, 6);
        var rootMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var root1 = new THREE.Mesh(rootGeometry, rootMaterial);
        root1.rotation.z = 0.8;
        root1.position.set(-20, 5, 15);
        scene.add(root1);
        objects.push(root1);

        var root2 = new THREE.Mesh(rootGeometry, rootMaterial);
        root2.rotation.z = 1.2;
        root2.position.set(-15, 8, 25);
        scene.add(root2);
        objects.push(root2);

        var root3 = new THREE.Mesh(rootGeometry, rootMaterial);
        root3.rotation.z = 0.6;
        root3.position.set(-25, 6, 20);
        scene.add(root3);
        objects.push(root3);

        // Otter den tunnel passages - low box tunnels for weapon cache
        var tunnelGeometry = new THREE.BoxGeometry(8, 4, 10);
        var tunnelMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3F35 });
        var tunnel1 = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
        tunnel1.position.set(15, 2, 10);
        scene.add(tunnel1);
        objects.push(tunnel1);

        var tunnel2 = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
        tunnel2.position.set(5, 2, -15);
        scene.add(tunnel2);
        objects.push(tunnel2);

        // Fallen log barricades - horizontal cylinder logs
        var logGeometry = new THREE.CylinderGeometry(2.5, 2.5, 22, 6);
        var logMaterial = new THREE.MeshLambertMaterial({ color: 0x3E2723 });
        var log1 = new THREE.Mesh(logGeometry, logMaterial);
        log1.rotation.z = Math.PI / 2;
        log1.position.set(-10, 3, -25);
        scene.add(log1);
        objects.push(log1);

        var log2 = new THREE.Mesh(logGeometry, logMaterial);
        log2.rotation.z = Math.PI / 2;
        log2.position.set(10, 3, 28);
        scene.add(log2);
        objects.push(log2);

        var log3 = new THREE.Mesh(logGeometry, logMaterial);
        log3.rotation.x = Math.PI / 2;
        log3.position.set(25, 4, 5);
        scene.add(log3);
        objects.push(log3);

        // Additional defensive sphere boulders for variety
        var boulderGeometry = new THREE.SphereGeometry(4, 8, 8);
        var boulderMaterial = new THREE.MeshLambertMaterial({ color: 0x7A6B61 });
        var boulder1 = new THREE.Mesh(boulderGeometry, boulderMaterial);
        boulder1.position.set(-30, 4, 5);
        scene.add(boulder1);
        objects.push(boulder1);

        var boulder2 = new THREE.Mesh(boulderGeometry, boulderMaterial);
        boulder2.position.set(30, 4, 20);
        scene.add(boulder2);
        objects.push(boulder2);

        // Cone-shaped watchtower cap
        var capGeometry = new THREE.ConeGeometry(8, 12, 8);
        var capMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
        var capMesh = new THREE.Mesh(capGeometry, capMaterial);
        capMesh.position.set(0, 38, 0);
        scene.add(capMesh);
        objects.push(capMesh);

        // Stone storage cylinder for weapon cache
        var storageGeometry = new THREE.CylinderGeometry(5, 5, 12, 8);
        var storageMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5B4E });
        var storageMesh = new THREE.Mesh(storageGeometry, storageMaterial);
        storageMesh.position.set(-20, 6, -10);
        scene.add(storageMesh);
        objects.push(storageMesh);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light for riverside glow
        var directionalLight = new THREE.DirectionalLight(0xFFE4B5, 0.8);
        directionalLight.position.set(30, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Optional animation could go here
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
