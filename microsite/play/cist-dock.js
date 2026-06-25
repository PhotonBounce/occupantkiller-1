window.CistDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        // Stone cist box slabs - weapon cache containers
        var cistMaterial1 = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var cistBox1 = new THREE.BoxGeometry(4, 3, 8);
        var cistMesh1 = new THREE.Mesh(cistBox1, cistMaterial1);
        cistMesh1.position.set(-25, 2, -20);
        scene.add(cistMesh1);
        objects.push(cistMesh1);

        var cistMaterial2 = new THREE.MeshLambertMaterial({ color: 0x7A6B5C });
        var cistBox2 = new THREE.BoxGeometry(3.5, 3.5, 7);
        var cistMesh2 = new THREE.Mesh(cistBox2, cistMaterial2);
        cistMesh2.position.set(-10, 2, -25);
        scene.add(cistMesh2);
        objects.push(cistMesh2);

        var cistMaterial3 = new THREE.MeshLambertMaterial({ color: 0x9B8B7B });
        var cistBox3 = new THREE.BoxGeometry(4.2, 2.8, 7.5);
        var cistMesh3 = new THREE.Mesh(cistBox3, cistMaterial3);
        cistMesh3.position.set(15, 1.5, -22);
        scene.add(cistMesh3);
        objects.push(cistMesh3);

        // Burial mound - large sphere command post
        var moundMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5A4A });
        var moundGeom = new THREE.SphereGeometry(12, 32, 16);
        var moundMesh = new THREE.Mesh(moundGeom, moundMaterial);
        moundMesh.position.set(5, 8, 8);
        scene.add(moundMesh);
        objects.push(moundMesh);

        // Mound door - box on sphere
        var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
        var doorGeom = new THREE.BoxGeometry(3, 4, 1.5);
        var doorMesh = new THREE.Mesh(doorGeom, doorMaterial);
        doorMesh.position.set(5, 6, 18);
        scene.add(doorMesh);
        objects.push(doorMesh);

        // Funerary urn mortar positions - cylinders
        var urnMaterial1 = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var urnGeom1 = new THREE.CylinderGeometry(1.5, 1.8, 3.5, 16);
        var urnMesh1 = new THREE.Mesh(urnGeom1, urnMaterial1);
        urnMesh1.position.set(-20, 1.8, 5);
        scene.add(urnMesh1);
        objects.push(urnMesh1);

        var urnMaterial2 = new THREE.MeshLambertMaterial({ color: 0xB0926D });
        var urnGeom2 = new THREE.CylinderGeometry(1.3, 1.6, 3, 16);
        var urnMesh2 = new THREE.Mesh(urnGeom2, urnMaterial2);
        urnMesh2.position.set(-5, 1.5, 12);
        scene.add(urnMesh2);
        objects.push(urnMesh2);

        var urnMaterial3 = new THREE.MeshLambertMaterial({ color: 0x9A827D });
        var urnGeom3 = new THREE.CylinderGeometry(1.4, 1.7, 3.2, 16);
        var urnMesh3 = new THREE.Mesh(urnGeom3, urnMaterial3);
        urnMesh3.position.set(20, 1.6, 15);
        scene.add(urnMesh3);
        objects.push(urnMesh3);

        // Megalithic capstone bridge - box beams
        var capstoneMaterial = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
        var capstoneGeom = new THREE.BoxGeometry(20, 2, 2.5);
        var capstoneMesh = new THREE.Mesh(capstoneGeom, capstoneMaterial);
        capstoneMesh.position.set(0, 8, -8);
        capstoneMesh.rotation.z = 0.3;
        scene.add(capstoneMesh);
        objects.push(capstoneMesh);

        // Support pillars for capstone bridge
        var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5A4A });
        var pillarGeom = new THREE.CylinderGeometry(1.2, 1.5, 8, 12);
        var pillarMesh1 = new THREE.Mesh(pillarGeom, pillarMaterial);
        pillarMesh1.position.set(-15, 4, -10);
        scene.add(pillarMesh1);
        objects.push(pillarMesh1);

        var pillarMesh2 = new THREE.Mesh(pillarGeom, pillarMaterial);
        pillarMesh2.position.set(15, 4, -10);
        scene.add(pillarMesh2);
        objects.push(pillarMesh2);

        // Cone-shaped beacon cairn
        var cairnMaterial = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
        var cairnGeom = new THREE.ConeGeometry(3, 6, 12);
        var cairnMesh = new THREE.Mesh(cairnGeom, cairnMaterial);
        cairnMesh.position.set(-30, 3, 20);
        scene.add(cairnMesh);
        objects.push(cairnMesh);

        // Secondary cist boxes scattered
        var cistMaterial4 = new THREE.MeshLambertMaterial({ color: 0x8A7A6A });
        var cistBox4 = new THREE.BoxGeometry(2.5, 2, 5);
        var cistMesh4 = new THREE.Mesh(cistBox4, cistMaterial4);
        cistMesh4.position.set(28, 1, 10);
        scene.add(cistMesh4);
        objects.push(cistMesh4);

        var cistMaterial5 = new THREE.MeshLambertMaterial({ color: 0x7B6B5B });
        var cistBox5 = new THREE.BoxGeometry(3, 2.5, 6);
        var cistMesh5 = new THREE.Mesh(cistBox5, cistMaterial5);
        cistMesh5.position.set(-15, 1.5, 25);
        scene.add(cistMesh5);
        objects.push(cistMesh5);

        // Loch shoreline stone marker spheres
        var markerMaterial = new THREE.MeshLambertMaterial({ color: 0x696959 });
        var markerGeom = new THREE.SphereGeometry(1.5, 16, 12);
        var markerMesh1 = new THREE.Mesh(markerGeom, markerMaterial);
        markerMesh1.position.set(30, 0.8, -28);
        scene.add(markerMesh1);
        objects.push(markerMesh1);

        var markerMesh2 = new THREE.Mesh(markerGeom, markerMaterial);
        markerMesh2.position.set(-28, 0.8, 30);
        scene.add(markerMesh2);
        objects.push(markerMesh2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(40, 30, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Subtle rotation and animation for burial mound
        if (objects.length > 3 && objects[3]) {
            objects[3].rotation.y += delta * 0.1;
        }
        // Gentle sway for beacon cairn
        if (objects.length > 10 && objects[10]) {
            objects[10].position.y += Math.sin(Date.now() * 0.001) * 0.02;
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
