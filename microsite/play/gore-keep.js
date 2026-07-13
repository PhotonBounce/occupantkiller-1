window.GoreKeep = (function() {
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
        var bloodRed = 0x3d0000;
        var darkStone = 0x1a1a1a;
        var rustBrown = 0x4a2020;
        var ironGray = 0x2a2a2a;
        var brightRed = 0x8b0000;

        // Main keep tower - dark blood-red stone
        var keepGeo = new THREE.BoxGeometry(40, 60, 40);
        var keepMat = new THREE.MeshLambertMaterial({ color: bloodRed });
        var keepMesh = new THREE.Mesh(keepGeo, keepMat);
        keepMesh.position.set(0, 30, 0);
        keepMesh.castShadow = true;
        keepMesh.receiveShadow = true;
        scene.add(keepMesh);
        objects.push(keepMesh);

        // Parapets with spikes - cylinder towers at corners
        var parapetheight = 8;
        var parapetradiusTop = 3;
        var parapetradiusBottom = 4;

        var parapetPositions = [
            [-18, 62, -18],
            [18, 62, -18],
            [-18, 62, 18],
            [18, 62, 18]
        ];

        for (var i = 0; i < parapePositions.length; i++) {
            var parGeo = new THREE.CylinderGeometry(parapetradiusTop, parapetradiusBottom, parapetheight, 8);
            var parMat = new THREE.MeshLambertMaterial({ color: darkStone });
            var parMesh = new THREE.Mesh(parGeo, parMat);
            parMesh.position.set(parapePositions[i][0], parapePositions[i][1], parapePositions[i][2]);
            parMesh.castShadow = true;
            parMesh.receiveShadow = true;
            scene.add(parMesh);
            objects.push(parMesh);
        }

        // Spike spires on parapets - cones
        for (var i = 0; i < parapePositions.length; i++) {
            var spikeGeo = new THREE.ConeGeometry(2, 10, 6);
            var spikeMat = new THREE.MeshLambertMaterial({ color: ironGray });
            var spikeMesh = new THREE.Mesh(spikeGeo, spikeMat);
            spikeMesh.position.set(parapePositions[i][0], parapePositions[i][1] + 9, parapePositions[i][2]);
            spikeMesh.castShadow = true;
            spikeMesh.receiveShadow = true;
            scene.add(spikeMesh);
            objects.push(spikeMesh);
        }

        // Battle damage - collapsed wall sections as irregular box clusters
        var damageBoxes = [
            { pos: [25, 15, 0], size: [8, 12, 6] },
            { pos: [28, 5, -5], size: [6, 8, 8] },
            { pos: [26, 8, 5], size: [7, 9, 5] },
            { pos: [-30, 20, -20], size: [10, 14, 7] },
            { pos: [-28, 8, -18], size: [6, 6, 5] },
            { pos: [-32, 12, -22], size: [8, 10, 6] }
        ];

        for (var i = 0; i < damageBoxes.length; i++) {
            var damGeo = new THREE.BoxGeometry(damageBoxes[i].size[0], damageBoxes[i].size[1], damageBoxes[i].size[2]);
            var damMat = new THREE.MeshLambertMaterial({ color: rustBrown });
            var damMesh = new THREE.Mesh(damGeo, damMat);
            damMesh.position.set(damageBoxes[i].pos[0], damageBoxes[i].pos[1], damageBoxes[i].pos[2]);
            damMesh.castShadow = true;
            damMesh.receiveShadow = true;
            scene.add(damMesh);
            objects.push(damMesh);
        }

        // Weapon rack - stacked boxes
        var rackGeo = new THREE.BoxGeometry(12, 2, 8);
        var rackMat = new THREE.MeshLambertMaterial({ color: darkStone });
        var rackMesh1 = new THREE.Mesh(rackGeo, rackMat);
        rackMesh1.position.set(-20, 5, 25);
        rackMesh1.castShadow = true;
        rackMesh1.receiveShadow = true;
        scene.add(rackMesh1);
        objects.push(rackMesh1);

        var rackMesh2 = new THREE.Mesh(rackGeo, rackMat);
        rackMesh2.position.set(-20, 10, 25);
        rackMesh2.castShadow = true;
        rackMesh2.receiveShadow = true;
        scene.add(rackMesh2);
        objects.push(rackMesh2);

        // Torture chamber cage - iron spheres connected with line segments
        var cage1Geo = new THREE.SphereGeometry(1.5, 8, 8);
        var cageMat = new THREE.MeshLambertMaterial({ color: ironGray });
        var cage1Mesh = new THREE.Mesh(cage1Geo, cageMat);
        cage1Mesh.position.set(15, 8, -25);
        cage1Mesh.castShadow = true;
        cage1Mesh.receiveShadow = true;
        scene.add(cage1Mesh);
        objects.push(cage1Mesh);

        var cage2Mesh = new THREE.Mesh(cage1Geo, cageMat);
        cage2Mesh.position.set(22, 8, -25);
        cage2Mesh.castShadow = true;
        cage2Mesh.receiveShadow = true;
        scene.add(cage2Mesh);
        objects.push(cage2Mesh);

        var cage3Mesh = new THREE.Mesh(cage1Geo, cageMat);
        cage3Mesh.position.set(15, 15, -25);
        cage3Mesh.castShadow = true;
        cage3Mesh.receiveShadow = true;
        scene.add(cage3Mesh);
        objects.push(cage3Mesh);

        var cage4Mesh = new THREE.Mesh(cage1Geo, cageMat);
        cage4Mesh.position.set(22, 15, -25);
        cage4Mesh.castShadow = true;
        cage4Mesh.receiveShadow = true;
        scene.add(cage4Mesh);
        objects.push(cage4Mesh);

        // Cage bars - line segments
        var barGeo = new THREE.BufferGeometry();
        var barVertices = new Float32Array([
            15, 8, -25, 22, 8, -25,
            15, 8, -25, 15, 15, -25,
            22, 8, -25, 22, 15, -25,
            15, 15, -25, 22, 15, -25
        ]);
        barGeo.setAttribute('position', new THREE.BufferAttribute(barVertices, 3));
        var barMat = new THREE.LineBasicMaterial({ color: ironGray, linewidth: 3 });
        var barMesh = new THREE.LineSegments(barGeo, barMat);
        scene.add(barMesh);
        objects.push(barMesh);

        // Blood pools - dark red flat boxes scattered around
        var poolGeo = new THREE.BoxGeometry(6, 0.5, 8);
        var poolMat = new THREE.MeshLambertMaterial({ color: brightRed });
        var pool1 = new THREE.Mesh(poolGeo, poolMat);
        pool1.position.set(10, 0.25, 10);
        pool1.castShadow = true;
        pool1.receiveShadow = true;
        scene.add(pool1);
        objects.push(pool1);

        var pool2 = new THREE.Mesh(poolGeo, poolMat);
        pool2.position.set(-15, 0.25, -10);
        pool2.castShadow = true;
        pool2.receiveShadow = true;
        scene.add(pool2);
        objects.push(pool2);

        // Stone pillars inside torture chamber
        var pillarGeo = new THREE.CylinderGeometry(3, 3.5, 25, 6);
        var pillarMat = new THREE.MeshLambertMaterial({ color: darkStone });
        var pillar1 = new THREE.Mesh(pillarGeo, pillarMat);
        pillar1.position.set(5, 12.5, -20);
        pillar1.castShadow = true;
        pillar1.receiveShadow = true;
        scene.add(pillar1);
        objects.push(pillar1);

        // Ambient light - blood-tinted darkness
        var ambientLight = new THREE.AmbientLight(0x4d0000, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Spot light - harsh red light from above
        var spotLight = new THREE.SpotLight(0xff3333, 1.5);
        spotLight.position.set(0, 80, 0);
        spotLight.target.position.set(0, 0, 0);
        spotLight.castShadow = true;
        scene.add(spotLight);
        lights.push(spotLight);
    }

    function update(delta) {
        // Animate flickering blood-light effect
        if (lights.length > 1) {
            var flickerIntensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.3;
            lights[1].intensity = flickerIntensity;
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
