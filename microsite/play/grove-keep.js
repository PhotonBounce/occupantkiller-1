window.GroveKeep = (function() {
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
        // Stone altar command table - flat wide box at center
        var altarGeo = new THREE.BoxGeometry(20, 1.5, 15);
        var altarMat = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
        var altarMesh = new THREE.Mesh(altarGeo, altarMat);
        altarMesh.position.set(0, 0.75, 0);
        scene.add(altarMesh);
        objects.push(altarMesh);

        // Ancient standing stone ring - tall thin boxes arranged in circle
        var stoneCount = 12;
        var ringRadius = 25;
        for (var i = 0; i < stoneCount; i++) {
            var angle = (i / stoneCount) * Math.PI * 2;
            var x = Math.cos(angle) * ringRadius;
            var z = Math.sin(angle) * ringRadius;

            var stoneGeo = new THREE.BoxGeometry(2, 8, 1.5);
            var stoneMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
            var stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
            stoneMesh.position.set(x, 4, z);
            stoneMesh.rotation.y = angle;
            scene.add(stoneMesh);
            objects.push(stoneMesh);
        }

        // Wicker man structure repurposed as radio tower - box frame
        var baseGeo = new THREE.BoxGeometry(6, 1, 6);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(-25, 0.5, -25);
        scene.add(baseMesh);
        objects.push(baseMesh);

        // Tower frame pillars
        for (var j = 0; j < 4; j++) {
            var offsets = [[-3, -3], [3, -3], [3, 3], [-3, 3]];
            var pillarGeo = new THREE.BoxGeometry(1, 12, 1);
            var pillarMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
            var pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
            pillarMesh.position.set(-25 + offsets[j][0], 6, -25 + offsets[j][1]);
            scene.add(pillarMesh);
            objects.push(pillarMesh);
        }

        // Wickerwork cross-bracing with LineSegments
        var wickerGeo = new THREE.BufferGeometry();
        var wickerPoints = [
            -28, 7, -28,
            -22, 7, -22,
            -28, 7, -22,
            -22, 7, -28,
            -28, 9, -28,
            -22, 9, -22,
            -28, 9, -22,
            -22, 9, -28,
            -28, 11, -28,
            -22, 11, -22
        ];
        wickerGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wickerPoints), 3));
        var wickerMat = new THREE.LineBasicMaterial({ color: 0xD2B48C });
        var wickerLines = new THREE.LineSegments(wickerGeo, wickerMat);
        scene.add(wickerLines);
        objects.push(wickerLines);

        // Lightning rod array on stone pillars - thin cylinders with sphere tips
        var rodPositions = [[15, -20], [-15, 20], [20, 15], [-20, -15]];
        for (var k = 0; k < rodPositions.length; k++) {
            // Cylinder base
            var rodGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
            var rodMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
            var rodMesh = new THREE.Mesh(rodGeo, rodMat);
            rodMesh.position.set(rodPositions[k][0], 8, rodPositions[k][1]);
            scene.add(rodMesh);
            objects.push(rodMesh);

            // Sphere tip (lightning conductor)
            var tipGeo = new THREE.SphereGeometry(0.5, 8, 8);
            var tipMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
            var tipMesh = new THREE.Mesh(tipGeo, tipMat);
            tipMesh.position.set(rodPositions[k][0], 11.5, rodPositions[k][1]);
            scene.add(tipMesh);
            objects.push(tipMesh);

            // Stone pillar
            var pillarBaseGeo = new THREE.BoxGeometry(2, 6, 2);
            var pillarBaseMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
            var pillarBaseMesh = new THREE.Mesh(pillarBaseGeo, pillarBaseMat);
            pillarBaseMesh.position.set(rodPositions[k][0], 3, rodPositions[k][1]);
            scene.add(pillarBaseMesh);
            objects.push(pillarBaseMesh);
        }

        // Ancient well weapons cache - cylinder well shaft with box coping stones
        var wellShaftGeo = new THREE.CylinderGeometry(3, 3.5, 4, 16);
        var wellMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var wellShaftMesh = new THREE.Mesh(wellShaftGeo, wellMat);
        wellShaftMesh.position.set(25, 2, 25);
        scene.add(wellShaftMesh);
        objects.push(wellShaftMesh);

        // Well rim stones
        for (var m = 0; m < 4; m++) {
            var rimAngle = (m / 4) * Math.PI * 2;
            var rimX = Math.cos(rimAngle) * 3.8;
            var rimZ = Math.sin(rimAngle) * 3.8;
            var rimGeo = new THREE.BoxGeometry(1.5, 0.8, 1.5);
            var rimMat = new THREE.MeshLambertMaterial({ color: 0x7B7B7B });
            var rimMesh = new THREE.Mesh(rimGeo, rimMat);
            rimMesh.position.set(25 + rimX, 4.2, 25 + rimZ);
            scene.add(rimMesh);
            objects.push(rimMesh);
        }

        // Central altar flame cone - symbolic fire
        var flameGeo = new THREE.ConeGeometry(2, 4, 8);
        var flameMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var flameMesh = new THREE.Mesh(flameGeo, flameMat);
        flameMesh.position.set(0, 2.5, 0);
        scene.add(flameMesh);
        objects.push(flameMesh);

        // Guardian spheres at cardinal points
        var guardianPositions = [[0, 30], [30, 0], [0, -30], [-30, 0]];
        for (var n = 0; n < guardianPositions.length; n++) {
            var guardGeo = new THREE.SphereGeometry(1.5, 8, 8);
            var guardMat = new THREE.MeshLambertMaterial({ color: 0x20B2AA });
            var guardMesh = new THREE.Mesh(guardGeo, guardMat);
            guardMesh.position.set(guardianPositions[n][0], 1.5, guardianPositions[n][1]);
            scene.add(guardMesh);
            objects.push(guardMesh);
        }

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Subtle rotation for the sacred flame
        if (objects.length > 6) {
            objects[6].rotation.y += delta * 0.5;
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
