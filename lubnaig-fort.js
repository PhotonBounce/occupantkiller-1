window.LubnaigFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Loch shoreline box terrain
        var shoreMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var shoreGeom = new THREE.BoxGeometry(80, 2, 60);
        var shoreMesh = new THREE.Mesh(shoreGeom, shoreMaterial);
        shoreMesh.position.set(0, -1, 0);
        scene.add(shoreMesh);
        objects.push(shoreMesh);

        // Victorian shooting lodge - main building (box)
        var lodgeMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var lodgeGeom = new THREE.BoxGeometry(25, 18, 20);
        var lodgeMesh = new THREE.Mesh(lodgeGeom, lodgeMaterial);
        lodgeMesh.position.set(-20, 9, 10);
        scene.add(lodgeMesh);
        objects.push(lodgeMesh);

        // Chimney tower 1 (cylinder)
        var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var chimneyGeom = new THREE.CylinderGeometry(2.5, 2.5, 12, 16);
        var chimney1 = new THREE.Mesh(chimneyGeom, chimneyMaterial);
        chimney1.position.set(-28, 15, 5);
        scene.add(chimney1);
        objects.push(chimney1);

        // Chimney tower 2 (cylinder)
        var chimney2 = new THREE.Mesh(chimneyGeom, chimneyMaterial);
        chimney2.position.set(-12, 15, 15);
        scene.add(chimney2);
        objects.push(chimney2);

        // Anti-aircraft barge - box hull
        var bargeMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var bargeGeom = new THREE.BoxGeometry(30, 4, 15);
        var bargeMesh = new THREE.Mesh(bargeGeom, bargeMaterial);
        bargeMesh.position.set(25, 2, -20);
        scene.add(bargeMesh);
        objects.push(bargeMesh);

        // Barge gun platform (cylinder)
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var platformGeom = new THREE.CylinderGeometry(4, 4, 1.5, 16);
        var platformMesh = new THREE.Mesh(platformGeom, platformMaterial);
        platformMesh.position.set(25, 6, -20);
        scene.add(platformMesh);
        objects.push(platformMesh);

        // Speedboat dock - box jetty
        var jettyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var jettyGeom = new THREE.BoxGeometry(20, 3, 8);
        var jettyMesh = new THREE.Mesh(jettyGeom, jettyMaterial);
        jettyMesh.position.set(10, 1.5, -10);
        scene.add(jettyMesh);
        objects.push(jettyMesh);

        // Outboard motor (small cylinder)
        var motorMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var motorGeom = new THREE.CylinderGeometry(1, 1.2, 3, 12);
        var motorMesh = new THREE.Mesh(motorGeom, motorMaterial);
        motorMesh.position.set(20, 4, -10);
        scene.add(motorMesh);
        objects.push(motorMesh);

        // Underwater loch defence net - box anchor 1
        var anchorMaterial = new THREE.MeshLambertMaterial({ color: 0x4F4F4F });
        var anchorGeom = new THREE.BoxGeometry(3, 2, 3);
        var anchor1 = new THREE.Mesh(anchorGeom, anchorMaterial);
        anchor1.position.set(0, -0.5, -25);
        scene.add(anchor1);
        objects.push(anchor1);

        // Box anchor 2
        var anchor2 = new THREE.Mesh(anchorGeom, anchorMaterial);
        anchor2.position.set(15, -0.5, -28);
        scene.add(anchor2);
        objects.push(anchor2);

        // Defence net cables (LineSegments)
        var netGeom = new THREE.BufferGeometry();
        var netPoints = [
            new THREE.Vector3(0, -0.5, -25),
            new THREE.Vector3(15, -0.5, -28),
            new THREE.Vector3(15, -0.5, -28),
            new THREE.Vector3(8, -2, -30),
            new THREE.Vector3(8, -2, -30),
            new THREE.Vector3(0, -0.5, -25)
        ];
        netGeom.setFromPoints(netPoints);
        var netMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
        var netLines = new THREE.LineSegments(netGeom, netMaterial);
        scene.add(netLines);
        objects.push(netLines);

        // Cliff-face assault course - box platform 1
        var cliffPlatMaterial = new THREE.MeshLambertMaterial({ color: 0xB0C4DE });
        var cliffPlatGeom = new THREE.BoxGeometry(12, 1.5, 6);
        var cliffPlat1 = new THREE.Mesh(cliffPlatGeom, cliffPlatMaterial);
        cliffPlat1.position.set(-15, 8, 25);
        scene.add(cliffPlat1);
        objects.push(cliffPlat1);

        // Box platform 2
        var cliffPlat2 = new THREE.Mesh(cliffPlatGeom, cliffPlatMaterial);
        cliffPlat2.position.set(-5, 15, 28);
        scene.add(cliffPlat2);
        objects.push(cliffPlat2);

        // Rappelling ropes (LineSegments)
        var ropeGeom = new THREE.BufferGeometry();
        var ropePoints = [
            new THREE.Vector3(-15, 25, 25),
            new THREE.Vector3(-15, 8, 25),
            new THREE.Vector3(-5, 25, 28),
            new THREE.Vector3(-5, 15, 28),
            new THREE.Vector3(-10, 25, 26),
            new THREE.Vector3(-10, 12, 26)
        ];
        ropeGeom.setFromPoints(ropePoints);
        var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xDEB887, linewidth: 2 });
        var ropeLines = new THREE.LineSegments(ropeGeom, ropeMaterial);
        scene.add(ropeLines);
        objects.push(ropeLines);

        // Emergency flare cache - box storage
        var flareMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var flareBoxGeom = new THREE.BoxGeometry(8, 6, 5);
        var flareBox = new THREE.Mesh(flareBoxGeom, flareMaterial);
        flareBox.position.set(5, 3, 20);
        scene.add(flareBox);
        objects.push(flareBox);

        // Cone flares on storage (3x)
        var flareConeGeom = new THREE.ConeGeometry(1.2, 3, 12);
        var flareConeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var flare1 = new THREE.Mesh(flareConeGeom, flareConeMaterial);
        flare1.position.set(2, 9, 19);
        scene.add(flare1);
        objects.push(flare1);

        var flare2 = new THREE.Mesh(flareConeGeom, flareConeMaterial);
        flare2.position.set(5, 9, 21);
        scene.add(flare2);
        objects.push(flare2);

        var flare3 = new THREE.Mesh(flareConeGeom, flareConeMaterial);
        flare3.position.set(8, 9, 20);
        scene.add(flare3);
        objects.push(flare3);

        // Perimeter trip-wire alarm fence - cylinder pole sentinels (3x)
        var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var poleGeom = new THREE.CylinderGeometry(0.8, 0.8, 8, 12);
        var pole1 = new THREE.Mesh(poleGeom, poleMaterial);
        pole1.position.set(-30, 4, -15);
        scene.add(pole1);
        objects.push(pole1);

        var pole2 = new THREE.Mesh(poleGeom, poleMaterial);
        pole2.position.set(30, 4, 5);
        scene.add(pole2);
        objects.push(pole2);

        var pole3 = new THREE.Mesh(poleGeom, poleMaterial);
        pole3.position.set(-20, 4, 30);
        scene.add(pole3);
        objects.push(pole3);

        // Trip-wire cables (LineSegments)
        var wireGeom = new THREE.BufferGeometry();
        var wirePoints = [
            new THREE.Vector3(-30, 4, -15),
            new THREE.Vector3(30, 4, 5),
            new THREE.Vector3(30, 4, 5),
            new THREE.Vector3(-20, 4, 30),
            new THREE.Vector3(-20, 4, 30),
            new THREE.Vector3(-30, 4, -15)
        ];
        wireGeom.setFromPoints(wirePoints);
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 });
        var wireLines = new THREE.LineSegments(wireGeom, wireMaterial);
        scene.add(wireLines);
        objects.push(wireLines);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 30, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation loop - can add animations here if needed
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
