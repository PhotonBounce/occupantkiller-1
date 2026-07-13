window.NellDock = (function() {
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
        // Loch terrain - large box base
        var locGeometry = new THREE.BoxGeometry(80, 4, 60);
        var locMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
        var locMesh = new THREE.Mesh(locGeometry, locMaterial);
        locMesh.position.set(0, -2, 0);
        scene.add(locMesh);
        objects.push(locMesh);

        // LCT hull - box amphibious landing craft
        var lctGeometry = new THREE.BoxGeometry(20, 6, 12);
        var lctMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        var lctMesh = new THREE.Mesh(lctGeometry, lctMaterial);
        lctMesh.position.set(-25, 2, 10);
        scene.add(lctMesh);
        objects.push(lctMesh);

        // LCT ramp section 1
        var ramp1Geometry = new THREE.BoxGeometry(16, 2, 8);
        var rampMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e });
        var ramp1Mesh = new THREE.Mesh(ramp1Geometry, rampMaterial);
        ramp1Mesh.position.set(-25, 5, 22);
        ramp1Mesh.rotation.z = 0.3;
        scene.add(ramp1Mesh);
        objects.push(ramp1Mesh);

        // LCT ramp section 2
        var ramp2Geometry = new THREE.BoxGeometry(16, 2, 8);
        var ramp2Mesh = new THREE.Mesh(ramp2Geometry, rampMaterial);
        ramp2Mesh.position.set(-25, 7, 28);
        ramp2Mesh.rotation.z = 0.4;
        scene.add(ramp2Mesh);
        objects.push(ramp2Mesh);

        // Beach obstacle - box hedgehog 1
        var hedgehog1Geometry = new THREE.BoxGeometry(3, 3, 3);
        var obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var hedgehog1Mesh = new THREE.Mesh(hedgehog1Geometry, obstacleMaterial);
        hedgehog1Mesh.position.set(5, 1, 15);
        hedgehog1Mesh.rotation.set(0.4, 0.5, 0.3);
        scene.add(hedgehog1Mesh);
        objects.push(hedgehog1Mesh);

        // Beach obstacle - box hedgehog 2
        var hedgehog2Geometry = new THREE.BoxGeometry(3, 3, 3);
        var hedgehog2Mesh = new THREE.Mesh(hedgehog2Geometry, obstacleMaterial);
        hedgehog2Mesh.position.set(15, 1, 10);
        hedgehog2Mesh.rotation.set(0.2, 0.8, 0.1);
        scene.add(hedgehog2Mesh);
        objects.push(hedgehog2Mesh);

        // Beach stake - cylinder 1
        var stakeCylinderGeometry = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
        var stakeMaterial = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        var stake1Mesh = new THREE.Mesh(stakeCylinderGeometry, stakeMaterial);
        stake1Mesh.position.set(8, 2, 20);
        scene.add(stake1Mesh);
        objects.push(stake1Mesh);

        // Beach stake - cylinder 2
        var stake2Mesh = new THREE.Mesh(stakeCylinderGeometry, stakeMaterial);
        stake2Mesh.position.set(20, 2, 18);
        scene.add(stake2Mesh);
        objects.push(stake2Mesh);

        // DUKW amphibious vehicle body
        var dukwBodyGeometry = new THREE.BoxGeometry(8, 5, 14);
        var dukwMaterial = new THREE.MeshLambertMaterial({ color: 0x1a472a });
        var dukwBodyMesh = new THREE.Mesh(dukwBodyGeometry, dukwMaterial);
        dukwBodyMesh.position.set(15, 2.5, -15);
        scene.add(dukwBodyMesh);
        objects.push(dukwBodyMesh);

        // DUKW axle hub - cylinder 1
        var hubCylinderGeometry = new THREE.CylinderGeometry(1.2, 1.2, 10, 16);
        var hubMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var hub1Mesh = new THREE.Mesh(hubCylinderGeometry, hubMaterial);
        hub1Mesh.position.set(15, 1, -10);
        hub1Mesh.rotation.z = Math.PI / 2;
        scene.add(hub1Mesh);
        objects.push(hub1Mesh);

        // DUKW axle hub - cylinder 2
        var hub2Mesh = new THREE.Mesh(hubCylinderGeometry, hubMaterial);
        hub2Mesh.position.set(15, 1, -20);
        hub2Mesh.rotation.z = Math.PI / 2;
        scene.add(hub2Mesh);
        objects.push(hub2Mesh);

        // Strongpoint pillbox
        var pillboxGeometry = new THREE.BoxGeometry(10, 6, 10);
        var pillboxMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var pillboxMesh = new THREE.Mesh(pillboxGeometry, pillboxMaterial);
        pillboxMesh.position.set(-30, 3, -20);
        scene.add(pillboxMesh);
        objects.push(pillboxMesh);

        // Ammo bunker
        var bunkerGeometry = new THREE.BoxGeometry(8, 4, 6);
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var bunkerMesh = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
        bunkerMesh.position.set(-22, 2, -25);
        scene.add(bunkerMesh);
        objects.push(bunkerMesh);

        // Underwater SDV bay - box enclosed dock
        var sdvBayGeometry = new THREE.BoxGeometry(14, 8, 18);
        var sdvMaterial = new THREE.MeshLambertMaterial({ color: 0x2a5a6a });
        var sdvBayMesh = new THREE.Mesh(sdvBayGeometry, sdvMaterial);
        sdvBayMesh.position.set(30, 4, -10);
        scene.add(sdvBayMesh);
        objects.push(sdvBayMesh);

        // SDV hull - cylinder
        var sdvHullGeometry = new THREE.CylinderGeometry(2, 2, 12, 16);
        var sdvHullMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a4a });
        var sdvHullMesh = new THREE.Mesh(sdvHullGeometry, sdvHullMaterial);
        sdvHullMesh.position.set(30, 4, -10);
        sdvHullMesh.rotation.z = Math.PI / 2;
        scene.add(sdvHullMesh);
        objects.push(sdvHullMesh);

        // Aerial drop zone marker - cone 1
        var coneMarkerGeometry = new THREE.ConeGeometry(2, 4, 8);
        var coneMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b35 });
        var cone1Mesh = new THREE.Mesh(coneMarkerGeometry, coneMaterial);
        cone1Mesh.position.set(0, 2, 25);
        scene.add(cone1Mesh);
        objects.push(cone1Mesh);

        // Aerial drop zone marker - cone 2
        var cone2Mesh = new THREE.Mesh(coneMarkerGeometry, coneMaterial);
        cone2Mesh.position.set(10, 2, 28);
        scene.add(cone2Mesh);
        objects.push(cone2Mesh);

        // Aerial drop zone marker - cone 3
        var cone3Mesh = new THREE.Mesh(coneMarkerGeometry, coneMaterial);
        cone3Mesh.position.set(-8, 2, 30);
        scene.add(cone3Mesh);
        objects.push(cone3Mesh);

        // Drop path LineSegments
        var dropPathGeometry = new THREE.BufferGeometry();
        var dropPathPoints = new Float32Array([
            0, 2, 25,
            0, 20, 25,
            10, 2, 28,
            10, 20, 28,
            -8, 2, 30,
            -8, 20, 30
        ]);
        dropPathGeometry.setAttribute('position', new THREE.BufferAttribute(dropPathPoints, 3));
        var linesMaterial = new THREE.LineBasicMaterial({ color: 0xff6b35, linewidth: 2 });
        var dropPathLines = new THREE.LineSegments(dropPathGeometry, linesMaterial);
        scene.add(dropPathLines);
        objects.push(dropPathLines);

        // Command radio hut
        var hutGeometry = new THREE.BoxGeometry(10, 6, 8);
        var hutMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var hutMesh = new THREE.Mesh(hutGeometry, hutMaterial);
        hutMesh.position.set(28, 3, 5);
        scene.add(hutMesh);
        objects.push(hutMesh);

        // Antenna mast - cylinder
        var antennaMastGeometry = new THREE.CylinderGeometry(0.5, 0.5, 16, 8);
        var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var antennaMesh = new THREE.Mesh(antennaMastGeometry, antennaMaterial);
        antennaMesh.position.set(28, 10, 5);
        scene.add(antennaMesh);
        objects.push(antennaMesh);

        // Guy wires - LineSegments
        var guyWiresGeometry = new THREE.BufferGeometry();
        var guyWiresPoints = new Float32Array([
            28, 10, 5,
            22, 2, 0,
            28, 10, 5,
            34, 2, 0,
            28, 10, 5,
            28, 2, -2
        ]);
        guyWiresGeometry.setAttribute('position', new THREE.BufferAttribute(guyWiresPoints, 3));
        var guyLinesMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 });
        var guyWiresLines = new THREE.LineSegments(guyWiresGeometry, guyLinesMaterial);
        scene.add(guyWiresLines);
        objects.push(guyWiresLines);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i] && objects[i].rotation) {
                // gentle rotation for some elements
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
