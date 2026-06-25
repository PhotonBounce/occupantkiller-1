window.KnapdalePost = (function() {
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
        var boxMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x7C7C7C });
        var greenMat = new THREE.MeshLambertMaterial({ color: 0x2D5016 });
        var grayMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var redMat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });

        // 1. Crinan canal lock (box)
        var lockGeo = new THREE.BoxGeometry(8, 3, 12);
        var lockMesh = new THREE.Mesh(lockGeo, stoneMat);
        lockMesh.position.set(-25, 0.5, -20);
        scene.add(lockMesh);
        objects.push(lockMesh);

        // 2. Canal bollard (cylinder)
        var bollardGeo = new THREE.CylinderGeometry(0.8, 1, 3, 8);
        var bollardMesh = new THREE.Mesh(bollardGeo, grayMat);
        bollardMesh.position.set(-20, 1.5, -22);
        scene.add(bollardMesh);
        objects.push(bollardMesh);

        // 3. Barge hull (box)
        var bargeGeo = new THREE.BoxGeometry(6, 2, 10);
        var bargeMesh = new THREE.Mesh(bargeGeo, woodMat);
        bargeMesh.position.set(-28, 1, -18);
        scene.add(bargeMesh);
        objects.push(bargeMesh);

        // 4. Moine Mhor hide platform (box)
        var platformGeo = new THREE.BoxGeometry(10, 0.8, 10);
        var platformMesh = new THREE.Mesh(platformGeo, woodMat);
        platformMesh.position.set(15, 4, 10);
        scene.add(platformMesh);
        objects.push(platformMesh);

        // 5. Hide platform support post (cylinder)
        var postGeo = new THREE.CylinderGeometry(0.6, 0.6, 4.5, 8);
        var postMesh = new THREE.Mesh(postGeo, grayMat);
        postMesh.position.set(15, 2.25, 10);
        scene.add(postMesh);
        objects.push(postMesh);

        // 6. Loch Sween ruined tower (box)
        var towerGeo = new THREE.BoxGeometry(4, 8, 4);
        var towerMesh = new THREE.Mesh(towerGeo, stoneMat);
        towerMesh.position.set(5, 4, 25);
        scene.add(towerMesh);
        objects.push(towerMesh);

        // 7. Rocky headland (box)
        var rockyGeo = new THREE.BoxGeometry(12, 2, 8);
        var rockyMesh = new THREE.Mesh(rockyGeo, rockMat);
        rockyMesh.position.set(5, 0.8, 28);
        scene.add(rockyMesh);
        objects.push(rockyMesh);

        // 8. Keills chapel ruin (box)
        var chapelGeo = new THREE.BoxGeometry(7, 5, 9);
        var chapelMesh = new THREE.Mesh(chapelGeo, stoneMat);
        chapelMesh.position.set(-15, 2.5, 18);
        scene.add(chapelMesh);
        objects.push(chapelMesh);

        // 9. Grave marker (cone)
        var graveGeo = new THREE.ConeGeometry(1, 2.5, 6);
        var graveMesh = new THREE.Mesh(graveGeo, redMat);
        graveMesh.position.set(-12, 1.25, 20);
        scene.add(graveMesh);
        objects.push(graveMesh);

        // 10. Another grave marker (cone)
        var grave2Geo = new THREE.ConeGeometry(0.8, 2, 6);
        var grave2Mesh = new THREE.Mesh(grave2Geo, redMat);
        grave2Mesh.position.set(-18, 1, 21);
        scene.add(grave2Mesh);
        objects.push(grave2Mesh);

        // 11. Forest road IED charge (sphere)
        var chargeGeo = new THREE.SphereGeometry(0.9, 16, 16);
        var chargeMesh = new THREE.Mesh(chargeGeo, redMat);
        chargeMesh.position.set(22, 0.3, -5);
        scene.add(chargeMesh);
        objects.push(chargeMesh);

        // 12. Second buried charge (sphere)
        var charge2Geo = new THREE.SphereGeometry(0.8, 16, 16);
        var charge2Mesh = new THREE.Mesh(charge2Geo, redMat);
        charge2Mesh.position.set(26, 0.3, -8);
        scene.add(charge2Mesh);
        objects.push(charge2Mesh);

        // 13. Aerial canopy platform (box)
        var canopyGeo = new THREE.BoxGeometry(8, 0.8, 8);
        var canopyMesh = new THREE.Mesh(canopyGeo, woodMat);
        canopyMesh.position.set(-5, 12, 5);
        scene.add(canopyMesh);
        objects.push(canopyMesh);

        // 14. Tree canopy sphere structure
        var treeCrownGeo = new THREE.SphereGeometry(10, 12, 12);
        var treeCrownMesh = new THREE.Mesh(treeCrownGeo, greenMat);
        treeCrownMesh.position.set(-5, 14, 5);
        scene.add(treeCrownMesh);
        objects.push(treeCrownMesh);

        // 15. Otter survey waterproof hide (box)
        var otterHideGeo = new THREE.BoxGeometry(6, 3, 6);
        var otterHideMesh = new THREE.Mesh(otterHideGeo, grayMat);
        otterHideMesh.position.set(-10, 1.5, -28);
        scene.add(otterHideMesh);
        objects.push(otterHideMesh);

        // 16. Forest dense terrain (box)
        var terrainGeo = new THREE.BoxGeometry(50, 0.5, 50);
        var terrainMesh = new THREE.Mesh(terrainGeo, greenMat);
        terrainMesh.position.set(0, -0.25, 0);
        scene.add(terrainMesh);
        objects.push(terrainMesh);

        // Tripwire LineSegments across forestry track
        var wireGeo = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            20, 0.5, -10,
            28, 0.5, -10
        ]);
        wireGeo.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0x333333 });
        var wireLine = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wireLine);
        objects.push(wireLine);

        // Otter survey sensor lines across burn
        var sensorGeo = new THREE.BufferGeometry();
        var sensorPositions = new Float32Array([
            -10, 0.5, -28,
            -10, 0.5, -20
        ]);
        sensorGeo.setAttribute('position', new THREE.BufferAttribute(sensorPositions, 3));
        var sensorMat = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        var sensorLine = new THREE.LineSegments(sensorGeo, sensorMat);
        scene.add(sensorLine);
        objects.push(sensorLine);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation logic can be added here
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
